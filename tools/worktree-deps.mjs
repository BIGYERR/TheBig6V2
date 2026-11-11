// A chat's worktree and its packages' node_modules (CLAUDE.md, Pipeline: the 60-second check). A worktree is checked out
// without them, and an `npm ci` of the app, the website or the backend takes longer than the check's 60 s. So the check
// borrows the main checkout's folder through a link, but only when this branch's lockfile is the main checkout's byte for
// byte: then the packages installed there are the ones this branch would install. Anything else names the npm ci to run.
// The judge is pure (tests/unit/worktree-deps.test.ts); linkDeps does the reading, the git call and the link.
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

/**
 * What a lane uses for `<rel>/node_modules`.
 * @param {{ rel: string, hereHas: boolean, isWorktree: boolean, mainHas: boolean, hereLock: string | null, mainLock: string | null }} s
 * @returns {{ use: 'own' } | { use: 'link' } | { use: 'none', why: string }}
 */
export function judgeDeps(s) {
  if (s.hereHas) return { use: 'own' };
  const run = `run npm ci in ${s.rel}/`;
  if (!s.isWorktree) return { use: 'none', why: `${s.rel}/node_modules is missing; ${run}` };
  if (!s.mainHas) return { use: 'none', why: `${s.rel}/node_modules is missing here and in the main checkout; ${run}` };
  if (s.hereLock === null || s.mainLock === null) {
    return { use: 'none', why: `${s.rel}/node_modules is missing and a ${s.rel}/package-lock.json is missing to compare; ${run}` };
  }
  if (s.hereLock !== s.mainLock) {
    return { use: 'none', why: `${s.rel}/node_modules is missing and this branch's ${s.rel}/package-lock.json is not the main checkout's; ${run}` };
  }
  return { use: 'link' };
}

/** The environment without git's GIT_* variables (a hook sets them), so `-C <folder>` alone names the repository. */
export const gitFreeEnv = () => Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

/** The main checkout's folder when `repo` is a linked worktree, else null. */
export function mainCheckout(repo) {
  try {
    const env = gitFreeEnv();
    const git = (arg) => resolve(repo, execFileSync('git', ['-C', repo, 'rev-parse', arg], { encoding: 'utf8', env }).trim());
    const own = git('--git-dir');
    const common = git('--git-common-dir');
    return own === common ? null : dirname(common);
  } catch {
    return null;
  }
}

const readOrNull = (file) => (existsSync(file) ? readFileSync(file, 'utf8') : null);

/**
 * Borrows `fromModules` (the main checkout's node_modules) into a new `toModules`, package by package. A package that
 * npm installed from a `file:` spec is a link into the main checkout's own tree (tests' `@ia/core` -> `core`, the app's
 * `ia-gps` and `ia-island` -> `plugins-src`), so it is pointed at the worktree's copy of the same path instead. Found
 * v0.261.0: the folder borrowed whole made a worktree's tests import the main checkout's core, so its version test read
 * the old version and an engine change would have been tested against the old engine. A cache folder (`.vite`, any
 * dot folder but `.bin`) is the worktree's own. Returns the packages pointed at the worktree.
 * @param {string} fromModules @param {string} toModules @param {string} mainRepo @param {string} repo
 * @returns {string[]}
 */
export function borrowModules(fromModules, toModules, mainRepo, repo) {
  const own = [];
  mkdirSync(toModules);
  const place = (/** @type {string} */ name) => {
    const src = join(fromModules, name);
    const dst = join(toModules, name);
    const st = lstatSync(src);
    if (st.isSymbolicLink()) {
      const inMain = relative(mainRepo, realpathSync(src));
      if (inMain && !inMain.startsWith('..') && !isAbsolute(inMain) && !inMain.split(sep).includes('node_modules')) {
        symlinkSync(join(repo, inMain), dst, 'dir');
        own.push(name);
        return;
      }
    }
    if (name.startsWith('.') && name !== '.bin' && st.isDirectory()) {
      mkdirSync(dst);
      return;
    }
    symlinkSync(src, dst, st.isDirectory() || st.isSymbolicLink() ? 'dir' : 'file');
  };
  for (const e of readdirSync(fromModules)) {
    if (e.startsWith('@') && lstatSync(join(fromModules, e)).isDirectory()) {
      mkdirSync(join(toModules, e));
      for (const p of readdirSync(join(fromModules, e))) place(e + '/' + p);
    } else place(e);
  }
  return own;
}

/**
 * Makes `<repo>/<rel>/node_modules` usable: kept when there, borrowed from the main checkout when the judge allows it.
 * A worktree that borrowed the folder whole before v0.261.0 (one link to the main checkout's) is borrowed again,
 * package by package.
 * @returns {{ ok: true, linked: string | null, own?: string[] } | { ok: false, why: string }}
 */
export function linkDeps(repo, rel) {
  const here = join(repo, rel);
  const mods = join(here, 'node_modules');
  let main = null;
  if (existsSync(mods) && lstatSync(mods).isSymbolicLink()) {
    main = mainCheckout(repo);
    if (main && realpathSync(mods) === realpathSync(join(main, rel, 'node_modules'))) unlinkSync(mods);
  }
  const hereHas = existsSync(mods);
  if (hereHas) main = null;
  else if (main === null) main = mainCheckout(repo);
  const there = main ? join(main, rel) : null;
  const verdict = judgeDeps({
    rel,
    hereHas,
    isWorktree: main !== null,
    mainHas: there !== null && existsSync(join(there, 'node_modules')),
    hereLock: readOrNull(join(here, 'package-lock.json')),
    mainLock: there ? readOrNull(join(there, 'package-lock.json')) : null,
  });
  if (verdict.use === 'own') return { ok: true, linked: null };
  if (verdict.use === 'none') return { ok: false, why: verdict.why };
  const from = join(/** @type {string} */ (there), 'node_modules');
  try {
    const own = borrowModules(from, mods, /** @type {string} */ (main), repo);
    return { ok: true, linked: from, own };
  } catch (err) {
    rmSync(mods, { recursive: true, force: true });
    return { ok: false, why: `${rel}/node_modules could not be borrowed from ${from} (${err.message}); run npm ci in ${rel}/` };
  }
}
