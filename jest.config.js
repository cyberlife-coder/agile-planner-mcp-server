module.exports = {
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
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
};
