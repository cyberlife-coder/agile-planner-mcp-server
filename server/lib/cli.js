const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { initializeClient, generateBacklog } = require('./backlog-generator');
const { generateMarkdownFiles } = require('./markdown-generator');

/**
 * Start the CLI interface
 */
async function startCLI() {
  console.log(chalk.blue('Welcome to the Agile Planner CLI'));
  console.log(chalk.blue('This tool will help you generate a complete agile backlog from a project description'));
  
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;

  if (!apiKey) {
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
    
    // Initialize the API client
    const client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    
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
    
    const spinner = ['|', '/', '-', '\\'];
    let i = 0;
    
    const interval = setInterval(() => {
      const spin = spinner[i++ % spinner.length];
      process.stdout.write(`\r${chalk.blue('Generating')} ${spin}`);
    }, 80);
    
    try {
      // Generate backlog
      const backlog = await generateBacklog(description.projectDescription, client);
      
      // Stop spinner
      clearInterval(interval);
      console.log('\n');
      console.log(chalk.green('✓ Backlog generated successfully!'));
      
      // Generate files
      await generateMarkdownFiles(backlog, process.cwd());
      
    } catch (error) {
      // Stop spinner in case of error
      clearInterval(interval);
      console.log('\n');
      console.error(chalk.red('Error generating backlog:'), error);
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

module.exports = {
  startCLI
};
