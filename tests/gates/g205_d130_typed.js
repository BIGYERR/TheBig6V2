// g205_d130_typed.js — GATE for D130 (amended): typed hard-day adjacency on the pace family.
//
//   node tests/gates/g205_d130_typed.js [index.html]
//
// THE RULING THIS DEFENDS (not the version it shipped on):
//   Rank 1  UNTOLERATED — every hard pair on adjacent days EXCEPT CHI on the eve of the
//           long LSD. Must be 0. INT beside CHI, INT beside the long either way, and any
//           quality session the day AFTER the long run are all untolerated.
//   Rank 1b TOLERATED — CHI on the long run's eve. Minimised, never traded.
//   The D125 conditional ceiling reads UNTOLERATED, so four runs ship on all 64 calendars.
//
// ORACLE INDEPENDENCE. The circular week, the split, ranks 2..9 and the UNSPLIT control
// are all re-derived in this file from the ruling text over a hand-written seven-day ring.
// The engine is the thing compared. No assertion reads an engine value as its expectation.
// The 50 clean calendars are pinned against the UNSPLIT oracle — the pre-D130 objective,
// re-derived here — which is what "byte-identical to what shipped before" means as a
// predicate rather than as a diff.
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..','..');
const HTML=process.argv[2]||path.join(ROOT,'index.html');
const SRC=fs.readFileSync(HTML,'utf8');
const VER=parseInt((SRC.match(/name="ia-version" content="(\d+)"/)||[])[1],10);

let P=0,F=0;
function ok(name,cond,got){ if(cond){P++;console.log('PASS '+name);} else {F++;console.log('FAIL '+name+(got!==undefined?' (got '+got+')':''));} }

// ── ERA PREDICATE ────────────────────────────────────────────────────────────
// D130 SHIPS AT ia-version 205 and every claim below holds from that artifact forward.
// Below 205 there is no split rank to defend. (The engine edit landed in slice 7a, which
// carried no version bump - that is why an earlier draft of this comment read 204. The
// bump is slice 8, so 205 is the first artifact that carries D130 and the predicate below
// is keyed on it.)
if(!(VER>=205)){ console.log('SKIP g205_d130_typed: ia-version '+VER+' predates D130 (needs >= 205)'); console.log('PASS 0 FAIL 0'); process.exit(0); }

// ── hand-written circular week ───────────────────────────────────────────────
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const pos=d=>DAYS.indexOf(d);
const circ=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevD=d=>DAYS[(pos(d)+6)%7];
function combos(a,k){if(k===0)return[[]];if(a.length<k)return[];const[h,...t]=a;return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k));}
function perms(a){if(!a.length)return[[]];const o=[];a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p])));return o;}
const T={long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'};
const HARD=new Set([T.s1,T.s2,T.long]);
const TYPES4=['lsd_easy','int','chi','lsd_long'];   // NSW table, four run days

// THE SPLIT, written from the ruling text.
function score(days,typeOf){
  const long=days.find(d=>typeOf[d]===T.long);
  const hd=days.filter(d=>HARD.has(typeOf[d]));
  let untol=0,tol=0,coll=0;
  for(let a=0;a<hd.length;a++)for(let b=a+1;b<hd.length;b++){
    if(circ(hd[a],hd[b])!==1)continue; coll++;
    const x=hd[a],y=hd[b];
    // Tolerated is TYPED and DIRECTIONAL: CHI on prevDay(long). A quality session the day
    // after the long run is untolerated, and so is INT on the eve.
    const chiEve=long&&((typeOf[x]===T.s2&&y===long&&x===prevD(long))||(typeOf[y]===T.s2&&x===long&&y===prevD(long)));
    if(chiEve)tol++;else untol++;
  }
  return {untol,tol,coll};
}
function evenKeyFor(n,cap){const s=new Set();if(cap<=1)s.add(n-1);else for(let k=0;k<cap;k++)s.add(Math.round(k*(n-1)/(cap-1)));return Array.from(s).sort((a,b)=>a-b).join(',');}
function rankOf(train,idxs,typeOf,ek,split){
  const days=idxs.map(i=>train[i]); const inTrain=new Set(train), n=train.length;
  const s=score(days,typeOf);
  const long=days.find(d=>typeOf[d]===T.long);
  const speeds=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  const speedsAfterRest=speeds.filter(d=>!inTrain.has(prevD(d))).length;
  const recBeforeLong=long&&days.some(d=>typeOf[d]===T.rec&&d===prevD(long))?1:0;
  const longLast=(!long||long===train[n-1])?1:0;
  const s1=days.find(d=>typeOf[d]===T.s1),s2=days.find(d=>typeOf[d]===T.s2);
  const canonical=(s1&&s2&&pos(s1)<pos(s2))?1:0;
  const identity=(idxs.join(',')===ek)?1:0;
  const p=days.map(pos).sort((a,b)=>a-b);
  let lf=0;for(let i=0;i<p.length;i++){const nx=(i+1<p.length)?p[i+1]:p[0]+7;const g=nx-p[i]-1;if(g>lf)lf=g;}
  let qr=0;if(long){let near=7;days.forEach(d=>{if(typeOf[d]!==T.s1&&typeOf[d]!==T.s2)return;const b=(pos(long)-pos(d)+7)%7;if(b<near)near=b;});if(near<7)qr=near;}
  const fq=days.find(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  const head=split?[-s.untol,-s.tol]:[-s.coll];
  return {key:head.concat([longLast,speedsAfterRest,recBeforeLong,canonical,identity,-lf,qr,fq?-pos(fq):0]),s,days,typeOf,longLast};
}
const cmp=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;};
function bestFor(train,cap,split){
  const n=train.length,ek=evenKeyFor(n,cap);let best=null;
  combos([...Array(n).keys()],cap).forEach(idxs=>{
    const days=idxs.map(i=>train[i]);
    perms(TYPES4).forEach(p=>{const typeOf={};days.forEach((d,i)=>typeOf[d]=p[i]);
      const c=rankOf(train,idxs,typeOf,ek,split);if(!best||cmp(c.key,best.key)>0)best=c;});});
  return best;
}
const lay=c=>c.days.map(d=>d.toUpperCase()+':'+c.typeOf[d]).join(' ');

// ── the engine's chooser, by source surgery ──────────────────────────────────
function grab(src,name){const sig='function '+name+'(';const i=src.indexOf(sig);if(i<0)throw new Error('not found '+name);
  let d=0,k=src.indexOf('{',i),m=null;
  for(;k<src.length;k++){const c=src[k],nx=src[k+1];
    if(m==='line'){if(c==='\n')m=null;continue;}
    if(m==='block'){if(c==='*'&&nx==='/'){m=null;k++;}continue;}
    if(m){if(c==='\\'){k++;continue;}if(c===m)m=null;continue;}
    if(c==='/'&&nx==='/'){m='line';k++;continue;}
    if(c==='/'&&nx==='*'){m='block';k++;continue;}
    if(c==='"'||c==="'"||c==='`'){m=c;continue;}
    if(c==='{')d++;else if(c==='}'){d--;if(d===0)return src.slice(i,k+1);}}
  throw new Error('unbalanced '+name);}
const parts=['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(SRC,n)));
const ctx={out:null};vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes};',ctx);
const ENG=ctx.out.c;
const eLay=(train,p)=>p.idxs.map(i=>train[i].toUpperCase()+':'+p.typeOf[train[i]]).join(' ');

// D0 the roster this gate permutes is the roster the engine deals at four run days.
{ const r=ctx.out.gs(4,true,false,false);
  ok('D0 the NSW four-day run roster is easy/INT/CHI/long',
     r.slice().sort().join()===TYPES4.slice().sort().join(), r.join(',')); }

// ── THE 14, BY NAME. Pinned so a rank change that moves the set trips here. ───
const FOURTEEN=['sun,mon,tue','sun,mon,thu','sun,mon,sat','sun,wed,thu','sun,wed,sat','sun,fri,sat',
 'mon,tue,wed','mon,tue,fri','mon,thu,fri','tue,wed,thu','tue,wed,sat','tue,fri,sat','wed,thu,fri','thu,fri,sat'];
const F14=new Set(FOURTEEN);
// The four of the 14 that GIVE UP longLast, by calendar name and by exact layout. This is
// ruled, not inherited: three put the long on SUNDAY behind a Saturday CHI, and mon,tue,wed
// ends the week on the easy run as a shakeout into three rest days — the only calendar in
// 64 where that happens.
const OFF_LL={
  'mon,tue,fri':'SUN:lsd_long WED:int THU:lsd_easy SAT:chi',
  'mon,thu,fri':'SUN:lsd_long TUE:int WED:lsd_easy SAT:chi',
  'wed,thu,fri':'SUN:lsd_long MON:lsd_easy TUE:int SAT:chi',
  'mon,tue,wed':'SUN:int THU:chi FRI:lsd_long SAT:lsd_easy'
};

let n64=0,dOra=0,dUnt=[],d14u=0,d14p=[],d50=0,d50_00=0,d50ctl=0,tolCal=[],offLL=[],offLLbad=[];
[0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  const train=DAYS.filter(d=>rest.indexOf(d)<0); if(train.length<4)return;
  const key=rest.join(','), is14=F14.has(key); n64++;
  const p=ENG(train,4,'run_pace_goal',true);
  const days=p.idxs.map(i=>train[i]);
  const s=score(days,p.typeOf);
  const built=eLay(train,p);
  if(built===lay(bestFor(train,4,true)))dOra++;
  if(s.untol>0)dUnt.push(key+' untol='+s.untol+' '+built);
  if(s.tol>0)tolCal.push(key);
  const long=days.find(d=>p.typeOf[d]===T.long);
  if(long!==train[train.length-1])offLL.push(key);
  if(is14){ if(s.untol===0&&s.tol===1)d14u++; else d14p.push(key+' ('+s.untol+','+s.tol+')');
            if(OFF_LL[key]!==undefined && OFF_LL[key]!==built) offLLbad.push(key+' want "'+OFF_LL[key]+'" got "'+built+'"'); }
  else { d50++; if(s.untol===0&&s.tol===0)d50_00++;
         if(built===lay(bestFor(train,4,false)))d50ctl++; }
}));

ok('D1 all 64 rest-day calendars are enumerated at a four-run ceiling', n64===64, n64);
ok('D2 UNTOLERATED is 0 on every one of the 64 calendars', dUnt.length===0, dUnt.join(' | '));
ok('D3 the built layout is the lexicographic maximum of the SPLIT objective (64 calendars)', dOra===64, dOra+'/64');
ok('D4 the 14 named calendars land exactly (0,1) — the floor, not an aspiration', d14u===14, d14u+'/14 off: '+d14p.join(' | '));
ok('D5 TOLERATED fires on exactly the 14 named calendars and no other',
   tolCal.length===14 && tolCal.every(k=>F14.has(k)), tolCal.join(' '));
ok('D6 the other 50 calendars land (0,0)', d50===50 && d50_00===50, d50_00+'/'+d50);
ok('D7 the 50 are unmoved: each equals the UNSPLIT (pre-D130) objective winner', d50ctl===50, d50ctl+'/50');
ok('D8 exactly four of the 14 give up longLast, and they are the four the ruling names',
   offLL.filter(k=>F14.has(k)).sort().join('|')===Object.keys(OFF_LL).sort().join('|'),
   offLL.filter(k=>F14.has(k)).sort().join('|'));
ok('D8b those four carry the exact layout the ruling prints', offLLbad.length===0, offLLbad.join(' | '));

// D9 MARIO. Hand-written from the ruling, not read back.
{ const train=DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const p=ENG(train,4,'run_pace_goal',true);
  const s=score(p.idxs.map(i=>train[i]),p.typeOf);
  ok('D9 Mario (rest sun+wed) is MON:int THU:chi FRI:lsd_easy SAT:lsd_long at (0,0)',
     eLay(train,p)==='MON:int THU:chi FRI:lsd_easy SAT:lsd_long' && s.untol===0 && s.tol===0,
     eLay(train,p)+' ('+s.untol+','+s.tol+')'); }

// D10 THE CEILING IS KEYED ON UNTOLERATED, AND THE OLD KEY IS GONE FROM LIVE CODE.
{ const noCom=SRC.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').map(l=>l.replace(/(^|[^:])\/\/.*$/,'$1')).join('\n');
  ok('D10 the D125 ceiling reads _pick.untol', noCom.indexOf('(!_pick || _pick.untol > 0)')>=0);
  ok('D10b the total-collision key is gone from the ceiling', noCom.indexOf('_pick.coll > 0')<0);
  ok('D10c the rank key leads with -untol then -tol', noCom.indexOf('[-c.untol, -c.tol, c.longLast,')>=0);
  ok('D10d the split is PACE-ONLY: untol falls back to coll off the pace arm',
     noCom.indexOf('const untol = paceFam ? _untol : coll;')>=0 && noCom.indexOf('const tol   = paceFam ? _tol   : 0;')>=0); }

// D11 NRC IS UNMOVED. The NRC arm must still be the maximum of the UNSPLIT objective's
// first term, which off the pace arm is what the split collapses to by construction.
{ let nrcRows=0,nrcMoved=[];
  ['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
    [2,3,4].forEach(cap=>{
      combos(DAYS,2).forEach(rest=>{
        const train=DAYS.filter(d=>rest.indexOf(d)<0); if(cap>=train.length)return;
        let p; try{ p=ENG(train,cap,g,false); }catch(e){ return; }
        if(!p)return; nrcRows++;
        if(p.coll!==p.untol) nrcMoved.push(g+'/'+cap+'/'+rest.join('+')+' coll='+p.coll+' untol='+p.untol);
      });
    });
  });
  ok('D11 the NRC arm carries untol === coll on every row ('+nrcRows+' rows)',
     nrcRows>100 && nrcMoved.length===0, nrcMoved.slice(0,4).join(' | ')); }

// ── D12 CONTAINMENT, ON BUILT WEEKS ──────────────────────────────────────────
// 64 calendars x 9 seeds x 11 weeks = 6,336 weeks. The tolerated adjacency must fire on
// 14 x 9 x 11 = 1,386 of them and on nothing else. A tolerated hit on any of the 50 is a
// regression; so is a three-run week anywhere.
{ const {load}=require(path.join(ROOT,'tests','harness.js'));
  const IA=load(HTML);
  const SEEDS=[1001,2002,3003,4004,5005,6006,7007,8008,9009];
  const cfgFor=(rest,seed)=>({name:'P',primaryPath:'goal',cardioTypes:['run'],
    cardioGoals:{run:{id:'run_pace_goal',label:'Pace',targetDist:'1.5',targetMins:'10',targetSecs:'0',
      mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},
    eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
    equipment:'crossfit',unit:'lbs',restDays:rest,days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed});
  let weeks=0,tolW=0,untolW=0,tol50=0,eve=0,longDay=0,notFour=0;const perCal={};
  [0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
    if(7-nr<4)return; const key=rest.join(','); perCal[key]=0;
    SEEDS.forEach(seed=>{
      const prog=IA.buildProgram(cfgFor(rest,seed));
      Object.keys(prog.weeks).forEach(wk=>{
        const w=prog.weeks[wk];let long=null;const runs=[],tb={};
        DAYS.forEach(d=>{const day=w[d];if(!day||!day.cardio)return;
          const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio];
          cs.forEach(c=>{if(c.type!=='run')return;runs.push(d);const st=c.subtype||'';
            if(/^Interval \(INT\)/.test(st))tb[d]='int';
            else if(/^Continuous High Intensity \(CHI\)/.test(st))tb[d]='chi';
            else if(c.legLoad){tb[d]='lsd_long';long=d;}
            else tb[d]='lsd_easy';});});
        weeks++; if(runs.length!==4)notFour++;
        if(!long)return;
        const s=score(runs,tb);
        if(s.untol>0)untolW++;
        if(s.tol>0){tolW++;perCal[key]++;if(!F14.has(key))tol50++;}
        const t=(w[prevD(long)]&&w[prevD(long)].title)||'';
        if(t==='Posterior Chain'||t==='Leg Strength + Mobility')eve++;
        const tl=(w[long]&&w[long].title)||'';
        if(tl==='Posterior Chain'||tl==='Leg Strength + Mobility')longDay++;
      });
    });
  }));
  ok('D12 6,336 pace weeks built (64 calendars x 9 seeds x 11 weeks)', weeks===6336, weeks);
  ok('D12b every one of them carries four run days', notFour===0, notFour+' off four');
  ok('D12c no built week carries an UNTOLERATED hard adjacency', untolW===0, untolW);
  ok('D12d the tolerated adjacency is contained to 1,386 weeks', tolW===1386, tolW);
  ok('D12e and to zero weeks on the 50 clean calendars', tol50===0, tol50);
  ok('D12f each of the 14 pays it on all 99 of its weeks, each of the 50 on none',
     Object.keys(perCal).every(k=>perCal[k]===(F14.has(k)?99:0)),
     Object.keys(perCal).filter(k=>perCal[k]!==(F14.has(k)?99:0)).map(k=>k+'='+perCal[k]).join(' '));
  ok('D12g no lift lands on the long-run eve or the long-run day', eve===0&&longDay===0, eve+' eve / '+longDay+' day');
}

console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
