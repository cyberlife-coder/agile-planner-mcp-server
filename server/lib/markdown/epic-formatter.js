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
 * @param {string} epicsDir - Chemin du répertoire des epics
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} backlogJson - Données JSON du backlog pour référencement
 * @returns {Promise<void>}
 */
async function processEpic(epic, epicsDir, userStoryMap, backlogJson) {
  const epicTitle = epic.title;
  const epicSlug = createSlug(epicTitle);
  
  // Créer le répertoire de l'epic
  const epicDir = path.join(epicsDir, epicSlug);
  await fs.ensureDir(epicDir);
  
  // Générer le contenu markdown
  const epicContent = generateEpicContent(epic);
  
  // Écrire le fichier
  const epicFilePath = path.join(epicDir, 'epic.md');
  await fs.writeFile(epicFilePath, epicContent);
  
  console.log(chalk.green(`✓ Epic document created: ${epicFilePath}`));
  
  // Créer l'entrée JSON de l'epic
  const epicJson = {
    title: epicTitle,
    description: epic.description || '',
    slug: epicSlug,
    path: `./${path.relative(process.cwd(), epicFilePath).replace(/\\/g, '/')}`,
    features: []
  };
  
  // Ajouter cet epic au backlog
  backlogJson.epics.push(epicJson);
  
  // Traiter les features de cet epic
  if (epic.features && Array.isArray(epic.features)) {
    await processFeatures(epic.features, epicDir, epicTitle, userStoryMap, epicJson);
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
  if (!epics || !Array.isArray(epics) || epics.length === 0) {
    console.warn(chalk.yellow('⚠️ No epics found, skipping epics processing'));
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
function createEpicFormatter(options = {}) {
  async function format(epicData, epicDirectoryPath) {
    try {
      const content = generateEpicContent(epicData);
      const filePath = path.join(epicDirectoryPath, 'epic.md');
      await fs.writeFile(filePath, content);
      // Logging of file creation is handled by the caller in index.js
    } catch (error) {
      // Let the error propagate to be caught by the central handler in index.js
      throw error;
    }
  }

  function generateSlug(title) {
    return createSlug(title); // createSlug is imported from ./utils
  }

  return {
    format,
    generateSlug
    // The original processEpics and generateEpicContent (if returned here) are no longer
    // the primary interface for the instance. generateEpicContent is used internally by format.
  };
}

module.exports = {
  createEpicFormatter,
  // Keep other exports for now in case they are used by tests or other parts,
  // but the primary interaction from markdown/index.js will be via the formatter instance.
  processEpics,
  processEpic,
  generateEpicContent
};
