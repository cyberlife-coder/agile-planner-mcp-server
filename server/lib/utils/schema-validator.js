const chalk = require('chalk');

// Import de la nouvelle Factory de validateurs
const validatorsFactory = require('./validators/validators-factory');

/**
 * Formate une valeur pour l'affichage sécurisé dans les logs
 * Évite le problème de stringification par défaut '[object Object]'
 * @param {any} value - Valeur à formater
 * @returns {string} - Valeur formatée en chaîne de caractères
 */
function formatValue(value) {
  if (value === undefined || value === null) {
    return 'undefined';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

// Classe façade pour le système de validation (compatibilité ancienne/nouvelle archi)
class SchemaValidator {
    constructor() {
    // Pour la compatibilité avec le code existant
    this.schemas = {
      userStory: {},
      feature: {},
      epic: {},
      backlog: {},
      iteration: {}
    };
  }

  // Crée le schéma pour une user story (compatibilité)
  createUserStorySchema() {
    // Retourne un schéma vide pour la compatibilité
    return {
      required: ['id', 'title'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' }
      }
    };
  }

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
          items: this.createUserStorySchema()
        },
        priority: { type: 'string' },
        businessValue: { type: 'string' }
      }
    };
  }

  createEpicSchema() {
    return {
      required: ['id', 'title'],
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        features: {
          type: 'array',
          items: this.createFeatureSchema()
        }
      }
    };
  }

  createBacklogSchema() {
    return {
      required: ['projectName', 'epics'],
      properties: {
        projectName: { type: 'string' },
        description: { type: 'string' },
        epics: {
          type: 'array',
          items: this.createEpicSchema()
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
          items: this.createIterationSchema()
        }
      }
    };
  }

  createIterationSchema() {
    return {
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
    };
  }

  checkType(value, type) {
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number';
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return false;
  }



  /**
  * Crée un objet d'erreur formaté pour la validation
  * @param {string} field - Le champ qui a échoué la validation
  * @param {string} message - Le message d'erreur
  * @returns {Object} - Résultat de validation avec erreur formatée
  * @private
  */
 _createValidationError(field, message) {
   return {
     valid: false,
     errors: [{ field, message }]
   };
 }

 /**
  * Gère les résultats de validation d'une section du backlog
  * @param {Object} validationResult - Résultat de validation d'une section
  * @param {string} defaultField - Champ par défaut si non spécifié dans le résultat
  * @returns {Object|null} - Erreur formatée ou null si valide
  * @private
  */
 _handleSectionValidation(validationResult, defaultField) {
   if (!validationResult.valid) {
     const field = validationResult.field || defaultField;
     const message = validationResult.error;
     return this._createValidationError(field, message);
   }
   return null; // Validation réussie
 }

 /**
  * Valide la structure complète d'un backlog
  * @param {Object} backlog - Le backlog à valider
  * @returns {Object} Résultat de validation {valid: boolean, errors?: Array}
  */
 validateBacklog(backlog) {
   // Vérifications de base avec early returns pour la lisibilité
   if (!this._validateBasicBacklogStructure(backlog)) {
     if (!backlog) {
       return this._createValidationError('backlog', 'Backlog non défini');
     }
     if (!backlog.projectName) {
       return this._createValidationError('projectName', 'projectName est requis');
     }
     if (!backlog.epics || !Array.isArray(backlog.epics)) {
       return this._createValidationError('epics', 'epics est requis et doit être un tableau');
     }
     // Cas par défaut pour structure invalide
     return this._createValidationError('structure', 'Structure de backlog invalide ou incomplète');
   }

   // Vérification des epics (obligatoire)
   const epicValidationResult = this._handleSectionValidation(
     this._validateEpics(backlog.epics),
     'epic'
   );
   if (epicValidationResult) return epicValidationResult;

   // Vérification du MVP (optionnel)
   if (backlog.mvp) {
     const mvpValidationResult = this._handleSectionValidation(
       this._validateMvp(backlog.mvp),
       'mvp'
     );
     if (mvpValidationResult) return mvpValidationResult;
   }

   // Vérification des itérations (optionnel)
   if (backlog.iterations) {
     const iterationsValidationResult = this._handleSectionValidation(
       this._validateIterations(backlog.iterations),
       'iterations'
     );
     if (iterationsValidationResult) return iterationsValidationResult;
   }

   // Tout est valide
   return { valid: true };
 }

  /**
   * Valide la structure de base d'un backlog
   * @param {Object} backlog - Le backlog à valider
   * @returns {boolean} True si la structure de base est valide, false sinon
   * @private
   */
  _validateBasicBacklogStructure(backlog) {
    // Vérification simplifiée en une seule expression (réduction de complexité cognitive)
    return Boolean(
      backlog?.projectName && 
      backlog?.epics && 
      Array.isArray(backlog.epics)
    );
  }

  /**
   * Vérifie qu'un epic possède les propriétés requises
   * @param {Object} epic - Epic à valider 
   * @param {number} index - Index de l'epic dans le tableau
   * @returns {Object|null} - Un objet d'erreur ou null si valide
   * @private
   */
  _validateEpicProperties(epic, index) {
    // Gère à la fois name (nouvelle structure) et title (ancienne structure)
    const epicTitle = epic.name || epic.title;
    
    if (!epic.id || !epicTitle) {
      return { 
        valid: false, 
        error: 'Un epic doit avoir un ID et un nom',
        field: `epics[${index}].id` 
      };
    }
    
    if (!epic.features || !Array.isArray(epic.features)) {
      return { 
        valid: false, 
        error: `L'epic ${epic.id} doit avoir une liste de features`,
        field: `epics[${index}].features`
      };
    }
    
    return null; // Valide
  }

  /**
   * Valide tous les epics du backlog
   * @param {Array} epics - Liste des epics à valider
   * @returns {Object} - Résultat de validation
   * @private
   */
  _validateEpics(epics) {
    for (const [index, epic] of epics.entries()) {
      // Vérifie les propriétés de base de l'epic
      const epicValidationError = this._validateEpicProperties(epic, index);
      if (epicValidationError) {
        return epicValidationError;
      }

      // Vérification des features
      const featureValidation = this._validateFeatures(epic.features, epic.id, index);
      if (!featureValidation.valid) {
        return featureValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Vérifie qu'une feature possède les propriétés requises
   * @param {Object} feature - Feature à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {number} epicIndex - Index de l'epic dans le tableau
   * @param {number} featureIndex - Index de la feature dans le tableau
   * @returns {Object|null} - Un objet d'erreur ou null si valide
   * @private
   */
  _validateFeatureProperties(feature, epicId, epicIndex, featureIndex) {
    if (!feature.id || !feature.title) {
      return { 
        valid: false, 
        error: `Une feature de l'epic ${epicId} doit avoir un ID et un titre`,
        field: `epics[${epicIndex}].features[${featureIndex}].id`
      };
    }
    
    // Gère à la fois userStories (nouvelle structure) et stories (ancienne structure)
    const userStories = feature.userStories || feature.stories;
    
    if (!userStories || !Array.isArray(userStories)) {
      return { 
        valid: false, 
        error: `La feature ${feature.id} de l'epic ${epicId} doit avoir une liste de user stories`,
        field: `epics[${epicIndex}].features[${featureIndex}].stories`
      };
    }
    
    return null; // Valide
  }

  /**
   * Valide toutes les features d'un epic
   * @param {Array} features - Liste des features à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {number} epicIndex - Index de l'epic dans le tableau
   * @returns {Object} - Résultat de validation
   * @private
   */
  _validateFeatures(features, epicId, epicIndex) {
    for (const [index, feature] of features.entries()) {
      // Vérifie les propriétés de base de la feature
      const featureValidationError = this._validateFeatureProperties(feature, epicId, epicIndex, index);
      if (featureValidationError) {
        return featureValidationError;
      }

      // Gère à la fois userStories (nouvelle structure) et stories (ancienne structure)
      const userStories = feature.userStories || feature.stories;
      
      // Vérification des user stories
      const userStoryValidation = this._validateUserStories(userStories, epicId, feature.id, epicIndex, index);
      if (!userStoryValidation.valid) {
        return userStoryValidation;
      }
    }

    return { valid: true };
  }
  
  /**
   * Vérifie qu'une user story possède les propriétés requises
   * @param {Object} story - Story à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parent
   * @param {number} epicIndex - Index de l'epic dans le tableau
   * @param {number} featureIndex - Index de la feature dans le tableau
   * @param {number} storyIndex - Index de la story dans le tableau
   * @returns {Object|null} - Un objet d'erreur ou null si valide
   * @private
   */
  _validateUserStoryProperties(story, epicId, featureId, epicIndex, featureIndex, storyIndex) {
    // Gère à la fois title et id qui pourraient être présents différemment selon les tests
    if (!story.id || !story.title) {
      return { 
        valid: false, 
        error: `Une user story de la feature ${featureId} (epic ${epicId}) doit avoir un ID et un titre`,
        field: `epics[${epicIndex}].features[${featureIndex}].stories[${storyIndex}].id`
      };
    }
    
    return null; // Valide
  }

  /**
   * Valide toutes les user stories d'une feature
   * @param {Array} userStories - Liste des user stories à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parent
   * @param {number} epicIndex - Index de l'epic dans le tableau
   * @param {number} featureIndex - Index de la feature dans le tableau
   * @returns {Object} - Résultat de validation
   * @private
   */
  _validateUserStories(userStories, epicId, featureId, epicIndex, featureIndex) {
    for (const [index, story] of userStories.entries()) {
      const storyValidationError = this._validateUserStoryProperties(
        story, epicId, featureId, epicIndex, featureIndex, index);
      
      if (storyValidationError) {
        return storyValidationError;
      }
    }

    return { valid: true };
  }
  
  /**
   * Valide le MVP d'un backlog
   * @param {Array} mvp - Le MVP à valider
   * @returns {Object} - Résultat de validation
   * @private
   */
  _validateMvp(mvp) {
    if (!mvp || !Array.isArray(mvp)) {
      return { valid: false, error: 'La section MVP doit être un tableau' };
    }

    for (const story of mvp) {
      if (!story.id || !story.title) {
        return { valid: false, error: 'Une user story du MVP doit avoir un ID et un titre' };
      }
    }

    return { valid: true };
  }

  /**
   * Valide les itérations d'un backlog
   * @param {Array} iterations - Les itérations à valider
   * @returns {Object} - Résultat de validation
   * @private
   */
  _validateIterations(iterations) {
    if (!iterations || !Array.isArray(iterations)) {
      return { valid: false, error: 'La section iterations doit être un tableau' };
    }

    for (const iteration of iterations) {
      if (!iteration.id || !iteration.name) {
        return { valid: false, error: 'Une itération doit avoir un ID et un nom' };
      }

      if (!iteration.stories || !Array.isArray(iteration.stories)) {
        return { valid: false, error: `L'itération ${iteration.id} doit avoir une liste de user stories` };
      }

      for (const story of iteration.stories) {
        if (!story.id || !story.title) {
          return { valid: false, error: `Une user story de l'itération ${iteration.id} doit avoir un ID et un titre` };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Vérifie si l'objet a la structure d'un wrapper MCP avec success et result
   * @param {Object} obj - Objet à vérifier
   * @returns {boolean} True si c'est un wrapper MCP, false sinon
   * @private
   */
  _isWrapperMCP(obj) {
    return obj?.success === true && obj?.result != null;
  }

  /**
   * Affiche les informations de débogage pour l'extraction des données
   * @param {Object} result - Le résultat extrait du wrapper MCP
   * @private
   */
  _logExtractionDebug(result) {
    const resultType = typeof result;
    const resultKeys = Object.keys(result).slice(0, 3);
    const formattedKeys = formatValue(resultKeys);
    
    console.error(chalk.blue('📋 Extraction des données depuis un wrapper MCP')); 
    console.error(chalk.dim(`   Type: ${resultType}, IDs: ${formattedKeys}`));
  }

  /**
   * Extrait les données de backlog d'un objet potentiellement encapsulé
   * @param {Object} potentiallyWrappedBacklog - L'objet à analyser
   * @returns {Object|null} Les données de backlog extraites ou null
   */
  extractBacklogData(potentiallyWrappedBacklog) {
    // Cas 1: Si l'objet est null ou undefined
    if (!potentiallyWrappedBacklog) {
      return null;
    }

    // Cas 2: Si l'objet a une structure de wrapper MCP (success, result)
    if (this._isWrapperMCP(potentiallyWrappedBacklog)) {
      const { result } = potentiallyWrappedBacklog;
      this._logExtractionDebug(result);
      return result;
    }

    // Cas 3: Si l'objet a un projectName, on suppose que c'est déjà un backlog
    if (potentiallyWrappedBacklog.projectName) {
      return potentiallyWrappedBacklog;
    }

    // Cas 4: Retourner directement l'objet si aucune autre condition n'est remplie
    return potentiallyWrappedBacklog;
  }
}

module.exports = { SchemaValidator };
