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
// THE CARDIO GOALS, THIS SESSION. The Expo app draws the sports and their goals; a goal's fields and the box under
// the cards are the second session's. The step's markup is compared whenever the draft holds no goal (every draft a
// walk of this session's taps can make), and counted as not compared when a draft set whole holds one.
//
// THE PAGE'S ELEMENTS. The harness hands the page an element for any id. The lines the wizard repaints in place are
// here only while the step's markup holds them, as on a real page, so a repaint of a line that is not drawn writes
// nothing (the race date's card would otherwise write the draft's week count on a step with no card).
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
import type { Choice } from '../../frontends/native/src/wizard/wizard-model.ts';
import { unitStyle, WIZARD_STEPS } from '../../frontends/native/src/wizard/wizard-model.ts';
import type { Draft } from '../../frontends/native/src/wizard/wizard-readers.ts';
import { getDayAdvisories, getMinTrainDays } from '../../frontends/native/src/wizard/wizard-readers.ts';
import {
  type FloorToast, type StepView, WIZARD_WORDS as W, type WizardState, floorToastMarkup, landingTitle, liftOnly, setChoice, setName, setStart, setUnit, startWizard,
  toggleCardioTypeSport, toggleRestDay, wizardBack, wizardNext, wizardView,
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
  if (v.step === 'cardio_goal') {
    return head(W.cardio) + '<div style="display:flex;flex-direction:column;gap:10px">' + v.sports.map((s) =>
      '<div style="background:var(--surface);border:1.5px solid ' + (s.sel ? 'var(--accent)' : 'var(--border)') + ';border-radius:16px;overflow:hidden"><div onclick="toggleCardioTypeSport(\'' + s.id + '\')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:'
      + (s.sel ? 'var(--accent-dim)' : 'transparent') + '"><div>' + asyIcon(s.icon, 24) + '</div><div style="flex:1"><div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:' + (s.sel ? 'var(--accent)' : 'var(--text)') + '">' + s.name
      + '</div><div style="font-size:11px;color:var(--muted);margin-top:2px">' + s.desc + '</div></div><div style="font-size:20px;color:var(--accent);opacity:' + (s.sel ? 1 : 0) + '">✓</div></div>'
      + (s.sel ? '<div style="padding:0 14px 14px;border-top:1px solid var(--border)"><div style="padding-top:10px;display:flex;flex-direction:column;gap:6px">'
        + s.goals.map((g) => '<div class="goal-option' + (g.sel ? ' selected' : '') + '" onclick="setCardioGoal(\'' + s.id + '\',\'' + g.id + '\')"><div class="goal-option-label">' + g.label + '</div><div class="goal-option-desc">' + g.desc + '</div></div>').join('')
        + '</div></div>' : '') + '</div>').join('') + '</div>';
  }
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

// ── The kinds a draw holds ───────────────────────────────────────────────────────────────────────────────────────
const resolveKind = (t: string): string => (/That week holds your test/.test(t) ? 'the week holds the test' : /Nothing left to train that week/.test(t) ? 'moved to the next Monday' : /Week 1 is short/.test(t) ? 'a short first week' : 'a whole first week');
const alignedKind = (t: string): string => (/so it peaks on race week/.test(t) ? 'starts later' : 'opens in a week' + (/are behind you/.test(t) ? ', weeks behind' : '')) + (/I don’t recommend under/.test(t) ? ', under the floor' : '') + (/fits this window better/.test(t) ? ', the shorter plan\'s link' : '');
const raceRowKind = (r: string | undefined): string => (r === undefined ? 'none' : /No date set/.test(r) ? 'no date set' : / away\)$/.test(r) ? 'a date, N away' : /\(race day\)$/.test(r) ? 'a date, race day' : /\(behind you\)$/.test(r) ? 'a date, behind you' : 'a date alone');
function countStep(T: WizardTally, v: StepView): void {
  const k = (s: string, n = 1): void => bump(T, v.step + ': ' + s, n);
  k('draws');
  if (v.step === 'primary' || v.step === 'equipment') { k('cards', v.choices.length); k('a card chosen', v.choices.filter((c) => c.sel).length); }
  else if (v.step === 'profile') { k('experience ' + (v.profile.experience.find((c) => c.sel)?.id || 'none')); k(v.profile.ageLabel.replace(':', '')); k(v.profile.kg ? 'kg' : 'lbs'); }
  else if (v.step === 'cardio_goal') { for (const s of v.sports) { k(s.sel ? 'sport open' : 'sport shut'); k('goal options', s.goals.length); k('a goal chosen', s.goals.filter((g) => g.sel).length); } }
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
  /** Every pop-up overlay the page appended to its body, newest last. */
  private overlays: { innerHTML: string }[] = [];

  constructor(P: Phone, T: WizardTally, what: string, store: StateStore = phoneStore(P, sqliteTestStore())) {
    this.P = P; this.T = T; this.what = what; this.store = store;
    const doc = P.IA.window['document'];
    const base = doc.getElementById;
    doc.getElementById = (id: string) => {
      if (!IN_BODY.includes(id)) return base(id);
      const m = new RegExp('<[^>]*\\bid="' + id + '"[^>]*>').exec(String(base('wizardBody').innerHTML || ''));
      if (!m) return null;
      const el = base(id), val = /\bvalue="([^"]*)"/.exec(m[0]);
      if (val && el.__tag !== m[0]) { el.value = val[1]; el.__tag = m[0]; }
      return el;
    };
    const add = doc.body.appendChild;
    doc.body.appendChild = (x: { innerHTML: string }) => { this.overlays.push(x); return add.call(doc.body, x); };
  }
  get now(): Date { return launchNow(this.P); }
  get draft(): Draft { return this.st.draft; }
  private get pageStep(): number { return this.P.ev('wizardStep') as number; }
  private pageDraft(): string { return this.P.ev('JSON.stringify(WD)') as string; }

  /** Both apps held equal: the step, the draft, the bar, the step's markup, and every ia_ key. */
  same(tap: string): StepView {
    const what = this.what + ', ' + tap;
    assert.equal(this.st.step, this.pageStep, what + ': the step');
    const { shell, view } = wizardView(this.store, this.st, this.now);
    // The page's draw wrote its defaults before this (a race date, a name); the Expo app's view just did.
    sameText(J(this.draft), this.pageDraft(), what + ': the draft');
    const el = (id: string, prop: string): string => String(this.P.ev(`(function(){var v=document.getElementById(${J(id)}).${prop};return v==null?'':v;})()`));
    assert.equal(shell.label, el('wizardStepLabel', 'textContent'), what + ': the count');
    assert.equal(shell.next, el('wizardNext', 'textContent'), what + ': the last button');
    assert.equal(shell.fill, el('wizardFill', 'style.width'), what + ': the bar');
    const page = tight(el('wizardBody', 'innerHTML'));
    if (view.step === 'cardio_goal' && Object.keys(this.draft.cardioGoals || {}).length) bump(this.T, 'cardio_goal: not compared, the draft holds a goal (the second session\'s)');
    else sameText(tight(stepMarkup(view)), page, what + ': the step\'s markup');
    assert.equal(view.step, WIZARD_STEPS[this.st.step], what + ': the view\'s step');
    countStep(this.T, view);
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
    if (toast) bump(this.T, 'toast: ' + (/needs \d training days/.test(toast.text) ? 'the floor, a goal named' : 'the floor, three days'));
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
    const { view } = wizardView(this.store, this.st, this.now);
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
  assert.ok(v.step === 'cardio_goal' && v.sports.find((s) => s.id === 'swim')!.sel && v.sports.find((s) => s.id === 'swim')!.goals.length === 4, what + ': the swim card opens on the hybrid path\'s four goals');
  for (let i = 0; i < 3; i++) two.back();
  two.choose('primaryPath', 'event');
  two.next(); two.next();
  const w = two.next();
  assert.ok(w.step === 'cardio_goal' && w.sports.find((s) => s.id === 'swim')!.goals.length === 5, what + ': and on the race path\'s five');
  for (let i = 0; i < 3; i++) two.back();
  two.leave();
}

/** The draft the wizard opens with, with a config laid over it whole. */
export const draftOf = (two: TwoWizards, cfg: unknown): Draft => ({ ...startWizard(two.now).draft, ...(JSON.parse(J(cfg)) as object) }) as Draft;

/**
 * A config set whole into both drafts (a seeded program, or a draft no tap of this session reaches): every step drawn
 * by Continue from the first, the rest day step's readers, Back and forward again, then Generate.
 *
 * A draft that holds a goal is not walked through the cardio goals: today's draw of that step writes into the draft
 * (the seed it read, the weeks to the race date), and both are the second session's. The draft is set again on the
 * lifting step, as it stood, so the program generated is the one today's builds from that draft, as the seeded
 * histories build theirs (stored-state.ts generate).
 */
export function wholeWalk(P: Phone, cfg: unknown, T: WizardTally, what: string, goBack = false): Generated {
  const two = new TwoWizards(P, T, what);
  two.open();
  let v = two.whole(draftOf(two, cfg), 'primary');
  const goal = Object.keys(two.draft.cardioGoals || {}).length > 0 && two.draft.primaryPath !== 'body';
  while (v.step !== 'name') {
    v = goal && v.step === 'equipment' ? two.whole(JSON.parse(J(two.draft)), 'lifting_focus') : two.next();
    if (v.step === 'days') sameDayReaders(two, what);
  }
  while (two.st.step > (goal ? WIZARD_STEPS.indexOf('lifting_focus') : 0)) two.back();
  while (two.st.step < WIZARD_STEPS.length - 1) two.next();
  if (goal) bump(T, 'whole drafts holding a goal: the cardio goals not walked');
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

export { DAYS, day };
