/**
 * Module de validation de types - Partie de la refactorisation TDD du SchemaValidator
 * @module type-validator
 */

/**
 * Classe responsable de la validation des types primitifs
 * Implémente le pattern Strategy pour encapsuler la logique de validation de types
 */
class TypeValidator {
  /**
   * Vérifie si une valeur correspond au type attendu
   * @param {*} value - Valeur à vérifier
   * @param {string} type - Type attendu (string, number, boolean, array, object)
   * @returns {boolean} true si le type correspond
   */
  validate(value, type) {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * Vérifie si une valeur n'est pas undefined
   * @param {*} value - Valeur à vérifier
   * @returns {boolean} true si la valeur n'est pas undefined
   */
  isDefined(value) {
    return value !== undefined;
  }

  /**
   * Vérifie si une valeur n'est ni undefined ni null
   * @param {*} value - Valeur à vérifier
   * @returns {boolean} true si la valeur existe
   */
  exists(value) {
    return value !== undefined && value !== null;
  }
}

module.exports = { TypeValidator };
