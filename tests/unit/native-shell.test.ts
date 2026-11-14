// The Expo app in frontends/native (MIGRATION.md phase 2): what keeps it beside today's app instead of over it, its
// version in step with core's, its pinned SDK, and its engine check being core's own code, run as it is.
// Expected values are typed from MIGRATION.md (phase 2: Expo SDK 58, React Native 0.88, the bundle id
// com.bigyerr.ironasylum.next) and docs/decisions/engine-check.md (D286), never read from the app.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, test } from 'vitest';
import { VERSION, semver } from '@ia/core';
import { REPO } from '../support/app.ts';
import { SWIFT_WORD, swiftLine } from '../../frontends/native/src/spike-line.ts';

const require = createRequire(import.meta.url);
const NATIVE = join(REPO, 'frontends', 'native');

interface ExpoConfig { name: string; version: string; icon?: string; ios: { bundleIdentifier: string; buildNumber: string }; plugins?: string[] }
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
  // Outside the TestFlight lane, which hands in its own count (D288; tests/unit/native-testflight.test.ts).
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

// The native spike (MIGRATION.md phase 2 and 4.1): a widget target and a Swift module of the app's own, both added to
// the project expo prebuild generates, so ios/ is still never committed. Expected values are typed from the plan
// (the widget keeps today's name, RestTimerWidget, under the Expo app's bundle id) and from the Swift file's one word.
describe('native shell: the native spike, a widget target and a Swift module with ios/ still generated', () => {
  const read = (...path: string[]): string => readFileSync(join(NATIVE, ...path), 'utf8');
  const files = sources(join(NATIVE, 'src'));
  const all = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  // @bacons/apple-targets 5.0.0 (2026-07-17, the newest; its peer is expo >=52), read from the registry 2026-11-13.
  test('the widget plugin is pinned exactly, and it is the config\'s one plugin', () => {
    assert.equal(pkg.dependencies['@bacons/apple-targets'], '5.0.0');
    assert.deepEqual(config.plugins, ['@bacons/apple-targets']);
  });

  // The release reads and writes the generated project with it (scripts/ios.mjs release), so it is the app's own
  // dependency, never one that happens to arrive under Expo's: 4.0.0, the version Expo SDK 58's config plugins install.
  test('the project file reader the release signs with is pinned exactly', () => {
    assert.equal(pkg.devDependencies['xcode'], '4.0.0');
  });

  test('the widget target is RestTimerWidget, under the Expo app\'s bundle id, with no entitlement to register', () => {
    const target = require(join(NATIVE, 'targets', 'RestTimerWidget', 'expo-target.config.js')) as Record<string, unknown>;
    assert.deepEqual(target, { type: 'widget', name: 'RestTimerWidget', bundleIdentifier: '.RestTimerWidget', deploymentTarget: '16.4', entitlements: {} });
    assert.match(read('targets', 'RestTimerWidget', 'Info.plist'), /<key>NSExtensionPointIdentifier<\/key>\s*<string>com\.apple\.widgetkit-extension<\/string>/);
  });

  test('the widget extension is empty: one widget, with nothing in it', () => {
    const swift = read('targets', 'RestTimerWidget', 'RestTimerWidget.swift');
    assert.match(swift, /@main\s+struct RestTimerWidgetBundle: WidgetBundle/);
    assert.equal(swift.match(/WidgetConfiguration \{\s*EmptyWidgetConfiguration\(\)\s*\}/g)?.length, 1);
    assert.doesNotMatch(swift, /StaticConfiguration|ActivityConfiguration|AppIntentConfiguration/);
  });

  // A guard: it passes on the release before the spike too. The spike must not change it (MIGRATION.md 4.1: a
  // committed ios/ folder is the fallback this session did not need).
  test('ios/ is generated on every build and never committed', () => {
    assert.match(read('.gitignore'), /^\/ios\/$/m);
  });

  test('the Swift module is the app\'s own local module, IASpike, and answers with one word', () => {
    assert.deepEqual(JSON.parse(read('modules', 'ia-spike', 'expo-module.config.json')), { platforms: ['apple'], apple: { modules: ['IASpikeModule'] } });
    const swift = read('modules', 'ia-spike', 'ios', 'IASpikeModule.swift');
    assert.match(swift, /public class IASpikeModule: Module/);
    assert.match(swift, /Name\("IASpike"\)/);
    assert.match(swift, /Function\("answer"\) \{ \(\) -> String in\s+"swift"\s+\}/);
    assert.match(read('modules', 'ia-spike', 'ios', 'IASpike.podspec'), /s\.dependency 'ExpoModulesCore'/);
  });

  test('the app asks Swift once, when the bundle loads, and a build without the module is no answer, not a crash', () => {
    const spike = read('src', 'native-spike.ts');
    assert.match(spike, /requireOptionalNativeModule<Spike>\('IASpike'\)\?\.answer\(\) \?\? null/);
    assert.match(spike, /catch \{\s*return null;\s*\}/);
    assert.match(spike, /export const SWIFT_ANSWER: string \| null = ask\(\);/);
    assert.equal(all.match(/\.answer\(/g)?.length, 1, 'one call site');
    assert.equal(all.match(/\bask\(\)/g)?.length, 2, 'ask is declared once and called once');
  });

  test('the screen says whether Swift answered, in a sentence', () => {
    assert.equal(SWIFT_WORD, 'swift');
    assert.equal(swiftLine('swift'), 'Swift answers.');
    assert.equal(swiftLine(null), 'Swift does not answer.');
    assert.equal(swiftLine(''), 'Swift does not answer.');
    assert.equal(swiftLine('Swift'), 'Swift does not answer.');
    assert.match(all, /<Text testID="swift-line"[^>]*>\s*\{swiftLine\(SWIFT_ANSWER\)\}\s*<\/Text>/);
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

// The beta's own icon (Mario, 2026-11-14): today's icon with an orange band reading NEXT, so the two apps are told
// apart on the home screen. Expected values typed by hand: Apple asks for 1024 square with no alpha; a PNG says so in
// its header (width and height at bytes 16 and 20, colour type 2, truecolour with no alpha, at byte 25).
describe('native shell: the beta has an icon of its own', () => {
  test('the config names assets/icon.png', () => {
    assert.equal(config.icon, './assets/icon.png');
  });

  test('it is a PNG, 1024 square, with no alpha', () => {
    const png = readFileSync(join(NATIVE, 'assets', 'icon.png'));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.subarray(12, 16).toString('latin1'), 'IHDR');
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(png.readUInt8(25), 2);
  });

  test('it is not today\'s icon, byte for byte', () => {
    const sha = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex');
    assert.notEqual(sha(join(NATIVE, 'assets', 'icon.png')), sha(join(REPO, 'apple-touch-icon.png')));
  });
});

// A fast simulator build (Mario, 2026-11-14): `--fast` skips expo prebuild and its pod install only while ios/ is
// current. The rule is typed by hand: prebuild runs on a full build, with no ios/, with no record of the last prebuild,
// and when anything prebuild reads has changed; it is skipped only when all four are otherwise.
interface Stamp {
  STAMP: string;
  NATIVE_INPUTS: string[];
  nativeInputsDigest(appDir: string, build?: string): string;
  prebuildDecision(q: { fast: boolean; hasIos: boolean; stamp: string | null; digest: string }): { run: boolean; why: string };
}
const P = (await import(pathToFileURL(join(NATIVE, 'scripts', 'prebuild-stamp.mjs')).href)) as Stamp;

describe('native shell: a fast simulator build skips prebuild only while ios/ is current', () => {
  test('prebuild runs on a full build, with no ios/, with no record, and after a change; it is skipped otherwise', () => {
    assert.deepEqual(P.prebuildDecision({ fast: false, hasIos: true, stamp: 'a', digest: 'a' }), { run: true, why: 'a full build' });
    assert.deepEqual(P.prebuildDecision({ fast: true, hasIos: false, stamp: 'a', digest: 'a' }), { run: true, why: 'there is no ios/ here yet' });
    assert.deepEqual(P.prebuildDecision({ fast: true, hasIos: true, stamp: null, digest: 'a' }), { run: true, why: 'ios/ carries no record of its prebuild' });
    assert.deepEqual(P.prebuildDecision({ fast: true, hasIos: true, stamp: 'a', digest: 'b' }), { run: true, why: 'a native input changed since ios/ was made' });
    assert.deepEqual(P.prebuildDecision({ fast: true, hasIos: true, stamp: 'a', digest: 'a' }), { run: false, why: 'ios/ is current' });
  });

  test('the record lives inside ios/, so it goes when ios/ goes', () => {
    assert.equal(P.STAMP, join('ios', '.ia-prebuild'));
  });

  test('the digest moves with each thing prebuild reads, and with nothing else', () => {
    const root = mkdtempSync(join(tmpdir(), 'ia-prebuild-'));
    const app = join(root, 'frontends', 'native');
    const put = (path: string, text: string): void => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, text);
    };
    try {
      const inputs = [
        join(app, 'app.config.js'), join(app, 'package.json'), join(app, 'package-lock.json'), join(app, 'assets', 'icon.png'),
        join(app, 'targets', 'RestTimerWidget', 'RestTimerWidget.swift'), join(app, 'modules', 'ia-spike', 'ios', 'IASpikeModule.swift'),
        join(root, 'core', 'src', 'version.ts'),
      ];
      for (const path of inputs) put(path, 'one');
      put(join(app, 'src', 'Bugs.tsx'), 'one');
      const start = P.nativeInputsDigest(app);
      assert.match(start, /^[0-9a-f]{64}$/);
      assert.equal(P.nativeInputsDigest(app), start, 'the same files, the same digest');

      // The JavaScript, a package folder inside a module, and the generated folder are not prebuild's to read.
      put(join(app, 'src', 'Bugs.tsx'), 'two');
      put(join(app, 'modules', 'ia-spike', 'node_modules', 'x', 'index.js'), 'one');
      put(join(app, 'ios', 'Podfile'), 'one');
      assert.equal(P.nativeInputsDigest(app), start);

      let last = start;
      for (const path of inputs) {
        put(path, 'two');
        const now = P.nativeInputsDigest(app);
        assert.notEqual(now, last, `${path} changed and the digest did not`);
        last = now;
      }
      put(join(app, 'targets', 'RestTimerWidget', 'Assets.swift'), '');
      assert.notEqual(P.nativeInputsDigest(app), last, 'a file added to the widget target');
      assert.notEqual(P.nativeInputsDigest(app, '102'), P.nativeInputsDigest(app), 'the lane\'s build number');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test('a simulator build asks before it prebuilds, an archive always starts clean, and CI never asks for fast', () => {
    const ios = readFileSync(join(NATIVE, 'scripts', 'ios.mjs'), 'utf8');
    assert.match(ios, /function build\(\) \{\s+const t0 = performance\.now\(\);\s+const \{ workspace, scheme \} = prebuildUnlessCurrent\(\);/);
    assert.match(ios, /function archive\(signing\) \{[\s\S]*?prebuild\(\{ clean: true, env: \{ IA_NEXT_BUILD: build \} \}\);/);
    assert.match(ios, /if \(has\('fast'\) && !\['build', 'sim'\]\.includes\(cmd\)\) \{\s+console\.error\([^\n]+\);\s+process\.exit\(2\);/);
    const scripts = (JSON.parse(readFileSync(join(NATIVE, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    assert.equal(scripts['sim-ios:fast'], 'node scripts/ios.mjs sim --fast');
    assert.equal(scripts['build-ios'], 'node scripts/ios.mjs build');
    assert.equal(scripts['archive-ios'], 'node scripts/ios.mjs archive');
    assert.equal(scripts['release-ios'], 'node scripts/ios.mjs release');
    assert.doesNotMatch(readFileSync(join(REPO, '.github', 'workflows', 'pipeline.yml'), 'utf8'), /--fast|sim-ios/);
  });
});
