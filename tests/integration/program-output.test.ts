// Program output: what buildProgram prescribes for Mario's live program (fixtures.HALF_MANNY) and a small seeded
// lattice of other configs (tests/support/programs.ts), against the golden file tests/snapshots/program-output.json.
// Rulings that move program output: docs/decisions/program-output.md.
//
// This replaces the per-release HALF_MANNY digest tables (MANNY_DIGEST_BY_VERSION and its era rows) for new work: one
// current golden file in git. When a ruling changes what a program prescribes, regenerate it on purpose and review the
// diff, which shows the digest and every week-grid line that moved:
//
//   cd tests && UPDATE_SNAPSHOTS=1 npx vitest run integration/program-output.test.ts
//   git diff tests/snapshots/program-output.json
//
// Determinism: every config pins cfg.seed; progDigest strips the clock fields (id, created); the app's clock is pinned
// to one local noon; and each program is built twice and must equal itself before it is compared with anything.
import assert from 'node:assert/strict';
import { test } from 'vitest';
import { loadApp, pinClock, progDigest, weekGrid } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { matchSnapshot } from '../support/snapshot.ts';

/** The day every build sees as today (local time). The digests below do not depend on it; pinning keeps it so. */
const TODAY = new Date(2026, 9, 11, 12, 0, 0);

const IA = loadApp();
pinClock(IA, TODAY);

test('the pinned clock reaches the app', () => {
  assert.equal(IA.eval('new Date().getTime()'), TODAY.getTime());
  assert.equal(IA.eval('Date.now()'), TODAY.getTime());
});

test('every config pins its seed', () => {
  for (const [name, c] of Object.entries(PROGRAMS)) assert.ok(Number.isInteger(c.seed), `${name} has a seed`);
});

test('buildProgram leaves the config it is given unchanged', () => {
  for (const [name, c] of Object.entries(PROGRAMS)) {
    const before = JSON.stringify(c);
    IA.buildProgram(c);
    assert.equal(JSON.stringify(c), before, `${name}: cfg is never mutated by the engine`);
  }
});

test('every program equals itself when built twice', () => {
  for (const [name, c] of Object.entries(PROGRAMS)) {
    assert.equal(progDigest(IA.buildProgram(c)), progDigest(IA.buildProgram(c)), `${name} is self-stable`);
  }
});

test('program output matches tests/snapshots/program-output.json', () => {
  const programs: Record<string, { weeks: number; digest: string; grid: string[] }> = {};
  for (const [name, c] of Object.entries(PROGRAMS)) {
    const prog = IA.buildProgram(c);
    programs[name] = {
      weeks: Object.keys(prog.weeks || {}).length,
      digest: progDigest(prog),
      grid: weekGrid(prog).split('\n'),
    };
  }
  matchSnapshot('program-output', { today: '2026-10-11 12:00 local', programs });
});
