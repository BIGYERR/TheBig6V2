/**
 * The release version, MAJOR.MINOR.PATCH, and the one place it lives (docs/architecture-migration.md, section 5).
 *
 * Until phase B makes the build write `<meta name="ia-version">` from this constant, the meta in index.html is written by
 * hand as well, and tests/unit/semver.test.ts holds the two equal: a release writes both, or the check is red.
 */
export const VERSION = '0.239.1';
