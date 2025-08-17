// jest.config.js
module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'lib/**/*.js',
        '!lib/**/node_modules/**',
        '!**/coverage/**',
        '!**/dist/**'
    ],
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: [
        'text',
        'lcov',
        'html'
    ],
    verbose: true
};