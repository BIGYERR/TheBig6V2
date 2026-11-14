// The Expo app's config (MIGRATION.md phase 2). Its own bundle id, com.bigyerr.ironasylum.next, so it installs beside
// today's app (com.bigyerr.ironasylum, frontends/app/config.xml) and never replaces it before cutover. Its version is
// the release version in core/src/version.ts, read here and checked through tests/semver.js, so it never lags core.
// tests/unit/native-shell.test.ts holds both.
//
// The build number is the version too, except in the TestFlight lane (D288, docs/decisions/testflight.md):
// scripts/ios.mjs release hands in the beta's own count as IA_NEXT_BUILD (scripts/testflight.mjs), because a build goes
// up once and the version does not move when only this app changes. The widget target carries the same two numbers
// (@bacons/apple-targets reads them from here), as App Store Connect asks of an extension.
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

/** The lane's build number when it hands one in: a positive whole number, or the config refuses to be read. */
function laneBuild() {
  const given = process.env.IA_NEXT_BUILD;
  if (given === undefined || given === '') return null;
  if (!/^[1-9][0-9]*$/.test(given)) throw new Error(`app.config.js: IA_NEXT_BUILD "${given}" is not a build number`);
  return given;
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
      buildNumber: laneBuild() ?? version,
      supportsTablet: false,
      // The export compliance answer, as today's app gives it in config.xml: no encryption of its own, so TestFlight
      // offers a processed build without a question.
      config: { usesNonExemptEncryption: false },
    },
    // The widget target (targets/RestTimerWidget), added to the generated project on every prebuild.
    plugins: ['@bacons/apple-targets'],
  };
};
module.exports.BUNDLE_ID = BUNDLE_ID;
