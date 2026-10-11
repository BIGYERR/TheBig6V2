// @ts-check
// npm run lint: the admin UI and the website (TypeScript and templates), the server and tests (Node), and the
// app-side snippet (a classic browser script). Errors fail. Same rule sets as app/eslint.config.js.
import eslint from '@eslint/js';
import angular from 'angular-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const nodeRules = {
  eqeqeq: ['error', 'smart'],
  // ignoreRestSiblings: `const { rtt, online, ...rest } = d` is how a field is left out of a response.
  'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
};

export default defineConfig([
  globalIgnores(['node_modules/', 'dist/', '.angular/', 'data/', 'app-web/', 'site/public/']),
  {
    files: ['admin/**/*.ts', 'site/**/*.ts'],
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
    files: ['admin/**/*.html', 'site/**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
  },
  {
    files: ['server/**/*.js', 'test/**/*.js', 'scripts/**/*.mjs', 'eslint.config.js'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
    rules: nodeRules,
  },
  {
    // Pasted into index.html's one inline script: a classic script whose top-level names are globals by design,
    // written in that file's idiom (`catch (e) {}`), reading IA_VERSION, which index.html defines.
    files: ['client/**/*.js'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'script', globals: { ...globals.browser, IA_VERSION: 'readonly' } },
    rules: { ...nodeRules, 'no-unused-vars': ['error', { vars: 'local', args: 'after-used', caughtErrors: 'none' }] },
  },
]);
