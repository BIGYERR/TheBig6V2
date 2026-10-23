// The seeded configs the program tests build: Mario's live program (fixtures.HALF_MANNY) and a small lattice of other
// configs, typed as @ia/core's Cfg. tests/integration/program-output.test.ts holds their output against
// tests/snapshots/program-output.json, keyed by the names below; tests/integration/program-shape.test.ts walks them
// through the domain types. Every config pins its seed, and the values are typed by hand, never derived from the app.
import type { CardioGoal, CardioGoals, Cfg, DayKey, Equipment, Experience, LiftingFocus } from '@ia/core';
import { fixtures } from './app.ts';

export const DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export const RUN = {
  k5: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  k10: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
} satisfies Record<string, CardioGoal>;

interface Axes {
  goals: CardioGoals;
  race?: string;
  focus: LiftingFocus;
  experience: Experience;
  age?: string;
  equipment: Equipment;
  rest: DayKey[];
  seed: number;
}

/** A config the way the wizard writes one, with every axis named and the seed pinned. */
export function cfg(o: Axes): Cfg {
  const c: Cfg = {
    name: 'SNAPSHOT', primaryPath: o.race ? 'event' : 'fitness', cardioTypes: Object.keys(o.goals) as Cfg['cardioTypes'],
    cardioGoals: o.goals, eventTargeted: !!o.race, liftingFocus: o.focus, experience: o.experience,
    ageBracket: o.age || '18-35', equipment: o.equipment, unit: 'lbs', restDays: o.rest, days: DAYS.slice(),
    bench: 135, squat: 155, deadlift: 185, seed: o.seed,
  };
  if (o.race) c.raceDate = o.race;
  return c;
}

/** Name -> config. Names say what each one covers; the program-output snapshot is keyed by them. */
export const PROGRAMS: Record<string, Cfg> = {
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
