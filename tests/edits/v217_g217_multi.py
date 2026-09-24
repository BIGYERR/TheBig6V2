#!/usr/bin/env python3
# V217 tests-only: the NSW multi-sport limb of g217 (gatekeeper RED -> coach re-ruled: D160 CFb STANDS and
# every knock-on class is D160's, MOVE). Config construction and the knock-on instrument are copied from
# tests/measure/v217_d160_multisport_knockons.js (LAT=gk|multi), tests/measure/v217_gk_lattice.js and the
# twins/forward-Main count gatekeeper printed; the gate reads no measure file. index.html untouched.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g217_d160_dedupe_view.js'
s = open(P, encoding='utf-8').read()

E1_A = "// VERSION PREDICATE (standing ruling 4). D160 ships on ia-version 217.\n"
E1_B = """// K LIMB, NSW multi-sport (gatekeeper went RED on it; coach re-ruled: CFb STANDS, every knock-on class is D160's).
//   Lattices: gk = gatekeeper's pace+bike slice (tests/measure/v217_gk_lattice.js construction, injury rotation
//   by the full 6,480 index; 1,080 configs); multi = measure's NSW extension, pace+bike, pace+swim,
//   pace+bike+swim, run_base+bike x 2 mile times x 7 focuses x 5 tiers x 5 rest patterns x 3 experience (4,200).
//   Instrument (measure's knock-on instrument, copied): at every trigger that reaches the candidate filter, log
//   {pair, B position, was, was-in-raw-A, was-in-D18-view-of-A, pool, top3, onB, to}; per pair, yesterday's raw
//   name set. Events compare the two logs position by position: P reverted phantom, A yesterday differs, B target
//   changed, C new rename, D a V216 rename gone that was not a phantom.
//   K0   knock-on instrument inert (HALF_MANNY raw == instrumented, both builds).
//   K1   phantoms V216 -> candidate per mix, independent oracle: the trigger is absent from the SHIPPED previous
//        day of the dedupe pair. gk pace+bike 124->0; pace+bike 163->0; pace+swim 141->0; pace+bike+swim 59->0;
//        base+bike 0->0. Config counts 1,080 / 4,200, 0 crashed.
//   K2   event classes vs V216 (3dc0146): gk P124 A18 B8 C16 D0; multi P363 A8 B30 C58 D0.
//   K3   every changed day carries exactly one class; item counts equal on every changed day; 0 _swapUniverse
//        diffs over the 5,280 program pairs of this limb (D1 covers the 8,280 above).
//   K4   calendar repeats (same accessory name on the calendar-adjacent shipped day, Monday-start, summed over
//        changed days, prev + next): gk 28->17, multi 78->16; class C days carry 0 on the candidate; the hand
//        calendar agrees with _progDayDate on every sampled day.
//   K5   SAMEDAY_TWIN_BY_VERSION: same-day duplicate names the candidate adds / removes vs V216 on changed days.
//   K6   FWD_MAIN_BY_VERSION: gk, an accessory today equals tomorrow's Main (within the Monday-start week).
//   INFO renames on the 8-day pair (_adjDayPairs: W(w) sat -> W(w+1) sun) printed, not asserted (D167 owns them).
//   Every K row is keyed on ia-version: its table row must exist (D160_MULTI_BY_VERSION for K1-K4,
//   SAMEDAY_TWIN_BY_VERSION for K5, FWD_MAIN_BY_VERSION for K6); above 217 an absent row FAILs (rulings 2/4).
//
"""

E2_A = "const ROWS = ['I0','F0'].concat(LATS.map(l => 'P1 ' + l), LATS.map(l => 'R1 ' + l), ['R2','D1','E1','W1','U1','U2','C1']);\n"
E2_B = """const KNAMES = ['K0','K1 gk','K1 multi','K2 gk','K2 multi','K3','K4 gk','K4 multi','K5 gk','K5 multi','K6'];
const ROWS = ['I0','F0'].concat(LATS.map(l => 'P1 ' + l), LATS.map(l => 'R1 ' + l), ['R2','D1','E1','W1','U1','U2','C1'], KNAMES);
// K limb era rows (coach, V217 re-ruling). A later version copies a row forward only by ruling.
const D160_MULTI_BY_VERSION = { 217: {
  phantoms: { 'gk pace+bike':[124,0], 'NSW pace+bike':[163,0], 'NSW pace+swim':[141,0], 'NSW pace+bike+swim':[59,0], 'NSW base+bike':[0,0] },
  events: { gk:{P:124,A:18,B:8,C:16,D:0}, multi:{P:363,A:8,B:30,C:58,D:0} },
  repeats: { gk:[28,17], multi:[78,16] } } };
const SAMEDAY_TWIN_BY_VERSION = {}; SAMEDAY_TWIN_BY_VERSION[217] = { gk:{add:1,remove:3}, multi:{add:4,remove:0} };   // D168: the 5 added twins accepted for V217, pinned by literal
const FWD_MAIN_BY_VERSION = {}; FWD_MAIN_BY_VERSION[217] = 609;   // gk: accessory today == Main tomorrow, pre-existing (V216 607), handed to D167
"""

E3_A = "ok('C1 buildProgram leaves every lattice cfg byte-identical', cfgMut === 0, cfgMut + (cfgEx ? ' e.g. ' + cfgEx : ''));\ndone();\n"
E3_B = r"""ok('C1 buildProgram leaves every lattice cfg byte-identical', cfgMut === 0, cfgMut + (cfgEx ? ' e.g. ' + cfgEx : ''));

// ── K LIMB: NSW multi-sport ──────────────────────────────────────────────────────────────
{ const KROW = D160_MULTI_BY_VERSION[VER], TWIN = SAMEDAY_TWIN_BY_VERSION[VER], FWD = FWD_MAIN_BY_VERSION[VER];
  const IN6 = 'const inA=nameSet(A);', IN7 = 'const inA=nameSet(_d18View(A, wA, dA));', EMP = 'if(!cands.length) return;', KREN = '        it.name=to;\n';
  const VIEW6 = '(function(){const o={};o[wA]={};o[wA][dA]=JSON.parse(JSON.stringify(A));d18LongRunDayPass(o);return o[wA][dA];})()', VIEW7 = '_d18View(A, wA, dA)';
  const koInst = (h, IN, VIEW) => h.replace(IN, () => IN + ' const __pre=nameSet(A), __vw=nameSet(' + VIEW + '); (globalThis.__PA||(globalThis.__PA={}))[wA+"|"+dA+">"+wB+"|"+dB]=Object.keys(__pre).sort().join(",");')
    .replace(EMP, () => 'const __e={pw:+wA,pd:dA,w:+wB,d:dB,si:B.sections.indexOf(sec),ii:ii,was:it.name,pre:!!__pre[it.name.toLowerCase()],vw:!!__vw[it.name.toLowerCase()],n:cands.length,top:cands.slice(0,3),onB:Object.keys(onB).sort().join(","),to:null}; (globalThis.__TR||(globalThis.__TR=[])).push(__e); ' + EMP)
    .replace(KREN, () => KREN + '        __e.to=to;\n');
  let KO6 = null, KO7 = null, kErr = '', kMode = '';
  if(!BASE) kErr = 'no V216 baseline: ' + baseErr;
  else if(!KROW && !TWIN && FWD === undefined) kErr = 'NO ROW for ia-version ' + VER + ' in D160_MULTI_BY_VERSION, SAMEDAY_TWIN_BY_VERSION and FWD_MAIN_BY_VERSION (rulings 2/4)';
  else { const h6 = fs.readFileSync(path.join(TMP, 'v216_raw.html'), 'utf8'), h7 = RAW.html;
    const i7 = cnt(h7, IN7) === 1 ? [IN7, VIEW7] : cnt(h7, IN6) === 1 ? [IN6, VIEW6] : null;
    kMode = !i7 ? '' : i7[0] === IN7 ? 'candidate trigger reads the D18 view' : 'candidate trigger reads the raw day';
    const bad = [[h6, IN6], [h6, EMP], [h7, EMP], [h6, KREN], [h7, KREN]].filter(z => cnt(z[0], z[1]) !== 1).map(z => JSON.stringify(z[1]) + ' count ' + cnt(z[0], z[1]));
    if(!i7) bad.push('candidate trigger line matches neither form');
    if(bad.length) kErr = 'anchor: ' + bad.join('; ');
    else { const f6 = path.join(TMP, 'ko216.html'), f7 = path.join(TMP, 'ko217.html');
      fs.writeFileSync(f6, koInst(h6, IN6, VIEW6)); fs.writeFileSync(f7, koInst(h7, i7[0], i7[1])); KO6 = load(f6); KO7 = load(f7); } }
  if(kErr) KNAMES.forEach(r => ok(r + ' (' + kErr + ')', false));
  else {
    const ISO = ['mon','tue','wed','thu','fri','sat','sun'], OFF = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
    const dix = (w, d) => (w - 1) * 7 + OFF[d];
    const lc = v => String(v == null ? '' : v).toLowerCase();
    const nK = y => [].concat(...((y && !y.rest && y.sections) || []).map(z => (z.items || []).map(i => String(i.name || ''))));
    const isStrK = n => /stretch|mobility|90\/90|foam|worlds greatest|breath/i.test(n || '');
    const accK = y => new Set(nK(y).map(lc).filter(n => n && !isStrK(n)));
    const svg = v => String(v || '').replace(/<svg[\s\S]*?<\/svg>\s*/g, '');
    const MAINRX = /^(main|primer|power)/i;
    const mainName = y => { const z = ((y && y.sections) || []).find(q => MAINRX.test(q.label || '')); return z && z.items && z.items[0] ? lc(svg(z.items[0].name)) : null; };
    const accF = y => { const out = []; ((y && y.sections) || []).forEach(z => { if(MAINRX.test(z.label || '')) return; (z.items || []).forEach(i => out.push(lc(svg(i.name)))); }); return out; };
    const calOf = p => { const m = {}; for(const w of Object.keys(p.weeks)) for(const d of ISO) m[dix(+w, d)] = { w:+w, d }; return m; };
    const kb = (X, c) => { X.window.__TR = []; X.window.__PA = {}; const p = X.buildProgram(cl(c)); const r = { p, tr: X.window.__TR || [], pa: X.window.__PA || {} }; X.window.__TR = []; X.window.__PA = {}; return r; };
    const dig6 = progDigest(KO6.buildProgram(cl(fixtures.HALF_MANNY))), dig7 = progDigest(KO7.buildProgram(cl(fixtures.HALF_MANNY))), raw7 = progDigest(RAW.buildProgram(cl(fixtures.HALF_MANNY)));
    // lattices (copied): gk from tests/measure/v217_gk_lattice.js, pace+bike only, injury by the full 6,480 index
    const KL = [];
    { const ALL = ['sun','mon','tue','wed','thu','fri','sat'], mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
      const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
        {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}},
        {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
        {k:'mara', types:['run'], goals:{run:{id:'run_marathon', label:'M', ...mb, baselineDist:'8', baseline:'8mi'}}},
        {k:'pace+bike', types:['run','bike'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}},
        {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
      const INJ = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}];
      const all = []; for(const G of GOALS) for(const eq of ['commercial','crossfit','home_full','home_basic','bodyweight']) for(const fo of ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss']) for(const ex of ['beginner','intermediate','advanced']) for(const rs of [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']]) for(const seed of [24865, 76308, 99991]) all.push({G, eq, fo, ex, rs, seed});
      all.forEach((x, i) => { if(x.G.k !== 'pace+bike') return; const inj = INJ[i % 4];
        const c = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:cl(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:'18-35', equipment:x.eq, unit:'lbs', restDays:x.rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
        if(inj) c.injury = inj; KL.push({lim:'gk', mix:'gk pace+bike', c}); }); }
    // multi from tests/measure/v217_d160_multisport_knockons.js (LAT=multi)
    { const MIX = [['pace+bike','run_pace_goal',{bike:1}],['pace+swim','run_pace_goal',{swim:1}],['pace+bike+swim','run_pace_goal',{bike:1,swim:1}],['base+bike','run_base',{bike:1}]];
      for(const [mk, g, o] of MIX) for(const mm of [['8','15'],['12','0']]) for(const f of FOC6.concat(['fatloss'])) for(const q of EQ) for(const r of RESTS) for(const e of EXP){
        const c = cl(STAND); c.cardioGoals.run.id = g; c.cardioGoals.run.mileBestMins = mm[0]; c.cardioGoals.run.mileBestSecs = mm[1]; c.liftingFocus = f; c.equipment = q; c.restDays = r.slice(); c.experience = e;
        if(o.bike){ c.cardioTypes.push('bike'); c.cardioGoals.bike = {id:'bike_base',label:'Bb',baselineDist:'10',baseline:'10mi'}; }
        if(o.swim){ c.cardioTypes.push('swim'); c.cardioGoals.swim = {id:'swim_base',label:'Sb',baselineDist:'1000',baseline:'1000m'}; }
        KL.push({lim:'multi', mix:'NSW ' + mk, c}); } }
    const KCOUNT = { gk:1080, multi:4200 };
    const KS = {}, kz = l => KS[l] || (KS[l] = { cfg:0, crash:0, progs:0, ev:{P:0,A:0,B:0,C:0,D:0}, days:{}, one:0, itemCnt:0, rep6:0, rep7:0, repC7:0, add:0, rem:0, swu:0, pairs:0, ex:'' });
    const PH = {}, GAP = {}, FWDN = [0, 0]; let dateChk = 0, dateBad = 0;
    const gd = RAW.eval('_progDayDate');
    KL.forEach((x, idx) => {
      const s = kz(x.lim); let a, b;
      try { a = kb(KO6, x.c); b = kb(KO7, x.c); } catch(e){ s.crash++; if(s.crash < 3) console.log('CRASH K ' + x.mix + ' ' + e.message); return; }
      s.cfg++; s.pairs++;
      const kex = m => { if(!s.ex) s.ex = x.mix + ' ' + x.c.equipment + '/' + x.c.liftingFocus + '/' + x.c.experience + '/' + x.c.restDays.join('') + ': ' + m; };
      const P = PH[x.mix] || (PH[x.mix] = [0, 0, 0, 0]), G = GAP[x.mix] || (GAP[x.mix] = {});
      [[a, 0], [b, 1]].forEach(([r, k]) => r.tr.forEach(e => { if(!e.to) return;
        if(!nK(dayOf(r.p, e.pw, e.pd)).map(lc).includes(lc(e.was))) P[k]++;
        if(e.pre && !e.vw) P[k + 2]++;
        const gk = (k ? 'cand' : 'V216') + ' gap ' + (dix(e.w, e.d) - dix(e.pw, e.pd)); G[gk] = (G[gk] || 0) + 1; }));
      if(idx % 97 === 0 && x.c.startDate){ const pp = {startDate:x.c.startDate}, mon0 = gd(pp, 1, 'mon');
        for(const w of Object.keys(b.p.weeks)) for(const d of ISO){ dateChk++; const dt = gd(pp, +w, d); if(!dt || Math.round((dt - mon0) / 864e5) !== dix(+w, d)) dateBad++; } }
      if(x.lim === 'gk') for(const w of Object.keys(a.p.weeks)) for(let i = 1; i < 7; i++){ const d0 = ISO[i - 1], d1 = ISO[i];
        [[a.p, 0], [b.p, 1]].forEach(([p, k]) => { const y0 = dayOf(p, w, d0), y1 = dayOf(p, w, d1); if(!y0 || !y1 || y0.rest || y1.rest) return; const m = mainName(y1); if(m && accF(y0).includes(m)) FWDN[k]++; }); }
      const posKey = e => e.w + '|' + e.d + '|' + e.si + '|' + e.ii, pairK = e => e.pw + '|' + e.pd + '>' + e.w + '|' + e.d;
      const m6 = new Map(a.tr.map(e => [posKey(e), e])), m7 = new Map(b.tr.map(e => [posKey(e), e])), dayCls = {};
      new Set([...m6.keys(), ...m7.keys()]).forEach(k => { const e6 = m6.get(k), e7 = m7.get(k), o6 = e6 ? e6.to : null, o7 = e7 ? e7.to : null; if(o6 === o7) return;
        const e = e6 || e7, aDiff = a.pa[pairK(e)] !== b.pa[pairK(e)];
        const c = (o6 && !o7 && e6.pre && !e6.vw && !aDiff) ? 'P' : aDiff ? 'A' : (o6 && o7) ? 'B' : (o7 && !o6) ? 'C' : 'D';
        s.ev[c]++; (dayCls[e.w + '|' + e.d] = dayCls[e.w + '|' + e.d] || new Set()).add(c); });
      const C6 = calOf(a.p), C7 = calOf(b.p), nb = (C, p, j) => { const z = C[j]; return z ? dayOf(p, z.w, z.d) : null; };
      const shared = (y, z) => { const s2 = accK(z); return [...accK(y)].filter(n => s2.has(n)).length; };
      const dup = n => n.length - new Set(n.map(lc)).size;
      let chg = 0;
      for(const w of Object.keys(b.p.weeks)) for(const d of ISO){ const y6 = dayOf(a.p, w, d), y7 = dayOf(b.p, w, d); if(JSON.stringify(y6) === JSON.stringify(y7)) continue; chg++;
        const cs = dayCls[w + '|' + d] ? [...dayCls[w + '|' + d]].sort().join('+') : '';
        if(cs.length !== 1){ s.one++; kex('W' + w + ' ' + d + ' changed day classes "' + cs + '"'); } else s.days[cs] = (s.days[cs] || 0) + 1;
        const n6 = nK(y6), n7 = nK(y7); if(n6.length !== n7.length){ s.itemCnt++; kex('W' + w + ' ' + d + ' item count ' + n6.length + ' -> ' + n7.length); }
        if(dup(n7) > dup(n6)) s.add++; if(dup(n7) < dup(n6)) s.rem++;
        const di = dix(+w, d), r6 = shared(y6, nb(C6, a.p, di - 1)) + shared(y6, nb(C6, a.p, di + 1)), r7 = shared(y7, nb(C7, b.p, di - 1)) + shared(y7, nb(C7, b.p, di + 1));
        s.rep6 += r6; s.rep7 += r7; if(cs === 'C') s.repC7 += r7; }
      if(chg) s.progs++;
      if(JSON.stringify(a.p._swapUniverse) !== JSON.stringify(b.p._swapUniverse)){ s.swu++; kex('_swapUniverse differs'); }
    });
    const LIMS = ['gk','multi'];
    LIMS.forEach(l => { const s = kz(l); console.log('  K ' + l + ': ' + s.cfg + ' configs, ' + s.crash + ' crashed, ' + s.progs + ' programs changed, changed days by class ' + JSON.stringify(s.days)); });
    Object.keys(PH).forEach(m => console.log('  K ' + m + ': phantoms (shipped previous day) V216 ' + PH[m][0] + ' cand ' + PH[m][1] + ' | (instrument: raw A yes, D18 view no) V216 ' + PH[m][2] + ' cand ' + PH[m][3]));
    Object.keys(GAP).forEach(m => console.log('  INFO ' + m + ' renames by dedupe-pair calendar gap (8 = W(w) sat -> W(w+1) sun, D167, not asserted): ' + JSON.stringify(GAP[m])));
    const noRow = r => ok(r + ' NO ROW for ia-version ' + VER + ' (standing rulings 2/4: add the ruled row)', false);
    ok('K0 knock-on instrument inert: V216 HALF_MANNY instrumented ' + dig6 + ' == raw ' + BASE_RAW_DIGEST + ', candidate instrumented ' + dig7 + ' == raw ' + raw7 + ' [' + kMode + ']', dig6 === BASE_RAW_DIGEST && dig7 === raw7);
    LIMS.forEach(l => { if(!KROW) return noRow('K1 ' + l); const s = kz(l), T = KROW.phantoms, mixes = Object.keys(T).filter(m => (/^gk /.test(m) ? 'gk' : 'multi') === l);
      const good = s.cfg === KCOUNT[l] && s.crash === 0 && mixes.length > 0 && mixes.every(m => PH[m] && PH[m][0] === T[m][0] && PH[m][1] === T[m][1]);
      ok('K1 ' + l + ' phantoms V216 -> candidate, trigger absent from the shipped previous day (' + s.cfg + '/' + KCOUNT[l] + ' configs, ' + s.crash + ' crashed): ' + mixes.map(m => m + ' ' + (PH[m] || ['-'])[0] + '->' + (PH[m] || ['-', '-'])[1] + ' (' + T[m][0] + '->' + T[m][1] + ')').join(', '), good); });
    LIMS.forEach(l => { if(!KROW) return noRow('K2 ' + l); const s = kz(l), T = KROW.events[l];
      ok('K2 ' + l + ' event classes vs V216: ' + JSON.stringify(s.ev) + ' (' + JSON.stringify(T) + ')', JSON.stringify(s.ev) === JSON.stringify(T)); });
    if(!KROW) noRow('K3'); else { const t = k => LIMS.reduce((n, l) => n + kz(l)[k], 0);
      ok('K3 every changed day in exactly one class (' + t('one') + ' not), item counts equal (' + t('itemCnt') + ' differ), _swapUniverse diffs ' + t('swu') + ' over ' + t('pairs') + ' program pairs' + LIMS.map(l => kz(l).ex ? ' e.g. ' + kz(l).ex : '').join(''),
        t('one') === 0 && t('itemCnt') === 0 && t('swu') === 0 && t('pairs') === KCOUNT.gk + KCOUNT.multi); }
    LIMS.forEach(l => { if(!KROW) return noRow('K4 ' + l); const s = kz(l), T = KROW.repeats[l];
      ok('K4 ' + l + ' calendar-adjacent repeats on changed days V216 ' + s.rep6 + ' -> candidate ' + s.rep7 + ' (' + T[0] + ' -> ' + T[1] + '), class C days on the candidate ' + s.repC7 + ' (0); calendar vs _progDayDate ' + (dateChk - dateBad) + '/' + dateChk,
        s.rep6 === T[0] && s.rep7 === T[1] && s.repC7 === 0 && dateChk > 0 && dateBad === 0); });
    LIMS.forEach(l => { if(!TWIN) return noRow('K5 ' + l); const s = kz(l), T = TWIN[l];
      ok('K5 ' + l + ' same-day twins the candidate adds ' + s.add + ' (' + T.add + '), removes ' + s.rem + ' (' + T.remove + ')', s.add === T.add && s.rem === T.remove); });
    if(FWD === undefined) noRow('K6'); else ok('K6 gk accessory today == Main tomorrow: candidate ' + FWDN[1] + ' (' + FWD + '), V216 ' + FWDN[0], FWDN[1] === FWD);
  } }
done();
"""

for i, (a, b) in enumerate([(E1_A, E1_B + E1_A), (E2_A, E2_B), (E3_A, E3_B)]):
    n = s.count(a)
    if n != 1: print('ABORT: E%d anchor count %d' % (i + 1, n)); sys.exit(2)
for tbl in ('D160_MULTI_BY_VERSION', 'SAMEDAY_TWIN_BY_VERSION', 'FWD_MAIN_BY_VERSION'):
    if s.count(tbl) != 0: print('ABORT: %s already present' % tbl); sys.exit(2)
for i, (a, b) in enumerate([(E1_A, E1_B + E1_A), (E2_A, E2_B), (E3_A, E3_B)]):
    s = s.replace(a, b, 1); print('applied E%d' % (i + 1))
open(P, 'w', encoding='utf-8').write(s); print('written')
