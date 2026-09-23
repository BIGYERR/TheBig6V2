// v205_d130_verify_built.js — VERIFY D130 slice 7a on the BUILT artifact.
//   node tests/measure/v205_d130_verify_built.js [built.html] [slice6.html]
// Oracle is hand-written here (circular week, the D130 split, ranks 2..9). The built
// engine is the THING COMPARED, never the source of an expected value.
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..','..');
const BUILT=process.argv[2]||path.join(ROOT,'index.html');
const SLICE6=process.argv[3]||'/tmp/base_slice6.html';

const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const pos=d=>DAYS.indexOf(d);
const circ=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevD=d=>DAYS[(pos(d)+6)%7];
function combos(a,k){if(k===0)return[[]];if(a.length<k)return[];const[h,...t]=a;return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k));}
function perms(a){if(!a.length)return[[]];const o=[];a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p])));return o;}
const T={long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'};
const HARD=new Set([T.s1,T.s2,T.long]);
const TYPES4=['lsd_easy','int','chi','lsd_long'];

function score(days,typeOf){
  const long=days.find(d=>typeOf[d]===T.long);
  const hd=days.filter(d=>HARD.has(typeOf[d]));
  let untol=0,tol=0,coll=0,pairs=[];
  for(let a=0;a<hd.length;a++)for(let b=a+1;b<hd.length;b++){
    if(circ(hd[a],hd[b])!==1)continue; coll++;
    const x=hd[a],y=hd[b];
    const chiEve=long&&((typeOf[x]===T.s2&&y===long&&x===prevD(long))||(typeOf[y]===T.s2&&x===long&&y===prevD(long)));
    if(chiEve){tol++;pairs.push('TOL:'+typeOf[x]+'@'+x+'|'+typeOf[y]+'@'+y);}
    else{untol++;pairs.push('UNT:'+typeOf[x]+'@'+x+'|'+typeOf[y]+'@'+y);}
  }
  return {untol,tol,coll,pairs};
}
function evenKeyFor(n,cap){const s=new Set();if(cap<=1)s.add(n-1);else for(let k=0;k<cap;k++)s.add(Math.round(k*(n-1)/(cap-1)));return Array.from(s).sort((a,b)=>a-b).join(',');}
function rankOf(train,idxs,typeOf,evenKey){
  const days=idxs.map(i=>train[i]); const inTrain=new Set(train), n=train.length;
  const s=score(days,typeOf);
  const long=days.find(d=>typeOf[d]===T.long);
  const speeds=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  const speedsAfterRest=speeds.filter(d=>!inTrain.has(prevD(d))).length;
  const recBeforeLong=long&&days.some(d=>typeOf[d]===T.rec&&d===prevD(long))?1:0;
  const longLast=(!long||long===train[n-1])?1:0;
  const s1=days.find(d=>typeOf[d]===T.s1),s2=days.find(d=>typeOf[d]===T.s2);
  const canonical=(s1&&s2&&pos(s1)<pos(s2))?1:0;
  const identity=(idxs.join(',')===evenKey)?1:0;
  const p=days.map(pos).sort((a,b)=>a-b);
  let lf=0;for(let i=0;i<p.length;i++){const nx=(i+1<p.length)?p[i+1]:p[0]+7;const g=nx-p[i]-1;if(g>lf)lf=g;}
  let qr=0;if(long){let near=7;days.forEach(d=>{if(typeOf[d]!==T.s1&&typeOf[d]!==T.s2)return;const b=(pos(long)-pos(d)+7)%7;if(b<near)near=b;});if(near<7)qr=near;}
  const fq=days.find(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  return {key:[-s.untol,-s.tol,longLast,speedsAfterRest,recBeforeLong,canonical,identity,-lf,qr,fq?-pos(fq):0],s,days,typeOf,idxs,longLast};
}
const cmp=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
function bestFor(train,cap){
  const n=train.length,ek=evenKeyFor(n,cap);let best=null;
  combos([...Array(n).keys()],cap).forEach(idxs=>{
    const days=idxs.map(i=>train[i]);
    perms(TYPES4).forEach(p=>{const typeOf={};days.forEach((d,i)=>typeOf[d]=p[i]);
      const c=rankOf(train,idxs,typeOf,ek); if(!best||cmp(c.key,best.key)>0)best=c;});
  });
  return best;
}
const lay=c=>c.days.map(d=>d.toUpperCase()+':'+c.typeOf[d]).join(' ');

function grab(src,name){const sig='function '+name+'(';const i=src.indexOf(sig);if(i<0)throw new Error('not found '+name);
  let j=src.indexOf('{',i),d=0,k=j,m=null;
  for(;k<src.length;k++){const c=src[k],nx=src[k+1];
    if(m==='line'){if(c==='\n')m=null;continue;}
    if(m==='block'){if(c==='*'&&nx==='/'){m=null;k++;}continue;}
    if(m){if(c==='\\'){k++;continue;}if(c===m)m=null;continue;}
    if(c==='/'&&nx==='/'){m='line';k++;continue;}
    if(c==='/'&&nx==='*'){m='block';k++;continue;}
    if(c==='"'||c==="'"||c==='`'){m=c;continue;}
    if(c==='{')d++;else if(c==='}'){d--;if(d===0)return src.slice(i,k+1);}}
  throw new Error('unbalanced '+name);}
function chooserOf(file){
  const S=fs.readFileSync(file,'utf8');
  const parts=['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(S,n)));
  const ctx={out:null};vm.runInNewContext(parts.join('\n')+'\nout=_nrcSpacedRunDays;',ctx);return ctx.out;
}
const ENG=chooserOf(BUILT), OLD=chooserOf(SLICE6);
const eLay=(train,p)=>p.idxs.map(i=>train[i].toUpperCase()+':'+p.typeOf[train[i]]).join(' ');

const FOURTEEN=new Set(['sun,mon,tue','sun,mon,thu','sun,mon,sat','sun,wed,thu','sun,wed,sat','sun,fri,sat',
 'mon,tue,wed','mon,tue,fri','mon,thu,fri','tue,wed,thu','tue,wed,sat','tue,fri,sat','wed,thu,fri','thu,fri,sat']);

console.log('=== THE 64 CALENDARS AT CAP 4 — BUILT ENGINE vs ORACLE vs SLICE 6 ===');
console.log('rest'.padEnd(14)+'grp  (unt,tol)  '+'BUILT LAYOUT'.padEnd(52)+'ORA  S6same  longLast');
let n64=0,nOra=0,n14u0=0,n14_00=0,n50=0,n50same=0,n50_00=0,offLongLast=[],tolCals=[],mismatch=[];
[0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  const train=DAYS.filter(d=>rest.indexOf(d)<0); if(train.length<4)return;
  const key=rest.join(','), is14=FOURTEEN.has(key);
  n64++;
  const p=ENG(train,4,'run_pace_goal',true);
  const days=p.idxs.map(i=>train[i]);
  const s=score(days,p.typeOf);                       // ORACLE scores the ENGINE's layout
  const o=bestFor(train,4);                            // ORACLE's own winner
  const oldp=OLD(train,4,'run_pace_goal',true);
  const same=eLay(train,p)===eLay(train,oldp);
  const long=days.find(d=>p.typeOf[d]===T.long);
  const ll=(long===train[train.length-1]);
  const oraMatch=eLay(train,p)===lay(o);
  if(oraMatch)nOra++; else mismatch.push('  MISMATCH rest='+key+' built '+eLay(train,p)+' oracle '+lay(o));
  if(s.tol>0)tolCals.push(key);
  if(!ll)offLongLast.push(key+'  '+eLay(train,p));
  if(is14){ if(s.untol===0)n14u0++; if(s.untol===0&&s.tol===0)n14_00++; }
  else { n50++; if(same)n50same++; if(s.untol===0&&s.tol===0)n50_00++; }
  console.log((key||'(none)').padEnd(14)+(is14?'14 ':'50 ')+'  ('+s.untol+','+s.tol+')     '+
    eLay(train,p).padEnd(52)+(oraMatch?'ok ':'XX ')+'  '+(same?'yes':'NO ')+'     '+(ll?'yes':'NO'));
}));
console.log('\ncalendars: '+n64+'/64   built layout == oracle winner: '+nOra+'/64');
mismatch.forEach(m=>console.log(m));
console.log('THE 14 : untolerated==0 '+n14u0+'/14    (0,0) '+n14_00+'/14   [floor is (0,1)]');
console.log('THE 50 : (0,0) '+n50_00+'/'+n50+'    byte-identical to slice 6: '+n50same+'/'+n50);
console.log('tolerated fires on '+tolCals.length+' calendars; all 14? '+
  (tolCals.length===14 && tolCals.every(k=>FOURTEEN.has(k))));
console.log('OFF longLast ('+offLongLast.length+'):'); offLongLast.forEach(x=>console.log('   '+x));

console.log('\n=== MARIO (rest sun,wed) ===');
{ const train=DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const p=ENG(train,4,'run_pace_goal',true), o=OLD(train,4,'run_pace_goal',true);
  const s=score(p.idxs.map(i=>train[i]),p.typeOf);
  const want='MON:int THU:chi FRI:lsd_easy SAT:lsd_long';
  console.log('  built   '+eLay(train,p)+'  ('+s.untol+','+s.tol+')');
  console.log('  slice6  '+eLay(train,o));
  console.log('  want    '+want+'   MATCH='+(eLay(train,p)===want)+'  unmoved='+(eLay(train,p)===eLay(train,o)));
}

// ── CONTAINMENT: full builds, 64 calendars x 9 seeds x 11 weeks ──────────────
if(process.env.SKIP_BUILD!=='1'){
console.log('\n=== CONTAINMENT — BUILT WEEKS ===');
const {load}=require(path.join(ROOT,'tests','harness.js'));
const IA=load(BUILT);
const SEEDS=[1001,2002,3003,4004,5005,6006,7007,8008,9009];
const cfgFor=(rest,seed)=>({name:'P',primaryPath:'goal',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'Pace',targetDist:'1.5',targetMins:'10',targetSecs:'0',
    mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'crossfit',unit:'lbs',restDays:rest,days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed});
let weeks=0,tolWeeks=0,untolWeeks=0,eveHits=0,longDayHits=0,tol14=0,tol50=0;
const runHist={};const perCal={};
[0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  if(7-nr<4)return; const key=rest.join(',');perCal[key]=0;
  SEEDS.forEach(seed=>{
    const prog=IA.buildProgram(cfgFor(rest,seed));
    Object.keys(prog.weeks).forEach(wk=>{
      const w=prog.weeks[wk];let long=null;const runs=[],typeByDay={};
      DAYS.forEach(d=>{const day=w[d];if(!day||!day.cardio)return;
        const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio];
        cs.forEach(c=>{if(c.type!=='run')return;runs.push(d);const st=c.subtype||'';
          if(/^Interval \(INT\)/.test(st))typeByDay[d]='int';
          else if(/^Continuous High Intensity \(CHI\)/.test(st))typeByDay[d]='chi';
          else if(c.legLoad){typeByDay[d]='lsd_long';long=d;}
          else typeByDay[d]='lsd_easy';});});
      weeks++;runHist[runs.length]=(runHist[runs.length]||0)+1;
      if(!long)return;
      const s=score(runs,typeByDay);
      if(s.untol>0)untolWeeks++;
      if(s.tol>0){tolWeeks++;perCal[key]++;if(FOURTEEN.has(key))tol14++;else tol50++;}
      const eve=prevD(long);
      const t=(w[eve]&&w[eve].title)||'';
      if(t==='Posterior Chain'||t==='Leg Strength + Mobility')eveHits++;
      const tl=(w[long]&&w[long].title)||'';
      if(tl==='Posterior Chain'||tl==='Leg Strength + Mobility')longDayHits++;
    });
  });
}));
console.log('  weeks built: '+weeks+'   run-days histogram: '+JSON.stringify(runHist));
console.log('  UNTOLERATED weeks : '+untolWeeks+'/'+weeks);
console.log('  TOLERATED weeks   : '+tolWeeks+'/'+weeks+'   on the 14: '+tol14+'   on the 50: '+tol50+'  [expect 1386 / 1386 / 0]');
console.log('  PULL|LEGS on long-run EVE: '+eveHits+'/'+weeks+'   on long-run DAY: '+longDayHits+'/'+weeks);
const bad=Object.keys(perCal).filter(k=>(FOURTEEN.has(k)?perCal[k]!==99:perCal[k]!==0));
console.log('  per-calendar containment exact (14 x 99 weeks, 50 x 0): '+(bad.length===0?'CLEAN':'OFF: '+bad.map(k=>k+'='+perCal[k]).join(' ')));
}
