# Validateurs de Schémas - Pattern Strategy

Ce dossier contient l'implémentation du pattern Strategy pour la validation des schémas dans Agile Planner MCP Server. Cette architecture a été mise en place pour remplacer progressivement l'ancien système monolithique de validation (`schema-validator.js`).

## Architecture

```
SchemaValidatorStrategy (classe abstraite)
├── TypeValidator (validation des types primitifs)
├── UserStoryValidator (validation des user stories)
├── FeatureValidator (validation des features)
├── EpicValidator (validation des epics)
├── IterationValidator (validation des itérations)
└── BacklogValidator (validation complète du backlog)
```

## Points d'entrée

- **ValidatorsFactory** : Factory qui fournit des instances singleton des validateurs
- **SchemaValidator** : Classe de compatibilité avec l'ancien système

## Utilisation

### Approche recommandée (nouvelle architecture)

```javascript
const validatorsFactory = require('./validators/validators-factory');

// Valider une user story
const userStoryResult = validatorsFactory.validate(userStory, 'userStory');

// Valider un backlog complet
const backlogResult = validatorsFactory.validate(backlog, 'backlog');
```

### Approche de compatibilité (ancien système)

```javascript
const schemaValidator = require('./schema-validator');

// Valider une user story
const userStoryResult = schemaValidator.validateUserStory(userStory);

// Valider un backlog complet
const backlogResult = schemaValidator.validateBacklog(backlog);
```

## Avantages du Pattern Strategy

1. **Séparation des responsabilités** : Chaque validateur est responsable d'un seul type d'entité
2. **Réduction de la complexité** : Fonctions plus courtes et plus faciles à maintenir
3. **Testabilité améliorée** : Tests unitaires ciblés pour chaque validateur
4. **Extensibilité** : Facile d'ajouter de nouveaux validateurs sans modifier le code existant

## Migration Progressive

La migration des anciens appels vers la nouvelle architecture est en cours. Les deux approches sont supportées pour assurer une transition en douceur.

## Tests

Tous les validateurs ont des tests unitaires avec une couverture de 100%.

```
npx jest tests/isolated/user-story-validator.test.js
npx jest tests/isolated/feature-validator.test.js
npx jest tests/isolated/epic-validator.test.js
npx jest tests/isolated/iteration-validator.test.js
```
