console.log('process.cwd() =', process.cwd());
console.log('__dirname =', __dirname);
const path = require('path');
console.log('Résolution ../../server/lib/feature-generator.js =', path.resolve(__dirname, '../../server/lib/feature-generator.js'));
