// The website at `/` (server/app.js): served from a built dist/site, a 503 when it is not built, a 404 page for
// browsers and JSON for everything else, and a Staff Login that leads to the admin login on the same server.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../server/app.js';
import { loadConfig } from '../server/config.js';
import { DeviceStore } from '../server/store.js';

async function boot(siteDir) {
  const config = loadConfig({ NODE_ENV: 'production', ADMIN_USER: 'admin', ADMIN_PASSWORD: 'secret' });
  const server = createApp({ config, store: new DeviceStore(config), adminDir: '/nonexistent', siteDir }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  return { base: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((resolve) => server.close(resolve)) };
}

const HTML = { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' };

describe('website, built', () => {
  let dir;
  let s;
  before(async () => {
    // A dot folder on the way in, as backend/ has inside a .claude/worktrees checkout: sendFile with an absolute
    // path refuses any dot segment, so the 404 page must be sent relative to its root.
    dir = join(mkdtempSync(join(tmpdir(), 'ia-site-')), '.checkout', 'dist');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), '<!doctype html><title>site</title><ia-site></ia-site>');
    writeFileSync(join(dir, '404.html'), '<!doctype html><title>Not found</title><h1>Wrong turn.</h1>');
    writeFileSync(join(dir, 'main-ABCD1234.js'), 'console.log(1)');
    writeFileSync(join(dir, 'robots.txt'), 'User-agent: *');
    s = await boot(dir);
  });
  after(async () => {
    await s.close();
    rmSync(join(dir, '..', '..'), { recursive: true, force: true });
  });

  test('/ serves the site, revalidated on every load', async () => {
    const r = await fetch(`${s.base}/`, { headers: HTML });
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type'), /text\/html/);
    assert.equal(r.headers.get('cache-control'), 'no-cache');
    assert.match(await r.text(), /<ia-site>/);
  });

  test('hashed bundles cache for a year; other files for an hour', async () => {
    const js = await fetch(`${s.base}/main-ABCD1234.js`);
    assert.equal(js.status, 200);
    assert.equal(js.headers.get('cache-control'), 'public, max-age=31536000, immutable');
    const robots = await fetch(`${s.base}/robots.txt`);
    assert.equal(robots.headers.get('cache-control'), 'public, max-age=3600');
  });

  test('a missing page is the 404 page for a browser and JSON for anything else', async () => {
    const page = await fetch(`${s.base}/no-such-page`, { headers: HTML });
    assert.equal(page.status, 404);
    assert.match(await page.text(), /Wrong turn/);
    const json = await fetch(`${s.base}/no-such-page`);
    assert.equal(json.status, 404);
    assert.deepEqual(await json.json(), { ok: false, error: 'not found' });
    const api = await fetch(`${s.base}/api/nope`, { headers: HTML });
    assert.equal(api.status, 404);
    assert.equal((await api.json()).ok, false, 'the API keeps its JSON 404 even for a browser');
  });

  test('the API and health check still answer beside the site', async () => {
    assert.equal((await fetch(`${s.base}/healthz`)).status, 200);
    const beat = await fetch(`${s.base}/api/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' });
    assert.equal((await beat.json()).ok, true);
  });

  test('Staff Login goes to /admin/, which asks for the admin login', async () => {
    const r = await fetch(`${s.base}/admin/`, { headers: HTML });
    assert.equal(r.status, 401);
    assert.match(r.headers.get('www-authenticate'), /^Basic /);
  });
});

describe('website, not built', () => {
  test('/ says so instead of redirecting', async () => {
    const s = await boot('/nonexistent');
    const r = await fetch(`${s.base}/`, { redirect: 'manual' });
    assert.equal(r.status, 503);
    assert.match(await r.text(), /npm run build/);
    const missing = await fetch(`${s.base}/no-such-page`, { headers: HTML });
    assert.equal(missing.status, 404);
    assert.equal((await missing.json()).ok, false, 'no 404 page without a build, so JSON');
    await s.close();
  });
});

describe('website source', () => {
  const template = readFileSync(new URL('../site/site.html', import.meta.url), 'utf8');

  test('the footer carries a Staff Login link to the admin', () => {
    assert.match(template, /<a class="staff" href="\/admin\/"[^>]*>[\s\S]*?Staff Login<\/a>/);
  });

  test('copy rule: no dash used as punctuation in what the reader sees', () => {
    // Prescriptions (4×5 — RPE 8) are exempt and live in phone.ts, not here. Comments are stripped first.
    const text = template.replace(/<!--[\s\S]*?-->/g, '');
    assert.doesNotMatch(text, / [—–-] /);
    for (const file of ['site.ts']) {
      const src = readFileSync(new URL(`../site/${file}`, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
      const strings = src.match(/'[^'\n]*'/g) ?? [];
      assert.deepEqual(strings.filter((str) => /[—–]| - /.test(str)), [], `${file} has a dash in a string`);
    }
  });
});
