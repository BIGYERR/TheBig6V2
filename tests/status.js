'use strict';
// tests/status.js: the shared status helper (post-V233 slice M1a; CLAUDE.md Proof scope, Version scope and Row manifest).
// Every new gate, and every gate converted by hand, prints its rows through this file.
//
//   const S = require('../status')('g234_topic');      // from a gate in tests/gates/ (this file sits in tests/)
//   S.declare(['A1', 'A2', 'L1', 'S1']);                 // every row the gate owns; may be called more than once
//   S.pass('A1', 'label');                               // PASS A1 label
//   S.fail('A2', 'label', 'detail');                     // FAIL A2 label — detail
//   S.check('A1', cond, 'label', 'detail');              // pass or fail on cond; returns !!cond
//   S.skip('S1', 'cause');  S.scoped('S2', 'cause');     // SKIP S1 cause / SCOPED OUT S2 cause (cause: the missing input)
//   S.info('text');                                      // INFO text (not a row)
//   const L = S.loop('L1', 'label');                     // a loop row: sub-results under ONE id
//   for (...) L.check(cond, 'sub label', 'detail');      // nothing printed per sub-result
//   L.done();                                            // ONE line: PASS L1 label (n of n), or
//                                                        //   FAIL L1 label — k of n failed: <first three>
//   S.summary();                                         // last line PASS n FAIL n; exit 1 on any FAIL, else 0
//
// The status lines, one physical line each, at column 0 (a newline inside a label, cause or detail prints as a space):
//   PASS <id> <label>
//   FAIL <id> <label> — <detail>          (no " — <detail>" when the detail is empty)
//   SKIP <id> <cause>
//   SCOPED OUT <id> <cause>
//   INFO <text>                           (not a row; tests/rows.js ignores it)
// tests/rows.js reads these lines; the id is the row's key in tests/row_manifest.txt, and a SKIP or SCOPED OUT row
// is red in gate.sh unless tests/skip_allow.txt names it.
//
// Id grammar (ID_RE below): 1 to 6 ASCII letters, then one digit, then any run of letters, digits, '.' and '-'.
//   /^[A-Za-z]{1,6}[0-9][A-Za-z0-9.\-]*$/      e.g. G1, D207a, d194-postsweep, X1.2, Lb12
// It is a strict subset of tests/rows.js's key grammar (measure mR's id-like token), so every line printed here parses
// there to exactly this id. A label, cause or detail is required (non-empty): rows.js needs text after the id.
//
// Crashes (throw), so the gate prints no summary and gate.sh reads it red: an id outside the grammar, an id declared
// twice, a status call with no label or cause, a loop closed twice, summary() called twice.
// summary() prints a FAIL line, by name, for every declared id with no status line, every id printed more than once,
// every id printed but never declared, every loop row opened and never closed, and a gate that declared nothing.
// A loop row that collected zero sub-results prints FAIL: a loop that never ran is a dark row.
// PASS n counts PASS lines, FAIL n counts FAIL lines (summary's own included); SKIP and SCOPED OUT count in neither.

const ID_RE = /^[A-Za-z]{1,6}[0-9][A-Za-z0-9.\-]*$/;
const one = s => String(s).replace(/\s*[\r\n]+\s*/g, ' ').trim();   // one physical line

module.exports = function status(gateName){
  const gate = one(gateName || '');
  if(!gate) throw new Error('status.js: require(\'../status\')(gateName) needs the gate name');
  const declared = [], isDeclared = new Set();
  const printed = new Map();          // id -> count of status lines
  const order = [];                   // ids in first-print order
  const loops = new Map();            // id -> open loop state
  let P = 0, F = 0, SK = 0, SO = 0, done = false;

  const need = (id, what) => {
    if(typeof id !== 'string' || !ID_RE.test(id)) throw new Error('status.js ' + gate + ': ' + what + ' id ' + JSON.stringify(id) + ' is outside the id grammar ' + ID_RE);
  };
  const text = (t, what, id) => {
    const s = t == null ? '' : one(t);
    if(!s) throw new Error('status.js ' + gate + ': ' + what + ' for ' + id + ' is empty');
    return s;
  };
  const emit = (id, line) => {
    if(done) throw new Error('status.js ' + gate + ': status line for ' + id + ' after summary()');
    if(!printed.has(id)){ printed.set(id, 0); order.push(id); }
    printed.set(id, printed.get(id) + 1);
    console.log(line);
  };

  const S = {
    ID_RE,
    declare(ids){
      if(!Array.isArray(ids)) throw new Error('status.js ' + gate + ': declare() takes an array of ids');
      for(const id of ids){
        need(id, 'declare()');
        if(isDeclared.has(id)) throw new Error('status.js ' + gate + ': ' + id + ' declared twice');
        isDeclared.add(id); declared.push(id);
      }
      return S;
    },
    pass(id, label){ need(id, 'pass()'); emit(id, 'PASS ' + id + ' ' + text(label, 'label', id)); P++; return true; },
    fail(id, label, detail){
      need(id, 'fail()');
      const d = detail == null ? '' : one(detail);
      emit(id, 'FAIL ' + id + ' ' + text(label, 'label', id) + (d ? ' — ' + d : '')); F++; return false;
    },
    check(id, cond, label, detail){ return cond ? S.pass(id, label) : S.fail(id, label, detail); },
    skip(id, cause){ need(id, 'skip()'); emit(id, 'SKIP ' + id + ' ' + text(cause, 'cause', id)); SK++; },
    scoped(id, cause){ need(id, 'scoped()'); emit(id, 'SCOPED OUT ' + id + ' ' + text(cause, 'cause', id)); SO++; },
    info(t){ if(done) throw new Error('status.js ' + gate + ': info after summary()'); console.log('INFO ' + one(t == null ? '' : t)); },
    loop(id, label){
      need(id, 'loop()');
      const lab = text(label, 'label', id);
      if(loops.has(id)) throw new Error('status.js ' + gate + ': loop ' + id + ' opened twice');
      const st = { n: 0, bad: [], closed: false };
      loops.set(id, st);
      const L = {
        check(cond, sub, detail){
          if(st.closed) throw new Error('status.js ' + gate + ': sub-result for loop ' + id + ' after done()');
          st.n++;
          if(!cond){ const d = detail == null ? '' : one(detail); st.bad.push(one(sub == null ? '#' + st.n : sub) + (d ? ' (' + d + ')' : '')); }
          return !!cond;
        },
        pass(sub){ return L.check(true, sub); },
        fail(sub, detail){ return L.check(false, sub, detail); },
        done(){
          if(st.closed) throw new Error('status.js ' + gate + ': loop ' + id + ' closed twice');
          st.closed = true;
          if(st.n === 0) return S.fail(id, lab, 'the loop ran 0 times: no sub-result, a dark row');
          if(st.bad.length) return S.fail(id, lab, st.bad.length + ' of ' + st.n + ' failed: ' + st.bad.slice(0, 3).join('; ') + (st.bad.length > 3 ? '; and ' + (st.bad.length - 3) + ' more' : ''));
          return S.pass(id, lab + ' (' + st.n + ' of ' + st.n + ')');
        },
      };
      return L;
    },
    summary(opts){
      if(done) throw new Error('status.js ' + gate + ': summary() called twice');
      const late = [];
      if(!declared.length) late.push('FAIL status.js: ' + gate + ' declared no rows (S.declare([...]) is required)');
      for(const [id, st] of loops) if(!st.closed) late.push('FAIL ' + id + ' loop row opened and never closed (' + st.n + ' sub-results unprinted)');
      for(const id of declared) if(!printed.has(id) && !(loops.has(id) && !loops.get(id).closed)) late.push('FAIL ' + id + ' declared, no status line (a dark row)');
      for(const id of order) if(printed.get(id) > 1) late.push('FAIL ' + id + ' printed ' + printed.get(id) + ' status lines (one row, one line)');
      for(const id of order) if(!isDeclared.has(id)) late.push('FAIL ' + id + ' printed but never declared');
      for(const l of late){ console.log(l); F++; }
      done = true;
      console.log('INFO ' + gate + ': declared ' + declared.length + ', PASS ' + P + ', FAIL ' + F + ', SKIP ' + SK + ', SCOPED OUT ' + SO);
      console.log('PASS ' + P + ' FAIL ' + F);
      const code = F ? 1 : 0;
      if(!(opts && opts.exit === false)) process.exit(code);
      return { pass: P, fail: F, code };
    },
  };
  return S;
};
module.exports.ID_RE = ID_RE;
