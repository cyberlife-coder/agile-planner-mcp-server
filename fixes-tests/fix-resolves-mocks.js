/**
 * Script pour corriger les erreurs de mock .resolves dans les tests
 * Conforme aux règles TDD (RULE 1) et qualité (RULE 6) de Wave 8
 */
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Trouver tous les fichiers de test échoués
async function findFailedTests() {
  const testFilesPattern = 'tests/**/*.test.js';
  try {
    return await glob(testFilesPattern);
  } catch (error) {
    console.error(`Erreur lors de la recherche des fichiers de test: ${error.message}`);
    // Fallback si glob ne fonctionne pas
    return [
      'tests/unit/generators/markdown-generator.simple.test.js',
      'tests/unit/generators/feature-generator.test.js',
      'tests/unit/formatters/simple-user-story.test.js'
    ];
  }
}

// Corriger les mocks .resolves dans un fichier
function fixResolvesInFile(filePath) {
  console.log(`Traitement de ${filePath}...`);
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Corriger jest.fn().resolves() -> jest.fn().mockResolvedValue()
    const resolvesRegex = /jest\.fn\(\)\.resolves\((.*?)\)/g;
    const newContent = content.replace(resolvesRegex, (match, value) => {
      console.log(`  Correction de jest.fn().resolves() -> jest.fn().mockResolvedValue()`);
      return `jest.fn().mockResolvedValue(${value})`;
    });
    
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
    
    // Corriger jest.fn().rejects() -> jest.fn().mockRejectedValue()
    const rejectsRegex = /jest\.fn\(\)\.rejects\((.*?)\)/g;
    const newerContent = content.replace(rejectsRegex, (match, value) => {
      console.log(`  Correction de jest.fn().rejects() -> jest.fn().mockRejectedValue()`);
      return `jest.fn().mockRejectedValue(${value})`;
    });
    
    if (newerContent !== content) {
      content = newerContent;
      modified = true;
    }
    
    // Corriger également les mocks fs-extra pour s'assurer qu'ils utilisent les bonnes méthodes
    const fsExtraMockPattern = /jest\.mock\(['"]fs-extra['"],\s*\(\)\s*=>\s*\(\{([\s\S]*?)\}\)\)/g;
    
    const extractMockBody = (mockContent) => {
      const mockLines = mockContent.split('\n');
      const fixedLines = mockLines.map(line => {
        if (line.includes('.resolves(') && !line.includes('mockResolvedValue')) {
          return line.replace(/\.resolves\(/, '.mockResolvedValue(');
        }
        if (line.includes('.rejects(') && !line.includes('mockRejectedValue')) {
          return line.replace(/\.rejects\(/, '.mockRejectedValue(');
        }
        return line;
      });
      return fixedLines.join('\n');
    };
    
    const fixedFsExtraMock = content.replace(fsExtraMockPattern, (match, mockBody) => {
      const fixedBody = extractMockBody(mockBody);
      console.log('  Correction des mocks fs-extra');
      return `jest.mock('fs-extra', () => ({${fixedBody}}))`;
    });
    
    if (fixedFsExtraMock !== content) {
      content = fixedFsExtraMock;
      modified = true;
    }
    
    // Ajouter un mock de base si aucun n'est trouvé
    if (content.includes('fs-extra') && !content.includes("jest.mock('fs-extra'")) {
      console.log('  Ajout d\'un mock pour fs-extra');
      
      const fsExtraMock = `
// Mock pour fs-extra (TDD Wave 8)
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(undefined),
  ensureDirSync: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
  writeFileSync: jest.fn(),
  readFile: jest.fn().mockResolvedValue('{}'),
  readFileSync: jest.fn().mockReturnValue('{}'),
  pathExists: jest.fn().mockResolvedValue(true),
  pathExistsSync: jest.fn().mockReturnValue(true)
}));
`;
      
      // Insérer après les imports mais avant le premier describe/test
      const insertPosition = content.search(/describe\(|test\(/);
      if (insertPosition > 0) {
        content = content.slice(0, insertPosition) + fsExtraMock + content.slice(insertPosition);
        modified = true;
      }
    }
    
    // Sauvegarder si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✓ Fichier ${filePath} corrigé avec succès`);
      return true;
    } else {
      console.log(`  ✓ Aucune correction nécessaire pour ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`  ✗ Erreur lors du traitement de ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction principale
async function main() {
  console.log('==== CORRECTION DES MOCKS .RESOLVES (TDD Wave 8) ====\n');
  
  try {
    // Ces fichiers posent problème avec .resolves
    const testFiles = [
      'tests/unit/generators/markdown-generator.simple.test.js',
      'tests/unit/generators/feature-generator.test.js',
      'tests/unit/formatters/simple-user-story.test.js'
    ];
    
    let filesModified = 0;
    
    for (const file of testFiles) {
      if (fixResolvesInFile(file)) {
        filesModified++;
      }
    }
    
    console.log('\n==== RÉSUMÉ ====');
    console.log(`Fichiers corrigés: ${filesModified}/${testFiles.length}`);
  } catch (error) {
    console.error(`Erreur lors de l'exécution du script: ${error.message}`);
  }
}

// Si glob est présent, utiliser la recherche dynamique, sinon utiliser la liste statique
try {
  if (require.resolve('glob')) {
    // Exécuter avec recherche dynamique
    main();
  }
} catch (error) {
  // Glob n'est pas disponible, utiliser la liste statique
  main();
}
