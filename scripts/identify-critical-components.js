/**
 * Script d'identification des composants critiques - TDD Wave 8
 * 
 * Ce script analyse la structure du projet pour identifier les composants
 * critiques qui nécessitent des tests fonctionnels avant le merge.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Fonction pour explorer récursivement un répertoire
function exploreDir(dir, pattern = /\.js$/, exclude = /node_modules|\.git/) {
  const results = [];
  
  function traverse(currentDir, relativePath = '') {
    if (exclude.test(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const itemPath = path.join(currentDir, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        if (!exclude.test(item)) {
          traverse(itemPath, itemRelativePath);
        }
      } else if (pattern.test(item) && !exclude.test(item)) {
        results.push({
          path: itemPath,
          relativePath: itemRelativePath
        });
      }
    }
  }
  
  traverse(dir);
  return results;
}

// Fonction pour analyser le contenu d'un fichier et déterminer son importance
function analyzeFileImportance(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Identifiant pour les exports (indique un module utilisé par d'autres)
  const hasExports = content.includes('module.exports') || content.includes('export ');
  
  // Identifiant pour les entrées MCP (composants critiques pour l'interface MCP)
  const isMCPComponent = content.includes('mcp') || content.includes('MCP') || 
                        filePath.includes('mcp') || filePath.includes('router');
  
  // Identifiant pour les validateurs (composants critiques pour la validation)
  const isValidator = content.includes('validate') || content.includes('Validator') || 
                     filePath.includes('validator') || filePath.includes('validation');
  
  // Identifiant pour les générateurs (composants critiques pour la génération)
  const isGenerator = content.includes('generate') || content.includes('Generator') || 
                     filePath.includes('generator') || filePath.includes('formatter');
  
  // Calcul du score d'importance
  let importanceScore = 0;
  if (hasExports) importanceScore += 1;
  if (isMCPComponent) importanceScore += 3;
  if (isValidator) importanceScore += 2;
  if (isGenerator) importanceScore += 2;
  
  return {
    path: filePath,
    hasExports,
    isMCPComponent,
    isValidator,
    isGenerator,
    importanceScore
  };
}

// Fonction principale pour identifier les composants critiques
async function identifyCriticalComponents() {
  console.log(chalk.blue('🔍 Identification des composants critiques - TDD Wave 8'));
  
  // Analyser la structure du projet
  const projectRoot = path.join(__dirname, '..');
  const serverDir = path.join(projectRoot, 'server');
  
  console.log(chalk.cyan('📁 Exploration du répertoire serveur...'));
  const serverFiles = exploreDir(serverDir);
  
  console.log(chalk.cyan(`📋 Nombre de fichiers trouvés: ${serverFiles.length}`));
  
  // Analyser l'importance de chaque fichier
  console.log(chalk.yellow('⏳ Analyse de l\'importance des composants...'));
  
  const analyzedFiles = serverFiles.map(file => analyzeFileImportance(file.path));
  
  // Trier par score d'importance
  analyzedFiles.sort((a, b) => b.importanceScore - a.importanceScore);
  
  // Identifier les composants critiques (score > 2)
  const criticalComponents = analyzedFiles.filter(file => file.importanceScore > 2);
  
  console.log(chalk.green(`✅ Composants critiques identifiés: ${criticalComponents.length}`));
  
  // Créer la cartographie des tests nécessaires
  const criticalComponentsMap = criticalComponents.map(component => {
    const relativePath = path.relative(projectRoot, component.path);
    const componentName = path.basename(component.path, '.js');
    
    // Déterminer le type de composant
    let componentType = 'unknown';
    if (component.isMCPComponent) componentType = 'mcp';
    else if (component.isValidator) componentType = 'validator';
    else if (component.isGenerator) componentType = 'generator';
    else componentType = 'utility';
    
    return {
      component: relativePath,
      componentName,
      componentType,
      importanceScore: component.importanceScore,
      testNeeded: `tests/unit/${componentType}s/${componentName}.test.js`
    };
  });
  
  // Vérifier quels tests existent déjà
  const testsDir = path.join(projectRoot, 'tests');
  const existingTests = exploreDir(testsDir, /\.test\.js$/);
  
  for (const component of criticalComponentsMap) {
    const testPath = path.join(projectRoot, component.testNeeded);
    component.testExists = fs.existsSync(testPath);
    
    if (component.testExists) {
      // Vérifier si le test fonctionne
      try {
        const testRelativePath = path.relative(projectRoot, testPath);
        require('child_process').execSync(`npx jest ${testRelativePath}`, { stdio: 'pipe' });
        component.testWorks = true;
      } catch (error) {
        component.testWorks = false;
      }
    } else {
      component.testWorks = false;
    }
  }
  
  // Générer le rapport
  const reportsDir = path.join(projectRoot, 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir);
  }
  
  fs.writeFileSync(
    path.join(reportsDir, 'critical-components.json'),
    JSON.stringify(criticalComponentsMap, null, 2)
  );
  
  // Générer le rapport markdown
  const testsToDevelop = criticalComponentsMap.filter(c => !c.testWorks);
  
  const markdownReport = `# Rapport des composants critiques - TDD Wave 8
${new Date().toISOString().split('T')[0]}

## Résumé

- Composants analysés: ${serverFiles.length}
- Composants critiques identifiés: ${criticalComponents.length}
- Tests à développer: ${testsToDevelop.length}

## Composants critiques sans tests fonctionnels

${testsToDevelop.map(c => `### ${c.componentName} (${c.componentType})
- **Fichier**: \`${c.component}\`
- **Score d'importance**: ${c.importanceScore}
- **Test nécessaire**: \`${c.testNeeded}\`
- **Statut**: ${c.testExists ? 'Existe mais échoue' : 'À créer'}`).join('\n\n')}

## Plan d'action TDD Wave 8

1. Créer des tests isolés pour chaque composant critique listé ci-dessus
2. Vérifier que tous les tests critiques passent
3. Supprimer les tests obsolètes ou non pertinents
4. Merger une fois tous les tests critiques validés

Cette approche TDD Wave 8 garantit que tous les composants critiques sont testés correctement tout en permettant de progresser vers le merge.
`;

  fs.writeFileSync(
    path.join(reportsDir, 'critical-components.md'),
    markdownReport
  );
  
  console.log(chalk.green('✅ Analyse terminée!'));
  console.log(chalk.green(`✅ Rapport généré dans reports/critical-components.md`));
  
  return {
    total: serverFiles.length,
    critical: criticalComponents.length,
    toDevelop: testsToDevelop.length,
    components: criticalComponentsMap
  };
}

// Exécution du script
if (require.main === module) {
  identifyCriticalComponents()
    .then(result => {
      console.log(chalk.blue(`\n🧪 ${result.toDevelop} tests critiques sont nécessaires avant le merge.`));
      console.log(chalk.cyan(`📋 Consultez le rapport détaillé dans reports/critical-components.md`));
    })
    .catch(error => {
      console.error(chalk.red(`\n❌ Erreur lors de l'analyse: ${error.message}`));
      process.exit(1);
    });
}

module.exports = { identifyCriticalComponents };
