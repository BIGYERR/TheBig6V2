// v205_nrc_eve_predicate.js — BEFORE-PICTURE for D129 (NRC branch). READ-ONLY.
// Question: does swapping the recBeforeLong predicate from `pos(d)<pos(longDay)`
// (Sunday-first absolute position) to `d===prevDay(longDay)` (true eve, circular)
// move ANYTHING on the four NRC goals?
//
// ORACLES, independent of _nrcSpacedRunDays:
//  - the chooser objective is re-implemented here from the ruling text + the comment
//    block at index.html:5425-5429. It is NOT the engine function. The engine function
//    is extracted separately and used ONLY as a baseline-equals-itself control.
//  - getNRCSessionTypes is transcribed BY HAND below from index.html:4357-4372.
//  - the corrected predicate is derived from the calendar (eve of day X = X-1 mod 7),
//    not from any engine expression.
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..','..');
const ART=process.argv[2]||path.join(ROOT,'index.html');
const SCRATCH=process.argv[3]||'/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';
const say=(...a)=>console.log(...a);
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const pos=d=>DAYS.indexOf(d);
const circ=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevDay=d=>DAYS[(pos(d)+6)%7];

// ── HAND TRANSCRIPTION of index.html:4357-4372 ───────────────────────────────
function nrcTypes(n,goal){
  if(goal==='run_marathon'){
    if(n>=5) return ['nrc_recovery','nrc_speed1','nrc_recovery','nrc_recovery','nrc_long'];
    if(n===4) return ['nrc_recovery','nrc_speed1','nrc_recovery','nrc_long'];
    if(n===3) return ['nrc_speed1','nrc_recovery','nrc_long'];
    if(n===2) return ['nrc_recovery','nrc_long'];
    return ['nrc_long'];
  }
  if(n>=5) return ['nrc_speed1','nrc_recovery','nrc_speed2','nrc_recovery','nrc_long'];
  if(n===4) return ['nrc_speed1','nrc_recovery','nrc_speed2','nrc_long'];
  if(n===3) return ['nrc_speed1','nrc_recovery','nrc_long'];
  if(n===2) return ['nrc_recovery','nrc_long'];
  return ['nrc_long'];
}
const T_NRC={long:'nrc_long',rec:'nrc_recovery',s1:'nrc_speed1',s2:'nrc_speed2'};
const T_PACE={long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'};

function combos(arr,k){ if(k===0) return [[]]; if(arr.length<k) return []; const [h,...t]=arr; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }

// ── ORACLE CHOOSER. mode: 'ship' = pos(d)<pos(longDay); 'fix' = d===prevDay(longDay)
function choose(train,capDays,types,T,paceFam,mode,collect){
  const inTrain=new Set(train), n=train.length, last=n-1;
  const subs=[];
  combos(train.map((_,i)=>i),capDays).forEach(idxs=>{ if(paceFam||idxs[idxs.length-1]===last) subs.push(idxs); });
  const P=perms(types.slice());
  let best=null; const all=[];
  for(const idxs of subs){
    const days=idxs.map(i=>train[i]);
    for(const p of P){
      if(!paceFam && p.includes(T.long) && p[p.length-1]!==T.long) continue;
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const HARD=[T.s1,T.s2,T.long];
      const hd=days.filter(d=>HARD.indexOf(typeOf[d])>=0);
      let coll=0; for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      const sp=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
      const speedsAfterRest=sp.filter(d=>!inTrain.has(prevDay(d))).length;
      const longDay=days.find(d=>typeOf[d]===T.long);
      const rec = mode==='ship'
        ? (longDay && days.some(d=>typeOf[d]===T.rec && circ(d,longDay)===1 && pos(d)<pos(longDay))?1:0)
        : (longDay && days.some(d=>typeOf[d]===T.rec && d===prevDay(longDay))?1:0);
      const longLast=(!longDay||longDay===train[n-1])?1:0;
      const s1=days.find(d=>typeOf[d]===T.s1), s2=days.find(d=>typeOf[d]===T.s2);
      const canonical=(s1&&s2&&pos(s1)<pos(s2))?1:0;
      const cand={idxs:idxs.slice(),days,typeOf,coll,longLast,speedsAfterRest,recBeforeLong:rec,canonical};
      if(collect) all.push(cand);
      const rk=c=>[-c.coll,c.longLast,c.speedsAfterRest,c.recBeforeLong,c.canonical];
      if(!best) best=cand;
      else { const ka=rk(cand),kb=rk(best);
        for(let i=0;i<ka.length;i++){ if(ka[i]!==kb[i]){ if(ka[i]>kb[i]) best=cand; break; } } }
    }
  }
  return collect?{best,all}:{best};
}
const layout=c=>c?c.days.map(d=>d+':'+String(c.typeOf[d]).replace('nrc_','').replace('lsd_','')).join(' '):'(null)';
const rankv=c=>c?JSON.stringify([-c.coll,c.longLast,c.speedsAfterRest,c.recBeforeLong,c.canonical]):'-';

// ── extract the SHIPPED chooser for the baseline-equals-itself control ───────
function grab(src,name){ const sig='function '+name+'('; const i=src.indexOf(sig); if(i<0) throw new Error('not found '+name);
  let j=src.indexOf('{',i),d=0,k=j,mode=null;
  for(;k<src.length;k++){ const c=src[k],n2=src[k+1];
    if(mode==='line'){ if(c==='\n') mode=null; continue; }
    if(mode==='block'){ if(c==='*'&&n2==='/'){mode=null;k++;} continue; }
    if(mode){ if(c==='\\'){k++;continue;} if(c===mode) mode=null; continue; }
    if(c==='/'&&n2==='/'){mode='line';k++;continue;}
    if(c==='/'&&n2==='*'){mode='block';k++;continue;}
    if(c==='"'||c==="'"||c==='`'){mode=c;continue;}
    if(c==='{')d++; else if(c==='}'){d--; if(d===0) return src.slice(i,k+1);} }
  throw new Error('unbalanced '+name); }
const SRC=fs.readFileSync(ART,'utf8');
const parts=['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(SRC,n)));
const ctx={out:null};
vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gn:getNRCSessionTypes};',ctx);
const SHIPPED=ctx.out;

// ════ DENOMINATOR: re-derived, not taken ═════════════════════════════════════
const GOALS=['run_5k','run_10k','run_half','run_marathon'];
const restCals=[];           // every training-day calendar with n>=3 (capDays 2..n-1 nonempty)
for(let mask=1;mask<128;mask++){
  const train=DAYS.filter((_,i)=>mask&(1<<i));
  if(train.length<3) continue;
  restCals.push(train);
}
const rows=[];
GOALS.forEach(g=>restCals.forEach(train=>{
  for(let cap=2;cap<=train.length-1;cap++) rows.push({g,train,cap});
}));
say('════ PART 0 — DENOMINATOR, re-derived');
say('  training calendars with n>=3 (so capDays 2..n-1 is nonempty): '+restCals.length);
const byN={}; restCals.forEach(t=>byN[t.length]=(byN[t.length]||0)+1);
say('  by n: '+JSON.stringify(byN));
say('  chooser rows = 4 NRC goals x sum over calendars of (n-2) = '+rows.length);
say('  (hand check: 4 * [35*1 + 35*2 + 21*3 + 7*4 + 1*5] = 4*201 = 804)');

// ════ CONTROL: my oracle under the SHIPPED predicate == the shipped function ══
let ctrlOK=0, ctrlBAD=0, degenerate=0; const ctrlBadRows=[];
rows.forEach(r=>{
  const types=nrcTypes(r.cap,r.g);
  const engTypes=SHIPPED.gn(r.cap,r.g);
  if(JSON.stringify(types)!==JSON.stringify(engTypes)) { ctrlBAD++; ctrlBadRows.push('TYPEMISMATCH '+r.g+' cap'+r.cap); return; }
  if(types.length!==r.cap) degenerate++;
  const mine=choose(r.train,r.cap,types,T_NRC,false,'ship');
  const eng=SHIPPED.c(r.train,r.cap,r.g,false);
  const a=layout(mine.best);
  const b=eng?eng.idxs.map(i=>r.train[i]).map(d=>d+':'+String(eng.typeOf[d]).replace('nrc_','')).join(' '):'(null)';
  if(a===b) ctrlOK++; else { ctrlBAD++; if(ctrlBadRows.length<20) ctrlBadRows.push(r.g+' '+r.train.join('+')+' cap'+r.cap+' | oracle='+a+' | engine='+b); }
});
say('\n════ CONTROL — oracle(ship predicate) vs shipped _nrcSpacedRunDays');
say('  agree '+ctrlOK+' / '+rows.length+'   disagree '+ctrlBAD);
say('  rows where types.length != capDays (NRC type list caps at 5): '+degenerate);
ctrlBadRows.forEach(x=>say('   MISMATCH '+x));
if(ctrlBAD>0) say('  !! control failed — the delta below is not trustworthy');

// ════ PART 1 — 804 chooser rows, ship vs fix ═════════════════════════════════
say('\n════ PART 1 — 804 NRC chooser rows: pos(d)<pos(longDay)  vs  d===prevDay(longDay)');
let diff=0; const diffs=[]; const segG={},segCap={},segN={};
rows.forEach(r=>{
  const types=nrcTypes(r.cap,r.g);
  const A=choose(r.train,r.cap,types,T_NRC,false,'ship').best;
  const B=choose(r.train,r.cap,types,T_NRC,false,'fix').best;
  if(layout(A)!==layout(B)){
    diff++; segG[r.g]=(segG[r.g]||0)+1; segCap[r.cap]=(segCap[r.cap]||0)+1; segN[r.train.length]=(segN[r.train.length]||0)+1;
    diffs.push({r,A,B});
  }
});
say('  rows whose chosen layout differs: '+diff+' / '+rows.length);
say('  segmented by goal: '+JSON.stringify(segG));
say('  segmented by capDays: '+JSON.stringify(segCap));
say('  segmented by n train days: '+JSON.stringify(segN));
diffs.forEach(d=>{
  say('   ROW '+d.r.g+'  train='+d.r.train.join('+')+'  capDays='+d.r.cap);
  say('     ship: '+layout(d.A)+'   rank='+rankv(d.A));
  say('     fix : '+layout(d.B)+'   rank='+rankv(d.B));
});
if(!diff) say('   (no differing rows to name)');

// ════ PART 5 — reachability of recBeforeLong on NRC ══════════════════════════
say('\n════ PART 5 — is recBeforeLong load-bearing on NRC?');
let decides=0, settledEarlier=0, constant=0, varies=0;
const decidesRows=[];
rows.forEach(r=>{
  const types=nrcTypes(r.cap,r.g);
  const {best,all}=choose(r.train,r.cap,types,T_NRC,false,'ship',true);
  const vals=new Set(all.map(c=>c.recBeforeLong));
  if(vals.size===1) constant++; else varies++;
  // survivors of ranks 1..3 at the winner's values
  const surv=all.filter(c=>c.coll===best.coll&&c.longLast===best.longLast&&c.speedsAfterRest===best.speedsAfterRest);
  const sv=new Set(surv.map(c=>c.recBeforeLong));
  if(sv.size>1){ decides++; if(decidesRows.length<12) decidesRows.push(r.g+' '+r.train.join('+')+' cap'+r.cap+' -> winner rec='+best.recBeforeLong+' survivors='+surv.length); }
  else settledEarlier++;
});
say('  rows where recBeforeLong varies among ALL candidates: '+varies+' / '+rows.length+'  (constant in '+constant+')');
say('  rows where recBeforeLong is the DECIDING rank (survivors of ranks 1-3 disagree on it): '+decides+' / '+rows.length);
say('  rows settled at or before rank 3 (speedsAfterRest): '+settledEarlier+' / '+rows.length);
decidesRows.forEach(x=>say('   DECIDES '+x));

// ════ PART 4 — pace-side sanity: Mario's row ═════════════════════════════════
say('\n════ PART 4 — pace sanity, rest SUN+WED => train mon tue thu fri sat, capDays 4, run_pace_goal');
{
  const train=['mon','tue','thu','fri','sat'];
  const types=['lsd_easy','int','chi','lsd_long'];   // hand-transcribed authoring contract, nDays===4
  const eng=SHIPPED.gn?null:null;
  const A=choose(train,4,types,T_PACE,true,'ship').best;
  const B=choose(train,4,types,T_PACE,true,'fix').best;
  say('  ship: '+layout(A)+'  rank='+rankv(A));
  say('  fix : '+layout(B)+'  rank='+rankv(B));
  say('  expected by coach: MON:int THU:chi FRI:lsd_easy SAT:lsd_long');
  say('  unchanged by the correction: '+(layout(A)===layout(B)));
  // and the shipped engine function on the pace path, for the record
  const e=SHIPPED.c(train,4,'run_pace_goal',true);
  say('  shipped engine (paceFam=true): '+(e?e.idxs.map(i=>train[i]).map(d=>d+':'+e.typeOf[d]).join(' '):'(null)'));
}

// also sweep the whole pace lattice so the pace half is not an anecdote
say('\n════ PART 4b — pace family, full chooser lattice (same denominator shape)');
{
  const PT={2:null,3:['lsd_easy','int','lsd_long'],4:['lsd_easy','int','chi','lsd_long']};
  let n=0,d=0; const names=[];
  restCals.forEach(train=>{ for(let cap=2;cap<=train.length-1;cap++){
    const types=PT[cap]; if(!types) continue; n++;
    const A=choose(train,cap,types,T_PACE,true,'ship').best;
    const B=choose(train,cap,types,T_PACE,true,'fix').best;
    if(layout(A)!==layout(B)){ d++; if(names.length<40) names.push('train='+train.join('+')+' cap'+cap+' ship['+layout(A)+'] fix['+layout(B)+']'); }
  }});
  say('  pace rows measured (capDays 3 and 4 only, the two the contract defines): '+n);
  say('  rows whose layout differs: '+d+' / '+n);
  names.forEach(x=>say('   PACE MOVER '+x));
}
