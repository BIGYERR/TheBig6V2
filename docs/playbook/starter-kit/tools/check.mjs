#!/usr/bin/env node
// The 60-second check: everything fast enough to run while developing, under a hard 60 second limit. Every commit runs
// it (.githooks/pre-commit), and it is the local proof for every change. Everything slower runs in GitHub Actions on
// every push to dev and on the pull request from dev into main (.github/workflows/pipeline.yml).
//
// A lane is one package: its npm scripts run in its folder, together, each skipped when the package has no script of
// that name. Add a lane per package (a frontend, a shared core) to LANES below.
//
//   node tools/check.mjs              every lane
//   node tools/check.mjs --staged     only the lanes the staged files touch (what the pre-commit hook runs)
//   node tools/check.mjs --list       print what would run, and exit
//
// The limit is hard: nothing runs past 60 s from the start (CHECK_SECONDS can lower it, never raise it). A step still
// running at the deadline fails the check: every step here is meant to take seconds, and a slow one belongs in CI.
// A failed step's whole output is kept in temp/check/.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

/** name, the folder its scripts run in, the repo paths that wake it under --staged, the npm scripts it runs. */
const LANES = [
  {
    name: 'backend',
    dir: 'backend',
    // The root package.json, its lock file and the Procfile are Heroku's build, and the pipeline holds the Node line:
    // backend/test/platform.test.ts reads them all.
    touches: /^(backend\/|package(-lock)?\.json$|Procfile$|\.github\/workflows\/)/,
    scripts: ['typecheck', 'test', 'lint'],
  },
];

const LIMIT_S = Math.min(60, Number(process.env.CHECK_SECONDS) || 60);
const args = process.argv.slice(2);
const STAGED = args.includes('--staged');
const t0 = Date.now();
const deadline = t0 + LIMIT_S * 1000;
const left = () => deadline - Date.now();

function stagedPaths() {
  try {
    return execFileSync('git', ['-C', REPO, 'diff', '--cached', '--name-only'], { encoding: 'utf8' }).split('\n').filter(Boolean);
  } catch {
    return null;
  }
}
const paths = STAGED ? stagedPaths() : null;
const wanted = LANES.filter((lane) => paths === null || paths.some((p) => lane.touches.test(p)));
const scriptsOf = (lane) => {
  const file = join(REPO, lane.dir, 'package.json');
  const have = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')).scripts ?? {}) : {};
  return lane.scripts.filter((s) => s in have);
};

if (args.includes('--list')) {
  console.log(`check: limit ${LIMIT_S} s; ${STAGED ? `staged files: ${paths?.length ?? 0}` : 'everything'}`);
  for (const lane of LANES) console.log(`  ${lane.name.padEnd(10)} ${wanted.includes(lane) ? scriptsOf(lane).join(', ') || 'no scripts' : 'not touched'}`);
  process.exit(0);
}

const failures = [];
const duration = (ms) => (ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);
const tail = (out, n = 15) => out.trimEnd().split('\n').slice(-n).join('\n');

/** Runs one command until it ends or the deadline. Its own process group, so the deadline stops what it started too. */
function exec(cmd, cmdArgs, cwd) {
  return new Promise((resolve) => {
    const started = Date.now();
    let out = '';
    let stopped = false;
    const child = spawn(cmd, cmdArgs, { cwd, detached: true, env: { ...process.env, FORCE_COLOR: '0' }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => {
      stopped = true;
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        child.kill('SIGKILL');
      }
    }, Math.max(0, left()));
    child.on('error', (err) => (out += `\n${err.message}`));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, out, ms: Date.now() - started, stopped });
    });
  });
}

/** One step that must finish: fails on a nonzero exit or on reaching the deadline. */
async function step(lane, name, cmd, cmdArgs, cwd) {
  if (left() <= 0) {
    failures.push(`${lane}: ${name} did not start: the ${LIMIT_S} s limit was reached`);
    return false;
  }
  const r = await exec(cmd, cmdArgs, cwd);
  const ok = r.code === 0 && !r.stopped;
  console.log(`  ${lane}: ${ok ? 'ok' : r.stopped ? 'STOPPED at the limit' : 'FAILED'}: ${name} (${duration(r.ms)})`);
  if (!ok) {
    failures.push(`${lane}: ${name} ${r.stopped ? `was still running at the ${LIMIT_S} s limit` : `failed (exit ${r.code})`}`);
    if (r.out.trim()) console.error(`\ncheck: ${lane}: ${name}:\n${tail(r.out)}\n`);
    try {
      const dir = join(REPO, 'temp', 'check');
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${lane}-${name.replace(/\W+/g, '-')}.log`), r.out);
    } catch {
      // The terminal still has the tail.
    }
  }
  return ok;
}

async function runLane(lane) {
  const cwd = join(REPO, lane.dir);
  if (!existsSync(join(cwd, 'node_modules'))) {
    if (!existsSync(join(cwd, 'package-lock.json'))) {
      failures.push(`${lane.name}: no node_modules and no package-lock.json; run npm install in ${lane.dir}/ and commit the lock file`);
      return;
    }
    if (!(await step(lane.name, 'install (npm ci)', 'npm', ['ci', '--no-audit', '--no-fund'], cwd))) return;
  }
  await Promise.all(scriptsOf(lane).map((s) => step(lane.name, s, 'npm', ['run', '--silent', s], cwd)));
}

console.log(`check: ${wanted.map((l) => l.name).join(', ') || 'nothing (no staged file needs a check)'}; hard limit ${LIMIT_S} s`);
await Promise.all(wanted.map(runLane));

const summary = failures.length ? `FAILED in ${duration(Date.now() - t0)}: ${failures.length} problem${failures.length === 1 ? '' : 's'}` : `passed in ${duration(Date.now() - t0)}`;
console.log(`check: ${summary}`);
for (const f of failures) console.log(`  - ${f}`);
process.exitCode = failures.length ? 1 : 0;
