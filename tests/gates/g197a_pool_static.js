// g197a_pool_static — V197 (D75 / D76 / D78 / the 8302 guard / D70b): the POOL, the
// RENDER surfaces and HALF_MANNY. Sections A, C and D of the old g197 gate.
//
// SPLIT NOTE (V198, tests only). This file was section A, C and D of g197_leg_accessory.js. That
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
// Usage: node tests/gates/g197a_pool_static.js <candidate.html>
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
// RENDER-DAY HARVEST (V198 split). Section C's input is the 14 day-objects section B used
// to collect as a side effect of its 3,528-build sweep: for every equipment tier, the
// FIRST config in lattice order that opens a "Leg isolation" section, and the FIRST that
// opens a core section. The selection rule and the visit order below are the sweep's own,
// so the harvest is the same 14 objects in the same order; a config that can no longer
// fill either slot for its tier is skipped UNBUILT, which is what makes this ~0.04s
// instead of 12s. This is plumbing, not an oracle — C's oracles are in C, and if this
// harvest ever came up short C1 would read `0 blank of 0 rendered` and fail on
// `rowsRendered > 0` rather than go quietly green.
// ════════════════════════════════════════════════════════════════════════════════════
const renderDays = [];
const seenRenderTier = {};
{
  const HL = lattice(TIERS, false).concat(lattice(['bodyweight'], true));
  const WANT = TIERS_PLUS.length * 2;          // one Leg-isolation day + one core day per tier
  for (const c of HL) {
    if (renderDays.length >= WANT) break;
    if (seenRenderTier[c.tier] && seenRenderTier['core_' + c.tier]) continue;
    let p; try { p = IA.buildProgram(c.cfg); } catch (e) { continue; }
    for (const cell of cells(p)) {
      (cell.day.sections||[]).forEach(s => {
        if ((s.label||'') !== SECTION) return;
        if (!seenRenderTier[c.tier]) { seenRenderTier[c.tier] = 1; renderDays.push({ tier: c.tier, key: c.key, sec: s, day: cell.day }); }
      });
      if (!seenRenderTier['core_' + c.tier] && (cell.day.sections||[]).some(s => s.core)) {
        seenRenderTier['core_' + c.tier] = 1;
        renderDays.push({ tier: c.tier + ' (core day)', key: c.key, sec: (cell.day.sections||[]).filter(s => s.core)[0], day: cell.day });
      }
    }
  }
}

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


console.log('\nPASS ' + pass + ' FAIL ' + fail);
process.exit(fail ? 1 : 0);
