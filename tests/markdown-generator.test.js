const { generateMarkdownFiles, formatUserStory, saveRawBacklog } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

// Load sample backlog for tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// No preprocessing needed as we're removing accent management

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
    test('Formats a user story correctly in Markdown', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify formatting contains expected elements
      expect(formatted).toContain(`## ${story.id}: ${story.title}`);
      expect(formatted).toContain(`- [ ] ${story.description}`);
      expect(formatted).toContain(`### Acceptance Criteria`);
      expect(formatted).toContain(`### Technical Tasks`);
      
      // Verify all acceptance criteria are included
      story.acceptance_criteria.forEach(criteria => {
        expect(formatted).toContain(`- [ ] ${criteria}`);
      });
      
      // Verify all tasks are included
      story.tasks.forEach(task => {
        expect(formatted).toContain(`- [ ] ${task}`);
      });
    });
  });
  
  describe('generateMarkdownFiles', () => {
    test('Creates necessary directories and Markdown files', async () => {
      await generateMarkdownFiles(sampleBacklog, tempDir);
      
      // Verify directories are created
      expect(fs.ensureDir.calledWith(path.join(tempDir, 'mvp'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(tempDir, 'iterations'))).toBe(true);
      
      // Verify calls to create Epic file
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'epic.md'),
        sinon.match(`# Epic: ${sampleBacklog.epic.title}`),
        'utf8'
      )).toBe(true);
      
      // Verify calls to create MVP file
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'mvp', 'user-stories.md'),
        sinon.match('# MVP - User Stories'),
        'utf8'
      )).toBe(true);
      
      // Verify creation of iteration directories
      sampleBacklog.iterations.forEach(iteration => {
        const dirName = iteration.name.toLowerCase().replace(/\s+/g, '-');
        expect(fs.ensureDir.calledWith(path.join(tempDir, 'iterations', dirName))).toBe(true);
      });
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
