// Script de test pour vérifier l'écriture des fichiers de feature
const path = require('path');
const fs = require('fs-extra');
const featureGenerator = require('./server/lib/feature-generator');
const markdownGenerator = require('./server/lib/markdown-generator');
const apiClient = require('./server/lib/api-client');

async function testFeatureGeneration() {
  try {
    // Répertoire de test
    const testDir = path.join(__dirname, 'test-output');
    fs.ensureDirSync(testDir);
    console.log(`Répertoire de test: ${testDir}`);
    
    // Simulation d'un résultat de feature (structure minimale requise)
    const mockFeature = {
      feature: {
        title: "Test Feature",
        description: "This is a test feature",
        businessValue: "Testing purposes"
      },
      userStories: [
        {
          title: "Test Story 1",
          asA: "tester",
          iWant: "to test feature generation",
          soThat: "I can fix any issues",
          acceptanceCriteria: [
            { given: "a test environment", when: "I run the test", then: "files should be generated" }
          ],
          tasks: [
            { description: "Create test files", estimate: "1h" }
          ]
        }
      ]
    };
    
    // Sauvegarder les données brutes
    await featureGenerator.saveRawFeatureResult(mockFeature, testDir);
    console.log("✅ Données brutes sauvegardées");
    
    // Générer les fichiers markdown
    await markdownGenerator.generateFeatureMarkdown(mockFeature, testDir, "test");
    console.log("✅ Fichiers markdown générés");
    
    // Vérifier les fichiers créés
    console.log("\nFichiers générés:");
    const files = [];
    const getAllFiles = (directory) => {
      const filesInDirectory = fs.readdirSync(directory);
      for (const file of filesInDirectory) {
        const absolute = path.join(directory, file);
        if (fs.statSync(absolute).isDirectory()) {
          getAllFiles(absolute);
        } else {
          files.push(absolute);
        }
      }
    };
    getAllFiles(testDir);
    
    files.forEach(file => {
      console.log(`- ${file}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    throw error;
  }
}

// Lancer le test
testFeatureGeneration()
  .then(() => console.log("\n✅ Test terminé avec succès"))
  .catch((err) => console.error("\n❌ Test échoué:", err));
