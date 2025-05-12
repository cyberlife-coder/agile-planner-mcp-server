/**
 * @fileoverview Script de test pour vérifier la validité de la clé API OpenAI
 * Permet de tester rapidement si la clé API configurée dans .env est valide et fonctionnelle
 * 
 * Usage: node server/test_openai_key.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const https = require('https');
const chalk = require('chalk'); // Utilisation de chalk pour améliorer la lisibilité des logs

/**
 * Vérifie la présence et le format de la clé API OpenAI
 * @returns {string} La clé API valide
 * @throws {Error} Si la clé est absente
 */
function verifyApiKey() {
  console.log(chalk.blue('🔑 Test de la clé API OpenAI...'));
  
  // Vérification de la présence de la clé
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(chalk.red('❌ OPENAI_API_KEY absente dans le fichier .env'));
    console.log(chalk.yellow('ℹ️ Assurez-vous d\'avoir créé un fichier .env à la racine du projet avec OPENAI_API_KEY=votre_clé'));
    process.exit(1);
  }
  
  console.log(chalk.green('✓ OPENAI_API_KEY trouvée dans les variables d\'environnement'));
  console.log(chalk.yellow(`ℹ️ Premiers caractères de la clé: ${apiKey.slice(0, 5)}...${apiKey.slice(-4)}`));
  
  return apiKey;
}

/**
 * Prépare les options pour la requête à l'API OpenAI
 * @param {string} apiKey - La clé API OpenAI
 * @returns {Object} Options et données pour la requête
 */
function prepareRequestOptions(apiKey) {
  // Préparation de la requête test minimaliste
  const data = JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'system', content: 'ping' }, { role: 'user', content: 'ping' }],
    max_tokens: 5
  });
  
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(data)
    }
  };
  
  return { options, data };
}

/**
 * Traite la réponse de l'API OpenAI
 * @param {Object} res - Réponse HTTP
 * @param {string} body - Corps de la réponse
 * @param {Function} resolve - Fonction de résolution Promise
 * @param {Function} reject - Fonction de rejet Promise
 */
function handleApiResponse(res, body, resolve, reject) {
  try {
    // Analyse de la réponse
    const statusCode = res.statusCode;
    const isSuccess = statusCode >= 200 && statusCode < 300;
    
    if (isSuccess) {
      console.log(chalk.green(`✅ Connexion réussie! (Status: ${statusCode})`));
      console.log(chalk.green('✅ Clé API OpenAI valide et fonctionnelle'));
      const parsedResponse = JSON.parse(body);
      console.log(chalk.dim('Réponse du modèle:'), 
        parsedResponse?.choices?.[0]?.message?.content ?? '[Pas de contenu]');
    } else {
      console.error(chalk.red(`❌ Erreur lors de la requête (Status: ${statusCode})`));
      console.error(chalk.red('Détails:'), body);
    }
    
    resolve();
  } catch (error) {
    console.error(chalk.red('❌ Erreur lors du traitement de la réponse:'), error.message);
    reject(new Error(`Erreur lors du traitement de la réponse: ${error.message}`));
  }
}

/**
 * Vérifie et valide la clé API OpenAI en effectuant une requête de test
 * @returns {Promise<void>}
 */
async function testOpenAIKey() {
  // 1. Vérifier la clé API
  const apiKey = verifyApiKey();
  
  // 2. Préparer la requête
  const { options, data } = prepareRequestOptions(apiKey);
  
  // 3. Envoyer la requête et traiter la réponse
  return new Promise((resolve, reject) => {
    console.log(chalk.blue('🔄 Envoi d\'une requête test à l\'API OpenAI...'));
    
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => handleApiResponse(res, body, resolve, reject));
    });
    
    req.on('error', error => {
      console.error(chalk.red('❌ Erreur de connexion:'), error.message);
      reject(new Error(`Erreur de connexion à l'API OpenAI: ${error.message}`));
    });
    
    req.write(data);
    req.end();
  });
}

// Exécution du test
testOpenAIKey()
  .catch(error => {
    console.error(chalk.red('Une erreur est survenue:'), error);
    process.exit(1);
  });
