// How the app reaches /app/: scripts/app-bundle.mjs copies it for local runs and the docker image, and heroku.sh's
// deploy tree carries the same two files from the commit it deploys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const BACKEND = fileURLToPath(new URL('..', import.meta.url));
const BUNDLE = join(BACKEND, 'scripts', 'app-bundle.mjs');

describe('app-bundle', () => {
  let dir;
  before(() => {
    dir = mkdtempSync(join(tmpdir(), 'ia-bundle-'));
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'src', 'index.html'), '<meta name="ia-version" content="0.240.0">');
    writeFileSync(join(dir, 'src', 'apple-touch-icon.png'), 'png');
  });
  after(() => rmSync(dir, { recursive: true, force: true }));
  const run = () => execFileSync(process.execPath, [BUNDLE], { env: { ...process.env, APP_SOURCE_DIR: join(dir, 'src'), APP_BUNDLE_DIR: join(dir, 'out') }, encoding: 'utf8' });

  test('copies the app and its icon, and names the version it copied', () => {
    assert.match(run(), /bundled app 0\.240\.0/);
    assert.equal(readFileSync(join(dir, 'out', 'index.html'), 'utf8'), '<meta name="ia-version" content="0.240.0">');
    assert.ok(existsSync(join(dir, 'out', 'apple-touch-icon.png')));
  });

  test('with no app to copy (Heroku), it keeps the bundle the deploy brought', () => {
    rmSync(join(dir, 'src'), { recursive: true });
    assert.match(run(), /keeping the bundled app 0\.240\.0/);
    assert.ok(existsSync(join(dir, 'out', 'index.html')));
  });
});

describe('heroku deploy tree', { skip: !existsSync(join(BACKEND, '..', '.git')) && 'not in a git checkout' }, () => {
  test('is backend/ with app-web/ holding the same commit\'s index.html and icon', () => {
    const tree = execFileSync('bash', [join(BACKEND, 'scripts', 'heroku.sh'), 'tree', 'HEAD'], { encoding: 'utf8' }).trim();
    const git = (...args) => execFileSync('git', ['-C', BACKEND, ...args], { encoding: 'utf8' }).trim();
    const files = git('ls-tree', '--full-tree', '-r', '--name-only', tree).split('\n');
    for (const f of ['package.json', 'Procfile', 'server/server.js', 'app-web/index.html', 'app-web/apple-touch-icon.png']) assert.ok(files.includes(f), f);
    assert.ok(!files.some((f) => f.startsWith('backend/')), 'backend/ is the root, not a folder in it');
    assert.equal(git('rev-parse', `${tree}:app-web/index.html`), git('rev-parse', 'HEAD:index.html'));
  });
});
