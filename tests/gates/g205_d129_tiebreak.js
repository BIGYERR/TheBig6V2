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

// ── ERA PREDICATE (standing ruling 2: a licence is a predicate, never prose) ──
// D129 ships at ia-version 205. AT 205 AND ABOVE the tiebreak surface must be present,
// and its absence is a NAMED FAIL, never a skip: an old artifact stamped 205 still fails
// loudly here. Below 205 with the surface absent the gate is NOT APPLICABLE and skips
// clean. Below 205 WITH the surface present is the pre-bump working artifact and every
// row RUNS. The probe reads code with comments stripped, so the V205 comment blocks that
// name D129 cannot stand in for the terms themselves: _evenKey is rank 6's key and
// qualRest/qualFirst are ranks 8 and 9 in the candidate record.
const VER = parseInt((src.match(/name="ia-version" content="(\d+)"/) || [])[1], 10);
const _codeOnly = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
const HAS_D129 = /_evenKey/.test(_codeOnly) && /qualRest\s*,\s*qualFirst/.test(_codeOnly);
if(VER >= 205){
  if(!HAS_D129){
    console.log('FAIL P0 licence: ia-version ' + VER + ' is D129 era but the tiebreak surface (_evenKey, qualRest, qualFirst) is absent');
    console.log('PASS 0 FAIL 1');
    process.exit(1);
  }
  console.log('P0 licence: ia-version ' + VER + ' carries the D129 tiebreak surface');
} else if(!HAS_D129){
  console.log('SKIP g205_d129_tiebreak: ia-version ' + VER + ' predates D129 (NOT APPLICABLE)');
  console.log('PASS 0 FAIL 0');
  process.exit(0);
} else {
  console.log('NOTE ia-version ' + VER + ' with the D129 surface present: pre-bump working artifact, rows RUN');
}
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
// V213 (D113a) ERA ROWS (standing ruling 4) for the rows that score the lifted chooser (P1, P1b,
// P3, P4). Through 212 the three-run type set is the engine's own table read, as it always was.
// From 213 it is typed: INT / CHI / long, and where no layout of those three on the row's days
// avoids an untolerated pair under D130 (CHI on the eve of the long is the one tolerated pair),
// the spacer fallback's easy / INT / long. P6 and P7 pin D129's after-grid on the type set D129
// was ruled on and read no engine pick, so they keep the engine-table read at every version.
const PACE3_BY_ERA=[{hi:212,three:null},{lo:213,three:['int','chi','lsd_long'],fallback:['lsd_easy','int','lsd_long']}];
const PACE3=PACE3_BY_ERA.filter(r=>(r.lo===undefined||VER>=r.lo)&&(r.hi===undefined||VER<=r.hi))[0];
function d130untol(days,typeOf){
  const hd=days.filter(d=>['int','chi','lsd_long'].indexOf(typeOf[d])>=0), L=days.find(d=>typeOf[d]==='lsd_long'); let u=0;
  for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++){ const x=hd[a],y=hd[b]; if(circ(x,y)!==1) continue;
    const tol=!!L&&((typeOf[x]==='chi'&&y===L&&x===prevDay(L))||(typeOf[y]==='chi'&&x===L&&y===prevDay(L))); if(!tol) u++; }
  return u;
}
function paceTypes(train,cap){
  if(!PACE3.three||cap!==3) return E.gs(cap,E.sp('run_pace_goal'),false,false);
  const clean=combos(train,3).some(days=>perms(PACE3.three).some(p=>{ const t={}; days.forEach((d,i)=>t[d]=p[i]); return d130untol(days,t)===0; }));
  return clean?PACE3.three:PACE3.fallback;
}

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
      // V213 (D113a) era: the pace head is D130's split, -(10 x untol + tol); tol = coll - untol on the
      // pace template. Through 212 and on NRC it is -coll, as it always was.
      const _u=(pace&&PACE3.three)?d130untol(days,typeOf):0;
      const ruled=[(pace&&PACE3.three)?-(10*_u+(coll-_u)):-coll,ll,sar,rbl,can];
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

let PASS=0,FAIL=0;
function ok(c,msg){ if(c) PASS++; else { FAIL++; console.log('  FAIL ' + msg); } }

// routed pace rows: ceiling below the training week, 2 or more days
const PACE_ROWS=[];
[0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
  const train=DAYS.filter(d=>rest.indexOf(d)<0);
  [3,4].forEach(cap=>{ if(train.length>cap) PACE_ROWS.push({nm:rest.join('+')||'none',train,cap}); });
}));

// ── P1: the pace arm is lex-optimal under the CORRECTED-eve objective ────────
console.log('P1 pace arm lex-optimal under the corrected recBeforeLong (' + PACE_ROWS.length + ' rows)');
let p1bad=0;
PACE_ROWS.forEach(r=>{
  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);
  const got=engIn(all,pick,r.train);
  const best=topBy(all,'rank');
  const good = got && best.some(b=>cmp(b.rank,got.rank)===0);
  if(!good){ p1bad++; if(p1bad<=5) console.log('  FAIL P1 rest '+r.nm+' cap'+r.cap+' engine '+lay(r.train,pick)+
    ' rank '+(got?got.rank.join(','):'ORPHAN')+' vs best '+best[0].rank.join(',')); }
  ok(good,'');  // counted per row
});

// ── P1b: the day AFTER the long run is never credited as padding it ─────────
console.log('P1b no pace layout is credited for a recovery run the day AFTER the long');
let p1b=0;
PACE_ROWS.forEach(r=>{
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);
  const days=pick.idxs.map(i=>r.train[i]);
  const longDay=days.find(d=>pick.typeOf[d]==='lsd_long');
  if(!longDay) return;
  const nextDay=DAYS[(pos(longDay)+1)%7];
  const padsAfterOnly = days.some(d=>pick.typeOf[d]==='lsd_easy'&&d===nextDay)
                     && !days.some(d=>pick.typeOf[d]==='lsd_easy'&&d===prevDay(longDay));
  // an easy run the day after the long is legal; what is illegal is that layout WINNING
  // over one with a true eve that ties on ranks 1 to 3.
  if(padsAfterOnly){
    const types=paceTypes(r.train,r.cap);   // V213 era row
    const all=space(r.train,r.cap,types,TP,true);
    const got=engIn(all,pick,r.train);
    if(!got){ p1b++; console.log('  FAIL P1b rest '+r.nm+' cap'+r.cap+' engine layout '+lay(r.train,pick)+' is not in the era type space'); return; }
    const better=all.find(c=>cmp(c.ruled.slice(0,3),got.ruled.slice(0,3))===0 && c.ruled[3]>got.ruled[3]);
    if(better){ p1b++; console.log('  FAIL P1b rest '+r.nm+' cap'+r.cap+' kept a day-after pad over '+
      better.days.map(d=>d.toUpperCase()+':'+better.typeOf[d]).join(' ')); }
  }
});
ok(p1b===0,'P1b: '+p1b+' rows kept a day-after pad over a true eve');

// ── P2: ranks 6 and 7 are INERT on the NRC arm ──────────────────────────────
console.log('P2 NRC is lex-optimal under the FIVE ruled terms alone (ranks 6/7 inert)');
let nrcRows=0,p2bad=0;
['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
  [0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
    const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
    for(let cap=2;cap<n;cap++){
      nrcRows++;
      const all=space(train,cap,E.gn(cap,g),TN,false);
      if(!all.length) continue;
      const pick=E.c(train,cap,g,false);
      const got=engIn(all,pick,train);
      const best=topBy(all,'ruled');
      const good = got && cmp(got.ruled,best[0].ruled)===0;
      if(!good){ p2bad++; if(p2bad<=5) console.log('  FAIL P2 '+g+' rest '+(rest.join('+')||'none')+' cap'+cap+
        ' rank '+(got?got.ruled.join(','):'ORPHAN')+' vs '+best[0].ruled.join(',')); }
    }
  }));
});
ok(p2bad===0,'P2: '+p2bad+'/'+nrcRows+' NRC rows are not five-term optimal');
console.log('  NRC rows scored: '+nrcRows);

// ── P2c: IDENTITY IS NOT CONSULTED ON THE NRC ARM ────────────────────────────
// P2 proves NRC picks a MAXIMUM of the five ruled terms. Identity only ever reorders
// layouts INSIDE that maximum, so P2 cannot see it and never claimed to: letting the
// term off its paceFam leash moves 129 of 800 NRC rows with P2 still green. This row
// asserts the ruling's own words -- ranks 6 to 9 are pace-family-only, NRC identical on
// 804/804 -- in a form that scoring identity on NRC makes FALSE.
// THE ORACLE is the definition of rank 6 plus this file's exhaustive search, with no
// engine value in it. If identity were live on NRC then on EVERY row whose five-term tie
// set spans more than one day set AND contains the even-spread subset, the engine would
// be FORCED to return the even-spread subset; that is what the term does. So one NRC row
// that is offered the even-spread subset at the top of the ruled objective and walks away
// from it is a proof that identity is not scored there. Measured: 445 rows carry a
// multi-subset tie, the even-spread subset sits in 357 of them, and the engine declines
// it on 129. That 129 is the same population counted from the other side -- it is exactly
// the number of NRC rows that move when the leash comes off.
console.log('P2c identity is pace-family-only: NRC declines the even-spread subset it is offered');
{
  let tieMulti=0, evenInTie=0, takesEven=0, takesOther=0; const ex=[];
  ['run_5k','run_10k','run_half','run_marathon'].forEach(g=>{
    [0,1,2,3,4,5].forEach(nr=>combos(DAYS,nr).forEach(rest=>{
      const train=DAYS.filter(d=>rest.indexOf(d)<0), n=train.length;
      for(let cap=2;cap<n;cap++){
        const all=space(train,cap,E.gn(cap,g),TN,false); if(!all.length) continue;
        const subs={}; topBy(all,'ruled').forEach(c=>subs[c.idxs.join(',')]=1);
        if(Object.keys(subs).length<2) continue;
        tieMulti++;
        const evk=evenIdx(n,cap).join(',');
        if(!subs[evk]) continue;
        evenInTie++;
        const pick=E.c(train,cap,g,false);
        if(pick.idxs.join(',')===evk) takesEven++;
        else { takesOther++; if(ex.length<3) ex.push(g+' rest '+(rest.join('+')||'none')+' cap'+cap+' even='+evk+' engine='+pick.idxs.join(',')); }
      }
    }));
  });
  ok(tieMulti===445 && evenInTie===357,
     'P2c population: '+tieMulti+' multi-subset ties (expected 445), even-spread subset in '+evenInTie+' (expected 357)');
  ok(takesOther===129 && takesEven===228,
     'P2c: the engine declined the even-spread subset on '+takesOther+' rows (expected 129) and took it on '+takesEven+' (expected 228). Zero declines means identity is scored on NRC');
  console.log('  NRC declined it on '+takesOther+'/'+evenInTie+' offered rows; e.g. '+ex.join(' | '));
}

// ── P3: IDENTITY. Where the even-spread subset is in the five-term tie set,
//        the engine must pick that subset. ───────────────────────────────────
console.log('P3 identity: the incumbent even-spread subset wins every tie it is in');
let p3n=0,p3bad=0;
PACE_ROWS.forEach(r=>{
  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(!tied.some(c=>c.idxs.join(',')===ev)) return;
  p3n++;
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);
  if(pick.idxs.join(',')!==ev){ p3bad++; console.log('  FAIL P3 rest '+r.nm+' cap'+r.cap+
    ' incumbent '+ev.split(',').map(i=>r.train[+i]).join(',')+' but picked '+pick.idxs.map(i=>r.train[i]).join(',')); }
});
ok(p3bad===0,'P3: '+p3bad+'/'+p3n+' rows moved off the incumbent subset on a tie');
console.log('  rows where the incumbent subset ties at the top: '+p3n);

// ── P4: SPREAD. Where it does NOT, the pick has the minimum longest run-free
//        stretch over the tie set. ────────────────────────────────────────────
console.log('P4 spread: among ties without the incumbent, the tightest week wins');
let p4n=0,p4bad=0;
PACE_ROWS.forEach(r=>{
  const types=paceTypes(r.train,r.cap);   // V213 era row
  const all=space(r.train,r.cap,types,TP,true);
  const tied=topBy(all,'ruled');
  const ev=evenIdx(r.train.length,r.cap).join(',');
  if(tied.some(c=>c.idxs.join(',')===ev)) return;
  p4n++;
  const minLF=Math.min.apply(null,tied.map(c=>c.lf));
  const pick=E.c(r.train,r.cap,'run_pace_goal',true);
  const got=engIn(all,pick,r.train);
  if(!got||got.lf!==minLF){ p4bad++; if(p4bad<=5) console.log('  FAIL P4 rest '+r.nm+' cap'+r.cap+
    ' longest run-free '+(got?got.lf:'?')+' but '+minLF+' was available'); }
});
ok(p4bad===0,'P4: '+p4bad+'/'+p4n+' rows took a looser week than the tie set allowed');
console.log('  rows decided by spread: '+p4n);

// ── P5: HAND TABLE. Mario's row, typed in as literals. ─────────────────────
console.log("P5 hand table: rest sun+wed, four-run ceiling");
{
  const train=DAYS.filter(d=>['sun','wed'].indexOf(d)<0);
  const pick=E.c(train,4,'run_pace_goal',true);
  const got=engIn(space(train,4,E.gs(4,E.sp('run_pace_goal'),false,false),TP,true),pick,train);
  const want='MON:int THU:chi FRI:lsd_easy SAT:lsd_long';
  console.log('  '+lay(train,pick)+'  ruled rank '+(got?got.ruled.join(','):'ORPHAN'));
  ok(lay(train,pick)===want,'P5 layout is "'+lay(train,pick)+'", hand table says "'+want+'"');
  ok(got&&got.ruled.join(',')==='0,1,2,1,1','P5 ruled rank is not 0,1,2,1,1');
  ok(got&&got.lf===2,'P5 longest run-free stretch is not 2');
}

// ── P6: AFTER-GRID. The eve correction displaces 24 of the 93 pace rows. ───
console.log('P6 after-grid: the eve correction moves 24 of 93 pace rows');
{
  let moved=0;
  PACE_ROWS.forEach(r=>{
    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    // shipped-predicate control, five ruled terms only, built here
    const ctrl=space(r.train,r.cap,types,TP,true).map(c=>c);
    const a=topBy(space(r.train,r.cap,types,{long:'lsd_long',rec:'lsd_easy',s1:'int',s2:'chi'},true),'ruled')[0];
    // rebuild the shipped-predicate space by rescoring rank 4 the old way
    const old=ctrl.map(c=>{
      const longDay=c.days.find(d=>c.typeOf[d]==='lsd_long');
      const rbl=longDay&&c.days.some(d=>c.typeOf[d]==='lsd_easy'&&circ(d,longDay)===1&&pos(d)<pos(longDay))?1:0;
      return {idxs:c.idxs,days:c.days,typeOf:c.typeOf,ruled:[c.ruled[0],c.ruled[1],c.ruled[2],rbl,c.ruled[4]]};
    });
    const b=topBy(old,'ruled')[0];
    if(a.idxs.join()!==b.idxs.join()||a.days.some(d=>a.typeOf[d]!==b.typeOf[d])) moved++;
  });
  console.log('  displaced: '+moved+'/93');
  ok(moved===24,'P6 eve correction displaced '+moved+' rows, after-grid says 24');
}

// ── P7: DAYS ARE NEVER AN ARTIFACT OF LOOP ORDER. The residual tie count after
//        rank 9 is pinned to the number measured, and every surviving tie must be
//        the same week: same long run day, same quality days, same types on them.
//        Only the recovery day may differ. ──────────────────────────────────────
console.log('P7 residual ties after rank 9, and what the survivors look like');
{
  let resid=0, spanning=0, hardSplit=0;
  PACE_ROWS.forEach(r=>{
    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    const tied=topBy(space(r.train,r.cap,types,TP,true),'rank');
    if(tied.length<2) return;
    resid++;
    const dsets=tied.map(c=>c.idxs.join(',')).filter((v,i,a)=>a.indexOf(v)===i);
    if(dsets.length>1) spanning++;
    const hards=tied.map(c=>c.hard).filter((v,i,a)=>a.indexOf(v)===i);
    if(hards.length>1){ hardSplit++; console.log('  FAIL P7 rest '+r.nm+' cap'+r.cap+
      ' tie spans two hard-day placements: '+hards.join('  |  ')); }
    console.log('  residual tie: rest '+r.nm+' cap'+r.cap+' x'+tied.length+' -> '+
      tied.map(c=>lay(r.train,c)).join('  |  '));
  });
  console.log('  rows with a tie surviving rank 9: '+resid+'/'+PACE_ROWS.length+
              ' (spanning more than one day set: '+spanning+')');
  ok(resid===2,'P7 residual tie count is '+resid+'/93, the measure pinned 2');
  ok(hardSplit===0,'P7: '+hardSplit+' residual ties put the hard days on different days');
  // the measured refutation of the literal wording, pinned so it cannot drift silently
  ok(spanning===2,'P7 day-set-spanning residual ties is '+spanning+', the measure pinned 2');
  // HOW THE NINE TIES AT RANK 7 ARE DISPOSED OF. Oracle-internal: it pins the shape of
  // the search space, not the engine's answer. Rank 8 breaks 5, rank 9 breaks 2, and 2
  // survive with the same hard days. The three numbers must sum to the rank-7 tie count.
  let r9=0, r8=0;
  PACE_ROWS.forEach(r=>{
    const types=E.gs(r.cap,E.sp('run_pace_goal'),false,false);
    const all=space(r.train,r.cap,types,TP,true).map(c=>Object.assign({},c,{k7:c.rank.slice(0,7),k8:c.rank.slice(0,8)}));
    const t7=topBy(all,'k7').length, t8=topBy(all,'k8').length, t9=topBy(all,'rank').length;
    if(t7>t8) r8++;
    if(t8>t9) r9++;
  });
  console.log('  ties broken by rank 8: '+r8+'/'+PACE_ROWS.length+'; by rank 9: '+r9+'/'+PACE_ROWS.length);
  ok(r8===5,'P7 rank 8 broke '+r8+' ties, the measure pinned 5');
  ok(r9===2,'P7 rank 9 broke '+r9+' ties, the measure pinned 2');
  ok(r8+r9+resid===9,'P7 rank-7 ties do not account: '+r8+'+'+r9+'+'+resid+' is not 9');
}

// ── P8: AFTER-GRID HAND ROW. The ruling names this resolution for the five-way
//        tie at rest=fri, cap 4. Typed in as a literal. ───────────────────────
console.log('P8 after-grid: rest fri, four-run ceiling');
{
  const train=DAYS.filter(d=>d!=='fri');
  const pick=E.c(train,4,'run_pace_goal',true);
  const want='MON:int WED:chi THU:lsd_easy SAT:lsd_long';
  console.log('  '+lay(train,pick));
  ok(lay(train,pick)===want,'P8 layout is "'+lay(train,pick)+'", the ruling says "'+want+'"');
  // rank 8 is the term that decides it: last quality Wednesday, three days clear of the long
  const got=engIn(space(train,4,E.gs(4,E.sp('run_pace_goal'),false,false),TP,true),pick,train);
  ok(got&&got.qr===3,'P8 rest into the long run is '+(got?got.qr:'?')+' days, the ruling says 3');
}

console.log('PASS '+PASS+' FAIL '+FAIL);
