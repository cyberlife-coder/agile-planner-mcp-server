# Format de Backlog Agile Planner

## Vue d'ensemble
Ce document décrit les formats de backlog pris en charge par Agile Planner MCP Server. 
Le système supporte deux formats de structure pour les epicss, assurant une compatibilité avec les systèmes existants tout en encourageant l'utilisation du format moderne.

*Dernière mise à jour: 08/05/2025*

## Formats supportés

### Format moderne (recommandé)
Ce format utilise une structure avec `epicss` au pluriel (array), qui offre une meilleure extensibilité et correspond aux meilleures pratiques Agile actuelles.

```json
{
  "projectName": "Projet Example",
  "description": "Description du projet",
  "epicss": [
    {
      "id": "EPIC-001",
      "title": "Epic Test",
      "description": "Description détaillée de l'epics",
      "features": [
        {
          "id": "FEAT-001",
          "title": "Feature 1",
          "description": "Description de la feature",
          "userStories": [
            {
              "id": "US-001",
              "title": "Story title",
              "description": "Story description",
              "acceptance_criteria": ["Critère 1", "Critère 2"],
              "tasks": ["Tâche 1", "Tâche 2"],
              "priority": "HIGH"
            }
          ]
        }
      ]
    }
  ],
  "mvp": [
    {
      "id": "US-001",
      "title": "User story du MVP",
      "description": "Description",
      "acceptance_criteria": ["Critère 1", "Critère 2"],
      "tasks": ["Tâche 1", "Tâche 2"],
      "priority": "HIGH"
    }
  ],
  "iterations": [
    {
      "id": "ITER-001",
      "name": "Iteration 1",
      "goal": "Objectif de l'itération",
      "stories": [
        {
          "id": "US-002",
          "title": "Story de l'itération",
          "description": "Description",
          "acceptance_criteria": ["Critère 1"],
          "tasks": ["Tâche 1"],
          "priority": "MEDIUM"
        }
      ]
    }
  ]
}
```

### **[BREAKING CHANGE]** Depuis la version 2.x, seul le format `epics` (pluriel, tableau) est accepté. Le support du format legacy `epic` (singulier, objet) est supprimé. (rétrocompatibilité)
Ce format utilise `epics` au singulier (objet), pour maintenir la compatibilité avec les systèmes existants. Il est automatiquement converti en format moderne en interne.

```json
{
  "projectName": "Projet Example",
  "description": "Description du projet",
  "epics": {
    "id": "EPIC-001",
    "title": "Epic Test",
    "description": "Description détaillée de l'epics"
  },
  "mvp": [
    {
      "id": "US-001",
      "title": "User story du MVP",
      "description": "Description",
      "acceptance_criteria": ["Critère 1", "Critère 2"],
      "tasks": ["Tâche 1", "Tâche 2"],
      "priority": "HIGH"
    }
  ],
  "iterations": [
    {
      "id": "ITER-001",
      "name": "Iteration 1",
      "goal": "Objectif de l'itération",
      "stories": [
        {
          "id": "US-002",
          "title": "Story de l'itération",
          "description": "Description",
          "acceptance_criteria": ["Critère 1"],
          "tasks": ["Tâche 1"],
          "priority": "MEDIUM"
        }
      ]
    }
  ]
}

## Compatibilité et normalisation

Le système prend en charge automatiquement le format moderne grâce à un mécanisme de normalisation qui:

1. Valide la structure complète selon les règles du format moderne

Cette approche assure une utilisation cohérente du format moderne tout en évitant les régressions.

## Champs requis

Tous les backlogs doivent contenir:
- `projectName`: Nom du projet (requis)
- `description`: Description du projet (optionnel)
- Au moins un de:
  - `epicss`: Tableau d'epicss (format moderne)
  - `epics`: Objet epics unique (format legacy)
- `mvp`: Tableau des user stories du MVP (optionnel)
- `iterations`: Tableau des itérations (optionnel)

## Schéma de validation

Le système utilise un schéma de validation JSON avec une logique `anyOf` qui permet l'utilisation de l'un ou l'autre format. Pour plus de détails techniques, consultez le validateur `BacklogValidator` dans le code source.
