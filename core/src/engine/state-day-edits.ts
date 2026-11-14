import { dayStoreKey } from './state-day-log.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── The day edits, ia_edits_<program>: the movements the athlete added to a day or took off it (docs/decisions/stored-state.md). ──
// Moved out of the page's swaps-edits.ts in v0.261.6, code as it was, with the store, the program, the week, the day
// and the instant passed in where the page read its globals and the clock. The page edits the card, snapshots the day
// and draws; these hold what a tap stores. Laying the edits onto a rebuilt grid (applyDayEdits), with a skipped
// round's token (ssSkipToken), moved here in v0.262.2 under the page's names, code as it was: the launch calls it
// (state-refresh.ts). It lives beside the engine while the page is built from this folder, and moves to
// core/src/app-state at cutover (MIGRATION.md).
//
// DAY EDITS: ADD / SKIP (V109). Session-scoped edits to a single day, stored per program and keyed the same way as
// swaps. Nothing here touches cfg, goal or periodization: a program stays deterministic from cfg+seed, and edits are
// re-applied ON TOP of the rebuild, exactly like rest-day moves and swaps. Adding a lift on Tuesday therefore does NOT
// change next Tuesday: that is the standing-preference feature, deliberately not built yet.
import type { StateStore } from './state-store.ts';
import type { HeldGrid } from './state-overlays.ts';
/** A movement the athlete added to a day: its name, its dose, the instant. */
export interface AddedMove { name: string; detail: string; ts: number }
/** One day's edits: the movements added, and the names taken off (a superset by its token, '__ss:<section index>'). */
export interface DayEdit { add?: AddedMove[]; skip?: string[] }
/** The stored value of ia_edits_: a day's edits, keyed by dayStoreKey(week, day). */
export type DayEdits = Record<string, DayEdit>;

// The one reader and the one writer. A missing or broken value reads as empty. A refused write is swallowed: an edit
// is the athlete's change to today's card, and a full store must not stop the card from changing.
function readDayEdits(store: StateStore, programId: string | null): DayEdits{try{return JSON.parse(store.get('ia_edits_'+programId)||'{}');}catch(e){return {};}}
function writeDayEdits(store: StateStore, programId: string | null, v: DayEdits): void{try{store.set('ia_edits_'+programId,JSON.stringify(v));}catch(e){}}
// The day's entry, made when there is none and given both lists, added first.
function dayEditEntry(s: DayEdits, k: string): Required<DayEdit>{const e=s[k]||{};if(!Array.isArray(e.add))e.add=[];if(!Array.isArray(e.skip))e.skip=[];s[k]=e;return e as Required<DayEdit>;}

// A movement taken off the day (or a superset, by its token): once, whatever the taps.
function addSkipEdit(store: StateStore, programId: string | null, week: number | string, dayKey: string, name: string): DayEdits{
  const s=readDayEdits(store,programId),k=dayStoreKey(week,dayKey),e=dayEditEntry(s,k);
  if(e.skip.indexOf(name)<0) e.skip.push(name);
  writeDayEdits(store,programId,s); return s;
}
// Put back: the name leaves the day's skips, and the day's key goes with its last edit. Nothing is written for a day
// with no edits.
function dropSkipEdit(store: StateStore, programId: string | null, week: number | string, dayKey: string, name: string): DayEdits{
  const s=readDayEdits(store,programId),k=dayStoreKey(week,dayKey); if(!s[k]) return s;
  s[k].skip=(s[k].skip||[]).filter(function(x){return x!==name;});
  if(!s[k].skip!.length&&!(s[k].add||[]).length) delete s[k];
  writeDayEdits(store,programId,s); return s;
}
// A movement added to the day, with its dose and the instant: once by name, the first add kept.
function addAddEdit(store: StateStore, programId: string | null, week: number | string, dayKey: string, name: string, detail: string, now: number): DayEdits{
  const s=readDayEdits(store,programId),k=dayStoreKey(week,dayKey),e=dayEditEntry(s,k);
  if(!e.add.some(function(a){return a&&a.name===name;})) e.add.push({name:name,detail:detail,ts:now});
  writeDayEdits(store,programId,s); return s;
}
// An added movement removed: it leaves the day's adds, and the day's key goes with its last edit. Nothing is written
// for a day with no edits.
function dropAddEdit(store: StateStore, programId: string | null, week: number | string, dayKey: string, name: string): DayEdits{
  const s=readDayEdits(store,programId),k=dayStoreKey(week,dayKey); if(!s[k]) return s;
  s[k].add=(s[k].add||[]).filter(function(a){return a&&a.name!==name;});
  if(!s[k].add!.length&&!(s[k].skip||[]).length) delete s[k];
  writeDayEdits(store,programId,s); return s;
}
// Every week below the freeze cut gives up its edits. Session swaps are never applied to a day restored from ia_hist_
// (V222 D181 R5), because the snapshot carries the athlete's swaps by construction (R1). applyDayEdits has no such
// exclusion and is not idempotent (it rewrites every item's _skipped from the store and pushes adds deduped by name
// only), so on a touched week this prune is what keeps the store from arguing with a record the re-snapshot has
// already folded the edit into. Written only when something went.
function pruneDayEditsBefore(store: StateStore, programId: string | null, cutWeek: number): void{
  const s=readDayEdits(store,programId); let changed=false;
  Object.keys(s).forEach(function(k){const m=/^w(\d+)_/.exec(k);if(m&&+m[1]<cutWeek){delete s[k];changed=true;}});
  if(changed) writeDayEdits(store,programId,s);
}

// A skipped superset is stored as '__ss:<sectionIndex>' rather than by name, because the
// whole block goes: its items are interdependent (rounds with no rest between them), so
// pulling one movement changes the work:rest ratio, which IS the prescription.
function ssSkipToken(secIdx: number | string): string{return '__ss:'+secIdx;}
// Re-applied at the very end of the launch beside moves and swaps. Idempotent by
// construction: skip marks a flag rather than splicing (so a second pass re-marks the
// same item), and add checks for the name before pushing.
function applyDayEdits(prog: HeldGrid | null | undefined,store: DayEdits | null | undefined): void{
  if(!prog||!prog.weeks||!store) return;
  Object.keys(store).forEach(function(k){
    const m=/^w(\d+)_(.+)$/.exec(k); if(!m) return;
    const w=+m[1],d=m[2];
    const day=prog.weeks![w]&&prog.weeks![w][d];
    if(!day||!Array.isArray(day.sections)) return;
    const e: DayEdit=store[k]||{}, skips=e.skip||[], adds=e.add||[];
    // Skipped items are FLAGGED, never removed. The struck-through stub is what tells
    // the athlete the difference between "the engine never programmed this" and "I
    // bailed on this", and it is the only affordance for putting it back.
    day.sections.forEach(function(sec,si){
      // The athlete's own added block is never subject to skip flagging. Add and skip are
      // disjoint operations — an added movement is taken off with clearAdd, not skipped —
      // and enforcing that here is what makes this pass ORDER-INDEPENDENT. Without it, a
      // store holding both an add and a skip for the same name flags nothing on the first
      // pass (the item does not exist yet) and flags it on the second, so the function is
      // not idempotent and the launch produces a different day on every boot.
      if(sec._added) return;
      const ssKilled=skips.indexOf(ssSkipToken(si))>=0;
      if(sec.superset) sec._skipped=ssKilled||undefined;
      (sec.items||[]).forEach(function(it){
        // V162 (ruling R2): members of a live round skip individually by name. The
        // block token above still kills the whole round; both survive a re-apply.
        it._skipped = (skips.indexOf(it.name)>=0) || undefined;
      });
    });
    if(adds.length){
      let bucket=day.sections.filter(function(s){return s._added;})[0];
      if(!bucket){ bucket={label:'Added by you',_added:true,items:[]}; day.sections.push(bucket); }
      adds.forEach(function(a){
        if(!a||!a.name) return;
        if(bucket!.items.some(function(it){return it.name===a.name;})) return;
        bucket!.items.push({name:a.name,detail:a.detail||'',_addedByUser:true});
      });
    }
  });
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  addAddEdit, addSkipEdit, applyDayEdits, dropAddEdit, dropSkipEdit, pruneDayEditsBefore, readDayEdits, ssSkipToken,
  writeDayEdits,
};
