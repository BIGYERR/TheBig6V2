// The rest day sheet in the Expo app, as rules and a view (MIGRATION.md phase 3, row 5, its second session). Today's
// sheet is the page's own code and markup (frontends/app/src/legacy/src/js/rest-day-shell.ts: there is no Angular
// model), so this file is written from it, function for function, with the page's globals (the active program, the
// logs, the day marks, the clock) taken as arguments, and with what the page writes as markup handed back as a view:
// every word the page prints, in the page's order. tests/support/native-rest-sheet.ts prints that view as the page's
// markup and holds it equal to the page's own, byte for byte, after every tap.
//
//   _restDraft, openRestSheet, _rdSet, _rdType, _rdRpe, _restHeld, _restIsRec, _restRec, _restSeed, _restNum,
//   _restSame, _restInput, _renderRestMove, _renderRestCardio, _dayRegion, restMoveCollisions, restJogEligible,
//   restDayEligible, restMoveCandidates                                                    rest-day-shell.ts
//
// Each rule keeps its ruling: no defaults on the face (D228 item 2), the face from the record (item 1), Logged ✓ while
// the face is the record (item 3), a selected effort deselects (item 4), Clear in two taps (item 6), the controls by
// sport (D229 item 2), the sheet on every day a jog may land (D231 item 1), Already logged here (D232), what counts
// as logged (D219 item 2, D225), a day before the start (D24).
//
// Two views are built: Move a session here, and Log cardio. The page's third, the menu ("Not resting?"), is opened by
// no screen of today's iOS app (tests/measure/native-rest-sheet_today.md, section A), and is not here.
// Nothing here reads the store or writes: the writes are rest-writes.ts's.
import { _PATTERN_REGION } from '@ia/core/engine/budget-engine-d.ts';
import { getWeekMonday } from '@ia/core/engine/calendar.ts';
import { _pattern } from '@ia/core/engine/region-caps.ts';
import { CARDIO_PARK_FIELDS, dayStoreKey } from '@ia/core/engine/state-day-log.ts';

import type { WheelView } from '../day-detail/cardio-fields-model';
import { wheelView } from '../day-detail/cardio-fields-model';
import { IAW_SPEC } from '../day-detail/sheet-readers';
import { DAY_FULL, REST_WORD, type ReadProgram, type RestLog, dayBeforeStart, restLogLines } from '../this-week/week-readers';

/** One sport's record on a day (restLog[sport]). */
export type RestRec = NonNullable<RestLog[string]>;
/** A day of the grid, as far as the sheet reads it. */
export interface RestDay {
  rest?: boolean; moved?: boolean; movedFrom?: string; title?: string;
  sections?: { items?: ({ name?: string } | null)[] }[];
}
/** The program in hand, as far as the sheet reads it. */
export type RestProgram = Omit<ReadProgram, 'weeks'> & { id: string; weeks?: Record<string, Record<string, RestDay | null | undefined> | undefined> };
/** A day's log entry, as far as the sheet reads it. */
export type RestEntry = Record<string, unknown> & { restLog?: RestLog };
export type RestLogs = Record<string, RestEntry | undefined>;

/** A tap that asks for the sheet: the program in hand, the day, and the view asked (the page's openRestSheet(w, day, view)). */
export interface RestAsk { prog: RestProgram; week: number; dayKey: string; view: 'move' | 'cardio' }

/** The page's _restDraft: the day the sheet is on, the view, the session picked, and the face of the sport selected. */
export interface RestDraft {
  w: number; day: string; view: 'move' | 'cardio';
  pick: string | null;
  type: string; mins: string; dist: string; rpe: number | null;
  armed: boolean;
}

const ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const dayOf = (prog: RestProgram | null | undefined, w: number, d: string): RestDay | null | undefined => (prog && prog.weeks && prog.weeks[w] ? prog.weeks[w]![d] : undefined);

/** The words the sheet says as a toast, where it opens nothing. */
export const REST_TOASTS = {
  none: 'No active program. Tap Set Active or build a new one.',
  future: 'That rest day has not come around yet',
  pick: 'Pick a session',
  useClear: 'To remove it, use Clear.',
  emptyWalk: 'Nothing to log yet. Add a time.',
  empty: 'Nothing to log yet. Add a time or a distance.',
} as const;

// ── The record and the face ─────────────────────────────────────────────────────────────────────────────────────
/** The page's _restHeld: the day's restLog, or {}. */
export function restHeld(logs: RestLogs, w: number, dk: string): RestLog {
  const e = logs[dayStoreKey(w, dk)];
  return e && e.restLog && typeof e.restLog === 'object' ? e.restLog : {};
}
/** The page's _restIsRec: a record is a sport holding a time or a distance. */
export function restIsRec(r: RestLog[string]): r is RestRec {
  return !!(r && typeof r === 'object' && (+r.mins! > 0 || +r.dist! > 0));
}
/** The page's _restRec: the selected sport's record, or null. */
export function restRec(d: RestDraft, held: RestLog): RestRec | null {
  const r = held[d.type];
  return restIsRec(r) ? r : null;
}
/** The page's _restSeed: the face from the record. The record is shown, never a prefill (D228 item 1). */
export function restSeed(d: RestDraft, held: RestLog): RestDraft {
  const r = restRec(d, held);
  return {
    ...d,
    mins: r && +r.mins! > 0 ? String(r.mins) : '',
    dist: r && d.type !== 'walk' && +r.dist! > 0 ? String(r.dist) : '',
    rpe: r && r.rpe != null && r.rpe !== '' && isFinite(+r.rpe) ? +r.rpe : null,
  };
}
/** The page's _restNum. */
export function restNum(v: unknown): number {
  const n = parseFloat(String(v == null ? '' : v));
  return n > 0 ? n : 0;
}
/** The page's _restSame (D228 item 3): the face equals the record, every number compared as a number. */
export function restSame(d: RestDraft, r: RestRec): boolean {
  const rp = (v: unknown): number | null => (v == null || v === '' || !isFinite(+v) ? null : +v);
  return restNum(d.mins) === restNum(r.mins)
    && (d.type === 'walk' || restNum(d.dist) === restNum(r.dist))
    && rp(d.rpe) === rp(r.rpe);
}

// ── Where the sheet opens, and what may move ─────────────────────────────────────────────────────────────────────
/**
 * The page's restJogEligible (D231 item 1): inside the program, the date has come, and the day is a rest day or
 * already holds a jog (a double day).
 */
export function restJogEligible(prog: RestProgram | null | undefined, logs: RestLogs, w: number, dayKey: string, now: Date): boolean {
  if (!prog || !prog.startDate) return false;
  if (dayBeforeStart(prog as ReadProgram, w, dayKey)) return false;
  const day = dayOf(prog, w, dayKey);
  if (!day) return false;
  if (!day.rest && !Object.keys(restHeld(logs, w, dayKey)).length) return false;
  const idx = ORDER.indexOf(dayKey); if (idx < 0) return false;
  const mon = getWeekMonday(prog.startDate);
  const d = new Date(mon); d.setDate(mon.getDate() + (w - 1) * 7 + idx); d.setHours(0, 0, 0, 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  return d <= today;
}
/** The page's restDayEligible, the move's test: a rest day, not one a session moved away from, whose date has come. */
export function restDayEligible(prog: RestProgram | null | undefined, w: number, dayKey: string, now: Date): boolean {
  if (!prog || !prog.startDate) return false;
  if (dayBeforeStart(prog as ReadProgram, w, dayKey)) return false;
  const day = dayOf(prog, w, dayKey);
  if (!day || !day.rest || day.moved) return false;
  const idx = ORDER.indexOf(dayKey); if (idx < 0) return false;
  const mon = getWeekMonday(prog.startDate);
  const d = new Date(mon); d.setDate(mon.getDate() + (w - 1) * 7 + idx); d.setHours(0, 0, 0, 0);
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  return d <= today;
}
/** One session Move offers. */
export interface MoveCandidate { day: string; label: string; title: string }
/**
 * The page's restMoveCandidates: untouched means no completion and no logged data. Logged is an RPE, a note, a live
 * swap, parked numbers, or any field of CARDIO_PARK_FIELDS (D219 item 2, D225).
 */
export function restMoveCandidates(prog: RestProgram | null | undefined, comp: Record<string, unknown>, logs: RestLogs, w: number): MoveCandidate[] {
  if (!prog || !prog.weeks || !prog.weeks[w]) return [];
  const out: MoveCandidate[] = [];
  ORDER.forEach((d) => {
    const day = prog.weeks![w]![d];
    if (!day || day.rest || day.moved || day.movedFrom) return;
    const k = dayStoreKey(w, d);
    if (comp[k]) return;
    const lg = logs[k];
    if (lg && (lg['rpe'] || lg['notes'] || lg['swapTo'] || lg['parked'] || Object.keys(CARDIO_PARK_FIELDS).some((s) => CARDIO_PARK_FIELDS[s]!.some((f) => !!lg[f])))) return;
    out.push({ day: d, label: DAY_FULL[d] || d, title: day.title || 'Training' });
  });
  return out;
}
/** The page's _dayRegion: the region most of a day's moves train; one stray move is not a region day. */
export function dayRegion(day: RestDay | null | undefined): string | null {
  if (!day || day.rest || !Array.isArray(day.sections)) return null;
  const tally: Record<string, number> = {};
  day.sections.forEach((s) => (s.items || []).forEach((it) => {
    const p = it && it.name ? _pattern(it.name) : null; if (!p) return;
    const r = (_PATTERN_REGION as Record<string, string | undefined>)[p]; if (!r) return;
    tally[r] = (tally[r] || 0) + 1;
  }));
  let best: string | null = null, n = 0;
  Object.keys(tally).forEach((r) => { if (tally[r]! > n) { n = tally[r]!; best = r; } });
  return n >= 2 ? best : null;
}
/** The page's restMoveCollisions: the neighbours of the day moved onto that train the moved session's region. */
export function restMoveCollisions(prog: RestProgram | null | undefined, w: number, destDay: string, srcDay: RestDay | null | undefined): { day: string; label: string; title: string }[] {
  const reg = dayRegion(srcDay); if (!reg) return [];
  const i = ORDER.indexOf(destDay); if (i < 0) return [];
  const wk = (prog && prog.weeks && prog.weeks[w]) || {};
  const out: { day: string; label: string; title: string }[] = [];
  [-1, 1].forEach((off) => {
    const j = i + off; if (j < 0 || j > 6) return;
    const nd = ORDER[j]!, d = wk[nd];
    if (!d || d.rest) return;
    if (dayRegion(d) === reg) out.push({ day: nd, label: DAY_FULL[nd] || nd, title: d.title || 'that session' });
  });
  return out;
}

// ── The taps that write nothing ──────────────────────────────────────────────────────────────────────────────────
/**
 * The page's openRestSheet, as today's iOS app calls it (a view always asked): refused with its words when there is
 * no program or the day has not come; else the draft, on the view asked where a move may land and on Log cardio
 * where it may not, the sport the first that holds a record, else the program's first, else run (D228 item 1).
 */
export function openRest(prog: RestProgram | null | undefined, logs: RestLogs, w: number, dayKey: string, view: 'move' | 'cardio', now: Date): { draft: RestDraft } | { toast: string } {
  if (!prog) return { toast: REST_TOASTS.none };
  if (!restJogEligible(prog, logs, w, dayKey, now)) return { toast: REST_TOASTS.future };
  const canMove = restDayEligible(prog, w, dayKey, now);
  const types = (prog.cfg && prog.cfg.cardioTypes) || [], held = restHeld(logs, w, dayKey);
  const type = Object.keys(held).find((t) => restIsRec(held[t])) || types[0] || 'run';
  return { draft: restSeed({ w, day: dayKey, view: canMove ? view : 'cardio', pick: null, armed: false, type, mins: '', dist: '', rpe: null }, held) };
}
/** A row of Move tapped (the page's _rdSet('pick', day)). */
export function pickSession(d: RestDraft, day: string): RestDraft { return { ...d, pick: day }; }
/** Log cardio instead (the page's _rdSet('view', 'cardio')). */
export function toCardio(d: RestDraft): RestDraft { return { ...d, view: 'cardio' }; }
/** A sport chip (the page's _rdType): the face is seeded again from that sport's record, and Clear disarms. */
export function pickType(d: RestDraft, held: RestLog, t: string): RestDraft { return restSeed({ ...d, type: t, armed: false }, held); }
/** An effort row (the page's _rdRpe): the one selected deselects (D228 item 4). A wheel still settling is rested by the screen first. */
export function tapRpe(d: RestDraft, v: number): RestDraft { return { ...d, rpe: d.rpe != null && +d.rpe === v ? null : v }; }
/** A wheel's rest on a new face, or a key in the distance box (the page's _restInput): the face follows it. */
export function faceInput(d: RestDraft, id: string, value: string): RestDraft {
  if (id === 'rest_mins') return { ...d, mins: value };
  if (id === 'rest_dist') return { ...d, dist: value };
  return d;
}

// ── The view ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** A titled note of the sheet (the page's .ov-effect). */
export interface RestNote { title: string; sub: string }
/** Move a session here. */
export interface MoveView {
  kind: 'move';
  kicker: string; title: string; intro: string;
  /** Nothing left to move, with Log cardio instead; then no row is drawn. */
  none: (RestNote & { button: string }) | null;
  /** Already logged here (D232): one line a sport, then the sentence. Null with no jog, and with nothing to move. */
  already: { title: string; lines: string[]; tail: string } | null;
  label: string;
  rows: { day: string; title: string; desc: string; sel: boolean }[];
  /** The spacing warning under the rows, when the pick stacks a region on a neighbour. */
  warn: RestNote | null;
  /** Move it here, once a row is picked. */
  apply: string | null;
}
/** The distance control of a sport: a wheel (run, bike) or a box (row, swim). */
export type DistControl = { label: string; wheel: WheelView } | { label: string; box: { value: string; placeholder: string; step25: boolean } };
/** Log cardio. */
export interface CardioView {
  kind: 'cardio';
  kicker: string; title: string; intro: string;
  chipsLabel: string;
  chips: { type: string; label: string; sel: boolean }[];
  timeLabel: string;
  time: WheelView;
  dist: DistControl | null;
  effortLabel: string;
  efforts: { v: number; head: string; name: string; desc: string; sel: boolean }[];
  note: RestNote | null;
  log: string;
  clear: string | null;
}
export type RestView = MoveView | CardioView;

/** The page's sport labels on a chip. */
const LBL: Record<string, string> = { run: 'Run', bike: 'Bike', swim: 'Swim', row: 'Row', walk: 'Walk' };
/** RPE, with word anchors: the whole app prescribes in RPE, so the log speaks it too. */
const RPE: readonly (readonly [number, string, string])[] = [[5, 'Easy', 'Conversational, full sentences'], [7, 'Steady', 'Working, sentences getting short'], [9, 'Hard', 'That’s a training day, not a rest day']];

/** The page's _renderRestMove. */
export function moveView(d: RestDraft, prog: RestProgram, comp: Record<string, unknown>, logs: RestLogs): MoveView {
  const w = d.w, dk = d.day, dayName = DAY_FULL[dk] || dk;
  const cands = restMoveCandidates(prog, comp, logs, w);
  const head = {
    kind: 'move' as const,
    kicker: dayName + ' · Training anyway',
    title: 'Move a session here',
    intro: 'Nothing gets added. Whatever you pick moves to ' + dayName + ', and its old day becomes your rest.',
  };
  if (!cands.length) {
    return {
      ...head, already: null, label: '', rows: [], warn: null, apply: null,
      none: { title: 'Nothing left to move', sub: 'Every session this week is logged or done. Take the rest, or log some cardio instead.', button: 'Log cardio instead' },
    };
  }
  const jog = restLogLines(restHeld(logs, w, dk));
  const already = jog.length
    ? { title: 'Already logged here', lines: jog.map((l) => l.replace(' logged', '')), tail: 'Move a session in and ' + dayName + ' is a double day. Your call.' }
    : null;
  const rows = cands.map((c) => ({ day: c.day, title: c.title, desc: c.label + ' · not logged', sel: d.pick === c.day }));
  let warn: RestNote | null = null;
  if (d.pick) {
    const src = dayOf(prog, w, d.pick);
    const hits = restMoveCollisions(prog, w, dk, src);
    if (hits.length) {
      const reg = dayRegion(src) || 'that';
      const names = hits.map((h) => h.label).join(' and ');
      warn = { title: 'That’s ' + reg + ' on top of ' + reg, sub: 'You have ' + reg + ' work on ' + names + ' too. Stack it here and something gives. Your call.' };
    }
  }
  return { ...head, none: null, already, label: 'Not logged this week', rows, warn, apply: d.pick ? 'Move it here' : null };
}

/** The page's _renderRestCardio. */
export function cardioView(d: RestDraft, prog: RestProgram, logs: RestLogs): CardioView {
  const w = d.w, dk = d.day, dayName = DAY_FULL[dk] || dk;
  const types = ((prog.cfg && prog.cfg.cardioTypes) || []).slice();
  if (!types.includes('walk')) types.push('walk');
  const held = restHeld(logs, w, dk), t = d.type, rec = restRec(d, held);
  // A sport holding a record always has its chip, ahead of walk.
  Object.keys(held).forEach((x) => { if (restIsRec(held[x]) && !types.includes(x)) types.splice(types.length - 1, 0, x); });
  const chips = types.map((x) => ({ type: x, label: (LBL[x] || x) + (restIsRec(held[x]) ? ' ✓' : ''), sel: t === x }));
  const efforts = RPE.map(([v, n, desc]) => ({ v, head: 'RPE ' + v + (v === 9 ? '+' : ''), name: n, desc, sel: d.rpe != null && +d.rpe === v }));
  let dist: DistControl | null = null;
  if (t === 'run' || t === 'bike') dist = { label: 'Distance', wheel: wheelView(IAW_SPEC, 'dist', 'rest_dist', d.dist) };
  else if (t === 'row' || t === 'swim') dist = { label: t === 'row' ? 'Distance (meters)' : 'Distance (yards)', box: { value: d.dist, placeholder: t === 'row' ? 'meters' : 'yards', step25: t === 'swim' } };
  const note = d.rpe != null && d.rpe >= 9
    ? { title: 'Noted', sub: 'Hard effort is not a rest day, it is a training day. Logging it as it happened. Keep an eye on how tomorrow feels.' }
    : null;
  const word = REST_WORD[t] || t;
  return {
    kind: 'cardio',
    kicker: dayName + ' · Log cardio',
    title: rec ? 'Your ' + word + ' on ' + dayName : 'What did you do?',
    intro: rec
      ? 'This is what you logged. Roll it to fix it, or clear it if it did not happen.'
      : 'Easy work on a rest day is recovery, not extra load. This will not touch your program.',
    chipsLabel: 'Modality', chips,
    timeLabel: 'Time', time: wheelView(IAW_SPEC, 'hms', 'rest_mins', d.mins),
    dist,
    effortLabel: 'How hard', efforts,
    note,
    log: rec && restSame(d, rec) ? 'Logged ✓' : 'Log it',
    clear: rec ? (d.armed ? 'Tap again to clear' : 'Clear this ' + word) : null,
  };
}

/** The page's renderRestSheet, for the two views today's iOS app opens. */
export function restView(d: RestDraft, prog: RestProgram, comp: Record<string, unknown>, logs: RestLogs): RestView {
  return d.view === 'move' ? moveView(d, prog, comp, logs) : cardioView(d, prog, logs);
}
