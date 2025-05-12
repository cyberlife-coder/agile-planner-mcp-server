#!/usr/bin/env node
/**
 * Script dédié à la génération d'une structure conforme à la RULE 3
 * Ce script garantit que les user stories sont bien placées dans leurs features respectives
 * et que tous les répertoires et fichiers attendus sont créés.
 * 
 * Usage: node generate-rule3-structure.js [--output-path=<path>]
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Importer les modules de génération
const markdownGenerator = require('../server/lib/markdown-generator');

// Importer les modules utilitaires
const { 
  verifyBaseStructure,
  verifyEpics,
  verifyIterations,
  displayResults
} = require('./verification-utils');

// Importer les données d'exemple
const {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PROJECT_DESCRIPTION,
  createExampleBacklog,
  createExampleFeature
} = require('./generate-example-data');

// Configuration
const DEFAULT_OUTPUT_DIR = process.env.AGILE_PLANNER_OUTPUT_ROOT || path.resolve(__dirname, '../output');

/**
 * Récupère les arguments de la ligne de commande
 * @returns {Object} Les arguments extraits
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    outputPath: DEFAULT_OUTPUT_DIR
  };

  // Extraire les paramètres
  args.forEach(arg => {
    if (arg.startsWith('--output-path=')) {
      options.outputPath = arg.substring('--output-path='.length);
    }
  });

  return options;
}

/**
 * Crée la structure de base conforme à la RULE 3
 * @param {string} outputDir - Répertoire de sortie
 */
async function createBaseStructure(outputDir) {
  console.log(chalk.blue(`📂 Création de la structure de base RULE 3 dans: ${outputDir}`));
  
  // Créer le répertoire racine du backlog
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
 * Génère un exemple de backlog statique et le matérialise en fichiers markdown
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} Résultat de la génération
 */
async function generateExampleBacklog(outputDir) {
  console.log(chalk.blue(`🤜 Génération d'un backlog d'exemple statique...`));
  
  // Obtenir le backlog d'exemple à partir du module séparé
  const exampleBacklog = createExampleBacklog();
  
  try {
    // Matérialiser le backlog en fichiers markdown
    const markdownResult = await markdownGenerator.generateMarkdownFromBacklog(
      exampleBacklog,
      outputDir
    );
    
    if (!markdownResult || !markdownResult.success) {
      const errorMessage = markdownResult?.error?.message ?? 'Erreur inconnue';
      console.error(chalk.red(`❌ Échec de la génération des fichiers markdown: ${errorMessage}`));
      throw new Error('Échec de la génération des fichiers markdown');
    }
    
    console.log(chalk.green(`✅ Fichiers markdown générés avec succès`));
    return {
      success: true,
      backlogData: exampleBacklog
    };
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown: ${error.message}`));
    throw error;
  }
}

/**
 * Génère un exemple de feature statique et le matérialise en fichiers markdown
 * @param {string} outputDir - Répertoire de sortie
 * @returns {Promise<Object>} Résultat de la génération
 */
async function generateExampleFeature(outputDir) {
  console.log(chalk.blue(`🤜 Génération d'une feature d'exemple statique...`));
  
  // Obtenir le feature d'exemple à partir du module séparé
  const featureData = createExampleFeature();
  
  try {
    // Matérialiser la feature en fichiers markdown
    const markdownResult = await markdownGenerator.generateMarkdownFromBacklog(
      featureData,
      outputDir
    );
    
    if (!markdownResult || !markdownResult.success) {
      const errorMessage = markdownResult?.error?.message ?? 'Erreur inconnue';
      console.error(chalk.red(`❌ Échec de la génération des fichiers markdown pour la feature: ${errorMessage}`));
      throw new Error('Échec de la génération des fichiers markdown pour la feature');
    }
    
    console.log(chalk.green(`✅ Fichiers markdown générés avec succès pour la feature`));
    return { success: true };
    
  } catch (error) {
    console.error(chalk.red(`❌ Erreur lors de la génération des fichiers markdown pour la feature: ${error.message}`));
    throw error;
  }
}

/**
 * Vérifie que la structure générée est conforme à la RULE 3
 * @param {string} backlogDir - Répertoire du backlog
 * @param {Object} backlogData - Données du backlog généré
 * @returns {Object} Résultat de la vérification
 */
function verifyRule3Compliance(backlogDir, backlogData) {
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
  const { epicsDir, mvpDir, iterationsDir } = verifyBaseStructure(backlogDir, results);
  
  // 2. Vérifier les epics
  verifyEpics(epicsDir, results);
  
  // 3. Vérifier le MVP
  verifyMvp(mvpDir, results);
  
  // 4. Vérifier les itérations
  verifyIterations(iterationsDir, results);
  
  // 5. Afficher les résultats
  displayResults(results);
  
  return results;
}

/**
 * Vérifie les données du MVP
 * @param {string} mvpDir - Chemin du répertoire MVP
 * @param {Object} results - Objet résultats à remplir
 */
function verifyMvp(mvpDir, results) {
  try {
    const mvpFile = path.join(mvpDir, 'mvp.md');
    if (fs.existsSync(mvpFile)) {
      results.stats.files++;
    }
  } catch (err) {
    results.warnings.push(`Erreur lors de la vérification du MVP: ${err.message}`);
  }
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
    
    // Générer et matérialiser un backlog exemple statique
    const backlogGeneration = await generateExampleBacklog(options.outputPath);
    
    // Générer et matérialiser une feature exemple statique
    await generateExampleFeature(options.outputPath);
    
    // Vérifier la conformité à la RULE 3
    const verificationResults = verifyRule3Compliance(
      backlogDir,
      backlogGeneration.backlogData
    );
    
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
