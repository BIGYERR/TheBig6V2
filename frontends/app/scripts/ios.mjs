#!/usr/bin/env node
// The two iOS build paths (the web ones are scripts/pwa-pages.mjs and scripts/pwa-local.mjs). Builds with Cordova and Xcode, then
// installs and launches.
//
//   npm run emulator-ios                        build, boot the simulator, install, launch
//   npm run emulator-ios -- --sim "iPhone Air"  pick a simulator by name (default: IOS_SIM or "iPhone 17 Pro")
//   npm run device-ios                          build signed for the connected iPhone, install, launch
//   npm run device-ios -- --udid <id>           pick a device when more than one is connected
//   npm run device-ios -- --team <id>           Apple team ID (default: IOS_TEAM_ID, or the first team Xcode knows)
//   npm run build-ios                           build for the simulator and stop (the compile proof; CI's native job)
//   npm run release-ios                         archive the release signed for App Store Connect and upload it to
//                                               TestFlight (CI's TestFlight upload job; the profiles in IOS_PROFILES,
//                                               the API key in ASC_KEY_PATH, ASC_KEY_ID, ASC_ISSUER_ID)
//   npm run release-ios -- --no-upload          the same archive, exported as an .ipa and kept (a local proof)
//   npm run version-ios                         write the page's ia-version into config.xml and stop (a release commit)
//   npm run xcode-ios                           open the native project in Xcode
//   add --no-web to skip the Angular build and reuse www/ as it is
//
// Build products go to ~/Library/Caches/iron-asylum-ios (IOS_BUILD_DIR to change it), never into the repo: when the
// repo lived in iCloud-synced ~/Desktop, iCloud stamped Finder metadata onto a fresh .app, which codesign refused
// ("resource fork, Finder information, or similar detritus not allowed"). It lives in ~/Developer now; the builds stay out.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachRun } from '../../../tools/runlog.mjs';
import { exportOptions, profileProblems, readProfile, signForRelease } from './signing.mjs';
import { canonical, withNativeVersion } from './version.mjs';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_ROOT = process.env.IOS_BUILD_DIR || join(homedir(), 'Library', 'Caches', 'iron-asylum-ios');
const DEFAULT_SIM = process.env.IOS_SIM || 'iPhone 17 Pro';
const CONFIG_XML = join(APP, 'config.xml');

const args = process.argv.slice(2);
const mode = args[0];
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i > 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
};
const has = (name) => args.includes(`--${name}`);

function fail(msg) {
  console.error(`\nios: ${msg}`);
  process.exit(1);
}

function step(msg) {
  console.log(`\nios: ${msg}`);
}

/** Runs a command with live output; exits with its message on failure. */
function run(cmd, cmdArgs, opts = {}) {
  const res = spawnSync(cmd, cmdArgs, { cwd: APP, stdio: 'inherit', ...opts });
  if (res.status !== 0) fail(`${cmd} ${cmdArgs.join(' ')} failed (exit ${res.status ?? res.signal})`);
}

function capture(cmd, cmdArgs) {
  return execFileSync(cmd, cmdArgs, { cwd: APP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function readConfig() {
  const xml = readFileSync(CONFIG_XML, 'utf8');
  const bundleId = (xml.match(/<widget[^>]*\sid="([^"]+)"/) || [])[1];
  const name = (xml.match(/<name>([^<]+)<\/name>/) || [])[1];
  if (!bundleId || !name) fail('config.xml has no widget id or <name>');
  return { xml, bundleId, name };
}

/**
 * Keeps the native version in step with the page's ia-version: version and build are both its canonical
 * M.m.p (239 -> 0.239.0, 0.239.1 -> 0.239.1; scripts/version.mjs). Returns that M.m.p.
 */
function syncNativeVersion() {
  const manifest = join(APP, 'src', 'legacy', 'generated', 'legacy-manifest.json');
  if (!existsSync(manifest)) fail('no generated legacy manifest; run npm run sync (or drop --no-web)');
  const { version } = JSON.parse(readFileSync(manifest, 'utf8'));
  const { xml } = readConfig();
  let native, next;
  try {
    native = canonical(version);
    next = withNativeVersion(xml, version);
  } catch (err) {
    fail(`${err.message} (the generated legacy manifest and config.xml)`);
  }
  if (next !== xml) {
    writeFileSync(CONFIG_XML, next);
    console.log(`ios: config.xml now version ${native} (build ${native})`);
  } else {
    console.log(`ios: config.xml already version ${native} (build ${native})`);
  }
  return native;
}

function prepare() {
  if (!has('no-web')) {
    step('building the Angular app (npm run build)');
    run('npm', ['run', 'build']);
  } else if (!existsSync(join(APP, 'www', 'index.html'))) {
    fail('--no-web given but www/ is empty; run npm run build first');
  }
  const version = syncNativeVersion();
  if (!existsSync(join(APP, 'platforms', 'ios'))) {
    step('adding the Cordova iOS platform (first build on this machine)');
    run('npx', ['cordova', 'platform', 'add', 'ios', '--no-telemetry']);
  }
  return version;
}

/** Xcode failures with a known cause, and what to do about each. */
const KNOWN_FAILURES = [
  [/No Accounts: Add a new account/, 'Xcode has no Apple ID signed in. Open Xcode > Settings > Accounts, add your Apple ID, then rerun.'],
  [/has no devices from which to generate a provisioning profile/, 'Xcode has not registered this iPhone yet. Keep it plugged in and unlocked, then rerun.'],
  [/No profiles for '.*' were found/, 'Xcode could not create a signing profile. Check the Apple ID in Xcode > Settings > Accounts, keep the iPhone connected, then rerun.'],
  [/detritus not allowed/, `Finder metadata reached the app bundle. Build products must stay outside iCloud-synced folders (IOS_BUILD_DIR, now ${BUILD_ROOT}).`],
  [/bundle version must be higher|Redundant Binary Upload|has already been (used|uploaded)/i, 'App Store Connect already holds this version. A version is uploaded once; a re-upload is the next PATCH (CLAUDE.md, Native).'],
  [/doesn't include signing certificate|No signing certificate "(iOS|Apple) Distribution"/, 'The distribution certificate in the keychain is not the one the App Store profiles were made with. Make both profiles again with this certificate, or export the one they name (frontends/app/README.md, TestFlight from CI).'],
  [/Authentication failed|NOT_AUTHORIZED|Unable to authenticate|invalid authentication/i, 'App Store Connect refused the API key. ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 must hold that one key\'s own values.'],
];

/**
 * Runs one build step with its output captured to a log, then turns a known Xcode failure into a plain instruction.
 * The log lands in BUILD_ROOT as xcodebuild-<label>.log, and a copy in the run's artifacts/ when this build is a
 * logged run (npm run emulator-ios and device-ios are), so every build keeps its own log.
 */
function buildStep(label, cmd, cmdArgs, cwd = APP) {
  const res = spawnSync(cmd, cmdArgs, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = `$ ${cmd} ${cmdArgs.join(' ')}\n${res.stdout ?? ''}${res.stderr ?? ''}`;
  const log = join(BUILD_ROOT, `xcodebuild-${label}.log`);
  mkdirSync(BUILD_ROOT, { recursive: true });
  writeFileSync(log, output);
  const run = attachRun();
  run?.saveArtifact(log);
  run?.event('xcode', `${label} ${res.status === 0 ? 'succeeded' : `failed (exit ${res.status ?? res.signal})`}; log artifacts/${basename(log)}`, { global: res.status !== 0 });
  if (res.status === 0) {
    console.log(`ios: Xcode build succeeded (log: ${log})`);
    return;
  }
  const errors = output.split('\n').filter((l) => /error:|\*\* (BUILD|ARCHIVE|EXPORT) FAILED/.test(l));
  console.error(errors.slice(0, 12).join('\n'));
  const known = KNOWN_FAILURES.find(([re]) => re.test(output));
  fail(`${known ? known[1] : 'the Xcode build failed.'}\n  Full log: ${log}`);
}

function findApp(dir) {
  if (!existsSync(dir)) return null;
  const app = readdirSync(dir).find((f) => f.endsWith('.app'));
  return app ? join(dir, app) : null;
}

// ---------------------------------------------------------------------------------------------------- simulator

function pickSimulator(name) {
  const { devices } = JSON.parse(capture('xcrun', ['simctl', 'list', 'devices', 'available', '--json']));
  const all = Object.entries(devices)
    .filter(([runtime]) => runtime.includes('iOS'))
    .flatMap(([runtime, list]) => list.map((d) => ({ ...d, runtime })));
  const matches = all.filter((d) => d.name === name);
  if (!matches.length) {
    const names = [...new Set(all.map((d) => d.name))].join(', ');
    fail(`no available simulator named "${name}". Available: ${names}`);
  }
  // Prefer one already booted, then the newest iOS runtime.
  return matches.find((d) => d.state === 'Booted') ?? matches.sort((a, b) => b.runtime.localeCompare(a.runtime))[0];
}

/** The unsigned simulator build: the Angular app, config.xml's version, the Cordova platform, then Xcode. */
function buildForSimulator(label) {
  const version = prepare();
  rmSync(join(BUILD_ROOT, 'Debug-iphonesimulator'), { recursive: true, force: true });
  step('building with Xcode for the simulator');
  // cordova-ios 8 deploys simulator builds to DSTROOT ($(SRCROOT)/build by default); point it outside iCloud.
  buildStep(label, 'npx', [
    'cordova', 'build', 'ios', '--emulator', '--debug', '--no-telemetry', `--buildFlag=DSTROOT=${BUILD_ROOT}`,
  ]);
  const app = findApp(join(BUILD_ROOT, 'Debug-iphonesimulator'));
  if (!app) fail(`the build reported success but no .app is in ${join(BUILD_ROOT, 'Debug-iphonesimulator')}`);
  return { version, app };
}

/**
 * The compile proof and nothing more: the simulator build, no simulator booted, nothing installed. What the
 * pipeline's native job runs on a macOS runner on every push to dev (npm run build-ios), so a plugin, a Cordova or an
 * Xcode change that breaks the native app turns CI red; locally it is the fastest native build (a few minutes).
 */
function buildOnly() {
  const { version, app } = buildForSimulator('build');
  console.log(`\nios: The Asylum ${version} built for the simulator: ${app}`);
}

/**
 * Writes the page's ia-version into config.xml and stops (what a release commit carries; the app lane's
 * test/unit/native-version.test.ts holds the two equal). Syncs the legacy bundle first, since the version is read
 * off its generated manifest.
 */
function versionOnly() {
  run(process.execPath, [join(APP, 'scripts', 'sync-legacy.mjs')]);
  syncNativeVersion();
}

function simulator() {
  const { version, app } = buildForSimulator('emulator');
  const sim = pickSimulator(flag('sim') || DEFAULT_SIM);
  const { bundleId } = readConfig();
  step(`launching on ${sim.name} (${sim.udid})`);
  if (sim.state !== 'Booted') run('xcrun', ['simctl', 'boot', sim.udid]);
  run('open', ['-a', 'Simulator', '--args', '-CurrentDeviceUDID', sim.udid]);
  run('xcrun', ['simctl', 'bootstatus', sim.udid, '-b']);
  run('xcrun', ['simctl', 'install', sim.udid, app]);
  launchOnSimulator(sim, bundleId);
  console.log(`\nios: The Asylum ${version} is running on ${sim.name}.`);
}

/**
 * Launches the installed app. A simulator this script has just cold-booted can still be settling after bootstatus
 * says it is ready, and then it may never start the app: on 2026-10-12 the launch failed ("did not return a process
 * handle nor launch error"), the splash screen service timed out, and taps on the icon a minute later hung on the
 * same stuck boot, while a fresh boot launched the same build in under a second. So a failed launch restarts the
 * simulator once (the install survives a restart) and tries again.
 */
function launchOnSimulator(sim, bundleId) {
  const launch = () => spawnSync('xcrun', ['simctl', 'launch', sim.udid, bundleId], { cwd: APP, stdio: 'inherit' }).status === 0;
  if (launch()) return;
  step(`the app did not start on ${sim.name}; restarting the simulator and launching once more`);
  run('xcrun', ['simctl', 'shutdown', sim.udid]);
  run('xcrun', ['simctl', 'boot', sim.udid]);
  run('xcrun', ['simctl', 'bootstatus', sim.udid, '-b']);
  if (!launch()) fail(`installed on ${sim.name}, but it did not start, twice, the second time after a restart (see above).`);
}

// ---------------------------------------------------------------------------------------------------- device

/** Team ID from --team, IOS_TEAM_ID, or the first team Xcode knows. */
function resolveTeam() {
  const given = flag('team') || process.env.IOS_TEAM_ID;
  if (given) return given;
  try {
    const plist = capture('defaults', ['read', 'com.apple.dt.Xcode', 'IDEProvisioningTeams']);
    const team = (plist.match(/teamID = "?([A-Z0-9]{10})"?;/) || [])[1];
    if (team) return team;
  } catch {
    /* no Xcode account; fall through */
  }
  return fail(
    'no Apple team found. Sign in to Xcode (Settings > Accounts) with your Apple ID, ' +
      'or pass --team <TEAMID> / set IOS_TEAM_ID.',
  );
}

function connectedDevices() {
  const dir = mkdtempSync(join(tmpdir(), 'ia-devicectl-'));
  const out = join(dir, 'devices.json');
  try {
    execFileSync('xcrun', ['devicectl', 'list', 'devices', '--json-output', out], { stdio: 'ignore' });
    const devices = JSON.parse(readFileSync(out, 'utf8'))?.result?.devices ?? [];
    return devices
      .filter((d) => d.hardwareProperties?.platform === 'iOS')
      .filter((d) => d.connectionProperties?.tunnelState !== 'unavailable')
      .map((d) => ({
        id: d.identifier,
        udid: d.hardwareProperties?.udid,
        name: (d.deviceProperties?.name ?? 'iPhone').trim(),
        pairing: d.connectionProperties?.pairingState,
        developerMode: d.deviceProperties?.developerModeStatus,
      }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function pickDevice() {
  const devices = connectedDevices();
  const wanted = flag('udid');
  const device = wanted ? devices.find((d) => d.udid === wanted || d.id === wanted) : devices[0];
  if (!device) {
    fail(
      (wanted ? `no connected device ${wanted}.` : 'no iPhone is connected.') +
        '\n  1. Plug the iPhone into this Mac and unlock it; tap Trust if it asks.' +
        '\n  2. On the iPhone: Settings > Privacy & Security > Developer Mode > On (it restarts).' +
        '\n  3. Run npm run device-ios again.',
    );
  }
  if (devices.length > 1 && !wanted) {
    console.log(`ios: ${devices.length} devices connected; using ${device.name}. Pick another with --udid.`);
  }
  if (device.pairing && device.pairing !== 'paired') fail(`${device.name} is not paired; unlock it and tap Trust.`);
  if (device.developerMode && device.developerMode !== 'enabled') {
    fail(`${device.name} has Developer Mode off: Settings > Privacy & Security > Developer Mode.`);
  }
  return device;
}

/** Refuses to install a build whose embedded profile does not list the target phone, and says why. */
function checkProfileCovers(app, target) {
  let profile;
  try {
    profile = capture('security', ['cms', '-D', '-i', join(app, 'embedded.mobileprovision')]);
  } catch {
    fail(`could not read the signing profile inside ${app}`);
  }
  if (/<key>ProvisionsAllDevices<\/key>\s*<true\/>/.test(profile)) return;
  const devices = profile.match(/<key>ProvisionedDevices<\/key>\s*<array>([\s\S]*?)<\/array>/)?.[1] ?? '';
  if (devices.includes(target.udid)) return;
  fail(
    `the signing profile Xcode made does not include ${target.name} (${target.udid}), so iOS would refuse the install.\n` +
      '  Open the project (npm run xcode-ios), select the App target > Signing & Capabilities, pick your team,\n' +
      '  choose this iPhone as the run destination and press Run once; then rerun npm run device-ios.',
  );
}

function device() {
  const team = resolveTeam();
  const target = pickDevice();
  const version = prepare();
  if (!target.udid) fail(`could not read the hardware UDID of ${target.name} from devicectl`);
  step('preparing the native project (cordova prepare)');
  run('npx', ['cordova', 'prepare', 'ios', '--no-telemetry']);

  // A plain build for this phone, the way Xcode's Run button does it. Not `cordova build --device`: that archives,
  // and xcodebuild always archives for the generic "Any iOS Device", so a phone the team has never seen is never
  // registered and the profile leaves it out (install error 0xe8008012). A concrete destination plus
  // -allowProvisioningDeviceRegistration lets automatic signing register the phone and issue a profile that lists it.
  const out = join(BUILD_ROOT, 'Debug-iphoneos');
  rmSync(out, { recursive: true, force: true });
  step(`building with Xcode for ${target.name}`);
  buildStep('device', 'xcodebuild', [
    '-workspace', 'App.xcworkspace',
    '-scheme', 'App',
    '-configuration', 'Debug',
    '-destination', `id=${target.udid}`,
    '-allowProvisioningUpdates',
    '-allowProvisioningDeviceRegistration',
    'build',
    `DEVELOPMENT_TEAM=${team}`,
    'CODE_SIGN_STYLE=Automatic',
    `CONFIGURATION_BUILD_DIR=${out}`,
  ], join(APP, 'platforms', 'ios'));
  const app = findApp(out);
  if (!app) fail(`the build reported success but no .app is in ${out}`);
  checkProfileCovers(app, target);

  const { bundleId } = readConfig();
  step(`installing on ${target.name}`);
  run('xcrun', ['devicectl', 'device', 'install', 'app', '--device', target.id, app]);
  step(`launching on ${target.name}`);
  const launch = spawnSync('xcrun', ['devicectl', 'device', 'process', 'launch', '--device', target.id, bundleId], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const said = `${launch.stdout ?? ''}${launch.stderr ?? ''}`;
  if (launch.status !== 0) {
    if (/not been explicitly trusted|Untrusted Developer|invalid code signature/.test(said)) {
      fail(
        `installed on ${target.name}, but iOS will not open it until you trust the developer certificate (once per Apple ID):\n` +
          '  1. On the iPhone: Settings > General > VPN & Device Management.\n' +
          '  2. Under Developer App, tap your Apple ID, then Trust.\n' +
          '  3. Open The Asylum from the home screen (or run npm run device-ios again).',
      );
    }
    if (/Locked|locked/.test(said)) fail(`installed on ${target.name}, but it is locked; unlock it and open The Asylum.`);
    console.error(said.trim());
    fail(`installed on ${target.name}, but it did not launch (see above).`);
  }
  console.log(`\nios: The Asylum ${version} is running on ${target.name}.`);
  console.log('ios: built with a free Personal Team? The install expires in 7 days; run this again to renew it.');
}

// ---------------------------------------------------------------------------------------------------- release

/** Where Xcode looks for installed profiles: the folder Xcode 16 and later reads, and the one before it. */
const PROFILE_DIRS = [
  join(homedir(), 'Library', 'Developer', 'Xcode', 'UserData', 'Provisioning Profiles'),
  join(homedir(), 'Library', 'MobileDevice', 'Provisioning Profiles'),
];

const inActions = process.env.GITHUB_ACTIONS === 'true';

/** A warning for a person: its own line here, an annotation on the run in the pipeline. */
function warn(msg) {
  console.log(inActions ? `::warning title=TestFlight::${msg}` : `ios: warning: ${msg}`);
}

/**
 * The App Store profiles in IOS_PROFILES (or --profiles), .mobileprovision paths joined by commas, one for the app
 * and one for each extension: each read and checked (App Store type, not expired, one team) and installed where
 * Xcode finds it.
 */
function installProfiles() {
  const paths = (flag('profiles') || process.env.IOS_PROFILES || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!paths.length) {
    fail('no App Store profiles: set IOS_PROFILES to the .mobileprovision files, joined by commas (the app, RestTimerWidget)');
  }
  const now = new Date();
  const profiles = paths.map((path) => {
    if (!existsSync(path)) fail(`no profile at ${path}`);
    let plist = '';
    try {
      plist = capture('security', ['cms', '-D', '-i', path]);
    } catch {
      fail(`${path} is not a provisioning profile (security cms could not decode it)`);
    }
    const profile = readProfile(plist);
    const { errors, warnings } = profileProblems(profile, now);
    if (errors.length) fail(`${basename(path)}: ${errors.join('; ')}`);
    warnings.forEach(warn);
    return { ...profile, path };
  });
  const teams = [...new Set(profiles.map((p) => p.team))];
  if (teams.length !== 1) fail(`the profiles belong to ${teams.length} teams (${teams.join(', ')}); they must share one`);
  for (const dir of PROFILE_DIRS) {
    mkdirSync(dir, { recursive: true });
    for (const p of profiles) copyFileSync(p.path, join(dir, `${p.uuid}.mobileprovision`));
  }
  for (const p of profiles) console.log(`ios: profile "${p.name}" for ${p.bundleId}, expires ${p.expires?.toISOString().slice(0, 10)}`);
  return { team: teams[0], profiles };
}

/** An Apple Distribution identity in the keychain that every profile was made with; fails naming what does not match. */
function checkIdentity(team, profiles) {
  const found = capture('security', ['find-identity', '-v', '-p', 'codesigning'])
    .split('\n')
    .map((line) => /\)\s+([0-9A-F]{40})\s+"(Apple Distribution: [^"]*\((\w+)\))"/.exec(line))
    .filter((m) => m && m[3] === team)
    .map((m) => ({ hash: m[1], name: m[2] }));
  if (!found.length) {
    fail(`no Apple Distribution identity for team ${team} in the keychain (in the pipeline, the IOS_DIST_CERT_P12 secret holds it)`);
  }
  const identity = found.find((id) => profiles.every((p) => p.certs.includes(id.hash)));
  if (!identity) {
    const stray = profiles.filter((p) => !found.some((id) => p.certs.includes(id.hash))).map((p) => `"${p.name}"`);
    fail(
      `${stray.length ? stray.join(' and ') : 'the profiles'} not made with the Apple Distribution certificate in the ` +
        `keychain (${found.map((id) => id.name).join(', ')}); make both profiles with that one certificate`,
    );
  }
  console.log(`ios: signing as ${identity.name}`);
}

/** The API key xcodebuild uploads with: ASC_KEY_PATH, ASC_KEY_ID and ASC_ISSUER_ID together, or none of them. */
function uploadAuth() {
  const { ASC_KEY_PATH: path, ASC_KEY_ID: id, ASC_ISSUER_ID: issuer } = process.env;
  const given = [path, id, issuer].filter(Boolean).length;
  if (given === 0) {
    console.log('ios: no ASC_KEY_PATH; uploading with the Apple ID Xcode is signed in with');
    return [];
  }
  if (given !== 3) fail('ASC_KEY_PATH, ASC_KEY_ID and ASC_ISSUER_ID go together; set all three or none');
  if (!existsSync(path)) fail(`no API key file at ${path}`);
  return ['-authenticationKeyPath', path, '-authenticationKeyID', id, '-authenticationKeyIssuerID', issuer];
}

/** The generated project's Release configuration signed by hand: the app and each extension with its own profile. */
function signProject(team, profiles) {
  const pbxPath = join(APP, 'platforms', 'ios', 'App.xcodeproj', 'project.pbxproj');
  const require = createRequire(join(APP, 'package.json'));
  const xcode = require(require.resolve('xcode', { paths: [join(APP, 'node_modules', 'cordova-ios'), APP] }));
  const project = xcode.project(pbxPath);
  project.parseSync();
  let signed = [];
  try {
    signed = signForRelease(project.hash.project.objects, team, profiles);
  } catch (err) {
    fail(err.message);
  }
  writeFileSync(pbxPath, project.writeSync());
  for (const s of signed) console.log(`ios: ${s.target} (${s.bundleId}) signs with "${s.profile}"`);
}

/**
 * The TestFlight release: the Angular app, config.xml's version, cordova prepare, then the Release configuration
 * signed by hand (scripts/signing.mjs), archived for any iOS device and exported for App Store Connect: uploaded (the
 * pipeline's TestFlight upload job, after each merge into main) or, with --no-upload, kept as an .ipa. Needs an Apple
 * Distribution identity in the keychain and the App Store profiles in IOS_PROFILES; the pipeline makes both from
 * Mario's secrets. Debug keeps automatic signing, so device-ios is untouched, and the next prepare resets Release.
 */
function release() {
  const upload = !has('no-upload');
  const { team, profiles } = installProfiles();
  checkIdentity(team, profiles);
  const auth = upload ? uploadAuth() : [];
  const version = prepare();
  step('preparing the native project (cordova prepare)');
  run('npx', ['cordova', 'prepare', 'ios', '--no-telemetry']);
  signProject(team, profiles);

  const out = join(BUILD_ROOT, 'release');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const archive = join(out, 'App.xcarchive');
  const ios = join(APP, 'platforms', 'ios');
  step(`archiving The Asylum ${version} (Release, any iOS device)`);
  buildStep('archive', 'xcodebuild', [
    '-workspace', 'App.xcworkspace',
    '-scheme', 'App',
    '-configuration', 'Release',
    '-destination', 'generic/platform=iOS',
    '-archivePath', archive,
    'archive',
  ], ios);

  const options = join(out, 'ExportOptions.plist');
  writeFileSync(options, exportOptions({ team, profiles, upload }));
  step(upload ? `uploading The Asylum ${version} to App Store Connect` : `exporting The Asylum ${version} as an .ipa`);
  // -allowProvisioningUpdates lets xcodebuild reach App Store Connect with the API key; for manually signed targets it
  // only fetches a profile that is missing, and both are installed.
  buildStep(upload ? 'upload' : 'export', 'xcodebuild', [
    '-exportArchive',
    '-archivePath', archive,
    '-exportOptionsPlist', options,
    '-exportPath', join(out, 'export'),
    ...(auth.length ? ['-allowProvisioningUpdates', ...auth] : []),
  ], ios);
  if (!upload) {
    console.log(`\nios: The Asylum ${version} exported: ${join(out, 'export')}`);
    return;
  }
  console.log(`\nios: The Asylum ${version} uploaded to App Store Connect; TestFlight offers it once processing ends.`);
  if (inActions) console.log(`::notice title=TestFlight::testflight ${version} uploaded`);
}

// ---------------------------------------------------------------------------------------------------- open

function openXcode() {
  if (!existsSync(join(APP, 'platforms', 'ios'))) prepare();
  run('open', [join(APP, 'platforms', 'ios', 'App.xcworkspace')]);
}

if (process.platform !== 'darwin') fail('iOS builds need macOS with Xcode.');
if (mode === 'emulator') simulator();
else if (mode === 'device') device();
else if (mode === 'build') buildOnly();
else if (mode === 'release') release();
else if (mode === 'version') versionOnly();
else if (mode === 'open') openXcode();
else fail('usage: node scripts/ios.mjs <emulator|device|build|release|version|open> [--sim <name>] [--udid <id>] [--team <id>] [--profiles <a,b>] [--no-upload] [--no-web]');
