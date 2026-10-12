// The website and the admin, as the backend serves them (the backend service in docker-compose.yml). Each is one
// target with no original to compare against, so a step passes on its own checks: the page it shows answered 200,
// its heading or landmark is on screen, its content has rendered, and nothing went wrong on the way (no console
// error, no uncaught exception, no failed same-origin request). The runner then photographs the whole page, top to
// bottom. Steps reuse flow.ts's shapes, so a journey reads the same here as there.
import type { Page } from 'puppeteer';
import type { FlowState, Journey, Step } from './flow.ts';
import type { PageBand, Viewport } from './types.ts';

export interface PageJourney extends Journey {
  band: PageBand;
  viewport: Viewport;
}

/** A desktop browser, and the app journeys' iPhone at one device pixel, so a full page stays within one capture. */
export const DESKTOP: Viewport = { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false };
export const PHONE: Viewport = { width: 393, height: 852, deviceScaleFactor: 1, isMobile: true, hasTouch: true };

export const viewportLabel = (v: Viewport): string => `${v.width}×${v.height} @${v.deviceScaleFactor}x`;

/** The project's own local development login, which docker-compose.yml starts the e2e backend with. */
const ADMIN_USER = process.env['E2E_ADMIN_USER'] ?? 'admin';
const ADMIN_PASSWORD = process.env['E2E_ADMIN_PASSWORD'] ?? 'asylum';

/** Same-origin error statuses a page is meant to get: the admin asks who is signed in before anyone is. */
export const EXPECTED_STATUS = (url: string, status: number): boolean => status === 401 && new URL(url).pathname === '/admin/api/me';

const message = (err: unknown): string => (err instanceof Error ? err.message : String(err));

async function go(page: Page, state: FlowState, path: string): Promise<void> {
  await page.goto(`${state['base']}${path}`, { waitUntil: 'networkidle0' });
}

/**
 * Waits for a visible element and, when given, for its text to contain `text` (a section change re-renders a moment
 * after the tap); throws naming what was expected and what it read.
 */
async function visible(page: Page, selector: string, text?: string): Promise<void> {
  const el = await page.waitForSelector(selector, { visible: true, timeout: 8000 }).catch(() => null);
  if (!el) throw new Error(`expected ${selector} on screen`);
  if (text === undefined) return;
  const ok = await page
    .waitForFunction((sel, needle) => (document.querySelector(sel)?.textContent ?? '').replace(/\s+/g, ' ').includes(needle), { timeout: 8000 }, selector, text)
    .then(
      () => true,
      () => false,
    );
  if (ok) return;
  const got = await page.$eval(selector, (e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).catch(() => '');
  throw new Error(`expected ${selector} to read "${text}"; it reads "${got.slice(0, 120)}"`);
}

/** At least `min` elements match, visible or not (a section below the fold counts). */
async function atLeast(page: Page, selector: string, min: number): Promise<void> {
  const n = await page.$$eval(selector, (els) => els.length);
  if (n < min) throw new Error(`expected at least ${min} of ${selector}, found ${n}`);
}

/** Waits for at least `min` filled rows (not the "nothing yet" row) in the table inside `host`. */
async function rows(page: Page, host: string, min: number, what: string): Promise<void> {
  await page
    .waitForFunction((sel, n) => document.querySelectorAll(sel).length >= n, { timeout: 8000 }, `${host} table tbody tr:not(:has(.empty))`, min)
    .catch(() => {
      throw new Error(`expected the ${host} table to list ${what}`);
    });
}

/** Taps a link and waits for the page it opens. */
async function follow(page: Page, selector: string): Promise<void> {
  const link = await page.waitForSelector(selector, { visible: true, timeout: 5000 }).catch(() => null);
  if (!link) throw new Error(`nothing visible to tap at ${selector}`);
  await link.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), link.click()]);
}

async function expectPath(page: Page, path: string): Promise<void> {
  const at = new URL(page.url()).pathname;
  if (at !== path) throw new Error(`expected to be at ${path}, at ${at}`);
}

/** The home page, whole: the hero, every section the nav links to, and the footer with its Staff Login link. */
async function siteHome(page: Page, state: FlowState): Promise<void> {
  await go(page, state, '/');
  await visible(page, 'h1.hero-h', 'Lift heavy.');
  for (const id of ['method', 'features', 'races', 'iphone', 'faq']) await atLeast(page, `section#${id} h2`, 1);
  await atLeast(page, 'footer a.staff[href="/admin/"]', 1);
}

const WEBSITE: PageJourney[] = [
  {
    id: 'website-desktop',
    name: 'Website, desktop',
    band: 'website',
    viewport: DESKTOP,
    steps: [
      {
        id: 'site-home-desktop',
        page: 'Website: home, desktop',
        async run(_t, page, state) {
          await siteHome(page, state);
          await visible(page, 'nav.nav-links', 'Method');
          await visible(page, 'a.nav-cta', 'Open the app');
        },
      },
    ],
  },
  {
    id: 'website-phone',
    name: 'Website, phone',
    band: 'website',
    viewport: PHONE,
    steps: [
      {
        id: 'site-home-phone',
        page: 'Website: home, phone',
        async run(_t, page, state) {
          await siteHome(page, state);
          await visible(page, 'button.nav-toggle');
        },
      },
      {
        id: 'site-staff-login',
        page: 'Website: Staff Login link',
        async run(_t, page) {
          await follow(page, 'footer a.staff');
          await expectPath(page, '/admin/');
          await visible(page, '.login h1', 'Staff login');
          await visible(page, '#login-user');
        },
      },
      {
        id: 'site-open-app',
        page: 'Website: Build my program link',
        async run(_t, page, state) {
          await go(page, state, '/');
          await follow(page, '.hero-ctas a[href="/app/"]');
          await expectPath(page, '/app/');
          await page
            .waitForFunction(() => document.getElementById('screenHome')?.classList.contains('active'), { timeout: 8000 })
            .catch(() => {
              throw new Error('expected the app at /app/ to boot to its home screen');
            });
        },
      },
    ],
  },
];

/** Two devices check in before the admin is opened, one on the bundled build and one on an older one, so every section has rows to show. */
async function seedDevices(base: string): Promise<void> {
  const health = (await (await fetch(`${base}/healthz`)).json()) as { app?: string };
  const beat = async (body: Record<string, unknown>): Promise<string> => {
    const res = await fetch(`${base}/api/heartbeat`, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`the heartbeat answered ${res.status}`);
    return ((await res.json()) as { uid: string }).uid;
  };
  const current = { label: 'E2E iPhone', deviceName: 'iPhone 17 Pro', platform: 'iOS', appVersion: health.app || 'unknown', screen: '393x852' };
  const uid = await beat(current);
  await beat({ ...current, uid, rttMs: 42 });
  await beat({ label: 'E2E old build', deviceName: 'iPhone 13', platform: 'iOS', appVersion: '238', screen: '390x844', rttMs: 85 });
}

/** Types the development login into the form and submits it, as a person does; the admin shell then shows who. */
async function signIn(page: Page): Promise<void> {
  await page.type('#login-user', ADMIN_USER);
  await page.type('#login-password', ADMIN_PASSWORD);
  await page.click('.login button[type="submit"]');
  await visible(page, '.shell header.bar .who', ADMIN_USER);
}

/**
 * One admin section, opened from the left nav: its heading, no error line, and `content` rendered inside its panel.
 * `before` runs first (the overview's step signs in).
 */
function section(id: string, label: string, content: (page: Page) => Promise<void>, before?: (page: Page) => Promise<void>): Step {
  return {
    id: `admin-${id}`,
    page: `Admin: ${label}`,
    async run(_t, page) {
      await before?.(page);
      await page.click(`nav.side a[href="#/${id}"]`);
      await visible(page, '.sec-head h1', label);
      await visible(page, `nav.side a[href="#/${id}"][aria-current="page"]`);
      await content(page);
      if (await page.$('.panel .error')) throw new Error(`the ${label} section shows an error: ${await page.$eval('.panel .error', (e) => e.textContent)}`);
    },
  };
}

const ADMIN: PageJourney[] = [
  {
    id: 'admin',
    name: 'Admin: sign in, every section, sign out',
    band: 'admin',
    viewport: DESKTOP,
    steps: [
      {
        id: 'admin-login',
        page: 'Admin: Staff login',
        async run(_t, page, state) {
          await seedDevices(state['base']!).catch((err: unknown) => {
            throw new Error(`could not check two devices in: ${message(err)}`);
          });
          await go(page, state, '/admin/');
          await visible(page, '.login h1', 'Staff login');
          await visible(page, '#login-user');
          await visible(page, '#login-password');
          await visible(page, '.login button[type="submit"][disabled]', 'Sign in');
        },
      },
      section(
        'overview',
        'Overview',
        async (page) => {
          await atLeast(page, 'ia-overview .cards .card', 6);
          await rows(page, 'ia-overview', 2, 'both checked in versions');
        },
        signIn,
      ),
      section('devices', 'Devices', async (page) => {
        await rows(page, 'ia-devices', 2, 'both devices');
        await visible(page, 'ia-devices tbody', 'E2E old build');
      }),
      section('versions', 'Versions', async (page) => {
        await visible(page, 'ia-versions tbody', 'newest');
        await visible(page, 'ia-versions tbody .badge.old', 'old');
      }),
      section('server', 'Server', async (page) => {
        await visible(page, 'ia-server-info dl.facts', 'docker');
        await visible(page, 'ia-server-info a[href="/app/"]');
      }),
      {
        id: 'admin-logged-out',
        page: 'Admin: signed out',
        async run(_t, page) {
          await page.click('button.logout');
          await visible(page, '.login h1', 'Staff login');
          await visible(page, '.login .login-note', 'You are signed out.');
          if (await page.$('.shell')) throw new Error('the admin shell is still on screen after Log out');
        },
      },
    ],
  },
];

/** Every single-target journey, in band order: the website first, then the admin. */
export const PAGE_JOURNEYS: readonly PageJourney[] = [...WEBSITE, ...ADMIN];
