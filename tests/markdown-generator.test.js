const { generateMarkdownFilesFromResult, formatUserStory, saveRawBacklog } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

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
  
  beforeEach(() => {
    // Create temporary directory for tests
    tempDir = path.join(__dirname, 'temp');
    
    // Mock fs-extra functions
    mockFs = {
      writeFile: sinon.stub().resolves(),
      ensureDir: sinon.stub().resolves()
    };
    
    // Replace fs-extra methods with our mocks
    sinon.stub(fs, 'writeFile').callsFake(mockFs.writeFile);
    sinon.stub(fs, 'ensureDir').callsFake(mockFs.ensureDir);
  });
  
  afterEach(() => {
    // Restore original fs-extra methods
    sinon.restore();
  });
  
  describe('formatUserStory', () => {
    test('Formats a user story correctly in Markdown with checkboxes', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify formatting contains expected elements
      expect(formatted).toContain(`## ${story.id}: ${story.title}`);
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
  });
  
  describe('generateMarkdownFilesFromResult', () => {
    test('Creates necessary directories and Markdown files with proper structure', async () => {
      // Exécute la fonction à tester
      const result = await generateMarkdownFilesFromResult(sampleBacklogResult, tempDir);
      
      // Vérifie que la fonction a réussi
      expect(result.success).toBe(true);
      
      // Vérifie que le chemin de sortie utilise bien le dossier .agile-planner-backlog
      const expectedBaseDir = path.join(tempDir, '.agile-planner-backlog');
      
      // 1. Vérifie la création des dossiers principaux
      expect(fs.ensureDir.calledWith(expectedBaseDir)).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'epics'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'mvp'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(expectedBaseDir, 'iterations'))).toBe(true);
      
      // 2. Vérifie la création du README principal
      const readmeCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === path.join(expectedBaseDir, 'README.md')
      );
      expect(readmeCall).toBeDefined();
      if (readmeCall) {
        expect(readmeCall.args[1]).toContain('# Agile Backlog');
        expect(readmeCall.args[1]).toContain('[Epic](./epics/epic.md)');
        expect(readmeCall.args[1]).toContain('[MVP](./mvp/user-stories.md)');
      }
      
      // 3. Vérifie le fichier epic.md
      const epicFilePath = path.join(expectedBaseDir, 'epics', 'epic.md');
      const epicFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === epicFilePath
      );
      expect(epicFileCall).toBeDefined();
      if (epicFileCall) {
        const content = epicFileCall.args[1];
        // Vérifie si les textes pertinents sont présents, sans ordre strict
        expect(content).toContain('🤖');  // Symbole robot pour instructions AI
        expect(content).toContain(sampleBacklog.epic.title);
        expect(content).toContain(sampleBacklog.epic.description);
      }
      
      // 4. Vérifie la création du fichier user-stories.md du MVP
      const mvpStoriesPath = path.join(expectedBaseDir, 'mvp', 'user-stories.md');
      const mvpFileCall = fs.writeFile.getCalls().find(call => 
        call.args[0] === mvpStoriesPath
      );
      expect(mvpFileCall).toBeDefined();
      
      // 5. Vérifie la structure des itérations
      sampleBacklog.iterations.forEach(iteration => {
        const iterationSlug = iteration.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const iterationDir = path.join(expectedBaseDir, 'iterations', iterationSlug);
        expect(fs.ensureDir.calledWith(iterationDir)).toBe(true);
      });
    });
    
    test('Returns error for invalid backlog result', async () => {
      const invalidResult = { success: false, error: { message: 'Test error' } };
      const result = await generateMarkdownFilesFromResult(invalidResult, tempDir);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Test error');
    });
  });
  
  describe('saveRawBacklog', () => {
    test('Correctly saves the raw JSON', async () => {
      const jsonPath = await saveRawBacklog(sampleBacklog, tempDir);
      
      expect(jsonPath).toBe(path.join(tempDir, 'backlog.json'));
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'backlog.json'),
        sinon.match.string,
        'utf8'
      )).toBe(true);
      
      // Verify JSON is formatted with indentation
      const jsonContent = fs.writeFile.getCall(0).args[1];
      expect(jsonContent).toContain('  "epic"');
    });
  });
});
