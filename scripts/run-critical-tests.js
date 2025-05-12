/**
 * Script d'exécution des tests critiques pour l'Agile Planner MCP Server
 * Conforme à la RULE 1 (TDD) et à la stratégie Wave 8
 * 
 * @version 1.7.1
 * @description 
 * Exécute les tests critiques avec une tolérance aux erreurs configurable
 * 
 * Usage:
 * - Mode normal: node scripts/run-critical-tests.js
 * - Mode rapide: node scripts/run-critical-tests.js --quick
 * - Mode strict: node scripts/run-critical-tests.js --strict
 */

const { execSync, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_TIMEOUT = 60000; // 60 secondes par test
const JEST_BASE_CMD = 'npx jest';

// Traitement des arguments
const args = process.argv.slice(2);
const QUICK_MODE = args.includes('--quick');
const STRICT_MODE = args.includes('--strict');

// Liste des tests critiques à exécuter
const CRITICAL_TESTS = [
  // Tests unitaires disponibles
  'tests/backlog-generator.test.js',
  'tests/json-parser.test.js',
  
  // Tests du CLI et MCP (prioritaires)
  'tests/integration/cli.e2e.test.js',
  'tests/integration/cli-integration.test.js',
  
  // Tests de validation de la structure RULE 3
  'tests/integration/mcp-integration.test.js'
];

// Tests alternatifs à exécuter en cas d'échec des tests principaux
const BACKUP_TESTS = [
  'test-mcp-rule3.js'
];

// Fonction pour exécuter un test avec gestion appropriée des erreurs
function runTest(testPath) {
  const testName = path.basename(testPath);
  console.log(`\n\n=========================================`);
  console.log(`🧪 Exécution du test: ${testName}`);
  console.log(`=========================================\n`);
  
  try {
    let command = '';
    
    // Déterminer la commande d'exécution selon le type de test
    if (testPath.includes('.test.js')) {
      // Test Jest standard
      command = `${JEST_BASE_CMD} --forceExit --testTimeout=${TEST_TIMEOUT} "${testPath}"`;
    } else {
      // Script Node.js direct (comme test-mcp-rule3.js)
      command = `node "${testPath}"`;
    }
    
    // Exécuter le test
    console.log(`> ${command}\n`);
    const output = execSync(command, { 
      encoding: 'utf8',
      env: { ...process.env, NODE_ENV: 'test' },
      stdio: 'inherit'
    });
    
    return { success: true, output };
  } catch (error) {
    console.error(`\n❌ Test ${testName} a échoué`);
    if (error.stderr) console.error(error.stderr);
    return { success: false, error };
  }
}

// Fonctions auxiliaires pour réduire la complexité cognitive
function printHeader() {
  console.log('\n=========================================');
  console.log('🔍 EXÉCUTION DES TESTS CRITIQUES WAVE 8');
  console.log('=========================================\n');
  
  console.log('Mode: Tests minimaux et critiques');
  console.log(`Tests à exécuter: ${CRITICAL_TESTS.length}\n`);
}

// Exécute les tests d'une liste donnée et retourne les résultats
function executeTestList(testList, isBackup = false) {
  const results = [];
  const failedTests = [];
  
  for (const testPath of testList) {
    // Vérifier si le test existe
    if (!fs.existsSync(testPath)) {
      console.warn(`⚠️ Test ${isBackup ? 'alternatif ' : ''}non trouvé: ${testPath}`);
      if (!isBackup) { // Ne pas ajouter les tests alternatifs manquants aux résultats
        results.push({ 
          path: testPath, 
          success: false, 
          error: { message: 'Fichier non trouvé' },
          isBackup
        });
        failedTests.push(testPath);
      }
      continue;
    }
    
    // Exécuter le test
    const result = runTest(testPath);
    results.push({ path: testPath, isBackup, ...result });
    
    if (!result.success) {
      failedTests.push(testPath);
    }
  }
  
  return { results, failedTests };
}

// Génère le rapport de résultats
function printSummary(allResults) {
  console.log('\n\n=========================================');
  console.log('📊 RÉSUMÉ DES TESTS CRITIQUES');
  console.log('=========================================\n');
  
  const successCount = allResults.filter(r => r.success).length;
  const failureCount = allResults.filter(r => !r.success).length;
  
  console.log(`Total des tests exécutés: ${allResults.length}`);
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Échecs: ${failureCount}\n`);
  
  if (failureCount > 0) {
    console.log('Tests en échec:');
    allResults.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.path}${result.isBackup ? ' (alternatif)' : ''}`);
    });
  }
  
  return failureCount;
}

// Détermine le code de sortie en fonction du mode et des résultats
function handleExitCode(failureCount) {
  if (STRICT_MODE) {
    // En mode strict, tout échec cause une erreur
    process.exit(failureCount > 0 ? 1 : 0);
  } else if (QUICK_MODE) {
    // En mode rapide, on tolère des échecs pour accélérer le développement
    console.log('\nℹ️ Mode rapide: exit code 0 même en cas d\'erreur');
    process.exit(0);
  } else {
    // En mode normal, on sort avec un code approprié
    process.exit(failureCount > 0 ? 1 : 0);
  }
}

// Fonction principale pour exécuter tous les tests critiques
// Complexité cognitive réduite (<15) en extrayant des fonctions auxiliaires
async function runCriticalTests() {
  // 1. Afficher l'en-tête
  printHeader();
  
  // 2. Exécuter les tests critiques
  const { results, failedTests } = executeTestList(CRITICAL_TESTS);
  
  // 3. Gérer les tests alternatifs si nécessaire
  if (failedTests.length > 0 && BACKUP_TESTS.length > 0 && !QUICK_MODE) {
    // Afficher message pour les tests alternatifs
    console.log('\n\n=========================================');
    console.log(`❗ ${failedTests.length} tests ont échoué. Exécution des tests alternatifs...`);
    console.log('=========================================\n');
    
    // Exécuter les tests alternatifs et ajouter leurs résultats
    const backupResults = executeTestList(BACKUP_TESTS, true);
    results.push(...backupResults.results);
  } else if (QUICK_MODE && failedTests.length > 0) {
    console.log('\n\n=========================================');
    console.log(`ℹ️ Mode rapide activé - Tests alternatifs ignorés`);
    console.log('=========================================\n');
  }
  
  // 4. Afficher le résumé et gérer la sortie
  const failureCount = printSummary(results);
  handleExitCode(failureCount);
}

// Exécuter les tests
runCriticalTests().catch(error => {
  console.error('Erreur non gérée:', error);
  process.exit(1);
});
