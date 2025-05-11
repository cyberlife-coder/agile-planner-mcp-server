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
  if (!feature.stories || !Array.isArray(feature.stories) || feature.stories.length === 0) {
    content += '> ⚠️ **Aucune user story générée pour cette feature.**\n\n';
  }

  // Les user stories seront ajoutées par référence, pas directement ici
  content += '_Les user stories associées se trouvent dans le dossier "user-stories"._\n\n';
  
  return content;
}

/**
 * Traite une feature individuelle et crée le fichier markdown correspondant
 * @param {Object} feature - Données de la feature
 * @param {string} epicDir - Chemin du répertoire de l'epic parent
 * @param {string} epicTitle - Titre de l'epic parent
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} epicJson - Données JSON de l'epic pour référencement
 * @returns {Promise<void>}
 */
async function processFeature(feature, epicDir, epicTitle, userStoryMap, epicJson) {
  const featureTitle = feature.title;
  const featureSlug = createSlug(featureTitle);
  
  // Créer le répertoire de la feature
  const featureDir = path.join(epicDir, 'features', featureSlug);
  await fs.ensureDir(featureDir);
  
  // Générer le contenu markdown
  const featureContent = generateFeatureContent(feature, epicTitle);
  
  // Écrire le fichier
  const featureFilePath = path.join(featureDir, 'feature.md');
  await fs.writeFile(featureFilePath, featureContent);
  
  console.log(chalk.green(`✓ Feature document created: ${featureFilePath}`));
  
  // Créer l'entrée JSON de la feature
  const featureJson = {
    title: featureTitle,
    description: feature.description || '',
    business_value: feature.business_value || '',
    slug: featureSlug,
    path: `./${path.relative(process.cwd(), featureFilePath).replace(/\\/g, '/')}`,
    stories: []
  };
  
  // Ajouter cette feature à l'epic parent
  epicJson.features.push(featureJson);
  
  // Toujours créer le dossier user-stories et un README explicatif si besoin
  await processUserStories(feature.stories || [], featureDir, userStoryMap, feature);

  // Ajouter les références aux user stories dans le JSON de la feature
  if (feature.stories && Array.isArray(feature.stories)) {
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
}

/**
 * Traite les features d'un epic et crée les fichiers markdown correspondants
 * @param {Array} features - Liste des features à traiter
 * @param {string} epicDir - Chemin du répertoire de l'epic parent
 * @param {string} epicTitle - Titre de l'epic parent
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} epicJson - Données JSON de l'epic pour référencement
 * @returns {Promise<void>}
 */
async function processFeatures(features, epicDir, epicTitle, userStoryMap, epicJson) {
  if (!features || !Array.isArray(features) || features.length === 0) {
    console.warn(chalk.yellow(`⚠️ No features found for epic "${epicTitle}", skipping features processing`));
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
function createFeatureFormatter(options = {}) {
  // Note: The 'parentEpic' argument for 'format' is used by generateFeatureContent.
  // It's passed down from _processFeatures in markdown/index.js
  async function format(featureData, featureDirectoryPath, parentEpic) {
    if (parentEpic) {
      console.log(`[DEBUG featureFormatter.format] Received parentEpic.title: ${parentEpic.title}`);
    } else {
      console.log(`[DEBUG featureFormatter.format] CRITICAL: parentEpic IS UNDEFINED upon entry to format method.`);
    }
    if (featureData) {
      console.log(`[DEBUG featureFormatter.format] Received featureData.title: ${featureData.title}`);
    } else {
      console.log(`[DEBUG featureFormatter.format] CRITICAL: featureData IS UNDEFINED upon entry to format method.`);
    }

    try {
      const content = generateFeatureContent(featureData, parentEpic.title); // generateFeatureContent needs epicTitle
      const filePath = path.join(featureDirectoryPath, 'feature.md');
      await fs.writeFile(filePath, content);
      // Logging of file creation is handled by the caller in index.js
    } catch (error) {
      throw error; // Propagate to be caught by central handler
    }
  }

  function generateSlug(title) {
    return createSlug(title); // createSlug is imported from ./utils
  }

  return {
    format,
    generateSlug
  };
}

module.exports = {
  createFeatureFormatter,
  // Keep other exports for now for tests or other potential uses
  processFeatures,
  processFeature,
  generateFeatureContent
};
