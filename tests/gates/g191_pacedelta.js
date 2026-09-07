// Gate G191 — V191 / D40: "the derived pace delta reads as a gap, not a second count".
//
// Contract under test (ruling D40, Mario concurred):
//   ad = |round(actual_sec_per_mi - target_sec_per_mi)|
//     ad <  5  ->  "on target"                       (unchanged from V190)
//     ad <  60 ->  "<ad>s/mi <dir> than target"      (unchanged from V190)
//     ad >= 60 ->  "<m>:<ss>/mi <dir> than target"   (NEW in V191, ss zero padded to 2)
//   dir = "faster" when the athlete ran FEWER seconds per mile than target (df < 0),
//         "slower" when df > 0. Wording unchanged.
//
// ── ORACLE INDEPENDENCE ────────────────────────────────────────────────────────
// Nothing here calls the app's formatter and asserts it equals itself.
//   (a) G1 is a HAND TABLE: 16 literal expected strings typed out of the ruling.
//   (b) G2/G3 sweep 0..300 s/mi and DECODE the printed m:ss back to seconds
//       (min*60+sec) — decoding is the inverse of the operation under test, written
//       here, never borrowed from index.html.
//   (c) G4 is the copy rule read off CLAUDE.md, applied to the produced strings.
//   (d) G5 is a source scan proving the V190 raw-seconds-only expression is gone
//       and that the delta still has exactly ONE writer.
//
// ── HOW THE STRING IS PRODUCED ────────────────────────────────────────────────
// Through the REAL render path: updateDoseDerived() reading _curLogDose and the
// live #log_run_* inputs, writing into #doseDerived. The harness's getElementById
// hands back a throwaway element, so this gate installs a keyed DOM stub inside the
// VM context first; nothing about the formatter is reimplemented.
// Pace comes out as mins*60/dist. With dist = 60 miles the arithmetic is EXACT:
// sec_per_mi === minutes entered. That is a numeric convenience for driving the
// formatter, not a coaching claim about a 60 mile session.
//
// Baseline behaviour: on V190 this gate MUST fail (G1/G2 on every ad >= 60 case).
// Usage: node tests/gates/g191_pacedelta.js <candidate.html>

const path = require('path');
const { load } = require(path.join(__dirname, '..', 'harness'));

const FILE = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
let PASS = 0, FAIL = 0;
const ok  = (n)      => { PASS++; console.log('pass  ' + n); };
const bad = (n, msg) => { FAIL++; console.log('FAIL  ' + n + ' :: ' + msg); };

const IA = load(FILE);
const fs = require('fs');
const SRC = fs.readFileSync(FILE, 'utf8');

// ── keyed DOM stub, installed in the app's own context ────────────────────────
IA.eval(`
  globalThis.__els = {};
  var __mkEl = function(id){
    return { id:id, value:'', innerHTML:'', textContent:'', style:{}, dataset:{},
             addEventListener:function(){}, querySelectorAll:function(){ return []; },
             querySelector:function(){ return null; } };
  };
  document.getElementById = function(id){
    if(!globalThis.__els[id]) globalThis.__els[id] = __mkEl(id);
    return globalThis.__els[id];
  };
`);

// Drive the real readout for a given target pace and actual pace (both sec/mi).
// Returns the <small> note text, or null when no note was rendered.
function noteFor(tgtSec, actSec){
  IA.eval(`
    globalThis.__els = {};
    _curLogDose = {k:'dist', mi:60, tgt:${tgtSec}};
    document.getElementById('log_run_mins').value = ${JSON.stringify(String(actSec))};
    document.getElementById('log_run_dist').value = '60';
    document.getElementById('log_run_reps').value = '';
    document.getElementById('log_run_rep_time').value = '';
    updateDoseDerived();
  `);
  const html = IA.eval("globalThis.__els['doseDerived'] ? globalThis.__els['doseDerived'].innerHTML : ''");
  const m = String(html).match(/<small>([\s\S]*?)<\/small>/);
  return m ? m[1] : null;
}

const TGT = 600;   // 10:00/mi target for every case. Direction comes from the sign of df.

// ── G1. hand table, straight out of the ruling ────────────────────────────────
// [df (actual - target, seconds/mile), expected note]
const TABLE = [
  [   0, 'on target'                     ],
  [  +4, 'on target'                     ],
  [  -4, 'on target'                     ],
  [  +5, '5s/mi slower than target'      ],
  [  -5, '5s/mi faster than target'      ],
  [ -43, '43s/mi faster than target'     ],
  [ +59, '59s/mi slower than target'     ],
  [ -59, '59s/mi faster than target'     ],
  [ +60, '1:00/mi slower than target'    ],
  [ -60, '1:00/mi faster than target'    ],
  [ -73, '1:13/mi faster than target'    ],   // the reported case
  [ +73, '1:13/mi slower than target'    ],
  [ +69, '1:09/mi slower than target'    ],   // zero pad, single-digit seconds
  [+120, '2:00/mi slower than target'    ],   // zero pad, :00
  [+125, '2:05/mi slower than target'    ],
  [-125, '2:05/mi faster than target'    ],
];
TABLE.forEach(([df, want]) => {
  const got = noteFor(TGT, TGT + df);
  const n = 'G1 df=' + (df > 0 ? '+' + df : df) + ' -> ' + JSON.stringify(want);
  if(got === want) ok(n); else bad(n, 'got ' + JSON.stringify(got));
});

// ── G2. sweep 0..300: shape by band, and m:ss decodes back to ad ──────────────
// Independent inverse: minutes*60 + seconds must equal the magnitude we drove in.
let shapeBad = [], decodeBad = [], padBad = [];
for(let ad = 0; ad <= 300; ad++){
  for(const sign of [-1, +1]){
    if(ad === 0 && sign === +1) continue;
    const df = sign * ad;
    const got = noteFor(TGT, TGT + df) || '';
    if(ad < 5){
      if(got !== 'on target') shapeBad.push(df + ':' + got);
      continue;
    }
    if(ad < 60){
      const m = got.match(/^(\d+)s\/mi (faster|slower) than target$/);
      if(!m){ shapeBad.push(df + ':' + got); continue; }
      if(+m[1] !== ad) decodeBad.push(df + ':' + got);
    } else {
      const m = got.match(/^(\d+):(\d{2})\/mi (faster|slower) than target$/);
      if(!m){ shapeBad.push(df + ':' + got); continue; }
      if((+m[1]) * 60 + (+m[2]) !== ad) decodeBad.push(df + ':' + got);
      if(m[2].length !== 2) padBad.push(df + ':' + got);
      if(+m[2] > 59) decodeBad.push(df + ':' + got);
    }
  }
}
if(!shapeBad.length) ok('G2a every band prints its own shape (0..300, both directions)');
else bad('G2a every band prints its own shape (0..300, both directions)', shapeBad.length + ' wrong, first: ' + shapeBad.slice(0,4).join(' | '));
if(!decodeBad.length) ok('G2b printed magnitude decodes back to the driven delta');
else bad('G2b printed magnitude decodes back to the driven delta', decodeBad.length + ' wrong, first: ' + decodeBad.slice(0,4).join(' | '));
if(!padBad.length) ok('G2c seconds are always two digits in the m:ss form');
else bad('G2c seconds are always two digits in the m:ss form', padBad.slice(0,4).join(' | '));

// ── G2d. no raw second count of 60 or more survives anywhere in the sweep ─────
let rawBig = [];
for(let ad = 60; ad <= 300; ad += 7){
  const got = noteFor(TGT, TGT + ad) || '';
  if(/\d+s\/mi/.test(got)) rawBig.push(ad + ':' + got);
}
if(!rawBig.length) ok('G2d no "Ns/mi" form at or above a minute');
else bad('G2d no "Ns/mi" form at or above a minute', rawBig.slice(0,4).join(' | '));

// ── G3. direction wording follows the sign, never the magnitude ───────────────
let dirBad = [];
for(let ad = 5; ad <= 300; ad += 11){
  const fast = noteFor(TGT, TGT - ad) || '';
  const slow = noteFor(TGT, TGT + ad) || '';
  if(!/ faster than target$/.test(fast)) dirBad.push('-' + ad + ':' + fast);
  if(!/ slower than target$/.test(slow)) dirBad.push('+' + ad + ':' + slow);
}
if(!dirBad.length) ok('G3 fewer seconds per mile reads faster, more reads slower');
else bad('G3 fewer seconds per mile reads faster, more reads slower', dirBad.slice(0,4).join(' | '));

// ── G4. copy rule (CLAUDE.md): no mid-sentence hyphen or em-dash, no "Nike" ────
let copyBad = [];
[0, 4, 5, 43, 59, 60, 73, 125, 605].forEach(ad => {
  [-1, +1].forEach(s => {
    const got = noteFor(TGT, TGT + s * ad) || '';
    if(/\S[-—]\S/.test(got) || /—/.test(got) || /nike/i.test(got)) copyBad.push(got);
  });
});
if(!copyBad.length) ok('G4 delta copy carries no mid-sentence hyphen, em-dash or brand');
else bad('G4 delta copy carries no mid-sentence hyphen, em-dash or brand', copyBad.slice(0,3).join(' | '));

// ── G5. source: one writer, and the V190 raw-seconds-only form is gone ────────
const noComments = SRC.replace(/(^|\n)\s*\/\/[^\n]*/g, '$1').replace(/\/\*[\s\S]*?\*\//g, '');
const nFaster = (noComments.match(/faster than target/g) || []).length;
const nSlower = (noComments.match(/slower than target/g) || []).length;
if(nFaster === 1 && nSlower === 1) ok('G5a exactly one code site writes the pace delta');
else bad('G5a exactly one code site writes the pace delta', 'faster=' + nFaster + ' slower=' + nSlower);

const v190Form = (noComments.match(/Math\.abs\(df\)\+'s\/mi '/g) || []).length;
if(v190Form === 0) ok('G5b the V190 raw-second-count expression is gone');
else bad('G5b the V190 raw-second-count expression is gone', v190Form + ' occurrence(s) remain');

// The unrelated V158 retest strip keeps its own "sec/mi" wording. D40 did not rule on
// it, so this gate asserts it was NOT collaterally rewritten (a removal nobody ruled).
const benchKeeps = (noComments.match(/sec\/mi FASTER at the same effort/g) || []).length;
if(benchKeeps === 1) ok('G5c the V158 benchmark retest strip was left alone');
else bad('G5c the V158 benchmark retest strip was left alone', 'count=' + benchKeeps);

// ── G6. the delta is display only: nothing parses it back, nothing is stored ──
// run_pace persistence must still receive the PACE, never the delta string.
const derived = IA.eval("JSON.stringify(doseDerived({k:'dist', mi:60, tgt:600}, {mins:'673', dist:'60'}))");
const dd = JSON.parse(derived);
if(dd && dd.pace === '11:13/mi' && dd.tgt === 600 && Math.round(dd.sec) === 673)
  ok('G6 doseDerived still returns pace/tgt/sec only, no delta string in the data');
else bad('G6 doseDerived still returns pace/tgt/sec only, no delta string in the data', derived);

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
