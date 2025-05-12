/**
 * Module de gestion des features pour l'interface CLI
 * @module cli/feature
 */

'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

const { 
  setupTraceLog, 
  appendToTraceLog,
  formatValue, 
  startSpinner, 
  stopSpinner, 
  initializeApiClient 
} = require('./utils');

const { generateFeature } = require('../feature-generator');
const { generateFeatureMarkdown } = require('../markdown-generator');

/**
 * Définit les prompts pour la collecte d'informations de feature
 * @returns {Array} Tableau de définitions de prompts pour inquirer
 */
function getFeaturePrompts() {
  return [
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
  ];
}

/**
 * Affiche les informations de début de génération de feature
 * @param {Object} info - Informations sur la feature
 */
function displayFeatureGenerationInfo(info) {
  const { epicTitle, featureDescription, storyCount } = info;
  
  if (storyCount) {
    console.error(chalk.blue(`Generating feature with ${storyCount} user stories...`));
    console.error(chalk.blue('This might take up to 30 seconds'));
    console.error(chalk.blue('Please wait...'));
  } else {
    console.error(chalk.blue(`Generating feature from command arguments...`));
    console.error(chalk.blue(`Epic: ${formatValue(epicTitle)}`));
    console.error(chalk.blue(`Feature description: ${typeof featureDescription === 'string' ? featureDescription.substring(0, 50) + '...' : formatValue(featureDescription)}`));
  }
}

/**
 * Collecte les informations de feature via prompts si nécessaire
 * @param {string} initialEpicName - Nom de l'epic initial
 * @param {string} initialFeatureDesc - Description de la feature initiale
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Objet contenant les informations de la feature
 */
async function collectFeatureInfo(initialEpicName, initialFeatureDesc, traceLogPath) {
  let epicTitle = initialEpicName;
  let featureDescription = initialFeatureDesc;
  let businessValue = 'Generated via CLI';
  let storyCount = 3;
  let iterationName = 'next';

  // Si la description de feature n'est pas fournie, demander les détails
  if (!featureDescription) {
    const answers = await inquirer.prompt(getFeaturePrompts());
    
    // Utiliser les réponses de l'invite interactive
    featureDescription = answers.featureDescription;
    epicTitle = epicTitle || 'Default Epic';
    businessValue = answers.businessValue || businessValue;
    storyCount = answers.storyCount || storyCount;
    iterationName = answers.iterationName || iterationName;
    
    displayFeatureGenerationInfo({ epicTitle, featureDescription, storyCount });
  } else {
    displayFeatureGenerationInfo({ epicTitle, featureDescription });
  }

  appendToTraceLog(traceLogPath, `Feature info: Epic=${epicTitle}, Description=${featureDescription}, Stories=${storyCount}`);
  
  return { epicTitle, featureDescription, businessValue, storyCount, iterationName };
}

/**
 * Génère une feature à partir des paramètres fournis
 * @param {Object} featureParams - Paramètres de la feature à générer
 * @param {Object} client - Client API
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Résultat de la génération
 */
async function generateFeatureData(featureParams, client, traceLogPath) {
  const spinner = startSpinner();
  
  try {
    // Générer la feature
    const featureResult = await generateFeature(featureParams, client);
    
    stopSpinner(spinner);
    appendToTraceLog(traceLogPath, `Feature générée avec succès: ${featureResult.feature.title}`);
    console.error(chalk.green(`✓ Feature "${featureResult.feature.title}" generated successfully!`));
    
    return featureResult;
  } catch (error) {
    stopSpinner(spinner);
    appendToTraceLog(traceLogPath, `Erreur lors de la génération de la feature: ${error.message}`);
    console.error(chalk.red('Error generating feature:'), error);
    throw error;
  }
}

/**
 * Génère les fichiers Markdown pour une feature
 * @param {Object} featureResult - Résultat de la génération de feature
 * @param {string} outputPath - Chemin de sortie
 * @param {string} traceLogPath - Chemin du fichier de trace
 * @returns {Promise<Object>} - Résultat de la génération
 */
async function generateFeatureFiles(featureResult, outputPath, traceLogPath) {
  try {
    // Exporter les données brutes de la feature
    const featureDumpPath = path.join(outputPath, 'feature-last-dump.json');
    console.error(chalk.blue(`Writing feature data to ${featureDumpPath} for audit and tests`));
    fs.ensureDirSync(outputPath);
    fs.writeJSONSync(featureDumpPath, featureResult, { spaces: 2 });
    
    // Générer les fichiers markdown
    await generateFeatureMarkdown(featureResult, outputPath);
    
    appendToTraceLog(traceLogPath, `Fichiers markdown générés avec succès dans ${outputPath}`);
    console.error(chalk.green('\n✓ All markdown files generated successfully!'));
    console.error(chalk.blue(`\nYou can find your generated feature files in: ${outputPath}`));
    console.error(chalk.green(`✓ ${featureResult.userStories.length} user stories created`));
    
    return {
      success: true,
      featureResult,
      outputPath,
      featureDumpPath
    };
  } catch (error) {
    appendToTraceLog(traceLogPath, `Erreur lors de la génération des fichiers: ${error.message}`);
    console.error(chalk.red('Error generating markdown files:'), error);
    return { success: false, error: error.message || 'Unknown error during file generation' };
  }
}

/**
 * Generate a feature with user stories using CLI
 * @param {string} epicName - Name of the epic (passed from yargs or inquirer)
 * @param {string} featureDesc - Feature description (passed from yargs or inquirer)
 * @param {Object} options - { outputPath }
 * @returns {Promise<Object>} - Result object with success/error status
 */
async function generateFeatureCLI(epicName, featureDesc, options = {}) {
  // 1. Configuration du journal de trace
  const traceLogPath = setupTraceLog('generateFeatureCLI', epicName, featureDesc, options);
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

    // 3. Collecte des informations de la feature
    const featureInfo = await collectFeatureInfo(epicName, featureDesc, traceLogPath);
    
    // 4. Génération de la feature
    const featureParams = {
      featureDescription: featureInfo.featureDescription,
      businessValue: featureInfo.businessValue,
      storyCount: featureInfo.storyCount,
      iterationName: featureInfo.iterationName,
      epicName: featureInfo.epicTitle
    };
    const featureResult = await generateFeatureData(featureParams, client, traceLogPath);
    
    // 5. Génération des fichiers markdown
    const effectiveOutputPath = outputPath || path.join(process.cwd(), '.agile-planner-backlog');
    return generateFeatureFiles(featureResult, effectiveOutputPath, traceLogPath);
  } catch (error) {
    appendToTraceLog(traceLogPath, `Erreur dans generateFeatureCLI: ${error.message}`);
    console.error(chalk.red('Error during feature CLI execution:'), error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

module.exports = {
  generateFeatureCLI,
  collectFeatureInfo,
  generateFeatureData,
  generateFeatureFiles
};
