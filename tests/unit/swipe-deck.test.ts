// The swipe deck (D275 P-DECK, docs/decisions/swipe-deck.md): the deck's own logic, apart from the app. Every expected
// value is typed by hand from the ruling: the canvas's card words (Version 76, the generator's board()), Mario's call 16
// numbers, the RPE bubble's lines and bands, and the rule that Call it writes the RPE and notes and nothing else.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import {
  CALL_IT_WORDS, callItLog, coolRx, ctaText, type DeckCard, deckCards, deckOpens, FINISH, mainRx, numeral, openMotion, PIP_THRESHOLD, restPill, rpeBubble, rpeOf,
  setsPill, stateOf,
} from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import type { ExCard, ExSection, ExView, SectionView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';

/** An exercise card as the session sheet's model draws it, logged or not, with a set drawer. */
const card = (name: string, detail: string, secIdx: number, itemIdx: number, logged = false): ExCard => ({
  kind: 'card', exKey: name.toLowerCase().replace(/\W+/g, '_'), name, detail, rxDetail: detail, logged,
  swap: { secIdx, itemIdx }, skip: true, added: false, swappedFrom: null, log: { sets: null, load: null },
});
const block = (items: ExView[]): SectionView => ({ kind: 'section', label: null, body: { kind: 'block', label: null, items } });

describe('what a card says', () => {
  test('the sets pill counts the sets a prescription opens with, and nothing else', () => {
    assert.equal(setsPill('3×8 — RPE 7'), '3 sets');
    assert.equal(setsPill('2 sets × 30 sec'), '2 sets');
    assert.equal(setsPill('6–10 @ RPE 7'), null);
  });

  test('the rest pill is the rest a prescription names, else two to three minutes on a main and a minute or so otherwise', () => {
    assert.equal(restPill('3×8 — RPE 7 (stop 3 short) · 3 min rest', true), '3 min rest');
    assert.equal(restPill('3×8 · 2–3 min rest', false), '2–3 min rest');
    assert.equal(restPill('3×12 · 45s rest', false), '45 sec rest');
    assert.equal(restPill('3×12 — RPE 6–7', true), '2–3 min rest');
    assert.equal(restPill('2×8–12 each @ RPE 7', false), '60–90 sec rest');
  });

  test('the RPE mark explains the top of a range', () => {
    assert.equal(rpeOf('3×8 — RPE 7'), 7);
    assert.equal(rpeOf('3×12 — RPE 6–7, leave 3+ in reserve'), 7);
    assert.equal(rpeOf('2×6–10 @ RPE 8'), 8);
    assert.equal(rpeOf('3×12 — RPE 6.5'), 6.5, 'a half step is kept, never read as 6');
    assert.equal(rpeOf('3×25 sec'), null);
  });

  test('the Main cue takes the reserve the engine\'s own line names before anything its RPE implies', () => {
    const cue = (d: string) => mainRx(d).cue.split('. ')[0];
    assert.equal(cue('3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest'), 'Leave about four reps in reserve');
    assert.equal(cue('3×8 — RPE 7 (leave ~3 in reserve)'), 'Leave about three reps in reserve');
    assert.equal(cue('3×12 — RPE 6–7, leave 3+ in reserve'), 'Leave about three reps in reserve');
    assert.equal(cue('RPE 7 (leave 3 or more in reserve)'), 'Leave about three reps in reserve');
    assert.equal(cue('3×10 (leave 3–4 in reserve)'), 'Leave about three to four reps in reserve');
    assert.equal(cue('3×5 — RPE 8 (stop 2 reps short of failure)'), 'Leave about two reps in reserve');
    assert.equal(mainRx('3×12 — RPE 6.5 (leave ~4 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest').rx, '3×12 — RPE 6.5');
  });

  test('a half step with no words of its own leaves three to four reps in reserve, and its bubble agrees with the engine\'s "~4"', () => {
    assert.equal(mainRx('3×12 — RPE 6.5 · 3 min rest').cue, 'Leave about three to four reps in reserve. Ramp up with two or three warmup sets. Three minutes rest.');
    const b = rpeBubble(6.5);
    assert.equal(b.line, 'About four reps left in the tank. Stop the set there.');
    assert.deepEqual(b.rows.filter((r) => r.on).map((r) => r.label), ['Moderate']);
  });

  test('Call it\'s slider speaks the canvas\'s words, so the deck never calls a 7 two things', () => {
    assert.deepEqual([1, 5, 6, 7, 8, 10].map((n) => CALL_IT_WORDS[n]),
      ['barely moving', 'steady', 'comfortable, four left in the tank', 'working, three left', 'hard, two left', 'everything you had']);
  });

  test('the Main card says the line before its parenthesis, then reserve, warmup and rest in words', () => {
    assert.deepEqual(mainRx('3×8 — RPE 7 (stop 3 reps short of failure) · 3 min rest'),
      { rx: '3×8 — RPE 7', cue: 'Leave about three reps in reserve. Ramp up with two or three warmup sets. Three minutes rest.' });
    assert.deepEqual(mainRx('3×5 — RPE 8 (two left) · 2–3 min rest'),
      { rx: '3×5 — RPE 8', cue: 'Leave about two reps in reserve. Ramp up with two or three warmup sets. Two to three minutes rest.' });
    assert.deepEqual(mainRx('3×12 — RPE 6–7, leave 3+ in reserve'),
      { rx: '3×12 — RPE 6–7, leave 3+ in reserve', cue: 'Leave about three reps in reserve. Ramp up with two or three warmup sets.' });
    assert.deepEqual(mainRx('Work up to a heavy single'), { rx: 'Work up to a heavy single', cue: 'Ramp up with two or three warmup sets.' });
  });

  test('the cool down counts its moves and their minutes (call 14)', () => {
    // 2×45 sec each side is 180 s, twice is 360 s; 1×30 sec is 30 s; 390 s is about 7 minutes.
    assert.equal(coolRx(['2×45 sec each side', '2×45 sec each side', '1×30 sec']), 'Three easy moves, about 7 minutes. Take your time.');
    // Five moves of 2×45 sec each side, 900 s, and one of 5 min, 300 s: 1,200 s is 20 minutes.
    assert.equal(coolRx(['2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '5 min easy walk']),
      'Six easy moves, about 20 minutes. Take your time.');
  });

  test('the position numeral is two digits over two digits (board E)', () => {
    assert.deepEqual(numeral(2, 6), { num: '03', of: '/06' });
    assert.deepEqual(numeral(9, 12), { num: '10', of: '/12' });
  });

  test('the big button marks the day on the finish, logs and moves on from a live card, and only moves on otherwise', () => {
    const live = { ...FINISH, kind: 'lift', key: 's0i0', skipped: false, logged: false } as DeckCard;
    assert.equal(ctaText(live, false, false), 'Done, next one');
    assert.equal(ctaText({ ...live, logged: true }, false, false), 'Next one');
    assert.equal(ctaText({ ...live, skipped: true }, false, false), 'Next one');
    assert.equal(ctaText(live, true, false), 'Next one');
    assert.equal(ctaText(FINISH, false, false), 'Mark the day done');
    assert.equal(ctaText(FINISH, false, true), 'Day done');
  });

  test('a card on the session map is skipped, logged, here or up next', () => {
    const live = { ...FINISH, kind: 'lift', key: 's0i0' } as DeckCard;
    assert.equal(stateOf({ ...live, skipped: true }, 0, 0, false), 'Skipped');
    assert.equal(stateOf({ ...live, logged: true }, 1, 0, false), 'Logged');
    assert.equal(stateOf(live, 1, 0, true), 'Logged');
    assert.equal(stateOf(live, 0, 0, false), 'You are here');
    assert.equal(stateOf(live, 2, 0, false), 'Up next');
  });
});

describe('the RPE bubble (call 7)', () => {
  test('says how many reps are left for the card\'s number and lights its one band', () => {
    const at = (n: number) => { const b = rpeBubble(n); return [b.line, b.rows.filter((r) => r.on).map((r) => r.label).join()]; };
    assert.deepEqual(at(5), ['Easy to moderate. You could keep going for a while.', 'Moderate']);
    assert.deepEqual(at(6), ['About four reps left in the tank. Stop the set there.', 'Moderate']);
    assert.deepEqual(at(7), ['About three reps left in the tank. Stop the set there.', 'Hard']);
    assert.deepEqual(at(8), ['About two reps left in the tank. Stop the set there.', 'Hard']);
    assert.deepEqual(at(9), ['About one rep left in the tank. Stop the set there.', 'Max']);
    assert.deepEqual(at(10), ['Nothing left. Every rep you had.', 'Max']);
    assert.deepEqual(rpeBubble(7).rows.map((r) => r.range + ' ' + r.label + ' ' + r.detail),
      ['1–3 Easy Full conversation', '4–6 Moderate Short sentences only', '7–8 Hard A few words at a time', "9–10 Max Can't talk. All out."]);
  });

  test('carries no dash in a sentence (the copy rule)', () => {
    for (let n = 1; n <= 10; n++) assert.doesNotMatch(rpeBubble(n).line, /[—–-]/);
  });
});

describe('Call it', () => {
  test('writes the day\'s RPE and notes and carries every other field, so a logged run is never blanked', () => {
    const entry = { rpe: '6', run_dist: '8.02', run_mins: '91.5', run_pace: '11:24', notes: 'old', sets: { a: [1] }, parked: { bike: {} }, restLog: { run: { mins: 20 } }, swapFrom: '', swapTo: '', week: 10, ts: 1 };
    assert.deepEqual(callItLog(entry, 8, 'Legs heavy.', 10, 2000), { ...entry, rpe: '8', notes: 'Legs heavy.', week: 10, ts: 2000 });
  });

  test('leaves the stored RPE alone when the slider was never moved (D219)', () => {
    assert.equal(callItLog({ rpe: '6' }, null, '', 10, 1).rpe, '6');
    assert.equal(callItLog(null, null, '', 10, 1).rpe, '');
    assert.deepEqual(callItLog(undefined, 7, 'x', 3, 5), { rpe: '7', notes: 'x', week: 3, ts: 5 });
  });
});

describe('the opening motion, Lift first at 420 ms (call 16)', () => {
  test('carries every number Mario picked', () => {
    const m = openMotion();
    assert.deepEqual([m.lift, m.open, m.close, m.settled], [168, 420, 357, 588]);
    assert.deepEqual([m.deckFadeIn, m.deckFadeDelay, m.copyFadeOut], [294, 84, 126]);
    assert.deepEqual([m.deckFadeOut, m.copyBackFrom, m.copyBackTo], [143, 161, 286]);
    assert.deepEqual(m.ease, { lift: 'cubic-bezier(.3,0,.2,1)', open: 'cubic-bezier(.05,.7,.1,1)', close: 'cubic-bezier(.3,0,.8,.15)' });
  });
});

describe('the cards', () => {
  test('a movement past four sets shows one set at a time (board P)', () => {
    assert.equal(PIP_THRESHOLD, 4);
  });

  test('a day is its lifts, rounds, blocks and cool down in the engine\'s order, then Call it', () => {
    const secs: ExSection[] = [
      { label: 'Main — Deadlift', items: [{ name: 'Deadlift', detail: '3×8 — RPE 7 (stop 3 short) · 3 min rest' }, { name: 'Good morning', detail: '2×8 @ RPE 7' }] },
      { label: 'Pull superset A', superset: true, rounds: 2, items: [{ name: 'Barbell row', detail: '6–10 @ RPE 7' }, { name: 'Chinups', detail: 'RPE 7' }] },
      { label: 'Core — Anti-Rotation', core: true, coreHeader: 'Core — Anti-Rotation', items: [{ name: 'Pallof press', detail: '3×12 each' }] },
      { label: 'Hip stability', hip: true, items: [{ name: 'Clamshells', detail: '2×15 each' }] },
      { label: 'Post-run mobility', items: [{ name: 'Couch stretch', detail: '2×45 sec each side' }] },
    ];
    const views: SectionView[] = [
      block([card('Deadlift', secs[0]!.items[0]!.detail!, 0, 0), card('Good morning', '2×8 @ RPE 7', 0, 1, true)]),
      { kind: 'section', label: null, body: { kind: 'round', secIdx: 1, header: '2 Rounds', items: [card('Barbell row', '6–10 @ RPE 7', 1, 0), card('Chinups', 'RPE 7', 1, 1)] } },
      { kind: 'section', label: null, body: { kind: 'core', header: 'Core — Anti-Rotation', items: [card('Pallof press', '3×12 each', 2, 0)] } },
      block([card('Clamshells', '2×15 each', 3, 0)]),
      block([card('Couch stretch', '2×45 sec each side', 4, 0)]),
    ];
    const cards = deckCards(secs, views, (s) => (s['rounds'] as number) ?? null);
    assert.deepEqual(cards.map((c) => [c.kind, c.tone, c.kicker, c.title]), [
      ['lift', 'lift', 'Main', 'Deadlift'], ['lift', 'lift', 'Main, second lift', 'Good morning'], ['round', 'lift', 'Round', 'Pull superset A'],
      ['block', 'core', 'Core', 'Anti-Rotation'], ['block', 'hip', 'Prehab', 'Hip stability'], ['cool', 'hip', 'After the run', 'Stretch and roll'],
      ['finish', 'finish', 'Finish', 'Call it'],
    ]);
    assert.deepEqual(cards.map((c) => c.chips), [['3 sets', '3 min rest'], ['2 sets', '60–90 sec rest'], ['2 rounds', '90 sec rest'], ['3 sets', '60–90 sec rest'], ['2 sets', '60–90 sec rest'], [], []]);
    assert.equal(cards[2]!.rx, '2 rounds, no rest inside · 90 sec between rounds');
    assert.equal(cards[5]!.rx, 'One easy move, about 3 minutes. Take your time.');
    assert.deepEqual(cards.map((c) => c.rpe), [7, 7, null, null, null, null, null], 'the RPE mark is on single lifts only, never inside a round or block');
    assert.deepEqual(cards.map((c) => c.logged), [false, true, false, false, false, false, false]);
    assert.deepEqual(cards[2]!.skip, { kind: 'round', secIdx: 1 });
    assert.deepEqual(cards[0]!.skip, { kind: 'exercise', name: 'Deadlift' });
    assert.deepEqual(cards[3]!.skip, { kind: 'names', names: ['Pallof press'] });
    assert.equal(cards[5]!.skip, null, 'the cool down has no skip of its own');
    // Each single lift's card draws only its own movement; the round draws both of its own.
    assert.deepEqual(cards.map((c) => c.views.flatMap((v) => (v.kind === 'section' ? v.body.items.map((x) => x.name) : []))),
      [['Deadlift'], ['Good morning'], ['Barbell row', 'Chinups'], ['Pallof press'], ['Clamshells'], ['Couch stretch'], []]);
    assert.ok(cards.every((c) => c.views.every((v) => v.kind !== 'section' || v.label === null)), 'the card states the labels');
    assert.equal(deckOpens(cards), true);
  });

  test('a skipped lift or round keeps its slot with an undo (call 5), and a round down to one movement is straight sets', () => {
    const secs: ExSection[] = [
      { label: 'Main', items: [{ name: 'Back squat', detail: '3×5', _skipped: true }] },
      { label: 'Leg circuit', superset: true, rounds: 3, _skipped: true, items: [{ name: 'A', detail: '8' }, { name: 'B', detail: '8' }] },
      { label: 'Pump', superset: true, rounds: 2, items: [{ name: 'C', detail: '12', _skipped: true }, { name: 'D', detail: '12' }] },
    ];
    const views: SectionView[] = [
      block([{ kind: 'skipped', name: 'Back squat' }]),
      { kind: 'skippedRound', secIdx: 1, text: 'Leg circuit — 2 movements' },
      { kind: 'section', label: null, body: { kind: 'block', label: { text: 'Pump — reduced to straight sets', markup: false, color: 'var(--muted)' }, items: [{ kind: 'skipped', name: 'C' }, card('D', '2×12', 2, 1)] } },
    ];
    const cards = deckCards(secs, views, (s) => (s['rounds'] as number) ?? null);
    assert.deepEqual(cards.map((c) => [c.kind, c.title, c.skipped, c.chips.join()]), [
      ['lift', 'Back squat', true, 'Skipped'], ['round', 'Leg circuit', true, 'Skipped'], ['round', 'D', false, '2 rounds,90 sec rest'], ['finish', 'Call it', false, ''],
    ]);
    assert.deepEqual(cards[0]!.undo, { kind: 'exercise', name: 'Back squat' });
    assert.deepEqual(cards[1]!.undo, { kind: 'round', secIdx: 1 });
    assert.equal(cards[2]!.rx, 'One movement left, so the round is off. It keeps its own sets.');
    assert.equal(cards[0]!.views.length, 0, 'a skipped card draws no movements');
  });

  test('Start session opens the deck only when there is lift work beyond the cool down', () => {
    const cool: ExSection[] = [{ label: 'Post-run mobility', items: [{ name: 'Couch stretch', detail: '2×45 sec each side' }] }];
    assert.equal(deckOpens(deckCards(cool, [block([card('Couch stretch', '2×45 sec each side', 0, 0)])], () => null)), false);
    assert.equal(deckOpens(deckCards([], [], () => null)), false);
    assert.deepEqual(deckCards([], [], () => null), [], 'a day with no lift work has no deck, not a lone Call it');
  });
});

describe('the set summary on a deck card (D281 P-SUMMARYFIT)', () => {
  // The deck's stylesheet, its comments stripped, read as rule bodies keyed by selector.
  const css = readFileSync(join(REPO, 'frontends/app/src/app/screens/deck/deck.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const rule = (sel: string): Record<string, string> => {
    const at = css.indexOf(sel + '{');
    assert.ok(at >= 0, 'deck.css has no rule for ' + sel);
    const body = css.slice(at + sel.length + 1, css.indexOf('}', at));
    return Object.fromEntries(body.split(';').filter(Boolean).map((d) => d.split(':').map((s) => s.trim()) as [string, string]));
  };

  test('keeps the numbers whole ("2 × 15 /side", never "2 × 15 /si…") and lets the words beside them give way', () => {
    const val = rule('.deck-work .exset-head-val'), sub = rule('.deck-work .exset-head-sub');
    assert.equal(val['flex-shrink'], '0', 'the numbers never shrink');
    assert.equal(val['font-size'], '17px');
    assert.deepEqual([sub['flex'], sub['min-width'], sub['overflow'], sub['text-overflow'], sub['white-space']], ['0 1 auto', '0', 'hidden', 'ellipsis', 'nowrap']);
  });
});
