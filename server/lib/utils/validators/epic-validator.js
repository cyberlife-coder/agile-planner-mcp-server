/**
 * Module de validation des epics - Stratégie spécifique
 * @module epic-validator
 */

const { SchemaValidatorStrategy } = require('./schema-validator-strategy');
const { FeatureValidator } = require('./feature-validator');

/**
 * Classe spécialisée pour la validation des epics
 * Implémente le pattern Strategy avec une stratégie spécifique
 */
class EpicValidator extends SchemaValidatorStrategy {
  /**
   * Crée une instance de EpicValidator
   */
  constructor() {
    super();
    this.featureValidator = new FeatureValidator();
    this.schema = this.createEpicSchema();
  }

  /**
   * Crée le schéma pour un epic
   * @returns {Object} Schéma pour un epic
   */
  createEpicSchema() {
    return {
      required: ['id', 'title'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        features: {
          type: 'array',
          items: this.featureValidator.schema
        }
      }
    };
  }

  /**
   * Valide un epic et ses features
   * @param {Object} epic - Epic à valider
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(epic) {
    // Vérification de la structure de base de l'epic
    const baseResult = this.validateAgainstSchema(epic, this.schema);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Si l'epic est valide, on vérifie chaque feature individuellement
    if (epic.features && Array.isArray(epic.features)) {
      const errors = [];

      for (let i = 0; i < epic.features.length; i++) {
        const feature = epic.features[i];
        const featureResult = this.featureValidator.validate(feature);
        
        if (!featureResult.valid && featureResult.errors) {
          // Ajouter le préfixe du chemin pour chaque erreur
          const prefixedErrors = featureResult.errors.map(
            err => err.replace('à /', `à /features[${i}]/`)
          );
          errors.push(...prefixedErrors);
        }
      }

      if (errors.length > 0) {
        // Formatage des erreurs pour compatibilité
        const formattedErrors = this.formatErrorsForCompatibility(errors, 'features');
        return { valid: false, errors: formattedErrors };
      }
    }

    return { valid: true };
  }
}

module.exports = { EpicValidator };
