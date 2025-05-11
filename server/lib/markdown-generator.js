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
  createMarkdownGenerator
} = require('./markdown/index'); // Uniquement createMarkdownGenerator est exporté directement

console.log(chalk.green('✅ Module façade (createMarkdownGenerator) importé avec succès'));

/**
 * Génère les fichiers markdown pour une feature
 * @param {Object} feature - La feature à formater
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} - Résultat de la génération
 */
const generateFeatureMarkdown = async (feature, outputDir) => {
  console.log(chalk.blue('🔠 Generating feature markdown using refactored architecture...'));
  
  const featureData = feature.feature || feature;
  const title = featureData.title || 'Feature sans titre';
  const description = featureData.description || '';
  
  console.log(chalk.yellow(`Feature reçue: "${title}"`));
  console.log(chalk.yellow(`Répertoire de sortie: ${outputDir}`));
  
  const result = {
    projectName: title, // Utiliser projectName pour la cohérence
    projectDescription: description,
    epics: [{
      title: 'Feature Epic', // Un epic conteneur pour la feature
      description: description,
      features: [featureData]
    }]
  };
  
  console.log(chalk.yellow(`Structure adaptée créée pour la feature "${title}"`));
  
  try {
    const markdownGeneratorInstance = createMarkdownGenerator();
    const genResult = await markdownGeneratorInstance.generateMarkdownFilesFromResult(result, outputDir);
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
  
  if (backlog.success === false && backlog.error) {
    console.error(chalk.red(`❌ Erreur explicite dans le backlog: ${backlog.error}`));
    throw new Error(`Erreur explicite dans le backlog: ${backlog.error}`);
  }

  if (backlog.success && backlog.result) {
    console.log(chalk.yellow(`Utilisation de backlog.result pour le traitement`));
    return backlog.result;
  }
  
  if (backlog.project) {
    console.log(chalk.yellow(`Utilisation directe du backlog pour le traitement (legacy)`));
    return backlog;
  }
  
  if (backlog.result?.project) { // Note: 'project' au singulier est legacy
    console.log(chalk.yellow(`Utilisation de backlog.result qui contient project (legacy)`));
    return backlog.result;
  }
  
  // Nouveau format attendu: projectName, projectDescription, epics, orphan_stories directement
  if (backlog.projectName && Array.isArray(backlog.epics)) {
    console.log(chalk.yellow(`Utilisation directe du backlog (format moderne attendu)`));
    return backlog;
  }

  console.warn(chalk.yellow(`[MD-GEN COMPAT] Conversion d'une structure inconnue en un format compatible... Cela peut indiquer un problème en amont.`));
  return {
    projectName: backlog.name || backlog.title || 'Projet sans titre (converti)',
    projectDescription: backlog.description || 'Description manquante (convertie)',
    epics: backlog.epics || [],
    orphan_stories: backlog.orphan_stories || [] // Ajouter orphan_stories pour la complétude
    // iterations et mvp ne sont plus gérés par le nouveau générateur
  };
}

/**
 * Alias de generateMarkdownFilesFromResult pour la compatibilité
 * @param {Object} backlog - Le backlog à formater
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} - Résultat de la génération
 */
const generateMarkdownFiles = async (backlog, outputDir) => {
  console.log(chalk.blue('🔠 Generating markdown files using refactored architecture (via markdown-generator.js)...'));
  
  console.log(chalk.yellow(`Structure du backlog reçu avant determineBacklogStructure : ${typeof backlog === 'object' ? 'Objet' : typeof backlog}`));
  if (typeof backlog === 'object' && backlog !== null) {
    console.log(chalk.yellow(`  Keys: ${Object.keys(backlog).join(', ')}`));
    if (backlog.result) {
        console.log(chalk.yellow(`  Keys in backlog.result: ${Object.keys(backlog.result).join(', ')}`));
    }
  }

  const finalOutputDir = outputDir || path.join(process.cwd(), '.agile-planner-backlog');
  console.log(chalk.yellow(`Répertoire de sortie: ${finalOutputDir}`));

  try {
    const backlogData = determineBacklogStructure(backlog);
    console.log(chalk.yellow(`Structure du backlog après determineBacklogStructure : projectName="${backlogData.projectName}"`));

    const markdownGeneratorInstance = createMarkdownGenerator();
    const genResult = await markdownGeneratorInstance.generateMarkdownFilesFromResult(backlogData, finalOutputDir);
    
    console.log(chalk.green(`✅ Markdown généré avec succès dans ${finalOutputDir} (via markdown-generator.js)`));
    return genResult;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération du markdown (depuis markdown-generator.js): ${error.message}`));
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
    if (!backlog) {
      return { valid: false, error: 'Backlog invalide ou manquant' };
    }

    let backlogData;

    if (backlog.success && backlog.result) {
      console.log(chalk.blue('📋 Extraction des données depuis un wrapper MCP'));
      backlogData = backlog.result;
    } else {
      backlogData = backlog;
    }

    if (!backlogData.projectName) {
      return { valid: false, error: 'Le projectName est requis dans le backlog' };
    }

    if (!backlogData.epics || !Array.isArray(backlogData.epics)) {
      return { valid: false, error: 'Epics array is required in the backlog' };
    }

    return { valid: true, backlogData };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la validation du backlog: ${error.message}`));
    console.error(chalk.red(error.stack));
    return { valid: false, error: `Erreur lors de la validation: ${error.message}` };
  }
}

// Réexporter les fonctions et constantes pour maintenir la compatibilité API
module.exports = {
  // generateMarkdownFilesFromResult, // N'est plus importé directement
  // formatUserStory, // N'est plus importé directement
  createMarkdownGenerator, // Toujours exporté pour ceux qui voudraient l'utiliser directement
  generateFeatureMarkdown,
  generateMarkdownFiles,
  epicFileInstructions,
  featureFileInstructions,
  userStoryFileInstructions,
  iterationFileInstructions,
  mvpFileInstructions,
  validateBacklogResult,
  createSlug: require('./markdown/utils').createSlug
};

console.log(chalk.green('✅ Module markdown-generator.js de compatibilité (corrigé) exporté avec succès'));
