const fs = require('fs');
const path = require('path');

// Charger le backlog d'exemple
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Fonction isolée de formatage
function isolatedFormatUserStory(userStory) {
  const result = {
    header: `# User Story ${userStory.id}: ${userStory.title}`,
    description: `- [ ] ${userStory.description}`,
    acceptanceCriteria: userStory.acceptance_criteria.map(criteria => `- [ ] ${criteria}`),
    tasks: userStory.tasks.map(task => `- [ ] ${task}`)
  };
  
  if (userStory.priority) {
    result.priority = `**Priority:** ${userStory.priority}`;
  }
  
  if (userStory.dependencies && userStory.dependencies.length > 0) {
    result.dependencies = `**Dependencies:** ${userStory.dependencies.join(', ')}`;
  }
  
  return result;
}

// Exécuter le test
const story = sampleBacklog.mvp[0];
const formattedParts = isolatedFormatUserStory(story);

// Vérifier manuellement les parties critiques
console.log("=== TEST DE FORMATAGE ISOLÉ ===");

// Construction des chaînes de référence
const expectedHeader = '# User Story ' + story.id + ': ' + story.title;
const expectedDescription = '- [ ] ' + story.description;

// En-tête
console.log('\nEn-tête: "' + formattedParts.header + '"');
console.log('Attendu: "' + expectedHeader + '"');
console.log('Résultat: ' + (formattedParts.header === expectedHeader));

// Description
console.log('\nDescription: "' + formattedParts.description + '"');
console.log('Attendu: "' + expectedDescription + '"');
console.log('Résultat: ' + (formattedParts.description === expectedDescription));

// Critères d'acceptation
console.log("\nCritères d'acceptation:");
story.acceptance_criteria.forEach((criteria, i) => {
  const expected = `- [ ] ${criteria}`;
  const actual = formattedParts.acceptanceCriteria[i];
  console.log(`  ${i+1}. Attendu: "${expected.substring(0, 50)}..."`);
  console.log(`     Obtenu: "${actual.substring(0, 50)}..."`);
  console.log(`     Résultat: ${actual === expected}`);
});

// Tâches
console.log("\nTâches techniques:");
story.tasks.forEach((task, i) => {
  const expected = `- [ ] ${task}`;
  const actual = formattedParts.tasks[i];
  console.log(`  ${i+1}. Attendu: "${expected}"`);
  console.log(`     Obtenu: "${actual}"`);
  console.log(`     Résultat: ${actual === expected}`);
});

// Priorité
if (story.priority) {
  const expected = `**Priority:** ${story.priority}`;
  console.log(`\nPriorité: "${formattedParts.priority}"`);
  console.log(`Attendu: "${expected}"`);
  console.log(`Résultat: ${formattedParts.priority === expected}`);
}

// Enregistrer les parties dans un fichier pour inspection
fs.writeFileSync(
  path.join(__dirname, 'formatted-parts.json'), 
  JSON.stringify(formattedParts, null, 2)
);

console.log("\nFichier formatted-parts.json créé pour inspection");

// Créer un nouveau module pour remplacer formatUserStory
const fixedFormatter = `
const { formatUserStory } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Fonction corrigée
function fixedFormatUserStory(userStory) {
  // Extraire les valeurs
  const id = userStory.id || '';
  const title = userStory.title || '';
  const description = userStory.description || '';
  const criteria = userStory.acceptance_criteria || [];
  const tasks = userStory.tasks || [];
  const priority = userStory.priority || '';
  const dependencies = userStory.dependencies || [];
  
  // Construction ligne par ligne pour éviter les problèmes de template literals
  let text = '# User Story ' + id + ': ' + title + '\\n\\n';
  text += '## Description\\n';
  text += '- [ ] ' + description + '\\n\\n';
  
  if (criteria.length > 0) {
    text += '### Acceptance Criteria\\n';
    for (let i = 0; i < criteria.length; i++) {
      text += '- [ ] ' + criteria[i] + '\\n';
    }
    text += '\\n';
  }
  
  if (tasks.length > 0) {
    text += '### Technical Tasks\\n';
    for (let i = 0; i < tasks.length; i++) {
      text += '- [ ] ' + tasks[i] + '\\n';
    }
    text += '\\n';
  }
  
  if (priority) {
    text += '**Priority:** ' + priority + '\\n';
  }
  
  if (dependencies && dependencies.length > 0) {
    text += '\\n**Dependencies:** ' + dependencies.join(', ') + '\\n';
  }
  
  return text;
}

// Exporter la fonction corrigée
module.exports = { fixedFormatUserStory };
`;

fs.writeFileSync(path.join(__dirname, 'fixed-formatter.js'), fixedFormatter);
console.log("Module fixed-formatter.js créé pour résoudre le problème");

// Fournir la commande pour exécuter le test avec notre correctif
console.log("\nPour tester la solution, utiliser cette commande:");
console.log("npx jest tests/markdown-generator.test.js -t \"Formats a user story correctly in Markdown with checkboxes\" --no-cache --verbose");
