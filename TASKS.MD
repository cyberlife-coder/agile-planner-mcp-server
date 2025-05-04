# Liste des tâches - Projet MCP Agile Server

## Initialisation
- [x] Créer le projet Node.js (`npm init`)
- [x] Créer la structure de dossiers `server/`, `mvp/`, `iterations/`
- [x] Ajouter les dépendances nécessaires (`dotenv`, `zod`, `openai`, etc.)

## Développement du serveur
- [x] Créer `index.js` pour lancer le serveur MCP
- [x] Charger la clé API via `.env`
- [x] Implémenter la commande `generateBacklog`
- [x] Générer les fichiers `.md` : Epic, User Stories, Tasks
- [x] Générer les critères Gherkin pour chaque User Story
- [x] Organiser en `/mvp/`, `/iterations/iteration-1`, etc.
- [x] Afficher un message de succès une fois terminé

## Intégration Windsurf
- [x] Créer `mcp_config.json` compatible Windsurf
- [x] Tester l'exécution dans Windsurf avec stdio

## Publication npmjs
- [x] Ajouter `bin` dans `package.json`
- [x] Ajouter un exemple de commande avec `npx`
- [x] Ajouter un exemple avec Docker
- [x] Créer un fichier `.npmignore`
- [x] Publier le package sur npmjs.com

## Documentation
- [x] Rédiger le `README.md`
- [x] Expliquer comment paramétrer `.env`
- [x] Fournir un exemple de prompt utilisateur
- [x] Documenter les formats de sortie (Markdown)
- [x] Ajouter des instructions pour l'automatisation IA

## Tâches supplémentaires
- [x] Refactoriser le code en modules testables
- [x] Ajouter des tests unitaires
- [x] Créer un Dockerfile
- [x] Proposer une interface interactive en ligne de commande
- [x] Ajouter une option pour sauvegarder le JSON brut généré

## AgilePlanner - Suivi des tâches

Ce fichier liste les tâches importantes à réaliser ou déjà finalisées pour la maintenance et l'amélioration du projet.

## Tâches en cours

- [x] 1. Ajouter une section BuyMeACoffee (avec logo et lien) dans `README.md` et `README-EN.MD`
- [x] 2. Corriger les tests un par un jusqu'à ce qu'ils passent tous. UTiliser le mcp server sequentialthinking pour le raisonnement et context7 (pour la doc)
    - [x] Tests d'intégration MCP (réécrits et passent tous)
    - [x] `markdown-generator.test.js` est corrigé et passe
    - [x] `backlog-generator.test.js` est corrigé et passe
- [x] 3. Optimisations et corrections
    - [x] Résoudre le problème de duplication du fichier backlog.json (éviter qu'il soit créé à deux endroits)
- [x] 4. Préparer l'envoi sur npmjs.com
    - [x] Mise à jour du package.json (version, files, scripts)
    - [x] Création d'un fichier LICENSE standard (MIT)
    - [x] Mise à jour des README avec les instructions d'installation npm
    - [x] Ajout de l'option npx pour la configuration Windsurf/Cascade
    - [x] Renommage du package en `agile-planner-mcp-server` et mise à jour de toutes les références
    - [x] Mise à jour de l'URL du dépôt Git distant pour correspondre au nouveau nom
- [x] 5. Publier sur npmjs.com
- [x] 6. Mettre à jour les fichiers `Dockerfile` et `docker-compose.yml`
    - [x] Mise à jour du Dockerfile pour inclure tous les fichiers nécessaires
    - [x] Ajout des variables d'environnement pour le mode MCP
    - [x] Mise à jour des chemins pour le dossier de sortie `.agile-planner-backlog`
    - [x] Mise à jour des noms pour refléter le nouveau nom du package
- [x] 7. Terminer la correction des tests restants (aucun)

Cochez la case une fois la tâche terminée. Les tâches sont réalisées dans l'ordre indiqué pour garantir la stabilité et la qualité du projet.

## 🎉 Projet finalisé !

**Toutes les tâches ont été complétées avec succès !** Le projet Agile Planner MCP est maintenant :

1. ✅ Entièrement fonctionnel en mode CLI et MCP
2. ✅ Publié sur npmjs.com sous le nom `agile-planner-mcp-server`
3. ✅ Documenté en français et en anglais
4. ✅ Packagé avec Docker pour un déploiement facile
5. ✅ Tests unitaires et d'intégration opérationnels

Le package est maintenant prêt à être utilisé par la communauté. Pour toute amélioration future ou rapport de bug, utilisez le [dépôt GitHub](https://github.com/cyberlife-coder/agile-planner-mcp-server/issues).

Date de finalisation : 4 mai 2025

## 🚀 Évolutions futures (v1.1.0)

### Développement de la fonctionnalité `generateFeature`

- [x] 1. Créer le schéma de validation dans `server/lib/tool-schemas.js`
    - [x] Définir le schéma JSON pour `generateFeature`
    - [x] Ajouter les validations pour `storyCount` (minimum 3)
    - [x] Gérer les paramètres optionnels (`businessValue`, `iterationName`, etc.)

- [x] 2. Créer `server/lib/feature-generator.js`
    - [x] Implémenter la fonction principale `generateFeature`
    - [x] Créer le prompt adapté pour l'API OpenAI/Groq
    - [x] Réutiliser la logique de validation JSON de `backlog-generator.js`
    - [x] Implémenter la détection de contexte (backlog existant)

- [x] 3. Étendre `server/lib/markdown-generator.js`
    - [x] Ajouter la fonction `generateFeatureMarkdown`
    - [x] Préserver les instructions IA existantes
    - [x] Implémenter la structure de fichiers feature → user stories → tasks
    - [x] Ajouter des liens de navigation entre les fichiers
    - [x] Éviter d'écraser les fichiers existants

- [x] 4. Intégrer au serveur MCP dans `server/index.js`
    - [x] Ajouter le tool dans `handleToolsList`
    - [x] Créer le handler `handleGenerateFeature`
    - [x] S'assurer de la conformité avec les standards MCP
    - [x] Garantir que tous les logs sont sur stderr

- [x] 5. Tests et documentation
    - [x] Créer `tests/feature-generator.test.js`
    - [x] Tester la génération avec différents nombres d'US
    - [x] Tester la validation JSON (format invalide, champs manquants)
    - [x] Tester la préservation des fichiers existants
    - [x] Tester la compatibilité avec les différents providers (OpenAI, Groq)
    - [x] Mettre à jour la documentation pour inclure la nouvelle fonctionnalité
    - [x] Ajouter des exemples d'utilisation dans README.md et README-FR.md

### Spécifications détaillées

#### Schéma d'entrée pour `generateFeature`
```json
{
  "type": "object",
  "required": ["featureDescription"],
  "properties": {
    "featureDescription": {
      "type": "string",
      "description": "Description détaillée de la feature à générer"
    },
    "iterationName": {
      "type": "string",
      "description": "Nom de l'itération (ex: 'iteration-3', 'next')",
      "default": "next"
    },
    "storyCount": {
      "type": "integer",
      "description": "Nombre de user stories à générer",
      "minimum": 3,
      "default": 3
    },
    "businessValue": {
      "type": "string",
      "description": "Valeur métier de cette feature (optionnel)"
    },
    "outputPath": {
      "type": "string",
      "description": "Chemin de sortie personnalisé (optionnel)"
    }
  }
}
```

#### Structure de fichiers générés
```
.agile-planner-backlog/
├── README.md                    # Vue d'ensemble mise à jour
├── backlog.json                 # Données brutes mises à jour
├── features/
│   ├── feature-1/              
│   │   ├── feature.md          # Description de la feature
│   │   └── ...
│   └── [nouvelle-feature]/      # Générée par generateFeature
│       └── feature.md          # Description complète avec liens
└── user-stories/
    ├── feature-1/
    │   └── ...
    └── [nouvelle-feature]/
        ├── story-1.md          # US avec tâches incluses
        ├── story-2.md
        └── story-n.md          # Selon storyCount
```

#### Aspects essentiels à respecter
1. Critères INVEST et format Gherkin pour les user stories
2. Instructions IA dans chaque fichier
3. Navigation entre feature et user stories
4. Distribution intelligente et non-redondante des US
5. Détection et respect du contexte existant
6. Compatibilité stricte avec la spécification MCP
7. Historique des générations dans un fichier de log

### Prochaines étapes (v1.1.x)

- [x] 1. Tests unitaires pour la fonctionnalité `generateFeature`
   - [x] Créer le fichier `tests/feature-generator.test.js`
   - [x] Tester la génération de feature avec différents nombres d'US
   - [x] Tester la validation JSON (format invalide, champs manquants)
   - [x] Tester la préservation des fichiers existants
   - [x] Tester la compatibilité avec les différents providers (OpenAI, Groq)

- [x] 2. Interface CLI pour `generateFeature`
   - [x] Étendre le fichier `server/lib/cli.js` pour ajouter la nouvelle commande
   - [x] Créer des options pour le nombre d'US et la valeur business
   - [x] Ajouter une validation interactive des entrées utilisateur
   - [x] Implémenter un affichage console convivial du résultat

- [x] 3. Documentation utilisateur
   - [x] Mettre à jour le README.md et README-FR.md avec la nouvelle fonctionnalité
   - [x] Ajouter des exemples d'utilisation via CLI et MCP
   - [x] Créer un guide d'utilisation pour l'extension de backlog existant
   - [x] Documenter les bonnes pratiques pour la description des features

- [ ] 4. Détection et amélioration du contexte
   - [ ] Analyser le backlog existant avant de générer de nouvelles features
   - [ ] Suggérer des features complémentaires basées sur le backlog existant
   - [ ] Éviter les duplications et les incohérences avec l'existant
   - [ ] Ajouter une option pour générer des features liées à un epic existant

- [ ] 5. Évolutions supplémentaires
   - [ ] Enrichir les fichiers générés avec des métadonnées (tags, priorité, etc.)
   - [ ] Ajouter la possibilité d'exporter vers des outils externes (Jira, Trello)
   - [ ] Réutiliser les templates existants pour les features générées
   - [ ] Fonction de génération de planning prévisionnel d'implémentation

- [x] 6. Améliorations architecturales et cohérence MCP/CLI (v1.1.1)
   - [x] Créer un module centralisé de gestion des erreurs (`server/lib/errors.js`)
   - [x] Centraliser l'initialisation du client API (`server/lib/api-client.js`)
   - [x] Restructurer le routage MCP selon la spec 2025-03 (`server/lib/mcp-router.js`)
   - [x] Standardiser le style asynchrone dans les handlers
   - [x] Mettre à jour le handler `initialize` pour être conforme à la spécification MCP 2025-03
   - [x] Créer des modules d'exportation pour éliminer les dépendances circulaires
   - [x] Ajouter des tests unitaires pour les nouvelles classes

- [ ] 7. Mettons tout à jour pour npmjs.com
   - [x] Mettre à jour le package.json
   - [x] Mettre à jour le README.md
   - [x] Mettre à jour le README-FR.md
   - [x] Mettre à jour le Dockerfile
   - [x] Mettre à jour le docker-compose.yml
   - [x] publier sur npmjs.com

- [x] 8. Correction de bugs et mise à jour mineure (v1.1.2)
    - [x] Correction de l'écriture des fichiers en mode MCP
    - [x] Résolution des incompatibilités batch vs générateur
    - [x] Mise à jour du package.json (version 1.1.2)
    - [x] Mise à jour du README.md
    - [x] Mise à jour du README-FR.md

- [x] 9. Correction du problème de chemins dupliqués (v1.1.3)
    - [x] Correction de la duplication du dossier .agile-planner-backlog
    - [x] Mise à jour du package.json (version 1.1.3)
