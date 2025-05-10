/**
 * Script de correction automatique de la syntaxe Jest dans les tests
 * Conforme au TDD Wave 8 - RULE 1
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

const TESTS_DIR = path.join(__dirname, '..', 'tests');

// Patterns à rechercher et remplacer
const replacements = [
  // Modèle 1: .resolves() -> .mockResolvedValue()
  {
    pattern: /jest\.fn\(\)\.resolves\((.*?)\)/g,
    replacement: 'jest.fn().mockResolvedValue($1)'
  },
  // Modèle 2: .rejects() -> .mockRejectedValue()
  {
    pattern: /jest\.fn\(\)\.rejects\((.*?)\)/g,
    replacement: 'jest.fn().mockRejectedValue($1)'
  },
  // Modèle 3: mockReturnValueOnce() asynchrome -> mockResolvedValueOnce()
  {
    pattern: /mockReturnValueOnce\(Promise\.resolve\((.*?)\)\)/g,
    replacement: 'mockResolvedValueOnce($1)'
  },
  // Modèle 4: mockReturnValue() asynchrone -> mockResolvedValue()
  {
    pattern: /mockReturnValue\(Promise\.resolve\((.*?)\)\)/g,
    replacement: 'mockResolvedValue($1)'
  },
  // Modèle 5: mockReturnValue() avec rejet -> mockRejectedValue()
  {
    pattern: /mockReturnValue\(Promise\.reject\((.*?)\)\)/g,
    replacement: 'mockRejectedValue($1)'
  },
  // Modèle 6: syntax obsolète dans les beforeEach
  {
    pattern: /(beforeEach\(\(\) => {[\s\S]*?)jest\.fn\(\)\.resolves\((.*?)\)/g,
    replacement: '$1jest.fn().mockResolvedValue($2)'
  },
  // Modèle 7: implementation asynchrone incorrecte
  {
    pattern: /mockImplementation\(\(\) => \{\s*return Promise\.resolve\((.*?)\);\s*\}\)/g,
    replacement: 'mockResolvedValue($1)'
  },
  // Modèle 8: mockedFn.mock.calls[0][0]... -> expect(mockedFn).toHaveBeenCalledWith(...)
  {
    pattern: /expect\(([^.]+)\.mock\.calls\[0\]\[0\]\)\.toEqual\((.*?)\)/g,
    replacement: 'expect($1).toHaveBeenCalledWith($2)'
  }
];

// Fonction pour traiter un fichier
async function processFile(filePath) {
  console.log(chalk.blue(`Traitement de ${filePath}`));
  
  try {
    // Lire le contenu du fichier
    const content = await fs.readFile(filePath, 'utf8');
    
    // Appliquer les remplacements
    let newContent = content;
    let hasChanges = false;
    
    for (const { pattern, replacement } of replacements) {
      const beforeReplace = newContent;
      newContent = newContent.replace(pattern, replacement);
      
      if (beforeReplace !== newContent) {
        hasChanges = true;
        console.log(chalk.green(`  ✓ Correction appliquée : ${pattern.toString()}`));
      }
    }
    
    // Sauvegarder les changements si nécessaire
    if (hasChanges) {
      await fs.writeFile(filePath, newContent, 'utf8');
      console.log(chalk.green(`  ✓ Fichier mis à jour : ${filePath}`));
      return true;
    } else {
      console.log(chalk.yellow(`  ⚠ Aucune correction nécessaire pour ${filePath}`));
      return false;
    }
  } catch (error) {
    console.error(chalk.red(`  ✗ Erreur lors du traitement de ${filePath}`), error);
    return false;
  }
}

// Fonction récursive pour parcourir les répertoires
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
      const fixed = await processFile(itemPath);
      if (fixed) totalFixed++;
    }
  }
  
  return totalFixed;
}

// Fonction principale
async function main() {
  console.log(chalk.blue('=== Correction automatique de la syntaxe Jest ==='));
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
