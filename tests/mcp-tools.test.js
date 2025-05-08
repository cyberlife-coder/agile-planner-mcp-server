/**
 * Tests pour les outils MCP
 * @jest
 */

const path = require('path');
const fs = require('fs-extra');
const { handleToolsCall } = require('../server/lib/mcp-router');

// Mock des modules
jest.mock('../server/lib/backlog-generator', () => ({
  generateBacklog: jest.fn().mockResolvedValue({
    success: true,
    result: {
      projectName: 'Test Project',
      description: 'Test project description',
      epics: [
        {
          id: 'epic-1',
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
                  acceptance_criteria: ['criteria 1']
                }
              ]
            }
          ]
        }
      ],
      mvp: [
        {
          id: 'story-1',
          title: 'Story 1'
        }
      ],
      iterations: [
        {
          name: 'iteration-1',
          stories: [
            {
              id: 'story-1',
              title: 'Story 1'
            }
          ]
        }
      ]
    }
  })
}));

jest.mock('../server/lib/api-client', () => ({
  getClient: jest.fn().mockReturnValue({})
}));

describe('MCP Router Tools', () => {
  const testOutputPath = path.join(__dirname, 'temp', 'mcp-test-output');
  
  beforeEach(() => {
    fs.ensureDirSync(testOutputPath);
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    fs.removeSync(testOutputPath);
  });
  
  test('generateBacklog tool creates proper directory structure', async () => {
    // Préparer la requête MCP
    const req = {
      params: {
        name: 'generateBacklog',
        arguments: {
          projectName: 'Test Project',
          projectDescription: 'Test project description',
          outputPath: testOutputPath
        }
      }
    };
    
    // Appeler l'outil
    const result = await handleToolsCall(req);
    
    // Vérifier la structure des dossiers
    const backlogDir = path.join(testOutputPath, '.agile-planner-backlog');
    expect(fs.existsSync(backlogDir)).toBe(true);
    
    // Vérifier la structure hiérarchique epic > feature > user story
    const epicDir = path.join(backlogDir, 'epics', 'epic-1');
    expect(fs.existsSync(epicDir)).toBe(true);
    expect(fs.existsSync(path.join(epicDir, 'epic.md'))).toBe(true);
    
    const featureDir = path.join(epicDir, 'features', 'feature-1');
    expect(fs.existsSync(featureDir)).toBe(true);
    expect(fs.existsSync(path.join(featureDir, 'feature.md'))).toBe(true);
    
    const storyDir = path.join(featureDir, 'user-stories');
    expect(fs.existsSync(storyDir)).toBe(true);
    expect(fs.existsSync(path.join(storyDir, 'story-1.md'))).toBe(true);
    
    // Vérifier la structure de planification
    const mvpDir = path.join(backlogDir, 'planning', 'mvp');
    expect(fs.existsSync(mvpDir)).toBe(true);
    expect(fs.existsSync(path.join(mvpDir, 'mvp.md'))).toBe(true);
    
    const iterationsDir = path.join(backlogDir, 'planning', 'iterations', 'iteration-1');
    expect(fs.existsSync(iterationsDir)).toBe(true);
    expect(fs.existsSync(path.join(iterationsDir, 'iteration.md'))).toBe(true);
    
    // Vérifier les fichiers JSON
    expect(fs.existsSync(path.join(backlogDir, 'backlog.json'))).toBe(true);
    
    // Vérifier que la réponse MCP est correcte
    expect(result).toHaveProperty('content');
    expect(result.content[0].text).toContain('Test Project');
  });
  
  test('createBacklogStructure crée la structure correcte pour un backlog', () => {
    // Créer le chemin de test
    const backlogDir = path.join(testOutputPath, '.agile-planner-backlog');
    
    // Assurer que le répertoire existe
    if (!fs.existsSync(testOutputPath)) {
      fs.mkdirSync(testOutputPath, { recursive: true });
    }
    
    // Supprimer le répertoire s'il existe déjà
    if (fs.existsSync(backlogDir)) {
      fs.rmSync(backlogDir, { recursive: true, force: true });
    }
    
    // Créer la structure
    const structure = mcpTools.createBacklogStructure(testOutputPath);
    
    // Vérifications
    expect(structure).toBeDefined();
    expect(fs.existsSync(backlogDir)).toBe(true);
    
    // Vérifier les répertoires de base
    expect(fs.existsSync(path.join(backlogDir, 'epics'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning', 'mvp'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning', 'iterations'))).toBe(true);
  });
});
