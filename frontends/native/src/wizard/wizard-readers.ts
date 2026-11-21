// What the wizard reads, in the Expo app (MIGRATION.md phase 3, row 6, the first of two sessions). Each function is
// the page's own, line for line, with the page's globals (the draft `WD`, the store, the clock) taken as arguments:
//
//   startWizard's draft, _isoToday, _fmtSpan, startResolveCopy, startSummaryVal, wizardStartSummary,
//   wizardAlignment, wizardTestPin, alignedStartCopy, goalLabel, LIFTING_OPTIONS, MIN_TRAIN_DAYS,
//   GOAL_RECOMMENDED_DAYS, getDayAdvisories, getMinTrainDays, getMinTrainDaysLabel, the name step's reads   wizard.ts
//   _swimEntryState (the mile's twin, _mileEntryState, is program-list/list-readers.ts's)                   wizard-generate.ts
//
// The steps' own words are today's two models, held to the byte (wizard-model.ts, cardio-goal-model.ts). What the
// page still writes as markup beside them is here: the copy under the start date and under a start set by a race
// date, the summary's start, cardio and race rows, the rest day step's advisories. A line that carries markup
// (a bold run, an icon, the shorter plan's link) is kept as the page writes it and cut into runs where it is drawn.
//
// Nothing here writes to the store. The name step reads it once, for the default name's number.
// tests/support/native-wizard.ts holds each of these equal to today's page, draft for draft.
import { ALL_DAYS_ORDER, _ISO_ORDER, _isoOf, _parseLocalDate } from '@ia/core/engine/calendar.ts';
import { isSpeedGoal, sportDayTargets } from '@ia/core/engine/cardio-progression.ts';
import { LIFTING_FOCUS_TO_GOAL } from '@ia/core/engine/exercise-library.ts';
import { asyIcon } from '@ia/core/engine/icons.ts';
import { NRC_SHORTER, raceAlignment, raceCountdown, raceCountdownWords } from '@ia/core/engine/nrc-race-bike-swim.ts';
import { calcProgramLength } from '@ia/core/engine/nsw-cardio.ts';
import { readPrograms } from '@ia/core/engine/state-programs.ts';
import { progTestPin } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { CARDIO_GOALS_BY_TYPE } from '../program-list/list-readers';
import { fmtStartDay } from '../this-week/week-readers';
import { type ResolvedStart, resolveStartDate, rsRace } from '../week-dates/week-dates';
import { alignedPips } from './cardio-goal-model';
import { LIFT_LABELS, type LiftOption, nameSummary } from './wizard-model';

/** A cardio goal in the draft: its id and label, and whatever its fields hold, as typed. */
export interface DraftGoal { id?: string; label?: string; baseline?: string; [key: string]: unknown }

/** The draft, whole (the page's `WD`). Generate stores it as the program's config. */
export interface Draft {
  primaryPath?: string;
  cardioTypes: string[];
  cardioGoals: Record<string, DraftGoal | undefined>;
  eventTargeted?: boolean;
  liftingFocus?: string;
  experience?: string;
  ageBracket?: string;
  equipment?: string;
  unit?: string;
  restDays: string[];
  days?: string[];
  bench?: number;
  squat?: number;
  deadlift?: number;
  name?: string;
  startDate?: string;
  raceDate?: string;
  raceDateWeeks?: number | null;
  _raceDateCappedWeeks?: number;
  _testWeek?: number | null;
  [key: string]: unknown;
}

/** The page's _isoToday: today's local day. */
export function isoToday(now: Date): string {
  const t = new Date(now);
  t.setHours(0, 0, 0, 0);
  return _isoOf(t);
}

/** The draft Build New Program opens with (startWizard). */
export function newDraft(now: Date): Draft {
  return {
    primaryPath: 'body', cardioTypes: [], cardioGoals: {}, eventTargeted: true,
    liftingFocus: 'balanced', experience: 'intermediate', ageBracket: '18-35',
    equipment: 'home_full', unit: 'lbs', restDays: [],
    days: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
    bench: 0, squat: 0, deadlift: 0, name: '',
    startDate: isoToday(now),
  };
}

/** The lifting focuses each path offers (LIFTING_OPTIONS). The hybrid path reads the strength path's. */
export const LIFTING_OPTIONS: { body: LiftOption[]; event: LiftOption[] } = {
  body: [
    { id: 'strength', icon: '🏋️', label: 'Strength', desc: 'Heavy compounds, low reps, max force output' },
    { id: 'hypertrophy', icon: '💪', label: 'Size', desc: 'Volume-focused, muscle growth' },
    { id: 'fatloss', icon: '🔥', label: 'Fat Loss', desc: 'Circuits, supersets, conditioning' },
    { id: 'balanced', icon: '⚖️', label: 'Balanced', desc: 'Strength + conditioning, well-rounded' },
  ],
  event: [
    { id: 'support_strength', icon: '🦾', label: 'Strength Support', desc: 'Low intensity lifts that support your sport without competing with it' },
    { id: 'support_athletic', icon: '⚡', label: 'Athletic Support', desc: 'Power, explosiveness, sport-specific strength' },
    { id: 'support_prevention', icon: '🛡️', label: 'Injury Prevention', desc: 'Stability, mobility, posterior chain — keep you healthy and running' },
  ],
};

/** The training days a lifting goal is most effective with (MIN_TRAIN_DAYS): the advisory's number, never a gate. */
const MIN_TRAIN_DAYS: Record<string, number> = {
  strength: 3, hypertrophy: 4, fatloss: 3, athletic: 4, balanced: 4, endurance: 4,
  support_strength: 4, support_athletic: 4, support_prevention: 3,
};
/** The training days a cardio goal trains best with (GOAL_RECOMMENDED_DAYS): the advisory's number. */
const GOAL_RECOMMENDED_DAYS: Record<string, number> = { run_5k: 4, run_10k: 4, run_half: 4, run_marathon: 5, swim_mile: 4, swim_tri: 5 };
/** The fewest training days each cardio goal builds on (getMinTrainDays): the rest day step's floor. */
const CARDIO_FLOORS: Record<string, number> = {
  run_marathon: 5, run_half: 4, run_10k: 3, run_5k: 3, run_pace_goal: 3,
  run_mile_time: 3, run_15_under10: 3, run_base: 3,
  swim_tri: 4, swim_mile: 4, swim_500_time: 3, swim_100_time: 3, swim_base: 3,
  bike_century: 4, bike_50: 3, bike_ftp: 3, bike_cals: 3, bike_base: 3,
};

/** A goal's name from the goal tables, across the sports (goalLabel); "your" for one they do not hold. */
export function goalLabel(goalId: string | undefined): string {
  for (const sport in CARDIO_GOALS_BY_TYPE) {
    const found = CARDIO_GOALS_BY_TYPE[sport]!.find((g) => g.id === goalId);
    if (found) return found.label;
  }
  return 'your';
}

// ── The start date ──────────────────────────────────────────────────────────────────────────────────────────────
function fmtSpan(isoFrom: string, isoTo: string): string {
  const a = _parseLocalDate(isoFrom), b = _parseLocalDate(isoTo);
  if (!a || !b) return '';
  return a.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + b.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
/** The one sentence under the start date's field (startResolveCopy, D21, D25, D184 c), as the page writes it. */
export function startResolveCopy(r: ResolvedStart): string {
  const sunOf = (iso: string): string => { const m = _parseLocalDate(iso)!; const s = new Date(m); s.setDate(m.getDate() + 6); return _isoOf(s); };
  if (r.holdsTest) {
    return 'That week holds your test, so this starts <b>' + fmtStartDay(r.start) + '</b>. Nothing is left to train before it. Week 1 is the test week.';
  }
  if (r.snapped) {
    return 'Nothing left to train that week, so this starts <b>' + fmtStartDay(r.start) + '</b>. Week 1 runs <b>' + fmtSpan(r.start, sunOf(r.start)) + '</b>.';
  }
  if (r.partial) {
    const days = r.week1Train.map((k) => '<b>' + fmtStartDay(_isoOf((() => { const m = _parseLocalDate(r.mon)!; const x = new Date(m); x.setDate(m.getDate() + _ISO_ORDER.indexOf(k as never)); return x; })())) + '</b>');
    const list = days.length === 1 ? days[0] : days.slice(0, -1).join(', ') + ' and ' + days[days.length - 1];
    return 'Week 1 is short — you’ll train ' + list + ', then a full week from <b>' + fmtStartDay(r.nextMon) + '</b>.';
  }
  return 'Week 1 runs <b>' + fmtSpan(r.start, sunOf(r.start)) + '</b>.';
}
/** The summary row's start (startSummaryVal, D246): the resolved start, and what is to be known of it. */
export function startSummaryVal(r: { start: string; aligned?: boolean; partial?: boolean }): string {
  if (r && r.aligned) return fmtStartDay(r.start, true) + ', set by race date';
  return fmtStartDay(r.start, true) + (r.partial ? ', short first week' : '');
}

/** What a race plan's alignment hands back (core's raceAlignment). */
export type Alignment = NonNullable<ReturnType<typeof raceAlignment>>;

/** The page's wizardAlignment (D14a): a run race goal with a race date, on the race and hybrid paths. */
export function wizardAlignment(d: Draft, now: Date): Alignment | null {
  if (!d || !d.cardioTypes || !d.cardioTypes.includes('run') || !d.cardioGoals || !d.cardioGoals['run']) return null;
  if (d.primaryPath !== 'event' && d.primaryPath !== 'both') return null;
  return raceAlignment(d.cardioGoals['run'].id, d.raceDate, d.eventTargeted !== false, isoToday(now));
}
/** The page's wizardStartSummary (D242): the summary row reads the start the field above it shows. */
export function wizardStartSummary(d: Draft, sr: ResolvedStart, now: Date): string {
  const al = wizardAlignment(d, now);
  return startSummaryVal(al ? { start: al.start, aligned: true } : sr);
}
/** The page's wizardTestPin (D183, D184): the dated test goal's pin from the resolved start, or null. */
export function wizardTestPin(d: Draft, now: Date): (NonNullable<ReturnType<typeof progTestPin>> & { holdsTest?: true }) | null {
  if (!d) return null;
  const r = resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now);
  const p = progTestPin(d as never, r.start);
  return (p && r.holdsTest) ? { ...p, holdsTest: true } : p;
}

const RACE_NAME: Record<string, string> = { run_5k: '5K', run_10k: '10K', run_half: 'half', run_marathon: 'marathon' };
const RACE_GOAL_LBL: Record<string, string> = { run_5k: '5K plan', run_10k: '10K plan', run_half: 'half marathon plan', run_marathon: 'marathon plan' };
const DAY_NAME: Record<string, string> = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
/** The copy under a start set by a race date (alignedStartCopy), as the page writes it, the shorter plan's link and all. */
export function alignedStartCopy(d: Draft, al: Alignment): string {
  const g = d.cardioGoals['run']!.id as string, nm = RACE_NAME[g] || 'race';
  const dayName = DAY_NAME[al.raceDay];
  const raceTxt = '<b>' + fmtStartDay(al.raceIso) + '</b>, ' + al.weeksOut + ' week' + (al.weeksOut === 1 ? '' : 's') + ' out';
  if (al.futureWeeks) {
    return 'Your ' + nm + ' is ' + raceTxt + '. The ' + al.tw + '-week plan starts <b>' + fmtStartDay(al.start) + '</b>, ' + al.futureWeeks + ' week' + (al.futureWeeks === 1 ? '' : 's') + ' from now, so it peaks on race week and not early. Until then: run easy three times a week, 30–45 minutes, nothing hard.';
  }
  let t = 'Your ' + nm + ' is ' + raceTxt + '. The ' + al.tw + '-week plan starts <b>' + fmtStartDay(al.start) + '</b> so race week is week ' + al.tw + '. You open in <b>week ' + al.openWeek + '</b>.';
  if (al.behindWeeks) t += ' Weeks 1–' + al.behindWeeks + ' are behind you: shown, not counted, not missed.';
  t += ' Race day pins to <b>' + dayName + '</b>.';
  if (al.underFloor) {
    const sh = (NRC_SHORTER as Record<string, string | undefined>)[g];
    t += ' I don’t recommend under ' + al.floor + ' weeks for the ' + nm + '.';
    if (sh) t += ' The <a onclick="offerShorterPlan(\'' + sh + '\')">' + RACE_GOAL_LBL[sh] + '</a> fits this window better.';
  }
  return t;
}

// ── The rest days ───────────────────────────────────────────────────────────────────────────────────────────────
/** The page's getDayAdvisories: lifting days, cardio goal days, interval days, each as the markup the page writes. */
export function getDayAdvisories(d: Draft): string[] {
  const out: string[] = [];
  const trainDays = ALL_DAYS_ORDER.filter((x) => !d.restDays.includes(x));
  const nDays = trainDays.length;
  const cardioTypes = d.cardioTypes || [];
  const cardioGoals = d.cardioGoals || {};
  const focusGoal = (LIFTING_FOCUS_TO_GOAL as Record<string, string | undefined>)[d.liftingFocus || ''];

  const internalGoal = focusGoal || d.liftingFocus || 'balanced';
  const liftMin = MIN_TRAIN_DAYS[internalGoal] || 3;
  if (nDays < liftMin) {
    const label = (d.liftingFocus || '').replace('support_', '').replace('_', ' ');
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
    out.push(asyIcon('dumbbell', 14) + ' ' + labelCap + ' training is most effective with <b>' + liftMin + '+ days</b> — you have ' + nDays + '.');
  }

  cardioTypes.forEach((sport) => {
    const goal = cardioGoals[sport];
    const rec = goal && GOAL_RECOMMENDED_DAYS[goal.id as string];
    if (rec && nDays < rec) {
      out.push(asyIcon('flag', 14) + ' Your <b>' + goalLabel(goal.id) + '</b> goal trains best with <b>' + rec + '+ days</b> for the weekly volume — you have ' + nDays + '.');
    }
  });

  const targets = (sportDayTargets as unknown as (t: string[], g: unknown, n: number, lift: string) => { targets: Record<string, number | undefined> })(cardioTypes, cardioGoals, nDays, focusGoal || 'balanced').targets;
  const sportWord: Record<string, string> = { run: 'running', bike: 'cycling', swim: 'swimming' };
  const sportIcon: Record<string, string> = { run: '🏃', bike: '🚴', swim: '🏊' };
  cardioTypes.forEach((sport) => {
    const goal = cardioGoals[sport];
    if (!goal || !isSpeedGoal(goal.id as never)) return;
    const slots = targets[sport] || 0;
    if (slots < 3) {
      const word = sportWord[sport] || sport;
      const multi = cardioTypes.length > 1;
      const why = multi
        ? 'with ' + cardioTypes.length + ' sports sharing the week, ' + word + ' gets ' + slots + ' day' + (slots === 1 ? '' : 's')
        : 'you have ' + slots + ' ' + word + ' day' + (slots === 1 ? '' : 's');
      const fix = multi ? 'Add a training day or drop a sport' : 'Add a training day';
      out.push(asyIcon(sportIcon[sport] || '⏱', 14) + ' Your <b>' + goalLabel(goal.id) + '</b> goal needs <b>3+ ' + word + ' days</b> for interval (speed) work — ' + why + '. ' + fix + '.');
    }
  });

  return out;
}

/** The page's getMinTrainDays: three, or what the draft's cardio goals need. */
export function getMinTrainDays(d: Draft): number {
  let floor = 3;
  const cardioTypes = d.cardioTypes || [];
  const cardioGoals = d.cardioGoals || {};
  cardioTypes.forEach((sport) => {
    const goal = cardioGoals[sport];
    if (goal && CARDIO_FLOORS[goal.id as string]) floor = Math.max(floor, CARDIO_FLOORS[goal.id as string]!);
  });
  return floor;
}

/** The page's getMinTrainDaysLabel: why the floor holds, in the words of the toast a locked day answers with. */
export function getMinTrainDaysLabel(d: Draft): string {
  const cardioTypes = d.cardioTypes || [];
  const cardioGoals = d.cardioGoals || {};
  const goalLabels: string[] = [];
  cardioTypes.forEach((sport) => {
    const goal = cardioGoals[sport];
    if (goal) goalLabels.push(goalLabel(goal.id));
  });
  const min = getMinTrainDays(d);
  if (goalLabels.length) return goalLabels.join(' + ') + ' needs ' + min + ' training days — see why below';
  return 'Three days is the floor. Two gives you the same session twice.';
}

// ── The swim times ──────────────────────────────────────────────────────────────────────────────────────────────
/** What the swim validator says of a goal's current times (D110a): refused with its words, or taken. */
export interface SwimEntry { ok: boolean; blank?: boolean; msg?: string }
/** The page's _swimEntryState: a swim time goal needs a real current time. */
export function swimEntryState(g: DraftGoal | null | undefined): SwimEntry {
  if (!g || (g.id !== 'swim_500_time' && g.id !== 'swim_100_time')) return { ok: true };
  const unit = (g['swimUnit'] as string) || 'yd', is100 = g.id === 'swim_100_time';
  const num = (v: unknown): number => ((v === undefined || v === null || v === '') ? 0 : +(v as number));
  const fields = is100 ? ['baseMins', 'baseSecs', 'base500Mins', 'base500Secs'] : ['baseMins', 'baseSecs'];
  for (const k of fields) { const v = num(g[k]); if (!isFinite(v) || (/Secs$/.test(k) && v >= 60)) return { ok: false, msg: 'That is not a real time. Check the minutes and seconds.' }; }
  const tot = (m: string, s: string): number => num(g[m]) * 60 + num(g[s]);
  const t500 = is100 ? tot('base500Mins', 'base500Secs') : tot('baseMins', 'baseSecs');
  if (!(t500 > 0)) return { ok: false, blank: true, msg: 'Required. Enter your most recent timed 500' + unit + '.' };
  if (is100) {
    const t100 = tot('baseMins', 'baseSecs');
    if (!(t100 > 0)) return { ok: false, blank: true, msg: 'Required. Enter your most recent timed 100' + unit + '.' };
    if (t500 / 5 < t100) return { ok: false, msg: 'Your 500 pace is faster than your 100 time. Check both entries.' };
  }
  return { ok: true };
}

// ── The name step ───────────────────────────────────────────────────────────────────────────────────────────────
/** The goals handed to core's length, as the page hands them: the draft's, with the experience, the age and the race flag. */
export function lengthGoals(d: Draft, defaults: boolean): Record<string, unknown> {
  return { ...d.cardioGoals, _experience: defaults ? d.experience || 'intermediate' : d.experience, _ageBracket: defaults ? d.ageBracket || '18-35' : d.ageBracket, _eventTargeted: d.eventTargeted };
}
/** The program's length as the name step prints it: the test week when a dated test pins, else the goals' length, else 6. */
export function nameWeeks(d: Draft, now: Date): number {
  const types = d.cardioTypes || [];
  const internalGoal = (LIFTING_FOCUS_TO_GOAL as Record<string, string | undefined>)[d.liftingFocus || ''] || d.liftingFocus;
  const pin = wizardTestPin(d, now);
  return (pin || ({} as { tw?: number | null })).tw || (types.length ? calcProgramLength(types as never, lengthGoals(d, false) as never, internalGoal).weeks : 6);
}

/** The name step, as the screen draws it. `copy` and a row's value are markup, as the page writes them. */
export interface NameView {
  name: string;
  startDate: string;
  /** A start set by a race date: the day, whether it is under the plan's floor, the copy and the pips under it. */
  aligned: { start: string; warn: boolean; copy: string; pips: string[] | null } | null;
  /** Under the start date's field, when no race sets the start. */
  resolveCopy: string;
  rows: { k: string; v: string }[];
}

/**
 * The name step's reads (renderWizardStep's last branch, and the Angular screen's name()). As the page does before it
 * draws, it writes a default name ("<focus> Block N", N the stored programs plus one) and a start of today into a
 * draft that holds none.
 */
export function nameView(store: StateStore, d: Draft, now: Date): NameView {
  const types = d.cardioTypes || [], goals = d.cardioGoals || {};
  const liftLabel = LIFT_LABELS[d.liftingFocus || ''] || d.liftingFocus;
  const sport: Record<string, [string, string]> = { run: ['🏃', 'Run'], bike: ['🚴', 'Bike'], swim: ['🏊', 'Swim'] };
  const cardio = types.length
    ? types.map((t) => asyIcon(sport[t]![0], 15) + ' ' + sport[t]![1] + (goals[t] && goals[t]!.label ? ': ' + goals[t]!.label : '')).join(' + ')
    : 'Lift only';
  const weeks = nameWeeks(d, now);
  if (!d.name) d.name = liftLabel + ' Block ' + (readPrograms(store).length + 1);
  if (!d.startDate) d.startDate = isoToday(now);
  const sr = resolveStartDate(d.startDate, d.restDays || [], rsRace(d as never), now);
  const al = wizardAlignment(d, now);
  let raceRow: string | null = null;
  if (d.primaryPath === 'event' && d.raceDate) {
    const cd = raceCountdown(d.raceDate, isoToday(now));
    const w = raceCountdownWords(cd);
    raceRow = fmtStartDay(d.raceDate, true) + (!w ? '' : cd!.days <= 0 ? ' (' + w.copy + ')' : ' (' + w.card + ' away)');
  } else if (d.primaryPath === 'event') {
    raceRow = 'No date set — no taper';
  }
  const rows = nameSummary(d, { weeks, cardio, raceRow, startSummary: wizardStartSummary(d, sr, now), aligned: null, resolveCopy: '' });
  return {
    name: d.name as string,
    startDate: d.startDate,
    aligned: al ? { start: fmtStartDay(al.start, true), warn: !!al.underFloor, copy: alignedStartCopy(d, al), pips: alignedPips(al) } : null,
    resolveCopy: al ? '' : startResolveCopy(sr),
    rows,
  };
}
