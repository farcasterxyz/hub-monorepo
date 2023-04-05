import { defineConfig } from 'tsup';

export default defineConfig({
  target: ['node14'],
  entryPoints: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  shims: true,
});
