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

 * @returns {Object} - API du générateur de markdown
 */
/**
 * Génère un ID unique pour un élément
 * @param {string} prefix - Préfixe de l'ID (epic, feature, story)
 * @returns {string} - ID unique
 */
function generateUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Fusionne les informations du projet
 * @param {Object} target - Backlog cible
 * @param {Object} source - Backlog source
 * @returns {Object} - Backlog avec les informations du projet fusionnées
 */
function mergeProjectInfo(target, source) {
  if (source.project_title || source.project_description) {
    target.project_title = source.project_title || target.project_title;
    target.project_description = source.project_description || target.project_description;
  }
  return target;
}

/**
 * Fusionne les user stories d'une feature
 * @param {Object} existingFeature - Feature existante
 * @param {Object} newFeature - Nouvelle feature
 * @returns {Object} - Feature avec les stories fusionnées
 */
function mergeStories(existingFeature, newFeature) {
  existingFeature.stories = existingFeature.stories || [];
  
  if (newFeature.stories && Array.isArray(newFeature.stories)) {
    for (const newStory of newFeature.stories) {
      // Générer un ID si nécessaire
      if (!newStory.id) {
        newStory.id = generateUniqueId('story');
      }
      
      // Vérifier si cette story existe déjà
      const existingStoryIndex = existingFeature.stories.findIndex(
        s => (s.id && s.id === newStory.id) || (s.title && s.title === newStory.title)
      );
      
      if (existingStoryIndex >= 0) {
        // Mettre à jour la story existante
        existingFeature.stories[existingStoryIndex] = {
          ...existingFeature.stories[existingStoryIndex],
          ...newStory
        };
      } else {
        // Ajouter la nouvelle story
        existingFeature.stories.push(newStory);
      }
    }
  }
  
  return existingFeature;
}

/**
 * Vérifie si un élément existe déjà par ID ou titre
 * @param {Array} items - Liste d'éléments à vérifier
 * @param {Object} newItem - Nouvel élément à rechercher
 * @returns {number} - Index de l'élément s'il existe, -1 sinon
 */
function findExistingItemIndex(items, newItem) {
  return items.findIndex(
    item => (item.id && item.id === newItem.id) || (item.title && item.title === newItem.title)
  );
}

/**
 * Fusionne les features d'un epic
 * @param {Object} existingEpic - Epic existant
 * @param {Object} newEpic - Nouvel epic
 * @returns {Object} - Epic avec les features fusionnées
 */
function mergeFeatures(existingEpic, newEpic) {
  existingEpic.features = existingEpic.features || [];
  
  // Pas de features à fusionner
  if (!newEpic.features || !Array.isArray(newEpic.features)) {
    return existingEpic;
  }
  
  // Traiter chaque feature
  for (const newFeature of newEpic.features) {
    // Générer un ID si nécessaire
    if (!newFeature.id) {
      newFeature.id = generateUniqueId('feature');
    }
    
    // Rechercher une feature existante
    const existingFeatureIndex = findExistingItemIndex(existingEpic.features, newFeature);
    
    if (existingFeatureIndex >= 0) {
      // Mettre à jour la feature existante
      const existingFeature = existingEpic.features[existingFeatureIndex];
      mergeStories(existingFeature, newFeature);
    } else {
      // Ajouter la nouvelle feature
      existingEpic.features.push(newFeature);
    }
  }
  
  return existingEpic;
}

/**
 * Fusionne les epics
 * @param {Object} target - Backlog cible
 * @param {Object} source - Backlog source
 * @returns {Object} - Backlog avec les epics fusionnés
 */
function mergeEpics(target, source) {
  target.epics = target.epics || [];
  
  if (source.epics && Array.isArray(source.epics)) {
    for (const newEpic of source.epics) {
      // Générer un ID si nécessaire
      if (!newEpic.id) {
        newEpic.id = generateUniqueId('epic');
      }
      
      // Vérifier si cet epic existe déjà
      const existingEpicIndex = target.epics.findIndex(
        e => (e.id && e.id === newEpic.id) || (e.title && e.title === newEpic.title)
      );
      
      if (existingEpicIndex >= 0) {
        // Fusionner les features de l'epic existant
        const existingEpic = target.epics[existingEpicIndex];
        mergeFeatures(existingEpic, newEpic);
      } else {
        // Ajouter le nouvel epic
        target.epics.push(newEpic);
      }
    }
  }
  
  return target;
}

/**
 * Ajoute des références de stories à une itération
 * @param {Object} iteration - Itération cible 
 * @param {Array} storyRefs - Références de stories à ajouter
 */
function addStoryRefsToIteration(iteration, storyRefs) {
  if (!storyRefs || !Array.isArray(storyRefs)) {
    return;
  }
  
  iteration.stories = iteration.stories || [];
  
  for (const storyRef of storyRefs) {
    if (!iteration.stories.some(s => s.id === storyRef.id)) {
      iteration.stories.push(storyRef);
    }
  }
}

/**
 * Fusionne les itérations
 * @param {Object} target - Backlog cible
 * @param {Object} source - Backlog source
 * @returns {Object} - Backlog avec les itérations fusionnées
 */
function mergeIterations(target, source) {
  target.iterations = target.iterations || [];
  
  // Pas d'itérations à fusionner
  if (!source.iterations || !Array.isArray(source.iterations)) {
    return target;
  }
  
  // Traiter chaque itération
  for (const newIteration of source.iterations) {
    // Vérifier si cette itération existe déjà
    const existingIterationIndex = findExistingItemIndex(target.iterations, newIteration);
    
    if (existingIterationIndex >= 0) {
      // Mettre à jour l'itération existante
      const existingIteration = target.iterations[existingIterationIndex];
      addStoryRefsToIteration(existingIteration, newIteration.stories);
    } else {
      // Ajouter la nouvelle itération
      target.iterations.push(newIteration);
    }
  }
  
  return target;
}

/**
 * Fusionne le MVP
 * @param {Object} target - Backlog cible
 * @param {Object} source - Backlog source
 * @returns {Object} - Backlog avec le MVP fusionné
 */
function mergeMVP(target, source) {
  // Pas de MVP à fusionner
  if (!source.mvp) {
    return target;
  }
  
  // MVP existant : fusionner les stories
  if (target.mvp) {
    addStoryRefsToIteration(target.mvp, source.mvp.stories);
    return target;
  }
  
  // Pas de MVP existant : copier le nouveau
  target.mvp = source.mvp;
  return target;
}

/**
 * Fusionne deux structures de backlog
 * @param {Object} existingBacklog - Backlog existant
 * @param {Object} newBacklog - Nouveau backlog à fusionner
 * @returns {Object} - Backlog fusionné
 */
function mergeBacklogs(existingBacklog, newBacklog) {
  // Si aucun backlog existant, retourner le nouveau
  if (!existingBacklog || Object.keys(existingBacklog).length === 0) {
    return newBacklog;
  }
  
  // Créer une copie profonde pour ne pas modifier les originaux
  const mergedBacklog = JSON.parse(JSON.stringify(existingBacklog));
  
  // Appliquer les fusions par type d'élément
  mergeProjectInfo(mergedBacklog, newBacklog);
  mergeEpics(mergedBacklog, newBacklog);
  mergeIterations(mergedBacklog, newBacklog);
  mergeMVP(mergedBacklog, newBacklog);
  
  // Mettre à jour la date de dernière modification
  mergedBacklog.updated_at = new Date().toISOString();
  
  console.log(chalk.green('✅ Fusion de backlog.json réussie'));
  return mergedBacklog;
}

function createMarkdownGenerator(options = {}) {
  // Créer tous les formateurs nécessaires
  const epicFormatter = createEpicFormatter(options);
  // Créer le formateur de features mais pas exposé directement - utilisé par epicFormatter
  createFeatureFormatter(options);
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
    
    // Importer le PathResolver pour gérer les chemins selon RULE 3
    const { PathResolver } = require('../utils/path-resolver');
    const pathResolver = new PathResolver();
    
    // Résoudre le chemin de base avec le PathResolver
    const baseDir = path.resolve(outputDir);
    console.log(chalk.blue(`📛 Chemin de base résolu: ${baseDir}`));
    
    // Obtenir le chemin du dossier backlog selon la structure RULE 3
    const backlogDir = pathResolver.getBacklogDir(baseDir);
    console.log(chalk.blue(`📛 Structure RULE 3 appliquée: ${backlogDir}`));
    
    try {
      console.log(chalk.blue('🔠 Generating markdown files from structured result...'));
      
      // CORRECTION: Créer TOUS les répertoires nécessaires selon RULE 3, même sans données
      console.log(chalk.yellow('🛠️ Création de tous les répertoires de la structure RULE 3...'));
      
      // 1. Répertoire principal
      await fs.ensureDir(backlogDir);
      
      // 2. Structure epics
      const epicsDir = path.join(backlogDir, 'epics');
      await fs.ensureDir(epicsDir);
      console.log(chalk.green(`✓ Répertoire epics créé: ${epicsDir}`));
      
      // 3. Structure planning
      const planningDir = path.join(backlogDir, 'planning');
      await fs.ensureDir(planningDir);
      
      // 4. Structure mvp
      const mvpDir = path.join(planningDir, 'mvp');
      await fs.ensureDir(mvpDir);
      console.log(chalk.green(`✓ Répertoire mvp créé: ${mvpDir}`));
      
      // 5. Structure iterations
      const iterationsDir = path.join(planningDir, 'iterations');
      await fs.ensureDir(iterationsDir);
      console.log(chalk.green(`✓ Répertoire iterations créé: ${iterationsDir}`));
      
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
      if (result.epics && Array.isArray(result.epics) && result.epics.length > 0) {
        console.log(chalk.blue(`🔄 Traitement de ${result.epics.length} épiques...`));
        await epicFormatter.processEpics(result.epics, backlogDir, userStoryMap, backlogJson);
      } else {
        console.log(chalk.yellow(`⚠️ Aucun épic trouvé dans le backlog, structure minimale créée`));
      }
      
      // Suppression du traitement des itérations et du MVP : tout est désormais géré via la structure épics/features/user-stories ou orphan-stories
      // Les informations MVP/itérations ne sont plus générées en markdown ni dans le backlog.json
      
      // AMÉLIORATION: Lire le fichier backlog.json existant et le fusionner avec le nouveau
      const backlogJsonPath = path.join(backlogDir, 'backlog.json');
      let existingBacklog = {};
      
      // Vérifier si le fichier existe déjà
      try {
        if (await fs.pathExists(backlogJsonPath)) {
          console.log(chalk.blue(`📄 Lecture du backlog.json existant: ${backlogJsonPath}`));
          const existingData = await fs.readFile(backlogJsonPath, 'utf8');
          existingBacklog = JSON.parse(existingData);
          console.log(chalk.blue(`ℹ️ Backlog existant trouvé avec ${existingBacklog.epics?.length || 0} epics et ${existingBacklog.iterations?.length || 0} itérations`));
        }
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ Impossible de lire le backlog.json existant: ${error.message}`));
        // Continuer avec un objet vide en cas d'erreur
      }
      
      // Nettoyage du backlog : suppression des sections mvp et iterations si elles existent
      if ('mvp' in backlogJson) delete backlogJson.mvp;
      if ('iterations' in backlogJson) delete backlogJson.iterations;
      if ('mvp' in existingBacklog) delete existingBacklog.mvp;
      if ('iterations' in existingBacklog) delete existingBacklog.iterations;

      // Fusionner les backlogs
      console.log(chalk.blue(`🔄 Fusion du backlog existant avec les nouvelles données...`));
      const mergedBacklog = mergeBacklogs(existingBacklog, backlogJson);

      // Écrire le backlog fusionné
      await fs.writeFile(backlogJsonPath, JSON.stringify(mergedBacklog, null, 2));
      console.log(chalk.green(`✓ Backlog JSON fusionné dans la structure RULE 3: ${backlogJsonPath}`));
      console.log(chalk.yellow(`📌 Note: Tous les fichiers sont générés uniquement dans la structure .agile-planner-backlog`));

      // Mettre à jour la variable backlogJson pour le retour
      Object.assign(backlogJson, mergedBacklog);

      return backlogJson;
    } catch (error) {
      throw handleMarkdownError('Error generating markdown files', error);
    }
  }
  
  // API publique du générateur
  // Exporter les fonctions pour les tests unitaires
  return {
    generateMarkdownFilesFromResult,
    createEpicFormatter,
    // Export des fonctions de fusion pour les tests
    mergeBacklogs,
    mergeProjectInfo,
    mergeEpics,
    mergeFeatures,
    mergeStories,
    mergeIterations,
    mergeMVP,
    // Fonction d'initialisation pour les tests
    initMarkdownModule: () => ({
      epicFormatter,
      storyFormatter,
      iterationFormatter,
      mvpFormatter
    })
  };
}

// Créer une instance par défaut pour la compatibilité avec l'API existante
const defaultGenerator = createMarkdownGenerator();

module.exports = {
  createMarkdownGenerator,
  generateMarkdownFilesFromResult: defaultGenerator.generateMarkdownFilesFromResult,
  formatUserStory: defaultGenerator.formatUserStory,
  // Exporter les fonctions de fusion pour les tests
  mergeBacklogs: defaultGenerator.mergeBacklogs,
  mergeProjectInfo: defaultGenerator.mergeProjectInfo,
  mergeEpics: defaultGenerator.mergeEpics,
  mergeFeatures: defaultGenerator.mergeFeatures,
  mergeStories: defaultGenerator.mergeStories,
  mergeIterations: defaultGenerator.mergeIterations,
  mergeMVP: defaultGenerator.mergeMVP,
  // Fonction d'initialisation pour les tests
  initMarkdownModule: defaultGenerator.initMarkdownModule
};
