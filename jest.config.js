export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapping: {
    '^(\.{1,2}/.*)\.js$': '$1'
  },
  transform: {
    '^.+\.js$': ['babel-jest', { presets: [['@babel/preset-env', { targets: { node: 'current' } }]] }]
  },
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  collectCoverageFrom: [
    'services/forecasting/**/*.js',
    'services/optimization/**/*.js',
    'api/forecasting.js',
    'api/optimization.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  testTimeout: 30000,
  verbose: true
};