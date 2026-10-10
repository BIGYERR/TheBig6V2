// @ts-check
// npm run lint: the Angular app (TypeScript and templates) and the Node tooling (scripts/, e2e/). Errors fail.
// The generated legacy script is reported separately by npm run lint:legacy (eslint.legacy.config.mjs), warnings only.
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const globals = require('globals');

module.exports = defineConfig([
  globalIgnores([
    'www/',
    'platforms/',
    'plugins/',
    'node_modules/',
    '.angular/',
    'src/legacy/generated/',
    'public/legacy/',
    'e2e/report/',
  ]),
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ia',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ia',
          style: 'kebab-case',
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
  {
    // Node tooling. e2e files also hold callbacks Puppeteer runs inside the page, so they see browser globals too.
    files: ['scripts/**/*.mjs', 'e2e/**/*.mjs'],
    extends: [eslint.configs.recommended],
    languageOptions: { sourceType: 'module', globals: { ...globals.node } },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-unused-vars': ['error', { args: 'after-used', argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
]);
