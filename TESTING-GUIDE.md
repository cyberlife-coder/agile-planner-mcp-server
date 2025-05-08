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

---

## Convention d'import des modules dans les tests (Wave 8)

## Stratégie d'isolation, mocks/stubs et fixtures (tests generators)

**Conformément au plan craft Wave 8 :**

- Chaque fichier de test `generators` doit :
  - Initialiser tous les mocks/stubs dans un `beforeEach` (sandbox sinon, jest.clearAllMocks, etc.)
  - Restaurer tous les mocks/stubs dans un `afterEach` (sandbox.restore, jest.clearAllMocks)
  - Utiliser des fixtures partagées dans `tests/unit/generators/fixtures/` pour garantir la cohérence des données de test
  - Vérifier explicitement les appels des mocks (ex : `expect(mockValidate).toHaveBeenCalled()`)
  - Ajouter un commentaire d’en-tête expliquant la stratégie d’isolation et de gestion des dépendances

**Exemple de bloc d’en-tête recommandé :**
```js
/**
 * Ce fichier de test applique la stratégie d’isolation Wave 8 :
 * - Mocks/stubs créés et restaurés via beforeEach/afterEach
 * - Utilisation de fixtures partagées
 * - Vérification systématique des appels mocks
 */
```

**Voir le fichier `REFACTOR-TASKS.md` pour le suivi du plan craft et la checklist d’avancement.**

Pour garantir la cohérence et éviter les erreurs d'import, appliquez la convention suivante pour référencer les modules du dossier `server/lib` :

- **Dans les tests situés à la racine de `tests/`, `e2e/` ou `utils/`** :
  ```js
  const { MaFonction } = require('../server/lib/chemin/vers/module');
  ```
- **Dans les sous-dossiers de `tests/unit/` ou `tests/integration/`** :
  ```js
  const { MaFonction } = require('../../server/lib/chemin/vers/module');
  ```

**Astuce** : Toujours vérifier la profondeur du fichier de test avant de copier un import. Une erreur fréquente est de dupliquer un test sans adapter le chemin relatif.

**Exemples** :
- `tests/unit/validators/feature-validator.test.js` :
  ```js
  const { FeatureValidator } = require('../../server/lib/utils/validators/feature-validator');
  ```
- `tests/e2e/path-resolver.test.js` :
  ```js
  const { PathResolver } = require('../server/lib/utils/path-resolver');
  ```

**Bonnes pratiques** :
- Ne jamais utiliser d'import absolu dans les tests.
- Privilégier les imports relatifs pour garantir la portabilité.
- Documenter toute exception dans le README du dossier tests.

---

## Structure des dossiers de tests

- `tests/unit/`         : tests unitaires (validators, formatters, generators, utils)
- `tests/integration/`  : tests d'intégration (backlog, markdown, mcp)
- `tests/e2e/`          : tests de bout en bout (CLI, génération de fichiers)
- `tests/fixtures/`     : données de test réutilisables
- `tests/utils/`        : utilitaires partagés pour les tests

Voir [README du dossier tests](./tests/README.md) pour plus de détails.

---

## Scripts de test dans package.json

```json
"test": "jest",
"test:unit": "jest tests/unit",
"test:integration": "jest tests/integration",
"test:e2e": "jest tests/e2e",
"test:validators": "jest tests/unit/validators",
"test:formatters": "jest tests/unit/formatters"
```

---

## Stratégie de gestion des tests échoués (TDD Wave 8)

Conformément aux principes TDD Wave 8, nous avons mis en place une stratégie complète pour gérer les tests échoués :

1. **Tests temporairement désactivés** :
   - Les tests qui échouent mais sont toujours pertinents sont marqués avec `test.skip()`
   - Chaque test skippé est documenté avec un commentaire explicatif
   - Ces tests sont considérés comme une dette technique à résoudre prioritairement
   - Voir [test-refactoring-plan.md](./test-refactoring-plan.md) pour le plan de résolution détaillé

1. **Approche de résolution TDD** :
   - Nous suivons une approche stricte TDD pour résoudre les tests en échec
   - Analyse du problème → Correction du test → Exécution (RED) → Implémentation (GREEN) → Refactorisation
   - Chaque test résolu est documenté dans le `CHANGELOG.md`

2. **Scripts d'assistance** :
   - Le dossier `fixes-tests/` contient des utilitaires pour diagnostiquer et corriger les tests
   - Utilisez `node fixes-tests/diagnostic.js` pour analyser les tests échoués
   - Les scripts suivent les principes Wave 8 (TDD, qualité, structure)

3. **Mocks standardisés** :
   - Tous les mocks suivent désormais le format Jest standard
   - Utilisez `.mockReturnValue()` et non `.returns()`
   - Utilisez `.mockResolvedValue()` et non `.resolves()`
   - Utilisez `.mockRejectedValue()` et non `.rejects()`

4. **Imports relatifs corrects** :
   - Pour les fichiers dans `tests/unit/xxx/`, utilisez `../../../server/lib/`
   - Pour les fichiers dans `tests/integration/xxx/`, utilisez `../../server/lib/`
   - Pour les fichiers dans `tests/e2e/`, utilisez `../server/lib/`

---

Dernière mise à jour : 8 mai 2025 (Wave 8 TDD)
