// ESLint configuration for Agile Planner MCP Server (Wave 8)
// Compatible with ESLint v9+

// ESLint flat config for Agile Planner MCP Server (Wave 8)
// Compatible with ESLint v9+

// ESLint flat config for Agile Planner MCP Server (Wave 8)
// Compatible with ESLint v9+

const jsGlobals = require('globals');

/**
 * Note: Les configs 'eslint:recommended' et 'plugin:jest/recommended' ne peuvent plus être importées directement en flat config.
 * Ajoutez-les manuellement si nécessaire lors d'une future migration.
 */
module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...jsGlobals.node,
        ...jsGlobals.es2021,
        ...jsGlobals.jest
      }
    },
    plugins: {
      jest: require('eslint-plugin-jest')
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'max-lines': ['warn', 500],
      'max-lines-per-function': ['warn', 50],
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error'
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'examples/',
      '*.md',
      'todo/'
    ]
  }
];

