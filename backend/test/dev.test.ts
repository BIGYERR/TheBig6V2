// npm run dev. The live reload (server/dev.ts): off unless IA_DEV=1, and when on, the three pages carry the reload
// script and a POST to /__dev/reload reaches every open page and says how many. The watcher (scripts/dev-watch.ts),
// which runs in the dev container: what it hears as a save, by file events or by polling, which server lines it leaves
// out of its log, and how it builds the app from its source files. The container's own shape is
// test/dev-container.test.ts.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { buildAppFromSources, changedBetween, quiet, snapshot, watchFolder } from '../scripts/dev-watch.ts';
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

// The app's source files (frontends/app/src/legacy/src/): a save builds the page /app/ serves, with the one builder
// (frontends/app/scripts/build-index.mjs, which also builds what GitHub Pages deploys), into app-web/ only.
describe('dev watcher, the app source files', () => {
  const REPO_ROOT = resolve(process.env.APP_SOURCE_DIR || join(import.meta.dirname, '..', '..'));
  const SOURCES = join(REPO_ROOT, 'frontends', 'app', 'src', 'legacy', 'src');
  // A source file the watcher reads and must never write: the repo is read-only to it (in the container, a read-only mount).
  const WATCHED = join(SOURCES, 'order.json');
  const made: string[] = [];
  after(() => made.forEach((dir) => rmSync(dir, { recursive: true, force: true })));
  const temp = () => {
    const dir = mkdtempSync(join(tmpdir(), 'ia-dev-app-'));
    made.push(dir);
    return dir;
  };
  const stamp = () => ({ sha: createHash('sha256').update(readFileSync(WATCHED)).digest('hex'), mtime: statSync(WATCHED).mtimeMs });

  test('the live source files build into app-web/ the page the builder builds, byte for byte, and the sources are never written', async () => {
    const before = stamp();
    const out = temp();
    assert.equal(await buildAppFromSources(SOURCES, out), true);
    const { buildIndex } = (await import(join(REPO_ROOT, 'frontends', 'app', 'scripts', 'build-index.mjs'))) as { buildIndex: (srcDir: string) => Buffer };
    assert.ok(readFileSync(join(out, 'index.html')).equals(buildIndex(SOURCES)), 'the page served is the build, byte for byte');
    assert.deepEqual(stamp(), before, 'the source files are untouched');
  });

  test('a saved source file shows in the page it builds; a list naming a missing file builds nothing', async () => {
    const before = stamp();
    const src = temp();
    const out = temp();
    for (const folder of ['html', 'css', 'js']) mkdirSync(join(src, folder));
    writeFileSync(join(src, 'html', 'top.html'), '<!doctype html><meta name="ia-version" content="0.1.0"><body><script>');
    writeFileSync(join(src, 'js', 'app.js'), "var saved = 'one';\n");
    writeFileSync(join(src, 'html', 'end.html'), '</script></body>\n');
    writeFileSync(join(src, 'order.json'), JSON.stringify(['html/top.html', 'js/app.js', 'html/end.html']));
    assert.equal(await buildAppFromSources(src, out), true);
    assert.match(readFileSync(join(out, 'index.html'), 'utf8'), /var saved = 'one';/);

    writeFileSync(join(src, 'js', 'app.js'), "var saved = 'two';\n");
    assert.equal(await buildAppFromSources(src, out), true);
    assert.equal(readFileSync(join(out, 'index.html'), 'utf8'), "<!doctype html><meta name=\"ia-version\" content=\"0.1.0\"><body><script>var saved = 'two';\n</script></body>\n");

    writeFileSync(join(src, 'order.json'), JSON.stringify(['html/top.html', 'js/gone.js', 'html/end.html']));
    assert.equal(await buildAppFromSources(src, out), false);
    assert.match(readFileSync(join(out, 'index.html'), 'utf8'), /'two'/, 'a failed build leaves the last page served');
    assert.deepEqual(stamp(), before, 'the source files are untouched');
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
