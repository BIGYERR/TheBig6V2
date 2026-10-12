'use strict';
// Program output: what buildProgram prescribes for Mario's live program (fixtures.HALF_MANNY) and a small seeded
// lattice of other configs, against the golden file tests/snapshots/program-output.json. Rulings that move program
// output: docs/decisions/program-output.md.
//
// This replaces the per-release HALF_MANNY digest tables (MANNY_DIGEST_BY_VERSION and its era rows) for new work: one
// current golden file in git. When a ruling changes what a program prescribes, regenerate it on purpose and review the
// diff, which shows the digest and every week-grid line that moved:
//
//   UPDATE_SNAPSHOTS=1 node --test tests/integration/program-output.test.js
//   git diff tests/snapshots/program-output.json
//
// Determinism: every config pins cfg.seed; progDigest strips the clock fields (id, created); the app's clock is pinned
// to one local noon; and each program is built twice and must equal itself before it is compared with anything.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp, pinClock, fixtures, weekGrid, progDigest } = require('../support/app.js');
const { matchSnapshot } = require('../support/snapshot.js');

/** The day every build sees as today (local time). The digests below do not depend on it; pinning keeps it so. */
const TODAY = new Date(2026, 9, 11, 12, 0, 0);

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const RUN = {
  k5: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  k10: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
};

/** A config the way the wizard writes one, with every axis named and the seed pinned. */
function cfg(o) {
  const c = {
    name: 'SNAPSHOT', primaryPath: o.race ? 'event' : 'fitness', cardioTypes: Object.keys(o.goals),
    cardioGoals: o.goals, eventTargeted: !!o.race, liftingFocus: o.focus, experience: o.experience,
    ageBracket: o.age || '18-35', equipment: o.equipment, unit: 'lbs', restDays: o.rest, days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: o.seed,
  };
  if (o.race) c.raceDate = o.race;
  return c;
}

/** Name -> config. Names say what each one covers; the snapshot is keyed by them. */
const PROGRAMS = {
  'half-manny (Mario, NRC half, crossfit)': fixtures.HALF_MANNY,
  '5k race, commercial, strength, beginner': cfg({ goals: { run: RUN.k5 }, race: '2026-11-15', focus: 'strength', experience: 'beginner', equipment: 'commercial', rest: ['sun'], seed: 1013 }),
  '10k race, home basic, hypertrophy, advanced': cfg({ goals: { run: RUN.k10 }, race: '2026-11-29', focus: 'hypertrophy', experience: 'advanced', equipment: 'home_basic', rest: ['sat', 'sun'], seed: 3039 }),
  'marathon, crossfit, athletic support, 36-45': cfg({ goals: { run: RUN.marathon }, race: '2027-02-28', focus: 'support_athletic', experience: 'intermediate', age: '36-45', equipment: 'crossfit', rest: ['mon', 'thu'], seed: 76308 }),
  '1.5 mile test goal, minimal, fat loss, beginner': cfg({ goals: { run: RUN.pace }, focus: 'fatloss', experience: 'beginner', equipment: 'minimal', rest: ['sun', 'wed'], seed: 1013 }),
  '1.5 mile test goal, commercial, balanced': cfg({ goals: { run: RUN.pace }, focus: 'balanced', experience: 'intermediate', equipment: 'commercial', rest: ['sun'], seed: 24865 }),
  'run base, bodyweight, balanced': cfg({ goals: { run: RUN.base }, focus: 'balanced', experience: 'intermediate', age: '36-45', equipment: 'bodyweight', rest: ['tue', 'fri', 'sun'], seed: 3039 }),
  'bike ftp, home full, strength support, advanced': cfg({ goals: { bike: { id: 'bike_ftp', label: 'FTP', ftp: '200' } }, focus: 'support_strength', experience: 'advanced', equipment: 'home_full', rest: ['sun'], seed: 76308 }),
  'swim 500, commercial, prevention support': cfg({ goals: { swim: { id: 'swim_500_time', label: '500', targetMins: '9', targetSecs: '0', swimUnit: 'yd' } }, focus: 'support_prevention', experience: 'intermediate', equipment: 'commercial', rest: ['sat', 'sun'], seed: 1013 }),
  'run base and bike base, crossfit, balanced': cfg({ goals: { run: RUN.base, bike: { id: 'bike_base', label: 'Base' } }, focus: 'balanced', experience: 'intermediate', equipment: 'crossfit', rest: ['sun', 'wed'], seed: 3039 }),
};

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
  const programs = {};
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
