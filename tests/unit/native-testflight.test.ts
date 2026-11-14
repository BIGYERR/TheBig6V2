// The beta app's TestFlight lane (D288 P-NEXTLANE, docs/decisions/testflight.md; MIGRATION.md phase 2): the Expo app,
// com.bigyerr.ironasylum.next, uploaded beside today's lane and apart from it. What the lane decides from the version,
// the secrets present and what App Store Connect already holds; its build number, a count of the commits that changed
// what the app is built from, so a build goes up once; the archive it refuses to upload; and the pipeline's wiring,
// which must leave today's three TestFlight jobs and today's leg alone.
// Expected values are typed by hand from the ruling, never asked of the script. The counting is checked against real
// git in a temp repository whose history is written out below, commit by commit.
// This file imports plain Node files only (frontends/native/scripts/testflight.mjs and what it imports): CI's tests job
// installs neither the Expo app's packages nor today's app's, and it must still run here.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, describe, test } from 'vitest';
import { VERSION, semver } from '@ia/core';
import { REPO } from '../support/app.ts';

interface Decision { upload: boolean; notice: string }
interface Bundle { id: string; version: string; build: string }
interface Lane {
  NOTICE_TITLE: string;
  JOB_PREFIX: string;
  NEXT_SECRETS: string[];
  BUILD_INPUTS: string[];
  buildNumber(facts: { shallow: boolean; count: string }): string;
  buildLabel(version: string, build: string): string;
  nextGateDecision(facts: { version: string; build: string; missing: string[]; builds: Array<{ state: string }> }): Decision;
  nextProcessingVerdict(version: string, build: string, builds: Array<{ state: string }>): { done: boolean; ok: boolean; notice: string };
  nextLegLine(facts: { run: number; sha: string; completed: boolean; jobs: Array<{ name: string; conclusion: string | null }>; notices: string[] }): string;
  archiveProblems(want: { bundleId: string; widget: string; version: string; build: string }, got: { app: Bundle; widget: Bundle }): string[];
  currentBuild(repo?: string): string;
  nextRelease(): { bundleId: string; version: string };
}
interface Today { SECRETS: string[] }

const NATIVE = join(REPO, 'frontends', 'native');
const L = (await import(pathToFileURL(join(NATIVE, 'scripts', 'testflight.mjs')).href)) as Lane;
const T = (await import(pathToFileURL(join(REPO, 'frontends', 'app', 'scripts', 'testflight.mjs')).href)) as Today;

describe('beta lane: the gate uploads a build once, and only with every secret set', () => {
  test('it skips, naming the unset secrets, while any is missing', () => {
    const d = L.nextGateDecision({ version: '0.262.0', build: '', missing: ['IOS_PROFILE_NEXT_APP', 'IOS_PROFILE_NEXT_WIDGET'], builds: [] });
    assert.equal(d.upload, false);
    assert.equal(d.notice, 'testflight next skipped: secrets not set (IOS_PROFILE_NEXT_APP, IOS_PROFILE_NEXT_WIDGET)');
  });

  test('it skips a build App Store Connect already holds, saying what state it is in', () => {
    const d = L.nextGateDecision({ version: '0.262.0', build: '101', missing: [], builds: [{ state: 'VALID' }] });
    assert.equal(d.upload, false);
    assert.equal(d.notice, 'testflight next 0.262.0 (101) processed (uploaded before this run; a build goes up once, the next change to the app is the next build)');
  });

  test('it skips a build whose earlier upload failed processing', () => {
    const d = L.nextGateDecision({ version: '0.262.0', build: '101', missing: [], builds: [{ state: 'INVALID' }] });
    assert.equal(d.upload, false);
    assert.match(d.notice, /^testflight next 0\.262\.0 \(101\) invalid /);
  });

  test('it uploads a build App Store Connect does not hold, under the same version', () => {
    const d = L.nextGateDecision({ version: '0.262.0', build: '102', missing: [], builds: [] });
    assert.equal(d.upload, true);
    assert.equal(d.notice, 'testflight next 0.262.0 (102) is not in App Store Connect yet; uploading');
  });

  test('a missing secret wins over anything App Store Connect holds', () => {
    assert.equal(L.nextGateDecision({ version: '0.262.0', build: '101', missing: ['ASC_KEY_P8'], builds: [{ state: 'VALID' }] }).notice,
      'testflight next skipped: secrets not set (ASC_KEY_P8)');
  });
});

describe('beta lane: the build number counts the commits that changed what the app is built from', () => {
  test('the app is built from frontends/native, core and tests/semver.js', () => {
    assert.deepEqual(L.BUILD_INPUTS, ['frontends/native', 'core', 'tests/semver.js']);
  });

  test('a count is the build number as it stands', () => {
    assert.equal(L.buildNumber({ shallow: false, count: '101' }), '101');
    assert.equal(L.buildNumber({ shallow: false, count: '101\n' }), '101');
  });

  test('a shallow checkout has no build number: its history cannot be counted', () => {
    assert.throws(() => L.buildNumber({ shallow: true, count: '1' }), /shallow/);
  });

  test('a count that is not a positive whole number is no build number', () => {
    for (const count of ['0', '', '-1', '1.5', '007', 'abc']) {
      assert.throws(() => L.buildNumber({ shallow: false, count }), /not a build number/, `"${count}"`);
    }
  });

  test('a build reads as its version, then its number in brackets', () => {
    assert.equal(L.buildLabel('0.262.0', '101'), '0.262.0 (101)');
  });

  // Real git, in a temp repository: dev grows a commit at a time and main takes it by merge commits, as this repo does.
  const gitFree = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')));
  const root = mkdtempSync(join(tmpdir(), 'ia-next-build-'));
  afterAll(() => rmSync(root, { recursive: true, force: true }));
  const repo = join(root, 'repo');
  const g = (dir: string, ...args: string[]): string =>
    execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args],
      { cwd: dir, env: gitFree, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = (file: string): void => {
    mkdirSync(dirname(join(repo, file)), { recursive: true });
    writeFileSync(join(repo, file), `${file} ${Math.random()}\n`);
    g(repo, 'add', '--', file);
    g(repo, 'commit', '-q', '-m', `change ${file}`);
  };
  const release = (): void => {
    g(repo, 'checkout', '-q', 'main');
    g(repo, 'merge', '-q', '--no-ff', '-m', 'release', 'dev');
    g(repo, 'checkout', '-q', 'dev');
  };

  test('it goes up by one for each commit that changes an input, and stays for any other, on dev and through main\'s merges', () => {
    mkdirSync(repo);
    g(repo, 'init', '-q', '-b', 'dev');
    commit('core/src/version.ts');
    assert.equal(L.currentBuild(repo), '1');
    g(repo, 'branch', 'main');

    commit('docs/decisions/testflight.md');
    assert.equal(L.currentBuild(repo), '1', 'a docs commit is not a new build');
    commit('frontends/native/app.config.js');
    assert.equal(L.currentBuild(repo), '2');
    commit('tests/semver.js');
    assert.equal(L.currentBuild(repo), '3');
    commit('tests/unit/some.test.ts');
    commit('frontends/app/config.xml');
    commit('index.html');
    assert.equal(L.currentBuild(repo), '3', 'a test, today\'s app and the page are not inputs');

    release();
    g(repo, 'checkout', '-q', 'main');
    assert.equal(L.currentBuild(repo), '3', 'main\'s merge commit carries dev\'s count');
    g(repo, 'checkout', '-q', 'dev');

    commit('IRON_ASYLUM_HANDOFF_1_1.md');
    release();
    g(repo, 'checkout', '-q', 'main');
    assert.equal(L.currentBuild(repo), '3', 'a merge that changes no input is the build App Store Connect already holds');
    g(repo, 'checkout', '-q', 'dev');

    commit('frontends/native/src/App.tsx');
    release();
    g(repo, 'checkout', '-q', 'main');
    assert.equal(L.currentBuild(repo), '4', 'a merge that changes the app is the next build');
  });

  test('it refuses to count a shallow clone', () => {
    const shallow = join(root, 'shallow');
    g(root, 'clone', '-q', '--depth', '1', pathToFileURL(repo).href, shallow);
    assert.throws(() => L.currentBuild(shallow), /shallow/);
  });
});

describe('beta lane: the wait and the leg speak of the beta build', () => {
  test('the wait ends well on VALID, with the notice the leg reads', () => {
    assert.deepEqual(L.nextProcessingVerdict('0.262.0', '101', [{ state: 'VALID' }]),
      { done: true, ok: true, notice: 'testflight next 0.262.0 (101) processed' });
  });

  test('the wait keeps waiting while the build is not listed or still processing, and ends badly on FAILED', () => {
    assert.equal(L.nextProcessingVerdict('0.262.0', '101', []).done, false);
    assert.equal(L.nextProcessingVerdict('0.262.0', '101', [{ state: 'PROCESSING' }]).done, false);
    assert.deepEqual(L.nextProcessingVerdict('0.262.0', '101', [{ state: 'FAILED' }]),
      { done: true, ok: false, notice: 'testflight next 0.262.0 (101) failed processing' });
  });

  test('the leg is the last notice of the run', () => {
    const line = L.nextLegLine({
      run: 7, sha: 'a51f4b4c0ffee', completed: true,
      jobs: [{ name: 'next TestFlight (gate)', conclusion: 'success' }, { name: 'next TestFlight (processed)', conclusion: 'success' }],
      notices: ['testflight next 0.262.0 (101) is not in App Store Connect yet; uploading', 'testflight next 0.262.0 (101) processed'],
    });
    assert.equal(line, 'testflight next 0.262.0 (101) processed (run 7, a51f4b4)');
  });

  test('the leg names a beta job that failed, never the notice before it', () => {
    const line = L.nextLegLine({
      run: 7, sha: 'a51f4b4c0ffee', completed: true,
      jobs: [{ name: 'next TestFlight (gate)', conclusion: 'success' }, { name: 'next TestFlight (upload)', conclusion: 'failure' }],
      notices: ['testflight next 0.262.0 (101) is not in App Store Connect yet; uploading'],
    });
    assert.equal(line, 'testflight next failed in next TestFlight (upload), after: testflight next 0.262.0 (101) is not in App Store Connect yet; uploading (run 7, a51f4b4)');
  });

  test('the leg says so when a run has written no notice yet', () => {
    assert.equal(L.nextLegLine({ run: 7, sha: 'a51f4b4c0ffee', completed: false, jobs: [{ name: 'next TestFlight (gate)', conclusion: null }], notices: [] }),
      'testflight next no notice yet (run 7, a51f4b4, still running)');
  });
});

describe('beta lane: an archive that is not the release is never uploaded', () => {
  const want = { bundleId: 'com.bigyerr.ironasylum.next', widget: 'RestTimerWidget', version: '0.262.0', build: '101' };
  const app = { id: 'com.bigyerr.ironasylum.next', version: '0.262.0', build: '101' };
  const widget = { id: 'com.bigyerr.ironasylum.next.RestTimerWidget', version: '0.262.0', build: '101' };

  test('the app and its widget with the beta\'s ids, core\'s version and the build number pass', () => {
    assert.deepEqual(L.archiveProblems(want, { app, widget }), []);
  });

  test('today\'s bundle id is refused, in the app and in the widget', () => {
    assert.deepEqual(L.archiveProblems(want, { app: { ...app, id: 'com.bigyerr.ironasylum' }, widget }),
      ['the app has the bundle id com.bigyerr.ironasylum, not com.bigyerr.ironasylum.next']);
    assert.deepEqual(L.archiveProblems(want, { app, widget: { ...widget, id: 'com.bigyerr.ironasylum.RestTimerWidget' } }),
      ['the widget has the bundle id com.bigyerr.ironasylum.RestTimerWidget, not com.bigyerr.ironasylum.next.RestTimerWidget']);
  });

  test('a widget whose version or build number is not the app\'s is refused', () => {
    assert.deepEqual(L.archiveProblems(want, { app, widget: { ...widget, version: '1.0', build: '1' } }),
      ['the widget has the version 1.0, not 0.262.0', 'the widget has the build number 1, not 101']);
  });

  test('an app that kept the version as its build number is refused', () => {
    assert.deepEqual(L.archiveProblems(want, { app: { ...app, build: '0.262.0' }, widget }),
      ['the app has the build number 0.262.0, not 101']);
  });
});

describe('beta lane: the app\'s own config', () => {
  const require = createRequire(import.meta.url);
  interface ExpoConfig { version: string; ios: { bundleIdentifier: string; buildNumber: string; config?: { usesNonExemptEncryption?: boolean } } }
  const config = require(join(NATIVE, 'app.config.js')) as () => ExpoConfig;
  const withBuild = <R>(value: string | undefined, read: () => R): R => {
    const before = process.env['IA_NEXT_BUILD'];
    if (value === undefined) delete process.env['IA_NEXT_BUILD']; else process.env['IA_NEXT_BUILD'] = value;
    try { return read(); } finally {
      if (before === undefined) delete process.env['IA_NEXT_BUILD']; else process.env['IA_NEXT_BUILD'] = before;
    }
  };

  test('the lane looks up the beta\'s bundle id and core\'s version, never today\'s app', () => {
    const r = L.nextRelease();
    assert.equal(r.bundleId, 'com.bigyerr.ironasylum.next');
    assert.equal(semver.cmp(r.version, VERSION), 0);
  });

  test('the build number the lane hands in is the app\'s, under core\'s version', () => {
    const c = withBuild('101', () => config());
    assert.equal(c.ios.buildNumber, '101');
    assert.equal(semver.cmp(c.version, VERSION), 0);
  });

  test('a build number that is not a positive whole number stops the config', () => {
    for (const bad of ['0', '1.2', 'abc', '0.262.0']) assert.throws(() => withBuild(bad, () => config()), /not a build number/, bad);
  });

  test('it answers the export compliance question: no non-exempt encryption', () => {
    assert.equal(withBuild(undefined, () => config()).ios.config?.usesNonExemptEncryption, false);
  });
});

describe('beta lane: the pipeline runs it beside today\'s lane and apart from it', () => {
  const code = (text: string): string => text.split('\n').filter((line) => !/^\s*#/.test(line)).join('\n');
  const pipeline = readFileSync(join(REPO, '.github', 'workflows', 'pipeline.yml'), 'utf8');
  const nextAt = pipeline.indexOf('\n  next-testflight-gate:');
  const todayAt = pipeline.indexOf('\n  testflight-gate:');
  const next = code(pipeline.slice(nextAt, todayAt));
  const today = code(pipeline.slice(todayAt));
  const jobs = [...code(pipeline).matchAll(/^ {2}([a-z0-9-]+):\n {4}name: (.+)$/gm)].map((m) => ({ id: m[1]!, name: m[2]! }));

  test('its three jobs sit before today\'s gate, which today\'s own test reads from to the end of the file', () => {
    assert.ok(nextAt > 0 && todayAt > nextAt, 'next-testflight-gate comes before testflight-gate');
    assert.deepEqual(jobs.filter((j) => j.id.startsWith('next-')).map((j) => j.id),
      ['next-testflight-gate', 'next-testflight', 'next-testflight-processed']);
  });

  test('its job names start with "next TestFlight", so today\'s leg, which reads jobs that start with "TestFlight", never reads them', () => {
    assert.equal(L.JOB_PREFIX, 'next TestFlight');
    assert.deepEqual(jobs.filter((j) => j.id.startsWith('next-')).map((j) => j.name),
      ['next TestFlight (gate)', 'next TestFlight (upload)', 'next TestFlight (processed)']);
    assert.deepEqual(jobs.filter((j) => j.name.startsWith('TestFlight')).map((j) => j.id),
      ['testflight-gate', 'testflight', 'testflight-processed']);
  });

  test('its notices are titled "TestFlight next", never "TestFlight", the title today\'s leg reads', () => {
    assert.equal(L.NOTICE_TITLE, 'TestFlight next');
  });

  test('it needs none of today\'s TestFlight jobs', () => {
    assert.deepEqual([...next.matchAll(/^ {4}needs: (.+)$/gm)].map((m) => m[1]), ['deployed', 'next-testflight-gate', 'next-testflight']);
  });

  test('it reads exactly its own seven secrets: today\'s key and certificate, and the beta\'s two profiles', () => {
    assert.deepEqual(L.NEXT_SECRETS, ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8', 'IOS_DIST_CERT_P12', 'IOS_DIST_CERT_PASSWORD',
      'IOS_PROFILE_NEXT_APP', 'IOS_PROFILE_NEXT_WIDGET']);
    const read = new Set([...next.matchAll(/secrets\.([A-Z0-9_]+)/g)].map((m) => m[1]!));
    assert.deepEqual([...read].sort(), [...L.NEXT_SECRETS].sort());
    assert.ok(!read.has('IOS_PROFILE_APP') && !read.has('IOS_PROFILE_WIDGET'), 'today\'s profiles are never read by the beta lane');
    assert.deepEqual(L.NEXT_SECRETS.filter((s) => T.SECRETS.includes(s)),
      ['ASC_KEY_ID', 'ASC_ISSUER_ID', 'ASC_KEY_P8', 'IOS_DIST_CERT_P12', 'IOS_DIST_CERT_PASSWORD']);
  });

  test('its gate is told whether each secret is set, never given the signing ones', () => {
    const gate = next.slice(0, next.indexOf('\n  next-testflight:'));
    const flags = [...gate.matchAll(/HAS_([A-Z0-9_]+): \$\{\{ secrets\.([A-Z0-9_]+) != '' \}\}/g)];
    assert.deepEqual(flags.map((m) => m[1]).sort(), [...L.NEXT_SECRETS].sort());
    assert.ok(flags.every((m) => m[1] === m[2]), 'each HAS_ flag reads its own secret');
    for (const name of ['IOS_DIST_CERT_P12', 'IOS_DIST_CERT_PASSWORD', 'IOS_PROFILE_NEXT_APP', 'IOS_PROFILE_NEXT_WIDGET']) {
      assert.doesNotMatch(gate, new RegExp(`^\\s+${name}: \\$\\{\\{ secrets\\.`, 'm'), `${name}'s value stays out of the gate`);
    }
  });

  test('each of its jobs fetches the whole history, which the build number is counted from', () => {
    const blocks = next.split(/\n {2}(?=next-testflight)/).filter((b) => b.startsWith('next-testflight'));
    assert.equal(blocks.length, 3);
    for (const b of blocks) assert.match(b, /uses: actions\/checkout@v4\n {8}with:\n {10}fetch-depth: 0/, b.slice(0, 40));
  });

  test('it runs the Expo app\'s scripts alone, and writes its signing files outside the checkout', () => {
    assert.match(next, /run: node frontends\/native\/scripts\/testflight\.mjs gate/);
    assert.match(next, /run: node frontends\/native\/scripts\/testflight\.mjs wait/);
    assert.match(next, /working-directory: frontends\/native/);
    assert.match(next, /npm run release-ios/);
    assert.doesNotMatch(next, /frontends\/app\b/);
    assert.match(next, /dir="\$RUNNER_TEMP\/signing-next"/);
  });

  test('today\'s three jobs read nothing of the beta\'s', () => {
    assert.doesNotMatch(today, /NEXT|frontends\/native|next-testflight|signing-next/);
  });
});
