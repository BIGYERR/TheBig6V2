// node --test test/   (npm test). Boots the app on a random port with a fake clock; no network beyond localhost.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { DeviceStore, isUid, summarize } from '../server/store.js';

const AUTH = 'Basic ' + Buffer.from('admin:secret').toString('base64');

async function boot(env = {}, clock = { t: 1_000_000 }) {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_USER: 'admin', ADMIN_PASSWORD: 'secret', ...env });
  const store = new DeviceStore({ ...config, now: () => clock.t });
  const server = createApp({ config, store, adminDir: '/nonexistent' }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return { base, store, clock, close: () => new Promise((resolve) => server.close(resolve)) };
}

function beat(base, body, headers = {}) {
  return fetch(`${base}/api/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', ...headers },
    body: JSON.stringify(body),
  });
}

describe('public API', () => {
  let s;
  before(async () => (s = await boot()));
  after(() => s.close());

  test('/healthz answers without auth', async () => {
    const r = await fetch(`${s.base}/healthz`);
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.ok, true);
    assert.equal(j.service, 'iron-asylum-backend');
  });

  test('a first beat with no UID is issued one; the next beat keeps it', async () => {
    const j1 = await (await beat(s.base, { label: 'iPhone · iOS 18.6', platform: 'home-screen' })).json();
    assert.equal(j1.issued, true);
    assert.ok(isUid(j1.uid));
    assert.equal(j1.nextBeatMs, 15_000);
    const j2 = await (await beat(s.base, { uid: j1.uid, rttMs: 84 })).json();
    assert.equal(j2.uid, j1.uid);
    assert.equal(j2.issued, false);
    const d = s.store.devices.get(j1.uid);
    assert.equal(d.beats, 2);
    assert.deepEqual(d.rtt, [84]);
    assert.equal(d.label, 'iPhone · iOS 18.6', 'a beat without a label keeps the old one');
  });

  test('a malformed UID is replaced; an unknown well formed one is kept', async () => {
    const bad = await (await beat(s.base, { uid: 'not-a-uid' })).json();
    assert.equal(bad.issued, true);
    assert.notEqual(bad.uid, 'not-a-uid');
    const known = '0b6f2c1e-8a8d-4c3b-9f0e-1a2b3c4d5e6f';
    const kept = await (await beat(s.base, { uid: known })).json();
    assert.equal(kept.uid, known);
    assert.equal(kept.issued, false);
  });

  test('out-of-range round trips are ignored', async () => {
    const { uid } = await (await beat(s.base, {})).json();
    await beat(s.base, { uid, rttMs: -5 });
    await beat(s.base, { uid, rttMs: 'fast' });
    await beat(s.base, { uid, rttMs: 999_999 });
    assert.deepEqual(s.store.devices.get(uid).rtt, []);
  });

  test('CORS: an allowed origin is echoed, a foreign one refused, a preflight answered', async () => {
    const ok = await beat(s.base, {}, { Origin: 'https://bigyerr.github.io' });
    assert.equal(ok.status, 200);
    assert.equal(ok.headers.get('access-control-allow-origin'), 'https://bigyerr.github.io');
    const local = await beat(s.base, {}, { Origin: 'http://localhost:4200' });
    assert.equal(local.headers.get('access-control-allow-origin'), 'http://localhost:4200');
    const cordova = await beat(s.base, {}, { Origin: 'app://localhost' });
    assert.equal(cordova.status, 200);
    const foreign = await beat(s.base, {}, { Origin: 'https://evil.example' });
    assert.equal(foreign.status, 403);
    const sneaky = await beat(s.base, {}, { Origin: 'https://bigyerr.github.io.evil.example' });
    assert.equal(sneaky.status, 403);
    const pre = await fetch(`${s.base}/api/heartbeat`, { method: 'OPTIONS', headers: { Origin: 'https://bigyerr.github.io' } });
    assert.equal(pre.status, 204);
  });

  test('a body that is not JSON is a 400; an oversized one a 413', async () => {
    const r = await fetch(`${s.base}/api/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{nope' });
    assert.equal(r.status, 400);
    const big = await beat(s.base, { label: 'x'.repeat(5000) });
    assert.equal(big.status, 413);
  });

  test('bye marks the device gone at once; the next beat starts a new session', async () => {
    const { uid } = await (await beat(s.base, {})).json();
    assert.equal(s.store.isConnected(s.store.devices.get(uid)), true);
    const r = await fetch(`${s.base}/api/bye`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ uid }) });
    assert.equal(r.status, 204);
    assert.equal(s.store.isConnected(s.store.devices.get(uid)), false);
    await beat(s.base, { uid });
    assert.equal(s.store.devices.get(uid).sessions, 2);
  });
});

describe('admin', () => {
  let s;
  before(async () => (s = await boot()));
  after(() => s.close());
  const get = (path, auth = AUTH) => fetch(`${s.base}${path}`, { headers: auth ? { Authorization: auth } : {} });

  test('needs the login', async () => {
    const r = await get('/admin/api/stats', null);
    assert.equal(r.status, 401);
    assert.match(r.headers.get('www-authenticate'), /^Basic /);
    const wrong = await get('/admin/api/stats', 'Basic ' + Buffer.from('admin:nope').toString('base64'));
    assert.equal(wrong.status, 401);
    assert.equal((await get('/admin/api/stats')).status, 200);
  });

  test('stats count connected devices and uniques, and drop devices past the window', async () => {
    const a = (await (await beat(s.base, {})).json()).uid;
    await beat(s.base, { uid: a, rttMs: 100 });
    const b = (await (await beat(s.base, {})).json()).uid;
    await beat(s.base, { uid: b, rttMs: 300 });
    let j = await (await get('/admin/api/stats')).json();
    assert.equal(j.connected, 2);
    assert.equal(j.uniques, 2);
    assert.equal(j.latency.samples, 2);
    assert.equal(j.latency.p50, 100);
    assert.equal(j.latency.max, 300);
    s.clock.t += 46_000; // past the 45 s window
    j = await (await get('/admin/api/stats')).json();
    assert.equal(j.connected, 0);
    assert.equal(j.uniques, 2);
  });

  test('devices: pagination, text search, name search, rename', async () => {
    for (let i = 0; i < 12; i++) await beat(s.base, { label: i % 2 ? 'iPhone · iOS 18.6' : 'Mac', screen: `w${i}` });
    let j = await (await get('/admin/api/devices?page=2&pageSize=5')).json();
    assert.equal(j.total, 14);
    assert.equal(j.pages, 3);
    assert.equal(j.page, 2);
    assert.equal(j.items.length, 5);
    j = await (await get('/admin/api/devices?page=99&pageSize=5')).json();
    assert.equal(j.page, 3, 'a page past the end clamps to the last');
    assert.equal(j.items.length, 4);
    j = await (await get('/admin/api/devices?page=&pageSize=abc')).json();
    assert.equal(j.pageSize, 25, 'a junk page size falls back to 25');
    assert.equal(j.page, 1);

    j = await (await get('/admin/api/devices?q=iphone&pageSize=100')).json();
    assert.equal(j.total, 6);

    const uid = j.items[0].uid;
    const r = await fetch(`${s.base}/admin/api/devices/${uid}`, {
      method: 'PATCH',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: "Mario's iPhone" }),
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).name, "Mario's iPhone");
    j = await (await get('/admin/api/devices?name=mario')).json();
    assert.equal(j.total, 1);
    assert.equal(j.items[0].uid, uid);
    assert.equal(j.items[0].rtt, undefined, 'raw samples stay on the server');
    assert.equal((await (await get('/admin/api/devices?q=ios')).json()).total, 6);
    j = await (await get('/admin/api/devices?name=ios')).json();
    assert.equal(j.total, 0, 'name search does not match the label');

    const missing = await fetch(`${s.base}/admin/api/devices/0b6f2c1e-8a8d-4c3b-9f0e-000000000000`, {
      method: 'PATCH',
      headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
      body: '{"name":"x"}',
    });
    assert.equal(missing.status, 404);
  });

  test('connected devices sort first; ?connected=1 filters', async () => {
    s.clock.t += 1_000;
    const fresh = (await (await beat(s.base, {})).json()).uid;
    let j = await (await get('/admin/api/devices')).json();
    assert.equal(j.items[0].uid, fresh);
    j = await (await get('/admin/api/devices?connected=1')).json();
    assert.ok(j.items.every((d) => d.connected));
  });

  test('the admin UI says it is not built when dist is missing', async () => {
    const r = await get('/admin/');
    assert.equal(r.status, 503);
  });
});

describe('admin lockout and switch', () => {
  test('ten wrong passwords lock the address out', async () => {
    const s = await boot();
    const bad = 'Basic ' + Buffer.from('admin:wrong').toString('base64');
    for (let i = 0; i < 10; i++) assert.equal((await fetch(`${s.base}/admin/api/stats`, { headers: { Authorization: bad } })).status, 401);
    const locked = await fetch(`${s.base}/admin/api/stats`, { headers: { Authorization: AUTH } });
    assert.equal(locked.status, 429);
    await s.close();
  });

  test('off Heroku, X-Forwarded-For is ignored, so rotating it does not dodge the lockout', async () => {
    const s = await boot();
    const bad = 'Basic ' + Buffer.from('admin:wrong').toString('base64');
    for (let i = 0; i < 10; i++) {
      await fetch(`${s.base}/admin/api/stats`, { headers: { Authorization: bad, 'X-Forwarded-For': `10.0.0.${i}` } });
    }
    const r = await fetch(`${s.base}/admin/api/stats`, { headers: { Authorization: AUTH, 'X-Forwarded-For': '10.0.0.99' } });
    assert.equal(r.status, 429);
    await s.close();
  });

  test('on Heroku (DYNO set), plain http is sent to https and each caller has its own lockout', async () => {
    const s = await boot({ DYNO: 'web.1' });
    const http = await fetch(`${s.base}/admin/api/stats?x=1`, { redirect: 'manual', headers: { 'X-Forwarded-Proto': 'http' } });
    assert.equal(http.status, 308);
    assert.match(http.headers.get('location'), /^https:\/\/127\.0\.0\.1:\d+\/admin\/api\/stats\?x=1$/);
    const https = { 'X-Forwarded-Proto': 'https' };
    const bad = 'Basic ' + Buffer.from('admin:wrong').toString('base64');
    for (let i = 0; i < 10; i++) {
      await fetch(`${s.base}/admin/api/stats`, { headers: { ...https, Authorization: bad, 'X-Forwarded-For': '10.0.0.1' } });
    }
    const other = await fetch(`${s.base}/admin/api/stats`, { headers: { ...https, Authorization: AUTH, 'X-Forwarded-For': '10.0.0.2' } });
    assert.equal(other.status, 200);
    const locked = await fetch(`${s.base}/admin/api/stats`, { headers: { ...https, Authorization: AUTH, 'X-Forwarded-For': '10.0.0.1' } });
    assert.equal(locked.status, 429);
    await s.close();
  });

  test('a rename without a JSON name is refused, not read as clearing it', async () => {
    const s = await boot();
    const { uid } = await (await beat(s.base, {})).json();
    s.store.rename(uid, 'Kept');
    const r = await fetch(`${s.base}/admin/api/devices/${uid}`, { method: 'PATCH', headers: { Authorization: AUTH }, body: '{"name":""}' });
    assert.equal(r.status, 400);
    assert.equal(s.store.devices.get(uid).name, 'Kept');
    await s.close();
  });

  test('production with no password turns admin off', async () => {
    const s = await boot({ ADMIN_PASSWORD: '' });
    assert.equal((await fetch(`${s.base}/admin/api/stats`, { headers: { Authorization: AUTH } })).status, 503);
    await s.close();
  });

  test('the demo page is off in production and on in development', async () => {
    const prod = await boot();
    assert.equal((await fetch(`${prod.base}/client/`)).status, 404);
    await prod.close();
    const dev = await boot({ NODE_ENV: 'development' });
    const r = await fetch(`${dev.base}/client/`);
    assert.equal(r.status, 200);
    assert.match(await r.text(), /iaLinkDot/);
    await dev.close();
  });
});

describe('store', () => {
  test('summarize uses nearest rank', () => {
    const s = summarize([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    assert.deepEqual(s, { samples: 10, avg: 55, p50: 50, p95: 100, min: 10, max: 100 });
    assert.equal(summarize([]).p50, null);
  });

  test('keeps the last 50 samples per device', () => {
    const store = new DeviceStore();
    const { uid } = store.heartbeat({});
    for (let i = 0; i < 60; i++) store.heartbeat({ uid, rttMs: i });
    const rtt = store.devices.get(uid).rtt;
    assert.equal(rtt.length, 50);
    assert.equal(rtt[0], 10);
  });

  test('evicts the least recently seen past maxDevices', () => {
    const clock = { t: 0 };
    const store = new DeviceStore({ maxDevices: 3, now: () => clock.t });
    const uids = [];
    for (let i = 0; i < 4; i++) {
      clock.t += 1000;
      uids.push(store.heartbeat({}).uid);
    }
    assert.equal(store.devices.size, 3);
    assert.equal(store.devices.has(uids[0]), false);
  });

  test('a data file survives a restart, with nobody connected', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ia-backend-'));
    try {
      const file = join(dir, 'devices.json');
      const a = new DeviceStore({ dataFile: file });
      const { uid } = a.heartbeat({ label: 'iPhone', rttMs: 42 });
      a.rename(uid, 'Kitchen iPad');
      a.flush();
      const b = new DeviceStore({ dataFile: file });
      assert.equal(b.load(), 1);
      const d = b.devices.get(uid);
      assert.equal(d.name, 'Kitchen iPad');
      assert.deepEqual(d.rtt, [42]);
      assert.equal(b.isConnected(d), false);
      assert.equal(b.beatsTotal, 1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test('a data file of the wrong shape loads what it can and never crashes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ia-backend-'));
    try {
      const file = join(dir, 'devices.json');
      writeFileSync(file, 'null');
      assert.equal(new DeviceStore({ dataFile: file }).load(), 0);
      const uid = '0b6f2c1e-8a8d-4c3b-9f0e-1a2b3c4d5e6f';
      writeFileSync(file, JSON.stringify({ devices: [{ uid, label: 7, rtt: [1, 'x', 3] }, { uid: 'junk' }, null] }));
      const s = new DeviceStore({ dataFile: file });
      assert.equal(s.load(), 1);
      assert.equal(s.devices.get(uid).label, '');
      assert.deepEqual(s.devices.get(uid).rtt, [1, 3]);
      assert.equal(s.list({ q: 'anything' }).total, 0, 'search runs over the rebuilt record');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
