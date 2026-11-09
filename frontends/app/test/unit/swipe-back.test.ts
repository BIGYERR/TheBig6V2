// The iOS edge swipe (src/app/screens/frames/swipe-back-model.ts, D277 P-SWIPEBACK, docs/decisions/swipe-back.md):
// where a swipe starts, when it takes the touch from the page, whether a release goes back, and which page it moves.
// Every expected value is typed here from the ruling's numbers: a 24 px edge, a 10 px sideways lock, half the width or
// a flick right of 0.3 px a millisecond to go back, a flick left of 0.1 to go home, 280 ms to settle.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { atEdge, EDGE, follow, LOCK, lockOf, SETTLE_EASE, SETTLE_MS, settle, speed, topLayer } from '../../src/app/screens/frames/swipe-back-model.ts';

describe('the swipe back', () => {
  it('starts only within 24 px of the left edge, and takes iOS\'s numbers', () => {
    assert.deepEqual([EDGE, LOCK, SETTLE_MS, SETTLE_EASE], [24, 10, 280, 'cubic-bezier(.2,.8,.2,1)']);
    assert.deepEqual([0, 12, 24, 25, 200].map(atEdge), [true, true, true, false, false]);
  });

  it('takes the touch once it has gone 10 px more sideways than up or down, and leaves an up or down scroll to the page', () => {
    assert.equal(lockOf(6, 2), null, 'not yet 10 px');
    assert.equal(lockOf(11, 4), 'swipe');
    assert.equal(lockOf(11, 12), 'scroll', 'more down than across');
    assert.equal(lockOf(3, -14), 'scroll');
    assert.equal(lockOf(-15, 2), null, 'a drag left is never a swipe back');
  });

  it('moves the page with the finger, never left of home', () => {
    assert.deepEqual([follow(-30), follow(0), follow(140)], [0, 0, 140]);
  });

  it('goes back past half the width or on a flick right, and home on a flick left or short of half', () => {
    // A 390 px screen: half is 195 px.
    assert.equal(settle(196, 0, 390), 'back');
    assert.equal(settle(194, 0, 390), 'home');
    assert.equal(settle(60, 0.35, 390), 'back', 'a flick right from a third of the way');
    assert.equal(settle(300, -0.2, 390), 'home', 'a flick left even past half');
    assert.equal(settle(8, 0.5, 390), 'home', 'a flick that never took the touch');
  });

  it('reads the finger\'s speed from its last two samples', () => {
    assert.equal(speed([{ x: 10, t: 0 }, { x: 40, t: 100 }, { x: 100, t: 200 }]), 0.6);
    assert.equal(speed([{ x: 10, t: 0 }]), 0);
    assert.equal(speed([{ x: 10, t: 50 }, { x: 40, t: 50 }]), 0);
  });

  it('moves the top page, by its height and then its place in the page, and only when it has a Back', () => {
    const sheet = { z: 200, order: 0, back: 'sheet back' }, swap = { z: 200, order: 1, back: 'swap back' }, deck = { z: 230, order: 2, back: 'deck back' };
    assert.equal(topLayer([sheet, swap]), swap, 'the swap sheet over the session sheet');
    assert.equal(topLayer([sheet, deck, swap]), deck, 'the deck over both');
    assert.equal(topLayer([sheet, { z: 400, order: 3, back: null }]), null, 'a pop-up over the sheet stops it');
    assert.equal(topLayer([]), null, 'no page, no swipe: This Week stays');
  });
});
