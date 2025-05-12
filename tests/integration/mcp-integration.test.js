/**
 * Test d'intégration pour le mode MCP (stdio)
 * Conforme à la RULE 1 (TDD) et à la mémoire dd9b921c
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

// Configuration pour le test
const TEST_OUTPUT_DIR = path.join(__dirname, '../../.agile-planner-backlog-test-mcp');
const MCP_COMMAND = 'node server/index.js';

// Skip les tests d'intégration si nécessaire (test rapide, CI, etc.)
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === 'true';

// Nettoyer avant et après les tests
beforeAll(async () => {
  if (!SKIP_INTEGRATION) {
    await fs.remove(TEST_OUTPUT_DIR);
    await fs.ensureDir(TEST_OUTPUT_DIR);
  }
});

afterAll(async () => {
  if (!SKIP_INTEGRATION) {
    // Conserver les fichiers pour analyse manuelle si besoin
    // await fs.remove(TEST_OUTPUT_DIR);
  }
});

// Fonction d'aide pour exécuter une commande MCP avec stdin
function runMcpCommand(jsonInput) {
  return new Promise((resolve, reject) => {
    console.log('⏳ Exécution commande MCP avec input:', JSON.stringify(jsonInput).substring(0, 100) + '...');
    
    const child = spawn('node', ['server/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MCP_EXECUTION: 'true', // Crucial pour le mode MCP
        DEBUG: 'true' // Activer le mode debug pour plus d'informations
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      console.log(`ℹ️ MCP process exited with code ${code}`);
      console.log('📃 STDOUT length:', stdout.length);
      if (stderr) console.log('⚠️ STDERR:', stderr);
      
      if (code !== 0) {
        console.error('❌ Erreur MCP avec code de sortie:', code);
        return reject(new Error(`MCP process exited with code ${code}\nSTDERR: ${stderr}`));
      }
      
      try {
        // Afficher un peu de stdout pour débogage
        console.log('💾 STDOUT sample:', stdout.substring(0, 200) + '...');
        const jsonResponse = JSON.parse(stdout.trim());
        console.log('✅ Réponse JSON parsée avec succès');
        resolve({ jsonResponse, stderr });
      } catch (error) {
        console.error('❌ Erreur parsing JSON:', error.message);
        console.log('📦 Début stdout:', stdout.substring(0, 50));
        console.log('📦 Fin stdout:', stdout.substring(stdout.length - 50));
        reject(new Error(`Failed to parse MCP response: ${error.message}\nOutput was: ${stdout.substring(0, 500)}`));
      }
    });
    
    // Envoyer la requête JSON à stdin
    child.stdin.write(JSON.stringify(jsonInput));
    child.stdin.end();
  });
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
      
      try {
        // Récupérer uniquement jsonResponse, stderr est utilisé uniquement pour débogage
        const { jsonResponse } = await runMcpCommand(initializeRequest);
        
        expect(jsonResponse).toHaveProperty('jsonrpc', '2.0');
        expect(jsonResponse).toHaveProperty('id', 'test-initialize');
        expect(jsonResponse).toHaveProperty('result');
        expect(jsonResponse.result).toHaveProperty('protocolVersion');
        expect(jsonResponse.result).toHaveProperty('serverInfo');
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });
    
    it('devrait lister les outils disponibles', async () => {
      const toolsListRequest = {
        jsonrpc: "2.0",
        id: "test-tools-list",
        method: "tools/list",
        params: {}
      };
      
      try {
        // Récupérer uniquement jsonResponse, stderr est utilisé uniquement pour débogage
        const { jsonResponse } = await runMcpCommand(toolsListRequest);
        
        expect(jsonResponse).toHaveProperty('jsonrpc', '2.0');
        expect(jsonResponse).toHaveProperty('id', 'test-tools-list');
        expect(jsonResponse).toHaveProperty('result');
        expect(jsonResponse.result).toHaveProperty('tools');
        expect(Array.isArray(jsonResponse.result.tools)).toBe(true);
        
        // Vérifier la présence de l'outil generateBacklog
        const generateBacklogTool = jsonResponse.result.tools.find(tool => tool.name === 'generateBacklog');
        expect(generateBacklogTool).toBeDefined();
      } catch (error) {
        console.error('Test failed with error:', error);
        throw error;
      }
    });
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
