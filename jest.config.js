module.exports = {
  // Configuration centralisée des tests (TDD Wave 8)
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  
  // Alias pour groq-sdk, redirige vers openai en tests
  moduleNameMapper: {
    '^groq-sdk$': 'openai'
  },
  testEnvironment: 'node',
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/*.test.js',
    '!**/node_modules/**'
  ],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  // Utiliser une seule stratégie de reset pour éviter les conflits
  clearMocks: true,
  // Ne pas restaurer les implémentations manuelles
  restoreMocks: false,
  // Ne pas réinitialiser automatiquement les mocks entre les tests
  resetMocks: false
};
