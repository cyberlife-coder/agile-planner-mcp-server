/**
 * Utilités partagées pour la génération de markdown
 * @module markdown/utils
 */

const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

// Instructions markdown partagées
const markdownInstructions = {
  epicFileInstructions: `Ce document est généré par Agile Planner et contient des informations sur un Epic.
Les User Stories associées se trouvent dans les sous-dossiers.
Vous pouvez explorer le backlog complet en naviguant dans les liens.`,

  featureFileInstructions: `Ce document est généré par Agile Planner et contient des informations sur une Feature.
Les User Stories associées se trouvent dans les sous-dossiers.
Vous pouvez explorer le backlog complet en naviguant dans les liens.`,

  userStoryFileInstructions: `Ce document est généré par Agile Planner et contient des informations sur une User Story.
Consultez les sections Acceptance Criteria et Technical Tasks pour comprendre les exigences.`,

  iterationFileInstructions: `Ce document est généré par Agile Planner et contient des informations sur une Itération.
Il liste les User Stories à compléter dans cette itération.
Vous pouvez accéder aux User Stories en cliquant sur les liens.`,

  mvpFileInstructions: `Ce document est généré par Agile Planner et définit le Minimum Viable Product (MVP).
Il regroupe les User Stories essentielles pour une première version fonctionnelle.
Vous pouvez accéder aux User Stories en cliquant sur les liens.`
};

/**
 * Crée un slug à partir d'un titre pour une utilisation dans les chemins de fichiers
 * @param {string} title - Titre à convertir en slug
 * @returns {string} - Slug généré
 */
function createSlug(title) {
  // Protection contre les valeurs null ou undefined
  if (!title) {
    console.warn(chalk.yellow("⚠️ Tentative de création d'un slug avec une valeur undefined ou null. Utilisation d'un slug par défaut."));
    return 'untitled-item';
  }
  
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-')     // Remplace les espaces par des tirets
    .replace(/-+/g, '-');     // Supprime les tirets multiples
}

/**
 * Lance un message d'erreur formaté et renvoie l'erreur
 * @param {string} message - Message d'erreur
 * @param {Error} error - Objet erreur original (optionnel)
 * @returns {Error} - Erreur formatée
 */
function handleMarkdownError(message, error = null) {
  const errorMessage = error ? `${message}: ${error.message}` : message;
  console.error(chalk.red(`❌ ${errorMessage}`));
  return new Error(errorMessage);
}

module.exports = {
  createSlug,
  handleMarkdownError,
  markdownInstructions
};
