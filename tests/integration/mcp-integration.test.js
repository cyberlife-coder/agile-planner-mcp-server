/**
 * Test d'intégration pour le mode MCP (stdio)
 * Conforme à la RULE 1 (TDD) et à la mémoire dd9b921c
 * 
 * @version 1.7.1 - Refactorisé pour réduire la complexité et améliorer la robustesse
 */

const fs = require('fs-extra');
const path = require('path');

// Importer les utilitaires de test MCP
const {
  runMcpCommand,
  setupMcpTestEnvironment,
  terminateProcess
} = require('../utils/mcp-test-utils');

// Skip les tests d'intégration si nécessaire (test rapide, CI, etc.)
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === 'true';

// Variables de test globales
let testEnv;
let activeProcesses = [];

// Configurer l'environnement de test
beforeAll(async () => {
  if (!SKIP_INTEGRATION) {
    testEnv = setupMcpTestEnvironment({
      prefix: 'mcp-integration-test',
      cleanup: false // Conserver les fichiers pour analyse manuelle si besoin
    });
    
    console.log(`Test environment created at: ${testEnv.outputDir}`);
  }
});

// Nettoyer après chaque test pour éviter les processus zombies
afterEach(async () => {
  // Terminer tous les processus actifs
  for (const process of activeProcesses) {
    await terminateProcess(process);
  }
  activeProcesses = [];
});

// Nettoyer après tous les tests
afterAll(async () => {
  if (!SKIP_INTEGRATION && testEnv) {
    // Laisser les fichiers pour analyse manuelle au besoin
    // await testEnv.cleanup();
  }
});

// Helper pour les tests MCP qui gère le suivi des processus
async function runMcpCommandWithTracking(jsonInput, options = {}) {
  const result = await runMcpCommand(jsonInput, {
    debug: true,
    timeout: 45000,
    ...options
  });
  
  // Ajouter le processus à la liste des processus actifs pour le nettoyage
  if (result.process) {
    activeProcesses.push(result.process);
  }
  
  return result;
}

describe('MCP Integration Test', () => {
  // Tests d'intégration MCP (skip en mode rapide)
  (SKIP_INTEGRATION ? describe.skip : describe)('MCP Mode', () => {
    jest.setTimeout(60000); // 60 secondes max par test
    
    it('devrait répondre correctement à une requête initialize', async () => {
      const initializeRequest = {
        jsonrpc: "2.0",
        id: "test-initialize",
        method: "initialize",
        params: {
          protocolVersion: "2025-01"
        }
      };
      
      // Utiliser l'utilitaire avec tracking des processus
      const { jsonResponse } = await runMcpCommandWithTracking(initializeRequest);
      
      // Vérifier la structure de la réponse
      expect(jsonResponse).toHaveProperty('jsonrpc', '2.0');
      expect(jsonResponse).toHaveProperty('id', 'test-initialize');
      expect(jsonResponse).toHaveProperty('result');
      expect(jsonResponse.result).toHaveProperty('protocolVersion');
      expect(jsonResponse.result).toHaveProperty('serverInfo');
      expect(jsonResponse.result.serverInfo).toHaveProperty('name', 'agile-planner-mcp-server');
    });
    
    it('devrait lister les outils disponibles', async () => {
      const toolsListRequest = {
        jsonrpc: "2.0",
        id: "test-tools-list",
        method: "tools/list",
        params: {}
      };
      
      // Utiliser l'utilitaire avec tracking des processus
      const { jsonResponse } = await runMcpCommandWithTracking(toolsListRequest);
      
      // Vérifier la structure de la réponse
      expect(jsonResponse).toHaveProperty('jsonrpc', '2.0');
      expect(jsonResponse).toHaveProperty('id', 'test-tools-list');
      expect(jsonResponse).toHaveProperty('result');
      expect(jsonResponse.result).toHaveProperty('tools');
      expect(Array.isArray(jsonResponse.result.tools)).toBe(true);
      
      // Vérifier la présence des outils essentiels
      const toolNames = jsonResponse.result.tools.map(tool => tool.name);
      expect(toolNames).toContain('generateBacklog');
      expect(toolNames).toContain('generateFeature');
    });
    
    it('devrait générer un backlog avec succès', async () => {
      // Créer un répertoire de test spécifique à ce test
      const testOutputPath = path.join(testEnv.outputDir, 'backlog-test');
      await fs.ensureDir(testOutputPath);
      
      const generateBacklogRequest = {
        jsonrpc: "2.0",
        id: "test-generate-backlog",
        method: "tools/call",
        params: {
          name: "generateBacklog",
          arguments: {
            projectName: "Projet de Test Integration",
            projectDescription: "Un projet de test pour valider l'intégration MCP",
            outputPath: testOutputPath
          }
        }
      };
      
      // Utiliser l'utilitaire avec tracking des processus
      const { jsonResponse } = await runMcpCommandWithTracking(generateBacklogRequest);
      
      // Vérifier la structure de la réponse
      expect(jsonResponse).toHaveProperty('jsonrpc', '2.0');
      expect(jsonResponse).toHaveProperty('id', 'test-generate-backlog');
      expect(jsonResponse).toHaveProperty('result');
      expect(jsonResponse.result).toHaveProperty('success', true);
      expect(jsonResponse.result.message).toContain('Backlog généré avec succès');
      
      // Vérifier que les fichiers ont été créés
      expect(fs.existsSync(path.join(testOutputPath, 'backlog.json'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputPath, 'epics'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputPath, 'orphan-stories'))).toBe(true);
    }, 45000); // Augmenter le timeout pour ce test spécifique
  });
  
  // Tests sans exécution réelle: toujours exécutés
  describe('Module exports', () => {
    it('devrait exporter correctement les fonctions MCP', () => {
      const mcpRouter = require('../../server/lib/mcp-router');
      
      expect(typeof mcpRouter.handleRequest).toBe('function');
      expect(typeof mcpRouter.handleInitialize).toBe('function');
      expect(typeof mcpRouter.handleToolsList).toBe('function');
      expect(typeof mcpRouter.handleToolsCall).toBe('function');
    });
  });
});
