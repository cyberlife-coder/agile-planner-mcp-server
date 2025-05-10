---
description: Guide concernant tous les Workflows Agile Planner
---

# Workflows Agile Planner - Wave 8

## Introduction

Ce dossier contient les workflows définis pour le projet Agile Planner dans le cadre de la configuration Wave 8 de Windsurf. Ces workflows standardisent les processus de développement, assurent la qualité du code et facilitent la collaboration au sein de l'équipe.

## Mapping rapide : Rule → Workflow → Fichier

| Règle | Workflow associé | Fichier principal |
|-------|------------------|------------------|
| RULE 1 (Refactorisation & TDD) | TDD | tdd-workflow.md |
| RULE 2 (Documentation, Versioning & Déploiement) | Release | release-workflow.md |
| RULE 3 (Structure des fichiers) | Backlog | backlog-workflow.md |
| RULE 4 (Design Patterns & Complexité) | Analyse de Qualité | quality-analysis-workflow.md |
| RULE 5 (Validation craft & gestion des tâches) | Analyse de Qualité | quality-analysis-workflow.md |
| RULE 6 (Qualité & Review automatique) | Git (hooks) | git_workflow.md, ../git_config.md |
| RULE 7 (Documentation visuelle avec Mermaid) | Mermaid | mermaid_workflow.md |
| RULE 8 (Workflows & Processus) | Tous | Ce dossier |
| RULE 9 (Documentation API avec JSONDoc) | JSONDoc | jsondoc_workflow.md |
| RULE 10 (Utilisation des MCP Servers) | Tous | Ce dossier |


## Utilisation des workflows dans Wave 8

Dans Wave 8, les workflows peuvent être utilisés de trois manières différentes :

### 1. Déclenchement automatique

Wave 8 peut déclencher automatiquement les workflows en fonction de certains événements :

- **Workflow TDD** : Déclenché lors de la création d'une branche `feature/*` ou `bugfix/*`
- **Workflow Git** : Intégré aux opérations Git quotidiennes
- **Workflow d'Analyse de Qualité** : Exécuté périodiquement (hebdomadaire)
- **Workflow de Release** : Déclenché lors de la création d'une branche `release/*`

### 2. Déclenchement manuel

Vous pouvez également déclencher manuellement un workflow via l'interface Windsurf :

1. Ouvrez le panneau Windsurf dans votre éditeur
2. Accédez à la section "Workflows"
3. Sélectionnez le workflow souhaité
4. Cliquez sur "Exécuter"

### 3. Guidance contextuelle

Wave 8 peut également vous guider à travers les étapes d'un workflow en fonction du contexte :

- Lors de la modification de fichiers de code, Windsurf peut vous rappeler les étapes du workflow TDD
- Avant un commit, Windsurf peut vous rappeler de mettre à jour la documentation et le CHANGELOG
- Avant une release, Windsurf peut vous guider à travers le workflow de release

## Workflows disponibles

| Workflow | Fichier | Description | Déclencheurs |
|----------|---------|-------------|--------------|
| **TDD** | [tdd_workflow.md](./tdd_workflow.md) | Guide le développeur à travers le processus Test-Driven Development | Nouvelle fonctionnalité, correction de bug, refactorisation |
| **Release** | [release_workflow.md](./release_workflow.md) | Standardise le processus de préparation et publication d'une version | Avant une nouvelle version |
| **Analyse de Qualité** | [quality_analysis_workflow.md](./quality_analysis_workflow.md) | Analyse systématiquement la qualité du code | Hebdomadaire, avant commit important, avant release |
| **Git** | [git_workflow.md](./git_workflow.md) | Définit les pratiques Git standardisées | Continu, intégré aux opérations Git |
| **Backlog** | [backlog_workflow.md](./backlog_workflow.md) | Guide la création et la gestion du backlog | Création/modification d'epics, features, user stories |
| **Mermaid** | [mermaid_workflow.md](./mermaid_workflow.md) | Guide la création de diagrammes pour documenter l'architecture | Nouveau module, modification d'architecture |
| **JSONDoc** | [jsondoc_workflow.md](./jsondoc_workflow.md) | Guide la documentation des APIs avec JSONDoc | Création/modification d'endpoints API |

## Configuration des hooks Git

Les hooks Git définis dans [git_config.md](../git_config.md) automatisent certaines vérifications pour garantir le respect des règles du projet. Pour les installer :

1. Créez un script `setup-git-hooks.sh` à la racine du projet en utilisant le contenu fourni dans le fichier git-config.md
2. Exécutez le script : `bash setup-git-hooks.sh`

## Intégration avec les règles du projet

Ces workflows sont conçus pour fonctionner en harmonie avec les [règles du projet](../rules.md) :

- **RULE 1** (Refactorisation & TDD) → Workflow TDD
- **RULE 2** (Documentation, Versioning & Déploiement) → Workflow de Release
- **RULE 3** (Structure des fichiers) → Workflow de Backlog
- **RULE 4** (Design Patterns & Complexité) → Workflow d'Analyse de Qualité
- **RULE 5** (Validation craft & gestion des tâches) → Workflow d'Analyse de Qualité
- **RULE 6** (Qualité & Review automatique) → Hooks Git
- **RULE 7** (Documentation visuelle avec Mermaid) → Workflow Mermaid
- **RULE 8** (Workflows & Processus) → Tous les workflows
- **RULE 9** (Documentation API avec JSONDoc) → Workflow JSONDoc
- **RULE 10** (Utilisation des MCP Servers) → Tous les workflows

## Personnalisation

Vous pouvez personnaliser ces workflows en modifiant les fichiers correspondants. Wave 8 prendra en compte ces modifications lors de l'exécution des workflows.

## Ajout de nouveaux workflows

Pour ajouter un nouveau workflow :

1. Créez un fichier `nom-du-workflow.md` dans ce dossier
2. Suivez la structure des workflows existants
3. Ajoutez une référence au nouveau workflow dans ce README

---

Dernière mise à jour : 2025-05-07
