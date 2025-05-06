/**
 * Tests pour la structure hiérarchique du backlog
 * Teste la nouvelle organisation: epic > feature > user-story
 */
const fs = require('fs-extra');
const path = require('path');
const sinon = require('sinon');
const { generateMarkdownFilesFromResult } = require('../server/lib/markdown-generator');

// Charge le backlog échantillon pour les tests
const sampleBacklog = {
  "projectName": "Test Project",
  "description": "Description du projet de test",
  "epics": [
    {
      "name": "Test Epic",
      "description": "Description de l'epic de test",
      "features": [
        {
          "title": "Test Feature",
          "description": "Description de la feature de test",
          "userStories": [
            {
              "id": "US001",
              "title": "Test User Story",
              "description": "Description de l'user story de test",
              "acceptance_criteria": ["Critère 1", "Critère 2"],
              "tasks": ["Tâche 1", "Tâche 2"],
              "priority": "HIGH"
            }
          ]
        }
      ]
    }
  ],
  "mvp": [
    {
      "id": "US001",
      "title": "Test User Story",
      "description": "Description de l'user story de test",
      "acceptance_criteria": ["Critère 1", "Critère 2"],
      "tasks": ["Tâche 1", "Tâche 2"],
      "priority": "HIGH"
    }
  ],
  "iterations": [
    {
      "name": "Iteration 1",
      "goal": "Goal de l'itération 1",
      "stories": [
        {
          "id": "US001",
          "title": "Test User Story",
          "description": "Description de l'user story de test",
          "acceptance_criteria": ["Critère 1", "Critère 2"],
          "tasks": ["Tâche 1", "Tâche 2"],
          "priority": "HIGH"
        }
      ]
    }
  ]
};

describe('Hierarchical Structure Generator', () => {
  // Variables partagées
  let sandbox;
  let outputPath;
  
  beforeEach(() => {
    // Créer un sandbox sinon isolé pour chaque test
    sandbox = sinon.createSandbox();
    
    // Mock fs.ensureDir pour éviter la création réelle de dossiers
    sandbox.stub(fs, 'ensureDir').resolves();
    
    // Mock fs.writeFile pour éviter la création réelle de fichiers
    sandbox.stub(fs, 'writeFile').resolves();
    
    // Répertoire de sortie fictif pour les tests
    outputPath = '/test/output';
  });
  
  afterEach(() => {
    // Nettoyer le sandbox après chaque test
    sandbox.restore();
  });
  
  test('Création de la structure hiérarchique de base', async () => {
    // Générer les fichiers à partir du backlog de test
    await generateMarkdownFilesFromResult(sampleBacklog, outputPath);
    
    // Vérifier que les répertoires de base sont créés
    const baseDir = path.join(outputPath, '.agile-planner-backlog');
    expect(fs.ensureDir.calledWith(baseDir)).toBe(true);
    expect(fs.ensureDir.calledWith(path.join(baseDir, 'epics'))).toBe(true);
    expect(fs.ensureDir.calledWith(path.join(baseDir, 'planning'))).toBe(true);
    expect(fs.ensureDir.calledWith(path.join(baseDir, 'planning', 'mvp'))).toBe(true);
    expect(fs.ensureDir.calledWith(path.join(baseDir, 'planning', 'iterations'))).toBe(true);
  });
  
  test('Création des épics avec leurs features', async () => {
    // Générer les fichiers à partir du backlog de test
    await generateMarkdownFilesFromResult(sampleBacklog, outputPath);
    
    // Vérifier la création des répertoires épics et features
    const baseDir = path.join(outputPath, '.agile-planner-backlog');
    const epicSlug = 'test-epic';
    const featureSlug = 'test-feature';
    
    // Vérifier la création du répertoire de l'épic
    expect(fs.ensureDir.calledWith(
      path.join(baseDir, 'epics', epicSlug)
    )).toBe(true);
    
    // Vérifier la création du répertoire des features de l'épic
    expect(fs.ensureDir.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'features')
    )).toBe(true);
    
    // Vérifier la création du répertoire de la feature
    expect(fs.ensureDir.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'features', featureSlug)
    )).toBe(true);
    
    // Vérifier la création du répertoire des user stories de la feature
    expect(fs.ensureDir.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'features', featureSlug, 'user-stories')
    )).toBe(true);
  });
  
  test('Création des fichiers markdown pour les épics, features et user stories', async () => {
    // Générer les fichiers à partir du backlog de test
    await generateMarkdownFilesFromResult(sampleBacklog, outputPath);
    
    const baseDir = path.join(outputPath, '.agile-planner-backlog');
    const epicSlug = 'test-epic';
    const featureSlug = 'test-feature';
    const storySlug = 'us001-test-user-story';
    
    // Vérifier la création du fichier markdown de l'épic
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'epic.md'),
      sinon.match.string
    )).toBe(true);
    
    // Vérifier la création du fichier markdown de la feature
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'features', featureSlug, 'feature.md'),
      sinon.match.string
    )).toBe(true);
    
    // Vérifier la création du fichier markdown de l'user story
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'epics', epicSlug, 'features', featureSlug, 'user-stories', `${storySlug}.md`),
      sinon.match.string
    )).toBe(true);
  });
  
  test('Création des liens dans la planification', async () => {
    // Générer les fichiers à partir du backlog de test
    await generateMarkdownFilesFromResult(sampleBacklog, outputPath);
    
    const baseDir = path.join(outputPath, '.agile-planner-backlog');
    
    // Vérifier la création du fichier MVP
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'planning', 'mvp', 'mvp.md'),
      sinon.match.string
    )).toBe(true);
    
    // Vérifier la création du fichier d'itération
    const iterationSlug = 'iteration-1';
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'planning', 'iterations', iterationSlug, 'iteration.md'),
      sinon.match.string
    )).toBe(true);
    
    // Vérifier la création du fichier backlog.json
    expect(fs.writeFile.calledWith(
      path.join(baseDir, 'backlog.json'),
      sinon.match.string
    )).toBe(true);
  });
});
