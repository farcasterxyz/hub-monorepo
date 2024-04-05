import type { Config } from "jest";

const jestConfig: Config = {
  testEnvironment: "node",
  rootDir: "src",
  extensionsToTreatAsEsm: [".ts"],
  /**
   * For high performance with minimal configuration transform with TS with swc.
   * @see https://github.com/farcasterxyz/hubble/issues/314
   */
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
};

export default jestConfig;
