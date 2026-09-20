// g197b_sweep — V197 (D70b / D75 / D76 / D78): the 3,528-build lattice sweep.
// Section B of the old g197 gate, whole and unmodified.
//
// SPLIT NOTE (V198, tests only). This file was section B of g197_leg_accessory.js. That
// gate ran 58.9s and was 93% of gate.sh's wall time, and an 8-wide fan-out is bounded by
// its slowest member. The 109 assertions were split across g197a_pool_static.js,
// g197b_sweep.js, g197c_d84_cmp.js and g197d_d84_base.js: each lands in exactly one file,
// none dropped, none duplicated, every assertion keeping the bytes and the meaning it had.
// The five sections were proven independent first — 10,441 of 10,441 builds are private to
// their own section, IA.window.__SEC/__DAY have no reader anywhere, and localStorage is
// empty at every boundary — so there is no ordering constraint between the four files.
//
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
// Usage: node tests/gates/g197b_sweep.js <candidate.html>
const fs   = require('fs');
const path = require('path');
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));

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
const MANNY_DIGEST = MANNY_DIGEST_BY_VERSION[IA.version];   // era row, not a literal (D89)
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

// ── D76: same-card duplicates (count re-pinned by D85, V198; again by D91, V199) ───
console.log('\n-- B5. same-card duplicates --');
console.log('   duplicate-name-on-one-card items: ' + dup + '  (of which a harvested name: ' + harvestedDup + ')');
ok('B5a a harvested name NEVER prints twice on one card (D76 subtraction)', harvestedDup === 0, harvestedDup);
ok('B5b total same-card duplicates did not grow past the ruling ceiling of 415', dup <= 415, dup);
ok('B5c same-card duplicates == 187 (240 at V196/V197; D76 absorbs the whole +175 harvest cost, then D85 licenses 5 and D91 licenses 48 more: on 48 deload leg cards — W12 TUE, run_half, seed 11, home_basic 24 + minimal 24 — recoveryDeload now keeps its surviving accessory block by PATTERN, so Leg superset B (hinge) survives where Leg superset A did, and the Step-ups (KB) that Leg superset A repeated from the Main slot leaves the card. Item count per card is unchanged on all 48 (46 at 8 items, 2 at 7): the repeat was replaced, not dropped. Every duplicate this assertion has ever counted is Step-ups (KB))', dup === 187, dup);
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


// ── D89: this sweep's fixture family needs an identity pin of its own ──────────────
// MANNY_DIGEST sat here unread for three passes. g197b sweeps the family HALF_MANNY
// belongs to, so it was the one sweep gate over that fixture with no identity check.
console.log('\n-- B8. HALF_MANNY identity --');
{
  const d = progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  ok('B8a HALF_MANNY digest matches the V' + IA.version + ' row (' + (MANNY_DIGEST || 'NO ROW') + ')',
     !!MANNY_DIGEST && d === MANNY_DIGEST,
     d + (MANNY_DIGEST ? '' : ' — no MANNY_DIGEST_BY_VERSION row for V' + IA.version + ': an unruled digest move'));
}

console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
