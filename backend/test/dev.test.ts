// The live reload behind npm run dev (server/dev.ts): off unless IA_DEV=1, and when on, the three pages carry the
// reload script and a POST to /__dev/reload reaches every open page.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server/app.ts';
import { loadConfig } from '../server/config.ts';
import { DeviceStore } from '../server/store.ts';

async function boot(env: Record<string, string>, siteDir: string) {
  const config = loadConfig({ NODE_ENV: 'production', ...env });
  const server = createApp({ config, store: new DeviceStore(config), adminDir: '/nonexistent', siteDir, appDir: siteDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, close: () => (server.closeAllConnections(), new Promise((r) => server.close(r))) };
}

describe('dev live reload', () => {
  let dir: string;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'ia-dev-'));
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>x</title><body><p>page</p></body>');
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test('off by default: no script tag, no dev routes', async () => {
    assert.equal(loadConfig({}).dev, false);
    const s = await boot({}, dir);
    assert.doesNotMatch(await (await fetch(`${s.base}/`)).text(), /__dev/);
    assert.equal((await fetch(`${s.base}/__dev/reload`, { method: 'POST' })).status, 404);
    assert.equal((await fetch(`${s.base}/__dev/reload.js`)).status, 404);
    await s.close();
  });

  test('on with IA_DEV=1: pages carry the script, and a reload reaches an open page', async () => {
    const s = await boot({ IA_DEV: '1' }, dir);
    const page = await (await fetch(`${s.base}/`)).text();
    assert.match(page, /<p>page<\/p><script src="\/__dev\/reload\.js"><\/script><\/body>/);
    assert.match(await (await fetch(`${s.base}/app/`)).text(), /__dev\/reload\.js/);
    assert.match(await (await fetch(`${s.base}/__dev/reload.js`)).text(), /EventSource\('\/__dev\/events'\)/);

    const ctrl = new AbortController();
    const events = await fetch(`${s.base}/__dev/events`, { signal: ctrl.signal });
    const reader = events.body!.getReader();
    const read = async () => new TextDecoder().decode((await reader.read()).value);
    assert.match(await read(), /^event: hello\ndata: [0-9a-f-]{36}\n\n/);
    assert.equal((await fetch(`${s.base}/__dev/reload`, { method: 'POST' })).status, 204);
    assert.match(await read(), /^event: reload\n/);
    ctrl.abort();
    await s.close();
  });
});
