// Test simplifié isolé pour mieux comprendre le problème
const fs = require('fs-extra');
const path = require('path');

// Charger le même backlog que dans les tests originaux
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Fonction ultra-simplifiée pour le formatage des user stories
function simpleFormatUserStory(userStory) {
  return [
    `# User Story ${userStory.id}: ${userStory.title}`,
    '',
    '## Description',
    `- [ ] ${userStory.description}`,
    '',
    '### Acceptance Criteria',
    ...userStory.acceptance_criteria.map(criteria => `- [ ] ${criteria}`),
    '',
    '### Technical Tasks',
    ...userStory.tasks.map(task => `- [ ] ${task}`),
    '',
    `**Priority:** ${userStory.priority}`,
    userStory.dependencies && userStory.dependencies.length > 0 ? 
      `**Dependencies:** ${userStory.dependencies.join(', ')}` : '',
    '',
    '## 🤖 User Story Instructions for AI',
    '',
    'Lorsque vous travaillez avec cette User Story:',
    '- Mettez à jour le statut des tâches en remplaçant [ ] par [x] lorsqu\'elles sont terminées',
    '- Mettez à jour le statut des critères d\'acceptation en remplaçant [ ] par [x] lorsqu\'ils sont validés',
    '- Vérifiez les liens vers la feature parent et les dépendances avant de commencer',
    '- Ne modifiez PAS la structure existante du document',
    '',
    'Exemple de mise à jour:',
    '- [ ] Tâche à faire  →  - [x] Tâche terminée',
    '',
    '---'
  ].join('\n');
}

// Test simple et isolé
describe('Simple Markdown Format', () => {
  test('Formats user story correctly with all expected elements', () => {
    const story = sampleBacklog.mvp[0];
    const formatted = simpleFormatUserStory(story);
    
    // Vérifier tous les éléments attendus
    expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
    expect(formatted).toContain(`- [ ] ${story.description}`);
    expect(formatted).toContain('### Acceptance Criteria');
    expect(formatted).toContain('### Technical Tasks');
    
    // Vérifier les critères d'acceptation
    story.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier les tâches
    story.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    expect(formatted).toContain(`**Priority:** ${story.priority}`);
    
    // Vérifier les instructions AI
    expect(formatted).toContain('🤖');
    expect(formatted).toContain('User Story Instructions for AI');
  });
});
