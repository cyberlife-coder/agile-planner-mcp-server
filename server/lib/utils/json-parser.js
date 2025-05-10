/**
 * Utilitaire pour le parsing robuste des réponses JSON des LLMs
 * Version simplifiée qui gère les formats markdown et autres anomalies courantes
 */

const chalk = require('chalk');

/**
 * Parse une réponse API qui peut contenir du JSON encapsulé dans un format markdown
 * @param {string} content - Le contenu brut à parser
 * @param {boolean} debug - Activer les logs de debug
 * @returns {Object} - L'objet JSON parsé
 * @throws {Error} - Si le parsing échoue
 */
function parseJsonResponse(content, debug = false) {
  if (!content) {
    throw new Error('Contenu vide');
  }

  if (debug) {
    console.log(chalk.blue('🔍 Tentative de parsing JSON...'));
    console.log(chalk.gray(`Début du contenu: ${content.substring(0, 100)}...`));
  }

  // Cas 1: Le contenu est déjà du JSON valide
  try {
    return JSON.parse(content);
  } catch (error) {
    if (debug) {
      console.log(chalk.yellow('Contenu non parsable directement, nettoyage...'));
    }
  }

  // Cas 2: Le contenu contient un bloc markdown JSON
  if (content.includes('```json') || content.includes('```')) {
    if (debug) {
      console.log(chalk.blue('Délimiteurs markdown détectés, extraction du bloc JSON...'));
    }
    
    // Extraire le contenu entre délimiteurs markdown
    const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
    const match = content.match(jsonBlockRegex);
    
    if (match && match[1]) {
      try {
        const result = JSON.parse(match[1]);
        if (debug) {
          console.log(chalk.green('✅ JSON extrait et parsé avec succès depuis le bloc markdown'));
        }
        return result;
      } catch (error) {
        if (debug) {
          console.log(chalk.yellow(`Échec du parsing du bloc markdown: ${error.message}`));
        }
      }
    }
  }

  // Cas 3: Dernier recours - extraire tout ce qui ressemble à un objet JSON
  if (debug) {
    console.log(chalk.blue('Recherche d\'un objet JSON dans le contenu...'));
  }
  
  const jsonObjectRegex = /(\{[\s\S]*\})/;
  const objectMatch = content.match(jsonObjectRegex);
  
  if (objectMatch && objectMatch[1]) {
    try {
      const result = JSON.parse(objectMatch[1]);
      if (debug) {
        console.log(chalk.green('✅ Objet JSON extrait et parsé avec succès'));
      }
      return result;
    } catch (error) {
      if (debug) {
        console.log(chalk.red(`Échec du parsing de l'objet extrait: ${error.message}`));
      }
    }
  }

  // Échec du parsing
  throw new Error(`Impossible de trouver un JSON valide dans la réponse: ${content.substring(0, 50)}...`);
}

module.exports = {
  parseJsonResponse
};
