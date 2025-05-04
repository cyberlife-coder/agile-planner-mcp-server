/**
 * @fileoverview Module de routage MCP pour Agile Planner
 * Gère l'ensemble des handlers MCP selon la spécification 2025-03
 * @module mcp-router
 * @requires errors
 * @requires api-client
 * @requires tool-schemas
 */

const path = require('path');
const { McpError, ValidationError } = require('./errors');
const apiClient = require('./api-client');
const toolSchemas = require('./tool-schemas');
const packageInfo = require('../../package.json');

// Fonctions à importer dynamiquement pour éviter les dépendances circulaires
let generateBacklog, generateFeature;

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
 * @returns {Object} Information sur le serveur MCP conforme à la spécification 2025-03
 * @example
 * // Réponse attendue:
 * {
 *   protocolVersion: "2025-01",
 *   capabilities: { tools: true },
 *   serverInfo: { 
 *     name: "agile-planner-mcp-server", 
 *     version: "1.1.1" 
 *   }
 * }
 */
function handleInitialize() {
  return {
    protocolVersion: "2025-01",
    capabilities: {
      tools: true
    },
    serverInfo: {
      name: "agile-planner-mcp-server",
      version: packageInfo.version,
      vendor: "Agile Planner"
    }
  };
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
      // Assurer que le répertoire existe
      const fs = require('fs-extra');
      const targetDir = outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || '.';
      fs.ensureDirSync(targetDir);
      
      // Générer les fichiers markdown
      await markdownGenerator.generateMarkdownFilesFromResult({
        success: true,
        result: result.result
      }, targetDir);
      
      // Log de confirmation
      console.error(chalk.green(`✅ Fichiers du backlog générés dans ${targetDir}`));
    } catch (error) {
      console.error(chalk.red(`⚠️ Erreur lors de la génération des fichiers: ${error.message}`));
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
          epicCount: result.result?.epic ? 1 : 0,
          userStoryCount: result.result?.mvp?.length || 0,
          outputPath: outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || '.'
        }
      }
    ]
  };
}

/**
 * Handler pour l'outil generateFeature
 * @param {Object} args - Arguments de l'outil
 * @param {string} args.featureDescription - Description de la fonctionnalité
 * @param {string} [args.businessValue] - Valeur business de la fonctionnalité
 * @param {number} [args.storyCount=3] - Nombre d'user stories à générer
 * @param {string} [args.iterationName='next'] - Nom de l'itération
 * @param {string} [args.outputPath] - Chemin de sortie pour les fichiers générés
 * @returns {Promise<Object>} Résultat de la génération au format MCP
 * @throws {ValidationError} Si des paramètres requis sont manquants
 */
async function handleGenerateFeature(args) {
  // Validation
  const { featureDescription, businessValue, storyCount, iterationName, outputPath } = args;
  
  if (!featureDescription) {
    throw new ValidationError('La description de la fonctionnalité est requise');
  }
  
  // Génération de la fonctionnalité
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
  
  // Sauvegarde et génération des fichiers
  try {
    // Assurer que le répertoire existe
    const fs = require('fs-extra');
    const targetDir = outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || '.';
    fs.ensureDirSync(targetDir);
    
    // Sauvegarder les données brutes et générer les fichiers markdown
    const featureGenerator = require('./feature-generator');
    await featureGenerator.saveRawFeatureResult(result, targetDir);
    
    const markdownGenerator = require('./markdown-generator');
    await markdownGenerator.generateFeatureMarkdown(
      result, 
      targetDir, 
      iterationName || 'next'
    );
    
    // Log de confirmation
    console.error(chalk.green(`✅ Fichiers de la feature générés dans ${targetDir}`));
  } catch (error) {
    console.error(chalk.red(`⚠️ Erreur lors de la génération des fichiers: ${error.message}`));
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
          outputPath: outputPath || process.env.AGILE_PLANNER_OUTPUT_ROOT || '.'
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
