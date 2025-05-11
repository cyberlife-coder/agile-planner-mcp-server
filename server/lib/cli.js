const dotenvResult = require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
if (dotenvResult.error) {
  console.error('DEBUG: Error loading .env file in cli.js:', dotenvResult.error);
} else {
  // Avoid logging full .env content, check for specific keys instead
  let parsedKeysMessage = 'DEBUG: Parsed .env content in cli.js: ';
  if (dotenvResult.parsed) {
    const keys = Object.keys(dotenvResult.parsed);
    parsedKeysMessage += `Keys found: ${keys.join(', ')}. `;
    if (dotenvResult.parsed.OPENAI_API_KEY) {
      parsedKeysMessage += 'OPENAI_API_KEY is present. ';
    }
    if (dotenvResult.parsed.GROQ_API_KEY) {
      parsedKeysMessage += 'GROQ_API_KEY is present. ';
    }
  } else {
    parsedKeysMessage += 'No .env content parsed.';
  }
  console.log(parsedKeysMessage);
}

// Mask API keys when logging directly from process.env
const maskKey = (key) => key ? `${key.substring(0, 3)}...${key.substring(key.length - 4)} (masked)` : undefined;

console.log('DEBUG: OPENAI_API_KEY from process.env after dotenv in cli.js:', process.env.OPENAI_API_KEY ? 'OPENAI_API_KEY is present (masked)' : 'OPENAI_API_KEY is NOT present');
console.log('DEBUG: GROQ_API_KEY from process.env after dotenv in cli.js:', process.env.GROQ_API_KEY ? 'GROQ_API_KEY is present (masked)' : 'GROQ_API_KEY is NOT present');

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { initializeClient, generateBacklog } = require('./backlog-generator');
const { generateFeature } = require('./feature-generator');
const { generateMarkdownFiles } = require('./markdown-generator');
const { generateFeatureMarkdown } = require('./markdown-generator');

/**
 * Start the CLI interface
 * @param {Object} clientAPI - Initialized API client (OpenAI or Groq)
 */
async function startCLI(clientAPI) {
  console.log(chalk.blue('Welcome to the Agile Planner CLI'));
  console.log(chalk.blue('This tool will help you generate agile artifacts for your project'));
  
  // Initialize API client if not provided
  let client = clientAPI;
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey && !client) {
    console.error(chalk.red('Error: No API key provided. Please create a .env file with your API key.'));
    
    const keyQuestion = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Do you want to create a .env file now?',
        choices: [
          { name: 'Yes, create .env file', value: 'create' },
          { name: 'No, exit', value: 'exit' }
        ]
      }
    ]);
    
    if (keyQuestion.action === 'create') {
      await createEnvFile();
      console.log(chalk.green('Please restart the CLI with your new API key.'));
      return;
    } else {
      return;
    }
  }
  
  // Initialize the API client if not provided
  if (!client) {
    try {
      const { initializeClient } = require('./backlog-generator');
      client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    } catch (error) {
      console.error(chalk.red('Failed to initialize API client:'), error);
      return;
    }
  }
  
  // Ask what the user wants to generate
  const actionAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to generate?',
      choices: [
        { name: 'Complete Backlog (Project level)', value: 'backlog' },
        { name: 'Feature with User Stories (Feature level)', value: 'feature' }
      ]
    }
  ]);
  
  if (actionAnswer.action === 'backlog') {
    await generateBacklogCLI(client);
  } else if (actionAnswer.action === 'feature') {
    await generateFeatureCLI(client);
  }
}

/**
 * Generate a backlog using CLI
 * @param {string} pName - Project Name (passed from yargs or inquirer)
 * @param {string} pDesc - Project Description (passed from yargs or inquirer)
 * @param {Object} options - { outputPath }
 */
async function generateBacklogCLI(pName, pDesc, options = {}) {
  const traceLogPath = require('path').join(process.cwd(), '.agile-planner-backlog', 'trace-mcp-cli.log');
  require('fs-extra').ensureDirSync(require('path').dirname(traceLogPath));
  require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Entrée dans generateBacklogCLI\n`);
  require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] pName: ${pName}, pDesc: ${pDesc}, options: ${JSON.stringify(options)}\n`);

  let projectName = pName;
  let projectDescription = pDesc;
  const outputPath = options.outputPath; // outputPath now comes from the third 'options' parameter

  try {
    // Initialize API client
    // This assumes initializeClient is available in this scope and works as intended
    // It might need to be called with API keys from process.env if not already configured globally
    let client;
    try {
      client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
      if (!client) {
        throw new Error("API Client failed to initialize. Check API keys.");
      }
    } catch (error) {
      console.error(chalk.red('Failed to initialize API client:'), error);
      console.error(chalk.yellow('Please ensure OPENAI_API_KEY or GROQ_API_KEY is set in your .env file.'));
      await createEnvFile(); // Offer to create .env if client setup fails
      console.log(chalk.green('Please restart the command with your API key configured.'));
      return; // Exit if client cannot be initialized
    }

    require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Client API initialisé: ${client ? 'OK' : 'ERREUR'}\n`);

    // If projectName or projectDescription are not provided, prompt the user
    if (!projectName) {
      const nameAnswer = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Enter the project name:',
          validate: input => input ? true : 'Project name cannot be empty'
        }
      ]);
      projectName = nameAnswer.projectName;
    }

    if (!projectDescription) {
      const descriptionAnswer = await inquirer.prompt([
        {
          type: 'editor', // Using 'editor' for potentially longer descriptions
          name: 'projectDescription',
          message: 'Enter a detailed project description:',
          validate: input => input && input.length > 10 ? true : 'Please provide a detailed project description (at least 10 characters)'
        }
      ]);
      projectDescription = descriptionAnswer.projectDescription;
    }
    
    require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Project Name: ${projectName}, Description: ${projectDescription}\n`);

    console.log(chalk.blue('Generating backlog... This may take a minute or two.'));
    console.log(chalk.blue('Calling API to generate backlog...'));
    console.log(chalk.blue('This might take up to 30 seconds'));
    console.log(chalk.blue('Please wait...'));
    console.log(chalk.gray('Tips: Provide more details for a more accurate backlog'));

    const spinner = startSpinner();

    try {
      // Log the client object type being passed
      console.log(`DEBUG_CLI: Client object type BEFORE calling generateBacklog: ${typeof client}, is client null? ${client === null}`);
      if(client && typeof client === 'object') {
        console.log(`DEBUG_CLI: Client keys: ${Object.keys(client).join(', ')}`);
      } else {
        console.log(`DEBUG_CLI: Client is NOT a valid object.`);
      }


      // Call generateBacklog with the actual client object
      const backlogData = await generateBacklog(projectName, projectDescription, client);
      
      stopSpinner(spinner);
      require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Backlog généré: ${JSON.stringify(backlogData)}\n`);
      console.log(chalk.green(`✓ Backlog for "${projectName}" generated successfully!`));
      
      // Generate markdown files
      // The outputPath for generateMarkdownFiles should be the final intended directory.
      // If options.outputPath is undefined, it will default inside generateMarkdownFiles or use process.cwd()
      const effectiveOutputPath = outputPath || path.join(process.cwd(), '.agile-planner-backlog');
      await generateMarkdownFiles(backlogData, effectiveOutputPath, projectName);
      
      require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Fichiers Markdown générés dans ${effectiveOutputPath}\n`);
      console.log(chalk.green(`✓ Markdown files generated in ${effectiveOutputPath}`));
      
    } catch (error) {
      stopSpinner(spinner);
      console.error(chalk.red('Error generating backlog:'), error);
      require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] ERREUR generateBacklog: ${error}\n`);
      // No need to throw error here as it's already logged. Let the function complete if possible.
    }
  } catch (error) {
    console.error(chalk.red('Error during CLI execution:'), error);
    require('fs').appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] ERREUR globale generateBacklogCLI: ${error}\n`);
  }
}

/**
 * Generate a feature with user stories using CLI
 * @param {Object} client - API client
 */
async function generateFeatureCLI(client) {
  try {
    const answers = await inquirer.prompt([
      {
        type: 'editor',
        name: 'featureDescription',
        message: 'Describe the feature you want to generate:',
        validate: input => input && input.length > 10 ? true : 'Please provide a detailed feature description (at least 10 characters)'
      },
      {
        type: 'input',
        name: 'businessValue',
        message: 'What business value does this feature provide? (optional)',
      },
      {
        type: 'number',
        name: 'storyCount',
        message: 'How many user stories should be generated?',
        default: 3,
        validate: input => input >= 3 ? true : 'The minimum number of user stories is 3'
      },
      {
        type: 'input',
        name: 'iterationName',
        message: 'Name of the iteration or "next" for the next one:',
        default: 'next'
      }
    ]);
    
    console.log(chalk.blue(`Generating feature with ${answers.storyCount} user stories...`));
    console.log(chalk.blue('This might take up to 30 seconds'));
    console.log(chalk.blue('Please wait...'));

    const spinner = startSpinner();
    
    try {
      // Generate feature
      const featureResult = await generateFeature({
        featureDescription: answers.featureDescription,
        businessValue: answers.businessValue,
        storyCount: answers.storyCount,
        iterationName: answers.iterationName
      }, client);
      
      // Stop spinner
      stopSpinner(spinner);
      console.log(chalk.green(`✓ Feature "${featureResult.feature.title}" generated successfully!`));
      
      // Generate files
      await generateFeatureMarkdown(featureResult, process.cwd());
      
      console.log(chalk.green('✓ Markdown files generated in .agile-planner-backlog/'));
      console.log(chalk.green(`✓ ${featureResult.userStories.length} user stories created`));
      
    } catch (error) {
      // Stop spinner in case of error
      stopSpinner(spinner);
      console.error(chalk.red('Error generating feature:'), error);
    }
  } catch (error) {
    console.error(chalk.red('Error during execution:'), error);
  }
}

/**
 * Create a .env file with API keys
 */
async function createEnvFile() {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'apiType',
      message: 'Which API do you want to use?',
      choices: [
        { name: 'OpenAI (recommended)', value: 'openai' },
        { name: 'GROQ (alternative)', value: 'groq' }
      ]
    },
    {
      type: 'password',
      name: 'apiKey',
      message: ({ apiType }) => `Enter your ${apiType === 'openai' ? 'OpenAI' : 'GROQ'} API key:`,
      validate: input => input ? true : 'API key is required'
    }
  ]);
  
  const envContent = answers.apiType === 'openai' ? 
    `OPENAI_API_KEY=${answers.apiKey}\n# GROQ_API_KEY=your_groq_api_key_here` : 
    `GROQ_API_KEY=${answers.apiKey}\n# OPENAI_API_KEY=your_openai_api_key_here`;
  
  const envPath = path.join(process.cwd(), '.env');

  await fs.writeFile(envPath, envContent, 'utf8');
  console.log(chalk.green('✓ .env file created successfully'));
}

/**
 * Start a CLI spinner
 * @returns {Object} interval ID
 */
function startSpinner() {
  const spinner = ['|', '/', '-', '\\'];
  let i = 0;
  
  return setInterval(() => {
    const spin = spinner[i++ % spinner.length];
    process.stdout.write(`\r${chalk.blue('Generating')} ${spin}`);
  }, 80);
}

/**
 * Stop a CLI spinner
 * @param {Object} interval - interval ID
 */
function stopSpinner(interval) {
  clearInterval(interval);
  console.log('\n');
}

module.exports = {
  startCLI,
  generateBacklogCLI,
  generateFeatureCLI
};
