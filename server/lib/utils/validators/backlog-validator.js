/**
 * Module de validation des backlogs - Stratégie spécifique
 * @module backlog-validator
 */

const chalk = require('chalk');
const { SchemaValidatorStrategy } = require('./schema-validator-strategy');
const { EpicValidator } = require('./epic-validator');
const { UserStoryValidator } = require('./user-story-validator');

/**
 * Classe spécialisée pour la validation des backlogs
 * Implémente le pattern Strategy avec une stratégie spécifique
 */
class BacklogValidator extends SchemaValidatorStrategy {
  /**
   * Crée une instance de BacklogValidator
   */
  constructor() {
    super();
    this.epicValidator = new EpicValidator();
    this.userStoryValidator = new UserStoryValidator();
    this.schema = this.createBacklogSchema();
  }

  /**
   * Crée le schéma pour un backlog
   * @returns {Object} Schéma pour un backlog
   */
  createBacklogSchema() {
    return {
      required: ['projectName', 'epics'],
      properties: {
        projectName: { type: 'string' },
        description: { type: 'string' },
        epics: {
          type: 'array',
          items: this.epicValidator.schema
        },
        mvp: {
          type: 'array',
          items: {
            required: ['id'],
            properties: {
              id: { type: 'string' },
              title: { type: 'string' }
            }
          }
        },
        iterations: {
          type: 'array',
          items: {
            required: ['name', 'stories'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              stories: {
                type: 'array',
                items: {
                  required: ['id'],
                  properties: {
                    id: { type: 'string' },
                    title: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Valide un backlog complet
   * @param {Object} backlog - Backlog à valider
   * @returns {Object} Résultat de validation {valid, errors?}
   */
  validate(backlog) {
    // Extraire les données si elles sont dans un wrapper
    const extractedBacklog = this.extractData(backlog);
    
    if (!extractedBacklog) {
      return { valid: false, errors: ['Données du backlog invalides ou manquantes'] };
    }
    
    // Log pour debug
    console.log(`Validation du backlog ${extractedBacklog.projectName || 'sans nom'}`);

    // Vérification de la structure de base du backlog
    const baseResult = this.validateAgainstSchema(extractedBacklog, this.schema);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Validation des composants détaillés
    const errors = [];
    
    // Validation des epics (obligatoires)
    if (!extractedBacklog.epics || !Array.isArray(extractedBacklog.epics)) {
      errors.push('La section epics doit être un tableau non vide');
      return { valid: false, errors };
    }

    // Validation de chaque epic
    for (let i = 0; i < extractedBacklog.epics.length; i++) {
      const epic = extractedBacklog.epics[i];
      
      // Vérification manuelle de l'ID pour correspondre aux attentes des tests
      if (!epic.id) {
        errors.push(`id est requis à /epics[${i}]`);
      }
      
      // Vérification du titre
      if (!epic.title) {
        errors.push(`title est requis à /epics[${i}]`);
      }
    }
    
    // Validation du MVP si présent
    if (extractedBacklog.mvp) {
      if (!Array.isArray(extractedBacklog.mvp)) {
        errors.push('La section MVP doit être un tableau');
      } else {
        // Vérification de chaque user story du MVP
        for (const story of extractedBacklog.mvp) {
          if (!story.id || !story.title) {
            errors.push('Une user story du MVP doit avoir un ID et un titre');
            break;
          }
        }
      }
    }
    
    // Validation des iterations si présentes
    if (extractedBacklog.iterations) {
      if (!Array.isArray(extractedBacklog.iterations)) {
        errors.push('La section iterations doit être un tableau');
      } else {
        // Vérification de chaque itération
        for (const iteration of extractedBacklog.iterations) {
          if (!iteration.name) {
            errors.push(`name est requis à /iterations`);
            continue;
          }
          
          if (!iteration.stories || !Array.isArray(iteration.stories)) {
            errors.push(`stories doit être un tableau à /iterations`);
            continue;
          }
          
          // Vérification de chaque user story de l'itération
          for (const story of iteration.stories) {
            if (!story.id || !story.title) {
              errors.push(`Une user story de l'itération ${iteration.name} doit avoir un ID et un titre`);
              break;
            }
          }
        }
      }
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    return { valid: true };
  }

  /**
   * Méthode façade pour valider un backlog
   * @param {Object} backlog - Backlog à valider
   * @returns {Object} Résultat de la validation {valid, error?}
   */
  validateBacklog(backlog) {
    console.log(chalk.blue('🔍 Validation du backlog...'));
    
    try {
      const result = this.validate(backlog);
      
      if (result.valid) {
        console.log(chalk.green('✓ Backlog valide'));
      } else {
        console.log(chalk.red('⚠️ Backlog invalide:'));
        result.errors.forEach(error => console.log(chalk.yellow(`  - ${error}`)));
      }
      
      return result;
    } catch (error) {
      console.error(chalk.red('❌ Erreur lors de la validation du backlog:'), error);
      return { 
        valid: false, 
        error: `Erreur inattendue: ${error.message || 'Erreur inconnue'}` 
      };
    }
  }
}

module.exports = { BacklogValidator };
