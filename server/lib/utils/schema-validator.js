const chalk = require('chalk');

// Import de la nouvelle Factory de validateurs
const validatorsFactory = require('./validators/validators-factory');

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
