// v215_gk_lattice.js — gatekeeper differential + identity fuzz for V215 (D149: GHD is commercial/crossfit only; floors a and b).
// node v215_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v); if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
  {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
  {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}}, {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
const EQUIP = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const FOCUS = ['strength','hypertrophy','balanced','fatloss','support_prevention','support_athletic','support_strength'];
const INJ = [null, {region:'knee',tier:'protect'}, {region:'ankle',tier:'protect'}, {region:'hip',tier:'protect'}, {region:'knee',tier:'workaround'}, {region:'lowback',tier:'protect'}];
const GHD = /glute-ham|\bghr\b|45° back extension/i;   // hand list from the ruling: the GHD station's names
const nm = s => String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');
const itemsOf = p => { const o = []; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) (x.sections||[]).forEach(s => (s.items||[]).forEach(it => it && o.push({w, d, n: nm(it.name)}))); } return o; };
const liveSecs = p => { let n = 0; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) (x.sections||[]).forEach(s => { if((s.items||[]).length) n++; }); } return n; };
const R = {shard:SH, configs:0, selfBad:0, crash:{both:0,c:[],b:[]}, mut:[0,0], cls:{}, uncl:0, unclEx:[], orc:{}, orcEx:[]};
const bump = k => R.cls[k] = (R.cls[k]||0) + 1; const O = (k, n = 1) => R.orc[k] = (R.orc[k]||0) + n; const oex = s => { if(R.orcEx.length < 14) R.orcEx.push(s); };
const all = []; for(const G of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of ['beginner','advanced']) for(const ag of ['18-35','55+']) for(const inj of INJ) for(const seed of [24865, 76308]) all.push({G, eq, fo, ex, ag, inj, seed});
all.forEach((x, i) => { if(i % +NS !== +SH) return;
  const cfg = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:clone(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:x.ag, equipment:x.eq, unit:'lbs', restDays:['sun','wed'], days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  if(x.inj) cfg.injury = x.inj;
  const tag = `${x.G.k}|${x.eq}|${x.fo}|${x.ex}|${x.ag}|${JSON.stringify(x.inj)}|${x.seed}`; R.configs++;
  const tb = IA => { const cc = clone(cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(cfg)}; } catch(e){ return {p:{crash:String(e.message)}}; } };
  const b = tb(B), b2 = tb(B2), c = tb(C); if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
  if(canon(b.p) !== canon(b2.p)) R.selfBad++;
  if(b.p.crash && c.p.crash){ R.crash.both++; return; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); return; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); return; }
  const hasGHD = x.eq === 'commercial' || x.eq === 'crossfit';
  // oracle 1: GHD names only on commercial/crossfit — prescriptions, universe, swap sheet
  for(const [side, p, IA] of [['V214', b.p, B], ['V215', c.p, C]]){
    const its = itemsOf(p);
    if(!hasGHD){ const g = its.filter(o => GHD.test(o.n)); if(g.length){ O(side + ' GHD prescribed on ' + x.eq); if(side === 'V215') oex(tag + ' prescribed ' + g[0].n); }
      const u = Array.isArray(p._swapUniverse) ? p._swapUniverse : Object.keys(p._swapUniverse || {}); if(u.some(n => GHD.test(n))){ O(side + ' GHD in universe on ' + x.eq); if(side === 'V215') oex(tag + ' universe'); }
      if(side === 'V215' && i % 3 === 0){ const seen = new Set(); let off = 0;
        for(const o of its){ if(seen.has(o.n) || seen.size > 25) continue; seen.add(o.n); let cs = []; try { cs = IA.swapCandidates(o.n, p.weeks[o.w][o.d], +o.w, p) || []; } catch(e){ O('swapCandidates crash'); continue; }
          const flatC = v => Array.isArray(v) ? [].concat(...v.map(flatC)) : (v && typeof v === 'object' && !v.name) ? [].concat(...Object.values(v).map(flatC)) : [v]; const names = flatC(cs).map(z => nm(typeof z === 'string' ? z : (z && (z.name || z.n)) || '')).filter(Boolean); O('swap candidates read', names.length); if(names.some(n => GHD.test(n))){ off++; oex(tag + ' swap offers ' + names.find(n => GHD.test(n)) + ' for ' + o.n); } }
        O('swap sheets asked', seen.size); if(off) O('V215 GHD offered on swap sheet', off); } } }
  // oracle 2: the floors fire only on home_full; knee/protect loses no section vs V214
  const cnt = (p, n) => itemsOf(p).filter(o => o.n === n).length;
  for(const n of ['Single-leg glute bridge','Bodyweight back extension']){ const d = cnt(c.p, n) - cnt(b.p, n); if(d > 0){ O('new ' + n + ' on ' + x.eq + ' ' + (x.inj ? x.inj.region + '/' + x.inj.tier : 'none')); } }
  if(x.inj && x.inj.region === 'knee' && x.inj.tier === 'protect'){ const lb = liveSecs(b.p), lc = liveSecs(c.p); O('knee/protect programs'); if(lc < lb){ O('knee/protect section losses', lb - lc); oex(tag + ' sections ' + lb + ' -> ' + lc); } }
  if(x.inj && x.inj.region === 'ankle' && x.inj.tier === 'protect'){ const lb = liveSecs(b.p), lc = liveSecs(c.p); if(lc < lb){ O('ankle/protect section losses ' + x.eq, lb - lc); } }
  // classification
  if(canon(b.p) === canon(c.p)){ bump('identical ' + (hasGHD ? 'GHD tier' : 'home tier')); return; }
  if(hasGHD){ R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' GHD tier moved'); return; }
  const cardioOf = p => { const o = {}; for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const y = p.weeks[w][d]; o[w+d] = y ? canon(y.cardio || null) : 'none'; } return canon(o); };
  if(cardioOf(b.p) !== cardioOf(c.p)){ R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' cardio moved'); return; }
  bump('D149 home tier lift change ' + x.eq);
});
console.log(JSON.stringify(R));
