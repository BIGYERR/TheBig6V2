// When a simulator build may skip `expo prebuild` and its pod install (`node scripts/ios.mjs build|sim --fast`).
// ios/ is generated from the files named here. scripts/ios.mjs writes their digest into ios/ after every prebuild;
// a fast build skips prebuild only while that digest still matches, and otherwise runs it and says why. Plain Node,
// no package of the Expo app's, so tests/unit/native-shell.test.ts runs it where the app is not installed.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Where the digest of the last prebuild is kept, inside the generated folder, so it goes when ios/ goes. */
export const STAMP = join('ios', '.ia-prebuild');

/**
 * What prebuild and pod install read, from the app's folder: the config, the packages and their lockfile, the icon,
 * the widget target, the Swift modules, and core's version (the bundle's own). The JavaScript under src/ is not
 * here: Xcode bundles it on every build.
 */
export const NATIVE_INPUTS = [
  'app.config.js', 'package.json', 'package-lock.json', 'assets', 'targets', 'modules', join('..', '..', 'core', 'src', 'version.ts'),
];

/** Every file under a path, in a fixed order; a path that is not there gives none. */
function filesUnder(path) {
  if (!existsSync(path)) return [];
  if (!statSync(path).isDirectory()) return [path];
  return readdirSync(path).sort().filter((name) => name !== 'node_modules' && name !== '.DS_Store').flatMap((name) => filesUnder(join(path, name)));
}

/** The digest of the native inputs as they stand: each file's place and bytes, and the build number handed in. */
export function nativeInputsDigest(appDir, build = '') {
  const hash = createHash('sha256');
  for (const input of NATIVE_INPUTS) {
    for (const file of filesUnder(join(appDir, input))) {
      hash.update(relative(appDir, file)).update('\0').update(readFileSync(file)).update('\0');
    }
  }
  return hash.update(`build=${build}`).digest('hex');
}

/** Whether this build runs prebuild, and the sentence it prints. `stamp` is the kept digest, or null when none is kept. */
export function prebuildDecision({ fast, hasIos, stamp, digest }) {
  if (!fast) return { run: true, why: 'a full build' };
  if (!hasIos) return { run: true, why: 'there is no ios/ here yet' };
  if (stamp === null) return { run: true, why: 'ios/ carries no record of its prebuild' };
  if (stamp !== digest) return { run: true, why: 'a native input changed since ios/ was made' };
  return { run: false, why: 'ios/ is current' };
}
