// The session sheet's cardio card (src/app/screens/day-detail/cardio-card-model.ts, architecture phase E step 25),
// against the legacy buildCardioHTML: the classes by sport, the title, swim segments with their total or the detail with
// its breaks, the note and the retest strip. tests/integration/session-sheet.test.ts holds the card to the legacy
// builder's markup byte for byte.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cardioCard } from '../../src/app/screens/day-detail/cardio-card-model.ts';

describe('the cardio card', () => {
  it('styles the card by sport and titles it with the session, its underscores spaced', () => {
    const run = cardioCard({ type: 'Run', subtype: 'Long_Run', detail: '6 mi easy\nfinish strong' }, '');
    assert.deepEqual([run!.blockCls, run!.labelCls, run!.label, run!.detail, run!.segments, run!.note], ['run-block', 'cardio-label-run', 'Run — Long Run', '6 mi easy<br>finish strong', null, null]);
    assert.deepEqual([cardioCard({ type: 'bike' }, '')!.label, cardioCard({ type: 'bike' }, '')!.blockCls], ['Bike / Spin', 'bike-block']);
    const row = cardioCard({ type: 'Rower', detail: '' }, '')!;
    assert.deepEqual([row.blockCls, row.labelCls, row.label, row.detail], ['cardio-block', 'cardio-label-general', 'Rower', '']);
    assert.equal(cardioCard(null, ''), null);
  });

  it('lists a swim\'s segments with their yards in total, or falls back to its detail without them', () => {
    const swim = cardioCard({ type: 'swim', segments: [{ label: 'WU', text: '200 easy', yd: 200 }, { label: 'Main', text: '10×100', yd: '1000' }, { label: 'CD', text: 'easy' }] }, '');
    assert.deepEqual([swim!.segments, swim!.total], [[{ label: 'WU', text: '200 easy' }, { label: 'Main', text: '10×100' }, { label: 'CD', text: 'easy' }], '1,200 yd total']);
    assert.deepEqual([cardioCard({ type: 'swim', segments: [], detail: '1000 yd' }, '')!.segments, cardioCard({ type: 'swim', segments: [{ label: 'x', text: 'y' }] }, '')!.total], [null, null]);
  });

  it('carries the note and the retest strip as given', () => {
    const c = cardioCard({ type: 'run', subtype: 'Benchmark Run — Retest', note: 'Even <b>effort</b>' }, '<div class="cardio-note">strip</div>')!;
    assert.deepEqual([c.note, c.bench], ['Even <b>effort</b>', '<div class="cardio-note">strip</div>']);
  });
});
