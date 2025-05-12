// Module de validation des backlogs - Stratégie spécifique
const chalk = require('chalk');
const { SchemaValidatorStrategy } = require('./schema-validator-strategy');
const { EpicValidator } = require('./epic-validator');
const { UserStoryValidator } = require('./user-story-validator');

// Classe spécialisée pour la validation des backlogs (pattern Strategy)
class BacklogValidator extends SchemaValidatorStrategy {
    constructor() {
    super();
    this.epicValidator = new EpicValidator();
    this.userStoryValidator = new UserStoryValidator();
    this.schema = this.createBacklogSchema();
  }

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
        mvp: { type: 'array' },
        iterations: { type: 'array' }
      },
      additionalProperties: false
    };
  }

  // Normalise un backlog pour le format moderne 'epics' (pluriel)
  normalizeBacklog(backlog) {
    if (!backlog || typeof backlog !== 'object') {
      return null;
    }
    
    // Rejeter tout backlog qui utilise l'ancien format 'epic' (singulier)
    if (backlog.epic && !backlog.epics) {
      // Ne pas tenter de convertir le format singulier
      // Rejeter complètement l'ancien format 'epic'
      console.error(chalk.yellow('⚠️ Format obsolète détecté (epic singulier) - Rejeté'));
      return {
        ...backlog,
        epics: null  // Forcer l'échec de validation
      };
    }
    
    // Retourner le backlog tel quel (doit déjà avoir epics)
    return backlog;
  }
  
  /**
   * Vérifie les champs obligatoires du backlog
   * @param {Object} backlog - Backlog à valider
   * @returns {Array} - Erreurs détectées lors de la validation
   * @private
   */
  _validateRequiredFields(backlog) {
    const errors = [];
    
    if (!backlog || typeof backlog !== 'object') {
      errors.push('Backlog invalide');
    }
    if (!backlog.projectName) {
      errors.push('projectName requis');
    }
    if (!Array.isArray(backlog.epics) || backlog.epics.length === 0) {
      errors.push('epics requis et doit être un tableau non vide');
    }
    
    return errors;
  }
  
  /**
   * Vérifie les sections optionnelles du backlog (MVP et itérations)
   * @param {Object} backlog - Backlog à valider
   * @returns {Array} - Erreurs détectées lors de la validation
   * @private
   */
  _validateOptionalSections(backlog) {
    const errors = [];
    
    // Validation du format de MVP et itérations (si présents)
    if (backlog.mvp && !Array.isArray(backlog.mvp)) {
      errors.push('mvp doit être un tableau');
    }
    if (backlog.iterations && !Array.isArray(backlog.iterations)) {
      errors.push('iterations doit être un tableau');
    }
    
    return errors;
  }
  
  /**
   * Valide un backlog complet
   * @param {Object} backlog - Backlog à valider
   * @returns {Object} - Résultat de validation {valid: boolean, errors?: Array}
   */
  validate(backlog) {
    // Extraire les données si elles sont dans un wrapper
    const extractedBacklog = this.extractData(backlog);
    if (!extractedBacklog) {
      return { valid: false, errors: ['Données du backlog invalides ou manquantes'] };
    }
    
    // Normaliser le backlog pour n'accepter que le format 'epics' (pluriel)
    const normalizedBacklog = this.normalizeBacklog(extractedBacklog);
    console.error(`Validation du backlog ${normalizedBacklog?.projectName || 'sans nom'}`);

    // Vérification de la structure de base avec le schéma
    const baseResult = this.validateAgainstSchema(normalizedBacklog, this.schema);
    if (!baseResult.valid) {
      return baseResult;
    }

    // Collecte de toutes les erreurs détectées
    const errors = [
      ...this._validateRequiredFields(normalizedBacklog),
      ...this._validateOptionalSections(normalizedBacklog)
    ];
    
    // Validation des epics
    if (normalizedBacklog.epics && Array.isArray(normalizedBacklog.epics)) {
      const epicErrors = normalizedBacklog.epics.map(this.validateEpic).filter(Boolean);
      if (epicErrors.length > 0) {
        errors.push(...epicErrors);
      }
    }
    
    // Construction du résultat final
    return errors.length > 0 ? { valid: false, errors } : { valid: true };
  }

  validateEpic(epic) {
    if (!epic.id || !epic.title) {
      return 'Chaque epic doit avoir un id et un title';
    }
    if (epic.features && !Array.isArray(epic.features)) {
      return 'features doit être un tableau';
    }
    return null;
  }

  validateMvp(backlog, errors) {
    if (backlog.mvp) {
      if (!Array.isArray(backlog.mvp)) {
        errors.push('La section MVP doit être un tableau');
      } else {
        // Vérification de chaque user story du MVP
        for (const story of backlog.mvp) {
          if (!story.id || !story.title) {
            errors.push('Une user story du MVP doit avoir un ID et un titre');
            break;
          }
        }
      }
    }
  }

   _validateIteration(iteration) {
    if (!iteration.name) {
      return 'name est requis à /iterations';
    }
    
    if (!iteration.stories || !Array.isArray(iteration.stories)) {
      return 'stories doit être un tableau à /iterations';
    }
    
    // Vérification rapide des stories
    for (const story of iteration.stories) {
      if (!story.id || !story.title) {
        return `Une user story de l'itération ${iteration.name} doit avoir un ID et un titre`;
      }
    }
    
    return null;
  }
  
  validateIterations(backlog, errors) {
    if (!backlog.iterations) {
      return; // Aucune itération à valider
    }
    
    if (!Array.isArray(backlog.iterations)) {
      errors.push('La section iterations doit être un tableau');
      return;
    }
    
    // Vérification de chaque itération
    for (const iteration of backlog.iterations) {
      const errorMsg = this._validateIteration(iteration);
      if (errorMsg) {
        errors.push(errorMsg);
      }
    }
  }

  _logValidationErrors(errors) {
    console.error(chalk.red('⚠️ Backlog invalide:'));
    errors.forEach(error => {
      console.error(chalk.yellow(`  - ${error}`));
    });
  }
  
  validateBacklog(backlog) {
    console.error(chalk.blue('🔍 Validation du backlog...'));
    
    try {
      const result = this.validate(backlog);
      
      // Afficher le résultat de validation
      if (result.valid) {
        console.error(chalk.green('✓ Backlog valide'));
      } else {
        this._logValidationErrors(result.errors);
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
