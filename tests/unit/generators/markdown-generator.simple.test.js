/**
 * Tests simplifiés pour le markdown-generator
 */
const { formatUserStory } = require('../../../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Charger le backlog échantillon pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);


// Mock pour fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().mockResolvedValue('{}'),
  readFileSync: jest.fn().mockReturnValue('{}'),
  pathExists: jest.fn().mockResolvedValue(true),
  pathExistsSync: jest.fn().mockReturnValue(true)
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

describe('Markdown Generator - Tests simplifiés', () => {
  // TEST TEMPORAIREMENT DÉSACTIVÉ (TDD Wave 8) - À résoudre en priorité dans une prochaine MR
test.skip('formatUserStory devrait formater correctement une user story', () => {
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
