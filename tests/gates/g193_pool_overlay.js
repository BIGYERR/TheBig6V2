// GATE g193_pool_overlay — V193 D52. UNSCOPED, on purpose.
//
// THE INVARIANT: pool and post-filter must reason about a movement through the same lens.
// A pool built inside an injury branch may not offer a movement that the SAME injury
// plan's applyInjuryFilter removes. When it does, the day draws the name, the overlay
// deletes it (SPINE_SWAP maps some names to null, i.e. delete with no substitute),
// singletonSupersetSweep collapses what is left, and the athlete gets a half-empty card.
// That is exactly what shipped on lowback/protect: the branch offered 'L-sit chinups' and
// its own SPINE_SWAP nulls it, because an L-sit is loaded lumbar flexion.
//
// AND D44's FLOOR: an injury pool must leave at least TWO members standing at every gear
// tier. A one-member pool empties under _slot's _took guard and _slot takes the repeat
// instead of short-drawing, which is how 'Assisted pullups' printed as Main and as Pull
// superset A on the same card. Two is not a new number; it is D44's.
//
// ORACLES, both independent of the engine's own selection:
//   * the pool MEMBERSHIP is read out of the source text of index.html, not from a build.
//   * the gear predicates are a hand table transcribed from the five one-line definitions
//     (_tierHasBarbell, hasCables, hasDumbbells, isCrossfit, and hasGHD from V215 D149). If someone changes a tier
//     definition this table must be edited by hand, deliberately.
//   * survival is asked of applyInjuryFilter itself, which is a DIFFERENT part of the
//     program from the pool literal. Neither side is asserting it equals itself.
//
// Usage: node tests/gates/g193_pool_overlay.js <file.html>
'use strict';
const fs = require('fs');
const path = require('path');
const { load, fixtures } = require(path.join(__dirname, '..', 'harness.js'));

const FILE = process.argv[2] || 'index.html';
const SRC = fs.readFileSync(FILE, 'utf8');
const IA = load(FILE);
const applyInjuryFilter = IA.eval('applyInjuryFilter');

let PASS = 0, FAIL = 0;
const fail = m => { FAIL++; console.log('FAIL ' + m); };
const pass = m => { PASS++; if (process.env.VERBOSE) console.log('  ok ' + m); };

// ── NAMED DEBT. Pre-existing trips live in g193_pool_overlay_debt.txt, which is the §12
// item: each one is printed with its count on every run, so it is counted and visible
// rather than muted, and anything NOT listed is a hard failure. A listed entry that stops
// tripping is ALSO a failure, so the list cannot rot into a permanent excuse.
const DEBT_FILE = path.join(__dirname, 'g193_pool_overlay_debt.txt');
// V215: a line may open with an ia-version predicate, '>=N ' or '<=N ' (standing ruling 4: an entry is
// keyed to the build whose code creates the trip). A line whose predicate does not hold for this
// artifact is not listed for it, so it can neither excuse a trip nor fail as stale on it.
const DEBT = fs.readFileSync(DEBT_FILE, 'utf8').split('\n')
  .map(l => l.trim()).filter(l => l && l[0] !== '#')
  .map(l => { const m = l.match(/^(>=|<=)(\d+)\s+(.*)$/); if (!m) return l;
    const v = +IA.version, n = +m[2]; return (m[1] === '>=' ? v >= n : v <= n) ? m[3] : null; })
  .filter(Boolean);
const DEBT_HIT = Object.create(null);
function isDebt(key){ if (DEBT.indexOf(key) >= 0){ DEBT_HIT[key] = 1; return true; } return false; }

// ── HAND TABLE: gear predicates per tier. Transcribed, not computed. ─────────
const EQUIP = ['bodyweight','minimal','home_basic','home_full','commercial','crossfit'];
const GEAR = {
  bodyweight: { hasBarbell:false, hasCables:false, hasDumbbells:false, isCrossfit:false, hasGHD:false, isBW:true  },
  minimal:    { hasBarbell:false, hasCables:false, hasDumbbells:true,  isCrossfit:false, hasGHD:false, isBW:false },
  home_basic: { hasBarbell:false, hasCables:false, hasDumbbells:true,  isCrossfit:false, hasGHD:false, isBW:false },
  home_full:  { hasBarbell:true,  hasCables:false, hasDumbbells:true,  isCrossfit:false, hasGHD:false, isBW:false },
  commercial: { hasBarbell:true,  hasCables:true,  hasDumbbells:true,  isCrossfit:false, hasGHD:true , isBW:false },
  crossfit:   { hasBarbell:true,  hasCables:false, hasDumbbells:true,  isCrossfit:true,  hasGHD:true , isBW:false },
};

// ── HAND TABLE: the implement a pool member needs, typed from its NAME. Only _gear() and
// _floorPool() consult it, because they are the two pool forms whose output depends on the tier.
// GHD names are a station from ia-version 215 (D149: commercial and crossfit own one). Through 214
// a Glute-ham raise needed the barbell tier and a 45° back extension needed nothing.
const GEAR_VER = +IA.version;
function gearOK(nm, g){
  const n = String(nm).toLowerCase();
  if (/glute[- ]ham|\bghr\b|45° back extension/.test(n))
    return GEAR_VER >= 215 ? g.hasGHD : (/glute[- ]ham|\bghr\b/.test(n) ? g.hasBarbell : true);
  if (/\bbarbell\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/.test(n)) return g.hasBarbell;
  if (/cable|\brope\b|face pull|pulldown|pec deck|\bleg press\b|leg extension|leg curl|hack squat|\bsmith\b|preacher|\bmachine\b/.test(n)) return g.hasCables;
  if (/\bdumbbell|\bdb\b|goblet/.test(n)) return g.hasDumbbells;
  return true;
}

// ── 1. Carve the injury pool-override chain out of the source. ───────────────
const START = SRC.indexOf("if(_R==='knee'){");
if (START < 0) fail('cannot find the injury pool-override chain (anchor "if(_R===\'knee\'){")');
let end = START, depth = 0;
for (let i = START; i < SRC.length; i++){
  const ch = SRC[i];
  if (ch === '{') depth++;
  else if (ch === '}'){ depth--; if (depth === 0){ end = i + 1; if (!/^\s*else/.test(SRC.slice(end, end + 12))) break; } }
}
const CHAIN = SRC.slice(START, end);

// ── 2. Walk it line by line, tracking region and tier, collecting assignments.
// Comments are stripped first: a name inside a comment is prose, not a pool member.
const LINES = CHAIN.split('\n').map(l => l.replace(/\/\/.*$/, ''));
const ASSIGNS = [];   // { region, tier, name, expr, line }
let region = null, tier = null, buf = null;
for (let i = 0; i < LINES.length; i++){
  const raw = LINES[i], t = raw.trim();
  const mr = t.match(/_R==='([a-z]+)'/);        if (mr) region = mr[1];
  const mt = t.match(/_T==='([a-z]+)'/);        if (mt) tier = mt[1];
  else if (/^\}\s*else\s*\{/.test(t) && region) tier = (tier === 'protect') ? 'workaround' : 'protect';
  if (buf){
    buf.expr += ' ' + t;
    if (/;\s*$/.test(t)){ ASSIGNS.push(buf); buf = null; }
    continue;
  }
  const ma = t.match(/^(?:if\([^)]*\)\s*)?([A-Za-z_][A-Za-z0-9_]*Pool)\s*=\s*(.*)$/);
  if (!ma) continue;
  buf = { region, tier, name: ma[1], expr: ma[2], line: i };
  if (/;\s*$/.test(ma[2])){ ASSIGNS.push(buf); buf = null; }
}

// ── 3. Resolve each assignment to a concrete member list per gear tier. ──────
// Only expressions built out of gear predicates, array literals, _gear (filtered by tier), _floorPool
// (V215) and _bw are resolvable. Anything else (a reference to another pool, a .filter on a live value) is
// reported as UNRESOLVED and counted, so a shrinking sweep cannot hide here.
const unresolved = [];
function resolve(expr, equip){
  const g = GEAR[equip];
  const src = expr.replace(/;\s*$/, '');
  // strip string and regex literals before scanning for foreign identifiers
  const skeleton = src.replace(/'[^']*'/g, "''").replace(/"[^"]*"/g, '""')
                      .replace(/\/[^\/\n]+\/[a-z]*/g, 'RX');
  const foreign = (skeleton.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).filter(id =>
    !['hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_floorPool','_bw','filter','test','n','i','indexOf','length','RX','slice'].includes(id));
  if (foreign.length) return null;
  const _gear = a => a.filter(nm => gearOK(nm, g));   // the tier's gear gate (hand table above)
  const _floorPool = (p, min, add) => p.length >= min ? p : p.concat([add]);   // V215 D149: append when short
  const _bw = (bw, other) => (g.isBW ? bw : other);
  try {
    const f = new Function('hasBarbell','hasCables','hasDumbbells','isCrossfit','hasGHD','isBW','_gear','_floorPool','_bw',
      'return (' + src + ');');
    const v = f(g.hasBarbell, g.hasCables, g.hasDumbbells, g.isCrossfit, g.hasGHD, g.isBW, _gear, _floorPool, _bw);
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : null;
  } catch (e){ return null; }
}

// ── 4. Ask the overlay itself whether a name survives. ───────────────────────
const survCache = Object.create(null);
function survives(nm, region, tier){
  const k = region + '|' + tier + '|' + nm;
  if (k in survCache) return survCache[k];
  const cfg = Object.assign({}, fixtures.HALF_MANNY, { seed: 76308, injury: { region, tier } });
  const out = applyInjuryFilter([{ label: 'Probe', items: [{ name: nm, detail: '3×5' }] }], cfg);
  const kept = ((out[0] || {}).items || []).length === 1;
  return (survCache[k] = kept);
}

console.log('FILE ' + FILE + '  ia-version ' + IA.version);
console.log('injury pool assignments found: ' + ASSIGNS.length);

// ── ASSERTION A — SAME LENS. Every named member of an injury-branch pool must
// survive that branch's own overlay. Tier independent: applyInjuryFilter reads
// cfg.injury, never cfg.equipment.
const seenA = Object.create(null);
for (const a of ASSIGNS){
  if (!a.region || !a.tier) continue;
  const names = new Set();
  for (const e of EQUIP){ const r = resolve(a.expr, e); if (r) r.forEach(n => names.add(n)); }
  if (!names.size){
    // The expression is not statically evaluable (it references a live pool, or filters on
    // one). Membership is still knowable for THIS assertion: every quoted name written into
    // the branch is a name the branch can offer, and an in-branch subtraction can only ever
    // remove one, never add one. So scrape the literals and check them anyway. Assertion B
    // still declines to guess a per-tier count for these; they stay in the unresolved list.
    unresolved.push(a.region + '/' + a.tier + ' ' + a.name);
    (a.expr.match(/'[^']*'/g) || []).forEach(q => {
      const nm = q.slice(1, -1);
      if (/[a-z]/i.test(nm) && nm.length > 3) names.add(nm);
    });
    if (!names.size) continue;
  }
  for (const nm of names){
    const k = a.region + '/' + a.tier + ' ' + a.name + ' ' + nm;
    if (seenA[k]) continue; seenA[k] = 1;
    if (survives(nm, a.region, a.tier)){ pass('same-lens ' + k); continue; }
    const dk = 'same-lens ' + a.region + '/' + a.tier + ' ' + a.name + ' ' + nm;
    if (isDebt(dk)) console.log('DEBT ' + dk + '  (pre-existing, see g193_pool_overlay_debt.txt)');
    else fail('same-lens: ' + a.region + '/' + a.tier + ' ' + a.name + " offers '" + nm +
              "' and that same plan's applyInjuryFilter removes it");
  }
}

const thin = Object.create(null);
// ── ASSERTION B — D44's FLOOR. At every gear tier the pool must leave two
// members standing after its own overlay.
for (const a of ASSIGNS){
  if (!a.region || !a.tier) continue;
  for (const e of EQUIP){
    const r = resolve(a.expr, e);
    if (!r) continue;                                   // counted as unresolved above
    const alive = r.filter(nm => survives(nm, a.region, a.tier));
    if (r.length < 2){
      // Authored with fewer than two members. The overlay did not narrow this pool, so it
      // is not the same defect; it is a pool-authoring question D44 did not rule on.
      const dk = 'thin-pool ' + a.region + '/' + a.tier + ' ' + a.name;
      if (isDebt(dk)) thin[dk] = (thin[dk] || 0) + 1;
      else fail('thin-pool: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e +
                ' is authored with ' + r.length + ' member(s) and is not in the debt census');
      continue;
    }
    if (alive.length >= 2) pass('floor ' + a.region + '/' + a.tier + ' ' + a.name + ' ' + e);
    else fail('floor: ' + a.region + '/' + a.tier + ' ' + a.name + ' on ' + e + ' holds ' +
              r.length + ' members and the overlay leaves ' + alive.length +
              ' — below D44\'s floor of two [' + r.join(', ') + ']');
  }
}

// ── ASSERTION C — the D52 literal itself, named, so a rewrite of the parser
// above can never quietly stop testing the case this gate was written for.
const lit = SRC.match(/rowPool = hasCables\?\['Straight-arm pulldown'\]:(\[[^\]]*\])/);
if (!lit) fail('D52: the lowback/protect vertical-pull literal is gone or reshaped');
else {
  const members = JSON.parse(lit[1].replace(/'/g, '"'));
  if (members.indexOf('L-sit chinups') < 0) pass('D52 literal does not name L-sit chinups');
  else fail("D52: the lowback/protect vertical-pull literal names 'L-sit chinups', which " +
            'this same overlay nulls in SPINE_SWAP');
  if (members.length >= 4) pass('D52 literal holds ' + members.length + ' members');
  else fail('D52: the lowback/protect vertical-pull literal holds ' + members.length +
            ' members, under the four its derivation gives');
  if (/\.filter\(n=>backCompoundPool\.indexOf\(n\)<0\)/.test(SRC))
    fail('D52: the whole-pool subtraction of backCompoundPool is back; only the DRAWN ' +
         'backMain may be excluded, and it is excluded at the row-slot draw site');
  else pass('D52 no whole-pool backCompoundPool subtraction');
  if (/const _rowSrc0 = \(_inj&&rowPool!==_preInj\.row\)\?\(rowPool\|\|\[\]\)\.filter\(n=>n!==backMain\)/.test(SRC))
    pass('D52 single-name backMain exclusion present at the row-slot draw site');
  else fail('D52: the single-name backMain exclusion at the row-slot draw site is gone');
}

// ── THE §12 CENSUS, printed every run with its counts.
const thinKeys = Object.keys(thin).sort();
console.log('DEBT census: ' + DEBT.length + ' listed  |  same-lens ' +
  DEBT.filter(d => d.indexOf('same-lens ') === 0).length + '  thin-pool ' +
  DEBT.filter(d => d.indexOf('thin-pool ') === 0).length);
thinKeys.forEach(k => console.log('DEBT ' + k + '  (' + thin[k] + ' gear tiers)'));
for (const d of DEBT){
  if (DEBT_HIT[d]) pass('debt still live: ' + d);
  else fail('stale debt: "' + d + '" is listed in g193_pool_overlay_debt.txt but no longer ' +
            'trips. If it was fixed, delete the line and drop the count in the §12 item.');
}

if (unresolved.length){
  console.log('unresolved assignments (not statically evaluable, NOT counted as passes): ' + unresolved.length);
  unresolved.forEach(u => console.log('   - ' + u));
}
console.log('PASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
