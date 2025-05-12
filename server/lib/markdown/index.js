/**
 * Module façade pour la génération de fichiers markdown
 * @module markdown
 * @description Coordonne la génération des fichiers markdown pour les epics, features et user stories
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { handleMarkdownError } = require('./utils');
const { createEpicFormatter } = require('./epic-formatter');
const { createFeatureFormatter } = require('./feature-formatter');
const { createStoryFormatter } = require('./story-formatter');

/**
 * Génère un ID unique pour un élément
 * @param {string} prefix - Préfixe de l'ID (ex: 'epic', 'feature', 'story')
 * @returns {string} ID unique avec timestamp et nombre aléatoire
 */
function generateUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

/**
 * Fusionne les informations du projet entre deux backlogs
 * @param {Object} target - Backlog cible à mettre à jour
 * @param {Object} source - Backlog source contenant les nouvelles informations
 * @param {string} [source.project_title] - Titre du projet source
 * @param {string} [source.project_description] - Description du projet source
 * @returns {Object} Backlog cible mis à jour
 */
function mergeProjectInfo(target, source) {
  if (!target || typeof target !== 'object') {
    throw new Error('Le backlog cible doit être un objet valide');
  }
  
  if (!source || typeof source !== 'object') {
    return target; // Rien à fusionner
  }
  
  if (source.project_title || source.project_description) {
    target.project_title = source.project_title || target.project_title;
    target.project_description = source.project_description || target.project_description;
  }
  
  return target;
}

/**
 * Fusionne les user stories d'une feature
 * @param {Object} existingFeature - Feature existante à mettre à jour
 * @param {Array} [existingFeature.stories] - User stories existantes
 * @param {Object} newFeature - Nouvelle feature contenant des user stories à fusionner
 * @param {Array} [newFeature.stories] - Nouvelles user stories à fusionner
 * @returns {Object} Feature mise à jour avec les user stories fusionnées
 */
function mergeStories(existingFeature, newFeature) {
  if (!existingFeature || typeof existingFeature !== 'object') {
    throw new Error('La feature existante doit être un objet valide');
  }
  
  // Initialiser le tableau de stories si nécessaire
  existingFeature.stories = existingFeature.stories || [];
  
  // Rien à fusionner
  if (!newFeature?.stories?.length) {
    return existingFeature;
  }
  
  // Traiter chaque nouvelle story
  for (const newStory of newFeature.stories) {
    // Générer un ID si nécessaire
    if (!newStory.id) {
      newStory.id = generateUniqueId('story');
    }
    
    // Vérifier si cette story existe déjà
    const existingStoryIndex = findExistingItemIndex(existingFeature.stories, newStory);
    
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
  
  return existingFeature;
}

/**
 * Vérifie si un élément existe déjà dans un tableau par ID ou titre
 * @param {Array} items - Tableau d'éléments à vérifier
 * @param {Object} newItem - Élément à rechercher
 * @param {string} [newItem.id] - ID de l'élément à rechercher
 * @param {string} [newItem.title] - Titre de l'élément à rechercher
 * @returns {number} Index de l'élément s'il existe, -1 sinon
 */
function findExistingItemIndex(items, newItem) {
  if (!Array.isArray(items)) {
    return -1;
  }
  
  if (!newItem) {
    return -1;
  }
  
  return items.findIndex(
    item => (item?.id && newItem?.id && item.id === newItem.id) || 
           (item?.title && newItem?.title && item.title === newItem.title)
  );
}

/**
 * Fusionne les features d'un epic
 * @param {Object} existingEpic - Epic existant à mettre à jour
 * @param {Array} [existingEpic.features] - Features existantes
 * @param {Object} newEpic - Nouvel epic contenant des features à fusionner
 * @param {Array} [newEpic.features] - Nouvelles features à fusionner
 * @returns {Object} Epic mis à jour avec les features fusionnées
 */
function mergeFeatures(existingEpic, newEpic) {
  if (!existingEpic || typeof existingEpic !== 'object') {
    throw new Error('L\'epic existant doit être un objet valide');
  }
  
  // Initialiser le tableau de features si nécessaire
  existingEpic.features = existingEpic.features || [];
  
  // Pas de features à fusionner
  if (!newEpic?.features?.length) {
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
 * Fusionne les epics entre deux backlogs
 * @param {Object} target - Backlog cible
 * @param {Array} [target.epics] - Epics existants dans le backlog cible
 * @param {Object} source - Backlog source
 * @param {Array} [source.epics] - Epics à fusionner depuis le backlog source
 * @returns {Object} Backlog avec les epics fusionnés
 * @throws {Error} Si le backlog cible n'est pas un objet valide
 */
function mergeEpics(target, source) {
  if (!target || typeof target !== 'object') {
    throw new Error('Le backlog cible doit être un objet valide');
  }
  
  // Initialiser le tableau d'epics si nécessaire
  target.epics = target.epics || [];
  
  // Pas d'epics à fusionner
  if (!source?.epics?.length) {
    return target;
  }
  
  // Traiter chaque epic
  for (const newEpic of source.epics) {
    // Générer un ID si nécessaire
    if (!newEpic.id) {
      newEpic.id = generateUniqueId('epic');
    }
    
    // Vérifier si cet epic existe déjà
    const existingEpicIndex = findExistingItemIndex(target.epics, newEpic);
    
    if (existingEpicIndex >= 0) {
      // Fusionner les features de l'epic existant
      const existingEpic = target.epics[existingEpicIndex];
      mergeFeatures(existingEpic, newEpic);
    } else {
      // Ajouter le nouvel epic
      target.epics.push(newEpic);
    }
  }
  
  return target;
}

/**
 * Ajoute des références de stories à une itération
 * @param {Object} iteration - Itération cible 
 * @param {Array} [iteration.stories] - Stories existantes dans l'itération
 * @param {Array} storyRefs - Références de stories à ajouter
 * @returns {Object} Itération mise à jour avec les nouvelles références de stories
 * @throws {Error} Si l'itération n'est pas un objet valide
 */
function addStoryRefsToIteration(iteration, storyRefs) {
  if (!iteration || typeof iteration !== 'object') {
    throw new Error('L\'itération cible doit être un objet valide');
  }
  
  // Initialiser le tableau de stories si nécessaire
  iteration.stories = iteration.stories || [];
  
  // Rien à ajouter
  if (!storyRefs?.length) {
    return iteration;
  }
  
  // Ajouter chaque référence non existante
  for (const ref of storyRefs) {
    const existingRefIndex = findExistingItemIndex(iteration.stories, ref);
    
    if (existingRefIndex === -1) {
      iteration.stories.push(ref);
    }
  }
  
  return iteration;
}

/**
 * Fusionne les itérations entre deux backlogs
 * @param {Object} target - Backlog cible
 * @param {Array} [target.iterations] - Itérations existantes dans le backlog cible
 * @param {Object} source - Backlog source
 * @param {Array} [source.iterations] - Itérations à fusionner depuis le backlog source
 * @returns {Object} Backlog avec les itérations fusionnées
 * @throws {Error} Si le backlog cible n'est pas un objet valide
 */
function mergeIterations(target, source) {
  if (!target || typeof target !== 'object') {
    throw new Error('Le backlog cible doit être un objet valide');
  }
  
  // Initialiser le tableau d'itérations si nécessaire
  target.iterations = target.iterations || [];
  
  // Pas d'itérations à fusionner
  if (!source?.iterations?.length) {
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
 * Fusionne les informations de MVP entre deux backlogs
 * @param {Object} target - Backlog cible
 * @param {Object} [target.mvp] - MVP existant dans le backlog cible
 * @param {Object} source - Backlog source
 * @param {Object} [source.mvp] - MVP à fusionner depuis le backlog source
 * @returns {Object} Backlog avec le MVP fusionné
 * @throws {Error} Si le backlog cible n'est pas un objet valide
 */
function mergeMVP(target, source) {
  if (!target || typeof target !== 'object') {
    throw new Error('Le backlog cible doit être un objet valide');
  }
  
  // Si aucun des backlogs n'a de MVP, on n'a rien à faire
  if (!source?.mvp && !target?.mvp) {
    return target;
  }
  
  if (!target.mvp && source?.mvp) {
    // Copie simple si seulement la source a un MVP
    target.mvp = { ...source.mvp };
  } else if (target.mvp && source?.mvp) {
    // Fusion si les deux ont un MVP
    target.mvp.title = source.mvp.title || target.mvp.title;
    target.mvp.description = source.mvp.description || target.mvp.description;
    
    // Fusionner les références aux stories
    addStoryRefsToIteration(target.mvp, source.mvp.stories);
  }
  
  return target;
}

/**
 * Fusionne deux structures complètes de backlog
 * @param {Object|null} existingBacklog - Backlog existant, peut être null
 * @param {Object|null} newBacklog - Nouveau backlog à fusionner, peut être null
 * @returns {Object} Backlog fusionné contenant les informations des deux backlogs
 */
function mergeBacklogs(existingBacklog, newBacklog) {
  // Si pas de backlog existant, on retourne simplement le nouveau
  if (!existingBacklog || typeof existingBacklog !== 'object') {
    return newBacklog ? { ...newBacklog } : {};
  }
  
  // Si pas de nouveau backlog, on retourne simplement l'existant
  if (!newBacklog || typeof newBacklog !== 'object') {
    return { ...existingBacklog };
  }
  
  // Créer une copie profonde pour la fusion
  const merged = JSON.parse(JSON.stringify(existingBacklog));
  
  try {
    // Fusionner les infos projet
    mergeProjectInfo(merged, newBacklog);
    
    // Fusionner les epics et leurs contenus
    mergeEpics(merged, newBacklog);
    
    // Fusionner les itérations s'il y en a
    mergeIterations(merged, newBacklog);
    
    // Fusionner le MVP s'il y en a un
    mergeMVP(merged, newBacklog);
    
    return merged;
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la fusion des backlogs: ${error.message}`));
    // En cas d'erreur, on retourne une copie de l'existant pour éviter de perdre des données
    return { ...existingBacklog };
  }
}

function createMarkdownGenerator(options = {}) {
  // Créer tous les formateurs nécessaires
  const epicFormatter = createEpicFormatter(options);
  const featureFormatter = createFeatureFormatter(options);
  const storyFormatter = createStoryFormatter(options);
  
  /**
   * Fonction principale pour générer les fichiers markdown
   * @param {Object} result - Résultat structuré de la génération du backlog
   * @param {string} outputDir - Répertoire de sortie
   * @returns {Promise<Object>} - Structure JSON du backlog générée
   */
  async function generateMarkdownFilesFromResult(result, outputDir) {
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid backlog data provided.');
    }
    if (!outputDir || typeof outputDir !== 'string') {
      throw new Error('Invalid output directory provided.');
    }

    console.error(chalk.magentaBright(`[MD GEN] Demarrage de la génération des fichiers Markdown (stderr)...`));

    const userStoryMap = new Map();
    // Valider le résultat du backlog
    if (!result || typeof result !== 'object') {
      throw new Error('Format de résultat de backlog invalide.');
    }
    if (!result.projectName) {
      throw new Error('Le nom du projet est manquant dans le résultat du backlog.');
    }

    // Initialisation des chemins
    // outputDir is the intended root, e.g., D:\\Projets-dev\\MCP\\AgilePlanner\\.agile-planner-backlog
    // It should not be further nested with another '.agile-planner-backlog'
    const baseOutputDir = outputDir; 
    // projectBaseDir might be used if a root project file specific to the slug is needed, 
    // but epics and orphan_stories should be directly under baseOutputDir as per RULE 3.
    // const projectBaseDir = path.join(baseOutputDir, projectSlug); 

    // Epics and orphan stories should be directly under baseOutputDir
    const epicsBaseDir = path.join(baseOutputDir, 'epics');
    const orphanStoriesBaseDir = path.join(baseOutputDir, 'orphan-stories');

    try {
      await fs.ensureDir(baseOutputDir);
      await fs.ensureDir(epicsBaseDir);
      await fs.ensureDir(orphanStoriesBaseDir);
      console.error(chalk.blue(`[MD GEN] Répertoire de base du backlog assuré : ${baseOutputDir} (stderr)`));

      // Process epics, features, and their stories
      await _processEpics(result.epics, epicsBaseDir, userStoryMap);

      // Process orphan stories
      await _processOrphanStories(result.orphan_stories, orphanStoriesBaseDir, userStoryMap);

      // Prepare data for backlog.json (audit file)
      const createdEpicsForJson = result.epics ? result.epics.map(e => ({ id: e.id, title: e.title, slug: e.slug })) : [];
      // Assuming story.slug is populated by _processOrphanStories via storyFormatter.processUserStory
      const createdOrphanStoriesForJson = result.orphan_stories ? result.orphan_stories.map(s => ({ id: s.id, title: s.title, slug: s.slug })) : [];

      const backlogJsonContent = {
        projectName: result.projectName,
        projectDescription: result.projectDescription,
        generatedAt: new Date().toISOString(),
        epics: createdEpicsForJson,
        orphan_stories: createdOrphanStoriesForJson,
        userStoriesLinked: Array.from(userStoryMap.values()).map(us => ({
          id: us.id,
          title: us.title,
          path: us.relativePath,
          feature: us.feature // This will be null for orphan stories, which is correct
        }))
      };

      const backlogJsonPath = path.join(outputDir, 'backlog.json');
      await fs.writeJson(backlogJsonPath, backlogJsonContent, { spaces: 2 });
      console.error(chalk.magenta(`[MD GEN] ✅ Fichier d'audit backlog.json généré : ${backlogJsonPath} (stderr)`));

      console.error(chalk.greenBright('[MD GEN] ✅ Génération des fichiers Markdown terminée avec succès! (stderr)'));

      return {
        markdownPath: baseOutputDir,
        jsonPath: backlogJsonPath,
        userStoryMap
      };
    } catch (error) {
      console.error(chalk.red('[MD GEN] 🔥 Erreur critique pendant la génération Markdown:'), error);
      throw handleMarkdownError('Failed to generate Markdown files', error);
    }
  }

  // Helper function to process stories within a feature
  async function _processStoriesInFeature(stories, featurePath, userStoryMap, parentFeature) {
    if (Array.isArray(stories) && stories.length > 0) {
      console.error(chalk.blue(`[MD GEN] 🔄 Traitement de ${stories.length} stories pour la feature "${parentFeature.title}" (stderr)...`));
      // storyFormatter.processUserStories handles creating 'user-stories' directory and processing each story
      await storyFormatter.processUserStories(stories, featurePath, userStoryMap, parentFeature);
    } else {
      console.error(chalk.yellow(`[MD GEN] ⚠️ Aucune story trouvée pour la feature "${parentFeature.title}" (stderr)`));
      // Create a README in an empty user-stories directory if no stories
      const userStoriesDir = path.join(featurePath, 'user-stories');
      await fs.ensureDir(userStoriesDir);
      const readmePath = path.join(userStoriesDir, 'README.md');
      if (!await fs.pathExists(readmePath)) {
          const msg = `# 📭 Aucune user story générée pour cette feature\n\nCe dossier a été créé automatiquement par Agile Planner.`;
          await fs.writeFile(readmePath, msg);
      }
    }
  }

  // Helper function to process features within an epic
  async function _processFeatures(features, epicPath, userStoryMap, parentEpic) {
    console.error(`[MD GEN _processFeatures] Processing ${features ? features.length : 'N/A'} features for epic "${parentEpic ? parentEpic.title : 'PARENT_EPIC_UNDEFINED'}". Output path: ${epicPath} (stderr)`);
    
    if (Array.isArray(features) && features.length > 0) {
      console.error(chalk.blue(`[MD GEN] 🔄 Traitement de ${features.length} features pour l'epic "${parentEpic.title}" (stderr)...`));
      const featuresDir = path.join(epicPath, 'features');
      await fs.ensureDir(featuresDir);

      for (const feature of features) {
        if (!feature.slug || feature.slug.trim() === '') {
          feature.slug = featureFormatter.generateSlug(feature.title);
          console.error(chalk.yellow(`[MD GEN] ⚠️ Slug manquant ou vide pour la feature "${feature.title}", généré : "${feature.slug}" (stderr)`));
        }
        const featurePath = path.join(featuresDir, feature.slug);
        await fs.ensureDir(featurePath);
        const parentEpicInfo = parentEpic ? `Yes, title: ${parentEpic.title}` : 'No, parentEpic IS UNDEFINED';
        console.error(`[MD GEN _processFeatures DEBUG] About to call featureFormatter.format for feature "${feature.title}". Is parentEpic defined? ${parentEpicInfo} (stderr)`);
        await featureFormatter.format(feature, featurePath, parentEpic);
        console.error(chalk.green(`✓ Feature document created: ${path.join(featurePath, 'feature.md')} (stderr)`));

        await _processStoriesInFeature.call(this, feature.stories, featurePath, userStoryMap, feature);
      }
    } else {
      console.error(chalk.yellow(`[MD GEN] ⚠️ Aucune feature trouvée pour l'epic "${parentEpic.title}" (stderr)`));
      // Create a README in an empty features directory if no features
      const featuresDir = path.join(epicPath, 'features');
      await fs.ensureDir(featuresDir);
      const readmePath = path.join(featuresDir, 'README.md');
       if (!await fs.pathExists(readmePath)) {
          const msg = `# 📭 Aucune feature générée pour cet epic\n\nCe dossier a été créé automatiquement par Agile Planner.`;
          await fs.writeFile(readmePath, msg);
      }
    }
  }

  // Helper function to process epics
  async function _processEpics(epics, epicsBaseDir, userStoryMap) {
    if (Array.isArray(epics) && epics.length > 0) {
      console.error(chalk.blue(`[MD GEN] 🔄 Traitement de ${epics.length} épiques (stderr)...`));
      for (const epic of epics) {
        if (!epic.slug || epic.slug.trim() === '') {
          epic.slug = epicFormatter.generateSlug(epic.title);
          console.error(chalk.yellow(`[MD GEN] ⚠️ Slug manquant ou vide pour l'epic "${epic.title}", généré : "${epic.slug}" (stderr)`));
        }
        const epicPath = path.join(epicsBaseDir, epic.slug);
        await fs.ensureDir(epicPath);
        await epicFormatter.format(epic, epicPath); // epicFormatter creates epic.md
        console.error(chalk.green(`✓ Epic document created: ${path.join(epicPath, 'epic.md')} (stderr)`));

        await _processFeatures.call(this, epic.features, epicPath, userStoryMap, epic);
      }
    } else {
      console.error(chalk.yellow('[MD GEN] ⚠️ Aucun épic trouvé (stderr).'));
    }
  }

  // Helper function to process orphan stories
  async function _processOrphanStories(stories, orphanStoriesBaseDir, userStoryMap) {
    if (Array.isArray(stories) && stories.length > 0) {
      console.error(chalk.blue(`[MD GEN] 🔄 Traitement de ${stories.length} stories orphelines (stderr)...`));
      await fs.ensureDir(orphanStoriesBaseDir);
      for (const story of stories) {
        // storyFormatter.processUserStory handles slug generation (if needed within formatUserStory) and file writing
        // It writes story.slug.md directly into orphanStoriesBaseDir
        await storyFormatter.processUserStory(story, orphanStoriesBaseDir, userStoryMap, null); // null for parentFeature
      }
    } else {
      console.error(chalk.yellow('[MD GEN] ⚠️ Aucune story orpheline trouvée (stderr).'));
    }
  }

  // API publique du générateur
  return {
    generateMarkdownFilesFromResult
  };
}

// Export the factory function at the module level
module.exports = {
  createMarkdownGenerator
};
