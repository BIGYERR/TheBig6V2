#!/usr/bin/env node
// The pwa-pages build path: the same Angular app as the two iOS paths (scripts/ios.mjs), built for GitHub Pages
// instead of Cordova.
//
//   npm run pwa-pages          sync from ../../index.html, build into ../../pwa/, then check the result
//   npm run pwa-pages:check    exit 1 unless ../../pwa/ was built from the current ../../index.html (no build)
//
// Pages serves main as committed (branch build, path /), so ../../pwa/ goes live at
// https://bigyerr.github.io/TheBig6V2/pwa/ once it is committed and pushed. The root index.html stays the live app at
// /TheBig6V2/; nothing here touches it.
//
// No Cordova and no native plugins. Platform boots at once outside app://, and the page finds no window.iaIsland, so
// the rest stopwatch runs without the Dynamic Island. Every HTML5 and home-screen feature is the live app's own.
//
// pwa/ shares an origin with the live app, so in a Safari tab both read and write the same localStorage. That is safe
// only while pwa/ runs the same app.js as the root index.html, and that is what the check proves.
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkPwaBuild } from './pwa-check.mjs';

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = resolve(APP, '..', '..');
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

/** Proves pwa/ is a complete build of the current root index.html, served from the Pages subpath. */
function check() {
  let version;
  try {
    version = checkPwaBuild({
      rootIndex: join(REPO, 'index.html'),
      out: OUT,
      name: 'pwa/',
      baseHref: BASE_HREF,
      rerun: 'run npm run pwa-pages',
    });
  } catch (err) {
    fail(err.message);
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
