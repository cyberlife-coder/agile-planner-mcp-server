/**
 * Utilitaires pour les tests MCP
 * 
 * Ce module fournit des fonctions utilitaires pour les tests MCP, notamment :
 * - Gestion des processus child_process
 * - Mécanismes de nettoyage automatique
 * - Formatage et parsing des messages JSON-RPC
 * 
 * @module tests/utils/mcp-test-utils
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Exécute une commande MCP avec une entrée JSON
 * et retourne la réponse JSON
 * 
 * @param {Object} jsonInput - Objet JSON à envoyer au processus MCP
 * @param {Object} options - Options supplémentaires
 * @param {number} options.timeout - Timeout en ms (défaut: 30000)
 * @param {boolean} options.debug - Activer le mode debug
 * @param {string} options.cwd - Répertoire de travail
 * @returns {Promise<{jsonResponse: Object, stderr: string, process: ChildProcess}>}
 */
async function runMcpCommand(jsonInput, options = {}) {
  const {
    timeout = 30000,
    debug = false,
    cwd = process.cwd()
  } = options;

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if (child && !child.killed) {
        child.kill('SIGKILL');
      }
      reject(new Error(`MCP command timed out after ${timeout}ms`));
    }, timeout);

    if (debug) {
      console.log('⏳ Exécution commande MCP avec input:', JSON.stringify(jsonInput, null, 2));
    }
    
    const child = spawn('node', ['server/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd,
      env: {
        ...process.env,
        MCP_EXECUTION: 'true',
        DEBUG: debug ? 'true' : undefined,
        NODE_ENV: 'test'
      }
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      if (debug) console.log(`[MCP STDOUT] ${chunk}`);
    });
    
    child.stderr.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      if (debug) console.log(`[MCP STDERR] ${chunk}`);
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to spawn MCP process: ${error.message}`));
    });
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      
      if (debug) {
        console.log(`ℹ️ MCP process exited with code ${code}`);
        console.log('📃 STDOUT length:', stdout.length);
        if (stderr) console.log('⚠️ STDERR:', stderr);
      }
      
      if (code !== 0) {
        return reject(new Error(`MCP process exited with code ${code}\nSTDERR: ${stderr}`));
      }
      
      try {
        // Parser la réponse JSON
        const jsonResponse = parseJsonResponse(stdout);
        if (debug) console.log('✅ Réponse JSON parsée avec succès');
        
        resolve({ 
          jsonResponse, 
          stderr,
          process: child 
        });
      } catch (error) {
        console.error('❌ Erreur parsing JSON:', error.message);
        console.log('📦 Début stdout:', stdout.substring(0, 50));
        console.log('📦 Fin stdout:', stdout.substring(stdout.length - 50));
        reject(new Error(`Failed to parse MCP response: ${error.message}\nOutput was: ${stdout.substring(0, 500)}`));
      }
    });
    
    // Envoyer la requête JSON à stdin
    child.stdin.write(JSON.stringify(jsonInput));
    child.stdin.end();
  });
}

/**
 * Tente de parser une réponse JSON depuis une chaîne qui peut contenir
 * d'autres informations (logs, etc.)
 * 
 * @param {string} rawOutput - La sortie brute du processus MCP
 * @returns {Object} - L'objet JSON parsé
 */
function parseJsonResponse(rawOutput) {
  // Nettoyer la sortie
  const cleaned = rawOutput.trim();
  
  // Essayer d'extraire un objet JSON
  const jsonMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (jsonMatch && jsonMatch[1]) {
    return JSON.parse(jsonMatch[1]);
  }
  
  // Si on ne trouve pas de correspondance, essayer de parser toute la sortie
  return JSON.parse(cleaned);
}

/**
 * Crée un environnement de test temporaire pour les tests MCP
 * 
 * @param {Object} options - Options de configuration
 * @param {string} options.prefix - Préfixe pour le répertoire temporaire
 * @param {boolean} options.cleanup - Nettoyer le répertoire après les tests
 * @returns {Object} - Informations sur l'environnement de test
 */
function setupMcpTestEnvironment(options = {}) {
  const {
    prefix = 'mcp-test',
    cleanup = true
  } = options;
  
  // Créer un répertoire temporaire unique
  const timestamp = Date.now();
  const outputDir = path.join('.agile-planner-backlog', `${prefix}-${timestamp}`);
  
  // Créer la structure de base
  fs.ensureDirSync(outputDir);
  
  return {
    outputDir,
    
    // Fonction de nettoyage
    cleanup: async () => {
      if (cleanup && fs.existsSync(outputDir)) {
        await fs.remove(outputDir);
      }
    }
  };
}

/**
 * Force la fermeture d'un processus et attend sa terminaison
 * 
 * @param {ChildProcess} process - Le processus à terminer
 * @param {Object} options - Options supplémentaires
 * @param {number} options.signal - Signal à envoyer (défaut: SIGTERM)
 * @param {number} options.timeout - Timeout avant SIGKILL (défaut: 500ms)
 * @returns {Promise<void>}
 */
async function terminateProcess(process, options = {}) {
  const {
    signal = 'SIGTERM',
    timeout = 500
  } = options;
  
  if (!process || process.killed) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    // Fermer le processus normalement
    process.kill(signal);
    
    // Attendre que le processus se termine
    const killTimeout = setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
      resolve();
    }, timeout);
    
    process.on('exit', () => {
      clearTimeout(killTimeout);
      resolve();
    });
  });
}

module.exports = {
  runMcpCommand,
  parseJsonResponse,
  setupMcpTestEnvironment,
  terminateProcess
};
