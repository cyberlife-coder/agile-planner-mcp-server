/**
 * Test minimal pour isoler le problème - TDD Wave 8
 */
const { testFormat } = require('../../utils/mdformatter');
const fs = require('fs-extra');
const path = require('path');

// Mini backlog d'exemple directement dans le test
const sampleStory = {
  id: "US001",
  title: "Authentification utilisateur",
  description: "En tant qu'utilisateur, je veux pouvoir m'authentifier",
  acceptance_criteria: ["Critère 1", "Critère 2"],
  tasks: ["Tâche 1", "Tâche 2"],
  priority: "Haute"
};

// Remplacer les mocks complexes par des implémentations simples
jest.mock('fs-extra', () => ({
  writeFileSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/'))
}));

// Test isolé
test('Test minimal du formateur de user story', () => {
  // Utiliser notre fonction de formatage isolée
  const formatted = testFormat(sampleStory);
  
  // Vérification minimale
  expect(formatted).toContain(`# User Story ${sampleStory.id}: ${sampleStory.title}`);
  console.log("Formatted output:", formatted);
});
