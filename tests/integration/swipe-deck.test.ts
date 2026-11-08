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

/** The deck the iOS app builds for one day of week 10. */
function deckOf(dayKey: string): DeckCard[] {
  W['_setCurrentDayKey'](dayKey);
  const day = IA.eval('activeProg').weeks[10][dayKey] as { rest?: boolean; sections?: ExSection[] };
  const secs = day.rest ? [] : day.sections || [];
  return deckCards(secs, sectionsView(secs, 0, sectionReads(bridge)), (s) => W['_secRounds'](s) as number | null);
}
const shape = (cards: DeckCard[]) => cards.map((c) => [c.kind, c.kicker, c.title]);
const FIN = ['finish', 'Finish', 'Call it'];

describe('HALF_MANNY week 10 as decks', () => {
  test('each day holds the cards the canvas drew, the run left on This Week (D272), Thursday trimmed by D273', () => {
    assert.deepEqual(shape(deckOf('mon')), [['lift', 'Main', 'Deadlift'], ['round', 'Round', 'Pull superset A'], ['lift', 'Pull superset B', 'Dumbbell row'], FIN]);
    assert.deepEqual(shape(deckOf('tue')), [['lift', 'Main', 'Incline barbell press'], ['lift', 'Main, second lift', 'Barbell overhead press'], ['round', 'Round', 'Accessory'],
      ['lift', 'Chest + knee', 'Spanish squat hold (KB)'], ['block', 'Core', 'Rotational Power'], FIN]);
    assert.deepEqual(shape(deckOf('wed')), []);
    assert.deepEqual(shape(deckOf('thu')), [['lift', 'Main', 'Back squat'], ['round', 'Round', 'Leg circuit — runner armor'], ['block', 'Prehab', 'Hip stability'],
      ['block', 'Prehab', 'Foot & ankle'], FIN]);
    assert.deepEqual(shape(deckOf('fri')), [['lift', 'Main', 'Dumbbell bench press'], ['lift', 'Main, second lift', 'Seated dumbbell shoulder press'], ['round', 'Round', 'Pump'],
      ['block', 'Core', 'Anti-Rotation'], FIN]);
    assert.deepEqual(shape(deckOf('sat')), [['cool', 'After the run', 'Stretch and roll'], FIN]);
    assert.deepEqual(shape(deckOf('sun')), []);
  });

  test('the cards say what the canvas says: the prescription, the sets and rest pills, the Main\'s cue', () => {
    const mon = deckOf('mon'), tue = deckOf('tue'), fri = deckOf('fri'), sat = deckOf('sat');
    assert.deepEqual([mon[0]!.rx, mon[0]!.chips], ['3×8 — RPE 7', ['3 sets', '3 min rest']]);
    assert.equal(mon[0]!.cue, 'Leave about three reps in reserve. Ramp up with two or three warmup sets. Three minutes rest.');
    assert.deepEqual([mon[1]!.rx, mon[1]!.chips], ['2 rounds, no rest inside · 90 sec between rounds', ['2 rounds', '90 sec rest']]);
    assert.deepEqual([mon[2]!.rx, mon[2]!.chips], ['2×8–12 each @ RPE 7', ['2 sets', '60–90 sec rest']]);
    assert.deepEqual([tue[0]!.rx, tue[0]!.chips, tue[0]!.cue], ['3×8 — RPE 7', ['3 sets', '2–3 min rest'],
      'Leave about three reps in reserve. Ramp up with two or three warmup sets. Two to three minutes rest.']);
    assert.deepEqual([tue[3]!.rx, tue[3]!.chips], ['3×25 sec', ['3 sets', '60–90 sec rest']]);
    assert.deepEqual([tue[4]!.rx, tue[4]!.chips], ['One block, straight through', ['2 sets', '60–90 sec rest']]);
    assert.deepEqual([fri[0]!.rx, fri[0]!.chips, fri[0]!.cue], ['3×12 — RPE 6–7, leave 3+ in reserve', ['3 sets', '2–3 min rest'],
      'Leave about three reps in reserve. Ramp up with two or three warmup sets.']);
    assert.deepEqual([fri[3]!.chips], [['3 sets', '60–90 sec rest']]);
    assert.equal(sat[0]!.rx, 'Five easy moves, about 14 minutes. Take your time.');
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
  test('a skip made through the session sheet\'s handler punches the card and offers the undo; the undo puts it back', () => {
    W['_setCurrentDayKey']('mon');
    W['skipExercise']('Dumbbell row');
    const off = deckOf('mon')[2]!;
    assert.deepEqual([off.title, off.skipped, off.undo, off.chips], ['Dumbbell row', true, { kind: 'exercise', name: 'Dumbbell row' }, ['Skipped']]);
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
