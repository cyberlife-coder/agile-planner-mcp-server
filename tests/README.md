# Tests Unitaires pour Agile Planner MCP (v1.3.0)

Ce répertoire contient les tests unitaires pour les différentes fonctionnalités d'Agile Planner MCP. Ces tests sont organisés selon la structure standardisée Wave 8 pour permettre un développement et un débogage plus efficaces.

## Structure des tests selon Wave 8

La nouvelle organisation des tests suit la RULE 3 (Structure des fichiers) du projet Wave 8 :

- **unit/** : Tests unitaires individuels
  - **validators/** : Tests des validateurs de données
  - **formatters/** : Tests des outils de formatage
  - **generators/** : Tests des générateurs de backlog/features
  - **utils/** : Tests des utilitaires divers
- **integration/** : Tests d'intégration entre composants
  - **backlog/** : Tests d'intégration du backlog
  - **markdown/** : Tests d'intégration markdown
  - **mcp/** : Tests d'intégration MCP
- **e2e/** : Tests bout en bout (CLI, génération de fichiers)
- **fixtures/** : Données de test réutilisables
- **utils/** : Utilitaires partagés pour les tests

## Exécution des tests

```bash
# Exécuter tous les tests
npm run test

# Exécuter uniquement les tests unitaires
npm run test:unit

# Exécuter uniquement les tests d'intégration
npm run test:integration

# Exécuter uniquement les tests de bout en bout
npm run test:e2e

# Exécution par catégorie spécifique
npm run test:validators 
# ou
npm run test:formatters
```

## Bonnes pratiques conformément aux règles Wave 8

1. **RULE 1 (TDD)** : Écrire toujours les tests avant d'implémenter les fonctionnalités
2. **RULE 4 (Complexité)** : Limiter la complexité cognitive des tests (max 15)
3. **RULE 6 (Qualité)** : Assurer une couverture de code adéquate
4. **Principes généraux** :
   - Indépendance : Chaque test doit fonctionner indépendamment
   - Déterminisme : Résultats cohérents à chaque exécution
   - Clarté : Nommer explicitement les tests selon leur fonction

## Ajout de nouveaux tests

Pour ajouter un nouveau test :

1. Identifiez la catégorie appropriée (unit, integration, e2e)
2. Choisissez le sous-dossier adapté à la fonctionnalité
3. Créez un fichier `.test.js` avec un nom explicite
4. Suivez les conventions de test existantes
5. Vérifiez que les tests s'exécutent correctement

## Convention d'import des modules dans les tests

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
- Documenter toute exception dans ce README.

## Mise à jour de package.json

Après la réorganisation des tests, il est recommandé de mettre à jour les scripts dans `package.json` pour refléter la nouvelle structure de dossiers.

---

Dernière mise à jour : 8 mai 2025
