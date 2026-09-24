// v216_gk_lattice.js — gatekeeper differential + identity fuzz for V216 (D154 gear-legal injury renames, D156 NSW long day).
// node v216_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v); if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}, nsw:true},
  {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}, nsw:true},
  {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06', nrc:true},
  {k:'10k', types:['run'], goals:{run:{id:'run_10k', label:'10', ...mb}}, nrc:true},
  {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
const EQUIP = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const FOCUS = ['strength','hypertrophy','balanced','support_prevention','support_athletic'];
const INJ = [null, {region:'elbow',tier:'workaround'}, {region:'elbow',tier:'protect'}, {region:'shoulder',tier:'workaround'}, {region:'knee',tier:'protect'}];
// independent tier oracle, from the tier text: barbell = commercial/crossfit/home_full; cables+machines = commercial; GHD = commercial/crossfit; dumbbells = all but bodyweight
const RX = { bar: /\bbarbell\b|close-grip bench|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$/i,
  cab: /\bcable\b|\brope\b|face pull|pulldown|pec deck|leg press|leg extension|leg curl|hack squat|\bsmith\b|preacher|\bmachine\b/i,
  ghd: /glute-ham|\bghr\b|45° back extension/i, db: /\bdumbbell|\bdb\b|goblet/i };
const owns = eq => ({bar: ['commercial','crossfit','home_full'].includes(eq), cab: eq === 'commercial', ghd: ['commercial','crossfit'].includes(eq), db: eq !== 'bodyweight'});
const nm = s => String(s||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');
const items = p => { const o = []; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) (x.sections||[]).forEach(s => (s.items||[]).forEach(it => it && o.push({w, d, n: nm(it.name), s: s.label||''}))); } return o; };
const R = {shard:SH, configs:0, selfBad:0, crash:{both:0,c:[],b:[]}, mut:[0,0], cls:{}, uncl:0, unclEx:[], orc:{}, orcEx:[]};
const bump = k => R.cls[k] = (R.cls[k]||0) + 1; const O = (k, n = 1) => R.orc[k] = (R.orc[k]||0) + n; const oex = s => { if(R.orcEx.length < 14) R.orcEx.push(s); };
const all = []; for(const G of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of ['beginner','advanced']) for(const inj of INJ) for(const rs of [['sun','wed'],['sat','sun'],['mon','thu','sun']]) for(const seed of [24865, 76308]) all.push({G, eq, fo, ex, inj, rs, seed});
all.forEach((x, i) => { if(i % +NS !== +SH) return;
  const cfg = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:clone(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:'18-35', equipment:x.eq, unit:'lbs', restDays:x.rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  if(x.inj) cfg.injury = x.inj;
  const elbowWA = !!x.inj && x.inj.region === 'elbow' && x.inj.tier === 'workaround';
  const tag = `${x.G.k}|${x.eq}|${x.fo}|${x.ex}|${JSON.stringify(x.inj)}|${x.rs.join('')}|${x.seed}`; R.configs++;
  const tb = IA => { const cc = clone(cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(cfg)}; } catch(e){ return {p:{crash:String(e.message)}}; } };
  const b = tb(B), b2 = tb(B2), c = tb(C); if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
  if(canon(b.p) !== canon(b2.p)) R.selfBad++;
  if(b.p.crash && c.p.crash){ R.crash.both++; return; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); return; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); return; }
  const own = owns(x.eq);
  // oracle (a): every prescribed name gear-legal for the tier (all plans), V215 vs V216
  for(const [side, p] of [['V215', b.p], ['V216', c.p]]){
    const bad = items(p).filter(o => Object.keys(RX).some(k => !own[k] && RX[k].test(o.n)));
    if(bad.length){ O(side + ' gear-illegal items' + (elbowWA ? ' (elbow/workaround)' : ''), bad.length); if(side === 'V216') oex(tag + ' ' + bad[0].n); } }
  // oracle (b): the elbow/workaround swap on V216
  if(elbowWA){ const its = items(c.p);
    const skull = its.filter(o => /skullcrusher/i.test(o.n)).length, bcurl = its.filter(o => /^barbell curl$/i.test(o.n)).length;
    const push = its.filter(o => o.n === 'Cable pushdown').length, cgp = its.filter(o => o.n === 'Close-grip pushups').length;
    O('elbow/workaround programs'); if(skull){ O('skullcrushers left under elbow/workaround'); oex(tag + ' skull ' + skull); } if(bcurl && own.db){ O('barbell curl left'); oex(tag + ' barbell curl'); }
    if(push && !own.cab){ O('Cable pushdown on a no-cable tier'); } if(push) O('Cable pushdown on ' + x.eq); if(cgp) O('Close-grip pushups on ' + x.eq); }
  // oracle (c): D156 — NSW loaded full-body long days carry no Delts/Arms finisher
  if(x.G.nsw) for(const [side, p] of [['V215', b.p], ['V216', c.p]]) for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const y = p.weeks[w][d]; if(!y) continue;
    const cs = [].concat(y.cardio || []).filter(Boolean); if(!cs.some(z => z.type === 'run' && z.dose && z.dose.key === 'long')) continue;
    if(!/full body/i.test(y.title || '')) continue; O(side + ' NSW loaded full-body long days');
    if((y.sections||[]).some(s => /finisher/i.test(s.label||'') && /delt|arm/i.test(s.label||'') && (s.items||[]).length)){ O(side + ' ... with a Delts/Arms finisher'); if(side === 'V216') oex(tag + ' W' + w + d + ' finisher'); } }
  // classification
  if(canon(b.p) === canon(c.p)){ bump('identical'); return; }
  const cardioOf = p => { const o = {}; for(const w of Object.keys(p.weeks)) for(const d of DAYS){ const y = p.weeks[w][d]; o[w+d] = y ? canon(y.cardio || null) : 'none'; } return canon(o); };
  if(cardioOf(b.p) !== cardioOf(c.p)){ R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' cardio moved'); return; }
  let longDiff = 0, otherDiff = 0; for(const w of Object.keys(c.p.weeks)) for(const d of DAYS){ const bd = b.p.weeks[w] && b.p.weeks[w][d], cd = c.p.weeks[w][d]; if(canon(bd) === canon(cd)) continue;
    const isLong = !!cd && [].concat(cd.cardio||[]).some(z => z && z.dose && z.dose.key === 'long'); if(isLong) longDiff++; else otherDiff++; }
  const topSame = (() => { const t = p => { const o = {}; for(const k of Object.keys(p)) if(!['weeks','cfg'].includes(k)) o[k] = p[k]; return canon(o); }; return t(b.p) === t(c.p); })();
  if(elbowWA && !['commercial','bodyweight'].includes(x.eq)) bump('D154 elbow/workaround rename, ' + (x.G.nsw ? 'NSW' : x.G.nrc ? 'NRC' : 'other') + (topSame ? '' : ' +note'));
  else if(x.G.nsw && longDiff > 0) { bump('D156 NSW long day' + (otherDiff ? ' + knock-on other days' : '') + (topSame ? '' : ' +note')); if(otherDiff) O('D156 knock-on day cells', otherDiff); }
  else if(longDiff === 0 && otherDiff === 0 && !topSame && x.G.nsw){
    // only the harvested swap universe moved: check it is a pure REMOVAL of finisher-pool names (D156: the finisher is no longer drawn on the long day)
    const ub = b.p._swapUniverse || [], uc = c.p._swapUniverse || []; const added = uc.filter(n => !ub.includes(n)), removed = ub.filter(n => !uc.includes(n));
    const EX = C.eval('EXLIB'); const FIN = new Set([].concat(EX.biceps||[], EX.triceps||[], EX.shoulder_iso||[], EX.shoulder_iso_bw||[], EX.biceps_bw||[], EX.triceps_bw||[]));
    const t = pp => { const o = {}; for(const k of Object.keys(pp)) if(!['weeks','cfg','_swapUniverse','_swapUniverseByKey'].includes(k)) o[k] = pp[k]; return canon(o); };
    if(added.length === 0 && removed.length && removed.every(n => FIN.has(n)) && t(b.p) === t(c.p)){ bump('D156 universe only: finisher names no longer harvested (NSW long day)'); O('universe names removed', removed.length); }
    else { R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' universe added ' + JSON.stringify(added) + ' removed ' + JSON.stringify(removed.filter(n => !FIN.has(n)))); } }
  else { R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' long ' + longDiff + ' other ' + otherDiff + ' top ' + (topSame ? 'same' : 'moved')); }
});
console.log(JSON.stringify(R));
