#!/usr/bin/env node
/**
 * Script simplifié pour créer directement une structure conforme à la RULE 3
 * sans dépendre de générateurs externes qui peuvent causer des erreurs.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { exampleData } = require('./example-data');
const { 
  generateEpicFiles, 
  generateIterationFiles 
} = require('./rule3-utils');
const {
  verifyBaseStructure,
  verifyEpics,
  verifyIterations,
  displayResults
} = require('./verification-utils');

// Configuration
const DEFAULT_OUTPUT_DIR = process.env.AGILE_PLANNER_OUTPUT_ROOT || path.resolve(__dirname, '../output');

/**
 * Récupère les arguments de la ligne de commande
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    outputPath: DEFAULT_OUTPUT_DIR
  };

  args.forEach(arg => {
    if (arg.startsWith('--output-path=')) {
      options.outputPath = arg.substring('--output-path='.length);
    }
  });

  return options;
}

/**
 * Crée la structure de base conforme à la RULE 3
 */
async function createBaseStructure(outputDir) {
  console.log(chalk.blue(`📂 Création de la structure de base RULE 3 dans: ${outputDir}`));
  
  const backlogDir = path.join(outputDir, '.agile-planner-backlog');
  
  // Créer les répertoires principaux selon RULE 3
  await fs.ensureDir(backlogDir);
  await fs.ensureDir(path.join(backlogDir, 'epics'));
  await fs.ensureDir(path.join(backlogDir, 'planning'));
  await fs.ensureDir(path.join(backlogDir, 'planning', 'mvp'));
  await fs.ensureDir(path.join(backlogDir, 'planning', 'iterations'));
  
  // Créer un fichier README expliquant la structure
  const readmeContent = `# Structure Backlog Agile Planner (RULE 3)

Cette structure est conforme à la RULE 3 du projet Agile Planner et contient:

\`\`\`
.agile-planner-backlog/
├── epics/                   # Dossier contenant tous les epics
│   └── [epic-slug]/         # Un dossier par epic
│       ├── epic.md          # Fichier markdown décrivant l'epic
│       └── features/        # Dossier contenant les features de cet epic
│           └── [feature-slug]/  # Un dossier par feature
│               ├── feature.md   # Fichier markdown décrivant la feature
│               └── user-stories/ # Dossier contenant les user stories de cette feature
│                   └── [story-slug].md # Un fichier markdown par user story
├── planning/               # Dossier contenant la planification
│   ├── mvp/                # Dossier contenant les éléments du MVP
│   │   └── mvp.md          # Fichier markdown décrivant le MVP
│   └── iterations/         # Dossier contenant les itérations
│       └── [iteration-name]/ # Un dossier par itération
│           └── iteration.md  # Fichier markdown décrivant l'itération
└── README.md               # Ce fichier explicatif
\`\`\`

Généré le: ${new Date().toISOString()}
`;

  await fs.writeFile(path.join(backlogDir, 'README.md'), readmeContent);
  console.log(chalk.green('✅ Structure de base créée avec succès'));
  
  return backlogDir;
}

/**
 * Crée un exemple de backlog directement avec des fichiers markdown
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<string>} - Chemin du backlog généré
 */
async function createExampleBacklog(outputDir) {
  console.log(chalk.blue(`🤜 Création d'un backlog d'exemple direct...`));
  
  const backlogDir = path.join(outputDir, '.agile-planner-backlog');
  
  try {
    // Générer les fichiers markdown pour chaque epic
    for (const epic of exampleData.epics) {
      await generateEpicFiles(epic, backlogDir);
    }
    
    // Générer les fichiers markdown pour les itérations
    await generateIterationFiles(exampleData.iterations, backlogDir);
    
    console.log(chalk.green('✅ Génération des fichiers markdown terminée'));
    return backlogDir;
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown: ${error.message}`));
    throw error;
  }
}

/**
 * Vérifie que la structure générée est conforme à la RULE 3
 * @param {string} backlogDir - Chemin du répertoire backlog
 * @returns {Object} - Résultats de la vérification
 */
function verifyRule3Compliance(backlogDir) {
  console.log(chalk.blue(`🔍 Vérification de la conformité à la RULE 3...`));
  
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {
      epicCount: 0,
      featureCount: 0,
      storyCount: 0,
      files: 0
    }
  };
  
  // 1. Vérifier la structure de base
  const { epicsDir, iterationsDir } = verifyBaseStructure(backlogDir, results);
  
  // 2. Vérifier les epics
  verifyEpics(epicsDir, results);
  
  // 3. Vérifier les itérations
  verifyIterations(iterationsDir, results);
  
  // 4. Afficher les résultats
  displayResults(results);
  
  return results;
}

/**
 * Fonction principale exécutant le script
 */
async function main() {
  console.log(chalk.green('🚀 Démarrage de la génération RULE 3'));
  
  // Récupérer les options
  const options = parseArgs();
  console.log(chalk.blue(`📂 Répertoire de sortie: ${options.outputPath}`));
  
  try {
    // Créer la structure de base
    const backlogDir = await createBaseStructure(options.outputPath);
    
    // Générer un backlog d'exemple avec des fichiers markdown
    await createExampleBacklog(options.outputPath);
    
    // Vérifier la conformité à la RULE 3
    const verificationResults = verifyRule3Compliance(backlogDir);
    
    if (verificationResults.valid) {
      console.log(chalk.green('🎉 Génération RULE 3 terminée avec succès'));
      process.exit(0);
    } else {
      console.error(chalk.red('⚠️ La structure générée n\'est pas entièrement conforme à la RULE 3'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécuter le script
main();
