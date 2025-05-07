/**
 * Module de validation des itérations - Stratégie spécifique
 * @module iteration-validator
 */

const { SchemaValidatorStrategy } = require('./schema-validator-strategy');
const { UserStoryValidator } = require('./user-story-validator');

/**
 * Classe spécialisée pour la validation des itérations
 * Implémente le pattern Strategy avec une stratégie spécifique
 */
class IterationValidator extends SchemaValidatorStrategy {
  /**
   * Crée une instance de IterationValidator
   */
  constructor() {
    super();
    this.userStoryValidator = new UserStoryValidator();
    this.schema = this.createIterationSchema();
  }

  /**
   * Crée le schéma pour une itération
   * @returns {Object} Schéma pour une itération
   */
  createIterationSchema() {
    return {
      required: ['name', 'stories'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string' },
        endDate: { type: 'string' },
        stories: {
          type: 'array',
          items: {
            required: ['id', 'title'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' }
            }
          }
        }
      }
    };
  }

  /**
   * Valide une itération et ses user stories
   * @param {Object} iteration - Itération à valider
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(iteration) {
    // Vérification de la structure de base de l'itération
    const baseResult = this.validateAgainstSchema(iteration, this.schema);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Si l'itération est valide, on vérifie chaque user story
    if (iteration.stories && Array.isArray(iteration.stories)) {
      const errors = [];

      for (let i = 0; i < iteration.stories.length; i++) {
        const story = iteration.stories[i];
        
        // Vérification minimale des propriétés requises
        if (!story.id) {
          // Format compatible avec les tests existants
          errors.push(`La user story à l'index ${i} doit avoir un ID`);
        }
        
        if (!story.title) {
          errors.push(`La user story à l'index ${i} doit avoir un titre`);
        }
      }

      if (errors.length > 0) {
        // Formatage des erreurs pour compatibilité
        const formattedErrors = this.formatErrorsForCompatibility(errors, 'stories');
        return { valid: false, errors: formattedErrors };
      }
    }

    return { valid: true };
  }
}

module.exports = { IterationValidator };
