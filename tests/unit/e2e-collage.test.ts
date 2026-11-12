import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import {
  BAND_GAP,
  BAND_H,
  CAPTURE_LIMIT_MS,
  CAPTURE_TRIES,
  SHUT_LIMIT_MS,
  captureLimitMessage,
  COLOURS,
  EDGE,
  FLAG,
  GAP,
  HEADER_H,
  LABEL_H,
  LABEL_MIN_W,
  PAD,
  bandsHtml,
  collageLayout,
  composeCollage,
  fitShot,
  headerHtml,
  labelsHtml,
  withFreshBrowser,
  withLimit,
} from '../e2e/collage.ts';
import type { CollageLayout, CollageTile, LayoutBand, Placement, Size } from '../e2e/collage.ts';
import { pngSize } from '../e2e/parity.ts';
import { externalRefs } from '../e2e/report.ts';
import { pixels, solidPng } from '../support/e2e.ts';

/** The app band's real shape: screens of 393×852 @2x. */
const W = 786;
const H = 1704;
const APP: Size = { width: W, height: H };
const appBand = (count: number): LayoutBand => ({ box: APP, missing: APP, shots: Array.from({ length: count }, () => APP) });

/** The real suite: the website (two full-height homes, two short linked pages), six admin pages, 46 app screens. */
const SUITE: LayoutBand[] = [
  {
    box: { width: 1440, height: 14000 },
    missing: { width: 1440, height: 900 },
    labelMin: 1100,
    shots: [
      { width: 1440, height: 10542 },
      { width: 393, height: 13266 },
      { width: 393, height: 852 },
      { width: 393, height: 852 },
    ],
  },
  { box: { width: 1440, height: 4000 }, missing: { width: 1440, height: 900 }, shots: Array.from({ length: 6 }, () => ({ width: 1440, height: 900 })) },
  appBand(46),
];

const bottom = (p: Placement) => p.shotY + p.shotHeight;
const right = (p: Placement) => p.x + Math.max(p.cellWidth, p.shotWidth);

describe('fitShot', () => {
  it('keeps a screenshot that fits at its native size, and never scales one up', () => {
    assert.deepEqual(fitShot({ width: 1440, height: 10542 }, { width: 1440, height: 14000 }), { width: 1440, height: 10542 });
    assert.deepEqual(fitShot({ width: 20, height: 30 }, { width: 1440, height: 4000 }), { width: 20, height: 30 });
  });

  it('scales a page too tall for its box down to fit, keeping its shape, never cropping it', () => {
    const fit = fitShot({ width: 1440, height: 20000 }, { width: 1440, height: 10000 });
    assert.deepEqual(fit, { width: 720, height: 10000 });
    const wide = fitShot({ width: 3000, height: 900 }, { width: 1440, height: 4000 });
    assert.equal(wide.width, 1440);
    assert.equal(wide.height, 432);
  });
});

describe('collageLayout: one band of app screens', () => {
  const layout = collageLayout([appBand(19)]);
  const band = layout.bands[0]!;

  it('fits every screen with no empty row', () => {
    assert.ok(band.cols * band.rows >= 19);
    assert.ok(band.cols * (band.rows - 1) < 19);
    assert.equal(band.placements.length, 19);
  });

  it('keeps every screen and its label inside the canvas margins, at native size', () => {
    for (const p of band.placements) {
      assert.ok(p.x >= PAD && p.y >= PAD + HEADER_H + BAND_GAP + BAND_H);
      assert.equal(p.shotX, p.x);
      assert.equal(p.shotY, p.y + LABEL_H);
      assert.deepEqual([p.shotWidth, p.shotHeight, p.cellWidth], [W, H, W]);
      assert.ok(p.shotX + W <= layout.width - PAD);
      assert.ok(p.shotY + H <= layout.height - PAD);
    }
  });

  it('reads left to right, then top to bottom', () => {
    for (let i = 1; i < band.placements.length; i++) {
      const prev = band.placements[i - 1]!;
      const cur = band.placements[i]!;
      if (i % band.cols === 0) assert.ok(cur.y > prev.y && cur.x === PAD, `screen ${i + 1} starts a new row`);
      else assert.ok(cur.y === prev.y && cur.x === prev.x + W + GAP, `screen ${i + 1} follows on the same row`);
    }
  });

  it('takes more columns for a wider target shape', () => {
    assert.ok(collageLayout([appBand(19)], 2.5).bands[0]!.cols > collageLayout([appBand(19)], 0.4).bands[0]!.cols);
  });

  it('handles a single screen and refuses an empty band or no bands', () => {
    const one = collageLayout([appBand(1)]);
    assert.equal(one.bands[0]!.cols, 1);
    assert.equal(one.bands[0]!.rows, 1);
    assert.throws(() => collageLayout([appBand(0)]), RangeError);
    assert.throws(() => collageLayout([]), RangeError);
  });
});

describe('collageLayout: the suite in three bands', () => {
  const layout = collageLayout(SUITE);
  const [website, admin, app] = layout.bands;

  it('keeps the app band the grid it has on its own: 46 screens, 11 across', () => {
    assert.equal(app!.cols, collageLayout([appBand(46)]).bands[0]!.cols);
    assert.equal(app!.cols, 11);
    assert.equal(layout.contentWidth, 11 * W + 10 * GAP);
  });

  it('stacks the bands top to bottom, each bar above its own tiles and below everything before it', () => {
    let floor = PAD + HEADER_H;
    for (const band of layout.bands) {
      assert.ok(band.y >= floor + BAND_GAP, `a band starts ${BAND_GAP} px below what came before`);
      for (const p of band.placements) assert.ok(p.y >= band.y + BAND_H + GAP, 'tiles sit under their bar');
      floor = Math.max(...band.placements.map(bottom));
    }
    assert.equal(layout.height, floor + PAD);
  });

  it('draws every page at its native size when it fits its band, and gives a narrow one a label wide enough to read', () => {
    assert.deepEqual(
      website!.placements.map((p) => [p.shotWidth, p.shotHeight, p.cellWidth]),
      [
        [1440, 10542, 1440],
        [393, 13266, 1100],
        [393, 852, 1100],
        [393, 852, 1100],
      ],
    );
    const plain = collageLayout([{ box: APP, missing: APP, shots: [{ width: 393, height: 852 }] }]).bands[0]!.placements[0]!;
    assert.equal(plain.cellWidth, LABEL_MIN_W, 'with no minimum of its own, a band\'s labels are an app screen wide');
    assert.equal(website!.rows, 1, 'the website fits on one row');
    assert.equal(admin!.rows, 1, 'all six admin pages fit on one row');
    assert.ok(admin!.placements.every((p) => p.shotWidth === 1440 && p.shotHeight === 900));
  });

  it('scales a page taller than its band allows down to fit, whole', () => {
    const tall = collageLayout([{ box: { width: 1440, height: 5000 }, missing: { width: 1440, height: 900 }, shots: [{ width: 1440, height: 10000 }] }]);
    const p = tall.bands[0]!.placements[0]!;
    assert.deepEqual([p.shotWidth, p.shotHeight], [720, 5000]);
  });

  it('never overlaps two cells, in any band, and keeps every one inside the margins', () => {
    const all = layout.bands.flatMap((b) => b.placements);
    for (const p of all) assert.ok(p.x >= PAD && right(p) <= layout.width - PAD && bottom(p) <= layout.height - PAD);
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        const a = all[i]!;
        const b = all[j]!;
        const apart = right(a) + GAP <= b.x || right(b) + GAP <= a.x || bottom(a) + GAP <= b.y || bottom(b) + GAP <= a.y;
        assert.ok(apart, `cells ${i + 1} and ${j + 1} overlap`);
      }
    }
  });

  it('wraps a band to a new row when its tiles do not fit the width', () => {
    const narrow = collageLayout([appBand(2), appBand(3)], 0.01);
    const second = narrow.bands[1]!;
    assert.equal(narrow.contentWidth, W, 'one app screen across');
    assert.equal(second.rows, 3);
    assert.ok(second.placements.every((p) => p.x === PAD));
  });

  it('asks Chrome for nothing bigger than it can capture: the header and bars are as wide as the collage, the labels one tall column', () => {
    assert.ok(layout.width <= 16384, `header ${layout.width} wide`);
    const tiles = SUITE.reduce((n, b) => n + b.shots.length, 0);
    assert.ok(tiles * LABEL_H <= 16384, `labels ${tiles * LABEL_H} tall`);
    assert.ok(SUITE.length * BAND_H <= 16384);
  });
});

describe('headerHtml, bandsHtml and labelsHtml', () => {
  const tiles: CollageTile[] = [
    { n: 1, id: 'strength/home-empty', title: 'Programs (first launch)', status: 'pass' },
    { n: 2, id: 'strength/wizard-goal', title: 'New program: <goal>', status: 'fail' },
    { n: 3, id: 'race-10k/race-day', title: 'Race: race day', status: 'skipped' },
    { n: 2, prefix: 'W', id: 'website-phone/site-home-phone', title: 'Website: home, phone', status: 'pass' },
  ];
  const labels = labelsHtml(tiles, 1440, [786, 786, 786, 1440]);

  it('labels each screen with its number, title, journey/step id and status', () => {
    for (const text of ['#01', '#02', '#03', '#W02', 'Programs (first launch)', 'strength/home-empty', 'race-10k/race-day', 'PASS', 'FAIL', 'NOT RUN']) {
      assert.ok(labels.includes(text), text);
    }
    assert.ok(labels.includes('New program: &lt;goal&gt;'));
  });

  it('keeps the chip out of the id text, so a long id is cut short and its PASS or FAIL still shows', () => {
    assert.ok(labels.includes('<span class="sid">website-phone/site-home-phone</span><span class="chip">PASS</span>'));
    assert.match(labels, /\.sid\{min-width:0;overflow:hidden;text-overflow:ellipsis/);
    assert.match(labels, /\.chip\{flex:none/);
  });

  it('stacks the labels one LABEL_H band apart, in tile order, each as wide as its cell', () => {
    assert.deepEqual([...labels.matchAll(/class="label [a-z]+" style="top:(\d+)px;width:(\d+)px/g)].map((m) => [Number(m[1]), Number(m[2])]), [
      [0, 786],
      [LABEL_H, 786],
      [2 * LABEL_H, 786],
      [3 * LABEL_H, 1440],
    ]);
    assert.ok(labels.includes(`width:1440px;height:${4 * LABEL_H}px`));
  });

  it('gives each band a bar with its title, its pass count and what it shows, escaped, stacked BAND_H apart', () => {
    const bars = bandsHtml(
      [
        { title: 'WEBSITE', subtitle: 'the site <at> /', tiles: [tiles[0]!, tiles[3]!] },
        { title: 'APP', subtitle: 'every journey', tiles },
      ],
      9000,
    );
    assert.ok(bars.includes('<h2>WEBSITE</h2><span class="count">2/2 passed</span><p>the site &lt;at&gt; /</p>'));
    assert.ok(bars.includes('<h2>APP</h2><span class="count">2/4 passed</span>'));
    assert.match(bars, /class="band pass" style="top:0px;width:9000px/);
    assert.match(bars, new RegExp(`class="band fail" style="top:${BAND_H}px;width:9000px`));
    assert.ok(bars.includes(`width:9000px;height:${2 * BAND_H}px`));
  });

  it('puts the title and the run line in the header, escaped', () => {
    const head = headerHtml({ title: 'IRON ASYLUM e2e screens', subtitle: 'V239 <x>' }, 5000);
    assert.ok(head.includes('IRON <span>ASYLUM e2e screens</span>'));
    assert.ok(head.includes('V239 &lt;x&gt;'));
    assert.ok(head.includes(`width:5000px;height:${HEADER_H}px`));
  });

  it('loads nothing from outside the page', () => {
    assert.deepEqual(externalRefs(labels), []);
    assert.deepEqual(externalRefs(headerHtml({ title: 't', subtitle: 's' }, 100)), []);
    assert.deepEqual(externalRefs(bandsHtml([{ title: 't', subtitle: 's', tiles }], 100)), []);
  });
});

describe('composeCollage', () => {
  const W = 20;
  const H = 30;
  // A screenshot whose every pixel is unique, so a shift or a scale of one pixel shows.
  const gradient = solidPng(W, H, [0, 0, 0], (x, y) => [x * 10, y * 8, 77]);
  // Twice as tall as its band's box allows: top half red, bottom half blue, so a scale shows in where the halves meet.
  const tall = solidPng(10, 2 * H, [200, 0, 0], (_x, y) => (y < H ? undefined : [0, 0, 200]));
  const bands: { tiles: CollageTile[] }[] = [
    {
      tiles: [
        { n: 1, prefix: 'W', id: 'w/one', title: 'Tall', status: 'pass', png: tall },
        { n: 2, prefix: 'W', id: 'w/two', title: 'Missing', status: 'fail' },
      ],
    },
    {
      tiles: [
        { n: 1, id: 'a/one', title: 'One', status: 'pass', png: gradient },
        { n: 2, id: 'a/two', title: 'Two', status: 'fail', png: solidPng(W, H, [30, 160, 60]) },
        { n: 3, id: 'a/three', title: 'Three', status: 'skipped' },
      ],
    },
  ];
  const box: Size = { width: W, height: H };
  const layout: CollageLayout = collageLayout([
    { box, missing: { width: 12, height: 14 }, shots: [{ width: 10, height: 2 * H }, undefined] },
    { box, missing: box, shots: [box, box, undefined] },
  ]);
  const header = solidPng(layout.width, HEADER_H, [10, 20, 30]);
  const bars = solidPng(layout.contentWidth, 2 * BAND_H, [0, 0, 0], (_x, y) => [0, Math.floor(y / BAND_H) * 60 + 90, 0]);
  const labels = solidPng(LABEL_MIN_W, 5 * LABEL_H, [0, 0, 0], (_x, y) => [Math.floor(y / LABEL_H) * 40 + 40, 0, 0]);
  const png = composeCollage(layout, header, bars, labels, bands);
  const at = pixels(png);
  const read = pixels(gradient);
  const [first, second] = layout.bands;

  it('is exactly the size of its layout', () => {
    assert.deepEqual(pngSize(png), { width: layout.width, height: layout.height });
  });

  it('copies a screenshot that fits pixel for pixel, unscaled, at its slot', () => {
    const p = second!.placements[0]!;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) assert.deepEqual(at(p.shotX + x, p.shotY + y), read(x, y), `pixel ${x},${y}`);
  });

  it('scales a screenshot too tall for its box down to fit, whole: both halves in, at half size', () => {
    const p = first!.placements[0]!;
    assert.deepEqual([p.shotWidth, p.shotHeight], [5, H]);
    assert.deepEqual(at(p.shotX, p.shotY), [200, 0, 0]);
    assert.deepEqual(at(p.shotX + 4, p.shotY + H / 2 - 1), [200, 0, 0]);
    assert.deepEqual(at(p.shotX, p.shotY + H / 2), [0, 0, 200]);
    assert.deepEqual(at(p.shotX + 4, p.shotY + H - 1), [0, 0, 200]);
    assert.deepEqual(at(p.shotX + 5 + EDGE, p.shotY), [...COLOURS.bone], 'nothing drawn past its scaled width but the edge');
  });

  it('puts each band bar at its band, and each label over its own screen, counting through every band', () => {
    assert.deepEqual(at(PAD, first!.y), [0, 90, 0]);
    assert.deepEqual(at(layout.width - PAD - 1, second!.y + BAND_H - 1), [0, 150, 0]);
    const all = layout.bands.flatMap((b) => b.placements);
    for (const [i, p] of all.entries()) assert.deepEqual(at(p.x, p.y), [i * 40 + 40, 0, 0], `label ${i + 1}`);
  });

  it('puts the header strip under the top margin, on a bone background', () => {
    assert.deepEqual(at(0, 0), [...COLOURS.bone]);
    assert.deepEqual(at(0, PAD), [10, 20, 30]);
    assert.deepEqual(at(layout.width - 1, PAD + HEADER_H - 1), [10, 20, 30]);
  });

  it('edges a passing screen with a hairline and frames the others in red', () => {
    const [pass, fail, skipped] = second!.placements;
    assert.deepEqual(at(pass!.shotX - 1, pass!.shotY), [...COLOURS.edge]);
    assert.deepEqual(at(pass!.shotX - EDGE - 1, pass!.shotY), [...COLOURS.bone]);
    assert.deepEqual(at(fail!.shotX - FLAG, fail!.shotY + 5), [...COLOURS.flag]);
    assert.deepEqual(at(skipped!.shotX + W, skipped!.shotY + H + FLAG - 1), [...COLOURS.flag]);
  });

  it('leaves a plain placeholder of the band size where a screenshot is missing', () => {
    const p = second!.placements[2]!;
    assert.deepEqual(at(p.shotX + (W >> 1), p.shotY + (H >> 1)), [...COLOURS.missing]);
    const q = first!.placements[1]!;
    assert.deepEqual([q.shotWidth, q.shotHeight], [12, 14]);
    assert.deepEqual(at(q.shotX + 11, q.shotY + 13), [...COLOURS.missing]);
  });

  it('refuses tiles that do not match the layout', () => {
    assert.throws(() => composeCollage(layout, header, bars, labels, [bands[0]!, { tiles: bands[1]!.tiles.slice(0, 2) }]), RangeError);
    assert.throws(() => composeCollage(layout, header, bars, labels, [bands[0]!]), RangeError);
  });
});

describe('the collage is drawn in a Chrome of its own, and a hung capture is tried again in another', () => {
  // Three times a pull request run passed every step and then hung a collage capture (PR #10, Post-v0.254.0; v0.259.4's
  // PR, Post-v0.259.4; v0.261.5's, Post-v0.261.5). The third time both tries hung on a fresh page of one Chrome.
  const never = () => new Promise<never>(() => undefined);
  type Fake = { id: number; shut: boolean };

  /** A fake launcher: browsers numbered in the order they open, and a log of what happened, in order. */
  const fakes = () => {
    const log: string[] = [];
    let id = 0;
    const open = async (): Promise<Fake> => {
      id += 1;
      log.push(`open ${id}`);
      return { id, shut: false };
    };
    const shut = async (b: Fake): Promise<void> => {
      b.shut = true;
      log.push(`shut ${b.id}`);
    };
    return { log, open, shut };
  };

  it('limits each capture to 30 s, tries the collage three times, and gives a browser 5 s to close', () => {
    assert.equal(CAPTURE_LIMIT_MS, 30_000);
    assert.equal(CAPTURE_TRIES, 3);
    assert.equal(SHUT_LIMIT_MS, 5_000);
  });

  it('names the capture and the try when a capture passes its limit', () => {
    assert.equal(captureLimitMessage('header', 3), "the collage's header capture took over 30 s (try 3 of 3, each in a Chrome of its own)");
    assert.equal(captureLimitMessage('band bars', 1), "the collage's band bars capture took over 30 s (try 1 of 3, each in a Chrome of its own)");
  });

  it('withLimit gives the work its result inside the limit, and its own error', async () => {
    assert.equal(await withLimit(Promise.resolve('png'), 20, 'too slow'), 'png');
    await assert.rejects(withLimit(Promise.reject(new Error('Target closed')), 20, 'too slow'), { message: 'Target closed' });
  });

  it('withLimit abandons work that passes its limit, with the message it was given', async () => {
    await assert.rejects(withLimit(never(), 20, 'the header capture took over 0.02 s'), { message: 'the header capture took over 0.02 s' });
  });

  it('opens one browser, uses it and shuts it when the first try succeeds', async () => {
    const { log, open, shut } = fakes();
    const got = await withFreshBrowser(open, shut, async (b, n) => {
      log.push(`use ${b.id} try ${n}`);
      return 'png';
    }, 3);
    assert.equal(got, 'png');
    assert.deepEqual(log, ['open 1', 'use 1 try 1', 'shut 1']);
  });

  it('shuts the browser of a try whose capture hung, and the next try draws in another', async () => {
    const { log, open, shut } = fakes();
    const got = await withFreshBrowser(open, shut, (b, n) => {
      log.push(`use ${b.id} try ${n}`);
      return withLimit(b.id === 1 ? never() : Promise.resolve('png'), 20, 'hung');
    }, 3);
    assert.equal(got, 'png');
    assert.deepEqual(log, ['open 1', 'use 1 try 1', 'shut 1', 'open 2', 'use 2 try 2', 'shut 2']);
  });

  it('tries again in another browser after a try that throws', async () => {
    const { log, open, shut } = fakes();
    const got = await withFreshBrowser(open, shut, async (b) => {
      if (b.id < 3) throw new Error('Target closed');
      return 'png';
    }, 3);
    assert.equal(got, 'png');
    assert.deepEqual(log, ['open 1', 'shut 1', 'open 2', 'shut 2', 'open 3', 'shut 3']);
  });

  it('tries again when a browser does not open, with nothing to shut', async () => {
    const { log, shut } = fakes();
    let n = 0;
    const open = async (): Promise<Fake> => {
      n += 1;
      if (n === 1) throw new Error('Failed to launch the browser process');
      log.push(`open ${n}`);
      return { id: n, shut: false };
    };
    assert.equal(await withFreshBrowser(open, shut, async () => 'png', 3), 'png');
    assert.deepEqual(log, ['open 2', 'shut 2']);
  });

  it('still fails with the last error, every browser shut, when every try hangs', async () => {
    const { log, open, shut } = fakes();
    await assert.rejects(
      withFreshBrowser(open, shut, (_b, n) => withLimit(never(), 20, `hung on try ${n}`), 3),
      { message: 'hung on try 3' },
    );
    assert.deepEqual(log, ['open 1', 'shut 1', 'open 2', 'shut 2', 'open 3', 'shut 3']);
  });

  it('keeps the result of a try whose browser would not shut', async () => {
    const { open } = fakes();
    const shut = async (): Promise<void> => {
      throw new Error('the browser would not close');
    };
    assert.equal(await withFreshBrowser(open, shut, async () => 'png', 3), 'png');
  });
});
