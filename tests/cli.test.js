let { startCLI } = require('../server/lib/cli'); // Utiliser let pour permettre la réassignation
const inquirer = require('inquirer');
let backlogGenerator = require('../server/lib/backlog-generator');
let markdownGenerator = require('../server/lib/markdown-generator');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');

// Charger l'exemple de backlog pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf-8')
);

// Récupérer le chemin absolu des modules pour vider le cache
const cliPath = require.resolve('../server/lib/cli');
const backlogGeneratorPath = require.resolve('../server/lib/backlog-generator');
const markdownGeneratorPath = require.resolve('../server/lib/markdown-generator');

describe('CLI Interface', () => {
  let mockInquirer;
  let mockConsole;
  
  beforeEach(() => {
    // Vider le cache require pour s'assurer que les stubs s'appliquent correctement
    delete require.cache[cliPath];
    delete require.cache[backlogGeneratorPath];
    delete require.cache[markdownGeneratorPath];

    // Ré-importer après avoir vidé le cache
    backlogGenerator = require(backlogGeneratorPath);
    markdownGenerator = require(markdownGeneratorPath);
    ({ startCLI } = require(cliPath)); // Re-require startCLI (assignation sans redéclaration)
    
    // Mock inquirer
    mockInquirer = {
      prompt: sinon.stub().resolves({
        project: 'Description du projet de test',
        saveRaw: true
      })
    };
    sinon.stub(inquirer, 'prompt').callsFake(mockInquirer.prompt);
    
    // Mock backlog generator
    sinon.stub(backlogGenerator, 'initializeClient').returns({}); // Stub retournant un objet vide
    sinon.stub(backlogGenerator, 'generateBacklog').resolves(sampleBacklog);
    
    // Mock markdown generator
    sinon.stub(markdownGenerator, 'generateMarkdownFiles').resolves({
      epicPath: 'epic.md',
      mvpPath: 'mvp/user-stories.md',
      iterationDirs: ['iterations/iteration-1', 'iterations/iteration-2']
    });
    sinon.stub(markdownGenerator, 'saveRawBacklog').resolves('backlog.json');
    
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
    // Vérifier que le client est initialisé (via le stub minimal)
    expect(backlogGenerator.initializeClient.called).toBe(true);
    // Vérifier que le backlog est généré
    expect(backlogGenerator.generateBacklog.called).toBe(true);
    // Vérifions plus précisément l'appel à generateBacklog
    expect(backlogGenerator.generateBacklog.calledOnceWith(
      'Description du projet de test', // Premier argument
      {} // Deuxième argument (client vide retourné par le stub)
    )).toBe(true);
    // Vérifier que les fichiers sont générés
    expect(markdownGenerator.generateMarkdownFiles.called).toBe(true);
    expect(markdownGenerator.saveRawBacklog.called).toBe(true);
    // Vérifier les messages de succès
    expect(mockConsole.log.calledWith(sinon.match('✅ Backlog généré avec succès'))).toBe(true);
  });
  
  test('Gère correctement les erreurs de génération', async () => {
    // Configurer le mock pour simuler une erreur
    backlogGenerator.generateBacklog.rejects(new Error('Test Error'));
    
    await startCLI();
    
    // Vérifier que l'erreur est bien loggée
    expect(mockConsole.error.calledWith(sinon.match('❌ Erreur lors de la génération du backlog'))).toBe(true);
  });
});
