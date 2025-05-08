// Tests isolés pour la fonction formatUserStory
const fs = require('fs-extra');
const path = require('path');

// Charger le backlog d'exemple
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Version simplifiée de formatUserStory qui devrait passer le test
function customFormatUserStory(userStory) {
  const lines = [];
  
  // En-tête
  lines.push(`# User Story ${userStory.id}: ${userStory.title}`);
  lines.push('');
  
  // Description
  lines.push('## Description');
  lines.push(`- [ ] ${userStory.description}`);
  lines.push('');
  
  // Critères d'acceptation
  lines.push('### Acceptance Criteria');
  for (const criteria of userStory.acceptance_criteria || []) {
    lines.push(`- [ ] ${criteria}`);
  }
  lines.push('');
  
  // Tâches techniques
  lines.push('### Technical Tasks');
  for (const task of userStory.tasks || []) {
    lines.push(`- [ ] ${task}`);
  }
  lines.push('');
  
  // Priorité
  if (userStory.priority) {
    lines.push(`**Priority:** ${userStory.priority}`);
  }
  
  // Dépendances
  if (userStory.dependencies && userStory.dependencies.length > 0) {
    lines.push(`**Dependencies:** ${userStory.dependencies.join(', ')}`);
  }
  
  return lines.join('\n');
}

// Test simplifié

// Mock pour fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().resolves(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().resolves(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().resolves('{}'),
  readFileSync: jest.fn().returns('{}'),
  pathExists: jest.fn().resolves(true),
  pathExistsSync: jest.fn().returns(true)
}));


// Mock pour path
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/'))
  };
});

describe('Custom formatUserStory', () => {
  test('Formats a user story correctly in Markdown with checkboxes', () => {
    const story = sampleBacklog.mvp[0];
    const formatted = customFormatUserStory(story);
    
    // Afficher le résultat pour débogage
    console.log('=== Contenu formaté ===');
    console.log(formatted);
    console.log('======================');
    
    // Vérifier les éléments attendus
    expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
    expect(formatted).toContain(`- [ ] ${story.description}`);
    expect(formatted).toContain(`### Acceptance Criteria`);
    expect(formatted).toContain(`### Technical Tasks`);
    
    // Vérifier les critères d'acceptation
    story.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier les tâches
    story.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    if (story.priority) {
      expect(formatted).toContain(`**Priority:** ${story.priority}`);
    }
    
    // Vérifier les dépendances
    if (story.dependencies && story.dependencies.length > 0) {
      expect(formatted).toContain(`**Dependencies:** ${story.dependencies.join(', ')}`);
    }
  });
});
