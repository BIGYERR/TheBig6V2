// The click-through: one athlete builds a program and visits every major page, by tapping what a user taps.
// Each step acts, asserts what must now be on screen, and the runner screenshots the result.
// Steps run in order on one page; state carries forward exactly as it does for a real user.

const PROGRAM_NAME = 'E2E Run';
const SETTLE_MS = 150;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Helpers bound to one page. Every assertion throws with a message that names what was expected. */
export function helpers(page) {
  const h = {
    async tap(selector) {
      const el = await page.waitForSelector(selector, { visible: true, timeout: 5000 }).catch(() => null);
      if (!el) throw new Error(`nothing visible to tap at ${selector}`);
      // Centre it first: an element scrolled only to the edge can sit under the fixed tab bar.
      await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }));
      await el.click();
      await sleep(SETTLE_MS);
    },
    async screen(id) {
      await page
        .waitForFunction((sid) => document.getElementById(sid)?.classList.contains('active'), { timeout: 8000 }, id)
        .catch(async () => {
          const now = await page.evaluate(() => document.querySelector('.screen.active')?.id ?? 'none');
          throw new Error(`expected screen #${id} to be active, found #${now}`);
        });
    },
    /** The ids of the sheets and overlays currently open, in document order. */
    openOverlays() {
      return page.evaluate(() =>
        [...document.querySelectorAll('[id]')]
          .filter((e) => /overlay/i.test(e.className) && (e.classList.contains('open') || e.classList.contains('show')))
          .filter((e) => getComputedStyle(e).display !== 'none')
          .map((e) => e.id),
      );
    },
    async overlayOpen(id) {
      await page
        .waitForFunction((oid) => {
          const e = document.getElementById(oid);
          return !!e && (e.classList.contains('open') || e.classList.contains('show'));
        }, { timeout: 5000 }, id)
        .catch(async () => {
          throw new Error(`expected #${id} to open; open now: [${(await h.openOverlays()).join(', ')}]`);
        });
      await sleep(SETTLE_MS);
    },
    /** Opens whatever sheet a tap brings up and returns its id; fails if the tap opened nothing. */
    async tapOpensSheet(selector) {
      const before = new Set(await h.openOverlays());
      await h.tap(selector);
      const opened = (await h.openOverlays()).filter((id) => !before.has(id));
      if (!opened.length) throw new Error(`tapping ${selector} opened no sheet`);
      return opened[opened.length - 1];
    },
    /** Closes a sheet with its own back or close control, then checks it is gone. */
    async closeSheet(id) {
      const closer = await page.$(
        `#${id} .dh-back, #${id} [onclick^="close"], #${id} [onclick*="Close"], #${id} [onclick*="close"]`,
      );
      if (!closer) throw new Error(`#${id} has no back or close control`);
      await closer.click();
      await sleep(SETTLE_MS);
      const still = await h.openOverlays();
      if (still.includes(id)) throw new Error(`#${id} did not close`);
    },
    async text(selector) {
      return page.$eval(selector, (e) => e.textContent.replace(/\s+/g, ' ').trim()).catch(() => {
        throw new Error(`no element at ${selector}`);
      });
    },
    async expectText(selector, needle) {
      const t = await h.text(selector);
      if (!t.toLowerCase().includes(needle.toLowerCase())) {
        throw new Error(`expected "${needle}" in ${selector}; read "${t.slice(0, 160)}"`);
      }
    },
    async count(selector) {
      return page.$$eval(selector, (es) => es.length);
    },
    /** The rest timer opens expanded for a 2.2 s intro on first view, then folds away; wait for it to settle. */
    async restTimerSettled() {
      await page
        .waitForFunction(() => {
          const card = document.getElementById('rtCard');
          return !card || getComputedStyle(card).display === 'none';
        }, { timeout: 6000 })
        .catch(() => {
          throw new Error('the rest timer intro did not fold away within 6 s');
        });
    },
    async wizardStep(label) {
      await h.screen('screenWizard');
      await h.expectText('#wizardStepLabel', label);
    },
  };
  return h;
}

/**
 * The steps. `page` names the major page the screenshot shows; `shot` is the element to scroll into view
 * before the screenshot (default: the top of the screen as the step left it).
 */
export const STEPS = [
  {
    id: 'home-empty',
    page: 'Programs (first launch)',
    async run(t) {
      await t.screen('screenHome');
      await t.expectText('#progList', 'No programs yet');
    },
  },
  {
    id: 'wizard-goal',
    page: 'New program: goal',
    async run(t) {
      await t.tap('.new-prog-btn');
      await t.wizardStep('1/');
      await t.tap(`[onclick*="primaryPath='body'"]`);
      if (!(await t.count(`.option-card.selected[onclick*="primaryPath='body'"]`))) throw new Error('Strength / Physique did not select');
    },
  },
  {
    id: 'wizard-profile',
    page: 'New program: about you',
    async run(t) {
      await t.tap('#wizardNext');
      await t.wizardStep('2/');
      await t.tap(`[onclick*="experience='intermediate'"]`);
      await t.tap(`[onclick*="ageBracket='36-54'"]`);
      await t.expectText('#wizardBody', 'Slightly more rest');
    },
  },
  {
    id: 'wizard-equipment',
    page: 'New program: equipment',
    async run(t) {
      await t.tap('#wizardNext');
      await t.expectText('#wizardBody', 'Your equipment');
      await t.tap(`[onclick*="equipment='commercial'"]`);
    },
  },
  {
    id: 'wizard-focus',
    page: 'New program: lifting focus and cardio',
    async run(t) {
      await t.tap('#wizardNext');
      await t.expectText('#wizardBody', 'Lifting focus');
      await t.tap(`[onclick*="liftingFocus='balanced'"]`);
      await t.tap(`[onclick="toggleCardioTypeSport('run')"]`);
    },
  },
  {
    id: 'wizard-rest-days',
    page: 'New program: rest days',
    async run(t) {
      await t.tap('#wizardNext');
      await t.expectText('#wizardBody', 'Rest days');
      await t.tap(`[onclick="toggleRestDay('wed')"]`);
      await t.tap(`[onclick="toggleRestDay('sun')"]`);
      await t.expectText('#wizardBody', '5 training days');
    },
  },
  {
    id: 'wizard-name',
    page: 'New program: name and start',
    async run(t, page) {
      await t.tap('#wizardNext');
      await t.expectText('#wizardBody', 'Name your program');
      await t.tap('#wizardBody input[type=text]');
      await page.keyboard.type(PROGRAM_NAME);
      await t.expectText('#wizardNext', 'Generate');
    },
  },
  {
    id: 'week',
    page: 'This Week',
    async run(t) {
      await t.tap('#wizardNext');
      await t.screen('screenGenerate');
      await t.screen('screenWeek');
      if ((await t.count('.wk-day')) !== 7) throw new Error('the week strip does not show 7 days');
      await t.expectText('#screenWeek', PROGRAM_NAME);
      await t.expectText('#screenWeek', 'Week 1');
      await t.restTimerSettled();
    },
  },
  {
    id: 'rest-sheet',
    page: 'Rest day sheet (today is a rest day)',
    async run(t) {
      const id = await t.tapOpensSheet(`[onclick*="openRestSheet"][onclick*="'cardio'"]`);
      if (id !== 'restOverlay') throw new Error(`expected the rest sheet, opened #${id}`);
    },
    async after(t) {
      await t.closeSheet('restOverlay');
    },
  },
  {
    id: 'day-detail',
    page: 'Day detail: lift and run',
    async run(t, page) {
      // The floating rest timer opens expanded over the week strip until it times out; a user taps its › first.
      if (await page.$eval('#rtCard', (e) => getComputedStyle(e).display !== 'none').catch(() => false)) {
        await t.tap('#rtCard .rt-collapse');
      }
      await t.tap(`.wk-day[onclick="openDayKey('fri')"]`);
      await t.overlayOpen('detailOverlay');
      if (!(await t.count('#detailOverlay .ex-swapbtn'))) throw new Error('the day shows no exercises');
    },
  },
  {
    id: 'day-detail-log',
    page: 'Day detail: session log',
    shot: '#logSection',
    async run(t) {
      if (!(await t.count('#detailOverlay #logSection'))) throw new Error('the day has no log section');
    },
  },
  {
    id: 'swap-sheet',
    page: 'Exercise swap sheet',
    async run(t) {
      await t.tap('#detailOverlay .ex-swapbtn');
      await t.overlayOpen('swapOverlay');
      if (!(await t.count('#swapOverlay .swap-cand'))) throw new Error('the swap sheet offers no candidates');
    },
    async after(t) {
      await t.closeSheet('swapOverlay');
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'random-workout',
    page: 'Random workout',
    async run(t) {
      await t.tap('.random-btn');
      await t.overlayOpen('randOverlay');
    },
    async after(t) {
      await t.closeSheet('randOverlay');
    },
  },
  {
    id: 'injury-sheet',
    page: 'Injury sheet ("Hurt?")',
    async run(t, page, state) {
      state.injurySheet = await t.tapOpensSheet('.hurt-btn');
    },
    async after(t, page, state) {
      await t.closeSheet(state.injurySheet);
    },
  },
  {
    id: 'travel-sheet',
    page: 'Travel sheet ("Traveling?")',
    async run(t, page, state) {
      state.travelSheet = await t.tapOpensSheet('.change-btn');
    },
    async after(t, page, state) {
      await t.closeSheet(state.travelSheet);
    },
  },
  {
    id: 'progress',
    page: 'Progress',
    async run(t) {
      await t.tap('#tabProgress');
      await t.screen('screenProgress');
      await t.expectText('#progressTitle', 'Progress');
    },
  },
  {
    id: 'bug-report',
    page: 'Report a bug (never submitted)',
    async run(t) {
      await t.tap('#tabBugs');
      await t.screen('screenBugs');
      if (!(await t.count('#bugSubmit'))) throw new Error('the bug form has no send button');
      await t.expectText('#bugVersion', 'BUILD v');
    },
  },
  {
    id: 'programs',
    page: 'Programs (with a program)',
    async run(t) {
      await t.tap('#tabHome');
      await t.screen('screenHome');
      await t.expectText('#progList', PROGRAM_NAME);
    },
  },
  {
    id: 'relaunch',
    page: 'This Week after a relaunch (storage kept)',
    async run(t, page) {
      await page.reload({ waitUntil: 'networkidle0' });
      // With an active program stored, launch reopens it on This Week.
      await t.screen('screenWeek');
      await t.expectText('#screenWeek', PROGRAM_NAME);
      await t.expectText('#screenWeek', 'Week 1');
      await t.restTimerSettled();
    },
  },
];
