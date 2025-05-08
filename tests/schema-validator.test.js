/**
 * Tests pour le validateur de schéma
 * Responsable de la validation des structures de données
 * @jest
 */

const { SchemaValidator } = require('../server/lib/utils/schema-validator');

describe('SchemaValidator', () => {
  let validator;
  
  beforeEach(() => {
    validator = new SchemaValidator();
  });
  
  test('validateBacklog valide correctement un backlog complet', () => {
    const validBacklog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: [
        {
          id: 'epics-1',
          title: 'Epic 1',
          description: 'Epic 1 description',
          features: [
            {
              id: 'feature-1',
              title: 'Feature 1',
              description: 'Feature 1 description',
              stories: [
                {
                  id: 'story-1',
                  title: 'Story 1',
                  description: 'Story 1 description',
                  acceptance_criteria: ['Criterion 1']
                }
              ]
            }
          ]
        }
      ],
      mvp: [
        { id: 'story-1', title: 'Story 1' }
      ],
      iterations: [
        {
          id: 'iteration-1',
          name: 'iteration-1',
          stories: [
            { id: 'story-1', title: 'Story 1' }
          ]
        }
      ]
    };
    
    const result = validator.validateBacklog(validBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
  
  test('validateBacklog détecte projectName manquant', () => {
    const invalidBacklog = {
      // projectName manquant
      description: 'Test Description',
      epics: []
    };
    
    const result = validator.validateBacklog(invalidBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('projectName');
  });
  
  test('validateBacklog détecte epics manquant', () => {
    const invalidBacklog = {
      projectName: 'Test Project',
      description: 'Test Description'
      // epics manquant
    };
    
    const result = validator.validateBacklog(invalidBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('epics');
  });
  
  test('validateBacklog détecte un epics invalide', () => {
    const invalidBacklog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: [
        {
          // id manquant
          title: 'Epic 1',
          description: 'Epic 1 description'
        }
      ]
    };
    
    const result = validator.validateBacklog(invalidBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('epics[0].id');
  });
  
  test('validateBacklog détecte une feature invalide', () => {
    const invalidBacklog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: [
        {
          id: 'epics-1',
          title: 'Epic 1',
          description: 'Epic 1 description',
          features: [
            {
              // id manquant
              title: 'Feature 1',
              description: 'Feature 1 description'
            }
          ]
        }
      ]
    };
    
    const result = validator.validateBacklog(invalidBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('epics[0].features[0].id');
  });
  
  test('validateBacklog détecte une user story invalide', () => {
    const invalidBacklog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: [
        {
          id: 'epics-1',
          title: 'Epic 1',
          description: 'Epic 1 description',
          features: [
            {
              id: 'feature-1',
              title: 'Feature 1',
              description: 'Feature 1 description',
              stories: [
                {
                  // id manquant
                  title: 'Story 1',
                  description: 'Story 1 description'
                }
              ]
            }
          ]
        }
      ]
    };
    
    const result = validator.validateBacklog(invalidBacklog);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('epics[0].features[0].stories[0].id');
  });
  
  test('validateFeature valide correctement une feature complète', () => {
    const validFeature = {
      id: 'feature-1',
      title: 'Feature 1',
      description: 'Feature 1 description',
      acceptance_criteria: ['Criteria 1'],
      stories: [
        {
          id: 'story-1',
          title: 'Story 1',
          description: 'Story 1 description',
          acceptance_criteria: ['Criterion 1']
        }
      ],
      priority: 'high',
      businessValue: 'Important for revenue'
    };
    
    const result = validator.validateFeature(validFeature);
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
  
  test('validateFeature détecte id manquant', () => {
    const invalidFeature = {
      // id manquant
      title: 'Feature 1',
      description: 'Feature 1 description'
    };
    
    const result = validator.validateFeature(invalidFeature);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('id');
  });
  
  test('validateUserStory valide correctement une user story complète', () => {
    const validStory = {
      id: 'story-1',
      title: 'Story 1',
      description: 'Story 1 description',
      acceptance_criteria: ['Criterion 1'],
      priority: 'high',
      businessValue: 'Important for user experience'
    };
    
    const result = validator.validateUserStory(validStory);
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
  
  test('validateUserStory détecte title manquant', () => {
    const invalidStory = {
      id: 'story-1',
      // title manquant
      description: 'Story 1 description'
    };
    
    const result = validator.validateUserStory(invalidStory);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('title');
  });
  
  test('validateIteration valide correctement une itération complète', () => {
    const validIteration = {
      id: 'iteration-1',
      name: 'iteration-1',
      description: 'Iteration 1 description',
      stories: [
        { id: 'story-1', title: 'Story 1' }
      ]
    };
    
    const result = validator.validateIteration(validIteration);
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });
  
  test('validateIteration détecte stories manquant', () => {
    const invalidIteration = {
      id: 'iteration-1',
      name: 'iteration-1',
      description: 'Iteration 1 description'
      // stories manquant
    };
    
    const result = validator.validateIteration(invalidIteration);
    expect(result).toBeDefined();
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors[0].field).toBe('stories');
  });
  
  test('extractBacklogData extrait correctement les données d\'un backlog wrapper', () => {
    const wrapper = {
      success: true,
      result: {
        projectName: 'Test Project',
        description: 'Test Description',
        epics: []
      }
    };
    
    const result = validator.extractBacklogData(wrapper);
    expect(result).toEqual(wrapper.result);
  });
  
  test('extractBacklogData retourne l\'objet original si ce n\'est pas un wrapper', () => {
    const backlog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: []
    };
    
    const result = validator.extractBacklogData(backlog);
    expect(result).toEqual(backlog);
  });
  
  test('extractBacklogData gère les objets vides', () => {
    const result = validator.extractBacklogData(null);
    expect(result).toBeNull();
  });
  
  test('extractBacklogData détecte bien un backlog existant même sans wrapper', () => {
    const backlog = {
      projectName: 'Test Project',
      description: 'Test Description',
      epics: []
    };
    
    const result = validator.extractBacklogData(backlog);
    expect(result).toBe(backlog);
  });
});
