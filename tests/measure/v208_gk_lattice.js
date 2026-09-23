// v208_gk_lattice.js — gatekeeper differential + identity fuzz for V208 (D106a fix-forward, D103a, D104a).
// usage: node v207_gk_lattice.js <cand> <base> <goalIndex> > out.json
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, GI] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];
const PACE = new Set(['run_pace_goal','run_mile_time','run_15_under10']);
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const GOALS = [
  {k:'pace',   types:['run'], goals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
  {k:'pacekm', types:['run'], goals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'5', targetMins:'24', targetSecs:'0', paceUnit:'km'}}},
  {k:'mile',   types:['run'], goals:{run:{id:'run_mile_time', label:'Mile', ...mb, targetDist:'1', targetMins:'7', targetSecs:'0', paceUnit:'mi'}}},
  {k:'u10',    types:['run'], goals:{run:{id:'run_15_under10', label:'1.5 under 10', ...mb, targetDist:'1.5', targetMins:'9', targetSecs:'59', paceUnit:'mi'}}},
  {k:'base',   types:['run'], goals:{run:{id:'run_base', label:'Base', ...mb}}},
  {k:'5k',     types:['run'], goals:{run:{id:'run_5k', label:'5K', ...mb}}},
  {k:'10k',    types:['run'], goals:{run:{id:'run_10k', label:'10K', ...mb}}},
  {k:'half',   types:['run'], goals:{run:{id:'run_half', label:'Half', ...mb, baselineDist:'5', baseline:'5mi'}}},
  {k:'mara',   types:['run'], goals:{run:{id:'run_marathon', label:'Marathon', ...mb, baselineDist:'8', baseline:'8mi'}}},
  {k:'bike',   types:['bike'], goals:{bike:{id:'bike_base', label:'Bike base'}}},
  {k:'ftp',    types:['bike'], goals:{bike:{id:'bike_ftp', label:'FTP'}}},
  {k:'swim',   types:['swim'], goals:{swim:{id:'swim_base', label:'Swim base'}}},
  {k:'swimmi', types:['swim'], goals:{swim:{id:'swim_mile', label:'Swim mile'}}},
  {k:'pace+bike', types:['run','bike'], goals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bike base'}}},
  {k:'pace+swim', types:['run','swim'], goals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, swim:{id:'swim_base', label:'Swim base'}}},
  {k:'mile+bike', types:['run','bike'], goals:{run:{id:'run_mile_time', label:'Mile', ...mb, targetDist:'1', targetMins:'7', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_ftp', label:'FTP'}}},
  {k:'u10+swim', types:['run','swim'], goals:{run:{id:'run_15_under10', label:'1.5 under 10', ...mb, targetDist:'1.5', targetMins:'9', targetSecs:'59', paceUnit:'mi'}, swim:{id:'swim_mile', label:'Swim mile'}}},
  {k:'pacekm+bike+swim', types:['run','bike','swim'], goals:{run:{id:'run_pace_goal', label:'Hit a Pace / Time Goal', ...mb, targetDist:'5', targetMins:'24', targetSecs:'0', paceUnit:'km'}, bike:{id:'bike_base', label:'Bike base'}, swim:{id:'swim_base', label:'Swim base'}}},
  {k:'half+bike', types:['run','bike'], goals:{run:{id:'run_half', label:'Half', ...mb, baselineDist:'5', baseline:'5mi'}, bike:{id:'bike_base', label:'Bike base'}}},
];

const FOCUS = ['balanced','strength','support_prevention'];
const EXP = ['beginner','intermediate','advanced'];
const EQUIP = ['home_full','commercial','bodyweight'];
const RESTS = [['sun','wed'], ['sat','sun'], ['mon','thu','sun']];
const SEEDS = [24865, 76308];
const INJ = [null, {region:'knee',tier:'workaround'}, {region:'knee',tier:'protect'}, {region:'knee',halfstep:true}, {region:'ankle',tier:'protect'}, {region:'lowback',tier:'protect'}, {region:'shoulder',tier:'protect'}, {region:'hip',tier:'workaround'}];
const NRC = new Set(['run_5k','run_10k','run_half','run_marathon']);
const clone = v => JSON.parse(JSON.stringify(v));
const CLOCK = /^(id|created|_swapUniverse|_swapUniverseByKey)$/;
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !CLOCK.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
const cards = p => { const out = []; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) [].concat(x.cardio||[]).forEach(c => { if(c) out.push({w, d, c}); }); } return out; };
const relabel = s => typeof s !== 'string' ? s : s.replace(/Long Interval \(LI\)/g, 'Continuous High Intensity (CHI)').replace(/Short Interval \(SI\)/g, 'Interval (INT)').replace(/^LI: /, 'CHI: ').replace(/^SI: /, 'INT: ');
function stripKey(p){ const q = clone(p); cards(q).forEach(({c}) => { if(c.dose && 'key' in c.dose) delete c.dose.key; }); return q; }
function mapBack(p){ const q = stripKey(p); cards(q).forEach(({c}) => { if(c.type === 'run'){ c.subtype = relabel(c.subtype); c.note = relabel(c.note); } });
  for(const w of Object.keys(q.weeks||{})) for(const d of Object.keys(q.weeks[w])){ const x = q.weeks[w][d]; if(x && typeof x.title === 'string') x.title = relabel(x.title); } return q; }
function flat(p){
  const m = new Map();
  if(!p || p.crash){ m.set('CRASH', p ? p.crash : 'null'); return m; }
  const top = {}; for(const k of Object.keys(p)) if(k !== 'weeks' && k !== 'cfg') top[k] = p[k];
  m.set('top', canon(top));
  for(const w of Object.keys(p.weeks || {})) for(const d of Object.keys(p.weeks[w])){
    const day = p.weeks[w][d]; if(!day){ m.set(`${w}|${d}|null`, 'null'); continue; }
    const rest = {}; for(const k of Object.keys(day)) if(!['sections','cardio','title'].includes(k)) rest[k] = day[k];
    m.set(`${w}|${d}|title`, JSON.stringify(day.title)); m.set(`${w}|${d}|day`, canon(rest));
    [].concat(day.cardio || []).forEach((c, i) => m.set(`${w}|${d}|cardio|${i}`, canon(c)));
    const seen = {};
    (day.sections || []).forEach(sec => { const lab = sec.label || sec.coreHeader || '?';
      const meta = {}; for(const k of Object.keys(sec)) if(k !== 'items') meta[k] = sec[k];
      m.set(`${w}|${d}|sec|${lab}|__meta`, canon(meta));
      (sec.items || []).forEach(it => { const nm = String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,''); const kk = `${w}|${d}|sec|${lab}|${nm}`; seen[kk] = (seen[kk]||0) + 1; m.set(kk + '#' + seen[kk], canon(it)); }); });
  }
  return m;
}
function build(IA, cfg){ const c = clone(cfg); try { const p = IA.buildProgram(c); return {p: clone(p), mutated: canon(c) !== canon(cfg)}; } catch(e){ return {p: {crash: String(e.message)}, mutated: false}; } }
function diffKeys(a, b){ const out = []; const ks = new Set([...a.keys(), ...b.keys()]); for(const k of ks) if(a.get(k) !== b.get(k)) out.push(k); return out; }
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const START = new Date(2026, 9, 5);
const addD = n => { const x = new Date(START); x.setDate(x.getDate() + n); return x; };
const G = GOALS[+GI];
const runId = G.goals.run && G.goals.run.id, isPace = !!runId && PACE.has(runId), isBase = runId === 'run_base';
const isNSWrun = !!runId && !NRC.has(runId);
const R = {goal: G.k, configs: 0, selfIdent: {n:0, bad:0, ex:[]}, classes: {}, unclassified: [], unclN: 0, crashes: {both:0, candOnly:[], baseOnly:[]},
  cfgMut: {base:0, cand:0}, keyOracle: {nswRun:0, nswNoKey:[], foreignKey:[], nameKeyMismatch:[]}, strides: {kneeEasyProgs:0, left:[]}, trial: {checked:0, bad:[]}};
const bump = k => R.classes[k] = (R.classes[k]||0) + 1;
function mk(fi, ei, qi, rs, seed, over){
  return Object.assign({name:'GK', primaryPath:'event', eventTargeted:true, cardioTypes:G.types.slice(), cardioGoals:clone(G.goals),
    liftingFocus:FOCUS[fi], experience:EXP[ei], ageBracket:'18-35', equipment:EQUIP[qi], unit:'lbs', restDays:rs.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, startDate:iso(START), seed}, over||{});
}
function keyOracle(tag, p){
  for(const {w, d, c} of cards(p)){
    const k = c.dose && c.dose.key;
    const nsw = c.type === 'run' && !NRC.has(c.goalId);
    if(nsw){ R.keyOracle.nswRun++; if(!k && c.dose && R.keyOracle.nswNoKey.length < 10) R.keyOracle.nswNoKey.push(tag + ' W' + w + d + ' ' + c.subtype); if(!c.dose) R.keyOracle.noDose = (R.keyOracle.noDose||0) + 1;
      const s = String(c.subtype||'');
      if((k === 'int') !== /^Short Interval \(SI\)/.test(s) || (k === 'chi') !== /^Long Interval \(LI\)/.test(s)) if(R.keyOracle.nameKeyMismatch.length < 10) R.keyOracle.nameKeyMismatch.push(tag + ' W' + w + d + ' ' + s + ' key=' + k); }
    else if(k && R.keyOracle.foreignKey.length < 10) R.keyOracle.foreignKey.push(tag + ' W' + w + d + ' ' + c.type + ' ' + c.goalId + ' ' + c.subtype + ' key=' + k);
  }
}
// independent lift-day oracle: any non-rest day holding a lift item (sections that are not core/hip blocks), counted by item names
function liftDay(p){ for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(!x || x.rest) continue;
  for(const sec of (x.sections||[])){ if(sec.core || sec.hip) continue; if((sec.items||[]).some(it => it && it.name)) return true; } } return false; }
function compare(tag, cfg, ctx){
  R.configs++;
  const b = build(B, cfg), b2 = build(B2, cfg), c = build(C, cfg);
  const fb = flat(b.p), fb2 = flat(b2.p);
  R.selfIdent.n++; const sd = diffKeys(fb, fb2); if(sd.length){ R.selfIdent.bad++; if(R.selfIdent.ex.length < 5) R.selfIdent.ex.push(tag + ' ' + sd.slice(0,3)); }
  if(b.mutated) R.cfgMut.base++; if(c.mutated) R.cfgMut.cand++;
  if(b.p.crash && c.p.crash){ R.crashes.both++; return null; }
  if(c.p.crash){ R.crashes.candOnly.push(tag + ' ' + c.p.crash); return null; }
  if(b.p.crash){ R.crashes.baseOnly.push(tag + ' ' + b.p.crash); return null; }
  keyOracle(tag, c.p);
  R.lift = R.lift || {free:0, freeNote:[], liftProgs:0};
  if(!liftDay(c.p)){ R.lift.free++; if(c.p.legRecoveryNote != null && R.lift.freeNote.length < 5) R.lift.freeNote.push(tag + ' ' + c.p.legRecoveryNote.slice(0,60)); } else R.lift.liftProgs++;
  const fc = flat(c.p), fk = flat(stripKey(c.p)), fm = flat(mapBack(c.p));
  const ks = diffKeys(fb, fc);
  const lw = (() => { for(const w of Object.keys(c.p.weeks).map(Number).sort((a,b)=>a-b)) if(Object.values(c.p.weeks[w]).some(x => x && [].concat(x.cardio||[]).some(k => k && k.dose && k.dose.key === 'long'))) return w; return null; })();
  for(const k of ks){
    let cl = null;
    if(fb.get(k) === fk.get(k)) cl = 'KEY_ONLY(dose.key)';
    else if(fb.get(k) === fm.get(k)) cl = 'LABEL(+KEY) maps back';
    else {
      const [w, d, kind] = k.split('|'); const W = +w;
      if(ctx.tw && (W === ctx.tw || W === ctx.tw - 1)) cl = 'SLICE0 test/eve window';
      else if(ctx.inj && ctx.injMode && kind === 'cardio') cl = 'INJ ' + ctx.injMode + ' (key sets / strides)';
      else if(k === 'top' && ctx.tw && ctx.tw <= 2 && liftDay(c.p) && JSON.stringify(Object.keys(JSON.parse(fb.get('top'))).filter(f => JSON.stringify(JSON.parse(fb.get('top'))[f]) !== JSON.stringify(JSON.parse(fm.get('top'))[f]))) === '["legRecoveryNote"]') { cl = 'SLICE2 trial out of shape (lift-bearing tw<=2 note)'; R.s2tw = R.s2tw || {}; R.s2tw[ctx.tw] = (R.s2tw[ctx.tw]||0) + 1; R.s2to = R.s2to || {}; const t = String(c.p.legRecoveryNote).slice(0,40); R.s2to[t] = (R.s2to[t]||0) + 1; }
      else if(k === 'top' && !liftDay(c.p) && c.p.legRecoveryNote === null && JSON.stringify(Object.keys(JSON.parse(fb.get('top'))).filter(f => JSON.stringify(JSON.parse(fb.get('top'))[f]) !== JSON.stringify(JSON.parse(fm.get('top'))[f]))) === '["legRecoveryNote"]') cl = 'CLOSE3 lift-free program, note null';
      else if(ctx.inj && ctx.injMode && kind !== 'cardio' && ks.some(k2 => k2.startsWith(w + '|' + d + '|cardio|') && fb.get(k2) !== fm.get(k2))) cl = 'INJ-derived lift budget (same day card changed)';
      else if(isBase && (kind === 'sec' || kind === 'title' || kind === 'day' || k === 'top')) cl = 'D104A run_base placement/note';
      else if(isNSWrun && !isBase && lw && lw !== 1 && (kind === 'sec' || kind === 'title' || kind === 'day' || k === 'top')) cl = 'D104A NSW placement (first long week ' + lw + ')';
    }
    if(cl) bump(cl); else { R.unclN++; { const mm = tag.match(/^(V\d)(?:.* inj (\{[^}]*\}))?/); const bk = mm[1] + ' ' + (mm[2]||'-') + ' ' + (k.split('|')[2]||k); R.unclBy = R.unclBy || {}; R.unclBy[bk] = (R.unclBy[bk]||0) + 1; R.unclProgs = R.unclProgs || {}; R.unclProgs[tag] = 1; } if(R.unclassified.length < 25) R.unclassified.push(tag + ' :: ' + k + ' :: base ' + String(fb.get(k)).slice(0,220) + ' || cand ' + String(fm.get(k)).slice(0,220)); }
  }
  return {b: b.p, c: c.p};
}
for(let fi=0; fi<3; fi++) for(let ei=0; ei<3; ei++) for(let qi=0; qi<3; qi++) for(let ri=0; ri<3; ri++) for(const seed of SEEDS){
  const rs = RESTS[ri], tag0 = `${G.k}|${FOCUS[fi]}|${EXP[ei]}|${EQUIP[qi]}|${rs.join('')}|${seed}`;
  compare('V0 ' + tag0, mk(fi,ei,qi,rs,seed,{eventTargeted:false, raceDate:''}), {});
  const ii = 1 + ((fi*27 + ei*9 + qi*3 + ri + seed) % (INJ.length - 1)), inj = INJ[ii];
  const mode = C.eval('injuryPlan')({injury: inj}); const injMode = mode && mode.cardioMode;
  const r = compare(`V4 ${tag0} inj ${JSON.stringify(inj)}`, mk(fi,ei,qi,rs,seed,{eventTargeted:false, raceDate:'', injury: inj}), {inj, injMode});
  if(r && injMode === 'easy' && isNSWrun){ R.strides.kneeEasyProgs++; cards(r.c).forEach(({w,d,c}) => { if(c.type === 'run' && /strides/i.test((c.detail||'') + (c.subtype||'')) && R.strides.left.length < 5) R.strides.left.push(tag0 + ' W' + w + d + ' ' + c.subtype); }); }
  if(!isPace){ const rd = iso(addD(7*7 + (fi + seed) % 7)); compare(`V1 ${tag0} race ${rd}`, mk(fi,ei,qi,rs,seed,{raceDate:rd}), {}); }
}
if(isPace){
  let n = 0;
  const L = build(B, mk(0,1,0,RESTS[0],SEEDS[0],{eventTargeted:false, raceDate:''})).p.totalWeeks;
  for(let tw=1; tw<=L; tw++) for(let wd=0; wd<7; wd++) for(let ri=0; ri<3; ri++) for(const seed of SEEDS){
    n++; const fi = n%3, ei = (n>>1)%3, qi = (n>>2)%3, rs = RESTS[ri];
    const rd = iso(addD(7*(tw-1) + wd)), raceDay = DAYS[wd];
    const tag = `V2 ${G.k}|${FOCUS[fi]}|${EXP[ei]}|${EQUIP[qi]}|${rs.join('')}|${seed} tw ${tw} ${raceDay}`;
    const res = compare(tag, mk(fi,ei,qi,rs,seed,{raceDate:rd, _testWeek:tw, _raceDateCappedWeeks:tw}), {tw});
    if(res){ R.trial.checked++; const tr = cards(res.c).filter(x => /TIME TRIAL/.test(x.c.subtype||''));
      if(!(tr.length === 1 && +tr[0].w === tw && tr[0].d === raceDay && tr[0].c.dose && tr[0].c.dose.key === 'trial') && R.trial.bad.length < 10) R.trial.bad.push(tag + ' ' + tr.map(x => x.w + x.d).join(',')); }
  }
}
console.log(JSON.stringify(R));
