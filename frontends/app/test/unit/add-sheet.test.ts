// The add-an-exercise sheet (src/app/screens/add-sheet/add-sheet-model.ts, architecture phase E step 6), against the
// legacy openAddSheet it replaces: the tags, the three groups and their notes, and the day's working sets. Every expected
// value is typed here from the legacy code, never asked of the model.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type AddInput, addSheetView, workingSets } from '../../src/app/screens/add-sheet/add-sheet-model.ts';

const INPUT: AddInput = {
  title: 'Push',
  week: 3,
  setCount: 14,
  candidates: { gap: ['Face pull'], more: ['Dumbbell bench press', 'Dips'], off: ['Goblet squat'], region: 'push' },
  addedSets: (n) => (n === 'Dips' ? null : 4),
  regionOf: (n) => (n === 'Goblet squat' ? 'legs' : null),
};

describe('the add-an-exercise sheet', () => {
  it('tags the week, the day\'s region and its working sets', () => {
    const v = addSheetView(INPUT);
    assert.deepEqual([v.title, v.weekTag, v.regionTag, v.setsTag], ['Push', 'Week 3', 'Push day', '14 sets']);
    const bare = addSheetView({ ...INPUT, title: undefined, candidates: { gap: [], more: [], off: [], region: null } });
    assert.deepEqual([bare.title, bare.regionTag], ['Training', 'Today']);
  });

  it('lists the gaps plain, more of the same with the sets it brings the day to, and other regions with a warning', () => {
    const v = addSheetView(INPUT);
    assert.deepEqual(v.gap, [{ name: 'Face pull', caution: false, note: '' }]);
    assert.deepEqual(v.more, [
      { name: 'Dumbbell bench press', caution: true, note: 'Your day already has this pattern. Sets go to 18.' },
      { name: 'Dips', caution: true, note: 'Your day already has this pattern. Sets go to 17.' },
    ]);
    assert.deepEqual(v.off, [{ name: 'Goblet squat', caution: true, note: 'Leg work on a push day. Check what it sits next to in the week.' }]);
    const offOnRest = addSheetView({ ...INPUT, candidates: { gap: [], more: [], off: ['Mystery'], region: null } });
    assert.equal(offOnRest.off[0]!.note, 'That work on a training day. Check what it sits next to in the week.');
  });

  it('counts the day\'s working sets: skipped items and open prescriptions count nothing', () => {
    const rx = (detail: string) => (detail === 'open' ? { sets: 3, open: true } : detail ? { sets: +detail } : null);
    assert.equal(workingSets([{ items: [{ name: 'a', detail: '4' }, { name: 'b', detail: '3', _skipped: true }, null, { name: 'c', detail: 'open' }] }, { items: [{ name: 'd', detail: '2' }, { name: 'e' }] }], rx), 6);
    assert.equal(workingSets(undefined, rx), 0);
  });
});
