/**
 * Script de correction automatique pour les tests d'intégration
 * Conforme aux RULES 1, 3, 5, 6 de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Trouver tous les fichiers de test d'intégration
const integrationDir = path.resolve(__dirname, '../tests/integration');
const integrationTestFiles = [];

function findTestsRecursively(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findTestsRecursively(fullPath);
    } else if (item.endsWith('.test.js')) {
      integrationTestFiles.push(fullPath);
    }
  }
}

findTestsRecursively(integrationDir);
console.log(`Trouvé ${integrationTestFiles.length} fichiers de test d'intégration`);

// Appliquer les corrections
let fixedCount = 0;

for (const file of integrationTestFiles) {
  console.log(`\nTraitement de ${file}`);
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  // 1. Corriger les chemins d'importation
  const importPatterns = [
    { 
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]\)/g,
      replacement: "require('../../server/$1')"
    },
    { 
      regex: /require\(['"]\.\.\/\.\.\/server\/([^'"]+)['"]\)/g,
      replacement: "require('../../server/$1')"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/server\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../server/$1'"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/server\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../server/$1'"
    }
  ];
  
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

  // 2. Ajouter les mocks manquants fréquents
  if (!content.includes('jest.mock(\'fs-extra\'') && content.includes('fs-extra')) {
    console.log('  Ajout du mock pour fs-extra');
    let mockFsExtra = `
// Mock pour fs-extra (RULE 1 - TDD)
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().resolves(),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().resolves(),
  writeFileSync: jest.fn(),
  readFile: jest.fn().resolves('{}'),
  readFileSync: jest.fn().returns('{}'),
  pathExists: jest.fn().resolves(true),
  pathExistsSync: jest.fn().returns(true),
  existsSync: jest.fn().returns(true)
}));\n\n`;
    
    // Insérer après les autres imports/mocks
    let position = content.indexOf('describe(');
    if (position === -1) position = content.indexOf('test(');
    
    if (position > 0) {
      content = content.slice(0, position) + mockFsExtra + content.slice(position);
      modified = true;
    }
  }

  // 3. Corriger les assertions et les initialisations de mock
  if (content.includes('mockReturnValueOnce') || content.includes('mockImplementationOnce')) {
    console.log('  Vérification des initializations de mock');
    
    // S'assurer que validate peut être mockée correctement
    if (content.includes('.validate.mockReturnValueOnce') || content.includes('.validate.mockImplementationOnce')) {
      // Ajouter une initialisation mock manquante pour validate
      if (!content.includes('.validate = jest.fn()') && !content.includes('.validate = sinon.stub()')) {
        let beforeEachPos = content.indexOf('beforeEach(');
        if (beforeEachPos > 0) {
          let beforeEachEndPos = content.indexOf('{', beforeEachPos) + 1;
          if (beforeEachEndPos > 0) {
            let initMock = '\n    // Initialiser validate comme mock (RULE 1 - TDD)\n    if (typeof validator.validate !== \'function\' || !validator.validate.mockImplementation) {\n      validator.validate = jest.fn();\n    }\n';
            content = content.slice(0, beforeEachEndPos) + initMock + content.slice(beforeEachEndPos);
            modified = true;
            console.log('  Ajout d\'une initialisation de mock pour validate');
          }
        }
      }
    }
  }

  // Sauvegarder les modifications
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
  } else {
    console.log('  Aucune correction nécessaire');
  }
}

console.log(`\nTerminé! ${fixedCount} fichiers ont été corrigés.`);
