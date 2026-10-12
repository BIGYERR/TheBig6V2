// npm run lint:legacy: a report on the app script generated from the root index.html (public/legacy/app.js).
// Every rule is a warning, so the report never fails a build: the script is the live app and changes only through
// the repo's own build process (handoff, rulings, gates), never through a lint fix here.
//
// It is a classic browser script, so its top-level declarations are globals that the markup's inline handlers call;
// no-unused-vars therefore checks local scope only ("vars: local"), or every handler would read as unused.
import js from '@eslint/js';
import globals from 'globals';

const asWarnings = (rules) =>
  Object.fromEntries(Object.entries(rules).map(([name, setting]) => [name, Array.isArray(setting) ? ['warn', ...setting.slice(1)] : 'warn']));

export default [
  {
    files: ['public/legacy/app.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: {
      ...asWarnings(js.configs.recommended.rules),
      'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-redeclare': ['warn', { builtinGlobals: false }],
      eqeqeq: ['warn', 'smart'],
    },
  },
];
