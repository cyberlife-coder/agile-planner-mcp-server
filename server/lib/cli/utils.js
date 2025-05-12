/**
 * Utilitaires partagés pour l'interface CLI
 * @module cli/utils
 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

/**
 * Configure un journal de trace pour les opérations CLI
 * @param {string} operation - Nom de l'opération en cours
 * @param {...any} args - Arguments à journaliser
 * @returns {string} - Chemin du fichier de trace
 */
function setupTraceLog(operation, ...args) {
  const traceLogPath = path.join(process.cwd(), '.agile-planner-backlog', 'trace-mcp-cli.log');
  fs.ensureDirSync(path.dirname(traceLogPath));
  
  // Log l'opération
  fs.appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] Entrée dans ${operation}\n`);
  
  // Log les arguments si présents
  if (args.length > 0) {
    const argsString = args.map((arg, index) => `arg${index}: ${JSON.stringify(arg)}`).join(', ');
    fs.appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] ${argsString}\n`);
  }
  
  return traceLogPath;
}

/**
 * Ajoute une entrée au journal de trace
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @param {string} message - Message à journaliser
 */
function appendToTraceLog(traceLogPath, message) {
  fs.appendFileSync(traceLogPath, `[${new Date().toISOString()}] [MCP-CLI] ${message}\n`);
}

/**
 * Démarre un spinner d'activité dans la console
 * @returns {Object} Spinner (non utilisé actuellement, mais prévu pour des améliorations futures)
 */
function startSpinner() {
  // NOTE: Le spinner est actuellement simulé mais pourrait être implémenté avec ora dans une version future
  console.error(chalk.blue('⏳ Processing... Please wait...'));
  return null;
}

/**
 * Arrête un spinner d'activité dans la console
 * @param {Object} _spinner - Spinner à arrêter (non utilisé actuellement)
 */
function stopSpinner(_spinner) {
  // NOTE: Le spinner est actuellement simulé mais pourrait être implémenté avec ora dans une version future
  // Aucune action n'est nécessaire pour le moment
}

/**
 * Formate une valeur pour l'affichage sécurisé dans les logs
 * Évite le problème de stringification par défaut '[object Object]'
 * @param {any} value - Valeur à formater
 * @returns {string} Représentation formatée de la valeur
 */
function formatValue(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  
  try {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  } catch (error) {
    // Gestion explicite de l'erreur: fournir une valeur de secours en cas d'échec de formatage
    console.error(`Erreur lors du formatage de la valeur de type ${typeof value}:`, error);
    return `[Non formaté: ${typeof value}]`;
  }
}

/**
 * Create a .env file with API keys
 * @returns {Promise<void>}
 */
async function createEnvFile() {
  console.error(chalk.blue('Creating a new .env file...'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'openaiKey',
      message: 'Enter your OpenAI API key (leave empty to skip):',
    },
    {
      type: 'input',
      name: 'groqKey',
      message: 'Enter your GROQ API key (leave empty to skip):',
    }
  ]);
  
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (answers.openaiKey) {
    envContent += `OPENAI_API_KEY=${answers.openaiKey}\n`;
  }
  
  if (answers.groqKey) {
    envContent += `GROQ_API_KEY=${answers.groqKey}\n`;
  }
  
  if (!envContent) {
    console.error(chalk.yellow('⚠️ No API keys provided. The .env file will be created but empty.'));
    envContent = '# Add your API keys here:\n# OPENAI_API_KEY=your_key_here\n# GROQ_API_KEY=your_key_here\n';
  }
  
  fs.writeFileSync(envPath, envContent);
  console.error(chalk.green(`✓ .env file created at ${envPath}`));
}

/**
 * Vérifie la disponibilité de la clé API et propose de créer un fichier .env si nécessaire
 * @returns {Promise<boolean>} True si une clé est disponible, false sinon
 */
async function checkAndHandleApiKey() {
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
      console.error(chalk.green('Please restart the CLI with your new API key.'));
    }
    
    return false;
  }
  
  return true;
}

/**
 * Initialise un client API pour générer le backlog ou des features
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Client API ou objet d'erreur
 */
async function initializeApiClient(traceLogPath) {
  try {
    const { initializeClient } = require('../backlog-generator');
    const client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    if (!client) {
      throw new Error("API Client failed to initialize. Check API keys.");
    }
    appendToTraceLog(traceLogPath, `Client API initialisé: OK`);
    return { success: true, client };
  } catch (error) {
    console.error(chalk.red('Failed to initialize API client:'), error);
    console.error(chalk.yellow('Please ensure OPENAI_API_KEY or GROQ_API_KEY is set in your .env file.'));
    await createEnvFile(); // Offer to create .env if client setup fails
    console.error(chalk.green('Please restart the command with your API key configured.'));
    appendToTraceLog(traceLogPath, `ERREUR d'initialisation du client API - Sortie prématurée`);
    return { success: false, error: "API Client failed to initialize" };
  }
}

module.exports = {
  setupTraceLog,
  appendToTraceLog,
  startSpinner,
  stopSpinner,
  formatValue,
  createEnvFile,
  initializeApiClient,
  checkAndHandleApiKey
};
