// The swipe deck (D275 P-DECK, docs/decisions/swipe-deck.md): the deck's own logic, apart from the app. Every expected
// value is typed by hand from the ruling: the canvas's card words (Version 76, the generator's board()), Mario's call 16
// numbers, the RPE bubble's lines and bands, and the rule that Call it writes the RPE and notes and nothing else.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REPO } from '../support/app.ts';
import {
  blockMeta, CALL_IT_WORDS, callItLog, coolMeta, ctaText, type DeckCard, deckCards, deckOpens, FINISH, FOLD_AT, labelHead, liftMeta, longCard, mainRx, numeral,
  isNote, noteWords, openAfterSetsTap, openMotion, PIP_THRESHOLD, rangeWords, restOpen, restPill, roundMeta, rpeBubble, rpeOf, rxLine, stateOf,
} from '../../frontends/app/src/app/screens/deck/deck-model.ts';
import type { ExCard, ExSection, ExView, SectionView } from '../../frontends/app/src/app/screens/day-detail/session-sections-model.ts';

/** An exercise card as the session sheet's model draws it, logged or not, with a set drawer. */
const card = (name: string, detail: string, secIdx: number, itemIdx: number, logged = false): ExCard => ({
  kind: 'card', exKey: name.toLowerCase().replace(/\W+/g, '_'), name, detail, rxDetail: detail, logged,
  swap: { secIdx, itemIdx }, skip: true, added: false, swappedFrom: null, log: { sets: null, load: null },
});
const block = (items: ExView[]): SectionView => ({ kind: 'section', label: null, body: { kind: 'block', label: null, items } });

describe('what a card says', () => {
  test('a card title or a tile\'s kicker is the label up to its first dash (D283, "Deck drops it")', () => {
    assert.equal(labelHead('Leg circuit — runner armor'), 'Leg circuit');
    assert.equal(labelHead('Foot & ankle — mobility only'), 'Foot & ankle');
    assert.equal(labelHead('Primer — Barbell bench press'), 'Primer');
    assert.equal(labelHead('Hip stability'), 'Hip stability');
    assert.equal(labelHead(''), '');
  });

  test('the deck writes a range with "to", never an en dash (D283)', () => {
    assert.equal(rangeWords('2–3 min rest'), '2 to 3 min rest');
    assert.equal(rangeWords('60–90 sec rest'), '60 to 90 sec rest');
    assert.equal(rangeWords('8-12 each'), '8 to 12 each');
    assert.equal(rangeWords('3 min rest'), '3 min rest');
  });

  test('the meta line under a title says the rounds or sets and the rest, in one line (D283)', () => {
    assert.equal(roundMeta(2), '2 rounds · 90 sec rest after each');
    assert.equal(roundMeta(3), '3 rounds · 60 sec rest after each');
    assert.equal(blockMeta(false), 'Straight through · 60 to 90 sec rest');
    assert.equal(blockMeta(true), 'Core · Straight through · 60 to 90 sec rest');
    assert.equal(liftMeta('3×8 — RPE 7 (leave ~3 reps in reserve), ramp up with 2–3 warmup sets, 3 min rest', true), '3 min rest between sets');
    assert.equal(liftMeta('3×12 — RPE 6–7, leave 3+ in reserve', true), '2 to 3 min rest between sets');
    assert.equal(liftMeta('2×8–12 each @ RPE 7', false), '60 to 90 sec rest between sets');
    assert.equal(liftMeta('4×10 — fast and crisp, 60s rest', false), '60 sec rest between sets');
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
    assert.equal(mainRx('3×12 — RPE 6.5 · 3 min rest').cue, 'Leave about three to four reps in reserve. Two or three warmup sets first.');
    const b = rpeBubble(6.5);
    assert.equal(b.line, 'About four reps left in the tank. Stop the set there.');
    assert.deepEqual(b.rows.filter((r) => r.on).map((r) => r.label), ['Moderate']);
  });

  test('Call it\'s slider speaks the canvas\'s words, so the deck never calls a 7 two things', () => {
    assert.deepEqual([1, 5, 6, 7, 8, 10].map((n) => CALL_IT_WORDS[n]),
      ['barely moving', 'steady', 'comfortable, four left in the tank', 'working, three left', 'hard, two left', 'everything you had']);
  });

  test('the Main card says the line before its parenthesis, then reserve and warmup in words; its rest is the meta line (D283)', () => {
    assert.deepEqual(mainRx('3×8 — RPE 7 (stop 3 reps short of failure) · 3 min rest'),
      { rx: '3×8 — RPE 7', cue: 'Leave about three reps in reserve. Two or three warmup sets first.' });
    assert.deepEqual(mainRx('3×5 — RPE 8 (two left) · 2–3 min rest'),
      { rx: '3×5 — RPE 8', cue: 'Leave about two reps in reserve. Two or three warmup sets first.' });
    assert.deepEqual(mainRx('3×12 — RPE 6–7, leave 3+ in reserve'),
      { rx: '3×12 — RPE 6–7, leave 3+ in reserve', cue: 'Leave about three reps in reserve. Two or three warmup sets first.' });
    assert.deepEqual(mainRx('Work up to a heavy single'), { rx: 'Work up to a heavy single', cue: 'Two or three warmup sets first.' });
  });

  test('the cool down\'s meta line counts its moves and their minutes (call 14, D283)', () => {
    // 2×45 sec each side is 180 s, twice is 360 s; 1×30 sec is 30 s; 390 s is about 7 minutes.
    assert.equal(coolMeta(['2×45 sec each side', '2×45 sec each side', '1×30 sec']), '3 easy moves · about 7 min');
    // Five moves of 2×45 sec each side, 900 s, and one of 5 min, 300 s: 1,200 s is 20 minutes.
    assert.equal(coolMeta(['2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '2×45 sec each side', '5 min easy walk']),
      '6 easy moves · about 20 min');
    assert.equal(coolMeta(['2×45 sec each side']), '1 easy move · about 3 min');
  });

  test('a prescription prints its RPE beside the set summary and its cue as sentences, without a dash (D283\'s table)', () => {
    // [prescription, the RPE the line adds, the cue, the cool down's dose when the table names one], typed from the ruling.
    const table: [string, string | null, string | null, string?][] = [
      ['8–12 each @ RPE 7', 'RPE 7', null],
      ['25 sec', null, null],
      ['2×6 each, slow', null, 'Slow.'],
      ['3×40 yards each, heavy', null, 'Heavy.'],
      ['2×5 each direction, each leg', null, 'Each direction, each leg.'],
      ['2 sets — RPE 7 (leave 3 or more in reserve)', 'RPE 7', null],
      ['2×8 — hold RPE 7, three in the tank', 'RPE 7', null],
      ['2×12 — RPE 6–7, leave 3+ in reserve — 3 min rest, focus on form', 'RPE 6 to 7', 'Focus on form.'],
      ['3×10 — RPE 5–6 (primer — light and crisp, well short of failure), 2–3 min rest', 'RPE 5 to 6', 'Primer. Light and crisp, well short of failure.'],
      ['5×10 — RPE 6 (recovery — leave 4+ reps in the tank), ramp up with 2–3 warmup sets, 2–3 min rest', 'RPE 6', 'Recovery.'],
      ['3 sets — RPE 6–7 (leave 3–4 in reserve — learn the movement), ramp up with 2–3 warmup sets, 2–3 min rest', 'RPE 6 to 7', 'Learn the movement.'],
      ['4×10 — fast and crisp, 60s rest', null, 'Fast and crisp.'],
      ['2×45 sec each side — hip flexors; squeeze the trailing glute', null, 'Hip flexors. Squeeze the trailing glute.', '2 × 45 sec each side'],
      ['~3 min — calves, quads, glutes; slow passes', null, 'Calves, quads, glutes. Slow passes.', 'About 3 min'],
    ];
    for (const [d, rpe, cue, dose] of table) {
      const l = rxLine(d);
      assert.deepEqual([l.rpe, l.cue], [rpe, cue], d);
      if (dose !== undefined) assert.equal(l.dose, dose, d);
    }
    assert.deepEqual(rxLine(''), { dose: '', rpe: null, cue: null });
  });

  test('a round or block of four or more moves keeps only its first unlogged move open (D283, Auto)', () => {
    const mv = (n: number, logged: boolean) => ({ exKey: 'm' + n, name: 'M' + n, rxDetail: '8 reps', logged });
    assert.equal(FOLD_AT, 4);
    assert.equal(longCard({ kind: 'round', moves: [mv(1, false), mv(2, false), mv(3, false)] }), false, 'three moves show in full');
    assert.equal(longCard({ kind: 'round', moves: [1, 2, 3, 4].map((n) => mv(n, false)) }), true);
    assert.equal(longCard({ kind: 'cool', moves: [1, 2, 3, 4, 5].map((n) => mv(n, false)) }), false, 'the cool down never folds');
    assert.equal(restOpen({ kind: 'round', moves: [mv(1, true), mv(2, true), mv(3, false), mv(4, false)] }), 'm3');
    assert.equal(restOpen({ kind: 'block', moves: [1, 2, 3, 4].map((n) => mv(n, true)) }), 'm1', 'all logged: the first');
    assert.equal(restOpen({ kind: 'round', moves: [mv(1, false), mv(2, false)] }), null);
  });

  test('opening a move\'s sets keeps that move whole and folds the rest; closing them unfolds all, except on a long card', () => {
    const three = { kind: 'round' as const, moves: [1, 2, 3].map((n) => ({ exKey: 'm' + n, name: 'M' + n, rxDetail: '8 reps', logged: false })) };
    const four = { kind: 'round' as const, moves: [1, 2, 3, 4].map((n) => ({ exKey: 'm' + n, name: 'M' + n, rxDetail: '8 reps', logged: false })) };
    assert.equal(openAfterSetsTap(three, 'm2', true), 'm2', 'sets open: the others fold');
    assert.equal(openAfterSetsTap(three, 'm2', false), null, 'sets closed: every move shows in full');
    assert.equal(openAfterSetsTap(four, 'm3', false), 'm3', 'a long card keeps the move you were on');
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
    assert.deepEqual(cards.map((c) => c.meta), ['3 min rest between sets', '60 to 90 sec rest between sets', '2 rounds · 90 sec rest after each',
      'Core · Straight through · 60 to 90 sec rest', 'Straight through · 60 to 90 sec rest', '1 easy move · about 3 min', 'How did the whole thing feel?']);
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

  test('a taper note is not a card: its words, without the icon or the dash, join the card before it (D283 Amendment 1)', () => {
    const FLAG = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M4 21V4"></path></svg>';
    const note = FLAG + ' Taper — volume and load pulled back so you arrive fresh.';
    const secs: ExSection[] = [
      { label: 'Primer — Trap bar deadlift', items: [{ name: 'Trap bar deadlift', detail: '3×12 — RPE 5–6 (primer — light and crisp, well short of failure), 2–3 min rest' }] },
      { label: 'Taper', items: [{ name: note, detail: '' }] },
    ];
    const views: SectionView[] = [block([card('Trap bar deadlift', secs[0]!.items[0]!.detail!, 0, 0)]), block([card(note, '', 1, 0)])];
    const cards = deckCards(secs, views, () => null);
    assert.deepEqual(cards.map((c) => [c.kind, c.kicker, c.title]), [['lift', 'Primer', 'Trap bar deadlift'], ['finish', 'Finish', 'Call it']]);
    assert.equal(cards[0]!.cue, 'Taper. Volume and load pulled back so you arrive fresh.');
    // A note with no card before it waits for the first card.
    const first = deckCards([secs[1]!, secs[0]!], [views[1]!, views[0]!], () => null);
    assert.equal(first[0]!.cue, 'Taper. Volume and load pulled back so you arrive fresh.');
    assert.equal(noteWords(FLAG + ' Race week — primer only. Movement quality, zero grind. The hay is in the barn.'),
      'Race week. Primer only. Movement quality, zero grind. The hay is in the barn.');
    assert.deepEqual([isNote({ name: note, detail: '' }), isNote({ name: 'Wall sit', detail: '' }), isNote({ name: note, detail: '2×8' })], [true, false, false]);
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
    assert.deepEqual(cards.map((c) => [c.kind, c.title, c.skipped, c.meta]), [
      ['lift', 'Back squat', true, 'Back squat is off today.'], ['round', 'Leg circuit', true, 'The whole card is off today.'],
      ['round', 'D', false, 'One movement left, so the round is off. It keeps its own sets.'], ['finish', 'Call it', false, 'How did the whole thing feel?'],
    ]);
    assert.deepEqual(cards[0]!.undo, { kind: 'exercise', name: 'Back squat' });
    assert.deepEqual(cards[1]!.undo, { kind: 'round', secIdx: 1 });
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
    assert.deepEqual([sub['flex'], sub['min-width'], sub['overflow'], sub['text-overflow'], sub['white-space']], ['0 1 auto', '0', 'hidden', 'ellipsis', 'nowrap']);
  });
});

describe('a deck card\'s sizes and labels (D283 P-DECKFIT)', () => {
  const css = readFileSync(join(REPO, 'frontends/app/src/app/screens/deck/deck.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const decls = (body: string): Record<string, string> =>
    Object.fromEntries(body.split(';').filter((d) => d.includes(':')).map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]));
  const rule = (sel: string, from = 0): Record<string, string> => {
    const at = css.indexOf(sel + '{', from);
    assert.ok(at >= 0, 'deck.css has no rule for ' + sel);
    return decls(css.slice(at + sel.length + 1, css.indexOf('}', at)));
  };
  const SIZES = ['--dk-num', '--dk-title', '--dk-meta', '--dk-name', '--dk-line', '--dk-cue', '--dk-ctl', '--dk-ic', '--dk-mic', '--dk-pad', '--dk-item', '--dk-row'];
  const pick = (r: Record<string, string>) => SIZES.map((k) => r[k]);

  test('Roomy on a screen 700 pt tall or more: title 24, move 17, line 15, buttons 44 (Mario\'s "Auto")', () => {
    assert.deepEqual(pick(rule('.deck-ov')), ['30px', '24px', '14px', '17px', '15px', '13px', '44px', '36px', '32px', '18px', '12px', '8px']);
  });

  test('Tight below 700 pt, as on an SE: title 20, move 15, line 13, buttons 34', () => {
    const media = css.indexOf('@media (max-height:699px){');
    assert.ok(media >= 0, 'the Tight sizes sit under a 699 pt max height');
    assert.deepEqual(pick(rule('.deck-ov', media)), ['22px', '20px', '13px', '15px', '13px', '12px', '34px', '30px', '26px', '12px', '6px', '6px']);
  });

  test('the head reads its sizes from the tokens, and the labels Sets and "as prescribed" are gone from a move', () => {
    assert.equal(rule('.deck-num')['font-size'], 'var(--dk-num)');
    assert.equal(rule('.deck-name')['font-size'], 'var(--dk-title)');
    assert.equal(rule('.deck-meta')['font-size'], 'var(--dk-meta)');
    assert.equal(rule('.deck-work .ex-deck .ex-name')['font-size'], 'var(--dk-name)');
    assert.equal(rule('.deck-work .ex-deck .exset-head-val')['font-size'], 'var(--dk-line)');
    assert.equal(rule('.deck-work .ex-deck .ex-logbtn')['height'], 'var(--dk-ctl)');
    assert.equal(rule('.deck-work .ex-deck .exset-head-lbl,.deck-work .ex-deck .exset-head-sub,.deck-work .ex-deck .exset-head-sp')['display'], 'none');
    assert.equal(rule('.deck-work .ex-deck .ex-weight-lbl')['display'], 'none', 'the Load label is gone');
    for (const gone of ['.deck-kicker{', '.deck-chip{', '.deck-chips{', '.deck-rx{']) assert.equal(css.includes(gone), false, gone + ' is gone');
  });

  test('Log ends the weight row, or the summary\'s row on a move with no weight; a folded move is one line', () => {
    const loaded = rule('.deck-work .exercise-item.ex-deck')['grid-template-areas']!, bare = rule('.deck-work .exercise-item.ex-deck:not(.ex-loaded)')['grid-template-areas']!;
    assert.ok(loaded.includes('"weight log"'), loaded);
    assert.ok(bare.includes('"line log"'), bare);
    assert.equal(rule('.deck-work .ex-deck.ex-folded')['grid-template-areas'], '"name line"');
  });
});
