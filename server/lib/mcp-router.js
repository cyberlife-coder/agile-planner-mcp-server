/**
 * @fileoverview Module de routage MCP pour Agile Planner
 * Gère l'ensemble des handlers MCP selon la spécification 2025-03
 * @module mcp-router
 */

const path = require('path');
const chalk = require('chalk');
const fs = require('fs-extra');
const { McpError, ValidationError, ToolExecutionError } = require('./errors');
const apiClient = require('./api-client');
const toolSchemas = require('./tool-schemas');
const packageInfo = require('../../package.json');

/**
 * Formate une valeur pour l'affichage sécurisé dans les logs
 * Évite le problème de stringification par défaut '[object Object]'
 * @param {any} value - Valeur à formater
 * @returns {string} - Valeur formatée en chaîne de caractères
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // Exception silencieuse intentionnelle - aucune action possible autre que retourner un fallback
      return `[Objet non sérialisable: ${typeof value}]`;
    }
  }
  return String(value);
}

// Fonctions à importer dynamiquement pour éviter les dépendances circulaires
// Elles sont chargées par loadGenerators() au premier appel d'un handler les utilisant.
let generateBacklog, generateFeature, epicManager;

/**
 * Importe dynamiquement les modules de génération.
 * Appelée au besoin pour éviter les dépendances circulaires au démarrage.
 * @private
 */
function loadGenerators() {
  if (!generateBacklog) { // Check if already loaded
    try {
      generateBacklog = require('./backlog-generator').generateBacklog;
      generateFeature = require('./feature-generator').generateFeature;
      epicManager = require('./epic-manager'); 
      // fs-extra is already required globally, no need to load it here specifically for generators if they use the global one.
      console.error(chalk.magentaBright('MCP-ROUTER: Dynamically loaded generator modules.'));
    } catch (error) {
      // Log to stderr and throw to make the loading failure obvious and halt if critical
      const loadErrorMsg = `[FATAL_MCP_ROUTER_ERROR] Impossible de charger dynamiquement les modules générateurs: ${error.message}`;
      console.error(chalk.bgRed.whiteBright(loadErrorMsg));
      process.stderr.write(loadErrorMsg + '\n' + error.stack + '\n');
      throw new Error(loadErrorMsg); // Halt if generators can't load
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
 * Extrait et normalise les paramètres de l'outil à partir de la requête
 * @param {Object} req - Requête contenant les paramètres
 * @returns {Object} - Les paramètres normalisés et le nom de l'outil
 * @private
 */
function _extractToolParams(req) {
  const toolName = req?.params?.name;
  let toolParams = req?.params?.arguments || {};
  
  // Normalisation robuste des paramètres
  toolParams = adaptMcpParams(toolParams);
  
  console.error(chalk.blue(`🔧 Appel à l'outil '${toolName}' reçu`));
  console.error(chalk.cyan(`📝 Paramètres: ${JSON.stringify(toolParams, null, 2).substring(0, 500)}...`));
  
  return { toolName, toolParams };
}

/**
 * Obtient le handler correspondant au nom de l'outil
 * @param {string} toolName - Nom de l'outil demandé
 * @returns {Function} - Handler de l'outil
 * @throws {McpError} - Si l'outil n'existe pas
 * @private
 */
function _getToolHandler(toolName) {
  // Mapping des outils disponibles vers leurs handlers
  const tools = {
    "generateBacklog": handleGenerateBacklog,
    "generateFeature": handleGenerateFeature
  };
  
  const handler = tools[toolName];
  
  if (!handler) {
    console.error(chalk.red(`❌ Outil '${toolName}' non trouvé`));
    throw new McpError(
      `Outil '${toolName}' non supporté`, 
      `Les outils disponibles sont: ${Object.keys(tools).join(', ')}`
    );
  }
  
  return handler;
}

/**
 * Gère les erreurs d'exécution d'outil
 * @param {string} toolName - Nom de l'outil
 * @param {Error} error - Erreur survenue
 * @throws {McpError} - Erreur formatée pour le client MCP
 * @private
 */
function _handleToolError(toolName, error) {
  console.error(chalk.red(`❌ Erreur lors de l'exécution de l'outil '${toolName}': ${error.message}`));
  
  if (error instanceof ValidationError) {
    throw new McpError(`Validation échouée: ${error.message}`, error.details || error.stack);
  }
  
  throw new McpError(error.message, error.details || error.stack);
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
  // Étape 1: Extraire et normaliser les paramètres
  const { toolName, toolParams } = _extractToolParams(req);
  
  // Étape 2: Obtenir le handler de l'outil
  const handler = _getToolHandler(toolName);
  
  try {
    // Étape 3: Exécuter le handler avec les paramètres
    const result = await handler(toolParams);
    
    // Étape 4: Log et retour du résultat
    console.error(chalk.green(`✅ Exécution de l'outil '${toolName}' terminée avec succès`));
    return result;
  } catch (error) {
    // Étape 5: Gestion des erreurs
    _handleToolError(toolName, error);
  }
}

/**
 * Valide les paramètres d'entrée pour la génération de backlog
 * @param {Object} args - Arguments à valider
 * @returns {Object} - Paramètres validés et normalisés
 * @throws {ValidationError} - Si des paramètres requis sont manquants
 * @private
 */
function _validateBacklogParams(args) {
  console.error(chalk.cyanBright('MCP-ROUTER: Validating backlog parameters'));
  const projectName = args?.projectName;
  const projectDescription = args?.projectDescription;
  const outputPath = args?.outputPath;
  
  console.error(chalk.cyanBright(`MCP-ROUTER: Params - ProjectName: ${formatValue(projectName)}, OutputPath: ${formatValue(outputPath)}`));

  if (!projectName || !projectDescription) {
    console.error(chalk.redBright('MCP-ROUTER: Validation ERROR - projectName or projectDescription missing!'));
    throw new ValidationError("Le nom et la description du projet sont requis.", {
      tool: 'generateBacklog',
      missingFields: (!projectName ? ['projectName'] : []).concat(!projectDescription ? ['projectDescription'] : [])
    });
  }
  
  return { projectName, projectDescription, outputPath };
}

/**
 * Génère le backlog via le générateur principal
 * @param {string} projectName - Nom du projet
 * @param {string} projectDescription - Description du projet
 * @returns {Promise<Object>} - Les données du backlog généré
 * @throws {ToolExecutionError} - Si la génération échoue
 * @private
 */
async function _generateBacklogData(projectName, projectDescription) {
  console.error(chalk.yellowBright('MCP-ROUTER: Generating backlog data...'));
  const backlogData = await generateBacklog(
    projectName,
    projectDescription,
    apiClient.getClient(), 
    null,
    null
  );
  console.error(chalk.greenBright('MCP-ROUTER: Backlog data generated successfully. Result object keys: ' + Object.keys(backlogData || {}).join(', ')));

  // Validation basique des données
  if (!backlogData || typeof backlogData.projectName !== 'string') {
    console.error(chalk.redBright('MCP-ROUTER: Backlog data is invalid (missing projectName).'));
    throw new ToolExecutionError("La génération initiale du backlog JSON n'a pas retourné de données valides.", { 
      tool: 'generateBacklog', 
      step: 'initial_json_validation' 
    });
  }
  
  return backlogData;
}

/**
 * Sauvegarde un JSON d'audit du backlog généré
 * @param {Object} backlogData - Données du backlog à sauvegarder
 * @param {string} outputPath - Chemin de sortie pour le fichier d'audit
 * @private
 */
function _saveBacklogAudit(backlogData, outputPath) {
  try {
    const resolvedOutputPath = path.resolve(process.cwd(), outputPath || '.agile-planner-backlog');
    fs.ensureDirSync(resolvedOutputPath);
    
    const auditFile = path.join(resolvedOutputPath, 'backlog-last-dump.json');
    fs.writeFileSync(auditFile, JSON.stringify(backlogData, null, 2));
    console.error(chalk.blueBright(`MCP-ROUTER: Audit JSON sauvegardé dans ${auditFile}`));
  } catch (auditError) {
    console.error(chalk.yellow(`MCP-ROUTER: La sauvegarde du JSON d'audit a échoué: ${auditError.message}`));
    // Ne pas interrompre le processus principal pour cette erreur non critique
  }
}

/**
 * Crée la structure de répertoires conforme à RULE 3
 * @param {string} backlogDir - Répertoire racine du backlog
 * @param {Object} backlogData - Données du backlog
 * @private
 */
function _createRule3Structure(backlogDir, backlogData) {
  try { 
    console.error(chalk.yellowBright('MCP-ROUTER: Creating RULE 3 file structure...'));
    
    // Créer la structure de base
    _createBaseStructure(backlogDir);
    
    // Créer la structure pour tous les epics et leurs features
    _createEpicsStructure(backlogDir, backlogData);
    
    // Créer le fichier README
    _createReadmeFile(backlogDir, backlogData);
    
    console.error(chalk.green('MCP-ROUTER: RULE 3 structure created successfully'));
  } catch (error) {
    console.error(chalk.red(`MCP-ROUTER: Error creating RULE 3 structure: ${error.message}`));
    // Ne pas interrompre le processus principal pour cette erreur non critique
  }
}

/**
 * Crée les répertoires de base pour la structure RULE 3
 * @param {string} backlogDir - Répertoire racine du backlog
 * @private
 */
function _createBaseStructure(backlogDir) {
  // ⏰ RULE 3: Création des répertoires principaux
  fs.ensureDirSync(path.join(backlogDir, 'epics'));
  fs.ensureDirSync(path.join(backlogDir, 'orphan-stories'));
  
  // ✅ IMPORTANT: Les dossiers planning/mvp et planning/iterations sont obsolètes selon la RULE 3 actuelle
  // et ne sont plus créés ici
}

/**
 * Crée la structure de répertoires pour tous les epics et leurs features
 * @param {string} backlogDir - Répertoire racine du backlog
 * @param {Object} backlogData - Données du backlog
 * @private
 */
function _createEpicsStructure(backlogDir, backlogData) {
  if (!backlogData?.epics || !Array.isArray(backlogData.epics)) {
    return;
  }
  
  for (const epic of backlogData.epics) {
    _createEpicStructure(backlogDir, epic);
  }
}

/**
 * Crée la structure de répertoires pour un epic spécifique et ses features
 * @param {string} backlogDir - Répertoire racine du backlog
 * @param {Object} epic - Données de l'epic
 * @private
 */
function _createEpicStructure(backlogDir, epic) {
  if (!epic?.id) {
    return;
  }
  
  const epicSlug = epic.id.toLowerCase().replace(/[^a-z0-9\-_]/g, '-');
  const epicDir = path.join(backlogDir, 'epics', epicSlug);
  fs.ensureDirSync(epicDir);
  
  // Créer le dossier features pour cet epic
  const featuresDir = path.join(epicDir, 'features');
  fs.ensureDirSync(featuresDir);
  
  // Si l'epic a des features, créer la structure complète pour chaque feature
  _createFeaturesStructure(featuresDir, epic.features);
}

/**
 * Crée la structure de répertoires pour toutes les features d'un epic
 * @param {string} featuresDir - Répertoire des features d'un epic
 * @param {Array} features - Liste des features
 * @private
 */
function _createFeaturesStructure(featuresDir, features) {
  if (!features || !Array.isArray(features)) {
    return;
  }
  
  for (const feature of features) {
    _createFeatureStructure(featuresDir, feature);
  }
}

/**
 * Crée la structure de répertoires pour une feature spécifique
 * @param {string} featuresDir - Répertoire des features d'un epic
 * @param {Object} feature - Données de la feature
 * @private
 */
function _createFeatureStructure(featuresDir, feature) {
  if (!feature?.id) {
    return;
  }
  
  const featureSlug = feature.id.toLowerCase().replace(/[^a-z0-9\-_]/g, '-');
  const featureDir = path.join(featuresDir, featureSlug);
  fs.ensureDirSync(featureDir);
  
  // Créer le dossier user-stories pour cette feature
  fs.ensureDirSync(path.join(featureDir, 'user-stories'));
}

/**
 * Crée le fichier README.md dans le répertoire du backlog
 * @param {string} backlogDir - Répertoire racine du backlog
 * @param {Object} backlogData - Données du backlog
 * @private
 */
function _createReadmeFile(backlogDir, backlogData) {
  fs.writeFileSync(
    path.join(backlogDir, 'README.md'),
    `# Backlog pour: ${backlogData?.projectName || 'Projet Inconnu'}\n\nCe backlog a été généré par Agile Planner.`
  );
}

/**
 * Génère les fichiers markdown pour le backlog
 * @param {Object} backlogData - Données du backlog
 * @param {string} outputPath - Chemin de sortie pour les fichiers markdown
 * @returns {Promise<Object>} - Résultat de la génération des fichiers markdown
 * @private
 */
async function _generateMarkdownFiles(backlogData, outputPath) {
  console.error(chalk.blue('MCP-ROUTER: Generating markdown files...'));
  const resolvedOutputPath = outputPath ? path.resolve(process.cwd(), outputPath) : process.cwd();
  
  const markdownGenerator = require('./markdown-generator');
  const markdownResult = await markdownGenerator.generateMarkdownFiles(
    backlogData, 
    resolvedOutputPath
  );
  
  console.error(chalk.greenBright('MCP-ROUTER: Markdown files generated successfully'));
  return { markdownResult, resolvedOutputPath };
}

/**
 * Réinitialise les propriétés d'un client API à null
 * @param {Object} client - Client API à nettoyer
 * @private
 */
function _resetClientProperties(client) {
  // Liste des propriétés à nettoyer
  const propertiesToClean = [
    '_options', 'completions', 'chat', 'embeddings', 'files',
    'images', 'audio', 'moderations', 'models', 'fineTuning', 'beta'
  ];
  
  // Réinitialiser chaque propriété si elle existe
  propertiesToClean.forEach(prop => {
    if (client?.[prop]) client[prop] = null;
  });
  
  // Cas spécial pour la propriété imbriquee
  if (client?.chat?.completions) client.chat.completions = null;
}

/**
 * Force le garbage collector si disponible
 * @private
 */
function _forceGarbageCollection() {
  if (global.gc) {
    console.error('MCP-ROUTER: Forcing garbage collection...');
    global.gc();
  }
}

/**
 * Nettoie les ressources API pour éviter les fuites mémoire
 * @private
 */
function _cleanupApiClient() {
  try {
    const client = apiClient.getClient();
    if (!client || typeof client !== 'object') return;

    // Nettoyage des références circulaires pour éviter les fuites mémoire
    console.error('MCP-ROUTER: Cleaning up API client references...');
    
    // Étape 1: Réinitialiser les propriétés du client
    _resetClientProperties(client);
    
    // Étape 2: Forcer le garbage collection si disponible
    _forceGarbageCollection();
  } catch (cleanupError) {
    console.error(`MCP-ROUTER: Error during client cleanup: ${cleanupError.message}`);
    // Continuer malgré une erreur de nettoyage - ne pas affecter la réponse
  }
}

/**
 * Prépare l'objet de réponse pour la génération du backlog
 * @param {Object} backlogData - Données du backlog généré
 * @param {Object} markdownResult - Résultat de la génération markdown
 * @returns {Object} Objet de réponse formaté pour le client MCP
 * @private
 */
function _prepareBacklogResponse(backlogData, markdownResult) {
  return {
    success: true,
    backlog: {
      projectName: backlogData.projectName,
      epics: backlogData.epics ? backlogData.epics.length : 0,
      iterations: backlogData.iterations ? backlogData.iterations.length : 0,
      planning: backlogData.planning ? 'Included' : 'Not included',
      userStories: markdownResult.totalUserStories || 'Unknown',
      files: markdownResult.files || []
    }
  };
}

/**
 * Gère les erreurs de génération de backlog
 * @param {Error} error - Erreur survenue
 * @throws {Error} - Retransmet l'erreur appropriée
 * @private
 */
function _handleBacklogGenerationError(error) {
  // Journalisation détaillée de l'erreur pour faciliter le diagnostic
  console.error(chalk.redBright('MCP-ROUTER: Error in handleGenerateBacklog'));
  console.error(chalk.redBright(`MCP-ROUTER: Error type: ${error.constructor.name}`));
  console.error(chalk.redBright(`MCP-ROUTER: Error message: ${error.message}`));
  console.error(chalk.redBright(`MCP-ROUTER: Error stack: ${error.stack}`));

  // Propagation des erreurs spécifiques connues
  if (error instanceof ToolExecutionError || error instanceof ValidationError) {
    throw error; // Re-throw specific known errors
  }
  
  // Encapsulation des erreurs inattendues pour un meilleur formatage
  throw new McpError(`Erreur inattendue majeure dans handleGenerateBacklog: ${error.message}`, {
    details: error.stack
  });
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
  console.error(chalk.cyanBright('MCP-ROUTER: Entered handleGenerateBacklog.'));
  
  try {
    // Étape 1: Validation des paramètres
    const { projectName, projectDescription, outputPath } = _validateBacklogParams(args);

    // Étape 2: Génération du backlog
    const backlogData = await _generateBacklogData(projectName, projectDescription);

    // Étape 3: Sauvegarde du JSON d'audit
    _saveBacklogAudit(backlogData, outputPath);
    
    // Étape 4: Génération des fichiers markdown
    const { markdownResult, resolvedOutputPath } = await _generateMarkdownFiles(backlogData, outputPath);
    
    // Étape 5: Création de la structure RULE 3
    _createRule3Structure(resolvedOutputPath, backlogData);
    
    // Étape 6: Nettoyage des ressources (client API)
    _cleanupApiClient();

    // Étape 7: Préparation de la réponse
    return _prepareBacklogResponse(backlogData, markdownResult);
  } catch (error) {
    _handleBacklogGenerationError(error);
  }
}

/**
 * Valide les paramètres d'entrée pour la génération de feature
 * @param {Object} args - Arguments bruts à valider
 * @returns {Object} - Paramètres validés et normalisés
 * @throws {ValidationError} - Si la validation échoue
 */
function validateFeatureParams(args) {
  // Extraction des paramètres et application des valeurs par défaut
  const featureDescription = args?.featureDescription;
  const businessValue = args?.businessValue || "";
  const storyCount = args?.storyCount || 3;
  const iterationName = args?.iterationName || "next";
  const explicitEpicName = args?.epicName || null;
  const outputPath = args?.outputPath;
  
  // Validation de la description de la feature
  if (!featureDescription || typeof featureDescription !== 'string' || featureDescription.trim() === '') {
    console.error(chalk.red(`❌ Validation échouée: featureDescription est manquant ou invalide`));
    console.error(chalk.yellow(`ℹ️ Format MCP attendu: { "arguments": { "featureDescription": "..." } }`));
    throw new ValidationError('featureDescription est requis');
  }
  
  // Validation du nombre d'histoires (minimum 3)
  const parsedStoryCount = parseInt(storyCount, 10);
  if (isNaN(parsedStoryCount) || parsedStoryCount < 3) {
    console.error(chalk.red(`❌ Validation échouée: storyCount doit être au moins 3 (reçu: ${formatValue(storyCount)})`));
    throw new ValidationError('storyCount doit être au moins 3');
  }
  
  return {
    featureDescription,
    businessValue,
    parsedStoryCount,
    iterationName,
    explicitEpicName,
    outputPath
  };
}

/**
 * Détermine l'epic à utiliser pour la feature
 * @param {string} explicitEpicName - Nom explicite de l'epic (si fourni)
 * @param {string} featureDescription - Description de la feature
 * @param {string} resolvedOutputPath - Chemin de sortie résolu
 * @returns {Promise<Object>} - L'epic à utiliser
 */
async function determineEpicToUse(explicitEpicName, featureDescription, resolvedOutputPath) {
  let epicToUse;
  
  if (explicitEpicName) {
    // Si l'epic est fournie explicitement, l'utiliser directement
    console.error(chalk.blue(`📝 Utilisation de l'epic spécifiée: "${formatValue(explicitEpicName)}"`)); 
    epicToUse = {
      id: explicitEpicName.toLowerCase().replace(/[^a-z0-9\-_]/g, '-'),
      title: explicitEpicName,
      description: `Epic pour ${explicitEpicName}`
    };
    return epicToUse;
  }
  
  // Sinon, chercher l'epic la plus pertinente
  console.error(chalk.blue(`🔍 Recherche de l'epic la plus pertinente pour la feature...`));
  
  // Rechercher une epic existante pertinente
  const relevantEpic = await epicManager.findRelevantExistingEpic(
    resolvedOutputPath, 
    featureDescription
  );
  
  // Si une epic pertinente est trouvée ou si on doit en créer une nouvelle
  if (relevantEpic) {
    // Créer l'epic si c'est une nouvelle, sinon utiliser l'existante
    epicToUse = await epicManager.createNewEpicIfNeeded(relevantEpic, resolvedOutputPath);
    console.error(chalk.green(`✅ ${relevantEpic.isNew ? 'Nouvelle epic créée' : 'Epic existante utilisée'}: "${formatValue(epicToUse.title)}"`));
    return epicToUse;
  }
  
  // Si aucune epic n'est trouvée (cas d'erreur), créer une epic par défaut
  const defaultEpic = {
    isNew: true,
    title: `Epic pour ${featureDescription.substring(0, 20)}...`,
    description: `Epic créée automatiquement pour la feature: ${featureDescription.substring(0, 80)}...`
  };
  epicToUse = await epicManager.createNewEpicIfNeeded(defaultEpic, resolvedOutputPath);
  console.error(chalk.yellow(`⚠️ Nouvelle epic par défaut créée: "${formatValue(epicToUse.title)}"`));
  
  return epicToUse;
}

/**
 * Crée la structure RULE 3 dans le dossier de sortie
 * @param {string} backlogDir - Répertoire du backlog
 * @param {Object} adaptedResult - Résultat adapté pour la génération
 * @param {Object} epicToUse - Epic utilisée
 */
/**
 * Vérifie et normalise les paramètres d'entrée pour la structure RULE 3
 * @param {string} backlogDir - Répertoire du backlog à vérifier
 * @param {Object} epicToUse - Epic à vérifier
 * @param {Object} adaptedResult - Résultat adapté à vérifier
 * @returns {Object|null} - Paramètres normalisés ou null si validation échouée
 * @private
 */
function _validateRule3Params(backlogDir, epicToUse, adaptedResult) {
  let validBacklogDir = backlogDir;
  let validEpicToUse = epicToUse;
  
  // Vérifier le répertoire de sortie
  if (!validBacklogDir || typeof validBacklogDir !== 'string') {
    console.error(chalk.red(`⚠️ ERREUR: backlogDir invalide (${validBacklogDir})`));
    validBacklogDir = process.cwd(); // Fallback sur le répertoire courant
    console.error(chalk.yellow(`❗ Utilisation du répertoire courant comme fallback: ${validBacklogDir}`));
  }
  
  // Vérifier l'epic
  if (!validEpicToUse || typeof validEpicToUse !== 'object' || !validEpicToUse.title) {
    console.error(chalk.red(`⚠️ ERREUR: epicToUse invalide`));
    // Créer un epic par défaut pour éviter l'échec
    validEpicToUse = {
      title: "Default Epic",
      isNew: true
    };
    console.error(chalk.yellow(`❗ Utilisation d'un epic par défaut: ${validEpicToUse.title}`));
  }
  
  // Vérifier le résultat adapté
  if (!adaptedResult || typeof adaptedResult !== 'object' || !adaptedResult.feature) {
    console.error(chalk.red(`⚠️ ERREUR: adaptedResult invalide ou sans feature`));
    return null; // Impossible de continuer sans un résultat adapté valide
  }
  
  return { validBacklogDir, validEpicToUse };
}

/**
 * Crée la structure de base pour RULE 3
 * @param {string} backlogDir - Répertoire du backlog
 * @returns {boolean} - Succès de la création
 * @private
 */
function _createBaseRule3Directories(backlogDir) {
  try {
    fs.ensureDirSync(path.join(backlogDir, 'epics'));
    console.error(chalk.green(`✔ Répertoire epics créé`));
    
    fs.ensureDirSync(path.join(backlogDir, 'planning'));
    fs.ensureDirSync(path.join(backlogDir, 'planning', 'mvp'));
    fs.ensureDirSync(path.join(backlogDir, 'planning', 'iterations'));
    console.error(chalk.green(`✔ Répertoires de planning créés`));
    
    return true;
  } catch (err) {
    console.error(chalk.red(`❌ Erreur lors de la création des répertoires de base: ${err.message}`));
    return false;
  }
}

/**
 * Charge ou crée une fonction slugify
 * @returns {Function} - Fonction slugify
 * @private
 */
function _getSlugifyFunction() {
  try {
    return require('slugify');
  } catch (err) {
    console.error(chalk.red(`❌ Erreur lors du chargement de slugify: ${err.message}`));
    // Implémentation de secours basique pour slugify (lint ID: a6d77e7e-6206-429a-a22a-b426ba042d6f)
    return (text, options) => {
      const lowerCase = options?.lower ? text.toLowerCase() : text;
      return lowerCase.replace(/[^a-z0-9]+/g, '-').replace(/(^-)|(-$)/g, '');
    };
  }
}

/**
 * Crée la structure RULE 3 dans le dossier de sortie
 * Fonction refactorisée pour réduire la complexité cognitive (lint ID: 4ed43f7b-d889-4ab9-bc2d-78b84fdbd4ac)
 * @param {string} backlogDir - Répertoire du backlog
 * @param {Object} adaptedResult - Résultat adapté pour la génération
 * @param {Object} epicToUse - Epic utilisée
 */
function createRule3Structure(backlogDir, adaptedResult, epicToUse) {
  console.error(chalk.yellowBright('MCP-ROUTER: Creating RULE 3 file structure for feature...'));
  
  // Afficher les paramètres d'entrée pour diagnostic
  console.error(chalk.cyan(`🔍 Paramètres createRule3Structure:`));
  console.error(chalk.cyan(`  backlogDir: ${backlogDir}`));
  console.error(chalk.cyan(`  epicToUse: ${formatValue(epicToUse)}`));
  console.error(chalk.cyan(`  adaptedResult: ${formatValue(adaptedResult).substring(0, 300)}...`));
  
  try {
    // Valider et normaliser les paramètres
    const validParams = _validateRule3Params(backlogDir, epicToUse, adaptedResult);
    if (!validParams) return null;
    
    const { validBacklogDir } = validParams;
    
    // Créer la structure de base
    if (!_createBaseRule3Directories(validBacklogDir)) {
      return null;
    }
    
    // Créer la structure de base en gérant les erreurs individuellement
    try {
      fs.ensureDirSync(path.join(backlogDir, 'epics'));
      console.error(chalk.green(`✔ Répertoire epics créé`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du répertoire epics: ${err.message}`));
    }
    
    try {
      fs.ensureDirSync(path.join(backlogDir, 'planning'));
      fs.ensureDirSync(path.join(backlogDir, 'planning', 'mvp'));
      fs.ensureDirSync(path.join(backlogDir, 'planning', 'iterations'));
      console.error(chalk.green(`✔ Répertoires de planning créés`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création des répertoires planning: ${err.message}`));
    }
    
    // Obtenir le slug de l'epic à partir du titre
    let slugify;
    try {
      slugify = require('slugify');
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors du chargement de slugify: ${err.message}`));
      // Implémentation de secours basique pour slugify
      slugify = (text, options) => {
        const lowerCase = options?.lower ? text.toLowerCase() : text;
        // Rendre explicite la précédence des opérateurs dans l'expression régulière (lint ID: a6d77e7e-6206-429a-a22a-b426ba042d6f)
        return lowerCase.replace(/[^a-z0-9]+/g, '-').replace(/^(-)|(-)$/g, '');
      };
      console.error(chalk.yellow(`❗ Utilisation d'une fonction slugify de secours`));
    }
    
    // Générer et valider le slug de l'epic
    const epicTitle = epicToUse.title || "default-epic";
    const epicSlug = slugify(epicTitle, { lower: true, strict: true });
    console.error(chalk.blue(`MCP-ROUTER: Epic title: "${epicTitle}", slug généré: "${epicSlug}"`));
    
    // Créer le chemin complet pour l'epic et la feature
    const epicDir = path.join(backlogDir, 'epics', epicSlug);
    const featuresDir = path.join(epicDir, 'features');
    const featureTitle = adaptedResult.feature.title || "default-feature";
    const featureSlug = slugify(featureTitle, { lower: true, strict: true });
    const featureDir = path.join(featuresDir, featureSlug);
    const userStoriesDir = path.join(featureDir, 'user-stories');
    
    // Afficher les chemins complets pour diagnostic
    console.error(chalk.cyan(`💻 Chemins générés:`));
    console.error(chalk.cyan(`  epicDir: ${epicDir}`));
    console.error(chalk.cyan(`  featuresDir: ${featuresDir}`));
    console.error(chalk.cyan(`  featureDir: ${featureDir}`));
    console.error(chalk.cyan(`  userStoriesDir: ${userStoriesDir}`));
    
    // Créer les répertoires en gérant les erreurs individuellement
    try {
      fs.ensureDirSync(epicDir);
      console.error(chalk.green(`✔ Répertoire de l'epic créé: ${epicDir}`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du répertoire de l'epic: ${err.message}`));
      return; // Impossible de continuer sans le répertoire de l'epic
    }
    
    try {
      fs.ensureDirSync(featuresDir);
      console.error(chalk.green(`✔ Répertoire des features créé: ${featuresDir}`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du répertoire des features: ${err.message}`));
      return; // Impossible de continuer sans le répertoire des features
    }
    
    try {
      fs.ensureDirSync(featureDir);
      console.error(chalk.green(`✔ Répertoire de la feature créé: ${featureDir}`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du répertoire de la feature: ${err.message}`));
      return; // Impossible de continuer sans le répertoire de la feature
    }
    
    try {
      fs.ensureDirSync(userStoriesDir);
      console.error(chalk.green(`✔ Répertoire des user stories créé: ${userStoriesDir}`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du répertoire des user stories: ${err.message}`));
      // On peut continuer même sans ce répertoire
    }
    
    // Créer un README pour les user-stories si aucune n'a été trouvée
    if (!adaptedResult.userStories || adaptedResult.userStories.length === 0) {
      try {
        fs.writeFileSync(
          path.join(userStoriesDir, 'README.md'),
          `# 📭 Aucune user story générée pour cette feature

Ce dossier a été créé automatiquement par Agile Planner.`
        );
        console.error(chalk.green(`✔ README pour user stories vides créé`));
      } catch (err) {
        console.error(chalk.red(`❌ Erreur lors de la création du README pour user stories: ${err.message}`));
      }
    }
    
    // Écrire un fichier README dans le backlog pour traçabilité
    try {
      fs.writeFileSync(
        path.join(backlogDir, 'README.md'),
        `# Backlog enrichi avec Feature: ${adaptedResult.feature.title}

Généré le ${new Date().toLocaleDateString()}

Cette feature a été associée à l'epic: "${epicToUse.title}"`
      );
      console.error(chalk.green(`✔ README de traçabilité créé`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la création du README de traçabilité: ${err.message}`));
    }
    
    // Sauvegarder les informations de la feature et des user stories dans des fichiers spécifiques
    // pour aider au débogage et assurer la traçabilité
    try {
      fs.writeFileSync(
        path.join(featureDir, 'feature-info.json'),
        JSON.stringify(adaptedResult.feature, null, 2)
      );
      console.error(chalk.green(`✔ Feature info sauvegardée pour référence`));
    } catch (err) {
      console.error(chalk.red(`❌ Erreur lors de la sauvegarde des infos de feature: ${err.message}`));
    }
    
    if (adaptedResult.userStories && adaptedResult.userStories.length > 0) {
      try {
        fs.writeFileSync(
          path.join(userStoriesDir, 'stories-info.json'),
          JSON.stringify(adaptedResult.userStories, null, 2)
        );
        console.error(chalk.green(`✔ Stories info sauvegardées pour référence`));
      } catch (err) {
        console.error(chalk.red(`❌ Erreur lors de la sauvegarde des infos de stories: ${err.message}`));
      }
    }
    
    console.error(chalk.green(`✅ Structure RULE 3 créée avec succès dans ${backlogDir}`));
    return { epicSlug, featureSlug }; // Retourner les slugs pour référence
  } catch (structError) {
    console.error(chalk.red(`⚠️ Erreur générale lors de la création de la structure RULE 3: ${structError.message}`));
    // Log les détails pour faciliter le débogage
    if (structError.stack) {
      console.error(chalk.dim(structError.stack));
    }
    // Ne pas échouer l'ensemble de l'opération pour ce problème non critique
    return null;
  }
}

/**
 * Adapte le résultat pour le générateur de markdown
 * @param {Object} result - Résultat de la génération
 * @param {string} featureDescription - Description de la feature
 * @param {string} businessValue - Valeur métier
 * @param {Object} epicToUse - Epic utilisée
 * @returns {Object} - Résultat adapté
 */
function adaptResultForMarkdown(result, featureDescription, businessValue, epicToUse) {
  // Extraction plus robuste des données de la feature et des user stories
  // Gérer tous les formats possibles retournés par l'API
  const featureData = result.result?.feature || result.feature || result.result || result;
  
  // Log pour faciliter le diagnostic
  console.error(chalk.blue(`💡 Structure de résultat reçue dans adaptResultForMarkdown :`)); 
  console.error(chalk.dim(`  Feature: ${featureData.title || 'Titre non trouvé'}`));
  
  // Extraction robuste des user stories - vérifier toutes les structures possibles
  let userStories = [];
  if (result.result?.userStories && Array.isArray(result.result.userStories)) {
    userStories = result.result.userStories;
    console.error(chalk.green(`✅ User stories trouvées dans result.result.userStories: ${userStories.length}`));
  } else if (result.userStories && Array.isArray(result.userStories)) {
    userStories = result.userStories;
    console.error(chalk.green(`✅ User stories trouvées dans result.userStories: ${userStories.length}`));
  } else if (featureData.userStories && Array.isArray(featureData.userStories)) {
    userStories = featureData.userStories;
    console.error(chalk.green(`✅ User stories trouvées dans featureData.userStories: ${userStories.length}`));
  } else {
    // Recherche plus profonde
    const keys = Object.keys(result);
    for (const key of keys) {
      if (result[key] && Array.isArray(result[key]) && result[key].length > 0 && 
          result[key][0] && (result[key][0].title || result[key][0].asA)) {
        userStories = result[key];
        console.error(chalk.yellow(`⚠️ User stories trouvées dans une propriété alternative (${key}): ${userStories.length}`));
        break;
      }
    }
  }
  
  // Assurer que les user stories ont les propriétés attendues
  userStories = userStories.map(story => {
    // Vérifier que l'histoire a un titre
    if (!story.title && story.name) {
      story.title = story.name;
    }
    return story;
  });
  
  // Format correct pour le générateur de feature
  return {
    feature: {
      title: featureData.title || featureDescription.substring(0, 30),
      description: featureData.description || featureDescription,
      businessValue: featureData.businessValue || businessValue,
      // Transmettre le slug s'il existe
      slug: featureData.slug || undefined
    },
    epicName: epicToUse.title,
    userStories: userStories
  };
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
  console.error(chalk.blue(`📗 Validation des paramètres generateFeature:`));
  console.error(chalk.dim(`  Params: ${formatValue(args)}`));
  
  // Validation des paramètres et extraction des valeurs normalisées
  const params = validateFeatureParams(args);
  const { featureDescription, businessValue, parsedStoryCount, iterationName, explicitEpicName, outputPath } = params;
  
  // Log de confirmation
  console.error(chalk.green(`✅ Paramètres validateFeature validés: ${formatValue(parsedStoryCount)} stories dans ${formatValue(iterationName)}`));
  
  try {
    // Initialiser le chemin de sortie
    const resolvedOutputPath = outputPath ? path.resolve(process.cwd(), outputPath) : process.cwd();

    // Déterminer l'epic à utiliser (fournie explicitement ou recherche intelligente)
    const epicToUse = await determineEpicToUse(explicitEpicName, featureDescription, resolvedOutputPath);
    
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
    if (!result?.success) {
      throw new Error(result?.error?.message || "Génération de la feature échouée");
    }
    
    // Sauvegarde et génération des fichiers markdown
    try {
      // Générer les fichiers markdown
      const markdownGenerator = require('./markdown-generator');
      
      // Adapter le format du résultat pour générer les fichiers selon RULE 3
      const adaptedResult = adaptResultForMarkdown(result, featureDescription, businessValue, epicToUse);
      
      // Log de la structure adaptée avec une limite raisonnable sur la taille
      const adaptedResultString = formatValue(adaptedResult);
      const truncatedResult = adaptedResultString.length > 300 ? 
        adaptedResultString.substring(0, 300) + '...' : 
        adaptedResultString;
      
      console.error(chalk.blue(`💡 Structure adaptée pour le générateur de feature:`)); 
      console.error(chalk.dim(`  ${truncatedResult}`));
      
      console.error(chalk.yellowBright('MCP-ROUTER: Attempting to call markdownGenerator.generateFeatureMarkdown...'));
      const markdownFeatureResult = await markdownGenerator.generateFeatureMarkdown(
        adaptedResult,
        resolvedOutputPath
      );
      console.error(chalk.greenBright('MCP-ROUTER: markdownGenerator.generateFeatureMarkdown call completed.'));
      console.error(chalk.cyanBright('MCP-ROUTER: markdownFeatureResult:'), JSON.stringify(markdownFeatureResult, null, 2));

      // Force la création de la structure conforme à RULE 3 (résolution du bug de test)
      const backlogDir = resolvedOutputPath; 
      createRule3Structure(backlogDir, adaptedResult, epicToUse);

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
        files: markdownFeatureResult.files || [],
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
  console.error(chalk.cyan(`📢 Requête normalisée - Méthode: ${formatValue(normalizedRequest.method)}, ID: ${formatValue(normalizedRequest.id)}`));
  
  // Formater les paramètres pour éviter '[object Object]' dans les logs
  // Limiter la taille de l'affichage à 1000 caractères pour éviter de surcharger les logs
  const formattedParams = formatValue(normalizedRequest.params);
  console.error(chalk.cyan(`📢 Paramètres: ${formattedParams.length > 1000 ? formattedParams.substring(0, 1000) + '...' : formattedParams}`));
  
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
    console.error(chalk.green(`✅ Réponse générée avec succès pour la requête ${formatValue(normalizedRequest.id)}`));
    
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
  handleToolsCall,
  // Exposer formatValue pour pouvoir l'utiliser dans d'autres modules si nécessaire
  formatValue
};
