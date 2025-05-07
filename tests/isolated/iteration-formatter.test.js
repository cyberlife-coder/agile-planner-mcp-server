/**
 * Tests TDD pour le module iteration-formatter - Approche RED-GREEN-REFACTOR
 * En commençant par les fonctions pures sans dépendances externes
 */
const path = require('path');
const chalk = require('chalk');
const iterationFormatter = require('../../server/lib/markdown/iteration-formatter');

// Mocks simples
jest.mock('chalk', () => ({
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text)
}));

jest.mock('../../server/lib/markdown/utils', () => ({
  markdownInstructions: {
    iterationFileInstructions: '<!-- Iteration Instructions for AI -->'
  },
  createSlug: jest.fn(text => text.toLowerCase().replace(/\s+/g, '-')),
  handleMarkdownError: jest.fn((msg, err) => {
    throw new Error(`${msg}: ${err.message}`);
  })
}));

describe('Iteration Formatter - Fonctions pures', () => {
  // Test de la fonction generateIterationHeader (fonction pure)
  describe('generateIterationHeader', () => {
    test('génère le header avec un objectif', () => {
      const result = iterationFormatter.generateIterationHeader('Sprint 1', 'Livrer le MVP');
      expect(result).toContain('# Iteration: Sprint 1');
      expect(result).toContain('<!-- Iteration Instructions for AI -->');
      expect(result).toContain('## Goal\n\nLivrer le MVP');
      expect(result).toContain('## User Stories');
    });

    test('génère le header avec un objectif vide', () => {
      const result = iterationFormatter.generateIterationHeader('Sprint 2', '');
      expect(result).toContain('# Iteration: Sprint 2');
      expect(result).toContain('## Goal\n\n');
      expect(result).toContain('## User Stories');
    });
  });

  // Test de la fonction processIterationStory (fonction pure)
  describe('processIterationStory', () => {
    test('story existante dans la map', () => {
      // Arrange
      const story = { id: 'US123', title: 'Story existante' };
      const userStoryMap = new Map([
        ['US123', { relativePath: './chemin/vers/story.md' }]
      ]);

      // Act
      const result = iterationFormatter.processIterationStory(story, userStoryMap);

      // Assert
      expect(result.content).toContain('[US123: Story existante](./chemin/vers/story.md)');
      expect(result.json.path).toBe('./chemin/vers/story.md');
    });

    test('story orpheline complète', () => {
      // Arrange
      const story = { 
        id: 'US456', 
        title: 'Story orpheline', 
        description: 'Description test', 
        priority: 'High' 
      };
      const userStoryMap = new Map();

      // Act
      const result = iterationFormatter.processIterationStory(story, userStoryMap);

      // Assert
      expect(result.content).toContain('US456: Story orpheline');
      expect(result.content).toContain('not defined in any epic/feature');
      expect(result.content).toContain('Description: Description test');
      expect(result.content).toContain('Priority: High');
      expect(result.json.orphaned).toBe(true);
    });

    test('story orpheline avec propriétés manquantes', () => {
      // Arrange
      const story = { title: 'Story minimale' };
      const userStoryMap = new Map();

      // Act
      const result = iterationFormatter.processIterationStory(story, userStoryMap);

      // Assert
      expect(result.content).toContain('Story minimale');
      expect(result.content).toContain('Description: ');
      expect(result.content).toContain('Priority: ');
      expect(result.json.orphaned).toBe(true);
    });
  });

  // Test de la fonction createIterationPaths (fonction pure)
  describe('createIterationPaths', () => {
    test('crée les chemins corrects', () => {
      // Pour ce test, nous utilisons des chemins littéraux prévisibles
      const backlogDir = '/backlog';
      const iterationSlug = 'sprint-1';
      
      const paths = iterationFormatter.createIterationPaths(backlogDir, iterationSlug);
      
      // Nous vérifions uniquement la structure, pas les chemins exacts
      expect(paths).toHaveProperty('directory');
      expect(paths).toHaveProperty('filePath');
      expect(paths).toHaveProperty('relativePath');
      
      // Les chemins doivent contenir les éléments de base
      expect(paths.directory).toContain('iterations');
      expect(paths.directory).toContain(iterationSlug);
      expect(paths.filePath).toContain('iteration.md');
    });
  });
});
