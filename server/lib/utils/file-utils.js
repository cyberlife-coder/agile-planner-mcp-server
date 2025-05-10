/**
 * @fileoverview Utilitaires pour la manipulation de fichiers
 * Fournit des fonctions pour sanitizer les noms de fichiers, créer des chemins, etc.
 * 
 * @module utils/file-utils
 */

/**
 * Sanitize un nom de fichier pour qu'il soit valide
 * Remplace les caractères non autorisés par des tirets
 * 
 * @param {string} fileName - Nom de fichier à sanitizer
 * @returns {string} Nom de fichier sanitizé
 */
function sanitizeFileName(fileName) {
  if (!fileName) return 'untitled';
  
  // Remplacer les caractères non-alphanumériques par des tirets (sauf tirets et underscores)
  let sanitized = fileName.toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')  // Remplacer caractères spéciaux par tirets
    .replace(/-+/g, '-')            // Éviter les tirets multiples
    .replace(/^-|-$/g, '');         // Supprimer tirets début/fin
  
  // Éviter les noms vides
  if (!sanitized) {
    sanitized = 'untitled';
  }
  
  // Limiter la longueur
  if (sanitized.length > 64) {
    sanitized = sanitized.substring(0, 64);
  }
  
  return sanitized;
}

/**
 * Génère un identifiant unique basé sur l'horodatage et un préfixe
 * 
 * @param {string} [prefix=''] - Préfixe pour l'identifiant
 * @returns {string} Identifiant unique
 */
function generateUniqueId(prefix = '') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix ? prefix + '-' : ''}${timestamp}-${random}`;
}

/**
 * Assure que le chemin contient la structure de répertoires .agile-planner-backlog
 * 
 * @param {string} basePath - Chemin de base
 * @returns {string} Chemin du répertoire backlog
 */
function ensureBacklogPath(basePath) {
  return basePath.endsWith('.agile-planner-backlog') ? 
    basePath : 
    path.join(basePath, '.agile-planner-backlog');
}

module.exports = {
  sanitizeFileName,
  generateUniqueId,
  ensureBacklogPath
};
