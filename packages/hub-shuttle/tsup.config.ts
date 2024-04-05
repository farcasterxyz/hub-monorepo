import { defineConfig } from "tsup";

export default defineConfig({
  target: ["node14", "chrome79", "edge109", "firefox102", "safari12"],
  entryPoints: ["./src/**/*.ts"],
  esbuildOptions(options, context) {
    options.outbase = "./";
  },
  bundle: false,
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  shims: true,
});
