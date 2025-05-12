/**
 * @module utils/file-manager
 * @description Gestion des fichiers du backlog Agile selon la structure définie dans RULE 3
 */
const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');

/**
 * Classe pour gérer les opérations sur les fichiers du backlog Agile
 * Structure du backlog selon RULE 3:
 * .agile-planner-backlog/
 * ├── epics/
 * │   └── [epic-slug]/
 * │       ├── epic.md
 * │       └── features/
 * │           └── [feature-slug]/
 * │               ├── feature.md
 * │               └── user-stories/
 * │                   └── [story-slug].md
 * └── orphan-stories/
 *     └── [story-orpheline].md
 */
class FileManager {
  /**
   * Crée une instance de FileManager
   * @param {string} basePath - Chemin de base pour tous les fichiers du backlog
   */
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * Crée le répertoire pour un epic et retourne son chemin
   * @param {Object} epic - Objet Epic à traiter
   * @param {string} epic.id - Identifiant de l'epic
   * @returns {Promise<string>} - Chemin du répertoire de l'epic créé
   * @throws {Error} - Si l'epic est invalide ou l'ID manquant
   */
  async createEpicFile(epic) {
    if (!epic?.id) {
      throw new Error('Epic invalide ou ID manquant');
    }
    const epicSlug = slugify(epic.id, { lower: true });
    const epicDir = path.join(this.basePath, 'epics', epicSlug);
    await fs.ensureDir(epicDir);
    return epicDir;
  }

  /**
   * Crée le répertoire pour une feature dans un epic et retourne son chemin
   * @param {string} epicSlug - Slug de l'epic parent
   * @param {Object} feature - Objet Feature à traiter
   * @param {string} feature.id - Identifiant de la feature
   * @returns {Promise<string>} - Chemin du répertoire de la feature créée
   * @throws {Error} - Si la feature est invalide, l'ID manquant ou l'epic inexistant
   */
  async createFeatureFile(epicSlug, feature) {
    if (!epicSlug) {
      throw new Error('Slug de l\'epic manquant');
    }
    if (!feature?.id) {
      throw new Error('Feature invalide ou ID manquant');
    }

    const epicDir = path.join(this.basePath, 'epics', epicSlug);
    
    // Vérifier que l'epic existe
    const epicExists = await fs.pathExists(epicDir);
    if (!epicExists) {
      throw new Error(`L'epic '${epicSlug}' n'existe pas`);
    }
    
    const featureSlug = slugify(feature.id, { lower: true });
    const featuresDir = path.join(epicDir, 'features');
    const featureDir = path.join(featuresDir, featureSlug);
    
    await fs.ensureDir(featureDir);
    return featureDir;
  }

  /**
   * Crée le fichier pour une user story dans une feature et retourne son chemin
   * @param {string} epicSlug - Slug de l'epic parent
   * @param {string} featureSlug - Slug de la feature parente
   * @param {Object} userStory - Objet User Story à traiter
   * @param {string} userStory.id - Identifiant de la user story
   * @returns {Promise<string>} - Chemin du fichier de la user story créée
   * @throws {Error} - Si la user story est invalide, l'ID manquant, ou l'epic/feature inexistant
   */
  async createUserStoryFile(epicSlug, featureSlug, userStory) {
    if (!epicSlug) {
      throw new Error('Slug de l\'epic manquant');
    }
    if (!featureSlug) {
      throw new Error('Slug de la feature manquant');
    }
    if (!userStory?.id) {
      throw new Error('User story invalide ou ID manquant');
    }

    const featureDir = path.join(this.basePath, 'epics', epicSlug, 'features', featureSlug);
    
    // Vérifier que la feature existe
    const featureExists = await fs.pathExists(featureDir);
    if (!featureExists) {
      throw new Error(`La feature '${featureSlug}' n'existe pas dans l'epic '${epicSlug}'`);
    }
    
    const userStorySlug = slugify(userStory.id, { lower: true });
    const userStoriesDir = path.join(featureDir, 'user-stories');
    await fs.ensureDir(userStoriesDir);
    
    const userStoryFilePath = path.join(userStoriesDir, `${userStorySlug}.md`);
    return userStoryFilePath;
  }

  /**
   * Crée le fichier pour une user story orpheline (sans feature ni epic)
   * @param {Object} userStory - Objet User Story orpheline
   * @param {string} userStory.id - Identifiant de la user story
   * @returns {Promise<string>} - Chemin du fichier de la user story orpheline créée
   * @throws {Error} - Si la user story est invalide ou l'ID manquant
   */
  async createOrphanStoryFile(userStory) {
    if (!userStory?.id) {
      throw new Error('User story invalide ou ID manquant');
    }
    
    const userStorySlug = slugify(userStory.id, { lower: true });
    const orphanStoriesDir = path.join(this.basePath, 'orphan-stories');
    await fs.ensureDir(orphanStoriesDir);
    
    const userStoryFilePath = path.join(orphanStoriesDir, `${userStorySlug}.md`);
    return userStoryFilePath;
  }
  
  /**
   * Écrit le contenu dans un fichier
   * @param {string} filePath - Chemin du fichier à écrire
   * @param {string} content - Contenu à écrire dans le fichier
   * @returns {Promise<void>}
   */
  async writeFile(filePath, content) {
    await fs.writeFile(filePath, content, 'utf8');
  }
}

module.exports = FileManager;