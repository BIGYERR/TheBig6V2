// client/ia-link.js, run as the app runs it (a classic script in a page) against a real server: after a beat it
// knows which backend it reached, and says so in iaLinkStatus() and iaLinkSummary(); with the server gone it says
// that too. This is what the app's debug section and bug report will show.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { after, before, describe, test } from 'node:test';
import vm from 'node:vm';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { DeviceStore } from '../server/store.js';

const SNIPPET = readFileSync(new URL('../client/ia-link.js', import.meta.url), 'utf8');

function page(url) {
  const storage = new Map();
  const ctx = {
    IA_BACKEND_URL: url,
    IA_VERSION: '239',
    navigator: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X)', maxTouchPoints: 5, sendBeacon: () => true },
    document: { visibilityState: 'visible', addEventListener() {}, getElementById: () => null },
    localStorage: { getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, String(v)) },
    screen: { width: 393, height: 852 },
    fetch,
    AbortController,
    URL,
    performance,
    setTimeout: () => 0, // no timers: the test drives each beat itself
    clearTimeout() {},
    console,
  };
  // As in a browser, window is the global object.
  ctx.window = ctx;
  ctx.addEventListener = () => {};
  ctx.matchMedia = () => ({ matches: false });
  vm.createContext(ctx);
  vm.runInContext(SNIPPET, ctx);
  return ctx;
}

describe('ia-link status', () => {
  let server;
  let base;
  before(async () => {
    const config = loadConfig({ NODE_ENV: 'production', IA_BACKEND_KIND: 'mac-local', IA_BACKEND_NAME: 'studio', GIT_COMMIT: 'abcdef1234' });
    server = createApp({ config, store: new DeviceStore(config), adminDir: '/nonexistent', siteDir: '/nonexistent' }).listen(0);
    await new Promise((resolve) => server.once('listening', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  });
  after(() => new Promise((resolve) => server.close(resolve)));

  test('before a beat it guesses the kind from the URL', () => {
    const p = page(base);
    const s = vm.runInContext('iaLinkStatus()', p);
    assert.equal(s.connected, null);
    assert.equal(s.kind, 'local');
    assert.equal(s.kindFrom, 'url');
    assert.equal(vm.runInContext('iaLinkGuessKind("https://iron-asylum-api-1a2b.herokuapp.com")', p), 'heroku');
    assert.match(vm.runInContext('iaLinkSummary()', p), /^Connecting to local backend at http:\/\/127\.0\.0\.1:\d+$/);
  });

  test('after a beat it knows exactly which backend answered', async () => {
    const p = page(base);
    await vm.runInContext('iaLinkBeat()', p);
    const s = vm.runInContext('iaLinkStatus()', p);
    assert.equal(s.connected, true);
    assert.deepEqual([s.kind, s.kindFrom, s.name, s.serverVersion, s.serverCommit], ['mac-local', 'server', 'studio', '0.1.0', 'abcdef1234']);
    assert.equal(s.appVersion, '239');
    assert.ok(s.uid.length === 36 && s.lastOkAt > 0 && s.beats === 1);
    assert.match(vm.runInContext('iaLinkSummary()', p), /^Connected to mac-local backend "studio" v0\.1\.0 \(abcdef1\) at http:\/\/127\.0\.0\.1:\d+, \d+ ms$/);
  });

  test('with nothing listening it says not connected, and why', async () => {
    const p = page('http://127.0.0.1:9');
    await vm.runInContext('iaLinkBeat()', p);
    const s = vm.runInContext('iaLinkStatus()', p);
    assert.equal(s.connected, false);
    assert.ok(s.fails === 1 && s.lastError);
    assert.match(vm.runInContext('iaLinkSummary()', p), /^Not connected to local backend at http:\/\/127\.0\.0\.1:9 \(last good beat never, /);
  });

  test('with no backend URL in the build it says the link is off', () => {
    const p = page('');
    assert.equal(vm.runInContext('iaLinkSummary()', p), 'Backend link off (no backend URL in this build)');
  });
});
