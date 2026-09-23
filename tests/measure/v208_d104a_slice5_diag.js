// V208 slice 5 (D104a) diagnostic: why run_base lower-Main on the long run or its eve is not 0 after
// the build. Read-only. Usage: node v208_d104a_slice5_diag.js <post.html>
// Per program (the (A) lattice, run_base and run_base+bike, weeks-out 4): the long-keyed and steady-keyed
// days per week (card keys), the placement week (first week with a long key, as the ruling reads it),
// whether that week carries a legLoad card (deconflictLegLiftDays exits before the placement when it
// carries none), the note, and every lower-Main hit on the long day or its eve, with the week it hit in.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(process.argv[2]);
const ISO=['mon','tue','wed','thu','fri','sat','sun'], ALL=['sun','mon','tue','wed','thu','fri','sat'];
const clone=o=>JSON.parse(JSON.stringify(o));
const stripSvg=n=>String(n||'').replace(/<svg[\s\S]*?<\/svg>\s*/g,'');
const cardios=day=>(!day||!day.cardio)?[]:(Array.isArray(day.cardio)?day.cardio:[day.cardio]);
const LOWER_MAIN=/squat|deadlift|\brdl\b|romanian|good morning|hip thrust|lunge|step-?up|\bclean\b|snatch|trap bar/i;
function mainLift(day){ const s=(day.sections||[]).find(x=>/^Main\s*—/.test(x.label||'')); if(!s) return null; return stripSvg((s.items||[])[0]&&s.items[0].name); }
const GOALS={
  run_base:{types:['run'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'}}},
  'run_base+bike_base':{types:['run','bike'],g:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'},bike:{id:'bike_base'}}},
};
const EXP=['beginner','intermediate','advanced'];
const REST=[[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const SEEDS=[24865,7,4242]; const FOCUS=['balanced','support_strength'];
function mkCfg(gk,exp,rest,seed,wo,focus){ const race=new Date('2026-09-21T00:00:00'); race.setDate(race.getDate()+wo*7);
  return {primaryPath:'event',eventTargeted:true,raceDate:race.toISOString().slice(0,10),cardioTypes:GOALS[gk].types.slice(),
    cardioGoals:clone(GOALS[gk].g),liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:'home_full',unit:'lbs',
    restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'M',startDate:'2026-09-21',seed}; }
const cnt=(m,k)=>{m[k]=(m[k]||0)+1;};
Object.keys(GOALS).forEach(gk=>{
  const S={progs:0,cause:{},longDayStable:{},steadyInLw:{},lwIdx:{},legLoadInLw:{},hitWeekVsLw:{},hitRole:{}}; const samples=[];
  EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>FOCUS.forEach(focus=>{
    const p=IA.buildProgram(mkCfg(gk,exp,rest,seed,4,focus)); S.progs++;
    const tw=p.totalWeeks, perW={};
    for(let w=1;w<=tw;w++){ const o={long:[],steady:[],legLoad:[]}; ISO.forEach(d=>cardios(p.weeks[w][d]).forEach(c=>{ if(c.type!=='run') return; const k=c.dose&&c.dose.key; if(k==='long') o.long.push(d); if(k==='steady') o.steady.push(d); if(c.legLoad) o.legLoad.push(d); })); perW[w]=o; }
    const lw=Object.keys(perW).map(Number).find(w=>perW[w].long.length);
    cnt(S.lwIdx,'placement week '+lw);
    const longDays=new Set(Object.values(perW).flatMap(o=>o.long)); cnt(S.longDayStable,longDays.size+' distinct long-keyed day(s) across weeks');
    cnt(S.steadyInLw,lw&&perW[lw].steady.length?'steady in placement week':'NO steady in placement week');
    cnt(S.legLoadInLw,lw&&perW[lw].legLoad.length?'legLoad card in placement week':'NO legLoad card in placement week (early exit)');
    // hits: lower Main on a long-keyed day or its eve, in any week (key lens), and the classifier's lens is the (A) measure
    let hits=0; const hw=[];
    for(let w=1;w<=tw;w++) ISO.forEach((d,i)=>{ const day=p.weeks[w][d]; if(!day||day.rest) return; const ml=mainLift(day); if(!(ml&&LOWER_MAIN.test(ml))) return;
      const nd=i<6?[w,ISO[i+1]]:[w+1,'mon']; const onLong=perW[w].long.includes(d), onEve=!!(perW[nd[0]]&&perW[nd[0]].long.includes(nd[1]));
      if(onLong||onEve){ hits++; hw.push('W'+w+' '+d+(onLong?' ON long':' EVE of '+nd[1])+' '+day.title); cnt(S.hitWeekVsLw,(w===lw?'hit in placement week':'hit in another week')+(perW[w].long.join()===perW[lw].long.join()?', same long day':', long day moved to '+perW[w].long.join())); cnt(S.hitRole,day.title); } });
    const cause=!lw?'no long key':!perW[lw].legLoad.length?'early exit: no legLoad card in placement week':hits?'placed, still hits':'placed, clean';
    cnt(S.cause,cause+(p.legRecoveryNote?' | note':' | null note'));
    if(hits&&samples.length<6) samples.push(`  ${exp} rest=[${rest}] seed=${seed} ${focus} lw=${lw} long by week ${Object.keys(perW).map(w=>w+':'+(perW[w].long.join('+')||'-')).join(' ')} steady by week ${Object.keys(perW).map(w=>w+':'+(perW[w].steady.join('+')||'-')).join(' ')}\n     roles ${ISO.map(d=>d+':'+((p.weeks[lw][d]||{}).rest?'REST':(p.weeks[lw][d]||{}).title)).join(' ')}\n     hits ${hw.slice(0,4).join('; ')}`);
  }))));
  console.log('\n== '+gk+' ('+S.progs+' programs, weeks-out 4)');
  Object.keys(S).filter(k=>k!=='progs').forEach(k=>console.log('  '+k+': '+JSON.stringify(S[k])));
  samples.forEach(s=>console.log(s));
});
