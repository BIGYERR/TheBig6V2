// The session sheet's pieces moved from the legacy builders to Angular components (architecture phase E). The oracle
// here is the legacy builder itself, lifted out of the page with appFunction: for every input below, the view written
// back out in the legacy markup format is the legacy builder's markup, byte for byte. The app's own unit tests hold
// hand-worked values for the same functions.
import { describe, test } from 'vitest';
import assert from 'node:assert/strict';
import { appFunction } from '../support/app.ts';
import { cardioCard, type CardioCardView, type CardioRx } from '../../frontends/app/src/app/screens/day-detail/cardio-card-model.ts';

const BENCH = '<div class="cardio-note"><b>RETEST:</b> strip</div>';

/** The card written out as buildCardioHTML wrote it. */
function cardMarkup(c: CardioCardView | null): string {
  if (!c) return '';
  const body = c.segments
    ? c.segments.map((sg) => `<div class="swim-seg"><div class="swim-seg-label">${sg.label}</div><div class="swim-seg-body">${sg.text}</div></div>`).join('')
      + (c.total ? `<div class="swim-total">${c.total}</div>` : '')
    : `<div class="cardio-detail">${c.detail}</div>`;
  return `<div class="${c.blockCls}"><div class="cardio-type-label ${c.labelCls}">${c.label}</div>` + body
    + (c.note ? `<div class="cardio-note">${c.note}</div>` : '') + c.bench + '</div>';
}

describe('the cardio card (buildCardioHTML, phase E step 25)', () => {
  const legacy = appFunction<(c: CardioRx | null) => string>('buildCardioHTML', { _benchStripHTML: () => BENCH });
  const cases: [string, CardioRx | null][] = [
    ['a long run with a note', { type: 'run', subtype: 'Long_Run', detail: '6 mi easy\nfinish the last mile strong', note: 'Keep it <b>conversational</b>.' }],
    ['a retest', { type: 'Run', subtype: 'Benchmark Run — Retest', detail: '20 min at even effort' }],
    ['a ride', { type: 'bike', detail: '45 min @ RPE 6' }],
    ['a segmented swim', { type: 'swim', subtype: 'endurance', segments: [{ label: 'WU', text: '200 easy', yd: 200 }, { label: 'Main', text: '10×100 @ :15 rest', yd: 1000 }, { label: 'CD', text: '100 easy', yd: '100' }] }],
    ['a swim with segments but no yards', { type: 'swim', segments: [{ label: 'Drill', text: 'catch-up' }] }],
    ['a swim without segments', { type: 'swim', detail: '1,500 yd continuous' }],
    ['another sport', { type: 'Rower', detail: '2k test' }],
    ['no detail', { type: 'run' }],
    ['nothing', null],
  ];
  for (const [label, rx] of cases) {
    test(label, () => {
      const want = legacy(rx);
      assert.equal(cardMarkup(cardioCard(rx, rx ? BENCH : '')), want);
      assert.equal(want === '', rx === null);
    });
  }
});
