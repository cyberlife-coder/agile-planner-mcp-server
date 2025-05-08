/**
 * SchemaValidator - Façade pour le système de validation basé sur le pattern Strategy
 * @module schema-validator
 * 
 * ATTENTION: Ce module est maintenu pour la compatibilité avec le code existant.
 * Pour les nouveaux développements, utilisez directement la Factory de validateurs.
 * @see {@link ./validators/validators-factory.js}
 */

const chalk = require('chalk');

// Import de la nouvelle Factory de validateurs
const validatorsFactory = require('./validators/validators-factory');

/**
 * Classe façade pour le système de validation
 * Maintient la compatibilité avec l'ancien système tout en utilisant la nouvelle architecture
 */
class SchemaValidator {
  /**
   * Crée une instance du SchemaValidator
   */
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

  /**
   * Crée le schéma pour une user story
   * @returns {Object} Schéma pour une user story
   */
  /**
   * Méthode de compatibilité - Utilise la Factory pour créer un schéma de user story
   * @returns {Object} Schéma pour une user story
   * @deprecated Utilisez directement la Factory de validateurs
   */
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
          items: this.createUserStorySchema()
        },
        priority: { type: 'string' },
        businessValue: { type: 'string' }
      }
    };
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
          items: this.createFeatureSchema()
        }
      }
    };
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

  /**
   * Vérifie si une valeur correspond au type attendu
   * @param {*} value - Valeur à vérifier
   * @param {string} type - Type attendu
   * @returns {boolean} true si le type correspond
   */
  checkType(value, type) {
    if (type === 'string') return typeof value === 'string';
    if (type === 'number') return typeof value === 'number';
    if (type === 'boolean') return typeof value === 'boolean';
    if (type === 'array') return Array.isArray(value);
    if (type === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return false;
  }

  /**
   * Valide une valeur contre un schéma
   * @param {*} value - Valeur à valider
   * @param {Object} schema - Schéma à utiliser
   * @param {string} path - Chemin actuel (pour les erreurs)
  }

  /**
   * Valide un backlog complet
   * @param {Object} backlog - Le backlog à valider
   * @returns {Object} Résultat de la validation {valid, error}
   */
  validateBacklog(backlog) {
    // Vérifications de base
    if (!this._validateBasicBacklogStructure(backlog)) {
      // Format d'erreur compatible avec les tests existants
      if (!backlog) {
        return { valid: false, errors: [{ field: 'backlog', message: 'Backlog non défini' }] };
      }
      if (!backlog.projectName) {
        return { valid: false, errors: [{ field: 'projectName', message: 'projectName est requis' }] };
      }
      if (!backlog.epics || !Array.isArray(backlog.epics)) {
        return { valid: false, errors: [{ field: 'epics', message: 'epics est requis et doit être un tableau' }] };
      }
      // Cas par défaut si la structure est invalide pour une autre raison
      return { valid: false, errors: [{ field: 'structure', message: 'Structure de backlog invalide ou incomplète' }] };
    }

    // Vérification des epics
    const epicValidation = this._validateEpics(backlog.epics);
    if (!epicValidation.valid) {
      // Convertir le format d'erreur pour compatibilité avec les tests
      return { 
        valid: false, 
        errors: [{ 
          field: epicValidation.field || 'epic', 
          message: epicValidation.error 
        }]
      };
    }

    // Vérification du MVP (si présent)
    if (backlog.mvp) {
      const mvpValidation = this._validateMvp(backlog.mvp);
      if (!mvpValidation.valid) {
        // Convertir le format d'erreur pour compatibilité avec les tests
        return { 
          valid: false, 
          errors: [{ 
            field: 'mvp', 
            message: mvpValidation.error 
          }]
        };
      }
    }

    // Vérification des itérations (si présentes)
    if (backlog.iterations) {
      const iterationsValidation = this._validateIterations(backlog.iterations);
      if (!iterationsValidation.valid) {
        // Convertir le format d'erreur pour compatibilité avec les tests
        return { 
          valid: false, 
          errors: [{ 
            field: 'iterations', 
            message: iterationsValidation.error 
          }]
        };
      }
    }

    // Tout est valide
    return { valid: true };
  }

  /**
   * Vérifie la structure de base du backlog
   * @param {Object} backlog - Le backlog à vérifier
   * @returns {boolean} True si la structure de base est valide
   * @private
   */
  _validateBasicBacklogStructure(backlog) {
    if (!backlog) {
      return false;
    }

    if (!backlog.projectName) {
      return false;
    }

    if (!backlog.epics || !Array.isArray(backlog.epics)) {
      return false;
    }

    return true;
  }

  /**
   * Valide les epics du backlog
   * @param {Array} epics - Liste des epics à valider
   * @returns {Object} Résultat de la validation {valid, error}
   * @private
   */
  _validateEpics(epics) {
    for (const [index, epic] of epics.entries()) {
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

      // Vérification des features
      const featureValidation = this._validateFeatures(epic.features, epic.id, index);
      if (!featureValidation.valid) {
        return featureValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Valide les features d'un epic
   * @param {Array} features - Liste des features à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {number} epicIndex - Index de l'epic parent
   * @returns {Object} Résultat de la validation {valid, error}
   * @private
   */
  _validateFeatures(features, epicId, epicIndex) {
    for (const [index, feature] of features.entries()) {
      if (!feature.id || !feature.title) {
        return { 
          valid: false, 
          error: `Une feature de l'epic ${epicId} doit avoir un ID et un titre`,
          field: `epics[${epicIndex}].features[${index}].id`
        };
      }

      // Gère à la fois userStories (nouvelle structure) et stories (ancienne structure)
      const userStories = feature.userStories || feature.stories;
      
      if (!userStories || !Array.isArray(userStories)) {
        return { 
          valid: false, 
          error: `La feature ${feature.id} de l'epic ${epicId} doit avoir une liste de user stories`,
          field: `epics[${epicIndex}].features[${index}].stories`
        };
      }

      // Vérification des user stories
      const userStoryValidation = this._validateUserStories(userStories, epicId, feature.id, epicIndex, index);
      if (!userStoryValidation.valid) {
        return userStoryValidation;
      }
    }

    return { valid: true };
  }

  /**
   * Valide les user stories d'une feature
   * @param {Array} userStories - Liste des user stories à valider
   * @param {string} epicId - ID de l'epic parent
   * @param {string} featureId - ID de la feature parente
   * @param {number} epicIndex - Index de l'epic parent
   * @param {number} featureIndex - Index de la feature parente
   * @returns {Object} Résultat de la validation {valid, error}
   * @private
   */
  _validateUserStories(userStories, epicId, featureId, epicIndex, featureIndex) {
    for (const [index, story] of userStories.entries()) {
      // Gère à la fois title et id qui pourraient être présents différemment selon les tests
      if (!story.id || !story.title) {
        return { 
          valid: false, 
          error: `Une user story de la feature ${featureId} (epic ${epicId}) doit avoir un ID et un titre`,
          field: `epics[${epicIndex}].features[${featureIndex}].stories[${index}].id`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Valide la section MVP du backlog
   * @param {Array} mvp - Liste des user stories du MVP
   * @returns {Object} Résultat de la validation {valid, error}
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
   * Valide les itérations du backlog
   * @param {Array} iterations - Liste des itérations à valider
   * @returns {Object} Résultat de la validation {valid, error}
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
   * Extrait les données de backlog d'une structure potentiellement encapsulée
   * @param {Object} potentiallyWrappedBacklog - Structure qui pourrait contenir des données encapsulées
   * @returns {Object} Données de backlog extraites
   */
  extractBacklogData(potentiallyWrappedBacklog) {
    // Si l'objet est null ou undefined
    if (!potentiallyWrappedBacklog) {
      return null;
    }

    // Si l'objet a une structure de wrapper MCP (success, result)
    if (potentiallyWrappedBacklog.success && potentiallyWrappedBacklog.result) {
      console.log(chalk.blue('📋 Extraction des données depuis un wrapper MCP'));
      return potentiallyWrappedBacklog.result;
    }

    // Si l'objet a un projectName, on suppose que c'est déjà un backlog
    if (potentiallyWrappedBacklog.projectName) {
      return potentiallyWrappedBacklog;
    }

    // Retourner directement l'objet si aucune autre condition n'est remplie
    return potentiallyWrappedBacklog;
  }
}

module.exports = { SchemaValidator };
