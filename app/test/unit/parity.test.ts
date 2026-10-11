import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { comparePngs, pngSize } from '../../e2e/parity.ts';
import { solidPng } from '../helpers.ts';

describe('comparePngs', () => {
  it('finds no changed pixels between identical screenshots', () => {
    const shot = solidPng(10, 10, [20, 40, 60]);
    const p = comparePngs(shot, shot);
    assert.ok('pixels' in p);
    assert.equal(p.pixels, 0);
    assert.equal(p.pct, 0);
    assert.deepEqual(pngSize(p.diffPng), { width: 10, height: 10 });
  });

  it('counts one changed pixel in a 10×10 frame as 1%', () => {
    const a = solidPng(10, 10, [255, 255, 255]);
    const b = solidPng(10, 10, [255, 255, 255], (x, y) => (x === 3 && y === 7 ? [0, 0, 0] : undefined));
    const p = comparePngs(a, b);
    assert.ok('pixels' in p);
    assert.equal(p.pixels, 1);
    assert.equal(p.pct, 1);
  });

  it('ignores a colour shift under the anti-aliasing threshold', () => {
    const a = solidPng(10, 10, [200, 200, 200]);
    const b = solidPng(10, 10, [200, 200, 200], (x, y) => (x === 0 && y === 0 ? [201, 200, 200] : undefined));
    const p = comparePngs(a, b);
    assert.ok('pixels' in p);
    assert.equal(p.pixels, 0);
  });

  it('reports differently sized frames as an error, never a percentage', () => {
    const p = comparePngs(solidPng(10, 10, [0, 0, 0]), solidPng(10, 12, [0, 0, 0]));
    assert.deepEqual(p, { error: 'sizes differ 10×10 vs 10×12' });
  });
});

describe('pngSize', () => {
  it('reads the size from the header', () => {
    assert.deepEqual(pngSize(solidPng(786, 3, [1, 2, 3])), { width: 786, height: 3 });
  });

  it('rejects bytes that are not a PNG', () => {
    assert.throws(() => pngSize(new TextEncoder().encode('GIF89a and then some more bytes')), /not a PNG/);
  });
});
