# Agile Planner MCP Server (v1.7.2) - AI-Powered Agile Backlog Generator

[![smithery badge](https://smithery.ai/badge/@cyberlife-coder/agile-planner-mcp-server)](https://smithery.ai/server/@cyberlife-coder/agile-planner-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/cyberlife-coder/agile-planner-mcp-server/blob/main/LICENSE) 
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io) 
[![Windsurf Ready](https://img.shields.io/badge/Windsurf-Ready-brightgreen)](https://docs.windsurf.com/windsurf/mcp) 
[![Cascade Integrated](https://img.shields.io/badge/Cascade-Integrated-purple)](https://cascade.ai)
[![npm version](https://img.shields.io/npm/v/agile-planner-mcp-server.svg?style=flat-square)](https://www.npmjs.com/package/agile-planner-mcp-server)
[![GitHub Stars](https://img.shields.io/github/stars/cyberlife-coder/agile-planner-mcp-server?style=social)](https://github.com/cyberlife-coder/agile-planner-mcp-server)

[<img alt="Install in Windsurf" src="https://img.shields.io/badge/Windsurf-Windsurf?style=flat-square&label=Install%20Agile%20Planner&color=5fa8fb">](#install-in-windsurf)
[<img alt="Install in Cascade" src="https://img.shields.io/badge/Cascade-Cascade?style=flat-square&label=Install%20Agile%20Planner&color=9457EB">](#install-in-cascade)
[<img alt="Install in Cursor" src="https://img.shields.io/badge/Cursor-Cursor?style=flat-square&label=Install%20Agile%20Planner&color=24bfa5">](#install-in-cursor)

**Agile Planner MCP** automatically generates complete agile backlogs (Epics, User Stories, MVP, iterations) or specific features from a simple description, directly within Windsurf, Cascade, or Cursor, with no technical skills required.

> **Latest improvements (v1.7.2):**
> - **Correction du mode MCP pour generateFeature**: Amélioration robuste de l'extraction des user stories
> - **Structure RULE 3 renforcée**: Creation cohérente des dossiers epics/features/user-stories
> - **Logs de diagnostic détaillés**: Identification plus facile des problèmes
> - **Restructuration du projet**: Organisation claire des fichiers de test et temporaires
> - **Mise à jour des guides d'utilisation**: Instructions complètes pour Windsurf, Claude et Cursor
> - See [CHANGELOG.md](./CHANGELOG.md) for full details.
>
> **Previous improvements (v1.7.1):**
> - **Refonte complète de la documentation MCP**: Documentation détaillée de l'architecture serveur MCP avec diagrammes Mermaid.
> - **Réduction de la complexité cognitive**: Refactorisation majeure des modules critiques (json-parser, mcp-router).
> - **Amélioration de la robustesse**: Meilleure gestion des erreurs et tests d'intégration E2E optimisés.
> - See [CHANGELOG.md](./CHANGELOG.md) for details.

## ❌ Without Agile Planner MCP

Creating agile backlogs manually is time-consuming and error-prone:

- ❌ Hours spent writing user stories, acceptance criteria, and tasks
- ❌ Inconsistent formatting and structure across different projects
- ❌ No clear implementation guidance for AI coding assistants
- ❌ Manual prioritization and organization without strategic framework

## ✅ With Agile Planner MCP

### Gestion d’erreur centralisée
- Tous les retours d’erreur des fonctions `generateBacklog` et `generateBacklogDirect` sont désormais formatés par `handleBacklogError` pour garantir l’uniformité du JSON et la robustesse de l’audit.
- Les exemples d’erreur affichent le format : `{ success: false, error: { message: ... } }`


Agile Planner MCP generates complete, structured agile backlogs with precise AI-guided annotations in seconds:

- ✅ **Complete backlog structure** with epics, features, user stories, and orphan stories
- ✅ **AI-optimized annotations** that guide implementation step-by-step
- ✅ **Progress tracking** with task checkboxes and dependency management
- ✅ **Centralized organization** in a dedicated `.agile-planner-backlog` folder
- ✅ **Intelligent feature organization** that automatically associates features with relevant epics

## 📑 Documentation

This documentation has been reorganized for better navigation:

### User Guides
- [Guide d'intégration MCP](./docs/guides/mcp-integration.md) - Guide d'intégration avec Claude, Cursor et Windsurf IDE
- [Guide d'utilisation optimal](./docs/guides/optimal-usage-guide.md) - Guide d'utilisation détaillé
- [Guide de migration](./docs/guides/migration-guide.md) - Guide pour migrer depuis les versions précédentes

### Developer Documentation
- [Développement](./docs/development/development.md) - Guide de développement
- [Spécifications MCP](./docs/development/mcp-specification.md) - Spécification du protocole MCP
- [Problèmes connus](./docs/development/KNOWN_ISSUES.md) - Liste des problèmes connus et dette technique
- [Plan de refactorisation](./docs/development/REFACTORING-PLAN.md) - Plan détaillé de refactorisation du code
- [Plan de refactorisation des tests](./docs/development/TEST-REFACTORING.md) - Plan de correction des tests
- [Roadmap](./docs/development/ROADMAP.md) - Feuille de route des versions futures
- [Architecture MCP](./docs/architecture/mcp-server-architecture.md) - Architecture complète du serveur MCP
- [Système de génération Markdown](./docs/architecture/markdown-generation.md) - Architecture du générateur markdown
- [Format du backlog](./docs/architecture/backlog-format.md) - Spécification du format JSON de backlog

> **Note TDD** : Les assertions sur les erreurs doivent vérifier le format unifié `{ success: false, error: { message: ... } }`.
> Toute modification du format d’erreur nécessite la mise à jour des tests d’intégration.

### Architecture Documentation
- [Design](./docs/architecture/design.md) - Design général du projet
- [Format de backlog](./docs/architecture/backlog-format.md) - Format du backlog généré
- [Diagramme de validation de backlog](./docs/architecture/backlog-validation-diagram.md) - Diagramme de validation
- [Compatibilité Multi-LLM](./docs/architecture/multi-llm-compatibility.md) - Compatibilité avec plusieurs LLMs

## 🚦 Setting up in Windsurf / Cascade / Cursor

Ask your administrator or technical team to add this MCP server to your workspace configuration:

### Option 1: Using a local installation

```json
{
  "mcpServers": {
    "agile-planner": {
      "command": "node",
      "args": ["D:/path/to/agile-planner/server/index.js"],
      "env": {
        "MCP_EXECUTION": "true",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### Option 2: Using the NPM package

```json
{
  "mcpServers": {
    "agile-planner": {
      "command": "npx",
      "args": ["agile-planner-mcp-server"],
      "env": {
        "MCP_EXECUTION": "true",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

## 🧠 How It Works

1. **Describe your project** in plain English, providing as much detail as possible.

   ```txt
   SaaS task management system for teams with Slack integration, 
   mobile support, and GDPR compliance.
   ```

2. **Agile Planner MCP processes your description** through a robust validation pipeline:
   - 🤖 Leverages OpenAI or Groq LLMs to generate the backlog structure
   - 🧪 Validates the structure against a comprehensive JSON schema
   - 🔍 Enhances features with acceptance criteria and tasks
   - 📝 Organizes stories into epics and features
   - 🏗️ Creates a complete directory structure with markdown files

3. **Receive a fully structured agile backlog** in seconds:

### Structure du dossier généré

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
├── orphan-stories/
│   ├── [story-orpheline-1].md
│   └── [story-orpheline-2].md
└── backlog.json
```

> **Note :** Les dossiers `planning/mvp` et `planning/iterations` sont supprimés. Toutes les user stories sont générées dans leur arborescence épics/features ou dans `orphan-stories` si elles ne sont rattachées à aucune feature/epic. Le fichier `backlog.json` ne contient plus de sections `mvp` ou `iterations`.

All files include AI-friendly instructions to guide implementation. See the [examples](./examples) folder for sample outputs.

### Commands

Agile Planner MCP supports the following commands:

#### Generate a Complete Backlog
```javascript
// In Windsurf or Cascade
mcp0_generateBacklog({
  projectName: "My Project",
  projectDescription: "A detailed description of the project...",
  outputPath: "optional/custom/path"
})

// CLI
npx agile-planner-mcp-server backlog "My Project" "A detailed description of the project..."
```

#### Generate a Specific Feature
```javascript
// In Windsurf or Cascade
mcp0_generateFeature({
  featureDescription: "A detailed description of the feature to generate",
  storyCount: 3,  // Optional: number of user stories to generate (min: 3)
  businessValue: "High", // Optional: business value of this feature
  iterationName: "iteration-2", // Optional: target iteration (default: 'next')
  epicName: "Optional Epic Name", // Optional: specify an epic or let the system find/create one
  outputPath: "optional/custom/path" // Optional: custom output directory
})

// CLI
npx agile-planner-mcp-server feature "A detailed description of the feature to generate"
```

## 🔄 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_EXECUTION` | **Required** - Must be set to "true" for MCP mode | - |
| `OPENAI_API_KEY` | OpenAI API key for generating backlog | - |
| `GROQ_API_KEY` | Alternative Groq API key | - |
| `DEBUG` | Enable debug mode for additional logs | false |
| `TEST_MODE` | Enable test mode (mock generation) | false |
| `AGILE_PLANNER_OUTPUT_ROOT` | Base directory for output | current dir |

## 📜 License

Agile Planner MCP Server is licensed under the MIT License with Commons Clause. See the LICENSE file for the complete license text.

## 👥 Support

For support, please open an issue on the [GitHub repository](https://github.com/cyberlife-coder/agile-planner-mcp-server/issues) or contact your Windsurf/Cascade/Cursor administrator.

---

## ☕️ Support the Project

<a href="https://buymeacoffee.com/wiscale" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px; width: 217px;" >
</a>

If you find this project useful, you can support its development by buying me a coffee on [BuyMeACoffee](https://buymeacoffee.com/wiscale)!

## 🚀 Get Windsurf

<a href="https://windsurf.com/refer?referral_code=8f4980f9ec" target="_blank">
    <img src="https://img.shields.io/badge/Windsurf-Get%20250%20Bonus%20Credits-5fa8fb?style=for-the-badge" alt="Get Windsurf with bonus credits" >
</a>

Thank you 🙏
