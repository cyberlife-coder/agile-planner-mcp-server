# Documentation API – Agile Planner MCP Server

## Description générale

Ce serveur MCP (Model Context Protocol) expose des endpoints pour la génération de backlog et de features agiles, utilisables à la fois par des clients humains (Swagger UI, HTTP) et par des assistants IA (mode stdio, Claude, Cursor, etc.).

- **Mode HTTP/Swagger** : Documentation interactive sur `/api-docs` (Swagger UI)
- **Mode stdio/MCP/LLM** : Le serveur accepte des requêtes structurées (JSON) via stdin/stdout, permettant l'intégration directe avec des assistants IA ou des orchestrateurs LLM, sans interface web.

## Endpoints principaux (OpenAPI)
- `POST /mcp/generateBacklog` : Génère un backlog complet à partir d'une description projet
- `POST /mcp/generateFeature` : Génère une feature spécifique à partir d'une description

La structure détaillée des entrées/sorties est décrite dans `openapi/openapi.yaml`.

## Utilisation

### 1. Documentation interactive (Swagger UI)
- Lancer : `node server/app.js`
- Accéder à : [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 2. Utilisation en mode MCP/LLM (stdio)
- Le serveur peut être interrogé par un client LLM (Claude, Cursor, Cascade, etc.) en envoyant des requêtes JSON sur stdin et en lisant les réponses sur stdout.
- Exemple de requête :
  ```json
  {
    "function": "generateBacklog",
    "projectDescription": "Application de gestion de tâches pour équipes agiles"
  }
  ```
- Exemple de réponse :
  ```json
  {
    "backlog": { ... },
    "status": "success"
  }
  ```

## Bonnes pratiques
- Toute évolution des endpoints doit être répercutée dans `openapi/openapi.yaml`.
- Utiliser `/api-docs` pour explorer et tester l'API.
- Pour l'intégration LLM, respecter la structure JSON attendue (voir exemples ci-dessus).

- Description détaillée
- Paramètres d'entrée avec validation
- Format de réponse
- Codes d'état et gestion des erreurs
- Exemples d'utilisation
- Versions prises en charge

## Préparation de la Documentation

La documentation API sera générée automatiquement par le processus de CI conformément à la RULE 9 et vérifiée à chaque modification d'API.
