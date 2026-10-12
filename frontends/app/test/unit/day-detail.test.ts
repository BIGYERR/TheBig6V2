// A day's session sheet (src/app/screens/day-detail/day-detail-model.ts, architecture phase E step 20), against the
// legacy openDetail it replaces: lifting first only when lifting is the priority, the body's order, the "logged but
// never marked" nudge and the logged count. Every expected value is typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { detailBody, hasLogged, liftsFirst, loggedCount, logNudge } from '../../src/app/screens/day-detail/day-detail-model.ts';

const P = { lifts: '<L>', cardio: '<C>', note: undefined, rangeNudge: '', wildcardTag: '', log: '<LOG>', logNudge: '' };

describe('the session sheet', () => {
  it('puts lifting first only when lifting is the priority', () => {
    assert.deepEqual([
      liftsFirst(true, 'body', 'strength'), liftsFirst(true, 'both', 'balanced'), liftsFirst(true, 'event', 'balanced'),
      liftsFirst(true, 'body', 'support_athletic'), liftsFirst(false, 'body', 'strength'), liftsFirst(true, undefined, undefined),
    ], [true, true, false, false, false, true]);
  });

  it('orders the body: the Wildcard tag, the range nudge, the work, the note, the log, the log nudge', () => {
    assert.equal(detailBody(P, true, true), '<L><C><LOG>');
    assert.equal(detailBody(P, false, true), '<C><L><LOG>');
    assert.equal(detailBody({ ...P, lifts: 'unused' }, false, false), '<C><LOG>', 'a day with no sections is its cardio');
    assert.equal(detailBody({ ...P, note: 'Easy <b>day</b>', rangeNudge: '<R>', wildcardTag: '<W>', logNudge: '<N>' }, true, true), '<W><R><L><C><div class="note-block">Easy <b>day</b></div><LOG><N>');
  });

  it('nudges a day with a note or a run, ride or swim figure, and nothing else', () => {
    assert.deepEqual([hasLogged(undefined), hasLogged({}), hasLogged({ notes: '   ' }), hasLogged({ rpe: 7 }), hasLogged({ notes: 'ok' }), hasLogged({ run_rep_time: '1:30' }), hasLogged({ swim_yards: 500 })], [false, false, false, false, true, true, true]);
    assert.equal(logNudge('fri', "Push (it's light)", '[nb]'), '<div class="log-nudge"><span>[nb] You logged this one but never marked it.</span><button class="log-nudge-btn" onclick="handleDayStatus(\'fri\',\'Push (it\\\'s light)\',\'complete\')">Mark Done ✓</button></div>');
  });

  it('counts what is logged, and hides the count with nothing to log', () => {
    assert.deepEqual([loggedCount({ done: 2, total: 7 }), loggedCount({ done: 0, total: 0 })], ['2 / 7 LOGGED', null]);
  });
});
