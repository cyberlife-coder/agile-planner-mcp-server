/**
 * Test TDD spécifique pour le bug de structure hiérarchique corrigé dans v1.2.0
 * Ce test vérifie la correction du problème de structure de données dans l'outil MCP generateBacklog
 */

const { validateBacklogResult } = require('../server/lib/markdown-generator');

describe('Hierarchical Structure Bug Fix (v1.2.0)', () => {
  
  test("validateBacklogResult extrait correctement les données d'un backlog avec une structure MCP wrapper", () => {
    // 1. Structure de données avec wrapper MCP (comme reçue par handleGenerateBacklog)
    const mcpWrapper = {
      success: true,
      result: {
        projectName: "Test Project",
        description: "Description du projet de test",
        epics: [
          {
            id: "epic-1",
            title: "Epic de test",
            description: "Description de l'epic de test",
            features: [
              {
                id: "feature-1",
                title: "Feature de test",
                description: "Description de la feature de test",
                userStories: [
                  {
                    id: "story-1",
                    title: "User story de test",
                    description: "Description de la user story de test",
                    acceptance_criteria: ["Critère 1"]
                  }
                ]
              }
            ]
          }
        ],
        mvp: [{ id: "story-1", title: "User story de test" }],
        iterations: [
          {
            id: "iteration-1",
            name: "iteration-1",
            stories: [{ id: "story-1", title: "User story de test" }]
          }
        ]
      }
    };
    
    // 2. Vérifier que la fonction valide correctement et extrait les données du backlog
    const result = validateBacklogResult(mcpWrapper);
    
    // 3. Vérifications
    expect(result.valid).toBe(true);
    expect(result.backlogData).toBe(mcpWrapper.result);
    expect(result.backlogData.projectName).toBe("Test Project");
    expect(result.backlogData.epics[0].id).toBe("epic-1");
  });
  
  test("validateBacklogResult fonctionne correctement avec un backlog direct sans wrapper", () => {
    // 1. Structure de données directe (sans wrapper MCP)
    const directBacklog = {
      projectName: "Test Project",
      description: "Description du projet de test",
      epics: [
        {
          id: "epic-1",
          title: "Epic de test",
          description: "Description de l'epic de test",
          features: [
            {
              id: "feature-1",
              title: "Feature de test",
              description: "Description de la feature de test",
              userStories: [
                {
                  id: "story-1",
                  title: "User story de test",
                  description: "Description de la user story de test",
                  acceptance_criteria: ["Critère 1"]
                }
              ]
            }
          ]
        }
      ],
      mvp: [{ id: "story-1", title: "User story de test" }],
      iterations: [
        {
          id: "iteration-1",
          name: "iteration-1",
          stories: [{ id: "story-1", title: "User story de test" }]
        }
      ]
    };
    
    // 2. Vérifier que la fonction retourne les données correctement
    const result = validateBacklogResult(directBacklog);
    
    // 3. Vérifications
    expect(result.valid).toBe(true);
    expect(result.backlogData).toBe(directBacklog);
    expect(result.backlogData.projectName).toBe("Test Project");
    expect(result.backlogData.epics[0].id).toBe("epic-1");
  });
  
  test("validateBacklogResult détecte correctement un backlog invalide", () => {
    // 1. Structure de données invalide (sans epics)
    const invalidBacklog = {
      projectName: "Test Project",
      description: "Description du projet de test"
      // Pas d'epics
    };
    
    // 2. La fonction devrait retourner un objet avec valid: false et un message d'erreur
    const result = validateBacklogResult(invalidBacklog);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain("Epics array");
  });
});
