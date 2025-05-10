#!/usr/bin/env node
/**
 * Script simplifié pour créer directement une structure conforme à la RULE 3
 * sans dépendre de générateurs externes qui peuvent causer des erreurs.
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Configuration
const DEFAULT_OUTPUT_DIR = process.env.AGILE_PLANNER_OUTPUT_ROOT || path.resolve(__dirname, '../output');
const DEFAULT_PROJECT_NAME = 'RULE3 Demo Project';
const DEFAULT_PROJECT_DESCRIPTION = 'Projet de démonstration pour valider la conformité à la RULE 3';

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
 */
async function createExampleBacklog(outputDir) {
  console.log(chalk.blue(`🤜 Création d'un backlog d'exemple direct...`));
  
  const backlogDir = path.join(outputDir, '.agile-planner-backlog');
  
  // Définir les données d'exemple
  const exampleData = {
    epics: [
      {
        id: 'user-management',
        title: 'Gestion des utilisateurs',
        description: 'Fonctionnalités de gestion des utilisateurs et authentification',
        features: [
          {
            id: 'user-authentication',
            title: 'Authentification utilisateur',
            description: "Système d'authentification sécurisé avec login/password et oauth",
            businessValue: "Sécurité et contrôle d'accès",
            stories: [
              {
                id: 'user-login',
                title: 'Connexion utilisateur',
                description: "En tant qu'utilisateur, je veux pouvoir me connecter avec mon email et mot de passe",
                acceptanceCriteria: [
                  'Formulaire de connexion avec validation',
                  "Gestion des erreurs d'authentification",
                  'Protection contre les attaques par force brute'
                ],
                tasks: [
                  { description: 'Créer le composant de formulaire', estimate: 2 },
                  { description: "Implémenter le service d'authentification", estimate: 3 },
                  { description: 'Développer la validation côté client', estimate: 2 }
                ],
                status: 'A faire',
                priority: 'Haute'
              },
              {
                id: 'user-logout',
                title: 'Déconnexion utilisateur',
                description: "En tant qu'utilisateur, je veux pouvoir me déconnecter de façon sécurisée",
                acceptanceCriteria: [
                  'Bouton de déconnexion accessible depuis le menu principal',
                  "Suppression du jeton d'authentification",
                  "Redirection vers la page d'accueil après déconnexion"
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
                description: "En tant qu'utilisateur, je veux filtrer mes tâches par niveau de priorité",
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
  
  try {
    // Générer les fichiers markdown pour chaque epic
    for (const epic of exampleData.epics) {
      // Créer le répertoire de l'epic
      const epicSlug = epic.id.toLowerCase().replace(/\s+/g, '-');
      const epicDir = path.join(backlogDir, 'epics', epicSlug);
      await fs.ensureDir(epicDir);
      
      // Créer le fichier epic.md
      const epicMarkdown = `# Epic: ${epic.title}

## Description
${epic.description}

## Objectifs
- Objectif principal lié à ${epic.title}

## Critères d'acceptation
- [ ] Compléter toutes les fonctionnalités de l'epic

## Features associées
${epic.features.map(f => `- [${f.title}](./features/${f.id}/feature.md)`).join('\n')}

## Métadonnées
- **ID**: \`${epic.id}\`
- **Priorité**: Haute
- **Statut**: À faire
- **Date de création**: ${new Date().toISOString().split('T')[0]}
- **Dernière mise à jour**: ${new Date().toISOString().split('T')[0]}
`;
      
      await fs.writeFile(path.join(epicDir, 'epic.md'), epicMarkdown);
      
      // Générer les fichiers markdown pour chaque feature
      const featuresDir = path.join(epicDir, 'features');
      await fs.ensureDir(featuresDir);
      
      for (const feature of epic.features) {
        // Créer le répertoire de la feature
        const featureSlug = feature.id.toLowerCase().replace(/\s+/g, '-');
        const featureDir = path.join(featuresDir, featureSlug);
        await fs.ensureDir(featureDir);
        
        // Créer le fichier feature.md
        const featureMarkdown = `# Feature: ${feature.title}

## Description
${feature.description}

## Business Value
${feature.businessValue}

## User Stories associées
${feature.stories.map(s => `- [${s.title}](./user-stories/${s.id.toLowerCase().replace(/\s+/g, '-')}.md)`).join('\n')}

## Métadonnées
- **ID**: \`${feature.id}\`
- **Epic parent**: \`${epic.id}\`
- **Priorité**: Haute
- **Statut**: À faire
- **Date de création**: ${new Date().toISOString().split('T')[0]}
- **Dernière mise à jour**: ${new Date().toISOString().split('T')[0]}
`;
        
        await fs.writeFile(path.join(featureDir, 'feature.md'), featureMarkdown);
        
        // Générer les fichiers markdown pour chaque user story
        const storiesDir = path.join(featureDir, 'user-stories');
        await fs.ensureDir(storiesDir);
        
        for (const story of feature.stories) {
          // Créer le fichier user story
          const storySlug = story.id.toLowerCase().replace(/\s+/g, '-');
          const storyMarkdown = `# User Story: ${story.title}

## Description
${story.description}

## Critères d'acceptation
${story.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Tâches techniques
${story.tasks.map(t => `- [ ] ${t.description} (${t.estimate} points)`).join('\n')}

## Métadonnées
- **ID**: \`${story.id}\`
- **Feature parent**: \`${feature.id}\`
- **Priorité**: ${story.priority}
- **Points**: ${story.tasks.reduce((sum, t) => sum + t.estimate, 0)}
- **Statut**: ${story.status}
- **Date de création**: ${new Date().toISOString().split('T')[0]}
- **Dernière mise à jour**: ${new Date().toISOString().split('T')[0]}
`;
          
          await fs.writeFile(path.join(storiesDir, `${storySlug}.md`), storyMarkdown);
        }
      }
    }
    
    // Générer les fichiers markdown pour les itérations
    const iterationsDir = path.join(backlogDir, 'planning', 'iterations');
    await fs.ensureDir(iterationsDir);
    
    for (const iteration of exampleData.iterations) {
      const iterationSlug = iteration.id.toLowerCase().replace(/\s+/g, '-');
      const iterationDir = path.join(iterationsDir, iterationSlug);
      await fs.ensureDir(iterationDir);
      
      const iterationMarkdown = `# Itération: ${iteration.name}

## Objectifs
Objectifs pour ${iteration.name}

## Dates
- **Début**: ${iteration.startDate}
- **Fin**: ${iteration.endDate}

## User Stories
${iteration.stories.map(s => `- [ ] ${s.title}`).join('\n')}

## Métadonnées
- **ID**: \`${iteration.id}\`
- **Capacité**: 20 points
- **Points planifiés**: ${iteration.stories.length * 5}
- **Statut**: À venir
- **Date de création**: ${new Date().toISOString().split('T')[0]}
- **Dernière mise à jour**: ${new Date().toISOString().split('T')[0]}
`;
      
      await fs.writeFile(path.join(iterationDir, 'iteration.md'), iterationMarkdown);
    }
    
    // Générer le fichier backlog.json
    await fs.writeFile(
      path.join(backlogDir, 'backlog.json'),
      JSON.stringify({
        project: {
          title: DEFAULT_PROJECT_NAME,
          description: DEFAULT_PROJECT_DESCRIPTION
        },
        epics: exampleData.epics,
        iterations: exampleData.iterations
      }, null, 2)
    );
    
    console.log(chalk.green(`✅ Fichiers markdown générés avec succès`));
  } catch (err) {
    console.error(chalk.red(`❌ Échec de la génération des fichiers markdown: ${err.message}`));
    throw new Error('Échec de la génération des fichiers markdown');
  }
}

/**
 * Vérifie que la structure générée est conforme à la RULE 3
 */
async function verifyRule3Compliance(backlogDir) {
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
    
    // Générer un backlog d'exemple avec des fichiers markdown
    await createExampleBacklog(options.outputPath);
    
    // Vérifier la conformité à la RULE 3
    const verificationResults = await verifyRule3Compliance(backlogDir);
    
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
