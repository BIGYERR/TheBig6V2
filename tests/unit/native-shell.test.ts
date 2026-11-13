// The Expo app in frontends/native (MIGRATION.md phase 2): what keeps it beside today's app instead of over it, its
// version in step with core's, its pinned SDK, and its engine check being core's own code, run as it is.
// Expected values are typed from MIGRATION.md (phase 2: Expo SDK 58, React Native 0.88, the bundle id
// com.bigyerr.ironasylum.next) and docs/decisions/engine-check.md (D286), never read from the app.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { VERSION, semver } from '@ia/core';
import { REPO } from '../support/app.ts';

const require = createRequire(import.meta.url);
const NATIVE = join(REPO, 'frontends', 'native');

interface ExpoConfig { name: string; version: string; ios: { bundleIdentifier: string; buildNumber: string } }
const config = (require(join(NATIVE, 'app.config.js')) as () => ExpoConfig)();
const pkg = JSON.parse(readFileSync(join(NATIVE, 'package.json'), 'utf8')) as {
  dependencies: Record<string, string>; devDependencies: Record<string, string>;
};

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sources(join(dir, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [join(dir, e.name)] : []);
}

describe('native shell: beside today\'s app, never over it', () => {
  test('the Expo app\'s bundle id is com.bigyerr.ironasylum.next', () => {
    assert.equal(config.ios.bundleIdentifier, 'com.bigyerr.ironasylum.next');
  });

  test('its bundle id is not today\'s app\'s, so installing it never replaces that app', () => {
    const xml = readFileSync(join(REPO, 'frontends', 'app', 'config.xml'), 'utf8');
    const today = /<widget id="([^"]+)"/.exec(xml)?.[1];
    assert.equal(today, 'com.bigyerr.ironasylum');
    assert.notEqual(config.ios.bundleIdentifier, today);
  });
});

describe('native shell: version and pins', () => {
  test('its version and build number are core\'s release version', () => {
    assert.equal(semver.cmp(config.version, VERSION), 0);
    assert.equal(semver.cmp(config.ios.buildNumber, VERSION), 0);
  });

  test('Expo SDK 58, React Native 0.88 and React 19.3, pinned exactly', () => {
    assert.equal(pkg.dependencies['expo'], '58.0.25');
    assert.equal(pkg.dependencies['react-native'], '0.88.1');
    assert.equal(pkg.dependencies['react'], '19.3.0');
  });

  test('core is the repo\'s own, linked, never a copy', () => {
    assert.equal(pkg.dependencies['@ia/core'], 'file:../../core');
  });

  // The versions Expo SDK 58.0.25 names for them (its bundledNativeModules.json, read 2026-11-13), pinned exactly.
  test('the store and the file packages are SDK 58\'s own, pinned exactly', () => {
    assert.equal(pkg.dependencies['expo-sqlite'], '58.0.17');
    assert.equal(pkg.dependencies['expo-document-picker'], '58.0.5');
    assert.equal(pkg.dependencies['expo-file-system'], '58.0.13');
  });
});

describe('native shell: the backup is read only, and loaded by core\'s own code (D287)', () => {
  const files = sources(join(NATIVE, 'src'));
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  test('the import reads and loads with core\'s backup code, and checks with core\'s SHA-256', () => {
    assert.match(all, /import \{ backupKeys, loadBackupInto, readBackupText \} from '@ia\/core\/engine\/state-backup\.ts'/);
    assert.match(all, /import \{ sha256Hex \} from '@ia\/core\/engine\/engine-check\.ts'/);
    assert.doesNotMatch(all, /JSON\.parse\([^)]*\)\.data/, 'no reader of its own');
  });

  test('the app stores through expo-sqlite/kv-store alone, in one database of its own', () => {
    const stores = files.filter((f) => /from 'expo-sqlite/.test(readFileSync(f, 'utf8')));
    assert.deepStrictEqual(stores.map((f) => f.slice(NATIVE.length + 1)), [join('src', 'store', 'phone-store.ts')]);
    assert.match(readFileSync(stores[0]!, 'utf8'), /from 'expo-sqlite\/kv-store'/);
    assert.doesNotMatch(all, /localStorage|AsyncStorage|openDatabase/);
  });

  test('nothing in the app writes a file, shares one, or deletes one', () => {
    assert.doesNotMatch(all, /\.(write|delete|move|copy)\(|writeAsString|expo-sharing|Sharing\./);
    assert.match(all, /copyToCacheDirectory: true/, 'the picker hands over a copy');
  });

  test('the row carries D287\'s words', () => {
    assert.match(all, />Backup</);
    assert.match(all, /Loads a backup file into this app and checks every key\. Writes nothing back\./);
    assert.match(all, /'Load a backup'/);
    assert.match(all, /'Checking'/);
  });
});

describe('native shell: the engine check is core\'s, as it is', () => {
  const files = sources(join(NATIVE, 'src'));
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  test('the screen imports the check and the engine from core', () => {
    assert.match(all, /from '@ia\/core\/engine\/engine-check\.ts'/);
    assert.match(all, /from '@ia\/core\/engine\/budget-engine-d\.ts'/);
  });

  test('no file in the app carries its own SHA-256, digest or HALF_MANNY digest', () => {
    assert.doesNotMatch(all, /0x428a2f98/);                // SHA-256's first round constant
    assert.doesNotMatch(all, /147f083be4e04e34/);          // HALF_MANNY's pinned digest (D286)
    assert.doesNotMatch(all, /function\s+\w*[Dd]igest/);
  });

  test('the row carries D286\'s words', () => {
    assert.match(all, />Engine</);
    assert.match(all, /Builds the tested programs on this phone\. Each one must match\./);
    assert.match(all, /'Run the check'/);
    assert.match(all, /'Checking'/);
  });

  test('it times its slices on performance.now(), never the date', () => {
    assert.match(all, /performance\.now\(\)/);
    assert.doesNotMatch(all, /Date\.now\(\)/);
  });
});
