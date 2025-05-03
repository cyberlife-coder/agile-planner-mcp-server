const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Instructions d'automatisation IA à ajouter au début de chaque fichier
 */
const aiAutomationInstructions = `
## 🤖 Instructions pour l'IA

En tant qu'assistant IA, suis ces directives lorsque tu analyses ce document:
- Traite les tâches ci-dessous dans l'ordre séquentiel indiqué
- Une fois qu'une tâche est accomplie, marque-la comme terminée en cochant sa case ([ ] → [x])
- Attends la confirmation de l'utilisateur avant de passer à la tâche suivante
- Respecte les dépendances entre les tâches lorsqu'elles sont mentionnées
- Fournis des suggestions pertinentes basées sur les critères d'acceptation

---

`;

/**
 * Génère les fichiers Markdown à partir du backlog JSON
 * @param {Object} backlog - Backlog au format JSON
 * @param {string} outputDir - Répertoire de sortie (optionnel, utilise le répertoire courant par défaut)
 * @returns {Promise<Object>} Informations sur les fichiers générés
 */
async function generateMarkdownFiles(backlog, outputDir = process.cwd()) {
  try {
    // Création du fichier Epic
    const epicPath = path.join(outputDir, 'epic.md');
    const epicContent = `# Epic: ${backlog.epic.title}
${aiAutomationInstructions}
${backlog.epic.description}\n`;
    await fs.writeFile(epicPath, epicContent, 'utf8');
    
    // Création des dossiers de sortie s'ils n'existent pas
    const mvpDir = path.join(outputDir, 'mvp');
    const iterationsDir = path.join(outputDir, 'iterations');
    await fs.ensureDir(mvpDir);
    await fs.ensureDir(iterationsDir);
    
    // Création des fichiers MVP
    const mvpPath = path.join(mvpDir, 'user-stories.md');
    let mvpContent = `# MVP - User Stories
${aiAutomationInstructions}`;
    
    backlog.mvp.forEach(story => {
      mvpContent += formatUserStory(story);
    });
    
    await fs.writeFile(mvpPath, mvpContent, 'utf8');
    
    // Création des fichiers pour chaque itération
    for (const iteration of backlog.iterations) {
      const iterationDirName = iteration.name.toLowerCase().replace(/\s+/g, '-');
      const iterationDir = path.join(iterationsDir, iterationDirName);
      await fs.ensureDir(iterationDir);
      
      const iterationPath = path.join(iterationDir, 'user-stories.md');
      let iterationContent = `# ${iteration.name} - User Stories`;
      
      // Ajouter l'objectif d'itération s'il existe
      if (iteration.goal) {
        iterationContent += `\n\n## Objectif: ${iteration.goal}`;
      }
      
      // Ajouter les instructions d'automatisation IA
      iterationContent += `\n${aiAutomationInstructions}`;
      
      iteration.stories.forEach(story => {
        iterationContent += formatUserStory(story);
      });
      
      await fs.writeFile(iterationPath, iterationContent, 'utf8');
    }

    console.log(chalk.green('✓ Fichiers Markdown générés avec succès'));
    
    return {
      epicPath,
      mvpPath,
      iterationDirs: backlog.iterations.map(iteration => 
        path.join(iterationsDir, iteration.name.toLowerCase().replace(/\s+/g, '-'))
      )
    };
  } catch (error) {
    console.error(chalk.red('Erreur lors de la génération des fichiers Markdown:'), error);
    throw error;
  }
}

/**
 * Formate une User Story au format Markdown
 * @param {Object} story - User Story au format JSON
 * @returns {string} Contenu Markdown formaté
 */
function formatUserStory(story) {
  let content = `## ${story.id}: ${story.title}\n\n`;
  content += `- [ ] ${story.description}\n\n`;
  
  // Ajouter la priorité si elle existe
  if (story.priority) {
    content += `**Priorité:** ${story.priority}\n\n`;
  }
  
  // Ajouter les dépendances si elles existent
  if (story.dependencies && story.dependencies.length > 0) {
    content += `**Dépendances:** ${story.dependencies.join(', ')}\n\n`;
  }
  
  content += `### Critères d'acceptation\n`;
  story.acceptance_criteria.forEach(criteria => {
    content += `- [ ] ${criteria}\n`;
  });
  
  content += `\n### Tâches techniques\n`;
  story.tasks.forEach(task => {
    content += `- [ ] ${task}\n`;
  });
  
  content += `\n---\n\n`;
  return content;
}

/**
 * Sauvegarde le backlog brut au format JSON
 * @param {Object} backlog - Backlog au format JSON
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<string>} Chemin du fichier JSON généré
 */
async function saveRawBacklog(backlog, outputDir = process.cwd()) {
  const jsonPath = path.join(outputDir, 'backlog.json');
  await fs.writeFile(jsonPath, JSON.stringify(backlog, null, 2), 'utf8');
  console.log(chalk.green('✓ Fichier JSON brut sauvegardé'));
  return jsonPath;
}

module.exports = {
  generateMarkdownFiles,
  formatUserStory,
  saveRawBacklog
};
