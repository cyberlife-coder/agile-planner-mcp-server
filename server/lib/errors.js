/**
 * Module de gestion centralisée des erreurs pour Agile Planner
 * Offre des classes standardisées pour la gestion des erreurs CLI et MCP
 */

const chalk = require('chalk');

/**
 * Classe d'erreur de base pour Agile Planner
 */
class AgilePlannerError extends Error {
  /**
   * Crée une nouvelle instance d'erreur
   * @param {string} message - Message d'erreur explicite
   * @param {string} code - Code d'erreur unique (pour traçabilité)
   * @param {any} details - Détails supplémentaires sur l'erreur
   */
  constructor(message, code = 'GENERAL_ERROR', details = null) {
    super(message);
    this.name = 'AgilePlannerError';
    this.code = code;
    this.details = details;
  }
  
  /**
   * Convertit l'erreur en format MCP pour les réponses JSON-RPC
   * @returns {Object} Objet d'erreur au format MCP
   */
  toMcpError() {
    return {
      success: false,
      error: {
        message: this.message,
        code: this.code,
        details: this.details
      }
    };
  }
  
  /**
   * Affiche l'erreur en mode CLI avec formatage des couleurs
   */
  printCli() {
    console.error(chalk.red(`Erreur: ${this.message}`));
    if (this.details) {
      console.error(chalk.yellow(`Détails: ${JSON.stringify(this.details, null, 2)}`));
    }
  }
}

/**
 * Erreur de validation des entrées utilisateur
 */
class ValidationError extends AgilePlannerError {
  constructor(message, details) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

/**
 * Erreur liée aux appels API externes (OpenAI, Groq)
 */
class ApiError extends AgilePlannerError {
  constructor(message, details) {
    super(message, 'API_ERROR', details);
  }
}

/**
 * Erreur liée au système de fichiers
 */
class FileSystemError extends AgilePlannerError {
  constructor(message, details) {
    super(message, 'FILE_SYSTEM_ERROR', details);
  }
}

/**
 * Erreur liée au protocole MCP
 * Compatible avec Windsurf, Claude.ai et Cursor
 */
class McpError extends AgilePlannerError {
  /**
   * Crée une nouvelle erreur MCP compatible avec tous les LLMs
   * @param {string} message - Message d'erreur
   * @param {any} details - Détails de l'erreur (objet, tableau ou texte)
   * @param {number} [errorCode=-32000] - Code d'erreur JSON-RPC
   */
  constructor(message, details, errorCode = -32000) {
    super(message, 'MCP_ERROR', details);
    this.errorCode = errorCode;
  }
  
  /**
   * Génère le code d'erreur approprié basé sur le type d'erreur
   * @private
   * @returns {number} Code d'erreur JSON-RPC approprié
   */
  _getErrorCode() {
    // Utiliser le code spécifié dans le constructeur s'il existe
    if (this.errorCode !== -32000) {
      return this.errorCode;
    }
    
    // Mapper les codes d'erreur Agile Planner vers JSON-RPC
    const errorMap = {
      'VALIDATION_ERROR': -32602, // Invalid params
      'API_ERROR': -32603,        // Internal error (API)
      'FILE_SYSTEM_ERROR': -32603, // Internal error (FS)
      'MCP_ERROR': -32000,        // Generic server error
      'GENERAL_ERROR': -32000      // Generic server error
    };
    
    return errorMap[this.code] || -32000;
  }
  
  /**
   * Normalise les détails pour s'assurer qu'ils sont compatibles avec JSON
   * @private
   * @returns {Object|null} Détails normalisés pour la sérialisation
   */
  _normalizeDetails() {
    if (!this.details) return null;
    
    try {
      // Si c'est déjà une chaîne, la retourner telle quelle
      if (typeof this.details === 'string') {
        return { message: this.details };
      }
      
      // Si c'est un objet Error, extraire les propriétés pertinentes
      if (this.details instanceof Error) {
        return {
          message: this.details.message,
          stack: this.details.stack,
          name: this.details.name
        };
      }
      
      // Sinon, s'assurer que c'est sérialisable
      return JSON.parse(JSON.stringify(this.details));
    } catch (e) {
      // Fallback sécurisé en cas d'erreur
      return { message: String(this.details) };
    }
  }
  
  /**
   * Convertit en erreur JSON-RPC standard compatible avec tous les LLMs
   * @returns {Object} Erreur au format JSON-RPC
   */
  toJsonRpcError() {
    return {
      code: this._getErrorCode(),
      message: this.message || 'Erreur serveur',
      data: this._normalizeDetails()
    };
  }
}

module.exports = {
  AgilePlannerError,
  ValidationError,
  ApiError,
  FileSystemError,
  McpError
};
