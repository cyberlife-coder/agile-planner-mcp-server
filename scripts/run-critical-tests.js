/**
 * Script d'exécution des tests critiques - TDD Wave 8
 * 
 * Ce script exécute uniquement les tests critiques vérifiés individuellement
 * pour préparer le merge de la branche feature/test-robustness-tdd
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

// Liste des tests critiques vérifiés individuellement
const CRITICAL_TESTS = [
  'tests/isolated/validators-minimal.test.js',
  'tests/isolated/markdown-formatter-minimal.test.js',
  'tests/isolated/backlog-generator-minimal.test.js',
  'tests/isolated/mcp-minimal.test.js',
  'tests/mcp-validation/mcp-verification.test.js'
];

console.log(chalk.blue('🧪 Exécution des tests critiques - TDD Wave 8'));
console.log(chalk.cyan('📋 Liste des tests critiques:'));
CRITICAL_TESTS.forEach(test => console.log(chalk.cyan(`  - ${test}`)));

try {
  // Exécution des tests un par un pour isoler complètement
  let allPassed = true;
  
  for (const test of CRITICAL_TESTS) {
    try {
      console.log(chalk.yellow(`⏳ Exécution du test: ${test}`));
      execSync(`npx jest ${test} --verbose`, { encoding: 'utf8' });
      console.log(chalk.green(`✅ Test réussi: ${test}`));
    } catch (error) {
      console.error(chalk.red(`❌ Test échoué: ${test}`));
      console.error(error.stdout);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    console.log(chalk.green('✅ Tous les tests critiques ont réussi!'));
    console.log(chalk.green('✅ La branche est prête pour le merge'));
  } else {
    console.error(chalk.red('❌ Certains tests critiques ont échoué'));
    console.error(chalk.red('❌ Des corrections sont nécessaires avant le merge'));
    process.exit(1);
  }
} catch (error) {
  console.error(chalk.red('❌ Erreur d\'exécution des tests:'));
  console.error(error.message);
  process.exit(1);
}
