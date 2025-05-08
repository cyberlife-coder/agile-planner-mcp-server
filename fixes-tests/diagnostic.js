/**
 * Script de diagnostic pour les tests échoués - Wave 8 TDD
 * Conforme aux RULE 1, RULE 3 et RULE 5
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Configuration des modules principaux à analyser
const moduleCategories = [
  { name: 'validators', priority: 1, path: 'tests/unit/validators' },
  { name: 'utils', priority: 2, path: 'tests/unit/utils' },
  { name: 'formatters', priority: 3, path: 'tests/unit/formatters' },
  { name: 'generators', priority: 4, path: 'tests/unit/generators' },
  { name: 'integration', priority: 5, path: 'tests/integration' }
];

// Motifs d'erreurs communs à rechercher et solutions
const errorPatterns = [
  {
    pattern: "Cannot find module",
    fix: "Corriger les chemins d'importation (../../../server/...)"
  },
  {
    pattern: "Cannot read properties of undefined",
    fix: "Corriger la structure des mocks ou implémentation"
  },
  {
    pattern: "TypeError: ",
    fix: "Corriger l'ordre d'initialisation des mocks ou paramètres"
  },
  {
    pattern: "expecting object",
    fix: "Vérifier la correspondance des types d'objets retournés"
  }
];

// Fonction pour analyser une catégorie de modules
async function analyzeCategory(category) {
  console.log(`\n===== Analyse de la catégorie: ${category.name} (priorité ${category.priority}) =====`);
  
  try {
    const { stdout, stderr } = await execPromise(`npx jest --testMatch="**/${category.path}/**/*.test.js" --json`);
    
    if (stderr) {
      console.error(`Erreur lors de l'exécution des tests: ${stderr}`);
      return { failures: 0, errors: [] };
    }
    
    let testResults;
    try {
      testResults = JSON.parse(stdout);
    } catch (e) {
      console.error(`Erreur de parsing des résultats pour ${category.name}: ${e.message}`);
      return { failures: 0, errors: [] };
    }
    
    // Compiler les informations sur les échecs
    const errors = [];
    let failedTests = 0;
    
    testResults.testResults.forEach(suite => {
      if (suite.status === 'failed') {
        failedTests++;
        
        suite.assertionResults.forEach(test => {
          if (test.status === 'failed') {
            const errorMessage = test.failureMessages[0] || 'Erreur inconnue';
            
            // Identifier le type d'erreur
            let errorType = 'Autre';
            let fixSuggestion = 'Analyse manuelle requise';
            
            for (const { pattern, fix } of errorPatterns) {
              if (errorMessage.includes(pattern)) {
                errorType = pattern;
                fixSuggestion = fix;
                break;
              }
            }
            
            errors.push({
              suite: suite.name,
              test: test.title,
              error: errorMessage.split('\n')[0], // Première ligne de l'erreur
              type: errorType,
              fix: fixSuggestion
            });
          }
        });
      }
    });
    
    return { 
      failures: failedTests,
      errors
    };
  } catch (error) {
    console.error(`Erreur d'exécution: ${error.message}`);
    return { failures: 0, errors: [] };
  }
}

// Fonction principale
async function runDiagnostic() {
  console.log("===== DIAGNOSTIC DES TESTS - Wave 8 TDD =====");
  
  const results = [];
  for (const category of moduleCategories) {
    const result = await analyzeCategory(category);
    results.push({
      category,
      ...result
    });
  }
  
  // Trier par priorité et nombre d'échecs
  results.sort((a, b) => {
    // D'abord par priorité
    if (a.category.priority !== b.category.priority) {
      return a.category.priority - b.category.priority;
    }
    // Ensuite par nombre d'échecs
    return b.failures - a.failures;
  });
  
  // Afficher le résumé
  console.log("\n===== RÉSUMÉ DU DIAGNOSTIC =====");
  results.forEach(result => {
    console.log(`${result.category.name}: ${result.failures} échecs, ${result.errors.length} erreurs détaillées`);
  });
  
  // Afficher les erreurs les plus fréquentes
  console.log("\n===== TYPES D'ERREURS LES PLUS FRÉQUENTS =====");
  const errorTypeCounts = {};
  results.forEach(result => {
    result.errors.forEach(error => {
      errorTypeCounts[error.type] = (errorTypeCounts[error.type] || 0) + 1;
    });
  });
  
  Object.entries(errorTypeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`${type}: ${count} occurrences`);
    });
  
  // Générer le plan de correction basé sur la priorité
  console.log("\n===== PLAN DE CORRECTION WAVE 8 =====");
  results.forEach(result => {
    if (result.failures === 0) return;
    
    console.log(`\n## ${result.category.name} (${result.failures} échecs):`);
    
    // Regrouper les erreurs par type
    const errorsPerTestFile = {};
    result.errors.forEach(error => {
      const filename = path.basename(error.suite);
      if (!errorsPerTestFile[filename]) {
        errorsPerTestFile[filename] = [];
      }
      errorsPerTestFile[filename].push(error);
    });
    
    // Afficher les actions de correction par fichier
    Object.entries(errorsPerTestFile).forEach(([filename, errors]) => {
      console.log(`- ${filename}:`);
      
      // Regrouper par type de correction
      const fixTypes = {};
      errors.forEach(error => {
        fixTypes[error.fix] = fixTypes[error.fix] || [];
        fixTypes[error.fix].push(error.test);
      });
      
      Object.entries(fixTypes).forEach(([fix, tests]) => {
        console.log(`  * ${fix} (${tests.length} tests)`);
      });
    });
  });
  
  // Écrire les résultats dans un fichier pour référence
  const diagnosticReport = {
    timestamp: new Date().toISOString(),
    summary: results.map(r => ({ 
      category: r.category.name, 
      failures: r.failures,
      errorCount: r.errors.length 
    })),
    errorTypes: errorTypeCounts,
    detailedResults: results
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'diagnostic-report.json'),
    JSON.stringify(diagnosticReport, null, 2),
    'utf8'
  );
  
  console.log("\nRapport de diagnostic généré dans diagnostic-report.json");
}

// Exécuter le diagnostic
runDiagnostic().catch(error => {
  console.error(`Erreur lors du diagnostic: ${error.message}`);
});
