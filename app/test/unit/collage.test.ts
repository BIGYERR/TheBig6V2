import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { COLOURS, EDGE, FLAG, GAP, HEADER_H, LABEL_H, PAD, collageLayout, composeCollage, headerHtml, labelsHtml } from '../../e2e/collage.ts';
import type { CollageTile } from '../../e2e/collage.ts';
import { pngSize } from '../../e2e/parity.ts';
import { externalRefs } from '../../e2e/report.ts';
import { pixels, solidPng } from '../helpers.ts';

/** The suite's real shape: 19 screens of 393×852 @2x. */
const W = 786;
const H = 1704;

describe('collageLayout', () => {
  const layout = collageLayout(19, W, H);

  it('fits every screen with no empty row', () => {
    assert.ok(layout.cols * layout.rows >= 19);
    assert.ok(layout.cols * (layout.rows - 1) < 19);
    assert.equal(layout.placements.length, 19);
  });

  it('keeps every screen and its label inside the canvas margins', () => {
    for (const p of layout.placements) {
      assert.ok(p.x >= PAD && p.y >= PAD);
      assert.equal(p.shotX, p.x);
      assert.equal(p.shotY, p.y + LABEL_H);
      assert.ok(p.shotX + W <= layout.width - PAD);
      assert.ok(p.shotY + H <= layout.height - PAD);
    }
  });

  it('never overlaps two cells', () => {
    const ps = layout.placements;
    for (let i = 0; i < ps.length; i++) {
      for (let j = i + 1; j < ps.length; j++) {
        const a = ps[i]!;
        const b = ps[j]!;
        const apart = a.x + W + GAP <= b.x || b.x + W + GAP <= a.x || a.y + LABEL_H + H + GAP <= b.y || b.y + LABEL_H + H + GAP <= a.y;
        assert.ok(apart, `cells ${i + 1} and ${j + 1} overlap`);
      }
    }
  });

  it('reads left to right, then top to bottom', () => {
    for (let i = 1; i < layout.placements.length; i++) {
      const prev = layout.placements[i - 1]!;
      const cur = layout.placements[i]!;
      if (i % layout.cols === 0) assert.ok(cur.y > prev.y && cur.x === PAD, `screen ${i + 1} starts a new row`);
      else assert.ok(cur.y === prev.y && cur.x > prev.x, `screen ${i + 1} follows on the same row`);
    }
  });

  it('is a multi-megapixel image at native screenshot size', () => {
    assert.ok(layout.width * layout.height > 25e6, `${layout.width}×${layout.height}`);
    assert.ok(layout.width <= 16384 && layout.height <= 16384, 'within what Chrome can capture in one shot');
  });

  it('keeps the full suite (46 screens) within what Chrome can capture', () => {
    const big = collageLayout(46, W, H);
    assert.ok(big.width <= 16384 && big.height <= 16384, `${big.width}×${big.height}`);
  });

  it('takes more columns for a wider target shape', () => {
    assert.ok(collageLayout(19, W, H, 2.5).cols > collageLayout(19, W, H, 0.4).cols);
  });

  it('handles a single screen and refuses none', () => {
    const one = collageLayout(1, W, H);
    assert.equal(one.cols, 1);
    assert.equal(one.rows, 1);
    assert.throws(() => collageLayout(0, W, H), RangeError);
  });
});

describe('headerHtml and labelsHtml', () => {
  const tiles: CollageTile[] = [
    { n: 1, id: 'strength/home-empty', title: 'Programs (first launch)', status: 'pass' },
    { n: 2, id: 'strength/wizard-goal', title: 'New program: <goal>', status: 'fail' },
    { n: 3, id: 'race-10k/race-day', title: 'Race: race day', status: 'skipped' },
  ];
  const labels = labelsHtml(tiles, 786);

  it('labels each screen with its number, title, journey/step id and status', () => {
    for (const text of ['#01', '#02', '#03', 'Programs (first launch)', 'strength/home-empty', 'race-10k/race-day', 'PASS', 'FAIL', 'NOT RUN']) {
      assert.ok(labels.includes(text), text);
    }
    assert.ok(labels.includes('New program: &lt;goal&gt;'));
  });

  it('stacks the labels one LABEL_H band apart, in tile order', () => {
    assert.deepEqual([...labels.matchAll(/class="label [a-z]+" style="top:(\d+)px/g)].map((m) => Number(m[1])), [0, LABEL_H, 2 * LABEL_H]);
    assert.ok(labels.includes(`height:${3 * LABEL_H}px`));
  });

  it('puts the title and the run line in the header, escaped', () => {
    const head = headerHtml({ title: 'IRON ASYLUM e2e screens', subtitle: 'ia-version 239 <x>' }, 5000);
    assert.ok(head.includes('IRON <span>ASYLUM e2e screens</span>'));
    assert.ok(head.includes('ia-version 239 &lt;x&gt;'));
    assert.ok(head.includes(`width:5000px;height:${HEADER_H}px`));
  });

  it('loads nothing from outside the page', () => {
    assert.deepEqual(externalRefs(labels), []);
    assert.deepEqual(externalRefs(headerHtml({ title: 't', subtitle: 's' }, 100)), []);
  });
});

describe('composeCollage', () => {
  const W = 20;
  const H = 30;
  // A screenshot whose every pixel is unique, so a shift or a scale of one pixel shows.
  const gradient = solidPng(W, H, [0, 0, 0], (x, y) => [x * 10, y * 8, 77]);
  const tiles: CollageTile[] = [
    { n: 1, id: 'a/one', title: 'One', status: 'pass', png: gradient },
    { n: 2, id: 'a/two', title: 'Two', status: 'fail', png: solidPng(W, H, [30, 160, 60]) },
    { n: 3, id: 'a/three', title: 'Three', status: 'skipped' },
  ];
  const layout = collageLayout(tiles.length, W, H);
  const header = solidPng(layout.width, HEADER_H, [10, 20, 30]);
  const labels = solidPng(W, tiles.length * LABEL_H, [0, 0, 0], (_x, y) => [Math.floor(y / LABEL_H) * 50 + 40, 0, 0]);
  const png = composeCollage(layout, header, labels, tiles);
  const at = pixels(png);
  const read = pixels(gradient);

  it('is exactly the size of its layout', () => {
    assert.deepEqual(pngSize(png), { width: layout.width, height: layout.height });
  });

  it('copies every screenshot pixel for pixel, unscaled, at its slot', () => {
    const p = layout.placements[0]!;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) assert.deepEqual(at(p.shotX + x, p.shotY + y), read(x, y), `pixel ${x},${y}`);
  });

  it('puts each label band over its own screen', () => {
    for (const [i, p] of layout.placements.entries()) assert.deepEqual(at(p.x, p.y), [i * 50 + 40, 0, 0], `label ${i + 1}`);
  });

  it('puts the header strip under the top margin, on a bone background', () => {
    assert.deepEqual(at(0, 0), [...COLOURS.bone]);
    assert.deepEqual(at(0, PAD), [10, 20, 30]);
    assert.deepEqual(at(layout.width - 1, PAD + HEADER_H - 1), [10, 20, 30]);
  });

  it('edges a passing screen with a hairline and frames the others in red', () => {
    const [pass, fail, skipped] = layout.placements;
    assert.deepEqual(at(pass!.shotX - 1, pass!.shotY), [...COLOURS.edge]);
    assert.deepEqual(at(pass!.shotX - EDGE - 1, pass!.shotY), [...COLOURS.bone]);
    assert.deepEqual(at(fail!.shotX - FLAG, fail!.shotY + 5), [...COLOURS.flag]);
    assert.deepEqual(at(skipped!.shotX + W, skipped!.shotY + H + FLAG - 1), [...COLOURS.flag]);
  });

  it('leaves a plain placeholder where a screenshot is missing', () => {
    const p = layout.placements[2]!;
    assert.deepEqual(at(p.shotX + (W >> 1), p.shotY + (H >> 1)), [...COLOURS.missing]);
  });

  it('refuses a tile count that does not match the layout', () => {
    assert.throws(() => composeCollage(layout, header, labels, tiles.slice(0, 2)), RangeError);
  });
});
