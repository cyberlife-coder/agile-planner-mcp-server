/**
 * Module de formatage des features
 * @module markdown/feature-formatter
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { createSlug, handleMarkdownError, markdownInstructions } = require('./utils');
const { processUserStories } = require('./story-formatter');

/**
 * Génère le contenu d'une feature en markdown
 * @param {Object} feature - Données de la feature
 * @param {string} feature.title - Titre de la feature
 * @param {string} [feature.description] - Description de la feature
 * @param {string} [feature.business_value] - Valeur business de la feature
 * @param {Array} [feature.stories] - User stories associées à la feature
 * @param {string} epicTitle - Titre de l'epic parent
 * @returns {string} - Contenu markdown de la feature
 */
function generateFeatureContent(feature, epicTitle) {
  const featureTitle = feature.title;
  const featureDescription = feature.description || '';
  const businessValue = feature.business_value || '';
  
  let content = `# Feature: ${featureTitle}\n\n`;
  content += `${markdownInstructions.featureFileInstructions}\n\n`;
  content += `## Description\n\n${featureDescription}\n\n`;
  
  if (businessValue) {
    content += `## Business Value\n\n${businessValue}\n\n`;
  }
  
  content += `## Parent Epic\n\n${epicTitle}\n\n`;
  content += `## User Stories\n\n`;

  // Si aucune user story, ajouter un avertissement explicite
  if (!feature?.stories?.length) content += '> ⚠️ **Aucune user story générée pour cette feature.**\n\n';

  // Les user stories seront ajoutées par référence, pas directement ici
  content += '_Les user stories associées se trouvent dans le dossier "user-stories"._\n\n';
  
  return content;
}

/**
 * Traite une feature individuelle et crée le fichier markdown correspondant
 * @param {Object} feature - Données de la feature
 * @param {string} feature.title - Titre de la feature
 * @param {string} [feature.description] - Description de la feature
 * @param {string} [feature.business_value] - Valeur business de la feature
 * @param {Array} [feature.stories] - User stories associées à la feature
 * @param {string} epicDir - Chemin du répertoire de l'epic parent
 * @param {string} epicTitle - Titre de l'epic parent
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} epicJson - Données JSON de l'epic pour référencement
 * @param {Array} epicJson.features - Liste des features de l'epic
 * @returns {Promise<Object>} - Objet JSON représentant la feature
 */
async function processFeature(feature, epicDir, epicTitle, userStoryMap, epicJson) {
  if (!feature?.title) {
    throw handleMarkdownError('Invalid feature data: title is required');
  }

  const featureTitle = feature.title;
  const featureSlug = createSlug(featureTitle);
  
  try {
    // Créer le répertoire de la feature
    const featureDir = path.join(epicDir, 'features', featureSlug);
    await fs.ensureDir(featureDir);
    
    // Générer le contenu markdown
    const featureContent = generateFeatureContent(feature, epicTitle);
    
    // Écrire le fichier
    const featureFilePath = path.join(featureDir, 'feature.md');
    await fs.writeFile(featureFilePath, featureContent);
    
    console.error(chalk.green(`✓ Feature document created: ${featureFilePath} (stderr)`));
    
    // Créer l'entrée JSON de la feature
    const featureJson = createFeatureJson(feature, featureFilePath, featureSlug);
    
    // Ajouter cette feature à l'epic parent
    epicJson.features.push(featureJson);
    
    // Traiter les user stories de cette feature
    await processFeatureStories(feature, featureDir, userStoryMap, featureJson);

    return featureJson;
  } catch (error) {
    throw handleMarkdownError(`Error processing feature '${featureTitle}'`, error);
  }
}

/**
 * Traite les features d'un epic et crée les fichiers markdown correspondants
 * @param {Array} features - Liste des features à traiter
 * @param {string} epicDir - Chemin du répertoire de l'epic parent
 * @param {string} epicTitle - Titre de l'epic parent
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} epicJson - Données JSON de l'epic pour référencement
 * @param {Array} epicJson.features - Liste des features de l'epic
 * @returns {Promise<void>}
 */
async function processFeatures(features, epicDir, epicTitle, userStoryMap, epicJson) {
  if (!features?.length) {
    console.error(chalk.yellow(`⚠️ No features found for epic "${epicTitle}", skipping features processing (stderr)`));
    return;
  }
  
  try {
    // Créer le répertoire des features
    const featuresDir = path.join(epicDir, 'features');
    await fs.ensureDir(featuresDir);
    
    // Initialiser le tableau des features dans l'epic JSON
    epicJson.features = [];
    
    // Traiter chaque feature
    for (const feature of features) {
      await processFeature(feature, epicDir, epicTitle, userStoryMap, epicJson);
    }
  } catch (error) {
    throw handleMarkdownError(`Error processing features for epic "${epicTitle}"`, error);
  }
}

/**
 * Factory function pour créer un formateur de features
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du formateur de features
 */
function createFeatureFormatter(_options = {}) {
  /**
   * Formate et écrit le contenu d'une feature dans un fichier markdown
   * @param {Object} featureData - Données de la feature
   * @param {string} featureDirectoryPath - Chemin du répertoire où écrire la feature
   * @param {Object} parentEpic - Epic parent de la feature
   * @param {string} parentEpic.title - Titre de l'epic parent
   * @returns {Promise<string>} - Chemin du fichier créé
   */
  async function format(featureData, featureDirectoryPath, parentEpic) {
    if (!featureData?.title) {
      throw handleMarkdownError('Invalid feature data: title is required');
    }

    if (!featureDirectoryPath) {
      throw handleMarkdownError('Feature directory path is required');
    }

    if (!parentEpic?.title) {
      throw handleMarkdownError('Parent epic with title is required for feature formatting');
    }

    try {
      const content = generateFeatureContent(featureData, parentEpic.title);
      const filePath = path.join(featureDirectoryPath, 'feature.md');
      await fs.writeFile(filePath, content);
      return filePath;
    } catch (error) {
      throw handleMarkdownError(`Failed to format feature: ${featureData.title}`, error);
    }
  }

  /**
   * Génère un slug à partir d'un titre
   * @param {string} title - Titre à convertir en slug
   * @returns {string} - Slug généré
   */
  function generateSlug(title) {
    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }
    return createSlug(title);
  }

  return {
    format,
    generateSlug
  };
}

/**
 * Crée un objet JSON représentant une feature
 * @param {Object} feature - Données de la feature
 * @param {string} featureFilePath - Chemin du fichier markdown de la feature
 * @param {string} featureSlug - Slug de la feature
 * @returns {Object} - Objet JSON représentant la feature
 */
function createFeatureJson(feature, featureFilePath, featureSlug) {
  return {
    title: feature.title,
    description: feature.description || '',
    business_value: feature.business_value || '',
    slug: featureSlug,
    path: `./${path.relative(process.cwd(), featureFilePath).replace(/\\/g, '/')}`,
    stories: []
  };
}

/**
 * Traite les user stories d'une feature
 * @param {Object} feature - Données de la feature
 * @param {Array} [feature.stories] - Liste des user stories de la feature
 * @param {string} featureDir - Chemin du répertoire de la feature
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} featureJson - Objet JSON représentant la feature
 * @returns {Promise<void>}
 */
async function processFeatureStories(feature, featureDir, userStoryMap, featureJson) {
  // Toujours créer le dossier user-stories et un README explicatif si besoin
  await processUserStories(feature.stories || [], featureDir, userStoryMap, feature);

  // Ajouter les références aux user stories dans le JSON de la feature
  if (!feature?.stories?.length) return;

  for (const story of feature.stories) {
    const storyKey = story.id || story.title;
    if (userStoryMap.has(storyKey)) {
      const storyInfo = userStoryMap.get(storyKey);
      featureJson.stories.push({
        id: story.id || '',
        title: story.title,
        path: storyInfo.relativePath
      });
    }
  }
}

module.exports = {
  // Factory function principale
  createFeatureFormatter,
  
  // Fonctions utilisées par d'autres modules ou tests
  processFeatures,
  processFeature,
  generateFeatureContent,
  
  // Fonctions helper exposées pour les tests
  createFeatureJson,
  processFeatureStories
};
