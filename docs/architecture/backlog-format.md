# Format de Backlog Agile Planner

**Date de dernière modification:** 12/05/2025  
**Version:** 1.7.1

## Vue d'ensemble

Ce document décrit les formats de backlog pris en charge par Agile Planner MCP Server. Le système a été optimisé pour fonctionner avec le protocole MCP (Model Context Protocol) tout en maintenant la compatibilité avec les anciens formats.

## Formats supportés

### Format MCP (recommandé)

Ce format est utilisé pour toutes les communications MCP et est le format recommandé pour les nouvelles intégrations. Il utilise une structure avec `epics` au pluriel (array), ce qui offre une meilleure extensibilité et correspond aux meilleures pratiques Agile actuelles.

```json
{
  "projectName": "Projet Example",
  "description": "Description du projet",
  "epics": [
    {
      "id": "EPIC-001",
      "title": "Epic Test",
      "description": "Description détaillée de l'epic",
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
  ]
}
```

### Exemple de sortie pour generateFeature
Lorsqu'une feature seule est générée, la structure est la suivante :

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Feature générée avec succès",
    "outputPath": "./.agile-planner-backlog/features/feature-generee",
    "feature": {
      "id": "FEAT-002",
      "title": "Feature générée",
      "description": "Description de la feature générée",
      "slug": "feature-generee",
      "stories": [
        {
          "id": "US-010",
          "title": "Nouvelle user story",
          "description": "Description de la story",
          "acceptance_criteria": ["Critère 1"],
          "technical_tasks": ["Tâche 1"],
          "priority": "MEDIUM",
          "slug": "nouvelle-user-story"
        }
      ]
    }
  },
  "id": 1
}
```
### Format Legacy (déprécié)

> **[BREAKING CHANGE]** Depuis la version 1.7.0, seul le format `epics` (pluriel, tableau) est officiellement supporté pour les communications MCP. Le format legacy est converti automatiquement en interne.

Ce format utilise `epics` au singulier (objet) et est maintenu uniquement pour la compatibilité avec les anciens systèmes. Il est automatiquement converti en format moderne en interne.

```json
{
  "projectName": "Projet Example",
  "projectDescription": "Description du projet",
  "epic": {
    "id": "EPIC-001",
    "title": "Epic Test",
    "description": "Description détaillée de l'epic"
  },
  "mvp": [
    {
      "id": "US-001",
      "title": "User story du MVP",
      "description": "Description",
      "acceptance_criteria": ["Critère 1", "Critère 2"],
      "technical_tasks": ["Tâche 1", "Tâche 2"],
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
          "technical_tasks": ["Tâche 1"],
          "priority": "MEDIUM"
        }
      ]
    }
  ]
}
```
## Format MCP pour les communications JSON-RPC 2.0

Pour les communications via le protocole MCP (Model Context Protocol), Agile Planner utilise le format JSON-RPC 2.0. Voici un exemple complet d'une requête et réponse pour l'outil `generateBacklog` :

### Requête MCP `generateBacklog`

```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generateBacklog",
    "arguments": {
      "projectName": "Mon Projet",
      "projectDescription": "Description détaillée du projet",
      "outputPath": "./.agile-planner-backlog/mon-projet"
    }
  },
  "id": 1
}
```

### Réponse MCP `generateBacklog`

```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Backlog généré avec succès",
    "outputPath": "./.agile-planner-backlog/mon-projet",
    "backlog": {
      "projectName": "Mon Projet",
      "projectDescription": "Description détaillée du projet",
      "epics": [
        {
          "id": "epic-001",
          "title": "Epic 1",
          "description": "Description de l'epic",
          "slug": "epic-1",
          "features": [
            {
              "id": "feature-001",
              "title": "Feature 1",
              "description": "Description de la feature",
              "slug": "feature-1",
              "stories": [
                {
                  "id": "story-001",
                  "title": "User Story 1",
                  "description": "Description de la story",
                  "slug": "user-story-1",
                  "acceptance_criteria": ["Critère 1", "Critère 2"],
                  "technical_tasks": ["Tâche 1", "Tâche 2"],
                  "priority": "HIGH"
                }
              ]
            }
          ]
        }
      ],
      "orphan_stories": []
    }
  },
  "id": 1
}
```

## Compatibilité et normalisation

Le système prend en charge automatiquement les différents formats grâce à un mécanisme de normalisation qui :

1. Détecte le format d'entrée (MCP moderne ou legacy)
2. Convertit au besoin vers le format MCP moderne
3. Valide la structure complète selon le schéma JSON approprié
4. Génère les slugs manquants pour l'organisation des fichiers

Cette approche assure une utilisation cohérente du format MCP moderne tout en évitant les régressions.

## Champs requis

Tous les backlogs doivent contenir:
- `projectName`: Nom du projet (requis)
- `projectDescription`: Description du projet (requis pour MCP, optionnel pour legacy)
- Au moins un de:
  - `epics`: Tableau d'epics (format MCP moderne)
  - `epic`: Objet epic unique (format legacy)
- `orphan_stories`: Tableau des user stories orphelines (optionnel)

## Structure des fichiers générés

Le système génère une structure de fichiers markdown suivant la RULE 3 :

```
.agile-planner-backlog/
├── backlog.json
├── epics/
│   └── [epic-slug]/
│       ├── epic.md
│       └── features/
│           └── [feature-slug]/
│               ├── feature.md
│               └── user-stories/
│                   └── [story-slug].md
└── orphan-stories/
    └── [story-slug].md
```

## Schéma de validation

Le système utilise plusieurs validateurs spécialisés basés sur le pattern Strategy :

- `BacklogValidator` - Validation globale du backlog
- `EpicValidator` - Validation des epics
- `FeatureValidator` - Validation des features
- `UserStoryValidator` - Validation des user stories

Pour plus de détails techniques sur les validateurs, consultez `server/lib/utils/validators/` dans le code source.

## Références

- [Architecture MCP](./mcp-server-architecture.md)
- [Système de génération Markdown](./markdown-generation.md)
- [Guide d'intégration MCP](../guides/mcp-integration.md)
