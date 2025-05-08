/**
 * Script d'aide pour corriger les imports dans les tests unitaires
 * Conformément à RULE 1 (TDD) et RULE 3 (Structure des fichiers) de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Fonction de recherche récursive des fichiers .test.js
function findTestFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTestFiles(filePath, fileList);
    } else if (file.endsWith('.test.js')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Trouver tous les fichiers de test
const testsDir = path.join(__dirname);
const testFiles = findTestFiles(testsDir);

console.log(`Trouvé ${testFiles.length} fichiers de test`);

// Analyse des imports dans chaque fichier
testFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relativeImportMatches = content.match(/require\(['"]\.\.\/.*['"]\)/g);
  
  if (relativeImportMatches) {
    console.log(`\nFichier: ${file}`);
    console.log('Imports relatifs trouvés:');
    relativeImportMatches.forEach(importMatch => {
      console.log(`  ${importMatch}`);
    });
    
    // Déterminer la profondeur relative correcte
    const relativeDepth = file.split(path.sep).slice(testsDir.split(path.sep).length).length;
    console.log(`Profondeur relative depuis tests/: ${relativeDepth}`);
    console.log(`Préfixe relatif recommandé: ${'../'.repeat(relativeDepth)}`);
  }
});

console.log('\nTerminé');
