import { LIFTING_FOCUS_TO_GOAL } from './exercise-library.ts';
import { entryDay } from './state-lift-log.ts';
import { readPrograms, writePrograms } from './state-programs.ts';
import { applySessionSwaps, readSwaps } from './state-swaps.ts';
import { applyDayEdits, pruneDayEditsBefore, readDayEdits } from './state-day-edits.ts';
import { _progDayDate, overlayWeekRange, paceShiftMap, spliceOverlays } from './state-overlays.ts';
import { _isoOf, _parseLocalDate, getWeekMonday } from './calendar.ts';
import { NSW_TABLE6_INT, calcProgramLength } from './nsw-cardio.ts';
import { PACE_GOALS, testWeekIndex } from './nrc-race-bike-swim.ts';
import { buildProgram } from './budget-engine-d.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── What a launch hands back for a stored program: the rebuild, the freeze and what is laid back on it (docs/decisions/stored-state.md). ──
// Moved out of the page's program-manage.ts in v0.262.2 (refreshProgram), code as it was, with the store, the instant
// and the failure reports passed in where the function read the page's store, the clock and the console. The page's
// refreshProgram is a thin caller. With it, under the page's names: the dated test pin (progTestPin, from programs.ts)
// and the rest day moves laid on a grid (applyRestDayMoves, from rest-day-shell.ts). The date readers and the pace
// clock are in state-overlays.ts, the swaps' and the edits' replays in state-swaps.ts and state-day-edits.ts.
//
// It reads ia_programs, ia_comp_, ia_logs_, ia_hist_, ia_exw_, ia_moves_, ia_swaps_ and ia_edits_, and writes two:
// ia_programs (an older program's seed put back into its config; a dated test's week pinned) and ia_edits_ (the edits
// of every week below the freeze cut dropped). The grid it hands back is never stored by it. It lives beside the
// engine while the page is built from this folder, and moves to core/src/app-state at cutover (MIGRATION.md).
import type { StateStore } from './state-store.ts';
import type { Cfg, Day, Week } from '../domain/index.ts';
import type { LiftEntry } from './state-lift-log.ts';
import type { Swaps } from './state-swaps.ts';
import type { HeldDay, OverlaidProgram, Overlay } from './state-overlays.ts';
/** A program as stored and as in hand: the build, its overlays, and where its block opened (race aligned programs). */
export type StoredProgram = OverlaidProgram & { blockOpen?: string | null };
/** What the caller is told when a part of the launch fails; the launch goes on with what it has. `overlay`: one
 *  overlay did not apply (the others still do). `freeze`: the freeze failed, the weeks are the rebuilt ones.
 *  `rebuild`: the engine could not build the config, the stored program is handed back. */
export interface RefreshReport { overlay: (ov: Overlay, e: unknown) => void; freeze: (e: unknown) => void; rebuild: (e: unknown) => void }
/** A rest day move as stored (ia_moves_), keyed by the day the session moved onto: the day it came from, or in older
 *  data that day's name alone. */
export type RestMove = string | { from: string; ts?: number };
/** The dated test pin: the pinned week or null, the goal's length, the raw test week (null before the start), and
 *  the last row of Table 6. */
export interface TestPin { tw: number | null; len: number; week: number | null; cap: number }

// D106a (V207), D184 (V223): the one owner of the dated test pin. A run_pace_goal-family goal
// with a test date and eventTargeted pins to the week holding its test whenever that week is a
// row of Table 6 (rows 1 to 26; index 0 is unused). A test before the start, or past week 26,
// pins nothing. doGenerate, setProgStart and the boot backfill read this predicate; none of them
// carries its own. Returns {tw, len, week, cap}: tw the pinned week or null, len the goal length
// (sized the way buildProgram sizes it), week the raw test week (null before the start), cap the
// last row of Table 6 (26), the one place that number is taken, which the wizard's beyond 26 card
// prints; null for any other program.
function progTestPin(cfg: Partial<Cfg> | null | undefined, startIso: string | null | undefined): TestPin | null{
  const c: Partial<Cfg> = cfg || {}, g = c.cardioGoals && c.cardioGoals.run;
  if(!(c.cardioTypes||[]).includes('run') || !g || !PACE_GOALS.has(g.id) || c.eventTargeted === false || !c.raceDate) return null;
  const len = calcProgramLength(c.cardioTypes, {...c.cardioGoals, _experience:c.experience||'intermediate', _ageBracket:c.ageBracket||'18-35', _eventTargeted:c.eventTargeted},
    LIFTING_FOCUS_TO_GOAL[c.liftingFocus!]||c.liftingFocus||'balanced').weeks;
  const week = testWeekIndex(startIso, c.raceDate), cap = NSW_TABLE6_INT.length - 1;
  return {tw: (week! >= 1 && week! <= cap) ? week : null, len, week, cap};
}
// Idempotent: safe to run on a freshly rebuilt week OR on a frozen week that already has
// the move baked in, which is why it can sit at the tail of the launch unconditionally.
function applyRestDayMoves<P extends { weeks?: Record<string, Record<string, HeldDay>> | null } | null | undefined>(prog: P,moves: Record<string, RestMove | null | undefined> | null | undefined): P{
  if(!prog||!prog.weeks||!moves) return prog;
  Object.keys(moves).forEach(destKey=>{
    const mv=moves[destKey]; if(!mv) return;
    const origin=(typeof mv==='string')?mv:mv.from;
    const m=/^w(\d+)_(\w+)$/.exec(destKey); if(!m) return;
    const w=+m[1]!, dest=m[2]!;
    const wk=prog.weeks![w]; if(!wk) return;
    if(wk[dest]&&wk[dest].movedFrom===origin) return;      // already applied
    const src=wk[origin]; if(!src||src.rest||src.moved) return;
    wk[dest]={...src, movedFrom:origin};
    wk[origin]={title:src.title,dot:'rest',tags:['rest'],rest:true,moved:true,movedTo:dest};
  });
  return prog;
}
// Re-run the engine for an EXISTING program on load so it reflects the CURRENT engine rather
// than whatever was baked when it was first generated — e.g. a program created under the old
// weight model picks up the new RPE prescriptions on next open. buildProgram is pure
// (cfg in → program out). Gated to programs carrying a stored seed (V196+): without a stable
// seed, rebuilding would reshuffle exercise selection, so older programs are left as their
// baked selves. Rebuild is in-memory only (storage stays the stable fallback). Fail-safe: any
// error falls back to the stored program so loading never breaks.
function refreshStoredProgram(store: StateStore, prog: StoredProgram, now: number, failed: RefreshReport): StoredProgram{
  if(!prog || !prog.cfg) return prog;
  // SEED FALLBACK: older programs baked seed at the program level but not into cfg.
  // The detail card already displays prog.seed when cfg.seed is missing, so this
  // guard must honor the same source — otherwise those programs silently skip every
  // rebuild and overlays (injury, travel) never apply while the pill still reports
  // them. Same seed → same exercise picks, so the backfill rebuilds an identical
  // program. Persisted once so the program is permanently repaired.
  if(prog.cfg.seed == null){
    if(prog.seed == null) return prog; // truly seedless → leave baked
    prog.cfg.seed = prog.seed;
    try{ const _ps=readPrograms(store); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi]!.cfg={..._ps[_pi]!.cfg,seed:prog.seed}; writePrograms(store,_ps); } }catch(e){}
  }
  // D106a (V207), D184 (V223): BACKFILL. A stored program whose _testWeek is null or absent
  // re-derives its test week from its own start (progTestPin) each boot until it pins; it
  // writes nothing otherwise. It pins when the test is in weeks 1 to 26 and not past: the
  // week and the length are set and persisted, so the key is numeric and this stops running.
  // A test that is past, before the start or past week 26 leaves the key and the stored
  // length as they were. Untrained weeks re-pin; the freeze below keeps every trained day
  // byte-identical.
  if(prog.cfg._testWeek == null){
    const _tp = progTestPin(prog.cfg, prog.startDate);
    if(_tp && _tp.tw){
      const _rd = _parseLocalDate(prog.cfg.raceDate), _td = _parseLocalDate(_isoOf(new Date(now)));
      if(!(_rd && _td && _rd < _td)){   // a past test pins nothing and writes nothing
        prog.cfg._testWeek = _tp.tw;
        prog.cfg._raceDateCappedWeeks = _tp.tw;
        try{ const _ps=readPrograms(store); const _pi=_ps.findIndex(p=>p&&p.id===prog.id); if(_pi>=0){ _ps[_pi]!.cfg={..._ps[_pi]!.cfg,_testWeek:prog.cfg._testWeek,_raceDateCappedWeeks:prog.cfg._raceDateCappedWeeks}; writePrograms(store,_ps); } }catch(e){}
      }
    }
  }
  let _swapCut: number | null=null;
  const _histRestored=new Set<string>();   // V222 D181 (R5): day keys the freeze restored from ia_hist_ this boot
  // ── D2b (V142): derive the pace-shift map BEFORE the rebuild ──
  // Set on cfg so both the base build and every overlay VARIANT build (which spread
  // prog.cfg) read the same map: spliced weeks and base weeks agree on the clock.
  // Deleted when it derives to nothing, so a stale persisted copy can never outlive
  // the overlays that justified it.
  try{
    const _psm=paceShiftMap(prog, now);
    if(_psm) prog.cfg._paceShift=_psm as unknown as Cfg['_paceShift']; else delete prog.cfg._paceShift;   // the config's type does not say yet that the map is a list by week
  }catch(e){ try{ delete prog.cfg._paceShift; }catch(_e){} }
  try {
    const rebuilt: StoredProgram = buildProgram(prog.cfg);   // same exercises (stable seed) + current anchors
    rebuilt.id = prog.id;                      // preserve identity & user-set state
    rebuilt.name = prog.name;
    rebuilt.created = prog.created;
    rebuilt.startDate = prog.startDate;
    // D180 (V221): blockOpen is where the block opened (D14a §2); a rebuild keeps pre-signup days outside.
    rebuilt.blockOpen = prog.blockOpen;
    rebuilt.seed = prog.seed;
    rebuilt.overlays = Array.isArray(prog.overlays) ? prog.overlays : [];

    // Overlays splice BEFORE the freeze, never after — the freeze must have the last
    // word so a temporary modification can't rewrite a week already trained. A week
    // trained during a travel overlay stays the travel version forever, which is
    // correct: history records what was actually prescribed.
    spliceOverlays(prog, rebuilt, overlayWeekRange, _progDayDate, failed.overlay);

    // ── FREEZE ALREADY-TRAINED WEEKS ──────────────────────────────────────────
    // A launch re-runs the CURRENT engine on every open/boot, so shipping an
    // engine change would otherwise silently REWRITE weeks the athlete already
    // trained: their log says "suitcase + farmer carry", the card would show one.
    // Training history must record what was actually prescribed, so stored weeks
    // below the cut are carried over verbatim and only the untrained remainder gets
    // the new engine.
    //
    // Cut = the current week, pushed to NEXT week if the current week has already
    // been touched. Mid-week is a hard boundary on purpose: the engine arranges a
    // week as a UNIT (leg/press spacing, cardio placement, core chosen by looking
    // ahead to tomorrow), so splicing new days into a half-trained week produces a
    // hybrid neither plan intended — e.g. legs Monday from the old plan plus legs
    // Thursday from the new one, exactly what the spacing guards exist to prevent.
    //
    // NOTE: cannot use calcCurrentWeek() here — it reads the global activeProg,
    // which is still being assigned the result of this very call. Computed locally
    // from prog instead. Same for completions: read by prog.id, not activeProgId.
    try{
      // V174 (D23): the freeze no longer requires a start date. Its cut is
      // max(date-derived, furthest-touched+1) and the second half needs no clock — it
      // is exactly the hardening for "the date can move". Behind the old guard a
      // dateless program skipped the whole block and every trained week was rebuilt
      // on every boot. Without a clock: no date cut, every frozen week pierces
      // (nothing is "dead past"), and the touched frontier carries the freeze alone.
      if(prog.weeks){
        const _tw = prog.totalWeeks || rebuilt.totalWeeks || 6;
        const _hasClock = !!prog.startDate;
        let _curWk = 1;
        if(_hasClock){
          const _mon = getWeekMonday(prog.startDate!);
          const _today = new Date(now); _today.setHours(0,0,0,0);
          // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
          const _diff = Math.floor((_today - _mon)/86400000);
          _curWk = _diff < 0 ? 1 : Math.min(_tw, Math.floor(_diff/7)+1);
        }
        // "Touched" = a day the athlete has SEEN, proved by ANY of the four stores
        // (V202 D108). It used to read ia_comp_ and ia_logs_ only, and the cut derived
        // from those two alone. Two stores that also prove the day happened were left
        // out: ia_exw_ is a load the athlete wrote against a prescription, and ia_hist_
        // is the snapshot of the prescription they were shown. Measured on the 11->5
        // compression fixture with weeks 1-3 logged: with only ia_exw_ present, 7 of 15
        // logged days were REWRITTEN, and with only ia_hist_ present, the same 7 of 15.
        // ia_hist_ was doubly wrong: it is consulted only INSIDE the w < _cut loop, so a
        // snapshot could not save its own day. The exw-only path is reachable in the
        // shipped app — selectKBSize calls logExerciseWeight and nothing else, so tapping
        // a kettlebell size kept the load and left the prescription rewritable.
        // selectKBSize is deliberately NOT changed: tapping a bell size must not have to
        // write a completion record to be safe.
        //
        // KEY SHAPE. ia_comp_, ia_logs_ and ia_hist_ all key 'w<N>_<day>', so they merge
        // directly. ia_exw_ does NOT: it keys by exercise SLUG (exStoreKey), and each
        // entry carries {week, day, ...}, so its day keys are DERIVED from the entries
        // through entryDay() — the app's single reader of an entry's day, which falls
        // back to the timestamp's weekday for pre-V117 rows. An entry that yields no day
        // at all still contributes 'w<N>_', which raises _maxTouched (the regex below
        // matches it) but can never equal a real _dk(w,d) key, so it moves the frontier
        // without ever falsely freezing a named day.
        const _touched: Record<string, unknown> = {};
        try{ Object.assign(_touched, JSON.parse(store.get('ia_comp_'+prog.id)||'{}')); }catch(e){}
        try{ Object.assign(_touched, JSON.parse(store.get('ia_logs_'+prog.id)||'{}')); }catch(e){}
        try{ Object.assign(_touched, JSON.parse(store.get('ia_hist_'+prog.id)||'{}')); }catch(e){}
        try{
          const _exw: Record<string, { entries?: LiftEntry[] } | null> = JSON.parse(store.get('ia_exw_'+prog.id)||'{}');
          Object.keys(_exw).forEach(_slug=>{
            const _ents = (_exw[_slug] && _exw[_slug]!.entries) || [];
            _ents.forEach(_e=>{
              const _wn = +(_e && _e.week);
              if(!(_wn > 0)) return;
              _touched['w'+_wn+'_'+(entryDay(_e)||'')] = true;
            });
          });
        }catch(e){}
        const _pfx = 'w'+_curWk+'_';
        const _curTouched = Object.keys(_touched).some(k => k.indexOf(_pfx) === 0);
        // Date-derived cut, from the current week.
        const _dateCut = _curWk + (_curTouched ? 1 : 0);
        // Highest week with ANY completion or log — the true training frontier. startDate is
        // user-editable (setProgStart) and Suspend will shift the effective clock, so the
        // date-derived week can move BACKWARD; without this, weeks already trained would look
        // like the future and get rebuilt. Freezing through the furthest-touched week makes it
        // impossible to rewrite a trained week no matter how dates move.
        let _maxTouched = 0;
        Object.keys(_touched).forEach(k=>{ const m=/^w(\d+)_/.exec(k); if(m){ const n=+m[1]; if(n>_maxTouched) _maxTouched=n; } });
        const _cut = Math.max(_dateCut, _maxTouched + 1);
        _swapCut = _cut;   // carries the freeze cut to pruneDayEdits at the end of refreshProgram, and nothing else
        // ── THE FREEZE IS PER-DAY, NOT PER-WEEK (V133) ─────────────────────────
        // The freeze protects training HISTORY: what was actually prescribed on a day
        // the athlete trained. It used to restore the whole stored week as a unit, on
        // the reasoning that the engine plans a week as a unit (leg/press spacing,
        // cardio placement, core look-ahead) and splicing new days into a half-trained
        // week produces a hybrid neither plan intended.
        //
        // THAT REASONING ASSUMED prog.weeks WAS ROUGHLY THE CURRENT PLAN. It is not.
        // refreshProgram's output is never persisted, so prog.weeks is the build from
        // CREATION DAY and drifts further from the engine with every release. Reported
        // from device: a week-6 Tuesday read Push + 72 min Long Ride at 20:03, the
        // athlete logged one exercise in that week, and on the next boot the SAME day
        // read Pull + 38 min LSD — the creation-day build, from an engine predating
        // V114 (when the bike still collapsed lsd_long into lsd_easy and no long ride
        // existed). One log key rolled an untrained day back eighteen versions.
        //
        // Worse than cosmetic: a Pull day's exercises are keyed on seed + week + role,
        // NOT on weekday, so a stale build landing 'pull' on Tuesday while the live
        // build lands 'pull' on Monday serves the identical session twice. The athlete
        // got Sumo deadlift 4x3 @ RPE 9 on back-to-back days — the exact collision the
        // spacing guards exist to prevent, produced by bypassing them.
        //
        // So the unit is now the DAY. A day is frozen when it has a real record: an
        // ia_hist_ snapshot, a completion, or a log. A day with none of the three has
        // no history to protect and rebuilds live. This SUBSUMES the old injury-only
        // pierce, which was this same rule scoped to safety.
        //
        // Two boundaries, both deliberate:
        //   • Only weeks at or after the current week pierce. A fully past week is a
        //     dead record and rewriting its skipped days buys nothing.
        //   • The hybrid risk is real and is NOT repaired here. Measured, not patched.
        const _injRanges = (Array.isArray(prog.overlays) ? prog.overlays : [])
          .filter(ov => ov && ov.type==='injury' && ov.patch && ov.patch.injury)
          .map(ov => { try{ return overlayWeekRange(prog, ov, _tw); }catch(e){ return null; } })
          .filter(Boolean) as { fromWeek: number; toWeek: number }[];
        const _injCovers: (w: number) => boolean = w => _injRanges.some(r => w >= r.fromWeek && w <= r.toWeek);
        // ── HISTORY SOURCE ─────────────────────────────────────────────────────
        // ia_hist_ holds the day exactly as rendered at first touch, so it is the real
        // record; prog.weeks is only the fallback for days touched before snapshots
        // shipped, and (below the pierce boundary) for untouched days in past weeks.
        const _hist: Record<string, Day> = {};
        try{ Object.assign(_hist, JSON.parse(store.get('ia_hist_'+prog.id)||'{}')); }catch(e){}
        const _dk = (w: number,d: string) => 'w'+w+'_'+d;
        for(let w=1; w<_cut; w++){
          if(!prog.weeks[w]) continue;
          const _stored: Record<string, Day> = prog.weeks[w]!;
          const _live: Record<string, Day>   = (rebuilt.weeks && rebuilt.weeks[w]) || {};
          const _pierce = w >= _curWk;
          // DAY-KEY UNION, pierced weeks only (V133). The merged week used to be built
          // from the stored week's keys alone, so a day that exists in the rebuild but
          // not in the creation-day store — which is what a train-day change produces —
          // was dropped out of the frozen week entirely. Past weeks keep the stored key
          // set so a schedule change cannot retroactively add days to a dead week.
          let _days: string[];
          if(_pierce){
            _days = []; const _seen = new Set();
            Object.keys(_stored).forEach(d=>{ if(!_seen.has(d)){ _seen.add(d); _days.push(d); } });
            Object.keys(_live).forEach(d=>{ if(!_seen.has(d)){ _seen.add(d); _days.push(d); } });
          } else {
            _days = Object.keys(_stored);
          }
          const _merged: Record<string, Day | undefined> = {};
          _days.forEach(d=>{
            const k = _dk(w,d);
            // 1. Snapshot = what was actually on screen. Always wins, every week.
            const _snap = _hist[k];
            if(_snap){ _merged[d] = _snap; _histRestored.add(k); return; }
            // 2. Touched with no snapshot = trained before snapshots shipped, so what
            //    was on screen is unrecoverable. LEGACY CARVE-OUT: on an injury-covered
            //    week take the live (already injury-applied) day, because showing
            //    all-out intervals inside a protected week is the worse of the two
            //    wrong answers. This is the one behaviour the old injury pierce had
            //    that the general rule does not, and it is kept deliberately.
            if(Object.prototype.hasOwnProperty.call(_touched, k)){
              if(_injCovers(w) && _live[d]){ _merged[d] = _live[d]; return; }
              _merged[d] = _stored[d] || _live[d];
              return;
            }
            // 3. No record of any kind. Nothing to protect — take the live build.
            if(_pierce && _live[d]){ _merged[d] = _live[d]; return; }
            _merged[d] = _stored[d] || _live[d];
          });
          Object.keys(_merged).forEach(d=>{ if(!_merged[d]) delete _merged[d]; });
          rebuilt.weeks[w] = _merged as Week;
        }
      }
    }catch(e){ failed.freeze(e); }

    // Rest-day moves are re-applied LAST, after overlays and the freeze. They are the
    // athlete's own edits to the calendar, so nothing the engine does should undo them.
    // applyRestDayMoves is idempotent, so a frozen week that already has the move baked
    // in is left alone rather than double-applied.
    try{
      const _mv=JSON.parse(store.get('ia_moves_'+prog.id)||'{}');
      if(_mv&&Object.keys(_mv).length) applyRestDayMoves(rebuilt,_mv);
    }catch(e){}
    // Session swaps re-apply alongside the rest-day moves, for the same reason: they
    // are the athlete's own edit to today, and a rebuild triggered by an app eviction
    // mid-session must not put the old lift back while they are standing over the new
    // one. V222 D181 (R5): session swaps are never re-applied to a day the freeze
    // restored from ia_hist_, because that snapshot already carries them (R1). Those
    // keys are left out of a shallow copy handed to applySessionSwaps; the store is
    // neither changed nor saved, so the record stays for undo on that day. Days the
    // freeze took from the stored grid (touched with no snapshot, or past and
    // untouched) still get the replay.
    try{
      const _sw=readSwaps(store,prog.id)||{}, _swLive: Swaps={};
      Object.keys(_sw).forEach(k=>{ if(!_histRestored.has(k)) _swLive[k]=_sw[k]; });
      if(Object.keys(_swLive).length) applySessionSwaps(rebuilt,_swLive);
    }catch(e){}
    // Adds and skips run LAST, after swaps. Order matters: a swap rewrites an item's
    // name, so a skip recorded against the post-swap name would find nothing if it ran
    // first. Running last also means an added item can never be swapped out from under
    // the store, since it does not exist until this pass.
    try{
      if(typeof _swapCut==='number') pruneDayEditsBefore(store,prog.id,_swapCut);
      const _ed=readDayEdits(store,prog.id);
      if(_ed&&Object.keys(_ed).length) applyDayEdits(rebuilt,_ed);
    }catch(e){}
    return rebuilt;
  } catch(e){
    failed.rebuild(e);
    return prog;
  }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { applyRestDayMoves, progTestPin, refreshStoredProgram };
