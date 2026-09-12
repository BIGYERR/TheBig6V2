// GATE g193_rotation_reach — V193 D46-a, the rotational_power rotation clock.
//
// RULING (D46-a). CORE_PILLARS.rotational_power was the only pillar SELECTED by a modulus
// of R and then INDEXED by R. rot(arr,n) reads arr[(R-1+n) % len], so passing n=R made the
// index 2R-1; with the pillar live only on even R that index was a constant mod a 4-member
// array, and the pair was frozen for all 14 weeks on every tier. The fix: each pillar is
// indexed by its OWN turn counter — floor(R/2) in the hot-tomorrow branch (pillars alternate
// on R%2), floor((R-1)/3) in the clear-runway branch (key cycles three ways on (R-1)%3) —
// and the surviving _pi(key).slice(0,2) becomes the same rotated, deduped pair V178 (D6)
// gave dynamic_bracing.
//
// ORACLES — none of them asks the engine what it drew and then agrees with it.
//   O1 HAND TABLE. The member list is read out of the SOURCE (order is the pillar's own
//      declaration order). The expected pairs below were computed BY HAND from the ruling's
//      rule — "index by the pillar's own clock T, pair is (T-1+T, T-1+T+1) mod k" — and are
//      written here as literal names. If the pillar's membership or order changes, this gate
//      fails loudly and on purpose: the hand table is the gate's own belief.
//   O2 ARITHMETIC REACHABILITY, stated in words: a stride-2 walk over an ODD-length array
//      visits every element (gcd(2,7)=1); over the gear-gated 6-member array the three pair
//      starts {1,3,5} cover all six. So every gear-legal member of the pillar MUST be
//      reachable on its tier inside a 14-week build. This is the defect D46-a names.
//   O3 THE DEFECT ITSELF: the pillar's cable movement must print on the tier that owns a
//      cable, and the hot-tomorrow draw must not repeat one single pair at every selection.
//   O4 SOURCE: the V178 (D6) "first two members, forever" pattern must not survive anywhere
//      in getDynamicCoreBlock. Comments stripped before the scan (standing rule).
const fs = require('fs');
const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);
const HTML = fs.readFileSync(FILE, 'utf8');

let PASS = 0, FAIL = 0;
const fails = [];
const ok  = m => { PASS++; if (m) console.log('  ok   ' + m); };
const bad = m => { FAIL++; fails.push(m); };
const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// ── the pillar's declared membership, read from source ───────────────────────
const blk = HTML.match(/rotational_power:\s*\{[\s\S]*?items:\s*\[([\s\S]*?)\n\s*\]/);
const MEMBERS = blk ? [...blk[1].matchAll(/\{name:'([^']+)'/g)].map(m => m[1]) : [];
if (MEMBERS.length >= 4) ok(`R0 rotational_power membership read from source (${MEMBERS.length})`);
else bad('R0 could not parse CORE_PILLARS.rotational_power members out of the source');
// V193 (D46-c): there is no longer a "everything except the landmine" tier. The gate's
// legality belief is the per-tier LEGAL table below, hand typed from the movement names and
// the wizard cards. A single derived list cannot express four different inventories.
const NOT_LEGAL_ANYWHERE = MEMBERS.filter(n => false);

// ── O1: hand table ───────────────────────────────────────────────────────────
// Declaration order the table was computed against, transcribed by hand.
const ORDER = [
  'Windshield wipers',                 // 0
  'Medicine ball rotary toss',         // 1
  'Cable woodchoppers',                // 2
  'Landmine rotations',                // 3
  'Standing torso rotations (slow)',   // 4
  'Side plank thread-the-needle',      // 5
  'Band woodchopper (door anchor)',    // 6
];
if (MEMBERS.join('|') === ORDER.join('|')) ok('R1 source membership matches the hand table order');
else bad(`R1 hand table is stale: source order is [${MEMBERS.join(' | ')}]`);

// commercial owns a barbell, so the pillar is UNGATED there: k = 7, indices mod 7.
// hot-tomorrow: T = R/2, pair = ((T-1+T)%7, (T-1+T+1)%7) = (2T-1, 2T).
const HOT_TABLE = {
  2:  ['Medicine ball rotary toss', 'Cable woodchoppers'],              // T=1 -> 1,2
  4:  ['Landmine rotations', 'Standing torso rotations (slow)'],        // T=2 -> 3,4
  6:  ['Side plank thread-the-needle', 'Band woodchopper (door anchor)'],// T=3 -> 5,6
  8:  ['Windshield wipers', 'Medicine ball rotary toss'],               // T=4 -> 0,1
  10: ['Cable woodchoppers', 'Landmine rotations'],                     // T=5 -> 2,3
  12: ['Standing torso rotations (slow)', 'Side plank thread-the-needle'],// T=6 -> 4,5
};
// clear-runway: rotational_power is the index-2 slot of [(R-1)%3], live when R%3===0.
// T = floor((R-1)/3), pair = (2T-1, 2T) mod 7.
const RUN_TABLE = {
  3: ['Band woodchopper (door anchor)', 'Windshield wipers'],           // T=0 -> -1=6, 0
  6: ['Medicine ball rotary toss', 'Cable woodchoppers'],               // T=1 -> 1,2
  9: ['Landmine rotations', 'Standing torso rotations (slow)'],         // T=2 -> 3,4
  12:['Side plank thread-the-needle', 'Band woodchopper (door anchor)'],// T=3 -> 5,6
};
const draw = (R, hot) =>
  IA.eval(`getDynamicCoreBlock(${R}, 'push', false, ${hot ? 'true' : 'false'}, 0, 'commercial')`);

for (const [R, want] of Object.entries(HOT_TABLE)){
  let b; try { b = draw(+R, true); } catch(e){ bad(`R2 hot-tomorrow draw at R=${R} threw: ${e.message}`); continue; }
  const got = (b.items||[]).map(i => clean(i.name));
  if (b.pillar !== 'rotational_power'){ bad(`R2 R=${R} selected ${b.pillar}, not rotational_power`); continue; }
  if (got.join(' + ') === want.join(' + ')) ok(`R2 hot-tomorrow R=${R} matches the hand table (${got.join(' + ')})`);
  else bad(`R2 hot-tomorrow R=${R}: hand table says [${want.join(' + ')}], engine drew [${got.join(' + ')}]`);
}
for (const [R, want] of Object.entries(RUN_TABLE)){
  let b; try { b = draw(+R, false); } catch(e){ bad(`R3 clear-runway draw at R=${R} threw: ${e.message}`); continue; }
  const got = (b.items||[]).map(i => clean(i.name));
  if (b.pillar !== 'rotational_power'){ bad(`R3 R=${R} selected ${b.pillar}, not rotational_power`); continue; }
  if (got.join(' + ') === want.join(' + ')) ok(`R3 clear-runway R=${R} matches the hand table (${got.join(' + ')})`);
  else bad(`R3 clear-runway R=${R}: hand table says [${want.join(' + ')}], engine drew [${got.join(' + ')}]`);
}

// ── the gear-legal membership per tier, hand typed (V193 D46-c) ─────────────
// The pillar is drawn through _auxGearOK now, so the reachable set is the LEGAL set, not
// the whole list. This table is the gate's own belief, read off the movement names and the
// wizard cards: cables are commercial only, med balls are commercial and crossfit, a
// landmine is a barbell, bands go to every tier whose card names bands (home_basic,
// home_full, crossfit) plus open-ended commercial. It is never read back out of _auxGearOK.
const LEGAL = {
  bodyweight: ['Windshield wipers','Standing torso rotations (slow)','Side plank thread-the-needle'],
  minimal:    ['Windshield wipers','Standing torso rotations (slow)','Side plank thread-the-needle'],
  home_basic: ['Windshield wipers','Standing torso rotations (slow)','Side plank thread-the-needle','Band woodchopper (door anchor)'],
  home_full:  ['Windshield wipers','Landmine rotations','Standing torso rotations (slow)','Side plank thread-the-needle','Band woodchopper (door anchor)'],
  commercial: ORDER.slice(),
  crossfit:   ['Windshield wipers','Medicine ball rotary toss','Landmine rotations','Standing torso rotations (slow)','Side plank thread-the-needle','Band woodchopper (door anchor)'],
};

// ── O3: the frozen-pair signature must be gone ───────────────────────────────
// O2 arithmetic, restated for a GATED pillar: the draw walks pair starts 2T-1 over a k-member
// legal list, so the number of distinct pairs over T=1..6 is fixed by k alone — 6 pairs on an
// odd k>=7, k/2 on an even k, and never 1 unless the index is frozen. The expected count is
// computed here from the hand-typed k, not from what the engine drew. k=4 (home_basic) yields
// TWO pairs and that is arithmetic, not a defect: an even-length list under a stride-2 walk
// only ever visits half its starts. Frozen means ONE.
const expectedPairs = k => {
  const seen = new Set();
  for (let T = 1; T <= 6; T++) seen.add([((2*T-1)%k+k)%k, ((2*T)%k+k)%k].sort((a,b)=>a-b).join('/'));
  return seen.size;
};
for (const tier of ['commercial','home_full','home_basic']){
  const pairs = new Set();
  for (const R of [2,4,6,8,10,12]){
    const b = IA.eval(`getDynamicCoreBlock(${R}, 'push', false, true, 0, '${tier}')`);
    pairs.add((b.items||[]).map(i => clean(i.name)).sort().join(' + '));
  }
  const want = expectedPairs(LEGAL[tier].length);
  if (pairs.size === want && want >= 2) ok(`R4 hot-tomorrow pair on ${tier} takes all ${want} values its ${LEGAL[tier].length}-member legal list allows over R=2..12`);
  else if (want < 2) bad(`R4 the hand table gives ${tier} only ${LEGAL[tier].length} legal members — a pillar that cannot fill a rotating pair`);
  else bad(`R4 hot-tomorrow pair on ${tier} takes ${pairs.size} distinct value(s) over R=2..12, arithmetic says ${want} for a ${LEGAL[tier].length}-member legal list — the pillar is not being indexed by its own turn count`);
}

// ── O2 + O3: reachability across the lattice ─────────────────────────────────
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const BARBELL = new Set(['home_full','commercial','crossfit']);   // hand table, D44
const SEEDS = [1013, 3039, 6078, 10130, 76308];
const seen = {}, woodchop = {};
for (const e of EQUIP){
  seen[e] = new Set(); woodchop[e] = 0;
  for (const seed of SEEDS){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment: e, seed }));
    for (const wk of Object.keys(prog.weeks||{}))
      for (const d of DAYS){
        const day = (prog.weeks[wk]||{})[d]; if (!day) continue;
        for (const s of (day.sections||[])) if (s && s.core){
          const names = (s.items||[]).map(i => clean(i.name));
          if (s.pillar === 'rotational_power') names.forEach(n => seen[e].add(n));
          woodchop[e] += names.filter(n => n === 'Cable woodchoppers').length;
        }
      }
  }
}
console.log('  distinct rotational_power members by tier ' +
  JSON.stringify(Object.fromEntries(EQUIP.map(e => [e, seen[e].size]))));
console.log('  "Cable woodchoppers" by tier ' + JSON.stringify(woodchop));

for (const e of EQUIP){
  // bodyweight names are rewritten by the _BW_SUBS sweep after the draw, so the pillar's own
  // names are not the right unit there; the floor from the ruling still applies.
  if (e === 'bodyweight'){
    if (seen[e].size >= 3) ok(`R5 bodyweight reaches ${seen[e].size} distinct rotational movements (floor 3)`);
    else bad(`R5 bodyweight reaches only ${seen[e].size} distinct rotational movements — below the D46 floor of 3`);
    continue;
  }
  const want = LEGAL[e];   // O2 + D46-c: the gear-legal membership, hand typed above
  const missing = want.filter(n => !seen[e].has(n));
  if (!missing.length) ok(`R5 every gear-legal rotational_power member is reachable on ${e} (${want.length})`);
  else bad(`R5 ${e} never reaches ${missing.length}/${want.length} gear-legal member(s): ${missing.join(', ')} — half the pillar is still unreachable`);
}
// O3: the cable movement on the only tier that owns a cable. Measured 0 before D46.
if (woodchop.commercial > 0) ok(`R6 "Cable woodchoppers" prints on commercial (${woodchop.commercial})`);
else bad('R6 "Cable woodchoppers" never prints on commercial — the pillar\'s cable movement is dead on the only tier that owns a cable');

// ── O4: source scan, comments stripped ───────────────────────────────────────
const fn = HTML.slice(HTML.indexOf('function getDynamicCoreBlock'));
const body = fn.slice(0, fn.indexOf('\n}') + 2).replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
if (!/_pi\(\s*[A-Za-z_$][\w$]*\s*\)\s*\.slice\(0,2\)/.test(body) && !/P\[[^\]]+\]\.items\.slice\(0,2\)/.test(body))
  ok('R7 the V178 (D6) "first two members, forever" pattern is gone from getDynamicCoreBlock');
else bad('R7 a raw pillar array is still truncated with .slice(0,2) inside getDynamicCoreBlock — that draw can never rotate');
const clocks = (body.match(/Math\.floor\(R\/2\)/g)||[]).length + (body.match(/Math\.floor\(\(R-1\)\/3\)/g)||[]).length;
if (clocks === 2) ok('R8 both own-turn clocks are present exactly once (floor(R/2), floor((R-1)/3))');
else bad(`R8 expected exactly 2 own-turn clock expressions in getDynamicCoreBlock, found ${clocks}`);

console.log('\nPASS ' + PASS + ' FAIL ' + FAIL);
if (fails.length){ console.log('\nFAILURES:'); fails.forEach(f => console.log('  - ' + f)); }
process.exit(FAIL ? 1 : 0);
