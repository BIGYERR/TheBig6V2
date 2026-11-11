// Claims: the next D-code and the highest version are read on origin/dev, local dev, every chat branch and the working
// tree (tools/claims.mjs; CLAUDE.md, Session rhythm and Versioning). Post-v0.259.3 the iOS 15 chat read D280 and 0.259.2
// on dev and wrote D281 and 0.259.3 while chat/swipe-deck already held both. The judge is pure and the tables below are
// typed by hand; the last test makes a real repository in a temp folder, with a handoff over 1 MB as the real one is.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

type Row = { ref: string; dcode: number | null; version: string | null };
type Verdict = {
  nextD: number; dHolders: string[]; version: string; vHolders: string[]; nextPatch: string; nextMinor: string;
  ahead: Row[];
};
interface Claims {
  highestDCode(handoff: string): number | null;
  metaVersion(head: string): string | null;
  judgeClaims(rows: Row[], base?: string): Verdict;
  claimLines(v: Verdict, base?: string): string[];
  readClaims(repo: string): Row[];
  REGISTRY_FILE: string;
  META_FILE: string;
  WORKING_TREE: string;
}
interface WorktreeDeps { gitFreeEnv(): NodeJS.ProcessEnv }
const TOOLS = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'tools');
const C = (await import(pathToFileURL(join(TOOLS, 'claims.mjs')).href)) as Claims;
const W = (await import(pathToFileURL(join(TOOLS, 'worktree-deps.mjs')).href)) as WorktreeDeps;

const registry = (d: number) =>
  `## Current state\n- **D-CODE REGISTRY (read before issuing any D-code): highest assigned = D${d}. Next free = D${d + 1}.** (D${d} …)\n`;
const head = (v: string) => `<meta charset="utf-8">\n<meta name="ia-version" content="${v}">\n`;

test('the registry line and the meta are read as written', () => {
  assert.equal(C.highestDCode(registry(280)), 280);
  assert.equal(C.highestDCode('- **D-CODE REGISTRY** nothing here\nhighest assigned = D999.'), null, 'only the registry line counts');
  assert.equal(C.highestDCode(''), null);
  assert.equal(C.metaVersion(head('0.259.3')), '0.259.3');
  assert.equal(C.metaVersion(head('239')), '0.239.0', 'a pre-semver build reads as 0.N.0');
  assert.equal(C.metaVersion('<meta name="viewport">'), null);
});

test('the case that collided: a chat branch held D281 and 0.259.3 while dev read D280 and 0.259.2', () => {
  const v = C.judgeClaims([
    { ref: 'origin/dev', dcode: 280, version: '0.259.2' },
    { ref: 'dev', dcode: 280, version: '0.259.2' },
    { ref: 'chat/swipe-deck', dcode: 281, version: '0.259.3' },
    { ref: 'chat/ios-15-floor', dcode: 280, version: '0.259.2' },
    { ref: 'working tree', dcode: 280, version: '0.259.2' },
  ]);
  assert.equal(v.nextD, 282);
  assert.deepEqual(v.dHolders, ['chat/swipe-deck']);
  assert.equal(v.version, '0.259.3');
  assert.deepEqual(v.vHolders, ['chat/swipe-deck']);
  assert.equal(v.nextPatch, '0.259.4');
  assert.equal(v.nextMinor, '0.260.0');
  assert.deepEqual(v.ahead, [{ ref: 'chat/swipe-deck', dcode: 281, version: '0.259.3' }]);
  assert.deepEqual(C.claimLines(v), [
    'claims: next free D-code D282 (D281 on chat/swipe-deck)',
    'claims: highest version 0.259.3 on chat/swipe-deck; a PATCH would be 0.259.4, a MINOR 0.260.0',
    'claims: held ahead of origin/dev: chat/swipe-deck (D281, 0.259.3)',
  ]);
});

test('landed branches hold nothing ahead, and versions compare as versions, never as text', () => {
  const v = C.judgeClaims([
    { ref: 'origin/dev', dcode: 282, version: '0.259.10' },
    { ref: 'chat/old', dcode: 200, version: '239' },
    { ref: 'chat/landed', dcode: 282, version: '0.259.9' },
  ]);
  assert.equal(v.nextD, 283);
  assert.deepEqual(v.dHolders, ['origin/dev', 'chat/landed']);
  assert.equal(v.version, '0.259.10', '0.259.10 is above 0.259.9');
  assert.deepEqual(v.ahead, []);
  assert.equal(C.claimLines(v)[2], 'claims: nothing is held ahead of origin/dev');
  assert.throws(() => C.judgeClaims([{ ref: 'origin/dev', dcode: null, version: null }]), /no registry line or no ia-version/);
});

test('a real repository: dev, a chat branch ahead of it, and the working tree are all read', () => {
  const tmp = realpathSync(mkdtempSync(join(tmpdir(), 'ia-claims-')));
  try {
    const repo = join(tmp, 'repo');
    mkdirSync(join(repo, dirname(C.META_FILE)), { recursive: true });
    // The pre-commit hook runs this with git's GIT_* variables set (its index file); the temp repository is its own.
    const git = (...a: string[]) => execFileSync('git', ['-C', repo, ...a], { stdio: 'pipe', env: W.gitFreeEnv() });
    const commit = (d: number, v: string) => {
      // Over 1 MB, as the real handoff is: a read with Node's default 1 MB buffer would lose the registry line.
      writeFileSync(join(repo, C.REGISTRY_FILE), registry(d) + 'x'.repeat(1_500_000) + '\n');
      writeFileSync(join(repo, C.META_FILE), head(v));
      git('add', '-A');
      git('-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'core.hooksPath=/dev/null', 'commit', '-q', '-m', v);
    };
    git('init', '-q', '-b', 'dev');
    commit(280, '0.259.2');
    git('checkout', '-q', '-b', 'chat/swipe-deck');
    commit(281, '0.259.3');
    git('checkout', '-q', 'dev');
    git('checkout', '-q', '-b', 'chat/ios-15-floor');

    const rows = C.readClaims(repo);
    assert.deepEqual(rows, [
      { ref: 'chat/ios-15-floor', dcode: 280, version: '0.259.2' },
      { ref: 'chat/swipe-deck', dcode: 281, version: '0.259.3' },
      { ref: 'dev', dcode: 280, version: '0.259.2' },
      { ref: C.WORKING_TREE, dcode: 280, version: '0.259.2' },
    ]);
    const v = C.judgeClaims(rows, 'dev');
    assert.equal(v.nextD, 282);
    assert.equal(v.version, '0.259.3');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
