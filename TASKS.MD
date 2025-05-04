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
- [ ] 3. Préparer l'envoi sur npmjs.com
- [ ] 4. Publier sur npmjs.com
- [ ] 5. Mettre à jour les fichiers `Dockerfile` et `docker-compose.yml`
- [ ] 6. Terminer la correction des tests restants (aucun)

Cochez la case une fois la tâche terminée. Les tâches sont réalisées dans l'ordre indiqué pour garantir la stabilité et la qualité du projet.
