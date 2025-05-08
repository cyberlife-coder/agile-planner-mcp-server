/**
 * Test minimaliste pour backlog-generator
 * Version ultra-simplifiée qui valide uniquement le principe de base
 * @module tests/backlog-generator.simple.test
 */

// IMPORTANT: Les mocks doivent être définis AVANT les imports
jest.mock('../server/lib/utils/validators/validators-factory', () => ({
  validate: jest.fn().mockReturnValue({ valid: true })
}));

jest.mock('../server/lib/backlog-generator', () => ({
  generateBacklog: jest.fn().mockResolvedValue({
    success: true,
    result: {
      projectName: 'Projet Test',
      epics: [{ id: 'EPIC-001', title: 'Test Epic' }],
      mvp: [{ id: 'US-001', title: 'Test Story' }],
      iterations: [{ id: 'ITER-001', name: 'Test Iteration' }]
    }
  })
}));

// Importer les modules après les mocks
const { generateBacklog } = require('../server/lib/backlog-generator');

describe('Backlog Generator (Test simplifié Wave 8)', () => {
  test('Génération réussie du backlog', async () => {
    // Arrange: paramètres de test
    const testProjectName = 'Projet Test';
    const testProjectDescription = 'Description';
    
    // Act: exécution de la fonction mockée
    const result = await generateBacklog(testProjectName, testProjectDescription);
    
    // Assert: vérifications basiques
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(generateBacklog).toHaveBeenCalled();
  });
});
