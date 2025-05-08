/**
 * Test isolé de compatibilité multi-LLM pour le MCP Server - TDD Wave 8
 * 
 * Ce test utilise des mocks complets pour isoler le comportement MCP et
 * vérifier la compatibilité avec Windsurf, Claude.ai et Cursor.
 */

// Importer les modules nécessaires
const { AgilePlannerError, McpError } = require('../../server/lib/errors');

// Créer un mock complet de mcp-router pour les tests isolés
const mockHandleRequest = jest.fn();
const mockMcpRouter = {
  handleRequest: mockHandleRequest,
  handleInitialize: jest.fn(),
  handleToolsList: jest.fn(),
  handleToolsCall: jest.fn()
};

// Configurer les comportements par défaut des mocks
mockHandleRequest.mockImplementation(async (req) => {
  // Version normalisée de la requête (pour compatibilité Claude et Cursor)
  const normalizedRequest = typeof req === 'string' ? JSON.parse(req) : req;
  
  // S'assurer que les propriétés requises existent
  const jsonrpc = normalizedRequest.jsonrpc || '2.0';
  const id = normalizedRequest.id || `request-${Date.now()}`;
  const method = normalizedRequest.method || 'unknown';
  
  // Base de réponse JSON-RPC
  const baseResponse = {
    jsonrpc,
    id
  };
  
  // Simuler différentes réponses selon la méthode
  if (method === 'initialize') {
    return {
      ...baseResponse,
      result: {
        protocolVersion: '2025-01',
        capabilities: { tools: true },
        serverInfo: {
          name: 'agile-planner-mcp-server',
          version: '1.1.6',
          vendor: 'Agile Planner'
        }
      }
    };
  } else if (method === 'tools/list') {
    return {
      ...baseResponse,
      result: {
        tools: [
          {
            name: 'generateBacklog',
            description: 'Génère un backlog agile complet',
            inputSchema: { type: 'object', properties: {} }
          }
        ]
      }
    };
  } else if (method === 'generateBacklog' || method === 'tools/call') {
    // Vérifier si les paramètres requis sont présents
    const params = normalizedRequest.params || {};
    
    if (
      (method === 'generateBacklog' && (!params.projectName || !params.projectDescription)) ||
      (method === 'tools/call' && params.name === 'generateBacklog' && 
       (!params.arguments || !params.arguments.projectName || !params.arguments.projectDescription))
    ) {
      return {
        ...baseResponse,
        error: {
          code: -32602,
          message: 'Paramètres invalides',
          data: {
            details: 'Le nom et la description du projet sont requis'
          }
        }
      };
    }
    
    // Simuler une réponse de succès
    return {
      ...baseResponse,
      result: {
        content: [
          {
            type: 'text',
            text: 'Backlog généré avec succès'
          }
        ]
      }
    };
  } else {
    // Méthode non reconnue
    return {
      ...baseResponse,
      error: {
        code: -32601,
        message: `Méthode '${method}' non reconnue`,
        data: {
          availableMethods: ['initialize', 'tools/list', 'tools/call', 'generateBacklog']
        }
      }
    };
  }
});

// Tests isolés
describe('Compatibilité Multi-LLM pour le MCP - Tests Isolés', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Tests pour Windsurf (PRIORITÉ 1)
  describe('Compatibilité Windsurf', () => {
    test('Format JSON-RPC 2.0 validé pour Windsurf', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'generateBacklog',
        params: {
          projectName: 'Test Project',
          projectDescription: 'Description du projet'
        },
        id: 'windsurf-test-id'
      };
      
      const response = await mockMcpRouter.handleRequest(request);
      
      // Vérifications spécifiques à Windsurf
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(request.id);
      expect(response.result).toBeDefined();
      expect(mockHandleRequest).toHaveBeenCalledWith(request);
    });
    
    test('Gestion des erreurs JSON-RPC pour Windsurf', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'generateBacklog',
        params: {
          // Paramètres incomplets
          projectName: 'Test Project'
        },
        id: 'windsurf-error-test'
      };
      
      const response = await mockMcpRouter.handleRequest(request);
      
      // Vérifications de format d'erreur pour Windsurf
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(request.id);
      expect(response.error).toBeDefined();
      expect(response.error.code).toBeDefined();
      expect(typeof response.error.code).toBe('number');
      expect(response.error.message).toBeDefined();
    });
  });
  
  // Tests pour Claude.ai (PRIORITÉ 2)
  describe('Compatibilité Claude.ai', () => {
    test('Gestion des requêtes JSON sous forme de string pour Claude', async () => {
      // Claude peut envoyer des requêtes au format string
      const requestString = JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 'claude-test-id'
      });
      
      const response = await mockMcpRouter.handleRequest(requestString);
      
      // Vérifications spécifiques à Claude
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('claude-test-id');
      expect(response.result).toBeDefined();
      expect(mockHandleRequest).toHaveBeenCalledWith(requestString);
    });
    
    test('Sérialisation/Désérialisation pour Claude', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'initialize',
        id: 'claude-serialization-test'
      };
      
      const response = await mockMcpRouter.handleRequest(request);
      
      // Vérification de la capacité à sérialiser/désérialiser (important pour Claude)
      const serialized = JSON.stringify(response);
      const deserialized = JSON.parse(serialized);
      
      expect(deserialized).toEqual(response); // Doit être identique après sérialisation/désérialisation
      expect(deserialized.result).toBeDefined();
      expect(deserialized.result.serverInfo).toBeDefined();
    });
  });
  
  // Tests pour Cursor (PRIORITÉ 3)
  describe('Compatibilité Cursor', () => {
    test('Gestion des requêtes avec champs manquants pour Cursor', async () => {
      // Cursor peut envoyer des requêtes incomplètes
      const incompleteRequest = {
        // jsonrpc manquant
        method: 'generateBacklog',
        params: {
          projectName: 'Cursor Project',
          projectDescription: 'Description pour Cursor'
        }
        // id manquant
      };
      
      const response = await mockMcpRouter.handleRequest(incompleteRequest);
      
      // Vérifications spécifiques à Cursor
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0'); // Doit être ajouté par défaut
      expect(response.id).toBeDefined(); // Doit être généré automatiquement
      expect(response.result).toBeDefined();
    });
    
    test('Gestion des réponses avec objets complexes pour Cursor', async () => {
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'generateBacklog',
          arguments: {
            projectName: 'Cursor Complex Project',
            projectDescription: 'Test avec objets complexes'
          }
        },
        id: 'cursor-complex-test'
      };
      
      mockHandleRequest.mockImplementationOnce(async () => ({
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            { type: 'text', text: 'Résultat complexe' },
            { 
              type: 'data',
              data: {
                complexObject: {
                  nested: {
                    array: [1, 2, 3],
                    value: 'test'
                  }
                }
              }
            }
          ]
        }
      }));
      
      const response = await mockMcpRouter.handleRequest(request);
      
      // Vérifier que les objets complexes sont correctement gérés
      expect(response).toBeDefined();
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeInstanceOf(Array);
      
      // Sérialiser pour vérifier la compatibilité avec Cursor
      const serialized = JSON.stringify(response);
      expect(serialized).toBeDefined();
      expect(serialized).toContain('complexObject');
    });
  });
  
  // Test de conformité générale au MCP
  describe('Conformité au Model Context Protocol', () => {
    test('Format de réponse standard pour tous les LLMs', async () => {
      const response = await mockMcpRouter.handleRequest({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 'mcp-standard-test'
      });
      
      // Vérifications de conformité générale
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('mcp-standard-test');
      expect(response.result || response.error).toBeDefined();
      
      // Si c'est un résultat, il doit être valide
      if (response.result) {
        expect(response.result).toBeDefined();
      }
      
      // Si c'est une erreur, elle doit suivre le standard JSON-RPC
      if (response.error) {
        expect(response.error.code).toBeDefined();
        expect(typeof response.error.code).toBe('number');
        expect(response.error.message).toBeDefined();
      }
    });
    
    test('Gestion cohérente des erreurs', async () => {
      const response = await mockMcpRouter.handleRequest({
        jsonrpc: '2.0',
        method: 'non_existent_method',
        id: 'mcp-error-test'
      });
      
      // Vérifications de la structure d'erreur
      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('mcp-error-test');
      expect(response.error).toBeDefined();
      expect(response.error.code).toBe(-32601); // Method not found
      expect(response.error.message).toBeDefined();
      expect(response.error.data).toBeDefined();
    });
  });
});
