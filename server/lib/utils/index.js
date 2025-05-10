/**
 * @fileoverview Module d'utilitaires pour Agile Planner
 * @module utils
 */

/**
 * Crée un slug à partir d'un texte
 * Convertit les espaces et caractères spéciaux en tirets
 * 
 * @param {string} text - Texte à transformer en slug
 * @returns {string} - Slug généré
 */
function createSlug(text) {
  if (!text) return 'untitled';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Remplace les espaces par -
    .replace(/[^\w-]+/g, '')        // Supprime tous les caractères non-word
    .replace(/--+/g, '-')           // Remplace plusieurs - par un seul -
    .replace(/^-+/, '')             // Supprime - au début
    .replace(/-+$/, '');            // Supprime - à la fin
}

/**
 * Crée un slug aléatoire avec un préfixe optionnel
 * 
 * @param {string} [prefix=""] - Préfixe du slug
 * @returns {string} - Slug aléatoire
 */
function createRandomSlug(prefix = "") {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 5);
  return `${prefix ? prefix + '-' : ''}${timestamp}-${randomPart}`;
}

/**
 * Fonction alias pour createSlug pour la compatibilité
 */
const slugify = createSlug;

module.exports = {
  createSlug,
  createRandomSlug,
  slugify
};
