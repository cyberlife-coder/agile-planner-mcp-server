/**
 * Tests TDD pour les fonctions de formatage de stories
 * Approche RED-GREEN-REFACTOR
 */
const { formatUserStory, UserStoryBuilder } = require('../../server/lib/markdown/story-formatter');

// Mock pour chalk pour éviter la coloration dans les tests
jest.mock('chalk', () => ({
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text)
}));

describe('Story Formatter Tests', () => {
  // Mockup d'une user story complète pour les tests
  const mockUserStory = {
    id: 'US123',
    title: 'Test User Story',
    description: 'This is a test description',
    acceptance_criteria: ['Criteria 1', 'Criteria 2'],
    tasks: ['Task 1', 'Task 2'],
    priority: 'High',
    dependencies: ['US100', 'US101']
  };

  // Test d'intégration - Formatage complet
  test('formatUserStory formats a complete user story correctly', () => {
    // Act
    const result = formatUserStory(mockUserStory);
    
    // Assert - Vérifications de base
    expect(result).toContain(`# User Story ${mockUserStory.id}: ${mockUserStory.title}`);
    expect(result).toContain(`- [ ] ${mockUserStory.description}`);
    expect(result).toContain('### Acceptance Criteria');
    
    // Vérifier que les critères d'acceptation sont présents
    mockUserStory.acceptance_criteria.forEach(criteria => {
      expect(result).toContain(`- [ ] ${criteria}`);
    });
    
    // Vérifier que les tâches sont présentes
    expect(result).toContain('### Technical Tasks');
    mockUserStory.tasks.forEach(task => {
      expect(result).toContain(`- [ ] ${task}`);
    });
    
    // Vérifier la section des métadonnées
    expect(result).toContain(`**Priority:** ${mockUserStory.priority}`);
    expect(result).toContain(`**Dependencies:** ${mockUserStory.dependencies.join(', ')}`);
    
    // Vérifier la présence des instructions pour l'IA
    expect(result).toContain('## 🤖 User Story Instructions for AI');
  });

  // Test de comportement - données manquantes
  test('formatUserStory handles missing data gracefully', () => {
    // Arrange - User story minimale
    const minimalStory = {
      title: 'Minimal Story'
    };
    
    // Act
    const result = formatUserStory(minimalStory);
    
    // Assert
    expect(result).toContain(`# User Story : ${minimalStory.title}`);
    expect(result).toContain('## Description');
    expect(result).toContain('### Acceptance Criteria');
    expect(result).toContain('### Technical Tasks');
    expect(result).not.toContain('**Priority:**');
    expect(result).not.toContain('**Dependencies:**');
    expect(result).toContain('## 🤖 User Story Instructions for AI');
  });

  // Test unitaire pour UserStoryBuilder.withDescription
  test('UserStoryBuilder.withDescription adds only one checkbox for description', () => {
    // Arrange
    const story = {
      title: 'Description Test',
      description: 'Test description'
    };
    const builder = new UserStoryBuilder(story);
    
    // Act
    builder.withDescription();
    const result = builder.lines.join('\n');
    
    // Assert - Vérifier exactement ce qui est ajouté
    expect(result).toBe('## Description\n- [ ] Test description\n');
  });
  
  // Test unitaire pour UserStoryBuilder.withAcceptanceCriteria - cas des tableaux vides
  test('UserStoryBuilder.withAcceptanceCriteria handles empty arrays correctly', () => {
    // Arrange
    const story = {
      title: 'Empty Criteria Test',
      acceptance_criteria: []
    };
    const builder = new UserStoryBuilder(story);
    
    // Act
    builder.withAcceptanceCriteria();
    const result = builder.lines.join('\n');
    
    // Assert - Seulement l'en-tête, pas de cases à cocher
    expect(result).toBe('### Acceptance Criteria\n');
  });
  
  // Test unitaire pour UserStoryBuilder.withTasks - cas des tableaux vides
  test('UserStoryBuilder.withTasks handles empty arrays correctly', () => {
    // Arrange
    const story = {
      title: 'Empty Tasks Test',
      tasks: []
    };
    const builder = new UserStoryBuilder(story);
    
    // Act
    builder.withTasks();
    const result = builder.lines.join('\n');
    
    // Assert - Seulement l'en-tête, pas de cases à cocher
    expect(result).toBe('### Technical Tasks\n');
  });
});
