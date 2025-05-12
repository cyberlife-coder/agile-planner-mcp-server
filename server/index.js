require('dotenv').config(); // Load .env file at the very beginning

const mcpRouter = require('./lib/mcp-router');

// Détection du mode MCP à partir des variables d'environnement ou des arguments
const isMcpMode = process.env.MCP_EXECUTION === 'true' || process.argv.includes('--mcp');

// Si en mode MCP, normaliser les sorties pour éviter l'ouverture de Notepad sur Windows
if (isMcpMode) {
  // Désactiver les couleurs pour éviter les problèmes d'affichage
  process.env.NO_COLOR = '1'; 
  
  // Capture de la référence originale pour stderr
  const originalStderrWrite = process.stderr.write;
  
  // Normalisation de stderr pour éviter que Windows ouvre des fichiers
  process.stderr.write = function(chunk, encoding, callback) {
    // Si c'est une chaîne et que ça contient 'Error', on doit s'assurer que c'est du JSON valide
    if (typeof chunk === 'string' && chunk.includes('Error')) {
      // Tester si c'est déjà du JSON
      let isValidJson = false;
      try {
        JSON.parse(chunk);
        isValidJson = true;
      } catch {
        // Ignorer l'erreur - ce n'est pas du JSON valide
        isValidJson = false;
      }
      
      // Soit on garde le JSON original, soit on encapsule dans un format JSON
      if (isValidJson) {
        // Déjà en JSON, on le laisse passer
        return originalStderrWrite.apply(this, arguments);
      } else {
        // On encapsule dans un format JSON pour éviter des problèmes
        const jsonError = JSON.stringify({
          level: 'error',
          message: chunk.replace(/\r?\n/g, ' ')
        }) + '\n';
        return originalStderrWrite.call(this, jsonError, encoding, callback);
      }
    }
    return originalStderrWrite.apply(this, arguments);
  };
}

/**
 * Formate une valeur pour l'affichage de manière sécurisée
 * @param {*} value - Valeur à formater
 * @returns {string} - Valeur formatée
 */
function formatValue(value) {
  // Utiliser les opérateurs de coalescence des nuls pour simplifier la logique
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  
  try {
    // Cas particulier des objets circulaires ou complexes
    return JSON.stringify(value, (_key, val) => {
      // Si la valeur est un objet mais pas null et a des propriétés circulaires
      if (val !== null && typeof val === 'object' && Object.keys(val).length > 20) {
        return '[Complex Object]';
      }
      return val;
    });
  } catch (error) {
    // Traitement explicite de l'erreur pour satisfaire la règle de lint
    console.error(`[DEBUG formatValue] Error stringifying object: ${error.message}`);
    // Fournir une alternative sûre
    return `[Object: ${typeof value}]`;
  }
}

// Détection plus intelligente du mode
// 1. Si l'entrée est pipée (!process.stdin.isTTY), on force le mode MCP
// 2. Si MCP_EXECUTION=true ou --mcp est présent ET qu'une commande CLI explicite n'est pas demandée
const explicitCliCommands = ['cli', 'generateBacklog', 'generateFeature'];
const hasExplicitCliCommand = process.argv.some(arg => explicitCliCommands.includes(arg));

/**
 * Fonction helper pour envoyer des logs en mode MCP de façon sécurisée 
 * conforme à JSON-RPC 2.0
 * @param {string} level - Niveau de log (info, warning, error)
 * @param {string} message - Message à logger
 */
function mcpLog(level, message) {
  // En mode MCP, nous devons être stricts sur le format des messages
  // Utiliser un format compatible JSON-RPC 2.0 pour les notifications
  const notificationLog = {
    jsonrpc: "2.0", 
    method: "$/log",  // Méthode standard pour les notifications de log
    params: { level, message }
  };
  process.stderr.write(JSON.stringify(notificationLog) + '\n');
}

// On active le mode MCP si entrée pipée OU si mode MCP demandé sans commande CLI explicite
if (!process.stdin.isTTY || (isMcpMode && !hasExplicitCliCommand)) {
  // MCP mode: input is being piped or forced via flags without explicit CLI command
  mcpLog('info', 'Starting in MCP mode');
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
      // Handle cases where stdin is piped but empty
      const errorMsg = 'MCP Error: No input received on stdin. Request must be a valid JSON-RPC object.';
      // Utiliser mcpLog au lieu de console.error pour la conformité JSON-RPC
      mcpLog('error', errorMsg);
      const errorResponse = {
        jsonrpc: "2.0",
        id: null, 
        error: { code: -32600, message: "Invalid Request", data: errorMsg }
      };
      process.stderr.write(JSON.stringify(errorResponse, null, 2) + '\n');
      process.exit(1); // Exit with error for empty MCP request
      return;
    }
    try {
      const requestJson = JSON.parse(inputData);
      const response = await mcpRouter.handleRequest(requestJson);
      process.stdout.write(JSON.stringify(response, null, 2) + '\n');
      process.exit(0); // Success
    } catch (error) {
      // Utiliser mcpLog au lieu de console.error pour assurer la conformité JSON-RPC
      mcpLog('error', `Error processing MCP request: ${error.message}`);
      
      // Format d'erreur standard JSON-RPC 2.0
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
        // Nous essayons juste de récupérer l'ID pour une réponse d'erreur plus complète.
        // Si inputData n'est pas un JSON valide à ce stade, nous enverrons la réponse d'erreur sans id.
        // Traiter l'exception en l'enregistrant pour le débogage
        mcpLog('warning', `Failed to extract request ID: ${parseError.message}`);
      }

      process.stderr.write(JSON.stringify(errorResponse, null, 2) + '\n');
      process.exit(1); // Failure
    }
  });
} else {
  // Interactive CLI mode: Initialize Yargs
  initializeYargs();
}

/**
 * Configuration de la commande CLI interactive
 * @param {Object} yargsInstance - Instance de yargs à configurer
 * @param {Object} cli - Module CLI
 */
function configureCliCommand(yargsInstance, cli) {
  yargsInstance.command('cli', 'Run in interactive CLI mode', 
    () => {},
    async (_argv) => {
      console.error('Running in interactive CLI mode (stderr)...');
      await cli.runInteractiveCLI();
    }
  );
}

/**
 * Configuration de la commande generateBacklog
 * @param {Object} yargsInstance - Instance de yargs à configurer
 * @param {Object} cli - Module CLI
 */
function configureGenerateBacklogCommand(yargsInstance, cli) {
  yargsInstance.command(
    'generateBacklog <projectName> <projectDescription>',
    'Generate backlog JSON and Markdown from a project name and description.',
    // Configuration des options de commande
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
    // Handler d'exécution
    async (argv) => handleGenerateBacklogCommand(argv, cli)
  );
}

/**
 * Handler pour la commande generateBacklog
 * @param {Object} argv - Arguments de la commande
 * @param {Object} cli - Module CLI
 */
async function handleGenerateBacklogCommand(argv, cli) {
  try {
    const options = { outputPath: argv?.outputPath }; 
    console.error('\n[DEBUG server/index.js] generateBacklog command invoked (stderr).');
    
    // Sécuriser la stringification et éviter les erreurs potentielles
    const safeArgv = { 
      projectName: argv?.projectName, 
      projectDescription: argv?.projectDescription,
      outputPath: argv?.outputPath 
    };
    
    console.error(`[DEBUG server/index.js]   argv (from handler): ${JSON.stringify(safeArgv)} (stderr)`);
    console.error(`[DEBUG server/index.js]   Project Name: ${formatValue(argv?.projectName)} (stderr)`);
    console.error(`[DEBUG server/index.js]   Project Description: ${formatValue(argv?.projectDescription)} (stderr)`);
    console.error(`[DEBUG server/index.js]   options.outputPath: ${formatValue(options?.outputPath)} (stderr)`);
    
    // Call the CLI function and capture its return value
    const result = await cli.generateBacklogCLI(
      argv?.projectName, 
      argv?.projectDescription, 
      options
    );
    
    // Sécuriser la stringification du résultat
    const resultSummary = result ? {
      success: result.success,
      error: result.error,
      outputFile: result.outputFile
    } : 'No result';
    
    console.error(`[DEBUG server/index.js] generateBacklog command finished with result: ${JSON.stringify(resultSummary)} (stderr)`);
    
    // Exit with appropriate code based on success status
    if (result?.success) {
      console.error('[DEBUG server/index.js] generateBacklog successful. Exiting with code 0. (stderr)');
      process.exit(0);
    } else {
      const errorMsg = result?.error ?? 'Unknown error';
      console.error(`[ERROR server/index.js] generateBacklog failed: ${errorMsg} (stderr)`);
      process.exit(1);
    }
  } catch (error) {
    // Amélioration de la gestion des exceptions
    const errorMessage = error?.message ?? 'Unknown error occurred';
    const errorStack = error?.stack ?? 'No stack trace available';
    
    console.error(`[ERROR server/index.js] Error in generateBacklog command: ${errorMessage} (stderr)`);
    console.error(`[ERROR server/index.js] Stack trace: ${errorStack} (stderr)`);
    process.exit(1);
  }
}

/**
 * Configuration de la commande generateFeature
 * @param {Object} yargsInstance - Instance de yargs à configurer
 * @param {Object} cli - Module CLI
 */
function configureGenerateFeatureCommand(yargsInstance, cli) {
  yargsInstance.command(
    'generateFeature <epicName> <featureDescription>',
    'Generate feature JSON and Markdown from an epic name and feature description.',
    // Configuration des options de commande
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
    // Handler d'exécution
    async (argv) => handleGenerateFeatureCommand(argv, cli)
  );
}

/**
 * Handler pour la commande generateFeature
 * @param {Object} argv - Arguments de la commande
 * @param {Object} cli - Module CLI
 */
async function handleGenerateFeatureCommand(argv, cli) {
  try {
    const options = { outputPath: argv?.outputPath };
    console.error('\n[DEBUG server/index.js] generateFeature command invoked (stderr).');
    
    // Sécuriser la stringification et éviter les erreurs potentielles
    const safeArgv = { 
      epicName: argv?.epicName, 
      featureDescription: argv?.featureDescription,
      outputPath: argv?.outputPath 
    };
    
    console.error(`[DEBUG server/index.js]   argv (from handler): ${JSON.stringify(safeArgv)} (stderr)`);
    console.error(`[DEBUG server/index.js]   Epic Name: ${formatValue(argv?.epicName)} (stderr)`);
    console.error(`[DEBUG server/index.js]   Feature Description: ${formatValue(argv?.featureDescription)} (stderr)`);
    console.error(`[DEBUG server/index.js]   options.outputPath: ${formatValue(options?.outputPath)} (stderr)`);
    
    // Call the CLI function and capture its return value
    const result = await cli.generateFeatureCLI(
      argv?.epicName, 
      argv?.featureDescription, 
      options
    );
    
    // Sécuriser la stringification du résultat
    const resultSummary = result ? {
      success: result.success,
      error: result.error,
      outputFile: result.outputFile
    } : 'No result';
    
    console.error(`[DEBUG server/index.js] generateFeature command finished with result: ${JSON.stringify(resultSummary)} (stderr)`);
    
    // Exit with appropriate code based on success status
    if (result?.success) {
      console.error('[DEBUG server/index.js] generateFeature successful. Exiting with code 0. (stderr)');
      process.exit(0);
    } else {
      const errorMsg = result?.error ?? 'Unknown error';
      console.error(`[ERROR server/index.js] generateFeature failed: ${errorMsg} (stderr)`);
      process.exit(1);
    }
  } catch (error) {
    // Amélioration de la gestion des exceptions
    const errorMessage = error?.message ?? 'Unknown error occurred';
    const errorStack = error?.stack ?? 'No stack trace available';
    
    console.error(`[ERROR server/index.js] Error in generateFeature command: ${errorMessage} (stderr)`);
    console.error(`[ERROR server/index.js] Stack trace: ${errorStack} (stderr)`);
    process.exit(1);
  }
}

/**
 * Configure les options globales de yargs
 * @param {Object} yargsInstance - Instance de yargs à configurer
 * @param {string} version - Version du projet
 */
function configureGlobalOptions(yargsInstance, version) {
  yargsInstance
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
    .wrap(null);
}

/**
 * Initialise le parser de ligne de commande yargs avec toutes les commandes disponibles
 */
function initializeYargs() {
  const cli = require('./lib/cli');
  const { version } = require('../package.json');
  const yargsInstance = require('yargs/yargs')(process.argv.slice(2));

  // Configuration générale
  yargsInstance.usage('Usage: $0 <command> [options]');
  
  // Configuration des commandes
  configureCliCommand(yargsInstance, cli);
  configureGenerateBacklogCommand(yargsInstance, cli);
  configureGenerateFeatureCommand(yargsInstance, cli);
  
  // Configuration des options globales
  configureGlobalOptions(yargsInstance, version);
  
  // Analyse des arguments
  yargsInstance.parse();
}
