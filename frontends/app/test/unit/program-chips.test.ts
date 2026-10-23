// The Progress screen's program chips and archived bar (src/app/screens/progress/program-chips-model.ts, architecture
// phase E step 17), against the legacy _progChipsHTML and _restoreBarHTML: which programs get chips and in what order,
// the labels, the shown chip, and which bar an archived program gets. Every expected value is typed from the legacy code.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type ChipsInput, chipStyle, chipsView } from '../../src/app/screens/progress/program-chips-model.ts';

const input = (over: Partial<ChipsInput> = {}): ChipsInput => ({
  activeId: 'c', confirmId: null, confirmTier: 0, warnsCrossProg: () => false, icon: (n, s) => `[${n}/${s}]`, ...over,
});
const P = [{ id: 'a', name: 'Spring Base', created: 1 }, { id: 'b', name: 'Old Block', created: 3, archived: true }, { id: 'c', name: 'Half Manny', created: 2 }, { id: 'd', created: 4 }];

describe('the program chips', () => {
  it('puts the active program first, then the live ones newest first, then the archived, and marks the one shown', () => {
    const v = chipsView(P, 'a', input());
    assert.deepEqual(v.chips!.map((c) => [c.id, c.label, c.sel]), [
      ['c', 'Half Manny', false], ['d', 'Program', false], ['a', 'Spring Base', true], ['b', '[history/13] Old Block', false],
    ]);
    assert.equal(v.bar, null, 'a live program shown: no bar');
  });

  it('gives an archived program shown its bar, and its delete confirmation only while the delete is armed for it', () => {
    assert.deepEqual(chipsView(P, 'b', input()).bar, { kind: 'archived', id: 'b' });
    assert.deepEqual(chipsView(P, 'b', input({ confirmId: 'b', confirmTier: 2, warnsCrossProg: (id) => id === 'b' })).bar, { kind: 'confirm', id: 'b', name: 'Old Block', warn: true });
    assert.deepEqual(chipsView(P, 'b', input({ confirmId: 'b', confirmTier: 1 })).bar, { kind: 'archived', id: 'b' }, 'an archive armed is the list\'s, not this bar\'s');
    assert.deepEqual(chipsView(P, 'b', input({ confirmId: 'a', confirmTier: 2 })).bar, { kind: 'archived', id: 'b' });
  });

  it('draws no chips for one program: the bar alone when it is archived, nothing when it is live', () => {
    assert.deepEqual(chipsView([P[1]!], 'b', input()), { chips: null, bar: { kind: 'archived', id: 'b' } });
    assert.deepEqual(chipsView([P[0]!], 'a', input()), { chips: null, bar: null });
    assert.deepEqual(chipsView([], 'a', input()), { chips: null, bar: null });
  });

  it('fills the shown chip in the accent and outlines the rest', () => {
    assert.match(chipStyle(true), /border:1px solid var\(--accent\);background:var\(--accent\);color:var\(--on-ink\)$/);
    assert.match(chipStyle(false), /border:1px solid var\(--border\);background:var\(--surface\);color:var\(--muted\)$/);
  });
});
