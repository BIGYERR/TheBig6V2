#!/usr/bin/env node
// The tree a past commit had, for running a new or changed test that reads source files instead of the page against the
// previous release (CLAUDE.md, Proof for new work). The tests' global setup builds the page from the sources, so a copy
// needs the app, the Expo app (whose sources tests/unit/native-shell.test.ts reads; Post-v0.262.0), core, the tests and
// the tools, the page and its icon, and the main checkout's node_modules; assembled by hand at v0.260.0 the copy took
// four tries. The plan is pure (tests/unit/tree-at.test.ts); writeTree does the git, the
// links and the copies.
//
// Usage: node tools/tree-at.mjs <ref> <dir> [test file ...]
//   <dir> must be missing or empty; each test file (repo-relative, under tests/ or frontends/app/test/) is copied over the
//   archive from the working tree. Then: cd <dir>/tests && npx vitest run <files>, or cd <dir>/frontends/app && node --test <files>.
//
// Usage: node tools/tree-at.mjs --working <dir>
//   This checkout's files as they stand, committed or not (tracked and untracked, nothing ignored), with the tests'
//   packages alone: what CI's tests job has, which installs neither app's packages. For running a new test there
//   before the commit that carries it (Post-v0.262.0: overlaid by hand, the copy lost a folder and read red).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gitFreeEnv, mainCheckout } from './worktree-deps.mjs';

/** What a copy holds: the paths archived from the commit, when the commit has them. */
export const TREE = ['frontends/app', 'frontends/native', 'core', 'tests', 'tools', 'index.html', 'apple-touch-icon.png'];
/** The packages whose node_modules the copy borrows. */
export const DEPS = ['tests', 'frontends/app'];

/**
 * The copy's plan, from facts the caller reads: whether <dir> is empty, which TREE paths the commit has, and the test
 * files to copy over. Refuses a folder with something in it and a file outside the two test folders.
 * @param {{ dirEmpty: boolean, has: (p: string) => boolean, files: string[], depsRoot: string, dir: string, repo: string }} s
 */
export function treePlan(s) {
  if (!s.dirEmpty) return { ok: false, why: s.dir + ' is not empty; give a new folder' };
  const bad = s.files.filter((f) => !/^(tests|frontends\/app\/test)\//.test(f) || f.includes('..'));
  if (bad.length) return { ok: false, why: 'not a test file under tests/ or frontends/app/test/: ' + bad.join(', ') };
  return {
    ok: true,
    archive: TREE.filter((p) => s.has(p)),
    links: DEPS.map((rel) => [join(s.depsRoot, rel, 'node_modules'), join(s.dir, rel, 'node_modules')]),
    copies: s.files.map((f) => [join(s.repo, f), join(s.dir, f)]),
  };
}

/** What a copy of the working tree holds: the same paths, and the pipeline file some tests read. */
export const WORKING_TREE = [...TREE, '.github/workflows'];
/** The one package folder CI's tests job installs. */
export const WORKING_DEPS = ['tests'];

/**
 * The plan of a working tree copy, from the files git lists (tracked and untracked, nothing ignored) and whether each
 * is on disk: a tracked file deleted here is left out. Only the tests' packages are linked, and the doctrine text
 * (ignored, restored in CI from a secret) when this checkout or the main one has it.
 * @param {{ dirEmpty: boolean, listed: string[], onDisk: (p: string) => boolean, depsRoot: string, dir: string, repo: string, doctrine: string | null }} s
 */
export function workingPlan(s) {
  if (!s.dirEmpty) return { ok: false, why: s.dir + ' is not empty; give a new folder' };
  const files = s.listed.filter((f) => f && !f.includes('..') && s.onDisk(f));
  return {
    ok: true,
    copies: files.map((f) => [join(s.repo, f), join(s.dir, f)]),
    links: [
      ...WORKING_DEPS.map((rel) => [join(s.depsRoot, rel, 'node_modules'), join(s.dir, rel, 'node_modules')]),
      ...(s.doctrine ? [[s.doctrine, join(s.dir, 'doctrine')]] : []),
    ],
  };
}

/** Writes this checkout's working tree into <dir> by the plan. Returns the plan, or why it was refused. */
export function writeWorking(repo, dir, depsRoot = mainCheckout(repo) || repo) {
  const env = gitFreeEnv();
  const listed = execFileSync('git', ['-C', repo, 'ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...WORKING_TREE], { env, encoding: 'utf8', maxBuffer: 1 << 28 })
    .split('\0');
  const isFile = (p) => {
    try {
      return lstatSync(join(repo, p)).isFile();
    } catch {
      return false;
    }
  };
  const doctrine = [join(repo, 'doctrine'), join(depsRoot, 'doctrine')].find((d) => existsSync(d)) ?? null;
  const dirEmpty = !existsSync(dir) || readdirSync(dir).length === 0;
  const plan = workingPlan({ dirEmpty, listed: [...new Set(listed)], onDisk: isFile, depsRoot, dir, repo, doctrine });
  if (!plan.ok) return plan;
  for (const [from, to] of plan.copies) {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  for (const [from, to] of plan.links) if (existsSync(from) && existsSync(dirname(to)) && !existsSync(to)) symlinkSync(from, to);
  return plan;
}

/** Writes <ref>'s tree into <dir> by the plan. Returns the plan, or why it was refused. */
export function writeTree(repo, ref, dir, files, depsRoot = mainCheckout(repo) || repo) {
  const env = gitFreeEnv();
  const has = (p) => {
    try {
      execFileSync('git', ['-C', repo, 'cat-file', '-e', ref + ':' + p], { env, stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  };
  const dirEmpty = !existsSync(dir) || readdirSync(dir).length === 0;
  const plan = treePlan({ dirEmpty, has, files, depsRoot, dir, repo });
  if (!plan.ok) return plan;
  mkdirSync(dir, { recursive: true });
  const tar = execFileSync('git', ['-C', repo, 'archive', ref, ...plan.archive], { env, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', dir], { input: tar });
  for (const [from, to] of plan.links) if (existsSync(from) && existsSync(dirname(to)) && !existsSync(to)) symlinkSync(from, to);
  for (const [from, to] of plan.copies) {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  }
  return plan;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [ref, dirArg, ...files] = process.argv.slice(2);
  if (!ref || !dirArg || (ref === '--working' && files.length)) {
    console.error('usage: node tools/tree-at.mjs <ref> <dir> [test file ...]\n       node tools/tree-at.mjs --working <dir>');
    process.exit(2);
  }
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const dir = resolve(dirArg);
  if (ref === '--working') {
    const plan = writeWorking(repo, dir);
    if (!plan.ok) {
      console.error('tree-at: ' + plan.why);
      process.exit(1);
    }
    console.log('tree-at: the working tree into ' + dir + ': ' + plan.copies.length + ' file(s), committed or not; packages: ' + WORKING_DEPS.join(', ') + ' alone');
    console.log('  cd ' + join(dir, 'tests') + ' && npx vitest run <files>');
    process.exit(0);
  }
  const plan = writeTree(repo, ref, dir, files);
  if (!plan.ok) {
    console.error('tree-at: ' + plan.why);
    process.exit(1);
  }
  console.log('tree-at: ' + ref + ' into ' + dir + ': ' + plan.archive.join(', ') + '; ' + plan.copies.length + ' test file(s) copied over');
  const vit = files.filter((f) => f.startsWith('tests/')).map((f) => f.slice('tests/'.length));
  const app = files.filter((f) => f.startsWith('frontends/app/'));
  if (vit.length) console.log('  cd ' + join(dir, 'tests') + ' && npx vitest run ' + vit.join(' '));
  if (app.length) console.log('  cd ' + join(dir, 'frontends/app') + ' && node --test ' + app.map((f) => f.slice('frontends/app/'.length)).join(' '));
}
