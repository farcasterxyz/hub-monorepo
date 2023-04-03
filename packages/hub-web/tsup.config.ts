import { defineConfig } from 'tsup';

export default defineConfig({
  entryPoints: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  banner: ({ format }) => {
    if (format === 'esm') {
      return { js: 'import { createRequire } from "module";const require = createRequire(import.meta.url);' };
    }
  },
});
