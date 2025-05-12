/**
 * Données d'exemple pour la création d'une structure Rule 3
 * @module example-data
 */

/**
 * Données de backlog pour l'exemple
 * @type {Object}
 */
const exampleData = {
  epics: [
    {
      id: 'user-management',
      title: 'Gestion des utilisateurs',
      description: 'Fonctionnalités de gestion des utilisateurs et authentification',
      features: [
        {
          id: 'user-authentication',
          title: 'Authentification utilisateur',
          description: "Système d'authentification sécurisé avec login/password et oauth",
          businessValue: "Sécurité et contrôle d'accès",
          stories: [
            {
              id: 'user-login',
              title: 'Connexion utilisateur',
              description: "En tant qu'utilisateur, je veux pouvoir me connecter avec mon email et mot de passe",
              acceptanceCriteria: [
                "L'utilisateur peut saisir son email et mot de passe",
                "Le système valide les informations d'identification",
                "L'utilisateur est redirigé vers son tableau de bord après connexion réussie"
              ],
              storyPoints: 3
            },
            {
              id: 'user-logout',
              title: 'Déconnexion utilisateur',
              description: "En tant qu'utilisateur, je veux pouvoir me déconnecter de l'application",
              acceptanceCriteria: [
                "Un bouton de déconnexion est visible",
                "La session est détruite après déconnexion",
                "L'utilisateur est redirigé vers la page d'accueil"
              ],
              storyPoints: 1
            }
          ]
        },
        {
          id: 'user-profile',
          title: 'Gestion de profil',
          description: "Permettre aux utilisateurs de gérer leur profil et préférences",
          businessValue: "Personnalisation de l'expérience utilisateur",
          stories: [
            {
              id: 'edit-profile',
              title: 'Éditer profil',
              description: "En tant qu'utilisateur, je veux pouvoir modifier mes informations personnelles",
              acceptanceCriteria: [
                "L'utilisateur peut modifier son nom, prénom et photo",
                "Les modifications sont sauvegardées en base de données",
                "Un message de confirmation s'affiche après sauvegarde"
              ],
              storyPoints: 5
            }
          ]
        }
      ]
    },
    {
      id: 'product-catalog',
      title: 'Catalogue de produits',
      description: 'Fonctionnalités liées à la gestion du catalogue produits',
      features: [
        {
          id: 'product-search',
          title: 'Recherche de produits',
          description: "Permettre aux utilisateurs de rechercher des produits efficacement",
          businessValue: "Accès rapide aux produits recherchés",
          stories: [
            {
              id: 'search-by-keyword',
              title: 'Recherche par mot-clé',
              description: "En tant qu'utilisateur, je veux pouvoir rechercher des produits par mot-clé",
              acceptanceCriteria: [
                "Un champ de recherche est disponible sur toutes les pages",
                "Les résultats s'affichent par pertinence",
                "La recherche fonctionne avec des mots partiels"
              ],
              storyPoints: 8
            }
          ]
        }
      ]
    }
  ],
  mvp: {
    title: 'MVP - Application de gestion',
    description: 'Version minimale avec authentification et catalogue basique',
    stories: [
      {
        epicId: 'user-management',
        featureId: 'user-authentication',
        storyId: 'user-login'
      },
      {
        epicId: 'user-management',
        featureId: 'user-authentication',
        storyId: 'user-logout'
      },
      {
        epicId: 'product-catalog',
        featureId: 'product-search',
        storyId: 'search-by-keyword'
      }
    ]
  },
  iterations: [
    {
      id: 'iteration-1',
      title: 'Itération 1 - Authentification',
      startDate: '2025-05-01',
      endDate: '2025-05-15',
      stories: [
        {
          epicId: 'user-management',
          featureId: 'user-authentication',
          storyId: 'user-login'
        },
        {
          epicId: 'user-management',
          featureId: 'user-authentication',
          storyId: 'user-logout'
        }
      ]
    },
    {
      id: 'iteration-2',
      title: 'Itération 2 - Profil utilisateur',
      startDate: '2025-05-16',
      endDate: '2025-05-30',
      stories: [
        {
          epicId: 'user-management',
          featureId: 'user-profile',
          storyId: 'edit-profile'
        }
      ]
    }
  ]
};

module.exports = { exampleData };
