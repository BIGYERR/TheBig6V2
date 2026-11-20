// The rest day sheet's writes in the Expo app (MIGRATION.md phase 3, row 5, its second session; D289
// P-NATIVEWRITES): Move it here, Log it, and Clear, each to this app's own store through core's writers, as the page
// makes them (frontends/app/src/legacy/src/js/rest-day-shell.ts), line for line:
//
//   getRestMoves, saveRestMoves, applyRestMove, applyRestCardio, clearRestCardio          rest-day-shell.ts
//
// MOVE is a relocation, never an addition: the session picked leaves its own day and lands on the rest day, stored as
// the day moved onto and the day it came from (ia_moves_), laid on the grid in hand by core's applyRestDayMoves, and
// the grid stored (ia_programs). Nothing is rebuilt.
// LOG CARDIO is additive: the jog is its own record on the day, restLog[sport] = { mins?, dist?, rpe? }, numbers,
// in the same ia_logs_ entry the rest of the app reads, writing no key a session reads (D223, D226, D228, D229).
// CLEAR removes one sport's record; restLog goes when it empties, and the day's entry when nothing but its week and
// its stamp is left (D228 item 6).
//
// tests/support/native-rest-sheet.ts holds the store equal to today's page, key for key, after every one of them.
import { dayStoreKey, readDayLogs, writeDayLogs } from '@ia/core/engine/state-day-log.ts';
import { readPrograms, writePrograms } from '@ia/core/engine/state-programs.ts';
import { type RestMove, applyRestDayMoves } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import { DAY_FULL, REST_WORD, restLogHead } from '../this-week/week-readers';
import { REST_TOASTS, type RestDraft, type RestLogs, type RestProgram, restHeld, restNum, restRec, restSame } from './rest-sheet-model';

/** The store and the program in hand (today's activeProg, the grid This Week draws). */
export interface RestSession { store: StateStore; prog: RestProgram }

/** What a tap leaves: its toast, whether the sheet closes, and the draft where the tap changed it. */
export interface RestTap { toast: string | null; closed: boolean; draft?: RestDraft }

/** The page's getRestMoves: the stored moves, or none when the key does not read. */
export function readRestMoves(store: StateStore, programId: string): Record<string, RestMove | null | undefined> {
  try { return JSON.parse(store.get('ia_moves_' + programId) || '{}'); } catch { return {}; }
}

/** The page's applyRestMove. */
export function applyRestMove(s: RestSession, d: RestDraft, now: number): RestTap {
  const { w, day, pick } = d;
  if (!pick) return { toast: REST_TOASTS.pick, closed: false };
  const moves = readRestMoves(s.store, s.prog.id);
  moves[dayStoreKey(w, day)] = { from: pick, ts: now };
  s.store.set('ia_moves_' + s.prog.id, JSON.stringify(moves));
  applyRestDayMoves(s.prog as never, moves);
  const progs = readPrograms(s.store) as unknown as { id: string; weeks?: unknown }[];
  const i = progs.findIndex((p) => p.id === s.prog.id);
  if (i >= 0) { progs[i]!.weeks = s.prog.weeks; writePrograms(s.store, progs as never); }
  return { toast: 'Moved. ' + (DAY_FULL[pick] || pick) + ' is your rest now ✓', closed: true };
}

/**
 * The page's applyRestCardio. Logged ✓ with the face unchanged closes the sheet and writes nothing (D228 item 3).
 * Nothing is ever written for an empty face; a record rolled to zero is removed only by Clear (item 5). Else the
 * face is written over the sport's record: the time when above zero, the distance when above zero (never on a
 * walk), the effort when a row is selected; another sport keeps its own. A wheel still settling is rested by the
 * screen first (the page's iaWheelFlush).
 */
export function applyRestCardio(s: RestSession, d: RestDraft, now: number): RestTap {
  const { w, day, type } = d;
  const logs = readDayLogs(s.store, s.prog.id) as unknown as RestLogs;
  const rec = restRec(d, restHeld(logs, w, day));
  if (rec && restSame(d, rec)) return { toast: null, closed: true };
  const m = restNum(d.mins), dd = type === 'walk' ? 0 : restNum(d.dist);
  if (m <= 0 && dd <= 0) return { toast: rec ? REST_TOASTS.useClear : (type === 'walk' ? REST_TOASTS.emptyWalk : REST_TOASTS.empty), closed: false };
  const k = dayStoreKey(w, day);
  const e: Record<string, unknown> = Object.assign({}, logs[k] || {}), rl: Record<string, unknown> = Object.assign({}, (e['restLog'] as Record<string, unknown>) || {}), o: { mins?: number; dist?: number; rpe?: number } = {};
  if (m > 0) o.mins = m;
  if (dd > 0) o.dist = dd;
  if (d.rpe != null && isFinite(+d.rpe)) o.rpe = +d.rpe;
  rl[type] = o; e['restLog'] = rl; e['week'] = w; e['ts'] = now;
  (logs as Record<string, unknown>)[k] = e;
  writeDayLogs(s.store, s.prog.id, logs as never);
  return { toast: restLogHead(type, o) + ' logged ✓', closed: true };
}

/**
 * The page's clearRestCardio (D228 item 6): two taps. The first arms it and writes nothing. The second removes the
 * sport's record; anything else on the day's entry is left byte for byte.
 */
export function clearRestCardio(s: RestSession, d: RestDraft): RestTap {
  if (!d.armed) return { toast: null, closed: false, draft: { ...d, armed: true } };
  const { w, day, type } = d;
  const logs = readDayLogs(s.store, s.prog.id) as unknown as Record<string, Record<string, unknown> | undefined>;
  const k = dayStoreKey(w, day), e = logs[k];
  const held = e && (e['restLog'] as Record<string, unknown> | undefined);
  if (e && held && held[type]) {
    const n: Record<string, unknown> = Object.assign({}, e), rl: Record<string, unknown> = Object.assign({}, held);
    delete rl[type];
    if (Object.keys(rl).length) n['restLog'] = rl; else delete n['restLog'];
    if (Object.keys(n).every((x) => x === 'week' || x === 'ts')) delete logs[k]; else logs[k] = n;
    writeDayLogs(s.store, s.prog.id, logs as never);
  }
  const word = REST_WORD[type] || type;
  return { toast: word.charAt(0).toUpperCase() + word.slice(1) + ' cleared', closed: true, draft: { ...d, armed: false } };
}
