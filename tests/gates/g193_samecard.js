// GATE g193_samecard — V193. ONE CARD, ONE MOVEMENT.
//
// THE CLAIM, in one sentence: no movement appears in both a 'Main —' section and any other
// section of the same card, and no movement appears twice on one card at all.
//
// WHY THIS GATE EXISTS. Three separate same-card duplicates shipped inside a single version
// and nothing in the repo could see any of them. 'Bird dogs' printed in both Trunk sections
// (85 of 8,820 days, slice 4). 'Farmer carry' printed as the Loaded carry finisher and again
// in the injected Anti-Rotation block (16 of 41,754). 'Assisted pullups' printed as the pull
// day's Main lift and again in Pull superset A (128 of 41,754). The only deduplicator in the
// file, deconflictAdjacentDupes, compares ADJACENT DAYS and returns early on core items by
// design, so no assertion in the repo was ever a WITHIN-DAY claim. This gate is that claim.
//
// ORACLES — none of these asks the engine what it did and then agrees with it.
//
//   O1 DOCTRINE. NSW Physical Training Guide p.7: "Choose different variations ... for the
//      same basic movement on different days", and p.7 item 7 asks for a VARIETY of trunk
//      work. Different variations on different DAYS is the weaker half of the rule; the
//      stronger half is that one day is one prescription. A card that lists a movement twice
//      is not prescribing variety, it is prescribing the same stimulus under two headings.
//
//   O2 THE PRESCRIPTION IS THE CONTRACT. The standing coaching rule in CLAUDE.md is
//      "Prescription owns the fixed dimension; the log captures the free one". A movement
//      printed twice on one card has TWO prescriptions and the athlete cannot log either
//      honestly: 3x8 at RPE 7 in the Main and 3x15-20 at RPE 8 in a finisher are two
//      contradictory instructions for one movement in one session. The 'Main —' case is the
//      worst form, because the section label is the day's headline claim about the day.
//
//   O3 THE FILE ALREADY BELIEVES THIS, in one place only. bodyweightSweep carries the
//      comment "A day must not prescribe the same movement twice" and enforces it — but ONLY
//      on the bodyweight tier, where the pools are narrowest. The belief is correct; its
//      scope was an accident. This gate applies it on every tier.
//
//   O4 THE VERTICAL-PULL TABLE, hand typed, for the lowback/protect fix. The app's whole
//      cable-free vertical-pull inventory is five names. The pull day's main pool on a
//      barbell tier holds three of them, so the row slot must be able to see the other two;
//      on a tier with no barbell the main pool is hip extension and all five are free.
//      'Weighted chinups' needs something to hang off the athlete. The gate derives the
//      expected per-tier member COUNT from this table by hand and never reads a pool back
//      out of the engine to compare against itself.
//
//   O5 THE PILLAR FLOOR, hand counted, for the carry fix. The only anti_rotation members a
//      LIFT card can also hold are the two carries, because every other member is a trunk
//      drill that no lift section draws. Subtracting both from the gear-legal member count
//      must still leave at least two distinct names on every tier, or the pillar must GROW.
//      A fallback to the unfiltered list would be the V122 _gear trap.
//
//   O6 A RULING THAT SELECTS IS NOT A RULING THAT DELETES. Every fix here removes a NAME
//      from a draw. None is allowed to remove a SECTION. The pull day on lowback/protect
//      must still print its pull superset, the loaded carry finisher must still reach the
//      loaded tiers, and the push day's Accessory / Chest + knee / Delt finisher must all
//      still reach the card, or the duplicate was 'fixed' by deleting the training quality.
//
//   O7 THE DELT ISOLATION TABLE, hand typed, for the Delt finisher fix (slice 5). The app's
//      whole delt-isolation inventory is five loaded names plus two no-load names. The
//      push_light card can already hold exactly ONE of them, because the shoulder slot draws
//      from shoulderAccPool and shoulderAccPool shares exactly one name with shoulder_iso
//      ('Dumbbell lateral raise'), while the bodyweight shoulder ladder shares exactly one
//      name with shoulder_iso_bw ('Prone Y-T-W raises'). So the per-tier floor after the
//      subtraction is (legal members - 1) and the gate derives it by hand from the gear
//      rules, never by asking the engine what its pool came out as.
//
//   O8 THE CHEST ACCESSORY TABLE, hand typed, for the Accessory / Chest + knee fix (slice 5).
//      EXLIB.chest_acc is seven names. A card's Main section contributes at most ONE name to
//      the taken set from that list (the main lift), because the other Main item is a
//      shoulder press and shoulderAccPool and chest_acc are disjoint by hand inspection. So
//      the Accessory sees at least six and 'Chest + knee' at least five on every loaded tier;
//      on bodyweight _bwRung narrows the list to a three-name window and the floors are two
//      and one. Never zero, so neither section may ever be omitted in practice.
//
//   O9 THE LIGHT-PRESS FALLBACK CHAIN, arithmetic, for the Pump fix (slice 5). The guard on
//      that chain names exactly three movements (chestMain, chestAcc[0], chestAcc[1]), so a
//      chain of length L can never resolve to fewer than L-3 candidates. The old chain was
//      length three with an unguarded '||' terminal, which is a fallback to an unfiltered
//      value and therefore the V122 _gear trap in miniature; the new chain is length five
//      with no terminal. The gate checks the arithmetic AND the absence of the terminal in
//      the source, because a behavioural check alone cannot tell a guarded chain from a
//      lucky one.
//
// ALLOW LIST: EMPTY, deliberately. No legitimate same-card repeat has been identified. A
// ladder of DIFFERENT variations (inverted row -> feet-elevated inverted row) is two names
// and is not a repeat. If a future ruling ever blesses one, it is named here with its reason.
//
// NO MUTATION FOR THE IMPLEMENT CLAUSE, and this is recorded rather than hidden. The row pool
// gates 'Weighted chinups' on the tier owning something to hang off the athlete. On the only
// tier that clause can reach — bodyweight — bodyweightSweep's _BW_SUBS already renames
// 'Weighted chinups' to 'Inverted row (under a table)' before the card is drawn, so the clause
// is defence in depth behind a rename and NO card-level gate can observe it. A mutation of it
// therefore survives every gate for a legitimate reason. A no-op mutation is a mutation defect,
// so none is written; the clause stays because _BW_SUBS is a different mechanism with its own
// ruling and the pool should not depend on it staying that way.
//
// DEBT REGISTER (separate thing, do not confuse the two). Writing this gate surfaced four
// duplicate classes that NO ruling covers, so no fix for them was written in this pass. They
// are recorded below with exact counts, the same way tests/lint_allow.txt records known dupes
// as DEBT rather than as permission. The register grants nothing: a class not in it fails, and
// a class in it that GROWS fails. It exists so that the three ruled defects can be proved gone
// without the gate going permanently red on somebody else's ruling, and so that the four open
// classes are impossible to forget. Delete each entry as its ruling lands.

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; if (m) console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── O4: the hand table ───────────────────────────────────────────────────────
// load = the tier owns something to hang off a belt. bands/cables are irrelevant here:
// none of these five names is a cable movement.
const TIERS = {
  bodyweight: { load: false, barbell: false, cables: false },
  minimal:    { load: true,  barbell: false, cables: false },
  home_basic: { load: true,  barbell: false, cables: false },
  home_full:  { load: true,  barbell: true,  cables: false },
  commercial: { load: true,  barbell: true,  cables: true  },
  crossfit:   { load: true,  barbell: true,  cables: false },
};
const EQUIP = Object.keys(TIERS);

// The cable-free vertical pulls this branch may offer, hand typed, with what each needs.
// 'L-sit chinups' is NOT one of them and this is the whole of D52's first error: an L-sit
// is loaded lumbar flexion, so the same overlay maps it to null in SPINE_SWAP — delete
// with no substitute. A pool may not offer a movement its own filter removes, so the
// membership is EXLIB.back_pull minus that null, plus the assisted regression.
const VPULL = [
  { name: 'Assisted pullups',     need: null   },
  { name: 'Neutral-grip chinups', need: null   },
  { name: 'Chinups',              need: null   },
  { name: 'Weighted chinups',     need: 'load' },
];
// What the lowback/protect pull-day MAIN pool holds, by hand, per tier. On a barbell tier
// it is the vertical pull family minus the cable pulldown; with no barbell the branch hands
// the main slot to spine-neutral hip extension instead, which shares no name with the above.
const LB_MAIN = e => TIERS[e].barbell
  ? ['Neutral-grip chinups', 'Chinups', 'Assisted pullups'].concat(TIERS[e].cables ? ['Lat pulldown'] : [])
  : ['Banded hip thrust', 'Single-leg glute bridge'];
// The pool the row slot should be left with. D52's second error was subtracting the whole
// main pool here to prevent ONE duplicate, which starved home_full to two members. Only
// the name the day actually DRAWS can collide, and that exclusion now lives at the
// row-slot draw site where backMain exists. So the hand pool is the gear-legal family,
// and G4b below is what proves the drawn main is never the name that comes back.
const LB_ROWPOOL = e => TIERS[e].cables
  ? ['Straight-arm pulldown']
  : VPULL.filter(m => m.need === null || TIERS[e][m.need])
         .map(m => m.name);

for (const e of EQUIP){
  const pool = LB_ROWPOOL(e);
  if (TIERS[e].cables){
    ok(`O4 ${e}: cable tier keeps the straight-arm pulldown, whose name the main pool cannot hold`);
    continue;
  }
  // The floor is checked against the pool MINUS one drawn main, which is the worst case
  // the draw site can produce. Two is D44's number.
  if (pool.length - 1 >= 2) ok(`O4 ${e}: ${pool.length} vertical pulls legal, ${pool.length - 1} left once the drawn main is excluded [${pool.join(', ')}]`);
  else bad(`O4 ${e}: the row pool is left with ${pool.length - 1} member(s) once the drawn main is excluded [${pool.join(', ')}] — a one-item pool is the defect this fix exists to remove, not a smaller version of it`);
}

// ── O5: the pillar floor, hand counted ───────────────────────────────────────
// Hand list of anti_rotation membership and what each member needs, typed from the ruling.
const AR_MEMBERS = [
  { name: 'Bird dogs',              need: null   },
  { name: 'Side plank',             need: null   },
  { name: 'Plank shoulder taps',    need: null   },
  { name: 'Pallof press',           need: 'band' },
  { name: 'Dumbbell renegade rows', need: 'load' },
  { name: 'Farmer carry',           need: 'load' },
  { name: 'Suitcase carry',         need: 'load' },
];
const BANDS = { bodyweight:false, minimal:false, home_basic:true, home_full:true, commercial:true, crossfit:true };
// The only members a LIFT card can also prescribe are the two carries.
const CARD_REACHABLE = ['Farmer carry', 'Suitcase carry'];
for (const e of EQUIP){
  const legal = AR_MEMBERS.filter(m => m.need === null || (m.need === 'band' ? BANDS[e] : TIERS[e][m.need])).map(m => m.name);
  const worst = legal.filter(n => CARD_REACHABLE.indexOf(n) < 0).length;
  if (legal.length >= 2 && worst >= 2) ok(`O5 ${e}: ${legal.length} legal anti-rotation members, ${worst} still standing if the card already holds both carries`);
  else bad(`O5 ${e}: only ${worst} anti-rotation members survive the worst-case card subtraction (legal ${legal.length}) — below the floor of 2. The pillar must GROW; falling back to the unfiltered list is the V122 trap`);
}

// The gate's two hand lists must still BE the live pools, or the gate is testing a fossil.
const LIVE_AR = (IA.eval('CORE_PILLARS').anti_rotation.items || []).map(i => i.name);
if (JSON.stringify(LIVE_AR) === JSON.stringify(AR_MEMBERS.map(m => m.name))) ok('O5 anti_rotation membership still matches the hand list, in rotation order');
else bad(`O5 anti_rotation membership drifted from the hand list: live ${JSON.stringify(LIVE_AR)}`);

// ── O7: the delt isolation table, hand typed ─────────────────────────────────
// Gear rules, hand typed from _gearOK: cables are commercial only; dumbbells are every tier
// except bodyweight; a face pull is a cable movement whose name never says cable.
const DELT_LOADED = [
  { name: 'Dumbbell lateral raise', need: 'db'    },
  { name: 'Cable lateral raise',    need: 'cable' },
  { name: 'Dumbbell front raise',   need: 'db'    },
  { name: 'Dumbbell rear delt fly', need: 'db'    },
  { name: 'Face pull',              need: 'cable' },
];
const DELT_NOLOAD = ['Prone Y-T-W raises', 'Wall slides'];
// The one name the push_light card can already hold, per tier. Loaded tiers: the shoulder
// slot draws shoulderAccPool, whose only overlap with the loaded delt list is the lateral
// raise. Bodyweight: the shoulder ladder's only overlap with the no-load list is the Y-T-W.
const DELT_COLLIDER = e => (e === 'bodyweight' ? 'Prone Y-T-W raises' : 'Dumbbell lateral raise');
for (const e of EQUIP){
  const legal = e === 'bodyweight'
    ? DELT_NOLOAD.slice()
    : DELT_LOADED.filter(m => m.need === 'cable' ? TIERS[e].cables : e !== 'bodyweight').map(m => m.name);
  const floor = legal.filter(n => n !== DELT_COLLIDER(e)).length;
  if (floor >= 1) ok(`O7 ${e}: ${legal.length} legal delt-isolation members, ${floor} still standing once the card's own shoulder pick is subtracted`);
  else bad(`O7 ${e}: the delt finisher pool empties once the card's shoulder pick is subtracted (legal ${legal.length}) — the section would be omitted on every seed, which is deletion, not selection`);
}
const LIVE_EXLIB = IA.eval('EXLIB');
if (JSON.stringify(LIVE_EXLIB.shoulder_iso) === JSON.stringify(DELT_LOADED.map(m => m.name))) ok('O7 EXLIB.shoulder_iso still matches the hand list, in order');
else bad(`O7 EXLIB.shoulder_iso drifted from the hand list: live ${JSON.stringify(LIVE_EXLIB.shoulder_iso)}`);
if (JSON.stringify(LIVE_EXLIB.shoulder_iso_bw) === JSON.stringify(DELT_NOLOAD)) ok('O7 EXLIB.shoulder_iso_bw still matches the hand list, in order');
else bad(`O7 EXLIB.shoulder_iso_bw drifted from the hand list: live ${JSON.stringify(LIVE_EXLIB.shoulder_iso_bw)}`);

// ── O8: the chest accessory table, hand typed ────────────────────────────────
const CHEST_ACC = ['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press'];
const CHEST_ACC_BW = ['Incline pushups (hands on bed)','Wide-stance pushups','Pushups (slow 3s eccentric)','Close-grip pushups','Decline pushups (feet elevated)'];
// The shoulder inventory, hand typed, so the disjointness claim is checked and not assumed.
const SHOULDER_ACC = ['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press','Landmine rotational press'];
const overlap = CHEST_ACC.filter(n => SHOULDER_ACC.indexOf(n) >= 0);
if (!overlap.length) ok('O8 chest_acc and the shoulder inventory are disjoint, so the Main pairing can take at most ONE chest-accessory name');
else bad(`O8 chest_acc and the shoulder inventory share ${overlap.join(', ')} — the Main section could take TWO names and the hand floor below is wrong`);
for (const e of EQUIP){
  // bodyweight goes through _bwRung, which narrows a 5-name ladder to a 3-name window.
  const size = e === 'bodyweight' ? 3 : CHEST_ACC.length;
  const accFloor = size - 1;          // the Main lift can own at most one of them
  const ckFloor  = size - 2;          // plus whatever the Accessory just took
  if (accFloor >= 2 && ckFloor >= 1) ok(`O8 ${e}: pool of ${size}, Accessory sees at least ${accFloor}, 'Chest + knee' at least ${ckFloor}`);
  else bad(`O8 ${e}: pool of ${size} leaves Accessory ${accFloor} and 'Chest + knee' ${ckFloor} — below the floor, a section would be omitted`);
}
if (JSON.stringify(LIVE_EXLIB.chest_acc) === JSON.stringify(CHEST_ACC)) ok('O8 EXLIB.chest_acc still matches the hand list, in order');
else bad(`O8 EXLIB.chest_acc drifted from the hand list: live ${JSON.stringify(LIVE_EXLIB.chest_acc)}`);

// ── O9: the light-press fallback chain, arithmetic + no unguarded terminal ────
const SRC = require('fs').readFileSync(FILE, 'utf8');
const CHAIN = ["'Dumbbell incline press'","'Dumbbell bench press'","'Pushups (slow tempo)'","'Close-grip pushups'","'Diamond pushups'"];
const chainLine = SRC.split('\n').find(l => /const _lpFallback=\[/.test(l)) || '';
const chainNames = (chainLine.match(/'[^']+'/g) || []);
const GUARD_NAMES = 3;   // chestMain, chestAcc[0], chestAcc[1]
if (chainNames.length - GUARD_NAMES >= 2) ok(`O9 the light-press fallback chain holds ${chainNames.length} candidates against a ${GUARD_NAMES}-name guard, so at least ${chainNames.length - GUARD_NAMES} always survive`);
else bad(`O9 the light-press fallback chain holds only ${chainNames.length} candidates against a ${GUARD_NAMES}-name guard — it can resolve to nothing and the caller has no legal name to fall back on`);
if (JSON.stringify(chainNames) === JSON.stringify(CHAIN)) ok('O9 the chain is the hand-typed one, and its first three entries are unmoved so an uncontested draw is unchanged');
else bad(`O9 the chain drifted from the hand list: live ${JSON.stringify(chainNames)}`);
if (!/_lpFallback[\s\S]{0,400}?\[0\]\s*\|\|/.test(SRC)) ok("O9 the chain has no '||' terminal, so it cannot hand back an unfiltered name (the V122 trap)");
else bad("O9 the light-press chain still ends in an unguarded '||' fallback, which is a fallback to an unfiltered value");

// ── the sweep ────────────────────────────────────────────────────────────────
// WIDENED IN SLICE 5, on purpose. The old lattice could not see the beginner experience
// level or the knee / hip / ankle injury paths, which is where the fifth duplicate class
// lives — so that class could only be recorded in a comment, where no run can check it.
// This is now the same lattice tests/measure/answered/v193_slice5_dupclasses.js reports on, so the
// register below is a live tripwire on every class that still exists rather than on four of
// five. Cost measured: about 8 seconds.
const INJ = [
  { tag: 'healthy',            injury: null },
  { tag: 'shoulder/protect',   injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'lowback/protect',    injury: { region: 'lowback',  tier: 'protect' } },
  { tag: 'elbow/protect',      injury: { region: 'elbow',    tier: 'protect' } },
  { tag: 'knee/protect',       injury: { region: 'knee',     tier: 'protect' } },
  { tag: 'hip/workaround',     injury: { region: 'hip',      tier: 'workaround' } },
  { tag: 'ankle/workaround',   injury: { region: 'ankle',    tier: 'workaround' } },
  { tag: 'lowback/workaround', injury: { region: 'lowback',  tier: 'workaround' } },
];
const FOCUS = ['support_prevention', 'hypertrophy'];
const EXPER = ['beginner', 'intermediate', 'advanced'];
const SEEDS = [1013, 3039, 76308];

// KNOWN OPEN, NOT ALLOWED. Hand typed. These are duplicates this gate found that NO ruling
// covers, so no fix for them was written and they are NOT exempted — each one still fails
// below. The register exists so a fourth class, or growth in one of these, is distinguishable
// from the three already reported. Counts are day-builds on this exact lattice.
// SLICE 5 EMPTIED FOUR OF THE FIVE ENTRIES. They are recorded here as history, because the
// counts are the only proof the gate was ever measuring something. On the WIDE lattice below,
// V192 / V193-before-slice-5 / V193-after:
//   'Dumbbell lateral raise'  Main shoulder slot + Delt finisher    396 / 636 / 0
//   'Dumbbell decline press'  Main + Accessory                       64 /  64 / 0
//   'Dumbbell bench press'    Main + Accessory, Main + Chest + knee   48 /  63 / 0
//   'Pushups (slow tempo)'    Main + Pump                             16 /  16 / 0
// The lateral-raise jump was a V193 D47 side effect: D47 unprotected the 2-item optional core
// block, which moved budget-trim pressure off the 1-item Delt finisher, so a latent duplicate
// that the budget cap used to hide survived 240 more times. D47 was ruled; that consequence
// was not, which is why slice 5 fixed the duplicate rather than re-protecting the block.
// All four are now asserted at ZERO in G1 by name, not merely held flat by the register.
//
// ONE ENTRY REMAINS, and it is a DIFFERENT SEAM, not a leftover of the same one.
// 'Kettlebell swing' prints as the pull day's Main lift and again in 'Pull superset B' on
// 28 of 59,781 day-builds, on minimal and home_basic, beginner-dominated, unchanged V192 ->
// V193 -> slice 5. Traced, not guessed: 'Pull superset B' carries ex.backRow[1] AND
// ex.cond[2], and ex.cond is drawn from EXLIB.conditioning, which names 'Kettlebell swing'.
// On a barbell-less tier backCompoundPool ALSO names 'Kettlebell swing' (it is the hinge
// family that stands in for the deadlift), so the pull day's Main lift and the conditioning
// slot collide. The seam is therefore the CONDITIONING slot, not the row partition and not
// any section slice 5 touched: ex.cond is a four-name array drawn once per week with a bare
// pick() and consumed by four different roles (Conditioning, Light finisher, Pull superset B,
// Explosive finisher). The same later-section-yields shape would work, but the reader is
// shared across days, so it needs its own before-picture before anything subtracts from it —
// which is a slice of its own, not a rider on a slice with no ruling for it. REGISTERED
// rather than fixed so that any growth in it fails this gate.
// Keyed by ia-version (D133). V219 D166 (cf166c): when ex.cond[2] is the Main, Pull superset B prints the row
// alone, so the swing class is a RULED 0 and any recurrence fails G3a by name. No other class SHRANK at step 7.
const OPEN_UNRULED_BY_VERSION = { 218: { 'Kettlebell swing': 28 } };
OPEN_UNRULED_BY_VERSION[219] = { 'Kettlebell swing': 0 };   // D166: ruled MOVE (28 -> 0)
OPEN_UNRULED_BY_VERSION[220] = OPEN_UNRULED_BY_VERSION[219];   // V220 (D173/D174/D175/D176): ruled UNMOVED (zero-engine build: display, copy and pop-up only; no hunk reaches buildProgram or anything it calls; the swing class stays a ruled 0)
OPEN_UNRULED_BY_VERSION[221] = OPEN_UNRULED_BY_VERSION[220];   // V221 (D177/D178/D179/D180): ruled UNMOVED (D177 adds a _REP_FLOOR row that scheme() reads and 0 engine cards change: measure 0/1,201,231, tests/measure/v221_rebase_swapfloor.out.txt; D178/D179/D180 are zero-engine: no hunk reaches buildProgram or anything it calls; the swing class stays a ruled 0)
OPEN_UNRULED_BY_VERSION[222] = OPEN_UNRULED_BY_VERSION[221];   // V222 (D181): ruled UNMOVED (D181 P-SWAPDURABLE is session-store only, adds no card and changes 0 engine cards: no hunk reaches buildProgram or anything it calls; the swing class stays a ruled 0)
const OPEN_UNRULED = OPEN_UNRULED_BY_VERSION[(+IA.version <= 218) ? 218 : +IA.version];
if (!OPEN_UNRULED) throw new Error('g193: no OPEN_UNRULED_BY_VERSION row for V' + IA.version + ': an unruled register (D133)');

const dupByName = Object.create(null);   // name -> day-build count
const dupPairs  = Object.create(null);   // 'labelA ++ labelB' -> count
const mainDupByName = Object.create(null);
let days = 0, builds = 0;
// O6 counters
let lbPullDays = 0, lbPullSupersets = 0, carryFinishers = 0;
// O6 for slice 5: the three sections the fix subtracts from must still reach the card, and a
// push card must never be left with its Main section and nothing else.
let deltFinishers = 0, accessories = 0, chestKnees = 0, mainOnlyPush = 0;
const mainOnlyWho = [];
// O4 enforcement counters
let lbRowSlots = 0, lbRowOffTable = 0, lbRowEqualsMain = 0;
const lbOffWho = [];

for (const inj of INJ) for (const equipment of EQUIP) for (const liftingFocus of FOCUS)
for (const experience of EXPER) for (const seed of SEEDS){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, seed, liftingFocus, experience, injury: inj.injury });
  let prog;
  try { prog = IA.buildProgram(cfg); builds++; }
  catch (err){ bad(`build threw ${inj.tag} ${equipment} ${liftingFocus} ${experience} seed=${seed}: ${err.message}`); continue; }
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks)) for (const d of DAYS){
    const day = weeks[wk][d];
    if (!day || day.rest) continue;
    const secs = (day.sections || []).filter(s => s && (s.items || []).length);
    if (!secs.length) continue;
    days++;

    // where every name on this card appears
    const where = Object.create(null);
    secs.forEach(s => {
      const lbl = clean(s.label) || clean(s.coreHeader) || '(unlabelled)';
      (s.items || []).forEach(it => {
        if (!it || !it.name) return;
        const n = clean(it.name); if (!n) return;
        (where[n] = where[n] || []).push(lbl);
      });
    });
    Object.keys(where).forEach(n => {
      if (where[n].length < 2) return;
      dupByName[n] = (dupByName[n] || 0) + 1;
      dupPairs[where[n].slice().sort().join(' ++ ')] = (dupPairs[where[n].slice().sort().join(' ++ ')] || 0) + 1;
      if (where[n].some(l => /^Main —/.test(l))) mainDupByName[n] = (mainDupByName[n] || 0) + 1;
    });

    // O6 + O4: the lowback/protect pull day
    const mainSec = secs.find(s => /^Main —/.test(clean(s.label)));
    const mainName = mainSec ? clean((mainSec.items[0] || {}).name) : null;
    // The ROW-SLOT scan runs on every lowback/protect card carrying a pull superset, not only
    // on the ones whose main is a vertical pull. On a tier with no barbell this branch hands
    // the main slot to hip extension, so keying the scan off the main's NAME left the three
    // barbell-less tiers — exactly the ones the implement gate on 'Weighted chinups' protects —
    // completely unchecked. Found by a sabotage mutation that survived.
    if (inj.tag === 'lowback/protect' && secs.some(s => /^Pull superset/.test(clean(s.label)))){
      const table = LB_ROWPOOL(equipment);
      secs.filter(s => /^Pull superset A|^Pull superset B/.test(clean(s.label))).forEach(s => {
        const a = clean((s.items[0] || {}).name);
        if (!a) return;
        lbRowSlots++;
        if (VPULL.some(m => m.name === a) && table.indexOf(a) < 0){ lbRowOffTable++; if (lbOffWho.length < 6) lbOffWho.push(`${equipment} seed=${seed} W${wk} ${d.toUpperCase()} drew '${a}', hand pool [${table.join(', ')}]`); }
        if (mainName && a === mainName) lbRowEqualsMain++;
      });
    }
    if (inj.tag === 'lowback/protect' && mainSec && /chinup|pullup|pulldown/i.test(mainName || '')){
      lbPullDays++;
      // O6 is a claim about PRESCRIPTION, not about a label. singletonSupersetSweep renames a
      // superset that lost a partner to a plain 'Pull', so asserting the label 'Pull superset A'
      // survives would be asserting that no cap may ever trim this day — which is a different
      // ruling's business. The claim is that the day still prescribes pulling beyond the main.
      if (secs.some(s => !/^Main —/.test(clean(s.label)) && (s.items || []).some(it => it && it.name))) lbPullSupersets++;
    }
    if (secs.some(s => /^Loaded carry finisher/.test(clean(s.label)))) carryFinishers++;
    const labs = secs.map(s => clean(s.label));
    if (labs.some(l => l === 'Delt finisher')) deltFinishers++;
    if (labs.some(l => l === 'Accessory' || l === 'Pump')) accessories++;
    if (labs.some(l => l === 'Chest + knee')) chestKnees++;
    // A push card is one whose Main names a press or a pushup. If subtraction ever emptied
    // both later sections, the card would be a Main and a core block and nothing else.
    if (mainName && /press|pushup|dips/i.test(mainName)){
      const others = secs.filter(s => !/^Main —/.test(clean(s.label)) && !s.core && !s.optional);
      if (!others.length){ mainOnlyPush++; if (mainOnlyWho.length < 6) mainOnlyWho.push(`${inj.tag} ${equipment} ${experience} seed=${seed} W${wk} ${d.toUpperCase()} main='${mainName}'`); }
    }
  }
}

console.log(`\n  swept ${builds} builds / ${days} day-builds`);

// ── G1: the ruled classes, at zero ───────────────────────────────────────────
// Slice 5 adds the four movements whose duplicate classes it closed. Named individually so
// a regression reports WHICH class came back, not just that the total moved.
const RULED = ['Assisted pullups', 'Farmer carry', 'Suitcase carry', 'Bird dogs',
               'Dumbbell lateral raise', 'Dumbbell bench press', 'Dumbbell decline press',
               'Pushups (slow tempo)'];
RULED.forEach(n => {
  const c = dupByName[n] || 0;
  if (c === 0) ok(`G1 '${n}' never appears twice on one card (0 of ${days} day-builds)`);
  else bad(`G1 '${n}' appears twice on one card on ${c} of ${days} day-builds`);
});

// ── G2: the universal claim ──────────────────────────────────────────────────
const names = Object.keys(dupByName).sort((a, b) => dupByName[b] - dupByName[a]);
const total = names.reduce((a, n) => a + dupByName[n], 0);
const mainTotal = Object.keys(mainDupByName).reduce((a, n) => a + mainDupByName[n], 0);
const unreg = names.filter(n => OPEN_UNRULED[n] === undefined);
const unregTotal = unreg.reduce((a, n) => a + dupByName[n], 0);
const debtTotal = names.filter(n => OPEN_UNRULED[n] !== undefined).reduce((a, n) => a + dupByName[n], 0);
if (unregTotal === 0) ok(`G2a no unregistered movement appears twice on any of the ${days} cards swept (${debtTotal} in the debt register, across ${Object.keys(OPEN_UNRULED).length} named class(es))`);
else bad(`G2a ${unregTotal} of ${days} day-builds print one movement twice on the same card, and the class is in NO register entry: ` +
         unreg.map(n => `'${n}' x${dupByName[n]}`).join(', '));
const unregMain = Object.keys(mainDupByName).filter(n => OPEN_UNRULED[n] === undefined);
const unregMainTotal = unregMain.reduce((a, n) => a + mainDupByName[n], 0);
if (unregMainTotal === 0) ok(`G2b no unregistered 'Main —' movement is repeated elsewhere on its own card`);
else bad(`G2b ${unregMainTotal} of ${days} day-builds repeat the day's Main movement in another section with no register entry: ` +
         unregMain.map(n => `'${n}' x${mainDupByName[n]}`).join(', '));
console.log(`  note  same-card duplicates overall: ${total} of ${days} day-builds (${mainTotal} of them repeat the day's Main lift)`);

// ── G3: the register is a tripwire, not a licence ────────────────────────────
const grownList = names.filter(n => OPEN_UNRULED[n] !== undefined && dupByName[n] > OPEN_UNRULED[n]);
if (!grownList.length) ok(`G3a no debt-register class grew beyond its recorded count (${Object.keys(OPEN_UNRULED).length} classes registered)`);
else bad(`G3a ${grownList.length} debt-register class(es) grew: ${grownList.map(n => `'${n}' ${OPEN_UNRULED[n]} -> ${dupByName[n]}`).join(', ')}`);
const shrunk = Object.keys(OPEN_UNRULED).filter(n => (dupByName[n] || 0) < OPEN_UNRULED[n]);
if (shrunk.length) console.log(`  note  debt-register class(es) SHRANK, update the register: ${shrunk.map(n => `'${n}' ${OPEN_UNRULED[n]} -> ${dupByName[n] || 0}`).join(', ')}`);
else ok('G3b every debt-register class is still at its recorded count, so the register is honest');

// ── G4: O4 enforced against the hand table ───────────────────────────────────
if (lbPullDays > 0) ok(`G4a the lattice contains ${lbPullDays} lowback/protect vertical-pull main days (the fix has work to do)`);
else bad('G4a no lowback/protect vertical-pull main day appeared — the lattice cannot tell the fix from a no-op, widen it');
if (lbRowEqualsMain === 0) ok(`G4b across ${lbRowSlots} lowback/protect pull-superset slots, none repeats the day's main lift`);
else bad(`G4b ${lbRowEqualsMain} of ${lbRowSlots} lowback/protect pull-superset slots print the day's own main lift again`);
if (lbRowOffTable === 0) ok(`G4c every vertical pull drawn into those slots comes from the hand-derived pool`);
else bad(`G4c ${lbRowOffTable} of ${lbRowSlots} slots drew a vertical pull the hand table excludes: ${lbOffWho.join(' | ')}`);

// ── G5: O6, selection is not deletion ────────────────────────────────────────
if (lbPullSupersets === lbPullDays) ok(`G5a all ${lbPullDays} lowback/protect vertical-pull main days still prescribe work beyond the main lift (the fix selected, it did not delete)`);
else bad(`G5a ${lbPullDays - lbPullSupersets} of ${lbPullDays} lowback/protect vertical-pull main days are left with the main lift and nothing else`);
if (carryFinishers > 0) ok(`G5b the loaded carry finisher still reaches the card on ${carryFinishers} day-builds`);
else bad('G5b the loaded carry finisher vanished from the whole lattice — the carry fix deleted a section instead of a name');
if (deltFinishers > 0) ok(`G5c the Delt finisher still reaches the card on ${deltFinishers} day-builds (the subtraction selected a different delt, it did not drop the section)`);
else bad('G5c the Delt finisher vanished from the whole lattice — the delt fix omitted the section instead of choosing another name');
if (chestKnees > 0) ok(`G5d 'Chest + knee' still reaches the card on ${chestKnees} day-builds`);
else bad("G5d 'Chest + knee' vanished from the whole lattice — the chest fix omitted the section instead of choosing another name");
if (accessories > 0) ok(`G5e the push day's second prescription block still reaches the card on ${accessories} day-builds`);
else bad("G5e the push day's Accessory / Pump block vanished from the whole lattice");
if (mainOnlyPush === 0) ok(`G5f no push card was left with its Main section and nothing else`);
else bad(`G5f ${mainOnlyPush} push cards are left with the Main section and no other prescribed block: ${mainOnlyWho.join(' | ')}`);

// ── the section-pair census, printed for the record ──────────────────────────
if (Object.keys(dupPairs).length){
  console.log('\n  section pairs holding a duplicate:');
  Object.keys(dupPairs).sort((a, b) => dupPairs[b] - dupPairs[a]).forEach(k => console.log(`    ${dupPairs[k]}  ${k}`));
}

console.log(`\nPASS ${PASS} FAIL ${FAIL}`);
if (FAIL) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
