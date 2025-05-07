# Règles Projet Agile Planner - Wave 8

## RULE 1 — Refactorisation & TDD
- Appliquer systématiquement le **sequentialThinking** pour toute refactorisation :
  - Décomposer les étapes dans un fichier `refactor-plan.md` si plus de 20% du fichier est modifié
  - Justifier chaque étape pour éviter les breaking changes
- Utiliser **TDD (Test Driven Development)** pour chaque refactorisation ou ajout de fonctionnalité
- Respecter la **limite de 500 lignes max par fichier** (hors fichiers `.md`, de config ou de test)
- Préfixer les commits selon la convention suivante :
  - `feat:` pour les nouvelles fonctionnalités
  - `fix:` pour les corrections de bugs
  - `refactor:` pour les refactorisations
  - `docs:` pour les modifications de documentation
  - `test:` pour les ajouts ou modifications de tests
  - `chore:` pour les tâches de maintenance
  - `style:` pour les modifications de style (sans changement de logique)
- **RESPECTER le MCP (Model Context Protocol)** :
  - Utiliser `MCP server context7` pour guider le contexte IA et la documentation
  - Utiliser `MCP server brave-search` pour rechercher des solutions à des problèmes techniques spécifiques ou des patterns d'implémentation

## RULE 2 — Documentation, Versioning & Déploiement
- Avant tout **commit** :
  - Mettre à jour **tous les fichiers `.md`** (README, changelog…)
  - Mettre à jour **`CHANGELOG.md`** avec un résumé clair des modifications
  - Mettre à jour la **version dans `package.json`** selon les règles **SemVer** :
    - MAJOR = breaking change
    - MINOR = nouvelle fonctionnalité rétrocompatible
    - PATCH = bugfix ou amélioration mineure
- Les exemples windsurf doivent être mis à jour pour refléter les dernières modifications
- Vérifier que `package.json` contient **toutes les dépendances nécessaires** pour un déploiement fonctionnel sur npmjs.com

## RULE 3 — Structure des fichiers
```
.agile-planner-backlog/
├── epics/
│   └── [epic-slug]/
│       ├── epic.md
│       └── features/
│           └── [feature-slug]/
│               ├── feature.md
│               └── user-stories/
│                   ├── [story-1].md
│                   └── [story-2].md
├── planning/
│   ├── mvp/
│   │   └── mvp.md (liens vers les user stories réelles)
│   └── iterations/
│       └── [iteration-slug]/
│           └── iteration.md (liens vers les user stories réelles)
└── backlog.json
```

## RULE 4 — Design Patterns & Complexité
- Appliquer des design patterns uniquement lorsque cela est justifié (YAGNI, KISS)
- Documenter toute utilisation non triviale de pattern dans un fichier design.md
- Aucune fonction ne doit excéder 50 lignes
- Toute fonction ou classe ayant plus de 3 branches de logique doit être couverte par des tests unitaires
- Toujours commencer par écrire les tests (TDD) avant toute refactorisation ou évolution complexe

## RULE 5 — Validation craft & gestion des tâches
- Analyser l'ensemble du projet pour valider sa qualité craft :
  - Respect des patterns
  - Séparation des responsabilités
  - Simplicité & lisibilité
- Si des actions sont nécessaires, créer un fichier TASKS.md à la racine :
  - exemple : - [ ] Améliorer la lisibilité du module de filtrage *(test: filter.spec.js)*
  - Une fois la tâche réalisée et testée (TDD ou test unitaire), cocher la case

## RULE 6 — Qualité & Review automatique
La CI doit inclure :
- Linting (eslint, prettier, ou équivalent)
- Vérification des .md (liens, structures, lastUpdated)
- Hooks Git pour automatiser les vérifications avant commit/push :
  - `pre-commit` : vérifie les fichiers .md, le CHANGELOG, les tests et la taille des fichiers
  - `commit-msg` : vérifie le format des messages de commit
  - `pre-push` : exécute les tests et vérifie que la branche est à jour

Voir le fichier `.windsurf/git-config.md` pour la configuration détaillée des hooks.

## RULE 7 — Documentation visuelle avec Mermaid
- Utiliser **Mermaid** pour créer des diagrammes dans la documentation :
  - **Diagrammes de flux** pour les processus et algorithmes
  - **Diagrammes de séquence** pour les interactions entre composants
  - **Diagrammes de classe** pour la structure des données et des classes
  - **Diagrammes d'état** pour les transitions d'état
  - **Diagrammes de Gantt** pour la planification
- Respecter les bonnes pratiques :
  - Limiter chaque diagramme à un seul concept (7±2 éléments maximum)
  - Utiliser des noms clairs et descriptifs
  - Maintenir les diagrammes à jour avec le code
  - Ajouter des explications contextuelles
- Placer les diagrammes aux emplacements suivants :
  - Architecture générale : `docs/architecture.md`
  - Spécifiques à un module : `docs/modules/[module-name].md`
  - Flux de processus : Dans les READMEs des dossiers concernés

Voir le fichier `.windsurf/workflows/mermaid-workflow.md` pour des exemples et des instructions détaillées.

## RULE 8 — Workflows & Processus
- Suivre les workflows définis dans le dossier `.windsurf/workflows/` :
  - **TDD Workflow** : Pour le développement de nouvelles fonctionnalités et corrections
  - **Quality Analysis Workflow** : Pour l'analyse systématique de la qualité du code
  - **Release Workflow** : Pour la préparation et publication des versions
  - **Git Workflow** : Pour les pratiques Git standardisées
  - **Backlog Workflow** : Pour la gestion de la structure du backlog

Voir le fichier `.windsurf/workflows/README.md` pour une description complète de tous les workflows et de leur utilisation dans Wave 8.

## RULE 9 — Documentation API avec JSONDoc
- Utiliser **JSONDoc** pour documenter toutes les APIs du projet :
  - Documenter **tous les endpoints** avec des annotations complètes
  - Inclure des **exemples de requêtes et réponses** pour chaque endpoint
  - Documenter les **paramètres, codes de retour et structures de données**
  - Spécifier les **versions de l'API** pour chaque endpoint
- Organiser la documentation par groupes logiques :
  - Backlog, Epic, Feature, UserStory, etc.
  - Utiliser des préfixes cohérents pour les noms d'API
- Maintenir la documentation à jour :
  - Générer la documentation à chaque modification d'API
  - Vérifier que le playground fonctionne correctement
  - Inclure la documentation dans les tests de CI

Voir le fichier `.windsurf/workflows/jsondoc-workflow.md` pour des instructions détaillées et des exemples.

## RULE 10 — Utilisation des MCP Servers
- **context7** : Pour toute documentation technique (frameworks, librairies, APIs)
  - Commencer avec 5000 tokens, augmenter à 20000 si nécessaire
  - Maximum de 3 recherches par sujet
- **sequential-thinking** : Pour la résolution de problèmes complexes et l'architecture
  - Appliquer le principe KISS avant exploration approfondie
- **brave-search** : Dans les cas suivants :
  - Recherche de solutions à des bugs spécifiques non documentés
  - Exploration des meilleures pratiques actuelles (2025) pour l'architecture Agile
  - Veille technologique sur les évolutions des frameworks utilisés
  - Recherche d'exemples concrets d'implémentation pour des cas complexes
  - Validation des approches techniques contre les standards de l'industrie
