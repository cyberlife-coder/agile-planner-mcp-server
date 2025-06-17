/**
 * Test ultra-minimal pour valider les principes fondamentaux d'invocation du serveur MCP
 * Conformément à la RULE 1, ce test applique les principes TDD pour isoler le problème
 */
const { spawn, execFile } = require('child_process');
const TEST_TIMEOUT = 5000; // Timeout court car test minimal

describe('Ultra Minimal Server Test', () => {
  it('should execute a basic command and exit cleanly - CLI mode', (done) => {
    jest.setTimeout(TEST_TIMEOUT);
    
    const versionArgs = ['server/index.js', '--version'];
    execFile('node', versionArgs, { env: { ...process.env, FORCE_COLOR: '0' } }, (error, stdout, stderr) => {
      expect(error).toBeNull();
      expect(stdout).toBeTruthy(); // Devrait contenir la version
      done();
    });
  });
  
  it('should start and respond to initialization in MCP mode', (done) => {
    jest.setTimeout(TEST_TIMEOUT);
    
    let mcpProcess = null;
    let responseReceived = false;
    
    try {
      // Lancer le processus en mode MCP
      mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NODE_ENV: 'test'
        }
      });
      
      // Préparer un timeout de sécurité
      const safetyTimeout = setTimeout(() => {
        if (mcpProcess && !mcpProcess.killed) {
          try {
            mcpProcess.kill('SIGKILL');
          } catch (e) {
            console.error('Error killing process:', e);
          }
        }
        if (!responseReceived) {
          done(new Error('No response received within timeout'));
        }
      }, TEST_TIMEOUT - 500);
      
      // Capture standard output
      mcpProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        console.log(`Received: ${chunk}`);
        
        // Rechercher une réponse valide
        if (chunk.includes('"jsonrpc"')) {
          responseReceived = true;
          clearTimeout(safetyTimeout);
          
          // Terminer proprement
          if (mcpProcess && !mcpProcess.killed) {
            mcpProcess.kill('SIGTERM');
          }
          done();
        }
      });
      
      // Capture des erreurs
      mcpProcess.stderr.on('data', (data) => {
        console.error(`STDERR: ${data.toString()}`);
      });
      
      // Erreur de processus
      mcpProcess.on('error', (err) => {
        console.error('Process error:', err);
        clearTimeout(safetyTimeout);
        done(err);
      });
      
      // Fin du processus
      mcpProcess.on('close', (code) => {
        console.log(`Process closed with code ${code}`);
        clearTimeout(safetyTimeout);
        if (!responseReceived) {
          done(new Error(`Process terminated prematurely with code ${code}`));
        }
      });
      
      // Envoi de la requête d'initialisation JSON-RPC
      const initRequest = {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          rootUri: 'file:///agile-planner-test',
          capabilities: {}
        },
        id: 1
      };
      
      mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
      
    } catch (e) {
      console.error('Test error:', e);
      if (mcpProcess && !mcpProcess.killed) {
        try {
          mcpProcess.kill('SIGKILL');
        } catch (killError) {
          console.error('Error during kill:', killError);
        }
      }
      done(e);
    }
  });
});
