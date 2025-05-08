/**
 * Utilitaire de correction complète des tests
 * Conforme aux RULES 1-7 de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Configuration des mocks courants à injecter dans les tests manquants
const commonMocks = {
  // Mock pour fs-extra (souvent manquant)
  fsExtra: `
// Mock pour fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().resolves(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().resolves(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().resolves('{}'),
  readFileSync: jest.fn().returns('{}'),
  pathExists: jest.fn().resolves(true),
  pathExistsSync: jest.fn().returns(true)
}));`,

  // Mock pour path
  path: `
// Mock pour path
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/'))
  };
});`
};

// Fonction pour trouver tous les fichiers de test
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

// Fonction principale pour corriger un fichier de test
function fixTestFile(filePath, testsRootDir) {
  console.log(`\nTraitement de ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Corriger les imports relatifs (../../server/... => ../../../server/...)
  const importPatterns = [
    { 
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/$1')"
    },
    { 
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/$1')"
    },
    { 
      regex: /require\(['"]\.\.\/\.\.\/server\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/$1')"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/$1'"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/$1'"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/server\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/$1'"
    }
  ];
  
  // Appliquer les corrections d'imports
  for (const { regex, replacement } of importPatterns) {
    const newContent = content.replace(regex, (match, p1) => {
      console.log(`  Import corrigé: ${match} -> ${replacement.replace('$1', p1)}`);
      modified = true;
      return replacement.replace('$1', p1);
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  // 2. Ajouter les mocks manquants si nécessaires
  if (content.includes('fs-extra') && !content.includes('jest.mock(\'fs-extra\'')) {
    console.log('  Ajout du mock pour fs-extra');
    const insertPosition = content.indexOf('describe(');
    if (insertPosition > 0) {
      content = content.slice(0, insertPosition) + commonMocks.fsExtra + '\n\n' + content.slice(insertPosition);
      modified = true;
    }
  }
  
  // 3. Ajouter le mock de path si nécessaire
  if (content.includes('path.join') && !content.includes('jest.mock(\'path\'')) {
    console.log('  Ajout du mock pour path');
    const insertPosition = content.indexOf('describe(');
    if (insertPosition > 0) {
      content = content.slice(0, insertPosition) + commonMocks.path + '\n\n' + content.slice(insertPosition);
      modified = true;
    }
  }
  
  // Sauvegarder si des modifications ont été appliquées
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Exécution principale
const testsRootDir = path.resolve(__dirname, '../tests');
const testFiles = findTestFiles(testsRootDir);

console.log(`Trouvé ${testFiles.length} fichiers de test au total`);
let fixedCount = 0;

// Appliquer les corrections
for (const file of testFiles) {
  if (fixTestFile(file, testsRootDir)) {
    fixedCount++;
  }
}

console.log(`\nTerminé! ${fixedCount} fichiers ont été corrigés.`);
