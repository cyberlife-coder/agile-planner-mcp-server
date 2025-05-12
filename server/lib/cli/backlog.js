/**
 * Module de gestion des backlogs pour l'interface CLI
 * @module cli/backlog
 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const { 
  setupTraceLog, 
  appendToTraceLog, 
  startSpinner, 
  stopSpinner, 
  initializeApiClient 
} = require('./utils');

const { generateBacklog, saveRawBacklog } = require('../backlog-generator');
// Utiliser le module de compatibilité qui expose generateMarkdownFiles directement
const markdownGenerator = require('../markdown-generator');

/**
 * Collecte les informations du projet via prompts si nécessaire
 * @param {string} initialName - Nom du projet initial
 * @param {string} initialDescription - Description du projet initiale
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Objet contenant projectName et projectDescription
 */
async function collectProjectInfo(initialName, initialDescription, traceLogPath) {
  let projectName = initialName;
  let projectDescription = initialDescription;

  // Demander le nom du projet s'il n'est pas fourni
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

  // Demander la description du projet si elle n'est pas fournie
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
  
  appendToTraceLog(traceLogPath, `Project Name: ${projectName}, Description: ${projectDescription}`);
  return { projectName, projectDescription };
}

/**
 * Génère un backlog à partir des informations du projet
 * @param {Object} client - Client API
 * @param {string} projectName - Nom du projet
 * @param {string} projectDescription - Description du projet
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Données du backlog généré
 */
async function generateBacklogData(client, projectName, projectDescription, traceLogPath) {
  console.error(chalk.blue('Generating backlog... This may take a minute or two.'));
  console.error(chalk.blue('Calling API to generate backlog...'));
  console.error(chalk.blue('This might take up to 30 seconds'));
  console.error(chalk.blue('Please wait...'));
  console.error(chalk.gray('Tips: Provide more details for a more accurate backlog'));

  const spinner = startSpinner();

  try {
    // Log debug info du client
    console.error(`DEBUG_CLI: Client object type BEFORE calling generateBacklog: ${typeof client}, is client null? ${client === null}`);
    if(client && typeof client === 'object') {
      console.error(`DEBUG_CLI: Client keys: ${Object.keys(client).join(', ')}`);
    } else {
      console.error(`DEBUG_CLI: Client is NOT a valid object.`);
    }

    // Générer le backlog
    const backlogData = await generateBacklog(projectName, projectDescription, client);
    
    stopSpinner(spinner);
    appendToTraceLog(traceLogPath, `Backlog généré: ${JSON.stringify(backlogData)}`);
    console.error(chalk.green(`✓ Backlog for "${projectName}" generated successfully!`));
    
    return backlogData;
  } catch (error) {
    stopSpinner(spinner);
    appendToTraceLog(traceLogPath, `Erreur lors de la génération du backlog: ${error.message}`);
    console.error(chalk.red('Error generating backlog:'), error.message);
    throw error;
  }
}

/**
 * Génère les fichiers Markdown à partir des données de backlog
 * @param {Object} backlogData - Données du backlog généré
 * @param {string} outputPath - Chemin du répertoire de sortie
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} Résultat de la génération
 */
async function generateMarkdownFromBacklog(backlogData, outputPath, traceLogPath) {
  try {
    // Exporter les données brutes du backlog en mode audit (pour tests et audit)
    console.error(chalk.blue(`Writing backlog data to ${outputPath}/backlog-last-dump.json for audit and tests`));
    fs.ensureDirSync(outputPath);
    
    // Utiliser la fonction saveRawBacklog avec l'option auditMode: true
    const backlogDumpPath = await saveRawBacklog(backlogData, outputPath, { auditMode: true });
    
    // Générer les fichiers markdown
    await markdownGenerator.generateMarkdownFiles(backlogData, outputPath);
    
    const result = { 
      success: true, 
      outputPath,
      backlogDumpPath,
      backlogData
    };
    
    appendToTraceLog(traceLogPath, `Markdown générés avec succès`);
    console.error(chalk.green('\n✓ All markdown files generated successfully!'));
    console.error(chalk.blue(`\nYou can find your backlog in: ${outputPath}`));
    
    return result;
  } catch (error) {
    appendToTraceLog(traceLogPath, `Erreur lors de la génération des fichiers markdown: ${error.message}`);
    console.error(chalk.red('Error generating markdown files:'), error);
    return { success: false, error: error.message || 'Unknown error during markdown generation' };
  }
}

/**
 * Generate a backlog using CLI
 * @param {string} pName - Project Name (passed from yargs or inquirer)
 * @param {string} pDesc - Project Description (passed from yargs or inquirer)
 * @param {Object} options - { outputPath }
 * @returns {Promise<Object>} - Result object
 */
async function generateBacklogCLI(pName, pDesc, options = {}) {
  // 1. Configuration du journal de trace
  const traceLogPath = setupTraceLog('generateBacklogCLI', pName, pDesc, options);
  const outputPath = options.outputPath;

  try {
    // 2. Initialisation ou récupération du client API
    let client;
    if (options.client) {
      // Utiliser le client transmis (mode MCP ou CLI interactif)
      client = options.client;
      appendToTraceLog(traceLogPath, `Client API fourni via options: OK`);
    } else {
      // Initialiser un nouveau client (mode CLI non-interactif via yargs)
      const clientResult = await initializeApiClient(traceLogPath);
      if (!clientResult.success) return clientResult;
      client = clientResult.client;
    }

    // 3. Collecte des informations du projet
    const { projectName, projectDescription } = await collectProjectInfo(pName, pDesc, traceLogPath);
    
    // 4. Génération du backlog
    const backlogData = await generateBacklogData(client, projectName, projectDescription, traceLogPath);
    
    // 5. Génération des fichiers Markdown
    const effectiveOutputPath = outputPath || path.join(process.cwd(), '.agile-planner-backlog');
    return generateMarkdownFromBacklog(backlogData, effectiveOutputPath, traceLogPath);
  } catch (error) {
    appendToTraceLog(traceLogPath, `Erreur dans generateBacklogCLI: ${error.message}`);
    console.error(chalk.red('Error in backlog generation:'), error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

module.exports = {
  generateBacklogCLI,
  collectProjectInfo,
  generateBacklogData,
  generateMarkdownFromBacklog
};
