#!/usr/bin/env node
// npm run dev: the whole stack on this Mac, rebuilt as you edit. Start it once and leave it running.
//
//   website  http://localhost:3000/        site/          ng build --watch (development build, about a second)
//   app      http://localhost:3000/app/    ../index.html  copied to app-web/ on every save (instant)
//   admin    http://localhost:3000/admin/  admin/         ng build --watch
//   server                                 server/        the server restarts (about a second)
//   snippet  http://localhost:3000/client/ client/        served as saved
//
// It runs in the docker backend: docker-compose.yml with docker-compose.dev.yml laid over it, so the same container,
// port and devices volume as npm run docker:up, serving these folders live instead of the image's copies.
// --no-docker runs the server with this Mac's Node instead. After each change it runs the fast tests that change can
// break, each set stopped at 3 s, then every open page reloads itself (server/dev.js). It replaces none of the real
// checks: the pre-commit check, CI, and the build paths for devices in app/ (emulator-ios, device-ios, pwa-pages).
//
// Ctrl-C stops the watchers. The container keeps serving the last build; npm run docker:up puts back the plain image.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, watch } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const BACKEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(BACKEND, '..');
const PORT = Number(process.env.API_PORT || 3000);
const BASE = `http://localhost:${PORT}`;
const DOCKER = !process.argv.includes('--no-docker');
const COMPOSE = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml'];
const TEST_LIMIT_MS = 3_000;
const NG = join(BACKEND, 'node_modules', '.bin', 'ng');
// The backend tests that finish in well under a second: no child processes, no git. npm test runs every file.
const FAST_TESTS = ['server', 'auth', 'versions', 'site', 'client', 'dev', 'request-log', 'semver-parity']
  .map((name) => `test/${name}.test.js`)
  .filter((file) => existsSync(join(BACKEND, file)));

// ── Output: one line per event, `time  lane  what` ──────────────────────────────────────────────────────────────
const TONES = { ok: 32, bad: 31, warn: 33, dim: 2, info: 36 };
const paint = (tone, s) => (process.stdout.isTTY && tone ? `\x1b[${TONES[tone]}m${s}\x1b[0m` : s);
function log(lane, msg, tone) {
  console.log(`${paint('dim', new Date().toTimeString().slice(0, 8))}  ${lane.padEnd(8)}${paint(tone, msg)}`);
}

/** Runs a command to the end: { code, out }. */
function exec(cmd, args, opts = {}) {
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd: BACKEND, ...opts });
    let out = '';
    child.stdout?.on('data', (d) => (out += d));
    child.stderr?.on('data', (d) => (out += d));
    child.on('error', (err) => done({ code: 127, out: String(err) }));
    child.on('close', (code, signal) => done({ code: code ?? 128, signal, out }));
  });
}

// One change at a time: a burst of saves turns into one rebuild, never two restarts racing.
let queue = Promise.resolve();
const enqueue = (job) => (queue = queue.then(job).catch((err) => log('dev', String(err?.stack ?? err), 'bad')));

// ── Fast tests: each set stopped at 3 s ─────────────────────────────────────────────────────────────────────────
async function tests(label, args, cwd) {
  const started = Date.now();
  const child = spawn(process.execPath, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  const stop = setTimeout(() => child.kill('SIGKILL'), TEST_LIMIT_MS);
  const { code, signal, out } = await new Promise((done) => {
    let text = '';
    child.stdout.on('data', (d) => (text += d));
    child.stderr.on('data', (d) => (text += d));
    child.on('close', (c, s) => done({ code: c, signal: s, out: text }));
  });
  clearTimeout(stop);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const count = (what) => out.match(new RegExp(`ℹ ${what} (\\d+)`))?.[1] ?? '0';
  if (signal) {
    log('tests', `${label}: past the ${TEST_LIMIT_MS / 1000} s limit, stopped (npm test runs them all)`, 'warn');
    return false;
  }
  if (code === 0) {
    log('tests', `${label}: ${count('pass')} passed in ${secs} s`, 'ok');
    return true;
  }
  log('tests', `${label}: ${count('fail')} failed, ${count('pass')} passed`, 'bad');
  const failing = [...new Set(out.split('\n').filter((l) => /^\s*✖ /.test(l)).map((l) => l.trim()))].slice(0, 6);
  for (const line of failing) log('', line, 'bad');
  return false;
}
const backendTests = () => tests('backend', ['--test', ...FAST_TESTS], BACKEND);
const appUnitTests = () =>
  existsSync(join(REPO, 'app', 'node_modules'))
    ? tests('app unit', ['--test', 'test/unit/**/*.test.ts'], join(REPO, 'app'))
    : Promise.resolve(true);

// The app is one HTML file whose inline script is the whole app: a syntax error there is a blank screen. Parsing it
// takes about 40 ms.
function checkAppScript() {
  const html = readFileSync(join(REPO, 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?!text\/javascript)[^"]*")[^>]*>([\s\S]*?)<\/script>/g)];
  try {
    scripts.forEach((m, i) => new vm.Script(m[1], { filename: `index.html, inline script ${i + 1}` }));
    log('tests', `app: ${scripts.length} inline script${scripts.length === 1 ? '' : 's'} parse`, 'ok');
    return true;
  } catch (err) {
    log('tests', `app: the inline script does not parse: ${err.message}`, 'bad');
    return false;
  }
}

async function bundleApp() {
  const { code, out } = await exec(process.execPath, ['scripts/app-bundle.mjs']);
  log('app', code === 0 ? out.trim().replace(/^app-bundle: /, '').replace(` into ${join(BACKEND, 'app-web')}`, '') : out.trim(), code === 0 ? 'ok' : 'bad');
}

// ── The server: the docker container, or this Mac's Node with --no-docker ───────────────────────────────────────
let hostServer = null;

async function healthy(timeoutMs = 20_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const r = await fetch(`${BASE}/healthz`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return r.json();
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`no answer from ${BASE}/healthz after ${timeoutMs / 1000} s`);
}

async function startServer() {
  if (DOCKER) {
    const { code, out } = await exec('docker', [...COMPOSE, 'up', '-d', '--wait']);
    if (code !== 0) throw new Error(`docker compose up failed:\n${out}`);
    return;
  }
  hostServer = spawn(process.execPath, ['server/server.js'], {
    cwd: BACKEND,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
      IA_DEV: '1',
      IA_BACKEND_KIND: 'local',
      IA_BACKEND_NAME: 'npm run dev on this Mac',
      ADMIN_USER: process.env.ADMIN_USER || 'admin',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'asylum',
      CLIENT_DEMO: '1',
      LOG_REQUESTS: '0',
      DATA_FILE: join(BACKEND, 'data', 'dev', 'devices.json'),
    },
  });
  createInterface({ input: hostServer.stderr }).on('line', (line) => log('server', line, 'bad'));
}

async function restartServer() {
  const started = Date.now();
  if (DOCKER) {
    const { code, out } = await exec('docker', [...COMPOSE, 'restart', 'api']);
    if (code !== 0) throw new Error(`docker compose restart failed:\n${out}`);
  } else {
    const old = hostServer;
    await new Promise((done) => {
      old.once('close', done);
      old.kill('SIGTERM');
    });
    await startServer();
  }
  await healthy();
  log('server', `restarted in ${((Date.now() - started) / 1000).toFixed(1)} s`, 'ok');
}

async function reloadPages() {
  try {
    await fetch(`${BASE}/__dev/reload`, { method: 'POST', signal: AbortSignal.timeout(2000) });
  } catch {
    // the server is restarting; pages reload themselves when it is back
  }
}

// ── Watching ─────────────────────────────────────────────────────────────────────────────────────────────────────
function watchFolder(dir, { recursive = true, only = () => true } = {}, onChange) {
  let timer;
  const changed = new Set();
  watch(dir, { recursive }, (event, file) => {
    if (!file || !only(String(file))) return;
    changed.add(String(file));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const files = [...changed];
      changed.clear();
      enqueue(() => onChange(files));
    }, 150);
  });
}

// ng build --watch, one per Angular app. The two often rebuild together (the admin uses the site's icons), so builds
// that finish within a quarter second share one test run and one reload.
const builds = [];
let afterBuild;
function builtOne() {
  clearTimeout(afterBuild);
  afterBuild = setTimeout(
    () =>
      enqueue(async () => {
        await backendTests();
        await reloadPages();
      }),
    250,
  );
}
function ngWatch(project) {
  const child = spawn(NG, ['build', project, '--watch', '--configuration', 'development'], {
    cwd: BACKEND,
    env: { ...process.env, NG_CLI_ANALYTICS: 'false', NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  builds.push(child);
  let errors = [];
  let first = true;
  const onLine = (line) => {
    const done = /Application bundle generation (complete|failed)\. \[([\d.]+) seconds\]/.exec(line);
    if (done) {
      if (done[1] === 'failed' || errors.length) {
        log(project, `build failed in ${done[2]} s:`, 'bad');
        for (const e of errors.slice(0, 12)) log('', e, 'bad');
      } else {
        log(project, `built in ${done[2]} s`, 'ok');
        if (!first) builtOne();
      }
      errors = [];
      first = false;
    } else if (/\[ERROR\]|✘|Error:/.test(line) || (errors.length && line.trim())) {
      errors.push(line.trimEnd());
    }
  };
  createInterface({ input: child.stdout }).on('line', onLine);
  createInterface({ input: child.stderr }).on('line', onLine);
  child.on('close', (code) => code && log(project, `ng build --watch exited (${code})`, 'bad'));
}

// ── Start ────────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  log('dev', `full stack dev mode, ${DOCKER ? 'docker backend' : 'this Mac\'s Node (--no-docker)'}`, 'info');
  if (!existsSync(join(BACKEND, 'node_modules'))) {
    log('setup', 'installing dependencies (npm ci)');
    if ((await exec('npm', ['ci', '--no-audit', '--no-fund'], { stdio: 'inherit' })).code) process.exit(1);
  }
  if (DOCKER && (await exec('docker', ['info'])).code !== 0) {
    log('docker', 'docker is not running. Start Docker Desktop, or run: npm run dev -- --no-docker', 'bad');
    process.exit(1);
  }
  mkdirSync(join(BACKEND, 'dist'), { recursive: true });
  await bundleApp();
  checkAppScript();
  ngWatch('site');
  ngWatch('admin');
  await startServer();
  const health = await healthy(60_000);
  const login = process.env.ADMIN_USER || process.env.ADMIN_PASSWORD ? 'your ADMIN_USER / ADMIN_PASSWORD' : 'admin / asylum';
  console.log(`
  ${paint('info', `Iron Asylum, served by the ${health.backend} backend "${health.name}"`)}
    website  ${BASE}/
    app      ${BASE}/app/      (app ${health.app || 'not bundled'})
    admin    ${BASE}/admin/    (${login})
    snippet  ${BASE}/client/
  Edit site/, admin/, server/, client/ or the repo root index.html; open pages reload by themselves. Ctrl-C stops.
`);
  void backendTests();

  watchFolder(join(BACKEND, 'server'), {}, async (files) => {
    log('server', `changed: ${files.join(', ')}`);
    await backendTests();
    await restartServer();
  });
  watchFolder(join(BACKEND, 'client'), {}, async (files) => {
    log('client', `changed: ${files.join(', ')}`);
    await backendTests();
    await reloadPages();
  });
  // macOS can report a deeper index.html (the site's own build) on this folder's watch, so act only when the root files
  // themselves changed.
  const appStamp = () => ['index.html', 'apple-touch-icon.png'].map((f) => statSync(join(REPO, f), { throwIfNoEntry: false })?.mtimeMs ?? 0).join();
  let appSeen = appStamp();
  watchFolder(REPO, { recursive: false, only: (f) => f === 'index.html' || f === 'apple-touch-icon.png' }, async () => {
    const now = appStamp();
    if (now === appSeen) return;
    appSeen = now;
    await bundleApp();
    checkAppScript();
    await appUnitTests();
    await reloadPages();
  });
}

function stop() {
  for (const child of builds) child.kill('SIGTERM');
  hostServer?.kill('SIGTERM');
  console.log(
    DOCKER
      ? '\n  Stopped watching. The container keeps serving the last build; npm run docker:up puts back the plain image.'
      : '\n  Stopped.',
  );
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

main().catch((err) => {
  log('dev', err.message, 'bad');
  stop();
});
