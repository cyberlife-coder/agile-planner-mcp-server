# Changelog - Agile Planner MCP Server

## v1.3.2 (2025-05-08)

### Améliorations
- Robustesse des tests unitaires : mocks explicites OpenAI et Groq avec baseURL, reset des mocks entre sous-tests, 100% de réussite
- Correction du nom de la fonction mockée (deliver_backlog)
- Alignement complet avec la logique TDD Wave 8 et isolation stricte des tests

### Qualité
- Documentation et exemples à jour
- Version, README et CHANGELOG synchronisés

## v1.3.3 (2025-05-08)

### Tests & Qualité
- Refactorisation complète des tests unitaires conformément aux principes Wave 8
- Standardisation des mocks pour les dépendances externes (fs-extra, chalk, etc.)
- Correction systématique des chemins d'importation pour la nouvelle structure
- Réorganisation hiérarchique des tests en modules (validators, formatters, utils, generators)
- Isolation stricte des tests unitaires pour garantir la fiabilité et la maintenabilité
- Amélioration de la couverture de tests avec validation robuste des comportements attendus

### Corrections de tests
- ✅ Résolution du test `simple-user-story.test.js` : correction de l'import du module `mdformatter.js`, simplification des mocks
- ✅ Résolution du test `format-user-story.test.js` : standardisation des mocks Jest (.resolves → .mockResolvedValue), utilisation de fixtures intégrées
- Création d'un plan de refactorisation détaillé conforme à TDD Wave 8 (dans `test-refactoring-plan.md`)
- Mise à jour du guide de test avec la stratégie de résolution TDD Wave 8


## v1.3.1 (2025-05-08)

### Ajouté
- Documentation détaillée sur la convention d'import des modules dans les tests (README du dossier tests)
- Exemples d'import selon la profondeur des fichiers de test

### Corrigé
- Vérification et uniformisation de tous les chemins d'import dans les tests unitaires, d'intégration et e2e
- Application stricte de la convention relative (../ ou ../../) selon la structure

### Qualité
- Alignement complet avec les règles Wave 8 (structure, TDD, documentation)

## v1.2.4 (2025-05-08)

### Améliorations
- Migration complète des tests legacy du format 'epic' (singulier) vers 'epics' (pluriel uniquement)
- Implémentation robuste de la fonction `validateBacklogResult` dans markdown-generator.js
- Refactorisation des tests pour réduire leur complexité cognitive (< 15)
- Extraction des fonctions imbriquées pour améliorer la lisibilité du code
- Uniformisation des boucles avec `for...of` au lieu des boucles classiques
- Amélioration des structures de données et élimination des templates literals imbriqués

### Corrections
- Suppression complète du support pour le format legacy 'epic' (singulier)
- Correction des variables inutilisées et optimisation des closures
- Résolution de problèmes de qualité de code signalés par l'IDE

## v1.2.3 (2025-05-08)

### Améliorations
- Support complet des formats backlog 'epic' (singulier) et 'epics' (pluriel)
- Normalisation automatique des backlogs pour garantir la rétrocompatibilité
- Refactorisation des validateurs pour réduire la complexité cognitive
- Création de tests standards conformes à TDD (Wave 8)
- Extraction des méthodes de validation dans des fonctions dédiées
- Documentation complète des formats de backlog supportés dans `BACKLOG_FORMAT.md`

### Corrections
- Résolution des problèmes de validation entre les différents formats de backlog
- Harmonisation des schémas de validation JSON pour supporter les deux formats
- Amélioration de la robustesse des tests avec une approche systémique

## v1.2.2 (2025-05-07)

### Améliorations
- Ajout d'utilitaires de gestion de fichiers (`FileManager` et `PathResolver`)
- Configuration Windsurf pour standardiser le développement
- Nettoyage et réorganisation des fichiers pour une meilleure structure
- Création d'un dossier dédié pour les exemples d'user stories
- Refactorisation du générateur de markdown pour améliorer la modularité
- Création d'un générateur minimal de markdown pour les cas simples
- Mise en place d'une structure modulaire pour les formateurs markdown
- Optimisation du générateur de backlog pour améliorer les performances
- Amélioration du routeur MCP pour une meilleure gestion des requêtes
- Mise à jour de l'index principal pour une meilleure intégration
- Amélioration des exemples d'user stories pour une meilleure compréhension
- Ajout d'exemples de migration pour faciliter la transition vers le nouveau système
- Mise à jour des tests pour assurer la qualité du code

## v1.2.1 (2023-11-20)

### Améliorations
- Refactorisation du système de validation avec le pattern Strategy
- Création de validateurs spécialisés pour chaque entité (UserStory, Feature, Epic, Iteration, Backlog)
- Implémentation d'une Factory pour faciliter l'accès aux validateurs
- Documentation du pattern Strategy dans `design.md`
- Amélioration de la couverture de tests (100% pour les nouveaux validateurs)
- Ajout d'exemples d'utilisation des validateurs dans `examples/validators-usage.js`
- Ajout d'un exemple d'intégration progressive dans `examples/migration-integration.js`
- Création d'un guide de test (`TESTING-GUIDE.md`) pour clarifier l'utilisation de `npm test` et `npx jest`
- Identification des fichiers obsolètes dans `OBSOLETE-FILES.md` pour faciliter le nettoyage futur

### Corrections
- Amélioration de la précision des messages d'erreur pour les validateurs
- Réduction de la complexité cognitive dans plusieurs fonctions
- Compatibilité avec l'ancien système de validation pour faciliter la migration progressive
- Réduction de la complexité cognitive des fonctions de validation
- Documentation complète de l'architecture des validateurs dans `server/lib/utils/validators/README.md`

## v1.2.0 (2025-05-06)

### Nouvelles fonctionnalités
- Implémentation de la structure hiérarchique epic > feature > user story
- Ajout de métadonnées et d'instructions AI pour faciliter le travail collaboratif avec les IA

### Améliorations
- Refactorisation majeure du module markdown-generator pour améliorer la maintenabilité et la robustesse
- Division du module monolithique (1124 lignes) en 7 modules spécialisés respectant la limite de 500 lignes par fichier
- Préservation complète de la structure hiérarchique lorsqu'elle est appelée via l'outil MCP generateBacklog
- Ajout de la licence MIT avec clause Commons sur le modèle de claude-task-master
- Mise à jour des changelogs pour correspondre précisément à la version actuelle
- Création d'exemples détaillés dans le dossier examples/ montrant le format exact des sorties
- Enrichissement de la documentation dans les README en anglais et français
- Ajout de liens vers le guide d'utilisation optimal (OPTIMAL_USAGE_GUIDE.MD)

### Corrections
- Correction d'un problème critique dans la fonction `generateMarkdownFilesFromResult` empêchant la création correcte des liens entre fichiers
- Normalisation des chemins relatifs pour assurer la compatibilité cross-platform
- Résolution d'un problème d'encodage des caractères spéciaux dans les fichiers markdown
- Amélioration de la robustesse des appels MCP
- Gestion de l'ID unique pour les entités (forced 'lowercase')
- Tests unitaires pour tous les composants (story, feature, epic, iteration, MVP)

## v1.1.5 (2025-04-29)

### Corrections
- Correction d'un problème d'ordre des paramètres dans la fonction generateBacklog

### Améliorations
- Amélioration des exemples fournis pour refléter les cas d'usage réels
