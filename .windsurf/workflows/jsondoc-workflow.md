# Workflow de Documentation API avec JSONDoc - Agile Planner

## Description
Ce workflow guide le développeur dans la création et la maintenance d'une documentation API complète et interactive en utilisant JSONDoc pour le projet Agile Planner. JSONDoc permet de générer une documentation claire et un playground interactif pour tester les endpoints de l'API. Ce workflow assure que la documentation API reste à jour, cohérente et facilement utilisable par les développeurs internes et externes.

## Utilisation dans Wave 8
Dans Wave 8, ce workflow peut être déclenché manuellement lors de la création ou modification d'endpoints API, ou automatiquement lorsque des changements sont détectés dans les fichiers de contrôleurs ou de routes. Windsurf vous guidera à travers les bonnes pratiques et vous aidera à maintenir une documentation API de qualité.

## Déclencheur
- Lors de la création d'un nouvel endpoint API
- Lors de la modification d'un endpoint existant
- Lors de la mise à jour des modèles de données
- Avant une release

## Étapes

### 1. Configuration de JSONDoc
1. **Installer JSONDoc dans le projet**
   ```bash
   npm install jsondoc --save-dev
   ```

2. **Configurer JSONDoc dans le projet**
   - Créer un fichier de configuration `jsondoc.json` à la racine du projet
   ```json
   {
     "info": {
       "title": "Agile Planner API",
       "version": "1.2.1",
       "description": "API pour la gestion de backlogs agiles",
       "contact": {
         "name": "Équipe Agile Planner",
         "email": "contact@agile-planner.com"
       }
     },
     "host": "localhost:3000",
     "basePath": "/api",
     "schemes": ["http", "https"],
     "consumes": ["application/json"],
     "produces": ["application/json"],
     "outputPath": "./docs/api"
   }
   ```

### 2. Documentation des contrôleurs et endpoints
1. **Ajouter des annotations JSONDoc aux contrôleurs**
   ```javascript
   /**
    * @jsondoc
    * @api {get} /backlog/:id Get Backlog
    * @apiName GetBacklog
    * @apiGroup Backlog
    * @apiVersion 1.2.1
    * @apiDescription Récupère un backlog par son ID
    *
    * @apiParam {String} id ID unique du backlog
    *
    * @apiSuccess {Object} backlog Objet backlog complet
    * @apiSuccess {String} backlog.id ID du backlog
    * @apiSuccess {String} backlog.name Nom du backlog
    * @apiSuccess {Array} backlog.epics Liste des epics
    *
    * @apiError {Object} error Objet d'erreur
    * @apiError {String} error.message Message d'erreur
    * @apiError {Number} error.code Code d'erreur
    *
    * @apiExample {curl} Exemple:
    *     curl -i http://localhost:3000/api/backlog/123
    *
    * @apiSuccessExample {json} Succès:
    *     HTTP/1.1 200 OK
    *     {
    *       "id": "123",
    *       "name": "Projet X",
    *       "epics": [...]
    *     }
    *
    * @apiErrorExample {json} Erreur:
    *     HTTP/1.1 404 Not Found
    *     {
    *       "error": {
    *         "message": "Backlog non trouvé",
    *         "code": 404
    *       }
    *     }
    */
   function getBacklog(req, res) {
     // Implémentation
   }
   ```

2. **Documenter les modèles de données**
   ```javascript
   /**
    * @jsondoc
    * @apiDefine BacklogModel
    * @apiVersion 1.2.1
    *
    * @apiSuccess {String} id ID unique du backlog
    * @apiSuccess {String} name Nom du backlog
    * @apiSuccess {String} description Description du backlog
    * @apiSuccess {Array} epics Liste des epics
    * @apiSuccess {Date} createdAt Date de création
    * @apiSuccess {Date} updatedAt Date de dernière mise à jour
    */
   ```

### 3. Génération de la documentation
1. **Ajouter un script dans package.json**
   ```json
   "scripts": {
     "docs": "jsondoc generate"
   }
   ```

2. **Générer la documentation**
   ```bash
   npm run docs
   ```

3. **Vérifier la documentation générée**
   - Ouvrir `./docs/api/index.html` dans un navigateur

### 4. Intégration avec le serveur de développement
1. **Ajouter le middleware JSONDoc au serveur**
   ```javascript
   const express = require('express');
   const jsondoc = require('jsondoc/middleware');
   const app = express();

   // Middleware JSONDoc pour la documentation interactive
   if (process.env.NODE_ENV === 'development') {
     app.use('/api-docs', jsondoc.serve);
     app.get('/api-docs', jsondoc.setup('Agile Planner API', '1.2.1'));
   }
   ```

2. **Lancer le serveur et accéder à la documentation**
   ```bash
   npm start
   ```
   - Accéder à `http://localhost:3000/api-docs` dans un navigateur

### 5. Maintenance de la documentation
1. **Mettre à jour la documentation lors des changements d'API**
   - Mettre à jour les annotations dans le code
   - Régénérer la documentation

2. **Vérifier la cohérence de la documentation**
   - S'assurer que tous les endpoints sont documentés
   - Vérifier que les exemples sont à jour
   - Tester les endpoints via le playground

## Bonnes pratiques

### Structure et organisation
- Organiser les endpoints par groupes logiques (Backlog, Epic, Feature, UserStory, etc.)
- Utiliser des préfixes cohérents pour les noms d'API (getBacklog, createBacklog, updateBacklog, etc.)
- Documenter tous les paramètres, codes de retour et structures de données

### Contenu de la documentation
- Fournir des descriptions claires et concises pour chaque endpoint
- Inclure des exemples de requêtes et de réponses
- Documenter les erreurs possibles et leurs codes
- Spécifier les versions de l'API pour chaque endpoint

### Exemples
- Fournir des exemples réalistes et fonctionnels
- Inclure des exemples pour les cas de succès et d'erreur
- Utiliser des données cohérentes entre les différents exemples

### Versionnement
- Inclure la version de l'API dans chaque annotation
- Documenter les changements entre versions
- Maintenir la documentation pour les versions précédentes si nécessaire

## Validation
- Tous les endpoints sont documentés
- La documentation est générée sans erreur
- Le playground fonctionne correctement
- Les exemples sont à jour et fonctionnels

## Outils MCP à utiliser
- `sequential-thinking` pour planifier la structure de la documentation API
- `context7` pour vérifier les meilleures pratiques de documentation API
- `brave-search` pour :
  - Explorer les dernières fonctionnalités de JSONDoc
  - Rechercher des exemples de documentation API similaires
  - Identifier les patterns de documentation les plus efficaces pour les APIs RESTful
