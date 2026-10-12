#!/usr/bin/env node
// The 60-second check: everything fast enough to run while developing, under a hard 60 second limit. It is the check
// every commit runs (.githooks/pre-commit) and the local proof for every change. Everything slower (the sweeps, the
// Docker e2e) runs in GitHub Actions on every push to dev and on the pull request from dev into main
// (.github/workflows/pipeline.yml), which must pass before anything deploys.
//
// Lanes, each run only when what it checks changed (or always, without --staged):
//   tests    the feature tests (tests/unit, tests/integration, against tests/snapshots; CLAUDE.md Test layout) by
//            Vitest, beside the strict TypeScript type check of core/ and tests/ (tests/sweeps is type-checked here and
//            run in CI only). tests/node_modules is installed (npm ci) when it is missing.
//   build    index.html is the build of frontends/app/src/legacy/src (frontends/app/scripts/build-index.mjs), its ia-version meta reads
//            as a version, its inline script compiles, and it boots in the harness and builds HALF_MANNY, self-stable.
//   app      frontends/app/: sync from index.html, type check, unit and integration tests, lint.
//   backend  backend/: type checks, tests, lint.
//
//   node tools/check.mjs              every lane
//   node tools/check.mjs --staged     only the lanes the staged files touch (what the pre-commit hook runs)
//   node tools/check.mjs --list       print what would run, and exit
//
// The limit is hard: nothing runs past 60 s from the start (IA_CHECK_SECONDS can lower it, never raise it). A step
// still running at the deadline fails the check, since every step here is meant to take seconds.
//
// The check is a logged run (tools/runlog.mjs), type "check": every step is an event.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join } from 'node:path';
import { REPO, attachRun, duration, startRun } from './runlog.mjs';

/** ia-version is read and compared only through tests/semver.js (CommonJS): MAJOR.MINOR.PATCH, a bare N reads as 0.N.0. */
const SV = createRequire(import.meta.url)('../tests/semver.js');

const LIMIT_S = Math.min(60, Number(process.env.IA_CHECK_SECONDS) || 60);
const args = process.argv.slice(2);
const STAGED = args.includes('--staged');
const LIST = args.includes('--list');
const t0 = Date.now();
const deadline = t0 + LIMIT_S * 1000;
const left = () => deadline - Date.now();

// ── What to check ──────────────────────────────────────────────────────────────────────────────────────────────
function stagedPaths() {
  try {
    return execFileSync('git', ['-C', REPO, 'diff', '--cached', '--name-only'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return null;
  }
}
const paths = STAGED ? stagedPaths() : null;
const touches = (re) => paths === null || paths.some((p) => re.test(p));
/** The feature tests' own files: their folders and the tests package (package.json, its lockfile, tsconfig, Vitest config). */
const FEATURE_TESTS = /^tests\/((unit|integration|sweeps|snapshots|support)\/|package(-lock)?\.json$|tsconfig\.json$|vitest\.config\.mts$)/;
/** What Vitest runs here, relative to tests/: every *.test.ts under these folders (tests/sweeps runs in CI only). */
const FEATURE_TEST_DIRS = ['unit', 'integration'];
const TESTS = join(REPO, 'tests');
const want = {
  tests: touches(/^(index\.html|core\/|tests\/harness\.js$|tests\/semver\.js$|tests\/lattice193\.js$)/) || touches(FEATURE_TESTS),
  // index.html is generated from frontends/app/src/legacy/src (frontends/app/scripts/build-index.mjs); the two must never drift.
  build: touches(/^(index\.html|frontends\/app\/src\/legacy\/src\/|frontends\/app\/scripts\/build-index\.mjs$|tests\/harness\.js$)/),
  app: touches(/^(frontends\/app\/|tools\/|index\.html)/),
  backend: touches(/^backend\//),
};

if (LIST) {
  console.log(`check: limit ${LIMIT_S} s; ${STAGED ? `staged files: ${paths?.length ?? 0}` : 'everything'}`);
  console.log(`  tests   ${want.tests ? `type check (core, tests), vitest run ${FEATURE_TEST_DIRS.join(' ')} (in tests/)` : 'not touched'}`);
  console.log(`  build   ${want.build ? 'index.html is the build of frontends/app/src/legacy/src; its version, inline script and boot' : 'not touched'}`);
  console.log(`  app     ${want.app ? 'sync, typecheck, unit, integration, lint' : 'not touched'}`);
  console.log(`  backend ${want.backend ? 'typecheck, test, lint' : 'not touched'}`);
  process.exit(0);
}

// ── Running ────────────────────────────────────────────────────────────────────────────────────────────────────
const attached = attachRun();
let run = attached;
if (!run) {
  try {
    run = startRun('check', { command: ['node tools/check.mjs', ...args].join(' '), cwd: REPO });
  } catch {
    run = null;
  }
}
const note = (subject, text, global = false) => run?.event(subject, text, { global });
const failures = [];

/**
 * Runs one command until it ends or `stopAt` (epoch ms). Resolves { code, out, ms, stopped }.
 * @param {string} cmd @param {string[]} cmdArgs @param {string} cwd @param {number} stopAt
 */
function exec(cmd, cmdArgs, cwd, stopAt, env = {}) {
  return new Promise((resolve) => {
    const started = Date.now();
    let out = '';
    let stopped = false;
    const child = spawn(cmd, cmdArgs, { cwd, env: { ...process.env, ...env, FORCE_COLOR: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => {
      stopped = true;
      child.kill('SIGKILL');
    }, Math.max(0, stopAt - Date.now()));
    child.on('error', (err) => {
      out += `\n${err.message}`;
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, out, ms: Date.now() - started, stopped });
    });
  });
}

const tail = (out, n = 15) => out.trimEnd().split('\n').slice(-n).join('\n');

/** One step that must finish: fails on a nonzero exit or on reaching the deadline. */
async function step(lane, name, cmd, cmdArgs, cwd, env = {}) {
  if (left() <= 0) {
    failures.push(`${lane}: ${name} did not start: the ${LIMIT_S} s limit was reached`);
    return false;
  }
  const r = await exec(cmd, cmdArgs, cwd, deadline, env);
  const ok = r.code === 0 && !r.stopped;
  note(lane, `${ok ? 'ok' : r.stopped ? 'STOPPED at the limit' : 'FAILED'}: ${name} (${duration(r.ms)})`, !ok);
  if (!ok) {
    failures.push(`${lane}: ${name} ${r.stopped ? `was still running at the ${LIMIT_S} s limit` : `failed (exit ${r.code})`}`);
    console.error(`\ncheck: ${lane}: ${name} ${r.stopped ? 'hit the limit' : 'failed'}:\n${tail(r.out)}\n`);
    // The whole output stays with the run, so a red step can be read after the terminal is gone.
    if (run) {
      try {
        const file = run.artifact(`${lane}-${name.replace(/\W+/g, '-')}.log`);
        writeFileSync(file, r.out);
        note(lane, `${name}: output kept in artifacts/${basename(file)}`, false);
      } catch {
        // The terminal still has the tail.
      }
    }
  }
  return ok;
}

/**
 * The feature tests, whole: Vitest over tests/unit and tests/integration, and beside it the strict type check of core/
 * and of tests/ (which includes tests/sweeps). The tests prove index.html against the committed snapshots, so IA_APP
 * (another body) and UPDATE_SNAPSHOTS (rewrite the goldens) are cleared for this step. tests/node_modules is installed
 * from the committed lockfile when it is missing, inside the same limit.
 */
async function testsLane() {
  const bin = (name) => join(TESTS, 'node_modules', '.bin', name);
  if (!existsSync(bin('vitest')) || !existsSync(bin('tsc'))) {
    note('tests', 'tests/node_modules is missing; installing it (npm ci in tests/)');
    if (!(await step('tests', 'install (npm ci in tests/)', 'npm', ['ci', '--no-audit', '--no-fund'], TESTS))) return;
  }
  await Promise.all([
    step('tests', 'type check (core)', bin('tsc'), ['-p', join(REPO, 'core')], TESTS),
    step('tests', 'type check (tests)', bin('tsc'), ['-p', '.'], TESTS),
    step('tests', 'unit and integration tests', bin('vitest'), ['run', ...FEATURE_TEST_DIRS], TESTS, {
      IA_APP: undefined,
      UPDATE_SNAPSHOTS: undefined,
    }),
  ]);
}

/**
 * The root index.html: it is, byte for byte, the build of the source files under frontends/app/src/legacy/src; its ia-version
 * meta reads as a version; its inline script compiles; and it boots in the harness and builds HALF_MANNY, self-stable.
 */
async function buildLane() {
  const html = readFileSync(join(REPO, 'index.html'), 'utf8');
  const version = /<meta name="ia-version" content="([^"]*)"/.exec(html)?.[1];
  if (version === undefined) {
    failures.push('build: index.html has no ia-version meta');
  } else {
    try {
      SV.parse(version);
      note('build', `index.html is ia-version ${version}`);
    } catch (err) {
      failures.push(`build: index.html ia-version "${version}" is not a version (${err.message})`);
    }
  }
  if (!(await step('build', 'index.html is the build of frontends/app/src/legacy/src', process.execPath, ['frontends/app/scripts/build-index.mjs', '--check'], REPO))) return;
  const syntax = `const {extractInlineJS}=require(${JSON.stringify(join(REPO, 'tests', 'harness'))});new (require('vm').Script)(extractInlineJS(require('fs').readFileSync(${JSON.stringify(join(REPO, 'index.html'))},'utf8')))`;
  if (!(await step('build', 'inline script compiles', process.execPath, ['-e', syntax], REPO))) return;
  await step('build', 'boots and builds HALF_MANNY, self-stable', process.execPath, ['tests/harness.js', 'index.html'], REPO);
}

async function appLane() {
  const app = join(REPO, 'frontends', 'app');
  if (!existsSync(join(app, 'node_modules'))) {
    failures.push('app: frontends/app/node_modules is missing; run npm ci in frontends/app/');
    return;
  }
  const bin = (name) => join(app, 'node_modules', '.bin', name);
  if (!(await step('app', 'sync from index.html', process.execPath, ['scripts/sync-legacy.mjs'], app))) return;
  // Independent once the sync is done, so they run together.
  await Promise.all([
    step('app', 'typecheck', bin('tsc'), ['-p', 'tsconfig.node.json'], app),
    step('app', 'unit tests', process.execPath, ['--test', '--test-reporter=spec', 'test/unit/**/*.test.ts'], app),
    step('app', 'integration tests', process.execPath, ['--test', '--test-reporter=spec', 'test/integration/**/*.test.ts'], app),
    step('app', 'lint', bin('ng'), ['lint'], app),
  ]);
}

async function backendLane() {
  const be = join(REPO, 'backend');
  if (!existsSync(join(be, 'node_modules'))) {
    failures.push('backend: backend/node_modules is missing; run npm ci in backend/');
    return;
  }
  const tsc = join(be, 'node_modules', '.bin', 'tsc');
  await Promise.all([
    step('backend', 'typecheck (server)', tsc, ['-p', 'tsconfig.server.json', '--noEmit'], be),
    step('backend', 'typecheck (tests, scripts)', tsc, ['-p', 'tsconfig.test.json'], be),
    step('backend', 'tests', process.execPath, ['--test', '--test-reporter=spec', 'test/'], be),
    step('backend', 'lint', join(be, 'node_modules', '.bin', 'eslint'), ['.'], be),
  ]);
}

const lanes = [];
if (want.tests) lanes.push(testsLane());
if (want.build) lanes.push(buildLane());
if (want.app) lanes.push(appLane());
if (want.backend) lanes.push(backendLane());
const what = [want.tests && 'tests', want.build && 'build', want.app && 'app', want.backend && 'backend'].filter(Boolean).join(', ') || 'nothing (no staged file needs a check)';
console.log(`check: ${what}; hard limit ${LIMIT_S} s`);
await Promise.all(lanes);

const took = Date.now() - t0;
const summary = failures.length
  ? `FAILED in ${duration(took)}: ${failures.length} problem${failures.length === 1 ? '' : 's'}`
  : `passed in ${duration(took)}`;
console.log(`check: ${summary}`);
for (const f of failures) console.log(`  - ${f}`);
if (run && !attached) run.finish({ exitCode: failures.length ? 1 : 0, details: [summary] });
process.exitCode = failures.length ? 1 : 0;
