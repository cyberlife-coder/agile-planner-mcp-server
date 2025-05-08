/**
 * Module factory pour les validateurs - Facilite la transition vers le pattern Strategy
 * @module validators-factory
 */

const { UserStoryValidator } = require('./user-story-validator');
const { FeatureValidator } = require('./feature-validator');
const { EpicValidator } = require('./epic-validator');
const { IterationValidator } = require('./iteration-validator');
const { BacklogValidator } = require('./backlog-validator');

/**
 * Factory pour obtenir des instances singleton des validateurs
 * Implémente le pattern Factory et Singleton
 */
class ValidatorsFactory {
  constructor() {
    this._userStoryValidator = null;
    this._featureValidator = null;
    this._epicValidator = null;
    this._iterationValidator = null;
    this._backlogValidator = null;
  }

  /**
   * Obtient l'instance singleton du UserStoryValidator
   * @returns {UserStoryValidator} Instance du validateur
   */
  getUserStoryValidator() {
    if (!this._userStoryValidator) {
      this._userStoryValidator = new UserStoryValidator();
    }
    return this._userStoryValidator;
  }

  /**
   * Obtient l'instance singleton du FeatureValidator
   * @returns {FeatureValidator} Instance du validateur
   */
  getFeatureValidator() {
    if (!this._featureValidator) {
      this._featureValidator = new FeatureValidator();
    }
    return this._featureValidator;
  }

  /**
   * Obtient l'instance singleton du EpicValidator
   * @returns {EpicValidator} Instance du validateur
   */
  getEpicValidator() {
    if (!this._epicValidator) {
      this._epicValidator = new EpicValidator();
    }
    return this._epicValidator;
  }

  /**
   * Obtient l'instance singleton du IterationValidator
   * @returns {IterationValidator} Instance du validateur
   */
  getIterationValidator() {
    if (!this._iterationValidator) {
      this._iterationValidator = new IterationValidator();
    }
    return this._iterationValidator;
  }

  /**
   * Obtient l'instance singleton du BacklogValidator
   * @returns {BacklogValidator} Instance du validateur
   */
  getBacklogValidator() {
    if (!this._backlogValidator) {
      this._backlogValidator = new BacklogValidator();
    }
    return this._backlogValidator;
  }

  /**
   * Valide un objet en sélectionnant le validateur approprié
   * @param {Object} data - Données à valider
   * @param {string} type - Type de données (userStory, feature, epic, iteration, backlog)
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(data, type) {
    switch(type) {
      case 'userStory':
        return this.getUserStoryValidator().validate(data);
      case 'feature':
        return this.getFeatureValidator().validate(data);
      case 'epic':
        return this.getEpicValidator().validate(data);
      case 'iteration':
        return this.getIterationValidator().validate(data);
      case 'backlog':
        return this.getBacklogValidator().validate(data);
      default:
        throw new Error(`Type de validateur non supporté: ${type}`);
    }
  }
}

// Export d'une instance singleton de la factory
module.exports = new ValidatorsFactory();
