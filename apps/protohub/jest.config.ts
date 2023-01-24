import type { Config } from 'jest';

const jestConfig: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^(.+)_generated.js$': '$1_generated', // Support flatc generated files
  },
  coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/', '<rootDir>/src/flatbuffers/generated/'],
  testPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules', '<rootDir>/src/flatbuffers/generated/'],
  extensionsToTreatAsEsm: ['.ts'],
  /**
   * For high performance with minimal configuration transform with TS with swc.
   * @see https://github.com/farcasterxyz/hub/issues/314
   */
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};

export default jestConfig;
