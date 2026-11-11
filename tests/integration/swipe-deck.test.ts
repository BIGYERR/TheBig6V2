// The swipe deck (D275 P-DECK, docs/decisions/swipe-deck.md) on the booted app: HALF_MANNY's week 10 turned into decks
// through the session sheet's own reads (sectionsView over sectionReads), as the iOS app builds them. The expected decks
// are typed by hand from the canvas Mario approved ("Swipe Deck Concepts", Version 76, boards AD to AJ), with Thursday as
// D273 (P-PEAKLEGS, v0.256.0) trims the leg day before a tier A long run: the main and the first accessory block, the hip
// and foot and ankle drills, nothing else. Coach's read-ahead ruling: the deck keeps the engine's order, so the hinge day
// opens on its hinge and nothing is re-sorted or dropped.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { loadApp, pinClock } from '../support/app.ts';
import { type DeckCard, deckCards, deckOpens } from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import { type ExSection, sectionsView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';
import { sectionReads } from '../../frontends/app/src/app/screens/day-detail/session-sections-reads.ts';

const IA = loadApp();
pinClock(IA, '2026-11-01T10:00:00');
const W = IA.window;
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const P = clone(IA.buildProgram(clone(IA.fixtures.HALF_MANNY))) as unknown as { id: string; name: string; weeks: Record<number, Record<string, { rest?: boolean; sections?: ExSection[] } | null>> };
assert.equal(JSON.stringify(P.weeks), JSON.stringify(IA.buildProgram(clone(IA.fixtures.HALF_MANNY)).weeks), 'HALF_MANNY builds the same twice');
P.id = 'p_deck';
P.name = 'THE HALF MANNY';
IA.localStorage.setItem('ia_programs', JSON.stringify([P]));
IA.localStorage.setItem('ia_active', P.id);
IA.eval('showToast=function(){};activeProgId=null;activeProg=null;init();currentWeek=10;');
const bridge = { call: <T,>(n: string, ...a: unknown[]): T => W[n](...a) as T, global: <T,>(n: string): T => IA.eval(n) as T };

/** The deck the iOS app builds for one day of a week, week 10 unless named. */
function deckOf(dayKey: string, week = 10): DeckCard[] {
  IA.eval('currentWeek=' + week + ';');
  W['_setCurrentDayKey'](dayKey);
  const day = IA.eval('activeProg').weeks[week][dayKey] as { rest?: boolean; sections?: ExSection[] };
  const secs = day.rest ? [] : day.sections || [];
  return deckCards(secs, sectionsView(secs, 0, sectionReads(bridge)), (s) => W['_secRounds'](s) as number | null);
}
const shape = (cards: DeckCard[]) => cards.map((c) => [c.kind, c.kicker, c.title]);
const FIN = ['finish', 'Finish', 'Call it'];

describe('HALF_MANNY week 10 as decks', () => {
  test('each day holds the cards the canvas drew, the run left on This Week (D272), Thursday trimmed by D273, a title up to its dash (D283)', () => {
    assert.deepEqual(shape(deckOf('mon')), [['lift', 'Main', 'Deadlift'], ['round', 'Round', 'Pull superset A'], ['lift', 'Pull superset B', 'Dumbbell row'], FIN]);
    assert.deepEqual(shape(deckOf('tue')), [['lift', 'Main', 'Incline barbell press'], ['lift', 'Main, second lift', 'Barbell overhead press'], ['round', 'Round', 'Accessory'],
      ['lift', 'Chest + knee', 'Spanish squat hold (KB)'], ['block', 'Core', 'Rotational Power'], FIN]);
    assert.deepEqual(shape(deckOf('wed')), []);
    assert.deepEqual(shape(deckOf('thu')), [['lift', 'Main', 'Back squat'], ['round', 'Round', 'Leg circuit'], ['block', 'Prehab', 'Hip stability'],
      ['block', 'Prehab', 'Foot & ankle'], FIN]);
    assert.deepEqual(shape(deckOf('fri')), [['lift', 'Main', 'Dumbbell bench press'], ['lift', 'Main, second lift', 'Seated dumbbell shoulder press'], ['round', 'Round', 'Pump'],
      ['block', 'Core', 'Anti-Rotation'], FIN]);
    assert.deepEqual(shape(deckOf('sat')), [['cool', 'After the run', 'Stretch and roll'], FIN]);
    assert.deepEqual(shape(deckOf('sun')), []);
  });

  test('the cards say one meta line under the title, and the Main\'s cue without its rest (D283)', () => {
    const mon = deckOf('mon'), tue = deckOf('tue'), fri = deckOf('fri'), sat = deckOf('sat');
    const MAIN_CUE = 'Leave about three reps in reserve. Two or three warmup sets first.';
    assert.deepEqual([mon[0]!.meta, mon[0]!.cue], ['3 min rest between sets', MAIN_CUE]);
    assert.equal(mon[1]!.meta, '2 rounds · 90 sec rest after each');
    assert.equal(mon[2]!.meta, '60 to 90 sec rest between sets');
    assert.deepEqual([tue[0]!.meta, tue[0]!.cue], ['2 to 3 min rest between sets', MAIN_CUE]);
    assert.equal(tue[3]!.meta, '60 to 90 sec rest between sets');
    assert.equal(tue[4]!.meta, 'Core · Straight through · 60 to 90 sec rest');
    assert.deepEqual([fri[0]!.meta, fri[0]!.cue], ['2 to 3 min rest between sets', MAIN_CUE]);
    assert.equal(fri[3]!.meta, 'Core · Straight through · 60 to 90 sec rest');
    assert.equal(sat[0]!.meta, '5 easy moves · about 14 min');
    assert.deepEqual(mon.map((c) => c.rpe), [7, null, 7, null], 'the RPE mark sits on single lifts only (call 7)');
  });

  test('Start session opens the deck on a lift day and the session sheet on the long run, whose only card is its cool down', () => {
    assert.deepEqual(['mon', 'tue', 'thu', 'fri', 'sat'].map((d) => deckOpens(deckOf(d))), [true, true, true, true, false]);
  });

  test('the deck keeps the engine\'s order and every movement sits on exactly one card, so the hinge day opens on its hinge', () => {
    for (const d of ['mon', 'tue', 'thu', 'fri', 'sat']) {
      const day = IA.eval('activeProg').weeks[10][d] as { sections: ExSection[] };
      const want = clone(day.sections.flatMap((s) => s.items.map((it) => it.name)));
      const got = deckOf(d).flatMap((c) => c.views.flatMap((v) => (v.kind === 'section' ? v.body.items.map((x) => x.name) : [])));
      assert.deepEqual(got, want, d + ': the movements in the engine\'s order, none twice, none dropped');
    }
    assert.equal(deckOf('mon')[0]!.title, 'Deadlift');
  });
});

describe('the deck follows the app\'s own records', () => {
  test('in the taper and race week the note rides on the Primer card; no card is titled with its icon (D283 Amendment 1)', () => {
    const t13 = deckOf('mon', 13), t14 = deckOf('mon', 14);
    deckOf('mon');
    assert.deepEqual(shape(t13), [['lift', 'Primer', 'Trap bar deadlift'], FIN]);
    assert.equal(t13[0]!.cue, 'Taper. Volume and load pulled back so you arrive fresh.');
    assert.deepEqual(shape(t14), [['lift', 'Primer', 'Trap bar deadlift'], FIN]);
    assert.equal(t14[0]!.cue, 'Race week. Primer only. Movement quality, zero grind. The hay is in the barn.');
  });

  test('a skip made through the session sheet\'s handler punches the card and offers the undo; the undo puts it back', () => {
    W['_setCurrentDayKey']('mon');
    W['skipExercise']('Dumbbell row');
    const off = deckOf('mon')[2]!;
    assert.deepEqual([off.title, off.skipped, off.undo, off.meta], ['Dumbbell row', true, { kind: 'exercise', name: 'Dumbbell row' }, 'Dumbbell row is off today.']);
    W['_setCurrentDayKey']('mon');
    W['unskipExercise']('Dumbbell row');
    assert.equal(deckOf('mon')[2]!.skipped, false);
  });

  test('a round skipped whole keeps its slot; its undo is the round\'s', () => {
    W['_setCurrentDayKey']('mon');
    W['skipSuperset'](1);
    const r = deckOf('mon')[1]!;
    assert.deepEqual([r.kind, r.skipped, r.undo], ['round', true, { kind: 'round', secIdx: 1 }]);
    W['_setCurrentDayKey']('mon');
    W['unskipSuperset'](1);
    assert.equal(deckOf('mon')[1]!.skipped, false);
  });

  test('a lift logged for the day marks its card logged, and only that card', () => {
    assert.deepEqual(deckOf('mon').map((c) => c.logged), [false, false, false, false]);
    W['logExerciseWeight']('Deadlift', 155, '3×8', 10, [8, 8, 8], [155, 155, 155], 'mon');
    assert.deepEqual(deckOf('mon').map((c) => c.logged), [true, false, false, false]);
    assert.deepEqual(deckOf('tue').map((c) => c.logged), [false, false, false, false, false, false], 'a Monday log does not mark Tuesday');
  });
});
