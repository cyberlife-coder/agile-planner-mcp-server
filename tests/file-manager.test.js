/**
 * Tests pour la classe FileManager
 * Responsable de la gestion des fichiers et de la structure hiérarchique
 * @jest
 */

const path = require('path');
const fs = require('fs-extra');
const { FileManager } = require('../server/lib/utils/file-manager');

describe('FileManager', () => {
  const testDir = path.join(__dirname, 'temp', 'file-manager-test');
  let fileManager;
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
    fileManager = new FileManager(testDir);
  });
  
  afterEach(async () => {
    await fs.remove(testDir);
  });
  
  test('resolveAbsolutePath convertit correctement les chemins relatifs', () => {
    // Chemin déjà absolu
    const absPath = path.resolve('/some/absolute/path');
    expect(fileManager.resolveAbsolutePath(absPath)).toBe(absPath);
    
    // Chemin relatif
    const relPath = './relative/path';
    const expectedAbsPath = path.resolve(process.cwd(), relPath);
    expect(fileManager.resolveAbsolutePath(relPath)).toBe(expectedAbsPath);
    
    // Chemin null ou undefined
    expect(fileManager.resolveAbsolutePath(null)).toBe(process.cwd());
    expect(fileManager.resolveAbsolutePath(undefined)).toBe(process.cwd());
  });
  
  test('getBacklogDir retourne le chemin complet du dossier .agile-planner-backlog', () => {
    const expected = path.join(testDir, '.agile-planner-backlog');
    expect(fileManager.getBacklogDir()).toBe(expected);
  });
  
  test('createBacklogStructure crée la structure de base', async () => {
    await fileManager.createBacklogStructure();
    
    // Vérifier que les dossiers de base sont créés
    const backlogDir = fileManager.getBacklogDir();
    expect(fs.existsSync(backlogDir)).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'epics'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning', 'mvp'))).toBe(true);
    expect(fs.existsSync(path.join(backlogDir, 'planning', 'iterations'))).toBe(true);
  });
  
  test('createEpicFile crée le fichier epic.md et sa structure', async () => {
    const epic = {
      id: 'test-epic',
      title: 'Test Epic',
      description: 'Test Epic Description'
    };
    
    await fileManager.createBacklogStructure();
    const epicPath = await fileManager.createEpicFile(epic);
    
    // Vérifier que le fichier epic.md est créé
    expect(fs.existsSync(epicPath)).toBe(true);
    
    // Vérifier que le contenu contient le titre et la description
    const content = await fs.readFile(epicPath, 'utf8');
    expect(content).toContain(epic.title);
    expect(content).toContain(epic.description);
    
    // Vérifier que le dossier features est créé
    const featuresDir = path.join(path.dirname(epicPath), 'features');
    expect(fs.existsSync(featuresDir)).toBe(true);
  });
  
  test('createFeatureFile crée le fichier feature.md et sa structure', async () => {
    const epic = {
      id: 'test-epic',
      title: 'Test Epic'
    };
    
    const feature = {
      id: 'test-feature',
      title: 'Test Feature',
      description: 'Test Feature Description'
    };
    
    await fileManager.createBacklogStructure();
    await fileManager.createEpicFile(epic);
    const featurePath = await fileManager.createFeatureFile(feature, epic.id);
    
    // Vérifier que le fichier feature.md est créé
    expect(fs.existsSync(featurePath)).toBe(true);
    
    // Vérifier que le contenu contient le titre et la description
    const content = await fs.readFile(featurePath, 'utf8');
    expect(content).toContain(feature.title);
    expect(content).toContain(feature.description);
    
    // Vérifier que le dossier user-stories est créé
    const storiesDir = path.join(path.dirname(featurePath), 'user-stories');
    expect(fs.existsSync(storiesDir)).toBe(true);
  });
  
  test('createUserStoryFile crée le fichier user-story.md', async () => {
    const epic = { id: 'test-epic', title: 'Test Epic' };
    const feature = { id: 'test-feature', title: 'Test Feature' };
    const story = {
      id: 'test-story',
      title: 'Test Story',
      description: 'Test Story Description',
      acceptance_criteria: ['Critère 1', 'Critère 2']
    };
    
    await fileManager.createBacklogStructure();
    await fileManager.createEpicFile(epic);
    await fileManager.createFeatureFile(feature, epic.id);
    const storyPath = await fileManager.createUserStoryFile(story, feature.id, epic.id);
    
    // Vérifier que le fichier user story est créé
    expect(fs.existsSync(storyPath)).toBe(true);
    
    // Vérifier que le contenu contient le titre, la description et les critères
    const content = await fs.readFile(storyPath, 'utf8');
    expect(content).toContain(story.title);
    expect(content).toContain(story.description);
    story.acceptance_criteria.forEach(criteria => {
      expect(content).toContain(criteria);
    });
  });
  
  test('créer un fichier MVP qui référence des user stories existantes', async () => {
    const epic = { id: 'test-epic', title: 'Test Epic' };
    const feature = { id: 'test-feature', title: 'Test Feature' };
    const story1 = { id: 'story-1', title: 'Story 1' };
    const story2 = { id: 'story-2', title: 'Story 2' };
    
    await fileManager.createBacklogStructure();
    await fileManager.createEpicFile(epic);
    await fileManager.createFeatureFile(feature, epic.id);
    await fileManager.createUserStoryFile(story1, feature.id, epic.id);
    await fileManager.createUserStoryFile(story2, feature.id, epic.id);
    
    const mvpStories = [
      { id: 'story-1', title: 'Story 1' },
      { id: 'story-2', title: 'Story 2' }
    ];
    
    const mvpPath = await fileManager.createMvpFile(mvpStories);
    
    // Vérifier que le fichier MVP est créé
    expect(fs.existsSync(mvpPath)).toBe(true);
    
    // Vérifier que le contenu contient des références aux user stories
    const content = await fs.readFile(mvpPath, 'utf8');
    expect(content).toContain('Story 1');
    expect(content).toContain('Story 2');
    
    // Vérifier que les liens relatifs sont corrects
    const expectedLink1 = path.join('..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'story-1.md');
    const expectedLink2 = path.join('..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'story-2.md');
    
    // Convertir les chemins pour qu'ils utilisent le séparateur correct de la plateforme
    const platformLink1 = expectedLink1.split(path.sep).join('/');
    const platformLink2 = expectedLink2.split(path.sep).join('/');
    
    expect(content).toContain(platformLink1);
    expect(content).toContain(platformLink2);
  });
  
  test('créer un fichier d\'itération qui référence des user stories existantes', async () => {
    const epic = { id: 'test-epic', title: 'Test Epic' };
    const feature = { id: 'test-feature', title: 'Test Feature' };
    const story1 = { id: 'story-1', title: 'Story 1' };
    const story2 = { id: 'story-2', title: 'Story 2' };
    
    await fileManager.createBacklogStructure();
    await fileManager.createEpicFile(epic);
    await fileManager.createFeatureFile(feature, epic.id);
    await fileManager.createUserStoryFile(story1, feature.id, epic.id);
    await fileManager.createUserStoryFile(story2, feature.id, epic.id);
    
    const iteration = {
      name: 'iteration-1',
      stories: [
        { id: 'story-1', title: 'Story 1' },
        { id: 'story-2', title: 'Story 2' }
      ]
    };
    
    const iterationPath = await fileManager.createIterationFile(iteration);
    
    // Vérifier que le fichier d'itération est créé
    expect(fs.existsSync(iterationPath)).toBe(true);
    
    // Vérifier que le contenu contient des références aux user stories
    const content = await fs.readFile(iterationPath, 'utf8');
    expect(content).toContain('Story 1');
    expect(content).toContain('Story 2');
    
    // Vérifier que les liens relatifs sont corrects
    const expectedLink1 = path.join('..', '..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'story-1.md');
    const expectedLink2 = path.join('..', '..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'story-2.md');
    
    // Convertir les chemins pour qu'ils utilisent le séparateur correct de la plateforme
    const platformLink1 = expectedLink1.split(path.sep).join('/');
    const platformLink2 = expectedLink2.split(path.sep).join('/');
    
    expect(content).toContain(platformLink1);
    expect(content).toContain(platformLink2);
  });
});
