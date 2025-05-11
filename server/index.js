require('dotenv').config(); // Load .env file at the very beginning

const mcpRouter = require('./lib/mcp-router');

if (!process.stdin.isTTY) {
  // MCP mode: input is being piped
  let inputData = '';
  process.stdin.setEncoding('utf8');

  process.stdin.on('readable', () => {
    let chunk;
    while ((chunk = process.stdin.read()) !== null) {
      inputData += chunk;
    }
  });

  process.stdin.on('end', async () => {
    if (inputData.trim() === '') {
      // Handle cases where stdin is piped but empty (e.g. `echo "" | node server/index.js`)
      // This can still happen if a process pipes an empty stream before closing it.
      // Fallback to Yargs or show an error/help for MCP mode.
      console.error('MCP Error: No input received on stdin. Falling back to CLI usage or use --help.');
      // Optionally, trigger Yargs help or a specific MCP error message.
      // For now, let it fall through to Yargs, which will show its help.
      initializeYargs(); 
      return;
    }
    try {
      const requestJson = JSON.parse(inputData);
      const response = await mcpRouter.handleRequest(requestJson);
      process.stdout.write(JSON.stringify(response, null, 2) + '\n');
      process.exit(0); // Success
    } catch (error) {
      console.error("Error processing MCP request:", error.message, error.stack);
      const errorResponse = {
        jsonrpc: "2.0",
        id: null, // Attempt to get id from requestJson if possible and if inputData was parseable
        error: { code: -32000, message: "Server error processing MCP request", data: error.message }
      };
      try {
        const tempRequest = JSON.parse(inputData); // Try parsing again just for ID
        if (tempRequest?.id) { // Use optional chaining
          errorResponse.id = tempRequest.id;
        }
      } catch (parseError) {
        // Intentionally ignore this secondary parseError.
        // We are only trying to retrieve the 'id' for a more complete error response.
        // If inputData is not valid JSON at this point, we'll send the error response without an id.
      }

      process.stderr.write(JSON.stringify(errorResponse, null, 2) + '\n');
      process.exit(1); // Failure
    }
  });
} else {
  // Interactive CLI mode: Initialize Yargs
  initializeYargs();
}

function initializeYargs() {
  const cli = require('./lib/cli');
  const { version } = require('../package.json');
  const yargsInstance = require('yargs/yargs')(process.argv.slice(2));

  yargsInstance
    .usage('Usage: $0 <command> [options]')
    .command('cli', 'Run in interactive CLI mode', () => {},
      async (argv) => {
        console.log('Running in interactive CLI mode...');
        await cli.runInteractiveCLI();
      }
    )
    .command(
      'generateBacklog <projectName> <projectDescription>',
      'Generate backlog JSON and Markdown from a project name and description.',
      (yargs) => {
        yargs
          .positional('projectName', {
            describe: 'Project name for backlog generation',
            type: 'string'
          })
          .positional('projectDescription', {
            describe: 'Project description for backlog generation',
            type: 'string'
          })
          .option('output-path', {
            alias: 'o',
            describe: 'Specify the base output directory for generated files. Defaults to ./.agile-planner-backlog',
            type: 'string'
          });
      },
      async (argv) => {
        const options = { outputPath: argv.outputPath }; 
        console.log('\n[DEBUG server/index.js] generateBacklog command invoked.');
        console.log(`[DEBUG server/index.js]   argv (from handler): ${JSON.stringify(argv)}`);
        console.log(`[DEBUG server/index.js]   Project Name: ${argv.projectName}`);
        console.log(`[DEBUG server/index.js]   Project Description: ${argv.projectDescription}`);
        console.log(`[DEBUG server/index.js]   options.outputPath: ${options.outputPath}`);
        await cli.generateBacklogCLI(argv.projectName, argv.projectDescription, options);
      }
    )
    .command(
      'generateFeature <epicName> <featureDescription>',
      'Generate feature JSON and Markdown from an epic name and feature description.',
      (yargs) => {
        yargs
          .positional('epicName', {
            describe: 'Epic name for feature generation',
            type: 'string'
          })
          .positional('featureDescription', {
            describe: 'Feature description for feature generation',
            type: 'string'
          })
          .option('output-path', { 
            alias: 'o',
            describe: 'Specify the base output directory for generated files. Defaults to ./.agile-planner-backlog',
            type: 'string'
          });
      },
      async (argv) => {
        const options = { outputPath: argv.outputPath };
        console.log('\n[DEBUG server/index.js] generateFeature command invoked.');
        console.log(`[DEBUG server/index.js]   argv (from handler): ${JSON.stringify(argv)}`);
        console.log(`[DEBUG server/index.js]   Epic Name: ${argv.epicName}`);
        console.log(`[DEBUG server/index.js]   Feature Description: ${argv.featureDescription}`);
        console.log(`[DEBUG server/index.js]   options.outputPath: ${options.outputPath}`);
        await cli.generateFeatureCLI(argv.epicName, argv.featureDescription, options);
      }
    )
    .option('mode', {
      describe: 'Optional: Specify mode (cli or mcp) for context if not using direct commands. Note: MCP via stdio is auto-detected.',
      type: 'string'
    })
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version')
    .version(version)
    .epilog('Agile Planner MCP Server - Copyright 2024 - MIT License')
    .demandCommand(1, 'You need at least one command when run interactively. Available: cli, generateBacklog, generateFeature. Use --help.')
    .strict() 
    .wrap(null)
    .parse(); 
}
