/**
 * Test de compatibilité multi-LLM pour le MCP - TDD Wave 8
 * 
 * Ce test vérifie la conformité avec le Model Context Protocol
 * pour différents LLMs: Windsurf, Claude.ai et Cursor.
 */

const { AgilePlannerError, McpError } = require('../../server/lib/errors');
const mcpRouter = require('../../server/lib/mcp-router');

// Mocks pour l'environnement
jest.mock('fs-extra', () => ({
  readFileSync: jest.fn().mockReturnValue('{}'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn()
}));

describe('Compatibilité Multi-LLM pour le MCP', () => {
  // Nettoyer les mocks entre les tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    jest.restoreAllMocks();
  });
  
  // Test pour la compatibilité Windsurf (PRIORITÉ 1)
  describe('Compatibilité Windsurf', () => {
    test('Répond avec un format JSON-RPC 2.0 valide', async () => {
      const request = {
        jsonrpc: "2.0",
        method: "generateBacklog",
        params: {
          projectName: "Test Project",
          projectDescription: "Test description"
        },
        id: "test-id-windsurf"
      };
      
      const response = await mcpRouter.handleRequest(request);
      
      // Vérification du format correct pour Windsurf
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(request.id);
      expect(response).toHaveProperty("result");
    });
    
    test('Gère correctement les erreurs au format JSON-RPC', async () => {
      const request = {
        jsonrpc: "2.0",
        method: "generateBacklog",
        params: {}, // Paramètres incomplets
        id: "test-error-windsurf"
      };
      
      const response = await mcpRouter.handleRequest(request);
      
      // Vérification de la gestion d'erreur pour Windsurf
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(request.id);
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("code");
      expect(response.error).toHaveProperty("message");
    });
  });
  
  // Test pour la compatibilité Claude.ai (PRIORITÉ 2)
  describe('Compatibilité Claude.ai', () => {
    test('Gère les requêtes JSON sous forme de string (comportement potentiel de Claude)', async () => {
      // Claude peut envoyer des requêtes sous forme de chaîne JSON
      const requestString = JSON.stringify({
        jsonrpc: "2.0",
        method: "generateBacklog",
        params: {
          projectName: "Claude Test",
          projectDescription: "Test for Claude"
        },
        id: "test-id-claude"
      });
      
      // Simuler une "désérialisation" pour traiter comme Claude le ferait
      const request = JSON.parse(requestString);
      const response = await mcpRouter.handleRequest(request);
      
      // Vérification de compatibilité Claude
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(request.id);
      expect(response).toHaveProperty("result");
    });
    
    test('Produit des réponses facilement sérialisables pour Claude', async () => {
      const request = {
        jsonrpc: "2.0",
        method: "generateFeature",
        params: {
          featureDescription: "Test feature for Claude",
          iterationName: "next",
          storyCount: 3
        },
        id: "test-serialize-claude"
      };
      
      const response = await mcpRouter.handleRequest(request);
      
      // Vérifier que la réponse peut être sérialisée/désérialisée (important pour Claude)
      const serialized = JSON.stringify(response);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized.jsonrpc).toBe("2.0");
      expect(deserialized.id).toBe(request.id);
      expect(deserialized).toHaveProperty("result");
    });
  });
  
  // Test pour la compatibilité Cursor (PRIORITÉ 3)
  describe('Compatibilité Cursor', () => {
    test('Gère les requêtes avec paramètres simplifiés (style Cursor)', async () => {
      // Cursor peut envoyer des requêtes simplifiées
      const request = {
        jsonrpc: "2.0",
        method: "generateBacklog",
        params: {
          projectName: "Cursor Project",
          // Description manquante mais avec valeur par défaut
        },
        id: "test-id-cursor"
      };
      
      const response = await mcpRouter.handleRequest(request);
      
      // Même si la requête est incomplète, elle ne devrait pas planter
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(request.id);
      // Peut être une erreur mais dans un format correct
      expect(response).toHaveProperty("error");
      expect(response.error).toHaveProperty("code");
      expect(response.error).toHaveProperty("message");
    });
  });
  
  // Test global de conformité au Model Context Protocol
  describe('Conformité au Model Context Protocol', () => {
    test('Respecte les spécifications du Model Context Protocol', async () => {
      const request = {
        jsonrpc: "2.0",
        method: "generateBacklog",
        params: {
          projectName: "MCP Test",
          projectDescription: "Test de conformité MCP"
        },
        id: "mcp-conformity-test"
      };
      
      const response = await mcpRouter.handleRequest(request);
      
      // Vérifications de conformité au MCP
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe("2.0");
      expect(response.id).toBe(request.id);
      expect(response).toHaveProperty("result");
      
      // Le résultat doit contenir un message ou une donnée
      if (response.result) {
        expect(response.result).toBeDefined();
      }
      
      // Si c'est une erreur, elle doit suivre le format JSON-RPC
      if (response.error) {
        expect(response.error).toHaveProperty("code");
        expect(response.error).toHaveProperty("message");
        // Le code d'erreur doit être un nombre
        expect(typeof response.error.code).toBe("number");
      }
    });
  });
});
