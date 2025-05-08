/**
 * PathResolver - Classe responsable de la gestion centralisée des chemins
 * @module path-resolver
 */

const path = require('path');
const slugify = require('slugify');
const chalk = require('chalk');

/**
 * Classe pour gérer de manière centralisée tous les chemins de l'application
 * Cela garantit la cohérence et facilite la maintenance
 */
class PathResolver {
  /**
   * Crée une instance du PathResolver
   */
  constructor() {
    this.backlogDirName = '.agile-planner-backlog';
  }

  /**
   * Résout un chemin de sortie, en tenant compte des chemins relatifs et des variables d'environnement
   * @param {string} outputPath - Chemin fourni par l'utilisateur
   * @returns {string} Chemin absolu résolu
   */
  resolveOutputPath(outputPath) {
    // Priorité: 1. outputPath spécifié 2. Variable d'environnement 3. Répertoire courant
    let resolvedPath = outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || process.cwd();
    
    // Convertir en chemin absolu si nécessaire
    if (!path.isAbsolute(resolvedPath)) {
      resolvedPath = path.resolve(process.cwd(), resolvedPath);
    }
    
    console.log(chalk.blue(`📂 Chemin de sortie résolu: ${resolvedPath}`));
    return resolvedPath;
  }

  /**
   * Obtient le chemin du dossier backlog
   * @param {string} basePath - Chemin de base
   * @returns {string} Chemin du dossier backlog
   */
  getBacklogDir(basePath) {
    return path.join(basePath, this.backlogDirName);
  }

  /**
   * Obtient le chemin du dossier d'un epic
   * @param {string} basePath - Chemin de base
   * @param {string} epicId - ID de l'epic
   * @returns {string} Chemin du dossier de l'epic
   */
  getEpicDir(basePath, epicId) {
    return path.join(this.getBacklogDir(basePath), 'epics', epicId);
  }

  /**
   * Obtient le chemin du dossier d'une feature
   * @param {string} basePath - Chemin de base
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature
   * @returns {string} Chemin du dossier de la feature
   */
  getFeatureDir(basePath, epicId, featureId) {
    return path.join(this.getEpicDir(basePath, epicId), 'features', featureId);
  }

  /**
   * Obtient le chemin du dossier des user stories d'une feature
   * @param {string} basePath - Chemin de base
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parente
   * @returns {string} Chemin du dossier des user stories
   */
  getUserStoryDir(basePath, epicId, featureId) {
    return path.join(this.getFeatureDir(basePath, epicId, featureId), 'user-stories');
  }

  /**
   * Obtient le chemin du dossier MVP
   * @param {string} basePath - Chemin de base
   * @returns {string} Chemin du dossier MVP
   */
  getMvpDir(basePath) {
    return path.join(this.getBacklogDir(basePath), 'planning', 'mvp');
  }

  /**
   * Obtient le chemin du dossier d'une itération
   * @param {string} basePath - Chemin de base
   * @param {string} iterationName - Nom de l'itération
   * @returns {string} Chemin du dossier de l'itération
   */
  getIterationDir(basePath, iterationName) {
    const iterationSlug = slugify(iterationName, { lower: true });
    return path.join(this.getBacklogDir(basePath), 'planning', 'iterations', iterationSlug);
  }

  /**
   * Obtient le chemin d'un fichier user story
   * @param {string} basePath - Chemin de base
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parente
   * @param {string} storyId - ID de la user story
   * @returns {string} Chemin du fichier user story
   */
  getUserStoryPath(basePath, epicId, featureId, storyId) {
    const storySlug = slugify(storyId, { lower: true });
    return path.join(this.getUserStoryDir(basePath, epicId, featureId), `${storySlug}.md`);
  }

  /**
   * Calcule le chemin relatif vers une user story depuis un emplacement de planification
   * @param {string} fromLocation - Emplacement source ('mvp' ou 'iteration')
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parente
   * @param {string} storyId - ID de la user story
   * @returns {string} Chemin relatif formaté pour markdown
   */
  getRelativePathToUserStory(fromLocation, epicId, featureId, storyId) {
    const epicSlug = slugify(epicId, { lower: true });
    const featureSlug = slugify(featureId, { lower: true });
    const storySlug = slugify(storyId, { lower: true });
    
    let relativePath;
    
    if (fromLocation === 'mvp') {
      // Depuis le dossier MVP
      relativePath = path.join('..', '..', 'epics', epicSlug, 'features', featureSlug, 'user-stories', `${storySlug}.md`);
    } else if (fromLocation === 'iteration') {
      // Depuis le dossier d'une itération
      relativePath = path.join('..', '..', '..', 'epics', epicSlug, 'features', featureSlug, 'user-stories', `${storySlug}.md`);
    } else {
      throw new Error(`Emplacement source non supporté: ${fromLocation}`);
    }
    
    // Convertir le chemin pour utiliser des slashes (format markdown)
    return relativePath.split(path.sep).join('/');
  }

  /**
   * Obtient les chemins pour les user stories d'une feature
   * @param {string} outputPath - Chemin de sortie
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature
   * @returns {Object} - Objet contenant les chemins
   */
  getFeatureUserStoryPaths(outputPath, epicId, featureId) {
    const rootPath = this.getBacklogDir(outputPath);
    // Pas besoin de créer des slugs ici, on utilise directement les IDs
    
    return {
      userStoriesDir: path.join(rootPath, 'epics', epicId, 'features', featureId, 'user-stories')
    };
  }

  /**
   * Obtient les chemins pour un epic
   * @param {string} outputPath - Chemin de sortie
   * @param {string} epicId - ID de l'epic
   * @returns {Object} - Objet contenant les chemins
   */
  getEpicPaths(outputPath, epicId) {
    const rootPath = this.getBacklogDir(outputPath);
    // Pas besoin de créer des slugs ici, on utilise directement l'ID
    
    return {
      epicDir: path.join(rootPath, 'epics', epicId),
      featuresDir: path.join(rootPath, 'epics', epicId, 'features')
    };
  }
}

module.exports = { PathResolver };
