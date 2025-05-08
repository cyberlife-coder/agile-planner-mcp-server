// Utilitaire pour le formatage de markdown - version simplifiée pour les tests
const fs = require('fs-extra');
const path = require('path');

/**
 * Crée une chaîne de formatage simple pour une user story
 * @param {Object} userStory - User story à formater
 * @returns {string} Chaîne formatée en markdown
 */
exports.formatUserStory = function(userStory) {
  const id = userStory.id || '';
  const title = userStory.title || '';
  const description = userStory.description || '';
  
  let markdown = `# User Story ${id}: ${title}\n\n`;
  markdown += `## Description\n`;
  markdown += `- [ ] ${description}\n\n`;
  markdown += `### Acceptance Criteria\n`;
  
  if (userStory.acceptance_criteria) {
    for (const criteria of userStory.acceptance_criteria) {
      markdown += `- [ ] ${criteria}\n`;
    }
  }
  
  markdown += `\n### Technical Tasks\n`;
  
  if (userStory.tasks) {
    for (const task of userStory.tasks) {
      markdown += `- [ ] ${task}\n`;
    }
  }
  
  markdown += `\n`;
  
  if (userStory.priority) {
    markdown += `**Priority:** ${userStory.priority}\n`;
  }
  
  if (userStory.dependencies && userStory.dependencies.length > 0) {
    markdown += `\n**Dependencies:** ${userStory.dependencies.join(', ')}\n`;
  }
  
  markdown += `\n## 🤖 User Story Instructions for AI\n\n`;
  markdown += `Lorsque vous travaillez avec cette User Story:\n`;
  markdown += `- Mettez à jour le statut des tâches en remplaçant [ ] par [x] lorsqu'elles sont terminées\n`;
  markdown += `- Mettez à jour le statut des critères d'acceptation en remplaçant [ ] par [x] lorsqu'ils sont validés\n`;
  markdown += `- Vérifiez les liens vers la feature parent et les dépendances avant de commencer\n`;
  markdown += `- Ne modifiez PAS la structure existante du document\n\n`;
  markdown += `Exemple de mise à jour:\n`;
  markdown += `- [ ] Tâche à faire  →  - [x] Tâche terminée\n\n`;
  markdown += `---\n`;
  
  return markdown;
};

// Exporter directement pour faciliter les tests
module.exports.testFormat = function(testObj) {
  return exports.formatUserStory(testObj);
};
