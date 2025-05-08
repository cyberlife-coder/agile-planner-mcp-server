// Script de debug pour tester l'import du module backlog-generator hors Jest
try {
  const backlogGen = require('../../../server/lib/backlog-generator');
  console.log('✅ Import backlog-generator réussi:', Object.keys(backlogGen));
} catch (err) {
  console.error('❌ Import backlog-generator échoué:', err.message);
  process.exit(1);
}
