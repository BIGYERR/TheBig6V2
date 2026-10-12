// The e2e runner. It runs inside the runner container (npm run e2e starts it; see launch.ts) and shares the web
// container's network, so the app is at http://127.0.0.1, the same secure localhost origin a dev server has.
//
// Three surfaces, the collage's three bands:
//   WEBSITE  the public site the backend serves at /, full height at a desktop and a phone viewport, and the pages it
//            links to on the same host (pages.ts). One target, no parity.
//   ADMIN    the staff admin the backend serves at /admin/: the login, every section after signing in, and the
//            signed out screen, full height at desktop width (pages.ts). One target, no parity.
//   APP      the five app journeys (flow.ts). Two targets run the same steps in separate browser contexts (separate
//            storage): the Angular build at / and the original index.html at /reference/. A step passes when both
//            targets pass its assertions with no console error or uncaught exception, and their screenshots differ by
//            no more than E2E_PARITY_MAX percent of pixels (default 0: clean runs match exactly, and a planted 0.3%
//            title change must fail).
// The backend shares the same network stack, at E2E_BACKEND_URL (default http://127.0.0.1:3000).
//
// Writes to E2E_REPORT_DIR (default e2e/report):
//   index.html    the report, self-contained: every screenshot is embedded, nothing else is referenced
//   collage.png   every screen on one labelled image in three titled bands, numbered as in the report
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import type { Browser, Page } from 'puppeteer';
import { FROZEN_NOW, TIMEZONE, VIEWPORT, openPage } from './browser.ts';
import { renderCollage } from './collage.ts';
import type { CollageBand } from './collage.ts';
import { JOURNEYS, helpers } from './flow.ts';
import type { FlowState, Journey } from './flow.ts';
import { DESKTOP, EXPECTED_STATUS, PAGE_JOURNEYS, PHONE, viewportLabel } from './pages.ts';
import type { PageJourney } from './pages.ts';
import { comparePngs, pngSize } from './parity.ts';
import { externalRefs, renderReport } from './report.ts';
import type { CollageInfo, PageBand, PageStepResult, RunReport, StepResult, TargetResult } from './types.ts';
import { BAND_PREFIX, pageLabel, stepLabel } from './types.ts';
import { semver } from '@ia/core';

const E2E = dirname(fileURLToPath(import.meta.url));
const REPORT = process.env['E2E_REPORT_DIR'] ?? join(E2E, 'report');
const BASE = (process.env['E2E_BASE_URL'] ?? 'http://127.0.0.1').replace(/\/$/, '');
const BACKEND = (process.env['E2E_BACKEND_URL'] ?? 'http://127.0.0.1:3000').replace(/\/$/, '');
const PARITY_MAX = Number(process.env['E2E_PARITY_MAX'] ?? '0');
/** E2E_ONLY=race-10k,log-session runs just those journeys; step numbers stay those of the full suite. */
const ONLY = (process.env['E2E_ONLY'] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

/**
 * Chrome flags for repeatable pixels. Two renders of the same page can otherwise differ by a colour level or two at
 * the edges of composited layers (fixed chips, the rest timer tab), which a 0% parity limit reads as a failure.
 */
const DETERMINISTIC_RENDERING = [
  '--force-color-profile=srgb',
  '--disable-lcd-text',
  '--disable-partial-raster',
  '--run-all-compositor-stages-before-draw',
  '--disable-threaded-animation',
  '--disable-threaded-scrolling',
  '--disable-checker-imaging',
];

type TargetId = 'angular' | 'reference';
const TARGETS: { id: TargetId; path: string }[] = [
  { id: 'angular', path: '/' },
  { id: 'reference', path: '/reference/' },
];

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));
const notRun = (): TargetResult => ({ status: 'skipped', problems: [], warnings: [] });

/**
 * Waits until the page is safe to photograph: web fonts loaded (a late font swap moves every glyph) and the layout
 * still across two consecutive frames (a scroll or reflow in flight would make two identical screens differ).
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(
    () =>
      new Promise<boolean>((resolve) => {
        const snap = () =>
          `${scrollY}|${[...document.querySelectorAll('.overlay.open, .rand-overlay.open')].map((e) => e.scrollTop).join(',')}|${document.body.scrollHeight}`;
        const before = snap();
        requestAnimationFrame(() => requestAnimationFrame(() => resolve(snap() === before)));
      }),
    { timeout: 5000 },
  );
}

/**
 * Runs one journey against one target in a fresh browser context (empty storage), filling in that target's half of
 * the journey's step results. A failed step stops the rest of its journey, never another journey.
 */
async function runJourney(browser: Browser, target: (typeof TARGETS)[number], journey: Journey, results: StepResult[]): Promise<string[]> {
  const { context, page, problems, warnings, blocked } = await openPage(browser);
  const t = helpers(page);
  const state: FlowState = {};
  let broken: string | null = null;
  try {
    await page.goto(BASE + target.path, { waitUntil: 'networkidle0' });
    await t.screen('screenHome');
  } catch (err) {
    broken = `the app did not boot: ${message(err)}`;
  }
  for (const [i, step] of journey.steps.entries()) {
    const r = notRun();
    results[i]![target.id] = r;
    if (broken) {
      if (i === 0) {
        // A boot failure fails the first step, with what the screen showed instead.
        r.status = 'fail';
        r.error = broken;
        r.png = await page.screenshot({ type: 'png' }).catch(() => undefined);
        r.problems = [...problems];
      }
      continue;
    }
    const seenProblems = problems.length;
    const seenWarnings = warnings.length;
    const started = performance.now();
    try {
      await step.run(t, page, state);
      if (step.shot) await page.$eval(step.shot, (e) => e.scrollIntoView({ block: 'center' }));
      await settle(page);
    } catch (err) {
      r.error = message(err);
    }
    try {
      r.png = await page.screenshot({ type: 'png' });
    } catch (err) {
      r.error ??= `the screenshot failed: ${message(err)}`;
    }
    if (!r.error && step.after) {
      try {
        await step.after(t, page, state);
      } catch (err) {
        r.error = `after the screenshot: ${message(err)}`;
      }
    }
    r.ms = Math.round(performance.now() - started);
    r.problems = problems.slice(seenProblems);
    r.warnings = warnings.slice(seenWarnings);
    r.status = r.error || r.problems.length ? 'fail' : 'pass';
    if (r.status === 'fail') broken = `stopped after #${stepLabel(results[i]!.n)} failed`;
  }
  await context.close();
  return blocked;
}

/**
 * Runs one website or admin journey in a fresh browser context at its own viewport, on the real clock. After each
 * step, the page it shows must have answered 200; then the whole page is photographed, top to bottom. A failed step
 * stops the rest of its journey, never another journey.
 */
async function runPageJourney(browser: Browser, journey: PageJourney, results: PageStepResult[]): Promise<string[]> {
  const { context, page, problems, warnings, blocked, documents } = await openPage(browser, {
    viewport: journey.viewport,
    freezeClock: false,
    origin: BACKEND,
    expected: EXPECTED_STATUS,
  });
  // The site fades sections in as they scroll into view; asked for reduced motion it shows them at once, so the one
  // full-page screenshot has every section in it.
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const t = helpers(page);
  const state: FlowState = { base: BACKEND };
  let broken = false;
  for (const [i, step] of journey.steps.entries()) {
    const s = results[i]!;
    const r = s.result;
    if (broken) continue;
    const seenProblems = problems.length;
    const seenWarnings = warnings.length;
    const started = performance.now();
    try {
      await step.run(t, page, state);
      const doc = documents.at(-1);
      if (!doc) throw new Error('no page was loaded');
      if (doc.status !== 200) throw new Error(`${doc.url} answered ${doc.status}, not 200`);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(page);
    } catch (err) {
      r.error = message(err);
    }
    try {
      r.png = await page.screenshot({ type: 'png', fullPage: true });
    } catch (err) {
      r.error ??= `the screenshot failed: ${message(err)}`;
    }
    s.url = page.url();
    r.ms = Math.round(performance.now() - started);
    r.problems = problems.slice(seenProblems);
    r.warnings = warnings.slice(seenWarnings);
    r.status = r.error || r.problems.length ? 'fail' : 'pass';
    s.ok = r.status === 'pass';
    broken = !s.ok;
  }
  await context.close();
  return blocked;
}

/** Prints one line per website or admin step: its verdict, viewport, the page's full size, and why it failed. */
function judgePages(pages: PageStepResult[]): void {
  for (const s of pages) {
    const r = s.result;
    const size = r.png ? pngSize(r.png) : null;
    const why = r.error ?? r.problems[0] ?? (r.status === 'skipped' ? 'not run: an earlier step failed' : '');
    console.log(`  ${s.ok ? 'PASS' : 'FAIL'} #${pageLabel(s)} ${s.journeyId}/${s.id}  ${s.viewport}${size ? `, full page ${size.width}×${size.height}` : ''}${why ? `  ${why}` : ''}`);
  }
}

/** "4/4", how many of `items` passed. */
const tally = (items: { ok: boolean }[]): string => `${items.filter((s) => s.ok).length}/${items.length}`;

/** Fills in each step's parity and verdict, prints one line per step, and returns the worst parity seen. */
function judge(steps: StepResult[]): number | null {
  let worst: number | null = null;
  for (const s of steps) {
    const { angular: a, reference: b } = s;
    s.parity = a.status === 'pass' && b.status === 'pass' && a.png && b.png ? comparePngs(a.png, b.png) : null;
    const pct = s.parity && 'pct' in s.parity ? s.parity.pct : null;
    if (pct !== null) worst = Math.max(worst ?? 0, pct);
    s.ok = a.status === 'pass' && b.status === 'pass' && pct !== null && pct <= PARITY_MAX;
    const why = a.error || b.error || (s.parity && 'error' in s.parity ? s.parity.error : '') || '';
    const px = s.parity && 'pixels' in s.parity ? ` (${s.parity.pixels} px)` : '';
    console.log(`  ${s.ok ? 'PASS' : 'FAIL'} #${stepLabel(s.n)} ${s.journeyId}/${s.id}${pct !== null ? `  parity ${pct.toFixed(3)}%${px}` : ''}${why ? `  ${why}` : ''}`);
  }
  return worst;
}

async function main(): Promise<number> {
  const t0 = performance.now();
  mkdirSync(REPORT, { recursive: true });
  for (const f of ['index.html', 'collage.png']) rmSync(join(REPORT, f), { force: true });

  const served = await (await fetch(BASE + '/')).text();
  // As written ("239" or "0.239.1"), read by @ia/core's semver; 'unknown' only when the page has no meta. A meta that
  // is not a version fails the run.
  const version = /<meta name="ia-version"/.test(served) ? String(semver.fromHtml(served)) : 'unknown';
  const sourceSha256 = served.match(/sha256 ([0-9a-f]{64})/)?.[1];

  // Chrome's sandbox needs kernel namespaces that Docker's default profile withholds. The container is the boundary
  // here, and the browser only ever loads this app and its web font.
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', ...DETERMINISTIC_RENDERING] });
  try {
    const browserVersion = await browser.version();
    const every = [...PAGE_JOURNEYS, ...JOURNEYS].map((j) => j.id);
    const unknown = ONLY.filter((id) => !every.includes(id));
    if (unknown.length) throw new Error(`E2E_ONLY names no journey: ${unknown.join(', ')} (journeys: ${every.join(', ')})`);
    // Website and admin steps are numbered within their band (W01, A01), counting every journey so E2E_ONLY keeps them.
    const pageJourneys = new Map<PageJourney, PageStepResult[]>();
    const pages: PageStepResult[] = [];
    const counted: Record<PageBand, number> = { website: 0, admin: 0 };
    for (const journey of PAGE_JOURNEYS) {
      const first = counted[journey.band];
      counted[journey.band] += journey.steps.length;
      if (ONLY.length && !ONLY.includes(journey.id)) continue;
      const own = journey.steps.map((s, i) => ({
        band: journey.band,
        n: first + i + 1,
        journeyId: journey.id,
        journey: journey.name,
        id: s.id,
        page: s.page,
        viewport: viewportLabel(journey.viewport),
        result: notRun(),
        ok: false,
      }));
      pageJourneys.set(journey, own);
      pages.push(...own);
    }
    const byJourney = new Map<Journey, StepResult[]>();
    const steps: StepResult[] = [];
    let numbered = 0;
    for (const journey of JOURNEYS) {
      const first = numbered;
      numbered += journey.steps.length;
      if (ONLY.length && !ONLY.includes(journey.id)) continue;
      const own = journey.steps.map((s, i) => ({
        n: first + i + 1,
        journeyId: journey.id,
        journey: journey.name,
        id: s.id,
        page: s.page,
        angular: notRun(),
        reference: notRun(),
        parity: null,
        ok: false,
      }));
      byJourney.set(journey, own);
      steps.push(...own);
    }
    const blocked: string[] = [];
    for (const [journey, results] of pageJourneys) {
      console.log(`e2e: ${journey.band} at ${BACKEND}: ${journey.name} (${viewportLabel(journey.viewport)})`);
      blocked.push(...(await runPageJourney(browser, journey, results)));
    }
    for (const target of TARGETS) {
      for (const [journey, results] of byJourney) {
        console.log(`e2e: ${target.id} at ${BASE}${target.path}: ${journey.name}`);
        blocked.push(...(await runJourney(browser, target, journey, results)));
      }
    }
    judgePages(pages);
    const worst = judge(steps);
    const passed = steps.filter((s) => s.ok).length + pages.filter((s) => s.ok).length;
    const total = steps.length + pages.length;
    const website = pages.filter((s) => s.band === 'website');
    const admin = pages.filter((s) => s.band === 'admin');
    const byBand = `website ${tally(website)}, admin ${tally(admin)}, app ${tally(steps)}`;
    const ranAt = new Date().toISOString();

    let collage: CollageInfo | null = null;
    let collageError: string | null = null;
    try {
      const first = steps.find((s) => s.angular.png)?.angular.png;
      const shot = first ? pngSize(first) : { width: VIEWPORT.width * VIEWPORT.deviceScaleFactor, height: VIEWPORT.height * VIEWPORT.deviceScaleFactor };
      const pageTiles = (band: PageStepResult[]) =>
        band.map((s) => ({
          n: s.n,
          prefix: BAND_PREFIX[s.band],
          id: `${s.journeyId}/${s.id}`,
          title: s.page,
          status: s.ok ? ('pass' as const) : s.result.status === 'skipped' ? ('skipped' as const) : ('fail' as const),
          png: s.result.png,
        }));
      const all: CollageBand[] = [
        {
          title: 'WEBSITE',
          subtitle: `the public site at / and the pages it links to, full height · desktop ${viewportLabel(DESKTOP)}, phone ${viewportLabel(PHONE)} · served by the backend`,
          // A full-height page is drawn at its native size up to this tall; a longer one is scaled down to fit.
          box: { width: DESKTOP.width, height: 14000 },
          missing: { width: DESKTOP.width, height: DESKTOP.height },
          // A phone page is 393 wide; its label gets room for the whole title and its PASS or FAIL chip.
          labelMin: 1100,
          tiles: pageTiles(website),
        },
        {
          title: 'ADMIN',
          subtitle: `the staff admin at /admin/: login, every section, signed out · full height · ${viewportLabel(DESKTOP)}`,
          box: { width: DESKTOP.width, height: 4000 },
          missing: { width: DESKTOP.width, height: DESKTOP.height },
          tiles: pageTiles(admin),
        },
        {
          title: 'APP',
          subtitle: `the Angular build through every journey, 0% parity against the original index.html · ${VIEWPORT.width}×${VIEWPORT.height} @${VIEWPORT.deviceScaleFactor}x`,
          box: shot,
          missing: shot,
          tiles: steps.map((s) => ({
            n: s.n,
            id: `${s.journeyId}/${s.id}`,
            title: s.page,
            status: s.ok ? ('pass' as const) : s.angular.status === 'skipped' ? ('skipped' as const) : ('fail' as const),
            png: s.angular.png,
          })),
        },
      ];
      const bands = all.filter((b) => b.tiles.length);
      const subtitle =
        `${semver.tag(version)} · ${passed}/${total} steps passed: ${byBand} · ${ranAt.slice(0, 16).replace('T', ' ')} UTC · ` +
        `source sha256 ${(sourceSha256 ?? 'unknown').slice(0, 12)}`;
      const { png, layout } = await renderCollage(browser, bands, { title: 'IRON ASYLUM e2e screens', subtitle });
      writeFileSync(join(REPORT, 'collage.png'), png);
      collage = {
        file: 'collage.png',
        width: layout.width,
        height: layout.height,
        screens: bands.reduce((n, b) => n + b.tiles.length, 0),
        bands: bands.map((b) => ({ title: b.title, screens: b.tiles.length })),
      };
    } catch (err) {
      collageError = message(err);
      console.error(`e2e: the collage failed: ${collageError}`);
    }

    const report: RunReport = {
      ok: steps.every((s) => s.ok) && pages.every((s) => s.ok) && !collageError,
      steps,
      pages,
      version,
      sourceSha256,
      baseUrl: BASE,
      backendUrl: BACKEND,
      browserVersion,
      viewport: VIEWPORT,
      frozenNow: FROZEN_NOW,
      timezone: TIMEZONE,
      parityMaxPct: PARITY_MAX,
      worstParityPct: worst,
      blocked,
      ranAt,
      durationMs: performance.now() - t0,
      collage,
    };
    const html = renderReport(report);
    const external = externalRefs(html);
    if (external.length) throw new Error(`the report is not self-contained; it references ${external.slice(0, 5).join(', ')}`);
    writeFileSync(join(REPORT, 'index.html'), html);
    const mb = (bytes: number) => (bytes / 1e6).toFixed(1);
    console.log(`e2e: ${passed}/${total} steps passed (${byBand}); report index.html (${mb(Buffer.byteLength(html))} MB)` +
      (collage ? `, collage.png ${collage.width}×${collage.height}` : ''));
    return report.ok ? 0 : 1;
  } finally {
    await browser.close();
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    console.error(`e2e: ${message(err)}`);
    process.exitCode = 1;
  },
);
