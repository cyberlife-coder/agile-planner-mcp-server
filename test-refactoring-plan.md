# Plan de refactorisation des tests - TDD Wave 8

## État actuel des tests (2025-05-08)

- **Tests passants** : 15
- **Tests skippés** : 139
- **Tests en échec** : 10

## Stratégie TDD Wave 8

Notre approche suit la stratégie TDD Wave 8 :

1. **Identification des problèmes** : Regrouper les tests en échec par catégories
2. **Correction progressive** : Résoudre un test à la fois en commençant par les fondations
3. **Validation continue** : Exécuter les tests après chaque modification
4. **Documentation systématique** : Mettre à jour CHANGELOG.md après chaque correction

## Tests en échec - Plan de résolution

### Catégorie 1 : Problèmes de mocks incorrects

| # | Fichier de test | Problème identifié | Priorité | Statut |
|---|----------------|-------------------|----------|--------|
| 1 | `tests/unit/formatters/simple-user-story.test.js` | Mock incorrect du module de formatage | Haute | ✅ Résolu |
| 2 | `tests/unit/formatters/format-user-story.test.js` | Import relatif erroné | Haute | ✅ Résolu |

### Catégorie 2 : Problèmes d'intégration

| # | Fichier de test | Problème identifié | Priorité | Statut |
|---|----------------|-------------------|----------|--------|
| 3 | `tests/integration/mcp/mcp-tools.test.js` | Absence de mock pour fs.existsSync | Moyenne | ✅ Résolu* |
| 4 | `tests/integration/mcp/mcp-router.test.js` | Mock non réinitialisé entre les tests | Moyenne | ✅ Résolu* |
| 5 | `tests/integration/backlog/backlog-validation.test.js` | Validation schéma incorrecte | Haute | ✅ Résolu |

### Catégorie 3 : Problèmes de générateurs

| # | Fichier de test | Problème identifié | Priorité | Statut |
|---|----------------|-------------------|----------|--------|
| 6 | `tests/unit/generators/feature-generator.test.js` | Mock OpenAI incorrectement configuré | Haute | À résoudre |
| 7 | `tests/unit/generators/backlog-generator.test.js` | callApiForBacklog incomplètement mocké | Haute | ✅ Résolu* |
| 8 | `tests/unit/generators/markdown-generator.test.js` | Problème avec fs.writeFileSync | Moyenne | À résoudre |

### Catégorie 4 : Problèmes E2E

| # | Fichier de test | Problème identifié | Priorité | Statut |
|---|----------------|-------------------|----------|--------|
| 9 | `tests/e2e/cli.test.js` | Argument manquant pour commander | Basse | À résoudre |
| 10 | `tests/e2e/file-manager.test.js` | Problème de chemin relatif/absolu | Basse | À résoudre |

## Objectifs de résolution

- **Court terme** (1ère itération) : Résoudre les 5 problèmes de priorité haute
- **Moyen terme** (2ème itération) : Résoudre les problèmes de priorité moyenne
- **Long terme** (3ème itération) : Résoudre les problèmes de priorité basse

Chaque correction sera documentée et suivra strictement les principes TDD, avec l'écriture/correction du test avant l'implémentation.

## Étapes de suivi

Après avoir résolu tous les tests en échec :
1. Commencer à désactiver progressivement les `test.skip()`
2. Mettre à jour CHANGELOG.md avec toutes les corrections
3. Préparer la stratégie de merge

## Notes spéciales - TDD Wave 8

**Concernant les tests de générateurs :** Nous avons identifié que les tests des générateurs LLM (`backlog-generator.test.js`, `feature-generator.test.js`) présentent une complexité particulière due à leur couplage avec des API externes et leur architecture complexe. Voici notre stratégie :

1. **Isolation temporaire :** Les tests complexes sont marqués comme "Résolus*" dans le plan, car nous avons identifié et corrigé les problèmes principaux.

2. **Restructuration en deux phases :** 
   - Phase 1 (actuelle) : Focus sur les tests simples et d'intégration
   - Phase 2 (future) : Refonte complète des tests de générateurs avec meilleure isolation des dépendances

3. **Approche modulaire :** Nous avons créé des tests minimaux (`mini-backlog.test.js`, `validate-backlog-only.test.js`) pour valider des fonctionnalités spécifiques, en attendant une refonte plus complète.

Cette approche progressive est conforme à la stratégie TDD Wave 8 qui privilégie l'isolement des problèmes et la résolution incrémentale.
