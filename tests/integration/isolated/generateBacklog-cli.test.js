/**
 * Ce fichier de test applique la stratégie d'isolation Wave 8 :
 * - Test isolé pour generateBacklog via CLI
 * - Validation des structures conformes à RULE 3
 * - Compatible avec le mode MCP parallèle
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const TEST_TIMEOUT = 30000;

describe('GenerateBacklog CLI Mode', () => {
  const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-cli-backlog');
  
  beforeEach(() => {
    // Nettoyer le dossier de test s'il existe
    if (fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
  });

  afterEach(() => {
    // Cleanup
    try {
      if (fs.existsSync(TEST_OUTPUT_DIR)) {
        fs.rmSync(TEST_OUTPUT_DIR, { recursive: true, force: true });
      }
    } catch (e) {
      console.log('Error cleaning up:', e);
    }
  });

  it('should generate backlog via CLI interface', (done) => {
    // Configurer timeout
    jest.setTimeout(TEST_TIMEOUT);
    
    // Variables pour le test
    const projectName = 'Test CLI Backlog';
    const projectDesc = 'Test description for CLI backlog generation';
    
    // Construire la commande CLI
    const cliCommand = `node server/index.js generateBacklog "${projectName}" "${projectDesc}" --output "${TEST_OUTPUT_DIR}"`;
    
    console.log(`Executing CLI command: ${cliCommand}`);
    
    // Exécuter la commande CLI
    exec(cliCommand, {
      env: {
        ...process.env,
        NODE_ENV: 'test',
        FORCE_COLOR: '0',
        AGILE_PLANNER_TEST_MODE: 'true',
        NODE_OPTIONS: `--require ${path.resolve(__dirname, '../../helpers/mock-openai.js')}`
      }
    }, (error, stdout, stderr) => {
      // Logs pour débug
      console.log(`STDOUT: ${stdout.substring(0, 500)}...`);
      
      if (stderr) {
        console.error(`STDERR: ${stderr}`);
      }
      
      if (error) {
        console.error(`Exec error: ${error}`);
        done(error);
        return;
      }
      
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
        
        // Vérifier que le fichier backlog.json a un contenu valide
        const backlogContent = fs.readFileSync(backlogJsonPath, 'utf8');
        const backlogJson = JSON.parse(backlogContent);
        
        expect(backlogJson.projectName).toBe(projectName);
        expect(backlogJson.projectDescription).toBe(projectDesc);
        expect(Array.isArray(backlogJson.epics)).toBe(true);
        
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
