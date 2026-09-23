// V206 gatekeeper: card-level blast diff + identity fuzz. READ-ONLY on index.html.
//   node tests/measure/v206_gk_lattice.js <base.html> <cand.html> <table.txt> [nRandom]
'use strict';
const fs=require('fs'), path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const [BF,CF,TF,NR]=process.argv.slice(2);
const P=(...a)=>console.log(...a);
const B1=H.load(BF), B2=H.load(BF), C1=H.load(CF), C2=H.load(CF);
P('versions', B1.version, B2.version, C1.version, C2.version);
const STRIP=new Set(['id','created','_swapUniverse','_swapUniverseByKey']);
const clean=p=>JSON.parse(JSON.stringify(p,(k,v)=>STRIP.has(k)?undefined:v));

// ---- table -> literal chunk replacements (independent of the engine: coach's typed table)
const raw=fs.readFileSync(TF,'utf8').split('\n'); const ent=[]; let cur=null,side=0;
for(const l of raw){ const m=l.match(/^@@ (\d+)/); if(m){cur={n:+m[1],o:[],w:[]};ent.push(cur);side=0;continue;}
  if(!cur) continue; if(l==='--'&&side===0){side=1;continue;} (side?cur.w:cur.o).push(l); }
const HOLE=/\$\{[^}]*\}|['"`]\s*\+[^+]*\+\s*['"`]|\\u2019/g;
const unq=s=>s.replace(/^\s*['"`]/,'').replace(/['"`]\s*$/,'');
const REP=[]; let chunkMismatch=0;
for(const e of ent){ const o=unq(e.o.join('\n')).replace(/\\n/g,'\n'), w=unq(e.w.join('\n')).replace(/\\n/g,'\n');
  const oc=o.split(HOLE), wc=w.split(HOLE);
  if(oc.length!==wc.length){chunkMismatch++; REP.push([o,w]); continue;}
  oc.forEach((x,i)=>{ if(x!==wc[i]&&x.length>=3) REP.push([x,wc[i]]); }); }
for(const e of ent){ const o=e.o.join('\n'), w=e.w.join('\n'); const mo=o.match(/^\{n:'([^']+)'/), mw=w.match(/^\{n:'([^']+)'/); if(mo&&mw&&mo[1]!==mw[1]) REP.push([mo[1],mw[1]]); }
REP.sort((a,b)=>b[0].length-a[0].length);
P('table entries',ent.length,'| literal replacements',REP.length,'| chunk-count mismatches',chunkMismatch);
const applyT=s=>{ for(const [o,w] of REP) s=s.split(o).join(w); return s; };
const nums=s=>(String(s).match(/\d+(?:[.:]\d+)*/g)||[]).join(',');

// ---- config lattice
const RUN=['run_base','run_pace_goal','run_5k','run_10k','run_half','run_marathon'];
const BIKE=['bike_50','bike_base','bike_cals','bike_century','bike_ftp'];
const SWIM=['swim_100_time','swim_500_time','swim_base','swim_mile','swim_tri'];
const FOC=['hypertrophy','strength','support_athletic','support_prevention','support_strength'];
const EXP=['beginner','intermediate','advanced'];
const EQ=['crossfit','commercial','home_full','bodyweight'];
const RESTS=[['sun','wed'],['sat','sun'],['sun'],['mon','wed','fri'],['tue','thu','sun']];
const BASEL=[null,1,3,5,8];
const MILE=[['7','30'],['8','15'],['10','30'],['12','0']];
const RACE=['2026-12-06','2027-01-17','2027-03-28',''];
const goalSets=[]; RUN.forEach(r=>goalSets.push({run:r})); BIKE.forEach(b=>goalSets.push({bike:b})); SWIM.forEach(s=>goalSets.push({swim:s}));
[['run_base','bike_50'],['run_half','swim_base'],['run_pace_goal','bike_ftp'],['run_5k','swim_mile'],['run_base','swim_tri'],['run_10k','bike_base']].forEach(([r,o])=>goalSets.push(o.startsWith('bike')?{run:r,bike:o}:{run:r,swim:o}));
goalSets.push({run:'run_base',bike:'bike_base',swim:'swim_base'}); goalSets.push({run:'run_marathon',bike:'bike_century',swim:'swim_500_time'});
function mk(gs,i,seed,evt){
  const goals={}; const types=Object.keys(gs);
  types.forEach(t=>{ goals[t]={id:gs[t],label:gs[t]}; });
  if(goals.run){ const b=BASEL[i%5], m=MILE[(i>>1)%4]; goals.run.mileBestMins=m[0]; goals.run.mileBestSecs=m[1]; if(b!==null){goals.run.baselineDist=String(b);goals.run.baseline=b+'mi';} }
  const rd=evt?RACE[i%3]:'';
  return Object.assign({},H.fixtures.HALF_MANNY,{name:'GK',primaryPath:evt?'event':'fitness',cardioTypes:types,cardioGoals:goals,eventTargeted:!!evt,raceDate:rd,
    liftingFocus:FOC[i%5],experience:EXP[(i>>2)%3],equipment:EQ[(i>>3)%4],ageBracket:['18-35','36-54','55+'][i%3],restDays:RESTS[(i*7)%5].slice(),seed});
}
const cfgs=[]; let i=0;
for(const gs of goalSets) for(const f of FOC) for(const e of EXP) for(const q of EQ){ i++;
  const c=mk(gs,i,[76308,1234,99991][i%3],i%2===0); c.liftingFocus=f; c.experience=e; c.equipment=q; cfgs.push(['L'+i,c]); }
// random fuzz with pinned seeds
let s=0x2060; const rnd=()=>{ s=(s*1103515245+12345)&0x7fffffff; return s/0x7fffffff; }; const pick=a=>a[Math.floor(rnd()*a.length)];
for(let k=0;k<(+NR||600);k++){ const gs=pick(goalSets); const c=mk(gs,Math.floor(rnd()*1000),Math.floor(rnd()*1e6),rnd()<0.5);
  c.liftingFocus=pick(FOC);c.experience=pick(EXP);c.equipment=pick(EQ);c.restDays=pick(RESTS).slice(); cfgs.push(['R'+k,c]); }

// ---- deep diff
const cls={}; const bump=(k,n=1)=>cls[k]=(cls[k]||0)+n; const unclassified=[]; const ex={};
const TEXTKEYS=new Set(['detail','note','text','c','n','label','title']);
function walk(a,b,p,out){ if(JSON.stringify(a)===JSON.stringify(b)) return;
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
    const ks=new Set([...Object.keys(a),...Object.keys(b)]); for(const k of ks) walk(a[k],b[k],p.concat(k),out); return; }
  out.push({p,a,b}); }
const steadyMins=d=>{const m=String(d||'').match(/^(\d+)\s*min steady\b/);return m?+m[1]:null;};
let identB=0, identC=0, sessions=0, days=0, crash=0, d109days=0, d137cards=0;
for(const [key,cfg] of cfgs){
  let pb,pb2,pc,pc2;
  try{ pb=clean(B1.buildProgram(JSON.parse(JSON.stringify(cfg)))); pb2=clean(B2.buildProgram(JSON.parse(JSON.stringify(cfg))));
       pc=clean(C1.buildProgram(JSON.parse(JSON.stringify(cfg)))); pc2=clean(C2.buildProgram(JSON.parse(JSON.stringify(cfg)))); }
  catch(e){ crash++; if(crash<5)P('CRASH',key,e.message); continue; }
  if(JSON.stringify(pb)!==JSON.stringify(pb2)) identB++;
  if(JSON.stringify(pc)!==JSON.stringify(pc2)) identC++;
  const gid=(cfg.cardioGoals.run||{}).id;
  // top-level (non-weeks) must be identical
  const tb=Object.assign({},pb,{weeks:null}), tc=Object.assign({},pc,{weeks:null});
  if(JSON.stringify(tb)!==JSON.stringify(tc)){ const o=[]; walk(tb,tc,['<top>'],o); o.forEach(x=>{bump('UNCLASSIFIED top');unclassified.push(key+' '+x.p.join('.'));}); }
  const wks=new Set([...Object.keys(pb.weeks||{}),...Object.keys(pc.weeks||{})]);
  for(const w of wks){ const DB=(pb.weeks||{})[w]||{}, DC=(pc.weeks||{})[w]||{};
    for(const d of new Set([...Object.keys(DB),...Object.keys(DC)])){ days++;
      const a=DB[d], b=DC[d]; if(a&&a.cardio) sessions+=(Array.isArray(a.cardio)?a.cardio.length:1);
      const o=[]; walk(a,b,[],o); if(!o.length) continue; let dayD109=false;
      for(const x of o){
        // D137: run_base, tw>=14, weeks 13-15, Steady Aerobic Run card
        const cardIdx=x.p.indexOf('cardio'); let card=null, cardB=null;
        if(cardIdx>=0){ const q=x.p.slice(0,cardIdx+1); card=q.reduce((m,k)=>m&&m[k],b); cardB=q.reduce((m,k)=>m&&m[k],a);
          if(Array.isArray(card)&&typeof x.p[cardIdx+1]!=='undefined'){ card=card[x.p[cardIdx+1]]; cardB=cardB&&cardB[x.p[cardIdx+1]]; } }
        const sub=String((card&&card.subtype)||''); 
        if(gid==='run_base'&&pc.totalWeeks>=14&&+w>=13&&+w<=15&&/^Steady Aerobic Run/.test(sub)){
          const mm=steadyMins(card.detail); if(mm===20||(mm===12&&cfg.eventTargeted&&+w===pc.totalWeeks-1)){ bump('D137 field'); if(!ex.d137) ex.d137=`${key} tw=${pc.totalWeeks} W${w} ${d} ${x.p.join('.')}: ${JSON.stringify(x.a).slice(0,80)} -> ${JSON.stringify(x.b).slice(0,80)}`; continue; }
          bump('UNCLASSIFIED d137-not-20'); unclassified.push(`${key} W${w} ${d} steady mins ${mm}`); continue; }
        const leaf=x.p[x.p.length-1];
        if(typeof x.a==='string'&&typeof x.b==='string'&&isNaN(+leaf)?TEXTKEYS.has(leaf)||true:typeof x.a==='string'&&typeof x.b==='string'){
          const expl=applyT(x.a)===x.b;
          const numsOk=nums(x.a.replace(/(\d+)-minute/g,'$1 min'))===nums(x.b);
          const dash=/ — |\w-\w/.test(x.b.replace(/\d+-\d+/g,'').replace(/RPE \d-\d/g,''));
          if(expl){ bump('D109 text table-exact ['+leaf+']'); dayD109=true; continue; }
          if(numsOk){ bump('D109 text numbers-preserved (not table-exact) ['+leaf+']'); dayD109=true; if(!ex['np'+leaf]) ex['np'+leaf]=`${key} W${w} ${d} ${x.p.join('.')}\n    B: ${x.a.slice(0,300)}\n    C: ${x.b.slice(0,300)}\n    T: ${applyT(x.a).slice(0,300)}`; continue; }
          bump('UNCLASSIFIED text numbers-changed'); unclassified.push(`${key} W${w} ${d} ${x.p.join('.')} | ${x.a.slice(0,120)} -> ${x.b.slice(0,120)}`); continue; }
        bump('UNCLASSIFIED non-text '+leaf); unclassified.push(`${key} tw=${pc.totalWeeks} W${w} ${d} ${sub} ${x.p.join('.')} | ${JSON.stringify(x.a).slice(0,100)} -> ${JSON.stringify(x.b).slice(0,100)}`);
      }
      if(dayD109) d109days++;
    } }
  // D137 cards count
  if(gid==='run_base'&&pc.totalWeeks>=14) for(const w of [13,14,15]) for(const d in (pc.weeks[w]||{})){ const c=pc.weeks[w][d].cardio; (c?(Array.isArray(c)?c:[c]):[]).forEach(z=>{ if(/^Steady Aerobic Run/.test(String(z.subtype||''))) d137cards++; }); }
}
P(`configs ${cfgs.length} (lattice ${i}, random ${cfgs.length-i}) | days ${days} | cardio sessions ${sessions} | crash ${crash}`);
P(`identity baseline==itself violations ${identB} | candidate==itself violations ${identC}`);
P(`days with D109 text diffs ${d109days} | run_base tw>=14 steady cards wk13-15 on candidate ${d137cards}`);
P('classes:'); Object.keys(cls).sort().forEach(k=>P('  '+k+': '+cls[k]));
P('unclassified total', unclassified.length); unclassified.slice(0,25).forEach(u=>P('  U '+u));
P('examples:'); Object.values(ex).forEach(e=>P('  '+e));
