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
}
const T = (await import(pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools', 'tree-at.mjs')).href)) as Tree;
const gitEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith('GIT_')));

const base = { dirEmpty: true, has: () => true, files: [] as string[], depsRoot: '/main', dir: '/scratch/prev', repo: '/wt' };

test('a copy holds the app, core, the tests, the tools, the page and its icon, and borrows two packages', () => {
  assert.deepEqual(T.TREE, ['frontends/app', 'core', 'tests', 'tools', 'index.html', 'apple-touch-icon.png']);
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
