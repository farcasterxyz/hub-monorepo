import type { Config } from 'jest';

const jestConfig: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules'],
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
