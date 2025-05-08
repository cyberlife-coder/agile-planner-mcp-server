/**
 * Tests pour le module backlog-generator
 * Adaptés pour fonctionner avec la nouvelle architecture de validation basée sur le pattern Strategy
 */
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Mock pour la factory de validateurs
jest.mock('../server/lib/utils/validators/validators-factory', () => {
  // Créer un mock pour la fonction validate
  return {
    validate: jest.fn()
  };
});

// Importer après les mocks
const { generateBacklog } = require('../server/lib/backlog-generator');
// Importer l'instance mockée
const validatorsFactory = require('../server/lib/utils/validators/validators-factory');

// Charge le backlog échantillon pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

describe('Backlog Generator', () => {
  // Variables partagées
  let mockClient;
  let sandbox;
  let generateBacklogDirect;
  let mockValidate;
  
  beforeEach(() => {
    // Créer un sandbox sinon isolé pour chaque test
    sandbox = sinon.createSandbox();
    
    // Configurer le mock client pour l'API
    mockClient = {
      baseURL: 'https://api.openai.com/v1',
      chat: {
        completions: {
          create: sandbox.stub()
        }
      }
    };
    
    // Récupérer la référence au mock validate
    mockValidate = validatorsFactory.validate;
    
    // Configurer le comportement par défaut du mock validate
    mockValidate.mockImplementation((data, type) => {
      // Accepter les backlogs qui ont soit epicss (format du sample-backlog.json) soit epics (format attendu par le validateur)
      if (data && (data.epics || data.epicss)) {
        return { valid: true };
      } else {
        return { 
          valid: false, 
          errors: ['La section epics ou epicss est requise']
        };
      }
    });
    
    // Créer une référence directe à la fonction pour éviter les problèmes de binding
    generateBacklogDirect = generateBacklog;
  });
  
  afterEach(() => {
    // Restaurer tous les mocks après chaque test
    sandbox.restore();
    // Réinitialiser les mocks Jest
    jest.clearAllMocks();
  });
  
  test('Génération réussie du backlog', async () => {
    // Configurer le mock validate pour qu'il retourne valid: true
    mockValidate.mockImplementation(() => ({ valid: true }));
    
    // Configurer le mock pour retourner un backlog valide
    mockClient.chat.completions.create.resolves({
      choices: [
        {
          message: {
            function_call: {
              name: "deliver_backlog",
              arguments: JSON.stringify(sampleBacklog)
            }
          }
        }
      ]
    });
    
    // Appel de la fonction à tester (format compatible avec les tests)
    const result = await generateBacklogDirect('Projet Test', mockClient);
    
    // Vérifier le résultat
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.result).toEqual(sampleBacklog);
    
    // Vérifier que le validateur a été appelé
    expect(mockValidate).toHaveBeenCalled();
  });

  test('Gestion des erreurs de validation', async () => {
    // Configurer le mock validate pour qu'il retourne une erreur
    mockValidate.mockImplementation(() => ({
      valid: false,
      errors: ['La section epics est requise']
    }));
    
    // Configurer le mock pour retourner un backlog
    mockClient.chat.completions.create.resolves({
      choices: [
        {
          message: {
            function_call: {
              name: "deliver_backlog",
              arguments: JSON.stringify(sampleBacklog)
            }
          }
        }
      ]
    });
    
    // Appel de la fonction à tester (format compatible avec les tests)
    const result = await generateBacklogDirect('Projet invalide', mockClient);
    
    // Vérifier que le résultat indique un échec de validation
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    
    // Vérifier que le validateur a été appelé
    expect(mockValidate).toHaveBeenCalled();
  });

  test('Gestion des erreurs API', async () => {
    // Configurer le mock pour simuler une erreur API
    const errorMessage = 'Erreur de l\'API';
    mockClient.chat.completions.create.rejects(new Error(errorMessage));
    
    // Appel de la fonction à tester et vérification de l'erreur
    const result = await generateBacklogDirect('Projet avec erreur', mockClient);
    
    // Vérifier que le résultat indique un échec
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain(errorMessage);
  });

  test('Choix du modèle en fonction de l\'API', async () => {
    // Configurer le mock validate pour qu'il retourne valid: true
    mockValidate.mockImplementation(() => ({ valid: true }));
    
    // Test avec OpenAI
    const openaiClient = { 
      baseURL: 'https://api.openai.com/v1',
      chat: { 
        completions: { 
          create: sandbox.stub().resolves({
            choices: [
              {
                message: {
                  function_call: {
                    name: "deliver_backlog",
                    arguments: JSON.stringify(sampleBacklog)
                  }
                }
              }
            ]
          })
        } 
      } 
    };
    
    // Appel avec client OpenAI
    await generateBacklogDirect('Projet OpenAI', openaiClient);
    
    // Vérifier que le modèle OpenAI a été utilisé
    const openaiArgs = openaiClient.chat.completions.create.firstCall.args[0];
    expect(openaiArgs.model).toMatch(/gpt/i);
    
    // Test avec GROQ
    const groqClient = { 
      baseURL: 'https://api.groq.com/openai/v1',
      chat: { 
        completions: { 
          create: sandbox.stub().resolves({
            choices: [
              {
                message: {
                  function_call: {
                    name: "deliver_backlog",
                    arguments: JSON.stringify(sampleBacklog)
                  }
                }
              }
            ]
          })
        } 
      } 
    };
    
    // Appel avec client GROQ
    await generateBacklogDirect('Projet GROQ', groqClient);
    
    // Vérifier que le modèle GROQ a été utilisé
    const groqArgs = groqClient.chat.completions.create.firstCall.args[0];
    expect(groqArgs.model).toMatch(/llama/i);
  });  
});
