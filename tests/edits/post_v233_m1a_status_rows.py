#!/usr/bin/env python3
# post-V233 slice M1a: the shared status helper and the row manifest tool (CLAUDE.md Proof scope, Version scope and Row
# manifest; Mario, tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Messages 4 and 5, and the coordinator's
# spec change: a manifest hunk no ruling explains is red in both directions; the manifest records arity once|many).
# Tests only: index.html is not touched, ia-version stays 233. Evidence: measure mR
# (tests/measure/v233_rulings/measure_row_status_mR.md, tests/measure/v233_row_status.js).
#   (T-aa) NEW tests/status.js        require('../status')(gate): declare/pass/fail/check/skip/scoped/info/loop/summary
#   (T-ab) NEW tests/rows.js          node tests/rows.js parse | manifest | check
#   (T-ac) NEW tests/skip_allow.txt   header only, no entries
#   (T-ad) tests/tooling_selftest.sh  rows H1-H6 (status.js) and M1-M14 (rows.js); the tools dir now holds seven tools
# Every new file is asserted absent and every anchor asserted count==1 before anything is written; the first miss
# aborts the whole script with nothing written.
import os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(R, *a)
NEW = {}
NEW[P('tests', 'status.js')] = r''''use strict';
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
'''

NEW[P('tests', 'rows.js')] = r''''use strict';
// tests/rows.js: a gate's rows, read off its printed output (post-V233 slice M1a; CLAUDE.md Proof scope, Version scope
// and Row manifest). It reads output files only; it runs no gate and never asks the engine.
//
//   node tests/rows.js parse <gate> <output-file>
//       The gate's rows as (key, status), one `ROW <key> <STATUS> L<line>` per keyed status line, then every status
//       line with no key as `UNKEYED <STATUS> L<line>: <text>`, then one count line. Exit 0 (2 on a usage error).
//   node tests/rows.js manifest <dir> [--run <text>]
//       <dir> holds one output per gate, named <gate>.js.out. Prints the manifest: a generated header naming the run
//       (--run, else the dir), then one `<gate> <key> <arity>` line per (gate, key), sorted (C order): arity `once` when
//       the key printed exactly one status line, `many` when it printed more (a loop row). Gatekeeper writes
//       tests/row_manifest.txt from a proven run with this; builders never edit that file.
//   node tests/rows.js check <manifest> <dir> [--allow <skip_allow.txt>] [--ruled <file>]
//       Prints every red as a FAIL line, then `PASS n FAIL n`; exit 1 on any FAIL, 2 on a refusal. Red:
//         vanished   a manifest key with no status line, unless --ruled has `- <gate> <key>  # ruling`
//         new        a key in the run that the manifest lacks, unless --ruled has `+ <gate> <key>  # ruling`
//         duplicate  an arity-once key printing more than one status line, and
//         arity      an arity-many key printing exactly one, each unless --ruled has `~ <gate> <key>  # ruling`
//         skip       a SKIP or SCOPED OUT status line whose (gate, key) has no --allow entry (an unkeyed one can
//                    never be allowed: convert the gate to tests/status.js)
//         allow      an --allow entry that lacks gate, key or cause, a blanket entry (a wildcard), and a stale entry
//                    (one that matched no SKIP or SCOPED OUT line)
//         ruled      a --ruled line that lacks sign, gate, key or ruling, a blanket line, and a stale line (one that
//                    matches no actual change: a ruling cannot pre-license a row that never appears)
//       Silent: an arity-many key whose count moves between two values above 1 (no hunk, no report).
//       PASS n counts the manifest keys that hold with no ruled line, plus every --allow and --ruled line that matched
//       (a key held by a ruled line counts once, through its line).
//
// File formats (blank lines and lines starting with # are skipped; a gate may be written with or without `.js`):
//   tests/skip_allow.txt   <gate> <key>  # cause           (the cause is the missing input, never a version)
//   --ruled                + <gate> <key>  # ruling         a row the ruling adds
//                          - <gate> <key>  # ruling         a row the ruling removes
//                          ~ <gate> <key>  # ruling         a row the ruling moves between once and many
//
// The status-line grammar (measure mR, tests/measure/v233_rulings/measure_row_status_mR.md; first match wins):
//   blank, and `PASS n FAIL n` summaries                    not status lines
//   PASS ...  /  FAIL ...                at column 0       PASS / FAIL       (tests/status.js prints these)
//   <indent>FAIL ...  (not ` FAIL :: `)                     FAIL
//   <indent><key> <name> ok|FAIL :: ...                     a conjunct sub-line under one row: not a row
//   ok ...  /  pass ...                  at column 0       PASS
//   <indent>ok ...                                          PASS
//   [<indent>]SKIP|RETIRED ... RETIRED ...                  SKIP (keyed; mR counted these 2 g199 lines with no key)
//   [<indent>]SKIP ...                                      SKIP
//   [<indent>]SCOPED OUT ...                                SCOPED OUT
//   [<indent>]INFO | N/A | REFUSED | DEFER ...              tags: not rows (gate.sh grades REFUSED itself)
//   anything else                                           prose: not a status line
// The key is the row's leading id-like token (KEY_RE, mR's): after the status word, and after a leading `row `, 0 to 6
// ASCII letters, a digit, then letters, digits, '.' or '-', followed by ':' or whitespace. tests/status.js ids are a
// strict subset (1 to 6 letters), so its lines parse exactly. A status line with no such token is UNKEYED: it is not
// in the manifest (the known gap: such a row can go dark unseen until its gate is converted to tests/status.js).

const fs = require('fs'), path = require('path');
const KEY_RE = /^([A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*|D\d+[A-Za-z0-9.\-]*)[:\s]/;
const KEY_ONLY = /^[A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*$/;
const GATE_ONLY = /^[A-Za-z0-9_.\-]+$/;
const WILD = /[*?\[\]{}|^$\\]/;

function classify(x){
  if(!x.trim() || /^PASS \d+ FAIL \d+/.test(x)) return null;
  const st = (status, rest) => ({ kind: 'status', status, rest });
  if(/^PASS\b/.test(x)) return st('PASS', x.slice(5));
  if(/^FAIL\b/.test(x)) return st('FAIL', x.slice(5));
  if(/^\s+FAIL\b/.test(x) && !/ FAIL :: /.test(x)) return st('FAIL', x.trim().slice(5));
  if(/^\s+[\w.\-]+ [\w.\-]+ (ok|FAIL) :: /.test(x)) return { kind: 'sub' };
  if(/^(ok|pass)\s/.test(x)) return st('PASS', x.replace(/^(ok|pass)\s+/, ''));
  if(/^\s+ok\b/.test(x)) return st('PASS', x.trim().slice(3).trim());
  if(/^\s*(SKIP|RETIRED)\b/.test(x) && /RETIRED/.test(x)) return st('SKIP', x.trim().replace(/^(SKIP|RETIRED)\b\s*/, ''));
  if(/^\s*SKIP\b/.test(x)) return st('SKIP', x.trim().slice(5));
  if(/^\s*SCOPED OUT\b/.test(x)) return st('SCOPED OUT', x.trim().slice(11));
  const t = x.match(/^\s*(INFO|N\/A|REFUSED|DEFER)/);
  if(t) return { kind: 'tag', tag: t[1] };
  return { kind: 'other' };
}

function parseText(txt){
  const L = txt.split('\n');
  const r = { rows: [], unkeyed: [], sub: 0, tags: {}, other: 0, summary: false };
  L.forEach((x, i) => {
    if(/^PASS \d+ FAIL \d+/.test(x)) r.summary = true;
    const c = classify(x);
    if(!c) return;
    if(c.kind === 'sub'){ r.sub++; return; }
    if(c.kind === 'tag'){ r.tags[c.tag] = (r.tags[c.tag] || 0) + 1; return; }
    if(c.kind === 'other'){ r.other++; return; }
    const m = c.rest.trim().replace(/^row\s+/, '').match(KEY_RE);
    if(m) r.rows.push({ key: m[1], status: c.status, line: i + 1, text: x });
    else r.unkeyed.push({ status: c.status, line: i + 1, text: x });
  });
  r.count = {};
  for(const w of r.rows) r.count[w.key] = (r.count[w.key] || 0) + 1;
  return r;
}
const parseFile = f => parseText(fs.readFileSync(f, 'utf8'));
const gateOf = g => { const b = path.basename(String(g)); return /\.js$/.test(b) ? b : b + '.js'; };
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function readDir(dir){
  const out = new Map();
  for(const f of fs.readdirSync(dir).filter(f => /\.js\.out$/.test(f)).sort(cmp)) out.set(f.replace(/\.out$/, ''), parseFile(path.join(dir, f)));
  return out;
}

function refuse(msg){ console.log('usage: node tests/rows.js parse <gate> <output-file> | manifest <dir> [--run <text>] | check <manifest> <dir> [--allow <file>] [--ruled <file>]'); console.log('REFUSED: ' + msg); process.exit(2); }
function opt(args, name){ const i = args.indexOf(name); if(i < 0) return null; if(i + 1 >= args.length) refuse(name + ' needs a value'); const v = args[i + 1]; args.splice(i, 2); return v; }

function cmdParse(args){
  if(args.length !== 2) refuse('parse takes <gate> <output-file>');
  const [g, f] = args; if(!fs.existsSync(f)) refuse('no output file ' + f);
  const gate = gateOf(g), r = parseFile(f);
  console.log('rows.js parse ' + gate + ': ' + f);
  for(const w of r.rows) console.log('ROW ' + w.key + ' ' + w.status + ' L' + w.line);
  for(const u of r.unkeyed) console.log('UNKEYED ' + u.status + ' L' + u.line + ': ' + u.text.trim().slice(0, 140));
  const keys = Object.keys(r.count), many = keys.filter(k => r.count[k] > 1).length;
  const tags = Object.keys(r.tags).sort(cmp).map(k => k + ' ' + r.tags[k]).join(', ') || 'none';
  console.log('parse ' + gate + ': status lines ' + (r.rows.length + r.unkeyed.length) + ', keyed ' + r.rows.length + ' in ' + keys.length + ' keys (' + many + ' many), unkeyed ' + r.unkeyed.length + ', sub-lines ' + r.sub + ', tags ' + tags + ', summary ' + (r.summary ? 'yes' : 'NO'));
}

function cmdManifest(args){
  const run = opt(args, '--run');
  if(args.length !== 1) refuse('manifest takes <dir> [--run <text>]');
  const dir = args[0]; if(!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) refuse('no dir ' + dir);
  const D = readDir(dir); if(!D.size) refuse('no <gate>.js.out files in ' + dir);
  const lines = []; let lines1 = 0, un = 0, many = 0;
  for(const [g, r] of D){
    for(const k of Object.keys(r.count).sort(cmp)){ const a = r.count[k] > 1 ? 'many' : 'once'; if(a === 'many') many++; lines.push(g + ' ' + k + ' ' + a); }
    lines1 += r.rows.length + r.unkeyed.length; un += r.unkeyed.length;
  }
  console.log('# tests/row_manifest.txt: GENERATED by `node tests/rows.js manifest` from a proven run; never edited by hand (CLAUDE.md Proof scope, Row manifest).');
  console.log('# run: ' + (run || path.resolve(dir)));
  console.log('# gates ' + D.size + ', rows ' + lines.length + ' (' + many + ' many), status lines ' + lines1 + ' (' + un + ' with no id-like key: not rows, not in this file)');
  console.log('# format: <gate> <key> <arity>; once = exactly one status line, many = a loop row printing more than one');
  for(const l of lines) console.log(l);
}

function readEntries(file, kind, red){
  // kind 'allow': <gate> <key>  # cause      kind 'ruled': <+|-|~> <gate> <key>  # ruling
  const out = [];
  fs.readFileSync(file, 'utf8').split('\n').forEach((raw, i) => {
    const l = raw.trim(); if(!l || l[0] === '#') return;
    const at = kind + ' line ' + (i + 1) + ': ' + l;
    const h = l.indexOf('#'); const body = (h < 0 ? l : l.slice(0, h)).trim(); const why = h < 0 ? '' : l.slice(h + 1).trim();
    const f = body.split(/\s+/);
    if(kind === 'ruled' && !/^[+\-~]$/.test(f[0] || '')){ red.push('FAIL ' + at + ' — no sign: a ruled line is `+|-|~ <gate> <key>  # ruling`'); return; }
    const sign = kind === 'ruled' ? f.shift() : null;
    if(f.some(x => WILD.test(x)) || /^(all|any)$/i.test(f[1] || '')){ red.push('FAIL ' + at + ' — blanket entry (a wildcard): name one gate and one row'); return; }
    if(f.length !== 2 || !GATE_ONLY.test(f[0]) || !KEY_ONLY.test(f[1])){ red.push('FAIL ' + at + ' — malformed: needs exactly <gate> <key> (an id-like key) before the #'); return; }
    if(!why){ red.push('FAIL ' + at + ' — no ' + (kind === 'allow' ? 'cause' : 'ruling') + ' after #'); return; }
    out.push({ sign, gate: gateOf(f[0]), key: f[1], why, at, used: 0 });
  });
  return out;
}

function cmdCheck(args){
  const allowF = opt(args, '--allow'), ruledF = opt(args, '--ruled');
  if(args.length !== 2) refuse('check takes <manifest> <dir> [--allow <file>] [--ruled <file>]');
  const [mf, dir] = args;
  for(const f of [mf, allowF, ruledF]) if(f && !fs.existsSync(f)) refuse('no file ' + f);
  if(!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) refuse('no dir ' + dir);
  const M = new Map();   // gate -> Map(key -> arity)
  fs.readFileSync(mf, 'utf8').split('\n').forEach((raw, i) => {
    const l = raw.trim(); if(!l || l[0] === '#') return;
    const m = l.match(/^(\S+) (\S+) (once|many)$/); if(!m) refuse('manifest line ' + (i + 1) + ' is not `<gate> <key> once|many`: ' + l);
    if(!M.has(m[1])) M.set(m[1], new Map());
    if(M.get(m[1]).has(m[2])) refuse('manifest line ' + (i + 1) + ' repeats ' + m[1] + ' ' + m[2]);
    M.get(m[1]).set(m[2], m[3]);
  });
  const D = readDir(dir);
  const red = [], skipRed = []; let P = 0;
  const allow = allowF ? readEntries(allowF, 'allow', red) : [];
  const ruled = ruledF ? readEntries(ruledF, 'ruled', red) : [];
  const findR = (sign, g, k) => ruled.find(e => e.sign === sign && e.gate === g && e.key === k);
  const empty = { count: {}, rows: [], unkeyed: [] };
  for(const g of [...M.keys()].sort(cmp)) if(!D.has(g)) console.log('INFO no output for ' + g + ' in ' + dir + ': its ' + M.get(g).size + ' manifest keys read as vanished');
  for(const [g, keys] of [...M].sort((a, b) => cmp(a[0], b[0]))){
    const r = D.get(g) || empty;
    for(const [k, ar] of keys){
      const n = r.count[k] || 0;
      let bad = null, sign = null;
      if(n === 0){ bad = 'vanished ' + g + ' ' + k + ' — manifest arity ' + ar + ', no status line in the run'; sign = '-'; }
      else if(ar === 'once' && n > 1){ bad = 'duplicate ' + g + ' ' + k + ' — printed ' + n + ' status lines, manifest arity once'; sign = '~'; }
      else if(ar === 'many' && n === 1){ bad = 'arity ' + g + ' ' + k + ' — printed 1 status line, manifest arity many'; sign = '~'; }
      if(!bad){ P++; continue; }
      const e = findR(sign, g, k); if(e) e.used++; else red.push('FAIL ' + bad + ' (no `' + sign + ' ' + g + ' ' + k + '` ruled line)');
    }
  }
  let un = 0, unG = 0;
  for(const [g, r] of D){
    const keys = M.get(g) || new Map();
    for(const k of Object.keys(r.count).sort(cmp)){
      if(keys.has(k)) continue;
      const e = findR('+', g, k); if(e) e.used++;
      else red.push('FAIL new ' + g + ' ' + k + ' — ' + r.count[k] + ' status line(s), not in the manifest (no `+ ' + g + ' ' + k + '` ruled line)');
    }
    for(const w of r.rows) if(w.status === 'SKIP' || w.status === 'SCOPED OUT'){
      const e = allow.find(a => a.gate === g && a.key === w.key);
      if(e) e.used++; else skipRed.push({ g, line: 'FAIL skip ' + g + ' ' + w.key + ' L' + w.line + ' — ' + w.status + ' with no tests/skip_allow.txt entry: ' + w.text.trim().slice(0, 110) });
    }
    for(const u of r.unkeyed) if(u.status === 'SKIP' || u.status === 'SCOPED OUT') skipRed.push({ g, line: 'FAIL skip ' + g + ' (unkeyed) L' + u.line + ' — ' + u.status + ' with no id-like key, so no entry can allow it: ' + u.text.trim().slice(0, 100) });
    if(r.unkeyed.length){ un += r.unkeyed.length; unG++; }
  }
  for(const a of allow){ if(a.used) P++; else red.push('FAIL stale ' + a.at + ' — matched no SKIP or SCOPED OUT line'); }
  for(const e of ruled){ if(e.used) P++; else red.push('FAIL stale ' + e.at + ' — matches no actual change in the run'); }
  for(const l of red) console.log(l);
  for(const s of skipRed) console.log(s.line);
  const byG = {}; for(const s of skipRed) byG[s.g] = (byG[s.g] || 0) + 1;
  if(skipRed.length) console.log('INFO skip reds by gate: ' + Object.keys(byG).sort(cmp).map(g => g + ' ' + byG[g]).join(', '));
  console.log('INFO unkeyed status lines (not rows, outside the manifest): ' + un + ' in ' + unG + ' gates');
  console.log('PASS ' + P + ' FAIL ' + (red.length + skipRed.length));
  process.exit(red.length + skipRed.length ? 1 : 0);
}

if(require.main === module){
  const [cmd, ...args] = process.argv.slice(2);
  if(cmd === 'parse') cmdParse(args);
  else if(cmd === 'manifest') cmdManifest(args);
  else if(cmd === 'check') cmdCheck(args);
  else refuse('unknown command ' + JSON.stringify(cmd || ''));
}
module.exports = { classify, parseText, KEY_RE };
'''

NEW[P('tests', 'skip_allow.txt')] = r'''# tests/skip_allow.txt: the rows allowed to print SKIP or SCOPED OUT at the candidate's version (CLAUDE.md Proof scope,
# Version scope). A row that prints SKIP or SCOPED OUT in gate.sh is red unless a line here names it; read by
# `node tests/rows.js check <manifest> <dir> --allow tests/skip_allow.txt`.
# Format, one row per line:   <gate> <key>  # cause
#   <gate>  the gate file, e.g. g210_equipment_denials.js (the .js may be left off)
#   <key>   the row's key as `node tests/rows.js parse` prints it; a row with no key cannot be listed (convert its gate
#           to tests/status.js first)
#   cause   the missing input that keeps the row from running, never a version
# No blanket entries: no wildcard, one gate and one row per line. An entry that matches no SKIP or SCOPED OUT line is
# stale, and stale is red.
'''

SECTION = r'''# =====================================================================================================================
echo "== status.js and rows.js: toy gates through the helper, then toy outputs (every legacy grammar, a manifest, check)"
# Post-V233 slice M1a (CLAUDE.md Proof scope, Version scope and Row manifest). The toy gates sit in tests/gates/ of a toy
# tree beside a copy of status.js, so they require it as a real gate does: require('../status'). Every expected line
# below is typed from the ruling and the helper's documented line forms, never read back from the tool.
RW="$W/rows"
mkdir -p "$RW/tests/gates"
cp "$T/status.js" "$RW/tests/status.js"
cat > "$RW/tests/gates/st_dark.js" <<'JS'
const S = require('../status')('st_dark');
S.declare(['A1', 'A2', 'A3']);
S.pass('A1', 'first');
S.fail('A2', 'second', 'why');
S.summary();
JS
cat > "$RW/tests/gates/st_twice.js" <<'JS'
const S = require('../status')('st_twice');
S.declare(['A1']);
S.pass('A1', 'once');
S.pass('A1', 'twice');
S.summary();
JS
cat > "$RW/tests/gates/st_loop.js" <<'JS'
const S = require('../status')('st_loop');
S.declare(['L1', 'L2', 'L3', 'S1', 'S2']);
const a = S.loop('L1', 'five subs'); for (const k of ['a', 'b', 'c', 'd', 'e']) a.check(true, k); a.done();
const b = S.loop('L2', 'four subs'); b.check(true, 'a'); b.check(false, 'b', 'x'); b.check(true, 'c'); b.check(false, 'd'); b.done();
const c = S.loop('L3', 'empty loop'); c.done();
S.skip('S1', 'input missing');
S.scoped('S2', 'no candidate pair');
S.summary();
JS
cat > "$RW/tests/gates/st_clean.js" <<'JS'
const S = require('../status')('st_clean');
S.declare(['G1', 'G2.1', 'd194-x']);
S.pass('G1', 'one');
S.check('G2.1', 1 + 1 === 2, 'two');
S.skip('d194-x', 'the input file is missing');
S.summary();
JS
cat > "$RW/tests/gates/st_badid.js" <<'JS'
const S = require('../status')('st_badid');
S.declare(['row q']);
S.pass('row q', 'never printed');
S.summary();
JS
for g in st_dark st_twice st_loop st_clean st_badid; do run "$W/h_$g.out" node "$RW/tests/gates/$g.js"; done
O="$W/h_st_dark.out"
row "H1 status.js: a declared id with no status line is FAIL by name; PASS 1 FAIL 2, exit 1" 'rc_is "$O" 1 && hasX "$O" "PASS A1 first" && hasX "$O" "FAIL A2 second — why" && hasX "$O" "FAIL A3 declared, no status line (a dark row)" && hasX "$O" "PASS 1 FAIL 2"' "$O"
O="$W/h_st_twice.out"
row "H2 status.js: one id printed twice is FAIL by name; PASS 2 FAIL 1, exit 1" 'rc_is "$O" 1 && hasX "$O" "FAIL A1 printed 2 status lines (one row, one line)" && hasX "$O" "PASS 2 FAIL 1"' "$O"
O="$W/h_st_loop.out"
row "H3 status.js: a loop row prints ONE line (n of n; k of n failed with the first failures; a zero-run loop is FAIL)" 'hasX "$O" "PASS L1 five subs (5 of 5)" && hasX "$O" "FAIL L2 four subs — 2 of 4 failed: b (x); d" && hasX "$O" "FAIL L3 empty loop — the loop ran 0 times: no sub-result, a dark row" && [ "$(grep -c " L1 " "$O")" = 1 ] && [ "$(grep -c " L2 " "$O")" = 1 ] && hasX "$O" "PASS 1 FAIL 2" && rc_is "$O" 1' "$O"
row "H4 status.js: SKIP and SCOPED OUT print canonical lines; a clean gate is PASS 2 FAIL 0, exit 0" 'hasX "$W/h_st_loop.out" "SKIP S1 input missing" && hasX "$W/h_st_loop.out" "SCOPED OUT S2 no candidate pair" && rc_is "$W/h_st_clean.out" 0 && hasX "$W/h_st_clean.out" "PASS G1 one" && hasX "$W/h_st_clean.out" "PASS G2.1 two" && hasX "$W/h_st_clean.out" "SKIP d194-x the input file is missing" && hasX "$W/h_st_clean.out" "PASS 2 FAIL 0"' "$W/h_st_clean.out"
O="$W/h_st_badid.out"
row "H5 status.js: an id outside the grammar crashes the gate (exit not 0, no summary)" '! rc_is "$O" 0 && lacks "$O" "^PASS [0-9]+ FAIL [0-9]+" && hasF "$O" "outside the id grammar"' "$O"
run "$W/h_parse.out" node "$T/rows.js" parse st_loop "$W/h_st_loop.out"
printf '%s\n' "ROW L1 PASS L1" "ROW L2 FAIL L2" "ROW L3 FAIL L3" "ROW S1 SKIP L4" "ROW S2 SCOPED OUT L5" > "$W/h_parse.want"
O="$W/h_parse.out"
row "H6 rows.js parse reads the status.js output exactly: five rows, keys and statuses as printed, nothing unkeyed" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/h_parse.want")" ] && lacks "$O" "^UNKEYED" && hasX "$O" "parse st_loop.js: status lines 5, keyed 5 in 5 keys (0 many), unkeyed 0, sub-lines 0, tags INFO 1, summary yes"' "$O"

# rows.js parse on one toy output holding every legacy grammar measure mR found.
cat > "$W/m_legacy.out" <<'OUT'
PASS A1 col0 pass
FAIL A2 col0 fail
  ok   B1 indented ok
  FAIL B2 indented fail
ok   C1 col0 ok
pass  D1 lowercase pass
SKIP E1 skipped, input missing
SCOPED OUT E2 scoped out
SKIP I2c: RETIRED at some point
PASS row d193-k row prefixed
    a4-dedupe a4-dedupe-ver ok :: a sub-line, not a row
INFO an info line
PASS no id-like token here
some prose
PASS 9 FAIL 2
OUT
printf '%s\n' "ROW A1 PASS L1" "ROW A2 FAIL L2" "ROW B1 PASS L3" "ROW B2 FAIL L4" "ROW C1 PASS L5" "ROW D1 PASS L6" "ROW E1 SKIP L7" "ROW E2 SCOPED OUT L8" "ROW I2c SKIP L9" "ROW d193-k PASS L10" > "$W/m_legacy.want"
run "$W/m_parse.out" node "$T/rows.js" parse legacy "$W/m_legacy.out"
O="$W/m_parse.out"
row "M1 rows.js parse: every legacy grammar keyed (col-0 PASS/FAIL, indented ok/FAIL, col-0 ok, pass, SKIP, SCOPED OUT, RETIRED, row prefix); sub-line, INFO and prose are not rows; the id-less line is UNKEYED" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/m_legacy.want")" ] && [ "$(grep -c "^UNKEYED" "$O")" = 1 ] && hasX "$O" "UNKEYED PASS L13: PASS no id-like token here" && hasX "$O" "parse legacy.js: status lines 11, keyed 10 in 10 keys (0 many), unkeyed 1, sub-lines 1, tags INFO 1, summary yes"' "$O"

# A toy run: a.js (A1, A2 once; L1 a loop row; S1 a SKIP) and b.js (B1, B2 indented ok). Each variant is run0 with one
# line added or removed.
mkrun() { mkdir -p "$1"; printf '%s\n' "PASS A1 one" "PASS A2 two" "PASS L1 loop row x" "PASS L1 loop row y" "SKIP S1 input missing" > "$1/a.js.out"; printf '%s\n' "  ok   B1 one" "  ok   B2 two" > "$1/b.js.out"; }
mkrun "$W/run0"
printf '%s\n' "a.js A1 once" "a.js A2 once" "a.js L1 many" "a.js S1 once" "b.js B1 once" "b.js B2 once" > "$W/m_manifest.want"
run "$W/m_manifest.txt" node "$T/rows.js" manifest "$W/run0" --run "toy run0"
O="$W/m_manifest.txt"
row "M2 rows.js manifest: a generated header naming the run, then one sorted <gate> <key> <once|many> line per key" 'rc_is "$O" 0 && [ "$(grep -v "^#" "$O")" = "$(cat "$W/m_manifest.want")" ] && has "$O" "^# .*GENERATED" && hasX "$O" "# run: toy run0"' "$O"
printf '%s\n' "# toy allow file" "a.js S1  # toy: the input file is missing" > "$W/m_allow.txt"
chk() { local out="$1"; shift; run "$out" node "$T/rows.js" check "$W/m_manifest.txt" "$@"; }
chk "$W/m_round.out" "$W/run0" --allow "$W/m_allow.txt"
row "M3 rows.js check: the run against its own manifest, its SKIP allowed: PASS 7 FAIL 0, exit 0" 'rc_is "$W/m_round.out" 0 && hasX "$W/m_round.out" "PASS 7 FAIL 0"' "$W/m_round.out"
mkrun "$W/run1"; grep -v "A2" "$W/run1/a.js.out" > "$W/run1/a.tmp"; mv "$W/run1/a.tmp" "$W/run1/a.js.out"
chk "$W/m_vanish.out" "$W/run1" --allow "$W/m_allow.txt"
row "M4 check: a manifest key with no status line is red as vanished" 'rc_is "$W/m_vanish.out" 1 && has "$W/m_vanish.out" "^FAIL vanished a\.js A2 " && hasX "$W/m_vanish.out" "PASS 6 FAIL 1"' "$W/m_vanish.out"
printf '%s\n' "- a.js A2  # toy ruling: A2 retires" > "$W/m_ruled_rm.txt"
chk "$W/m_vanish_ruled.out" "$W/run1" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_rm.txt"
row "M5 check: the same vanish with a ruled \`- a.js A2\` line passes: PASS 7 FAIL 0, exit 0" 'rc_is "$W/m_vanish_ruled.out" 0 && hasX "$W/m_vanish_ruled.out" "PASS 7 FAIL 0"' "$W/m_vanish_ruled.out"
mkrun "$W/run2"; echo "PASS A1 again" >> "$W/run2/a.js.out"
chk "$W/m_dup.out" "$W/run2" --allow "$W/m_allow.txt"
printf '%s\n' "~ a.js A1  # toy ruling: A1 becomes a loop row" > "$W/m_ruled_ar.txt"
chk "$W/m_dup_ruled.out" "$W/run2" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_ar.txt"
row "M6 check: once -> many unruled (an arity-once key printing twice) is red as a duplicate; with a ruled \`~\` line it passes" 'rc_is "$W/m_dup.out" 1 && has "$W/m_dup.out" "^FAIL duplicate a\.js A1 .* printed 2 status lines, manifest arity once" && rc_is "$W/m_dup_ruled.out" 0 && hasX "$W/m_dup_ruled.out" "PASS 7 FAIL 0"' "$W/m_dup.out"
mkrun "$W/run3"; echo "PASS L1 loop row z" >> "$W/run3/a.js.out"
chk "$W/m_many.out" "$W/run3" --allow "$W/m_allow.txt"
row "M7 check: an arity-many key moving from 2 lines to 3 is silent (no FAIL, no line naming it): PASS 7 FAIL 0" 'rc_is "$W/m_many.out" 0 && hasX "$W/m_many.out" "PASS 7 FAIL 0" && lacks "$W/m_many.out" " L1"' "$W/m_many.out"
mkrun "$W/run4"; grep -v "loop row y" "$W/run4/a.js.out" > "$W/run4/a.tmp"; mv "$W/run4/a.tmp" "$W/run4/a.js.out"
chk "$W/m_once.out" "$W/run4" --allow "$W/m_allow.txt"
row "M8 check: many -> once unruled (a loop row printing one line) is red" 'rc_is "$W/m_once.out" 1 && has "$W/m_once.out" "^FAIL arity a\.js L1 .* printed 1 status line, manifest arity many"' "$W/m_once.out"
chk "$W/m_noallow.out" "$W/run0"
row "M9 check: a SKIP line with no allow entry is red by gate and key" 'rc_is "$W/m_noallow.out" 1 && has "$W/m_noallow.out" "^FAIL skip a\.js S1 L5 .* SKIP with no tests/skip_allow\.txt entry" && hasX "$W/m_noallow.out" "PASS 6 FAIL 1"' "$W/m_noallow.out"
printf '%s\n' "a.js S1  # toy: the input file is missing" "a.js *  # every row" "b.js B1" > "$W/m_allow_bad.txt"
chk "$W/m_blanket.out" "$W/run0" --allow "$W/m_allow_bad.txt"
row "M10 check: a blanket allow entry (wildcard) and an entry with no cause are red" 'rc_is "$W/m_blanket.out" 1 && has "$W/m_blanket.out" "^FAIL allow line 2: a\.js \*  # every row .* blanket entry" && has "$W/m_blanket.out" "^FAIL allow line 3: b\.js B1 .* no cause"' "$W/m_blanket.out"
printf '%s\n' "a.js S1  # toy: the input file is missing" "b.js B2  # toy: nothing skips here" > "$W/m_allow_stale.txt"
chk "$W/m_stale.out" "$W/run0" --allow "$W/m_allow_stale.txt"
row "M11 check: an allow entry that matched no SKIP or SCOPED OUT line is red as stale" 'rc_is "$W/m_stale.out" 1 && has "$W/m_stale.out" "^FAIL stale allow line 2: b\.js B2 .* matched no SKIP or SCOPED OUT line" && hasX "$W/m_stale.out" "PASS 7 FAIL 1"' "$W/m_stale.out"
mkrun "$W/run5"; echo "PASS N1 a new row" >> "$W/run5/b.js.out"
chk "$W/m_new.out" "$W/run5" --allow "$W/m_allow.txt"
row "M12 check: an unruled added key is red as new" 'rc_is "$W/m_new.out" 1 && has "$W/m_new.out" "^FAIL new b\.js N1 " && hasX "$W/m_new.out" "PASS 7 FAIL 1"' "$W/m_new.out"
printf '%s\n' "+ b.js N1  # toy ruling: N1 joins" > "$W/m_ruled_add.txt"
chk "$W/m_new_ruled.out" "$W/run5" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_add.txt"
row "M13 check: the same key with a ruled \`+ b.js N1\` line passes: PASS 8 FAIL 0, exit 0" 'rc_is "$W/m_new_ruled.out" 0 && hasX "$W/m_new_ruled.out" "PASS 8 FAIL 0"' "$W/m_new_ruled.out"
printf '%s\n' "+ b.js N9  # toy: a pre-licence for a row that never prints" "- a.js A1  # toy: a removal that did not happen" > "$W/m_ruled_stale.txt"
chk "$W/m_ruled_stale.out" "$W/run0" --allow "$W/m_allow.txt" --ruled "$W/m_ruled_stale.txt"
row "M14 check: a ruled line that matches no actual change is red as stale (an add that never prints, a removal of a row still printing)" 'rc_is "$W/m_ruled_stale.out" 1 && has "$W/m_ruled_stale.out" "^FAIL stale ruled line 1: \+ b\.js N9 " && has "$W/m_ruled_stale.out" "^FAIL stale ruled line 2: - a\.js A1 " && hasX "$W/m_ruled_stale.out" "PASS 7 FAIL 2"' "$W/m_ruled_stale.out"

'''

Z = P('tests', 'tooling_selftest.sh')
RULE = '# ' + '=' * 117 + '\n'
EDITS = [
    ('holds the five tools under test.', 'holds the seven tools under test.'),
    ('# No real gate runs: gate.sh grades toy gates (it still boots index.html at step 3), sabotage.py trips a toy gate.\n',
     '# No real gate runs: gate.sh grades toy gates (it still boots index.html at step 3), sabotage.py trips a toy gate,\n'
     '# status.js runs inside toy gates and rows.js reads toy outputs (post-V233 slice M1a).\n'),
    ('for f in gate.sh version_scope.js era_bump.py sabotage.py chain.js; do',
     'for f in gate.sh version_scope.js era_bump.py sabotage.py chain.js status.js rows.js; do'),
    (RULE + 'echo "== the repo"\n', SECTION + RULE + 'echo "== the repo"\n'),
]

def die(msg):
    print('ABORT: ' + msg + ' (nothing written)'); sys.exit(1)

for f in NEW:
    if os.path.exists(f): die(f + ' already exists')
z = open(Z, encoding='utf-8').read()
for a, b in EDITS:
    n = z.count(a)
    if n != 1: die('tooling_selftest.sh anchor count %d != 1: %r' % (n, a[:80]))
    z = z.replace(a, b)
for f, s in NEW.items():
    with open(f, 'w', encoding='utf-8') as h: h.write(s)
    print('wrote NEW ' + os.path.relpath(f, R))
with open(Z, 'w', encoding='utf-8') as h: h.write(z)
print('edited tests/tooling_selftest.sh: %d anchors' % len(EDITS))
