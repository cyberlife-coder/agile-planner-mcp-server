/**
 * Tests pour le gestionnaire de chemin centralisé
 * @jest
 */

const path = require('path');
const { PathResolver } = require('../server/lib/utils/path-resolver');

describe('PathResolver', () => {
  let resolver;
  
  beforeEach(() => {
    resolver = new PathResolver();
  });
  
  test('resolveOutputPath convertit en chemin absolu', () => {
    // Cas 1: Chemin déjà absolu
    const absPath = path.resolve('/some/absolute/path');
    expect(resolver.resolveOutputPath(absPath)).toBe(absPath);
    
    // Cas 2: Chemin relatif
    const relPath = './relative/path';
    expect(resolver.resolveOutputPath(relPath)).toBe(path.resolve(process.cwd(), relPath));
    
    // Cas 3: Null utilise le répertoire courant
    expect(resolver.resolveOutputPath(null)).toBe(process.cwd());
    
    // Cas 4: Variable d'environnement (simulée)
    process.env.AGILE_PLANNER_OUTPUT_ROOT = '/env/path';
    expect(resolver.resolveOutputPath(null)).toBe('/env/path');
    delete process.env.AGILE_PLANNER_OUTPUT_ROOT;
  });
  
  test('getBacklogDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const expected = path.join(basePath, '.agile-planner-backlog');
    expect(resolver.getBacklogDir(basePath)).toBe(expected);
  });
  
  test('getEpicDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const epicId = 'test-epic';
    const expected = path.join(basePath, '.agile-planner-backlog', 'epics', 'test-epic');
    expect(resolver.getEpicDir(basePath, epicId)).toBe(expected);
  });
  
  test('getFeatureDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const epicId = 'test-epic';
    const featureId = 'test-feature';
    const expected = path.join(basePath, '.agile-planner-backlog', 'epics', 'test-epic', 'features', 'test-feature');
    expect(resolver.getFeatureDir(basePath, epicId, featureId)).toBe(expected);
  });
  
  test('getUserStoryDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const epicId = 'test-epic';
    const featureId = 'test-feature';
    const expected = path.join(basePath, '.agile-planner-backlog', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories');
    expect(resolver.getUserStoryDir(basePath, epicId, featureId)).toBe(expected);
  });
  
  test('getMvpDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const expected = path.join(basePath, '.agile-planner-backlog', 'planning', 'mvp');
    expect(resolver.getMvpDir(basePath)).toBe(expected);
  });
  
  test('getIterationDir construit le chemin correct', () => {
    const basePath = '/test/path';
    const iterationName = 'iteration-1';
    const expected = path.join(basePath, '.agile-planner-backlog', 'planning', 'iterations', 'iteration-1');
    expect(resolver.getIterationDir(basePath, iterationName)).toBe(expected);
  });
  
  test('getUserStoryPath construit le chemin correct', () => {
    const basePath = '/test/path';
    const epicId = 'test-epic';
    const featureId = 'test-feature';
    const storyId = 'test-story';
    const expected = path.join(basePath, '.agile-planner-backlog', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'test-story.md');
    expect(resolver.getUserStoryPath(basePath, epicId, featureId, storyId)).toBe(expected);
  });
  
  test('getRelativePathToUserStory calcule le chemin relatif correctement depuis le MVP', () => {
    const epicId = 'test-epic';
    const featureId = 'test-feature';
    const storyId = 'test-story';
    
    // Chemin relatif depuis le dossier MVP vers la user story
    const expected = path.join('..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'test-story.md');
    const result = resolver.getRelativePathToUserStory('mvp', epicId, featureId, storyId);
    
    // Normaliser le chemin pour le test
    const normalizedExpected = expected.split(path.sep).join('/');
    const normalizedResult = result.split(path.sep).join('/');
    
    expect(normalizedResult).toBe(normalizedExpected);
  });
  
  test('getRelativePathToUserStory calcule le chemin relatif correctement depuis une itération', () => {
    const epicId = 'test-epic';
    const featureId = 'test-feature';
    const storyId = 'test-story';
    
    // Chemin relatif depuis le dossier d'une itération vers la user story
    const expected = path.join('..', '..', '..', 'epics', 'test-epic', 'features', 'test-feature', 'user-stories', 'test-story.md');
    const result = resolver.getRelativePathToUserStory('iteration', epicId, featureId, storyId);
    
    // Normaliser le chemin pour le test
    const normalizedExpected = expected.split(path.sep).join('/');
    const normalizedResult = result.split(path.sep).join('/');
    
    expect(normalizedResult).toBe(normalizedExpected);
  });
});
