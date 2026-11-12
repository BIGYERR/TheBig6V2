// ── The program list, the active program and the Wildcard's record: ia_programs, ia_active, ia_wild_<program> (docs/decisions/stored-state.md). ──
// Moved out of the page's storage.ts in v0.261.6, code as it was, with the store and the program passed in where the
// page read its globals. These are the last stores storage.ts read and wrote itself. Choosing the active program and
// handing it on (loadActiveProgram, which also clears ia_active), the purge and the backup stay in the page with their
// own slices. It lives beside the engine while the page is built from this folder, and moves to core/src/app-state at
// cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
import type { Program } from '../domain/index.ts';
/** One Wildcard workout done: its title, the instant, and the program day it stood in for (null on none). */
export interface WildcardDone { title: string; ts: number; week: number | null; dayKey: string | null }

// Every program, the archived ones too, with its stored grid (the freeze's source, V202). A missing or broken list reads
// as empty. A refused write throws to the caller, as it always has: a program that cannot be stored is not built.
function readPrograms(store: StateStore): Program[]{try{return JSON.parse(store.get('ia_programs')||'[]');}catch{return[];}}
function writePrograms(store: StateStore, p: Program[]): void{store.set('ia_programs',JSON.stringify(p));}
// The active program's id, null when none is stored (an empty value too).
function readActiveProgramId(store: StateStore): string | null{return store.get('ia_active')||null;}
function writeActiveProgramId(store: StateStore, id: string): void{store.set('ia_active',id);}
// The coach nudge taken: one lift traded for one replacement three sessions running becomes the program's standing
// choice. The preference lives in cfg, so every rebuild after it reproduces the substitution without any patch store
// to re-apply. Moved out of the page's acceptSwapNudge in v0.261.7: the program comes back for the page to mark the
// pair offered and rebuild; a missing program, or one with no config, writes nothing and comes back null.
function recordSwapPreference(store: StateStore, programId: string | null, from: string, to: string): Program | null{
  const programs=readPrograms(store);
  const p=programs.filter(x=>x&&x.id===programId)[0];
  if(!p||!p.cfg) return null;
  p.cfg.exSwapPrefs={...(p.cfg.exSwapPrefs||{})};
  p.cfg.exSwapPrefs[from]=to;
  writePrograms(store,programs);
  return p;
}

// The Wildcard workouts done on a program, in the order done. A missing or broken record reads as empty.
function readWildcardDone(store: StateStore, programId: string | null): WildcardDone[]{try{return JSON.parse(store.get('ia_wild_'+programId)||'[]');}catch{return[];}}
function writeWildcardDone(store: StateStore, programId: string | null, a: WildcardDone[]): void{store.set('ia_wild_'+programId,JSON.stringify(a));}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  readActiveProgramId, readPrograms, readWildcardDone, recordSwapPreference, writeActiveProgramId, writePrograms,
  writeWildcardDone,
};
