import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules'],
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
