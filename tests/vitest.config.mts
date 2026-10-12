// Vitest for the TypeScript feature tests (CLAUDE.md, Test layout). Run from tests/:
//   npx vitest run                          everything: unit, integration and sweeps (what CI runs)
//   npx vitest run unit integration         the part the 60-second check runs
//   npx vitest run integration/rest-timer   one feature
// Each test file runs in its own process (the default forks pool), so a file that patches node:vm or the app's globals
// never reaches another. The golden files in snapshots/ are this suite's own (support/snapshot.ts), not Vitest's.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    pool: 'forks',
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
