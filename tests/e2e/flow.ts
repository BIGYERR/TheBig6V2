// The click-throughs. Each journey is one athlete who builds a program and uses it, by tapping what a user taps.
// Each step acts, asserts what must now be on screen, and the runner screenshots the result.
// A journey's steps run in order on one page, so state carries forward exactly as it does for a real user. Every
// journey starts from empty storage in its own browser context, so no journey depends on another.
import type { Page } from 'puppeteer';
import { LATER_NOW_KEY } from './browser.ts';

const PROGRAM_NAME = 'E2E Run';
const SETTLE_MS = 150;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface Helpers {
  tap(selector: string): Promise<void>;
  screen(id: string): Promise<void>;
  /** The ids of the sheets and overlays currently open, in document order. */
  openOverlays(): Promise<string[]>;
  overlayOpen(id: string): Promise<void>;
  /** Opens whatever sheet a tap brings up and returns its id; fails if the tap opened nothing. */
  tapOpensSheet(selector: string): Promise<string>;
  /** Closes a sheet with its own back or close control, then checks it is gone. */
  closeSheet(id: string): Promise<void>;
  text(selector: string): Promise<string>;
  expectText(selector: string, needle: string): Promise<void>;
  count(selector: string): Promise<number>;
  /** The rest timer opens expanded for a 2.2 s intro on first view, then folds away; wait for it to settle. */
  restTimerSettled(): Promise<void>;
  wizardStep(label: string): Promise<void>;
  /** Taps the index-th match of a selector (0-based), for controls with no attribute of their own (week buttons). */
  tapNth(selector: string, index: number): Promise<void>;
  /** Taps a field and types into it, as a user does. */
  typeInto(selector: string, text: string): Promise<void>;
  /** Sets a native date or range control (which a user drives through the OS picker) and fires its events. */
  setValue(selector: string, value: string): Promise<void>;
  expectMatch(selector: string, pattern: RegExp): Promise<void>;
  expectNoMatch(selector: string, pattern: RegExp): Promise<void>;
  /** Replaces the wizard's suggested program name with `name`. */
  nameProgram(name: string): Promise<void>;
  /** Taps the wizard's last button and waits through the build to This Week, rest timer intro included. */
  generate(): Promise<void>;
  /** Relaunches the app (storage kept) with the frozen clock moved to a later moment, as an athlete coming back days later. */
  relaunchOn(iso: string): Promise<void>;
}

/** Values one step leaves for a later one (a sheet's id, found by tapping, then closed after the screenshot). */
export type FlowState = Record<string, string>;

export interface Journey {
  /** Kebab-case handle, unique across journeys; the report and the collage print it beside each step id. */
  id: string;
  name: string;
  steps: readonly Step[];
}

export interface Step {
  id: string;
  /** The major page the screenshot shows, as the report and the collage label it. */
  page: string;
  /** An element to scroll into view before the screenshot (default: the screen as the step left it). */
  shot?: string;
  run(t: Helpers, page: Page, state: FlowState): Promise<void>;
  /** Runs after the screenshot, to leave the app where the next step expects it. */
  after?(t: Helpers, page: Page, state: FlowState): Promise<void>;
}

/** Helpers bound to one page. Every assertion throws with a message that names what was expected. */
export function helpers(page: Page): Helpers {
  const h: Helpers = {
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
        .waitForFunction(
          (oid) => {
            const e = document.getElementById(oid);
            return !!e && (e.classList.contains('open') || e.classList.contains('show'));
          },
          { timeout: 5000 },
          id,
        )
        .catch(async () => {
          throw new Error(`expected #${id} to open; open now: [${(await h.openOverlays()).join(', ')}]`);
        });
      await sleep(SETTLE_MS);
    },
    async tapOpensSheet(selector) {
      const before = new Set(await h.openOverlays());
      await h.tap(selector);
      const opened = (await h.openOverlays()).filter((id) => !before.has(id));
      const last = opened.at(-1);
      if (!last) throw new Error(`tapping ${selector} opened no sheet`);
      return last;
    },
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
      return page.$eval(selector, (e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).catch(() => {
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
    async restTimerSettled() {
      await page
        .waitForFunction(
          () => {
            const card = document.getElementById('rtCard');
            return !card || getComputedStyle(card).display === 'none';
          },
          { timeout: 6000 },
        )
        .catch(() => {
          throw new Error('the rest timer intro did not fold away within 6 s');
        });
    },
    async wizardStep(label) {
      await h.screen('screenWizard');
      await h.expectText('#wizardStepLabel', label);
    },
    async tapNth(selector, index) {
      const els = await page.$$(selector);
      const el = els[index];
      if (!el) throw new Error(`no match ${index + 1} for ${selector} (found ${els.length})`);
      await el.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' }));
      await el.click();
      await sleep(SETTLE_MS);
    },
    async typeInto(selector, text) {
      await h.tap(selector);
      await page.keyboard.type(text);
      await sleep(SETTLE_MS);
    },
    async setValue(selector, value) {
      const found = await page.$eval(
        selector,
        (e, v) => {
          (e as HTMLInputElement).value = v;
          e.dispatchEvent(new Event('input', { bubbles: true }));
          e.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        },
        value,
      ).catch(() => false);
      if (!found) throw new Error(`no field at ${selector}`);
      await sleep(SETTLE_MS);
    },
    async expectMatch(selector, pattern) {
      const t = await h.text(selector);
      if (!pattern.test(t)) throw new Error(`expected ${pattern} in ${selector}; read "${t.slice(0, 160)}"`);
    },
    async expectNoMatch(selector, pattern) {
      const t = await h.text(selector);
      const m = pattern.exec(t);
      if (m) throw new Error(`expected no ${pattern} in ${selector}; found "${m[0]}"`);
    },
    async nameProgram(name) {
      const field = '#wizardBody input[type=text]';
      await h.tap(field);
      await page.$eval(field, (e) => (e as HTMLInputElement).select());
      await page.keyboard.type(name);
      await sleep(SETTLE_MS);
    },
    async generate() {
      await h.tap('#wizardNext');
      await h.screen('screenGenerate');
      await h.screen('screenWeek');
      await h.restTimerSettled();
    },
    async relaunchOn(iso) {
      await page.evaluate((key, ms) => sessionStorage.setItem(key, String(ms)), LATER_NOW_KEY, new Date(iso).getTime());
      await page.reload({ waitUntil: 'networkidle0' });
      if ((await page.evaluate(() => Date.now())) !== new Date(iso).getTime()) throw new Error(`the relaunch did not move the clock to ${iso}`);
    },
  };
  return h;
}

/** Reads a value an earlier step stored, failing loudly if that step never stored it. */
function stored(state: FlowState, key: string): string {
  const v = state[key];
  if (!v) throw new Error(`no ${key} was recorded by an earlier step`);
  return v;
}

const STRENGTH: readonly Step[] = [
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
    async after(t, page) {
      // A pick swaps the exercise for this session (the sheet is an Angular component in the app since phase E's fifth
      // step, the pick still the legacy applySwapChoice): the sheet closes and the day reopens showing the new name.
      const picked = await t.text('#swapOverlay .swap-cand .swap-cand-name');
      await t.tap('#swapOverlay .swap-cand');
      await t.overlayOpen('detailOverlay');
      await t.expectText('#detailOverlay', picked);
      if (await page.$eval('#swapOverlay', (e) => e.classList.contains('open'))) throw new Error('the swap sheet stayed open after the pick');
      await page.waitForFunction(() => !document.getElementById('toast')?.classList.contains('show'), { timeout: 5000 });
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'add-sheet',
    page: 'Add an exercise to a day: the sheet, then a pick',
    async run(t) {
      // The sheet is an Angular component in the app since phase E's sixth step, the legacy script's in the single-file
      // page: both answer the same.
      await t.tap(`.wk-day[onclick="openDayKey('fri')"]`);
      await t.overlayOpen('detailOverlay');
      await t.tap('#detailAddBtn');
      await t.overlayOpen('addOverlay');
      if (!(await t.count('#addOverlay .swap-cand'))) throw new Error('the add sheet offers nothing');
      await t.expectText('#addTags', 'SETS');
    },
    async after(t, page) {
      // A pick adds it to the day for this session, under the day's own heading.
      const picked = await t.text('#addOverlay .swap-cand .swap-cand-name');
      await t.tap('#addOverlay .swap-cand');
      if (await page.$eval('#addOverlay', (e) => e.classList.contains('open'))) throw new Error('the add sheet stayed open after the pick');
      await t.expectText('#detailOverlay', picked);
      await t.expectText('#detailOverlay', 'Added by you');
      await page.waitForFunction(() => !document.getElementById('toast')?.classList.contains('show'), { timeout: 5000 });
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
    async run(t, _page, state) {
      state['injurySheet'] = await t.tapOpensSheet('.hurt-btn');
    },
    async after(t, _page, state) {
      await t.closeSheet(stored(state, 'injurySheet'));
    },
  },
  {
    id: 'travel-sheet',
    page: 'Travel sheet ("Traveling?")',
    async run(t, _page, state) {
      state['travelSheet'] = await t.tapOpensSheet('.change-btn');
    },
    async after(t, _page, state) {
      await t.closeSheet(stored(state, 'travelSheet'));
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
      // Sending with nothing typed asks for the text and posts nothing (the screen is an Angular component in the app
      // since phase E's first step, the legacy script's in the single-file page: both answer the same).
      await t.tap('#bugSubmit');
      await t.expectText('#bugStatus', 'Type what went wrong first.');
    },
  },
  {
    id: 'rest-timer',
    page: 'Rest timer: open, start, stop, reset, drag to the left edge',
    async run(t, page) {
      // The floating rest timer rides the week, Progress and Bugs screens once a program exists (an Angular component in
      // the app since phase E's second step, the legacy script's in the single-file page: both answer the same). The
      // clock in a browser is performance.now(), which runs, so the step reads labels and a reset, never a time.
      await t.tap('#rtTab');
      if (!(await page.$eval('#rtCard', (e) => getComputedStyle(e).display === 'block'))) throw new Error('the rest timer did not open');
      await t.expectText('#rtToggle', 'Start');
      await t.tap('#rtToggle');
      await t.expectText('#rtToggle', 'Stop');
      if (!(await t.count('#rtMini.run'))) throw new Error('the running timer is not marked running');
      await t.tap('#rtToggle');
      await t.expectText('#rtToggle', 'Start');
      await t.tap('#rtCard .rt-reset');
      await t.expectText('#rtBig', '0:00');
      await t.expectText('#rtCs', '.00');
      await t.tap('#rtCard .rt-collapse');
      if (!(await page.$eval('#rtTab', (e) => getComputedStyle(e).display === 'flex'))) throw new Error('the rest timer did not fold back to its tab');
      // A drag across the screen docks the tab to the left edge.
      const box = await (await page.$('#rtTab'))?.boundingBox();
      if (!box) throw new Error('the rest timer tab has no box');
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(60, box.y + box.height / 2, { steps: 8 });
      await page.mouse.up();
      await new Promise((r) => setTimeout(r, 300));
      const left = await page.$eval('#rtAnchor', (e) => (e as HTMLElement).style.left);
      if (left !== '0px') throw new Error(`the dragged timer docked at left "${left}", not the left edge`);
    },
  },
  {
    id: 'programs',
    page: 'Programs (with a program): the card opened, a rename and an archive started and called off',
    async run(t, page) {
      await t.tap('#tabHome');
      await t.screen('screenHome');
      await t.expectText('#progList', PROGRAM_NAME);
      // The list is an Angular component in the app since phase E's fourth step, the legacy script's in the single-file
      // page: both answer the same. The run's own program is the active card (the list also holds an earlier one); it
      // opens on a tap and shows its selections.
      const card = '#progList .prog-card.active-prog';
      await t.tap(`${card} .prog-tap`);
      if (!(await t.count(`${card}.open`))) throw new Error('the program card did not open');
      await t.expectText(card, 'Starting 1RM');
      // A rename puts the name in a box with the caret in it; Escape leaves the name as it was.
      await t.tap(`${card} [aria-label="Rename program"]`);
      if (!(await page.evaluate(() => (document.activeElement?.id || '').startsWith('renameInput_')))) throw new Error('the rename box did not take the caret');
      await page.keyboard.press('Escape');
      await new Promise((r) => setTimeout(r, 300));
      if (await t.count('#progList input')) throw new Error('Escape did not close the rename box');
      await t.expectText(`${card} .prog-card-name`, PROGRAM_NAME);
      // Archive asks first; Cancel calls it off.
      await t.tap(`${card} .prog-action-btn.danger`);
      // The wizard's name box held its default when the run typed into it, so the name ends with PROGRAM_NAME.
      await t.expectText(card, 'Archive “');
      await t.expectText(card, `${PROGRAM_NAME}”?`);
      await t.tap(`${card} .prog-action-btn:not(.primary)`);
      await t.expectText(card, 'Active ✓');
    },
  },
  {
    id: 'goal-sheet',
    page: 'Change the run goal: the sheet, a pace goal picked, its targets typed, then kept',
    async run(t, page) {
      // The sheet's body is an Angular component in the app since phase E's seventh step, the legacy script's in the
      // single-file page: both answer the same. The open card's run row carries the pencil.
      await t.tap('#progList .prog-card.active-prog [aria-label="Change Run goal"]');
      await t.overlayOpen('goalOverlay');
      await t.expectText('#goalBody', 'CHANGE RUN GOAL');
      const labels = await page.$$eval('#goalBody .goal-option-label', (es) => es.map((e) => e.textContent ?? ''));
      const pace = labels.findIndex((l) => l.startsWith('Hit a Pace'));
      if (pace < 0) throw new Error(`the sheet offers no pace goal: ${labels.join(' | ')}`);
      await t.tapNth('#goalBody .goal-option', pace);
      await t.expectText('#goalBody', 'Switch to Hit a Pace / Time Goal');
    },
    async after(t, page) {
      // The switch waits for a distance and a time; typing them lets it go ahead, and the field keeps what was typed.
      const commit = () => page.$eval('#goalCommitBtn', (e) => (e as HTMLElement).style.opacity);
      if ((await commit()) !== '0.4') throw new Error('the switch was open before the targets were typed');
      await t.typeInto('#goalBody input[placeholder="dist e.g. 1.5"]', '1.5');
      if ((await commit()) !== '0.4') throw new Error('the switch opened on a distance alone');
      await t.typeInto('#goalBody input[placeholder="min"]', '10');
      if ((await commit()) !== '1') throw new Error('the switch stayed shut with a distance and a time typed');
      const typed = await page.$eval('#goalBody input[placeholder="dist e.g. 1.5"]', (e) => (e as HTMLInputElement).value);
      if (typed !== '1.5') throw new Error(`the distance field shows "${typed}" after the time was typed`);
      // Keeping the current goal closes the sheet and changes nothing.
      await t.tap('#goalBody .prog-action-btn:not(#goalCommitBtn)');
      if ((await t.openOverlays()).includes('goalOverlay')) throw new Error('the goal sheet stayed open after Keep');
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

/** Opens a day on the week strip and waits for its detail sheet. */
async function openDay(t: Helpers, key: string): Promise<void> {
  await t.tap(`.wk-day[onclick="openDayKey('${key}')"]`);
  await t.overlayOpen('detailOverlay');
}

/** The heads up box the wizard shows when the goal sets the program's length. */
async function lengthWarning(t: Helpers, page: Page): Promise<void> {
  await t.tap('#wizardNext');
  await page.waitForSelector('#lengthWarnOverlay #confirmGenBtn', { visible: true, timeout: 5000 }).catch(() => {
    throw new Error('the program length box did not open');
  });
}

/** A 10K with a race date eight weeks out: week 1 holds a long run, week 8 the shakeout and race day (NRC). */
const RACE: readonly Step[] = [
  {
    id: 'race-goal',
    page: 'Race: goal',
    async run(t) {
      await t.tap('.new-prog-btn');
      await t.wizardStep('1/');
      await t.tap(`[onclick*="primaryPath='event'"]`);
      if (!(await t.count(`.option-card.selected[onclick*="primaryPath='event'"]`))) throw new Error('Race / Event did not select');
    },
  },
  {
    id: 'race-10k-date',
    page: 'Race: 10K and race date',
    async run(t) {
      await t.tap('#wizardNext');
      await t.tap('#wizardNext');
      await t.tap('#wizardNext');
      await t.expectText('#wizardBody', 'Cardio goals');
      await t.tap(`[onclick="toggleCardioTypeSport('run')"]`);
      await t.tap(`[onclick="setCardioGoal('run','run_10k')"]`);
      await t.setValue('#wizardBody #raceDateInput', '2026-11-29');
      await t.expectText('#wizardBody', 'Program length: 8 weeks');
    },
  },
  {
    id: 'race-name',
    page: 'Race: name and start',
    async run(t) {
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="liftingFocus='support_prevention'"]`);
      await t.tap('#wizardNext');
      await t.tap(`[onclick="toggleRestDay('mon')"]`);
      await t.tap('#wizardNext');
      await t.nameProgram('E2E Race');
      await t.expectText('#wizardBody', 'Your 10K is Sun, Nov 29');
      await t.expectText('#wizardBody', 'You open in week 1');
    },
  },
  {
    id: 'race-length',
    page: 'Race: program length check',
    async run(t, page) {
      await lengthWarning(t, page);
      await t.expectText('#lengthWarnOverlay', '8-Week Program');
    },
  },
  {
    id: 'race-week-1',
    page: 'Race: This Week, week 1',
    async run(t) {
      await t.tap('#confirmGenBtn');
      await t.screen('screenGenerate');
      await t.screen('screenWeek');
      await t.restTimerSettled();
      await t.expectText('#screenWeek', 'E2E Race');
      await t.expectText('#screenWeek', 'Nov 29, 2026');
      if ((await t.count('.week-btn')) !== 8) throw new Error('the race plan does not show 8 weeks');
    },
  },
  {
    id: 'race-long-run',
    page: 'Race: Sunday long run',
    async run(t) {
      await openDay(t, 'sun');
      await t.expectText('#detailOverlay', 'Long run');
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'race-week-8',
    page: 'Race: race week',
    async run(t) {
      await t.tapNth('.week-btn', 7);
      await t.expectText('#screenWeek', 'Week 8');
    },
  },
  {
    id: 'race-shakeout',
    page: 'Race: Saturday shakeout',
    async run(t) {
      await openDay(t, 'sat');
      await t.expectText('#detailOverlay', 'Shakeout');
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'race-day',
    page: 'Race: race day',
    async run(t) {
      await openDay(t, 'sun');
      await t.expectText('#detailOverlay', 'Race day');
      await t.expectText('#detailOverlay', '6.2 miles');
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
];

/** A dated 1.5 mile test six weeks out (NSW): the program ends on the test week. */
const TEST: readonly Step[] = [
  {
    id: 'test-goal',
    page: 'Test: 1.5 mile goal and test date',
    async run(t) {
      await t.tap('.new-prog-btn');
      await t.tap(`[onclick*="primaryPath='event'"]`);
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="ageBracket='36-54'"]`);
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="equipment='commercial'"]`);
      await t.tap('#wizardNext');
      await t.tap(`[onclick="toggleCardioTypeSport('run')"]`);
      await t.tap(`[onclick="setCardioGoal('run','run_pace_goal')"]`);
      await t.typeInto(`#wizardBody input[oninput*="targetDist"]`, '1.5');
      await t.typeInto(`#wizardBody input[oninput*="targetMins"]`, '10');
      await t.typeInto(`#wizardBody input[oninput*="targetSecs"]`, '30');
      await t.typeInto(`#wizardBody input[oninput*="mileBestMins"]`, '7');
      await t.typeInto(`#wizardBody input[oninput*="mileBestSecs"]`, '30');
      await t.setValue('#wizardBody #raceDateInput', '2026-11-14');
      await t.expectText('#wizardBody', '10:30 is 7:00 per mile');
      await t.expectText('#wizardBody', 'Your test is in week 6');
    },
  },
  {
    id: 'test-name',
    page: 'Test: name and start',
    async run(t) {
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="liftingFocus='support_strength'"]`);
      await t.tap('#wizardNext');
      await t.tap('#wizardNext');
      await t.nameProgram('E2E Test');
      await t.expectText('#wizardBody', 'Sat, Nov 14, 2026');
      await t.expectMatch('#wizardBody', /Program length\s*6 weeks/);
    },
  },
  {
    // The box's own week count is not asserted: it reads the goal's length, not the test week's.
    id: 'test-length',
    page: 'Test: program length check',
    async run(t, page) {
      await lengthWarning(t, page);
    },
  },
  {
    id: 'test-week-1',
    page: 'Test: This Week, week 1',
    async run(t) {
      await t.tap('#confirmGenBtn');
      await t.screen('screenGenerate');
      await t.screen('screenWeek');
      await t.restTimerSettled();
      await t.expectText('#screenWeek', 'E2E Test');
      if ((await t.count('.week-btn')) !== 6) throw new Error('the test plan does not end on week 6');
    },
  },
  {
    id: 'test-week-6',
    page: 'Test: test week',
    async run(t) {
      await t.tapNth('.week-btn', 5);
      await t.expectText('#screenWeek', 'Week 6');
    },
  },
  {
    id: 'test-day',
    page: 'Test: Saturday 1.5 mile test',
    async run(t) {
      await openDay(t, 'sat');
      await t.expectText('#detailOverlay', '1.5 mile test');
      await t.expectText('#detailOverlay', 'Goal 10:30');
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'test-mile',
    page: 'Test: the mile pencil, its sheet from the stored 7:30, then a change kept back',
    async run(t, page) {
      // The sheet is an Angular component in the app since phase E's eighth step, the legacy markup in the single-file
      // page: both answer the same. Week 1 of 6 is before the last three weeks, so the pencil opens the edit sheet.
      await t.tap('#tabHome');
      await t.screen('screenHome');
      const card = '#progList .prog-card.active-prog';
      await t.tap(`${card} .prog-tap`);
      await t.tap(`${card} [aria-label="Change mile time"]`);
      await t.overlayOpen('mileOverlay');
      await t.expectText('#mileOverlay', 'YOUR MILE');
      await t.expectText('#mileOverlay', 'Put in the mile you can run today.');
      const fields = await mileFields(page);
      if (fields !== '7:30') throw new Error(`the mile sheet opened on ${fields}, not the stored 7:30`);
    },
    async after(t, page) {
      // A change kept back is gone the next time: each open starts from the stored mile.
      await t.tap('#mileSheetMins');
      await page.keyboard.down('Control');
      await page.keyboard.press('a');
      await page.keyboard.up('Control');
      await page.keyboard.type('9');
      if ((await mileFields(page)) !== '9:30') throw new Error(`the minutes field holds ${await mileFields(page)} after 9 was typed over it`);
      await t.tap('#mileOverlay .prog-action-btn:not(#mileCommitBtn)');
      if ((await t.openOverlays()).includes('mileOverlay')) throw new Error('the mile sheet stayed open after Keep');
      await t.tap('#progList .prog-card.active-prog [aria-label="Change mile time"]');
      await t.overlayOpen('mileOverlay');
      const fields = await mileFields(page);
      if (fields !== '7:30') throw new Error(`the mile sheet reopened on ${fields}, not the stored 7:30`);
      await t.tap('#mileOverlay .back-btn');
      if ((await t.openOverlays()).includes('mileOverlay')) throw new Error('the mile sheet stayed open after Back');
    },
  },
  {
    id: 'test-lock',
    page: 'Test: three weeks later, the mile pencil holds the row',
    async run(t, page) {
      // The athlete comes back on the Wednesday of week 4 (the plan's first week began Mon Oct 5), inside the last three
      // weeks, so the pencil shows the lock: 17 days to Sat Nov 14. The lock is a component in the app, legacy markup in
      // the page. Three weeks away first earns the re-entry reminder for the last missed day, which the athlete skips.
      await t.relaunchOn('2026-10-28T07:30:00-04:00');
      await t.screen('screenWeek');
      await t.expectText('#screenWeek', 'Week 4');
      await t.overlayOpen('popOverlay');
      await t.expectText('#popOverlay', 'More than a week off.');
      await t.expectText('#popOverlay', 'Tuesday, Wk 4');
      await t.tap('#popActions .pop-act.skip');
      if ((await t.openOverlays()).includes('popOverlay')) throw new Error('the reminder stayed up after Skip');
      await page.waitForFunction(() => !document.getElementById('toast')?.classList.contains('show'), { timeout: 5000 });
      await t.restTimerSettled();
      await t.tap('#tabHome');
      await t.screen('screenHome');
      const card = '#progList .prog-card.active-prog';
      await t.tap(`${card} .prog-tap`);
      await t.tap(`${card} [aria-label="Change mile time"]`);
      await t.overlayOpen('mileLockOverlay');
      await t.expectText('#mileLockBody', 'THE ROW HOLDS');
      await t.expectText('#mileLockBody', 'Days out17');
      await t.expectText('#mileLockBody', 'Race daySat, Nov 14, 2026');
      await t.expectText('#mileLockBody', 'Week4 of 6');
      await t.expectText('#mileLockBody', 'You are too close to the race.');
    },
    async after(t) {
      await t.tap('#mileLockBody .prog-action-btn');
      if ((await t.openOverlays()).includes('mileLockOverlay')) throw new Error('the lock stayed open after Got it');
    },
  },
];

/** The mile sheet's two fields, as minutes:seconds. */
function mileFields(page: Page): Promise<string> {
  return page.evaluate(() => ['mileSheetMins', 'mileSheetSecs'].map((id) => (document.getElementById(id) as HTMLInputElement).value).join(':'));
}

/** Bodyweight only, a beginner over 55, then a knee injury applied: jumps leave the untrained days. */
const BODYWEIGHT_KNEE: readonly Step[] = [
  {
    id: 'bw-equipment',
    page: 'Bodyweight: equipment',
    async run(t) {
      await t.tap('.new-prog-btn');
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="experience='beginner'"]`);
      await t.tap(`[onclick*="ageBracket='55+'"]`);
      await t.tap('#wizardNext');
      await t.tap(`[onclick*="equipment='bodyweight'"]`);
      if (!(await t.count(`.selected[onclick*="equipment='bodyweight'"]`))) throw new Error('Bodyweight only did not select');
    },
  },
  {
    id: 'bw-week',
    page: 'Bodyweight: This Week',
    async run(t) {
      await t.tap('#wizardNext');
      await t.tap('#wizardNext');
      await t.tap('#wizardNext');
      await t.nameProgram('E2E Bodyweight');
      await t.generate();
      await t.expectText('#screenWeek', 'E2E Bodyweight');
    },
  },
  {
    id: 'bw-friday',
    page: 'Bodyweight: Friday before the injury',
    async run(t) {
      await openDay(t, 'fri');
      // The after-injury step proves jumps leave; that only means something if this day has one.
      await t.expectMatch('#detailOverlay', /jump/i);
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'bw-hurt-knee',
    page: 'Bodyweight: Hurt? with the knee chosen',
    async run(t) {
      const id = await t.tapOpensSheet('.hurt-btn');
      if (id !== 'changeOverlay') throw new Error(`expected the Hurt? sheet, opened #${id}`);
      await t.tap(`[onclick="_ovSet('injRegion','knee')"]`);
      await t.expectText('#changeOverlay', 'Working around it');
      await t.expectText('#changeOverlay', 'Jumps are out');
    },
  },
  {
    id: 'bw-knee-week',
    page: 'Bodyweight: This Week with the knee injury',
    async run(t, page) {
      await t.tap('#changeOverlay .ov-apply');
      await page
        .waitForFunction(() => !document.getElementById('changeOverlay')?.classList.contains('open'), { timeout: 5000 })
        .catch(() => {
          throw new Error('the Hurt? sheet did not close after Apply');
        });
      await t.expectText('#screenWeek', 'Injury week');
      await t.expectText('#screenWeek', 'Knee (working around it)');
    },
  },
  {
    id: 'bw-friday-knee',
    page: 'Bodyweight: Friday with the knee injury',
    async run(t) {
      await openDay(t, 'fri');
      await t.expectNoMatch('#detailOverlay', /jump/i);
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
];

/** Log today's session (two exercises, effort and a note), close it out, relaunch, and find it all kept. */
const LOG_SESSION: readonly Step[] = [
  {
    id: 'log-week',
    page: 'Log: This Week',
    async run(t) {
      await t.tap('.new-prog-btn');
      for (let i = 0; i < 5; i++) await t.tap('#wizardNext');
      await t.nameProgram('E2E Log');
      await t.generate();
      await t.expectText('#screenWeek', 'E2E Log');
    },
  },
  {
    id: 'log-exercises',
    page: 'Log: two exercises logged',
    async run(t, page) {
      await t.tap('.wk-hero-cta');
      await t.overlayOpen('detailOverlay');
      await t.tapNth('#detailOverlay .ex-logbtn', 0);
      await t.tapNth('#detailOverlay .ex-logbtn', 1);
      // Each exercise's set header carries its status in its own span: "logged", "nothing logged" or "as prescribed".
      const logged = await page.$$eval('#detailOverlay .exset-head-sub', (subs) => subs.filter((e) => e.textContent?.trim() === 'logged').length);
      if (logged !== 2) throw new Error(`expected 2 exercises marked logged, found ${logged}`);
    },
  },
  {
    id: 'log-effort',
    page: 'Log: effort and notes',
    shot: '#log_notes',
    async run(t) {
      await t.setValue('#log_rpe', '7');
      await t.typeInto('#log_notes', 'Felt strong.');
      await t.expectText('#detailOverlay', '7 — Very Hard');
    },
  },
  {
    id: 'log-done',
    page: 'Log: session closed out',
    async run(t, page) {
      await t.tap('#statusBtn_complete');
      await page
        .waitForFunction(() => !document.getElementById('detailOverlay')?.classList.contains('open'), { timeout: 5000 })
        .catch(() => {
          throw new Error('the day did not close after Done');
        });
      await t.expectText('#screenWeek', 'Closed out');
      // Closing the day out celebrates it (the pop-up is an Angular component in the app since phase E's third step, the
      // legacy script's in the single-file page: both answer the same). It stays up for the photograph.
      await page
        .waitForFunction(() => document.getElementById('popOverlay')?.classList.contains('show'), { timeout: 3000 })
        .catch(() => {
          throw new Error('no pop-up after the day closed');
        });
      await t.expectText('#popKicker', 'WORKOUT COMPLETE');
      if (!(await t.count('#popActions .pop-act.go'))) throw new Error('the pop-up has no dismiss button');
    },
    async after(t, page) {
      await t.tap('#popActions .pop-act.go');
      if (await page.$eval('#popOverlay', (e) => e.classList.contains('show'))) throw new Error('the pop-up did not close on its button');
    },
  },
  {
    id: 'log-relaunch',
    page: 'Log: the session after a relaunch',
    async run(t, page) {
      await page.reload({ waitUntil: 'networkidle0' });
      await t.screen('screenWeek');
      await t.expectText('#screenWeek', 'Closed out');
      await t.tap('.wk-hero-cta');
      await t.overlayOpen('detailOverlay');
      await t.expectMatch('#detailOverlay', /2 \/ \d+ logged/i);
      const notes = await page.$eval('#log_notes', (e) => (e as HTMLTextAreaElement).value);
      if (notes !== 'Felt strong.') throw new Error(`the note did not survive the relaunch; read "${notes}"`);
    },
    async after(t) {
      await t.closeSheet('detailOverlay');
    },
  },
  {
    id: 'log-progress',
    page: 'Log: Progress journal',
    async run(t) {
      await t.tap('#tabProgress');
      await t.screen('screenProgress');
      await t.expectText('#screenProgress', 'Felt strong.');
    },
  },
];

export const JOURNEYS: readonly Journey[] = [
  { id: 'strength', name: 'Strength, commercial gym', steps: STRENGTH },
  { id: 'race-10k', name: '10K race, Sun Nov 29', steps: RACE },
  { id: 'test-1-5mi', name: '1.5 mile test, Sat Nov 14', steps: TEST },
  { id: 'bodyweight-knee', name: 'Bodyweight, then a knee injury', steps: BODYWEIGHT_KNEE },
  { id: 'log-session', name: 'Log a session and relaunch', steps: LOG_SESSION },
];
