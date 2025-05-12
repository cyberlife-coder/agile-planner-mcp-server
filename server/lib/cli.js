/**
 * Module CLI pour AgilePlanner - Génération d'artifacts agiles via CLI
 * 
 * @fileoverview Point d'entrée de compatibilité qui redirige vers la nouvelle structure modulaire.
 * Ce fichier existe pour maintenir la rétro-compatibilité avec le code existant.
 * Pour les nouveaux développements, utilisez directement les modules dans le dossier cli/.
 * 
 * @module cli
 * @deprecated Utilisez la nouvelle structure modulaire dans ./cli/
 */

'use strict';

const chalk = require('chalk');

console.error(chalk.yellow('\n🔍 Utilisation du module cli.js de compatibilité'));

// Importer le nouveau module CLI modularisé
const cli = require('./cli/index');

console.error(chalk.green('✅ Module CLI modularisé importé avec succès\n'));

// Ces exports explicites sont maintenus pour la compatibilité avec le code existant
// qui pourrait importer spécifiquement ces fonctions
module.exports = {
  ...cli, // Exporter toutes les fonctions et sous-modules du module cli
  runInteractiveCLI: cli.runInteractiveCLI,
  startCLI: cli.startCLI,
  createEnvFile: cli.utils.createEnvFile,
  generateBacklogCLI: cli.generateBacklogCLI,
  generateFeatureCLI: cli.generateFeatureCLI
};

// Log de confirmation pour aider au débogage
if (process.env.DEBUG_CLI) {
  console.error(chalk.blue('Module CLI exporté avec les fonctions :'), 
    Object.keys(module.exports).filter(k => typeof module.exports[k] === 'function').join(', '));
}
