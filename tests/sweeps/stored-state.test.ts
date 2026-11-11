// Stored state, swept (MIGRATION.md, phase 1): the standard history of tests/support/stored-state.ts walked over
// every seeded program, in three time zones, and over a sample of the 864-config lattice. Golden records:
// tests/snapshots/stored-state-programs.json, -zones.json and -lattice.json. The fast cut, with the hostile cases, is
// tests/integration/stored-state.test.ts; like it, this file guards behaviour that must not change, so it passes on
// the release before it too.
//
// Regenerate only when a ruling changes what the app stores:
//   cd tests && UPDATE_SNAPSHOTS=1 npx vitest run sweeps/stored-state.test.ts
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { test } from 'vitest';
import type { Cfg } from '@ia/core';
import { fixtures } from '../support/app.ts';
import { PROGRAMS } from '../support/programs.ts';
import { matchSnapshot } from '../support/snapshot.ts';
import { life } from '../support/stored-state.ts';
import type { StateRecord } from '../support/stored-state.ts';

const CREATED = '2026-08-29T09:00:00';
const zone = (tz: string): void => { process.env['TZ'] = tz; };
/**
 * A history held small: each stretch as one hash over every key's name, size and sha256, with the grid in hand; the
 * last stretch also key by key. A difference names the stretch, and on the last one the key. The readable values are
 * in tests/snapshots/stored-state.json, for HALF_MANNY.
 */
const hashes = (records: Record<string, StateRecord>) => {
  const names = Object.keys(records);
  return Object.fromEntries(names.map((stage, i) => {
    const r = records[stage]!;
    const lines = Object.entries(r.keys).map(([k, v]) => k + ' ' + v.bytes + ' ' + v.sha256);
    const held: Record<string, unknown> = { keys: lines.length, all: createHash('sha256').update(lines.join('\n')).digest('hex'), live: r.live };
    if (i === names.length - 1) held['each'] = Object.fromEntries(Object.entries(r.keys).map(([k, v]) => [k, v.bytes + ' ' + v.sha256]));
    return [stage, held];
  }));
};

test('the ten seeded programs: each one through the standard history, twice the same, leaves its golden bytes', () => {
  zone('America/New_York');
  const out: Record<string, unknown> = {};
  assert.equal(Object.keys(PROGRAMS).length, 10);
  for (const [name, seeded] of Object.entries(PROGRAMS)) {
    // The seeded swim goal carries no timed 500, which the wizard requires before it builds (doGenerate refuses it:
    // "Required. Enter your most recent timed 500yd."). This walk goes through the wizard's own last tap, so it gets
    // one, 10:30, as an athlete would type it. Its grid is therefore not the program-output golden's.
    const cfg: Cfg = seeded.cardioGoals.swim ? { ...seeded, cardioGoals: { ...seeded.cardioGoals, swim: { ...seeded.cardioGoals.swim, baseMins: '10', baseSecs: '30' } } } : seeded;
    const a = life(cfg, CREATED), b = life(cfg, CREATED);
    assert.deepStrictEqual(a.phone.dump(), b.phone.dump(), name + ': two runs of one history store the same bytes');
    const last = a.records['4 after two weeks away']!;
    assert.ok(Object.keys(last.keys).some((k) => k.startsWith('ia_logs_')), name + ': the history logged something');
    assert.ok(Object.keys(last.keys).some((k) => k.startsWith('ia_comp_')), name + ': and marked a day');
    out[name] = hashes(a.records);
  }
  matchSnapshot('stored-state-programs', { zone: 'America/New_York', created: CREATED, programs: out });
});

test('three time zones: the same history prescribes the same grid in each, and each zone leaves its golden bytes', () => {
  const out: Record<string, unknown> = {};
  const grids: Record<string, string[]> = {};
  for (const tz of ['America/New_York', 'Pacific/Auckland', 'UTC']) {
    zone(tz);
    const a = life(fixtures.HALF_MANNY, CREATED);
    out[tz] = hashes(a.records);
    grids[tz] = Object.values(a.records).map((r) => r.live!.week + ' ' + r.live!.digest);
  }
  zone('America/New_York');
  // Typed by hand: where the phone is does not change what a week prescribes or which week it is at 18:00 local.
  assert.deepStrictEqual(grids['Pacific/Auckland'], grids['America/New_York']);
  assert.deepStrictEqual(grids['UTC'], grids['America/New_York']);
  matchSnapshot('stored-state-zones', { created: CREATED, zones: out });
});

test('a sample of the lattice (every 36th of 864 configs): each through the standard history, twice the same', () => {
  zone('America/New_York');
  const LATTICE: { FULL: { tag: string; over: Partial<Cfg> }[] } = createRequire(import.meta.url)('../lattice193.js');
  assert.equal(LATTICE.FULL.length, 864);
  const sample = LATTICE.FULL.filter((_, i) => i % 36 === 7);
  assert.equal(sample.length, 24);
  const out: Record<string, unknown> = {};
  for (const cell of sample) {
    const cfg = { ...fixtures.HALF_MANNY, ...cell.over } as Cfg;
    const a = life(cfg, CREATED), b = life(cfg, CREATED);
    assert.deepStrictEqual(a.phone.dump(), b.phone.dump(), cell.tag + ': two runs of one history store the same bytes');
    out[cell.tag] = hashes(a.records);
  }
  matchSnapshot('stored-state-lattice', { zone: 'America/New_York', created: CREATED, programs: out });
});
