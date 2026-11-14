// Vitest for the TypeScript feature tests (CLAUDE.md, Test layout). Run from tests/:
//   npx vitest run                          everything: unit, integration and sweeps (what CI runs)
//   npx vitest run unit integration         the part the 60-second check runs
//   npx vitest run integration/rest-timer   one feature
// Each test file runs in its own process (the default forks pool), so a file that patches node:vm or the app's globals
// never reaches another. The golden files in snapshots/ are this suite's own (support/snapshot.ts), not Vitest's.
// Before any test, support/global-setup.ts builds the app from its sources into dist-github-pages/, the page every test boots.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const CORE = fileURLToPath(new URL('../core/src/', import.meta.url));

export default defineConfig({
  // Every file compiles against this folder's tsconfig, never the nearest one: the Expo app's extends expo/tsconfig.base,
  // which exists only where that app's packages are installed, and CI's tests job installs none (Post-v0.262.0: the
  // three native-store files failed there before their first test). Core and the tests read the same compile options
  // either way (core/tsconfig.base.json).
  tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)),
  // The Expo app's store and import (frontends/native/src/store) are tested here, and CI's tests job never installs
  // that app's packages: so @ia/core resolves to core/src from those files too, the folder the link here points at.
  resolve: {
    alias: [
      { find: /^@ia\/core$/, replacement: CORE + 'index.ts' },
      { find: /^@ia\/core\/engine\//, replacement: CORE + 'engine/' },
    ],
  },
  test: {
    environment: 'node',
    pool: 'forks',
    globalSetup: ['./support/global-setup.ts'],
    projects: [
      // A unit or integration test boots the app in the VM: allow for a slow CI machine, but a hang still fails fast.
      {
        extends: true,
        test: { name: 'fast', include: ['unit/**/*.test.ts', 'integration/**/*.test.ts'], testTimeout: 60_000, hookTimeout: 60_000 },
      },
      // A sweep builds hundreds or thousands of programs in one test (some take minutes); CI only.
      {
        extends: true,
        test: { name: 'sweeps', include: ['sweeps/**/*.test.ts'], testTimeout: 900_000, hookTimeout: 900_000 },
      },
    ],
  },
});
