# Changelog - Agile Planner MCP Server

## v1.1.6 (2025-05-06)

### Corrections
- Résolution du problème de démarrage du serveur MCP qui se fermait prématurément
- Ajout d'un mécanisme keepAlive pour maintenir le serveur MCP actif
- Correction du problème d'ouverture de fichier JavaScript sous Windows
- Ajout de l'option `--mcp` pour démarrer facilement en mode MCP
- Amélioration de la configuration MCP pour une meilleure compatibilité multiplateforme

### Améliorations
- Ajout du shebang `#!/usr/bin/env node` pour une meilleure compatibilité avec les exécutables npm
- Meilleure gestion des logs pour faciliter le débogage

## v1.1.5 (2025-05-05)

### Améliorations
- Corrections des tests Jest avec résolution d'un problème d'ordre des paramètres dans la fonction generateBacklog
- Ajout de la licence MIT avec clause Commons sur le modèle de claude-task-master
- Mise à jour des changelogs pour correspondre précisément à la version actuelle
- Création d'exemples détaillés dans le dossier examples/ montrant le format exact des sorties
- Enrichissement de la documentation dans les README en anglais et français
- Ajout de liens vers le guide d'utilisation optimal (OPTIMAL_USAGE_GUIDE.MD)
