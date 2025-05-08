/**
 * Module de validation des features - Stratégie spécifique
 * @module feature-validator
 */

const { SchemaValidatorStrategy } = require('./schema-validator-strategy');
const { UserStoryValidator } = require('./user-story-validator');

/**
 * Classe spécialisée pour la validation des features
 * Implémente le pattern Strategy avec une stratégie spécifique
 */
class FeatureValidator extends SchemaValidatorStrategy {
  /**
   * Crée une instance de FeatureValidator
   */
  constructor() {
    super();
    this.userStoryValidator = new UserStoryValidator();
    this.schema = this.createFeatureSchema();
  }

  /**
   * Crée le schéma pour une feature
   * @returns {Object} Schéma pour une feature
   */
  createFeatureSchema() {
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
        stories: {
          type: 'array',
          items: this.userStoryValidator.schema
        },
        priority: { type: 'string' },
        businessValue: { type: 'string' }
      }
    };
  }

  /**
   * Valide une feature et ses user stories
   * @param {Object} feature - Feature à valider
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(feature) {
    // Vérification de la structure de base de la feature
    const baseResult = this.validateAgainstSchema(feature, this.schema);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Si la feature est valide, on vérifie chaque user story individuellement
    if (feature.stories && Array.isArray(feature.stories)) {
      const errors = [];

      for (let i = 0; i < feature.stories.length; i++) {
        const story = feature.stories[i];
        const storyResult = this.userStoryValidator.validate(story);
        
        if (!storyResult.valid && storyResult.errors) {
          // Ajouter le préfixe du chemin pour chaque erreur
          const prefixedErrors = storyResult.errors.map(
            err => err.replace('à /', `à /stories[${i}]/`)
          );
          errors.push(...prefixedErrors);
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

module.exports = { FeatureValidator };
