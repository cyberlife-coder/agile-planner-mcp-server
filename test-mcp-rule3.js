/**
 * Test de la conformité RULE 3 dans l'interface MCP
 * Conforme à la RULE 1 (TDD) et Wave 8
 * 
 * @version 1.7.1 - Refactorisé pour améliorer la robustesse et réduire la complexité
 */
const path = require('path');
const fs = require('fs-extra');

// Utiliser les utilitaires MCP optimisés
const { 
  runMcpCommand, 
  setupMcpTestEnvironment, 
  terminateProcess 
} = require('./tests/utils/mcp-test-utils');

// Configuration pour le test
const TEST_ID = `test-${Date.now()}`;

// Variables globales de test
let testEnv;
let activeProcesses = [];

// Fonction pour exécuter une commande MCP avec suivi des processus
async function runTrackedMcpCommand(jsonInput, options = {}) {
  const result = await runMcpCommand(jsonInput, {
    debug: true,
    timeout: 30000,
    env: {
      ...process.env,
      TEST_MODE: 'true' // Activer le mode test pour éviter les appels API réels
    },
    ...options
  });
  
  // Ajouter le processus à la liste pour nettoyage
  if (result.process) {
    activeProcesses.push(result.process);
  }
  
  return result;
}

// Fonction pour vérifier la structure RULE 3
async function verifyRule3Structure(outputDir) {
  console.log('🔍 Vérification de la structure RULE 3 dans', outputDir);
  
  // Vérifier l'existence des dossiers principaux conformes à RULE 3
  const requiredDirs = [
    'epics',
    'orphan-stories'
  ];
  
  // Vérifier l'absence des dossiers obsolètes
  const obsoleteDirs = [
    'planning',
    'planning/mvp',
    'planning/iterations'
  ];
  
  const results = {
    requiredDirsExist: true,
    obsoleteDirsAbsent: true,
    errors: []
  };
  
  // Vérifier les dossiers requis
  for (const dir of requiredDirs) {
    const fullPath = path.join(outputDir, dir);
    const exists = await fs.pathExists(fullPath);
    if (!exists) {
      results.requiredDirsExist = false;
      results.errors.push(`Dossier requis manquant: ${dir}`);
    }
  }
  
  // Vérifier l'absence des dossiers obsolètes
  for (const dir of obsoleteDirs) {
    const fullPath = path.join(outputDir, dir);
    const exists = await fs.pathExists(fullPath);
    if (exists) {
      results.obsoleteDirsAbsent = false;
      results.errors.push(`Dossier obsolète présent: ${dir}`);
    }
  }
  
  return results;
}

// Nettoyer les processus actifs
async function cleanupResources() {
  // Terminer tous les processus
  for (const process of activeProcesses) {
    await terminateProcess(process);
  }
  activeProcesses = [];
  
  // Nettoyer l'environnement si nécessaire
  if (testEnv) {
    console.log('🧹 Nettoyage du répertoire de test', testEnv.outputDir);
    await testEnv.cleanup();
  }
}

// Exécuter le test MCP optimisé
async function runTest() {
  try {
    // 1. Préparer l'environnement de test
    testEnv = setupMcpTestEnvironment({
      prefix: 'test-mcp-rule3',
      cleanup: true // Nettoyer automatiquement après
    });
    console.log('📍 Environnement de test créé dans:', testEnv.outputDir);
    
    // 2. Requête d'initialisation MCP
    const { jsonResponse: initResponse } = await runTrackedMcpCommand({
      jsonrpc: "2.0",
      id: `${TEST_ID}-init`,
      method: "initialize",
      params: {
        protocolVersion: "2025-01"
      }
    });
    
    console.log('✅ API initialisée:', initResponse?.result?.serverInfo?.name || 'Pas de nom serveur');
    
    // 3. Requête MCP pour générer un backlog
    const generateBacklogRequest = {
      jsonrpc: "2.0",
      id: `${TEST_ID}-backlog`,
      method: "tools/call",
      params: {
        name: "generateBacklog",
        arguments: {
          projectName: "Projet Test RULE 3",
          projectDescription: "Test de la structure RULE 3 dans l'interface MCP",
          outputPath: testEnv.outputDir
        }
      }
    };
    
    // Exécuter la génération de backlog
    console.log('🔄 Génération du backlog via MCP...');
    await runTrackedMcpCommand(generateBacklogRequest);
    
    // 4. Vérifier la structure RULE 3
    console.log('🔍 Vérification du résultat...');
    
    // Vérifier les fichiers essentiels
    const files = [
      { name: 'backlog.json', path: path.join(testEnv.outputDir, 'backlog.json') },
      { name: 'backlog-last-dump.json', path: path.join(testEnv.outputDir, 'backlog-last-dump.json') }
    ];
    
    // Vérifier chaque fichier essentiel
    for (const file of files) {
      const exists = await fs.pathExists(file.path);
      if (!exists) {
        throw new Error(`Le fichier ${file.name} n'a pas été créé dans ${testEnv.outputDir}`);
      }
      console.log(`✅ Fichier ${file.name} créé avec succès`);
    }
    
    // Vérifier la structure des dossiers
    const structureResults = await verifyRule3Structure(testEnv.outputDir);
    
    if (!structureResults.requiredDirsExist) {
      console.error('❌ Certains dossiers requis sont manquants:', structureResults.errors.filter(e => e.includes('requis')));
      throw new Error('Structure RULE 3 incomplète: dossiers requis manquants');
    }
    
    if (!structureResults.obsoleteDirsAbsent) {
      console.error('❌ Des dossiers obsolètes sont présents:', structureResults.errors.filter(e => e.includes('obsolète')));
      throw new Error('Structure RULE 3 non conforme: dossiers obsolètes présents');
    }
    
    // 5. Afficher le résultat du test
    console.log('\n====================================');
    console.log('✅ TEST RÉUSSI: Structure RULE 3 conforme dans l\'interface MCP');
    console.log('====================================\n');
    
    // Afficher la structure des dossiers
    console.log('📁 Structure des dossiers créés:');
    listDirs(testEnv.outputDir);
    
    // Nettoyage final des ressources
    await cleanupResources();
    
    // Sortie réussie
    process.exit(0);
  } catch (error) {
    // Afficher l'erreur
    console.error('\n====================================');
    console.error('❌ TEST ÉCHOUÉ:', error.message);
    console.error('====================================\n');
    
    // Nettoyage des ressources même en cas d'erreur
    try {
      await cleanupResources();
    } catch (cleanupError) {
      console.error('Erreur lors du nettoyage:', cleanupError.message);
    }
    
    // Sortie en erreur
    process.exit(1);
  }
}

// Fonction auxiliaire pour lister récursivement les dossiers
function listDirs(dir, level = 0) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stats = fs.statSync(itemPath);
    const indent = '  '.repeat(level);
    if (stats.isDirectory()) {
      console.log(`${indent}/${item}/`);
      listDirs(itemPath, level + 1);
    } else {
      console.log(`${indent}/${item}`);
    }
  }
}

// Exécuter le test
runTest();
