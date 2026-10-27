import { EXLIB, _swapUniverseAdd, _swapUniverseList, _swapUniverseReset } from './exercise-library.ts';
import { isTrackableWeight } from './exercise-kinds.ts';
import { _ISO_ORDER } from './calendar.ts';
import { _fmtMileAnchor } from './clock-format.ts';
import { PACE_GOALS } from './nrc-race-bike-swim.ts';
import { runAnchorInfo } from './cardio-progression.ts';
import { _BW_GEAR, _BW_SUBS } from './prehab.ts';
import {
  _BW_KEEP_FIXED, _bwSetsFromDetail, accessoryGrammarSweep, bodyweightSweep, hotNextHingeClampSweep,
  preventionDoseSweep,
} from './power-accessory.ts';
import { deconflictAdjacentDupes, injectDynamicCore } from './core-legs.ts';
import { engineA_timeline, engineB_cardio, planCalendar } from './engine-a-b-calendar.ts';
import { applyInjuryFilter, injuryDayTitle } from './injury.ts';
import { engineC_kinematics } from './engine-c.ts';
import {
  _auxFamily, _cardioInterference, _ceil, _itemRegion, _moveCap, _pattern, _sectionRegion, _setCap,
} from './region-caps.ts';
import { applySwapPrefs } from './swap-prefs.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { Cardio, Cfg, DayKey, DayTag, Item, Program, Section, Week, WeekGrid, Weeks } from '../domain/index.ts';
import type { EngineCfg } from './cardio-progression.ts';
import type { CalendarPlan, EngineA, EngineB } from './engine-a-b-calendar.ts';
import type { EngineC } from './engine-c.ts';

declare global {
  // The tests' switches for the caps (tests/support): each turns one pass off when set on globalThis.
  var __CAP_OFF: boolean | undefined;
  var __DELOAD_OFF: boolean | undefined;
  var __BUDGET_OFF: boolean | undefined;
  var __REGIONAL_OFF: boolean | undefined;
  // `[].concat(a, b)` collects into a fresh array: TypeScript reads a bare [] as never[], so this overload gives the
  // result the type of what is collected. It applies only to a never[] receiver.
  interface Array<T> { concat<U>(this: never[], ...items: (U | ConcatArray<U>)[]): U[] }
}
/** The parts of a session the passes read: its sport, its name and text, its dose, whether it is a Nike plan session. */
type SessionView = Pick<Cardio, 'type' | 'subtype' | 'detail' | 'dose' | 'isNRC'>;
const _PATTERN_REGION: Record<string, string> = {
  hpress:'push', vpress:'push', delt_iso:'push', tri_iso:'push',
  row:'pull', vpull:'pull', bi_iso:'pull',
  squat:'legs', hinge:'legs', lunge:'legs', leg_iso:'legs', calf_iso:'legs', hip_ext:'legs'
};
function _isCompound(name: string | null | undefined): boolean{
  return /bench|squat|deadlift|press|row|pull|clean|snatch|lunge|dip|chinup|pullup|hinge|romanian|thruster/.test((name||'').toLowerCase())
      && !/lateral|front raise|rear delt|face pull|curl|extension|pushdown|skullcrush|fly|calf|raise/.test((name||'').toLowerCase());
}
// Compound "weight tier": a barbell compound outranks a dumbbell/machine variant, which
// outranks bodyweight. Two consumers, both using it as a SECONDARY net — each already
// protects main work by section label (`^main|^primer|^power|^strength`), so this only ever
// answers "is this a genuinely heavy loaded compound that landed in an accessory section,
// and therefore still not trim fodder":
//   - capRegionalFatigue — highest-tier compound per region is exempt from trimming
//   - capSessionBudget   — tier 3 is never budget fodder
// Since the question is about LOAD, the tier has to measure load.
//
// V103: the unqualified-name fallthrough used to read any bare compound as barbell-tier, so
// `Dips`, `Bench dips (chair)`, `Chinups` and `Inverted row (under a table)` all came back 3 —
// equal to a barbell bench. Latent rather than active (measured: capSessionBudget engages ~2×
// per 216 lifting days and was never blocked by it; capRegionalFatigue's main lift is held by
// label regardless), and the correction is provably inert — 90 configs x 6 weeks byte-identical.
// Fixed now because the unbuilt "Reduce / less time" verb is specced to reuse this rank order as
// a MORE AGGRESSIVE cap, which is the point the defect would have gone live.
//
// Order matters: the loaded-marker test runs first, so `Weighted chinups` and `Trap bar deadlift`
// correctly stay tier 3. Loadable movements with bare names (`Split squat`, `Reverse lunge`,
// `Squat (slow 3s tempo)`) are deliberately NOT in the unloaded list — on a barbell tier they
// carry a bar, and demoting them would make real leg work trimmable.
function _compoundTier(name: string | null | undefined): number{
  if(!_isCompound(name)) return 0;
  // V200 (D89): a drill declared family 'core' in _AUX_FAMILY is a core drill, never a loaded
  // compound. `Pallof press` cleared _isCompound on the bare substring `press` and then fell
  // through to the unqualified-name `return 3` below, reading as barbell-tier. It was the only
  // one of the 23 declared-core names to do so. The map is the authority on what a core drill is.
  if(_auxFamily(name)==='core') return 0;
  const N=(name||'').toLowerCase();
  if(/dumbbell|kettlebell|\bdb\b|\bkb\b/.test(N)) return 2;
  if(/machine|cable|smith|assisted|pushup|push-up|bodyweight/.test(N)) return 1;
  if(!/weighted|loaded|barbell|trap bar/.test(N)
     && /\bdips?\b|chinup|pullup|pull-up|chin-up|inverted row|nordic|glute bridge|back extension|wall sit|\bband\b/.test(N)) return 1;
  return 3; // barbell / unspecified-barbell compound (back squat, deadlift, bench, overhead press, row)
}
function _isIsolation(name: string | null | undefined): boolean{
  return /lateral|front raise|rear delt|face pull|curl|extension|pushdown|skullcrush|fly|calf raise|kickback/.test((name||'').toLowerCase());
}
function _setCount(detail: string | null | undefined): number{
  const m=(detail||'').match(/(\d+)\s*[×x]/);
  return m?Math.max(1,parseInt(m[1],10)):3;
}
function _itemCost(it: Item, sectionRegion?: string | null): number{
  const sets=_setCount(it.detail);
  let mult=1.0;
  if(_isCompound(it.name)) mult=1.5;
  else if(_isIsolation(it.name)) mult=0.75;
  return sets*mult;
}
// ── RECOVERY-WEEK VOLUME DELOAD ─────────────────────────────────────────────
// A recovery week must cut VOLUME, not just RPE. Doctrine (2020 PTG periodization,
// classic deload practice) restores recovery headroom by dropping total work 40–50%;
// intensity reduction alone keeps the same time under load in a lighter shirt.
// Ruling (Mario): recovery week = main lift + ONE accessory block + hip prehab,
// nothing else. Carries, finishers, conditioning, and extra supersets sit out.
// Runs BEFORE capRegionalFatigue so the slimmed day is still sanity-checked, and
// dynamic core injection is gated off recovery weeks at week assembly.

// ── POSTERIOR-CHAIN LENS (single writer) ────────────────────────────────────
// D85 shipped this lens inside capSessionBudget; D91 needs the same lens in
// recoveryDeload. It is HOISTED, not copied — two in-app copies of "what counts as
// posterior chain" is exactly the desync §10b warns about. THE SET IS {hinge,
// hip_ext} AND NOTHING ELSE; leg_iso is deliberately outside it (EXLIB
// .leg_accessory mixes 'Leg extension' and 'Leg press' in with 'Lying leg curl').
// _pattern is called directly so this lens and the region caps can never disagree.
// PLACED BELOW THE RECOVERY-WEEK BANNER ON PURPOSE (V199, D91 amendment): g197d E5
// confines _itemCost by slicing from its header up to that banner line, so a
// declaration above the banner lands INSIDE a confined slice and reads as an unruled
// edit to budget machinery. The placement is inert: a top-level function declaration
// hoists, and both callers (recoveryDeload below, capSessionBudget further down) sit
// after this point in source order anyway.
function _isPostChain(n: string | null | undefined): boolean{ const p=_pattern(n); return p==='hinge'||p==='hip_ext'; }

function recoveryDeload(sections: Section[], cardio: SessionView | null | undefined): Section[]{
  // Test-only bypass. Per-pass since V123 — __CAP_OFF used to gate THREE passes at once
  // (this one, capSessionBudget and capRegionalFatigue), so any harness that toggled it to
  // isolate one of them silently measured all three. That produced a false reading of the
  // regional cap's footprint. __CAP_OFF is kept as a master switch for all three.
  if(typeof globalThis!=='undefined' && (globalThis.__CAP_OFF || globalThis.__DELOAD_OFF)) return sections;
  if(!Array.isArray(sections)||!sections.length) return sections;
  const keep: Section[]=[]; let accessoryKept=false, circuitKept=false;
  // D91: the surviving accessory block is chosen by PATTERN, not by push order. The
  // builder pushes 'Leg superset A' (lunge + knee hold, a unilateral SQUAT pattern) before
  // 'Leg superset B' (the day's hinge/hip_ext), so first-come cost every deload leg day its
  // posterior chain by arithmetic. This pre-pass runs the loop's OWN four tests, in the
  // loop's own order, so an index can only be picked if the loop below would also have
  // reached its accessory branch — that is what guarantees exactly one block still survives.
  // MAIN/PRIMER/POWER/STRENGTH ARE SKIPPED AS CANDIDATES, AND A POSTERIOR MAIN SUPPRESSES
  // THE PRE-PASS ENTIRELY (V201, D94). Those are two different claims and both are load-bearing.
  // Skipped as candidates is D91: a posterior 'Main — Deadlift' must not WIN the arbitration,
  // because 14.10% of cards carry a posterior main and no posterior accessory, and a naive
  // all-sections pre-pass would leave those cards no accessory at all. But it must still be
  // SEEN, which is D94: on a deload PULL day the Main is a deadlift variant by construction,
  // so the day's hip extension is already on the card and is the heaviest thing on it. Scoring
  // an accessory block up for a stray conditioning 'Kettlebell swing' then deleted the day's
  // only vertical pull on 135/135 measured L-healthy cards. When __mainPost is true the loop
  // never runs, pickIdx stays -1, and the forEach below falls back to push order — exactly one
  // accessory block still survives, so the zero-posterior trap D91 closed stays closed.
  // SAME LENS (_isPostChain) ON BOTH SIDES, per the pool/post-filter rule: the test that makes
  // a block a candidate and the test that suppresses the pre-pass can never disagree.
  // Prehab is never a candidate (always kept by the loop); fluff is never a candidate
  // (always dropped). NOTHING IS REORDERED — keep.push order stays forEach order.
  let pickIdx=-1;
  const __mainPost=sections.some(s=>s&&/^main\b|^primer|^power\b|^strength\b/.test((s.label||'').toLowerCase())&&(s.items||[]).some(it=>it&&_isPostChain(it.name)));
  for(let i=0;i<sections.length&&!__mainPost;i++){
    const s=sections[i]; if(!s) continue;
    const L=(s.label||'').toLowerCase();
    if(/^main\b|^primer|^power\b|^strength\b/.test(L)) continue;               // main work: never a candidate
    if(s.hip||/hip|mobility|stretch/.test(L)) continue;                          // prehab: always kept anyway
    if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) continue;     // fluff: always dropped anyway
    if(!(s.items||[]).some(it=>it&&_pattern(it.name))) continue;                  // the loop's own hasLift test
    if((s.items||[]).some(it=>it&&_isPostChain(it.name))){ pickIdx=i; break; }    // first posterior accessory block wins
  }
  // D155 (V211): THE TIER PICKS ON A TIER B LONG-RUN DAY. _longRunTier is the predicate
  // d18LongRunDayPass reads, so both passes agree on which day this is. D91's posterior block is
  // exactly what tier B strips, which left the loaded full-body long day in a recovery week with
  // no lifting at all. Here the surviving accessory block is the first one the tier admits: no
  // item tier B drops (_D18_LEG_RX, or hinge/hip_ext by _pattern under D153) and no power or
  // explosive label or core header. The code tests _D18_LEG_RX alone: a hinge test here changed
  // 0 of 56,688 measured programs, so it was dead and went (coach). D153 strips any hinge after
  // this pick, and g211 proves the outcome. A posterior Main does not suppress this pick, because
  // tier B strips the Main's hinge too. Candidacy is D91's own four tests in the loop's order. If
  // no block is admitted, D91's pick stands. Every other day never enters this branch.
  if(_longRunTier(cardio)==='B'){
    const _tierAdmits: (s: Section) => boolean=s=>!/power|explosive/i.test(s.label||'')&&!/power|explosive/i.test(s.coreHeader||'')
      &&!(s.items||[]).some(it=>it&&_D18_LEG_RX.test(it.name||''));
    for(let i=0;i<sections.length;i++){
      const s=sections[i]; if(!s) continue;
      const L=(s.label||'').toLowerCase();
      if(/^main\b|^primer|^power\b|^strength\b/.test(L)) continue;
      if(s.hip||/hip|mobility|stretch/.test(L)) continue;
      if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) continue;
      if(!(s.items||[]).some(it=>it&&_pattern(it.name))) continue;
      if(_tierAdmits(s)){ pickIdx=i; break; }    // first block the tier admits wins
    }
  }
  sections.forEach((s,i)=>{
    if(!s) return;
    const L=(s.label||'').toLowerCase();
    if(/^main\b|^primer|^power\b|^strength\b/.test(L)){
      // Power sections on a deload keep the PATTERN, not the dose: explosive work at
      // ~60% of sets maintains CNS sharpness at near-zero fatigue cost (5×3 → 3×3).
      // Main/strength sets are held per the tactical deload doctrine — intensity is
      // already down via the wave transform.
      if(/^power\b/.test(L)){
        keep.push({...s, items:(s.items||[]).map(it=>{
          const m=(it.detail||'').match(/^(\d+)\s*[×x]/);
          if(!m) return it;
          const cut=Math.max(2, Math.round(parseInt(m[1],10)*0.6));
          return {...it, detail: cut + it.detail.slice(m[1].length)};
        })});
      } else keep.push(s);
      return;
    }   // main work stays
    if(s.hip||/hip|mobility|stretch/.test(L)){ keep.push(s); return; }            // prehab stays — injury-prevention backbone
    if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) return;       // fluff drops on a deload
    const hasLift=(s.items||[]).some(it=>it&&_pattern(it.name));
    // v0.249.0 (D254, Mario): the P-HIPEXT hip extension left the circuit for its own section and stays
    // with it here, as it did inside the round; the cap changed the setup, not the dose.
    if(/^glute — runner armor/.test(L)){ if(circuitKept) keep.push(s); return; }
    if(hasLift&&!accessoryKept&&(pickIdx<0||i===pickIdx)){ accessoryKept=true; circuitKept=/^leg circuit/.test(L); keep.push(s); return; }  // exactly ONE accessory block survives; D91 picks the posterior one when the card has one
    // additional accessory blocks and anything unclassified drop
  });
  return keep.length?keep:sections; // never empty a day — fallback guard for exotic builders (travel bodyweight tier)
}

// ── SESSION-TOTAL SET BUDGET (fourth guard) ─────────────────────────────────
// The three regional guards deliberately exempt pattern-null work (holds, carries,
// hip prehab, core) from FATIGUE scoring — correct per-region, but it left over half
// a real session invisible to every cap: the engine believed it wrote 10 sets while
// the athlete trained 22. This guard reads the WHOLE day. Budget units: stretches
// and mobility cost 0 (minutes, not fatigue); carries, holds, isometrics, activation
// and core cost 0.5×sets; everything else costs its set count. Cap is 20, squeezed
// further by shared-day cardio interference (same mechanism as the regional cap).
// Protected, never trimmed: main/power/strength/primer sections, hip prehab, core
// (Mario ruling), and barbell-tier compounds. Trim order: carries → optional/
// finisher/conditioning → pump/isolation → remaining accessories, latest first.
const SESSION_SET_BUDGET = 20;
function capSessionBudget(sections: Section[], cardio: SessionView | null | undefined): Section[]{
  // Test-only bypass, per-pass since V123. See recoveryDeload for why.
  if(typeof globalThis!=='undefined' && (globalThis.__CAP_OFF || globalThis.__BUDGET_OFF)) return sections;
  if(!Array.isArray(sections)||!sections.length) return sections;
  // D239: the hip block's mobility piece stays free; the Cossack shift and pigeon lift-offs are mobility pieces.
  const _isStretch: (n: string | null | undefined) => boolean=n=>/stretch|mobility|90\/90|foam|worlds greatest|cossack|pigeon/i.test(n||'');
  const _isHalf: (n: string | null | undefined) => boolean=n=>/carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises|sit-up|v-up|russian twist|farmer march|torso rotation/i.test(n||'');
  const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost: (it: Item) => number=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };
  const _total: (list: Section[]) => number=list=>list.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+_cost(it),0),0);
  const cap=Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(cardio)*2));
  if(_total(sections)<=cap) return sections;
  const out=sections.map(s=>({...s, items:((s&&s.items)||[]).map(it=>({...it}))}));
  // ── V193 (D50): THE TRUNK FLOOR IS A FLOOR ON THE DAY, NOT ON THE SECTION ────
  // D48 ruled one thing unconditionally: zero trunk is not a coachable prescription. It
  // was implemented one level too low — as a floor on the ITEMS INSIDE an optional core
  // section — so the budget could still delete the whole section out from under the floor
  // and land the day on zero. The sections that fall through it are the ones the builder
  // emits WITHOUT optional:true: the protect-tier 'Trunk — anti-rotation' /
  // 'Trunk — anti-extension' pair on the Rehab + Trunk day is ordinary rank-1 fodder, so
  // the budget empties it, splices it out, and prints a day named for trunk with no trunk
  // on it. Nothing about a shoulder restricts anti-rotation, a dead bug or a hollow hold,
  // and overlay doctrine pierces at DAY level to remove what the INJURY forbids, not what
  // the budget happens to reach next. D50 is not a new rule. It is D48 applied at the
  // level D48 was ruled at.
  //
  // THE FLOOR IS ONE ITEM ON THE DAY, counted across the `Trunk — *` family with the same
  // /^Trunk / taxonomy injectDynamicCore already uses to decide a day owns its own trunk
  // block. Two consequences fall straight out of counting ITEMS instead of SECTION LABELS:
  //   * Carve-out 1, trunk relocated. Fewer labelled trunk sections with trunk still
  //     present elsewhere on the card is not a defect and needs no special case. While two
  //     trunk sections live the count is 2 or more, nothing is protected, and the budget
  //     trims exactly as it did before. Only the last surviving ITEM is held, wherever it
  //     ended up sitting.
  //   * Carve-out 4, the floor is not raised. <=1 is the boundary between nonempty and
  //     empty, not a chosen number. One hard trunk piece is the target; the second item of
  //     a pair stays budget fodder, which is why the D51 thin-core share barely moves.
  const _isTrunkSec: (s: Section) => boolean=s=>/^Trunk /.test((s&&s.label)||'');
  const _trunkItems=()=>out.reduce((a,s)=>a+(_isTrunkSec(s)?((s&&s.items)||[]).length:0),0);
  // CARVE-OUT 2 — THE RUN IS THE DAY. d18LongRunDayPass owns a long-run day (tier A post
  // run mobility only, tier B upper and trunk capped at 8 sets, tier C carry ban). Tier B
  // keeps sections that still have items, so a floor that held a trunk section alive here
  // would hand tier B one more section to spend its eight sets on and rewrite a day the
  // run already decided. No long-run tier gets the floor. _longRunTier is the same
  // predicate that pass uses, so the two can never disagree about what a long run is.
  // CARVE-OUT 3 — RACE WEEK BELONGS TO D37/D38. raceEveLiftPass replaces day.sections
  // wholesale on the race day, the eve and two days out, and it runs after this pass, so
  // ordering already makes the window unreachable. Leaning on that alone is the latch
  // shape §10b bans (a claim that only holds while a LATER pass keeps cleaning up), so the
  // one day of that window this function can see from its own cardio is refused here by
  // name. A trunk floor does not outrank the race.
  const _trunkFloor = !_longRunTier(cardio)
    && !/race day|time trial/i.test((cardio&&cardio.subtype)||'');
  const _protected: (s: Section) => boolean=s=>{
    // V193 (D50): the day's LAST trunk item is not budget fodder. Tested before the D47
    // optional clause because the floor is a fact about the day, not about who owns the
    // section — an optional trunk block down to its last item is held for the same reason.
    if(_trunkFloor && _isTrunkSec(s) && _trunkItems()<=1) return true;
    // V193 (D47): an OPTIONAL section is never protected. injectDynamicCore pushes the core
    // finisher with optional:true and s.core:true, and s.core won here — so the budget paid
    // for a finisher the engine itself called optional by trimming the prehab rail, which
    // ships under labels like 'Chest + knee' that match no protection and rank 1. Measured on
    // the D44 artifact: 69/8160 home_basic day-builds lost an item, top losses Dumbbell
    // lateral raise -14, Spanish squat hold (KB) -9, Wall sit -7 — two knee prehab, three
    // cuff/scap. _secRank already ranks s.optional at 3 (trimmed first); this clause simply
    // lets it be reached. Nothing else moves: the budget value, the cost model, the barbell
    // tier-3 guard and every non-optional protection are untouched.
    // V193 (D48, amending D47): the bare optional test went too far and deleted 62 of 540
    // core sections. An optional section is unprotected only while it still has something
    // to give. Taking from a section with one item left is not trimming it, it is deleting
    // it, and deleting a training quality is the exact disease D47 was written to cure,
    // just relocated from prehab to trunk. length>1 is not a tunable: 1 is the boundary
    // between nonempty and empty, not a chosen constant. A floor expressed in SETS was
    // considered and rejected as a genuinely invented constant with no table behind it.
    // Thin core is an acceptable outcome: one hard trunk piece done properly on a tight
    // day is a coachable prescription. Zero trunk is not.
    // V193 (D50): "zero trunk is not" is enforced ABOVE this line now, on the day rather
    // than on the section, because this clause only ever reached sections carrying
    // optional:true and the builder's own trunk sections do not carry it.
    if(s && s.optional && ((s.items||[]).length>1)) return false;
    const L=((s&&s.label)||'').toLowerCase();
    return s.core||s.hip||/^main\b|^primer|^power\b|^strength\b/.test(L)||/hip|mobility|stretch/.test(L);
  };
  const _secRank: (s: Section) => number=s=>{
    if(_protected(s)) return -1;
    const L=((s&&s.label)||'').toLowerCase();
    if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) return 3;
    if(/superset b|isolation|calves|pump|accessory/.test(L)) return 2;
    return 1;
  };
  const _itemRank: (n: string | null | undefined) => number=n=>/carry/i.test(n||'')?2:(/wall sit|\bhold\b/i.test(n||'')?1:0);
  // ── V198 (D85): THE BUDGET MAY NOT SPEND THE DAY'S LAST POSTERIOR CHAIN ITEM ────
  // Same shape as D50's trunk floor, same boundary, different training quality. The
  // three regional guards and the lowback/protect pool override do their work correctly
  // and hand this function a card that loads the posterior chain; the budget then trims
  // the last hinge or hip_ext off it and prints a leg day that never extends a hip.
  // An earlier diagnosis blamed applyInjuryFilter and was RETRACTED: at lowback/protect
  // hinge is dropped and hip_ext is CAPPED, and the pool override deliberately refills
  // the rail with the spine-safe names. The filter is correct. The budget was eating it.
  //
  // UNCONDITIONAL, by ruling. Not scoped to cfg.injury, not to a region, not to an
  // equipment tier — scoping it would encode "the budget may spend a HEALTHY athlete's
  // last posterior item", which is exactly the encoding D84 refused when it declined to
  // scope the Calves reorder to knee/protect. Measured healthy + shoulder cost: 226
  // zero-posterior weeks.
  //
  // THE SET IS {hinge, hip_ext} AND NOTHING ELSE. Both are _PATTERN_REGION 'legs'.
  // _pattern already routes hip thrust / glute bridge / glute-ham / GHR / nordic / back
  // extension / hyperextension / reverse hyper / pull-through to hip_ext, which covers
  // every name the budget was deleting. leg_iso is DELIBERATELY EXCLUDED: EXLIB
  // .leg_accessory holds 'Leg extension' and 'Leg press' alongside 'Lying leg curl', so
  // leg_iso is not a posterior signal — counting it would call a pure quad movement
  // posterior chain. _pattern is called directly so this guard and the region caps can
  // never disagree about what a hinge is.
  //
  // <=1 IS NOT A TUNING CONSTANT. It is the boundary between nonempty and empty, the
  // same boundary D50 used. One hinge done properly on a tight day is a coachable
  // prescription; zero is not. The second item of a pair stays budget fodder.
  //
  // COUNTED LIVE. The count is taken on `out` at the top of each trim iteration, never
  // precomputed before the loop: the loop mutates `out`, and a stale count would let the
  // last item through on a later pass.
  //
  // NOTHING IS EVER ADDED. The floor only refuses to REMOVE something already on the
  // card, so it cannot resurrect anything applyInjuryFilter dropped — which is precisely
  // why it is safe to run after the refilter.
  //
  // THE DAY MAY END OVER CAP, by ruling. When every remaining candidate is ineligible
  // (the last hinge/hip_ext plus the tier-3 barbell skip) a skipped candidate simply
  // never becomes `best`, and `if(!best) break` below exits with the day over cap rather
  // than spinning. guard++<16 is the backstop, not the mechanism. §10b already records
  // that this cap has never been hard, and 63 of the affected cells were over cap before
  // this change. Follow-ons, not this build: D88 (draw-side zero-posterior weeks) and
  // D89 (re-sourcing the tier-3 skip).
  const _isPost=_isPostChain;                            // D91: hoisted above recoveryDeload — ONE writer for the lens
  const _postItems=()=>out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPost(it&&it.name)?1:0),0),0);
  let guard=0;
  while(_total(out)>cap && guard++<16){
    const _postLeft=_postItems();                          // live, re-read every iteration
    let best=null as { si: number; ii: number; score: number; pos: number } | null;
    out.forEach((s,si)=>{
      const sr=_secRank(s); if(sr<0) return;
      (s.items||[]).forEach((it,ii)=>{
        if(_cost(it)<=0) return;
        if(_compoundTier(it.name)===3) return;            // barbell compounds are never budget fodder
        if(_postLeft<=1 && _isPost(it.name)) return;       // V198 (D85): the day's LAST hinge/hip_ext is not budget fodder
        const score=(/^glute — runner armor/i.test((s&&s.label)||'')?3:sr)*10+_itemRank(it.name);   // D254: the P-HIPEXT section goes first
        const pos=si*100+ii;
        if(!best || score>best.score || (score===best.score && pos>best.pos)) best={si,ii,score,pos};
      });
    });
    if(!best) break;                                       // only protected work left → leave the day
    const sec=out[best.si];
    sec.items.splice(best.ii,1);
    if(!sec.items.length) out.splice(best.si,1);
    else if(sec.items.length===1) sec.superset=false;
  }
  return out;
}

function capRegionalFatigue(sections: Section[], role: string, cardio: SessionView | null | undefined, goal: string): Section[]{
  // Test-only bypass, per-pass since V123. __REGIONAL_OFF isolates THIS pass; __CAP_OFF
  // remains the master switch that disables recoveryDeload and capSessionBudget too.
  // Never set in production. Use the specific flag when measuring this function alone —
  // the shared flag is what made the V123 footprint measurement wrong.
  if(typeof globalThis!=='undefined' && (globalThis.__CAP_OFF || globalThis.__REGIONAL_OFF)) return sections;
  // HYPERTROPHY is opt-in volume: denseHypertrophy deliberately stacks press/leg sets to hit
  // 12–15 sets/muscle/week — that IS the goal the user picked, not an overscheduling accident.
  // Exempt it entirely (Mario ruling). Every other goal is capped normally.
  if(goal==='hypertrophy') return sections;
  if(!Array.isArray(sections)||!sections.length) return sections;
  // Deep-ish copy so we never mutate buildSections' output.
  const out = sections.map(s=>({...s, items:(s.items||[]).map(it=>({...it}))}));
  // Flatten to a working item list with region + pattern + protected-rank, skipping
  // the main lift (rank 0) and core/grip/cardio (never trimmed).
  // RANK IS PER ITEM, NOT PER SECTION (V124). A section label describes its FIRST movement;
  // anything bundled after it is an accessory that happens to share the heading. The
  // hypertrophy light-press branch pushes {label:'Main — '+lightPress, items:[press, delt]},
  // so a `Dumbbell lateral raise` sat under a `Main` label and inherited main-lift immunity
  // from the trim — measured at 320 occurrences across the tier sweep, a delt isolation
  // movement that could never be cut no matter how saturated the day was.
  // Only itemIdx 0 of a Rank 0 section is the main lift. Later items fall to Rank 2, the
  // same rank an accessory block would have carried had it been labelled honestly.
  // Ranks 1-3 are unaffected: those sections are already trimmable at every index, so
  // reading the index there would change nothing.
  const rank=(label: string, itemIdx: number)=>{
    const L=(label||'').toLowerCase();
    if(/^main|^primer|^power\b|^strength\b/.test(L)) return (itemIdx>0) ? 2 : 0;  // protect the main lift ONLY
    if(/secondary compound|conditioning|delts|chest volume|pull superset a|leg superset a/.test(L)) return 1;
    if(/^glute — runner armor/.test(L)) return 3;   // D254: the P-HIPEXT hip extension, out of the circuit, still goes first
    if(/^leg circuit/.test(L)) return 2;
    if(/superset b|biceps|triceps|leg isolation|calves|accessory|pump|chest \+ knee/.test(L)) return 2;
    if(/finisher|optional|explosive/.test(L)) return 3;
    return 2;
  };
  // Cardio interference for THIS day, computed once (identical across every re-score pass).
  const _interf = _cardioInterference(cardio);
  // Cardio-amplified working-set ceiling: a hard/long shared-day session pulls the day's
  // set cap DOWN — legs take the full cut, press/pull only the systemic half (a run does
  // not pound the bench pattern). This is what makes the trim "aggressive when cardio is
  // present": the same lifting day that passes dry gets trimmed when a run is stacked on it.
  const _legCut = Math.round(_interf * 3);
  const _uppCut = Math.round(_interf * 1.5);
  const _capFor: (r: string) => number = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));
  const _moveCapFor: (r: string) => number = r => _moveCap(r) + ((role==='legs' && r==='legs' && out.some(s=>/^glute — runner armor/i.test((s&&s.label)||'')&&((s&&s.items)||[]).length>0)) ? 1 : 0);   // D254

  // 1) Score each REGION two ways in a single pass:
  //    • regionScore — PATTERN SATURATION. Distinct patterns are cheap; the 2nd+ movement
  //      of the SAME pattern escalates (separates a clean squat+hinge+lunge+calf leg day
  //      from a stacked bench+DB+incline+decline press day).
  //    • regionSets — RAW working-set tally, blind to pattern distinctness. This is the
  //      number the hard cap reads, and the only one that catches five DISTINCT leg
  //      movements piling real sets onto the legs.
  function scoreRegions(sectionList: Section[]): { regionScore: Record<string, number>; regionSets: Record<string, number>; regionMoves: Record<string, number> }{
    const patternCount: Record<string, number>={};   // pattern -> how many movements of it seen so far
    const regionScore: Record<string, number>={};    // pattern-saturation fatigue score per region
    const regionSets: Record<string, number>={};     // raw working-set count per region
    const regionMoves: Record<string, number>={};    // distinct loaded-movement count per region (sprawl axis)
    sectionList.forEach(s=>{
      const baseRegion=_sectionRegion(s.label, role);
      (s.items||[]).forEach(it=>{
        const region=_itemRegion(it.name)||baseRegion;
        const pat=_pattern(it.name);
        if(!region||!pat) return; // holds/core/hip-mobility/unknown accrue nothing — never counted, never trimmed
        const sets=_setCount(it.detail);
        regionSets[region]=(regionSets[region]||0)+sets;               // raw accumulation (set-cap axis)
        regionMoves[region]=(regionMoves[region]||0)+1;                // one distinct movement (move-cap axis)
        const occ=(patternCount[pat]=(patternCount[pat]||0)+1);        // same-pattern occurrence
        const satMult=1+0.6*(occ-1);                                   // occ1 ×1, occ2 ×1.6, occ3 ×2.2 ...
        regionScore[region]=(regionScore[region]||0)+sets*satMult*0.7;
      });
    });
    // Dynamic shared-day cardio interference (was a flat +3 for any run). Legs take the
    // full hit; press/pull are systemic-only (half). Bike/swim now contribute too, scaled
    // by their far lower leg impact via _cardioInterference.
    if(_interf > 0){
      if(regionScore.legs) regionScore.legs += _interf * 3.2;
      ['push','pull'].forEach(r=>{ if(regionScore[r]) regionScore[r] += _interf * 1.6; });
    }
    return { regionScore, regionSets, regionMoves };
  }
  // 2) Trim: a region is OVER if it breaks EITHER guard — the pattern-saturation ceiling
  // OR the hard (cardio-adjusted) working-set cap. The set cap is the guard that finally
  // catches distinct-pattern bloat the saturation score is blind to. On each pass we hit
  // the worst offender and delete ONE item, FLUFF FIRST: Rank 3 (finishers/optional) →
  // Rank 2 (isolation/pump) → and only then Rank 1 (secondary compounds). Rank 0 (main /
  // power / strength) and the protected heaviest compound are NEVER touched. Re-score
  // after each removal so the same trim fires deterministically every week of the block.
  let guard=0;
  while(guard++<24){
    const { regionScore, regionSets, regionMoves } = scoreRegions(out);
    // How far past its guards a region sits (each axis normalised so they compete fairly
    // when picking which region to trim first). Trigger is the OR below: pattern-saturation
    // ceiling, hard (cardio-adjusted) set cap, OR the distinct-movement cap.
    const overAmt: (r: string) => number=r=>Math.max(
      (regionScore[r]||0)-_ceil(r),
      ((regionSets[r]||0)-_capFor(r))*1.5,
      ((regionMoves[r]||0)-_moveCapFor(r))*4
    );
    const over=['push','pull','legs']
      .filter(r=>(regionScore[r]||0)>_ceil(r) || (regionSets[r]||0)>_capFor(r) || (regionMoves[r]||0)>_moveCapFor(r))
      .sort((a,b)=>overAmt(b)-overAmt(a));
    if(!over.length) break;
    const region=over[0];
    // Protected compound: highest-tier compound in the region (barbell > dumbbell/machine >
    // bodyweight), earliest position on ties. Never eligible to trim, even if it landed in a
    // "Secondary compound" rather than a "Main —" section.
    let protTier=0, protKey=null as number | null;
    out.forEach((s,si)=>{
      const baseRegion=_sectionRegion(s.label, role);
      (s.items||[]).forEach((it,ii)=>{
        const r=_itemRegion(it.name)||baseRegion;
        if(r!==region) return;
        const t=_compoundTier(it.name);
        if(t>protTier){ protTier=t; protKey=si*100+ii; }
      });
    });
    // In-region pattern occurrence counts, so within a rank we can still drop the most
    // REDUNDANT movement first (kills stacked presses before it touches leg variety).
    const patCount: Record<string, number>={};
    out.forEach((s,si)=>{
      const baseRegion=_sectionRegion(s.label, role);
      (s.items||[]).forEach(it=>{
        const r=_itemRegion(it.name)||baseRegion;
        const pat=_pattern(it.name);
        if(r===region && pat) patCount[pat]=(patCount[pat]||0)+1;
      });
    });
    const _postLeft=out.reduce((a,s)=>a+((s&&s.items)||[]).reduce((b,it)=>b+(_isPostChain(it&&it.name)?1:0),0),0);
    // Every trimmable item in the region: rank>0, has a pattern, not the protected compound.
    const cands: { si: number; ii: number; rk: number; sat: number; pos: number }[]=[];
    out.forEach((s,si)=>{
      const baseRegion=_sectionRegion(s.label, role);
      (s.items||[]).forEach((it,ii)=>{
        const rk=rank(s.label, ii);              // per ITEM since V124 — see rank()
        const r=_itemRegion(it.name)||baseRegion;
        const pat=_pattern(it.name);
        if(r!==region || !pat || rk===0) return; // off-region / holds / the main lift itself
        if(si*100+ii===protKey) return;          // the protected heaviest compound
        if(role==='legs' && _postLeft<=1 && _isPostChain(it.name)) return;   // cf170: the day's LAST hinge/hip_ext is not regional fodder (cf170b: legs role only)
        cands.push({si,ii,rk,sat:patCount[pat]||1,pos:si*100+ii});
      });
    });
    if(!cands.length) break; // nothing left but Rank 0 / the protected compound → leave the day
    // AGGRESSIVE FLUFF-FIRST ORDER (Mario ruling): highest rank first (3→2→1); within a
    // rank, most-saturated pattern first; then latest document position for determinism.
    cands.sort((a,b)=> (b.rk-a.rk) || (b.sat-a.sat) || (b.pos-a.pos) );
    const cand=cands[0];
    const sec=out[cand.si];
    sec.items.splice(cand.ii,1);
    if(sec.items.length===0) out.splice(cand.si,1);
    else if(sec.items.length===1) sec.superset=false;
  }
  return out;
}

// ── ENGINE D — SYNCHRONIZATION & SYNTHESIS (final gatekeeper) ───────────────
// Compiles A/B/plan/C into the week grid: lifting sections + cardio per day,
// then deconflicted dynamic-core finishers. Reads everything, mutates nothing
// upstream. Emits the final program object written to state.
function engineD_synthesis(cfg: EngineCfg, A: EngineA, B: EngineB, plan: CalendarPlan, C: EngineC): Program{
  const { id, seed, goal, allDaysList, trainDays, totalWeeks,
          cardioTypes, cardioGoals, isRecoveryWeek } = A;
  const { cardioSchedule, includeHip, inTaper } = B;
  const { dayRoles, legRecoveryNote } = plan;
  const { buildSections, gearOK } = C;
  const includeCore=true;
  const weeks: Weeks={};
  for(let w=1;w<=totalWeeks;w++){
    weeks[w]={} as Week;
    // Lifting keys off the TRUE program week (not a cycled 1-6 index) so the wave
    // tiles across the full program, exercise rotation keeps advancing, and the
    // deload cadence + "↓ Recovery Week" badge stay in sync with the actual load.
    // Two full-body days in a week are alternated upper/lower so they never render identically.
    let fullSeen=0;
    const fullTotal=allDaysList.filter(d=>!cfg.restDays.includes(d)&&(dayRoles[d]||'full')==='full').length;
    // Exactly ONE loaded carry per week. A heavy carry after squats is its natural home, so it
    // rides the legs day; if a split has no legs day (the 1-day full-only split) a full day hosts
    // it instead. Picking the host here means it can never double up across two full days.
    const _liftDays=allDaysList.filter(d=>!cfg.restDays.includes(d));
    const carryHost=_liftDays.find(d=>(dayRoles[d]||'full')==='legs')
                  ||_liftDays.find(d=>(dayRoles[d]||'full')==='full')||null;
    allDaysList.forEach(d=>{
      // V188 (D14a): in race week the race weekday trains even if it is a rest day, and
      // the train days after the race rest. D34 then strips race day to its primer.
      const _pin=cfg._racePin;
      const _isRest = (_pin && w===_pin.w)
        ? (d===_pin.race ? false : (cfg.restDays.includes(d) || _pin.rest.includes(d)))
        : cfg.restDays.includes(d);
      if(_isRest){weeks[w][d]={title:'Rest',dot:'rest',tags:['rest'],rest:true};return;}
      const role=dayRoles[d]||'full';
      let fullVariant='upper';
      if(role==='full'){ fullVariant=(fullSeen%2===0)?'upper':'lower'; fullSeen++; }
      const cardio=cardioSchedule[w]?.[d] as Cardio||null;
      const roleLabels: Record<string, string>={push:'Push',pull:'Pull',legs:'Legs',push_light:'Push (light)',full:'Full Body',active:'Active Recovery'};
      const isEndurance=goal==='endurance';
      const roleLabelMap: Record<string, string>=isEndurance?{push:'Strength Support',pull:'Posterior Chain',legs:'Leg Strength + Mobility',push_light:'Recovery Lift',full:'Full Body Support',active:'Active Recovery'}:{push:'Push',pull:'Pull',legs:'Legs',push_light:'Push (light)',full:'Full Body',active:'Active Recovery'};
      const tags: DayTag[]=['lift'];
      if(cardio)tags.push(cardio.type);
      if(role==='legs'&&includeHip)tags.push('hip');
      // V139 (Tier-3 Q6 signed, Mario's amendment): Test Week / Peak Week ride the TAG
      // system, not title punctuation. Comp-lift days only, final week of short blocks.
      // Strength gets the rep-max protocol + e1RM calculator; hypertrophy gets framing
      // only, because the V137 AMRAP line already IS its test.
      const _twTag = totalWeeks<=6 && w===totalWeeks && !inTaper(w) && !isRecoveryWeek(w)
        && (role==='push'||role==='pull'||role==='legs');
      if(_twTag && goal==='strength') tags.push('test');
      if(_twTag && goal==='hypertrophy') tags.push('peak');
      let title=roleLabelMap[role]||'Workout';
      if(role==='full'&&fullTotal>1)title+=(fullVariant==='lower'?' — Lower':' — Upper');
      // Injury protect tier renames the repurposed day so the athlete reads intent,
      // not a gutted card ("Posterior Chain", not a thin "Legs").
      const _injTitle=injuryDayTitle(role,cfg); if(_injTitle) title=_injTitle;
      // Injury filter runs BEFORE capRegionalFatigue so the repurposed day is still
      // governed by the same load manager as a healthy one.
      // V153 (F2): tomorrow's cardio decides the hinge clamp. Saturday reads next week's
      // Sunday; the final Saturday reads nothing and stays unclamped (post-block, no run).
      const _di=_ISO_ORDER.indexOf(d);
      const _nw=_di===_ISO_ORDER.length-1?w+1:w, _ndk=_ISO_ORDER[(_di+1)%7];
      const _nc=cardioSchedule[_nw]?.[_ndk]||null;
      const hotNext=!!(_nc&&_nc.legLoad);
      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s,cardio):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};
      if(_twTag && goal==='strength'){
        weeks[w][d].testLift = role==='push'?'bench':role==='legs'?'squat':'deadlift';
        weeks[w][d].note='This is what the block built toward. Test it, log it, and the next block anchors off the number you hit.';
      }
      if(_twTag && goal==='hypertrophy'){
        weeks[w][d].note='Peak week. The AMRAP number is the yardstick. Log it. Next block has to beat it.';
      }
    });
    // Dynamic core: 2 deconflicted finishers/week, placed with look-ahead to tomorrow.
    // Taper weeks strip to the big-3 primer — no core finishers.
    // Recovery weeks skip core finishers too — the deload ruling is main + one
    // accessory + hip prehab, nothing else. Taper already strips to the primer.
    if(includeCore && !inTaper(w) && !isRecoveryWeek(w)) injectDynamicCore(weeks[w], dayRoles, trainDays, w, cfg.equipment||'home_full');
    // Dynamic core lands AFTER the per-day injury filter, so injured programs get one
    // more pass over the finished week — spine-safe swaps and drops apply to injected
    // finishers too. applyInjuryFilter is idempotent (RPE-note append is guarded), so
    // re-filtering already-filtered sections changes nothing.
    if(cfg.injury) Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d as DayKey]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); });
    // FINAL SESSION-BUDGET PASS — runs after hip/core injection and the injury
    // refilter so it sees the WHOLE day, including work the regional guards
    // deliberately exempt from fatigue scoring (holds, carries, core, activation).
    // Recovery weeks arrive already slimmed by recoveryDeload and pass untouched.
    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d as DayKey]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });
    // ── PERMANENT SWAP PREFERENCES ─────────────────────────────────────────
    // Accepted from the coach nudge after the athlete has traded the same lift off
    // three sessions running. Lives in cfg, NOT in a patch store, which is the whole
    // reason it needs no re-application pass: refreshProgram rebuilds from cfg on
    // every boot, so a preference here simply regenerates forever, the same way an
    // injury or an equipment tier does.
    //
    // Runs AFTER capSessionBudget so the substitution inherits a settled day, and the
    // injury filter re-runs on anything it touched — a preference set in January must
    // not walk a barbell hinge back into a program that stripped hinges for a bad back.
    if(cfg.exSwapPrefs && Object.keys(cfg.exSwapPrefs).length){
      Object.keys(weeks[w]).forEach(_d=>{
        const _day=weeks[w][_d as DayKey]; if(!_day||!Array.isArray(_day.sections)) return;
        if(applySwapPrefs(_day.sections,cfg.exSwapPrefs) && cfg.injury){
          _day.sections=applyInjuryFilter(_day.sections,cfg);
        }
      });
    }
  }
  const liftRecoveryWeeks: number[]=[];
  for(let _w=1;_w<=totalWeeks;_w++){ if(isRecoveryWeek(_w)) liftRecoveryWeeks.push(_w); }
  const taperWeeks: number[]=[];
  for(let _w=1;_w<=totalWeeks;_w++){ if(inTaper(_w)) taperWeeks.push(_w); }
  // SAME-EXERCISE ADJACENT-DAY SPACING (V117) — runs after every subsystem that can add
  // or substitute a movement (core injection, injury refilter, session budget, swap prefs)
  // so it sees the settled block, and BEFORE bodyweightSweep so its substitutions are swept
  // by the same gear catch-all as everything else.
  { const _isBW=cfg.equipment==='bodyweight'; const _u=_swapUniverseList().filter(n=>gearOK(n)&&!(_isBW&&(_BW_SUBS[n]||_BW_GEAR.test(n)))); _swapUniverseReset(); _swapUniverseAdd(_u); }
  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);
  // Final catch-all for the "Room only" tier — see bodyweightSweep. Runs AFTER core/hip
  // injection so it catches gear arriving from those subsystems too.
  if(cfg.equipment==='bodyweight'){ bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');
    if(cfg.injury) Object.keys(weeks).forEach(_w=>Object.keys(weeks[_w]||{}).forEach(_d=>{ const _day=weeks[_w][_d as DayKey]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); })); }
  // LAST. Must run after every pass that can change a NAME — bodyweightSweep substitutes
  // gear names, the injury filter swaps movements, the deconflicts move them between days.
  // The predicate is name-derived, so sweeping earlier would judge a movement that is not
  // the one the athlete ends up seeing.
  else { unloadableRxSweep(weeks, cfg); accessoryGrammarSweep(weeks, cfg); }
  // V153 (F2): after every detail writer on BOTH tiers, so the clamp judges final text.
  hotNextHingeClampSweep(weeks);
  // V154 (D2): last, so it judges the grammar's final accessory forms on both tiers.
  preventionDoseSweep(weeks, cfg);
  // V175 (D28): LAST. Every pass above can remove a superset member; this is the one
  // that notices the section is no longer a superset.
  d18LongRunDayPass(weeks);   // V176 (D18): before the sweep, so demotions it causes are swept
  raceEveLiftPass(weeks, totalWeeks);   // V189 (D38): no lifting from two days out through the race
  d189DefaultAnchorNote(weeks, {...cfg, cardioTypes, cardioGoals});   // V226 (D189 S1): after every note writer; a throwaway spread, cfg untouched
  singletonSupersetSweep(weeks);
  delete cfg._racePin;   // V188 (D14a): derived at build time, never stored — refreshProgram recomputes it
  // V208 (coach): a program with no lifting day prints no lift-placement note, on every arm. Read after
  // the last pass that can strip a section; a lifting day is the week strip's (dayCode): a non-rest day
  // with a section that has items and is neither core nor hip.
  const _liftDay = Object.keys(weeks).some(w => _ISO_ORDER.some(d => { const x = weeks[w] && weeks[w][d];
    return !!x && !x.rest && (x.sections||[]).some(s => !s.core && !s.hip && (s.items||[]).length); }));
  return {id,name:cfg.name||'My Program',goal,liftingFocus:cfg.liftingFocus,primaryPath:cfg.primaryPath,raceDate:cfg.raceDate||null,raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote:_liftDay ? legRecoveryNote : null,liftRecoveryWeeks,taperWeeks,seed,cfg:{...cfg,cardioTypes,cardioGoals,goal,seed},weeks,totalWeeks,created:Date.now(),startDate:null,_swapUniverse:_swapUniverseList(),_swapUniverseByKey:{}};
}

// ── SINGLETON SUPERSET SWEEP (V175, D28) ─────────────────────────────────────
// A superset section is written as a pair and rendered as rounds ("3 Rounds — no rest
// between exercises"). Downstream passes remove members one at a time — bodyweightSweep's
// within-day dedupe (the no-load pull family is one movement laddered, so a barbell row
// and a KB row both collapse onto an inverted row), applyInjuryFilter's drops (a knee
// plan takes the plyo out of "Explosive finisher", shoulder-protect takes the push out
// of "Strength"), capSessionBudget — and every one of them removed the ITEM and left the
// FLAG. The renderer's V162 demotion fires only for a member the athlete skipped
// (items.length > 1), so a section that ARRIVED with one member drew a rounds header
// over a single row: the "incomplete superset" reported from device. Measured over
// 14,112 builds: zero on any healthy loaded tier, ~6 per program on bodyweight, every
// injury variant on every tier. A superset of one is straight sets. Nothing is refilled
// (the pool collapsing is why it is a singleton) and orphans are not paired with each
// other (that invents a pairing the engine never chose). Mutates the section in place:
// section objects are per-build (V137 found only ITEM objects shared by reference, and
// this sweep never touches items), so there is nothing to clone — a clone-on-write
// here was written, found untrippable by the sabotage sweep, and removed as dead by
// construction (the V174 E10 rule). Runs LAST so it judges the settled day on every tier.
// ── V176 (D18, D33, D34): THE RUN IS THE DAY — tiered by time on feet ─────────
// "After 6, maybe even 8 miles that's the whole workout — just stretch and call it
// a day." Keyed off the session's own dose (`mins`, or
// `mi × chartRow.recovery`), so the tier scales with the athlete — 6 mi is 80 min
// on a 13:20 row and 60 on a 7:30. NRC long runs are found by subtype (D33). From V209
// (D140) the NSW long run is tiered too, found by its dose.key 'long' (lsd_long and
// run_base's budgeted long easy run); a test day is keyed 'trial' and never enters.
// ≥75 → A: no lift, post-run mobility only (75 is the number the long-run fuel note
// already uses — one doctrine line). 45–75 → B: upper and trunk, ≤8 sets, no power,
// no hinge. <45 → C: the current interference model (with D8). No heavy carries on
// ANY long-run day regardless of length. Race day is left to raceEveLiftPass (V189, D38
// overturned D34's primer); the dress rehearsal is tier A on every row (D34) — you don't
// lift after simulating the race.
function _longRunTier(cardio: SessionView | null | undefined): 'A' | 'B' | 'C' | null{
  if(!cardio || !cardio.dose) return null;
  if(cardio.isNRC){
    if(!/^long run/i.test(cardio.subtype||'')) return null;
    if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
    if(/rehearsal/i.test(cardio.detail||'')) return 'A';
  } else if(cardio.type!=='run' || cardio.dose.key!=='long') return null;   // D140 (V209): the NSW long run, by its key
  const d = cardio.dose;
  const m = d.k==='time' ? (+d.mins!||0) : (+d.mi!||0) * (+d.tgt!||0) / 60;
  if(!m) return null;
  return m>=75 ? 'A' : m>=45 ? 'B' : 'C';
}
// Tier A block, verbatim from the ruling: calves, hip flexors, 90/90, T-spine, foam
// roll — ~12 minutes, logged complete/skip like any other item.
function _d18MobilityBlock(): Section{
  return {label:'Post-run mobility', items:[
    {name:'Standing calf stretch', detail:'2×45 sec each side — knee straight, then bent'},
    {name:'Couch stretch', detail:'2×45 sec each side — hip flexors; squeeze the trailing glute'},
    {name:'Hip 90/90 stretch', detail:'2×45 sec each side'},
    {name:'T-spine mobility', detail:'2×45 sec — thread the needle, reach long'},
    {name:'Foam roll', detail:'~3 min — calves, quads, glutes; slow passes'}
  ]};
}
// Hinge / legs / plyo vocabulary. Belt to the section-level drops: catches a hinge
// riding a label the section rule keeps (a full day's "Main — Deadlift").
const _D18_LEG_RX=/swing|clean|snatch|deadlift|romanian|\brdl\b|good morning|hip thrust|hip extension|glute bridge|squat|lunge|step-?up|\bleg\b|calf|calves|glute|nordic|broad jump|box jump|jump|bound|skater|wall ball|sled|pistol/i;
// V226 (D189 S1): a program anchored on the experience default says so once, on the first paced
// run of week 1, appended after the app-owned note (the V171 text stays an exact prefix). Self-
// expiring: kind 'default' only, so a pencil edit rebuilds the future weeks and the sentence is gone.
function d189DefaultAnchorNote(weeks: WeekGrid, cfg: Cfg): void{
  const a = runAnchorInfo(cfg); if(!a || a.kind !== 'default') return;
  const w1 = weeks['1'] || weeks[1]; if(!w1) return;
  for(const d of _ISO_ORDER){ const day = w1[d]; if(!day || day.rest) continue;
    for(const c of [].concat(day.cardio||[])){ if(!c || c.type!=='run') continue;
      if(/RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype||'') || (c.dose && c.dose.key==='bench')) continue;
      if(!/\d:\d\d\/mi/.test(c.detail||'')) continue;
      const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';
      c.note = (c.note ? c.note+' ' : '') + 'Paces here start from '+art+' '+m+' mile, the '+a.exp+' default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';
      return; } }
}
function d18LongRunDayPass(weeks: WeekGrid): void{
  Object.keys(weeks).forEach(w=>{
    const wk=weeks[w]; if(!wk) return;
    Object.keys(wk).forEach(dk=>{
      const day=wk[dk]; if(!day||!day.cardio||!Array.isArray(day.sections)) return;
      const t=_longRunTier(day.cardio); if(!t) return;
      // No heavy carries on ANY long-run day, regardless of length. D140 (V209): the ban reads
      // the ITEM, because a carry rides sections whose label never says so (the core section
      // is label '' with coreHeader 'Core — …'). Farmer, Suitcase and Overhead carry are the
      // three threads, and every carry the engine names says carry. The label and coreHeader
      // tests stay as belt. A section the ban empties drops; an untouched one is kept as is.
      const _isCarry: (it: Item) => boolean=it=>/carry/i.test((it&&it.name)||'');
      let secs: Section[]=[];
      day.sections.forEach(sec=>{
        if(/carry/i.test(sec.label||'')||/carry/i.test(sec.coreHeader||'')) return;
        const its=sec.items||[], kept=its.filter(it=>!_isCarry(it));
        if(its.length&&!kept.length) return;
        secs.push(kept.length===its.length?sec:{...sec, items:kept});
      });
      if(t==='A'){
        // The run was the workout. Informational taper notes survive; lifting does not.
        const keep=secs.filter(sec=>/taper/i.test(sec.label||''));
        day.sections=[_d18MobilityBlock()].concat(keep);
        day.title='Post-Run Mobility';
        return;
      }
      if(t==='B'){
        secs=secs.filter(sec=>!/power|explosive/i.test(sec.label||''));   // D140 (V209) F1: an explosive finisher is power work
        // D140 (V209, coach): "no power" reaches the core header too. A core section is label ''
        // with its pillar in coreHeader; a Rotational Power pillar goes whole and is not refilled
        // (a power header over a plank is the incomplete-superset shape). Other pillars stay.
        secs=secs.filter(sec=>!/power|explosive/i.test(sec.coreHeader||''));
        // D153 (V211): tier B bans the pattern, not the load. An item _pattern() calls hinge or hip_ext
        // goes (Cable pull-through, Bodyweight back extension), the same lens the deload and the caps
        // read. _D18_LEG_RX stays the belt for squat, lunge, calf and jump. Every refill runs before
        // this pass, so a refilled item answers to this filter and to the 8-set budget below.
        secs=secs.map(sec=>({...sec, items:(sec.items||[]).filter(it=>!_D18_LEG_RX.test(it.name||'')&&!/^(hinge|hip_ext)$/.test(_pattern(it.name||'')||''))}));
        // ≤8 working sets: keep in document order (mains first), stretches are free.
        // D140 (V209) F2: "3 sets — RPE 7" is three sets. The counter used to read only the N× form
        // and counted every "N sets" prescription as one, so a tier B day could keep 12.
        const _n: (det: string | null | undefined) => number=det=>{let m=/^(\d+)\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\b(\d+)\s*sets?\b/i.exec(det||'');return m?+m[1]:1;};
        const _isStr: (nm: string | null | undefined) => boolean=nm=>/stretch|mobility|90\/90|foam|worlds greatest/i.test(nm||'');
        let budget=8;
        secs.forEach(sec=>{ sec.items=(sec.items||[]).filter(it=>{ if(_isStr(it.name)) return true; const c=_n(it.detail); if(budget-c<0) return false; budget-=c; return true; }); });
        day.sections=secs.filter(sec=>(sec.items||[]).length||/taper/i.test(sec.label||''));
      }
      else day.sections=secs;   // tier C: carry ban only; the interference model owns the rest
    });
  });
}
// ── V189 (D38): NO LIFTING FROM TWO DAYS OUT THROUGH THE RACE ─────────────────────
// D34 kept the taper primer on race day; V188 then put a trap bar primer on the day before
// the shakeout and pushups on race morning. Overturned (Mario, concur): the race and the two
// days before it carry no lifting at all. Found BY SUBTYPE like the pin, over the last two
// weeks flattened Monday to Sunday so a race early in its week reaches back into the taper
// week. The 5K/10K time trial is the race for every reader (V186 S4b) and takes the same
// pass. A lift-only train day inside the window becomes a rest day; a run day keeps its run,
// loses its lifting, and is titled for what it is.
function raceEveLiftPass(weeks: WeekGrid, totalWeeks: number): void{
  const flat: { w: number; d: string }[] = [];
  [totalWeeks-1, totalWeeks].forEach(w => { if(weeks[w]) _ISO_ORDER.forEach(d => flat.push({w,d})); });
  const ri = flat.findIndex(x => { const day = weeks[x.w][x.d]; return !!(day && day.cardio && /RACE DAY|TIME TRIAL/i.test(day.cardio.subtype||'')); });
  if(ri < 0) return;
  // The shakeout is the last run before the race, wherever the rest days put it.
  let lr = -1; for(let i=ri-1; i>=ri-2 && i>=0; i--){ const d=weeks[flat[i].w][flat[i].d]; if(d && d.cardio && !d.rest){ lr=i; break; } }
  for(let k=0; k<=2; k++){
    const x = flat[ri-k]; if(!x) continue;
    const day = weeks[x.w][x.d]; if(!day || day.rest) continue;
    if(!day.cardio){ weeks[x.w][x.d] = {title:'Rest',dot:'rest',tags:['rest'],rest:true}; continue; }
    // Two days out, a tier A post-run mobility block is recovery, not lifting: it stays.
    const keep = k===2 ? (day.sections||[]).filter(sec => /post-run mobility/i.test(sec.label||'')) : [];
    day.sections = keep;
    day.tags = (day.tags||[]).filter(t => t!=='lift' && t!=='hip' && t!=='core');
    // D106a (V207): NSW's easy run is the long slow distance card, so it shakes out too. Run
    // cards only: a bike or swim LSD on an NRC multi-sport eve keeps its title. A test goal's
    // marker day is Test Day; NRC keeps Race Day. V208: the claim is on the card, never the
    // slot: only the EASY LSD (legLoad false) is the easy run, so a long card is never Shakeout.
    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && !day.cardio.legLoad && /^long slow distance/i.test(day.cardio.subtype||''));
    day.title = k===0 ? (PACE_GOALS.has(day.cardio.goalId) ? 'Test Day' : 'Race Day') : (_rec && (ri-k)===lr) ? 'Shakeout' : _rec ? 'Easy Run' : keep.length ? day.title : String(day.cardio.subtype||'Run').split(' — ')[0];
  }
}
function singletonSupersetSweep(weeks: WeekGrid): WeekGrid{
  Object.keys(weeks||{}).forEach(w=>Object.keys(weeks[w]||{}).forEach(d=>{
    const day=weeks[w][d]; if(!day||!Array.isArray(day.sections)) return;
    day.sections.forEach(sec=>{
      if(!sec||!(sec.superset||sec.type==='superset')) return;
      if((sec.items||[]).length!==1) return;
      delete sec.superset; if(sec.type==='superset') delete sec.type;
      // "Pull superset A" over one row names a structure that is gone.
      if(typeof sec.label==='string'){ const l=sec.label.replace(/\s+superset(\s*[A-Z])?\s*$/i,'').trim(); if(l) sec.label=l; }
    });
  }));
  return weeks;
}

// ── UNLOADABLE PRESCRIPTION SWEEP (V121, "B2c") ──────────────────────────────
// ONE WRITER. `_repFloor`'s rule — if there is no load to move, prescribe sets and effort
// and let reps emerge — has been correct since V110 but was wired ONLY to the barbell wave
// resolver. Every accessory block wrote its own literal detail string and never asked, so
// 8,818 prescriptions across five tiers arrived carrying a rep target on a movement that
// cannot express one. "3×12 at RPE 7" on a diamond pushup is a guess at the athlete's
// capacity, and it is wrong in both directions: too easy for someone who can do thirty,
// too hard for someone who can do six. Sets and effort are the honest instruction.
//
// THE PREDICATE IS `isTrackableWeight`, NOT `_repFloor`. This was measured, not assumed.
// `_repFloor` answers "what rep window does this movement's LOAD allow", which is a
// different question from "can this be loaded at all, on THIS tier" — it returns null for
// `Walking lunge` and `Reverse lunge`, and a [6,10] window for `Split squat` and
// `Step-ups (chair)` that was written for a dumbbell the bodyweight tier does not have.
// Using it would have regressed 712 bodyweight-tier prescriptions. `isTrackableWeight` is
// the same question the LOG side already answers to decide whether to draw a weight field,
// so the card and the prescription can never disagree: if there is nowhere to write a
// number, there is no rep target.
//
// Bodyweight tier is deliberately NOT swept here — `bodyweightSweep` already converted it
// on a looser rule and has shipped that way since V94. This runs on the other five tiers
// only, which makes it purely additive and unable to regress the tier with the most
// history. Guard reads `!== 'bodyweight'` rather than a tier allowlist so a new tier is
// swept by default; forgetting to sweep is the worse failure.
function unloadableRxSweep(weeks: WeekGrid, _uCfg: Cfg | null | undefined): void{
  Object.keys(weeks||{}).forEach(w=>Object.keys(weeks[w]||{}).forEach(d=>{
    const day=weeks[w][d]; if(!day||!day.sections) return;
    day.sections.forEach(sec=>{
      // HIP AND CORE ARE NOT SWEPT. Those blocks carry their own grammar and their own
      // doctrine: "Hip stability" is glute ACTIVATION, and a prescribed rep count there is
      // CORRECT — banded side steps and monster walks are prep, not a set taken near
      // failure. Without this guard the sweep converted 2,807 of them and told the athlete
      // to stop two reps short of failure on a monster walk, which is not what that block
      // is for. Caught by the V120->V121 diff coming back 11,391 against a measured
      // candidate set of 8,818; the 2,573-line gap was entirely "Hip stability".
      if(!sec||sec.core||sec.hip) return;
      (sec.items||[]).forEach(it=>{
        if(!it||!it.name||!it.detail) return;
        if(!/^\s*\d+\s*[×x]\s*\d/.test(it.detail)) return;            // no countable target
        if(/\b(sec|min|yard|yd|meter|metre)\b/i.test(it.detail)) return; // time and distance are real
        if(_BW_KEEP_FIXED.test(it.name)) return;                      // holds, plyos, carries, core
        if(isTrackableWeight(it.name,it.detail)) return;              // it gets a weight field
        // V137 (Q5): thread week + experience so the beginner effort floor reaches
        // unloadable accessories on loaded tiers — this pass was the last RPE-8 writer
        // the floor didn't cover (found by the fuzz gate's floor invariant).
        it.detail=_bwSetsFromDetail(it.detail, +w, _uCfg&&_uCfg.experience, (_uCfg&&_uCfg.liftingFocus)==='support_prevention');
      });
    });
  }));
}
// ── ORCHESTRATOR — reads as a clean A -> B -> C -> D pipeline ────────────────
function buildProgram(cfg: EngineCfg): Program{
  _swapUniverseReset();                   // harvest THIS cfg's legal exercise set (see pick)
  const A    = engineA_timeline(cfg);     // structure, weeks, wave/deload/taper resolver
  const B    = engineB_cardio(cfg, A);    // cardio schedule = read-only leg-load footprint
  const plan = planCalendar(cfg, A, B);   // dayRoles finalized + leg/run deconfliction
  const C    = engineC_kinematics(cfg, A, B);   // RPE lifting selection (reads finalized plan via D)
  const D    = engineD_synthesis(cfg, A, B, plan, C); // synthesize week grid + emit program
  return D;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _PATTERN_REGION, _compoundTier, buildProgram, d18LongRunDayPass, engineD_synthesis, singletonSupersetSweep };
