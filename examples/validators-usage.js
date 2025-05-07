/**
 * Exemple d'utilisation des validateurs avec la nouvelle Factory
 * 
 * Ce fichier montre comment migrer progressivement de l'ancien système de validation
 * vers la nouvelle implémentation utilisant le pattern Strategy.
 */

// Ancien système (à remplacer progressivement)
const oldSchemaValidator = require('../server/lib/utils/schema-validator');

// Nouvelle Factory de validateurs (recommandé)
const validatorsFactory = require('../server/lib/utils/validators/validators-factory');

// Exemple de données à valider
const userStory = {
  id: 'US-123',
  title: 'En tant qu\'utilisateur, je veux pouvoir créer un backlog',
  description: 'Pour organiser mon projet agile',
  acceptance_criteria: [
    'Le backlog peut être créé',
    'Les user stories peuvent être ajoutées'
  ]
};

const feature = {
  id: 'F-1',
  title: 'Gestion des backlogs',
  description: 'Fonctionnalités de gestion des backlogs',
  stories: [userStory]
};

// ========== EXEMPLES D'UTILISATION ==========

// 1. Validation d'une user story
console.log('--- Validation d\'une user story ---');

// Ancien système
const oldUserStoryResult = oldSchemaValidator.validateUserStory(userStory);
console.log('Ancien système:', oldUserStoryResult.valid ? 'Valide' : 'Invalide');

// Nouveau système avec Factory
const newUserStoryResult = validatorsFactory.validate(userStory, 'userStory');
console.log('Nouveau système:', newUserStoryResult.valid ? 'Valide' : 'Invalide');

// 2. Validation d'une feature
console.log('\n--- Validation d\'une feature ---');

// Ancien système
const oldFeatureResult = oldSchemaValidator.validateFeature(feature);
console.log('Ancien système:', oldFeatureResult.valid ? 'Valide' : 'Invalide');

// Nouveau système avec Factory
const newFeatureResult = validatorsFactory.validate(feature, 'feature');
console.log('Nouveau système:', newFeatureResult.valid ? 'Valide' : 'Invalide');

// 3. Accès direct aux validateurs spécifiques (pour des cas avancés)
console.log('\n--- Accès direct aux validateurs spécifiques ---');

const userStoryValidator = validatorsFactory.getUserStoryValidator();
const directResult = userStoryValidator.validate(userStory);
console.log('Validateur direct:', directResult.valid ? 'Valide' : 'Invalide');

/**
 * RECOMMANDATIONS POUR LA MIGRATION
 * 
 * 1. Remplacer progressivement les appels à l'ancien validateur par la Factory
 *    Exemple: oldSchemaValidator.validateUserStory(story) → validatorsFactory.validate(story, 'userStory')
 * 
 * 2. Pour les cas avancés nécessitant un accès direct au validateur:
 *    validatorsFactory.getUserStoryValidator().validate(story)
 * 
 * 3. Avantages de la nouvelle approche:
 *    - Code plus modulaire et maintenable
 *    - Tests unitaires robustes (100% de couverture)
 *    - Meilleure séparation des responsabilités
 *    - Extension facile pour de nouveaux types de validation
 */
