// D274 P-ANCHORNUDGE (docs/decisions/mile-anchor.md): two easy runs in a row off the plan offer the mile pencil,
// pre-filled. The judge and the sheet's words, kept apart from Angular so the app's node --test suite reads them as they
// are. The app never writes the mile itself: the sheet only opens the pencil (D189) with the offer in its fields.
import { mileLocked } from '../mile-sheet/mile-sheet-model.ts';

/** A program week runs Monday to Sunday (the store's `w<week>_<day>` keys). */
export const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

/** A chart row is 30 seconds of mile (PACE_CHART's mile column). */
export const ROW_SEC = 30;

interface RunLike {
  type?: string;
  subtype?: string;
  dose?: { tgt?: number | null } | null;
}
/** A frozen day (`ia_hist_`), as far as the judge reads it. */
export interface DayLike {
  cardio?: RunLike | RunLike[] | null;
}
/** A cardio log (`ia_logs_`), as far as the judge reads it. */
export interface LogLike {
  run_dist?: string | number | null;
  run_mins?: string | number | null;
  swapTo?: string | null;
}

/** An easy card's prescribed pace: a recovery run or a long run with a target (sec/mi), never a speed run or the race. */
export function easyTarget(day: DayLike | null | undefined): number | null {
  const list = Array.isArray(day?.cardio) ? day.cardio : day?.cardio ? [day.cardio] : [];
  const c = list.find((x) => x && x.type === 'run');
  if (!c) return null;
  const sub = String(c.subtype || '');
  if (/race day/i.test(sub)) return null;
  const head = sub.split('—')[0].trim().toLowerCase();
  if (head !== 'recovery run' && head !== 'long run') return null;
  const tgt = Number(c.dose && c.dose.tgt);
  return tgt > 0 ? tgt : null;
}

/** The pace a run was logged at (sec/mi), from its distance and its time; null without both, or on a swapped sport. */
export function loggedPace(log: LogLike | null | undefined): number | null {
  if (!log) return null;
  if (log.swapTo && log.swapTo !== 'run') return null;
  const dist = parseFloat(String(log.run_dist ?? ''));
  const mins = parseFloat(String(log.run_mins ?? ''));
  if (!(dist > 0) || !(mins > 0)) return null;
  return (mins * 60) / dist;
}

/** One easy card the judge reads: its store key, what it prescribed, and the pace it was run at. */
export interface EasyCard {
  key: string;
  week: number;
  day: string;
  tgt: number;
  pace: number;
}

/** What a dismissal leaves on the program: the two cards judged, and the mile they were judged against. */
export interface NudgeRecord {
  cards: string[];
  anchor: number;
}

/** Everything the judge reads after a run is logged. */
export interface NudgeInput {
  /** The card just logged. */
  week: number;
  day: string;
  /** The frozen days, the logs and the day marks of the program, keyed `w<week>_<day>`. */
  hist: Record<string, DayLike | undefined>;
  logs: Record<string, LogLike | undefined>;
  comp: Record<string, string | undefined>;
  /** The program's mile, in seconds, and the week the calendar is in. */
  anchor: number;
  curWeek: number;
  totalWeeks: number;
  /** The record a dismissal left, if any. */
  record?: NudgeRecord | null;
  /** The mile a pace implies, read on the chart's recovery column (`paceChartLookup('recovery', pace).mile`). */
  implied: (pace: number) => number;
}

/** What the sheet offers. */
export interface NudgeOffer {
  cards: [EasyCard, EasyCard];
  implied: [number, number];
  /** +1: both runs slower than the plan; -1: both faster. */
  dir: 1 | -1;
  anchor: number;
  offer: number;
  lockWeek: number;
}

const keyOf = (week: number, day: string) => 'w' + week + '_' + day;

/** The card at a key when it counts: an easy card with a logged distance and time, not skipped. */
export function easyCard(input: Pick<NudgeInput, 'hist' | 'logs' | 'comp'>, week: number, day: string): EasyCard | null {
  const key = keyOf(week, day);
  if (input.comp[key] === 'skipped') return null;
  const tgt = easyTarget(input.hist[key]);
  if (tgt == null) return null;
  const pace = loggedPace(input.logs[key]);
  if (pace == null) return null;
  return { key, week, day, tgt, pace };
}

/** The easy card before (week, day) that counts, passing over the cards that do not. */
export function previousEasyCard(input: Pick<NudgeInput, 'hist' | 'logs' | 'comp'>, week: number, day: string): EasyCard | null {
  let w = week;
  let i = DAY_ORDER.indexOf(day as (typeof DAY_ORDER)[number]);
  if (i < 0) return null;
  for (;;) {
    i--;
    if (i < 0) {
      w--;
      i = DAY_ORDER.length - 1;
    }
    if (w < 1) return null;
    const c = easyCard(input, w, DAY_ORDER[i]);
    if (c) return c;
  }
}

/** The offer: the slower run's mile, rounded up to the slower 30-second row (the safe error, D274 item 2 as Amendment 1 rules it). */
export function offerSec(implied: [number, number]): number {
  return Math.ceil(Math.max(implied[0], implied[1]) / ROW_SEC) * ROW_SEC;
}

/** The judge (D274 items 1, 2, 4, 5 and 6): the offer, or null when the sheet stays shut. */
export function judgeNudge(input: NudgeInput): NudgeOffer | null {
  // Silent when the pencil is locked (item 5): the same test the pencil makes at its tap.
  if (mileLocked(input.curWeek, input.totalWeeks)) return null;
  const second = easyCard(input, input.week, input.day);
  if (!second) return null;
  const first = previousEasyCard(input, input.week, input.day);
  if (!first) return null;
  const implied: [number, number] = [Math.round(input.implied(first.pace)), Math.round(input.implied(second.pace))];
  const off = implied.map((m) => m - input.anchor);
  if (!off.every((d) => Math.abs(d) >= ROW_SEC)) return null;
  if (Math.sign(off[0]) !== Math.sign(off[1])) return null;
  const r = input.record;
  if (r && r.anchor === input.anchor && (r.cards.includes(first.key) || r.cards.includes(second.key))) return null;
  return {
    cards: [first, second],
    implied,
    dir: off[0] > 0 ? 1 : -1,
    anchor: input.anchor,
    offer: offerSec(implied),
    lockWeek: input.totalWeeks - 2,
  };
}

/** A pace or a mile as the app prints it: 11:03. */
export function clock(sec: number): string {
  const s = Math.round(sec);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

/** The sheet's words (D274 item 3). */
export interface NudgeText {
  label: string;
  title: string;
  body: string;
  update: string;
  keep: string;
}

export function nudgeText(o: NudgeOffer): NudgeText {
  const [a, b] = o.cards;
  const against = a.tgt === b.tgt ? clock(a.tgt) : clock(a.tgt) + ' and ' + clock(b.tgt);
  return {
    label: 'Coach',
    title: 'Two easy runs in a row off the plan.',
    body:
      clock(a.pace) + ' and ' + clock(b.pace) + ' a mile against ' + against + '. ' +
      'Your runs say your mile is nearer ' + clock(o.offer) + ' than ' + clock(o.anchor) + '. ' +
      'Change it and every run ahead of you rebuilds. ' +
      'The mile locks from week ' + o.lockWeek + '.',
    update: 'Update mile time',
    keep: 'Keep ' + clock(o.anchor),
  };
}

/** The pencil's two fields for the offer: minutes and seconds, as the pencil stores them. */
export function offerFields(offer: number): { mins: string; secs: string } {
  const s = Math.round(offer);
  return { mins: String(Math.floor(s / 60)), secs: String(s % 60).padStart(2, '0') };
}
