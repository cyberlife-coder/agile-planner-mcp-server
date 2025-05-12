/**
 * @deprecated Ce module est obsolète depuis Wave 8 (mai 2025)
 * 
 * Les fonctionnalités d'itération ont été refactorisées et intégrées dans le système de génération
 * principal via le pattern factory dans index.js. Cette approche permet une meilleure séparation
 * des responsabilités et une plus grande facilité de test.
 * 
 * Note de maintenance:
 * - Ce fichier est conservé temporairement pour référence et rétrocompatibilité
 * - À supprimer complètement dans la version 1.5.0 (selon RULE 2)
 * - Les tests affectés devront être mis à jour pour utiliser la nouvelle API
 * 
 * @see server/lib/markdown/index.js pour l'implémentation actuelle
 */
module.exports = {
  createIterationFormatter,
  processIterations,
  processIteration
};

// Import manquants intentionnellement non résolus pour marquer clairement l'obsolète
// Ces erreurs aideront à détecter l'utilisation de ce module dans le code
const { createSlug, handleMarkdownError, markdownInstructions } = require('./utils');
const fs = require('fs-extra');
const chalk = require('chalk');
// NOTE: path est importé mais non utilisé dans ce module obsolète
// const path = require('path');
function generateIterationHeader(iterationName, goal) {
  return `# Iteration: ${iterationName}\n\n${markdownInstructions.iterationFileInstructions}\n## Goal\n\n${goal}\n\n## User Stories\n\n`;
}

/**
 * Traite une itération individuelle
 * @param {Object} iteration - Donnée de l'itération
 * @param {string} backlogDir - Répertoire de base du backlog
 * @param {Map} userStoryMap - Map des user stories
 * @param {Object} backlogJson - Structure JSON du backlog
 * @returns {Promise<void>}
 */
async function processIteration(iteration, backlogDir, userStoryMap, backlogJson) {
  const iterationName = iteration.name;
  const iterationSlug = createSlug(iterationName);
  
  // Créer les chemins
  const paths = createIterationPaths(backlogDir, iterationSlug);
  
  // Créer le répertoire si nécessaire
  await fs.ensureDir(paths.directory);
  
  // Initialiser le contenu et les données JSON
  let iterationContent = generateIterationHeader(iterationName, iteration.goal);
  
  const iterationJson = {
    name: iterationName,
    goal: iteration.goal,
    slug: iterationSlug,
    stories: []
  };
  
  // Traiter les stories de l'itération
  if (iteration.stories && Array.isArray(iteration.stories)) {
    for (const story of iteration.stories) {
      const result = processIterationStory(story, userStoryMap);
      iterationContent += result.content;
      iterationJson.stories.push(result.json);
    }
  }
  
  // Écrire le fichier d'itération
  await fs.writeFile(paths.filePath, iterationContent);
  console.error(chalk.green(`✓ Iteration document created: ${paths.filePath}`));
  
  // Ajouter au backlog JSON
  iterationJson.path = paths.relativePath;
  backlogJson.iterations.push(iterationJson);
}

/**
 * Process iterations and create iteration markdown files
 * @param {Object} iterations - Iterations object
 * @param {string} backlogDir - Base backlog directory
 * @param {Map} userStoryMap - Map to track user stories
 * @param {Object} backlogJson - Backlog JSON structure
 * @returns {Promise<void>}
 */
async function processIterations(iterations, backlogDir, userStoryMap, backlogJson) {
  // Validation initiale
  if (!iterations || !Array.isArray(iterations) || iterations.length === 0) {
    console.warn(chalk.yellow('⚠️ No iterations found, skipping iterations processing'));
    return;
  }
  
  // Initialisation du tableau des itérations
  backlogJson.iterations = [];
  
  try {
    // Traiter chaque itération
    for (const iteration of iterations) {
      await processIteration(iteration, backlogDir, userStoryMap, backlogJson);
    }
  } catch (error) {
    throw handleMarkdownError('Error processing iterations', error);
  }
}

/**
 * Factory function pour créer un formateur d'itérations
 * @param {Object} options - Options de configuration
 * @returns {Object} - API du formateur d'itérations
 */
function createIterationFormatter(options = {}) {
  return {
    processIterations
  };
}

// Ce module est désormais obsolète : la génération des itérations est supprimée.
