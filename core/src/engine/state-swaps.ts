import { dayStoreKey } from './state-day-log.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── The session swaps and the swap counts, ia_swaps_<program> and ia_swapct_<program> (docs/decisions/stored-state.md). ──
// Moved out of the page's swaps-edits.ts in v0.261.6, code as it was, with the store, the program, the week, the day
// and the instant passed in where the page read its globals and the clock. The page renames the card, snapshots the day
// and draws; these hold what a tap stores. Replaying the records onto a rebuilt grid (applySessionSwaps) stays in the
// page with refreshProgram until the freeze slice. It lives beside the engine while the page is built from this
// folder, and moves to core/src/app-state at cutover (MIGRATION.md).
//
// A swap is session-scoped: the athlete trades one lift for another on the day in front of them, the program itself
// is untouched, and next week says what it always said. The record is what lets a rebuild triggered by an app
// eviction mid-session keep the new lift while the athlete is standing over it. A record lives until the athlete
// undoes it (V222 D181); it is replayed in recording order on days the freeze did not restore from ia_hist_ and left
// alone on days it did.
import type { StateStore } from './state-store.ts';
/** Where an item named `from` stood before the rename: its section, its place, its detail, and the dose kept before an
 *  injury's re-filter when the card carried one (V221 D177 R4, V229 D193). */
export interface SwapPlace { s: number; i: number; d: string; ph?: string }
/** One swap on one day: the lift traded off, the one traded in, the instant, and where `from` stood, for undo. */
export interface SwapRecord { from: string; to: string; ts: number; rx?: SwapPlace[] }
/** The stored value of ia_swaps_: each day's swaps in recording order, keyed by dayStoreKey(week, day). */
export type Swaps = Record<string, SwapRecord[]>;
/** The run of one lift traded for one replacement, and whether the nudge has been offered for that pair. */
export interface SwapCount { to: string; n: number; offered: boolean }
/** The stored value of ia_swapct_: a count per lift traded off, keyed by its name. */
export type SwapCounts = Record<string, SwapCount>;

// The one reader and the one writer of each store. A missing or broken value reads as empty. A refused write is
// swallowed: a swap is the athlete's edit to today's card, and a full store must not stop the card from changing.
function readSwaps(store: StateStore, programId: string | null): Swaps{try{return JSON.parse(store.get('ia_swaps_'+programId)||'{}');}catch(e){return {};}}
function writeSwaps(store: StateStore, programId: string | null, v: Swaps): void{try{store.set('ia_swaps_'+programId,JSON.stringify(v));}catch(e){}}
function readSwapCounts(store: StateStore, programId: string | null): SwapCounts{try{return JSON.parse(store.get('ia_swapct_'+programId)||'{}');}catch(e){return {};}}
function writeSwapCounts(store: StateStore, programId: string | null, v: SwapCounts): void{try{store.set('ia_swapct_'+programId,JSON.stringify(v));}catch(e){}}

// A swap tapped: one record per lift traded off on the day, the latest tap replacing an earlier one of the same lift
// and going to the end of the day's list. V221 D177 (R4): `rx` is optional, where every item named `from` stood before
// the rename. It is for undo and nothing else; every other reader takes .from/.to only, and a record without it is read
// exactly as before. Re-tapping the same pair on the same day keeps the earlier tap's places it did not see.
function addSwapRecord(store: StateStore, programId: string | null, week: number | string, dayKey: string, from: string, to: string, rx: SwapPlace[] | null | undefined, now: number): Swaps{
  const s=readSwaps(store,programId),k=dayStoreKey(week,dayKey);
  const was=(s[k]||[]).filter(e=>e&&e.from===from&&e.to===to&&Array.isArray(e.rx))[0];
  const list=(s[k]||[]).filter(e=>e&&e.from!==from);
  const ent: SwapRecord={from:from,to:to,ts:now};
  if(Array.isArray(rx)&&rx.length) ent.rx=(was?was.rx!.filter(p=>!rx.some(q=>q.s===p.s&&q.i===p.i)):[]).concat(rx);
  list.push(ent);
  s[k]=list; writeSwaps(store,programId,s); return s;
}
// A swap undone: the day's record of that lift goes, and the day's key with its last record. Nothing is written when
// the day has none.
function dropSwapRecord(store: StateStore, programId: string | null, week: number | string, dayKey: string, from: string): Swaps{
  const s=readSwaps(store,programId),k=dayStoreKey(week,dayKey);
  if(!s[k]) return s;
  s[k]=s[k].filter(e=>e&&e.from!==from);
  if(!s[k].length) delete s[k];
  writeSwaps(store,programId,s); return s;
}

// ── COACH NUDGE ──────────────────────────────────────────────────────────────
// Trading the same lift off once is a bad night's sleep. Three sessions running is a preference, and at that point
// the app should say so rather than making the athlete re-swap it every week for the rest of the block. Counts
// consecutive swaps of the same lift TO the same replacement; any other choice resets it. Once offered, the pair is
// never offered again: a later run of it starts at one and stays offered.
const SWAP_NUDGE_AT=3;
// Counts the swap and gives back the pair's count when the nudge is due, else null.
function countSwap(store: StateStore, programId: string | null, from: string, to: string): SwapCount | null{
  const c=readSwapCounts(store,programId);
  const cur=c[from];
  if(cur&&cur.to===to&&!cur.offered) cur.n=(cur.n||0)+1;
  else c[from]={to:to,n:1,offered:(cur&&cur.to===to&&cur.offered)||false};
  writeSwapCounts(store,programId,c);
  const e=c[from];
  return (e&&!e.offered&&e.n>=SWAP_NUDGE_AT)?e:null;
}
// The nudge answered, either way: the lift's count is marked offered. Nothing is written for a lift never counted.
function markSwapNudged(store: StateStore, programId: string | null, from: string): void{
  const c=readSwapCounts(store,programId);
  if(c[from]){c[from].offered=true;writeSwapCounts(store,programId,c);}
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  SWAP_NUDGE_AT, addSwapRecord, countSwap, dropSwapRecord, markSwapNudged, readSwapCounts, readSwaps, writeSwapCounts,
  writeSwaps,
};
