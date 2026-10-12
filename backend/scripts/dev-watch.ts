#!/usr/bin/env node
// The dev watcher: serves the whole stack and rebuilds whatever is saved. npm run dev runs it inside the dev container
// (Dockerfile.dev, docker-compose.dev.yml), so it keeps rebuilding with nothing running on the Mac and comes back
// whenever Docker does; npm run dev -- --no-docker runs it on the Mac's own Node instead (scripts/dev.ts, either way).
//
//   website  /         site/          ng build --watch, a development build (a second or two)
//   app      /app/     frontends/app/src/legacy/src/   the app's source files, built into app-web/index.html on every save by
//                                     frontends/app/scripts/build-index.mjs (the function that builds the root index.html), its
//                                     inline script parsed; the repo root is never written
//                      index.html     the repo root's, copied to app-web/ on every save, its inline script parsed
//   admin    /admin/   admin/         ng build --watch
//   server             server/        the server restarts (under a second), then the type check beside the tests
//   snippet  /client/  client/        served as saved
//
// After each change it runs the fast tests that change can break, each set stopped at 3 s, then every open page
// reloads itself (server/dev.ts). The server runs from its TypeScript source as Node strips the types, so the type
// check is where a type error shows; like a failing test, it never holds back the restart, which comes first. It
// replaces none of the real checks: the pre-commit check, CI, and the build paths for devices in frontends/app/.
//
// Saves arrive as file events: through Docker Desktop's mounts they reach the container in tens of milliseconds.
// IA_DEV_POLL_MS=<ms> polls instead (ng build --poll, and a sweep of the watched folders' file times), for a machine
// where the events stop arriving. Either way a save is a file whose time or size moved. The checkout sits on an iCloud
// Desktop, and iCloud rewrites a saved file's attributes 10 to 40 seconds later; that event changes neither, so it
// restarts nothing, and an Angular rebuild whose output came out the same reloads nothing.
//
// It reads PORT (the server's), APP_SOURCE_DIR (the repo root, where index.html and frontends/app/ are; the folder above
// backend/ by default), APP_BUNDLE_DIR (where the app is served from; app-web/ by default) and IA_DEV_CONTAINER=1 (set
// by Dockerfile.dev). In the container the app's unit tests do not run: they need frontends/app/'s own node_modules, and the only
// ones in reach are the Mac's, which a Linux container never loads.
import { spawn } from 'node:child_process';
import type { ChildProcess, SpawnOptions } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, watch, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import vm from 'node:vm';

const BACKEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(process.env.APP_SOURCE_DIR || join(BACKEND, '..'));
const APP_WEB = resolve(process.env.APP_BUNDLE_DIR || join(BACKEND, 'app-web'));
// The app's source files, and the script that builds the root index.html from them. In the container both sit in the
// read-only mount of the repo root.
const APP_SOURCES = join(REPO, 'frontends', 'app', 'src', 'legacy', 'src');
const BUILD_INDEX = join(REPO, 'frontends', 'app', 'scripts', 'build-index.mjs');
const PORT = Number(process.env.PORT || 3000);
const SELF = `http://127.0.0.1:${PORT}`;
const POLL_MS = Number(process.env.IA_DEV_POLL_MS) || 0;
const IN_CONTAINER = process.env.IA_DEV_CONTAINER === '1';
const TEST_LIMIT_MS = 3_000;
const NG = join(BACKEND, 'node_modules', '.bin', 'ng');
const TSC = join(BACKEND, 'node_modules', '.bin', 'tsc');
// The backend tests that finish in well under a second: no child processes, no git. npm test runs every file.
const FAST_TESTS = ['server', 'auth', 'versions', 'site', 'client', 'dev', 'request-log', 'semver-parity']
  .map((name) => `test/${name}.test.ts`)
  .filter((file) => existsSync(join(BACKEND, file)));

// ── Output: one line per event, `time  lane  what` ──────────────────────────────────────────────────────────────
const TONES = { ok: 32, bad: 31, warn: 33, dim: 2, info: 36 };
type Tone = keyof typeof TONES;
const paint = (tone: Tone | undefined, s: string) => (process.stdout.isTTY && tone ? `\x1b[${TONES[tone]}m${s}\x1b[0m` : s);
function log(lane: string, msg: string, tone?: Tone) {
  console.log(`${paint('dim', new Date().toTimeString().slice(0, 8))}  ${lane.padEnd(8)}${paint(tone, msg)}`);
}

/** How a command ended, and everything it printed. */
interface Ran {
  code: number | null;
  signal?: NodeJS.Signals | null;
  out: string;
}

/** Runs a command to the end: { code, out }. */
function exec(cmd: string, args: string[], opts: SpawnOptions = {}): Promise<Ran> {
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
let queue: Promise<unknown> = Promise.resolve();
const enqueue = (job: () => Promise<unknown>) => (queue = queue.then(job).catch((err) => log('dev', String(err?.stack ?? err), 'bad')));

// ── Fast tests: each set stopped at 3 s ─────────────────────────────────────────────────────────────────────────
async function tests(label: string, args: string[], cwd: string) {
  const started = Date.now();
  const child = spawn(process.execPath, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  const stop = setTimeout(() => child.kill('SIGKILL'), TEST_LIMIT_MS);
  const { code, signal, out } = await new Promise<Ran>((done) => {
    let text = '';
    child.stdout.on('data', (d) => (text += d));
    child.stderr.on('data', (d) => (text += d));
    child.on('close', (c, s) => done({ code: c, signal: s, out: text }));
  });
  clearTimeout(stop);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  const count = (what: string) => out.match(new RegExp(`ℹ ${what} (\\d+)`))?.[1] ?? '0';
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

// The server's types. Node runs server/ as it stands and ignores the types, so this is where a type error shows in dev
// mode. About a second, beside the tests; like a failing test, it never holds back the restart.
async function typecheck() {
  const started = Date.now();
  const { code, out } = await exec(TSC, ['-p', 'tsconfig.server.json', '--noEmit']);
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  if (code === 0) {
    log('types', `server: no type errors (${secs} s)`, 'ok');
    return true;
  }
  const errors = out.split('\n').filter((l) => /error TS\d+/.test(l));
  log('types', `server: ${errors.length || 'some'} type error${errors.length === 1 ? '' : 's'} (npm run typecheck)`, 'bad');
  for (const line of errors.slice(0, 6)) log('', line.trim(), 'bad');
  return false;
}
const appUnitTests = () =>
  !IN_CONTAINER && existsSync(join(REPO, 'frontends', 'app', 'node_modules'))
    ? tests('app unit', ['--test', 'test/unit/**/*.test.ts'], join(REPO, 'frontends', 'app'))
    : Promise.resolve(true);

// The app is one HTML file whose inline script is the whole app: a syntax error there is a blank screen. Parsing it
// takes about 40 ms. It parses the page /app/ serves, whichever way it got there.
function checkAppScript() {
  const page = join(APP_WEB, 'index.html');
  if (!existsSync(page)) return false;
  const html = readFileSync(page, 'utf8');
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="(?!text\/javascript)[^"]*")[^>]*>([\s\S]*?)<\/script>/g)];
  try {
    scripts.forEach((m, i) => new vm.Script(m[1], { filename: `index.html, inline script ${i + 1}` }));
    log('tests', `app: ${scripts.length} inline script${scripts.length === 1 ? '' : 's'} parse`, 'ok');
    return true;
  } catch (err) {
    log('tests', `app: the inline script does not parse: ${(err as Error).message}`, 'bad');
    return false;
  }
}

async function bundleApp() {
  const { code, out } = await exec(process.execPath, ['scripts/app-bundle.ts']);
  log('app', code === 0 ? out.trim().replace(/^app-bundle: /, '').replace(` into ${join(BACKEND, 'app-web')}`, '') : out.trim(), code === 0 ? 'ok' : 'bad');
}

/** build-index.mjs's build function, loaded again whenever the script itself was saved since the last load. */
async function loadBuild(): Promise<(srcDir: string) => Buffer> {
  const { buildIndex } = (await import(`${pathToFileURL(BUILD_INDEX).href}?t=${statSync(BUILD_INDEX).mtimeMs}`)) as { buildIndex: (srcDir: string) => Buffer };
  return buildIndex;
}

/**
 * Builds the page /app/ serves from the app's source files, with the function that builds the root index.html, and
 * writes it to `out` (app-web/) only: the repo root is never written. Written beside itself and renamed over the old
 * page, so the server never reads half of one. Says when the root index.html is not this build yet. False when the
 * sources do not build.
 */
export async function buildAppFromSources(sources = APP_SOURCES, out = APP_WEB) {
  const started = Date.now();
  let page: Buffer;
  try {
    page = (await loadBuild())(sources);
  } catch (err) {
    log('app', `the source files do not build: ${(err as Error).message}`, 'bad');
    return false;
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.html.tmp'), page);
  renameSync(join(out, 'index.html.tmp'), join(out, 'index.html'));
  const version = /<meta name="ia-version" content="([^"]*)"/.exec(page.toString('utf8'))?.[1] ?? '(no ia-version)';
  const root = join(REPO, 'index.html');
  const current = existsSync(root) && readFileSync(root).equals(page);
  const took = `${Date.now() - started} ms`;
  if (current) log('app', `built app ${version} from the source files (${took}); the root index.html is the same build`, 'ok');
  else log('app', `built app ${version} from the source files (${took}); the root index.html is not this build yet: cd frontends/app && npm run build:index`, 'warn');
  return true;
}

// ── The server: a child process, restarted on a change under server/ ───────────────────────────────────────────
let server: ChildProcess | null = null;
let stopping = false;

/** Request lines this log leaves out: docker's health probe and the live reload's own traffic. */
export function quiet(line: string) {
  return /^request \S+ \/(?:healthz|__dev\/)/.test(line);
}

function startServer() {
  const child = spawn(process.execPath, ['server/server.ts'], {
    cwd: BACKEND,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production', PORT: String(PORT), IA_DEV: '1' },
  });
  server = child;
  createInterface({ input: child.stdout! }).on('line', (line) => quiet(line) || log('server', line));
  createInterface({ input: child.stderr! }).on('line', (line) => log('server', line, 'bad'));
  child.on('exit', (code, signal) => {
    if (server !== child || stopping) return; // stopped on purpose
    server = null;
    log('server', `stopped (${signal ?? `exit ${code}`}); the next save under server/ starts it again`, 'bad');
  });
}

/** Stops the server and waits for it: on SIGTERM it saves the devices file first (server/server.ts). */
function stopServer(): Promise<void> {
  const child = server;
  server = null;
  if (!child || child.exitCode !== null || child.signalCode !== null) return Promise.resolve();
  return new Promise((done) => {
    child.once('exit', () => done());
    child.kill('SIGTERM');
  });
}

/** Waits for /healthz to answer; false when the server stopped first or the time ran out. */
async function healthy(timeoutMs = 20_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until && server) {
    try {
      const r = await fetch(`${SELF}/healthz`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function restartServer() {
  const started = Date.now();
  await stopServer();
  startServer();
  if (await healthy()) log('server', `restarted in ${((Date.now() - started) / 1000).toFixed(1)} s`, 'ok');
  else log('server', 'did not come back; the lines above say why', 'bad');
}

async function reloadPages() {
  try {
    const r = await fetch(`${SELF}/__dev/reload`, { method: 'POST', signal: AbortSignal.timeout(2000) });
    const { pages } = (await r.json()) as { pages: number };
    log('reload', pages ? `${pages} open page${pages === 1 ? '' : 's'} reloaded` : 'no page open', 'dim');
  } catch {
    // the server is restarting; pages reload themselves when it is back
  }
}

// ── Watching: file events, or a poll with IA_DEV_POLL_MS ─────────────────────────────────────────────────────────
export interface WatchOptions {
  recursive?: boolean;
  only?: (file: string) => boolean;
  pollMs?: number;
}

/** Every file under dir that `only` keeps, with its time and size: what the poll compares. */
export function snapshot(dir: string, { recursive = true, only = () => true }: WatchOptions = {}) {
  const files = new Map<string, string>();
  const walk = (sub: string) => {
    let entries;
    try {
      entries = readdirSync(join(dir, sub), { withFileTypes: true });
    } catch {
      return; // gone mid-sweep
    }
    for (const entry of entries) {
      const rel = sub ? `${sub}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        if (recursive) walk(rel);
      } else if (only(rel)) {
        const st = statSync(join(dir, rel), { throwIfNoEntry: false });
        if (st) files.set(rel, `${st.mtimeMs}:${st.size}`);
      }
    }
  };
  walk('');
  return files;
}

/** The files added, changed or removed between two snapshots. */
export function changedBetween(before: Map<string, string>, after: Map<string, string>) {
  const changed = [...after].filter(([file, stamp]) => before.get(file) !== stamp).map(([file]) => file);
  return changed.concat([...before.keys()].filter((file) => !after.has(file)));
}

/** Calls onChange once per burst of saves (150 ms quiet), with the files saved: a file whose time or size moved, never
 * one whose attributes alone did. Returns a function that stops it. */
export function watchFolder(dir: string, { recursive = true, only = () => true, pollMs = POLL_MS }: WatchOptions, onChange: (files: string[]) => Promise<void>) {
  let timer: NodeJS.Timeout | undefined;
  const changed = new Set<string>();
  const saw = (files: string[]) => {
    files.forEach((f) => changed.add(f));
    clearTimeout(timer);
    timer = setTimeout(() => {
      const batch = [...changed];
      changed.clear();
      enqueue(() => onChange(batch));
    }, 150);
  };
  if (pollMs) {
    let last = snapshot(dir, { recursive, only });
    const sweep = setInterval(() => {
      const now = snapshot(dir, { recursive, only });
      const files = changedBetween(last, now);
      last = now;
      if (files.length) saw(files);
    }, pollMs);
    return () => (clearInterval(sweep), clearTimeout(timer));
  }
  const known = snapshot(dir, { recursive, only });
  const watcher = watch(dir, { recursive }, (event, file) => {
    const name = String(file ?? '');
    if (!name || !only(name)) return;
    const st = statSync(join(dir, name), { throwIfNoEntry: false });
    const stamp = st && !st.isDirectory() ? `${st.mtimeMs}:${st.size}` : undefined;
    if (stamp === known.get(name)) return; // its attributes alone moved (iCloud, Spotlight): not a save
    if (stamp) known.set(name, stamp);
    else known.delete(name);
    saw([name]);
  });
  return () => (watcher.close(), clearTimeout(timer));
}

// ng build --watch, one per Angular app. The two often rebuild together (the admin uses the site's icons), so builds
// that finish within a quarter second share one test run and one reload. Angular rebuilds on any event, an attribute
// change too, so a rebuild whose output is the same as before reloads nothing.
const builds: ChildProcess[] = [];
const outputs = new Map<string, string>();
/** True when the app's built folder differs from what it held at the last look. */
function outputMoved(project: string) {
  const dir = join(BACKEND, 'dist', project);
  const hash = createHash('sha1');
  for (const file of [...snapshot(dir).keys()].sort()) hash.update(`${file}\0`).update(readFileSync(join(dir, file)));
  const digest = hash.digest('hex');
  const moved = outputs.get(project) !== digest;
  outputs.set(project, digest);
  return moved;
}
const rebuilt = new Set<string>();
let afterBuild: NodeJS.Timeout | undefined;
function builtOne(project: string) {
  rebuilt.add(project);
  clearTimeout(afterBuild);
  afterBuild = setTimeout(
    () =>
      enqueue(async () => {
        const projects = [...rebuilt];
        rebuilt.clear();
        // Angular says a build is done just before it writes the files; a second look covers a slow write.
        let moved = projects.filter(outputMoved);
        if (!moved.length) moved = await new Promise<string[]>((r) => setTimeout(() => r(projects.filter(outputMoved)), 500));
        if (!moved.length) {
          log('build', `${projects.join(' and ')}: the output is the same as before, nothing to reload`, 'dim');
          return;
        }
        await backendTests();
        await reloadPages();
      }),
    250,
  );
}
function ngWatch(project: string, onFirst: () => void) {
  const args = ['build', project, '--watch', '--configuration', 'development', ...(POLL_MS ? ['--poll', String(POLL_MS)] : [])];
  const child = spawn(NG, args, { cwd: BACKEND, env: { ...process.env, NG_CLI_ANALYTICS: 'false', NO_COLOR: '1', FORCE_COLOR: '0' } });
  builds.push(child);
  let errors: string[] = [];
  let first = true;
  const firstDone = () => {
    if (!first) return;
    first = false;
    onFirst();
  };
  const onLine = (line: string) => {
    const done = /Application bundle generation (complete|failed)\. \[([\d.]+) seconds\]/.exec(line);
    if (done) {
      if (done[1] === 'failed' || errors.length) {
        log(project, `build failed in ${done[2]} s:`, 'bad');
        for (const e of errors.slice(0, 12)) log('', e, 'bad');
      } else {
        log(project, `built in ${done[2]} s`, 'ok');
        if (!first) builtOne(project);
      }
      errors = [];
      firstDone();
    } else if (/\[ERROR\]|✘|Error:/.test(line) || (errors.length && line.trim())) {
      errors.push(line.trimEnd());
    }
  };
  createInterface({ input: child.stdout }).on('line', onLine);
  createInterface({ input: child.stderr }).on('line', onLine);
  child.on('close', (code) => {
    if (code) log(project, `ng build --watch exited (${code})`, 'bad');
    firstDone();
  });
}

// ── Start ────────────────────────────────────────────────────────────────────────────────────────────────────────
async function main() {
  const where = IN_CONTAINER ? 'in the dev container' : "on this Mac's Node";
  log('dev', `watching ${where}, ${POLL_MS ? `polling every ${POLL_MS} ms` : 'by file events'}`, 'info');
  mkdirSync(join(BACKEND, 'dist'), { recursive: true });
  await bundleApp();
  // The source files are where the app is edited, so /app/ starts from their build (the root file's icon stays).
  if (existsSync(APP_SOURCES)) await buildAppFromSources();
  checkAppScript();
  startServer();
  // The start's own test run waits for both first builds: run beside them, it would be slowed past the 3 s limit. A
  // page open from before the start then reloads onto the new builds.
  let building = 2;
  const firstBuilt = () => {
    if (--building) return;
    enqueue(async () => {
      await Promise.all([typecheck(), backendTests()]);
      ['site', 'admin'].forEach(outputMoved);
      await reloadPages();
    });
  };
  ngWatch('site', firstBuilt);
  ngWatch('admin', firstBuilt);

  // The restart first, so the change shows at once; the type check and the tests follow, and the pages reload as the
  // server comes back (a new boot id).
  watchFolder(join(BACKEND, 'server'), {}, async (files) => {
    log('server', `changed: ${files.join(', ')}`);
    await restartServer();
    await Promise.all([typecheck(), backendTests()]);
  });
  watchFolder(join(BACKEND, 'client'), {}, async (files) => {
    log('client', `changed: ${files.join(', ')}`);
    await backendTests();
    await reloadPages();
  });
  // The repo root, for its two app files only. (macOS can name a deeper index.html on this folder's watch, the site's own
  // build; the root file's time and size then have not moved, so watchFolder lets it pass.)
  watchFolder(REPO, { recursive: false, only: (f) => f === 'index.html' || f === 'apple-touch-icon.png' }, async () => {
    await bundleApp();
    checkAppScript();
    await appUnitTests();
    await reloadPages();
  });
  // The app's source files: a save builds the page /app/ serves from them, into app-web/ only.
  if (existsSync(APP_SOURCES)) {
    watchFolder(APP_SOURCES, { only: (f) => /\.(html|css|js|json)$/.test(f) }, async (files) => {
      log('app', `changed: ${files.join(', ')}`);
      if (await buildAppFromSources()) checkAppScript();
      await reloadPages();
    });
  }

  if (await healthy(60_000)) log('server', `up on :${PORT}`, 'ok');
  if (IN_CONTAINER) log('tests', "app unit tests: on the Mac only, they need frontends/app/'s own node_modules (cd frontends/app && npm run test:unit)", 'dim');
}

async function stop() {
  if (stopping) return;
  stopping = true;
  for (const child of builds) child.kill('SIGTERM');
  await Promise.race([stopServer(), new Promise((r) => setTimeout(r, 5_000))]);
  log('dev', 'stopped');
  process.exit(0);
}

// Imported by the tests for its helpers; started only when run.
if (import.meta.main) {
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  main().catch((err) => {
    log('dev', err.message, 'bad');
    void stop();
  });
}
