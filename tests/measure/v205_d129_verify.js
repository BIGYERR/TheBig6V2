// v205_d129_verify.js — slice-4 verification for D129.
// Independent exhaustive oracle (written here, no engine code) + engine extraction
// from BOTH the slice-3 baseline and the slice-4 artifact.
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=path.join(__dirname,'..','..');
const NEW=process.argv[2]||path.join(ROOT,'index.html');
const OLD=process.argv[3]||'/tmp/base_V205_slice4.html';

function grab(src,name){
  const sig='function '+name+'('; const i=src.indexOf(sig); if(i<0) throw new Error('not found: '+name);
  let j=src.indexOf('{',i),d=0,k=j,mode=null;
  for(;k<src.length;k++){ const c=src[k],n=src[k+1];
    if(mode==='line'){ if(c==='\n') mode=null; continue; }
    if(mode==='block'){ if(c==='*'&&n==='/'){ mode=null;k++; } continue; }
    if(mode){ if(c==='\\'){k++;continue;} if(c===mode) mode=null; continue; }
    if(c==='/'&&n==='/'){ mode='line';k++;continue; }
    if(c==='/'&&n==='*'){ mode='block';k++;continue; }
    if(c==='"'||c==="'"||c==='`'){ mode=c; continue; }
    if(c==='{') d++; else if(c==='}'){ d--; if(d===0) return src.slice(i,k+1); } }
  throw new Error('unbalanced: '+name);
}
function chooserOf(file){
  const src=fs.readFileSync(file,'utf8');
  const parts=["const ALL_DAYS_ORDER=['sun','mon','tue','wed','thu','fri','sat'];"];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(src,n)));
  const ctx={out:null};
  vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes,gn:getNRCSessionTypes};',ctx);
  return ctx.out;
}
const N=chooserOf(NEW), O=chooserOf(OLD);

const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const pos=d=>DAYS.indexOf(d);
const circ=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevDay=d=>DAYS[(pos(d)+6)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }
function evenIdx(n,cap){ const s=[]; if(cap<=1){ s.push(n-1); } else for(let k=0;k<cap;k++){ const v=Math.round(k*(n-1)/(cap-1)); if(s.indexOf(v)<0) s.push(v); } return s.sort((a,b)=>a-b); }

const TP={long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'};
const TN={long:'nrc_long',rec:'nrc_recovery',s1:'nrc_speed1',s2:'nrc_speed2'};

// ORACLE. opts: {pinned, terms:5|7, recFix:bool}
function space(train,cap,types,T,opts){
  const inTrain=new Set(train), last=train[train.length-1], out=[];
  const ev=evenIdx(train.length,cap).join(',');
  combos(train.map((d,i)=>i),cap).forEach(idxs=>{
    const days=idxs.map(i=>train[i]);
    if(opts.pinned && idxs[idxs.length-1]!==train.length-1) return;
    perms(types).forEach(p=>{
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const longDay=days.find(d=>typeOf[d]===T.long);
      if(opts.pinned && longDay && longDay!==days[days.length-1]) return;
      const HARD=[T.s1,T.s2,T.long];
      const hd=days.filter(d=>HARD.indexOf(typeOf[d])>=0);
      let coll=0; for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      const sp=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
      const sar=sp.filter(d=>!inTrain.has(prevDay(d))).length;
      const rbl=longDay&&days.some(d=>typeOf[d]===T.rec&&(opts.recFix? d===prevDay(longDay) : (circ(d,longDay)===1&&pos(d)<pos(longDay))))?1:0;
      const ll=(!longDay||longDay===last)?1:0;
      const s1=days.find(d=>typeOf[d]===T.s1), s2=days.find(d=>typeOf[d]===T.s2);
      const can=(s1&&s2&&pos(s1)<pos(s2))?1:0;
      const ident=(idxs.join(',')===ev)?1:0;
      const P=days.map(pos).sort((a,b)=>a-b); let lf=0;
      for(let i=0;i<P.length;i++){ const nx=(i+1<P.length)?P[i+1]:P[0]+7; const g=nx-P[i]-1; if(g>lf) lf=g; }
      const rank=opts.terms===7?[-coll,ll,sar,rbl,can,ident,-lf]:[-coll,ll,sar,rbl,can];
      out.push({idxs,days,typeOf,rank,coll});
    });
  });
  return out;
}
const cmp=(a,b)=>{for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i]; return 0;};
function argmax(list){ let b=list[0],ties=1; for(let i=1;i<list.length;i++){ const c=cmp(list[i].rank,b.rank); if(c>0){b=list[i];ties=1;} else if(c===0) ties++; } return {best:b,ties}; }
const lay=(train,p)=>p.idxs.map(i=>train[i].toUpperCase()+':'+p.typeOf[train[i]]).join(' ');

let PASS=0,FAIL=0;
const ok=(c,msg)=>{ if(c){PASS++;} else {FAIL++; console.log('  FAIL: '+msg);} };

// Routed pace rows: cap3 (n>=4) and cap4 (n>=5)
const rows=[];
[0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
  [3,4].forEach(cap=>{ if(n>cap && cap>=2) rows.push({rest:rest.join('+')||'none',train,n,cap}); });
}));
console.log('routed pace rows (cap3+cap4, n>cap): '+rows.length);

// ── A. cap-3 movers vs even-spread incumbent ────────────────────────────────
function oldLayout(train,cap,types){
  const idxs=evenIdx(train.length,cap);
  return idxs.map((i,s)=>train[i].toUpperCase()+':'+(s===idxs.length-1?'lsd_long':types[s])).join(' ');
}
let mvNew=0,mvOld=0,dayMvNew=0,dayMvOld=0,worse=0,better=0,same=0,tot3=0;
const c3=rows.filter(r=>r.cap===3);
c3.forEach(r=>{
  tot3++;
  const types=N.gs(3,true,false,false);
  const ev=evenIdx(r.n,3);
  const pN=N.c(r.train,3,'run_pace_goal',true), pO=O.c(r.train,3,'run_pace_goal',true);
  const base=oldLayout(r.train,3,types);
  if(lay(r.train,pN)!==base) mvNew++;
  if(lay(r.train,pO)!==base) mvOld++;
  if(pN.idxs.join()!==ev.join()) dayMvNew++;
  if(pO.idxs.join()!==ev.join()) dayMvOld++;
  // rank-improving vs the incumbent even-spread layout, on the NEW 5 ruled terms
  const all=space(r.train,3,types,TP,{pinned:false,terms:7,recFix:true});
  const inc=all.find(c=>c.idxs.join()===ev.join() && ev.every((i,s)=>c.typeOf[r.train[i]]===(s===ev.length-1?'lsd_long':types[s])));
  const got=all.find(c=>c.idxs.join()===pN.idxs.join() && c.days.every(d=>c.typeOf[d]===pN.typeOf[d]));
  if(inc&&got){ const d=cmp(got.rank.slice(0,5),inc.rank.slice(0,5)); if(d<0){worse++;console.log('  WORSE: rest '+r.rest);} else if(d>0) better++; else same++; }
});
console.log('=== A. cap-3, '+tot3+' calendars ===');
console.log('  layout movers vs even-spread incumbent: OLD(slice3) '+mvOld+'  NEW(slice4) '+mvNew);
console.log('  day-SET movers:                          OLD(slice3) '+dayMvOld+'  NEW(slice4) '+dayMvNew);
console.log('  vs incumbent on the 5 ruled terms: better '+better+', equal '+same+', WORSE '+worse);
ok(worse===0,'some cap-3 pick is rank-worse than the even-spread incumbent');
ok(mvNew===32,'expected 32 cap-3 layout movers, got '+mvNew);

// ── B. the ten named tie calendars keep today's days ────────────────────────
const TIE=['none','thu','fri','mon+wed','wed+thu','thu+fri','sun+wed+fri','mon+wed+fri','tue+thu+sat','wed+thu+fri'];
console.log('=== B. ten named tie calendars, cap 3 ===');
TIE.forEach(name=>{
  const rest=name==='none'?[]:name.split('+');
  const train=DAYS.filter(d=>rest.indexOf(d)<0);
  const ev=evenIdx(train.length,3), p=N.c(train,3,'run_pace_goal',true);
  const keep=p.idxs.join()===ev.join();
  console.log('  '+name.padEnd(12)+' today '+ev.map(i=>train[i]).join(',')+'  now '+p.idxs.map(i=>train[i]).join(',')+'  '+(keep?'KEEP':'MOVED'));
  ok(keep,name+' moved off today\'s days');
});

// ── C. rank 7 or above decides: unique argmax on every routed row ──────────
console.log('=== C. enumeration order never decides ===');
let deep=0, worstTies=0;
rows.forEach(r=>{
  const types=N.gs(r.cap,true,false,false);
  const all=space(r.train,r.cap,types,TP,{pinned:false,terms:7,recFix:true});
  const {best,ties}=argmax(all);
  if(ties!==1){ deep++; if(deep<6) console.log('  UNRESOLVED at rank 7: rest '+r.rest+' cap'+r.cap+' ties='+ties); }
  if(ties>worstTies) worstTies=ties;
  const p=N.c(r.train,r.cap,'run_pace_goal',true);
  const got=all.find(c=>c.idxs.join()===p.idxs.join()&&c.days.every(d=>c.typeOf[d]===p.typeOf[d]));
  ok(!!got && cmp(got.rank,best.rank)===0,'engine not lex-optimal at rest '+r.rest+' cap'+r.cap);
});
console.log('  rows resolving at rank 7 or above: '+(rows.length-deep)+'/'+rows.length+' (max tie multiplicity '+worstTies+')');
ok(deep===0,deep+' rows fall through rank 7 to enumeration order');

// ── D. NRC invariance, old vs new, 4 goals x calendars x caps ──────────────
let nd=0,nt=0;
['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
  [0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
    const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
    for(let cap=2;cap<n;cap++){ nt++;
      const a=O.c(train,cap,g,false), b=N.c(train,cap,g,false);
      if(JSON.stringify(a.idxs)!==JSON.stringify(b.idxs)||JSON.stringify(a.typeOf)!==JSON.stringify(b.typeOf)){
        nd++; if(nd<6) console.log('  NRC DIFF '+g+' rest '+(rest.join('+')||'none')+' cap'+cap+' '+JSON.stringify(a.typeOf)+' -> '+JSON.stringify(b.typeOf)); }
    }
  }));
});
console.log('=== D. NRC ===');
console.log('  identical old-vs-new on '+(nt-nd)+'/'+nt);
ok(nd===0,nd+' NRC rows moved');

// ── E. cap-4 coll=0 table, 64 calendars ────────────────────────────────────
let z=0,t=0;
[0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  const train=DAYS.filter(d=>rest.indexOf(d)<0); if(train.length<4) return; t++;
  const all=space(train,4,N.gs(4,true,false,false),TP,{pinned:false,terms:7,recFix:true});
  if(Math.min.apply(null,all.map(c=>c.coll))===0) z++;
}));
console.log('=== E. cap-4 collision-free: '+z+'/'+t+' ===');
ok(z===50&&t===64,'expected 50/64, got '+z+'/'+t);

// ── F. recBeforeLong correction in isolation: pace rows that move ──────────
let rfMoved=0;
rows.forEach(r=>{
  const types=N.gs(r.cap,true,false,false);
  const a=argmax(space(r.train,r.cap,types,TP,{pinned:false,terms:5,recFix:false})).best;
  const b=argmax(space(r.train,r.cap,types,TP,{pinned:false,terms:5,recFix:true})).best;
  if(a.idxs.join()!==b.idxs.join()||a.days.some(d=>a.typeOf[d]!==b.typeOf[d])) rfMoved++;
});
console.log('=== F. recBeforeLong correction alone (5 terms, oracle): '+rfMoved+'/'+rows.length+' pace rows move ===');

// ── G. Mario ───────────────────────────────────────────────────────────────
{
  const train=DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const p=N.c(train,4,'run_pace_goal',true);
  const all=space(train,4,N.gs(4,true,false,false),TP,{pinned:false,terms:7,recFix:true});
  const g=all.find(c=>c.idxs.join()===p.idxs.join()&&c.days.every(d=>c.typeOf[d]===p.typeOf[d]));
  const pOld=O.c(train,4,'run_pace_goal',true);
  console.log('=== G. Mario, rest sun+wed, cap 4 ===');
  console.log('  slice3 '+lay(train,pOld));
  console.log('  slice4 '+lay(train,p)+'  rank='+g.rank.join(','));
  ok(lay(train,p)===lay(train,pOld),'Mario\'s layout moved');
  ok(g.rank.slice(0,5).join(',')==='0,1,2,1,1','Mario rank != 0,1,2,1,1');
}

console.log('PASS '+PASS+' FAIL '+FAIL);
