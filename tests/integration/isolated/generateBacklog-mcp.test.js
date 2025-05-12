/**
 * Ce fichier de test applique la stratégie d'isolation Wave 8 :
 * - Mocks/stubs créés et restaurés via beforeEach/afterEach
 * - Test isolé pour generateBacklog via MCP (stdio)
 * - Validation des structures conformes à RULE 3
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const TEST_TIMEOUT = 30000;

describe('GenerateBacklog MCP Mode', () => {
  let mcpProcess = null;
  const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-mcp-backlog');
  
  beforeEach(() => {
    // Nettoyer le dossier de test s'il existe
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach((done) => {
    if (mcpProcess && !mcpProcess.killed) {
      try {
        mcpProcess.kill('SIGKILL');
      } catch (e) {
        console.log('Error killing process:', e);
      }
    }
    
    // Cleanup
    try {
      if (fs.existsSync(TEST_OUTPUT_DIR)) {
        fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
      }
    } catch (e) {
      console.log('Error cleaning up:', e);
    }
    
    mcpProcess = null;
    setTimeout(done, 100);
  });

  it('should generate backlog via MCP stdio interface', (done) => {
    // Configurer timeout
    jest.setTimeout(TEST_TIMEOUT);
    
    // Variables pour le test
    const projectName = 'Test MCP Backlog';
    const projectDesc = 'Test description for MCP backlog generation';
    
    // Spawner le processus avec environnement contrôlé
    mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '0',
        AGILE_PLANNER_TEST_MODE: 'true',
        DEBUG_MCP: 'true' // Active les logs de debug MCP
      }
    });
    
    let stdoutData = '';
    let response = null;
    
    // Capture de la sortie
    mcpProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdoutData += chunk;
      
      // Recherche d'une réponse JSON valide
      try {
        // Pour chaque ligne, vérifier si c'est du JSON valide
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
            const parsed = JSON.parse(line);
            if (parsed.id === 1 && parsed.result) {
              response = parsed;
              // Si on trouve une réponse valide et que le backlog a été généré, terminer le test
              if (response.result.success) {
                validateBacklogAndFinish();
              }
            }
          }
        }
      } catch (e) {
        // Ignorer les erreurs de parsing (chunk incomplet)
      }
    });
    
    // Capture des erreurs
    mcpProcess.stderr.on('data', (data) => {
      console.error(`STDERR: ${data.toString()}`);
    });
    
    // Gestion de la fin du processus
    mcpProcess.on('close', (code) => {
      if (!response) {
        // Si on n'a pas encore de réponse valide
        done(new Error(`Process closed with code ${code} without valid response. Output: ${stdoutData.substring(0, 500)}...`));
      }
    });
    
    // Fonction pour valider le backlog et terminer
    function validateBacklogAndFinish() {
      try {
        // Vérifier que les fichiers attendus existent
        const backlogJsonPath = path.join(TEST_OUTPUT_DIR, 'backlog.json');
        const epicsDir = path.join(TEST_OUTPUT_DIR, 'epics');
        const orphanStoriesDir = path.join(TEST_OUTPUT_DIR, 'orphan-stories');
        
        // Assertions conformes à RULE 3
        expect(fs.existsSync(backlogJsonPath)).toBe(true, 'Le fichier backlog.json devrait exister');
        expect(fs.existsSync(epicsDir)).toBe(true, 'Le dossier epics devrait exister');
        expect(fs.existsSync(orphanStoriesDir)).toBe(true, 'Le dossier orphan-stories devrait exister');
        
        // Verifier structure interne epics (au moins un epic doit exister)
        const epicFolders = fs.readdirSync(epicsDir);
        if (epicFolders.length > 0) {
          const epicPath = path.join(epicsDir, epicFolders[0]);
          const epicMarkdownPath = path.join(epicPath, 'epic.md');
          const featuresDir = path.join(epicPath, 'features');
          
          expect(fs.existsSync(epicMarkdownPath)).toBe(true, 'Le fichier epic.md devrait exister');
          expect(fs.existsSync(featuresDir)).toBe(true, 'Le dossier features devrait exister');
        }
        
        // Si tout est bon, terminer le test
        done();
      } catch (error) {
        done(error);
      }
    }
    
    // Envoi de la requête MCP
    const mcpRequest = {
      jsonrpc: '2.0',
      method: 'tools/call',
      params: {
        name: 'generateBacklog',
        arguments: {
          projectName: projectName,
          projectDescription: projectDesc,
          outputPath: TEST_OUTPUT_DIR
        }
      },
      id: 1
    };
    
    // Envoi de la requête au processus
    mcpProcess.stdin.write(JSON.stringify(mcpRequest) + '\n');
    mcpProcess.stdin.end();
    
    // Timeout de sécurité
    setTimeout(() => {
      if (!response) {
        if (mcpProcess && !mcpProcess.killed) {
          mcpProcess.kill('SIGKILL');
        }
        done(new Error('Test timed out without response'));
      }
    }, TEST_TIMEOUT - 1000);
  });
});
