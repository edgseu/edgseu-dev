import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-*/**',
      'dist-empty/**',
      'node_modules/**',
      '.astro/**',
      'artifacts/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs.recommended,
  {
    rules: {
      // Build-time scripts intentionally use process.exit() and top-level awaits.
      'no-console': 'off',
    },
  },
);
