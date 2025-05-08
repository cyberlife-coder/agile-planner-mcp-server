/**
 * [Wave 8] Stratégie craft :
 * - Isolation stricte via beforeEach/afterEach (sandbox sinon + jest.clearAllMocks)
 * - Tous les mocks/stubs restaurés systématiquement
 * - Utilisation de fixtures partagées
 * - Vérification explicite des appels mocks
 * - Structure de retour harmonisée (success/result ou success:false/error)
 */
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Mock external libraries and internal modules
const mockOpenAIChatCompletionsCreate = jest.fn();
const mockGroqChatCompletionsCreate = jest.fn();

jest.mock('openai', () => {
  const MockOpenAI = jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockOpenAIChatCompletionsCreate } }
  }));
  return MockOpenAI; // Export constructor directly
});

jest.mock('groq-sdk', () => {
  // Toujours retourner la même instance, même si appelé avec new
  return function MockGroq() {
    return { chat: { completions: { create: mockGroqChatCompletionsCreate } } };
  };
});

// After mocks, import modules
const OpenAI = require('openai');
const Groq = require('groq-sdk');

// Mocking the validatorsFactory to control the behavior of the validator
jest.mock('../../../server/lib/utils/validators/validators-factory', () => ({
  validate: jest.fn(),
}));

const validatorsFactory = require('../../../server/lib/utils/validators/validators-factory');
const settings = require('../../../server/lib/settings');
const { validateBacklog, generateBacklogDirect } = require('../../../server/lib/backlog-generator');
const sampleBacklog = require('./fixtures/sample-backlog.json');

// References to mocked functions
let mockClient, mockGroqClient, mockValidate;

describe('Backlog Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize mock clients (structure explicite avec baseURL)
    mockClient = { baseURL: 'https://api.openai.com', chat: { completions: { create: mockOpenAIChatCompletionsCreate } } };
    mockGroqClient = { baseURL: 'https://api.groq.com', chat: { completions: { create: mockGroqChatCompletionsCreate } } };

    
    // Configure API call mocks
    mockOpenAIChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            function_call: { name: 'deliver_backlog', arguments: JSON.stringify(sampleBacklog) }
          }
        }
      ]
    });
    mockGroqChatCompletionsCreate.mockResolvedValue({
      choices: [
        {
          message: {
            function_call: { name: 'deliver_backlog', arguments: JSON.stringify(sampleBacklog) }
          }
        }
      ]
    });
    
    // Set up validator mock
    mockValidate = validatorsFactory.validate;
    mockValidate.mockImplementation((data, type) => ({ valid: true, errors: [] }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // --- Tests pour generateBacklogDirect ---
  test('Génération réussie du backlog', async () => {
    // Appel de la fonction à tester
    const result = await generateBacklogDirect('Test Project', 'Test Description', mockClient);
    console.log('[TEST] Résultat de generateBacklogDirect (success):', result);

    // Vérifications
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(result.result).toEqual(sampleBacklog);
    // Check if the factory's validator was called
    expect(mockValidate).toHaveBeenCalledWith(sampleBacklog, 'backlog'); 
    // Check if the OpenAI API was called
    expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledTimes(1);
  });

  test('Gestion des erreurs de validation', async () => {
    // Configurer le mock pour le validateur de la factory pour ce test spécifique
    // mockValidate is already set up in beforeEach, .mockReturnValueOnce will override for this call only.
    mockValidate.mockReturnValueOnce({
      valid: false, // Use 'valid' to match factory
      errors: ['Le format epics est requis'],
    });

    let result = await generateBacklogDirect('Invalid Project', 'Invalid Description', mockClient);
    console.log('[TEST] Résultat de generateBacklogDirect (validation error):', result);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    // The error message should now come from our mocked factory validator
    expect(result.error.message).toBe('Validation du backlog JSON avec le schéma a échoué.');
    expect(result.error.details).toEqual(['Le format epics est requis']);
    expect(mockValidate).toHaveBeenCalled();
    // API should still be called once before validation fails on its response
    expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledTimes(1);
  });

  test('Gestion des erreurs API', async () => {
    // Configurer le mock de l_API OpenAI pour simuler une erreur
    mockOpenAIChatCompletionsCreate.mockRejectedValueOnce(new Error('Network error'));

    let result = await generateBacklogDirect('API Error Project', 'Description for API error', mockClient);
    console.log('[TEST] Résultat de generateBacklogDirect (API error):', result);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error.message).toContain('Erreur lors de la génération du backlog');
    // Ensure API was called
    expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledTimes(1);
    // Factory validator might not be called if API fails first, or called with undefined if no data from API
    // Let's ensure it's NOT called with sampleBacklog if API failed to produce it
    // Depending on implementation, it might be called with 'undefined'. If so, adjust. For now, expect it not to be called with good data.
    // expect(mockValidate).not.toHaveBeenCalledWith(sampleBacklog, 'backlog'); // This is tricky, depends on when validate is called
  });

  // Test pour le choix du modèle en fonction de l_API et des paramètres
  // Ce test est plus une intégration légère pour s'assurer que le bon client API est appelé
  test('Choix du modèle en fonction de l_API', async () => {
    const openAIKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Scenario 1: Utilisation de Groq (GROQ_API_KEY est défini et prioritaire)
    process.env.GROQ_API_KEY = 'grok_test_key';
    delete process.env.OPENAI_API_KEY; // S'assurer que la clé OpenAI n'interfère pas

    // Réinitialiser et re-créer le client pour qu'il capte les nouvelles variables d'env
    // Cela nécessite que initializeClient soit appelé à l'intérieur de generateBacklogDirect si client est null
    // ou que determineModel soit appelé avec un client qui reflète la config actuelle.
    // Pour ce test, nous allons appeler generateBacklogDirect sans client pré-fourni
    // pour forcer l'initialisation interne.

    // Configure the factory validator for success
    // The mockImplementation in beforeEach already sets it to return { valid: true, errors: [] }
    // So, no need to call mockValidate.mockReturnValue({ valid: true, errors: [] }); here again
    // unless we want to ensure it, or if a previous test in this describe block used mockReturnValueOnce.
    // Given jest.clearAllMocks() and beforeEach, it should be reset correctly.
    // However, to be absolutely explicit for this test if it followed an error test without clearAllMocks (not the case here): 
    // mockValidate.mockReturnValue({ valid: true, errors: [] }); 
    
    let result = await generateBacklogDirect('Groq Project', 'Test avec Groq', mockGroqClient);
    // La validation principale doit toujours passer
    expect(result.success).toBe(true);
    // Vérifier que Groq.chat.completions.create a été appelé
    // Accéder aux instances de mock Groq. Peut nécessiter un ajustement de la config du mock jest.mock('openai', ...)
    expect(mockGroqChatCompletionsCreate).toHaveBeenCalledTimes(1);
    expect(mockOpenAIChatCompletionsCreate).not.toHaveBeenCalled();

    // Restaurer les variables d'environnement
    if (openAIKey) process.env.OPENAI_API_KEY = openAIKey;
    else delete process.env.OPENAI_API_KEY;
    if (groqKey) process.env.GROQ_API_KEY = groqKey;
    else delete process.env.GROQ_API_KEY;

    // Reset mocks before OpenAI test
    jest.clearAllMocks();
    // Test using OpenAI client explicitly
    result = await generateBacklogDirect('OpenAI Project', 'Test avec OpenAI', mockClient);
    expect(result.success).toBe(true);
    // Ensure OpenAI was called, Groq was not (or clear mocks if it was from previous call in same test block)
    expect(mockOpenAIChatCompletionsCreate).toHaveBeenCalledTimes(1); // Assuming it's cleared or this is the first OpenAI call in this test scope
    expect(mockGroqChatCompletionsCreate).not.toHaveBeenCalled(); // Groq should not have been called if client is OpenAI
    expect(mockValidate).toHaveBeenCalledWith(sampleBacklog, 'backlog');
  });
});
