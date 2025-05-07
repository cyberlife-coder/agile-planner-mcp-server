/**
 * Exemple de migration progressive vers le pattern Strategy
 * 
 * Ce fichier montre comment intégrer la nouvelle Factory de validateurs
 * dans le code existant, en suivant une approche progressive.
 */

// Importation de la Factory de validateurs
const validatorsFactory = require('../server/lib/utils/validators/validators-factory');

/**
 * EXEMPLE 1: Fonction existante utilisant l'ancien validateur
 * 
 * Avant la refactorisation:
 */
function validateBacklogBeforeRefactoring(backlog) {
  const schemaValidator = require('../server/lib/utils/schema-validator');
  
  try {
    const result = schemaValidator.validateBacklog(backlog);
    if (result.valid) {
      console.log('✅ Backlog valide');
      return true;
    } else {
      console.log('❌ Backlog invalide:', result.errors);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return false;
  }
}

/**
 * EXEMPLE 2: La même fonction après migration vers la Factory
 * 
 * Après la refactorisation:
 */
function validateBacklogAfterRefactoring(backlog) {
  try {
    // Utilisation de la Factory pour obtenir le résultat de validation
    const result = validatorsFactory.validate(backlog, 'backlog');
    
    if (result.valid) {
      console.log('✅ Backlog valide');
      return true;
    } else {
      console.log('❌ Backlog invalide:', result.errors);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return false;
  }
}

/**
 * EXEMPLE 3: Approche hybride pour une migration progressive
 * 
 * Cette approche permet de migrer progressivement en utilisant
 * la nouvelle implémentation tout en gardant la compatibilité
 * avec l'ancien système.
 */
function validateBacklogHybridApproach(backlog, useNewValidator = true) {
  try {
    let result;
    
    if (useNewValidator) {
      // Nouvelle implémentation avec la Factory
      result = validatorsFactory.validate(backlog, 'backlog');
    } else {
      // Ancienne implémentation pour compatibilité
      const schemaValidator = require('../server/lib/utils/schema-validator');
      result = schemaValidator.validateBacklog(backlog);
    }
    
    if (result.valid) {
      console.log('✅ Backlog valide');
      return true;
    } else {
      console.log('❌ Backlog invalide:', result.errors);
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de la validation:', error);
    return false;
  }
}

/**
 * EXEMPLE 4: Utilisation avancée avec accès direct aux validateurs
 * 
 * Pour des cas nécessitant un contrôle plus fin sur le processus de validation.
 */
function validateComplexBacklog(backlog) {
  try {
    // Obtention directe du validateur de backlog
    const backlogValidator = validatorsFactory.getBacklogValidator();
    
    // Validation du backlog
    const backlogResult = backlogValidator.validate(backlog);
    
    // Validation spécifique des epics
    let epicResults = [];
    if (backlog.epics && Array.isArray(backlog.epics)) {
      const epicValidator = validatorsFactory.getEpicValidator();
      
      epicResults = backlog.epics.map((epic, index) => {
        const result = epicValidator.validate(epic);
        return {
          epicIndex: index,
          epicId: epic.id,
          valid: result.valid,
          errors: result.errors
        };
      });
    }
    
    // Traitement personnalisé des résultats
    const invalidEpics = epicResults.filter(result => !result.valid);
    
    return {
      backlogValid: backlogResult.valid,
      backlogErrors: backlogResult.errors,
      epicsValid: invalidEpics.length === 0,
      invalidEpics: invalidEpics
    };
  } catch (error) {
    console.error('Erreur lors de la validation complexe:', error);
    return { backlogValid: false, error: error.message };
  }
}

// Exportation des fonctions pour utilisation dans d'autres modules
module.exports = {
  validateBacklogBeforeRefactoring,
  validateBacklogAfterRefactoring,
  validateBacklogHybridApproach,
  validateComplexBacklog
};
