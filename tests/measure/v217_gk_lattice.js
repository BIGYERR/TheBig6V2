// v217_gk_lattice.js — gatekeeper differential + identity fuzz for V217 (D160: the dedupe reads yesterday as it will ship).
// A wrapper around deconflictAdjacentDupes records every rename it makes (before/after snapshots of the week),
// and a second snapshot proves the call mutates nothing but the renamed items. Oracle for a PHANTOM rename:
// the trigger name (the item's old name, which the dedupe saw on the previous calendar day) is absent from the
// SHIPPED previous day. Independent of the engine: it reads the final program, not _d18View or d18LongRunDayPass.
// node v217_gk_lattice.js <cand> <base> <shard> <nshards>
'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const [CAND, BASE, SH, NS] = process.argv.slice(2);
const clone = v => JSON.parse(JSON.stringify(v));
function canon(v){ if(v === null || typeof v !== 'object') return JSON.stringify(v) === undefined ? 'null' : JSON.stringify(v); if(Array.isArray(v)) return '[' + v.map(canon).join(',') + ']'; return '{' + Object.keys(v).filter(k => !/^(id|created)$/.test(k)).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'; }
const DAYS = ['mon','tue','wed','thu','fri','sat','sun'], ALL = ['sun','mon','tue','wed','thu','fri','sat'];
function instrument(file){
  const IA = H.load(file);
  IA.ctx.__gkLog = [];
  IA.eval(`(function(){ const orig = deconflictAdjacentDupes;
    deconflictAdjacentDupes = function(weeks, cfg, seed, totalWeeks){
      const pre = JSON.parse(JSON.stringify(weeks)); const r = orig.apply(this, arguments); const post = JSON.parse(JSON.stringify(weeks));
      __gkLog.push({pre, post}); return r; }; })()`);
  return IA;
}
const C = instrument(CAND), B = instrument(BASE), B2 = H.load(BASE);
const mb = {mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}};
const GOALS = [ {k:'pace', types:['run'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}}},
  {k:'base', types:['run'], goals:{run:{id:'run_base', label:'B', ...mb}}},
  {k:'half', types:['run'], goals:{run:{id:'run_half', label:'H', ...mb, baselineDist:'5', baseline:'5mi'}}, race:'2026-12-06'},
  {k:'mara', types:['run'], goals:{run:{id:'run_marathon', label:'M', ...mb, baselineDist:'8', baseline:'8mi'}}},
  {k:'pace+bike', types:['run','bike'], goals:{run:{id:'run_pace_goal', label:'P', ...mb, targetDist:'1.5', targetMins:'11', targetSecs:'0', paceUnit:'mi'}, bike:{id:'bike_base', label:'Bb'}}},
  {k:'bike', types:['bike'], goals:{bike:{id:'bike_base', label:'Bb'}}} ];
const EQUIP = ['commercial','crossfit','home_full','home_basic','bodyweight'];
const FOCUS = ['strength','hypertrophy','balanced','support_prevention','support_athletic','fatloss'];
const RESTS = [['sun','wed'], ['sat','sun'], ['mon','thu','sun'], ['sun']];
const INJ = [null, null, {region:'knee',tier:'workaround'}, {region:'elbow',tier:'workaround'}];
function renamesOf(log){ const out = []; if(!log) return out;
  for(const w of Object.keys(log.post)) for(const d of Object.keys(log.post[w])){ const a = log.pre[w] && log.pre[w][d], b = log.post[w][d]; if(!a || !b) continue;
    (b.sections||[]).forEach((s, si) => (s.items||[]).forEach((it, ii) => { const o = a.sections && a.sections[si] && a.sections[si].items && a.sections[si].items[ii]; if(o && o.name !== it.name) out.push({w, d, si, ii, from:o.name, to:it.name}); })); }
  return out; }
function unexplained(log, rn){ // everything the call changed, minus the recorded renamed items' name/detail
  const pre = clone(log.pre), post = clone(log.post);
  for(const r of rn){ const a = pre[r.w][r.d].sections[r.si].items[r.ii], b = post[r.w][r.d].sections[r.si].items[r.ii]; for(const k of Object.keys(b)) if(k === 'name' || k === 'detail'){ delete a[k]; delete b[k]; } }
  return canon(pre) !== canon(post); }
function prevDay(p, w, d){ const flat = []; for(const ww of Object.keys(p.weeks).map(Number).sort((x, y) => x - y)) for(const dd of DAYS) flat.push({w:ww, d:dd}); const i = flat.findIndex(z => z.w === +w && z.d === d); return i > 0 ? flat[i-1] : null; }
const hasName = (day, n) => !!day && (day.sections||[]).some(s => (s.items||[]).some(it => it && it.name && it.name.toLowerCase() === n.toLowerCase()));
const R = {shard:SH, configs:0, selfBad:0, crash:0, mut:[0,0], cls:{}, uncl:0, unclEx:[], orc:{}, orcEx:[]};
const bump = k => R.cls[k] = (R.cls[k]||0) + 1; const O = (k, n = 1) => R.orc[k] = (R.orc[k]||0) + n; const oex = s => { if(R.orcEx.length < 12) R.orcEx.push(s); };
const all = []; for(const G of GOALS) for(const eq of EQUIP) for(const fo of FOCUS) for(const ex of ['beginner','intermediate','advanced']) for(const rs of RESTS) for(const seed of [24865, 76308, 99991]) all.push({G, eq, fo, ex, rs, seed});
all.forEach((x, i) => { if(i % +NS !== +SH) return;
  const inj = INJ[i % INJ.length];
  const cfg = {name:'GK', primaryPath:'event', eventTargeted:!!x.G.race, raceDate:x.G.race||'', cardioTypes:x.G.types.slice(), cardioGoals:clone(x.G.goals), liftingFocus:x.fo, experience:x.ex, ageBracket:'18-35', equipment:x.eq, unit:'lbs', restDays:x.rs, days:ALL.slice(), bench:185, squat:255, deadlift:315, startDate:'2026-10-05', seed:x.seed};
  if(inj) cfg.injury = inj;
  const tag = `${x.G.k}|${x.eq}|${x.fo}|${x.ex}|${x.rs.join('')}|${x.seed}|${JSON.stringify(inj)}`; R.configs++;
  const run = IA => { IA.ctx.__gkLog = []; const cc = clone(cfg); try { const p = clone(IA.buildProgram(cc)); return {p, mut: canon(cc) !== canon(cfg), log: IA.ctx.__gkLog.slice()}; } catch(e){ return {p:{crash:String(e.message)}, log:[]}; } };
  const b = run(B), c = run(C); let b2; try { b2 = clone(B2.buildProgram(clone(cfg))); } catch(e){ b2 = {crash:String(e.message)}; }
  if(b.mut) R.mut[0]++; if(c.mut) R.mut[1]++;
  if(b.p.crash || c.p.crash){ R.crash++; return; }
  if(canon(b.p) !== canon(b2)) R.selfBad++;
  if(b.log.length !== 1 || c.log.length !== 1){ O('dedupe call count not 1'); }
  const rb = renamesOf(b.log[0]), rc = renamesOf(c.log[0]);
  // live previous day unmutated: the call changes nothing but the renamed items' name/detail
  if(c.log[0] && unexplained(c.log[0], rc)){ O('V217 dedupe changed more than renamed items'); oex(tag + ' unexplained mutation'); }
  if(b.log[0] && unexplained(b.log[0], rb)) O('V216 dedupe changed more than renamed items');
  const classify = (p, rn) => rn.map(r => { const pd = prevDay(p, r.w, r.d); const trigSeenPre = true; const shipped = pd ? p.weeks[pd.w][pd.d] : null; return {...r, phantom: !hasName(shipped, r.from)}; });
  const cb = classify(b.p, rb), cc = classify(c.p, rc);
  O('V216 renames', cb.length); O('V216 phantom renames', cb.filter(r => r.phantom).length); O('V217 renames', cc.length); O('V217 phantom renames', cc.filter(r => r.phantom).length);
  cb.filter(r => r.phantom).forEach(r => { R.trig = R.trig || {}; const k = x.G.k + ': ' + r.from; R.trig[k] = (R.trig[k]||0) + 1; });
  cc.filter(r => r.phantom).forEach(r => oex(tag + ' V217 phantom W' + r.w + r.d + ' ' + r.from + ' -> ' + r.to));
  const key = r => r.w + r.d + '|' + r.si + '|' + r.ii + '|' + r.from + '>' + r.to;
  const nb = new Set(cb.filter(r => !r.phantom).map(key)), nc = new Set(cc.map(key));
  const lost = [...nb].filter(k => !nc.has(k)), gained = [...nc].filter(k => !nb.has(k));
  if(lost.length || gained.length){ O('non-phantom rename set differs'); oex(tag + ' lost ' + lost.slice(0,2).join(',') + ' gained ' + gained.slice(0,2).join(',')); }
  // program differential vs V216: allowed only on V216 phantom-rename days, and only that item's name/detail
  const phDays = new Set(cb.filter(r => r.phantom).map(r => r.w + r.d));
  const top = p => { const o = {}; for(const k of Object.keys(p)) if(k !== 'weeks' && k !== 'cfg') o[k] = p[k]; return canon(o); };
  if(top(b.p) !== top(c.p)){ R.uncl++; if(R.unclEx.length < 8) R.unclEx.push(tag + ' top-level field moved'); }
  let moved = 0;
  for(const w of Object.keys(c.p.weeks)) for(const d of DAYS){ const bd = b.p.weeks[w] && b.p.weeks[w][d], cd = c.p.weeks[w][d]; if(canon(bd) === canon(cd)) continue; moved++;
    const phR = cb.filter(r => r.phantom && r.w + r.d === w + d);
    let ok = phDays.has(w + d);
    if(ok){ const x1 = clone(bd), x2 = clone(cd); phR.forEach(r => { [x1, x2].forEach(z => { const it = z.sections[r.si].items[r.ii]; delete it.name; delete it.detail; }); }); ok = canon(x1) === canon(x2); }
    if(ok) bump('V216 phantom-rename day reverted (item name+detail)');
    else { R.uncl++;
      const pd = prevDay(c.p, w, d); const afterPhantom = !!pd && phDays.has(pd.w + pd.d);
      const bR = rb.filter(r => r.w + r.d === w + d), cR = rc.filter(r => r.w + r.d === w + d);
      const sameSrcNewTo = cR.some(r => bR.some(q => q.si === r.si && q.ii === r.ii && q.from === r.from && q.to !== r.to));
      const newRename = cR.some(r => !bR.some(q => q.si === r.si && q.ii === r.ii));
      const lostR = bR.some(q => !cR.some(r => r.si === q.si && r.ii === q.ii));
      const kind = afterPhantom && newRename ? 'A cascade (new rename the day after a reverted phantom)'
        : sameSrcNewTo ? 'B pool re-admission (same trigger, different replacement)'
        : newRename ? 'C pool opening (a new real rename)'
        : lostR ? 'D revert removes a V216 rename' : 'UNRULED';
      R.knock = R.knock || {}; R.knock[kind] = (R.knock[kind]||0) + 1; R.unclGoal = R.unclGoal || {}; R.unclGoal[x.G.k] = (R.unclGoal[x.G.k]||0) + 1;
      if(R.unclEx.length < 8) R.unclEx.push(tag + ' W' + w + d + ' [' + kind + '] V216 ' + JSON.stringify(bR.map(r => r.from + '>' + r.to)) + ' V217 ' + JSON.stringify(cR.map(r => r.from + '>' + r.to))); } }
  if(!moved) bump('program identical'); else O('programs changed');
});
console.log(JSON.stringify(R));
