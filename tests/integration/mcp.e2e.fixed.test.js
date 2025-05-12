/**
 * Test E2E optimisé pour le mode MCP (stdio) Agile Planner
 * 
 * Ce test est une version améliorée du test original qui utilise
 * les utilitaires MCP pour une meilleure gestion des ressources
 * 
 * @version 1.7.1
 */

const fs = require('fs-extra');
const path = require('path');

// Importer les utilitaires de test MCP
const {
  runMcpCommand,
  setupMcpTestEnvironment,
  terminateProcess
} = require('../utils/mcp-test-utils');

// Configuration
const TEST_TIMEOUT = 45000; // Timeout pour la génération LLM
const PROJECT_NAME = 'MCP E2E Test Project';
const PROJECT_DESCRIPTION = 'A test project generated via MCP for e2e testing.';

// Variables de test globales
let testEnv;
let activeProcesses = [];

describe('MCP stdio End-to-End generateBacklog', () => {
  beforeAll(() => {
    jest.setTimeout(TEST_TIMEOUT + 10000);
    
    // Créer l'environnement de test
    testEnv = setupMcpTestEnvironment({
      prefix: 'mcp-e2e-test',
      cleanup: false // Conserver pour l'analyse manuelle
    });
    
    console.log(`Test environment created at: ${testEnv.outputDir}`);
  });
  
  // Nettoyer après chaque test
  afterEach(async () => {
    // Terminer tous les processus actifs
    for (const process of activeProcesses) {
      await terminateProcess(process);
    }
    activeProcesses = [];
  });
  
  // Helper pour exécuter les commandes MCP avec suivi des processus
  async function runTrackedMcpCommand(jsonInput, options = {}) {
    const result = await runMcpCommand(jsonInput, {
      debug: true,
      timeout: TEST_TIMEOUT,
      ...options
    });
    
    if (result.process) {
      activeProcesses.push(result.process);
    }
    
    return result;
  }
  
  it('should generate a backlog successfully via MCP stdio', async () => {
    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'generateBacklog',
        arguments: {
          projectName: PROJECT_NAME,
          projectDescription: PROJECT_DESCRIPTION,
          outputPath: testEnv.outputDir
        }
      },
      id: 1
    };
    
    // Exécuter la commande MCP
    const { jsonResponse } = await runTrackedMcpCommand(mcpRequest);
    
    // Vérifier la réponse
    expect(jsonResponse.id).toBe(1);
    expect(jsonResponse.error).toBeUndefined();
    expect(jsonResponse.result).toBeDefined();
    expect(jsonResponse.result.success).toBe(true);
    expect(jsonResponse.result.message).toContain('Backlog généré avec succès');
    
    // Vérifier les fichiers créés
    expect(fs.existsSync(path.join(testEnv.outputDir, 'backlog.json'))).toBe(true);
    expect(fs.existsSync(path.join(testEnv.outputDir, 'backlog-last-dump.json'))).toBe(true);
    
    // Vérifier la structure RULE 3
    const epicsDir = path.join(testEnv.outputDir, 'epics');
    expect(fs.existsSync(epicsDir)).toBe(true);
    expect(fs.statSync(epicsDir).isDirectory()).toBe(true);
    
    const orphanStoriesDir = path.join(testEnv.outputDir, 'orphan-stories');
    expect(fs.existsSync(orphanStoriesDir)).toBe(true);
    expect(fs.statSync(orphanStoriesDir).isDirectory()).toBe(true);
    
    // Vérifier qu'au moins un epic est généré
    const epicFolders = fs.readdirSync(epicsDir);
    expect(epicFolders.length).toBeGreaterThan(0);
    
    // Vérifier la structure pour le premier epic
    if (epicFolders.length > 0) {
      const firstEpicDir = path.join(epicsDir, epicFolders[0]);
      expect(fs.existsSync(path.join(firstEpicDir, 'epic.md'))).toBe(true);
      expect(fs.existsSync(path.join(firstEpicDir, 'features'))).toBe(true);
    }
  }, TEST_TIMEOUT + 5000);
});
