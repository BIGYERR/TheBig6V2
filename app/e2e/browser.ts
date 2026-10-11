// Page setup shared by every e2e target: an iPhone-sized viewport, a frozen clock, a seeded Math.random,
// no animations, no outbound feedback form, and every console error and uncaught exception recorded.
import type { Browser, BrowserContext, Page } from 'puppeteer';
import type { Viewport } from './types.ts';

/** The moment every run happens at: a Wednesday, so a rest day can be "today" (future rest days are inert). */
export const FROZEN_NOW = '2026-10-07T07:30:00-04:00';
export const TIMEZONE = 'America/New_York';
export const VIEWPORT: Viewport = { width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

/** Requests the suite must never send. The bug form posts to Web3Forms; a test must not file a real report. */
const BLOCKED_HOSTS = ['api.web3forms.com'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

/** Console messages that are expected on every load and say nothing about the app under test. */
const BENIGN_CONSOLE = [/apple-mobile-web-app-capable.*is deprecated/];

/** Runs inside the page before any of its scripts, so it must not reference anything from this module. */
function installDeterminism(frozenIso: string): void {
  const fixed = new Date(frozenIso).getTime();
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
}

/** Opens a page in its own browser context, so each target starts with empty storage. */
export async function openPage(browser: Browser): Promise<OpenedPage> {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const problems: string[] = [];
  const warnings: string[] = [];
  const blocked: string[] = [];
  await page.emulateTimezone(TIMEZONE);
  await page.setViewport(VIEWPORT);
  await page.evaluateOnNewDocument(installDeterminism, FROZEN_NOW);
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
    problems.push(`console.error: ${msg.text()}`);
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
  return { context, page, problems, warnings, blocked };
}
