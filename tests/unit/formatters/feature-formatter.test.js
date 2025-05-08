/**
 * Tests TDD pour le module feature-formatter
 * Approche RED-GREEN-REFACTOR simplifiée
 */
const { generateFeatureContent } = require('../../../server/lib/markdown/feature-formatter');

// Mock pour les instructions markdown
jest.mock('../../../server/lib/markdown/utils', () => ({
  markdownInstructions: {
    featureFileInstructions: '<!-- Instructions for AI -->'
  }
}));

describe('Feature Formatter - TDD Tests', () => {
  // Données de test pour une feature complète
  const mockFeature = {
    title: 'Test Feature',
    description: 'This is a test feature description',
    business_value: 'High value for testing purposes'
  };

  // Epic parent pour les tests
  const mockEpicTitle = 'Parent Epic';

  describe('generateFeatureContent', () => {
    test('should format a complete feature correctly', () => {
      // Act
      const result = generateFeatureContent(mockFeature, mockEpicTitle);
      
      // Assert
      // Vérification de l'en-tête
      expect(result).toContain(`# Feature: ${mockFeature.title}`);
      
      // Vérification des instructions pour l'IA
      expect(result).toContain('<!-- Instructions for AI -->');
      
      // Vérification de la description
      expect(result).toContain(`## Description\n\n${mockFeature.description}`);
      
      // Vérification de la valeur métier
      expect(result).toContain(`## Business Value\n\n${mockFeature.business_value}`);
      
      // Vérification de l'epic parent
      expect(result).toContain(`## Parent Epic\n\n${mockEpicTitle}`);
      
      // Vérification de la section user stories
      expect(result).toContain('## User Stories');
      expect(result).toContain('_Les user stories associées se trouvent dans le dossier "user-stories"._');
    });

    test('should handle a feature without business value', () => {
      // Arrange
      const featureWithoutBusinessValue = {
        title: 'Feature Without Business Value',
        description: 'This feature has no business value specified'
      };
      
      // Act
      const result = generateFeatureContent(featureWithoutBusinessValue, mockEpicTitle);
      
      // Assert
      expect(result).toContain(`# Feature: ${featureWithoutBusinessValue.title}`);
      expect(result).toContain(`## Description\n\n${featureWithoutBusinessValue.description}`);
      expect(result).not.toContain('## Business Value');
      expect(result).toContain(`## Parent Epic\n\n${mockEpicTitle}`);
      expect(result).toContain('## User Stories');
    });

    test('should handle a feature with empty description', () => {
      // Arrange
      const featureWithEmptyDescription = {
        title: 'Feature With Empty Description',
        business_value: 'Some business value'
      };
      
      // Act
      const result = generateFeatureContent(featureWithEmptyDescription, mockEpicTitle);
      
      // Assert
      expect(result).toContain(`# Feature: ${featureWithEmptyDescription.title}`);
      expect(result).toContain('## Description\n\n');
      expect(result).toContain(`## Business Value\n\n${featureWithEmptyDescription.business_value}`);
    });

    test('should handle a minimal feature with only title', () => {
      // Arrange
      const minimalFeature = {
        title: 'Minimal Feature'
      };
      
      // Act
      const result = generateFeatureContent(minimalFeature, mockEpicTitle);
      
      // Assert
      expect(result).toContain(`# Feature: ${minimalFeature.title}`);
      expect(result).toContain('## Description\n\n');
      expect(result).not.toContain('## Business Value');
      expect(result).toContain(`## Parent Epic\n\n${mockEpicTitle}`);
      expect(result).toContain('## User Stories');
    });
  });
});
