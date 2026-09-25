// g220_d173_recovbanner.js — GATE for D173 (P-RECOVBANNER): THE WEEK VIEW STOPS EXPLAINING THE PLACEMENT; THE PLACEMENT STAYS.
//
//   node tests/gates/g220_d173_recovbanner.js [candidate]
//
// THE RULING THIS DEFENDS (tests/measure/v220_rulings/p_recovbanner_ruling.md, Mario's call, coach concurs):
//   §2  "the banner goes. Nothing else on the athlete's screen changes." One week's claim printed on every week, a
//       "hardest runs" line shown to riders, a same-region promise the press-only region pass does not keep.
//   §4/§5  the FIELD stays: `legRecoveryNote` is kept on the program as an engine trace (standing ruling 3, keep and
//       wire: g205 P3a..P4a, g208 R2/R3/R8a, sabotage v205 M9 and v208 M1..M5 key on it as the placement's branch
//       signature). Zero days move; HALF_MANNY digest unchanged (the harness era row owns that, not this gate).
//   §6  G-RECOVBANNER: B1 `Recovery spacing` 0 (V219 1), B2 `activeProg.legRecoveryNote` 0 (V219 2), B3 the recycle
//       glyph 0 (V219 1, stored as escape text), B4 buildProgram(HALF_MANNY).legRecoveryNote === the D36 string.
//   §8  "No athlete-facing text survives."
//
// ORACLES, independent of the engine under test:
//   SRC   the candidate's inline JS (harness extraction) with comments stripped by a lexer that knows strings,
//         template literals (with ${} nesting) and regex literals. B0 proves the strip kept the code: the stripped
//         text still compiles and still carries the week renderer and the stats block.
//   D36   the HALF_MANNY note typed by hand below, from ruling §1 and the V189 D36 record (handoff; the same text
//         is hand-typed in g205_pace_eve.js and g208_d104a_runbase.js). The engine's output is never read into it.
//   DOM   renderWeekView() run in the harness VM against a DOM stub that RETAINS innerHTML (the g195 technique:
//         the harness's own getElementById hands out a fresh element per call and would swallow the write).
//
// ROWS
//   B0  the comment strip is sound: stripped SRC compiles, and carries `function renderWeekView(` and `wk-stats`.
//   B1  `Recovery spacing` in stripped SRC == 0.
//   B2  `activeProg.legRecoveryNote` in stripped SRC == 0 (the only screen reader of the field is gone).
//   B3  the recycle glyph in stripped SRC == 0, as the glyph U+267B AND as its escape text (case-insensitive).
//   B4  the field stays (standing ruling 3): buildProgram(HALF_MANNY).legRecoveryNote === D36, byte for byte.
//   B5  render: HALF_MANNY W1 and one NSW test program W1 (both carry a note, asserted first so the arm cannot pass
//       vacuously) render a non-empty week holding the `wk-stats` block, with no `Recovery spacing`, no recycle
//       glyph and no sentence of the note.
//
// VERSION PREDICATE (standing rulings 2 and 4). D173 ships on ia-version 220.
//   below 220: REFUSED, every row FAILS by name (never a vacuous pass). 220 and above: every row runs.
'use strict';
const path = require('path'), vm = require('vm');
const { load, fixtures, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const ROOT = path.join(__dirname, '..', '..');
const ART = path.resolve(process.argv[2] || path.join(ROOT, 'index.html'));
const ERA = 220;
const ROWS = ['B0', 'B1', 'B2', 'B3', 'B4', 'B5'];
const D36 = 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.';
const BS = String.fromCharCode(92);
const RECYCLE = String.fromCodePoint(0x267B), RECYCLE_ESC = BS + 'u267b';
const cl = o => JSON.parse(JSON.stringify(o)), cnt = (s, a) => s.split(a).length - 1;

let pass = 0, fail = 0;
const ok = (l, c, g) => { if(c){ pass++; console.log('PASS ' + l); } else { fail++; console.log('FAIL ' + l + (g === undefined ? '' : ' (got ' + g + ')')); } };
const done = () => { console.log('\nPASS ' + pass + ' FAIL ' + fail); process.exit(fail ? 1 : 0); };

// ── comment strip: a small lexer (strings, templates with ${} nesting, regex literals), comments become ' ' ──
function stripComments(src){
  const out = [], n = src.length, tpl = [];
  let i = 0, depth = 0, prevSig = '', prevWord = '';
  const RX_PREV = new Set('(,=:[!&|?{};+-*%<>~^'.split(''));
  const RX_WORDS = new Set(['return','typeof','case','do','else','in','of','new','delete','void','throw','instanceof','yield','await']);
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

// ── render stub (g195 technique): elements retain what is written to them ──
const DOM_STUB = "__g220mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],"
  + "classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
  + "setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
  + "appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
  + "replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
  + "addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
  + "closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
  + "offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
  + "__g220els={};document.getElementById=function(id){if(!__g220els[id])__g220els[id]=__g220mk(id);return __g220els[id];};"
  + "document.querySelectorAll=function(){return[];};";

// One NSW test program (ruling §0: the banner showed on 810/810 NSW test builds): pace goal, Mario's screenshot shape.
const NSW_TEST = { name:'G220 NSW', primaryPath:'goal', eventTargeted:false, cardioTypes:['run'],
  cardioGoals:{ run:{ id:'run_pace_goal', label:'P', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi' } },
  liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35', equipment:'home_full', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:255, deadlift:315, startDate:'2026-09-21', seed:24865 };

try {
  const IA = load(ART), VER = +IA.version;
  console.log('g220 D173 recovery banner | candidate ' + ART + ' ia-version ' + VER);
  if(!(VER >= ERA)){ console.log('REFUSED: ia-version ' + VER + ' predates D173 (V' + ERA + '). No row may pass on it.');
    ROWS.forEach(r => ok(r + ' refused: candidate ' + VER + ' is below the D173 era', false)); done(); }

  const SRC = stripComments(IA.js), low = SRC.toLowerCase();
  let compiles = true, cErr = '';
  try { new vm.Script(SRC); } catch(e){ compiles = false; cErr = e.message; }
  ok('B0 comment strip is sound: stripped inline JS compiles and carries the week renderer and the stats block',
     compiles && cnt(SRC, 'function renderWeekView(') === 1 && cnt(SRC, 'wk-stats') >= 1,
     compiles ? 'renderWeekView ' + cnt(SRC, 'function renderWeekView(') + ', wk-stats ' + cnt(SRC, 'wk-stats') : cErr);
  ok('B1 `Recovery spacing` in comment-stripped inline JS == 0 (V219 1)', cnt(SRC, 'Recovery spacing') === 0, cnt(SRC, 'Recovery spacing'));
  ok('B2 `activeProg.legRecoveryNote` in comment-stripped inline JS == 0 (V219 2)', cnt(SRC, 'activeProg.legRecoveryNote') === 0, cnt(SRC, 'activeProg.legRecoveryNote'));
  const g3 = cnt(SRC, RECYCLE), e3 = cnt(low, RECYCLE_ESC);
  ok('B3 recycle glyph in comment-stripped inline JS == 0, as glyph and as escape text (V219 0 + 1)', g3 === 0 && e3 === 0, 'glyph ' + g3 + ', escape ' + e3);

  const hm = IA.buildProgram(cl(fixtures.HALF_MANNY));
  ok('B4 the field stays: buildProgram(HALF_MANNY).legRecoveryNote === the hand-typed D36 string', hm && hm.legRecoveryNote === D36, hm && JSON.stringify(hm.legRecoveryNote));

  const arms = [['HALF_MANNY', hm], ['NSW test (run_pace_goal)', IA.buildProgram(cl(NSW_TEST))]];
  const D36_SENTENCES = D36.split('. ').map(s => s.replace(/\.$/, ''));
  for(const [nm, prog] of arms){
    const note = prog && prog.legRecoveryNote;
    let html = '', rErr = '';
    if(typeof note === 'string' && note.length){
      try {
        IA.localStorage.clear();
        IA.eval(DOM_STUB);
        IA.eval("activeProgId=" + JSON.stringify(prog.id));
        IA.eval('activeProg=' + JSON.stringify(prog));
        IA.eval('currentWeek=1');
        IA.eval('renderWeekView()');
        html = IA.eval('__g220els.daysList ? __g220els.daysList.innerHTML : ""') || '';
      } catch(e){ rErr = 'render threw: ' + e.message; }
    }
    const leaks = [];
    if(html.indexOf('Recovery spacing') >= 0) leaks.push('Recovery spacing');
    if(html.indexOf(RECYCLE) >= 0) leaks.push('recycle glyph');
    D36_SENTENCES.concat(note ? note.split('. ').map(s => s.replace(/\.$/, '')) : []).forEach(s => { const q = '"' + s + '"'; if(s && html.indexOf(s) >= 0 && leaks.indexOf(q) < 0) leaks.push(q); });
    ok('B5 ' + nm + ' W1 renders the week (non-empty, wk-stats present) with no banner, no recycle glyph, no note text',
       typeof note === 'string' && note.length > 0 && !rErr && html.length > 0 && html.indexOf('class="wk-stats"') >= 0 && leaks.length === 0,
       !(typeof note === 'string' && note.length) ? 'program carries no note, the render proves nothing'
         : rErr || (html.length === 0 ? 'empty week html' : html.indexOf('class="wk-stats"') < 0 ? 'no wk-stats block' : 'leaked ' + leaks.join(', ')));
  }
} catch(e){
  ok('crash: ' + (e && e.stack ? e.stack.split('\n').slice(0, 2).join(' | ') : String(e)), false);
}
done();
