import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    testEnvironment: 'node',
    // setupFilesAfterEnv: ['jest-extended/all'],
    moduleNameMapper: {
      '^~/(.*)$': '<rootDir>/src/$1',
    },
  };
};
