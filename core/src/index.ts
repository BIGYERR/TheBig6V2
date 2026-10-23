/**
 * @ia/core: Iron Asylum's shared, framework-free TypeScript (docs/architecture-migration.md, section 2.1). The app, the
 * tests and the backend import it as a local package ("@ia/core": "file:../core"). Phase A holds the release version,
 * its label, semver and the first cut of the domain types; phase D moves the engine here.
 */
export { VERSION } from './version.ts';
export { versionLabel } from './format/version-label.ts';
export * as semver from './semver.ts';
export * from './domain/index.ts';
