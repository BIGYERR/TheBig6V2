#!/usr/bin/env node
// App Store Connect for the TestFlight lane (handoff §12, the native lane), in plain Node with no packages, so the
// pipeline's Linux jobs run it with no npm install.
//
//   node frontends/app/scripts/testflight.mjs gate   CI, before the macOS upload: upload=false (exit 0, a skip, never a
//                                                    failure) while any of Mario's secrets is unset, or when App Store
//                                                    Connect already holds config.xml's build; upload=true otherwise
//   node frontends/app/scripts/testflight.mjs wait   CI, after the upload: waits until App Store Connect has processed
//                                                    that build (up to 45 minutes); fails if processing fails
//   node frontends/app/scripts/testflight.mjs leg    rhythm step 7's TestFlight leg: the TestFlight notice of the latest
//                                                    pipeline run on main, or the TestFlight job that failed in it
//                                                    (only CI holds the key; needs gh logged in)
//
// A version goes up once (Mario, Post-v0.251.1): App Store Connect refuses a second build of one version anyway, so
// a merge that carries a version it holds skips the upload, and a fix is the next PATCH. The gate and wait read the
// API key from ASC_KEY_ID, ASC_ISSUER_ID and ASC_KEY_P8 (the .p8 file's text), filled from Mario's secrets, and print
// none of them. The gate learns whether the signing secrets are set from HAS_<NAME>=true|false, never their values.
// Every outcome is one GitHub notice titled TestFlight ("testflight 0.251.1 processed"), which `leg` reads back.
import { execFileSync } from 'node:child_process';
import { sign } from 'node:crypto';
import { appendFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.appstoreconnect.apple.com';
const WAIT_MINUTES = 45;
const POLL_SECONDS = 30;

/** Every secret the TestFlight jobs read, as it is named in GitHub (repo Settings, Secrets and variables, Actions). */
export const SECRETS = [
  'ASC_KEY_ID',
  'ASC_ISSUER_ID',
  'ASC_KEY_P8',
  'IOS_DIST_CERT_P12',
  'IOS_DIST_CERT_PASSWORD',
  'IOS_PROFILE_APP',
  'IOS_PROFILE_WIDGET',
];

/** The bundle id, version and build number config.xml carries (the release commit writes them; scripts/ios.mjs). */
export function nativeRelease(xml) {
  const widget = /<widget\b[^>]*>/.exec(xml)?.[0] ?? '';
  const attr = (name) => new RegExp(`\\s${name}="([^"]+)"`).exec(widget)?.[1];
  const release = { bundleId: attr('id'), version: attr('version'), build: attr('ios-CFBundleVersion') };
  if (!release.bundleId || !release.version || !release.build) throw new Error('config.xml has no widget id, version or ios-CFBundleVersion');
  return release;
}

/**
 * An App Store Connect API token: an ES256 JWT that lives 15 minutes (Apple's limit is 20).
 * @param {{ keyId: string, issuerId: string, privateKey: string, now?: number }} key
 */
export function ascToken({ keyId, issuerId, privateKey, now = Date.now() }) {
  const iat = Math.floor(now / 1000);
  const part = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const body = `${part({ alg: 'ES256', kid: keyId, typ: 'JWT' })}.${part({ iss: issuerId, iat, exp: iat + 15 * 60, aud: 'appstoreconnect-v1' })}`;
  const signature = sign('sha256', Buffer.from(body), { key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${body}.${signature.toString('base64url')}`;
}

/** How a processing state reads in a notice. */
const STATE_WORDS = { VALID: 'processed', PROCESSING: 'processing', FAILED: 'failed processing', INVALID: 'invalid' };
const stateWord = (state) => STATE_WORDS[state] ?? String(state).toLowerCase();

/**
 * Whether this run uploads. `missing` names the unset secrets; `builds` are App Store Connect's builds with this build
 * number (none when it was not asked).
 * @param {{ version: string, missing: string[], builds: Array<{ state: string }> }} facts
 */
export function gateDecision({ version, missing, builds }) {
  if (missing.length) return { upload: false, notice: `testflight skipped: secrets not set (${missing.join(', ')})` };
  if (builds.length) {
    return {
      upload: false,
      notice: `testflight ${version} ${stateWord(builds[0].state)} (uploaded before this run; a version goes up once, a fix is the next PATCH)`,
    };
  }
  return { upload: true, notice: `testflight ${version} is not in App Store Connect yet; uploading` };
}

/**
 * Where processing stands: done (and whether it ended well) or still waiting.
 * @param {string} version
 * @param {Array<{ state: string }>} builds
 */
export function processingVerdict(version, builds) {
  const state = builds[0]?.state;
  if (state === undefined) return { done: false, ok: false, notice: `testflight ${version} not listed by App Store Connect yet` };
  if (state === 'PROCESSING') return { done: false, ok: false, notice: `testflight ${version} processing` };
  return { done: true, ok: state === 'VALID', notice: `testflight ${version} ${stateWord(state)}` };
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
  if (!app) throw new Error(`App Store Connect has no app with the bundle id ${bundleId}`);
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const inActions = process.env.GITHUB_ACTIONS === 'true';

function notice(text) {
  console.log(inActions ? `::notice title=TestFlight::${text}` : text);
}

function output(name, value) {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  console.log(`${name}=${value}`);
}

function release() {
  return nativeRelease(readFileSync(join(APP, 'config.xml'), 'utf8'));
}

async function gate() {
  const { bundleId, version, build } = release();
  const missing = SECRETS.filter((name) => process.env[`HAS_${name}`] !== 'true');
  let builds = [];
  if (!missing.length) {
    const key = apiKey();
    builds = await buildsOf(key, await findApp(key, bundleId), build);
  }
  const decision = gateDecision({ version, missing, builds });
  notice(decision.notice);
  output('upload', decision.upload);
  output('version', version);
}

async function wait() {
  const { bundleId, version, build } = release();
  const key = apiKey();
  const appId = await findApp(key, bundleId);
  const deadline = Date.now() + WAIT_MINUTES * 60_000;
  let last = '';
  for (;;) {
    const verdict = processingVerdict(version, await buildsOf(key, appId, build));
    if (verdict.done) {
      notice(verdict.notice);
      if (!verdict.ok) process.exit(1);
      return;
    }
    if (verdict.notice !== last) console.log(verdict.notice);
    last = verdict.notice;
    if (Date.now() > deadline) {
      notice(`${verdict.notice} after ${WAIT_MINUTES} minutes; App Store Connect may still finish it`);
      process.exit(1);
    }
    await sleep(POLL_SECONDS * 1000);
  }
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60_000 }).trim();
}

/**
 * The leg as one line: the last TestFlight notice of a run, unless one of its TestFlight jobs ended badly, which the
 * line names first. An upload that fails writes no notice of its own, so the gate's "uploading" is the last one left.
 */
export function legLine({ run, sha, completed, jobs, notices }) {
  const where = `run ${run}, ${sha.slice(0, 7)}${completed ? '' : ', still running'}`;
  const last = notices.at(-1);
  const bad = jobs.find((j) => j.conclusion && !['success', 'skipped', 'neutral'].includes(j.conclusion));
  if (bad) return `testflight ${bad.conclusion === 'failure' ? 'failed' : bad.conclusion} in ${bad.name}${last ? `, after: ${last}` : ''} (${where})`;
  return `${last ?? 'testflight no notice yet'} (${where})`;
}

/** The leg, read from the newest pipeline run on main. */
function leg() {
  const [run] = JSON.parse(gh(['run', 'list', '--workflow', 'pipeline.yml', '--branch', 'main', '--limit', '1', '--json', 'databaseId,status,headSha']));
  if (!run) return console.log('testflight none (no pipeline run on main)');
  const jobs = JSON.parse(gh(['run', 'view', String(run.databaseId), '--json', 'jobs'])).jobs.filter((j) => j.name.startsWith('TestFlight'));
  if (!jobs.length) return console.log(`testflight none (run ${run.databaseId}, ${run.headSha.slice(0, 7)} has no TestFlight job)`);
  const repo = gh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
  const notices = jobs.flatMap((j) =>
    JSON.parse(gh(['api', `repos/${repo}/check-runs/${j.databaseId}/annotations`]))
      .filter((a) => a.annotation_level === 'notice' && a.title === 'TestFlight')
      .map((a) => a.message),
  );
  console.log(legLine({ run: run.databaseId, sha: run.headSha, completed: run.status === 'completed', jobs, notices }));
}

const MODES = { gate, wait, leg };
const mode = process.argv[2];
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!MODES[mode]) {
    console.error('usage: node frontends/app/scripts/testflight.mjs <gate|wait|leg>');
    process.exit(1);
  }
  Promise.resolve(MODES[mode]()).catch((err) => {
    console.error(`testflight: ${err.message}`);
    process.exit(1);
  });
}
