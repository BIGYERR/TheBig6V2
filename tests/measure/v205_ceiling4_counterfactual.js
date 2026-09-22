// v205 — counterfactual: what the CURRENT engine (unchanged except SPORT_CEILINGS
// .run_pace_goal 3 -> 4) does with four pace-goal run days. Source surgery on a COPY;
// index.html is never written. This is the "before" for D125's day chooser and for
// D127's premise that deconflictLegLiftDays degrades on the 4-run layout.
const fs=require('fs'), path=require('path'), os=require('os');
const { load } = require(path.join(__dirname,'..','harness.js'));
const SRC = path.join(__dirname,'..','..','index.html');
const ORIG = "run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 3, run_mile_time: 3, run_15_under10: 3,";
const NEW  = "run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 4, run_mile_time: 4, run_15_under10: 4,";
const html = fs.readFileSync(SRC,'utf8');
const n = html.split(ORIG).length-1;
console.log('anchor count == '+n+(n===1?' (ok)':' — NOT 1, surgery aborted'));
if(n!==1) process.exit(2);
const out = path.join(os.tmpdir(),'ia_v205_ceil4.html');
if(fs.existsSync(out)) fs.unlinkSync(out);
fs.writeFileSync(out, html.replace(ORIG,NEW));
const IA = load(out), BASE = load(SRC);
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
function cfg(o={}){ return Object.assign({ name:'M',primaryPath:'goal',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',paceUnit:'mi',
    targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0',baseline:''}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
  bench:185,squat:255,deadlift:315,seed:76308},o); }
function runClass(day){ const c=day&&day.cardio; if(!c) return null;
  const a=Array.isArray(c)?c:[c]; const r=a.find(x=>x.type==='run'); if(!r) return null;
  const s=String(r.subtype||'');
  if(/Interval \(INT\)/.test(s)) return 'INT';
  if(/Tempo|Threshold|CHI|Continuous High/i.test(s)) return 'CHI';
  if(/LSD|Long Slow|Easy|Recovery/i.test(s)) return r.legLoad?'LSD_LONG':'LSD_EASY';
  return 'OTHER:'+s; }
const ROLE={'Posterior Chain':'pull','Leg Strength + Mobility':'legs','Strength Support':'push',
 'Recovery Lift':'push_light','Full Body Support':'full','Active Recovery':'active',
 'Pull':'pull','Legs':'legs','Push':'push','Push (light)':'push_light','Full Body':'full'};
function combos(k){const o=[];(function r(s,a){if(a.length===k){o.push(a.slice());return;}for(let i=s;i<7;i++){a.push(ALL[i]);r(i+1,a);a.pop();}})(0,[]);return o;}
console.log('\n── Mario config under ceiling 4 (counterfactual) vs ceiling 3 (shipped) ──');
[['CEIL4',IA],['CEIL3-shipped',BASE]].forEach(([tag,E])=>{
  const p=E.buildProgram(cfg());
  [1,7,11].forEach(w=>{ const wk=p.weeks[String(w)]; if(!wk) return;
    console.log(' '+tag+' W'+w+'  '+ALL.map(d=>{const x=wk[d]; if(!x) return '';
      return d.toUpperCase()+':'+(x.rest?'REST':((runClass(x)||'norun')+'/'+(ROLE[x.title]||x.title)));}).join('  '));
  });
  console.log('  note: '+JSON.stringify((p.legRecoveryNote||'').slice(0,90)));
});
console.log('\n── sweep: ceiling-4 counterfactual, every calendar 4-7 train days x 3 exp x 3 seeds ──');
const EXPS=['beginner','intermediate','advanced'], SEEDS=[76308,11111,4242];
const pats=[[]].concat(combos(1),combos(2),combos(3));
const HARDC=new Set(['INT','CHI','LSD_LONG']);
let W=0,eve=0,longday=0,coll=0,runs4=0,weeks=0;
const perTrain={}; const collByRest={}; const eveByRest={};
pats.forEach(rest=>{ const nT=7-rest.length; if(nT<4) return;
  EXPS.forEach(exp=>SEEDS.forEach(seed=>{
    let p; try{p=IA.buildProgram(cfg({restDays:rest.slice(),experience:exp,seed}));}catch(e){console.log('CRASH',rest,exp,seed,e.message);return;}
    Object.keys(p.weeks).forEach(wk=>{ const w=p.weeks[wk]; weeks++;
      const runDays=ALL.filter(d=>w[d]&&!w[d].rest&&runClass(w[d]));
      const cls={}; runDays.forEach(d=>cls[d]=runClass(w[d]));
      perTrain[nT]=perTrain[nT]||{weeks:0,runs:{},coll:0,eve:0};
      perTrain[nT].weeks++; perTrain[nT].runs[runDays.length]=(perTrain[nT].runs[runDays.length]||0)+1;
      if(runDays.length===4) runs4++;
      const hd=runDays.filter(d=>HARDC.has(cls[d])); let c=0;
      for(let a=0;a<hd.length;a++)for(let b=a+1;b<hd.length;b++){const r=Math.abs(ALL.indexOf(hd[a])-ALL.indexOf(hd[b]));if(Math.min(r,7-r)===1)c++;}
      if(c>0){coll++;perTrain[nT].coll++;collByRest[rest.join('+')||'none']=(collByRest[rest.join('+')||'none']||0)+1;}
      const L=runDays.find(d=>cls[d]==='LSD_LONG'); if(!L) return; W++;
      const ev=ALL[(ALL.indexOf(L)+6)%7], E=w[ev];
      const rl=x=>x&&!x.rest?(ROLE[x.title]||'?'):null;
      if(rl(E)==='pull'||rl(E)==='legs'){eve++;perTrain[nT].eve++;eveByRest[rest.join('+')||'none']=(eveByRest[rest.join('+')||'none']||0)+1;}
      if(rl(w[L])==='pull'||rl(w[L])==='legs') longday++;
    });
  }));
});
console.log(' weeks='+weeks+'  4-run weeks='+runs4+'  hard back-to-back collisions='+coll+' ('+(100*coll/weeks).toFixed(1)+'%)');
console.log(' weeks with a long run='+W+'  pull/legs on long-run EVE='+eve+' ('+(100*eve/W).toFixed(1)+'%)  on long-run DAY='+longday);
Object.keys(perTrain).sort().forEach(k=>{const v=perTrain[k];
  console.log('  '+k+' train days: weeks='+v.weeks+' runsPerWeek='+JSON.stringify(v.runs)+' collisions='+v.coll+' eveHits='+v.eve);});
console.log(' collisions by rest pattern (nonzero): '+JSON.stringify(collByRest));
console.log(' eve hits by rest pattern (nonzero): '+JSON.stringify(eveByRest));

// ── per-calendar W1 layout the CURRENT engine produces at ceiling 4 (5- and 6-day) ──
console.log('\n── engine W1 layout, ceiling-4 counterfactual, intermediate seed 76308 ──');
[2,1].forEach(k=>{ (k===1?combos(1):combos(2)).forEach(rest=>{
  const p=IA.buildProgram(cfg({restDays:rest.slice()}));
  const w=p.weeks['1'];
  const runDays=ALL.filter(d=>w[d]&&!w[d].rest&&runClass(w[d]));
  const cls={}; runDays.forEach(d=>cls[d]=runClass(w[d]));
  const hd=runDays.filter(d=>HARDC.has(cls[d])); let c=0; const pairs=[];
  for(let a=0;a<hd.length;a++)for(let b=a+1;b<hd.length;b++){const r=Math.abs(ALL.indexOf(hd[a])-ALL.indexOf(hd[b]));if(Math.min(r,7-r)===1){c++;pairs.push(hd[a]+'/'+hd[b]);}}
  const L=runDays.find(d=>cls[d]==='LSD_LONG'); const ev=L?ALL[(ALL.indexOf(L)+6)%7]:null;
  const rl=x=>x&&!x.rest?(ROLE[x.title]||('?'+x.title)):'REST';
  console.log('  '+(7-rest.length)+'d rest='+(rest.join('+')||'none').padEnd(9)+' | '+
    ALL.map(d=>d.toUpperCase()+':'+(w[d]&&w[d].rest?'REST':((cls[d]||'-')+'/'+rl(w[d])))).join(' ')+
    ' | coll='+c+(pairs.length?'['+pairs.join(',')+']':'')+' long='+(L||'?').toUpperCase()+
    ' eve='+(ev||'?').toUpperCase()+'='+rl(w[ev]));
}); });
