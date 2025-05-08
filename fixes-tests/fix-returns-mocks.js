/**
 * Script de correction des mocks avec .returns -> .mockReturnValue
 * Conforme aux règles TDD (RULE 1) et qualité (RULE 6) de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Liste des fichiers à traiter
const TARGET_FILES = [
  'tests/unit/generators/markdown-generator.simple.test.js',
  'tests/unit/generators/feature-generator.test.js',
  'tests/unit/formatters/simple-user-story.test.js'
];

// Fonction pour corriger les mocks .returns
function fixReturnsMocks(filePath) {
  console.log(`Traitement de ${filePath}...`);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`  ✗ Fichier non trouvé: ${filePath}`);
      return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer .returns() par .mockReturnValue()
    const returnsRegex = /\.returns\(/g;
    const newContent = content.replace(returnsRegex, (match) => {
      console.log(`  Correction de .returns() -> .mockReturnValue()`);
      return '.mockReturnValue(';
    });
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`  ✓ Fichier corrigé avec succès`);
      return true;
    } else {
      console.log(`  ✓ Aucune correction nécessaire`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Erreur lors du traitement de ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction principale
function main() {
  console.log('==== CORRECTION DES MOCKS .RETURNS (TDD Wave 8) ====\n');
  
  let filesFixed = 0;
  
  for (const file of TARGET_FILES) {
    if (fixReturnsMocks(file)) {
      filesFixed++;
    }
  }
  
  console.log('\n==== RÉSUMÉ ====');
  console.log(`Fichiers corrigés: ${filesFixed}/${TARGET_FILES.length}`);
}

// Exécuter le script
main();
