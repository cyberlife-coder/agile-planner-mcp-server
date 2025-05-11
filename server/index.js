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
    describe: 'Optional: Specify mode (cli or mcp) for context if not using direct commands.',
    type: 'string'
  })
  .help('h')
  .alias('h', 'help')
  .alias('v', 'version')
  .version(version)
  .epilog('Agile Planner MCP Server - Copyright 2024 - MIT License')
  .demandCommand(1, 'You need at least one command. Available commands: cli, generateBacklog, generateFeature. Use --help for more details.')
  .strict() 
  .wrap(null)
  .parse(); 
