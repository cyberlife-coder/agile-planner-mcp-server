/**
 * Script de correction des tests de formatters - Wave 8 TDD
 * Conforme aux RULES 1, 3, 4, 5 et 6
 */
const fs = require('fs');
const path = require('path');

// Chemin vers les tests des formatters
const formattersDir = path.resolve(__dirname, '../tests/unit/formatters');
const testFiles = fs.readdirSync(formattersDir)
  .filter(file => file.endsWith('.test.js'))
  .map(file => path.join(formattersDir, file));

console.log(`Trouvé ${testFiles.length} fichiers de test de formatters`);

// Corrections appliquées
let fixedCount = 0;

// Traiter chaque fichier de test
for (const file of testFiles) {
  console.log(`\nTraitement de ${file}`);
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 1. Corriger les chemins d'importation pour les modules markdown
  const importPatterns = [
    {
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/server\/lib\/markdown\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/lib/markdown/$1')"
    },
    {
      regex: /require\(['"]\.\.\/\.\.\/server\/lib\/markdown\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/lib/markdown/$1')"
    },
    {
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/server\/lib\/markdown-generator['"]\)/g,
      replacement: "require('../../../server/lib/markdown-generator')"
    },
    {
      regex: /require\(['"]\.\.\/\.\.\/server\/lib\/markdown-generator['"]\)/g,
      replacement: "require('../../../server/lib/markdown-generator')"
    }
  ];
  
  for (const { regex, replacement } of importPatterns) {
    const newContent = content.replace(regex, (match, p1) => {
      console.log(`  Import corrigé: ${match} -> ${replacement.replace('$1', p1 || '')}`);
      modified = true;
      return replacement.replace('$1', p1 || '');
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  // 2. Corriger les mocks des modules markdown
  const mockPatterns = [
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/server\/lib\/markdown\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/lib/markdown/$1'"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/server\/lib\/markdown\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/lib/markdown/$1'"
    }
  ];
  
  for (const { regex, replacement } of mockPatterns) {
    const newContent = content.replace(regex, (match, p1) => {
      console.log(`  Mock corrigé: ${match} -> ${replacement.replace('$1', p1)}`);
      modified = true;
      return replacement.replace('$1', p1);
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  // 3. Ajouter les mocks standards manquants
  if (!content.includes('jest.mock(\'chalk\')') && content.includes('chalk')) {
    console.log('  Ajout du mock pour chalk');
    
    const mockChalk = `
// Mock pour chalk (RULE 1 - TDD Wave 8)
jest.mock('chalk', () => ({
  blue: jest.fn(text => text),
  green: jest.fn(text => text),
  yellow: jest.fn(text => text),
  red: jest.fn(text => text),
  cyan: jest.fn(text => text),
  gray: jest.fn(text => text),
  white: jest.fn(text => text),
  bold: jest.fn(text => text)
}));\n\n`;
    
    const insertPosition = content.indexOf('describe(');
    if (insertPosition > 0) {
      content = content.slice(0, insertPosition) + mockChalk + content.slice(insertPosition);
      modified = true;
    }
  }
  
  // 4. Vérifier et corriger les problèmes d'assertions expect()
  if (content.includes('expect(') && !content.includes('jest.mock(\'expect\')')) {
    // Vérifier s'il y a des appels .toHaveBeenCalledWith() sur des fonctions non-mockées
    if (content.includes('.toHaveBeenCalledWith(') || content.includes('.toHaveBeenCalled()')) {
      // Chercher les fonctions utilisées dans les assertions mais non-mockées
      const functionMatches = content.match(/expect\(([^)]+)\)\.toHaveBeenCalled/g) || [];
      
      for (const match of functionMatches) {
        const functionName = match.replace(/expect\(([^)]+)\)\.toHaveBeenCalled.*/, '$1');
        
        // Vérifier si cette fonction est mockée
        if (!content.includes(`${functionName} = jest.fn()`) && 
            !content.includes(`${functionName}: jest.fn()`) &&
            !content.includes(`${functionName} = sinon.stub()`)) {
          console.log(`  Attention: La fonction ${functionName} est testée avec toHaveBeenCalled mais n'est pas mockée`);
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
