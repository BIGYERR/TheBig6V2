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
// THE CARDIO GOALS, THIS SESSION. The step is drawn from today's own model (cardio-goal-model.ts) as far as the
// sports and their goals: a sport opens and shuts and lists its goals. Picking a goal, its fields, the seed offer,
// the race date and the card under it are the second session's, so a goal's form and the box under the cards are
// not read here (cardioCards stops at the goals). The draft is still prepared as the page prepares it when the step
// is drawn: a race date of today when it has none, no week count without one, no taper goal on the hybrid path.
//
// tests/support/native-wizard.ts holds the draft, the step and each step's markup equal to today's page, tap for tap.
import { ALL_DAYS_ORDER, _parseLocalDate } from '@ia/core/engine/calendar.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS } from '../program-list/list-readers';
import { currentWeek } from '../this-week/week-readers';
import { type CardioDraft, type GoalChoice, type Sport, cardioStep, localIso, prepareCardioDraft } from './cardio-goal-model';
import {
  type Choice, WIZARD_STEPS, type WizardDraft, daysView, equipmentChoices, liftingView, primaryChoices, profileView, wizardShell,
} from './wizard-model';
import { resolveStartDate, rsRace } from '../week-dates/week-dates';
import {
  type Draft, LIFTING_OPTIONS, type NameView, getDayAdvisories, getMinTrainDays, getMinTrainDaysLabel, goalLabel, nameView, newDraft, startResolveCopy, startSummaryVal, wizardAlignment,
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

/** The floor's toast: the warning mark the page writes before its words, and the words. */
export interface FloorToast { icon: string; text: string }
/** The toast as the page hands it to showToast: the mark's markup, a space, the words. */
export const floorToastMarkup = (t: FloorToast): string => asyIcon(t.icon, 13) + ' ' + t.text;

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
  const re = /<svg[\s\S]*?<\/svg>|<b>([\s\S]*?)<\/b>|<a onclick="offerShorterPlan\('([^']*)'\)">([\s\S]*?)<\/a>/g;
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

/** A sport's card on the cardio goals, as far as this session draws it: its header, and open, its goals. */
export interface SportCardView { id: Sport; sel: boolean; icon: string; name: string; desc: string; goals: (GoalChoice & { sel: boolean })[] }

/**
 * The cardio goals step's cards. The draft is prepared first, as the page prepares it. The cards are today's own
 * model's; a goal's form and the box under the cards are read by none of this session's screens, so the model is
 * handed readers for the sports and the goals alone.
 */
export function cardioCards(d: Draft, now: Date): SportCardView[] {
  const today = localIso(now);
  prepareCardioDraft(d as unknown as CardioDraft, HYBRID_EXCLUDED_GOALS, today);
  // The model reads a goal's form through these; with no goal in the draft handed to it, none is called.
  const bare: CardioDraft = { primaryPath: d.primaryPath, cardioTypes: d.cardioTypes, cardioGoals: {} };
  const unread = (): never => { throw new Error('the cardio goals\' forms are the second session\'s'); };
  const step = cardioStep(bare, {
    goalsByType: CARDIO_GOALS_BY_TYPE, hybridExcluded: HYBRID_EXCLUDED_GOALS, swimDist: {}, icon: unread, clock: unread, paceTarget: unread,
    seed: unread, swimAdvisory: unread, mileHelp: unread, mileAdvisory: unread, progLen: unread, today,
  });
  return step.sports.map((s) => ({ id: s.id, sel: s.sel, icon: s.icon, name: s.name, desc: s.desc, goals: s.goals.map((g) => ({ ...g, sel: d.cardioGoals[s.id]?.id === g.id })) }));
}

/** One draw of a step. */
export type StepView =
  | { step: 'primary'; choices: Choice[] }
  | { step: 'profile'; profile: ReturnType<typeof profileView> }
  | { step: 'equipment'; choices: Choice[] }
  | { step: 'cardio_goal'; sports: SportCardView[] }
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
          : name === 'cardio_goal' ? { step: 'cardio_goal', sports: cardioCards(d, now) }
            : name === 'lifting_focus' ? { step: 'lifting_focus', lifting: liftingView(m, LIFTING_OPTIONS) }
              : name === 'days' ? { step: 'days', days: daysView(m, { advisories: getDayAdvisories(d), minDays: getMinTrainDays(d), goalLabel }) }
                : { step: 'name', name: nameView(store, d, now) };
  return { shell: wizardShell(st.step, d.primaryPath), view };
}
