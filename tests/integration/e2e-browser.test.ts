// The collage and the report, rendered and opened in real Chrome (Puppeteer's, on this machine).
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';
import type { Browser } from 'puppeteer';
import { openPage, settle } from '../e2e/browser.ts';
import { BAND_H, LABEL_H, PAD, renderCollage } from '../e2e/collage.ts';
import type { CollageBand, CollageTile } from '../e2e/collage.ts';
import { pngSize } from '../e2e/parity.ts';
import { renderReport } from '../e2e/report.ts';
import { appFunction } from '../support/app.ts';
import { fakeRun, fakeStep, pixels, solidPng } from '../support/e2e.ts';
import type { Rgb } from '../support/e2e.ts';

const BONE: Rgb = [0xf4, 0xf1, 0xe8];

let browser: Browser;
beforeAll(async () => {
  browser = await puppeteer.launch({ headless: true });
});
afterAll(async () => {
  await browser?.close();
});

describe('renderCollage in Chrome', () => {
  const W = 60;
  const H = 100;
  const colours: Rgb[] = [
    [200, 30, 30],
    [30, 160, 60],
    [40, 60, 210],
    [230, 180, 20],
  ];
  const tiles: CollageTile[] = [
    ...colours.map((c, i) => ({ n: i + 1, id: `s${i + 1}`, title: `Screen ${i + 1}`, status: 'pass' as const, png: solidPng(W, H, c) })),
    { n: 5, id: 's5', title: 'Screen 5', status: 'fail' },
  ];
  const page: CollageTile = { n: 1, prefix: 'W', id: 'web/home', title: 'Website: home', status: 'pass', png: solidPng(2 * W, 3 * H, [90, 40, 140]) };
  const bands: CollageBand[] = [
    { title: 'WEBSITE', subtitle: 'the site', box: { width: 2 * W, height: 3 * H }, missing: { width: 2 * W, height: H }, tiles: [page] },
    { title: 'APP', subtitle: 'the app', box: { width: W, height: H }, missing: { width: W, height: H }, tiles },
  ];
  // The collage draws in a Chrome it opens for itself; `opened` keeps each one so a test can see what became of it.
  const opened: Browser[] = [];
  const open = async (): Promise<Browser> => {
    const own = await puppeteer.launch({ headless: true });
    opened.push(own);
    return own;
  };
  const draw = () => renderCollage(open, bands, { title: 't', subtitle: 's' });
  // The three tests after the first read one drawing: the same bands draw the same collage, and each draw opens and
  // shuts a Chrome of its own, the slowest thing in this file (Post-v0.261.6: four launches put the 60-second check
  // at 56 s). The first test draws for itself, to watch its Chrome open and shut.
  let first: ReturnType<typeof draw> | undefined;
  const drawn = () => (first ??= draw());

  it('draws in a Chrome of its own and shuts it, leaving the one already open alone', async () => {
    const before = opened.length;
    const pagesBefore = (await browser.pages()).length;
    await draw();
    assert.equal(opened.length, before + 1, 'one Chrome opened for the collage');
    assert.equal(opened[before]!.connected, false, 'and shut when the collage was drawn');
    assert.equal(browser.connected, true, 'the Chrome already open is still open');
    assert.equal((await browser.pages()).length, pagesBefore, 'and the collage opened no page in it');
  });

  it('draws a PNG exactly the size of its layout', async () => {
    const { png, layout } = await drawn();
    assert.deepEqual(pngSize(png), { width: layout.width, height: layout.height });
  });

  it('places every screenshot pixel for pixel at its slot, unscaled, in its band', async () => {
    const { png, layout } = await drawn();
    const pixelAt = pixels(png);
    const web = layout.bands[0]!.placements[0]!;
    assert.deepEqual([web.shotWidth, web.shotHeight], [2 * W, 3 * H]);
    assert.deepEqual(pixelAt(web.shotX + 2 * W - 1, web.shotY + 3 * H - 1), [90, 40, 140]);
    colours.forEach((c, i) => {
      const p = layout.bands[1]!.placements[i]!;
      for (const [dx, dy] of [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1], [W >> 1, H >> 1]] as const) {
        assert.deepEqual(pixelAt(p.shotX + dx, p.shotY + dy), c, `screen ${i + 1} at +${dx},+${dy}`);
      }
    });
  });

  it('draws each band a title bar, a label over each screen, and a placeholder where one is missing', async () => {
    const { png, layout } = await drawn();
    const pixelAt = pixels(png);
    for (const band of layout.bands) {
      // The bar is ink with bone text: dark at its left edge, and both dark and light inside.
      assert.ok(pixelAt(PAD + 2, band.y + 2).every((v) => v < 60), 'the bar is dark');
      let light = 0;
      for (let x = PAD; x < PAD + 600; x += 3) if (pixelAt(x, band.y + (BAND_H >> 1)).every((v) => v > 180)) light++;
      assert.ok(light > 0, 'the bar has its title in light text');
    }
    const all = layout.bands.flatMap((b) => b.placements);
    for (const [i, p] of all.entries()) {
      let ink = 0;
      for (let y = p.y + 10; y < p.y + LABEL_H - 10; y += 4) {
        for (let x = p.x; x < p.x + p.cellWidth; x += 2) if (pixelAt(x, y).join() !== BONE.join()) ink++;
      }
      assert.ok(ink > 0, `label ${i + 1} has text`);
    }
    const missing = layout.bands[1]!.placements[4]!;
    const centre = pixelAt(missing.shotX + (W >> 1), missing.shotY + (H >> 1));
    assert.ok(!colours.some((c) => c.join() === centre.join()), 'the missing screen shows no other screen');
  });
});

describe('the written report in Chrome', () => {
  it('opens from disk with every image decoded and no request leaving the file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ia-report-'));
    try {
      const file = join(dir, 'index.html');
      const steps = [fakeStep(1), fakeStep(2), fakeStep(3)];
      writeFileSync(file, renderReport(fakeRun(steps)));
      const page = await browser.newPage();
      // Tall enough that no lazy-loaded image is left waiting below the fold.
      await page.setViewport({ width: 1200, height: 10000 });
      const outside: string[] = [];
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url === pathToFileURL(file).href || url.startsWith('data:')) void req.continue();
        else {
          outside.push(url);
          void req.abort();
        }
      });
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      const images = await page.$$eval('figure img', (imgs) =>
        Promise.all(imgs.map((img) => (img as HTMLImageElement).decode().then(() => (img as HTMLImageElement).naturalWidth))),
      );
      assert.equal(images.length, 9);
      assert.ok(images.every((w) => w === 4), `decoded widths ${images.join(',')}`);
      assert.deepEqual(outside, []);

      // Click to zoom reuses the embedded image; clicking the zoomed image closes it.
      await page.click('#step-2 figure img');
      assert.equal(await page.$eval('#zoom', (d) => (d as HTMLDialogElement).open), true);
      assert.match(await page.$eval('#zoom p', (p) => p.textContent ?? ''), /^#02 Angular build$/);
      await page.click('#zoom img');
      assert.equal(await page.$eval('#zoom', (d) => (d as HTMLDialogElement).open), false);
      await page.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('settle in Chrome', () => {
  // settle decides when a step is photographed, and both builds are held to 0% difference, so it must never return while
  // the app is about to change the screen by itself on a timer. The pages here run the app's own code for each such
  // timer, lifted from the built page, so a longer delay in the app turns these red.
  let dir: string;
  let file: string;
  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), 'ia-settle-'));
    file = join(dir, 'tall.html');
    writeFileSync(
      file,
      '<!doctype html><meta charset="utf-8"><body style="margin:0;height:4000px"><button id="a">A</button><button id="b">B</button><div id="toast"></div>',
    );
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  // The app answers every focus change with a one pixel scroll 350 ms later and steps back a frame after
  // (installKeyboardResync, D256). strength/rest-timer and log-session/log-progress flaked on it (found v0.259.0).
  it('returns only after the scroll the app makes on a focus change, and nothing moves after it', async () => {
    const { context, page } = await openPage(browser);
    try {
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      const resync = appFunction('installKeyboardResync').toString();
      await page.evaluate((src) => {
        const w = window as unknown as { scrolls: number[] };
        w.scrolls = [];
        addEventListener('scroll', () => w.scrolls.push(scrollY));
        (0, eval)(`(${src})`)(window);
      }, resync);
      await page.focus('#a');
      await page.focus('#b');
      await settle(page);
      const scrolls = () => page.evaluate(() => [...(window as unknown as { scrolls: number[] }).scrolls, scrollY]);
      // The app's scroll down one pixel and back, then where the page rests: all before settle returned.
      assert.deepEqual(await scrolls(), [1, 0, 0]);
      await new Promise((r) => setTimeout(r, 600));
      assert.deepEqual(await scrolls(), [1, 0, 0]);
    } finally {
      await context.close();
    }
  });

  // A toast stays up 2.2 s (showToast), so a photograph near its end shows it in one build and not the other:
  // log-session/log-effort, two steps after the toast its Log taps raise.
  it('returns only once the toast is down', async () => {
    const { context, page } = await openPage(browser);
    try {
      await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
      const showToast = appFunction('showToast').toString();
      const toastUp = () => page.$eval('#toast', (e) => e.classList.contains('show'));
      await page.evaluate((src) => (0, eval)(`(${src})`)('Logged ✓'), showToast);
      assert.equal(await toastUp(), true);
      await settle(page);
      assert.equal(await toastUp(), false);
    } finally {
      await context.close();
    }
  });
});
