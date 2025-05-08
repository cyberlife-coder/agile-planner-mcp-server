# Plan de Refactorisation TDD

Ce document présente le plan de refactorisation selon l'approche TDD pour améliorer la qualité du code du projet Agile Planner MCP Server, en accord avec les règles de conception définies.

## Progression de la Refactorisation

### Étape 1: Schema Validator (TERMINÉ ✅)

**Problèmes identifiés :**
- Fichier trop long (482 lignes)
- Probable présence de fonctions > 50 lignes
- Complexité cognitive élevée

**Réalisations :**
- ✅ Implémentation du pattern Strategy pour la validation
- ✅ Création de validateurs spécialisés (UserStory, Feature, Epic, Iteration, Backlog)
- ✅ Tests unitaires avec couverture de 100%
- ✅ Documentation du pattern dans design.md
- ✅ Création d'une Factory pour faciliter la transition

**Prochaines actions :**
- Migration progressive des appels à l'ancien validateur vers la nouvelle Factory
- Nettoyage des tests obsolètes

### Étape 2: index.js (À VENIR)

**Problèmes identifiés :**
- Fichier trop long (455 lignes)
- Mélange de responsabilités (configuration, routing, handlers)
- Manque de séparation des préoccupations

**Plan :**
1. Écrire des tests isolés pour les gestionnaires (handlers)
2. Extraire les handlers dans des modules distincts
3. Appliquer le pattern Mediator ou Façade
4. Restructurer vers une architecture plus modulaire

### Étape 3: backlog-generator.js (À VENIR)

**Problèmes identifiés :**
- Fichier long (376 lignes)
- Haute complexité cognitive dans certaines fonctions

**Plan :**
1. Compléter les tests pour les fonctions principales
2. Appliquer le pattern Builder pour la génération
3. Extraire les fonctions auxiliaires dans des modules utilitaires
4. Documenter le pattern Builder dans design.md

## Analyse de la Qualité Craft

### Fichiers dépassant ou approchant la limite de 500 lignes

| Fichier | Lignes | Priorité | Statut |
|---------|--------|----------|--------|
| server/lib/utils/schema-validator.js | 482 | 1 | ✅ Refactorisé |
| server/index.js | 455 | 1 | À faire |
| server/lib/backlog-generator.js | 376 | 2 | À faire |
| server/lib/utils/file-manager.js | 363 | 2 | À faire |
| server/lib/mcp-router.js | 347 | 3 | À faire |
| server/lib/mcp-server.js | 287 | 3 | À faire |
| server/lib/feature-generator.js | 268 | 4 | À faire |
| server/lib/cli.js | 259 | 4 | À faire |
| server/lib/markdown/story-formatter.js | 214 | 5 | À faire |

## Approche TDD pour chaque Refactorisation

Pour chaque module à refactoriser, nous suivrons systématiquement :

1. **RED** : Écrire des tests qui échouent pour les nouvelles fonctionnalités
2. **GREEN** : Implémenter le minimum pour faire passer les tests
3. **REFACTOR** : Améliorer le code tout en gardant les tests au vert

## Standardisation des Tests

### Clarification npm test vs npx jest

Le projet utilise actuellement deux approches pour exécuter les tests :

1. **npm test** : Exécute tous les tests via le script défini dans package.json
   - Avantage : Standardisé, utilise la configuration Jest du projet
   - Usage : Pour les tests d'intégration et CI/CD

2. **npx jest [fichier]** : Exécute directement Jest avec des options spécifiques
   - Avantage : Plus flexible, permet de cibler des fichiers/patterns spécifiques
   - Usage : Pour le développement et le débogage

**Recommandation :** 
- Utiliser `npm test` pour les tests complets
- Utiliser `npx jest [fichier]` pour les tests ciblés pendant le développement
- Ajouter des scripts npm supplémentaires pour les cas d'utilisation fréquents

## Prochaines Actions Immédiates

1. ✅ Documenter les patterns actuels dans design.md (TERMINÉ)
2. ✅ Refactoriser schema-validator.js (TERMINÉ)
3. Migration progressive vers la nouvelle Factory de validateurs
4. Commencer la refactorisation de index.js
