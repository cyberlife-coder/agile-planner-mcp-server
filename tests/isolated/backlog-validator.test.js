/**
 * Tests TDD pour le module BacklogValidator
 * Approche RED-GREEN-REFACTOR
 */
const { BacklogValidator } = require('../../server/lib/utils/validators/backlog-validator');

// Mock pour chalk
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text)
}));

describe('BacklogValidator - Tests TDD', () => {
  let validator;

  beforeEach(() => {
    validator = new BacklogValidator();
    // Réinitialiser tous les mocks
    jest.clearAllMocks();
  });

  describe('createBacklogSchema', () => {
    test('crée un schéma valide pour les backlogs', () => {
      // Act
      const schema = validator.createBacklogSchema();
      
      // Assert
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('projectName');
      expect(schema.required).toContain('epics');
      
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('projectName', { type: 'string' });
      expect(schema.properties).toHaveProperty('description', { type: 'string' });
      expect(schema.properties).toHaveProperty('epics');
      expect(schema.properties).toHaveProperty('mvp');
      expect(schema.properties).toHaveProperty('iterations');
    });
  });

  describe('validate', () => {
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
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('valide un backlog complet avec structures imbriquées', () => {
      // Arrange
      const backlog = {
        projectName: 'Projet Test',
        description: 'Description du projet',
        epics: [
          {
            id: 'E-1',
            title: 'Epic 1',
            features: [
              {
                id: 'F-1',
                title: 'Feature 1',
                stories: [
                  { id: 'US-1', title: 'Story 1' }
                ]
              }
            ]
          }
        ],
        mvp: [
          { id: 'US-1', title: 'Story 1' }
        ],
        iterations: [
          {
            name: 'Iteration 1',
            stories: [
              { id: 'US-1', title: 'Story 1' }
            ]
          }
        ]
      };
      
      // Act
      const result = validator.validate(backlog);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('valide un backlog à l\'intérieur d\'un wrapper de résultat', () => {
      // Arrange
      const wrappedBacklog = {
        success: true,
        result: {
          projectName: 'Projet Test',
          epics: [{ id: 'E-1', title: 'Epic 1', features: [] }]
        }
      };
      
      // Act
      const result = validator.validate(wrappedBacklog);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('détecte un backlog sans projectName', () => {
      // Arrange
      const invalidBacklog = {
        // projectName manquant
        epics: [
          { id: 'E-1', title: 'Epic 1', features: [] }
        ]
      };
      
      // Act
      const result = validator.validate(invalidBacklog);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('projectName est requis à /');
    });

    test('détecte un backlog avec un epics invalide', () => {
      // Arrange
      const backlogWithInvalidEpic = {
        projectName: 'Projet Test',
        epics: [
          { id: 'E-1', title: 'Epic 1', features: [] },
          { 
            // id manquant
            title: 'Épic invalide',
            features: []
          }
        ]
      };
      
      // Act
      const result = validator.validate(backlogWithInvalidEpic);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      
      // Vérifier que l'erreur contient une information sur l'epics invalide
      // Cette assertion est plus flexible et s'adapte aux différents formats de messages d'erreur
      const hasEpicError = result.errors.some(err => 
        (err.includes('epics') || err.includes('Epic')) && 
        (err.includes('id') || err.includes('ID'))
      );
      
      expect(hasEpicError).toBe(true);
    });

    test('détecte un backlog avec un MVP invalide', () => {
      // Arrange
      const backlogWithInvalidMvp = {
        projectName: 'Projet Test',
        epics: [
          { id: 'E-1', title: 'Epic 1', features: [] }
        ],
        mvp: [
          { id: 'US-1', title: 'Story valide' },
          { 
            // id manquant
            title: 'Story invalide'
          }
        ]
      };
      
      // Act
      const result = validator.validate(backlogWithInvalidMvp);
      
      // Assert
      expect(result.valid).toBe(false);
      // Vérifier que l'erreur contient l'information sur l'ID manquant
      expect(result.errors.some(err => err.includes('user story') && err.includes('ID'))).toBe(true);
    });

    test('détecte un backlog avec une itération invalide', () => {
      // Arrange
      const backlogWithInvalidIteration = {
        projectName: 'Projet Test',
        epics: [
          { id: 'E-1', title: 'Epic 1', features: [] }
        ],
        iterations: [
          {
            name: 'Iteration 1',
            stories: [
              { id: 'US-1', title: 'Story valide' },
              { 
                // id manquant
                title: 'Story invalide'
              }
            ]
          }
        ]
      };
      
      // Act
      const result = validator.validate(backlogWithInvalidIteration);
      
      // Assert
      expect(result.valid).toBe(false);
      // Vérifier que l'erreur contient l'information sur l'itération et l'ID manquant
      expect(result.errors.some(err => 
        (err.includes('itération') || err.includes('iteration')) && 
        (err.includes('ID') || err.includes('id'))
      )).toBe(true);
    });
  });

  // Tests pour la méthode validateBacklog
  describe('validateBacklog', () => {
    // Avant chaque test, nous réinitialisons les espions et les mocks
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    // Test pour un backlog valide
    test('retourne valid: true pour un backlog valide', () => {
      // Arrange - Préparer un backlog valide
      const validBacklog = {
        projectName: 'Projet Test',
        epics: [{ id: 'E-1', title: 'Epic 1', features: [] }]
      };
      
      // Remplacer la méthode validate pour qu'elle retourne toujours valid: true
      jest.spyOn(validator, 'validate').mockReturnValue({ valid: true });
      
      // Espionner console.log pour vérifier les messages
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Act - Exécuter la méthode à tester
      const result = validator.validateBacklog(validBacklog);
      
      // Assert - Vérifier le résultat
      expect(result).toEqual({ valid: true });
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    // Test pour un backlog invalide
    test('retourne valid: false et errors pour un backlog invalide', () => {
      // Arrange - Préparer un backlog invalide
      const invalidBacklog = {
        // projectName manquant
        epics: []
      };
      
      // Remplacer la méthode validate pour qu'elle retourne toujours valid: false
      jest.spyOn(validator, 'validate').mockReturnValue({
        valid: false,
        errors: ['projectName est requis']
      });
      
      // Espionner console.log pour vérifier les messages
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Act - Exécuter la méthode à tester
      const result = validator.validateBacklog(invalidBacklog);
      
      // Assert - Vérifier le résultat
      expect(result).toEqual({
        valid: false,
        errors: ['projectName est requis']
      });
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    // Test pour une erreur inattendue
    test('gère les erreurs inattendues', () => {
      // Arrange - Simuler une erreur dans la méthode validate
      jest.spyOn(validator, 'validate').mockImplementation(() => {
        throw new Error('Erreur simulée');
      });
      
      // Espionner console.error pour vérifier les messages d'erreur
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Act - Exécuter la méthode à tester
      const result = validator.validateBacklog({});
      
      // Assert - Vérifier le résultat
      expect(result).toHaveProperty('valid', false);
      expect(result).toHaveProperty('error');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('Validation d\'un backlog valide avec format epics', () => {
      // Arrange - Préparer un backlog valide avec le format moderne 'epics'
      const validBacklog = {
        projectName: 'Projet Test',
        epics: [
          {
            id: 'EPIC1',
            title: 'Epic de test',
            description: 'Description de l\'epic'
          }
        ]
      };
      
      // Remplacer la méthode validate pour qu'elle retourne toujours valid: true
      jest.spyOn(validator, 'validate').mockReturnValue({ valid: true });
      
      // Espionner console.log pour vérifier les messages
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Act - Exécuter la méthode à tester
      const result = validator.validateBacklog(validBacklog);
      
      // Assert - Vérifier le résultat
      expect(result).toEqual({ valid: true });
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
