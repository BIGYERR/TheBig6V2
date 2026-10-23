// Vitest's global setup (vitest.config.mts): before any test runs, the app is built from its source files into
// dist-github-pages/ (frontends/app/scripts/build-index.mjs, writePages), the page support/app.ts boots. So every run
// tests the sources as they stand, with no build step to forget. IA_APP names another body of the app and is left alone.
import { writePages } from '../../frontends/app/scripts/build-index.mjs';

export function setup(): void {
  if (process.env['IA_APP']) return;
  writePages();
}
