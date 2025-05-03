# 📌 Liste des tâches - Projet MCP Agile Server

## 🔧 Initialisation
- [x] Créer le projet Node.js (`npm init`)
- [x] Créer la structure de dossiers `server/`, `mvp/`, `iterations/`
- [x] Ajouter les dépendances nécessaires (`dotenv`, `zod`, `openai`, etc.)

## 🚀 Développement du serveur
- [x] Créer `index.js` pour lancer le serveur MCP
- [x] Charger la clé API via `.env`
- [x] Implémenter la commande `generateBacklog`
- [x] Générer les fichiers `.md` : Epic, User Stories, Tasks
- [x] Générer les critères Gherkin pour chaque User Story
- [x] Organiser en `/mvp/`, `/iterations/iteration-1`, etc.
- [x] Afficher un message de succès une fois terminé

## 🔗 Intégration Windsurf
- [x] Créer `mcp_config.json` compatible Windsurf
- [x] Tester l'exécution dans Windsurf avec stdio

## 🌐 Publication npmjs
- [x] Ajouter `bin` dans `package.json`
- [x] Ajouter un exemple de commande avec `npx`
- [x] Ajouter un exemple avec Docker
- [x] Créer un fichier `.npmignore`
- [x] Publier le package sur npmjs.com

## 📘 Documentation
- [x] Rédiger le `README.md`
- [x] Expliquer comment paramétrer `.env`
- [x] Fournir un exemple de prompt utilisateur
- [x] Documenter les formats de sortie (Markdown)
- [x] Ajouter des instructions pour l'automatisation IA

## ✅ Tâches supplémentaires
- [x] Refactoriser le code en modules testables
- [x] Ajouter des tests unitaires
- [x] Créer un Dockerfile
- [x] Proposer une interface interactive en ligne de commande
- [x] Ajouter une option pour sauvegarder le JSON brut généré
