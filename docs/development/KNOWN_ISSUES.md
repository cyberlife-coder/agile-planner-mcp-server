# Problèmes connus - Agile Planner MCP Server v1.7.2

Ce document liste les problèmes connus dans la version actuelle du logiciel. Ces problèmes sont identifiés mais n'impactent pas les fonctionnalités principales du produit. Ils seront résolus dans une version future.

## Problèmes de complexité cognitive

### 1. Fonction `createRule3Structure` dans mcp-router.js

- **Description** : La fonction a une complexité cognitive supérieure à 15 (limite SonarQube)
- **Impact** : Aucun impact fonctionnel, mais rend le code plus difficile à maintenir
- **Statut** : Prévu pour refactorisation dans v1.7.3
- **Lint ID** : 7ef1bfef-7230-4fed-a02e-e61e3339e840

### 2. Expression régulière à améliorer dans mcp-router.js (ligne 846)

- **Description** : L'expression régulière nécessite une précédence d'opérateurs explicite
- **Impact** : Aucun impact fonctionnel, mais peut causer des confusions lors de la lecture
- **Statut** : Prévu pour correction dans v1.7.3
- **Lint ID** : e004be1d-33bc-401b-9356-f7f74ff465ba

### 3. Fonction `parseJsonResponse` dans json-parser.js

- **Description** : Complexité cognitive de 31, dépassant largement la limite recommandée de 15
- **Impact** : Le code fonctionne correctement mais sera difficile à maintenir à long terme
- **Statut** : Prévu pour refactorisation complète dans v1.7.3

## Problèmes de tests

### 1. Asynchronisme des tests E2E

- **Description** : Les tests end-to-end échouent avec des erreurs "Cannot log after tests are done"
- **Impact** : Les tests automatisés ne peuvent pas être exécutés dans la CI, mais les fonctionnalités sont validées manuellement
- **Contournement** : Utiliser les scripts dédiés dans `scripts/tests/` pour la validation manuelle
- **Statut** : Prévu pour correction dans v1.7.3

### 2. Tokens français dans les fichiers de test

- **Description** : Certains fichiers de test contiennent des caractères français non échappés causant des erreurs de parsing
- **Impact** : Erreurs lors de l'exécution de certains tests
- **Fichiers affectés** :
  - `tests/backlog-generator.test.js` (ligne 108)
  - `tests/integration/cli-integration.test.js` (ligne 54)
- **Statut** : Prévu pour correction dans v1.7.3

## Documentation des tests

- **Description** : Le fichier TEST-ROADMAP.md n'est pas à jour avec tous les tests validés
- **Impact** : Documentation incomplète pour les contributeurs
- **Statut** : Prévu pour mise à jour dans v1.7.3
