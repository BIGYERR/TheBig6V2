// Measure for D292 P-WATCHIMPORT (docs/decisions/watch-import.md): which hand log form each prescribed run opens.
// A watch import may fill only what the day's own hand log would have written, so this counts, per program, the runs
// by the form doseFromCardio picks for them (time, dist, reps_dist, reps_time, or none: the distance and pace form).
//
//   node tests/measure/watch-import_run-forms.js [page]      (default: the root index.html)
//
// The programs are the run goals of tests/support/programs.ts, typed here as config inputs, and the harness's
// HALF_MANNY. doseFromCardio is lifted out of the page as it ships, so the count is the app's own.
'use strict';
const fs = require('fs');
const path = require('path');
const { load, fixtures } = require('../harness.js');

const page = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(page);
const html = fs.readFileSync(page, 'utf8');
const start = html.indexOf('function doseFromCardio(');
const end = html.indexOf('function doseDerived(', start);
if (start < 0 || end < 0) throw new Error('doseFromCardio not found in ' + page);
const doseFromCardio = new Function(html.slice(start, end) + '\nreturn doseFromCardio;')();

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const RUN = {
  k5: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  k10: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
};
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
const PROGRAMS = {
  'half-manny': fixtures.HALF_MANNY,
  '5k race': cfg({ goals: { run: RUN.k5 }, race: '2026-11-15', focus: 'strength', experience: 'beginner', equipment: 'commercial', rest: ['sun'], seed: 1013 }),
  '10k race': cfg({ goals: { run: RUN.k10 }, race: '2026-11-29', focus: 'hypertrophy', experience: 'advanced', equipment: 'home_basic', rest: ['sat', 'sun'], seed: 3039 }),
  'marathon': cfg({ goals: { run: RUN.marathon }, race: '2027-02-28', focus: 'support_athletic', experience: 'intermediate', age: '36-45', equipment: 'crossfit', rest: ['mon', 'thu'], seed: 76308 }),
  '1.5 mile test (fat loss)': cfg({ goals: { run: RUN.pace }, focus: 'fatloss', experience: 'beginner', equipment: 'minimal', rest: ['sun', 'wed'], seed: 1013 }),
  '1.5 mile test (balanced)': cfg({ goals: { run: RUN.pace }, focus: 'balanced', experience: 'intermediate', equipment: 'commercial', rest: ['sun'], seed: 24865 }),
  'run base': cfg({ goals: { run: RUN.base }, focus: 'balanced', experience: 'intermediate', age: '36-45', equipment: 'bodyweight', rest: ['tue', 'fri', 'sun'], seed: 3039 }),
};

const total = {};
for (const [name, c] of Object.entries(PROGRAMS)) {
  const prog = IA.buildProgram(JSON.parse(JSON.stringify(c)));
  const byForm = {}, bySub = {};
  let runs = 0;
  for (const w of Object.keys(prog.weeks)) for (const d of DAYS) {
    const day = prog.weeks[w][d];
    const car = day && !day.rest && day.cardio;
    if (!car || String(car.type).toLowerCase() !== 'run') continue;
    runs++;
    const dose = doseFromCardio(car);
    const form = dose ? dose.k : 'none';
    byForm[form] = (byForm[form] || 0) + 1;
    total[form] = (total[form] || 0) + 1;
    const sub = String(car.subtype || '?').replace(/\s+\d.*$/, '');
    const label = sub + ' -> ' + form + (car.dose && car.dose.key ? ' (' + car.dose.key + ')' : '');
    bySub[label] = (bySub[label] || 0) + 1;
  }
  console.log(name + ': ' + runs + ' runs, ' + JSON.stringify(byForm));
  console.log('  ' + Object.entries(bySub).sort().map(([k, v]) => k + ' ' + v).join('; '));
}
console.log('ALL: ' + JSON.stringify(total));
