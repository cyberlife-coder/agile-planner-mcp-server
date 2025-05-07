# Agile Planner MCP Server (v1.2.1) - AI-Powered Agile Backlog Generator

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

> **Latest improvements (v1.2.1):** Refactorization of the validation system using the Strategy pattern. Created specialized validators for each entity type (UserStory, Feature, Epic, Iteration, Backlog) and implemented a Factory to provide a unified interface. Improved error messages precision, reduced cognitive complexity, and ensured 100% test coverage for the new validators. Added migration examples for progressive adoption. Compatible with MCP specification 2025-03 for Windsurf.
>
> **Previous version (v1.2.0):** Major architectural refactoring of the markdown generator module. Split monolithic structure (1124 lines) into 7 specialized modules under 500 lines each. Implemented design patterns (Façade, Factory, Builder, Strategy) for better maintainability. Enhanced error handling in feature and backlog generation. Fixed "getClient is not defined" errors and improved handling of undefined values. Reduced cognitive complexity while ensuring backward compatibility.

> **Previous version (v1.1.8):** Refactored markdown generator with improved code quality and reliability for user story formatting. Implemented TDD and KISS principles for more maintainable code. Enhanced output compatibility for various AI assistants. Fixed formatting issues in markdown output.

## ❌ Without Agile Planner MCP

Creating agile backlogs manually is time-consuming and error-prone:

- ❌ Hours spent writing user stories, acceptance criteria, and tasks
- ❌ Inconsistent formatting and structure across different projects
- ❌ No clear implementation guidance for AI coding assistants
- ❌ Manual prioritization and organization without strategic framework

## ✅ With Agile Planner MCP

Agile Planner MCP generates complete, structured agile backlogs with precise AI-guided annotations in seconds:

- ✅ **Complete backlog structure** with epics, MVP user stories, and future iterations
- ✅ **AI-optimized annotations** that guide implementation step-by-step
- ✅ **Progress tracking** with task checkboxes and dependency management
- ✅ **Centralized organization** in a dedicated `.agile-planner-backlog` folder

Simply provide a project description, and Agile Planner MCP generates everything you need to start development immediately.

## 🚀 Installation and Usage

### Install with npm

```bash
# Install globally
npm install -g agile-planner-mcp-server
```

### Usage in command line

```bash
# Set your API key (or use a .env file)
export OPENAI_API_KEY="your-api-key"

# Generate a backlog
agile-planner-mcp --project "Your project description" --output ./my-project
```

### Usage as a library

```javascript
const { generateBacklog } = require('agile-planner-mcp-server');

// Usage example
async function myProject() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await generateBacklog("Project description", client);
  
  if (result.success) {
    console.log("Backlog successfully generated:", result.result);
  }
}
```

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
        "OPENAI_API_KEY": "sk-...",
        "AGILE_PLANNER_OUTPUT_ROOT": "D:/path/to/output/folder"
      }
    }
  }
}
```

### Option 2: Using npx (recommended)

```json
{
  "mcpServers": {
    "agile-planner": {
      "command": "npx",
      "args": ["-y", "agile-planner-mcp-server"],
      "env": {
        "MCP_EXECUTION": "true",
        "OPENAI_API_KEY": "sk-proj...",
        "AGILE_PLANNER_OUTPUT_ROOT": "D:/path/to/output/folder"
      }
    }
  }
}
```

**Important:** The `MCP_EXECUTION` variable with the value `"true"` is required for proper operation with Windsurf.

## 🔍 Using in Windsurf/Cascade/Cursor

Once configured, you'll see the `generateBacklog` tool in your MCP tools list. Simply:

1. **Select the tool** from the AI assistant interface
2. **Enter your project description**
3. **Let the AI generate your backlog**

Your files will be created in the `.agile-planner-backlog` folder within the directory specified by the `AGILE_PLANNER_OUTPUT_ROOT` environment variable, or in the current directory if not specified.

## 🧠 How It Works

1. **Describe your project** in plain English, providing as much detail as possible.

   ```txt
   SaaS task management system for teams with Slack integration, 
   mobile support, and GDPR compliance.
   ```

2. **Agile Planner MCP processes your description** through a robust validation pipeline:
   - 🤖 Leverages OpenAI or Groq LLMs to generate the backlog structure
   - 🧪 Validates the structure against a comprehensive JSON schema
   - 📘 Generates markdown files with AI-optimized implementation guidance

3. **Get a complete, implementation-ready backlog with hierarchical organization**:
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

## 📊 Example Output

### Epic Structure
```markdown
# Epic: User Management System

*Valeur métier:* Fondement essentiel pour la sécurité et l'expérience utilisateur personnalisée.

## Description

Un système complet permettant de gérer les comptes utilisateurs, les autorisations et les préférences.

## Features associées

- [Inscription utilisateur](../features/inscription-utilisateur/feature.md)
- [Authentification](../features/authentification/feature.md)
- [Gestion des profils](../features/gestion-profils/feature.md)
```

### Feature Description
```markdown
# Feature: Authentification Utilisateur

*Epic parent:* [Système de Gestion Utilisateur](../../epic.md)
*Valeur métier:* Haute - Fondamentale pour la sécurité de l'application

## Description

Mise en place d'un système d'authentification sécurisé permettant aux utilisateurs de se connecter via différentes méthodes (email/mot de passe, OAuth) et de gérer leurs sessions.

## User Stories

- [US001 - Connexion par email/mot de passe](./user-stories/us001-connexion-email-mdp.md)
- [US002 - Connexion par OAuth](./user-stories/us002-connexion-oauth.md)
- [US003 - Récupération de mot de passe](./user-stories/us003-recuperation-mdp.md)
```

### User Story
```markdown
# User Story: US001 - Connexion par email/mot de passe

*Epic parent:* [Système de Gestion Utilisateur](../../../epic.md)
*Feature parent:* [Authentification Utilisateur](../feature.md)
*Priorité:* Haute
*Points:* 5
*Assigné à:* Non assigné

## Description

**En tant qu'**utilisateur enregistré,
**Je veux** pouvoir me connecter avec mon email et mot de passe
**Afin de** accéder à mon compte et aux fonctionnalités personnalisées.

## Critères d'acceptation

```gherkin
Étant donné que je suis sur la page de connexion
Lorsque je saisis mon email et mon mot de passe corrects
Alors je devrais être authentifié et redirigé vers le tableau de bord
```

## Tâches techniques

- [ ] Implémenter le formulaire de connexion avec validation
- [ ] Mettre en place l'authentification sécurisée côté serveur
- [ ] Gérer les erreurs de connexion avec messages appropriés
- [ ] Mettre en place un système de session sécurisé
- [ ] Ajouter des tests de sécurité et de validation
```

## Features

- Generate a complete agile backlog from a project description
- Produce epics, user stories, and tasks
- Structure markdown files for project management
- Gherkin format acceptance criteria
- **New**: Generate specific features with their user stories

## Usage

### Generate a complete backlog

```bash
npx agile-planner-mcp-server backlog "My awesome project" "Detailed project description..."
```

### Generate a specific feature

```bash
npx agile-planner-mcp-server feature "Detailed description of the feature to implement" --story-count=4 --business-value="Important business value"
```

### Available options

| Option | Description |
|--------|-------------|
| `backlog` | Generates a complete backlog with epics, user stories, and tasks |
| `feature` | Generates a feature with its associated user stories and tasks |
| `--story-count` | Number of user stories to generate (minimum 3, default: 3) |
| `--business-value` | Business value of the feature |
| `--iteration-name` | Iteration name (default: "next") |
| `--output-path` | Custom output path |

### Interactive mode (CLI)

You can also run the tool in interactive mode:

```bash
npx agile-planner-mcp-server
```

A menu will let you choose between generating a complete backlog or a specific feature, with the option to customize all parameters.

## MCP Configuration for Windsurf/Cascade/Cursor

To use AgilePlanner as an MCP server in Windsurf, add this configuration:

```json
{
  "mcpServers": [
    {
      "name": "AgilePlanner",
      "command": "npx",
      "args": ["-y", "agile-planner-mcp-server"],
      "description": "AI-powered agile backlog generator"
    }
  ]
}
```

### Available MCP tools

| Tool | Description |
|------|-------------|
| `generateBacklog` | Generates a complete backlog from a project description |
| `generateFeature` | Generates a specific feature with its user stories |

#### Input schema for `generateFeature`

```json
{
  "featureDescription": "Detailed description of the feature to generate",
  "storyCount": 5,
  "businessValue": "Business value of the feature",
  "iterationName": "next",
  "outputPath": "/optional/path"
}
```

## 📚 Command Reference

| Command | Description |
|---------|-------------|
| `agile-planner-mcp --project "description" --output ./folder` | Generate a backlog from project description |
| `agile-planner-mcp --help` | Display help information |
| `agile-planner-mcp --version` | Display version information |

## 🔄 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_EXECUTION` | **Required** - Must be set to "true" for MCP mode | - |
| `OPENAI_API_KEY` | OpenAI API key for generating backlog | - |
| `GROQ_API_KEY` | Alternative Groq API key | - |
| `AGILE_PLANNER_OUTPUT_ROOT` | Root directory for backlog output | Current working directory |

## 🚀 Changelog

### v1.2.0 (Current)
- Major architectural refactoring of the markdown generator module. Split monolithic structure (1124 lines) into 7 specialized modules under 500 lines each. Implemented design patterns (Façade, Factory, Builder, Strategy) for better maintainability. Enhanced error handling in feature and backlog generation. Fixed "getClient is not defined" errors and improved handling of undefined values. Reduced cognitive complexity while ensuring backward compatibility. Compatible with MCP specification 2025-03 for Windsurf.

### v1.1.8
- Refactored markdown generator with improved code quality and reliability for user story formatting. Implemented TDD and KISS principles for more maintainable code. Enhanced output compatibility for various AI assistants. Fixed formatting issues in markdown output.

### v1.1.5
- Fixed parameter ordering in backlog generation function
- Enhanced error handling in MCP mode
- Improved test reliability and fixed Jest tests
- Added license with Commons Clause

### v1.1.4
- Fixed feature generation in MCP mode
- Improved parameters handling for backlog generation
- Enhanced error reporting with detailed diagnostics
- Added automatic directory creation for output files

### v1.1.3
- Updated compatibility with MCP specification 2025-03
- Added support for Windsurf and Cascade integration
- Improved markdown formatting for AI consumption
- Enhanced feature generation with better acceptance criteria

### v1.1.0
- Added feature generation capabilities
- Implemented user story generation with acceptance criteria
- Added support for custom output paths
- Enhanced documentation with examples

### v1.0.0
- Initial release with agile backlog generation
- Basic markdown export functionality
- OpenAI and Groq API support
- Command-line interface

## 📜 License

Agile Planner MCP Server is licensed under the MIT License with Commons Clause. This means you can:

### ✅ Allowed:
- Use Agile Planner for any purpose (personal, commercial, academic)
- Modify the code
- Distribute copies
- Create and sell products built using Agile Planner

### ❌ Not Allowed:
- Sell Agile Planner itself
- Offer Agile Planner as a hosted service
- Create competing products based on Agile Planner

See the LICENSE file for the complete license text.

## 👥 Support

For support, please open an issue on the [GitHub repository](https://github.com/cyberlife-coder/agile-planner-mcp-server/issues) or contact your Windsurf/Cascade/Cursor administrator.

---

## ☕️ Support the Project

<a href="https://buymeacoffee.com/wiscale" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px; width: 217px;" >
</a>

If you find this project useful, you can support its development by buying me a coffee on [BuyMeACoffee](https://buymeacoffee.com/wiscale)!

Thank you 🙏

## Documentation

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
  outputPath: "optional/custom/path" // Optional: custom output directory
})

// CLI
npx agile-planner-mcp-server feature "A detailed description of the feature to generate"
```

### Output Structure

Agile Planner generates a structured project directory with:

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

All files include AI-friendly instructions to guide implementation. See the [examples](./examples) folder for sample outputs.

### Advanced Usage

For optimal results when using Agile Planner with Windsurf or Cascade, see our detailed [Optimal Usage Guide](./OPTIMAL_USAGE_GUIDE.MD). This guide provides best practices for:

- Combining Agile Planner with other MCP tools like Sequential Thinking
- Retrieving context before generating backlogs
- Incorporating existing project documentation
- Tracking implementation progress

### Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cyberlife-coder/agile-planner-mcp-server&type=Date)](https://www.star-history.com/#cyberlife-coder/agile-planner-mcp-server&Date)
