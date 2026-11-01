// @ts-check
// npm run lint: the server, tests and scripts (TypeScript on Node). Errors fail.
import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/']),
  {
    files: ['server/**/*.ts', 'test/**/*.ts', 'scripts/**/*.ts'],
    extends: [eslint.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
  },
]);
