// g205_d129_tiebreak.js — D129. Two tiebreak ranks below the ruled objective, and the
// pace-family-only correction to the recovery-pads-the-long term.
//
// THE RULING (D129), transcribed:
//   * rank 6, IDENTITY — below the four ruled ranks and below canonical: if the subset
//     the even-spread fallback would have picked is among the tied layouts, it wins.
//     The athlete's live days never move on a tie.
//   * rank 7, SPREAD — among ties that do NOT contain that subset, the layout with the
//     shortest longest run-free stretch, measured circularly, wins. A metric, not a
//     constant. Identity ahead of spread is deliberate.
//   * recBeforeLong is CORRECTED FOR THE PACE FAMILY ONLY. `pos(d) < pos(longDay)` reads a
//     circular week through the Sunday-first ALL_DAYS_ORDER, so a Sunday easy run scores
//     as padding a Saturday long run — the day AFTER it. The pace arm reads
//     `d === prevDay(longDay)`. NRC KEEPS THE SHIPPED PREDICATE by ruling: correcting it
//     there moves 182/804 chooser rows and 54/112 built programs.
//   * Ranks 6 and 7 are pace-family-only. Live on the NRC arm they moved 168/804 rows,
//     against the ruling's own "NRC identical on 804/804".
//
// THE ADDENDUM (D129, same session), transcribed:
//   * rank 8, REST INTO THE LONG RUN — among layouts still tied after rank 7, the one
//     whose LAST quality session sits furthest before the long run wins. Freshest legs
//     into the week's longest run.
//   * rank 9, EARLIEST FIRST QUALITY DAY — below rank 8. Already implied by canonical;
//     made explicit so it is a rank rather than an accident.
//   * Both are pace-family-only, so NRC must not move at all: 804/804 identical.
//   * THE CLAIM UNDER PROOF CHANGED. It was "every chooser decision resolves at rank 7
//     or above". It is now about the athlete's DAYS, not his types: types may tie, days
//     may not be an artifact of loop order. Measured, the wording does not hold as
//     written — 2 of 93 rows keep a tie after rank 9 and both tie sets span two day
//     sets — so P7 below pins the measured number and asserts the surviving form of
//     coach's own reason: a tie past rank 9 has the same HARD-day placement.
//   * HOW THE TIES GO. 9 of 93 rows are still tied after rank 7. Rank 8 breaks 5,
//     rank 9 breaks 2, and 2 survive. All three counts are pinned and must sum to 9.
//     On both rows rank 9 decides, its winner is also the one enumeration order would
//     have reached first, so VOIDING rank 9 is a behavioural no-op; the sabotage
//     mutation for it inverts the term instead of voiding it.
//
// ORACLES, all independent of the engine:
//   * An EXHAUSTIVE SEARCH written in this file: every subset of training days of the
//     right size crossed with every permutation of the session types, scored by the rank
//     vector transcribed above from the ruling's prose. Duplicate layouts are collapsed.
//   * The even-spread subset is recomputed here from Math.round(k*(n-1)/(cap-1)), the
//     arithmetic the fallback chooser runs, not read back out of the engine.
//   * Mario's row is a hand table typed in as literals.
//   * The 24/93 recBeforeLong displacement count is the ruling's after-grid number.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const FILE = process.argv[2] || path.join(ROOT, 'index.html');

function grab(src, name){
  const sig='function '+name+'('; const i=src.indexOf(sig);
  if(i<0) throw new Error('not found: '+name);
  let d=0,k=src.indexOf('{',i),mode=null;
  for(;k<src.length;k++){ const c=src[k],n=src[k+1];
    if(mode==='line'){ if(c==='\n') mode=null; continue; }
    if(mode==='block'){ if(c==='*'&&n==='/'){ mode=null;k++; } continue; }
    if(mode){ if(c==='\\'){k++;continue;} if(c===mode) mode=null; continue; }
    if(c==='/'&&n==='/'){ mode='line';k++;continue; }
    if(c==='/'&&n==='*'){ mode='block';k++;continue; }
    if(c==='"'||c==="'"||c==='`'){ mode=c;continue; }
    if(c==='{') d++; else if(c==='}'){ d--; if(d===0) return src.slice(i,k+1); } }
  throw new Error('unbalanced: '+name);
}
const src = fs.readFileSync(FILE, 'utf8');
const parts = ["const ALL_DAYS_ORDER=['sun','mon','tue','wed','thu','fri','sat'];"];
['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n=>parts.push(grab(src,n)));
const ctx = {out:null};
vm.runInNewContext(parts.join('\n')+'\nout={c:_nrcSpacedRunDays,gs:getSessionTypes,gn:getNRCSessionTypes,sp:isSpeedGoal};', ctx);
const E = ctx.out;

const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const pos=d=>DAYS.indexOf(d);
const circ=(a,b)=>{const r=Math.abs(pos(a)-pos(b));return Math.min(r,7-r);};
const prevDay=d=>DAYS[(pos(d)+6)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function perms(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>perms(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }
// the even-spread fallback's own arithmetic, retyped
function evenIdx(n,cap){ const s=[]; if(cap<=1){ s.push(n-1); return s; }
  for(let k=0;k<cap;k++){ const v=Math.round(k*(n-1)/(cap-1)); if(s.indexOf(v)<0) s.push(v); } return s.sort((a,b)=>a-b); }
function longestFree(days){ const P=days.map(pos).sort((a,b)=>a-b); let lf=0;
  for(let i=0;i<P.length;i++){ const nx=(i+1<P.length)?P[i+1]:P[0]+7; const g=nx-P[i]-1; if(g>lf) lf=g; } return lf; }

const TP={long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'};
const TN={long:'nrc_long',rec:'nrc_recovery',s1:'nrc_speed1',s2:'nrc_speed2'};

// opts: {pace:bool}. NRC keeps the shipped predicate AND the two long-run pins.
function space(train, cap, types, T, pace){
  const inTrain=new Set(train), last=train[train.length-1];
  const evk=evenIdx(train.length,cap).join(','), seen={}, out=[];
  combos(train.map((d,i)=>i), cap).forEach(idxs=>{
    if(!pace && idxs[idxs.length-1]!==train.length-1) return;
    const days=idxs.map(i=>train[i]);
    perms(types).forEach(p=>{
      const typeOf={}; days.forEach((d,i)=>typeOf[d]=p[i]);
      const sig=idxs.join()+'|'+days.map(d=>typeOf[d]).join(); if(seen[sig]) return; seen[sig]=1;
      const longDay=days.find(d=>typeOf[d]===T.long);
      if(!pace && longDay && longDay!==days[days.length-1]) return;
      const HARD=[T.s1,T.s2,T.long], hd=days.filter(d=>HARD.indexOf(typeOf[d])>=0);
      let coll=0; for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++) if(circ(hd[a],hd[b])===1) coll++;
      const sar=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2).filter(d=>!inTrain.has(prevDay(d))).length;
      const rbl=longDay&&days.some(d=>typeOf[d]===T.rec&&(pace
        ? d===prevDay(longDay)
        : (circ(d,longDay)===1&&pos(d)<pos(longDay))))?1:0;
      const ll=(!longDay||longDay===last)?1:0;
      const s1=days.find(d=>typeOf[d]===T.s1), s2=days.find(d=>typeOf[d]===T.s2);
      const can=(s1&&s2&&pos(s1)<pos(s2))?1:0;
      const ruled=[-coll,ll,sar,rbl,can];
      const ident=pace&&idxs.join(',')===evk?1:0;
      const spread=pace?-longestFree(days):0;
      // ranks 8 and 9, retyped from the addendum's prose. The LAST quality session before
      // the long run is the one with the smallest backward circular distance from it;
      // rank 8 maximises that distance. Rank 9 negates the first quality day's position.
      const qd=days.filter(d=>typeOf[d]===T.s1||typeOf[d]===T.s2);
      const qr=(pace&&longDay&&qd.length)?Math.min.apply(null,qd.map(d=>(pos(longDay)-pos(d)+7)%7)):0;
      const qf=(pace&&qd.length)?-pos(qd[0]):0;
      out.push({idxs,days,typeOf,ruled,rank:ruled.concat([ident,spread,qr,qf]),ident,qr,qf,
                hard:days.filter(d=>typeOf[d]!==T.rec).map(d=>d+':'+typeOf[d]).join(' '),
                lf:longestFree(days)});
    });
  });
  return out;
}
const cmp=(a,b)=>{for(let i=0;i<a.length;i++) if(a[i]!==b[i]) return a[i]-b[i]; return 0;};
function topBy(list,key){ let b=list[0]; list.forEach(c=>{ if(cmp(c[key],b[key])>0) b=c; }); return list.filter(c=>cmp(c[key],b[key])===0); }
const lay=(t,p)=>p.idxs.map(i=>t[i].toUpperCase()+':'+p.typeOf[t[i]]).join(' ');
const engIn=(list,p,t)=>list.find(c=>c.idxs.join()===p.idxs.join()&&c.days.every(d=>c.typeOf[d]===p.typeOf[d]));

// ─────────────────────────────────────────────────────────────────────────────
// MEASURE, V205 slice 7e. Why does v205_d129.json S2 (the identity term let off
// its paceFam leash and onto the NRC arm) SURVIVE g205_d129_tiebreak.js, and
// what row closes the gap? Head spliced from the gate: same hand oracle.
// P2 asserts NRC is a MAXIMUM of the five ruled terms. Identity only reorders
// WITHIN that maximum, so P2 cannot see it. This measures the tie sets.
// ─────────────────────────────────────────────────────────────────────────────
const A2 = "        const identity = (paceFam && idxs.join(',') === _evenKey) ? 1 : 0;";
const R2 = "        const identity = (idxs.join(',') === _evenKey) ? 1 : 0;";
console.log('S2 anchor count in artifact: ' + (src.split(A2).length - 1));
let CM = null;
{ const parts = ["const ALL_DAYS_ORDER=['sun','mon','tue','wed','thu','fri','sat'];"];
  ['isSpeedGoal','getNRCSessionTypes','getSessionTypes','_nrcSpacedRunDays'].forEach(n => parts.push(grab(src.replace(A2,R2), n)));
  const c = {}; vm.runInNewContext(parts.join('\n') + '\nout={c:_nrcSpacedRunDays};', c); CM = c.out.c; }

let rows=0, moved=0, tieMulti=0, evenInTie=0, engTakesEven=0, engTakesOther=0, movedEx=[], otherEx=[];
['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
  [0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
    const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
    for(let cap=2;cap<n;cap++){
      const all=space(train,cap,E.gn(cap,g),TN,false); if(!all.length) continue;
      rows++;
      const key=g+' rest '+(rest.join('+')||'none')+' cap'+cap;
      const b=E.c(train,cap,g,false), m=CM(train,cap,g,false);
      const bk=b.idxs.join(','), mk=m.idxs.join(',');
      const bs=bk+'|'+b.idxs.map(i=>b.typeOf[train[i]]).join(','), ms=mk+'|'+m.idxs.map(i=>m.typeOf[train[i]]).join(',');
      if(bs!==ms){ moved++; if(movedEx.length<5) movedEx.push(key+' base['+bs+'] mut['+ms+']'); }
      // the five-term tie set, from the hand oracle
      const tie=topBy(all,'ruled');
      const subs={}; tie.forEach(c=>subs[c.idxs.join(',')]=1);
      const evk=evenIdx(n,cap).join(',');
      const multi=Object.keys(subs).length>1;
      if(multi) tieMulti++;
      if(multi && subs[evk]){ evenInTie++;
        if(bk===evk) engTakesEven++; else { engTakesOther++; if(otherEx.length<5) otherEx.push(key+' even='+evk+' engine='+bk); } }
    }
  }));
});
console.log('NRC rows=' + rows + '  picks that MOVE under S2: ' + moved);
console.log('  examples: ' + movedEx.join(' | '));
console.log('tie sets spanning MORE THAN ONE day set: ' + tieMulti);
console.log('  of those, the even-spread subset is IN the tie set: ' + evenInTie);
console.log('    engine takes the even-spread subset : ' + engTakesEven);
console.log('    engine takes ANOTHER subset        : ' + engTakesOther + '  <- impossible if identity scored on NRC');
console.log('    examples: ' + otherEx.join(' | '));
