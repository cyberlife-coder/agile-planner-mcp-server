/**
 * Utilitaires pour la création de structures conformes à RULE 3
 * @module rule3-utils
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Crée le contenu markdown pour un fichier epic
 * @param {Object} epic - Données de l'epic
 * @returns {string} - Contenu markdown
 */
function createEpicMarkdown(epic) {
  return `# Epic: ${epic.title}

## Description
${epic.description}

## Objectifs
- Objectif principal lié à ${epic.title}

## Critères d'acceptation
- [ ] Compléter toutes les fonctionnalités de l'epic

## Features associées
${epic.features.map(f => `- [${f.title}](./features/${f.id}/feature.md)`).join('\n')}

## Statut
- [ ] Non démarré
- [x] En cours
- [ ] Terminé

---
*Date de création: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Crée le contenu markdown pour un fichier feature
 * @param {Object} feature - Données de la feature
 * @param {Object} epic - Données de l'epic parent
 * @returns {string} - Contenu markdown
 */
function createFeatureMarkdown(feature, epic) {
  return `# Feature: ${feature.title}

## Description
${feature.description}

## Valeur métier
${feature.businessValue}

## Epic parent
[${epic.title}](../../epic.md)

## User stories associées
${feature.stories.map(s => `- [${s.title}](./user-stories/${s.id}.md)`).join('\n')}

## Critères d'acceptation
- [ ] Toutes les user stories sont implémentées
- [ ] Tests d'acceptation passent à 100%

## Statut
- [ ] Non démarré
- [x] En cours
- [ ] Terminé

---
*Date de création: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Crée le contenu markdown pour une user story
 * @param {Object} story - Données de la story
 * @param {Object} feature - Données de la feature parente
 * @param {Object} epic - Données de l'epic parent
 * @returns {string} - Contenu markdown
 */
function createStoryMarkdown(story, feature, epic) {
  let markdown = `# User Story: ${story.title}

## Description
${story.description}

## Critères d'acceptation
${story.acceptanceCriteria ? story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n') : '- [ ] À définir'}

## Feature parent
[${feature.title}](../feature.md)

## Epic parent
[${epic.title}](../../../epic.md)

## Priorité
${story.priority || 'Moyenne'}

## Statut
${story.status || 'À faire'}

`;

  if (story.tasks && story.tasks.length > 0) {
    markdown += `\n## Tâches techniques
${story.tasks.map(t => `- [ ] ${t.description} (${t.estimate || '?'}h)`).join('\n')}
`;
  }

  markdown += `\n---
*Date de création: ${new Date().toISOString().split('T')[0]}*
`;

  return markdown;
}

/**
 * Crée le contenu markdown pour une itération
 * @param {Object} iteration - Données de l'itération
 * @returns {string} - Contenu markdown
 */
function createIterationMarkdown(iteration) {
  return `# Itération: ${iteration.name}

## Période
Du ${iteration.startDate} au ${iteration.endDate}

## User stories planifiées
${iteration.stories.map(s => `- ${s.title}`).join('\n')}

## Objectifs
- Compléter les fonctionnalités prioritaires de l'itération

## Statut
- [ ] Non démarré
- [x] En cours
- [ ] Terminé

---
*Date de création: ${new Date().toISOString().split('T')[0]}*
`;
}

/**
 * Génère le markdown pour les epics et features
 * @param {Object} epic - Données de l'epic
 * @param {string} backlogDir - Chemin du répertoire du backlog
 * @returns {Promise<void>}
 */
async function generateEpicFiles(epic, backlogDir) {
  // Créer le répertoire de l'epic
  const epicSlug = epic.id.toLowerCase().replace(/\s+/g, '-');
  const epicDir = path.join(backlogDir, 'epics', epicSlug);
  await fs.ensureDir(epicDir);
  
  // Créer le fichier epic.md
  const epicMarkdown = createEpicMarkdown(epic);
  await fs.writeFile(path.join(epicDir, 'epic.md'), epicMarkdown);
  
  // Créer le répertoire features
  const featuresDir = path.join(epicDir, 'features');
  await fs.ensureDir(featuresDir);
  
  // Générer les fichiers pour chaque feature
  for (const feature of epic.features) {
    await generateFeatureFiles(feature, epic, featuresDir);
  }
}

/**
 * Génère le markdown pour les features et user stories
 * @param {Object} feature - Données de la feature
 * @param {Object} epic - Données de l'epic parent
 * @param {string} featuresDir - Chemin du répertoire de features
 * @returns {Promise<void>}
 */
async function generateFeatureFiles(feature, epic, featuresDir) {
  // Créer le répertoire de la feature
  const featureSlug = feature.id.toLowerCase().replace(/\s+/g, '-');
  const featureDir = path.join(featuresDir, featureSlug);
  await fs.ensureDir(featureDir);
  
  // Créer le fichier feature.md
  const featureMarkdown = createFeatureMarkdown(feature, epic);
  await fs.writeFile(path.join(featureDir, 'feature.md'), featureMarkdown);
  
  // Créer le répertoire user-stories
  const storiesDir = path.join(featureDir, 'user-stories');
  await fs.ensureDir(storiesDir);
  
  // Générer les fichiers pour chaque user story
  for (const story of feature.stories) {
    const storyMarkdown = createStoryMarkdown(story, feature, epic);
    const storyFile = path.join(storiesDir, `${story.id}.md`);
    await fs.writeFile(storyFile, storyMarkdown);
  }
}

/**
 * Génère les fichiers markdown pour les itérations
 * @param {Array} iterations - Liste des itérations
 * @param {string} backlogDir - Chemin du répertoire du backlog
 * @returns {Promise<void>}
 */
async function generateIterationFiles(iterations, backlogDir) {
  const iterationsDir = path.join(backlogDir, 'planning', 'iterations');
  
  for (const iteration of iterations) {
    const iterationSlug = iteration.id.toLowerCase().replace(/\s+/g, '-');
    const iterationDir = path.join(iterationsDir, iterationSlug);
    await fs.ensureDir(iterationDir);
    
    const iterationMarkdown = createIterationMarkdown(iteration);
    await fs.writeFile(path.join(iterationDir, 'iteration.md'), iterationMarkdown);
  }
}

module.exports = {
  generateEpicFiles,
  generateFeatureFiles,
  generateIterationFiles,
  createEpicMarkdown,
  createFeatureMarkdown,
  createStoryMarkdown,
  createIterationMarkdown
};
