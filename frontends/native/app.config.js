// The Expo app's config (MIGRATION.md phase 2). Its own bundle id, com.bigyerr.ironasylum.next, so it installs beside
// today's app (com.bigyerr.ironasylum, frontends/app/config.xml) and never replaces it before cutover. Its version is
// the release version in core/src/version.ts, read here and checked through tests/semver.js, so it never lags core.
// tests/unit/native-shell.test.ts holds both.
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const SV = require('../../tests/semver.js');

const BUNDLE_ID = 'com.bigyerr.ironasylum.next';

function coreVersion() {
  const text = readFileSync(join(__dirname, '..', '..', 'core', 'src', 'version.ts'), 'utf8');
  const m = text.match(/export const VERSION = '([^']+)'/);
  if (!m) throw new Error('app.config.js: no VERSION in core/src/version.ts');
  return SV.str(SV.parse(m[1]));
}

module.exports = () => {
  const version = coreVersion();
  return {
    name: 'IA Next',
    slug: 'iron-asylum-next',
    version,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: BUNDLE_ID,
      buildNumber: version,
      supportsTablet: false,
    },
  };
};
module.exports.BUNDLE_ID = BUNDLE_ID;
