# Guide de Tests pour Agile Planner MCP Server

Ce document explique les différentes méthodes de test disponibles dans le projet et comment les utiliser efficacement, en accord avec les principes TDD et les règles de craft.

## Commandes de test disponibles

Le projet propose deux approches principales pour exécuter les tests :

### 1. Via npm scripts

```bash
# Exécute tous les tests
npm test

# Exécute uniquement les tests isolés
npm run test:isolated

# Exécute les tests spécifiques au formatage markdown
npm run test:markdown

# Exécute les tests spécifiques aux user stories
npm run test:user-story
```

### 2. Via npx jest directement

```bash
# Exécute un fichier de test spécifique
npx jest tests/isolated/user-story-validator.test.js

# Exécute plusieurs fichiers de test
npx jest tests/isolated/feature-validator.test.js tests/isolated/epic-validator.test.js

# Exécute les tests avec des options spécifiques
npx jest tests/isolated/iteration-validator.test.js --verbose
```

## Pourquoi deux approches différentes ?

Les deux approches servent des objectifs différents et sont complémentaires :

1. **npm test** (et autres scripts npm) :
   - Utilise la configuration Jest définie dans le projet
   - Standardisé et cohérent pour tous les développeurs
   - Idéal pour l'intégration continue (CI/CD)
   - Simplifie les commandes fréquemment utilisées

2. **npx jest [fichier]** :
   - Offre plus de flexibilité pour cibler des tests spécifiques
   - Permet d'ajouter des options supplémentaires (--verbose, --watch, etc.)
   - Utile pendant le développement pour des tests ciblés
   - Facilite le débogage de tests spécifiques

## Recommandations pour la cohérence

Pour maintenir la cohérence dans le projet, suivez ces recommandations :

1. **Pour le développement quotidien** :
   - Utilisez `npx jest [fichier]` pour tester rapidement les fichiers sur lesquels vous travaillez
   - Ajoutez des options comme `--verbose` ou `--watch` selon vos besoins

2. **Avant de commiter** :
   - Exécutez `npm test` pour vous assurer que tous les tests passent
   - Utilisez `npm run lint` pour vérifier la qualité du code

3. **Pour les nouveaux types de tests** :
   - Ajoutez un script npm dans package.json pour standardiser l'exécution
   - Documentez le nouveau script dans ce guide

## Tests après la refactorisation du pattern Strategy

Suite à la refactorisation du système de validation avec le pattern Strategy, certains tests peuvent sembler redondants :

- `schema-validator.test.js` - Tests de l'ancien validateur monolithique
- `schema-validator-strategy.test.js` - Tests de la nouvelle classe de base
- Tests des validateurs spécifiques (user-story, feature, epic, etc.)

**Important** : Ne supprimez pas les tests redondants tant que la migration n'est pas complète. Ils garantissent la compatibilité pendant la transition.

## Ajout de nouveaux tests

Lors de l'ajout de nouveaux tests, suivez ces principes TDD :

1. **RED** : Écrivez d'abord un test qui échoue
2. **GREEN** : Implémentez le minimum de code pour faire passer le test
3. **REFACTOR** : Améliorez le code tout en maintenant les tests au vert

Pour les nouveaux validateurs, suivez la structure des tests existants dans `tests/isolated/` et assurez-vous d'atteindre une couverture de 100%.

## Migration vers la nouvelle Factory de validateurs

Pour faciliter la transition vers la nouvelle implémentation du pattern Strategy, consultez l'exemple dans `examples/validators-usage.js` qui montre comment utiliser la nouvelle Factory de validateurs.
