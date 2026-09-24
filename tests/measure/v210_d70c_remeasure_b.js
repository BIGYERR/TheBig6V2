// v210_d70c_remeasure_b.js — follow-up to v210_d70c_remeasure.js (run that first; reads its r_*.html).
//   node tests/measure/v210_d70c_remeasure_b.js <scratchdir>
// (a) V206 split (D70c+D150 only, then D149 increment) with the kept blast script, to reconcile coach's
//     V206 numbers (home_full 1,581/125 D70c; D149 4,041/581) against the V209 split.
// (b) every item that survives a long-run tier B/A day on home_full, V209 and V209+all, cut by name,
//     with a hand hinge/leg list (oracle: movement names, not _D18_LEG_RX) to show what B keeps.
const fs=require('fs'), path=require('path'), cp=require('child_process');
const ROOT=path.join(__dirname,'..','..'); const S=process.argv[2]; const H=require(path.join(ROOT,'tests','harness.js'));
const src=fs.readFileSync(path.join(__dirname,'v210_d70c_remeasure.js'),'utf8');
const E=eval(src.slice(src.indexOf('const E=[')+8, src.indexOf('];\nconst cnt')+1));
let v=fs.readFileSync(path.join(S,'r_v206.html'),'utf8');
for(const [id,k,a,b] of E){ if(k==='bar+'||k==='d149') continue; if(v.split(a).length!==2) throw new Error(id); v=v.replace(a,()=>b); }
const f206c=path.join(S,'r_v206c.html'); if(fs.existsSync(f206c)) fs.unlinkSync(f206c); fs.writeFileSync(f206c,v);
const blast=(a,b)=>cp.execFileSync('node',['tests/measure/v209_d70c_blast.js',path.join(S,a),path.join(S,b)],{cwd:ROOT,maxBuffer:1<<26}).toString().split('\n').filter(x=>/^== BLAST|day cards changed|programs changed/.test(x)).join('\n');
console.log('== (a) V206 -> V206+D70c+D150\n'+blast('r_v206.html','r_v206c.html'));
console.log('== (a) V206+D70c+D150 -> V206+all (D149 increment)\n'+blast('r_v206c.html','r_v206s.html'));
// (b)
const DAYS=H.DAYS; const clean=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const HINGE=/back extension|glute-ham|\bghr\b|deadlift|\brdl\b|good morning|hip thrust|swing|pull-through|hyperextension|reverse hyper|nordic|bridge|squat|lunge|step-up|leg press|leg curl|leg extension/i;
const GOALS={run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'},run_base:{},run_5k:{},run_10k:{},run_half:{},run_marathon:{}};
const FOC=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const mk=(g,f,exp,age,eq,rest,seed)=>({name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:['run'],cardioGoals:{run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},GOALS[g])},eventTargeted:false,liftingFocus:f,experience:exp,ageBracket:age,equipment:eq,unit:'lbs',restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed});
for(const k of ['r_v209.html','r_v209s.html']){ const IA=H.load(path.join(S,k)); const tierOf=IA.eval('_longRunTier');
  for(const eq of ['home_full','home_basic','crossfit','commercial','bodyweight']){ const days={}, hinge={}, allB={}; let items=0;
    for(const g of Object.keys(GOALS)) for(const f of FOC) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','55+']) for(const rest of [['sun','wed'],['sat','sun']]) for(const seed of [76308,1234]){
      const p=IA.buildProgram(mk(g,f,exp,age,eq,rest,seed));
      Object.keys(p.weeks).forEach(w=>DAYS.forEach(d=>{ const day=p.weeks[w][d]; if(!day||day.rest||!day.cardio) return; const t=tierOf(day.cardio); if(t!=='B') return; days[t]=(days[t]||0)+1;
        (day.sections||[]).forEach(s=>(s.items||[]).forEach(i=>{ const n=clean(i.name); items++; allB[n]=(allB[n]||0)+1; if(HINGE.test(n)) hinge[n]=(hinge[n]||0)+1; })); })); }
    console.log(`== (b) ${k} ${eq}: tier-B days ${days.B||0}, items on them ${items}; hand-list hinge/leg names surviving tier B: `+(Object.entries(hinge).sort((a,b)=>b[1]-a[1]).map(([n,c])=>n+'×'+c).join('; ')||'none'));
    if(eq==='home_full') console.log('   all tier-B names: '+Object.entries(allB).sort((a,b)=>b[1]-a[1]).map(([n,c])=>n+'×'+c).join('; '));
  } }
console.log('DONE');
