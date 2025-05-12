/**
 * Utilitaires pour la vérification de conformité à la RULE 3
 * @module verification-utils
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Vérifie la structure de base d'un backlog
 * @param {string} backlogDir - Chemin du répertoire backlog
 * @param {Object} results - Objet résultats à remplir
 */
function verifyBaseStructure(backlogDir, results) {
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
  
  return {
    epicsDir,
    planningDir,
    mvpDir,
    iterationsDir
  };
}

/**
 * Vérifie les epics et leur contenu
 * @param {string} epicsDir - Chemin du répertoire des epics
 * @param {Object} results - Objet résultats à remplir
 */
function verifyEpics(epicsDir, results) {
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
      
      verifyFeaturesInEpic(epicPath, epicDir, results);
    }
  } catch (err) {
    results.valid = false;
    results.errors.push(`Erreur lors de la vérification des epics: ${err.message}`);
  }
}

/**
 * Vérifie les features d'un epic
 * @param {string} epicPath - Chemin de l'epic
 * @param {string} epicDir - Nom du répertoire de l'epic
 * @param {Object} results - Objet résultats à remplir
 */
function verifyFeaturesInEpic(epicPath, epicDir, results) {
  const featuresDir = path.join(epicPath, 'features');
  if (!fs.existsSync(featuresDir)) {
    results.warnings.push(`Répertoire features/ manquant dans epic ${epicDir}/`);
    return;
  }
  
  const featureDirs = fs.readdirSync(featuresDir).filter(dir => 
    fs.statSync(path.join(featuresDir, dir)).isDirectory()
  );
  
  results.stats.featureCount += featureDirs.length;
  
  // Vérifier chaque feature
  for (const featureDir of featureDirs) {
    verifyFeature(featuresDir, featureDir, epicDir, results);
  }
}

/**
 * Vérifie une feature et ses user stories
 * @param {string} featuresDir - Chemin du répertoire des features
 * @param {string} featureDir - Nom du répertoire de la feature
 * @param {string} epicDir - Nom du répertoire de l'epic parent
 * @param {Object} results - Objet résultats à remplir
 */
function verifyFeature(featuresDir, featureDir, epicDir, results) {
  const featurePath = path.join(featuresDir, featureDir);
  const featureFile = path.join(featurePath, 'feature.md');
  
  if (!fs.existsSync(featureFile)) {
    results.warnings.push(`Fichier feature.md manquant dans ${epicDir}/features/${featureDir}/`);
  } else {
    results.stats.files++;
  }
  
  verifyUserStories(featurePath, featureDir, epicDir, results);
}

/**
 * Vérifie les user stories d'une feature
 * @param {string} featurePath - Chemin de la feature
 * @param {string} featureDir - Nom du répertoire de la feature
 * @param {string} epicDir - Nom du répertoire de l'epic parent
 * @param {Object} results - Objet résultats à remplir
 */
function verifyUserStories(featurePath, featureDir, epicDir, results) {
  const storiesDir = path.join(featurePath, 'user-stories');
  if (!fs.existsSync(storiesDir)) {
    results.warnings.push(`Répertoire user-stories/ manquant dans feature ${epicDir}/features/${featureDir}/`);
    return;
  }
  
  const storyFiles = fs.readdirSync(storiesDir).filter(file => 
    file.endsWith('.md')
  );
  
  results.stats.storyCount += storyFiles.length;
  results.stats.files += storyFiles.length;
}

/**
 * Vérifie les itérations du backlog
 * @param {string} iterationsDir - Chemin du répertoire des itérations
 * @param {Object} results - Objet résultats à remplir
 */
function verifyIterations(iterationsDir, results) {
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
}

/**
 * Affiche les résultats de la vérification
 * @param {Object} results - Résultats de la vérification
 */
function displayResults(results) {
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
}

module.exports = {
  verifyBaseStructure,
  verifyEpics,
  verifyFeaturesInEpic,
  verifyFeature,
  verifyUserStories,
  verifyIterations,
  displayResults
};
