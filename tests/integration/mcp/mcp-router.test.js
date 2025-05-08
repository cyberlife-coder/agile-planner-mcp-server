/**
 * Tests unitaires pour le routeur MCP
 * @jest
 */

// Mock des dépendances
jest.mock('../server/lib/api-client', () => ({
  getClient: jest.fn().mockReturnValue({ /* client mock */ }),
  getCurrentProvider: jest.fn().mockReturnValue('openai')
}));

jest.mock('../server/lib/backlog-generator', () => ({
  generateBacklog: jest.fn().mockResolvedValue({
    epics: [{ id: 'epic1' }],
    userStories: [{ id: 'us1' }, { id: 'us2' }]
  })
}));

jest.mock('../server/lib/feature-generator', () => ({
  generateFeature: jest.fn().mockResolvedValue({
    feature: { name: 'Test Feature' },
    userStories: [{ id: 'us1' }, { id: 'us2' }, { id: 'us3' }]
  })
}));

// Import du module à tester (après les mocks)
const mcpRouter = require('../../server/lib/mcp-router');
const { McpError } = require('../../server/lib/errors');

describe('MCP Router', () => {
  describe('handleInitialize', () => {
    test('should return correct protocol information', () => {
      const result = mcpRouter.handleInitialize();
      
      expect(result).toHaveProperty('protocolVersion');
      expect(result).toHaveProperty('capabilities.tools', true);
      expect(result).toHaveProperty('serverInfo.name', 'agile-planner-mcp-server');
      expect(result).toHaveProperty('serverInfo.version');
    });
  });

  describe('handleToolsList', () => {
    test('should return list of available tools', () => {
      const result = mcpRouter.handleToolsList();
      
      expect(result).toHaveProperty('tools');
      expect(Array.isArray(result.tools)).toBe(true);
      
      const toolNames = result.tools.map(tool => tool.name);
      expect(toolNames).toContain('generateBacklog');
      expect(toolNames).toContain('generateFeature');
      
      // Validation des schémas
      const backlogTool = result.tools.find(t => t.name === 'generateBacklog');
      expect(backlogTool).toHaveProperty('inputSchema');
      expect(backlogTool.inputSchema).toHaveProperty('type', 'object');
    });
  });

  describe('handleRequest', () => {
    test('should handle initialize request', async () => {
      const req = { jsonrpc: '2.0', id: 1, method: 'initialize' };
      const result = await mcpRouter.handleRequest(req);
      
      expect(result).toHaveProperty('protocolVersion');
    });
    
    test('should handle tools/list request', async () => {
      const req = { jsonrpc: '2.0', id: 2, method: 'tools/list' };
      const result = await mcpRouter.handleRequest(req);
      
      expect(result).toHaveProperty('tools');
    });
    
    test('should throw error for unknown method', async () => {
      const req = { jsonrpc: '2.0', id: 3, method: 'unknown/method' };
      
      await expect(mcpRouter.handleRequest(req)).rejects.toThrow();
    });
  });
});
