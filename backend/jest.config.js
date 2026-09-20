/** @type { import('ts-jest').JestConfigWithTsJest } */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/test/**/*.test.ts', '**/?(*.)+(spec|test).+(ts|js)'],
    testPathIgnorePatterns: ['./test/mock.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transform: {
        '^.+\\.(ts |tsx)$': 'ts-jest',
    }
}