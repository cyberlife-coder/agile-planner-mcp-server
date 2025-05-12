# Roadmap - Agile Planner MCP Server

Ce document présente la feuille de route des améliorations et fonctionnalités prévues pour les versions futures d'Agile Planner MCP Server.

## Version 1.7.3 (Stabilité et Refactorisation)

### Refactorisation et Dette Technique
- [ ] Réduire la complexité cognitive de `createRule3Structure` dans mcp-router.js
- [ ] Améliorer l'expression régulière dans mcp-router.js (ligne 846) pour clarifier la précédence d'opérateurs
- [ ] Refactoriser la fonction `parseJsonResponse` dans json-parser.js pour une meilleure maintenabilité
- [ ] Appliquer strictement la règle des 50 lignes par fonction

### Tests et Validation
- [ ] Corriger les problèmes d'asynchronisme dans les tests E2E
- [ ] Résoudre les erreurs de parsing dans les fichiers de test contenant des tokens français
- [ ] Mettre à jour TEST-ROADMAP.md avec la documentation des tests validés
- [ ] Automatiser la création de tests E2E pour les nouvelles fonctionnalités

### Documentation
- [ ] Enrichir les exemples d'usage dans `docs/guides/`
- [ ] Ajouter des diagrammes de séquence pour les flux MCP complexes
- [ ] Compléter la documentation de compatibilité multi-LLM

## Version 1.8.0 (Nouvelles Fonctionnalités)

### Fonctionnalités Backlog
- [ ] Support de l'estimation des points de complexité pour les user stories
- [ ] Génération automatique de critères d'acceptation pour chaque user story
- [ ] Support pour l'export vers des outils de gestion de projet (Jira, GitHub Projects, Trello)

### Fonctionnalités Feature
- [ ] Support pour la génération de tests unitaires avec chaque user story
- [ ] Ajout d'un mode de raffinement pour améliorer des features existantes
- [ ] Support multi-langue (français, anglais, espagnol)

### Intégration MCP Améliorée
- [ ] Ajout d'outils MCP pour la validation de backlog
- [ ] Amélioration des performances pour les grands backlogs
- [ ] Support pour le streaming des réponses avec les LLMs compatibles

## Version 2.0.0 (Fonctionnalités Majeures)

### Fonctionnalités Enterprise
- [ ] Support multi-projets avec synchronisation
- [ ] Interface web pour la gestion des backlogs
- [ ] API REST complète pour l'intégration avec d'autres services
- [ ] Mode de collaboration temps réel pour les équipes

### Innovations IA
- [ ] Support des modèles multimodaux pour l'analyse d'images et de diagrammes
- [ ] Analyse automatique de la qualité des user stories avec recommandations
- [ ] Assistant de planification d'itération avec optimisation de la capacité

## Comment Contribuer

Si vous souhaitez contribuer à la réalisation de cette feuille de route ou suggérer de nouvelles fonctionnalités, n'hésitez pas à :
1. Créer une issue sur notre dépôt GitHub
2. Soumettre une pull request avec votre implémentation
3. Discuter de vos idées dans les discussions GitHub

Nous apprécions toutes les contributions, qu'il s'agisse de code, de documentation, de tests ou de suggestions d'amélioration.
