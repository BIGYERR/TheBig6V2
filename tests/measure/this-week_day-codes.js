// Measure: This Week's day strip under Mario's redesign (docs/decisions/this-week.md, before the build).
// Two questions. (1) The strip prints one word per day, never cut: what would each training day's word be, by the rule
// the redesign proposes (a day with a run wears its run's word, a lift only day its lift focus, a rest day REST), how
// long is the longest, and which days fall to a generic word? (2) Sunday first moves each program week's Sunday into the
// next title, so the program's last Sunday needs a title of its own: what does it hold, race or training or rest?
// Run on any body of the app: node tests/measure/this-week_day-codes.js [app.html]
'use strict';
const path = require('path');
const H = require('../harness.js');
const L = require('../lattice193.js');
const app = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(app);
const liftFocusCode = IA.eval("liftFocusCode");
const runSessionCode = IA.eval("runSessionCode");

const RUN = {
  k5: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '00', baselineDist: '3', baseline: '3mi' },
  k10: { id: 'run_10k', label: '10K', mileBestMins: '8', mileBestSecs: '30', baselineDist: '4', baseline: '4mi' },
  marathon: { id: 'run_marathon', label: 'Marathon', mileBestMins: '9', mileBestSecs: '00', baselineDist: '8', baseline: '8mi' },
  pace: { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', targetDist: '1.5', paceUnit: 'mi', targetMins: '12', targetSecs: '0', mileBestMins: '8', mileBestSecs: '15' },
  base: { id: 'run_base', label: 'Base', mileBestMins: '11', mileBestSecs: '0', baselineDist: '2', baseline: '2mi' },
};
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
function cfg(o) {
  const c = { name: 'MEASURE', primaryPath: o.race ? 'event' : 'fitness', cardioTypes: Object.keys(o.goals), cardioGoals: o.goals,
    eventTargeted: !!o.race, liftingFocus: o.focus, experience: o.experience, ageBracket: o.age || '18-35', equipment: o.equipment,
    unit: 'lbs', restDays: o.rest, days: DAYS.slice(), bench: 135, squat: 155, deadlift: 185, seed: o.seed };
  if (o.race) c.raceDate = o.race;
  return c;
}
const OTHER = {
  '5k race': { goals: { run: RUN.k5 }, race: '2027-01-31', focus: 'strength', experience: 'beginner', equipment: 'commercial', rest: ['sun'] },
  '10k race': { goals: { run: RUN.k10 }, race: '2027-02-14', focus: 'hypertrophy', experience: 'advanced', equipment: 'home_basic', rest: ['sat', 'sun'] },
  'marathon': { goals: { run: RUN.marathon }, race: '2027-03-28', focus: 'support_athletic', experience: 'intermediate', age: '36-45', equipment: 'crossfit', rest: ['mon', 'thu'] },
  '1.5 mi test, fat loss': { goals: { run: RUN.pace }, focus: 'fatloss', experience: 'beginner', equipment: 'minimal', rest: ['sun', 'wed'] },
  '1.5 mi test, balanced': { goals: { run: RUN.pace }, focus: 'balanced', experience: 'intermediate', equipment: 'commercial', rest: ['sun'] },
  'run base': { goals: { run: RUN.base }, focus: 'balanced', experience: 'intermediate', age: '36-45', equipment: 'bodyweight', rest: ['tue', 'fri', 'sun'] },
  'bike ftp': { goals: { bike: { id: 'bike_ftp', label: 'FTP', ftp: '200' } }, focus: 'support_strength', experience: 'advanced', equipment: 'home_full', rest: ['sun'] },
  'swim 500': { goals: { swim: { id: 'swim_500_time', label: '500', targetMins: '9', targetSecs: '0', swimUnit: 'yd' } }, focus: 'support_prevention', experience: 'intermediate', equipment: 'commercial', rest: ['sat', 'sun'] },
  'run + bike base': { goals: { run: RUN.base, bike: { id: 'bike_base', label: 'Base' } }, focus: 'balanced', experience: 'intermediate', equipment: 'crossfit', rest: ['sun', 'wed'] },
  'strength only': { goals: {}, focus: 'strength', experience: 'intermediate', equipment: 'commercial', rest: ['wed', 'sun'] },
  'strength, sunday trained': { goals: {}, focus: 'hypertrophy', experience: 'advanced', equipment: 'commercial', rest: ['wed'] },
};
const SEEDS = [1013, 3039, 76308];

// The proposed one word: a day with a run wears its run's word (the NRC session's base, the NSW session's chip), a bike
// or swim day its sport, a lift only day the lift focus the strip prints today, a rest day REST.
function word(day) {
  if (!day || day.rest) return 'REST';
  const c = day.cardio;
  if (c) {
    const sub = String(c.subtype || '');
    const type = String(c.type || '').toLowerCase();
    if (type === 'run') {
      if (/RACE DAY/.test(sub)) return 'RACE';
      if (/^Speed Run/.test(sub)) return 'SPEED';
      if (/^Long Run/.test(sub)) return 'LONG';
      if (/^Recovery Run/.test(sub)) return /shakeout/i.test(day.title || '') ? 'SHAKE' : 'RECOV';
      return runSessionCode(sub, c.dose && c.dose.key, c.type);
    }
    if (type === 'bike') return 'BIKE';
    if (type === 'swim') return 'SWIM';
  }
  return liftFocusCode(day.title);
}

const words = new Map();
const generic = new Map();
const liftOnly = new Map();
const lastSun = new Map();
let programs = 0;
let days = 0;
function tally(m, k, ex) {
  const e = m.get(k) || { n: 0, ex };
  e.n++;
  m.set(k, e);
}
function sweep(set, c, tag) {
  const p = IA.buildProgram(c);
  programs++;
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d];
    if (!day || day.rest) continue;
    days++;
    const wd = word(day);
    tally(words, wd, tag + ' wk' + w + ' ' + d + ' ' + (day.title || '') + (day.cardio ? ' / ' + day.cardio.subtype : ''));
    if (!day.cardio) tally(liftOnly, wd + ' <- ' + (day.title || ''), tag + ' wk' + w + ' ' + d);
    else if (wd === 'RUN' || wd === 'INT') tally(generic, wd + ' <- ' + String(day.cardio.type) + ' / ' + String(day.cardio.subtype || ''), tag + ' wk' + w + ' ' + d);
  }
  const last = p.weeks[p.totalWeeks] && p.weeks[p.totalWeeks].sun;
  const kind = !last ? 'none' : last.rest ? 'rest' : /RACE DAY/.test(String(last.cardio && last.cardio.subtype)) ? 'race' : 'training (' + word(last) + ')';
  tally(lastSun, set + ': ' + kind, tag);
}
for (const c of L.FULL) sweep('lattice', { ...IA.fixtures.HALF_MANNY, ...c.over }, 'lattice ' + c.tag);
for (const [name, o] of Object.entries(OTHER)) for (const seed of SEEDS) sweep('other', cfg({ ...o, seed }), name + ' seed=' + seed);

const out = [];
out.push('# This Week day strip: one word per day, and the last Sunday', '');
out.push('App: ' + path.basename(app) + ' (ia-version ' + (IA.IA_VERSION || '?') + '). Programs: ' + programs + ' (' + L.FULL.length +
  ' lattice, ' + (programs - L.FULL.length) + ' other). Training days: ' + days + '.', '');
out.push('## The word each training day would wear', '', '| word | letters | days | share | example |', '|---|---|---|---|---|');
for (const [k, e] of [...words.entries()].sort((a, b) => b[1].n - a[1].n))
  out.push('| ' + k + ' | ' + k.length + ' | ' + e.n + ' | ' + (100 * e.n / days).toFixed(1) + '% | ' + e.ex + ' |');
out.push('', 'Longest word: ' + Math.max(...[...words.keys()].map((k) => k.length)) + ' letters.', '');
out.push('## Lift only days: the title and the word it wears (a word no focus matched is the title cut to five letters)', '');
for (const [k, e] of [...liftOnly.entries()].sort((a, b) => b[1].n - a[1].n)) out.push('- ' + k + ': ' + e.n + ' (e.g. ' + e.ex + ')');
out.push('', '## Cardio days that fall to a generic word (RUN or INT): the sport and the session', '');
if (!generic.size) out.push('None.');
for (const [k, e] of [...generic.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 30)) out.push('- ' + k + ': ' + e.n + ' (e.g. ' + e.ex + ')');
out.push('', '## What the program\'s last Sunday holds', '', '| set: last Sunday | programs | example |', '|---|---|---|');
for (const [k, e] of [...lastSun.entries()].sort()) out.push('| ' + k + ' | ' + e.n + ' | ' + e.ex + ' |');
const text = out.join('\n') + '\n';
process.stdout.write(text);
require('fs').writeFileSync(path.join(__dirname, 'this-week_day-codes.md'), text);
