/**
 * Module façade pour la génération de fichiers markdown
 * @module markdown
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { handleMarkdownError } = require('./utils');
const { createEpicFormatter } = require('./epic-formatter');
const { createFeatureFormatter } = require('./feature-formatter');
const { createStoryFormatter } = require('./story-formatter');
const { createIterationFormatter } = require('./iteration-formatter');
const { createMvpFormatter } = require('./mvp-formatter');

/**
 * Factory pour créer un générateur de markdown complet
 * Implémente le pattern Factory Method
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du générateur de markdown
 */
function createMarkdownGenerator(options = {}) {
  // Créer tous les formateurs nécessaires
  const epicFormatter = createEpicFormatter(options);
  const featureFormatter = createFeatureFormatter(options);
  const storyFormatter = createStoryFormatter(options);
  const iterationFormatter = createIterationFormatter(options);
  const mvpFormatter = createMvpFormatter(options);
  
  /**
   * Fonction principale pour générer les fichiers markdown
   * @param {Object} result - Résultat structuré de la génération du backlog
   * @param {string} outputDir - Répertoire de sortie
   * @returns {Promise<Object>} - Structure JSON du backlog générée
   */
  async function generateMarkdownFilesFromResult(result, outputDir) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid result object provided for markdown generation');
    }
    
    const backlogDir = path.resolve(outputDir);
    
    try {
      console.log(chalk.blue('🔠 Generating markdown files from structured result...'));
      
      // Créer le répertoire de base s'il n'existe pas
      await fs.ensureDir(backlogDir);
      
      // Structure de données pour suivre toutes les user stories créées
      const userStoryMap = new Map();
      
      // Structure JSON pour le référencement
      const backlogJson = {
        project_title: result.project.title || 'Backlog',
        project_description: result.project.description || '',
        epics: [],
        iterations: [],
        mvp: null,
        created_at: new Date().toISOString()
      };

      // Traiter les epics (qui traiteront ensuite les features et user stories)
      if (result.epics) {
        await epicFormatter.processEpics(result.epics, backlogDir, userStoryMap, backlogJson);
      }
      
      // Traiter les itérations
      if (result.iterations) {
        await iterationFormatter.processIterations(result.iterations, backlogDir, userStoryMap, backlogJson);
      }
      
      // Traiter le MVP s'il existe
      if (result.mvp) {
        await mvpFormatter.processMVP(result.mvp, backlogDir, userStoryMap, backlogJson);
      }
      
      // Écrire le fichier backlog.json
      const backlogJsonPath = path.join(backlogDir, 'backlog.json');
      await fs.writeFile(backlogJsonPath, JSON.stringify(backlogJson, null, 2));
      console.log(chalk.green(`✓ Backlog JSON created: ${backlogJsonPath}`));
      
      return backlogJson;
    } catch (error) {
      throw handleMarkdownError('Error generating markdown files', error);
    }
  }
  
  // API publique du générateur
  return {
    generateMarkdownFilesFromResult,
    formatUserStory: storyFormatter.formatUserStory
  };
}

// Créer une instance par défaut pour la compatibilité avec l'API existante
const defaultGenerator = createMarkdownGenerator();

module.exports = {
  createMarkdownGenerator,
  generateMarkdownFilesFromResult: defaultGenerator.generateMarkdownFilesFromResult,
  formatUserStory: defaultGenerator.formatUserStory
};
