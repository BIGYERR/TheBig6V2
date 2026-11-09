// A chat's worktree borrows the main checkout's node_modules for the 60-second check (tools/worktree-deps.mjs; CLAUDE.md
// Pipeline), only when this branch's lockfile is the main checkout's byte for byte. Found Post-v0.259.1: a fresh worktree's
// check failed its website and backend lanes on node_modules that were never installed there. The judge is pure and the
// table below is the rule as written; the last test makes a real worktree in a temp folder and checks the link.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Verdict = { use: 'own' } | { use: 'link' } | { use: 'none'; why: string };
interface Deps {
  judgeDeps(s: { rel: string; hereHas: boolean; isWorktree: boolean; mainHas: boolean; hereLock: string | null; mainLock: string | null }): Verdict;
  mainCheckout(repo: string): string | null;
  linkDeps(repo: string, rel: string): { ok: true; linked: string | null } | { ok: false; why: string };
  gitFreeEnv(): NodeJS.ProcessEnv;
}
const D = (await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'worktree-deps.mjs')).href)) as Deps;

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

test('a real worktree gets the link, and the main checkout is never linked into itself', () => {
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
    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: join(main, 'pkg', 'node_modules') });
    assert.ok(lstatSync(join(wt, 'pkg', 'node_modules')).isSymbolicLink());
    assert.deepEqual(D.linkDeps(wt, 'pkg'), { ok: true, linked: null }, 'linked once, then its own');

    rmSync(join(wt, 'pkg', 'node_modules'));
    writeFileSync(join(wt, 'pkg', 'package-lock.json'), '{"lockfileVersion":3,"changed":true}\n');
    const r = D.linkDeps(wt, 'pkg');
    assert.equal(r.ok, false);
    assert.equal(existsSync(join(wt, 'pkg', 'node_modules')), false, 'a different lockfile gets no link');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
