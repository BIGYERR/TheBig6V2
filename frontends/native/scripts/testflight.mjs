#!/usr/bin/env node
// App Store Connect for the beta app's TestFlight lane (MIGRATION.md phase 2; D288, docs/decisions/testflight.md): the
// Expo app, com.bigyerr.ironasylum.next, beside today's lane (frontends/app/scripts/testflight.mjs), which this file
// only imports from and never changes. Plain Node with no packages, so the pipeline's Linux jobs run it with no install.
//
//   node frontends/native/scripts/testflight.mjs gate   CI, before the macOS upload: upload=false (exit 0, a skip, never
//                                                       a failure) while any secret is unset, or when App Store Connect
//                                                       already holds this build; upload=true otherwise
//   node frontends/native/scripts/testflight.mjs wait   CI, after the upload: waits until App Store Connect has
//                                                       processed that build (up to 45 minutes); fails if it fails
//   node frontends/native/scripts/testflight.mjs leg    the deploy picture's beta leg: the newest pipeline run on main,
//                                                       its "TestFlight next" notice or the beta job that failed
//   node frontends/native/scripts/testflight.mjs build  prints the build number of this checkout
//
// A build goes up once (D288). The beta's version is core's release version, which does not move when only the Expo
// app changes, so its build number is a count: the commits in this checkout's history that changed what the app is
// built from (BUILD_INPUTS). A merge that changes none of them carries the count App Store Connect already holds and
// skips; one that changes any carries a higher count and goes up. TestFlight shows it as "0.262.0 (101)".
//
// Nothing here can reach today's lane: the job names start with "next" and the notices are titled "TestFlight next",
// so today's leg (jobs that start with "TestFlight", notices titled "TestFlight") never reads them.
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ascToken, processingVerdict } from '../../app/scripts/testflight.mjs';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(APP, '..', '..');
const API = 'https://api.appstoreconnect.apple.com';
const WAIT_MINUTES = 45;
const POLL_SECONDS = 30;

/** The title of every notice this lane writes, and the start of its three job names in the pipeline. */
export const NOTICE_TITLE = 'TestFlight next';
export const JOB_PREFIX = 'next TestFlight';

/**
 * Every secret the beta lane reads, as it is named in GitHub. The API key and the Apple Distribution certificate are
 * today's lane's own five; only the two App Store profiles are the beta's (one per signed target).
 */
export const NEXT_SECRETS = [
  'ASC_KEY_ID',
  'ASC_ISSUER_ID',
  'ASC_KEY_P8',
  'IOS_DIST_CERT_P12',
  'IOS_DIST_CERT_PASSWORD',
  'IOS_PROFILE_NEXT_APP',
  'IOS_PROFILE_NEXT_WIDGET',
];

/** What the beta app is built from, as paths from the repo root: a commit that changes any of them is a new build. */
export const BUILD_INPUTS = ['frontends/native', 'core', 'tests/semver.js'];

/**
 * The build number (CFBundleVersion) from what git says of this checkout. A shallow clone cannot count its history,
 * and a count that is not a positive whole number is no build number, so both throw instead of uploading a wrong one.
 * @param {{ shallow: boolean, count: string }} facts  `git rev-parse --is-shallow-repository`, `git rev-list --count`
 */
export function buildNumber({ shallow, count }) {
  if (shallow) throw new Error('this checkout is shallow, so its history cannot be counted; fetch all of it (fetch-depth: 0)');
  const text = String(count).trim();
  if (!/^[1-9][0-9]*$/.test(text)) throw new Error(`the commit count "${text}" is not a build number`);
  return text;
}

/** How a build reads in a notice and in TestFlight: its version, then its build number in brackets. */
export function buildLabel(version, build) {
  return `${version} (${build})`;
}

/**
 * Why an archive is not the release it was built as: each of the app and its widget must carry the Expo app's own
 * bundle id (never today's app's), core's version and this build number. An empty list lets the upload go on.
 * @param {{ bundleId: string, widget: string, version: string, build: string }} want
 * @param {{ app: { id: string, version: string, build: string }, widget: { id: string, version: string, build: string } }} got
 */
export function archiveProblems(want, got) {
  const problems = [];
  const check = (what, bundle, id) => {
    if (bundle.id !== id) problems.push(`${what} has the bundle id ${bundle.id}, not ${id}`);
    if (bundle.version !== want.version) problems.push(`${what} has the version ${bundle.version}, not ${want.version}`);
    if (bundle.build !== want.build) problems.push(`${what} has the build number ${bundle.build}, not ${want.build}`);
  };
  check('the app', got.app, want.bundleId);
  check('the widget', got.widget, `${want.bundleId}.${want.widget}`);
  return problems;
}

/** How a processing state reads in a notice (today's lane's words). */
const STATE_WORDS = { VALID: 'processed', PROCESSING: 'processing', FAILED: 'failed processing', INVALID: 'invalid' };
const stateWord = (state) => STATE_WORDS[state] ?? String(state).toLowerCase();

/**
 * Whether this run uploads. `missing` names the unset secrets; `builds` are App Store Connect's builds with this build
 * number (none when it was not asked).
 * @param {{ version: string, build: string, missing: string[], builds: Array<{ state: string }> }} facts
 */
export function nextGateDecision({ version, build, missing, builds }) {
  if (missing.length) return { upload: false, notice: `testflight next skipped: secrets not set (${missing.join(', ')})` };
  const label = buildLabel(version, build);
  if (builds.length) {
    return {
      upload: false,
      notice: `testflight next ${label} ${stateWord(builds[0].state)} (uploaded before this run; a build goes up once, the next change to the app is the next build)`,
    };
  }
  return { upload: true, notice: `testflight next ${label} is not in App Store Connect yet; uploading` };
}

/**
 * Where processing stands, in this lane's words: today's verdict, named for the beta build.
 * @param {string} version
 * @param {string} build
 * @param {Array<{ state: string }>} builds
 */
export function nextProcessingVerdict(version, build, builds) {
  return processingVerdict(`next ${buildLabel(version, build)}`, builds);
}

/**
 * The beta leg as one line: the last notice of a run's beta jobs, unless one of them ended badly, which the line names
 * first (an upload that fails writes no notice of its own, so the gate's "uploading" is the last one left).
 */
export function nextLegLine({ run, sha, completed, jobs, notices }) {
  const where = `run ${run}, ${sha.slice(0, 7)}${completed ? '' : ', still running'}`;
  const last = notices.at(-1);
  const bad = jobs.find((j) => j.conclusion && !['success', 'skipped', 'neutral'].includes(j.conclusion));
  if (bad) return `testflight next ${bad.conclusion === 'failure' ? 'failed' : bad.conclusion} in ${bad.name}${last ? `, after: ${last}` : ''} (${where})`;
  return `${last ?? 'testflight next no notice yet'} (${where})`;
}

// ---------------------------------------------------------------------------------------------------- this checkout

/** git in a folder, without the GIT_* variables a hook sets, so the folder alone names the repository. */
function git(repo, args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')));
  return execFileSync('git', args, { cwd: repo, env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * A checkout's build number: the commits in HEAD's history that changed BUILD_INPUTS. Uncommitted work does not count.
 * @param {string} [repo]  the checkout's root (this one's by default)
 */
export function currentBuild(repo = REPO) {
  return buildNumber({
    shallow: git(repo, ['rev-parse', '--is-shallow-repository']) === 'true',
    count: git(repo, ['rev-list', '--count', 'HEAD', '--', ...BUILD_INPUTS]),
  });
}

/** The bundle id and version the Expo app's own config carries (app.config.js reads core's release version). */
export function nextRelease() {
  const require = createRequire(import.meta.url);
  const config = require(join(APP, 'app.config.js'))();
  const release = { bundleId: config.ios?.bundleIdentifier, version: config.version };
  if (!release.bundleId || !release.version) throw new Error('app.config.js has no ios.bundleIdentifier or version');
  return release;
}

// ---------------------------------------------------------------------------------------------------- App Store Connect

function apiKey() {
  const keyId = process.env.ASC_KEY_ID;
  const issuerId = process.env.ASC_ISSUER_ID;
  const privateKey = process.env.ASC_KEY_P8;
  if (!keyId || !issuerId || !privateKey) throw new Error('ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 must all be set');
  if (!privateKey.includes('BEGIN PRIVATE KEY')) throw new Error('ASC_KEY_P8 is not the text of a .p8 file (its BEGIN PRIVATE KEY line is missing)');
  return { keyId, issuerId, privateKey };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ascGet(key, path) {
  let res;
  for (let attempt = 1; ; attempt++) {
    try {
      res = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${ascToken(key)}` } });
      if (res.status < 500 || attempt === 3) break;
    } catch (err) {
      if (attempt === 3) throw new Error(`App Store Connect did not answer (${err.message})`, { cause: err });
    }
    await sleep(5_000 * attempt);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const why = body.errors?.[0] ? `${body.errors[0].title}: ${body.errors[0].detail}` : res.statusText;
    throw new Error(`App Store Connect answered ${res.status} (${why})${res.status === 401 ? '; the three ASC_ secrets must hold one key\'s own values' : ''}`);
  }
  return body;
}

async function findApp(key, bundleId) {
  const body = await ascGet(key, `/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&fields[apps]=bundleId,name&limit=10`);
  const app = (body.data ?? []).find((a) => a.attributes?.bundleId === bundleId);
  if (!app) throw new Error(`App Store Connect has no app with the bundle id ${bundleId} (frontends/native/README.md, TestFlight from CI, has the steps)`);
  return app.id;
}

/** The app's builds with this build number (CFBundleVersion), newest first. */
async function buildsOf(key, appId, build) {
  const body = await ascGet(
    key,
    `/v1/builds?filter[app]=${appId}&filter[version]=${encodeURIComponent(build)}&fields[builds]=version,processingState,uploadedDate&sort=-uploadedDate&limit=10`,
  );
  return (body.data ?? []).map((b) => ({ id: b.id, version: b.attributes?.version, state: b.attributes?.processingState }));
}

// ---------------------------------------------------------------------------------------------------- modes

const inActions = process.env.GITHUB_ACTIONS === 'true';

function notice(text) {
  console.log(inActions ? `::notice title=${NOTICE_TITLE}::${text}` : text);
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  console.log(`${name}=${value}`);
}

async function gate() {
  const { bundleId, version } = nextRelease();
  const missing = NEXT_SECRETS.filter((name) => process.env[`HAS_${name}`] !== 'true');
  // While a secret is unset the lane skips before it counts or asks anything, so nothing can turn the skip red.
  const build = missing.length ? '' : currentBuild();
  let builds = [];
  if (!missing.length) {
    const key = apiKey();
    builds = await buildsOf(key, await findApp(key, bundleId), build);
  }
  const decision = nextGateDecision({ version, build, missing, builds });
  notice(decision.notice);
  output('upload', decision.upload);
  output('version', version);
  output('build', build);
}

async function wait() {
  const { bundleId, version } = nextRelease();
  const build = currentBuild();
  const key = apiKey();
  const appId = await findApp(key, bundleId);
  const deadline = performance.now() + WAIT_MINUTES * 60_000;
  let last = '';
  for (;;) {
    const verdict = nextProcessingVerdict(version, build, await buildsOf(key, appId, build));
    if (verdict.done) {
      notice(verdict.notice);
      if (!verdict.ok) process.exit(1);
      return;
    }
    if (verdict.notice !== last) console.log(verdict.notice);
    last = verdict.notice;
    if (performance.now() > deadline) {
      notice(`${verdict.notice} after ${WAIT_MINUTES} minutes; App Store Connect may still finish it`);
      process.exit(1);
    }
    await sleep(POLL_SECONDS * 1000);
  }
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 }).trim();
}

/** The beta leg, read from the newest pipeline run on main. */
function leg() {
  const [run] = JSON.parse(gh(['run', 'list', '--workflow', 'pipeline.yml', '--branch', 'main', '--limit', '1', '--json', 'databaseId,status,headSha']));
  if (!run) return console.log('testflight next none (no pipeline run on main)');
  const jobs = JSON.parse(gh(['run', 'view', String(run.databaseId), '--json', 'jobs'])).jobs.filter((j) => j.name.startsWith(JOB_PREFIX));
  if (!jobs.length) return console.log(`testflight next none (run ${run.databaseId}, ${run.headSha.slice(0, 7)} has no ${JOB_PREFIX} job)`);
  const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  const notices = jobs.flatMap((j) =>
    JSON.parse(gh(['api', `repos/${repo}/check-runs/${j.databaseId}/annotations`]))
      .filter((a) => a.annotation_level === 'notice' && a.title === NOTICE_TITLE)
      .map((a) => a.message),
  );
  console.log(nextLegLine({ run: run.databaseId, sha: run.headSha, completed: run.status === 'completed', jobs, notices }));
}

const MODES = { gate, wait, leg, build: () => console.log(currentBuild()) };
const mode = process.argv[2];
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!MODES[mode]) {
    console.error('usage: node frontends/native/scripts/testflight.mjs <gate|wait|leg|build>');
    process.exit(1);
  }
  Promise.resolve(MODES[mode]()).catch((err) => {
    console.error(`testflight next: ${err.message}`);
    process.exit(1);
  });
}
