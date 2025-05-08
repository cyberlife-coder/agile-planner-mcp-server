/**
 * Script d'aide pour corriger automatiquement les imports dans les tests unitaires
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

// Calculer le préfixe relatif correct basé sur la profondeur du fichier
function calculateRelativePath(filePath, testsDir) {
  const relativeDepth = filePath.split(path.sep).slice(testsDir.split(path.sep).length).length;
  return '../'.repeat(relativeDepth);
}

// Corriger les imports dans un fichier
function fixImports(filePath, testsDir) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const relativePath = calculateRelativePath(filePath, testsDir);
  
  // Remplacer les imports relatifs incorrects
  const oldImports = content.match(/require\(['"]\.\.\/+.*?['"]\)/g) || [];
  
  for (const oldImport of oldImports) {
    // Extraire le chemin du module dans le require
    const match = oldImport.match(/require\(['"](.+)['"]\)/);
    if (!match) continue;
    
    const importPath = match[1];
    // Si le chemin pointe vers server/
    if (importPath.includes('server/')) {
      // Construire le nouveau chemin avec le préfixe correct
      const serverIndex = importPath.indexOf('server/');
      const modulePath = importPath.substring(serverIndex);
      const newImport = `require('${relativePath}${modulePath}')`;
      
      // Remplacer l'ancien import par le nouveau
      content = content.replace(oldImport, newImport);
      modified = true;
      console.log(`  Remplacé: ${oldImport} => ${newImport}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Trouver tous les fichiers de test
const testsDir = path.join(__dirname, '..');
const testFiles = findTestFiles(path.join(testsDir, 'tests'));

console.log(`Trouvé ${testFiles.length} fichiers de test`);
let modifiedCount = 0;

// Corriger les imports dans chaque fichier
testFiles.forEach(file => {
  console.log(`\nAnalyse du fichier: ${file}`);
  if (fixImports(file, testsDir)) {
    modifiedCount++;
  }
});

console.log(`\nTerminé. ${modifiedCount} fichiers ont été modifiés.`);
