// The exercise swap sheet (src/app/screens/swap-sheet/swap-sheet-model.ts, architecture phase E step 5), against the
// legacy openSwapSheet it replaces: the tags, the short prescription, the implement order in a one-implement round, and
// the rows and their notes. Every expected value is typed here from the legacy code, never asked of the model.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { implementOf, patternTag, regionTag, rxShort, type SwapInput, swapSheetView } from '../../src/app/screens/swap-sheet/swap-sheet-model.ts';

const BASE: SwapInput = {
  name: 'Barbell row',
  detail: '4 × 8 — RPE 8 (stop 2 reps short of failure)',
  itemIdx: 1,
  section: { label: 'Pull superset A', superset: false, items: [{ name: 'Lat pulldown' }, { name: 'Barbell row' }] },
  candidates: { tier1: ['Pendlay row', 'Dumbbell row'], tier2: ['Face pull'], pattern: 'row', region: 'pull' },
  familyLabel: null,
  compoundTier: 3,
  loadNote: (out, cand) => (cand === 'Dumbbell row' ? 'Much lighter than ' + out.toLowerCase() + '. Volume holds, top-end strength does not.' : ''),
};

describe('the swap sheet', () => {
  it('tags the pattern and the day, with the legacy words and fallbacks', () => {
    assert.deepEqual([patternTag('hip_ext'), patternTag('vpull'), patternTag(null), patternTag('carry')], ['HIP EXTENSION', 'VERTICAL PULL', 'LIFT', 'LIFT']);
    assert.deepEqual([regionTag('legs'), regionTag('push'), regionTag(null)], ['LEG DAY', 'PUSH DAY', 'TODAY']);
  });

  it('shortens a prescription to its sets and reps and its RPE, or cuts it at 24 characters', () => {
    assert.equal(rxShort('4 × 8 — RPE 8 (stop 2 reps short of failure)'), '4×8 at RPE 8');
    assert.equal(rxShort('3 sets — RPE 7 (leave 3 or more in reserve)'), '3 sets at RPE 7');
    assert.equal(rxShort('3×10–12'), '3×10–12');
    assert.equal(rxShort('Hold a hard plank for as long as you can'), 'Hold a hard plank for as…');
    assert.equal(rxShort('2×45 sec each side'), '2×45');
    assert.equal(rxShort(''), '');
  });

  it('reads the implement off the name', () => {
    assert.deepEqual(['Kettlebell swing', 'Step-ups (KB)', 'Dumbbell row', 'Goblet squat (DB)', 'Trap bar deadlift', 'Pushups'].map(implementOf), ['kb', 'kb', 'db', 'db', 'bb', null]);
  });

  it('draws the sheet: the tags, what a pick keeps, the same-job rows with their load note, the other jobs as cautions', () => {
    assert.deepEqual(swapSheetView(BASE), {
      outName: 'Barbell row', kindTag: 'ROW', regionTag: 'PULL DAY', slotTag: 'HEAVY COMPOUND', keeps: '4×8 at RPE 8',
      sameJob: [
        { name: 'Pendlay row', caution: false, note: '' },
        { name: 'Dumbbell row', caution: true, note: 'Much lighter than barbell row. Volume holds, top-end strength does not.' },
      ],
      flowNote: '',
      otherJob: [{ name: 'Face pull', caution: true, note: 'Different job. Region volume holds.' }],
      otherRegion: 'pull', givenUp: 'row',
    });
  });

  it('marks the main lift, names an aux family, and says "the same" without a region', () => {
    const main = swapSheetView({ ...BASE, itemIdx: 0, section: { label: 'Main — Barbell row' }, compoundTier: 3 });
    assert.equal(main.slotTag, 'MAIN LIFT');
    const fam = swapSheetView({ ...BASE, familyLabel: 'CORE', compoundTier: 0, candidates: { tier1: ['Dead bugs'], tier2: [], pattern: null, region: null } });
    assert.deepEqual([fam.kindTag, fam.slotTag, fam.otherRegion, fam.givenUp], ['CORE', '', 'the same', 'lift']);
  });

  it('puts the round\'s own implement first in a one-implement superset, and says picks lower down break the flow', () => {
    const v = swapSheetView({
      ...BASE,
      name: 'Dumbbell bench press',
      section: { label: 'Superset', superset: true, items: [{ name: 'Dumbbell bench press' }, { name: 'Dumbbell row' }] },
      candidates: { tier1: ['Barbell bench press', 'Dumbbell incline press', 'Pushups'], tier2: [], pattern: 'hpress', region: 'push' },
      compoundTier: 2,
    });
    assert.deepEqual(v.sameJob.map((r) => r.name), ['Dumbbell incline press', 'Barbell bench press', 'Pushups']);
    assert.equal(v.flowNote, 'This round runs on one implement — picks lower down break that flow.');
    const lone = swapSheetView({ ...BASE, section: { superset: true, items: [{ name: 'Barbell row' }, { name: 'Pushups' }] } });
    assert.deepEqual([lone.flowNote, lone.sameJob.map((r) => r.name)], ['', ['Pendlay row', 'Dumbbell row']]);
  });
});
