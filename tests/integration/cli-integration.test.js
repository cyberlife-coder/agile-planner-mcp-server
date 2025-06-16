/**
 * Test d'intégration pour le mode CLI
 * Conforme à la RULE 1 (TDD) et à la mémoire dd9b921c
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuration pour le test
const TEST_OUTPUT_DIR = path.join(__dirname, '../../.agile-planner-backlog-test');
const CLI_COMMAND = 'node server/index.js';

// Skip les tests d'intégration si nécessaire (test rapide, CI, etc.)
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === 'true';

// Nettoyer avant et après les tests
beforeAll(async () => {
  if (!SKIP_INTEGRATION) {
    await fs.remove(TEST_OUTPUT_DIR);
    await fs.ensureDir(TEST_OUTPUT_DIR);
  }
});

afterAll(async () => {
  if (!SKIP_INTEGRATION) {
    // Conserver les fichiers pour analyse manuelle si besoin
    // await fs.remove(TEST_OUTPUT_DIR);
  }
});

describe('CLI Integration Test', () => {
  // Tests d'intégration CLI (skip en mode rapide)
  (SKIP_INTEGRATION ? describe.skip : describe)('CLI Mode', () => {
    jest.setTimeout(60000); // 60 secondes max par test
    
    it('devrait générer un fichier backlog-last-dump.json via CLI', async () => {
      // Construire la commande avec les options
      const command = `${CLI_COMMAND} generateBacklog "Test Project" "This is a test project for integration testing" --output-path "${TEST_OUTPUT_DIR}"`;
      
      console.log('⏳ Exécution de la commande CLI:', command);
      let stdout, stderr;
      
      try {
        // Exécuter la commande avec un timeout spécifique et un mock OpenAI
        const result = await execPromise(command, {
          timeout: 45000,
          env: {
            ...process.env,
            NODE_OPTIONS: `--require ${path.resolve(__dirname, '../helpers/mock-openai.js')}`
          }
        });
        stdout = result.stdout;
        stderr = result.stderr;
        console.log('✅ Commande terminée avec succès');
      } catch (error) {
        console.error('❌ Erreur lors de l\'exécution de la commande:', error.message);
        if (error.stdout) console.log('STDOUT malgré erreur:', error.stdout);
        if (error.stderr) console.log('STDERR malgré erreur:', error.stderr);
        throw error;
      }
      
      console.log('STDOUT:', stdout.substring(0, 500) + (stdout.length > 500 ? '...' : ''));
      if (stderr) console.log('STDERR:', stderr);
      
      // Vérifier la présence du fichier généré
      const backlogDumpPath = path.join(TEST_OUTPUT_DIR, 'backlog-last-dump.json');
      console.log('📁 Vérification du fichier:', backlogDumpPath);
      const exists = await fs.pathExists(backlogDumpPath);
      
      expect(exists).toBe(true);
      
      // Vérifier la structure du fichier
      if (exists) {
        const content = await fs.readJSON(backlogDumpPath);
        expect(content).toHaveProperty('projectName');
        expect(content).toHaveProperty('epics');
        expect(Array.isArray(content.epics)).toBe(true);
      }
    });
  });
  
  // Tests sans exécution réelle: toujours exécutés
  describe('Module exports', () => {
    it('devrait exporter correctement les fonctions CLI', () => {
      const cli = require('../../server/lib/cli');
      
      // Fonctions du module CLI
      expect(typeof cli.generateBacklogCLI).toBe('function');
      expect(typeof cli.generateFeatureCLI).toBe('function');
      
      // Modules
      expect(cli.utils).toBeDefined();
      expect(cli.backlog).toBeDefined();
      expect(cli.feature).toBeDefined();
    });
    
    it('devrait exporter correctement les fonctions de backlog-generator', () => {
      const bg = require('../../server/lib/backlog-generator');
      
      expect(typeof bg.initializeClient).toBe('function');
      expect(typeof bg.generateBacklog).toBe('function');
      expect(typeof bg.saveRawBacklog).toBe('function');
    });
  });
});
