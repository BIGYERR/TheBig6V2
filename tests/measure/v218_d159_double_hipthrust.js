// v218_d159_double_hipthrust.js — MEASURE (before-picture) for D159, base V216 (3dc0146).
//   node tests/measure/v218_d159_double_hipthrust.js <base.html> [--v214 <v214.html>] [--wide] [--cf <cfA.html> <cfB.html>]
// Question: how often does one day print the same movement name twice, on which tier / injury /
// section pair, and which draw sites put the two copies there.
// ORACLE: a day's card is its own oracle. A name is a duplicate iff the cleaned, lowercased item
// name appears on >=2 items of that day's live sections. No engine function is asked.
// Lattices:
//   G   = g215_d149_ghd.js LAT_G, copied verbatim (the "D149 lattice" the queued 21 was read on)
//   W   = tiers(6) x injury(healthy + 6 regions x 2 tiers = 13) x foci(7) x exp(3) x seeds(4) x rests(2),
//         goal rotates over 6 run goals by index.
'use strict';
const path = require('path');
const { load, progDigest, DAYS, weekGrid } = require(path.join(__dirname, '..', 'harness.js'));
const argv = process.argv.slice(2);
const BASE = argv[0];
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const WIDE = argv.includes('--wide');
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);

// ── g215 LAT_G, verbatim ──
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
const TIERS5 = ['commercial','crossfit','home_full','home_basic','bodyweight'];
function mk(eq, gi, f, exp, age, si, inj){
  const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
const LAT_G = [];
for(const eq of TIERS5) for(let si = 0; si < SEEDS.length; si++){
  FOC.forEach((f, fi) => LAT_G.push({ eq, inj:null, f, cfg: mk(eq, si + fi, f, EXPS[(si + fi) % 3], AGES[(si + 2 * fi) % 3], si, null) }));
  REG.forEach((r, ri) => ITIER.forEach((t, ti) => LAT_G.push({ eq, inj:{ region:r, tier:t }, f:FOC[(si + ri + ti) % 7],
    cfg: mk(eq, si + ri, FOC[(si + ri + ti) % 7], EXPS[(si + ri) % 3], AGES[(si + ti) % 3], si, { region:r, tier:t }) })));
}
// ── wide lattice ──
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const LAT_W = [];
if(WIDE) for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj);
  c.restDays = RESTS[ri].slice();
  LAT_W.push({ eq, inj, f, cfg: c });
})))));

function scan(IA, lat){
  const R = { builds:0, crash:0, crashEx:[], dayN:0, dupDays:0, dupItems:0, cfgHit:new Set(), byTier:{}, byInj:{}, byPair:{}, byName:{}, byFocus:{}, byTitle:{},
    byClass:{}, byClassCell:{}, byClassTier:{}, byClassInj:{}, byClassWeek:{}, htByWeek:{}, htByFocus:{}, htDays:0, htCfg:new Set(), htByTierInj:{}, ex:[], htEx:[], denByTierInj:{} };
  lat.forEach((x, li) => {
    let p; try { p = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))); } catch(e){ R.crash++; if(R.crashEx.length < 3) R.crashEx.push(x.eq + ' ' + JSON.stringify(x.inj) + ' ' + e.message); return; }
    R.builds++;
    const ik = x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy';
    Object.keys(p.weeks).forEach(w => DAYS.forEach(d => {
      const day = p.weeks[w][d]; const L = live(day); if(!L.length) return;
      R.dayN++; bump(R.denByTierInj, x.eq + ' ' + ik);
      const where = {};
      L.forEach(s => s.items.forEach(it => { const k = clean(it.name).toLowerCase(); if(!k) return; (where[k] = where[k] || []).push(stem(s)); }));
      const dups = Object.keys(where).filter(k => where[k].length >= 2);
      if(!dups.length) return;
      R.dupDays++; R.cfgHit.add(li);
      bump(R.byTier, x.eq); bump(R.byInj, ik); bump(R.byFocus, x.f); bump(R.byTitle, String(day.title || '').replace(/\s*\(.*$/, ''));
      dups.forEach(k => { R.dupItems++; const pr = where[k].slice().sort().join(' + '); bump(R.byPair, pr); bump(R.byName, k); bump(R.byClass, k + ' @ ' + pr); bump(R.byClassCell, k + ' @ ' + pr + ' | ' + x.eq + ' ' + ik + ' | ' + x.f); bump(R.byClassTier, k + ' | ' + x.eq); bump(R.byClassInj, k + ' | ' + ik); bump(R.byClassWeek, k + ' | W' + w); });
      if(R.ex.length < 6) R.ex.push({ li, eq:x.eq, ik, f:x.f, seed:x.cfg.seed, w, d, title:day.title, dups:dups.map(k => k + ' @ ' + where[k].join(' + ')) });
      if(dups.some(k => /single-leg hip thrust/.test(k))){ R.htDays++; R.htCfg.add(li); bump(R.htByTierInj, x.eq + ' ' + ik); bump(R.htByWeek, 'W' + w + ' ' + d); bump(R.htByFocus, x.f + ' ' + x.cfg.experience + ' seed ' + x.cfg.seed + ' rest ' + x.cfg.restDays.join('/'));
        if(R.htEx.length < 3) R.htEx.push({ li, eq:x.eq, ik, f:x.f, seed:x.cfg.seed, w, d }); }
    }));
  });
  return R;
}
const top = (o, n = 40) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v + '  ' + k).join('\n');
function report(tag, R, lat){
  console.log(`\n=== ${tag}: ${lat.length} configs, ${R.builds} built, ${R.crash} crashed ${R.crashEx.join(' | ')}`);
  console.log(`  lift days scanned ${R.dayN}; days with a same-day duplicate name ${R.dupDays}; duplicate names ${R.dupItems}; configs hit ${R.cfgHit.size}/${R.builds}`);
  console.log(`  "single-leg hip thrust" twice: days ${R.htDays}, configs ${R.htCfg.size}`);
  console.log('  hip thrust by tier+injury:\n' + top(R.htByTierInj));
  console.log('  hip thrust by week/day:\n' + top(R.htByWeek));
  console.log('  hip thrust by focus/exp/seed/rest:\n' + top(R.htByFocus));
  console.log('  dup days by tier:\n' + top(R.byTier));
  console.log('  dup days by injury:\n' + top(R.byInj));
  console.log('  dup days by focus:\n' + top(R.byFocus));
  console.log('  dup days by day title:\n' + top(R.byTitle));
  console.log('  dup names by section pair:\n' + top(R.byPair));
  console.log('  dup names by name:\n' + top(R.byName));
  console.log('  dup CLASS (name @ section pair):\n' + top(R.byClass));
  console.log('  dup CLASS x tier:\n' + top(R.byClassTier, 40));
  console.log('  dup CLASS x injury:\n' + top(R.byClassInj, 60));
  console.log('  dup CLASS x week:\n' + top(R.byClassWeek, 80));
  console.log('  dup CLASS by cell (name @ pair | tier injury | focus):\n' + top(R.byClassCell, 80));
  console.log('  examples: ' + R.ex.map(e => JSON.stringify(e)).join('\n    '));
  return R;
}
function dayCard(IA, cfg, w, d){
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg))); const day = p.weeks[w][d];
  console.log(`  W${w} ${d} "${day.title}"`);
  live(day).forEach(s => console.log(`    [${s.label}]${s.superset ? ' (superset)' : ''} ` + s.items.map(i => clean(i.name) + ' :: ' + i.detail).join(' | ')));
}

const IA = load(BASE);
const PINS = ['0ac7da6b1691a8e1', '1069cd7f86eed204', '9d14801a63111081'];
function mannyArms(file){
  const fs = require('fs'), os = require('os');
  const X = load(file); const H = () => JSON.parse(JSON.stringify(X.fixtures.HALF_MANNY));
  const plain = progDigest(X.buildProgram(H())); const again = progDigest(X.buildProgram(H()));
  X.eval('globalThis.__DELOAD_OFF=true;'); const dOff = progDigest(X.buildProgram(H())); X.eval('globalThis.__DELOAD_OFF=false;');
  const RAW = fs.readFileSync(file, 'utf8'); const CL = "  if(_auxFamily(name)==='core') return 0;\n"; const n = RAW.split(CL).length - 1;
  let cOff = 'CLAUSE count ' + n;
  if(n === 1){ const tmp = path.join(os.tmpdir(), 'v218_coreoff_' + process.pid + '.html'); fs.writeFileSync(tmp, RAW.replace(CL, '')); cOff = progDigest(load(tmp).buildProgram(H())); fs.rmSync(tmp); }
  const got = [plain, dOff, cOff];
  console.log('  HALF_MANNY arms ' + path.basename(file) + ' (self-stable ' + (plain === again) + '): plain ' + plain + ' | deload_off ' + dOff + ' | core_off ' + cOff + ' | vs pins ' + got.map((g, i) => g === PINS[i] ? 'EQ' : 'MOVED').join('/'));
}
mannyArms(BASE);
console.log('base ia-version', IA.version);
const t0 = Date.now();
const RG = report('BASE V' + IA.version + ' LAT_G (g215 D149 lattice)', scan(IA, LAT_G), LAT_G);
console.log('  ms/build', ((Date.now() - t0) / LAT_G.length).toFixed(1));
// REPRO: first home_basic ankle/protect hip-thrust day
const rep = RG.htEx.find(e => e.eq === 'home_basic' && e.ik === 'ankle/protect') || RG.htEx[0];
{ const lens = IA.eval('_gearLens')('home_basic'); const la = IA.EXLIB.leg_accessory; const g = la.filter(lens);
  console.log('\nPROBE leg_accessory on home_basic via _gearLens: ' + g.length + '/' + la.length + ' legal: ' + g.join(', ')); }
if(rep){ const x = LAT_G[rep.li]; console.log('\nREPRO cfg ' + JSON.stringify(x.cfg)); dayCard(IA, x.cfg, rep.w, rep.d); }
if(opt('--v214')){ const I4 = load(opt('--v214')); report('V' + I4.version + ' LAT_G', scan(I4, LAT_G), LAT_G); }
let RW = null;
if(WIDE) RW = report('BASE V' + IA.version + ' WIDE', scan(IA, LAT_W), LAT_W);
if(WIDE){ console.log('  wide denominators (lift days) by tier+injury, only cells with hip-thrust hits:');
  Object.keys(RW.htByTierInj).forEach(k => console.log('    ' + k + ': ' + RW.htByTierInj[k] + '/' + RW.denByTierInj[k])); }

// ── counterfactuals: whole-output diff vs base, per lattice ──
const cfi = argv.indexOf('--cf');
if(cfi >= 0){
  const H = { name: 'THE HALF MANNY' };
  const lats = [['LAT_G', LAT_G]].concat(WIDE ? [['WIDE', LAT_W]] : []);
  argv.slice(cfi + 1).filter(a => /\.html$/.test(a)).forEach(file => {
    const C = load(file);
    console.log('\n##### COUNTERFACTUAL ' + path.basename(file));
    lats.forEach(([ln, lat]) => {
      const RC = report(path.basename(file) + ' ' + ln, scan(C, lat), lat);
      let moved = 0, uniMoved = 0, dayMoved = 0, dayMovedDup = 0, dayMovedClean = 0, secLost = 0, itemLost = 0, shown = 0; const repl = {}, movedBy = {};
      lat.forEach(x => {
        const a = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))), b = C.buildProgram(JSON.parse(JSON.stringify(x.cfg)));
        if(JSON.stringify(a._swapUniverse || null) !== JSON.stringify(b._swapUniverse || null)) uniMoved++;
        if(progDigest(a) === progDigest(b)) return;
        moved++; bump(movedBy, x.eq + ' ' + (x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy'));
        Object.keys(a.weeks).forEach(w => DAYS.forEach(d => {
          const da = a.weeks[w][d], db = b.weeks[w][d];
          if(JSON.stringify(da) === JSON.stringify(db)) return;
          dayMoved++;
          const where = {}; live(da).forEach(s => s.items.forEach(it => { const k = clean(it.name).toLowerCase(); where[k] = (where[k] || 0) + 1; }));
          if(Object.values(where).some(v => v >= 2)) dayMovedDup++; else dayMovedClean++;
          const La = live(da), Lb = live(db);
          if(Lb.length < La.length) secLost++;
          const na = La.reduce((n, s) => n + s.items.length, 0), nb = Lb.reduce((n, s) => n + s.items.length, 0);
          if(nb < na) itemLost++;
          La.forEach((s, i) => { const t = Lb[i]; if(!t) return; s.items.forEach((it, j) => { const u = t.items[j];
            if(!u || clean(u.name) !== clean(it.name)) bump(repl, stem(s) + ': ' + clean(it.name) + ' -> ' + (u ? clean(u.name) : '(gone)')); }); });
          const extra = {}; if(JSON.stringify(Object.assign({}, da, { sections:0 })) !== JSON.stringify(Object.assign({}, db, { sections:0 }))) bump(repl, '(non-section field moved)');
          if(shown < 2){ shown++; console.log('  moved day example: ' + x.eq + ' ' + JSON.stringify(x.inj) + ' ' + x.f + ' seed ' + x.cfg.seed + ' W' + w + ' ' + d);
            console.log('    before: ' + La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
            console.log('    after:  ' + Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ')); }
        }));
      });
      console.log(`  ${ln}: programs moved ${moved}/${lat.length}; swap universe moved ${uniMoved}/${lat.length}; days moved ${dayMoved} (of which carried a dup on base ${dayMovedDup}, carried none ${dayMovedClean}); days that lost a section ${secLost}; days that lost an item ${itemLost}`);
      console.log('  moved programs by tier+injury:\n' + top(movedBy));
      console.log('  replacements (section: before -> after):\n' + top(repl, 60));
    });
    // HALF_MANNY three arms
    mannyArms(file);
  });
}

// ── --budget: the same scan with capSessionBudget bypassed (__BUDGET_OFF, the engine's own test switch).
// Shows how many same-day duplicates the budget trim is hiding, per lattice (LAT_G, and the
// hypertrophy slice of WIDE when --wide is set: Leg isolation exists only on dense hypertrophy).
if(argv.includes('--budget')){
  const lats = [['LAT_G', LAT_G]].concat(WIDE ? [['WIDE hypertrophy', LAT_W.filter(x => x.f === 'hypertrophy')]] : []);
  lats.forEach(([ln, lat]) => {
    ['false', 'true'].forEach(off => {
      IA.eval('globalThis.__BUDGET_OFF=' + off + ';');
      const R = scan(IA, lat);
      console.log(`\n--budget ${ln} (${lat.length} configs) __BUDGET_OFF=${off}: dup days ${R.dupDays}, dup names ${R.dupItems}, hip-thrust days ${R.htDays} (configs ${R.htCfg.size})`);
      console.log('  by class:\n' + top(R.byClass, 20));
      console.log('  hip thrust by tier+injury:\n' + top(R.htByTierInj));
    });
    IA.eval('globalThis.__BUDGET_OFF=false;');
  });
}
