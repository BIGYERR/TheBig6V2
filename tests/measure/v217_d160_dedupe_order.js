// V217 measure (Mode B, before-picture) — D160: deconflictAdjacentDupes reads cards D18 has not finished.
// Run: node tests/measure/v217_d160_dedupe_order.js <V215 index.html>   (base = git show 7474f06:index.html)
// Copies (source surgery, anchors count==1), all instrumented identically:
//   BASE  = V215 order: dedupe at :10848, before bodyweightSweep/unloadableRx/grammar/hotNext/prevention/D18/raceEve
//   CFa1  = dedupe call moved to directly AFTER d18LongRunDayPass (before raceEveLiftPass)
//   CFa2  = dedupe call moved to AFTER raceEveLiftPass (before singletonSupersetSweep)
//   CFb   = dedupe stays; nameSet(A) (the trigger set) is read from a D18-applied clone of the weeks
// Instrument: every rename logs {w,d,was,to,prev}; every checked pair increments a counter. Inert (checked).
// Oracles: "phantom" = the trigger name is absent from the SHIPPED previous day's items (final output);
// long-run day by _longRunTier (D18's own tier contract); lift section = items, not core, not hip
// (the V208 _liftDay definition); sets by hand parse of the detail.
const fs = require('fs'), path = require('path');
const { load, fixtures, progDigest } = require('../harness');
const SRC = path.resolve(process.argv[2] || '');
const SCR = process.env.SCR || require('os').tmpdir();
const ONLY = process.env.ONLY || '';
const html = fs.readFileSync(SRC, 'utf8');
const cnt = (s, a) => s.split(a).length - 1;
const CALL = '  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);\n';
const D18 = '  d18LongRunDayPass(weeks);', RACE = '  raceEveLiftPass(weeks, totalWeeks);';
const INA = 'const inA=nameSet(A);';
const REN = '        it.name=to;\n        if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);';
const HEAD = 'function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){';
const CLAUSE = "  if(_auxFamily(name)==='core') return 0;\n";
[CALL, D18, RACE, INA, REN, HEAD, CLAUSE].forEach(a => { if(cnt(html, a) !== 1){ console.log('ANCHOR FAIL ' + cnt(html, a) + ' ' + JSON.stringify(a.slice(0, 70))); process.exit(2); } });
console.log('base ia-version ' + (html.match(/ia-version" content="(\d+)"/) || [])[1]);
const lineOf = a => html.slice(0, html.indexOf(a)).split('\n').length;
console.log('pass order: dedupe :' + lineOf(CALL) + '  d18 :' + lineOf(D18) + '  raceEve :' + lineOf(RACE));
console.log(html.split('\n').slice(lineOf(CALL), lineOf(RACE) + 1).filter(l => /^\s*[A-Za-z_]+\(|^\s*(if|else)\b.*\w+\(weeks/.test(l)).map(l => '   | ' + l.trim().slice(0, 150)).join('\n'));
const inst = h => h.replace(INA, () => INA + ' globalThis.__DDP=(globalThis.__DDP||0)+1;')
  .replace(REN, () => REN + '\n        (globalThis.__DD||(globalThis.__DD=[])).push({w:+wB,d:dB,was:was,to:to,pw:+wA,pd:dA});');
const V = {
  BASE: inst(html),
  CFa1: inst(html).replace(CALL, () => '').replace(D18, () => D18 + '\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);'),
  CFa2: inst(html).replace(CALL, () => '').replace(RACE, () => RACE + '\n  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);'),
  // CFb: per pair, D18 applied to a copy of the CURRENT previous day (so the dedupe's own earlier renames are seen;
  // a one-shot clone at entry read stale names and fired 22 artifact renames on the first run). d18LongRunDayPass is per-day.
  CFb:  inst(html).replace(INA + ' globalThis', () => 'const inA=nameSet((function(){ if(!A) return A; const o={}; o[wA]={}; o[wA][dA]=JSON.parse(JSON.stringify(A)); d18LongRunDayPass(o); return o[wA][dA]; })()); globalThis'),
};
const wr = (n, s) => { const f = path.join(SCR, n); try { fs.unlinkSync(f); } catch(e){} fs.writeFileSync(f, s); return f; };
const IA = {}; Object.keys(V).forEach(k => { IA[k] = load(wr('v217_' + k + '.html', V[k])); });
const RAW = load(SRC);
const tierOf = RAW.eval('_longRunTier');
const cl = o => JSON.parse(JSON.stringify(o));
const WD = ['sun','mon','tue','wed','thu','fri','sat'];
function build(X, c){ X.window.__DD = []; X.window.__DDP = 0; const p = X.buildProgram(cl(c)); p.__dd = X.window.__DD; p.__ddp = X.window.__DDP; return p; }

// ── inertness + HALF_MANNY 3 arms ──
const hm = (X, off) => { X.window.__DELOAD_OFF = !!off; try { return progDigest(X.buildProgram(cl(fixtures.HALF_MANNY))); } finally { X.window.__DELOAD_OFF = false; } };
console.log('\ninstrument inert: raw ' + hm(RAW) + ' BASE ' + hm(IA.BASE) + '  raw deload-off ' + hm(RAW, true) + ' BASE ' + hm(IA.BASE, true));
console.log('HALF_MANNY arms (main / deload-off / core-off); pins 0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081');
Object.keys(V).forEach(k => { const CO = load(wr('v217_' + k + '_coreoff.html', V[k].replace(CLAUSE, () => '')));
  const a = hm(IA[k]), b = hm(IA[k], true), c = hm(CO);
  console.log('  ' + k.padEnd(5) + ' ' + a + ' / ' + b + ' / ' + c + '   ' + (a === '0ac7da6b1691a8e1' && b === '1069cd7f86eed204' && c === '9d14801a63111081' ? 'UNMOVED' : 'MOVED')); });
{ const p = build(IA.BASE, fixtures.HALF_MANNY); console.log('HALF_MANNY BASE: pairs checked ' + p.__ddp + ', renames ' + p.__dd.length); }

// ── lattices ──
const FOC6 = ['balanced','hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EQ = ['crossfit','commercial','home_full','home_basic','bodyweight'], EXP = ['beginner','intermediate','advanced'], AGE = ['18-35','36-54','55+'];
const RESTS = [['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const PLANS = ['run_5k','run_10k','run_half','run_marathon'], RACED = ['2026-12-06','2027-01-17','2027-03-28'];
const MILE = [['7','30'],['8','15'],['10','30'],['12','0']];
const EXTRAS = [{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp'},{swim:'swim_mile'},{bike:'bike_base',swim:'swim_base'}];
function nrcCfg(plan, o, i){
  const goals = {run:{id:plan,label:plan,mileBestMins:MILE[i%4][0],mileBestSecs:MILE[i%4][1],baselineDist:String([3,5,8][i%3]),baseline:[3,5,8][i%3]+'mi'}}, types = ['run'];
  if(o.ex && o.ex.bike){ types.push('bike'); goals.bike = {id:o.ex.bike,label:o.ex.bike,baselineDist:'10',baseline:'10mi'}; }
  if(o.ex && o.ex.swim){ types.push('swim'); goals.swim = {id:o.ex.swim,label:o.ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return Object.assign(cl(fixtures.HALF_MANNY), {name:'M',primaryPath:o.dated?'event':'fitness',cardioTypes:types,cardioGoals:goals,
    eventTargeted:!!o.dated,raceDate:o.dated?RACED[i%3]:'',startDate:'2026-09-21',liftingFocus:o.f,experience:o.e,ageBracket:AGE[i%3],equipment:o.q,restDays:o.r.slice(),seed:76308}); }
const L = []; let ii = 0;
for(const plan of PLANS) for(const e of EXP) for(const r of RESTS) for(const q of EQ) for(const f of FOC6) for(const dated of [true,false]) L.push({lat:'NRC', q, c:nrcCfg(plan, {e,r,q,f,dated}, ii++)});
for(const plan of PLANS) for(const ex of EXTRAS) for(const f of FOC6) for(const q of EQ) L.push({lat:'NRC multi', q, c:nrcCfg(plan, {ex,e:EXP[ii%3],r:RESTS[ii%2],q,f,dated:ii%2===0}, ii++)});
const STAND = {name:'M',primaryPath:'goal',eventTargeted:false,cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'x',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:WD.slice(),bench:185,squat:255,deadlift:315,startDate:'2026-09-21',seed:24865};
for(const g of ['run_pace_goal','run_mile_time','run_15_under10','run_base']) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
  const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e; L.push({lat:'NSW', q, c}); }
// injury modes (g210 injury cells): 5 tiers x 8 seeds x 6 regions x 2 tiers
const GOALS = [['run_5k',{}],['run_half',{}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'0'}],['run_base',{}],['run_10k',{}],['run_marathon',{}]];
const SEEDS = [76308, 1234, 4242, 9001, 31337, 555, 8086, 20260];
for(const q of EQ) for(let si = 0; si < 8; si++) for(const rg of ['shoulder','elbow','lowback','hip','knee','ankle']) for(const t of ['workaround','protect']){
  const [g, x] = GOALS[si % 6];
  L.push({lat:'injury', q, c:{ name:'M', primaryPath:'goal', cardioTypes:['run'], cardioGoals:{ run: Object.assign({ id:g, label:g, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, x) },
    eventTargeted:false, liftingFocus:'hypertrophy', experience:EXP[si % 3], ageBracket:AGE[si % 3], equipment:q, unit:'lbs', restDays:[['sun','wed'],['sat','sun']][si % 2].slice(), days:WD.slice(), bench:135, squat:155, deadlift:185, seed:SEEDS[si], injury:{region:rg,tier:t} }}); }

// ── metrics ──
const names = y => [].concat(...((y && y.sections) || []).map(s => (s.items || []).map(i => String(i.name || ''))));
const isStr = n => /stretch|mobility|90\/90|foam|worlds greatest/i.test(n || '');
const setsOf = d => { let m = /^(\d+)\s*[x×]/.exec(d || ''); if(m) return +m[1]; m = /\b(\d+)\s*sets?\b/i.exec(d || ''); return m ? +m[1] : 1; };
const liftSecs = y => ((y && y.sections) || []).filter(s => !s.core && !s.hip && (s.items || []).length);
const tOf = y => { const cd = y && !y.rest && y.cardio; return cd && !Array.isArray(cd) ? (tierOf(cd) || '') : ''; };
const bump = (o, k, n = 1) => { o[k] = (o[k] || 0) + n; };
const CFS = ['CFa1','CFa2','CFb'];
const M = {};
function seg(k){ return M[k] || (M[k] = { cfg:0, crash:0, days:0, phTrig:{}, nameDays:{}, detailOnly:{}, detailWhy:{}, pairs:{}, ren:{}, phantom:{}, lostTo:{}, lostToT:{}, vanish:{}, vanishPh:{}, appear:{}, appearVis:{}, appearTo:{}, appearOnLong:{}, chgDays:{}, dSecs:{}, dItems:{}, dSets:{}, zeroNew:{}, zeroOld:{}, byTier:{}, ex:{} }); }
function classify(p, r){ const P = p.weeks[r.pw] && p.weeks[r.pw][r.pd], B = p.weeks[r.w] && p.weeks[r.w][r.d];
  return { phantom: !names(P).includes(r.was), lost: !names(B).includes(r.to), bT: tOf(B), pT: tOf(P) }; }
const key = r => r.w + '|' + r.d + '|' + r.was;
L.forEach(x => {
  if(ONLY && x.lat !== ONLY) return;
  const S = seg(x.lat); const P = {};
  try { ['BASE'].concat(CFS).forEach(k => { P[k] = build(IA[k], x.c); }); } catch(e){ S.crash++; if(S.crash < 3) console.log('CRASH ' + x.lat + ' ' + e.message); return; }
  S.cfg++;
  ['BASE'].concat(CFS).forEach(k => { bump(S.pairs, k, P[k].__ddp); bump(S.ren, k, P[k].__dd.length);
    P[k].__dd.forEach(r => { const c = classify(P[k], r); if(c.phantom){ bump(S.phantom, k); bump(S.byTier, k + ' phantom ' + x.q); bump(S.phTrig, k + ' | prev tier ' + (c.pT || '-') + ' | ' + x.c.liftingFocus + ' | trigger "' + r.was + '" -> "' + r.to + '"'); } if(c.lost){ bump(S.lostTo, k); bump(S.lostToT, k + ' B-tier=' + (c.bT || '-')); } }); });
  const bk = new Map(P.BASE.__dd.map(r => [key(r), r]));
  CFS.forEach(k => {
    const ck = new Map(P[k].__dd.map(r => [key(r), r]));
    bk.forEach((r, kk) => { if(ck.has(kk) && ck.get(kk).to === r.to) return; bump(S.vanish, k); const c = classify(P.BASE, r); if(c.phantom) bump(S.vanishPh, k);
      if(!S.ex[k + ' vanish'] && c.phantom) S.ex[k + ' vanish'] = x.lat + ' ' + x.q + '/' + x.c.liftingFocus + ' W' + r.w + ' ' + r.d + ': V215 renamed "' + r.was + '" -> "' + r.to + '" against ' + r.pw + '|' + r.pd + ' (tier ' + (c.pT || '-') + '), which ships [' + names(P.BASE.weeks[r.pw][r.pd]).join(', ') + ']; ' + k + ' keeps "' + ((ck.get(kk) || {}).to || r.was) + '"'; });
    ck.forEach((r, kk) => { if(bk.has(kk) && bk.get(kk).to === r.to) return; bump(S.appear, k); const c = classify(P[k], r);
      if(!c.phantom) bump(S.appearVis, k); bump(S.appearTo, k + ' | ' + r.was + ' -> ' + r.to); if(c.bT) bump(S.appearOnLong, k + ' B-tier=' + c.bT + (c.lost ? ' (renamed item not shipped)' : ''));
      if(!S.ex[k + ' appear']) S.ex[k + ' appear'] = x.lat + ' ' + x.q + '/' + x.c.liftingFocus + ' W' + r.w + ' ' + r.d + ': ' + k + ' renames "' + r.was + '" -> "' + r.to + '" against ' + r.pw + '|' + r.pd + ' shipping [' + names(P[k].weeks[r.pw][r.pd]).join(', ') + ']; V215 ' + (bk.has(kk) ? 'renamed it to "' + bk.get(kk).to + '"' : 'left it') + (c.lost ? '; renamed item not shipped' : ''); });
    for(const w of Object.keys(P.BASE.weeks)) for(const d of WD){ const yb = P.BASE.weeks[w][d], yc = P[k].weeks[w] && P[k].weeks[w][d]; if(!yb) continue;
      if(k === 'CFa1') S.days++;
      if(JSON.stringify(yb) === JSON.stringify(yc)) continue; bump(S.chgDays, k);
      { const nb = names(yb).join('|'), nc = names(yc).join('|');
        if(nb !== nc) bump(S.nameDays, k); else { bump(S.detailOnly, k);
          const ib = [].concat(...(yb.sections || []).map(s => s.items || [])), ic = [].concat(...((yc && yc.sections) || []).map(s => s.items || []));
          let why = 'section fields only'; for(let i = 0; i < ib.length; i++){ if(JSON.stringify(ib[i]) !== JSON.stringify(ic[i])){ why = ib[i].name + ' :: "' + ib[i].detail + '"  =>  "' + ic[i].detail + '"';
            const tC = P[k].__dd.some(r => r.w === +w && r.d === d && r.to === ic[i].name), tB = P.BASE.__dd.some(r => r.w === +w && r.d === d && r.to === ib[i].name);
            bump(S.detailWhy, k + ' | renamed-into on this day: CF ' + tC + ', V215 ' + tB); break; } }
          bump(S.detailWhy, k + ' | ' + why.replace(/\d+/g, 'N')); } }
      const lb = liftSecs(yb), lc = liftSecs(yc);
      bump(S.dSecs, k, lc.length - lb.length);
      bump(S.dItems, k, lc.reduce((a, s) => a + s.items.length, 0) - lb.reduce((a, s) => a + s.items.length, 0));
      const st = a => a.reduce((z, s) => z + s.items.reduce((q, it) => q + (isStr(it.name) ? 0 : setsOf(it.detail)), 0), 0); bump(S.dSets, k, st(lc) - st(lb));
      if(lb.length && !lc.length) bump(S.zeroNew, k); if(!lb.length && lc.length) bump(S.zeroOld, k); }
  });
});
const pr = (t, o) => { const ks = Object.keys(o).sort(); console.log('  ' + t + (ks.length ? '' : ' (none)')); ks.forEach(k => console.log('     ' + k + ': ' + o[k])); };
const top = (t, o, n) => { const ks = Object.keys(o).sort((a, b) => o[b] - o[a]); console.log('  ' + t + ' (' + ks.length + ' distinct, top ' + n + ')'); ks.slice(0, n).forEach(k => console.log('     ' + o[k] + '  ' + k)); };
Object.keys(M).forEach(k => { const S = M[k];
  console.log('\n=== ' + k + ': ' + S.cfg + ' configs, ' + S.crash + ' crashed, ' + S.days + ' days ===');
  pr('adjacent pairs checked:', S.pairs); pr('renames:', S.ren); pr('renames whose trigger the shipped previous day does not print (phantom):', S.phantom);
  pr('phantom renames by copy x tier:', S.byTier);
  top('phantom renames by prev-day tier | focus | trigger -> rename:', S.phTrig, 20);
  pr('renamed item absent from the shipped renamed day (lost to a later pass):', S.lostTo); pr('  by the renamed day\'s long-run tier:', S.lostToT);
  pr('V215 renames that vanish under CF:', S.vanish); pr('  of them phantom on V215:', S.vanishPh);
  pr('renames that appear under CF:', S.appear); pr('  of them with the trigger printed on the shipped previous day:', S.appearVis);
  top('  what the appearing renames rename (copy | was -> to):', S.appearTo, 12);
  pr('  appearing renames landing on a long-run day:', S.appearOnLong);
  pr('days changed vs BASE:', S.chgDays); pr('  of them with an item name changed:', S.nameDays); pr('  of them detail/field-only:', S.detailOnly);
  top('  detail-only diffs (copy | first differing item: V215 detail => CF detail, digits as N):', S.detailWhy, 8); pr('lift sections delta:', S.dSecs); pr('lift items delta:', S.dItems); pr('lift sets delta:', S.dSets);
  pr('days that had lift sections on V215 and have none under CF:', S.zeroNew); pr('days that had none and gain one:', S.zeroOld);
  Object.keys(S.ex).sort().forEach(e => console.log('   EX ' + e + ': ' + S.ex[e]));
});
