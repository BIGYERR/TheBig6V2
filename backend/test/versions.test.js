// App versions per device (server/versions.js, store.versions) and which backend answered (/healthz, the heartbeat
// reply): the two facts that tell who runs an old build, and what a phone or a test run is connected to.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { DeviceStore } from '../server/store.js';
import { compareVersions, isOutdated, normalizeVersion } from '../server/versions.js';

const AUTH = { Authorization: 'Basic ' + Buffer.from('admin:secret').toString('base64') };

async function boot(env = {}, appDir = '/nonexistent') {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_USER: 'admin', ADMIN_PASSWORD: 'secret', ...env });
  const store = new DeviceStore(config);
  const server = createApp({ config, store, adminDir: '/nonexistent', siteDir: '/nonexistent', appDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const beat = async (body) => (await fetch(`${base}/api/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) })).json();
  const admin = async (path) => (await fetch(`${base}/admin/api/${path}`, { headers: AUTH })).json();
  return { base, beat, admin, close: () => new Promise((resolve) => server.close(resolve)) };
}

describe('version rule', () => {
  test('a bare build number reads as 0.N.0 and sorts below semver', () => {
    assert.equal(normalizeVersion('239'), '0.239.0');
    assert.ok(compareVersions('239', '0.240.0') < 0);
    assert.ok(compareVersions('0.240.0', '240') === 0);
    assert.equal(isOutdated('238', '239'), true);
    assert.equal(isOutdated('demo', '239'), false, 'not comparable is never called old');
    assert.equal(isOutdated('239', ''), false);
  });
});

describe('versions in the admin', () => {
  let s;
  before(async () => (s = await boot()));
  after(() => s.close());

  test('devices group by version, newest first, with the old ones counted and flagged', async () => {
    await s.beat({ appVersion: '237' });
    await s.beat({ appVersion: '239' });
    await s.beat({ appVersion: '239' });
    await s.beat({ appVersion: '238' });
    await s.beat({ appVersion: 'demo' });
    const v = await s.admin('versions');
    assert.equal(v.latest, '239');
    assert.equal(v.latestFrom, 'devices', 'nothing configured and no app bundled: the newest reported');
    assert.deepEqual(v.rows.map((r) => [r.version, r.devices, r.outdated]), [['239', 2, false], ['238', 1, true], ['237', 1, true], ['demo', 1, false]]);
    assert.equal(v.outdated, 2);
    assert.equal(v.rows[0].semver, '0.239.0');
  });

  test('?outdated=1 lists only the devices on an old build, each flagged', async () => {
    const page = await s.admin('devices?outdated=1');
    assert.equal(page.total, 2);
    assert.ok(page.items.every((d) => d.outdated && ['237', '238'].includes(d.appVersion)));
    assert.equal(page.latest, '239');
    const stats = await s.admin('stats');
    assert.equal(stats.outdated, 2);
    assert.equal(stats.latestApp, '239');
  });
});

describe('the newest version comes from config, then the app at /app/, then the devices', () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'ia-app-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><meta name="ia-version" content="240"><title>app</title>');
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test('the bundled app sets the newest version, so a device on the old one is flagged', async () => {
    const s = await boot({}, dir);
    await s.beat({ appVersion: '239' });
    const v = await s.admin('versions');
    assert.deepEqual([v.latest, v.latestFrom, v.outdated], ['240', 'app', 1]);
    await s.close();
  });

  test('APP_LATEST_VERSION wins over the bundled app', async () => {
    const s = await boot({ APP_LATEST_VERSION: '0.241.0' }, dir);
    await s.beat({ appVersion: '240' });
    const v = await s.admin('versions');
    assert.deepEqual([v.latest, v.latestFrom, v.outdated], ['0.241.0', 'config', 1]);
    await s.close();
  });

  test('/app/ serves the bundled app, revalidated on every load; /healthz names its version', async () => {
    const s = await boot({}, dir);
    const r = await fetch(`${s.base}/app/`);
    assert.equal(r.status, 200);
    assert.equal(r.headers.get('cache-control'), 'no-cache');
    assert.match(await r.text(), /content="240"/);
    assert.equal((await fetch(`${s.base}/app`, { redirect: 'manual' })).status, 301, '/app goes to /app/ so relative links work');
    assert.equal((await (await fetch(`${s.base}/healthz`)).json()).app, '240');
    // A new bundle shows without a restart (the version is read again when the file changes).
    writeFileSync(join(dir, 'index.html'), '<!doctype html><meta name="ia-version" content="241"><title>app</title>');
    assert.equal((await (await fetch(`${s.base}/healthz`)).json()).app, '241');
    await s.close();
  });

  test('/app/ says it is not bundled when there is no app', async () => {
    const s = await boot();
    const r = await fetch(`${s.base}/app/`);
    assert.equal(r.status, 503);
    assert.match(await r.text(), /app:bundle/);
    await s.close();
  });
});

describe('which backend answered', () => {
  test('/healthz and every heartbeat reply name the kind, name, version and commit', async () => {
    const s = await boot({ IA_BACKEND_KIND: 'docker', IA_BACKEND_NAME: 'docker on this Mac', GIT_COMMIT: 'abc1234' });
    const h = await (await fetch(`${s.base}/healthz`)).json();
    assert.equal(h.backend, 'docker');
    assert.equal(h.name, 'docker on this Mac');
    const reply = await s.beat({});
    assert.deepEqual(reply.backend, { kind: 'docker', name: 'docker on this Mac', version: '0.1.0', commit: 'abc1234' });
    assert.equal((await s.admin('stats')).server.kind, 'docker');
    await s.close();
  });

  test('the kind defaults to heroku on a dyno and local elsewhere', () => {
    assert.equal(loadConfig({ DYNO: 'web.1', HEROKU_APP_NAME: 'iron-asylum-api' }).backendKind, 'heroku');
    assert.equal(loadConfig({ DYNO: 'web.1', HEROKU_APP_NAME: 'iron-asylum-api' }).backendName, 'iron-asylum-api');
    assert.equal(loadConfig({}).backendKind, 'local');
  });
});
