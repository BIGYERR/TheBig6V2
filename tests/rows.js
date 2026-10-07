'use strict';
// tests/rows.js: a gate's rows, read off its printed output (post-V233 slices M1a and M1b; CLAUDE.md Proof scope,
// Version scope and Row manifest). It reads output files only; it runs no gate and never asks the engine.
//
//   node tests/rows.js parse <gate> <output-file>
//       The gate's rows as (key, status), one `ROW <key> <STATUS> L<line>` per status line with an id-like key, then
//       every status line with no id-like key as `UNKEYED <STATUS> L<line>: <text>`, then every tally line (TALLY
//       below: a count line, not a row) as `TALLY <STATUS> L<line>: <text>`, then one count line; then each UNKEYED
//       line again with its fallback key, `FALLBACK <L:key> <STATUS> L<line>  # <normalized label>`, one fallback count
//       line and one tally count line. Exit 0 (2 on a usage error or a fallback key collision).
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
//                    whose (gate, key) has no --allow entry (a tally line is not a row: never red, never allowed)
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
//   [<indent>]<STATUS> <n>[  <COUNT LABEL> <n>]... and no more  TALLY: a count line, not a row (TALLY below)
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
// TALLY (post-V233 F1; the session call on measure mSK). A line holding a status word followed only by counts is a
// gate's closing tally, not a row: `SKIP 0`, `SKIP 3`, `SCOPED OUT 0  SKIP 0  NOT YET BUILT 0`, the same with any
// numbers, with or without blank lines before it. TALLY_RE: optional indent, an upper-case status word (PASS, FAIL,
// SKIP, SCOPED OUT, a skip tag, RETIRED), a whole number, then any number of (a count label of 1 to 3 upper-case words,
// a whole number), and nothing else on the line. parse prints it as TALLY; it is never keyed, never in a manifest and
// never checked, so it is never red and never allowed. This does not loosen the skip rule: a skipped row still prints
// its own SKIP line, with a label or cause, and that line is red without an allow entry. Any other text on a count line
// (a lower-case word, an id, punctuation) keeps it a row.
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

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const KEY_RE = /^([A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*|D\d+[A-Za-z0-9.\-]*)[:\s]/;
const KEY_ONLY = /^([A-Za-z]{0,6}[0-9][A-Za-z0-9.\-]*|L:[0-9a-f]{8})$/;   // an id-like key or a fallback key
const SKIP_TAG_RE = /^\s*(N\/A|NOT APPLICABLE|DEFERRED|DEFER|SKIPPED|NOT RUN)(?![A-Za-z0-9])/;
const SKIP_STATUS = new Set(['SKIP', 'SCOPED OUT', 'N/A', 'NOT APPLICABLE', 'DEFER', 'DEFERRED', 'SKIPPED', 'NOT RUN']);
const TALLY_RE = /^\s*(PASS|FAIL|SKIP|SCOPED OUT|N\/A|NOT APPLICABLE|DEFERRED|DEFER|SKIPPED|NOT RUN|RETIRED)\s+\d+(?:\s+[A-Z][A-Z\/]*(?: [A-Z][A-Z\/]*){0,2}\s+\d+)*\s*$/;   // a count line (TALLY above)
const VERSION_CAUSE = /\bV\d+\b|\b\d{3}\b|\bia-version\b|\beras?\b/i;   // a V-number, a 3-digit build number, ia-version, era
const GATE_ONLY = /^[A-Za-z0-9_.\-]+$/;
const WILD = /[*?\[\]{}|^$\\]/;

function classify(x){
  if(!x.trim() || /^PASS \d+ FAIL \d+/.test(x)) return null;
  const ty = x.match(TALLY_RE);
  if(ty) return { kind: 'tally', status: ty[1] };   // a count line: not a row (TALLY above)
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
  const k = x.match(SKIP_TAG_RE);
  if(k) return st(k[1], x.trim().slice(k[1].length));
  const t = x.match(/^\s*(INFO|REFUSED)/);
  if(t) return { kind: 'tag', tag: t[1] };
  return { kind: 'other' };
}

function fallbackLabel(rest){
  return String(rest)
    .replace(/"[^"]*"|`[^`]*`|“[^”]*”|(?<![A-Za-z0-9])'[^']*'(?![A-Za-z0-9])/g, '<q>')
    .replace(/(?<![A-Za-z0-9.:])(?:\d{4}-\d{2}-\d{2}(?:[T ]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+\-]\d{2}:?\d{2})?)?|\d{1,2}(?::\d{2}){1,2}(?:\.\d+)?|\d+(?:\.\d+)?\s?(?:ms|s))(?![A-Za-z0-9])/g, '<t>')
    .replace(/\d+(?:\.\d+)?/g, '<n>')
    .replace(/\s+/g, ' ').trim();
}
const fallbackKey = label => 'L:' + crypto.createHash('sha256').update(label, 'utf8').digest('hex').slice(0, 8);

function parseText(txt){
  const L = txt.split('\n');
  const r = { rows: [], unkeyed: [], tallies: [], sub: 0, tags: {}, other: 0, summary: false, labels: Object.create(null), collide: [] };
  L.forEach((x, i) => {
    if(/^PASS \d+ FAIL \d+/.test(x)) r.summary = true;
    const c = classify(x);
    if(!c) return;
    if(c.kind === 'tally'){ r.tallies.push({ status: c.status, line: i + 1, text: x }); return; }
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

function refuse(msg){ console.log('usage: node tests/rows.js parse <gate> <output-file> | manifest <dir> [--run <text>] | check <manifest> <dir> [--allow <file>] [--ruled <file>]'); console.log('REFUSED: ' + msg); process.exit(2); }
function opt(args, name){ const i = args.indexOf(name); if(i < 0) return null; if(i + 1 >= args.length) refuse(name + ' needs a value'); const v = args[i + 1]; args.splice(i, 2); return v; }

function cmdParse(args){
  if(args.length !== 2) refuse('parse takes <gate> <output-file>');
  const [g, f] = args; if(!fs.existsSync(f)) refuse('no output file ' + f);
  const gate = gateOf(g), r = parseFile(f);
  console.log('rows.js parse ' + gate + ': ' + f);
  for(const w of r.rows) console.log('ROW ' + w.key + ' ' + w.status + ' L' + w.line);
  for(const u of r.unkeyed) console.log('UNKEYED ' + u.status + ' L' + u.line + ': ' + u.text.trim().slice(0, 140));
  for(const t of r.tallies) console.log('TALLY ' + t.status + ' L' + t.line + ': ' + t.text.trim().slice(0, 140));
  const keys = Object.keys(r.count), many = keys.filter(k => r.count[k] > 1).length;
  const tags = Object.keys(r.tags).sort(cmp).map(k => k + ' ' + r.tags[k]).join(', ') || 'none';
  console.log('parse ' + gate + ': status lines ' + (r.rows.length + r.unkeyed.length) + ', keyed ' + r.rows.length + ' in ' + keys.length + ' keys (' + many + ' many), unkeyed ' + r.unkeyed.length + ', sub-lines ' + r.sub + ', tags ' + tags + ', summary ' + (r.summary ? 'yes' : 'NO'));
  for(const u of r.unkeyed) console.log('FALLBACK ' + u.key + ' ' + u.status + ' L' + u.line + '  # ' + u.label);
  const fk = Object.keys(r.fcount);
  console.log('fallback ' + gate + ': ' + r.unkeyed.length + ' status line(s) with no id-like key, keyed by label in ' + fk.length + ' keys (' + fk.filter(k => r.fcount[k] > 1).length + ' many)');
  console.log('tally ' + gate + ': ' + r.tallies.length + ' count line(s) read as tallies (a status word followed only by counts): not rows, never keyed or checked');
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
  let un = 0, unG = 0, ta = 0, taG = 0;
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
    if(r.tallies.length){ ta += r.tallies.length; taG++; }
  }
  for(const a of allow){ if(a.used) P++; else red.push('FAIL stale ' + a.at + ' — matched no SKIP or SCOPED OUT line (nor any other skip status)'); }
  for(const e of ruled){ if(e.used) P++; else red.push('FAIL stale ' + e.at + ' — matches no actual change in the run'); }
  for(const l of red) console.log(l);
  for(const s of skipRed) console.log(s.line);
  const byG = {}; for(const s of skipRed) byG[s.g] = (byG[s.g] || 0) + 1;
  if(skipRed.length) console.log('INFO skip reds by gate: ' + Object.keys(byG).sort(cmp).map(g => g + ' ' + byG[g]).join(', '));
  console.log('INFO status lines with no id-like key, fallback-keyed by label (L:<8 hex>): ' + un + ' in ' + unG + ' gates');
  console.log('INFO tally lines (a status word followed only by counts), not rows, never keyed or checked: ' + ta + ' in ' + taG + ' gates');
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
