/**
 * @fileoverview Module de routage MCP pour Agile Planner
 * Gère l'ensemble des handlers MCP selon la spécification 2025-03
 * @module mcp-router
 * @requires errors
 * @requires api-client
 * @requires tool-schemas
 */

const path = require('path');
const chalk = require('chalk');
const { McpError, ValidationError } = require('./errors');
const apiClient = require('./api-client');
const toolSchemas = require('./tool-schemas');
const packageInfo = require('../../package.json');

// Importer les nouvelles classes utilitaires
const { PathResolver } = require('./utils/path-resolver');

// Fonctions à importer dynamiquement pour éviter les dépendances circulaires
let generateBacklog, generateFeature, markdownTools;

// Fonction utilitaire pour la création de slugs
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Remplace les espaces par -
    .replace(/[^\w-]+/g, '')        // Supprime tous les caractères non-word
    .replace(/--+/g, '-')           // Remplace plusieurs - par un seul -
    .replace(/^-+/, '')             // Supprime - au début
    .replace(/-+$/, '');            // Supprime - à la fin
}

/**
 * Importe dynamiquement les modules de génération
 * @private
 */
function loadGenerators() {
  if (!generateBacklog) {
    try {
      generateBacklog = require('./backlog-generator').generateBacklog;
      generateFeature = require('./feature-generator').generateFeature;
    } catch (error) {
      process.stderr.write(`[ERROR] Impossible de charger les générateurs: ${error.message}\n`);
    }
  }
}

/**
 * Handler pour la méthode initialize
 * @param {Object} [req] - La requête d'initialisation (peut contenir la version du protocole)
 * @returns {Object} Information sur le serveur MCP conforme à la spécification et compatible avec le client
 */
function handleInitialize(req) {
  // Vérifier la version demandée par le client
  let clientVersion = "2025-01"; // Version par défaut (pour Windsurf)
  
  // Utilisation de chaînes optionnelles pour éviter les erreurs
  if (req?.params?.protocolVersion) {
    clientVersion = req.params.protocolVersion;
    process.stderr.write(`Initialize request with protocol version: ${clientVersion}\n`);
  }
  
  // Adapter les capabilities selon la version
  const capabilities = {
    tools: true
  };
  
  // Pour les versions 2024-11-05 et ultérieures, ajouter toolsSupport
  if (clientVersion === "2024-11-05") {
    capabilities.toolsSupport = true;
  }
  
  // Log de la version
  process.stderr.write(`Initialize request id: ${req?.id || 'unknown'}\n`);
  
  const response = {
    protocolVersion: clientVersion, // Utiliser la même version que le client
    capabilities: capabilities,
    serverInfo: {
      name: "agile-planner-mcp-server",
      version: packageInfo.version,
      vendor: "Agile Planner"
    }
  };
  
  process.stderr.write(`Initialize response sent for id: ${req?.id || 'unknown'}\n`);
  return response;
}

/**
 * Handler pour la méthode tools/list
 * @returns {Object} Liste des outils disponibles avec leur schéma d'entrée
 * @example
 * // Réponse attendue:
 * {
 *   tools: [
 *     {
 *       name: 'generateBacklog',
 *       description: "Génère un backlog agile complet...",
 *       inputSchema: { type: 'object', properties: {...} }
 *     },
 *     // Autres outils...
 *   ]
 * }
 */
function handleToolsList() {
  return {
    tools: [
      {
        name: 'generateBacklog',
        description: "Génère un backlog agile complet à partir de la description d'un projet",
        inputSchema: toolSchemas.generateBacklogSchema
      },
      {
        name: 'generateFeature',
        description: "Génère une fonctionnalité avec ses user stories à partir d'une description",
        inputSchema: toolSchemas.generateFeatureSchema
      }
    ]
  };
}

/**
 * Handler pour la méthode tools/call
 * @param {Object} req - Requête contenant le nom de l'outil et ses arguments
 * @param {string} req.params.name - Nom de l'outil à appeler
 * @param {Object} req.params.arguments - Arguments de l'outil
 * @returns {Promise<Object>} Résultat de l'appel à l'outil au format MCP
 * @throws {McpError} Si l'outil n'existe pas ou si une erreur survient
 */
async function handleToolsCall(req) {
  loadGenerators();
  
  const { name, arguments: args } = req.params;
  
  try {
    if (name === 'generateBacklog') {
      return await handleGenerateBacklog(args);
    } else if (name === 'generateFeature') {
      return await handleGenerateFeature(args);
    } else {
      throw new McpError(`Outil '${name}' non trouvé`);
    }
  } catch (error) {
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(`Erreur lors de l'exécution de l'outil '${name}'`, error);
  }
}

/**
 * Handler pour l'outil generateBacklog
 * @param {Object} args - Arguments de l'outil
 * @param {string} args.projectName - Nom du projet
 * @param {string} args.projectDescription - Description du projet
 * @param {string} [args.outputPath] - Chemin de sortie pour les fichiers générés
 * @returns {Promise<Object>} Résultat de la génération au format MCP
 * @throws {ValidationError} Si des paramètres requis sont manquants
 */
async function handleGenerateBacklog(args) {
  // Validation
  const { projectName, projectDescription, outputPath } = args;
  
  if (!projectName || !projectDescription) {
    throw new ValidationError('Le nom et la description du projet sont requis');
  }
  
  // Initialiser le PathResolver pour gérer les chemins
  const pathResolver = new PathResolver();
  
  // Génération du backlog
  const client = apiClient.getClient();
  const result = await generateBacklog(
    projectDescription, 
    client
  );
  
  // Sauvegarde et génération des fichiers
  const markdownGenerator = require('./markdown-generator');
  if (result.success) {
    try {
      // Résoudre le chemin de sortie (conversion en chemin absolu)
      const resolvedOutputPath = pathResolver.resolveOutputPath(outputPath);
      
      // Afficher clairement le chemin absolu où les fichiers seront générés
      console.error(chalk.blue(`📂 Génération des fichiers dans: ${resolvedOutputPath}`));
      
      // Générer les fichiers markdown
      const markdownResult = await markdownGenerator.generateMarkdownFilesFromResult(
        result.result,
        resolvedOutputPath
      );
      
      if (markdownResult.success) {
        // Log de confirmation
        console.error(chalk.green(`✅ Fichiers du backlog générés avec succès dans: ${markdownResult.files[0]}`));
      } else {
        // Log d'erreur
        console.error(chalk.red(`⚠️ Erreur lors de la génération des fichiers markdown: ${markdownResult.error.message}`));
      }
    } catch (error) {
      console.error(chalk.red(`⚠️ Erreur lors de la génération des fichiers: ${error.message}`));
      console.error(error.stack);
    }
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
          epicCount: result.result?.epics?.length || 0,
          userStoryCount: result.result?.mvp?.length || 0,
          outputPath: pathResolver.resolveOutputPath(outputPath)
        }
      }
    ]
  };
}

/**
 * Handler pour l'outil generateFeature
 * @param {Object} args - Arguments de l'outil
 * @param {string} args.featureDescription - Description détaillée de la feature
 * @param {number} [args.storyCount=3] - Nombre de user stories à générer
 * @param {string} [args.iterationName='next'] - Nom de l'itération
 * @param {string} [args.businessValue] - Valeur métier de la feature
 * @param {string} [args.outputPath] - Chemin de sortie pour les fichiers générés
 * @returns {Promise<Object>} Résultat de la génération au format MCP
 * @throws {ValidationError} Si des paramètres requis sont manquants
 */
async function handleGenerateFeature(args) {
  // Validation
  const { 
    featureDescription, 
    storyCount = 3,
    iterationName = 'next',
    businessValue,
    outputPath
  } = args;
  
  if (!featureDescription) {
    throw new ValidationError('La description de la feature est requise');
  }
  
  if (storyCount < 1) {
    throw new ValidationError('Le nombre de user stories doit être au moins 1');
  }
  
  // Initialiser le PathResolver pour gérer les chemins
  const pathResolver = new PathResolver();
  
  // Génération de la feature
  const client = apiClient.getClient();
  const result = await generateFeature(
    featureDescription,
    {
      storyCount,
      iterationName,
      businessValue
    },
    client
  );
  
  // Sauvegarde et génération des fichiers
  const markdownGenerator = require('./markdown-generator');
  if (result.success) {
    try {
      // Résoudre le chemin de sortie (conversion en chemin absolu)
      const resolvedOutputPath = pathResolver.resolveOutputPath(outputPath);
      
      // Afficher clairement le chemin absolu où les fichiers seront générés
      console.error(chalk.blue(`📂 Génération des fichiers dans: ${resolvedOutputPath}`));
      
      // Générer les fichiers markdown
      const featureResult = await markdownGenerator.generateFeatureMarkdown(
        result.result,
        resolvedOutputPath
      );
      
      if (featureResult.success) {
        // Log de confirmation
        console.error(chalk.green(`✅ Feature générée avec succès dans: ${featureResult.files[0]}`));
      } else {
        // Log d'erreur
        console.error(chalk.red(`⚠️ Erreur lors de la génération de la feature: ${featureResult.error.message}`));
      }
    } catch (error) {
      console.error(chalk.red(`⚠️ Erreur lors de la génération des fichiers: ${error.message}`));
      console.error(error.stack);
    }
  }
  
  return {
    content: [
      { 
        type: "text", 
        text: `Feature générée avec succès avec ${result.result.stories.length} user stories` 
      },
      {
        type: "data",
        data: {
          featureId: result.result.id,
          featureTitle: result.result.title,
          storyCount: result.result.stories.length,
          outputPath: pathResolver.resolveOutputPath(outputPath)
        }
      }
    ]
  };
}

/**
 * Traite une requête MCP
 * @param {Object} req - Requête MCP au format JSON-RPC 2.0
 * @param {string} req.jsonrpc - Version JSON-RPC (doit être "2.0")
 * @param {string} req.method - Méthode à appeler
 * @param {Object} [req.params] - Paramètres de la méthode
 * @param {string|number} req.id - Identifiant de la requête
 * @returns {Promise<Object>} - Réponse MCP au format approprié
 * @throws {McpError} - Erreur formatée pour JSON-RPC
 */
async function handleRequest(req) {
  const handlers = {
    'initialize': handleInitialize,
    'tools/list': handleToolsList,
    'tools/call': handleToolsCall
  };
  
  const handler = handlers[req.method];
  
  if (!handler) {
    throw new McpError(`Méthode '${req.method}' non trouvée`);
  }
  
  try {
    return await handler(req);
  } catch (error) {
    if (error instanceof McpError) {
      throw error.toJsonRpcError();
    }
    throw new McpError(
      error.message || 'Erreur serveur interne',
      error.details || error.stack
    ).toJsonRpcError();
  }
}

module.exports = {
  handleRequest,
  handleInitialize,
  handleToolsList,
  handleToolsCall
};
