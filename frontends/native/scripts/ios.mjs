#!/usr/bin/env node
// The Expo app's iOS builds (MIGRATION.md phase 2). Its bundle id (com.bigyerr.ironasylum.next) is not today's, and
// nothing here reads, builds or signs today's app (frontends/app).
//
//   node scripts/ios.mjs build     expo prebuild (ios/, generated, never committed; CocoaPods), then an unsigned Release
//                                  build for the simulator with the JavaScript bundled in as Hermes bytecode: CI's
//                                  `native (Expo)` job. The built app must hold its widget extension and its Swift module.
//   node scripts/ios.mjs sim       build, then install on the booted simulator and launch it. The simulator only.
//   node scripts/ios.mjs archive   the release path without a signature: a clean prebuild with the lane's build number,
//                                  an unsigned Release archive for any iOS device, and the archive checked. A local
//                                  proof that the device build compiles; it uploads nothing.
//   node scripts/ios.mjs release   the beta's TestFlight release (D288, docs/decisions/testflight.md; the pipeline's
//                                  `next TestFlight (upload)` job): the same archive signed with the Apple Distribution
//                                  identity in the keychain and the App Store profiles in IOS_PROFILES (the app's and
//                                  the widget's), then uploaded with the API key in ASC_KEY_PATH, ASC_KEY_ID and
//                                  ASC_ISSUER_ID. `-- --no-upload` keeps an .ipa instead.
//
// The signing is today's lane's own code, imported and never changed (frontends/app/scripts/signing.mjs): plain
// signing, one profile per signed target, no EAS. The Xcode logs go to <repo>/temp/native-expo/ (CI uploads temp/).
// The products stay under ios/build, inside this checkout, so two worktrees never share them.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, openSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportOptions, profileProblems, readProfile, signForRelease } from '../../app/scripts/signing.mjs';
import { NOTICE_TITLE, archiveProblems, buildLabel, currentBuild, nextRelease } from './testflight.mjs';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(APP, '..', '..');
const LOG_DIR = join(REPO, 'temp', 'native-expo');
const DERIVED = join(APP, 'ios', 'build');
const WIDGET = 'RestTimerWidget';
const ENV = { ...process.env, LANG: 'en_US.UTF-8' };
const cmd = process.argv[2];
const has = (name) => process.argv.includes(`--${name}`);
if (!['build', 'sim', 'archive', 'release'].includes(cmd)) {
  console.error('usage: node scripts/ios.mjs build|sim|archive|release [--no-upload]');
  process.exit(2);
}

function fail(msg) {
  console.error(`ios.mjs: ${msg}`);
  process.exit(1);
}

function run(file, args, opts = {}) {
  const r = spawnSync(file, args, { cwd: APP, stdio: 'inherit', env: ENV, ...opts });
  if (r.status !== 0) fail(`${file} ${args.join(' ')} exited ${r.status}`);
}

const capture = (file, args) => execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const plist = (file, key) => capture('/usr/libexec/PlistBuddy', ['-c', `Print :${key}`, file]).trim();

/** expo prebuild; returns the generated workspace and its scheme. `clean` throws ios/ away first. */
function prebuild({ clean = false, env = {} } = {}) {
  run('npx', ['expo', 'prebuild', '--platform', 'ios', ...(clean ? ['--clean'] : [])], { env: { ...ENV, ...env } });
  const workspace = readdirSync(join(APP, 'ios')).find((f) => f.endsWith('.xcworkspace'));
  if (!workspace) fail('expo prebuild made no .xcworkspace');
  return { workspace, scheme: workspace.replace(/\.xcworkspace$/, '') };
}

/** One xcodebuild run, its output in temp/native-expo/<label>.log; on failure the log's last lines, then exit. */
function xcodebuild(label, args, what) {
  mkdirSync(LOG_DIR, { recursive: true });
  const logPath = join(LOG_DIR, `${label}.log`);
  const log = openSync(logPath, 'w');
  console.log(`ios.mjs: xcodebuild ${what}; log ${logPath}`);
  const xb = spawnSync('xcodebuild', args, { cwd: APP, stdio: ['ignore', log, log], env: ENV });
  if (xb.status !== 0) {
    console.error(`ios.mjs: xcodebuild exited ${xb.status}; the last lines of ${logPath}:`);
    spawnSync('tail', ['-40', logPath], { stdio: 'inherit' });
    process.exit(xb.status || 1);
  }
}

/** A built bundle's own id, version and build number, read from its Info.plist. */
function bundleFacts(path) {
  const info = join(path, 'Info.plist');
  return { id: plist(info, 'CFBundleIdentifier'), version: plist(info, 'CFBundleShortVersionString'), build: plist(info, 'CFBundleVersion') };
}

// ---------------------------------------------------------------------------------------------------- build, sim

function build() {
  const t0 = performance.now();
  const { workspace, scheme } = prebuild();
  xcodebuild('xcodebuild', [
    '-workspace', join('ios', workspace), '-scheme', scheme, '-configuration', 'Release',
    '-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator', '-derivedDataPath', DERIVED,
    'CODE_SIGNING_ALLOWED=NO', 'build',
  ], `${scheme}, Release, iphonesimulator, unsigned`);

  const products = join(DERIVED, 'Build', 'Products', 'Release-iphonesimulator');
  const app = readdirSync(products).find((f) => f.endsWith('.app'));
  if (!app) fail('no .app in ' + products);
  const appPath = join(products, app);
  const facts = bundleFacts(appPath);
  console.log(`ios.mjs: built ${appPath}`);
  console.log(`ios.mjs: bundle id ${facts.id}, version ${facts.version} (${facts.build}), ${Math.round((performance.now() - t0) / 1000)} s`);
  const hbc = existsSync(join(appPath, 'main.jsbundle'));
  console.log(`ios.mjs: main.jsbundle ${hbc ? 'present' : 'MISSING'}`);
  if (!hbc) process.exit(1);

  // The native spike: the widget extension sits inside the app with its own bundle id, and the app's binary holds
  // the Swift module's symbols.
  const appex = join(appPath, 'PlugIns', `${WIDGET}.appex`);
  if (!existsSync(appex)) fail(`no ${WIDGET}.appex in ${join(appPath, 'PlugIns')}: the widget target was not built into the app`);
  const widget = bundleFacts(appex);
  console.log(`ios.mjs: widget ${widget.id}, version ${widget.version} (${widget.build})`);
  if (widget.id !== `${facts.id}.${WIDGET}`) fail(`the widget's bundle id is ${widget.id}, not ${facts.id}.${WIDGET}`);
  const binary = join(appPath, plist(join(appPath, 'Info.plist'), 'CFBundleExecutable'));
  const symbols = spawnSync('nm', ['-gU', binary], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  // Swift mangles the class IASpikeModule of the module IASpike as "7IASpike0A6Module" (the repeated word is a back
  // reference), so the module's own name is what a symbol carries, never the class name spelled out.
  const swift = (symbols.stdout || '').split('\n').filter((l) => l.includes('7IASpike')).length;
  console.log(`ios.mjs: Swift module IASpike ${swift ? `present (${swift} symbols)` : 'MISSING'}`);
  if (!swift) fail('the app binary holds no symbol of the IASpike module: the local Swift module was not built in');
  return { appPath, id: facts.id };
}

function sim() {
  const { appPath, id } = build();
  if (id !== 'com.bigyerr.ironasylum.next') fail('refusing to install a bundle id that is not the Expo app\'s');
  run('xcrun', ['simctl', 'install', 'booted', appPath]);
  run('xcrun', ['simctl', 'launch', 'booted', id]);
}

// ---------------------------------------------------------------------------------------------------- release
// installProfiles, checkIdentity and uploadAuth say what frontends/app/scripts/ios.mjs says for today's lane. They are
// written out again here because that file is today's lane, which this one does not touch; cutover leaves one copy.

/** Where Xcode looks for installed profiles: the folder Xcode 16 and later reads, and the one before it. */
const PROFILE_DIRS = [
  join(homedir(), 'Library', 'Developer', 'Xcode', 'UserData', 'Provisioning Profiles'),
  join(homedir(), 'Library', 'MobileDevice', 'Provisioning Profiles'),
];

const inActions = process.env.GITHUB_ACTIONS === 'true';

function warn(msg) {
  console.log(inActions ? `::warning title=${NOTICE_TITLE}::${msg}` : `ios.mjs: warning: ${msg}`);
}

/** The App Store profiles in IOS_PROFILES, .mobileprovision paths joined by commas (the app's, the widget's): each read, checked and installed where Xcode finds it. */
function installProfiles() {
  const paths = (process.env.IOS_PROFILES || '').split(',').map((p) => p.trim()).filter(Boolean);
  if (!paths.length) fail(`no App Store profiles: set IOS_PROFILES to the .mobileprovision files, joined by commas (the app, ${WIDGET})`);
  const now = new Date();
  const profiles = paths.map((path) => {
    if (!existsSync(path)) fail(`no profile at ${path}`);
    let text = '';
    try {
      text = capture('security', ['cms', '-D', '-i', path]);
    } catch {
      fail(`${path} is not a provisioning profile (security cms could not decode it)`);
    }
    const profile = readProfile(text);
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
  for (const p of profiles) console.log(`ios.mjs: profile "${p.name}" for ${p.bundleId}, expires ${p.expires?.toISOString().slice(0, 10)}`);
  return { team: teams[0], profiles };
}

/** An Apple Distribution identity in the keychain that every profile was made with; fails naming what does not match. */
function checkIdentity(team, profiles) {
  const found = capture('security', ['find-identity', '-v', '-p', 'codesigning'])
    .split('\n')
    .map((line) => /\)\s+([0-9A-F]{40})\s+"(Apple Distribution: [^"]*\((\w+)\))"/.exec(line))
    .filter((m) => m && m[3] === team)
    .map((m) => ({ hash: m[1], name: m[2] }));
  if (!found.length) fail(`no Apple Distribution identity for team ${team} in the keychain (in the pipeline, the IOS_DIST_CERT_P12 secret holds it)`);
  const identity = found.find((id) => profiles.every((p) => p.certs.includes(id.hash)));
  if (!identity) {
    const stray = profiles.filter((p) => !found.some((id) => p.certs.includes(id.hash))).map((p) => `"${p.name}"`);
    fail(
      `${stray.length ? stray.join(' and ') : 'the profiles'} not made with the Apple Distribution certificate in the ` +
        `keychain (${found.map((id) => id.name).join(', ')}); make both profiles with the certificate today's lane uses`,
    );
  }
  console.log(`ios.mjs: signing as ${identity.name}`);
}

/** The API key xcodebuild uploads with: ASC_KEY_PATH, ASC_KEY_ID and ASC_ISSUER_ID together, or none of them. */
function uploadAuth() {
  const { ASC_KEY_PATH: path, ASC_KEY_ID: id, ASC_ISSUER_ID: issuer } = process.env;
  const given = [path, id, issuer].filter(Boolean).length;
  if (given === 0) {
    console.log('ios.mjs: no ASC_KEY_PATH; uploading with the Apple ID Xcode is signed in with');
    return [];
  }
  if (given !== 3) fail('ASC_KEY_PATH, ASC_KEY_ID and ASC_ISSUER_ID go together; set all three or none');
  if (!existsSync(path)) fail(`no API key file at ${path}`);
  return ['-authenticationKeyPath', path, '-authenticationKeyID', id, '-authenticationKeyIssuerID', issuer];
}

/** The generated project's Release configuration signed by hand: the app and its widget, each with its own profile. */
function signProject(scheme, team, profiles) {
  const pbxPath = join(APP, 'ios', `${scheme}.xcodeproj`, 'project.pbxproj');
  const xcode = createRequire(join(APP, 'package.json'))('xcode');
  const project = xcode.project(pbxPath);
  project.parseSync();
  let signed = [];
  try {
    signed = signForRelease(project.hash.project.objects, team, profiles);
  } catch (err) {
    fail(err.message);
  }
  writeFileSync(pbxPath, project.writeSync());
  for (const s of signed) console.log(`ios.mjs: ${s.target} (${s.bundleId}) signs with "${s.profile}"`);
}

/**
 * A Release archive for any iOS device, with the lane's build number in the app and its widget. Unsigned unless
 * `signing` names a team and its profiles. The archive is checked before anything is done with it: the app and the
 * widget carry the Expo app's bundle ids, core's version and this build number, or nothing goes further.
 */
function archive(signing) {
  const { bundleId, version } = nextRelease();
  const build = currentBuild();
  const label = buildLabel(version, build);
  const { workspace, scheme } = prebuild({ clean: true, env: { IA_NEXT_BUILD: build } });
  if (signing) signProject(scheme, signing.team, signing.profiles);

  const out = join(DERIVED, 'release');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const archivePath = join(out, `${scheme}.xcarchive`);
  xcodebuild('xcodebuild-archive', [
    '-workspace', join('ios', workspace), '-scheme', scheme, '-configuration', 'Release',
    '-destination', 'generic/platform=iOS', '-derivedDataPath', DERIVED, '-archivePath', archivePath,
    ...(signing ? [] : ['CODE_SIGNING_ALLOWED=NO']), 'archive',
  ], `archive of IA Next ${label}, Release, any iOS device, ${signing ? 'signed' : 'unsigned'}`);

  const apps = join(archivePath, 'Products', 'Applications');
  const app = readdirSync(apps).find((f) => f.endsWith('.app'));
  if (!app) fail('no .app in ' + apps);
  const appex = join(apps, app, 'PlugIns', `${WIDGET}.appex`);
  if (!existsSync(appex)) fail(`no ${WIDGET}.appex in the archive: the widget target was not built into the app`);
  const facts = { app: bundleFacts(join(apps, app)), widget: bundleFacts(appex) };
  console.log(`ios.mjs: archived ${facts.app.id} ${buildLabel(facts.app.version, facts.app.build)} with ${facts.widget.id} ${buildLabel(facts.widget.version, facts.widget.build)}`);
  const problems = archiveProblems({ bundleId, widget: WIDGET, version, build }, facts);
  if (problems.length) fail(`the archive is not the release: ${problems.join('; ')}`);
  return { out, archivePath, label };
}

function release() {
  const upload = !has('no-upload');
  const { team, profiles } = installProfiles();
  checkIdentity(team, profiles);
  const auth = upload ? uploadAuth() : [];
  const { out, archivePath, label } = archive({ team, profiles });

  const options = join(out, 'ExportOptions.plist');
  writeFileSync(options, exportOptions({ team, profiles, upload }));
  // -allowProvisioningUpdates lets xcodebuild reach App Store Connect with the API key; for manually signed targets it
  // only fetches a profile that is missing, and both are installed.
  xcodebuild(upload ? 'xcodebuild-upload' : 'xcodebuild-export', [
    '-exportArchive', '-archivePath', archivePath, '-exportOptionsPlist', options, '-exportPath', join(out, 'export'),
    ...(auth.length ? ['-allowProvisioningUpdates', ...auth] : []),
  ], upload ? `upload of IA Next ${label} to App Store Connect` : `export of IA Next ${label} as an .ipa`);
  if (!upload) return console.log(`ios.mjs: IA Next ${label} exported: ${join(out, 'export')}`);
  console.log(`ios.mjs: IA Next ${label} uploaded to App Store Connect; TestFlight offers it once processing ends.`);
  if (inActions) console.log(`::notice title=${NOTICE_TITLE}::testflight next ${label} uploaded`);
}

if (cmd === 'build') build();
else if (cmd === 'sim') sim();
else if (cmd === 'archive') {
  const { archivePath, label } = archive(null);
  console.log(`ios.mjs: IA Next ${label} archived unsigned: ${archivePath}`);
} else release();
