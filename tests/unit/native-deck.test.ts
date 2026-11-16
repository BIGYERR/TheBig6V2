// The swipe deck in the Expo app (MIGRATION.md phase 3, the first screen): the deck's pure logic in
// frontends/native/src/deck. Every expected value here is typed by hand: from the prescriptions the engine writes
// ("3×12", "2×8–12 each @ RPE 7", "2×45 sec each"), from the rulings the page's readers carry (the set summary's
// words, the reuse pill's recency words, the 21 day line for a stale load), from arithmetic (a pound is 0.453592 kg,
// shown to the half), or from the deck's own rulings (D275, D283, docs/decisions/swipe-deck.md). None is asked of the
// app: the comparison with today's deck is tests/integration/native-deck.test.ts.
process.env['TZ'] = 'America/New_York';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, test } from 'vitest';
import { memoryStore } from '@ia/core/engine/state-store.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { REPO } from '../support/app.ts';
import {
  STALE_LOAD_DAYS, crossProgLastEntry, exControlFlags, isKBExercise, isStaleTs, parseRx, recencyLabel, rxSuffix, setsSubLabel, setsSummary,
  setsVaried, stripLeadingSets, swapOriginOf, toDispW,
} from '../../frontends/native/src/deck/deck-readers.ts';
import {
  DOUBLE_TAP, type DeckProgram, PAGER_GAP, TAP_SLOP, coverOf, dayCards, deckView, isTap, pagerPose, pagerTakes, pagerY, poseOf, shaded, slotsFrom, swipeTo, tapped, toneColor, travelOf,
} from '../../frontends/native/src/deck/deck-screen.ts';

const DAY = 86400000;
const NOW = new Date(2026, 10, 14, 12, 0, 0).getTime();
const filled = (keys: Record<string, unknown>): StateStore => { const s = memoryStore(); for (const [k, v] of Object.entries(keys)) s.set(k, typeof v === 'string' ? v : JSON.stringify(v)); return s; };
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().sort().map((k) => [k, s.get(k)!]));

describe('native deck: the two models are today\'s files', () => {
  // The Expo app draws from copies of the Angular deck's model and of the session sheet's card model, which the deck's
  // model stands on. A copy can drift, so each is held equal to the byte: a change to today's turns this red until
  // the copy is made again. The copies sit at the same two paths under src/, so the import between them is today's.
  for (const [f, from, to] of [
    ['deck-model.ts', 'frontends/app/src/app/screens/deck', 'frontends/native/src/deck'],
    ['session-sections-model.ts', 'frontends/app/src/app/screens/day-detail', 'frontends/native/src/day-detail'],
  ] as const) {
    test(f + ' in frontends/native is frontends/app\'s, byte for byte', () => {
      const today = readFileSync(join(REPO, from, f));
      const copy = readFileSync(join(REPO, to, f));
      assert.ok(today.length > 10000);
      assert.ok(copy.equals(today), f + ' differs from today\'s: copy it again (cp), never edit the copy');
    });
  }
  test('the deck\'s model reaches the card model by the path the copies keep', () => {
    assert.ok(readFileSync(join(REPO, 'frontends/native/src/deck/deck-model.ts'), 'utf8').includes("from '../day-detail/session-sections-model.ts';"));
  });
});

describe('native deck: the prescription, as the page\'s parseRx reads it', () => {
  test('sets of reps, a range read at its middle, each side, seconds to the five, yards', () => {
    assert.deepStrictEqual(parseRx('3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest', 'Barbell Romanian deadlift'),
      { sets: 3, kind: 'reps', unit: '', step: 1, target: 12, perSide: false });
    assert.deepStrictEqual(parseRx('2×8–12 each @ RPE 7', 'Dumbbell Bulgarian split squat'), { sets: 2, kind: 'reps', unit: '', step: 1, target: 10, perSide: true });
    assert.deepStrictEqual(parseRx('2×45 sec each', 'Hip 90/90 stretch'), { sets: 2, kind: 'sec', unit: 'sec', step: 5, target: 45, perSide: true });
    assert.deepStrictEqual(parseRx('3×20–30 sec', 'Plank'), { sets: 3, kind: 'sec', unit: 'sec', step: 5, target: 25, perSide: false });
    assert.deepStrictEqual(parseRx('3×40 yd each', 'Suitcase carry'), { sets: 3, kind: 'dist', unit: 'yd', step: 1, target: 40, perSide: true });
    assert.deepStrictEqual(parseRx('3 x 5', 'Deadlift'), { sets: 3, kind: 'reps', unit: '', step: 1, target: 5, perSide: false });
  });
  test('"N sets of M", "N sets" alone, and a count past twenty held at twenty', () => {
    assert.deepStrictEqual(parseRx('3 sets of 8 to 10', 'Row'), { sets: 3, kind: 'reps', unit: '', step: 1, target: 9, perSide: false });
    assert.deepStrictEqual(parseRx('2 sets of 15', 'Curl'), { sets: 2, kind: 'reps', unit: '', step: 1, target: 15, perSide: false });
    assert.deepStrictEqual(parseRx('3 sets — easy', 'Band pull apart'), { sets: 3, open: true, perSide: false });
    assert.equal(parseRx('30×1', 'Singles')!.sets, 20);
  });
  test('the loose shapes: to the max, a ladder, one number with its unit, a count in the name, and nothing', () => {
    assert.deepStrictEqual(parseRx('4×max', 'Pull-ups'), { sets: 4, open: true, perSide: false });
    assert.deepStrictEqual(parseRx('max reps', 'Pushups'), { sets: 1, open: true, perSide: false });
    assert.deepStrictEqual(parseRx('10/8/6', 'Bench'), { sets: 3, kind: 'reps', unit: '', step: 1, target: 10, targets: [10, 8, 6], perSide: false });
    assert.deepStrictEqual(parseRx('8, 6, amrap', 'Squat'), { sets: 3, kind: 'reps', unit: '', step: 1, target: 8, targets: [8, 6, null], perSide: false });
    assert.deepStrictEqual(parseRx('60 sec', 'Dead hang'), { sets: 1, kind: 'sec', unit: 'sec', step: 5, target: 60, perSide: false });
    assert.deepStrictEqual(parseRx('100 yards', 'Farmer carry'), { sets: 1, kind: 'dist', unit: 'yd', step: 1, target: 100, perSide: false });
    assert.deepStrictEqual(parseRx('12 reps', 'Dips'), { sets: 1, kind: 'reps', unit: '', step: 1, target: 12, perSide: false });
    assert.deepStrictEqual(parseRx('', '50 Kettlebell swings'), { sets: 1, kind: 'reps', unit: '', step: 1, target: 50, perSide: false });
    assert.equal(parseRx('easy, by feel', 'Foam roll'), null);
    assert.equal(parseRx(undefined, undefined), null);
  });
  test('the unit a set carries, and a round\'s row without its own count', () => {
    assert.deepStrictEqual([rxSuffix(parseRx('2×45 sec each', '')), rxSuffix(parseRx('2×45 sec', '')), rxSuffix(parseRx('3×40 yd each', '')), rxSuffix(parseRx('3×40 yd', '')),
      rxSuffix(parseRx('2×10 each', '')), rxSuffix(parseRx('2×10', '')), rxSuffix(null)], ['sec/side', 'sec', 'yd/side', 'yd', '/side', '', '']);
    assert.deepStrictEqual([stripLeadingSets('3×12 each'), stripLeadingSets('3 x 10'), stripLeadingSets('2 sets of 15'), stripLeadingSets('3 sets — easy'), stripLeadingSets('3 sets'), stripLeadingSets('10–12'), stripLeadingSets(null)],
      ['12 each', '10', '15', 'easy', '', '10–12', '']);
  });
});

describe('native deck: the set summary\'s words', () => {
  const rx = parseRx('3×12', '')!, side = parseRx('2×10 each', '')!, open = parseRx('4×max', '')!, ladder = parseRx('10/8/6', '')!;
  test('as prescribed, logged as prescribed, logged another way, varied, to the max, a ladder', () => {
    assert.equal(setsSummary(rx, [], []), '3 × 12');
    assert.equal(setsSummary(side, [], []), '2 × 10 /side');
    assert.equal(setsSummary(rx, [], [12, 12, 12]), '3 × 12');
    assert.equal(setsSummary(rx, [], [10, 10, 10]), '3 × 10');
    assert.equal(setsSummary(rx, [], [12, 12]), '2 × 12');
    assert.equal(setsSummary(rx, [], [12, 11, 9]), '12 / 11 / 9');
    assert.equal(setsSummary(side, [], [10, 8]), '10 / 8 /side');
    assert.equal(setsSummary(open, [], []), '4 × max');
    assert.equal(setsSummary(open, [], [9, 9, 9, 9]), '4 × 9');
    assert.equal(setsSummary(ladder, [], []), '10 / 8 / 6');
    assert.equal(setsSummary(parseRx('8, 6, amrap', '')!, [], []), '8 / 6 / max');
    assert.equal(setsSummary(null, [], []), '');
  });
  test('the words after it', () => {
    assert.equal(setsSubLabel(rx, [], [], false), 'as prescribed');
    assert.equal(setsSubLabel(rx, [], [12, 12, 12], true), 'logged');
    assert.equal(setsSubLabel(rx, [], [10, 10, 10], false), 'not logged');
    assert.equal(setsSubLabel(rx, [], [12, 11, 9], true), '');
    assert.equal(setsSubLabel(open, [], [], false), 'nothing logged');
  });
  test('varied is two sets that differ; one set, none, or equal ones are not', () => {
    assert.deepStrictEqual([setsVaried([5, 5, 4]), setsVaried(['5', 5]), setsVaried([5]), setsVaried([]), setsVaried(null)], [true, false, false, false, false]);
  });
  test('a stored load as it is shown: pounds as they are, kilograms to the half', () => {
    // 135 lb is 61.23 kg, 45 lb is 20.41 kg, 225 lb is 102.06 kg.
    assert.deepStrictEqual([toDispW(135, 'lbs'), toDispW('135', 'lbs'), toDispW(135, 'kg'), toDispW(45, 'kg'), toDispW(225, 'kg'), toDispW('', 'kg'), toDispW(null, 'lbs')], [135, 135, 61, 20.5, 102, '', '']);
  });
});

describe('native deck: how old a load is', () => {
  const ago = (days: number): number => NOW - days * DAY;
  test('the reuse pill\'s words by age', () => {
    assert.deepStrictEqual([0, 1, 3, 6, 7, 13, 14, 27, 28, 59, 60, 95].map((d) => recencyLabel(ago(d), undefined, NOW)),
      ['earlier today', 'yesterday', '3 days ago', '6 days ago', 'last week', 'last week', '2 weeks ago', '3 weeks ago', 'last month', 'last month', '2 months ago', '3 months ago']);
    assert.equal(recencyLabel(undefined, undefined, NOW), 'last time');
  });
  test('the stale warning\'s words by age', () => {
    assert.deepStrictEqual([0, 1, 3, 7, 14, 27, 28, 60].map((d) => recencyLabel(ago(d), 'age', NOW)),
      ['from earlier today', 'from yesterday', 'about 3 days old', 'about a week old', 'about 2 weeks old', 'about 3 weeks old', 'about a month old', 'about 2 months old']);
    assert.equal(recencyLabel(undefined, 'age', NOW), 'from an earlier block');
  });
  test('a load is stale past 21 days, and one with no date is not', () => {
    assert.equal(STALE_LOAD_DAYS, 21);
    assert.deepStrictEqual([isStaleTs(ago(21), NOW), isStaleTs(ago(22), NOW), isStaleTs(ago(0), NOW), isStaleTs(undefined, NOW)], [false, true, false, false]);
  });
});

describe('native deck: the card\'s controls and the stored state behind them', () => {
  test('a lift can be swapped and skipped, an unknown move only skipped, a note neither', () => {
    const main = { label: 'Main — Hinge', items: [] };
    assert.deepStrictEqual(exControlFlags(main, 0, { name: 'Deadlift' }), { isNote: false, inSS: false, isMainSlot: true, canSwap: true, canSkip: true });
    assert.deepStrictEqual(exControlFlags({ label: 'Accessory', superset: true }, 0, { name: 'Deadlift' }), { isNote: false, inSS: true, isMainSlot: false, canSwap: true, canSkip: true });
    assert.deepStrictEqual(exControlFlags(main, 1, { name: 'A move no library holds' }), { isNote: false, inSS: false, isMainSlot: false, canSwap: false, canSkip: true });
    assert.deepStrictEqual(exControlFlags(null, 0, { name: '<svg width="14"></svg> Taper' }), { isNote: true, inSS: false, isMainSlot: false, canSwap: false, canSkip: false });
  });
  test('a kettlebell move is one whose name says so', () => {
    assert.deepStrictEqual([isKBExercise('Kettlebell swing'), isKBExercise('Spanish squat hold (KB)'), isKBExercise('Back squat'), isKBExercise('')], [true, true, false, false]);
  });
  test('the lift a card was swapped in for: the last swap to that name on that day, of that program', () => {
    const store = filled({ ia_swaps_p1: { w2_mon: [{ from: 'Back squat', to: 'Front squat', ts: 1 }, { from: 'Goblet squat', to: 'Front squat', ts: 2 }], w2_tue: [{ from: 'Bench press', to: 'Floor press', ts: 3 }] } });
    assert.equal(swapOriginOf(store, 'p1', 2, 'mon', 'Front squat'), 'Goblet squat');
    assert.equal(swapOriginOf(store, 'p1', 2, 'tue', 'Floor press'), 'Bench press');
    assert.deepStrictEqual([swapOriginOf(store, 'p1', 3, 'mon', 'Front squat'), swapOriginOf(store, 'p2', 2, 'mon', 'Front squat'), swapOriginOf(store, 'p1', 2, 'mon', 'Back squat'),
      swapOriginOf(store, null, 2, 'mon', 'Front squat'), swapOriginOf(store, 'p1', 2, null, 'Front squat')], [null, null, null, null, null]);
  });
  test('the newest load in another program: this program\'s own is passed over, a load of nothing too, an old key folded', () => {
    const store = filled({
      ia_programs: [{ id: 'p1', name: 'NOW' }, { id: 'p2', name: 'SPRING' }, { id: 'p3', name: 'SUMMER' }, { name: 'no id' }],
      ia_exw_p1: { deadlift: { name: 'Deadlift', entries: [{ week: 1, weight: 315, ts: 900 }] } },
      ia_exw_p2: { deadlift: { name: 'Deadlift', entries: [{ week: 1, weight: 225, ts: 100 }, { week: 2, weight: 245, ts: 200 }] } },
      ia_exw_p3: { deadlift: { name: 'Deadlift', entries: [{ week: 1, weight: 235, ts: 150 }, { week: 2, weight: 0, ts: 500 }] }, romanian_deadlift: { name: 'Romanian deadlift', entries: [{ week: 1, weight: 135, ts: 50 }] } },
    });
    const before = held(store);
    assert.deepStrictEqual(crossProgLastEntry(store, 'p1', 'deadlift'), { entry: { week: 2, weight: 245, ts: 200 }, progName: 'SPRING' });
    assert.deepStrictEqual(crossProgLastEntry(store, 'p2', 'deadlift'), { entry: { week: 1, weight: 315, ts: 900 }, progName: 'NOW' });
    assert.equal(crossProgLastEntry(store, 'p1', 'barbell_romanian_deadlift')!.progName, 'SUMMER', 'romanian_deadlift is today\'s barbell_romanian_deadlift');
    assert.equal(crossProgLastEntry(store, 'p1', 'barbell_romanian_deadlift')!.entry.weight, 135);
    assert.equal(crossProgLastEntry(store, 'p1', 'bench_press'), null);
    assert.deepStrictEqual(held(store), before, 'reading folds a copy: the store keeps its old key');
  });
});

describe('native deck: a day opened as a deck', () => {
  const lift = (name: string, detail: string) => ({ name, detail });
  const prog: DeckProgram = {
    id: 'p1', cfg: { unit: 'lbs' },
    weeks: {
      1: {
        mon: { title: 'Posterior Chain', sections: [
          { label: 'Main — Hinge', items: [lift('Deadlift', '3×5 — RPE 7, 3 min rest')] },
          { label: 'Accessory', superset: true, items: [lift('Dumbbell row', '3×10 each'), lift('Pushups', '3×12')] },
        ] },
        tue: { rest: true },
        sat: { title: 'Long Run', sections: [{ label: 'Post-run mobility', items: [lift('Hip 90/90 stretch', '2×45 sec each')] }] },
        sun: { sections: [{ label: 'Main — Squat', items: [lift('Back squat', '3×5')] }] },
      },
    },
  };
  test('a lift day opens on its first card that is not logged, effort at 7, no notes, not done', () => {
    const v = deckView(memoryStore(), prog, 1, 'mon', NOW)!;
    assert.deepStrictEqual(v.cards.map((c) => [c.kind, c.kicker, c.title, c.meta]), [
      ['lift', 'Main', 'Deadlift', '3 min rest between sets'], ['round', 'Round', 'Accessory', '3 rounds · 60 sec rest after each'], ['finish', 'Finish', 'Call it', 'How did the whole thing feel?']]);
    assert.deepStrictEqual([v.title, v.week, v.dayKey, v.first, v.rpe, v.notes, v.dayDone], ['Posterior Chain', 1, 'mon', 0, 7, '', false]);
    assert.equal(v.cards[0]!.cue, 'Leave about three reps in reserve. Two or three warmup sets first.');
    const sets = (v.cards[0]!.views[0] as { body: { items: { log: { sets: { head: string; sub: string; rows: { value: string }[] } } }[] } }).body.items[0]!.log.sets;
    assert.deepStrictEqual([sets.head, sets.sub, sets.rows.map((r) => r.value)], ['3 × 5', 'as prescribed', ['5', '5', '5']]);
  });
  test('the stored state shows on it: a lift logged that day, the day\'s effort and notes, the day done', () => {
    const store = filled({
      ia_exw_p1: { deadlift: { name: 'Deadlift', entries: [{ week: 1, day: 'mon', weight: 225, setsDone: [5, 5, 4], setsW: [225, 225, 225], ts: NOW - DAY }] } },
      ia_logs_p1: { w1_mon: { rpe: '8', notes: 'Bar felt heavy', week: 1, ts: NOW } },
      ia_comp_p1: { w1_mon: { status: 'complete', ts: NOW } },
    });
    const before = held(store);
    const v = deckView(store, prog, 1, 'mon', NOW)!;
    assert.deepStrictEqual([v.first, v.rpe, v.notes, v.dayDone], [1, 8, 'Bar felt heavy', true]);
    assert.deepStrictEqual(v.cards.map((c) => c.logged), [true, false, false]);
    const item = (v.cards[0]!.views[0] as { body: { items: { logged: boolean; log: { sets: { head: string; sub: string }; load: { value: string; unit: string; reuse: { text: string; rec: string; stale: boolean } } } }[] } }).body.items[0]!;
    assert.deepStrictEqual([item.logged, item.log.sets.head, item.log.sets.sub, item.log.load.value, item.log.load.unit], [true, '5 / 5 / 4', '', '225', 'lbs']);
    assert.deepStrictEqual(item.log.load.reuse, { stale: false, value: 225, text: '225 lbs', rec: 'yesterday' });
    assert.deepStrictEqual(held(store), before, 'drawing the deck wrote nothing');
  });
  test('a title falls to Training; an effort outside 1 to 10 falls to 7', () => {
    const store = filled({ ia_logs_p1: { w1_sun: { rpe: '11', notes: 5 } } });
    const v = deckView(store, prog, 1, 'sun', NOW)!;
    assert.deepStrictEqual([v.title, v.rpe, v.notes], ['Training', 7, '']);
  });
  test('Start opens no deck on a rest day, on a day the grid does not hold, or where the cool down is the only card', () => {
    const s = memoryStore();
    assert.equal(deckView(s, prog, 1, 'tue', NOW), null);
    assert.equal(deckView(s, prog, 1, 'wed', NOW), null);
    assert.equal(deckView(s, prog, 9, 'mon', NOW), null);
    assert.equal(deckView(s, prog, 1, 'sat', NOW), null);
    assert.deepStrictEqual(dayCards(s, prog, 1, 'sat', NOW).map((c) => [c.kind, c.title, c.meta]), [['cool', 'Stretch and roll', '1 easy move · about 2 min'], ['finish', 'Call it', 'How did the whole thing feel?']]);
    assert.deepStrictEqual(dayCards(s, prog, 1, 'tue', NOW), []);
  });
});

// Which files of the deck write, and through which of core's writers, is tests/unit/native-deck-logging.test.ts (D289).
// What stays here: drawing a day writes nothing.
describe('native deck: drawing writes nothing', () => {
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  test('the readers, the seam, the models and the fields call none of core\'s writers and write no key', () => {
    const files = ['deck/deck-model.ts', 'deck/deck-readers.ts', 'deck/deck-screen.ts', 'deck/set-fields.ts', 'day-detail/session-sections-model.ts'];
    const code = strip(files.map((f) => readFileSync(join(REPO, 'frontends/native/src', f), 'utf8')).join('\n'));
    assert.ok(code.length > 30000, 'the files were read');
    assert.doesNotMatch(code, /\b\w*[sS]tore\.(set|remove)\(/, 'no store write');
    // setDraftOf reads a set draft (core's state-day-log.ts); every other name of these shapes is a writer.
    assert.doesNotMatch(code, /\b(?!setDraftOf\b)(write|record|refresh|clear|drop|set|add)[A-Z]\w*\((s\.)?store\b/, 'none of core\'s writers is called');
    assert.doesNotMatch(code, /localStorage|AsyncStorage/, 'no other storage');
  });
});

describe('native deck: the screen', () => {
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const deck = readFileSync(join(REPO, 'frontends/native/src/deck/Deck.tsx'), 'utf8');
  const code = strip(deck);

  test('a card\'s ground is its kind\'s colour under the deck\'s shade: a quarter of black by day, two fifths by night', () => {
    // 188,106,67 by three quarters; 126,94,150; 166,130,47. By night 217,138,99 by three fifths; 171,140,196; 207,167,82.
    const day = { lift: '#bc6a43', hip: '#7e5e96', core: '#a6822f', band: '#111111', mark: '#777773', deckShade: 0.25 };
    const night = { lift: '#D98A63', hip: '#AB8CC4', core: '#CFA752', band: '#242424', mark: '#767676', deckShade: 0.4 };
    assert.deepStrictEqual(['lift', 'hip', 'core', 'finish', 'skip'].map((t) => toneColor(day, t)), ['rgb(141,80,50)', 'rgb(95,71,113)', 'rgb(125,98,35)', '#111111', '#777773']);
    assert.deepStrictEqual(['lift', 'hip', 'core', 'finish', 'skip'].map((t) => toneColor(night, t)), ['rgb(130,83,59)', 'rgb(103,84,118)', 'rgb(124,100,49)', '#242424', '#767676']);
    assert.equal(shaded('#FFFFFF', 0.5), 'rgb(128,128,128)');
    const theme = readFileSync(join(REPO, 'frontends/native/src/theme.ts'), 'utf8');
    assert.ok(theme.includes("hip: '#7e5e96', core: '#a6822f', band: '#111111', onBand: '#FFFFFF', mark: '#777773', deckShade: 0.25"), 'the day palette holds today\'s tokens (base.css)');
    assert.ok(theme.includes("hip: '#AB8CC4', core: '#CFA752', band: '#242424', onBand: '#FFFFFF', mark: '#767676', deckShade: 0.4"), 'the night palette holds today\'s tokens');
  });

  test('the screen draws today\'s words for the parts the model leaves to it', () => {
    for (const words of ['>Logged<', '>Skip all<', '>Swapped in<', "{'for ' + c.swappedFrom}", '>Notes<', '>Got it<', '>Log<', '>Put it back<', '>Varied<', '>Skipped<', '>You added this<',
      "' · not in the plan  '", '>remove<', '>put it back<', "{'RPE ' + bubble}", '"Back to This Week"', '"See the whole session"', '"The whole session"', '"What RPE means"',
      '"How hard was the whole session, 1 to 10"', '"Swap this exercise"', '"Skip the whole card"', '"Skip this card"', '"Skip this exercise"', "'Card ' + (k + 1) + ', ' + states[k]", "'Open ' + plain(x.name)", "'Set ' + (r.s + 1)"]) {
      assert.ok(deck.includes(words), 'Deck.tsx carries ' + words);
    }
  });

  // Every press on the deck, by what it calls. The ones that write (h.log, h.step, h.reuse, h.fill, h.skip, h.unskip,
  // skip, edit, advance) are held to their taps in tests/unit/native-deck-logging.test.ts; the rest move through the
  // deck or open something to read. A press added later lands here first.
  test('every press on the deck is one of these: it moves through the deck, opens something to read, or calls a tap', () => {
    const presses = [...new Set([...code.matchAll(/onPress=\{((?:[^{}]|\{[^{}]*\})*)\}/g)].map((m) => m[1]!.trim()))].sort();
    assert.deepStrictEqual(presses, [
      '() => edit(c.undo!, false)', '() => h.fill(x.exKey, load.fill!.value)', '() => h.log(x)', '() => h.reuse(x.exKey, reuse.value)', '() => h.skip(x.name)',
      '() => h.step(x.exKey, r.s, -r.step)', '() => h.step(x.exKey, r.s, r.step)', '() => h.swap(x.swap!.secIdx, x.swap!.itemIdx)', '() => h.unskip(x.name)',
      '() => h.unswap(x.swappedFrom!)', '() => onFold(x.exKey)', '() => onPip(r.s)', '() => onSets(x.exKey)', '() => openSwap(c.swap!.secIdx, c.swap!.itemIdx)',
      '() => putBack(c.swappedFrom!)', '() => setBubble(null)', '() => setSheet(null)', '() => skip(c)', '() => { go(k); setSheet(null); }', '() => { leave(); go(k, 0); }',
      '() => { leave(); onClose(); }', "() => { leave(); setSheet('map'); }", '(e) => cardTap(e.nativeEvent.pageX, e.nativeEvent.pageY)', 'advance', 'onRpe',
    ]);
  });

  test('the deck swipes by today\'s numbers', () => {
    assert.ok(code.includes('const FAN = 3;') && code.includes('const SWIPE = 80;') && code.includes('const PEEK = 140;'));
    assert.ok(code.includes('{ x: 15, y: -7, s: 0.965, r: \'1.6deg\' }') && code.includes('{ x: 0, y: 0, s: 0.92, r: \'0deg\' }'), 'the card that rises: from the fan going on, from behind going back');
    assert.ok(code.includes('{ translateX: pos * 15 }, { translateY: pos * -7 }, { scale: 1 - pos * 0.035 }, { rotate: pos * 1.6 + \'deg\' }'), 'the fan');
    assert.ok(code.includes('duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1)'), 'a swipe let go short settles back in 290 ms');
    // At rest the card behind shows no words (deck.ts faceStyle), so nothing reads through a skipped card's 72%; they
    // come up from a quarter once a drag passes two points, and the fan is the next card's again when the drag ends.
    // The words are hidden by a cover of the card's colour, so the numbers are one minus today's: 1, then 0.75, then 0.
    assert.ok(code.includes('q.interpolate({ inputRange: [0, 2 / PEEK, 1], outputRange: [1, 0.75 - (0.75 * 2) / PEEK, 0] })'), 'the card behind shows no words until a drag begins');
    assert.ok(code.includes('leaveV.interpolate({ inputRange: [0, 2], outputRange: [0.75, 0] })'), 'the card behind comes up from a quarter as Done, next one sends the top card away');
    assert.ok(code.includes('.start(rest);') && code.includes('const rest = (): void => { dirNow.current = 1; setDir(1); };'), 'at rest the card behind is the next one');
    assert.ok(code.includes('height >= 700 ? ROOMY : TIGHT'), 'D283: Roomy on a screen 700 points tall or more');
  });

  // IA Next build 111, Mario's phone, 2026-11-15: "the swipe feels off and less natural". Today's deck eases every card
  // to its new place when a swipe is let go past the line (deck.ts cardStyle: the card coming to the top over 290 ms on
  // cubic-bezier(0.22,0.61,0.36,1), every other over 260 ms on ease); the beta's cards jumped there. Every number here
  // is typed by hand from deck.ts cardStyle: a seat of the fan is 15 points across, 7 up, 3.5% smaller and 1.6 degrees
  // round per place; the card a drag raises covers its way over 140 points; the top card turns a degree per 26 points.
  const near = (a: number, b: number, what: string): void => assert.ok(Math.abs(a - b) < 1e-9, what + ': ' + a + ' is not ' + b);
  test('where each card stands: the top card under the finger, the card a drag raises, the fan, and the rest not drawn', () => {
    // Six cards, the first on top, at rest.
    assert.deepStrictEqual(poseOf(0, 0, 6, 0, 3, 140), { x: 0, y: 0, s: 1, r: 0, shown: true });
    assert.deepStrictEqual(poseOf(1, 0, 6, 0, 3, 140), { x: 15, y: -7, s: 0.965, r: 1.6, shown: true });
    const second = poseOf(2, 0, 6, 0, 3, 140);
    assert.deepStrictEqual([second.x, second.y, second.r, second.shown], [30, -14, 3.2, true]); near(second.s, 0.93, 'the second seat\'s scale');
    const third = poseOf(3, 0, 6, 0, 3, 140);
    near(third.x, 45, 'the third seat across'); near(third.y, -21, 'up'); near(third.s, 0.895, 'its scale'); near(third.r, 4.8, 'its turn');
    assert.deepStrictEqual([4, 5].map((k) => poseOf(k, 0, 6, 0, 3, 140).shown), [false, false], 'a card past the fan is not drawn');
    // Dragged 70 points to the left, half of the rise: the top card is 70 across and turned 70/26 of a degree back,
    // the next card half way from its seat (7.5, -3.5, 0.9825, 0.8), the fan's other seats as they were.
    const top = poseOf(0, 0, 6, -70, 3, 140), up = poseOf(1, 0, 6, -70, 3, 140);
    assert.equal(top.x, -70); near(top.r, -2.6923076923076925, 'the top card\'s turn');
    near(up.x, 7.5, 'the next card across'); near(up.y, -3.5, 'up'); near(up.s, 0.9825, 'its scale'); near(up.r, 0.8, 'its turn');
    assert.deepStrictEqual(poseOf(2, 0, 6, -70, 3, 140), second, 'the fan\'s other seats as they were');
    // Dragged 70 to the right, the card before comes up from 92% behind the top card: 96% half way, and it is drawn.
    const back = poseOf(5, 0, 6, 70, 3, 140);
    near(back.s, 0.96, 'the card before, half way'); assert.deepStrictEqual([back.x, back.y, back.r, back.shown], [0, 0, 0, true]);
    assert.deepStrictEqual(poseOf(1, 0, 6, 70, 3, 140), { x: 15, y: -7, s: 0.965, r: 1.6, shown: true }, 'going back, the next card keeps its seat');
    // Past the rise the card is fully up; two points of drag raise none.
    assert.deepStrictEqual(poseOf(1, 0, 6, -200, 3, 140), { x: 0, y: 0, s: 1, r: 0, shown: true });
    assert.deepStrictEqual(poseOf(1, 0, 6, -2, 3, 140), { x: 15, y: -7, s: 0.965, r: 1.6, shown: true });
  });

  test('a swipe let go past the line: every card eases from where it stood to its new place, and none jumps', () => {
    // Six cards, the first on top, let go 100 points to the left: the second card comes to the top.
    // It stood 100/140 of its way up: 15 × 2/7 across, 7 × 2/7 up, 0.965 + 0.035 × 5/7, 1.6 × 2/7 round.
    const t = (k: number) => travelOf(k, 0, 1, 6, -100, 3, 140);
    const up = t(1)!;
    near(up.x, 30 / 7, 'the card coming up, across'); near(up.y, -2, 'up'); near(up.s, 0.99, 'its scale'); near(up.r, 3.2 / 7, 'its turn');
    assert.equal(t(0), null, 'the card let go is the last of six, past the fan: it goes at once, as today\'s does');
    // The fan moves up a seat: each card has one seat to travel (15 across, 7 up, 1.6 degrees, and the seats' ratio).
    const two = t(2)!, three = t(3)!;
    near(two.x, 15, 'the third card across'); near(two.y, -7, 'up'); near(two.r, 1.6, 'its turn'); near(two.s, 0.93 / 0.965, 'its scale');
    near(three.x, 15, 'the fourth card across'); near(three.s, 0.895 / 0.93, 'its scale');
    // The card that takes the fan's last seat comes out from behind the top card's place.
    const four = t(4)!;
    near(four.x, -45, 'the fifth card across'); near(four.y, 21, 'up'); near(four.s, 1 / 0.895, 'its scale'); near(four.r, -4.8, 'its turn');
    assert.equal(t(5), null, 'the sixth card is not drawn before or after');
    // Going back, 100 points to the right: the sixth card comes up from 0.92 + 0.08 × 5/7 of its size, and the card
    // let go takes the fan's first seat from where the finger left it (100 across, 100/26 of a degree).
    const b = (k: number) => travelOf(k, 0, 5, 6, 100, 3, 140);
    near(b(5)!.s, 0.92 + 0.08 * 5 / 7, 'the card before, coming up'); assert.deepStrictEqual([b(5)!.x, b(5)!.y, b(5)!.r], [0, 0, 0]);
    near(b(0)!.x, 85, 'the card let go, across to the first seat'); near(b(0)!.y, 7, 'down to it'); near(b(0)!.s, 1 / 0.965, 'its scale'); near(b(0)!.r, 100 / 26 - 1.6, 'its turn');
    near(b(1)!.x, -15, 'the fan moves back a seat');
    assert.equal(b(3), null, 'the card that leaves the fan goes at once');
    // Three cards: the card let go to the left stays in sight, and eases to the fan's second seat.
    const small = travelOf(0, 0, 1, 3, -100, 3, 140)!;
    near(small.x, -130, 'three cards, the card let go across'); near(small.y, 14, 'down'); near(small.r, -100 / 26 - 3.2, 'its turn');
    // A dot pressed (no drag): the card two seats back comes straight to the top from its seat.
    const dot = travelOf(2, 0, 2, 6, 0, 3, 140)!;
    assert.deepStrictEqual([dot.x, dot.y, dot.r], [30, -14, 3.2]); near(dot.s, 0.93, 'its scale');
    assert.equal(travelOf(0, 0, 0, 6, 0, 3, 140), null, 'a card that does not move has nothing to travel');
  });

  test('the settle is today\'s numbers, none of it plays under Reduce Motion, and the done motion still lands at once', () => {
    assert.ok(code.includes('const SETTLE_TOP = { duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1) };'), 'the card coming to the top: 290 ms');
    assert.ok(code.includes('const SETTLE_FAN = { duration: 260, easing: Easing.bezier(0.25, 0.1, 0.25, 1) };'), 'every other card: 260 ms on CSS ease');
    assert.ok(code.includes('if (g.dx < -SWIPE) go(at.current + 1, g.dx);') && code.includes('else if (g.dx > SWIPE) go(at.current - 1, g.dx);'), 'a swipe let go hands on where it was let go');
    assert.ok(code.includes('if (letGo !== undefined && !vertNow.current && !calmNow.current && to !== at.current) {') && code.includes('} else setSettle(null);'), 'still under Reduce Motion, and up and down, where a dot goes at once');
    assert.ok(code.includes('travelOf(j, at.current, to, n, letGo, FAN, PEEK)'), 'from the fan and the rise the drag itself uses');
    assert.ok(code.includes('const v = k === i ? settle!.top : settle!.fan;'), 'the top card on its own curve');
    assert.ok(code.includes('later(() => go(at.current + 1), 200);') && code.includes('          go(at.current + 1);\n'), 'Done, next one lands at once, as today\'s snap does: still, and after the tuck');
    // The values are new for every move and started once they are on the screen.
    assert.ok(code.includes('top: new Animated.Value(0), fan: new Animated.Value(0) }') && code.includes("Animated.timing(settle.top, { toValue: 1, ...SETTLE_TOP, useNativeDriver: true }).start();"));
  });

  // IA Next build 109, Mario's phone, 2026-11-15: after a swipe whose finger rested before it lifted, the card it
  // brought up was blank. Its words were hidden by an opacity of their own, which went from a moving value to a plain 1
  // that React Native never sent (it had recorded 1 while the finger rested, then set 0 itself as the drag ended).
  // Seen again on the simulator on his backup: a drag of 220 points held a quarter second, then let go.
  test('the top card wears no cover, so nothing can hide its words; every card behind wears one, drawn afresh when what it is doing changes', () => {
    // Three cards, the second on top, the third behind it. Typed by hand from the rule.
    assert.equal(coverOf(1, 1, 2, null), null, 'the top card at rest');
    assert.equal(coverOf(1, 1, 2, 'lift'), null, 'the top card as Done, next one lifts it');
    assert.equal(coverOf(1, 1, 2, 'leave'), null, 'the top card as it leaves');
    assert.equal(coverOf(1, 1, 1, null), null, 'a deck of one card: the top card is never the card behind');
    assert.equal(coverOf(2, 1, 2, null), 'drag', 'the card behind follows the finger');
    assert.equal(coverOf(2, 1, 2, 'lift'), 'rest', 'the card behind is a plain card while the top one lifts');
    assert.equal(coverOf(2, 1, 2, 'leave'), 'leave', 'the card behind comes up as the top one leaves');
    assert.equal(coverOf(0, 1, 2, null), 'rest', 'a card further back is a plain card');
    assert.equal(coverOf(0, 1, 2, 'leave'), 'rest');
    // The screen: a card's words sit in a plain view with no opacity of its own, and the cover is keyed by its kind,
    // so a card that comes to the top loses its cover and a cover never passes from a moving value to a plain one.
    assert.ok(code.includes('<View style={s.face}>'), 'the words sit in a plain view');
    assert.doesNotMatch(code, /s\.face, \{ opacity|faceOpacity/, 'the words carry no opacity of their own');
    assert.ok(code.includes('const cover = coverOf(k, i, peek, done ? done.phase : null, vert);'));
    // Up and down every card is drawn in full on a slot of its own (deck.ts faceStyle: opacity 1): none wears a cover.
    assert.equal(coverOf(1, 1, 2, null, true), null, 'up and down, the top card');
    assert.equal(coverOf(2, 1, 2, null, true), null, 'up and down, the card coming in wears no cover');
    assert.equal(coverOf(2, 1, 2, 'leave', true), null, 'nor as Done, next one brings it in');
    assert.equal(coverOf(0, 1, 2, null, true), null, 'nor any card out of the stage');
    assert.ok(code.includes("{cover && <Animated.View key={cover} testID={'deck-cover-' + k} pointerEvents=\"none\" style={[StyleSheet.absoluteFill, { backgroundColor: toneColor(p, c.tone), opacity: coverOpacity(cover) }]} />}"), 'the cover is the card\'s own colour, takes no touch, and is keyed by its kind');
    assert.ok(code.includes("if (kind === 'rest') return 1;"), 'a plain card is covered whole');
  });

  test('This Week\'s Start lift and Start session open it, over the tab bar; a sunk button and the run\'s buttons open nothing', () => {
    const week = strip(readFileSync(join(REPO, 'frontends/native/src/this-week/ThisWeek.tsx'), 'utf8'));
    assert.ok(week.includes("const starts = !!bt && bt.act === 'deck' && !bt.sunk;"));
    assert.ok(week.includes('disabled={!starts}') && week.includes('onPress={() => onStart(k.week, k.key)}'));
    assert.ok(week.includes('const view = deckView(store, grid, week, key, Date.now(), warn);') && week.includes('if (view) onDeck({ prog: grid, week, dayKey: key, view, warn });'));
    const app = strip(readFileSync(join(REPO, 'frontends/native/src/App.tsx'), 'utf8'));
    assert.ok(app.includes('onDeck={setDeck}') && app.includes('<Deck palette={p} store={phoneStore} open={deck} onClose={() => setDeck(null)} onProgram={setHeld} onOver={setOver} say={say}'));
    // Today's toast stands at z-index 999 and its pop-up overlays at 2000: the nudge and the pop-up are drawn after the toast, so over it.
    assert.ok(app.indexOf('{over}') > app.indexOf('<Toast ') && app.indexOf('<PopUp ') > app.indexOf('{over}'), 'the deck, the toast, the nudge, the pop-up, each over the last');
    assert.ok(app.indexOf('<Toast ') > app.indexOf('<Deck '), 'the toast is drawn after the deck, so over it');
    assert.ok(app.indexOf('<Deck ') > app.indexOf('testID="tab-bar"'), 'the deck is drawn after the tab bar, so over it');
  });

  // Found reading the beta against today's for the pager (tests/measure/native-deck-pager_today.md): on a deck of two
  // cards the other card is both the next and the one before, and today's always raises it from the fan's first seat
  // (deck.ts cardStyle, dirUp = pos === 1). The beta's drag drew it from 92% under the top card on a pull to the
  // right, and its settle began from the seat, so the card jumped as the finger let go.
  test('a deck of two cards: the card behind rises from the fan\'s seat whichever way the finger goes, and the settle begins where the drag left it', () => {
    // Two cards, pulled 70 to the right, half of the rise: half way in from the seat (7.5, -3.5, 0.9825, 0.8).
    const up = poseOf(1, 0, 2, 70, 3, 140);
    near(up.x, 7.5, 'across'); near(up.y, -3.5, 'up'); near(up.s, 0.9825, 'its scale'); near(up.r, 0.8, 'its turn');
    assert.deepStrictEqual(poseOf(1, 0, 2, -70, 3, 140), up, 'the same card, the same way in, on a pull to the left');
    // Let go at 100 to the right: it has 2/7 of the seat left to travel, and nothing more.
    const t = travelOf(1, 0, 1, 2, 100, 3, 140)!;
    near(t.x, 30 / 7, 'what it has left, across'); near(t.y, -2, 'up'); near(t.s, 0.99, 'its scale'); near(t.r, 3.2 / 7, 'its turn');
    // The screen's drag asks the same question the settle does: is the card coming up the next one.
    assert.ok(code.includes("const f = (peek - i + n) % n === 1 ? { x: 15, y: -7, s: 0.965, r: '1.6deg' } : { x: 0, y: 0, s: 0.92, r: '0deg' };"));
    assert.doesNotMatch(code, /const f = dir > 0 \?/, 'not by the way the finger is going');
  });
});

// D275 call 1 (Mario, on the canvas): "Double tap a card to switch between sideways and up and down; up and down is a
// smooth pager." Every number is typed by hand from today's deck (deck.ts DOUBLE_TAP, down, move, up, slide and
// cardStyle; deck.css .deck-stage.vert, .deck-dots.v, deckPagerLeave and deckPagerRise), as
// tests/measure/native-deck-pager_today.md sets them out.
describe('native deck: the double tap and the up and down pager (D275 call 1)', () => {
  const strip = (t: string): string => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const deck = readFileSync(join(REPO, 'frontends/native/src/deck/Deck.tsx'), 'utf8');
  const code = strip(deck);

  test('a press that ends within 6 points of where it began is a tap, and two taps inside 320 ms turn the deck', () => {
    assert.deepStrictEqual([DOUBLE_TAP, TAP_SLOP], [320, 6]);
    assert.deepStrictEqual([isTap(0, 0), isTap(5, 5), isTap(-5, 5), isTap(6, 0), isTap(0, 6), isTap(0, -6), isTap(-6, 0)], [true, true, true, false, false, false, false]);
    assert.deepStrictEqual(tapped(null, 1000), { turn: false, last: 1000 }, 'a first tap is remembered');
    assert.deepStrictEqual(tapped(1000, 1319), { turn: true, last: null }, 'a second tap 319 ms on turns the deck and clears the clock');
    assert.deepStrictEqual(tapped(1000, 1320), { turn: false, last: 1320 }, 'at 320 ms it is a first tap again');
    assert.deepStrictEqual(tapped(null, 100), { turn: false, last: 100 }, 'a tap in the app\'s first 320 ms pairs with nothing');
    // Tap, tap, tap: the third begins a pair of its own, so three quick taps turn the deck once.
    const one = tapped(null, 0), two = tapped(one.last, 200), three = tapped(two.last, 400);
    assert.deepStrictEqual([one.turn, two.turn, three.turn], [false, true, false]);
  });

  test('the tap is read on the card and not on a control, turns the deck either way, and says nothing', () => {
    // The card's body sits in one press of its own: a control inside it takes its own press, as a button on the page
    // is passed over (deck.ts down), and it is no element of its own to a screen reader.
    assert.ok(deck.includes("testID={'deck-tap-' + k} accessible={false} style={{ flexGrow: 1, padding: z.pad, paddingBottom: z.pad - 2 }}"));
    assert.ok(code.includes('onPressIn={(e) => { pressAt.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }; }}') && code.includes('onPress={(e) => cardTap(e.nativeEvent.pageX, e.nativeEvent.pageY)}'));
    const tap = code.slice(code.indexOf('const cardTap = '), code.indexOf('const foldOf = '));
    assert.ok(tap.includes('if (busy.current || !isTap(x - pressAt.current.x, y - pressAt.current.y)) return;'), 'no tap while a card is on its way out, and none that moved');
    assert.ok(tap.includes('const t = tapped(lastTap.current, performance.now());') && tap.includes('lastTap.current = t.last;') && tap.includes('if (!t.turn) return;'));
    assert.ok(tap.includes('setVert((v) => !v);'), 'either way');
    assert.doesNotMatch(tap, /say\(|Toast|hint/, 'no toast and no hint (call 15)');
    assert.doesNotMatch(tap, /Date\.now/, 'the clock is the one a pinned date does not stop');
    assert.ok(tap.includes('leave();'), 'a tap takes the keyboard off its field, which saves the field as any press does');
    assert.ok(code.includes('const [vert, setVert] = useState(false);'), 'every open starts sideways: the choice is not kept');
    assert.doesNotMatch(code, /store\.(get|set)\([^)]*vert/i, 'and nothing stores it');
  });

  test('where each card stands up and down: the top card under the finger, the card coming in a card height and 14 points away, and no fan', () => {
    assert.equal(PAGER_GAP, 14);
    // Six cards on a stage 600 points tall, the first on top, at rest: only the top card is drawn.
    assert.deepStrictEqual(pagerPose(0, 0, 6, 0, 600), { y: 0, shown: true });
    assert.deepStrictEqual([1, 2, 3, 4, 5].map((k) => pagerPose(k, 0, 6, 0, 600).shown), [false, false, false, false, false], 'no fan');
    // Pulled 100 up: the top card 100 up, the next one 614 below it less the 100, nothing else.
    assert.deepStrictEqual(pagerPose(0, 0, 6, -100, 600), { y: -100, shown: true });
    assert.deepStrictEqual(pagerPose(1, 0, 6, -100, 600), { y: 514, shown: true });
    assert.deepStrictEqual([2, 3, 4, 5].map((k) => pagerPose(k, 0, 6, -100, 600).shown), [false, false, false, false]);
    // Pulled 100 down: the card before comes from 614 above, and the next one is not drawn.
    assert.deepStrictEqual(pagerPose(5, 0, 6, 100, 600), { y: -514, shown: true });
    assert.equal(pagerPose(1, 0, 6, 100, 600).shown, false);
    // Two points of drag bring nothing in; the third does.
    assert.equal(pagerPose(1, 0, 6, -2, 600).shown, false);
    assert.deepStrictEqual(pagerPose(1, 0, 6, -3, 600), { y: 611, shown: true });
    // It wraps, as sideways does: on from the last card is the first, back from the first is the last.
    assert.deepStrictEqual(pagerPose(0, 5, 6, -100, 600), { y: 514, shown: true });
    // A shorter stage: the stride is the stage and the gap (480 and 14).
    assert.deepStrictEqual(pagerPose(1, 0, 3, -50, 480), { y: 444, shown: true });
    // A deck of two: the other card comes from below on a pull up and from above on a pull down.
    assert.deepStrictEqual(pagerPose(1, 0, 2, -100, 600), { y: 514, shown: true });
    assert.deepStrictEqual(pagerPose(1, 0, 2, 100, 600), { y: -514, shown: true });
  });

  test('a drag let go past 80 points pages, and both cards slide a stride: the top card away, the card coming in onto nothing', () => {
    assert.deepStrictEqual([swipeTo(-81, 80), swipeTo(-80, 80), swipeTo(0, 80), swipeTo(80, 80), swipeTo(81, 80)], [1, 0, 0, 0, -1]);
    // The screen keeps each card on a slot and the pager on a page. Let go 100 up on a stage of 600: the top card is
    // on the page's slot, 100 up, and the next card one slot on, 514 down.
    assert.equal(pagerY(0, 600, -100), -100);
    assert.equal(pagerY(1, 600, -100), 514);
    assert.equal(pagerY(-1, 600, 100), -514);
    // When the slide ends the page is one on and the drag is nothing: the card let go is one slot back, 614 up and
    // out of the stage, and the card that came in stands on nothing.
    assert.equal(pagerY(-1, 600, 0), -614);
    assert.equal(pagerY(0, 600, 0), 0);
    // Half way through, on any curve, both have covered half of what they had: -100 to -614 and 514 to 0.
    assert.equal(pagerY(-0.5, 600, -50), -357);
    assert.equal(pagerY(0.5, 600, -50), 257);
    // The screen: one stride per slot, the page and the drag moved together over the settle's 290 ms, and nothing set
    // back when it ends: the deck is then on that card's slot.
    assert.ok(code.includes('const stride = stageH + PAGER_GAP;'));
    assert.ok(code.includes('const pagerAt = (on: number) => Animated.add(pageV.interpolate({ inputRange: [on - 1, on + 1], outputRange: [stride, -stride] }), dy);'));
    assert.ok(code.includes('const lifted = [{ translateY: Animated.add(pagerAt(slot), liftV.interpolate({ inputRange: [0, 1], outputRange: [0, -10] })) }, { scale: liftV.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }];')
      && code.includes('if (vert) return { zIndex: 20, transform: lifted };'), 'the top card on the page\'s slot, with its lift, which is nothing at rest');
    assert.ok(code.includes('if (vert) return { zIndex: 15, transform: [{ translateY: pagerAt(slot + slotsFrom(k, i, n, dir)) }] };'), 'every other card on a slot of its own: the next one on, the one before back');
    // Both stand ready, so a pull the other way draws nothing again while the cards are under the finger.
    assert.ok(code.includes('if (d !== dirNow.current) { dirNow.current = d; if (!vertNow.current || n === 2) setDir(d); }'));
    const slide = code.slice(code.indexOf('const slide = '), code.indexOf('const pan = '));
    assert.ok(slide.length > 300 && slide.length < 1200, 'the slide was read, and nothing after it');
    assert.ok(slide.includes('Animated.timing(pageV, { toValue: slotNow.current + to, ...SETTLE_TOP, useNativeDriver: true }),') && slide.includes('Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }),'));
    assert.ok(code.includes('const SETTLE_TOP = { duration: 290, easing: Easing.bezier(0.22, 0.61, 0.36, 1) };'));
    // The page is never set back: when the slide ends it is said again where it came to rest, and the deck is on
    // that slot.
    assert.ok(slide.includes('      busy.current = false;\n      landed(slotNow.current + to);\n      go(at.current + to);'));
    assert.ok(code.includes('  const landed = (s: number): void => {\n    slid.current = true;\n    slotNow.current = s;') && code.includes('    pageV.setValue(s);\n    setSlot(s);\n  };'));
    assert.doesNotMatch(slide, /pageV\.setValue/, 'the slide sets the page nowhere itself');
    assert.ok(slide.includes('busy.current = true;'), 'a press inside the slide is refused');
    assert.ok(slide.includes('if (calmNow.current) {\n      dy.setValue(0);\n      go(at.current + to);\n      return;'), 'no slide under Reduce Motion: the card changes at once');
    assert.ok(code.includes('const to = swipeTo(g.dy, SWIPE);') && code.includes('if (to) slide(to);') && code.includes('else Animated.timing(dy, { toValue: 0, ...SETTLE_TOP, useNativeDriver: true }).start(rest);'), 'short of the line it goes back over the same 290 ms');
  });

  // Seen on the simulator: up and down, a dot pressed after a slide lit its dot and left the card before on the
  // screen until the next pull. A card handed a new place is not moved there until a value its place hangs on
  // changes (saying the same value again moved nothing, and nor did a thousandth of a point set as the cards were
  // drawn). So a jump moves the page and every card keeps its slot: the cards in sight are moved by the page alone.
  test('a dot or a tile of the map moves the page the nearer way round, and every card keeps the slot it stands on', () => {
    // Six cards, the first on top: the next is one slot on, the last one back, the fourth three on, the fifth two back.
    assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map((k) => slotsFrom(k, 0, 6)), [0, 1, 2, 3, -2, -1]);
    assert.deepStrictEqual([0, 1, 2].map((k) => slotsFrom(k, 0, 3)), [0, 1, -1]);
    assert.deepStrictEqual([0, 1, 2, 3].map((k) => slotsFrom(k, 2, 4)), [2, -1, 0, 1]);
    // A deck of two: the other card is one slot on, or one back while the finger pulls down.
    assert.deepStrictEqual([slotsFrom(1, 0, 2), slotsFrom(1, 0, 2, 1), slotsFrom(1, 0, 2, -1), slotsFrom(0, 0, 2, -1)], [1, 1, -1, 0]);
    // The second of three cards on top, the page on slot 10: the first card stands on slot 9, the third on 11. A
    // dot takes the deck to the first card: the page goes one slot back, to 9, and the first two cards stand on
    // the slots they stood on, 9 and 10, so the page alone has moved them. The third goes round, out of sight.
    const on = (k: number, top: number, slot: number): number => slot + slotsFrom(k, top, 3);
    assert.deepStrictEqual([on(0, 1, 10), on(1, 1, 10), on(2, 1, 10)], [9, 10, 11]);
    const page = 10 + slotsFrom(0, 1, 3);
    assert.equal(page, 9);
    assert.deepStrictEqual([on(0, 0, page), on(1, 0, page), on(2, 0, page)], [9, 10, 8]);
    // A slide is the same: on to the third card, the page on 11, and the second and third cards stand where they stood.
    assert.deepStrictEqual([on(1, 2, 11), on(2, 2, 11)], [10, 11]);
    const go = code.slice(code.indexOf('const go = '), code.indexOf('const slide = '));
    assert.ok(go.includes('      if (!slid.current) {\n        const s = slotNow.current + slotsFrom(to, at.current, n);\n        slotNow.current = s;\n        pageV.setValue(s);\n        setSlot(s);\n      }\n      slid.current = false;'));
    assert.doesNotMatch(code, /opacity: 0 \};\n    \}\n    if \(k === peek && leaving\)/, 'no card is left undrawn up and down');
  });

  test('a tall card\'s body scrolls first, and the pager takes only what the body cannot', () => {
    const fits = { y: 0, max: 0 };
    assert.deepStrictEqual([pagerTakes(0, -9, fits), pagerTakes(0, -8, fits), pagerTakes(0, 9, fits)], [true, false, true], 'past 8 points');
    assert.deepStrictEqual([pagerTakes(5, -9, fits), pagerTakes(10, -12, fits), pagerTakes(10, -13, fits)], [true, false, true], 'and more down than across, by a fifth');
    assert.equal(pagerTakes(0, -20, { y: 0, max: 2 }), true, 'a body 2 points taller than its box fits');
    // A body with 200 points to scroll: at its head a pull down pages and a pull up scrolls; at its foot the other
    // way round; in between it scrolls both ways.
    assert.deepStrictEqual([pagerTakes(0, 20, { y: 0, max: 200 }), pagerTakes(0, -20, { y: 0, max: 200 })], [true, false]);
    assert.deepStrictEqual([pagerTakes(0, 20, { y: 200, max: 200 }), pagerTakes(0, -20, { y: 200, max: 200 })], [false, true]);
    assert.deepStrictEqual([pagerTakes(0, 20, { y: 100, max: 200 }), pagerTakes(0, -20, { y: 100, max: 200 })], [false, false]);
    assert.ok(code.includes('if (vertNow.current) return pagerTakes(g.dx, g.dy, bodyOf(topKey.current));'), 'the screen asks it of the top card\'s body');
    assert.ok(code.includes('return Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;'), 'sideways the swipe is taken as before');
    assert.ok(code.includes('scrollEnabled={!vert || !!tall[c.key] || keys} bounces={!vert}'), 'up and down a body that fits does not move, and a tall one does not bounce');
    assert.ok(code.includes('const is = b.box > 0 && b.content > b.box + 2;'), 'tall is taller than its box by more than 2 points (deck.ts move)');
  });

  test('up and down the stage, the dots and the done motion are today\'s', () => {
    // deck.css .deck-stage.vert: 34 points at the right where sideways has 20, the cards cut off at its head and foot.
    assert.ok(deck.includes('stage: { flex: 1, marginHorizontal: 20 },') && deck.includes('stageV: { marginRight: 34 },') && deck.includes("clipV: { overflow: 'hidden' },") && deck.includes('clip: { flex: 1, marginTop: 16 },'));
    assert.ok(code.includes('<View style={[s.clip, vert && s.clipV]}>') && code.includes('style={[s.stage, vert && s.stageV]}'));
    // .deck-dots.v: a column 24 points past the stage's right edge (34 less 24 is 10 from the screen's), the lit dot 8 by 22.
    assert.ok(deck.includes("dotsV: { position: 'absolute', right: 10, top: 0, bottom: 0, width: 8, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 },"));
    assert.ok(code.includes('k === i && (vert ? { height: 22 } : { width: 22 })'));
    assert.ok(code.includes('{vert && <View testID="deck-dots" style={s.dotsV}>{dots}</View>}') && code.includes('{!vert && <View testID="deck-dots" style={s.dots}>{dots}</View>}'), 'one set of dots, where the deck\'s direction puts it');
    assert.ok(code.includes("transformOrigin: vert ? 'center bottom' : 'left bottom'"), '.deck-stage.vert .deck-card: it grows from its foot\'s middle');
    // deckPagerLeave and deckPagerRise: 760 ms on the tuck's curve, from 10 up at 103% to a stride up at its own size,
    // while the next card rises from a stride below.
    // The page goes on a slot over the 760 ms while the lift lets go, so the card leaves from where the lift held
    // it and the next one lands where the top card stands.
    assert.ok(deck.includes('const PAGER_LEAVE = 760;') && code.includes('Animated.timing(pageV, { toValue: slotNow.current + 1, duration: PAGER_LEAVE, easing: TUCK, useNativeDriver: true }),')
      && code.includes('Animated.timing(liftV, { toValue: 0, duration: PAGER_LEAVE, easing: TUCK, useNativeDriver: true }),'));
    // Up and down nothing is drawn again between the tap and the end: the lift, the glow and the page are values the
    // cards already wear, so nothing the screen is asked to draw can land in the middle of the motion.
    const done = code.slice(code.indexOf('glowV.setValue(marking ? 1 : 0);'), code.indexOf("setDone({ phase: 'lift', glow: marking, tucked: false });"));
    assert.ok(done.length > 400, 'the up and down done motion was read');
    assert.doesNotMatch(done, /setDone\(|setFields\(|setI\(/, 'no state is set between the tap and the end');
    assert.ok(done.includes('Animated.timing(liftV, { toValue: 1, duration: 340, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start();') && done.includes('}, marking ? 560 : 220);'), 'the lift and its hold are the sideways motion\'s');
    assert.ok(done.includes('glowV.setValue(marking ? 1 : 0);') && done.includes('      later(() => {\n        glowV.setValue(0);'), 'the glow is the lift\'s alone');
    assert.ok(code.includes("{vert && top && <Animated.View testID=\"deck-glow\" pointerEvents=\"none\" style={[s.card, { transformOrigin: 'center bottom', zIndex: 19, boxShadow: glowOf(top), opacity: glowV, transform: lifted }]} />}"), 'on a layer of its own, moving with the card');
    assert.ok(code.includes("return '0 0 0 2px rgba(' + g + ',0.9), 0 0 42px 8px rgba(' + g + ',0.6), 0 20px 44px rgba(0,0,0,0.26)';"));
    // Lifted, the card is 10 up on its slot; as the page reaches the next slot and the lift reaches nothing, it is a
    // stride up at its own size, and the next card, one slot on, is on nothing.
    assert.equal(pagerY(0, 600, 0) - 10, -10);
    assert.equal(pagerY(-1, 600, 0), -614);
    assert.ok(code.includes('          liftV.setValue(0);\n          landed(slotNow.current + 1);\n          go(at.current + 1);'), 'and the deck is then on that slot, each value said again where it came to rest');
    assert.ok(code.includes('          busy.current = false;\n          liftV.setValue(0);\n          setDone(null);'), 'sideways the lift is let go when the card has gone, so a deck turned afterwards rests flat');
    const turn = code.slice(code.indexOf('const cardTap = '), code.indexOf('const foldOf = '));
    assert.ok(turn.includes('liftV.setValue(0);') && turn.includes('glowV.setValue(0);'));
    assert.doesNotMatch(code, /leaveV\.interpolate\(\{ inputRange: \[0, 2\], outputRange: \[(stride|-10)/, 'no card is moved by a value of its own up and down');
  });
});
