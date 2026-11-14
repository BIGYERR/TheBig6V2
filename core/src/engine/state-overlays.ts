import { _parseLocalDate } from './calendar.ts';
import { buildProgram } from './budget-engine-d.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── Overlays spliced into a rebuilt program: travel and injury, read off the stored program (docs/decisions/stored-state.md). ──
// Moved out of the page's overlays.ts in v0.262.1, code as it was, with the page's week range, its day date and its
// failure report passed in where the function called the page. It names no ia_ key and writes none: it reads the
// overlays, the config and the start the stored program carries (ia_programs) and changes the rebuilt grid it is
// handed, which refreshProgram then freezes and the athlete's touch snapshots into ia_hist_. The page's applyOverlays
// is a thin caller; refreshProgram, its one caller, stays in the page with the freeze until its own slice, and so do
// the overlay sheet, the chip and the readers of a day's stamp. It lives beside the engine while the page is built
// from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { Cfg, DayKey, Program, Week } from '../domain/index.ts';
/** A temporary change to a program, stored on it beside its config: travel (`substitute`) or an injury. Its dates are
 *  the source of truth (YYYY-MM-DD, both inclusive); with no `to` it runs to the program's end. */
export interface Overlay { id?: string; type?: string; from?: string | null; to?: string | null; patch?: Partial<Cfg> | null; created?: number }
/** A program as stored, with the overlays the athlete has set on it. */
export type OverlaidProgram = Program & { overlays?: Overlay[] | null };
/** The weeks an overlay's dates reach, clamped to the program, or null when it falls outside it (the page's overlayWeekRange). */
export type OverlayWeekRange = (prog: OverlaidProgram, ov: Overlay, totalWeeks: number) => { fromWeek: number; toWeek: number } | null;
/** The calendar date of a program day, or null with no start (the page's _progDayDate). */
export type ProgramDayDate = (prog: OverlaidProgram, week: number, day: string) => Date | null;

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
export { spliceOverlays };
