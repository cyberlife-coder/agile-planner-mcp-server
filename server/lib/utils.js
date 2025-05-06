/**
 * Utilitaires communs pour l'Agile Planner
 */

const slugify = require('slugify');

/**
 * Crée un slug à partir d'un texte
 * Un slug est une chaîne de caractères sans espaces, sans caractères spéciaux,
 * et en minuscules, utilisable dans une URL ou un nom de fichier
 * 
 * @param {string} text - Le texte à slugifier
 * @returns {string} - Le slug généré
 */
function createSlug(text) {
  return slugify(text, {
    lower: true,
    strict: true,
    replacement: '-',
    remove: /[*+~.()'"!:@]/g
  });
}

module.exports = {
  createSlug
};
