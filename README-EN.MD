# Agile Planner MCP - AI-Powered Agile Backlog Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/cyberlife-coder/agile-planner-mcp-server/blob/main/LICENSE) 
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io) 
[![Windsurf Ready](https://img.shields.io/badge/Windsurf-Ready-brightgreen)](https://docs.windsurf.com/windsurf/mcp) 
[![Cascade Integrated](https://img.shields.io/badge/Cascade-Integrated-purple)](https://cascade.ai)
[![npm version](https://img.shields.io/npm/v/agile-planner-mcp-server.svg?style=flat-square)](https://www.npmjs.com/package/agile-planner-mcp-server)
[![GitHub Stars](https://img.shields.io/github/stars/cyberlife-coder/agile-planner-mcp-server?style=social)](https://github.com/cyberlife-coder/agile-planner-mcp-server)
[![Latest Release](https://img.shields.io/github/v/release/cyberlife-coder/agile-planner-mcp-server?include_prereleases&sort=semver)](https://github.com/cyberlife-coder/agile-planner-mcp-server/releases)

[<img alt="Install in Windsurf" src="https://img.shields.io/badge/Windsurf-Windsurf?style=flat-square&label=Install%20Agile%20Planner&color=0098FF">](#install-in-windsurf)
[<img alt="Install in Cascade" src="https://img.shields.io/badge/Cascade-Cascade?style=flat-square&label=Install%20Agile%20Planner&color=9457EB">](#install-in-cascade)
[<img alt="Install in Cursor" src="https://img.shields.io/badge/Cursor-Cursor?style=flat-square&label=Install%20Agile%20Planner&color=24bfa5">](#install-in-cursor)

Generate comprehensive, structured agile backlogs with AI-guided annotations from a simple project description. Accelerate your development process with ready-to-implement user stories and task tracking.

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
      "args": ["agile-planner-mcp-server"],
      "env": {
        "MCP_EXECUTION": "true",
        "OPENAI_API_KEY": "sk-...",
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

3. **Get a complete, implementation-ready backlog**:
   ```
   .agile-planner-backlog/
   ├── README.md               # Navigation and overview
   ├── epics/
   │   └── epic.md             # Main epic with vision and scope
   ├── mvp/
   │   └── user-stories.md     # MVP user stories with checkboxes
   └── iterations/
       └── <IterationName>/
           └── user-stories.md # Future iterations with dependencies
   ```

## 📊 Example Output

### Epic Definition
```markdown
# User Management System Epic

As the platform architect, I want a robust user management system
so that we can securely manage user accounts, permissions, and 
authentication across the entire platform.

## Strategic Goals
- Implement secure authentication and authorization
- Support multiple user roles and permission levels
- Ensure GDPR compliance with data management
```

### MVP User Story
```markdown
## US001 - User Registration

As a new user, I want to register for an account so that I can access the platform.

**Acceptance Criteria:**
- [ ] GIVEN I am on the registration page, WHEN I enter valid details, THEN my account is created
- [ ] GIVEN I submit the form, WHEN my email is already registered, THEN I see an error message

**Tasks:**
- [ ] Create registration form UI with validation
- [ ] Implement user creation API endpoint
- [ ] Add email verification flow

**Priority:** HIGH
```

## 🛠️ Technical Architecture

### Validation Pipeline
- **Strict AI Validation**: Every AI-generated response is validated using a comprehensive JSON schema with Ajv
- **Auto-Correction Loop**: If validation fails, the response is automatically re-prompted up to 3 times
- **MCP Compliance**: Full conformance with the Model Context Protocol specification

### File Generation
- **Centralized Structure**: All files are organized in a `.agile-planner-backlog` folder
- **AI Annotations**: Each file contains detailed instructions guiding AI implementation
- **Progress Tracking**: Acceptance criteria and tasks include checkboxes for tracking

### MCP Compatibility
- **Strict Protocol Compliance**: Follows all MCP guidelines for seamless integration
- **Comprehensive Error Handling**: All errors are properly reported through the MCP protocol
- **Client Independence**: Works with any MCP-compatible client

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

### v2.x
- Centralized file structure in `.agile-planner-backlog`
- Detailed AI guidance annotations in each file
- Task tracking with checkboxes
- Strict AI validation with JSON schema
- Automatic correction loop for quality assurance
- MCP-compliant error handling
- Comprehensive documentation

### v1.x
- Initial agile backlog generation
- Basic Markdown export
- OpenAI and Groq support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/cyberlife-coder/agile-planner-mcp-server/blob/main/LICENSE) file for details.

## 👥 Support

For support, please open an issue on the [GitHub repository](https://github.com/cyberlife-coder/agile-planner-mcp-server/issues) or contact your Windsurf/Cascade/Cursor administrator.

---

## ☕️ Support the Project

<a href="https://buymeacoffee.com/wiscale" target="_blank">
    <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px; width: 217px;" >
</a>

If you find this project useful, you can support its development by buying me a coffee on [BuyMeACoffee](https://buymeacoffee.com/wiscale)!

Thank you 🙏
