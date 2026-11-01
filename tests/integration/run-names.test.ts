// Run names (D269, docs/decisions/run-names.md): every run on the 5K and 10K plans is named in the app's own words.
// The headline of a speed run is line 1 of its detail (what the compact renderers read); a long run's label is the first
// words of its detail. The ten strings carried over from the source plans are gone from the plan tables, and the
// ruling's After column is what the tables hold and what the cards print.
//
// Oracles: the Before and After strings typed here from the ruling's table. The tables are read from the engine's own
// module (core/src/engine/nrc-race-bike-swim.ts, through tests/support/engine-modules.ts, so IA_ENGINE_SOURCES runs
// this part against another copy of the sources); the cards are read from programs the page builds (IA_APP). A plan
// prints a table row only on the weeks its race alignment and run days reach, so the card part names the rows the
// seeded 5K and 10K programs do print, measured on the candidate, and the table part covers every row.
import assert from 'node:assert/strict';
import type { Cfg, Program } from '@ia/core';
import { describe, test } from 'vitest';
import { loadApp, pinClock } from '../support/app.ts';
import { engineFile } from '../support/engine-modules.ts';
import { PROGRAMS } from '../support/programs.ts';

type NrcWeek = { long: { label: string }; speed: { detail: string }[] };
type Tables = { NRC_5K_TABLE: NrcWeek[]; NRC_10K_TABLE: NrcWeek[] };
const tables = (await import(engineFile('nrc-race-bike-swim'))) as Tables;

const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));

/** The source plans' own names, which no table holds and no program prints (D269, the Before column). */
const GONE = [
  'On the Move', 'Faster Fun', 'How Fartlek Can You Go', 'Rhythm and Roll', 'In the Zone', 'Go Fast',
  'Slow Down to Speed Up', 'Just A Run', 'Fuel the Run',
];

/** The After column, by table, week (1-based) and speed slot: what line 1 of the session's detail reads. */
const HEADLINES: [keyof Tables, number, number, string][] = [
  ['NRC_5K_TABLE', 2, 0, 'Mile bursts between 5K and 10K reps — 6:00 of work, 7 efforts'],
  ['NRC_5K_TABLE', 2, 1, 'Descending Mile reps with 10K floats — 8:00 of work, 9 efforts'],
  ['NRC_5K_TABLE', 3, 0, 'Fartlek, recovery equals the effort — 9:15 of work, 14 efforts'],
  ['NRC_5K_TABLE', 4, 0, '5K bursts around a 3:00 10K rep — 8:00 of work, 11 efforts'],
  ['NRC_5K_TABLE', 5, 0, '5 × 4:00 at 5K Pace — 20:00 of work'],
  ['NRC_5K_TABLE', 6, 0, 'Mile reps growing 0:30 → 1:30, each chased by 0:15 at Best — 6:15 of work'],
  ['NRC_10K_TABLE', 3, 0, 'Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts'],
  ['NRC_10K_TABLE', 3, 1, 'Fartlek, recovery equals the effort — 9:15 of work, 14 efforts'],
];

/** The After column's two long-run labels, by week of the 5K table. */
const LABELS: [number, string][] = [[4, '30 Minute Run'], [5, '33 Minute Run']];

/** What the seeded 5K and 10K programs print of the After column (the rows their alignment reaches). */
const ON_THE_CARD: [RegExp, string][] = [
  [/^5k race/, 'Descending Mile reps with 10K floats — 8:00 of work, 9 efforts'],
  [/^5k race/, '30 Minute Run: 30-minute run'],
  [/^5k race/, '33 Minute Run: 33-minute run'],
  [/^10k race/, 'Descending ladder 10K → 5K → Mile → Best — 15:30 of work, 7 efforts'],
  [/^10k race/, 'Fartlek, recovery equals the effort — 9:15 of work, 14 efforts'],
];

/** Every cardio session's detail and subtype, in week order. */
function cardioText(prog: Program): { detail: string; subtype: string }[] {
  const out: { detail: string; subtype: string }[] = [];
  for (const week of Object.values(prog.weeks)) {
    for (const day of Object.values(week)) if (day.cardio) out.push({ detail: day.cardio.detail, subtype: day.cardio.subtype });
  }
  return out;
}

function seeded(name: RegExp): Cfg {
  const key = Object.keys(PROGRAMS).find((k) => name.test(k));
  assert.ok(key, `a seeded config matching ${name}`);
  return PROGRAMS[key] as Cfg;
}

describe('the plan tables name every run in the app\'s own words (D269)', () => {
  for (const [table, week, slot, headline] of HEADLINES) {
    test(`${table} week ${week} speed ${slot + 1} reads "${headline}"`, () => {
      const row = tables[table][week - 1];
      assert.ok(row, `${table} has a week ${week}`);
      const session = row.speed[slot];
      assert.ok(session, `${table} week ${week} has a speed session ${slot + 1}`);
      assert.equal(session.detail.split('\n')[0], headline);
    });
  }

  for (const [week, label] of LABELS) {
    test(`NRC_5K_TABLE week ${week}'s long run is labelled "${label}"`, () => {
      assert.equal(tables.NRC_5K_TABLE[week - 1]?.long.label, label);
    });
  }

  test('no table holds a name carried over from the source plans', () => {
    for (const table of ['NRC_5K_TABLE', 'NRC_10K_TABLE'] as const) {
      for (const [i, row] of tables[table].entries()) {
        for (const gone of GONE) {
          assert.ok(!row.long.label.includes(gone), `${table} week ${i + 1} long run: "${gone}"`);
          for (const s of row.speed) assert.ok(!s.detail.includes(gone), `${table} week ${i + 1}: "${gone}" in ${JSON.stringify(s.detail.split('\n')[0])}`);
        }
      }
    }
  });
});

describe('the cards print those names (D269)', () => {
  test('no program prints a name carried over from the source plans', () => {
    for (const [name, cfg] of Object.entries(PROGRAMS)) {
      for (const s of cardioText(IA.buildProgram(cfg))) {
        for (const gone of GONE) {
          assert.ok(!s.detail.includes(gone), `${name}: "${gone}" in ${JSON.stringify(s.detail.split('\n')[0])}`);
          assert.ok(!s.subtype.includes(gone), `${name}: "${gone}" in subtype ${s.subtype}`);
        }
      }
    }
  });

  for (const [program, text] of ON_THE_CARD) {
    test(`the seeded ${program.source.replace(/\W/g, ' ').trim()} program prints "${text}"`, () => {
      const details = cardioText(IA.buildProgram(seeded(program))).map((s) => s.detail);
      assert.ok(details.some((d) => d.startsWith(text)), `details printed: ${JSON.stringify(details.map((d) => d.split('\n')[0]?.slice(0, 60)))}`);
    });
  }
});
