/**
 * Test d'intégration MCP minimal - TDD Wave 8
 * Test isolé pour identifier les problèmes spécifiques
 */

const { handleToolsCall } = require('../../../server/lib/mcp-router');

// Mock minimal de fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().resolves(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().resolves(),
  existsSync: jest.fn().mockReturnValue(true)
}));

// Mock de path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Mock du générateur de backlog
jest.mock('../../../server/lib/backlog-generator', () => ({
  generateBacklog: jest.fn().mockResolvedValue({
    success: true,
    result: {
      projectName: 'Test Project',
      epics: [{ id: 'epic-1', title: 'Epic Test' }],
      mvp: [],
      iterations: []
    }
  })
}));

describe('MCP Router - Test minimal TDD Wave 8', () => {
  test('handleToolsCall peut être appelé sans erreur', async () => {
    // Préparer une requête minimale
    const req = {
      params: {
        name: 'generateBacklog',
        arguments: {
          projectName: 'Test Project',
          projectDescription: 'Test description'
        }
      }
    };
    
    // Appeler la fonction
    const result = await handleToolsCall(req);
    
    // Vérifications minimales
    expect(result).toBeDefined();
    expect(result).toHaveProperty('content');
  });
});
