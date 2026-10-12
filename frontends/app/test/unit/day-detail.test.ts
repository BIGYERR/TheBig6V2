// A day's session sheet (src/app/screens/day-detail/day-detail-model.ts, architecture phase E step 20), against the
// legacy openDetail it replaces: lifting first only when lifting is the priority, the body's order, the "logged but
// never marked" nudge and the logged count. Every expected value is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type BodyBlock, detailBody, e1rmCard, epley, hasLogged, liftsFirst, loggedCount, logNudge, rangeNudge, statusFoot } from '../../src/app/screens/day-detail/day-detail-model.ts';

const P = { main: '<M>', e1rm: null, rest: '<R>', cardio: '<C>', note: undefined, nudge: null, wildcardTag: '', log: '<LOG>', logNudge: '' };
/** A block as a line: markup as itself, the calculator and the nudge by name. */
const line = (b: BodyBlock) => (b.kind === 'html' ? b.html : b.kind);

describe('the session sheet', () => {
  it('puts lifting first only when lifting is the priority', () => {
    assert.deepEqual([
      liftsFirst(true, 'body', 'strength'), liftsFirst(true, 'both', 'balanced'), liftsFirst(true, 'event', 'balanced'),
      liftsFirst(true, 'body', 'support_athletic'), liftsFirst(false, 'body', 'strength'), liftsFirst(true, undefined, undefined),
    ], [true, true, false, false, false, true]);
  });

  it('orders the body: the Wildcard tag, the range nudge, the work (the calculator after the main), the note, the log, the log nudge', () => {
    assert.deepEqual(detailBody(P, true, true).map(line), ['<M>', '<R>', '<C>', '<LOG>']);
    assert.deepEqual(detailBody(P, false, true).map(line), ['<C>', '<M>', '<R>', '<LOG>']);
    assert.deepEqual(detailBody({ ...P, main: 'unused' }, false, false).map(line), ['<C>', '<LOG>'], 'a day with no sections is its cardio');
    const card = { lift: 'bench', liftLabel: 'bench', unit: 'lbs', weight: '', reps: 3 };
    const all = detailBody({ ...P, e1rm: card, note: 'Easy <b>day</b>', nudge: { shown: ['Row'], extra: '' }, wildcardTag: '<W>', logNudge: '<N>' }, true, true);
    assert.deepEqual(all.map(line), ['<W>', 'nudge', '<M>', 'e1rm', '<R>', '<C>', '<div class="note-block">Easy <b>day</b></div>', '<LOG>', '<N>']);
    assert.deepEqual(detailBody({ ...P, cardio: '', rest: '' }, true, true).map(line), ['<M>', '<LOG>'], 'a builder with nothing adds no block');
  });

  it('estimates a test max by Epley, a single being itself', () => {
    // 225 × (1 + 3/30) = 247.5 → 248; 100 × (1 + 5/30) = 116.7 → 117.
    assert.deepEqual([epley(225, 3), epley(100, 5), epley(315, 1), epley(0, 3), epley(-5, 3)], [248, 117, 315, 0, 0]);
  });

  it('prefills the calculator from the logged test set: its weight and its first set\'s reps, kept to 1 to 5', () => {
    assert.deepEqual(e1rmCard('bench', 'kg', { weight: 100, setsDone: [2, 2] }), { lift: 'bench', liftLabel: 'bench', unit: 'kg', weight: '100', reps: 2 });
    assert.deepEqual([e1rmCard('squat', 'lbs', { weight: 300, setsDone: [8] })!.reps, e1rmCard('squat', 'lbs', { weight: 300, setsDone: ['x'] })!.reps, e1rmCard('squat', 'lbs', undefined)!.weight], [5, 3, '']);
    assert.equal(e1rmCard('trap_bar', 'lbs', undefined)!.liftLabel, 'trap_bar');
    assert.equal(e1rmCard(undefined, 'lbs', undefined), null);
  });

  it('nudges the lifts whose last session hit the top of the range on every set, two by name and the rest counted', () => {
    const last: Record<string, { setsDone: number[] }> = { A: { setsDone: [12, 12, 12] }, B: { setsDone: [15, 15, 15, 9] }, C: { setsDone: [15, 14, 15] }, D: { setsDone: [10, 10] }, E: { setsDone: [12, 13, 12] } };
    const items = [
      { name: 'A', detail: '3×8–12' }, { name: 'B', detail: '3×12–15 @ RPE 8' }, { name: 'C', detail: '3×12–15' },
      { name: 'D', detail: '3×8–10' }, { name: 'E', detail: '3×10–12 each' }, { name: 'F', detail: '4×5 — RPE 8' },
    ];
    assert.deepEqual(rangeNudge(items, (n) => last[n]), { shown: ['A', 'B'], extra: ' and 1 more' }, 'C missed a rep, D logged two of three sets, F has no range');
    assert.equal(rangeNudge([{ name: 'C', detail: '3×12–15' }], (n) => last[n]), null);
  });

  it('nudges a day with a note or a run, ride or swim figure, and nothing else', () => {
    assert.deepEqual([hasLogged(undefined), hasLogged({}), hasLogged({ notes: '   ' }), hasLogged({ rpe: 7 }), hasLogged({ notes: 'ok' }), hasLogged({ run_rep_time: '1:30' }), hasLogged({ swim_yards: 500 })], [false, false, false, false, true, true, true]);
    assert.equal(logNudge('fri', "Push (it's light)", '[nb]'), '<div class="log-nudge"><span>[nb] You logged this one but never marked it.</span><button class="log-nudge-btn" onclick="handleDayStatus(\'fri\',\'Push (it\\\'s light)\',\'complete\')">Mark Done ✓</button></div>');
  });

  it('counts what is logged, and hides the count with nothing to log', () => {
    assert.deepEqual([loggedCount({ done: 2, total: 7 }), loggedCount({ done: 0, total: 0 })], ['2 / 7 LOGGED', null]);
  });

  it('puts the day\'s status on the big button, undoable, and the other status on the small one', () => {
    const row = (cur: string | null) => statusFoot(cur).map((b) => [b.id, b.cls, b.label, b.undo, b.status]);
    assert.deepEqual(row(null), [['statusBtn_complete', 'day-done', 'Done', false, 'complete'], ['statusBtn_skipped', 'day-skip', 'Skip', false, 'skipped']]);
    assert.deepEqual(row('complete'), [['statusBtn_complete', 'day-done is', 'Done ✓ ', true, 'complete'], ['statusBtn_skipped', 'day-skip', 'Skip', false, 'skipped']]);
    assert.deepEqual(row('skipped'), [['statusBtn_skipped', 'day-done skipped', 'Skipped ✕ ', true, 'skipped'], ['statusBtn_complete', 'day-skip', 'Done', false, 'complete']]);
  });
});

