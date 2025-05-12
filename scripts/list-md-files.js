/**
 * Script pour lister tous les fichiers markdown (.md) du projet
 * 
 * Ce script identifie tous les fichiers markdown (.md) dans le projet,
 * les trie par taille et date de modification, et affiche un rapport complet.
 * 
 * Usage: node scripts/list-md-files.js [--details]
 * Options:
 *   --details: Affiche des informations détaillées sur chaque fichier
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Répertoires à exclure de la recherche
const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', 'coverage'];

/**
 * Trouve récursivement tous les fichiers markdown dans un répertoire
 * @param {string} dir - Répertoire de départ
 * @param {Array} results - Tableau pour stocker les résultats
 * @returns {Promise<Array>} - Liste des fichiers markdown
 */
async function findMarkdownFiles(dir, results = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Ignorer les répertoires exclus
        if (!EXCLUDED_DIRS.includes(entry.name)) {
          await findMarkdownFiles(fullPath, results);
        }
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.md') {
        const fileStats = await stat(fullPath);
        results.push({
          path: fullPath,
          size: fileStats.size,
          modified: fileStats.mtime,
          created: fileStats.birthtime
        });
      }
    }
  } catch (err) {
    console.error(`Erreur lors de la lecture du répertoire ${dir}:`, err);
  }
  
  return results;
}

/**
 * Formate la taille du fichier en unités lisibles
 * @param {number} bytes - Taille en octets
 * @returns {string} - Taille formatée
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Point d'entrée principal
 */
async function main() {
  const showDetails = process.argv.includes('--details');
  const projectRoot = path.resolve(__dirname, '..');
  console.log(`Recherche de fichiers markdown dans: ${projectRoot}`);
  
  const mdFiles = await findMarkdownFiles(projectRoot);
  
  // Tri par taille (décroissant)
  const sortedBySize = [...mdFiles].sort((a, b) => b.size - a.size);
  
  // Tri par date de modification (plus récent d'abord)
  const sortedByDate = [...mdFiles].sort((a, b) => b.modified - a.modified);
  
  console.log(`\n${mdFiles.length} fichiers markdown trouvés.\n`);
  
  // Statistiques globales
  const totalSize = mdFiles.reduce((acc, file) => acc + file.size, 0);
  console.log(`Taille totale: ${formatFileSize(totalSize)}`);
  
  // Afficher les 10 plus gros fichiers
  console.log('\n== Top 10 des plus gros fichiers ==');
  sortedBySize.slice(0, 10).forEach((file, i) => {
    console.log(`${i + 1}. ${file.path.replace(projectRoot + path.sep, '')} (${formatFileSize(file.size)})`);
  });
  
  // Afficher les 10 fichiers les plus récemment modifiés
  console.log('\n== Top 10 des fichiers les plus récemment modifiés ==');
  sortedByDate.slice(0, 10).forEach((file, i) => {
    console.log(`${i + 1}. ${file.path.replace(projectRoot + path.sep, '')} (${file.modified.toISOString().split('T')[0]})`);
  });
  
  // Afficher des détails sur tous les fichiers si demandé
  if (showDetails) {
    console.log('\n== Liste complète des fichiers ==');
    mdFiles.forEach((file, i) => {
      const relativePath = file.path.replace(projectRoot + path.sep, '');
      console.log(`${i + 1}. ${relativePath}`);
      console.log(`   Taille: ${formatFileSize(file.size)}`);
      console.log(`   Modifié: ${file.modified.toISOString()}`);
      console.log(`   Créé: ${file.created.toISOString()}`);
      console.log('');
    });
  } else {
    console.log('\nUtilisez l\'option --details pour afficher des informations complètes sur tous les fichiers.');
  }
  
  // Groupement par répertoire
  const dirCounts = {};
  mdFiles.forEach(file => {
    const dir = path.dirname(file.path).replace(projectRoot + path.sep, '');
    dirCounts[dir] = (dirCounts[dir] || 0) + 1;
  });
  
  console.log('\n== Répartition par répertoire ==');
  Object.entries(dirCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([dir, count]) => {
      console.log(`${dir || '.'}: ${count} fichier(s)`);
    });
}

// Exécuter le script
main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
