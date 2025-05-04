const { startCLI } = require('../server/lib/cli');
const inquirer = require('inquirer');
const backlogGenerator = require('../server/lib/backlog-generator');
const markdownGenerator = require('../server/lib/markdown-generator');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

// Load sample backlog for tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Wrapped sample backlog in success/result format
const sampleBacklogResult = {
  success: true,
  result: sampleBacklog
};

// CLI tests - still skipped until the CLI module is fully adapted
describe.skip('CLI Interface', () => {
  beforeEach(() => {
    // Mock inquirer prompt
    sinon.stub(inquirer, 'prompt').resolves({
      projectName: 'Test Project',
      projectDescription: 'Test Project Description'
    });
    
    // Mock backlog generation
    sinon.stub(backlogGenerator, 'generateBacklog').resolves(sampleBacklogResult);
    
    // Mock markdown generation with new format
    sinon.stub(markdownGenerator, 'generateMarkdownFilesFromResult').resolves({
      success: true,
      files: {
        epicsDir: path.join(process.cwd(), '.agile-planner-backlog', 'epics')
      }
    });
    
    // Mock console and process
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
    sinon.stub(process.stdout, 'write');
    
    // Mock setInterval/clearInterval for loading indicators
    sinon.stub(global, 'setInterval').returns(123);
    sinon.stub(global, 'clearInterval');
    
    // Set API key
    process.env.OPENAI_API_KEY = 'fake-test-key';
  });
  
  afterEach(() => {
    sinon.restore();
    delete process.env.OPENAI_API_KEY;
  });

  test('Handles basic CLI flow', async () => {
    await startCLI();
    
    // Verify functions were called with correct arguments
    sinon.assert.called(backlogGenerator.generateBacklog);
    sinon.assert.called(markdownGenerator.generateMarkdownFilesFromResult);
    
    // Verify markdownGenerator was called with the backlog result from backlogGenerator
    sinon.assert.calledWith(
      markdownGenerator.generateMarkdownFilesFromResult,
      sinon.match.has('success', true)
    );
  });
  
  test('Handles backlog generation errors correctly', async () => {
    // Setup error scenario for backlog generation
    backlogGenerator.generateBacklog.restore();
    sinon.stub(backlogGenerator, 'generateBacklog').resolves({
      success: false,
      error: { message: 'Test Error', details: ['Invalid format'] }
    });
    
    await startCLI();
    
    // Verify error was logged
    sinon.assert.calledWithMatch(console.error, sinon.match('Error generating backlog'));
  });
  
  test('Handles markdown generation errors correctly', async () => {
    // Setup error scenario for markdown generation
    markdownGenerator.generateMarkdownFilesFromResult.restore();
    sinon.stub(markdownGenerator, 'generateMarkdownFilesFromResult').resolves({
      success: false,
      error: { message: 'Failed to generate markdown files' }
    });
    
    await startCLI();
    
    // Verify error was logged
    sinon.assert.calledWithMatch(console.error, sinon.match('Error generating markdown files'));
  });
});
