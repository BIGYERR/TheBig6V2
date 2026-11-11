import { exStoreKey } from './exercise-library.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── The lift log, ia_exw_<program>: every lift an athlete has logged, by movement (docs/decisions/stored-state.md). ──
// Moved out of the page's log-entries.ts in v0.261.3, code as it was, with the program, the week, the day and the
// instant passed in where the page read its globals. It lives beside the engine while the page is built from this
// folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
/** One logged lift of one movement on one day. `day` is absent on entries from before V117, which resolve from `ts`. */
export interface LiftEntry { weight: number; setsReps: string; setsDone: number[]; setsW: number[]; week: number | string; day?: string; ts?: number }
export interface LiftRow { name: string; entries: LiftEntry[] }
/** The stored value: a row per movement, keyed by exStoreKey(name). */
export type LiftLog = Record<string, LiftRow>;
/** What the page hands recordLift: the lift as typed, on the week and day it resolved, at the instant it read. */
export interface LiftRecord {
  name: string; weight: unknown; setsReps: string | null | undefined; week: number | string; day: string;
  setsDone: number[] | null | undefined; setsW: number[] | null | undefined; now: number;
}

// The one reader and the one writer of ia_exw_<program>. A missing or broken value reads as an empty log.
function readLiftLog(store: StateStore, programId: string | null): LiftLog{try{return JSON.parse(store.get('ia_exw_'+programId)||'{}');}catch{return{};}}
function writeLiftLog(store: StateStore, programId: string | null, log: LiftLog): void{store.set('ia_exw_'+programId,JSON.stringify(log));}

// ── DAY RESOLUTION FOR LOG ENTRIES (V117) ────────────────────────────────────
// Entries used to carry only `week`. Every day-view reader asked "is there an entry
// for THIS week", so an exercise appearing on two days inside one week rendered the
// second day pre-checked, with the first day's set numbers restored into the rows,
// and — worse — the second day's save OVERWROTE the first day's record. Two sessions
// collapsed into one. `day` closes both halves.
//
// Storage is ADDITIVE. Pre-V117 entries have no `day` and are resolved from their own
// `ts`, which is the only day-aware value those records ever carried. Nothing is
// migrated or rewritten, so a rollback stays clean and existing history keeps its
// place on the day view instead of vanishing.
const _ENTRY_DAY_ORDER=['sun','mon','tue','wed','thu','fri','sat'];
function entryDay(e: { day?: string; ts?: number } | null | undefined): string{
  if(!e) return '';
  if(e.day) return e.day;
  if(e.ts){ try{ return _ENTRY_DAY_ORDER[new Date(e.ts).getDay()]||''; }catch(_){ return ''; } }
  return '';
}
// Chart rule (Mario's call, V117): ONE point per week, the week's HEAVIEST across days.
// The big-3 chart already did this via Math.max per week; the per-exercise history chart
// plotted one dot per entry and would otherwise show two dots both labelled W5 the moment
// day granularity landed. Ties break to the later timestamp.
function weeklyBest(entries: LiftEntry[] | null | undefined): LiftEntry[]{
  const byWeek: Record<number, LiftEntry>=Object.create(null);
  (entries||[]).forEach(function(e){
    if(!e) return;
    const w=+e.week||0, prev=byWeek[w];
    if(!prev) { byWeek[w]=e; return; }
    const a=+e.weight||0, b=+prev.weight||0;
    if(a>b || (a===b && (e.ts||0)>(prev.ts||0))) byWeek[w]=e;
  });
  return Object.keys(byWeek).map(Number).sort(function(a,b){return a-b;}).map(function(w){return byWeek[w]!;});
}

// Records one lift on a log in hand. The page reads the log, snapshots the day, calls this and saves.
// setsW (V105) is the per-set load ladder in lbs, ADDITIVE to the existing shape.
// `weight` remains the scalar every downstream consumer reads and is always
// max(setsW) when a ladder is present. Pre-V105 entries simply have no setsW and
// render as uniform — nothing is migrated or rewritten, so a rollback stays clean.
function recordLift(log: LiftLog, lift: LiftRecord): void{
  const key = exStoreKey(lift.name);
  if(!log[key]) log[key] = {name:lift.name, entries:[]};
  const w = lift.week, dk = lift.day, weight = lift.weight, setsReps = lift.setsReps, setsDone = lift.setsDone, setsW = lift.setsW;
  const entries = log[key]!.entries;
  // ONE entry per exercise per week PER DAY (V117). Re-logging the same exercise on
  // the same day (e.g. correcting a typo — clear the field, type a new number)
  // OVERWRITES that day's value instead of appending a second point; a correction must
  // not plot as a phantom duplicate dot. But two DIFFERENT days inside one week are two
  // sessions and must stay two records — keying this on `week` alone silently destroyed
  // the earlier one. Latest log for the day wins.
  const existing = entries.find(e => +e.week === +w && entryDay(e) === dk);
  if(existing) {
    existing.weight = +(weight as number);
    existing.setsReps = setsReps||'';
    existing.setsDone = (setsDone && setsDone.length) ? setsDone : (existing.setsDone||[]);
    existing.setsW = (setsW && setsW.length) ? setsW : (existing.setsW||[]);
    existing.ts = lift.now;
    existing.day = dk;
  } else {
    entries.push({
      weight: +(weight as number),
      setsReps: setsReps||'',
      setsDone: setsDone||[],
      setsW: setsW||[],
      week: w,
      day: dk,
      ts: lift.now
    });
  }
  // Keep ~52 WEEKS of history, not 52 entries (V117). Counting entries was equivalent
  // to counting weeks only while a lift could log once a week; with day granularity a
  // 3x/week movement reached the old cap at week 18 and `shift()` dropped from the FRONT
  // of the array — the baseline the whole chart is measured against. Capping on week span
  // keeps the same one-year intent regardless of how often the movement recurs.
  const _wMax = entries.reduce(function(m,e){return Math.max(m, +e.week||0);}, 0);
  if(_wMax > 52){
    const _keep = entries.filter(function(e){ return (+e.week||0) > _wMax - 52; });
    if(_keep.length !== entries.length) log[key]!.entries = _keep;
  }
}

// Collapse any legacy duplicate entries so each exercise keeps ONE entry per week
// (most recently logged wins). Cleans up duplicate points created before the
// per-week overwrite fix above. Returns true if anything actually changed.
function dedupeExDayEntries(store: LiftLog): boolean{
  // KEYED ON WEEK + DAY (V117). This function's result is WRITTEN BACK to storage, so while it
  // keyed on `week` alone it was a third writer whose whole job was to destroy exactly
  // the records day granularity creates — it would have eaten the earlier day's session
  // on every visit to the progress screen, permanently. It still collapses genuine
  // same-day duplicates (the pre-V105 push-every-save defect); it no longer collapses
  // two different training days into one.
  let changed = false;
  Object.values(store).forEach(ex => {
    if(!ex.entries || ex.entries.length < 2) return;
    const byKey: Record<string, LiftEntry> = {};
    ex.entries.forEach(e => {
      const k = String(e.week) + '|' + entryDay(e);
      const prev = byKey[k];
      if(!prev || (e.ts||0) >= (prev.ts||0)) byKey[k] = e;
    });
    const merged = Object.values(byKey).sort((a,b) => (+a.week-+b.week) || ((a.ts||0)-(b.ts||0)));
    if(merged.length !== ex.entries.length) { ex.entries = merged; changed = true; }
  });
  return changed;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { dedupeExDayEntries, entryDay, readLiftLog, recordLift, weeklyBest, writeLiftLog };
