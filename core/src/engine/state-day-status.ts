import { dayStoreKey, readDayLogs, runPartLogged } from './state-day-log.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── A day's completion and its skipped parts, ia_comp_<program> and ia_parts_<program> (docs/decisions/stored-state.md). ──
// Moved out of the page's storage.ts, day-status.ts and popups-streaks-reminders.ts in v0.261.4, code as it was, with
// the store, the program, the week, the day, the day's grid entry and the instant passed in where the page read its
// globals. The page snapshots the day (history) and draws; these hold what a tap stores. It lives beside the engine
// while the page is built from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
import type { Day } from '../domain/index.ts';
/** One day's completion. `status` is absent on the oldest records, which read as complete; `parts` marks a record the
 *  day's skipped parts wrote (D284), which they may rewrite or remove. */
export interface DayStatusRecord { title?: string | null; ts: number; status?: string; parts?: 1 }
/** The stored value of ia_comp_: a record per day, keyed by dayStoreKey(week, day). */
export type Completed = Record<string, DayStatusRecord>;
/** The stored value of ia_parts_: the parts of a day skipped on their own ('run', 'lift'), keyed like ia_comp_. */
export type PartSkips = Record<string, Record<string, 1>>;

// The one reader and the one writer of each store. A missing or broken value reads as empty.
function readCompleted(store: StateStore, programId: string | null): Completed{try{return JSON.parse(store.get('ia_comp_'+programId)||'{}');}catch{return{};}}
function writeCompleted(store: StateStore, programId: string | null, c: Completed): void{store.set('ia_comp_'+programId,JSON.stringify(c));}
// v0.261.0 (D284, P-SKIPPILL): the parts of a day skipped on their own (its run, its lift), keyed w<N>_<day> like
// ia_comp_. Never in ia_comp_, where a record with no status reads as done, nor in the log, which persistLogFields
// rebuilds from the form on every write.
function readPartSkips(store: StateStore, programId: string | null): PartSkips{try{return JSON.parse(store.get('ia_parts_'+programId)||'{}');}catch{return{};}}
function writePartSkips(store: StateStore, programId: string | null, p: PartSkips): void{store.set('ia_parts_'+programId,JSON.stringify(p));}

// What a day's record reads as: null with no record, else its status. V181 (D1): a record with no status, and a
// legacy `partial`, read as complete.
function dayStatus(store: StateStore, programId: string | null, week: number | string, day: string): string | null{ const c=readCompleted(store,programId)[dayStoreKey(week,day)]; if(!c) return null; const s=c.status||'complete'; return s==='partial'?'complete':s; }
// A status set by hand (Done, Skip, the deck, the reminder): the day's record, whole, with the title as given.
function setDayStatus(store: StateStore, programId: string | null, week: number | string, day: string, title: string | null | undefined, status: string, now: number): void{
  const c=readCompleted(store,programId);c[dayStoreKey(week,day)]={title:title,ts:now,status:status};writeCompleted(store,programId,c);
}
// The undo tap: the day back to pending. The store is written whether or not a record was there.
function clearDayStatus(store: StateStore, programId: string | null, week: number | string, day: string): void{
  const c=readCompleted(store,programId);delete c[dayStoreKey(week,day)];writeCompleted(store,programId,c);
}

// ── SKIPPED PARTS (v0.261.0, D284 P-SKIPPILL) ────────────────────────────────
// This Week's Skip pill skips a day's run or its lift on its own. The parts live in ia_parts_, and the
// day's status follows them: every part skipped is a skipped day; every part not skipped done is a done day (Mario: one
// part skipped and the rest done counts as done); otherwise no record. A record the parts wrote carries parts:1 and is
// rewritten or removed as they change, so nothing latches; a status the athlete set (Done, the deck, the reminder) is
// never touched.
// The day's parts, read as This Week reads them (week-view-model): a run when the day has a cardio with a sport, a lift
// when a section holds a movement.
function partsOfDay(day: Day | null | undefined): string[]{
  if(!day||day.rest) return [];
  const parts: string[]=[];
  if(day.cardio&&String(day.cardio.type||'')) parts.push('run');
  if((day.sections||[]).some(function(s){ return !!s&&(s.items||[]).length>0; })) parts.push('lift');
  return parts;
}
function settleDayParts(store: StateStore, programId: string | null, week: number | string, dayKey: string, day: Day | null | undefined, now: number): void{
  const k=dayStoreKey(week,dayKey);
  const mine=readPartSkips(store,programId)[k]||{};
  const c=readCompleted(store,programId), rec=c[k];
  if(rec&&!rec.parts) return;
  const parts=partsOfDay(day);
  const left=parts.filter(function(p){ return !mine[p]; });
  let want: string|null=null;
  if(left.length<parts.length){
    if(!left.length) want='skipped';
    else{
      const e=readDayLogs(store,programId)[k];
      // The lift part is done only by the deck or Done, a status the athlete sets, which ends the settle above.
      if(left.every(function(p){ return p==='run'&&runPartLogged(e,day!.cardio&&day!.cardio.type); })) want='complete';
    }
  }
  if(want){
    if(!rec||rec.status!==want){
      c[k]={title:(day&&day.title)||null,ts:now,status:want,parts:1};
      writeCompleted(store,programId,c);
    }
  }else if(rec){ delete c[k]; writeCompleted(store,programId,c); }
}
// The pill: one part skipped, or put back. A day skipped the old way (the reminder, a cardio-only day's sheet) is every
// part skipped, so putting one back turns it into part skips first. The page snapshots the day before it calls this.
function skipDayPart(store: StateStore, programId: string | null, week: number | string, dayKey: string, day: Day | null | undefined, part: string, now: number): void{
  const parts=partsOfDay(day);
  if(parts.indexOf(part)<0) return;
  const k=dayStoreKey(week,dayKey);
  const all=readPartSkips(store,programId);
  const mine: Record<string, 1>=Object.assign({},all[k]||{});
  const c=readCompleted(store,programId), rec=c[k];
  if(rec&&!rec.parts&&rec.status==='skipped'){
    parts.forEach(function(p){ mine[p]=1; });
    delete c[k]; writeCompleted(store,programId,c);
  }
  if(mine[part]) delete mine[part]; else mine[part]=1;
  if(Object.keys(mine).length) all[k]=mine; else delete all[k];
  writePartSkips(store,programId,all);
  settleDayParts(store,programId,week,dayKey,day,now);
}
// A status set by hand (the session sheet's Done or Skip, the reminder) takes the day whole.
function clearDayParts(store: StateStore, programId: string | null, week: number | string, dayKey: string): void{
  const all=readPartSkips(store,programId), k=dayStoreKey(week,dayKey);
  if(!all[k]) return;
  delete all[k]; writePartSkips(store,programId,all);
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  clearDayParts, clearDayStatus, dayStatus, partsOfDay, readCompleted, readPartSkips, setDayStatus, settleDayParts,
  skipDayPart, writeCompleted, writePartSkips,
};
