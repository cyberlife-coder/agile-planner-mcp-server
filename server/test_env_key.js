/**
 * @fileoverview Script de vérification des clés API dans les variables d'environnement
 * Vérifie la présence des clés API requises dans le fichier .env
 * 
 * Usage: node server/test_env_key.js
 */

'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const chalk = require('chalk');

/**
 * Configuration des clés API à vérifier
 * @type {Array<{name: string, required: boolean, urlDoc: string}>}
 */
const API_KEYS_CONFIG = [
  { 
    name: 'OPENAI_API_KEY', 
    required: true, 
    urlDoc: 'https://platform.openai.com/api-keys' 
  },
  { 
    name: 'GROQ_API_KEY', 
    required: false, 
    urlDoc: 'https://console.groq.com/keys' 
  },
  { 
    name: 'CLAUDE_API_KEY', 
    required: false, 
    urlDoc: 'https://console.anthropic.com/settings/keys' 
  }
];

/**
 * Affiche les informations d'une clé API présente dans l'environnement
 * @param {string} name - Nom de la clé API
 * @param {string} keyValue - Valeur de la clé API
 */
function displayFoundKey(name, keyValue) {
  // Masquer la clé tout en montrant quelques caractères pour débogage
  const maskedKey = keyValue.length > 10 
    ? `${keyValue.slice(0, 5)}...${keyValue.slice(-4)}` 
    : '***';
  
  console.log(
    chalk.green(`✓ ${name}: `),
    chalk.dim('[TROUVÉE]'),
    chalk.yellow(`ℹ️ Valeur: ${maskedKey}`)
  );
}

/**
 * Affiche les informations d'une clé API manquante
 * @param {string} name - Nom de la clé API
 * @param {boolean} required - Si la clé est requise
 * @param {string} urlDoc - URL de documentation pour obtenir la clé
 */
function displayMissingKey(name, required, urlDoc) {
  // Colorier différemment selon si la clé est requise ou optionnelle
  const statusColor = required ? chalk.red : chalk.yellow;
  const statusText = required ? '[MANQUANTE - REQUISE]' : '[MANQUANTE - OPTIONNELLE]';
  
  console.log(
    statusColor(`${required ? '❌' : '⚠️'} ${name}: `),
    statusColor(statusText)
  );
  
  // Ajouter des instructions pour obtenir la clé
  console.log(
    chalk.dim(`   Pour obtenir cette clé: ${urlDoc}`)
  );
}

/**
 * Vérifie la présence et la validité basique des clés API
 * @returns {Object} Résultat de la vérification avec le nombre de clés trouvées/manquantes
 */
function checkApiKeys() {
  console.log(chalk.blue('\n🔑 Vérification des clés API dans les variables d\'environnement...\n'));
  
  const results = {
    found: 0,
    missing: 0,
    required: 0,
    optional: 0,
    missingRequired: 0
  };
  
  // Vérification des clés API
  API_KEYS_CONFIG.forEach(keyConfig => {
    const { name, required, urlDoc } = keyConfig;
    const keyValue = process.env[name];
    const keyExists = !!keyValue;
    
    // Compter pour les statistiques
    if (required) results.required++;
    else results.optional++;
    
    if (keyExists) {
      results.found++;
      displayFoundKey(name, keyValue);
    } else {
      results.missing++;
      if (required) results.missingRequired++;
      displayMissingKey(name, required, urlDoc);
    }
    
    console.log(''); // Ligne vide pour espacement
  });
  
  return results;
}

/**
 * Affiche un résumé des résultats de la vérification
 * @param {Object} results Résultats de la vérification
 */
function displaySummary(results) {
  console.log(chalk.blue('\n📈 Résumé de la vérification:'));
  console.log(`• Total des clés vérifiées: ${results.required + results.optional}`);
  console.log(`• Clés trouvées: ${results.found}`);
  console.log(`• Clés manquantes: ${results.missing} (${results.missingRequired} requise(s), ${results.missing - results.missingRequired} optionnelle(s))`);
  
  if (results.missingRequired > 0) {
    console.log(chalk.red('\n❌ Certaines clés requises sont manquantes. Le projet pourrait ne pas fonctionner correctement.'));
    console.log(chalk.yellow('ℹ️ Ajoutez les clés manquantes dans le fichier .env à la racine du projet.\n'));
  } else {
    console.log(chalk.green('\n✅ Toutes les clés requises sont présentes.\n'));
  }
}

// Exécution principale
const results = checkApiKeys();
displaySummary(results);

// Code de sortie basé sur la présence des clés requises
if (results.missingRequired > 0) {
  process.exit(1);
}
