const { generateMarkdownFiles, formatUserStory, saveRawBacklog } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');

// Charger l'exemple de backlog pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf-8')
);

describe('Markdown Generator', () => {
  let mockFs;
  let tempDir;
  
  beforeEach(() => {
    // Créer un répertoire temporaire pour les tests
    tempDir = path.join(__dirname, 'temp');
    
    // Mock des fonctions fs-extra
    mockFs = {
      writeFile: sinon.stub().resolves(),
      ensureDir: sinon.stub().resolves()
    };
    
    // Remplacer les méthodes fs-extra par nos mocks
    sinon.stub(fs, 'writeFile').callsFake(mockFs.writeFile);
    sinon.stub(fs, 'ensureDir').callsFake(mockFs.ensureDir);
  });
  
  afterEach(() => {
    // Restaurer les méthodes fs-extra originales
    sinon.restore();
  });
  
  describe('formatUserStory', () => {
    test('Formate correctement une user story en Markdown', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Vérifier que le formatage contient les éléments attendus
      expect(formatted).toContain(`## ${story.id}: ${story.title}`);
      expect(formatted).toContain(`- [ ] ${story.description}`);
      expect(formatted).toContain(`### Critères d'acceptation`);
      expect(formatted).toContain(`### Tâches techniques`);
      
      // Vérifier que tous les critères d'acceptation sont inclus
      story.acceptance_criteria.forEach(criteria => {
        expect(formatted).toContain(`- [ ] ${criteria}`);
      });
      
      // Vérifier que toutes les tâches sont incluses
      story.tasks.forEach(task => {
        expect(formatted).toContain(`- [ ] ${task}`);
      });
    });
  });
  
  describe('generateMarkdownFiles', () => {
    test('Crée les répertoires et fichiers Markdown nécessaires', async () => {
      await generateMarkdownFiles(sampleBacklog, tempDir);
      
      // Vérifier que les répertoires sont créés
      expect(fs.ensureDir.calledWith(path.join(tempDir, 'mvp'))).toBe(true);
      expect(fs.ensureDir.calledWith(path.join(tempDir, 'iterations'))).toBe(true);
      
      // Vérifier les appels pour créer le fichier Epic
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'epic.md'),
        sinon.match(`# Epic: ${sampleBacklog.epic.title}`),
        'utf8'
      )).toBe(true);
      
      // Vérifier les appels pour créer le fichier MVP
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'mvp', 'user-stories.md'),
        sinon.match('# MVP - User Stories'),
        'utf8'
      )).toBe(true);
      
      // Vérifier la création des répertoires d'itération
      sampleBacklog.iterations.forEach(iteration => {
        const dirName = iteration.name.toLowerCase().replace(/\s+/g, '-');
        expect(fs.ensureDir.calledWith(path.join(tempDir, 'iterations', dirName))).toBe(true);
      });
    });
  });
  
  describe('saveRawBacklog', () => {
    test('Sauvegarde correctement le JSON brut', async () => {
      const jsonPath = await saveRawBacklog(sampleBacklog, tempDir);
      
      expect(jsonPath).toBe(path.join(tempDir, 'backlog.json'));
      expect(fs.writeFile.calledWith(
        path.join(tempDir, 'backlog.json'),
        sinon.match.string,
        'utf8'
      )).toBe(true);
      
      // Vérifier que le JSON est formaté avec indentation
      const jsonContent = fs.writeFile.getCall(0).args[1];
      expect(jsonContent).toContain('  "epic"');
    });
  });
});
