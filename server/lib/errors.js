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
 */
class McpError extends AgilePlannerError {
  constructor(message, details) {
    super(message, 'MCP_ERROR', details);
  }
  
  /**
   * Convertit en erreur JSON-RPC standard
   * @returns {Object} Erreur au format JSON-RPC
   */
  toJsonRpcError() {
    return {
      code: -32000, // Code d'erreur serveur générique
      message: this.message,
      data: this.details
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
