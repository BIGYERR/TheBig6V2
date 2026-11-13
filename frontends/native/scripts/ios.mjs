#!/usr/bin/env node
// The Expo app's iOS build for the simulator (MIGRATION.md phase 2), unsigned, the same here and in CI's
// `native (Expo)` job.
//
//   node scripts/ios.mjs build   expo prebuild (ios/, generated, never committed; CocoaPods), then an unsigned Release
//                                build for the simulator with the JavaScript bundled in as Hermes bytecode.
//   node scripts/ios.mjs sim     build, then install on the booted simulator and launch it. The simulator only: this
//                                never touches a phone, and its bundle id (com.bigyerr.ironasylum.next) is not today's.
//
// The Xcode log goes to <repo>/temp/native-expo/xcodebuild.log (CI uploads temp/). The products stay in ios/build,
// inside this checkout, so two worktrees never share them. The bundle's own id and version are read back and printed.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(APP, '..', '..');
const LOG_DIR = join(REPO, 'temp', 'native-expo');
const DERIVED = join(APP, 'ios', 'build');
const cmd = process.argv[2];
if (cmd !== 'build' && cmd !== 'sim') { console.error('usage: node scripts/ios.mjs build|sim'); process.exit(2); }

function run(file, args, opts = {}) {
  const r = spawnSync(file, args, { cwd: APP, stdio: 'inherit', env: { ...process.env, LANG: 'en_US.UTF-8' }, ...opts });
  if (r.status !== 0) { console.error(`ios.mjs: ${file} ${args.join(' ')} exited ${r.status}`); process.exit(r.status || 1); }
}

const t0 = performance.now();
run('npx', ['expo', 'prebuild', '--platform', 'ios']);
const workspace = readdirSync(join(APP, 'ios')).find((f) => f.endsWith('.xcworkspace'));
if (!workspace) { console.error('ios.mjs: expo prebuild made no .xcworkspace'); process.exit(1); }
const scheme = workspace.replace(/\.xcworkspace$/, '');

mkdirSync(LOG_DIR, { recursive: true });
const logPath = join(LOG_DIR, 'xcodebuild.log');
const log = openSync(logPath, 'w');
console.log(`ios.mjs: xcodebuild ${scheme}, Release, iphonesimulator, unsigned; log ${logPath}`);
const xb = spawnSync('xcodebuild', [
  '-workspace', join('ios', workspace), '-scheme', scheme, '-configuration', 'Release',
  '-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', DERIVED,
  'CODE_SIGNING_ALLOWED=NO', 'build',
], { cwd: APP, stdio: ['ignore', log, log], env: { ...process.env, LANG: 'en_US.UTF-8' } });
if (xb.status !== 0) {
  console.error(`ios.mjs: xcodebuild exited ${xb.status}; the last lines of ${logPath}:`);
  spawnSync('tail', ['-40', logPath], { stdio: 'inherit' });
  process.exit(xb.status || 1);
}

const products = join(DERIVED, 'Build', 'Products', 'Release-iphonesimulator');
const app = readdirSync(products).find((f) => f.endsWith('.app'));
if (!app) { console.error('ios.mjs: no .app in ' + products); process.exit(1); }
const appPath = join(products, app);
const plist = (key) => execFileSync('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, join(appPath, 'Info.plist')], { encoding: 'utf8' }).trim();
const id = plist('CFBundleIdentifier');
console.log(`ios.mjs: built ${appPath}`);
console.log(`ios.mjs: bundle id ${id}, version ${plist('CFBundleShortVersionString')} (${plist('CFBundleVersion')}), ${Math.round((performance.now() - t0) / 1000)} s`);
const hbc = existsSync(join(appPath, 'main.jsbundle'));
console.log(`ios.mjs: main.jsbundle ${hbc ? 'present' : 'MISSING'}`);
if (!hbc) process.exit(1);

if (cmd === 'sim') {
  if (id !== 'com.bigyerr.ironasylum.next') { console.error('ios.mjs: refusing to install a bundle id that is not the Expo app\'s'); process.exit(1); }
  run('xcrun', ['simctl', 'install', 'booted', appPath]);
  run('xcrun', ['simctl', 'launch', 'booted', id]);
}
