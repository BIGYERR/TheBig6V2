// A chat's worktree and its packages' node_modules (CLAUDE.md, Pipeline: the 60-second check). A worktree is checked out
// without them, and an `npm ci` of the app, the website or the backend takes longer than the check's 60 s. So the check
// borrows the main checkout's folder through a link, but only when this branch's lockfile is the main checkout's byte for
// byte: then the packages installed there are the ones this branch would install. Anything else names the npm ci to run.
// The judge is pure (tests/unit/worktree-deps.test.ts); linkDeps does the reading, the git call and the link.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

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
 * Makes `<repo>/<rel>/node_modules` usable: kept when there, linked from the main checkout when the judge allows it.
 * @returns {{ ok: true, linked: string | null } | { ok: false, why: string }}
 */
export function linkDeps(repo, rel) {
  const here = join(repo, rel);
  const hereHas = existsSync(join(here, 'node_modules'));
  const main = hereHas ? null : mainCheckout(repo);
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
    symlinkSync(from, join(here, 'node_modules'), 'dir');
  } catch (err) {
    return { ok: false, why: `${rel}/node_modules could not be linked from ${from} (${err.message}); run npm ci in ${rel}/` };
  }
  return { ok: true, linked: from };
}
