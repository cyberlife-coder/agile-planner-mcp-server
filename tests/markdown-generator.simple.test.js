/**
 * Tests simplifiés pour le markdown-generator
 */
const { formatUserStory } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Charger le backlog échantillon pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

describe('Markdown Generator - Tests simplifiés', () => {
  test('formatUserStory devrait formater correctement une user story', () => {
    // Préparer une user story de test
    const userStory = sampleBacklog.mvp[0];
    
    // Appeler la fonction à tester
    const markdown = formatUserStory(userStory);
    
    // Vérifier le résultat
    expect(markdown).toBeDefined();
    expect(typeof markdown).toBe('string');
    
    // Vérifier que le markdown contient les informations de la user story
    expect(markdown).toContain(userStory.title);
    expect(markdown).toContain(userStory.description);
    
    // Vérifier la structure du markdown
    expect(markdown).toContain('# ');
    expect(markdown).toContain('## ');
  });
});
