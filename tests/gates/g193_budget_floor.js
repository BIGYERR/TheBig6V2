// GATE g193_budget_floor — V193 D48, amending D47. The session-budget floor.
//
// RULING (D47, shipped in slice 3). capSessionBudget._protected returned -1 for s.core, so
// the OPTIONAL core finisher outranked the prehab rail and the budget paid for the finisher
// out of prehab. The clause `if(s&&s.optional) return false;` made every optional section
// unprotected outright.
//
// RULING (D48, amending D47). That went too far: it DELETED 62 of 540 core sections. An
// optional section is unprotected only while it still has something to give. Taking from a
// section with one item left is not trimming it, it is deleting it, and deleting a training
// quality is the exact disease D47 was written to cure, just relocated from prehab to trunk.
// New clause: `if(s && s.optional && ((s.items||[]).length>1)) return false;`. `length>1` is
// not a tunable: 1 is the boundary between nonempty and empty. A floor expressed in SETS was
// considered and rejected as an invented constant with no table behind it.
// THIN CORE IS AN ACCEPTABLE OUTCOME and is reported here, never gated: one hard trunk piece
// done properly on a tight day is a coachable prescription; zero trunk is not.
//
// ══ WIDENED FOR V193 (gatekeeper recommendation 3, Mario concurring). READ THIS. ══
// Every claim below used to be made on ONE lattice: HALF MANNY x 6 tiers x 5 seeds, one
// goal, one focus, one experience, HEALTHY ONLY. Thirty builds. Everything passed, honestly,
// and every defect V193 actually shipped sat outside it. A gate that passes honestly on a
// lattice too narrow to contain the defect is worse than no gate, because it reads as
// coverage. The claims now run on tests/lattice193.js WIDE:
//   {healthy, shoulder/protect, lowback/protect, elbow/protect}
//   x {support_prevention, hypertrophy} x {intermediate, advanced} x 6 tiers x 3 seeds
//   = 288 builds, ~28k day-builds.
// The old 30-build sweep survives as NARROW and is used for exactly one thing: the two
// hand-transcribed V192 censuses were typed against it, so they stay checkable there. No
// CLAIM is made on NARROW any more; it is a cross-check on the baseline artifact's identity.
//
// THE BAR (coach's, six items; denominators printed for each):
//   B1 Core sections present. Two claims now, because the old absolute is only structural on
//      the healthy path. B1a: 18 core sections per build on every HEALTHY cell (hand count).
//      B1b: per-cell core sections never BELOW V192 on the same cell, all 288 cells, ON
//      EVERY DAY THE RUN DOES NOT OWN. An injured cell has fewer core sections than a
//      healthy one for reasons the injury overlay owns; losing one relative to V192 is the
//      regression. NRC long-run tier days are excluded and the excluded count is printed
//      (see the carve-out note at B1b) — the bar stays live everywhere else.
//   B2 Zero empty sections anywhere, every section type, optional or not. Direct assertion
//      of the clause: a budget pass may never render a section with 0 items.
//   B3 Prehab items vs the V192 census: a FLOOR, per tier and in aggregate. Never a delta.
//      The claim is "prehab never regresses below V192", which is permanent and holds on
//      every future version. The old claim was "prehab GREW this release" (aggregate delta
//      > 0) and that is a change-detector: it can only pass against the one baseline the
//      D46 expansion was measured against, and V193 against V193 fails it exactly the way
//      V194 against V193 does. Growth is a per-release measure question and has no business
//      in a permanent gate. The floor is the hand sum of the transcribed census (22,671
//      wide / 2,697 narrow); the sum is cross-checked against the table on every run so a
//      typo in either cannot pass. The AGGREGATE live-baseline delta is REPORTED, never
//      gated — the same treatment B4d and B5 already carry below. The PER-TIER live-baseline
//      comparison is a different animal and is GATED: candidate >= baseline on every tier is
//      a RATCHET, not a change-detector. It costs a version that holds prehab steady nothing
//      (V193 against V193 passes it; V194 against V193 passes it at +0 on 6/6 tiers), and it
//      catches a real regression that fits inside the floor's headroom — 168 to 241 items of
//      slack per wide tier and 0 to 16 per narrow is room enough to lose a whole draw and
//      still clear the census. Two bars, not one: the census floor is permanent and
//      version-independent, the ratchet is against the version this one ships after. The
//      ratchet is DEFERRED BY NAME when no baseline is supplied, never silently passed.
//   B4 Non-optional sections: no budget deletion worse than V192 per TIER (B4), no class
//      V192 never emptied (B4c), the budget never ADDS (B4e), trim order unchanged (B4f).
//      B4b (per CELL) and B4d (per CLASS growth) are REPORTED WITH DENOMINATORS AND NEVER
//      GATED. Coach filed both to §12 as non-blocking and gave a reason for each; the
//      reasons are written out at the assertions themselves.
//   B5 Thin core (exactly 1 item): REPORTED with denominator, never gated. Printed on BOTH
//      lattices with both denominators, because coach approved "thin core is acceptable"
//      while looking at the narrow figure and the wide figure is a different number.
//   B6 Determinism: pinned cfg.seed, clock fields stripped, baseline == itself proven
//      before any differential claim is made.
//
// ORACLES — no oracle here asks the engine what it did and then agrees with it.
//   O1 STRUCTURAL COUNT, hand typed from the ruling's after-grid: the HALF MANNY fixture is
//      14 weeks and carries exactly 18 core sections per build ON THE HEALTHY PATH. That is
//      the number written here, not read from a build. It does NOT extend to the injury
//      paths: a protect overlay converts lift days to rehab days and the core count per
//      build is then a property of the overlay, which has its own rulings. So the injury
//      cells get the differential (B1b) and the healthy cells get the hand count (B1a).
//   O2 NONEMPTY, stated in words: `items.length >= 1` for every section the athlete is shown.
//      A section is a promise of work. Zero items is a label with nothing under it.
//   O3 PREHAB SET, hand typed: every item inside a `hip:true` section (the hip-stability and
//      foot-and-ankle rails), plus the knee-stability pool ['Spanish squat hold (KB)',
//      'Wall sit','Terminal knee extension (band)','Single-leg wall sit'] and the cuff/scap
//      isolation pool ['Dumbbell lateral raise','Cable lateral raise','Dumbbell front raise',
//      'Dumbbell rear delt fly','Face pull','Prone Y-T-W raises','Wall slides'] — the two
//      pools the D47 measurement named as the rail that was being raided. Transcribed from
//      EXLIB.knee_stability / EXLIB.shoulder_iso / EXLIB.shoulder_iso_bw by hand.
//   O4 BUDGET-OFF DIFFERENTIAL: the file's own per-pass bypass (__BUDGET_OFF) gives the
//      pre-budget day. Every section present pre-budget and absent post-budget was deleted
//      BY THE BUDGET. This is a WITHIN-VERSION measurement, so it is immune to a section
//      whose LABEL merely changed between versions — which matters, because 'Main — <lift>'
//      embeds the movement name and a raw version-to-version section diff scores every
//      substituted main lift as a deleted section. Do not replace O4 with that diff.
//   O5 HAND-BUILT SESSION with a HAND-DERIVED trim: a five-section day worth 24.5 budget
//      units against a cap of 20, walked through the documented rank rules by hand below.
//      Run twice, one flag apart, and once against V192 with no optional flags at all.
//      Lattice-free: this one is arithmetic and needs no sweep at all.
//
// usage: node tests/gates/g193_budget_floor.js <candidate.html> [baseline.html]

const fs = require('fs');
const path = require('path');
const { load, fixtures, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));

const FILE = process.argv[2] || 'index.html';
const BASEFILE = process.argv[3] || null;
const IA = load(FILE);

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const info = m => console.log('  --   ' + m);

// ── UNDER-INVOCATION ACCOUNTING ────────────────────────────────────────────
// This gate used to print the same SHAPE of green whether or not it was handed the baseline
// it was written to use: `PASS 20 FAIL 0` with no argument, `PASS 30 FAIL 0` with one, and
// the only trace of the ten missing claims was a single `--` line. A gate that quietly
// reports green on less work than it was written to do is the one failure mode a gate cannot
// have. So: every claim that can only be made against a baseline is DEFERRED BY NAME, the
// names are counted and reprinted as their own block above the summary, and the process
// exits non-zero (3) in that mode. Nothing is skipped silently any more.
//
// REQUIRES_BASELINE is the hard branch. Put a claim's name in it and the gate REFUSES TO RUN
// without a baseline: exit 2, no PASS/FAIL summary at all, because a refusal that prints a
// summary is just another way of reading as a pass. As of V194 the list is EMPTY ON PURPOSE,
// and that is a finding, not an oversight: once B3 became a census floor, every GATED claim
// in this file stands on a hand table, on doctrine arithmetic or on the candidate alone. A
// baseline only ever ADDS finer differential claims (per cell instead of per injury path)
// plus the identity checks on the baseline artifact itself. tests/sabotage.py invokes gates
// with the mutated file and nothing else, so a hard requirement here would turn every
// sabotage mutation against this gate into a CRASH, which is not a trip.
const REQUIRES_BASELINE = [];
// TWO CATEGORIES, NEVER ONE NUMBER. `defer` and `na` are separate channels with separate
// counters, separate blocks in the epilogue and distinguishable line prefixes (`DEFER` vs
// `N/A`). They are never summed: they are not the same fact.
//   defer() = UNDER-INVOKED. The claim was not made because this run was missing something it
//             COULD have been handed. Actionable by the operator, so it drives exit 3.
//   na()    = NOT APPLICABLE BY DESIGN. The claim needs a V192-specific artifact, or the
//             lattice a hand table was transcribed against, and this run legitimately supplied
//             something else. Nothing is wrong, nothing is fixable, so it does NOT move the
//             exit code. It is still announced by name, which is the part that matters: these
//             claims are not silent in either design, only the exit code differs.
// PRECEDENCE, enforced below and not left to call sites: with NO baseline at all, every claim
// that needs one is UNDER-INVOKED — the V192-specific ones included — because supplying a
// baseline is the fixable step, so that run exits 3. A claim is NOT APPLICABLE only when a
// baseline WAS supplied and is simply the wrong version or the wrong lattice for that claim.
let DEFER = 0;
const defers = [];
const defer = (claim, why) => { DEFER++; defers.push(claim + ' — ' + why); console.log('  DEFER ' + claim + ' — ' + why); };
let NA = 0;
const nas = [];
const na = (claim, why) => {
  if (!BASEFILE) return defer(claim, why);   // precedence: no baseline at all is under-invocation
  NA++; nas.push(claim + ' — ' + why); console.log('  N/A   ' + claim + ' — ' + why);
};
if (!BASEFILE && REQUIRES_BASELINE.length){
  console.error('REFUSING TO RUN: ' + path.basename(__filename) + ' was given no baseline argument and these claims cannot be stated without one:');
  REQUIRES_BASELINE.forEach(c => console.error('   - ' + c));
  console.error('usage: node tests/gates/g193_budget_floor.js <candidate.html> <baseline.html>');
  console.error('No PASS/FAIL summary is printed: this run proved nothing, and must not be readable as a pass.');
  process.exit(2);
}
if (BASEFILE && !fs.existsSync(BASEFILE)){
  console.error('REFUSING TO RUN: the baseline ' + BASEFILE + ' was named on the command line and does not exist.');
  console.error('A named baseline that silently falls back to a hand table is the exact defect this guard exists to stop.');
  console.error('No PASS/FAIL summary is printed.');
  process.exit(2);
}

const EQUIP = LAT.EQUIP;
// OPT-IN WIDER SWEEP. Default is the ruled 288-cell WIDE lattice. IA_LATTICE=full runs the
// 864-cell FULL lattice (beginner, knee/protect, hip/workaround, ankle/workaround,
// lowback/workaround as well). CORRECTED, this line used to read "finds 108 lost core
// sections where WIDE finds 3" and had the sign backwards: on FULL the core-section
// differential vs V192 is 108 GAINED and 4 lost, not 108 lost. The point the line is
// making still stands — FULL sees strictly more than WIDE — but it is not a pile of
// regressions and must not be quoted as one.
// The default is NOT changed here: that is a runtime and scope call for Mario, and this
// pass was authorised to widen to the 288-cell floor, not past it.
const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';
const CELLS = USE_FULL ? LAT.FULL : LAT.WIDE;
const INJS  = (USE_FULL ? LAT.INJ_FULL : LAT.INJ_WIDE).map(i => i.tag);
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── O1: hand-typed structural count, HEALTHY path only ─────────────────────
const CORE_PER_BUILD = 18;                                // HALF MANNY, 14 weeks, no overlay

// ── O3: hand-typed prehab membership ───────────────────────────────────────
const PREHAB_NAMES = [
  'Spanish squat hold (KB)','Wall sit','Terminal knee extension (band)','Single-leg wall sit',
  'Dumbbell lateral raise','Cable lateral raise','Dumbbell front raise','Dumbbell rear delt fly',
  'Face pull','Prone Y-T-W raises','Wall slides',
];
const isPrehabItem = (secHip, name) => !!secHip || PREHAB_NAMES.indexOf(name) >= 0;

// ── V192 censuses, hand transcribed from the V192 artifact ─────────────────
// These are TRANSCRIPTIONS, not doctrine. Their job is to catch a swapped or corrupted
// baseline file and to give B3/B4 something to stand on when no baseline is handed in.
// The real differential is always taken against the LIVE baseline when one is supplied.
// NARROW tables were typed against the 30-build sweep and are checked there. WIDE tables
// were typed against the 288-cell sweep and are checked there. Do not cross them: the same
// engine gives different numbers on different lattices and a table applied to the wrong
// lattice is the exact failure this widening exists to stop.
const V192_PREHAB_NARROW = { bodyweight:425, minimal:470, home_basic:470, home_full:444, commercial:444, crossfit:444 };
const V192_PREHAB_WIDE   = { bodyweight:3775, minimal:3867, home_basic:3824, home_full:3747, commercial:3747, crossfit:3711 };
const V192_NONOPT_NARROW = { bodyweight:3, minimal:6, home_basic:5, home_full:9, commercial:9, crossfit:9 };
// Core sections OFF the NRC long-run tiers, per injury path, on the 288-cell WIDE lattice,
// transcribed off the V192 artifact (git show HEAD:index.html at V192, ia-version 192).
// This is the fallback B1b uses when no baseline file is supplied — which is every sabotage
// run, because the sabotage runner invokes a gate with the mutated file and nothing else. An
// assertion no mutation can reach is not proof, so B1b gets a floor it can be held to with
// one argument. It is a FLOOR, never an equality: V193 legitimately gains core sections.
// Typed against WIDE only; on IA_LATTICE=full the fallback is skipped, not rescaled.
const V192_CORE_NONLR_WIDE = { 'healthy':1296, 'shoulder/protect':648, 'lowback/protect':1224, 'elbow/protect':576 };
const V192_NONOPT_WIDE   = { bodyweight:1022, minimal:1045, home_basic:1106, home_full:1127, commercial:1127, crossfit:1100 };
// CORRECTION TO THE V192 ORACLE, and this line names it. The old gate carried
//   const NONOPT_DELETABLE = ['Accessory'];   // hand typed. Anything else is new.
// with the comment "the only class V192 empties". That was measured on the 30-build healthy
// sweep and it is PROVABLY WRONG on the wider lattice: on the same 288 cells V192 empties
// sixteen distinct non-optional classes, transcribed below. 'Accessory' was not the only
// class V192 emptied, it was the only class the narrow lattice could see V192 empty. The
// corrected oracle is the full V192 class census; anything outside it is still NEW.
const V192_NONOPT_CLASSES_WIDE = {
  'Accessory': 136, 'Triceps': 643, 'Leg isolation': 432, 'Calves': 1296,
  'Leg superset B': 1104, 'Delts': 318, 'Biceps': 267, 'Chest volume': 11,
  'Leg superset A': 478, 'Chest + knee': 18, 'Trunk — anti-extension': 1232,
  'Calf — achilles armor': 514, 'Trunk — anti-rotation': 16, 'Leg': 8,
  'Delts finisher': 36, 'Arms finisher': 18,
};

// ── COACH-RULED-DELETABLE CLASSES (D81) ────────────────────────────────────
// THIS IS A RULING, NOT A FUDGE, AND EVERY MEMBER CARRIES ITS D-CODE. A class named
// here is excluded from B4's per-tier ratchet ON BOTH SIDES — candidate and baseline,
// never one — because coach has ruled that capSessionBudget is CONTRACTUALLY ALLOWED to
// trim it. It is not excluded from B4b, B4c or B4d, which still report it.
//   'Leg isolation'  D81. capSessionBudget's docstring has stated the trim order since it
//                    was written: carries -> optional/finisher/conditioning -> PUMP/
//                    ISOLATION -> remaining accessories, latest first. 'Leg isolation' IS
//                    the isolation band. The V192 count of 432 was never a coaching floor:
//                    four of V196's five pool names were already tier 0, only 'Leg press'
//                    reached the tier-3 exemption, and the permissive _gear fallback handed
//                    the all-machine pool back whole on bodyweight/minimal/home_basic/
//                    home_full, so a leg press sat on a hotel-room card as an untouchable
//                    barbell compound. Two defects were propping the number up. D81
//                    ratifies the contract; V197 removed the accident blocking it.
// A SECOND MEMBER APPEARING HERE WITHOUT A D-CODE IS A WEAKENING. It must be obvious on
// sight, which is why this list is one line and the reasoning is above it.
const RULED_DELETABLE = ['Leg isolation'];                 // D81
// V192 non-optional deletions OF THE RULED-DELETABLE CLASSES ONLY, per tier, on the
// 288-cell WIDE lattice, transcribed off the V192 artifact (git show V192:index.html).
// B4's fallback baseline is the hand table V192_NONOPT_WIDE, whose per-tier totals
// INCLUDE these deletions. Subtracting a candidate-side class from an untouched baseline
// would be exactly the one-sided exclusion this ruling forbids, so the baseline side gets
// its own transcription. Each tier must equal V192_NONOPT_CLASSES_WIDE['Leg isolation']
// (432) divided over the six tiers, which is asserted PER TIER on every run below.
const V192_RULED_DEL_WIDE = { bodyweight:72, minimal:72, home_basic:72, home_full:72, commercial:72, crossfit:72 };
// ── THE GUARD IS PER TIER, NOT A SUM (V197 slice 5, gatekeeper) ──────────────────────
// It used to compare the SUM of the map above against the class census and nothing else.
// A sum check passes a COMPENSATING PAIR of typos: 71 on one tier and 73 on another still
// sums to 432, and B4 would then hold two tiers to numbers no one transcribed. Gatekeeper
// hand-verified the live values (72 on every one of the six tiers on the V192 artifact),
// so the table is right today; the guard is what stops it drifting.
// THE PER-TIER EXPECTATION IS DERIVED, AND THE DERIVATION IS WHY THIS IS NOT A SELF-CHECK:
//   (a) the WIDE lattice is BALANCED — 288 cells over 6 tiers, 48 apiece (asserted at L0);
//   (b) on V192 the leg_accessory pool was TIER-INVARIANT. The permissive _gear fallback
//       handed the all-machine pool back WHOLE on every tier — that is the accident D81's
//       note above names — so no tier could empty more or fewer 'Leg isolation' sections
//       than any other tier.
// Uniformity is therefore a FACT ABOUT V192, not an average taken over the table it is
// checking, and the per-tier value is the class total over the tier count. The derivation
// holds only while RULED_DELETABLE is the single D81 member; a second class has its own
// per-tier shape, so this block FAILS CLOSED until someone transcribes it per tier.
// Failure behaviour is unchanged: exit 2 with no PASS/FAIL summary, which sabotage.py
// reads as CRASH. A gate that cannot trust its oracle must not report a pass.
{
  const T = Object.keys(V192_RULED_DEL_WIDE);
  const miss = T.filter(k => typeof V192_RULED_DEL_WIDE[k] !== 'number');
  if (miss.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE has no number for ' + miss.join(', ')); process.exit(2); }
  const short = EQUIP.filter(e => T.indexOf(e) < 0);
  const extra = T.filter(k => EQUIP.indexOf(k) < 0);
  if (short.length || extra.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE must carry one number per lattice tier and no others — missing [' + short.join(', ') + '], unknown [' + extra.join(', ') + ']. A tier with no transcription cannot be subtracted from the baseline side.'); process.exit(2); }
  if (RULED_DELETABLE.length !== 1 || RULED_DELETABLE[0] !== 'Leg isolation') { console.error('ORACLE DERIVATION VOID: the per-tier expectation below is derived for the single D81 member \'Leg isolation\', whose V192 pool was tier-invariant. RULED_DELETABLE is now [' + RULED_DELETABLE.join(', ') + ']. Transcribe V192_RULED_DEL_WIDE per tier against the V192 artifact and re-derive this guard before any claim uses it.'); process.exit(2); }
  const t = RULED_DELETABLE.reduce((a,k)=>a+(V192_NONOPT_CLASSES_WIDE[k]||0), 0);
  if (t % EQUIP.length !== 0) { console.error('ORACLE TYPO: V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + '], which does not divide evenly across the ' + EQUIP.length + ' tiers of a balanced lattice. One of the two transcriptions of the same V192 fact is wrong and neither may be used.'); process.exit(2); }
  const per = t / EQUIP.length;
  const wrong = EQUIP.filter(e => V192_RULED_DEL_WIDE[e] !== per);
  if (wrong.length) { console.error('ORACLE TYPO (PER TIER): ' + wrong.map(e => e + '=' + V192_RULED_DEL_WIDE[e]).join(', ') + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + '] over ' + EQUIP.length + ' uniform tiers, i.e. ' + per + ' each. A SUM check let a compensating pair of typos through here; this one does not. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
  const s = T.reduce((a,k)=>a+V192_RULED_DEL_WIDE[k], 0);
  if (s !== t) { console.error('ORACLE TYPO: V192_RULED_DEL_WIDE sums to ' + s + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + ']. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
}

const secKey = s => [clean(s.label), clean(s.coreHeader), s.pillar||'', s.core?'C':'', s.hip?'H':'', s.optional?'O':''].join('|');

// census over an arbitrary lattice. Returns per-tier rollups, per-cell rollups and the
// per-day section-key lists O4 needs.
function census(ia, budgetOff, cells){
  ia.eval('globalThis.__BUDGET_OFF = ' + (budgetOff ? 'true' : 'false') + ';');
  const out = { tiers:{}, cells:{}, byDay:{}, byInj:{}, cellsSwept:0, dayBuilds:0 };
  // THE CARVE-OUT PREDICATE IS THE ENGINE'S OWN. D50 already owns the question "does the
  // run own this day", and a gate that writes a SECOND long-run predicate is a gate that
  // can disagree with the artifact about which days it is excusing. So this reads
  // _longRunTier out of the file under test — candidate and baseline each classify their
  // own days with their own copy. If the symbol is missing the census carves nothing out,
  // which fails CLOSED (B1b then asserts on every day) and B1b says so by name.
  var lrt = null;
  try { lrt = ia.eval('typeof _longRunTier === "function" ? _longRunTier : null'); } catch (e){ lrt = null; }
  out.lrtOK = (typeof lrt === 'function');
  out.lrDays = 0; out.lrCore = 0; out.lrTiers = { A:0, B:0, C:0 };
  for (const e of EQUIP) out.tiers[e] = { coreSec:0, thinCore:0, emptySec:0, emptyDetail:[], sections:0, items:0, prehab:0, optSec:0, nonOptSec:0 };
  for (const t of INJS) out.byInj[t] = { coreSec:0, thinCore:0 };
  const lrTierOf = day => { if (!out.lrtOK) return null; try { return lrt(day.cardio) || null; } catch (e){ return null; } };
  for (const c of cells){
    const T = out.tiers[c.equipment];
    const I = out.byInj[c.inj] || (out.byInj[c.inj] = { coreSec:0, thinCore:0 });
    const C = out.cells[c.key] = { coreSec:0, coreSecNL:0, thinCore:0, emptySec:0, nonOptDel:0 };
    out.cellsSwept++;
    const prog = ia.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        out.dayBuilds++;
        const lrTier = lrTierOf(day);
        if (lrTier){ out.lrDays++; out.lrTiers[lrTier] = (out.lrTiers[lrTier] || 0) + 1; }
        const dk = c.key + '|' + wk + '|' + d;
        const keys = [];
        for (const s of (day.sections || [])){
          if (!s) continue;
          const n = (s.items||[]).length;
          T.sections++; T.items += n;
          keys.push(secKey(s));
          if (s.optional) T.optSec++; else T.nonOptSec++;
          if (s.core){ T.coreSec++; I.coreSec++; C.coreSec++;
            if (lrTier) out.lrCore++; else C.coreSecNL++;
            if (n === 1){ T.thinCore++; I.thinCore++; C.thinCore++; } }
          if (n === 0){ C.emptySec++; T.emptySec++; if (T.emptyDetail.length < 8)
            T.emptyDetail.push(dk+' ['+(s.core?'core':s.hip?'hip':s.optional?'optional':'plain')+'] '+(clean(s.label)||clean(s.coreHeader)||'(no label)')); }
          for (const it of (s.items||[])) if (isPrehabItem(s.hip, clean(it.name))) T.prehab++;
        }
        out.byDay[dk] = keys;
      }
  }
  ia.eval('globalThis.__BUDGET_OFF = false;');
  return out;
}

console.log('GATE g193_budget_floor — ' + FILE + ' (ia-version ' + IA.version + ')');
console.log('  lattice in use: ' + (USE_FULL ? 'FULL' : 'WIDE') + ', ' + CELLS.length + ' cells' +
  (USE_FULL ? ' (IA_LATTICE=full: 8 injury paths, 3 experience levels)' : ' = ' + LAT.INJ_WIDE.length + ' injury x ' + EQUIP.length + ' tiers x ' +
  LAT.FOCUS_WIDE.length + ' foci x ' + LAT.EXPER_WIDE.length + ' experiences x ' + LAT.SEEDS_WIDE.length + ' seeds') + ' (HALF MANNY, 14 weeks)');
if (!USE_FULL) console.log('  set IA_LATTICE=full for the 864-cell sweep (about 4x the runtime; it finds strictly more)');
console.log('  NARROW lattice: ' + LAT.NARROW_N + ' cells (the old sweep; baseline-identity cross-check only, no claims)');

// The shared lattice is a shared failure mode. If somebody trims an axis in
// lattice193.js this assertion goes red here and in every other consumer at once,
// instead of coverage quietly shrinking.
if (LAT.WIDE_N === 288) ok('L0 WIDE lattice is the ruled 288 cells (4 x 6 x 2 x 2 x 3)' + (USE_FULL ? ', and this run uses the ' + CELLS.length + '-cell superset' : ''));
else bad('L0 WIDE lattice is ' + LAT.WIDE_N + ' cells, not the ruled 288 — lattice193.js was narrowed and every claim below is weaker than it reads');
if (CELLS.length >= LAT.WIDE_N) ok('L0a the lattice in use (' + CELLS.length + ' cells) is at or above the ruled floor of ' + LAT.WIDE_N);
else bad('L0a the lattice in use is ' + CELLS.length + ' cells, BELOW the ruled floor of ' + LAT.WIDE_N);
if (LAT.NARROW_N === 30) ok('L0b NARROW lattice is the historical 30 cells');
else bad('L0b NARROW lattice is ' + LAT.NARROW_N + ' cells, not 30 — the hand-transcribed narrow tables no longer describe it');

// ── B6: determinism first. Nothing differential is claimed before this. ────
{
  const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment:'commercial', seed: 76308 });
  const a = progDigest(IA.buildProgram(Object.assign({}, cfg)));
  const b = progDigest(IA.buildProgram(Object.assign({}, cfg)));
  if (a === b) ok('B6 candidate is self-stable on pinned seed 76308 (digest ' + a + ', clock fields stripped)');
  else bad('B6 candidate is NOT self-stable: ' + a + ' vs ' + b);
  // and self-stable on an INJURED cell too, because every new claim below lives there
  const icfg = Object.assign({}, fixtures.HALF_MANNY, { equipment:'commercial', seed: 76308, liftingFocus:'hypertrophy', experience:'advanced', injury:{ region:'shoulder', tier:'protect' } });
  const c = progDigest(IA.buildProgram(Object.assign({}, icfg)));
  const d = progDigest(IA.buildProgram(Object.assign({}, icfg)));
  if (c === d) ok('B6b candidate is self-stable on an injured wide cell (shoulder/protect commercial hypertrophy advanced, digest ' + c + ')');
  else bad('B6b candidate is NOT self-stable on shoulder/protect: ' + c + ' vs ' + d);
}

// ── B6 continued: load the baseline once, prove it equals itself, then diff ─
var IB_BASE = null, BASE_VER = null;
var BASE = null, BASE_OFF = null, BASE_N = null, BASE_N_OFF = null;
if (BASEFILE && fs.existsSync(BASEFILE)){
  IB_BASE = load(BASEFILE); BASE_VER = IB_BASE.version;
  const d1 = progDigest(IB_BASE.buildProgram(Object.assign({}, fixtures.HALF_MANNY)));
  const d2 = progDigest(IB_BASE.buildProgram(Object.assign({}, fixtures.HALF_MANNY)));
  if (d1 === d2) ok('B6c baseline ' + path.basename(BASEFILE) + ' (v' + BASE_VER + ') == itself before any diff (digest ' + d1 + ')');
  else bad('B6c baseline is not self-stable (' + d1 + ' vs ' + d2 + ') — no differential claim below is trustworthy');
  if (d1 === d2){
    BASE = census(IB_BASE, false, CELLS); BASE_OFF = census(IB_BASE, true, CELLS);
    BASE_N = census(IB_BASE, false, LAT.NARROW); BASE_N_OFF = census(IB_BASE, true, LAT.NARROW);
  }
} else {
  info('no baseline file supplied. The gated claims below stand on the hand-transcribed V192 tables and on the candidate alone. Every claim that needs a live baseline is deferred BY NAME and counted; see the DEFERRED block above the summary.');
  defer('B6c baseline artifact is self-stable before any diff', 'no baseline file supplied');
  defer('B1b per-CELL core-section differential vs the live baseline (all ' + CELLS.length + ' cells)', 'no baseline file supplied; the per-injury-path floor against the transcribed V192 census runs in its place, which is coarser');
  defer('B1b the carve-out covers the same day-builds on both versions', 'no baseline file supplied');
  defer('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)', 'no baseline file supplied');
  defer('B4b per-CELL non-optional deletions (REPORT ONLY)', 'no baseline file supplied');
  defer('B4d per-CLASS non-optional deletion growth (REPORT ONLY)', 'no baseline file supplied');
  defer('B4f trim order for non-optional sections unchanged vs the baseline engine', 'no baseline file supplied; the hand-derived D48 and plain trim orders are still asserted against the candidate');
}

const CAND = census(IA, false, CELLS);
const CANDOFF = census(IA, true, CELLS);
const CAND_N = census(IA, false, LAT.NARROW);
const CAND_N_OFF = census(IA, true, LAT.NARROW);
console.log('  swept ' + CAND.cellsSwept + ' cells / ' + CAND.dayBuilds + ' day-builds (wide), ' +
  CAND_N.cellsSwept + ' cells / ' + CAND_N.dayBuilds + ' day-builds (narrow)');
if (CAND.cellsSwept === CELLS.length) ok('L1 the sweep actually ran all ' + CELLS.length + ' cells (no build was silently skipped)');
else bad('L1 the sweep covered ' + CAND.cellsSwept + '/' + CELLS.length + ' cells');

// ── B1a: core sections, hand count, HEALTHY cells ──────────────────────────
{
  const healthy = CELLS.filter(c => c.inj === 'healthy');
  const wrong = healthy.filter(c => CAND.cells[c.key].coreSec !== CORE_PER_BUILD);
  console.log('       core sections, healthy cells: ' + healthy.length + ' cells x ' + CORE_PER_BUILD + ' expected = ' + (healthy.length*CORE_PER_BUILD));
  if (!wrong.length) ok('B1a every healthy cell carries ' + CORE_PER_BUILD + '/' + CORE_PER_BUILD + ' core sections (' + healthy.length + '/' + healthy.length + ' cells, hand count from the HALF MANNY grid)');
  else bad('B1a ' + wrong.length + '/' + healthy.length + ' healthy cells do not carry ' + CORE_PER_BUILD + ' core sections: ' +
    wrong.slice(0,4).map(c => c.tag + ' -> ' + CAND.cells[c.key].coreSec).join(' ; '));
}

// ── B1b: core sections never below V192, per cell — LONG-RUN TIER DAYS CARVED OUT ──
//
// THE CARVE-OUT, AND WHY IT IS NOT A SOFTENED BAR. B1b failed on V193 with "3 core sections
// LOST in 3/288 cells". Gatekeeper traced the mechanism and it is not a defect:
//   An NRC long-run tier B day allows EIGHT working sets, because the run is the day. V192's
//   rotational pillar was frozen on 'Landmine rotations 2×8–12' — two sets, it fits under
//   eight. D46 unfroze that pillar, so the draw now reaches 'Medicine ball rotary toss 3×8'
//   and 'Cable woodchoppers 3×12' — three sets, which does NOT fit under eight. The section
//   empties, the empty-section strip splices it out, and the cell shows one fewer core
//   section. V192 only passed this assertion because of the bug D46 fixed.
// Measured at gatekeeper's own denominator, day by day rather than per cell: 97 core sections
// lost, 100% of them on long-run tier B days and ZERO on any other day type, against 240
// gained. TWO DENOMINATORS, ONE PHENOMENON, and they are not in conflict: on the 288-cell
// WIDE lattice this gate prints the same thing as 400 -> 397 core sections inside the carved
// out set and 3744 -> 3792 outside it. Every loss is inside; outside it the count rises by 48.
// A day where the run owns the training decision is the one place the trunk block is
// SUPPOSED to yield (see D50 carve-out 2, and "the run is the day" in CLAUDE.md), so counting
// those days against a lifting floor is asserting doctrine backwards.
// WHAT SURVIVES: a core section lost anywhere the run does NOT own the day still fails, on
// all 288 cells. The excluded count is printed with its denominator on every run, so the
// carve-out is visible in the output and can never shrink silently.
{
  if (CAND.lrtOK) ok("B1b classified long-run days with the engine's own _longRunTier (the same predicate D50 uses; no second copy lives in this gate)");
  else bad('B1b the file under test exposes no _longRunTier — the carve-out could not be applied and the claim below is asserted on EVERY day, long-run tiers included');
  const cTiers = CAND.lrTiers || { A:0, B:0, C:0 };
  console.log('       CARVE-OUT, printed with its denominator: ' + CAND.lrDays + '/' + CAND.dayBuilds +
    ' day-builds are NRC long-run tier days (A ' + (cTiers.A||0) + ', B ' + (cTiers.B||0) + ', C ' + (cTiers.C||0) +
    '), carrying ' + CAND.lrCore + ' core sections that B1b does not count' +
    (BASE ? '. V' + BASE_VER + ': ' + BASE.lrDays + '/' + BASE.dayBuilds + ' day-builds, ' + BASE.lrCore + ' core sections excluded' : ''));
  const perInj = {};
  for (const t of INJS) perInj[t] = { c:0, b:0 };
  if (BASE){
    // The transcribed fallback and the live baseline must agree, or the table is a fossil
    // and the sabotage runs that lean on it are testing a number nobody maintains.
    if (BASE_VER === '192' && !USE_FULL){
      const bInj = {};
      for (const t of INJS) bInj[t] = 0;
      for (const c of CELLS) bInj[c.inj] += BASE.cells[c.key].coreSecNL;
      const mism = INJS.filter(t => bInj[t] !== V192_CORE_NONLR_WIDE[t]);
      if (!mism.length) ok('B1b the transcribed V192 off-long-run core census matches the live V192 baseline on all ' + INJS.length + ' injury paths (' + INJS.map(t => bInj[t]).join('/') + ')');
      else bad('B1b the transcribed V192 off-long-run core census disagrees with the live baseline on: ' + mism.map(t => t + ' live ' + bInj[t] + ' vs table ' + V192_CORE_NONLR_WIDE[t]).join(', '));
    } else {
      // A baseline WAS handed in, but not one this claim can be made against. It printed
      // nothing at all before — no ok, no skip marker, no defer — which is the one thing a
      // gate may never do with a claim it did not make.
      na('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
        BASE_VER === '192'
          ? 'the baseline is v192 but the table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells'
          : 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the fallback table is still the V192 truth');
    }
    if (CAND.lrDays === BASE.lrDays) ok('B1b the carve-out covers the SAME ' + CAND.lrDays + ' day-builds on both versions — V193 did not move which days the run owns');
    else bad('B1b the carve-out covers ' + CAND.lrDays + ' day-builds on the candidate but ' + BASE.lrDays + ' on V' + BASE_VER + ' — the exclusion set itself moved, so the comparison below is not like for like');
    const lost = [];
    let totC = 0, totB = 0;
    for (const c of CELLS){
      const nc = CAND.cells[c.key].coreSecNL, nb = BASE.cells[c.key].coreSecNL;
      totC += nc; totB += nb;
      perInj[c.inj].c += nc; perInj[c.inj].b += nb;
      if (nc < nb) lost.push({ tag: c.tag, from: nb, to: nc, d: nb - nc });
    }
    for (const t of INJS) console.log('       core sections off long-run days ' + t.padEnd(18) + ' V' + BASE_VER + ' ' + String(perInj[t].b).padStart(5) + ' -> ' + String(perInj[t].c).padStart(5) + '  delta ' + (perInj[t].c-perInj[t].b>=0?'+':'') + (perInj[t].c-perInj[t].b));
    console.log('       core sections off long-run days, total ' + totB + ' -> ' + totC + ' over ' + CELLS.length + ' cells');
    const lostN = lost.reduce((a,x)=>a+x.d,0);
    if (!lost.length) ok('B1b no cell lost a core section vs V' + BASE_VER + ' on any day the run does not own (0 lost over ' + CELLS.length + ' cells / ' + totB + ' baseline core sections, ' + BASE.lrCore + ' long-run-tier core sections excluded)');
    else bad('B1b ' + lostN + ' core sections LOST vs V' + BASE_VER + ' OFF the long-run tiers in ' + lost.length + '/' + CELLS.length + ' cells:\n         ' +
      lost.slice(0,10).map(x => x.tag + '  ' + x.from + ' -> ' + x.to).join('\n         '));
  } else {
    // NO BASELINE HANDED IN. B1b used to skip outright here, which meant the sabotage runner
    // — which never passes a baseline — could not cover this claim at all, and an assertion
    // no mutation can trip is not proof of anything. Same fallback shape B3 and B4 already
    // use: a table transcribed off the V192 artifact, applied only on the lattice it was
    // typed against, and cross-checked against the live baseline whenever one IS supplied.
    defer('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
      'no baseline file supplied; the table is applied as a floor below but nothing on this run confirms it is still the V192 truth');
    if (USE_FULL){
      info('B1b no baseline and IA_LATTICE=full — the V192 fallback table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and cannot be applied to ' + CELLS.length + ' cells; skipped');
    } else {
      let below = [];
      for (const c of CELLS) perInj[c.inj].c += CAND.cells[c.key].coreSecNL;
      for (const t of INJS){
        const want = V192_CORE_NONLR_WIDE[t];
        console.log('       core sections off long-run days ' + t.padEnd(18) + ' V192 table ' + String(want === undefined ? '?' : want).padStart(5) + ' -> ' + String(perInj[t].c).padStart(5));
        if (want !== undefined && perInj[t].c < want) below.push(t + ' ' + perInj[t].c + ' < ' + want);
      }
      if (!below.length) ok('B1b core sections off the long-run tiers are at or above the transcribed V192 census on ' + INJS.length + '/' + INJS.length + ' injury paths (no baseline file supplied)');
      else bad('B1b core sections LOST vs the transcribed V192 census off the long-run tiers on ' + below.length + '/' + INJS.length + ' injury paths: ' + below.join(', '));
    }
  }
}

// ── B2: zero empty sections anywhere, every type ───────────────────────────
{
  let empty = 0, sections = 0, detail = [];
  for (const e of EQUIP){ empty += CAND.tiers[e].emptySec; sections += CAND.tiers[e].sections; detail = detail.concat(CAND.tiers[e].emptyDetail); }
  console.log('       sections swept ' + sections + ', empty ' + empty);
  if (empty === 0) ok('B2 zero empty sections in ' + sections + '/' + sections + ' sections swept over ' + CELLS.length + ' cells (all types: core, hip, optional, plain)');
  else bad('B2 ' + empty + '/' + sections + ' sections render with 0 items: ' + detail.slice(0,5).join(' ; '));
}

// ── B3: prehab delta vs V192, on both lattices ─────────────────────────────
function prehabClaim(tag, cand, base, handTable, tableApplies){
  const basePrehab = {};
  for (const e of EQUIP) basePrehab[e] = (base && !(!tableApplies && !base)) ? base.tiers[e].prehab : handTable[e];
  // THE V192-SPECIFIC CROSS-CHECK. This claim needs a baseline that IS V192; it cannot be
  // made against any other version and it cannot be made with no baseline at all. It used to
  // print a `--` line in those modes, which reads as commentary next to a wall of `ok`. It
  // now DEFERS BY NAME on every axis on which it is not made, same mechanism as the
  // no-baseline block above: a claim that announces nothing is indistinguishable from a claim
  // that passed, and that is the hole this whole pass exists to close.
  const XCHK = 'B3 ' + tag + ': live-baseline cross-check of the hand-transcribed V192 prehab census';
  if (base && !tableApplies){
    info('B3 ' + tag + ': hand-table cross-check skipped — the table was transcribed against the ' +
      LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The delta below is taken against the live baseline on the SAME cells, so it stands.');
    na(XCHK, 'the census was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells, so the table is not comparable to this baseline');
  } else if (base && BASE_VER === '192'){
    const mism = EQUIP.filter(e => base.tiers[e].prehab !== handTable[e]);
    if (!mism.length) ok('B3 ' + tag + ': live V192 baseline agrees with the hand-transcribed prehab census on all six tiers');
    else bad('B3 ' + tag + ': baseline claims v192 but its prehab census disagrees with the hand table on: ' +
      mism.map(e => e+' live '+base.tiers[e].prehab+' vs table '+handTable[e]).join(', '));
  } else if (base){
    info('B3 ' + tag + ': baseline is v' + BASE_VER + ', not v192 — hand-table cross-check skipped');
    na(XCHK, 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the hand table is still the V192 truth');
  } else {
    defer(XCHK, 'no baseline file supplied; the table is applied as the floor below but nothing on this run confirms it is still the V192 truth');
  }
  // THE FLOOR IS THE V192 CENSUS, NEVER THE LIVE BASELINE. FLOOR_AGG is the hand sum of the
  // transcribed tables at the top of this file and is asserted to equal that sum on every
  // run, so a typo in the table or in this constant fails rather than lowering the bar.
  const FLOOR_AGG = { wide: 22671, narrow: 2697 };
  let aggC = 0, aggT = 0, aggB = 0, below = [], belowBase = [];
  for (const e of EQUIP){
    const c = cand.tiers[e].prehab, t = handTable[e], b = basePrehab[e];
    aggC += c; aggT += t; aggB += b;
    console.log('       prehab items [' + tag + '] ' + e.padEnd(11) + ' V192 census ' + String(t).padStart(5) + '  ->  ' + String(c).padStart(5) +
      '   vs census ' + (c-t>=0?'+':'') + (c-t) + (base ? '   vs live V' + BASE_VER + ' ' + (c-b>=0?'+':'') + (c-b) : ''));
    if (c - t < 0) below.push(e + ' ' + c + ' < ' + t);
    if (base && c - b < 0) belowBase.push(e + ' ' + (c-b));
  }
  if (!tableApplies){
    defer('B3 ' + tag + ': prehab FLOOR vs the V192 census, per tier and in aggregate',
      'the census was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. A table applied to the wrong lattice is a lower bar, not a higher one, so it is not applied at all');
  } else {
    if (aggT === FLOOR_AGG[tag]) ok('B3 ' + tag + ': the floor constant ' + FLOOR_AGG[tag] + ' is the hand sum of the six transcribed V192 tier censuses (arithmetic cross-check, no engine involved)');
    else bad('B3 ' + tag + ': the floor constant ' + FLOOR_AGG[tag] + ' does not equal the sum of the transcribed V192 tier censuses (' + aggT + ') \— one of the two was edited without the other and the bar is no longer the number it claims to be');
    if (!below.length) ok('B3 ' + tag + ': prehab is at or above the V192 census on 6/6 tiers (a floor, not a delta \— holding is a pass, growing is a pass, losing an item is not)');
    else bad('B3 ' + tag + ': prehab is BELOW the V192 census on ' + below.length + '/' + EQUIP.length + ' tiers: ' + below.join(', '));
    console.log('       prehab aggregate [' + tag + '] candidate ' + aggC + ' vs V192 census floor ' + FLOOR_AGG[tag] + ' (' + (aggC-aggT>=0?'+':'') + (aggC-aggT) + ' of ' + aggT + ' above the floor).');
    if (aggC >= FLOOR_AGG[tag]) ok('B3 ' + tag + ': prehab aggregate ' + aggC + ' >= the V192 census floor ' + FLOOR_AGG[tag]);
    else bad('B3 ' + tag + ': prehab aggregate ' + aggC + ' has fallen BELOW the V192 census floor ' + FLOOR_AGG[tag] + ' (' + (aggC-FLOOR_AGG[tag]) + ')');
  }
  // THE LIVE-BASELINE DELTA IS REPORT ONLY. "Prehab grew since the last version" is a
  // per-release measure question, and a permanent gate that asserts it fails every release
  // that legitimately holds prehab steady. The per-tier losses vs the live baseline are
  // printed too, so nothing that used to be visible here stops being visible.
  if (base){
    console.log('       REPORT ONLY \— B3 prehab AGGREGATE vs the live baseline [' + tag + '] V' + BASE_VER + ' ' + aggB + ' -> ' + aggC +
      ' (delta ' + (aggC-aggB>=0?'+':'') + (aggC-aggB) + ' of ' + aggB + '), ' + belowBase.length + '/' + EQUIP.length + ' tiers below the live baseline' +
      (belowBase.length ? ': ' + belowBase.join(', ') : '') + '. The AGGREGATE is never gated; the PER-TIER ratchet below is.');
    ok('B3 ' + tag + ': prehab AGGREGATE delta vs the live baseline reported (' + aggB + ' -> ' + aggC + ', ' + belowBase.length + '/' + EQUIP.length + ' tiers down), not gated');
    // THE PER-TIER RATCHET IS GATED, and it is not the aggregate delta wearing a hat. The
    // aggregate `delta > 0` was a change-detector: it fails a version that holds prehab
    // steady, V193 against V193 included. `candidate >= baseline` per tier is a ratchet:
    // holding passes, growing passes, LOSING AN ITEM ON ANY TIER FAILS. It is not redundant
    // with the V192 census floor above, because the floor's headroom is the entire V192->V193
    // growth: a regression that removes fewer items than that slack clears the floor and is
    // caught only here. tests/sabotage.py hands in no baseline, so this claim DEFERS there.
    if (!belowBase.length) ok('B3 ' + tag + ': prehab is at or above the live V' + BASE_VER + ' baseline on ' + EQUIP.length + '/' + EQUIP.length + ' tiers (the RATCHET: a loss small enough to fit inside the V192 floor headroom still fails here)');
    else bad('B3 ' + tag + ': prehab FELL vs the live V' + BASE_VER + ' baseline on ' + belowBase.length + '/' + EQUIP.length + ' tiers: ' + belowBase.join(', ') +
      ' \— still above the V192 census floor, and still a regression against the version this one ships after');
  } else {
    defer('B3 ' + tag + ': prehab AGGREGATE delta vs the live baseline (REPORT ONLY)', 'no baseline file supplied');
    defer('B3 ' + tag + ': prehab per-tier RATCHET vs the live baseline (candidate >= baseline on all ' + EQUIP.length + ' tiers)',
      'no baseline file supplied; the V192 census floor above runs in its place, which is coarser by the whole of the V192->V193 growth');
  }
}
prehabClaim(USE_FULL ? 'full' : 'wide', CAND, BASE, V192_PREHAB_WIDE, !USE_FULL);
prehabClaim('narrow', CAND_N, BASE_N, V192_PREHAB_NARROW, true);

// ── B4a: the budget deletes no non-optional section that V192 kept ─────────
// The bar is zero deletions VS V192, measured three ways so a wash cannot hide a
// regression: per CELL (finest, catches a rise in one config paid for by a fall in
// another), per CLASS (catches a NEW section family becoming budget fodder), and per
// TIER x INJURY (printed, so the shape of the change is visible).
const count = arr => arr.reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{});
function tally(offC, onC){
  const perTier = {}, perTierInj = {}, perCell = {}, kinds = {};
  let added = 0, days = 0;
  for (const e of EQUIP) perTier[e] = { opt:0, non:0, nonEx:0, ruled:0 };
  for (const dk of Object.keys(offC.byDay)){
    days++;
    const p = dk.split('|');
    const inj = p[0], tier = p[1], cellKey = p.slice(0,5).join('|');
    if (perCell[cellKey] === undefined) perCell[cellKey] = 0;
    const A = count(offC.byDay[dk]), B = count(onC.byDay[dk] || []);
    for (const k of Object.keys(A)){
      const d = A[k] - (B[k]||0);
      if (d > 0){
        if (/\|O$/.test(k)) perTier[tier].opt += d;
        else {
          const lbl = k.split('|')[0] || k.split('|')[1] || '(no label)';
          perTier[tier].non += d;
          // D81: the ex-class total is what B4's ratchet runs on. The gross total is still
          // accumulated one line above and still printed, ungated, so the raw shape of the
          // change never disappears behind the exclusion.
          if (RULED_DELETABLE.indexOf(lbl) < 0) perTier[tier].nonEx += d; else perTier[tier].ruled += d;
          perTierInj[tier+'|'+inj] = (perTierInj[tier+'|'+inj]||0) + d;
          perCell[cellKey] += d;
          kinds[lbl] = (kinds[lbl]||0) + d;
        }
      }
    }
    for (const k of Object.keys(B)) if ((B[k] - (A[k]||0)) > 0) added += (B[k] - (A[k]||0));
  }
  return { perTier, perTierInj, perCell, kinds, added, days };
}
{
  const C = tally(CANDOFF, CAND);
  const CN = tally(CAND_N_OFF, CAND_N);
  let baseNon = V192_NONOPT_WIDE, baseNonEx = null, baseKinds = null, basePerCell = null, baseSrc = 'hand-transcribed V192 wide table';
  if (BASE_OFF && BASE){
    const B = tally(BASE_OFF, BASE);
    baseNon = {}; for (const e of EQUIP) baseNon[e] = B.perTier[e].non;
    // D81: BOTH SIDES OR NEITHER. The baseline's own ex-class total is measured by the same
    // tally() on the same lattice, so the exclusion cannot quietly become one-sided.
    baseNonEx = {}; for (const e of EQUIP) baseNonEx[e] = B.perTier[e].nonEx;
    baseKinds = B.kinds; basePerCell = B.perCell; baseSrc = 'live baseline ' + path.basename(BASEFILE);
    if (BASE_VER === '192' && USE_FULL){
      info('B4 hand-table cross-check on the wide sweep skipped — the table was transcribed against the ' +
        LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells. The narrow cross-check below still runs, and the differential is against the live baseline on the same cells.');
      na('B4 baseline-identity cross-check against the transcribed V192 WIDE non-optional-deletion table',
        'the table was transcribed against the ' + LAT.WIDE_N + '-cell lattice and this run uses ' + CELLS.length + ' cells; the narrow cross-check below still runs');
      const BN0 = tally(BASE_N_OFF, BASE_N);
      const mismN0 = EQUIP.filter(e => BN0.perTier[e].non !== V192_NONOPT_NARROW[e]);
      if (!mismN0.length) ok('B4 baseline still agrees with the historical NARROW table (the 30-build sweep the old gate used)');
      else bad('B4 baseline disagrees with the historical narrow table on: ' + mismN0.map(e => e+' live '+BN0.perTier[e].non+' vs table '+V192_NONOPT_NARROW[e]).join(', '));
    } else if (BASE_VER === '192'){
      const mism = EQUIP.filter(e => baseNon[e] !== V192_NONOPT_WIDE[e]);
      if (!mism.length) ok('B4 live V192 baseline agrees with the hand-transcribed WIDE non-optional-deletion table on all six tiers');
      else bad('B4 baseline claims v192 but its wide non-optional deletions disagree with the hand table on: ' +
        mism.map(e => e+' live '+baseNon[e]+' vs table '+V192_NONOPT_WIDE[e]).join(', '));
      const BN = tally(BASE_N_OFF, BASE_N);
      const mismN = EQUIP.filter(e => BN.perTier[e].non !== V192_NONOPT_NARROW[e]);
      if (!mismN.length) ok('B4 the same baseline still agrees with the historical NARROW table (the 30-build sweep the old gate used)');
      else bad('B4 baseline disagrees with the historical narrow table on: ' + mismN.map(e => e+' live '+BN.perTier[e].non+' vs table '+V192_NONOPT_NARROW[e]).join(', '));
    } else {
      // Same hole as B1b above: with a V193 baseline these two cross-checks silently did not
      // happen and nothing on the run said so. The no-baseline block defers this claim by
      // name already; the wrong-version axis now uses the identical name and mechanism.
      na('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)',
        'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms either table is still the V192 truth');
    }
  }
  // D81 AMENDMENT. The per-tier RATCHET now runs on non-optional deletions EXCLUDING the
  // coach-ruled-deletable classes, on BOTH sides. The GROSS per-tier numbers are still
  // computed and still printed on every run, ungated, so nobody loses the raw shape behind
  // the exclusion — but the gross total is NOT what fails the build, because coach has
  // ruled the excluded class deletable by contract. The per-tier ratchet was NOT relaxed
  // from 792 to 861 or to any other number: V194 refused that weakening on B3 and it is
  // refused here too. The bar is still "no tier rises", on a narrower and named base.
  let roseEx = [], totCEx = 0, totBEx = 0;
  if (!baseNonEx){
    // No live baseline (every sabotage run). Fall back to the hand tables, subtracting the
    // TRANSCRIBED V192 ruled-class deletions from the TRANSCRIBED V192 totals — the same
    // exclusion on the same side of the ledger, never the candidate alone.
    baseNonEx = {}; for (const e of EQUIP) baseNonEx[e] = V192_NONOPT_WIDE[e] - V192_RULED_DEL_WIDE[e];
  }
  let rose = [], totC = 0, totB = 0;
  for (const e of EQUIP){
    totC += C.perTier[e].non; totB += baseNon[e];
    totCEx += C.perTier[e].nonEx; totBEx += baseNonEx[e];
    if (C.perTier[e].nonEx > baseNonEx[e]) roseEx.push(e + ' ' + C.perTier[e].nonEx + ' > ' + baseNonEx[e]);
    console.log('       budget-deleted sections ' + e.padEnd(11) + ' optional ' + String(C.perTier[e].opt).padStart(4) +
      '   non-optional ' + String(C.perTier[e].non).padStart(4) + '/' + baseNon[e] + ' (V192)' +
      '   ex-ruled ' + String(C.perTier[e].nonEx).padStart(4) + '   ruled-deletable ' + String(C.perTier[e].ruled).padStart(4));
    if (C.perTier[e].non > baseNon[e]) rose.push(e + ' ' + C.perTier[e].non + ' > ' + baseNon[e]);
  }
  console.log('       EX-CLASS per-tier deletion table (the ratchet B4 gates on), excluding [' + RULED_DELETABLE.join(', ') + ']:');
  for (const e of EQUIP)
    console.log('         ' + e.padEnd(11) + ' candidate ' + String(C.perTier[e].nonEx).padStart(5) +
      '   baseline ' + String(baseNonEx[e]).padStart(5) + '   delta ' + ((C.perTier[e].nonEx - baseNonEx[e]) >= 0 ? '+' : '') + (C.perTier[e].nonEx - baseNonEx[e]));
  console.log('         aggregate    candidate ' + String(totCEx).padStart(5) + '   baseline ' + String(totBEx).padStart(5) +
    '   delta ' + ((totCEx - totBEx) >= 0 ? '+' : '') + (totCEx - totBEx));
  console.log('       REPORT ONLY — GROSS (ruled-deletable classes INCLUDED) aggregate ' + totB + ' -> ' + totC +
    ' (delta ' + ((totC - totB) >= 0 ? '+' : '') + (totC - totB) + '), rose on ' + rose.length + '/' + EQUIP.length +
    ' tiers' + (rose.length ? ': ' + rose.join(', ') : '') + '. Ungated by D81, printed so the raw shape stays visible.');
  for (const t of INJS){
    const line = EQUIP.map(e => e.slice(0,4) + ' ' + String(C.perTierInj[e+'|'+t]||0).padStart(4)).join('  ');
    console.log('         by injury ' + t.padEnd(18) + line);
  }
  console.log('       source of the V192 numbers: ' + baseSrc + '. Day-builds swept ' + C.days + ' (wide), ' + CN.days + ' (narrow).');
  if (!roseEx.length) ok('B4 non-optional section deletions EXCLUDING the coach-ruled-deletable classes [' + RULED_DELETABLE.join(', ') +
    '] ' + totCEx + '/' + totBEx + ' vs ' + baseSrc + ' — no tier rose (' + EQUIP.length + '/' + EQUIP.length + ' tiers). Gross, ungated: ' + totC + '/' + totB + '.');
  else bad('B4 non-optional section deletions EXCLUDING [' + RULED_DELETABLE.join(', ') + '] ROSE vs ' + baseSrc + ' on ' +
    roseEx.length + '/' + EQUIP.length + ' tiers: ' + roseEx.join(', ') +
    ' \— this is NOT the ruled class being trimmed, it is work nobody ruled deletable going missing');

  // per CELL — REPORTED WITH ITS DENOMINATOR AND THE REPRO CELL, NEVER GATED.
  // Coach filed this to §12 as explicitly non-blocking. The rise sits on
  // lowback/protect bodyweight hypertrophy intermediate, which is the tightest cell in the
  // matrix BY DESIGN: bodyweight assumes no bands, hypertrophy asks for volume the tier
  // cannot supply, and the budget resolves the contradiction the only way it can, by
  // deleting. One extra deletion in four cells, against roughly twelve hundred fewer
  // deletions overall, is the tight cell behaving as ruled, not a regression. Coach ruled on
  // "1,242 fewer overall"; re-measured on this lattice the aggregate fall is 1,266. Both are
  // written down rather than one being quietly overwritten, and the live figure is printed
  // below on every run. If the four-cell count climbs off that cell it is a different
  // finding, and the printed repro list is how you see it.
  if (basePerCell){
    const up = [];
    let newTot = 0;
    for (const k of Object.keys(C.perCell)){
      const d = C.perCell[k] - (basePerCell[k]||0);
      if (d > 0){ up.push(k + '  ' + (basePerCell[k]||0) + ' -> ' + C.perCell[k]); newTot += d; }
    }
    console.log('       REPORT ONLY — B4b new non-optional deletions per cell: ' + newTot + ' new in ' +
      up.length + '/' + Object.keys(C.perCell).length + ' cells' + (up.length ? ':\n         ' + up.slice(0,10).join('\n         ') : ' (none)'));
    ok('B4b per-cell non-optional deletions reported with denominator (' + up.length + '/' + Object.keys(C.perCell).length + ' cells, ' + newTot + ' new), not gated — coach, §12');
  }

  // per CLASS — a class V192 never emptied is new fodder, and growth in a class V192 did
  // empty is the same regression measured by family.
  const allowed = baseKinds ? Object.keys(baseKinds) : Object.keys(V192_NONOPT_CLASSES_WIDE);
  const newKinds = Object.keys(C.kinds).filter(k => allowed.indexOf(k) < 0);
  if (!newKinds.length) ok('B4c the budget empties no non-optional class V192 left alone (' + Object.keys(C.kinds).length + ' classes, all within the ' + allowed.length + ' V192 emptied)');
  else bad('B4c the budget emptied non-optional section classes V192 never touched: ' + newKinds.join(', '));
  if (baseKinds){
    // per CLASS GROWTH — REPORTED, NEVER GATED. Coach rejected the reasoning behind the old
    // assertion: a per-class deletion count has no denominator, and V193 moved the
    // denominator on purpose. Total non-optional deletions fell in the same run, so a
    // class-level rise inside a roughly 19% aggregate fall is COMPOSITION, not loss. Coach
    // ruled on 6,527 -> 5,285; re-measured on this lattice it is 6,527 -> 5,261, a fall of
    // 1,266 of 6,527 (19.4%). The live pair is printed below, never assumed from here.
    // COACH'S INSTRUCTION, standing: re-express per-class deletions as a SHARE OF PER-CLASS
    // PRESCRIPTIONS before anyone rules on them again. Until that denominator exists, the
    // raw counts below are evidence and nothing more.
    const grew = Object.keys(C.kinds).filter(k => (C.kinds[k] > (baseKinds[k]||0)));
    console.log('       REPORT ONLY — B4d per-class non-optional deletions grew for ' + grew.length + '/' +
      Object.keys(C.kinds).length + ' classes' + (grew.length ? ': ' + grew.map(k=>'"'+k+'" '+C.kinds[k]+' > '+(baseKinds[k]||0)).join(', ') : '') +
      '. Aggregate non-optional deletions ' + totB + ' -> ' + totC + ' (delta ' + (totC-totB>=0?'+':'') + (totC-totB) + '), which is the denominator these counts have to be read against.');
    ok('B4d per-class non-optional deletions reported (' + grew.length + '/' + Object.keys(C.kinds).length + ' classes grew, aggregate ' + totB + ' -> ' + totC + '), not gated — coach, §12');
    const shrank = Object.keys(baseKinds).filter(k => (C.kinds[k]||0) < baseKinds[k]).length;
    console.log('       non-optional deletion classes: ' + shrank + ' shrank, ' + Object.keys(C.kinds).filter(k => C.kinds[k] > (baseKinds[k]||0)).length + ' grew, of ' + allowed.length + ' V192 classes');
    console.log('       V193 ' + JSON.stringify(C.kinds));
    console.log('       V192 ' + JSON.stringify(baseKinds));
  }
  // ── B4g (D81, GATED): the ruling's POSITIVE claim ──────────────────────────
  // D81 does not only permit a deletion, it asserts a gain: with the isolation band taking
  // the trim the way the docstring always said it would, the LEG COMPOUNDS are better
  // protected than they were. 'Leg superset A' is the lunge/knee-stability pair and
  // 'Leg superset B' is the second compound pair; both are the day's real leg work. This is
  // STRICT inequality on purpose. `<=` would pass on a version that changed nothing, and no
  // engine satisfies a strict fall by accident — it is the one claim here that cannot be met
  // by the budget simply doing less.
  const LEG_COMPOUND_CLASSES = ['Leg superset A', 'Leg superset B'];   // D81
  {
    const cSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + (C.kinds[k]||0), 0);
    const bSum = LEG_COMPOUND_CLASSES.reduce((a,k) => a + ((baseKinds ? baseKinds[k] : V192_NONOPT_CLASSES_WIDE[k])||0), 0);
    const bWho = baseKinds ? baseSrc : 'hand-transcribed V192 wide class census';
    const per = LEG_COMPOUND_CLASSES.map(k => k + ' ' + ((baseKinds ? baseKinds[k] : V192_NONOPT_CLASSES_WIDE[k])||0) + ' -> ' + (C.kinds[k]||0)).join(', ');
    console.log('       B4g leg-compound deletions: ' + per);
    if (cSum < bSum) ok('B4g leg-compound section deletions FELL strictly vs ' + bWho + ': ' + bSum + ' -> ' + cSum +
      ' (' + (cSum - bSum) + '). D81\'s positive claim: the compounds are better protected than they were.');
    else bad('B4g leg-compound section deletions did not fall strictly vs ' + bWho + ': ' + bSum + ' -> ' + cSum +
      '. D81 claims the isolation band takes the trim SO THAT the compounds stop taking it; ' + per);
  }

  if (C.added === 0) ok('B4e the budget pass only removes, never adds (0 sections appeared in ' + C.days + ' day-builds)');
  else bad('B4e ' + C.added + ' sections appeared post-budget — the B4 differential is not a clean subsequence');
}

// ── B4f/O5: hand-built session, hand-derived trim ──────────────────────────
// Lattice-free by construction: this is arithmetic on a session literal, so widening the
// sweep does not touch it and it stays the one place the trim ORDER is pinned.
// Costs, by the documented model: stretches 0; carries / holds / planks / pallof 0.5x sets;
// everything else 1x sets. Cap with no cardio = 20. Section rank: protected -1; optional or
// carry/finisher/conditioning/explosive 3; superset B / isolation / calves / pump / accessory
// 2; everything else 1. Item rank: carry 2, wall sit or hold 1, else 0. Score = rank*10 +
// itemRank; ties break to the LATER position in the day.
//   S0 Main lift    Back squat 6x5                          6.0  protected (/^main/)
//   S1 Accessory A  DB walking lunge 3x10, Leg curl 3x12     3.0+3.0  rank 2 -> 20, 20
//   S2 Chest + knee DB lateral raise 3x12, Wall sit 3x25 sec 3.0+1.5  rank 1 -> 10, 11
//   S3 Core         Pallof press 4x10, Side plank 4x30 sec   2.0+2.0  optional
//   S4 Isolation    Dumbbell curl 4x12                       4.0      rank 2 -> 20
// total 24.5 against a cap of 20. Four and a half units have to go.
// BY HAND, D48: S3 is optional with TWO items, so the clause unprotects it and it ranks 3.
// Its items both score 30; the tie breaks LATER, so Side plank goes first. 22.5 left. S3 now
// holds ONE item, so the floor declines to unprotect it and s.core protects it. Next highest
// is 20, held by three items, and the latest of those is the Dumbbell curl. It goes, S4
// empties and is removed. 18.5 <= 20, stop.
// EXPECTED: Main[Back squat] | Accessory A[both] | Chest + knee[both] | Core[Pallof press]
// Under the bare D47 clause step two instead takes Pallof press (score 30), which empties S3
// and DELETES the core section, leaving the Dumbbell curl standing. That is the 62-in-540
// disease reproduced in one hand session: this assertion is the difference between D47 and D48.
//
// NOTE, hand-derived and deliberate: D48 does not make every one-item optional section
// untouchable. The clause only declines to strip protection early; a section that earns no
// protection from its own flags or label (a lone 'Loaded carry finisher') is still budget
// fodder, exactly as in V192. Only sections that WOULD be protected but for the optional flag
// — core, hip, main — get their protection back at one item. That is the ruling: an optional
// section is unprotected only while it still has something to give.
function handSession(withOptional){
  const s = [
    {label:'Main lift', items:[{name:'Back squat', detail:'6×5'}]},
    {label:'Accessory A', items:[{name:'Dumbbell walking lunge', detail:'3×10'},{name:'Leg curl', detail:'3×12'}]},
    {label:'Chest + knee', superset:true, items:[{name:'Dumbbell lateral raise', detail:'3×12'},{name:'Wall sit', detail:'3×25 sec'}]},
    {label:'', core:true, pillar:'anti_rotation', coreHeader:'Core — Anti-rotation', items:[{name:'Pallof press', detail:'4×10'},{name:'Side plank', detail:'4×30 sec'}]},
    {label:'Isolation', items:[{name:'Dumbbell curl', detail:'4×12'}]},
  ];
  if (withOptional) s[3].optional = true;
  return s;
}
const shape = out => out.map(s => (clean(s.label)||clean(s.coreHeader)) + '[' + (s.items||[]).map(i=>clean(i.name)).join(', ') + ']').join(' | ');

const EXPECT_D48 = 'Main lift[Back squat] | Accessory A[Dumbbell walking lunge, Leg curl] | Chest + knee[Dumbbell lateral raise, Wall sit] | Core — Anti-rotation[Pallof press]';
// Same day with NO optional flag: S3 is a plain core section, protected from the first pass,
// so the budget never reaches it and must shed 4.5 units from S1, S2 and S4 alone. Highest is
// 20, latest of those is the Dumbbell curl -> 20.5, S4 removed. Still over. 20 again, now the
// latest is Leg curl -> 17.5. Stop.
// This is the V192 order for non-optional sections and is asserted against V192 as well.
const EXPECT_PLAIN = 'Main lift[Back squat] | Accessory A[Dumbbell walking lunge] | Chest + knee[Dumbbell lateral raise, Wall sit] | Core — Anti-rotation[Pallof press, Side plank]';
{
  const capFn = IA.eval('capSessionBudget');
  IA.eval('globalThis.__BUDGET_OFF = false; globalThis.__CAP_OFF = false;');
  const gotOpt = shape(capFn(handSession(true), null));
  if (gotOpt === EXPECT_D48) ok('B4f/O5 hand session (24.5 units vs cap 20) trims exactly as hand-derived under D48, and the core section survives at one item');
  else bad('B4f/O5 hand session under D48\n         expected: ' + EXPECT_D48 + '\n         got     : ' + gotOpt);

  const gotPlain = shape(capFn(handSession(false), null));
  if (gotPlain === EXPECT_PLAIN) ok('B4f/O5 same session with no optional flag trims in the hand-derived non-optional order');
  else bad('B4f/O5 hand session with no optional flag\n         expected: ' + EXPECT_PLAIN + '\n         got     : ' + gotPlain);

  if (IB_BASE){
    const baseFn = IB_BASE.eval('capSessionBudget');
    IB_BASE.eval('globalThis.__BUDGET_OFF = false; globalThis.__CAP_OFF = false;');
    const gotBase = shape(baseFn(handSession(false), null));
    if (gotBase === gotPlain) ok('B4f trim order for non-optional sections is unchanged vs ' + path.basename(BASEFILE) + ' (v' + IB_BASE.version + ')');
    else bad('B4f trim order for non-optional sections CHANGED vs baseline\n         baseline: ' + gotBase + '\n         candidate: ' + gotPlain);
  }
}

// ── B5: thin core — REPORTED, NEVER GATED ──────────────────────────────────
// PRINTED ON BOTH LATTICES ON PURPOSE. Coach approved "thin core is acceptable" while
// looking at the narrow figure. The wide figure is a different number on a different
// population and coach has to see both before that approval means anything.
{
  const line = (tag, cen, base) => {
    let thin = 0, total = 0;
    for (const e of EQUIP){ thin += cen.tiers[e].thinCore; total += cen.tiers[e].coreSec; }
    let bs = '';
    if (base){
      let tb = 0, cb = 0;
      for (const e of EQUIP){ tb += base.tiers[e].thinCore; cb += base.tiers[e].coreSec; }
      bs = '   V' + BASE_VER + ' was ' + tb + '/' + cb + ' (' + (cb ? (100*tb/cb).toFixed(2) : '0.00') + '%)';
    }
    console.log('       REPORT ONLY — thin core [' + tag + '] ' + thin + '/' + total + ' (' + (100*thin/total).toFixed(2) + '%)' + bs);
    return thin + '/' + total;
  };
  for (const e of EQUIP) console.log('       thin core [wide] ' + e.padEnd(11) + ' ' + String(CAND.tiers[e].thinCore).padStart(4) + '/' + CAND.tiers[e].coreSec);
  for (const t of INJS) console.log('       thin core [wide] by injury ' + t.padEnd(18) + ' ' + String(CAND.byInj[t].thinCore).padStart(4) + '/' + CAND.byInj[t].coreSec +
    (BASE ? '   V' + BASE_VER + ' ' + BASE.byInj[t].thinCore + '/' + BASE.byInj[t].coreSec : ''));
  const w = line('wide', CAND, BASE);
  const n = line('narrow', CAND_N, BASE_N);
  console.log('       One hard trunk piece done properly on a tight day is a coachable prescription. A rise here is NOT a regression and is never asserted against. It is coach\'s call, not this gate\'s.');
  ok('B5 thin core reported with BOTH denominators (wide ' + w + ', narrow ' + n + '), not gated');
}

if (fails.length){ console.log('\nfailures:'); fails.forEach(f => console.log('  ' + f)); }
if (defers.length){
  console.log('\nDEFERRED (' + defers.length + ') — UNDER-INVOKED: claims this run did NOT make and COULD have:');
  defers.forEach(d => console.log('  ' + d));
  console.log('  This is actionable. ' + (BASEFILE
    ? 'A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '), so these are not the missing-baseline case: read each reason above and re-invoke accordingly, for example without IA_LATTICE=full.'
    : 'Hand it a baseline (argv[3]) to make these claims. With no baseline at all, every claim that needs one is under-invoked, the V192-specific ones included.'));
  console.log('  It is NOT a full pass of this gate and the exit code (3) says so, whatever the PASS line below reads.');
}
if (nas.length){
  console.log('\nNOT APPLICABLE (' + nas.length + ') — BY DESIGN: claims that do not apply to this invocation. Nothing here is a defect and none of it moves the exit code:');
  nas.forEach(d => console.log('  ' + d));
  console.log('  A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '); each claim above needs an artifact this run legitimately does not have — a V192 artifact, or the lattice the hand tables were transcribed against. On the ship invocation that is the correct state and will be true of every ship run from now on, so it exits 0. The claims are still named here rather than skipped, and this count is NEVER added to the DEFERRED count above: under-invocation is fixable and this is not.');
}
// The summary line itself is byte-shaped for the summary regex in tests/sabotage.py and for
// tests/gate.sh, which both anchor on the end of that line, so both blocks above go BEFORE it
// and neither is ever appended to it.
console.log('\nPASS ' + PASS + ' FAIL ' + FAIL);
// FAIL wins, then under-invocation (3), then clean (0). NOT APPLICABLE never appears here.
process.exit(FAIL ? 1 : (defers.length ? 3 : 0));
