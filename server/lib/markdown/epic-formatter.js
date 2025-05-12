/**
 * Module de formatage des epics
 * @module markdown/epic-formatter
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { createSlug, handleMarkdownError, markdownInstructions } = require('./utils');
const { processFeatures } = require('./feature-formatter');

/**
 * Génère le contenu d'un epic en markdown
 * @param {Object} epic - Données de l'epic
 * @param {string} epic.title - Titre de l'epic
 * @param {string} [epic.description] - Description de l'epic
 * @returns {string} - Contenu markdown de l'epic
 */
function generateEpicContent(epic) {
  const epicTitle = epic.title;
  const epicDescription = epic.description || '';
  
  let content = `# Epic: ${epicTitle}\n\n`;
  content += `${markdownInstructions.epicFileInstructions}\n\n`;
  content += `## Description\n\n${epicDescription}\n\n`;
  content += `## Features\n\n`;
  
  // Les features seront ajoutées par référence, pas directement ici
  content += `_Les features associées se trouvent dans le dossier "features"._\n\n`;
  
  return content;
}

/**
 * Traite un epic individuel et crée le fichier markdown correspondant
 * @param {Object} epic - Données de l'epic
 * @param {string} epic.title - Titre de l'epic
 * @param {string} [epic.description] - Description de l'epic
 * @param {Array} [epic.features] - Liste des features de l'epic
 * @param {string} epicsDir - Chemin du répertoire des epics
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} backlogJson - Données JSON du backlog pour référencement
 * @param {Array} backlogJson.epics - Liste des epics dans le backlog
 * @returns {Promise<void>}
 */
async function processEpic(epic, epicsDir, userStoryMap, backlogJson) {
  if (!epic?.title) {
    throw handleMarkdownError('Invalid epic data: title is required');
  }

  const epicTitle = epic.title;
  const epicSlug = createSlug(epicTitle);
  
  try {
    // Créer le répertoire de l'epic
    const epicDir = path.join(epicsDir, epicSlug);
    await fs.ensureDir(epicDir);
    
    // Générer le contenu markdown
    const epicContent = generateEpicContent(epic);
    
    // Écrire le fichier
    const epicFilePath = path.join(epicDir, 'epic.md');
    await fs.writeFile(epicFilePath, epicContent);
    
    console.error(chalk.green(`✓ Epic document created: ${epicFilePath} (stderr)`));
    
    // Créer et ajouter l'entrée JSON de l'epic au backlog
    const epicJson = createEpicJson(epic, epicFilePath, epicSlug);
    backlogJson.epics.push(epicJson);
    
    // Traiter les features de cet epic
    await processEpicFeatures(epic, epicDir, epicTitle, userStoryMap, epicJson);

    return epicJson;
  } catch (error) {
    throw handleMarkdownError(`Error processing epic '${epicTitle}'`, error);
  }
}

/**
 * Traite les epics et crée les fichiers markdown correspondants
 * @param {Array} epics - Liste des epics à traiter
 * @param {string} backlogDir - Chemin du répertoire du backlog
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} backlogJson - Données JSON du backlog pour référencement
 * @returns {Promise<void>}
 */
async function processEpics(epics, backlogDir, userStoryMap, backlogJson) {
  // Vérification simplifiée pour des epics valides
  if (!Array.isArray(epics) || epics.length === 0) {
    console.error(chalk.yellow('⚠️ No epics found, skipping epics processing (stderr)'));
    return;
  }
  
  try {
    // Créer le répertoire des epics
    const epicsDir = path.join(backlogDir, 'epics');
    await fs.ensureDir(epicsDir);
    
    // Initialiser le tableau des epics dans le backlog JSON
    backlogJson.epics = [];
    
    // Traiter chaque epic
    for (const epic of epics) {
      await processEpic(epic, epicsDir, userStoryMap, backlogJson);
    }
  } catch (error) {
    throw handleMarkdownError('Error processing epics', error);
  }
}

/**
 * Factory function pour créer un formateur d'epics
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du formateur d'epics
 */
function createEpicFormatter(_options = {}) {
  /**
   * Formate et écrit le contenu d'un epic dans un fichier markdown
   * @param {Object} epicData - Données de l'epic
   * @param {string} epicDirectoryPath - Chemin du répertoire où écrire l'epic
   * @returns {Promise<string>} - Chemin du fichier créé
   */
  async function format(epicData, epicDirectoryPath) {
    if (!epicData?.title) {
      throw handleMarkdownError('Invalid epic data: title is required');
    }

    if (!epicDirectoryPath) {
      throw handleMarkdownError('Epic directory path is required');
    }

    try {
      const content = generateEpicContent(epicData);
      const filePath = path.join(epicDirectoryPath, 'epic.md');
      await fs.writeFile(filePath, content);
      return filePath;
    } catch (error) {
      throw handleMarkdownError(`Failed to format epic: ${epicData.title}`, error);
    }
  }

  /**
   * Génère un slug à partir d'un titre
   * @param {string} title - Titre à convertir en slug
   * @returns {string} - Slug généré
   */
  function generateSlug(title) {
    if (!title || typeof title !== 'string') throw new Error('Title is required and must be a string');
    return createSlug(title);
  }

  return {
    format,
    generateSlug
  };
}

/**
 * Crée un objet JSON représentant un epic
 * @param {Object} epic - Données de l'epic
 * @param {string} epicFilePath - Chemin du fichier markdown de l'epic
 * @param {string} epicSlug - Slug de l'epic
 * @returns {Object} - Objet JSON représentant l'epic
 */
function createEpicJson(epic, epicFilePath, epicSlug) {
  return {
    title: epic.title,
    description: epic.description || '',
    slug: epicSlug,
    path: `./${path.relative(process.cwd(), epicFilePath).replace(/\\/g, '/')}`,
    features: []
  };
}

/**
 * Traite les features d'un epic
 * @param {Object} epic - Données de l'epic
 * @param {Array} [epic.features] - Liste des features de l'epic
 * @param {string} epicDir - Chemin du répertoire de l'epic
 * @param {string} epicTitle - Titre de l'epic
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} epicJson - Objet JSON représentant l'epic
 * @returns {Promise<void>}
 */
async function processEpicFeatures(epic, epicDir, epicTitle, userStoryMap, epicJson) {
  // Vérification rapide de la présence de features
  if (!epic?.features?.length) {
    console.error(chalk.yellow(`⚠️ No features found for epic '${epicTitle}' (stderr)`));
    return;
  }
  
  await processFeatures(epic.features, epicDir, epicTitle, userStoryMap, epicJson);
}

module.exports = {
  // Factory function principale
  createEpicFormatter,
  
  // Fonctions utilisées par d'autres modules ou tests
  processEpics,
  processEpic,
  generateEpicContent,
  
  // Fonctions helper exposées pour les tests
  createEpicJson,
  processEpicFeatures
};
