/**
 * Tests TDD simplifiés pour le module BacklogValidator
 * Approche RED-GREEN-REFACTOR
 */
const { BacklogValidator } = require('../../server/lib/utils/validators/backlog-validator');

describe('BacklogValidator - Tests TDD Minimaux', () => {
  let validator;

  beforeEach(() => {
    validator = new BacklogValidator();
  });

  test('valide un backlog minimal complet', () => {
    // Arrange
    const backlog = {
      projectName: 'Projet Test',
      description: 'Description du projet',
      epics: [
        {
          id: 'E-1',
          title: 'Epic 1',
          features: []
        }
      ]
    };
    
    // Act
    const result = validator.validate(backlog);
    
    // Assert
    console.log('Résultat de validation:', result);
    expect(result.valid).toBe(true);
  });
});
