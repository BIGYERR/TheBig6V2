// v205_d113_d122_verify.js — slice 7 verification: D113 (three-run week = INT/CHI/long)
// and D122 (no INT->CHI crossover on NSW pace goals). Loads BOTH artifacts and diffs.
//   usage: node tests/measure/v205_d113_d122_verify.js <new.html> <baseline.html>
// Classification is by CONTENT (subtype + legLoad), never by list position.
const path = require('path');
const { load, weekGrid, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const NEWP = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const OLDP = process.argv[3] || '/tmp/base_V205_slice6.html';
const NEW = load(NEWP), OLD = load(OLDP);
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEEDS = [1001,2002,3003,4004,5005,6006,7007,8008,9009];

function combos(arr,k){ if(k===0) return [[]]; if(arr.length<k) return [];
  const [h,...t]=arr; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
function paceCfg(rest, seed){
  return { name:'P', primaryPath:'goal', cardioTypes:['run'],
    cardioGoals:{ run:{ id:'run_pace_goal', label:'Pace', targetDist:'1.5', targetMins:'10',
      targetSecs:'0', mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' } },
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
}
function soloCfg(type, goalId, rest, seed, extra){
  const g = Object.assign({ id:goalId, label:goalId, mileBestMins:'8', mileBestSecs:'30',
    baselineDist:'3', baseline:'3mi' }, extra||{});
  const c = { name:'X', primaryPath:'goal', cardioTypes:[type], cardioGoals:{},
    eventTargeted:false, liftingFocus:'support_prevention', experience:'intermediate',
    ageBracket:'18-35', equipment:'crossfit', unit:'lbs', restDays:rest, days:DAYS.slice(),
    bench:135, squat:155, deadlift:185, seed };
  c.cardioGoals[type] = g; return c;
}
function runsOf(w, sport){
  const out=[];
  DAYS.forEach(d=>{ const day=w[d]; if(!day||!day.cardio) return;
    const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio];
    cs.forEach(c=>{ if(c.type!==(sport||'run')) return;
      const s=String(c.subtype||''); let t;
      if(/Interval \(INT\)/.test(s)) t='int';
      else if(/Continuous High Intensity \(CHI\)/.test(s)) t='chi';
      else if(/Long Slow Distance \(LSD\)/.test(s)) t=c.legLoad?'long':'easy';
      else t='other:'+s;
      out.push({day:d,t}); }); });
  return out;
}
const shapeOf = runs => runs.map(r=>r.day+':'+r.t).join(' ');
const bag = runs => runs.map(r=>r.t).sort().join('+');

// ── A. MARIO ────────────────────────────────────────────────────────────────
const mcfg = () => paceCfg(['sun','wed'], 76308);
const mNew = NEW.buildProgram(mcfg()), mOld = OLD.buildProgram(mcfg());
const gNew = weekGrid(mNew,{showRest:false}), gOld = weekGrid(mOld,{showRest:false});
console.log('== A. MARIO (rest sun+wed, 5 training days, seed 76308) ==');
console.log(`  weeks ${Object.keys(mNew.weeks).length} | digest new ${progDigest(mNew)} | digest slice6 ${progDigest(mOld)}`);
console.log(`  full grid byte-identical to slice 6: ${gNew === gOld ? 'YES' : 'NO'}  (grid bytes ${Buffer.byteLength(gNew)} vs ${Buffer.byteLength(gOld)})`);
Object.keys(mNew.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
  console.log(`  W${wk}  ${shapeOf(runsOf(mNew.weeks[wk]))}`);
});

// ── B. THE 64 CALENDARS, BEFORE AND AFTER ───────────────────────────────────
console.log('\n== B. 64 REST-DAY CALENDARS, run_pace_goal, seed 1001, week 1 ==');
const changed=[], unchanged=[], fallbacks=[];
[3,2,1,0].forEach(nRest=>combos(DAYS,nRest).forEach(rest=>{
  const label=`${7-nRest}d rest=[${rest.join(',')||'none'}]`;
  const rn=runsOf(NEW.buildProgram(paceCfg(rest,1001)).weeks['1']);
  const ro=runsOf(OLD.buildProgram(paceCfg(rest,1001)).weeks['1']);
  const rec={label, rest, before:shapeOf(ro), after:shapeOf(rn), n:rn.length};
  if(rn.length===3) fallbacks.push(rec);
  (shapeOf(rn)===shapeOf(ro)?unchanged:changed).push(rec);
}));
console.log(`  moved ${changed.length}/64   unmoved ${unchanged.length}/64   three-run fallbacks ${fallbacks.length}/64`);
console.log('  -- every moved calendar --');
changed.forEach(r=>console.log(`  ${r.label}\n      before: ${r.before}\n      after : ${r.after}`));

// ── B2. ONE FALLBACK CALENDAR IN FULL, BEFORE AND AFTER ─────────────────────
if(fallbacks.length){
  const f=fallbacks[0];
  console.log(`\n== B2. FULL BEFORE/AFTER — ${f.label}, seed 1001, all weeks ==`);
  const pn=NEW.buildProgram(paceCfg(f.rest,1001)), po=OLD.buildProgram(paceCfg(f.rest,1001));
  Object.keys(pn.weeks).sort((a,b)=>+a-+b).forEach(wk=>{
    console.log(`  W${wk}  before: ${shapeOf(runsOf(po.weeks[wk]))}`);
    console.log(`        after : ${shapeOf(runsOf(pn.weeks[wk]))}`);
  });
}

// ── C. CROSSOVER RETIREMENT ACROSS THE LATTICE ──────────────────────────────
console.log('\n== C. CROSSOVER RETIREMENT, run_pace_goal, 64 calendars x 9 seeds, every built week ==');
let W=0, bothQ=0, oneQ=0, flipProgs=0, progs=0; const badEx=[], flipEx=[];
[3,2,1,0].forEach(nRest=>combos(DAYS,nRest).forEach(rest=>{
  SEEDS.forEach(seed=>{
    const p=NEW.buildProgram(paceCfg(rest,seed)); progs++;
    const bags=new Set();
    Object.keys(p.weeks).forEach(wk=>{
      const r=runsOf(p.weeks[wk]); if(!r.length) return;
      W++; bags.add(bag(r));
      const ts=new Set(r.map(x=>x.t));
      if(ts.has('int')&&ts.has('chi')) bothQ++;
      else { oneQ++; if(badEx.length<6) badEx.push(`  ONE-QUALITY ${7-nRest}d rest=[${rest.join(',')}] seed=${seed} W${wk} ${shapeOf(r)}`); }
    });
    if(bags.size>1){ flipProgs++; if(flipEx.length<6) flipEx.push(`  TYPE-BAG CHANGES ACROSS WEEKS ${7-nRest}d rest=[${rest.join(',')}] seed=${seed} bags=${[...bags].join(' | ')}`); }
  });
}));
console.log(`  weeks carrying BOTH int and chi: ${bothQ} / ${W}   (one-quality weeks: ${oneQ})`);
console.log(`  programs whose run-type multiset changes across weeks: ${flipProgs} / ${progs}  (expect 0)`);
badEx.forEach(e=>console.log(e)); flipEx.forEach(e=>console.log(e));

// ── D. NRC, AND THE CROSSOVER'S REAL REMAINING CONSUMER ─────────────────────
console.log('\n== D. NRC + SWIM: the crossover, built ==');
[['run_5k',['sun','wed','fri','sat']],['run_5k',['sun','wed']],['run_10k',['sun','wed','fri','sat']],['run_10k',['sun','wed']]].forEach(([g,rest])=>{
  const cn=soloCfg('run',g,rest,1001), co=soloCfg('run',g,rest,1001);
  const pn=NEW.buildProgram(cn), po=OLD.buildProgram(co);
  const w1=runsOf(pn.weeks['1']).length;
  console.log(`  ${g} rest=[${rest.join(',')}]  runs/wk ${w1}  digest new ${progDigest(pn)}  slice6 ${progDigest(po)}  ${progDigest(pn)===progDigest(po)?'IDENTICAL':'MOVED'}`);
  const sub = wk => DAYS.map(d=>{const dd=pn.weeks[wk]&&pn.weeks[wk][d]; if(!dd||!dd.cardio) return null;
    const cs=Array.isArray(dd.cardio)?dd.cardio:[dd.cardio]; const c=cs.find(x=>x.type==='run'); return c?d+':'+String(c.subtype||'').slice(0,34):null;}).filter(Boolean).join('  ');
  const ks=Object.keys(pn.weeks).sort((a,b)=>+a-+b);
  console.log(`      W1  ${sub(ks[0])}`);
  console.log(`      W${ks[ks.length-1]} ${sub(ks[ks.length-1])}`);
});
[['swim_500_time',['sun','wed','fri','sat']],['swim_100_time',['sun','wed','fri','sat']]].forEach(([g,rest])=>{
  const pn=NEW.buildProgram(soloCfg('swim',g,rest,1001)), po=OLD.buildProgram(soloCfg('swim',g,rest,1001));
  const ks=Object.keys(pn.weeks).sort((a,b)=>+a-+b);
  const sh = (p,wk)=>shapeOf(runsOf(p.weeks[wk],'swim'));
  console.log(`  ${g} rest=[${rest.join(',')}] runs/wk ${runsOf(pn.weeks['1'],'swim').length} digest new ${progDigest(pn)} slice6 ${progDigest(po)} ${progDigest(pn)===progDigest(po)?'IDENTICAL':'MOVED'}`);
  console.log(`      W1  ${sh(pn,ks[0])}`);
  console.log(`      W${ks[ks.length-1]} ${sh(pn,ks[ks.length-1])}   <- crossover still live here if these differ`);
});

// ── E. UNTOUCHED GOALS ──────────────────────────────────────────────────────
console.log('\n== E. UNTOUCHED: digest before vs after ==');
[['run','run_base'],['run','run_half'],['run','run_marathon'],['bike','bike_ftp'],['bike','bike_50'],
 ['bike','bike_base'],['swim','swim_base'],['swim','swim_mile'],['swim','swim_tri']].forEach(([t,g])=>{
  [['sun','wed','fri','sat'],['sun','wed'],[]].forEach(rest=>{
    const a=progDigest(NEW.buildProgram(soloCfg(t,g,rest,1001)));
    const b=progDigest(OLD.buildProgram(soloCfg(t,g,rest,1001)));
    console.log(`  ${g} rest=[${rest.join(',')||'none'}]  ${a===b?'IDENTICAL':'MOVED  '+a+' vs '+b}`);
  });
});
console.log(`\n== F. HALF_MANNY  new ${progDigest(NEW.buildProgram(NEW.fixtures.HALF_MANNY))}  slice6 ${progDigest(OLD.buildProgram(OLD.fixtures.HALF_MANNY))} ==`);

// ══════════════════════════════════════════════════════════════════════════════
// SLICE 7c RE-SCOPE. Slice 7b's TASK 3 proved the three-day row is reached by
// MULTI-SPORT pace only (D130 emptied the single-sport fallback). D113's population
// is therefore run+bike and run+swim, not the four-day single-sport calendars.
// Everything below is built evidence on that population.
// ══════════════════════════════════════════════════════════════════════════════
function msCfg(rest, seed, extra){
  const c = paceCfg(rest, seed);
  c.cardioTypes = ['run', extra];
  c.cardioGoals[extra] = (extra==='bike')
    ? { id:'bike_base', label:'Base', baselineDist:'10', baseline:'10mi' }
    : { id:'swim_base', label:'Base', baselineDist:'1000', baseline:'1000m' };
  return c;
}
// ── INDEPENDENT ADJACENCY ORACLE (D130's split, written from the ruling text) ──
// hard run = INT, CHI, long LSD.  tolerated = CHI immediately before the long.
// untolerated = every other hard pair on adjacent days, including any quality the
// day AFTER the long. Circular over the 7-day week, same lens as spaceHardCardio.
const POS = d => DAYS.indexOf(d);
const CIRC = (a,b)=>{ const r=Math.abs(POS(a)-POS(b)); return Math.min(r,7-r); };
const PREVD = d => DAYS[(POS(d)+6)%7];
function adj(runs){
  const hd = runs.filter(r=>r.t==='int'||r.t==='chi'||r.t==='long');
  const longR = hd.find(r=>r.t==='long');
  let untol=0, tol=0; const pairs=[];
  for(let a=0;a<hd.length;a++) for(let b=a+1;b<hd.length;b++){
    const x=hd[a], y=hd[b]; if(CIRC(x.day,y.day)!==1) continue;
    const chiEve = longR && ((x.t==='chi' && y.day===longR.day && x.day===PREVD(longR.day))
                          || (y.t==='chi' && x.day===longR.day && y.day===PREVD(longR.day)));
    if(chiEve){ tol++; pairs.push('TOL '+x.t+'@'+x.day+'|'+y.t+'@'+y.day); }
    else { untol++; pairs.push('UNT '+x.t+'@'+x.day+'|'+y.t+'@'+y.day); }
  }
  return {untol, tol, pairs};
}

// ── G. MULTI-SPORT LATTICE, BEFORE AND AFTER ────────────────────────────────
console.log('\n== G. MULTI-SPORT PACE: 64 calendars x {bike,swim}, seed 1001, week 1 ==');
const msMoved=[], msThree=[];
['bike','swim'].forEach(extra=>{
  let moved=0, three=0, tot=0;
  [3,2,1,0].forEach(nRest=>combos(DAYS,nRest).forEach(rest=>{
    tot++;
    const rn=runsOf(NEW.buildProgram(msCfg(rest,1001,extra)).weeks['1']);
    const ro=runsOf(OLD.buildProgram(msCfg(rest,1001,extra)).weeks['1']);
    if(rn.length===3){ three++; msThree.push({extra,rest}); }
    if(shapeOf(rn)!==shapeOf(ro)){ moved++;
      msMoved.push(`  run+${extra} ${7-nRest}d rest=[${rest.join(',')||'none'}]\n      before: ${shapeOf(ro)}\n      after : ${shapeOf(rn)}`); }
  }));
  console.log(`  run+${extra}: moved ${moved}/${tot}   three-run calendars ${three}/${tot}`);
});
console.log('  -- every moved multi-sport calendar --');
msMoved.forEach(s=>console.log(s));

// ── H. ONE MULTI-SPORT PROGRAM IN FULL, WITH LIFT SECTIONS ──────────────────
function fullWeek(p, wk){
  const out=[];
  ['mon','tue','wed','thu','fri','sat','sun'].forEach(d=>{
    const day=p.weeks[wk] && p.weeks[wk][d]; if(!day) return;
    const c=day.cardio; const cs = c ? (Array.isArray(c)?c:[c]) : [];
    const cardio = cs.map(x=>x.type+':'+String(x.subtype||x.type).replace(/\s*\(.*/,'')+(x.legLoad?'[legLoad]':'')).join(' + ');
    const secs=(day.sections||[]).map(s=>(s.label||s.coreHeader||'?')+'['+(s.items||[])
      .map(i=>String(i.name).replace(/<svg[\s\S]*?<\/svg>\s*/g,'')).join(', ')+']').join(' | ');
    out.push(`    ${d.toUpperCase()}${day.rest?' REST':''} | ${day.title||'-'} | ${cardio||'no cardio'}\n       ${secs||'(no lift sections)'}`);
  });
  return out.join('\n');
}
if(msThree.length){
  const f = msThree.find(x=>x.extra==='bike') || msThree[0];
  const pn=NEW.buildProgram(msCfg(f.rest,1001,f.extra)), po=OLD.buildProgram(msCfg(f.rest,1001,f.extra));
  console.log(`\n== H. FULL BEFORE/AFTER — run+${f.extra}, rest=[${f.rest.join(',')||'none'}], seed 1001, WEEK 1, lift sections included ==`);
  console.log('  ---- BEFORE (slice 7b) ----\n'+fullWeek(po,'1'));
  console.log('  ---- AFTER (slice 7c) ----\n'+fullWeek(pn,'1'));
  const ks=Object.keys(pn.weeks).sort((a,b)=>+a-+b);
  console.log('  ---- run shape, every week ----');
  ks.forEach(wk=>console.log(`    W${wk}  before ${shapeOf(runsOf(po.weeks[wk]))}   |   after ${shapeOf(runsOf(pn.weeks[wk]))}`));
}

// ── I. THE THING TO CHECK HARD: untolerated adjacency on multi-sport ────────
console.log('\n== I. UNTOLERATED HARD-RUN ADJACENCY, multi-sport pace lattice ==');
let msW=0, msUnt=0, msTol=0, msBoth=0, msOne=0, msFlip=0, msProg=0;
const untEx=[], oneEx=[], flipEx2=[];
['bike','swim'].forEach(extra=>{
  let eW=0, eUnt=0, eTol=0;
  [3,2,1,0].forEach(nRest=>combos(DAYS,nRest).forEach(rest=>{
    SEEDS.forEach(seed=>{
      const p=NEW.buildProgram(msCfg(rest,seed,extra)); msProg++;
      const bags=new Set();
      Object.keys(p.weeks).forEach(wk=>{
        const r=runsOf(p.weeks[wk]); if(!r.length) return;
        msW++; eW++; bags.add(bag(r));
        const a=adj(r);
        if(a.untol>0){ msUnt++; eUnt++; if(untEx.length<12) untEx.push(`  UNTOL run+${extra} ${7-nRest}d rest=[${rest.join(',')||'none'}] seed=${seed} W${wk} ${shapeOf(r)}  ${a.pairs.join(' ; ')}`); }
        if(a.tol>0){ msTol++; eTol++; }
        const ts=new Set(r.map(x=>x.t));
        if(ts.has('int')&&ts.has('chi')) msBoth++;
        else { msOne++; if(oneEx.length<8) oneEx.push(`  ONE-QUALITY run+${extra} ${7-nRest}d rest=[${rest.join(',')||'none'}] seed=${seed} W${wk} ${shapeOf(r)}`); }
      });
      if(bags.size>1){ msFlip++; if(flipEx2.length<6) flipEx2.push(`  BAG FLIPS run+${extra} rest=[${rest.join(',')||'none'}] seed=${seed} bags=${[...bags].join(' | ')}`); }
    });
  }));
  console.log(`  run+${extra}: weeks ${eW}   untolerated weeks ${eUnt}/${eW}   tolerated weeks ${eTol}/${eW}`);
});
console.log(`  TOTAL multi-sport pace weeks: ${msW}   UNTOLERATED: ${msUnt}/${msW}   tolerated(CHI-on-eve): ${msTol}/${msW}`);
console.log(`  weeks carrying BOTH int and chi: ${msBoth}/${msW}   one-quality weeks: ${msOne}/${msW}`);
console.log(`  programs whose run-type multiset changes across weeks: ${msFlip}/${msProg}  (expect 0 -> crossover retired)`);
untEx.forEach(s=>console.log(s)); oneEx.forEach(s=>console.log(s)); flipEx2.forEach(s=>console.log(s));

// ── J. MULTI-SPORT NON-PACE MUST NOT MOVE ───────────────────────────────────
console.log('\n== J. MULTI-SPORT CONTROL: run_base + bike/swim must be byte-identical ==');
['bike','swim'].forEach(extra=>{
  [['sun','wed'],['sun','wed','fri'],[]].forEach(rest=>{
    const c=msCfg(rest,1001,extra); c.cardioGoals.run={id:'run_base',label:'Base',baselineDist:'3',baseline:'3mi',mileBestMins:'8',mileBestSecs:'30'};
    const a=progDigest(NEW.buildProgram(c)), b=progDigest(OLD.buildProgram(JSON.parse(JSON.stringify(c))));
    console.log(`  run_base+${extra} rest=[${rest.join(',')||'none'}]  ${a===b?'IDENTICAL':'MOVED '+a+' vs '+b}`);
  });
});

// ── K. THE STOP CHECK: is the untolerated collision NEW, and is it FIXABLE? ──
// Section I counts what ships. This section answers the two questions that decide
// whether it is a build defect or a ruling question:
//   K1  baseline vs candidate untolerated counts, split by run count.
//   K2  a permutation oracle over the SAME chosen run days: is there any assignment
//       of {int, chi, long} to those days with untol==0? If yes the collision is a
//       placement failure (spaceHardCardio cannot see typed adjacency). If no, the
//       day SET itself cannot hold three hard runs and that is coach's call.
console.log('\n== K. UNTOLERATED: NEW vs INHERITED, AND FIXABILITY ==');
function permsOf(a){ if(!a.length) return [[]]; const o=[]; a.forEach((x,i)=>permsOf(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>o.push([x,...p]))); return o; }
function minUntol(days){
  let best=99, ex=null;
  permsOf(['int','chi','long']).forEach(p=>{
    const r=days.map((d,i)=>({day:d,t:p[i]}));
    const a=adj(r);
    if(a.untol<best || (a.untol===best && ex && a.tol<ex.tol)){ best=a.untol; ex={shape:shapeOf(r),tol:a.tol}; }
  });
  return {best, ex};
}
const byN = {};   // runCount -> {oldW, newW, oldUnt, newUnt}
let newlyBad=0, fixable=0, unfixable=0; const fixEx=[], unfixEx=[];
const badCals = new Set();
['bike','swim'].forEach(extra=>{
  [3,2,1,0].forEach(nRest=>combos(DAYS,nRest).forEach(rest=>{
    SEEDS.forEach(seed=>{
      const pn=NEW.buildProgram(msCfg(rest,seed,extra));
      const po=OLD.buildProgram(msCfg(rest,seed,extra));
      Object.keys(pn.weeks).forEach(wk=>{
        const rn=runsOf(pn.weeks[wk]); if(!rn.length) return;
        const ro=runsOf(po.weeks[wk]);
        const n=rn.length; byN[n]=byN[n]||{w:0,oldUnt:0,newUnt:0};
        byN[n].w++;
        const an=adj(rn), ao=adj(ro);
        if(ao.untol>0) byN[n].oldUnt++;
        if(an.untol>0){
          byN[n].newUnt++;
          if(ao.untol===0) newlyBad++;
          if(n===3){
            const key=extra+'|'+(rest.join(',')||'none');
            if(!badCals.has(key)){
              badCals.add(key);
              const m=minUntol(rn.map(r=>r.day));
              if(m.best===0){ fixable++; if(fixEx.length<20) fixEx.push(`  FIXABLE   run+${extra} rest=[${rest.join(',')||'none'}] ships ${shapeOf(rn)} (untol ${an.untol})  ->  untol 0 exists: ${m.ex.shape}`); }
              else { unfixable++; if(unfixEx.length<20) unfixEx.push(`  UNFIXABLE run+${extra} rest=[${rest.join(',')||'none'}] ships ${shapeOf(rn)} (untol ${an.untol})  ->  best permutation untol ${m.best}: ${m.ex.shape}`); }
            }
          }
        }
      });
    });
  }));
});
console.log('  K1 by run count (multi-sport pace, 64 cal x 2 sports x 9 seeds, every week):');
Object.keys(byN).sort().forEach(n=>console.log(`     ${n} run(s)/wk: weeks ${byN[n].w}   untolerated BEFORE ${byN[n].oldUnt}   AFTER ${byN[n].newUnt}`));
console.log(`  K1 weeks that go from untolerated==0 to untolerated>0: ${newlyBad}`);
console.log(`  K2 distinct three-run calendars shipping untolerated: ${badCals.size}   FIXABLE by permutation ${fixable}   UNFIXABLE ${unfixable}`);
fixEx.forEach(s=>console.log(s)); unfixEx.forEach(s=>console.log(s));
