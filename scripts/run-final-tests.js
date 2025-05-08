/**
 * Final Test Suite Runner - TDD Wave 8
 * 
 * Exécute les tests finaux pour valider la compatibilité multi-LLM
 * et la robustesse globale de Agile Planner MCP Server.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Groupes de tests à exécuter dans l'ordre
const TEST_GROUPS = [
  {
    name: 'Tests critiques',
    command: 'npx jest tests/critical --verbose',
    priority: 1
  },
  {
    name: 'Tests MCP',
    command: 'npx jest tests/mcp-validation --verbose',
    priority: 1
  },
  {
    name: 'Tests d\'intégration',
    command: 'npx jest tests/integration --verbose',
    priority: 2
  },
  {
    name: 'Tests unitaires',
    command: 'npx jest tests/unit --verbose',
    priority: 2
  }
];

// Fonction pour exécuter une commande et capturer le résultat
function runCommand(command) {
  console.log(chalk.cyan(`🚀 Exécution de: ${command}`));
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false,
      output: error.stdout || error.stderr || 'Erreur inconnue',
      error
    };
  }
}

// Fonction pour générer un rapport de test
function generateTestReport(results) {
  const reportDate = new Date().toISOString().split('T')[0];
  
  // Créer le dossier de rapports s'il n'existe pas
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  // Calculer les statistiques
  const totalTests = results.length;
  const successfulTests = results.filter(r => r.success).length;
  const failedTests = totalTests - successfulTests;
  const successRate = (successfulTests / totalTests * 100).toFixed(2);
  
  // Priorité 1 uniquement
  const priority1Tests = results.filter(r => r.priority === 1);
  const priority1Success = priority1Tests.filter(r => r.success).length;
  const priority1Rate = (priority1Success / priority1Tests.length * 100).toFixed(2);
  
  // Générer le rapport markdown
  const markdownReport = `# Rapport final des tests - TDD Wave 8
${reportDate}

## Résumé
- **${successfulTests}/${totalTests}** groupes de tests réussis (${successRate}%)
- **${priority1Success}/${priority1Tests.length}** tests prioritaires réussis (${priority1Rate}%)

## Détails des tests

${results.map((result, index) => `### ${index + 1}. ${result.name} (Priorité ${result.priority})
- **Statut**: ${result.success ? '✅ Succès' : '❌ Échec'}
${result.success 
  ? '- Tous les tests du groupe ont passé avec succès'
  : `- **Problèmes détectés**:
\`\`\`
${result.output.split('\n').slice(0, 10).join('\n')}${result.output.split('\n').length > 10 ? '\n...' : ''}
\`\`\``}
`).join('\n\n')}

## Compatibilité multi-LLM

| LLM | Priorité | Statut |
|-----|----------|--------|
| **Windsurf** | 1 | ${priority1Rate === '100.00' ? '✅ Compatible' : '⚠️ Partiellement compatible'} |
| **Claude.ai** | 2 | ${successRate >= 90 ? '✅ Compatible' : '⚠️ Partiellement compatible'} |
| **Cursor** | 3 | ${successRate >= 80 ? '✅ Compatible' : '⚠️ Partiellement compatible'} |

## Conclusion

${successRate === '100.00' 
  ? '🎉 Tous les tests sont réussis! Le projet est prêt pour le déploiement.'
  : priority1Rate === '100.00'
    ? '✅ Les tests prioritaires (Windsurf) sont tous réussis. Le projet peut être déployé avec les fonctionnalités principales.'
    : '⚠️ Des problèmes ont été détectés dans les tests prioritaires. Une révision est nécessaire avant le déploiement.'}

${priority1Rate === '100.00' && successRate !== '100.00'
  ? '📝 Note: Les tests non-prioritaires qui échouent peuvent être résolus dans une version ultérieure.'
  : ''}
`;

  // Sauvegarder le rapport
  const reportPath = path.join(reportsDir, 'final-test-report.md');
  fs.writeFileSync(reportPath, markdownReport);
  
  console.log(chalk.green(`\n✅ Rapport de test généré: ${reportPath}`));
  
  return {
    reportPath,
    successRate,
    priority1Rate
  };
}

// Fonction principale
async function runTests() {
  console.log(chalk.blue('🧪 Exécution des tests finaux - TDD Wave 8'));
  
  const results = [];
  
  for (const group of TEST_GROUPS) {
    console.log(chalk.yellow(`\n📋 ${group.name} (Priorité ${group.priority})`));
    
    const result = runCommand(group.command);
    
    results.push({
      name: group.name,
      success: result.success,
      output: result.output,
      priority: group.priority
    });
    
    console.log(result.success 
      ? chalk.green(`✅ ${group.name}: Tous les tests ont passé!`)
      : chalk.red(`❌ ${group.name}: Des erreurs ont été détectées!`));
  }
  
  // Générer le rapport final
  console.log(chalk.blue('\n📊 Génération du rapport final'));
  const report = generateTestReport(results);
  
  // Afficher le résumé
  console.log(chalk.blue('\n📈 Résumé des tests'));
  console.log(chalk.yellow(`- Taux de réussite global: ${report.successRate}%`));
  console.log(chalk.yellow(`- Taux de réussite prioritaire (Windsurf): ${report.priority1Rate}%`));
  
  // Déterminer si le projet est prêt pour le déploiement
  const isDeployReady = parseFloat(report.priority1Rate) === 100;
  
  console.log(isDeployReady
    ? chalk.green('\n🚀 Le projet est prêt pour le déploiement!')
    : chalk.red('\n⚠️ Corrections nécessaires avant le déploiement!'));
  
  return {
    results,
    report,
    isDeployReady
  };
}

// Exécuter si appelé directement
if (require.main === module) {
  runTests().catch(error => {
    console.error(chalk.red(`\n❌ Erreur: ${error.message}`));
    process.exit(1);
  });
}

module.exports = { runTests };
