// npm run e2e: the whole suite in Docker. Builds the two images in e2e/Dockerfile (nginx serving the app, and the
// Puppeteer runner), starts nginx, runs the runner to completion, copies its report out, then tears both down.
// It writes e2e/report/:
//   index.html    the report, one self-contained file (every screenshot embedded)
//   collage.png   every screen the suite covers on one labelled image
//   logs/         the docker build, up and down output
//
//   npm run e2e                  build, run, tear down
//   E2E_KEEP=1 npm run e2e       leave nginx running afterwards and print its address (the original is at /reference/)
//   E2E_PORT=4280                pin nginx's host port (default: any free port)
//   E2E_PARITY_MAX=0             largest pixel difference allowed against the original, in percent (default 0)
//   E2E_ONLY=race-10k            run only the named journeys (comma separated); step numbers stay the full suite's
//
// The compose project is named after this checkout, so two checkouts (or two sessions) never share containers,
// images or a port.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E = dirname(fileURLToPath(import.meta.url));
const REPORT = join(E2E, 'report');
const LOGS = join(REPORT, 'logs');
const PROJECT = `iron-asylum-e2e-${createHash('sha256').update(E2E).digest('hex').slice(0, 8)}`;
const RUNNER = `${PROJECT}-runner`;
const COMPOSE = ['compose', '-f', join(E2E, 'docker-compose.yml'), '-p', PROJECT];
const KEEP = process.env['E2E_KEEP'] === '1';

const rel = (p: string) => relative(process.cwd(), p) || '.';

/** Runs one docker command quietly, its output kept in logs/; throws with the tail of the output on failure. */
function dockerLogged(args: string[], log: string): string {
  const res = spawnSync('docker', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const out = `${res.stdout ?? ''}${res.stderr ?? ''}${res.error ? `\n${res.error.message}` : ''}`;
  writeFileSync(join(LOGS, log), `$ docker ${args.join(' ')}\n${out}`);
  if (res.status !== 0) {
    process.stderr.write(out.split('\n').slice(-30).join('\n') + '\n');
    throw new Error(`docker ${args.slice(0, 4).join(' ')}… failed (exit ${res.status ?? 'none'}); log: ${rel(join(LOGS, log))}`);
  }
  return res.stdout ?? '';
}

/** Runs one docker command with its output streamed to this terminal; returns its exit code. */
function dockerLive(args: string[]): number {
  return spawnSync('docker', args, { stdio: ['ignore', 'inherit', 'inherit'] }).status ?? 1;
}

/** Removes the runner container if a run left one behind. Missing is fine. */
function removeRunner(): void {
  spawnSync('docker', ['rm', '--force', RUNNER], { stdio: 'ignore' });
}

function main(): number {
  rmSync(REPORT, { recursive: true, force: true });
  mkdirSync(LOGS, { recursive: true });
  removeRunner();

  console.log(`e2e: building the web and runner images for ${PROJECT} (the first build downloads Chrome; later builds reuse the cache)`);
  dockerLogged([...COMPOSE, 'build', 'web', 'runner'], 'docker-build.log');
  console.log('e2e: starting nginx');
  dockerLogged([...COMPOSE, 'up', '--detach', '--wait', 'web'], 'docker-up.log');

  let status: number;
  try {
    status = dockerLive([...COMPOSE, 'run', '--name', RUNNER, 'runner']);
    // The report lives in the stopped runner container until it is copied out.
    dockerLogged(['cp', `${RUNNER}:/report/.`, REPORT], 'docker-cp.log');
  } finally {
    removeRunner();
    if (KEEP) {
      const address = dockerLogged([...COMPOSE, 'port', 'web', '80'], 'docker-port.log').trim();
      console.log(`e2e: E2E_KEEP=1, nginx left running: http://${address}/ (the original at /reference/)`);
      console.log(`e2e: stop it with docker compose -p ${PROJECT} down`);
    } else {
      dockerLogged([...COMPOSE, 'down', '--remove-orphans'], 'docker-down.log');
    }
  }

  for (const f of ['index.html', 'collage.png']) {
    const p = join(REPORT, f);
    console.log(`e2e: ${existsSync(p) ? rel(p) : `no ${f} was written`}`);
  }
  return status;
}

try {
  process.exitCode = main();
} catch (err) {
  console.error(`e2e: ${err instanceof Error ? err.message : String(err)}`);
  process.exitCode = 1;
}
