// The coach's swap nudge (src/app/screens/swap-nudge/swap-nudge-model.ts, architecture phase E step 9), against the
// legacy showSwapNudge it replaces: the two paragraphs and the slot the swap would take over. Every expected string is
// typed here from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nudgeSlot, nudgeText } from '../../src/app/screens/swap-nudge/swap-nudge-model.ts';

describe('the swap nudge', () => {
  it('names the trade in lower case and offers the new lift the old one\'s pattern', () => {
    assert.deepEqual(nudgeText('Barbell Row', 'Dumbbell Row', 'hpull'), {
      noticed: 'That is three sessions running you have traded barbell row for dumbbell row.',
      offer: 'Want me to make dumbbell row your hpull from here on? I will rebuild the rest of the block around it.',
    });
  });

  it('spells a pattern\'s underscores as spaces, and says "main" without a pattern', () => {
    assert.deepEqual([nudgeSlot('hip_ext'), nudgeSlot('knee_dom_uni'), nudgeSlot(null), nudgeSlot(undefined), nudgeSlot('')], ['hip ext', 'knee dom uni', 'main', 'main', 'main']);
    assert.match(nudgeText('Back Squat', 'Goblet Squat (DB)', null).offer, /^Want me to make goblet squat \(db\) your main from here on\?/);
  });
});
