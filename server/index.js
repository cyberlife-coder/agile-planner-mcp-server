#!/usr/bin/env node

// MCP strict: détecte toute pollution stdout
process.stdout.write = ((orig) => (chunk, ...args) => {
  const str = chunk.toString().trim();
  if (str.length > 0 && !str.startsWith('{"jsonrpc"')) {
    process.stderr.write('[STDOUT POLLUTION] ' + str + '\n');
  }
  return orig.call(process.stdout, chunk, ...args);
})(process.stdout.write);

const { MCPServer, StdioServerTransport } = require('./lib/mcp-server');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { z } = require('zod');
const { initializeClient, generateBacklog } = require('./lib/backlog-generator');
const { generateMarkdownFiles, saveRawBacklog } = require('./lib/markdown-generator');
const { startCLI } = require('./lib/cli');

// Load environment variables
dotenv.config();

// MCP mode detection - MCP is now the default mode
const isCLIMode = process.env.CLI_EXECUTION === 'true';
const isMCPMode = !isCLIMode;

if (isMCPMode) {
  // MCP mode: no interfering output on STDOUT
  // Debug logs only on STDERR
  process.stderr.write('MCP mode activated\n');
  process.stderr.write(`Arguments: ${process.argv.join(', ')}\n`);
  process.stderr.write(`Environment: ${JSON.stringify(process.env.OPENAI_API_KEY ? 'API Key present' : 'API Key missing')}\n`);

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    process.stderr.write(chalk.red('Error: Missing API key. Please set OPENAI_API_KEY or GROQ_API_KEY in the .env file\n'));
    process.exit(1);
  }

  // Initialize OpenAI or GROQ client
  let client;
  try {
    client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    process.stderr.write(chalk.green('API client initialized successfully\n'));
  } catch (error) {
    process.stderr.write(chalk.red('Error initializing client: ') + error.message + '\n');
    process.exit(1);
  }

  // Input validation schema
  const generateBacklogSchema = z.object({
    project: z.string().min(1, "Project description is required"),
    saveRawJSON: z.boolean().optional().default(false)
  });

  // === Correction: Utiliser une variable d'environnement pour définir le dossier de sortie ===
  const outputRoot = process.env.AGILE_PLANNER_OUTPUT_ROOT || process.cwd();
  const outputBaseDir = path.join(outputRoot, '.agile-planner-backlog');
  fs.ensureDirSync(outputBaseDir);
  fs.ensureDirSync(path.join(outputBaseDir, 'mvp'));
  fs.ensureDirSync(path.join(outputBaseDir, 'iterations'));

  /**
   * Handler for the generateBacklog command
   */
  async function handleGenerateBacklog(params) {
    process.stderr.write(chalk.yellow(`[DEBUG] handleGenerateBacklog called.\n`));
    process.stderr.write(chalk.yellow(`[DEBUG] Fichiers doivent être générés dans : ${outputBaseDir}\n`));
    process.stderr.write(chalk.yellow(`[DEBUG] handleGenerateBacklog invoked with params: ${JSON.stringify(params)}\n`));
    const debugLogPath = path.join(outputBaseDir, 'debug.log');
    fs.appendFileSync(debugLogPath, `[DEBUG] handleGenerateBacklog invoked with params: ${JSON.stringify(params)} at ${new Date().toISOString()}\n`);
    // === ADD MCP INTEGRATION TEST MODE ===
    if (process.env.JEST_MOCK_BACKLOG === 'true') {
      process.stderr.write('Test mode (index.js) activated: returning a mock UTF-8 backlog.\n');
      // Build a mock response
      const mockResponse = {
        success: true,
        message: "Backlog generated successfully (test mode)",
        files: {
          epic: path.join(outputBaseDir, 'epic.md'),
          mvp: path.join(outputBaseDir, 'mvp', 'user-stories.md'),
          iterations: [],
          json: null
        },
        rawBacklog: {
          project: "Test UTF-8 – Generation with accents, emoji 😃, Chinese characters 汉字, Arabic العربية, Cyrillic кириллица, etc.",
          epics: [ { title: "Epic 😃 汉字" } ],
          stories: [ { title: "Story العربية кириллица" } ]
        }
      };
      // Return mock response for JSON-RPC
      return mockResponse;
    }
    // === END OF TEST MODE ADDITION ===

    process.stderr.write(chalk.blue('Backlog generation requested with params: ') + JSON.stringify(params) + '\n');
    try {
      // Parameter validation
      const validatedParams = generateBacklogSchema.parse(params);
      process.stderr.write(chalk.blue('Parameters validated\n'));
      
      // Generate backlog
      process.stderr.write(chalk.blue('Calling API to generate backlog...\n'));
      const backlog = await generateBacklog(validatedParams.project, client);
      process.stderr.write(chalk.blue('Backlog generated successfully\n'));
      
      // Generate Markdown files
      process.stderr.write(chalk.yellow(`[DEBUG] Appel generateMarkdownFiles dans : ${outputBaseDir}\n`));
      const files = await generateMarkdownFiles(backlog, outputBaseDir);
      process.stderr.write(chalk.yellow(`[DEBUG] Markdown files générés : ${JSON.stringify(files)}\n`));
      
      // Save raw JSON if requested
      let jsonPath = null;
      if (validatedParams.saveRawJSON) {
        process.stderr.write(chalk.blue('Saving raw JSON...\n'));
        jsonPath = await saveRawBacklog(backlog, outputBaseDir);
        process.stderr.write(chalk.blue('Raw JSON saved\n'));
      }
      
      process.stderr.write(chalk.green('Processing completed successfully\n'));
      return {
        success: true,
        message: "Backlog generated successfully",
        files: {
          epic: path.join(outputBaseDir, 'epic.md'),
          mvp: path.join(outputBaseDir, 'mvp', 'user-stories.md'),
          iterations: files.iterationDirs.map(dir => path.join(dir, 'user-stories.md')),
          json: jsonPath
        }
      };
    } catch (error) {
      process.stderr.write(chalk.red('[DEBUG] Error during processing: ') + error.message + '\n');
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: error.errors.map(e => e.message).join(', ')
        };
      }
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Define MCP tools
  const tools = [
    {
      name: 'generateBacklog',
      description: "Generates a complete agile backlog from a project description",
      inputSchema: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Detailed project description'
          },
          saveRawJSON: {
            type: 'boolean',
            description: 'Also save the generated raw JSON',
            default: false
          }
        },
        required: ['project']
      },
      handler: handleGenerateBacklog
    }
  ];

  process.stderr.write(chalk.blue('Creating MCP server with tools: ') + tools.map(t => t.name).join(', ') + '\n');
  
  // Ligne de debug supplémentaire pour vérifier le démarrage et le namespace
  process.stderr.write(chalk.green('DEBUG: MCPServer namespace utilisé : ' + 'agile-planner' + '\n'));
  
  // Create and start MCP server
  const server = new MCPServer({
    namespace: 'agile-planner',
    tools
  });

  // Use Stdio transport to communicate with Windsurf
  process.stderr.write(chalk.blue('Configuring STDIO transport\n'));
  const transport = new StdioServerTransport();
  
  // Listen for errors
  process.on('uncaughtException', (err) => {
    process.stderr.write(chalk.red('Uncaught error: ') + err.message + '\n');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    process.stderr.write(chalk.red('Unhandled promise rejection: ') + reason.message + '\n');
  });
  
  // Start the server
  process.stderr.write(chalk.blue('Starting MCP server...\n'));
  server.listen(transport);
  process.stderr.write(chalk.blue('MCP Agile Planner Server is running...\n'));

} else if (isCLIMode) {
  // CLI mode: start interactive interface
  console.log(chalk.blue('🚀 Agile Planner Server started'));
  console.log(chalk.blue('Mode: CLI'));
  console.log(chalk.blue(`Arguments: ${process.argv.join(', ')}`));
  console.log(chalk.blue(`Environment: ${JSON.stringify(process.env.OPENAI_API_KEY ? 'API Key present' : 'API Key missing')}`));
  console.log(chalk.green('CLI mode enabled - starting interactive interface'));
  startCLI().catch(error => {
    console.error(chalk.red('Error executing CLI interface:'), error);
    process.exit(1);
  });
}
