/**
 * Tests unitaires pour le générateur de features
 */

const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const { generateFeature, saveRawFeatureResult } = require('../../../server/lib/feature-generator');
const { generateFeatureMarkdown } = require('../../../server/lib/markdown-generator');

// Mock OpenAI client
const mockOpenAIClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

// Mock Groq client
const mockGroqClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  },
  baseURL: "https://api.groq.com/openai/v1"
};

// Sample valid feature response from OpenAI
const validFeatureResponse = {
  feature: {
    title: "Système d'authentification utilisateur",
    description: "Mettre en place un système sécurisé d'authentification utilisateur avec enregistrement, connexion, et gestion des profils.",
    businessValue: "Permettre aux utilisateurs de créer des comptes et d'accéder à des fonctionnalités personnalisées."
  },
  epicParentName: "Gestion des utilisateurs",
  userStories: [
    {
      title: "Création de compte utilisateur",
      asA: "En tant que visiteur du site",
      iWant: "Je veux pouvoir créer un compte",
      soThat: "Afin d'accéder aux fonctionnalités réservées aux utilisateurs enregistrés",
      acceptanceCriteria: [
        {
          given: "Étant donné que je suis sur la page d'inscription",
          when: "Quand je remplis tous les champs requis et soumets le formulaire",
          then: "Alors un compte est créé et je suis connecté automatiquement"
        },
        {
          given: "Étant donné que je suis sur la page d'inscription",
          when: "Quand je soumets le formulaire avec un email déjà utilisé",
          then: "Alors je reçois un message d'erreur approprié"
        }
      ],
      tasks: [
        {
          description: "Créer la page d'inscription avec formulaire",
          estimate: "3"
        },
        {
          description: "Implémenter la validation des champs côté client",
          estimate: "2"
        },
        {
          description: "Créer l'API d'enregistrement côté serveur",
          estimate: "3"
        }
      ]
    },
    {
      title: "Connexion utilisateur",
      asA: "En tant qu'utilisateur enregistré",
      iWant: "Je veux pouvoir me connecter à mon compte",
      soThat: "Afin d'accéder à mes informations personnelles et fonctionnalités",
      acceptanceCriteria: [
        {
          given: "Étant donné que je suis sur la page de connexion",
          when: "Quand je saisis mes identifiants corrects",
          then: "Alors je suis connecté et redirigé vers mon tableau de bord"
        },
        {
          given: "Étant donné que je suis sur la page de connexion",
          when: "Quand je saisis des identifiants incorrects",
          then: "Alors je reçois un message d'erreur approprié"
        }
      ],
      tasks: [
        {
          description: "Créer la page de connexion avec formulaire",
          estimate: "2"
        },
        {
          description: "Implémenter la logique d'authentification",
          estimate: "3"
        },
        {
          description: "Ajouter le système de session",
          estimate: "2"
        }
      ]
    },
    {
      title: "Gestion de profil utilisateur",
      asA: "En tant qu'utilisateur connecté",
      iWant: "Je veux pouvoir modifier mon profil",
      soThat: "Afin de mettre à jour mes informations personnelles",
      acceptanceCriteria: [
        {
          given: "Étant donné que je suis sur la page de mon profil",
          when: "Quand je modifie mes informations et sauvegarde",
          then: "Alors mes informations sont mises à jour dans le système"
        },
        {
          given: "Étant donné que je suis sur la page de mon profil",
          when: "Quand je tente de changer mon mot de passe",
          then: "Alors je dois fournir mon mot de passe actuel pour validation"
        }
      ],
      tasks: [
        {
          description: "Implémenter le formulaire d'édition de profil",
          estimate: "2"
        },
        {
          description: "Ajouter la logique de mise à jour en base de données",
          estimate: "3"
        }
      ]
    }
  ]
};

// Configuration pour les tests
beforeEach(() => {
  jest.clearAllMocks();
  // Réinitialiser les mocks
  mockOpenAIClient.chat.completions.create.mockReset();
  mockGroqClient.chat.completions.create.mockReset();

  // Configurer les mocks OpenAI pour retourner la réponse valide
  mockOpenAIClient.chat.completions.create.mockResolvedValue({
    choices: [{ message: { content: JSON.stringify(validFeatureResponse) } }]
  });
  
  // Sandbox pour fs-extra
  this.sandbox = sinon.createSandbox();
  this.sandbox.stub(fs, 'ensureDir').resolves();
  this.sandbox.stub(fs, 'writeFile').resolves();
  this.sandbox.stub(fs, 'pathExists').resolves(false);
  this.sandbox.stub(fs, 'readFile').resolves('{}');
});

afterEach(() => {
  // Restaurer tous les stubs
  this.sandbox.restore();
});


// Mock pour fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().resolves(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().resolves(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().resolves('{}'),
  readFileSync: jest.fn().returns('{}'),
  pathExists: jest.fn().resolves(true),
  pathExistsSync: jest.fn().returns(true)
}));


// Mock pour path
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/'))
  };
});

describe('Feature Generator', () => {
  describe('generateFeature', () => {
    test('Génère correctement une feature avec le nombre demandé de user stories', async () => {
      // Configuration
      const featureParams = {
        featureDescription: "Système d'authentification utilisateur",
        storyCount: 3,
        epicParentName: "Gestion des utilisateurs"
      };
      
      // Exécution
      const result = await generateFeature(featureParams, mockOpenAIClient, 'openai');
      
      // Vérifications
      expect(result).toBeDefined();
      expect(result.feature).toBeDefined();
      expect(result.feature.title).toBeDefined();
      expect(result.feature.description).toBeDefined();
      expect(result.epicParentName).toBe("Gestion des utilisateurs");
      
      // Vérifier le nombre de user stories
      expect(result.userStories).toBeDefined();
      expect(result.userStories.length).toBe(3);
      expect(result.userStories[0].title).toBe("Création de compte utilisateur");
      expect(result.userStories[0].tasks.length).toBeGreaterThanOrEqual(3); // Au moins 3 tâches
    });

    test('Utilise le fournisseur Groq si spécifié', async () => {
      // Configuration
      const featureParams = {
        featureDescription: "Système d'authentification utilisateur",
        storyCount: 3
      };

      // Configurer le mock Groq
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(validFeatureResponse) } }]
      });
      
      // Exécution
      await generateFeature(featureParams, mockGroqClient, 'groq');
      
      // Vérifier que Groq a été appelé
      expect(mockGroqClient.chat.completions.create).toHaveBeenCalled();
      
      // Vérifier que le model parameter est bien passé
      const groqArgs = mockGroqClient.chat.completions.create.mock.calls[0][0];
      expect(groqArgs).toHaveProperty('model');
    });

    test('Génère une erreur avec une réponse JSON invalide', async () => {
      // Configuration
      const featureParams = {
        featureDescription: "Description invalide",
        storyCount: 3
      };

      // Simuler une réponse invalide
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{ "feature": { "title": "Invalid" } }'
            }
          }
        ]
      });

      // Exécution et vérification
      await expect(generateFeature(featureParams, mockOpenAIClient, 'openai'))
        .rejects.toThrow();
    });
  });

  describe('saveRawFeatureResult', () => {
    test('Sauvegarde correctement le résultat brut et fusionne avec un backlog existant', async () => {
      // Configuration
      const result = {
        feature: {
          title: "Nouvelle feature",
          description: "Description"
        },
        epicParentName: "Mon Epic Parent",
        userStories: [
          { title: "US1", asA: "En tant que", iWant: "Je veux", soThat: "Afin de", acceptanceCriteria: [], tasks: [] }
        ]
      };
      
      // Simuler un backlog existant
      fs.pathExists.resolves(true);
      fs.readFile.resolves(JSON.stringify({
        epics: [
          {
            name: "Mon Epic Parent",
            description: "Description epic",
            slug: "mon-epic",
            features: [
              {
                title: "Feature existante",
                description: "Description",
                slug: "feature-existante",
                userStories: []
              }
            ]
          }
        ]
      }));
      
      // Exécution
      await saveRawFeatureResult(result, './output');
      
      // Vérifications
      expect(fs.writeFile.calledOnce).toBe(true);
      
      // Vérifier que le contenu écrit contient les bonnes données
      const writeCall = fs.writeFile.getCall(0);
      const content = JSON.parse(writeCall.args[1]);
      
      expect(content.epics.length).toBe(1);
      expect(content.epics[0].features.length).toBe(2);
      expect(content.epics[0].features[0].title).toBe("Feature existante");
      expect(content.epics[0].features[1].title).toBe("Nouvelle feature");
    });

    test('Crée un nouvel epic et une nouvelle feature si aucun n\'existe', async () => {
      // Configuration
      const result = {
        feature: {
          title: "Première feature",
          description: "Description"
        },
        epicParentName: "Premier Epic Parent",
        userStories: [
          { 
            title: "US1", 
            asA: "En tant que", 
            iWant: "Je veux", 
            soThat: "Afin de", 
            acceptanceCriteria: [
              { given: "Given", when: "When", then: "Then" }
            ], 
            tasks: [
              { description: "Task", estimate: "1" }
            ] 
          }
        ]
      };

      // Exécution
      await saveRawFeatureResult(result, './output');

      // Vérifications
      expect(fs.writeFile.calledOnce).toBe(true);
      
      // Vérifier que le contenu écrit contient la nouvelle feature
      const writeCall = fs.writeFile.getCall(0);
      const content = JSON.parse(writeCall.args[1]);
      
      expect(content.epics.length).toBe(1);
      expect(content.epics[0].name).toBe("Premier Epic Parent");
      expect(content.epics[0].features.length).toBe(1);
      expect(content.epics[0].features[0].title).toBe("Première feature");
    });
  });

  describe('generateFeatureMarkdown', () => {
    beforeEach(() => {
      // Réinitialiser les appels spécifiques à ces tests
      fs.ensureDir.resetHistory();
      fs.writeFile.resetHistory();
    });

    test('Génère correctement les fichiers markdown pour la feature et ses user stories', async () => {
      // On utilise le mock de fs déjà configuré
      
      // Créer un epic parent pour le test
      const testFeatureResponse = {
        ...validFeatureResponse,
        epicParentName: "Authentication Epic Parent"
      };

      // Exécution
      await generateFeatureMarkdown(testFeatureResponse, './output');

      // Vérifications
      // Doit créer les répertoires nécessaires
      expect(fs.ensureDir.callCount).toBeGreaterThanOrEqual(3); // Au moins 3 ensureDir (epics, features, user-stories)
      
      // Doit écrire au moins 4 fichiers (1 feature.md + 3 user-stories)
      expect(fs.writeFile.callCount).toBeGreaterThanOrEqual(4);
      
      // Vérifier que la feature a été écrite
      const featureWriteCall = fs.writeFile.getCalls().find(call => 
        call.args[0].includes('feature.md')
      );
      expect(featureWriteCall).toBeTruthy();
      
      // Vérifier que les user stories ont été écrites
      const storyWriteCall = fs.writeFile.getCalls().find(call => 
        call.args[0].includes('user-stories')
      );
      expect(storyWriteCall).toBeTruthy();
    });

    test('Structure les répertoires selon la nouvelle hiérarchie epic > feature > user-story', async () => {
      // Créer un epic parent pour le test
      const testFeatureResponse = {
        ...validFeatureResponse,
        epicParentName: "Authentication Epic Parent"
      };

      // Importer la fonction createSlug comme le fait notre implémentation
      const { createSlug } = require('../../../server/lib/utils');

      // Exécution
      await generateFeatureMarkdown(testFeatureResponse, './output');

      // Récupérer les slugs pour les chemins en utilisant createSlug comme dans l'implémentation
      const epicSlug = createSlug(testFeatureResponse.epicParentName);
      const featureSlug = createSlug(testFeatureResponse.feature.title);

      // Vérifier la structure de répertoires
      const basePath = path.join('./output', '.agile-planner-backlog');
      const epicsDir = path.join(basePath, 'epics');
      const epicDir = path.join(epicsDir, epicSlug);
      const featuresDir = path.join(epicDir, 'features');
      const featureDir = path.join(featuresDir, featureSlug);
      const userStoriesDir = path.join(featureDir, 'user-stories');
      
      // Vérifier que tous les répertoires nécessaires sont créés
      expect(fs.ensureDir.calledWith(sinon.match(basePath))).toBe(true);
      expect(fs.ensureDir.calledWith(sinon.match(epicsDir))).toBe(true);
      expect(fs.ensureDir.calledWith(sinon.match(epicDir))).toBe(true);
      expect(fs.ensureDir.calledWith(sinon.match(featuresDir))).toBe(true);
      expect(fs.ensureDir.calledWith(sinon.match(featureDir))).toBe(true);
      expect(fs.ensureDir.calledWith(sinon.match(userStoriesDir))).toBe(true);

      // Vérifier que les user stories sont écrites dans le bon répertoire
      const storyWriteCalls = fs.writeFile.getCalls().filter(call => 
        call.args[0].includes(path.join('user-stories'))
      );
      
      // Il devrait y avoir autant d'appels d'écriture que de user stories
      expect(storyWriteCalls.length).toBe(validFeatureResponse.userStories.length);

      // Vérifier que le contenu du fichier feature.md contient une référence à l'epic parent
      const featureWriteCall = fs.writeFile.getCalls().find(call => 
        call.args[0].includes('feature.md')
      );
      
      if (featureWriteCall) {
        const content = featureWriteCall.args[1];
        // Vérifier la référence à l'epic parent
        expect(content).toContain('Parent Epic');
        // Vérifier les liens vers les user stories
        validFeatureResponse.userStories.forEach(story => {
          const storyTitle = story.title;
          expect(content).toContain(storyTitle);
        });
      }
    });
  });
});
