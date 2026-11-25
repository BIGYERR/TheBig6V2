import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { e2eProject, liveProjects, staleProjects } from '../e2e/images.ts';

// Expected project names are the first 8 hex digits of `printf '%s' <path> | shasum -a 256`, typed from that command.
const MAIN = 'iron-asylum-e2e-8771f5c3'; // /repo/tests/e2e
const WIZARD = 'iron-asylum-e2e-5888758f'; // /repo/.claude/worktrees/wizard/tests/e2e
const GONE = 'iron-asylum-e2e-3ce761f8'; // /repo/.claude/worktrees/gone/tests/e2e

const PORCELAIN = [
  'worktree /repo',
  'HEAD 9b5e16500000000000000000000000000000000',
  'branch refs/heads/dev',
  '',
  'worktree /repo/.claude/worktrees/wizard',
  'HEAD 523ae5000000000000000000000000000000000',
  'branch refs/heads/chat/wizard',
  '',
].join('\n');

describe('e2e image cleanup', () => {
  it('names a checkout\'s project after the first 8 hex digits of its e2e folder\'s sha256', () => {
    assert.equal(e2eProject('/repo/tests/e2e'), MAIN);
    assert.equal(e2eProject('/repo/.claude/worktrees/gone/tests/e2e'), GONE);
  });

  it('counts every checkout git lists as live, and the running one even when git does not list it', () => {
    assert.deepEqual([...liveProjects(PORCELAIN, GONE)].sort(), [GONE, WIZARD, MAIN].sort());
    assert.deepEqual([...liveProjects('', GONE)], [GONE]);
  });

  it('reads only the worktree lines, never a HEAD or branch line', () => {
    const live = liveProjects(PORCELAIN, MAIN);
    assert.equal(live.size, 2, 'the main checkout and the wizard worktree');
  });

  it('names an e2e project no live checkout owns, once, however many images carry it', () => {
    const live = liveProjects(PORCELAIN, MAIN);
    assert.deepEqual(staleProjects([GONE, GONE, `${GONE}\n`, ''], live), [GONE]);
  });

  it('never names a live checkout\'s project', () => {
    const live = liveProjects(PORCELAIN, MAIN);
    assert.deepEqual(staleProjects([MAIN, WIZARD, MAIN], live), []);
  });

  it('never names another compose project, such as the dev container\'s', () => {
    const live = liveProjects(PORCELAIN, MAIN);
    assert.deepEqual(staleProjects(['backend', 'iron-asylum-dev', 'e2e-3ce761f8', ''], live), []);
  });

  it('lists several stale projects in order', () => {
    const live = liveProjects(PORCELAIN, MAIN);
    const z = 'iron-asylum-e2e-ffffffff';
    const a = 'iron-asylum-e2e-00000000';
    assert.deepEqual(staleProjects([z, MAIN, a, GONE], live), [a, GONE, z]);
  });
});
