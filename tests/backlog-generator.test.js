const { initializeClient, generateBacklog } = require('../server/lib/backlog-generator');
const sinon = require('sinon');
const fs = require('fs');
const path = require('path');

// Charger l'exemple de backlog pour les tests
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-backlog.json'), 'utf-8')
);

describe('Backlog Generator', () => {
  describe('initializeClient', () => {
    test('Initialise le client OpenAI quand la clé OpenAI est fournie', () => {
      const client = initializeClient('fake-openai-key', null);
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-openai-key');
      expect(client.baseURL).toBeUndefined();
    });
    
    test('Initialise le client GROQ quand la clé GROQ est fournie', () => {
      const client = initializeClient(null, 'fake-groq-key');
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-groq-key');
      expect(client.baseURL).toBe('https://api.groq.com/openai/v1');
    });
    
    test('Prioritise la clé OpenAI quand les deux sont fournies', () => {
      const client = initializeClient('fake-openai-key', 'fake-groq-key');
      expect(client).toBeDefined();
      expect(client.apiKey).toBe('fake-openai-key');
      expect(client.baseURL).toBeUndefined();
    });
    
    test('Lance une erreur quand aucune clé n\'est fournie', () => {
      expect(() => {
        initializeClient(null, null);
      }).toThrow('Aucune clé API fournie pour OpenAI ou GROQ');
    });
  });
  
  describe('generateBacklog', () => {
    let mockClient;
    
    beforeEach(() => {
      // Créer un mock pour le client OpenAI
      mockClient = {
        chat: {
          completions: {
            create: sinon.stub().resolves({
              choices: [
                {
                  message: {
                    content: JSON.stringify(sampleBacklog)
                  }
                }
              ]
            })
          }
        }
      };
    });
    
    test('Génère correctement un backlog à partir d\'une description de projet', async () => {
      const projectDescription = 'Création d\'un système de gestion de bibliothèque';
      
      // Appeler la fonction generateBacklog avec notre mock
      const result = await generateBacklog(projectDescription, mockClient);
      
      // Vérifier que la fonction a été appelée avec les bons paramètres
      expect(mockClient.chat.completions.create.calledOnce).toBe(true);
      
      // Vérifier que le résultat est bien structuré
      expect(result).toHaveProperty('epic');
      expect(result).toHaveProperty('mvp');
      expect(result).toHaveProperty('iterations');
      
      // Vérifier les détails du backlog
      expect(result.epic.title).toBe(sampleBacklog.epic.title);
      expect(result.mvp.length).toBe(sampleBacklog.mvp.length);
      expect(result.iterations.length).toBe(sampleBacklog.iterations.length);
    });
    
    test('Gère correctement les erreurs de l\'API', async () => {
      // Configurer le mock pour simuler une erreur
      mockClient.chat.completions.create.rejects(new Error('API Error'));
      
      const projectDescription = 'Création d\'un système de gestion de bibliothèque';
      
      // Vérifier que l'erreur est propagée
      await expect(generateBacklog(projectDescription, mockClient)).rejects.toThrow('API Error');
    });
  });
});
