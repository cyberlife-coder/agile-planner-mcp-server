# Guide de Migration - Système de Validation

Ce document explique comment migrer progressivement de l'ancien système de validation monolithique vers la nouvelle architecture basée sur le pattern Strategy.

## Architecture du Nouveau Système

Le nouveau système de validation utilise le pattern Strategy pour encapsuler différentes logiques de validation dans des classes spécialisées :

```
SchemaValidatorStrategy (classe abstraite)
├── TypeValidator (validation des types primitifs)
├── UserStoryValidator (validation des user stories)
├── FeatureValidator (validation des features)
├── EpicValidator (validation des epics)
├── IterationValidator (validation des itérations)
└── BacklogValidator (validation complète du backlog)
```

Une Factory (`ValidatorsFactory`) a été mise en place pour faciliter l'accès à ces validateurs.

## Migration Progressive

Pour faciliter la transition vers la nouvelle architecture, nous recommandons une approche progressive :

### Étape 1 : Utiliser la Factory pour les Nouveaux Modules

Pour les nouveaux modules ou les modules en cours de refactorisation, utilisez directement la Factory :

```javascript
const validatorsFactory = require('./server/lib/utils/validators/validators-factory');

// Valider une user story
const userStoryResult = validatorsFactory.validate(userStory, 'userStory');

// Valider un backlog complet
const backlogResult = validatorsFactory.validate(backlog, 'backlog');
```

### Étape 2 : Approche Hybride pour les Modules Existants

Pour les modules existants, vous pouvez utiliser une approche hybride qui permet de basculer entre l'ancien et le nouveau système :

```javascript
function validateWithOptions(data, type, options = {}) {
  // Configuration pour la migration progressive
  const useNewValidator = options.useNewValidator !== false; // Par défaut, utilise le nouveau validateur
  
  try {
    let validationResult;
    
    if (useNewValidator) {
      // Nouvelle implémentation avec la Factory
      validationResult = validatorsFactory.validate(data, type);
    } else {
      // Ancienne implémentation pour compatibilité
      const schemaValidator = require('./server/lib/utils/schema-validator');
      
      switch (type) {
        case 'userStory':
          validationResult = schemaValidator.validateUserStory(data);
          break;
        case 'feature':
          validationResult = schemaValidator.validateFeature(data);
          break;
        case 'epic':
          validationResult = schemaValidator.validateEpic(data);
          break;
        case 'iteration':
          validationResult = schemaValidator.validateIteration(data);
          break;
        case 'backlog':
          validationResult = schemaValidator.validateBacklog(data);
          break;
        default:
          throw new Error(`Type de validation non supporté: ${type}`);
      }
    }
    
    return validationResult;
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}
```

### Étape 3 : Migration des Tests

Pour les tests, vous pouvez utiliser l'approche suivante :

```javascript
// Ancienne approche
const schemaValidator = require('../../server/lib/utils/schema-validator');
const result = schemaValidator.validateBacklog(backlog);

// Nouvelle approche
const validatorsFactory = require('../../server/lib/utils/validators/validators-factory');
const result = validatorsFactory.validate(backlog, 'backlog');
```

## Exemples Détaillés

Des exemples détaillés d'utilisation et de migration sont disponibles dans :

- `examples/validators-usage.js` - Exemples d'utilisation des validateurs
- `examples/migration-integration.js` - Exemples d'intégration progressive

## Avantages du Nouveau Système

1. **Séparation des responsabilités** : Chaque validateur est responsable d'un seul type d'entité
2. **Réduction de la complexité** : Fonctions plus courtes et plus faciles à maintenir
3. **Testabilité améliorée** : Tests unitaires ciblés pour chaque validateur
4. **Extensibilité** : Facile d'ajouter de nouveaux validateurs sans modifier le code existant

## Fichiers Obsolètes

Une fois la migration terminée, les fichiers suivants pourront être supprimés :

- `server/lib/utils/schema-validator.js` - Ancien système monolithique
- `tests/schema-validator.test.js` - Tests de l'ancien système
- `tests/isolated/schema-validator.test.js` - Tests isolés de l'ancien système

Consultez le fichier `OBSOLETE-FILES.md` pour une liste complète des fichiers à supprimer après la migration.

## Vérification de la Migration

Pour vérifier que la migration a été effectuée correctement, exécutez les tests :

```bash
npm run test:validators  # Tests des nouveaux validateurs
npm test                 # Tous les tests
```

Si vous rencontrez des problèmes pendant la migration, consultez le fichier `REFACTOR-TASKS.md` pour une liste des tâches restantes et des problèmes connus.
