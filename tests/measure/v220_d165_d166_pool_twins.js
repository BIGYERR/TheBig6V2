// v220_d165_d166_pool_twins.js — MEASURE (before-picture) for D165 and D166, base V216 (3dc0146).
//   node tests/measure/v220_d165_d166_pool_twins.js <base.html> [--cf a.html b.html ...] [--jobs 8]
// D165: the legs-day Main (ex.squat) prints again as ex.lunge[0] in "Leg superset A" / "Leg circuit".
// D166: the pull-day Main (ex.backMain) prints again as ex.cond[2] in "Pull superset B".
// ORACLE: the day card is its own oracle. A class hit is a day whose "Main" section item name
// (cleaned, lowercased) also appears as an item in the named section stem on the same day.
// The generic census counts ANY name on >=2 items of one day. No engine function is asked.
// LATTICE: the D159 WIDE lattice (tests/measure/v218_d159_double_hipthrust.js --wide), copied
//   verbatim: tiers(6) x injury(13) x foci(7) x exp(3) x seeds(4) x rests(2) = 13,104 configs.
// COUNTERFACTUALS: each --cf artifact is built on the same config; whole output compared
//   (weeks, _swapUniverse, _swapUniverseByKey, every field bar the clock fields created/startDate).
//   Artifacts named cf165a/cf165b/cf166a/cf166b are singles; cfAA = 165a+166a, cfBB = 165b+166b,
//   and the combined build is checked day-by-day against the union of its singles.
// Surgery used in the V220 before-picture (scratch copies of 3dc0146:index.html, anchors count==1):
//   cf165a  lungeSel = _slot(lungePool.filter(n=>n!==squatSel),2,bs+7,'lower')          (pool subtract)
//   cf165b  lungeSel redrawn from lungePool minus squatSel ONLY when lungeSel[0]===squatSel (collision-only)
//   cf166a  cond = pick(<cond pool>.filter(n=>n!==backMain),4,bs+11)                     (pool subtract)
//   cf166b  Pull superset B prints ex.cond[3] when ex.cond[2]===ex.backMain              (read-site)
'use strict';
const path = require('path'), cp = require('child_process'), crypto = require('crypto');
const { load, progDigest, DAYS } = require(path.join(__dirname, '..', 'harness.js'));
const argv = process.argv.slice(2);
const BASE = argv[0];
const opt = k => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : null; };
const cfi = argv.indexOf('--cf');
const CFS = cfi >= 0 ? argv.slice(cfi + 1).filter(a => /\.html$/.test(a)) : [];
const clean = n => String(n == null ? '' : n).replace(/<svg[\s\S]*?<\/svg>\s*/g, '').replace(/<[^>]+>/g, '').trim();
const stem = s => String(s.label || (s.coreHeader ? '{core}' : '(none)')).replace(/\s*[—-]\s.*$/, '');
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const live = d => (d && !d.rest && d.sections || []).filter(s => (s.items || []).length);
const h = o => crypto.createHash('md5').update(JSON.stringify(o)).digest('hex').slice(0, 12);

// ── WIDE lattice, verbatim from v218_d159_double_hipthrust.js ──
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
const LAT = [];
for(const eq of TIERS6) INJ.forEach((inj, ii) => FOC.forEach((f, fi) => EXPS.forEach((e, ei) => [0,1,2,3].forEach(si => [0,1].forEach(ri => {
  const c = mk(eq, ii + fi + ei + si, f, e, AGES[(fi + si) % 3], si, inj);
  c.restDays = RESTS[ri].slice();
  LAT.push({ eq, inj, f, cfg: c });
})))));
const ik = x => x.inj ? x.inj.region + '/' + x.inj.tier : 'healthy';

// ── per-day classifier (the oracle) ──
function classify(day){
  const L = live(day); const out = { live: L.length > 0, c165: null, c166: null, dups: [], hasLegA: false, hasPullB: false, mainName: null };
  if(!L.length) return out;
  const main = L.find(s => stem(s) === 'Main'); const mn = main ? clean(main.items[0].name).toLowerCase() : null; out.mainName = mn;
  const where = {};
  L.forEach(s => s.items.forEach(it => { const k = clean(it.name).toLowerCase(); if(k) (where[k] = where[k] || []).push(stem(s)); }));
  out.dups = Object.keys(where).filter(k => where[k].length >= 2).map(k => [k, where[k].slice().sort().join(' + ')]);
  L.forEach(s => { const st = stem(s); if(st === 'Leg superset A' || st === 'Leg circuit') out.hasLegA = true; if(st === 'Pull superset B') out.hasPullB = true; });
  if(main && mn){
    const legS = L.find(s => (stem(s) === 'Leg superset A' || stem(s) === 'Leg circuit') && s.items.some(i => clean(i.name).toLowerCase() === mn));
    if(legS) out.c165 = { name: mn, sec: stem(legS) };
    const pb = L.find(s => stem(s) === 'Pull superset B' && s.items.some(i => clean(i.name).toLowerCase() === mn));
    if(pb) out.c166 = { name: mn, sec: 'Pull superset B' };
  }
  return out;
}
// Clock fields: id (prog_<Date.now()>) and created differ between two builds of one cfg (printed V220); startDate is date-derived.
// Pass a byte copy of the base as a --cf named self.html to prove the instrument: it must read 0 moved everywhere.
const strip = p => { const o = Object.assign({}, p); delete o.id; delete o.created; delete o.startDate; return o; };

// ── worker: scan a shard, emit JSON ──
function work(k, n){
  const IA = load(BASE); const C = CFS.map(f => ({ f: path.basename(f, '.html'), X: load(f) }));
  const R = { builds:0, crash:0, crashEx:[], days:0, legDen:{}, pullDen:{}, c165:{}, c166:{}, c165T:0, c166T:0, c165Name:{}, c166Name:{}, c165Sec:{},
    c165Cell:{}, c166Cell:{}, c165Week:{}, c166Week:{}, c165Focus:{}, c166Focus:{}, c165Exp:{}, c166Exp:{}, dupAll:{}, dupAllN:0, ex165:[], ex166:[], cf:{} };
  C.forEach(c => { R.cf[c.f] = { crash:0, progMoved:0, uniMoved:0, uniKeyMoved:0, otherFieldMoved:0, dayMoved:0, dayMovedT165:0, dayMovedT166:0, dayMovedNoTarget:0, nonTargetTitle:{}, nonTargetSec:{},
    secLost:0, itemLost:0, repl:{}, left165:0, left166:0, fixed165:0, fixed166:0, newDup:{}, movedByCell:{}, ex:[], movedCfgIdx:[], dayHash:{} }; });
  for(let li = k; li < LAT.length; li += n){
    const x = LAT[li]; let a;
    try { a = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))); } catch(e){ R.crash++; if(R.crashEx.length < 3) R.crashEx.push(x.eq + ' ' + ik(x) + ' ' + e.message); continue; }
    R.builds++;
    const cell = x.eq + ' ' + ik(x);
    const baseCls = {};
    Object.keys(a.weeks).forEach(w => DAYS.forEach(d => {
      const cl = classify(a.weeks[w][d]); baseCls[w + d] = cl; if(!cl.live) return; R.days++;
      if(cl.hasLegA && cl.mainName) bump(R.legDen, cell); if(cl.hasPullB && cl.mainName) bump(R.pullDen, cell);
      cl.dups.forEach(([nm, pr]) => { R.dupAllN++; bump(R.dupAll, nm + ' @ ' + pr); });
      if(cl.c165){ R.c165T++; bump(R.c165, cell); bump(R.c165Name, cl.c165.name); bump(R.c165Sec, cl.c165.sec + ' + Main'); bump(R.c165Cell, cell + ' | ' + x.f); bump(R.c165Week, 'W' + w); bump(R.c165Focus, x.f); bump(R.c165Exp, x.cfg.experience);
        if(R.ex165.length < 6) R.ex165.push({ li, eq:x.eq, ik:ik(x), f:x.f, seed:x.cfg.seed, w, d }); }
      if(cl.c166){ R.c166T++; bump(R.c166, cell); bump(R.c166Name, cl.c166.name); bump(R.c166Cell, cell + ' | ' + x.f); bump(R.c166Week, 'W' + w); bump(R.c166Focus, x.f); bump(R.c166Exp, x.cfg.experience);
        if(R.ex166.length < 6) R.ex166.push({ li, eq:x.eq, ik:ik(x), f:x.f, seed:x.cfg.seed, w, d }); }
    }));
    C.forEach(c => {
      const Q = R.cf[c.f]; let b;
      try { b = c.X.buildProgram(JSON.parse(JSON.stringify(x.cfg))); } catch(e){ Q.crash++; return; }
      if(JSON.stringify(a._swapUniverse || null) !== JSON.stringify(b._swapUniverse || null)) Q.uniMoved++;
      if(JSON.stringify(a._swapUniverseByKey || null) !== JSON.stringify(b._swapUniverseByKey || null)) Q.uniKeyMoved++;
      const sa = strip(a), sb = strip(b); ['weeks','_swapUniverse','_swapUniverseByKey'].forEach(z => { delete sa[z]; delete sb[z]; });
      if(JSON.stringify(sa) !== JSON.stringify(sb)) Q.otherFieldMoved++;
      if(JSON.stringify(strip(a)) === JSON.stringify(strip(b))) return;
      Q.progMoved++; bump(Q.movedByCell, cell); Q.movedCfgIdx.push(li);
      Object.keys(a.weeks).forEach(w => DAYS.forEach(d => {
        const da = a.weeks[w][d], db = b.weeks[w][d], cb = classify(db), ca = baseCls[w + d];
        if(ca.c165 && !cb.c165) Q.fixed165++; if(cb.c165) Q.left165++;
        if(ca.c166 && !cb.c166) Q.fixed166++; if(cb.c166) Q.left166++;
        const aN = new Set(ca.dups.map(z => z[0] + ' @ ' + z[1])); cb.dups.forEach(z => { const kk = z[0] + ' @ ' + z[1]; if(!aN.has(kk)) bump(Q.newDup, kk + ' | ' + cell); });
        if(JSON.stringify(da) === JSON.stringify(db)) return;
        Q.dayMoved++; Q.dayHash[li + ':' + w + ':' + d] = h(db);
        if(ca.c165) Q.dayMovedT165++; if(ca.c166) Q.dayMovedT166++;
        const La = live(da), Lb = live(db);
        if(!ca.c165 && !ca.c166){ Q.dayMovedNoTarget++; bump(Q.nonTargetTitle, String(da.title || '').replace(/\s*\(.*$/, '') + ' | ' + cell);
          const sb2 = {}; Lb.forEach(s => { sb2[stem(s)] = s.items.map(i => clean(i.name)).join(','); });
          La.forEach(s => { if(sb2[stem(s)] !== s.items.map(i => clean(i.name)).join(',')) bump(Q.nonTargetSec, stem(s)); }); }
        if(Lb.length < La.length) Q.secLost++;
        if(Lb.reduce((m, s) => m + s.items.length, 0) < La.reduce((m, s) => m + s.items.length, 0)) Q.itemLost++;
        const byStem = {}; Lb.forEach(s => { byStem[stem(s)] = s; });
        La.forEach(s => { const t = byStem[stem(s)]; s.items.forEach((it, j) => { const u = t && t.items[j];
          if(!u || clean(u.name) !== clean(it.name)) bump(Q.repl, stem(s) + ': ' + clean(it.name) + ' -> ' + (u ? clean(u.name) : '(gone)')); }); });
        if(JSON.stringify(Object.assign({}, da, { sections:0 })) !== JSON.stringify(Object.assign({}, db, { sections:0 }))) bump(Q.repl, '(non-section day field moved)');
        const tag = ca.c165 ? 'T165' : ca.c166 ? 'T166' : 'NONTARGET';
        if(Q.ex.filter(e => e.tag === tag).length < 2) Q.ex.push({ tag, cell, f:x.f, seed:x.cfg.seed, w, d, title: da.title,
          before: La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '),
          after:  Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ') });
      }));
    });
  }
  return R;
}
function merge(a, b){
  if(Array.isArray(a)) return a.concat(b);
  if(typeof a === 'number') return a + b;
  if(a && typeof a === 'object'){ const o = Object.assign({}, a); Object.keys(b).forEach(k => { o[k] = (k in o) ? merge(o[k], b[k]) : b[k]; }); return o; }
  return b;
}
// ── --detail: single process, tiers with any move (bodyweight/home_basic/minimal). Per moved day: item-count
// delta and section-label changes, split by target (base D165/D166 day) vs non-target, by cell; examples of each.
if(argv.includes('--detail')){
  const IA = load(BASE); const C = CFS.map(f => ({ f: path.basename(f, '.html'), X: load(f) }));
  const lat = LAT.filter(x => /bodyweight|home_basic|minimal/.test(x.eq));
  const D = {}; C.forEach(c => { D[c.f] = { delta:{}, secLab:{}, exShown:{} }; });
  const labs = L => L.map(s => String(s.label)).sort().join(' / ');
  lat.forEach(x => {
    const a = IA.buildProgram(JSON.parse(JSON.stringify(x.cfg))); const cell = x.eq + ' ' + ik(x);
    C.forEach(c => { const Q = D[c.f]; const b = c.X.buildProgram(JSON.parse(JSON.stringify(x.cfg)));
      Object.keys(a.weeks).forEach(w => DAYS.forEach(d => { const da = a.weeks[w][d], db = b.weeks[w][d];
        if(JSON.stringify(da) === JSON.stringify(db)) return;
        const ca = classify(da), La = live(da), Lb = live(db);
        const tag = ca.c165 ? 'T165' : ca.c166 ? 'T166' : 'NON';
        const dn = Lb.reduce((m, s) => m + s.items.length, 0) - La.reduce((m, s) => m + s.items.length, 0);
        const ds = Lb.length - La.length;
        bump(Q.delta, tag + ' items ' + (dn > 0 ? '+' : '') + dn + ' sections ' + (ds > 0 ? '+' : '') + ds + ' | ' + x.eq + (x.inj ? ' ' + x.inj.region + '/' + x.inj.tier : ' healthy'));
        if(labs(La) !== labs(Lb)){ const A = La.map(s => stem(s)), B = Lb.map(s => stem(s));
          bump(Q.secLab, tag + ' -[' + A.filter(z => B.indexOf(z) < 0).join(',') + '] +[' + B.filter(z => A.indexOf(z) < 0).join(',') + ']'); }
        const ek = tag + (dn < 0 ? ' LOSS' : dn > 0 ? ' GAIN' : ' SWAP') + ' ' + x.eq;
        if((Q.exShown[ek] || 0) < 1){ Q.exShown[ek] = 1;
          console.log('\n[' + c.f + '] ' + ek + ' ' + cell + ' ' + x.f + ' ' + x.cfg.experience + ' seed ' + x.cfg.seed + ' rest ' + x.cfg.restDays.join('/') + ' W' + w + ' ' + d + ' "' + da.title + '"');
          console.log('   before: ' + La.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | '));
          console.log('   after:  ' + Lb.map(s => s.label + '[' + s.items.map(i => clean(i.name)).join(', ') + ']').join(' | ')); }
      })); });
  });
  C.forEach(c => { console.log('\n##### DETAIL ' + c.f + ' (' + lat.length + ' configs: bodyweight, home_basic, minimal)');
    console.log('  moved days by target | item delta | section delta | cell:\n' + top(D[c.f].delta, 80));
    console.log('  section-label changes (removed / added stems):\n' + top(D[c.f].secLab, 30)); });
  process.exit(0);
}
// Worker output goes to a FILE: the engine logs to stdout during builds, so a stdout JSON channel is corrupted.
if(argv.includes('--worker')){ const k = +opt('--worker'), n = +opt('--n'); require('fs').writeFileSync(opt('--out'), JSON.stringify(work(k, n))); process.exit(0); }

// ── main ──
const top = (o, n = 40) => Object.entries(o || {}).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => '    ' + v + '  ' + k).join('\n') || '    (none)';
const sumO = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
const PINS = ['0ac7da6b1691a8e1', '1069cd7f86eed204', '9d14801a63111081'];
function mannyArms(file){
  const fs = require('fs'), os = require('os');
  const X = load(file); const H = () => JSON.parse(JSON.stringify(X.fixtures.HALF_MANNY));
  const plain = progDigest(X.buildProgram(H())); const again = progDigest(X.buildProgram(H()));
  X.eval('globalThis.__DELOAD_OFF=true;'); const dOff = progDigest(X.buildProgram(H())); X.eval('globalThis.__DELOAD_OFF=false;');
  const RAW = fs.readFileSync(file, 'utf8'); const CL = "  if(_auxFamily(name)==='core') return 0;\n"; const n = RAW.split(CL).length - 1;
  let cOff = 'CLAUSE count ' + n;
  if(n === 1){ const tmp = path.join(os.tmpdir(), 'v220_coreoff_' + process.pid + '.html'); fs.writeFileSync(tmp, RAW.replace(CL, '')); cOff = progDigest(load(tmp).buildProgram(H())); fs.rmSync(tmp); }
  const got = [plain, dOff, cOff];
  console.log('  HALF_MANNY arms ' + path.basename(file) + ' (self-stable ' + (plain === again) + '): plain ' + plain + ' | deload_off ' + dOff + ' | core_off ' + cOff + ' | vs pins ' + got.map((g, i) => g === PINS[i] ? 'EQ' : 'MOVED').join('/'));
}
function dayCard(X, cfg, w, d){
  const p = X.buildProgram(JSON.parse(JSON.stringify(cfg))); const day = p.weeks[w][d];
  console.log(`  cfg ${JSON.stringify(cfg)}\n  W${w} ${d} "${day.title}"`);
  live(day).forEach(s => console.log(`    [${s.label}]${s.superset ? ' (superset)' : ''} ` + s.items.map(i => clean(i.name) + ' :: ' + i.detail).join(' | ')));
}
(async () => {
  const IA = load(BASE);
  console.log('base ia-version', IA.version, ' lattice', LAT.length, 'configs');
  [BASE].concat(CFS).forEach(mannyArms);
  const JOBS = +(opt('--jobs') || 8);
  const pass = argv.filter((a, i) => a !== '--jobs' && argv[i - 1] !== '--jobs');
  const fs = require('fs'), os = require('os'); const outF = k => path.join(os.tmpdir(), 'v220_w' + process.pid + '_' + k + '.json');
  const runW = k => new Promise(res => { try { fs.rmSync(outF(k)); } catch(e){} const ch = cp.spawn(process.execPath, [__filename].concat(pass, ['--worker', String(k), '--n', String(JOBS), '--out', outF(k)]));
    let out = '', err = ''; ch.stdout.on('data', z => out += z); ch.stderr.on('data', z => err += z); ch.on('close', code => { let j = ''; try { j = fs.readFileSync(outF(k), 'utf8'); fs.rmSync(outF(k)); } catch(e){} res({ code, out: j, err }); }); });
  const outs = await Promise.all(Array.from({ length: JOBS }, (_, k) => runW(k)));
  outs.forEach((o, k) => { if(o.code !== 0 || !o.out){ console.log('WORKER ' + k + ' FAILED code ' + o.code + ' ' + o.err.slice(0, 2000)); process.exit(1); } });
  const R = outs.map(o => JSON.parse(o.out)).reduce(merge);
  console.log(`\n=== BASE: ${LAT.length} configs, ${R.builds} built, ${R.crash} crashed ${R.crashEx.join(' | ')}; live lift days ${R.days}`);
  console.log(`  generic same-day duplicate names: ${R.dupAllN}\n` + top(R.dupAll, 30));
  console.log(`\n  D165 days (legs Main name == an item of Leg superset A / Leg circuit): ${R.c165T} of ${sumO(R.legDen)} days carrying a Main + Leg superset A/Leg circuit`);
  console.log('   by name:\n' + top(R.c165Name) + '\n   by section:\n' + top(R.c165Sec) + '\n   by focus:\n' + top(R.c165Focus) + '\n   by experience:\n' + top(R.c165Exp) + '\n   by week:\n' + top(R.c165Week, 20));
  console.log('   by tier+injury (hits / legs-day denominator):'); Object.keys(R.legDen).sort().forEach(c => { if(R.c165[c] || /home_basic|minimal|bodyweight/.test(c)) console.log('    ' + c + ': ' + (R.c165[c] || 0) + '/' + R.legDen[c]); });
  console.log(`\n  D166 days (pull Main name == an item of Pull superset B): ${R.c166T} of ${sumO(R.pullDen)} days carrying a Main + Pull superset B`);
  console.log('   by name:\n' + top(R.c166Name) + '\n   by focus:\n' + top(R.c166Focus) + '\n   by experience:\n' + top(R.c166Exp) + '\n   by week:\n' + top(R.c166Week, 20));
  console.log('   by tier+injury (hits / pull-B denominator):'); Object.keys(R.pullDen).sort().forEach(c => { if(R.c166[c] || /home_basic|minimal|bodyweight/.test(c)) console.log('    ' + c + ': ' + (R.c166[c] || 0) + '/' + R.pullDen[c]); });
  console.log('\nREPRO D165'); { const e = R.ex165.sort((p, q) => p.li - q.li).find(e => e.ik === 'healthy' && e.eq === 'home_basic') || R.ex165[0]; if(e) dayCard(IA, LAT[e.li].cfg, e.w, e.d); else console.log('  NO D165 DAY FOUND'); }
  console.log('REPRO D166'); { const e = R.ex166.sort((p, q) => p.li - q.li).find(e => e.ik === 'healthy') || R.ex166[0]; if(e) dayCard(IA, LAT[e.li].cfg, e.w, e.d); else console.log('  NO D166 DAY FOUND'); }
  Object.keys(R.cf).forEach(f => {
    const Q = R.cf[f];
    console.log(`\n##### COUNTERFACTUAL ${f}: crash ${Q.crash}; programs moved ${Q.progMoved}/${R.builds}; _swapUniverse moved ${Q.uniMoved}; _swapUniverseByKey moved ${Q.uniKeyMoved}; other top-level fields moved ${Q.otherFieldMoved}`);
    console.log(`  days moved ${Q.dayMoved}: on a base D165 day ${Q.dayMovedT165}, on a base D166 day ${Q.dayMovedT166}, on a day carrying neither ${Q.dayMovedNoTarget}`);
    console.log(`  D165 fixed ${Q.fixed165}/${R.c165T} (still present on moved programs ${Q.left165}); D166 fixed ${Q.fixed166}/${R.c166T} (still present on moved programs ${Q.left166}); moved days that lost a section ${Q.secLost}; lost an item ${Q.itemLost}`);
    console.log('  new same-day duplicate classes on moved programs (class | cell):\n' + top(Q.newDup, 20));
    console.log('  moved programs by tier+injury:\n' + top(Q.movedByCell, 30));
    console.log('  replacements (section: before -> after):\n' + top(Q.repl, 40));
    console.log('  non-target moved days by title | cell:\n' + top(Q.nonTargetTitle, 25));
    console.log('  non-target moved days, sections that changed:\n' + top(Q.nonTargetSec, 20));
    Q.ex.forEach(e => console.log('  example ' + e.tag + ' ' + e.cell + ' ' + e.f + ' seed ' + e.seed + ' W' + e.w + ' ' + e.d + ' "' + e.title + '"\n    before: ' + e.before + '\n    after:  ' + e.after));
  });
  [['cfAA', 'cf165a', 'cf166a'], ['cfBB', 'cf165b', 'cf166b']].forEach(([cmb, s1, s2]) => {
    if(!R.cf[cmb] || !R.cf[s1] || !R.cf[s2]) return;
    const A = R.cf[s1].dayHash, B = R.cf[s2].dayHash, AB = R.cf[cmb].dayHash;
    const ka = Object.keys(A), kb = Object.keys(B), kab = Object.keys(AB);
    const both = ka.filter(k => k in B), uni = new Set(ka.concat(kb));
    const onlyC = kab.filter(k => !uni.has(k)).length, missing = [...uni].filter(k => !(k in AB)).length;
    let sameAsSingle = 0, diffFromSingle = 0;
    kab.forEach(k => { if((k in A) !== (k in B)){ if(AB[k] === (k in A ? A[k] : B[k])) sameAsSingle++; else diffFromSingle++; } });
    const cA = new Set(R.cf[s1].movedCfgIdx); const cfgBoth = R.cf[s2].movedCfgIdx.filter(i => cA.has(i)).length;
    console.log(`\nINTERACTION ${cmb} vs ${s1} U ${s2}: days moved ${s1} ${ka.length}, ${s2} ${kb.length}, by both ${both.length}, union ${uni.size}, combined ${kab.length}; combined-only days ${onlyC}; union days combined did NOT move ${missing}; single-owner days where combined == that single ${sameAsSingle}, differs ${diffFromSingle}; programs moved by both singles ${cfgBoth}`);
  });
})();
