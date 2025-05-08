const fs = require('fs');
const path = require('path');

const absPath = path.resolve(__dirname, '../../server/lib/feature-generator.js');
console.log('Chemin absolu utilisé :', absPath);

console.log('Contenu du dossier :', fs.readdirSync(path.dirname(absPath)));

try {
  const mod = require(absPath);
  console.log('✅ Import absolu réussi:', Object.keys(mod));
} catch (err) {
  console.error('❌ Import absolu échoué:', err.message);
  process.exit(1);
}
