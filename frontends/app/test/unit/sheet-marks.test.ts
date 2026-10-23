// The session sheet's small marks (src/app/screens/day-detail/sheet-marks-model.ts, architecture phase E), against the
// legacy modTagsHTML, wildcardTagHTML and _benchStripHTML they replace. Every expected value is typed here from the
// legacy builders.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { benchNotes, modTags, wildcardSub } from '../../src/app/screens/day-detail/sheet-marks-model.ts';

describe('the session sheet\'s marks', () => {
  it('colors each tag from its palette, names it from its label, leaves rest out, and falls back for a tag with no color', () => {
    const pal = { run: ['#5e8c54', 'rgba(94,140,84,0.15)'] as const };
    const meta = { run: { label: 'Run' }, test: { label: 'Test Week' } };
    assert.deepEqual(modTags(['run', 'rest', 'test', 'odd'], pal, meta), [
      { label: 'Run', color: '#5e8c54', bg: 'rgba(94,140,84,0.15)' },
      { label: 'Test Week', color: '#7d7668', bg: 'rgba(125,118,104,0.12)' },
      { label: 'odd', color: '#7d7668', bg: 'rgba(125,118,104,0.12)' },
    ]);
    assert.deepEqual(modTags(undefined, pal, meta), []);
  });

  it('says the session is still on the board under a Wildcard, or that a rest day sits out, and nothing without one', () => {
    assert.equal(wildcardSub(true, { title: 'Push' }), 'Push is still on the board.');
    assert.equal(wildcardSub(true, null), 'Your session is still on the board.');
    assert.equal(wildcardSub({ title: 'x' }, { rest: true, title: 'Rest' }), 'Rest day. The streak sits this one out.');
    assert.equal(wildcardSub(null, { title: 'Push' }), null);
  });

  it('strips nothing on a session that is not a retest, says when week 1 was never logged, and reads the change at the same effort', () => {
    const clock = (s: number) => `<${Math.round(s)}>`;
    assert.deepEqual(benchNotes({ subtype: 'Long Run' }, () => null, clock), []);
    assert.deepEqual(benchNotes({ subtype: 'Benchmark Run — Retest', week: 6 }, () => null, clock), [
      { lead: null, text: 'No week 1 benchmark was logged — today’s result becomes your baseline for the next block. Run it exactly as written.' },
    ]);
    const base = { dist: 2.5, mins: 20, sec: 480 };
    const at = (now: { dist: number; mins: number; sec: number } | null) => (w: number | undefined) => (w === 1 ? base : w === 6 ? now : null);
    const baseNote = { lead: 'WEEK 1 BASELINE:', text: ' 2.5 mi in 20 min — <480>/mi. Same even effort today; the distance difference is your gain.' };
    assert.deepEqual(benchNotes({ subtype: 'Benchmark Run — Retest', week: 6 }, at(null), clock), [baseNote]);
    // 480 − 452 = 28 s/mi faster; 480 − 484 = −4, within 5 of even; 480 − 500 = 20 s/mi slower.
    assert.deepEqual(benchNotes({ subtype: 'Benchmark Run — Retest', week: 6 }, at({ dist: 2.65, mins: 20, sec: 452 }), clock)[1],
      { lead: 'RETEST:', text: ' 2.65 mi — <452>/mi. 28 sec/mi FASTER at the same effort. The aerobic engine grew — the block worked.' });
    assert.match(benchNotes({ subtype: 'Benchmark Run — Retest', week: 6 }, at({ dist: 2.48, mins: 20, sec: 484 }), clock)[1]!.text, / Even with week 1 — fitness held/);
    assert.match(benchNotes({ subtype: 'Benchmark Run — Retest', week: 6 }, at({ dist: 2.4, mins: 20, sec: 500 }), clock)[1]!.text, /20 sec\/mi slower at the same effort\. An off day happens/);
  });
});
