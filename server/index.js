/**
 * Agile Planner - Point d'entrée principal
 * Supporte les modes d'exécution:
 * - MCP: Serveur conforme à Model Context Protocol (2025-03)
 * - CLI: Interface en ligne de commande interactive
 * - Batch: Génération par ligne de commande directe
 */

const dotenv = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');
const { OpenAI } = require('openai');
const chalk = require('chalk');
const { MCPServer, StdioServerTransport } = require('./lib/mcp-server');

// Charger les variables d'environnement depuis .env s'il existe
try {
  const envPath = resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    process.stderr.write(chalk.blue(`Variables d'environnement chargées depuis ${envPath}\n`));
  } else {
    process.stderr.write(chalk.yellow('Fichier .env non trouvé, utilisation des variables d\'environnement existantes\n'));
  }
} catch (error) {
  process.stderr.write(chalk.red(`Erreur lors du chargement des variables d'environnement: ${error.message}\n`));
}

// Importer nos modules améliorés
const apiClient = require('./lib/api-client');
const { McpError, AgilePlannerError } = require('./lib/errors');
const mcpRouter = require('./lib/mcp-router');
const packageInfo = require('../package.json');

// Déterminer le mode d'exécution
const isCLIMode = process.argv.includes('--cli');
const isMCPMode = !isCLIMode && process.env.MCP_EXECUTION === 'true';

// Déterminer le mode à afficher
let executionMode = 'Batch';
if (isMCPMode) {
  executionMode = 'MCP';
} else if (isCLIMode) {
  executionMode = 'CLI';
}

process.stderr.write(chalk.blue(`Mode: ${executionMode}\n`));
process.stderr.write(chalk.blue(`Arguments: ${process.argv.join(', ')}\n`));
process.stderr.write(chalk.blue(`API Key: ${process.env.OPENAI_API_KEY ? 'Present' : 'Missing'}\n`));

// En mode MCP, configurer le serveur MCP
if (isMCPMode) {
  startMcpServer();
} else if (isCLIMode) {
  // En mode CLI, démarrer l'interface CLI
  startCliMode();
} else {
  // En mode batch, traiter les arguments de ligne de commande
  startBatchMode();
}

/**
 * Démarrage du serveur MCP
 */
function startMcpServer() {
  try {
    // Initialiser le client API au démarrage
    apiClient.getClient();
    
    // Créer le serveur MCP avec sa configuration
    const mcpTools = [
      {
        name: 'generateBacklog',
        description: "Génère un backlog agile complet à partir de la description d'un projet",
        inputSchema: require('./lib/tool-schemas').generateBacklogSchema,
        handler: async (params) => {
          // Extraction des paramètres
          const { projectName, projectDescription, outputPath } = params;
          
          // Vérification des paramètres requis
          if (!projectName || !projectDescription) {
            throw new Error('Le nom et la description du projet sont requis');
          }
          
          // Génération du backlog
          const { generateBacklog } = require('./lib/backlog-generator');
          const client = apiClient.getClient();
          // Déterminer le répertoire de sortie
          const finalOutputPath = outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || './output';
          // Appel à generateBacklog avec la nouvelle signature
          const result = await generateBacklog(
            projectName, 
            projectDescription, 
            client,
            apiClient.getCurrentProvider() || 'openai'
          );
          
          // Ajouter la génération de fichiers markdown
          try {
            const fs = require('fs-extra');
            
            // S'assurer que le répertoire existe
            await fs.ensureDir(finalOutputPath);
            
            const markdownGenerator = require('./lib/markdown-generator');
            
            // Sauvegarder également les données brutes JSON
            await markdownGenerator.saveRawBacklog(result, finalOutputPath);
            
            // Générer les fichiers markdown
            await markdownGenerator.generateMarkdownFilesFromResult(
              { success: true, result: result.result || result }, 
              finalOutputPath
            );
            process.stderr.write(chalk.green(`📁 Fichiers générés dans: ${finalOutputPath}\n`));
          } catch (err) {
            process.stderr.write(chalk.yellow(`⚠️ Génération des fichiers markdown: ${err.message}\n`));
          }
          
          return {
            content: [
              { 
                type: "text", 
                text: `Backlog généré avec succès pour '${projectName}'` 
              },
              {
                type: "data",
                data: {
                  epicCount: result.epics?.length || 0,
                  userStoryCount: result.userStories?.length || 0,
                  outputPath: finalOutputPath
                }
              }
            ]
          };
        }
      },
      {
        name: 'generateFeature',
        description: "Génère une fonctionnalité avec ses user stories à partir d'une description",
        inputSchema: require('./lib/tool-schemas').generateFeatureSchema,
        handler: async (params) => {
          // Extraction des paramètres
          const { featureDescription, businessValue, storyCount, iterationName, outputPath } = params;
          
          // Déterminer le répertoire de sortie
          const finalOutputPath = outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || './output';
          
          // Vérification des paramètres requis
          if (!featureDescription) {
            throw new Error('La description de la fonctionnalité est requise');
          }
          
          // Génération de la fonctionnalité
          const { generateFeature } = require('./lib/feature-generator');
          const client = apiClient.getClient();
          const result = await generateFeature(
            {
              featureDescription,
              businessValue: businessValue || '',
              storyCount: storyCount || 3,
              iterationName: iterationName || 'next'
            },
            client,
            apiClient.getCurrentProvider() || 'openai'
          );
          
          // Ajouter la génération de fichiers markdown
          try {
            const fs = require('fs-extra');
            
            // S'assurer que le répertoire existe
            await fs.ensureDir(finalOutputPath);
            
            const markdownGenerator = require('./lib/markdown-generator');
            
            // Sauvegarder les données brutes JSON
            await markdownGenerator.saveRawFeatureResult(result, finalOutputPath);
            
            // Générer les fichiers markdown
            await markdownGenerator.generateFeatureMarkdown(
              result, 
              finalOutputPath,
              iterationName || 'next'
            );
            
            process.stderr.write(chalk.green(`📁 Fichiers générés dans: ${finalOutputPath}\n`));
          } catch (err) {
            process.stderr.write(chalk.yellow(`⚠️ Génération des fichiers markdown: ${err.message}\n`));
          }
          
          return {
            content: [
              { 
                type: "text", 
                text: `Fonctionnalité générée avec succès` 
              },
              {
                type: "data",
                data: {
                  featureName: result.feature?.title,
                  storyCount: result.userStories?.length || 0,
                  outputPath: finalOutputPath
                }
              }
            ]
          };
        }
      }
    ];
    
    // Création de l'instance du serveur MCP
    const server = new MCPServer({
      namespace: 'agile-planner',
      tools: mcpTools
    });
    
    // Création du transport STDIO
    const transport = new StdioServerTransport();
    
    // Démarrage du serveur
    process.stderr.write(chalk.green(`Démarrage du serveur MCP...\n`));
    server.listen(transport);
    
    process.stderr.write(chalk.green(`Serveur MCP Agile Planner en cours d'exécution\n`));
  } catch (error) {
    process.stderr.write(chalk.red(`Erreur lors du démarrage du serveur MCP: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Démarrage du mode CLI interactif
 */
async function startCliMode() {
  try {
    process.stderr.write(chalk.green('🚀 Agile Planner Server started\n'));
    process.stderr.write(chalk.green('Mode: CLI\n'));
    
    // Initialiser le client API
    apiClient.getClient();
    
    // Charger le module CLI de façon dynamique
    const { startCLI } = require('./lib/cli');
    
    // Démarrer l'interface CLI en passant le client
    await startCLI(apiClient.getClient());
  } catch (error) {
    if (error instanceof AgilePlannerError) {
      error.printCli();
    } else {
      process.stderr.write(chalk.red(`Erreur CLI: ${error.message}\n`));
      if (error.stack) {
        process.stderr.write(chalk.grey(error.stack) + '\n');
      }
    }
    process.exit(1);
  }
}

/**
 * Démarrage du mode batch (exécution directe via ligne de commande)
 */
function startBatchMode() {
  try {
    process.stderr.write(chalk.blue('🚀 Agile Planner Server started\n'));
    process.stderr.write(chalk.blue('Mode: Batch\n'));
    
    // Analyser les arguments de la ligne de commande
    const args = process.argv.slice(2);
    
    // Si aucun argument n'est fourni, afficher l'aide
    if (args.length === 0) {
      displayBatchHelp();
      process.exit(0);
    }
    
    // Traiter les arguments selon le premier paramètre
    const command = args[0];
    
    switch (command) {
      case '--generateBacklog':
        handleGenerateBacklogCommand(args);
        break;
      case '--generateFeature':
        handleGenerateFeatureCommand(args);
        break;
      case '--help':
        displayBatchHelp();
        break;
      default:
        process.stderr.write(chalk.red(`Commande inconnue: ${command}\n`));
        displayBatchHelp();
    }
  } catch (error) {
    process.stderr.write(chalk.red(`Erreur lors de l'exécution du mode batch: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Gère la commande de génération de backlog
 * @param {string[]} args - Arguments de la ligne de commande
 */
function handleGenerateBacklogCommand(args) {
  if (args.length < 3) {
    process.stderr.write(chalk.red('Erreur: Les paramètres nom du projet et description sont requis\n'));
    process.stderr.write(chalk.yellow('Exemple: node index.js --generateBacklog "Nom du projet" "Description du projet"\n'));
    process.exit(1);
  }
  
  const projectName = args[1];
  const projectDescription = args[2];
  const outputPath = args[3] || './output';
  
  process.stderr.write(chalk.green(`Génération du backlog pour le projet: ${projectName}\n`));
  const apiClient = getClient();
  
  // Import des modules nécessaires
  const backlogGenerator = require('./lib/backlog-generator');
  const markdownGenerator = require('./lib/markdown-generator');
  
  // Assurer que le répertoire de sortie existe
  const fs = require('fs-extra');
  fs.ensureDirSync(outputPath);
  
  // Appeler la génération du backlog
  backlogGenerator.generateBacklog(projectDescription, apiClient)
    .then(async result => {
      if (!result.success) {
        throw new Error(result.error.message || 'Échec de la génération du backlog');
      }
      
      // Générer les fichiers markdown
      const fileResult = await markdownGenerator.generateMarkdownFilesFromResult({
        success: true,
        result: result.result
      }, outputPath);
      
      if (!fileResult.success) {
        throw new Error(fileResult.error.message || 'Échec de la génération des fichiers markdown');
      }
      
      process.stderr.write(chalk.green('✅ Backlog généré avec succès!\n'));
      process.stderr.write(chalk.green(`📁 Fichiers générés dans: ${outputPath}\n`));
      process.exit(0);
    })
    .catch(err => {
      process.stderr.write(chalk.red(`❌ Erreur lors de la génération du backlog: ${err.message}\n`));
      process.exit(1);
    });
}

/**
 * Gère la commande de génération de feature
 * @param {string[]} args - Arguments de la ligne de commande
 */
function handleGenerateFeatureCommand(args) {
  if (args.length < 2) {
    process.stderr.write(chalk.red('Erreur: Le paramètre description de la feature est requis\n'));
    process.stderr.write(chalk.yellow('Exemple: node index.js --generateFeature "Description de la feature" --story-count=5\n'));
    process.exit(1);
  }
  
  const featureDescription = args[1];
  const options = parseFeatureOptions(args.slice(2));
  
  process.stderr.write(chalk.green(`Génération de la feature: ${featureDescription}\n`));
  const apiClient = getClient();
  
  // Import des modules nécessaires
  const featureGenerator = require('./lib/feature-generator');
  const markdownGenerator = require('./lib/markdown-generator');
  
  // Assurer que le répertoire de sortie existe
  const fs = require('fs-extra');
  fs.ensureDirSync(options.outputPath);
  
  // Appeler la génération de la feature
  featureGenerator.generateFeature({
    featureDescription,
    businessValue: options.businessValue,
    storyCount: options.storyCount,
    iterationName: options.iterationName
  }, apiClient, 'openai')
    .then(async result => {
      // Sauvegarder les données brutes
      await featureGenerator.saveRawFeatureResult(result, options.outputPath);
      
      // Générer les fichiers markdown
      await markdownGenerator.generateFeatureMarkdown(result, options.outputPath, options.iterationName);
      
      process.stderr.write(chalk.green('✅ Feature générée avec succès!\n'));
      process.stderr.write(chalk.green(`📁 Fichiers générés dans: ${options.outputPath}\n`));
      process.exit(0);
    })
    .catch(err => {
      process.stderr.write(chalk.red(`❌ Erreur lors de la génération de la feature: ${err.message}\n`));
      process.exit(1);
    });
}

/**
 * Parse les options pour la génération de feature
 * @param {string[]} args - Arguments à analyser
 * @returns {Object} - Options analysées
 */
function parseFeatureOptions(args) {
  const options = {
    storyCount: 3,
    businessValue: '',
    iterationName: 'next',
    outputPath: './output'
  };
  
  for (const arg of args) {
    if (arg.startsWith('--story-count=')) {
      options.storyCount = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--business-value=')) {
      options.businessValue = arg.split('=')[1];
    } else if (arg.startsWith('--iteration-name=')) {
      options.iterationName = arg.split('=')[1];
    } else if (arg.startsWith('--output-path=')) {
      options.outputPath = arg.split('=')[1];
    }
  }
  
  return options;
}

/**
 * Affiche l'aide pour le mode batch
 */
function displayBatchHelp() {
  process.stderr.write(chalk.green('Agile Planner - Mode Batch\n'));
  process.stderr.write(chalk.green('Usage:\n'));
  process.stderr.write(chalk.blue('  node server/index.js --cli         ') + 'Démarrer en mode interactif\n');
  process.stderr.write(chalk.blue('  node server/index.js --help        ') + 'Afficher cette aide\n');
  process.stderr.write(chalk.blue('  node server/index.js --generateBacklog <projectName> <projectDescription> [outputPath] ') + 'Générer un backlog complet\n');
  process.stderr.write(chalk.blue('  node server/index.js --generateFeature <featureDescription> [options] ') + 'Générer une feature\n');
  process.stderr.write(chalk.grey('  Options:\n'));
  process.stderr.write(chalk.grey('    --story-count=<number>         ') + 'Nombre d\'histoires utilisateur à générer\n');
  process.stderr.write(chalk.grey('    --business-value=<string>      ') + 'Valeur métier de la fonctionnalité\n');
  process.stderr.write(chalk.grey('    --iteration-name=<string>      ') + 'Nom de l\'itération\n');
  process.stderr.write(chalk.grey('    --output-path=<path>           ') + 'Répertoire de sortie\n');
}
