// The swipe deck (src/app/screens/deck/deck-model.ts, D275 P-DECK): the day's sections as cards, what Start session
// opens, and the one write the deck makes of its own (Call it). Every expected value is typed here from the ruling
// (docs/decisions/swipe-deck.md) and the canvas's words; the repo's tests/unit/swipe-deck.test.ts holds the rest.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { callItLog, deckCards, deckOpens, FINISH, openMotion } from '../../src/app/screens/deck/deck-model.ts';
import type { ExCard, ExSection, SectionView } from '../../src/app/screens/day-detail/session-sections-model.ts';

const card = (name: string, detail: string, secIdx: number, itemIdx: number, logged = false): ExCard => ({
  kind: 'card', exKey: name.toLowerCase(), name, detail, rxDetail: detail, logged, swap: { secIdx, itemIdx }, skip: true, added: false, swappedFrom: null,
  log: { sets: null, load: null },
});

describe('the swipe deck', () => {
  it('makes a main of two lifts two cards, an added block one card a lift, and ends on Call it', () => {
    const secs: ExSection[] = [
      { label: 'Main', items: [{ name: 'Bench press', detail: '3×5 — RPE 8 · 2–3 min rest' }, { name: 'Dip', detail: '2×8 @ RPE 7' }] },
      { label: 'Added by you', _added: true, items: [{ name: 'Curl', detail: '2×12', _addedByUser: true }] },
    ];
    const views: SectionView[] = [
      { kind: 'section', label: 'Main', body: { kind: 'block', label: null, items: [card('Bench press', secs[0]!.items[0]!.detail!, 0, 0), card('Dip', '2×8 @ RPE 7', 0, 1)] } },
      { kind: 'section', label: null, body: { kind: 'block', label: { text: 'Added by you', markup: true, color: 'var(--signal)' }, items: [card('Curl', '2×12', 1, 0, true)] } },
    ];
    const cards = deckCards(secs, views, () => null);
    assert.deepEqual(cards.map((c) => [c.key, c.kicker, c.title, c.logged]), [
      ['s0i0', 'Main', 'Bench press', false], ['s0i1', 'Main, second lift', 'Dip', false], ['s1i0', 'Added by you', 'Curl', true], ['finish', 'Finish', 'Call it', false],
    ]);
    assert.equal(cards[0]!.cue, 'Leave about two reps in reserve. Ramp up with two or three warmup sets. Two to three minutes rest.');
    assert.deepEqual(cards[0]!.chips, ['3 sets', '2–3 min rest']);
    assert.equal(cards.at(-1), FINISH);
    assert.equal(deckOpens(cards), true);
  });

  it('opens on lift work only: a day of nothing but its cool down opens the session sheet', () => {
    const cool: ExSection[] = [{ label: 'Post-run mobility', items: [{ name: 'Hip 90/90 stretch', detail: '2×45 sec each side' }] }];
    const view: SectionView[] = [{ kind: 'section', label: null, body: { kind: 'block', label: null, items: [card('Hip 90/90 stretch', '2×45 sec each side', 0, 0)] } }];
    assert.equal(deckOpens(deckCards(cool, view, () => null)), false);
  });

  it('Call it keeps the run that was logged on the day and changes only the RPE and the notes', () => {
    const e = { rpe: '', run_dist: '3.1', run_mins: '31', notes: '', week: 2, ts: 1 };
    assert.deepEqual(callItLog(e, 9, 'Good.', 2, 9), { rpe: '9', run_dist: '3.1', run_mins: '31', notes: 'Good.', week: 2, ts: 9 });
  });

  it('opens Lift first at 420 ms and closes at 0.85 of that speed (call 16)', () => {
    const m = openMotion();
    assert.deepEqual([m.lift, m.open, m.settled, m.close], [168, 420, 588, 357]);
  });
});
