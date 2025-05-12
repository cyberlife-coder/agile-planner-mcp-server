// Test ultra-minimal pour MCP
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

describe('MCP Ultra-Minimal Test', () => {
  let mcpProcess = null;
  
  // Force arrêt après chaque test
  afterEach((done) => {
    if (mcpProcess && !mcpProcess.killed) {
      try {
        mcpProcess.kill('SIGKILL');
      } catch (e) {
        console.error('Error killing process:', e);
      }
    }
    mcpProcess = null;
    // Force garbage collection si disponible
    if (global.gc) global.gc();
    setTimeout(done, 100);
  });

  it('should initialize and respond to a basic tools/list request', (done) => {
    // Configurer timeout plus court pour ce test simple
    jest.setTimeout(15000);
    
    // Spawn avec des variables d'environnement contrôlées
    mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '0', // Désactiver les couleurs ANSI
        AGILE_PLANNER_TEST_MODE: 'true',
        MCP_TEST_ACTIVE: 'true'
      }
    });

    let outputBuffer = '';
    let jsonResponse = null;

    mcpProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      outputBuffer += chunk;
      console.log(`[TEST] Received: ${chunk.substring(0, 50)}...`);
      
      // Check if this chunk contains a complete JSON response
      try {
        // Chercher des structures JSON dans la sortie
        const jsonMatches = chunk.match(/(\{.*\})/);
        if (jsonMatches) {
          const jsonStr = jsonMatches[1];
          jsonResponse = JSON.parse(jsonStr);
          
          // Si on a une réponse tools/list valide, terminer le test
          if (jsonResponse.id === 1 && jsonResponse.result && Array.isArray(jsonResponse.result)) {
            console.log('Valid JSON-RPC response found!');
            expect(jsonResponse.id).toBe(1);
            expect(jsonResponse.error).toBeUndefined();
            expect(Array.isArray(jsonResponse.result)).toBe(true);
            
            // Tuer le processus et terminer le test
            if (mcpProcess && !mcpProcess.killed) {
              mcpProcess.kill('SIGTERM');
            }
            done();
          }
        }
      } catch (e) {
        // Ignorer silencieusement, car la sortie pourrait être incomplète
      }
    });

    mcpProcess.stderr.on('data', (data) => {
      console.error(`[ERROR] ${data.toString()}`);
    });

    mcpProcess.on('error', (err) => {
      console.error('Process error:', err);
      done(err);
    });

    mcpProcess.on('close', (code) => {
      console.log(`Process closed with code ${code}`);
      if (!jsonResponse) {
        // Si on n'a pas encore validé une réponse et que le processus se termine
        done(new Error(`Process terminated without valid response. Exit code: ${code}. Output: ${outputBuffer}`));
      }
    });

    // Requête tools/list simple
    const request = {
      jsonrpc: '2.0',
      method: 'tools/list',
      id: 1
    };

    console.log('Sending request:', JSON.stringify(request));
    mcpProcess.stdin.write(JSON.stringify(request) + '\n');
    mcpProcess.stdin.end();
    
    // Timeout de sécurité
    setTimeout(() => {
      if (!jsonResponse) {
        console.log('Test timeout - terminating');
        if (mcpProcess && !mcpProcess.killed) {
          mcpProcess.kill('SIGKILL');
        }
        done(new Error('Test timed out without valid response'));
      }
    }, 10000);
  });
});
