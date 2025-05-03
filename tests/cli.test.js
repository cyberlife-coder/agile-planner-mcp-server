const { startCLI } = require('../server/lib/cli');
const inquirer = require('inquirer');
const backlogGenerator = require('../server/lib/backlog-generator');
const markdownGenerator = require('../server/lib/markdown-generator');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

// Charger l'exemple de backlog pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf-8')
);

describe('CLI Interface', () => {
  let mockInquirer;
  let mockBacklogGenerator;
  let mockMarkdownGenerator;
  let mockConsole;
  
  beforeEach(() => {
    // Mock inquirer
    mockInquirer = {
      prompt: sinon.stub().resolves({
        project: 'Description du projet de test',
        saveRaw: true
      })
    };
    sinon.stub(inquirer, 'prompt').callsFake(mockInquirer.prompt);
    
    // Mock backlog generator
    mockBacklogGenerator = {
      initializeClient: sinon.stub().returns({}),
      generateBacklog: sinon.stub().resolves(sampleBacklog)
    };
    sinon.stub(backlogGenerator, 'initializeClient').callsFake(mockBacklogGenerator.initializeClient);
    sinon.stub(backlogGenerator, 'generateBacklog').callsFake(mockBacklogGenerator.generateBacklog);
    
    // Mock markdown generator
    mockMarkdownGenerator = {
      generateMarkdownFiles: sinon.stub().resolves({
        epicPath: 'epic.md',
        mvpPath: 'mvp/user-stories.md',
        iterationDirs: ['iterations/iteration-1', 'iterations/iteration-2']
      }),
      saveRawBacklog: sinon.stub().resolves('backlog.json')
    };
    sinon.stub(markdownGenerator, 'generateMarkdownFiles').callsFake(mockMarkdownGenerator.generateMarkdownFiles);
    sinon.stub(markdownGenerator, 'saveRawBacklog').callsFake(mockMarkdownGenerator.saveRawBacklog);
    
    // Mock console
    mockConsole = {
      log: sinon.stub(),
      error: sinon.stub()
    };
    sinon.stub(console, 'log').callsFake(mockConsole.log);
    sinon.stub(console, 'error').callsFake(mockConsole.error);
    
    // Mock environnement pour simuler la présence d'une clé API
    process.env.OPENAI_API_KEY = 'fake-test-key';
  });
  
  afterEach(() => {
    sinon.restore();
    delete process.env.OPENAI_API_KEY;
  });
  
  test('Exécute le flux CLI complet avec succès', async () => {
    await startCLI();
    
    // Vérifier que l'utilisateur est interrogé
    expect(inquirer.prompt.called).toBe(true);
    
    // Vérifier que le client est initialisé
    expect(backlogGenerator.initializeClient.called).toBe(true);
    
    // Vérifier que le backlog est généré
    expect(backlogGenerator.generateBacklog.called).toBe(true);
    expect(backlogGenerator.generateBacklog.calledWith(
      'Description du projet de test',
      sinon.match.any
    )).toBe(true);
    
    // Vérifier que les fichiers Markdown sont générés
    expect(markdownGenerator.generateMarkdownFiles.called).toBe(true);
    
    // Vérifier que le JSON brut est sauvegardé
    expect(markdownGenerator.saveRawBacklog.called).toBe(true);
    
    // Vérifier les messages de succès
    expect(mockConsole.log.calledWith(sinon.match('✅ Backlog généré avec succès'))).toBe(true);
  });
  
  test('Gère correctement les erreurs de génération', async () => {
    // Configurer le mock pour simuler une erreur
    mockBacklogGenerator.generateBacklog.rejects(new Error('Test Error'));
    
    await startCLI();
    
    // Vérifier que l'erreur est bien loggée
    expect(mockConsole.error.calledWith(sinon.match('❌ Erreur lors de la génération du backlog'))).toBe(true);
  });
});
