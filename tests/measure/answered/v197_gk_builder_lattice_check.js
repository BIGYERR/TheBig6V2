// GATEKEEPER: reproduce builder's 3,024-build blast census on MY OWN code, to check
// 849 moved builds / 3,984 moved day cells / commercial 84 builds / 318 cells.
// Axes copied from tests/measure/v197_pool_fallback_noop.js (the lattice is builder's claim;
// the counting is mine). Keys on (week, day, label, movement), never on position.
'use strict';
const { load } = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const TIERS=['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const FOCUSES=['strength','hypertrophy','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const EXPS=['beginner','intermediate','advanced'];
const SEEDS=[11,76308,90210];
const RESTS=[['sun','wed'],['sat','sun','wed']];
const GOALS=[{k:'liftonly',cardioTypes:[],goal:null},{k:'run_base',cardioTypes:['run'],goal:'run_base'},
             {k:'run_5k',cardioTypes:['run'],goal:'run_5k'},{k:'run_half',cardioTypes:['run'],goal:'run_half'}];
function mkCfg(tier,focus,exp,g,seed,rest,travel){
  const isRace=g.goal&&/5k|10k|half|marathon/.test(g.goal);
  return {name:'M',primaryPath:g.goal?(isRace?'event':'cardio'):'lift',cardioTypes:g.cardioTypes.slice(),
    cardioGoals:g.goal?{run:{id:g.goal,label:g.goal,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}}:{},
    eventTargeted:!!isRace,raceDate:isRace?'2026-12-06':null,liftingFocus:focus,experience:exp,ageBracket:'18-35',
    equipment:travel?'bodyweight':tier,unit:'lbs',restDays:rest.slice(),days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135,squat:155,deadlift:185,seed,...(travel?{_travel:true}:{})};
}
const L=[];
for(const t of TIERS)for(const f of FOCUSES)for(const e of EXPS)for(const g of GOALS)for(const s of SEEDS)for(let r=0;r<RESTS.length;r++)
  L.push({key:`${t}|${f}|${e}|${g.k}|${s}|r${r}`,tier:t,goal:g.k,cfg:mkCfg(t,f,e,g,s,RESTS[r],false)});
function dump(f){
  const ia=load(f); const m={};
  for(const c of L){ const p=ia.buildProgram(JSON.parse(JSON.stringify(c.cfg))); const W=p.weeks||{};
    for(const w of Object.keys(W))for(const d of Object.keys(W[w])){ const day=W[w][d]; if(!day||day.rest)continue;
      const rows=[];
      for(const s of (day.sections||[])){ if(!s)continue;
        const Lb=String(s.label||s.coreHeader||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'').trim();
        for(const it of (s.items||[])) rows.push(Lb+' :: '+((it&&it.name!=null)?String(it.name):'UNDEF')+' :: '+String((it&&it.detail)||''));
      }
      m[c.key+'|'+w+'|'+d]=rows.slice().sort().join('\n');
    }}
  return m;
}
const A=dump(process.argv[2]),B=dump(process.argv[3]);
const keys=Object.keys(A);
let mb=0,mc=0; const perTier={},perGoal={},labels={},addL={},remL={};
const movedBuildSet={};
for(const k of keys){
  const parts=k.split('|'); const bkey=parts.slice(0,6).join('|'); const tier=parts[0], goal=parts[3];
  perTier[tier]=perTier[tier]||{b:new Set(),c:0,tb:new Set()}; perTier[tier].tb.add(bkey);
  perGoal[goal]=perGoal[goal]||{b:new Set(),c:0};
  if(A[k]===B[k]) continue;
  mc++; perTier[tier].c++; perGoal[goal].c++;
  perTier[tier].b.add(bkey); perGoal[goal].b.add(bkey); movedBuildSet[bkey]=1;
  const a=new Set(A[k].split('\n')), b=new Set(B[k].split('\n'));
  for(const r of A[k].split('\n')) if(r&&!b.has(r)){const lb=r.split(' :: ')[0];labels[lb]=(labels[lb]||0)+1;remL[lb]=(remL[lb]||0)+1;}
  for(const r of B[k].split('\n')) if(r&&!a.has(r)){const lb=r.split(' :: ')[0];labels[lb]=(labels[lb]||0)+1;addL[lb]=(addL[lb]||0)+1;}
}
mb=Object.keys(movedBuildSet).length;
console.log('builds '+L.length+'   day cells '+keys.length);
console.log('MOVED builds '+mb+'/'+L.length+'   MOVED day cells '+mc+'/'+keys.length);
console.log('per tier:'); for(const t of TIERS) console.log('   '+t.padEnd(12)+' builds '+String(perTier[t].b.size).padStart(4)+'/'+perTier[t].tb.size+'   cells '+String(perTier[t].c).padStart(5));
console.log('per goal:'); for(const g of Object.keys(perGoal)) console.log('   '+g.padEnd(10)+' builds '+String(perGoal[g].b.size).padStart(4)+'   cells '+String(perGoal[g].c).padStart(5));
console.log('labels touched (removed/added):');
Object.keys(labels).sort((x,y)=>labels[y]-labels[x]).forEach(l=>console.log('   '+String(labels[l]).padStart(6)+'  "'+l+'"   removed '+(remL[l]||0)+' / added '+(addL[l]||0)));
