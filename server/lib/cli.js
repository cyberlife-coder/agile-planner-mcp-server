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
 * @param {Object} client - API client
 */
async function generateBacklogCLI(client) {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      validate: input => input ? true : 'Project name is required'
    }
  ]);
  
  try {
    console.log(chalk.blue('Now, please describe your project in detail...'));
    
    // Get project description with better UX
    const description = await inquirer.prompt([
      {
        type: 'editor',
        name: 'projectDescription',
        message: 'Enter a detailed project description:',
      }
    ]);
    
    // Show generating indicator
    console.log(chalk.blue('Generating backlog... This may take a minute or two.'));
    
    // Save to project-specific directory if requested
    if (answers.projectName) {
      const projectDir = `./${answers.projectName.toLowerCase().replace(/[^a-z0-9]/gi, '-')}`;
      fs.ensureDirSync(projectDir);
    }
    
    console.log(chalk.blue('Calling API to generate backlog...'));
    console.log(chalk.blue('This might take up to 30 seconds'));
    console.log(chalk.blue('Please wait...'));
    console.log(chalk.yellow('Tips: Provide more details for a more accurate backlog'));
    
    const spinner = startSpinner();
    
    try {
      // Generate backlog
      const backlog = await generateBacklog(description.projectDescription, client);
      
      // Stop spinner
      stopSpinner(spinner);
      console.log(chalk.green('✓ Backlog generated successfully!'));
      
      // Generate files
      await generateMarkdownFiles(backlog, process.cwd());
      
    } catch (error) {
      // Stop spinner in case of error
      stopSpinner(spinner);
      console.error(chalk.red('Error generating backlog:'), error);
    }
    
  } catch (error) {
    console.error(chalk.red('Error during execution:'), error);
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
  startCLI
};
