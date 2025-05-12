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
- Créer des validateurs spécialisés par type d'entité (UserStory, Feature, Epic, Backlog)
- Implémenter une Factory pour centraliser l'accès aux validateurs
- Réduire la complexité cognitive des fonctions
- Améliorer la testabilité avec une couverture de 100% pour les validateurs
- Faciliter la migration progressive avec des exemples d'intégration

---

## Flux et responsabilités de generateFeature

- **Entrée** : Requête JSON-RPC ou CLI avec description de la feature
- **Parsing/Validation** : Parsing des paramètres, validation de la structure
- **Génération** : Création de la feature et de ses user stories (générées par LLM ou règles internes)
- **Génération fichiers** : Création de `feature.md` et des fichiers user-stories associés dans `.agile-planner-backlog/`
- **Validation** : Vérification de la conformité des fichiers markdown générés (RULE 3)
- **Sortie** : Résultat JSON (feature + user stories) et écriture sur disque

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

## Refactorisation du module CLI (v1.7.0)

### Module Pattern avec Hiérarchie 

**Modules concernés:**
- `server/lib/cli/index.js` → Point d'entrée et coordination
- `server/lib/cli/utils.js` → Utilitaires et fonctions de support
- `server/lib/cli/backlog.js` → Génération de backlogs
- `server/lib/cli/feature.js` → Génération de features

**Description:**
Refactorisation complète du module CLI pour diviser le monolithique `cli.js` (608 lignes) en modules spécialisés avec une séparation claire des responsabilités. Un module façade de compatibilité garantit la rétro-compatibilité avec le code existant.

**Avantages:**
- Conformité avec la RULE 1 (≤ 500 lignes par fichier)
- Meilleure séparation des responsabilités selon le principe SRP (Single Responsibility Principle)
- Réduction de la complexité cognitive par fichier
- Maintenance facilitée avec des modules spécialisés
- Documentation améliorée avec JSDoc

### Object Sharing Pattern

**Modules impliqués:**
- `server/lib/cli/index.js`
- `server/lib/cli/backlog.js`
- `server/lib/cli/feature.js`

**Description:**
Implantation d'un mécanisme intelligent de partage d'objets clients API entre les fonctions pour éviter la réinitialisation inutile et améliorer les performances.

**Avantages:**
- Réduction des ressources consommées
- Amélioration des performances en évitant les initialisations redundantes
- Passage explicite de dépendances plutôt que l'utilisation de dépendances globales

### Module de compatibilité (Adapter Pattern)

**Modules concernés:**
- `server/lib/cli.js` (module façade)
- `server/lib/markdown-generator.js` (module façade)

**Description:**
Création de modules façade qui agissent comme des adaptateurs pour maintenir la compatibilité avec le code existant tout en redirigeant vers la nouvelle architecture modulaire.

**Avantages:**
- Migration progressive sans rupture de compatibilité
- Possibilité de test A/B entre ancienne et nouvelle implémentation
- Isolation des changements d'architecture des interfaces publiques

## Réduction de la Complexité Cognitive (v1.7.1)

### Pattern d'Extraction de Méthode (Extract Method)

**Modules refactorisés:**
- `server/lib/utils/json-parser.js` → `parseJsonResponse` (complexité réduite de 31 à < 15)
- `server/lib/mcp-router.js` → `_createRule3Structure` (complexité réduite de 24 à < 15)
- `server/index.js` → `handleGenerateBacklogCommand` et `handleGenerateFeatureCommand`

**Description:**
Application systématique du pattern d'extraction de méthode pour décomposer les fonctions complexes en sous-fonctions avec des responsabilités uniques. Cette approche a permis de réduire significativement la complexité cognitive des fonctions, améliorant ainsi leur lisibilité, maintenabilité et testabilité.

#### Principaux refactorings

**1. json-parser.js:**
```javascript
// Avant: Une fonction monolithique de complexité 31
function parseJsonResponse(content, debug = false) {
  // 30+ lignes de code imbriquées
}

// Après: Fonction principale simple avec délégation
function parseJsonResponse(content, debug = false) {
  return _executeParsingProcess(content, debug);
}

// Sous-fonctions spécialisées
function _executeParsingProcess(content, debug) { /* ... */ }
function _processContentParsing(content, debug) { /* ... */ }
function _handleParsingError(error) { /* ... */ }
```

**2. mcp-router.js:** Décomposition de `_createRule3Structure` en 6 sous-fonctions spécialisées:
- `_createBaseStructure`: création des répertoires de base
- `_createEpicsStructure`: itération sur les epics
- `_createEpicStructure`: gestion d'un epic spécifique
- `_createFeaturesStructure`: itération sur les features
- `_createFeatureStructure`: gestion d'une feature spécifique
- `_createReadmeFile`: génération du README

**Avantages:**
- Conformité avec la limite de complexité cognitive < 15 (SonarQube)
- Suivi strict de la RULE 4 (max 50 lignes par fonction)
- Possibilité de test unitaire des fonctions individuelles
- Code plus lisible avec des noms de fonction explicites
- Meilleure encapsulation avec des responsabilités clairement définies

### Pattern de Protection des Données (Defensive Programming)

**Modules refactorisés:**
- `server/index.js`

**Description:**
Application systématique du chaînage optionnel (`?.`) et de l'opérateur de coalescence des nuls (`??`) pour améliorer la robustesse du code face aux valeurs undefined ou null. Cette approche s'accompagne d'une sécurisation du traitement des erreurs pour garantir une expérience utilisateur optimale.

**Avantages:**
- Élimination des risques de plantage sur des propriétés undefined
- Traçabilité améliorée des erreurs avec capture des stack traces
- Simplification des conditions complexes
- Protection contre la sérialisation d'objets circulaires

---

### Prochaines étapes

- Terminer la migration progressive vers le nouveau système de validation
- Appliquer la même approche de modularisation aux autres composants monolithiques
- Supprimer les fichiers obsolètes une fois la migration terminée
- Appliquer le pattern Mediator pour refactoriser `index.js`
- Continuer à améliorer la couverture de tests
- Ajouter un diagramme Mermaid illustrant l'architecture modulée et les interactions
