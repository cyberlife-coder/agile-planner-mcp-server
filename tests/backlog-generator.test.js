/**
 * Tests unitaires pour backlog-generator
 * Version mise à jour pour Jest 29.7.0
 * 
 * Cette version utilise la syntaxe moderne de Jest avec mockResolvedValue au lieu de resolves
 * Conforme à RULE 1 : TDD avant toute refactorisation (Wave 8)
 */

// Mock des modules externes
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  writeFileSync: jest.fn(),
  appendFileSync: jest.fn(),
  ensureDirSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(path => path.split('/').slice(0, -1).join('/'))
}));

const { 
  processBacklogParams, 
  createApiMessages, 
  determineModel, 
  createBacklogSchema, 
  attemptBacklogGeneration, 
  harmonizeStories, 
  handleBacklogError 
} = require('../server/lib/backlog-generator');

// Mock console.error to avoid polluting test output
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('backlog-generator', () => {
  describe('processBacklogParams', () => {
    it('retourne valid=false si projectName est vide', () => {
      const res = processBacklogParams('', 'desc', {});
      expect(res.valid).toBe(false);
    });
    
    it('retourne valid=false si projectDescription est vide', () => {
      const res = processBacklogParams('name', '', {});
      expect(res.valid).toBe(false);
    });
    
    it('retourne valid=false si client est null', () => {
      const res = processBacklogParams('name', 'desc', null);
      expect(res.valid).toBe(false);
    });
    
    it('retourne valid=true si tous les paramètres sont valides', () => {
      const res = processBacklogParams('name', 'desc', { api: true });
      expect(res.valid).toBe(true);
    });
  });

  describe('createApiMessages', () => {
    it('génère un tableau de messages API cohérent', () => {
      const project = 'Test: desc';
      const messages = createApiMessages(project);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages[0]).toHaveProperty('role');
    });
  });

  describe('determineModel', () => {
    it('retourne un modèle selon le provider', () => {
      expect(typeof determineModel({ provider: 'openai' })).toBe('string');
    });
  });

  describe('createBacklogSchema', () => {
    it('retourne un objet schema', () => {
      const schema = createBacklogSchema();
      expect(typeof schema).toBe('object');
    });
  });

  describe('attemptBacklogGeneration', () => {
    it('retourne un objet {success, result} ou {success, error}', async () => {
      // Utiliser mockResolvedValue au lieu de resolves (syntaxe mise à jour)
      const fakeClient = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [
                { message: { content: JSON.stringify({ epics: [] }) } }
              ]
            })
          }
        }
      };
      const res = await attemptBacklogGeneration(fakeClient, 'gpt-3', [], {});
      expect(res).toHaveProperty('success');
    });
  });

  describe('harmonizeStories', () => {
    it('garantit que chaque feature possède un tableau stories', () => {
      const epics = [{ features: [{ title: 'f1', stories: undefined }, { title: 'f2', stories: [] }] }];
      harmonizeStories({ epics });
      expect(Array.isArray(epics[0].features[0].stories)).toBe(true);
      expect(Array.isArray(epics[0].features[1].stories)).toBe(true);
    });
  });

  describe('handleBacklogError', () => {
    it('retourne un objet d\'erreur formaté', () => {
      const err = handleBacklogError(new Error('fail'));
      expect(err).toHaveProperty('success', false);
      expect(err.error).toHaveProperty('message');
    });
  });
  
  // Nouveaux tests pour s'assurer que saveRawBacklog fonctionne correctement en mode audit
  describe('saveRawBacklog', () => {
    const fs = require('fs-extra');
    const path = require('path');
    
    // Réinitialiser les mocks avant chaque test
    beforeEach(() => {
      jest.clearAllMocks();
    });
    
    it('sauvegarde le backlog avec le nom approprié selon le mode', async () => {
      const { saveRawBacklog } = require('../server/lib/backlog-generator');
      
      // Test en mode normal (backlog.json)
      await saveRawBacklog({ test: 'data' }, './output');
      expect(path.join).toHaveBeenCalledWith('./output', 'backlog.json');
      expect(fs.ensureDir).toHaveBeenCalledWith('./output');
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Réinitialiser les compteurs de mock
      jest.clearAllMocks();
      
      // Test en mode audit (backlog-last-dump.json)
      await saveRawBacklog({ test: 'data' }, './output', { auditMode: true });
      expect(path.join).toHaveBeenCalledWith('./output', 'backlog-last-dump.json');
      expect(fs.ensureDir).toHaveBeenCalledWith('./output');
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });
});
