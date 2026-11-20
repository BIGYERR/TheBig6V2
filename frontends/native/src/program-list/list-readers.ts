// What the program list, the goal sheet and the mile pencil read (MIGRATION.md phase 3, row 5), written against the
// page's own code, line for line, with the clock handed in. Nothing here writes. Each is the page's:
//
//   _FOCUS_LABELS, _PATH_LABELS, _EQUIP_LABELS, _CARDIO_LABELS, _GOAL_LABELS, _DAYF        programs.ts
//   progSelData, runAnchorChips, runAnchorSentence, _goalCurWeek, _goalInputsValid         programs.ts
//   CARDIO_GOALS_BY_TYPE, HYBRID_EXCLUDED_GOALS, _GOAL_RANK, _GOAL_REQ_INPUTS              wizard.ts
//   _mileEntryState                                                                        wizard-generate.ts
//
// The goal tables and the mile's validator are the wizard's own; the wizard reads them from here once it is built
// in this app (row 6). tests/unit/native-program-list.test.ts holds each table equal to the page's.
import { ALL_DAYS_ORDER, _isoOf } from '@ia/core/engine/calendar.ts';
import { type RunAnchorInfo, runAnchorInfo } from '@ia/core/engine/cardio-progression.ts';
import { _fmtMileAnchor } from '@ia/core/engine/clock-format.ts';
import { DEFAULT_1RM } from '@ia/core/engine/exercise-library.ts';
import { NRC_GOALS, raceCountdown, raceCountdownWords } from '@ia/core/engine/nrc-race-bike-swim.ts';

import type { GoalChoice, GoalDraft } from '../goal-sheet/goal-sheet-model';
import { type ReadProgram, currentWeek, fmtStartDay } from '../this-week/week-readers';
import type { DetailChip, ProgSel } from './program-detail-model';

export const FOCUS_LABELS: Record<string, string> = { strength: 'Strength', hypertrophy: 'Size', fatloss: 'Fat Loss', balanced: 'Balanced', support_strength: 'Strength Support', support_athletic: 'Athletic Support', support_prevention: 'Injury Prevention' };
export const PATH_LABELS: Record<string, string> = { event: 'Race / Event', body: 'Strength / Physique', both: 'Hybrid' };
export const EQUIP_LABELS: Record<string, string> = { home_full: 'Home Gym — Full', home_basic: 'Home Gym — Basic', commercial: 'Commercial Gym', crossfit: 'CrossFit Box', bodyweight: 'Bodyweight only', minimal: 'Minimal / Travel' };
export const CARDIO_LABELS: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim' };
export const GOAL_LABELS: Record<string, string> = { strength: 'Strength', hypertrophy: 'Size', fatloss: 'Fat Loss', athletic: 'Athletic', balanced: 'Balanced' };
export const DAYF: Record<string, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };

/** A stored cardio goal, as far as these screens read and write it. */
export interface StoredGoal {
  id?: string; label?: string; baseline?: string;
  mileBestMins?: string | number; mileBestSecs?: string | number;
  mileBestSrc?: { kind?: string; at?: string; wk?: number; from?: { mins?: string | number; secs?: string | number; kind?: string } };
  swimUnit?: string; baseMins?: string | number; baseSecs?: string | number; base500Mins?: string | number; base500Secs?: string | number;
  targetMins?: string; targetSecs?: string; targetTime?: string; targetDist?: string; paceUnit?: string;
}
/** A stored program, as far as these screens read it. */
export interface ListProgram extends ReadProgram {
  id: string; name?: string; goal?: string; archived?: boolean; archivedAt?: number; seed?: number | string | null;
  mileNudge?: unknown;
  cfg?: (Omit<NonNullable<ReadProgram['cfg']>, 'cardioGoals'> & {
    days?: string[]; restDays?: string[]; equipment?: string; experience?: string; ageBracket?: string; unit?: string; goal?: string;
    liftingFocus?: string; primaryPath?: string; squat?: number; bench?: number; deadlift?: number; totalWeeks?: number; seed?: number | string | null;
    cardioGoals?: Record<string, StoredGoal | undefined>;
  }) | null;
}

/** The pace chips of a run that reads the chart (runAnchorChips): the goal's own first, then the row's, the effort beside each on a race plan. */
export function runAnchorChips(a: RunAnchorInfo): DetailChip[] {
  const r = a.row as unknown as Record<string, number>;
  const list: [string, number][] = a.goalId === 'run_base' ? [['Mile', r['mile']!]] : [['Mile', r['mile']!], ['5K', r['fiveK']!], ['10K', r['tenK']!], ['Tempo', r['tempo']!]];
  if (a.race) list.push([a.race === 'half' ? 'Half' : 'Marathon', r[a.race]!]);
  list.push(['Recovery', r['recovery']!]);
  const eff: Record<string, string> = { Mile: '9/10', '5K': '7–8/10', '10K': '6–7/10', Tempo: '6/10', Recovery: '4–5/10' };
  const nrc = !!(a.goalId && NRC_GOALS.has(a.goalId));
  const chips: DetailChip[] = list.map(([k, v]) => ({ k, v: _fmtMileAnchor(v), u: (nrc && eff[k]) ? '/mi · ' + eff[k] : '/mi' }));
  if (a.goalT) chips.unshift({ k: 'Goal', v: _fmtMileAnchor(a.goalT.sec), u: a.goalT.dist + ' mi' });
  return chips;
}

/** The sentence under the paces (runAnchorSentence): where the mile comes from, and what reads it. Markup: the mile is bold. */
export function runAnchorSentence(a: RunAnchorInfo): string {
  const m = _fmtMileAnchor(a.anchorSec);
  const art = /^(8|11|18):/.test(m) ? 'an' : 'a';
  const tail = (a.goalId === 'run_pace_goal')
    ? ' Week 1 runs off this row. Every week after it moves toward your goal.'
    : (a.goalId === 'run_base') ? ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'
    : ' Every pace in this program comes from this row.';
  if (a.clamped) {
    const raw = a.rawSec > 0 ? `the ${_fmtMileAnchor(a.rawSec)} you entered` : 'the mile time you entered';
    const why = a.rawSec > 0 ? (a.clamped === 'fast' ? 'is faster than the chart goes' : 'is slower than the chart goes') : 'is not a valid time';
    return `Anchored on ${art} <b>${m} mile</b>, ${raw} ${why}, so its ${a.clamped === 'fast' ? 'fastest' : 'slowest'} row is used.` + tail;
  }
  if (a.kind === 'seeded') return `Anchored on ${art} <b>${m} mile</b>, worked back from ${a.n > 0 ? a.n : 'the'} recovery run${a.n === 1 ? '' : 's'} you logged in ${a.prog || 'your last program'}.` + tail;
  if (a.kind === 'edited' && a.from) {
    const from = a.from.kind === 'default' ? 'the ' + a.exp + ' default'
      : _fmtMileAnchor((+a.from.mins! || 0) * 60 + (+a.from.secs! || 0));
    return `Anchored on ${art} <b>${m} mile</b>, the time you entered in week ${a.wk}. Before that it was ${from}.` + tail;
  }
  if (a.kind === 'entered' || a.kind === 'edited') return `Anchored on ${art} <b>${m} mile</b>, the time you entered.` + tail;
  return `Anchored on ${art} <b>${m} mile</b>, the ${a.exp} default. No mile time was entered. Tap the pencil to enter one.` + tail;
}

/** A program's selections as the card's detail reads them (progSelData), with the run's anchor typed. `now` is the draw's instant. */
export function progSelData(p: ListProgram, now: Date): ProgSel & { name: string; runAnchor: RunAnchorInfo | null } {
  const c = p.cfg || {};
  const exp = c.experience || 'intermediate';
  const d1 = (DEFAULT_1RM as Record<string, { bench: number; squat: number; deadlift: number }>)[exp] || { bench: 0, squat: 0, deadlift: 0 };
  const unit = c.unit || 'lbs';
  const lifts = {
    squat: (c.squat! > 0 ? c.squat! : d1.squat) || 0,
    bench: (c.bench! > 0 ? c.bench! : d1.bench) || 0,
    deadlift: (c.deadlift! > 0 ? c.deadlift! : d1.deadlift) || 0,
    estimated: !(c.squat! > 0 || c.bench! > 0 || c.deadlift! > 0),
  };
  const order: string[] = ALL_DAYS_ORDER;
  const rest = c.restDays || [];
  let raceStr = '';
  if (c.raceDate) raceStr = String(fmtStartDay(c.raceDate, true));
  return {
    name: p.name || 'My Program',
    goal: (p.goal || c.goal || ''),
    liftLabel: FOCUS_LABELS[c.liftingFocus!] || c.liftingFocus || '—',
    pathLabel: PATH_LABELS[c.primaryPath!] || c.primaryPath || '—',
    experience: exp, ageBracket: c.ageBracket || '18-35',
    equipLabel: EQUIP_LABELS[c.equipment!] || c.equipment || '—',
    unit, lifts,
    trainDays: order.filter((d) => !rest.includes(d)),
    restDays: order.filter((d) => rest.includes(d)),
    length: (p.totalWeeks || c.totalWeeks || 6),
    cardio: (c.cardioTypes || []).map((t) => ({ type: t, label: CARDIO_LABELS[t] || t, goal: (c.cardioGoals && c.cardioGoals[t] && c.cardioGoals[t]!.label) || '' })),
    eventTargeted: (c.primaryPath === 'event'),
    raceStr, raceOut: raceCountdownWords(c.raceDate ? raceCountdown(c.raceDate, _isoOf(now)) : null),
    seed: (c.seed != null ? c.seed : (p.seed != null ? p.seed : null)),
    runAnchor: runAnchorInfo(c as never),
  };
}

/** The week a program is in (_goalCurWeek): any stored program's, not the active one's alone. `today` is the day at midnight. */
export function goalCurWeek(p: ListProgram, today: Date): number {
  return currentWeek(p, today);
}

/** The goals each sport offers (CARDIO_GOALS_BY_TYPE). */
export const CARDIO_GOALS_BY_TYPE: Record<string, GoalChoice[]> = {
  run: [
    { id: 'run_5k', label: 'Run a 5K', desc: '3.1 miles without stopping' },
    { id: 'run_10k', label: 'Run a 10K', desc: '6.2 miles. A solid aerobic base.' },
    { id: 'run_half', label: 'Half Marathon', desc: '13.1 miles. Serious endurance.' },
    { id: 'run_marathon', label: 'Full Marathon', desc: '26.2 miles. The full distance.' },
    { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', desc: 'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.' },
    { id: 'run_base', label: 'Build Running Base', desc: 'Get consistent, increase mileage safely' },
  ],
  bike: [
    { id: 'bike_century', label: 'Century Ride (100mi)', desc: 'Long distance cycling endurance' },
    { id: 'bike_50', label: '50-Mile Ride', desc: 'Mid-distance cycling goal' },
    { id: 'bike_ftp', label: 'Improve FTP / Power', desc: 'Sustained cycling power output' },
    { id: 'bike_cals', label: 'Hit Calorie Targets', desc: 'Burn-focused spin sessions' },
    { id: 'bike_base', label: 'Build Cycling Base', desc: 'Consistency and aerobic capacity' },
  ],
  swim: [
    { id: 'swim_tri', label: 'Triathlon Swim', desc: 'Open water race. 750 m to 1.9 km.' },
    { id: 'swim_mile', label: 'Swim a Mile', desc: '1,650 yards continuous' },
    { id: 'swim_100_time', label: 'Improve 100 Time', desc: 'Speed-focused lap swimming' },
    { id: 'swim_500_time', label: 'Improve 500 Time', desc: 'Mid-distance swim performance' },
    { id: 'swim_base', label: 'Build Swim Base', desc: 'Structure and endurance in the water' },
  ],
};
/** The peaking goals the hybrid path leaves out (HYBRID_EXCLUDED_GOALS). */
export const HYBRID_EXCLUDED_GOALS: ReadonlySet<string> = new Set(['run_half', 'run_marathon', 'bike_century', 'swim_tri']);
/** Each goal's volume rank within its sport (_GOAL_RANK): a switch to a higher one is a step up. */
export const GOAL_RANK: Readonly<Record<string, number>> = {
  run_marathon: 6, run_half: 5, run_10k: 4, run_5k: 3, run_pace_goal: 2, run_base: 1,
  bike_century: 5, bike_50: 4, bike_ftp: 3, bike_base: 2, bike_cals: 1,
  swim_tri: 5, swim_mile: 4, swim_500_time: 3, swim_100_time: 2, swim_base: 1,
};
/** The goals that need a target typed before the switch (_GOAL_REQ_INPUTS). */
export const GOAL_REQ_INPUTS: ReadonlySet<string> = new Set(['run_pace_goal', 'swim_100_time', 'swim_500_time']);

/** Whether the goal picked has the targets it needs typed (_goalInputsValid): a distance and a time for the pace goal, a time for the swim times. */
export function goalInputsValid(draft: GoalDraft): boolean {
  const sel = draft.sel;
  if (!sel || !GOAL_REQ_INPUTS.has(sel)) return true;
  const i = draft.inputs;
  const hasTime = (+i.targetMins! > 0) || (+i.targetSecs! > 0);
  if (sel === 'run_pace_goal') return (parseFloat(i.targetDist!) > 0) && hasTime;
  return hasTime;
}

/** What the mile's validator says of an entry: refused with its words, or taken, with a line when the chart clamps it. */
export interface MileEntry { ok: boolean; blank?: boolean; msg?: string; adv?: string }
/** The page's _mileEntryState, given the goal and the experience (the mile pencil's call; the wizard's draft is not read here). */
export function mileEntryState(g: StoredGoal | null | undefined, exp: string): MileEntry {
  if (!g) return { ok: true };
  if (g.mileBestMins === undefined || g.mileBestMins === '') {
    if (g.id === 'run_pace_goal' && exp !== 'beginner') return { ok: false, blank: true, msg: 'Required. Enter your most recent timed mile.' };
    return { ok: true };
  }
  const mm = +g.mileBestMins, ss = +(g.mileBestSecs || 0);
  const sec = mm * 60 + ss;
  if (!(mm >= 0) || !(ss >= 0) || ss >= 60 || !isFinite(sec)) return { ok: false, msg: 'That mile time is not a real time. Check the minutes and seconds.' };
  if (sec < 180) return { ok: false, msg: 'Under 3:00 is not a mile time. The world record is 3:43. Check the entry.' };
  if (sec > 1500) return { ok: false, msg: 'Over 25:00 reads as a walk, not a run. Check the entry.' };
  if (sec < 300) return { ok: true, adv: 'At ' + _fmtMileAnchor(sec) + ' your paces come from the chart’s fastest row, 5:00. It tops out there.' };
  if (sec > 720) return { ok: true, adv: 'At ' + _fmtMileAnchor(sec) + ' your paces come from the 12:00 row, the chart’s slowest. Consider a base block first.' };
  return { ok: true };
}
