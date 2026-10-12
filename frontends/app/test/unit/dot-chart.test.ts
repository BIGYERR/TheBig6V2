// The weekly dot chart (src/app/screens/progress/charts/dot-chart-model.ts, architecture phase E step 14), against the
// legacy buildDotChart it replaces. The geometry is worked by hand from the legacy constants: a 320 × 120 box, 36 in
// from the left, 12 from the right, 16 from the top and 24 from the bottom, so the plot is 272 wide and 80 tall, and a
// value v sits at 16 + 80 − v/max × 80.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dotChart } from '../../src/app/screens/progress/charts/dot-chart-model.ts';

const y = (v: number, max: number) => 16 + 80 - (v / max) * 80;

describe('the weekly dot chart', () => {
  it('scales to 1.2 times the peak, joins neighbouring weeks, and labels every week up to eight', () => {
    // Peak 20, so the top is 24; three weeks share 272 across, 136 apart.
    const s = dotChart('[🏃] Weekly Running Mileage', [1, 2, 3], [10, 20, null], 'var(--run)', 'mi')!;
    assert.deepEqual(s.grid, [{ y: 96, label: 0 }, { y: 56, label: 12 }, { y: 16, label: 24 }]);
    assert.deepEqual(s.points, [{ x: 36, y: y(10, 24) }, { x: 172, y: y(20, 24) }]);
    assert.equal(s.path, ` M36,${y(10, 24)} L172,${y(20, 24)}`);
    assert.deepEqual(s.xLabels, [{ x: 36, text: 'W1' }, { x: 172, text: 'W2' }, { x: 308, text: 'W3' }]);
    assert.deepEqual([s.width, s.height, s.left, s.right, s.xLabelY, s.total, s.peak, s.unit], [320, 120, 36, 308, 116, '30.0', '20.0', 'mi']);
  });

  it('breaks the line at an unlogged week, and keeps a fixed top when given one', () => {
    const s = dotChart('RPE', [1, 2, 3], [7, null, 8], '#7e5e96', '', 10)!;
    assert.equal(s.path, '', 'no two logged weeks touch');
    assert.deepEqual(s.grid.map((g) => g.label), [0, 5, 10]);
    assert.deepEqual(s.points.map((p) => p.y), [y(7, 10), y(8, 10)]);
  });

  it('labels every second week past eight and every fourth past sixteen, and spaces a lone week at the left', () => {
    const twelve = Array.from({ length: 12 }, (_, i) => i + 1);
    assert.deepEqual(dotChart('t', twelve, twelve.map(() => 1), 'c', '')!.xLabels.map((l) => l.text), ['W1', 'W3', 'W5', 'W7', 'W9', 'W11']);
    const twenty = Array.from({ length: 20 }, (_, i) => i + 1);
    assert.deepEqual(dotChart('t', twenty, twenty.map(() => 1), 'c', '')!.xLabels.map((l) => l.text), ['W1', 'W5', 'W9', 'W13', 'W17']);
    assert.deepEqual(dotChart('t', [1], [5], 'c', '')!.points, [{ x: 36, y: y(5, 6) }]);
  });

  it('draws nothing with nothing logged, and a top of 10 when every week logged zero', () => {
    assert.equal(dotChart('t', [1, 2], [null, null], 'c', ''), null);
    assert.deepEqual(dotChart('t', [1, 2], [0, 0], 'c', '')!.grid.map((g) => g.label), [0, 5, 10]);
  });
});
