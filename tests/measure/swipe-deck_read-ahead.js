// Measure: coach's read-ahead question for the swipe deck (P-DECK, docs/decisions/swipe-deck.md, "Before the build").
// The deck shows one card at a time. Does a hinge met cold, late in the deck, break hard days hard? This prints every
// hinge on card 4 or later with the cards before it, every hinge with no lower body card before it that is not the Main
// card, the load class of each (barbell, dumbbell or kettlebell, bodyweight), the day's run, and the same for HALF_MANNY
// alone. Cards are counted by the generator's rule (tests/measure/swipe-deck_day-shapes.js, deckOf), lift work only.
// Run on any body of the app: node tests/measure/swipe-deck_read-ahead.js [app.html]
'use strict';
const path = require('path');
const H = require('../harness.js');
const L = require('../lattice193.js');
const app = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = H.load(app);

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
};
const SEEDS = [1013, 3039, 76308];
const HINGE = /deadlift|\brdl\b|romanian|good morning|kettlebell swing|\bswing\b|hip hinge|pull-through|single-leg deadlift/i;
const LOWER = /squat|lunge|deadlift|\brdl\b|romanian|step|hip thrust|bridge|swing|calf|split|good morning|leg/i;
const loadClass = (n) => /barbell|trap bar|^deadlift$|^sumo deadlift$|^romanian deadlift$/i.test(n) ? 'barbell'
  : /dumbbell|db\b|kettlebell|\bkb\b/i.test(n) ? 'db/kb' : /band|cable/i.test(n) ? 'band/cable' : 'other';

function deckOf(day) {
  const cards = [];
  for (const s of day.sections || []) {
    const items = s.items || [];
    const isMain = /^main/i.test(s.label || '');
    if (/mobility/i.test(s.label || '') && !isMain && !s.superset) { cards.push({ kind: 'cool', names: items.map((i) => i.name) }); continue; }
    if (s.core || s.hip) { cards.push({ kind: 'block', names: items.map((i) => i.name) }); continue; }
    if (s.superset && items.length > 1) { cards.push({ kind: 'round', names: items.map((i) => i.name) }); continue; }
    items.forEach((it, k) => cards.push({ kind: 'lift', names: [it.name], main: isMain && k === 0, detail: it.detail }));
  }
  return cards;
}
const late = [], cold = [];
let hingeN = { lattice: 0, other: 0 };
function sweep(set, c, tag) {
  const p = IA.buildProgram(c);
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d];
    if (!day || day.rest) continue;
    const cards = deckOf(day);
    const run = day.cardio ? [].concat(day.cardio).map((x) => x.subtype || x.type).join('+') : '';
    cards.forEach((cd, i) => cd.names.forEach((n) => {
      if (!HINGE.test(n)) return;
      hingeN[set]++;
      const before = cards.slice(0, i);
      const lowerBefore = before.some((b) => b.names.some((m) => LOWER.test(m)));
      const row = { set, tag: tag.split(' seed')[0], w: +w, d, pos: i + 1, kind: cd.kind, main: !!cd.main, name: n, load: loadClass(n), lowerBefore,
        before: before.map((b) => b.kind + ':' + b.names.join('/')).join(' | '), title: day.title, run };
      if (i + 1 >= 4) late.push(row);
      if (!cd.main && !lowerBefore) cold.push(row);
    }));
  }
}
for (const c of L.FULL) sweep('lattice', { ...IA.fixtures.HALF_MANNY, ...c.over }, 'lattice ' + c.tag);
for (const [name, o] of Object.entries(OTHER)) for (const seed of SEEDS) sweep('other', cfg({ ...o, seed }), name + ' seed=' + seed);

const out = [];
const P = (...a) => out.push(a.join(' '));
const tally = (rows, f) => { const h = {}; rows.forEach((r) => { const k = f(r); h[k] = (h[k] || 0) + 1; }); return Object.entries(h).sort((a, b) => b[1] - a[1]); };
P('METHOD tests/measure/swipe-deck_read-ahead.js on', path.basename(app), '| HALF_MANNY digest', H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)));
for (const set of ['lattice', 'other']) {
  const L4 = late.filter((r) => r.set === set), C = cold.filter((r) => r.set === set);
  P('');
  P('== SET', set, '| hinge movements', hingeN[set]);
  P('card 4 or later:', L4.length, '| no lower body card before', L4.filter((r) => !r.lowerBefore).length, '| load', JSON.stringify(Object.fromEntries(tally(L4, (r) => r.load))));
  tally(L4, (r) => (r.lowerBefore ? 'after lower' : 'NO LOWER BEFORE') + ' | ' + r.tag + ' | ' + r.title + ' | card ' + r.pos + ' ' + r.kind + ' ' + r.name + ' | run ' + (r.run || 'none') + ' | before: ' + r.before.slice(0, 160))
    .slice(0, 14).forEach(([k, v]) => P('  ', v, k));
  P('not Main, no lower body before:', C.length, '| by card', JSON.stringify(Object.fromEntries(tally(C, (r) => r.pos))), '| load', JSON.stringify(Object.fromEntries(tally(C, (r) => r.load))), '| by kind', JSON.stringify(Object.fromEntries(tally(C, (r) => r.kind))));
  tally(C, (r) => r.name + ' (' + r.load + ') card ' + r.pos + ' ' + r.kind).slice(0, 10).forEach(([k, v]) => P('  ', v, k));
  P('  runs on those days:', JSON.stringify(Object.fromEntries(tally(C, (r) => String(r.run || 'none').replace(/ — .*/, '')).slice(0, 8))));
}
// HALF_MANNY alone (Mario's live program).
const HM = IA.buildProgram(IA.fixtures.HALF_MANNY);
const hm = [];
for (const w of Object.keys(HM.weeks)) for (const d of Object.keys(HM.weeks[w])) {
  const day = HM.weeks[w][d]; if (!day || day.rest) continue;
  const cards = deckOf(day);
  cards.forEach((cd, i) => cd.names.forEach((n) => { if (HINGE.test(n)) hm.push({ w, d, pos: i + 1, main: !!cd.main, kind: cd.kind, n, title: day.title, lowerBefore: cards.slice(0, i).some((b) => b.names.some((m) => LOWER.test(m))) }); }));
}
P('');
P('== HALF_MANNY | hinges', hm.length, '| by card', JSON.stringify(Object.fromEntries(tally(hm, (r) => r.pos))), '| cold non-main', hm.filter((r) => !r.main && !r.lowerBefore).length);
tally(hm, (r) => 'card ' + r.pos + (r.main ? ' Main ' : ' ') + r.kind + ' ' + r.n + ' (' + r.title + ')' + (r.lowerBefore ? '' : ' no lower before')).forEach(([k, v]) => P('  ', v, k));
console.log(out.join('\n'));
