// v204_cap4_blast.js — "what would a 4th run day have to move?"
// Follow-up to v204_pacegoal_run_days.js. READ-ONLY measure pass. Rules nothing.
// Artifact A = the working index.html (ia-version 203, run_pace_goal ceiling 3).
// Artifact B = a SCRATCH copy with the single literal `run_pace_goal: 3` -> 4.
//   scratch path passed as argv[3]; the working file is never written.
//
// ORACLES (all independent of the functions under test):
//  * NSW PTG p.20 l.327-331 weekly template: 2 LSD + 1 LI + 1 SI.
//  * Spacing rule, restated here longhand from the source comment's CLAIM
//    ("two hard sessions never land back-to-back"): two hard run days whose
//    circular weekday distance is 1 are a collision. Computed here from the
//    PRINTED SUBTYPE of each day, never from session.legLoad.
//  * Hard-day pairing doctrine (CLAUDE.md): hinge / heavy lower pairs with
//    speed days, not recovery runs. Hinge/heavy-lower detected by a hand list
//    of movement names, not by any engine flag.
const path = require('path');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

const ART_A = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const ART_B = process.argv[3];
const A = load(ART_A);
const B = ART_B ? load(ART_B) : null;

const ORD = ['mon','tue','wed','thu','fri','sat','sun'];
const posOf = d => ORD.indexOf(d);

function cfg(o={}){
  return Object.assign({
    name:'MARIO PACE', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Hit a Pace / Time Goal',
      targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0', targetTime:'10:00',
      mileBestMins:'8', mileBestSecs:'0', baseline:'' } },
    eventTargeted:false,
    liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
    equipment:'full_gym', unit:'lbs',
    restDays:['sun','wed'], days:ORD.slice(), bench:185, squat:255, deadlift:315, seed:76308,
  }, o);
}

function subOf(day){
  const c = day && day.cardio; if(!c) return null;
  const arr = Array.isArray(c)?c:[c];
  return arr.map(x=>x.subtype||x.type||'?').join('+');
}
// IMPORTANT: on the NSW pace path BOTH the easy run and the long run print the SAME
// subtype string, 'Long Slow Distance (LSD)'. Distance is what separates them, so the
// long run is resolved per WEEK as the largest-mileage LSD day. This deliberately does
// NOT read session.legLoad (the engine flag whose behaviour is under measurement).
function nswClass(s){
  if(!s) return null; s=String(s);
  if(/Interval \(INT\)|Speed Run — Intervals/.test(s)) return 'INT';
  if(/Tempo|Threshold|CHI|Steady Aerobic|Fartlek|Hills/i.test(s)) return 'CHI';
  if(/Long Run|Long Slow|Easy Run — Long/i.test(s)) return 'LSD';
  if(/Easy|Recovery|LSD|Shakeout|Benchmark/i.test(s)) return 'LSD';
  return 'OTHER:'+s;
}
function resolveLongestLSD(days){
  let best=-1, bestIdx=-1;
  days.forEach((x,i)=>{
    if(x.kind!=='train'||x.cls!=='LSD') return;
    const v = x.mi!=null ? x.mi : (x.mins!=null ? x.mins/100 : 0);
    if(v>best){ best=v; bestIdx=i; }
  });
  days.forEach((x,i)=>{ if(x.kind==='train'&&x.cls==='LSD') x.cls = (i===bestIdx)?'LSD_LONG':'LSD_EASY'; });
}
const HARD_CLASS = new Set(['INT','CHI','LSD_LONG']);
const QUALITY = new Set(['INT','CHI']);

// hand list — hinge / heavy lower. Independent of the engine's legLoad flag.
const HINGE = /deadlift|romanian|rdl|good morning|hip thrust|glute bridge|kettlebell swing|back extension|nordic/i;
const HEAVY_LOWER = /squat|lunge|split squat|step[- ]up|leg press|bulgarian|hack squat/i;
function liftProfile(day){
  const secs = day && day.sections || [];
  const names = [];
  secs.forEach(s => (s.items||[]).forEach(it => names.push(it.name||'')));
  const txt = names.join(' | ');
  return { title:(day&&day.title)||'', hinge:HINGE.test(txt), heavyLower:HEAVY_LOWER.test(txt),
           nItems:names.length, sample:names.slice(0,4).join(', ') };
}

function weekRows(prog){
  const rows=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    const wk=prog.weeks[w];
    const days=[];
    ORD.forEach(d=>{
      const day=wk[d];
      if(!day){ days.push({d, kind:'absent'}); return; }
      if(day.rest){ days.push({d, kind:'rest'}); return; }
      const sub=subOf(day);
      const c0 = (day.cardio && !Array.isArray(day.cardio)) ? day.cardio : (Array.isArray(day.cardio)?day.cardio[0]:null);
      const dz = c0 && c0.dose || null;
      days.push({d, kind:'train', sub, cls: sub?nswClass(sub):null, lift:liftProfile(day),
                 mi: dz && dz.mi!=null ? dz.mi : null, mins: dz && dz.mins!=null ? dz.mins : null,
                 legLoad: !!(c0 && c0.legLoad)});
    });
    resolveLongestLSD(days);
    rows.push({w:+w, days});
  });
  return rows;
}

// Independent collision count over the real calendar week.
function collisions(days){
  const hard = days.filter(x=>x.kind==='train' && x.cls && HARD_CLASS.has(x.cls));
  let c=0, pairs=[];
  for(let i=0;i<hard.length;i++) for(let j=i+1;j<hard.length;j++){
    const dd=Math.abs(posOf(hard[i].d)-posOf(hard[j].d));
    if(Math.min(dd,7-dd)===1){ c++; pairs.push(hard[i].cls+'@'+hard[i].d+'/'+hard[j].cls+'@'+hard[j].d); }
  }
  return {c, pairs};
}
function qualityAdjacent(days){
  const q = days.filter(x=>x.kind==='train' && x.cls && QUALITY.has(x.cls));
  if(q.length<2) return false;
  for(let i=0;i<q.length;i++) for(let j=i+1;j<q.length;j++){
    const dd=Math.abs(posOf(q[i].d)-posOf(q[j].d));
    if(Math.min(dd,7-dd)===1) return true;
  }
  return false;
}

// INDEPENDENT OPTIMALITY ORACLE. spaceHardCardio can only permute TYPES within the
// already-chosen run days. So: enumerate EVERY permutation of the week's own type
// multiset across its own run days, count collisions the same longhand way, and take
// the minimum. If actual > min the pass left an avoidable collision. If actual == min
// and min > 0 the BOARD is unsolvable given the chosen days — a day-choice problem,
// not a spacing-pass problem. This enumeration is written here, not called out of the
// artifact.
function permute(a){
  if(a.length<=1) return [a];
  const out=[];
  for(let i=0;i<a.length;i++){
    const rest=a.slice(0,i).concat(a.slice(i+1));
    permute(rest).forEach(p=>out.push([a[i]].concat(p)));
  }
  return out;
}
function minCollisions(days){
  const idx=[]; const types=[];
  days.forEach((x,i)=>{ if(x.kind==='train'&&x.cls){ idx.push(i); types.push(x.cls); } });
  const seen=new Set(); let best=Infinity;
  permute(types).forEach(perm=>{
    const key=perm.join('|'); if(seen.has(key)) return; seen.add(key);
    let c=0;
    for(let a=0;a<idx.length;a++) for(let b=a+1;b<idx.length;b++){
      if(!HARD_CLASS.has(perm[a])||!HARD_CLASS.has(perm[b])) continue;
      const dd=Math.abs(posOf(days[idx[a]].d)-posOf(days[idx[b]].d));
      if(Math.min(dd,7-dd)===1) c++;
    }
    if(c<best) best=c;
  });
  return best===Infinity?0:best;
}

function fmtWeek(row){
  return row.days.map(x=>{
    if(x.kind!=='train') return `${x.d.toUpperCase()}:${x.kind==='rest'?'REST':'--'}`;
    return `${x.d.toUpperCase()}:${x.cls||'lift-only'}${x.lift.hinge?'/HINGE':''}${x.lift.heavyLower?'/LOWER':''}`;
  }).join('  ');
}

const REST_SETS = [
  ['sun','wed','sat'],   // 4 train days
  ['sun','wed'],         // 5 (Mario)
  ['sun','thu'],         // 5, other placement
  ['fri','sat'],         // 5, weekend rest
  ['sat','sun'],         // 5, weekend rest 2
  ['sun'],               // 6
  ['wed'],               // 6, midweek
  [],                    // 7
];
const FOCUSES=['support_prevention','support_strength','support_athletic','balanced','strength','hypertrophy','fatloss'];
const EXPS=['beginner','intermediate','advanced'];
const SEEDS=[76308,11111,42424,99001,5150];

function sweep(IA, tag){
  const st = { builds:0, weeks:0, runDayHist:{}, censusHist:{}, colWeeks:0, colTotal:0,
               qAdjWeeks:0, weeksWith2Q:0, pairKinds:{}, dayOfRun:{}, fourthRunDay:{},
               liftCollide:{ qOnHingeDay:0, qDayAfterHinge:0, qDayAfterLower:0,
                             easyOnHingeDay:0, qWithNoHingeSameDay:0 },
               qLiftDenom:0, hasLI:0, crashes:0, bySeries:{},
               avoidableWeeks:0, unsolvableWeeks:0, cleanWeeks:0, bySeg:{} };
  REST_SETS.forEach(rd=>EXPS.forEach(ex=>SEEDS.forEach(sd=>FOCUSES.forEach(f=>{
    let prog;
    try { prog = IA.buildProgram(cfg({restDays:rd, experience:ex, seed:sd, liftingFocus:f})); }
    catch(e){ st.crashes++; console.log(`  CRASH ${tag} ${rd.join('+')||'none'}/${ex}/${sd}/${f}: ${e.message}`); return; }
    st.builds++;
    const rows=weekRows(prog);
    const series=[];
    rows.forEach(row=>{
      st.weeks++;
      const runs=row.days.filter(x=>x.kind==='train'&&x.cls);
      series.push(runs.length);
      st.runDayHist[runs.length]=(st.runDayHist[runs.length]||0)+1;
      const cen={}; runs.forEach(r=>cen[r.cls]=(cen[r.cls]||0)+1);
      const key=Object.keys(cen).sort().map(k=>`${k}x${cen[k]}`).join('+');
      st.censusHist[key]=(st.censusHist[key]||0)+1;
      runs.forEach(r=>{ st.dayOfRun[r.d]=(st.dayOfRun[r.d]||0)+1; });
      if(runs.length>=4){
        // 4th run day = the run weekday NOT present in the 3-run baseline shape mon/thu/sat is
        // config-specific; report the full weekday set instead.
        const setKey=runs.map(r=>r.d).join(',');
        st.fourthRunDay[setKey]=(st.fourthRunDay[setKey]||0)+1;
      }
      const col=collisions(row.days);
      const mn=minCollisions(row.days);
      if(col.c===0) st.cleanWeeks++;
      else if(col.c>mn) st.avoidableWeeks++;
      else st.unsolvableWeeks++;
      const seg=`rest=${rd.join('+')||'none'}(n=${7-rd.length})`;
      st.bySeg[seg]=st.bySeg[seg]||{weeks:0,col:0,avoid:0,unsolv:0};
      st.bySeg[seg].weeks++; if(col.c){ st.bySeg[seg].col++; if(col.c>mn) st.bySeg[seg].avoid++; else st.bySeg[seg].unsolv++; }
      if(col.c){ st.colWeeks++; st.colTotal+=col.c; col.pairs.forEach(p=>{
        const k=p.replace(/@[a-z]{3}/g,'');
        st.pairKinds[k]=(st.pairKinds[k]||0)+1; }); }
      const nq=runs.filter(r=>QUALITY.has(r.cls)).length;
      if(nq>=2){ st.weeksWith2Q++; if(qualityAdjacent(row.days)) st.qAdjWeeks++; }
      if(runs.some(r=>r.cls==='OTHER:LI'||/mile repeat/i.test(r.sub||''))) st.hasLI++;
      // lift collisions
      row.days.forEach((x,i)=>{
        if(x.kind!=='train'||!x.cls) return;
        const prev=row.days[(i+6)%7];
        const prevHinge = prev.kind==='train' && prev.lift && prev.lift.hinge;
        const prevLower = prev.kind==='train' && prev.lift && prev.lift.heavyLower;
        if(QUALITY.has(x.cls)){
          st.qLiftDenom++;
          if(x.lift.hinge) st.liftCollide.qOnHingeDay++; else st.liftCollide.qWithNoHingeSameDay++;
          if(prevHinge) st.liftCollide.qDayAfterHinge++;
          if(prevLower) st.liftCollide.qDayAfterLower++;
        } else if(x.cls==='LSD_EASY'){
          if(x.lift.hinge) st.liftCollide.easyOnHingeDay++;
        }
      });
    });
    const sig=series.join(',');
    st.bySeries[sig]=(st.bySeries[sig]||0)+1;
  }))));
  return st;
}

function report(st, tag){
  console.log(`\n--- ${tag}: ${st.builds} builds / ${st.weeks} weeks / ${st.crashes} crashes`);
  console.log(`  run-days per week: ${JSON.stringify(st.runDayHist)}`);
  console.log(`  weekly census:`);
  Object.entries(st.censusHist).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`     ${String(v).padStart(6)}  ${k}`));
  console.log(`  weeks with >=2 quality (INT|CHI): ${st.weeksWith2Q}/${st.weeks}; of those ADJACENT: ${st.qAdjWeeks}`);
  console.log(`  weeks with >=1 hard-pair collision (INT|CHI|LONG circular dist 1): ${st.colWeeks}/${st.weeks}; total pairs ${st.colTotal}`);
  console.log(`  collision kinds: ${JSON.stringify(st.pairKinds)}`);
  console.log(`  vs the BEST layout reachable by permuting types across the same chosen days:`);
  console.log(`     collision-free ${st.cleanWeeks}/${st.weeks}, collision but UNAVOIDABLE given the day choice ${st.unsolvableWeeks}/${st.weeks}, AVOIDABLE (spacing pass left a fixable one) ${st.avoidableWeeks}/${st.weeks}`);
  console.log(`  segmented by rest pattern (weeks / weeks-with-collision / avoidable / unavoidable):`);
  Object.entries(st.bySeg).forEach(([k,v])=>console.log(`     ${k.padEnd(28)} ${v.weeks} / ${v.col} / ${v.avoid} / ${v.unsolv}`));
  console.log(`  run weekday distribution: ${JSON.stringify(st.dayOfRun)}`);
  console.log(`  weeks containing anything LI-shaped (mile repeat): ${st.hasLI}/${st.weeks}`);
  console.log(`  quality-run days: ${st.qLiftDenom}. same-day hinge ${st.liftCollide.qOnHingeDay}, same-day NO hinge ${st.liftCollide.qWithNoHingeSameDay}, day-after-hinge ${st.liftCollide.qDayAfterHinge}, day-after-heavy-lower ${st.liftCollide.qDayAfterLower}`);
  console.log(`  easy-run days carrying a hinge: ${st.liftCollide.easyOnHingeDay}`);
  const top=Object.entries(st.bySeries).sort((a,b)=>b[1]-a[1]).slice(0,6);
  console.log(`  top run-day series: ${top.map(([k,v])=>`${v}x[${k}]`).join('  ')}`);
}

console.log(`### v204_cap4_blast  A=${ART_A} (ia-version ${A.version})  B=${ART_B||'(none)'}${B?' (ia-version '+B.version+', ceiling 4)':''}`);

// ── Q1/Q2: Mario's exact config, both artifacts, full grid ────────────────────
[['A cap=3',A],['B cap=4',B]].forEach(([tag,IA])=>{
  if(!IA) return;
  console.log(`\n### MARIO CONFIG GRID — ${tag} — 5 train days, rest sun+wed, intermediate, support_prevention, seed 76308`);
  const rows=weekRows(IA.buildProgram(cfg()));
  rows.forEach(r=>{
    const col=collisions(r.days);
    console.log(`W${String(r.w).padStart(2)} ${fmtWeek(r)}  | collisions=${col.c}${col.c?' ['+col.pairs.join(' ')+']':''}`);
  });
  console.log('  lift detail, week 1:');
  rows[0].days.forEach(x=>{
    if(x.kind!=='train') return;
    console.log(`     ${x.d.toUpperCase()} cls=${String(x.cls||'lift-only').padEnd(9)} legLoad=${x.legLoad} title="${x.lift.title}" hinge=${x.lift.hinge} lower=${x.lift.heavyLower} :: ${x.lift.sample}`);
  });
});

// ── Q1/Q2 lattice ─────────────────────────────────────────────────────────────
console.log(`\n### LATTICE  ${REST_SETS.length} rest patterns x ${EXPS.length} exp x ${SEEDS.length} seeds x ${FOCUSES.length} focuses`);
report(sweep(A,'A cap=3'),'A cap=3');
if(B) report(sweep(B,'B cap=4'),'B cap=4');

// ── Q3: what getSessionTypes(4,...) emits, straight ───────────────────────────
console.log('\n### Q3 getSessionTypes rows (read from the artifact source, protectInt=true, baseMode=false)');
// getSessionTypes is an inner function of buildProgram and is not exported, so the rows
// are read out of the artifact SOURCE. The lattice census above is the empirical check.
const _body = A.html.slice(A.html.indexOf('function getSessionTypes('));
const _rows = _body.slice(0, _body.indexOf('// \u2500\u2500 DAY ALLOCATION'));
_rows.split('\n').filter(l=>/if\(nDays ===|^\s*return \[/.test(l)).forEach(l=>console.log('   '+l.trim()));

// ── Q4: is anything LI-shaped emittable on ANY goal? ──────────────────────────
console.log('\n### Q4 INT DISTANCE CENSUS — every run goal, distinct distance token printed by buildRunSession');
const ALL_GOALS = ['run_pace_goal','run_mile_time','run_15_under10','run_base','run_5k','run_10k','run_half','run_marathon'];
const distTok = {};
ALL_GOALS.forEach(gid=>{
  EXPS.forEach(ex=>SEEDS.slice(0,2).forEach(sd=>{
    const g = { id:gid, label:gid, targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0',
                targetTime:'10:00', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' };
    let prog; try{ prog=A.buildProgram(cfg({cardioGoals:{run:g}, experience:ex, seed:sd, restDays:[]})); }
    catch(e){ (distTok[gid]=distTok[gid]||{})['CRASH:'+e.message]=1; return; }
    Object.keys(prog.weeks).forEach(w=>ORD.forEach(d=>{
      const day=prog.weeks[w][d]; const c=day&&day.cardio; if(!c) return;
      const arr=Array.isArray(c)?c:[c];
      arr.forEach(s=>{
        const txt=(s.subtype||'')+' '+(s.detail||'');
        const m=txt.match(/(\d+)\s*x\s*([\d.]+)\s*(m|mi|mile|k|km)\b/i);
        const mile=/mile repeat|x\s*1600|x\s*1\s*mile/i.test(txt);
        const k = m ? m[2]+m[3] : (mile?'MILE-REPEAT':null);
        if(!k) return;
        distTok[gid]=distTok[gid]||{}; distTok[gid][k]=(distTok[gid][k]||0)+1;
      });
    }));
  }));
});
ALL_GOALS.forEach(g=>console.log(`   ${g.padEnd(16)} ${JSON.stringify(distTok[g]||{})}`));
console.log('   distinct INT-class subtype+first-clause forms, every goal:');
const intForms={};
ALL_GOALS.forEach(gid=>{
  const g = { id:gid, label:gid, targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0',
              targetTime:'10:00', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' };
  let prog; try{ prog=A.buildProgram(cfg({cardioGoals:{run:g}, restDays:[]})); }catch(e){ return; }
  Object.keys(prog.weeks).forEach(w=>ORD.forEach(d=>{
    const day=prog.weeks[w][d]; const c=day&&day.cardio; if(!c) return;
    const arr=Array.isArray(c)?c:[c];
    arr.forEach(s2=>{ const sub=String(s2.subtype||'');
      if(!/Interval|Speed/i.test(sub)) return;
      const k=gid+' :: '+sub+' :: '+String(s2.detail||'').split(/[.]/)[0].slice(0,70);
      intForms[k]=(intForms[k]||0)+1; });
  }));
});
Object.entries(intForms).sort().forEach(([k,v])=>console.log(`      ${String(v).padStart(4)}  ${k}`));
console.log('   source scan for any mile-repeat literal in index.html:');
['1600','mile repeat','Mile Repeat','x 1 mile','LI —','Long Interval'].forEach(t=>{
  const n=(A.html.split(t).length-1);
  console.log(`      "${t}" occurrences: ${n}`);
});

// ── Q5: run_5k / run_10k weekly census ────────────────────────────────────────
console.log('\n### Q5 CENSUS FOR THE OTHER CEILING-4 GOALS (subtype strings verbatim)');
['run_5k','run_10k','run_base','run_half'].forEach(gid=>{
  const g={ id:gid, label:gid, targetDist:'3.1', paceUnit:'mi', mileBestMins:'8', mileBestSecs:'0',
            baselineDist:'3', baseline:'3mi', raceDate:null };
  const cen={}; let wks=0, runDayHist={}, builds=0;
  [['sun','wed'],['sun'],[]].forEach(rd=>EXPS.forEach(ex=>SEEDS.slice(0,3).forEach(sd=>{
    let prog; try{ prog=A.buildProgram(cfg({cardioGoals:{run:g}, restDays:rd, experience:ex, seed:sd})); }
    catch(e){ console.log(`   CRASH ${gid}/${rd.join('+')||'none'}/${ex}/${sd}: ${e.message}`); return; }
    builds++;
    Object.keys(prog.weeks).forEach(w=>{ wks++; let n=0;
      ORD.forEach(d=>{ const day=prog.weeks[w][d]; const s=subOf(day); if(!s) return; n++;
        cen[s]=(cen[s]||0)+1; });
      runDayHist[n]=(runDayHist[n]||0)+1; });
  })));
  console.log(`   ${gid}: ${builds} builds / ${wks} weeks  runs-per-week ${JSON.stringify(runDayHist)}`);
  Object.entries(cen).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log(`        ${String(v).padStart(5)}  ${k}`));
});

// ── Q6: blast radius ─────────────────────────────────────────────────────────
console.log('\n### Q6 BLAST RADIUS');
if(B){
  const digA=progDigest(A.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  const digA2=progDigest(A.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  const digB=progDigest(B.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
  console.log(`   HALF_MANNY digest A=${digA}  A(again)=${digA2} baseline-equals-itself=${digA===digA2}  B=${digB}  MOVED=${digA!==digB}`);
  // does any non-pace goal move at all?
  const moved={};
  ALL_GOALS.forEach(gid=>{
    const g={ id:gid, label:gid, targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'0',
              targetTime:'10:00', mileBestMins:'8', mileBestSecs:'0', baselineDist:'3', baseline:'3mi' };
    let n=0, diff=0;
    [['sun','wed'],['sun'],[]].forEach(rd=>SEEDS.slice(0,3).forEach(sd=>{
      const c=cfg({cardioGoals:{run:g}, restDays:rd, seed:sd});
      let da,db;
      try{ da=progDigest(A.buildProgram(JSON.parse(JSON.stringify(c)))); }catch(e){ da='CRASH'; }
      try{ db=progDigest(B.buildProgram(JSON.parse(JSON.stringify(c)))); }catch(e){ db='CRASH'; }
      n++; if(da!==db) diff++;
    }));
    moved[gid]=`${diff}/${n}`;
  });
  console.log(`   progDigest moved A->B by goal: ${JSON.stringify(moved)}`);
}
console.log('\n(done)');

// ── Q2b: WHICH DAY the 4th run takes, per rest pattern, and what lift it lands on ──
console.log('\n### Q2b DAY-SET DELTA cap3 -> cap4, per rest pattern (week 1, intermediate, support_prevention, seed 76308)');
if(B){
  REST_SETS.forEach(rd=>{
    const c=cfg({restDays:rd});
    const ra=weekRows(A.buildProgram(JSON.parse(JSON.stringify(c))))[0];
    const rb=weekRows(B.buildProgram(JSON.parse(JSON.stringify(c))))[0];
    const sa=ra.days.filter(x=>x.kind==='train'&&x.cls);
    const sb=rb.days.filter(x=>x.kind==='train'&&x.cls);
    const added=sb.map(x=>x.d).filter(d=>!sa.some(y=>y.d===d));
    const newDayInfo=added.map(d=>{ const x=sb.find(y=>y.d===d);
      return `${d}=${x.cls} on lift "${x.lift.title}"${x.lift.hinge?' [HINGE]':''}${x.lift.heavyLower?' [HEAVY-LOWER]':''}`; }).join('; ');
    console.log(`  rest=${(rd.join('+')||'none').padEnd(13)} n=${7-rd.length}`);
    console.log(`     cap3 ${sa.map(x=>x.d+':'+x.cls).join(' ')}`);
    console.log(`     cap4 ${sb.map(x=>x.d+':'+x.cls).join(' ')}`);
    console.log(`     new run day(s): ${newDayInfo||'(none - day set unchanged)'}`);
    // per-quality-day lift context
    sb.filter(x=>QUALITY.has(x.cls)).forEach(x=>{
      const i=rb.days.findIndex(y=>y.d===x.d); const prev=rb.days[(i+6)%7];
      console.log(`     ${x.cls}@${x.d}: same-day lift "${x.lift.title}" hinge=${x.lift.hinge} lower=${x.lift.heavyLower} | prev day ${prev.d}=${prev.kind==='train'?('"'+prev.lift.title+'" hinge='+prev.lift.hinge+' lower='+prev.lift.heavyLower):prev.kind}`);
    });
  });
}
