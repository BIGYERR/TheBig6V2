// How the app reaches /app/: scripts/app-bundle.ts builds it from the source files (or copies a ready page) for local
// runs and the docker image, and heroku.sh's deploy tree carries the page built from the commit it deploys, with its icon.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
  test("keeps the repo's layout: backend/ with the app in app-web/, frontends/ without the app, the root's manifest at the root", () => {
    // Without the variables git exports to hooks: with GIT_DIR set, git takes BACKEND for the top of the checkout
    // (heroku.sh unsets them for the same reason).
    const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));
    const git = (...args: string[]) => execFileSync('git', ['-C', BACKEND, ...args], { encoding: 'utf8', env }).trim();
    // The index, not HEAD: in a pre-commit check HEAD is the parent commit, and the tree must be what is committed.
    // During a commit git holds the index's lock and names the index being committed in GIT_INDEX_FILE (relative to
    // the top of the checkout), so the tree is written from a copy of that index, never from the live one.
    const top = git('rev-parse', '--show-toplevel');
    const live = process.env.GIT_INDEX_FILE ? resolve(top, process.env.GIT_INDEX_FILE) : join(git('rev-parse', '--absolute-git-dir'), 'index');
    const scratch = mkdtempSync(join(tmpdir(), 'ia-deploy-tree-'));
    copyFileSync(live, join(scratch, 'index'));
    const ref = execFileSync('git', ['-C', BACKEND, 'write-tree'], { encoding: 'utf8', env: { ...env, GIT_INDEX_FILE: join(scratch, 'index') } }).trim();
    rmSync(scratch, { recursive: true, force: true });
    const tree = execFileSync('bash', [join(BACKEND, 'scripts', 'heroku.sh'), 'tree', ref], { encoding: 'utf8' }).trim();
    const list = (t: string) => git('ls-tree', '--full-tree', '-r', '--name-only', t).split('\n');
    const source = list(ref);
    const files = list(tree);
    const expected = [
      'package.json',
      'package-lock.json',
      'Procfile',
      ...source.filter((f) => f.startsWith('backend/') && !f.startsWith('backend/app-web/')),
      'backend/app-web/apple-touch-icon.png',
      'backend/app-web/index.html',
      ...source.filter((f) => f.startsWith('frontends/') && !f.startsWith('frontends/app/')),
    ];
    assert.deepEqual([...files].sort(), expected.sort());
    for (const f of ['package.json', 'package-lock.json', 'Procfile']) {
      assert.equal(git('rev-parse', `${tree}:${f}`), git('rev-parse', `${ref}:${f}`), `${f} is the root's`);
    }
    // The page is the build of the ref's source files. While the repo still carries its committed copy at the root (until
    // the Pages source switch, handoff §12) that copy is the oracle, since the 60-second check holds the two equal; after,
    // the test builds the ref's sources itself, from an archive of them, with the ref's own builder.
    const page = (() => {
      try {
        return git('rev-parse', '--verify', `${ref}:index.html`);
      } catch {
        const out = realpathSync(mkdtempSync(join(tmpdir(), 'ia-deploy-page-')));   // the real path, as Linux CI has it
        // The engine's files are TypeScript in core/src/engine from architecture phase D on, built into the same page.
        const core = (() => { try { git('cat-file', '-e', `${ref}:core/src`); return ' core/src'; } catch { return ''; } })();
        execFileSync('sh', ['-c', `git -C "${top}" archive ${ref} frontends/app/scripts/build-index.mjs frontends/app/src/legacy/src${core} | tar -x -C "${out}"`], { env });
        // The builder's path in the environment, as heroku.sh passes it: as argv[1] it would run its own command line.
        const built = execFileSync(process.execPath, ['--input-type=module', '-e', 'process.stdout.write((await import(process.env.IA_BUILD_INDEX)).buildIndex())'], { env: { ...env, IA_BUILD_INDEX: join(out, 'frontends/app/scripts/build-index.mjs') } });
        rmSync(out, { recursive: true, force: true });
        return execFileSync('git', ['-C', BACKEND, 'hash-object', '--stdin'], { input: built, encoding: 'utf8', env }).trim();
      }
    })();
    assert.equal(git('rev-parse', `${tree}:backend/app-web/index.html`), page);
    for (const ui of ['website', 'admin', 'common']) assert.ok(files.some((f) => f.startsWith(`frontends/${ui}/`)), `frontends/${ui}/ ships`);
  });
});

// Heroku gets the TypeScript and compiles it itself: its Node buildpack runs the root `npm run build` (the repo root's
// package.json, which Heroku's GitHub deploy of main finds there, and heroku.sh deploy puts at the root of its tree),
// which builds the frontends, then this folder (the app's page, then the server), with the dev dependencies installed;
// then the root's Procfile starts what tsc wrote. The Dockerfile does the same in its build stages. So the build must
// compile the server, and every start command must name the file tsc emits for server/server.ts.
describe('compiled server', () => {
  const read = (file: string) => readFileSync(join(BACKEND, file), 'utf8');
  const readRoot = (file: string) => readFileSync(join(BACKEND, '..', file), 'utf8');
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
    assert.match(pkg.scripts.build, /^node scripts\/app-bundle\.ts && /, "the backend's build builds the app's page first");
    const heroku = JSON.parse(readRoot('package.json'));
    assert.match(heroku.scripts.build, /npm run build --prefix frontends && .*npm run build --prefix backend/, 'Heroku builds the frontends, then the server');
    assert.equal(heroku.scripts.start, `cd backend && node --enable-source-maps ${entry}`);
    assert.equal(readRoot('Procfile'), `web: cd backend && node --enable-source-maps ${entry}\n`);
    assert.equal(heroku.engines.node, pkg.engines.node, 'Heroku picks the Node line from the root manifest');
    const docker = read('Dockerfile');
    assert.ok(docker.includes('RUN npm run build:server'), 'the image compiles the server');
    assert.ok(docker.includes('COPY --from=frontends /srv/frontends/dist /srv/frontends/dist'), 'the image carries the frontends build');
    assert.ok(docker.includes(`CMD ["node", "--enable-source-maps", "${entry}"]`), 'the image runs it');
    assert.ok(read('scripts/mac-local-backend.sh').includes(`nohup node --enable-source-maps ${entry} `), 'the Mac runner runs it');
  });
});
