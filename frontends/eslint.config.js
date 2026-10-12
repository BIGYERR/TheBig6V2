// @ts-check
// npm run lint: the website, the admin and common/ (TypeScript and templates), and this file. Errors fail. Same rule
// sets as app/eslint.config.js; the app is its own package and lints itself.
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/', '.angular/', 'app/', 'website/public/']),
  {
    files: ['admin/**/*.ts', 'website/**/*.ts', 'common/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'ia', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'ia', style: 'kebab-case' }],
    },
  },
  {
    files: ['admin/**/*.html', 'website/**/*.html', 'common/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    files: ['eslint.config.js'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
    rules: { eqeqeq: ['error', 'smart'] },
  },
]);
