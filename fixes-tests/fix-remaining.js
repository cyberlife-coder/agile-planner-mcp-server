/**
 * Script final de correction pour les tests restants - Wave 8 TDD
 * Conforme aux RULES 1, 3, 4, 5 et 6
 */
const fs = require('fs');
const path = require('path');

// Catégories restantes à traiter
const categories = [
  { name: 'utils', path: '../tests/unit/utils' },
  { name: 'markdown-generator', path: '../tests/unit/generators' }
];

// Nombre total de fichiers corrigés
let totalFixedCount = 0;

// Parcourir chaque catégorie
for (const category of categories) {
  const categoryDir = path.resolve(__dirname, category.path);
  
  // Vérifier si le dossier existe
  if (!fs.existsSync(categoryDir)) {
    console.log(`Le dossier ${categoryDir} n'existe pas, catégorie ignorée.`);
    continue;
  }
  
  // Trouver tous les fichiers de test dans cette catégorie
  const testFiles = fs.readdirSync(categoryDir)
    .filter(file => file.endsWith('.test.js'))
    .map(file => path.join(categoryDir, file));
  
  console.log(`\n===== Catégorie: ${category.name} - ${testFiles.length} fichiers =====`);
  
  let fixedCount = 0;
  
  // Traiter chaque fichier
  for (const file of testFiles) {
    console.log(`\nTraitement de ${file}`);
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 1. Corriger les chemins d'importation
    const importPatterns = [
      {
        regex: /require\(['"]\.\.\/\.\.\/\.\.\/server\/lib\/([^'"]+)['"]\)/g,
        replacement: "require('../../../server/lib/$1')"
      },
      {
        regex: /require\(['"]\.\.\/\.\.\/server\/lib\/([^'"]+)['"]\)/g,
        replacement: "require('../../../server/lib/$1')"
      },
      {
        regex: /jest\.mock\(['"]\.\.\/\.\.\/\.\.\/server\/lib\/([^'"]+)['"]/g,
        replacement: "jest.mock('../../../server/lib/$1'"
      },
      {
        regex: /jest\.mock\(['"]\.\.\/\.\.\/server\/lib\/([^'"]+)['"]/g,
        replacement: "jest.mock('../../../server/lib/$1'"
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
    
    // 2. Ajouter les mocks standards manquants
    const standardMocks = [
      {
        identifier: 'fs-extra',
        condition: content.includes('fs-extra') && !content.includes('jest.mock(\'fs-extra\''),
        mock: `
// Mock pour fs-extra (RULE 1 - TDD Wave 8)
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
}));\n\n`
      },
      {
        identifier: 'chalk',
        condition: content.includes('chalk') && !content.includes('jest.mock(\'chalk\''),
        mock: `
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
}));\n\n`
      },
      {
        identifier: 'nanoid',
        condition: content.includes('nanoid') && !content.includes('jest.mock(\'nanoid\''),
        mock: `
// Mock pour nanoid (RULE 1 - TDD Wave 8)
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id-12345')
}));\n\n`
      }
    ];
    
    for (const { identifier, condition, mock } of standardMocks) {
      if (condition) {
        console.log(`  Ajout du mock pour ${identifier}`);
        
        // Trouver une position appropriée pour insérer le mock
        const insertPosition = content.indexOf('describe(');
        if (insertPosition > 0) {
          content = content.slice(0, insertPosition) + mock + content.slice(insertPosition);
          modified = true;
        }
      }
    }
    
    // 3. Ajouter une initialisation manquante pour process.env
    if (content.includes('process.env') && !content.includes('process.env.OPENAI_API_KEY') && !content.includes('originalEnv')) {
      console.log('  Ajout de la sauvegarde process.env pour les tests');
      
      const envBackup = `
// Sauvegarde de l'environnement original (RULE 1 - TDD)
const originalEnv = { ...process.env };

beforeEach(() => {
  // Réinitialiser process.env avant chaque test
  process.env = { ...originalEnv };
  // Ajouter les variables d'environnement pour les tests
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.GROQ_API_KEY = 'test-groq-key';
});\n\n`;
      
      // Trouver une position appropriée pour l'insérer
      let insertPosition = content.indexOf('describe(');
      insertPosition = content.indexOf('{', insertPosition) + 1;
      
      if (insertPosition > 1) {
        content = content.slice(0, insertPosition) + envBackup + content.slice(insertPosition);
        modified = true;
      }
    }
    
    // 4. Corriger les problèmes de validation
    if (content.includes('.validate(') && content.includes('valid: ')) {
      // S'assurer que l'objet validator est correctement initialisé
      if (!content.includes('.validate = jest.fn()') && content.includes('.validate.mock')) {
        console.log('  Correction du mock de validate');
        
        // Trouver une position appropriée dans le beforeEach
        const beforeEachPos = content.indexOf('beforeEach(');
        if (beforeEachPos > 0) {
          const beforeEachBodyPos = content.indexOf('{', beforeEachPos) + 1;
          
          if (beforeEachBodyPos > 1) {
            const validateInit = `\n  // RULE 1 - TDD: Initialiser validate comme mock\n  if (!validator.validate || typeof validator.validate !== 'function' || !validator.validate.mockImplementation) {\n    validator.validate = jest.fn();\n  }\n`;
            
            content = content.slice(0, beforeEachBodyPos) + validateInit + content.slice(beforeEachBodyPos);
            modified = true;
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
  
  console.log(`\n${fixedCount} fichiers corrigés dans la catégorie ${category.name}`);
  totalFixedCount += fixedCount;
}

console.log(`\n===== RÉSUMÉ =====`);
console.log(`Total: ${totalFixedCount} fichiers corrigés au total`);
