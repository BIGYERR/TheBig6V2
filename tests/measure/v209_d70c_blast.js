const path=require('path'); const H=require(path.join(process.cwd(),'tests','harness.js'));
const [A,B]=[process.argv[2],process.argv[3]].map(f=>H.load(f)); const DAYS=H.DAYS;
const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const FOC=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const TIERS=['home_full','home_basic','commercial','crossfit','bodyweight'];
function mkCfg(g,focus,exp,age,eq,rest,seed,injury){ const ev=/^support_/.test(focus);
  return {name:'M',primaryPath:ev?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},GOALS[g])},
    eventTargeted:false,liftingFocus:focus,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed,injury:injury||null}; }
const card=d=>JSON.stringify((d&&d.sections||[]).map(s=>[s.label,(s.items||[]).map(i=>[clean(i.name),i.detail])]));
const grid=(p,wk)=>DAYS.map(d=>{const day=p.weeks[wk][d]; if(!day||day.rest) return null; return `W${wk} ${d.toUpperCase()} ${day.title||''}${day.cardio&&day.cardio.subtype?' {'+day.cardio.subtype+'}':''} :: `+(day.sections||[]).map(s=>`${s.label}[${(s.items||[]).map(i=>clean(i.name)).join(', ')}]`).join(' | ');}).filter(Boolean);
const bump=(o,k,n=1)=>{o[k]=(o[k]||0)+n;};
// 1. blast radius on the healthy lattice
const R={cards:0,changed:{},progs:0,progsChanged:{},undef:0,lostSec:0,uni:{}};
for(const eq of TIERS) for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','55+']) for(const rest of [['sun','wed'],['sat','sun']]) for(const seed of [76308,1234]){
  const cfg=mkCfg(g,f,exp,age,eq,rest,seed); const pa=A.buildProgram(cfg), pb=B.buildProgram(cfg); R.progs++; let pc=0;
  Object.keys(pa.weeks).forEach(w=>DAYS.forEach(d=>{ const da=pa.weeks[w][d], db=pb.weeks[w][d]; if(!da||da.rest) return; R.cards++;
    (db.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ if(!i||!clean(i.name)) R.undef++; }));
    if((db.sections||[]).length<(da.sections||[]).length) R.lostSec++;
    if(card(da)!==card(db)){ pc++; bump(R.changed,eq); bump(R.changed,eq+'|'+f); bump(R.changed,eq+'|age:'+age); bump(R.changed,eq+'|goal:'+g); } }));
  if(pc){ bump(R.progsChanged,eq); bump(R.progsChanged,eq+'|'+f); bump(R.progsChanged,eq+'|age:'+age); }
  const ua=(pa._swapUniverse||[]).length, ub=(pb._swapUniverse||[]).length; R.uni[eq]=R.uni[eq]||{a:0,b:0,n:0,removed:{}}; R.uni[eq].a+=ua; R.uni[eq].b+=ub; R.uni[eq].n++;
  const sb=new Set(pb._swapUniverse||[]); (pa._swapUniverse||[]).forEach(n=>{ if(!sb.has(n)) bump(R.uni[eq].removed,n); });
}
console.log(`== BLAST (healthy lattice): ${R.progs} programs, ${R.cards} day cards; undefined item names after: ${R.undef}; cards that lost a section: ${R.lostSec}`);
console.log('   day cards changed by tier: '+TIERS.map(t=>`${t}=${R.changed[t]||0}`).join('  '));
console.log('   programs changed by tier:  '+TIERS.map(t=>`${t}=${R.progsChanged[t]||0}/${R.progs/5}`).join('  '));
Object.keys(R.changed).filter(k=>k.includes('|')).sort().forEach(k=>console.log('   '+k.padEnd(36)+R.changed[k]));
console.log('== SWAP UNIVERSE mean size before -> after, names removed (top 12):');
TIERS.forEach(t=>{ const u=R.uni[t]; console.log(`   ${t.padEnd(11)} ${(u.a/u.n).toFixed(1)} -> ${(u.b/u.n).toFixed(1)} : `+Object.entries(u.removed).sort((x,y)=>y[1]-x[1]).slice(0,12).map(([n,c])=>n+'×'+c).join('; ')); });
// 2. representative grids
[['home_full','hypertrophy','55+'],['home_basic','hypertrophy','18-35'],['crossfit','hypertrophy','55+']].forEach(([eq,f,age])=>{
  const cfg=mkCfg('run_half',f,'intermediate',age,eq,['sun','wed'],76308); const pa=A.buildProgram(cfg), pb=B.buildProgram(cfg);
  console.log(`\n== GRID ${eq} / ${f} / ${age} / intermediate / run_half / seed 76308 — week 1 (only days that changed, before then after)`);
  const ga=grid(pa,1), gb=grid(pb,1); ga.forEach((l,i)=>{ if(l!==gb[i]){ console.log('  BEFORE '+l); console.log('  AFTER  '+gb[i]); } }); if(ga.join()===gb.join()) console.log('  (week 1 identical)');
  let ch=0,tot=0; Object.keys(pa.weeks).forEach(w=>DAYS.forEach(d=>{const da=pa.weeks[w][d]; if(!da||da.rest) return; tot++; if(card(da)!==card(pb.weeks[w][d])) ch++;})); console.log(`  cards changed in program: ${ch}/${tot}`);
});
// 3. injury sub-lattice (the healthy lattice cannot see the two literals)
console.log('\n== INJURY sub-lattice: tiers x {knee,ankle,hip,lowback} x {protect,workaround} x {hypertrophy,strength,support_prevention} x seed 76308');
const RX=/glute-ham|45° back extension|cable pull-through|leg press|machine|pec deck|preacher|cable|rope tricep|close-grip bench press|incline barbell press/i;
for(const eq of TIERS){ let hitsA=0,hitsB=0,undefB=0,cards=0,changed=0; const namesA={},namesB={};
  for(const reg of ['knee','ankle','hip','lowback']) for(const tier of ['protect','workaround']) for(const f of ['hypertrophy','strength','support_prevention']){
    const cfg=mkCfg('run_half',f,'intermediate','55+',eq,['sun','wed'],76308,{region:reg,tier}); let pa,pb; try{pa=A.buildProgram(cfg);pb=B.buildProgram(cfg);}catch(e){console.log('  CRASH',eq,reg,tier,f,e.message);continue;}
    const deny = eq==='home_full'||eq==='home_basic'||eq==='bodyweight' ? RX : /leg press|machine|pec deck|preacher|cable|rope tricep/i;   // crossfit keeps GHD/45°; commercial keeps all
    if(eq==='commercial') continue;
    Object.keys(pa.weeks).forEach(w=>DAYS.forEach(d=>{const da=pa.weeks[w][d],db=pb.weeks[w][d]; if(!da||da.rest) return; cards++; if(card(da)!==card(db)) changed++;
      (da.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{const n=clean(i.name); if(deny.test(n)){hitsA++;bump(namesA,n);} }));
      (db.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{const n=clean(i.name); if(!n) undefB++; if(deny.test(n)){hitsB++;bump(namesB,n);} })); })); }
  if(eq==='commercial') continue;
  console.log(`   ${eq.padEnd(11)} denied-class items before ${hitsA} -> after ${hitsB}; undefined after ${undefB}; cards changed ${changed}/${cards}`);
  console.log('      before: '+Object.entries(namesA).sort((x,y)=>y[1]-x[1]).map(([n,c])=>n+'×'+c).join('; ')||'-'); console.log('      after:  '+(Object.entries(namesB).sort((x,y)=>y[1]-x[1]).map(([n,c])=>n+'×'+c).join('; ')||'-')); }
// 4. seed sweep: was 'Incline barbell press' = 0 on home_basic a two-seed artifact?
const sec={}; for(let s=1;s<=40;s++){ const p=A.buildProgram(mkCfg('run_half','hypertrophy','intermediate','18-35','home_basic',['sun','wed'],1000+s*7919)); Object.keys(p.weeks).forEach(w=>DAYS.forEach(d=>{const day=p.weeks[w][d]; (day&&day.sections||[]).forEach(x=>{ if(/^Secondary compound/.test(x.label||'')) bump(sec,clean(x.items[0].name)); }); })); }
console.log('\n== home_basic hypertrophy 18-35 Secondary compound over 40 seeds (V206): '+JSON.stringify(sec));
