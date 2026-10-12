#!/usr/bin/env node
// The 60-second check: everything fast enough to run while developing, under a hard 60 second limit. It is the check
// every commit runs (.githooks/pre-commit) and the local proof for every change. Everything slower (the full gate suite
// with its row check, fuzz, sabotage, e2e) runs in GitHub Actions on the pull request from dev into main
// (.github/workflows/pipeline.yml), which must pass before anything deploys.
//
// The feature tests (tests/unit, tests/integration, against tests/snapshots; CLAUDE.md Test layout) run here whole,
// every time they or what they read change: index.html, tests/support, tests/harness.js or tests/semver.js. The legacy
// gate suite (tests/gates, frozen) does not run for a change that touches only the feature tests' folders.
//
//   node tools/check.mjs              all of it: the feature tests, the gate suite's fast part, the app, the backend
//   node tools/check.mjs --staged     only what the staged files touch (what the pre-commit hook runs)
//   node tools/check.mjs --list       print what would run, and exit
//   node tools/check.mjs --measure    time every gate that might be fast (6 at a time, no limit) and rewrite the
//                                     committed table tools/check-gate-times.txt; rerun after gates change a lot
//
// The limit is hard: nothing runs past 60 s from the start (IA_CHECK_SECONDS can lower it, never raise it). A gate still
// running at the deadline is stopped and reported as left to CI, which is not a failure: CI runs every gate. Any other
// step still running at the deadline fails the check, since app and backend tests are meant to take seconds.
//
// Which gates run here: those whose measured time is at most FAST_GATE_SECONDS, plus any gate with no measured time at
// all (a new gate). A known gate's time comes from the committed table (tools/check-gate-times.txt), which changes only
// when someone reruns --measure, so one busy moment never moves a gate. A gate the table does not know is timed on its
// first check here (temp/check-gate-times.txt): if it is slow, or stopped at the deadline, later checks leave it to CI.
// Gates the table does not list but tests/gate_times.txt times as slow are CI-only from the start.
//
// The check is a logged run (tools/runlog.mjs), type "check": every step and every gate result is an event.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { availableParallelism, setPriority } from 'node:os';
import { basename, join } from 'node:path';
import { REPO, ROOT, attachRun, duration, startRun } from './runlog.mjs';

/** ia-version is read and compared only through tests/semver.js (CommonJS): MAJOR.MINOR.PATCH, a bare N reads as 0.N.0. */
const SV = createRequire(import.meta.url)('../tests/semver.js');

const LIMIT_S = Math.min(60, Number(process.env.IA_CHECK_SECONDS) || 60);
const FAST_GATE_SECONDS = 12;
/** Gates stop this long before the hard limit, so the check can still report and exit inside it. */
const GATE_MARGIN_MS = 3000;
/** The gates' CPU priority (nice) while the app and backend lanes run beside them. */
const GATE_NICE = 10;
const args = process.argv.slice(2);
const STAGED = args.includes('--staged');
const LIST = args.includes('--list');
const MEASURE = args.includes('--measure');
const t0 = Date.now();
const deadline = t0 + (process.argv.includes('--measure') ? 3_600_000 : LIMIT_S * 1000);
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
const touches = (re, unless) => paths === null || paths.some((p) => re.test(p) && !(unless && unless.test(p)));
/** The feature tests' own folders: a change there runs the feature tests, never the frozen gate suite. */
const FEATURE_TESTS = /^tests\/(unit|integration|snapshots|support)\//;
/** What `node --test` runs: every *.test.js under these folders. */
const FEATURE_TEST_DIRS = ['tests/unit', 'tests/integration'];
const want = {
  tests: touches(/^(index\.html|tests\/(unit|integration|snapshots|support)\/|tests\/harness\.js$|tests\/semver\.js$)/),
  gates: touches(/^(index\.html|tests\/)/, FEATURE_TESTS),
  app: touches(/^(app\/|tools\/|index\.html)/),
  backend: touches(/^backend\//),
};

// ── Gate selection ─────────────────────────────────────────────────────────────────────────────────────────────
const LOCAL_TIMES = join(ROOT, 'check-gate-times.txt');
function readTimes(file) {
  const out = new Map();
  try {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = /^([\w.-]+\.js)\s+([\d.]+)/.exec(line.trim());
      if (m) out.set(m[1], Number(m[2]));
    }
  } catch {
    // No such table: the next one decides.
  }
  return out;
}
const SEED = join(REPO, 'tools', 'check-gate-times.txt');
const seed = readTimes(SEED);
const tables = [seed, readTimes(LOCAL_TIMES), readTimes(join(REPO, 'tests', 'gate_times.txt'))];
const timeOf = (g) => tables.find((t) => t.has(g))?.get(g);
const allGates = existsSync(join(REPO, 'tests', 'gates'))
  ? execFileSync('ls', [join(REPO, 'tests', 'gates')], { encoding: 'utf8' }).split('\n').filter((f) => f.endsWith('.js'))
  : [];
// --measure: every gate the slow-gate list does not already rule out (gate_times.txt over 15 s), timed without a limit.
const fastGates = MEASURE
  ? allGates.filter((g) => (readTimes(join(REPO, 'tests', 'gate_times.txt')).get(g) ?? 0) <= 15)
  : allGates.filter((g) => (timeOf(g) ?? 0) <= FAST_GATE_SECONDS);
// Longest first, so the slow ones are not the ones left running at the deadline; new gates (no time) first of all.
fastGates.sort((a, b) => (timeOf(b) ?? 1e9) - (timeOf(a) ?? 1e9));
const ciOnly = allGates.filter((g) => !fastGates.includes(g));

if (LIST) {
  console.log(`check: limit ${LIMIT_S} s; ${STAGED ? `staged files: ${paths?.length ?? 0}` : 'everything'}`);
  console.log(`  tests   ${want.tests ? `node --test ${FEATURE_TEST_DIRS.join(' ')}` : 'not touched'}`);
  console.log(`  gates   ${want.gates ? `${fastGates.length} fast gates here, ${ciOnly.length} in CI only (${ciOnly.join(' ')})` : 'not touched'}`);
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
const toCI = [];

/**
 * Runs one command until it ends or `stopAt` (epoch ms). Resolves { code, out, ms, stopped }. `nice` lowers its CPU
 * priority (and its children's).
 * @param {string} cmd @param {string[]} cmdArgs @param {string} cwd @param {number} stopAt
 */
function exec(cmd, cmdArgs, cwd, stopAt, env = {}, nice = 0) {
  return new Promise((resolve) => {
    const started = Date.now();
    let out = '';
    let stopped = false;
    const child = spawn(cmd, cmdArgs, { cwd, env: { ...process.env, ...env, FORCE_COLOR: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    if (nice && child.pid) {
      try {
        setPriority(child.pid, nice);
      } catch {
        // Runs at normal priority.
      }
    }
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
 * The feature tests, whole: Node's own runner over tests/unit and tests/integration. They prove index.html against the
 * committed snapshots, so IA_APP (another body) and UPDATE_SNAPSHOTS (rewrite the goldens) are cleared for this step.
 */
async function testsLane() {
  await step('tests', 'unit and integration tests', process.execPath, ['--test', '--test-reporter=spec', ...FEATURE_TEST_DIRS], REPO, {
    IA_APP: undefined,
    UPDATE_SNAPSHOTS: undefined,
  });
}

/** The gate suite's quick steps (gate.sh steps 0 to 3), then the fast gates, JOBS at a time. */
async function gatesLane() {
  const html = readFileSync(join(REPO, 'index.html'), 'utf8');
  const version = /<meta name="ia-version" content="([^"]*)"/.exec(html)?.[1];
  if (version === undefined) {
    failures.push('gates: index.html has no ia-version meta');
    return;
  }
  try {
    SV.parse(version);
  } catch (err) {
    failures.push(`gates: index.html ia-version "${version}" is not a version (${err.message})`);
    return;
  }
  note('gates', `index.html is ia-version ${version}`);
  // The baseline gates compare against: the previous version, as tagged, which is the greatest tag strictly below this
  // one (tests/semver.js below), never N - 1. base_v<previous>.html names it as tagged, less its v: base_v238.html.
  const scratch = join(ROOT, 'check');
  mkdirSync(scratch, { recursive: true });
  let base = '';
  let prev;
  try {
    prev = SV.below(execFileSync('git', ['-C', REPO, 'tag', '--list', 'v*', 'V*'], { encoding: 'utf8' }).split(/\r?\n/), version);
    if (prev === undefined) throw new Error(`no version tag below ia-version ${version}`);
    base = join(scratch, `base_v${prev.replace(/^[Vv]/, '')}.html`);
    writeFileSync(base, execFileSync('git', ['-C', REPO, 'show', `${prev}:index.html`], { maxBuffer: 64 * 1024 * 1024 }));
  } catch {
    base = '';
    note('gates', prev === undefined ? `no version tag below ia-version ${version} here; gates run without a baseline` : `${prev}:index.html does not read here; gates run without a baseline`);
  }
  const syntax = `const {extractInlineJS}=require(${JSON.stringify(join(REPO, 'tests', 'harness'))});new (require('vm').Script)(extractInlineJS(require('fs').readFileSync(${JSON.stringify(join(REPO, 'index.html'))},'utf8')))`;
  if (!(await step('gates', 'inline script compiles', process.execPath, ['-e', syntax], REPO))) return;
  await step('gates', 'version scope lint', process.execPath, ['tests/version_scope.js'], REPO);
  await step('gates', 'boot', process.execPath, ['tests/harness.js', 'index.html'], REPO);
  // Sabotage is OFF (Mario, Post-v0.239.1: "temporarily disable all sabotage runs"); set true to turn it back on.
  const SABOTAGE_ON = false;
  if (SABOTAGE_ON) await step('gates', 'sabotage anchors', 'python3', ['tests/sabotage.py', '--anchors-only', 'index.html'], REPO);

  const jobs = Math.max(2, availableParallelism() - 2);
  const queue = [...fastGates];
  const measured = new Map();
  const stopAt = deadline - GATE_MARGIN_MS;
  let passed = 0;
  async function worker() {
    for (let g = queue.shift(); g; g = queue.shift()) {
      if (stopAt - Date.now() <= 0) {
        toCI.push(g);
        continue;
      }
      // Gates run at lower priority: they take the idle cores, and the app and backend steps, which fail the check if
      // the deadline catches them, win when the CPU is short. A gate the deadline catches is only left to CI.
      const r = await exec(process.execPath, [join('tests', 'gates', g), 'index.html', ...(base ? [base] : [])], REPO, stopAt, { IA_NO_RUNLOG: '1' }, MEASURE ? 0 : GATE_NICE);
      if (r.stopped) {
        toCI.push(g);
        measured.set(g, Math.max(r.ms / 1000, FAST_GATE_SECONDS + 1));
        continue;
      }
      measured.set(g, r.ms / 1000);
      // Graded as gate.sh grades: one PASS/FAIL summary with FAIL 0, and no REFUSED assertion.
      const summaries = [...r.out.matchAll(/^PASS (\d+) FAIL (\d+)/gm)];
      const refused = /^REFUSED/m.test(r.out);
      if (summaries.length !== 1 || summaries[0][2] !== '0' || refused) {
        const why = !summaries.length ? 'printed no PASS/FAIL summary (crash?)' : refused ? 'REFUSED an assertion' : summaries.map((m) => m[0]).join(' / ');
        failures.push(`gates: ${g} ${why}`);
        note('gate', `RED ${g}: ${why}`, true);
        console.error(`\ncheck: ${g}: ${why}\n${r.out.split('\n').filter((l) => /^\s*(FAIL|REFUSE)/.test(l)).slice(0, 20).join('\n') || tail(r.out)}\n`);
      } else {
        passed++;
        note('gate', `${summaries[0][0]}  ${g} (${duration(r.ms)})`);
      }
    }
  }
  await Promise.all(Array.from({ length: jobs }, worker));
  try {
    if (MEASURE) {
      // The committed table, rewritten from this measurement.
      const head = readFileSync(SEED, 'utf8').split('\n').filter((l) => l.startsWith('#'));
      const rows = [...measured].sort((a, b) => a[1] - b[1]).map(([g, s]) => `${g} ${s.toFixed(1)}`);
      writeFileSync(SEED, [...head, ...rows].join('\n') + '\n');
      note('gates', `measured ${measured.size} gates; rewrote tools/check-gate-times.txt`, true);
    } else {
      // A gate the committed table does not know is timed here once; if it is slow, later checks leave it to CI.
      const local = readTimes(LOCAL_TIMES);
      for (const [g, s] of measured) if (!seed.has(g)) local.set(g, s);
      writeFileSync(LOCAL_TIMES, [...local].map(([g, s]) => `${g} ${s.toFixed(1)}`).join('\n') + '\n');
    }
  } catch {
    // Timing is a convenience.
  }
  note('gates', `${passed} of ${fastGates.length} fast gates passed here; ${ciOnly.length + toCI.length} left to CI${toCI.length ? ` (${toCI.length} stopped at the limit: ${toCI.join(' ')})` : ''}`);
}

async function appLane() {
  const app = join(REPO, 'app');
  if (!existsSync(join(app, 'node_modules'))) {
    failures.push('app: app/node_modules is missing; run npm ci in app/');
    return;
  }
  const bin = (name) => join(app, 'node_modules', '.bin', name);
  if (!(await step('app', 'sync from index.html', process.execPath, ['scripts/sync-legacy.mjs'], app))) return;
  // Independent once the sync is done, so they run together: an app step at the deadline fails the check, a gate
  // there is only left to CI, and in series the app lane is what nears the limit when the machine is busy.
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
if (want.gates) lanes.push(gatesLane());
if (want.app) lanes.push(appLane());
if (want.backend) lanes.push(backendLane());
const what = [want.tests && 'tests', want.gates && 'gates', want.app && 'app', want.backend && 'backend'].filter(Boolean).join(', ') || 'nothing (no staged file needs a check)';
console.log(`check: ${what}; hard limit ${LIMIT_S} s`);
await Promise.all(lanes);

const took = Date.now() - t0;
const leftToCI = want.gates ? ciOnly.length + toCI.length : 0;
const summary = failures.length
  ? `FAILED in ${duration(took)}: ${failures.length} problem${failures.length === 1 ? '' : 's'}`
  : `passed in ${duration(took)}${leftToCI ? `; ${leftToCI} slow gates are left to CI` : ''}`;
console.log(`check: ${summary}`);
for (const f of failures) console.log(`  - ${f}`);
if (run && !attached) run.finish({ exitCode: failures.length ? 1 : 0, details: [summary] });
process.exitCode = failures.length ? 1 : 0;
