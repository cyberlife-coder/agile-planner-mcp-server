const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

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
 * Generates markdown files from a backlog
 * @param {Object} backlog - The generated backlog
 * @param {string} outputDir - Directory to write output files to
 * @returns {Promise<Object>} - Paths to generated files
 *
 * Subdirectories handling:
 * 
 * 1. The 'epics' folder: 
 *    - This folder will contain the markdown files generated from the backlog.epics field (or backlog.epic if only one epic).
 *    - Each epic can be written into its own file (e.g., 'epic.md') detailing the epic description and objectives.
 * 
 * 2. The 'mvp' folder:
 *    - This folder is dedicated to the Minimum Viable Product.
 *    - Typically, a consolidated file such as 'user-stories.md' is created here, including all user stories for the MVP.
 * 
 * 3. The 'iterations' folder:
 *    - This folder will contain a subfolder for each iteration (if backlog.iterations exists).
 *    - In each iteration subfolder, files like 'user-stories.md' (and optionally 'tasks.md') will be generated to document the iteration's progress and tasks.
 */
async function generateMarkdownFiles(backlog, outputDir = process.cwd()) {
  process.stderr.write(`[DEBUG] (markdown-generator) Appel generateMarkdownFiles avec outputDir=${outputDir}\n`);
  try {
    // --- Subdirectories Handling Instructions ---
    // The outputDir must contain the following subdirectories:
    // - 'epics': holds epic markdown files generated from backlog.epics or backlog.epic.
    //      * Each epic should be written into a file (e.g., epic.md) detailing its content.
    // - 'mvp': stores the user stories for the MVP.
    //      * A consolidated file 'user-stories.md' listing all MVP user stories is created here.
    // - 'iterations': contains a subfolder for each iteration present in the backlog.
    //      * In each iteration subfolder, create files like 'user-stories.md' for the iteration's user stories and 'tasks.md' for its tasks.

    // === EPICS ===
    const epics = Array.isArray(backlog.epics) ? backlog.epics : [backlog.epic];
    const epicsDir = path.join(outputDir, 'epics');
    await fs.ensureDir(epicsDir);
    for (const epic of epics) {
      const epicSlug = (epic.title || 'epic').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const epicDir = path.join(epicsDir, `${epicSlug}`);
      await fs.ensureDir(epicDir);
      // Epic file
      const epicPath = path.join(epicDir, 'epic.md');
      const epicContent = `# Epic: ${epic.title}\n${aiAutomationInstructions}\n${epic.description || ''}\n`;
      await fs.writeFile(epicPath, epicContent, 'utf8');
      // User Stories for Epic
      if (epic.user_stories && Array.isArray(epic.user_stories)) {
        const usDir = path.join(epicDir, 'user-stories');
        await fs.ensureDir(usDir);
        for (const us of epic.user_stories) {
          const usSlug = (us.id || us.title || 'us').toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const usPath = path.join(usDir, `${usSlug}.md`);
          await fs.writeFile(usPath, formatUserStory(us), 'utf8');
          // Tasks for US
          if (us.tasks && us.tasks.length > 0) {
            const tasksDir = path.join(usDir, `${usSlug}-tasks`);
            await fs.ensureDir(tasksDir);
            for (let idx = 0; idx < us.tasks.length; idx++) {
              const task = us.tasks[idx];
              const taskSlug = `task-${idx+1}`;
              const taskPath = path.join(tasksDir, `${taskSlug}.md`);
              await fs.writeFile(taskPath, `# Task\n\n${task}\n`, 'utf8');
            }
          }
        }
      }
    }

    // === MVP ===
    if (backlog.mvp && Array.isArray(backlog.mvp)) {
      const mvpDir = path.join(outputDir, 'mvp', 'user-stories');
      await fs.ensureDir(mvpDir);
      for (const us of backlog.mvp) {
        const usSlug = (us.id || us.title || 'us').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const usPath = path.join(mvpDir, `${usSlug}.md`);
        await fs.writeFile(usPath, formatUserStory(us), 'utf8');
        // Tasks for US
        if (us.tasks && us.tasks.length > 0) {
          const tasksDir = path.join(mvpDir, `${usSlug}-tasks`);
          await fs.ensureDir(tasksDir);
          for (let idx = 0; idx < us.tasks.length; idx++) {
            const task = us.tasks[idx];
            const taskSlug = `task-${idx+1}`;
            const taskPath = path.join(tasksDir, `${taskSlug}.md`);
            await fs.writeFile(taskPath, `# Task\n\n${task}\n`, 'utf8');
          }
        }
      }
    }

    // === ITERATIONS ===
    if (backlog.iterations && Array.isArray(backlog.iterations)) {
      const iterationsDir = path.join(outputDir, 'iterations');
      await fs.ensureDir(iterationsDir);
      for (const iteration of backlog.iterations) {
        const iterationSlug = (iteration.name || 'iteration').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const iterationDir = path.join(iterationsDir, iterationSlug);
        await fs.ensureDir(iterationDir);
        // Iteration file
        const iterationPath = path.join(iterationDir, 'iteration.md');
        let iterationContent = `# ${iteration.name || 'Iteration'}\n`;
        if (iteration.goal) iterationContent += `\n## Goal: ${iteration.goal}`;
        iterationContent += `\n${aiAutomationInstructions}`;
        await fs.writeFile(iterationPath, iterationContent, 'utf8');
        // User Stories for Iteration
        if (iteration.stories && Array.isArray(iteration.stories)) {
          const usDir = path.join(iterationDir, 'user-stories');
          await fs.ensureDir(usDir);
          for (const us of iteration.stories) {
            const usSlug = (us.id || us.title || 'us').toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const usPath = path.join(usDir, `${usSlug}.md`);
            await fs.writeFile(usPath, formatUserStory(us), 'utf8');
            // Tasks for US
            if (us.tasks && us.tasks.length > 0) {
              const tasksDir = path.join(usDir, `${usSlug}-tasks`);
              await fs.ensureDir(tasksDir);
              for (let idx = 0; idx < us.tasks.length; idx++) {
                const task = us.tasks[idx];
                const taskSlug = `task-${idx+1}`;
                const taskPath = path.join(tasksDir, `${taskSlug}.md`);
                await fs.writeFile(taskPath, `# Task\n\n${task}\n`, 'utf8');
              }
            }
          }
        }
      }
    }

    process.stderr.write('✓ Markdown files generated avec structure organisée\n');
    return { epicsDir };
  } catch (error) {
    process.stderr.write('[DEBUG] Error generating Markdown files: ' + error.message + '\n');
    throw error;
  }
}

/**
 * Formats a User Story as Markdown
 * @param {Object} story - User Story in JSON format
 * @returns {string} Formatted Markdown content
 */
function formatUserStory(story) {
  let content = `## ${story.id}: ${story.title}\n\n`;
  content += `- [ ] ${story.description}\n\n`;
  
  // Add priority if it exists
  if (story.priority) {
    content += `**Priority:** ${story.priority}\n\n`;
  }
  
  // Add dependencies if they exist
  if (story.dependencies && story.dependencies.length > 0) {
    content += `**Dependencies:** ${story.dependencies.join(', ')}\n\n`;
  }
  
  content += `### Acceptance Criteria\n`;
  story.acceptance_criteria.forEach(criteria => {
    content += `- [ ] ${criteria}\n`;
  });
  
  content += `\n### Technical Tasks\n`;
  story.tasks.forEach(task => {
    content += `- [ ] ${task}\n`;
  });
  
  content += `\n---\n\n`;
  return content;
}

/**
 * Saves the raw JSON backlog to a file
 * @param {Object} backlog - Backlog to save
 * @param {string} outputDir - Directory to write output file to
 * @returns {Promise<string>} - Path to the generated file
 */
async function saveRawBacklog(backlog, outputDir = process.cwd()) {
  const jsonPath = path.join(outputDir, 'backlog.json');
  try {
    await fs.writeFile(jsonPath, JSON.stringify(backlog, null, 2), 'utf8');
    process.stderr.write('✓ Raw JSON file saved\n');
    return jsonPath;
  } catch (error) {
    process.stderr.write('[DEBUG] Error saving raw JSON file: ' + error.message + '\n');
    throw error;
  }
}

module.exports = {
  generateMarkdownFiles,
  formatUserStory,
  saveRawBacklog
};
