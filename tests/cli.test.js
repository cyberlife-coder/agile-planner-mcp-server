const { startCLI } = require('../server/lib/cli');
const inquirer = require('inquirer');
const backlogGenerator = require('../server/lib/backlog-generator');
const markdownGenerator = require('../server/lib/markdown-generator');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

// Load sample backlog for tests (now in English)
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Note: These tests are temporarily disabled
// They need to be reimplemented after a thorough investigation
// of the CLI module mocking approach
describe.skip('CLI Interface', () => {
  beforeEach(() => {
    // Mock inquirer prompt
    sinon.stub(inquirer, 'prompt').resolves({
      projectName: 'Test Project',
      projectDescription: 'Test Project Description'
    });
    
    // Mock API client
    sinon.stub(backlogGenerator, 'initializeClient').returns({
      apiKey: 'fake-test-key'
    });
    
    // Mock backlog generation
    sinon.stub(backlogGenerator, 'generateBacklog').resolves(sampleBacklog);
    
    // Mock markdown generation
    sinon.stub(markdownGenerator, 'generateMarkdownFiles').resolves({
      epicPath: 'epic.md',
      mvpPath: 'mvp/user-stories.md',
      iterationDirs: ['iterations/iteration-1']
    });
    
    // Mock console and process
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
    sinon.stub(process.stdout, 'write');
    
    // Mock setInterval/clearInterval
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
    
    // Verify functions were called (minimal check)
    sinon.assert.called(backlogGenerator.generateBacklog);
    sinon.assert.called(markdownGenerator.generateMarkdownFiles);
  });
  
  test('Handles errors correctly', async () => {
    // Setup error scenario
    backlogGenerator.generateBacklog.restore();
    sinon.stub(backlogGenerator, 'generateBacklog').rejects(new Error('Test Error'));
    
    await startCLI();
    
    // Verify error was logged
    sinon.assert.calledWithMatch(console.error, sinon.match('Error generating backlog'));
  });
});
