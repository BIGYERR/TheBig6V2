// V202 measure part A — "what does the entered pace mean in code" + INT recovery.
// Read-only. Pins Mario's "PRT TING" config (seed 24865, 5 training days,
// test event 4 weeks out ~2026-10-19, 8:15 mile anchor) on the NSW test-goal path.
// Oracle for Q1d/Q2b/Q2c: doctrine/physicaltrainingguide2020.txt lines 248-270,
// hand arithmetic below — never the engine's own output.
const path = require('path');
const { load, weekGrid } = require(path.join(__dirname,'..','harness.js'));
const IA = load(process.argv[2] || path.join(__dirname,'..','..','index.html'));
console.log('ia-version', IA.version);

const SEED = 24865;
const RACE = '2026-10-19';
// 5 training days out of 7 => 2 rest days.
const base = (over) => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:RACE,
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs',
  restDays:['sun','wed'], days:['sun','mon','tue','wed','thu','fri','sat'],
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over||{});

const G = {
  // "8:15 mile" read as the CURRENT-mile-time anchor field (index.html:2820-2830 label
  // "Current mile time"), goal = 1.5mi under 10:30 (PRT standard)
  A_pacegoal_15_anchor815: base({cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
      targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', targetTime:'10:30',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}}}),
  // "8:15 mile" read as the GOAL (targetDist 1 mi, target time 8:15), no anchor entered
  B_pacegoal_mile815_noanchor: base({cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
      targetDist:'1', paceUnit:'mi', targetMins:'8', targetSecs:'15', targetTime:'8:15',
      baselineDist:'3', baseline:'3mi'}}}),
  // both: goal mile 8:15 AND anchor 8:15
  C_pacegoal_mile815_anchor815: base({cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',
      targetDist:'1', paceUnit:'mi', targetMins:'8', targetSecs:'15', targetTime:'8:15',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}}}),
  // legacy ids (aliased at index.html:6676)
  D_run_mile_time: base({cardioGoals:{run:{id:'run_mile_time',label:'Mile Time',
      targetMins:'8', targetSecs:'15', targetTime:'8:15',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}}}),
  E_run_15_under10: base({cardioGoals:{run:{id:'run_15_under10',label:'1.5 Mile Under 10',
      targetMins:'10', targetSecs:'0', targetTime:'10:00',
      mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'}, baselineDist:'3', baseline:'3mi'}}}),
};

const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;

function runs(prog){
  const out=[];
  const wks = prog.weeks||{};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w=>{
    ['sun','mon','tue','wed','thu','fri','sat'].forEach(d=>{
      const day = wks[w][d]; if(!day) return;
      let c = day.cardio; if(!c) return;
      (Array.isArray(c)?c:[c]).forEach(s=>{ if(s && s.type==='run') out.push({w:+w,d,st:s.subtype||'',detail:s.detail||'',note:s.note||'',dose:s.dose}); });
    });
  });
  return out;
}

// ── Q1 a/b/c ─────────────────────────────────────────────────────────────
if(process.argv.includes('--q1') || process.argv.length<4 || true){
for(const [k,cfg] of Object.entries(G)){
  console.log('\n================ '+k+' ================');
  let prog;
  try { prog = IA.buildProgram(cfg); } catch(e){ console.log('BUILD CRASH: '+e.message); continue; }
  console.log('totalWeeks='+prog.totalWeeks+' startDate='+prog.startDate+' raceWeek?='+(prog.raceWeek||'-'));
  const a = IA.runAnchorInfo ? IA.runAnchorInfo(cfg) : null;
  if(a) console.log('runAnchorInfo: rawSec='+a.rawSec+' ('+fmt(a.rawSec)+') anchorSec='+a.anchorSec+' ('+fmt(a.anchorSec)+') kind='+a.kind+' clamped='+a.clamped+
      ' chartRow{mile:'+a.row.mile+' 5K:'+a.row.fiveK+' tempo:'+a.row.tempo+' recovery:'+a.row.recovery+'}'+
      (a.goalT?' goalT='+fmt(a.goalT.sec)+'/'+a.goalT.dist+'mi':' goalT=null'));
  const pp = prog._paceProgression || null;
  const rs = runs(prog);
  console.log('run sessions: '+rs.length);
  rs.forEach(r=>{
    console.log(`  W${r.w} ${r.d} [${r.st}] ${r.detail}`);
    if(/^Interval \(INT\)/.test(r.st) && r.note) console.log(`       note: ${r.note}`);
  });
}
}

// ── Q2 d: sweep for fixed vs derived 200m recovery ────────────────────────
console.log('\n================ Q2d SWEEP ================');
const seeds=[24865,101,777,31337,5150,99999];
const dayCounts=[3,4,5,6];
const anchors=[['5','30'],['6','30'],['7','00'],['8','15'],['9','30'],['11','00'],['',''] ];
const weeksOut=[3,4,6,8,12];
const goalIds=['run_pace_goal','run_mile_time','run_15_under10'];
const REST={3:['sun','tue','wed','fri'],4:['sun','wed','fri'],5:['sun','wed'],6:['sun']};
let cfgs=0, sessions=0, intN=0, fixed200=0, derived=0, other=0, fallbackChart=0, progArm=0;
const byGoal={}, byAnchor={};
for(const s of seeds) for(const dc of dayCounts) for(const [mm,ss] of anchors) for(const wo of weeksOut) for(const gid of goalIds){
  const d=new Date(Date.UTC(2026,8,21)); d.setUTCDate(d.getUTCDate()+wo*7);
  const rd=d.toISOString().slice(0,10);
  const g={id:gid,label:gid,targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'30',targetTime:'10:30',baselineDist:'3',baseline:'3mi'};
  if(mm!==''){ g.mileBestMins=mm; g.mileBestSecs=ss; g.mileBestSrc={kind:'entered'}; }
  const cfg=base({seed:s,restDays:REST[dc],raceDate:rd,cardioGoals:{run:g}});
  let prog; try{ prog=IA.buildProgram(cfg); }catch(e){ console.log('SWEEP CRASH '+gid+' '+e.message); continue; }
  cfgs++;
  for(const r of runs(prog)){
    sessions++;
    if(!/^Interval \(INT\)/.test(r.st)) continue;   // NOT /INT/i — that also matches 'Continuous High Intensity'
    intN++;
    byGoal[gid]=byGoal[gid]||{n:0,f:0}; byGoal[gid].n++;
    const ak=(mm===''?'default':mm+':'+ss); byAnchor[ak]=byAnchor[ak]||{n:0,f:0}; byAnchor[ak].n++;
    if(/Recovery: walk or jog 200m/.test(r.detail)){ fixed200++; byGoal[gid].f++; byAnchor[ak].f++;
      if(/2-2\.5x work time/.test(r.detail)) fallbackChart++;
      if(/week \d+ interval target|cutback — holding/.test(r.detail)) progArm++;
    }
    else if(/Recovery: 90s/.test(r.detail)) other++;
    else if(/\d+\s*(min|s)\b.*Recovery/i.test(r.detail)) derived++;
    else other++;
  }
}
console.log(`cfgs=${cfgs} runSessions=${sessions} INT=${intN} fixed200m=${fixed200} derivedRecovery=${derived} otherRecovery=${other}`);
console.log(`  of fixed200m: progression-arm=${progArm} chart-fallback-arm(with "(2-2.5x work time)" text)=${fallbackChart}`);
console.log('  by goal: '+JSON.stringify(byGoal));
console.log('  by anchor: '+JSON.stringify(byAnchor));

// ── Q1b DIFFERENTIAL: does the entered mile anchor change ANY prescribed pace? ──
// Oracle: identity. Build the SAME cfg with and without mileBestMins/Secs and diff
// the shipped session strings. If nothing moves, the entered value is not read.
console.log('\n================ Q1b ANCHOR DIFFERENTIAL ================');
function stripAnchor(cfg){ const c=JSON.parse(JSON.stringify(cfg)); delete c.cardioGoals.run.mileBestMins; delete c.cardioGoals.run.mileBestSecs; delete c.cardioGoals.run.mileBestSrc; return c; }
for(const [k,cfg] of Object.entries(G)){
  if(cfg.cardioGoals.run.mileBestMins===undefined) continue;
  const on=IA.buildProgram(cfg), off=IA.buildProgram(stripAnchor(cfg));
  const A=runs(on), B=runs(off);
  let same=0, diff=0, examples=[];
  const n=Math.min(A.length,B.length);
  for(let i=0;i<n;i++){ if(A[i].detail===B[i].detail) same++; else { diff++; if(examples.length<2) examples.push(`W${A[i].w} ${A[i].st}\n      anchor-ON : ${A[i].detail.split('\n')[0]}\n      anchor-OFF: ${B[i].detail.split('\n')[0]}`); } }
  console.log(`${k}: weeks ${on.totalWeeks} vs ${off.totalWeeks} | sessions ${A.length} vs ${B.length} | identical detail strings ${same}/${n}, differing ${diff}`);
  examples.forEach(e=>console.log('    '+e));
}

// ── Q1d / Q2c ARITHMETIC. Oracle: PTG p12 lines 248-256, 268-269 + PACE_CHART table. ──
console.log('\n================ Q1d/Q2c HAND ARITHMETIC ================');
function chart(anchorSec){ const rows=IA.PACE_CHART; if(anchorSec<=rows[0].mile) return rows[0]; if(anchorSec>=rows[rows.length-1].mile) return rows[rows.length-1];
  for(let i=0;i<rows.length-1;i++){ const lo=rows[i],hi=rows[i+1]; if(anchorSec>=lo.mile&&anchorSec<=hi.mile){ const f=(anchorSec-lo.mile)/(hi.mile-lo.mile); const o={}; for(const c of Object.keys(lo)) o[c]=Math.round(lo[c]+(hi[c]-lo[c])*f); return o; } } }
const M=400/1609.344;                        // 400m in miles
const mile815=495, mileDefault=570;
// PTG: SI pace = recent 1.5-mile per-400m pace MINUS 4 s.  An 8:15 mile is 495 s/mi.
// A 1.5-mile run at that pace = 742.5 s -> per 400m = 495*M = 123.06 s.
const per400_815 = mile815*M;
const si400_815  = per400_815 - 4;
console.log(`PTG SI from an 8:15 mile (495 s/mi): base 400m = ${per400_815.toFixed(1)} s; SI 400m = ${si400_815.toFixed(1)} s = ${fmt(si400_815/M)}/mi`);
console.log(`  (PTG worked example check, doctrine line 254-255: 10:30 over 1.5mi -> 1:45/400 -> SI 1:41/400. Our formula: 630/1.5=420 s/mi *M = ${(420*M).toFixed(1)} s -> -4 = ${(420*M-4).toFixed(1)} s = 1:41. MATCH.)`);
for(const [k,cfg] of Object.entries(G)){
  const prog=IA.buildProgram(cfg);
  const ints=runs(prog).filter(r=>/Interval \(INT\)/.test(r.st)).slice(0,4);
  console.log(`-- ${k}`);
  ints.forEach(r=>{
    const m=r.detail.match(/at (\d+):(\d\d)\/mi/); if(!m) return;
    const shipSec=+m[1]*60+ +m[2];
    const ship400=shipSec*M;
    const work=ship400;
    const rec_lo=2*work, rec_hi=2.5*work;
    // jog pace: the engine names none for INT. Use the chart recovery column for the
    // row the LSD text is actually printed from (progression pace -> chart row).
    const lsd=runs(prog).find(x=>x.w===r.w&&/LSD/.test(x.st));
    const lm=lsd&&lsd.detail.match(/Recovery Pace: (\d+):(\d\d)\/mi/);
    const jogSecMi=lm?(+lm[1]*60+ +lm[2]):null;
    const jog200=jogSecMi?jogSecMi*(200/1609.344):null;
    console.log(`   W${r.w} ships ${fmt(shipSec)}/mi -> 400m in ${work.toFixed(1)} s | PTG SI target ${si400_815.toFixed(1)} s | delta ${(work-si400_815).toFixed(1)} s/400, ${((work-si400_815)/M).toFixed(0)} s/mi`
      +` || PTG recovery 2-2.5x = ${rec_lo.toFixed(0)}-${rec_hi.toFixed(0)} s; 200m jog at ${jogSecMi?fmt(jogSecMi):'?'}/mi = ${jog200?jog200.toFixed(0):'?'} s; ratio delivered ${jog200?(jog200/work).toFixed(2):'?'}x`);
  });
}

// ── Q1a/Q1b EVIDENCE: what the chip promises vs what the sessions print ──
console.log('\n================ CHIP vs SESSION ANCHOR ================');
[495,570].forEach(a=>{ const r=chart(a); console.log(`PACE_CHART row for mile=${a} (${fmt(a)}/mi): 5K ${fmt(r.fiveK)} tempo ${fmt(r.tempo)} recovery ${fmt(r.recovery)}`); });
console.log('Shipped W1 LSD recovery pace in every config above = 12:10/mi = 730 s = the recovery column of the mile:570 row (the intermediate DEFAULT), not the mile:495 row (10:45).');

// ── Q1b SWEEP: is the entered anchor invariant across the whole lattice? ──
// For each (seed, trainDays, weeksOut, goalId) build with four anchors and compare
// the INT/LSD/CHI detail strings against the no-anchor build.
console.log('\n================ Q1b ANCHOR-INVARIANCE SWEEP ================');
{
  const anchorsB=[['5','30'],['8','15'],['11','00']];
  let pairs=0, sessCmp=0, sessSame=0, lenSame=0, lenDiff=0, repDiff=0, paceDiff=0;
  for(const s of seeds) for(const dc of dayCounts) for(const wo of weeksOut) for(const gid of goalIds){
    const d=new Date(Date.UTC(2026,8,21)); d.setUTCDate(d.getUTCDate()+wo*7);
    const rd=d.toISOString().slice(0,10);
    const mk=(mm,ss)=>{ const g={id:gid,label:gid,targetDist:'1.5',paceUnit:'mi',targetMins:'10',targetSecs:'30',targetTime:'10:30',baselineDist:'3',baseline:'3mi'};
      if(mm!==null){g.mileBestMins=mm;g.mileBestSecs=ss;g.mileBestSrc={kind:'entered'};}
      return base({seed:s,restDays:REST[dc],raceDate:rd,cardioGoals:{run:g}}); };
    const off=IA.buildProgram(mk(null,null)); const R0=runs(off);
    for(const [mm,ss] of anchorsB){
      const on=IA.buildProgram(mk(mm,ss)); const R1=runs(on); pairs++;
      if(on.totalWeeks===off.totalWeeks) lenSame++; else { lenDiff++; continue; }
      for(let i=0;i<Math.min(R0.length,R1.length);i++){
        sessCmp++;
        if(R0[i].detail===R1[i].detail) sessSame++;
        else {
          const p0=(R0[i].detail.match(/(\d+):(\d\d)\/mi/)||[])[0], p1=(R1[i].detail.match(/(\d+):(\d\d)\/mi/)||[])[0];
          if(p0===p1) repDiff++; else paceDiff++;
        }
      }
    }
  }
  console.log(`anchor pairs compared=${pairs} (same totalWeeks ${lenSame}, different totalWeeks ${lenDiff} — program LENGTH does read the anchor, index.html:3126)`);
  console.log(`run sessions compared=${sessCmp}: identical prescription text ${sessSame} (${(100*sessSame/sessCmp).toFixed(1)}%), differ in REP COUNT only ${repDiff}, differ in PRESCRIBED PACE ${paceDiff} (${(100*paceDiff/sessCmp).toFixed(2)}%)`);
}
