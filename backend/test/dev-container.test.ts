// The dev container's shape (docker-compose.dev.yml, Dockerfile.dev), read from the files: it rebuilds by itself, comes
// back with Docker, writes only its three build folders, never loads the Mac's node_modules, and leaves the production
// image alone. Read from the checkout, so it runs in npm test and CI, not in the container's own fast set.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const code = (text: string) => text.replace(/^\s*#.*$/gm, '');

const BASE = code(read('docker-compose.yml'));
const DEV = code(read('docker-compose.dev.yml'));
const DEV_IMAGE = code(read('Dockerfile.dev'));
const PROD_IMAGE = code(read('Dockerfile'));

/** The dev service's volumes as [source, target, mode], from the list under `volumes:` in the service. */
const mounts = [...DEV.matchAll(/^\s+- (\S+?):(\/\S+?)(?::(ro|rw))?\s*$/gm)].map(([, source, target, mode]) => ({ source, target, mode: mode ?? 'rw' }));

test('the dev overlay builds the dev image and runs its watcher, under init, in dev mode', () => {
  assert.match(DEV, /dockerfile: backend\/Dockerfile\.dev/);
  assert.match(DEV, /init: true/);
  assert.match(DEV, /IA_DEV: "1"/);
  assert.match(DEV, /APP_SOURCE_DIR: \/repo\b/);
  assert.match(DEV_IMAGE, /^CMD \["node", "scripts\/dev-watch\.ts"\]$/m);
  assert.match(DEV_IMAGE, /^HEALTHCHECK /m);
  // A dev image of its own name, so docker:up's production image and this one never take each other's tag.
  assert.match(DEV, /image: \$\{COMPOSE_PROJECT_NAME\}-api-dev/);
});

test('it comes back whenever Docker starts', () => {
  assert.match(BASE, /restart: unless-stopped/);
  assert.doesNotMatch(DEV, /restart:/);
});

test('every source is mounted read-only; it writes only its three build folders', () => {
  const writable = mounts.filter((m) => m.mode === 'rw' && m.source.startsWith('.')).map((m) => m.source);
  assert.deepEqual(writable.sort(), ['../frontends/dist', './app-web', './dist']);
  const readOnly = mounts.filter((m) => m.mode === 'ro').map((m) => `${m.source}:${m.target}`);
  for (const folder of ['server', 'client', 'scripts', 'test']) assert.ok(readOnly.includes(`./${folder}:/srv/backend/${folder}`), `./${folder} read-only`);
  for (const folder of ['website', 'admin', 'common']) assert.ok(readOnly.includes(`../frontends/${folder}:/srv/frontends/${folder}`), `frontends/${folder} read-only`);
  assert.ok(readOnly.includes('..:/repo'), 'the repo root read-only, for index.html and its icon');
});

test("the app's source files and their build script reach the watcher through the read-only repo mount", () => {
  const WATCH = read('scripts/dev-watch.ts');
  assert.ok(mounts.some((m) => m.source === '..' && m.target === '/repo' && m.mode === 'ro'), 'the repo root read-only');
  assert.ok(!mounts.some((m) => m.target.startsWith('/repo/')), 'nothing under the repo is mounted writable over it');
  // Under the repo root (APP_SOURCE_DIR=/repo): frontends/app/src/legacy/src/ and frontends/app/scripts/build-index.mjs.
  assert.match(WATCH, /const APP_SOURCES = join\(REPO, 'frontends', 'app', 'src', 'legacy', 'src'\);/);
  assert.match(WATCH, /const BUILD_INDEX = join\(REPO, 'frontends', 'app', 'scripts', 'build-index\.mjs'\);/);
  assert.match(WATCH, /watchFolder\(APP_SOURCES, /);
});

test("never the Mac's node_modules: the image installs its own", () => {
  assert.ok(!mounts.some((m) => /node_modules/.test(m.source) || /node_modules/.test(m.target)));
  for (const whole of ['/srv/backend', '/srv/frontends']) assert.ok(!mounts.some((m) => m.target === whole), `${whole} whole would bring the Mac node_modules with it`);
  assert.equal(DEV_IMAGE.match(/^RUN npm ci\b/gm)?.length, 2, 'the backend and the frontends workspace each install their own');
});

test('the production image is untouched: the compiled server, no watcher, no dev mode', () => {
  assert.match(PROD_IMAGE, /^CMD \["node", "--enable-source-maps", "dist\/server\/server\.js"\]$/m);
  assert.doesNotMatch(PROD_IMAGE, /dev-watch|IA_DEV/);
  assert.doesNotMatch(BASE, /IA_DEV|Dockerfile\.dev|dev-watch/);
});
