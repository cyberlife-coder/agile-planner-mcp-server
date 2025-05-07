# Workflow de Gestion du Backlog - Agile Planner

## Description
Ce workflow guide le développeur à travers le processus de création et de gestion du backlog dans le projet Agile Planner. Il assure que la structure hiérarchique (epics > features > user stories) est correctement maintenue, que les liens entre les éléments sont cohérents et que le fichier backlog.json est à jour. Ce workflow est essentiel pour maintenir une organisation claire des fonctionnalités et faciliter la planification des itérations.

## Utilisation dans Wave 8
Dans Wave 8, ce workflow peut être déclenché manuellement lors de la création ou modification du backlog, ou automatiquement lorsque vous modifiez des fichiers dans le dossier `.agile-planner-backlog/`. Windsurf vous guidera à travers chaque étape et vérifiera que la structure respecte les standards définis dans les règles du projet.

## Déclencheur
- Lors de la création d'une nouvelle epic, feature ou user story
- Lors de la planification d'une itération ou d'un MVP
- Lors de la réorganisation du backlog

## Étapes

### 1. Création d'une Epic
1. **Créer le dossier et le fichier epic**
   ```bash
   mkdir -p .agile-planner-backlog/epics/[epic-slug]
   touch .agile-planner-backlog/epics/[epic-slug]/epic.md
   ```

2. **Remplir le fichier epic.md avec le template suivant**
   ```markdown
   # Epic: [Titre de l'Epic]

   ## Description
   [Description détaillée de l'epic]

   ## Objectifs
   - [Objectif 1]
   - [Objectif 2]

   ## Critères d'acceptation
   - [ ] [Critère 1]
   - [ ] [Critère 2]

   ## Features associées
   <!-- Ne pas modifier manuellement cette section, elle sera mise à jour automatiquement -->

   ## Métadonnées
   - **ID**: `[epic-slug]`
   - **Priorité**: [Haute/Moyenne/Basse]
   - **Statut**: [À faire/En cours/Terminé]
   - **Date de création**: YYYY-MM-DD
   - **Dernière mise à jour**: YYYY-MM-DD
   ```

### 2. Création d'une Feature
1. **Créer le dossier et le fichier feature**
   ```bash
   mkdir -p .agile-planner-backlog/epics/[epic-slug]/features/[feature-slug]
   touch .agile-planner-backlog/epics/[epic-slug]/features/[feature-slug]/feature.md
   ```

2. **Remplir le fichier feature.md avec le template suivant**
   ```markdown
   # Feature: [Titre de la Feature]

   ## Description
   [Description détaillée de la feature]

   ## User Stories associées
   <!-- Ne pas modifier manuellement cette section, elle sera mise à jour automatiquement -->

   ## Métadonnées
   - **ID**: `[feature-slug]`
   - **Epic parent**: `[epic-slug]`
   - **Priorité**: [Haute/Moyenne/Basse]
   - **Statut**: [À faire/En cours/Terminé]
   - **Date de création**: YYYY-MM-DD
   - **Dernière mise à jour**: YYYY-MM-DD
   ```

### 3. Création d'une User Story
1. **Créer le fichier user story**
   ```bash
   mkdir -p .agile-planner-backlog/epics/[epic-slug]/features/[feature-slug]/user-stories
   touch .agile-planner-backlog/epics/[epic-slug]/features/[feature-slug]/user-stories/[story-slug].md
   ```

2. **Remplir le fichier user story avec le template suivant**
   ```markdown
   # User Story: [Titre de la User Story]

   ## Description
   En tant que [persona], je veux [action] afin de [bénéfice].

   ## Critères d'acceptation
   - [ ] [Critère 1]
   - [ ] [Critère 2]

   ## Tâches techniques
   - [ ] [Tâche 1]
   - [ ] [Tâche 2]

   ## Métadonnées
   - **ID**: `[story-slug]`
   - **Feature parent**: `[feature-slug]`
   - **Priorité**: [Haute/Moyenne/Basse]
   - **Points**: [Estimation en points]
   - **Statut**: [À faire/En cours/Terminé]
   - **Itération**: `[iteration-slug]` (si assignée)
   - **MVP**: `[mvp-slug]` (si incluse dans un MVP)
   - **Date de création**: YYYY-MM-DD
   - **Dernière mise à jour**: YYYY-MM-DD
   ```

### 4. Planification d'une Itération
1. **Créer le dossier et le fichier itération**
   ```bash
   mkdir -p .agile-planner-backlog/planning/iterations/[iteration-slug]
   touch .agile-planner-backlog/planning/iterations/[iteration-slug]/iteration.md
   ```

2. **Remplir le fichier iteration.md avec le template suivant**
   ```markdown
   # Itération: [Titre de l'Itération]

   ## Objectifs
   [Objectifs de l'itération]

   ## Dates
   - **Début**: YYYY-MM-DD
   - **Fin**: YYYY-MM-DD

   ## User Stories
   <!-- Liste des user stories incluses dans cette itération -->
   - [ ] [Lien vers user story 1]
   - [ ] [Lien vers user story 2]

   ## Métadonnées
   - **ID**: `[iteration-slug]`
   - **Capacité**: [Points disponibles]
   - **Points planifiés**: [Somme des points des user stories]
   - **Statut**: [À venir/En cours/Terminée]
   - **Date de création**: YYYY-MM-DD
   - **Dernière mise à jour**: YYYY-MM-DD
   ```

### 5. Génération du backlog.json
1. **Exécuter le script de génération du backlog**
   ```bash
   node scripts/generate-backlog.js
   ```

2. **Vérifier le fichier backlog.json généré**
   ```bash
   cat .agile-planner-backlog/backlog.json
   ```

### 6. Mise à jour des liens
1. **Mettre à jour les liens entre les éléments**
   ```bash
   node scripts/update-backlog-links.js
   ```

2. **Vérifier que les liens sont correctement mis à jour dans les fichiers markdown**

## Validation
- Structure de dossiers et fichiers conforme à RULE 3
- Tous les fichiers markdown respectent les templates définis
- Le fichier backlog.json est à jour et cohérent avec les fichiers markdown
- Les liens entre les éléments sont correctement établis

## Outils MCP à utiliser
- `sequential-thinking` pour planifier la structure du backlog
- `context7` pour vérifier les meilleures pratiques de gestion de backlog agile
- `brave-search` pour :
  - Explorer les tendances actuelles en matière de gestion de backlog
  - Rechercher des exemples de structures de backlog efficaces
  - Identifier les meilleures pratiques pour la rédaction des user stories
