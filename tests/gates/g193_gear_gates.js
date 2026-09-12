// GATE g193_gear_gates — V193 D44 + D46-c + D47 + D49, the gear-gate batch.
//
// RULING (D49). Two gear-free members join CORE_PILLARS.anti_rotation ('Bird dogs',
// 'Plank shoulder taps') and 'Pallof press' finally gets a gear tag. A Pallof press is a
// band or cable anti-rotation press whose NAME names neither implement, so every regex in
// _auxGearOK missed it and it fell through to the catch-all: legal on a bodyweight athlete
// with nothing to press against. Band is the tag, because a Pallof genuinely runs off a
// band and the band is the looser implement, so the tier set is every tier that owns bands.
// The two additions are the other half of the same ruling: with the carries correctly gated
// off bodyweight by D46-c, the pillar held two legal members there and printed the identical
// pair {Side plank, Pallof press} on 45 of 45 occurrences, which NSW p.7 ("Choose different
// variations ... for the same basic movement on different days") and p.7 item 7 ("For the
// trunk, use a variety of static as well as dynamic exercises") both forbid.
//
// RULING (D44). _gearOK gates POOL-level content only, so CORE_PILLARS and the injury
// pool overrides had no equipment gate at all. Three leaks, three different fixes:
//   1. 'Landmine rotations' (CORE_PILLARS.rotational_power) printed on tiers with no
//      barbell. A landmine is a barbell with one end anchored. ENGINE FIX.
//   2. 'Straight-arm pulldown' (lowback/protect rowPool literal) printed on tiers with
//      no cable, including bodyweight. ENGINE FIX.
//   3. Banded prehab on home_full and crossfit is CORRECT (the 5473 ruling: a band is
//      the one implement a rehab athlete can be assumed to own). The wizard copy for
//      those two tiers did not name bands. COPY FIX, no prescription changes.
//
// RULING (D46-c). D44's core gate knew ONE WORD, 'landmine', so it answered for one member
// of one pillar. Every other implement in CORE_PILLARS walked past it: 'Cable woodchoppers'
// on all six tiers, 'Medicine ball rotary toss' on all six, and the two loaded carries in
// anti_rotation onto bodyweight. The gate now reads _auxGearOK — the per-tier legality table
// the file already carries and the swap sheet already trusts. So this gate stops asserting
// one name and asserts the TABLE: every implement-named movement in the injected pillars,
// on every tier, in both directions.
//
// RULING (D47). capSessionBudget._protected returned -1 for s.core, so the OPTIONAL core
// finisher outranked the prehab rail ('Chest + knee' matches no protection, rank 1) and the
// budget paid for the finisher out of prehab. _protected no longer protects a section the
// engine itself flagged optional.
//
// ORACLES — none of them asks the engine what it did and then agrees with it.
//   O1 HAND TABLE of tier inventories, transcribed from the wizard copy the athlete
//      reads and from the ruling. barbell = home_full | commercial | crossfit;
//      cables = commercial only; med balls = commercial | crossfit; bands = every tier
//      whose card names bands, plus open-ended commercial. 'minimal' is the retired travel
//      tier (no wizard card, no barbell, no cable, no band). This table is the gate's own
//      belief, hand typed. It is never read back out of _auxGearOK.
//   O2 IMPLEMENT LOGIC, stated in words: a landmine is a barbell with one end anchored; a
//      woodchopper on a cable needs a cable stack; a rotary toss needs a med ball; a loaded
//      carry needs something to carry. A movement is legal iff its tier owns its implement.
//   O3 COPY-VS-PRESCRIPTION CONSISTENCY: if a tier is prescribed a band-named movement,
//      that tier's wizard card must name bands. Read out of the raw HTML, not the VM.
//   O4 A RULING THAT SELECTS IS NOT A RULING THAT DELETES: every movement gated off a
//      tier must still be reachable on a tier that owns the implement, and every slot
//      that lost a movement must still be filled. For the core finisher that means the
//      DRAW still hands back two distinct movements on every tier — asserted with the set
//      budget bypassed, because after D47 the budget is allowed to trim the finisher and a
//      budget trim would otherwise be mistaken for a collapsed pair.
//   O5 D47 TRIM ORDER, proven on a hand-built session with a hand-derived expected outcome:
//      over budget, the optional finisher pays before the prehab rail, and the SAME session
//      with the optional flag removed pays out of prehab instead. Two runs, one flag apart.

const fs = require('fs');
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const LAT = require(path.join(__dirname, '..', 'lattice193.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);
const HTML = fs.readFileSync(FILE, 'utf8');

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; if (m) console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); };

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── O1: the hand table ───────────────────────────────────────────────────────
// wizardId: the id whose card the athlete actually sees. 'minimal' has no card.
const TIERS = {
  bodyweight: { barbell: false, cables: false, medball: false, bands: false, load: false, card: true  },
  minimal:    { barbell: false, cables: false, medball: false, bands: false, load: true,  card: false },
  home_basic: { barbell: false, cables: false, medball: false, bands: true,  load: true,  card: true  },
  home_full:  { barbell: true,  cables: false, medball: false, bands: true,  load: true,  card: true  },
  commercial: { barbell: true,  cables: true,  medball: true,  bands: true,  load: true,  card: true  },
  crossfit:   { barbell: true,  cables: false, medball: true,  bands: true,  load: true,  card: true  },
};
const EQUIP = Object.keys(TIERS);
// The tier table above is this gate's own hand oracle and must agree with the shared
// lattice's tier list, or half the claims below are made about tiers nobody swept.
if (EQUIP.join(',') === LAT.EQUIP.join(',')) ok('L0 the gate\'s hand tier table and the shared lattice list the same six tiers');
else bad('L0 tier lists disagree: gate ' + EQUIP.join(',') + ' vs lattice ' + LAT.EQUIP.join(','));
if (LAT.WIDE_N === 288) ok('L0a WIDE lattice is the ruled 288 cells (4 injuries x 6 tiers x 2 foci x 2 experiences x 3 seeds)');
else bad('L0a WIDE lattice is ' + LAT.WIDE_N + ' cells, not the ruled 288 — lattice193.js was narrowed and every claim below is weaker than it reads');
const SEEDS = LAT.SEEDS_WIDE;
// OPT-IN WIDER SWEEP, same switch and same reasoning as g193_budget_floor: default is the
// ruled 288-cell lattice, IA_LATTICE=full runs the 864-cell superset. The default is not
// changed here.
const USE_FULL = String(process.env.IA_LATTICE || '').toLowerCase() === 'full';
const CELLS = USE_FULL ? LAT.FULL : LAT.WIDE;
if (CELLS.length >= LAT.WIDE_N) ok('L0d lattice in use: ' + (USE_FULL ? 'FULL' : 'WIDE') + ', ' + CELLS.length + ' cells, at or above the ruled floor of ' + LAT.WIDE_N);
else bad('L0d lattice in use is ' + CELLS.length + ' cells, BELOW the ruled floor of ' + LAT.WIDE_N);

// O1 + O2: the per-movement legality table. Every implement-named movement that the core
// injector can put on a card, with the inventory key it needs. Hand typed from the movement
// name and the tier cards; NOT read out of _auxGearOK, which is the code under test.
const GATED = [
  { name: 'Landmine rotations',             need: 'barbell', why: 'barbell (a landmine is a barbell with one end anchored)' },
  { name: 'Cable woodchoppers',             need: 'cables',  why: 'cable stack' },
  { name: 'Medicine ball rotary toss',      need: 'medball', why: 'medicine ball' },
  { name: 'Band woodchopper (door anchor)', need: 'bands',   why: 'resistance band' },
  { name: 'Dumbbell renegade rows',         need: 'load',    why: 'dumbbells' },
  { name: 'Farmer carry',                   need: 'load',    why: 'load to carry' },
  { name: 'Suitcase carry',                 need: 'load',    why: 'load to carry' },
  // D49. Hand-stated implement logic: a Pallof press is an anti-rotation press against a
  // band or a cable stack. The name announces neither, which is exactly why it needs a row
  // here. Band is the requirement, not cable: the band is the looser implement and the
  // movement is genuinely done with one, so it is legal wherever bands live.
  { name: 'Pallof press',                   need: 'bands',   why: 'band or cable to press against' },
];
// The three movements in the injected pillars that need NO implement. They must remain
// legal — and printed — on every tier, or the gate is watching a pillar that got emptied.
// D49 adds the two gear-free anti-rotation members to this list for the same reason: they
// exist so the pillar survives an honest gear gate on bodyweight, so a tier where they do
// not print is a tier where the ruling did not land.
const UNGATED_CORE = ['Windshield wipers', 'Standing torso rotations (slow)', 'Side plank thread-the-needle',
                      'Bird dogs', 'Plank shoulder taps', 'Side plank'];
// O2 arithmetic: legal rotational_power members per tier, counted by hand off the table
// above (wipers + standing torso + thread-the-needle are always legal; add band / landmine /
// medball / cable where the tier owns them). The pair-draw needs two, doctrine wants three.
const ROT_LEGAL = { bodyweight: 3, minimal: 3, home_basic: 4, home_full: 5, commercial: 7, crossfit: 6 };

// ── O2: implement logic, as regexes over the movement NAME ───────────────────
const IS_LANDMINE = /landmine/i;              // barbell, one end anchored
const IS_PULLDOWN = /\bpulldown\b/i;          // cable
// 'IT band' is the iliotibial band, anatomy, not an implement. Excluded by hand so the
// copy oracle below cannot be fooled by a stretch name into demanding band equipment.
const IS_BAND     = /(?<!\bIT )\bband(ed|s)?\b/i;  // resistance band

let HOLE_SEEN = false;
function itemsOf(prog){
  const out = [];
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks))
    for (const d of DAYS){
      const day = weeks[wk][d];
      if (!day) continue;
      for (const s of (day.sections || []))
        for (const it of (s.items || [])){
          // A hole on the card is a defect with a name, not a reason for the gate to die
          // mid-sweep (V167: a gate that crashes reports nothing, and nothing is not a pass).
          // An emptied pillar hands back undefined, which is exactly what this batch guards.
          if (!it || !it.name){ if (!HOLE_SEEN){ HOLE_SEEN = true; bad(`G0 an item slot came back empty at W${wk} ${d.toUpperCase()} "${String(s.label||'')}" — a pool or pillar was filtered to nothing and the draw handed back a hole`); } continue; }
          out.push({ wk:+wk, d, label:String(s.label||''), name: clean(it.name) });
        }
    }
  return out;
}

// WIDENED. One sweep of the shared WIDE lattice, then sliced by injury, instead of two
// narrow healthy-only sweeps. Every claim that used to read "on 5 healthy builds per tier"
// now reads "on 12 builds per tier across two foci and two experience levels", and the
// lowback slice is no longer the only injury path this gate can see.
// Row shape is unchanged ({ seed, items }) so every countEq / countBy / sampleBy claim
// below keeps working; `seed` is widened to the full cell tag so a failure sample names the
// focus and experience it came from and is reproducible without guessing.
let SWEPT_CELLS = 0;
function sweepWide(){
  const byInj = {};
  for (const c of CELLS){
    const slot = byInj[c.inj] || (byInj[c.inj] = { per:{}, total:0 });
    for (const e of EQUIP) if (!slot.per[e]) slot.per[e] = [];
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); SWEPT_CELLS++; }
    catch (e){ bad(`build threw ${c.tag}: ${e.message}`); continue; }
    const its = itemsOf(prog);
    slot.total += its.length;
    slot.per[c.equipment].push({ seed: c.liftingFocus + '/' + c.experience + '/' + c.seed, items: its });
  }
  return byInj;
}

const countBy = (rows, re) => rows.reduce((n, r) => n + r.items.filter(x => re.test(x.name)).length, 0);
const countEq = (rows, nm) => rows.reduce((n, r) => n + r.items.filter(x => x.name === nm).length, 0);
const sampleBy = (rows, re) => { for (const r of rows) for (const x of r.items) if (re.test(x.name)) return `seed=${r.seed} W${x.wk} ${x.d.toUpperCase()} "${x.label}" :: ${x.name}`; return ''; };
const sampleEq = (rows, nm) => sampleBy(rows, new RegExp('^' + nm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));

// ── lattices ─────────────────────────────────────────────────────────────────
const BYINJ    = sweepWide();
const HEALTHY  = BYINJ['healthy'];
const LOWBACK  = BYINJ['lowback/protect'];
const SHOULDER = BYINJ['shoulder/protect'];
const ELBOW    = BYINJ['elbow/protect'];
for (const t of ['healthy','shoulder/protect','lowback/protect','elbow/protect'])
  if (!BYINJ[t]) bad(`L0e the ${t} slice is missing from the sweep — a claim below would be made about nothing`);
// ALL: the union, used by every claim of the form "this movement must never print on a tier
// that owns no implement for it". That claim has nothing to do with injury, so restricting
// it to the healthy slice was the narrowness itself: an overlay that substitutes a movement
// is exactly the code path most likely to reach past the gear filter.
const ALL = { per:{}, total:0 };
for (const e of EQUIP){ ALL.per[e] = []; }
for (const t of Object.keys(BYINJ)){
  ALL.total += BYINJ[t].total;
  for (const e of EQUIP) for (const r of BYINJ[t].per[e]) ALL.per[e].push({ seed: t + ' ' + r.seed, items: r.items });
}
console.log(`  swept ${SWEPT_CELLS}/${CELLS.length} cells, ${ALL.total} items, injury slices: ${Object.keys(BYINJ).join(', ')}`);
if (!USE_FULL) console.log('  set IA_LATTICE=full for the 864-cell sweep (about 3x the runtime; it finds strictly more)');
if (SWEPT_CELLS === CELLS.length) ok(`L0b every one of the ${CELLS.length} cells built (no build was silently skipped)`);
else bad(`L0b only ${SWEPT_CELLS}/${CELLS.length} cells built`);
for (const t of Object.keys(BYINJ)){
  if (BYINJ[t].total > 3000) ok(`${t} lattice ${BYINJ[t].total} items over ${EQUIP.length} tiers x ${BYINJ[t].per[EQUIP[0]].length} builds`);
  else bad(`${t} lattice too thin: ${BYINJ[t].total} items — the gate is blind on that path`);
}

// ── FIX 1 (D44 + D46-c): the per-tier legality TABLE, both directions ────────
// COUNTED OVER ALL FOUR INJURY PATHS, not the healthy one. A gear filter that an overlay
// bypasses is still a gear filter that leaked, and the healthy slice cannot see it.
const tbl = {};
for (const g of GATED){
  tbl[g.name] = {};
  for (const e of EQUIP) tbl[g.name][e] = countEq(ALL.per[e], g.name);
}
for (const n of UNGATED_CORE){
  tbl[n] = {};
  for (const e of EQUIP) tbl[n][e] = countEq(ALL.per[e], n);
}
for (const n of Object.keys(tbl)) console.log(`  ${n.padEnd(32)} ${JSON.stringify(tbl[n])}`);

for (const g of GATED){
  for (const e of EQUIP){
    if (TIERS[e][g.need]) continue;                       // tier owns the implement, nothing to prove here
    if (tbl[g.name][e] === 0) ok(`G1 no "${g.name}" on ${e} (tier owns no ${g.why}) across all four injury paths`);
    else bad(`G1 ${tbl[g.name][e]} "${g.name}" items on ${e}, which owns no ${g.why}: ${sampleEq(ALL.per[e], g.name)}`);
  }
  // O4: SELECTED AGAINST is not DELETED. The movement must still print where it is legal.
  const legal = EQUIP.filter(e => TIERS[e][g.need]);
  const reach = legal.reduce((n, e) => n + tbl[g.name][e], 0);
  if (reach > 0) ok(`G2 "${g.name}" still reaches its legal tiers (${reach} items over ${legal.join('/')})`);
  else bad(`G2 "${g.name}" is unreachable on EVERY tier — the gate deleted the movement instead of selecting against it`);
}
// The landmine claim D44 shipped, kept as a regex so a RENAMED landmine movement cannot
// slip past the exact-name table above.
for (const e of EQUIP){
  if (TIERS[e].barbell) continue;
  const n = countBy(ALL.per[e], IS_LANDMINE);
  if (n === 0) ok(`G1b no landmine-named movement at all on ${e} (all four injury paths)`);
  else bad(`G1b ${n} landmine-named items on ${e}, which owns no barbell: ${sampleBy(ALL.per[e], IS_LANDMINE)}`);
  // per injury path, named, so a leak that only one overlay opens is not averaged away
  for (const t of Object.keys(BYINJ)){
    const nl = countBy(BYINJ[t].per[e], IS_LANDMINE);
    if (nl === 0) ok(`G1c no landmine on ${e} under ${t}`);
    else bad(`G1c ${nl} landmine items on ${e} under ${t}: ${sampleBy(BYINJ[t].per[e], IS_LANDMINE)}`);
  }
}
// O4: the pillar was gated, not emptied. Every implement-free member still prints everywhere.
for (const n of UNGATED_CORE){
  const dead = EQUIP.filter(e => tbl[n][e] === 0);
  if (!dead.length) ok(`G2b "${n}" needs no implement and prints on all six tiers`);
  else bad(`G2b "${n}" needs no implement but never prints on: ${dead.join(', ')} — the gate is removing legal work`);
}

// The two draw-time sweeps below build their own programs (they need the budget bypassed,
// which the item sweep above does not). They now walk the SAME wide lattice, indexed by
// tier. CELLS_BY_TIER is the one place that indexing lives, so the two sweeps cannot drift
// apart from each other or from the item sweep.
const CELLS_BY_TIER = {};
for (const e of EQUIP) CELLS_BY_TIER[e] = CELLS.filter(c => c.equipment === e);
if (CELLS_BY_TIER[EQUIP[0]].length === CELLS.length / EQUIP.length)
  ok(`L0c the draw sweeps see ${CELLS_BY_TIER[EQUIP[0]].length} cells per tier (${CELLS.length} / ${EQUIP.length})`);
else bad(`L0c per-tier cell count is ${CELLS_BY_TIER[EQUIP[0]].length}, not ${CELLS.length / EQUIP.length} — the lattice is not balanced across tiers`);

// ── O4: the core finisher still fills its slot on every tier ────────────────
// The DRAW is the claim, so the set budget is bypassed for this one measurement. After D47
// the budget may legally trim an optional finisher; a budget trim is not a collapsed pair,
// and letting the two mix would make this gate unable to tell them apart.
const BUDGET_WAS = IA.eval('typeof __BUDGET_OFF!=="undefined" ? __BUDGET_OFF : undefined');
IA.eval('var __BUDGET_OFF = true;');
if (IA.eval('!!globalThis.__BUDGET_OFF')) ok('G3a set budget bypassed for the draw-time measurement');
else bad('G3a could not bypass the set budget — the draw-time claim below would be measuring the budget instead');

let coreBlocks = 0, thinCore = 0, onlyOne = 0, thinSample = '';
const rotSeen = {};
// thin blocks split by injury path, because a rehab overlay and a healthy build are two
// different claims and a single aggregate would let one hide inside the other.
const thinByInj = {}, blocksByInj = {};
for (const t of Object.keys(BYINJ)){ thinByInj[t] = 0; blocksByInj[t] = 0; }
for (const e of EQUIP){
  rotSeen[e] = new Set();
  for (const c of CELLS_BY_TIER[e]){
    // A gate that crashes reports nothing, and nothing is not "no failures" (V167). An
    // emptied pillar throws inside the draw, so catch it here and NAME it.
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); }
    catch (err){ bad(`G3 build threw on ${c.tag} with the budget bypassed: ${err.message}`); continue; }
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections||[])) if (s && s.core){
          coreBlocks++; blocksByInj[c.inj]++;
          const names = (s.items||[]).filter(Boolean).map(i => clean(i && i.name));
          if (names.length < 1){ thinCore++; thinByInj[c.inj]++; if(!thinSample) thinSample = `${c.tag} W${wk} ${d} n=${names.length} [${names.join(', ')}]`; }
          if (names.length === 1) onlyOne++;
          if (s.pillar === 'rotational_power') names.forEach(n => rotSeen[e].add(n));
        }
      }
  }
}
console.log('  draw-time core blocks by injury ' + JSON.stringify(Object.fromEntries(
  Object.keys(blocksByInj).map(t => [t, thinByInj[t] + '/' + blocksByInj[t] + ' not-a-pair']))));
IA.eval(BUDGET_WAS === undefined ? 'var __BUDGET_OFF = undefined;' : `var __BUDGET_OFF = ${JSON.stringify(BUDGET_WAS)};`);

if (coreBlocks > 3000) ok(`G3 core finishers observed across all six tiers and all four injury paths: ${coreBlocks}`);
else bad(`G3 only ${coreBlocks} core finishers observed — the gear gate on the pillars is untested`);
// V193 (D50 session): G3b DEMANDED A PAIR, and D48 explicitly declined to require one.
// "Thin core is an acceptable outcome: one hard trunk piece done properly on a tight day is
// a coachable prescription. Zero trunk is not." A gate asserting length === 2 was therefore
// asserting a rule no ruling had ever made, and it would have gone red on a correct build
// the moment a tier's pillar legally offered one member. This is the gate corrected to the
// ruling, NOT an assertion softened to fit a defect: the bar D48 actually set is ZERO, and
// zero is what is asserted here. The pair is still reported with its denominator, so a draw
// that quietly stops filling its second slot is visible as a number that moves.
// The other half of D48 — no DAY printing zero `Trunk — *` items outside the long-run tiers
// and the race window — is a day-level claim on a budget-live build, so it is asserted where
// it belongs, as L1 in tests/gates/g193_d50_trunkfloor.js. It is deliberately asserted in
// exactly one gate: two gates carrying one claim means one sabotage mutation trips two, and
// the one-mutation-one-gate rule stops meaning anything.
if (thinCore === 0) ok(`G3b every core finisher draws at least one item on every tier (budget bypassed); ${onlyOne}/${coreBlocks} drew one rather than two, which D48 permits`);
else bad(`G3b ${thinCore}/${coreBlocks} core finishers drew NO items: ${thinSample}\n     (a gear filter that leaves no legal member, or two survivors that sweep to the same movement and dedupe to nothing, empties the block — zero trunk is not a coachable prescription)`);

console.log('  distinct rotational_power members drawn by tier ' +
  JSON.stringify(Object.fromEntries(EQUIP.map(e => [e, rotSeen[e].size]))));
for (const e of EQUIP){
  // O2: the hand-counted legal membership is the ceiling; doctrine's floor is 3 (NSW p.6
  // rec 2 wants all three planes, and a two-member pillar prints one frozen pair).
  const n = rotSeen[e].size;
  if (n > ROT_LEGAL[e]) bad(`G3c ${e} drew ${n} distinct rotational members but only ${ROT_LEGAL[e]} are legal there — an illegal member is being drawn`);
  else if (n >= 3) ok(`G3c ${e} draws ${n} distinct rotational members (${ROT_LEGAL[e]} legal, floor 3)`);
  else bad(`G3c ${e} draws only ${n} distinct rotational members — below the doctrine floor of 3`);
}

// ── FIX 2: a pulldown is a cable movement ────────────────────────────────────
const sapLow = {}, pdLow = {};
for (const e of EQUIP){
  sapLow[e] = countEq(LOWBACK.per[e], 'Straight-arm pulldown');
  pdLow[e]  = countBy(LOWBACK.per[e], IS_PULLDOWN);
}
console.log('  "Straight-arm pulldown" (lowback/protect) by tier ' + JSON.stringify(sapLow));
console.log('  any pulldown (lowback/protect) by tier ' + JSON.stringify(pdLow));

for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  if (sapLow[e] === 0) ok(`G4 no "Straight-arm pulldown" on ${e} under lowback/protect (tier owns no cable)`);
  else bad(`G4 ${sapLow[e]} "Straight-arm pulldown" items on ${e}, which owns no cable: ${sampleBy(LOWBACK.per[e], /^Straight-arm pulldown$/)}`);
  // A cable movement on a cable-less tier is illegal on every path, not just this one.
  const nAll = countBy(ALL.per[e], IS_PULLDOWN);
  if (nAll === 0) ok(`G4b no pulldown-named movement at all on ${e} across all four injury paths`);
  else bad(`G4b ${nAll} pulldown-named items on ${e}, which owns no cable: ${sampleBy(ALL.per[e], IS_PULLDOWN)}`);
}
if (sapLow.commercial > 0) ok(`G5 "Straight-arm pulldown" still prescribed on commercial (${sapLow.commercial} items)`);
else bad('G5 "Straight-arm pulldown" is gone from commercial too — the fix deleted the movement instead of gating it');

// O4: the lowback/protect pull slot is still FILLED on a cable-less tier. The branch's
// own doctrine is that this athlete keeps a pull; an empty slot is not a fix.
// Vertical-pull vocabulary, hand-listed (no row: lowback/protect drops the row pattern).
const VPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm/i;
// PER BUILD, not per tier. An existential claim gets WEAKER as the lattice widens: pooling
// twelve programs per tier and asking "did any of them contain a pull" is a lower bar than
// asking it of five. The doctrine is per athlete anyway — this branch's promise is that
// THIS athlete keeps a pull, over THESE fourteen weeks. Asked per build, more builds is
// more evidence and never a lower bar. (Sabotage S10 proved the pooled form had gone
// no-op: it emptied the vertical-pull array outright and G6 still passed.)
let pullFilled = 0, pullMissing = [], pullEmptyBuilds = 0, pullSample = '';
for (const e of EQUIP){
  if (TIERS[e].cables) continue;
  let bad_e = 0;
  for (const r of LOWBACK.per[e]){
    if (r.items.filter(x => VPULL.test(x.name)).length === 0){
      bad_e++; pullEmptyBuilds++;
      if (!pullSample) pullSample = `${e} ${r.seed}`;
    }
  }
  if (!bad_e) pullFilled++; else pullMissing.push(e + ' (' + bad_e + '/' + LOWBACK.per[e].length + ' builds)');
}
if (pullMissing.length === 0) ok(`G6 EVERY lowback/protect build on a cable-less tier gets a vertical pull (${pullFilled} tiers, 0 empty builds)`);
else bad(`G6 lowback/protect leaves NO vertical pull in ${pullEmptyBuilds} build(s) on: ${pullMissing.join(', ')} (first ${pullSample}) — the slot was emptied, not substituted`);
// G6b, ON EVERY PATH INCLUDING HEALTHY, with the CORRECT predicate. VPULL above is
// branch-specific by construction: the file's own comment says it carries no row because
// lowback/protect drops the row pattern, so on that one branch the vertical pull is the
// only pull left. It is NOT a general "does this athlete pull" test, and using it as one
// reports ten healthy builds as violations. The general claim, which needs no new ruling,
// is that no athlete goes fourteen weeks with no pulling at all: vertical, horizontal or
// scapular. That is ANYPULL, hand-listed from the movement vocabulary.
const ANYPULL = /chinup|chin-up|pullup|pull-up|pulldown|straight-arm|\brow\b|face pull|pull-?apart|\blat\b/i;
for (const t of Object.keys(BYINJ)){
  let empty = 0, miss = [], s0 = '', builds = 0;
  for (const e of EQUIP){
    let n = 0;
    for (const r of BYINJ[t].per[e]){
      builds++;
      if (r.items.filter(x => ANYPULL.test(x.name)).length === 0){ n++; empty++; if(!s0) s0 = `${e} ${r.seed}`; }
    }
    if (n) miss.push(e + ' (' + n + '/' + BYINJ[t].per[e].length + ')');
  }
  if (!miss.length) ok(`G6b every ${t} build pulls something (0/${builds} builds with no pull of any kind)`);
  else bad(`G6b ${t} leaves ${empty}/${builds} build(s) with NO pull of any kind on: ${miss.join(', ')} (first ${s0})`);
}
// REPORT ONLY, with denominators, and deliberately not asserted. Vertical-pull coverage per
// branch is a coaching question nobody has ruled on. The numbers are printed so that a
// ruling can be made against a before-picture instead of a fresh measure pass. On V192 and
// V193 alike these read healthy 10/72, shoulder/protect 19/72, lowback/protect 0/72,
// elbow/protect 9/72 — the zero on lowback is the branch doctrine G6 above asserts.
{
  const rep = {};
  for (const t of Object.keys(BYINJ)){
    let n = 0, b = 0;
    for (const e of EQUIP) for (const r of BYINJ[t].per[e]){ b++; if (r.items.filter(x => VPULL.test(x.name)).length === 0) n++; }
    rep[t] = n + '/' + b;
  }
  console.log('  REPORT ONLY — builds with no VERTICAL pull, by injury path ' + JSON.stringify(rep) +
    ' (not asserted: no ruling covers vertical-pull coverage outside the lowback branch)');
}
// The same weakening applies to every other "still reaches" claim in this file. G2, G5, G9,
// G9b and G12b are all pooled existentials and all got easier when the lattice tripled.
// They are kept pooled ON PURPOSE and the reason is written here rather than left implied:
// each of those is a tripwire against a movement being DELETED FROM THE APP, not against it
// being missing from one athlete's fourteen weeks, and a movement can legitimately be absent
// from any single build without anything being wrong. G6 is different because its subject
// is one athlete's programme, not the inventory. If a future ruling makes any of the others
// a per-athlete promise, it moves to the per-build form above.

// ── FIX 3: copy names what the program prescribes ────────────────────────────
// O3. Pull the wizard cards straight out of the HTML, then require consistency with the
// prescriptions. This is the leak coach measured: 8.3% band-named movements on two tiers
// whose card named no bands. It is a COPY fix, so band counts must stay NONZERO.
// The wizard renders several card families off the same literal shape, so restrict to the
// equipment ids from the hand table. A card family that stopped parsing shows up as a
// missing id, which G8 turns into a named failure.
const CARD_RE = /\{id:'([a-z_]+)',\s*icon:'[^']*',\s*label:'[^']*',\s*desc:'([^']*)'\}/g;
const cards = {};
let m; while ((m = CARD_RE.exec(HTML))) if (TIERS[m[1]] && TIERS[m[1]].card) cards[m[1]] = m[2];
const cardIds = Object.keys(cards);
if (cardIds.length === 5) ok(`G7 five equipment cards parsed: ${cardIds.join(', ')}`);
else bad(`G7 expected 5 equipment cards, parsed ${cardIds.length}: ${cardIds.join(', ')}`);

const bandCount = {};
for (const e of EQUIP) bandCount[e] = countBy(ALL.per[e], IS_BAND);
console.log('  band-named items (healthy) by tier ' + JSON.stringify(bandCount));
console.log('  equipment card copy ' + JSON.stringify(cards));

// HAND TABLE: 'commercial' is the one card that does not enumerate an inventory
// ("Full gym — cables, machines, barbells, everything"). An open-ended claim cannot be
// contradicted by a band, so it is exempt BY NAME rather than by a rule that could grow
// to swallow the tiers that do enumerate.
const OPEN_ENDED = new Set(['commercial']);
for (const e of EQUIP){
  if (!TIERS[e].card || OPEN_ENDED.has(e)) continue;
  const desc = cards[e];
  if (desc === undefined){ bad(`G8 no wizard card found for tier ${e}`); continue; }
  const saysBands = /\bbands\b/i.test(desc);
  if (bandCount[e] === 0){ ok(`G8 ${e} prescribes no band work`); continue; }
  if (saysBands) ok(`G8 ${e} prescribes band work (${bandCount[e]} items) and its card names bands`);
  else bad(`G8 ${e} prescribes ${bandCount[e]} band-named items but its card names no bands: "${desc}" :: ${sampleBy(ALL.per[e], IS_BAND)}`);
}
// NOT ASSERTED: a blanket "no band on minimal". The prehab rails are banded on every tier
// by the 5473 ruling (a band is the one implement a rehab athlete can be assumed to own), so
// a tier-wide band count is the wrong unit. The band claim this batch makes is the named one
// in the GATED table above: 'Band woodchopper (door anchor)', a CORE PILLAR member, must not
// print on a tier whose card names no band.

// The prehab rail was UPHELD, not stripped. D44 fix 3 names the rails it protects:
// glute-med, cuff and dorsiflexion prehab, which have no equivalent substitute at dose.
// Hand table of the movements those rails are built from, so a strip shows up BY NAME
// rather than as a count that some other band movement could disguise.
const BANDED_PREHAB = [
  'Clamshells w/ band',            // glute med
  'Banded side steps',             // glute med
  'Banded monster walks',          // glute med
  'Standing band hip abduction',   // glute med
  'Seated banded hip flexion',     // hip flexor
  'Banded dorsiflexion',           // dorsiflexion
];
for (const nm of BANDED_PREHAB){
  const n = ['home_full','crossfit'].reduce((a,e) => a + countEq(ALL.per[e], nm), 0);
  if (n > 0) ok(`G9 "${nm}" still reaches home_full/crossfit (${n} items)`);
  else bad(`G9 "${nm}" is no longer prescribed on home_full or crossfit — D44 fix 3 is COPY ONLY, the banded prehab rail may not be stripped`);
}
for (const e of ['home_full','crossfit']){
  if (bandCount[e] > 0) ok(`G9b banded prehab still prescribed on ${e} (${bandCount[e]} items)`);
  else bad(`G9b band work disappeared from ${e} — D44 fix 3 is COPY ONLY, no prescription may change`);
}
// COPY, verbatim. D44 fix 3 adds one word to two cards and touches nothing else, so the
// oracle is the exact string, hand-written here from the ruling. This catches a reworded
// blurb, a dropped implement and a stray separator in one assertion. The other three
// cards are asserted UNCHANGED against the V192 text, also hand-copied.
const CARD_COPY = {
  home_full:  'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands',
  crossfit:   'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands',
  home_basic: 'Dumbbells, kettlebells, pull-up bar, bands. No barbell.',
  commercial: 'Full gym — cables, machines, barbells, everything',
  bodyweight: 'You, the floor, and something to pull on. No weights.',
};
for (const id of Object.keys(CARD_COPY)){
  if (cards[id] === CARD_COPY[id]) ok(`G10 ${id} card copy is verbatim`);
  else bad(`G10 ${id} card copy drifted:\n       want "${CARD_COPY[id]}"\n       got  "${cards[id]}"`);
}
// Copy rule on the two strings D44 wrote: no mid-sentence hyphen or em-dash beyond the
// compound nouns already in the V192 text ('pull-up bar', 'rower/bike').
for (const id of ['home_full','crossfit']){
  const d = String(cards[id]||'').replace(/pull-up|rower\/bike/g,'');
  if (!/—|–| - /.test(d)) ok(`G10b ${id} card copy introduces no dash`);
  else bad(`G10b ${id} card copy introduces a dash: "${cards[id]}"`);
}

// ── D47: the trim order (O5) ─────────────────────────────────────────────────
// A hand-built session, deliberately over the 20-set budget, with three sections: a
// protected Main, the prehab rail under the label the engine actually ships ('Chest + knee',
// which matches no protection pattern), and the core finisher as injectDynamicCore pushes it
// — core:true AND optional:true. The expected outcome is derived from the ruling in words:
// an optional section is not protected, and _secRank already ranks optional last, so the
// finisher pays first and the prehab rail is untouched. Then the SAME session with the
// optional flag removed: the finisher is protected again and the rail pays. One flag apart.
function session(optional){
  return [
    // Hand cost, using the budget's own published cost model (stretch 0, held/braced work
    // half, everything else one per set): squat 6 + raise 5 + squat hold 2 + wall sit 2 +
    // torso rotations 5 + thread-the-needle 2 = 22 against a cap of 20. Two sets over, so
    // exactly one item has to go and WHICH ONE is the whole ruling.
    { label: 'Main', items: [ { name: 'Barbell back squat', detail: '6×5' } ] },
    { label: 'Chest + knee', superset: true, items: [
      { name: 'Dumbbell lateral raise', detail: '5×12' },
      { name: 'Spanish squat hold (KB)', detail: '4×30 sec' },
      { name: 'Wall sit', detail: '4×45 sec' } ] },
    Object.assign({ label: '', core: true, coreHeader: 'Core — Rotational Power', items: [
      { name: 'Standing torso rotations (slow)', detail: '5×10 each' },
      { name: 'Side plank thread-the-needle', detail: '4×10 each' } ] }, optional ? { optional: true } : {}),
  ];
}
const namesIn = (secs, pred) => secs.filter(pred).reduce((a, s) => a.concat((s.items||[]).map(i => i.name)), []);
const isCore = s => !!(s && s.core);
const isRail = s => String((s&&s.label)||'') === 'Chest + knee';
const isMain = s => String((s&&s.label)||'') === 'Main';

let trimOpt = null, trimFixed = null;
try {
  IA.ctx.__g193_optional = session(true);
  IA.ctx.__g193_fixed    = session(false);
  trimOpt   = IA.eval('capSessionBudget(__g193_optional, null)');
  trimFixed = IA.eval('capSessionBudget(__g193_fixed, null)');
} catch(e){ bad(`G11 could not reach capSessionBudget: ${e.message}`); }

if (trimOpt && trimFixed){
  const railBefore = namesIn(session(true), isRail);
  const optRail  = namesIn(trimOpt, isRail);
  const optCore  = namesIn(trimOpt, isCore);
  const fixRail  = namesIn(trimFixed, isRail);
  const fixCore  = namesIn(trimFixed, isCore);
  console.log(`  D47 optional session -> rail [${optRail.join(', ')}] core [${optCore.join(', ')}]`);
  console.log(`  D47 fixed    session -> rail [${fixRail.join(', ')}] core [${fixCore.join(', ')}]`);

  // The input must actually be over budget, or neither run proves anything.
  const nOpt = trimOpt.reduce((a,s)=>a+((s&&s.items)||[]).length,0);
  const nFix = trimFixed.reduce((a,s)=>a+((s&&s.items)||[]).length,0);
  if (nOpt < 6 && nFix < 6) ok(`G11a the hand session is over budget (6 items -> ${nOpt} optional / ${nFix} fixed)`);
  else bad(`G11a the hand session was NOT over budget (6 -> ${nOpt} / ${nFix}) — nothing was trimmed and G11b..G11e prove nothing`);

  if (optCore.length < 2) ok(`G11b optional finisher pays first (core ${2}->${optCore.length})`);
  else bad('G11b the optional core finisher was not touched — _protected is still protecting a section the engine flagged optional');
  if (optRail.join('|') === railBefore.join('|')) ok('G11c the prehab rail is intact when the finisher is optional');
  else bad(`G11c the prehab rail lost work while an OPTIONAL finisher survived: [${optRail.join(', ')}] vs [${railBefore.join(', ')}]`);

  // Control: without the optional flag the core is protected and the rail pays. If this
  // passes too, the clause is not keyed on 'optional' at all.
  if (fixCore.length === 2) ok('G11d control: a NON-optional core section is still protected');
  else bad(`G11d control: a non-optional core section lost work (${fixCore.length}/2) — the clause is not keyed on the optional flag`);
  if (fixRail.length < railBefore.length) ok('G11e control: with the core protected the rail is what pays');
  else bad('G11e control: neither the core nor the rail paid — the hand session is not exercising the trim loop');

  // The protections D47 did NOT touch.
  if (namesIn(trimOpt, isMain).length === 1 && namesIn(trimFixed, isMain).length === 1) ok('G11f the Main section is protected in both runs');
  else bad('G11f the Main section lost work — D47 must not change any non-optional protection');
}

// ── D49: the anti_rotation pillar, hand-counted ─────────────────────────────
// O1/O2 again, for the pillar D49 changed. Implement need per member, typed by hand off the
// movement name and what the movement physically requires — never read out of _auxGearOK:
//   Bird dogs           none (contralateral reach, the limb is the load)
//   Side plank          none
//   Plank shoulder taps none (the base narrows under a shifting bodyweight load)
//   Pallof press        a band or a cable to press against
//   Dumbbell renegade rows / Farmer carry / Suitcase carry   something loaded to hold
const AR_MEMBERS = [
  { name: 'Bird dogs',              need: null },
  { name: 'Side plank',             need: null },
  { name: 'Plank shoulder taps',    need: null },
  { name: 'Pallof press',           need: 'bands' },
  { name: 'Dumbbell renegade rows', need: 'load' },
  { name: 'Farmer carry',           need: 'load' },
  { name: 'Suitcase carry',         need: 'load' },
];
// Legal member count per tier, counted by hand off TIERS and the need column above:
// bodyweight owns neither bands nor load -> the 3 gear-free members. minimal owns load but
// no bands -> 3 + 3 = 6. Every other tier owns both -> 7.
const AR_LEGAL = { bodyweight: 3, minimal: 6, home_basic: 7, home_full: 7, commercial: 7, crossfit: 7 };
for (const e of EQUIP){
  const hand = AR_MEMBERS.filter(m => m.need === null || TIERS[e][m.need]).length;
  if (hand === AR_LEGAL[e]) ok(`G12 hand table agrees with itself on ${e}: ${hand} legal anti-rotation members`);
  else bad(`G12 the gate's own two oracles disagree on ${e}: need-column gives ${hand}, AR_LEGAL says ${AR_LEGAL[e]}`);
  // The floor D46-c wrote down: a pillar may never be filtered below two, because a
  // one-member pillar cannot fill a pair and the fallback to the raw list is forbidden.
  if (AR_LEGAL[e] >= 2) ok(`G12a anti_rotation holds ${AR_LEGAL[e]} legal members on ${e} (floor 2)`);
  else bad(`G12a anti_rotation is below the floor of two legal members on ${e}`);
  // O4 per tier, not in aggregate. G2 only proves a gated movement survives SOMEWHERE.
  // A band predicate narrowed to a cable predicate would keep the Pallof press on
  // commercial and quietly delete it from the three other tiers that own bands, and the
  // aggregate check cannot see that.
  if (!TIERS[e].bands) continue;
  const nP = countEq(ALL.per[e], 'Pallof press');
  if (nP > 0) ok(`G12b "Pallof press" still prints on ${e}, which owns bands (${nP} items)`);
  else bad(`G12b "Pallof press" never prints on ${e}, which owns bands — the gear tag deleted the movement from a tier that can do it`);
}

// The DRAW, with the set budget bypassed for the same reason G3 bypasses it: after D47 the
// budget may legally trim an optional finisher, and a budget trim must not be mistaken for
// a pillar that collapsed onto one frozen pair.
const BW_WAS2 = IA.eval('typeof __BUDGET_OFF!=="undefined" ? __BUDGET_OFF : undefined');
IA.eval('var __BUDGET_OFF = true;');
const arSeen = {}, arPairs = {}, arBlocks = {}, arStatic = {};
for (const e of EQUIP){
  arSeen[e] = new Set(); arPairs[e] = new Set(); arBlocks[e] = 0; arStatic[e] = 0;
  for (const c of CELLS_BY_TIER[e]){
    let prog;
    try { prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over)); }
    catch (err){ bad(`G13 build threw on ${c.tag}: ${err.message}`); continue; }
    for (const wk of Object.keys(prog.weeks || {}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections||[])) if (s && s.core && s.pillar === 'anti_rotation'){
          const names = (s.items||[]).filter(Boolean).map(i => clean(i && i.name));
          arBlocks[e]++;
          names.forEach(n => arSeen[e].add(n));
          arPairs[e].add(names.slice().sort().join(' + '));
          if (names.indexOf('Side plank') >= 0) arStatic[e]++;
        }
      }
  }
}
IA.eval(BW_WAS2 === undefined ? 'var __BUDGET_OFF = undefined;' : `var __BUDGET_OFF = ${JSON.stringify(BW_WAS2)};`);
console.log('  anti_rotation blocks / distinct members / distinct pairs by tier ' +
  JSON.stringify(Object.fromEntries(EQUIP.map(e => [e, [arBlocks[e], arSeen[e].size, arPairs[e].size]]))));

for (const e of EQUIP){
  if (arBlocks[e] > 120) ok(`G13 ${arBlocks[e]} anti_rotation blocks observed on ${e} across all four injury paths`);
  else bad(`G13 only ${arBlocks[e]} anti_rotation blocks on ${e} — the pillar claims below are untested`);
  // Ceiling: the draw may never reach a member the tier has no implement for.
  const illegal = [...arSeen[e]].filter(n => {
    const m = AR_MEMBERS.filter(x => x.name === n)[0];
    return m && m.need && !TIERS[e][m.need];
  });
  if (!illegal.length) ok(`G13a every anti_rotation member drawn on ${e} is legal there`);
  else bad(`G13a ${e} drew members its tier owns no implement for: ${illegal.join(', ')}`);
  if (arSeen[e].size <= AR_LEGAL[e]) ok(`G13b ${e} drew ${arSeen[e].size} distinct members, at or under the ${AR_LEGAL[e]} legal`);
  else bad(`G13b ${e} drew ${arSeen[e].size} distinct anti_rotation members but only ${AR_LEGAL[e]} are legal there`);
  // The defect D49 exists for. Three legal members rotated pairwise give the pairs
  // (m0,m1), (m1,m2), (m2,m0) — three of them. So a tier holding three or more legal
  // members must never print a single frozen pair, and bodyweight is the tier that did.
  if (arPairs[e].size >= 3) ok(`G14 ${e} prints ${arPairs[e].size} distinct anti-rotation pairings (>=3, the pairwise rotation of three members)`);
  else bad(`G14 ${e} prints only ${arPairs[e].size} distinct anti-rotation pairing(s) over ${arBlocks[e]} blocks — the pillar is frozen (NSW p.7: different variations on different days)`);
  // NSW p.7 item 7: static AND dynamic. 'Side plank' is the static hold in this pillar.
  // It must appear, and it must NOT be the whole story.
  if (arStatic[e] > 0) ok(`G14a ${e} still gets the static hold (Side plank in ${arStatic[e]}/${arBlocks[e]} blocks)`);
  else bad(`G14a ${e} never draws the static hold in anti_rotation — NSW p.7 item 7 wants static AND dynamic`);
  if (arStatic[e] < arBlocks[e]) ok(`G14b ${e} is not static-only in anti_rotation (${arBlocks[e]-arStatic[e]} blocks without Side plank)`);
  else bad(`G14b every anti_rotation block on ${e} contains Side plank — the pillar has no dynamic variety`);
}

// ── D49 identity: the additions reuse the file's EXISTING spellings ──────────
// A second spelling of a movement is a second identity for exStoreKey and a silent split of
// the athlete's logged history. The singular forms must not exist on any card, and the alias
// row that folds the singular must still point at the plural.
const SING = /\bBird dog\b(?!s)|\bPlank shoulder tap\b(?!s)/;
let singHits = 0, singSample = '';
for (const e of EQUIP) for (const r of ALL.per[e]) for (const x of r.items)
  if (SING.test(x.name)){ singHits++; if(!singSample) singSample = `${e} ${r.seed} ${x.name}`; }
if (singHits === 0) ok('G15 no singular "Bird dog" / "Plank shoulder tap" spelling on any card');
else bad(`G15 ${singHits} items use a second spelling of a D49 movement (${singSample}) — exStoreKey would split the athlete's history`);

// EX_KEY_ALIAS is keyed by SLUG, not by display name, so the claim is asked of
// exStoreKey — the single writer of ia_exw_ keys — and not of the raw map.
const sk = n => IA.exStoreKey(n);
if (sk('Bird dog') === sk('Bird dogs')) ok(`G15a "Bird dog" and "Bird dogs" resolve to one store key (${sk('Bird dogs')})`);
else bad(`G15a "Bird dog" -> ${sk('Bird dog')} but "Bird dogs" -> ${sk('Bird dogs')} — the plural in the pillar splits the athlete's history`);
for (const n of ['Bird dogs', 'Plank shoulder taps', 'Side plank', 'Pallof press']){
  const chained = IA.eval(`EX_KEY_ALIAS[_exSlugRaw(${JSON.stringify(n)})]`);
  if (chained === undefined || chained === null) ok(`G15b "${n}" is a terminal store key (${sk(n)}), no alias row and no chain`);
  else bad(`G15b "${n}" slug is itself aliased to ${JSON.stringify(chained)} — a pillar member must be the storage identity, not a redirect`);
}
// Both additions must carry the dose they inherited from 'Pallof press' inside this pillar,
// and no anti-rotation item may ship without one.
let doseless = [];
for (const e of EQUIP) for (const r of ALL.per[e]) for (const x of r.items) if (!x.name) doseless.push(e);
const AR_DOSE = IA.eval(`(function(){var o={};(CORE_PILLARS.anti_rotation.items||[]).forEach(function(i){o[i.name]=i.detail;});return o;})()`);
console.log('  anti_rotation doses ' + JSON.stringify(AR_DOSE));
for (const n of ['Bird dogs', 'Plank shoulder taps']){
  if (AR_DOSE[n] && AR_DOSE[n] === AR_DOSE['Pallof press']) ok(`G16 "${n}" carries the pillar's inherited dose ${AR_DOSE[n]}`);
  else bad(`G16 "${n}" dose is ${JSON.stringify(AR_DOSE[n])}, not the ${JSON.stringify(AR_DOSE['Pallof press'])} it was ruled to inherit from Pallof press`);
}


console.log(`\nPASS ${PASS} FAIL ${FAIL}`);
if (FAIL) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
