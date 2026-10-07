// g225_d187_pacerate.js — GATE for D187 (P-PACERATE): the rate is a planning number with one
// owner, {3,3,2}, the mile is required on non-beginner run_pace_goal, and no string calls a rate safe.
//
//   node tests/gates/g225_d187_pacerate.js <candidate.html>
//   IA_ASSUME_VERSION=225 node tests/gates/g225_d187_pacerate.js <tree stamped 224>  (discrimination)
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
//   CONFINEMENT   (candidate vs a V224/V225 baseline, digest per goal; D187 V225, D189 Class B V226, scoped to 230 and
//                 below by the V231 absorb ruling section 3) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).
//
// VERSION PREDICATE (standing rulings 2 and 4). D187 ships at 225.
//   below 225   REFUSED, every row FAILS by name.
//   225 and up  every row asserts.
//   IA_ASSUME_VERSION=225 lifts a file stamped exactly 224 to 225 for a discrimination run (not a ship proof).
'use strict';
const path = require('path');
const H = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 225;

// Rows print through tests/status.js (CLAUDE.md Proof scope, Row manifest): one status line per declared id, one
// summary. The ids take each row's existing family name: CENSUS1..3, RATE1, COPY1..2, MILE1..3 (MILE-REQUIRED).
const S = require('../status')('g225_d187_pacerate.js');
const t0 = Date.now();
const ROWS = {
  CENSUS1: 'CENSUS PACE_IMPROVE declared exactly once',
  CENSUS2: 'CENSUS old {3,5,7} literal table: 0 occurrences (comment-stripped)',
  CENSUS3: 'CENSUS PACE_IMPROVE read at the expected reader-site count',
  RATE1: 'RATE PACE_IMPROVE deep-equals {beginner:3, intermediate:3, advanced:2}',
  COPY1: 'COPY run SI note template: no "safe rate" / "safely"',
  COPY2: 'COPY swim INT note template: no "safe rate" / "safely"',
  MILE1: 'MILE-REQUIRED non-beginner run_pace_goal, blank mile: refused',
  MILE2: 'MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected',
  MILE3: 'MILE-REQUIRED beginner run_pace_goal, blank mile: unaffected (byte-identical beginner path)',
};
const ROW_IDS = Object.keys(ROWS);
S.declare(ROW_IDS);
const ok = (id, c, g) => c ? S.pass(id, ROWS[id] + (g === undefined ? '' : ' (' + g + ')')) : S.fail(id, ROWS[id], g === undefined ? '' : 'got ' + g);
const done = () => { console.log('  runtime ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s'); S.summary(); };
const failAll = (why, detail) => { for(const id of ROW_IDS) S.fail(id, ROWS[id] + ' (' + why + ')', detail); done(); };

let STAMP = NaN;
try { STAMP = +H.load(ART).version; } catch(e){ failAll('boot', 'the candidate does not load in the harness: ' + e.message); }
let VER = STAMP;
if(process.env.IA_ASSUME_VERSION === String(ERA) && STAMP === ERA - 1){
  VER = ERA; console.log('ASSUMED ia-version ' + ERA + ' on a file stamped ' + STAMP + ' (IA_ASSUME_VERSION): a discrimination run, not a ship proof');
} else if(process.env.IA_ASSUME_VERSION !== undefined){
  console.log('IA_ASSUME_VERSION=' + process.env.IA_ASSUME_VERSION + ' IGNORED (it lifts only a file stamped exactly ' + (ERA - 1) + ' to ' + ERA + ')');
}
console.log('g225 D187 pacerate | candidate ' + ART + ' ia-version ' + STAMP + (VER !== STAMP ? ' (assumed ' + VER + ')' : ''));

if(!(VER >= ERA)){
  console.log('REFUSED: ia-version ' + VER + ' predates D187 P-PACERATE (V' + ERA + '). No row may pass on it.');
  failAll('REFUSED');
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
  ok('CENSUS1', declMatches === 1, declMatches);
}
{
  const oldTable = (CS.match(/\{beginner\s*:\s*3\s*,\s*intermediate\s*:\s*5\s*,\s*advanced\s*:\s*7\s*\}/g) || []).length;
  ok('CENSUS2', oldTable === 0, oldTable);
}
{
  // Every occurrence of the identifier PACE_IMPROVE minus the one declaration is a reader site.
  const allOccur = (CS.match(/\bPACE_IMPROVE\b/g) || []).length;
  const readers = allOccur - 1;
  // R2 names four reader sites (:2440, :3084, the :3766-3768 pair as one hunk, :3820/:3825). Each reader
  // LINE may use the identifier more than once (e.g. `PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate`), so
  // the ruled count is the number of INDEPENDENT USE SITES (lines), not the raw token count.
  const readerLines = (CS.match(/[^\n]*\bPACE_IMPROVE\b[^\n]*/g) || []).filter(l => !/\bPACE_IMPROVE\s*=\s*\{/.test(l));
  ok('CENSUS3', readerLines.length === 4, 'reader lines ' + readerLines.length + ' (raw token occurrences beyond the declaration: ' + readers + ')');
}

// ── RATE ──
{
  let rate = null, err = null;
  try { rate = JSON.parse(IA.eval('JSON.stringify(PACE_IMPROVE)')); } catch(e){ err = e.message; }
  const want = { beginner: 3, intermediate: 3, advanced: 2 };
  const eq = rate && Object.keys(want).every(k => rate[k] === want[k]) && Object.keys(rate || {}).length === 3;
  ok('RATE1', eq, err || JSON.stringify(rate));
}

// ── COPY (source-level: the two note-template string literals) ──
{
  // Bound generous on purpose: a sabotage mutation that re-inserts a banned sentence lengthens
  // this span, and a tight bound would make the extraction itself fail ("template not found")
  // instead of finding the template and flagging the banned phrase inside it.
  const runTplMatch = CS.match(/note\s*=\s*`SI: Pace moves[^`]*`/) || CS.match(/note\s*=\s*_sameFmt[\s\S]{0,800}?Hit the prescribed pace precisely\.`;/);
  const runTpl = runTplMatch ? runTplMatch[0] : '';
  const bad = /safe rate|safely/i.test(runTpl);
  ok('COPY1', !!runTpl && !bad, runTpl ? (bad ? 'template contains a banned phrase' : 'clean, ' + runTpl.length + ' chars') : 'template not found');
}
{
  const swimTplMatch = CS.match(/note\s*=\s*_anchorLine\s*\+\s*`INT: Split moves[^`]*`/);
  const swimTpl = swimTplMatch ? swimTplMatch[0] : '';
  const bad = /safe rate|safely/i.test(swimTpl);
  ok('COPY2', !!swimTpl && !bad, swimTpl ? (bad ? 'template contains a banned phrase' : 'clean, ' + swimTpl.length + ' chars') : 'template not found');
}

// ── MILE-REQUIRED (direct function calls, D110a's model, no wizard/doGenerate needed) ──
{
  const J = v => JSON.stringify(v);
  const call = (g, exp) => { try { return JSON.parse(IA.eval('JSON.stringify(_mileEntryState(' + J(g) + ',' + J(exp) + '))')); } catch(e){ return { crash: e.message }; } };
  const r1 = call({ id: 'run_pace_goal' }, 'intermediate');
  ok('MILE1', r1 && r1.ok === false && r1.blank === true, JSON.stringify(r1));
  const r2 = call({ id: 'run_5k' }, 'intermediate');
  ok('MILE2', r2 && r2.ok === true, JSON.stringify(r2));
  const r3 = call({ id: 'run_pace_goal' }, 'beginner');
  ok('MILE3', r3 && r3.ok === true, JSON.stringify(r3));
}

// CONFINEMENT (candidate vs V224/V225, D187 V225 and D189 Class B V226; V231 absorb ruling section 3) retired Post-V233 under standing ruling 3 (build-scoped; the previous-version run replaces it).

done();
