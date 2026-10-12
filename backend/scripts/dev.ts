#!/usr/bin/env node
// npm run dev: the whole stack on http://localhost:3000, rebuilt as you save, by the dev container.
//
//   npm run dev                  start the dev container (building its image when something baked into it changed),
//                                then follow its log. Ctrl-C stops following; the container keeps running and rebuilding
//   npm run dev:down             stop it (the devices volume stays)
//   npm run dev -- --no-docker   the same watcher on this Mac's Node instead, in the foreground; Ctrl-C stops it
//
// The container is the docker backend's own (docker-compose.yml with docker-compose.dev.yml laid over it): the same
// name, port and devices volume as npm run docker:up, which puts back the plain production image. It runs
// scripts/dev-watch.ts from Dockerfile.dev, which rebuilds site/, admin/, server/, client/, the app's source files
// (app/src/legacy/src/) and the repo root index.html as they are saved, with nothing running on this Mac, and comes back
// whenever Docker starts (restart: unless-stopped).
// It shows a change; it proves nothing. The pre-commit check, CI, and the build paths for devices in app/ do that.
import { spawn } from 'node:child_process';
import type { SpawnOptions } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BACKEND = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.API_PORT || 3000);
const BASE = `http://localhost:${PORT}`;
const DOCKER = !process.argv.includes('--no-docker');
const COMPOSE = ['compose', '-f', 'docker-compose.yml', '-f', 'docker-compose.dev.yml'];

const say = (msg: string) => console.log(`  ${msg}`);

/** Runs a command to the end and returns its exit code and everything it printed. */
function exec(cmd: string, args: string[], opts: SpawnOptions = {}): Promise<{ code: number; out: string }> {
  return new Promise((done) => {
    const child = spawn(cmd, args, { cwd: BACKEND, ...opts });
    let out = '';
    child.stdout?.on('data', (d) => (out += d));
    child.stderr?.on('data', (d) => (out += d));
    child.on('error', (err) => done({ code: 127, out: String(err) }));
    child.on('close', (code) => done({ code: code ?? 128, out }));
  });
}

/** What /healthz says, as far as the banner reads it. */
interface Health {
  backend: string;
  name: string;
  app: string;
}

async function healthy(timeoutMs: number): Promise<Health | null> {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const r = await fetch(`${BASE}/healthz`, { signal: AbortSignal.timeout(1000) });
      if (r.ok) return (await r.json()) as Health;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

function banner(health: Health) {
  const login = process.env.ADMIN_USER || process.env.ADMIN_PASSWORD ? 'your ADMIN_USER / ADMIN_PASSWORD' : 'admin / asylum';
  console.log(`
  Iron Asylum, served by the ${health.backend} backend "${health.name}"
    website  ${BASE}/
    app      ${BASE}/app/      (app ${health.app || 'not bundled'})
    admin    ${BASE}/admin/    (${login})
    snippet  ${BASE}/client/
  Edit site/, admin/, server/, client/ or the app's source files (app/src/legacy/src/); open pages reload by themselves.
  ${DOCKER ? 'Ctrl-C stops following the log; the container keeps rebuilding. npm run dev:down stops it.' : 'Ctrl-C stops.'}
`);
}

// ── The dev container ────────────────────────────────────────────────────────────────────────────────────────────
async function docker() {
  if ((await exec('docker', ['info'])).code !== 0) {
    say('docker is not running. Start Docker Desktop, or run: npm run dev -- --no-docker');
    process.exit(1);
  }
  // The two folders the container writes, mounted from here.
  for (const dir of ['dist', 'app-web']) mkdirSync(join(BACKEND, dir), { recursive: true });
  say('starting the dev container (its first build installs every dependency, a minute or two)');
  const started = Date.now();
  // The Mac's time zone, so the container's log reads in the Mac's time.
  const env = { ...process.env, TZ: process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone };
  const up = await exec('docker', [...COMPOSE, 'up', '--build', '--detach'], { env });
  if (up.code !== 0) {
    console.log(up.out.trimEnd());
    say('docker compose up failed (above)');
    process.exit(1);
  }
  say(`dev container up (${((Date.now() - started) / 1000).toFixed(1)} s); its log follows`);

  const logs = spawn('docker', [...COMPOSE, 'logs', '--follow', '--no-log-prefix', '--tail', '40', 'api'], {
    cwd: BACKEND,
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const leave = () => {
    logs.kill('SIGTERM');
    console.log('\n  Stopped following. The dev container keeps running and rebuilding: npm run dev follows it again, npm run dev:down stops it.');
    process.exit(0);
  };
  process.on('SIGINT', leave);
  process.on('SIGTERM', leave);
  logs.on('close', (code) => process.exit(code ?? 0));

  const health = await healthy(90_000);
  if (health) banner(health);
  else say(`no answer from ${BASE}/healthz after 90 s; the log says why`);
}

// ── --no-docker: the watcher on this Mac ─────────────────────────────────────────────────────────────────────────
async function local() {
  if (!existsSync(join(BACKEND, 'node_modules'))) {
    say('installing dependencies (npm ci)');
    if ((await exec('npm', ['ci', '--no-audit', '--no-fund'], { stdio: 'inherit' })).code) process.exit(1);
  }
  const watcher = spawn(process.execPath, ['scripts/dev-watch.ts'], {
    cwd: BACKEND,
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(PORT),
      IA_BACKEND_KIND: 'local',
      IA_BACKEND_NAME: 'npm run dev on this Mac',
      ADMIN_USER: process.env.ADMIN_USER || 'admin',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'asylum',
      CLIENT_DEMO: '1',
      LOG_REQUESTS: process.env.LOG_REQUESTS || '0',
      DATA_FILE: join(BACKEND, 'data', 'dev', 'devices.json'),
    },
  });
  // Ctrl-C reaches the watcher too (same process group); it stops the server and the builds, then exits.
  process.on('SIGINT', () => {});
  process.on('SIGTERM', () => watcher.kill('SIGTERM'));
  watcher.on('close', (code) => process.exit(code ?? 0));
  const health = await healthy(60_000);
  if (health) banner(health);
}

(DOCKER ? docker() : local()).catch((err) => {
  say(String(err?.message ?? err));
  process.exit(1);
});
