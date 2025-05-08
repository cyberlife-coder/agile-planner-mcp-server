/**
 * Test ultra-isolé de validateBacklog - TDD Wave 8
 * Appliquer un mock au module entier avec une implémentation minimale
 */

// 1. Mock TOUS les modules externes avant l'import
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text)
}));

jest.mock('openai', () => ({
  OpenAI: jest.fn()
}));

jest.mock('groq-sdk', () => ({}));

jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

// 2. Mock le module validatorsFactory avant l'import du module principal
jest.mock('../../../server/lib/utils/validators/validators-factory', () => {
  return {
    validate: jest.fn().mockReturnValue({ valid: true })
  };
});

// 3. Supprimer les sorties console pour le test
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn()
};

// 4. Importer le module après tous les mocks
const backlogGenerator = require('../../../server/lib/backlog-generator');

// Test minimal isolé
describe('validateBacklog - Test TDD Wave 8 ultra-isolé', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('validateBacklog accepte un backlog minimal valide', () => {
    // Backlog de test minimal
    const minimalBacklog = {
      projectName: "Projet de test",
      description: "Description de test",
      epics: [
        {
          id: "epic-1",
          name: "Epic de test",
          description: "Description de l'epic"
        }
      ]
    };

    // Appel de la fonction
    const result = backlogGenerator.validateBacklog(minimalBacklog);
    
    // Vérifications
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
  });
});
