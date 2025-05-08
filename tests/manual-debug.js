// Script de débogage manuel pour identifier le problème de formatage des user stories
const { formatUserStory } = require('../server/lib/markdown-generator');
const fs = require('fs');
const path = require('path');

// Charger le backlog de test
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Récupérer la première story
const story = sampleBacklog.mvp[0];

// Créer un formatter personnalisé pour le débogage
function manualFormatUserStory(story) {
  const id = story.id || '';
  const title = story.title || '';
  const description = story.description || '';
  const acceptanceCriteria = story.acceptance_criteria || [];
  const tasks = story.tasks || [];
  const priority = story.priority || '';
  
  // Construire le markdown dans un format simple et direct
  let result = `# User Story ${id}: ${title}\n\n`;
  result += `## Description\n- [ ] ${description}\n\n`;
  
  if (acceptanceCriteria.length > 0) {
    result += `### Acceptance Criteria\n`;
    for (const criteria of acceptanceCriteria) {
      result += `- [ ] ${criteria}\n`;
    }
    result += '\n';
  }
  
  if (tasks.length > 0) {
    result += `### Technical Tasks\n`;
    for (const task of tasks) {
      result += `- [ ] ${task}\n`;
    }
    result += '\n';
  }
  
  if (priority) {
    result += `**Priority:** ${priority}\n\n`;
  }
  
  return result;
}

// Générer le contenu avec les deux formatters
const generatedContent = formatUserStory(story);
const manualContent = manualFormatUserStory(story);

// Écrire les résultats pour comparaison
fs.writeFileSync(path.join(__dirname, 'generated.md'), generatedContent);
fs.writeFileSync(path.join(__dirname, 'manual.md'), manualContent);

// Afficher les deux versions pour comparaison
console.log("=== CONTENU GÉNÉRÉ ===");
console.log(generatedContent);
console.log("\n=== CONTENU MANUEL ===");
console.log(manualContent);

// Vérifier les attentes du test
console.log("\n=== VERIFICATIONS DE TEST ===");

// Construire les chaînes à rechercher
const storyTitlePattern = '# User Story ' + story.id + ': ' + story.title;
const descriptionPattern = '- [ ] ' + story.description;
const acceptanceCriteriaPattern = '### Acceptance Criteria';
const technicalTasksPattern = '### Technical Tasks';
const priorityPattern = '**Priority:** ' + story.priority;

// Vérifier les structures de base
console.log('Contient "' + storyTitlePattern + '" : ' + generatedContent.includes(storyTitlePattern));
console.log('Contient "' + descriptionPattern + '" : ' + generatedContent.includes(descriptionPattern));
console.log('Contient "' + acceptanceCriteriaPattern + '" : ' + generatedContent.includes(acceptanceCriteriaPattern));
console.log('Contient "' + technicalTasksPattern + '" : ' + generatedContent.includes(technicalTasksPattern));

// Vérifier chaque critère d'acceptation
story.acceptance_criteria.forEach(criteria => {
  const criteriaPattern = '- [ ] ' + criteria;
  const displayCriteria = criteria.substring(0, 30) + '...';
  console.log('Contient "- [ ] ' + displayCriteria + '" : ' + generatedContent.includes(criteriaPattern));
});

// Vérifier chaque tâche
story.tasks.forEach(task => {
  const taskPattern = '- [ ] ' + task;
  console.log('Contient "' + taskPattern + '" : ' + generatedContent.includes(taskPattern));
});

// Vérifier la priorité
console.log('Contient "' + priorityPattern + '" : ' + generatedContent.includes(priorityPattern));

console.log("\nFichiers générés pour comparaison: tests/generated.md et tests/manual.md");
