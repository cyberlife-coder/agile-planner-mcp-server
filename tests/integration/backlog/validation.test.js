const { z } = require('zod');

// Schéma de validation pour les tests
const generateBacklogSchema = z.object({
  project: z.string().min(1, "La description du projet est requise"),
  saveRawJSON: z.boolean().optional().default(false)
});

describe('Validation des entrées', () => {
  test('Validation réussie avec des paramètres valides', () => {
    const validParams = {
      project: 'Création d\'une application e-commerce'
    };
    
    const result = generateBacklogSchema.parse(validParams);
    expect(result).toEqual({
      project: 'Création d\'une application e-commerce',
      saveRawJSON: false // valeur par défaut
    });
  });
  
  test('Validation réussie avec saveRawJSON spécifié', () => {
    const validParams = {
      project: 'Création d\'une application e-commerce',
      saveRawJSON: true
    };
    
    const result = generateBacklogSchema.parse(validParams);
    expect(result).toEqual({
      project: 'Création d\'une application e-commerce',
      saveRawJSON: true
    });
  });
  
  test('Échec de validation avec un projet vide', () => {
    const invalidParams = {
      project: ''
    };
    
    expect(() => {
      generateBacklogSchema.parse(invalidParams);
    }).toThrow("La description du projet est requise");
  });
  
  test('Échec de validation avec un projet manquant', () => {
    const invalidParams = {
      saveRawJSON: true
    };
    
    expect(() => {
      generateBacklogSchema.parse(invalidParams);
    }).toThrow("Required");
  });
  
  test('Échec de validation avec un type incorrect pour saveRawJSON', () => {
    const invalidParams = {
      project: 'Création d\'une application e-commerce',
      saveRawJSON: 'oui' // devrait être un booléen, pas une chaîne
    };
    
    expect(() => {
      generateBacklogSchema.parse(invalidParams);
    }).toThrow("Expected boolean");
  });
});
