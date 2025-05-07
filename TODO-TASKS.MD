# Tâches d'amélioration pour Agile Planner - Priorités TDD

Ce document liste les tâches identifiées pour améliorer la qualité du code en suivant les principes de Software Craftsmanship et l'approche TDD. Cochez la case lorsqu'une tâche est terminée.

## Tâches complétées

- [x] Refactorisation du système de validation avec pattern Strategy
- [x] Création de validateurs spécialisés (UserStory, Feature, Epic, Iteration, Backlog)
- [x] Tests unitaires pour tous les validateurs (100% de couverture)
- [x] Documentation du pattern Strategy dans design.md
- [x] Création d'une Factory pour les validateurs

## Tâches en cours

- [ ] Migration progressive des appels à l'ancien validateur vers la nouvelle Factory
- [ ] Nettoyage des tests obsolètes
- [ ] Standardisation des commandes de test (npm test vs npx jest)

## Prochaines tâches

- [ ] Refactorisation de index.js avec pattern Mediator
- [ ] Refactorisation de backlog-generator.js avec pattern Builder
- [ ] Amélioration de la couverture de tests pour les fichiers refactorisés
- [ ] Création d'une interface/classe abstraite pour l'API client
- [ ] Mise à jour de la documentation utilisateur
- [ ] Mise à jour des exemples pour montrer l'utilisation des nouveaux validateurs

## Priorité 1: Augmenter la testabilité

- [ ] **Augmenter la couverture des tests** : Développer des tests unitaires pour les fonctions récemment refactorisées suivant l'approche TDD.
  - Écrire d'abord les tests pour les modules de formatage (epic-formatter, feature-formatter, etc.)
  - S'assurer que les tests couvrent les cas limites (valeurs null/undefined, structures imbriquées)
  - Implémenter des mocks pour isoler les composants testés

- [ ] **Inversion de dépendance pour API Client** : Refactoriser en utilisant le pattern d'injection de dépendance.
  - Créer une interface/classe abstraite pour l'API client
  - Implémenter des adaptateurs concrets pour OpenAI, Groq, etc.
  - Écrire des tests avec des clients simulés

## Priorité 2: Refactorisation des fichiers trop longs

- [ ] **server/index.js (471 lignes)** : Refactoriser en appliquant TDD.
  - Écrire d'abord des tests pour les fonctions existantes
  - Extraire les handlers de commandes dans un module spécifique
  - Extraire la configuration MCP dans un module dédié
  - Maintenir un point d'entrée simple qui délègue aux modules spécialisés

- [ ] **server/lib/utils/schema-validator.js (482 lignes)** : Diviser en modules plus petits.
  - Écrire des tests pour chaque type de validation
  - Extraire les validations par type de schéma
  - Maintenir une interface cohérente

## Priorité 3: Amélioration de l'architecture

- [ ] **Structure MVC plus claire** : Réorganiser les fichiers avec des tests en place.
  - Définir clairement les couches (modèles, contrôleurs, services)
  - Migrer progressivement le code avec tests pour chaque composant
  - Maintenir la compatibilité ascendante

- [ ] **Standardiser la gestion des erreurs** : Unifier l'approche avec tests.
  - Créer une hiérarchie d'erreurs claire
  - Tester différents scénarios d'erreur
  - Implémenter un gestionnaire centralisé d'erreurs

## Priorité 4: Dette technique et optimisation

- [ ] **Simplifier les handlers MCP** : Décomposer en fonctions plus petites avec tests.
  - Écrire des tests d'intégration pour les handlers existants
  - Extraire les responsabilités en fonctions autonomes
  - Vérifier la rétrocompatibilité

- [ ] **Évaluer minimal-markdown-generator.js** : Déterminer si ce module est encore nécessaire.
  - Écrire des tests couvrant sa fonctionnalité
  - Si les tests passent avec le module principal, le supprimer
  - Sinon, documenter clairement sa raison d'être

## Priorité 5: Documentation et meilleures pratiques

- [ ] **JSDoc complet** : Documenter toutes les fonctions, classes et modules.
  - Commencer par les modules publics et critiques
  - Inclure des exemples d'utilisation
  - Générer une documentation API

- [ ] **Diagrammes d'architecture** : Créer des visualisations claires de l'architecture.
  - Diagramme de composants
  - Diagramme de séquence pour les flux principaux
  - Diagramme de classes pour les patterns utilisés

## Approche TDD pour toutes les tâches

Pour chaque tâche ci-dessus, nous suivrons rigoureusement l'approche TDD:

1. **RED**: Écrire des tests qui échouent pour la fonctionnalité attendue
2. **GREEN**: Implémenter le code minimal pour faire passer les tests
3. **REFACTOR**: Améliorer le code sans changer son comportement

Cette approche garantira que les améliorations maintiennent la fonctionnalité existante tout en améliorant la qualité du code.
