// What the Expo deck writes (MIGRATION.md phase 3, the deck's second and third sessions; D289 P-NATIVEWRITES,
// docs/decisions/data-backup.md): a set draft, a logged lift, Call it and the day marked done, a skip and its undo,
// a swap and its put it back. Every write ends in one of core's own writers (state-day-log.ts, state-lift-log.ts,
// state-day-history.ts, state-day-status.ts, state-day-edits.ts, state-swaps.ts). What stands here is the page's
// code around them, line for line, with the
// page's globals (the store, the active program, the week and day in hand, the clock) taken as arguments and the
// fields read from set-fields.ts instead of the screen:
//
//   autoSaveSets, writeSetDraft, commitSetsLive   set-logging.ts, storage.ts
//   saveExWeight, logExerciseWeight               day-detail.ts, log-entries.ts (D290: a move's own rows)
//   snapshotDay, resnapshotDayEdit                storage.ts
//   markDay (the deck's), markDayComplete         deck.ts, day-status.ts
//   skipExercise, unskipExercise, skipSuperset,
//   unskipSuperset, applySwapChoice, undoSwap     swap-sheet.ts
//
//   showSwapNudge, dismissSwapNudge,
//   acceptSwapNudge                                day-status.ts (the coach's nudge; the words are swap-nudge-model.ts)
//
// The store is this app's own SQLite store and nothing else. tests/integration/native-deck-logging.test.ts,
// native-deck-swap.test.ts and native-pop-ups.test.ts hold it equal to today's page, key for key, after the same
// taps on the same keys. Not here: the completion pop-up and the day-after reminder, which are ../pop-up/pop-ups.ts;
// add and remove, which today's deck does not reach and the session sheet does (../day-detail/sheet-writes.ts).
import type { Cfg, Day, Section } from '@ia/core';
import { _stripCapCue, applyInjuryFilter } from '@ia/core/engine/injury.ts';
import { addSkipEdit, dropSkipEdit, ssSkipToken } from '@ia/core/engine/state-day-edits.ts';
import { recordDaySnapshot, refreshDaySnapshot } from '@ia/core/engine/state-day-history.ts';
import { dayStoreKey, dropSetDraft, readDayLogs, recordSetDraft, writeDayLogs } from '@ia/core/engine/state-day-log.ts';
import { setDayStatus } from '@ia/core/engine/state-day-status.ts';
import { _pattern } from '@ia/core/engine/region-caps.ts';
import { entryDay, readLiftLog, recordLift, writeLiftLog } from '@ia/core/engine/state-lift-log.ts';
import { recordSwapPreference } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, type StoredProgram, refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';
import { type SwapPlace, _dayPlanCfg, addSwapRecord, countSwap, dropSwapRecord, markSwapNudged, readSwaps } from '@ia/core/engine/state-swaps.ts';
import { _swapDetailFor, applySwapPrefs } from '@ia/core/engine/swap-prefs.ts';

import type { ExItem } from '../day-detail/session-sections-model';
import { type NudgeText, nudgeSlot, nudgeText } from '../swap-nudge/swap-nudge-model';
import { type CardAct, type CardMove, type DayLog, callItLog } from './deck-model';
import type { DeckDay, DeckProgram, Fields } from './deck-screen';
import type { SwapCtx } from './deck-swaps';
import { type MoveFields, afterLog, fillLoads, loadVals, rawLoads, rawReps, repVals, reuseLoad, stepRep } from './set-fields';

/** The page's globals a write reads: the store, the program a launch handed back, the week and the day in hand. */
export interface Session {
  store: StateStore; prog: DeckProgram; week: number; dayKey: string;
  /**
   * The page's unit label (window._unitLabel) where it is not the program's: a deck or a sheet sets it to the
   * program's as it opens, and a Wildcard's cards carry the last opened day's (random-screen.ts wildSession).
   */
  label?: 'kg' | 'lbs';
}

const dayOf = (s: Session): DeckDay | null => { const wk = s.prog.weeks[s.week]; return (wk && wk[s.dayKey]) || null; };
const unitOf = (s: Session): string => (s.prog.cfg && s.prog.cfg.unit) || 'lbs';

/** The page's toStoreW: a shown load in pounds, as it is stored. The deck sets the page's unit label from the program's. */
function toStoreW(disp: number | '' | null | undefined, kg: boolean): number {
  if (disp === '' || disp == null) return 0;
  return kg ? Math.round(+disp * 2.20462) : +disp;
}

/** The page's snapshotDay: the day as it stands, kept on its first touch. A fault never stops the tap. */
export function snapshotDay(s: Session, log: (...a: unknown[]) => void = console.error): void {
  try {
    if (!s.prog || !s.prog.weeks || !s.week || !s.dayKey) return;
    const wk = s.prog.weeks[s.week];
    recordDaySnapshot(s.store, s.prog.id, s.week, s.dayKey, (wk && wk[s.dayKey]) as unknown as Day | null | undefined);
  } catch (e) { log('day snapshot failed', s.week, s.dayKey, e); }
}

/** The page's resnapshotDayEdit: the snapshot takes in the athlete's own edit. The sheet's add and remove call it too. */
export function resnapshotDay(s: Session, log: (...a: unknown[]) => void = console.error): void {
  try {
    if (!s.prog || !s.prog.weeks || !s.week || !s.dayKey) return;
    const wk = s.prog.weeks[s.week];
    refreshDaySnapshot(s.store, s.prog.id, s.week, s.dayKey, (wk && wk[s.dayKey]) as unknown as Day | null | undefined);
  } catch (e) { log('day edit re-snapshot failed', s.week, s.dayKey, e); }
}

/** What Log did: the fields as it leaves them, and the toast it raises, null when it raises none. */
export interface Logged { ok: boolean; fields: MoveFields; toast: string | null }

/**
 * The page's saveExWeight and logExerciseWeight: the move's own sets (D290), each set's load, the load field; the
 * entry's weight is the heaviest set; the day is snapshotted, the lift recorded, the draft dropped. `quiet` is Done,
 * next one and the straight-through commit, which raise no toast for a lift logged.
 */
export function saveLift(s: Session, exKey: string, exName: string, setsReps: string, f: MoveFields, now: number, quiet = false): Logged {
  const unit = unitOf(s), kg = unit === 'kg';
  const setsDone = repVals(f);
  const dispSets = loadVals(f);
  let storedW = 0, hasW = false, dispW = 0;
  if (f.load) {
    const v = parseFloat(f.load.value !== '' ? f.load.value : f.load.placeholder);
    if (!isNaN(v) && v > 0) { dispW = v; storedW = kg ? Math.round(v * 2.20462) : v; hasW = true; }
  }
  let setsW: number[] = [];
  if (dispSets.length && dispSets.some((x) => x > 0)) {
    // The deck sets the page's unit label to kg only for a kilogram program, pounds for anything else. The page turns
    // each set's load by that label (toStoreW) and the load field by the program's unit, which a Wildcard can tell apart.
    setsW = dispSets.map((x) => toStoreW(x, s.label ? s.label === 'kg' : kg));
    const top = Math.max(...setsW);
    if (top > 0) { storedW = top; hasW = true; dispW = Math.max(...dispSets); }
  }
  if (!setsDone.length && !hasW) return { ok: false, fields: f, toast: 'Nothing to log here' };
  // logExerciseWeight.
  if (exName && (storedW || setsDone.length)) {
    const log = readLiftLog(s.store, s.prog.id);
    if (s.dayKey) snapshotDay(s);
    recordLift(log, { name: exName, weight: storedW, setsReps, week: s.week, day: s.dayKey, setsDone, setsW, now });
    writeLiftLog(s.store, s.prog.id, log);
  }
  dropSetDraft(s.store, s.prog.id, s.week, s.dayKey, exKey);
  return { ok: true, fields: afterLog(f, hasW, dispW, unit), toast: quiet ? null : hasW ? dispW + ' ' + unit + ' logged ✓' : 'Logged ✓' };
}

/** The page's writeSetDraft: the cells as they stand, untouched ones blank, into the day's log; the day snapshotted first. */
function writeSetDraft(s: Session, exKey: string, f: MoveFields, now: number): void {
  if (!s.prog.id || !s.dayKey || !exKey) return;
  snapshotDay(s);
  recordSetDraft(s.store, s.prog.id, s.week, s.dayKey, exKey, { r: rawReps(f), w: rawLoads(f), L: f.load ? f.load.value : '' }, now);
}

/** The page's commitSetsLive: a logged move's change goes straight to its entry, with the prescription it was logged under. */
function commitSetsLive(s: Session, exKey: string, f: MoveFields, now: number): MoveFields {
  const rec = readLiftLog(s.store, s.prog.id)[exKey];
  if (!rec || !rec.name) return f;
  const prev = (rec.entries || []).filter((e) => +e.week === +s.week && entryDay(e) === s.dayKey)[0];
  return saveLift(s, exKey, rec.name, (prev && prev.setsReps) || '', f, now, true).fields;
}

/**
 * The page's autoSaveSets, after a stepper tap, a pill, or a field left: before Log the cells are a draft; after it
 * the change is committed. Returns the fields, which a commit restates.
 */
export function autoSave(s: Session, exKey: string, f: MoveFields, now: number): MoveFields {
  if (!exKey) return f;
  if (f.logged) return commitSetsLive(s, exKey, f, now);
  writeSetDraft(s, exKey, f, now);
  return f;
}

/**
 * The deck's markDay with the page's markDayComplete (deck.ts, day-status.ts): the day snapshotted, its effort (only
 * once the slider was moved, D219) and notes merged into its log entry, every other field kept, and the day marked
 * complete. The rest clock and the completion pop-up are the page's own screens, not built here.
 */
export function markDay(s: Session, title: string, rpe: number | null, notes: string, now: number): void {
  snapshotDay(s);
  const logs = readDayLogs(s.store, s.prog.id) as unknown as Record<string, DayLog>;
  const key = dayStoreKey(s.week, s.dayKey);
  logs[key] = callItLog(logs[key], rpe, notes, s.week, now);
  writeDayLogs(s.store, s.prog.id, logs as never);
  snapshotDay(s);
  setDayStatus(s.store, s.prog.id, s.week, s.dayKey, title, 'complete', now);
}

/**
 * The Wildcard's own working day (the page's _wildDraw, v0.246.0 D250 P-WILDEDIT): a copy of the draw's sections and
 * the swaps made on it. An edit handed one changes the copy and stores nothing: no record, no count, no snapshot.
 */
export interface WildDay extends DeckDay { swaps: { from: string; to: string; rx: SwapPlace[] }[] }

/** The page's skipExercise and unskipExercise: the move marked on the day in hand, the edit stored, the snapshot renewed. */
function skipMove(s: Session, name: string, off: boolean, wild?: WildDay | null): string | null {
  const day = wild || dayOf(s);
  if (!day || !s.prog.id) return null;
  let hit = false;
  (day.sections || []).forEach((sec) => (sec.items || []).forEach((it) => {
    if (it && it.name === name) { it._skipped = off ? true : (undefined as unknown as boolean); hit = true; }
  }));
  if (off && !hit) return null;
  if (!wild) {
    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name); else dropSkipEdit(s.store, s.prog.id, s.week, s.dayKey, name);
    resnapshotDay(s);
  }
  return off ? name + ' is off today. Tap to put it back.' : name + ' is back on the card.';
}

/** The page's skipSuperset and unskipSuperset: the round marked, its token stored, the snapshot renewed. */
function skipRound(s: Session, secIdx: number, off: boolean, wild?: WildDay | null): string | null {
  const day = wild || dayOf(s);
  if (!day || !s.prog.id) return null;
  const sec = (day.sections || [])[secIdx];
  if (off && !sec) return null;
  if (sec) sec._skipped = off ? true : (undefined as unknown as boolean);
  if (!wild) {
    if (off) addSkipEdit(s.store, s.prog.id, s.week, s.dayKey, ssSkipToken(secIdx)); else dropSkipEdit(s.store, s.prog.id, s.week, s.dayKey, ssSkipToken(secIdx));
    resnapshotDay(s);
  }
  return off ? 'Round is off today. Tap to put it back.' : 'Round is back on the card.';
}

/**
 * The deck's act (deck.ts): a skip or its undo through the page's own handlers, one move, a round, or each name of a
 * block in turn. The grid's day is changed in place, as the page changes activeProg. Returns the last toast raised.
 * `wild` is a Wildcard card's source (the page's src 'wild'): the edit lands on the Wildcard's own day and is not stored.
 */
export function act(s: Session, a: CardAct, off: boolean, wild?: WildDay | null): string | null {
  if (a.kind === 'exercise') return skipMove(s, a.name, off, wild);
  if (a.kind === 'round') return skipRound(s, a.secIdx, off, wild);
  let toast: string | null = null;
  for (const n of a.names) toast = skipMove(s, n, off, wild) ?? toast;
  return toast;
}

// ── Swap and put it back (swap-sheet.ts applySwapChoice and undoSwap) ───────────────────────────────────────────
/** The plan that governs the day in hand (core's _dayPlanCfg): the program's config, with the day's own injury. */
const planOf = (s: Session, day: DeckDay): Cfg => _dayPlanCfg(s.prog as unknown as { cfg?: Cfg | null }, day as unknown as { _ovKey?: unknown });

/** What a pick did: the toast it raises, and whether the coach's nudge is now due (the third pick running of one pair). */
export interface Swapped { toast: string; nudge: boolean }

/**
 * The page's applySwapChoice: the lift the sheet was opened on becomes `to` on the day in hand. Every place `from`
 * stood is kept for put it back (D177 R4, with the dose kept before an injury's hold, D193); the dose carries, read
 * beneath the plan's cue, and only a lift with no load to move or a wave Main under the candidate's window is
 * prescribed again (_swapDetailFor); on an injured day the plan's filter decides what the card shows and the dose
 * before it is kept beside the card; a label naming the lift names the new one. Then the record, the count and the
 * snapshot. Null where the sheet's lift is no longer there, as the page closes the sheet and does nothing.
 * On a Wildcard card (`wild`, D250) the swap lives on the Wildcard's own day: no record, no count, no nudge, no snapshot.
 */
export function swapMove(s: Session, ctx: SwapCtx, to: string, now: number, wild?: WildDay | null): Swapped | null {
  if (!ctx || !s.prog || !s.prog.id) return null;
  const day = wild || dayOf(s);
  const sec = day && day.sections && day.sections[ctx.secIdx];
  const item = sec && sec.items && (sec.items[ctx.itemIdx] as ExItem | undefined);
  if (!day || !sec || !item) return null;
  const from = ctx.name;
  const undoRx: SwapPlace[] = [];
  (day.sections || []).forEach((sx, si) => ((sx && sx.items) || []).forEach((it, ii) => {
    if (it && it.name === from && typeof it.detail === 'string') {
      const e: SwapPlace = { s: si, i: ii, d: it.detail };
      if (typeof it['_preHold'] === 'string') e.ph = it['_preHold'];
      undoRx.push(e);
    }
  }));
  item.name = to;
  const wasDetail = item.detail;
  const base = _stripCapCue(typeof item['_preHold'] === 'string' ? (item['_preHold'] as string) : wasDetail) as string;
  const rx: { win?: [number, number] } = {};
  item.detail = _swapDetailFor(to, base, rx);
  const reRx = item.detail !== base;
  const preF = item.detail;
  let held = false;
  if (planOf(s, day).injury) {
    item['_preHold'] = preF;
    try {
      const fs = applyInjuryFilter([{ label: 'x', items: [{ name: to, detail: item.detail }] }] as unknown as Section[], planOf(s, day));
      const fi = fs && fs[0] && fs[0].items && fs[0].items[0];
      if (fi && fi.name === to) { held = /RPE/.test(preF) && fi.detail !== preF; item.detail = fi.detail; }
    } catch { /* as the page: a filter that throws leaves the card as the carry wrote it */ }
  }
  if (sec.label && sec.label.indexOf(from) >= 0) sec.label = sec.label.split(from).join(to);
  if (wild) wild.swaps.push({ from, to, rx: undoRx });
  else addSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from, to, undoRx, now);
  const nudge = wild ? false : !!countSwap(s.store, s.prog.id, from, to);
  if (!wild) resnapshotDay(s);
  const lead = to + ' in, ' + from.toLowerCase() + ' out. ';
  const toast = held
    ? (rx.win
      ? lead + 'The load runs out before the reps do here. Reps move to ' + rx.win[0] + ' to ' + rx.win[1] + '. Your injury plan holds this one at RPE 7.'
      : reRx
        ? lead + 'No load to add here. Your injury plan holds this one at RPE 7.'
        : lead + 'Same sets, same reps. Your injury plan holds this one at RPE 7.')
    : rx.win
      ? lead + 'The load runs out before the reps do here. Same sets, same effort. Reps move to ' + rx.win[0] + ' to ' + rx.win[1] + '.'
      : reRx
        ? lead + 'No load to add here, so take the sets to the same effort.'
        : lead + 'Same job, same numbers.';
  return { toast, nudge };
}

/**
 * The page's undoSwap: the day's record of `from` gives the lift it became, which takes its name back; each stored
 * place gets its own prescription back, at its place where `from` stands there again, else on the first `from` not
 * yet written; a record from before D177 has no places, and the name alone comes back. Then the record goes and the
 * snapshot is renewed. The count is not taken back. Null where the day holds no record of `from`.
 * On a Wildcard card (`wild`, D250) the record is the Wildcard's own, and leaves its own list.
 */
export function undoSwap(s: Session, from: string, wild?: WildDay | null): string | null {
  if (!s.prog || !s.prog.id) return null;
  const day = wild || dayOf(s);
  if (!day) return null;
  const list = wild ? wild.swaps || [] : readSwaps(s.store, s.prog.id)['w' + s.week + '_' + s.dayKey] || [];
  const hit = list.filter((e) => e && e.from === from)[0];
  if (!hit) return null;
  const back: Record<string, string> = {};
  back[hit.to] = from;
  applySwapPrefs(day.sections as unknown as Section[], back);
  if (Array.isArray(hit.rx)) {
    const put: ExItem[] = [];
    hit.rx.forEach((p) => {
      if (!p || typeof p.d !== 'string') return;
      const ps = (day.sections || [])[p.s], at = ps && ps.items && ps.items[p.i];
      let it: ExItem | null = at && at.name === from && put.indexOf(at) < 0 ? at : null;
      if (!it) (day.sections || []).some((sx) => ((sx && sx.items) || []).some((x) => { if (x && x.name === from && put.indexOf(x) < 0) { it = x; return true; } return false; }));
      const got = it as ExItem | null;
      if (got) {
        got.detail = p.d;
        if (typeof p.ph === 'string') got['_preHold'] = p.ph; else delete got['_preHold'];
        put.push(got);
      }
    });
  }
  if (wild) wild.swaps = (wild.swaps || []).filter((e) => e && e.from !== from);
  else { dropSwapRecord(s.store, s.prog.id, s.week, s.dayKey, from); resnapshotDay(s); }
  return from + ' is back on the card.';
}

// ── The deck's taps: each one the fields of every move after it (the screen's handlers, Deck.tsx) ───────────────
const withMove = (F: Fields, exKey: string, f: MoveFields): Fields => ({ ...F, [exKey]: f });

/** A field of the move was left (the page's blur): what its cells hold is saved. */
export function leftField(s: Session, F: Fields, exKey: string, now: number): Fields {
  const f = F[exKey];
  return f ? withMove(F, exKey, autoSave(s, exKey, f, now)) : F;
}
/** A set's plus or minus (the page's stepSet): the row moved, then saved. */
export function tapStep(s: Session, F: Fields, exKey: string, row: number, step: number, now: number): Fields {
  const f = F[exKey];
  return f ? withMove(F, exKey, autoSave(s, exKey, stepRep(f, row, step), now)) : F;
}
/** The reuse pill (the page's reuseWeight): its number into the load field, then saved. A move with no load field takes nothing. */
export function tapReuse(s: Session, F: Fields, exKey: string, value: number, now: number): Fields {
  const f = F[exKey];
  const g = f ? reuseLoad(f, value) : null;
  return g ? withMove(F, exKey, autoSave(s, exKey, g, now)) : F;
}
/** Fill every set (the page's fillAllSetWeights): the pill's number into every set's cell, then saved. */
export function tapFill(s: Session, F: Fields, exKey: string, value: number, now: number): Fields {
  const f = F[exKey];
  return f ? withMove(F, exKey, autoSave(s, exKey, fillLoads(f, value), now)) : F;
}
/** Log on a move (the page's saveExWeight from its button). */
export function tapLog(s: Session, F: Fields, x: { exKey: string; name: string; rxDetail: string }, now: number): { fields: Fields; toast: string | null } {
  const f = F[x.exKey];
  if (!f) return { fields: F, toast: null };
  const r = saveLift(s, x.exKey, x.name, x.rxDetail, f, now);
  return { fields: withMove(F, x.exKey, r.fields), toast: r.toast };
}
/**
 * Done, next one on a card not yet logged (deck.ts advance): Log, quietly, for each of its moves that is not logged.
 * `tried` is how many it logged for; a card with none is marked done by the deck alone.
 */
export function tapDone(s: Session, F: Fields, moves: CardMove[], now: number): { fields: Fields; toasts: string[]; tried: number } {
  let fields = F;
  const toasts: string[] = [];
  const open = moves.filter((m) => !m.logged);
  for (const m of open) {
    const f = fields[m.exKey];
    if (!f) continue;
    const r = saveLift(s, m.exKey, m.name, m.rxDetail, f, now, true);
    fields = withMove(fields, m.exKey, r.fields);
    if (r.toast) toasts.push(r.toast);
  }
  return { fields, toasts, tried: open.length };
}

// ── COACH NUDGE (day-status.ts) ──────────────────────────────────────────────────────────────────────────────────
// Third time in a row is a preference, not a bad night's sleep. Offered once, and only once: either answer marks the
// pair offered, so the athlete is never asked again. swapMove says when it is due (state-swaps.ts countSwap).

/** The page's showSwapNudge: the card's two paragraphs for the pair, today's words (swap-nudge-model.ts). */
export function nudgeWords(from: string, to: string): NudgeText {
  return nudgeText(from, to, _pattern(from));
}

/** The page's dismissSwapNudge, Leave the plan alone: the pair is marked offered. */
export function dismissNudge(s: Session, from: string): void {
  if (s.prog && s.prog.id) markSwapNudged(s.store, s.prog.id, from);
}

/**
 * The page's acceptSwapNudge, Make the change: the preference written into the program's config, the pair marked
 * offered, and the program rebuilt from what is stored, as a launch rebuilds it (the preference lives in the config,
 * so this rebuild and every one after it makes the trade with no patch to lay back on). It hands back the program
 * for the screen to hold in place of the one it has, null where the stored program is gone, and today's toast.
 */
export function acceptNudge(s: Session, from: string, to: string, now: number, failed: RefreshReport): { prog: DeckProgram | null; toast: string } {
  let prog: DeckProgram | null = null;
  if (s.prog && s.prog.id) {
    const stored = recordSwapPreference(s.store, s.prog.id, from, to);
    if (stored) {
      markSwapNudged(s.store, s.prog.id, from);
      prog = refreshStoredProgram(s.store, stored as unknown as StoredProgram, now, failed) as unknown as DeckProgram;
    }
  }
  return { prog, toast: 'Done. ' + to + ' is your ' + nudgeSlot(_pattern(from)) + ' from here.' };
}
