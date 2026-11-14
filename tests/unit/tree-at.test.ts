// A past commit's tree for the previous-release proof of a test that reads source files (tools/tree-at.mjs; CLAUDE.md,
// Proof for new work). Found at v0.260.0: copied by hand, the tree took four tries, since the tests' global setup builds
// the page and needs the app, core, the tests, the tools, the page and its icon. The plan is pure and checked by a table
// typed from the rule; the last test writes a real commit's tree from a temp repo.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Plan = { ok: true; archive: string[]; links: [string, string][]; copies: [string, string][] } | { ok: false; why: string };
interface Tree {
  TREE: string[];
  DEPS: string[];
  treePlan(s: { dirEmpty: boolean; has: (p: string) => boolean; files: string[]; depsRoot: string; dir: string; repo: string }): Plan;
  writeTree(repo: string, ref: string, dir: string, files: string[], depsRoot?: string): Plan;
  WORKING_TREE: string[];
  WORKING_DEPS: string[];
  workingPlan(s: { dirEmpty: boolean; listed: string[]; onDisk: (p: string) => boolean; depsRoot: string; dir: string; repo: string; doctrine: string | null }): WorkingPlan;
  writeWorking(repo: string, dir: string, depsRoot?: string): WorkingPlan;
}
type WorkingPlan = { ok: true; copies: [string, string][]; links: [string, string][] } | { ok: false; why: string };
const T = (await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'tree-at.mjs')).href)) as Tree;
const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const base = { dirEmpty: true, has: () => true, files: [] as string[], depsRoot: '/main', dir: '/scratch/prev', repo: '/wt' };

test('a copy holds the app, the Expo app, core, the tests, the tools, the page and its icon, and borrows two packages', () => {
  assert.deepEqual(T.TREE, ['frontends/app', 'frontends/native', 'core', 'tests', 'tools', 'index.html', 'apple-touch-icon.png']);
  const plan = T.treePlan({ ...base, files: ['tests/unit/swipe-deck.test.ts', 'frontends/app/test/unit/deck.test.ts'] });
  assert.ok(plan.ok);
  assert.deepEqual(plan.archive, T.TREE);
  assert.deepEqual(plan.links, [['/main/tests/node_modules', '/scratch/prev/tests/node_modules'], ['/main/frontends/app/node_modules', '/scratch/prev/frontends/app/node_modules']]);
  assert.deepEqual(plan.copies, [['/wt/tests/unit/swipe-deck.test.ts', '/scratch/prev/tests/unit/swipe-deck.test.ts'],
    ['/wt/frontends/app/test/unit/deck.test.ts', '/scratch/prev/frontends/app/test/unit/deck.test.ts']]);
});

test('a path the commit does not have is left out, not an error', () => {
  const plan = T.treePlan({ ...base, has: (p) => p !== 'apple-touch-icon.png' });
  assert.ok(plan.ok);
  assert.equal(plan.archive.includes('apple-touch-icon.png'), false);
});

test('a folder with something in it, or a file outside the two test folders, is refused', () => {
  assert.equal(T.treePlan({ ...base, dirEmpty: false }).ok, false);
  assert.equal(T.treePlan({ ...base, files: ['frontends/app/src/app/screens/deck/deck.ts'] }).ok, false, 'a source file is never copied over');
  assert.equal(T.treePlan({ ...base, files: ['tests/../index.html'] }).ok, false);
});

test('writes the commit\'s files, links the packages and copies the new test over them', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tree-at-'));
  const git = (...a: string[]) => execFileSync('git', ['-C', join(tmp, 'repo'), ...a], { env: gitEnv, encoding: 'utf8' });
  try {
    const repo = join(tmp, 'repo');
    for (const d of ['frontends/app/src', 'frontends/app/test/unit', 'core', 'tests/unit', 'tools']) mkdirSync(join(repo, d), { recursive: true });
    writeFileSync(join(repo, 'frontends/app/src/deck.ts'), 'old source\n');
    writeFileSync(join(repo, 'tests/unit/a.test.ts'), 'old test\n');
    writeFileSync(join(repo, 'core/v.ts'), 'core\n');
    writeFileSync(join(repo, 'tools/t.mjs'), 'tool\n');
    writeFileSync(join(repo, 'frontends/app/test/unit/b.test.ts'), 'old app test\n');
    writeFileSync(join(repo, 'index.html'), 'page\n');
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'previous');
    writeFileSync(join(repo, 'frontends/app/src/deck.ts'), 'new source\n');
    writeFileSync(join(repo, 'tests/unit/a.test.ts'), 'new test\n');
    const deps = join(tmp, 'main');
    mkdirSync(join(deps, 'tests/node_modules'), { recursive: true });
    mkdirSync(join(deps, 'frontends/app/node_modules'), { recursive: true });
    const dir = join(tmp, 'prev');

    const plan = T.writeTree(repo, 'HEAD', dir, ['tests/unit/a.test.ts'], deps);
    assert.ok(plan.ok);
    assert.equal(readFileSync(join(dir, 'frontends/app/src/deck.ts'), 'utf8'), 'old source\n', 'the source is the commit\'s');
    assert.equal(readFileSync(join(dir, 'tests/unit/a.test.ts'), 'utf8'), 'new test\n', 'the test is the working tree\'s');
    assert.equal(readFileSync(join(dir, 'frontends/app/test/unit/b.test.ts'), 'utf8'), 'old app test\n');
    assert.equal(existsSync(join(dir, 'apple-touch-icon.png')), false, 'the commit had no icon');
    assert.ok(lstatSync(join(dir, 'tests/node_modules')).isSymbolicLink());
    assert.ok(lstatSync(join(dir, 'frontends/app/node_modules')).isSymbolicLink());
    assert.equal(T.writeTree(repo, 'HEAD', dir, [], deps).ok, false, 'a second write into the same folder is refused');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// The working tree's copy (--working, Post-v0.262.0): the finished tree before its commit, as CI's tests job has it,
// which installs the tests' packages and neither app's. Overlaid by hand in the native spike chat, the copy lost a
// folder named like an ignored one and a good test read red.
const work = { dirEmpty: true, listed: [] as string[], onDisk: () => true, depsRoot: '/main', dir: '/scratch/ci', repo: '/wt', doctrine: null as string | null };

test('a working copy holds the same paths and the pipeline file, and borrows the tests\' packages alone', () => {
  assert.deepEqual(T.WORKING_TREE, ['frontends/app', 'frontends/native', 'core', 'tests', 'tools', 'index.html', 'apple-touch-icon.png', '.github/workflows']);
  assert.deepEqual(T.WORKING_DEPS, ['tests']);
  const plan = T.workingPlan({ ...work, listed: ['core/v.ts', 'frontends/native/modules/ia-spike/ios/M.swift', ''] });
  assert.ok(plan.ok);
  assert.deepEqual(plan.copies, [['/wt/core/v.ts', '/scratch/ci/core/v.ts'],
    ['/wt/frontends/native/modules/ia-spike/ios/M.swift', '/scratch/ci/frontends/native/modules/ia-spike/ios/M.swift']]);
  assert.deepEqual(plan.links, [['/main/tests/node_modules', '/scratch/ci/tests/node_modules']]);
});

test('a working copy leaves out a tracked file deleted here, links the doctrine text when there is one, and refuses a used folder', () => {
  const plan = T.workingPlan({ ...work, listed: ['core/kept.ts', 'core/deleted.ts'], onDisk: (p) => p !== 'core/deleted.ts', doctrine: '/main/doctrine' });
  assert.ok(plan.ok);
  assert.deepEqual(plan.copies, [['/wt/core/kept.ts', '/scratch/ci/core/kept.ts']]);
  assert.deepEqual(plan.links[1], ['/main/doctrine', '/scratch/ci/doctrine']);
  assert.deepEqual(T.workingPlan({ ...work, dirEmpty: false }), { ok: false, why: '/scratch/ci is not empty; give a new folder' });
});

test('writes the files as they stand: a change not committed, a new file not added, nothing ignored, no app packages', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'tree-working-'));
  const git = (...a: string[]) => execFileSync('git', ['-C', join(tmp, 'repo'), ...a], { env: gitEnv, encoding: 'utf8' });
  try {
    const repo = join(tmp, 'repo');
    for (const d of ['frontends/native/src', 'frontends/native/ios', 'frontends/native/node_modules/expo', 'core', 'tests/unit', '.github/workflows', 'docs']) {
      mkdirSync(join(repo, d), { recursive: true });
    }
    writeFileSync(join(repo, 'frontends/native/.gitignore'), '/ios/\nnode_modules/\n');
    writeFileSync(join(repo, 'frontends/native/src/App.tsx'), 'committed\n');
    writeFileSync(join(repo, 'core/gone.ts'), 'to be deleted\n');
    writeFileSync(join(repo, '.github/workflows/pipeline.yml'), 'jobs\n');
    writeFileSync(join(repo, 'docs/note.md'), 'outside the copy\n');
    git('init', '-q');
    git('add', '.');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', 'previous');

    writeFileSync(join(repo, 'frontends/native/src/App.tsx'), 'changed, not committed\n');
    mkdirSync(join(repo, 'frontends/native/modules/ia-spike/ios'), { recursive: true });
    writeFileSync(join(repo, 'frontends/native/modules/ia-spike/ios/M.swift'), 'new, not added\n');
    writeFileSync(join(repo, 'tests/unit/new.test.ts'), 'new test\n');
    writeFileSync(join(repo, 'frontends/native/ios/Generated.swift'), 'ignored\n');
    writeFileSync(join(repo, 'frontends/native/node_modules/expo/index.js'), 'ignored\n');
    rmSync(join(repo, 'core/gone.ts'));
    const deps = join(tmp, 'main');
    mkdirSync(join(deps, 'tests/node_modules'), { recursive: true });
    mkdirSync(join(deps, 'frontends/app/node_modules'), { recursive: true });
    mkdirSync(join(deps, 'frontends/native/node_modules'), { recursive: true });
    const dir = join(tmp, 'ci');

    const plan = T.writeWorking(repo, dir, deps);
    assert.ok(plan.ok);
    assert.equal(readFileSync(join(dir, 'frontends/native/src/App.tsx'), 'utf8'), 'changed, not committed\n');
    assert.equal(readFileSync(join(dir, 'frontends/native/modules/ia-spike/ios/M.swift'), 'utf8'), 'new, not added\n', 'a folder named ios under modules/ is not the ignored /ios/');
    assert.equal(readFileSync(join(dir, 'tests/unit/new.test.ts'), 'utf8'), 'new test\n');
    assert.equal(readFileSync(join(dir, '.github/workflows/pipeline.yml'), 'utf8'), 'jobs\n');
    assert.equal(existsSync(join(dir, 'frontends/native/ios')), false, 'the generated project is ignored');
    assert.equal(existsSync(join(dir, 'core/gone.ts')), false, 'a file deleted here is not copied');
    assert.equal(existsSync(join(dir, 'docs')), false, 'a path outside the copy stays out');
    assert.ok(lstatSync(join(dir, 'tests/node_modules')).isSymbolicLink());
    assert.equal(existsSync(join(dir, 'frontends/native/node_modules')), false, 'the Expo app\'s packages are not there');
    assert.equal(existsSync(join(dir, 'frontends/app/node_modules')), false, 'today\'s app\'s packages are not there');
    assert.equal(T.writeWorking(repo, dir, deps).ok, false, 'a second write into the same folder is refused');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
