// v210_gk_lattice.js — gatekeeper differential + identity fuzz for V210 (D70c slices 1-2, 2b front squat, D150 swap universe).
// usage: node v210_gk_lattice.js <cand> <base> <shard 0..N-1>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const pace = {id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'};
const GOALS = [
  {k:'pace', types:['run'], goals:{run:pace}},
  {k:'base', types:['run'], goals:{run:{id:'run_base', label:'Base', ...mb}}},
  {k:'half', types:['run'], goals:{run:{id:'run_half', label:'Half', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
  {k:'5k',   types:['run'], goals:{run:{id:'run_5k', label:'5K', ...mb}}},
  {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bike base'}}},
  {k:'swim', types:['swim'], goals:{swim:{id:'swim_base', label:'Swim base'}}},
  {k:'pace+bike', types:['run','bike'], goals:{run:pace, bike:{id:'bike_base', label:'Bike base'}}},
];
const EQUIP = ['commercial','crossfit','home_full','home_basic','minimal','bodyweight'];
const FOCUS = ['hypertrophy','strength','balanced','support_prevention'];
const EXP = ['beginner','advanced'], AGE = ['18-35','55+'];
const RESTS = [['sun','wed'], ['sat','sun']], SEEDS = [24865, 76308];
const INJ = [{region:'shoulder',tier:'protect'}, {region:'elbow',tier:'workaround'}, {region:'shoulder',tier:'workaround'}, {region:'elbow',tier:'protect'}, {region:'knee',tier:'protect'}, {region:'shoulder',halfstep:true}];
const clone = v => JSON.parse(JSON.stringify(v));
const CLOCK = /^(id|created)$/;
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !CLOCK.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
function flat(p){ const m = new Map(); if(!p || p.crash){ m.set('CRASH', p ? p.crash : 'null'); return m; }
  const top = {}; for(const k of Object.keys(p)) if(!['weeks','cfg','_swapUniverse','_swapUniverseByKey'].includes(k)) top[k] = p[k];
  m.set('top', canon(top)); m.set('universe', canon(p._swapUniverse)); m.set('universeByKey', canon(p._swapUniverseByKey));
  for(const w of Object.keys(p.weeks || {})) for(const d of Object.keys(p.weeks[w])){ const day = p.weeks[w][d]; if(!day){ m.set(`${w}|${d}|null`, 'null'); continue; }
    const rest = {}; for(const k of Object.keys(day)) if(!['sections','cardio','title'].includes(k)) rest[k] = day[k];
    m.set(`${w}|${d}|title`, JSON.stringify(day.title)); m.set(`${w}|${d}|day`, canon(rest));
    [].concat(day.cardio || []).forEach((c, i) => m.set(`${w}|${d}|cardio|${i}`, canon(c)));
    const seen = {}; (day.sections || []).forEach(sec => { const lab = sec.label || sec.coreHeader || '?'; const meta = {}; for(const k of Object.keys(sec)) if(k !== 'items') meta[k] = sec[k];
      m.set(`${w}|${d}|sec|${lab}|__meta`, canon(meta));
      (sec.items || []).forEach(it => { const nm = String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,''); const kk = `${w}|${d}|sec|${lab}|${nm}`; seen[kk] = (seen[kk]||0) + 1; m.set(kk + '#' + seen[kk], canon(it)); }); }); }
  return m; }
function build(IA, cfg){ const c = clone(cfg); try { const p = IA.buildProgram(c); return {p: clone(p), mutated: canon(c) !== canon(cfg)}; } catch(e){ return {p: {crash: String(e.message)}, mutated: false}; } }
const diffKeys = (a, b) => { const out = []; for(const k of new Set([...a.keys(), ...b.keys()])) if(a.get(k) !== b.get(k)) out.push(k); return out; };
const items = p => { const out = []; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) (x.sections||[]).forEach(s => (s.items||[]).forEach(it => it && out.push(String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'')))); } return out; };
const uni = p => Array.isArray(p._swapUniverse) ? p._swapUniverse : Object.keys(p._swapUniverse || {});
// independent gear oracle, from the tier text (barbell: commercial/crossfit/home_full; cables and machines: commercial only)
const BAR = /\bbarbell\b|close-grip bench|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$/i;
const CABMACH = /\bcable\b|\bmachine\b|preacher|face pull|lat pulldown|pec deck|leg press|smith|seated row \(cable\)/i;
const R = {shard: SH, configs: 0, selfBad: 0, classes: {}, uncl: 0, unclEx: [], crash: {both:0, c:[], b:[]}, mut: [0,0],
  orc: {cand: {barOnNoBar:0, cabOnNoCab:0, fsInjured:0, uniBar:0, uniCab:0, ex:[]}, base: {barOnNoBar:0, cabOnNoCab:0, fsInjured:0, uniBar:0, uniCab:0}}};
const bump = k => R.classes[k] = (R.classes[k]||0) + 1;
function oracle(side, p, eq, inj){ const O = R.orc[side]; const hasBar = ['commercial','crossfit','home_full'].includes(eq), hasCab = eq === 'commercial';
  const its = items(p), u = uni(p);
  const bad = [];
  if(!hasBar && its.some(n => BAR.test(n))){ O.barOnNoBar++; bad.push('bar ' + its.find(n => BAR.test(n))); }
  if(!hasCab && eq !== 'bodyweight' && its.some(n => CABMACH.test(n))){ O.cabOnNoCab++; bad.push('cab ' + its.find(n => CABMACH.test(n))); }
  if(inj && !inj.halfstep && (inj.region === 'shoulder' || inj.region === 'elbow') && its.some(n => /^front squat$/i.test(n))){ O.fsInjured++; bad.push('front squat under ' + inj.region); }
  if(!hasBar && u.some(n => BAR.test(n))){ O.uniBar++; bad.push('universe bar ' + u.find(n => BAR.test(n))); }
  if(!hasCab && eq !== 'bodyweight' && u.some(n => CABMACH.test(n))){ O.uniCab++; bad.push('universe cab ' + u.find(n => CABMACH.test(n))); }
  if(side === 'cand' && bad.length && O.ex.length < 8) O.ex.push(eq + ' ' + JSON.stringify(inj) + ' ' + bad.join('; '));
}
const all = [];
for(const g of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of EXP) for(const ag of AGE) for(const ri of [0,1]) for(const seed of SEEDS) for(const iv of [0,1]) all.push({g, eq, fo, ex, ag, ri, seed, iv});
const NSH = 8;
all.forEach((x, idx) => { if(idx % NSH !== +SH) return;
  const inj = x.iv ? INJ[(idx >> 3) % INJ.length] : null;
  const cfg = {name:'GK', primaryPath:'event', eventTargeted: !!x.g.race, raceDate: x.g.race || '', cardioTypes:x.g.types.slice(), cardioGoals:clone(x.g.goals),
    liftingFocus:x.fo, experience:x.ex, ageBracket:x.ag, equipment:x.eq, unit:'lbs', restDays:RESTS[x.ri].slice(), days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  if(inj) cfg.injury = inj;
  const tag = `${x.g.k}|${x.eq}|${x.fo}|${x.ex}|${x.ag}|${RESTS[x.ri].join('')}|${x.seed}|${JSON.stringify(inj)}`;
  R.configs++;
  const b = build(B, cfg), b2 = build(B2, cfg), c = build(C, cfg);
  if(b.mutated) R.mut[0]++; if(c.mutated) R.mut[1]++;
  const fb = flat(b.p), fb2 = flat(b2.p), fc = flat(c.p);
  if(diffKeys(fb, fb2).length) R.selfBad++;
  if(b.p.crash && c.p.crash){ R.crash.both++; return; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); return; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); return; }
  oracle('base', b.p, x.eq, inj); oracle('cand', c.p, x.eq, inj);
  { const cab = p => new Set(items(p).filter(n => CABMACH.test(n))); if(x.eq !== 'commercial' && x.eq !== 'bodyweight'){ const cb = cab(b.p), ck = cab(c.p); if([...ck].some(n => !cb.has(n))){ R.cabIntro = (R.cabIntro||0) + 1; } if(ck.size){ R.cabLeft = R.cabLeft || {}; [...ck].forEach(n => { const kk = n + ' @ ' + JSON.stringify(inj); R.cabLeft[kk] = (R.cabLeft[kk]||0) + 1; }); } } }
  const injRack = !!(inj && !inj.halfstep && (inj.region === 'shoulder' || inj.region === 'elbow'));
  const fsBase = items(b.p).some(n => /^front squat$/i.test(n)), fsCand = items(c.p).some(n => /^front squat$/i.test(n));
  for(const k of diffKeys(fb, fc)){
    let cl = null; const kind = k.split('|')[2];
    if(kind === 'cardio' || k === 'top' || k === 'CRASH') cl = null;
    else if(x.eq !== 'commercial') cl = (k.startsWith('universe') ? 'UNIVERSE ' : 'POOL ') + x.eq;
    else if(injRack) cl = 'COMMERCIAL front-squat withhold (' + inj.region + ')' + (fsBase ? ' [front squat was drawn]' : ' [pool shrank, seeded pick shifted]');
    if(cl) bump(cl); else { R.uncl++; if(R.unclEx.length < 12) R.unclEx.push(tag + ' :: ' + k + ' :: base ' + String(fb.get(k)).slice(0,200) + ' || cand ' + String(fc.get(k)).slice(0,200)); }
  }
  if(!x.g.types.includes('run') || true){ /* run cards: counted via the cardio branch above (always unclassified) */ }
  if(x.eq === 'commercial' && !injRack && diffKeys(fb, fc).length) R.commercialMoved = (R.commercialMoved||0) + 1;
  if(fsCand && injRack) R.fsLeak = (R.fsLeak||0) + 1;
  if(!fsBase && fsCand){ R.fsNew = R.fsNew || {}; const kk = x.eq + '|' + x.fo + '|' + x.ex + '|' + x.ag; R.fsNew[kk] = (R.fsNew[kk]||0) + 1; }
});
console.log(JSON.stringify(R));
