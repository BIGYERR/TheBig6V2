// v220_d164_floorpress_twice.js — MEASURE (before-picture) for D164, base V216 (3dc0146).
//   node tests/measure/v220_d164_floorpress_twice.js <base.html> <scratchdir> --scan
//   node tests/measure/v220_d164_floorpress_twice.js <base.html> <scratchdir> --cf a|b1|b2|b3
// Question: on injury plans with P.swapNames (shoulder/workaround, elbow/workaround), how often does the
// injury rename land a name that is already on the same day, which copy is the renamed one, and what
// would each counterfactual move.
// ORACLE: the day card is its own oracle (a name printed on >=2 items of one day's live sections is a
// duplicate; no engine function is asked). Attribution (which copy was renamed) comes from an
// INSTRUMENTED copy whose only change is a `_from` tag on renamed items plus a log of seen-drops; the
// instrument is proven inert (weeks JSON with _from stripped == base, per config) before it is used.
// Clock fields (prog.id, prog.created) are stripped before any whole-program comparison.
// Lattice: the D159 WIDE lattice, copied verbatim from v218_d159_double_hipthrust.js (13,104 configs).
// Counterfactuals (source surgery on scratch copies, every anchor asserted count==1):
//   a  : draw sees through the rename — _accFresh marks view(name) for every card item and rejects a
//        candidate whose view is taken; dense 'Chest volume' pool and its secondary filter compare views.
//   b1 : renamer checks the day — if the rename target is already on the day, the source name is kept.
//   b2 : renamer checks the day — if the rename target is already on the day, the item is dropped.
//   b3 : applyInjuryFilter's `seen` is hoisted to day level (the reset the queued premise names).
'use strict';
const path = require('path'), fs = require('fs');
const { load, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const argv = process.argv.slice(2);
const BASE = argv[0], SCR = argv[1];
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const top = (o, n = 40) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v + '  ' + k).join('\n') || '    (none)';

// ── D159 WIDE lattice, verbatim ──
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const FOC = ['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS = ['beginner','intermediate','advanced'], AGES = ['18-35','36-54','55+'], RESTS = [['sun','wed'],['sat','sun']];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
const REG = ['shoulder','elbow','lowback','hip','knee','ankle'], ITIER = ['workaround','protect'];
function mk(eq, gi, f, exp, age, si, inj){
  const [g, x] = GOALS[gi % GOALS.length];
  const c = { name:'M', primaryPath: /^support_/.test(f) ? 'event' : 'goal', cardioTypes:['run'],
    cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:f, experience:exp, ageBracket:age, equipment:eq, unit:'lbs',
    restDays: RESTS[si % 2].slice(), days: DAYS.slice(), bench:135, squat:155, deadlift:185, seed: SEEDS[si] };
  if(inj) c.injury = inj;
  return c;
}
const TIERS6 = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const INJ = [null]; REG.forEach(r => ITIER.forEach(t => INJ.push({ region:r, tier:t })));
const LAT_W = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj);
  c.restDays = RESTS[ri].slice();
  LAT_W.push({ eq, inj, f, cfg: c });
})))));
const ik = x => x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy';
const B = c => JSON.parse(JSON.stringify(c));

// ── source surgery ──
const RAW = fs.readFileSync(BASE, 'utf8');
function surg(src, pairs, tag){
  let out = src;
  pairs.forEach(([a, b], i) => { const n = out.split(a).length - 1; if(n !== 1) throw new Error(tag + ' anchor ' + i + ' count ' + n + ': ' + a.slice(0, 80)); out = out.replace(a, () => b); });
  const f = path.join(SCR, 'v220_' + tag + '.html'); if(fs.existsSync(f)) fs.rmSync(f); fs.writeFileSync(f, out); return f;
}
const A_SWAP = "if(_gOK(name)){ const to=P.swapNames[name]; name=_gOK(to)?to:(SWAP_GEAR_FALLBACK[to]||to); }";
const A_OUT = "  const JUMPS=/jump|burpee|broad|bound|box jump|high knees|tuck/i;\n  const out=[];";
const A_SEEN = "    const seen=new Set();\n    const items=[];";
const A_PUSH = "      items.push({...it,name,detail});\n    });\n    if(items.length) out.push(label===s.label";
const A_SEENHIT = "      if(seen.has(name)) return;  // swaps can collide with an existing pick";
const A_AIF = "function applyInjuryFilter(sections,cfg){";
const A_ACC = "        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)t[it.name]=1;});});\n        for(let i=0;i<prefs.length;i++){ if(prefs[i]&&!t[prefs[i]]) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(chestAccPool[i]&&!t[chestAccPool[i]]) return chestAccPool[i]; }";
const A_DENSE = "        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain);";
const A_CH2 = "        const chest2=pick(chestPool.filter(x=>x!==secondary),2,blockSeed(w)+101);";
const VIEW = "function _injViewName(n,cfg){ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }\n";
function makeFiles(){
  const F = {};
  F.I = surg(RAW, [
    [A_PUSH, "      items.push(name!==it.name?{...it,name,detail,_from:(it._from||it.name)}:{...it,name,detail});\n    });\n    if(items.length) out.push(label===s.label"],
    [A_SEENHIT, "      if(seen.has(name)){ (globalThis.__SD=globalThis.__SD||[]).push({sec:String(label||''),name:name,raw:it.name,prev:((items.find(q=>q.name===name)||{})._from||null)}); return; }"]], 'I');
  F.a = surg(RAW, [
    [A_AIF, VIEW + A_AIF],
    [A_ACC, "        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name){t[it.name]=1;t[_injViewName(it.name,cfg)]=1;}});});\n        const _fr=function(n){return n&&!t[n]&&!t[_injViewName(n,cfg)];};\n        for(let i=0;i<prefs.length;i++){ if(_fr(prefs[i])) return prefs[i]; }\n        for(let i=0;i<chestAccPool.length;i++){ if(_fr(chestAccPool[i])) return chestAccPool[i]; }"],
    [A_DENSE, "        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain&&_injViewName(x,cfg)!==_injViewName(ex.chestMain,cfg));"],
    [A_CH2, "        const chest2=pick(chestPool.filter(x=>x!==secondary&&_injViewName(x,cfg)!==_injViewName(secondary,cfg)),2,blockSeed(w)+101);"]], 'a');
  const DAYSET = A_OUT + "\n  const _dayNames=new Set(); sections.forEach(s=>((s&&s.items)||[]).forEach(it=>{ if(it&&it.name) _dayNames.add(it.name); }));";
  F.b1 = surg(RAW, [[A_OUT, DAYSET],
    [A_SWAP, "if(_gOK(name)){ const to=P.swapNames[name]; const _tg=_gOK(to)?to:(SWAP_GEAR_FALLBACK[to]||to); if(!_dayNames.has(_tg)) name=_tg; }"]], 'b1');
  F.b2 = surg(RAW, [[A_OUT, DAYSET],
    [A_SWAP, "if(_gOK(name)){ const to=P.swapNames[name]; const _tg=_gOK(to)?to:(SWAP_GEAR_FALLBACK[to]||to); if(_dayNames.has(_tg)) return; name=_tg; }"]], 'b2');
  F.b3 = surg(RAW, [[A_OUT, A_OUT + "\n  const seen=new Set();"], [A_SEEN, "    const items=[];"]], 'b3');
  return F;
}

// ── day scan: duplicate groups, with rename attribution from _from tags ──
function dupGroups(day){
  const where = {};
  live(day).forEach(s => s.items.forEach(it => { const k = clean(it.name).toLowerCase(); if(!k) return; (where[k] = where[k] || []).push({ sec: stem(s), from: it._from || null }); }));
  return Object.keys(where).filter(k => where[k].length >= 2).map(k => ({ k, copies: where[k] }));
}
const stripFrom = o => JSON.stringify(o, (k, v) => k === '_from' ? undefined : v);

function mannyArms(file){
  const os = require('os');
  const PINS = ['0ac7da6b1691a8e1', '1069cd7f86eed204', '9d14801a63111081'];
  const X = load(file); const H = () => B(X.fixtures.HALF_MANNY);
  const plain = progDigest(X.buildProgram(H())); const again = progDigest(X.buildProgram(H()));
  X.eval('globalThis.__DELOAD_OFF=true;'); const dOff = progDigest(X.buildProgram(H())); X.eval('globalThis.__DELOAD_OFF=false;');
  const R = fs.readFileSync(file, 'utf8'); const CL = "  if(_auxFamily(name)==='core') return 0;\n"; const n = R.split(CL).length - 1;
  let cOff = 'CLAUSE count ' + n;
  if(n === 1){ const tmp = path.join(SCR, 'v220_coreoff_' + process.pid + '.html'); fs.writeFileSync(tmp, R.replace(CL, '')); cOff = progDigest(load(tmp).buildProgram(H())); fs.rmSync(tmp); }
  const got = [plain, dOff, cOff];
  console.log('  HALF_MANNY ' + path.basename(file) + ' self-stable ' + (plain === again) + ': plain ' + plain + ' | deload_off ' + dOff + ' | core_off ' + cOff + ' | vs pins ' + got.map((g, i) => g === PINS[i] ? 'EQ' : 'MOVED').join('/'));
}

const F = makeFiles();
const IA = load(BASE);
console.log('base ia-version', IA.version, '| lattice', LAT_W.length, 'configs');
const lines = RAW.split('\n');
const ln = re => lines.map((l, i) => re.test(l) ? (i + 1) : 0).filter(Boolean).join(',');
console.log('provenance lines: EXLIB.chest_acc ' + ln(/^\s*chest_acc:\[/) + ' | chest_acc_joint ' + ln(/^\s*chest_acc_joint:\[/) + ' | chestAccPool ' + ln(/const chestAccPool\s*=/) +
  " | shoulder-workaround chestCompoundPool " + ln(/chestCompoundPool = hasBarbell\?\['Dumbbell bench press'/) + ' | chestMain _slot ' + ln(/const chestMain = _slot/) + ' | chestAcc _slot ' + ln(/const chestAcc  = _slot/) +
  ' | _accFresh ' + ln(/const _accFresh=function/) + ' | Accessory _accFresh call ' + ln(/const _accA=_accFresh/) + ' | Chest+knee call ' + ln(/const _ckA=_accFresh/) + ' | dense chestPool ' + ln(/const chestPool=chestPoolRaw/) +
  ' | Chest volume push ' + ln(/label:'Chest volume'/) + ' | swapNames shoulder ' + ln(/P\.swapNames=\{'Dumbbell bench press'/) + ' | swapNames elbow ' + ln(/P\.swapNames=\{'Dumbbell skullcrushers'/) + ' | rename apply ' + ln(/if\(_gOK\(name\)\)\{ const to=P\.swapNames/) + ' | seen ' + ln(/const seen=new Set\(\);/) + ' | applyInjuryFilter call sites ' + ln(/applyInjuryFilter\(/));

if(argv.includes('--scan')){
  mannyArms(BASE);
  const I = load(F.I);
  const R = { builds:0, crash:[], inertFail:0, inertFailEx:[], dayN:{}, dupDays:0, dupRenameDays:0, dupNoRenameDays:0, byTier:{}, byInj:{}, byPair:{}, byTarget:{}, byOrient:{}, byFocus:{}, byExp:{}, byWeek:{}, byTierInj:{},
    fpDupDays:0, fpDupPair:{}, fpDupTier:{}, renDays:{}, renDaysDup:{}, seenDrops:{}, untagged:0, ex:null, exAll:[] };
  LAT_W.forEach((x, li) => {
    let p, q;
    try { p = IA.buildProgram(B(x.cfg)); } catch(e){ R.crash.push('base ' + ik(x) + ' ' + e.message); return; }
    I.eval('globalThis.__SD=[];');
    try { q = I.buildProgram(B(x.cfg)); } catch(e){ R.crash.push('instr ' + ik(x) + ' ' + e.message); return; }
    R.builds++;
    const sd = I.eval('globalThis.__SD') || [];
    sd.forEach(e => { if(e.sec !== 'x') bump(R.seenDrops, ik(x) + ' | ' + e.raw + (e.raw !== e.name ? ' -> ' + e.name : ' (no rename)') + (e.prev ? ' [kept copy renamed from ' + e.prev + ']' : ' [kept copy as drawn]') + ' | ' + x.eq); });
    if(stripFrom(p.weeks) !== stripFrom(q.weeks) || stripFrom(p._swapUniverse) !== stripFrom(q._swapUniverse)){ R.inertFail++; if(R.inertFailEx.length < 3) R.inertFailEx.push(li); return; }
    Object.keys(q.weeks).forEach(w => DAYS.forEach(d => {
      const day = q.weeks[w][d]; const L = live(day); if(!L.length) return;
      bump(R.dayN, x.eq + ' ' + ik(x));
      const ren = []; L.forEach(s => s.items.forEach(it => { if(it._from) ren.push(it._from + ' -> ' + clean(it.name).toLowerCase()); }));
      ren.forEach(r => bump(R.renDays, ik(x) + ' | ' + r));
      const G = dupGroups(day); if(!G.length) return;
      R.dupDays++;
      const rg = G.filter(g => g.copies.some(c => c.from));
      if(rg.length){ R.dupRenameDays++; bump(R.byTier, x.eq); bump(R.byInj, ik(x)); bump(R.byFocus, x.f); bump(R.byExp, x.cfg.experience); bump(R.byWeek, 'W' + w); bump(R.byTierInj, x.eq + ' ' + ik(x)); }
      else R.dupNoRenameDays++;
      rg.forEach(g => {
        const from = g.copies.find(c => c.from).from;
        bump(R.renDaysDup, ik(x) + ' | ' + from + ' -> ' + g.k);
        bump(R.byTarget, ik(x) + ' | ' + from + ' -> ' + g.k + ' | ' + x.eq);
        bump(R.byPair, g.copies.map(c => c.sec + (c.from ? '[renamed from ' + c.from + ']' : '[drawn direct]')).join(' + '));
        bump(R.byOrient, g.copies.map(c => c.sec + (c.from ? '*' : '')).join(' + '));
        if(!R.ex && x.inj && x.inj.region === 'shoulder' && /floor press/.test(g.k) && g.copies[0].sec === 'Main') R.ex = { li, w, d };
      });
      if(!rg.length && R.exAll.length < 5) R.exAll.push(ik(x) + ' ' + x.eq + ' W' + w + ' ' + d + ' ' + G.map(g => g.k + '@' + g.copies.map(c => c.sec).join('+')).join('; '));
      G.forEach(g => { if(/floor press/.test(g.k)){ R.fpDupDays++; bump(R.fpDupPair, g.copies.map(c => c.sec).sort().join(' + ')); bump(R.fpDupTier, x.eq); } });
    }));
    // untagged renames: a swapNames target printed on a day without a _from tag (instrument blind spot)
  });
  console.log(`\n=== SCAN: ${R.builds}/${LAT_W.length} built; crashes ${R.crash.length} ${R.crash.slice(0,3).join(' | ')}; instrument NOT inert on ${R.inertFail} ${R.inertFailEx.join(',')}`);
  const totDays = Object.values(R.dayN).reduce((a, b) => a + b, 0);
  console.log(`  lift days ${totDays}; days with any same-day duplicate ${R.dupDays}; of which a copy is an injury rename ${R.dupRenameDays}; with no renamed copy ${R.dupNoRenameDays}`);
  console.log(`  "floor press" duplicate days (D159 oracle, no attribution) ${R.fpDupDays}; by tier:\n` + top(R.fpDupTier) + '\n  by section pair (sorted, D159 form):\n' + top(R.fpDupPair));
  console.log('  rename-created dup days by tier:\n' + top(R.byTier) + '\n  by injury:\n' + top(R.byInj) + '\n  by focus:\n' + top(R.byFocus) + '\n  by experience:\n' + top(R.byExp) + '\n  by week:\n' + top(R.byWeek, 20));
  console.log('  rename-created dup days by tier+injury, with lift-day denominator:');
  Object.keys(R.byTierInj).sort().forEach(k => console.log('    ' + k + ': ' + R.byTierInj[k] + '/' + R.dayN[k]));
  console.log('  injury x rename (renamed-copy days that duplicate / all days carrying that rename):');
  Object.keys(R.renDays).sort().forEach(k => console.log('    ' + k + ': ' + (R.renDaysDup[k] || 0) + '/' + R.renDays[k]));
  Object.keys(R.renDaysDup).filter(k => !R.renDays[k]).forEach(k => console.log('    (dup key with no rename-day key) ' + k + ': ' + R.renDaysDup[k]));
  console.log('  injury x rename x tier:\n' + top(R.byTarget, 60));
  console.log('  copies (section[origin]):\n' + top(R.byPair, 30));
  console.log('  orientation (* = the renamed copy):\n' + top(R.byOrient, 30));
  console.log('  rename collisions absorbed by the per-section seen (item silently dropped), per injury | raw -> renamed | tier:\n' + top(R.seenDrops, 60));
  console.log('  sample dup days with no renamed copy: \n    ' + R.exAll.join('\n    '));
  if(R.ex){ const x = LAT_W[R.ex.li]; console.log('\nREPRO cfg ' + JSON.stringify(x.cfg));
    const day = I.buildProgram(B(x.cfg)).weeks[R.ex.w][R.ex.d];
    console.log(`  W${R.ex.w} ${R.ex.d} "${day.title}"`);
    live(day).forEach(s => console.log(`    [${s.label}]${s.superset ? ' (superset)' : ''} ` + s.items.map(i => clean(i.name) + (i._from ? ' {renamed from ' + i._from + '}' : ' {as drawn}') + ' :: ' + i.detail).join(' | ')));
    const raw = IA.buildProgram(B(x.cfg)).weeks[R.ex.w][R.ex.d];
    console.log('  base (uninstrumented) same day: ' + live(raw).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
    const hc = B(x.cfg); delete hc.injury; const h = IA.buildProgram(hc).weeks[R.ex.w][R.ex.d];
    console.log('  same cfg WITHOUT injury, same day: ' + live(h).map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
  }
}

const which = opt('--cf');
if(which){
  const file = F[which]; const C = load(file);
  console.log('\n##### COUNTERFACTUAL ' + which + ' (' + path.basename(file) + ')');
  let moved = 0, uniMoved = 0, dayMoved = 0, dayMovedDup = 0, dayMovedClean = 0, secLost = 0, itemLost = 0, shown = 0, crash = 0, dupBase = 0, dupCf = 0, fpBase = 0, fpCf = 0;
  const repl = {}, movedBy = {}, secGone = {}, dupCfCls = {}, nonSec = {};
  LAT_W.forEach(x => {
    let a, b; try { a = IA.buildProgram(B(x.cfg)); b = C.buildProgram(B(x.cfg)); } catch(e){ crash++; return; }
    Object.keys(b.weeks).forEach(w => DAYS.forEach(d => { const G = dupGroups(b.weeks[w][d]); if(G.length) dupCf++; G.forEach(g => { bump(dupCfCls, ik(x) + ' | ' + g.k + ' @ ' + g.copies.map(c => c.sec).sort().join('+')); if(/floor press/.test(g.k)) fpCf++; });
      const G0 = dupGroups(a.weeks[w][d]); if(G0.length) dupBase++; if(G0.some(g => /floor press/.test(g.k))) fpBase++; }));
    const uA = JSON.stringify([a._swapUniverse || null, a._swapUniverseByKey || null]), uB = JSON.stringify([b._swapUniverse || null, b._swapUniverseByKey || null]);
    if(uA !== uB) uniMoved++;
    const restA = JSON.stringify(Object.assign({}, a, { weeks:0, _swapUniverse:0, _swapUniverseByKey:0, id:0, created:0 })), restB = JSON.stringify(Object.assign({}, b, { weeks:0, _swapUniverse:0, _swapUniverseByKey:0, id:0, created:0 }));
    if(restA !== restB) bump(nonSec, 'non-weeks program field moved ' + ik(x));
    if(JSON.stringify(a.weeks) === JSON.stringify(b.weeks) && uA === uB && restA === restB) return;
    moved++; bump(movedBy, x.eq + ' ' + ik(x));
    Object.keys(a.weeks).forEach(w => DAYS.forEach(d => {
      const da = a.weeks[w][d], db = b.weeks[w][d];
      if(JSON.stringify(da) === JSON.stringify(db)) return;
      dayMoved++;
      if(dupGroups(da).length) dayMovedDup++; else dayMovedClean++;
      const La = live(da), Lb = live(db);
      const sb = new Set(Lb.map(stem)); La.forEach(s => { if(!sb.has(stem(s))) { secLost++; bump(secGone, stem(s) + ' ' + ik(x)); } });
      const na = La.reduce((n, s) => n + s.items.length, 0), nb = Lb.reduce((n, s) => n + s.items.length, 0);
      if(nb < na) itemLost++;
      La.forEach(s => { const t = Lb.find(u => stem(u) === stem(s)); s.items.forEach((it, j) => { const u = t && t.items[j];
        if(!u || clean(u.name) !== clean(it.name)) bump(repl, ik(x) + ' ' + stem(s) + ': ' + clean(it.name) + ' -> ' + (u ? clean(u.name) : '(gone)')); else if(u.detail !== it.detail) bump(repl, ik(x) + ' ' + stem(s) + ': detail only on ' + clean(it.name)); }); });
      if(JSON.stringify(Object.assign({}, da, { sections:0 })) !== JSON.stringify(Object.assign({}, db, { sections:0 }))) bump(repl, '(non-section day field moved)');
      if(shown < 3){ shown++; console.log('  moved day: ' + x.eq + ' ' + ik(x) + ' ' + x.f + ' ' + x.cfg.experience + ' seed ' + x.cfg.seed + ' W' + w + ' ' + d);
        console.log('    before: ' + La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
        console.log('    after:  ' + Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ')); }
    }));
  });
  console.log(`  ${which}: crashes ${crash}; programs moved ${moved}/${LAT_W.length}; swap universe moved ${uniMoved}/${LAT_W.length}; days moved ${dayMoved} (carried a dup on base ${dayMovedDup}, carried none ${dayMovedClean}); days that lost a whole section ${secLost}; days that lost an item ${itemLost}`);
  console.log(`  dup days base ${dupBase} -> cf ${dupCf}; floor-press dup days base ${fpBase} -> cf ${fpCf}`);
  console.log('  moved programs by tier+injury:\n' + top(movedBy, 60));
  console.log('  sections lost:\n' + top(secGone));
  console.log('  non-weeks fields:\n' + top(nonSec));
  console.log('  replacements (injury section: before -> after):\n' + top(repl, 60));
  console.log('  remaining dup classes on cf (injury | name @ pair), top:\n' + top(dupCfCls, 25));
  mannyArms(file);
}
