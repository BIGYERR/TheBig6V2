// V208 slice 5 (D104a re-ruled, point 4): is the steady note reachable? Read-only.
// Usage: node v208_d104a_steady_probe.js <artifact.html>
// Lattice: the HALF_MANNY run_base shape (55+, low baseline) that prints the Steady Aerobic Run:
// experience x baselineDist x rest x seed x path x mix. Per program, by card keys: the placement week
// (the first week with a long-keyed run on a training day, as deconflictLegLiftDays reads it) and
// whether that week also carries a steady-keyed run. Also: the note printed, and how many programs
// carry any steady-keyed run anywhere.
const path=require('path');
const H=require(path.join(__dirname,'..','harness.js'));
const IA=H.load(process.argv[2]);
const ISO=['mon','tue','wed','thu','fri','sat','sun'];
const clone=o=>JSON.parse(JSON.stringify(o));
const cardios=day=>(!day||!day.cardio)?[]:(Array.isArray(day.cardio)?day.cardio:[day.cardio]);
const REST=[[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const T={}, cnt=(k)=>{T[k]=(T[k]||0)+1;}; const notes={}; const samples=[];
let n=0;
['beginner','intermediate','advanced'].forEach(exp=>['0.1','0.5','1','2'].forEach(bd=>REST.forEach(rest=>[76308,24865,7].forEach(seed=>['fitness','event'].forEach(pp=>['','bike','swim'].forEach(mix=>{
  const cg={run:{id:'run_base',label:'Build Running Base',baselineDist:bd,baseline:bd+'mi'}}; if(mix==='bike') cg.bike={id:'bike_base',label:'Bike'}; if(mix==='swim') cg.swim={id:'swim_base',label:'Swim'};
  const cfg=Object.assign(clone(H.fixtures.HALF_MANNY),{name:'RB',primaryPath:pp,cardioTypes:mix?['run',mix]:['run'],cardioGoals:cg,eventTargeted:pp==='event',raceDate:pp==='event'?'2027-06-01':'',experience:exp,ageBracket:'55+',restDays:rest,seed});
  const p=IA.buildProgram(cfg); n++;
  const train=ISO.filter(d=>!rest.includes(d));
  const keysOf=w=>{ const o={}; train.forEach(d=>cardios(p.weeks[w]&&p.weeks[w][d]).forEach(c=>{ if(c.type==='run'&&c.dose&&c.dose.key) (o[c.dose.key]=o[c.dose.key]||[]).push(d); })); return o; };
  const wks=Object.keys(p.weeks).map(Number).sort((a,b)=>a-b);
  const lw=wks.find(w=>keysOf(w).long);
  const anySteady=wks.some(w=>keysOf(w).steady);
  const tag=(mix||'run')+' '+exp;
  cnt('programs '+tag);
  if(anySteady) cnt('any steady-keyed run '+tag);
  if(!lw) cnt('no long-keyed run '+tag);
  else if(keysOf(lw).steady){ cnt('STEADY IN PLACEMENT WEEK '+tag); if(samples.length<4) samples.push(`  ${tag} bd=${bd} rest=[${rest}] seed=${seed} ${pp} lw=${lw} keys ${JSON.stringify(keysOf(lw))} note ${JSON.stringify(p.legRecoveryNote)}`); }
  else cnt('placement week without steady '+tag);
  const nk=(p.legRecoveryNote||'null').slice(0,50); notes[nk]=(notes[nk]||0)+1;
}))))));
console.log('ia-version '+IA.version+', '+n+' programs (3 exp x 4 baselineDist x 10 rest x 3 seeds x 2 paths x 3 mixes; 55+)');
Object.keys(T).sort().forEach(k=>console.log('  '+k.padEnd(52)+T[k]));
console.log('  notes: '+JSON.stringify(notes));
samples.forEach(s=>console.log(s));
