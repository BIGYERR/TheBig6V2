#!/usr/bin/env python3
# post-V233 slice M1b: the row check (CLAUDE.md Proof scope, Version scope and Row manifest; Mario,
# tests/measure/v233_rulings/post_v233_proof_scope_decisions.md Messages 4 and 5 plus the addition; session readings:
# the manifest records arity once|many, an empty loop is a FAIL, N/A and NOT APPLICABLE / DEFER style tags are skip
# statuses needing allow entries, an allow cause naming a version is red).
# Tests only: index.html is not touched, ia-version stays 233.
#   (T-ag) tests/rows.js               fallback keys L:<8 hex> for status lines with no id-like key (label after # in the
#                                      manifest); N/A, NOT APPLICABLE, DEFER and the like are skip statuses; an allow
#                                      cause naming a version is red
#   (T-ah) tests/gate.sh               step 4b row check after grading: rows.js check on the per-gate outputs, ROW_RULED,
#                                      ROW_CHECK_BOOTSTRAP, ROW_MANIFEST_OUT; a red is graded like a red gate
#   (T-ai) tests/gate_times.txt        the stale header line (GATE_TIMES_OUT carries the pool column since A2)
#   (T-aj) tests/tooling_selftest.sh   rows G22-G27 (step 4b) and M15-M18 (fallback keys, skip tags, version causes);
#                                      every earlier gate.sh toy run (gate_run, the heavy and the serial run) sets
#                                      ROW_CHECK_BOOTSTRAP=1, so those toy trees need no row manifest
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script with nothing
# written.
import os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(R, *a)

def die(msg):
    print('ABORT (nothing written): ' + msg); sys.exit(1)

def once(s, old, new, name):
    n = s.count(old)
    if n != 1: die('%s: anchor count %d, want 1' % (name, n))
    return s.replace(old, new)

def between(s, a, b, new, name):
    """Replace s[index(a) : index(b)) (b None = to the end) with new; a and b each count==1."""
    if s.count(a) != 1: die('%s: start anchor count %d, want 1' % (name, s.count(a)))
    i = s.index(a)
    if b is None: j = len(s)
    else:
        if s.count(b) != 1: die('%s: end anchor count %d, want 1' % (name, s.count(b)))
        j = s.index(b)
    if j <= i: die('%s: end anchor before start anchor' % name)
    return s[:i] + new + s[j:]

def after_line(s, marker, block, name):
    """Insert block after the line holding marker (count==1)."""
    if s.count(marker) != 1: die('%s: anchor count %d, want 1' % (name, s.count(marker)))
    i = s.index(marker); j = s.index('\n', i) + 1
    return s[:j] + block + s[j:]

read = lambda p: open(p, encoding='utf-8').read()
OUT = {}

# ======================================================================================================== (T-ag) rows.js
f = P('tests', 'rows.js'); s = read(f)
s = between(s, "'use strict';\n", "const fs = require('fs'), path = require('path');\n", r''''use strict';
// tests/rows.js: a gate's rows, read off its printed output (post-V233 slices M1a and M1b; CLAUDE.md Proof scope,
// Version scope and Row manifest). It reads output files only; it runs no gate and never asks the engine.
//
//   node tests/rows.js parse <gate> <output-file>
//       The gate's rows as (key, status), one `ROW <key> <STATUS> L<line>` per status line with an id-like key, then
//       every status line with no id-like key as `UNKEYED <STATUS> L<line>: <text>`, then one count line; then each
//       UNKEYED line again with its fallback key, `FALLBACK <L:key> <STATUS> L<line>  # <normalized label>`, and one
//       fallback count line. Exit 0 (2 on a usage error or a fallback key collision).
//   node tests/rows.js manifest <dir> [--run <text>]
//       <dir> holds one output per gate, named <gate>.js.out. Prints the manifest: a generated header naming the run
//       (--run, else the dir), then one `<gate> <key> <arity>` line per (gate, key), sorted (C order): arity `once` when
//       the key printed exactly one status line, `many` when it printed more (a loop row). A fallback key's line ends
//       `  # <normalized label>`. Gatekeeper writes tests/row_manifest.txt from a proven run with this (gate.sh writes it
//       to ROW_MANIFEST_OUT); builders never edit that file.
//   node tests/rows.js check <manifest> <dir> [--allow <skip_allow.txt>] [--ruled <file>]
//       Prints every red as a FAIL line, then `PASS n FAIL n`; exit 1 on any FAIL, 2 on a refusal. gate.sh runs it as
//       step 4b. Red:
//         vanished   a manifest key with no status line, unless --ruled has `- <gate> <key>  # ruling`
//         new        a key in the run that the manifest lacks, unless --ruled has `+ <gate> <key>  # ruling`
//         duplicate  an arity-once key printing more than one status line, and
//         arity      an arity-many key printing exactly one, each unless --ruled has `~ <gate> <key>  # ruling`
//         skip       a skip-status line (SKIP_STATUS below: SKIP, SCOPED OUT, N/A, NOT APPLICABLE, DEFER and the like)
//                    whose (gate, key) has no --allow entry
//         allow      an --allow entry that lacks gate, key or cause, a blanket entry (a wildcard), an entry whose cause
//                    names a version (VERSION_CAUSE below: a V-number, a 3-digit build number, ia-version, era), and a
//                    stale entry (one that matched no skip-status line)
//         ruled      a --ruled line that lacks sign, gate, key or ruling, a blanket line, and a stale line (one that
//                    matches no actual change: a ruling cannot pre-license a row that never appears)
//       Silent: an arity-many key whose count moves between two values above 1 (no hunk, no report).
//       PASS n counts the manifest keys that hold with no ruled line, plus every --allow and --ruled line that matched
//       (a key held by a ruled line counts once, through its line).
//
// File formats (blank lines and lines starting with # are skipped; a gate may be written with or without `.js`; a key
// is an id-like key or a fallback key L:<8 hex>):
//   tests/skip_allow.txt   <gate> <key>  # cause           (the cause is the missing input, never a version)
//   --ruled                + <gate> <key>  # ruling         a row the ruling adds
//                          - <gate> <key>  # ruling         a row the ruling removes
//                          ~ <gate> <key>  # ruling         a row the ruling moves between once and many
//   manifest               <gate> <key> once|many[  # <normalized label>]
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
//   [<indent>]N/A | NOT APPLICABLE | DEFER | DEFERRED |     that word, a skip status (post-V233 M1b: N/A and DEFER
//     SKIPPED | NOT RUN ...                                 style tags are skips needing an allow entry)
//   [<indent>]INFO | REFUSED ...                            tags: not rows (gate.sh grades REFUSED itself)
//   anything else                                           prose: not a status line
// The key is the row's leading id-like token (KEY_RE, mR's): after the status word, and after a leading `row `, 0 to 6
// ASCII letters, a digit, then letters, digits, '.' or '-', followed by ':' or whitespace. tests/status.js ids are a
// strict subset (1 to 6 letters), so its lines parse exactly. A status line with no such token is UNKEYED and takes a
// fallback key from its label (below), so every status line is in the manifest. The known gap left: a row born dark
// never prints, so it never enters the manifest.
//
// FALLBACK KEYS (post-V233 M1b). The label is the text after the status word (and after a leading `row `), normalized by
// fallbackLabel() in this order:
//   quoted values  "...", `...`, “...”, and '...' (a ' after a letter or digit is an apostrophe, not a quote)   -> <q>
//   clock values   a date 2026-10-06 (with an optional time), a time 12:34 or 1:02:03.5, an elapsed 3.4 s or 120ms -> <t>
//   digits         every other run of digits, with its decimals                                                -> <n>
//   whitespace     runs collapse to one space; the ends are trimmed
// The key is `L:` and the first 8 hex digits of the label's sha256 (UTF-8): one token, so it sits in the key column of
// the manifest, skip_allow.txt and a ruled file as an id does. Counts, timings, seeds and quoted values move between
// runs without moving the key; a changed word moves it (the old key vanishes and a new one appears: a manifest hunk).
// The status word is not in the label, so a row flipping PASS to FAIL keeps its key, unless its FAIL line prints a
// different label (a legacy gate's detail); that run is red at its gate already. Two different labels with one key in
// one gate is a collision: parse, manifest and check refuse (exit 2) rather than merge them.

''', 'rows.js header')
s = once(s, "const fs = require('fs'), path = require('path');\n",
         "const fs = require('fs'), path = require('path'), crypto = require('crypto');\n", 'rows.js require')
s = once(s, "const KEY_ONLY = /^[A-Za-z]{0,6}[0-9][A-Za-z0-9.\\-]*$/;\n", r'''const KEY_ONLY = /^([A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*|L:[0-9a-f]{8})$/;   // an id-like key or a fallback key
const SKIP_TAG_RE = /^\s*(N\/A|NOT APPLICABLE|DEFERRED|DEFER|SKIPPED|NOT RUN)(?![A-Za-z0-9])/;
const SKIP_STATUS = new Set(['SKIP', 'SCOPED OUT', 'N/A', 'NOT APPLICABLE', 'DEFER', 'DEFERRED', 'SKIPPED', 'NOT RUN']);
const VERSION_CAUSE = /\bV\d+\b|\b\d{3}\b|\bia-version\b|\beras?\b/i;   // a V-number, a 3-digit build number, ia-version, era
''', 'rows.js KEY_ONLY')
s = once(s, r'''  const t = x.match(/^\s*(INFO|N\/A|REFUSED|DEFER)/);
  if(t) return { kind: 'tag', tag: t[1] };
''', r'''  const k = x.match(SKIP_TAG_RE);
  if(k) return st(k[1], x.trim().slice(k[1].length));
  const t = x.match(/^\s*(INFO|REFUSED)/);
  if(t) return { kind: 'tag', tag: t[1] };
''', 'rows.js classify tags')
s = between(s, "function parseText(txt){\n", "function refuse(msg){", r'''function fallbackLabel(rest){
  return String(rest)
    .replace(/"[^"]*"|`[^`]*`|“[^”]*”|(?<![A-Za-z0-9])'[^']*'(?![A-Za-z0-9])/g, '<q>')
    .replace(/(?<![A-Za-z0-9.:])(?:\d{4}-\d{2}-\d{2}(?:[T ]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?|\d{1,2}(?::\d{2}){1,2}(?:\.\d+)?|\d+(?:\.\d+)?\s?(?:ms|s))(?![A-Za-z0-9])/g, '<t>')
    .replace(/\d+(?:\.\d+)?/g, '<n>')
    .replace(/\s+/g, ' ').trim();
}
const fallbackKey = label => 'L:' + crypto.createHash('sha256').update(label, 'utf8').digest('hex').slice(0, 8);

function parseText(txt){
  const L = txt.split('\n');
  const r = { rows: [], unkeyed: [], sub: 0, tags: {}, other: 0, summary: false, labels: Object.create(null), collide: [] };
  L.forEach((x, i) => {
    if(/^PASS \d+ FAIL \d+/.test(x)) r.summary = true;
    const c = classify(x);
    if(!c) return;
    if(c.kind === 'sub'){ r.sub++; return; }
    if(c.kind === 'tag'){ r.tags[c.tag] = (r.tags[c.tag] || 0) + 1; return; }
    if(c.kind === 'other'){ r.other++; return; }
    const rest = c.rest.trim().replace(/^row\s+/, '');
    const m = rest.match(KEY_RE);
    if(m){ r.rows.push({ key: m[1], status: c.status, line: i + 1, text: x }); return; }
    const label = fallbackLabel(rest), key = fallbackKey(label);
    if(!(key in r.labels)) r.labels[key] = label;
    else if(r.labels[key] !== label) r.collide.push(key + ' at L' + (i + 1) + ': ' + JSON.stringify(label) + ' and ' + JSON.stringify(r.labels[key]));
    r.unkeyed.push({ key, label, status: c.status, line: i + 1, text: x });
  });
  const tally = a => { const o = Object.create(null); for(const w of a) o[w.key] = (o[w.key] || 0) + 1; return o; };
  r.count = tally(r.rows);                 // id-like keys
  r.fcount = tally(r.unkeyed);             // fallback keys
  r.all = tally(r.rows.concat(r.unkeyed)); // both: what the manifest and check read
  return r;
}
const parseFile = f => parseText(fs.readFileSync(f, 'utf8'));
const gateOf = g => { const b = path.basename(String(g)); return /\.js$/.test(b) ? b : b + '.js'; };
const cmp = (a, b) => a < b ? -1 : a > b ? 1 : 0;

function readDir(dir){
  const out = new Map();
  for(const f of fs.readdirSync(dir).filter(f => /\.js\.out$/.test(f)).sort(cmp)){
    const r = parseFile(path.join(dir, f));
    if(r.collide.length) refuse('fallback key collision in ' + f + ': ' + r.collide[0]);
    out.set(f.replace(/\.out$/, ''), r);
  }
  return out;
}

''', 'rows.js parseText..readDir')
s = between(s, "function cmdParse(args){\n", None, r'''function cmdParse(args){
  if(args.length !== 2) refuse('parse takes <gate> <output-file>');
  const [g, f] = args; if(!fs.existsSync(f)) refuse('no output file ' + f);
  const gate = gateOf(g), r = parseFile(f);
  console.log('rows.js parse ' + gate + ': ' + f);
  for(const w of r.rows) console.log('ROW ' + w.key + ' ' + w.status + ' L' + w.line);
  for(const u of r.unkeyed) console.log('UNKEYED ' + u.status + ' L' + u.line + ': ' + u.text.trim().slice(0, 140));
  const keys = Object.keys(r.count), many = keys.filter(k => r.count[k] > 1).length;
  const tags = Object.keys(r.tags).sort(cmp).map(k => k + ' ' + r.tags[k]).join(', ') || 'none';
  console.log('parse ' + gate + ': status lines ' + (r.rows.length + r.unkeyed.length) + ', keyed ' + r.rows.length + ' in ' + keys.length + ' keys (' + many + ' many), unkeyed ' + r.unkeyed.length + ', sub-lines ' + r.sub + ', tags ' + tags + ', summary ' + (r.summary ? 'yes' : 'NO'));
  for(const u of r.unkeyed) console.log('FALLBACK ' + u.key + ' ' + u.status + ' L' + u.line + '  # ' + u.label);
  const fk = Object.keys(r.fcount);
  console.log('fallback ' + gate + ': ' + r.unkeyed.length + ' status line(s) with no id-like key, keyed by label in ' + fk.length + ' keys (' + fk.filter(k => r.fcount[k] > 1).length + ' many)');
  if(r.collide.length) refuse('fallback key collision in ' + f + ': ' + r.collide[0]);
}

function cmdManifest(args){
  const run = opt(args, '--run');
  if(args.length !== 1) refuse('manifest takes <dir> [--run <text>]');
  const dir = args[0]; if(!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) refuse('no dir ' + dir);
  const D = readDir(dir); if(!D.size) refuse('no <gate>.js.out files in ' + dir);
  const lines = []; let lines1 = 0, un = 0, many = 0;
  for(const [g, r] of D){
    for(const k of Object.keys(r.all).sort(cmp)){
      const a = r.all[k] > 1 ? 'many' : 'once'; if(a === 'many') many++;
      lines.push(g + ' ' + k + ' ' + a + (k in r.labels ? '  # ' + r.labels[k] : ''));
    }
    lines1 += r.rows.length + r.unkeyed.length; un += r.unkeyed.length;
  }
  console.log('# tests/row_manifest.txt: GENERATED by `node tests/rows.js manifest` from a proven run; never edited by hand (CLAUDE.md Proof scope, Row manifest).');
  console.log('# run: ' + (run || path.resolve(dir)));
  console.log('# gates ' + D.size + ', rows ' + lines.length + ' (' + many + ' many), status lines ' + lines1 + ' (' + un + ' with no id-like key: keyed L:<8 hex> by their normalized label, which follows the #)');
  console.log('# format: <gate> <key> <arity>[  # <normalized label>]; once = exactly one status line, many = a loop row printing more than one; L:<8 hex> is a fallback key (tests/rows.js, FALLBACK KEYS)');
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
    if(f.length !== 2 || !GATE_ONLY.test(f[0]) || !KEY_ONLY.test(f[1])){ red.push('FAIL ' + at + ' — malformed: needs exactly <gate> <key> (an id-like key or L:<8 hex>) before the #'); return; }
    if(!why){ red.push('FAIL ' + at + ' — no ' + (kind === 'allow' ? 'cause' : 'ruling') + ' after #'); return; }
    if(kind === 'allow' && VERSION_CAUSE.test(why)){ red.push('FAIL ' + at + ' — the cause names a version (a V-number, a 3-digit build number, ia-version or era): a cause is the missing input, never a version'); return; }
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
  const M = new Map(), ML = new Map();   // gate -> Map(key -> arity); '<gate> <key>' -> the manifest line's label
  fs.readFileSync(mf, 'utf8').split('\n').forEach((raw, i) => {
    const l = raw.trim(); if(!l || l[0] === '#') return;
    const m = l.match(/^(\S+) (\S+) (once|many)(?:\s+#\s?(.*))?$/); if(!m) refuse('manifest line ' + (i + 1) + ' is not `<gate> <key> once|many[  # <label>]`: ' + l);
    if(!M.has(m[1])) M.set(m[1], new Map());
    if(M.get(m[1]).has(m[2])) refuse('manifest line ' + (i + 1) + ' repeats ' + m[1] + ' ' + m[2]);
    M.get(m[1]).set(m[2], m[3]);
    if(m[4] != null) ML.set(m[1] + ' ' + m[2], m[4]);
  });
  const D = readDir(dir);
  const red = [], skipRed = []; let P = 0;
  const allow = allowF ? readEntries(allowF, 'allow', red) : [];
  const ruled = ruledF ? readEntries(ruledF, 'ruled', red) : [];
  const findR = (sign, g, k) => ruled.find(e => e.sign === sign && e.gate === g && e.key === k);
  const lab = (g, k, r) => { const t = (r && k in r.labels) ? r.labels[k] : ML.get(g + ' ' + k); return t == null ? '' : ' (label: ' + t + ')'; };
  const empty = { all: Object.create(null), rows: [], unkeyed: [], labels: Object.create(null) };
  for(const g of [...M.keys()].sort(cmp)) if(!D.has(g)) console.log('INFO no output for ' + g + ' in ' + dir + ': its ' + M.get(g).size + ' manifest keys read as vanished');
  for(const [g, keys] of [...M].sort((a, b) => cmp(a[0], b[0]))){
    const r = D.get(g) || empty;
    for(const [k, ar] of keys){
      const n = r.all[k] || 0;
      let bad = null, sign = null;
      if(n === 0){ bad = 'vanished ' + g + ' ' + k + ' — manifest arity ' + ar + ', no status line in the run'; sign = '-'; }
      else if(ar === 'once' && n > 1){ bad = 'duplicate ' + g + ' ' + k + ' — printed ' + n + ' status lines, manifest arity once'; sign = '~'; }
      else if(ar === 'many' && n === 1){ bad = 'arity ' + g + ' ' + k + ' — printed 1 status line, manifest arity many'; sign = '~'; }
      if(!bad){ P++; continue; }
      const e = findR(sign, g, k); if(e) e.used++; else red.push('FAIL ' + bad + ' (no `' + sign + ' ' + g + ' ' + k + '` ruled line)' + lab(g, k, n ? r : null));
    }
  }
  let un = 0, unG = 0;
  for(const [g, r] of D){
    const keys = M.get(g) || new Map();
    for(const k of Object.keys(r.all).sort(cmp)){
      if(keys.has(k)) continue;
      const e = findR('+', g, k); if(e) e.used++;
      else red.push('FAIL new ' + g + ' ' + k + ' — ' + r.all[k] + ' status line(s), not in the manifest (no `+ ' + g + ' ' + k + '` ruled line)' + lab(g, k, r));
    }
    for(const w of r.rows.concat(r.unkeyed).sort((a, b) => a.line - b.line)) if(SKIP_STATUS.has(w.status)){
      const e = allow.find(a => a.gate === g && a.key === w.key);
      if(e) e.used++; else skipRed.push({ g, line: 'FAIL skip ' + g + ' ' + w.key + ' L' + w.line + ' — ' + w.status + ' with no tests/skip_allow.txt entry: ' + w.text.trim().slice(0, 110) });
    }
    if(r.unkeyed.length){ un += r.unkeyed.length; unG++; }
  }
  for(const a of allow){ if(a.used) P++; else red.push('FAIL stale ' + a.at + ' — matched no SKIP or SCOPED OUT line (nor any other skip status)'); }
  for(const e of ruled){ if(e.used) P++; else red.push('FAIL stale ' + e.at + ' — matches no actual change in the run'); }
  for(const l of red) console.log(l);
  for(const s of skipRed) console.log(s.line);
  const byG = {}; for(const s of skipRed) byG[s.g] = (byG[s.g] || 0) + 1;
  if(skipRed.length) console.log('INFO skip reds by gate: ' + Object.keys(byG).sort(cmp).map(g => g + ' ' + byG[g]).join(', '));
  console.log('INFO status lines with no id-like key, fallback-keyed by label (L:<8 hex>): ' + un + ' in ' + unG + ' gates');
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
module.exports = { classify, parseText, fallbackLabel, fallbackKey, KEY_RE, SKIP_STATUS, VERSION_CAUSE };
''', 'rows.js cmdParse..end')
OUT[f] = s

# ======================================================================================================== (T-ah) gate.sh
f = P('tests', 'gate.sh'); s = read(f)
s = once(s, "Steps 0, 1, 2 and 3 still stop at once (2b does not)", "Steps 0, 1, 2 and 3 still stop at once (2b and 4b do not)", 'gate.sh stop note')
s = once(s, '''# m counts the version-scope lint (step 2b) with the gates: it is graded like one, and its red is in RED.
if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of $(( ${#GATES[@]} + 1 )): ${RED[*]}"; fi
''', r'''
echo "== 4b. row check (rows.js check: tests/row_manifest.txt, tests/skip_allow.txt${ROW_RULED:+, ROW_RULED $ROW_RULED})"
# Post-V233 M1b (Mario; CLAUDE.md Proof scope, Version scope and Row manifest). rows.js check reads the per-gate outputs
# graded above ($TMP/gateout/<gate>.js.out) against tests/row_manifest.txt, with tests/skip_allow.txt as --allow and,
# when ROW_RULED is set, that file as --ruled. Red: a manifest row with no status line, a row the manifest lacks, an
# arity move, a skip-status line (SKIP, SCOPED OUT, N/A, DEFER and the like) that no allow entry names, and a bad or
# stale allow or ruled line. A red HERE is graded like a red gate: its lines print, `rows.js` joins RED, step 5 still
# runs, and the script exits 1 at the end.
# No tests/row_manifest.txt is red (`row check: no manifest`) unless ROW_CHECK_BOOTSTRAP=1: then a loud BOOTSTRAP line
# prints instead, nothing about rows is checked, and the check is not counted in GATES RED's m. Gatekeeper uses that
# once, to generate the first manifest; with the manifest present ROW_CHECK_BOOTSTRAP is ignored and the check runs.
# ROW_MANIFEST_OUT=<path> writes `rows.js manifest` of these outputs to <path>, its run line naming the candidate, its
# ia-version and the date. gate.sh never writes tests/row_manifest.txt itself (gatekeeper regenerates it from a proven
# run; builders never edit it), so a <path> naming that file is red and nothing is written.
mkdir -p "$TMP/gateout"
rm -f "$TMP/rowcheck.txt" "$TMP/manifest.out"   # delete artifacts before regenerating them
MANI="$HERE/row_manifest.txt"; ROWRED=0; ROWGRADED=1
if [ -f "$MANI" ]; then
  if [ "${ROW_CHECK_BOOTSTRAP:-}" = "1" ]; then echo "   ROW_CHECK_BOOTSTRAP=1 ignored: tests/row_manifest.txt exists, so the check runs"; fi
  RCARGS=(check "$MANI" "$TMP/gateout" --allow "$HERE/skip_allow.txt")
  if [ -n "${ROW_RULED:-}" ]; then RCARGS+=(--ruled "$ROW_RULED"); fi
  RCRC=0; node "$HERE/rows.js" "${RCARGS[@]}" > "$TMP/rowcheck.txt" 2>&1 || RCRC=$?
  RCSUM="$(grep -E '^PASS [0-9]+ FAIL [0-9]+' "$TMP/rowcheck.txt" || true)"
  if [ "$RCRC" = "0" ] && [ -n "$RCSUM" ] && [ "$(echo "$RCSUM" | awk '{print $4}')" = "0" ]; then
    echo "   rows.js check: $RCSUM"
  elif [ -z "$RCSUM" ]; then
    echo "FAIL: row check: rows.js printed no PASS/FAIL summary (a crash or a refusal, exit $RCRC)"; tail -20 "$TMP/rowcheck.txt" || true; ROWRED=1
  else
    echo "FAIL: row check: $RCSUM (exit $RCRC)"; grep -E '^(FAIL|INFO)' "$TMP/rowcheck.txt" || true; ROWRED=1
  fi
elif [ "${ROW_CHECK_BOOTSTRAP:-}" = "1" ]; then
  ROWGRADED=0
  echo "BOOTSTRAP: row check NOT RUN: no tests/row_manifest.txt and ROW_CHECK_BOOTSTRAP=1, so no row of any gate was checked."
  echo "BOOTSTRAP: gatekeeper writes the first tests/row_manifest.txt from this run's ROW_MANIFEST_OUT, then unsets ROW_CHECK_BOOTSTRAP."
else
  echo "FAIL: row check: no manifest: tests/row_manifest.txt is absent (gatekeeper bootstraps it once: ROW_CHECK_BOOTSTRAP=1 ROW_MANIFEST_OUT=<path>)"; ROWRED=1
fi
if [ -n "${ROW_MANIFEST_OUT:-}" ]; then
  MODIR="$(cd "$(dirname "$ROW_MANIFEST_OUT")" 2>/dev/null && pwd -P || true)"
  if [ -z "$MODIR" ]; then
    echo "FAIL: ROW_MANIFEST_OUT: no directory for $ROW_MANIFEST_OUT, nothing written"; ROWRED=1
  elif [ "$MODIR/$(basename "$ROW_MANIFEST_OUT")" = "$(cd "$HERE" && pwd -P)/row_manifest.txt" ]; then
    echo "FAIL: ROW_MANIFEST_OUT names tests/row_manifest.txt: gate.sh never writes it (gatekeeper copies a proven run's manifest there), nothing written"; ROWRED=1
  else
    RMRC=0; node "$HERE/rows.js" manifest "$TMP/gateout" --run "candidate $CAND, ia-version $META, $(date '+%Y-%m-%d %H:%M')" > "$TMP/manifest.out" 2>&1 || RMRC=$?
    if [ "$RMRC" = "0" ] && [ -s "$TMP/manifest.out" ]; then
      cp "$TMP/manifest.out" "$ROW_MANIFEST_OUT"; echo "   row manifest ($(grep -vc '^#' "$TMP/manifest.out" || true) rows) -> $ROW_MANIFEST_OUT"
    else
      echo "FAIL: ROW_MANIFEST_OUT: rows.js manifest exit $RMRC, nothing written"; tail -5 "$TMP/manifest.out" || true; ROWRED=1
    fi
  fi
fi
if [ "$ROWRED" = "1" ]; then RED+=("rows.js"); ROWGRADED=1; fi
# m counts the version-scope lint (step 2b) and the row check (step 4b) with the gates: each is graded like one, and its
# red is in RED. A bootstrapped row check (ROW_CHECK_BOOTSTRAP=1, no manifest) checked nothing, so m leaves it out.
if [ ${#RED[@]} -gt 0 ]; then echo "GATES RED ${#RED[@]} of $(( ${#GATES[@]} + 1 + ROWGRADED )): ${RED[*]}"; fi
''', 'gate.sh step 4b')
s = once(s, '''# Step 5 ran even if step 2b or step 4 was red (its diff is still the blast radius to classify);
# the reds (gates and the version-scope lint) decide the exit code here, and ALL GATES PASS prints only on zero reds.
''', '''# Step 5 ran even if step 2b, step 4 or step 4b was red (its diff is still the blast radius to classify);
# the reds (gates, the version-scope lint and the row check) decide the exit code here, and ALL GATES PASS prints only on
# zero reds.
''', 'gate.sh exit note')
OUT[f] = s

# ================================================================================================= (T-ai) gate_times.txt
f = P('tests', 'gate_times.txt'); s = read(f)
s = once(s, '''# here by hand, not measured: GATE_TIMES_OUT writes seconds only, so a refresh from it carries every pool=<n> over.
''', '''# here by hand, not measured: GATE_TIMES_OUT writes each gate's measured seconds and carries its pool=<n> over from
# this file (post-V233 A2), so a refresh from it keeps every pool column.
''', 'gate_times.txt header')
OUT[f] = s

# =========================================================================================== (T-aj) tooling_selftest.sh
f = P('tests', 'tooling_selftest.sh'); s = read(f)
s = once(s, '''status.js runs inside toy gates and rows.js reads toy outputs (post-V233 slice M1a).
''', '''status.js runs inside toy gates and rows.js reads toy outputs (post-V233 slice M1a); gate.sh step 4b checks toy rows (M1b).
''', 'selftest header')
s = once(s, '''T0="$(date +%s)"
''', '''T0="$(date +%s)"
unset ROW_RULED ROW_MANIFEST_OUT ROW_CHECK_BOOTSTRAP   # gate.sh step 4b reads these: none leaks in from the caller
''', 'selftest unset')
s = once(s, '''gate_run() { # <out> <start log> <gate.sh> <args...>
  local out="$1" log="$2"; shift 2
  run "$out" env PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$log" SELFTEST_REAL_XARGS="$REAL_XARGS" GATE_TIMES_OUT="$out.times" bash "$@"
''', '''gate_run() { # <out> <start log> <gate.sh> <args...>; ROW_CHECK_BOOTSTRAP=1, so a toy tree here needs no row manifest
  local out="$1" log="$2"; shift 2      # (the row check has its own rows, G22 to G27)
  run "$out" env PATH="$W/shim:$PATH" SELFTEST_XARGS_LOG="$log" SELFTEST_REAL_XARGS="$REAL_XARGS" GATE_TIMES_OUT="$out.times" ROW_CHECK_BOOTSTRAP=1 bash "$@"
''', 'selftest gate_run')
s = once(s, '''SELFTEST_CONC="$CD" GATE_TIMES_OUT="$O.times" bash "$GH/tests/gate.sh"''',
         '''SELFTEST_CONC="$CD" GATE_TIMES_OUT="$O.times" ROW_CHECK_BOOTSTRAP=1 bash "$GH/tests/gate.sh"''', 'selftest heavy run')
s = once(s, '''SELFTEST_CONC="$SD" GATE_TIMES_OUT="$O.times" bash "$GS/tests/gate.sh"''',
         '''SELFTEST_CONC="$SD" GATE_TIMES_OUT="$O.times" ROW_CHECK_BOOTSTRAP=1 bash "$GS/tests/gate.sh"''', 'selftest serial run')
s = after_line(s, 'row "G21 grading unchanged at GATE_JOBS=1', r'''
echo "== gate.sh step 4b: the row check on toy gates (manifest present, a vanished row, ROW_RULED, no manifest, BOOTSTRAP, ROW_MANIFEST_OUT)"
# Post-V233 M1b (CLAUDE.md Proof scope, Row manifest). Each toy tree holds rows.js under test and a header-only
# skip_allow.txt; r_a.js prints rows R1 and R2, r_b.js prints B1. Every manifest below is typed here from those lines.
mk_row_tree() { # <root> [manifest lines...]: no lines, no tests/row_manifest.txt
  local root="$1"; shift
  mk_gate_tree "$root"; cp "$T/rows.js" "$root/tests/"
  printf '# toy skip_allow.txt: no entries\n' > "$root/tests/skip_allow.txt"
  printf "console.log('PASS R1 one');\nconsole.log('PASS R2 two');\nconsole.log('PASS 2 FAIL 0');\n" > "$root/tests/gates/r_a.js"
  printf "console.log('  ok   B1 one');\nconsole.log('PASS 1 FAIL 0');\n" > "$root/tests/gates/r_b.js"
  if [ $# -gt 0 ]; then { echo '# toy manifest, typed by hand'; printf '%s\n' "$@"; } > "$root/tests/row_manifest.txt"; fi
}
in_order() { # <file> <fixed strings...>: each first appears on a later line than the one before it
  local f="$1" prev=0 n s; shift
  for s in "$@"; do n="$(grep -nF -m1 -- "$s" "$f" | cut -d: -f1 || true)"; [ -n "$n" ] && [ "$n" -gt "$prev" ] || return 1; prev="$n"; done
}
RM="$W/rows_match"; mk_row_tree "$RM" "r_a.js R1 once" "r_a.js R2 once" "r_b.js B1 once"
run "$W/r_match.out" bash "$RM/tests/gate.sh" "$R/index.html"
O="$W/r_match.out"
row "G22 row check, manifest present and matching: step 4b prints PASS 3 FAIL 0; ALL GATES PASS, exit 0, no GATES RED line" 'rc_is "$O" 0 && has "$O" "^== 4b\. row check" && hasX "$O" "   rows.js check: PASS 3 FAIL 0" && hasX "$O" "ALL GATES PASS" && lacks "$O" "^GATES RED"' "$O"
RV="$W/rows_vanish"; mk_row_tree "$RV" "c_fail.js C1 once" "r_a.js R1 once" "r_a.js R2 once" "r_a.js R3 once" "r_b.js B1 once"
printf "console.log('FAIL C1 toy c row, red on purpose');\nconsole.log('PASS 0 FAIL 1');\n" > "$RV/tests/gates/c_fail.js"
run "$W/r_vanish.out" bash "$RV/tests/gate.sh" "$R/index.html" "$W/base.html"
O="$W/r_vanish.out"
row "G23 a manifest row with no status line (r_a.js R3) is red at step 4b, listed with the gate reds (GATES RED 2 of 5), and step 5 still runs" 'rc_is "$O" 1 && has "$O" "^FAIL vanished r_a\.js R3 " && hasX "$O" "FAIL: row check: PASS 4 FAIL 1 (exit 1)" && hasX "$O" "GATES RED 2 of 5: c_fail.js rows.js" && in_order "$O" "== 4b. row check" "GATES RED 2 of 5" "== 5. blast-radius diff vs base.html" && lacks "$O" "^ALL GATES PASS"' "$O"
printf '%s\n' "- r_a.js R3  # toy ruling: R3 retires" > "$W/r_ruled.txt"
run "$W/r_ruled.out" env ROW_RULED="$W/r_ruled.txt" bash "$RV/tests/gate.sh" "$R/index.html"
O="$W/r_ruled.out"
row "G24 the same run with ROW_RULED explaining the vanish (- r_a.js R3): step 4b passes (PASS 5 FAIL 0), only the toy gate is red (GATES RED 1 of 5)" 'rc_is "$O" 1 && hasX "$O" "   rows.js check: PASS 5 FAIL 0" && hasX "$O" "GATES RED 1 of 5: c_fail.js" && lacks "$O" "^FAIL vanished"' "$O"
RA="$W/rows_absent"; mk_row_tree "$RA"
run "$W/r_absent.out" bash "$RA/tests/gate.sh" "$R/index.html"
O="$W/r_absent.out"
row "G25 no tests/row_manifest.txt: step 4b is red (row check: no manifest), GATES RED 1 of 4: rows.js, exit 1" 'rc_is "$O" 1 && has "$O" "^FAIL: row check: no manifest" && hasX "$O" "GATES RED 1 of 4: rows.js" && lacks "$O" "^ALL GATES PASS" && lacks "$O" "^BOOTSTRAP"' "$O"
run "$W/r_boot.out" env ROW_CHECK_BOOTSTRAP=1 ROW_MANIFEST_OUT="$W/r_boot.manifest" bash "$RA/tests/gate.sh" "$R/index.html"
O="$W/r_boot.out"
row "G26 no manifest with ROW_CHECK_BOOTSTRAP=1: a BOOTSTRAP line instead of the red; no GATES RED line, ALL GATES PASS, exit 0" 'rc_is "$O" 0 && has "$O" "^BOOTSTRAP: row check NOT RUN" && lacks "$O" "row check: no manifest" && lacks "$O" "^GATES RED" && hasX "$O" "ALL GATES PASS"' "$O"
mkdir -p "$W/r_hand"; for g in r_a r_b; do node "$RA/tests/gates/$g.js" > "$W/r_hand/$g.js.out"; done
run "$W/r_hand.manifest" node "$T/rows.js" manifest "$W/r_hand"
printf '%s\n' "r_a.js R1 once" "r_a.js R2 once" "r_b.js B1 once" > "$W/r_boot.want"
row "G27 ROW_MANIFEST_OUT written: the three typed rows, a run line naming the candidate, ia-version $CUR and the date, equal to rows.js manifest of the same outputs (run line aside); no tests/row_manifest.txt written" '[ -s "$W/r_boot.manifest" ] && [ "$(grep -v "^#" "$W/r_boot.manifest")" = "$(cat "$W/r_boot.want")" ] && hasF "$W/r_boot.manifest" "# run: candidate $R/index.html, ia-version $CUR, " && [ "$(grep -v "^# run:" "$W/r_boot.manifest")" = "$(grep -v "^# run:" "$W/r_hand.manifest")" ] && [ ! -e "$RA/tests/row_manifest.txt" ]' "$W/r_boot.manifest"
''', 'selftest G22-G27')
s = after_line(s, 'row "M14 check: a ruled line that matches no actual change', r'''
# Fallback keys (post-V233 M1b): a status line with no id-like key is keyed L:<first 8 hex of sha256(normalized label)>.
# The normalized labels are typed here from the documented masks (quoted -> <q>, clock -> <t>, digits -> <n>), and the
# keys come from python's hashlib on those typed labels, never from rows.js. fb_b is fb_a with every digit, quoted value
# and clock value changed; fb_c is fb_a with one word changed in each of its first two lines.
fb_key() { python3 -c 'import hashlib, sys; print("L:" + hashlib.sha256(sys.argv[1].encode("utf-8")).hexdigest()[:8])' "$1"; }
mkdir -p "$W/fb_a" "$W/fb_b" "$W/fb_c"
printf '%s\n' "PASS cells checked 12 of 12 in 3.4 s at 12:34:56" "  ok the \"mario\" week holds, digest 'ab12'" "FAIL rows differ: 2" "PASS 2 FAIL 1" > "$W/fb_a/fb.js.out"
printf '%s\n' "PASS cells checked 40 of 40 in 17.9 s at 03:01:02" "  ok the \"manny\" week holds, digest 'ff99'" "FAIL rows differ: 7" "PASS 2 FAIL 1" > "$W/fb_b/fb.js.out"
printf '%s\n' "PASS cells counted 12 of 12 in 3.4 s at 12:34:56" "  ok the \"mario\" month holds, digest 'ab12'" "FAIL rows differ: 2" "PASS 2 FAIL 1" > "$W/fb_c/fb.js.out"
FA1="cells checked <n> of <n> in <t> at <t>"; FA2="the <q> week holds, digest <q>"; FA3="rows differ: <n>"
FC1="cells counted <n> of <n> in <t> at <t>"; FC2="the <q> month holds, digest <q>"
KA1="$(fb_key "$FA1")"; KA2="$(fb_key "$FA2")"; KA3="$(fb_key "$FA3")"; KC1="$(fb_key "$FC1")"; KC2="$(fb_key "$FC2")"
printf '%s\n' "FALLBACK $KA1 PASS L1  # $FA1" "FALLBACK $KA2 PASS L2  # $FA2" "FALLBACK $KA3 FAIL L3  # $FA3" > "$W/fb_a.want"
printf '%s\n' "FALLBACK $KC1 PASS L1  # $FC1" "FALLBACK $KC2 PASS L2  # $FC2" "FALLBACK $KA3 FAIL L3  # $FA3" > "$W/fb_c.want"
for v in a b c; do run "$W/fb_parse_$v.out" node "$T/rows.js" parse fb "$W/fb_$v/fb.js.out"; done
row "M15 fallback keys: each id-less status line is keyed L:<8 hex of sha256(its normalized label)>, the same when only digits, quoted values and clock values change, a new key when a word changes" 'rc_is "$W/fb_parse_a.out" 0 && [ "$(grep "^FALLBACK " "$W/fb_parse_a.out")" = "$(cat "$W/fb_a.want")" ] && [ "$(grep "^FALLBACK " "$W/fb_parse_b.out")" = "$(cat "$W/fb_a.want")" ] && [ "$(grep "^FALLBACK " "$W/fb_parse_c.out")" = "$(cat "$W/fb_c.want")" ] && [ "$KA1" != "$KC1" ] && [ "$KA2" != "$KC2" ]' "$W/fb_parse_a.out"
run "$W/fb_manifest.txt" node "$T/rows.js" manifest "$W/fb_a"
printf '%s\n' "fb.js $KA1 once  # $FA1" "fb.js $KA2 once  # $FA2" "fb.js $KA3 once  # $FA3" | LC_ALL=C sort > "$W/fb_manifest.want"
run "$W/fb_check_b.out" node "$T/rows.js" check "$W/fb_manifest.txt" "$W/fb_b"
run "$W/fb_check_c.out" node "$T/rows.js" check "$W/fb_manifest.txt" "$W/fb_c"
row "M16 fallback keys enter the manifest with the label after #; fb_b checks clean against fb_a's manifest (PASS 3 FAIL 0); fb_c is 2 vanished and 2 new (PASS 1 FAIL 4)" 'rc_is "$W/fb_manifest.txt" 0 && [ "$(grep -v "^#" "$W/fb_manifest.txt")" = "$(cat "$W/fb_manifest.want")" ] && rc_is "$W/fb_check_b.out" 0 && hasX "$W/fb_check_b.out" "PASS 3 FAIL 0" && rc_is "$W/fb_check_c.out" 1 && has "$W/fb_check_c.out" "^FAIL vanished fb\.js $KA1 " && has "$W/fb_check_c.out" "^FAIL vanished fb\.js $KA2 " && has "$W/fb_check_c.out" "^FAIL new fb\.js $KC1 " && has "$W/fb_check_c.out" "^FAIL new fb\.js $KC2 " && hasX "$W/fb_check_c.out" "PASS 1 FAIL 4"' "$W/fb_check_c.out"
mkdir -p "$W/na_run"
printf '%s\n' "PASS Q0 one" "N/A Q1 no candidate pair at this config" "NOT APPLICABLE Q2 the input is absent" "  DEFER Q3 waits on the input file" "PASS 1 FAIL 0" > "$W/na_run/na.js.out"
run "$W/na_manifest.txt" node "$T/rows.js" manifest "$W/na_run"
printf '%s\n' "na.js Q0 once" "na.js Q1 once" "na.js Q2 once" "na.js Q3 once" > "$W/na_manifest.want"
run "$W/na_noallow.out" node "$T/rows.js" check "$W/na_manifest.txt" "$W/na_run"
printf '%s\n' "na.js Q1  # toy: no candidate pair" "na.js Q2  # toy: the input file is absent" "na.js Q3  # toy: the input file is absent" > "$W/na_allow.txt"
run "$W/na_allow.out" node "$T/rows.js" check "$W/na_manifest.txt" "$W/na_run" --allow "$W/na_allow.txt"
row "M17 N/A, NOT APPLICABLE and DEFER lines are skip statuses: rows in the manifest, each red by key with no allow entry (PASS 4 FAIL 3), clean when allowed (PASS 7 FAIL 0)" '[ "$(grep -v "^#" "$W/na_manifest.txt")" = "$(cat "$W/na_manifest.want")" ] && rc_is "$W/na_noallow.out" 1 && has "$W/na_noallow.out" "^FAIL skip na\.js Q1 L2 .* N/A with no tests/skip_allow\.txt entry" && has "$W/na_noallow.out" "^FAIL skip na\.js Q2 L3 .* NOT APPLICABLE with no tests/skip_allow\.txt entry" && has "$W/na_noallow.out" "^FAIL skip na\.js Q3 L4 .* DEFER with no tests/skip_allow\.txt entry" && hasX "$W/na_noallow.out" "PASS 4 FAIL 3" && rc_is "$W/na_allow.out" 0 && hasX "$W/na_allow.out" "PASS 7 FAIL 0"' "$W/na_noallow.out"
mkdir -p "$W/vc_run"
printf '%s\n' "SKIP S1 a" "SKIP S2 b" "SKIP S3 c" "SKIP S4 d" "SKIP S5 e" "PASS 0 FAIL 0" > "$W/vc_run/vc.js.out"
run "$W/vc_manifest.txt" node "$T/rows.js" manifest "$W/vc_run"
printf '%s\n' "vc.js S1  # skipped since V233" "vc.js S2  # build 233 has no fixture" "vc.js S3  # the ia-version predates the input" "vc.js S4  # an era row not yet bumped" "vc.js S5  # the input file is missing" > "$W/vc_allow.txt"
run "$W/vc_check.out" node "$T/rows.js" check "$W/vc_manifest.txt" "$W/vc_run" --allow "$W/vc_allow.txt"
row "M18 an allow cause naming a version (V233, the build number 233, ia-version, era) is red by line; the cause naming the missing input is not" 'rc_is "$W/vc_check.out" 1 && hasF "$W/vc_check.out" "FAIL allow line 1: vc.js S1  # skipped since V233 — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 2: vc.js S2  # build 233 has no fixture — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 3: vc.js S3  # the ia-version predates the input — the cause names a version" && hasF "$W/vc_check.out" "FAIL allow line 4: vc.js S4  # an era row not yet bumped — the cause names a version" && lacks "$W/vc_check.out" "allow line 5" && lacks "$W/vc_check.out" "^FAIL skip vc\.js S5 "' "$W/vc_check.out"
''', 'selftest M15-M18')
OUT[f] = s

for p, txt in OUT.items():
    open(p, 'w', encoding='utf-8').write(txt)
    print('wrote ' + os.path.relpath(p, R))
