module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
