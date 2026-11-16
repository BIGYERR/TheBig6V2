// What the Expo session sheet writes beyond its cards (MIGRATION.md phase 3, the session sheet's first session; D289
// P-NATIVEWRITES, docs/decisions/data-backup.md): the effort slider and the notes saved as they change, Done, Skip
// and each one's undo. Every write ends in one of core's own writers (state-day-log.ts, state-day-status.ts,
// state-day-history.ts). What stands here is the page's code around them, line for line, with the page's globals (the
// store, the active program, the week and day in hand, the clock) taken as arguments and the log's form read from
// LogForm instead of the screen:
//
//   persistLogFields, cardioLive, handleDayStatus, clearPartSkips, settleParts     day-status.ts
//   updateRPEDisplay (the mark that the slider was moved, D219)                    log-entries.ts
//   releaseSeasonShown                                                             popups-streaks-reminders.ts
//
// The cards' own taps (a set stepped or typed, a load, a pill, Log, a skip, a swap and their undo) are the deck's
// (../deck/deck-writes.ts): the page runs one handler for both screens, and so does this app.
//
// The store is this app's own SQLite store and nothing else. tests/integration/native-session-sheet.test.ts holds it
// equal to today's page, key for key, after the same taps on the same keys. Not here: add and remove, the 1RM card's
// save, the cardio log's wheels, its Log and its sport picker, which the sheet does not draw yet.
import type { Day } from '@ia/core';
import { cardioEntryLogged, dayStoreKey, readDayLogs, writeDayLogs } from '@ia/core/engine/state-day-log.ts';
import { clearDayParts, clearDayStatus, dayStatus, setDayStatus, settleDayParts } from '@ia/core/engine/state-day-status.ts';

import { type Session, snapshotDay } from '../deck/deck-writes';
import { type PopSession, finalScheduledDay, releaseSeasonShown } from '../pop-up/pop-ups';
import type { CardioFields, Dose } from './cardio-fields-model';
import type { SessionLogData } from './session-log-model';
import { doseDerived } from './sheet-readers';

/**
 * The log's form as the page holds it between a draw and a write: the effort slider and whether it was moved (D219),
 * the notes, every cardio node the template draws with the value it was drawn with, and the cardio wrap's two sports
 * (null on a day with no run, ride or swim, where the page finds no wrap).
 */
export interface LogForm {
  rpe: string;
  touched: boolean;
  notes: string;
  nodes: Record<string, string>;
  wrap: { planned: string; active: string } | null;
}

/** The cardio nodes a draw puts on the page, by id (cardio-fields.ts's template over cardio-fields-model.ts). */
function nodesOf(f: CardioFields): Record<string, string> {
  if (f.kind === 'time' || f.kind === 'dist') return { [f.first.hiddenId]: f.first.value, [f.second.hiddenId]: f.second.value };
  if (f.kind === 'reps_dist' || f.kind === 'reps_time') return { log_run_reps: f.stepper.stored, [f.wheel.hiddenId]: f.wheel.value };
  if (f.kind === 'run') return { [f.dist.hiddenId]: f.dist.value, [f.pace.hiddenId]: f.pace.value };
  if (f.kind === 'bike') return { [f.wheel.hiddenId]: f.wheel.value };
  if (f.kind === 'swim') return { log_swim_yards: f.yards };
  return {};
}

/** The form a draw leaves on the page (session-log.ts's template): a slider nobody has moved, the stored notes, the fields as drawn. */
export function formOf(log: SessionLogData): LogForm {
  const c = log.view.cardio;
  return { rpe: log.view.rpeValue, touched: false, notes: log.view.notes, nodes: nodesOf(log.fields), wrap: c ? { planned: c.planned, active: c.active } : null };
}

/** The slider moved (the page's updateRPEDisplay): its value, and the mark that the athlete set it. */
export function moveRpe(f: LogForm, value: number): LogForm { return { ...f, rpe: String(value), touched: true }; }
/** The notes typed. */
export function typeNotes(f: LogForm, text: string): LogForm { return { ...f, notes: text }; }

const dayOf = (s: Session): Day | null | undefined => { const wk = s.prog.weeks[s.week]; return ((wk && wk[s.dayKey]) || null) as unknown as Day | null; };

/** The page's cardioLive: the stored entry holds a number for the sport the card is on. No wrap is never live. */
function cardioLive(s: Session, f: LogForm): boolean {
  if (!f.wrap) return false;
  const sport = f.wrap.active || f.wrap.planned || '';
  return cardioEntryLogged(readDayLogs(s.store, s.prog.id)[dayStoreKey(s.week, s.dayKey)], sport);
}

/**
 * The page's persistLogFields: the day snapshotted (a log entry marks the day touched on its own), then the day's
 * entry written again from the form. The seven cardio keys follow the regime (D218): on a draft card all seven store
 * '' and nothing is derived; live, or on a commit tap (Done, Skip), they are read from the form, and the derived pace
 * and distance land on the old keys when the form holds none. The effort is stored only once the slider was moved
 * (D219); untouched, the entry's own is carried. The set drafts, the parked sports and a rest day's jog ride the
 * rewrite. Then the day's skipped parts settle (D284).
 */
export function persistLog(s: Session, f: LogForm, dose: Dose | null, commit: boolean, now: number): void {
  snapshotDay(s);
  const logs = readDayLogs(s.store, s.prog.id) as unknown as Record<string, Record<string, unknown>>;
  const key = dayStoreKey(s.week, s.dayKey);
  const g = (v: string): string => (v === 'log_rpe' ? f.rpe : v === 'log_notes' ? f.notes : f.nodes[v]) || '';
  const _live = !!commit || cardioLive(s, f);
  const gc = (v: string): string => (_live ? g(v) : '');
  const planned = f.wrap ? (f.wrap.planned || '') : '';
  const active = f.wrap ? (f.wrap.active || '') : '';
  const swapped = planned && active && active !== planned;
  const _keepSets = (logs[key] && logs[key]!['sets']) || null;
  const _keepParked = (logs[key] && logs[key]!['parked']) || null;
  const _keepRest = (logs[key] && logs[key]!['restLog']) || null;
  const _rpe = f.touched ? g('log_rpe') : ((logs[key] && logs[key]!['rpe'] != null) ? logs[key]!['rpe'] : '');
  logs[key] = {
    rpe: _rpe,
    run_dist: gc('log_run_dist'), run_pace: gc('log_run_pace'),
    run_mins: gc('log_run_mins'), run_reps: gc('log_run_reps'), run_rep_time: gc('log_run_rep_time'),
    bike_mins: gc('log_bike_mins'), swim_yards: gc('log_swim_yards'),
    notes: g('log_notes'),
    swapFrom: swapped ? planned : '', swapTo: swapped ? active : '',
    week: s.week, ts: now,
  };
  if (_keepSets) logs[key]!['sets'] = _keepSets;
  if (_keepParked) logs[key]!['parked'] = _keepParked;
  if (_keepRest) logs[key]!['restLog'] = _keepRest;
  if (_live) {
    const _dd = doseDerived(dose, { mins: g('log_run_mins'), dist: g('log_run_dist'), reps: g('log_run_reps'), rep: g('log_run_rep_time') });
    if (_dd) {
      if (_dd.pace && !logs[key]!['run_pace']) logs[key]!['run_pace'] = _dd.pace;
      if (_dd.dist != null && !logs[key]!['run_dist']) logs[key]!['run_dist'] = String(_dd.dist);
    }
  }
  writeDayLogs(s.store, s.prog.id, logs as never);
  settleDayParts(s.store, s.prog.id, s.week, s.dayKey, dayOf(s), now);
}

/** What a tap on Done or Skip did: the toast it raises, whether the sheet closes, and whether the completion pop-up follows. */
export interface StatusTap { toast: string | null; closed: boolean; popup: boolean }

/**
 * The page's handleDayStatus (V181 D1 and D2, V221 D179, V236 D218, D284): the day snapshotted; the status read
 * before anything is written; the day's skipped parts cleared, since a status set by hand takes the day whole; the
 * log saved, as a commit when the tap sets a status. A tap on the status the day already carries is the undo: the
 * day goes back to pending, its log stays, the sheet stays open, and on the program's last day the season's pop-up
 * is let go so it can show again. Any other tap sets the status and closes the session: Done raises the completion
 * pop-up and no toast, Skip raises its toast.
 */
export function tapStatus(s: Session, f: LogForm, dose: Dose | null, title: string, status: 'complete' | 'skipped', now: number): StatusTap {
  snapshotDay(s);
  const _was = dayStatus(s.store, s.prog.id, s.week, s.dayKey);
  const _commit = _was !== status;
  clearDayParts(s.store, s.prog.id, s.week, s.dayKey);
  persistLog(s, f, dose, _commit, now);
  const wasSame = _was === status;
  if (wasSame) {
    clearDayStatus(s.store, s.prog.id, s.week, s.dayKey);
    if (status === 'complete') {
      const pop = { store: s.store, prog: s.prog } as unknown as PopSession;
      const fin = finalScheduledDay(pop);
      if (fin && fin.week === s.week && fin.d === s.dayKey) releaseSeasonShown(pop);
    }
    return { toast: 'Unmarked', closed: false, popup: false };
  }
  setDayStatus(s.store, s.prog.id, s.week, s.dayKey, title || null, status, now);
  const labels: Record<string, string> = { complete: 'Done ✓', skipped: 'Skipped ✕ The week moves on' };
  // Done always raises a pop-up, which stands where the toast would; Skip raises none and keeps its toast.
  return status === 'complete' ? { toast: null, closed: true, popup: true } : { toast: labels[status] || 'Updated ✓', closed: true, popup: false };
}
