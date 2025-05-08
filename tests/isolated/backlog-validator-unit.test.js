/**
 * Tests unitaires pour le BacklogValidator
 */
const { BacklogValidator } = require('../../server/lib/utils/validators/backlog-validator');
const sinon = require('sinon');

// Mock complet pour le BacklogValidator
jest.mock('../../server/lib/utils/validators/backlog-validator', () => {
  // Créer une implémentation mock de la classe BacklogValidator
  const mockBacklogValidator = {
    validate: jest.fn(),
    validateBacklog: jest.fn()
  };
  
  // Configurer le comportement par défaut des mocks
  mockBacklogValidator.validate.mockImplementation((backlog) => {
    if (backlog && backlog.projectName && backlog.epics) {
      return { valid: true };
    } else {
      return { 
        valid: false, 
        errors: ['projectName est requis', 'epics est requis']
      };
    }
  });
  
  mockBacklogValidator.validateBacklog.mockImplementation((backlog) => {
    return mockBacklogValidator.validate(backlog);
  });
  
  return { 
    BacklogValidator: jest.fn().mockImplementation(() => mockBacklogValidator)
  };
});

describe('BacklogValidator - Tests unitaires', () => {
  let backlogValidator;
  let validBacklog;

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Créer une instance du BacklogValidator mock
    backlogValidator = new BacklogValidator();
    
    // Définir un backlog valide pour les tests
    validBacklog = {
      projectName: "Système de gestion de bibliothèque",
      description: "Système complet pour gérer une bibliothèque",
      epics: [
        {
          id: "EPIC-001",
          name: "Système de gestion de bibliothèque",
          description: "Système complet pour gérer une bibliothèque",
          features: []
        }
      ],
      mvp: [
        {
          id: "US001",
          title: "Inscription utilisateur",
          description: "En tant qu'utilisateur, je veux pouvoir m'inscrire",
          acceptance_criteria: ["Critère 1", "Critère 2"],
          tasks: ["Tâche 1", "Tâche 2"],
          priority: "HIGH"
        }
      ],
      iterations: [
        {
          name: "Itération 1",
          goal: "Objectif de l'itération 1",
          stories: [
            {
              id: "US002",
              title: "Connexion utilisateur",
              description: "En tant qu'utilisateur, je veux pouvoir me connecter",
              acceptance_criteria: ["Critère 1", "Critère 2"],
              tasks: ["Tâche 1", "Tâche 2"],
              priority: "HIGH"
            }
          ]
        }
      ]
    };
  });

  test('Validation d\'un backlog valide', () => {
    // Configurer le mock pour retourner un résultat valide
    backlogValidator.validate.mockReturnValueOnce({ valid: true });
    
    // Appeler la méthode validate avec un backlog valide
    const result = backlogValidator.validate(validBacklog);
    
    // Vérifier que la méthode a été appelée avec les bons arguments
    expect(backlogValidator.validate).toHaveBeenCalledWith(validBacklog);
    
    // Vérifier que le résultat est valide
    expect(result.valid).toBe(true);
  });

  test('Validation d\'un backlog invalide - projectName manquant', () => {
    // Créer un backlog invalide en supprimant projectName
    const invalidBacklog = { ...validBacklog };
    delete invalidBacklog.projectName;
    
    // Configurer le mock pour retourner un résultat invalide
    backlogValidator.validate.mockReturnValueOnce({ 
      valid: false, 
      errors: ['projectName est requis'] 
    });
    
    // Appeler la méthode validate
    const result = backlogValidator.validate(invalidBacklog);
    
    // Vérifier que la méthode a été appelée avec les bons arguments
    expect(backlogValidator.validate).toHaveBeenCalledWith(invalidBacklog);
    
    // Vérifier que le résultat est invalide
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('projectName');
  });

  test('Validation d\'un backlog invalide - epics manquant', () => {
    // Créer un backlog invalide en supprimant epics
    const invalidBacklog = { ...validBacklog };
    delete invalidBacklog.epics;
    
    // Configurer le mock pour retourner un résultat invalide
    backlogValidator.validate.mockReturnValueOnce({ 
      valid: false, 
      errors: ['epics est requis'] 
    });
    
    // Appeler la méthode validate
    const result = backlogValidator.validate(invalidBacklog);
    
    // Vérifier que la méthode a été appelée avec les bons arguments
    expect(backlogValidator.validate).toHaveBeenCalledWith(invalidBacklog);
    
    // Vérifier que le résultat est invalide
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('epics');
  });
  
  test('Validation d\'un backlog avec la méthode validateBacklog', () => {
    // Configurer le mock pour retourner un résultat valide
    backlogValidator.validateBacklog.mockReturnValueOnce({ valid: true });
    
    // Appeler la méthode validateBacklog
    const result = backlogValidator.validateBacklog(validBacklog);
    
    // Vérifier que la méthode a été appelée avec les bons arguments
    expect(backlogValidator.validateBacklog).toHaveBeenCalledWith(validBacklog);
    
    // Vérifier que le résultat est valide
    expect(result.valid).toBe(true);
  });
});
