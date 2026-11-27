// The wizard's taps and what each step shows, in the Expo app (MIGRATION.md phase 3, row 6, the first of two
// sessions). What the page keeps while its wizard is open (the step `wizardStep` and the draft `WD`) is one state
// here, and each tap is the page's own handler, line for line:
//
//   startWizard, wizardBack, wizardNext, setUnit, toggleRestDay, toggleCardioTypeSport       wizard.ts
//   a card's choice, Lift Only, the name, the start date                                     the Angular screen's set, liftOnly, setName, setStart
//
// A tap changes the draft and nothing else: nothing here writes to the store. Continue never refuses; the one tap
// that does is a rest day at the floor of training days, which answers with the page's toast.
//
// THE CARDIO GOALS (the second session). The step is today's own model (cardio-goal-model.ts), handed this app's
// readers where the Angular screen hands it the page's. Its taps are the page's handlers and the Angular screen's:
//
//   setCardioGoal, setPaceUnit, setSwimUnit, applySeedData, dismissSeedData, offerShorterPlan, updatePaceTime   wizard.ts
//   a typed field, the race date's two buttons, a day from the race date's field                              the Angular screen's edit, raceDate, setRaceDate
//
// A WHOLE DRAW AND A REPAINT. A goal, a sport, a unit, a race button, the seed's buttons and the shorter plan link
// draw the step whole (cardioDraw). A typed field and a picked race day do not: the page repaints a few lines in
// place, and which ones depends on the field (editCardioField, setRaceDate). A line no handler repaints keeps what
// the last whole draw gave it, right or not: a typed bike, swim or swim time field leaves the program length line
// as it was, as on the page. The fields' own values and the race date field's Reset day are the last whole draw's.
//
// tests/support/native-wizard.ts holds the draft, the step and each step's markup equal to today's page, tap for tap.
import { ALL_DAYS_ORDER, _parseLocalDate } from '@ia/core/engine/calendar.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { _clkMS } from '@ia/core/engine/clock-format.ts';
import { paceGoalTarget } from '@ia/core/engine/nsw-cardio.ts';
import { seedFromStoredPrograms } from '@ia/core/engine/state-progress.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS } from '../program-list/list-readers';
import { currentWeek } from '../this-week/week-readers';
import { fmtPaceMi } from '../day-detail/sheet-readers';
import {
  type CardioDraft, type CardioField, type CardioStep, type Seed, baselineSuffix, cardioStep, localIso, mileAdvisory, prepareCardioDraft, seedView, swimAdvisory,
} from './cardio-goal-model';
import {
  type Choice, WIZARD_STEPS, type WizardDraft, daysView, equipmentChoices, liftingView, primaryChoices, profileView, wizardShell,
} from './wizard-model';
import { resolveStartDate, rsRace } from '../week-dates/week-dates';
import {
  type CardioPaint, type Draft, type DraftGoal, LIFTING_OPTIONS, type NameView, SWIM_GOAL_DIST, draftMileState, getDayAdvisories, getMinTrainDays, getMinTrainDaysLabel, goalLabel,
  mileFieldHelp, nameView, newDraft, progLenLine, raceFeedback, startResolveCopy, startSummaryVal, swimEntryState, swimPaceDisplay, wizardAlignment,
} from './wizard-readers';

/** The words the screen itself holds (the Angular template's, which are renderWizardStep's): the bar, and each step's own lines. */
export const WIZARD_WORDS = {
  back: '← Back',
  primary: { title: 'What are you training for?', subtitle: 'This shapes everything! Program length, lifting focus, and cardio structure.' },
  profile: {
    title: 'About you', subtitle: 'Calibrates volume, intensity, and program length to your fitness level.',
    experience: 'Training experience', age: 'Age range', units: 'Units', lbs: 'lbs', kg: 'kg', expLabel: 'Experience:',
  },
  equipment: { title: 'Your equipment', subtitle: 'The program only prescribes exercises you can actually do.' },
  cardio: { title: 'Cardio goals', subtitle: 'Select all sports you want to train. Set a goal for each.' },
  lifting: { title: 'Lifting focus', addOn: 'Optional cardio add-on', liftOnly: 'Lift Only' },
  days: {
    title: 'Rest days', subtitle: 'All days are training days by default. Tap to mark as rest.',
    legend: 'Gold = training · Grey = rest · ', selected: ' selected',
    lockTitle: ' You\'re at your minimum training days',
    floorGoal: { before: 'Your ', mid: ' goal needs at least ', days: ' training days a week', after: ' to build the volume safely and avoid injury. To add more rest, ease your goal or pick a shorter distance.' },
    floorThree: 'Three days a week is the floor, cardio or no cardio. Two gives you the same session twice with nowhere to put the hard work. Three is where real training days start.',
  },
  name: {
    title: 'Name your program', subtitle: 'Give it something you will recognize, and tell it when to begin.',
    nameLabel: 'Program name', startLabel: 'Start date', derived: 'set by race date', summary: 'Program Summary',
  },
} as const;

/** What the page keeps while the wizard is open: the step it is on, and the draft. */
export interface WizardState { step: number; draft: Draft }

/** Build New Program (startWizard): a new draft, on the first step. */
export function startWizard(now: Date): WizardState {
  return { step: 0, draft: newDraft(now) };
}

/** Back (wizardBack). True on the first step, where it leaves the wizard for the Programs tab; the draft is dropped with it. */
export function wizardBack(st: WizardState): boolean {
  if (st.step === 0) return true;
  st.step--;
  if (WIZARD_STEPS[st.step] === 'cardio_goal' && st.draft.primaryPath === 'body') st.step--;
  return false;
}

/** Continue (wizardNext). True on the last step, where the button is Generate Program. */
export function wizardNext(st: WizardState): boolean {
  if (st.step < WIZARD_STEPS.length - 1) {
    st.step++;
    if (WIZARD_STEPS[st.step] === 'cardio_goal' && st.draft.primaryPath === 'body') st.step++;
    return false;
  }
  return true;
}

/** A card's choice: the draft's field. */
export function setChoice(st: WizardState, key: 'primaryPath' | 'experience' | 'ageBracket' | 'equipment' | 'liftingFocus', id: string): void {
  st.draft[key] = id;
}
/** lbs or kg (setUnit). */
export function setUnit(st: WizardState, u: string): void {
  if (u === st.draft.unit) return;
  st.draft.unit = u;
}

/** A toast of the wizard: the mark the page writes before its words (the floor's warning; none on the shorter plan's), and the words. */
export interface FloorToast { icon: string | null; text: string }
/** The toast as the page hands it to showToast: the mark's markup, a space, the words; the words alone with no mark. */
export const floorToastMarkup = (t: FloorToast): string => (t.icon ? asyIcon(t.icon, 13) + ' ' + t.text : t.text);

/** A day's tile (toggleRestDay): rested, or back to training. A training day at the floor stays and answers with the toast. */
export function toggleRestDay(st: WizardState, day: string): FloorToast | null {
  const d = st.draft;
  const wouldRest = !d.restDays.includes(day);
  const trainingLeft = ALL_DAYS_ORDER.filter((x) => !d.restDays.includes(x)).length;
  if (wouldRest) {
    const minDays = getMinTrainDays(d);
    if (trainingLeft <= minDays) return { icon: '⚠', text: getMinTrainDaysLabel(d) };
  }
  if (d.restDays.includes(day)) d.restDays = d.restDays.filter((x) => x !== day);
  else d.restDays.push(day);
  d.days = ALL_DAYS_ORDER.filter((x) => !d.restDays.includes(x));
  return null;
}

/** A sport's header on the cardio goals, or a sport of the strength path's add-on (toggleCardioTypeSport): shut, its goal goes with it. */
export function toggleCardioTypeSport(st: WizardState, t: string): void {
  const d = st.draft;
  if (d.cardioTypes.includes(t)) {
    d.cardioTypes = d.cardioTypes.filter((x) => x !== t);
    delete d.cardioGoals[t];
  } else {
    d.cardioTypes.push(t);
  }
}
/** Lift Only: no sport and no goal. */
export function liftOnly(st: WizardState): void {
  st.draft.cardioTypes = [];
  st.draft.cardioGoals = {};
}
/** The name, as typed. */
export function setName(st: WizardState, v: string): void {
  st.draft.name = v;
}
/** The start date, as its box hands it back (a day, or blank after Reset). */
export function setStart(st: WizardState, v: string): void {
  st.draft.startDate = v;
}

/**
 * Where This Week stands after Generate. The page's current week is 1 then, set from outside the screen (doGenerate),
 * whatever week holds today (a race plan can open weeks in). Today's screen shows the title holding today when that
 * is week 1, and the first title when today is a later week (week-view.ts render). `own` is the week the screen then
 * holds as its own; `pick` is the title to show, null for the launch's own.
 */
export function landingTitle(prog: Parameters<typeof currentWeek>[0], today: Date): { own: number; pick: number | null } {
  return { own: 1, pick: currentWeek(prog, today) === 1 ? null : 1 };
}

/**
 * The start date changed (the Angular screen's updateStart, the page's updateStartResolve): only the copy under the
 * field and the summary's start row are drawn again, from the draft as it stands, and the field shows what was
 * picked. A blank field (the box's Reset) stays blank and reads as today, until the step is next drawn whole, which
 * writes today into the draft. A start set by a race date has no field, and nothing changes.
 */
export function repaintStart(st: WizardState, name: NameView, now: Date): NameView {
  if (wizardAlignment(st.draft, now)) return name;
  const d = st.draft;
  const sr = resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now);
  return {
    ...name, startDate: d.startDate || '', resolveCopy: startResolveCopy(sr),
    rows: name.rows.map((r) => (r.k === 'Start date' ? { k: r.k, v: '<span id="sumStartDate">' + startSummaryVal(sr) + '</span>' } : r)),
  };
}

/** What WebKit's date field shows for a day ("Nov 21, 2026"), and nothing for a blank one or one that does not read. */
export function dateFieldText(iso: string): string {
  const d = _parseLocalDate(iso);
  return d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

/**
 * The line WebKit lays a step's title at, for its size (the title is clamp(21px, 6.5vw, 28px), bold, with no line height
 * of its own). Measured in the simulator's Safari at each size a phone's width gives: the first of each pair is the
 * size a line holds up to.
 */
const TITLE_LINES: [number, number][] = [[21.8, 27], [22.4, 28], [23.1, 29], [23.7, 30], [24.5, 31], [25.7, 32], [26.7, 33], [27.5, 34]];
export function titleLine(size: number): number {
  for (const [upTo, line] of TITLE_LINES) if (size < upTo) return line;
  return 36;
}

/** A card's words as WebKit breaks them: a slash does not end a line (a word joiner after each one). */
export function unbroken(text: string): string {
  return text.replace(/\//g, '/' + String.fromCharCode(0x2060));
}

/** A run of a line the page writes as markup: an icon, or words; bold, or the shorter plan's link with the goal it switches to. */
export interface CopyRun { icon: string | null; text: string; bold: boolean; link: string | null }
/** Markup the page writes into a step (the copy under the start, a summary row, an advisory), cut into runs to draw. */
export function copyRuns(html: string): CopyRun[] {
  const runs: CopyRun[] = [];
  const re = /<svg[\s\S]*?<\/svg>|<b(?: [^>]*)?>([\s\S]*?)<\/b>|<a onclick="offerShorterPlan\('([^']*)'\)">([\s\S]*?)<\/a>/g;
  let at = 0, m: RegExpExecArray | null;
  const words = (t: string, bold: boolean, link: string | null): void => { const x = t.replace(/<[^>]*>/g, ''); if (x) runs.push({ icon: null, text: x, bold, link }); };
  while ((m = re.exec(html))) {
    words(html.slice(at, m.index), false, null);
    if (m[1] !== undefined) words(m[1], true, null);
    else if (m[2] !== undefined) words(m[3]!, false, m[2]);
    else runs.push({ icon: m[0], text: '', bold: false, link: null });
    at = m.index + m[0].length;
  }
  words(html.slice(at), false, null);
  return runs;
}

/** The cardio goals step in hand: today's model as the last whole draw made it, and the lines the page repaints in place as they stand. */
export interface CardioView { cardio: CardioStep; paint: CardioPaint }

/**
 * The cardio goals step drawn whole (renderWizardStep's branch and its tail). The draft is prepared first, as the
 * page prepares it; the model reads this app's readers; then the step's one repaint runs, as the page's does in the
 * same tick. The seed reader runs at a run goal's first draw and is kept on the draft, as on the page.
 */
export function cardioDraw(store: StateStore, d: Draft, now: Date): CardioView {
  const today = localIso(now);
  const cd = d as unknown as CardioDraft;
  prepareCardioDraft(cd, HYBRID_EXCLUDED_GOALS, today);
  const cardio = cardioStep(cd, {
    goalsByType: CARDIO_GOALS_BY_TYPE, hybridExcluded: HYBRID_EXCLUDED_GOALS, swimDist: SWIM_GOAL_DIST,
    icon: (key, size) => asyIcon(key, size),
    clock: (secs) => _clkMS(secs),
    paceTarget: (g) => paceGoalTarget(g as never) as { tTotalSecs?: number; tPacePerMile?: number },
    seed: () => seedView(d as { _seedDismissed?: boolean; _seed?: Seed | null; _seedApplied?: boolean }, () => seedFromStoredPrograms(store, now.getTime()) as Seed | null, (sec) => fmtPaceMi(sec)),
    swimAdvisory: () => swimAdvisory(swimEntryState(d.cardioGoals['swim'])),
    mileHelp: () => mileFieldHelp(d),
    mileAdvisory: () => mileAdvisory(draftMileState(d)),
    progLen: () => progLenLine(d, now),
    today,
  });
  const run = cardio.sports.find((x) => x.id === 'run')!.form, swim = cardio.sports.find((x) => x.id === 'swim')!.form;
  const race = cardio.footer && cardio.footer.race && cardio.footer.race.targeted ? cardio.footer.race : null;
  const mile = run && (run.kind === 'pace' || run.kind === 'other') ? run.mile : null;
  const paint: CardioPaint = {
    raceField: race ? race.value : null,
    progLen: cardio.footer ? cardio.footer.progLen : null,
    pace: run && run.kind === 'pace' ? (run.paceShown ? run.paceLine : '') : null,
    feas: run && run.kind === 'pace' ? '' : null,
    card: race ? '' : null,
    swimPace: swim && swim.kind === 'swim' ? (swim.paceShown ? swim.paceLine : '') : null,
    mileAdvisory: mile ? mile.advisory : null,
    swimAdvisory: swim && swim.kind === 'swim' ? swim.advisory : null,
  };
  return { cardio, paint: raceFeedback(d, now, paint) };
}

/** A goal's option (setCardioGoal): the sport's goal takes its id and its name from the table, and keeps every field it held. */
export function setCardioGoal(st: WizardState, type: string, id: string): void {
  const d = st.draft;
  if (!d.cardioGoals[type]) d.cardioGoals[type] = {};
  const g = d.cardioGoals[type]!;
  const goalData = (CARDIO_GOALS_BY_TYPE[type] || []).find((x) => x.id === id);
  g.id = id;
  g.label = goalData ? goalData.label : '';
  g.baseline = g.baseline || '';
}
/** mi or km on the pace goal (setPaceUnit). */
export function setPaceUnit(st: WizardState, unit: string): void {
  if (!st.draft.cardioGoals['run']) st.draft.cardioGoals['run'] = {};
  st.draft.cardioGoals['run']!['paceUnit'] = unit;
}
/** yd or m on a swim time goal (setSwimUnit). */
export function setSwimUnit(st: WizardState, unit: string): void {
  if (!st.draft.cardioGoals['swim']) st.draft.cardioGoals['swim'] = {};
  st.draft.cardioGoals['swim']!['swimUnit'] = unit;
}
/** Use this data (applySeedData): the seed's mile and its longest run into the run goal. False when there is nothing to apply, and the page draws nothing. */
export function applySeedData(st: WizardState): boolean {
  const d = st.draft as Draft & { _seed?: (Seed & { mileSec?: number }) | null; _seedApplied?: boolean };
  const s = d._seed; if (!s) return false;
  const g = d.cardioGoals && d.cardioGoals['run']; if (!g) return false;
  if (s.mileSec) {
    let mm = Math.floor(s.mileSec / 60), ss = Math.round(s.mileSec % 60);
    if (ss === 60) { mm++; ss = 0; }
    g['mileBestMins'] = String(mm); g['mileBestSecs'] = String(ss);
    g['mileBestSrc'] = { kind: 'seeded', prog: s.progName || '', n: s.n || 0 };
  }
  if (s.maxDist) { g['baselineDist'] = String(s.maxDist); g.baseline = s.maxDist + ((g['paceUnit'] as string) || 'mi'); }
  d._seedApplied = true;
  return true;
}
/** Start fresh (dismissSeedData): no banner for the rest of this wizard. */
export function dismissSeedData(st: WizardState): void {
  (st.draft as Draft & { _seedDismissed?: boolean })._seedDismissed = true;
}
/** The race date's two buttons (the Angular screen's raceDate): a date, today when none is picked yet, or none and no week count. */
export function raceTargeted(st: WizardState, targeted: boolean, now: Date): void {
  const d = st.draft;
  d.eventTargeted = targeted;
  if (targeted) {
    if (!d.raceDate) d.raceDate = localIso(now);
  } else {
    d.raceDate = '';
    d.raceDateWeeks = null;
  }
}
/** The shorter plan's link (offerShorterPlan): the run goal becomes the shorter plan's. The toast, or null when the link names no goal or no run goal is held (the page then does nothing). */
export function offerShorterPlan(st: WizardState, goalId: string): FloorToast | null {
  const def = (CARDIO_GOALS_BY_TYPE['run'] || []).find((x) => x.id === goalId);
  const run = st.draft.cardioGoals['run'];
  if (!def || !run) return null;
  run.id = def.id; run.label = def.label;
  return { icon: null, text: 'Switched to the ' + def.label + ' plan ✓' };
}

/** The page's updatePaceTime: the target as m:ss beside its two fields. */
function updatePaceTime(g: DraftGoal): void {
  const mins = g['targetMins'] || 0;
  const secs = g['targetSecs'] || 0;
  g['targetTime'] = mins + ':' + String(secs).padStart(2, '0');
}

/**
 * A value from one of the step's number fields (the Angular screen's edit): the draft's field, as handed back, then
 * what that field's handler repaints, and no more.
 */
export function editCardioField(st: WizardState, paint: CardioPaint, field: CardioField, sport: string, key: string, v: string, now: Date): CardioPaint {
  const d = st.draft;
  const g = d.cardioGoals[sport]!;
  g[key] = v;
  if (field === 'swimTarget') {
    updatePaceTime(g);
    return paint.swimPace === null ? paint : { ...paint, swimPace: swimPaceDisplay(d) };
  }
  if (field === 'swimBase') return paint.swimAdvisory === null ? paint : { ...paint, swimAdvisory: swimAdvisory(swimEntryState(d.cardioGoals['swim'])) };
  if (field === 'runDist') return raceFeedback(d, now, paint);
  if (field === 'runTarget') {
    updatePaceTime(g);
    return raceFeedback(d, now, paint);
  }
  if (field === 'paceBaseline') {
    g.baseline = v + ((g['paceUnit'] as string) || 'mi');
    return raceFeedback(d, now, paint);
  }
  if (field === 'mile') {
    g['mileBestSrc'] = { kind: 'entered' };
    const out = raceFeedback(d, now, paint);
    return out.mileAdvisory === null ? out : { ...out, mileAdvisory: mileAdvisory(draftMileState(d)) };
  }
  g.baseline = v + baselineSuffix(sport);
  return sport === 'run' ? raceFeedback(d, now, paint) : paint;
}

/** A day from the race date's field (the Angular screen's setRaceDate): the draft's race date, then the step's repaint. */
export function setRaceDate(st: WizardState, paint: CardioPaint, v: string, now: Date): CardioPaint {
  st.draft.raceDate = v;
  return raceFeedback(st.draft, now, { ...paint, raceField: v });
}

/** A line the page frames under the race date or the pace target, cut into what is drawn. */
export interface CardParts {
  /** The colour's name in today's sheet: run, accent, signal or red. */
  hue: string;
  /** A padded card; false is the bare red line with its warning mark. */
  card: boolean;
  /** Its words, as the page writes them (bold runs, the mark, the shorter plan's link). */
  body: string;
  /** The reach sentence under them, when the card carries it. */
  reach: string | null;
}
/** The card under the race date, or the pace reach frame, cut from the page's markup; null for an empty or hidden one. */
export function cardParts(html: string): CardParts | null {
  const m = /^<div style="color:var\(--([\w-]+)\);([^"]*)">([\s\S]*)<\/div>$/.exec(html);
  if (!m) return null;
  const r = /^([\s\S]*)<div style="margin-top:5px">([\s\S]*)<\/div>$/.exec(m[3]!);
  return { hue: m[1]!, card: /padding:9px 11px/.test(m[2]!), body: r ? r[1]! : m[3]!, reach: r ? r[2]! : null };
}

/** One draw of a step. */
export type StepView =
  | { step: 'primary'; choices: Choice[] }
  | { step: 'profile'; profile: ReturnType<typeof profileView> }
  | { step: 'equipment'; choices: Choice[] }
  | ({ step: 'cardio_goal' } & CardioView)
  | { step: 'lifting_focus'; lifting: ReturnType<typeof liftingView> }
  | { step: 'days'; days: ReturnType<typeof daysView> }
  | { step: 'name'; name: NameView };

/** The shell and the step in hand (renderWizardStep). Drawing the cardio goals or the name step writes their defaults into the draft, as the page's draw does. */
export function wizardView(store: StateStore, st: WizardState, now: Date): { shell: { fill: string; label: string; next: string }; view: StepView } {
  const d = st.draft, m = d as WizardDraft;
  const name = WIZARD_STEPS[st.step]!;
  const view: StepView =
    name === 'primary' ? { step: 'primary', choices: primaryChoices(m) }
      : name === 'profile' ? { step: 'profile', profile: profileView(m) }
        : name === 'equipment' ? { step: 'equipment', choices: equipmentChoices(m) }
          : name === 'cardio_goal' ? { step: 'cardio_goal', ...cardioDraw(store, d, now) }
            : name === 'lifting_focus' ? { step: 'lifting_focus', lifting: liftingView(m, LIFTING_OPTIONS) }
              : name === 'days' ? { step: 'days', days: daysView(m, { advisories: getDayAdvisories(d), minDays: getMinTrainDays(d), goalLabel }) }
                : { step: 'name', name: nameView(store, d, now) };
  return { shell: wizardShell(st.step, d.primaryPath), view };
}
