// /healthz is the contract the deploy proof reads: it says which commit is live, and it is never cached.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server/app.ts';
import { loadConfig } from '../server/config.ts';

describe('/healthz', () => {
  const server = createApp(loadConfig({ DYNO: 'web.1', HEROKU_APP_NAME: 'kit-test', HEROKU_SLUG_COMMIT: 'abc123', HEROKU_RELEASE_VERSION: 'v7' }));
  let base = '';
  before(async () => {
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => new Promise<void>((done) => server.close(() => done())));

  test('says which commit and release are live, and that it runs on Heroku', async () => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.status, 200);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.ok, true);
    assert.equal(body.backend, 'heroku');
    assert.equal(body.name, 'kit-test');
    assert.equal(body.commit, 'abc123');
    assert.equal(body.release, 'v7');
  });

  test('is never cached, so a read-back after a deploy cannot lie', async () => {
    const res = await fetch(`${base}/healthz`);
    assert.equal(res.headers.get('cache-control'), 'no-store');
  });

  test("reports backend/package.json's version, the release", async () => {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
    const body = (await (await fetch(`${base}/healthz`)).json()) as Record<string, unknown>;
    assert.equal(body.version, pkg.version);
  });

  test('an unknown path is a 404', async () => {
    assert.equal((await fetch(`${base}/no-such-page`)).status, 404);
  });
});
