#!/usr/bin/env node

const { MCPServer, StdioServerTransport } = require('./lib/mcp-server');
const dotenv = require('dotenv');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { z } = require('zod');
const { initializeClient, generateBacklog } = require('./lib/backlog-generator');
const { generateMarkdownFiles, saveRawBacklog } = require('./lib/markdown-generator');
const { startCLI } = require('./lib/cli');

// Charger les variables d'environnement
dotenv.config();

// Détection du mode MCP
const isMCPMode = process.env.MCP_EXECUTION === 'true';
const isDirectCLI = !isMCPMode;

if (isMCPMode) {
  // Mode MCP : aucune sortie parasite sur STDOUT
  // Logs de debug sur STDERR uniquement
  process.stderr.write('Mode MCP activé - démarrage du serveur MCP\n');
  process.stderr.write(`Arguments: ${process.argv.join(', ')}\n`);
  process.stderr.write(`Environnement: ${JSON.stringify(process.env.OPENAI_API_KEY ? 'API Key présente' : 'API Key manquante')}\n`);

  // Vérifier la présence de la clé API
  const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!apiKey) {
    process.stderr.write(chalk.red('Erreur: Clé API manquante. Veuillez définir OPENAI_API_KEY ou GROQ_API_KEY dans le fichier .env\n'));
    process.exit(1);
  }

  // Initialiser le client OpenAI ou GROQ
  let client;
  try {
    client = initializeClient(process.env.OPENAI_API_KEY, process.env.GROQ_API_KEY);
    process.stderr.write(chalk.green('Client API initialisé avec succès\n'));
  } catch (error) {
    process.stderr.write(chalk.red('Erreur lors de l\'initialisation du client: ') + error.message + '\n');
    process.exit(1);
  }

  // Schéma de validation pour les entrées
  const generateBacklogSchema = z.object({
    project: z.string().min(1, "La description du projet est requise"),
    saveRawJSON: z.boolean().optional().default(false)
  });

  // Création des dossiers de sortie s'ils n'existent pas
  const outputBaseDir = path.join(__dirname, '..');
  fs.ensureDirSync(path.join(outputBaseDir, 'mvp'));
  fs.ensureDirSync(path.join(outputBaseDir, 'iterations'));

  /**
   * Handler pour la commande generateBacklog
   */
  async function handleGenerateBacklog(params) {
    process.stderr.write(chalk.blue('Génération du backlog demandée avec params: ') + JSON.stringify(params) + '\n');
    try {
      // Validation des paramètres
      const validatedParams = generateBacklogSchema.parse(params);
      process.stderr.write(chalk.blue('Paramètres validés\n'));
      
      // Génération du backlog
      process.stderr.write(chalk.blue('Appel à l\'API pour générer le backlog...\n'));
      const backlog = await generateBacklog(validatedParams.project, client);
      process.stderr.write(chalk.blue('Backlog généré avec succès\n'));
      
      // Générer les fichiers Markdown
      const files = await generateMarkdownFiles(backlog, outputBaseDir);
      process.stderr.write(chalk.blue('Fichiers Markdown générés\n'));
      
      // Sauvegarder le JSON brut si demandé
      let jsonPath = null;
      if (validatedParams.saveRawJSON) {
        process.stderr.write(chalk.blue('Sauvegarde du JSON brut...\n'));
        jsonPath = await saveRawBacklog(backlog, outputBaseDir);
        process.stderr.write(chalk.blue('JSON brut sauvegardé\n'));
      }
      
      process.stderr.write(chalk.green('Traitement terminé avec succès\n'));
      return {
        success: true,
        message: "Backlog généré avec succès",
        files: {
          epic: path.join(outputBaseDir, 'epic.md'),
          mvp: path.join(outputBaseDir, 'mvp', 'user-stories.md'),
          iterations: files.iterationDirs.map(dir => path.join(dir, 'user-stories.md')),
          json: jsonPath
        }
      };
    } catch (error) {
      process.stderr.write(chalk.red('Erreur lors du traitement: ') + error.message + '\n');
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

  // Définition de l'outil MCP
  const tools = [
    {
      name: 'generateBacklog',
      description: "Génère un backlog agile complet à partir de la description d'un projet",
      parameters: {
        type: 'object',
        properties: {
          project: {
            type: 'string',
            description: 'Description détaillée du projet'
          },
          saveRawJSON: {
            type: 'boolean',
            description: 'Sauvegarder également le JSON brut généré',
            default: false
          }
        },
        required: ['project']
      },
      handler: handleGenerateBacklog
    }
  ];

  process.stderr.write(chalk.blue('Création du serveur MCP avec outils: ') + tools.map(t => t.name).join(', ') + '\n');
  
  // Création et démarrage du serveur MCP
  const server = new MCPServer({
    namespace: 'agileplanner',
    tools
  });

  // Utiliser le transport Stdio pour communiquer avec Windsurf
  process.stderr.write(chalk.blue('Configuration du transport STDIO\n'));
  const transport = new StdioServerTransport();
  
  // Écouter les erreurs
  process.on('uncaughtException', (err) => {
    process.stderr.write(chalk.red('Erreur non gérée: ') + err.message + '\n');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    process.stderr.write(chalk.red('Promesse rejetée non gérée: ') + reason.message + '\n');
  });
  
  // Démarrer le serveur
  process.stderr.write(chalk.blue('Démarrage du serveur MCP...\n'));
  server.listen(transport);
  process.stderr.write(chalk.blue('MCP Agile Planner Server est en cours d\'exécution...\n'));

} else {
  // Mode CLI: démarrer l'interface interactive
  console.log(chalk.blue('🚀 Agile Planner Server démarré'));
  console.log(chalk.blue('Mode: CLI'));
  console.log(chalk.blue(`Arguments: ${process.argv.join(', ')}`));
  console.log(chalk.blue(`Environnement: ${JSON.stringify(process.env.OPENAI_API_KEY ? 'API Key présente' : 'API Key manquante')}`));
  console.log(chalk.green('Mode CLI activé - démarrage de l\'interface interactive'));
  startCLI().catch(error => {
    console.error(chalk.red('Erreur lors de l\'exécution de l\'interface CLI:'), error);
    process.exit(1);
  });
}
