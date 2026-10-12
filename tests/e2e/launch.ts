// npm run e2e: the whole suite in Docker. Bundles the app for the backend image, builds the three images (nginx serving
// the app and the Puppeteer runner from e2e/Dockerfile, the backend from backend/Dockerfile), starts nginx and the
// backend, runs the runner to completion, copies its report out, then tears it all down.
//
// Every run is a logged run (tools/runlog.mjs), kept under temp/runs/<stamp>-e2e/:
//   artifacts/index.html     the report, one self-contained file (every screenshot embedded)
//   artifacts/collage.png    every screen the suite covers on one labelled image
//   artifacts/docker/        the app bundle, docker build, up, cp and down output, and nginx's and the backend's own
//                            logs of every request they served
//   events.log, output.log   the run as it happened: each phase, each step's PASS or FAIL, everything printed
// temp/latest/e2e always points at the newest one.
//
//   npm run e2e                  build, run, tear down
//   E2E_KEEP=1 npm run e2e       leave nginx and the backend running afterwards and print their addresses
//   E2E_PORT=4280                pin nginx's host port (default: any free port)
//   E2E_PARITY_MAX=0             largest pixel difference allowed against the original, in percent (default 0)
//   E2E_ONLY=race-10k,admin      run only the named journeys (comma separated); step numbers stay the full suite's
//
// The compose project is named after this checkout, so two checkouts (or two sessions) never share containers,
// images or a port.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attachRun, duration, startRun } from '../../tools/runlog.mjs';

const E2E = dirname(fileURLToPath(import.meta.url));
const REPO = join(E2E, '..', '..');
const PROJECT = `iron-asylum-e2e-${createHash('sha256').update(E2E).digest('hex').slice(0, 8)}`;
const RUNNER = `${PROJECT}-runner`;
const COMPOSE = ['compose', '-f', join(E2E, 'docker-compose.yml'), '-p', PROJECT];
const KEEP = process.env['E2E_KEEP'] === '1';

// The run this belongs to: npm run e2e wraps it in one; run directly, it opens its own. If no run can be opened at
// all, the report goes to e2e/report/ as it used to.
const attached = attachRun();
let run = attached;
if (!run) {
  try {
    run = startRun('e2e', { command: 'node e2e/launch.ts' });
  } catch {
    run = null;
  }
}
const REPORT = run ? join(run.dir, 'artifacts') : join(E2E, 'report');
const LOGS = join(REPORT, 'docker');

const rel = (p: string) => relative(process.cwd(), p) || '.';
const note = (subject: string, text: string, global = false) => run?.event(subject, text, { global });

/** Runs one docker command quietly, its output kept in docker/; throws with the tail of the output on failure. */
function dockerLogged(args: string[], log: string): string {
  const started = Date.now();
  const res = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}${res.error ? `\n${res.error.message}` : ''}`;
  writeFileSync(join(LOGS, log), `$ docker ${args.join(' ')}\n${out}`);
  if (res.status !== 0) {
    process.stderr.write(out.split('\n').slice(-30).join('\n') + '\n');
    note('docker', `${log.replace(/\.log$/, '')} failed after ${duration(Date.now() - started)} (exit ${res.status ?? 'none'}); see artifacts/docker/${log}`, true);
    throw new Error(`docker ${args.slice(0, 4).join(' ')}… failed (exit ${res.status ?? 'none'}); log: ${rel(join(LOGS, log))}`);
  }
  return res.stdout ?? '';
}

/** Runs one docker command with its output streamed to this terminal (and the run's output.log); returns its exit code. */
function dockerLive(args: string[]): number {
  return spawnSync('docker', args, { stdio: ['ignore', 'inherit', 'inherit'] }).status ?? 1;
}

/** Removes the runner container if a run left one behind. Missing is fine. */
function removeRunner(): void {
  spawnSync('docker', ['rm', '--force', RUNNER], { stdio: 'ignore' });
}

/** A service's log of every request it served (nginx's, the backend's), saved before the container goes. Never fails the run. */
function saveLog(service: string, file: string): void {
  const res = spawnSync('docker', [...COMPOSE, 'logs', '--no-color', '--timestamps', service], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  if (res.status === 0) {
    writeFileSync(join(LOGS, file), res.stdout + res.stderr);
    note('docker', `saved ${service}'s log (${res.stdout.split('\n').filter(Boolean).length} lines) to artifacts/docker/${file}`);
  }
}

/**
 * backend/Dockerfile copies app-web/, the app the backend serves at /app/, which is made on the host from the repo's
 * index.html (backend/scripts/app-bundle.ts, Node alone, no install). Done here so the image never needs a step by
 * hand, locally or in CI.
 */
function bundleApp(): void {
  const script = join(REPO, 'backend', 'scripts', 'app-bundle.ts');
  const res = spawnSync(process.execPath, [script], { encoding: 'utf8' });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}${res.error ? `\n${res.error.message}` : ''}`;
  writeFileSync(join(LOGS, 'app-bundle.log'), `$ node ${relative(REPO, script)}\n${out}`);
  if (res.status !== 0) {
    process.stderr.write(out);
    throw new Error(`the app bundle for the backend image failed (exit ${res.status ?? 'none'}); log: ${rel(join(LOGS, 'app-bundle.log'))}`);
  }
  note('docker', out.trim().split('\n').at(-1) ?? 'app bundled');
}

function main(): number {
  if (!run) rmSync(REPORT, { recursive: true, force: true });
  mkdirSync(LOGS, { recursive: true });
  removeRunner();

  bundleApp();
  let t = Date.now();
  console.log(`e2e: building the web, backend and runner images for ${PROJECT} (the first build downloads Chrome; later builds reuse the cache)`);
  note('docker', `building the web, backend and runner images (${PROJECT})`);
  dockerLogged([...COMPOSE, 'build', 'web', 'backend', 'runner'], 'build.log');
  note('docker', `images built in ${duration(Date.now() - t)}`);
  console.log('e2e: starting nginx and the backend');
  t = Date.now();
  dockerLogged([...COMPOSE, 'up', '--detach', '--wait', 'web', 'backend'], 'up.log');
  note('docker', `nginx and the backend up and healthy in ${duration(Date.now() - t)}`);

  let status: number;
  try {
    t = Date.now();
    note('runner', `started${process.env['E2E_ONLY'] ? ` (E2E_ONLY=${process.env['E2E_ONLY']})` : ''}`);
    status = dockerLive([...COMPOSE, 'run', '--name', RUNNER, 'runner']);
    note('runner', `exited ${status} after ${duration(Date.now() - t)}`, status !== 0);
    // The report lives in the stopped runner container until it is copied out.
    dockerLogged(['cp', `${RUNNER}:/report/.`, REPORT], 'cp.log');
  } finally {
    removeRunner();
    saveLog('web', 'nginx.log');
    saveLog('backend', 'backend.log');
    if (KEEP) {
      const address = dockerLogged([...COMPOSE, 'port', 'web', '80'], 'port.log').trim();
      const backend = dockerLogged([...COMPOSE, 'port', 'web', '3000'], 'port-backend.log').trim();
      console.log(`e2e: E2E_KEEP=1, nginx left running: http://${address}/ (the original at /reference/)`);
      console.log(`e2e: E2E_KEEP=1, the backend left running: http://${backend}/ (the admin at /admin/, the app at /app/)`);
      console.log(`e2e: stop them with docker compose -p ${PROJECT} down`);
      note('docker', `nginx left running at http://${address}/, the backend at http://${backend}/ (E2E_KEEP=1)`);
    } else {
      dockerLogged([...COMPOSE, 'down', '--remove-orphans'], 'down.log');
      note('docker', 'containers removed');
    }
  }

  for (const f of ['index.html', 'collage.png']) {
    const p = join(REPORT, f);
    console.log(`e2e: ${existsSync(p) ? rel(p) : `no ${f} was written`}`);
    note('artifact', existsSync(p) ? `${f} written` : `no ${f} was written`, !existsSync(p));
  }
  return status;
}

let code: number;
try {
  code = main();
} catch (err) {
  console.error(`e2e: ${err instanceof Error ? err.message : String(err)}`);
  code = 1;
}
process.exitCode = code;
// Opened here (not by a wrapper): close it here.
if (run && !attached) run.finish({ exitCode: code });
