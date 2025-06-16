/**
 * Ce fichier de test applique la stratégie d'isolation Wave 8 :
 * - Test isolé pour generateFeature via CLI
 * - Validation des structures conformes à RULE 3
 * - Compatible avec le mode MCP parallèle
 */
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const TEST_TIMEOUT = 30000;

describe('GenerateFeature CLI Mode', () => {
  const TEST_OUTPUT_DIR = path.join(process.cwd(), '.agile-planner-test-cli-feature');
  
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

  it('should generate feature via CLI interface', (done) => {
    // Configurer timeout
    jest.setTimeout(TEST_TIMEOUT);
    
    // Variables pour le test
    const epicId = 'test-epic-for-feature';
    const featureName = 'Test Feature';
    const featureDesc = 'Test description for feature generation';
    
    // Construire la commande CLI
    const cliCommand = `node server/index.js generateFeature "${epicId}" "${featureName}" "${featureDesc}" --backlog-path "${TEST_OUTPUT_DIR}"`;
    
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
          
          // Vérifier le contenu du backlog.json pour s'assurer que la feature a été ajoutée
          const backlogPath = path.join(TEST_OUTPUT_DIR, 'backlog.json');
          const backlogContent = fs.readFileSync(backlogPath, 'utf8');
          const backlogJson = JSON.parse(backlogContent);
          
          const epic = backlogJson.epics.find(e => e.id === epicId);
          expect(epic).toBeDefined('L\'epic devrait exister dans le backlog');
          expect(Array.isArray(epic.features)).toBe(true, 'L\'epic devrait avoir un tableau de features');
          expect(epic.features.length).toBeGreaterThan(0, 'L\'epic devrait avoir au moins une feature');
        }
        
        done();
      } catch (error) {
        done(error);
      }
    });
  });
});
