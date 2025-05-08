/**
 * Tests d'intégration pour le BacklogValidator avec la nouvelle architecture de validation
 */
const validatorsFactory = require('../server/lib/utils/validators/validators-factory');
const fs = require('fs');
const path = require('path');

describe('BacklogValidator - Intégration avec ValidatorsFactory', () => {
  let sampleBacklog;

  beforeEach(() => {
    // Charger un backlog valide pour les tests
    sampleBacklog = {
      projectName: "Système de gestion de bibliothèque",
      description: "Système complet pour gérer une bibliothèque",
      epicss: [
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
    // Valider un backlog valide
    const result = validatorsFactory.validate(sampleBacklog, 'backlog');
    
    // Vérifier que la validation réussit
    expect(result.valid).toBe(true);
    expect(result.errors).toBeUndefined();
  });

  test('Validation d\'un backlog invalide - epics manquant', () => {
    // Créer un backlog invalide en supprimant l'epics
    const invalidBacklog = { ...sampleBacklog };
    delete invalidBacklog.epics;
    
    // Valider le backlog invalide
    const result = validatorsFactory.validate(invalidBacklog, 'backlog');
    
    // Vérifier que la validation échoue
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('Validation d\'un backlog invalide - mvp manquant', () => {
    // Créer un backlog invalide en supprimant le mvp
    const invalidBacklog = { ...sampleBacklog };
    delete invalidBacklog.mvp;
    
    // Valider le backlog invalide
    const result = validatorsFactory.validate(invalidBacklog, 'backlog');
    
    // Vérifier que la validation échoue
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('Validation d\'un backlog invalide - iterations manquantes', () => {
    // Créer un backlog invalide en supprimant les iterations
    const invalidBacklog = { ...sampleBacklog };
    delete invalidBacklog.iterations;
    
    // Valider le backlog invalide
    const result = validatorsFactory.validate(invalidBacklog, 'backlog');
    
    // Vérifier que la validation échoue
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
