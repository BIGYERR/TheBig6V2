import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GAP, LABEL_H, PAD, collageHtml, collageLayout } from '../../e2e/collage.ts';
import type { CollageTile } from '../../e2e/collage.ts';
import { externalRefs } from '../../e2e/report.ts';
import { embeddedPngs, solidPng } from '../helpers.ts';

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

describe('collageHtml', () => {
  const tiles: CollageTile[] = [
    { n: 1, id: 'home-empty', title: 'Programs (first launch)', status: 'pass', png: solidPng(4, 8, [255, 0, 0]) },
    { n: 2, id: 'wizard-goal', title: 'New program: <goal>', status: 'fail', png: solidPng(4, 8, [0, 255, 0]) },
    { n: 3, id: 'week', title: 'This Week', status: 'skipped' },
  ];
  const layout = collageLayout(tiles.length, 4, 8);
  const html = collageHtml(tiles, layout, { title: 'IRON ASYLUM e2e screens', subtitle: 'ia-version 239' });

  it('labels each screen with its number, title and id', () => {
    for (const label of ['#01', '#02', '#03', 'Programs (first launch)', 'home-empty', 'wizard-goal', 'This Week']) {
      assert.ok(html.includes(label), label);
    }
    assert.ok(html.includes('New program: &lt;goal&gt;'));
  });

  it('embeds each screenshot and marks a missing one', () => {
    assert.equal(embeddedPngs(html).length, 2);
    assert.match(html, />No screenshot</);
  });

  it('flags every screen that did not pass', () => {
    assert.equal(html.match(/class="flag"/g)?.length, 2);
    assert.match(html, /class="label fail"[\s\S]*?FAIL/);
    assert.match(html, /class="label skipped"[\s\S]*?NOT RUN/);
  });

  it('sizes the page to the layout and loads nothing from outside', () => {
    assert.ok(html.includes(`width:${layout.width}px;height:${layout.height}px`));
    assert.deepEqual(externalRefs(html), []);
  });

  it('refuses a tile count that does not match the layout', () => {
    assert.throws(() => collageHtml(tiles.slice(0, 2), layout, { title: '', subtitle: '' }), RangeError);
  });
});
