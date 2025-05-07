const { generateMarkdownFilesFromResult, formatUserStory, saveRawBacklog } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');
const { PathResolver } = require('../server/lib/utils/path-resolver');
const { FileManager } = require('../server/lib/utils/file-manager');
const { SchemaValidator } = require('../server/lib/utils/schema-validator');

// Load sample backlog for tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Wrapper du résultat comme dans la nouvelle structure (success/result/error)
const sampleBacklogResult = {
  success: true,
  result: sampleBacklog
};

describe('Markdown Generator', () => {
  let mockFs;
  let tempDir;
  let sandbox;
  
  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, 'temp');
    
    // Create a sinon sandbox for test isolation
    sandbox = sinon.createSandbox();
    
    // Mock fs-extra functions
    mockFs = {
      writeFile: sandbox.stub().resolves(),
      ensureDir: sandbox.stub().resolves(),
      existsSync: sandbox.stub().returns(true)
    };
    
    // Replace fs-extra methods with our mocks
    sandbox.stub(fs, 'writeFile').callsFake(mockFs.writeFile);
    sandbox.stub(fs, 'ensureDir').callsFake(mockFs.ensureDir);
    sandbox.stub(fs, 'existsSync').callsFake(mockFs.existsSync);
    
    // Stub des classes utilitaires
    sandbox.stub(PathResolver.prototype, 'getBacklogDir').callsFake((outputPath) => {
      return path.join(outputPath, '.agile-planner-backlog');
    });
    
    // Stub FileManager pour isoler les tests
    sandbox.stub(FileManager.prototype, 'createMarkdownFiles').resolves();
    
    // Stub SchemaValidator pour éviter les problèmes de validation
    sandbox.stub(SchemaValidator.prototype, 'validateBacklog').returns({ valid: true });
    sandbox.stub(SchemaValidator.prototype, 'extractBacklogData').callsFake((backlog) => {
      if (backlog && backlog.success) {
        return backlog.result;
      }
      return backlog;
    });
  });
  
  afterEach(() => {
    // Restore original methods
    sandbox.restore();
  });
  
  describe('formatUserStory', () => {
    test('Formats a user story correctly in Markdown with checkboxes', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify formatting contains expected elements
      expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
      expect(formatted).toContain(`- [ ] ${story.description}`);
      expect(formatted).toContain(`### Acceptance Criteria`);
      expect(formatted).toContain(`### Technical Tasks`);
      
      // Verify all acceptance criteria are included with checkboxes
      story.acceptance_criteria.forEach(criteria => {
        expect(formatted).toContain(`- [ ] ${criteria}`);
      });
      
      // Verify all tasks are included with checkboxes
      story.tasks.forEach(task => {
        expect(formatted).toContain(`- [ ] ${task}`);
      });
      
      // Verify priority is included
      if (story.priority) {
        expect(formatted).toContain(`**Priority:** ${story.priority}`);
      }
      
      // Verify dependencies if they exist
      if (story.dependencies && story.dependencies.length > 0) {
        expect(formatted).toContain(`**Dependencies:** ${story.dependencies.join(', ')}`);
      }
    });

    test('Includes enhanced AI instructions for status updates', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify enhanced instructions are included
      expect(formatted).toContain('🤖');
      expect(formatted).toContain('User Story Instructions for AI');
      expect(formatted).toContain('Mettez à jour le statut des tâches');
      expect(formatted).toContain('[ ]');
      expect(formatted).toContain('[x]');
    });
  });
  
  describe('generateMarkdownFilesFromResult', () => {
    test('Creates necessary directories and Markdown files with proper structure', async () => {
      // Exécute la fonction à tester
      const result = await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifie que la fonction a réussi
      expect(result.success).toBe(true);
      
      // Vérifie que l'appel à FileManager a été effectué
      expect(FileManager.prototype.createMarkdownFiles.called).toBe(true);
      
      // Vérifie que l'appel à SchemaValidator a été effectué
      expect(SchemaValidator.prototype.validateBacklog.called).toBe(true);
      
      // Vérifie que les dossiers de base ont été créés
      const expectedBaseDir = path.join(tempDir, '.agile-planner-backlog');
      expect(fs.ensureDir.calledWith(expectedBaseDir)).toBe(true);
    });
    
    test('Returns error for invalid backlog result', async () => {
      // Restaurer la validation réelle pour ce test
      SchemaValidator.prototype.validateBacklog.restore();
      sandbox.stub(SchemaValidator.prototype, 'validateBacklog').returns({ 
        valid: false, 
        errors: [{ field: 'epics', message: 'Epics array is missing or not an array in backlog result' }] 
      });
      
      // Créer un résultat de backlog invalide (sans epics)
      const invalidBacklog = {
        projectName: 'Invalid Project',
        description: 'Invalid Project Description'
        // epics array missing
      };
      
      const result = await generateMarkdownFilesFromResult(invalidBacklog, tempDir);
      
      // La fonction devrait retourner une erreur
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
  
  describe('Instructions IA et références croisées', () => {
    test('Les fichiers d\'epic contiennent des instructions IA améliorées', async () => {
      // Restaurer writeFile pour vérifier le contenu
      fs.writeFile.restore();
      sandbox.stub(fs, 'writeFile').callsFake((filePath, content) => {
        // Si c'est un fichier d'epic.md, vérifier les instructions IA
        if (filePath.endsWith('epic.md')) {
          expect(content).toContain('Epic:');
          expect(content).toContain('🤖 Epic Processing Instructions for AI');
          expect(content).toContain('Comprendre la vision globale');
        }
        return Promise.resolve();
      });
      
      // Exécuter la fonction à tester
      await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifier que writeFile a été appelé
      expect(fs.writeFile.called).toBe(true);
    });
    
    test('Les fichiers d\'itération incluent des liens vers les user stories', async () => {
      // Restaurer writeFile pour vérifier le contenu
      fs.writeFile.restore();
      sandbox.stub(fs, 'writeFile').callsFake((filePath, content) => {
        // Si c'est un fichier iteration.md, vérifier les liens vers les user stories
        if (filePath.endsWith('iteration.md')) {
          // Vérifier que le contenu contient des références aux user stories
          sampleBacklog.iterations.forEach(iteration => {
            iteration.stories.forEach(story => {
              expect(content).toContain(story.title);
            });
          });
        }
        return Promise.resolve();
      });
      
      // Exécuter la fonction à tester
      await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifier que writeFile a été appelé
      expect(fs.writeFile.called).toBe(true);
    });
  });
  
  describe('Structure hiérarchique complète', () => {
    test('Crée une structure hiérarchique avec epics contenant features et user stories', async () => {
      // Restaurer ensureDir pour vérifier la création des dossiers
      fs.ensureDir.restore();
      sandbox.stub(fs, 'ensureDir').callsFake((dirPath) => {
        // Vérifier la création de la structure hiérarchique
        if (dirPath.includes('epics')) {
          // On vérifie que la structure est créée sans aller dans les détails exacts
          expect(dirPath).toContain(path.join('.agile-planner-backlog', 'epics'));
        }
        return Promise.resolve();
      });
      
      // Exécuter la fonction à tester
      await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifier que ensureDir a été appelé
      expect(fs.ensureDir.called).toBe(true);
    });
    
    test('Utilise les IDs au lieu des slugs pour les noms de fichiers', async () => {
      // Restaurer writeFile pour vérifier les noms de fichiers
      fs.writeFile.restore();
      sandbox.stub(fs, 'writeFile').callsFake((filePath, content) => {
        // Vérifier l'utilisation des IDs dans les noms de fichiers
        if (filePath.includes('epics')) {
          // Au moins un ID d'epic devrait être présent dans le chemin
          const epicIds = sampleBacklog.epics.map(epic => epic.id);
          const hasEpicId = epicIds.some(id => filePath.includes(id));
          expect(hasEpicId).toBe(true);
        }
        return Promise.resolve();
      });
      
      // Exécuter la fonction à tester
      await generateMarkdownFilesFromResult(sampleBacklog, tempDir);
      
      // Vérifier que writeFile a été appelé
      expect(fs.writeFile.called).toBe(true);
    });
  });
  
  describe('saveRawBacklog', () => {
    test('Correctly saves the raw JSON', async () => {
      // La fonction saveRawBacklog reçoit maintenant un résultat OpenAI complet
      // et non plus directement le contenu du backlog
      const apiResult = {
        choices: [
          {
            message: {
              content: JSON.stringify(sampleBacklog)
            }
          }
        ]
      };
      
      const jsonPath = await saveRawBacklog(apiResult, tempDir);
      
      // Le chemin de sortie est désormais dans .agile-planner-backlog/raw
      const expectedPath = path.join(tempDir, '.agile-planner-backlog', 'raw', 'openai-response.json');
      expect(jsonPath).toBe(expectedPath);
      
      // Vérifier que le dossier raw est créé
      expect(fs.ensureDir.calledWith(
        path.join(tempDir, '.agile-planner-backlog', 'raw')
      )).toBe(true);
      
      // Vérifier que le fichier JSON est écrit
      expect(fs.writeFile.calledWith(
        expectedPath,
        sinon.match.string,
        'utf8'
      )).toBe(true);
    });
  });
  
  test('Gère correctement les structures de données MCP wrapper (success/result)', async () => {
    // Créer un backlog wrappé comme ce que renvoie MCP
    const wrappedBacklog = {
      success: true,
      result: sampleBacklog
    };
    
    // Exécuter la fonction avec le backlog wrappé
    const result = await generateMarkdownFilesFromResult(wrappedBacklog, tempDir);
    
    // Vérifier que la fonction a réussi
    expect(result.success).toBe(true);
    
    // Vérifier que SchemaValidator.extractBacklogData a été appelé
    expect(SchemaValidator.prototype.extractBacklogData.called).toBe(true);
    
    // Vérifier que FileManager.createMarkdownFiles a été appelé avec le backlog extrait
    expect(FileManager.prototype.createMarkdownFiles.called).toBe(true);
  });
});
