/**
 * Utilitaire pour le parsing robuste des réponses JSON des LLMs
 * Version simplifiée qui gère les formats markdown et autres anomalies courantes
 * @module json-parser
 */

const chalk = require('chalk');

/**
 * Configuration du parser
 * @type {Object}
 */
const ParserConfig = {
  // Regex pour extraire un bloc de code JSON depuis un markdown
  MARKDOWN_REGEX: /```(?:json)?\s*([\s\S]*?)\s*```/,
  
  // Regex pour extraire le premier objet JSON générique
  JSON_OBJECT_REGEX: /(\{[\s\S]*?\})/,
  
  // Taille maximale de l'extrait de contenu en cas d'erreur
  PREVIEW_SIZE: 50,

  // Niveau de log pour le mode debug
  LOG_LEVELS: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
  }
};

/**
 * Tente de parser le contenu JSON fourni
 * @param {string} content - Le contenu JSON à parser
 * @param {boolean} debug - Activer les logs de debug
 * @param {string} method - Nom de la méthode pour les logs
 * @returns {Object|null} - L'objet parsé ou null en cas d'échec
 * @private
 */
function _attemptParse(content, debug = false, method = 'unknown') {
  if (!content) return null;
  
  try {
    return JSON.parse(content);
  } catch (error) {
    _logDebug(`${method}: Échec parsing: ${error.message}`,
      ParserConfig.LOG_LEVELS.WARNING, debug);
    return null;
  }
}

/**
 * Tente de parser directement le contenu comme du JSON
 * @param {string} content - Le contenu à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object|null} - L'objet parsé ou null si échec
 */
function tryDirectParse(content, debug = false) {
  const result = _attemptParse(content, debug, 'tryDirectParse');
  if (result) {
    _logDebug('tryDirectParse: JSON parsé avec succès directement', 
      ParserConfig.LOG_LEVELS.SUCCESS, debug);
  }
  return result;
}

/**
 * Log un message de debug selon le niveau spécifié
 * @param {string} message - Le message à afficher
 * @param {string} level - Le niveau de log ('info', 'success', 'warning', 'error')
 * @param {boolean} debug - Si true, affiche le message
 * @private
 */
function _logDebug(message, level = ParserConfig.LOG_LEVELS.INFO, debug = false) {
  if (!debug) return;
  
  const colorMap = {
    [ParserConfig.LOG_LEVELS.INFO]: chalk.blue,
    [ParserConfig.LOG_LEVELS.SUCCESS]: chalk.green,
    [ParserConfig.LOG_LEVELS.WARNING]: chalk.yellow,
    [ParserConfig.LOG_LEVELS.ERROR]: chalk.red
  };
  
  const colorFn = colorMap[level] || chalk.white;
  console.error(colorFn(message));
}

/**
 * Extrait le contenu d'un bloc de code markdown
 * @param {string} content - Le contenu contenant potentiellement un bloc markdown
 * @param {boolean} debug - Activer les logs de debug
 * @returns {string|null} - Le contenu extrait ou null si aucun bloc valide trouvé
 * @private
 */
function _extractMarkdownContent(content, debug = false) {
  // Vérification rapide avant d'utiliser RegExp
  const hasMarkdownDelimiters = content.includes('```');
  if (!hasMarkdownDelimiters) {
    return null;
  }
  
  _logDebug('tryParseFromMarkdown: Délimiteurs markdown détectés, extraction...', 
    ParserConfig.LOG_LEVELS.INFO, debug);
  
  const match = ParserConfig.MARKDOWN_REGEX.exec(content);
  if (!match?.[1]) {
    _logDebug('tryParseFromMarkdown: Délimiteurs trouvés mais contenu non extrait ou vide.',
      ParserConfig.LOG_LEVELS.WARNING, debug && hasMarkdownDelimiters);
    return null;
  }
  
  const jsonString = match[1].trim();
  if (jsonString === "") {
    _logDebug('tryParseFromMarkdown: Bloc markdown vide après trim.',
      ParserConfig.LOG_LEVELS.WARNING, debug);
    return null;
  }
  
  return jsonString;
}

/**
 * Tente de parser du JSON depuis un bloc de code markdown
 * @param {string} content - Le contenu à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object|null} - L'objet parsé ou null si non trouvé/parsé
 */
function tryParseFromMarkdown(content, debug = false) {
  const jsonString = _extractMarkdownContent(content, debug);
  if (jsonString === null) return null;

  const result = _attemptParse(jsonString, debug, 'tryParseFromMarkdown');
  if (result) {
    _logDebug('tryParseFromMarkdown: JSON extrait et parsé depuis markdown',
      ParserConfig.LOG_LEVELS.SUCCESS, debug);
  }
  return result;
}

/**
 * Extrait le premier objet JSON d'une chaîne de caractères
 * @param {string} content - Le contenu à analyser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {string|null} - La chaîne extraite ou null si aucun objet trouvé
 * @private
 */
function _extractFirstJsonObject(content, debug = false) {
  _logDebug('tryParseFirstJsonObject: Recherche d\'un objet JSON générique...', 
    ParserConfig.LOG_LEVELS.INFO, debug);
  
  const objectMatch = ParserConfig.JSON_OBJECT_REGEX.exec(content);
  return objectMatch?.[1] || null;
}

/**
 * Tente de parser le premier sous-string ressemblant à un objet JSON
 * @param {string} content - Le contenu à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object|null} - L'objet parsé ou null si non trouvé/parsé
 */
function tryParseFirstJsonObject(content, debug = false) {
  const jsonString = _extractFirstJsonObject(content, debug);
  if (jsonString === null) return null;
  
  const result = _attemptParse(jsonString, debug, 'tryParseFirstJsonObject');
  if (result) {
    _logDebug('tryParseFirstJsonObject: Objet JSON générique extrait et parsé',
      ParserConfig.LOG_LEVELS.SUCCESS, debug);
  }
  return result;
}

/**
 * Vérifie si le contenu est vide ou non défini
 * @param {string} content - Le contenu à vérifier
 * @param {boolean} debug - Activer les logs de debug
 * @returns {boolean} - True si le contenu est vide ou non défini
 * @private
 */
function _isEmptyContent(content, debug = false) {
  const isEmpty = !content || content.trim() === '';
  
  if (isEmpty) {
    _logDebug('Input content is null, undefined, or empty. Cannot parse.',
      ParserConfig.LOG_LEVELS.WARNING, debug);
  }
  
  return isEmpty;
}

/**
 * Tente de parser le contenu avec chaque parser disponible
 * @param {string} content - Le contenu à parser
 * @param {Function[]} parsers - Liste des fonctions de parsing à essayer
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object|null} - L'objet JSON parsé ou null si échec
 * @private
 */
function _tryAllParsers(content, parsers, debug = false) {
  for (const parser of parsers) {
    const result = parser(content, debug);
    if (result !== null) {
      _logDebug(`✅ JSON parsé avec succès par ${parser.name}`,
        ParserConfig.LOG_LEVELS.SUCCESS, debug);
      return result;
    }
  }
  
  return null; // Aucun parser n'a réussi
}

/**
 * Journalise une erreur de parsing finale et lance une exception
 * @param {string} content - Le contenu qui n'a pas pu être parsé
 * @param {boolean} debug - Activer les logs de debug
 * @throws {Error} - Erreur de parsing avec un extrait du contenu
 * @private
 */
function _throwParsingError(content, debug = false) {
  _logDebug('❌ Toutes les méthodes de parsing ont échoué',
    ParserConfig.LOG_LEVELS.ERROR, debug);
  
  const contentPreview = content?.substring(0, ParserConfig.PREVIEW_SIZE) + 
    (content?.length > ParserConfig.PREVIEW_SIZE ? '...' : '');
  throw new Error(`Impossible de trouver un JSON valide dans la réponse: ${contentPreview}`);
}

/**
 * Gère la vérification initiale du contenu
 * @param {string} content - Le contenu à vérifier
 * @param {boolean} debug - Activer les logs de debug
 * @throws {Error} - Si le contenu est vide ou non défini
 * @private
 */
function _verifyContentNotEmpty(content, debug = false) {
  _logDebug(`Attempting to parse JSON content (length: ${content?.length ?? 0})...`,
    ParserConfig.LOG_LEVELS.INFO, debug);

  if (_isEmptyContent(content, debug)) {
    throw new Error('Impossible de trouver un JSON valide dans la réponse: Contenu vide ou non défini');
  }
}

/**
 * Prépare la liste des parsers à utiliser
 * @returns {Function[]} - Liste ordonnée des parsers à essayer
 * @private
 */
function _prepareParsers() {
  return [
    tryDirectParse,
    tryParseFromMarkdown,
    tryParseFirstJsonObject
  ];
}

/**
 * Fonction principale pour parser une réponse API pouvant contenir du JSON
 * sous divers formats (JSON brut, markdown, etc.)
 * 
 * Cette fonction a été refactorisée pour réduire sa complexité cognitive
 * conformément aux recommandations SonarQube (ID: 4aef1b1a-e476-4b16-8ae0-5da4f62d9058).
 * 
 * Ordre des stratégies:
 * 1. Parsing JSON direct 
 * 2. Extraction et parsing depuis un bloc markdown
 * 3. Recherche et parsing du premier objet JSON trouvé
 * 
 * @param {string} content - Le contenu brut à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object} L'objet JSON parsé
 * @throws {Error} Si le parsing échoue après toutes les tentatives ou si le contenu est vide
 */
function parseJsonResponse(content, debug = false) {
  return _executeParsingProcess(content, debug);
}

/**
 * Exécute le processus complet de parsing avec gestion des erreurs
 * @param {string} content - Le contenu brut à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object} L'objet JSON parsé
 * @throws {Error} Si le parsing échoue après toutes les tentatives ou si le contenu est vide
 * @private
 */
function _executeParsingProcess(content, debug = false) {
  try {
    return _processContentParsing(content, debug);
  } catch (error) {
    return _handleParsingError(error);
  }
}

/**
 * Effectue les étapes de parsing sur le contenu
 * @param {string} content - Le contenu brut à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object} L'objet JSON parsé
 * @throws {Error} Si le parsing échoue
 * @private
 */
function _processContentParsing(content, debug) {
  // Étape 1: Vérifier que le contenu n'est pas vide
  _verifyContentNotEmpty(content, debug);

  // Étape 2: Préparer les parsers à utiliser
  const parsers = _prepareParsers();

  // Étape 3: Essayer tous les parsers dans l'ordre
  const result = _tryAllParsers(content, parsers, debug);
  if (result !== null) {
    return result;
  }

  // Étape 4: Si aucun parser n'a réussi, lancer une erreur
  _throwParsingError(content, debug);
}

/**
 * Gère uniformement les erreurs de parsing
 * @param {Error} error - L'erreur à traiter
 * @throws {Error} - L'erreur formatée de manière cohérente
 * @private
 */
function _handleParsingError(error) {
  // Si c'est déjà une erreur de notre format, la retransmettre
  if (error.message.includes('Impossible de trouver un JSON valide')) {
    throw error;
  }
  
  // Sinon, formater de manière cohérente
  throw new Error(`Erreur lors du parsing JSON: ${error.message}`);
}

module.exports = { parseJsonResponse }; // Ensure all helpers are NOT exported unless needed by tests directly
