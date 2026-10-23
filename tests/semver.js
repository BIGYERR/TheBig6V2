#!/usr/bin/env node
'use strict';
// tests/semver.js: ia-version as MAJOR.MINOR.PATCH, held as three integers (Post-V239, Mario), never one number or a raw string.
// Legacy rule: an integer meta N (every build through V239, every artifact in git history) reads as 0.N.0, so 239 == 0.239.0.
// Compare versions only through cmp: a SemVer refuses <, >=, unary + and v - 1 (it throws), so an unconverted compare is loud.
//
//   const SV = require(path.join(__dirname, '..', 'semver.js'));     // from a gate in tests/gates/
//   SV.cmp(IA.version, 220) >= 0                                     // the 220 era and after; 220 reads as 0.220.0
//   SV.lookup(MANNY_DIGEST_BY_VERSION, IA.version)                   // the row whose key parses equal, else undefined
//
//   node tests/semver.js meta <file.html>   the raw ia-version meta content
//   node tests/semver.js cmp <a> <b>        -1, 0 or 1
//   node tests/semver.js str <v>            canonical M.m.p (239 prints 0.239.0)
//   node tests/semver.js bump <v> <patch|minor|major>
//                                           canonical M.m.p of the bumped version (bump 239 patch prints 0.239.1)
//   node tests/semver.js below <v>          reads versions or tag names on stdin, one per line, and prints the greatest
//                                           one strictly below <v> exactly as written (V239 and v0.239.1 below 0.240.0
//                                           print v0.239.1); a line that does not parse is skipped; of two lines naming
//                                           one version the first wins; exit 1 when none is below <v>
//   node tests/semver.js --selftest         PASS n FAIL n, exit 1 on any FAIL
// Bad CLI input exits 2 with a message.

const BRAND = Symbol.for('ironasylum.semver');
const LEGACY_RE = /^[Vv]?(0|[1-9][0-9]*)$/;
const DOTTED_RE = /^[Vv]?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/;
const META_RE = /<meta name="ia-version" content="([^"]*)"/;

function describe(v){
  try {
    if (typeof v === 'string') return JSON.stringify(v);
    if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
    if (v === null) return 'null';
    if (v === undefined) return 'undefined';
    if (typeof v === 'symbol') return v.toString();
    return typeof v + ' ' + JSON.stringify(v);
  } catch (e) { return typeof v; }
}

function bad(v){ return new TypeError('semver: cannot parse ' + describe(v) + ' as a version (want N, VN, M.m.p or vM.m.p)'); }

function int(s, v){ const n = Number(s); if (!Number.isSafeInteger(n)) throw bad(v); return n; }

class SemVer {
  constructor(major, minor, patch, legacy){
    this.major = major; this.minor = minor; this.patch = patch; this.legacy = legacy;
    Object.freeze(this);
  }
  toString(){
    if (this.major === Infinity) return 'Infinity';
    if (this.major === -Infinity) return '-Infinity';
    return this.legacy ? String(this.minor) : this.major + '.' + this.minor + '.' + this.patch;
  }
  toJSON(){ return this.toString(); }
  [Symbol.toPrimitive](hint){
    if (hint === 'number') throw new TypeError('semver: compare versions with SV.cmp, not a numeric operator (' + this.toString() + ')');
    return this.toString();
  }
}
Object.defineProperty(SemVer.prototype, BRAND, { value: true });
Object.freeze(SemVer.prototype);

const INF = new SemVer(Infinity, Infinity, Infinity, false);
const NINF = new SemVer(-Infinity, -Infinity, -Infinity, false);

function isSemVer(v){ return v instanceof SemVer || (v !== null && typeof v === 'object' && v[BRAND] === true); }

function parse(v){
  if (isSemVer(v)) return v;
  if (typeof v === 'number'){
    if (v === Infinity) return INF;
    if (v === -Infinity) return NINF;
    if (Number.isSafeInteger(v) && v >= 0) return new SemVer(0, v === 0 ? 0 : v, 0, true);
    throw bad(v);
  }
  if (typeof v === 'string'){
    let m = LEGACY_RE.exec(v);
    if (m) return new SemVer(0, int(m[1], v), 0, true);
    m = DOTTED_RE.exec(v);
    if (m) return new SemVer(int(m[1], v), int(m[2], v), int(m[3], v), false);
  }
  throw bad(v);
}

function cmp(a, b){
  const x = parse(a), y = parse(b);
  for (const k of ['major', 'minor', 'patch']){
    if (x[k] < y[k]) return -1;
    if (x[k] > y[k]) return 1;
  }
  return 0;
}

function lookup(table, v){
  if (table === null || typeof table !== 'object') throw new TypeError('semver: lookup wants a table object, got ' + describe(table));
  const want = parse(v);
  let hitKey, hit;
  for (const k of Object.keys(table)){
    let kv;
    try { kv = parse(k); } catch (e) { throw new TypeError('semver: lookup table key ' + JSON.stringify(k) + ' does not parse as a version (' + e.message + ')'); }
    if (cmp(kv, want) !== 0) continue;
    if (hitKey !== undefined) throw new TypeError('semver: lookup table keys ' + JSON.stringify(hitKey) + ' and ' + JSON.stringify(k) + ' name one version (' + str(want) + ')');
    hitKey = k; hit = table[k];
  }
  return hit;
}

function fromHtml(html){
  const m = META_RE.exec(String(html));
  if (!m) throw new Error('semver: no <meta name="ia-version" content="..."> in the html');
  return parse(m[1]);
}

function str(v){
  const x = parse(v);
  if (x.major === Infinity || x.major === -Infinity) return x.toString();
  return x.major + '.' + x.minor + '.' + x.patch;
}

function bump(v, kind){
  const x = parse(v);
  if (x.major === Infinity || x.major === -Infinity) throw new TypeError('semver: cannot bump a range sentinel (' + x + ')');
  if (kind === 'patch') return new SemVer(x.major, x.minor, x.patch + 1, false);
  if (kind === 'minor') return new SemVer(x.major, x.minor + 1, 0, false);
  if (kind === 'major') return new SemVer(x.major + 1, 0, 0, false);
  throw new TypeError('semver: bump kind must be patch, minor or major, got ' + describe(kind));
}

// below: of the lines that parse, the greatest strictly below v, returned exactly as written (undefined when none).
// The previous version of a candidate is the greatest tag strictly below it, never N-1 (design.md, New names).
function below(lines, v){
  const want = parse(v);
  let hit, hitV;
  for (const line of lines){
    let x;
    try { x = parse(line); } catch (e) { continue; }
    if (cmp(x, want) >= 0) continue;
    if (hitV === undefined || cmp(x, hitV) > 0){ hit = line; hitV = x; }
  }
  return hit;
}

// tag: a version as a label prints it (CLAUDE.md, PRIORITY 1). A pre-semver build is V<N> (V239), a dotted version is
// v<M.m.p> (v0.239.1). Display only: never compare or key on it. A value that does not parse prints as 'V' + value,
// exactly what the old `'V' + version` displays printed, so a log line never throws.
function tag(v){
  let x;
  try { x = parse(v); } catch (e) { return 'V' + String(v); }
  if (x.major === Infinity || x.major === -Infinity) return x.toString();
  return x.legacy ? 'V' + x.minor : 'v' + str(x);
}

module.exports = { SemVer, parse, cmp, lookup, fromHtml, str, bump, below, tag, isSemVer };

function selftest(){
  let pass = 0, fail = 0;
  const row = (name, ok, got) => { if (ok){ pass++; console.log('PASS ' + name); } else { fail++; console.log('FAIL ' + name + ' — got ' + got); } };
  const throws = (fn, re) => { try { fn(); return 'no throw'; } catch (e) { return (e instanceof TypeError && (!re || re.test(e.message))) ? true : 'threw ' + e.name + ': ' + e.message; } };
  const shape = (v, M, m, p, L) => { const x = parse(v); return x.major === M && x.minor === m && x.patch === p && x.legacy === L && Object.isFrozen(x); };
  // accepts
  for (const [v, M, m, p, L] of [[239, 0, 239, 0, true], [0, 0, 0, 0, true], ['239', 0, 239, 0, true], ['V239', 0, 239, 0, true], ['v239', 0, 239, 0, true],
    ['0.239.1', 0, 239, 1, false], ['v0.239.1', 0, 239, 1, false], ['V1.0.0', 1, 0, 0, false], ['0.0.0', 0, 0, 0, false], ['10.20.30', 10, 20, 30, false]])
    row('S1 parse ' + describe(v) + ' is ' + M + '.' + m + '.' + p + (L ? ' legacy' : ''), shape(v, M, m, p, L), JSON.stringify(parse(v)));
  row('S2 parse Infinity is the open upper end', parse(Infinity).major === Infinity && parse(Infinity).patch === Infinity, JSON.stringify(parse(Infinity)));
  row('S2 parse -Infinity is the open lower end', parse(-Infinity).major === -Infinity && parse(-Infinity).patch === -Infinity, JSON.stringify(parse(-Infinity)));
  const sv = parse('0.239.1');
  row('S3 parse of a SemVer returns it as is', parse(sv) === sv, 'a copy');
  // rejects
  for (const v of [NaN, null, undefined, '', '1.2', '0.239.1-rc1', -1, '-1', 1.5, '1.5', '0239', '0.0239.0', '1.2.3.4', 'x239', ' 239', '239 ', 'Infinity', true, {}, [239], { major: 0, minor: 239, patch: 0 }])
    row('S4 parse ' + describe(v) + ' throws a TypeError naming the input', throws(() => parse(v), new RegExp('cannot parse ' + describe(v).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))) === true, throws(() => parse(v)));
  // printing
  row('S5 legacy prints its integer: String(239) is "239"', String(parse(239)) === '239' && String(parse('V239')) === '239', String(parse(239)));
  row('S5 semver prints M.m.p', String(parse('v0.239.1')) === '0.239.1', String(parse('v0.239.1')));
  row('S5 toJSON is toString', JSON.stringify({ v: parse(239), w: parse('0.239.1') }) === '{"v":"239","w":"0.239.1"}', JSON.stringify({ v: parse(239), w: parse('0.239.1') }));
  row('S5 str is canonical: 239 gives 0.239.0, v1.2.3 gives 1.2.3', str(239) === '0.239.0' && str('V239') === '0.239.0' && str('v1.2.3') === '1.2.3', str(239) + ' ' + str('v1.2.3'));
  // ordering
  const chain = [-Infinity, 0, 220, '0.239.0', '0.239.1', 'v0.240.0', '1.0.0', '1.0.1', '1.1.0', Infinity];
  let ordered = true;
  for (let i = 0; i < chain.length; i++) for (let j = 0; j < chain.length; j++) { const want = i < j ? -1 : i > j ? 1 : 0; if (cmp(chain[i], chain[j]) !== want) ordered = false; }
  row('S6 cmp orders -Infinity < 0 < 220 < 0.239.0 < 0.239.1 < 0.240.0 < 1.0.0 < 1.0.1 < 1.1.0 < Infinity both ways', ordered, 'a misordered pair');
  row('S6 cmp(239, "0.239.0") is 0: the legacy rule', cmp(239, '0.239.0') === 0 && cmp('V239', 'v0.239.0') === 0, cmp(239, '0.239.0'));
  row('S6 cmp(239, "0.239.1") is -1 and cmp("0.239.1", 240) is -1', cmp(239, '0.239.1') === -1 && cmp('0.239.1', 240) === -1, cmp(239, '0.239.1') + ' ' + cmp('0.239.1', 240));
  row('S6 cmp(10, 9) is 1: components compare as integers, never as text', cmp(10, 9) === 1 && cmp('0.10.0', '0.9.0') === 1 && cmp('0.0.10', '0.0.9') === 1, cmp(10, 9));
  row('S6 cmp of an unparseable side throws', throws(() => cmp('0.239', 239)) === true, throws(() => cmp('0.239', 239)));
  // lookup
  const T = { 200: 'a', 238: 'b', 239: 'c' };
  row('S7 lookup over integer keys: 239, "239" and "0.239.0" all find the [239] row', lookup(T, 239) === 'c' && lookup(T, '239') === 'c' && lookup(T, '0.239.0') === 'c' && lookup(T, parse('V239')) === 'c', lookup(T, '0.239.0'));
  row('S7 lookup of an absent version is undefined: 0.239.1 and 240', lookup(T, '0.239.1') === undefined && lookup(T, 240) === undefined, lookup(T, '0.239.1'));
  const D = { '0.239.0': 'x', '0.239.1': 'y', '1.0.0': 'z' };
  row('S7 lookup over dotted string keys: 239 finds 0.239.0, 0.239.1 and 1.0.0 find their rows', lookup(D, 239) === 'x' && lookup(D, '0.239.1') === 'y' && lookup(D, 'v1.0.0') === 'z', lookup(D, 239));
  row('S7 a table key that does not parse throws (a typo in an era table is loud)', throws(() => lookup({ 239: 'c', '23 9': 'd' }, 239), /does not parse/) === true, throws(() => lookup({ 239: 'c', '23 9': 'd' }, 239)));
  row('S7 two table keys naming one version throw', throws(() => lookup({ 239: 'c', '0.239.0': 'd' }, 239), /name one version/) === true, throws(() => lookup({ 239: 'c', '0.239.0': 'd' }, 239)));
  // toPrimitive
  const v = parse(239), w = parse('0.239.1');
  row('S8 v >= 220 throws', throws(() => v >= 220, /SV\.cmp/) === true, throws(() => v >= 220));
  row('S8 v < w throws', throws(() => v < w, /SV\.cmp/) === true, throws(() => v < w));
  row('S8 unary +v throws', throws(() => +v, /SV\.cmp/) === true, throws(() => +v));
  row('S8 v - 1 throws', throws(() => v - 1, /SV\.cmp/) === true, throws(() => v - 1));
  row('S8 Number(w) throws', throws(() => Number(w), /SV\.cmp/) === true, throws(() => Number(w)));
  row('S8 "x" + v is "x239" and a template prints 0.239.1', ('x' + v) === 'x239' && `${w}` === '0.239.1', 'x' + v);
  const P = { 239: 'c', '0.239.1': 'y' };
  row('S8 a property key reads the toString text: P[v] and P[w]', P[v] === 'c' && P[w] === 'y', P[v] + ' ' + P[w]);
  row('S8 a SemVer is frozen', Object.isFrozen(v) && throws(() => { 'use strict'; v.minor = 240; }) === true, v.minor);
  // fromHtml
  row('S9 fromHtml reads a legacy meta', String(fromHtml('<meta name="ia-version" content="239"><!-- x -->')) === '239' && fromHtml('<meta name="ia-version" content="239">').legacy === true, 'mismatch');
  row('S9 fromHtml reads a dotted meta', str(fromHtml('<head><meta name="ia-version" content="0.239.1"></head>')) === '0.239.1', 'mismatch');
  row('S9 fromHtml throws on an absent meta', (() => { try { fromHtml('<head></head>'); return false; } catch (e) { return /no <meta/.test(e.message); } })(), 'no throw');
  row('S9 fromHtml throws on a meta that does not parse', throws(() => fromHtml('<meta name="ia-version" content="0.239">'), /cannot parse "0\.239"/) === true, throws(() => fromHtml('<meta name="ia-version" content="0.239">')));
  // bump
  row('S10 bump(239, patch) is 0.239.1, non-legacy', str(bump(239, 'patch')) === '0.239.1' && bump(239, 'patch').legacy === false, str(bump(239, 'patch')));
  row('S10 bump(0.239.1, minor) is 0.240.0 and bump(0.239.1, major) is 1.0.0', str(bump('0.239.1', 'minor')) === '0.240.0' && str(bump('0.239.1', 'major')) === '1.0.0', str(bump('0.239.1', 'minor')));
  row('S10 bump with an unknown kind throws', throws(() => bump(239, 'build')) === true, throws(() => bump(239, 'build')));
  // below
  const TAGS = ['V237', 'V238', 'V239', 'v0.239.1', 'v0.240.0', 'junk'];
  for (const [cand, want] of [[239, 'V238'], ['0.239.1', 'V239'], ['0.240.0', 'v0.239.1'], [238, 'V237']])
    row('S11 below ' + cand + ' over V237 V238 V239 v0.239.1 v0.240.0 junk is ' + want, below(TAGS, cand) === want, below(TAGS, cand));
  row('S11 below 237 over the same list is none (undefined)', below(TAGS, 237) === undefined, below(TAGS, 237));
  const SHUF = ['v0.240.0', 'junk', 'V239', 'V237', 'v0.239.1', 'V238'];
  row('S11 below reads every line, not the last: the list shuffled still gives v0.239.1 below 0.240.0', below(SHUF, '0.240.0') === 'v0.239.1', below(SHUF, '0.240.0'));
  row('S11 of two lines naming one version the first wins, as written: V239 before v0.239.0', below(['V239', 'v0.239.0', '239'], '0.239.1') === 'V239', below(['V239', 'v0.239.0', '239'], '0.239.1'));
  row('S11 a line that does not parse is skipped, a padded number too', below([' 238', '238 ', 'V200'], 239) === 'V200', below([' 238', '238 ', 'V200'], 239));
  row('S11 below with a candidate that does not parse throws', throws(() => below(TAGS, '0.239')) === true, throws(() => below(TAGS, '0.239')));
  // CLI
  const cli = (args, input) => require('child_process').spawnSync(process.execPath, [__filename].concat(args), { input: input || '', encoding: 'utf8' });
  const got = r => JSON.stringify([r.status, r.stdout]);
  const LIST = TAGS.join('\n') + '\n';
  let r = cli(['bump', '239', 'patch']);
  row('S12 CLI bump 239 patch prints 0.239.1, exit 0', r.status === 0 && r.stdout === '0.239.1\n', got(r));
  r = cli(['bump', 'v0.239.1', 'minor']);
  row('S12 CLI bump v0.239.1 minor prints 0.240.0', r.status === 0 && r.stdout === '0.240.0\n', got(r));
  r = cli(['bump', '0.239.1', 'major']);
  row('S12 CLI bump 0.239.1 major prints 1.0.0', r.status === 0 && r.stdout === '1.0.0\n', got(r));
  r = cli(['bump', '239', 'build']);
  row('S12 CLI bump with an unknown kind exits 2, nothing on stdout', r.status === 2 && r.stdout === '', got(r));
  r = cli(['below', '0.239.1'], LIST);
  row('S12 CLI below 0.239.1 prints V239 exactly as written, exit 0', r.status === 0 && r.stdout === 'V239\n', got(r));
  r = cli(['below', '0.240.0'], 'V239\r\nv0.239.1\r\n');
  row('S12 CLI below reads CRLF lines: below 0.240.0 prints v0.239.1', r.status === 0 && r.stdout === 'v0.239.1\n', got(r));
  r = cli(['below', '237'], LIST);
  row('S12 CLI below with nothing below exits 1, nothing on stdout', r.status === 1 && r.stdout === '', got(r));
  r = cli(['below', 'junk'], LIST);
  row('S12 CLI below with a candidate that does not parse exits 2, nothing on stdout', r.status === 2 && r.stdout === '', got(r));
  // labels
  row('S13 tag prints a pre-semver build as V<N>: 239, "239" and "V239" give V239', tag(239) === 'V239' && tag('239') === 'V239' && tag('V239') === 'V239', tag(239) + ' ' + tag('V239'));
  row('S13 tag prints a dotted version as v<M.m.p>: "0.239.1", "V0.239.1" and a parsed 0.240.0', tag('0.239.1') === 'v0.239.1' && tag('V0.239.1') === 'v0.239.1' && tag(parse('0.240.0')) === 'v0.240.0', tag('0.239.1') + ' ' + tag('V0.239.1'));
  row('S13 tag never throws: what does not parse prints as V + value, as the old displays did', tag(undefined) === 'Vundefined' && tag(null) === 'Vnull' && tag(NaN) === 'VNaN', tag(undefined) + ' ' + tag(null) + ' ' + tag(NaN));
  console.log('PASS ' + pass + ' FAIL ' + fail);
  return fail ? 1 : 0;
}

if (require.main === module){
  const argv = process.argv.slice(2);
  const usage = () => { console.error('usage: node tests/semver.js meta <file.html> | cmp <a> <b> | str <v> | bump <v> <patch|minor|major> | below <v> | --selftest'); process.exit(2); };
  try {
    if (argv[0] === '--selftest' && argv.length === 1) process.exit(selftest());
    else if (argv[0] === 'meta' && argv.length === 2){
      const html = require('fs').readFileSync(argv[1], 'utf8');
      const m = META_RE.exec(html);
      if (!m){ console.error('semver: no <meta name="ia-version" content="..."> in ' + argv[1]); process.exit(2); }
      console.log(m[1]);
    }
    else if (argv[0] === 'cmp' && argv.length === 3) console.log(String(cmp(argv[1], argv[2])));
    else if (argv[0] === 'str' && argv.length === 2) console.log(str(argv[1]));
    else if (argv[0] === 'bump' && argv.length === 3) console.log(str(bump(argv[1], argv[2])));
    else if (argv[0] === 'below' && argv.length === 2){
      const want = parse(argv[1]);
      const lines = require('fs').readFileSync(0, 'utf8').split('\n').map(l => l.endsWith('\r') ? l.slice(0, -1) : l);
      const hit = below(lines, want);
      if (hit === undefined){ console.error('semver: no version below ' + str(want) + ' on stdin'); process.exit(1); }
      console.log(hit);
    }
    else usage();
  } catch (e) {
    console.error(e.message); process.exit(2);
  }
}
