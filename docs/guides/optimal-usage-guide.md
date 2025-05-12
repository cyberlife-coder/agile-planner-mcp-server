# Agile Planner: Optimal Workflow avec les clients MCP (v1.7.2)

**Date de dernière modification:** 12/05/2025  
**Version actuelle:** 1.7.2

## 1. Introduction

Ce document décrit la méthode la plus efficace pour utiliser le serveur Agile Planner MCP avec différents clients compatibles MCP comme **Windsurf Cascade**, **Claude.ai** et **Cursor**. L'accent est mis sur un **workflow synergique** qui tire parti d'autres serveurs MCP puissants comme `Context7` (pour la documentation et le contexte) et `SequentialThinking` (pour la planification d'entrées complexes) afin de maximiser la qualité et la pertinence des artefacts générés par Agile Planner (`generateBacklog` et `generateFeature`).

Plutôt que d'appeler directement les outils d'Agile Planner avec des descriptions basiques, ce workflow met l'accent sur **l'élaboration, la recherche et la planification structurée** comme étapes préliminaires avec votre assistant IA.

## 2. Le workflow synergique expliqué

Ce workflow recommandé s'intègre parfaitement dans une conversation avec n'importe quel client MCP compatible:

1.  **Idea / Requirement (User Input):**
    *   The user expresses a need (new project backlog, new feature).
    *   *Example:* "Cascade, we need a feature for user profile editing."

2.  **Elaboration / Research (Cascade + `Context7` / `Brave Search` / Memories):**
    *   Cascade gathers context for the request.
    *   **Crucially, check for existing plans/constraints:** Use `Context7` (if docs are indexed), retrieve relevant Cascade **Memories**, or ask the user about existing architectural decisions or implementation guidelines related to this area.
    *   Use `Context7`/`Brave Search` for external best practices or API docs if needed.
    *   *Example Cascade Action:* "Understood. Before planning, let me check our project memories and `Context7` for any existing decisions regarding user data handling or preferred UI libraries for profile sections... Found a memory indicating we use React Hook Form for forms."

3.  **Structured Planning (Cascade + `SequentialThinking`):**
    *   Cascade uses `SequentialThinking` to break down the requirement, incorporating research findings **and** existing constraints/plans identified in the previous step.
    *   This creates a detailed, context-aware `projectDescription` or `featureDescription`.
    *   *Example Cascade Action:* "Okay, planning with `SequentialThinking`, considering the requirement to use React Hook Form..."

4.  **Generation (Cascade + Agile Planner MCP):**
    *   Cascade calls `mcp0_generateBacklog` or `mcp0_generateFeature` with the rich, structured description.
    *   *Example Cascade Action:* "Calling `mcp0_generateFeature` with the detailed plan for profile editing, including React Hook Form considerations."

5.  **Review & Refinement (User + Cascade + `edit_file`):**
    *   User reviews the output.
    *   Cascade uses `edit_file` for adjustments. Optionally, Cascade *could* be asked to add an initial status marker like `[Status: Generated]` here, but ongoing tracking is separate.

## 3. Structure hiérarchique (v1.7.1)

Depuis la version 1.7.1, Agile Planner organise vos éléments dans une structure hiérarchique claire conforme à la RULE 3:

```
.agile-planner-backlog/
├── backlog.json
├── epics/
│   └── [epic-slug]/
│       ├── epic.md
│       └── features/
│           └── [feature-slug]/
│               ├── feature.md
│               └── user-stories/
│                   └── [story-slug].md
└── orphan-stories/
    └── [story-slug].md
```

Cette organisation hiérarchique améliore considérablement la traçabilité et facilite la navigation entre les différents niveaux du backlog.

### Améliorations de la version 1.7.1

La version 1.7.1 apporte des améliorations significatives :

- **Architecture MCP complète** : Support complet du protocole JSON-RPC 2.0
- **Compatibilité multi-client** : Claude.ai, Cursor et Windsurf IDE
- **Génération markdown améliorée** : Architecture modulaire pour une meilleure maintenabilité
- **Réduction de la complexité cognitive** : Refactorisation des modules critiques
- **Documentation complète** : Guides détaillés pour l'intégration et l'utilisation
- **Tests E2E optimisés** : Validation automatique des flux MCP
- Une meilleure gestion des chemins de fichiers (utilisation systématique de chemins absolus)
- Une validation renforcée des données d'entrée
- L'utilisation des IDs directs au lieu des slugs générés

> **Important**: La version 1.2.0 corrige un problème critique avec l'outil MCP `generateBacklog` qui empêchait parfois la création correcte de la structure hiérarchique. Si vous utilisiez une version antérieure, assurez-vous de mettre à jour vers cette version pour bénéficier d'une génération de backlog plus fiable.

## 4. Pragmatic Example: Generating a Feature Aligned with Plans

(Adapting the previous Stripe example slightly to show plan adherence)

**USER:** "Cascade, let's plan the feature for adding Stripe payments to our checkout page."

**CASCADE:** "Okay. First, let me check project documentation via `Context7` and our memories for any specific guidelines on payment integrations... Found a guideline: 'All external payment processing must happen server-side for security compliance'. Now, shall I consult the Stripe Node.js docs via `Context7` for the standard server-side Payment Intent flow?"

**USER:** "Yes, please do."

**CASCADE:** *(Hypothetically uses `Context7`)* "Got it. Now, let's use `SequentialThinking` to structure the feature plan, incorporating the server-side processing requirement and the Stripe flow details..."

**CASCADE:** *(Hypothetically uses `SequentialThinking`)* "Okay, the detailed description is ready, emphasizing server-side PaymentIntent creation. Shall I generate the feature using `mcp0_generateFeature`?"

**USER:** "Yes, proceed."

**CASCADE:** *(Calls `mcp0_generateFeature`)* "Done. Generated files are in the hierarchical structure under `.agile-planner-backlog/epics/[epic-name]/features/stripe-payments/`. Please review."

**USER:** "Looks aligned. Can you add `[Status: Generated]` to each user story title?"

**CASCADE:** *(Calls `edit_file` to add the status marker)* "Done. I've updated all user stories in the `.agile-planner-backlog/epics/[epic-name]/features/stripe-payments/user-stories/` directory."

## 5. Intégration MCP avec différents clients

Depuis la version 1.7.1, Agile Planner peut être utilisé avec plusieurs clients MCP. Voici comment l'intégrer avec chacun d'eux :

*Workspace Rules* are generally preferred here as they associate this specific synergistic behavior with the Agile Planner project/workspace, rather than applying it globally to all Cascade interactions.

### Windsurf IDE / Cascade

1. Ouvrez les paramètres de Windsurf IDE
2. Allez dans "IA > Cascade > Serveurs MCP"
3. Ajoutez Agile Planner avec la commande : `npx agile-planner --mcp`
4. Ajoutez dans le champ Description : `Générateur d'artefacts Agile (backlog, features, stories)`
5. Options avancées : Vous pouvez ajouter des arguments comme `--config=./config.json` pour personnaliser la configuration

Exemple d'utilisation en conversation :
```
USER: Générer un backlog pour notre application de gestion de tâches

CASCADE: Je vais vous aider à générer un backlog pour votre application. Pourriez-vous me donner plus de détails sur les fonctionnalités souhaitées?

USER: L'application doit permettre aux utilisateurs de créer des tâches, les organiser en projets, définir des priorités et des échéances, et suivre la progression.

CASCADE: Je vais générer un backlog complet pour votre application de gestion de tâches avec ces fonctionnalités.  

[Utilise mcp0_tools/call avec { "name": "generateBacklog", "arguments": { "projectName": "Gestionnaire de tâches", "projectDescription": "...", "outputPath": "./.agile-planner-backlog" } }]
```

### Claude.ai

1. Allez dans les paramètres de Claude
2. Sélectionnez "Outils > Gérer les outils"
3. Ajoutez Agile Planner avec la commande : `npx agile-planner --mcp`

### Cursor

1. Ouvrez les paramètres de Cursor
2. Accédez à "AI > MCP Tools"
3. Ajoutez Agile Planner avec la commande : `npx agile-planner --mcp`

### Règles suggérées pour Windsurf

Pour une utilisation optimale avec Cascade dans Windsurf, considérez l'ajout de ces règles dans vos paramètres Workspace :

```mcp
# RULE 1: Recherche avant génération
- Lorsqu'on vous demande d'utiliser `mcp0_generateFeature`, si la requête mentionne des technologies spécifiques ou des concepts complexes, suggérez d'abord d'utiliser `Context7` ou `Brave Search` pour rassembler du contexte.  

# RULE 2: Planification pour les features/backlogs complexes
- Après avoir rassemblé le contexte, suggérez d'utiliser `SequentialThinking` pour structurer une description détaillée avant d'appeler l'outil Agile Planner approprié.

# RULE 3: Priorité à Context7 pour la documentation
- Lorsque des recherches sont nécessaires pour une bibliothèque ou un framework connu, privilégiez l'utilisation de `Context7`.
```

*(Note : Ce sont des exemples ; adaptez-les à vos besoins spécifiques et à votre style d'interaction.)*

### Communication avec le protocole MCP

Les clients MCP communiquent avec Agile Planner via le protocole JSON-RPC 2.0. Voici un exemple de requête et réponse :

**Requête** :
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "generateBacklog",
    "arguments": {
      "projectName": "Task Manager",
      "projectDescription": "Application de gestion de tâches...",
      "outputPath": "./.agile-planner-backlog/task-manager"
    }
  },
  "id": 1
}
```

**Réponse** :
```json
{
  "jsonrpc": "2.0",
  "result": {
    "success": true,
    "message": "Backlog généré avec succès",
    "outputPath": "./.agile-planner-backlog/task-manager",
    "backlog": { ... }
  },
  "id": 1
}
```

**Note sur le suivi de progression :**

Agile Planner MCP **ne gère pas** automatiquement le suivi de l'état d'implémentation des user stories ou features générées. Le suivi continu (passage des éléments à "En cours" ou "Terminé") devrait typiquement être géré dans votre système de gestion de projet principal (Jira, Trello, Asana, etc.).

## 6. Conclusion

En adoptant ce workflow synergique avec Agile Planner MCP 1.7.1, vous pouvez :

1. **Intégrer facilement** la génération de backlog dans n'importe quel environnement compatible MCP
2. **Améliorer la qualité** des backlogs générés grâce à une recherche et une planification préalables
3. **Maintenir la cohérence** entre les différentes parties de votre projet 
4. **Accélérer considérablement** le processus de planification agile

Cette approche transforme votre client MCP et Agile Planner en un assistant de planification plus puissant et conscient du contexte, que ce soit avec Windsurf Cascade, Claude.ai ou Cursor.

---

## Appendix: Agile Planner MCP Tool Reference

*(Details moved from the main body for clarity)*

### A.1. `generateBacklog`

*   **Description:** Génère un backlog complet de projet agile (epics, features, user stories) à partir d'une description de projet.
*   **Code Source:** `server/lib/backlog-generator.js`
*   **Paramètres d'entrée:**
    *   `projectName` (string, **requis**): Nom du projet.
    *   `projectDescription` (string, **requis**): Description détaillée des objectifs/champ d'application.
    *   `outputPath` (string, *optionnel*): Répertoire de sortie personnalisé. Par défaut, utilise la variable d'environnement `AGILE_PLANNER_OUTPUT_ROOT` ou `./.agile-planner-backlog`.
*   **Sortie:** Fichiers Markdown/JSON du backlog dans `outputPath`.
*   **Exemple MCP:** Voir le [Guide d'intégration MCP](./mcp-integration.md) pour des exemples complets de requêtes et réponses.

### A.2. `generateFeature`

*   **Description:** Génère une feature spécifique avec des user stories.
*   **Code Source:** `server/lib/feature-generator.js`
*   **Paramètres d'entrée:**
    *   `featureDescription` (string, **requis**): Description détaillée de la feature.
    *   `businessValue` (string, *optionnel*): Proposition de valeur business.
    *   `storyCount` (integer, *optionnel*, défaut: 3, min: 3): Nombre de user stories.
    *   `epicName` (string, *optionnel*): Nom de l'epic associé (en sera créé un si non spécifié).
    *   `outputPath` (string, *optionnel*): Répertoire de sortie personnalisé.
*   **Sortie:** Fichiers Markdown/JSON de la feature dans `outputPath`.
*   **Exemple MCP:** Voir le [Guide d'intégration MCP](./mcp-integration.md) pour des exemples complets.

### A.3. `getStatus`

*   **Description:** Vérifie le statut du serveur MCP Agile Planner.
*   **Code Source:** `server/lib/mcp-router.js`
*   **Paramètres d'entrée:** Aucun
*   **Sortie:** État actuel du serveur avec informations de version.
*   **Exemple MCP:** Voir le [Guide d'intégration MCP](./mcp-integration.md).
