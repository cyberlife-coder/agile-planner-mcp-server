/**
 * Point d'entrée principal pour l'interface CLI
 * @module cli
 */

'use strict';

const inquirer = require('inquirer');
const chalk = require('chalk');
// fs est importé dans les sous-modules mais pas utilisé ici

// Import des sous-modules
const utils = require('./utils');
const backlog = require('./backlog');
const feature = require('./feature');

/**
 * Démarre l'interface CLI interactive
 * @param {Object} clientAPI - API client initialisé (OpenAI ou Groq)
 * @returns {Promise<void>}
 */
async function startCLI(clientAPI) {
  console.error(chalk.blue('Welcome to the Agile Planner CLI'));
  console.error(chalk.blue('This tool will help you generate agile artifacts for your project'));
  
  // Vérifier la disponibilité de la clé API
  if (!clientAPI && !(await utils.checkAndHandleApiKey())) {
    return; // Sortie si pas de clé API et l'utilisateur a choisi de ne pas en créer
  }
  
  // Initialiser le client API
  const clientResult = await utils.initializeApiClient();
  if (!clientResult?.success) {
    console.error(chalk.red('Could not initialize API client. Please check your API keys.'));
    return;
  }
  
  // Afficher le menu principal
  await showMainMenu(clientResult.client);
}

/**
 * Affiche le menu principal et traite le choix de l'utilisateur
 * @param {Object} client - Client API initialisé (transmis aux générateurs)
 */
async function showMainMenu(client) {
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
  
  // Préparer les options avec le client API pour éviter une réinitialisation inutile
  const options = { client };
  
  if (actionAnswer.action === 'backlog') {
    await backlog.generateBacklogCLI(null, null, options);
  } else if (actionAnswer.action === 'feature') {
    await feature.generateFeatureCLI(null, null, options);
  }
}

/**
 * Démarre un CLI interactif
 * @returns {Promise<void>}
 */
async function runInteractiveCLI() {
  try {
    await startCLI();
  } catch (error) {
    console.error(chalk.red('Error running interactive CLI:'), error);
    process.exit(1);
  }
}

// IMPORTANT: Exporter les fonctions requises pour server/index.js
// Ces exports sont critiques pour le routage CLI non-interactif (utilisé par les tests et la CLI automatisée)
// Ne pas modifier cette structure d'export sans mise à jour correspondante dans index.js
module.exports = {
  startCLI,
  runInteractiveCLI,
  // Ces exports directs sont nécessaires pour la rétro-compatibilité
  generateBacklogCLI: backlog.generateBacklogCLI,
  generateFeatureCLI: feature.generateFeatureCLI,
  // Export des sous-modules pour accès complet si nécessaire
  utils,
  backlog,
  feature
};
