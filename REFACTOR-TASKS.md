# Tâches de refactorisation - Agile Planner MCP

Ce document liste les tâches restantes pour finaliser les refactorisations du projet, conformément aux principes TDD et aux règles Wave 8 du projet.

## Tâches réalisées

- [x] **Implémentation du pattern Strategy** - Création de validateurs spécialisés pour chaque entité
- [x] **Mise en place d'une Factory** - Création d'une Factory pour faciliter l'accès aux validateurs
- [x] **Documentation du pattern** - Mise à jour du fichier design.md pour documenter le pattern Strategy
- [x] **Amélioration de la qualité du code** - Remplacement des boucles for par des boucles for-of, réduction de la complexité cognitive
- [x] **Création d'exemples** - Exemples d'utilisation et d'intégration progressive
- [x] **Création d'une façade** - Transformation de l'ancien SchemaValidator en façade pour la nouvelle Factory
- [x] **Guide de migration** - Création d'un guide de migration pour faciliter l'adoption progressive

## Prochaines étapes

- [ ] **Corriger les tests d'intégration** - Adapter les tests qui utilisent encore l'ancien système de validation
- [ ] **Finaliser la migration progressive** - Remplacer progressivement les appels à l'ancien système par des appels à la nouvelle Factory
- [ ] **Supprimer les fichiers obsolètes** - Une fois la migration terminée, supprimer les fichiers listés dans OBSOLETE-FILES.md

## Tests à corriger

- [x] Corriger les tests dans `tests/backlog-generator.test.js` : isolation, mocks, fixtures, assertions, commentaires (en cours de correction)
- [ ] Corriger les tests dans `tests/markdown-generator.test.js`
- [ ] Corriger les tests dans `tests/isolated/backlog-validator.test.js`

## Améliorations de code

- [x] Remplacer les boucles for par des boucles for-of dans `backlog-validator.js`
- [x] Réduire la complexité cognitive dans les validateurs
- [x] Améliorer la gestion des erreurs dans `validateBacklog`

## Documentation mise à jour

- [x] Mise à jour du CHANGELOG.md
- [x] Mise à jour du README.md
- [x] Mise à jour du design.md
- [x] Création du MIGRATION-GUIDE.md
- [x] Création d'OBSOLETE-FILES.md

## Fichiers obsolètes à supprimer après migration complète

- [ ] `tests/schema-validator.test.js`
- [ ] `tests/isolated/schema-validator.test.js`

## Réorganisation des tests (Wave 8) - 8 mai 2025

### Tâches réalisées

- [x] Création de la structure standardisée (unit, integration, e2e, fixtures, utils)
- [x] Migration des tests isolés vers tests/unit/*
- [x] Migration des tests d'intégration vers tests/integration/*
- [x] Migration des tests de bout en bout vers tests/e2e
- [x] Migration des utilitaires de test vers tests/utils
- [x] Mise à jour du README pour les tests

### Tâches à finaliser

- [ ] Commiter les changements `git add tests/ && git commit -m "refactor: uniformisation structure tests selon standards Wave 8"`
- [ ] Mettre à jour les scripts de test dans package.json
- [ ] Exécuter tous les tests pour vérifier qu'il n'y a pas de régression
- [ ] Mettre à jour le CHANGELOG.md avec la nouvelle version 1.2.5
- [ ] Incrementer la version dans package.json de 1.2.4 à 1.2.5
- [ ] Créer un diagramme Mermaid de la structure des tests (RULE 7)

## Vérification finale

- [ ] Exécuter tous les tests pour vérifier qu'il n'y a pas de régression
- [ ] Vérifier que la couverture de code est suffisante
- [ ] Vérifier que la documentation est à jour
- [ ] Vérifier que les exemples fonctionnent correctement
