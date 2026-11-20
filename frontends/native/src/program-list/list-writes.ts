// The program list's writes, the goal sheet's and the mile pencil's, to this app's own store (D289 P-NATIVEWRITES;
// MIGRATION.md phase 3, row 5). This is the one file of the three screens that calls a writer; each is the page's
// code around core's own, line for line:
//
//   setActive, loadActiveProgram, commitRename, archiveProg, deleteProg, purgeProgData, _handoffActiveFrom   program-manage.ts
//   markPastAsked (D238)                                                                                    popups-streaks-reminders.ts
//   commitGoalChange, commitMileChange                                                                      programs.ts
//
// A SWITCH OF THE ACTIVE PROGRAM is one thing, as on the page (D178): ia_active written, then core's
// refreshStoredProgram on the stored program (the launch's own writes), then the new program's past unmarked days
// marked as asked (D238). Set Active makes it, and so do Archive and Delete Forever of the active program, which hand
// on to the first program not archived, or remove ia_active with none left. It does not fold the lift log's old keys:
// the page folds them at a launch, and so does this app (week-screen.ts).
//
// A REBUILD is core's refreshStoredProgram on the program just stored: a goal switch or a new mile on the active
// program. On any other program the stored edit is the whole of it.
//
// tests/integration/native-program-list.test.ts holds every ia_ key equal to today's page after each of them.
import { dayStoreKey } from '@ia/core/engine/state-day-log.ts';
import { dayStatus } from '@ia/core/engine/state-day-status.ts';
import { readActiveProgramId, readPrograms, writeActiveProgramId, writePrograms } from '@ia/core/engine/state-programs.ts';
import { type RefreshReport, type StoredProgram, refreshStoredProgram } from '@ia/core/engine/state-refresh.ts';
import type { StateStore } from '@ia/core/engine/state-store.ts';

import type { GoalDraft } from '../goal-sheet/goal-sheet-model';
import { PURGE_FAMILIES } from '../progress/progress-writes';
import { type ReadProgram, scheduledDays } from '../this-week/week-readers';
import { type ScreenProgram, midnight } from '../this-week/week-screen';
import { CARDIO_GOALS_BY_TYPE, GOAL_REQ_INPUTS, type ListProgram, type StoredGoal, goalCurWeek, goalInputsValid, mileEntryState } from './list-readers';

const stored = (store: StateStore): ListProgram[] => readPrograms(store) as unknown as ListProgram[];
const save = (store: StateStore, programs: ListProgram[]): void => writePrograms(store, programs as never);
const refresh = (store: StateStore, p: ListProgram, now: number, failed: RefreshReport): ScreenProgram =>
  refreshStoredProgram(store, p as unknown as StoredProgram, now, failed) as unknown as ScreenProgram;

/** Today's words for a switch asked of an archived program (loadActiveProgram). */
export const RESTORE_FIRST = 'Restore this program first';

/**
 * The page's markPastAsked (D238): every training day of the program before today that carries no mark and was not
 * asked about is recorded as asked, so the day-after reminder never asks about days spent on another program. Stored
 * only when it added one.
 */
export function markPastAsked(store: StateStore, prog: ScreenProgram, now: Date): void {
  const today = midnight(now);
  let m: Record<string, boolean>;
  try { m = JSON.parse(store.get('ia_reminded_' + prog.id) || '{}'); } catch { m = {}; }
  let n = 0;
  scheduledDays(prog as ReadProgram, today).forEach((x) => {
    const k = dayStoreKey(x.week, x.d);
    if (x.date < today && !dayStatus(store, prog.id, x.week, x.d) && !m[k]) { m[k] = true; n++; }
  });
  if (n) try { store.set('ia_reminded_' + prog.id, JSON.stringify(m)); } catch { /* as the page: the switch goes on */ }
}

/**
 * The page's loadActiveProgram for a program: ia_active written and the stored program rebuilt. An unknown id is
 * refused in silence; an archived one with RESTORE_FIRST. Returns the program in hand, or what refused it.
 */
export function loadActive(store: StateStore, id: string, now: number, failed: RefreshReport): { prog: ScreenProgram } | { refused: string | null } {
  const p = stored(store).find((x) => x.id === id);
  if (!p) return { refused: null };
  if (p.archived) return { refused: RESTORE_FIRST };
  writeActiveProgramId(store, id);
  return { prog: refresh(store, p, now, failed) };
}

/** What a tap that may switch or rebuild hands back: its toast, and the active program in hand when it changed. */
export interface Outcome { toast: string | null; prog?: ScreenProgram | null }

/** Set Active (setActive): the one switch. This Week then shows the new program. */
export function setActive(store: StateStore, id: string, now: number, failed: RefreshReport): Outcome & { switched: boolean } {
  const r = loadActive(store, id, now, failed);
  if (!('prog' in r)) return { toast: r.refused, switched: false };
  markPastAsked(store, r.prog, new Date(now));
  return { toast: 'Active program updated', prog: r.prog, switched: true };
}

/** Rename's Save (commitRename): the name trimmed and cut to 40, stored when it is a name and a new one. Returns the toast, or null. */
export function renameProgram(store: StateStore, id: string, typed: string): string | null {
  const programs = stored(store);
  const p = programs.find((x) => x.id === id);
  if (!p) return null;
  const nn = (typed || '').trim().slice(0, 40);
  if (nn && nn !== p.name) {
    p.name = nn; save(store, programs);
    return 'Renamed ✓';
  }
  return null;
}

/**
 * The page's _handoffActiveFrom: when `id` was the active program, the first program that is not it and not archived
 * takes over through the one switch; with none, ia_active is removed. `activeId` is the program a launch loaded (the
 * page's activeProgId). Returns the program now in hand: undefined when the active one did not change.
 */
function handOff(store: StateStore, id: string, programs: ListProgram[], activeId: string | null, now: number, failed: RefreshReport): ScreenProgram | null | undefined {
  if (!(readActiveProgramId(store) === id || activeId === id)) return undefined;
  const nx = programs.find((p) => p.id !== id && !p.archived);
  if (nx) {
    const r = loadActive(store, nx.id, now, failed);
    if ('prog' in r) { markPastAsked(store, r.prog, new Date(now)); return r.prog; }
    return undefined;
  }
  store.remove('ia_active');
  return null;
}

/** Archive (archiveProg): the program leaves the list and keeps every key; the active one hands on. Null when it is gone. */
export function archiveProgram(store: StateStore, id: string, activeId: string | null, now: number, failed: RefreshReport): Outcome | null {
  const programs = stored(store);
  const p = programs.find((x) => x.id === id);
  if (!p) return null;
  p.archived = true; p.archivedAt = now; save(store, programs);
  const prog = handOff(store, id, programs, activeId, now, failed);
  return prog === undefined ? { toast: 'Program archived' } : { toast: 'Program archived', prog };
}

/**
 * Delete Forever (deleteProg): the program leaves ia_programs, saved before the hand on (the switch stores the next
 * program's own repairs; saving the old list after it would undo them), then every key it owns is removed.
 */
export function deleteProgram(store: StateStore, id: string, activeId: string | null, now: number, failed: RefreshReport): Outcome {
  let programs = stored(store);
  programs = programs.filter((p) => p.id !== id); save(store, programs);
  const prog = handOff(store, id, programs, activeId, now, failed);
  PURGE_FAMILIES.forEach((f) => store.remove(f + id));
  return prog === undefined ? { toast: 'Program deleted' } : { toast: 'Program deleted', prog };
}

/**
 * Make the switch (commitGoalChange, D5): the sport's goal replaced in the stored config, a run's mile carried, a
 * swim's unit and the times that still mean something carried (D110a), the typed targets written. On the active
 * program the stored program is rebuilt. Null when the tap does nothing (a target missing, the program or the goal gone).
 */
export function commitGoalChange(store: StateStore, draft: GoalDraft, activeId: string | null, now: number, failed: RefreshReport): Outcome | null {
  if (!goalInputsValid(draft)) return null;
  const programs = stored(store);
  const pi = programs.findIndex((x) => x.id === draft.progId); if (pi < 0) return null;
  const sport = draft.sport!;
  const opts = CARDIO_GOALS_BY_TYPE[sport] || [];
  const g = opts.find((o) => o.id === draft.sel); if (!g) return null;
  const p = programs[pi]!;
  const cfg = p.cfg!;
  const prev: StoredGoal = ((cfg.cardioGoals || {})[sport]) || {};
  const next: StoredGoal = {
    id: g.id, label: g.label, baseline: '',
    ...(sport === 'run' && prev.mileBestMins !== undefined && prev.mileBestMins !== ''
      ? { mileBestMins: prev.mileBestMins, mileBestSecs: prev.mileBestSecs, ...(prev.mileBestSrc ? { mileBestSrc: prev.mileBestSrc } : {}) } : {}),
  };
  if (sport === 'swim') {
    type Time = [string | number | undefined, string | number | undefined];
    const has = (m: unknown, s: unknown): boolean => ((+(m as number) || 0) * 60 + (+(s as number) || 0)) > 0;
    const put = (k: 'base' | 'base500', t: Time): void => {
      if (t[0] !== undefined) next[(k + 'Mins') as 'baseMins' | 'base500Mins'] = t[0];
      if (t[1] !== undefined) next[(k + 'Secs') as 'baseSecs' | 'base500Secs'] = t[1];
    };
    if (prev.swimUnit) next.swimUnit = prev.swimUnit;
    let t500: Time | null = null, t100: Time | null = null;
    if (prev.id === 'swim_500_time' && has(prev.baseMins, prev.baseSecs)) t500 = [prev.baseMins, prev.baseSecs];
    if (prev.id === 'swim_100_time' && has(prev.base500Mins, prev.base500Secs)) t500 = [prev.base500Mins, prev.base500Secs];
    if (prev.id === 'swim_100_time' && has(prev.baseMins, prev.baseSecs)) t100 = [prev.baseMins, prev.baseSecs];
    if (g.id === 'swim_500_time' && t500) put('base', t500);
    if (g.id === 'swim_100_time' && t500) put('base500', t500);
    if (g.id === 'swim_100_time' && t100) put('base', t100);
  }
  if (GOAL_REQ_INPUTS.has(g.id)) {
    const i = draft.inputs;
    const mins = +i.targetMins! || 0, secs = +i.targetSecs! || 0;
    next.targetMins = i.targetMins; next.targetSecs = i.targetSecs;
    next.targetTime = mins + ':' + String(secs).padStart(2, '0');
    if (g.id === 'run_pace_goal') { next.targetDist = i.targetDist; next.paceUnit = i.paceUnit || 'mi'; }
  }
  p.cfg = { ...cfg, cardioGoals: { ...(cfg.cardioGoals || {}), [sport]: next } };
  save(store, programs);
  const toast = 'Goal switched. Program rebuilt from this week.';
  return activeId === draft.progId ? { toast, prog: refresh(store, p, now, failed) } : { toast };
}

/** Today's words for a mile left half typed (commitMileChange). */
export const MILE_BOTH = 'Put in both the minutes and the seconds.';

/**
 * Save on the mile pencil (commitMileChange, D116): the two fields as typed, refused blank or when it is no mile time,
 * else written with where it came from (the week, the day, and the mile it replaced, always). On the active program
 * the stored program is rebuilt. `saved` is false on a refusal, whose words are the toast.
 */
export function commitMileChange(store: StateStore, progId: string, mins: string, secs: string, activeId: string | null, now: number, failed: RefreshReport): Outcome & { saved: boolean } {
  const programs = stored(store);
  const pi = programs.findIndex((x) => x.id === progId); if (pi < 0) return { toast: null, saved: false };
  const p = programs[pi]!;
  const mRaw = String(mins).trim(), sRaw = String(secs).trim();
  if (mRaw === '' || sRaw === '') return { toast: MILE_BOTH, saved: false };
  const mm = +mRaw, ss = +sRaw;
  const st = mileEntryState({ mileBestMins: mRaw, mileBestSecs: sRaw }, (p.cfg && p.cfg.experience) || 'intermediate');
  if (!st.ok) return { toast: st.msg || null, saved: false };
  const cfg = p.cfg!;
  const prev: StoredGoal = ((cfg.cardioGoals || {})['run']) || {};
  const next: StoredGoal = {
    ...prev, mileBestMins: String(mm), mileBestSecs: String(ss),
    mileBestSrc: {
      kind: 'edited', at: new Date(now).toISOString().slice(0, 10), wk: goalCurWeek(p, midnight(new Date(now))),
      from: { mins: prev.mileBestMins || '', secs: prev.mileBestSecs || '', kind: (prev.mileBestSrc && prev.mileBestSrc.kind) || (prev.mileBestMins ? 'entered' : 'default') },
    },
  };
  p.cfg = { ...cfg, cardioGoals: { ...(cfg.cardioGoals || {}), run: next } };
  save(store, programs);
  const toast = 'Mile updated. Every run still ahead of you now reads from your new row.' + (st.adv ? ' ' + st.adv : '');
  return activeId === progId ? { toast, prog: refresh(store, p, now, failed), saved: true } : { toast, saved: true };
}
