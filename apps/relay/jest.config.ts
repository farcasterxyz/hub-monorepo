import type { Config } from "jest";

const jestConfig: Config = {
  testEnvironment: "node",
  coveragePathIgnorePatterns: ["<rootDir>/build/", "<rootDir>/node_modules/"],
  testPathIgnorePatterns: ["<rootDir>/build", "<rootDir>/node_modules"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  /**
   * For high performance with minimal configuration transform with TS with swc.
   * @see https://github.com/farcasterxyz/hub/issues/314
   */
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  maxWorkers: "50%",
};

export default jestConfig;
