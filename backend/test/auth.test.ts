// The staff login (server/auth.ts): a form login that sets a session cookie, a logout that ends it on the server,
// Basic auth still accepted for scripts, the lockout shared by both, and never a WWW-Authenticate challenge.
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { createApp } from '../server/app.ts';
import { createAdminAuth } from '../server/auth.ts';
import { loadConfig } from '../server/config.ts';
import { DeviceStore } from '../server/store.ts';

async function boot(env = {}) {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_USER: 'admin', ADMIN_PASSWORD: 'secret', ...env });
  const server = createApp({ config, store: new DeviceStore(config), adminDir: '/nonexistent', siteDir: '/nonexistent' }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

const json = { 'Content-Type': 'application/json' };
const login = (base: string, user: string, password: string) => fetch(`${base}/admin/api/login`, { method: 'POST', headers: json, body: JSON.stringify({ user, password }) });
const cookieOf = (res: Response) => (res.headers.get('set-cookie') ?? '').split(';')[0];

describe('staff login', () => {
  let s: Awaited<ReturnType<typeof boot>>;
  before(async () => (s = await boot()));
  after(() => s.close());

  test('a wrong password is a 401 with a message, and no browser login box', async () => {
    const r = await login(s.base, 'admin', 'nope');
    assert.equal(r.status, 401);
    assert.equal(r.headers.get('www-authenticate'), null);
    assert.equal((await r.json()).error, 'Wrong username or password.');
    assert.equal(r.headers.get('set-cookie'), null);
  });

  test('a login sets an HttpOnly, SameSite=Strict session cookie scoped to /admin', async () => {
    const r = await login(s.base, 'admin', 'secret');
    assert.equal(r.status, 200);
    const j = await r.json();
    assert.equal(j.user, 'admin');
    const header = r.headers.get('set-cookie') ?? '';
    assert.match(header, /^ia_admin=[\w-]{40,};/);
    for (const flag of ['Path=/admin', 'HttpOnly', 'SameSite=Strict', 'Max-Age=43200']) assert.ok(header.includes(flag), flag);
    assert.ok(!header.includes('Secure'), 'Secure only over https, or localhost http would drop the cookie');
  });

  test('the cookie opens the API; logout ends the session on the server', async () => {
    const cookie = cookieOf(await login(s.base, 'admin', 'secret'));
    const me = await fetch(`${s.base}/admin/api/me`, { headers: { cookie } });
    assert.equal(me.status, 200);
    assert.deepEqual({ ...(await me.json()), expiresAt: 0 }, { ok: true, user: 'admin', via: 'session', expiresAt: 0 });
    assert.equal((await fetch(`${s.base}/admin/api/stats`, { headers: { cookie } })).status, 200);

    const out = await fetch(`${s.base}/admin/api/logout`, { method: 'POST', headers: { cookie } });
    assert.equal(out.status, 200);
    assert.match(out.headers.get('set-cookie') ?? '', /^ia_admin=; .*Max-Age=0/);
    // A copy of the old cookie is dead, not just cleared in the browser.
    assert.equal((await fetch(`${s.base}/admin/api/stats`, { headers: { cookie } })).status, 401);
    assert.equal((await fetch(`${s.base}/admin/api/logout`, { method: 'POST' })).status, 200, 'logout is safe to repeat');
  });

  test('a made up cookie gets nothing', async () => {
    assert.equal((await fetch(`${s.base}/admin/api/me`, { headers: { cookie: 'ia_admin=forged' } })).status, 401);
  });

  test('scripts can still use Basic auth', async () => {
    const auth = 'Basic ' + Buffer.from('admin:secret').toString('base64');
    const r = await fetch(`${s.base}/admin/api/me`, { headers: { Authorization: auth } });
    assert.equal((await r.json()).via, 'basic');
  });

  test('a login must be JSON', async () => {
    const r = await fetch(`${s.base}/admin/api/login`, { method: 'POST', body: 'user=admin&password=secret', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    assert.equal(r.status, 400);
  });
});

describe('staff login lockout and switch', () => {
  test('ten wrong logins lock the address out, even for the right password', async () => {
    const s = await boot();
    for (let i = 0; i < 10; i++) assert.equal((await login(s.base, 'admin', `wrong${i}`)).status, 401);
    const r = await login(s.base, 'admin', 'secret');
    assert.equal(r.status, 429);
    assert.match((await r.json()).error, /ten minutes/);
    await s.close();
  });

  test('admin off in production with no password: login and API answer 503', async () => {
    const s = await boot({ ADMIN_USER: '', ADMIN_PASSWORD: '' });
    assert.equal((await login(s.base, 'admin', 'asylum')).status, 503);
    assert.equal((await fetch(`${s.base}/admin/api/me`)).status, 503);
    await s.close();
  });
});

describe('sessions expire', () => {
  test('a session past its time is refused and forgotten', () => {
    const clock = { t: 1_000 };
    const auth = createAdminAuth({ adminUser: 'a', adminPassword: 'b', sessionTtlMs: 60_000, now: () => clock.t });
    const res: { headers: Record<string, string>; statusCode: number; body: unknown } = { headers: {}, statusCode: 200, body: null };
    // Only what auth.ts calls on a response and reads from a request.
    const fakeRes: ExpressResponse = {
      set: (k: string, v: string) => ((res.headers[k] = v), fakeRes),
      status: (c: number) => ((res.statusCode = c), fakeRes),
      json: (b: unknown) => ((res.body = b), fakeRes),
    } as unknown as ExpressResponse;
    const req = (cookie = '') =>
      ({ ip: '1.1.1.1', secure: false, body: { user: 'a', password: 'b' }, get: (h: string) => (h === 'cookie' ? cookie : '') }) as unknown as ExpressRequest;
    auth.login(req(), fakeRes);
    const cookie = res.headers['Set-Cookie'].split(';')[0];
    let passed = false;
    auth.guard(req(cookie), fakeRes, () => (passed = true));
    assert.equal(passed, true);
    clock.t += 60_000;
    passed = false;
    auth.guard(req(cookie), fakeRes, () => (passed = true));
    assert.equal(passed, false);
    assert.equal(res.statusCode, 401);
    assert.equal(auth.sessions.size, 0);
  });
});
