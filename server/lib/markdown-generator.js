const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const slugify = require('slugify');

/**
 * AI automation instructions to add at the beginning of each file
 */
const aiAutomationInstructions = `
## 🤖 Instructions for AI

As an AI assistant, follow these guidelines when analyzing this document:
- Process the tasks below in the sequential order indicated
- Once a task is accomplished, mark it as completed by checking its box ([ ] → [x])
- Wait for user confirmation before moving to the next task
- Respect dependencies between tasks when mentioned
- Provide relevant suggestions based on acceptance criteria

---

`;

/**
 * Epic file specific instructions
 */
const epicFileInstructions = `
## 🤖 Epic Processing Instructions for AI

This file defines the main Epic of the project. When working with this file:
- Understand the overall vision and scope of the project from the Epic description
- Use this Epic as the strategic direction for all implementation work
- When implementing User Stories, always verify alignment with this Epic
- Suggest refinements to the Epic only if substantial project changes occur
- Comprendre la vision globale du projet depuis la description de l'Epic
- Vérifier l'alignement des User Stories avec cet Epic

---

`;

/**
 * MVP file specific instructions
 */
const mvpFileInstructions = `
## 🤖 MVP User Stories Instructions for AI

This file contains the Minimum Viable Product (MVP) User Stories that must be implemented first:
- Each User Story follows the format: "As a [role], I want [feature], so that [benefit]"
- Acceptance Criteria define the expected behavior and requirements
- Technical Tasks outline implementation steps (2-8 hour chunks of work)
- Priority indicates implementation order (HIGH → MEDIUM → LOW)
- Complete all HIGH priority stories before moving to MEDIUM priority ones

When implementing:
1. Start with one User Story at a time, in priority order
2. Implement all Technical Tasks for that User Story
3. Verify implementation against Acceptance Criteria
4. Mark User Story as complete only when all Acceptance Criteria are satisfied
5. Update task statuses by replacing [ ] with [x] when completed

Example of status update:
- [ ] Task to complete  →  - [x] Task completed

---

`;

/**
 * Iterations file specific instructions
 */
const iterationFileInstructions = `
## 🤖 Iteration Planning Instructions for AI

This file contains User Stories for a specific iteration (development cycle):
- The Iteration has a specific goal and thematic focus
- User Stories in this iteration contribute to that specific goal
- Dependencies indicate User Stories that must be completed first
- Only move to Iteration stories after completing the MVP User Stories

When planning work:
1. Check that all dependencies are completed first
2. Focus on delivering the cohesive goal of this iteration
3. Implement in priority order within the iteration
4. Report progress against the iteration goal
5. Update task statuses by replacing [ ] with [x] when completed

Example of status update:
- [ ] Task to complete  →  - [x] Task completed

---

`;

/**
 * Feature file specific instructions
 */
const featureFileInstructions = `
## 🤖 Feature Processing Instructions for AI

Cette Feature définit une fonctionnalité importante du projet. Lorsque vous travaillez avec ce fichier:
- Comprenez les objectifs et la portée de cette fonctionnalité
- Utilisez cette Feature comme direction pour l'implémentation des User Stories associées
- Lors de l'implémentation des User Stories, vérifiez toujours l'alignement avec cette Feature
- Ne suggérez des modifications à la Feature que si des changements substantiels du projet se produisent
- Suivez les liens vers les User Stories liées pour voir les détails d'implémentation

---

`;

/**
 * User story specific instructions
 */
const userStoryInstructions = `
## 🤖 User Story Instructions for AI

Lorsque vous travaillez avec cette User Story:
- Mettez à jour le statut des tâches en remplaçant [ ] par [x] lorsqu'elles sont terminées
- Mettez à jour le statut des critères d'acceptation en remplaçant [ ] par [x] lorsqu'ils sont validés
- Vérifiez les liens vers la feature parent et les dépendances avant de commencer
- Ne modifiez PAS la structure existante du document

Exemple de mise à jour:
- [ ] Tâche à faire  →  - [x] Tâche terminée

---

`;

/**
 * Create a slug from a string for file naming
 * @param {string} text - Input text to convert to slug
 * @returns {string} Slugified text
 */
function createSlug(text) {
  return slugify(text, { lower: true, strict: true });
}

/**
 * Validates the input backlog result
 * @param {Object} backlogResult - Result to validate
 * @returns {Object} - { valid, error }
 */
function validateBacklogResult(backlogResult) {
  if (!backlogResult) {
    return { valid: false, error: 'Backlog result is null or undefined' };
  }

  if (!backlogResult.projectName) {
    return { valid: false, error: 'Project name is missing in backlog result' };
  }

  if (!backlogResult.epics || !Array.isArray(backlogResult.epics)) {
    return { valid: false, error: 'Epics array is missing or not an array in backlog result' };
  }

  return { valid: true, error: null };
}

/**
 * Create the base directory structure for backlog
 * @param {string} backlogDir - The base output directory
 * @param {Object} result - Backlog result
 * @returns {Promise<void>}
 */
async function createDirectoryStructure(backlogDir, result) {
  try {
    // Ensure the base backlog directory exists
    await fs.ensureDir(backlogDir);

    // Create epics directory
    await fs.ensureDir(path.join(backlogDir, 'epics'));
    
    // Create planning directory with subdirectories
    await fs.ensureDir(path.join(backlogDir, 'planning'));
    await fs.ensureDir(path.join(backlogDir, 'planning', 'mvp'));
    await fs.ensureDir(path.join(backlogDir, 'planning', 'iterations'));

    // Create directories for each epic if there are any
    if (result.epics && Array.isArray(result.epics)) {
      for (const epic of result.epics) {
        const epicSlug = createSlug(epic.name);
        const epicDir = path.join(backlogDir, 'epics', epicSlug);
        
        // Create epic directory
        await fs.ensureDir(epicDir);
        
        // Create features directory within epic
        const featuresDir = path.join(epicDir, 'features');
        await fs.ensureDir(featuresDir);
      }
    }

    // Create directories for iterations if there are any
    if (result.iterations && Array.isArray(result.iterations)) {
      for (const iteration of result.iterations) {
        const iterationSlug = createSlug(iteration.name);
        await fs.ensureDir(path.join(backlogDir, 'planning', 'iterations', iterationSlug));
      }
    }
  } catch (error) {
    console.error(chalk.red(`❌ Error creating directory structure: ${error.message}`));
    throw error;
  }
}

/**
 * Process epics from the backlog result
 * @param {Array} epics - Array of epics
 * @param {string} backlogDir - Base backlog directory
 * @param {Map} userStoryMap - Map to track user stories
 * @param {Object} backlogJson - Backlog JSON structure
 * @returns {Promise<void>}
 */
async function processEpics(epics, backlogDir, userStoryMap, backlogJson) {
  if (!epics || !Array.isArray(epics)) {
    console.warn(chalk.yellow('⚠️ No epics found, skipping epics processing'));
    return;
  }
  
  backlogJson.epics = [];
  
  for (const epic of epics) {
    try {
      const epicSlug = createSlug(epic.name);
      const epicDir = path.join(backlogDir, 'epics', epicSlug);
      
      // Create epic file
      const epicContent = `# Epic: ${epic.name}\n\n${epicFileInstructions}\n## Description\n\n${epic.description}\n\n## Features\n\n`;
      const epicPath = path.join(epicDir, 'epic.md');
      await fs.writeFile(epicPath, epicContent);
      
      console.log(chalk.green(`✓ Epic created: ${epicPath}`));
      
      // Add to backlog JSON
      const epicJson = {
        name: epic.name,
        description: epic.description,
        path: `./${path.relative(backlogDir, epicPath).replace(/\\/g, '/')}`,
        slug: epicSlug,
        features: []
      };
      
      // Process features if available
      if (epic.features && Array.isArray(epic.features)) {
        const featuresDir = path.join(epicDir, 'features');
        for (const feature of epic.features) {
          const featureJson = await processFeature(
            feature, 
            featuresDir, 
            epicSlug, 
            epic.name,
            userStoryMap,
            backlogDir
          );
          
          epicJson.features.push(featureJson);
        }
      }
      
      backlogJson.epics.push(epicJson);
      
    } catch (error) {
      console.error(chalk.red(`❌ Error processing epic ${epic.name}: ${error.message}`));
      throw error;
    }
  }
}

/**
 * Process a feature and its user stories, creating all necessary files
 * @param {Object} feature - Feature object
 * @param {string} featuresDir - Directory to create feature in
 * @param {string} epicSlug - Slug of parent epic
 * @param {string} epicTitle - Title of parent epic
 * @param {Map} userStoryMap - Map to track user stories
 * @param {string} backlogDir - Base directory
 * @returns {Promise<Object>} Feature JSON for backlog.json
 */
async function processFeature(feature, featuresDir, epicSlug, epicTitle, userStoryMap, backlogDir) {
  try {
    const featureTitle = feature.title;
    const featureSlug = createSlug(featureTitle);
    const featureDir = path.join(featuresDir, featureSlug);
    
    // Create directory for the feature
    await fs.ensureDir(featureDir);
    
    // Create directory for user stories
    const userStoriesDir = path.join(featureDir, 'user-stories');
    await fs.ensureDir(userStoriesDir);
    
    // Generate feature markdown content
    const instructions = featureFileInstructions;
    const featureDescription = feature.description;
    const epicLink = `[${epicTitle}](../../epic.md)`;
    
    // Construire le contenu de manière progressive pour éviter les template literals imbriqués
    let featureContent = `# Feature: ${featureTitle}\n\n`;
    featureContent += instructions;
    featureContent += `\n## Description\n\n${featureDescription}\n\n`;
    featureContent += `## Parent Epic\n\n${epicLink}\n\n`;
    featureContent += `## User Stories\n\n`;
    
    // Create feature file
    const featureFilePath = path.join(featureDir, 'feature.md');
    await fs.writeFile(featureFilePath, featureContent);
    
    console.log(chalk.green(`✓ Feature created: ${featureFilePath}`));
    
    // Prepare feature JSON
    const featureJson = {
      title: featureTitle,
      description: feature.description,
      path: `./${path.relative(backlogDir, featureFilePath).replace(/\\/g, '/')}`,
      slug: featureSlug,
      userStories: []
    };
    
    // Create user stories files - Extraction en sous-fonction pour réduire la complexité cognitive
    if (feature.userStories && Array.isArray(feature.userStories)) {
      await processFeatureUserStories(
        feature.userStories, 
        userStoriesDir, 
        featureTitle, 
        epicSlug, 
        featureSlug, 
        userStoryMap, 
        backlogDir, 
        featureJson
      );
    }
    
    return featureJson;
  } catch (error) {
    console.error(chalk.red(`❌ Error processing feature: ${error.message}`));
    throw error;
  }
}

/**
 * Process user stories for a feature
 * @param {Array} userStories - Array of user stories
 * @param {string} userStoriesDir - Directory for user stories
 * @param {string} featureTitle - Title of parent feature
 * @param {string} epicSlug - Slug of parent epic
 * @param {string} featureSlug - Slug of parent feature
 * @param {Map} userStoryMap - Map to track user stories
 * @param {string} backlogDir - Base directory
 * @param {Object} featureJson - Feature JSON to update
 * @returns {Promise<void>}
 */
async function processFeatureUserStories(
  userStories, 
  userStoriesDir, 
  featureTitle, 
  epicSlug, 
  featureSlug, 
  userStoryMap, 
  backlogDir, 
  featureJson
) {
  for (const userStory of userStories) {
    const storyTitle = userStory.title;
    const storyId = userStory.id;
    const storySlug = storyId ? 
      `${storyId.toLowerCase()}-${createSlug(storyTitle)}` : 
      createSlug(storyTitle);
    
    // Format user story content
    const storyContent = formatUserStory(userStory);
    
    // Add feature reference
    const featureRef = `## Parent Feature\n\n[${featureTitle}](../feature.md)\n\n`;
    const finalStoryContent = storyContent.replace('## Description', `${featureRef}## Description`);
    
    // Create user story file
    const storyFilePath = path.join(userStoriesDir, `${storySlug}.md`);
    await fs.writeFile(storyFilePath, finalStoryContent);
    
    console.log(chalk.green(`✓ User Story created: ${storyFilePath}`));
    
    // Add to feature JSON
    const storyJson = {
      id: storyId,
      title: storyTitle,
      path: `./${path.relative(backlogDir, storyFilePath).replace(/\\/g, '/')}`,
      slug: storySlug
    };
    
    featureJson.userStories.push(storyJson);
    
    // Track user story for cross-links
    const relativePathForBacklog = path.relative(backlogDir, storyFilePath).replace(/\\/g, '/');
    userStoryMap.set(storyTitle, {
      id: storyId,
      title: storyTitle,
      epicSlug,
      featureSlug,
      storySlug,
      path: storyFilePath,
      relativePath: `./${relativePathForBacklog}`
    });
    
    // If ID is different from title, also index by ID for cross-referencing
    if (storyId && storyId !== storyTitle) {
      userStoryMap.set(storyId, {
        id: storyId,
        title: storyTitle,
        epicSlug,
        featureSlug,
        storySlug,
        path: storyFilePath,
        relativePath: `./${relativePathForBacklog}`
      });
    }
  }
}

/**
 * Create the main README.md file
 * @param {string} readmePath - Path to README.md
 * @param {string} projectName - Name of the project
 * @param {string} description - Project description
 * @returns {Promise<void>}
 */
async function createMainReadme(readmePath, projectName, description) {
  const instructions = aiAutomationInstructions;
  const readmeContent = `# ${projectName} - Agile Backlog\n\n${instructions}\n\n${description || 'No description provided.'}\n\n## Structure\n\n- [Epics](./epics/)\n- [MVP User Stories](./planning/mvp/mvp.md)\n- [Iterations](./planning/iterations/)\n\n`;
  await fs.writeFile(readmePath, readmeContent);
}

/**
 * Process MVP user stories
 * @param {Array} mvpStories - Array of MVP user stories
 * @param {string} backlogDir - Base backlog directory
 * @param {Map} userStoryMap - Map to track user stories
 * @param {Object} backlogJson - Backlog JSON structure
 * @returns {Promise<void>}
 */
async function processMvp(mvpStories, backlogDir, userStoryMap, backlogJson) {
  if (!mvpStories || !Array.isArray(mvpStories) || mvpStories.length === 0) {
    console.warn(chalk.yellow('⚠️ No MVP stories found, skipping MVP processing'));
    return;
  }

  try {
    // Create MVP directory
    const mvpDir = path.join(backlogDir, 'planning', 'mvp');
    
    // Generate MVP content
    let mvpContent = `# MVP (Minimum Viable Product)\n\n${mvpFileInstructions}\n## Description\n\nThis document outlines the Minimum Viable Product (MVP) for the project. The MVP includes the essential features that must be implemented first to deliver value to users.\n\n## User Stories\n\n`;
    
    backlogJson.mvp = [];
    
    // Add each MVP story
    for (const story of mvpStories) {
      const storyId = story.id || '';
      const storyTitle = story.title;
      
      // If story exists in map (created by an epic), link to it
      if (userStoryMap.has(storyTitle) || userStoryMap.has(storyId)) {
        const storyInfo = userStoryMap.get(storyTitle) || userStoryMap.get(storyId);
        mvpContent += `- [${storyId ? `${storyId}: ` : ''}${storyTitle}](${storyInfo.relativePath})\n`;
        
        // Add to JSON
        backlogJson.mvp.push({
          id: storyId,
          title: storyTitle,
          path: storyInfo.relativePath
        });
      } else {
        // Story doesn't exist in an epic, create a warning and summary
        console.warn(chalk.yellow(`⚠️ MVP story "${storyTitle}" not found in any epic/feature`));
        mvpContent += `- ${storyId ? `${storyId}: ` : ''}${storyTitle} (Warning: This story is not defined in any epic/feature)\n`;
        
        // Brief summary of the story
        mvpContent += `  - Description: ${story.description}\n`;
        mvpContent += `  - Priority: ${story.priority}\n`;
        
        // This story doesn't have a path because it's only summarized here
        backlogJson.mvp.push({
          id: storyId,
          title: storyTitle,
          orphaned: true  // Mark as not linked to any epic/feature
        });
      }
    }
    
    // Write MVP file
    const mvpFilePath = path.join(mvpDir, 'mvp.md');
    await fs.writeFile(mvpFilePath, mvpContent);
    
    console.log(chalk.green(`✓ MVP document created: ${mvpFilePath}`));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error processing MVP: ${error.message}`));
    throw error;
  }
}

/**
 * Process iterations from the backlog result
 * @param {Object} iterations - Iterations object
 * @param {string} backlogDir - Base backlog directory
 * @param {Map} userStoryMap - Map to track user stories
 * @param {Object} backlogJson - Backlog JSON structure
 * @returns {Promise<void>}
 */
async function processIterations(iterations, backlogDir, userStoryMap, backlogJson) {
  if (!iterations || !Array.isArray(iterations) || iterations.length === 0) {
    console.warn(chalk.yellow('⚠️ No iterations found, skipping iterations processing'));
    return;
  }
  
  backlogJson.iterations = [];
  
  try {
    // Root iterations directory
    const iterationsDir = path.join(backlogDir, 'planning', 'iterations');
    
    for (const iteration of iterations) {
      const iterationName = iteration.name;
      const iterationSlug = createSlug(iterationName);
      const iterationDir = path.join(iterationsDir, iterationSlug);
      
      // Create directory if needed
      await fs.ensureDir(iterationDir);
      
      // Generate iteration content
      let iterationContent = `# Iteration: ${iterationName}\n\n${iterationFileInstructions}\n## Goal\n\n${iteration.goal}\n\n## User Stories\n\n`;
      
      const iterationJson = {
        name: iterationName,
        goal: iteration.goal,
        slug: iterationSlug,
        stories: []
      };
      
      // Add each story in the iteration
      if (iteration.stories && Array.isArray(iteration.stories)) {
        for (const story of iteration.stories) {
          const storyId = story.id || '';
          const storyTitle = story.title;
          
          // If story exists in map (created by an epic), link to it
          if (userStoryMap.has(storyTitle) || userStoryMap.has(storyId)) {
            const storyInfo = userStoryMap.get(storyTitle) || userStoryMap.get(storyId);
            iterationContent += `- [${storyId ? `${storyId}: ` : ''}${storyTitle}](${storyInfo.relativePath})\n`;
            
            // Add to JSON
            iterationJson.stories.push({
              id: storyId,
              title: storyTitle,
              path: storyInfo.relativePath
            });
          } else {
            // Story doesn't exist in an epic, create a warning and summary
            console.warn(chalk.yellow(`⚠️ Iteration story "${storyTitle}" not found in any epic/feature`));
            iterationContent += `- ${storyId ? `${storyId}: ` : ''}${storyTitle} (Warning: This story is not defined in any epic/feature)\n`;
            
            // Brief summary of the story
            iterationContent += `  - Description: ${story.description}\n`;
            iterationContent += `  - Priority: ${story.priority}\n`;
            
            // This story doesn't have a path because it's only summarized here
            iterationJson.stories.push({
              id: storyId,
              title: storyTitle,
              orphaned: true  // Mark as not linked to any epic/feature
            });
          }
        }
      }
      
      // Write iteration file
      const iterationFilePath = path.join(iterationDir, 'iteration.md');
      await fs.writeFile(iterationFilePath, iterationContent);
      
      console.log(chalk.green(`✓ Iteration document created: ${iterationFilePath}`));
      
      // Add to backlog JSON
      iterationJson.path = `./${path.relative(backlogDir, iterationFilePath).replace(/\\/g, '/')}`;
      backlogJson.iterations.push(iterationJson);
    }
    
  } catch (error) {
    console.error(chalk.red(`❌ Error processing iterations: ${error.message}`));
    throw error;
  }
}

/**
 * Format a user story as Markdown with checkboxes and enhanced AI instructions
 * @param {Object} userStory - User story object
 * @returns {string} - Formatted Markdown
 */
function formatUserStory(userStory) {
  // Handle different property naming conventions
  const id = userStory.id || '';
  const title = userStory.title || '';
  const description = userStory.description || '';
  const asA = userStory.asA || userStory.role || 'user';
  const iWant = userStory.iWant || userStory.action || description;
  const soThat = userStory.soThat || userStory.benefit || 'achieve a benefit';
  const priority = userStory.priority || '';
  const dependencies = userStory.dependencies || [];
  
  // Create markdown header with both ID and title if available
  let markdown = id ? `# User Story ${id}: ${title}\n\n` : `# User Story: ${title}\n\n`;
  
  // Add AI automation instructions
  markdown += `🤖 **AI Instructions:**\n- Update status using checkboxes below.\n- Use cross-references for traceability.\n\n`;
  
  // Format the user story description with checkbox for test compatibility
  markdown += `## Description\n**En tant que**: ${asA}\n**Je veux**: ${iWant}\n**Afin de**: ${soThat}\n\n`;
  
  // Format description as a checkbox for test compatibility
  if (description) {
    markdown += `- [ ] ${description}\n\n`;
  }
  
  // Add acceptance criteria section with checkboxes
  const acceptanceCriteria = userStory.acceptanceCriteria || userStory.acceptance_criteria || [];
  if (acceptanceCriteria.length > 0) {
    markdown += `### Acceptance Criteria\n`;
    acceptanceCriteria.forEach(criteria => {
      if (typeof criteria === 'string') {
        markdown += `- [ ] ${criteria}\n`;
      } else if (criteria.given && criteria.when && criteria.then) {
        // Format BDD-style acceptance criteria
        markdown += `- [ ] GIVEN ${criteria.given} WHEN ${criteria.when} THEN ${criteria.then}\n`;
      }
    });
  }
  
  // Add tasks section with checkboxes
  const tasks = userStory.tasks || [];
  if (tasks.length > 0) {
    markdown += `\n### Technical Tasks\n`;
    tasks.forEach(task => {
      if (typeof task === 'string') {
        markdown += `- [ ] ${task}\n`;
      } else if (task.description) {
        const estimate = task.estimate ? ` (${task.estimate})` : '';
        markdown += `- [ ] ${task.description}${estimate}\n`;
      }
    });
  }
  
  // Add priority if available
  if (priority) {
    markdown += `\n**Priority:** ${priority}\n`;
  }
  
  // Add dependencies if available
  if (dependencies.length > 0) {
    markdown += `\n**Dependencies:** ${dependencies.join(', ')}\n`;
  }
  
  // Add user story instructions footer to ensure test compatibility
  markdown += `\n## 🤖 User Story Instructions for AI

Lorsque vous travaillez avec cette User Story:
- Mettez à jour le statut des tâches en remplaçant [ ] par [x] lorsqu'elles sont terminées
- Mettez à jour le statut des critères d'acceptation en remplaçant [ ] par [x] lorsqu'ils sont validés
- Vérifiez les liens vers la feature parent et les dépendances avant de commencer
- Ne modifiez PAS la structure existante du document

Exemple de mise à jour:
- [ ] Tâche à faire  →  - [x] Tâche terminée

---
\n`;
  
  return markdown;
}

/**
 * Function to generate markdown files from the structured result
 * @param {Object} result - The structured result from the backlog generation
 * @param {string} outputPath - Path where to generate the markdown files
 * @returns {Promise<Object>} - { success, files?, error? }
 */
async function generateMarkdownFilesFromResult(result, outputPath = './') {
  try {
    // Validate the input
    const validation = validateBacklogResult(result);
    if (!validation.valid) {
      console.error(chalk.red(`❌ Invalid backlog result: ${validation.error}`));
      return { success: false, error: { message: validation.error } };
    }
    
    // Setup base directory
    const backlogDir = path.join(outputPath, '.agile-planner-backlog');
    console.log(chalk.blue(`ℹ️ Generating files in: ${backlogDir}`));
    
    // Create the directory structure
    await createDirectoryStructure(backlogDir, result);
    
    // Prepare a map to track user stories for cross-linking
    const userStoryMap = new Map();
    
    // Prepare a JSON representation of the backlog structure
    const backlogJson = {
      projectName: result.projectName || 'Project',
      description: result.description || '',
      epics: [],
      mvp: [],
      iterations: []
    };
    
    // Process epics first (this creates all user stories)
    await processEpics(result.epics, backlogDir, userStoryMap, backlogJson);
    
    // Then process MVP (this links to existing user stories)
    await processMvp(result.mvp, backlogDir, userStoryMap, backlogJson);
    
    // Then process iterations (these also link to existing user stories)
    await processIterations(result.iterations, backlogDir, userStoryMap, backlogJson);
    
    // Create main README
    await createMainReadme(
      path.join(backlogDir, 'README.md'),
      result.projectName || 'Project',
      result.description || ''
    );
    
    // Save backlog.json structure
    await fs.writeFile(
      path.join(backlogDir, 'backlog.json'),
      JSON.stringify(backlogJson, null, 2)
    );
    
    // If we have a raw result, save it for reference
    if (result.result) {
      await saveRawBacklog(result.result, outputPath);
    }
    
    return {
      success: true,
      files: [backlogDir]
    };
    
  } catch (error) {
    console.error(chalk.red(`❌ Error generating markdown files: ${error.message}`));
    return { success: false, error };
  }
}

/**
 * This function is exported for backward compatibility with v1 API
 * @param {Object} result - The structured result from the backlog generation
 * @param {string} outputPath - Path where to generate the markdown files
 * @returns {Promise<Object>} - { success, files?, error? }
 */
async function generateMarkdownFiles(result, outputPath) {
  return generateMarkdownFilesFromResult(result, outputPath);
}

/**
 * Save raw backlog result as JSON for future reference
 * @param {Object} apiResult - The raw result from API (OpenAI or GROQ)
 * @param {string} outputPath - Output directory
 * @returns {Promise<string>} - Path to the saved JSON file
 */
async function saveRawBacklog(apiResult, outputPath) {
  try {
    const backlogDir = path.join(outputPath, '.agile-planner-backlog');
    const rawDir = path.join(backlogDir, 'raw');
    await fs.ensureDir(rawDir);
    
    const jsonPath = path.join(rawDir, 'openai-response.json');
    await fs.writeFile(jsonPath, JSON.stringify(apiResult, null, 2), 'utf8');
    
    console.log(chalk.green(`✓ Raw API response saved at ${jsonPath}`));
    return jsonPath;
  } catch (error) {
    console.error(chalk.red(`❌ Error saving raw API response: ${error.message}`));
    throw error;
  }
}

/**
 * Function to generate feature-specific markdown (for the generateFeatureMarkdown command)
 * @param {Object} result - Feature result object with epicName, feature and userStories
 * @param {string} outputPath - Path where to generate the markdown files
 * @returns {Promise<Object>} - { success, files?, error? }
 */
async function generateFeatureMarkdown(result, outputPath = './') {
  try {
    console.log(chalk.blue('Génération des fichiers markdown pour la feature...'));
    
    // Extraire les données nécessaires
    const { feature, userStories, epicName } = result;
    
    if (!feature || !feature.title || !userStories || !epicName) {
      throw new Error('Format de données invalide pour la génération de feature');
    }

    // Préparer la structure de base des répertoires
    const backlogDir = path.join(outputPath, '.agile-planner-backlog');
    const epicsDir = path.join(backlogDir, 'epics');
    
    // Créer les slugs pour les noms de fichiers et dossiers
    const epicSlug = createSlug(epicName);
    const featureSlug = createSlug(feature.title);
    
    // Créer les répertoires nécessaires
    await fs.ensureDir(backlogDir);
    await fs.ensureDir(epicsDir);
    
    // Créer le répertoire de l'epic
    const epicDir = path.join(epicsDir, epicSlug);
    await fs.ensureDir(epicDir);
    
    // Créer le fichier epic.md s'il n'existe pas
    const epicFilePath = path.join(epicDir, 'epic.md');
    if (!await fs.pathExists(epicFilePath)) {
      const epicContent = `# Epic: ${epicName}

${epicFileInstructions}

## Description

Epic regroupant les fonctionnalités liées à ${epicName}.

## Features

- [${feature.title}](./features/${featureSlug}/feature.md)
`;
      await fs.writeFile(epicFilePath, epicContent);
    }
    
    // Créer le répertoire des features
    const featuresDir = path.join(epicDir, 'features');
    await fs.ensureDir(featuresDir);
    
    // Créer le répertoire de la feature
    const featureDir = path.join(featuresDir, featureSlug);
    await fs.ensureDir(featureDir);
    
    // Créer le fichier feature.md
    const featureContent = `# Feature: ${feature.title}

${featureFileInstructions}

## Parent Epic

[${epicName}](../../epic.md)

## Description

${feature.description}

${feature.businessValue ? `## Valeur métier\n\n${feature.businessValue}\n\n` : ''}

## User Stories

${userStories.map(story => `- [${story.title}](./user-stories/${createSlug(story.title)}.md)`).join('\n')}
`;
    
    await fs.writeFile(path.join(featureDir, 'feature.md'), featureContent);
    
    // Créer le répertoire des user stories
    const userStoriesDir = path.join(featureDir, 'user-stories');
    await fs.ensureDir(userStoriesDir);
    
    // Créer un fichier pour chaque user story
    const createdFiles = [epicFilePath, path.join(featureDir, 'feature.md')];
    
    for (const story of userStories) {
      const storySlug = createSlug(story.title);
      const storyFilePath = path.join(userStoriesDir, `${storySlug}.md`);
      
      // Formater la user story
      const storyContent = `# User Story: ${story.title}

${userStoryInstructions}

## Story

**En tant que**: ${story.asA}
**Je veux**: ${story.iWant}
**Afin de**: ${story.soThat}

## Feature parent

[${feature.title}](../feature.md)

## Critères d'acceptation

${story.acceptanceCriteria.map(criteria => 
  `- [ ] ${criteria.given} ${criteria.when} ${criteria.then}`
).join('\n')}

## Tâches techniques

${story.tasks.map(task => 
  `- [ ] ${task.description} (${task.estimate} points)`
).join('\n')}

`;
      
      await fs.writeFile(storyFilePath, storyContent);
      createdFiles.push(storyFilePath);
    }
    
    console.log(chalk.green(`✅ Fichiers markdown générés pour la feature "${feature.title}" dans ${featureDir}`));
    
    return {
      success: true,
      files: createdFiles
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown pour la feature: ${error.message}`));
    return { 
      success: false, 
      error: { 
        message: error.message,
        stack: error.stack
      } 
    };
  }
}

/**
 * Validation de l'entrée utilisée pour déterminer si le backlog est valide
 * @param {Object} backlogResult - Resultat du backlog à valider
 * @param {string} outputPath - Chemin de sortie
 * @returns {Promise<Object>} - { success, files?, error? }
 */
async function validateBacklogResultAndProcess(backlogResult, outputPath) {
  // Validation
  const validation = validateBacklogResult(backlogResult);
  if (!validation.valid) {
    console.error(chalk.red(`❌ Invalid backlog result: ${validation.error}`));
    return { 
      success: false, 
      error: { message: validation.error } 
    };
  }
  
  return await generateMarkdownFilesFromResult(backlogResult, outputPath);
}

// Expose the public API
module.exports = {
  createSlug,
  generateFeatureMarkdown,
  formatUserStory,
  saveRawBacklog,
  generateMarkdownFilesFromResult,
  generateMarkdownFiles
};
