/**
 * @deprecated Ce module est obsolète depuis Wave 8 (mai 2025)
 * 
 * Les fonctionnalités de MVP ont été refactorisées et intégrées dans le système de génération
 * principal via le pattern factory dans index.js. Cette refactorisation permet une meilleure
 * cohésion du code, une réduction de la duplication, et facilite les tests unitaires.
 * 
 * Note de maintenance:
 * - Ce fichier est conservé temporairement pour référence et rétrocompatibilité
 * - À supprimer complètement dans la version 1.5.0 (selon RULE 2)
 * - Les tests affectés devront être mis à jour pour utiliser la nouvelle API
 * 
 * @see server/lib/markdown/index.js pour l'implémentation actuelle
 */
module.exports = {
  createMvpFormatter,
  processMVP,
  processMvpStory
};

// Import manquants intentionnellement non résolus pour marquer clairement l'obsolète
// Ces erreurs aideront à détecter l'utilisation de ce module dans le code
const { createSlug, handleMarkdownError, markdownInstructions } = require('./utils');
const fs = require('fs-extra');
const chalk = require('chalk');
const path = require('path');

/**
 * Traite une story du MVP
 * @param {Object} story - Données de la story
 * @param {Map} userStoryMap - Map des user stories disponibles
 * @returns {Object} - Contenu formaté et données JSON
 */
function processMvpStory(story, userStoryMap) {
  const storyId = story.id || '';
  const storyTitle = story.title;
  const storyPrefix = storyId ? (storyId + ': ') : '';
  let storyContent = '';
  
  const storyJson = {
    id: storyId,
    title: storyTitle
  };
  
  // Vérifier si la story existe dans la map
  if (userStoryMap.has(storyTitle) || userStoryMap.has(storyId)) {
    const storyInfo = userStoryMap.get(storyTitle) || userStoryMap.get(storyId);
    storyContent += `- [${storyPrefix}${storyTitle}](${storyInfo.relativePath})\n`;
    storyJson.path = storyInfo.relativePath;
  } else {
    // Story orpheline
    console.error(chalk.yellow(`⚠️ MVP story "${storyTitle}" not found in any epic/feature`));
    storyContent += `- ${storyPrefix}${storyTitle} (Warning: This story is not defined in any epic/feature)\n`;
    storyContent += `  - Description: ${story.description || ''}\n`;
    storyContent += `  - Priority: ${story.priority || ''}\n`;
    storyJson.orphaned = true;
  }
  
  return { content: storyContent, json: storyJson };
}

/**
 * Génère l'entête du MVP
 * @param {string} mvpTitle - Titre du MVP
 * @param {string} description - Description du MVP
 * @returns {string} - Contenu markdown de l'entête
 */
function generateMvpHeader(mvpTitle, description) {
  return `# Minimum Viable Product: ${mvpTitle}\n\n${markdownInstructions.mvpFileInstructions}\n## Description\n\n${description}\n\n## User Stories\n\n`;
}

/**
 * Traite le MVP et crée le fichier markdown correspondant
 * @param {Object} mvp - Données du MVP
 * @param {string} backlogDir - Chemin du répertoire du backlog
 * @param {Map} userStoryMap - Map des user stories
 * @param {Object} backlogJson - Données JSON du backlog pour référencement
 * @returns {Promise<void>}
 */
async function processMVP(mvp, backlogDir, userStoryMap, backlogJson) {
  // Si pas de MVP, on ignore
  if (!mvp?.title || !Array.isArray(mvp?.stories) || mvp?.stories.length === 0) {
    console.error(chalk.yellow('⚠️ No MVP defined or empty MVP, skipping MVP processing'));
    return;
  }
  
  try {
    // Créer le répertoire du MVP
    const mvpDir = path.join(backlogDir, 'planning', 'mvp');
    await fs.ensureDir(mvpDir);
    
    // Générer le contenu du MVP
    const mvpTitle = mvp.title;
    const mvpDescription = mvp.description || 'Minimum Viable Product';
    let mvpContent = generateMvpHeader(mvpTitle, mvpDescription);
    
    // JSON pour le backlog
    const mvpJson = {
      title: mvpTitle,
      description: mvpDescription,
      stories: []
    };
    
    // Traiter chaque story du MVP
    const userStoriesDir = path.join(backlogDir, 'epics', 'mvp-orphan', 'user-stories');
    await fs.ensureDir(userStoriesDir);
    for (const story of mvp.stories) {
      const result = processMvpStory(story, userStoryMap);
      mvpContent += result.content;
      mvpJson.stories.push(result.json);
      // Générer le fichier markdown individuel si non déjà généré
      const storyTitle = story.title;
      const storyId = story.id || '';
      const storySlug = createSlug(storyTitle);
      const storyPath = path.join(userStoriesDir, storySlug + '.md');
      if (!userStoryMap.has(storyTitle) && !userStoryMap.has(storyId)) {
        // Formatage du contenu markdown
        const { formatUserStory } = require('./story-formatter');
        const storyContent = formatUserStory(story);
        await fs.writeFile(storyPath, storyContent);
        console.error(chalk.green(`✓ User story (MVP) document created: ${storyPath}`));
        // Tracker cette user story dans la map
        const relativePath = `./${path.relative(process.cwd(), storyPath).replace(/\\/g, '/')}`;
        userStoryMap.set(storyTitle, {
          path: storyPath,
          relativePath,
          feature: null,
          id: storyId
        });
        if (storyId) {
          userStoryMap.set(storyId, {
            path: storyPath,
            relativePath,
            feature: null,
            id: storyId
          });
        }
      }
    }
    
    // Écrire le fichier
    const mvpFilePath = path.join(mvpDir, 'mvp.md');
    await fs.writeFile(mvpFilePath, mvpContent);
    
    console.error(chalk.green(`✓ MVP document created: ${mvpFilePath}`));
    
    // Ajouter au backlog JSON
    mvpJson.path = `./${path.relative(backlogDir, mvpFilePath).replace(/\\/g, '/')}`;
    backlogJson.mvp = mvpJson;
  } catch (error) {
    throw handleMarkdownError('Error processing MVP', error);
  }
}

/**
 * Factory function pour créer un formateur de MVP
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du formateur de MVP
 */
function createMvpFormatter(_options = {}) {
  return {
    processMVP
  };
}

// Ce module est désormais obsolète : la génération du MVP est supprimée.
