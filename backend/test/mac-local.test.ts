// scripts/mac-local-backend.sh: up starts the server in the background and waits for /healthz, status sees it, a
// heartbeat lands in the devices file once down stops it, and down is safe to run twice. Runs on a free port in a
// temp folder, with --no-build so it never runs Angular.
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const SCRIPT = fileURLToPath(new URL('../scripts/mac-local-backend.sh', import.meta.url));

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer().listen(0, '127.0.0.1', () => {
      const { port } = srv.address() as AddressInfo;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

describe('mac-local-backend', { skip: process.platform === 'win32' && 'bash script' }, () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;
  let base: string;
  const script = (...args: string[]) => run('bash', [SCRIPT, ...args], { env, timeout: 30_000 });

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'ia-mac-local-'));
    const port = await freePort();
    base = `http://localhost:${port}`;
    env = { ...process.env, API_PORT: String(port), MAC_LOCAL_DIR: dir, ADMIN_USER: '', ADMIN_PASSWORD: '' };
  });
  after(async () => {
    await script('down').catch(() => {});
    rmSync(dir, { recursive: true, force: true });
  });

  test('up starts it in the background and returns once /healthz answers', async () => {
    const { stdout } = await script('up', '--no-build');
    assert.match(stdout, new RegExp(`up on ${base}`));
    assert.match(stdout, /admin \/ asylum/);
    assert.ok(existsSync(join(dir, 'server.pid')));
    const health = await (await fetch(`${base}/healthz`)).json();
    assert.equal(health.ok, true);
    assert.equal(health.backend, 'mac-local', 'it says which backend it is');
    // up bundles this checkout's app, so /app/ serves the same ia-version as the repo root index.html.
    const root = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    assert.equal(health.app, /<meta name="ia-version" content="([^"]*)"/.exec(root)![1]);
    assert.equal((await fetch(`${base}/app/`)).status, 200);
  });

  test('it runs as production with the local admin login, like the docker image', async () => {
    const auth = 'Basic ' + Buffer.from('admin:asylum').toString('base64');
    assert.equal((await fetch(`${base}/admin/api/stats`)).status, 401);
    assert.equal((await fetch(`${base}/admin/api/stats`, { headers: { Authorization: auth } })).status, 200);
  });

  test('a second up says it is already running', async () => {
    const { stdout } = await script('up', '--no-build');
    assert.match(stdout, /already running/);
  });

  test('status reports the pid and the health check', async () => {
    const { stdout } = await script('status');
    assert.match(stdout, /running \(pid \d+\)/);
    assert.match(stdout, /"ok":true/);
  });

  test('down saves the devices file and stops it; a second down is harmless', async () => {
    const beat = await fetch(`${base}/api/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    const { uid } = await beat.json();
    const { stdout } = await script('down');
    assert.match(stdout, /stopped/);
    assert.ok(!existsSync(join(dir, 'server.pid')));
    await assert.rejects(fetch(`${base}/healthz`));
    assert.match(readFileSync(join(dir, 'devices.json'), 'utf8'), new RegExp(uid));
    assert.match((await script('down')).stdout, /not running/);
    assert.match((await script('status')).stdout, /not running/);
  });

  test('up refuses a port that is already taken', async () => {
    const port = Number(new URL(base).port);
    const blocker = createServer().listen(port, '127.0.0.1');
    await new Promise((resolve) => blocker.once('listening', resolve));
    try {
      await assert.rejects(script('up', '--no-build'), (err: unknown) => /already taken/.test((err as { stderr: string }).stderr));
    } finally {
      await new Promise((resolve) => blocker.close(resolve));
    }
  });
});
