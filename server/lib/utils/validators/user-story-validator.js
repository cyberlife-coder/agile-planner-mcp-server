/**
 * Module de validation des user stories - Stratégie spécifique
 * @module user-story-validator
 */

const { SchemaValidatorStrategy } = require('./schema-validator-strategy');

/**
 * Classe spécialisée pour la validation des user stories
 * Implémente le pattern Strategy avec une stratégie spécifique
 */
class UserStoryValidator extends SchemaValidatorStrategy {
  /**
   * Crée une instance de UserStoryValidator
   */
  constructor() {
    super();
    this.schema = this.createUserStorySchema();
  }

  /**
   * Crée le schéma pour une user story
   * @returns {Object} Schéma pour une user story
   */
  createUserStorySchema() {
    return {
      required: ['id', 'title'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        acceptance_criteria: { 
          type: 'array',
          items: { type: 'string' }
        },
        priority: { type: 'string' },
        businessValue: { type: 'string' }
      }
    };
  }

  /**
   * Valide une user story
   * @param {Object} story - User story à valider
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(story) {
    return this.validateAgainstSchema(story, this.schema);
  }
}

module.exports = { UserStoryValidator };
