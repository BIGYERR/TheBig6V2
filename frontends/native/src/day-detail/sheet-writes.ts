// What the Expo session sheet writes beyond its cards (MIGRATION.md phase 3, the session sheet's first session; D289
// P-NATIVEWRITES, docs/decisions/data-backup.md): the effort slider and the notes saved as they change, Done, Skip
// and each one's undo. Every write ends in one of core's own writers (state-day-log.ts, state-day-status.ts,
// state-day-history.ts). What stands here is the page's code around them, line for line, with the page's globals (the
// store, the active program, the week and day in hand, the clock) taken as arguments and the log's form read from
// LogForm instead of the screen:
//
//   persistLogFields, cardioLive, handleDayStatus, clearPartSkips, settleParts     day-status.ts
//   setCardioSwap's park (parkSport)                                               day-status.ts
//   updateRPEDisplay (the mark that the slider was moved, D219)                    log-entries.ts
//   releaseSeasonShown                                                             popups-streaks-reminders.ts
//
// The cards' own taps (a set stepped or typed, a load, a pill, Log, a skip, a swap and their undo) are the deck's
// (../deck/deck-writes.ts): the page runs one handler for both screens, and so does this app.
//
// The sheet's second session added the athlete's own edits and the test week's card:
//
//   applyAddChoice, removeAddedExercise, _afterEdit                                swap-sheet.ts
//   save, update (the 1RM card; the legacy saveTestMax and e1rmCalcUpdate)         e1rm-card.ts (the Angular card)
//
// The store is this app's own SQLite store and nothing else. tests/integration/native-session-sheet.test.ts holds it
// equal to today's page, key for key, after the same taps on the same keys. The cardio log's wheels, its Log and its
// sport picker are cardio-log.ts's, which saves through persistLog here.
import type { Day } from '@ia/core';
import { addAddEdit, dropAddEdit } from '@ia/core/engine/state-day-edits.ts';
import { CARDIO_PARK_FIELDS, cardioEntryLogged, dayStoreKey, readDayLogs, writeDayLogs } from '@ia/core/engine/state-day-log.ts';
import { clearDayParts, clearDayStatus, dayStatus, setDayStatus, settleDayParts } from '@ia/core/engine/state-day-status.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import { _swapDetailFor } from '@ia/core/engine/swap-prefs.ts';

import { type Session, resnapshotDay, snapshotDay } from '../deck/deck-writes';
import { type PopSession, finalScheduledDay, releaseSeasonShown } from '../pop-up/pop-ups';
import type { CardioFields, Dose } from './cardio-fields-model';
import { epley } from './day-detail-model';
import type { SessionLogData } from './session-log-model';
import type { ExSection } from './session-sections-model';
import { addedDetailFor } from './sheet-adds';
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
export function nodesOf(f: CardioFields): Record<string, string> {
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
export function cardioLive(s: Session, f: LogForm): boolean {
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

/**
 * The park of the page's setCardioSwap (V234 D213), the part of the sport picker that writes: the day's entry read
 * back; when the sport changes, the leaving sport's numbers park on the entry and leave its top level, the arriving
 * sport's come back from the park, and the entry is stored. A tap on the sport the card is on stores nothing.
 * Returns the entry, which the new sport's fields are then drawn from (cardio-log.ts swapSport).
 */
export function parkSport(s: Session, leaving: string, sport: string): Record<string, unknown> {
  const logs = readDayLogs(s.store, s.prog.id) as unknown as Record<string, Record<string, unknown>>;
  const key = dayStoreKey(s.week, s.dayKey);
  const e: Record<string, unknown> = logs[key] || {};
  if (sport !== leaving) {
    const P: Record<string, Record<string, unknown>> = Object.assign({}, (e['parked'] as Record<string, Record<string, unknown>>) || {});
    const out: Record<string, string> = {};
    (CARDIO_PARK_FIELDS[leaving] || []).forEach((f) => { out[f] = (e[f] == null ? '' : String(e[f])); e[f] = ''; });
    if (Object.keys(out).some((f) => out[f] !== '')) P[leaving] = out; else delete P[leaving];
    const back = P[sport] || null;
    (CARDIO_PARK_FIELDS[sport] || []).forEach((f) => { e[f] = (back && back[f] != null) ? back[f] : ''; });
    delete P[sport];
    if (Object.keys(P).length) e['parked'] = P; else delete e['parked'];
    logs[key] = e;
    writeDayLogs(s.store, s.prog.id, logs as never);
  }
  return e;
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

// ── Add and remove (swap-sheet.ts applyAddChoice and removeAddedExercise) ───────────────────────────────────────
/** The day in hand, as an edit changes it in place: its sections. */
const editDay = (s: Session): { sections: ExSection[] } | null => { const wk = s.prog.weeks[s.week]; return ((wk && wk[s.dayKey]) || null) as { sections: ExSection[] } | null; };

/**
 * The page's applyAddChoice: the move goes under "Added by you" on the day in hand, the block made on the first add
 * and the move never put there twice. Its dose is resolved by type against the live week (addedDetailFor, V163 D1),
 * then shaped for the move as a swap's is: kept as a rep target on a lift with a load to move, open sets at the same
 * effort on one with none (_swapDetailFor). Then the record, and the day's snapshot renewed where it has one. Returns
 * the toast, or null where there is no day or no program, as the page closes the sheet and does nothing.
 */
export function addMove(s: Session, name: string, now: number): string | null {
  const day = editDay(s);
  if (!day || !s.prog.id) return null;
  const detail = _swapDetailFor(name, addedDetailFor(day, name, s.week, s.prog));
  let bucket = (day.sections || []).filter((x) => x._added)[0];
  if (!bucket) { bucket = { label: 'Added by you', _added: true, items: [] }; day.sections.push(bucket); }
  if (!bucket.items.some((it) => it.name === name)) bucket.items.push({ name, detail, _addedByUser: true });
  addAddEdit(s.store, s.prog.id, s.week, s.dayKey, name, detail, now);
  resnapshotDay(s);
  return name + ' added at ' + detail + '.';
}

/**
 * The page's removeAddedExercise: the move leaves every added block of the day in hand, a block left empty goes with
 * it, the record is dropped and the day's snapshot renewed. A lift already logged keeps its entry in the lift log.
 * Null where there is no day or no program.
 */
export function removeAdded(s: Session, name: string): string | null {
  const day = editDay(s);
  if (!day || !s.prog.id) return null;
  (day.sections || []).forEach((sec) => {
    if (!sec._added) return;
    sec.items = (sec.items || []).filter((it) => !(it && it.name === name));
  });
  day.sections = (day.sections || []).filter((sec) => !(sec._added && !(sec.items || []).length));
  dropAddEdit(s.store, s.prog.id, s.week, s.dayKey, name);
  resnapshotDay(s);
  return name + ' removed.';
}

// ── The test week's 1RM card (e1rm-card.ts) ─────────────────────────────────────────────────────────────────────
/** The Angular card's update(), the legacy e1rmCalcUpdate: the Epley estimate from the card's two fields. */
export function e1rmEstimate(weight: string, reps: string): number {
  return epley(parseFloat(weight) || 0, parseInt(reps) || 1);
}

/** What the card's save did: the estimate it now shows, and the line that stands where its button stood, null when nothing was saved. */
export interface MaxSaved { estimate: number; saved: string | null }

/**
 * The Angular card's save(), the legacy saveTestMax: the estimate becomes the lift's max in the stored program's
 * config and in the program in hand, and the programs are stored. Nothing is rebuilt: the next block anchors off it.
 * An estimate of nothing saves nothing and says nothing. No toast is raised: the card says it itself.
 */
export function saveTestMax(s: Session, lift: string, unit: string, weight: string, reps: string): MaxSaved {
  const v = e1rmEstimate(weight, reps);
  if (!(v > 0)) return { estimate: v, saved: null };
  const programs = readPrograms(s.store) as unknown as { id?: string; cfg?: Record<string, unknown> }[];
  const p = programs.filter((x) => x && x.id === s.prog.id)[0];
  if (p && p.cfg) {
    p.cfg[lift] = v;
    const active = s.prog as unknown as { cfg?: Record<string, unknown> | null } | null;
    if (active && active.cfg) active.cfg[lift] = v;
    writePrograms(s.store, programs as never);
  }
  return { estimate: v, saved: 'Saved. Your next block anchors off ' + v + ' ' + unit + '.' };
}
