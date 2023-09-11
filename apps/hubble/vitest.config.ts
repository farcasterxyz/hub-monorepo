import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  test: {
    coverage: {
      exclude: ["./build/", "./node_modules/"],
    },
    exclude: ["./build", "./node_modules"],
    globalSetup: "./src/test/globalSetup.js",
    // globalTeardown: "<rootDir>/src/test/globalTeardown.js",
  },
});

export default vitestConfig;
