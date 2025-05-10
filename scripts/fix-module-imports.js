/**
 * Script pour corriger les importations de modules dans les tests
 * En suivant les principes TDD Wave 8 (RULE 1)
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// Configuration des modules et leurs chemins directs
const MODULE_MAPPINGS = {
  // Modules façade → modules sources directs
  '../../../server/lib/markdown-generator': {
    formatUserStory: '../../../server/lib/markdown/story-formatter',
    formatEpic: '../../../server/lib/markdown/epic-formatter',
    formatFeature: '../../../server/lib/markdown/feature-formatter',
    formatIteration: '../../../server/lib/markdown/iteration-formatter',
    formatMVP: '../../../server/lib/markdown/mvp-formatter'
  },
  '../../../server/lib/utils/validators/validators-factory': {
    validate: '../../../server/lib/utils/validators/validators-factory',
    getValidator: '../../../server/lib/utils/validators/validators-factory',
    createValidator: '../../../server/lib/utils/validators/validators-factory'
  }
};

// Répertoire des tests
const TESTS_DIR = path.join(__dirname, '..', 'tests');

/**
 * Analyse le contenu d'un fichier test pour identifier les importations problématiques
 * @param {string} content - Contenu du fichier
 * @returns {Object} - Informations sur les importations détectées
 */
function analyzeImports(content) {
  const imports = {};
  
  // Rechercher les importations require
  const requireRegex = /const\s+\{([^}]+)\}\s+=\s+require\(['"]([^'"]+)['"]\)/g;
  let match;
  
  while ((match = requireRegex.exec(content)) !== null) {
    const symbols = match[1].split(',').map(s => s.trim());
    const modulePath = match[2];
    
    imports[match[0]] = {
      original: match[0],
      symbols,
      modulePath,
      startIndex: match.index,
      endIndex: match.index + match[0].length
    };
  }
  
  return imports;
}

/**
 * Vérifie si une importation doit être corrigée
 * @param {Object} importInfo - Information sur l'importation
 * @returns {boolean} - Vrai si l'importation doit être corrigée
 */
function shouldFixImport(importInfo) {
  return Object.keys(MODULE_MAPPINGS).includes(importInfo.modulePath);
}

/**
 * Génère un nouvel import direct
 * @param {Object} importInfo - Information sur l'importation
 * @returns {Object} - Nouvelles importations à utiliser
 */
function generateDirectImports(importInfo) {
  const moduleMapping = MODULE_MAPPINGS[importInfo.modulePath];
  const newImports = {};
  
  // Regrouper les symboles par module de destination
  importInfo.symbols.forEach(symbol => {
    const trimmedSymbol = symbol.trim();
    const targetModule = moduleMapping[trimmedSymbol] || importInfo.modulePath;
    
    if (!newImports[targetModule]) {
      newImports[targetModule] = [];
    }
    
    newImports[targetModule].push(trimmedSymbol);
  });
  
  // Générer les imports pour chaque module
  return Object.entries(newImports).map(([module, symbols]) => {
    return `const { ${symbols.join(', ')} } = require('${module}');`;
  }).join('\n');
}

/**
 * Corrige les importations dans un fichier
 * @param {string} filePath - Chemin du fichier à corriger
 * @returns {Promise<boolean>} - Vrai si des corrections ont été appliquées
 */
async function fixFileImports(filePath) {
  console.log(chalk.blue(`Analyse des importations dans ${filePath}`));
  
  try {
    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf8');
    
    // Analyser les importations
    const imports = analyzeImports(content);
    let newContent = content;
    let hasChanges = false;
    
    // Pour chaque importation
    for (const [originalImport, importInfo] of Object.entries(imports)) {
      // Vérifier si cette importation doit être corrigée
      if (shouldFixImport(importInfo)) {
        // Générer les nouvelles importations
        const directImports = generateDirectImports(importInfo);
        
        // Commentaire sur la correction
        const comment = '// Importation directe des modules sources (TDD Wave 8)';
        const replacement = `${comment}\n${directImports}`;
        
        // Remplacer l'importation dans le contenu
        newContent = newContent.replace(originalImport, replacement);
        hasChanges = true;
        
        console.log(chalk.green(`✓ Correction appliquée : ${originalImport} → import direct`));
      }
    }
    
    // Sauvegarder les changements si nécessaire
    if (hasChanges) {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(chalk.green(`✓ Fichier mis à jour : ${filePath}`));
      return true;
    } else {
      console.log(chalk.yellow(`⚠ Aucune correction nécessaire pour ${filePath}`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`✗ Erreur lors du traitement de ${filePath}`), error);
    return false;
  }
}

/**
 * Parcourt récursivement un répertoire pour corriger les importations
 * @param {string} directory - Répertoire à parcourir
 * @returns {Promise<number>} - Nombre de fichiers corrigés
 */
async function processDirectory(directory) {
  const items = await fs.readdir(directory);
  let totalFixed = 0;
  
  for (const item of items) {
    const itemPath = path.join(directory, item);
    const stats = await fs.stat(itemPath);
    
    if (stats.isDirectory()) {
      // C'est un répertoire, on le parcourt récursivement
      totalFixed += await processDirectory(itemPath);
    } else if (stats.isFile() && itemPath.endsWith('.test.js')) {
      // C'est un fichier de test, on le traite
      const fixed = await fixFileImports(itemPath);
      if (fixed) totalFixed++;
    }
  }
  
  return totalFixed;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Correction des importations de modules ==='));
  console.log(chalk.blue('Conforme au TDD Wave 8 - RULE 1'));
  console.log(chalk.blue('-------------------------------------------'));
  
  try {
    const unitTestsDir = path.join(TESTS_DIR, 'unit');
    console.log(chalk.blue(`Traitement des tests unitaires dans ${unitTestsDir}`));
    
    const totalFixed = await processDirectory(unitTestsDir);
    
    console.log(chalk.blue('-------------------------------------------'));
    console.log(chalk.green(`✓ Terminé! ${totalFixed} fichiers corrigés.`));
    
    if (totalFixed > 0) {
      console.log(chalk.yellow('⚠ N\'oubliez pas d\'exécuter les tests pour vérifier les corrections!'));
      console.log(chalk.yellow('  npm run test:unit'));
    } else {
      console.log(chalk.green('✓ Tous les imports semblent corrects!'));
    }
  } catch (error) {
    console.error(chalk.red('Erreur lors de l\'exécution du script:'), error);
    process.exit(1);
  }
}

// Exécution du script
main().catch(error => {
  console.error(chalk.red('Erreur globale:'), error);
  process.exit(1);
});
