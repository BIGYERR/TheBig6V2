// Measure: the swipe deck's day shapes (P-DECK, before the build; docs/decisions/swipe-deck.md, "Before the build").
// Builds every program on the shared 864-config lattice and on the other goals the snapshot configs cover, turns each
// training day into deck cards by the generator's own rule (docs/design/swipe-deck/deck-data.ts, board()), and prints:
// cards per day, rounds and blocks, the tallest block, cardio days split three ways (with lift work, cardio only, lift
// only), where the run sits by the app's order, and where a hinge lands in the deck and what comes before it.
// Under D272 the run is not a deck card, so "cards" counts lift work only; the finish card (Call it) is not counted.
// Run on any body of the app: node tests/measure/swipe-deck_day-shapes.js [app.html]
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
// The snapshot configs (tests/support/programs.ts), race dates moved 12 to 20 weeks past 2026-11-06 so each plan builds whole.
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

// The generator's card rule, sections to cards (deck-data.ts board()).
function deckOf(day) {
  const cards = [];
  for (const s of day.sections || []) {
    const items = s.items || [];
    const isMain = /^main/i.test(s.label || '');
    if (/mobility/i.test(s.label || '') && !isMain && !s.superset) { cards.push({ kind: 'cool', names: items.map((i) => i.name), n: items.length }); continue; }
    if (s.core || s.hip) { cards.push({ kind: 'block', names: items.map((i) => i.name), n: items.length }); continue; }
    if (s.superset && items.length > 1) { cards.push({ kind: 'round', names: items.map((i) => i.name), n: items.length }); continue; }
    items.forEach((it, k) => cards.push({ kind: 'lift', names: [it.name], n: 1, main: isMain && k === 0, label: s.label || '' }));
  }
  return cards;
}

const days = [];
let builds = 0;
function sweep(set, c, tag) {
  builds++;
  const p = IA.buildProgram(c);
  const runFirstRule = c.primaryPath === 'event' || /^support_/.test(String(c.liftingFocus || ''));
  for (const w of Object.keys(p.weeks)) for (const d of Object.keys(p.weeks[w])) {
    const day = p.weeks[w][d];
    if (!day || day.rest) continue;
    const cards = deckOf(day);
    const cardio = day.cardio ? [].concat(day.cardio) : [];
    const sports = cardio.map((x) => String(x.type || '').toLowerCase());
    const hinges = [];
    cards.forEach((cd, i) => cd.names.forEach((n) => {
      if (!HINGE.test(n)) return;
      const before = cards.slice(0, i);
      hinges.push({ pos: i + 1, kind: cd.kind, main: !!cd.main, name: n,
        lowerBefore: before.some((b) => b.names.some((m) => LOWER.test(m))), anyBefore: before.length > 0 });
    }));
    days.push({ set, tag, focus: c.liftingFocus, exp: c.experience, equip: c.equipment, goal: set === 'lattice' ? 'half (lattice)' : tag.split(' seed')[0],
      wk: +w, d, n: cards.length, rounds: cards.filter((x) => x.kind === 'round').length, blocks: cards.filter((x) => x.kind === 'block' || x.kind === 'cool').length,
      coolOnly: cards.length > 0 && cards.every((x) => x.kind === 'cool'), tallest: Math.max(0, ...cards.map((x) => x.n)),
      sports, hasCardio: cardio.length > 0, runFirst: cardio.length > 0 && cards.length > 0 && runFirstRule, hinges, title: day.title });
  }
}
for (const c of L.FULL) sweep('lattice', { ...IA.fixtures.HALF_MANNY, ...c.over }, 'lattice ' + c.tag);
for (const [name, o] of Object.entries(OTHER)) for (const seed of SEEDS) sweep('other', cfg({ ...o, seed }), name + ' seed=' + seed);

// HALF_MANNY itself, for the digest line and its own day shapes.
const HM = IA.buildProgram(IA.fixtures.HALF_MANNY);
const digest = H.progDigest(HM);

const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : 'n/a';
const q = (arr, f) => { const s = arr.slice().sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(f * s.length))] : 0; };
const hist = (arr) => { const h = {}; arr.forEach((x) => { h[x] = (h[x] || 0) + 1; }); return Object.keys(h).sort((a, b) => +a - +b).map((k) => k + ':' + h[k]).join(' '); };
const out = [];
const P = (...a) => out.push(a.join(' '));
P('METHOD tests/measure/swipe-deck_day-shapes.js on', path.basename(app), '| builds', builds, '| training days', days.length, '| HALF_MANNY digest', digest);
for (const set of ['lattice', 'other']) {
  const D = days.filter((x) => x.set === set);
  const withLift = D.filter((x) => x.n > 0);
  P('');
  P('== SET', set, '| training days', D.length);
  P('cards per lift deck (finish card not counted), n=' + withLift.length + ':', 'min', q(withLift.map((x) => x.n), 0), 'median', q(withLift.map((x) => x.n), 0.5), 'p90', q(withLift.map((x) => x.n), 0.9), 'max', Math.max(...withLift.map((x) => x.n)));
  P('  histogram', hist(withLift.map((x) => x.n)));
  P('rounds per deck', hist(withLift.map((x) => x.rounds)), '| blocks per deck', hist(withLift.map((x) => x.blocks)));
  P('tallest card (movements in one round or block)', hist(withLift.map((x) => x.tallest)));
  const cardioLift = D.filter((x) => x.hasCardio && x.n > 0), cardioOnly = D.filter((x) => x.hasCardio && x.n === 0), liftOnly = D.filter((x) => !x.hasCardio && x.n > 0);
  P('day kinds: cardio + lift', cardioLift.length, pct(cardioLift.length, D.length), '| cardio only', cardioOnly.length, pct(cardioOnly.length, D.length), '| lift only', liftOnly.length, pct(liftOnly.length, D.length));
  const coolOnly = D.filter((x) => x.coolOnly);
  P('decks that are only the cool down', coolOnly.length, pct(coolOnly.length, withLift.length));
  const sportH = {}; D.filter((x) => x.hasCardio).forEach((x) => x.sports.forEach((s) => { sportH[s] = (sportH[s] || 0) + 1; }));
  P('cardio sessions by sport', JSON.stringify(sportH));
  P('cardio + lift days with the run first by the app order', cardioLift.filter((x) => x.runFirst).length, 'of', cardioLift.length);
  const hz = D.flatMap((x) => x.hinges.map((h) => Object.assign({ goal: x.goal, focus: x.focus, title: x.title }, h)));
  P('hinge movements', hz.length, '| position in the deck', hist(hz.map((h) => h.pos)));
  P('  as the Main card', hz.filter((h) => h.main).length, '| as a single non-main lift card', hz.filter((h) => h.kind === 'lift' && !h.main).length, '| inside a round', hz.filter((h) => h.kind === 'round').length, '| inside a block', hz.filter((h) => h.kind === 'block' || h.kind === 'cool').length);
  const late = hz.filter((h) => h.pos >= 4);
  P('  at card 4 or later', late.length, pct(late.length, hz.length), '| of those with no lower body card before', late.filter((h) => !h.lowerBefore).length);
  const cold = hz.filter((h) => !h.main && !h.lowerBefore);
  P('  not the Main card and no lower body card before it', cold.length, pct(cold.length, hz.length));
  const byName = {}; cold.forEach((h) => { const k = h.name + ' @' + h.pos + ' ' + h.kind + ' (' + h.title + ')'; byName[k] = (byName[k] || 0) + 1; });
  Object.entries(byName).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => P('    ', v, k));
  if (set === 'other') {
    const byGoal = {}; D.forEach((x) => { const g = byGoal[x.goal] = byGoal[x.goal] || { days: 0, lift: 0, max: 0, cardioOnly: 0 }; g.days++; if (x.n > 0) g.lift++; g.max = Math.max(g.max, x.n); if (x.hasCardio && x.n === 0) g.cardioOnly++; });
    Object.entries(byGoal).forEach(([g, v]) => P('  goal', g, '| days', v.days, '| with a deck', v.lift, '| cardio only', v.cardioOnly, '| most cards', v.max));
  } else {
    const seg = (key) => { const g = {}; withLift.forEach((x) => { (g[x[key]] = g[x[key]] || []).push(x.n); }); return Object.entries(g).map(([k, v]) => k + ' median ' + q(v, 0.5) + ' max ' + Math.max(...v)).join(' | '); };
    P('  by focus:', seg('focus')); P('  by experience:', seg('exp')); P('  by equipment:', seg('equip'));
  }
}
// HALF_MANNY's own week 10, as the canvas shows it.
P('');
P('== HALF_MANNY week 10 (the canvas)');
for (const d of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']) {
  const day = HM.weeks['10'][d];
  if (!day || day.rest) { P(d, 'rest'); continue; }
  const cards = deckOf(day);
  P(d, day.title, '|', cards.length, 'cards:', cards.map((x) => x.kind + (x.main ? '*' : '') + '(' + x.names.join(' / ').slice(0, 40) + ')').join(' '), day.cardio ? '| cardio ' + [].concat(day.cardio).map((x) => x.subtype || x.type).join('+') : '');
}
console.log(out.join('\n'));
