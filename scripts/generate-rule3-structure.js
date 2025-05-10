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
const backlogGenerator = require('../server/lib/backlog-generator');
const markdownGenerator = require('../server/lib/markdown-generator');
const apiClient = require('../server/lib/api-client');

// Configuration
const DEFAULT_OUTPUT_DIR = process.env.AGILE_PLANNER_OUTPUT_ROOT || path.resolve(__dirname, '../output');
const DEFAULT_PROJECT_NAME = 'RULE3 Demo Project';
const DEFAULT_PROJECT_DESCRIPTION = 'Projet de démonstration pour valider la conformité à la RULE 3 - Structure hiérarchique Epics > Features > User Stories';

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
 */
async function generateExampleBacklog(outputDir) {
  console.log(chalk.blue(`🤜 Génération d'un backlog d'exemple statique...`));
  
  // Créer un backlog d'exemple statique
  const exampleBacklog = {
    project: {
      title: DEFAULT_PROJECT_NAME,
      description: DEFAULT_PROJECT_DESCRIPTION
    },
    epics: [
      {
        id: 'user-management',
        title: 'Gestion des utilisateurs',
        description: 'Fonctionnalités de gestion des utilisateurs et authentification',
        features: [
          {
            id: 'user-authentication',
            title: 'Authentification utilisateur',
            description: 'Système d\'authentification sécurisé avec login/password et oauth',
            businessValue: 'Sécurité et contrôle d\'accès',
            stories: [
              {
                id: 'user-login',
                title: 'Connexion utilisateur',
                description: 'En tant qu\'utilisateur, je veux pouvoir me connecter avec mon email et mot de passe',
                acceptanceCriteria: [
                  'Formulaire de connexion avec validation',
                  'Gestion des erreurs d\'authentification',
                  'Protection contre les attaques par force brute'
                ],
                tasks: [
                  { description: 'Créer le composant de formulaire', estimate: 2 },
                  { description: 'Implémenter le service d\'authentification', estimate: 3 },
                  { description: 'Développer la validation côté client', estimate: 2 }
                ],
                status: 'A faire',
                priority: 'Haute'
              },
              {
                id: 'user-logout',
                title: 'Déconnexion utilisateur',
                description: 'En tant qu\'utilisateur, je veux pouvoir me déconnecter de façon sécurisée',
                acceptanceCriteria: [
                  'Bouton de déconnexion accessible depuis le menu principal',
                  'Suppression du jeton d\'authentification',
                  'Redirection vers la page d\'accueil après déconnexion'
                ],
                tasks: [
                  { description: 'Implémenter le service de déconnexion', estimate: 1 },
                  { description: 'Nettoyer le stockage local', estimate: 1 }
                ],
                status: 'A faire',
                priority: 'Moyenne'
              }
            ]
          }
        ]
      },
      {
        id: 'task-management',
        title: 'Gestion des tâches',
        description: 'Fonctionnalités de gestion des tâches et listes',
        features: [
          {
            id: 'task-filtering',
            title: 'Filtrage des tâches',
            description: 'Filtrage avancé des tâches par statut, priorité, date et assignation',
            businessValue: 'Productivité et gestion efficace',
            stories: [
              {
                id: 'filter-by-priority',
                title: 'Filtrer par priorité',
                description: 'En tant qu\'utilisateur, je veux filtrer mes tâches par niveau de priorité',
                acceptanceCriteria: [
                  'Interface permet de sélectionner une priorité (haute, moyenne, basse)',
                  'Liste mise à jour instantanément',
                  'Possibilité de réinitialiser le filtre'
                ],
                tasks: [
                  { description: 'Créer le composant de filtrage UI', estimate: 2 },
                  { description: 'Implémenter la logique de filtrage', estimate: 3 }
                ],
                status: 'A faire',
                priority: 'Haute'
              }
            ]
          }
        ]
      }
    ],
    mvp: [
      { id: 'user-login', title: 'Connexion utilisateur' },
      { id: 'user-logout', title: 'Déconnexion utilisateur' },
      { id: 'filter-by-priority', title: 'Filtrer par priorité' }
    ],
    iterations: [
      {
        id: 'sprint-1',
        name: 'Sprint 1',
        startDate: '2025-05-15',
        endDate: '2025-05-29',
        stories: [
          { id: 'user-login', title: 'Connexion utilisateur' },
          { id: 'user-logout', title: 'Déconnexion utilisateur' }
        ]
      },
      {
        id: 'sprint-2',
        name: 'Sprint 2',
        startDate: '2025-05-30',
        endDate: '2025-06-13',
        stories: [
          { id: 'filter-by-priority', title: 'Filtrer par priorité' }
        ]
      }
    ]
  };
  
  console.log(chalk.green(`✅ Backlog d'exemple statique créé avec succès`));
  
  // Générer les fichiers markdown
  console.log(chalk.blue(`📄 Génération des fichiers markdown...`));
  const markdownResult = await markdownGenerator.generateMarkdownFilesFromResult(
    exampleBacklog,
    outputDir
  );
  
  if (!markdownResult || !markdownResult.success) {
    console.error(chalk.red(`❌ Échec de la génération des fichiers markdown: ${markdownResult?.error?.message || 'Erreur inconnue'}`));
    throw new Error('Échec de la génération des fichiers markdown');
  }
  
  console.log(chalk.green(`✅ Fichiers markdown générés avec succès`));
  return {
    backlogData: exampleBacklog,
    markdownResult
  };
}

/**
 * Génère un exemple de feature statique et le matérialise en fichiers markdown
 * @param {string} outputDir - Répertoire de sortie
 */
async function generateExampleFeature(outputDir) {
  console.log(chalk.blue(`🤜 Génération d'une feature d'exemple statique...`));
  
  // Créer une feature d'exemple statique
  const adaptedResult = {
    feature: {
      title: 'Filtrage avancé des tâches',
      description: 'Fonctionnalité de filtrage avancé des tâches dans notre application, permettant aux utilisateurs de filtrer par priorité, date, tags et assigné.',
      businessValue: 'Améliore la productivité des utilisateurs en leur permettant de trouver rapidement les tâches pertinentes'
    },
    epicName: 'Gestion des tâches avancée',
    userStories: [
      {
        title: 'Filtrer par date d\'échéance',
        description: 'En tant qu\'utilisateur, je veux pouvoir filtrer mes tâches par date d\'échéance afin de me concentrer sur les tâches urgentes',
        acceptanceCriteria: [
          'L\'interface propose un sélecteur de date pour filtrer',
          'Je peux sélectionner une plage de dates ou une date précise',
          'Les tâches sont triées par proximité de la date d\'échéance',
          'Je peux voir clairement quelles tâches sont en retard'
        ],
        tasks: [
          { description: 'Créer le composant de calendrier de sélection', estimate: 3 },
          { description: 'Implémenter la logique de filtrage par date', estimate: 2 },
          { description: 'Ajouter l\'indicateur visuel pour les tâches en retard', estimate: 1 }
        ],
        priority: 'Haute',
        points: 6
      },
      {
        title: 'Filtrer par tags',
        description: 'En tant qu\'utilisateur, je veux pouvoir filtrer mes tâches par tags associés pour organiser mon travail par thématiques',
        acceptanceCriteria: [
          'Je peux sélectionner un ou plusieurs tags pour filtrer',
          'L\'interface affiche clairement les tags actifs',
          'Je peux rapidement désactiver des filtres de tags',
          'Les tags sont regroupés par catégories'
        ],
        tasks: [
          { description: 'Créer le système de gestion de tags', estimate: 3 },
          { description: 'Développer l\'interface de sélection de multiples tags', estimate: 2 },
          { description: 'Implémenter la logique de filtrage combiné', estimate: 2 }
        ],
        priority: 'Moyenne',
        points: 7
      },
      {
        title: 'Filtrer par personne assignée',
        description: 'En tant que chef d\'équipe, je veux filtrer les tâches par personne assignée pour suivre la charge de travail de chaque membre',
        acceptanceCriteria: [
          'Je peux voir la liste de tous les membres de l\'équipe',
          'Je peux sélectionner un ou plusieurs membres pour filtrer',
          'Je peux voir un résumé de la charge de travail par personne',
          'L\'interface indique clairement qui est assigné à chaque tâche'
        ],
        tasks: [
          { description: 'Créer la liste des membres avec avatars', estimate: 2 },
          { description: 'Implémenter le filtrage par assignation', estimate: 2 },
          { description: 'Développer le tableau récapitulatif de charge', estimate: 3 }
        ],
        priority: 'Moyenne',
        points: 7
      }
    ]
  };
  
  console.log(chalk.green(`✅ Feature d'exemple statique créée avec succès`));
  
  // Générer les fichiers markdown
  console.log(chalk.blue(`📄 Génération des fichiers markdown pour la feature...`));
  const markdownResult = await markdownGenerator.generateFeatureMarkdown(
    adaptedResult,
    outputDir
  );
  
  if (!markdownResult || !markdownResult.success) {
    console.error(chalk.red(`❌ Échec de la génération des fichiers markdown pour la feature: ${markdownResult?.error?.message || 'Erreur inconnue'}`));
    throw new Error('Échec de la génération des fichiers markdown pour la feature');
  }
  
  console.log(chalk.green(`✅ Fichiers markdown générés avec succès pour la feature`));
  
  return {
    featureData: adaptedResult,
    markdownResult
  };
}

/**
 * Vérifie que la structure générée est conforme à la RULE 3
 * @param {string} backlogDir - Répertoire du backlog
 * @param {Object} backlogData - Données du backlog généré
 * @returns {Object} Résultat de la vérification
 */
async function verifyRule3Compliance(backlogDir, backlogData) {
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
  
  // Vérifier la structure de base
  const epicsDir = path.join(backlogDir, 'epics');
  const planningDir = path.join(backlogDir, 'planning');
  const mvpDir = path.join(planningDir, 'mvp');
  const iterationsDir = path.join(planningDir, 'iterations');
  
  if (!fs.existsSync(epicsDir)) {
    results.valid = false;
    results.errors.push('Répertoire epics/ manquant');
  }
  
  if (!fs.existsSync(planningDir)) {
    results.valid = false;
    results.errors.push('Répertoire planning/ manquant');
  }
  
  if (!fs.existsSync(mvpDir)) {
    results.valid = false;
    results.errors.push('Répertoire planning/mvp/ manquant');
  }
  
  if (!fs.existsSync(iterationsDir)) {
    results.valid = false;
    results.errors.push('Répertoire planning/iterations/ manquant');
  }
  
  // Vérifier la présence de fichiers épics
  try {
    const epicDirs = fs.readdirSync(epicsDir).filter(dir => 
      fs.statSync(path.join(epicsDir, dir)).isDirectory()
    );
    
    results.stats.epicCount = epicDirs.length;
    
    // Vérifier chaque epic
    for (const epicDir of epicDirs) {
      const epicPath = path.join(epicsDir, epicDir);
      const epicFile = path.join(epicPath, 'epic.md');
      
      if (!fs.existsSync(epicFile)) {
        results.warnings.push(`Fichier epic.md manquant dans ${epicDir}/`);
      } else {
        results.stats.files++;
      }
      
      // Vérifier les features
      const featuresDir = path.join(epicPath, 'features');
      if (!fs.existsSync(featuresDir)) {
        results.warnings.push(`Répertoire features/ manquant dans epic ${epicDir}/`);
        continue;
      }
      
      const featureDirs = fs.readdirSync(featuresDir).filter(dir => 
        fs.statSync(path.join(featuresDir, dir)).isDirectory()
      );
      
      results.stats.featureCount += featureDirs.length;
      
      // Vérifier chaque feature
      for (const featureDir of featureDirs) {
        const featurePath = path.join(featuresDir, featureDir);
        const featureFile = path.join(featurePath, 'feature.md');
        
        if (!fs.existsSync(featureFile)) {
          results.warnings.push(`Fichier feature.md manquant dans ${epicDir}/features/${featureDir}/`);
        } else {
          results.stats.files++;
        }
        
        // Vérifier les user stories
        const storiesDir = path.join(featurePath, 'user-stories');
        if (!fs.existsSync(storiesDir)) {
          results.warnings.push(`Répertoire user-stories/ manquant dans feature ${epicDir}/features/${featureDir}/`);
          continue;
        }
        
        const storyFiles = fs.readdirSync(storiesDir).filter(file => 
          file.endsWith('.md')
        );
        
        results.stats.storyCount += storyFiles.length;
        results.stats.files += storyFiles.length;
      }
    }
  } catch (err) {
    results.valid = false;
    results.errors.push(`Erreur lors de la vérification des epics: ${err.message}`);
  }
  
  // Vérifier le MVP
  try {
    const mvpFile = path.join(mvpDir, 'mvp.md');
    if (fs.existsSync(mvpFile)) {
      results.stats.files++;
    }
  } catch (err) {
    results.warnings.push(`Erreur lors de la vérification du MVP: ${err.message}`);
  }
  
  // Vérifier les itérations
  try {
    const iterationDirs = fs.readdirSync(iterationsDir).filter(dir => 
      fs.statSync(path.join(iterationsDir, dir)).isDirectory()
    );
    
    for (const iterDir of iterationDirs) {
      const iterFile = path.join(iterationsDir, iterDir, 'iteration.md');
      if (fs.existsSync(iterFile)) {
        results.stats.files++;
      }
    }
  } catch (err) {
    results.warnings.push(`Erreur lors de la vérification des itérations: ${err.message}`);
  }
  
  // Afficher les résultats
  if (results.valid && results.warnings.length === 0) {
    console.log(chalk.green(`✅ Structure conforme à la RULE 3`));
  } else if (results.valid) {
    console.log(chalk.yellow(`⚠️ Structure conforme à la RULE 3 mais avec des avertissements`));
    results.warnings.forEach(warning => console.log(chalk.yellow(`  - ${warning}`)));
  } else {
    console.log(chalk.red(`❌ Structure NON conforme à la RULE 3`));
    results.errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
  }
  
  console.log(chalk.blue(`📊 Statistiques:`));
  console.log(chalk.blue(`  - ${results.stats.epicCount} epics`));
  console.log(chalk.blue(`  - ${results.stats.featureCount} features`));
  console.log(chalk.blue(`  - ${results.stats.storyCount} user stories`));
  console.log(chalk.blue(`  - ${results.stats.files} fichiers markdown au total`));
  
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
    
    // Générer et matérialiser un backlog exemple statique
    const backlogGeneration = await generateExampleBacklog(options.outputPath);
    
    // Générer et matérialiser une feature exemple statique
    await generateExampleFeature(options.outputPath);
    
    // Vérifier la conformité à la RULE 3
    const verificationResults = await verifyRule3Compliance(
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
