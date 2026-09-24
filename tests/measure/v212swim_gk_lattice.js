// v212swim_gk_lattice.js — gatekeeper differential + identity fuzz for V212 (D110a swim clock, notes, M2, D144).
// node v212swim_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const C = H.load(CAND), B = H.load(BASE), B2 = H.load(BASE);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v);
  if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
// swim entry variants (500 goal: base = current 500; 100 goal: base = current 100, base500 = current 500)
const E500 = [
  {k:'none'}, {k:'mins', baseMins:'10', baseSecs:''}, {k:'full', baseMins:'9', baseSecs:'30'}, {k:'secsOnly', baseMins:'', baseSecs:'45'},
  {k:'carry', baseMins:'10', baseSecs:'8'}, {k:'met', baseMins:'7', baseSecs:'0'}];
const T500 = [{targetMins:'8', targetSecs:'30'}, {targetMins:'6', targetSecs:'0'}, {targetMins:'', targetSecs:'50'}];
const E100 = [
  {k:'none'}, {k:'both', baseMins:'1', baseSecs:'45', base500Mins:'9', base500Secs:'30'}, {k:'no500', baseMins:'1', baseSecs:'45'},
  {k:'no100', base500Mins:'9', base500Secs:'30'}, {k:'floor', baseMins:'3', baseSecs:'30', base500Mins:'9', base500Secs:'0'}, {k:'secs100', baseMins:'', baseSecs:'55', base500Mins:'8', base500Secs:'20'}];
const T100 = [{targetMins:'1', targetSecs:'30'}, {targetMins:'1', targetSecs:'10'}, {targetMins:'', targetSecs:'58'}];
const GOALS = [];
for(const e of E500) for(const t of T500) for(const u of ['yd','m']) GOALS.push({k:'s500|'+e.k+'|'+t.targetMins+':'+t.targetSecs+'|'+u, types:['swim'], goals:{swim:{id:'swim_500_time', label:'500', swimUnit:u, ...e, ...t}}, swimTime:true});
for(const e of E100) for(const t of T100) for(const u of ['yd','m']) GOALS.push({k:'s100|'+e.k+'|'+t.targetMins+':'+t.targetSecs+'|'+u, types:['swim'], goals:{swim:{id:'swim_100_time', label:'100', swimUnit:u, ...e, ...t}}, swimTime:true});
for(const id of ['swim_mile','swim_tri','swim_base']) GOALS.push({k:id, types:['swim'], goals:{swim:{id, label:id}}, swimUntimed:true});
GOALS.push({k:'pace+s500', types:['run','swim'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, swim:{id:'swim_500_time', label:'500', swimUnit:'yd', baseMins:'9', baseSecs:'30', targetMins:'8', targetSecs:'30'}}, swimTime:true});
GOALS.push({k:'half+swimmile', types:['run','swim'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}, swim:{id:'swim_mile', label:'M'}}, swimUntimed:true, race:'2026-12-06'});
for(const [k, g] of [['pace', {run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}], ['half', {run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}], ['base', {run:{id:'run_base', label:'B', ...mb}}], ['bike', {bike:{id:'bike_ftp', label:'F'}}]])
  GOALS.push({k, types:Object.keys(g), goals:g, race: k === 'half' ? '2026-12-06' : ''});
const clk = s => { const m = /^(\d+):(\d\d)$/.exec(s||''); return m ? +m[1]*60 + +m[2] : null; };
const R = {shard: SH, configs: 0, selfBad: 0, crash: {both:0, c:[], b:[]}, mut:[0,0], lenDiff: [], classes: {}, uncl: 0, unclEx: [],
  orc: {swimInt:0, intRule:0, repCap:0, gainOver:0, anchorMissing:0, anchorWrong:0, metMissing:0, d144Missing:0, dash:0, nan:0, ex:[]}, states:{}};
const bump = k => R.classes[k] = (R.classes[k]||0) + 1;
const bad = (k, s) => { R.orc[k]++; if(R.orc.ex.length < 12) R.orc.ex.push(k + ' ' + s); };
function cardsOf(p){ const out = []; for(const w of Object.keys(p.weeks||{})) for(const d of Object.keys(p.weeks[w])){ const x = p.weeks[w][d]; if(x) [].concat(x.cardio||[]).forEach((c,i) => c && out.push({w:+w, d, i, c})); } return out; }
function oracle(p, G, tag, cfg){
  const sw = G.goals.swim; if(!sw) return;
  const ints = cardsOf(p).filter(x => x.c.type === 'swim' && /Interval/i.test(x.c.subtype||'')).sort((a,b) => a.w - b.w);
  const split = {};
  for(const {w, d, c} of ints){ R.orc.swimInt++;
    const txt = String(c.detail||'') + ' ' + String(c.note||'');
    if(/NaN|undefined|Infinity/.test(txt)) bad('nan', tag + ' W' + w + ' ' + txt.slice(0,120));
    const reps = /(\d+) x 100/.exec(c.detail||''); if(reps && +reps[1] > 8) bad('repCap', tag + ' W' + w + ' reps ' + reps[1]);
    if(/[a-z] — [a-z]|\s-\s/i.test(String(c.note||''))) bad('dash', tag + ' W' + w + ' note ' + String(c.note).slice(0,100));
    if(G.swimTime){
      const m = /(\d+) x 100(?:yd|m) at (\d+:\d\d)\/100[.(][^\n]*?(?:this week's 500 pace|this week's goal split) of (\d+:\d\d)\/100/i.exec(c.detail||''); if(m) m.splice(1,1);
      if(!m){ bad('intRule', tag + ' W' + w + ' unparsed ' + String(c.detail).slice(0,120)); continue; }
      const ip = clk(m[1]), wp = clk(m[2]); split[w] = wp;
      if(Math.abs((wp - ip) - 2) > 1) bad('intRule', tag + ' W' + w + ' int ' + m[1] + ' split ' + m[2]);
      if(sw.id === 'swim_100_time' && !/500 pace/.test(c.detail||'')) bad('d144Missing', tag + ' W' + w);
      if(sw.id !== 'swim_100_time' && /500 pace/.test(c.detail||'')) bad('d144Missing', tag + ' W' + w + ' 500-pace phrase on a non-100 goal');
      if(/already within your current split/.test(String(c.note||''))) R.orc.metSeen = (R.orc.metSeen||0) + 1; if(/Split moves \d/.test(String(c.note||''))) R.orc.dampSeen = (R.orc.dampSeen||0) + 1; if(/^No current 500/.test(String(c.note||''))) R.orc.anchorSeen = (R.orc.anchorSeen||0) + 1;
      const tot = (a, b) => (+a||0)*60 + (+b||0);
      const baseT = sw.id === 'swim_100_time' ? tot(sw.base500Mins, sw.base500Secs) : tot(sw.baseMins, sw.baseSecs);
      const hasAnchor = /^No current 500(yd|m) time was entered/.test(String(c.note||''));
      if(!(baseT > 0) && !hasAnchor) bad('anchorMissing', tag + ' W' + w + ' note ' + String(c.note).slice(0,80));
      if(baseT > 0 && hasAnchor) bad('anchorWrong', tag + ' W' + w);
    }
  }
  if(G.swimTime){ const ws = Object.keys(split).map(Number).sort((a,b)=>a-b);
    const rate = {beginner:4, intermediate:3, advanced:2}[cfg.experience] * ({'55+':0.65,'36-54':0.85,'18-35':1}[cfg.ageBracket]);
    for(let i = 1; i < ws.length; i++){ const drop = (split[ws[i-1]] - split[ws[i]]) / (ws[i] - ws[i-1]); if(drop > rate + 1.01) bad('gainOver', tag + ' W' + ws[i] + ' drop ' + drop.toFixed(2) + ' > ' + rate); } }
}
const all = [];
for(const G of GOALS) for(const ex of ['beginner','intermediate','advanced']) for(const ag of ['18-35','55+']) for(const fo of ['balanced','strength']) for(const eq of ['commercial','home_full']) for(const seed of [24865, 76308]) all.push({G, ex, ag, fo, eq, seed});
all.forEach((x, idx) => { if(idx % +NS !== +SH) return;
  const cfg = {name:'GK', primaryPath:'event', eventTargeted: !!x.G.race, raceDate: x.G.race || '', cardioTypes:x.G.types.slice(), cardioGoals:clone(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:x.ag, equipment:x.eq, unit:'lbs', restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'], bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  const tag = `${x.G.k}|${x.ex}|${x.ag}|${x.fo}|${x.eq}|${x.seed}`; R.configs++;
  let b, b2, c; const tryB = IA => { const cc = clone(cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(cfg)}; } catch(e){ return {p:{crash:String(e.message)}}; } };
  b = tryB(B); b2 = tryB(B2); c = tryB(C); if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
  if(canon(b.p) !== canon(b2.p)) R.selfBad++;
  if(b.p.crash && c.p.crash){ R.crash.both++; return; } if(c.p.crash){ R.crash.c.push(tag + ' ' + c.p.crash); return; } if(b.p.crash){ R.crash.b.push(tag + ' ' + b.p.crash); return; }
  if(b.p.totalWeeks !== c.p.totalWeeks && R.lenDiff.length < 10) R.lenDiff.push(tag + ' ' + b.p.totalWeeks + ' -> ' + c.p.totalWeeks);
  oracle(c.p, x.G, tag, cfg);
  if(x.G.goals.swim){ const st = C.eval('_swimEntryState')(x.G.goals.swim); const k = x.G.goals.swim.id + ' ' + (x.G.goals.swim.k || x.G.k.split('|')[1] || '') + ' -> ' + (st.ok ? 'ok' : (st.blank ? 'blank' : 'bad')); R.states[k] = (R.states[k]||0) + 1; }
  const top = p => { const o = {}; for(const k of Object.keys(p)) if(!['weeks','cfg'].includes(k)) o[k] = p[k]; return canon(o); };
  if(top(b.p) !== top(c.p)){ R.uncl++; if(R.unclEx.length < 6) R.unclEx.push(tag + ' top'); }
  for(const w of new Set([...Object.keys(b.p.weeks), ...Object.keys(c.p.weeks)])) for(const d of ['mon','tue','wed','thu','fri','sat','sun']){
    const bd = b.p.weeks[w] && b.p.weeks[w][d], cd = c.p.weeks[w] && c.p.weeks[w][d]; if(canon(bd) === canon(cd)) continue;
    const strip = x => { if(!x) return x; const y = clone(x); delete y.cardio; return y; };
    let cl = null;
    if(canon(strip(bd)) === canon(strip(cd))){
      const bc = [].concat(bd.cardio||[]), cc = [].concat(cd.cardio||[]);
      const diffIdx = bc.map((z, i) => canon(z) !== canon(cc[i]) ? i : -1).filter(i => i >= 0);
      if(bc.length === cc.length && diffIdx.every(i => bc[i] && bc[i].type === 'swim' && cc[i].type === 'swim')){
        if(x.G.swimTime) cl = 'SWIM time-goal card';
        else if(x.G.swimUntimed){ const norm = z => canon({...z, note: String(z.note||'').replace('build to 8. Hard cap at 8', 'build to 10. Hard cap at 10')}); cl = diffIdx.every(i => norm(bc[i]) === canon(cc[i]) || norm(cc[i]) === canon(bc[i])) ? 'SWIM untimed INT note (cap 10 -> 8)' : null; }
      }
    }
    if(cl) bump(cl); else { R.uncl++; if(R.unclEx.length < 6) R.unclEx.push(tag + ' W' + w + d + ' base ' + canon(bd).slice(0,160) + ' || cand ' + canon(cd).slice(0,160)); }
  }
});
console.log(JSON.stringify(R));
