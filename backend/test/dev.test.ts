// npm run dev. The live reload (server/dev.ts): off unless IA_DEV=1, and when on, the three pages carry the reload
// script and a POST to /__dev/reload reaches every open page and says how many. The watcher (scripts/dev-watch.ts),
// which runs in the dev container: what it hears as a save, by file events or by polling, and which server lines it
// leaves out of its log. The container's own shape is test/dev-container.test.ts.
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { changedBetween, quiet, snapshot, watchFolder } from '../scripts/dev-watch.ts';
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

  test('on with IA_DEV=1: pages carry the script, and a reload reaches an open page and counts it', async () => {
    const s = await boot({ IA_DEV: '1' }, dir);
    const ctrl = new AbortController();
    try {
      const page = await (await fetch(`${s.base}/`)).text();
      assert.match(page, /<p>page<\/p><script src="\/__dev\/reload\.js"><\/script><\/body>/);
      assert.match(await (await fetch(`${s.base}/app/`)).text(), /__dev\/reload\.js/);
      assert.match(await (await fetch(`${s.base}/__dev/reload.js`)).text(), /EventSource\('\/__dev\/events'\)/);

      const events = await fetch(`${s.base}/__dev/events`, { signal: ctrl.signal });
      const reader = events.body!.getReader();
      const read = async () => new TextDecoder().decode((await reader.read()).value);
      assert.match(await read(), /^retry: 500\nevent: hello\ndata: [0-9a-f-]{36}\n\n/);
      const reload = await fetch(`${s.base}/__dev/reload`, { method: 'POST' });
      assert.equal(reload.status, 200);
      assert.deepEqual(await reload.json(), { ok: true, pages: 1 });
      assert.match(await read(), /^event: reload\n/);
    } finally {
      // An open event stream holds the server, and with it the test run, open.
      ctrl.abort();
      await s.close();
    }
  });
});

describe('dev watcher', () => {
  let dir: string;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'ia-watch-'));
    mkdirSync(join(dir, 'deep'));
    writeFileSync(join(dir, 'index.html'), 'one');
    writeFileSync(join(dir, 'other.txt'), 'x');
    writeFileSync(join(dir, 'deep', 'a.ts'), 'a');
  });
  after(() => rmSync(dir, { recursive: true, force: true }));

  test('leaves the health probe and the reload traffic out of the log, never a real request', () => {
    assert.ok(quiet('request GET /healthz 200 1 ms 127.0.0.1 no-user-agent'));
    assert.ok(quiet('request GET /__dev/events 200 5 ms 192.168.65.1 Mac'));
    assert.ok(quiet('request POST /__dev/reload 200 1 ms 127.0.0.1 no-user-agent'));
    assert.ok(!quiet('request GET /app/ 200 3 ms 192.168.65.1 Mac'));
    assert.ok(!quiet('request POST /api/heartbeat 200 2 ms 192.168.1.20 iPhone'));
    assert.ok(!quiet('iron-asylum-backend 0.1.0 listening on :3000'));
  });

  test('a poll sees a file changed, added or removed, deep or not, and only the files it is told to keep', () => {
    const all = snapshot(dir);
    assert.deepEqual([...all.keys()].sort(), ['deep/a.ts', 'index.html', 'other.txt']);
    assert.deepEqual([...snapshot(dir, { recursive: false, only: (f) => f === 'index.html' }).keys()], ['index.html']);

    writeFileSync(join(dir, 'index.html'), 'two!');
    writeFileSync(join(dir, 'deep', 'b.ts'), 'b');
    rmSync(join(dir, 'other.txt'));
    assert.deepEqual(changedBetween(all, snapshot(dir)).sort(), ['deep/b.ts', 'index.html', 'other.txt']);
    assert.deepEqual(changedBetween(all, all), []);
  });

});

// The two ways it hears a save, side by side, each in a folder of its own.
describe('dev watcher, file events and polling', { concurrency: true }, () => {
  for (const [how, pollMs] of [['file events', 0], ['polling', 40]] as const) {
    test(`by ${how}: hears a save once per burst, never an attribute change, only the files it is told to keep`, async () => {
      const dir = mkdtempSync(join(tmpdir(), 'ia-watch-'));
      writeFileSync(join(dir, 'index.html'), 'one');
      const batches: string[][] = [];
      let heard = () => {};
      const stop = watchFolder(dir, { recursive: false, only: (f) => f === 'index.html', pollMs }, async (files) => {
        batches.push(files);
        heard();
      });
      const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let limit: NodeJS.Timeout | undefined;
      try {
        await pause(60);
        // What iCloud does to a saved file some seconds on: its attributes move, its time and size do not.
        chmodSync(join(dir, 'index.html'), 0o600);
        chmodSync(join(dir, 'index.html'), 0o644);
        writeFileSync(join(dir, 'ignored.txt'), 'not watched');
        await pause(250);
        assert.deepEqual(batches, [], 'an attribute change or an unwatched file is not a save');

        // A save, moving the clock on as an editor's would (a poll compares time and size).
        const saved = new Promise<void>((resolve, reject) => {
          heard = resolve;
          limit = setTimeout(() => reject(new Error(`no save heard by ${how}`)), 3_000);
        });
        writeFileSync(join(dir, 'index.html'), `saved by ${how}`);
        const later = new Date(Date.now() + 5_000);
        utimesSync(join(dir, 'index.html'), later, later);
        await saved;
        await pause(200);
        assert.equal(batches.length, 1, 'one burst, one call');
        assert.deepEqual([...new Set(batches[0])], ['index.html']);
      } finally {
        clearTimeout(limit);
        stop();
        rmSync(dir, { recursive: true, force: true });
      }
    });
  }
});
