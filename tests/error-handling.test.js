/**
 * Tests unitaires pour le système de gestion des erreurs
 * @jest
 */

const { 
  AgilePlannerError, 
  ValidationError, 
  ApiError, 
  FileSystemError, 
  McpError 
} = require('../server/lib/errors');

describe('Error Classes', () => {
  describe('AgilePlannerError', () => {
    test('should create error with default code', () => {
      const error = new AgilePlannerError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('GENERAL_ERROR');
      expect(error.details).toBeNull();
    });

    test('should create error with custom code and details', () => {
      const error = new AgilePlannerError('Test error', 'CUSTOM_ERROR', { info: 'test' });
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('CUSTOM_ERROR');
      expect(error.details).toEqual({ info: 'test' });
    });

    test('should convert to MCP error format', () => {
      const error = new AgilePlannerError('Test error');
      const mcpError = error.toMcpError();
      expect(mcpError).toEqual({
        success: false,
        error: {
          message: 'Test error',
          code: 'GENERAL_ERROR',
          details: null
        }
      });
    });
  });

  describe('ValidationError', () => {
    test('should be an instance of AgilePlannerError', () => {
      const error = new ValidationError('Invalid input');
      expect(error).toBeInstanceOf(AgilePlannerError);
    });

    test('should have validation error code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('ApiError', () => {
    test('should be an instance of AgilePlannerError', () => {
      const error = new ApiError('API failure');
      expect(error).toBeInstanceOf(AgilePlannerError);
    });

    test('should have API error code', () => {
      const error = new ApiError('API failure');
      expect(error.code).toBe('API_ERROR');
    });
  });

  describe('FileSystemError', () => {
    test('should be an instance of AgilePlannerError', () => {
      const error = new FileSystemError('File not found');
      expect(error).toBeInstanceOf(AgilePlannerError);
    });

    test('should have file system error code', () => {
      const error = new FileSystemError('File not found');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
    });
  });

  describe('McpError', () => {
    test('should be an instance of AgilePlannerError', () => {
      const error = new McpError('Invalid MCP request');
      expect(error).toBeInstanceOf(AgilePlannerError);
    });

    test('should have MCP error code', () => {
      const error = new McpError('Invalid MCP request');
      expect(error.code).toBe('MCP_ERROR');
    });

    test('should convert to JSON-RPC error format', () => {
      const error = new McpError('Method not found', { info: 'test' });
      const jsonRpcError = error.toJsonRpcError();
      expect(jsonRpcError).toEqual({
        code: -32000,
        message: 'Method not found',
        data: { info: 'test' }
      });
    });
  });
});
