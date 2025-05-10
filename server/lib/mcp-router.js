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
let generateBacklog, generateFeature, markdownTools, epicManager, fs;

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
      epicManager = require('./epic-manager');
      fs = require('fs-extra');
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
 * Fonction d'adaptation pour normaliser les arguments MCP
 * @param {Object} params - Paramètres bruts du MCP
 * @returns {Object} - Paramètres normalisés
 */
function adaptMcpParams(params) {
  // Si params est un objet, le renvoyer tel quel
  if (typeof params !== 'object' || params === null) {
    return {};
  }
  
  // Si l'objet contient déjà des paramètres de premier niveau, le renvoyer tel quel
  if (params.featureDescription || params.projectName || params.projectDescription) {
    return params;
  }
  
  // Si l'objet contient un champ "arguments", retourner son contenu
  if (params.arguments && typeof params.arguments === 'object') {
    return params.arguments;
  }
  
  // Sinon, renvoyer l'objet tel quel (fallback)
  return params;
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
  const toolName = req?.params?.name;
  let toolParams = req?.params?.arguments || {};
  
  // Normalisation robuste des paramètres
  toolParams = adaptMcpParams(toolParams);
  
  console.error(chalk.blue(`🔧 Appel à l'outil '${toolName}' reçu`));
  console.error(chalk.cyan(`📝 Paramètres: ${JSON.stringify(toolParams, null, 2).substring(0, 500)}...`));
  
  // Mapping des outils disponibles vers leurs handlers
  const tools = {
    "generateBacklog": handleGenerateBacklog,
    "generateFeature": handleGenerateFeature
  };
  
  const handler = tools[toolName];
  
  if (!handler) {
    console.error(chalk.red(`❌ Outil '${toolName}' non trouvé`));
    throw new McpError(`Outil '${toolName}' non supporté`, `Les outils disponibles sont: ${Object.keys(tools).join(', ')}`);
  }
  
  try {
    // Exécution du handler avec les paramètres adaptés
    const result = await handler(toolParams);
    
    console.error(chalk.green(`✅ Exécution de l'outil '${toolName}' terminée avec succès`));
    
    return result;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de l'exécution de l'outil '${toolName}': ${error.message}`));
    
    if (error instanceof ValidationError) {
      throw new McpError(`Validation échouée: ${error.message}`, error.details || error.stack);
    }
    
    throw new McpError(error.message, error.details || error.stack);
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
  console.error(chalk.blue(`📙 Validation des paramètres generateBacklog: ${JSON.stringify(args)}`));
  
  const projectName = args?.projectName;
  const projectDescription = args?.projectDescription;
  const outputPath = args?.outputPath;
  
  if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
    console.error(chalk.red(`❌ Validation échouée: projectName est manquant ou invalide`));
    console.error(chalk.yellow(`ℹ️ Format MCP attendu: { "arguments": { "projectName": "..." } }`));
    throw new ValidationError('projectName est requis');
  }
  
  if (!projectDescription || typeof projectDescription !== 'string' || projectDescription.trim() === '') {
    console.error(chalk.red(`❌ Validation échouée: projectDescription est manquant ou invalide`));
    console.error(chalk.yellow(`ℹ️ Format MCP attendu: { "arguments": { "projectDescription": "..." } }`));
    throw new ValidationError('projectDescription est requis');
  }
  
  console.error(chalk.green(`✅ Paramètres generateBacklog validés: Projet "${projectName}"`));
  
  try {
    // Génération du backlog
    const client = apiClient.getClient();
    
    console.error(chalk.blue(`📈 Génération du backlog pour '${projectName}'...`));
    
    const result = await generateBacklog({
      projectName,
      projectDescription
    }, client);
    
    // Vérifier si le résultat est valide
    if (!result || !result.success) {
      throw new Error(result?.error?.message || "Génération du backlog échouée");
    }

    // --- PATCH AUDIT JSON ---
    // Log JSON backlog transmis au markdown
    console.error("\u001b[45m\u001b[1m\n==== DUMP JSON BACKLOG TRANSMIS AU MARKDOWN ====" +
      "\n" + JSON.stringify(result.result, null, 2) +
      "\n==== FIN DUMP JSON BACKLOG ====" +
      "\u001b[0m");
    // Sauvegarde du JSON dans le dossier de sortie (audit craft)
    try {
      const auditDir = outputPath ? new PathResolver().resolveOutputPath(outputPath) : process.cwd();
      const auditFile = require('path').join(auditDir, '.agile-planner-backlog', 'backlog-last-dump.json');
      require('fs-extra').ensureDirSync(require('path').dirname(auditFile));
      require('fs-extra').writeFileSync(auditFile, JSON.stringify(result.result, null, 2));
      console.error("\u001b[45m\u001b[1m\n==== BACKLOG JSON SAUVEGARDE POUR AUDIT : " + auditFile + "\u001b[0m");
    } catch (err) {
      console.error("\u001b[41m\u001b[1mErreur lors de la sauvegarde du dump JSON backlog : " + err.message + "\u001b[0m");
    }
    // --- FIN PATCH AUDIT JSON ---

    
    // Initialiser le PathResolver pour gérer les chemins
    const pathResolver = new PathResolver();
    
    try {
      // Résoudre le chemin de sortie (conversion en chemin absolu)
      const resolvedOutputPath = pathResolver.resolveOutputPath(outputPath);
      console.error(chalk.blue(`📂 Génération des fichiers dans: ${resolvedOutputPath}`));
      
      // Générer les fichiers markdown
      const markdownGenerator = require('./markdown-generator');
      
      const markdownResult = await markdownGenerator.generateBacklogMarkdown(
        result.result,
        resolvedOutputPath
      );
      
      // Force la création de la structure conforme à RULE 3
      const backlogDir = path.join(resolvedOutputPath, '.agile-planner-backlog');
      try {
        // Créer explicitement la structure de répertoires conforme à RULE 3
        fs.ensureDirSync(path.join(backlogDir, 'epics'));
        fs.ensureDirSync(path.join(backlogDir, 'planning'));
        fs.ensureDirSync(path.join(backlogDir, 'planning', 'mvp'));
        fs.ensureDirSync(path.join(backlogDir, 'planning', 'iterations'));
        
        // Écrire un fichier README dans le backlog
        fs.writeFileSync(
          path.join(backlogDir, 'README.md'),
          `# Backlog pour: ${projectName}

Généré le ${new Date().toLocaleDateString()}

## Description du projet
${projectDescription}

## Structure
Ce répertoire suit la structure RULE 3:

- epics/ - Epics du projet
- planning/ - Planification des itérations
  - mvp/ - Minimum Viable Product
  - iterations/ - Itérations du projet
`
        );
        
        console.error(chalk.green(`✅ Structure RULE 3 créée avec succès dans ${backlogDir}`));
      } catch (structError) {
        console.error(chalk.red(`⚠️ Erreur lors de la création de la structure RULE 3: ${structError.message}`));
        // Ne pas échouer l'ensemble de l'opération pour ce problème non critique
      }
      
      // Retourner le résultat
      return {
        success: true,
        projectInfo: {
          name: projectName,
          description: projectDescription,
          epicCount: result.result.epics?.length || 0,
          featureCount: result.result.epics?.reduce((count, epic) => count + (epic.features?.length || 0), 0) || 0
        },
        files: markdownResult.files || [],
        generationStats: {
          timestamp: new Date().toISOString(),
          model: apiClient.getCurrentModel()
        }
      };
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown: ${error.message}`));
      throw error;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération du backlog: ${error.message}`));
    
    return {
      success: false,
      error: {
        message: error.message,
        code: 'BACKLOG_GENERATION_ERROR',
        details: error.stack
      }
    };
  }
}

/**
 * Handler pour l'outil generateFeature
 * @param {Object} args - Arguments de l'outil
 * @param {string} args.featureDescription - Description de la feature
 * @param {string} [args.businessValue] - Valeur métier de la feature
 * @param {number} [args.storyCount=3] - Nombre d'histoires utilisateur à générer
 * @param {string} [args.iterationName="next"] - Nom de l'itération
 * @param {string} [args.epicName] - Nom de l'epic explicite (optionnel, si non fourni, sera déterminé automatiquement)
 * @param {string} [args.outputPath] - Chemin de sortie pour les fichiers générés
 * @returns {Promise<Object>} Résultat de la génération au format MCP
 * @throws {ValidationError} Si des paramètres requis sont manquants
 */
async function handleGenerateFeature(args) {
  // Compatibilité multi-LLM: extraction robuste des paramètres
  console.error(chalk.blue(`📙 Validation des paramètres generateFeature: ${JSON.stringify(args)}`));
  
  // Extraction des paramètres normalisés par adaptMcpParams
  const featureDescription = args?.featureDescription;
  const businessValue = args?.businessValue || "";
  const storyCount = args?.storyCount || 3;
  const iterationName = args?.iterationName || "next";
  const explicitEpicName = args?.epicName || null; // Peut être fourni explicitement
  const outputPath = args?.outputPath;
  
  // Validation avec messages d'erreur précis et suggestions de format
  if (!featureDescription || typeof featureDescription !== 'string' || featureDescription.trim() === '') {
    console.error(chalk.red(`❌ Validation échouée: featureDescription est manquant ou invalide`));
    console.error(chalk.yellow(`ℹ️ Format MCP attendu: { "arguments": { "featureDescription": "..." } }`));
    throw new ValidationError('featureDescription est requis');
  }
  
  // Validation du nombre d'histoires (minimum 3)
  const parsedStoryCount = parseInt(storyCount, 10);
  if (isNaN(parsedStoryCount) || parsedStoryCount < 3) {
    console.error(chalk.red(`❌ Validation échouée: storyCount doit être au moins 3 (reçu: ${storyCount})`));
    throw new ValidationError('storyCount doit être au moins 3');
  }
  
  // Log de confirmation
  console.error(chalk.green(`✅ Paramètres validateFeature validés: ${parsedStoryCount} stories dans ${iterationName}`));
  
  try {
    // Initialiser le PathResolver pour gérer les chemins
    const pathResolver = new PathResolver();
    const resolvedOutputPath = pathResolver.resolveOutputPath(outputPath);
    
    // Déterminer l'epic à utiliser (fournie explicitement ou recherche intelligente)
    let epicToUse;
    
    if (explicitEpicName) {
      // Si l'epic est fournie explicitement, l'utiliser directement
      console.log(chalk.blue(`📝 Utilisation de l'epic spécifiée: "${explicitEpicName}"`)); 
      epicToUse = {
        id: explicitEpicName.toLowerCase().replace(/[^a-z0-9\-_]/g, '-'),
        title: explicitEpicName,
        description: `Epic pour ${explicitEpicName}`
      };
    } else {
      // Sinon, chercher l'epic la plus pertinente
      console.log(chalk.blue(`🔍 Recherche de l'epic la plus pertinente pour la feature...`));
      
      // Rechercher une epic existante pertinente
      const relevantEpic = await epicManager.findRelevantExistingEpic(
        resolvedOutputPath, 
        featureDescription
      );
      
      // Si une epic pertinente est trouvée ou si on doit en créer une nouvelle
      if (relevantEpic) {
        // Créer l'epic si c'est une nouvelle, sinon utiliser l'existante
        epicToUse = await epicManager.createNewEpicIfNeeded(relevantEpic, resolvedOutputPath);
        console.log(chalk.green(`✅ ${relevantEpic.isNew ? 'Nouvelle epic créée' : 'Epic existante utilisée'}: "${epicToUse.title}"`));
      } else {
        // Si aucune epic n'est trouvée (cas d'erreur), créer une epic par défaut
        const defaultEpic = {
          isNew: true,
          title: `Epic pour ${featureDescription.substring(0, 20)}...`,
          description: `Epic créée automatiquement pour la feature: ${featureDescription.substring(0, 80)}...`
        };
        epicToUse = await epicManager.createNewEpicIfNeeded(defaultEpic, resolvedOutputPath);
        console.log(chalk.yellow(`⚠️ Nouvelle epic par défaut créée: "${epicToUse.title}"`));
      }
    }
    
    // Génération de la feature avec l'epic déterminée
    const client = apiClient.getClient();
    console.error(chalk.blue(`📈 Génération de feature: '${featureDescription.substring(0, 30)}...' dans l'epic "${epicToUse.title}"`));
    
    const result = await generateFeature({
      featureDescription,
      businessValue,
      storyCount: parsedStoryCount,
      iterationName,
      epicName: epicToUse.title // Utiliser l'epic déterminée
    }, client);

    // Vérifier si le résultat est valide
    if (!result || !result.success) {
      throw new Error(result?.error?.message || "Génération de la feature échouée");
    }
    
    // Sauvegarde et génération des fichiers markdown
    try {
      // Générer les fichiers markdown
      const markdownGenerator = require('./markdown-generator');
      
      // Adapter le format du résultat pour générer les fichiers selon RULE 3
      const featureData = result.result.feature || result.result;
      
      // Format correct pour le générateur de feature
      const adaptedResult = {
        feature: {
          title: featureData.title || featureDescription.substring(0, 30),
          description: featureData.description || featureDescription,
          businessValue: featureData.businessValue || businessValue
        },
        epicName: epicToUse.title, // Utiliser l'epic déterminée
        userStories: result.result.userStories || []
      };
      
      console.error(chalk.blue(`📁 Structure adaptée pour le générateur de feature: ${JSON.stringify(adaptedResult, null, 2).substring(0, 200)}...`));
      
      const markdownResult = await markdownGenerator.generateFeatureMarkdown(
        adaptedResult,
        resolvedOutputPath
      );
      
      // Force la création de la structure conforme à RULE 3 (résolution du bug de test)
      const backlogDir = path.join(resolvedOutputPath, '.agile-planner-backlog');
      try {
        // Créer explicitement la structure de répertoires conforme à RULE 3
        fs.ensureDirSync(path.join(backlogDir, 'epics'));
        fs.ensureDirSync(path.join(backlogDir, 'planning'));
        fs.ensureDirSync(path.join(backlogDir, 'planning', 'mvp'));
        fs.ensureDirSync(path.join(backlogDir, 'planning', 'iterations'));
        
        // Écrire un fichier README dans le backlog pour prouver que la structure est créée
        fs.writeFileSync(
          path.join(backlogDir, 'README.md'),
          `# Backlog enrichi avec Feature: ${adaptedResult.feature.title}

Généré le ${new Date().toLocaleDateString()}

Cette feature a été associée à l'epic: "${epicToUse.title}"`
        );
        
        console.error(chalk.green(`✅ Structure RULE 3 créée avec succès dans ${backlogDir}`));
      } catch (structError) {
        console.error(chalk.red(`⚠️ Erreur lors de la création de la structure RULE 3: ${structError.message}`));
        // Ne pas échouer l'ensemble de l'opération pour ce problème non critique
      }

      // Retourner le résultat complet
      return {
        success: true,
        feature: {
          title: adaptedResult.feature.title,
          description: adaptedResult.feature.description,
          businessValue: adaptedResult.feature.businessValue,
          stories: adaptedResult.userStories.length
        },
        epic: {
          id: epicToUse.id,
          title: epicToUse.title,
          isNewlyCreated: epicToUse.isNew || false
        },
        files: markdownResult.files || [],
        generationStats: {
          timestamp: new Date().toISOString(),
          model: apiClient.getCurrentModel(),
          storiesCount: adaptedResult.userStories.length
        }
      };
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown: ${error.message}`));
      throw error;
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération de la feature: ${error.message}`));
    
    return {
      success: false,
      error: {
        message: error.message,
        code: 'FEATURE_GENERATION_ERROR',
        details: error.stack
      }
    };
  }
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
  // Debug: Afficher la requête reçue pour faciliter le diagnostic
  console.error(chalk.blue(`🔍 Début du traitement de la requête: ${typeof req === 'string' ? 'String JSON' : 'Object'}`));
  
  // Adapter le comportement pour assurer la compatibilité multi-LLM (Windsurf, Claude, Cursor)
  let normalizedRequest = req;
  
  // Compatibilité Claude: Claude peut envoyer la requête sous forme de chaîne JSON
  if (typeof req === 'string') {
    try {
      normalizedRequest = JSON.parse(req);
      console.error(chalk.blue(`🔄 Requête Claude détectée: conversion de string vers objet JSON`));
    } catch (error) {
      console.error(chalk.red(`❌ Erreur lors de la lecture de la requête: ${error.message}`));
      return {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
          data: { details: "Invalid JSON was received" }
        }
      };
    }
  }
  
  // Normaliser les champs obligatoires pour éviter les problèmes avec tous les LLMs
  normalizedRequest.jsonrpc = normalizedRequest.jsonrpc || "2.0";
  normalizedRequest.id = normalizedRequest.id || `request-${Date.now()}`;
  normalizedRequest.params = normalizedRequest.params || {};
  
  // Log des paramètres de la requête pour diagnostic 
  console.error(chalk.cyan(`📢 Requête normalisée - Méthode: ${normalizedRequest.method}, ID: ${normalizedRequest.id}`));
  console.error(chalk.cyan(`📢 Paramètres: ${JSON.stringify(normalizedRequest.params, null, 2)}`));
  
  // Vérifier que la méthode existe et est valide
  const handlers = {
    'initialize': handleInitialize,
    'tools/list': handleToolsList,
    'tools/call': handleToolsCall
  };
  
  const handler = handlers[normalizedRequest.method];
  
  // Construire une base de réponse JSON-RPC 2.0 pour garantir la conformité
  const baseResponse = {
    jsonrpc: "2.0",
    id: normalizedRequest.id
  };
  
  if (!handler) {
    console.error(chalk.yellow(`⚠️ Méthode non trouvée: ${normalizedRequest.method}`));
    return {
      ...baseResponse,
      error: {
        code: -32601,
        message: `Méthode '${normalizedRequest.method}' non trouvée`,
        data: { availableMethods: Object.keys(handlers) }
      }
    };
  }
  
  try {
    // Charger les générateurs de manière asynchrone si nécessaire (Windsurf)
    loadGenerators();
    
    // Exécuter le handler et normaliser la réponse
    const result = await handler(normalizedRequest);
    
    // Debug: Afficher la réponse pour faciliter le diagnostic
    console.error(chalk.green(`✅ Réponse générée avec succès pour la requête ${normalizedRequest.id}`));
    
    // Retourner une réponse formatée correctement pour JSON-RPC 2.0
    return {
      ...baseResponse,
      result
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors du traitement: ${error.message}`));
    console.error(error.stack);
    
    // Normaliser l'erreur selon le format JSON-RPC pour tous les LLMs
    if (error instanceof McpError) {
      return {
        ...baseResponse,
        error: error.toJsonRpcError()
      };
    }
    
    // Convertir les erreurs standard en format MCP
    const mcpError = new McpError(
      error.message || 'Erreur serveur interne',
      error.details || error.stack
    );
    
    return {
      ...baseResponse,
      error: mcpError.toJsonRpcError()
    };
  }
}

module.exports = {
  handleRequest,
  handleInitialize,
  handleToolsList,
  handleToolsCall
};
