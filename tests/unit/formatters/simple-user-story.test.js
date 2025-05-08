/**
 * Test complètement isolé pour l'utilitaire de formatage des user stories
 * Conformément à TDD Wave 8 : Isolation stricte et correction des chemins d'import
 * Résolution du problème d'import et simplification du test
 */
const { testFormat } = require('../../utils/mdformatter');
const fs = require('fs-extra');
const path = require('path');

// Définir un sample de user story directement dans le test pour éviter les problèmes de fixtures
const sampleStory = {
  id: "US001",
  title: "Authentification utilisateur",
  description: "En tant qu'utilisateur, je veux pouvoir m'authentifier afin d'accéder à mon compte",
  acceptance_criteria: [
    "L'utilisateur peut s'authentifier avec email/mot de passe",
    "L'authentification échoue avec des identifiants incorrects",
    "L'utilisateur reçoit un message d'erreur explicite en cas d'échec"
  ],
  tasks: [
    "Créer le formulaire d'authentification",
    "Implémenter la validation côté client",
    "Implémenter la logique d'authentification côté serveur",
    "Ajouter des tests unitaires et d'intégration"
  ],
  priority: "Haute",
  dependencies: ["US002", "US003"]
};


// Mock pour fs-extra (simplifié conformément à TDD Wave 8)
jest.mock('fs-extra', () => ({
  writeFileSync: jest.fn()
}));

// Mock pour path (simplifié conformément à TDD Wave 8)
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

describe('User Story Markdown Formatting', () => {
  // Conforme à TDD Wave 8 - Test simplifié et robuste
  test('Formats user story correctly in markdown with checkboxes', () => {
    // Utiliser notre story d'exemple directement définie dans le test
    const formatted = testFormat(sampleStory);
    
    // Vérifier tous les éléments requis par le test original
    expect(formatted).toContain(`# User Story ${sampleStory.id}: ${sampleStory.title}`);
    expect(formatted).toContain(`- [ ] ${sampleStory.description}`);
    expect(formatted).toContain('### Acceptance Criteria');
    expect(formatted).toContain('### Technical Tasks');
    
    // Vérifier chaque critère d'acceptation
    sampleStory.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier chaque tâche
    sampleStory.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    expect(formatted).toContain(`**Priority:** ${sampleStory.priority}`);
    
    // Vérifier les instructions pour l'IA
    expect(formatted).toContain('🤖');
    expect(formatted).toContain('User Story Instructions for AI');
    
    // Optionnel: Écrire le résultat dans un fichier pour inspection
    // fs.writeFileSync(path.join(__dirname, 'user-story-test-output.md'), formatted);
    
    // Un test conforme à TDD Wave 8 doit vérifier le formattage sans créer de fichiers
    // Ce qui rend le test plus isolé et moins dépendant de l'environnement
  });
});
