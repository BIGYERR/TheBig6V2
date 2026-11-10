// keyboard-resync: when do two focus changes leave the page one pixel off where it rested? Read-only (measure).
// Found Post-v0.259.0 by the e2e: log-session/log-progress failed parity at 1.562% (20,920 px) with the Angular build's
// Progress page scrolled one CSS pixel down and still there across settle's two-frame check, after the runner already
// waited out each focus change's resync window. The app's resync (installKeyboardResync, D256) answers every focusout,
// 350 ms later, with scrollTo(y±1) and a frame after with scrollTo(y), y read when its timer fires. Two timers that fire
// before the next frame (the same task, or both held behind one long task such as the Progress render) overlap: the
// second reads the first's nudged y as home, and its step back lands on it.
// Usage: node tests/measure/keyboard-resync_latch.ts (IA_APP=<page> for another body). Runs the resync lifted from the
// built page in Puppeteer's Chrome, five trials per case, and prints scrollY 1.2 s after the second focus change. The
// saved .out.txt holds v0.259.1 (the before-picture, the resync as D256 built it) and then v0.259.2's build (D280).
// TypeScript for the harness imports; node runs it with its types stripped. Not in the tests' type check.
import puppeteer from 'puppeteer';
import { readFileSync } from 'node:fs';
import { basename, relative } from 'node:path';
import { APP, REPO, appFunction } from '../support/app.ts';

const src = appFunction('installKeyboardResync').toString();
const HTML = '<!doctype html><body style="margin:0;height:4000px"><button id="a">A</button><button id="b">B</button><button id="c">C</button>';
const CASES: [string, number, number, number][] = [
  ['two focus changes 200 ms apart', 200, 0, 0],
  ['the same, both timers held behind one 300 ms task', 200, 300, 600],
  ['two focus changes 5 ms apart', 5, 0, 0],
  ['two focus changes in one task', 0, 0, 0],
];

const browser = await puppeteer.launch({ headless: true });
const version = /name="ia-version" content="([^"]+)"/.exec(readFileSync(APP, 'utf8'))?.[1] ?? '?';
console.log(`installKeyboardResync from ${APP.startsWith(REPO) ? relative(REPO, APP) : basename(APP)}, ia-version ${version}`);
try {
  for (const [label, gap, from, to] of CASES) {
    const ys: number[] = [];
    for (let i = 0; i < 5; i++) {
      const page = await browser.newPage();
      await page.setContent(HTML);
      ys.push(
        await page.evaluate(
          async (src: string, gap: number, from: number, to: number) => {
            (0, eval)(`(${src})`)(window);
            const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
            const el = (id: string) => document.getElementById(id) as HTMLElement;
            el('a').focus();
            await pause(20);
            const t0 = performance.now();
            el('b').focus(); // a's focusout: a resync due at t0 + 350
            if (gap) await pause(gap);
            el('c').focus(); // b's focusout: a resync due at t0 + gap + 350
            if (to > from) {
              await pause(from - (performance.now() - t0));
              while (performance.now() < t0 + to) {
                // one long task: both timers come due inside it
              }
            }
            await pause(1200);
            return scrollY;
          },
          src,
          gap,
          from,
          to,
        ),
      );
      await page.close();
    }
    console.log(`${label}: scrollY after = ${ys.join(', ')}`);
  }
} finally {
  await browser.close();
}
