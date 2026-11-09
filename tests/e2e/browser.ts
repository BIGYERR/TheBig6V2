// Page setup shared by every e2e target: an iPhone-sized viewport, a frozen clock, a seeded Math.random,
// no animations, no outbound feedback form, and every console error and uncaught exception recorded.
// The website and admin pages (pages.ts) pass their own viewport, keep the real clock (the admin compares times with
// a live server), and also fail on any same-origin HTTP error they were not told to expect.
import type { Browser, BrowserContext, Page } from 'puppeteer';
import type { Viewport } from './types.ts';

/** The moment every run happens at: a Wednesday, so a rest day can be "today" (future rest days are inert). */
export const FROZEN_NOW = '2026-10-07T07:30:00-04:00';
export const TIMEZONE = 'America/New_York';
/**
 * The sessionStorage key a relaunch on a later day leaves its moment under (flow.ts, relaunchOn): a reload keeps it in the
 * tab, and the app never reads sessionStorage. installDeterminism spells it out, since it runs in the page.
 */
export const LATER_NOW_KEY = 'e2e-now';
export const VIEWPORT: Viewport = { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

/** Requests the suite must never send. The bug form posts to Web3Forms; a test must not file a real report. */
const BLOCKED_HOSTS = ['api.web3forms.com'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/** Console messages that are expected on every load and say nothing about the app under test. */
const BENIGN_CONSOLE = [/apple-mobile-web-app-capable.*is deprecated/];

/**
 * How long after a focus change the page may still move by itself. The app answers every focusout with a scroll of one
 * pixel 350 ms later and steps back a frame after (installKeyboardResync, D256: iOS leaves fixed elements adrift once
 * the keyboard closes), so a photograph taken inside that window shows the whole screen one pixel off, and a 0% parity
 * limit fails it (strength/rest-timer and log-session/log-progress, found v0.259.0). The window's own timer runs out
 * after the app's, which the browser fires first by its earlier deadline. Two resyncs that fire before the same frame
 * leave the page one pixel off for good, which no wait can undo: that one is the app's (handoff §12,
 * tests/measure/keyboard-resync_latch.ts).
 */
export const FOCUS_QUIET_MS = 400;

/** Runs inside the page before any of its scripts, so it must not reference anything from this module. */
function installDeterminism(frozenIso: string | null, focusQuietMs: number): void {
  if (frozenIso !== null) {
    const later = Number(sessionStorage.getItem('e2e-now'));
    const fixed = later || new Date(frozenIso).getTime();
    const RealDate = Date;
    class FrozenDate extends RealDate {
      constructor(...args: unknown[]) {
        super(...((args.length ? args : [fixed]) as [number]));
      }
      static override now(): number {
        return fixed;
      }
    }
    window.Date = FrozenDate as unknown as DateConstructor;
  }
  let seed = 0x1a5e;
  Math.random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const freezeMotion = () => {
    const style = document.createElement('style');
    style.dataset['e2e'] = 'no-motion';
    style.textContent = '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}';
    document.head.appendChild(style);
  };
  if (document.head) freezeMotion();
  else document.addEventListener('DOMContentLoaded', freezeMotion, { once: true });
  // Every focus change opens a window in which the app may still scroll by itself (FOCUS_QUIET_MS); settle waits until
  // all of them have closed. Listening on the window's capture phase, before any page script, sees every focusout.
  let focusWindows = 0;
  window.addEventListener(
    'focusout',
    () => {
      focusWindows++;
      setTimeout(() => focusWindows--, focusQuietMs);
    },
    true,
  );
  Object.defineProperty(window, '__e2eFocusWindows', { get: () => focusWindows });
}

/**
 * Waits until the page is safe to photograph: web fonts loaded (a late font swap moves every glyph), no toast up (the
 * app takes each one down 2.2 s after it shows, so a photograph near that moment shows it in one build and not the
 * other: log-session/log-effort, two steps after the toast its Log taps raise), no focus change still inside the window
 * in which the app scrolls by itself (FOCUS_QUIET_MS), and the layout still across two consecutive frames (a scroll or
 * reflow in flight would make two identical screens differ).
 */
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForFunction(() => !document.getElementById('toast')?.classList.contains('show'), { timeout: 5000 });
  await page.waitForFunction(() => !(window as unknown as { __e2eFocusWindows?: number }).__e2eFocusWindows, { timeout: 5000 });
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

export interface OpenedPage {
  context: BrowserContext;
  page: Page;
  /** Console errors, uncaught exceptions and failed requests: any of these fails the step it happened in. */
  problems: string[];
  /** Failures that do not fail a step (the web font host being unreachable). */
  warnings: string[];
  /** Requests the suite stopped before they left the browser. */
  blocked: string[];
  /** Every page the main frame loaded, with the status it answered, oldest first. */
  documents: { url: string; status: number }[];
}

export interface PageOptions {
  /** Default: the iPhone viewport the app journeys use. */
  viewport?: Viewport;
  /** Default true: Date frozen at FROZEN_NOW. */
  freezeClock?: boolean;
  /** When set, any response from this origin with a 4xx or 5xx status is a problem, unless `expected` allows it. */
  origin?: string;
  /** A same-origin error status the page is meant to get (the admin asking who is signed in, before anyone is). */
  expected?: (url: string, status: number) => boolean;
}

/** Chrome's own console line for a response with an error status; the URL is in the message's location. */
const FAILED_LOAD = /^Failed to load resource: the server responded with a status of (\d+)/;

/** Opens a page in its own browser context, so each target starts with empty storage. */
export async function openPage(browser: Browser, options: PageOptions = {}): Promise<OpenedPage> {
  const { viewport = VIEWPORT, freezeClock = true, origin, expected } = options;
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const problems: string[] = [];
  const warnings: string[] = [];
  const blocked: string[] = [];
  const documents: { url: string; status: number }[] = [];
  await page.emulateTimezone(TIMEZONE);
  await page.setViewport(viewport);
  await page.evaluateOnNewDocument(installDeterminism, freezeClock ? FROZEN_NOW : null, FOCUS_QUIET_MS);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const host = new URL(req.url()).hostname;
    if (BLOCKED_HOSTS.includes(host)) {
      blocked.push(req.url());
      void req.abort('blockedbyclient');
    } else {
      void req.continue();
    }
  });
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    if (BENIGN_CONSOLE.some((re) => re.test(msg.text()))) return;
    const status = FAILED_LOAD.exec(msg.text())?.[1];
    if (status && expected?.(msg.location().url ?? '', Number(status))) return;
    problems.push(`console.error: ${msg.text()}`);
  });
  page.on('response', (res) => {
    const req = res.request();
    if (req.isNavigationRequest() && res.frame() === page.mainFrame()) documents.push({ url: res.url(), status: res.status() });
    if (origin && new URL(res.url()).origin === origin && res.status() >= 400 && !expected?.(res.url(), res.status())) {
      problems.push(`HTTP ${res.status()} for ${req.method()} ${res.url()}`);
    }
  });
  page.on('pageerror', (err) => problems.push(`uncaught: ${err instanceof Error ? err.message : String(err)}`));
  page.on('requestfailed', (req) => {
    const host = new URL(req.url()).hostname;
    if (BLOCKED_HOSTS.includes(host)) return;
    const line = `request failed: ${req.url()} (${req.failure()?.errorText ?? 'unknown'})`;
    // The web font is the one third-party fetch the app makes; offline it falls back to the system font.
    if (FONT_HOSTS.some((h) => host.endsWith(h))) warnings.push(line);
    else problems.push(line);
  });
  return { context, page, problems, warnings, blocked, documents };
}
