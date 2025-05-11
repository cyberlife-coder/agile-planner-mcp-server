/**
 * Module obsolète : ce fichier ne doit plus être utilisé.
 */
module.exports = {
  createIterationFormatter,
  processIterations,
  processIteration
};
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
  console.log(chalk.green(`✓ Iteration document created: ${paths.filePath}`));
  
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
