#!/usr/bin/env node
// The pwa-pages build path: the same Angular app as the two iOS paths (scripts/ios.mjs), built for GitHub Pages
// instead of Cordova.
//
//   npm run pwa-pages          sync from ../index.html, build into ../pwa/, then check the result
//   npm run pwa-pages:check    exit 1 unless ../pwa/ was built from the current ../index.html (no build)
//
// Pages serves main as committed (branch build, path /), so ../pwa/ goes live at
// https://bigyerr.github.io/TheBig6V2/pwa/ once it is committed and pushed. The root index.html stays the live app at
// /TheBig6V2/; nothing here touches it.
//
// No Cordova and no native plugins. Platform boots at once outside app://, and the page finds no window.iaIsland, so
// the rest stopwatch runs without the Dynamic Island. Every HTML5 and home-screen feature is the live app's own.
//
// pwa/ shares an origin with the live app, so in a Safari tab both read and write the same localStorage. That is safe
// only while pwa/ runs the same app.js as the root index.html, and that is what the check proves.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(APP, '..');
const OUT = join(REPO, 'pwa');
const BASE_HREF = '/TheBig6V2/pwa/';
const LIVE_URL = `https://bigyerr.github.io${BASE_HREF}`;

function fail(msg) {
  console.error(`\npwa-pages: ${msg}`);
  process.exit(1);
}

function run(cmd, cmdArgs) {
  const res = spawnSync(cmd, cmdArgs, { cwd: APP, stdio: 'inherit' });
  if (res.status !== 0) fail(`${cmd} ${cmdArgs.join(' ')} failed (exit ${res.status ?? res.signal})`);
}

function countOf(haystack, needle) {
  let n = 0;
  for (let i = haystack.indexOf(needle); i !== -1; i = haystack.indexOf(needle, i + 1)) n++;
  return n;
}

/** Proves pwa/ is a complete build of the current root index.html, served from the Pages subpath. */
function check() {
  const rerun = 'run npm run pwa-pages';
  const root = readFileSync(join(REPO, 'index.html'), 'utf8');
  const sha256 = createHash('sha256').update(root).digest('hex');
  const version = (root.match(/<meta name="ia-version" content="(\d+)"/) || [])[1];
  if (!version) fail('the root index.html has no <meta name="ia-version">');

  const indexPath = join(OUT, 'index.html');
  if (!existsSync(indexPath)) fail(`no build in pwa/; ${rerun}`);
  const index = readFileSync(indexPath, 'utf8');

  // sync-legacy.mjs stamps the source's version and sha256 into the page it generates.
  const banner = index.match(/from \.\.\/index\.html \(ia-version (\d+), sha256 ([0-9a-f]{64})\)/);
  if (!banner) fail(`pwa/index.html has no generated banner; ${rerun}`);
  if (banner[2] !== sha256) {
    const built = banner[1] === version ? `an older copy of ia-version ${version}` : `ia-version ${banner[1]}`;
    fail(`pwa/ was built from ${built}, but the root index.html is ia-version ${version} as it stands; ${rerun}`);
  }
  if (countOf(index, `<meta name="ia-version" content="${version}">`) !== 1) fail('pwa/index.html carries the wrong ia-version');
  if (countOf(index, `<base href="${BASE_HREF}">`) !== 1) fail(`pwa/index.html does not set <base href="${BASE_HREF}">`);

  // Every file the page loads must be in the build: a partial commit would 404 on the phone.
  const refs = [...index.matchAll(/\s(?:src|href)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => ref !== BASE_HREF && !/^[a-z]+:/.test(ref));
  for (const ref of refs) {
    if (!existsSync(join(OUT, ref.split(/[?#]/)[0]))) fail(`pwa/index.html loads ${ref}, which is not in pwa/; ${rerun}`);
  }

  // The app script is the root's inline <script>, byte for byte, and the bundle asks for this version of it.
  const appJsPath = join(OUT, 'legacy', 'app.js');
  if (!existsSync(appJsPath)) fail(`no pwa/legacy/app.js; ${rerun}`);
  if (countOf(root, `<script>${readFileSync(appJsPath, 'utf8')}</script>`) !== 1) {
    fail(`pwa/legacy/app.js is not the root index.html's script; ${rerun}`);
  }
  const scriptUrl = `legacy/app.js?v=${version}-${sha256.slice(0, 12)}`;
  const bundles = readdirSync(OUT).filter((f) => /^main-[A-Z0-9]+\.js$/.test(f));
  if (bundles.length !== 1) fail(`expected one main-*.js in pwa/, found ${bundles.length}; ${rerun}`);
  if (!readFileSync(join(OUT, bundles[0]), 'utf8').includes(scriptUrl)) {
    fail(`${bundles[0]} does not load ${scriptUrl}; ${rerun}`);
  }

  console.log(`pwa-pages: pwa/ is ia-version ${version}, built from the current index.html, for ${LIVE_URL}`);
}

if (process.argv.includes('--check')) {
  check();
} else {
  run('node', ['scripts/sync-legacy.mjs']);
  run('npx', ['ng', 'build', '--configuration', 'production,pages']);
  check();
  console.log('pwa-pages: commit pwa/ and push to serve it. It is live once Pages has built that commit.');
}
