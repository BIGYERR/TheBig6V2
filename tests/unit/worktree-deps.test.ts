// A chat's worktree borrows the main checkout's node_modules for the 60-second check (tools/worktree-deps.mjs; CLAUDE.md
// Pipeline), only when this branch's lockfile is the main checkout's byte for byte. Found Post-v0.259.1: a fresh worktree's
// check failed its website and backend lanes on node_modules that were never installed there. The judge is pure and the
// table below is the rule as written; the tests that follow make a real worktree in a temp folder and check the borrow,
// through linkDeps and through the command a chat runs before its first build (Post-v0.261.7).
// Found v0.261.0: the folder borrowed whole carried the main checkout's `file:` links, so a worktree's tests imported the
// main checkout's core (@ia/core); the packages are now borrowed one by one, and a `file:` package is the worktree's own.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Verdict = { use: 'own' } | { use: 'link' } | { use: 'none'; why: string };
interface Deps {
  judgeDeps(s: { rel: string; hereHas: boolean; isWorktree: boolean; mainHas: boolean; hereLock: string | null; mainLock: string | null }): Verdict;
  mainCheckout(repo: string): string | null;
  linkDeps(repo: string, rel: string): { ok: true; linked: string | null; own?: string[] } | { ok: false; why: string };
  gitFreeEnv(): NodeJS.ProcessEnv;
  LANE_DEPS: string[];
}
const TOOL = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'worktree-deps.mjs');
const D = (await import(pathToFileURL(TOOL).href)) as Deps;

const base = { rel: 'backend', hereHas: false, isWorktree: true, mainHas: true, hereLock: 'lock A', mainLock: 'lock A' };

test('a worktree borrows the main checkout\'s node_modules when its lockfile is the same', () => {
  assert.deepEqual(D.judgeDeps(base), { use: 'link' });
});

test('its own node_modules is always used first', () => {
  assert.deepEqual(D.judgeDeps({ ...base, hereHas: true, isWorktree: false, mainHas: false }), { use: 'own' });
  assert.deepEqual(D.judgeDeps({ ...base, hereHas: true, hereLock: 'lock B' }), { use: 'own' });
});

test('anything else names the npm ci to run: the main checkout, no main copy, a different or missing lockfile', () => {
  assert.deepEqual(D.judgeDeps({ ...base, isWorktree: false }), { use: 'none', why: 'backend/node_modules is missing; run npm ci in backend/' });
  assert.deepEqual(D.judgeDeps({ ...base, mainHas: false }), { use: 'none', why: 'backend/node_modules is missing here and in the main checkout; run npm ci in backend/' });
  assert.deepEqual(D.judgeDeps({ ...base, hereLock: 'lock B' }), {
    use: 'none', why: 'backend/node_modules is missing and this branch\'s backend/package-lock.json is not the main checkout\'s; run npm ci in backend/',
  });
  assert.deepEqual(D.judgeDeps({ ...base, hereLock: null }), {
    use: 'none', why: 'backend/node_modules is missing and a backend/package-lock.json is missing to compare; run npm ci in backend/',
  });
});

test('a real worktree borrows the packages one by one, and the main checkout never borrows from itself', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'ia-worktree-deps-')));
  try {
    const main = join(tmp, 'main');
    // The pre-commit hook runs this with git's GIT_* variables set (its index file); the temp repository is its own.
    const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-C', cwd, ...a], { stdio: 'pipe', env: D.gitFreeEnv() });
    mkdirSync(join(main, 'pkg'), { recursive: true });
    git(main, 'init', '-q');
    writeFileSync(join(main, 'pkg', 'package-lock.json'), '{"lockfileVersion":3}\n');
    git(main, 'add', 'pkg/package-lock.json');
    git(main, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'lock');
    mkdirSync(join(main, 'pkg', 'node_modules'));
    const wt = join(tmp, 'wt');
    git(main, 'worktree', 'add', '-q', wt);

    assert.equal(D.mainCheckout(main), null);
    assert.equal(D.mainCheckout(wt), main);
    assert.deepEqual(D.linkDeps(main, 'pkg'), { ok: true, linked: null });
    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: join(main, 'pkg', 'node_modules'), own: [] });
    assert.ok(lstatSync(join(wt, 'pkg', 'node_modules')).isDirectory(), 'a folder of its own, its packages borrowed one by one');
    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: null }, 'borrowed once, then its own');

    rmSync(join(wt, 'pkg', 'node_modules'), { recursive: true });
    writeFileSync(join(wt, 'pkg', 'package-lock.json'), '{"lockfileVersion":3,"changed":true}\n');
    const r = D.linkDeps(wt, 'pkg');
    assert.equal(r.ok, false);
    assert.equal(existsSync(join(wt, 'pkg', 'node_modules')), false, 'a different lockfile gets no link');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('run on its own, it links each folder and prints a line for it, and exits 1 naming the npm ci when a folder has none', () => {
  // Post-v0.261.7: a fresh worktree's first build failed on the app's node_modules, which only the check linked. The
  // session-start skill now runs this command before the first build.
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'ia-worktree-deps-')));
  try {
    const main = join(tmp, 'main');
    const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-C', cwd, ...a], { stdio: 'pipe', env: D.gitFreeEnv() });
    mkdirSync(join(main, 'pkg'), { recursive: true });
    git(main, 'init', '-q');
    writeFileSync(join(main, 'pkg', 'package-lock.json'), '{"lockfileVersion":3}\n');
    git(main, 'add', 'pkg/package-lock.json');
    git(main, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'lock');
    mkdirSync(join(main, 'pkg', 'node_modules', 'left-pad'), { recursive: true });
    const wt = join(tmp, 'wt');
    git(main, 'worktree', 'add', '-q', wt);
    const run = (...a: string[]) => {
      try {
        return { code: 0, out: execFileSync(process.execPath, [TOOL, '--repo', wt, ...a], { encoding: 'utf8', env: D.gitFreeEnv() }) };
      } catch (e: any) { return { code: e.status as number, out: String(e.stdout) }; }
    };
    assert.deepEqual(run('pkg'), { code: 0, out: `worktree-deps: pkg: borrowed from ${join(main, 'pkg', 'node_modules')}\n` });
    assert.ok(lstatSync(join(wt, 'pkg', 'node_modules', 'left-pad')).isSymbolicLink(), 'the package is borrowed');
    assert.deepEqual(run('pkg'), { code: 0, out: 'worktree-deps: pkg: its own\n' }, 'borrowed once, then its own');
    assert.deepEqual(run('pkg', 'nope'), {
      code: 1, out: 'worktree-deps: pkg: its own\nworktree-deps: nope: nope/node_modules is missing here and in the main checkout; run npm ci in nope/\n',
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('with no folders named, it links the three the 60-second check\'s lanes need', () => {
  assert.deepEqual(D.LANE_DEPS, ['frontends/app', 'frontends', 'backend']);
  const check = readFileSync(join(dirname(TOOL), 'check.mjs'), 'utf8');
  assert.deepEqual([...check.matchAll(/deps\('[a-z]+', '([^']+)'\)/g)].map((m) => m[1]), D.LANE_DEPS, 'the folders tools/check.mjs links, in its order');
});

test('a file: package is the worktree\'s own copy, a cache folder is its own, and a folder borrowed whole is borrowed again', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'ia-worktree-deps-')));
  try {
    const main = join(tmp, 'main');
    const git = (cwd: string, ...a: string[]) => execFileSync('git', ['-C', cwd, ...a], { stdio: 'pipe', env: D.gitFreeEnv() });
    mkdirSync(join(main, 'pkg'), { recursive: true });
    mkdirSync(join(main, 'core'));
    writeFileSync(join(main, 'core', 'version.txt'), 'main\n');
    git(main, 'init', '-q');
    writeFileSync(join(main, 'pkg', 'package-lock.json'), '{"lockfileVersion":3}\n');
    git(main, 'add', 'pkg/package-lock.json', 'core/version.txt');
    git(main, '-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'lock');
    // npm's install of "@ia/core": "file:../core" is a relative link in the scope folder; beside it a plain package, the
    // .bin folder and a cache.
    const mm = join(main, 'pkg', 'node_modules');
    mkdirSync(join(mm, '@ia'), { recursive: true });
    symlinkSync('../../../core', join(mm, '@ia', 'core'));
    mkdirSync(join(mm, 'left-pad'));
    mkdirSync(join(mm, '.bin'));
    mkdirSync(join(mm, '.vite'));
    const wt = join(tmp, 'wt');
    git(main, 'worktree', 'add', '-q', wt);
    writeFileSync(join(wt, 'core', 'version.txt'), 'worktree\n');
    const m = join(wt, 'pkg', 'node_modules');

    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: mm, own: ['@ia/core'] });
    assert.equal(readFileSync(join(m, '@ia', 'core', 'version.txt'), 'utf8'), 'worktree\n', '@ia/core is the worktree\'s core');
    assert.equal(realpathSync(join(m, 'left-pad')), join(mm, 'left-pad'));
    assert.equal(realpathSync(join(m, '.bin')), join(mm, '.bin'));
    assert.ok(!lstatSync(join(m, '.vite')).isSymbolicLink(), 'the cache is the worktree\'s own');

    // A worktree that borrowed the folder whole before v0.261.0 is borrowed again, package by package.
    rmSync(m, { recursive: true });
    symlinkSync(mm, m);
    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: mm, own: ['@ia/core'] });
    assert.ok(!lstatSync(m).isSymbolicLink() && lstatSync(m).isDirectory());
    assert.equal(readFileSync(join(m, '@ia', 'core', 'version.txt'), 'utf8'), 'worktree\n');
    assert.equal(readFileSync(join(main, 'core', 'version.txt'), 'utf8'), 'main\n', 'the main checkout is untouched');
    assert.ok(existsSync(join(mm, 'left-pad')) && existsSync(join(mm, '@ia', 'core')));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
