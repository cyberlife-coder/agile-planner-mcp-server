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

    test('extrait les données d\'un backlog encapsulé', () => {
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

    test('détecte un backlog avec un epic invalide', () => {
      // Arrange
      const backlogWithInvalidEpic = {
        projectName: 'Projet Test',
        epics: [
          { id: 'E-1', title: 'Epic 1', features: [] },
          { 
            // id manquant
            title: 'Epic invalide',
            features: []
          }
        ]
      };
      
      // Act
      const result = validator.validate(backlogWithInvalidEpic);
      
      // Debug
      console.log('Epic Test Result:', JSON.stringify(result, null, 2));
      if (result.errors) {
        console.log('Epic Test Errors:', result.errors);
      }
      
      // Assert
      expect(result.valid).toBe(false);
      expect(Array.isArray(result.errors)).toBe(true);
      
      const hasIdError = result.errors.some(err => 
        err.includes('id') && err.includes('epics[1]')
      );
      console.log('Has ID Error:', hasIdError);
      console.log('Error pattern matching:', result.errors.map(err => ({ 
        err, 
        hasId: err.includes('id'), 
        hasEpic: err.includes('epics[1]')
      })));
      
      expect(hasIdError).toBe(true);
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
      
      // Debug
      console.log('MVP Test Result:', result);
      if (result.errors) {
        console.log('MVP Test Errors:', result.errors);
      }
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Une user story du MVP doit avoir un ID et un titre');
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
      expect(result.errors).toContain('Une user story de l\'itération Iteration 1 doit avoir un ID et un titre');
    });
  });

  describe('validateBacklog', () => {
    test('affiche un message de succès pour un backlog valide', () => {
      // Arrange
      const backlog = {
        projectName: 'Projet Test',
        epics: [{ id: 'E-1', title: 'Epic 1', features: [] }]
      };
      
      // Espionner console.log
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Act
      const result = validator.validateBacklog(backlog);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backlog valide'));
    });

    test('affiche des messages d\'erreur pour un backlog invalide', () => {
      // Arrange
      const invalidBacklog = {
        // projectName manquant
        epics: []
      };
      
      // Espionner console.log
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Act
      const result = validator.validateBacklog(invalidBacklog);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Backlog invalide'));
    });

    test('gère les erreurs inattendues', () => {
      // Arrange
      jest.spyOn(validator, 'validate').mockImplementation(() => {
        throw new Error('Erreur simulée');
      });
      
      // Espionner console.error
      const consoleErrorSpy = jest.spyOn(console, 'error');
      
      // Act
      const result = validator.validateBacklog({});
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Erreur simulée');
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
