/**
 * FileManager - Classe responsable de la gestion des fichiers et de la structure hiérarchique
 * @module file-manager
 */

const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');
const chalk = require('chalk');

/**
 * Classe gérant la création et l'organisation des fichiers markdown selon la structure hiérarchique
 * epic > feature > user story
 */
class FileManager {
  /**
   * Crée une instance du FileManager
   * @param {string} basePath - Chemin de base pour la génération des fichiers
   */
  constructor(basePath) {
    this.basePath = this.resolveAbsolutePath(basePath);
    this.userStoryMap = new Map(); // Pour suivre l'emplacement des user stories
  }

  /**
   * Convertit un chemin relatif en chemin absolu
   * @param {string} inputPath - Chemin à convertir
   * @returns {string} Chemin absolu
   */
  resolveAbsolutePath(inputPath) {
    if (!inputPath) {
      return process.cwd();
    }
    
    if (path.isAbsolute(inputPath)) {
      return inputPath;
    }
    
    return path.resolve(process.cwd(), inputPath);
  }

  /**
   * Retourne le chemin du dossier .agile-planner-backlog
   * @returns {string} Chemin du dossier backlog
   */
  getBacklogDir() {
    return path.join(this.basePath, '.agile-planner-backlog');
  }

  /**
   * Crée la structure de base du backlog
   * @returns {Promise<void>}
   */
  async createBacklogStructure() {
    console.log(chalk.blue(`📂 Création de la structure hiérarchique dans: ${this.getBacklogDir()}`));
    
    // Créer le dossier principal
    await fs.ensureDir(this.getBacklogDir());
    
    // Créer les sous-dossiers principaux
    await fs.ensureDir(path.join(this.getBacklogDir(), 'epics'));
    await fs.ensureDir(path.join(this.getBacklogDir(), 'planning'));
    await fs.ensureDir(path.join(this.getBacklogDir(), 'planning', 'mvp'));
    await fs.ensureDir(path.join(this.getBacklogDir(), 'planning', 'iterations'));
    
    console.log(chalk.green('✅ Structure de base créée'));
  }

  /**
   * Crée un fichier epic.md et sa structure de dossiers
   * @param {Object} epic - Données de l'epic
   * @returns {Promise<string>} Chemin du fichier epic.md créé
   */
  async createEpicFile(epic) {
    if (!epic || !epic.id) {
      throw new Error('Epic invalide ou ID manquant');
    }
    
    const epicSlug = slugify(epic.id, { lower: true });
    const epicDir = path.join(this.getBacklogDir(), 'epics', epicSlug);
    const epicPath = path.join(epicDir, 'epic.md');
    const featuresDir = path.join(epicDir, 'features');
    
    // Créer les dossiers
    await fs.ensureDir(epicDir);
    await fs.ensureDir(featuresDir);
    
    // Générer le contenu du fichier epic.md
    const epicContent = this.generateEpicMarkdown(epic);
    
    // Écrire le fichier
    await fs.writeFile(epicPath, epicContent);
    
    console.log(chalk.green(`✅ Epic créé: ${epicPath}`));
    return epicPath;
  }

  /**
   * Crée un fichier feature.md et sa structure de dossiers
   * @param {Object} feature - Données de la feature
   * @param {string} epicId - ID de l'epic parent
   * @returns {Promise<string>} Chemin du fichier feature.md créé
   */
  async createFeatureFile(feature, epicId) {
    if (!feature || !feature.id || !epicId) {
      throw new Error('Feature invalide, ID manquant ou epicId manquant');
    }
    
    const epicSlug = slugify(epicId, { lower: true });
    const featureSlug = slugify(feature.id, { lower: true });
    
    const featureDir = path.join(
      this.getBacklogDir(),
      'epics',
      epicSlug,
      'features',
      featureSlug
    );
    
    const featurePath = path.join(featureDir, 'feature.md');
    const storiesDir = path.join(featureDir, 'user-stories');
    
    // Créer les dossiers
    await fs.ensureDir(featureDir);
    await fs.ensureDir(storiesDir);
    
    // Générer le contenu du fichier feature.md
    const featureContent = this.generateFeatureMarkdown(feature, epicId);
    
    // Écrire le fichier
    await fs.writeFile(featurePath, featureContent);
    
    console.log(chalk.green(`✅ Feature créée: ${featurePath}`));
    return featurePath;
  }

  /**
   * Crée un fichier user story
   * @param {Object} story - Données de la user story
   * @param {string} featureId - ID de la feature parente
   * @param {string} epicId - ID de l'epic parent
   * @returns {Promise<string>} Chemin du fichier user story créé
   */
  async createUserStoryFile(story, featureId, epicId) {
    if (!story || !story.id || !featureId || !epicId) {
      throw new Error('Story invalide, ID manquant, featureId manquant ou epicId manquant');
    }
    
    const epicSlug = slugify(epicId, { lower: true });
    const featureSlug = slugify(featureId, { lower: true });
    const storySlug = slugify(story.id, { lower: true });
    
    const storyPath = path.join(
      this.getBacklogDir(),
      'epics',
      epicSlug,
      'features',
      featureSlug,
      'user-stories',
      `${storySlug}.md`
    );
    
    // Enregistrer l'emplacement de la user story dans la map
    this.userStoryMap.set(story.id, {
      epicId,
      featureId,
      path: storyPath
    });
    
    // Générer le contenu du fichier user story
    const storyContent = this.generateUserStoryMarkdown(story, featureId, epicId);
    
    // Créer le dossier parent si nécessaire
    await fs.ensureDir(path.dirname(storyPath));
    
    // Écrire le fichier
    await fs.writeFile(storyPath, storyContent);
    
    console.log(chalk.green(`✅ User Story créée: ${storyPath}`));
    return storyPath;
  }

  /**
   * Crée un fichier MVP avec des références aux user stories
   * @param {Array<Object>} stories - Liste des user stories du MVP
   * @returns {Promise<string>} Chemin du fichier MVP créé
   */
  async createMvpFile(stories) {
    if (!Array.isArray(stories)) {
      throw new Error('La liste des stories doit être un tableau');
    }
    
    const mvpPath = path.join(this.getBacklogDir(), 'planning', 'mvp', 'mvp.md');
    
    // Générer le contenu du fichier MVP
    const mvpContent = this.generateMvpMarkdown(stories);
    
    // Créer le dossier parent si nécessaire
    await fs.ensureDir(path.dirname(mvpPath));
    
    // Écrire le fichier
    await fs.writeFile(mvpPath, mvpContent);
    
    console.log(chalk.green(`✅ MVP créé: ${mvpPath}`));
    return mvpPath;
  }

  /**
   * Crée un fichier d'itération avec des références aux user stories
   * @param {Object} iteration - Données de l'itération
   * @returns {Promise<string>} Chemin du fichier d'itération créé
   */
  async createIterationFile(iteration) {
    if (!iteration || !iteration.name || !Array.isArray(iteration.stories)) {
      throw new Error('Itération invalide, nom manquant ou stories non valides');
    }
    
    const iterationSlug = slugify(iteration.name, { lower: true });
    const iterationDir = path.join(
      this.getBacklogDir(),
      'planning',
      'iterations',
      iterationSlug
    );
    
    const iterationPath = path.join(iterationDir, 'iteration.md');
    
    // Créer le dossier
    await fs.ensureDir(iterationDir);
    
    // Générer le contenu du fichier d'itération
    const iterationContent = this.generateIterationMarkdown(iteration);
    
    // Écrire le fichier
    await fs.writeFile(iterationPath, iterationContent);
    
    console.log(chalk.green(`✅ Itération créée: ${iterationPath}`));
    return iterationPath;
  }

  /**
   * Génère le contenu markdown pour un epic
   * @param {Object} epic - Données de l'epic
   * @returns {string} Contenu markdown
   */
  generateEpicMarkdown(epic) {
    const title = epic.title || 'Epic sans titre';
    const description = epic.description || 'Aucune description fournie.';
    
    return `# ${title}\n\n## Description\n\n${description}\n\n## Features\n\nCet epic contient les features suivantes :\n\n- [Liste des features](./features/)\n`;
  }

  /**
   * Génère le contenu markdown pour une feature
   * @param {Object} feature - Données de la feature
   * @param {string} epicId - ID de l'epic parent
   * @returns {string} Contenu markdown
   */
  generateFeatureMarkdown(feature, epicId) {
    const title = feature.title || 'Feature sans titre';
    const description = feature.description || 'Aucune description fournie.';
    const epicSlug = slugify(epicId, { lower: true });
    
    const epicLink = path.join('..', '..', 'epic.md');
    
    return `# ${title}\n\n## Description\n\n${description}\n\n## Epic parent\n\nCette feature fait partie de l'epic [${epicId}](${epicLink})\n\n## User Stories\n\nCette feature contient les user stories suivantes :\n\n- [Liste des user stories](./user-stories/)\n`;
  }

  /**
   * Génère le contenu markdown pour une user story
   * @param {Object} story - Données de la user story
   * @param {string} featureId - ID de la feature parente
   * @param {string} epicId - ID de l'epic parent
   * @returns {string} Contenu markdown
   */
  generateUserStoryMarkdown(story, featureId, epicId) {
    const title = story.title || 'User story sans titre';
    const description = story.description || 'Aucune description fournie.';
    const criteria = story.acceptance_criteria || [];
    
    const epicSlug = slugify(epicId, { lower: true });
    const featureSlug = slugify(featureId, { lower: true });
    
    const epicLink = path.join('..', '..', '..', '..', 'epic.md');
    const featureLink = path.join('..', '..', 'feature.md');
    
    let content = `# ${title}\n\n## Description\n\n${description}\n\n`;
    
    // Ajouter les critères d'acceptation s'ils existent
    if (criteria.length > 0) {
      content += "## Critères d'acceptation\n\n";
      criteria.forEach(criterion => {
        content += `- ${criterion}\n`;
      });
      content += '\n';
    }
    
    // Ajouter les liens vers l'epic et la feature parents
    content += `## Hiérarchie\n\n`;
    content += `- Epic: [${epicId}](${epicLink})\n`;
    content += `- Feature: [${featureId}](${featureLink})\n`;
    
    return content;
  }

  /**
   * Génère le contenu markdown pour le MVP
   * @param {Array<Object>} stories - Liste des user stories du MVP
   * @returns {string} Contenu markdown
   */
  generateMvpMarkdown(stories) {
    let content = `# MVP - User Stories\n\n`;
    content += `Ce document liste les user stories qui font partie du MVP (Minimum Viable Product).\n\n`;
    content += `## User Stories\n\n`;
    
    stories.forEach(story => {
      // Récupérer les informations de la story depuis la map
      const storyInfo = this.userStoryMap.get(story.id);
      
      if (storyInfo) {
        const epicSlug = slugify(storyInfo.epicId, { lower: true });
        const featureSlug = slugify(storyInfo.featureId, { lower: true });
        const storySlug = slugify(story.id, { lower: true });
        
        // Construire le chemin relatif
        const relativePath = path.join('..', '..', 'epics', epicSlug, 'features', featureSlug, 'user-stories', `${storySlug}.md`);
        
        // Convertir le chemin pour utiliser des / (format markdown)
        const formattedPath = relativePath.split(path.sep).join('/');
        
        content += `- [${story.title || story.id}](${formattedPath})\n`;
      } else {
        content += `- ${story.title || story.id} (référence non trouvée)\n`;
      }
    });
    
    return content;
  }

  /**
   * Génère le contenu markdown pour une itération
   * @param {Object} iteration - Données de l'itération
   * @returns {string} Contenu markdown
   */
  generateIterationMarkdown(iteration) {
    let content = `# Itération: ${iteration.name}\n\n`;
    
    if (iteration.description) {
      content += `## Description\n\n${iteration.description}\n\n`;
    }
    
    content += `## User Stories\n\n`;
    
    iteration.stories.forEach(story => {
      // Récupérer les informations de la story depuis la map
      const storyInfo = this.userStoryMap.get(story.id);
      
      if (storyInfo) {
        const epicSlug = slugify(storyInfo.epicId, { lower: true });
        const featureSlug = slugify(storyInfo.featureId, { lower: true });
        const storySlug = slugify(story.id, { lower: true });
        
        // Construire le chemin relatif
        const relativePath = path.join('..', '..', '..', 'epics', epicSlug, 'features', featureSlug, 'user-stories', `${storySlug}.md`);
        
        // Convertir le chemin pour utiliser des / (format markdown)
        const formattedPath = relativePath.split(path.sep).join('/');
        
        content += `- [${story.title || story.id}](${formattedPath})\n`;
      } else {
        content += `- ${story.title || story.id} (référence non trouvée)\n`;
      }
    });
    
    return content;
  }
}

module.exports = { FileManager };
