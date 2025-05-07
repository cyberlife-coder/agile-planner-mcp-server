/**
 * Tests isolés pour les fonctionnalités de formatage markdown
 * Ces tests sont plus simples et plus rapides à exécuter que les tests complets
 */
const fs = require('fs-extra');
const path = require('path');

// Charge le même backlog que dans les tests originaux
const sampleBacklog = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'sample-backlog.json'), 'utf8')
);

// Import des fonctions de formatage
const { 
  formatUserStory, 
  formatFeature, 
  formatEpic,
  formatMVP,
  formatIteration 
} = require('../../server/lib/markdown-generator');

describe('Markdown Formatting', () => {
  describe('User Story Formatting', () => {
    test('Formats a user story correctly in Markdown with checkboxes', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      // Verify formatting contains expected elements
      expect(formatted).toContain(`# User Story ${story.id}: ${story.title}`);
      expect(formatted).toContain(`- [ ] ${story.description}`);
      expect(formatted).toContain(`### Acceptance Criteria`);
      expect(formatted).toContain(`### Technical Tasks`);
      
      // Verify all acceptance criteria are included with checkboxes
      story.acceptance_criteria.forEach(criteria => {
        expect(formatted).toContain(`- [ ] ${criteria}`);
      });
      
      // Verify all tasks are included with checkboxes
      story.tasks.forEach(task => {
        expect(formatted).toContain(`- [ ] ${task}`);
      });
      
      // Verify priority is included
      if (story.priority) {
        expect(formatted).toContain(`**Priority:** ${story.priority}`);
      }
      
      // Verify dependencies if they exist
      if (story.dependencies && story.dependencies.length > 0) {
        expect(formatted).toContain(`**Dependencies:** ${story.dependencies.join(', ')}`);
      }
    });

    test('Includes enhanced AI instructions for status updates', () => {
      const story = sampleBacklog.mvp[0];
      const formatted = formatUserStory(story);
      
      expect(formatted).toContain('## 🤖 User Story Instructions for AI');
      expect(formatted).toContain('Mettez à jour le statut des tâches en remplaçant [ ] par [x]');
      expect(formatted).toContain('Exemple de mise à jour:');
    });
  });
});
