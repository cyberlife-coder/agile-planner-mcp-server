/**
 * Module de validation de schémas - Implémentation du pattern Strategy
 * @module schema-validator-strategy
 */

const chalk = require('chalk');
const { TypeValidator } = require('./type-validator');

/**
 * Classe de base pour les stratégies de validation de schéma
 * Implémente les fonctionnalités communes à tous les validateurs
 */
class SchemaValidatorStrategy {
  /**
   * Crée une instance du validateur de stratégie
   */
  constructor() {
    this.typeValidator = new TypeValidator();
  }

  /**
   * Valide un type de donnée simple
   * @param {*} value - Valeur à valider
   * @param {string} type - Type attendu
   * @returns {boolean} Résultat de la validation du type
   * @private
   */
  _validateType(value, type) {
    return this.typeValidator.validate(value, type);
  }

  /**
   * Valide un objet contre un schéma donné
   * @param {Object} obj - Objet à valider
   * @param {Object} schema - Schéma pour la validation
   * @param {boolean} useCompatFormat - Utiliser le format d'erreur compatible avec l'ancien système
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validateAgainstSchema(obj, schema, useCompatFormat = true) {
    // Vérification des propriétés requises
    if (schema.required && Array.isArray(schema.required)) {
      const missingProps = schema.required.filter(prop => !obj || obj[prop] === undefined);
      
      if (missingProps.length > 0) {
        const errors = missingProps.map(prop => {
          return useCompatFormat 
            ? `${prop} est requis à /`
            : {
                field: prop,
                message: 'est requis',
                expected: 'une valeur',
                received: 'undefined'
              };
        });
        
        return { valid: false, errors };
      }
    }

    // Vérification des types de propriétés
    const typeErrors = [];
    if (schema.properties && obj) {
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        if (obj[propName] !== undefined) {
          // Si la propriété existe, vérifier son type
          if (!this._validateType(obj[propName], propSchema.type)) {
            const errorMsg = useCompatFormat
              ? `${propName} doit être de type ${propSchema.type} à /${propName}`
              : {
                  field: propName,
                  message: `doit être de type ${propSchema.type}`,
                  expected: propSchema.type,
                  received: typeof obj[propName]
                };
                
            typeErrors.push(errorMsg);
          }
        }
      });
    }

    if (typeErrors.length > 0) {
      return {
        valid: false,
        errors: typeErrors
      };
    }

    return { valid: true };
  }
  
  /**
   * Formate les erreurs pour assurer la compatibilité avec l'ancien système
   * @param {Array} errors - Tableau d'erreurs (format structuré ou texte)
   * @param {string} [prefix=''] - Préfixe à ajouter au chemin des erreurs
   * @returns {Array} Tableau d'erreurs au format texte
   */
  formatErrorsForCompatibility(errors, prefix = '') {
    if (!errors || !Array.isArray(errors)) {
      return [];
    }
    
    return errors.map(err => {
      if (typeof err === 'string') {
        // Déjà au format texte, ajout du préfixe si nécessaire
        if (prefix && err.includes(' à /')) {
          return err.replace(' à /', ` à /${prefix}/`);
        }
        return err;
      } else if (typeof err === 'object') {
        // Convertir un objet d'erreur en format texte
        const path = prefix ? `/${prefix}` : '/';
        return `${err.field} ${err.message} à ${path}`;
      }
      return err;
    });
  }

  /**
   * Extrait les données de backlog d'une structure potentiellement encapsulée
   * @param {Object} potentiallyWrappedData - Structure qui pourrait contenir des données encapsulées
   * @returns {Object} Données extraites
   */
  extractData(potentiallyWrappedData) {
    // Si l'objet est null ou undefined
    if (!potentiallyWrappedData) {
      return null;
    }

    // Si l'objet a une structure de wrapper MCP (success, result)
    if (potentiallyWrappedData.success && potentiallyWrappedData.result) {
      console.error(chalk.blue('📋 Extraction des données depuis un wrapper MCP'));
      return potentiallyWrappedData.result;
    }

    // Retourner directement l'objet
    return potentiallyWrappedData;
  }
}

module.exports = { SchemaValidatorStrategy };
