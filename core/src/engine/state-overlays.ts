import { _parseLocalDate, getWeekMonday } from './calendar.ts';
import { injuryPlan } from './injury.ts';
import { buildProgram } from './budget-engine-d.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── Overlays spliced into a rebuilt program: travel and injury, read off the stored program (docs/decisions/stored-state.md). ──
// The splice moved out of the page's overlays.ts in v0.262.1, code as it was, with the week range, the day date and
// the failure report passed in where the function called the page. It names no ia_ key and writes none: it reads the
// overlays, the config and the start the stored program carries (ia_programs) and changes the rebuilt grid it is
// handed, which the launch then freezes (state-refresh.ts) and the athlete's touch snapshots into ia_hist_.
// v0.262.2 moved the rest of what a launch reads off an overlay here, under the names the page gave them: the week a
// date falls in and the weeks an overlay reaches (weekOfDate, overlayWeekRange), a program day's date (_progDayDate,
// from week-view-sections.ts), the pace clock's shift (paceShiftMap, which takes the instant now) and the overlay a
// day came from (dayOverlayInfo). The launch hands the splice the two readers itself. The overlay sheet, the chip and
// the injury flow stay in the page. It lives beside the engine while the page is built from this folder, and moves to
// core/src/app-state at cutover (MIGRATION.md).
import type { Cardio, Cfg, DayKey, Item, Program, Section, Week } from '../domain/index.ts';
/** A temporary change to a program, stored on it beside its config: travel (`substitute`) or an injury. Its dates are
 *  the source of truth (YYYY-MM-DD, both inclusive); with no `to` it runs to the program's end. */
export interface Overlay { id?: string; type?: string; from?: string | null; to?: string | null; patch?: Partial<Cfg> | null; created?: number }
/** A program as stored, with the overlays the athlete has set on it. */
export type OverlaidProgram = Program & { overlays?: Overlay[] | null };
/** The weeks an overlay's dates reach, clamped to the program, or null when it falls outside it (the page's overlayWeekRange). */
export type OverlayWeekRange = (prog: OverlaidProgram, ov: Overlay, totalWeeks: number) => { fromWeek: number; toWeek: number } | null;
/** The calendar date of a program day, or null with no start (the page's _progDayDate). */
export type ProgramDayDate = (prog: OverlaidProgram, week: number, day: string) => Date | null;
/** An item, a section and a day as the app holds them: the engine's, with the marks the app's own passes add (a
 *  skip, a dose kept before an injury's filter, the athlete's own add; a move; the overlay a day came from). */
export interface HeldItem extends Item { _skipped?: boolean; _preHold?: string; _addedByUser?: boolean }
export interface HeldSection extends Omit<Section, 'items'> { items: HeldItem[]; _skipped?: boolean; _added?: boolean }
export interface HeldDay { title?: string; dot?: string; tags?: string[]; rest?: boolean; cardio?: Cardio | null; sections?: HeldSection[]; note?: string; testLift?: string; _ovKey?: string; moved?: boolean; movedTo?: string; movedFrom?: string }
/** What the date readers read: a program's start, and an overlay's two dates. The screens hand them their own
 *  shapes of a program and an overlay through the bridge, so the readers ask for these fields and no more. */
export interface Started { startDate?: string | null }
export interface Spanned { from?: string | null; to?: string | null }
/** A grid of held days by week and day key: what the moves, the swaps and the edits are laid back on. */
export interface HeldGrid { weeks?: Record<string, Record<string, HeldDay>> | null }

// ── TEMPORARY OVERLAYS ────────────────────────────────────────────────────────
// A "temporary modification" is NOT a config change. "I'm in a hotel for two weeks"
// must not permanently rewrite cfg.equipment — the program has to revert on its own,
// or the athlete has to remember to undo it (they won't). Overlays live on the
// program as a SIBLING to cfg: cfg is the recipe for building, overlays are
// modifications applied to the built result. Shape:
//   {id, type:'substitute', from:'YYYY-MM-DD', to:'YYYY-MM-DD'|null, patch:{...cfg}, note, created}
// `to: null` = open-ended (runs to the end of the program) for "no running until
// further notice" cases. Dates are the SOURCE OF TRUTH, weeks are derived — once
// Suspend lands and pauses the clock, program weeks shift, so anchoring an overlay
// to a week number would be circular.
// Program week containing a calendar date (1-based, matching the weeks object).
function weekOfDate(prog: Started | null | undefined, dateStr: string | null | undefined): number | null{
  if(!prog || !prog.startDate) return null;
  const d=_parseLocalDate(dateStr); if(!d) return null;
  const mon=getWeekMonday(prog.startDate);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((d-mon)/86400000);
  return diff<0 ? 1 : Math.floor(diff/7)+1;
}
// Resolve an overlay's date range to a clamped [fromWeek,toWeek], or null if it
// falls entirely outside the program.
function overlayWeekRange<O extends Spanned>(prog: Started | null | undefined, ov: O | null | undefined, totalWeeks: number): { fromWeek: number; toWeek: number } | null{
  if(!ov || !ov.from || !totalWeeks) return null;
  const fw=weekOfDate(prog, ov.from);
  if(fw==null) return null;
  const tw = ov.to ? weekOfDate(prog, ov.to) : totalWeeks;   // open-ended → to program end
  if(tw==null) return null;
  const lo=Math.max(1,fw), hi=Math.min(totalWeeks,tw);
  return hi<lo ? null : {fromWeek:lo, toWeek:hi};
}
// ── D2b (V142): THE PACE CLOCK FREEZES WHILE THE ATHLETE CANNOT RUN QUALITY ──
// paceProgression is indexed by calendar week, so it kept tightening through injury
// overlays: an athlete back at week 6 was handed week 6's pace having last run
// quality at week 3's. This map is the correction. Derived FRESH from overlays on
// every rebuild, never stored as state: same overlays, same map, same build. A
// program with no overlays derives no map and builds byte-identical to V141.
// Counting rule (D2b-i): DAYS, not week spans, so a Wednesday return can never
// inflate 9 suppressed days into a 2-week shift. shift = round(days/7), floor 1.
// A week counts as suppressed only if its overlay's cardioMode actually touched
// running (easy/reduce/noimpact/noimpact_swim). Halfstep weeks never count: quality
// is back at pace, the clock legitimately runs. swimout (shoulder) and elbow never
// count: their runs never stopped. Overlapping overlays are merged so a stacked
// injury cannot double-count a day.
function paceShiftMap(prog: OverlaidProgram | null | undefined, now: number): number[] | null{
  const tw=prog&&prog.totalWeeks||0;
  if(!tw||!prog!.startDate||!Array.isArray(prog!.overlays)||!prog!.overlays.length) return null;
  const SUP: Record<string, number>={easy:1,reduce:1,noimpact:1,noimpact_swim:1};
  const today=new Date(now); today.setHours(0,0,0,0);
  const mon=getWeekMonday(prog!.startDate);
  const end=new Date(mon.getTime()+tw*7*86400000-86400000);
  const spans: number[][]=[];
  prog!.overlays.forEach(ov=>{
    if(!ov||ov.type!=='injury'||!ov.patch||!ov.patch.injury) return;
    const inj=ov.patch.injury;
    if(inj.halfstep) return;
    const P=injuryPlan({injury:{region:inj.region,tier:inj.tier}} as Cfg);
    if(!P||!P.cardioMode||!SUP[P.cardioMode]) return;
    const f=_parseLocalDate(ov.from); if(!f) return;
    // Open-ended live injury: every day hurt so far counts. The map grows as the
    // injury runs, which is correct: each day the athlete cannot run quality is
    // another day the clock holds.
    let t=ov.to?_parseLocalDate(ov.to):today;
    if(!t) t=today;
    const lo=Math.max(f.getTime(),mon.getTime());
    const hi=Math.min(t.getTime(),end.getTime());
    if(hi>=lo) spans.push([lo,hi]);
  });
  if(!spans.length) return null;
  spans.sort((a,b)=>a[0]-b[0]);
  const merged=[spans[0].slice()];
  for(let k=1;k<spans.length;k++){
    const m=merged[merged.length-1];
    if(spans[k][0]<=m[1]+86400000) m[1]=Math.max(m[1],spans[k][1]);
    else merged.push(spans[k].slice());
  }
  const map=new Array(tw+1).fill(0);
  for(let w=1;w<=tw;w++){
    const wkStart=mon.getTime()+(w-1)*7*86400000;
    let days=0;
    merged.forEach(s=>{
      const hi=Math.min(s[1],wkStart-86400000);
      if(hi>=s[0]) days+=Math.round((hi-s[0])/86400000)+1;
    });
    map[w]=days>0?Math.max(1,Math.round(days/7)):0;
  }
  for(let w=1;w<=tw;w++){ if(map[w]>0) return map; }
  return null;
}
// ── V175 (D30): the overlay a day came from, read off the day itself ────────────
// The splice stamps every spliced day with its overlay key. Reading the stamp is
// what makes the tag, the strip underline and the pill agree with the CARD: a day says
// it is a hotel session because it IS one, not because a date range says it should be.
// Survives rest-day moves and lives in the ia_hist_ snapshot as part of the record.
function dayOverlayInfo(day: { _ovKey?: unknown } | null | undefined): { type: string; patch: Partial<Cfg> } | null{
  if(!day||typeof day._ovKey!=='string') return null;
  try{ const k=JSON.parse(day._ovKey); if(!Array.isArray(k)||!k[1]) return null; return {type:k[0],patch:k[1]}; }catch(e){ return null; }
}
function _progDayDate(prog: Started | null | undefined, week: number, d: string): Date | null{
  if(!prog||!prog.startDate) return null;
  const off = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}[d]; if(off==null) return null;
  const mon = getWeekMonday(prog.startDate);
  const dt = new Date(mon); dt.setDate(mon.getDate()+(week-1)*7+off); dt.setHours(0,0,0,0);
  return dt;
}

// Splice overlay weeks into a freshly-built program. Builds a VARIANT program from
// the patched cfg and takes only its week range — rather than mutating cfg mid-build
// or find-and-replacing exercises in the output. This works because the engine keys
// everything off the TRUE program week (the lifting wave tiles across the full
// program), so week 5 pulled from a travel build is still week 5: same wave position,
// same deload cadence, same taper math. Progression is preserved for free.
// Overlap rule: later-created overlay wins (applied last).
function spliceOverlays(prog: OverlaidProgram, rebuilt: Program, weekRange: OverlayWeekRange, dayDate: ProgramDayDate, failed: (ov: Overlay, e: unknown) => void): Program{
  const ovs = Array.isArray(prog && prog.overlays) ? prog.overlays! : [];
  if(!ovs.length) return rebuilt;
  const totalWeeks = rebuilt.totalWeeks || prog.totalWeeks || 0;
  const _variantCache: Record<string, Program> = {};
  ovs.slice().sort((a,b)=>((a&&a.created)||0)-((b&&b.created)||0)).forEach(ov=>{
    try{
      if(!ov || (ov.type!=='substitute' && ov.type!=='injury') || !ov.patch) return;
      const range = weekRange(prog, ov, totalWeeks);
      if(!range) return;                                   // outside the program → inert
      const ck = JSON.stringify([ov.type, ov.patch]);      // one build per distinct type+patch
      // _travel marks the build as a temporary situation rather than the athlete's real
      // setup. It is what lets "Mini gym" mean a hotel rack (a few light dumbbells, hold
      // the line) while the SAME home_basic tier chosen in the wizard means a real home
      // gym with adjustable dumbbells and trains normally. Set here rather than in the
      // patch so it applies to overlays saved before this existed. TRAVEL-ONLY semantic:
      // injury variants build clean so home equipment keeps meaning what the wizard said.
      if(!_variantCache[ck]) _variantCache[ck] = buildProgram(ov.type==='substitute' ? {...prog.cfg, ...ov.patch, _travel:true} : {...prog.cfg, ...ov.patch});
      const variant = _variantCache[ck];
      if(!variant || !variant.weeks) return;
      // V175 (D27): THE UNIT IS THE DAY. Dates are the source of truth (§6b) and the
      // week range is only the search window: inside it, a day takes the variant only
      // if its own calendar date falls in [from, to] (both inclusive — D29). A trip that
      // starts on Tuesday and ends on Tuesday changes Tuesday; the old whole-week splice
      // rewrote all six days and handed the athlete chair squats on Wednesday. A
      // full-week overlay resolves every day and is byte-identical to the old splice.
      // Measured before ruling: the variant's same-day is a structural drop-in (0
      // mismatches on cardio / core / role / tags over 54,432 pairs — the split is
      // cfg-driven, equipment only changes the picks) and cross-seam adjacent-day
      // repeats run BELOW the base engine's own rate, so the merged week is not
      // re-deconflicted. Bridge and halfstep overlays are date-exact by construction
      // (from..from+6), so they now cover exactly the seven days the popup promises
      // instead of spilling into a third calendar week. Rest days stay the base's.
      const _from = _parseLocalDate(ov.from);
      const _to   = ov.to ? _parseLocalDate(ov.to) : null;
      if(!_from) return;
      // The legal universe rides on the DAY, not the week. A spliced day is stamped
      // with its overlay key and the sheet looks the universe up by that key, so a
      // hotel day in a gym week offers hotel-legal candidates and the gym days beside
      // it still offer the rack. The stamp rides on the content, so it survives a
      // rest-day move and goes into the ia_hist_ snapshot as part of the record.
      if(!rebuilt._swapUniverseByKey) rebuilt._swapUniverseByKey = {};
      if(Array.isArray(variant._swapUniverse)) rebuilt._swapUniverseByKey[ck] = variant._swapUniverse;
      for(let w=range.fromWeek; w<=range.toWeek; w++){
        const vw = variant.weeks[w]; if(!vw) continue;
        if(!rebuilt.weeks[w]) rebuilt.weeks[w] = {} as Week;
        Object.keys(vw).forEach(d=>{
          const vd = vw[d as DayKey]; if(!vd || vd.rest) return;
          const dt = dayDate(prog, w, d); if(!dt) return;
          if(dt < _from || (_to && dt > _to)) return;
          rebuilt.weeks[w]![d as DayKey] = Object.assign({}, vd, {_ovKey: ck});
        });
      }
    }catch(e){
      // An injury or travel plan silently not applying is a safety failure, not a
      // log line. The page tells the athlete the plan change did not take; the next
      // overlay is still applied.
      failed(ov, e);
    }
  });
  return rebuilt;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _progDayDate, dayOverlayInfo, overlayWeekRange, paceShiftMap, spliceOverlays, weekOfDate };
