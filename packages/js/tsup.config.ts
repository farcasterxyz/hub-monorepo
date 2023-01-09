import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  splitting: false,
  sourcemap: true,
  skipNodeModulesBundle: false,
  dts: true,
  clean: true,
  format: ['cjs', 'esm'], // generate cjs and esm files
});
