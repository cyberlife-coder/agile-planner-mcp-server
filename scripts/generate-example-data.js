/**
 * Données d'exemple pour la génération de structure Rule 3
 * @module generate-example-data
 */

// Configuration
const DEFAULT_PROJECT_NAME = 'RULE3 Demo Project';
const DEFAULT_PROJECT_DESCRIPTION = 'Projet de démonstration pour valider la conformité à la RULE 3 - Structure hiérarchique Epics > Features > User Stories';

/**
 * Crée un exemple de backlog statique
 * @returns {Object} Données de backlog
 */
function createExampleBacklog() {
  return {
    project: {
      title: DEFAULT_PROJECT_NAME,
      description: DEFAULT_PROJECT_DESCRIPTION
    },
    epics: [
      {
        id: 'user-management',
        title: 'Gestion des utilisateurs',
        description: 'Fonctionnalités de gestion des utilisateurs et authentification',
        features: [
          {
            id: 'user-authentication',
            title: 'Authentification utilisateur',
            description: 'Système d\'authentification sécurisé avec login/password et oauth',
            businessValue: 'Sécurité et contrôle d\'accès',
            stories: [
              {
                id: 'user-login',
                title: 'Connexion utilisateur',
                description: 'En tant qu\'utilisateur, je veux pouvoir me connecter avec mon email et mot de passe',
                acceptanceCriteria: [
                  'Formulaire de connexion avec validation',
                  'Gestion des erreurs d\'authentification',
                  'Protection contre les attaques par force brute'
                ],
                tasks: [
                  { description: 'Créer le composant de formulaire', estimate: 2 },
                  { description: 'Implémenter le service d\'authentification', estimate: 3 },
                  { description: 'Développer la validation côté client', estimate: 2 }
                ],
                status: 'A faire',
                priority: 'Haute'
              },
              {
                id: 'user-logout',
                title: 'Déconnexion utilisateur',
                description: 'En tant qu\'utilisateur, je veux pouvoir me déconnecter de façon sécurisée',
                acceptanceCriteria: [
                  'Bouton de déconnexion accessible depuis le menu principal',
                  'Suppression du jeton d\'authentification',
                  'Redirection vers la page d\'accueil après déconnexion'
                ],
                tasks: [
                  { description: 'Implémenter le service de déconnexion', estimate: 1 },
                  { description: 'Nettoyer le stockage local', estimate: 1 }
                ],
                status: 'A faire',
                priority: 'Moyenne'
              }
            ]
          }
        ]
      },
      {
        id: 'task-management',
        title: 'Gestion des tâches',
        description: 'Fonctionnalités de gestion des tâches et listes',
        features: [
          {
            id: 'task-filtering',
            title: 'Filtrage des tâches',
            description: 'Filtrage avancé des tâches par statut, priorité, date et assignation',
            businessValue: 'Productivité et gestion efficace',
            stories: [
              {
                id: 'filter-by-priority',
                title: 'Filtrer par priorité',
                description: 'En tant qu\'utilisateur, je veux filtrer mes tâches par niveau de priorité',
                acceptanceCriteria: [
                  'Interface permet de sélectionner une priorité (haute, moyenne, basse)',
                  'Liste mise à jour instantanément',
                  'Possibilité de réinitialiser le filtre'
                ],
                tasks: [
                  { description: 'Créer le composant de filtrage UI', estimate: 2 },
                  { description: 'Implémenter la logique de filtrage', estimate: 3 }
                ],
                status: 'A faire',
                priority: 'Haute'
              }
            ]
          }
        ]
      }
    ],
    iterations: [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        startDate: '2025-05-15',
        endDate: '2025-05-29',
        stories: [
          { id: 'user-login', title: 'Connexion utilisateur' },
          { id: 'user-logout', title: 'Déconnexion utilisateur' }
        ]
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        startDate: '2025-05-30',
        endDate: '2025-06-13',
        stories: [
          { id: 'filter-by-priority', title: 'Filtrer par priorité' }
        ]
      }
    ]
  };
}

/**
 * Crée un exemple de feature statique
 * @returns {Object} Données de feature
 */
function createExampleFeature() {
  return {
    project: {
      title: 'Feature Example',
      description: 'Exemple de feature pour démonstration'
    },
    features: [
      {
        id: 'example-feature',
        title: 'Feature de test',
        description: 'Une feature servant d\'exemple pour la génération de structure',
        businessValue: 'Valeur de démonstration',
        epicId: 'test-epic',
        epicTitle: 'Epic de test',
        stories: [
          {
            id: 'example-story',
            title: 'User story de test',
            description: 'En tant que développeur, je veux générer une user story de test',
            acceptanceCriteria: [
              'La user story est générée correctement',
              'Le format markdown est conforme aux attentes'
            ],
            status: 'A faire',
            priority: 'Haute'
          }
        ]
      }
    ]
  };
}

module.exports = {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PROJECT_DESCRIPTION,
  createExampleBacklog,
  createExampleFeature
};
