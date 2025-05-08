/**
 * Tests isolés pour la fonction formatUserStory
 * Utilisés pour tester le formatage des user stories indépendamment des autres composants
 * Refactorisation selon principes TDD Wave 8
 */
const { formatUserStory } = require('../../../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Définir un story d'exemple directement dans le test pour éviter les dépendances externes
// Cela rend le test plus robuste et moins dépendant de l'environnement (TDD Wave 8)
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


// Mock pour fs-extra (standardisé selon TDD Wave 8)
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().mockResolvedValue('{}'),
  readFileSync: jest.fn().mockReturnValue('{}'),
  pathExists: jest.fn().mockResolvedValue(true),
  pathExistsSync: jest.fn().mockReturnValue(true)
}));

// Mock pour path (simplifié selon TDD Wave 8)
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/'))
}));

describe('User Story Markdown Formatting', () => {
  // Réactivé après correction des mocks et imports (TDD Wave 8)
  test('Formats user story correctly with all required elements', () => {
    // Utiliser notre story d'exemple directement définie dans le test
    // Cela évite les dépendances sur les fixtures externes (TDD Wave 8)
    
    // Formater la user story
    const formatted = formatUserStory(sampleStory);
    
    // Vérifications de base
    expect(formatted).toContain(`# User Story ${sampleStory.id}: ${sampleStory.title}`);
    expect(formatted).toContain(`- [ ] ${sampleStory.description}`);
    expect(formatted).toContain('### Acceptance Criteria');
    expect(formatted).toContain('### Technical Tasks');
    
    // Vérifier les critères d'acceptation
    sampleStory.acceptance_criteria.forEach(criteria => {
      expect(formatted).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier les tâches
    sampleStory.tasks.forEach(task => {
      expect(formatted).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la priorité
    if (sampleStory.priority) {
      expect(formatted).toContain(`**Priority:** ${sampleStory.priority}`);
    }
    
    // Vérifier les dépendances si elles existent
    if (sampleStory.dependencies && sampleStory.dependencies.length > 0) {
      expect(formatted).toContain(`**Dependencies:** ${sampleStory.dependencies.join(', ')}`);
    }
  });
  
  // Réactivé après correction et standardisation (TDD Wave 8)
  test('Includes enhanced AI instructions for status updates', () => {
    // Utiliser la même story sample directement définie dans le test
    const formatted = formatUserStory(sampleStory);
    
    // Vérifier les instructions pour l'IA
    expect(formatted).toContain('🤖 User Story Instructions for AI');
    expect(formatted).toContain('Mettez à jour le statut des tâches');
    expect(formatted).toContain('[ ] par [x]');
  });
});
