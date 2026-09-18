// tests/measure/v198_d85_displacement.js — V198 (D85) displacement measure pass.
//
// THE QUESTION. D85 protects the day's last hinge/hip_ext from the session budget. The
// budget still has to reach its cap, so the trim it no longer spends on posterior chain is
// DISPLACED onto something else. This pass says exactly what, by NAME and by TIER, and it
// separates the two lenses that the word "prehab" is read through:
//   - BY SECTION: items inside a hip:true section. That is D47's rail. _protected() returns
//     true for s.hip and for /hip|mobility|stretch/, _secRank() returns -1, and the budget
//     loop skips those sections, so the budget structurally cannot reach them.
//   - BY NAME:    items whose NAME is on the prehab list, wherever they live. Four of those
//     names sit inside 'Leg superset A', a rank-1 accessory section the budget reaches
//     freely.
// The 661-item fall B3 reported is entirely the second lens. The rail did not move. This
// script is what that claim is made of, and it RE-MEASURES every number: nothing below is
// transcribed, so a later version that changes the answer prints the new answer rather than
// agreeing with a stale one.
//
// It also sweeps the five option-2 variants coach considered before ruling option 1, so the
// cost of each is on the record rather than in a chat log.
//
// usage:
//   node tests/measure/v198_d85_displacement.js --base /tmp/base_V197.html
//   node tests/measure/v198_d85_displacement.js --base /tmp/base_V197.html --only=census,rail
//   node tests/measure/v198_d85_displacement.js --base /tmp/base_V197.html --quick
// sections: census (by name x by tier, candidate vs baseline), rail (hip:true equality),
//           knee (knee/protect zero-delta), variants (the five option-2 sweeps A-E).
// runtime:  the full run is seven 288-cell sweeps; budget on a quiet machine accordingly.
//           --quick drops to one seed (96 cells) for a smoke test, and says so on every line.
// This is a MEASURE script. It prints. It never asserts and it never prints PASS/FAIL:
// the claims built on it live in tests/gates/g193_budget_floor.js (B3 D85) and
// tests/gates/g198_posterior_floor.js.
const fs = require('fs'), os = require('os'), path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const { load, fixtures, DAYS } = require(path.join(ROOT, 'tests', 'harness.js'));
const LAT = require(path.join(ROOT, 'tests', 'lattice193.js'));

const argOf = (k, d) => { const p = process.argv.find(a => a.indexOf('--' + k + '=') === 0); if (p) return p.split('=').slice(1).join('='); const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i+1] : d; };
const CAND = path.resolve(argOf('cand', path.join(ROOT, 'index.html')));
const BASE = argOf('base', null) ? path.resolve(argOf('base', null)) : null;
const QUICK = process.argv.indexOf('--quick') >= 0;
const ONLY = String(argOf('only', 'census,rail,knee,variants')).split(',').map(s => s.trim()).filter(Boolean);
const want = s => ONLY.indexOf(s) >= 0;
const EQUIP = LAT.EQUIP;
const SEEDS = QUICK ? LAT.SEEDS_WIDE.slice(0, 1) : LAT.SEEDS_WIDE;
const CELLS = LAT.cells(LAT.INJ_WIDE, EQUIP, LAT.FOCUS_WIDE, LAT.EXPER_WIDE, SEEDS);
const KNEE_CELLS = LAT.cells([{ tag: 'knee/protect', injury: { region: 'knee', tier: 'protect' } }], EQUIP, LAT.FOCUS_WIDE, LAT.EXPER_WIDE, SEEDS);

// THE PREHAB NAME LIST IS THE ONE THE GATE USES. Kept in step with the PREHAB_NAMES list in
// tests/gates/g193_budget_floor.js on purpose: a measure pass that counts a different set
// than the gate it feeds is measuring a different question.
const PREHAB_NAMES = ['Spanish squat hold (KB)', 'Wall sit', 'Terminal knee extension (band)', 'Single-leg wall sit',
  'Dumbbell lateral raise', 'Cable lateral raise', 'Dumbbell front raise', 'Dumbbell rear delt fly',
  'Face pull', 'Prone Y-T-W raises', 'Wall slides'];
// The four names D85's displacement is ruled to be confined to.
const D85_NAMES = ['Spanish squat hold (KB)', 'Terminal knee extension (band)', 'Wall sit', 'Single-leg wall sit'];
const clean = n => String(n || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '').trim();
const isPrehabItem = (secHip, name) => !!secHip || PREHAB_NAMES.indexOf(name) >= 0;
const pad = (v, n) => String(v).padStart(n);

console.log('V198 D85 displacement measure pass');
console.log('  candidate ' + CAND + (BASE ? '\n  baseline  ' + BASE : '\n  baseline  (none supplied: --base is what makes the differential sections run)'));
console.log('  lattice   ' + CELLS.length + ' cells' + (QUICK ? '  *** --quick: ' + SEEDS.length + ' seed, NOT the ruled 288-cell sweep, every number below is a smoke test ***' : ' (the ruled WIDE lattice)'));
console.log('  sections  ' + ONLY.join(', '));

// ── census A: by NAME x by TIER on the SHIPPED program, plus the hip:true rail ──────────
// Shipped means post-budget: this is what the athlete sees, which is the only census a
// floor claim can be made on.
function shippedCensus(file, cells){
  const IA = load(file);
  const R = { file: file, ver: IA.version, cells: cells.length, days: 0, tierName: {}, hip: {}, four: {}, other: {} };
  for (const e of EQUIP){ R.tierName[e] = {}; R.hip[e] = 0; R.four[e] = 0; R.other[e] = 0; }
  for (const c of cells){
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
    for (const wk of Object.keys(prog.weeks || {})) for (const d of DAYS){
      const day = (prog.weeks[wk] || {})[d]; if (!day) continue;
      R.days++;
      for (const s of (day.sections || [])) for (const it of (s.items || [])){
        const n = clean(it.name);
        if (!isPrehabItem(s.hip, n)) continue;
        // hip FIRST: an item inside a protected section is counted on the rail and never
        // on the by-name table, so the two lenses never double-count one item.
        if (s.hip){ R.hip[c.equipment]++; continue; }
        R.tierName[c.equipment][n] = (R.tierName[c.equipment][n] || 0) + 1;
        if (D85_NAMES.indexOf(n) >= 0) R.four[c.equipment]++; else R.other[c.equipment]++;
      }
    }
  }
  return R;
}

// ── census B: what the BUDGET removed, by name and by section label ─────────────────────
// capSessionBudget is wrapped inside the VM so both its argument and its return value are
// visible. The artifact on disk is never written to. Cost model and cap are the documented
// ones, recomputed here rather than read out of the engine, so the over-cap count is an
// independent reading and not the engine agreeing with itself.
const isStretch = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n || '');
const isHalf = n => /carry|wall sit|\bhold\b|plank|pallof|dead bug|bird dog|hang|l-sit|wiper|hollow|clamshell|side steps|side-lying|leg raises/i.test(n || '');
const setCount = d => { const m = String(d || '').match(/(\d+)\s*[×x]/); return m ? Math.max(1, parseInt(m[1], 10)) : 3; };
const costOf = it => { const n = clean(it && it.name); return isStretch(n) ? 0 : (isHalf(n) ? setCount(it && it.detail) * 0.5 : setCount(it && it.detail)); };
const totalOf = secs => (secs || []).reduce((a, s) => a + ((s && s.items) || []).reduce((b, it) => b + costOf(it), 0), 0);

function budgetCensus(file, cells){
  const IA = load(file);
  const capOf = IA.eval('(function(c){return Math.max(12, SESSION_SET_BUDGET - Math.round(_cardioInterference(c)*2));})');
  IA.eval('globalThis.__REC=[]; var __origCap=capSessionBudget; capSessionBudget=function(s,c){'
    + ' var snap=function(a){return (a||[]).map(function(x){return {label:(x&&x.label)||"",hip:!!(x&&x.hip),optional:!!(x&&x.optional),'
    + ' items:(((x&&x.items)||[]).map(function(i){return {name:(i&&i.name)||"",detail:(i&&i.detail)||""};}))};});};'
    + ' var b=snap(s); var o=__origCap(s,c); globalThis.__REC.push({before:b,after:snap(o),cardio:c}); return o;};');
  const R = { file: file, ver: IA.version, cells: cells.length, invocations: 0, engaged: 0,
    removedItems: 0, removedByName: {}, removedByLabel: {}, prehabRemoved: 0,
    emptiedNonOpt: {}, emptiedOpt: 0, overcap: 0, overcapEngaged: 0, overcapSum: 0, overcapMax: 0,
    prehabTier: {} };
  for (const e of EQUIP) R.prehabTier[e] = 0;
  const secKey = s => clean(s.label) || '(nolabel)';
  for (const c of cells){
    IA.eval('globalThis.__REC.length=0;');
    const prog = IA.buildProgram(Object.assign({}, fixtures.HALF_MANNY, c.over));
    const recs = IA.eval('globalThis.__REC');
    for (const rec of recs){
      const cap = capOf(rec.cardio), tb = totalOf(rec.before), ta = totalOf(rec.after);
      R.invocations++;
      if (tb > cap){ R.engaged++; if (ta > cap) R.overcapEngaged++; }
      if (ta > cap){ R.overcap++; R.overcapSum += (ta - cap); if (ta - cap > R.overcapMax) R.overcapMax = ta - cap; }
      const bag = {};
      for (const s of rec.before) for (const it of s.items){ const k = secKey(s) + '||' + clean(it.name); bag[k] = (bag[k] || 0) + 1; }
      for (const s of rec.after)  for (const it of s.items){ const k = secKey(s) + '||' + clean(it.name); bag[k] = (bag[k] || 0) - 1; }
      for (const k of Object.keys(bag)){
        const d = bag[k]; if (d <= 0) continue;
        const parts = k.split('||'), lab = parts[0], nm = parts[1];
        R.removedItems += d;
        R.removedByName[nm] = (R.removedByName[nm] || 0) + d;
        R.removedByLabel[lab] = (R.removedByLabel[lab] || 0) + d;
        if (PREHAB_NAMES.indexOf(nm) >= 0) R.prehabRemoved += d;
      }
      const afterL = {}; for (const s of rec.after) afterL[secKey(s)] = (afterL[secKey(s)] || 0) + 1;
      const beforeL = {}; for (const s of rec.before) if ((s.items || []).length) beforeL[secKey(s)] = (beforeL[secKey(s)] || 0) + 1;
      for (const s of rec.before){
        if (!(s.items || []).length) continue;
        const k = secKey(s);
        if ((beforeL[k] || 0) > (afterL[k] || 0)){ beforeL[k]--; if (s.optional) R.emptiedOpt++; else R.emptiedNonOpt[k] = (R.emptiedNonOpt[k] || 0) + 1; }
      }
    }
    for (const wk of Object.keys(prog.weeks || {})) for (const d of DAYS){
      const day = (prog.weeks[wk] || {})[d]; if (!day) continue;
      for (const s of (day.sections || [])) for (const it of (s.items || []))
        if (isPrehabItem(s.hip, clean(it.name))) R.prehabTier[c.equipment]++;
    }
  }
  return R;
}

// ── 1. the displacement, by name and by tier ────────────────────────────────────────────
let CC = null, BC = null;
if (want('census') || want('rail')){
  CC = shippedCensus(CAND, CELLS);
  if (BASE) BC = shippedCensus(BASE, CELLS);
}
if (want('census')){
  console.log('\n── 1. prehab BY NAME x BY TIER on the shipped program (' + CELLS.length + ' cells, ' + CC.days + ' day-builds) ──');
  const allNames = {};
  for (const e of EQUIP){ for (const n of Object.keys(CC.tierName[e])) allNames[n] = 1; if (BC) for (const n of Object.keys(BC.tierName[e])) allNames[n] = 1; }
  const names = Object.keys(allNames).sort();
  console.log('   ' + 'name'.padEnd(32) + EQUIP.map(e => e.slice(0, 6).padStart(8)).join('') + '     total' + (BC ? '   (v' + BC.ver + ' -> v' + CC.ver + ')' : ''));
  for (const n of names){
    const row = EQUIP.map(e => { const c = CC.tierName[e][n] || 0, b = BC ? (BC.tierName[e][n] || 0) : null; return pad(b === null ? c : (b === c ? String(c) : b + '/' + c), 8); }).join('');
    const ct = EQUIP.reduce((a, e) => a + (CC.tierName[e][n] || 0), 0);
    const bt = BC ? EQUIP.reduce((a, e) => a + (BC.tierName[e][n] || 0), 0) : null;
    console.log('   ' + (D85_NAMES.indexOf(n) >= 0 ? '* ' : '  ') + n.padEnd(30) + row + pad(ct, 10) + (bt === null ? '' : '   ' + (ct - bt >= 0 ? '+' : '') + (ct - bt)));
  }
  console.log('   (* = one of the four names D85 rules the displacement confined to)');
  if (BC){
    console.log('\n   DISPLACEMENT, per tier: the fall on the four ruled names, and the fall on everything else');
    let d4 = 0, dOther = 0;
    for (const e of EQUIP){
      const f = BC.four[e] - CC.four[e], o = BC.other[e] - CC.other[e];
      d4 += f; dOther += o;
      console.log('     ' + e.padEnd(11) + ' four ruled names ' + pad(BC.four[e], 5) + ' -> ' + pad(CC.four[e], 5) + '  fall ' + pad(f, 5) +
        '   |  every other prehab name ' + pad(BC.other[e], 5) + ' -> ' + pad(CC.other[e], 5) + '  fall ' + pad(o, 5));
    }
    console.log('     ' + 'TOTAL'.padEnd(11) + ' four ruled names fall ' + d4 + ', every other prehab name fall ' + dOther +
      '  <- the second number is the one that must be 0. Anything else is a regression outside the licence.');
  }
}

// ── 2. D47's rail: items inside hip:true sections ───────────────────────────────────────
if (want('rail')){
  console.log('\n── 2. D47 rail: items inside hip:true sections (the budget cannot reach these) ──');
  for (const e of EQUIP)
    console.log('     ' + e.padEnd(11) + (BC ? 'v' + BC.ver + ' ' + pad(BC.hip[e], 6) + '  ->  ' : '') + 'v' + CC.ver + ' ' + pad(CC.hip[e], 6) +
      (BC ? '   delta ' + (CC.hip[e] - BC.hip[e] >= 0 ? '+' : '') + (CC.hip[e] - BC.hip[e]) : ''));
  if (BC) console.log('     equal on ' + EQUIP.filter(e => CC.hip[e] === BC.hip[e]).length + '/' + EQUIP.length +
    ' tiers. The rail is what the displacement licence exists to defend; a non-zero delta here is not a licensed displacement at all.');
}

// ── 3. knee/protect: the injury path the four names serve ───────────────────────────────
// The four displaced names are knee prehab. If the fall had landed on the knee/protect
// path, the displacement would be taking work from the athlete it was prescribed for.
if (want('knee')){
  console.log('\n── 3. knee/protect only (' + KNEE_CELLS.length + ' cells) ──');
  const ck = shippedCensus(CAND, KNEE_CELLS), bk = BASE ? shippedCensus(BASE, KNEE_CELLS) : null;
  for (const e of EQUIP)
    console.log('     ' + e.padEnd(11) + ' by-name prehab ' + (bk ? pad(bk.four[e] + bk.other[e], 5) + ' -> ' : '') + pad(ck.four[e] + ck.other[e], 5) +
      '   hip-section items ' + (bk ? pad(bk.hip[e], 5) + ' -> ' : '') + pad(ck.hip[e], 5) +
      (bk ? '   delta ' + ((ck.four[e] + ck.other[e]) - (bk.four[e] + bk.other[e])) + ' / ' + (ck.hip[e] - bk.hip[e]) : ''));
  if (bk) console.log('     knee/protect tiers with any by-name fall: ' +
    EQUIP.filter(e => (ck.four[e] + ck.other[e]) < (bk.four[e] + bk.other[e])).length + '/' + EQUIP.length);
}

// ── 4. the five option-2 variants coach priced before ruling option 1 ───────────────────
// Option 2 was "stop the budget emptying the last item of a residue section". Each variant
// below inserts ONE extra guard immediately after the D85 line in a COPY of the candidate;
// index.html is never written. The anchor is asserted unique before any copy is made, in
// the same style as the edit scripts, so a variant can never be built off a half-matched
// file. A-C were the first pass, D-E the second (D48's boundary and its maximal form).
const VARIANTS = [
  ['A', "        if(_pattern(it.name)===null && _itemRank(it.name)!==2) return;\n",
        'A: nothing the pattern table does not recognise is fodder (protects unpatterned accessories, carries excepted)'],
  ['B', "        if(((s.items||[]).length)<=1) return;\n",
        'B: the last item of ANY section is not fodder (no section may be emptied)'],
  ['C', "        if(_pattern(it.name)===null && _itemRank(it.name)!==2) return;\n        if(((s.items||[]).length)<=1) return;\n",
        'C: A and B together'],
  ['D', "        if(sr===1 && ((s.items||[]).length)<=1) return;\n",
        "D: the last item of a rank-1 residue section is not fodder (D48's boundary)"],
  ['E', "        if(sr===1 && ((s.items||[]).length)<=1) return;\n        if(_postLeft<=1 && sr===1 && /leg|squat|lunge|hinge|posterior/i.test(((s&&s.label)||'')) ) return;\n",
        'E: D plus closing the leg residue once the posterior floor binds (maximal option 2)'],
];
if (want('variants')){
  console.log('\n── 4. option-2 variants: what each one would have cost (' + CELLS.length + ' cells each) ──');
  const RAW = fs.readFileSync(CAND, 'utf8');
  const m = RAW.match(/ *if\(_postLeft<=1 && _isPost\(it\.name\)\) return;[^\n]*\n/g);
  if (!m || m.length !== 1){
    console.log('   D85 anchor is not unique in ' + CAND + ' (count ' + (m ? m.length : 0) + '): no variant can be built, section skipped.');
  } else {
    const A = m[0];
    const rows = [];
    const base = budgetCensus(CAND, CELLS);
    rows.push(['candidate (D85 as shipped)', base]);
    for (const [tag, extra, why] of VARIANTS){
      const tmp = path.join(os.tmpdir(), 'v198_d85_variant_' + tag + '_' + process.pid + '.html');
      fs.writeFileSync(tmp, RAW.replace(A, A + extra));
      console.log('   building ' + tag + ' — ' + why);
      rows.push([tag + ': ' + why, budgetCensus(tmp, CELLS)]);
      fs.unlinkSync(tmp);
    }
    const baseAgg = EQUIP.reduce((a, e) => a + base.prehabTier[e], 0);
    console.log('\n   variant                                   prehabAgg   vs cand   removed   emptiedNonOpt   emptiedOpt   over-cap/invocations   excess   max');
    for (const [label, R] of rows){
      const agg = EQUIP.reduce((a, e) => a + R.prehabTier[e], 0);
      const eno = Object.keys(R.emptiedNonOpt).reduce((a, k) => a + R.emptiedNonOpt[k], 0);
      console.log('   ' + label.slice(0, 40).padEnd(42) + pad(agg, 9) + pad((agg - baseAgg >= 0 ? '+' : '') + (agg - baseAgg), 10) +
        pad(R.removedItems, 10) + pad(eno, 16) + pad(R.emptiedOpt, 13) + pad(R.overcap + '/' + R.invocations, 23) + pad(R.overcapSum, 9) + pad(R.overcapMax, 6));
    }
    console.log('\n   per-tier prehab aggregate');
    for (const [label, R] of rows) console.log('     ' + label.slice(0, 24).padEnd(26) + EQUIP.map(e => e.slice(0, 4) + ' ' + pad(R.prehabTier[e], 5)).join('  '));
    console.log('\n   emptied non-optional classes, per variant');
    for (const [label, R] of rows) console.log('     ' + label.slice(0, 24).padEnd(26) + JSON.stringify(R.emptiedNonOpt));
    console.log('\n   DENOMINATORS, and they are NOT interchangeable:');
    console.log('     over-cap is counted against ALL budget invocations on this lattice (the "/n" column above), and');
    console.log('     separately against the invocations where the budget actually ENGAGED (entered over cap):');
    for (const [label, R] of rows) console.log('     ' + label.slice(0, 24).padEnd(26) + 'engaged ' + pad(R.engaged, 6) + '   ended over cap ' + pad(R.overcapEngaged, 5) +
      '   = ' + (R.engaged ? (100 * R.overcapEngaged / R.engaged).toFixed(2) : '0.00') + '% of engaged trims');
    console.log('     The 4,425 figure in the D85 ruling is a THIRD denominator — the 1,728-cell D85 lattice against the');
    console.log('     interference-adjusted cap — and must never be compared to either column above.');
  }
}
console.log('\nmeasure pass complete' + (QUICK ? ' (--quick: NOT the ruled lattice)' : '') + '.');
