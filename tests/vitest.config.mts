// Vitest for the TypeScript feature tests (CLAUDE.md, Test layout). Run from tests/:
//   npx vitest run                          everything: unit, integration and sweeps (what CI runs)
//   npx vitest run unit integration         the part the 60-second check runs
//   npx vitest run integration/rest-timer   one feature
// Each test file runs in its own process (the default forks pool), so a file that patches node:vm or the app's globals
// never reaches another. The golden files in snapshots/ are this suite's own (support/snapshot.ts), not Vitest's.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['unit/**/*.test.ts', 'integration/**/*.test.ts', 'sweeps/**/*.test.ts'],
    environment: 'node',
    pool: 'forks',
    // A test boots the app in the VM, and a sweep builds hundreds of programs: allow for a slow CI machine.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
