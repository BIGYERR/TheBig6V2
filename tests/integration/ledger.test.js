'use strict';
// The Lift Ledger on the Progress screen keeps every session: an unloaded main lift is still a main lift, plotted in
// reps; the footer accounts for every session it kept off the line in two clauses; a blank Load box costs the point,
// never carries a weight forward; and the cards and the swap sheet stop calling heavy lifts accessories or main lifts
// by weight alone. Rulings D56 to D59.
//
// renderProgressScreen is called against hand-built stores (tests/support/ledger.js) and #progressBody is read back;
// openSwapSheet is called on Mario's program (fixtures.HALF_MANNY, seed 76308, built twice and equal to itself first).
//
// Oracles are hand tables and arithmetic over them, stated beside each store; every expected string is typed from the
// ruling; the swap sheet's main slot is the slot rule stated in words (item 0 of a section whose label starts with Main,
// not a superset) and the heavy compound is one named barbell lift, Barbell Romanian deadlift.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fixtures, progDigest } = require('../support/app.js');
const {
  ledgerBench, cardTitled, blocks, blockFor, footerOf, countOf, textOf, weekLabels, disclosed,
} = require('../support/ledger.js');

const J = JSON.stringify;
const L = ledgerBench();
const sum = (a) => a.reduce((x, y) => x + y, 0);

// ── A. the bodyweight program ────────────────────────────────────────────────────────────────────────────────────────
// Ten movements, never loaded, each the item 0 main lift of its own day: five weekdays by two week parities. Chin-up
// misses week 9 and Dip misses week 10, so 8 x 5 + 2 x 4 = 48 sessions. Every session is three sets: 44 are 3 x 10 and
// 4 (Push-up week 9, Bodyweight squat week 10, Inverted row week 9, Pike push-up week 10) are 3 x 13.
// Reps by hand: 44 x 30 + 4 x 39 = 1320 + 156 = 1476.
const A_PLAN = [
  { name: 'Push-up', day: 'mon', weeks: [1, 3, 5, 7, 9], top: 9 },
  { name: 'Bodyweight squat', day: 'mon', weeks: [2, 4, 6, 8, 10], top: 10 },
  { name: 'Inverted row', day: 'tue', weeks: [1, 3, 5, 7, 9], top: 9 },
  { name: 'Pike push-up', day: 'tue', weeks: [2, 4, 6, 8, 10], top: 10 },
  { name: 'Reverse lunge', day: 'wed', weeks: [1, 3, 5, 7, 9], top: 0 },
  { name: 'Glute bridge', day: 'wed', weeks: [2, 4, 6, 8, 10], top: 0 },
  { name: 'Nordic hamstring curl', day: 'thu', weeks: [1, 3, 5, 7, 9], top: 0 },
  { name: 'Single-leg hip thrust', day: 'thu', weeks: [2, 4, 6, 8, 10], top: 0 },
  { name: 'Chin-up', day: 'fri', weeks: [1, 3, 5, 7], top: 0 },
  { name: 'Dip', day: 'fri', weeks: [2, 4, 6, 8], top: 0 },
];
const A_TABLE = A_PLAN.map((p) => ({
  name: p.name,
  sessions: p.weeks.map((w) => ({ week: w, day: p.day, slot: 'main', weight: 0, sets: w === p.top ? [13, 13, 13] : [10, 10, 10], setsReps: '3×10', detail: '3 sets to effort' })),
}));
const A_STORE = L.buildStore(A_TABLE);
const A_HTML = L.renderProgress(A_STORE, 'lbs');
const A_CARD = cardTitled(A_HTML, 'Main Lifts');

// ── B. the mixed case ────────────────────────────────────────────────────────────────────────────────────────────────
// Dumbbell bench press, 16 sessions: 10 main slot on Monday (weeks 1 to 5 blank, weeks 6 to 10 loaded 45, 50, 55, 60,
// 65) and 6 accessory days on Thursday (weeks 1 to 6, loaded 30). Plotted 5, accessory day 6, no load 5: 5 + 6 + 5 = 16.
// Dumbbell goblet squat, 8 sessions: 4 blank main slot on Tuesday and 4 loaded accessory days on Saturday.
// Plotted 4 (in reps), accessory day 4, no load 0: 4 + 4 + 0 = 8.
// The card: plotted 9, accessory day 10, no load 5, entries 24. Reps on no line: 5 blank main sessions at 5 + 5 + 5 = 15
// and 6 accessory sessions at 6 + 5 + 5 = 16: 75 + 96 = 171.
const B_DBB = { name: 'Dumbbell bench press', sessions: [] };
[1, 2, 3, 4, 5].forEach((w) => B_DBB.sessions.push({ week: w, day: 'mon', slot: 'main', weight: 0, sets: [5, 5, 5], setsReps: '3×5' }));
[[6, 45], [7, 50], [8, 55], [9, 60], [10, 65]].forEach((p) => B_DBB.sessions.push({ week: p[0], day: 'mon', slot: 'main', weight: p[1], sets: [8, 8, 8], setsReps: '3×8' }));
[1, 2, 3, 4, 5, 6].forEach((w) => B_DBB.sessions.push({ week: w, day: 'thu', slot: 'acc', weight: 30, sets: [6, 5, 5], setsReps: '3×6' }));
const B_GOB = { name: 'Dumbbell goblet squat', sessions: [] };
[1, 2, 3, 4].forEach((w) => B_GOB.sessions.push({ week: w, day: 'tue', slot: 'main', weight: 0, sets: [12, 12, 12], setsReps: '3×12' }));
[1, 2, 3, 4].forEach((w) => B_GOB.sessions.push({ week: w, day: 'sat', slot: 'acc', weight: 40, sets: [10, 10, 10], setsReps: '3×10' }));
const B_TABLE = [B_DBB, B_GOB];
const B_STORE = L.buildStore(B_TABLE);
const B_HTML = L.renderProgress(B_STORE, 'lbs');
const B_CARD = cardTitled(B_HTML, 'Main Lifts');
const B_FOOT = textOf(footerOf(B_CARD));
const B_DBB_BLOCK = blockFor(B_CARD, 'Dumbbell bench press');

// ── C. every routing case in one store ───────────────────────────────────────────────────────────────────────────────
// An unloaded main (Push-up), a loaded main (Barbell back squat), a ranged accessory (lateral raise, 3×8–12: the Range
// Ladder), a plain accessory (pushdown, "2 sets of 10") and an unloaded accessory (hanging knee raise).
const C_TABLE = [
  { name: 'Push-up', sessions: [1, 2, 3].map((w) => ({ week: w, day: 'mon', slot: 'main', weight: 0, sets: [20, 18, 15], setsReps: '3×20' })) },
  { name: 'Barbell back squat', sessions: [1, 2, 3].map((w) => ({ week: w, day: 'tue', slot: 'main', weight: 135 + w * 10, sets: [5, 5, 5], setsReps: '3×5' })) },
  { name: 'Dumbbell lateral raise', sessions: [1, 2, 3, 4].map((w) => ({ week: w, day: 'wed', slot: 'acc', weight: w < 3 ? 15 : 20, sets: [12, 12, 12], setsReps: '3×12', detail: '3×8–12 @ RPE 8' })) },
  { name: 'Cable triceps pushdown', sessions: [1, 2].map((w) => ({ week: w, day: 'thu', slot: 'acc', weight: 50, sets: [10, 10], setsReps: '2×10', detail: '2 sets of 10' })) },
  { name: 'Hanging knee raise', sessions: [1, 2].map((w) => ({ week: w, day: 'fri', slot: 'acc', weight: 0, sets: [12, 12], setsReps: '2×12', detail: '2 sets to effort' })) },
];
const C_STORE = L.buildStore(C_TABLE);

// ── D. singular counts ───────────────────────────────────────────────────────────────────────────────────────────────
// Barbell overhead press: week 1 main blank, week 2 accessory loaded 75, week 3 main loaded 95. Plotted 1, accessory day
// 1, no load 1, entries 3. One point means a headline and no chart.
const D_TABLE = [{
  name: 'Barbell overhead press',
  sessions: [
    { week: 1, day: 'mon', slot: 'main', weight: 0, sets: [5, 5, 5], setsReps: '3×5' },
    { week: 2, day: 'thu', slot: 'acc', weight: 75, sets: [8, 8, 8], setsReps: '3×8' },
    { week: 3, day: 'mon', slot: 'main', weight: 95, sets: [5, 5, 5], setsReps: '3×5' },
  ],
}];
const D_CARD = cardTitled(L.renderProgress(L.buildStore(D_TABLE), 'lbs'), 'Main Lifts');
const D_FOOT = textOf(footerOf(D_CARD));

const F_HTML = L.renderProgress(C_STORE, 'lbs');
const F_CARD = cardTitled(F_HTML, 'Range Ladder');
const F_TITLE = F_CARD.slice(0, F_CARD.indexOf('</div>') + 6);

test('the hand tables add up: 48 bodyweight sessions and 1476 reps under ten store keys, 24 mixed entries and 171 reps off the line', () => {
  const sessions = A_TABLE.reduce((a, m) => a + m.sessions.length, 0);
  const reps = A_TABLE.reduce((a, m) => a + m.sessions.reduce((x, s) => x + sum(s.sets), 0), 0);
  assert.deepEqual([sessions, reps], [48, 1476]);
  assert.equal(A_STORE.keys.length, 10, 'exStoreKey keeps the ten movements apart');
  assert.equal(B_TABLE.reduce((a, m) => a + m.sessions.length, 0), 24);
  const offLine = B_DBB.sessions.filter((s) => s.slot === 'acc' || !s.weight).reduce((a, s) => a + sum(s.sets), 0);
  assert.equal(offLine, 5 * 15 + 6 * 16);
  assert.equal(offLine, 171);
});

test('a fully populated bodyweight store renders a Main Lifts card: ten lifts, one dot per session, 48 in all', () => {
  assert.ok(A_CARD.length > 0, 'the card renders');
  assert.equal(blocks(A_CARD).length, 10);
  assert.equal(countOf(A_CARD, '<circle'), 48);
  assert.equal(countOf(blockFor(A_CARD, 'Chin-up'), '<circle'), 4, 'Chin-up shows the four sessions the athlete logged');
});

test('no unloaded main lift lands in Other Accessory Work', () => {
  const other = cardTitled(A_HTML, 'Other Accessory Work');
  assert.deepEqual(A_PLAN.filter((p) => other.includes('>' + p.name + '<')).map((p) => p.name), []);
});

test('a reps block heads with its best set, 13 reps, and reads Opened at 10 reps in week 1 · up 3 reps · best in week 9', () => {
  const b = blockFor(A_CARD, 'Push-up');
  assert.ok(b.includes('>13 reps</div>'), textOf(b).slice(0, 90));
  assert.ok(textOf(b).includes('Opened at 10 reps in week 1 · up 3 reps · best in week 9'), textOf(b).slice(0, 120));
});

test('a lift that never improved prints no gain and names its own best week', () => {
  assert.ok(textOf(blockFor(A_CARD, 'Reverse lunge')).includes('Opened at 10 reps in week 1 · best in week 1'), textOf(blockFor(A_CARD, 'Reverse lunge')).slice(0, 120));
});

test('a reps block never prints a load unit or the weight×reps grammar', () => {
  assert.ok(!/\d\s*(lbs|kg)\b/.test(textOf(A_CARD)), textOf(A_CARD).slice(0, 140));
  const push = textOf(blockFor(A_CARD, 'Push-up'));
  assert.ok(!push.includes('13×') && !push.includes('10×'), push.slice(0, 120));
});

test('a card that withheld nothing discloses nothing', () => {
  const f = textOf(footerOf(A_CARD));
  assert.ok(!f.includes('kept off the line') && !f.includes('no load written down'), f);
});

test('a mixed lift plots only its five loaded main sessions, weeks 6 to 10, and carries no weight across the blank weeks', () => {
  assert.equal(blocks(B_CARD).length, 2);
  assert.ok(B_DBB_BLOCK.length > 0 && blockFor(B_CARD, 'Dumbbell goblet squat').length > 0);
  assert.equal(countOf(B_DBB_BLOCK, '<circle'), 5);
  assert.deepEqual(weekLabels(B_DBB_BLOCK), [6, 7, 8, 9, 10]);
});

test('Opened at names the first plotted week, 45×8 in week 6, and the headline is the heaviest set, 65×8 in week 10', () => {
  const t = textOf(B_DBB_BLOCK);
  assert.ok(t.includes('Opened at 45×8 in week 6'), t.slice(0, 130));
  assert.ok(t.includes('65×8') && t.includes('heaviest in week 10'), t.slice(0, 130));
});

test('a main lift with every load blank renders as a reps block instead of vanishing', () => {
  assert.ok(textOf(blockFor(B_CARD, 'Dumbbell goblet squat')).includes('Opened at 12 reps in week 1'), textOf(blockFor(B_CARD, 'Dumbbell goblet squat')).slice(0, 130));
});

test('the footer states 10 accessory sessions and 5 with no load, in two ruled clauses and never one number', () => {
  assert.ok(B_FOOT.includes('10 sessions where this ran as an accessory are kept off the line. The lighter sets would make the climb look like something it was not.'), B_FOOT);
  assert.ok(B_FOOT.includes('5 sessions had no load written down. Add the weight and they join the line.'), B_FOOT);
  assert.ok(!B_FOOT.includes('kept out of the line so it reads clean'), B_FOOT);
});

test('the card closes on its own rendered numbers: 9 dots + 10 withheld + 5 blank = 24 sessions', () => {
  const [acc, blank] = disclosed(B_FOOT);
  assert.equal(countOf(B_CARD, '<circle') + acc + blank, 24, countOf(B_CARD, '<circle') + ' + ' + acc + ' + ' + blank);
});

test('per lift, plotted + accessory day + no load equals its entries, as the hand table says', () => {
  const m = L.model(B_STORE);
  assert.deepEqual(m.mains.map((x) => [x.name, x.plotted, x.accessoryDay, x.noLoad, x.entries]).sort(), [
    ['Dumbbell bench press', 5, 6, 5, 16],
    ['Dumbbell goblet squat', 4, 4, 0, 8],
  ]);
});

test('every populated store key lands in exactly one bucket', () => {
  const m = L.model(C_STORE);
  const seen = {};
  ['mains', 'ladder', 'plain', 'unloaded'].forEach((b) => m[b].forEach((r) => { seen[r.name] = (seen[r.name] || 0) + 1; }));
  assert.deepEqual(C_TABLE.map((t) => [t.name, seen[t.name]]), C_TABLE.map((t) => [t.name, 1]));
});

test('an unloaded main lift is a main lift, never Other Accessory Work', () => {
  const m = L.model(C_STORE);
  assert.ok(m.mains.some((x) => x.name === 'Push-up'), m.mains.map((x) => x.name).join('|'));
  assert.ok(!m.unloaded.some((x) => x.name === 'Push-up'));
});

test('a main lift chart plots its main slot sessions only, never the lighter accessory days', () => {
  const db = L.model(B_STORE).mains.find((x) => x.name === 'Dumbbell bench press');
  assert.deepEqual(db.series, [{ w: 6, v: 45 }, { w: 7, v: 50 }, { w: 8, v: 55 }, { w: 9, v: 60 }, { w: 10, v: 65 }]);
});

test('a lift with one plotted session prints its headline, 95×5, and no chart', () => {
  assert.ok(textOf(D_CARD).includes('95×5'), textOf(D_CARD).slice(0, 160));
  assert.equal(countOf(D_CARD, '<circle'), 0);
  assert.equal(countOf(D_CARD, '<svg viewBox="0 0 320'), 0);
});

test('one withheld and one blank session each read as one session, and the card closes 1 + 1 + 1 = 3', () => {
  assert.ok(D_FOOT.includes('1 session where this ran as an accessory is kept off the line.'), D_FOOT);
  assert.ok(D_FOOT.includes('1 session had no load written down. Add the weight and it joins the line.'), D_FOOT);
  const [acc, blank] = disclosed(D_FOOT);
  assert.equal(1 + acc + blank, D_TABLE[0].sessions.length);
});

test('the Main Lifts footer opens with The top set you actually did., keeps the no estimated maxes line, and says what the card holds', () => {
  assert.equal(B_FOOT.indexOf('The top set you actually did.'), 0, B_FOOT.slice(0, 80));
  assert.ok(!B_FOOT.includes('The heaviest set you actually did, and the working weight behind it'));
  assert.ok(B_FOOT.includes('No estimated maxes: a formula that inflates with reps would rank a heavy single below a lighter double.'));
  assert.ok(B_FOOT.includes('This is the lift each day was built around. Everything else you loaded is in the ladder below.'), B_FOOT);
});

test('the card is called Main Lifts, never Top Lifts', () => {
  assert.ok(B_CARD.slice(0, 900).includes('Main Lifts</div>'));
  assert.ok(!B_HTML.includes('Top Lifts'));
});

test('the Range Ladder card is titled Range Ladder, with no Accessories and no em-dash, and ranks its lift', () => {
  assert.ok(F_CARD.length > 0 && F_TITLE.includes('Range Ladder'), textOf(F_TITLE));
  assert.ok(!F_TITLE.includes('Accessories'), textOf(F_TITLE));
  assert.ok(!F_TITLE.includes('—'), textOf(F_TITLE));
  assert.ok(F_CARD.includes('Dumbbell lateral raise'));
});

test('the Range Ladder head line says across these lifts this block, never across your accessories', () => {
  assert.ok(textOf(F_CARD).includes('across these lifts this block'), textOf(F_CARD).slice(0, 220));
  assert.ok(!textOf(F_CARD).includes('across your accessories this block'));
});

// ── G. the swap sheet tags ───────────────────────────────────────────────────────────────────────────────────────────
const G_PROG = L.IA.buildProgram(JSON.parse(J(fixtures.HALF_MANNY)));
let G_SLOT = null;
let G_TIER = null;
Object.keys(G_PROG.weeks).forEach((wk) => Object.keys(G_PROG.weeks[wk]).forEach((dk) => {
  (G_PROG.weeks[wk][dk].sections || []).forEach((sec, si) => (sec.items || []).forEach((it, ii) => {
    if (!it || !it.name) return;
    const mainSlot = ii === 0 && !(sec.superset || sec.type === 'superset') && /^main/i.test(sec.label || '');
    if (mainSlot && !G_SLOT) G_SLOT = [wk, dk, si, ii, it.name];
    if (!mainSlot && !G_TIER && it.name === 'Barbell Romanian deadlift') G_TIER = [wk, dk, si, ii, it.name];
  }));
}));
const tagsAt = (p) => L.swapTags(G_PROG, p[0], p[1], p[2], p[3]);

test("Mario's program builds the same twice and offers a main slot lift and a Barbell Romanian deadlift outside the main slot", () => {
  assert.equal(G_PROG.seed, 76308);
  assert.equal(progDigest(L.IA.buildProgram(JSON.parse(J(fixtures.HALF_MANNY)))), progDigest(G_PROG));
  assert.ok(G_SLOT, 'a main slot lift');
  assert.ok(G_TIER, 'a Barbell Romanian deadlift outside the main slot');
});

test('the swap sheet tags a main slot lift MAIN LIFT, never HEAVY COMPOUND', () => {
  const t = tagsAt(G_SLOT);
  assert.ok(t.includes('>MAIN LIFT<'), G_SLOT[4] + ': ' + textOf(t));
  assert.ok(!t.includes('HEAVY COMPOUND'), textOf(t));
});

test('the swap sheet tags a barbell compound outside the main slot HEAVY COMPOUND, never MAIN LIFT, among its three tags', () => {
  const t = tagsAt(G_TIER);
  assert.ok(t.includes('>HEAVY COMPOUND<'), G_TIER[4] + ' at item ' + G_TIER[3] + ': ' + textOf(t));
  assert.ok(!t.includes('MAIN LIFT'), textOf(t));
  assert.equal(countOf(t, 'class="swap-tag"'), 3);
});

// ── H. the copy rule over the rendered text ──────────────────────────────────────────────────────────────────────────
test('the ledger copy carries no em-dash, no spaced hyphen, no Nike and no sentence over 26 words', () => {
  const strings = [];
  [A_CARD, B_CARD, D_CARD].forEach((c) => {
    strings.push(textOf(footerOf(c)));
    blocks(c).forEach((b) => {
      const m = b.match(/<div style="font-size:11px;color:var\(--muted\);margin:2px 0 8px">([\s\S]*?)<\/div>(?:<svg|<\/div>)/);
      if (m) strings.push(textOf(m[1]));
    });
  });
  strings.push(textOf(F_TITLE), textOf(F_CARD).slice(0, 300), textOf(tagsAt(G_TIER)));
  const got = strings.filter((s) => s && s.length);
  assert.ok(got.length >= 8, 'harvested ' + got.length + ' strings');
  assert.deepEqual(got.filter((s) => s.includes('—') || / - /.test(s) || / – /.test(s)), []);
  assert.deepEqual(got.filter((s) => /nike/i.test(s)), []);
  assert.deepEqual(got.filter((s) => s.split(/(?<=[.!?])\s+/).some((t) => t.split(/\s+/).length > 26)), []);
});
