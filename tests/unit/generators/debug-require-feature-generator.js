// Script de debug pour tester l'import du module feature-generator hors Jest
try {
  const featureGen = require('../../../server/lib/feature-generator');
  console.log('✅ Import réussi:', Object.keys(featureGen));
} catch (err) {
  console.error('❌ Import échoué:', err.message);
  process.exit(1);
}
