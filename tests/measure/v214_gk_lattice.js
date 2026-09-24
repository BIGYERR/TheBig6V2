// v214_gk_lattice.js — gatekeeper differential + identity fuzz for V214 (D158: the test eve carries a shakeout).
// node v214_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
function combos(a, k){ const out = []; (function rec(i, cur){ if(cur.length === k){ out.push(cur.slice()); return; } for(let j = i; j < a.length; j++){ cur.push(a[j]); rec(j+1, cur); cur.pop(); } })(0, []); return out; }
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const pace = {id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const mile = {id:'run_mile_time', label:'M', ...mb, targetDist:'1', targetMins:'7', targetSecs:'0', paceUnit:'mi'};
const GOALS = [
  {k:'pace', types:['run'], goals:{run:pace}, nsw:true}, {k:'mile', types:['run'], goals:{run:mile}, nsw:true},
  {k:'pace+bike', types:['run','bike'], goals:{run:pace, bike:{id:'bike_base', label:'B'}}, nsw:true},
  {k:'pace+swim', types:['run','swim'], goals:{run:pace, swim:{id:'swim_base', label:'S'}}, nsw:true},
  {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, nrc:true},
  {k:'10k+bike', types:['run','bike'], goals:{run:{id:'run_10k', label:'10', ...mb}, bike:{id:'bike_base', label:'B'}}, nrc:true},
  {k:'base', types:['run'], goals:{run:{id:'run_base', label:'Ba', ...mb}}},
];
const CALS = [...combos(DAYS, 3), ...combos(DAYS, 4), ...combos(DAYS, 5), ...combos(DAYS, 6).filter((_, i) => i % 2 === 0)];
const INJ = [null, null, null, {region:'knee', halfstep:true}, {region:'lowback', tier:'workaround'}, {region:'shoulder', tier:'protect'}];
const START = new Date(2026, 9, 5);
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const R = {shard:SH, configs:0, selfBad:0, crash:{both:0,c:[],b:[]}, mut:[0,0], cls:{}, uncl:0, unclEx:[], orc:{}, orcEx:[]};
const bump = k => R.cls[k] = (R.cls[k]||0) + 1; const O = (k, n = 1) => R.orc[k] = (R.orc[k]||0) + n; const oex = s => { if(R.orcEx.length < 16) R.orcEx.push(s); };
const cards = x => x ? [].concat(x.cardio || []).filter(Boolean) : [];
const isLift = s => !!s && (s.items||[]).length && !/mobility|stretch|taper/i.test(s.label||'');
const hardRun = c => c && c.type === 'run' && (['int','chi','long','steady'].includes(c.dose && c.dose.key) || !!c.legLoad) && !/TIME TRIAL/.test(c.subtype||'');
let idx = -1;
for(const G of GOALS) for(const cal of CALS) for(const seed of [24865]) {
  idx++; if(idx % +NS !== +SH) continue;
  const rest = ALL.filter(d => !cal.includes(d)), inj = INJ[idx % INJ.length];
  const base = {name:'GK', primaryPath:'event', cardioTypes:G.types.slice(), cardioGoals:clone(G.goals), liftingFocus:['balanced','strength','support_prevention'][idx % 3], experience:['beginner','intermediate','advanced'][(idx>>1) % 3], ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays:rest, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:iso(START), seed};
  if(inj) base.injury = inj;
  const variants = [];
  variants.push({k:'undated', cfg:{...base, eventTargeted:false, raceDate:''}});
  if(G.nsw){ for(const tw of [1, 2, 3, 5, 8]) for(const wd of [0, 1, 3, 5, 6]){ const d = new Date(START); d.setDate(d.getDate() + 7*(tw-1) + wd); variants.push({k:'tw' + tw + DAYS[wd], tw, T:DAYS[wd], cfg:{...base, eventTargeted:true, raceDate:iso(d), _testWeek:tw, _raceDateCappedWeeks:tw}}); } }
  else if(G.nrc){ variants.push({k:'race', cfg:{...base, eventTargeted:true, raceDate:'2026-12-06'}}); }
  for(const V of variants){
    const tag = `${G.k}|${cal.join('')}|${JSON.stringify(inj)}|${V.k}`; R.configs++;
    const tb = IA => { const cc = clone(V.cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(V.cfg)}; } catch(e){ return {p:{crash:String(e.message)}}; } };
    const b = tb(B), b2 = tb(B2), c = tb(C); if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
    if(canon(b.p) !== canon(b2.p)) R.selfBad++;
    if(b.p.crash && c.p.crash){ R.crash.both++; continue; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); continue; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); continue; }
    const topOf = p => { const o = {}; for(const k of Object.keys(p)) if(!['weeks','cfg'].includes(k)) o[k] = p[k]; return canon(o); };
    if(!V.tw){ if(canon(b.p) === canon(c.p)) bump('identical ' + (G.nrc ? 'NRC race pin / undated' : 'undated')); else { R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' moved'); } continue; }
    // dated NSW: the eve, across the week boundary
    const flat = []; for(const w of Object.keys(c.p.weeks).map(Number).sort((a,b)=>a-b)) for(const d of DAYS) flat.push({w, d});
    const ti = flat.findIndex(z => z.w === V.tw && z.d === V.T);
    const E = ti >= 1 ? flat[ti-1] : null, T2 = ti >= 2 ? flat[ti-2] : null;
    const eveTrain = !!E && cal.includes(E.d);
    const excl = !!inj && ['easy','noimpact','noimpact_swim','reduce'].includes((C.eval('injuryPlan')(V.cfg) || {}).cardioMode);
    // oracle on V214
    const tday = c.p.weeks[V.tw][V.T]; const trials = []; for(const z of flat){ cards(c.p.weeks[z.w][z.d]).forEach(x => { if(/TIME TRIAL/.test(x.subtype||'')) trials.push(z.w + z.d); }); }
    if(!excl){ O('trial checks'); if(!(trials.length === 1 && trials[0] === V.tw + V.T)){ O('trial not on the test day'); oex(tag + ' trials ' + trials.join(',')); } }
    if(E){ const ed = c.p.weeks[E.w][E.d]; const cs = cards(ed);
      if(eveTrain && excl){ O('excluded-mode eves (parked test: handled as V213)'); }
      else if(eveTrain){ O('training-day eves'); const ok = cs.length === 1 && cs[0].type === 'run' && /^Long Slow Distance/.test(cs[0].subtype||'') && !cs[0].legLoad && (excl || (cs[0].dose && cs[0].dose.key === 'easy')) && !(ed.sections||[]).some(isLift);
          const okInj = excl && cs.length === 1 && cs[0].type === 'run' && !cs[0].legLoad && !(ed.sections||[]).some(isLift);
          if(!(ok || okInj)){ O('eve without a lone easy shakeout'); oex(tag + ' eve ' + E.w + E.d + ' ' + cs.map(x => x.type + '/' + x.subtype + '/' + (x.dose && x.dose.key) + (x.legLoad ? '/LL' : '')).join('+') + ' lifts ' + (ed.sections||[]).filter(isLift).map(s => s.label).join('/')); }
          if(ok && !excl){ // dose = that week's easy run (another easy LSD in the same week, if the week deals one)
            const other = DAYS.filter(d => d !== E.d).map(d => cards(c.p.weeks[E.w][d]).find(x => x.type === 'run' && x.dose && x.dose.key === 'easy' && /^Long Slow Distance/.test(x.subtype||'') && !x.legLoad)).filter(Boolean);
            if(other.length){ O('eve dose compared'); if(!other.some(x => canon(x.dose) === canon(cs[0].dose))){ O('eve dose differs from the week easy run'); oex(tag + ' eve dose ' + canon(cs[0].dose) + ' vs ' + canon(other[0].dose)); } } } }
      else { O('rest-day eves'); if(cs.length || !(ed ? ed.rest || !(ed.sections||[]).some(isLift) : true)){ O('rest-day eve not rest'); oex(tag + ' rest eve ' + E.w + E.d + ' ' + cs.map(x => x.subtype).join('+')); } } }
    if(T2){ const td = c.p.weeks[T2.w][T2.d]; if(td){ if(cards(td).some(hardRun)){ O('hard at T-2'); oex(tag + ' hard T-2'); } if(!excl && (td.sections||[]).some(isLift)){ O('lift at T-2'); oex(tag + ' lift T-2 ' + (td.sections||[]).filter(isLift).map(s => s.label).join('/')); } } }
    if(E){ const ed = c.p.weeks[E.w][E.d]; if(ed && cards(ed).some(hardRun)){ O('hard at T-1'); oex(tag + ' hard T-1'); } }
    // differential vs V213
    if(excl){ if(canon(b.p) === canon(c.p)) bump('excluded mode identical to V213'); else { R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' excluded mode moved'); } continue; }
    if(topOf(b.p) !== topOf(c.p)){ const bt = JSON.parse(topOf(b.p)), ct = JSON.parse(topOf(c.p)); const fs = Object.keys(bt).filter(f => JSON.stringify(bt[f]) !== JSON.stringify(ct[f]));
      if(fs.length === 1 && fs[0] === 'legRecoveryNote') bump('legRecoveryNote follows placement (V208 precedent)'); else { R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' top ' + fs.join(',')); } }
    let moved = false;
    for(const z of flat){ const bd = b.p.weeks[z.w] && b.p.weeks[z.w][z.d], cd = c.p.weeks[z.w][z.d]; if(canon(bd) === canon(cd)) continue; moved = true;
      if(E && z.w === E.w && z.d === E.d) bump('eve day (D158)');
      else if(T2 && z.w === T2.w && z.d === T2.d && bd && cd && canon({...bd, title:null}) === canon({...cd, title:null}) && bd.title === 'Shakeout' && cd.title === 'Easy Run') bump('T-2 retitle Shakeout -> Easy Run (card unchanged)');
      else if(flat.findIndex(q => q.w === z.w && q.d === z.d) <= ti - 3 && bd && cd && canon(bd.cardio || null) === canon(cd.cardio || null)) bump('lift-role re-deal at T-3 or earlier (coach: accepted)');
      else { R.uncl++; R.defectAtT = (R.defectAtT||0) + 1; if(R.unclEx.length < 8) R.unclEx.push(tag + ' W' + z.w + z.d + ' (T ' + V.tw + V.T + ', offset ' + (flat.findIndex(q => q.w === z.w && q.d === z.d) - ti) + ') base ' + (bd && bd.title) + ' ' + cards(bd).map(x => x.subtype).join('+') + ' || cand ' + (cd && cd.title) + ' ' + cards(cd).map(x => x.subtype).join('+')); } }
    if(!moved) bump('dated program identical');
  }
}
console.log(JSON.stringify(R));
