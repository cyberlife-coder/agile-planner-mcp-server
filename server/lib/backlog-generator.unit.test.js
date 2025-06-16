// Tests unitaires TDD pour la refactorisation de generateBacklog
const { processBacklogParams, createApiMessages, determineModel, createBacklogSchema, attemptBacklogGeneration, harmonizeStories, handleBacklogError } = require('./backlog-generator');

describe('generateBacklog - Refactor TDD', () => {
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
    it('génère un tableau de messages API avec un objet', () => {
      const project = { name: 'Test', description: 'desc' };
      const messages = createApiMessages(project);
      expect(Array.isArray(messages)).toBe(true);
      expect(messages[0]).toHaveProperty('role');
    });

    it('génère un tableau de messages API avec une chaîne', () => {
      const messages = createApiMessages('Test: desc');
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
      const fakeClient = { generate: jest.fn().mockResolvedValue({ result: { epics: [] } }) };
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
    it('retourne un objet d’erreur formaté', () => {
      const err = handleBacklogError(new Error('fail'));
      expect(err).toHaveProperty('success', false);
      expect(err.error).toHaveProperty('message');
    });
  });
});
