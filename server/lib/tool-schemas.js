/**
 * Schémas de validation pour les tools MCP
 */

const generateBacklogSchema = {
  type: 'object',
  required: ['projectName', 'projectDescription'],
  properties: {
    projectName: {
      type: 'string',
      description: 'Nom du projet'
    },
    projectDescription: {
      type: 'string',
      description: 'Description complète du projet'
    },
    outputPath: {
      type: 'string',
      description: 'Chemin de sortie personnalisé (optionnel)'
    }
  }
};

const generateFeatureSchema = {
  type: 'object',
  required: ['featureDescription'],
  properties: {
    featureDescription: {
      type: 'string',
      description: 'Description détaillée de la feature à générer'
    },
    iterationName: {
      type: 'string',
      description: "Nom de l'itération (ex: 'iteration-3', 'next')",
      default: 'next'
    },
    storyCount: {
      type: 'integer',
      description: 'Nombre de user stories à générer',
      minimum: 3,
      default: 3
    },
    businessValue: {
      type: 'string',
      description: 'Valeur métier de cette feature (optionnel)'
    },
    outputPath: {
      type: 'string',
      description: 'Chemin de sortie personnalisé (optionnel)'
    }
  }
};

module.exports = {
  generateBacklogSchema,
  generateFeatureSchema
};
