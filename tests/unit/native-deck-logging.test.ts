// The Expo deck's logging, by hand (MIGRATION.md phase 3, the deck's second session; D289 P-NATIVEWRITES,
// docs/decisions/data-backup.md; D290 P-OWNROWS, docs/decisions/set-logging.md). Every expected value here is typed
// from today's rules (set-logging.ts, day-detail.ts, storage.ts, deck.ts, swap-sheet.ts) and from what core's writers
// store, never asked of the page: tests/integration/native-deck-logging.test.ts is where the two apps are held equal
// tap for tap. A move's fields (frontends/native/src/deck/set-fields.ts), what each tap stores (deck-writes.ts), and
// which files may write at all.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { ExCard } from '../../frontends/native/src/day-detail/session-sections-model.ts';
import { parseRx } from '../../frontends/native/src/deck/deck-readers.ts';
import { type DeckProgram, type Fields, deckView, freshFields, loggedCards, movesOf } from '../../frontends/native/src/deck/deck-screen.ts';
import { type Session, act, leftField, markDay, saveLift, tapDone, tapFill, tapLog, tapReuse, tapStep } from '../../frontends/native/src/deck/deck-writes.ts';
import { type MoveFields, afterLog, fieldsView, fillLoads, loadVals, openedSets, repVals, reuseLoad, stepRep, typeLoad, typeRep, typeSetLoad } from '../../frontends/native/src/deck/set-fields.ts';
import { REPO } from '../support/app.ts';

const NOW = 1_800_000_000_000;
const SQUAT = '3×5 — RPE 8';

/** A program of one week, typed by hand: a main lift, a core block of two, and a round of two. */
function program(unit = 'lbs'): DeckProgram {
  return {
    id: 'p1', cfg: { unit },
    weeks: { 1: {
      mon: { title: 'Legs', sections: [
        { label: 'Main lift', items: [{ name: 'Back squat', detail: SQUAT }] },
        { label: 'Core', core: true, coreHeader: 'Core — Trunk', items: [{ name: 'Side plank', detail: '2×30 sec' }, { name: 'Dead bug', detail: '2×8 each' }] },
        { label: 'Round A', superset: true, items: [{ name: 'Pike pushups', detail: '3×10' }, { name: 'Push-up', detail: '3×10' }] },
      ] },
      tue: { title: 'Split', sections: [{ label: 'Accessory', items: [{ name: 'Split squat', detail: '3 sets — RPE 8' }, { name: 'Split-squat heel-raise hold', detail: '2×30 sec each' }] }] },
    } },
  } as unknown as DeckProgram;
}
const parsed = (s: StateStore, key: string): unknown => { const v = s.get(key); return v == null ? null : JSON.parse(v); };
const dump = (s: StateStore): string => JSON.stringify(s.keys().sort().map((k) => [k, s.get(k)]));

/** A day opened: the session, its moves by key, and their fields as drawn. */
function opened(unit = 'lbs', dayKey = 'mon', store: StateStore = memoryStore({})): { S: Session; F: Fields; x: Record<string, ExCard> } {
  const prog = program(unit);
  const view = deckView(store, prog, 1, dayKey, NOW)!;
  assert.ok(view, 'the day opens a deck');
  const x = Object.fromEntries(movesOf(view.cards).map((m) => [m.exKey, m]));
  return { S: { store, prog, week: 1, dayKey }, F: freshFields(view.cards), x };
}

describe('native deck logging: a move\'s fields', () => {
  test('the fields as a card draws them: each set at its target, each load cell blank and inheriting, the load field blank', () => {
    const { F, x } = opened();
    assert.deepStrictEqual(Object.keys(F).sort(), ['back_squat', 'dead_bug', 'pike_pushups', 'push_up', 'side_plank']);
    assert.deepStrictEqual(F['back_squat'], {
      reps: [{ value: '5', placeholder: '', rx: '5', step: 1 }, { value: '5', placeholder: '', rx: '5', step: 1 }, { value: '5', placeholder: '', rx: '5', step: 1 }],
      loads: [{ value: '', placeholder: '', inherit: true }, { value: '', placeholder: '', inherit: true }, { value: '', placeholder: '', inherit: true }],
      load: { value: '', placeholder: '' }, logged: false, reuse: null,
      drawn: { head: '3 × 5', sub: 'as prescribed', varied: false, label: 'Load' },
    });
    // A timed hold steps by five seconds and carries no load. Its summary as drawn is its card's own.
    const hold = x['side_plank']!.log!.sets!;
    assert.deepStrictEqual(F['side_plank'], { reps: [{ value: '30', placeholder: '', rx: '30', step: 5 }, { value: '30', placeholder: '', rx: '30', step: 5 }], loads: [], load: null, logged: false, reuse: null,
      drawn: { head: hold.head, sub: hold.sub, varied: hold.varied, label: 'Load' } });
    assert.ok(x['back_squat']!.log!.load, 'a barbell lift takes a load');
  });

  // Today's card draws a logged move's summary from the day's entry, and restates it from the cells when the move is
  // next touched (set-logging.ts refreshSetSummary: after a step or a typed rep, after Log, and through markTopSet,
  // which stops short on a move with no load cell per set). The two differ where the entry holds another count of
  // sets than the card has rows: a lift logged on one card, then swapped in on a card of fewer sets, or an entry
  // from before v0.262.3 that holds another move's sets (D290).
  test('a summary stands as the card drew it until the page would restate it: four sets logged on a card of three rows', () => {
    const { F } = opened();
    const rx = parseRx(SQUAT, 'Back squat');
    const drawn = { head: '4 × 5', sub: 'logged', varied: false, label: 'Top set' };
    const f: MoveFields = { ...F['back_squat']!, logged: true, drawn };
    const says = (g: MoveFields): string[] => { const v = fieldsView(g, rx, 'lbs'); return [v.head, v.sub]; };
    assert.deepStrictEqual(says(f), ['4 × 5', 'logged'], 'as drawn');
    // The load's label is drawn from the entry's loads and restated with the summary: every cell at one load reads Load.
    assert.equal(fieldsView(f, rx, 'lbs').loadLabel, 'Top set');
    assert.equal(fieldsView(openedSets(f), rx, 'lbs').loadLabel, 'Load');
    // Varied stands as drawn too: an entry of uneven sets on rows that are all at their target.
    const uneven: MoveFields = { ...f, drawn: { ...drawn, varied: true } };
    assert.equal(fieldsView(uneven, rx, 'lbs').varied, true);
    assert.equal(fieldsView(openedSets(uneven), rx, 'lbs').varied, false);
    // Each of these restates it from the three rows.
    assert.deepStrictEqual(says(openedSets(f)), ['3 × 5', 'logged'], 'its sets open');
    assert.deepStrictEqual(says(stepRep(f, 0, 1)), ['6 / 5 / 5', ''], 'a step (a ladder carries no words after it)');
    assert.deepStrictEqual(says(typeRep(f, 0, '5')), ['3 × 5', 'logged'], 'a rep typed');
    assert.deepStrictEqual(says(typeLoad(f, '135')), ['3 × 5', 'logged'], 'the load typed');
    assert.deepStrictEqual(says(typeSetLoad(f, 1, '145')), ['3 × 5', 'logged'], 'a set\'s load typed');
    assert.deepStrictEqual(says(reuseLoad(f, 135)!), ['3 × 5', 'logged'], 'the reuse pill');
    assert.deepStrictEqual(says(fillLoads(f, 135)), ['3 × 5', 'logged'], 'Fill every set');
    assert.deepStrictEqual(says(afterLog(f, false, 0, 'lbs')), ['3 × 5', 'logged'], 'Log');
    // A move with no load cell per set: opening its sets marks no top set and restates nothing; a step does.
    const hold: MoveFields = { ...F['side_plank']!, logged: true, drawn: { head: 'as drawn', sub: 'logged', varied: false, label: 'Load' } };
    const hrx = parseRx('2×30 sec each', 'Side plank');
    assert.equal(fieldsView(openedSets(hold), hrx, 'lbs').head, 'as drawn');
    assert.notEqual(fieldsView(stepRep(hold, 0, 5), hrx, 'lbs').head, 'as drawn');
  });

  test('a step moves a set by one and never under zero; an open set steps up from nothing', () => {
    const { F } = opened();
    const f = F['back_squat']!;
    assert.deepStrictEqual(stepRep(f, 0, 1).reps.map((r) => r.value), ['6', '5', '5']);
    assert.deepStrictEqual(stepRep(stepRep(f, 2, -1), 2, -1).reps.map((r) => r.value), ['5', '5', '3']);
    const zero: MoveFields = { ...f, reps: [{ value: '0', placeholder: '', rx: '5', step: 1 }] };
    assert.equal(stepRep(zero, 0, -1).reps[0]!.value, '0');
    // An open set: blank, with "max" for a placeholder, which is no number.
    const open: MoveFields = { ...f, reps: [{ value: '', placeholder: 'max', rx: null, step: 1 }] };
    assert.equal(stepRep(open, 0, 1).reps[0]!.value, '1');
    // A blank set whose placeholder is a number steps from that number (the page reads the placeholder of a blank row).
    const ten: MoveFields = { ...f, reps: [{ value: '', placeholder: '10', rx: '10', step: 1 }] };
    assert.deepStrictEqual([stepRep(ten, 0, 1).reps[0]!.value, stepRep(ten, 0, -1).reps[0]!.value], ['11', '9']);
    assert.equal(stepRep(f, 9, 1), f, 'a row the move does not have changes nothing');
  });

  test('the load field reaches only the sets that still inherit it, and a set typed on its own stops inheriting until it is cleared', () => {
    const { F } = opened();
    let f = typeLoad(F['back_squat']!, '135');
    assert.deepStrictEqual(f.loads, [{ value: '', placeholder: '135', inherit: true }, { value: '', placeholder: '135', inherit: true }, { value: '', placeholder: '135', inherit: true }]);
    f = typeSetLoad(f, 1, '145');
    assert.deepStrictEqual(f.loads[1], { value: '145', placeholder: '135', inherit: false });
    f = typeLoad(f, '140');
    assert.deepStrictEqual(f.loads.map((c) => c.placeholder), ['140', '135', '140']);
    assert.deepStrictEqual(loadVals(f), [140, 145, 140]);
    // Cleared, the cell inherits again, and shows what it last inherited until the load field next changes.
    f = typeSetLoad(f, 1, '');
    assert.deepStrictEqual(f.loads[1], { value: '', placeholder: '135', inherit: true });
    assert.deepStrictEqual(loadVals(f), [140, 135, 140]);
    assert.deepStrictEqual(loadVals(typeLoad(f, '150')), [150, 150, 150]);
  });

  test('the reuse pill fills the load field, Fill every set fills each set\'s cell, and a move with no load field takes neither', () => {
    const { F } = opened();
    const f = reuseLoad(F['back_squat']!, 225)!;
    assert.deepStrictEqual([f.load, f.loads.map((c) => c.placeholder)], [{ value: '225', placeholder: '' }, ['225', '225', '225']]);
    assert.equal(reuseLoad(F['side_plank']!, 225), null);
    assert.deepStrictEqual(fillLoads(F['back_squat']!, 62.5).loads, [{ value: '62.5', placeholder: '', inherit: false }, { value: '62.5', placeholder: '', inherit: false }, { value: '62.5', placeholder: '', inherit: false }]);
  });

  test('what Log reads: a blank set reads its placeholder, and 0 where that is no number; a blank load cell reads the load it inherits', () => {
    const f: MoveFields = {
      reps: [{ value: '', placeholder: '10', rx: '10', step: 1 }, { value: '7', placeholder: '10', rx: '10', step: 1 }, { value: '', placeholder: 'max', rx: null, step: 1 }, { value: 'x', placeholder: '', rx: null, step: 1 }],
      loads: [{ value: '', placeholder: '135', inherit: true }, { value: '142.5', placeholder: '135', inherit: false }, { value: '', placeholder: '', inherit: true }],
      load: { value: '135', placeholder: '' }, logged: false, reuse: null, drawn: null,
    };
    assert.deepStrictEqual(repVals(f), [10, 7, 0, 0]);
    assert.deepStrictEqual(loadVals(f), [135, 142.5, 0]);
  });

  test('what the card says from its fields: the summary, its words, Varied, each set\'s difference, the top set and the foot', () => {
    const { F, x } = opened();
    const rx = parseRx(x['back_squat']!.rxDetail, 'Back squat');
    let f = F['back_squat']!;
    assert.deepStrictEqual(fieldsView(f, rx, 'lbs'), { head: '3 × 5', sub: 'as prescribed', varied: false, loadLabel: 'Load', footLabel: 'Every set', footValue: '—', top: [false, false, false], delta: ['', '', ''] });
    f = stepRep(stepRep(f, 0, 1), 2, -1);
    assert.deepStrictEqual(fieldsView(f, rx, 'lbs'), { head: '6 / 5 / 4', sub: '', varied: true, loadLabel: 'Load', footLabel: 'Every set', footValue: '—', top: [false, false, false], delta: ['+1', '', '-1'] });
    f = typeSetLoad(typeLoad(f, '135'), 1, '145');
    const v = fieldsView(f, rx, 'lbs');
    assert.deepStrictEqual([v.loadLabel, v.footLabel, v.footValue, v.top], ['Top set', 'Top set', '145 lbs', [false, true, false]]);
    // Every set at one load: none is marked, and the foot says so.
    const flat = fieldsView(typeLoad(F['back_squat']!, '60'), rx, 'kg');
    assert.deepStrictEqual([flat.loadLabel, flat.footLabel, flat.footValue, flat.top], ['Load', 'Every set', '60 kg', [false, false, false]]);
    // Logged as prescribed, and logged off the prescription.
    assert.equal(fieldsView(afterLog(F['back_squat']!, false, 0, 'lbs'), rx, 'lbs').sub, 'logged');
    const seven = [0, 1, 2].reduce((g, s) => typeRep(g, s, '4'), F['back_squat']!);
    assert.deepStrictEqual([fieldsView(seven, rx, 'lbs').head, fieldsView(seven, rx, 'lbs').sub], ['3 × 4', 'not logged']);
  });
});

describe('native deck logging: what a tap stores', () => {
  test('a step before Log is a draft in the day\'s log, with the day snapshotted on its first touch, and no lift recorded', () => {
    const { S, F } = opened();
    const G = tapStep(S, F, 'back_squat', 0, 1, NOW);
    assert.deepStrictEqual(G['back_squat']!.reps.map((r) => r.value), ['6', '5', '5']);
    assert.deepStrictEqual(parsed(S.store, 'ia_logs_p1'), { w1_mon: { week: 1, sets: { back_squat: { r: ['6', '5', '5'], w: ['', '', ''], L: '' } }, ts: NOW } });
    assert.deepStrictEqual(parsed(S.store, 'ia_hist_p1'), { w1_mon: JSON.parse(JSON.stringify(S.prog.weeks[1]!['mon'])) });
    assert.equal(S.store.get('ia_exw_p1'), null);
    assert.deepStrictEqual(S.store.keys().sort(), ['ia_hist_p1', 'ia_logs_p1']);
  });

  test('a typed field stores nothing until it is left, then the cells as typed, untouched ones blank', () => {
    const { S, F } = opened();
    const typed: Fields = { ...F, back_squat: typeSetLoad(typeLoad(typeRep(F['back_squat']!, 1, '4'), '135'), 2, '125') };
    assert.deepStrictEqual(S.store.keys(), []);
    leftField(S, typed, 'back_squat', NOW);
    assert.deepStrictEqual((parsed(S.store, 'ia_logs_p1') as { w1_mon: { sets: unknown } }).w1_mon.sets, { back_squat: { r: ['5', '4', '5'], w: ['', '', '125'], L: '135' } });
    // A blank cell over a placeholder is still blank in a draft: the load field, a set's load, an open set.
    const blank: MoveFields = { reps: [{ value: '', placeholder: 'max', rx: null, step: 1 }], loads: [{ value: '', placeholder: '135', inherit: true }], load: { value: '', placeholder: '135' }, logged: false, reuse: null, drawn: null };
    leftField(S, { ...typed, back_squat: blank }, 'back_squat', NOW);
    assert.deepStrictEqual((parsed(S.store, 'ia_logs_p1') as { w1_mon: { sets: unknown } }).w1_mon.sets, { back_squat: { r: [''], w: [''], L: '' } });
  });

  test('the pills are saved at once: the reuse pill into the load field, Fill every set into each set', () => {
    const { S, F } = opened();
    const G = tapReuse(S, F, 'back_squat', 225, NOW);
    assert.deepStrictEqual((parsed(S.store, 'ia_logs_p1') as { w1_mon: { sets: unknown } }).w1_mon.sets, { back_squat: { r: ['5', '5', '5'], w: ['', '', ''], L: '225' } });
    tapFill(S, G, 'back_squat', 205, NOW);
    assert.deepStrictEqual((parsed(S.store, 'ia_logs_p1') as { w1_mon: { sets: unknown } }).w1_mon.sets, { back_squat: { r: ['5', '5', '5'], w: ['205', '205', '205'], L: '225' } });
    // A move with no load field: the pill does nothing and stores nothing.
    const before = dump(S.store);
    assert.equal(tapReuse(S, G, 'side_plank', 225, NOW), G);
    assert.equal(dump(S.store), before);
  });

  test('Log records the lift under the heaviest set, with every set and every load, drops the draft, and says so', () => {
    const { S, F, x } = opened();
    let G = tapStep(S, F, 'back_squat', 0, 1, NOW);
    G = leftField(S, { ...G, back_squat: typeSetLoad(typeLoad(G['back_squat']!, '135'), 1, '145') }, 'back_squat', NOW);
    const r = tapLog(S, G, x['back_squat']!, NOW + 1);
    assert.equal(r.toast, '145 lbs logged ✓');
    assert.deepStrictEqual(parsed(S.store, 'ia_exw_p1'), { back_squat: { name: 'Back squat', entries: [{ weight: 145, setsReps: SQUAT, setsDone: [6, 5, 5], setsW: [135, 145, 135], week: 1, day: 'mon', ts: NOW + 1 }] } });
    assert.deepStrictEqual(parsed(S.store, 'ia_logs_p1'), { w1_mon: { week: 1, ts: NOW } }, 'the draft is gone, the day\'s entry stays');
    // The card as Log leaves it: logged, the load solid in its field, the pill's words restated.
    const f = r.fields['back_squat']!;
    assert.deepStrictEqual([f.logged, f.load, f.reuse], [true, { value: '145', placeholder: '145' }, { text: '145 lbs', rec: 'earlier today' }]);
    assert.deepStrictEqual(f.reps.map((c) => c.value), ['6', '5', '5'], 'the cells stay as typed');
  });

  test('a move with no load logs its sets alone; with nothing to log it says so and stores nothing', () => {
    const { S, F, x } = opened();
    const r = tapLog(S, F, x['side_plank']!, NOW);
    assert.equal(r.toast, 'Logged ✓');
    // Log was the day's first touch here, so Log snapshotted it (D181).
    assert.deepStrictEqual(parsed(S.store, 'ia_hist_p1'), { w1_mon: JSON.parse(JSON.stringify(S.prog.weeks[1]!['mon'])) });
    assert.deepStrictEqual(parsed(S.store, 'ia_exw_p1'), { side_plank: { name: 'Side plank', entries: [{ weight: 0, setsReps: '2×30 sec', setsDone: [30, 30], setsW: [], week: 1, day: 'mon', ts: NOW }] } });
    const before = dump(S.store);
    const none = saveLift(S, 'box_breathing', 'Box breathing', '', { reps: [], loads: [], load: null, logged: false, reuse: null, drawn: null }, NOW);
    assert.deepStrictEqual([none.ok, none.toast, none.fields.logged], [false, 'Nothing to log here', false]);
    assert.equal(dump(S.store), before);
  });

  test('a kilogram program stores pounds: 100 kg is 220.462 lb, stored 220, and the toast says what was typed', () => {
    const { S, F, x } = opened('kg');
    const r = tapLog(S, { ...F, back_squat: typeLoad(F['back_squat']!, '100') }, x['back_squat']!, NOW);
    assert.equal(r.toast, '100 kg logged ✓');
    const e = (parsed(S.store, 'ia_exw_p1') as { back_squat: { entries: { weight: number; setsW: number[] }[] } }).back_squat.entries[0]!;
    assert.deepStrictEqual([e.weight, e.setsW], [220, [220, 220, 220]]);
    assert.deepStrictEqual(r.fields['back_squat']!.reuse, { text: '100 kg', rec: 'earlier today' });
  });

  test('a change after Log goes straight to the entry, under the prescription it was logged with, and leaves no draft', () => {
    const { S, F, x } = opened();
    const G = tapLog(S, { ...F, back_squat: typeLoad(F['back_squat']!, '135') }, x['back_squat']!, NOW).fields;
    const H = tapStep(S, G, 'back_squat', 0, 1, NOW + 5);
    assert.deepStrictEqual(parsed(S.store, 'ia_exw_p1'), { back_squat: { name: 'Back squat', entries: [{ weight: 135, setsReps: SQUAT, setsDone: [6, 5, 5], setsW: [135, 135, 135], week: 1, day: 'mon', ts: NOW + 5 }] } });
    assert.equal((parsed(S.store, 'ia_logs_p1') as { w1_mon?: { sets?: unknown } } | null)?.w1_mon?.sets, undefined);
    assert.equal(H['back_squat']!.logged, true);
  });

  test('Done, next one logs each move of the card that is not logged, quietly, and leaves a logged one alone', () => {
    const { S, F, x } = opened();
    const view = deckView(S.store, S.prog, 1, 'mon', NOW)!;
    const core = view.cards.find((c) => c.kind === 'block')!;
    assert.deepStrictEqual(core.moves.map((m) => m.exKey), ['side_plank', 'dead_bug']);
    const G = tapLog(S, F, x['side_plank']!, NOW).fields;
    assert.equal(loggedCards(view.cards, G).find((c) => c.key === core.key)!.logged, false, 'one move of two logged: the card is not');
    const r = tapDone(S, G, loggedCards(view.cards, G).find((c) => c.key === core.key)!.moves, NOW + 9);
    assert.deepStrictEqual([r.tried, r.toasts], [1, []]);
    const log = parsed(S.store, 'ia_exw_p1') as Record<string, { entries: { setsDone: number[]; ts: number }[] }>;
    assert.deepStrictEqual([log['side_plank']!.entries[0]!.ts, log['dead_bug']!.entries[0]!.ts, log['dead_bug']!.entries[0]!.setsDone], [NOW, NOW + 9, [8, 8]]);
    assert.ok(loggedCards(view.cards, r.fields).find((c) => c.key === core.key)!.logged, 'the card is logged once each move is');
    // A card whose moves are all logged: nothing to try.
    assert.equal(tapDone(S, r.fields, loggedCards(view.cards, r.fields).find((c) => c.key === core.key)!.moves, NOW).tried, 0);
  });

  // D290: a move's entry holds that move's sets. Split squat's key is the start of Split-squat heel-raise hold's.
  test('two moves whose keys start alike: each one\'s Log stores its own sets (D290)', () => {
    const { S, F, x } = opened('lbs', 'tue');
    assert.deepStrictEqual(Object.keys(F).sort(), ['split_squat', 'split_squat_heel_raise_hold']);
    let G: Fields = { ...F, split_squat: [8, 8, 7].reduce((f, v, s) => typeRep(f, s, String(v)), F['split_squat']!) };
    G = { ...G, split_squat_heel_raise_hold: [31, 32].reduce((f, v, s) => typeRep(f, s, String(v)), G['split_squat_heel_raise_hold']!) };
    G = tapLog(S, G, x['split_squat']!, NOW).fields;
    tapLog(S, G, x['split_squat_heel_raise_hold']!, NOW);
    const log = parsed(S.store, 'ia_exw_p1') as Record<string, { entries: { setsDone: number[] }[] }>;
    assert.deepStrictEqual([log['split_squat']!.entries[0]!.setsDone, log['split_squat_heel_raise_hold']!.entries[0]!.setsDone], [[8, 8, 7], [31, 32]]);
  });

  test('Mark the day done merges the effort and notes into the day\'s entry, keeps every other field, and marks the day complete', () => {
    const store = memoryStore({ ia_logs_p1: JSON.stringify({ w1_mon: { run_dist: '3.1', rpe: '6', week: 1, ts: 5 } }) });
    const { S } = opened('lbs', 'mon', store);
    markDay(S, 'Legs', 8, 'Bar felt heavy', NOW);
    assert.deepStrictEqual(parsed(store, 'ia_logs_p1'), { w1_mon: { run_dist: '3.1', rpe: '8', week: 1, ts: NOW, notes: 'Bar felt heavy' } });
    assert.deepStrictEqual(parsed(store, 'ia_comp_p1'), { w1_mon: { title: 'Legs', ts: NOW, status: 'complete' } });
    assert.ok((parsed(store, 'ia_hist_p1') as Record<string, unknown>)['w1_mon'], 'the day is snapshotted');
    // The slider never moved (D219): an effort already stored stays, and a day with none stores a blank.
    markDay(S, 'Legs', null, '', NOW + 1);
    assert.deepStrictEqual(parsed(store, 'ia_logs_p1'), { w1_mon: { run_dist: '3.1', rpe: '8', week: 1, ts: NOW + 1, notes: '' } });
    const fresh = opened().S;
    markDay(fresh, 'Legs', null, '', NOW);
    assert.deepStrictEqual(parsed(fresh.store, 'ia_logs_p1'), { w1_mon: { rpe: '', notes: '', week: 1, ts: NOW } });
  });

  test('a skip marks the move on the day and stores the edit; put back clears both; a round goes by its token', () => {
    const { S } = opened();
    const item = (name: string): { _skipped?: boolean } => S.prog.weeks[1]!['mon']!.sections!.flatMap((s) => s.items).find((i) => i.name === name)!;
    assert.equal(act(S, { kind: 'exercise', name: 'Side plank' }, true), 'Side plank is off today. Tap to put it back.');
    assert.equal(item('Side plank')._skipped, true);
    assert.deepStrictEqual(parsed(S.store, 'ia_edits_p1'), { w1_mon: { add: [], skip: ['Side plank'] } });
    assert.equal(S.store.get('ia_hist_p1'), null, 'a day not yet touched has no snapshot to renew');
    assert.equal(act(S, { kind: 'exercise', name: 'Side plank' }, false), 'Side plank is back on the card.');
    assert.equal(item('Side plank')._skipped, undefined);
    assert.deepStrictEqual(parsed(S.store, 'ia_edits_p1'), {});
    // A round, by its section's place on the day.
    assert.equal(act(S, { kind: 'round', secIdx: 2 }, true), 'Round is off today. Tap to put it back.');
    assert.equal(S.prog.weeks[1]!['mon']!.sections![2]!._skipped, true);
    assert.deepStrictEqual(parsed(S.store, 'ia_edits_p1'), { w1_mon: { add: [], skip: ['__ss:2'] } });
    assert.equal(act(S, { kind: 'round', secIdx: 2 }, false), 'Round is back on the card.');
    // Skip all on a block: each name in turn, the last one's words left on screen.
    assert.equal(act(S, { kind: 'names', names: ['Side plank', 'Dead bug'] }, true), 'Dead bug is off today. Tap to put it back.');
    assert.deepStrictEqual(parsed(S.store, 'ia_edits_p1'), { w1_mon: { add: [], skip: ['Side plank', 'Dead bug'] } });
    // A move the day does not hold: nothing marked, nothing stored, nothing said.
    const before = dump(S.store);
    assert.equal(act(S, { kind: 'exercise', name: 'Bench press' }, true), null);
    assert.equal(dump(S.store), before);
  });

  test('a skip on a day already touched renews its snapshot, so the day is kept as the athlete left it', () => {
    const { S, F } = opened();
    tapStep(S, F, 'back_squat', 0, 1, NOW);
    act(S, { kind: 'exercise', name: 'Dead bug' }, true);
    const snap = (parsed(S.store, 'ia_hist_p1') as { w1_mon: { sections: { items: { name: string; _skipped?: boolean }[] }[] } }).w1_mon;
    assert.deepStrictEqual(snap.sections[1]!.items.map((i) => [i.name, i._skipped === true]), [['Side plank', false], ['Dead bug', true]]);
  });
});

describe('native deck logging: which files write', () => {
  const dir = join(REPO, 'frontends/native/src/deck');
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const code = (f: string): string => strip(readFileSync(join(dir, f), 'utf8'));
  const files = readdirSync(dir).filter((f) => /\.tsx?$/.test(f)).sort();
  const writers = (t: string): string[] => [...new Set([...t.matchAll(/\b((?:write|record|refresh|clear|drop|set|add|count|mark)[A-Z]\w*)\(\s*(?:s\.)?store\b/g)].map((m) => m[1]!))].filter((n) => n !== 'setDraftOf').sort();

  test('the deck\'s folder holds the screen, its opening, its seam, its readers, its fields, its writes and the model\'s copy', () => {
    assert.deepStrictEqual(files, ['Deck.tsx', 'DeckOpening.tsx', 'deck-model.ts', 'deck-readers.ts', 'deck-screen.ts', 'deck-swaps.ts', 'deck-writes.ts', 'grow-motion.ts', 'set-fields.ts']);
    // The session sheet's folder holds the card model the deck stands on, and the sheet (tests/unit/native-session-sheet.test.ts).
    assert.ok(readdirSync(join(REPO, 'frontends/native/src/day-detail')).includes('session-sections-model.ts'));
    assert.deepStrictEqual(readdirSync(join(REPO, 'frontends/native/src/swap-sheet')).sort(), ['SwapSheet.tsx', 'swap-sheet-model.ts']);
  });

  // The fifteen of core's writers the deck's taps end in (tests/measure/native-deck-logging_writes.md,
  // native-deck-swap_writes.md and native-deck-popups_raises.md): the day's snapshot and its renewal, a set draft and
  // its drop, the lift log, the day's log, the day's status, a skip and its undo, a swap's record, its count and its
  // undo; and the nudge's three: the pair marked offered, the preference written into the program, and the rebuild,
  // which stores what a launch's rebuild stores. setDraftOf is a reader.
  test('deck-writes.ts alone calls core\'s writers, and exactly the fifteen the measures named; nothing writes a key by hand', () => {
    assert.deepStrictEqual(writers(code('deck-writes.ts')), ['addSkipEdit', 'addSwapRecord', 'countSwap', 'dropSetDraft', 'dropSkipEdit', 'dropSwapRecord', 'markSwapNudged', 'recordDaySnapshot', 'recordSetDraft', 'recordSwapPreference', 'refreshDaySnapshot', 'refreshStoredProgram', 'setDayStatus', 'writeDayLogs', 'writeLiftLog']);
    for (const f of files.filter((x) => x !== 'deck-writes.ts')) assert.deepStrictEqual(writers(code(f)), [], f + ' calls none of core\'s writers');
    const sheet = ['SwapSheet.tsx', 'swap-sheet-model.ts'].map((f) => strip(readFileSync(join(REPO, 'frontends/native/src/swap-sheet', f), 'utf8'))).join('\n');
    assert.deepStrictEqual(writers(sheet), [], 'the swap sheet calls none of core\'s writers');
    // The nudge's card draws and writes nothing: its two answers are deck-writes.ts dismissNudge and acceptNudge.
    const nudge = ['SwapNudge.tsx', 'swap-nudge-model.ts'].map((f) => strip(readFileSync(join(REPO, 'frontends/native/src/swap-nudge', f), 'utf8'))).join('\n');
    assert.deepStrictEqual(writers(nudge), [], 'the nudge\'s card calls none of core\'s writers');
    assert.doesNotMatch(files.filter((x) => x !== 'deck-writes.ts').map(code).join('\n') + sheet + nudge, /markSwapNudged|recordSwapPreference|refreshStoredProgram/, 'the nudge\'s writers are called from deck-writes.ts alone');
    const all = files.map(code).join('\n') + sheet + strip(readFileSync(join(REPO, 'frontends/native/src/day-detail/session-sections-model.ts'), 'utf8'));
    assert.doesNotMatch(all, /\b\w*[sS]tore\.(set|remove)\(/, 'no key is written or removed by hand');
    assert.doesNotMatch(all, /localStorage|AsyncStorage/, 'no other storage');
    assert.doesNotMatch(all, /ia_(pop|remind|season)/, 'the pop-ups\' keys are named nowhere in the deck');
  });

  test('the screen reaches the store only through deck-writes.ts and the day\'s draw', () => {
    const deck = code('Deck.tsx');
    assert.deepStrictEqual([...deck.matchAll(/from '(@ia\/core[^']*)'/g)].map((m) => m[1]), ['@ia/core/engine/icons.ts', '@ia/core/engine/state-store.ts']);
    assert.match(deck, /import type \{ StateStore \} from '@ia\/core\/engine\/state-store\.ts'/);
    assert.match(deck, /import \{ type Session, acceptNudge, act, dismissNudge, leftField, markDay, nudgeWords, swapMove, tapDone, tapFill, tapLog, tapReuse, tapStep, undoSwap \} from '\.\/deck-writes'/);
    const body = deck.replace(/^import [^\n]*\n/gm, '');
    assert.deepStrictEqual([...new Set([...body.matchAll(/\bstore\b[^,;)\]}\n]*/g)].map((m) => m[0].trim()))].sort(), ['store', 'store: StateStore'].sort(), 'the store is only handed on');
  });

  test('each control that writes calls its tap; remove alone still takes no press', () => {
    const deck = code('Deck.tsx');
    for (const wired of [
      'onPress={() => h.log(x)}', 'onPress={() => h.step(x.exKey, r.s, -r.step)}', 'onPress={() => h.step(x.exKey, r.s, r.step)}',
      'onPress={() => h.reuse(x.exKey, reuse.value)}', 'onPress={() => h.fill(x.exKey, load.fill!.value)}', 'onPress={advance}',
      'onPress={() => skip(c)}', 'onPress={() => edit(c.undo!, false)}', 'onPress={() => h.skip(x.name)}', 'onPress={() => h.unskip(x.name)}',
      'onChangeText={(t) => h.rep(x.exKey, r.s, t)}', 'onChangeText={(t) => h.setLoad(x.exKey, r.s, t)}', 'onChangeText={(t) => h.load(x.exKey, t)}',
      'onFocus={() => h.focus(x.exKey)} onBlur={() => h.blur(x.exKey)}', 'onNotes={setNotes}', 'onRpe={(v) => { rpeTouched.current = true; setRpe(v); }}',
    ]) assert.ok(deck.includes(wired), 'Deck.tsx wires ' + wired);
    // The effort is stored only once the slider was moved (D219), with the notes, by Mark the day done alone.
    assert.ok(deck.includes('markDay(session, view.title, rpeTouched.current ? rpe : null, notes, Date.now());'));
    assert.equal((deck.match(/\bmarkDay\(/g) || []).length, 1);
    // Swap and put it back, from a single lift's card and from a move's row (the deck's third session): the sheet
    // opens on the lift at that place, a pick swaps it, and each put it back undoes the lift it names.
    for (const wired of [
      'onPress={() => openSwap(c.swap!.secIdx, c.swap!.itemIdx)}', 'onPress={() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)}',
      'onPress={() => putBack(c.swappedFrom!)}', 'onPress={() => h.unswap(x.swappedFrom!)}',
      '{swap && <SwapSheet palette={p} view={swap.view} calm={calm} onPick={pick} onClose={() => setSwap(null)} />}',
    ]) assert.ok(deck.includes(wired), 'Deck.tsx wires ' + wired);
    assert.ok(deck.includes('const r = swapMove(session, swap.ctx, to, Date.now());') && deck.includes('const toast = undoSwap(session, from);'));
    // Each draws the day again, as a skip does, and raises the toast its tap gave; each takes the keyboard off its field first.
    assert.ok(deck.includes('    const r = swapMove(session, swap.ctx, to, Date.now());\n    if (!r) return;\n    redraw();\n    say(r.toast);'));
    assert.ok(deck.includes('    const toast = undoSwap(session, from);\n    if (!toast) return;\n    redraw();\n    say(toast);'));
    assert.ok(deck.includes('function openSwap(secIdx: number, itemIdx: number): void {\n    leave();') && deck.includes('function putBack(from: string): void {\n    leave();'));
    assert.equal((deck.match(/\bswapMove\(/g) || []).length, 1);
    assert.equal((deck.match(/\bundoSwap\(/g) || []).length, 1);
    assert.ok(deck.includes("if (sheet) setSwap(sheet); else say('Nothing to swap here');"), 'today\'s toast where there is nothing to swap');
    // No control is drawn and off any longer but remove, which today's deck does not reach either (deck.css hides the
    // chip on the single lift's card an added move gets): its word is plain text, with no press.
    assert.equal((deck.match(/accessibilityState=\{\{ disabled: true \}\}/g) || []).length, 0);
    assert.match(deck, /<Text style=\{\{ color: p\.onBand \}\}>remove<\/Text>/);
  });

  test('a press on a control takes the keyboard off its field first, so the field\'s cells are saved before the tap', () => {
    const deck = code('Deck.tsx');
    for (const tap of ['step: (exKey, s, step) => { leave();', 'reuse: (exKey, value) => { leave();', 'fill: (exKey, value) => { leave();', 'log: (x) => {\n      leave();']) assert.ok(deck.includes(tap), tap);
    assert.match(deck, /function edit\(a: CardAct, off: boolean\): void \{\n    leave\(\);/);
    assert.match(deck, /if \(!c \|\| busy\.current\) return;\n    leave\(\);/);
  });

  test('the two motions are today\'s numbers, and both are still under Reduce Motion', () => {
    const deck = code('Deck.tsx');
    // Call 10 (deck.ts advance, deck.css deckTuck): a 340 ms lift, held 560 ms when the card was just marked and 220
    // when not, then 760 ms out to the side and behind, the first 42% of it out.
    assert.ok(deck.includes('duration: 340, easing: Easing.bezier(0.2, 0.8, 0.2, 1)') && deck.includes('}, marking ? 560 : 220);'));
    assert.ok(deck.includes('const TUCK = Easing.bezier(0.45, 0, 0.2, 1);') && deck.includes('const TUCK_OUT = 319;') && deck.includes('const TUCK_IN = 441;'));
    assert.equal(319 + 441, 760);
    assert.ok(deck.includes('outputRange: [0, stageW * 0.72, 45]') && deck.includes('outputRange: [-10, -30, -21]') && deck.includes('outputRange: [1.03, 0.97, 0.895]') && deck.includes("outputRange: ['0deg', '10deg', '4.8deg']"));
    // Call 5 (deck.css deckHit, deckHoleIn, deckD1 to deckD4): the card shakes for 520 ms, the hole lands in 380, four shards fly for 620.
    assert.ok(deck.includes('duration: 520') && deck.includes('duration: 380, easing: Easing.bezier(0.3, 1.2, 0.4, 1)') && deck.includes('duration: 620, delay: k * 15, easing: Easing.bezier(0.2, 0.6, 0.5, 1)'));
    assert.ok(deck.includes('outputRange: [0, -14, 12, -9, 6, -4, 2, 0]') && deck.includes('{ s: 17, x: [-52, -98], y: [-26, 86], r: [-140, -300] }'));
    assert.ok(deck.includes('if (calm || n < 2) {') && deck.includes('if (calm) return;'), 'neither plays under Reduce Motion');
  });

  test('the toast and the Bugs line carry today\'s words and D289\'s', () => {
    const app = readFileSync(join(REPO, 'frontends/native/src/App.tsx'), 'utf8');
    assert.ok(app.includes('}).start(onDone), 2200);') && app.includes("backgroundColor: p.run") && app.includes("color: '#0a0a0a'"), 'the toast: the run colour, ink type, 2.2 s');
    const writes = readFileSync(join(dir, 'deck-writes.ts'), 'utf8');
    for (const words of ["'Nothing to log here'", "' logged ✓'", "'Logged ✓'", "' is off today. Tap to put it back.'", "' is back on the card.'", "'Round is off today. Tap to put it back.'", "'Round is back on the card.'"]) assert.ok(writes.includes(words), words);
    // Mark the day done raises the completion pop-up where the toast stood (D179; tests/unit/native-pop-ups.test.ts).
    assert.ok(!readFileSync(join(dir, 'Deck.tsx'), 'utf8').includes("say('Done ✓');"), 'no toast stands in for the pop-up any more');
    // D289's words stand under Your data on the Bugs tab, now drawn as today's (tests/unit/native-bugs-tab.test.ts).
    const words = readFileSync(join(REPO, 'frontends/native/src/bugs/bugs-screen.ts'), 'utf8');
    assert.ok(words.includes("export const OWN_COPY = 'Sets you log here stay in this app. Today\\'s app does not see them. Loading a backup replaces everything here.';"));
    assert.ok(readFileSync(join(REPO, 'frontends/native/src/bugs/Bugs.tsx'), 'utf8').includes('<Note id="backup-own-copy" palette={p}>{OWN_COPY}</Note>'));
  });
});
