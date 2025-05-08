/**
 * Tests d'intégration MCP pour Agile Planner
 * Ces tests vérifient que le serveur MCP répond correctement aux requêtes standards,
 * sans faire d'hypothèses sur le format exact du contenu de la réponse.
 */
const path = require('path');
const { execa } = require('execa');

// Chemins pour les tests
const TEST_DIR = path.join(__dirname, '..');
const MCP_SERVER_PATH = path.join(TEST_DIR, '..');

describe('MCP Server Integration', () => {
  // Projets de test
  const simpleProject = { project: 'Simple test project' };
  
  /**
   * Fonction utilitaire pour exécuter un serveur MCP et lui envoyer des commandes
   * @param {Function} requestHandler - Fonction qui sera appelée pour envoyer les requêtes au serveur
   * @returns {Promise<{stdout: string, stderr: string}>} - Sortie stdout et stderr du serveur
   */
  function runMCPServer(requestHandler) {
    return new Promise((resolve, reject) => {
      // Lancer le serveur en mode test
      const proc = execa('node', ['bin/mcp-server.js', '--test'], {
        cwd: MCP_SERVER_PATH,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let errorOccurred = false;

      proc.stdout.on('data', (data) => { stdout += data.toString('utf8'); });
      proc.stderr.on('data', (data) => { stderr += data.toString('utf8'); });
      
      proc.on('error', (err) => {
        errorOccurred = true;
        reject(new Error(`Spawn error: ${err.message}`));
      });

      // Attendre que le serveur soit prêt (un petit délai)
      setTimeout(() => {
        // Exécuter le gestionnaire de requêtes fourni
        try {
          requestHandler(proc);
        } catch (err) {
          errorOccurred = true;
          proc.kill();
          reject(err);
        }
      }, 500);
      
      // Délai maximal d'exécution
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill();
          if (!errorOccurred) {
            resolve({ stdout, stderr });
          }
        }
      }, 5000);
      
      proc.on('close', () => {
        clearTimeout(timeout);
        if (!errorOccurred) {
          resolve({ stdout, stderr });
        }
      });
    });
  }
  
  /**
   * Vérifier si le serveur répond au protocole d'initialisation MCP
   */
  test('Server responds to MCP initialize command', async () => {
    const { stdout } = await runMCPServer(proc => {
      // Envoyer une commande d'initialisation MCP
      proc.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 'init1',
        method: 'initialize'
      }) + '\n');
      
      setTimeout(() => {
        proc.stdin.end();
      }, 1000);
    });
    
    // Vérifier que la sortie contient des informations sur MCP
    expect(stdout).toContain('MCP');
    
    // Vérifier que nous avons une réponse d'initialisation valide
    const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let initResponse = null;
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 'init1') {
          initResponse = parsed;
          break;
        }
      } catch (e) {
        // Ignorer les lignes qui ne sont pas du JSON valide
        console.log(`Ligne non-JSON ignorée: ${line.substring(0, 20)}...`);
      }
    }
    
    // Vérifier que nous avons reçu une réponse
    expect(initResponse).not.toBeNull();
    
    // Vérifier la structure de la réponse d'initialisation
    expect(initResponse).toHaveProperty('jsonrpc', '2.0');
    expect(initResponse).toHaveProperty('id', 'init1');
    expect(initResponse).toHaveProperty('result');
    
    // Vérifier les propriétés requises dans le résultat d'initialisation
    const result = initResponse.result;
    expect(result).toHaveProperty('protocolVersion');
    expect(result).toHaveProperty('capabilities');
    expect(result).toHaveProperty('serverInfo');
    
    // Vérifier le format de la version du protocole (YYYY-MM-DD)
    expect(result.protocolVersion).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
  
  /**
   * Vérifier si le serveur répond à la requête tools/list conformément au protocole MCP
   */
  test('Server responds to tools/list command', async () => {
    const { stdout } = await runMCPServer(proc => {
      // Initialiser d'abord
      proc.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 'init1',
        method: 'initialize'
      }) + '\n');
      
      // Puis demander la liste des outils
      setTimeout(() => {
        proc.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 'list1',
          method: 'tools/list'
        }) + '\n');
        
        proc.stdin.end();
      }, 1000);
    });
    
    // Vérifier que nous avons une réponse tools/list valide
    const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let toolsListResponse = null;
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 'list1') {
          toolsListResponse = parsed;
          break;
        }
      } catch (e) {
        // Ignorer les lignes qui ne sont pas du JSON valide
        console.log(`Ligne non-JSON ignorée dans tools/list: ${line.substring(0, 20)}...`);
      }
    }
    
    // Vérifier que nous avons reçu une réponse
    expect(toolsListResponse).not.toBeNull();
    
    // Vérifier la structure de la réponse
    expect(toolsListResponse).toHaveProperty('jsonrpc', '2.0');
    expect(toolsListResponse).toHaveProperty('id', 'list1');
    expect(toolsListResponse).toHaveProperty('result');
    
    // Vérifier que la liste des outils est présente
    const result = toolsListResponse.result;
    expect(result).toHaveProperty('tools');
    expect(Array.isArray(result.tools)).toBe(true);
    
    // Vérifier qu'il y a au moins un outil (generateBacklog)
    expect(result.tools.length).toBeGreaterThan(0);
    
    // Vérifier que l'outil generateBacklog est présent
    const generateBacklogTool = result.tools.find(tool => tool.name === 'generateBacklog');
    expect(generateBacklogTool).toBeDefined();
    
    // Vérifier la structure de l'outil
    expect(generateBacklogTool).toHaveProperty('name', 'generateBacklog');
    expect(generateBacklogTool).toHaveProperty('description');
    expect(generateBacklogTool).toHaveProperty('inputSchema');
  });
  
  /**
   * Vérifier si le serveur répond à la commande tools/call pour l'outil generateBacklog
   * Note: Ce test ne vérifie pas le contenu exact de la réponse, seulement sa structure
   */
  test('Server responds to tools/call for generateBacklog', async () => {
    const { stdout } = await runMCPServer(proc => {
      // Initialiser d'abord
      proc.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 'init1',
        method: 'initialize'
      }) + '\n');
      
      // Puis appeler l'outil generateBacklog
      setTimeout(() => {
        proc.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 'call1',
          method: 'tools/call',
          params: {
            name: 'generateBacklog',
            arguments: simpleProject
          }
        }) + '\n');
        
        proc.stdin.end();
      }, 1000);
    });
    
    // Vérifier que nous avons une réponse à l'appel d'outil
    const lines = stdout.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let toolCallResponse = null;
    
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.id === 'call1') {
          toolCallResponse = parsed;
          break;
        }
      } catch (e) {
        // Ignorer les lignes qui ne sont pas du JSON valide
        console.log(`Ligne non-JSON ignorée dans tools/call: ${line.substring(0, 20)}...`);
      }
    }
    
    // Vérifier que nous avons reçu une réponse
    expect(toolCallResponse).not.toBeNull();
    
    // Vérifier la structure de la réponse
    expect(toolCallResponse).toHaveProperty('jsonrpc', '2.0');
    expect(toolCallResponse).toHaveProperty('id', 'call1');
    
    // Vérifier que nous avons soit un résultat, soit une erreur (mais pas les deux)
    const hasResult = Object.hasOwn(toolCallResponse, 'result');
    const hasError = Object.hasOwn(toolCallResponse, 'error');
    expect(hasResult || hasError).toBe(true);
    expect(hasResult && hasError).toBe(false);
    
    if (hasResult) {
      // Si nous avons un résultat, vérifier qu'il a une propriété success
      expect(toolCallResponse.result).toHaveProperty('success');
      
      // Si success est true, vérifier que nous avons soit files soit rawBacklog
      if (toolCallResponse.result.success === true) {
        const hasFiles = Object.hasOwn(toolCallResponse.result, 'files');
        const hasRawBacklog = Object.hasOwn(toolCallResponse.result, 'rawBacklog');
        expect(hasFiles || hasRawBacklog).toBe(true);
      } else {
        // Si success est false, vérifier que nous avons une erreur
        expect(toolCallResponse.result).toHaveProperty('error');
      }
    } else {
      // Si nous avons une erreur, vérifier sa structure
      expect(toolCallResponse.error).toHaveProperty('code');
      expect(toolCallResponse.error).toHaveProperty('message');
    }
  });
});
