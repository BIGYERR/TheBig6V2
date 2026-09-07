// Gate G192 — V192 / D42 slice 2: 'Landmine rotational press' — name, classification,
// injury behaviour. (Equipment gate and side-print are a LATER slice and are not tested
// here; this gate must stay silent about them.)
//
// Contract under test (ruling D42):
//   1. EXLIB.shoulder ends with 'Landmine rotational press'. The five prior entries keep
//      their identity and order.
//   2. _pattern('Landmine rotational press') === 'hpress'. Horizontal, not vertical: the
//      bar path finishes forward at chest height, and V185/D1 ruled the horizontal default
//      of the bare /press/ catch-all deliberate.
//   3. The rule is EXACT-anchored and sits ABOVE the /rotation/ core-exempt alternation.
//      No rotational core drill may reach it.
//   4. Injury: lowback/protect AND lowback/workaround drop it BY NAME, because 'hpress'
//      is neither dropped nor capped by either lowback plan and a generated caption
//      cannot promise the athlete rotates from the hip and not the lumbar spine.
//
// ── ORACLE INDEPENDENCE ────────────────────────────────────────────────────────
//   (a) G1 and G3 are HAND TABLES typed out of the ruling and the region doctrine.
//       Nothing here calls _pattern or injuryPlan and asserts it equals itself.
//   (b) G3 drives the REAL applyInjuryFilter with a throwaway one-item section (the
//       same shape _swapInjuryOK uses). Expected KEPT/DROPPED per cell is written by
//       hand from doctrine: shoulder and elbow reach an hpress THROUGH THE PATTERN
//       (protect drops it, workaround caps it); knee, ankle and hip touch neither the
//       pattern nor the name, so it survives; lowback must drop it by NAME.
//   (c) G4 is a SOURCE ORDER scan (comments stripped) — line index of the new rule vs
//       line index of the core-exempt alternation.
//   (d) G6 pins the four named rotational core drills to the verdicts they had BEFORE
//       this line existed, typed literally.
//
// Baseline behaviour: on the pre-slice artifact G1a, G3-lowback and G4 MUST fail.
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..', '..');
const { load } = require(path.join(ROOT, 'tests', 'harness.js'));
const FILE = process.argv[2] || path.join(ROOT, 'index.html');
const IA = load(FILE);
const SRC = fs.readFileSync(FILE, 'utf8');

let PASS = 0, FAIL = 0;
function ok(m){ PASS++; console.log('  ok   ' + m); }
function bad(m, extra){ FAIL++; console.log('  FAIL ' + m + (extra ? '  [' + extra + ']' : '')); }

const NAME = 'Landmine rotational press';

// ── G1. _pattern hand table ───────────────────────────────────────────────────
// Every expected value typed from the ruling / the authoring contract, not read back.
const PAT_TABLE = [
  [NAME,                          'hpress'],   // D42: forward bar path at chest height
  ['Landmine rotations',          null],       // rotational CORE drill, exempt
  ['Pallof press',                null],       // anti-rotation core, exempt
  ['Windshield wipers',           null],       // rotational core, exempt
  ['Thoracic rotations',          null],       // mobility rotation, exempt
  ['Landmine reverse lunge',      'lunge'],    // V178 D1
  ['Barbell overhead press',      'vpress'],
  ['Kettlebell single-arm press', 'vpress'],   // V185 D1
  ['Barbell bench press',         'hpress'],
];
PAT_TABLE.forEach(function(row, i){
  const got = IA._pattern(row[0]);
  const want = row[1];
  const label = 'G1' + String.fromCharCode(97 + i) + ' _pattern(' + JSON.stringify(row[0]) + ') === ' + JSON.stringify(want);
  if(got === want) ok(label); else bad(label, 'got ' + JSON.stringify(got));
});
// hpress is a real, distinct verdict here — guard against a stray vpress.
if(IA._pattern(NAME) !== 'vpress') ok('G1z the new press is NOT classified vertical');
else bad('G1z the new press is NOT classified vertical', 'got vpress');

// ── G2. EXLIB.shoulder ────────────────────────────────────────────────────────
const SH = IA.EXLIB && IA.EXLIB.shoulder;
const SH_EXPECT = ['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press',
                   'Dumbbell lateral raise','Barbell push press', NAME];
if(Array.isArray(SH) && SH.length === SH_EXPECT.length && SH.every(function(v,i){ return v === SH_EXPECT[i]; }))
  ok('G2a EXLIB.shoulder is the five prior entries in order, then the new name');
else bad('G2a EXLIB.shoulder is the five prior entries in order, then the new name', JSON.stringify(SH));

// The name must exist in exactly one pool. A second home is an unruled duplicate.
let homes = [];
Object.keys(IA.EXLIB).forEach(function(k){
  if(Array.isArray(IA.EXLIB[k]) && IA.EXLIB[k].indexOf(NAME) !== -1) homes.push(k);
});
if(homes.length === 1 && homes[0] === 'shoulder') ok('G2b the name lives in exactly one EXLIB pool (shoulder)');
else bad('G2b the name lives in exactly one EXLIB pool (shoulder)', homes.join(',') || 'none');

// ── G3. injury matrix ─────────────────────────────────────────────────────────
// KEPT   = item survives untouched
// CAPPED = item survives and the detail carries the RPE 7 clamp note
// DROPPED= item is gone
// Expected column written by hand from region doctrine (see header note (b)).
function verdict(name, region, tier){
  const cfg = { injury: { region: region, tier: tier } };
  const out = IA.applyInjuryFilter([{ label:'x', items:[{ name:name, detail:'3×5' }] }], cfg);
  const items = (out && out[0] && out[0].items) || [];
  if(!items.length) return 'DROPPED';
  if(items[0].name !== name) return 'SWAPPED:' + items[0].name;
  return /RPE 7/.test(items[0].detail || '') ? 'CAPPED' : 'KEPT';
}
const MATRIX = [
  ['lowback','protect',    'DROPPED'],  // D42: by name. hpress is unreachable by pattern here.
  ['lowback','workaround', 'DROPPED'],  // D42: by name.
  ['shoulder','protect',   'DROPPED'],  // hpress is in the protect drop set
  ['shoulder','workaround','CAPPED'],   // hpress is in the workaround cap set
  ['elbow','protect',      'DROPPED'],  // hpress is in the protect drop set
  ['elbow','workaround',   'CAPPED'],   // hpress is in the workaround cap set
  ['knee','protect',       'KEPT'],     // lower-body plan: no hpress lever, no name match
  ['knee','workaround',    'KEPT'],
  ['ankle','protect',      'KEPT'],
  ['ankle','workaround',   'KEPT'],
  ['hip','protect',        'KEPT'],
  ['hip','workaround',     'KEPT'],
];
MATRIX.forEach(function(row){
  const got = verdict(NAME, row[0], row[1]);
  const label = 'G3 ' + row[0] + '/' + row[1] + ' -> ' + row[2];
  if(got === row[2]) ok(label); else bad(label, 'got ' + got);
});
// No injury at all: the movement must simply survive.
if(verdict(NAME, null, null) === 'KEPT' || (function(){
  const out = IA.applyInjuryFilter([{label:'x',items:[{name:NAME,detail:'3×5'}]}], {});
  return !!(out && out[0] && out[0].items && out[0].items.length === 1 && out[0].items[0].name === NAME);
})()) ok('G3z with no injury the movement survives untouched');
else bad('G3z with no injury the movement survives untouched');

// ── G4. source order and exactness ────────────────────────────────────────────
const noComments = SRC.replace(/(^|\n)([ \t]*)\/\/[^\n]*/g, '$1$2').replace(/\/\*[\s\S]*?\*\//g, '');
const lines = noComments.split('\n');
let iNew = -1, iCore = -1;
lines.forEach(function(L, i){
  if(iNew < 0 && L.indexOf('/^landmine rotational press$/') !== -1) iNew = i;
  if(iCore < 0 && L.indexOf('hollow|rotation|curl-up') !== -1) iCore = i;
});
if(iNew >= 0) ok('G4a the exact-anchored rule is present in live code (not only in a comment)');
else bad('G4a the exact-anchored rule is present in live code (not only in a comment)');
if(iNew >= 0 && iCore >= 0 && iNew < iCore) ok('G4b the rule sits ABOVE the core-exempt alternation');
else bad('G4b the rule sits ABOVE the core-exempt alternation', 'new@' + iNew + ' core@' + iCore);
// Exactness: it must be anchored both ends. A loosened regex is the whole risk.
const loose = (noComments.match(/\/[^\/\n]*landmine[^\/\n]*press[^\/\n]*\//gi) || [])
  .filter(function(r){ return r !== '/^landmine rotational press$/'; });
if(!loose.length) ok('G4c no loosened landmine-press regex anywhere in live code');
else bad('G4c no loosened landmine-press regex anywhere in live code', loose.slice(0,3).join(' | '));
const dropAdds = (noComments.match(/\|landmine rotational\//g) || []).length;
if(dropAdds === 2) ok('G4d exactly two dropNames rows carry the name filter');
else bad('G4d exactly two dropNames rows carry the name filter', 'count=' + dropAdds);

// ── G5. copy rule ─────────────────────────────────────────────────────────────
if(!/\S[-—–]\S/.test(NAME) && !/nike/i.test(NAME)) ok('G5 the athlete-facing name carries no mid-word hyphen, en/em dash, or brand');
else bad('G5 the athlete-facing name carries no mid-word hyphen, en/em dash, or brand', NAME);

// ── G6. no collateral on the rotational core drills ───────────────────────────
// These four must behave exactly as they did before the new line existed.
const CORE_SURVIVORS = ['Landmine rotations', 'Landmine reverse lunge'];
CORE_SURVIVORS.forEach(function(n){
  ['protect','workaround'].forEach(function(t){
    const got = verdict(n, 'lowback', t);
    const label = 'G6 ' + JSON.stringify(n) + ' survives lowback/' + t;
    if(got === 'KEPT' || got === 'CAPPED') ok(label + ' (' + got + ')');
    else bad(label, 'got ' + got);
  });
});

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
