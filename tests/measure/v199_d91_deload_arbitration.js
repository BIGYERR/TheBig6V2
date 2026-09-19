// ════════════════════════════════════════════════════════════════════════════════════
// v199_d91_deload_arbitration.js — MEASURE PASS (read-only; rules nothing, fixes nothing)
//
// QUESTION (D91, coach's mandatory counterfactual): recoveryDeload keeps its ONE surviving
// accessory block by PUSH ORDER (index.html:9398, first-come). On a deload leg day that is
// 'Leg superset A' (lunge + knee hold, a unilateral SQUAT pattern, pushed at 8289/8291)
// while 'Leg superset B' (the day's hinge/hip_ext, pushed at 8309) is deleted.
// D91 as ruled keeps the block holding the pattern the card does not otherwise carry.
// Coach refused to sign a build whose REALISED week count nobody printed. This prints it.
//
// WHAT IS MEASURED (all on the 1,728-key d88/d85 lattice, 4 injury states, seeds pinned)
//   1. a pattern-first recoveryDeload counterfactual, applied to a COPY (anchors count==1;
//      index.html is NEVER written), plus a __DELOAD_OFF control (already shipped, 9374).
//   2. the realised flip at THREE stages: after recoveryDeload, after capRegionalFatigue,
//      after capSessionBudget (the shipped card).
//   3. coach's pinned equalities (Leg superset A/B kept+dropped, Leg isolation, Explosive
//      finisher, days taken >0 -> 0).
//   4. card section-label ORDER before/after on affected days.
//   5. the trap: cards where the MAIN carries hinge/hip_ext and NO accessory does — the
//      population a naive pre-pass over all sections would strip of every accessory.
//   6. controls: home_basic / minimal / knee-protect zero-weeks; fixtures.HALF_MANNY digest.
//   7. non-deload weeks byte-identical (per-week sha of prog.weeks[w], base vs cf).
//
// ORACLE INDEPENDENCE
//   Posterior is a HAND regex table (E_PAT) typed from the doctrine movement names, with a
//   blindness probe, identical to v199_d88_leg_draw.js. _pattern() is never the oracle.
//   E_POSTERIOR = {hinge, hip_ext} — D85's shipped lens (index.html:9523). This file does
//   NOT copy v198_d85_posterior_floor.js:91, which wrongly counts leg_iso as posterior.
//   The counterfactual stub is the HYPOTHESIS, not the instrument: every number below is
//   read off the section snapshots, never off the stub's own bookkeeping.
//
// USAGE  node tests/measure/v199_d91_deload_arbitration.js [artifact.html] [shards]
// ════════════════════════════════════════════════════════════════════════════════════
const path = require('path');
const fs   = require('fs');
const os   = require('os');
const crypto = require('crypto');
const { fork } = require('child_process');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));

// ── lattice: v198_d85_posterior_floor / v199_d88 verbatim (1728 config keys) ─────────
const E_TIERS = ['commercial','home_full','crossfit','home_basic','bodyweight','minimal'];
const E_FOCUS = ['hypertrophy','balanced'];
const E_EXPS  = ['beginner','advanced'];
const E_GOALS = [ { k:'liftonly', id:null }, { k:'pace', id:'run_pace_goal' }, { k:'half', id:'run_half' } ];
const E_INJ   = [ { k:'healthy', v:null },
                  { k:'shoulder/protect', v:{ region:'shoulder', tier:'protect' } },
                  { k:'lowback/protect',  v:{ region:'lowback',  tier:'protect' } },
                  { k:'knee/protect',     v:{ region:'knee',     tier:'protect' } } ];
const E_RESTS = [ { k:'sun', v:['sun'] }, { k:'sun+wed', v:['sun','wed'] }, { k:'sat+sun', v:['sat','sun'] } ];
const E_SEEDS = [1013, 3039];
function eCfg(tier, focus, exp, g, inj, rest, seed) {
  const isRace = !!g.id && /5k|10k|half|marathon/.test(g.id);
  return {
    name:'M', primaryPath: g.id ? (isRace ? 'event' : 'cardio') : 'lift',
    cardioTypes: g.id ? ['run'] : [],
    cardioGoals: g.id ? { run:{ id:g.id, label:g.k, mileBestMins:'10', mileBestSecs:'30',
                                baselineDist:'5', baseline:'5mi', targetDist:'1.5', targetMins:'11', targetSecs:'0' } } : {},
    eventTargeted: isRace, raceDate: isRace ? '2026-12-06' : null,
    liftingFocus: focus, experience: exp, ageBracket:'18-35',
    equipment: tier, unit:'lbs', restDays: rest.v.slice(),
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:135, squat:155, deadlift:185, seed,
  };
}
const LAT = [];
for (const t of E_TIERS) for (const f of E_FOCUS) for (const x of E_EXPS) for (const g of E_GOALS)
  for (const i of E_INJ) for (const r of E_RESTS) for (const sd of E_SEEDS) {
    const c = eCfg(t,f,x,g,i,r,sd);
    if (i.v) c.injury = { region:i.v.region, tier:i.v.tier };
    LAT.push({ key:`${t}|${f}|${x}|${g.k}|${i.k}|${r.k}|${sd}`,
               tier:t, focus:f, exp:x, goal:g.k, inj:i.k, rest:r.k, seed:sd, cfg:c });
  }

// ── HAND ORACLE (typed from doctrine names; _pattern is not the source) ─────────────
const E_PAT = [
  ['calf_iso', /calf|calves|plantarflex/i],
  ['hip_ext',  /hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-?through/i],
  ['leg_iso',  /leg curl|leg extension|hamstring curl/i],
  ['hinge',    /deadlift|\brdl\b|romanian|good morning|\bswing\b|\bclean\b|\bsnatch\b|hinge|rack pull/i],
];
const ePat = n => { const t = String(n||''); for (const [p,r] of E_PAT) if (r.test(t)) return p; return null; };
const E_POSTERIOR = new Set(['hinge','hip_ext']);
const isPost = n => E_POSTERIOR.has(ePat(n));
const postCount = names => names.reduce((a,n) => a + (isPost(n) ? 1 : 0), 0);
function probe(){
  const cases = [
    ['Back squat',0],['Leg extension',0],['Lying leg curl',0],['Leg press',0],['Dumbbell standing calf raise',0],
    ['Dumbbell Bulgarian split squat',0],['Wall sit',0],
    ['Nordic hamstring curl (anchored)',1],['Single-leg glute bridge',1],['Single-leg hip thrust',1],
    ['Barbell Romanian deadlift',1],['Banded hip thrust',1],['45° back extension',1],['Kettlebell swing',1],
  ];
  let bad=0; cases.forEach(([n,e])=>{ const g=postCount([n]); if(g!==e){ bad++; console.log('  PROBE MISS '+n+' -> '+g+' expected '+e); } });
  console.log('PROBE hand oracle: '+cases.length+' cases, '+bad+' miss :: '+(bad?'DETECTOR BROKEN':'OK'));
  if(bad) process.exit(3);
}

// ── INSTRUMENTATION (all on a COPY in tmpdir; artifact never written) ───────────────
// A/B: split the four-pass composition at index.html:9790 so each stage is snapshotted.
const A_PIPE = "      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:capRegionalFatigue((_s=>isRecoveryWeek(w)?recoveryDeload(_s):_s)(applyInjuryFilter(buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext}),cfg)),role,cardio,goal)};";
const A_PIPE_R = [
"      var __p0=buildSections(role,w,{fullVariant,wantCarry:d===carryHost,cardio,hotNext});",
"      var __p1=applyInjuryFilter(__p0,cfg);",
"      var __p2=isRecoveryWeek(w)?recoveryDeload(__p1):__p1;",
"      var __p3=capRegionalFatigue(__p2,role,cardio,goal);",
"      if(typeof globalThis!=='undefined'&&globalThis.__PREC)globalThis.__PREC.push({w:String(w),d:String(d),role:String(role),deload:!!isRecoveryWeek(w),p0:globalThis.__SNAP(__p0),p1:globalThis.__SNAP(__p1),p2:globalThis.__SNAP(__p2),p3:globalThis.__SNAP(__p3)});",
"      weeks[w][d]={title,dot:cardio?cardio.type:'lift',tags,cardio,sections:__p3};"
].join("\n");
const A_CSB   = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=capSessionBudget(_day.sections,_day.cardio); });\n";
const A_CSB_R = "    Object.keys(weeks[w]).forEach(_d=>{ const _day=weeks[w][_d]; if(_day&&Array.isArray(_day.sections)){ var __mb=_day.sections; _day.sections=capSessionBudget(_day.sections,_day.cardio); if(typeof globalThis!=='undefined'&&globalThis.__MREC) globalThis.__MREC.push({w:String(w),d:String(_d),before:globalThis.__SNAP(__mb),after:globalThis.__SNAP(_day.sections)}); } });\n";

// C/D: THE COUNTERFACTUAL. Pattern-first arbitration among the ACCESSORY CANDIDATES only.
// It is gated behind globalThis.__CF_PATTERN_FIRST, so ONE instrumented copy serves both
// the base and the counterfactual arm and the two arms cannot differ by anything else.
// It uses D85's shipped lens {hinge,hip_ext} via _pattern — no new constant, no new table.
// It does NOT pre-scan Main/primer/power/strength (that is the regression coach named);
// the shape of that trap is COUNTED here instead (mainPost), never implemented.
// Position is preserved by construction: selection only chooses WHICH index survives, the
// keep[] push order is the engine's own section order, untouched.
const A_KEEP   = "  const keep=[]; let accessoryKept=false;\n";
const A_KEEP_R = "  const keep=[]; let accessoryKept=false;\n" + [
"  var __cfIdx=-1;",
"  {",
"    var __cand=[],__mainPost=false;",
"    sections.forEach(function(s,i){ if(!s) return; var L=(s.label||'').toLowerCase();",
"      var __sp=(s.items||[]).some(function(it){ var p=it&&_pattern(it.name); return p==='hinge'||p==='hip_ext'; });",
"      if(/^main\\b|^primer|^power\\b|^strength\\b/.test(L)){ if(__sp) __mainPost=true; return; }",
"      if(s.hip||/hip|mobility|stretch/.test(L)) return;",
"      if(s.optional||/carry|finisher|conditioning|explosive/.test(L)) return;",
"      if(!(s.items||[]).some(function(it){return it&&_pattern(it.name);})) return;",
"      __cand.push({i:i,post:__sp,label:String(s.label||'')});",
"    });",
"    var __post=__cand.filter(function(c){return c.post;});",
"    if(typeof globalThis!=='undefined'&&globalThis.__CFREC) globalThis.__CFREC.push({cand:__cand.length,post:__post.length,mainPost:__mainPost,first:(__cand[0]||{}).label||'',pick:(__post[0]||__cand[0]||{}).label||''});",
"    if(typeof globalThis!=='undefined'&&globalThis.__CF_PATTERN_FIRST&&__post.length) __cfIdx=__post[0].i;",
"  }"
].join("\n") + "\n";
const A_HAS   = "    if(hasLift&&!accessoryKept){ accessoryKept=true; keep.push(s); return; }";
const A_HAS_R = "    if(hasLift&&!accessoryKept&&(__cfIdx<0||sections.indexOf(s)===__cfIdx)){ accessoryKept=true; keep.push(s); return; }";

const SNAP_FN = "globalThis.__SNAP=function(a){return (a||[]).map(function(s){return {l:String((s&&s.label)||''),n:(((s&&s.items)||[]).map(function(i){return String((i&&i.name)||'');}))};});};";

function instrument(artifact){
  let RAW = fs.readFileSync(artifact,'utf8');
  const pairs = [['PIPE',A_PIPE,A_PIPE_R],['CSB',A_CSB,A_CSB_R],['KEEP',A_KEEP,A_KEEP_R],['HAS',A_HAS,A_HAS_R]];
  pairs.forEach(([nm,a,b]) => {
    const n = RAW.split(a).length - 1;
    if(n !== 1){ console.log('FAIL: anchor '+nm+' count='+n+' (expected 1) in '+artifact); process.exit(5); }
    RAW = RAW.replace(a,b);
  });
  const out = path.join(os.tmpdir(), 'v199d91_' + path.basename(artifact).replace(/[^a-z0-9._]/gi,'_') + '_' + process.pid + '.html');
  fs.writeFileSync(out, RAW);
  return out;
}

const secPost = secs => (secs||[]).reduce((a,s)=>a+postCount(s.n||[]),0);
const has = (secs,lab) => (secs||[]).some(s => s.l === lab && (s.n||[]).length);
const LABELS = ['Leg superset A','Leg superset B','Leg isolation','Explosive finisher'];
const sha = s => crypto.createHash('sha256').update(s).digest('hex').slice(0,16);

function blank(){
  return { configs:0, weeks:0, dayCells:0, deloadDayBuilds:0,
    zeroShipped:0, zeroShippedSeg:{}, zeroShippedDeload:0, zeroShippedNonDeload:0,
    zeroAtP2:0, zeroAtP3:0,
    postIn:0, postOutP2:0, postOutP3:0, postShipped:0,
    killedByDeload:0, killedByCap:0, killedByBudget:0,
    capLSBin:0, capLSBkilled:0, budgetLSBin:0, budgetLSBkilled:0,
    lbl:{}, keptDropped:{}, ctrlZero:{}, sections1:0, killedPostLbl:{}, killedKeptLbl:{},
    cfCand:{}, cfPostCand:{}, cfMainPost:0, cfTrap:0, cfTrapAny:0, cfRecs:0, cfFirstVsPick:{},
  };
}

function sweep(artifact, mine){
  const instrPath = instrument(artifact);
  const IA = load(instrPath);
  IA.eval(SNAP_FN + "globalThis.__PREC=[];globalThis.__MREC=[];globalThis.__CFREC=[];globalThis.__CF_PATTERN_FIRST=false;globalThis.__DELOAD_OFF=false;");
  const bump=(o,k)=>{o[k]=(o[k]||0)+1;};

  const MODES = ['base','cf','off'];
  const R = { base:blank(), cf:blank(), off:blank(),
              wk:{},            // (mode|key|w) -> {p2,p3,ship,deload}
              weekSha:{},       // (mode|key|w) -> sha of the week
              orderEx:[], instrInert:{ checked:0, same:0 }, cellEx:[] };

  // instrumentation-inert check: the base arm of the instrumented copy must reproduce the
  // pristine artifact's program digest. Baseline proven equal to itself before any diff.
  const PURE = load(artifact);
  mine.slice(0,6).forEach(L => {
    R.instrInert.checked++;
    if(progDigest(PURE.buildProgram(L.cfg)) === progDigest(IA.buildProgram(L.cfg))) R.instrInert.same++;
  });

  mine.forEach(L => {
    MODES.forEach(m => {
      IA.eval("globalThis.__PREC.length=0;globalThis.__MREC.length=0;globalThis.__CFREC.length=0;"
        + "globalThis.__CF_PATTERN_FIRST="+(m==='cf')+";globalThis.__DELOAD_OFF="+(m==='off')+";");
      const prog = IA.buildProgram(L.cfg);
      const PREC = IA.eval('globalThis.__PREC');
      const CFREC = IA.eval('globalThis.__CFREC');
      const S = R[m]; S.configs++;
      const seg = { inj:L.inj, tier:L.tier, focus:L.focus, exp:L.exp, goal:L.goal };

      CFREC.forEach(c => { S.cfRecs++; bump(S.cfCand,'cand='+c.cand); bump(S.cfPostCand,'post='+c.post);
        if(c.mainPost) S.cfMainPost++;
        if(c.mainPost && c.post===0 && c.cand>0) S.cfTrap++;
        if(c.mainPost && c.post===0) S.cfTrapAny++;
        if(c.first!==c.pick) bump(S.cfFirstVsPick, c.first+' -> '+c.pick); });

      const wkAgg = {};
      PREC.forEach(r => {
        S.dayCells++;
        const a1=secPost(r.p1), a2=secPost(r.p2), a3=secPost(r.p3);
        wkAgg[r.w]=wkAgg[r.w]||{p2:0,p3:0,deload:false};
        wkAgg[r.w].p2+=a2; wkAgg[r.w].p3+=a3; if(r.deload) wkAgg[r.w].deload=true;
        ['p0','p1','p2','p3'].forEach(st => LABELS.forEach(lb => { if(has(r[st],lb)) bump(S.lbl, lb+'@'+st); }));
        if(r.deload){
          S.deloadDayBuilds++; S.postIn+=a1; S.postOutP2+=a2;
          if(a1>0&&a2===0){ S.killedByDeload++;
            // d88's census, reproduced like-for-like: on a day the deload takes from >0
            // posterior to 0, which section label HELD the posterior it dropped, and which
            // label survived instead. This is the denominator coach's 2,160/1,080/60 use.
            (r.p1||[]).forEach(s2=>{ if(postCount(s2.n||[])) bump(S.killedPostLbl, s2.l||'(nolabel)'); });
            (r.p2||[]).forEach(s2=>bump(S.killedKeptLbl, s2.l||'(nolabel)')); }
          LABELS.forEach(lb => { const i=has(r.p1,lb), o=has(r.p2,lb);
            if(i&&!o) bump(S.keptDropped, lb+':dropped'); else if(i&&o) bump(S.keptDropped, lb+':kept'); });
        }
        if(a2>0&&a3===0) S.killedByCap++;
        if(has(r.p2,'Leg superset B')){ S.capLSBin++; if(!has(r.p3,'Leg superset B')) S.capLSBkilled++; }
        S.postOutP3+=a3;
      });
      const MREC = IA.eval('globalThis.__MREC');
      MREC.forEach(r => {
        const b=secPost(r.before), a=secPost(r.after);
        if(b>0&&a===0) S.killedByBudget++;
        if(has(r.before,'Leg superset B')){ S.budgetLSBin++; if(!has(r.after,'Leg superset B')) S.budgetLSBkilled++; }
      });

      const W = prog.weeks||{};
      Object.keys(W).forEach(w => {
        S.weeks++;
        let ship=0; const labOrder=[];
        Object.keys(W[w]).forEach(d => { const day=W[w][d]; if(!day||day.rest||!Array.isArray(day.sections)) return;
          (day.sections||[]).forEach(sec => { labOrder.push(d+':'+String((sec&&sec.label)||''));
            ((sec&&sec.items)||[]).forEach(it => { if(isPost(String((it&&it.name)||''))) ship++; }); }); });
        S.postShipped+=ship;
        const ag = wkAgg[w]||{p2:0,p3:0,deload:false};
        if(ag.p2===0) S.zeroAtP2++;
        if(ag.p3===0) S.zeroAtP3++;
        if(ship===0){ S.zeroShipped++; Object.keys(seg).forEach(k=>bump(S.zeroShippedSeg,k+'='+seg[k]));
          bump(S.zeroShippedSeg,'week=W'+w);
          if(ag.deload) S.zeroShippedDeload++; else S.zeroShippedNonDeload++;
          if(L.tier==='home_basic'||L.tier==='minimal'||L.inj==='knee/protect') bump(S.ctrlZero, L.tier+'|'+L.inj); }
        R.wk[m+'|'+L.key+'|'+w] = { p2:ag.p2, p3:ag.p3, ship, deload:ag.deload };
        R.weekSha[m+'|'+L.key+'|'+w] = sha(JSON.stringify(W[w]));
        if(m==='cf'){ const bo=R.weekSha['base|'+L.key+'|'+w]; }
        if(m==='cf' && R.orderEx.length<8 && ag.deload){
          const baseOrder = R.__ord && R.__ord[L.key+'|'+w];
          if(baseOrder && baseOrder !== labOrder.join(' , '))
            R.orderEx.push({ key:L.key, w:'W'+w, before:baseOrder, after:labOrder.join(' , ') });
        }
        if(m==='base'){ R.__ord = R.__ord||{}; if(Object.keys(R.__ord).length<400000) R.__ord[L.key+'|'+w]=labOrder.join(' , '); }
      });
    });
  });
  delete R.__ord;
  try{ fs.unlinkSync(instrPath); }catch(e){}

  // cross-mode realised flip, computed here (same shard holds both arms)
  const F = { base320:0, cfNonZeroP2:0, cfNonZeroP3:0, cfNonZeroShip:0, lostAtCap:0, lostAtBudget:0,
              stillZeroP2:0, seg:{}, offZero:0, newZero:0, newZeroSeg:{},
              nonDeloadWeeks:0, nonDeloadIdentical:0, deloadWeeks:0, deloadIdentical:0, nonDeloadDiffEx:[] };
  Object.keys(R.wk).forEach(k => {
    if(k.indexOf('base|')!==0) return;
    const rest=k.slice(5), b=R.wk[k], c=R.wk['cf|'+rest], o=R.wk['off|'+rest];
    const key=rest.slice(0,rest.lastIndexOf('|'));
    const segk = key.split('|');
    const bs=R.weekSha[k], cs=R.weekSha['cf|'+rest];
    if(b.deload){ F.deloadWeeks++; if(bs===cs) F.deloadIdentical++; }
    else { F.nonDeloadWeeks++; if(bs===cs) F.nonDeloadIdentical++;
           else if(F.nonDeloadDiffEx.length<6) F.nonDeloadDiffEx.push(rest); }
    if(o && o.ship===0) F.offZero++;
    if(b.ship>0 && c && c.ship===0){ F.newZero++; ['tier','focus','exp','goal','inj'].forEach((a,i)=>{ const v=segk[i]; F.newZeroSeg[a+'='+v]=(F.newZeroSeg[a+'='+v]||0)+1; }); }
    if(b.ship!==0 || !b.deload || !c) return;
    F.base320++;
    ['tier','focus','exp','goal','inj'].forEach((a,i)=>{ const v=segk[i]; F.seg[a+'='+v]=(F.seg[a+'='+v]||0)+1; });
    if(c.p2>0) F.cfNonZeroP2++; else F.stillZeroP2++;
    if(c.p3>0) F.cfNonZeroP3++;
    if(c.ship>0) F.cfNonZeroShip++;
    if(c.p2>0 && c.p3===0) F.lostAtCap++;
    if(c.p3>0 && c.ship===0) F.lostAtBudget++;
  });
  return { base:R.base, cf:R.cf, off:R.off, F, orderEx:R.orderEx, instrInert:R.instrInert };
}

// ── HALF_MANNY + fixtures control, run once in the parent ──────────────────────────
function fixtureControl(artifact){
  const instrPath = instrument(artifact);
  const IA = load(instrPath);
  IA.eval(SNAP_FN + "globalThis.__PREC=null;globalThis.__MREC=null;globalThis.__CFREC=null;globalThis.__CF_PATTERN_FIRST=false;globalThis.__DELOAD_OFF=false;");
  const PURE = load(artifact);
  const pureD = progDigest(PURE.buildProgram(fixtures.HALF_MANNY));
  const baseD = progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  IA.eval("globalThis.__CF_PATTERN_FIRST=true;");
  const cfD = progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  IA.eval("globalThis.__CF_PATTERN_FIRST=false;globalThis.__DELOAD_OFF=true;");
  const offD = progDigest(IA.buildProgram(fixtures.HALF_MANNY));
  IA.eval("globalThis.__DELOAD_OFF=false;");
  try{ fs.unlinkSync(instrPath); }catch(e){}
  return { pureD, baseD, cfD, offD };
}

function merge(a,b){
  Object.keys(b).forEach(k => {
    if(typeof b[k]==='number') a[k]=(a[k]||0)+b[k];
    else if(Array.isArray(b[k])) a[k]=(a[k]||[]).concat(b[k]).slice(0,10);
    else if(b[k]&&typeof b[k]==='object'){ a[k]=a[k]||{}; merge(a[k],b[k]); }
  });
  return a;
}

// ── shard child ────────────────────────────────────────────────────────────────────
if(process.env.MSHARD !== undefined){
  const artifact = process.argv[2];
  const si=parseInt(process.env.MSHARD,10), sn=parseInt(process.env.MSHARDS,10);
  const mine = LAT.filter((_,i)=>i%sn===si);
  fs.writeFileSync(process.env.MOUT, JSON.stringify(sweep(artifact, mine)));
  process.exit(0);
}

// ── parent ─────────────────────────────────────────────────────────────────────────
const artifact = path.resolve(process.argv[2] || path.join(__dirname,'..','..','index.html'));
const SHARDS = parseInt(process.argv[3] || String(Math.min(8, os.cpus().length)), 10);
probe();
const ver = (fs.readFileSync(artifact,'utf8').match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
console.log('ARTIFACT '+artifact+'  ia-version='+ver);
console.log('LATTICE  '+LAT.length+' config keys x 3 arms (base / pattern-first counterfactual / __DELOAD_OFF), '+SHARDS+' shards');
const FX = fixtureControl(artifact);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(),'v199d91-'));
let done=0; const outs=[];
for(let i=0;i<SHARDS;i++){
  const o=path.join(tmp,'s'+i+'.json'); outs.push(o);
  const ch=fork(__filename,[artifact],{env:Object.assign({},process.env,{MSHARD:String(i),MSHARDS:String(SHARDS),MOUT:o}),stdio:'inherit'});
  ch.on('exit',code=>{ if(code!==0){ console.log('FAIL: shard '+i+' exited '+code); process.exit(4); }
    if(++done===SHARDS) report(); });
}
const pct=(n,d)=>d?(100*n/d).toFixed(2)+'%':'n/a';
const top=(o,n)=>Object.keys(o||{}).sort((a,b)=>o[b]-o[a]).slice(0,n).map(k=>k+' '+o[k]);
const ax=(o,a)=>{const r=Object.keys(o||{}).filter(k=>k.indexOf(a+'=')===0).sort((x,y)=>o[y]-o[x]).map(k=>k+' '+o[k]);return r.length?r.join('  '):'(none)';};

function report(){
  let R={}; outs.forEach(o=>R=merge(R,JSON.parse(fs.readFileSync(o,'utf8'))));
  const B=R.base, C=R.cf, O=R.off, F=R.F;
  console.log('\n══ 0. INSTRUMENT SANITY ═════════════════════════════════════════════════');
  console.log('base arm of the instrumented copy == pristine artifact program digest: '
    + R.instrInert.same + ' / ' + R.instrInert.checked + ' configs  ('
    + (R.instrInert.same===R.instrInert.checked?'INERT':'INSTRUMENT PERTURBS THE BUILD — numbers below are void') + ')');
  console.log('day builds instrumented: base '+B.dayCells+'  cf '+C.dayCells+'  off '+O.dayCells
    + '   weeks: base '+B.weeks+'  cf '+C.weeks+'  off '+O.weeks);
  console.log('deload day builds (isRecoveryWeek): base '+B.deloadDayBuilds+'  cf '+C.deloadDayBuilds
    + '  off '+O.deloadDayBuilds+'   (off arm records them but recoveryDeload returns early)');

  console.log('\n══ 1. ZERO-POSTERIOR WEEKS ON THE SHIPPED CARD, PER ARM ══════════════════');
  [['base (V'+ver+' as shipped)',B],['cf (pattern-first recoveryDeload)',C],['off (__DELOAD_OFF control)',O]].forEach(([nm,S])=>{
    console.log('  '+nm.padEnd(38)+' zero weeks '+String(S.zeroShipped).padStart(5)+' / '+S.weeks+' ('+pct(S.zeroShipped,S.weeks)+')'
      +'   of which deload weeks '+S.zeroShippedDeload+', non-deload '+S.zeroShippedNonDeload);
    console.log('      at deload-OUT (p2) '+S.zeroAtP2+'   after capRegionalFatigue (p3) '+S.zeroAtP3+'   shipped '+S.zeroShipped);
    console.log('      posterior ITEMS: into deload '+S.postIn+' -> out of deload '+S.postOutP2+' | after regional cap (all days) '+S.postOutP3+' | shipped '+S.postShipped);
  });
  console.log('  base zero-week segments: ');
  ['inj','tier','focus','exp','goal','week'].forEach(a=>console.log('      '+a.padEnd(6)+' '+ax(B.zeroShippedSeg,a)));
  console.log('  cf zero-week segments: ');
  ['inj','tier','week'].forEach(a=>console.log('      '+a.padEnd(6)+' '+ax(C.zeroShippedSeg,a)));

  console.log('\n══ 2. THE REALISED FLIP — THE 320, AT THREE STAGES ══════════════════════');
  console.log('population: weeks that are DELOAD weeks and ship ZERO posterior on base = '+F.base320);
  ['tier','focus','exp','goal','inj'].forEach(a=>console.log('      '+a.padEnd(6)+' '+ax(F.seg,a)));
  console.log('  under the counterfactual, of those '+F.base320+':');
  console.log('    non-zero immediately after recoveryDeload   '+F.cfNonZeroP2+' ('+pct(F.cfNonZeroP2,F.base320)+')   still zero at p2 '+F.stillZeroP2);
  console.log('    non-zero after capRegionalFatigue           '+F.cfNonZeroP3+' ('+pct(F.cfNonZeroP3,F.base320)+')   lost at the regional cap '+F.lostAtCap);
  console.log('    >>> non-zero on the SHIPPED card            '+F.cfNonZeroShip+' ('+pct(F.cfNonZeroShip,F.base320)+')   lost at capSessionBudget '+F.lostAtBudget);
  console.log('  weeks that go the WRONG way (base ships posterior, cf ships zero): '+F.newZero);
  if(F.newZero) ['tier','inj','goal'].forEach(a=>console.log('      '+a.padEnd(6)+' '+ax(F.newZeroSeg,a)));
  console.log('  __DELOAD_OFF control: deload-week zero-posterior weeks with the pass disabled entirely: '+F.offZero);

  console.log('\n══ 3. COACH\'S PINNED EQUALITIES ═════════════════════════════════════════');
  const row=(lab)=>{ const g=(S,k)=>S.keptDropped[lab+':'+k]||0;
    console.log('  '+lab.padEnd(20)+' base kept '+String(g(B,'kept')).padStart(5)+' dropped '+String(g(B,'dropped')).padStart(5)
      +'   |  cf kept '+String(g(C,'kept')).padStart(5)+' dropped '+String(g(C,'dropped')).padStart(5)); };
  console.log('  (deload day builds only, n='+B.deloadDayBuilds+'; kept = section present with items at p1 AND p2)');
  LABELS.forEach(row);
  console.log('  section presence across the pipeline (ALL day builds, n='+B.dayCells+'):');
  LABELS.forEach(lb=>{ console.log('    '+lb.padEnd(20)+' base p0 '+(B.lbl[lb+'@p0']||0)+' p1 '+(B.lbl[lb+'@p1']||0)+' p2 '+(B.lbl[lb+'@p2']||0)+' p3 '+(B.lbl[lb+'@p3']||0)
    +'   |  cf p0 '+(C.lbl[lb+'@p0']||0)+' p1 '+(C.lbl[lb+'@p1']||0)+' p2 '+(C.lbl[lb+'@p2']||0)+' p3 '+(C.lbl[lb+'@p3']||0)); });
  console.log('  days taken >0 posterior -> 0 BY THE DELOAD: base '+B.killedByDeload+'  cf '+C.killedByDeload+'  (off '+O.killedByDeload+')');
  console.log('    [d88 like-for-like] on those killed days, labels that HELD the dropped posterior:');
  console.log('      base: '+(top(B.killedPostLbl,8).join('  |  ')||'(none)'));
  console.log('      cf  : '+(top(C.killedPostLbl,8).join('  |  ')||'(none)'));
  console.log('    labels KEPT instead on those days:');
  console.log('      base: '+(top(B.killedKeptLbl,8).join('  |  ')||'(none)'));
  console.log('      cf  : '+(top(C.killedKeptLbl,8).join('  |  ')||'(none)'));
  console.log('  days taken >0 -> 0 by capRegionalFatigue:   base '+B.killedByCap+'  cf '+C.killedByCap);
  console.log('  days taken >0 -> 0 by capSessionBudget:     base '+B.killedByBudget+'  cf '+C.killedByBudget);

  console.log('\n══ 4. DOWNSTREAM RE-LOSS OF Leg superset B (coach\'s 5.3% question) ══════');
  console.log('  capRegionalFatigue: LSB present entering the cap  base '+B.capLSBin+' -> killed '+B.capLSBkilled+' ('+pct(B.capLSBkilled,B.capLSBin)+')');
  console.log('                                                    cf   '+C.capLSBin+' -> killed '+C.capLSBkilled+' ('+pct(C.capLSBkilled,C.capLSBin)+')');
  console.log('  capSessionBudget:   LSB present entering budget   base '+B.budgetLSBin+' -> killed '+B.budgetLSBkilled+' ('+pct(B.budgetLSBkilled,B.budgetLSBin)+')');
  console.log('                                                    cf   '+C.budgetLSBin+' -> killed '+C.budgetLSBkilled+' ('+pct(C.budgetLSBkilled,C.budgetLSBin)+')');

  console.log('\n══ 5. THE TRAP A NAIVE PRE-PASS WOULD HIT ═══════════════════════════════');
  console.log('  arbitration records (one per recoveryDeload invocation): base '+B.cfRecs+'  cf '+C.cfRecs);
  console.log('  cards whose MAIN/primer/power/strength carries hinge or hip_ext: '+C.cfMainPost+' / '+C.cfRecs+' ('+pct(C.cfMainPost,C.cfRecs)+')');
  console.log('  >>> MAIN carries posterior AND no accessory candidate does: '+C.cfTrapAny+' / '+C.cfRecs+' ('+pct(C.cfTrapAny,C.cfRecs)+')');
  console.log('      ... of which at least one accessory candidate EXISTS to lose: '+C.cfTrap+' ('+pct(C.cfTrap,C.cfRecs)+')');
  console.log('  accessory-candidate count per card: '+top(C.cfCand,8).join('  '));
  console.log('  posterior-carrying candidates per card: '+top(C.cfPostCand,8).join('  '));
  console.log('  arbitration CHANGED the survivor (first-come -> pattern-first), by pair: ');
  top(C.cfFirstVsPick,10).forEach(r=>console.log('      '+r));

  console.log('\n══ 6. CARD ORDER ════════════════════════════════════════════════════════');
  console.log('  section-label order, whole week, base vs cf on affected deload weeks (samples):');
  (R.orderEx||[]).slice(0,6).forEach(e=>{ console.log('   '+e.key+' '+e.w);
    console.log('      base: '+e.before); console.log('      cf  : '+e.after); });
  if(!(R.orderEx||[]).length) console.log('   (no differing week captured — see section 7 identity counts)');

  console.log('\n══ 7. BLAST RADIUS: NON-DELOAD WEEKS ════════════════════════════════════');
  console.log('  non-deload weeks byte-identical base vs cf: '+F.nonDeloadIdentical+' / '+F.nonDeloadWeeks+' ('+pct(F.nonDeloadIdentical,F.nonDeloadWeeks)+')');
  if(F.nonDeloadWeeks!==F.nonDeloadIdentical) console.log('   DIFFERING: '+(F.nonDeloadDiffEx||[]).join(' ; '));
  console.log('  deload weeks identical base vs cf: '+F.deloadIdentical+' / '+F.deloadWeeks+'  (changed '+(F.deloadWeeks-F.deloadIdentical)+')');

  console.log('\n══ 8. CONTROLS ══════════════════════════════════════════════════════════');
  console.log('  zero-posterior weeks in the control cells (tier|inj):');
  console.log('    base: '+(top(B.ctrlZero,12).join('  ')||'(none)'));
  console.log('    cf  : '+(top(C.ctrlZero,12).join('  ')||'(none)'));
  console.log('  fixtures.HALF_MANNY progDigest — pristine '+FX.pureD+' | instrumented base '+FX.baseD
    +' | counterfactual '+FX.cfD+' | __DELOAD_OFF '+FX.offD);
  console.log('    expected 6e32421331693437 :: pristine '+(FX.pureD==='6e32421331693437'?'MATCH':'MISMATCH')
    +', cf '+(FX.cfD===FX.pureD?'BYTE-IDENTICAL to pristine':'CHANGED')
    +', deload-off '+(FX.offD===FX.pureD?'identical':'changed'));

  console.log('\nMEASURED '+B.weeks+' weeks x 3 arms / '+B.dayCells+' day builds per arm / '+B.configs+' configs. No ruling. No edit. index.html untouched.');
  try{ outs.forEach(o=>fs.unlinkSync(o)); fs.rmdirSync(tmp); }catch(e){}
}
