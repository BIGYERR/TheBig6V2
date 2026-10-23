// Program shape, swept: every program the engine builds across the shared 864-config lattice (tests/lattice193.js FULL:
// eight injury cells, six equipment tiers, two focuses, three experience levels, three seeds, on HALF_MANNY) and across
// every cardio goal the wizard offers, crossed with every lifting focus, has the domain shape (core/src/domain). The
// fast cut of this test is tests/integration/program-shape.test.ts; this one runs in CI only.
//
// Oracles: the hand-written checks in core/src/domain/shape.ts; the lattice's own cell count; the wizard's goal and
// focus lists, typed here by hand.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'vitest';
import { checkProgram } from '@ia/core';
import type { CardioGoal, Cfg, Equipment, Experience, LiftingFocus } from '@ia/core';
import { fixtures, loadApp, pinClock } from '../support/app.ts';
import { DAYS, RUN } from '../support/programs.ts';

interface LatticeCell {
  tag: string;
  over: Partial<Cfg>;
}
const LATTICE: { FULL: LatticeCell[]; FULL_N: number } = createRequire(import.meta.url)('../lattice193.js');

const IA = loadApp();
pinClock(IA, new Date(2026, 9, 11, 12, 0, 0));

/** Builds each config and checks its program; returns the problems (at most `cap`) and what the walks reached. */
function sweep(cfgs: { tag: string; cfg: Cfg }[], cap = 20) {
  const problems: string[] = [];
  const walked: Record<string, number> = {};
  const goalIds = new Set<string>();
  for (const { tag, cfg } of cfgs) {
    const prog = IA.buildProgram(cfg);
    const report = checkProgram(prog);
    for (const p of report.problems) if (problems.length < cap) problems.push(`${tag}: ${p}`);
    for (const [k, n] of Object.entries(report.walked)) walked[k] = (walked[k] ?? 0) + n;
    for (const week of Object.values(prog.weeks)) for (const day of Object.values(week)) if ('cardio' in day && day.cardio) goalIds.add(day.cardio.goalId);
  }
  return { problems, walked, goalIds };
}

test('every program on the 864-config lattice has the domain shape', () => {
  assert.equal(LATTICE.FULL.length, 864, 'the lattice is 8 injury cells x 6 tiers x 2 focuses x 3 levels x 3 seeds');
  assert.equal(LATTICE.FULL_N, 864);
  const { problems, walked } = sweep(LATTICE.FULL.map((c) => ({ tag: c.tag, cfg: { ...fixtures.HALF_MANNY, ...c.over } as Cfg })));
  assert.deepEqual(problems, []);
  assert.equal(walked['program'], 864);
  assert.ok((walked['item'] ?? 0) > 0);
});

/** Every goal the wizard offers (CARDIO_GOALS_BY_TYPE), with the inputs its goal needs. */
const GOALS: Record<string, CardioGoal> = {
  run_5k: RUN.k5, run_10k: RUN.k10, run_half: { id: 'run_half', label: 'Half', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' },
  run_marathon: RUN.marathon, run_pace_goal: RUN.pace, run_base: RUN.base,
  bike_century: { id: 'bike_century' }, bike_50: { id: 'bike_50' }, bike_ftp: { id: 'bike_ftp', ftp: '200' }, bike_cals: { id: 'bike_cals' }, bike_base: { id: 'bike_base' },
  swim_tri: { id: 'swim_tri' }, swim_mile: { id: 'swim_mile' }, swim_100_time: { id: 'swim_100_time', targetMins: '1', targetSecs: '45', swimUnit: 'yd' },
  swim_500_time: { id: 'swim_500_time', targetMins: '9', targetSecs: '0', swimUnit: 'yd' }, swim_base: { id: 'swim_base' },
};
const RACES: Record<string, string> = { run_5k: '2026-11-15', run_10k: '2026-11-29', run_half: '2026-12-06', run_marathon: '2027-02-28', bike_century: '2027-03-01', swim_tri: '2027-01-10' };
const FOCUSES: LiftingFocus[] = ['strength', 'hypertrophy', 'fatloss', 'balanced', 'support_strength', 'support_athletic', 'support_prevention'];
const TIERS: Equipment[] = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const LEVELS: Experience[] = ['beginner', 'intermediate', 'advanced'];

test('every cardio goal and lifting focus, alone and mixed, builds a program with the domain shape', () => {
  const goalSets: string[][] = [[], ...Object.keys(GOALS).map((g) => [g]), ['run_base', 'bike_base'], ['run_5k', 'swim_base'], ['run_base', 'bike_ftp', 'swim_base']];
  const cfgs: { tag: string; cfg: Cfg }[] = [];
  let n = 0;
  for (const set of goalSets) {
    for (const focus of FOCUSES) {
      n++;
      const cardioGoals: Cfg['cardioGoals'] = {};
      for (const g of set) cardioGoals[g.split('_')[0] as 'run' | 'bike' | 'swim'] = GOALS[g];
      const race = set.map((g) => RACES[g]).find(Boolean);
      const cfg: Cfg = {
        name: 'SWEEP', primaryPath: race ? 'event' : 'body', cardioTypes: Object.keys(cardioGoals) as Cfg['cardioTypes'], cardioGoals,
        eventTargeted: !!race, liftingFocus: focus, experience: LEVELS[n % 3] as Experience, ageBracket: '18-35',
        equipment: TIERS[n % 6] as Equipment, unit: n % 2 ? 'lbs' : 'kg', restDays: ['sun'], days: DAYS.slice(),
        bench: 135, squat: 155, deadlift: 185, seed: 1000 + n,
      };
      if (race) cfg.raceDate = race;
      if (n % 3 === 1) cfg.injury = { region: 'knee', tier: 'protect' };
      cfgs.push({ tag: `${set.join('+') || 'no cardio'} / ${focus}`, cfg });
    }
  }
  assert.equal(cfgs.length, 20 * 7, '20 goal sets x 7 focuses');
  const { problems, walked, goalIds } = sweep(cfgs);
  assert.deepEqual(problems, []);
  assert.equal(walked['program'], 140);
  assert.deepEqual([...goalIds].sort(), Object.keys(GOALS).sort(), 'every goal put at least one session on the calendar');
});
