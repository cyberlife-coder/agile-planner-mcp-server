/**
 * Module de compatibilité pour la génération de fichiers markdown
 * Redirige vers la nouvelle architecture modulaire
 * @module markdown-generator
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

console.log(chalk.yellow('🔍 Chargement du module markdown-generator.js de compatibilité'));

// Importer le nouveau module façade
const { 
  generateMarkdownFilesFromResult,
  formatUserStory,
  createMarkdownGenerator
} = require('./markdown/index');

console.log(chalk.green('✅ Module façade importé avec succès'));

/**
 * Génère les fichiers markdown pour une feature
 * @param {Object} feature - La feature à formater
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} - Résultat de la génération
 */
const generateFeatureMarkdown = async (feature, outputDir) => {
  console.log(chalk.blue('🔠 Generating feature markdown using refactored architecture...'));
  
  // Accéder correctement à la structure de données
  const featureData = feature.feature || feature;
  const title = featureData.title || 'Feature sans titre';
  const description = featureData.description || '';
  
  console.log(chalk.yellow(`Feature reçue: "${title}"`));
  console.log(chalk.yellow(`Répertoire de sortie: ${outputDir}`));
  
  // Adapter l'appel à la nouvelle architecture
  const result = {
    project: { title: title, description: description },
    epics: [{
      title: 'Feature Epic',
      description: description,
      features: [featureData]
    }]
  };
  
  console.log(chalk.yellow(`Structure adaptée créée pour la feature "${title}"`));
  
  try {
    const genResult = await generateMarkdownFilesFromResult(result, outputDir);
    console.log(chalk.green(`✅ Markdown généré avec succès dans ${outputDir}`));
    return genResult;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération du markdown: ${error.message}`));
    console.error(chalk.red(error.stack));
    throw error;
  }
};

/**
 * Détermine la structure de données à utiliser pour le traitement
 * @param {Object} backlog - Backlog à analyser
 * @returns {Object} - Structure de données à traiter
 */
function determineBacklogStructure(backlog) {
  if (!backlog) {
    console.error(chalk.red(`❌ Structure de backlog invalide`));
    throw new Error('Structure de backlog invalide ou manquante');
  }
  
  // Structure {success: true, result: {...}}
  if (backlog.success && backlog.result) {
    console.log(chalk.yellow(`Utilisation de backlog.result pour le traitement`));
    return backlog.result;
  }
  
  // Structure directe contenant project
  if (backlog.project) {
    console.log(chalk.yellow(`Utilisation directe du backlog pour le traitement`));
    return backlog;
  }
  
  // Structure {result: {project: ...}}
  if (backlog.result?.project) {
    console.log(chalk.yellow(`Utilisation de backlog.result qui contient project`));
    return backlog.result;
  }
  
  // Format inconnu mais objet présent - tenter une conversion
  console.log(chalk.yellow(`Conversion d'une structure inconnue en un format compatible`));
  return {
    project: {
      title: backlog.name || backlog.title || 'Projet sans titre',
      description: backlog.description || ''
    },
    epics: backlog.epics || [],
    iterations: backlog.iterations || [],
    mvp: backlog.mvp || null
  };
}

/**
 * Alias de generateMarkdownFilesFromResult pour la compatibilité
 * @param {Object} backlog - Le backlog à formater
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} - Résultat de la génération
 */
const generateMarkdownFiles = async (backlog, outputDir) => {
  console.log(chalk.blue('🔠 Generating markdown files using refactored architecture...'));
  
  // Debug des données reçues
  console.log(chalk.yellow(`Structure du backlog reçu : ${typeof backlog === 'object' ? 'Objet' : typeof backlog}`));
  console.log(chalk.yellow(`Backlog a success: ${backlog?.success ? 'Oui' : 'Non'}`));
  console.log(chalk.yellow(`Backlog a result: ${backlog?.result ? 'Oui' : 'Non'}`));
  
  // Déterminer la structure à traiter
  let dataToProcess = determineBacklogStructure(backlog);
  
  console.log(chalk.yellow(`Répertoire de sortie: ${outputDir}`));
  
  try {
    // Vérifier la structure minimale requise
    if (!dataToProcess.project) {
      dataToProcess.project = { title: 'Projet généré', description: 'Projet généré automatiquement' };
    }
    
    if (!dataToProcess.project.title) {
      dataToProcess.project.title = 'Projet sans titre';
    }
    
    const genResult = await generateMarkdownFilesFromResult(dataToProcess, outputDir);
    console.log(chalk.green(`✅ Markdown généré avec succès dans ${outputDir}`));
    return genResult;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération du markdown: ${error.message}`));
    console.error(chalk.red(error.stack));
    throw error;
  }
};

// Constantes pour la compatibilité
const epicFileInstructions = `Ce document est généré par Agile Planner et contient des informations sur un Epic.
Les User Stories associées se trouvent dans les sous-dossiers.
Vous pouvez explorer le backlog complet en naviguant dans les liens.`;

const featureFileInstructions = `Ce document est généré par Agile Planner et contient des informations sur une Feature.
Les User Stories associées se trouvent dans les sous-dossiers.
Vous pouvez explorer le backlog complet en naviguant dans les liens.`;

const userStoryFileInstructions = `Ce document est généré par Agile Planner et contient des informations sur une User Story.
Consultez les sections Acceptance Criteria et Technical Tasks pour comprendre les exigences.`;

const iterationFileInstructions = `Ce document est généré par Agile Planner et contient des informations sur une Itération.
Il liste les User Stories à compléter dans cette itération.
Vous pouvez accéder aux User Stories en cliquant sur les liens.`;

const mvpFileInstructions = `Ce document est généré par Agile Planner et définit le Minimum Viable Product (MVP).
Il regroupe les User Stories essentielles pour une première version fonctionnelle.
Vous pouvez accéder aux User Stories en cliquant sur les liens.`;

/**
 * Fonction qui valide un backlog et extrait ses données pour être utilisée par le système de génération de markdown
 * Vérifie si le backlog est au format moderne avec 'epics' (pluriel)
 * @param {Object} backlog - Le backlog à valider, peut contenir une structure wrapper (success/result)
 * @returns {Object} - Résultat de validation {valid: boolean, backlogData?: Object, error?: string}
 */
function validateBacklogResult(backlog) {
  try {
    // Vérifier si le backlog existe
    if (!backlog) {
      return { valid: false, error: 'Backlog invalide ou manquant' };
    }

    // Extraire les données de backlog (gère les formats avec ou sans wrapper success/result)
    let backlogData;

    // Vérifier si c'est une structure wrapper MCP avec success/result
    if (backlog.success && backlog.result) {
      console.log(chalk.blue('📋 Extraction des données depuis un wrapper MCP'));
      backlogData = backlog.result;
    } else {
      // Sinon utiliser directement le backlog
      backlogData = backlog;
    }

    // Vérifier la présence du projectName
    if (!backlogData.projectName) {
      return { valid: false, error: 'Le projectName est requis dans le backlog' };
    }

    // Vérifier la présence de epics (au pluriel) - Structure moderne
    if (!backlogData.epics || !Array.isArray(backlogData.epics)) {
      return { valid: false, error: 'Epics array is required in the backlog' };
    }

    // Succès - le backlog est valide et utilise le format moderne avec 'epics'
    return { valid: true, backlogData };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la validation du backlog: ${error.message}`));
    console.error(chalk.red(error.stack));
    return { valid: false, error: `Erreur lors de la validation: ${error.message}` };
  }
}

// Réexporter les fonctions et constantes pour maintenir la compatibilité API
module.exports = {
  generateMarkdownFilesFromResult,
  formatUserStory,
  createMarkdownGenerator,
  generateFeatureMarkdown,
  generateMarkdownFiles,
  epicFileInstructions,
  featureFileInstructions,
  userStoryFileInstructions,
  iterationFileInstructions,
  mvpFileInstructions,
  validateBacklogResult, // Ajouter l'export de cette fonction pour les tests
  // Utiliser createSlug depuis le module utils plutôt que de redéfinir la fonction ici
  createSlug: require('./markdown/utils').createSlug
};

console.log(chalk.green('✅ Module markdown-generator.js de compatibilité exporté avec succès'));
