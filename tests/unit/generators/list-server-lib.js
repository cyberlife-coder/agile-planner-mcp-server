// Script pour lister tous les fichiers du dossier server/lib et afficher leur nom exact
const fs = require('fs');
const path = require('path');

const libDir = path.resolve(__dirname, '../../server/lib');
console.log('Contenu du dossier server/lib :');
fs.readdirSync(libDir).forEach(file => {
  const stat = fs.statSync(path.join(libDir, file));
  console.log(file + (stat.isDirectory() ? ' [DIR]' : ''));
});
