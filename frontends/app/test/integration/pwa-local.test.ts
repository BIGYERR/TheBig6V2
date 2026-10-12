// The pwa-local server against a fixture build on disk, over real HTTP, and the build check both web paths share.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { checkPwaBuild } from '../../scripts/pwa-check.mjs';
import { createStaticServer } from '../../scripts/pwa-local.mjs';

interface Reply {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

/** Sends `path` byte for byte (fetch would normalise "/../" away before it left the client). */
function get(port: number, path: string, method = 'GET'): Promise<Reply> {
  return new Promise((resolve, reject) => {
    const req = request({ host: '127.0.0.1', port, path, method }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}

function write(root: string, files: Record<string, string>) {
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(root, path, '..'), { recursive: true });
    writeFileSync(join(root, path), text);
  }
}

describe('pwa-local server', () => {
  let dir: string;
  let server: Server;
  let port: number;

  before(async () => {
    dir = mkdtempSync(join(tmpdir(), 'pwa-local-'));
    write(dir, {
      'build/index.html': '<!doctype html><title>app</title>',
      'build/main-ABCD1234.js': 'console.log(1)',
      'build/legacy/app.js': 'function go(){}',
      'build/apple-touch-icon.png': 'png',
      'build/docs/index.html': 'docs',
      'secret.txt': 'outside the build',
    });
    server = createStaticServer(join(dir, 'build'));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    port = (server.address() as AddressInfo).port;
  });

  after(() => {
    server.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('serves the page at / as html, revalidated on every load', async () => {
    const res = await get(port, '/');
    assert.equal(res.status, 200);
    assert.equal(res.body, '<!doctype html><title>app</title>');
    assert.equal(res.headers['content-type'], 'text/html; charset=utf-8');
    assert.equal(res.headers['cache-control'], 'no-cache');
  });

  it("answers the in-app update check's probe with the page", async () => {
    const res = await get(port, '/?_ivc=1760000000000');
    assert.equal(res.status, 200);
    assert.equal(res.body, '<!doctype html><title>app</title>');
  });

  it('caches hashed bundles for good, and revalidates the legacy script whatever its query', async () => {
    const bundle = await get(port, '/main-ABCD1234.js');
    assert.equal(bundle.headers['content-type'], 'text/javascript; charset=utf-8');
    assert.equal(bundle.headers['cache-control'], 'public, max-age=31536000, immutable');
    const legacy = await get(port, '/legacy/app.js?v=239-5b26f5cf6737');
    assert.equal(legacy.status, 200);
    assert.equal(legacy.body, 'function go(){}');
    assert.equal(legacy.headers['cache-control'], 'no-cache');
    assert.equal((await get(port, '/apple-touch-icon.png')).headers['content-type'], 'image/png');
  });

  it("answers a folder with its index.html and a path with no extension with the app's", async () => {
    assert.equal((await get(port, '/docs/')).body, 'docs');
    assert.equal((await get(port, '/week/3')).body, '<!doctype html><title>app</title>');
  });

  it('404s a missing file rather than handing back the page', async () => {
    const res = await get(port, '/chunk-MISSING1.js');
    assert.equal(res.status, 404);
  });

  it('never serves a file outside the build', async () => {
    for (const path of ['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt', '/legacy/..%2f..%2fsecret.txt', '/%00']) {
      const res = await get(port, path);
      assert.notEqual(res.body, 'outside the build', path);
      assert.ok(res.status === 404 || res.status === 400, `${path} answered ${res.status}`);
    }
  });

  it('answers HEAD without a body and refuses writes', async () => {
    const head = await get(port, '/legacy/app.js', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.headers['content-length'], String('function go(){}'.length));
    assert.equal(head.body, '');
    const post = await get(port, '/', 'POST');
    assert.equal(post.status, 405);
    assert.equal(post.headers.allow, 'GET, HEAD');
  });
});

describe('checkPwaBuild', () => {
  const APP_JS = 'function go(){ return 1; }';
  const ROOT = `<!doctype html>\n<meta name="ia-version" content="7">\n<script>${APP_JS}</script>\n`;
  const sha = createHash('sha256').update(ROOT).digest('hex');
  let dir: string;

  /** A build of ROOT for base href "/", as sync-legacy and ng build would write it; `over` replaces single files. */
  function build(over: Record<string, string> = {}) {
    rmSync(dir, { recursive: true, force: true });
    write(dir, {
      'index.html': ROOT,
      'out/index.html':
        `<!-- GENERATED by scripts/sync-legacy.mjs from the page built from src/legacy/src (ia-version 7, sha256 ${sha}). Do not edit. -->\n` +
        '<base href="/">\n<meta name="ia-version" content="7">\n<script src="main-ABCD1234.js" type="module"></script>\n',
      'out/main-ABCD1234.js': `load("legacy/app.js?v=7-${sha.slice(0, 12)}")`,
      'out/legacy/app.js': APP_JS,
      ...over,
    });
    return { pageFile: join(dir, 'index.html'), out: join(dir, 'out'), name: 'out/', baseHref: '/', rerun: 'rebuild' };
  }

  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'pwa-check-'));
  });

  after(() => rmSync(dir, { recursive: true, force: true }));

  it('passes a complete build of the current index.html and returns its version', () => {
    assert.equal(checkPwaBuild(build()), '7');
  });

  it('refuses a build of other bytes of index.html', () => {
    assert.throws(() => checkPwaBuild(build({ 'index.html': ROOT.replace('return 1', 'return 2') })), /older copy of ia-version 7/);
  });

  it('passes a build of a dotted ia-version (0.239.1) and returns it as written', () => {
    const root = ROOT.replace('content="7"', 'content="0.239.1"');
    const s = createHash('sha256').update(root).digest('hex');
    const cfg = build({
      'index.html': root,
      'out/index.html':
        `<!-- GENERATED by scripts/sync-legacy.mjs from the page built from src/legacy/src (ia-version 0.239.1, sha256 ${s}). Do not edit. -->\n` +
        '<base href="/">\n<meta name="ia-version" content="0.239.1">\n<script src="main-ABCD1234.js" type="module"></script>\n',
      'out/main-ABCD1234.js': `load("legacy/app.js?v=0.239.1-${s.slice(0, 12)}")`,
    });
    assert.equal(checkPwaBuild(cfg), '0.239.1');
  });

  it('calls a relabel of the same version (7 to 0.7.0) an older copy, and refuses a root meta that is not a version', () => {
    assert.throws(() => checkPwaBuild(build({ 'index.html': ROOT.replace('content="7"', 'content="0.7.0"') })), /built from an older copy of ia-version 0\.7\.0,/);
    assert.throws(() => checkPwaBuild(build({ 'index.html': ROOT.replace('content="7"', 'content="0.239"') })), /holds "0\.239", which is not a version/);
  });

  it('refuses a build for another base href', () => {
    assert.throws(() => checkPwaBuild({ ...build(), baseHref: '/TheBig6V2/pwa/' }), /does not set <base href="\/TheBig6V2\/pwa\/">/);
  });

  it('refuses a build missing a file the page loads', () => {
    const cfg = build();
    rmSync(join(cfg.out, 'main-ABCD1234.js'));
    assert.throws(() => checkPwaBuild(cfg), /loads main-ABCD1234\.js, which is not in out\//);
  });

  it("refuses an app.js that is not the root's script", () => {
    assert.throws(() => checkPwaBuild(build({ 'out/legacy/app.js': 'function go(){}' })), /is not the page's script/);
  });
});
