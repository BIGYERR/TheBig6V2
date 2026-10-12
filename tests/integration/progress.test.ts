// @ts-nocheck: ported from JavaScript in phase 2; typing pending (docs/test-migration.md, "Typing debt").
// Progress: the main lift progress line states a number and a unit and never an implement (D53), and a lift's place in
// the Range Ladder is decided by the most recent session that carries a rep range, never by whichever session was logged
// last (D55). The app knows a number in a log field, not what the athlete picked up; a primer week, prescribed fixed low
// reps, must not move a lift out of the ladder and back.
//
// buildMainLiftBlock runs on a hand-built lift model and ledgerModel on hand-built logs (tests/support/ledger.js
// ladderLog); nothing here comes from buildProgram.
//
// Oracles are typed by hand: the progress line from the ruling's after grid ("Opened at" names the week of the first
// plotted session); the kg line from the app's rounding rule done here (round(w x 0.453592 x 2) / 2: 80 lbs is 36.5 kg,
// 60 lbs is 27 kg, a gain of 9.5 kg); a list of implement words the log field cannot know; and the prescription grammar,
// where "3×8–12" carries a range and "3×6" does not.
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp } from '../support/app.ts';
import { ladderLog } from '../support/ledger.ts';
const IA = loadApp();
const ledgerModel = IA.eval('typeof ledgerModel==="function"?ledgerModel:null');
const buildMainLiftBlock = IA.eval('typeof buildMainLiftBlock==="function"?buildMainLiftBlock:null');
const plain = (x) => JSON.parse(JSON.stringify(x));
const text = (h) => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

/** Words that name a physical object the log field does not identify. */
const IMPLEMENT_WORDS = ['on the bar', 'the bar', 'barbell', 'dumbbell', 'kettlebell', 'plates', 'pair they have', 'machine', 'bands', 'sandbag'];
const implementClaims = (s) => IMPLEMENT_WORDS.filter((w) => s.toLowerCase().includes(w));

// A bench press opened at 60 x 12 in week 1 and reached 80 x 12 in week 3.
const MODEL = {
  name: 'Bench press', mode: 'load', series: [{ w: 1, v: 60 }, { w: 3, v: 80 }],
  heavy: { v: 80, reps: 12, week: 3 }, first: { v: 60, reps: 12, week: 1 }, plotted: 2, accessoryDay: 0, noLoad: 0, entries: 2,
};
// The same lift with no gain: 60 x 10 in weeks 1 and 2.
const FLAT = {
  name: 'Bench press', mode: 'load', series: [{ w: 1, v: 60 }, { w: 2, v: 60 }],
  heavy: { v: 60, reps: 10, week: 2 }, first: { v: 60, reps: 10, week: 1 }, plotted: 2, accessoryDay: 0, noLoad: 0, entries: 2,
};

test('ledgerModel and buildMainLiftBlock are functions the app defines', () => {
  assert.equal(typeof ledgerModel, 'function');
  assert.equal(typeof buildMainLiftBlock, 'function');
});

test('the progress line reads Bench press 80×12 Opened at 60×12 in week 1 · up 20 lbs · heaviest in week 3', () => {
  const got = text(buildMainLiftBlock(MODEL, 'lbs'));
  assert.ok(got.startsWith('Bench press 80×12 Opened at 60×12 in week 1 · up 20 lbs · heaviest in week 3'), got.slice(0, 90));
});

test('in kg the progress line reads Bench press 36.5×12 Opened at 27×12 in week 1 · up 9.5 kg · heaviest in week 3', () => {
  const got = text(buildMainLiftBlock(MODEL, 'kg'));
  assert.ok(got.startsWith('Bench press 36.5×12 Opened at 27×12 in week 1 · up 9.5 kg · heaviest in week 3'), got.slice(0, 90));
});

test('the progress line names no implement, in either unit', () => {
  const lines = text(buildMainLiftBlock(MODEL, 'lbs')) + ' ' + text(buildMainLiftBlock(MODEL, 'kg'));
  assert.deepEqual(implementClaims(lines), []);
});

test('with no gain the progress line drops the gain clause entirely and still names the heaviest week', () => {
  const got = text(buildMainLiftBlock(FLAT, 'lbs'));
  assert.ok(!got.includes(' up '), got.slice(0, 90));
  assert.ok(got.includes('heaviest in week 2'), got.slice(0, 90));
});

test('the progress line has one conditional, the numeric gain test, and names no implement', () => {
  const m = IA.html.match(/\+\(gain>0\?[^\n]*\n/);
  assert.ok(m, 'the gain expression is in the app');
  assert.ok(!/on the bar/.test(m[0]), m[0].trim());
  assert.equal((m[0].match(/\?/g) || []).length, 1, m[0].trim());
});

// ── the Range Ladder reads the most recent session that carries a range ──────────────────────────────────────────────
const NAME = 'Dumbbell curl';
const ladderOf = (rows) => {
  const f = ladderLog(rows);
  return plain(ledgerModel({ k1: { name: rows[0].name, entries: f.entries } }, f.hist));
};
// Week 1 carried 3×8–12 and the athlete hit 12s at 30; week 2 is a primer at fixed 6s, logged last at 25.
const PRIMER_LAST = [
  { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [12, 12, 12], detail: '3×8–12 — RPE 8' },
  { name: NAME, week: 2, day: 'mon', ts: 200, weight: 25, sets: [6, 6, 6], detail: '3×6 — RPE 5–6 (primer)' },
];

test('a primer week logged last keeps the lift in the Range Ladder, on week 1\'s 8 to 12', () => {
  const r = ladderOf(PRIMER_LAST);
  const row = r.ladder.find((x) => x.name === NAME);
  assert.ok(row, 'in the ladder: ladder ' + JSON.stringify(r.ladder.map((x) => x.name)) + ' plain ' + JSON.stringify(r.plain.map((x) => x.name)));
  assert.deepEqual([row.lo, row.hi], [8, 12]);
});

test('the ladder takes its sets and weight from the last session, and a primer week is not scored ready against a range it was never given', () => {
  const row = ladderOf(PRIMER_LAST).ladder.find((x) => x.name === NAME);
  assert.ok(row);
  assert.equal(row.wt, 25);
  assert.deepEqual(row.sets, [6, 6, 6]);
  assert.equal(row.ready, false);
});

test('the most recent session that carries a range wins, whatever order the entries were stored in', () => {
  // week 1 said 5–8, week 3 said 8–12, week 4 is a primer; stored out of order
  const row = ladderOf([
    { name: NAME, week: 3, day: 'tue', ts: 300, weight: 35, sets: [9, 9], detail: '3×8–12 — RPE 8' },
    { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [8, 8], detail: '3×5–8 — RPE 8' },
    { name: NAME, week: 4, day: 'mon', ts: 400, weight: 30, sets: [6, 6], detail: '3×6 — RPE 5' },
  ]).ladder.find((x) => x.name === NAME);
  assert.ok(row);
  assert.deepEqual([row.lo, row.hi], [8, 12]);
});

test('a lift that never carried a range falls to Other Accessory Work', () => {
  const r = ladderOf([
    { name: 'Dumbbell shrug', week: 1, day: 'mon', ts: 100, weight: 40, sets: [10], detail: '3×10 — RPE 7' },
    { name: 'Dumbbell shrug', week: 2, day: 'mon', ts: 200, weight: 45, sets: [10], detail: '3×10 — RPE 8' },
  ]);
  assert.equal(r.ladder.length, 0);
  assert.equal(r.plain.length, 1);
});

test('a lift whose last session carries the range is ranked on it and scored ready on 12s', () => {
  const row = ladderOf([
    { name: NAME, week: 1, day: 'mon', ts: 100, weight: 30, sets: [8, 8], detail: '3×8–12 — RPE 8' },
    { name: NAME, week: 2, day: 'mon', ts: 200, weight: 35, sets: [12, 12], detail: '3×8–12 — RPE 8' },
  ]).ladder.find((x) => x.name === NAME);
  assert.ok(row);
  assert.deepEqual([row.lo, row.hi, row.wt, row.ready], [8, 12, 35, true]);
});

test('a main slot lift routes to the main lifts even when its last session is a primer with no range', () => {
  const hist = {
    w1_mon: { sections: [{ label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '3×8–12 — RPE 8' }] }] },
    w2_mon: { sections: [{ label: 'Main — Back squat', items: [{ name: 'Back squat', detail: '3×6 — RPE 5' }] }] },
  };
  const entries = [
    { week: 1, day: 'mon', ts: 100, weight: 155, setsDone: [12, 12] },
    { week: 2, day: 'mon', ts: 200, weight: 175, setsDone: [6, 6] },
  ];
  const r = plain(ledgerModel({ k1: { name: 'Back squat', entries } }, hist));
  assert.deepEqual([r.mains.length, r.ladder.length, r.plain.length], [1, 0, 0]);
});

test('ledgerModel holds the range in one binding: declared null, set only by the backward walk, read by the ranking', () => {
  const body = IA.html.slice(IA.html.indexOf('function ledgerModel('));
  const seg = body.slice(0, body.indexOf('\n}\n'));
  assert.equal((seg.match(/\brng\s*=/g) || []).length, 2, 'the let and the loop');
  assert.match(seg, /\blet rng=null;/);
  assert.match(seg, /if\(rng&&sets\.length\)/);
});
