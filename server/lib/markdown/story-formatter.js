/**
 * Module de formatage des user stories
 * @module markdown/story-formatter
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { createSlug, handleMarkdownError, markdownInstructions } = require('./utils');

/**
 * Classe Builder pour construire un document markdown de user story
 */
class UserStoryBuilder {
  /**
   * Initialise le builder avec les données de base de la user story
   * @param {Object} userStory - Données de la user story
   */
  constructor(userStory) {
    this.id = userStory.id || '';
    this.title = userStory.title || '';
    this.description = userStory.description || '';
    this.acceptanceCriteria = userStory.acceptance_criteria || [];
    this.tasks = userStory.tasks || [];
    this.priority = userStory.priority || '';
    this.dependencies = userStory.dependencies || [];
    this.lines = [];
  }

  /**
   * Ajoute l'en-tête de la user story
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withHeader() {
    this.lines.push(`# User Story ${this.id}: ${this.title}`);
    this.lines.push('');
    return this;
  }

  /**
   * Ajoute la section description
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withDescription() {
    this.lines.push('## Description');
    this.lines.push(`- [ ] ${this.description}`);
    this.lines.push('');
    return this;
  }

  /**
   * Ajoute la section des critères d'acceptation
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withAcceptanceCriteria() {
    this.lines.push('### Acceptance Criteria');
    for (const criteria of this.acceptanceCriteria) {
      this.lines.push(`- [ ] ${criteria}`);
    }
    this.lines.push('');
    return this;
  }

  /**
   * Ajoute la section des tâches techniques
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withTasks() {
    this.lines.push('### Technical Tasks');
    for (const task of this.tasks) {
      this.lines.push(`- [ ] ${task}`);
    }
    this.lines.push('');
    return this;
  }

  /**
   * Ajoute la section des métadonnées (priorité, dépendances)
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withMetadata() {
    if (this.priority) {
      this.lines.push(`**Priority:** ${this.priority}`);
    }
    
    if (this.dependencies && this.dependencies.length > 0) {
      this.lines.push(`**Dependencies:** ${this.dependencies.join(', ')}`);
    }
    
    if (this.priority || (this.dependencies && this.dependencies.length > 0)) {
      this.lines.push('');
    }
    return this;
  }

  /**
   * Ajoute les instructions pour l'IA
   * @returns {UserStoryBuilder} - L'instance courante pour chaînage
   */
  withAIInstructions() {
    this.lines.push('## 🤖 User Story Instructions for AI');
    this.lines.push('');
    this.lines.push('Lorsque vous travaillez avec cette User Story:');
    this.lines.push('- Mettez à jour le statut des tâches en remplaçant [ ] par [x] lorsqu\'elles sont terminées');
    this.lines.push('- Mettez à jour le statut des critères d\'acceptation en remplaçant [ ] par [x] lorsqu\'ils sont validés');
    this.lines.push('- Vérifiez les liens vers la feature parent et les dépendances avant de commencer');
    this.lines.push('- Ne modifiez PAS la structure existante du document');
    this.lines.push('');
    this.lines.push('Exemple de mise à jour:');
    this.lines.push('- [ ] Tâche à faire  →  - [x] Tâche terminée');
    this.lines.push('');
    this.lines.push('---');
    return this;
  }

  /**
   * Construit le document markdown final
   * @returns {string} - Document markdown formaté
   */
  build() {
    return this.lines.join('\n');
  }
}

/**
 * Format a user story as Markdown with checkboxes and enhanced AI instructions
 * Façade pour le UserStoryBuilder
 * @param {Object} userStory - User story object
 * @returns {string} - Formatted Markdown
 */
function formatUserStory(userStory) {
  return new UserStoryBuilder(userStory)
    .withHeader()
    .withDescription()
    .withAcceptanceCriteria()
    .withTasks()
    .withMetadata()
    .withAIInstructions()
    .build();
}

/**
 * Traite les user stories et crée les fichiers markdown correspondants
 * @param {Array} stories - Liste des user stories à traiter
 * @param {string} featureDir - Chemin du répertoire de la feature parente
 * @param {Map} userStoryMap - Map pour suivre les user stories générées
 * @param {Object} feature - Objet feature parent
 * @returns {Promise<void>}
 */
async function processUserStories(stories, featureDir, userStoryMap, feature) {
  // Créer le répertoire des user stories systématiquement
  const userStoriesDir = path.join(featureDir, 'user-stories');
  await fs.ensureDir(userStoriesDir);

  if (!stories || !Array.isArray(stories) || stories.length === 0) {
    // Créer un README explicatif si aucune user story
    const readmePath = path.join(userStoriesDir, 'README.md');
    const msg = `# 📭 Aucune user story générée pour cette feature\n\nCe dossier a été créé automatiquement par Agile Planner.\n\n- Si vous attendiez des user stories, vérifiez la configuration ou la description de la feature.\n- Vous pouvez ajouter manuellement des user stories ici si besoin.\n`;
    await fs.writeFile(readmePath, msg);
    console.warn(chalk.yellow('⚠️ Aucune user story trouvée : README explicatif généré dans user-stories.'));
    return;
  }

  try {
    // Traiter chaque user story
    for (const story of stories) {
      await _formatAndWriteSingleStoryFile(story, userStoriesDir, userStoryMap, feature);
    }
  } catch (error) {
    throw handleMarkdownError(`Error processing user stories`, error);
  }
}

/**
 * Traite une user story individuelle
 * @param {Object} story - Données de la user story
 * @param {string} userStoriesDir - Répertoire des user stories
 * @param {Map} userStoryMap - Map pour suivre les user stories
 * @param {Object} feature - Feature parente
 * @returns {Promise<void>}
 */
async function _formatAndWriteSingleStoryFile(story, userStoriesDir, userStoryMap, feature) {
  const storyTitle = story.title;
  const storyId = story.id || '';
  const storySlug = createSlug(storyTitle);
  
  // Créer le répertoire de la story
  const storyPath = path.join(userStoriesDir, storySlug + '.md');
  
  // Formatage du contenu markdown
  const storyContent = formatUserStory(story);
  
  // Écrire le fichier
  await fs.writeFile(storyPath, storyContent);
  console.log(chalk.green(`✓ User story document created: ${storyPath}`));
  
  // Tracker cette user story dans la map
  const relativePath = `./${path.relative(process.cwd(), storyPath).replace(/\\/g, '/')}`;
  userStoryMap.set(storyTitle, { 
    path: storyPath, 
    relativePath, 
    feature: feature ? feature.title : null,
    id: storyId
  });
  
  // Si la story a aussi un ID, l'ajouter comme clé alternative
  if (storyId) {
    userStoryMap.set(storyId, { 
      path: storyPath, 
      relativePath, 
      feature: feature ? feature.title : null,
      id: storyId
    });
  }
}

/**
 * Factory function pour créer un formateur de user stories
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du formateur de user stories
 */
function createStoryFormatter(options = {}) {
  return {
    formatUserStory,
    processUserStories,
    processUserStory: _formatAndWriteSingleStoryFile
  };
}

module.exports = {
  createStoryFormatter,
  formatUserStory,
  processUserStories,
  UserStoryBuilder
};
