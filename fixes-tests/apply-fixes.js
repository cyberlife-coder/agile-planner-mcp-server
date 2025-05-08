/**
 * Script d'assistance pour corriger systématiquement les tests
 * Conforme aux RULE 1 (TDD) et RULE 3 (Structure) de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Récupère tous les fichiers de test de manière récursive
function findTestFiles(dir) {
  const allFiles = [];
  
  function traverseDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        traverseDir(fullPath);
      } else if (file.endsWith('.test.js')) {
        allFiles.push(fullPath);
      }
    }
  }
  
  traverseDir(dir);
  return allFiles;
}

// Calcule le chemin relatif correct basé sur la position du fichier
function getCorrectRelativePath(filePath, testsRootDir, targetPath) {
  // Détermine combien de niveaux de profondeur par rapport au répertoire tests
  const relativePath = path.relative(testsRootDir, path.dirname(filePath));
  const depth = relativePath.split(path.sep).length;
  
  // Construit le préfixe ../ en fonction de la profondeur
  return '../'.repeat(depth) + targetPath;
}

// Corrige les chemins d'importation dans un fichier
function fixImportsInFile(filePath, testsRootDir) {
  console.log(`Traitement de ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Trouve toutes les importations avec require qui pointent vers server/
  const regex = /require\(['"](\.\.\/)+server\/([^'"]+)['"]\)/g;
  let match;
  const replacements = [];
  
  // Collecter tous les remplacements à faire
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const serverPath = 'server/' + match[2];
    const correctPath = getCorrectRelativePath(filePath, testsRootDir, serverPath);
    replacements.push({ oldImport: fullMatch, newImport: `require('${correctPath}')` });
  }
  
  // Appliquer les remplacements
  for (const { oldImport, newImport } of replacements) {
    content = content.replace(oldImport, newImport);
    console.log(`  ${oldImport} -> ${newImport}`);
    modified = true;
  }
  
  // Sauvegarder si modifié
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Chemin racine des tests
const testsRootDir = path.resolve(__dirname, '../tests');
const testFiles = findTestFiles(testsRootDir);

console.log(`Trouvé ${testFiles.length} fichiers de test`);
let fixedCount = 0;

// Appliquer les corrections à tous les fichiers
for (const file of testFiles) {
  if (fixImportsInFile(file, testsRootDir)) {
    fixedCount++;
  }
}

console.log(`\nTerminé! ${fixedCount} fichiers ont été corrigés.`);
