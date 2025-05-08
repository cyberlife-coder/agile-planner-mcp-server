# Patterns de Conception et Architecture

Ce document présente les patterns de conception utilisés dans le projet Agile Planner MCP Server, conformément aux principes SOLID, KISS (Keep It Simple, Stupid) et YAGNI (You Aren't Gonna Need It).

## Patterns de Conception

### 1. Factory Pattern

**Modules concernés:**
- `server/lib/markdown/epic-formatter.js` → `createEpicFormatter`
- `server/lib/markdown/feature-formatter.js` → `createFeatureFormatter`
- `server/lib/markdown/mvp-formatter.js` → `createMvpFormatter`
- `server/lib/markdown/iteration-formatter.js` → `createIterationFormatter`

**Description:**
Ce pattern est utilisé pour créer des formatters spécialisés qui encapsulent la logique de formatage pour différents types d'éléments agiles. Chaque factory retourne une API avec des méthodes spécifiques au type d'élément.

**Avantages:**
- Encapsulation de la logique de création
- Interface cohérente pour les différents formatters
- Facilité d'extension pour de nouveaux types d'éléments

### 2. Builder Pattern

**Modules concernés:**
- `server/lib/markdown/story-formatter.js` → `UserStoryBuilder`

**Description:**
Le pattern Builder est utilisé pour construire des représentations complexes de user stories en markdown de manière progressive. Cela permet de construire le contenu étape par étape avec une interface fluide.

**Avantages:**
- Construction étape par étape de contenus complexes
- Interface fluide (chaînage de méthodes)
- Séparation entre la construction et la représentation

### 3. Module Pattern

**Modules concernés:**
- Organisation générale du code avec des exports CommonJS

**Description:**
L'utilisation du système de modules Node.js pour encapsuler la fonctionnalité et exposer uniquement les API publiques.

**Avantages:**
- Encapsulation des détails d'implémentation
- Limitation de la portée des variables
- Organisation claire du code

### 4. Strategy Pattern

**Modules implémentés:**
- `server/lib/utils/validators/schema-validator-strategy.js`
- `server/lib/utils/validators/user-story-validator.js`
- `server/lib/utils/validators/feature-validator.js`
- `server/lib/utils/validators/epic-validator.js`
- `server/lib/utils/validators/iteration-validator.js`
- `server/lib/utils/validators/backlog-validator.js`
- `server/lib/utils/validators/validators-factory.js`

**Description:**
Le pattern Strategy a été implémenté pour encapsuler différentes stratégies de validation dans des objets distincts, rendant le code plus modulaire et testable. Chaque validateur est spécialisé pour un type d'entité spécifique (user story, feature, epic, iteration, backlog) et implémente une interface commune.

**Avantages obtenus:**
- Découplage entre les différentes logiques de validation
- Facilité d'extension pour ajouter de nouveaux validateurs
- Amélioration de la testabilité (100% de couverture pour les validateurs)
- Réduction de la complexité cognitive des fonctions
- Maintenance simplifiée grâce à la séparation des responsabilités

**Factory Pattern pour les validateurs:**
Un Factory Pattern a été implémenté dans `validators-factory.js` pour centraliser la création des validateurs et fournir une interface unifiée pour les clients. Cette approche facilite la migration progressive depuis l'ancien système de validation.

## Principes Architecturaux

### Séparation des Responsabilités

Le code est organisé en modules avec des responsabilités distinctes:
- `lib/markdown/` - Formatage de contenu markdown
- `lib/utils/` - Utilitaires et validations
- `lib/` - Logique métier et génération

### API Progressive

Les modules exposent des API progressives qui permettent:
- Utilisation simple pour les cas basiques
- Options avancées pour les cas complexes
- Configuration flexible

## Refactorisations Réalisées

### Refactorisation du système de validation (v1.2.1)

Le pattern Strategy a été appliqué avec succès pour:
- Créer des validateurs spécialisés par type d'entité (UserStory, Feature, Epic, Iteration, Backlog)
- Implémenter une Factory pour centraliser l'accès aux validateurs
- Réduire la complexité cognitive des fonctions
- Améliorer la testabilité avec une couverture de 100% pour les validateurs
- Maintenir la compatibilité avec l'ancien système via les formats d'erreur standardisés
- Faciliter la migration progressive avec des exemples d'intégration

### Approche TDD

La refactorisation a suivi une approche TDD (Test-Driven Development) rigoureuse:
1. Écriture des tests pour chaque validateur spécialisé
2. Implémentation des validateurs pour faire passer les tests
3. Refactorisation pour améliorer la qualité du code
4. Vérification continue de la compatibilité avec l'ancien système

Cette approche a permis de maintenir une haute qualité de code tout en réduisant les risques de régression.

### Documentation

La documentation a été améliorée avec:
- Mise à jour du CHANGELOG.md
- Création de TESTING-GUIDE.md
- Identification des fichiers obsolètes dans OBSOLETE-FILES.md
- Exemples d'utilisation dans examples/validators-usage.js
- Exemples d'intégration progressive dans examples/migration-integration.js

### Prochaines étapes

- Terminer la migration progressive vers le nouveau système de validation
- Supprimer les fichiers obsolètes une fois la migration terminée
- Appliquer le pattern Mediator pour refactoriser `index.js`
- Continuer à améliorer la couverture de tests
