// Module façade pour la génération de fichiers markdown
// @module markdown

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { handleMarkdownError } = require('./utils');
const { createEpicFormatter } = require('./epic-formatter');
const { createFeatureFormatter } = require('./feature-formatter');
const { createStoryFormatter } = require('./story-formatter');

// Génère un ID unique pour un élément
function generateUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Fusionne les informations du projet
function mergeProjectInfo(target, source) {
  if (source.project_title || source.project_description) {
    target.project_title = source.project_title || target.project_title;
    target.project_description = source.project_description || target.project_description;
  }
  return target;
}

// Fusionne les user stories d'une feature
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

// Vérifie si un élément existe déjà par ID ou titre
function findExistingItemIndex(items, newItem) {
  return items.findIndex(
    item => (item.id && item.id === newItem.id) || (item.title && item.title === newItem.title)
  );
}

// Fusionne les features d'un epic
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

    console.log(chalk.cyan('[MD GEN] Demarrage de la génération des fichiers Markdown...'));

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
      console.log(chalk.blue(`[MD GEN] Répertoire de base du backlog assuré : ${baseOutputDir}`));

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
      console.log(chalk.magenta(`[MD GEN] ✅ Fichier d'audit backlog.json généré : ${backlogJsonPath}`));

      console.log(chalk.greenBright('[MD GEN] ✅ Génération des fichiers Markdown terminée avec succès!'));

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
      console.log(chalk.blue(`[MD GEN] 🔄 Traitement de ${stories.length} stories pour la feature "${parentFeature.title}"...`));
      // storyFormatter.processUserStories handles creating 'user-stories' directory and processing each story
      await storyFormatter.processUserStories(stories, featurePath, userStoryMap, parentFeature);
    } else {
      console.log(chalk.yellow(`[MD GEN] ⚠️ Aucune story trouvée pour la feature "${parentFeature.title}"`));
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
    console.log(`[MD GEN _processFeatures] Processing ${features.length} features for epic "${parentEpic ? parentEpic.title : 'PARENT EPIC UNDEFINED AT START OF _processFeatures?!'}". Output path: ${epicPath}`);
    
    if (Array.isArray(features) && features.length > 0) {
      console.log(chalk.blue(`[MD GEN] 🔄 Traitement de ${features.length} features pour l'epic "${parentEpic.title}"...`));
      const featuresDir = path.join(epicPath, 'features');
      await fs.ensureDir(featuresDir);

      for (const feature of features) {
        if (!feature.slug || feature.slug.trim() === '') {
          feature.slug = featureFormatter.generateSlug(feature.title);
          console.warn(chalk.yellow(`[MD GEN] ⚠️ Slug manquant ou vide pour la feature "${feature.title}", généré : "${feature.slug}"`));
        }
        const featurePath = path.join(featuresDir, feature.slug);
        await fs.ensureDir(featurePath);
        const parentEpicInfo = parentEpic ? `Yes, title: ${parentEpic.title}` : 'No, parentEpic IS UNDEFINED';
        console.log(`[MD GEN _processFeatures DEBUG] About to call featureFormatter.format for feature "${feature.title}". Is parentEpic defined? ${parentEpicInfo}`);
        await featureFormatter.format(feature, featurePath, parentEpic);
        console.log(chalk.green(`✓ Feature document created: ${path.join(featurePath, 'feature.md')}`));

        await _processStoriesInFeature(feature.stories, featurePath, userStoryMap, feature);
      }
    } else {
      console.log(chalk.yellow(`[MD GEN] ⚠️ Aucune feature trouvée pour l'epic "${parentEpic.title}"`));
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
      console.log(chalk.blue(`[MD GEN] 🔄 Traitement de ${epics.length} épiques...`));
      for (const epic of epics) {
        if (!epic.slug || epic.slug.trim() === '') {
          epic.slug = epicFormatter.generateSlug(epic.title);
          console.warn(chalk.yellow(`[MD GEN] ⚠️ Slug manquant ou vide pour l'epic "${epic.title}", généré : "${epic.slug}"`));
        }
        const epicPath = path.join(epicsBaseDir, epic.slug);
        await fs.ensureDir(epicPath);
        await epicFormatter.format(epic, epicPath); // epicFormatter creates epic.md
        console.log(chalk.green(`✓ Epic document created: ${path.join(epicPath, 'epic.md')}`));

        await _processFeatures(epic.features, epicPath, userStoryMap, epic);
      }
    } else {
      console.log(chalk.yellow('[MD GEN] ⚠️ Aucun épic trouvé.'));
    }
  }

  // Helper function to process orphan stories
  async function _processOrphanStories(stories, orphanStoriesBaseDir, userStoryMap) {
    if (Array.isArray(stories) && stories.length > 0) {
      console.log(chalk.blue(`[MD GEN] 🔄 Traitement de ${stories.length} stories orphelines...`));
      await fs.ensureDir(orphanStoriesBaseDir);
      for (const story of stories) {
        // storyFormatter.processUserStory handles slug generation (if needed within formatUserStory) and file writing
        // It writes story.slug.md directly into orphanStoriesBaseDir
        await storyFormatter.processUserStory(story, orphanStoriesBaseDir, userStoryMap, null); // null for parentFeature
      }
    } else {
      console.log(chalk.yellow('[MD GEN] ⚠️ Aucune story orpheline trouvée.'));
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
