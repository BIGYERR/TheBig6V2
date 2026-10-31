/**
 * The release version, MAJOR.MINOR.PATCH, and the one place it lives (docs/architecture-migration.md, section 5).
 *
 * Until the build writes `<meta name="ia-version">` from this constant, the meta is written by hand as well (in
 * frontends/app/src/legacy/src/html/head.html, which the build copies into index.html), and tests/unit/semver.test.ts holds the
 * two equal: a release writes both, or the check is red.
 */
export const VERSION = '0.253.0';
