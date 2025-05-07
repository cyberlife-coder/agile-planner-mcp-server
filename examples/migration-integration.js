/**
 * Exemple d'intégration du pattern Strategy dans un module existant
 * 
 * Ce fichier montre comment intégrer progressivement la nouvelle Factory
 * de validateurs dans un module existant comme backlog-generator.js
 */

// Importation de la Factory de validateurs
const validatorsFactory = require('../server/lib/utils/validators/validators-factory');

/**
 * Exemple d'intégration dans la fonction generateBacklog
 * 
 * Avant la refactorisation:
 * 
 * ```javascript
 * const schemaValidator = require('./utils/schema-validator');
 * 
 * function generateBacklog(input, options = {}) {
 *   // Validation du backlog
 *   const validationResult = schemaValidator.validateBacklog(input);
 *   if (!validationResult.valid) {
 *     throw new Error(`Backlog invalide: ${validationResult.errors.join(', ')}`);
 *   }
 *   
 *   // Suite du traitement...
 * }
 * ```
 * 
 * Après la refactorisation avec approche hybride:
 */
function generateBacklogRefactored(input, options = {}) {
  // Configuration pour la migration progressive
  const useNewValidator = options.useNewValidator !== false; // Par défaut, utilise le nouveau validateur
  
  try {
    // Validation du backlog avec la nouvelle Factory ou l'ancien validateur
    let validationResult;
    
    if (useNewValidator) {
      // Nouvelle implémentation avec la Factory
      validationResult = validatorsFactory.validate(input, 'backlog');
    } else {
      // Ancienne implémentation pour compatibilité
      const schemaValidator = require('../server/lib/utils/schema-validator');
      validationResult = schemaValidator.validateBacklog(input);
    }
    
    // Vérification du résultat (identique pour les deux implémentations)
    if (!validationResult.valid) {
      throw new Error(`Backlog invalide: ${validationResult.errors.join(', ')}`);
    }
    
    // Suite du traitement...
    return {
      success: true,
      message: 'Backlog généré avec succès',
      result: {
        // Résultat du traitement...
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Exemple d'intégration dans une fonction qui valide plusieurs types d'objets
 * 
 * Avant la refactorisation:
 * 
 * ```javascript
 * const schemaValidator = require('./utils/schema-validator');
 * 
 * function validateHierarchy(epic) {
 *   // Validation de l'epic
 *   const epicResult = schemaValidator.validateEpic(epic);
 *   if (!epicResult.valid) {
 *     return { valid: false, errors: epicResult.errors };
 *   }
 *   
 *   // Validation des features
 *   for (const feature of epic.features) {
 *     const featureResult = schemaValidator.validateFeature(feature);
 *     if (!featureResult.valid) {
 *       return { valid: false, errors: featureResult.errors };
 *     }
 *     
 *     // Validation des user stories
 *     for (const story of feature.stories) {
 *       const storyResult = schemaValidator.validateUserStory(story);
 *       if (!storyResult.valid) {
 *         return { valid: false, errors: storyResult.errors };
 *       }
 *     }
 *   }
 *   
 *   return { valid: true };
 * }
 * ```
 * 
 * Après la refactorisation avec la Factory:
 */
/**
 * Valide un epic avec l'ancien validateur
 * @param {Object} epic - Epic à valider
 * @returns {Object} Résultat de validation
 */
function validateWithOldValidator(epic) {
  const schemaValidator = require('../server/lib/utils/schema-validator');
  
  // Validation de l'epic
  const epicResult = schemaValidator.validateEpic(epic);
  if (!epicResult.valid) {
    return { valid: false, errors: epicResult.errors };
  }
  
  // Validation des features
  for (const feature of epic.features) {
    const featureResult = schemaValidator.validateFeature(feature);
    if (!featureResult.valid) {
      return { valid: false, errors: featureResult.errors };
    }
    
    // Validation des user stories
    for (const story of feature.stories) {
      const storyResult = schemaValidator.validateUserStory(story);
      if (!storyResult.valid) {
        return { valid: false, errors: storyResult.errors };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Valide un epic avec la nouvelle Factory
 * @param {Object} epic - Epic à valider
 * @returns {Object} Résultat de validation
 */
function validateWithNewValidator(epic) {
  // Validation de l'epic avec la Factory
  const epicResult = validatorsFactory.validate(epic, 'epic');
  
  if (!epicResult.valid) {
    return { valid: false, errors: epicResult.errors };
  }
  
  // Validation des features avec la Factory
  for (const feature of epic.features) {
    const featureResult = validatorsFactory.validate(feature, 'feature');
    
    if (!featureResult.valid) {
      return { valid: false, errors: featureResult.errors };
    }
    
    // Validation des user stories avec la Factory
    for (const story of feature.stories) {
      const storyResult = validatorsFactory.validate(story, 'userStory');
      
      if (!storyResult.valid) {
        return { valid: false, errors: storyResult.errors };
      }
    }
  }
  
  return { valid: true };
}

/**
 * Valide la hiérarchie d'un epic avec ses features et user stories
 * @param {Object} epic - Epic à valider
 * @param {Object} options - Options de validation
 * @returns {Object} Résultat de validation
 */
function validateHierarchyRefactored(epic, options = {}) {
  // Configuration pour la migration progressive
  const useNewValidator = options.useNewValidator !== false; // Par défaut, utilise le nouveau validateur
  
  try {
    // Utilise le validateur approprié selon l'option
    if (useNewValidator) {
      return validateWithNewValidator(epic);
    } else {
      return validateWithOldValidator(epic);
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * RECOMMANDATIONS POUR L'INTÉGRATION
 * 
 * 1. Utilisez l'approche hybride pour une migration progressive
 *    - Ajoutez une option pour choisir l'implémentation (ancien/nouveau)
 *    - Par défaut, utilisez la nouvelle implémentation
 * 
 * 2. Testez chaque module après l'intégration
 *    - Exécutez les tests avec l'ancienne implémentation
 *    - Exécutez les tests avec la nouvelle implémentation
 *    - Comparez les résultats pour garantir la compatibilité
 * 
 * 3. Une fois la migration terminée pour un module:
 *    - Supprimez l'approche hybride
 *    - Utilisez uniquement la nouvelle Factory
 *    - Mettez à jour les tests pour utiliser uniquement la nouvelle implémentation
 * 
 * 4. Après la migration complète:
 *    - Supprimez les fichiers obsolètes listés dans OBSOLETE-FILES.md
 *    - Mettez à jour la documentation
 */

// Exportation des fonctions pour utilisation dans d'autres modules
module.exports = {
  generateBacklogRefactored,
  validateHierarchyRefactored
};
