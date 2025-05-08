/**
 * Tests TDD pour le module SchemaValidator
 * Approche RED-GREEN-REFACTOR
 */
const { SchemaValidator } = require('../../server/lib/utils/schema-validator');

// Mock pour chalk
jest.mock('chalk', () => ({
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text),
  blue: jest.fn(text => text)
}));

describe('SchemaValidator - Tests TDD', () => {
  let validator;

  beforeEach(() => {
    // Créer une instance fraîche pour chaque test
    validator = new SchemaValidator();
  });

  describe('Validation de types', () => {
    test('checkType devrait correctement valider les types de base', () => {
      // String
      expect(validator.checkType('test', 'string')).toBe(true);
      expect(validator.checkType(123, 'string')).toBe(false);
      
      // Number
      expect(validator.checkType(123, 'number')).toBe(true);
      expect(validator.checkType('123', 'number')).toBe(false);
      
      // Boolean
      expect(validator.checkType(true, 'boolean')).toBe(true);
      expect(validator.checkType('true', 'boolean')).toBe(false);
      
      // Array
      expect(validator.checkType([], 'array')).toBe(true);
      expect(validator.checkType({}, 'array')).toBe(false);
      
      // Object
      expect(validator.checkType({}, 'object')).toBe(true);
      expect(validator.checkType([], 'object')).toBe(false);
      expect(validator.checkType(null, 'object')).toBe(false);
    });
  });

  describe('Schémas', () => {
    test('createUserStorySchema devrait retourner un schéma valide', () => {
      const schema = validator.createUserStorySchema();
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('title');
      expect(schema).toHaveProperty('properties');
      expect(schema.properties).toHaveProperty('id');
      expect(schema.properties).toHaveProperty('title');
      expect(schema.properties).toHaveProperty('description');
    });

    test('createFeatureSchema devrait retourner un schéma valide', () => {
      const schema = validator.createFeatureSchema();
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('title');
      expect(schema.properties).toHaveProperty('stories');
      expect(schema.properties.stories.type).toBe('array');
    });

    test('createEpicSchema devrait retourner un schéma valide', () => {
      const schema = validator.createEpicSchema();
      expect(schema).toHaveProperty('required');
      expect(schema.required).toContain('id');
      expect(schema.required).toContain('title');
      expect(schema.properties).toHaveProperty('features');
      expect(schema.properties.features.type).toBe('array');
    });
  });

  describe('Validation contre schémas', () => {
    test('validateAgainstSchema valide correctement une user story complète', () => {
      const userStory = {
        id: 'US123',
        title: 'User Story de test',
        description: 'Description de test',
        acceptance_criteria: ['Critère 1', 'Critère 2']
      };
      
      const result = validator.validateAgainstSchema(userStory, validator.schemas.userStory);
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('validateAgainstSchema détecte une user story invalide', () => {
      const incompleteStory = {
        // Sans id
        title: 'User Story incomplète'
      };
      
      const result = validator.validateAgainstSchema(incompleteStory, validator.schemas.userStory);
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('id est requis à /');
    });

    test('validateAgainstSchema valide les types de propriétés', () => {
      const storyWithWrongTypes = {
        id: 'US123',
        title: 'User Story avec mauvais types',
        acceptance_criteria: 'Devrait être un tableau' // Devrait être un tableau
      };
      
      const result = validator.validateAgainstSchema(storyWithWrongTypes, validator.schemas.userStory);
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('acceptance_criteria doit être de type array à /acceptance_criteria');
    });
  });

  describe('Validation de backlog', () => {
    test('validateBacklog devrait valider un backlog minimal', () => {
      const minimalBacklog = {
        projectName: 'Projet Test',
        epics: [
          {
            id: 'EPIC1',
            title: 'Epic de test',
            description: 'Description de l\'epic'
          }
        ]
      };
      
      const result = validator.validateBacklog(minimalBacklog);
      expect(result).toBeDefined();
      expect(result.valid).toBe(true);
      expect(result).not.toHaveProperty('errors');
    });

    test('validateBacklog devrait rejeter un backlog sans projectName', () => {
      const invalidBacklog = {
        // Sans projectName
        epics: []
      };
      
      const result = validator.validateBacklog(invalidBacklog);
      expect(result).toBeDefined();
      expect(result.valid).toBe(false);
      expect(result).toHaveProperty('errors');
      expect(result.errors[0].field).toBe('projectName');
    });
  });

  describe('Extraction de données', () => {
    test('extractBacklogData extrait correctement les données d\'un wrapper MCP', () => {
      const wrappedBacklog = {
        success: true,
        result: {
          projectName: 'Projet Test',
          epics: []
        }
      };
      
      const result = validator.extractBacklogData(wrappedBacklog);
      expect(result).toHaveProperty('projectName', 'Projet Test');
    });

    test('extractBacklogData retourne null pour une entrée null', () => {
      expect(validator.extractBacklogData(null)).toBeNull();
    });

    test('extractBacklogData retourne directement un backlog déjà déballé', () => {
      const backlog = {
        projectName: 'Projet Direct',
        epics: []
      };
      
      const result = validator.extractBacklogData(backlog);
      expect(result).toBe(backlog);
    });
  });
});
