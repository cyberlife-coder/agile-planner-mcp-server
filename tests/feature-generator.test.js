/**
 * Tests unitaires pour le générateur de features
 */

const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const { generateFeature, saveRawFeatureResult } = require('../server/lib/feature-generator');
const { generateFeatureMarkdown } = require('../server/lib/markdown-generator');

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
          description: "Créer la page de profil utilisateur",
          estimate: "3"
        },
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

  // Créer un sandbox Sinon pour isoler les stubs
  this.sandbox = sinon.createSandbox();

  // Stub les méthodes de fs-extra
  this.sandbox.stub(fs, 'ensureDir').resolves();
  this.sandbox.stub(fs, 'writeFile').resolves();
  this.sandbox.stub(fs, 'pathExists').resolves(false);
  this.sandbox.stub(fs, 'readFile').resolves('{}');
});

afterEach(() => {
  // Restaurer tous les stubs
  this.sandbox.restore();
});

describe('Feature Generator', () => {
  describe('generateFeature', () => {
    test('Génère correctement une feature avec le nombre demandé de user stories', async () => {
      // Configuration
      const featureParams = {
        featureDescription: "Système d'authentification utilisateur",
        storyCount: 3,
        businessValue: "Valeur métier importante"
      };

      // Simuler la réponse de l'API OpenAI
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(validFeatureResponse)
            }
          }
        ]
      });

      // Exécution
      const result = await generateFeature(featureParams, mockOpenAIClient, 'openai');

      // Vérifications
      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result.feature.title).toBe(validFeatureResponse.feature.title);
      expect(result.userStories.length).toBe(3); // Le nombre demandé
      expect(result.userStories[0].title).toBe("Création de compte utilisateur");
      expect(result.userStories[0].tasks.length).toBeGreaterThanOrEqual(3); // Au moins 3 tâches
    });

    test('Utilise le fournisseur Groq si spécifié', async () => {
      // Configuration
      const featureParams = {
        featureDescription: "Système d'authentification utilisateur",
        storyCount: 3
      };

      // Simuler la réponse de l'API Groq
      mockGroqClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(validFeatureResponse)
            }
          }
        ]
      });

      // Exécution
      const result = await generateFeature(featureParams, mockGroqClient, 'groq');

      // Vérifications
      expect(mockGroqClient.chat.completions.create).toHaveBeenCalledTimes(1);
      expect(result.feature.title).toBe(validFeatureResponse.feature.title);
      
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

      // Simuler une réponse JSON invalide
      mockOpenAIClient.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '{ "feature": { "title": "Test" } }' // Manque userStories, donc invalide
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
        userStories: [
          { title: "US1" },
          { title: "US2" }
        ]
      };

      // Simuler un backlog existant
      fs.pathExists.restore();
      this.sandbox.stub(fs, 'pathExists').resolves(true);
      
      fs.readFile.restore();
      this.sandbox.stub(fs, 'readFile').resolves(JSON.stringify({
        features: [
          { title: "Feature existante" }
        ]
      }));

      // Exécution
      await saveRawFeatureResult(result, './output');

      // Vérifications
      expect(fs.writeFile.calledOnce).toBe(true);
      
      // Vérifier que le contenu écrit contient la nouvelle feature et la feature existante
      const writeCall = fs.writeFile.getCall(0);
      const content = JSON.parse(writeCall.args[1]);
      
      expect(content.features.length).toBe(2);
      expect(content.features[0].title).toBe("Feature existante");
      expect(content.features[1].title).toBe("Nouvelle feature");
    });

    test('Crée un nouveau backlog si aucun n\'existe', async () => {
      // Configuration
      const result = {
        feature: {
          title: "Première feature",
          description: "Description"
        },
        userStories: [
          { title: "US1" }
        ]
      };

      // Exécution
      await saveRawFeatureResult(result, './output');

      // Vérifications
      expect(fs.writeFile.calledOnce).toBe(true);
      
      // Vérifier que le contenu écrit contient la nouvelle feature
      const writeCall = fs.writeFile.getCall(0);
      const content = JSON.parse(writeCall.args[1]);
      
      expect(content.features.length).toBe(1);
      expect(content.features[0].title).toBe("Première feature");
    });
  });

  describe('generateFeatureMarkdown', () => {
    test('Génère correctement les fichiers markdown pour la feature et ses user stories', async () => {
      // On utilise le mock de fs déjà configuré
      
      // Exécution
      await generateFeatureMarkdown(validFeatureResponse, './output');

      // Vérifications
      // Doit créer les répertoires nécessaires
      expect(fs.ensureDir.callCount).toBeGreaterThanOrEqual(4); // Au moins 4 ensureDir (features, featureDir, userStories, userStoriesFeatureDir)
      
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
  });
});
