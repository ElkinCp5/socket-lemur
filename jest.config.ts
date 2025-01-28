import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'], // Ruta de los tests
    moduleFileExtensions: ['ts', 'js'],
    collectCoverage: true,
    coverageDirectory: './coverage',
    verbose: true,
};

export default config;
