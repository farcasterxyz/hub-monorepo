import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
  input: 'build/cli.js',
  output: {
    file: 'rollup-bundle.js',
    format: 'cjs', // immediately-invoked function expression — suitable for <script> tags
  },
  plugins: [
    resolve(), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    json(),
  ],
};
