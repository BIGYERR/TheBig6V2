// v205_d130_typed_adjacency.js — measure pass for D130 (typed hard-day adjacency).
//
//   node tests/measure/v205_d130_typed_adjacency.js [index.html]
//
// Six questions, one script:
//   Q1 the 14 four-day fallback calendars at four runs under the SPLIT rank-1
//   Q2 coach's two-shape taxonomy of those 14
//   Q3 the other 50 calendars cannot move
//   Q4 D127 axial placement on the 14 at four runs
//   Q5 the long-run eve across all 64 at four runs (counterfactual build)
//   Q6 Mario
//
// ORACLE INDEPENDENCE. Adjacency, the untolerated/tolerated split, the shape taxonomy and
// the axial cost arithmetic are all re-derived HERE from the authoring contract (the D130
// brief, the D127 cost table in the source comment at index.html:6707-6710) over a
// hand-written circular week. The engine's own chooser is loaded only as the THING BEING
// COMPARED in Q3/Q6, never as the source of an expected value.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const HTML = process.argv[2] || path.join(ROOT, 'index.html');
const SCRATCH = process.env.SCRATCH || '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/1db5e723-d366-4a95-870d-30d83a70cafc/scratchpad';

// ── hand-written circular week ────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const pos  = d => DAYS.indexOf(d);
const circ = (a,b)=>{ const r=Math.abs(pos(a)-pos(b)); return Math.min(r,7-r); };
const prevD = d => DAYS[(pos(d)+6)%7];
const nextD = d => DAYS[(pos(d)+1)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }

const T = {long:'lsd_long', rec:'lsd_easy', s1:'int', s2:'chi'};
const HARD = new Set([T.s1,T.s2,T.long]);
const TYPES4 = ['lsd_easy','int','chi','lsd_long'];   // NSW Table: 4 days = easy/INT/CHI/long

// ── THE SPLIT (D130), written from the brief, not from any function ───────────
// tolerated  : CHI immediately before the long LSD.
// untolerated: every other hard pair on adjacent days — INT|CHI, INT|long either way,
//              and CHI on the day AFTER the long.
function score(days, typeOf){
  const long = days.find(d=>typeOf[d]===T.long);
  const hd = days.filter(d=>HARD.has(typeOf[d]));
  let untol=0, tol=0, coll=0, pairs=[];
  for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++){
    if(circ(hd[a],hd[b])!==1) continue;
    coll++;
    const x=hd[a], y=hd[b];
    const chiEve = long && ((typeOf[x]===T.s2 && y===long && x===prevD(long))
                         || (typeOf[y]===T.s2 && x===long && y===prevD(long)));
    if(chiEve){ tol++; pairs.push('TOL:'+typeOf[x]+'@'+x+'|'+typeOf[y]+'@'+y); }
    else { untol++; pairs.push('UNT:'+typeOf[x]+'@'+x+'|'+typeOf[y]+'@'+y); }
  }
  return {untol, tol, coll, pairs};
}

// ── ranks 2..9, transcribed from the authoring contract comments ──────────────
function rankOf(train, idxs, typeOf, evenKey, split){
  const days = idxs.map(i=>train[i]);
  const inTrain = new Set(train), n = train.length;
  const s = score(days, typeOf);
  const long = days.find(d=>typeOf[d]===T.long);
  const speeds = days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  const speedsAfterRest = speeds.filter(d=>!inTrain.has(prevD(d))).length;
  const recBeforeLong = long && days.some(d=>typeOf[d]===T.rec && d===prevD(long)) ? 1 : 0;
  const longLast = (!long || long===train[n-1]) ? 1 : 0;
  const s1 = days.find(d=>typeOf[d]===T.s1), s2 = days.find(d=>typeOf[d]===T.s2);
  const canonical = (s1&&s2&&pos(s1)<pos(s2)) ? 1 : 0;
  const identity = (idxs.join(',')===evenKey) ? 1 : 0;
  const p = days.map(pos).sort((a,b)=>a-b);
  let lf=0; for(let i=0;i<p.length;i++){ const nx=(i+1<p.length)?p[i+1]:p[0]+7; const g=nx-p[i]-1; if(g>lf) lf=g; }
  const spread = -lf;
  let qr=0; if(long){ let near=7; days.forEach(d=>{ if(typeOf[d]!==T.s1&&typeOf[d]!==T.s2) return; const b=(pos(long)-pos(d)+7)%7; if(b<near) near=b; }); if(near<7) qr=near; }
  const fq = days.find(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
  const qualFirst = fq ? -pos(fq) : 0;
  const head = split ? [-s.untol, -s.tol] : [-s.coll];
  return {key: head.concat([longLast, speedsAfterRest, recBeforeLong, canonical, identity, spread, qr, qualFirst]), s, days, typeOf, idxs};
}
const cmp=(a,b)=>{ for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i]; return 0; };

function evenKeyFor(n, cap){ const s=new Set(); if(cap<=1) s.add(n-1); else for(let k=0;k<cap;k++) s.add(Math.round(k*(n-1)/(cap-1))); return Array.from(s).sort((a,b)=>a-b).join(','); }
function bestFor(train, cap, split){
  const n = train.length, ek = evenKeyFor(n, cap);
  let best=null;
  combos([...Array(n).keys()], cap).forEach(idxs => {
    const days = idxs.map(i=>train[i]);
    perms(TYPES4).forEach(p => {
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const c = rankOf(train, idxs, typeOf, ek, split);
      if(!best || cmp(c.key,best.key)>0) best=c;
    });
  });
  return best;
}
const lay = c => c.days.map(d=>d.toUpperCase()+':'+c.typeOf[d]).join(' ');

// ── the engine's chooser, by source surgery (Q3/Q6 comparison only) ───────────
function grab(src,name){ const sig='function '+name+'('; const i=src.indexOf(sig); if(i<0) throw new Error('not found '+name);
  let j=src.indexOf('{',i), d=0, k=j, m=null;
  for(;k<src.length;k++){ const c=src[k], nx=src[k+1];
    if(m==='line'){ if(c==='\n') m=null; continue; }
    if(m==='block'){ if(c==='*'&&nx==='/'){ m=null; k++; } continue; }
    if(m){ if(c==='\\'){k++;continue;} if(c===m) m=null; continue; }
    if(c==='/'&&nx==='/'){ m='line'; k++; continue; }
    if(c==='/'&&nx==='*'){ m='block'; k++; continue; }
    if(c==='"'||c==="'"||c==='`'){ m=c; continue; }
    if(c==='{') d++; else if(c==='}'){ d--; if(d===0) return src.slice(i,k+1); } }
  throw new Error('unbalanced '+name); }
const SRC = fs.readFileSync(HTML,'utf8');
const parts = ['const ALL_DAYS_ORDER='+JSON.stringify(DAYS)+';'];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(SRC,n)));
const ctx={out:null}; vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes};',ctx);
const ENG = ctx.out;
const engLay = (train,p) => p.idxs.map(i=>train[i].toUpperCase()+':'+p.typeOf[train[i]]).join(' ');

// sanity: the type roster this script permutes must be the roster the engine uses at 4
const engTypes = ENG.gs(4,true,false,false);
console.log('SANITY  getSessionTypes(4,speed) = ['+engTypes.join(',')+']  oracle roster = ['+TYPES4.join(',')+']  MATCH='+
  (engTypes.slice().sort().join()===TYPES4.slice().sort().join()));

// ── the 14 ────────────────────────────────────────────────────────────────────
const FOURTEEN = ['sun,mon,tue','sun,mon,thu','sun,mon,sat','sun,wed,thu','sun,wed,sat','sun,fri,sat',
 'mon,tue,wed','mon,tue,fri','mon,thu,fri','tue,wed,thu','tue,wed,sat','tue,fri,sat','wed,thu,fri','thu,fri,sat'];

// Q0 — confirm these 14 really are the coll>0 losers at cap 4 under the UNSPLIT objective
{
  const losers=[];
  combos(DAYS,3).forEach(rest=>{ const train=DAYS.filter(d=>rest.indexOf(d)<0);
    const b=bestFor(train,4,false); if(b.s.coll>0) losers.push(rest.join(',')); });
  console.log('\nQ0  unsplit coll>0 at cap 4, over C(7,3)=35 four-day calendars: '+losers.length+'/35');
  console.log('    set matches the briefed 14: '+(losers.slice().sort().join('|')===FOURTEEN.slice().sort().join('|')));
  if(losers.slice().sort().join('|')!==FOURTEEN.slice().sort().join('|')) console.log('    got: '+losers.join(' · '));
}

// ── Q1 ────────────────────────────────────────────────────────────────────────
console.log('\n=== Q1  THE 14 AT FOUR RUNS, SPLIT RANK 1 (untolerated, tolerated) ===');
let z14=0, tol0=0;
const q1 = {};
FOURTEEN.forEach(r=>{
  const rest=r.split(','), train=DAYS.filter(d=>rest.indexOf(d)<0);
  const b=bestFor(train,4,true);
  q1[r]={train,b};
  if(b.s.untol===0) z14++;
  if(b.s.untol===0&&b.s.tol===0) tol0++;
  console.log('  rest '+r.padEnd(13)+' ('+b.s.untol+','+b.s.tol+')  '+lay(b).padEnd(52)+
    (b.s.pairs.length?'  '+b.s.pairs.join(' '):''));
});
console.log('  untolerated==0 : '+z14+'/14      (untol,tol)==(0,0) : '+tol0+'/14');

// ── Q2 taxonomy ───────────────────────────────────────────────────────────────
console.log('\n=== Q2  TAXONOMY OF THE 14 (circular run-lengths of the TRAINING days) ===');
function shapeOf(train){
  const set=new Set(train), runs=[];
  DAYS.forEach(d=>{ if(set.has(d)&&!set.has(prevD(d))){ let n=0,c=d; while(set.has(c)){n++;c=nextD(c);} runs.push(n); } });
  if(!runs.length && train.length===7) runs.push(7);
  return runs.sort((a,b)=>b-a);
}
const tax={};
FOURTEEN.forEach(r=>{ const k=shapeOf(q1[r].train).join('+'); (tax[k]=tax[k]||[]).push(r); });
Object.keys(tax).sort().forEach(k=>{
  const name = k==='4' ? 'four-consecutive-day BLOCK' : k==='2+2' ? 'two ADJACENT PAIRS' : 'other ('+k+')';
  console.log('  ['+k+'] '+name+'  n='+tax[k].length);
  tax[k].forEach(r=>console.log('        rest '+r.padEnd(13)+' train '+q1[r].train.join(',')));
});
console.log('  coach claims exactly 7 blocks + 7 pairs: '+
  ((tax['4']||[]).length===7 && (tax['2+2']||[]).length===7 && Object.keys(tax).length===2 ? 'CONFIRMED' : 'REFUTED'));

// ── Q3 the other 50 ───────────────────────────────────────────────────────────
console.log('\n=== Q3  THE OTHER 50 CALENDARS AT CAP 4 ===');
let n50=0, best00=0, same=0, diffs=[];
[0,1,2,3].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  if(nr===3 && FOURTEEN.indexOf(rest.join(','))>=0) return;
  const train=DAYS.filter(d=>rest.indexOf(d)<0); if(train.length<4) return;
  n50++;
  const sp=bestFor(train,4,true), un=bestFor(train,4,false);
  if(sp.s.untol===0&&sp.s.tol===0) best00++;
  const eng=ENG.c(train,4,'run_pace_goal',true);
  const a=lay(sp), e=engLay(train,eng);
  if(a===e) same++; else diffs.push('    rest '+(rest.join(',')||'(none)').padEnd(13)+' SPLIT '+a+'   ENGINE '+e+'  engColl='+eng.coll);
}));
console.log('  calendars: '+n50+'   best pair ==(0,0): '+best00+'/'+n50);
console.log('  split-rank winner identical to slice-6 engine layout: '+same+'/'+n50);
diffs.forEach(d=>console.log(d));

// ── Q4 D127 placement on the 14 at four runs ──────────────────────────────────
// Cost table re-derived from the source comment (index.html:6707-6710), not called.
console.log('\n=== Q4  D127 AXIAL PLACEMENT ON THE 14, FOUR RUNS ===');
function legCost(shape, role, d){
  if(shape.forbidden.has(d)) return Infinity;
  let c=0;
  if(shape.speed.has(d)) c += role==='pull'?0.5:1.5;
  if(shape.easy.has(d))  c += 1;
  if(shape.speed.has(prevD(d))) c += 1;
  if(shape.speed.has(nextD(d))) c += 2;
  if(d===shape.after) c += 2;
  return c;
}
let legal=0, hingeOnInt=0, legsOnEasy=0;
FOURTEEN.forEach(r=>{
  const {train,b}=q1[r];
  const long=b.days.find(d=>b.typeOf[d]===T.long);
  const shape={long, eve:prevD(long), after:nextD(long),
    speed:new Set(b.days.filter(d=>b.typeOf[d]===T.s1||b.typeOf[d]===T.s2)),
    easy:new Set(b.days.filter(d=>b.typeOf[d]===T.rec)),
    forbidden:new Set([long, prevD(long)])};
  let bp=null;
  train.forEach(p=>train.forEach(l=>{ if(p===l) return;
    const c=legCost(shape,'pull',p)+legCost(shape,'legs',l); if(!isFinite(c)) return;
    const sp=circ(p,l);
    if(!bp||c<bp.c||(c===bp.c&&sp>bp.sp)||(c===bp.c&&sp===bp.sp&&pos(l)<pos(bp.l))) bp={c,sp,p,l};
  }));
  if(!bp){ console.log('  rest '+r.padEnd(13)+' NO LEGAL (pull,legs) PAIR'); return; }
  legal++;
  const intD=b.days.find(d=>b.typeOf[d]===T.s1), easyD=b.days.find(d=>b.typeOf[d]===T.rec);
  if(bp.p===intD) hingeOnInt++;
  if(bp.l===easyD) legsOnEasy++;
  console.log('  rest '+r.padEnd(13)+' pull->'+bp.p.toUpperCase()+' ('+legCost(shape,'pull',bp.p)+')  legs->'+bp.l.toUpperCase()+' ('+legCost(shape,'legs',bp.l)+
    ')  total '+bp.c+'   eve='+shape.eve.toUpperCase()+'('+b.typeOf[shape.eve]+')  hingeOnINT='+(bp.p===intD)+' legsOnEASY='+(bp.l===easyD));
});
console.log('  legal placement exists: '+legal+'/14   hinge on the INT day: '+hingeOnInt+'/14   legs on the easy day: '+legsOnEasy+'/14');

// ── Q5 the eve across all 64, four runs everywhere (counterfactual build) ─────
console.log('\n=== Q5  LONG-RUN EVE, ALL 64 CALENDARS, FOUR RUNS EVERYWHERE ===');
function patch(){
  let s = SRC;
  const A = `        let coll = 0;
        for(let a=0;a<hardDays.length;a++) for(let b=a+1;b<hardDays.length;b++)
          if(circ(hardDays[a],hardDays[b])===1) coll++;`;
  const A2 = `        let coll = 0, _untol = 0, _tol = 0;
        const _lgD = days.find(d=>typeOf[d]===T.long);
        for(let a=0;a<hardDays.length;a++) for(let b=a+1;b<hardDays.length;b++)
          if(circ(hardDays[a],hardDays[b])===1){ coll++;
            const _x=hardDays[a], _y=hardDays[b];
            const _tolp = _lgD && ((typeOf[_x]===T.s2 && _y===_lgD && _x===prevDay(_lgD))
                                || (typeOf[_y]===T.s2 && _x===_lgD && _y===prevDay(_lgD)));
            if(_tolp) _tol++; else _untol++; }`;
  const B = 'const cand = {idxs, typeOf, coll,';
  const B2 = 'const cand = {idxs, typeOf, coll, _untol, _tol,';
  const C = 'const _rank = c => [-c.coll, c.longLast,';
  const C2 = 'const _rank = c => [-(c._untol||0), -(c._tol||0), c.longLast,';
  const D = 'if(_paceCapped && capDays > 3 && (!_pick || _pick.coll > 0)){';
  const D2 = 'if(_paceCapped && capDays > 3 && (!_pick || (_pick._untol||0) > 0)){';
  [[A,A2],[B,B2],[C,C2],[D,D2]].forEach(([from,to],i)=>{
    const n = s.split(from).length-1;
    if(n!==1) throw new Error('anchor '+i+' count=='+n+' (need 1)');
    s = s.replace(from,to);
  });
  return s;
}
let patched;
try { patched = patch(); } catch(e){ console.log('  PATCH FAILED: '+e.message+' — Q5 NOT MEASURED'); }
if(patched){
  const OUT = path.join(SCRATCH,'v205_d130_cf.html');
  try{ fs.unlinkSync(OUT); }catch(e){}
  fs.writeFileSync(OUT, patched);
  const { load } = require(path.join(ROOT,'tests','harness.js'));
  const IA = load(OUT);
  const ISO = IA._ISO_ORDER;
  const PULL='Posterior Chain', LEGS='Leg Strength + Mobility';
  const SEEDS=[1001,2002,3003,4004,5005,6006,7007,8008,9009];
  const cfgFor=(rest,seed)=>({ name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10',
      targetSecs:'0', mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed });
  let weeks=0, withLong=0, eveHits=0, longDayHits=0, untolWeeks=0, tolWeeks=0;
  const runDayHist={}; const byN={}; const ex=[];
  [3,2,1,0].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
    const nTrain=7-nr; byN[nTrain]=byN[nTrain]||{w:0,l:0,h:0,r4:0};
    SEEDS.forEach(seed=>{
      const prog=IA.buildProgram(cfgFor(rest,seed));
      Object.keys(prog.weeks).forEach(wk=>{
        const w=prog.weeks[wk]; let long=null; const runs=[]; const typeByDay={};
        DAYS.forEach(d=>{ const day=w[d]; if(!day||!day.cardio) return;
          const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio];
          cs.forEach(c=>{ if(c.type!=='run') return; runs.push(d);
            const st=c.subtype||'';
            if(/^Interval \(INT\)/.test(st)) typeByDay[d]='int';
            else if(/^Continuous High Intensity \(CHI\)/.test(st)) typeByDay[d]='chi';
            else if(c.legLoad){ typeByDay[d]='lsd_long'; long=d; }
            else typeByDay[d]='lsd_easy'; }); });
        weeks++; byN[nTrain].w++;
        runDayHist[runs.length]=(runDayHist[runs.length]||0)+1;
        if(runs.length===4) byN[nTrain].r4++;
        if(!long) return;
        withLong++; byN[nTrain].l++;
        const s=score(runs, typeByDay);
        if(s.untol>0) untolWeeks++;
        if(s.tol>0) tolWeeks++;
        const eve=ISO[(ISO.indexOf(long)+6)%7];
        const t=(w[eve]&&w[eve].title)||'';
        if(t===PULL||t===LEGS){ eveHits++; byN[nTrain].h++;
          if(ex.length<8) ex.push('    '+nTrain+'d rest=['+rest.join(',')+'] seed='+seed+' W'+wk+' long='+long+' eve='+eve+' -> '+t); }
        const tl=(w[long]&&w[long].title)||'';
        if(tl===PULL||tl===LEGS) longDayHits++;
      });
    });
  }));
  console.log('  counterfactual artifact: '+OUT+'  (ceiling keyed on untolerated; rank 1 split)');
  console.log('  run-days-per-week histogram over '+weeks+' weeks: '+JSON.stringify(runDayHist));
  console.log('  weeks carrying a long run: '+withLong+'/'+weeks);
  console.log('  PULL or LEGS on the long-run EVE: '+eveHits+'/'+withLong+' weeks with a long run');
  console.log('  PULL or LEGS on the long-run DAY: '+longDayHits+'/'+withLong);
  console.log('  weeks with an UNTOLERATED hard adjacency: '+untolWeeks+'/'+withLong);
  console.log('  weeks with a TOLERATED (CHI-on-eve) adjacency: '+tolWeeks+'/'+withLong);
  [4,5,6,7].forEach(n=>{ const b=byN[n]; if(b) console.log('    '+n+' training days: eve '+b.h+'/'+b.l+' long-run weeks; 4-run weeks '+b.r4+'/'+b.w); });
  ex.forEach(e=>console.log(e));
}

// ── Q6 Mario ──────────────────────────────────────────────────────────────────
console.log('\n=== Q6  MARIO (rest SUN+WED, cap 4) ===');
{
  const train=DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const b=bestFor(train,4,true);
  const eng=ENG.c(train,4,'run_pace_goal',true);
  console.log('  split-rank winner : '+lay(b)+'   (untol,tol)=('+b.s.untol+','+b.s.tol+')');
  console.log('  slice-6 engine    : '+engLay(train,eng)+'   coll='+eng.coll);
  const want='MON:int THU:chi FRI:lsd_easy SAT:lsd_long';
  console.log('  coach\'s expected  : '+want);
  console.log('  MATCH split-rank='+(lay(b)===want)+'  MATCH engine='+(engLay(train,eng)===want)+'  pair(0,0)='+(b.s.untol===0&&b.s.tol===0));
}

// ── Q1b  coach's two worked examples, scored against the split rank ───────────
console.log('\n=== Q1b  COACH\'S WORKED EXAMPLES ===');
const NAMES=['-untol','-tol','longLast','speedAfterRest','recBeforeLong','canonical','identity','spread','qualRest','qualFirst'];
[['sun,wed,sat',{mon:'int',tue:'lsd_easy',thu:'chi',fri:'lsd_long'}],
 ['mon,tue,wed',{thu:'int',fri:'lsd_easy',sat:'chi',sun:'lsd_long'}]].forEach(([r,typeOf])=>{
  const train=DAYS.filter(d=>r.split(',').indexOf(d)<0);
  const idxs=train.map((d,i)=>i);
  const c=rankOf(train, idxs, typeOf, evenKeyFor(train.length,4), true);
  const w=q1[r].b;
  console.log('  rest '+r);
  console.log('    coach   '+lay(c)+'  ('+c.s.untol+','+c.s.tol+')  rank '+c.key.join(','));
  console.log('    winner  '+lay(w)+'  ('+w.s.untol+','+w.s.tol+')  rank '+w.key.join(','));
  if(lay(c)===lay(w)){ console.log('    IDENTICAL'); return; }
  for(let i=0;i<c.key.length;i++) if(c.key[i]!==w.key[i]){ console.log('    diverge at rank '+(i+1)+' ('+NAMES[i]+'): coach '+c.key[i]+' vs winner '+w.key[i]); break; }
 });
