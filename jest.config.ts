import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleNameMapper: {
      '^~/(.*)$': '<rootDir>/src/$1',
    },
    coveragePathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
    testPathIgnorePatterns: ['<rootDir>/build', '<rootDir>/node_modules'],
  };
};
