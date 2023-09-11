import { defineConfig } from "vitest/config";

const vitestConfig = defineConfig({
  test: {
    coverage: {
      exclude: ["<rootDir>/build/", "<rootDir>/node_modules/"],
    },
    exclude: ["<rootDir>/build", "<rootDir>/node_modules"],
  },
});

export default vitestConfig;
