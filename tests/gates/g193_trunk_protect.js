// GATE g193_trunk_protect — V193 slice 4. The protect-tier upper-limb trunk block.
//
// RULING, FIX 1 (D46-c, reaching its third reader). D46-c ruled that the core pillar draw
// reads through _auxGearOK. Two readers were wired: draw time in getDynamicCoreBlock, swap
// time in auxSwapCandidates. The protect-tier shoulder/elbow push-day branch in buildSections
// builds its OWN anti-rotation draw and had NO gear gate at all, so 'Pallof press' — a band
// or cable movement, tagged 'band' by D49 — printed on bodyweight and on minimal, neither of
// which owns a band. The standing invariant is verbatim: pool and post-filter must reason
// about a movement through the same lens. Same predicate, same table, no second private list.
// The /carry/i strip on that branch is that day's own rule (a heavy carry is the wrong bill
// for a protect-tier shoulder) and is NOT a gear rule; it stays.
//
// RULING, FIX 2 (regression D49 caused). D49 put 'Bird dogs' into anti_rotation, and
// anti_extension.static has always held it. This branch pushes 'Trunk — anti-rotation' and
// 'Trunk — anti-extension' from two independent rotations, so the same movement landed on
// both sections of one card: 85 of 8,820 swept days. deconflictAdjacentDupes cannot see it —
// it compares ADJACENT DAYS and returns early on core items by design. Fix: on collision the
// ANTI-ROTATION section re-draws from its own pillar, because anti_extension.static is the
// more specific claim on 'Bird dogs' (it is the anti-extension member it was written as).
//
// ORACLES — none of these asks the engine what it did and then agrees with it.
//   O1 HAND TABLE of tier inventories, typed here from the wizard copy the athlete reads.
//      Bands live on home_basic / home_full / commercial / crossfit. 'minimal' is the
//      retired travel tier: load, no band. 'bodyweight' is you and the floor. This table is
//      the gate's own belief; it is never read back out of _auxGearOK.
//   O2 IMPLEMENT LOGIC in words: a Pallof press is an anti-rotation press against a band or
//      a cable stack. A tier that owns neither cannot perform it, whatever the name says.
//   O3 ONE CARD, ONE MOVEMENT. The two Trunk sections are two sections of ONE day. NSW p.7
//      ("Choose different variations ... for the same basic movement on different days") and
//      p.7 item 7 ("For the trunk, use a variety of static as well as dynamic exercises")
//      both forbid printing one movement twice on one card. Distinctness is asserted over
//      the UNION of the two sections, not within each.
//   O4 A RULING THAT SELECTS IS NOT A RULING THAT DELETES. Both Trunk sections keep exactly
//      two items on every tier, and 'Pallof press' still reaches the four tiers that own a
//      band through this same branch.
//   O5 THE DRAW, RE-DERIVED BY HAND. The gate types the two pillar member lists itself, from
//      the ruling, applies its own hand tier table and its own copy of the rotation
//      arithmetic (index (w-1+k) mod len, week number w), and applies the collision rule as
//      the ruling states it. What PRINTS is that draw after the injury passes have had their
//      say, and those passes are another ruling's business, so the comparison is containment
//      in order: every printed item must come from the hand-derived draw, in the hand-derived
//      order. A member that appears from nowhere, a reordered pair or a pair drawn off the
//      wrong rotation all fail; a member the shoulder plan removed downstream does not.
//      A contested week must move the ANTI-ROTATION member and never the anti-extension one,
//      which is asserted as: on a contested week the shared name never appears in the
//      anti-rotation section.
//   O6 PILLAR FLOOR, counted by hand off O1 + the member list: after the carry strip, the
//      gear gate and the anti-extension overlap, every tier must still offer at least TWO
//      distinct anti-rotation names. A fallback to the unfiltered list is the V122 _gear
//      trap and is not an acceptable answer to a thin pillar; the pillar must grow instead.

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; if (m) console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); console.log('  FAIL ' + m); };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── O1: the hand table ───────────────────────────────────────────────────────
const TIERS = {
  bodyweight: { load: false, bands: false },
  minimal:    { load: true,  bands: false },
  home_basic: { load: true,  bands: true  },
  home_full:  { load: true,  bands: true  },
  commercial: { load: true,  bands: true  },
  crossfit:   { load: true,  bands: true  },
};
const EQUIP = Object.keys(TIERS);
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const INJ = [
  { tag: 'shoulder/protect', injury: { region: 'shoulder', tier: 'protect' } },
  { tag: 'elbow/protect',    injury: { region: 'elbow',    tier: 'protect' } },
];

// ── O5: the member lists, hand typed from the ruling ─────────────────────────
// Order matters: it is the rotation order. A member added to either pillar without a ruling
// changes these lists and this gate says so, which is the point.
const AR_MEMBERS = [
  { name: 'Bird dogs',               need: null   },
  { name: 'Side plank',              need: null   },
  { name: 'Plank shoulder taps',     need: null   },
  { name: 'Pallof press',            need: 'bands' },  // O2: band or cable to press against
  { name: 'Dumbbell renegade rows',  need: 'load'  },
  { name: 'Farmer carry',            need: 'load'  },   // stripped by the day's /carry/i rule
  { name: 'Suitcase carry',          need: 'load'  },   // stripped by the day's /carry/i rule
];
const AE_MEMBERS = ['Plank hold', 'Bird dogs', 'McGill curl-up', 'Superman', 'RKC plank'];

// The gate's lists must still BE the pillars, or the gate is testing a fossil.
const LIVE_AR = IA.eval('CORE_PILLARS').anti_rotation.items.map(i => i.name);
const LIVE_AE = IA.eval('CORE_PILLARS').anti_extension.static.map(i => i.name);
if (JSON.stringify(LIVE_AR) === JSON.stringify(AR_MEMBERS.map(m => m.name))) ok('O5 anti_rotation membership matches the hand list, in rotation order');
else bad(`O5 anti_rotation membership drifted from the ruling: live ${JSON.stringify(LIVE_AR)} vs hand ${JSON.stringify(AR_MEMBERS.map(m=>m.name))}`);
if (JSON.stringify(LIVE_AE) === JSON.stringify(AE_MEMBERS)) ok('O5 anti_extension.static membership matches the hand list, in rotation order');
else bad(`O5 anti_extension.static membership drifted: live ${JSON.stringify(LIVE_AE)} vs hand ${JSON.stringify(AE_MEMBERS)}`);

// ── O6: the pillar floor, per tier, counted by hand ──────────────────────────
const arLegal = e => AR_MEMBERS
  .filter(m => !/carry/i.test(m.name))            // the day's own rule
  .filter(m => m.need === null || TIERS[e][m.need])
  .map(m => m.name);
for (const e of EQUIP){
  const legal = arLegal(e);
  const distinct = legal.filter(n => AE_MEMBERS.indexOf(n) < 0).length;   // worst case: anti-extension takes the overlap
  if (legal.length >= 2 && distinct >= 2) ok(`O6 ${e}: ${legal.length} legal anti-rotation members, ${distinct} still distinct after the anti-extension claim [${legal.join(', ')}]`);
  else bad(`O6 ${e}: anti-rotation offers ${legal.length} legal members and only ${distinct} that anti-extension cannot claim — below the floor of 2. The pillar must GROW; a fallback to the unfiltered list is the V122 trap`);
}

// ── the sweep ────────────────────────────────────────────────────────────────
// Only the two Trunk sections of the protect-tier upper-limb branch. Every other section on
// the card belongs to another ruling and is not this gate's business.
const AR_LABEL = 'Trunk — anti-rotation';
const AE_LABEL = 'Trunk — anti-extension';

const rows = [];   // {equip, seed, tag, wk, d, ar:[names], ae:[names]}
let days = 0, builds = 0;
for (const inj of INJ) for (const equipment of EQUIP) for (const seed of SEEDS){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, { equipment, seed, injury: inj.injury });
  let prog;
  try { prog = IA.buildProgram(cfg); builds++; }
  catch (err){ bad(`build threw ${inj.tag} ${equipment} seed=${seed}: ${err.message}`); continue; }
  const weeks = prog.weeks || {};
  for (const wk of Object.keys(weeks)) for (const d of DAYS){
    const day = weeks[wk][d]; if (!day) continue;
    days++;
    const secs = day.sections || [];
    const get = lbl => secs.filter(s => clean(s.label) === lbl);
    const arS = get(AR_LABEL), aeS = get(AE_LABEL);
    if (!arS.length && !aeS.length) continue;
    // Either section may be REMOVED downstream by an injury pass that owns its own ruling;
    // two copies of one section would be this branch's defect, so that is the failure.
    if (arS.length > 1 || aeS.length > 1){
      bad(`${inj.tag} ${equipment} seed=${seed} W${wk} ${d.toUpperCase()}: ${arS.length} anti-rotation / ${aeS.length} anti-extension sections on one card`);
      continue;
    }
    rows.push({
      equipment, seed, tag: inj.tag, wk: +wk, d,
      hasAR: arS.length === 1, hasAE: aeS.length === 1,
      ar: arS.length ? (arS[0].items || []).map(i => clean(i && i.name)) : [],
      ae: aeS.length ? (aeS[0].items || []).map(i => clean(i && i.name)) : [],
      all: secs.reduce((a, s) => a.concat((s.items || []).map(i => clean(i && i.name))), []),
    });
  }
}
console.log(`  swept ${days} days over ${builds} builds; ${rows.length} protect-tier upper-limb trunk blocks`);
if (rows.length >= 100) ok(`lattice is thick enough to see the seam (${rows.length} blocks)`);
else bad(`only ${rows.length} trunk blocks found — the gate is blind, it is not passing`);

// ── G1 (fix 1): gear legality, both directions ───────────────────────────────
const perTier = {};
EQUIP.forEach(e => perTier[e] = rows.filter(r => r.equipment === e));
for (const m of AR_MEMBERS){
  if (m.need === null) continue;
  if (/carry/i.test(m.name)) continue;   // the day's /carry/i rule owns these; G1c asserts them
  for (const e of EQUIP){
    const n = perTier[e].reduce((a, r) => a + r.ar.filter(x => x === m.name).length, 0);
    if (TIERS[e][m.need]){
      if (n > 0) ok(`G1b "${m.name}" still reaches ${e} through this branch (${n})`);
      else bad(`G1b "${m.name}" never printed on ${e}, which owns its implement — the gate DELETED it instead of selecting against it`);
    } else {
      if (n === 0) ok(`G1a no "${m.name}" on ${e} (tier owns no ${m.need})`);
      else bad(`G1a ${n} "${m.name}" items on ${e}, which owns no ${m.need} — the protect-tier branch is still an ungated reader of the pillar`);
    }
  }
}
// The carries are this day's own rule, not gear. Zero on EVERY tier, band tiers included.
for (const e of EQUIP){
  const n = perTier[e].reduce((a, r) => a + r.ar.filter(x => /carry/i.test(x)).length, 0);
  if (n === 0) ok(`G1c no carry in the anti-rotation draw on ${e} (protect-tier upper limb owes no grip or scapular bill)`);
  else bad(`G1c ${n} carries printed on ${e} in the anti-rotation draw`);
}

// ── G2 (fix 2): one card, one movement ───────────────────────────────────────
let dupTrunk = 0, dupCard = 0, firstDup = '';
for (const r of rows){
  const union = r.ar.concat(r.ae);
  const seen = {};
  let d = false;
  union.forEach(n => { if (seen[n]) d = true; seen[n] = 1; });
  if (d){ dupTrunk++; if (!firstDup) firstDup = `${r.tag} ${r.equipment} seed=${r.seed} W${r.wk} ${r.d.toUpperCase()} ar=${JSON.stringify(r.ar)} ae=${JSON.stringify(r.ae)}`; }
  const cnt = {};
  r.all.forEach(n => { cnt[n] = (cnt[n] || 0) + 1; });
  if (Object.keys(cnt).some(n => cnt[n] > 1 && (r.ar.indexOf(n) >= 0 || r.ae.indexOf(n) >= 0))) dupCard++;
}
if (dupTrunk === 0) ok(`G2a no movement printed twice across the two Trunk sections (${rows.length} blocks)`);
else bad(`G2a ${dupTrunk} of ${rows.length} cards print one movement twice in the trunk block: ${firstDup}`);
if (dupCard === 0) ok('G2b no trunk movement is repeated anywhere else on the same card');
else bad(`G2b ${dupCard} of ${rows.length} cards repeat a trunk movement elsewhere on the day`);

// ── G3 (O4): selection is not deletion ──────────────────────────────────────
// The anti-rotation section is the one this slice touches, and it must survive on every
// block. Downstream injury passes may thin either section — that is their ruling, not this
// one — so a thinned section is REPORTED with its denominator, never silently accepted as a
// pass, and a present-but-empty section or a hole is a hard failure.
let holes = 0, holeWho = '', emptySec = 0, thinAR = 0, thinAE = 0, noAR = 0;
for (const r of rows){
  if (!r.hasAR) noAR++;
  if (r.hasAR && r.ar.length === 0){ emptySec++; }
  if (r.hasAE && r.ae.length === 0){ emptySec++; }
  if (r.ar.concat(r.ae).some(n => !n)){ holes++; if (!holeWho) holeWho = `${r.tag} ${r.equipment} seed=${r.seed} W${r.wk} ${r.d.toUpperCase()}`; }
  if (r.hasAR && r.ar.length < 2) thinAR++;
  if (r.hasAE && r.ae.length < 2) thinAE++;
}
if (holes === 0) ok(`G3a no hole in any trunk item slot (${rows.length} blocks)`);
else bad(`G3a ${holes} of ${rows.length} trunk blocks contain an item with no name — a pillar was filtered to nothing and the draw handed back a hole: ${holeWho}`);
if (emptySec === 0) ok('G3b no trunk section printed with zero items');
else bad(`G3b ${emptySec} trunk sections printed empty`);
if (noAR === 0) ok(`G3c the anti-rotation section is present on all ${rows.length} blocks`);
else bad(`G3c ${noAR} of ${rows.length} blocks lost the anti-rotation section entirely`);
console.log(`  thin (post-filter) anti-rotation ${thinAR}/${rows.length}, anti-extension ${thinAE}/${rows.filter(r=>r.hasAE).length} present sections — downstream injury and budget passes, not this draw`);
// O4, stated as a budget rather than a zero. The draw ALWAYS hands over two members; the
// downstream shoulder/elbow passes and the session-budget trim (D47/D48) then take some of
// them away, and that is their ruling, not this one. Measured on this lattice: 49 of 1061
// blocks print a one-item anti-rotation section, four movements across the two regions, all
// of them removed after the draw. The ceiling is written here by hand with room over the
// measurement, and it exists so a DRAW that stops filling its second slot cannot hide inside
// the noise: that failure mode is 100 percent, not 5.
const THIN_CEILING = 0.08;
const thinRate = rows.length ? thinAR / rows.length : 1;
if (thinRate <= THIN_CEILING) ok(`G3d one-item anti-rotation sections ${thinAR}/${rows.length} (${(thinRate*100).toFixed(1)}%), under the ${(THIN_CEILING*100).toFixed(0)}% ceiling — the draw is filling both slots`);
else bad(`G3d ${thinAR} of ${rows.length} anti-rotation sections print one item (${(thinRate*100).toFixed(1)}%), over the ${(THIN_CEILING*100).toFixed(0)}% ceiling — the draw is not filling its second slot`);

// ── G4 (O5): the draw, re-derived by hand ────────────────────────────────────
function rotOf(w){ return (arr, k) => arr[(((w - 1 + k) % arr.length) + arr.length) % arr.length]; }
function derived(equipment, w){
  const rot = rotOf(w);
  const ae = [rot(AE_MEMBERS, 0), rot(AE_MEMBERS, 2)];
  const legal = arLegal(equipment);
  const taken = {}; ae.forEach(n => taken[n] = 1);
  const ar = [];
  for (let k = 0; k < legal.length && ar.length < 2; k++){
    const n = rot(legal, k);
    if (taken[n]) continue;
    taken[n] = 1; ar.push(n);
  }
  const plain = [rot(legal, 0), rot(legal, 1)];
  return { ar, ae, plain, collided: plain.some(n => ae.indexOf(n) >= 0) };
}
// order-preserving containment: printed must be drawn FROM the hand list, in that order
const isSub = (small, big) => { let i = 0; for (const n of small){ const j = big.indexOf(n, i); if (j < 0) return false; i = j + 1; } return true; };

let offDraw = 0, offWho = '', contested = 0, kept = 0, moved = 0;
for (const r of rows){
  const dv = derived(r.equipment, r.wk);
  if (!isSub(r.ar, dv.ar) || !isSub(r.ae, dv.ae)){
    offDraw++;
    if (!offWho) offWho = `${r.tag} ${r.equipment} seed=${r.seed} W${r.wk} ${r.d.toUpperCase()} printed ar=${JSON.stringify(r.ar)} ae=${JSON.stringify(r.ae)}; hand draw ar=${JSON.stringify(dv.ar)} ae=${JSON.stringify(dv.ae)}`;
  }
  if (!dv.collided) continue;
  contested++;
  const shared = dv.plain.filter(n => dv.ae.indexOf(n) >= 0);
  // the anti-extension section keeps the shared name; the anti-rotation section must not hold it
  if (!shared.some(n => r.ar.indexOf(n) >= 0)) moved++;
  if (JSON.stringify(dv.ar) !== JSON.stringify(dv.plain)) kept++;
}
if (offDraw === 0) ok(`G4a all ${rows.length} trunk blocks are drawn from the hand-derived rotation, in order`);
else bad(`G4a ${offDraw} of ${rows.length} trunk blocks print something the hand-derived draw does not: ${offWho}`);
if (contested > 0) ok(`G4b ${contested} of ${rows.length} blocks are collision weeks — the fix has work to do on this lattice`);
else bad('G4b no collision week appeared in the whole lattice — the gate cannot tell the fix from a no-op, widen it');
if (moved === contested) ok(`G4c on all ${contested} collision weeks the shared movement stayed with anti-extension and the anti-rotation section drew elsewhere`);
else bad(`G4c ${contested - moved} of ${contested} collision weeks still print the shared movement in the anti-rotation section`);
if (kept === contested) ok(`G4d the hand rule itself moves the anti-rotation pick on all ${contested} collision weeks (so G4c is not vacuous)`);
else bad(`G4d the hand rule left the anti-rotation pick unchanged on ${contested - kept} collision weeks — the oracle is not exercising the rule`);

// ── G5: the gate would have failed on the shipped bug ────────────────────────
// Stated, not asserted through the engine: on the pre-fix artifact, 'Pallof press' printed 20
// times on bodyweight and 20 on minimal under this branch, and 'Bird dogs' printed twice on
// one card on 85 of 8,820 swept days. G1a and G2a are the two claims that catch those.
const pallofBW = perTier.bodyweight.reduce((a, r) => a + r.ar.filter(x => x === 'Pallof press').length, 0)
               + perTier.minimal.reduce((a, r) => a + r.ar.filter(x => x === 'Pallof press').length, 0);
if (pallofBW === 0) ok('G5 the two band-less tiers print zero Pallof presses through this branch (was 20 + 20)');
else bad(`G5 ${pallofBW} Pallof presses still on bodyweight + minimal`);

console.log(`\nPASS ${PASS} FAIL ${FAIL}`);
if (FAIL) { console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); process.exit(1); }
