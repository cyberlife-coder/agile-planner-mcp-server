/**
 * Test TDD reproduisant et vérifiant la correction du bug de structure hiérarchique avec le wrapper MCP
 */

const { validateBacklogResult } = require('../server/lib/markdown-generator');

describe('MCP Wrapper Structure Bug Fix', () => {
  
  // Test focalisé sur la fonction validateBacklogResult qui est au cœur de la correction
  test('validateBacklogResult extrait correctement les données du wrapper MCP', () => {
    // Préparation du jeu de test
    const backlogData = {
      projectName: "Test Project",
      description: "Test Description",
      epics: [
        {
          id: "epic-1",
          title: "Test Epic",
          description: "Test Epic Description",
          features: [
            {
              id: "feature-1",
              title: "Test Feature",
              description: "Test Feature Description"
            }
          ]
        }
      ]
    };
    
    // Structure wrapper MCP (qui causait le bug)
    const wrappedStructure = {
      success: true,
      result: backlogData
    };
    
    // 1. Appel avec la structure wrapper
    const resultWithWrapper = validateBacklogResult(wrappedStructure);
    
    // 2. Vérifier que les données sont correctement extraites
    expect(resultWithWrapper.valid).toBe(true);
    expect(resultWithWrapper.backlogData).toBe(backlogData);
    
    // 3. Appel avec la structure directe
    const resultWithoutWrapper = validateBacklogResult(backlogData);
    
    // 4. Vérifier que les données sont correctement traitées
    expect(resultWithoutWrapper.valid).toBe(true);
    expect(resultWithoutWrapper.backlogData).toBe(backlogData);
  });
  
  test('validateBacklogResult détecte les structures invalides', () => {
    // Structure sans epics
    const invalidBacklog = {
      projectName: "Test Project",
      description: "Test Description"
      // pas d'epics
    };
    
    // Vérifier que la fonction détecte l'erreur
    const result = validateBacklogResult(invalidBacklog);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
