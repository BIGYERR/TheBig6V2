// g197_leg_accessory — V197 (D75 / D76 / D78 / the 8302 guard / D70b).
//
// WHAT THIS GATE IS FOR
//   _gear's non-empty fallback made the equipment filter advisory: any pool that filtered
//   to nothing was handed back WHOLE. EXLIB.leg_iso was five machine/cable names, so the
//   "Leg isolation" slot printed a leg press to an athlete in a hotel room. Measured on
//   V196: crossfit drew 428 machine + 36 cable items, home_basic 716 + 12, home_full
//   628 + 49. D70b removes the fallback. That alone introduces 4,408 undefined items, all
//   in this one section, and every one of buildSectionsHTML, sessionLogProgress,
//   sessionTimeEst and buildHeroPreview throws on an item with no name, with no try on the
//   path, so the week view does not draw. D75 harvests four gear-free names into the pool
//   (renamed leg_accessory) so the pool can never empty, D76 subtracts the names already on
//   the day's card so one movement cannot print under two headings, and the 8302 guard
//   stops legIso[1] being written unconditionally.
//
// ORACLES — every one of them independent of the code under test
//   - GEAR LEGALITY is decided by a hand table (NEEDS / OWNS) written from the WIZARD COPY
//     the athlete reads (index.html:2681-2685, 13999-14000), not from _gearOK, _auxGearOK
//     or EQUIP_TOKENS. Same table the V197 measure pass used.
//   - "an item must have a name" is a property, not an engine output.
//   - the four harvested names, the three coach EXCLUDED, the 25-second hold dose and the
//     HALF_MANNY digest are typed out here by hand from the ruling.
//   - the leg_accessory membership floor is computed by parsing the literal array out of
//     the HTML source and filtering it with the hand table — the engine is never asked.
//   - the LEG-MOVEMENT vocabulary for the bodyweight section is a hand list.
//   Nothing here calls the engine and asserts it equals itself.
//
// Usage: node tests/gates/g197_leg_accessory.js <candidate.html>
const fs   = require('fs');
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const RAW  = fs.readFileSync(FILE, 'utf8');
const IA   = load(FILE);

let pass = 0, fail = 0;
function ok(name, cond, detail) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (detail !== undefined ? '  -> ' + detail : '')); }
}

// ── retaining DOM stub (the V195 lesson): the harness hands out a FRESH element per
// getElementById, so an innerHTML write lands on a throwaway and a read-back sees
// nothing. Anything that renders below reads its output back through this. ──────────
const DOM_STUB = "__g197mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',placeholder:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g197els={};document.getElementById=function(id){if(!__g197els[id])__g197els[id]=__g197mk(id);return __g197els[id];};"
  + "document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";
try { IA.eval(DOM_STUB); } catch (e) { console.log('FAIL dom-stub install -> ' + e.message); fail++; }

// ── HAND ORACLE: what a NAME needs, what a TIER owns ────────────────────────────────
const NEEDS = [
  ['machine', /\bmachine\b|hack squat|\bsmith\b|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|preacher/i],
  ['cable',   /\bcable\b|pulldown|\brope\b|face pull/i],
  ['barbell', /\bbarbell\b|trap bar|power clean|hang clean|\brack pull\b|back squat|front squat|^bench press$|good morning|landmine|glute-ham/i],
  ['dumbbell',/\bdumbbell\b|\bdb\b|goblet/i],
  ['kettlebell',/kettlebell|\(kb\)|\bkb\b/i],
  ['band',    /(?<!it )\bband(ed)?\b|resistance band|trx/i],
  ['medball', /med ball|medicine ball|wall ball|ball slams/i],
  ['pullbar', /hanging|toes-to-bar|garhammer|chinup|chin-up|pullup|pull-up|muscle-?up|\bl-sit\b/i],
  ['loadobj', /\bweighted\b|\bloaded\b|farmer carry|suitcase carry|overhead carry/i],
];
const needs = n => { const s = String(n || ''); const o = []; for (const [g, r] of NEEDS) if (r.test(s)) o.push(g); return o; };
const OWNS = {
  home_full:  new Set(['barbell','dumbbell','kettlebell','band','pullbar','loadobj']),
  home_basic: new Set(['dumbbell','kettlebell','band','pullbar','loadobj']),
  commercial: new Set(['machine','cable','barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj']),
  crossfit:   new Set(['barbell','dumbbell','kettlebell','band','pullbar','medball','loadobj']),
  bodyweight: new Set(['pullbar']),
  minimal:    new Set(['dumbbell','kettlebell','loadobj']),
  travel_room_only: new Set([]),
};
const TIERS       = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const TIERS_PLUS  = TIERS.concat(['travel_room_only']);

// ── RULING TEXT, typed by hand ──────────────────────────────────────────────────────
const HARVESTED = ['Nordic hamstring curl (anchored)','Single-leg glute bridge','Single-leg hip thrust','Wall sit'];
const EXCLUDED  = ['Spanish squat hold (KB)','Step-ups (KB)','Dumbbell Bulgarian split squat'];
const MACHINES  = ['Leg extension','Lying leg curl','Seated leg curl','Leg press','Standing cable hamstring curl'];
const MANNY_DIGEST = '6e32421331693437';
const HOLD_DOSE_SEC = 25;               // the ACCESSORY hold dose the file already carries
const SECTION = 'Leg isolation';        // athlete-facing label; D75 renamed the KEY, not this

// ── LATTICE (same shape as the V197 measure pass) ───────────────────────────────────
const FOCUSES = ['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS    = ['beginner','intermediate','advanced'];
const SEEDS   = [11, 76308, 90210];
const RESTS   = [['sun','wed'], ['sat','sun','wed']];
const GOALS   = [
  { k:'liftonly', cardioTypes:[],      goal:null },
  { k:'run_base', cardioTypes:['run'], goal:'run_base' },
  { k:'run_5k',   cardioTypes:['run'], goal:'run_5k' },
  { k:'run_half', cardioTypes:['run'], goal:'run_half' },
];
function mkCfg(tier, focus, exp, g, seed, rest, travel) {
  const isRace = g.goal && /5k|10k|half|marathon/.test(g.goal);
  return {
    name:'M', primaryPath: g.goal ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.cardioTypes.slice(),
    cardioGoals: g.goal ? { run:{ id:g.goal, label:g.goal, mileBestMins:'10', mileBestSecs:'30', baselineDist:'5', baseline:'5mi' } } : {},
    eventTargeted: !!isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: travel ? 'bodyweight' : tier, unit:'lbs',
    restDays: rest.slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
    ...(travel ? { _travel:true } : {}),
  };
}
function lattice(tiers, travel) {
  const out = [];
  for (const t of tiers) for (const f of FOCUSES) for (const e of EXPS)
    for (const g of GOALS) for (const s of SEEDS) for (let r = 0; r < RESTS.length; r++)
      out.push({ key: `${travel?'travel_':''}${t}|${f}|${e}|${g.k}|${s}|r${r}`,
                 tier: travel ? 'travel_room_only' : t, cfg: mkCfg(t, f, e, g, s, RESTS[r], travel) });
  return out;
}
function cells(prog) {
  const out = []; const W = prog.weeks || {};
  Object.keys(W).sort((a,b)=>+a-+b).forEach(w => Object.keys(W[w]).forEach(d => {
    const day = W[w][d]; if (!day || day.rest) return; out.push({ w:+w, d, day });
  }));
  return out;
}
function itemsOf(day) {
  const out = [];
  (day.sections||[]).forEach(sec => (sec.items||[]).forEach(it => out.push({ sec, it })));
  return out;
}

// ════════════════════════════════════════════════════════════════════════════════════
// A. STATIC — the pool itself, read out of the source and judged by the hand table
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- A. the pool, parsed from source and filtered by the hand gear table --');
const poolMatch = RAW.match(/\n\s*leg_accessory:\[([^\]]*)\],/);
ok('A1 EXLIB.leg_accessory exists (D75 rename landed)', !!poolMatch, poolMatch ? '' : 'no leg_accessory:[...] in source');
const POOL = poolMatch ? poolMatch[1].split(',').map(s => s.trim().replace(/^'|'$/g, '')) : [];
ok('A2 old key EXLIB.leg_iso is gone from EXLIB', !/\n\s*leg_iso:\[/.test(RAW), 'leg_iso:[...] still defined');
HARVESTED.forEach(n => ok('A3 harvested: ' + n, POOL.indexOf(n) >= 0, 'pool=' + JSON.stringify(POOL)));
MACHINES.forEach(n => ok('A4 commercial keeps its machine: ' + n, POOL.indexOf(n) >= 0));
EXCLUDED.forEach(n => ok('A5 coach EXCLUDED, not in pool: ' + n, POOL.indexOf(n) < 0));
ok('A6 pool is exactly 9 names (5 machine + 4 harvested)', POOL.length === 9, 'len=' + POOL.length);
// the membership floor, per tier, by hand table. The slot picks TWO.
TIERS_PLUS.forEach(t => {
  const legal = POOL.filter(n => needs(n).every(g => OWNS[t].has(g)));
  ok('A7 ' + t + ': gear-legal members >= 2 (slot picks two)', legal.length >= 2, legal.length + ' -> ' + JSON.stringify(legal));
});
// worst case after D76 subtracts the whole card: the ruling's floor is {Nordic, glute bridge}
{
  const t = 'travel_room_only';
  const legal = POOL.filter(n => needs(n).every(g => OWNS[t].has(g)));
  ok('A8 gear-free floor is the four harvested names', legal.length === 4 && HARVESTED.every(n => legal.indexOf(n) >= 0),
     JSON.stringify(legal));
}
// D70b: the fallback token is gone from CODE (comments stripped; the V127 block quotes it)
{
  let s = RAW.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' '));
  s = s.split('\n').map(l => { const i = l.indexOf('//'); if (i < 0) return l;
    const b = l.slice(0, i); const q = (b.match(/'/g)||[]).length + (b.match(/"/g)||[]).length + (b.match(/`/g)||[]).length;
    return (q % 2 !== 0) ? l : l.slice(0, i); }).join('\n');
  ok('A9 D70b: _gear no longer falls back to the raw pool',
     !/const _gear\s*=\s*pool\s*=>\s*\{[^}]*f\.length\s*\?\s*f\s*:\s*pool/.test(s),
     'fallback still in live code');
  ok('A10 _gear still filters (it was not deleted)', /const _gear\s*=\s*pool\s*=>[^\n]*filter\(_gearOK\)/.test(s));
}
// D78: bodyweightSweep has nothing to substitute for the four harvested names
{
  const g = RAW.match(/const _BW_GEAR=(\/[\s\S]*?\/i);/);
  ok('A11 _BW_GEAR found', !!g);
  if (g) {
    const re = new RegExp(g[1].slice(1, -2), 'i');
    HARVESTED.forEach(n => ok('A12 D78: _BW_GEAR does NOT match ' + n, !re.test(n)));
  }
  const b = RAW.indexOf('const _BW_SUBS'), e = RAW.indexOf('\nconst _BW_GEAR', b);
  const keys = (b >= 0 && e > b) ? (RAW.slice(b, e).match(/^\s*'([^']+)':/gm) || []).map(x => x.replace(/^\s*'|':$/g, '')) : null;
  ok('A13 _BW_SUBS parsed', Array.isArray(keys) && keys.length > 0, keys && keys.length);
  if (keys) HARVESTED.forEach(n => ok('A14 D78: not a _BW_SUBS key: ' + n, keys.indexOf(n) < 0));
}

// ════════════════════════════════════════════════════════════════════════════════════
// B. THE SWEEP — 3,528 builds, every tier, plus the travel Room-only tier
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- B. full lattice sweep --');
const L = lattice(TIERS, false).concat(lattice(['bodyweight'], true));
let builds = 0, threw = 0, dayCells = 0, undef = 0, dup = 0, harvestedDup = 0;
let wallInSection = 0, wallBadDose = 0, secTotal = 0, secWithHarvest = 0;
const census = {}; TIERS_PLUS.forEach(t => census[t] = { machine: 0, cable: 0, names: {} });
const bwNames = {};
const renderDays = [];           // one Leg-isolation day per tier, plus one core day per tier
const seenRenderTier = {};
const DOSE_RE = new RegExp('^\\d+×' + HOLD_DOSE_SEC + ' sec$');
for (const c of L) {
  let p; try { p = IA.buildProgram(c.cfg); } catch (e) { threw++; continue; }
  builds++;
  for (const cell of cells(p)) {
    dayCells++;
    const seen = Object.create(null);
    for (const { sec, it } of itemsOf(cell.day)) {
      if (!it || it.name == null) { undef++; continue; }
      const nm = String(it.name).trim(), k = nm.toLowerCase();
      if (seen[k]) { dup++; if (HARVESTED.some(h => h.toLowerCase() === k)) harvestedDup++; } else seen[k] = 1;
      const nd = needs(nm);
      if (nd.indexOf('machine') >= 0 && !OWNS[c.tier].has('machine')) { census[c.tier].machine++; census[c.tier].names[nm] = (census[c.tier].names[nm]||0)+1; }
      if (nd.indexOf('cable')   >= 0 && !OWNS[c.tier].has('cable'))   { census[c.tier].cable++;   census[c.tier].names[nm] = (census[c.tier].names[nm]||0)+1; }
    }
    (cell.day.sections||[]).forEach(s => {
      if ((s.label||'') !== SECTION) return;
      secTotal++;
      let hasH = false;
      (s.items||[]).forEach(i => {
        if (!i || i.name == null) return;
        const nm = String(i.name).trim();
        if (HARVESTED.indexOf(nm) >= 0) hasH = true;
        if (/^wall sit$/i.test(nm)) { wallInSection++; if (!DOSE_RE.test(String(i.detail||''))) wallBadDose++; }
        if (c.tier === 'bodyweight' || c.tier === 'travel_room_only') bwNames[nm] = (bwNames[nm]||0)+1;
      });
      if (hasH) secWithHarvest++;
      if (!seenRenderTier[c.tier]) { seenRenderTier[c.tier] = 1; renderDays.push({ tier: c.tier, key: c.key, sec: s, day: cell.day }); }
    });
    if (!seenRenderTier['core_' + c.tier] && (cell.day.sections||[]).some(s => s.core)) {
      seenRenderTier['core_' + c.tier] = 1;
      renderDays.push({ tier: c.tier + ' (core day)', key: c.key, sec: (cell.day.sections||[]).filter(s => s.core)[0], day: cell.day });
    }
  }
}
console.log('   builds ' + builds + ' (threw ' + threw + ')  day cells ' + dayCells + '  "' + SECTION + '" sections ' + secTotal);
ok('B0 every config built', threw === 0, threw + ' threw');
ok('B1 UNDEFINED items across every build and every tier == 0', undef === 0, undef + ' undefined items');
ok('B2 the section still exists (the harvest did not delete it)', secTotal > 0, secTotal);
ok('B3 every "' + SECTION + '" section carries a harvested name somewhere in the sweep', secWithHarvest > 0, secWithHarvest);

// ── denial census. The numbers are the ruling's after-grid. ────────────────────────
console.log('\n-- B4. denial census (hand gear table, not _gearOK) --');
TIERS_PLUS.forEach(t => console.log('   ' + t + ': machine ' + census[t].machine + '  cable ' + census[t].cable + '  ' + JSON.stringify(census[t].names)));
ok('B4a crossfit machine items == 0 (was 428)',    census.crossfit.machine === 0,   census.crossfit.machine);
ok('B4b crossfit cable items == 0 (was 36)',       census.crossfit.cable === 0,     census.crossfit.cable);
ok('B4c home_basic machine items == 0 (was 716)',  census.home_basic.machine === 0, census.home_basic.machine);
ok('B4d home_basic cable items == 0 (was 12)',     census.home_basic.cable === 0,   census.home_basic.cable);
ok('B4e bodyweight machine+cable == 0',            census.bodyweight.machine === 0 && census.bodyweight.cable === 0);
ok('B4f travel Room-only machine+cable == 0',      census.travel_room_only.machine === 0 && census.travel_room_only.cable === 0);
ok('B4g minimal machine+cable == 0 (was 762/12)',  census.minimal.machine === 0 && census.minimal.cable === 0,
   census.minimal.machine + '/' + census.minimal.cable);
ok('B4h commercial owns machines and cables: 0 denials', census.commercial.machine === 0 && census.commercial.cable === 0);
// home_full: the 200 survivors are OUT OF SCOPE for V197 and PINNED so they cannot grow.
ok('B4i home_full machine items == 200 exactly (was 628; the raw-EXLIB Preacher curl, out of scope)',
   census.home_full.machine === 200, census.home_full.machine);
ok('B4j all 200 home_full machine survivors are Preacher curl',
   census.home_full.names['Preacher curl'] === 200 && Object.keys(census.home_full.names).filter(n => needs(n).indexOf('machine') >= 0).length === 1,
   JSON.stringify(census.home_full.names));
ok('B4k home_full cable items == 13 exactly (was 49)', census.home_full.cable === 13, census.home_full.cable);
ok('B4l the 13 home_full cable survivors are the Arms/Delts finisher pair',
   census.home_full.names['Cable lateral raise'] === 6 && census.home_full.names['Face pull'] === 7,
   JSON.stringify(census.home_full.names));
ok('B4m no leg machine reaches a cable-less tier',
   ['crossfit','home_basic','home_full','bodyweight','minimal','travel_room_only']
     .every(t => MACHINES.every(m => !census[t].names[m])),
   JSON.stringify(TIERS_PLUS.map(t => t + ':' + Object.keys(census[t].names).join('/'))));

// ── D76: same-card duplicates ──────────────────────────────────────────────────────
console.log('\n-- B5. same-card duplicates --');
console.log('   duplicate-name-on-one-card items: ' + dup + '  (of which a harvested name: ' + harvestedDup + ')');
ok('B5a a harvested name NEVER prints twice on one card (D76 subtraction)', harvestedDup === 0, harvestedDup);
ok('B5b total same-card duplicates did not grow past the ruling ceiling of 415', dup <= 415, dup);
ok('B5c same-card duplicates == 240 (V196 baseline; D76 absorbs the whole +175 harvest cost)', dup === 240, dup);
ok('B5d nowhere near 955 (that number means the three exclusions did not land)', dup < 955, dup);

// ── D75: the hold dose ─────────────────────────────────────────────────────────────
console.log('\n-- B6. the Wall sit dose --');
console.log('   Wall sit prescriptions inside "' + SECTION + '": ' + wallInSection + '  bad dose: ' + wallBadDose);
ok('B6a Wall sit actually reaches the section (the assertion is not vacuous)', wallInSection > 0, wallInSection);
ok('B6b every Wall sit renders n×' + HOLD_DOSE_SEC + ' sec, never a rep count', wallBadDose === 0, wallBadDose);

// ── D78: the bodyweight label is true ──────────────────────────────────────────────
console.log('\n-- B7. the bodyweight "' + SECTION + '" label --');
console.log('   names: ' + JSON.stringify(bwNames));
const LEG_WORDS = /squat|lunge|deadlift|hip thrust|glute|hamstring|quad|leg |leg$|calf|step-?up|bridge|wall sit|nordic|hinge|swing|back extension|split squat/i;
const bwKeys = Object.keys(bwNames);
ok('B7a bodyweight section is populated', bwKeys.length > 0, bwKeys.length);
bwKeys.forEach(n => ok('B7b leg movement only: ' + n, LEG_WORDS.test(n)));
ok('B7c the _bwFallback substitutes are gone from this section',
   !bwKeys.some(n => /pushup|inverted row|burpee|y-t-w/i.test(n)), JSON.stringify(bwKeys));

// ════════════════════════════════════════════════════════════════════════════════════
// C. RENDER — the four surfaces, and the row the athlete actually reads
//
// CORRECTED IN V197 SLICE 5, AND THIS NOTE NAMES THE CORRECTION. The cluster was
// sequenced on the belief that an emptied pool makes these four surfaces THROW, so the
// week view would not draw. Gatekeeper probed the surfaces directly and that is wrong:
//   {name:undefined, detail:'3×12'}     buildSectionsHTML ok  sessionLogProgress ok
//                                       sessionTimeEst ok     buildHeroPreview ok
//   {name:undefined, detail:undefined}  ok  ok  ok  ok
//   {} / {name:null}                    ok  ok  ok  ok
//   a literal `undefined` ARRAY ELEMENT threw on all four — and no code path builds one.
// buildExItem writes `<span class="ex-name">`+(i.name||'') — a nameless item does not
// crash the card, it renders a BLANK ROW. The legIso[1] guard and the sequencing are
// still right; the danger was overstated and Mario has been told.
//   OLD C1 "all four surfaces ran on every sampled day" — rRan is incremented before the
//   try, so it could not fail for any artifact. OLD C2 "no render surface threw" — no
//   reachable artifact throws. Both were the V195 vacuity defect: a green `ok` reading as
//   coverage. They are NOT deleted, they are RE-POINTED at the symptom that is real, and
//   harvested from rendered output: a row with nothing in its name slot.
// A ROW, NOT A SUPERSET ROW, AND THE MUTATIONS ARE WHY. The first re-point put C2 on a
// blank slot inside a MULTI-ITEM row. C1 trips on M2 (6 blank of 22 rendered) and on M3
// (7 of 21); C2 tripped on neither, because every blank those mutations produce is
// reported "1/1 blank" — an emptied pool yields a ONE-ITEM section, not a two-item
// superset carrying a nameless partner. So C2 was re-pointed a second time rather than
// left green-by-construction. C1 now owns the symptom and the row count (a row may not
// be dropped either); C2 is the DETECTOR SELF-TEST that stops C1 going green blind.
// NOTHING IS WEAKENED BY THE RE-POINT. A throw is still fatal — the catch below already
// does its own `fail++` and prints FAIL C-throw by name, which is what made the old C2
// redundant in the first place. The ran/threw counters survive as `--` informational
// denominators, which is all they ever were.
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- C. render surfaces, driven for real (' + renderDays.length + ' days) --');
const PROBES = [
  ['buildSectionsHTML(__SEC,0)', 'day sheet lift block'],
  ['sessionLogProgress(__DAY)',  'day sheet LOGGED counter'],
  ['sessionTimeEst(__DAY)',      'week hero ~NN MIN tag'],
  ['buildHeroPreview(__DAY)',    'week hero preview rows'],
];
let rThrew = 0, rRan = 0, doseRendered = 0;
// THE ROW ORACLE, and it is not the engine asserting it equals itself. buildExItem emits
// exactly ONE name slot per item — `<span class="ex-name">` for a live row, or
// `<span class="ex-skipped-name">` for a struck-through stub — so the rendered HTML can
// be counted against the section's own item list, which is the INPUT to the render and
// not its output. Two properties, both independent of what the engine chose to draw:
//   every item reaches the card as its own row  (rows == items)
//   every row the athlete reads carries a name  (no empty name slot)
const NAME_SLOT = /<span class="ex-(?:skipped-)?name">([\s\S]*?)<\/span>/g;
const slotText = h => {
  const out = [];
  let m; NAME_SLOT.lastIndex = 0;
  while ((m = NAME_SLOT.exec(h))) out.push(String(m[1]).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
  return out;
};
let rowsRendered = 0, rowsExpected = 0, blankRows = 0, ssSections = 0, ssBlank = 0, ssShort = 0;
const blankWhere = [], ssWhere = [];
renderDays.forEach(rd => {
  IA.window.__SEC = [rd.sec];
  IA.window.__DAY = rd.day;
  PROBES.forEach(([code, where]) => {
    rRan++;
    try {
      const r = IA.eval(code);
      if (code.indexOf('buildSectionsHTML') === 0 && typeof r === 'string') {
        if (/wall sit/i.test(r) && new RegExp(HOLD_DOSE_SEC + '\\s*sec', 'i').test(r)) doseRendered++;
        if (/undefined/i.test(r)) { fail++; console.log('FAIL C-undefined-in-html ' + rd.tier + ' ' + where); }
        const names = slotText(r), items = (rd.sec.items || []).length;
        rowsRendered += names.length; rowsExpected += items;
        const blanks = names.filter(n => !n).length;
        blankRows += blanks;
        if (blanks) blankWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" ' + blanks + '/' + names.length + ' blank');
        // The superset row is the ruled symptom: legIso[1] written when the pool short-drew
        // put a second item on the card with no name in it. Any multi-item section renders
        // as a row of names and every one of them must be readable.
        if (items > 1) {
          ssSections++;
          if (blanks) { ssBlank++; ssWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" -> [' + names.join(' | ') + ']'); }
          if (names.length !== items) { ssShort++; ssWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" ' + names.length + ' rows for ' + items + ' items'); }
        }
      }
    } catch (e) { rThrew++; console.log('FAIL C-throw ' + rd.tier + ' / ' + where + '  -> ' + e.message); fail++; }
  });
});
console.log('   -- probes driven ' + rRan + '/' + (renderDays.length * 4) + ', threw ' + rThrew
  + ' (a throw fails above by name; these two are denominators, not claims)');
console.log('   -- name slots rendered ' + rowsRendered + ' for ' + rowsExpected + ' items, blank ' + blankRows
  + ', multi-item sections sampled ' + ssSections);
if (blankWhere.length) console.log('   -- blank rows: ' + blankWhere.slice(0, 8).join('; '));
if (ssWhere.length)    console.log('   -- superset rows: ' + ssWhere.slice(0, 8).join('; '));
ok('C1 every rendered row carries a name the athlete can read, and no item loses its row',
   blankRows === 0 && rowsRendered > 0 && rowsRendered === rowsExpected,
   blankRows + ' blank of ' + rowsRendered + ' rendered, ' + rowsExpected + ' items expected'
   + (ssSections ? ' (' + ssSections + ' multi-item rows sampled, ' + ssBlank + ' blank, ' + ssShort + ' short)' : ''));
// C2 — THE DETECTOR, PROVED. C1's green is worth nothing if a blank row could not be seen
// in the first place: rename the ex-name span in the app and slotText harvests nothing,
// blankRows stays 0 and C1 reads as coverage. So the same harvest is pointed at a section
// that is KNOWN to have a nameless row — a real sampled section, re-rendered with a second
// item carrying no name, which is the exact shape the 8302 guard stops legIso[1] writing.
// Gatekeeper proved this shape does not throw; it renders `<span class="ex-name"></span>`.
// The oracle is the injected item, not the engine: we know what went in.
let probeRan = false, probeNames = 0, probeBlank = 0, probeErr = '';
{
  const rd = renderDays.filter(d => d.sec && (d.sec.items || []).length > 0)[0];
  if (!rd) probeErr = 'no sampled section had an item to build the probe from';
  else {
    const probe = Object.assign({}, rd.sec, { items: (rd.sec.items || []).slice(0, 1).concat([{ name: undefined, detail: '3×12' }]) });
    IA.window.__SEC = [probe];
    try {
      const h = IA.eval('buildSectionsHTML(__SEC,0)');
      const got = slotText(String(h || ''));
      probeRan = true; probeNames = got.length; probeBlank = got.filter(n => !n).length;
      console.log('   -- detector probe on ' + rd.tier + ': 2 items in, ' + probeNames + ' name slots out, ' + probeBlank + ' blank');
    } catch (e) { probeErr = e.message; }
  }
}
ok('C2 the blank-row detector is not blind: a nameless second item is harvested as a blank row',
   probeRan && probeNames === 2 && probeBlank === 1,
   probeErr || (probeNames + ' slots, ' + probeBlank + ' blank — expected 2 and 1'));
ok('C3 at least one rendered card shows the 25-second hold', doseRendered > 0, doseRendered);

// ════════════════════════════════════════════════════════════════════════════════════
// D. MARIO'S FIXTURE MUST NOT MOVE
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- D. HALF_MANNY --');
{
  const p = IA.buildProgram(fixtures.HALF_MANNY);
  const d = progDigest(p);
  ok('D1 HALF_MANNY digest is ' + MANNY_DIGEST, d === MANNY_DIGEST, d);
  let li = 0;
  cells(p).forEach(c => (c.day.sections||[]).forEach(s => { if ((s.label||'') === SECTION) li++; }));
  ok('D2 "' + SECTION + '" never opens on his program (denseHypertrophy gate)', li === 0, li);
  // The harvested names legitimately reach his card through OTHER slots (Wall sit via
  // kneeStabSel, Single-leg hip thrust via hipExtPool). What must never happen is one of
  // them arriving through the leg_accessory slot, because that slot never opens for him.
  let viaSlot = 0;
  cells(p).forEach(c => (c.day.sections||[]).forEach(s2 => {
    if ((s2.label||'') !== SECTION) return;
    (s2.items||[]).forEach(i => { if (i && HARVESTED.indexOf(String(i.name||'').trim()) >= 0) viaSlot++; });
  }));
  ok('D3 no harvested name reaches his card through the leg_accessory slot', viaSlot === 0, viaSlot);
}

// ════════════════════════════════════════════════════════════════════════════════════
// E. V197 (D84) — CALVES IS PUSHED BEFORE LEG ISOLATION
//
// capSessionBudget's trim tie-break scores a section (_secRank*10 + _itemRank) and breaks
// a tie by POSITION, later loses first. 'Calves' and 'Leg isolation' both score 2/0, so on
// a day over budget the section pushed SECOND is the one evicted. Before D84 that was
// Calves: the card dropped its only loaded plantarflexion and kept an isolation slot that
// was a third repetition of a pattern already run twice. D84 swaps the push order. Nothing
// else moves — no cap, no rank function, no pool, no seed.
//
// ORACLES here, none of them the engine's own output:
//   - the COMPARISON ARTIFACT is this same file with the two push lines swapped back, built
//     here by text surgery with an exact-count assert. Both artifacts are then swept on the
//     same lattice, so every difference is attributable to the push order and nothing else.
//   - the direction of every claim ("Calves must never fall", "exactly two labels move",
//     "posterior-free cells stay inside bodyweight + lowback/protect") is the RULING, typed
//     out below. The engine is never asked what it thinks the answer should be.
//   - the budget cost function is hand-transcribed from the cap's own rule, and the
//     posterior-chain classifier is a hand regex table with its own blindness probe.
//   - the four config keys of the known, confined cost are typed from the ruling.
// ════════════════════════════════════════════════════════════════════════════════════
console.log('\n-- E. D84: Calves before Leg isolation --');
const os = require('os');
const CALF_PUSH = "        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});\n";
const ISO_PUSH  = "        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});\n";
const D84_ORDER = CALF_PUSH + ISO_PUSH;   // after D84
const OLD_ORDER = ISO_PUSH + CALF_PUSH;   // before D84

// ── E0: the source shape D84 asserts ────────────────────────────────────────────────
const nCalf = RAW.split(CALF_PUSH).length - 1;
const nIso  = RAW.split(ISO_PUSH).length - 1;
ok('E0a the Calves push exists exactly once', nCalf === 1, 'count=' + nCalf);
ok('E0b the Leg isolation push exists exactly once', nIso === 1, 'count=' + nIso);
const hasNew = (RAW.split(D84_ORDER).length - 1) === 1;
const hasOld = (RAW.split(OLD_ORDER).length - 1) === 1;
ok('E0c D84 order: Calves is pushed BEFORE Leg isolation', hasNew && !hasOld,
   hasOld ? 'the pre-D84 order is still in the file' : 'neither order found as an adjacent pair');
// comparison artifact: the same file with the pair swapped, whichever way round it sits.
let CMP = null, cmpWhy = '';
if (hasNew)      { CMP = RAW.replace(D84_ORDER, OLD_ORDER); cmpWhy = 'pre-D84 order'; }
else if (hasOld) { CMP = RAW.replace(OLD_ORDER, D84_ORDER); cmpWhy = 'post-D84 order'; }
ok('E0d a comparison artifact could be derived by swapping the two pushes', !!CMP,
   'neither push order is present as an adjacent pair — the block was edited, not reordered');

// ── the lattice: every tier, every injury state. lattice193.WIDE carries no injured
// athlete at all, and section B above is healthy-only, which is exactly how a regression
// that only bites a protected knee or a protected low back gets through. ─────────────
const E_TIERS = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS = ['hypertrophy','balanced'];
const E_EXPS  = ['beginner','advanced'];
const E_GOALS = [ { k:'liftonly', id:null }, { k:'pace', id:'run_pace_goal' }, { k:'half', id:'run_half' } ];
const E_INJ   = [ { k:'healthy', v:null },
                  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' } },
                  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' } },
                  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' } } ];
const E_RESTS = [ { k:'sun', v:['sun'] }, { k:'sun+wed', v:['sun','wed'] }, { k:'sat+sun', v:['sat','sun'] } ];
const E_SEEDS = [1013, 3039];
function eCfg(tier, focus, exp, g, inj, rest, seed) {
  const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
  return {
    name:'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30',
                                baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: tier, unit:'lbs', restDays: rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
    ...(inj.v ? { injury:{ region: inj.v.region, tier: inj.v.tier } } : {}),
  };
}
const E_L = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS)
    E_L.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`, tier:t, inj:i.k, cfg:eCfg(t,f,x,g,i,r,sd) });

// ── hand tables ─────────────────────────────────────────────────────────────────────
// posterior chain, by name. Written here, not read from _pattern.
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
const E_POSTERIOR = new Set(['hinge','hip_ext','leg_iso']);
// one copy of the predicate, shared by the CAUSED census (E3b) and the TOTAL census
// (E3e-E3g). A leg cell is one carrying either leg accessory label; it is posterior-free
// when no name on the card reads as hinge, hip extension or leg isolation.
const eLegCell = o => o.labels.indexOf('Calves') >= 0 || o.labels.indexOf('Leg isolation') >= 0;
const eZeroP   = o => eLegCell(o) && !o.names.some(n => E_POSTERIOR.has(ePat(n)));
// the budget's own cost rule, hand-transcribed: stretch is free, holds and carries are
// half, everything else is its set count, and a detail with no N× reads as three.
const eSets    = d => { const m = String(d||'').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1],10)) : 3; };
const eStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n||'');
const eHalf    = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n||'');
const eCost    = cell => cell.items.reduce((a,it) => a + (eStretch(it.n) ? 0 : (eHalf(it.n) ? eSets(it.d)*0.5 : eSets(it.d))), 0);
// the ruling's own list of the known, confined cost (D85 owns the fix, V198)
const D85_KEYS = [
  'bodyweight|hypertrophy|beginner|half|lowback/protect|sun|1013',
  'bodyweight|hypertrophy|beginner|half|lowback/protect|sun+wed|3039',
  'bodyweight|hypertrophy|beginner|pace|lowback/protect|sun+wed|1013',
  'bodyweight|hypertrophy|beginner|pace|lowback/protect|sat+sun|3039',
];
// ── E3a: the posterior-chain detector is not blind (probe, no engine involved) ───────
{
  const blind = { labels:['Calves'], names:['Back squat','Dumbbell bench press','Dumbbell standing calf raise'],
                  items:[] };
  const seeing = { labels:['Calves'], names:['Back squat','Nordic hamstring curl (anchored)'], items:[] };
  const zero = eZeroP;   // the function the sweep actually uses, not a re-typed copy
  ok('E3a detector probe: a card with squat + press + calf raise reads as posterior-free', zero(blind));
  ok('E3a detector probe: adding a Nordic makes the same card read as posterior-covered', !zero(seeing));
}

// ── the sweep ───────────────────────────────────────────────────────────────────────
function eScan(IA_, cfg) {
  const p = IA_.buildProgram(cfg); const out = {}; const W = p.weeks || {};
  Object.keys(W).forEach(w => Object.keys(W[w]).forEach(d => {
    const day = W[w][d]; if (!day || day.rest) return;
    const labels = [], names = [], items = [];
    (day.sections||[]).forEach(sec => { labels.push(String(sec.label||''));
      (sec.items||[]).forEach(it => { const n = String((it&&it.name)||'');
        names.push(n); items.push({ n, d:String((it&&it.detail)||'') }); }); });
    out[w + '/' + d] = { labels, names, items };
  }));
  return out;
}
let eCells = 0, eChanged = 0, eFell = 0, eRose = 0, eThrew = 0, eCostOut = 0;
let eCostDown = 0, eCostMax = -Infinity;                       // D87: direction and observed peak
let eOverA = 0, eOverUnchanged = 0, eOverIntroduced = 0;       // D87: the cap census
let eZeroAllCells = 0;                                         // D86: the TOTAL posterior-free population
const eFellEg = [], eCostEg = [], eCostDownEg = [], eLabelDelta = {}, eZeroNew = {}, eZeroAll = {},
      eInjSeen = {}, eTierSeen = {};
// ── D87: the Δcost ceiling is DERIVED from the file's own table, not asserted in prose.
// The residual between the two push orders is one accessory slot. The Calves section is
// exactly ONE item carrying hsets sets (CALF_PUSH above), and hsets is declared
// `cfg.experience==='advanced'?4:3` at every site in the file. So the most a single
// Calves slot can cost is (items × max hsets) = 4, and Δcost cannot exceed it. Parsed
// here, so an edit that changes the section's item count or the hsets table MOVES this
// ceiling instead of silently falsifying a hard-coded 4.
const HSETS_VALS = [];
{ const re = /const hsets\s*=\s*cfg\.experience\s*===\s*'advanced'\s*\?\s*(\d+)\s*:\s*(\d+);/g;
  let m; while ((m = re.exec(RAW))) HSETS_VALS.push([parseInt(m[1],10), parseInt(m[2],10)]); }
const HSETS_MAX  = HSETS_VALS.length ? Math.max.apply(null, HSETS_VALS.map(v => Math.max(v[0], v[1]))) : 0;
const CALF_ITEMS = (CALF_PUSH.match(/\{name:/g) || []).length;
const E_SLOT_MAX = HSETS_MAX * CALF_ITEMS;
const E_CAP      = parseInt(((RAW.match(/const SESSION_SET_BUDGET = (\d+);/) || [])[1] || '0'), 10);
ok('E4h the hsets table parses and every site agrees (the ceiling has a source)',
   HSETS_VALS.length >= 3 && HSETS_VALS.every(v => v[0] === HSETS_VALS[0][0] && v[1] === HSETS_VALS[0][1]),
   JSON.stringify(HSETS_VALS));
ok('E4i the Calves section is exactly one item, dosed off hsets',
   CALF_ITEMS === 1 && /detail:hsets\+/.test(CALF_PUSH), 'items=' + CALF_ITEMS);
ok('E4j the derived one-slot ceiling is a positive number of sets', E_SLOT_MAX > 0, E_SLOT_MAX);
ok('E4k the cap value parses out of the file (not typed here)', E_CAP > 0, E_CAP);
console.log('   derived: hsets max ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' Calves item = Δcost ceiling '
  + E_SLOT_MAX + ' sets; cap read from the file = ' + E_CAP);
if (CMP) {
  const cmpPath = path.join(os.tmpdir(), 'g197_d84_cmp_' + process.pid + '.html');
  fs.writeFileSync(cmpPath, CMP);
  let IA_CMP = null;
  try { IA_CMP = load(cmpPath); } catch (e) { console.log('FAIL E-load comparison -> ' + e.message); fail++; }
  if (IA_CMP) {
    for (const c of E_L) {
      let A1s, B1s;
      try { A1s = eScan(IA, c.cfg); B1s = eScan(IA_CMP, c.cfg); } catch (e) { eThrew++; continue; }
      eInjSeen[c.inj] = 1; eTierSeen[c.tier] = 1;
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk]; if (!B1) continue;
        eCells++;
        const hasL = (o,l) => o.labels.indexOf(l) >= 0;
        if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { eFell++; if (eFellEg.length < 5) eFellEg.push(c.key + ' ' + dk); }
        if (hasL(A1,'Calves') && !hasL(B1,'Calves')) eRose++;
        const same = A1.labels.join('|') === B1.labels.join('|') && A1.names.join('|') === B1.names.join('|');
        // ── D87 cap census, over EVERY cell and not only the changed ones. A cell that is
        // over the cap AND byte-identical to the pre-D84 artifact was over the cap before
        // D84 existed. That is the whole of the claim.
        const costA = eCost(A1), costB = eCost(B1);
        if (costA > E_CAP) { eOverA++; if (same) eOverUnchanged++; else if (costB <= E_CAP) eOverIntroduced++; }
        // ── D86 total census: posterior-free leg cells in the shipped artifact, caused by
        // the reorder or pre-existing. The ratchet below is a ceiling on this population.
        if (eZeroP(A1)) { eZeroAllCells++; eZeroAll[c.key] = (eZeroAll[c.key] || 0) + 1; }
        if (same) continue;
        eChanged++;
        const ca = {}, cb = {};
        A1.labels.forEach(l => ca[l] = (ca[l]||0)+1);
        B1.labels.forEach(l => cb[l] = (cb[l]||0)+1);
        new Set(Object.keys(ca).concat(Object.keys(cb))).forEach(l => {
          const d = (ca[l]||0) - (cb[l]||0); if (d) eLabelDelta[l] = (eLabelDelta[l]||0) + d; });
        const dc = costA - costB;
        if (dc > E_SLOT_MAX) { eCostOut++; if (eCostEg.length < 5) eCostEg.push(c.key + ' ' + dk + ' Δ' + dc); }
        if (dc < 0) { eCostDown++; if (eCostDownEg.length < 5) eCostDownEg.push(c.key + ' ' + dk + ' Δ' + dc); }
        if (dc > eCostMax) eCostMax = dc;
        if (eZeroP(A1) && !eZeroP(B1)) eZeroNew[c.key] = (eZeroNew[c.key]||0) + 1;
      }
    }
    try { fs.unlinkSync(cmpPath); } catch (e) {}
  }
  console.log('   swept ' + E_L.length + ' configs (' + cmpWhy + ' comparison), ' + eCells + ' day-cells, ' + eThrew + ' threw');
} else {
  console.log('   no comparison artifact — E1/E2/E3b cannot run');
}
const ranE = !!CMP && eCells > 0;

// ── E1: two-sided. Calves may not fall ANYWHERE, on any injury state, on any tier ────
ok('E1a the sweep ran and covers day-cells', ranE, eCells + ' cells');
ok('E1b all four injury states built', Object.keys(eInjSeen).length === 4, Object.keys(eInjSeen).join(','));
ok('E1c all six equipment tiers built', Object.keys(eTierSeen).length === 6, Object.keys(eTierSeen).join(','));
ok('E1d no build threw', eThrew === 0, eThrew);
ok('E1e Calves FALLS on zero day-cells (the side a "it rose" assertion cannot see)',
   ranE && eFell === 0, eFell + ' cells lost Calves, e.g. ' + eFellEg.join(' ; '));
ok('E1f Calves RISES somewhere: D84 is actually in the artifact', ranE && eRose > 0, eRose);
// and against the shipped baseline, when gate.sh hands one over
const BASE_HTML = process.argv[3] && fs.existsSync(process.argv[3]) ? process.argv[3] : null;
if (BASE_HTML) {
  let bFell = 0, bRose = 0, bCells = 0; const bEg = [];
  let IA_B = null;
  try { IA_B = load(BASE_HTML); } catch (e) { console.log('FAIL E1g baseline load -> ' + e.message); fail++; }
  if (IA_B) {
    for (const c of E_L) {
      let A1s, B1s;
      try { A1s = eScan(IA, c.cfg); B1s = eScan(IA_B, c.cfg); } catch (e) { continue; }
      for (const dk of Object.keys(A1s)) {
        const A1 = A1s[dk], B1 = B1s[dk]; if (!B1) continue;
        bCells++;
        const hasL = (o,l) => o.labels.indexOf(l) >= 0;
        if (!hasL(A1,'Calves') && hasL(B1,'Calves')) { bFell++; if (bEg.length < 5) bEg.push(c.key + ' ' + dk); }
        if (hasL(A1,'Calves') && !hasL(B1,'Calves')) bRose++;
      }
    }
    ok('E1g vs ' + path.basename(BASE_HTML) + ': Calves falls on zero day-cells (' + bCells + ' compared)',
       bCells > 0 && bFell === 0, bFell + ' e.g. ' + bEg.join(' ; '));
    ok('E1h vs ' + path.basename(BASE_HTML) + ': Calves rises somewhere', bRose > 0, bRose);
  }
} else {
  console.log('   -- E1g/E1h not run: no baseline argv[3] (gate.sh passes one; sabotage.py does not)');
}

// ── E2: exactly two labels move. A third is an unruled removal ───────────────────────
{
  const moved = Object.keys(eLabelDelta).filter(l => eLabelDelta[l] !== 0).sort();
  ok('E2a exactly two section labels move', ranE && moved.length === 2, JSON.stringify(eLabelDelta));
  ok('E2b the two are Calves and Leg isolation',
     ranE && moved.length === 2 && moved.indexOf('Calves') >= 0 && moved.indexOf('Leg isolation') >= 0,
     JSON.stringify(moved));
  ok('E2c Calves rises and Leg isolation falls (the ruled direction)',
     ranE && eLabelDelta['Calves'] > 0 && eLabelDelta['Leg isolation'] < 0, JSON.stringify(eLabelDelta));
  console.log('   label delta: ' + JSON.stringify(eLabelDelta) + ' over ' + eChanged + ' changed day-cells');
}

// ── E3b: the known cost stays confined. SET membership, never a count: V198's posterior
// floor (D85) drives this set toward empty and must not have to edit this gate, while any
// drift outside the ruled family prints the offending config key by name. ─────────────
{
  const found = Object.keys(eZeroNew).sort();
  const inFamily = k => { const p2 = k.split('|');
    return p2[0] === 'bodyweight' && p2[1] === 'hypertrophy' && p2[4] === 'lowback/protect'; };
  const out = found.filter(k => !inFamily(k));
  const causedCells = found.reduce((a, k) => a + eZeroNew[k], 0);
  console.log('   posterior-free leg cells CAUSED by the reorder: ' + found.length + ' config keys, '
    + causedCells + ' cells');
  found.forEach(k => console.log('      ' + eZeroNew[k] + ' cells  ' + k + (D85_KEYS.indexOf(k) >= 0 ? '   <- named in the ruling' : '')));
  ok('E3b every posterior-free cell the reorder creates is bodyweight + hypertrophy + lowback/protect (D85 owns the fix)',
     ranE && out.length === 0, JSON.stringify(out));

  // ── D86 RATCHET. The predicate above names the MECHANISM: lowback/protect strips the
  // hinge rail before the budget runs, so the leg day reaches capSessionBudget with one
  // posterior piece instead of three and any tie-break evicting it lands on zero. Healthy,
  // knee/protect and shoulder/protect still have a hinge to spare and never do this.
  // A predicate alone is LOOSE: it would swallow a new defect landing inside the same
  // family. These four ceilings are one-sided and DOWN-ONLY, so V198's D85 drives them
  // toward zero and this gate TIGHTENS rather than going red. The predicate catches a
  // defect that escapes the family; the ratchet catches one that hides inside it.
  //
  // COACH'S COUNTER, recorded here so nobody reads these four as engine facts: a ratchet
  // pinned to today's census is a number with a date on it. If V198's D85 lands mid-
  // lattice, someone has to RE-BASELINE these from a fresh census rather than read them
  // as a property of the engine.
  // PROVENANCE: this gate's own E-sweep on V197 (2026-09-16) and tests/measure/
  // v197_d84_census.js — 18 keys / 120 cells caused, 33 keys / 186 cells total.
  const RATCHET = { causedCells: 120, causedKeys: 18, totalCells: 186, totalKeys: 33 };
  ok('E3c ratchet: cells the reorder makes posterior-free <= ' + RATCHET.causedCells + ' (down-only)',
     ranE && causedCells <= RATCHET.causedCells, causedCells);
  ok('E3d ratchet: config keys the reorder makes posterior-free <= ' + RATCHET.causedKeys + ' (down-only)',
     ranE && found.length <= RATCHET.causedKeys, found.length);
  // The CAUSED set is the narrow family (bodyweight + hypertrophy + lowback/protect).
  // The PRE-EXISTING set is wider in focus and tier, but shares the one MECHANISM that
  // makes any of it possible: lowback/protect strips the hinge rail before the budget
  // runs, so a leg day reaches capSessionBudget with one posterior piece instead of
  // three and any eviction lands on zero. Healthy, knee/protect and shoulder/protect
  // always keep a hinge to spare. So the TOTAL population is asserted against the
  // mechanism, not against the caused family.
  const carriesLowback = k => k.split('|')[4] === 'lowback/protect';
  const allKeys = Object.keys(eZeroAll).sort();
  const preKeys = allKeys.filter(k => found.indexOf(k) < 0);
  const outAll  = allKeys.filter(k => !carriesLowback(k));
  console.log('   posterior-free leg cells TOTAL in the artifact (caused + pre-existing): '
    + eZeroAllCells + ' cells over ' + allKeys.length + ' config keys; '
    + preKeys.length + ' of those keys pre-date the reorder:');
  preKeys.forEach(k => console.log('      ' + eZeroAll[k] + ' cells  ' + k + '   <- pre-existing'));
  ok('E3e every posterior-free leg cell in the artifact, caused or pre-existing, carries lowback/protect (the mechanism)',
     ranE && outAll.length === 0, JSON.stringify(outAll));
  ok('E3f ratchet: total posterior-free leg cells <= ' + RATCHET.totalCells + ' (down-only)',
     ranE && eZeroAllCells <= RATCHET.totalCells, eZeroAllCells);
  ok('E3g ratchet: total posterior-free leg config keys <= ' + RATCHET.totalKeys + ' (down-only)',
     ranE && allKeys.length <= RATCHET.totalKeys, allKeys.length);
  D85_KEYS.forEach(k => console.log('   ruling key ' + k + ': ' + (eZeroNew[k] || 0) + ' cells'));
}

// ── E4: the cap was not raised. The ruling swaps which item is evicted, nothing else ──
{
  const budgets = RAW.match(/const SESSION_SET_BUDGET = (\d+);/g) || [];
  ok('E4a SESSION_SET_BUDGET is still declared exactly once', budgets.length === 1, budgets.join(' '));
  ok('E4b SESSION_SET_BUDGET is still 20', budgets.length === 1 && /= 20;/.test(budgets[0]), budgets[0]);
  ok('E4c the trim tie-break still resolves a tie to the LATER position (that is what D84 uses)',
     /score===best\.score && pos>best\.pos/.test(RAW.replace(/\s+/g, ' ')) ||
     /score === best\.score && pos > best\.pos/.test(RAW.replace(/\s+/g, ' ')),
     'the pos>best.pos tie-break is gone — the reorder no longer decides anything');
  // ── D87: Δcost ∈ [0, E_SLOT_MAX], where the ceiling is DERIVED above from the file's
  // own hsets table and the Calves section's item count. Not prose, and it survives an
  // edit that changes either one.
  ok('E4d no changed day-cell costs more than one derived accessory slot (Δ <= ' + E_SLOT_MAX
     + ', from hsets ' + HSETS_MAX + ' × ' + CALF_ITEMS + ' item)',
     ranE && eCostOut === 0, eCostOut + ' cells, e.g. ' + eCostEg.join(' ; '));
  ok('E4l no changed day-cell moves DOWN (Δ >= 0: one direction, so this is a residual and not a redistribution)',
     ranE && eCostDown === 0, eCostDown + ' cells, e.g. ' + eCostDownEg.join(' ; '));
  console.log('   Δcost observed max ' + (eCostMax === -Infinity ? 'n/a' : eCostMax)
    + ' against a derived ceiling of ' + E_SLOT_MAX + ' (informational, not an assertion)');

  // ── D87: the cap has never been hard where protected work alone exceeds it, and that
  // predates D84 by four versions. The trim is a THRESHOLD test, not a minimisation:
  //   while(_total(out)>cap && guard++<16){ ... if(!best) break; }   (index.html:9503-9519)
  // When every remaining item is protected, _compoundTier 3 or zero-cost, `best` is null
  // and the loop LEAVES the day over the cap. Stated here as a fact about the baseline so
  // nobody later reads an over-cap card as a V197 regression.
  const flat = RAW.replace(/\s+/g, ' ');
  ok('E4m the trim is a threshold loop, not a minimiser: while(_total(out)>cap && guard++<16)',
     (flat.split('while(_total(out)>cap && guard++<16)').length - 1) === 1,
     'the threshold loop is not in the file in that shape');
  ok('E4n the trim bails out when only protected work is left: if(!best) break',
     (flat.split('if(!best) break;').length - 1) === 1,
     'the !best bail-out is gone — the cap would then be claimed as hard');
  ok('E4o over-cap day-cells are PRE-EXISTING: some sit over the cap and are byte-identical to the pre-D84 artifact',
     ranE && eOverUnchanged > 0, eOverUnchanged);
  ok('E4p over-cap is not a D84 artifact: over-cap cells outnumber every cell D84 changed',
     ranE && eOverA > eChanged, eOverA + ' over cap vs ' + eChanged + ' changed');
  console.log('   cap census: ' + eOverA + ' of ' + eCells + ' day-cells sit over the cap (' + E_CAP + '); '
    + eOverUnchanged + ' are untouched by D84 and so were over before it; ' + eOverIntroduced
    + ' crossed the cap under D84; ' + eChanged + ' cells changed at all, so at least '
    + (eOverA - eChanged) + ' were already over.');
}
// byte-identity of the machinery D84 must not have touched, against the shipped baseline
if (BASE_HTML) {
  const B = fs.readFileSync(BASE_HTML, 'utf8');
  const slice = (src, start, end) => { const a = src.indexOf(start); if (a < 0) return null;
    const b = src.indexOf(end, a); return b < 0 ? null : src.slice(a, b); };
  const PARTS = [
    ['capSessionBudget', 'function capSessionBudget(sections, cardio){', '\nfunction capRegionalFatigue'],
    ['_itemCost',        'function _itemCost(it, sectionRegion){',       '\n// ── RECOVERY-WEEK VOLUME DELOAD'],
    ['_setCount',        'function _setCount(detail){',                  '\nfunction _itemCost'],
  ];
  PARTS.forEach(([nm, a, b]) => {
    const x = slice(RAW, a, b), y = slice(B, a, b);
    ok('E5 ' + nm + ' is byte-identical to the baseline (D84 touched no budget machinery)',
       !!x && !!y && x === y, x === null ? 'not found in candidate' : (y === null ? 'not found in baseline' : 'differs'));
  });
} else {
  console.log('   -- E5 not run: no baseline argv[3]');
}

console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
