/**
 * Ce fichier de test applique la stratégie d'isolation Wave 8 :
 * - Mocks/stubs créés et restaurés via beforeEach/afterEach
 * - Test isolé pour generateFeature via MCP (stdio)
 * - Validation des structures conformes à RULE 3
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const TEST_TIMEOUT = 30000;

describe('GenerateFeature MCP Mode', () => {
  let mcpProcess = null;
  const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-mcp-feature');
  
  beforeEach(() => {
    // Nettoyer le dossier de test s'il existe
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
    
    // Créer la structure requise par RULE 3
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    fs.mkdirSync(path.join(TEST_OUTPUT_DIR, 'epics'), { recursive: true });
    fs.mkdirSync(path.join(TEST_OUTPUT_DIR, 'orphan-stories'), { recursive: true });
    
    // Créer un epic pour le test de feature
    const epicSlug = 'test-epic-for-feature';
    const epicDir = path.join(TEST_OUTPUT_DIR, 'epics', epicSlug);
    fs.mkdirSync(epicDir, { recursive: true });
    fs.mkdirSync(path.join(epicDir, 'features'), { recursive: true });
    
    // Créer un fichier epic.md minimal
    fs.writeFileSync(
      path.join(epicDir, 'epic.md'),
      '# Test Epic\n\nDescription de l\'epic pour le test de génération de feature.'
    );
    
    // Créer un backlog.json minimal avec un epic
    const backlogJson = {
      projectName: 'Test Project',
      projectDescription: 'Test project for feature generation',
      epics: [
        {
          id: epicSlug,
          name: 'Test Epic',
          description: 'Description de l\'epic pour le test',
          features: []
        }
      ]
    };
    
    fs.writeFileSync(
      path.join(TEST_OUTPUT_DIR, 'backlog.json'),
      JSON.stringify(backlogJson, null, 2)
    );
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

  it('should generate feature via MCP stdio interface', (done) => {
    // Configurer timeout
    jest.setTimeout(TEST_TIMEOUT);
    
    // Variables pour le test
    const epicId = 'test-epic-for-feature';
    const featureName = 'Test Feature';
    const featureDesc = 'Test description for feature generation';
    
    // Spawner le processus avec environnement contrôlé
    mcpProcess = spawn('node', ['server/index.js', '--mode', 'mcp'], {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '0',
        AGILE_PLANNER_TEST_MODE: 'true',
        DEBUG_MCP: 'true', // Active les logs de debug MCP
        NODE_OPTIONS: `--require ${path.resolve(__dirname, '../../helpers/mock-openai.js')}`
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
              // Si on trouve une réponse valide et que la feature a été générée, terminer le test
              if (response.result.success) {
                validateFeatureAndFinish();
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
    
    // Fonction pour valider la feature et terminer
    function validateFeatureAndFinish() {
      try {
        // Vérifier que les fichiers attendus existent
        const epicDir = path.join(TEST_OUTPUT_DIR, 'epics', epicId);
        const featuresDir = path.join(epicDir, 'features');
        
        // Vérifier que le dossier features existe
        expect(fs.existsSync(featuresDir)).toBe(true, 'Le dossier features devrait exister');
        
        // Vérifier qu'une feature a été créée (au moins une)
        const featureFolders = fs.readdirSync(featuresDir);
        expect(featureFolders.length).toBeGreaterThan(0, 'Au moins une feature devrait exister');
        
        if (featureFolders.length > 0) {
          const featureFolder = featureFolders[0];
          const featurePath = path.join(featuresDir, featureFolder);
          const featureMarkdownPath = path.join(featurePath, 'feature.md');
          const userStoriesDir = path.join(featurePath, 'user-stories');
          
          // Vérifier la structure conforme à RULE 3
          expect(fs.existsSync(featureMarkdownPath)).toBe(true, 'Le fichier feature.md devrait exister');
          expect(fs.existsSync(userStoriesDir)).toBe(true, 'Le dossier user-stories devrait exister');
          
          // Vérifier qu'au moins une user story a été créée
          const userStoryFiles = fs.readdirSync(userStoriesDir);
          expect(userStoryFiles.length).toBeGreaterThan(0, 'Au moins une user story devrait exister');
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
        name: 'generateFeature',
        arguments: {
          epicId: epicId,
          featureName: featureName,
          featureDescription: featureDesc,
          backlogPath: TEST_OUTPUT_DIR
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
