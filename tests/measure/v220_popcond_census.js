// V220 measure: P-POPCOND day-type census re-run on HEAD vs V207 (the ruling's baseline tag).
// usage: node tests/measure/v220_popcond_census.js <head.html> <v207.html>
// Oracle: day class from the ruling's §1c lens text (cardio = !!day.cardio; lift = dayCode's
// liftSections test [!core && !hip && items.length] minus labels /mobility|taper/i), re-implemented
// here, never by calling dayCode/popEligible. Pool eligibility from a hand tag table (ruling §6)
// applied to the raw POP_POOLS entries. Test/race identity from subtype text + calendar adjacency.
'use strict';
process.env.TZ='America/New_York';
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const [HEADF,V207F]=process.argv.slice(2);
const DOW7=['mon','tue','wed','thu','fri','sat','sun'];
const BASE=JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));
function goalCfg(k,o={}){
  const c=JSON.parse(JSON.stringify(BASE)); const g=c.cardioGoals.run;
  const race={half:'run_half',marathon:'run_marathon','10k':'run_10k','5k':'run_5k'};
  if(race[k]){ g.id=race[k]; g.label=k; c.primaryPath='event'; c.eventTargeted=true; c.raceDate='2026-12-06'; if(o.undated){c.eventTargeted=false; delete c.raceDate;} }
  else if(k==='liftonly'){ c.primaryPath='lift'; c.cardioTypes=[]; c.cardioGoals={}; c.eventTargeted=false; delete c.raceDate; }
  else if(k==='base'){ g.id='run_base'; g.label='Base'; c.primaryPath='cardio'; c.eventTargeted=false; delete c.raceDate; }
  else { // NSW test goals: mile / 1.5mi / pace(3mi) on run_pace_goal
    const T={mile:['1','7','0'],'1.5mi':['1.5','11','0'],pace:['3','25','0']}[k];
    g.id='run_pace_goal'; g.label=k; g.targetDist=T[0]; g.targetMins=T[1]; g.targetSecs=T[2]; g.paceUnit='mi';
    c.primaryPath='cardio'; c.eventTargeted=false; delete c.raceDate; }
  if(o.exp) c.experience=o.exp; if(o.rest) c.restDays=o.rest.slice(); if(o.seed!=null) c.seed=o.seed;
  return c;
}
const TESTS=['mile','1.5mi','pace'];
function isoAdd(iso,n){const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}
function classify(day){
  const C=!!day.cardio; const secs=(day.sections||[]);
  const raw=secs.filter(s=>!s.core&&!s.hip&&(s.items||[]).length);
  const lift=raw.filter(s=>!/mobility|taper/i.test(s.label||''));
  const coreHip=secs.some(s=>(s.core||s.hip)&&(s.items||[]).length);
  let k; if(C&&lift.length)k='run+lift'; else if(C&&raw.length)k='run+mob'; else if(C)k='run-only'; else if(lift.length)k='lift-only'; else k='UNPLACEABLE';
  return {k,C,lift:lift.length>0,coreHip,labels:secs.map(s=>(s.label||s.coreHeader||'?')+(s.core?'(core)':'')+(s.hip?'(hip)':'')).join('|')};
}
function sub(day){const c=day.cardio; if(!c)return ''; return Array.isArray(c)?c.map(x=>x.subtype||x.type).join('+'):(c.subtype||c.type||'');}
function run(ART,tag){
  const IA=H.load(ART); const ctx=IA.ctx;
  const out={tag,version:IA.version,progs:[],POOLS:IA.eval('POP_POOLS')};
  function build(cfg){ return IA.buildProgram(cfg); }
  function census(key,cfg,meta){
    let prog; try{ prog=build(cfg); }catch(e){ out.progs.push({key,meta,err:String(e&&e.message||e)}); return; }
    const tw=prog.totalWeeks||Object.keys(prog.weeks).length;
    const flat=[]; for(let w=1;w<=tw;w++){const wk=prog.weeks[w]; if(!wk)continue; DOW7.forEach(d=>{const day=wk[d]; if(day&&!day.rest) flat.push({w,d,day});});}
    // final scheduled day via the app's own calendar (only for the season tier label)
    let final=null; try{ ctx.__P=prog; if(!prog.startDate) prog.startDate=prog.startDate||'2026-08-03'; IA.eval('activeProg=globalThis.__P; activeProgId="m";'); final=ctx.finalScheduledDay(); }catch(e){}
    const counts={'lift-only':0,'run+lift':0,'run+mob':0,'run-only':0,'UNPLACEABLE':0}; const special=[];
    const testIdx=flat.findIndex(x=>/TIME TRIAL/i.test(sub(x.day))); const raceIdx=flat.findIndex(x=>/^race day|^race\b/i.test(sub(x.day))||/race day/i.test(x.day.title||''));
    flat.forEach((x,i)=>{ const c=classify(x.day); counts[c.k]++;
      const isFinal=final&&final.week===x.w&&final.d===x.d;
      let role=''; if(i===testIdx)role='TEST DAY'; else if(i===raceIdx)role='RACE DAY'; else if(testIdx>=0&&i===testIdx-1)role='test-eve'; else if(raceIdx>=0&&i===raceIdx-1)role='race-eve';
      if(/shakeout/i.test(sub(x.day)))role+=(role?'/':'')+'shakeout-named';
      if(c.k==='run-only'||c.k==='UNPLACEABLE'||role) special.push({w:x.w,d:x.d,cls:c.k,role,tier:isFinal?'season':'workout/streak',title:x.day.title||'',sub:sub(x.day),labels:c.labels,coreHip:c.coreHip});
    });
    out.progs.push({key,meta,tw,n:flat.length,counts,special,final:final?final.week+'/'+final.d:null,shapes:flat.map(x=>{const c=classify(x.day);return c.k+'#'+(c.coreHip?'ch':'')+'#'+c.labels.replace(/\d+/g,'N');})});
    return prog;
  }
  const GOALS=['half','marathon','10k','5k','mile','1.5mi','pace','base','liftonly'];
  const EXPS=['beginner','intermediate','advanced'], RESTS=[['sun','wed'],['sun'],['sat','sun']], SEEDS=[76308,1013];
  for(const g of GOALS)for(const exp of EXPS)for(const rest of RESTS)for(const seed of SEEDS){
    const o={exp,rest,seed}; const meta={g,exp,rest:rest.join('+'),seed};
    const cfg=goalCfg(g,o); const p=census(`${g}|${exp}|${meta.rest}|${seed}|plain`,cfg,{...meta,mode:'plain'});
    if(['5k','10k'].includes(g)) census(`${g}|${exp}|${meta.rest}|${seed}|undated`,goalCfg(g,{...o,undated:true}),{...meta,mode:'undated'});
    if(TESTS.includes(g)&&p){ // dated test: pin test week to the program's own length (as doGenerate does)
      const tw=p.totalWeeks||Object.keys(p.weeks).length;
      for(const tdow of ['sat','tue','mon']){
        const c2=goalCfg(g,o); c2.eventTargeted=true; const start='2026-08-03'; // Monday
        c2.raceDate=isoAdd(start,(tw-1)*7+DOW7.indexOf(tdow)); c2._testWeek=tw; c2._raceDateCappedWeeks=tw;
        census(`${g}|${exp}|${meta.rest}|${seed}|dated-${tdow}`,c2,{...meta,mode:'dated-'+tdow});
      }
    }
  }
  return out;
}
const R={HEAD:run(HEADF,'HEAD'),V207:run(V207F,'V207')};
// self-stability: HEAD HALF_MANNY built twice equals itself
{ const IA=H.load(HEADF); const a=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)), b=H.progDigest(IA.buildProgram(H.fixtures.HALF_MANNY)); console.log('baseline self-equal', a===b, a); }
for(const r of Object.values(R)){ const errs=r.progs.filter(p=>p.err); console.log(`${r.tag} ia-version ${r.version}: ${r.progs.length} builds, ${errs.length} errors`); errs.slice(0,5).forEach(e=>console.log('  ERR',e.key,e.err)); }
const K=['lift-only','run+lift','run+mob','run-only','UNPLACEABLE'];
console.log('\n=== RULING REPLICA (HALF_MANNY-derived, intermediate, sun+wed, seed 76308): V207 then HEAD  [n: lift-only/run+lift/run+mob/run-only/UNPL]');
const RULING={half:'70: 14/45/9/2',marathon:'90: 18/54/16/2','10k':'40: 8/27/3/2','5k':'40: 8/30/0/2',mile:'30: 12/18/0/0',pace:'30: 12/18/0/0',base:'30: 6/24/0/0',liftonly:'30: 30/0/0/0'};
const rk=(g,mode)=>`${g}|intermediate|sun+wed|76308|${mode}`;
const fmt=p=>p?(p.err?'ERR':`${p.n}: ${K.map(k=>p.counts[k]).join('/')}`):'-';
for(const g of ['half','marathon','10k','5k','mile','1.5mi','pace','base','liftonly']) for(const mode of ['plain','undated','dated-sat','dated-tue','dated-mon']){
  const a=R.V207.progs.find(p=>p.key===rk(g,mode)), b=R.HEAD.progs.find(p=>p.key===rk(g,mode)); if(!a&&!b) continue;
  console.log(`  ${(g+' '+mode).padEnd(20)} ruling ${(mode==='plain'&&RULING[g])||'-'.padEnd(14)} | V207 ${fmt(a).padEnd(22)} | HEAD ${fmt(b)}`);
}
console.log('\n=== FULL LATTICE: totals per (goal, mode) over exp x rest x seed (18 configs each)');
for(const tag of ['V207','HEAD']){ const agg={};
  for(const p of R[tag].progs){ if(p.err)continue; const m=p.meta.mode.startsWith('dated')?'dated':p.meta.mode; const k=p.meta.g+'|'+m; const a=agg[k]||(agg[k]={cfg:0,n:0,c:Object.fromEntries(K.map(x=>[x,0])),runOnlyProgs:0}); a.cfg++; a.n+=p.n; K.forEach(x=>a.c[x]+=p.counts[x]); if(p.counts['run-only']>0)a.runOnlyProgs++; }
  console.log(' '+tag); for(const [k,a] of Object.entries(agg)) console.log(`  ${k.padEnd(18)} cfgs ${a.cfg} days ${a.n} | ${K.map(x=>x+' '+a.c[x]).join(' | ')} | progs with >=1 run-only ${a.runOnlyProgs}/${a.cfg}`);
}
console.log('\n=== RUN-ONLY / UNPLACEABLE / role days, by identity (HEAD), aggregated over lattice');
for(const tag of ['V207','HEAD']){ const id={};
  for(const p of R[tag].progs){ if(p.err)continue; const m=p.meta.mode.startsWith('dated')?'dated':p.meta.mode; for(const s of p.special){ const k=`${p.meta.g}|${m}|${s.cls}|${s.role||'-'}|${s.tier}|${s.sub.replace(/\d+(\.\d+)?/g,'N').slice(0,45)}|${s.labels.replace(/\d+/g,'N').slice(0,60)}`; id[k]=(id[k]||0)+1; } }
  console.log(' '+tag); Object.entries(id).sort().forEach(([k,v])=>console.log(`  ${String(v).padStart(4)}  ${k}`)); }
console.log('\n=== DAY IDENTITY at the ruling-replica config, HEAD, test goals + races (run-only, unplaceable, test/race and eves)');
for(const p of R.HEAD.progs){ if(p.err||!/\|intermediate\|sun\+wed\|76308\|/.test(p.key))continue; if(!p.special.length)continue; console.log(' '+p.key+' final='+p.final); p.special.forEach(s=>console.log(`   W${s.w} ${s.d} ${s.cls.padEnd(11)} ${s.role.padEnd(12)} tier=${s.tier} title="${s.title}" cardio="${s.sub}" secs=${s.labels}`)); }
console.log('\n=== DAY SHAPES on HEAD not present on V207 (class#corehip#section-labels), same lattice key');
{ const v7=new Set(); R.V207.progs.forEach(p=>!p.err&&p.shapes.forEach(s=>v7.add(s))); const nw={};
  R.HEAD.progs.forEach(p=>{ if(p.err)return; p.shapes.forEach(s=>{ if(!v7.has(s)){ nw[s]=nw[s]||{n:0,ex:p.key}; nw[s].n++; } }); });
  const hd=new Set(); R.HEAD.progs.forEach(p=>!p.err&&p.shapes.forEach(s=>hd.add(s)));
  console.log(` distinct shapes V207 ${v7.size}, HEAD ${hd.size}, HEAD-only ${Object.keys(nw).length}`);
  Object.entries(nw).sort((a,b)=>b[1].n-a[1].n).slice(0,40).forEach(([s,v])=>console.log(`  ${String(v.n).padStart(4)} ${s.slice(0,140)}  e.g. ${v.ex}`));
  const clsNew={}; Object.keys(nw).forEach(s=>{const c=s.split('#')[0]; clsNew[c]=(clsNew[c]||0)+nw[s].n;}); console.log(' HEAD-only shape days by class', JSON.stringify(clsNew)); }
// ---- eligible pool under ruled tags (hand table) ----
console.log('\n=== POOL: raw workout tags on HEAD');
const W=R.HEAD.POOLS.workout; W.forEach((e,i)=>{ if(typeof e==='object') console.log(`  [${i}] when=${e.when||'-'} type=${e.type||'-'} :: ${String(e.t).slice(0,50)}`); });
console.log('  workout pool size', W.length, '| V207 size', R.V207.POOLS.workout.length, '| identical', JSON.stringify(W)===JSON.stringify(R.V207.POOLS.workout));
const RULED={}; W.forEach((e,i)=>{ RULED[i]={when:typeof e==='object'?e.when||null:null,type:null}; });
RULED[15].when='weekend'; RULED[8].when='weekend'; RULED[8].type='cardio'; RULED[25].type='lift'; RULED[26].type='lift';
const lens={'lift-only':{cardio:false,lift:true},'run+lift':{cardio:true,lift:true},'run+mob':{cardio:true,lift:false},'run-only':{cardio:true,lift:false},'UNPLACEABLE':{cardio:false,lift:false}};
function elig(cls,we,morn){ let n=0; for(const i in RULED){ const t=RULED[i]; if(t.when==='weekend'&&!we)continue; if(t.when==='morning'&&!morn)continue; if(t.type==='cardio'&&!lens[cls].cardio)continue; if(t.type==='lift'&&!lens[cls].lift)continue; n++; } return n; }
console.log('  ruled tags applied:', JSON.stringify(Object.entries(RULED).filter(([i,t])=>t.when||t.type)));
console.log('  class        wkday>=9h wkday<9h wkend>=9h wkend<9h');
K.forEach(c=>console.log(`  ${c.padEnd(12)} ${[elig(c,false,false),elig(c,false,true),elig(c,true,false),elig(c,true,true)].map(x=>String(x).padStart(8)).join(' ')}`));
// which classes occur on HEAD, on which weekday kind, with workout tier (not final)
const occ={}; for(const p of R.HEAD.progs){ if(p.err)continue; }
console.log('\nDONE');
