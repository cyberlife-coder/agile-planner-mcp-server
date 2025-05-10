/**
 * Ce script vérifie que la structure des répertoires du projet respecte la RULE 3 du projet
 * et crée les répertoires manquants si nécessaire.
 * 
 * RULE 3 – Structure des fichiers
 * .agile-planner-backlog/
 * ├── epics/
 * │   └── [epic-slug]/
 * │       ├── epic.md
 * │       └── features/
 * │           └── [feature-slug]/
 * │               ├── feature.md
 * │               └── user-stories/
 * │                   ├── [story-1].md
 * │                   └── [story-2].md
 * ├── planning/
 * │   ├── mvp/
 * │   │   └── mvp.md (liens vers les user stories réelles)
 * │   └── iterations/
 * │       └── [iteration-slug]/
 * │           └── iteration.md (liens vers les user stories réelles)
 * └── backlog.json
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Chemin racine du projet
const ROOT_DIR = path.resolve(__dirname, '..');
// Chemin vers le répertoire .agile-planner-backlog
const BACKLOG_DIR = path.join(ROOT_DIR, '.agile-planner-backlog');

/**
 * Structure attendue selon la RULE 3
 */
const EXPECTED_STRUCTURE = {
  'epics': {
    '_example-epic': {
      'epic.md': true,
      'features': {
        '_example-feature': {
          'feature.md': true,
          'user-stories': {
            '_example-story-1.md': true,
            '_example-story-2.md': true
          }
        }
      }
    }
  },
  'planning': {
    'mvp': {
      'mvp.md': true
    },
    'iterations': {
      '_example-iteration': {
        'iteration.md': true
      }
    }
  },
  'backlog.json': true
};

/**
 * Vérifie si un chemin existe
 * @param {string} dirPath - Chemin à vérifier
 * @returns {boolean} - true si le chemin existe, false sinon
 */
function checkPathExists(dirPath) {
  try {
    return fs.existsSync(dirPath);
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la vérification du chemin ${dirPath}: ${error.message}`));
    return false;
  }
}

/**
 * Crée un répertoire s'il n'existe pas
 * @param {string} dirPath - Chemin du répertoire à créer
 */
function createDirIfNotExists(dirPath) {
  if (!checkPathExists(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(chalk.green(`✓ Créé: ${dirPath}`));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la création du répertoire ${dirPath}: ${error.message}`));
    }
  }
}

/**
 * Crée un fichier avec du contenu s'il n'existe pas
 * @param {string} filePath - Chemin du fichier à créer
 * @param {string} content - Contenu à écrire dans le fichier
 */
function createFileIfNotExists(filePath, content) {
  if (!checkPathExists(filePath)) {
    try {
      fs.writeFileSync(filePath, content);
      console.log(chalk.green(`✓ Créé: ${filePath}`));
    } catch (error) {
      console.error(chalk.red(`Erreur lors de la création du fichier ${filePath}: ${error.message}`));
    }
  }
}

/**
 * Vérifie et crée la structure attendue
 * @param {object} structure - Structure attendue
 * @param {string} currentPath - Chemin courant
 */
function verifyAndCreateStructure(structure, currentPath) {
  for (const [key, value] of Object.entries(structure)) {
    const fullPath = path.join(currentPath, key);
    
    if (typeof value === 'object') {
      // C'est un répertoire avec une sous-structure
      createDirIfNotExists(fullPath);
      verifyAndCreateStructure(value, fullPath);
    } else {
      // C'est un fichier
      if (key === 'epic.md') {
        const epicName = path.basename(path.dirname(fullPath));
        createFileIfNotExists(fullPath, generateEpicContent(epicName));
      } else if (key === 'feature.md') {
        const featureName = path.basename(path.dirname(fullPath));
        const epicName = path.basename(path.dirname(path.dirname(path.dirname(fullPath))));
        createFileIfNotExists(fullPath, generateFeatureContent(featureName, epicName));
      } else if (key.endsWith('.md') && key.includes('story')) {
        const storyName = path.basename(key, '.md');
        const featureName = path.basename(path.dirname(path.dirname(fullPath)));
        const epicName = path.basename(path.dirname(path.dirname(path.dirname(path.dirname(fullPath)))));
        createFileIfNotExists(fullPath, generateUserStoryContent(storyName, featureName, epicName));
      } else if (key === 'mvp.md') {
        createFileIfNotExists(fullPath, generateMvpContent());
      } else if (key === 'iteration.md') {
        const iterationName = path.basename(path.dirname(fullPath));
        createFileIfNotExists(fullPath, generateIterationContent(iterationName));
      } else if (key === 'backlog.json') {
        createFileIfNotExists(fullPath, generateBacklogJsonContent());
      }
    }
  }
}

/**
 * Génère le contenu pour un fichier epic.md
 * @param {string} epicName - Nom de l'epic
 * @returns {string} - Contenu généré
 */
function generateEpicContent(epicName) {
  return `# Epic: ${epicName.replace('_example-', '')}

## Description
Ceci est un exemple d'epic qui représente un objectif métier majeur.

## Objectifs
- Objectif 1
- Objectif 2
- Objectif 3

## Features liées
- [Feature 1](./features/_example-feature/feature.md)

## Metadata
- **Priority**: High
- **Status**: In Progress
- **Owner**: Team A
`;
}

/**
 * Génère le contenu pour un fichier feature.md
 * @param {string} featureName - Nom de la feature
 * @param {string} epicName - Nom de l'epic parent
 * @returns {string} - Contenu généré
 */
function generateFeatureContent(featureName, epicName) {
  return `# Feature: ${featureName.replace('_example-', '')}

## Description
Cette feature fait partie de l'epic [${epicName.replace('_example-', '')}](../../${epicName}/epic.md).

## User Stories
- [Story 1](./user-stories/_example-story-1.md)
- [Story 2](./user-stories/_example-story-2.md)

## Critères d'acceptation
- Critère 1
- Critère 2

## Metadata
- **Priority**: Medium
- **Status**: To Do
- **Estimated complexity**: 3
`;
}

/**
 * Génère le contenu pour un fichier user story
 * @param {string} storyName - Nom de la user story
 * @param {string} featureName - Nom de la feature parente
 * @param {string} epicName - Nom de l'epic parent
 * @returns {string} - Contenu généré
 */
function generateUserStoryContent(storyName, featureName, epicName) {
  return `# User Story: ${storyName.replace('_example-', '')}

## En tant que
Utilisateur

## Je veux
Une fonctionnalité exemple

## Afin de
Atteindre un objectif spécifique

## Critères d'acceptation
- Critère 1
- Critère 2
- Critère 3

## Tâches techniques
- [ ] Tâche 1
- [ ] Tâche 2

## Metadata
- **Feature**: [${featureName.replace('_example-', '')}](../../feature.md)
- **Epic**: [${epicName.replace('_example-', '')}](../../../../${epicName}/epic.md)
- **Points**: 3
- **Priority**: Medium
- **Status**: To Do

## Instructions AI
Cette partie contient des instructions pour les assistants AI travaillant sur cette user story.
`;
}

/**
 * Génère le contenu pour un fichier mvp.md
 * @returns {string} - Contenu généré
 */
function generateMvpContent() {
  return `# MVP - Minimum Viable Product

## Objectifs
- Objectif 1
- Objectif 2

## User Stories incluses
- [Story 1](../../epics/_example-epic/features/_example-feature/user-stories/_example-story-1.md)

## Critères de validation
- Critère 1
- Critère 2

## Métadonnées
- **Date cible**: Q2 2025
- **Statut**: Planifié
`;
}

/**
 * Génère le contenu pour un fichier iteration.md
 * @param {string} iterationName - Nom de l'itération
 * @returns {string} - Contenu généré
 */
function generateIterationContent(iterationName) {
  return `# Iteration: ${iterationName.replace('_example-', '')}

## Dates
- **Début**: 2025-05-01
- **Fin**: 2025-05-15

## User Stories planifiées
- [Story 1](../../epics/_example-epic/features/_example-feature/user-stories/_example-story-1.md)

## Objectifs
- Objectif 1
- Objectif 2

## Métriques
- Capacité: 30 points
- Engagement: 25 points
`;
}

/**
 * Génère le contenu pour le fichier backlog.json
 * @returns {string} - Contenu JSON généré
 */
function generateBacklogJsonContent() {
  return JSON.stringify({
    "epics": [
      {
        "id": "example-epic",
        "title": "Example Epic",
        "description": "This is an example epic",
        "features": [
          {
            "id": "example-feature",
            "title": "Example Feature",
            "description": "This is an example feature",
            "userStories": [
              {
                "id": "example-story-1",
                "title": "Example Story 1",
                "asA": "User",
                "iWant": "An example feature",
                "soThat": "I can achieve a specific goal",
                "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
              },
              {
                "id": "example-story-2",
                "title": "Example Story 2",
                "asA": "Admin",
                "iWant": "Another example feature",
                "soThat": "I can manage the system",
                "acceptanceCriteria": ["Criterion 1", "Criterion 2"]
              }
            ]
          }
        ]
      }
    ],
    "planning": {
      "mvp": {
        "title": "Minimum Viable Product",
        "userStoryIds": ["example-story-1"]
      },
      "iterations": [
        {
          "id": "example-iteration",
          "title": "Sprint 1",
          "startDate": "2025-05-01",
          "endDate": "2025-05-15",
          "userStoryIds": ["example-story-1"]
        }
      ]
    }
  }, null, 2);
}

/**
 * Point d'entrée principal du script
 */
function main() {
  console.log(chalk.blue('=== Vérification de la structure RULE 3 ==='));
  
  // Vérifier si le répertoire racine .agile-planner-backlog existe
  if (!checkPathExists(BACKLOG_DIR)) {
    console.log(chalk.yellow(`Le répertoire ${BACKLOG_DIR} n'existe pas. Création...`));
    createDirIfNotExists(BACKLOG_DIR);
  } else {
    console.log(chalk.green(`✓ Le répertoire ${BACKLOG_DIR} existe.`));
  }
  
  // Vérifier et créer la structure complète
  console.log(chalk.blue('Vérification et création de la structure complète...'));
  verifyAndCreateStructure(EXPECTED_STRUCTURE, BACKLOG_DIR);
  
  console.log(chalk.green('=== Vérification terminée ==='));
  console.log(chalk.green('La structure du projet est maintenant conforme à la RULE 3.'));
}

// Exécution du script
main();
