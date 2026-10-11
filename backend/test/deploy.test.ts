// How the app reaches /app/: scripts/app-bundle.ts copies it for local runs and the docker image, and heroku.sh's
// deploy tree carries the same two files from the commit it deploys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const BACKEND = fileURLToPath(new URL('..', import.meta.url));
const BUNDLE = join(BACKEND, 'scripts', 'app-bundle.ts');

describe('app-bundle', () => {
  let dir: string;
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

  test('refreshes the folder in place, so a container that mounts it (npm run dev) still sees the app', () => {
    const folder = statSync(join(dir, 'out')).ino;
    writeFileSync(join(dir, 'out', 'leftover.txt'), 'stale');
    writeFileSync(join(dir, 'src', 'index.html'), '<meta name="ia-version" content="0.240.1">');
    assert.match(run(), /bundled app 0\.240\.1/);
    assert.equal(statSync(join(dir, 'out')).ino, folder);
    assert.deepEqual(readdirSync(join(dir, 'out')).sort(), ['apple-touch-icon.png', 'index.html']);
  });

  test('with no app to copy (Heroku), it keeps the bundle the deploy brought', () => {
    rmSync(join(dir, 'src'), { recursive: true });
    assert.match(run(), /keeping the bundled app 0\.240\.1/);
    assert.ok(existsSync(join(dir, 'out', 'index.html')));
  });
});

describe('heroku deploy tree', { skip: !existsSync(join(BACKEND, '..', '.git')) && 'not in a git checkout' }, () => {
  test('is backend/ with app-web/ holding the same commit\'s index.html and icon', () => {
    const tree = execFileSync('bash', [join(BACKEND, 'scripts', 'heroku.sh'), 'tree', 'HEAD'], { encoding: 'utf8' }).trim();
    // Without the variables git exports to hooks: with GIT_DIR set, git takes BACKEND for the top of the checkout and
    // HEAD's listing below would be the whole repo (heroku.sh unsets them for the same reason).
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
    const git = (...args: string[]) => execFileSync('git', ['-C', BACKEND, ...args], { encoding: 'utf8', env }).trim();
    const files = git('ls-tree', '--full-tree', '-r', '--name-only', tree).split('\n');
    for (const f of ['package.json', 'Procfile', 'app-web/index.html', 'app-web/apple-touch-icon.png']) assert.ok(files.includes(f), f);
    // Every file backend/ holds at HEAD, and only those plus the app. Read off HEAD, never named here: in a pre-commit
    // check HEAD is the parent commit, so a file the commit adds is not in it yet.
    const committed = git('ls-tree', '-r', '--name-only', 'HEAD').split('\n').filter((f) => !f.startsWith('app-web/'));
    assert.deepEqual([...files].sort(), [...committed, 'app-web/apple-touch-icon.png', 'app-web/index.html'].sort());
    assert.ok(!files.some((f) => f.startsWith('backend/')), 'backend/ is the root, not a folder in it');
    assert.equal(git('rev-parse', `${tree}:app-web/index.html`), git('rev-parse', 'HEAD:index.html'));
  });
});

// Heroku gets the TypeScript and compiles it itself: its Node buildpack runs `npm run build` with the dev dependencies
// installed, then the Procfile starts what tsc wrote. The Dockerfile does the same in its build stage. So the build
// must compile the server, and every start command must name the file tsc emits for server/server.ts.
describe('compiled server', () => {
  const read = (file: string) => readFileSync(join(BACKEND, file), 'utf8');
  const tsconfig = JSON.parse(read('tsconfig.server.json').replace(/\/\*[\s\S]*?\*\//g, ''));
  const entry = join(tsconfig.compilerOptions.outDir, 'server.js');

  test('tsc emits server/ into dist/server/', () => {
    assert.equal(tsconfig.compilerOptions.rootDir, 'server');
    assert.equal(entry, 'dist/server/server.js');
  });

  test('npm run build compiles it, and every start command runs what it compiled', () => {
    const pkg = JSON.parse(read('package.json'));
    assert.match(pkg.scripts.build, /npm run build:server/);
    assert.match(pkg.scripts['build:server'], /tsc -p tsconfig\.server\.json$/);
    assert.equal(pkg.main, entry);
    assert.ok(pkg.scripts.start.endsWith(` ${entry}`), pkg.scripts.start);
    assert.equal(read('Procfile'), `web: node --enable-source-maps ${entry}\n`);
    const docker = read('Dockerfile');
    assert.ok(docker.includes('RUN npm run build:server && npm run build:ui'), 'the image compiles the server');
    assert.ok(docker.includes(`CMD ["node", "--enable-source-maps", "${entry}"]`), 'the image runs it');
    assert.ok(read('scripts/mac-local-backend.sh').includes(`nohup node --enable-source-maps ${entry} `), 'the Mac runner runs it');
  });
});
