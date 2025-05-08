/**
 * Utilitaires pour les tests - Standardise les tests pour éviter les incohérences
 * @module test-utils
 */

const sinon = require('sinon');
const { jest } = require('@jest/globals');

/**
 * Crée un backlog de test valide qui respecte les schémas de validation
 * Ce backlog est compatible avec TOUS les validateurs du système
 * @returns {Object} Un backlog prêt à être utilisé dans les tests
 */
function createValidTestBacklog() {
  return {
    projectName: "Test Project",
    description: "Test Description",
    epics: [
      {
        id: "EPIC-001",
        title: "Test Epic",
        description: "Epic Description",
        features: []
      }
    ],
    mvp: [
      {
        id: "US001",
        title: "Test Story",
        description: "Story Description",
        acceptance_criteria: ["Criterion 1", "Criterion 2"],
        tasks: ["Task 1", "Task 2"],
        priority: "HIGH"
      }
    ],
    iterations: [
      {
        id: "ITER-001",
        name: "Iteration 1",
        goal: "Test Goal",
        stories: [
          {
            id: "US002",
            title: "Test Story 2",
            description: "Story Description",
            acceptance_criteria: ["Criterion 1", "Criterion 2"],
            tasks: ["Task 1", "Task 2"],
            priority: "HIGH"
          }
        ]
      }
    ]
  };
}

/**
 * Crée un mock client API qui retourne un backlog valide
 * Utilisez cette fonction dans les tests qui appellent generateBacklog
 * @returns {Object} Un mock client API pour les tests
 */
function createMockApiClient() {
  return {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                function_call: {
                  name: "deliver_backlog",
                  arguments: JSON.stringify(createValidTestBacklog())
                }
              }
            }
          ]
        })
      }
    }
  };
}

/**
 * Crée un mock pour ValidatorsFactory qui retourne toujours valid: true
 * @returns {Object} Un mock ValidatorsFactory pour les tests
 */
function createMockValidatorsFactory() {
  return {
    validate: jest.fn().mockReturnValue({ valid: true })
  };
}

/**
 * Crée et configure un sandbox sinon standardisé pour les tests
 * Isole proprement les mocks entre les tests
 * @returns {Object} Sandbox sinon configuré
 */
function createTestSandbox() {
  return sinon.createSandbox();
}

/**
 * Restaure un sandbox sinon de façon sécurisée
 * Évite les erreurs lorsque le sandbox n'est pas défini
 * @param {Object} sandbox Sandbox sinon à restaurer
 */
function restoreSandbox(sandbox) {
  if (sandbox) {
    sandbox.restore();
  }
}

/**
 * Configure un test avant/après avec gestion du sandbox
 * À utiliser dans les blocs describe pour standardiser l'initialisation
 * @param {Function} setupFn Fonction de configuration (reçoit le sandbox en paramètre)
 * @returns {Object} Fonctions beforeEach et afterEach prêtes à utiliser
 */
function setupTestWithSandbox(setupFn) {
  let sandbox;
  
  beforeEach(() => {
    sandbox = createTestSandbox();
    if (setupFn) {
      setupFn(sandbox);
    }
  });
  
  afterEach(() => {
    restoreSandbox(sandbox);
  });
}

/**
 * Configure un environnement de test spécifique pour backlog-generator
 * Standardise l'initialisation pour tous les tests qui utilisent ce module
 * @returns {Object} Objets mockés et fonctions prêtes à utiliser dans les tests
 */
function setupBacklogGeneratorTest() {
  // Mock ValidatorsFactory
  jest.mock('../server/lib/utils/validators/validators-factory', () => ({
    validate: jest.fn().mockReturnValue({ valid: true })
  }));
  
  // Récupérer la référence au mock pour pouvoir le configurer
  const mockValidatorsFactory = require('../server/lib/utils/validators/validators-factory');
  
  // Créer un backlog de test valide
  const testBacklog = createValidTestBacklog();
  
  // Créer un mock client API avec une réponse prédéfinie
  const mockApiClient = {
    baseURL: 'https://api.openai.com/v1',
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [
            {
              message: {
                function_call: {
                  name: "deliver_backlog",
                  arguments: JSON.stringify(testBacklog)
                }
              }
            }
          ]
        })
      }
    }
  };

  // Fonction utilitaire de configuration des tests
  const setupTest = () => {
    // Nettoyer les mocks avant chaque test
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // Reset les mocks après chaque test
    afterEach(() => {
      jest.clearAllMocks();
    });
  };

  // Importer le module à tester après avoir configuré les mocks
  const { generateBacklog } = require('../server/lib/backlog-generator');

  return {
    mockValidatorsFactory,
    mockApiClient,
    testBacklog,
    setupTest,
    generateBacklog
  };
}

module.exports = {
  createValidTestBacklog,
  createMockApiClient,
  createMockValidatorsFactory,
  createTestSandbox,
  restoreSandbox,
  setupTestWithSandbox,
  setupBacklogGeneratorTest
};
