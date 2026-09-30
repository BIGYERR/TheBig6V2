// g225_d187_pacerate.js — GATE for D187 (P-PACERATE): the rate is a planning number with one
// owner, {3,3,2}, the mile is required on non-beginner run_pace_goal, and no string calls a rate safe.
//
//   node tests/gates/g225_d187_pacerate.js <candidate.html> [baseline_V224.html]
//   IA_ASSUME_VERSION=225 node tests/gates/g225_d187_pacerate.js <tree stamped 224> [baseline_V224.html]  (discrimination)
//
// THE RULING THIS DEFENDS: tests/measure/v225_rulings/d186_d187_pacerate_clockend_v225.md, D187 section
// (Finding, R1-R5, "What deliberately does NOT change", dispatch edit list (d)). D-code D187.
//
// ORACLES (never the engine's own PACE_IMPROVE value as its own proof):
//   SITE CENSUS   comment-stripped source text, counted by regex, never by asking the engine what it thinks
//                 its own site count is.
//   RATE          the hand table {beginner:3, intermediate:3, advanced:2} typed from Mario's T1 ruling
//                 (2026-09-23) and the amendment's Daniels-bounded judgement, compared against the engine's
//                 PACE_IMPROVE by deep equality, not read back from a computation that assumes it.
//   COPY          the two note-template string literals (run SI note, swim INT note) read from the
//                 comment-stripped source directly, never from a built program's own note (that check lives
//                 separately, in the runtime MILE-REQUIRED / confinement section below, as a second witness).
//   MILE-REQUIRED _mileEntryState called directly with a bare {id} goal object and an experience string —
//                 never through doGenerate's toast (that's D110a's own model, already gated).
//   CONFINEMENT   whole-program digests from TWO different artifacts (candidate vs baseline), the only way
//                 to prove NOTHING moved on a goal type this ruling does not touch.
//
// VERSION PREDICATE (standing rulings 2 and 4). D187 ships at 225.
//   below 225   REFUSED, every row FAILS by name.
//   225 and up  every row asserts.
//   IA_ASSUME_VERSION=225 lifts a file stamped exactly 224 to 225 for a discrimination run (not a ship proof).
'use strict';
const path = require('path'), fs = require('fs');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const BASEFILE = process.argv[3] ? path.resolve(process.argv[3]) : null;
const ERA = 225;

let pass = 0, fail = 0;
const t0 = Date.now();
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l + (g === undefined ? '' : ' (' + g + ')')); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ console.log('FAIL boot: ' + e.message); fail++; done(); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
} else if(process.env.IA_ASSUME_VERSION !== undefined){
  console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g225 D187 pacerate | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : '') + (BASEFILE ? ' | baseline ' + BASEFILE : ' | NO BASELINE (confinement will fail closed)'));

const ROW_LABELS = [
  'CENSUS PACE_IMPROVE declared exactly once',
  'CENSUS old {3,5,7} literal table: 0 occurrences (comment-stripped)',
  'CENSUS PACE_IMPROVE read at the expected reader-site count',
  'RATE PACE_IMPROVE deep-equals {beginner:3, intermediate:3, advanced:2}',
  'COPY run SI note template: no "safe rate" / "safely"',
  'COPY swim INT note template: no "safe rate" / "safely"',
  'MILE-REQUIRED non-beginner run_pace_goal, blank mile: refused',
  'MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected',
  'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',
  'CONFINEMENT 0 digest diffs on every non-pace-goal cell (swim/bike/run_base/NRC)',
];
if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D187 P-PACERATE (V' + ERA + '). No row may pass on it.');
  ROW_LABELS.forEach(l => ok(l + ' (REFUSED)', false));
  done();
}

// ── comment stripper (lifted verbatim from tests/gates/g221_d178_active.js / g223_d183_safepace.js) ──
const BS = String.fromCharCode(92);
function stripComments(src){
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await']);
  const readTemplate = () => {
    while(i < n){ const c = src[i];
      if(c === BS){ out.push(src.substr(i, 2)); i += 2; continue; }
      if(c === '`'){ out.push(c); i++; return; }
      if(c === '$' && src[i + 1] === '{'){ out.push('${'); i += 2; tpl.push(depth); depth++; return; }
      out.push(c); i++; } };
  while(i < n){
    const c = src[i], d = src[i + 1];
    if(c === '/' && d === '/'){ while(i < n && src[i] !== '\n') i++; continue; }
    if(c === '/' && d === '*'){ const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; out.push(' '); continue; }
    if(c === "'" || c === '"'){ let j = i + 1; while(j < n && src[j] !== c && src[j] !== '\n'){ if(src[j] === BS) j++; j++; }
      out.push(src.slice(i, j + 1)); i = j + 1; prevSig = c; prevWord = ''; continue; }
    if(c === '`'){ out.push(c); i++; readTemplate(); prevSig = '`'; prevWord = ''; continue; }
    if(c === '{'){ depth++; out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(c === '}'){ depth--; out.push(c); i++; prevWord = '';
      if(tpl.length && tpl[tpl.length - 1] === depth){ tpl.pop(); readTemplate(); prevSig = '`'; } else prevSig = '}'; continue; }
    if(c === '/'){
      if(prevSig === '' || prevSig === '}' || RX_PREV.has(prevSig) || RX_WORDS.has(prevWord)){
        let j = i + 1, cls = false;
        while(j < n && src[j] !== '\n'){ const x = src[j]; if(x === BS){ j += 2; continue; }
          if(cls){ if(x === ']') cls = false; } else if(x === '[') cls = true; else if(x === '/') break; j++; }
        j++; while(j < n && /[a-z]/i.test(src[j])) j++;
        out.push(src.slice(i, j)); i = j; prevSig = 'r'; prevWord = ''; continue; }
      out.push(c); i++; prevSig = c; prevWord = ''; continue; }
    if(/[A-Za-z0-9_$]/.test(c)){ let j = i; while(j < n && /[A-Za-z0-9_$]/.test(src[j])) j++; const w = src.slice(i, j);
      out.push(w); i = j; prevWord = w; prevSig = 'w'; continue; }
    out.push(c); i++; if(!/\s/.test(c)){ prevSig = c; prevWord = ''; }
  }
  return out.join('');
}

const IA = H.load(ART);
const CS = stripComments(IA.js);   // comment-stripped source, the census oracle

// ── CENSUS ──
{
  const declMatches = (CS.match(/\bPACE_IMPROVE\s*=\s*\{/g) || []).length;
  ok(ROW_LABELS[0], declMatches === 1, declMatches);
}
{
  const oldTable = (CS.match(/\{beginner\s*:\s*3\s*,\s*intermediate\s*:\s*5\s*,\s*advanced\s*:\s*7\s*\}/g) || []).length;
  ok(ROW_LABELS[1], oldTable === 0, oldTable);
}
{
  // Every occurrence of the identifier PACE_IMPROVE minus the one declaration is a reader site.
  const allOccur = (CS.match(/\bPACE_IMPROVE\b/g) || []).length;
  const readers = allOccur - 1;
  // R2 names four reader sites (:2440, :3084, the :3766-3768 pair as one hunk, :3820/:3825). Each reader
  // LINE may use the identifier more than once (e.g. `PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate`), so
  // the ruled count is the number of INDEPENDENT USE SITES (lines), not the raw token count.
  const readerLines = (CS.match(/[^\n]*\bPACE_IMPROVE\b[^\n]*/g) || []).filter(l => !/\bPACE_IMPROVE\s*=\s*\{/.test(l));
  ok(ROW_LABELS[2], readerLines.length === 4, 'reader lines ' + readerLines.length + ' (raw token occurrences beyond the declaration: ' + readers + ')');
}

// ── RATE ──
{
  let rate = null, err = null;
  try { rate = JSON.parse(IA.eval('JSON.stringify(PACE_IMPROVE)')); } catch(e){ err = e.message; }
  const want = { beginner: 3, intermediate: 3, advanced: 2 };
  const eq = rate && Object.keys(want).every(k => rate[k] === want[k]) && Object.keys(rate || {}).length === 3;
  ok(ROW_LABELS[3], eq, err || JSON.stringify(rate));
}

// ── COPY (source-level: the two note-template string literals) ──
{
  // Bound generous on purpose: a sabotage mutation that re-inserts a banned sentence lengthens
  // this span, and a tight bound would make the extraction itself fail ("template not found")
  // instead of finding the template and flagging the banned phrase inside it.
  const runTplMatch = CS.match(/note\s*=\s*`SI: Pace moves[^`]*`/) || CS.match(/note\s*=\s*_sameFmt[\s\S]{0,800}?Hit the prescribed pace precisely\.`;/);
  const runTpl = runTplMatch ? runTplMatch[0] : '';
  const bad = /safe rate|safely/i.test(runTpl);
  ok(ROW_LABELS[4], !!runTpl && !bad, runTpl ? (bad ? 'template contains a banned phrase' : 'clean, ' + runTpl.length + ' chars') : 'template not found');
}
{
  const swimTplMatch = CS.match(/note\s*=\s*_anchorLine\s*\+\s*`INT: Split moves[^`]*`/);
  const swimTpl = swimTplMatch ? swimTplMatch[0] : '';
  const bad = /safe rate|safely/i.test(swimTpl);
  ok(ROW_LABELS[5], !!swimTpl && !bad, swimTpl ? (bad ? 'template contains a banned phrase' : 'clean, ' + swimTpl.length + ' chars') : 'template not found');
}

// ── MILE-REQUIRED (direct function calls, D110a's model, no wizard/doGenerate needed) ──
{
  const J = v => JSON.stringify(v);
  const call = (g, exp) => { try { return JSON.parse(IA.eval('JSON.stringify(_mileEntryState(' + J(g) + ',' + J(exp) + '))')); } catch(e){ return { crash: e.message }; } };
  const r1 = call({ id: 'run_pace_goal' }, 'intermediate');
  ok(ROW_LABELS[6], r1 && r1.ok === false && r1.blank === true, JSON.stringify(r1));
  const r2 = call({ id: 'run_5k' }, 'intermediate');
  ok(ROW_LABELS[7], r2 && r2.ok === true, JSON.stringify(r2));
  const r3 = call({ id: 'run_pace_goal' }, 'beginner');
  ok(ROW_LABELS[8], r3 && r3.ok === true, JSON.stringify(r3));
}

// ── CONFINEMENT (needs a baseline artifact: candidate vs V224, byte-identical digest per goal) ──
{
  if(!BASEFILE || !fs.existsSync(BASEFILE)){
    ok(ROW_LABELS[9], false, 'no baseline artifact provided (fail closed, not a silent pass)');
  } else {
    const BASE = H.load(BASEFILE);
    const CFG0 = Object.assign(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)), {});
    const goalCfgs = {
      swim_100_time: { cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_100_time', swimUnit: 'yd', baseMins: '1', baseSecs: '10', base500Mins: '7', base500Secs: '0' } } },
      swim_500_time: { cardioTypes: ['swim'], cardioGoals: { swim: { id: 'swim_500_time', swimUnit: 'yd', baseMins: '7', baseSecs: '0' } } },
      bike_ftp: { cardioTypes: ['bike'], cardioGoals: { bike: { id: 'bike_ftp', label: 'Improve FTP / Power' } } },
      run_base: { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_base', label: 'Build Running Base', baselineDist: '3', baseline: '3mi' } } },
      run_5k: { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_5k', label: '5K', mileBestMins: '8', mileBestSecs: '0' } } },
      run_half: { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_half', label: 'Half Marathon', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } } },
      run_marathon: { cardioTypes: ['run'], cardioGoals: { run: { id: 'run_marathon', label: 'Marathon', mileBestMins: '10', mileBestSecs: '30', baselineDist: '5', baseline: '5mi' } } },
    };
    const diffs = [];
    for(const [goalId, over] of Object.entries(goalCfgs)){
      const cfg = Object.assign(JSON.parse(JSON.stringify(CFG0)), over);
      let dA = null, dB = null, err = null;
      try { dA = H.progDigest(IA.buildProgram(JSON.parse(JSON.stringify(cfg)))); } catch(e){ err = 'candidate: ' + e.message; }
      try { dB = H.progDigest(BASE.buildProgram(JSON.parse(JSON.stringify(cfg)))); } catch(e){ err = (err ? err + '; ' : '') + 'baseline: ' + e.message; }
      if(err) diffs.push(goalId + ' CRASH ' + err);
      else if(dA !== dB) diffs.push(goalId + ' candidate ' + dA + ' != baseline ' + dB);
    }
    ok(ROW_LABELS[9], diffs.length === 0, diffs.join(' | ') || (Object.keys(goalCfgs).length + ' goal types identical'));
  }
}

done();
