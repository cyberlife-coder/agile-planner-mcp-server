---
trigger: always_on
---

# Règles Projet Agile Planner – Wave 8

L'utilisateur utilise Windows 11 Pro

## RULE 1 – Refactorisation & TDD  
- Appliquer le tool MCP server **sequentialThinking** pour toute refactorisation > 20 % : créer `refactor-plan.md` avec justification.  
- Utiliser **TDD** systématiquement (tests avant dev).  
- Limite de **500 lignes/fichier** (hors `.md`, tests, configs).  
- Préfixer les commits :  
  - `feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:` / `style:`  
- Utiliser le **MCP** :  
  - `context7` : documentation technique et contexte  
  - `brave-search` : bugs techniques, bonnes pratiques, veille

## RULE 2 – Documentation, Versioning & Déploiement  
- Avant chaque commit :  
  - Mettre à jour tous les `.md` (README, changelog, etc.)  
  - Mettre à jour `CHANGELOG.md` avec un résumé clair  
  - Mettre à jour la version dans `package.json` (SemVer : MAJOR/MINOR/PATCH)  
  - Vérifier les dépendances dans `package.json`  
- Mettre à jour les exemples **windsurf** si nécessaire  
- Préparer pour un déploiement fonctionnel sur npmjs

## RULE 3 – Structure des fichiers  
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

## RULE 4 – Design Patterns & Complexité  
- Appliquer des patterns uniquement si justifiés (KISS, YAGNI)  
- Documenter dans `design.md`  
- Fonction : max 50 lignes  
- Si > 3 branches de logique : couverture de tests obligatoire

## RULE 5 – Validation Craft & Tâches  
- Vérifier la qualité globale (patterns, lisibilité, responsabilités)  
- Créer `TASKS.md` si actions requises  
  - Exemple : `- [ ] Améliorer le module de filtrage (test: filter.spec.js)`  
  - Cocher une fois terminé et testé

## RULE 6 – Qualité & CI Automatique  
- CI : linting, vérification `.md`, exécution des tests  
- Git hooks à activer :  
  - `pre-commit` : vérifie `.md`, changelog, tests, taille fichiers  
  - `commit-msg` : vérifie le format du commit  
  - `pre-push` : exécute les tests et vérifie la branche  
- Configuration détaillée : `.windsurf/git-config.md`

## RULE 7 – Documentation visuelle avec Mermaid  
- Types de diagrammes :  
  - flux, séquence, classe, état, Gantt  
- Bonnes pratiques :  
  - un seul concept par diagramme (7±2 éléments max)  
  - noms clairs, diagrammes à jour, explications contextuelles  
- Emplacements :  
  - `docs/architecture.md` (global)  
  - `docs/modules/[module].md` (module)  
  - README du dossier concerné  
- Exemples : `.windsurf/workflows/mermaid-workflow.md`

## RULE 8 – Workflows & Processus  
- Suivre les workflows dans `.windsurf/workflows/` :  
  - TDD, Quality Analysis, Release, Git, Backlog  
- Voir `.windsurf/workflows/README.md` pour les détails

## RULE 9 – Documentation API avec JSONDoc  
- Documenter tous les endpoints :  
  - annotations, exemples, paramètres, versions, status codes  
- Organiser par groupes logiques (Backlog, Epic, etc.)  
- Préfixes API cohérents  
- Maintien à jour, génération à chaque modification  
- Vérification dans la CI  
- Voir `.windsurf/workflows/jsondoc-workflow.md` pour les instructions

## RULE 10 – Utilisation des MCP Servers  
- `context7` : documentation technique (5000 à 20000 tokens, max 3 recherches/sujet)  
- `sequentialthinking` : résolution de problèmes complexes (appliquer KISS avant approfondissement)  
- `brave-search` :  
  - bugs spécifiques non documentés  
  - meilleures pratiques 2025, veille techno  
  - exemples concrets, validation technique