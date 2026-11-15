// The Expo deck's swap sheet, a pick and put it back (MIGRATION.md phase 3, the deck's third session): the pure
// logic in frontends/native/src/deck/deck-swaps.ts and deck-writes.ts, on a day built by hand over a memory store.
// Every expected value is typed by hand: from the rulings the page's sheet carries (D177's rep window and its toast,
// the sheet's tags and words, D192's chip), from the stored shapes (docs/decisions/stored-state.md), or from
// arithmetic. None is asked of the app: the comparison with today's sheet and stores is
// tests/integration/native-deck-swap.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type DeckProgram, deckView, movesOf } from '../../frontends/native/src/deck/deck-screen.ts';
import { auxSwapCandidates, swapCandidates, swapLoadNote, swapSheetOf, swapUniverseFor } from '../../frontends/native/src/deck/deck-swaps.ts';
import { type Session, swapMove, undoSwap } from '../../frontends/native/src/deck/deck-writes.ts';
import { REPO } from '../support/app.ts';

const NOW = 1_800_000_000_000;
// D177's own case (tests/integration/swaps.test.ts types the same by hand): a wave Main at 4×3 swapped onto a goblet
// squat, whose load runs out before three reps do, moves to the goblet squat's 8 to 12.
const BOX = 'Barbell box squat', GOB = 'Dumbbell goblet squat';
const BOX_RX = '4×3 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const GOB_RX = '4×8–12 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 2–3 min rest';
const ROW_RX = '3×8 — RPE 7';

/** A program of one Monday: a wave Main on the box squat, then a barbell row and a curl as accessories. */
function program(universe: string[] = ['Leg press', GOB, 'Front squat', 'Back squat', 'Barbell bench press', 'Dumbbell row', 'Barbell row', BOX]): DeckProgram {
  return {
    id: 'P1', cfg: { unit: 'lbs' }, _swapUniverse: universe,
    weeks: { 1: { mon: { title: 'Legs', sections: [
      { label: 'Main — ' + BOX, items: [{ name: BOX, detail: BOX_RX }] },
      { label: 'Accessory', items: [{ name: 'Barbell row', detail: ROW_RX }, { name: 'Back squat', detail: '3×5 — RPE 8' }] },
    ] } } },
  } as unknown as DeckProgram;
}
const session = (prog: DeckProgram, store: StateStore = memoryStore({})): Session => ({ store, prog, week: 1, dayKey: 'mon' });
const read = (s: StateStore, k: string): unknown => { const v = s.get(k); return v == null ? null : JSON.parse(v); };
const item = (prog: DeckProgram, si: number, ii: number) => prog.weeks[1]!['mon']!.sections![si]!.items![ii]!;
const names = (rows: { name: string }[]): string[] => rows.map((r) => r.name).sort();

describe('native deck swap: the sheet\'s model is today\'s file', () => {
  test('swap-sheet-model.ts in frontends/native is frontends/app\'s, byte for byte', () => {
    const today = readFileSync(join(REPO, 'frontends/app/src/app/screens/swap-sheet/swap-sheet-model.ts'));
    const copy = readFileSync(join(REPO, 'frontends/native/src/swap-sheet/swap-sheet-model.ts'));
    assert.ok(today.length > 4000, 'today\'s model is there');
    assert.ok(today.equals(copy), 'the copy differs from today\'s swap-sheet-model.ts: copy it again');
  });
});

describe('native deck swap: what the sheet lists', () => {
  test('a squat\'s sheet: the other squats the kit holds and the day does not, no lift of another region, and the tags and the dose it keeps', () => {
    const prog = program();
    const sh = swapSheetOf(prog, 1, 'mon', 0, 0)!;
    assert.deepStrictEqual(sh.ctx, { secIdx: 0, itemIdx: 0, name: BOX, detail: BOX_RX });
    // Squats, by pattern: the leg press, the goblet squat and the front squat. Back squat is on the card already,
    // the box squat is the lift going out, the bench press is push work and the rows are pull work.
    assert.deepStrictEqual(names(sh.view.sameJob), ['Dumbbell goblet squat', 'Front squat', 'Leg press']);
    assert.deepStrictEqual(sh.view.otherJob, [], 'the kit holds no other leg pattern');
    assert.deepStrictEqual([sh.view.outName, sh.view.kindTag, sh.view.regionTag, sh.view.slotTag, sh.view.keeps], [BOX, 'Squat', 'Leg day', 'Main lift', '4×3 at RPE 7']);
    assert.equal(sh.view.flowNote, '');
    // An accessory row is not the Main slot, and a row is pull work.
    const row = swapSheetOf(prog, 1, 'mon', 1, 0)!;
    assert.deepStrictEqual([row.view.outName, row.view.kindTag, row.view.regionTag, row.view.keeps], ['Barbell row', 'Row', 'Pull day', '3×8 at RPE 7']);
    assert.notEqual(row.view.slotTag, 'Main lift');
    assert.deepStrictEqual(names(row.view.sameJob), ['Dumbbell row']);
  });

  test('nothing in the kit does the job: both lists are empty; no lift at that place: no sheet', () => {
    const sh = swapSheetOf(program([]), 1, 'mon', 0, 0)!;
    assert.deepStrictEqual([sh.view.sameJob, sh.view.otherJob], [[], []]);
    assert.equal(swapSheetOf(program(), 1, 'mon', 0, 5), null);
    assert.equal(swapSheetOf(program(), 1, 'mon', 9, 0), null);
    assert.equal(swapSheetOf(program(), 2, 'mon', 0, 0), null);
  });

  test('the universe is the day\'s own when it was built under an overlay, else the program\'s', () => {
    const prog = { ...program(['Leg press']), _swapUniverseByKey: { trip: ['Dumbbell goblet squat'], empty: [] } } as unknown as DeckProgram;
    assert.deepStrictEqual(swapUniverseFor(prog, { sections: [] }), ['Leg press']);
    assert.deepStrictEqual(swapUniverseFor(prog, { sections: [], _ovKey: 'trip' } as never), ['Dumbbell goblet squat']);
    assert.deepStrictEqual(swapUniverseFor(prog, { sections: [], _ovKey: 'empty' } as never), ['Leg press'], 'an empty one falls to the program\'s');
    assert.deepStrictEqual(swapUniverseFor(prog, { sections: [], _ovKey: 'gone' } as never), ['Leg press']);
    assert.deepStrictEqual(swapUniverseFor(null, null), []);
  });

  test('at most eight of the same job and five of another; a lift with no pattern lists none here', () => {
    const many = Array.from({ length: 12 }, (_, i) => 'Back squat ' + i);
    const c = swapCandidates(BOX, program().weeks[1]!['mon']!, program([...many, 'Leg press', GOB, 'Front squat']));
    assert.equal(c.pattern, 'squat');
    assert.equal(c.region, 'legs');
    assert.ok(c.tier1.length <= 8 && c.tier2.length <= 5);
    assert.deepStrictEqual(auxSwapCandidates(BOX, program().weeks[1]!['mon']!, program()), [], 'a squat is in no aux family');
  });

  // Supersets never cross fixed stations: a round's other lift is asked before a row is offered. Dead bugs go
  // anywhere; the cable is one station and the landmine another, and the leg press stands at the stack, the squat
  // at the rack.
  test('a lift of an aux family inside a round: its family, by name, and only what can share the partner\'s station', () => {
    const round = (partner: string): DeckProgram => ({
      id: 'P1', cfg: { unit: 'lbs', equipment: 'commercial' }, _swapUniverse: [],
      weeks: { 1: { mon: { sections: [{ label: 'Round', superset: true, items: [{ name: 'Dead bugs', detail: '2×10' }, { name: partner, detail: '3×8' }] }] } } },
    }) as unknown as DeckProgram;
    const stack = swapSheetOf(round('Leg press'), 1, 'mon', 0, 0)!;
    assert.equal(stack.view.kindTag, 'Core', 'the family\'s name, where a lift has no pattern');
    assert.deepStrictEqual(stack.view.otherJob, []);
    const at = (sh: typeof stack): string[] => sh.view.sameJob.map((r) => r.name);
    assert.ok(at(stack).includes('Bird dogs') && at(stack).includes('Cable woodchoppers') && !at(stack).includes('Landmine rotations'), at(stack).join(', '));
    const rack = swapSheetOf(round('Back squat'), 1, 'mon', 0, 0)!;
    assert.ok(at(rack).includes('Bird dogs') && at(rack).includes('Landmine rotations') && !at(rack).includes('Cable woodchoppers'), at(rack).join(', '));
    assert.ok(!at(stack).includes('Dead bugs') && !at(rack).includes('Dead bugs'), 'never the lift going out');
    assert.deepStrictEqual(at(stack), [...at(stack)].sort(), 'by name');
  });

  test('the note on a much lighter pick, in today\'s words', () => {
    assert.equal(swapLoadNote('Back squat', 'Back squat'), '');
    // A deadlift is the heaviest kind of lift and a leg extension the lightest: the pick is told so, the other way is not.
    assert.equal(swapLoadNote('Deadlift', 'Leg extension'), 'Much lighter than deadlift. Volume holds, top-end strength does not.');
    assert.equal(swapLoadNote('Leg extension', 'Deadlift'), '');
  });
});

describe('native deck swap: a pick and put it back', () => {
  test('a wave Main swapped onto a goblet squat: the reps move to its window, the label follows, and the record, the count and the toast are today\'s', () => {
    const prog = program(), s = session(prog);
    const sh = swapSheetOf(prog, 1, 'mon', 0, 0)!;
    const r = swapMove(s, sh.ctx, GOB, NOW)!;
    assert.deepStrictEqual(r, { toast: 'Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Same sets, same effort. Reps move to 8 to 12.', nudge: false });
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail], [GOB, GOB_RX]);
    assert.equal(prog.weeks[1]!['mon']!.sections![0]!.label, 'Main — Dumbbell goblet squat');
    assert.deepStrictEqual(read(s.store, 'ia_swaps_P1'), { w1_mon: [{ from: BOX, to: GOB, ts: NOW, rx: [{ s: 0, i: 0, d: BOX_RX }] }] });
    assert.deepStrictEqual(read(s.store, 'ia_swapct_P1'), { [BOX]: { to: GOB, n: 1, offered: false } });
    assert.equal(s.store.get('ia_hist_P1'), null, 'a day not yet touched holds no snapshot, and a swap makes none');
    assert.deepStrictEqual(s.store.keys().sort(), ['ia_swapct_P1', 'ia_swaps_P1']);
    // The card: the same place, the new lift, its own lift log key, and what it was swapped in for.
    const card = deckView(s.store, prog, 1, 'mon', NOW)!.cards[0]!;
    assert.deepStrictEqual([card.key, card.title, card.swappedFrom, movesOf([card])[0]!.exKey], ['s0i0', GOB, BOX, 'dumbbell_goblet_squat']);
  });

  test('a pick that carries its numbers says so: a row for a row, 3×8 kept', () => {
    const prog = program(), s = session(prog);
    const r = swapMove(s, swapSheetOf(prog, 1, 'mon', 1, 0)!.ctx, 'Dumbbell row', NOW)!;
    assert.equal(r.toast, 'Dumbbell row in, barbell row out. Same job, same numbers.');
    assert.deepStrictEqual([item(prog, 1, 0).name, item(prog, 1, 0).detail], ['Dumbbell row', ROW_RX]);
    assert.equal(prog.weeks[1]!['mon']!.sections![1]!.label, 'Accessory', 'a label that does not name the lift stands');
  });

  test('put it back: the lift, its own prescription and its label return, the record goes, the count stays', () => {
    const prog = program(), s = session(prog);
    swapMove(s, swapSheetOf(prog, 1, 'mon', 0, 0)!.ctx, GOB, NOW);
    assert.equal(undoSwap(s, BOX), 'Barbell box squat is back on the card.');
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail], [BOX, BOX_RX]);
    assert.equal(prog.weeks[1]!['mon']!.sections![0]!.label, 'Main — ' + BOX);
    assert.deepStrictEqual(read(s.store, 'ia_swaps_P1'), {});
    assert.deepStrictEqual(read(s.store, 'ia_swapct_P1'), { [BOX]: { to: GOB, n: 1, offered: false } });
    // Nothing to put back: nothing changes and nothing is said.
    const before = JSON.stringify(s.store.keys().sort().map((k) => [k, s.store.get(k)]));
    assert.equal(undoSwap(s, BOX), null);
    assert.equal(undoSwap(s, 'Leg press'), null);
    assert.equal(JSON.stringify(s.store.keys().sort().map((k) => [k, s.store.get(k)])), before);
  });

  // D193 and D194: on an injured day the plan's filter decides what the card shows. A knee held at workaround holds
  // squats at RPE 7: the toast says so in place of "same numbers", and the dose from before the hold is kept beside
  // the card, never shown, for the next swap and for put it back.
  test('a pick on a day a knee plan holds: RPE 8 becomes 7, the toast names the hold, and the dose beneath is kept', () => {
    const held = (rx: string): DeckProgram => ({
      id: 'P1', cfg: { unit: 'lbs', injury: { region: 'knee', tier: 'workaround' } }, _swapUniverse: ['Leg press', GOB],
      weeks: { 1: { mon: { sections: [{ label: 'Main — ' + BOX, items: [{ name: BOX, detail: rx }] }] } } },
    }) as unknown as DeckProgram;
    const FIVES = '4×5 — RPE 8 (leave ~2 reps in reserve), 2–3 min rest';
    let prog = held(FIVES), s = session(prog);
    let r = swapMove(s, { secIdx: 0, itemIdx: 0, name: BOX, detail: FIVES }, 'Leg press', NOW)!;
    assert.equal(r.toast, 'Leg press in, barbell box squat out. Same sets, same reps. Your injury plan holds this one at RPE 7.');
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail, item(prog, 0, 0)['_preHold']], ['Leg press', '4×5 — RPE 7 (leave ~3 reps in reserve), 2–3 min rest', FIVES]);
    assert.equal(undoSwap(s, BOX), 'Barbell box squat is back on the card.');
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail, '_preHold' in item(prog, 0, 0)], [BOX, FIVES, false], 'put it back brings the lift\'s own dose and keeps nothing beside it');
    // A wave Main under the goblet squat's window: the reps move, and the hold is named in that toast's own words.
    const THREES = '4×3 — RPE 8 (leave ~2 reps in reserve), 2–3 min rest';
    prog = held(THREES); s = session(prog);
    r = swapMove(s, { secIdx: 0, itemIdx: 0, name: BOX, detail: THREES }, GOB, NOW)!;
    assert.equal(r.toast, 'Dumbbell goblet squat in, barbell box squat out. The load runs out before the reps do here. Reps move to 8 to 12. Your injury plan holds this one at RPE 7.');
    assert.deepStrictEqual([item(prog, 0, 0).detail, item(prog, 0, 0)['_preHold']], ['4×8–12 — RPE 7 (leave ~3 reps in reserve), 2–3 min rest', '4×8–12 — RPE 8 (leave ~2 reps in reserve), 2–3 min rest']);
  });

  test('put it back writes a stored dose only onto the lift it belongs to: a place that holds another lift is left alone', () => {
    // A record whose place is the accessory row's, as a day rebuilt in another order would leave it.
    const prog = program();
    item(prog, 0, 0).name = GOB;
    item(prog, 0, 0).detail = GOB_RX;
    const s = session(prog, memoryStore({ ia_swaps_P1: JSON.stringify({ w1_mon: [{ from: BOX, to: GOB, ts: NOW, rx: [{ s: 1, i: 0, d: BOX_RX }] }] }) }));
    assert.equal(undoSwap(s, BOX), 'Barbell box squat is back on the card.');
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail], [BOX, BOX_RX], 'the dose goes to the first place that holds the lift again');
    assert.deepStrictEqual([item(prog, 1, 0).name, item(prog, 1, 0).detail], ['Barbell row', ROW_RX], 'the row at the stored place keeps its own');
  });

  test('a second pick on the same place chains, and put it back steps back one pick at a time (D192)', () => {
    const prog = program(), s = session(prog);
    swapMove(s, swapSheetOf(prog, 1, 'mon', 0, 0)!.ctx, GOB, NOW);
    const again = swapSheetOf(prog, 1, 'mon', 0, 0)!;
    assert.equal(again.ctx.name, GOB);
    swapMove(s, again.ctx, 'Leg press', NOW + 1);
    const recs = (read(s.store, 'ia_swaps_P1') as Record<string, { from: string; to: string }[]>)['w1_mon']!;
    assert.deepStrictEqual(recs.map((e) => [e.from, e.to]), [[BOX, GOB], [GOB, 'Leg press']]);
    assert.equal(deckView(s.store, prog, 1, 'mon', NOW)!.cards[0]!.swappedFrom, GOB, 'the card names the lift that just left');
    undoSwap(s, GOB);
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail], [GOB, GOB_RX], 'one pick back, at the dose that pick gave');
    undoSwap(s, BOX);
    assert.deepStrictEqual([item(prog, 0, 0).name, item(prog, 0, 0).detail], [BOX, BOX_RX]);
    assert.deepStrictEqual(read(s.store, 'ia_swaps_P1'), {});
  });

  test('a day already touched: its snapshot takes the swap in, and takes the put back in', () => {
    const prog = program();
    const day = prog.weeks[1]!['mon']!;
    const s = session(prog, memoryStore({ ia_hist_P1: JSON.stringify({ w1_mon: day }) }));
    swapMove(s, swapSheetOf(prog, 1, 'mon', 0, 0)!.ctx, GOB, NOW);
    const snap = (): { name: string; detail: string } => (read(s.store, 'ia_hist_P1') as Record<string, { sections: { items: { name: string; detail: string }[] }[] }>)['w1_mon']!.sections[0]!.items[0]!;
    assert.deepStrictEqual([snap().name, snap().detail], [GOB, GOB_RX]);
    undoSwap(s, BOX);
    assert.deepStrictEqual([snap().name, snap().detail], [BOX, BOX_RX]);
  });

  test('the third pick running of one pair makes the nudge due; another pick starts the run again', () => {
    const prog = program(), s = session(prog);
    const pick = (to: string): boolean => { const r = swapMove(s, swapSheetOf(prog, 1, 'mon', 0, 0)!.ctx, to, NOW)!; undoSwap(s, BOX); return r.nudge; };
    assert.deepStrictEqual([pick(GOB), pick(GOB), pick(GOB)], [false, false, true]);
    assert.deepStrictEqual(read(s.store, 'ia_swapct_P1'), { [BOX]: { to: GOB, n: 3, offered: false } }, 'due, and not marked offered: no nudge is raised yet');
    assert.equal(pick('Leg press'), false);
    assert.deepStrictEqual(read(s.store, 'ia_swapct_P1'), { [BOX]: { to: 'Leg press', n: 1, offered: false } });
  });

  test('a pick on a lift that is no longer there does nothing', () => {
    const prog = program(), s = session(prog);
    assert.equal(swapMove(s, { secIdx: 0, itemIdx: 4, name: BOX, detail: BOX_RX }, GOB, NOW), null);
    assert.equal(swapMove(s, { secIdx: 7, itemIdx: 0, name: BOX, detail: BOX_RX }, GOB, NOW), null);
    assert.deepStrictEqual(s.store.keys(), []);
    assert.equal(item(prog, 0, 0).name, BOX);
  });
});

describe('native deck swap: the sheet\'s screen', () => {
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const sheet = strip(readFileSync(join(REPO, 'frontends/native/src/swap-sheet/SwapSheet.tsx'), 'utf8'));

  test('every word on the sheet is today\'s (swap-sheet.ts)', () => {
    for (const words of [
      '‹ Back', 'Swap out', "'Whatever you pick keeps ' + v.keeps + '.'", 'Same job', 'These do the same work. Your week keeps its shape.', 'Different job, same day',
      "'Still ' + v.otherRegion + ' work. You give up the ' + v.givenUp + ' for today.'", 'Nothing else in your kit does this job. Keep it, or drop it with the minus and move on.',
      'Swaps hold for this session only. Next week says what it always said.',
    ]) assert.ok(sheet.includes(words), words);
    assert.ok(sheet.includes("asyIcon('warning', 13)"), 'the caution mark is the app\'s own icon, never an emoji');
  });

  test('it slides as today\'s overlay does, at once under Reduce Motion, and writes nothing itself', () => {
    assert.ok(sheet.includes('Easing.bezier(0.32, 0.72, 0, 1)') && sheet.includes('const SLIDE_IN = 400;') && sheet.includes('const SLIDE_OUT = 360;'), 'motion.css: 400 ms in, 360 ms out');
    assert.ok(sheet.includes('new Animated.Value(calm ? 0 : 1)') && sheet.includes('if (calm) { onClose(); return; }'), 'still under Reduce Motion');
    assert.doesNotMatch(sheet, /\bstore\b|deck-writes|state-/, 'the sheet reaches no store');
    assert.ok(sheet.includes('onPress={() => leave(() => onPick(r.name))}') && sheet.includes('if (leaving.current) return;'), 'a row is one pick; a second tap while it leaves does nothing');
    assert.doesNotMatch(sheet, /translateY: (0|height)\b/, 'its place is one moving value, never a plain number');
  });
});
