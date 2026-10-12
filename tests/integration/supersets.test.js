'use strict';
// Supersets: the round count is a field, never a substring (D39), and a bare remainder inside a round block reads
// "N reps" (D176). The resolver (_secRounds), its parsers (_itemSets, _stripLeadingSets, _setLeadingSets), the
// session time estimate (sessionTimeEst), the renderer (buildSectionsHTML) and the prevention dose sweep
// (preventionDoseSweep) are read here.
//
// Oracles: hand tables typed from the authoring contract, the reference parsers in tests/support/supersets.js, and
// source scans of the resolver seam with comments stripped. Nothing asks _secRounds what _secRounds should say.
// The lattice claims run on the 420-cell round-count lattice (tests/support/supersets.js), every cell built once.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadApp } = require('../support/app.js');
const S = require('../support/supersets.js');

const IA = loadApp();
const secRounds = (sec) => S.callApp(IA, '_secRounds', sec);
const timeEst = (day) => S.callApp(IA, 'sessionTimeEst', day);
const render = (secs) => S.callApp(IA, 'buildSectionsHTML', secs, 0);

test('the round count resolver: an authored count, then a count in the label, then the members, else none', () => {
  // Legacy rows carry uniform members so this stays a precedence test; the smallest-member rule is tested below.
  const table = [
    ['authored beats label', { label: 'Circuit 4 rounds', superset: true, rounds: 5, items: [{ detail: '2×10' }, { detail: '2×10' }] }, 5],
    ['authored beats members', { label: 'Pump', superset: true, rounds: 5, items: [{ detail: '3×10' }, { detail: '3×10' }] }, 5],
    ['label when no field', { label: 'Superset A — 4 rounds', superset: true, items: [{ detail: '2×10' }, { detail: '2×10' }] }, 4],
    ['label beats members', { label: '8 rounds carry complex', superset: true, items: [{ detail: '3×10' }, { detail: '3×10' }] }, 8],
    ['legacy members', { label: 'Pump', superset: true, items: [{ detail: '4×12' }, { detail: '4×12' }] }, 4],
    ['nothing parses', { label: 'Pump', superset: true, items: [{ detail: '15 reps' }, { detail: '10 reps' }] }, null],
    ['no items at all', { label: 'Pump', superset: true, items: [] }, null],
  ];
  for (const [why, sec, want] of table) assert.equal(secRounds(sec), want, why);
});

// ── the resolver seam carries no fallback constant (source scan, comments stripped) ─────────────────────────────
function fnBody(js, name) {
  const i = js.indexOf('function ' + name + '(');
  if (i < 0) return null;
  const j = js.indexOf('{', i);
  let depth = 0, k = j;
  for (; k < js.length; k++) {
    if (js[k] === '{') depth++;
    else if (js[k] === '}' && --depth === 0) break;
  }
  return js.slice(j, k + 1);
}
const literals = (body) =>
  Array.from(new Set(String(body)
    .replace(/\\u[0-9a-fA-F]{4}/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .match(/\b\d+\b/g) || [])).sort();
const SEAM = ['_itemSets', '_secRounds', '_stripLeadingSets', '_setLeadingSets'];

test('the resolver seam exists and carries no fallback round count', () => {
  // Only a regex radix 10, a capture index 1 and the >0 guard may appear: a 3 here is the defect D39 closed.
  const ALLOWED = new Set(['0', '1', '10']);
  for (const name of SEAM) {
    const body = fnBody(IA.js, name);
    assert.ok(body, name + ' is present');
    assert.deepEqual(literals(body).filter((x) => !ALLOWED.has(x)), [], 'numeric literals in ' + name);
  }
});

test('the superset header reads the one resolver and falls back to the label only when there is no count', () => {
  assert.equal((IA.js.match(/const rounds=_secRounds\(sec\);/g) || []).length, 1);
  assert.match(IA.js, /hdrTxt\s*=\s*\(labelHasRounds\|\|rounds==null\)/);
});

test('the session time estimate shares the resolver instead of carrying its own copy (D39-iii)', () => {
  const body = fnBody(IA.js, 'sessionTimeEst');
  assert.ok(body, 'sessionTimeEst is present');
  assert.ok(body.includes('_secRounds('), 'calls _secRounds');
  assert.ok(body.includes('_itemSets('), 'calls _itemSets');
  assert.ok(!body.includes('/^(\\d+)'), 'holds no leading-count regex of its own');
});

test('a section count is the smallest member count, never the first member', () => {
  const table = [
    ['max first', [{ detail: '4×10' }, { detail: '2×10' }, { detail: '3×10' }], 2],
    ['max first, two', [{ detail: '5×8' }, { detail: '3×8' }], 3],
    ['capped last', [{ detail: '4×12' }, { detail: '4×12' }, { detail: '1×12' }], 1],
    ['unparseable first', [{ detail: 'as many as possible' }, { detail: '4×10' }, { detail: '2×10' }], 2],
  ];
  for (const [why, items, want] of table) assert.equal(secRounds({ label: 'Pump', superset: true, items }), want, why);
});

test('both authored grammars are read: N×reps and N sets', () => {
  const table = [
    ['sets grammar alone', [{ detail: '3 sets — RPE 8' }, { detail: '2 sets — RPE 8' }], 2],
    ['sets grammar uniform', [{ detail: '4 sets — RPE 7 (leave 3 or more in reserve)' }, { detail: '4 sets — RPE 7' }], 4],
    ['mixed grammars', [{ detail: '4×10' }, { detail: '2 sets — RPE 7' }], 2],
    ['sets of', [{ detail: '3 sets of 10' }, { detail: '5×10' }], 3],
  ];
  for (const [why, items, want] of table) assert.equal(secRounds({ label: 'Pump', superset: true, items }), want, why);
});

test('rounds: null means not a round block; an omitted count is recovered from the members', () => {
  const items = [{ name: 'Kettlebell swing', detail: '3×10' }, { name: 'Pushups', detail: '3×12' }];
  assert.equal(secRounds({ label: '30 min AMRAP — pace yourself', superset: true, rounds: null, items }), null);
  assert.equal(secRounds({ label: '30 min AMRAP — pace yourself', superset: true, items }), 3);
  assert.notEqual(secRounds({ label: 'Pump', superset: true, rounds: null, items }), secRounds({ label: 'Pump', superset: true, items }));
});

test('a label that states its own count beats the not-a-round-block heuristic (D39-ii)', () => {
  const RP = IA.RAND_POOLS;
  assert.ok(RP, 'RAND_POOLS is reachable');
  const bad = [];
  for (const k of Object.keys(RP))
    for (const w of RP[k] || [])
      for (const s of w.sections || [])
        if (/(\d+)\s*round/i.test(s.label || '') && s.rounds === null) bad.push(k + '/' + w.title + '/' + s.label);
  assert.deepEqual(bad, [], 'no label that states a count carries rounds: null');
  const tabata = (RP.fatloss || []).find((x) => x.title === 'Tabata Hell');
  assert.ok(tabata, 'Tabata Hell is in the fat loss pool');
  assert.equal(secRounds(tabata.sections[0]), 8, 'Tabata Hell resolves 8 from its label');
});

test('the nine genuine not-a-round-blocks carry an authored null', () => {
  const NOT_A_ROUND_BLOCK = [
    ['fatloss', 'AMRAP 20 Min', 'As many rounds as possible'],
    ['fatloss', 'Gut Check', 'EMOM 20 min'],
    ['fatloss', 'Interval Strength', 'Every 2 min: 5 reps bench + 5 reps squat + 10 swings'],
    ['fatloss', 'EMOM Strength', 'Every min on the min for 20 min'],
    ['fatloss', 'The Long Shred', '30 min AMRAP — pace yourself'],
    ['athletic', 'Mixed Modal', 'Alternate every 5 min for 30 min'],
    ['athletic', 'Power Endurance', 'AMRAP 25 min — pace yourself'],
    ['athletic', 'The Finisher', 'For time — as fast as possible'],
    ['balanced', 'The Grind', '30 min AMRAP'],
  ];
  const RP = IA.RAND_POOLS;
  for (const [pool, title, label] of NOT_A_ROUND_BLOCK) {
    const w = (RP[pool] || []).find((x) => x.title === title);
    const s = w && (w.sections || []).find((x) => x.label === label);
    assert.ok(s, pool + '/' + title + ' has the section ' + label);
    assert.equal(s.rounds, null, pool + '/' + title);
  }
});

test('the session time estimate reads the item count first, then the section count, then 3 (D39-iii)', () => {
  // The published model: 8 min warmup, a superset item is sets x 1.4 min, rounded to the nearest 5, floored at 5.
  const mkDay = (rounds, detail, n) => ({
    sections: [Object.assign({ label: 'Pump', superset: true }, rounds === undefined ? {} : { rounds },
      { items: Array.from({ length: n }, (_, i) => ({ name: 'Kettlebell swing ' + i, detail })) })],
  });
  const r5 = (m) => Math.max(5, Math.round(m / 5) * 5);
  const table = [
    ['section count drives an uncounted item (2 rounds x 6)', mkDay(2, '10 reps', 6), r5(8 + 6 * 2 * 1.4)],
    ['section count drives an uncounted item (5 rounds x 4)', mkDay(5, '10 reps', 4), r5(8 + 4 * 5 * 1.4)],
    ['item count wins over the section', mkDay(2, '4×10', 6), r5(8 + 6 * 4 * 1.4)],
    ['item count wins in the sets grammar', mkDay(5, '2 sets — RPE 8', 6), r5(8 + 6 * 2 * 1.4)],
    ['3 only when nothing parses at all', mkDay(undefined, '10 reps', 2), r5(8 + 2 * 3 * 1.4)],
  ];
  for (const [why, day, want] of table) assert.equal(timeEst(day), want, why);
});

// ── the member strip is display only (D39-v) ─────────────────────────────────────────────────────────────────
const SS3 = { label: 'Pump', superset: true, rounds: 3, items: [{ name: 'Kettlebell swing', detail: '3×10' }, { name: 'Pushups', detail: '3×12' }] };
const SS2 = { label: 'Pump', superset: true, rounds: 2, items: [{ name: 'Kettlebell swing', detail: '2×10' }, { name: 'Pushups', detail: '2×12' }] };
const SSNULL = { label: '30 min AMRAP', superset: true, rounds: null, items: [{ name: 'Kettlebell swing', detail: '3×10' }, { name: 'Pushups', detail: '3×12' }] };

test('rendering a superset leaves item.detail untouched in the data', () => {
  const out = S.renderAndReturnData(IA, [SS3]);
  assert.deepEqual(out.after[0].items.map((i) => i.detail), SS3.items.map((i) => i.detail));
});

test('a rounds: null block prints its member rows whole', () => {
  assert.deepEqual(S.renderedDetails(render([SSNULL])), SSNULL.items.map((i) => i.detail));
});

test('the rendered payload still carries the count, and parseRx reads it', () => {
  assert.ok(render([SS3]).includes('3×10'), 'the true detail survives in the rendered payload');
  const rx = S.callApp(IA, 'parseRx', '3×10', 'Kettlebell swing');
  assert.equal(rx && rx.sets, 3);
});

test('the round sentence is written only when there is a real count', () => {
  assert.match(S.headerText(render([SS3])), /^3 Rounds — no rest between exercises · \d+s rest between rounds$/);
  assert.match(S.headerText(render([SS2])), /^2 Rounds — no rest between exercises · \d+s rest between rounds$/);
  assert.equal(S.headerText(render([SSNULL])), SSNULL.label);
});

test('a bare count or range in a round block reads "N reps"; every other remainder is untouched (D176)', () => {
  const sec = { label: 'Pump', superset: true, rounds: 3, items: [
    { name: 'Kettlebell swing', detail: '3×10' }, { name: 'Goblet squat', detail: '3×8–12' },
    { name: 'Pushups', detail: '3×12 each side' }, { name: 'Plank', detail: '3×30 sec' },
    { name: 'Dumbbell row', detail: '3 sets — RPE 8' } ] };
  const HAND = ['10 reps', '8–12 reps', '12 each side', '30 sec', 'RPE 8'];
  assert.deepEqual(sec.items.map((i) => S.wantMemberRow(i.detail)), HAND, 'the reference strip agrees with the hand table');
  assert.deepEqual(S.renderedDetails(render([sec])), HAND);
});

// ── generated programs, on the 420-cell lattice ───────────────────────────────────────────────────────────────────
const LATTICE = S.roundsLattice(3);
const R = S.surveyRounds(IA, LATTICE);

test('the lattice builds whole and leaves every config unchanged', () => {
  assert.equal(LATTICE.length, 420);
  assert.deepEqual(R.errors, []);
  assert.equal(R.built, LATTICE.length);
  assert.equal(R.cfgMutated, 0);
});

test('every generated superset carries an authored, positive round count', () => {
  assert.ok(R.supersets > 0);
  assert.deepEqual(R.noCount.slice(0, 3), []);
  assert.deepEqual(R.nonPositive.slice(0, 3), []);
});

test('no generated superset count contradicts its own members, and members agree with each other', () => {
  assert.deepEqual(R.contradictions.slice(0, 3), []);
  assert.deepEqual(R.desynced.slice(0, 3), []);
});

test('every generated round-block row reads the reference strip plus " reps" exactly when bare (D176)', () => {
  assert.deepEqual(R.rows.renderErrors.slice(0, 3), []);
  assert.deepEqual(R.rows.mismatched.slice(0, 3), []);
  assert.ok(R.rows.bare >= 1 && R.rows.nonBare >= 1, 'the population holds bare and non-bare rows: ' + R.rows.bare + '/' + R.rows.nonBare);
});

test('prevention halves 3-round supersets to 2 and keeps members in step (D39-iv)', () => {
  const h = R.prevention.rounds;
  assert.equal((h['3'] || 0) + (h['undefined'] || 0) + (h['null'] || 0), 0, 'histogram ' + JSON.stringify(h));
  assert.deepEqual(R.prevention.desynced.slice(0, 3), []);
  assert.ok((h['4'] || 0) > 0, 'the sweep is 3 to 2 only: 4-round sections survive ' + JSON.stringify(h));
});

test('prevention rewrites non-superset accessories per item; other foci keep 3 sets', () => {
  assert.ok(R.prevention.accessories > 0);
  assert.equal(R.prevention.accessories3, 0, R.prevention.accessories3 + ' of ' + R.prevention.accessories + ' still at 3 sets');
  assert.ok(R.balancedAccessories3 > 0, 'the control sees 3-set accessories off prevention');
});
