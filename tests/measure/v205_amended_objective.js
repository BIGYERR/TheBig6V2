// v205 — NUMBER 1. Re-derivation of the 64-calendar enumeration under the AMENDED
// D125 objective: the long run is a PREFERENCE, not a pin. READ-ONLY. No ruling here.
//
// ORACLES (all independent of _nrcSpacedRunDays / deconflictLegLiftDays):
//  - capDays -> type list hand-transcribed from the authoring contract at
//    index.html:5146  `if(nDays === 4) return ['lsd_easy','int','chi','lsd_long'];`
//  - objective order re-implemented HERE from coach's amended ruling text, in priority:
//      (1) collisions minimised
//      (2) long run on the LAST train day of the athlete's week   <- now a preference
//      (3) speeds after a rest day
//      (4) a recovery run padding the long
//      (5) canonical tiebreak (INT before CHI)
//  - D127 cost table hand-transcribed from the comment at index.html:6444-6446.
//  - "hard" = {int, chi, lsd_long}; a collision is two hard days circularly adjacent.
const ALL = ['sun','mon','tue','wed','thu','fri','sat'];
const say = (...a)=>console.log(...a);
const pos = d=>ALL.indexOf(d);
const circ = (a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevDay = d=>ALL[(pos(d)+6)%7];
const HARD = new Set(['int','chi','lsd_long']);
const TYPES_BY_CAP = { 3:['int','chi','lsd_long'], 4:['lsd_easy','int','chi','lsd_long'] };

function permute(arr){const out=[];(function pm(rem,pre){if(!rem.length){out.push(pre.slice());return;}
  for(let i=0;i<rem.length;i++){pre.push(rem[i]);pm(rem.slice(0,i).concat(rem.slice(i+1)),pre);pre.pop();}})(arr.slice(),[]);return out;}
function subsetsOf(n,k){const out=[];(function s(st,acc){if(acc.length===k){out.push(acc.slice());return;}
  for(let i=st;i<n;i++){acc.push(i);s(i+1,acc);acc.pop();}})(0,[]);return out;}

// score a full assignment under the amended objective
function score(days, typeOf, trainDays, inTrain){
  const hd = days.filter(d=>HARD.has(typeOf[d]));
  let coll=0, pairs=[];
  for(let a=0;a<hd.length;a++)for(let b=a+1;b<hd.length;b++)
    if(circ(hd[a],hd[b])===1){coll++;pairs.push(hd[a]+'/'+hd[b]);}
  const longDay = days.find(d=>typeOf[d]==='lsd_long');
  const lastTrain = trainDays[trainDays.length-1];
  const longOnLast = (longDay===lastTrain)?1:0;                       // preference (2)
  const speeds = days.filter(d=>typeOf[d]==='int'||typeOf[d]==='chi');
  const sar = speeds.filter(d=>!inTrain.has(prevDay(d))).length;      // preference (3)
  const rec = (longDay && days.some(d=>typeOf[d]==='lsd_easy'&&circ(d,longDay)===1&&pos(d)<pos(longDay)))?1:0;
  const s1=days.find(d=>typeOf[d]==='int'), s2=days.find(d=>typeOf[d]==='chi');
  const canon = (s1&&s2&&pos(s1)<pos(s2))?1:0;
  return {days,typeOf,coll,pairs,longOnLast,sar,rec,canon,longDay};
}
function better(c,b){
  if(!b) return true;
  const k=['coll','longOnLast','sar','rec','canon'];
  if(c.coll!==b.coll) return c.coll<b.coll;
  for(const f of k.slice(1)) if(c[f]!==b[f]) return c[f]>b[f];
  return false;
}
function chooseAmended(trainDays, capDays){
  const types=TYPES_BY_CAP[capDays], n=trainDays.length, inTrain=new Set(trainDays);
  const subs = subsetsOf(n,capDays);           // NO "must include last day" filter now
  const perms = permute(types);
  let best=null, anyClean=false, cleanExample=null;
  for(const idxs of subs){ const days=idxs.map(i=>trainDays[i]);
    for(const p of perms){
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const c=score(days,typeOf,trainDays,inTrain);
      if(c.coll===0 && !anyClean){anyClean=true;cleanExample=c;}
      if(better(c,best)) best=c;
    } }
  return {best,anyClean,cleanExample,nSubsets:subs.length};
}
// D127 placement on the CHOSEN layout. cost table from index.html:6444-6446.
function d127(typeOf, trainDays){
  const longD=Object.keys(typeOf).find(d=>typeOf[d]==='lsd_long');
  const eve=ALL[(pos(longD)+6)%7], after=ALL[(pos(longD)+1)%7];
  const speed=new Set(Object.keys(typeOf).filter(d=>typeOf[d]==='int'||typeOf[d]==='chi'));
  const easy=new Set(Object.keys(typeOf).filter(d=>typeOf[d]==='lsd_easy'));
  const forbidden=new Set([longD,eve]);
  const cost=(role,d)=>{ if(forbidden.has(d)) return Infinity;
    const pv=ALL[(pos(d)+6)%7], nx=ALL[(pos(d)+1)%7]; let c=0;
    if(speed.has(d)) c+= role==='pull'?0.5:1.5;
    if(easy.has(d)) c+=1;
    if(speed.has(pv)) c+=1;
    if(speed.has(nx)) c+=2;
    if(d===after) c+=2; return c; };
  let best=null;
  trainDays.forEach(p=>trainDays.forEach(l=>{ if(p===l) return;
    const c=cost('pull',p)+cost('legs',l); if(!isFinite(c)) return; const sp=circ(p,l);
    if(!best||c<best.c||(c===best.c&&sp>best.sp)||(c===best.c&&sp===best.sp&&pos(l)<pos(best.legs)))
      best={c,sp,pull:p,legs:l}; }));
  const legalDays = trainDays.filter(d=>!forbidden.has(d));
  return {best,longD,eve,legalDays,placeable: !!best};
}
function combos(k){const o=[];(function r(s,a){if(a.length===k){o.push(a.slice());return;}
  for(let i=s;i<7;i++){a.push(ALL[i]);r(i+1,a);a.pop();}})(0,[]);return o;}

say('════ NUMBER 1 — amended D125 objective, long run RELAXED to a preference ════');
say('lattice: every rest pattern of size 0..3 = C(7,0)+C(7,1)+C(7,2)+C(7,3) = 1+7+21+35 = 64 calendars');
say('capDays = 4 at every training-day count 4..7 (ceiling withdrawn per coach).\n');

const rows=[];
[[]].concat(combos(1),combos(2),combos(3)).forEach(rest=>{
  const trainDays=ALL.filter(d=>!rest.includes(d));
  const nT=trainDays.length; if(nT<4) return;
  const A=chooseAmended(trainDays,4);
  const pl=d127(A.best.typeOf,trainDays);
  rows.push({rest:rest.join('+')||'(none)',nT,A,pl,trainDays});
});
let g4=0,g3=0; const losers=[], d127fail=[];
[4,5,6,7].forEach(n=>{
  const rs=rows.filter(r=>r.nT===n);
  const clean=rs.filter(r=>r.A.anyClean).length;
  say('── '+n+' training days: '+rs.length+' calendars | coll=0 reachable (=> FOUR runs): '
      +clean+'/'+rs.length+' | cannot (=> D113 three runs): '+(rs.length-clean)+'/'+rs.length);
  rs.forEach(r=>{
    const b=r.A.best;
    const tag = r.A.anyClean?'4RUN':'3RUN';
    const lay = b.days.map(d=>d.toUpperCase()+':'+b.typeOf[d]).join(' ');
    say('   '+tag+' rest='+r.rest.padEnd(12)+' coll='+b.coll
      +' longOnLast='+b.longOnLast+' sar='+b.sar+' rec='+b.rec+' canon='+b.canon
      +' | '+lay.padEnd(50)
      +' | D127 pull='+String(b.longOnLast>=0?r.pl.best&&r.pl.best.pull:'-').toUpperCase()
      +' legs='+String(r.pl.best&&r.pl.best.legs).toUpperCase()+' cost='+(r.pl.best?r.pl.best.c:'NONE')
      +' legalDays='+r.pl.legalDays.length
      +(b.coll>0?'  PAIRS['+b.pairs.join(',')+']':''));
    if(r.A.anyClean){ g4++; if(!r.pl.placeable) d127fail.push(r); }
    else { g3++; losers.push(r); }
  });
  say('');
});
say('TOTAL across 64 calendars: FOUR runs = '+g4+'/64   THREE runs (D113) = '+g3+'/64');
say('\nREMAINING LOSERS (no coll=0 layout at cap 4, long run free):');
if(!losers.length) say('   none.');
losers.forEach(r=>{const b=r.A.best;
  say('   rest='+r.rest.padEnd(12)+' ('+r.nT+' train days) best coll='+b.coll
    +'  pairs='+b.pairs.join(',')
    +'  layout: '+b.days.map(d=>d.toUpperCase()+':'+b.typeOf[d]).join(' ')
    +'  longOnLast='+b.longOnLast);});
say('\nD127 legality on the 4-run calendars: placeable '+(g4-d127fail.length)+'/'+g4
  +(d127fail.length?('  FAILURES: '+d127fail.map(r=>r.rest).join(', ')):'  (no failures)'));

// Did relaxing the pin CHANGE anything? compare against the PINNED enumeration.
say('\n── control: same lattice with the long run PINNED to the last train day ──');
function choosePinned(trainDays,capDays){
  const types=TYPES_BY_CAP[capDays], n=trainDays.length, inTrain=new Set(trainDays);
  const subs=subsetsOf(n,capDays).filter(a=>a[a.length-1]===n-1);
  const perms=permute(types).filter(p=>p[p.length-1]==='lsd_long');
  let best=null,anyClean=false;
  for(const idxs of subs){const days=idxs.map(i=>trainDays[i]);
    for(const p of perms){const typeOf={};days.forEach((d,i)=>typeOf[d]=p[i]);
      const c=score(days,typeOf,trainDays,inTrain); if(c.coll===0)anyClean=true;
      if(better(c,best))best=c;}}
  return {best,anyClean};
}
let p4=0; const flipped=[];
rows.forEach(r=>{ const P=choosePinned(r.trainDays,4);
  if(P.anyClean)p4++;
  if(P.anyClean!==r.A.anyClean) flipped.push({rest:r.rest,nT:r.nT,pinned:P.anyClean,free:r.A.anyClean,
    pinnedColl:P.best.coll, freeLayout:r.A.cleanExample?r.A.cleanExample.days.map(d=>d.toUpperCase()+':'+r.A.cleanExample.typeOf[d]).join(' '):'-'});
});
say('   PINNED: coll=0 reachable '+p4+'/64.   FREE: '+g4+'/64.   delta = '+(g4-p4));
say('   calendars the relaxation RESCUES ('+flipped.length+'):');
flipped.forEach(f=>say('     rest='+f.rest.padEnd(12)+' '+f.nT+'d  pinned bestColl='+f.pinnedColl
  +'  -> free coll=0 via  '+f.freeLayout));
[4,5,6,7].forEach(n=>{const rs=rows.filter(r=>r.nT===n);
  let pc=0; rs.forEach(r=>{if(choosePinned(r.trainDays,4).anyClean)pc++;});
  say('   '+n+'d: pinned '+pc+'/'+rs.length+'  free '+rs.filter(r=>r.A.anyClean).length+'/'+rs.length);});
