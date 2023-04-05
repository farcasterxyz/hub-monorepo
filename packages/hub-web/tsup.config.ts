import { defineConfig } from 'tsup';

export default defineConfig({
  target: ['chrome58', 'edge16', 'firefox57', 'safari11'],
  entryPoints: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
});
