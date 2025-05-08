/**
 * Configuration centralisée pour tous les tests Jest - TDD Wave 8
 * Ce fichier est automatiquement chargé par Jest avant l'exécution des tests.
 */

// Configuration globale des mocks
// Mocker les modules de base utilisés partout
jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn(),
  ensureDir: jest.fn().mockResolvedValue(undefined),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('{}'),
  readJson: jest.fn().mockResolvedValue({}),
  writeJson: jest.fn().mockResolvedValue(undefined),
  pathExists: jest.fn().mockResolvedValue(true)
}));

// Mocker console pour éviter les sorties verbeuses pendant les tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Mock pour chalk pour éviter les problèmes de coloration
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  red: jest.fn(text => text),
  yellow: jest.fn(text => text),
  cyan: jest.fn(text => text),
  magenta: jest.fn(text => text),
  gray: jest.fn(text => text),
  white: jest.fn(text => text),
  bold: jest.fn(text => text)
}));

// Mocker path pour éviter les problèmes de chemins cross-platform
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn((...args) => {
      // Filtrer les arguments undefined ou null
      const validArgs = args.filter(arg => arg !== undefined && arg !== null);
      if (validArgs.length === 0) return '';
      return validArgs.join('/');
    }),
    resolve: jest.fn((...args) => {
      const validArgs = args.filter(arg => arg !== undefined && arg !== null);
      if (validArgs.length === 0) return '';
      return validArgs.join('/');
    }),
    dirname: jest.fn(path => {
      if (!path) return '';
      const parts = path.split('/');
      return parts.slice(0, -1).join('/');
    }),
    basename: jest.fn(path => {
      if (!path) return '';
      const parts = path.split('/');
      return parts[parts.length - 1];
    })
  };
});

// OpenAI mock standard pour tous les tests
jest.mock('openai', () => {
  const mockOpenAIClient = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                feature: {
                  title: "Feature de test",
                  description: "Description de test"
                },
                epicParentName: "Epic Parent Test",
                userStories: [
                  {
                    title: "User Story de test",
                    asA: "En tant que testeur",
                    iWant: "Je veux tester les mocks",
                    soThat: "Afin de garantir la cohérence"
                  }
                ]
              })
            }
          }]
        })
      }
    }
  };

  return {
    OpenAI: jest.fn(() => mockOpenAIClient)
  };
});

// Groq mock qui utilise la même structure qu'OpenAI pour la compatibilité
jest.mock('groq-sdk', () => {
  const mockGroqClient = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                feature: {
                  title: "Feature de test Groq",
                  description: "Description de test Groq"
                },
                epicParentName: "Epic Parent Test Groq",
                userStories: [
                  {
                    title: "User Story de test Groq",
                    asA: "En tant que testeur Groq",
                    iWant: "Je veux tester les mocks Groq",
                    soThat: "Afin de garantir la cohérence avec Groq"
                  }
                ]
              })
            }
          }]
        })
      }
    },
    baseURL: "https://api.groq.com/openai/v1"
  };

  return mockGroqClient;
});

// Configuration de la factory de validateurs
jest.mock('../server/lib/utils/validators/validators-factory', () => ({
  validate: jest.fn().mockReturnValue({ valid: true }),
  getValidator: jest.fn().mockReturnValue({
    validate: jest.fn().mockReturnValue({ valid: true })
  })
}));
