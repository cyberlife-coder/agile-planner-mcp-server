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
console.log(`Contient "# User Story ${story.id}: ${story.title}" : ${generatedContent.includes(`# User Story ${story.id}: ${story.title}`)}`);
console.log(`Contient "- [ ] ${story.description}" : ${generatedContent.includes(`- [ ] ${story.description}`)}`);
console.log(`Contient "### Acceptance Criteria" : ${generatedContent.includes('### Acceptance Criteria')}`);
console.log(`Contient "### Technical Tasks" : ${generatedContent.includes('### Technical Tasks')}`);

// Vérifier chaque critère d'acceptation
story.acceptance_criteria.forEach(criteria => {
  console.log(`Contient "- [ ] ${criteria.substring(0, 30)}..." : ${generatedContent.includes(`- [ ] ${criteria}`)}`);
});

// Vérifier chaque tâche
story.tasks.forEach(task => {
  console.log(`Contient "- [ ] ${task}" : ${generatedContent.includes(`- [ ] ${task}`)}`);
});

// Vérifier la priorité
console.log(`Contient "**Priority:** ${story.priority}" : ${generatedContent.includes(`**Priority:** ${story.priority}`)}`);

console.log("\nFichiers générés pour comparaison: tests/generated.md et tests/manual.md");
