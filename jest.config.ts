import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testTimeout: 30000,
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^(.+)_generated.js$': '$1_generated.ts', // Support flatc generated files
  },
  coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/', '<rootDir>/src/utils/generated/'],
  testPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules', '<rootDir>/src/utils/generated/'],
  // transform ts files with ts-jest and enable ESM
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        useESM: true,
      },
    ],
  },
};

export default jestConfig;
