
const { formatUserStory } = require('../server/lib/markdown-generator');
const fs = require('fs-extra');
const path = require('path');

// Fonction corrigée
function fixedFormatUserStory(userStory) {
  // Extraire les valeurs
  const id = userStory.id || '';
  const title = userStory.title || '';
  const description = userStory.description || '';
  const criteria = userStory.acceptance_criteria || [];
  const tasks = userStory.tasks || [];
  const priority = userStory.priority || '';
  const dependencies = userStory.dependencies || [];
  
  // Construction ligne par ligne pour éviter les problèmes de template literals
  let text = '# User Story ' + id + ': ' + title + '\n\n';
  text += '## Description\n';
  text += '- [ ] ' + description + '\n\n';
  
  if (criteria.length > 0) {
    text += '### Acceptance Criteria\n';
    for (let i = 0; i < criteria.length; i++) {
      text += '- [ ] ' + criteria[i] + '\n';
    }
    text += '\n';
  }
  
  if (tasks.length > 0) {
    text += '### Technical Tasks\n';
    for (let i = 0; i < tasks.length; i++) {
      text += '- [ ] ' + tasks[i] + '\n';
    }
    text += '\n';
  }
  
  if (priority) {
    text += '**Priority:** ' + priority + '\n';
  }
  
  if (dependencies && dependencies.length > 0) {
    text += '\n**Dependencies:** ' + dependencies.join(', ') + '\n';
  }
  
  return text;
}

// Exporter la fonction corrigée
module.exports = { fixedFormatUserStory };
