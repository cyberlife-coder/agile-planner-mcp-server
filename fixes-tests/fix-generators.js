/**
 * Script spécifique pour corriger les tests des générateurs
 * Conformément aux règles TDD (RULE 1) et Structure (RULE 3) de Wave 8
 */
const fs = require('fs');
const path = require('path');

// Dossier cible des générateurs
const generatorsDir = path.resolve(__dirname, '../tests/unit/generators');

// Trouver tous les fichiers de test des générateurs
const testFiles = fs.readdirSync(generatorsDir)
  .filter(file => file.endsWith('.test.js'))
  .map(file => path.join(generatorsDir, file));

console.log(`Trouvé ${testFiles.length} fichiers de test de générateurs`);

// Corriger les imports dans chaque fichier
let fixedCount = 0;

for (const filePath of testFiles) {
  console.log(`\nAnalyse de ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remplacer les imports incorrects
  const patterns = [
    { 
      regex: /require\(['"]\.\.\/\.\.\/\.\.\/\.\.\/server\/lib\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/lib/$1')"
    },
    { 
      regex: /require\(['"]\.\.\/\.\.\/server\/lib\/([^'"]+)['"]\)/g,
      replacement: "require('../../../server/lib/$1')"
    },
    {
      regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/\.\.\/server\/lib\/([^'"]+)['"]/g,
      replacement: "jest.mock('../../../server/lib/$1'"
    }
  ];
  
  for (const { regex, replacement } of patterns) {
    const newContent = content.replace(regex, (match, p1) => {
      console.log(`  Correction: ${match} -> ${replacement.replace('$1', p1)}`);
      modified = true;
      return replacement.replace('$1', p1);
    });
    
    if (newContent !== content) {
      content = newContent;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    fixedCount++;
  } else {
    console.log('  Aucune correction nécessaire');
  }
}

console.log(`\nTerminé! ${fixedCount} fichiers ont été corrigés.`);
