// GATE g192_labelsync — V192 D43 follow-on: the heading follows the item.
//
// Ruling: applyInjuryFilter renames an item in place (P.swapNames, SPINE_SWAP).
// The section heading embeds the movement drawn at build time ('Main — ' +
// ex.chestMain), so after a rename the heading advertised a lift the athlete was
// not prescribed: 'Main — Dumbbell bench press' over a prescribed 'Dumbbell floor
// press', and on the no-gear tier a dumbbell the athlete does not own. §10b: a
// conditional write with no else branch is a latch; the claim belongs to the item.
//
// ORACLE (independent of the engine):
//  1. A heading of the form '<slot> — <movement>' is a CLAIM. It holds only if some
//     item in that section is named <movement>. The movement vocabulary is read off
//     a HEALTHY control lattice (never off the injured corpus, which would hide the
//     very names the overlay swaps away) plus a hand table of swap-map keys.
//  2. The parked class is named, not waived: a surviving mismatch is legal ONLY if
//     its heading names a movement the shoulder/workaround overlay DELETES. That
//     list is transcribed by hand from the doctrine of the tier (overhead range,
//     dips, pike/handstand, lateral raise). Anything else is a FAIL, so a new
//     mismatch class cannot hide inside the parked one. See §12.
//  3. D43 itself must still fire: on a tier that owns dumbbells, a shoulder/
//     workaround program prescribes 'Dumbbell floor press' and never 'Dumbbell
//     bench press'; the same cfg WITHOUT the injury still prescribes the bench
//     press. Syncing the label must not disable the swap, and the swap must not
//     leak into a healthy program.

const path = require('path');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const IA = load(FILE);

let PASS = 0, FAIL = 0;
const fails = [];
function ok(){ PASS++; }
function bad(msg){ FAIL++; fails.push(msg); }

const clean = s => String(s || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();

// The six real equipment tiers. hasBarbell = home_full | commercial | crossfit.
const EQUIP = ['bodyweight', 'minimal', 'home_basic', 'home_full', 'commercial', 'crossfit'];
const SEEDS = [1013, 3039, 6078, 10130];

// Hand table: every key of every in-place rename map reachable from an overlay.
// These are movement names even when the overlay swaps them away everywhere.
const SWAP_KEYS = [
  'Dumbbell bench press',                                    // shoulder/workaround (D43)
  'Dumbbell skullcrushers', 'Barbell curl', 'Preacher curl', // elbow/workaround
  'Ab wheel rollouts', 'Hanging knee raises', 'L-sit hold',
  'L-sit chinups', 'Hanging leg raises',                     // spine-safe core
];

// Hand-transcribed from the shoulder/workaround doctrine: the movements the tier
// DELETES outright. A heading left naming one of these is the parked §12 class
// (a different mechanism: the item is removed, not renamed).
const SHOULDER_WORKAROUND_DELETED = /overhead|arnold|push press|military|pike pushup|handstand|wall walk|\bdips\b|lateral raise/i;

function sectionsOf(prog){
  const out = [];
  const weeks = prog.weeks || {};
  const total = Object.keys(weeks).length;
  for (const wk of Object.keys(weeks))
    for (const d of DAYS) {
      const day = weeks[wk][d];
      if (!day) continue;
      for (const s of (day.sections || []))
        out.push({ wk: +wk, lastWk: total, d, label: String(s.label || ''),
                   names: (s.items || []).map(i => clean(i.name)) });
    }
  return out;
}

// ── vocabulary from the healthy control lattice ──────────────────────────────
const VOCAB = new Set(SWAP_KEYS);
let healthySections = 0;
const healthyHasBench = {};
for (const equipment of EQUIP) {
  let n = 0;
  for (const seed of SEEDS) {
    const secs = sectionsOf(IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, { equipment, seed })));
    healthySections += secs.length;
    for (const s of secs) {
      s.names.forEach(x => { if (x) VOCAB.add(x); });
      n += s.names.filter(x => x === 'Dumbbell bench press').length;
    }
  }
  healthyHasBench[equipment] = n;
}
if (healthySections > 500) ok(); else bad(`healthy control lattice too thin: ${healthySections} sections`);
if (VOCAB.size > 100) ok(); else bad(`movement vocabulary too thin: ${VOCAB.size} names`);

// ── injured lattice: every heading claim must hold ───────────────────────────
let injSections = 0, claims = 0, swapMismatch = 0, parked = 0, unexplained = 0, primerClaims = 0, raceWeekPrimer = 0;
const swapSamples = [], unexplainedSamples = [];
const floorPress = {}, benchLeak = {};

for (const equipment of EQUIP) {
  floorPress[equipment] = 0; benchLeak[equipment] = 0;
  for (const seed of SEEDS) {
    const cfg = Object.assign({}, fixtures.HALF_MANNY,
      { equipment, seed, injury: { region: 'shoulder', tier: 'workaround' } });
    let prog;
    try { prog = IA.buildProgram(cfg); }
    catch (e) { bad(`build threw equipment=${equipment} seed=${seed}: ${e.message}`); continue; }
    for (const s of sectionsOf(prog)) {
      injSections++;
      floorPress[equipment] += s.names.filter(x => x === 'Dumbbell floor press').length;
      benchLeak[equipment]  += s.names.filter(x => x === 'Dumbbell bench press').length;
      const i = s.label.lastIndexOf(' — ');
      if (i < 0) continue;
      const prefix = s.label.slice(0, i), tail = s.label.slice(i + 3).trim();
      if (!VOCAB.has(tail)) continue;          // heading is not naming a movement
      claims++;
      if (prefix === 'Primer') { primerClaims++; if (s.wk === s.lastWk) raceWeekPrimer++; }
      if (s.names.includes(tail)) continue;    // claim holds
      const where = `${equipment} seed=${seed} W${s.wk} ${s.d.toUpperCase()} "${s.label}" :: ${s.names.join(', ')}`;
      if (SWAP_KEYS.includes(tail)) {
        swapMismatch++;
        if (swapSamples.length < 6) swapSamples.push(where);
      } else if (SHOULDER_WORKAROUND_DELETED.test(tail)) {
        parked++;                              // §12 dropNames class, ruled out of scope
      } else {
        unexplained++;
        if (unexplainedSamples.length < 6) unexplainedSamples.push(where);
      }
    }
  }
}

if (injSections > 500) ok(); else bad(`injured lattice too thin: ${injSections} sections`);
if (claims > 200) ok(); else bad(`too few heading claims to test: ${claims} — the gate is blind`);
if (primerClaims > 0) ok(); else bad('no Primer heading named a movement — the race-week case is untested');
if (raceWeekPrimer > 0) ok(); else bad('no race-week Primer heading named a movement — the reported case is untested');

if (swapMismatch === 0) ok();
else bad(`${swapMismatch}/${claims} headings name a movement the overlay RENAMED away (label latch):\n     ` + swapSamples.join('\n     '));

if (unexplained === 0) ok();
else bad(`${unexplained}/${claims} headings name a movement that is neither prescribed nor explained by the parked dropNames class:\n     ` + unexplainedSamples.join('\n     '));

// ── D43 still fires, and does not leak into a healthy program ────────────────
// Dumbbells exist on every tier except the no-gear one, where a later pass
// converts the press to a pushup; assert on the tiers that own the dumbbell.
const DB_TIERS = EQUIP.filter(e => e !== 'bodyweight');
for (const e of DB_TIERS) {
  if (floorPress[e] > 0) ok();
  else bad(`D43: '${e}' shoulder/workaround never prescribed 'Dumbbell floor press' — the swap stopped firing`);
  if (benchLeak[e] === 0) ok();
  else bad(`D43: '${e}' shoulder/workaround still prescribed 'Dumbbell bench press' ${benchLeak[e]}× — the swap is leaking`);
}
{
  const healthyTiers = DB_TIERS.filter(e => healthyHasBench[e] > 0);
  if (healthyTiers.length > 0) ok();
  else bad('negative control blind: no healthy program on any dumbbell tier prescribes the bench press, so "the swap is overlay-only" is untested');
}

// ── direct unit pass over applyInjuryFilter: BOTH rename paths ───────────────
// The corpus above only exercises P.swapNames, because no heading in the app
// currently embeds a spine-swap core movement. SPINE_SWAP shares the same branch,
// so it is asserted here directly against the doctrine of the two maps:
//   D43 workaround shoulder: dumbbell bench press -> dumbbell floor press
//   spine-safe core:         ab wheel rollouts    -> dead bugs
function filterOne(label, name, detail, injury){
  const cfg = Object.assign({}, fixtures.HALF_MANNY, injury ? { injury } : {});
  const out = IA.applyInjuryFilter([{ label, items: [{ name, detail: detail || '3×10' }] }], cfg);
  if (!out || !out.length) return null;
  return { label: String(out[0].label || ''), name: clean((out[0].items[0] || {}).name), sections: out };
}
{
  const r = filterOne('Main — Dumbbell bench press', 'Dumbbell bench press', '4×5', { region: 'shoulder', tier: 'workaround' });
  if (r && r.name === 'Dumbbell floor press') ok();
  else bad(`unit swapNames: expected 'Dumbbell floor press', got '${r && r.name}' — D43 swap did not fire`);
  if (r && r.label === 'Main — Dumbbell floor press') ok();
  else bad(`unit swapNames: heading stayed '${r && r.label}' — the label did not follow the item`);
}
{
  const r = filterOne('Core — Ab wheel rollouts', 'Ab wheel rollouts', '3×10', { region: 'lowback', tier: 'workaround' });
  if (r && r.name === 'Dead bugs') ok();
  else bad(`unit SPINE_SWAP: expected 'Dead bugs', got '${r && r.name}' — spine-safe swap did not fire`);
  if (r && r.label === 'Core — Dead bugs') ok();
  else bad(`unit SPINE_SWAP: heading stayed '${r && r.label}' — the label did not follow the item`);
}
{
  // Negative controls. A healthy athlete's card is untouched; a heading that does
  // not name the item is left exactly as written; the pass is idempotent.
  const h = filterOne('Main — Dumbbell bench press', 'Dumbbell bench press', '4×5', null);
  if (h && h.name === 'Dumbbell bench press' && h.label === 'Main — Dumbbell bench press') ok();
  else bad(`negative control: healthy cfg rewrote '${h && h.label}' / '${h && h.name}'`);

  const g = filterOne('Pump', 'Dumbbell bench press', '4×5', { region: 'shoulder', tier: 'workaround' });
  if (g && g.label === 'Pump' && g.name === 'Dumbbell floor press') ok();
  else bad(`negative control: generic heading became '${g && g.label}'`);

  const cfg2 = Object.assign({}, fixtures.HALF_MANNY, { injury: { region: 'shoulder', tier: 'workaround' } });
  const once = IA.applyInjuryFilter([{ label: 'Main — Dumbbell bench press', items: [{ name: 'Dumbbell bench press', detail: '4×5' }] }], cfg2);
  const twice = IA.applyInjuryFilter(once, cfg2);
  if (twice[0].label === 'Main — Dumbbell floor press' && clean(twice[0].items[0].name) === 'Dumbbell floor press') ok();
  else bad(`idempotence: second pass produced '${twice[0].label}' / '${clean(twice[0].items[0].name)}'`);
}

console.log(`g192_labelsync: healthySections=${healthySections} injSections=${injSections} vocab=${VOCAB.size}`);
console.log(`  heading claims=${claims} (Primer=${primerClaims}, race-week Primer=${raceWeekPrimer})`);
console.log(`  mismatch: swap-rename=${swapMismatch} parked-drop=${parked} unexplained=${unexplained}`);
console.log(`  floor press by tier ${JSON.stringify(floorPress)} | bench-press leak ${JSON.stringify(benchLeak)}`);
fails.forEach(f => console.log('  FAIL ' + f));
console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);
