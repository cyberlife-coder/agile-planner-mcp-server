/**
 * Tests TDD pour le module FeatureValidator
 * Approche RED-GREEN-REFACTOR
 */
const { FeatureValidator } = require('../../server/lib/utils/validators/feature-validator');

describe('FeatureValidator - Tests TDD', () => {
  let validator;

  beforeEach(() => {
    validator = new FeatureValidator();
  });

  describe('createFeatureSchema', () => {
    test('crée un schéma valide pour les features', () => {
      // Act
      const schema = validator.createFeatureSchema();
      
      // Assert
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('title');
      
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('id', { type: 'string' });
      expect(schema.properties).toHaveProperty('title', { type: 'string' });
      expect(schema.properties).toHaveProperty('description', { type: 'string' });
      expect(schema.properties).toHaveProperty('stories');
      expect(schema.properties.stories.type).toBe('array');
    });
  });

  describe('validate', () => {
    test('valide une feature complète avec des stories valides', () => {
      // Arrange
      const feature = {
        id: 'F-123',
        title: 'Test Feature',
        description: 'Description de test',
        stories: [
          {
            id: 'US-1',
            title: 'User Story 1'
          },
          {
            id: 'US-2',
            title: 'User Story 2',
            description: 'Description US 2'
          }
        ]
      };
      
      // Act
      const result = validator.validate(feature);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('détecte une feature sans id', () => {
      // Arrange
      const invalidFeature = {
        // id manquant
        title: 'Test Feature',
        description: 'Description de test'
      };
      
      // Act
      const result = validator.validate(invalidFeature);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id est requis à /');
    });

    test('détecte une feature avec une user story invalide', () => {
      // Arrange
      const featureWithInvalidStory = {
        id: 'F-123',
        title: 'Feature avec story invalide',
        stories: [
          {
            id: 'US-1',
            title: 'Story valide'
          },
          {
            // id manquant
            title: 'Story invalide'
          }
        ]
      };
      
      // Act
      const result = validator.validate(featureWithInvalidStory);
      
      // Assert
      // Afficher les erreurs pour le débogage
      console.log('Erreurs de validation:', result.errors);

      // Vérifications
      expect(result.valid).toBe(false);
      
      // Vérifier que les erreurs existent
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBeGreaterThan(0);
      
      // Vérifier que l'erreur pour l'ID manquant est bien présente
      const hasIdError = result.errors.some(err => err.includes('id') && err.includes('stories[1]'));
      expect(hasIdError).toBe(true);
    });

    test('valide une feature sans stories', () => {
      // Arrange
      const featureWithoutStories = {
        id: 'F-123',
        title: 'Feature sans stories',
        description: 'Description de test'
      };
      
      // Act
      const result = validator.validate(featureWithoutStories);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('valide une feature avec un tableau de stories vide', () => {
      // Arrange
      const featureWithEmptyStories = {
        id: 'F-123',
        title: 'Feature avec tableau de stories vide',
        stories: []
      };
      
      // Act
      const result = validator.validate(featureWithEmptyStories);
      
      // Assert
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('détecte des types de propriétés invalides', () => {
      // Arrange
      const featureWithInvalidTypes = {
        id: 'F-123',
        title: 'Feature avec types invalides',
        description: 123, // devrait être une chaîne
        stories: {} // devrait être un tableau
      };
      
      // Act
      const result = validator.validate(featureWithInvalidTypes);
      
      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('description doit être de type string à /description');
      expect(result.errors).toContain('stories doit être de type array à /stories');
    });
  });
});
