// v213_gk_lattice.js — gatekeeper differential + identity fuzz for V213 (D113a three-run pace week, D146 multi-sport routing, spacer fallback).
// node v213_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const RUN = {
  pace:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'},
  mile:{id:'run_mile_time', label:'M', ...mb, targetDist:'1', targetMins:'7', targetSecs:'0', paceUnit:'mi'},
  base:{id:'run_base', label:'B', ...mb},
  '5k':{id:'run_5k', label:'5', ...mb}, '10k':{id:'run_10k', label:'10', ...mb},
  half:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}, mara:{id:'run_marathon', label:'Ma', ...mb, baselineDist:'8', baseline:'8mi'} };
const OTHER = { bike:{id:'bike_base', label:'Bb'}, swim:{id:'swim_base', label:'Sb'}, s500:{id:'swim_500_time', label:'S5', swimUnit:'yd', baseMins:'9', baseSecs:'30', targetMins:'8', targetSecs:'30'} };
const GOALS = [];
for(const r of Object.keys(RUN)) GOALS.push({k:r, types:['run'], goals:{run:RUN[r]}, fam: ['pace','mile'].includes(r) ? 'pace' : r === 'base' ? 'base' : 'nrc'});
for(const r of ['pace','half','10k']) for(const o of ['bike','swim']) GOALS.push({k:r + '+' + o, types:['run', o], goals:{run:RUN[r], [o]:OTHER[o]}, fam: r === 'pace' ? 'pace-ms' : 'nrc-ms'});
GOALS.push({k:'bike', types:['bike'], goals:{bike:OTHER.bike}, fam:'other'}); GOALS.push({k:'swim', types:['swim'], goals:{swim:OTHER.swim}, fam:'other'}); GOALS.push({k:'s500', types:['swim'], goals:{swim:OTHER.s500}, fam:'other'});
// calendars: every 3-training-day calendar (35), plus every 4-day (35) and a set of 5- and 6-day ones
function combos(a, k){ const out = []; (function rec(i, cur){ if(cur.length === k){ out.push(cur.slice()); return; } for(let j = i; j < a.length; j++){ cur.push(a[j]); rec(j+1, cur); cur.pop(); } })(0, []); return out; }
const CALS = [...combos(DAYS, 3), ...combos(DAYS, 4), ...combos(DAYS, 5).filter((_, i) => i % 3 === 0), ...combos(DAYS, 6).filter((_, i) => i % 2 === 0)];
const INJ = [null, {region:'lowback',tier:'workaround'}, {region:'knee',tier:'protect'}, {region:'lowback',tier:'protect'}, {region:'ankle',tier:'workaround'}, {region:'shoulder',tier:'protect'}, {region:'knee',halfstep:true}];
const EXCL = new Set(['easy','noimpact','noimpact_swim','reduce']);
const R = {shard:SH, configs:0, selfBad:0, crash:{both:0,c:[],b:[]}, mut:[0,0], cls:{}, uncl:0, unclEx:[], orc:{}, orcEx:[]};
const bumpC = k => R.cls[k] = (R.cls[k]||0) + 1;
const O = (k, n = 1) => R.orc[k] = (R.orc[k]||0) + n;
const oex = s => { if(R.orcEx.length < 14) R.orcEx.push(s); };
const cardioOf = p => { const o = {}; for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const x = p.weeks[w][d]; o[w+d] = x ? canon(x.cardio || null) : 'none'; } return canon(o); };
const liftOf = p => { const o = {}; for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const x = p.weeks[w][d]; if(x){ const y = clone(x); delete y.cardio; o[w+d] = canon(y); } } return canon(o); };
const topOf = p => { const o = {}; for(const k of Object.keys(p)) if(!['weeks','cfg'].includes(k)) o[k] = p[k]; return canon(o); };
// independent hardness: NSW by dose.key, NRC by name (Long Run, Speed/Tempo/Interval/Hill/Fartlek/Race/Time Trial)
const runsOf = (p, w) => DAYS.map((d, i) => { const x = p.weeks[w] && p.weeks[w][d]; const cs = x ? [].concat(x.cardio || []).filter(c => c && c.type === 'run' && !/^cross-train/i.test(c.subtype||'')) : []; return cs.length ? {d, i, c: cs[0]} : null; }).filter(Boolean);
const hardOf = c => { const k = c.dose && c.dose.key; if(k) return ['int','chi','long','steady'].includes(k) ? k : null;
  const s = String(c.subtype||''); if(/^long run/i.test(s)) return 'long'; if(/speed|tempo|interval|hill|fartlek|race day|time trial/i.test(s)) return 'speed'; return null; };
function untol(p){ let n = 0; const ws = Object.keys(p.weeks).map(Number).sort((a,b)=>a-b); let prev = null;
  for(const w of ws){ for(const d of DAYS){ const x = p.weeks[w][d]; const cs = x ? [].concat(x.cardio || []).filter(c => c && c.type === 'run') : []; const h = cs.length ? hardOf(cs[0]) : null;
      if(h && prev) n++; prev = h; } } return n; }
function longLast(p){ let bad = 0; for(const w of Object.keys(p.weeks)){ const rs = runsOf(p, w); if(!rs.length) continue; const li = rs.findIndex(r => hardOf(r.c) === 'long'); if(li >= 0 && li !== rs.length - 1) bad++; } return bad; }
const all = [];
for(const G of GOALS) for(const cal of CALS) for(const seed of [24865, 76308]) all.push({G, cal, seed});
all.forEach((x, idx) => { if(idx % +NS !== +SH) return;
  const inj = INJ[idx % INJ.length];
  const cfg = {name:'GK', primaryPath:'event', eventTargeted: false, raceDate:'', cardioTypes:x.G.types.slice(), cardioGoals:clone(x.G.goals), liftingFocus:['balanced','strength','support_prevention'][idx % 3], experience:['beginner','intermediate','advanced'][(idx >> 2) % 3], ageBracket:'18-35', equipment:'commercial', unit:'lbs', restDays: ALL.filter(d => !x.cal.includes(d)), days: ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  if(inj) cfg.injury = inj;
  const mode = inj ? (C.eval('injuryPlan')(cfg) || {}).cardioMode : null;
  const excl = EXCL.has(mode);
  const tag = `${x.G.k}|${x.cal.join('')}|${x.seed}|${JSON.stringify(inj)}(${mode})`; R.configs++;
  const tb = IA => { const cc = clone(cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(cfg)}; } catch(e){ return {p:{crash:String(e.message)}}; } };
  const b = tb(B), b2 = tb(B2), c = tb(C); if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
  if(canon(b.p) !== canon(b2.p)) R.selfBad++;
  if(b.p.crash && c.p.crash){ R.crash.both++; return; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); return; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); return; }
  const same = canon(b.p) === canon(c.p), cSame = cardioOf(b.p) === cardioOf(c.p), lSame = liftOf(b.p) === liftOf(c.p), tSame = topOf(b.p) === topOf(c.p);
  const fam = x.G.fam, nRunW1 = runsOf(c.p, 1).length;
  // ── classification ──
  let cl = null;
  if(same) cl = 'identical';
  else if(excl) cl = null;                                  // slice 2c: every family, pace AND NRC, byte-identical under an excluded mode
  else if(fam === 'pace' || fam === 'pace-ms' || fam === 'nrc-ms') cl = fam + (cSame ? ' lift-only' : ' cardio moved');
  if(cl === 'identical') bumpC('identical ' + fam + (excl ? ' (excluded mode)' : ''));
  else if(cl && !(cl.endsWith('lift-only'))) bumpC(cl + (tSame ? '' : ' +note'));
  else { R.uncl++; if(R.unclEx.length < 10) R.unclEx.push(tag + ' fam ' + fam + ' cardio ' + (cSame ? 'same' : 'moved') + ' lift ' + (lSame ? 'same' : 'moved') + ' top ' + (tSame ? 'same' : 'moved')); }
  // ── oracles on V213 (and V212 for contrast) ──
  if(!excl && (fam === 'pace-ms' || fam === 'nrc-ms')){
    const k = runsOf(c.p, 1).length; const routed = fam === 'pace-ms' ? k >= 3 : k >= 2;
    if(routed){ O(fam + ' routed programs'); const ub = untol(b.p), uc = untol(c.p); O(fam + ' untol V212', ub); O(fam + ' untol V213', uc); if(uc) oex(tag + ' untol ' + uc);
      if(fam === 'nrc-ms'){ const lb = longLast(b.p), lc = longLast(c.p); O('nrc-ms long-not-last weeks V212', lb); O('nrc-ms long-not-last weeks V213', lc); if(lc) oex(tag + ' long not last in ' + lc + ' weeks'); } }
    else { O(fam + ' not routed (runs ' + k + ')'); if(!cSame){ O(fam + ' not routed but cardio moved'); oex(tag + ' not routed but cardio moved'); } }
  }
  if(fam === 'nrc-ms' || fam === 'nrc'){ for(const w of Object.keys(b.p.weeks)){ const nb = runsOf(b.p, w).map(r => r.c.subtype).sort().join('|'), nc = runsOf(c.p, w).map(r => r.c.subtype).sort().join('|'); if(nb !== nc){ O('NRC names changed (weeks)'); oex(tag + ' W' + w + ' names ' + nb + ' -> ' + nc); } } }
  if(fam === 'nrc' && !same){ O('solo NRC moved'); oex(tag + ' solo NRC moved'); }
  if(fam === 'other' && !same){ O('bike/swim-only moved'); oex(tag + ' other moved'); }
  if(fam === 'base' && !same){ O('run_base moved'); oex(tag + ' run_base moved'); }
  if(excl && !same){ O('excluded mode moved'); oex(tag + ' excluded moved'); }
  if(fam === 'pace' && !excl && x.cal.length === 3){
    const wantSpaced = (() => { // hand: does any 3-run layout on this calendar avoid adjacency (incl. Sun->Mon wrap) given INT/CHI/long all hard?
      const idx = x.cal.map(d => DAYS.indexOf(d)); return !idx.some(i => idx.includes((i+1)%7) && idx.includes((i+2)%7)); })();
    const ws = Object.keys(c.p.weeks); let oneEach = 0, weeks = 0;
    for(const w of ws){ const rs = runsOf(c.p, w); if(!rs.length) continue; weeks++; const ks = rs.map(r => r.c.dose && r.c.dose.key); if(ks.filter(k => k === 'int').length === 1 && ks.filter(k => k === 'chi').length === 1) oneEach++; }
    const key = wantSpaced ? 'pace 3-day SPACEABLE calendars' : 'pace 3-day SPACER calendars';
    O(key); if(wantSpaced){ if(oneEach !== weeks){ O('spaceable: weeks without one INT + one CHI'); oex(tag + ' ' + oneEach + '/' + weeks + ' weeks INT+CHI'); } }
    else { if(!cSame){ O('spacer calendar cardio moved'); oex(tag + ' spacer cardio moved'); } }
    R.cal3 = R.cal3 || {}; R.cal3[x.cal.join('')] = wantSpaced ? 'spaced' : 'spacer';
  }
  if(fam === 'pace' && !excl && nRunW1 <= 2 && !same){ O('2-run pace moved'); oex(tag + ' 2-run pace moved'); }
});
console.log(JSON.stringify(R));
