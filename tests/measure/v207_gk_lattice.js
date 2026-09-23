// v207_gk_lattice.js — gatekeeper differential + identity fuzz for D106a (V207).
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
const clone = v => JSON.parse(JSON.stringify(v));
const CLOCK = /^(id|created|updated|generated|generatedAt|createdAt|updatedAt|_swapUniverse|_swapUniverseByKey|ts|timestamp)$/;
function canon(v){
  if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !CLOCK.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
}
function flat(p){
  const m = new Map();
  if(!p || p.crash) { m.set('CRASH', p ? p.crash : 'null'); return m; }
  const top = {}; for(const k of Object.keys(p)) if(k !== 'weeks' && k !== 'cfg') top[k] = p[k];
  m.set('top', canon(top));
  for(const w of Object.keys(p.weeks || {})) for(const d of Object.keys(p.weeks[w])){
    const day = p.weeks[w][d]; if(!day){ m.set(`${w}|${d}|null`, 'null'); continue; }
    const rest = {}; for(const k of Object.keys(day)) if(!['sections','cardio','title'].includes(k)) rest[k] = day[k];
    m.set(`${w}|${d}|title`, JSON.stringify(day.title));
    m.set(`${w}|${d}|day`, canon(rest));
    [].concat(day.cardio || []).forEach((c, i) => m.set(`${w}|${d}|cardio|${i}`, canon(c)));
    const seen = {};
    (day.sections || []).forEach(sec => {
      const lab = sec.label || sec.coreHeader || '?';
      const meta = {}; for(const k of Object.keys(sec)) if(k !== 'items') meta[k] = sec[k];
      m.set(`${w}|${d}|sec|${lab}|__meta`, canon(meta));
      (sec.items || []).forEach(it => { const nm = String(it.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,''); const kk = `${w}|${d}|sec|${lab}|${nm}`; seen[kk] = (seen[kk]||0) + 1; m.set(kk + '#' + seen[kk], canon(it)); });
    });
  }
  return m;
}
function build(IA, cfg){ const c = clone(cfg); try { const p = IA.buildProgram(c); return {p: clone(p), mutated: canon(c) !== canon(cfg)}; } catch(e){ return {p: {crash: String(e.message)}, mutated: false}; } }
function diffKeys(a, b){ const out = []; const ks = new Set([...a.keys(), ...b.keys()]); for(const k of ks) if(a.get(k) !== b.get(k)) out.push(k); return out; }
const iso = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const START = new Date(2026, 9, 5);   // Mon 2026-10-05 (hand calendar)
const addD = n => { const x = new Date(START); x.setDate(x.getDate() + n); return x; };

const G = GOALS[+GI];
const R = {goal: G.k, configs: 0, builds: 0, selfIdent: {n:0, bad:0, ex:[]}, classes: {}, unclassified: [], crashes: {both:0, candOnly:[], baseOnly:[]}, cfgMut: {base:0, cand:0, ex:[]}, trial: {checked:0, bad:[]}, lens: {bad:[]}};
const bump = k => R.classes[k] = (R.classes[k]||0) + 1;
function mk(fi, ei, qi, rs, seed, over){
  return Object.assign({name:'GK', primaryPath:'event', eventTargeted:true, cardioTypes:G.types.slice(), cardioGoals:clone(G.goals),
    liftingFocus:FOCUS[fi], experience:EXP[ei], ageBracket:'18-35', equipment:EQUIP[qi], unit:'lbs', restDays:rs.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, startDate:iso(START), seed}, over||{});
}
function compare(tag, cfg, classify){
  R.configs++;
  const b = build(B, cfg), b2 = build(B2, cfg), c = build(C, cfg); R.builds += 3;
  const fb = flat(b.p), fb2 = flat(b2.p), fc = flat(c.p);
  R.selfIdent.n++; const sd = diffKeys(fb, fb2); if(sd.length){ R.selfIdent.bad++; if(R.selfIdent.ex.length<5) R.selfIdent.ex.push(tag + ' ' + sd.slice(0,3)); }
  if(b.mutated) R.cfgMut.base++; if(c.mutated){ R.cfgMut.cand++; if(!b.mutated && R.cfgMut.ex.length<5) R.cfgMut.ex.push(tag); }
  if(b.p.crash && c.p.crash){ R.crashes.both++; return; }
  if(c.p.crash){ R.crashes.candOnly.push(tag + ' ' + c.p.crash); return; }
  if(b.p.crash){ R.crashes.baseOnly.push(tag + ' ' + b.p.crash); return; }
  const ks = diffKeys(fb, fc);
  for(const k of ks){ const cl = classify(k, b.p, c.p); if(cl) bump(cl); else if(R.unclassified.length < 40) R.unclassified.push(tag + ' :: ' + k + ' :: base ' + String(fb.get(k)).slice(0,160) + ' || cand ' + String(fc.get(k)).slice(0,160)); else R.unclassified.push('.'); }
  return {b: b.p, c: c.p};
}
const none = () => null;
const isPace = !!(G.goals.run && PACE.has(G.goals.run.id));
const lenOf = cfg => { const r = build(B, cfg); return r.p.crash ? null : r.p.totalWeeks; };

for(let fi=0; fi<3; fi++) for(let ei=0; ei<3; ei++) for(let qi=0; qi<3; qi++) for(let ri=0; ri<3; ri++) for(const seed of SEEDS){
  const rs = RESTS[ri], tag0 = `${G.k}|${FOCUS[fi]}|${EXP[ei]}|${EQUIP[qi]}|${rs.join('')}|${seed}`;
  // V0 undated: byte-identical for every goal
  compare('V0 ' + tag0, mk(fi,ei,qi,rs,seed,{eventTargeted:false, raceDate:''}), none);
  const len = lenOf(mk(fi,ei,qi,rs,seed,{eventTargeted:false, raceDate:''}));
  // V1 dated, no pins (a stored pre-V207 cfg as V206's doGenerate wrote it): byte-identical for every goal
  for(const k of [3, 8, 12]){ const rd = iso(addD(7*(k-1) + ((k + fi + seed) % 7)));
    compare(`V1 ${tag0} race ${rd}`, mk(fi,ei,qi,rs,seed,{raceDate:rd, _raceDateCappedWeeks: len || undefined}), none); }
  // V3 pins present on a non-pace goal: the B1 guard must confine them (byte-identical)
  if(!isPace && len){ const tw = Math.max(1, len - 2); const rd = iso(addD(7*(tw-1) + (fi+ri)%7));
    compare(`V3 ${tag0} tw ${tw}`, mk(fi,ei,qi,rs,seed,{raceDate:rd, _testWeek:tw, _raceDateCappedWeeks:len}), none); }
}
// V2 pinned pace programs: every test week 1..len x every weekday, dims rotated
if(isPace){
  let n = 0;
  const L = lenOf(mk(0,1,0,RESTS[0],SEEDS[0],{eventTargeted:false, raceDate:''}));
  for(let tw=1; tw<=L; tw++) for(let wd=0; wd<7; wd++) for(let ri=0; ri<3; ri++) for(const seed of SEEDS){
    n++; const fi = n%3, ei = (n>>1)%3, qi = (n>>2)%3, rs = RESTS[ri];
    const rd = iso(addD(7*(tw-1) + wd)), raceDay = DAYS[wd];
    const tag = `V2 ${G.k}|${FOCUS[fi]}|${EXP[ei]}|${EQUIP[qi]}|${rs.join('')}|${seed} tw ${tw} ${raceDay}`;
    const cfg = mk(fi,ei,qi,rs,seed,{raceDate:rd, _testWeek:tw, _raceDateCappedWeeks:tw});
    const flatIdx = (w, d) => (w - (tw-1)) * 7 + DAYS.indexOf(d);    // index in [tw-1, tw] ; test at 7+wd
    const res = compare(tag, cfg, (k, b, c) => {
      if(k === 'top') return null;
      const [w, d, kind] = k.split('|'); const W = +w;
      if(W > tw) return null;
      if(W === tw) return 'TESTWEEK(B1/B2a/B3/B4)';
      if(W === tw - 1){ const gap = (7 + wd) - flatIdx(W, d); if(gap >= 1 && gap <= 3) return 'PRETEST_T1-T3(B4/eve)'; }
      if(tw < 6 && kind === 'cardio' && /"type":"run"/.test(String(flat(c).get(k) || flat(b).get(k)))) return 'A3_TAPER_run(tw<6)';
      return null;
    });
    if(res){
      if(res.c.totalWeeks !== tw || Object.keys(res.c.weeks).length !== tw) R.lens.bad.push(tag + ' len ' + res.c.totalWeeks);
      R.trial.checked++;
      const day = res.c.weeks[tw] && res.c.weeks[tw][raceDay];
      const cards = day ? [].concat(day.cardio || []) : [];
      const trials = []; for(const w of Object.keys(res.c.weeks)) for(const d of DAYS){ const dd = res.c.weeks[w][d]; if(dd) [].concat(dd.cardio||[]).forEach(x => { if(x && /TIME TRIAL/.test(x.subtype||'')) trials.push(w+d); }); }
      const okT = cards.some(x => x && /Test — TIME TRIAL/.test(x.subtype||'')) && trials.length === 1 && day.title === 'Test Day';
      if(!okT && R.trial.bad.length < 20) R.trial.bad.push(tag + ' trials=' + trials.join(',') + ' title=' + (day && day.title) + ' sub=' + cards.map(x=>x&&x.subtype).join('+'));
      else if(!okT) R.trial.bad.push('.');
    }
  }
}
console.log(JSON.stringify(R));
