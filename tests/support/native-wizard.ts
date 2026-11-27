// The wizard and Generate: the Expo app's against today's page (MIGRATION.md phase 3, row 6, the first of two
// sessions). Two apps over one stored state: the page in the VM harness (a Phone), and the Expo app's wizard
// (frontends/native/src/wizard: wizard-screen.ts's taps and views, wizard-writes.ts's Generate) over its own SQLite
// store. After every tap the two are held equal: the step, the draft whole, the bar (its count, its fill, its last
// button), every word, attribute and tag of the step's markup, the toast, and every ia_ key, value for value. After
// Generate: the pop-up, the refusal, the generating screen's lines, the program in hand whole (its grid, its dates,
// its config), every ia_ key, and This Week as it then shows.
//
// THE PAGE WRITES MARKUP. The page under the harness has no Angular screen: renderWizardStep writes each step into
// #wizardBody as a string. The Expo app's views are printed here as those strings (stepMarkup, typed by hand from
// renderWizardStep) and compared with the page's own. The page's templates are indented over many lines, so the two
// are compared with the white space between tags taken out and every other run of it read as one space: every tag,
// attribute and word is held, the template's line breaks are not.
//
// THE CARDIO GOALS (the second session). The step is drawn whole by a goal, a sport, a unit, a race button, the
// seed's buttons, the shorter plan link, Continue and Back: its markup is then held equal, every tag of every form.
// A typed field and a picked race day draw nothing whole: the page repaints a few lines in place. After every tap,
// whole or not, the seven lines the page repaints (the length line, the pace line, the pace frame, the card under
// the race date, the swim pace line, the mile's advisory, the swim's) and the race date's field are held equal as
// they stand on the page, a stale one included.
//
// THE PAGE'S ELEMENTS. The harness hands the page an element for any id. The lines the wizard repaints in place are
// here only while the step's markup holds them, as on a real page, so a repaint of a line that is not drawn writes
// nothing (the race date's card would otherwise write the draft's week count on a step with no card). Each whole
// draw replaces them, as a real page does: their words, display, color and value are the markup's until the page
// writes to one in place.
//
// THE CLOCK. The page's clock is pinned for a launch. Core's build reads the clock itself (a program's id, its seed
// when the config holds none, the instant it was made), so the Expo app's build runs with this process's clock
// pinned to the page's instant (atInstant).
import assert from 'node:assert/strict';
import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import type { ScreenProgram } from '../../frontends/native/src/this-week/week-screen.ts';
import { currentWeek } from '../../frontends/native/src/this-week/week-readers.ts';
import { launch, midnight } from '../../frontends/native/src/this-week/week-screen.ts';
import {
  type Advisory, type CardioField, type CardioFooter, type CardioForm, type CardioStep, type MileField, type SeedView, type TimePair, baselineSuffix, raceButtonStyle, unitButtonStyle,
} from '../../frontends/native/src/wizard/cardio-goal-model.ts';
import type { Choice } from '../../frontends/native/src/wizard/wizard-model.ts';
import { unitStyle, WIZARD_STEPS } from '../../frontends/native/src/wizard/wizard-model.ts';
import type { CardioPaint, Draft } from '../../frontends/native/src/wizard/wizard-readers.ts';
import { getDayAdvisories, getMinTrainDays } from '../../frontends/native/src/wizard/wizard-readers.ts';
import {
  type CardioView, type FloorToast, type StepView, WIZARD_WORDS as W, type WizardState, applySeedData, copyRuns, dismissSeedData, editCardioField, floorToastMarkup, landingTitle, liftOnly,
  offerShorterPlan, raceTargeted, setCardioGoal, setChoice, setName, setPaceUnit, setRaceDate, setStart, setSwimUnit, setUnit, startWizard, toggleCardioTypeSport, toggleRestDay, wizardBack,
  wizardNext, wizardView,
} from '../../frontends/native/src/wizard/wizard-screen.ts';
import { GENERATING, LENGTH_WORDS, beginGenerate, finishGenerate, lengthWarning, refusal } from '../../frontends/native/src/wizard/wizard-writes.ts';
import { launchNow, nativeView, pageShown, pageView, phoneStore } from './native-this-week.ts';
import { sqliteTestStore } from './sqlite-kv.ts';
import type { Phone } from './stored-state.ts';

const J = JSON.stringify;
const held = (s: StateStore): Record<string, string> => Object.fromEntries(s.keys().filter((k) => k.startsWith('ia_')).sort().map((k) => [k, s.get(k)!]));

/** Two long texts held equal: a difference is named by where it starts, never handed whole to the assertion. */
export function sameText(mine: string, theirs: string, what: string): void {
  if (mine === theirs) return;
  let i = 0;
  while (i < mine.length && i < theirs.length && mine[i] === theirs[i]) i++;
  assert.fail(what + ' (they part at ' + i + ' of ' + mine.length + ' and ' + theirs.length + ': here "' + mine.slice(Math.max(0, i - 60), i + 80) + '", today\'s "' + theirs.slice(Math.max(0, i - 60), i + 80) + '")');
}
/** Two stores held equal, key for key: the first key that differs is named. */
function sameStore(mine: Record<string, string>, theirs: Record<string, string>, what: string): void {
  for (const k of [...new Set([...Object.keys(mine), ...Object.keys(theirs)])].sort()) {
    if (mine[k] === undefined || theirs[k] === undefined) assert.fail(what + ': ' + k + ' is held by ' + (mine[k] === undefined ? 'today\'s alone' : 'the Expo app alone'));
    sameText(mine[k]!, theirs[k]!, what + ': ' + k);
  }
}
/** Markup with the template's own white space taken out: none between tags, one space for any other run. */
export const tight = (h: string): string => h.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

/** Runs `fn` with this process's clock pinned to an instant, as the page's is for a launch, then puts the clock back. */
export function atInstant<T>(ms: number, fn: () => T): T {
  const Real = Date;
  class Pinned extends Real {
    constructor(...a: unknown[]) { if (a.length === 0) super(ms); else super(...(a as [number])); }
    static override now(): number { return ms; }
  }
  (globalThis as { Date: DateConstructor }).Date = Pinned as unknown as DateConstructor;
  try { return fn(); } finally { (globalThis as { Date: DateConstructor }).Date = Real; }
}

/** What the walks compared so far, by kind: each is a thing the screens can draw, a toast, a pop-up or a write. */
export type WizardTally = Record<string, number>;
export const wizardTally = (): WizardTally => ({});
const bump = (T: WizardTally, k: string, n = 1): void => { T[k] = (T[k] || 0) + n; };

// ── The steps as the page's markup (typed by hand from renderWizardStep) ─────────────────────────────────────────
const optionCard = (c: Choice, key: string, style: string, icon: number, extra = ''): string =>
  '<div class="option-card' + (c.sel ? ' selected' : '') + '" onclick="WD.' + key + '=\'' + c.id + '\';renderWizardStep()" style="' + style + '"><div style="flex-shrink:0">' + asyIcon(c.icon, icon) + '</div><div><div class="option-label">' + c.label
  + '</div><div class="option-desc">' + c.desc + '</div>' + extra + '</div></div>';
const head = (t: { title: string; subtitle: string }): string => '<div class="wizard-title">' + t.title + '</div><div class="wizard-subtitle">' + t.subtitle + '</div>';
const typeCard = (sel: boolean, click: string, style: string, icon: string, body: string): string =>
  '<div class="cardio-type-card' + (sel ? ' selected' : '') + '" onclick="' + click + '"' + style + '>' + icon + body + '<div class="cardio-check" style="opacity:' + (sel ? 1 : 0) + '">✓</div></div>';

/** The Expo app's step as the markup today's page writes into #wizardBody (renderWizardStep). */
export function stepMarkup(v: StepView): string {
  if (v.step === 'primary') {
    return head(W.primary) + '<div style="display:flex;flex-direction:column;gap:10px">'
      + v.choices.map((c) => optionCard(c, 'primaryPath', 'display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px', 30, '<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">' + c.detail + '</div>')).join('') + '</div>';
  }
  if (v.step === 'profile') {
    const p = v.profile;
    return head(W.profile) + '<div class="input-label" style="margin-bottom:8px">' + W.profile.experience + '</div><div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">'
      + p.experience.map((c) => optionCard(c, 'experience', 'display:flex;align-items:center;gap:12px;text-align:left;padding:12px 14px', 26)).join('') + '</div>'
      + '<div class="input-label" style="margin-bottom:8px">' + W.profile.age + '</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">'
      + p.age.map((a) => '<div class="option-card' + (a.sel ? ' selected' : '') + '" onclick="WD.ageBracket=\'' + a.id + '\';renderWizardStep()" style="text-align:center;padding:14px 8px"><div style="margin-bottom:4px">' + asyIcon(a.icon, 24)
        + '</div><div class="option-label">' + a.label + '</div></div>').join('') + '</div>'
      + '<div class="input-label" style="margin-bottom:8px">' + W.profile.units + '</div><div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:16px;overflow:hidden;margin-bottom:16px">'
      + '<button onclick="setUnit(\'lbs\')" style="' + unitStyle(!p.kg) + '">' + W.profile.lbs + '</button><button onclick="setUnit(\'kg\')" style="' + unitStyle(p.kg) + '">' + W.profile.kg + '</button></div>'
      + '<div style="background:var(--surface);border:1px solid transparent;border-radius:16px;padding:12px 14px;font-size:12px;color:var(--muted);line-height:1.8"><div><b style="color:var(--accent)">' + W.profile.expLabel + '</b> ' + p.expHint
      + '</div><div style="margin-top:6px"><b style="color:var(--accent)">' + p.ageLabel + '</b> ' + p.ageHint + '</div></div>';
  }
  if (v.step === 'equipment') {
    return head(W.equipment) + '<div style="display:flex;flex-direction:column;gap:10px">' + v.choices.map((e) => typeCard(e.sel, 'WD.equipment=\'' + e.id + '\';renderWizardStep()', '', '<div class="cardio-type-icon">' + asyIcon(e.icon, 26) + '</div>',
      '<div style="flex:1"><div class="cardio-type-name" style="color:' + (e.sel ? 'var(--accent)' : 'var(--text)') + '">' + e.label + '</div><div class="cardio-type-desc">' + e.desc + '</div></div>')).join('') + '</div>';
  }
  if (v.step === 'cardio_goal') return cardioMarkup(v.cardio);
  if (v.step === 'lifting_focus') {
    const l = v.lifting;
    const sport = (sel: boolean, click: string, icon: string, name: string): string => typeCard(sel, click, ' style="padding:10px 14px"', '<div style="flex-shrink:0">' + asyIcon(icon, 22) + '</div>',
      '<div style="flex:1"><div class="cardio-type-name" style="color:' + (sel ? 'var(--accent)' : 'var(--text)') + ';font-size:14px">' + name + '</div></div>');
    return '<div class="wizard-title">' + W.lifting.title + '</div><div class="wizard-subtitle">' + l.subtitle + '</div><div style="display:flex;flex-direction:column;gap:10px">'
      + l.choices.map((c) => optionCard(c, 'liftingFocus', 'display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px', 28)).join('') + '</div>'
      + (l.addOn ? '<div style="margin-top:12px;background:var(--surface);border:1px solid var(--border2);border-radius:16px;overflow:hidden"><div style="padding:10px 14px;font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0;color:var(--muted);border-bottom:1px solid var(--border)">'
        + W.lifting.addOn + '</div><div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">' + l.addOn.sports.map((t) => sport(t.sel, 'toggleCardioTypeSport(\'' + t.id + '\')', t.icon, t.label)).join('')
        + sport(l.addOn.liftOnly, 'WD.cardioTypes=[];WD.cardioGoals={};renderWizardStep()', 'dumbbell', W.lifting.liftOnly) + '</div></div>' : '');
  }
  if (v.step === 'days') {
    const d = v.days, f = d.floor;
    return head(W.days) + '<div class="day-grid">' + d.days.map((x) => '<div class="day-toggle' + (x.rest ? ' rest' : '') + '" style="' + (x.blocked ? 'opacity:0.5;' : '') + '" onclick="toggleRestDay(\'' + x.key + '\')"><div style="line-height:1">' + x.short + '</div>'
      + (x.rest ? '<div style="font-size:9px;margin-top:2px;opacity:0.5">✕</div>' : x.blocked ? '<div style="font-size:9px;margin-top:2px;opacity:0.6">' + asyIcon('🔒', 10) + '</div>' : '') + '</div>').join('') + '</div>'
      + '<div style="font-size:12px;color:var(--muted);margin-top:6px">' + W.days.legend + '<b style="color:var(--text)">' + d.count + '</b>' + W.days.selected + '</div>'
      + (f ? '<div style="margin-top:10px;background:rgba(var(--ink-rgb),0.12);border:1px solid rgba(var(--ink-rgb),0.35);border-radius:16px;padding:12px 14px"><div style="font-size:13px;color:var(--accent);font-weight:700;line-height:1.5;margin-bottom:4px">'
        + asyIcon('🔒', 13) + W.days.lockTitle + '</div><div style="font-size:12px;color:var(--text);line-height:1.5">'
        + (f.reason ? W.days.floorGoal.before + '<b>' + f.reason + '</b>' + W.days.floorGoal.mid + '<b>' + f.min + W.days.floorGoal.days + '</b>' + W.days.floorGoal.after : W.days.floorThree) + '</div></div>' : '')
      + (d.advisories.length ? '<div style="margin-top:10px;background:rgba(var(--ink-rgb),0.10);border:1px solid rgba(var(--ink-rgb),0.28);border-radius:16px;padding:11px 14px;display:flex;flex-direction:column;gap:8px">'
        + d.advisories.map((a) => '<div style="font-size:12px;color:var(--accent);line-height:1.5">' + a + '</div>').join('') + '</div>' : '');
  }
  const n = v.name;
  return head(W.name) + '<div class="input-group"><div class="input-label">' + W.name.nameLabel + '</div><input type="text" class="input-field" value="' + n.name + '" oninput="WD.name=this.value" maxlength="40"></div>'
    + (n.aligned
      ? '<div class="input-group"><div class="input-label">' + W.name.startLabel + '</div><div class="input-field derived"><span>' + n.aligned.start + '</span><span class="src">' + W.name.derived + '</span></div><div class="start-resolve' + (n.aligned.warn ? ' warn' : '')
        + '" id="startResolve">' + n.aligned.copy + '</div>' + (n.aligned.pips ? '<div class="start-pips">' + n.aligned.pips.map((c) => '<i class="' + c + '"></i>').join('') + '</div>' : '') + '</div>'
      : '<div class="input-group"><div class="input-label">' + W.name.startLabel + '</div><input type="date" class="input-field" id="wizStartDate" value="' + n.startDate + '" onchange="WD.startDate=this.value;updateStartResolve()"><div class="start-resolve" id="startResolve">'
        + n.resolveCopy + '</div></div>')
    + '<div class="summary-block"><div class="summary-block-header">' + W.name.summary + '</div>' + n.rows.map((r) => '<div class="summary-row"><span class="summary-key">' + r.k + '</span><span class="summary-val">' + r.v + '</span></div>').join('') + '</div>';
}

/** The Expo app's pop-up as the markup today's page writes into its overlay (showLengthWarning). */
export function warningMarkup(w: { msg: string; weeks: number }): string {
  const b = LENGTH_WORDS.body(w.weeks);
  return '<div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:24px;max-width:360px;width:100%;"><div style="font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0;color:var(--accent);margin-bottom:10px;">'
    + LENGTH_WORDS.kicker + '</div><div style="font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--text);margin-bottom:12px;">' + LENGTH_WORDS.title(w.weeks) + '</div><div style="font-size:13px;color:var(--muted);line-height:1.6;margin-bottom:20px;">'
    + w.msg + '<br><br>' + b.before + '<b style="color:var(--text)">' + b.bold + '</b>' + b.after + '</div><div style="display:flex;gap:10px;">'
    + '<button id="lengthWarnBack" style="flex:1;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0;padding:12px;border-radius:999px;border:1px solid var(--border2);background:transparent;color:var(--muted);cursor:pointer;">' + LENGTH_WORDS.back + '</button>'
    + '<button id="confirmGenBtn" style="flex:2;font-family:var(--font-display);font-size:14px;font-weight:700;letter-spacing:0;padding:12px;border-radius:999px;border:none;background:var(--accent);color:var(--on-ink);cursor:pointer;">' + LENGTH_WORDS.build(w.weeks) + '</button></div></div>';
}

// ── The cardio goals as the page's markup (typed by hand from renderWizardStep's cardio_goal branch) ─────────────
const CAPTION = 'font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0;';
const numberField = (style: string, placeholder: string, value: string, oninput: string, limits: string): string =>
  '<input type="number" class="input-field" style="' + style + '" placeholder="' + placeholder + '" value="' + value + '" oninput="' + oninput + '" ' + limits + '>';
/** A minutes and seconds pair with their captions (the target times, the mile). */
const captioned = (p: TimePair, sport: string, after: string): string => {
  const on = (key: string): string => 'WD.cardioGoals[\'' + sport + '\'].' + key + '=this.value;' + after;
  return '<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;text-align:center">' + numberField('text-align:center', 'min', p.mins, on(p.minsKey), 'min="' + p.lo + '" max="' + p.hi + '"')
    + '<div style="' + CAPTION + '">minutes</div></div><div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div><div style="flex:1;text-align:center">'
    + numberField('text-align:center', 'sec', p.secs, on(p.secsKey), 'min="0" max="59"') + '<div style="' + CAPTION + '">seconds</div></div></div>';
};
/** A minutes and seconds pair with no captions (the swim's current times). */
const flat = (mins: string, secs: string, minsKey: string, secsKey: string): string => {
  const on = (key: string): string => 'WD.cardioGoals[\'swim\'].' + key + '=this.value;updateSwimAdvisory()';
  return '<div style="display:flex;align-items:center;gap:6px">' + numberField('text-align:center;flex:1', 'min', mins, on(minsKey), 'min="0" max="99"')
    + '<div style="font-size:20px;color:var(--muted);font-weight:300;flex-shrink:0">:</div>' + numberField('text-align:center;flex:1', 'sec', secs, on(secsKey), 'min="0" max="59"') + '</div>';
};
const advisoryLine = (id: string, a: Advisory): string =>
  '<div id="' + id + '" style="font-size:11px;line-height:1.45;margin-top:6px;display:' + (a.text ? 'block' : 'none') + ';color:' + a.color + '">' + a.text + '</div>';
const unitPair = (fn: string, a: string, b: string, on: string): string =>
  '<div style="display:flex;gap:0;border:1px solid var(--border2);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;flex-shrink:0"><button onclick="' + fn + '(\'' + a + '\')" style="' + unitButtonStyle(on === a, false) + '">' + a
  + '</button><button onclick="' + fn + '(\'' + b + '\')" style="' + unitButtonStyle(on === b, true) + '">' + b + '</button></div>';
const seedBanner = (sd: SeedView | null): string => (!sd ? ''
  : sd.applied ? '<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">' + asyIcon('chart', 12) + ' Estimated from “' + sd.prog + '”. Edit if you know better.</div>'
    : '<div style="background:var(--surface);border:1px solid var(--accent);border-radius:16px;padding:12px 14px;margin-bottom:12px"><div style="font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0;color:var(--text);margin-bottom:4px">'
      + asyIcon('chart', 13) + ' Seed from “' + sd.prog + '”?</div><div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">' + sd.found
      + '</div><div style="display:flex;gap:8px"><button class="prog-action-btn primary" style="flex:1" onclick="applySeedData()">Use this data</button><button class="prog-action-btn" style="flex:1" onclick="dismissSeedData()">Start fresh</button></div></div>');
const mileBlock = (m: MileField): string =>
  '<div class="input-group" style="margin-top:8px"><div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">' + m.help + '</span></div>'
  + captioned(m.pair, 'run', 'WD.cardioGoals[\'run\'].mileBestSrc={kind:\'entered\'};updateRaceDateFeedback();updateMileAdvisory()') + advisoryLine('mileAdvisory', m.advisory) + '</div>';

function formMarkup(sport: string, f: CardioForm): string {
  const label = (t: string): string => '<div class="input-label" style="margin-bottom:6px">' + t + '</div>';
  if (f.kind === 'swim') {
    return '<div style="margin-top:10px">' + label('Distance') + '<div style="display:flex;gap:0;align-items:stretch"><input type="number" class="input-field" style="border-radius:12px 0 0 8px;flex:1;background:var(--surface2);color:var(--muted)" value="' + f.dist + '" readonly>'
      + unitPair('setSwimUnit', 'yd', 'm', f.unit) + '</div></div>'
      + '<div style="margin-top:10px">' + label('Target time') + captioned(f.target, 'swim', 'updatePaceTime(\'swim\');updateSwimPaceDisplay()')
      + '<div id="swimPaceLine" style="font-size:12px;color:var(--accent);margin-top:6px;display:' + (f.paceShown ? 'block' : 'none') + '">' + f.paceLine + '</div></div>'
      + '<div style="margin-top:8px">' + label(f.baseLabel) + flat(f.baseMins, f.baseSecs, 'baseMins', 'baseSecs') + advisoryLine('swimAdvisory', f.advisory) + '</div>'
      + (f.base500 ? '<div style="margin-top:8px">' + label(f.base500.label) + '<div style="font-size:11px;line-height:1.45;color:var(--muted);margin-bottom:6px">Your repeats key off your 500 pace. Your 100 time sets the goal.</div>'
        + flat(f.base500.mins, f.base500.secs, 'base500Mins', 'base500Secs') + '</div>' : '');
  }
  if (f.kind === 'pace') {
    return '<div style="margin-top:10px">' + label('Target distance') + '<div style="display:flex;gap:0;align-items:stretch">'
      + numberField('border-radius:12px 0 0 8px;flex:1', 'e.g. 1.5', f.dist, 'WD.cardioGoals[\'run\'].targetDist=this.value;updateRaceDateFeedback()', 'min="0.1" step="0.1"') + unitPair('setPaceUnit', 'mi', 'km', f.unit) + '</div></div>'
      + '<div style="margin-top:10px">' + label('Target time') + captioned(f.target, 'run', 'updatePaceTime(\'run\');updateRaceDateFeedback()')
      + '<div id="paceDisplayLine" style="font-size:12px;color:var(--accent);margin-top:6px;display:' + (f.paceShown ? 'block' : 'none') + '">' + f.paceLine + '</div><div id="paceFeasLine" style="display:none"></div></div>'
      + seedBanner(f.seed) + '<div class="input-group" style="margin-top:8px"><div class="input-label">How far can you currently run? (optional)</div><div style="display:flex;gap:8px;align-items:center">'
      + numberField('flex:1', 'e.g. 1.5', f.baseline, 'WD.cardioGoals[\'run\'].baselineDist=this.value;WD.cardioGoals[\'run\'].baseline=this.value+(WD.cardioGoals[\'run\']?.paceUnit||\'mi\');updateRaceDateFeedback()', 'min="0" step="0.1"')
      + '<span style="font-size:13px;color:var(--muted);flex-shrink:0">' + f.unit + '</span></div></div>' + mileBlock(f.mile);
  }
  return seedBanner(f.seed) + '<div class="input-group" style="margin-top:10px"><div class="input-label">' + f.question + ' (optional)</div><div style="display:flex;gap:8px;align-items:center">'
    + numberField('flex:1', f.placeholder, f.baseline, 'WD.cardioGoals[\'' + sport + '\'].baselineDist=this.value;WD.cardioGoals[\'' + sport + '\'].baseline=this.value+\'' + baselineSuffix(sport) + '\'' + (sport === 'run' ? ';updateRaceDateFeedback()' : ''), 'min="0" step="' + f.step + '"')
    + '<span style="font-size:13px;color:var(--muted);flex-shrink:0">' + f.unitWord + '</span></div></div>' + (f.mile ? mileBlock(f.mile) : '');
}

const RACE_LABEL = 'font-size:11px;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:0;';
const RACE_ON = 'WD.eventTargeted=true;if(!WD.raceDate){const t=new Date();WD.raceDate=t.getFullYear()+\'-\'+String(t.getMonth()+1).padStart(2,\'0\')+\'-\'+String(t.getDate()).padStart(2,\'0\');}renderWizardStep()';
const RACE_OFF = 'WD.eventTargeted=false;WD.raceDate=\'\';WD.raceDateWeeks=null;renderWizardStep()';
function footerMarkup(ft: CardioFooter): string {
  const r = ft.race;
  return '<div style="background:var(--surface);border:1px solid var(--border2);border-radius:16px;padding:12px 14px;margin-top:4px"><div style="font-size:12px;color:var(--muted);line-height:1.6"> <span id="progLenLine">' + ft.progLen + '</span> '
    + (ft.multi ? '<br>Sessions rotate across training days. Each sport gets its own days.' : '') + ' </div>'
    + (r ? '<div style="margin-top:10px"><div style="' + RACE_LABEL + 'margin-bottom:6px">Race date</div><div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:16px;overflow:hidden;margin-bottom:8px">'
      + '<button onclick="' + RACE_ON + '" style="' + raceButtonStyle(r.targeted) + '">✓ I have a race date</button><button onclick="' + RACE_OFF + '" style="' + raceButtonStyle(!r.targeted) + '">✕ Just building fitness</button></div>'
      + (r.targeted ? '<div><div style="' + RACE_LABEL + 'margin-bottom:8px">Race date</div><input type="date" id="raceDateInput" value="' + r.value + '" min="' + r.min + '" oninput="WD.raceDate=this.value;updateRaceDateFeedback()" '
        + 'style="width:100%;background:var(--surface2);border:1.5px solid var(--accent);border-radius:12px;color:var(--text);font-family:var(--font-display);font-size:17px;font-weight:700;letter-spacing:0;padding:13px 14px;outline:none;box-sizing:border-box;color-scheme:dark;-webkit-appearance:none;cursor:pointer">'
        + '<div id="raceDateFeedback" style="margin-top:8px"></div><div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">Tap to open the calendar. The final weeks taper so you arrive fresh.</div></div>'
        : '<div style="font-size:11px;color:var(--muted);line-height:1.5">' + r.copy + '</div>') + '</div>' : '') + '</div>';
}

/** The Expo app's cardio goals step as the markup today's page writes for a whole draw (before its tail repaints the lines it owns). */
export function cardioMarkup(c: CardioStep): string {
  return head(W.cardio) + '<div style="display:flex;flex-direction:column;gap:10px">' + c.sports.map((s) =>
    '<div style="background:var(--surface);border:1.5px solid ' + (s.sel ? 'var(--accent)' : 'var(--border)') + ';border-radius:16px;overflow:hidden"><div onclick="toggleCardioTypeSport(\'' + s.id + '\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:'
    + (s.sel ? 'var(--accent-dim)' : 'transparent') + '"><div>' + asyIcon(s.icon, 24) + '</div><div style="flex:1"><div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:' + (s.sel ? 'var(--accent)' : 'var(--text)') + '">' + s.name
    + '</div><div style="font-size:11px;color:var(--muted);margin-top:2px">' + s.desc + '</div></div><div style="font-size:20px;color:var(--accent);opacity:' + (s.sel ? 1 : 0) + '">✓</div></div>'
    + (s.sel ? '<div style="padding:0 14px 14px;border-top:1px solid var(--border)"><div style="padding-top:10px;display:flex;flex-direction:column;gap:6px">'
      + s.goals.map((g) => '<div class="goal-option' + (g.sel ? ' selected' : '') + '" onclick="setCardioGoal(\'' + s.id + '\',\'' + g.id + '\')"><div class="goal-option-label">' + g.label + '</div><div class="goal-option-desc">' + g.desc + '</div></div>').join('')
      + '</div>' + (s.form ? formMarkup(s.id, s.form) : '') + '</div>' : '') + '</div>').join('') + '</div>' + (c.footer ? footerMarkup(c.footer) : '');
}

// ── The kinds the cardio goals draw (the measure's names) ────────────────────────────────────────────────────────
const plain = (h: string): string => h.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
export const cardKind = (h: string | null): string => {
  if (h === null) return 'none on the step';
  const t = plain(h), hue = ' [' + ((/color:var\(--([\w-]+)\)/.exec(h) || [])[1] || '') + ']';
  if (!t) return 'empty';
  if (/already passed/.test(t)) return 'the date has passed' + hue;
  if (/Less than a week away/.test(t)) return 'less than a week away' + hue;
  if (/The program ends on it/.test(t)) return 'test in week 2 or later' + (/that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/Your test is in week 1\. Nothing is left/.test(t)) return 'test in week 1, nothing left to train' + (/that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/Your test is this week/.test(t)) return 'test this week' + (/that reaches/.test(t) ? ', with the reach sentence' : '') + hue;
  if (/before your first training day/.test(t)) return 'test before the first training day' + hue;
  if (/The test block is/.test(t)) return 'test past the test block' + hue;
  if (/so it peaks on race week/.test(t)) return 'race plan starts later' + hue;
  if (/You open in/.test(t)) return 'race plan opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '') + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t) ? ', the shorter plan offered' : '') + hue;
  if (/before race day\. Use the extra time/.test(t)) return 'finishes before race day' + hue;
  if (/Perfect timing/.test(t)) return 'peaks on race day' + hue;
  if (/is short for this goal/.test(t)) return 'short for this goal' + hue;
  return 'UNNAMED ' + t.slice(0, 50);
};
const lengthKind = (h: string): string => { const t = plain(h); return (/your mile time sets it/.test(t) ? 'your mile time sets it' : /Your test sets it/.test(t) ? 'the test sets it' : /Set by your longest/.test(t) ? 'set by the longest goal' : 'UNNAMED ' + t) + (/: 1 week\./.test(t) ? ' (1 week)' : ''); };
const reachKind = (h: string): string => (!h ? 'hidden' : /Your mile is/.test(h) ? 'from the mile entered' : /You have not entered a mile time/.test(h) ? 'from the level default' : 'UNNAMED ' + plain(h).slice(0, 40));
const mileAdvKind = (t: string): string => (!t ? 'none' : /^Required/.test(t) ? 'required' : /not a real time/.test(t) ? 'not a real time' : /Under 3:00/.test(t) ? 'under 3:00' : /Over 25:00/.test(t) ? 'over 25:00' : /fastest row/.test(t) ? 'the chart\'s fastest row' : /12:00 row/.test(t) ? 'the chart\'s slowest row' : 'UNNAMED ' + t);
const mileHelpKind = (t: string): string => (/^Required/.test(t) ? 'required' : t === 'Optional.' ? 'optional, bare' : /come from an /.test(t) ? 'optional, an N mile' : /come from a /.test(t) ? 'optional, a N mile' : 'UNNAMED ' + t);
const swimAdvKind = (t: string): string => (!t ? 'none' : /timed 500/.test(t) ? 'required, the 500' : /timed 100/.test(t) ? 'required, the 100' : /not a real time/.test(t) ? 'not a real time' : /faster than your 100/.test(t) ? '500 pace faster than the 100' : 'UNNAMED ' + t);
/** The number fields a form draws, each with the key it writes and the kind of field it is to its handler. */
export function formFields(sport: string, f: CardioForm): { key: string; field: CardioField }[] {
  if (f.kind === 'swim') {
    return [{ key: 'targetMins', field: 'swimTarget' }, { key: 'targetSecs', field: 'swimTarget' }, { key: 'baseMins', field: 'swimBase' }, { key: 'baseSecs', field: 'swimBase' },
      ...(f.base500 ? [{ key: 'base500Mins', field: 'swimBase' as const }, { key: 'base500Secs', field: 'swimBase' as const }] : [])] as { key: string; field: CardioField }[];
  }
  const mile: { key: string; field: CardioField }[] = [{ key: 'mileBestMins', field: 'mile' }, { key: 'mileBestSecs', field: 'mile' }];
  if (f.kind === 'pace') return [{ key: 'targetDist', field: 'runDist' }, { key: 'targetMins', field: 'runTarget' }, { key: 'targetSecs', field: 'runTarget' }, { key: 'baselineDist', field: 'paceBaseline' }, ...mile];
  return [{ key: 'baselineDist', field: 'baseline' }, ...(sport === 'run' ? mile : [])];
}
function countCardio(T: WizardTally, v: CardioView, whole: boolean): void {
  const k = (s: string, n = 1): void => bump(T, 'cardio_goal: ' + s, n);
  k(whole ? 'whole draws' : 'repaints in place');
  const c = v.cardio, p = v.paint;
  for (const s of c.sports) {
    const f = s.form;
    if (!f) { if (s.sel) k('a sport open with no goal picked'); continue; }
    k('form: ' + (f.kind === 'swim' ? (f.base500 ? 'swim 100 (the 500 row too)' : 'swim 500') : f.kind === 'pace' ? 'run pace goal' : 'baseline, ' + s.id));
    k('number fields', formFields(s.id, f).length + (f.kind === 'swim' ? 1 : 0));
    if (f.kind !== 'swim') { k('seed banner: ' + (f.seed ? (f.seed.applied ? 'applied line' : 'the offer') : 'none')); if (f.mile) k('mile help: ' + mileHelpKind(f.mile.help)); }
  }
  if (!c.footer) k('no box under the cards');
  else {
    if (c.footer.multi) k('the line for more than one sport');
    k('race block: ' + (!c.footer.race ? 'none (not the race path)' : c.footer.race.targeted ? 'the date field' : /time trial/.test(c.footer.race.copy) ? 'the time trial copy' : 'the holds copy'));
  }
  if (p.progLen !== null) k('length line: ' + lengthKind(p.progLen));
  k('card under the date: ' + cardKind(p.card));
  if (p.feas !== null) k('pace reach: ' + reachKind(p.feas));
  if (p.pace !== null) k('pace line ' + (p.pace ? 'shown' : 'hidden'));
  if (p.swimPace !== null) k('swim pace line ' + (p.swimPace ? 'shown' : 'hidden'));
  if (p.mileAdvisory) k('mile advisory: ' + mileAdvKind(p.mileAdvisory.text));
  if (p.swimAdvisory) k('swim advisory: ' + swimAdvKind(p.swimAdvisory.text));
}

// ── The kinds a draw holds ───────────────────────────────────────────────────────────────────────────────────────
const resolveKind = (t: string): string => (/That week holds your test/.test(t) ? 'the week holds the test' : /Nothing left to train that week/.test(t) ? 'moved to the next Monday' : /Week 1 is short/.test(t) ? 'a short first week' : 'a whole first week');
const alignedKind = (t: string): string => (/so it peaks on race week/.test(t) ? 'starts later' : 'opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '')) + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t) ? ', the shorter plan\'s link' : '');
const raceRowKind = (r: string | undefined): string => (r === undefined ? 'none' : /No date set/.test(r) ? 'no date set' : / away\)$/.test(r) ? 'a date, N away' : /\(race day\)$/.test(r) ? 'a date, race day' : /\(behind you\)$/.test(r) ? 'a date, behind you' : 'a date alone');
function countStep(T: WizardTally, v: StepView, whole = true): void {
  const k = (s: string, n = 1): void => bump(T, v.step + ': ' + s, n);
  if (whole) k('draws');
  if (v.step === 'cardio_goal') countCardio(T, v, whole);
  if (!whole) return;
  if (v.step === 'primary' || v.step === 'equipment') { k('cards', v.choices.length); k('a card chosen', v.choices.filter((c) => c.sel).length); }
  else if (v.step === 'profile') { k('experience ' + (v.profile.experience.find((c) => c.sel)?.id || 'none')); k(v.profile.ageLabel.replace(':', '')); k(v.profile.kg ? 'kg' : 'lbs'); }
  else if (v.step === 'cardio_goal') { for (const s of v.cardio.sports) { k(s.sel ? 'sport open' : 'sport shut'); k('goal options', s.goals.length); k('a goal chosen', s.goals.filter((g) => g.sel).length); } }
  else if (v.step === 'lifting_focus') { k('focus cards', v.lifting.choices.length); k(v.lifting.addOn ? (v.lifting.addOn.liftOnly ? 'add-on, Lift Only chosen' : 'add-on, a sport chosen') : 'no add-on'); }
  else if (v.step === 'days') {
    k('days resting', v.days.days.filter((x) => x.rest).length); k('days locked', v.days.days.filter((x) => x.blocked).length);
    k(v.days.floor ? (v.days.floor.reason ? 'floor box, a goal named' : 'floor box, three days') : 'no floor box');
    if (v.days.advisories.length) k('advisory box');
  } else {
    const n = v.name;
    if (n.aligned) { k('start set by race date: ' + alignedKind(n.aligned.copy)); k(n.aligned.pips ? 'pips drawn' : 'no pips'); }
    else k('start field: ' + resolveKind(n.resolveCopy));
    k('rows', n.rows.length);
    k('race date row: ' + raceRowKind(n.rows.find((r) => r.k === 'Race date')?.v));
    const start = n.rows.find((r) => r.k === 'Start date')!.v;
    k('start row: ' + (/set by race date/.test(start) ? 'set by race date' : /short first week/.test(start) ? 'short first week' : 'the date alone'));
  }
}

// ── The two wizards ──────────────────────────────────────────────────────────────────────────────────────────────
/** The lines the page repaints in place, and the fields it reads: on the page only while the step's markup holds them. */
const IN_BODY = ['raceDateInput', 'raceDateFeedback', 'paceFeasLine', 'paceDisplayLine', 'progLenLine', 'swimPaceLine', 'mileAdvisory', 'swimAdvisory', 'startResolve', 'sumStartDate', 'wizStartDate'];

/** What Generate left, on both apps. */
export interface Generated { prog: ScreenProgram; id: string; popUp: boolean; refused: string | null }

/** The wizard open on the page and in the Expo app, over one stored state. */
export class TwoWizards {
  readonly P: Phone;
  readonly store: StateStore;
  readonly T: WizardTally;
  readonly what: string;
  st!: WizardState;
  /** The step in hand as the Expo app last drew it whole, its repainted lines as they stand since. */
  view!: StepView;
  private shell!: { fill: string; label: string; next: string };
  /** Every pop-up overlay the page appended to its body, newest last. */
  private overlays: { innerHTML: string }[] = [];

  constructor(P: Phone, T: WizardTally, what: string, store: StateStore = phoneStore(P, sqliteTestStore())) {
    this.P = P; this.T = T; this.what = what; this.store = store;
    const doc = P.IA.window['document'];
    const base = doc.getElementById;
    P.IA.ctx['__renders'] = 0;
    P.ev('renderWizardStep=(function(o){return function(){__renders++;return o.apply(this,arguments);};})(renderWizardStep)');
    let seen = -1;
    doc.getElementById = (id: string) => {
      if (!IN_BODY.includes(id)) return base(id);
      const body = String(base('wizardBody').innerHTML || '');
      const n: number = P.ev('__renders');
      if (n !== seen) {
        seen = n;
        for (const x of IN_BODY) {
          const m = new RegExp('<(\\w+)[^>]*\\bid="' + x + '"[^>]*>').exec(body);
          if (!m) continue;
          const el = base(x), tag = m[0];
          const val = /\bvalue="([^"]*)"/.exec(tag); if (val) el.value = val[1];
          el.style.display = (/display:\s*(\w+)/.exec(tag) || [])[1] || '';
          el.style.color = (/[;"]color:([^;"]+)/.exec(tag) || [])[1] || '';
          if (m[1] !== 'input') {
            const rest = body.slice(m.index + tag.length), inner = rest.slice(0, rest.indexOf('</' + m[1] + '>'));
            el.innerHTML = inner; el.textContent = inner.replace(/<[^>]+>/g, '');
          }
        }
      }
      return new RegExp('\\bid="' + id + '"').test(body) ? base(id) : null;
    };
    const add = doc.body.appendChild;
    doc.body.appendChild = (x: { innerHTML: string }) => { this.overlays.push(x); return add.call(doc.body, x); };
  }
  get now(): Date { return launchNow(this.P); }
  get draft(): Draft { return this.st.draft; }
  private get pageStep(): number { return this.P.ev('wizardStep') as number; }
  private pageDraft(): string { return this.P.ev('JSON.stringify(WD)') as string; }

  /** Both apps held equal: the step, the draft, the bar, the step's markup, and every ia_ key. */
  same(tap: string, whole = true): StepView {
    const what = this.what + ', ' + tap;
    assert.equal(this.st.step, this.pageStep, what + ': the step');
    if (whole) { const drawn = wizardView(this.store, this.st, this.now); this.shell = drawn.shell; this.view = drawn.view; }
    const shell = this.shell, view = this.view;
    // The page's draw wrote its defaults before this (a race date, a name); the Expo app's view just did.
    sameText(J(this.draft), this.pageDraft(), what + ': the draft');
    const el = (id: string, prop: string): string => String(this.P.ev(`(function(){var v=document.getElementById(${J(id)}).${prop};return v==null?'':v;})()`));
    assert.equal(shell.label, el('wizardStepLabel', 'textContent'), what + ': the count');
    assert.equal(shell.next, el('wizardNext', 'textContent'), what + ': the last button');
    assert.equal(shell.fill, el('wizardFill', 'style.width'), what + ': the bar');
    // A whole draw: every tag, attribute and word of the step, as the page wrote it before its tail repainted.
    if (whole) sameText(tight(stepMarkup(view)), tight(el('wizardBody', 'innerHTML')), what + ': the step\'s markup');
    if (view.step === 'cardio_goal') this.samePaint(view.paint, what);
    assert.equal(view.step, WIZARD_STEPS[this.st.step], what + ': the view\'s step');
    countStep(this.T, view, whole);
    sameStore(held(this.store), this.P.dump(), what + ': the store');
    return view;
  }

  /** Build New Program on both. */
  open(): StepView {
    this.P.ev('startWizard()');
    this.st = startWizard(this.now);
    bump(this.T, 'opened');
    return this.same('Build New Program');
  }
  /** A draft set whole on both (the seeded configs, and drafts no walk of this session's taps makes), on a step. */
  whole(draft: unknown, step: string): StepView {
    this.P.IA.ctx['__J'] = J(draft);
    const i = WIZARD_STEPS.indexOf(step as never);
    this.P.ev('Object.keys(WD).forEach(function(k){delete WD[k];});Object.assign(WD,JSON.parse(__J));wizardStep=' + i + ';renderWizardStep();');
    this.st = { step: i, draft: JSON.parse(J(draft)) as Draft };
    bump(this.T, 'drafts set whole');
    return this.same('a draft set whole on ' + step);
  }
  /** One tap: the page's handler and the Expo app's, then both held equal, the toast with them. */
  tap(name: string, page: string, mine: () => FloorToast | null | void): StepView {
    const t0 = this.P.toasts.length;
    this.P.ev(page);
    const toast = mine() || null;
    const said = this.P.toasts.slice(t0);
    assert.deepEqual(toast ? [floorToastMarkup(toast)] : [], said, this.what + ', ' + name + ': the toast');
    if (toast) bump(this.T, 'toast: ' + (/^Switched to the /.test(toast.text) ? 'switched to the shorter plan' : /needs \d training days/.test(toast.text) ? 'the floor, a goal named' : 'the floor, three days'));
    bump(this.T, 'taps');
    return this.same(name);
  }
  choose(key: 'primaryPath' | 'experience' | 'ageBracket' | 'equipment' | 'liftingFocus', id: string): StepView {
    return this.tap(key + ' ' + id, 'WD.' + key + '=' + J(id) + ';renderWizardStep()', () => setChoice(this.st, key, id));
  }
  unit(u: string): StepView { return this.tap('unit ' + u, 'setUnit(' + J(u) + ')', () => setUnit(this.st, u)); }
  next(): StepView {
    assert.notEqual(WIZARD_STEPS[this.st.step], 'name', this.what + ': Continue is not the last button');
    return this.tap('Continue', 'wizardNext()', () => { assert.equal(wizardNext(this.st), false); });
  }
  /** Back on any step but the first. */
  back(): StepView { return this.tap('Back', 'wizardBack()', () => { assert.equal(wizardBack(this.st), false); }); }
  /** Back on the first step: both leave for the Programs tab, and nothing is stored. */
  leave(): void {
    this.P.ev('__screens=[];showScreen=(function(o){return function(id){__screens.push(id);return o.apply(this,arguments);};})(showScreen);wizardBack();');
    assert.equal(wizardBack(this.st), true, this.what + ': Back on the first step leaves');
    assert.deepEqual(JSON.parse(this.P.ev('JSON.stringify(__screens)') as string), ['screenHome'], this.what + ': the page shows the Programs tab');
    sameStore(held(this.store), this.P.dump(), this.what + ', Back on the first step: the store');
    bump(this.T, 'left by Back');
  }
  day(d: string): StepView { return this.tap('the day ' + d, 'toggleRestDay(' + J(d) + ')', () => toggleRestDay(this.st, d)); }
  sport(t: string): StepView { return this.tap('the sport ' + t, 'toggleCardioTypeSport(' + J(t) + ')', () => toggleCardioTypeSport(this.st, t)); }
  liftOnly(): StepView { return this.tap('Lift Only', 'WD.cardioTypes=[];WD.cardioGoals={};renderWizardStep()', () => liftOnly(this.st)); }
  /** The name typed: the page's field writes the draft and draws nothing; drawn again here so both are read whole. */
  name(v: string): StepView { return this.tap('the name typed', 'WD.name=' + J(v) + ';renderWizardStep()', () => setName(this.st, v)); }
  /**
   * The start date picked (or blanked by Reset). The page repaints two lines in place, the copy under the field and
   * the summary's start row: each is read as the page left it, then the step is drawn again and held whole.
   */
  start(v: string): StepView {
    const what = this.what + ', the start date ' + (v || 'blank');
    this.P.ev('WD.startDate=' + J(v) + ';updateStartResolve()');
    setStart(this.st, v);
    const { view } = wizardView(this.store, JSON.parse(J(this.st)) as WizardState, this.now);
    assert.equal(view.step, 'name');
    if (view.step === 'name' && !view.name.aligned) {
      sameText(view.name.resolveCopy, String(this.P.ev("document.getElementById('startResolve').innerHTML")), what + ': the copy under the field, repainted in place');
      const row = view.name.rows.find((r) => r.k === 'Start date')!.v.replace(/^<span id="sumStartDate">|<\/span>$/g, '');
      sameText(row, String(this.P.ev("document.getElementById('sumStartDate').textContent")), what + ': the summary\'s start row, repainted in place');
      bump(this.T, 'start date repaints');
    }
    // A blank start is today from the next draw on (the page's draw writes it), on both.
    this.P.ev('renderWizardStep()');
    bump(this.T, 'taps');
    return this.same('the start date ' + (v || 'blank'));
  }


  // ── The cardio goals' taps (the second session) ──────────────────────────────────────────────────────────────
  /** The step's markup as the page last wrote it whole. */
  private body(): string { return String(this.P.ev("document.getElementById('wizardBody').innerHTML")); }
  /** The one handler of its kind on the page that holds `part`: read out of the markup the page wrote, never typed in. */
  private handler(attr: 'onclick' | 'oninput', part: string): string {
    const card = /\bid="raceDateFeedback"/.test(this.body()) ? String(this.P.ev("document.getElementById('raceDateFeedback').innerHTML")) : '';
    const hits = [...(this.body() + card).matchAll(new RegExp('\\b' + attr + '="([^"]*)"', 'g'))].map((m) => m[1]!).filter((h) => h.includes(part));
    assert.equal(hits.length, 1, this.what + ': one ' + attr + ' on the page holds "' + part + '", found ' + hits.length);
    return hits[0]!;
  }
  /** The cardio goals step in hand, as the Expo app holds it. */
  private get cardio(): Extract<StepView, { step: 'cardio_goal' }> {
    assert.equal(this.view.step, 'cardio_goal', this.what + ': on the cardio goals');
    return this.view as Extract<StepView, { step: 'cardio_goal' }>;
  }
  /** A line the page repaints in place, as it stands on the page: null when the step does not hold it, '' when hidden. */
  private pageLine(id: string, prop: 'innerHTML' | 'textContent'): string | null {
    if (!new RegExp('\\bid="' + id + '"').test(this.body())) return null;
    return String(this.P.ev(`(function(){var e=document.getElementById(${J(id)});return e.style.display==='none'?'':String(e.${prop});})()`));
  }
  private pageAdvisory(id: string): { text: string; color: string } | null {
    const text = this.pageLine(id, 'textContent');
    return text === null ? null : { text, color: String(this.P.ev(`document.getElementById(${J(id)}).style.color`)) };
  }
  /** The seven lines the page repaints in place and the race date's field, held equal to the Expo app's as they stand. */
  private samePaint(p: CardioPaint, what: string): void {
    const page: CardioPaint = {
      raceField: /\bid="raceDateInput"/.test(this.body()) ? String(this.P.ev("document.getElementById('raceDateInput').value")) : null,
      progLen: this.pageLine('progLenLine', 'innerHTML'), pace: this.pageLine('paceDisplayLine', 'innerHTML'), feas: this.pageLine('paceFeasLine', 'innerHTML'),
      card: this.pageLine('raceDateFeedback', 'innerHTML'), swimPace: this.pageLine('swimPaceLine', 'innerHTML'),
      mileAdvisory: this.pageAdvisory('mileAdvisory'), swimAdvisory: this.pageAdvisory('swimAdvisory'),
    };
    for (const k of Object.keys(page) as (keyof CardioPaint)[]) sameText(J(p[k]), J(page[k]), what + ': the line the page repaints in place, ' + k);
  }
  /** A tap that draws the cardio goals whole on the page: its own onclick, and the Expo app's tap. */
  private wholeTap(name: string, part: string, mine: () => FloorToast | null | void): StepView {
    return this.tap(name, this.handler('onclick', part), mine);
  }
  goal(sport: string, id: string): StepView { return this.wholeTap('the goal ' + id, 'setCardioGoal(\'' + sport + '\',\'' + id + '\')', () => setCardioGoal(this.st, sport, id)); }
  paceUnit(u: string): StepView { return this.wholeTap('the pace unit ' + u, 'setPaceUnit(\'' + u + '\')', () => setPaceUnit(this.st, u)); }
  swimUnit(u: string): StepView { return this.wholeTap('the swim unit ' + u, 'setSwimUnit(\'' + u + '\')', () => setSwimUnit(this.st, u)); }
  seedUse(): StepView { return this.wholeTap('Use this data', 'applySeedData()', () => { assert.equal(applySeedData(this.st), true, this.what + ': a seed to apply'); }); }
  seedFresh(): StepView { return this.wholeTap('Start fresh', 'dismissSeedData()', () => dismissSeedData(this.st)); }
  targeted(on: boolean): StepView { return this.wholeTap(on ? 'I have a race date' : 'Just building fitness', 'WD.eventTargeted=' + on + ';', () => raceTargeted(this.st, on, this.now)); }
  /** The shorter plan's link, in the card under the race date or under a start set by a race date: the goal the Expo app's own line names. */
  shorter(): StepView {
    const v = this.view;
    const html = v.step === 'cardio_goal' ? v.paint.card || '' : v.step === 'name' && v.name.aligned ? v.name.aligned.copy : '';
    const link = copyRuns(html).find((r) => r.link !== null);
    assert.ok(link, this.what + ': the Expo app\'s line holds the shorter plan\'s link');
    const view = this.wholeTap('the shorter plan link', 'offerShorterPlan(\'' + link!.link + '\')', () => offerShorterPlan(this.st, link!.link!));
    bump(this.T, 'the shorter plan link tapped, on ' + view.step);
    return view;
  }
  /**
   * A value handed back by one of the step's number fields: the page's own oninput with it, and the Expo app's
   * handler for that field. Nothing is drawn whole: the lines each repaints are held equal as they stand.
   */
  type(sport: string, key: string, v: string): StepView {
    const what = this.what + ', ' + sport + '.' + key + ' typed "' + v + '"';
    const form = this.cardio.cardio.sports.find((s) => s.id === sport)!.form;
    assert.ok(form, what + ': the sport\'s form is drawn');
    const f = formFields(sport, form!).find((x) => x.key === key);
    assert.ok(f, what + ': the form draws that field');
    this.P.IA.ctx['__v'] = v;
    this.P.ev('(function(){' + this.handler('oninput', 'cardioGoals[\'' + sport + '\'].' + key + '=this.value') + '}).call({value:__v})');
    this.cardio.paint = editCardioField(this.st, this.cardio.paint, f!.field, sport, key, v, this.now);
    bump(this.T, 'taps'); bump(this.T, 'values typed');
    return this.same(sport + '.' + key + ' typed "' + v + '"', false);
  }
  /** A day handed back by the race date's field (a pick, or Reset's day): the field's own oninput, and the Expo app's. */
  raceDay(v: string): StepView {
    this.P.IA.ctx['__v'] = v;
    this.P.ev('(function(){var e=document.getElementById("raceDateInput");e.value=__v;(function(){' + this.handler('oninput', 'WD.raceDate=this.value') + '}).call(e);})()');
    this.cardio.paint = setRaceDate(this.st, this.cardio.paint, v, this.now);
    bump(this.T, 'taps'); bump(this.T, 'race days handed back');
    return this.same('the race day ' + (v || 'blank'), false);
  }
  /** Reset on the race date's calendar: WebKit hands back the day the field was drawn with (its value attribute), which is the Expo app's footer value. */
  raceReset(): StepView {
    const attr = (/<input type="date" id="raceDateInput" value="([^"]*)"/.exec(tight(this.body())) || [])[1];
    const mine = this.cardio.cardio.footer!.race!.value;
    assert.equal(mine, attr, this.what + ': the day Reset goes back to is the day the field was drawn with');
    bump(this.T, 'race date Reset');
    return this.raceDay(mine);
  }

  /** The pop-up the page has up, as its markup; none is ''. */
  private pagePopUp(): string {
    const o = this.overlays[this.overlays.length - 1];
    return o && this.P.ev("!!document.getElementById('confirmGenBtn').onclick") ? tight(String(o.innerHTML)) : '';
  }
  private press(id: string): void { this.P.ev(`(function(){var b=document.getElementById(${J(id)});var f=b.onclick;document.getElementById('confirmGenBtn').onclick=null;document.getElementById('lengthWarnBack').onclick=null;f();})()`); }

  /**
   * Generate Program on both, to the end: the pop-up when the length warns (Go Back first when `goBack`, which leaves
   * the wizard as it was, then the button again and Build), the refusal, or the generating screen's lines, the build,
   * the store, the program in hand and This Week.
   */
  generate(goBack = false): Generated {
    const what = this.what + ', Generate';
    assert.equal(WIZARD_STEPS[this.st.step], 'name', what + ': the last step');
    const P = this.P;
    P.ev("__lines=[];(function(){var e=document.getElementById('generateSub');if(e.__watched)return;e.__watched=true;var v=e.textContent;Object.defineProperty(e,'textContent',{configurable:true,get:function(){return v;},set:function(x){v=x;__lines.push(String(x));}});})()");
    const pre = J(P.dump()), t0 = P.toasts.length;
    for (let round = 0; ; round++) {
      P.ev('wizardNext()');
      assert.equal(wizardNext(this.st), true, what + ': the last button generates');
      const warn = lengthWarning(this.draft);
      sameText(warn ? tight(warningMarkup(warn)) : '', this.pagePopUp(), what + ': the pop-up');
      bump(this.T, warn ? 'pop-up raised' : 'no pop-up');
      if (!warn) break;
      if (goBack && round === 0) {
        this.press('lengthWarnBack');
        assert.equal(J(P.dump()), pre, what + ', Go Back: nothing stored');
        bump(this.T, 'pop-up: Go Back');
        this.same('Go Back on the pop-up');
        continue;
      }
      this.press('confirmGenBtn');
      bump(this.T, 'pop-up: Build');
      break;
    }
    const popUp = !!lengthWarning(this.draft);
    const no = refusal(this.draft);
    assert.deepEqual(P.toasts.slice(t0), no === null ? [] : [no], what + ': the refusal\'s toast, or none');
    if (no !== null) {
      // The page refused inside doGenerate, before any timer: a toast, the wizard again, nothing stored.
      assert.equal(J(P.dump()), pre, what + ', refused: nothing stored');
      sameStore(held(this.store), P.dump(), what + ', refused: the store');
      bump(this.T, 'refused: ' + no);
      this.same('a refusal');
      return { prog: null as unknown as ScreenProgram, id: '', popUp, refused: no };
    }
    const now = this.now;
    const begun = beginGenerate(this.draft, now);
    sameText(J(this.draft), this.pageDraft(), what + ': the draft as the generating screen opens (the pins written)');
    P.settle();
    const lines: string[] = JSON.parse(P.ev('JSON.stringify(__lines)') as string);
    const built = atInstant(now.getTime(), () => finishGenerate(this.store, this.draft, now.getTime(), { overlay: () => assert.fail(what + ': an overlay failed'), freeze: () => assert.fail(what + ': the freeze failed'), rebuild: () => assert.fail(what + ': the rebuild failed') }));
    // The harness runs each timer once: the first of the six lines stands for the six, and the page's own list is read beside it.
    assert.deepEqual([begun.first, begun.lines[0], built.ready], lines, what + ': the generating screen\'s lines');
    assert.equal(begun.lines.length, 6);
    sameStore(held(this.store), P.dump(), what + ': the store');
    const id: string = P.ev('activeProgId');
    assert.equal(built.prog.id, id, what + ': the active program');
    sameText(J(built.prog), J(P.prog), what + ': the program in hand');
    assert.equal(P.ev('currentWeek'), 1, what + ': the page lands on week 1');
    // The app then shows This Week, whose first draw makes a launch (the page makes none here): it stores nothing more,
    // and hands back the program the build left.
    const mount = launch(this.store, now.getTime(), () => assert.fail(what + ': the launch after it reported a failure'));
    sameStore(held(this.store), P.dump(), what + ': the store after This Week\'s launch');
    sameText(J(mount.prog), J(built.prog), what + ': the program that launch hands back');
    // This Week as each then shows it: the title holding today when week 1 is today's week, else the first title.
    const land = landingTitle(built.prog, midnight(now));
    const actual: number = P.ev('calcCurrentWeek()');
    assert.equal(currentWeek(built.prog, midnight(now)), actual, what + ': the week holding today');
    const shown = actual === 1 ? pageShown(P) : 1;
    assert.deepEqual(nativeView(this.store, built.prog, now, land.pick, null, true), pageView(P, shown, null, true), what + ': This Week after it');
    assert.equal(land.own, 1);
    bump(this.T, 'generated');
    bump(this.T, 'landing: ' + (land.pick === null ? 'the title holding today' : 'the first title, today is a later week'));
    bump(this.T, 'programs stored: ' + (JSON.parse(P.dump()['ia_programs']!) as unknown[]).length);
    bump(this.T, 'start: ' + ((built.prog as unknown as { blockOpen?: string }).blockOpen ? 'set by race date' : 'resolved'));
    return { prog: built.prog, id, popUp, refused: null };
  }
}

/** The rest day step's readers alone, over the draft in hand, against the page's own (the advisories are drawn by no state, so they are held here). */
export function sameDayReaders(two: TwoWizards, what: string): void {
  const page: string[] = JSON.parse(two.P.ev('JSON.stringify(getDayAdvisories())') as string);
  assert.deepEqual(getDayAdvisories(two.draft), page, what + ': the advisories');
  assert.equal(getMinTrainDays(two.draft), two.P.ev('getMinTrainDays()'), what + ': the floor');
  bump(two.T, 'day readers compared');
  bump(two.T, 'advisories read', page.length);
}

// ── The walks ────────────────────────────────────────────────────────────────────────────────────────────────────
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const day = (iso: string, n: number): string => {
  const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const todayOf = (two: TwoWizards): string => two.P.ev('_isoToday()') as string;

/**
 * The strength path, every tap of every step it walks: the three paths and back to it, About you (each experience,
 * each age, kg, lbs, lbs again), each equipment, each focus, the add-on's sports and Lift Only, the rest days down to
 * the floor and a locked day, the name, and the start date on each of the next eight days and blank. Then Back to the
 * first step and out, the wizard opened again, walked by Continue alone, and Generate.
 */
export function strengthWalk(P: Phone, T: WizardTally, what: string): Generated {
  const two = new TwoWizards(P, T, what + ', the strength path');
  two.open();
  for (const id of ['event', 'both', 'body']) two.choose('primaryPath', id);
  two.next();
  for (const id of ['beginner', 'advanced', 'intermediate']) two.choose('experience', id);
  for (const id of ['36-54', '55+', '18-35']) two.choose('ageBracket', id);
  two.unit('kg'); two.unit('lbs'); two.unit('lbs');
  two.next();
  for (const id of ['home_basic', 'commercial', 'crossfit', 'bodyweight', 'home_full']) two.choose('equipment', id);
  const v = two.next();
  assert.equal(v.step, 'lifting_focus', what + ': the strength path skips the cardio goals');
  for (const id of ['strength', 'hypertrophy', 'fatloss', 'balanced']) two.choose('liftingFocus', id);
  for (const t of ['run', 'bike', 'swim', 'bike']) two.sport(t);
  two.liftOnly();
  two.sport('run');
  two.next();
  // Down to the floor of three, a day at a time; then each day still training answers with the toast; then one back.
  for (const d of ['sun', 'sat', 'wed', 'mon']) two.day(d);
  for (const d of ['tue', 'thu', 'fri']) two.day(d);
  two.day('wed');
  two.next();
  two.name(' My block ');
  const t0 = todayOf(two);
  for (let n = 0; n <= 8; n++) two.start(day(t0, n));
  two.start('');
  let backs = 0;
  while (two.st.step > 0) { two.back(); backs++; }
  assert.equal(backs, 5, what + ': five taps of Back from the name step, the cardio goals skipped');
  two.leave();
  two.open();
  for (let i = 0; i < 5; i++) two.next();
  return two.generate();
}

/**
 * The race path with no goal picked (all this session's taps reach): the cardio goals with each sport opened and
 * shut and two left open, the three support focuses, a rest day, the name step with its race date row, and Generate.
 */
export function raceWalk(P: Phone, T: WizardTally, what: string): Generated {
  const two = new TwoWizards(P, T, what + ', the race path');
  two.open();
  two.choose('primaryPath', 'event');
  two.next(); two.next();
  const v = two.next();
  assert.equal(v.step, 'cardio_goal');
  assert.equal(two.draft.raceDate, todayOf(two), what + ': the cardio goals give the draft a race date of today');
  for (const t of ['run', 'run', 'bike', 'swim', 'bike', 'run']) two.sport(t);
  two.back(); two.next();
  two.next();
  for (const id of ['support_strength', 'support_athletic', 'support_prevention']) two.choose('liftingFocus', id);
  two.next();
  two.day('sun');
  two.next();
  return two.generate();
}

/** The hybrid path: the cardio goals without the taper goals, a sport left open, the strength path's focuses and no add-on, Generate. */
export function hybridWalk(P: Phone, T: WizardTally, what: string): Generated {
  const two = new TwoWizards(P, T, what + ', the hybrid path');
  two.open();
  two.choose('primaryPath', 'both');
  two.next(); two.next(); two.next();
  for (const t of ['run', 'bike', 'swim']) two.sport(t);
  two.sport('bike');
  two.next();
  two.choose('liftingFocus', 'hypertrophy');
  two.next();
  for (const d of ['sat', 'sun']) two.day(d);
  two.next();
  two.start(day(todayOf(two), 3));
  return two.generate();
}

/** A sport added on the strength path's add-on, then the path changed: the cardio goals open on that sport's goals. */
export function addOnThenRaceWalk(P: Phone, T: WizardTally, what: string): void {
  const two = new TwoWizards(P, T, what + ', an add-on then another path');
  two.open();
  two.next(); two.next(); two.next();
  two.sport('swim');
  for (let i = 0; i < 3; i++) two.back();
  two.choose('primaryPath', 'both');
  two.next(); two.next();
  const v = two.next();
  assert.ok(v.step === 'cardio_goal' && v.cardio.sports.find((s) => s.id === 'swim')!.sel && v.cardio.sports.find((s) => s.id === 'swim')!.goals.length === 4, what + ': the swim card opens on the hybrid path\'s four goals');
  for (let i = 0; i < 3; i++) two.back();
  two.choose('primaryPath', 'event');
  two.next(); two.next();
  const w = two.next();
  assert.ok(w.step === 'cardio_goal' && w.cardio.sports.find((s) => s.id === 'swim')!.goals.length === 5, what + ': and on the race path\'s five');
  for (let i = 0; i < 3; i++) two.back();
  two.leave();
}

/** The draft the wizard opens with, with a config laid over it whole. */
export const draftOf = (two: TwoWizards, cfg: unknown): Draft => ({ ...startWizard(two.now).draft, ...(JSON.parse(J(cfg)) as object) }) as Draft;

/**
 * A config set whole into both drafts (a seeded program, or a draft no tap reaches): every step drawn by Continue
 * from the first, the cardio goals among them (whose draw writes into the draft on both: the seed it read, the weeks
 * to the race date), the rest day step's readers, Back to the first step and forward again, then Generate.
 */
export function wholeWalk(P: Phone, cfg: unknown, T: WizardTally, what: string, goBack = false): Generated {
  const two = new TwoWizards(P, T, what);
  two.open();
  let v = two.whole(draftOf(two, cfg), 'primary');
  while (v.step !== 'name') {
    v = two.next();
    if (v.step === 'days') sameDayReaders(two, what);
  }
  while (two.st.step > 0) two.back();
  while (two.st.step < WIZARD_STEPS.length - 1) two.next();
  return two.generate(goBack);
}

/** A draft Generate refuses, set whole on the name step: the toast, the wizard as it was, nothing stored. */
export function refusedWalk(P: Phone, cfg: unknown, T: WizardTally, what: string): string {
  const two = new TwoWizards(P, T, what);
  two.open();
  two.whole(draftOf(two, cfg), 'name');
  const g = two.generate();
  assert.ok(g.refused, what + ': refused');
  return g.refused!;
}

// ── The cardio goals' walks (the second session) ─────────────────────────────────────────────────────────────────
/** A real entry for each field of each form. */
export const FILL: Record<string, [string, string][]> = {
  pace: [['targetDist', '1.5'], ['targetMins', '10'], ['targetSecs', '30'], ['baselineDist', '2'], ['mileBestMins', '9'], ['mileBestSecs', '0']],
  run: [['baselineDist', '3'], ['mileBestMins', '9'], ['mileBestSecs', '0']],
  bike: [['baselineDist', '20']],
  swim: [['baselineDist', '400']],
  swim500: [['targetMins', '8'], ['targetSecs', '0'], ['baseMins', '10'], ['baseSecs', '30']],
  swim100: [['targetMins', '1'], ['targetSecs', '30'], ['baseMins', '1'], ['baseSecs', '50'], ['base500Mins', '10'], ['base500Secs', '30']],
};
/** The entry a goal's form is filled with. */
export const fillOf = (sport: string, id: string): [string, string][] => FILL[id === 'run_pace_goal' ? 'pace' : id === 'swim_500_time' ? 'swim500' : id === 'swim_100_time' ? 'swim100' : sport]!;
const cardioOf = (v: StepView): CardioView => { assert.equal(v.step, 'cardio_goal'); return v as unknown as CardioView; };
const formOf = (v: StepView, sport: string): CardioForm => { const f = cardioOf(v).cardio.sports.find((s) => s.id === sport)!.form; assert.ok(f, 'the sport\'s form is drawn'); return f!; };

/** Build New Program, a path (and a level, an age), then Continue to the cardio goals. */
export function toCardioGoals(P: Phone, T: WizardTally, what: string, path: 'event' | 'both', more: { experience?: string; age?: string } = {}): TwoWizards {
  const two = new TwoWizards(P, T, what);
  two.open();
  two.choose('primaryPath', path);
  two.next();
  if (more.experience) two.choose('experience', more.experience);
  if (more.age) two.choose('ageBracket', more.age);
  two.next();
  assert.equal(two.next().step, 'cardio_goal', what + ': on the cardio goals');
  return two;
}

/**
 * Every goal a path offers, each picked in turn under its sport: each field of its form typed into with each of
 * `values` from the form as first picked and again once the form is filled (so a line a field's handler does not
 * repaint is held stale, as the page leaves it); the units; and on the race path a race day on each of `days` from
 * today (the shorter plan's link tapped where the card offers it, and the goal picked back), Reset, both race
 * buttons, and a blank handed to the field's handler. Then two sports held at once, and Back and Continue.
 */
export function goalsWalk(P: Phone, T: WizardTally, what: string, path: 'event' | 'both', values: string[], days: number[], experience?: string): void {
  const two = toCardioGoals(P, T, what + ', every goal on ' + path, path, experience ? { experience } : {});
  const t0 = todayOf(two);
  for (const sport of ['run', 'bike', 'swim']) {
    const ids = cardioOf(two.sport(sport)).cardio.sports.find((s) => s.id === sport)!.goals.map((g) => g.id);
    assert.ok(ids.length >= 4, what + ': the sport lists its goals');
    for (const id of ids) {
      const keys = formFields(sport, formOf(two.goal(sport, id), sport)).map((f) => f.key);
      const fill = fillOf(sport, id);
      for (const k of keys) for (const x of values) two.type(sport, k, x);
      for (const [k, x] of fill) two.type(sport, k, x);
      for (const [k, back] of fill) { for (const x of values) two.type(sport, k, x); two.type(sport, k, back); }
      if (id === 'run_pace_goal') { two.paceUnit('km'); two.type('run', 'targetDist', '3'); two.type('run', 'baselineDist', '4'); two.paceUnit('mi'); two.paceUnit('mi'); }
      if (id === 'swim_500_time' || id === 'swim_100_time') { two.swimUnit('m'); two.type('swim', 'baseMins', ''); two.swimUnit('yd'); two.type('swim', 'baseMins', id === 'swim_500_time' ? '10' : '1'); }
      // The 100's own time blank beside a 500 time: the advisory asks for the 100.
      if (id === 'swim_100_time') { two.type('swim', 'baseMins', ''); two.type('swim', 'baseSecs', ''); two.type('swim', 'baseMins', '1'); two.type('swim', 'baseSecs', '50'); }
      // A mile under five minutes: the advisory names the chart's fastest row.
      if (sport === 'run') { two.type('run', 'mileBestMins', '4'); two.type('run', 'mileBestSecs', '30'); two.type('run', 'mileBestMins', '9'); two.type('run', 'mileBestSecs', '0'); }
      if (path !== 'event') continue;
      for (const n of days) {
        const v = cardioOf(two.raceDay(day(t0, n)));
        if (/offerShorterPlan/.test(v.paint.card || '')) { two.shorter(); two.goal(sport, id); }
      }
      two.raceReset();
      two.targeted(false); two.targeted(false); two.targeted(true); two.targeted(true);
      two.raceDay(day(t0, 70)); two.raceDay(''); two.type(sport, keys[0]!, fill[0]![1]);
      two.goal(sport, id);
    }
    two.sport(sport);
  }
  two.sport('run'); two.goal('run', 'run_base'); two.sport('swim'); two.goal('swim', 'swim_base'); two.type('swim', 'baselineDist', '400');
  two.back(); two.next();
  two.sport('swim'); two.sport('run');
}

/**
 * The pace goal's reach, where no race date owns the pace's words (the race path with Just building fitness, and the
 * hybrid path): each run goal picked for its mile help, then the pace goal with each of five targets and four miles.
 */
export function reachWalk(P: Phone, T: WizardTally, what: string, path: 'event' | 'both', experience: string, age: string): void {
  const two = toCardioGoals(P, T, what + ', the pace reach on ' + path + ', ' + experience + ', ' + age, path, { experience, age });
  const ids = cardioOf(two.sport('run')).cardio.sports[0]!.goals.map((g) => g.id);
  for (const id of ids) two.goal('run', id);
  two.goal('run', 'run_pace_goal');
  if (path === 'event') two.targeted(false);
  for (const [dist, mm, ss, unit] of [['1.5', '9', '0', 'mi'], ['1.5', '10', '30', 'mi'], ['1.5', '13', '0', 'mi'], ['3', '14', '0', 'km'], ['1', '6', '0', 'mi']] as [string, string, string, string][]) {
    two.paceUnit(unit);
    for (const mile of [null, ['9', '0'], ['7', '0'], ['12', '30']] as ([string, string] | null)[]) {
      two.type('run', 'targetDist', dist); two.type('run', 'targetMins', mm); two.type('run', 'targetSecs', ss);
      two.type('run', 'mileBestMins', mile ? mile[0] : ''); two.type('run', 'mileBestSecs', mile ? mile[1] : '');
    }
  }
}

/**
 * A week that holds the test: the pace goal on the race path (1.5 miles in `mins` minutes from a 9:00 mile: 9 is far
 * and carries the reach sentence, 13 is in reach and carries none), days rested on the rest day step, the start moved
 * on the name step, then a race day on each day from yesterday through nine days on, and three far ones.
 */
export function testWeekWalk(P: Phone, T: WizardTally, what: string, rest: string[], startIn: number | null, mins = '9'): void {
  const two = toCardioGoals(P, T, what + ', a dated test with ' + (rest.join(' and ') || 'no day') + ' rested', 'event');
  two.sport('run'); two.goal('run', 'run_pace_goal');
  for (const [k, x] of [['targetDist', '1.5'], ['targetMins', mins], ['targetSecs', '0'], ['mileBestMins', '9'], ['mileBestSecs', '0']] as [string, string][]) two.type('run', k, x);
  two.next(); two.next();
  for (const d of rest) two.day(d);
  if (startIn !== null) { two.next(); two.start(day(todayOf(two), startIn)); two.back(); }
  two.back(); two.back();
  for (let n = -1; n <= 9; n++) two.raceDay(day(todayOf(two), n));
  for (const n of [70, 140, 210]) two.raceDay(day(todayOf(two), n));
}

/**
 * The seed offer, on a phone whose history holds logged recovery paces: the offer under a run goal, Use this data and
 * the line it leaves, the mile typed over it, the pace goal's form with the same line; then a wizard opened again,
 * Start fresh, and no banner for the rest of it. Each wizard is walked on to Generate, which stores the seed's answer.
 */
export function seedWalk(P: Phone, T: WizardTally, what: string, path: 'event' | 'both'): Generated {
  const use = toCardioGoals(P, T, what + ', the seed used on ' + path, path);
  use.sport('bike'); use.goal('bike', 'bike_base');
  use.sport('run');
  let f = formOf(use.goal('run', 'run_base'), 'run');
  assert.ok(f.kind === 'other' && f.seed && !f.seed.applied, what + ': the offer is drawn under a run goal');
  f = formOf(use.seedUse(), 'run');
  assert.ok(f.kind === 'other' && f.seed && f.seed.applied, what + ': Use this data leaves the line saying where the numbers came from');
  use.type('run', 'mileBestSecs', '5');
  f = formOf(use.goal('run', 'run_pace_goal'), 'run');
  assert.ok(f.kind === 'pace' && f.seed && f.seed.applied, what + ': the pace goal\'s form keeps the line');
  use.goal('run', 'run_base');
  if (path === 'event') use.raceDay(day(todayOf(use), 84));
  for (let i = 0; i < 3; i++) use.next();
  const made = use.generate();
  const fresh = toCardioGoals(P, T, what + ', the seed turned down on ' + path, path);
  fresh.sport('run');
  f = formOf(fresh.goal('run', 'run_pace_goal'), 'run');
  assert.ok(f.kind === 'pace' && f.seed && !f.seed.applied, what + ': the offer is drawn under the pace goal');
  f = formOf(fresh.seedFresh(), 'run');
  assert.ok(f.kind === 'pace' && f.seed === null, what + ': Start fresh takes the banner away');
  f = formOf(fresh.goal('run', 'run_10k'), 'run');
  assert.ok(f.kind === 'other' && f.seed === null, what + ': and it stays away under another run goal');
  for (const [k, x] of FILL['run']!) fresh.type('run', k, x);
  if (path === 'event') fresh.targeted(false);
  for (let i = 0; i < 3; i++) fresh.next();
  fresh.generate();
  return made;
}

/**
 * A goal picked and filled by taps, then the wizard walked to the name step and Generate: the start a race date
 * sets (the shorter plan's link under it tapped when it is offered, then the goal picked back on the cardio goals),
 * the pop-up, the refusal, the build. `race` is days from today, null for Just building fitness (the race path) or
 * for the hybrid path, which draws no race date.
 */
export function goalToGenerate(P: Phone, T: WizardTally, what: string, path: 'event' | 'both', sport: string, id: string, fill: [string, string][], race: number | null, goBack = false): Generated {
  const two = toCardioGoals(P, T, what + ', ' + id + ' on ' + path + (race === null ? '' : ', a race day ' + race + ' days out'), path);
  two.sport(sport); two.goal(sport, id);
  for (const [k, x] of fill) two.type(sport, k, x);
  if (path === 'event') { if (race === null) two.targeted(false); else two.raceDay(day(todayOf(two), race)); }
  two.next(); two.next();
  let v = two.next();
  assert.equal(v.step, 'name');
  if (v.step === 'name' && v.name.aligned && /offerShorterPlan/.test(v.name.aligned.copy)) {
    two.shorter();
    for (let i = 0; i < 3; i++) two.back();
    two.goal(sport, id);
    for (let i = 0; i < 3; i++) v = two.next();
  }
  return two.generate(goBack);
}

/**
 * A seeded program's cardio goals made by taps. The config is set into both drafts with no sport and no goal, on the
 * cardio goals step (on the race path with no race date either), and its goals are then made as an athlete makes
 * them: the sport, the goal, the unit, each field the seeded goal holds that the form draws, the race date or Just
 * building fitness. Then Continue to the name step, and Generate.
 */
export function seededGoalsWalk(P: Phone, cfg: unknown, T: WizardTally, what: string): Generated {
  const two = new TwoWizards(P, T, what + ', its goals by taps');
  two.open();
  const c = JSON.parse(J(cfg)) as Draft;
  const bare: Draft = { ...draftOf(two, c), cardioTypes: [], cardioGoals: {} };
  if (c.primaryPath === 'event') { bare.eventTargeted = true; delete bare.raceDate; delete bare.raceDateWeeks; }
  two.whole(bare, 'cardio_goal');
  for (const sport of c.cardioTypes) {
    two.sport(sport);
    const g = c.cardioGoals[sport];
    if (!g) continue;
    const form = formOf(two.goal(sport, g.id!), sport);
    if (g['swimUnit'] && g['swimUnit'] !== 'yd') two.swimUnit(g['swimUnit'] as string);
    if (g['paceUnit'] && g['paceUnit'] !== 'mi') two.paceUnit(g['paceUnit'] as string);
    for (const f of formFields(sport, form)) if (g[f.key] !== undefined && g[f.key] !== '') two.type(sport, f.key, String(g[f.key]));
  }
  if (c.primaryPath === 'event') { if (c.eventTargeted === false) two.targeted(false); else if (c.raceDate) two.raceDay(c.raceDate); }
  while (two.st.step < WIZARD_STEPS.length - 1) two.next();
  bump(T, 'seeded programs whose goals were made by taps');
  return two.generate();
}

export { DAYS, day };
