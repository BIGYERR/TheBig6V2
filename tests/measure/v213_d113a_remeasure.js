// v213_d113a_remeasure.js — MODE B before-picture for the V213 build (D113a + D146), re-measured
// on V212 (HEAD 169537c). Read-only against index.html; every variant is a source-surgery copy.
//   node v213_d113a_remeasure.js prep   <outdir>                    CUR A P PF FULL FULL0 (+ anchor table)
//   node v213_d113a_remeasure.js sweep  <html> <label> <out.json>   multi-sport lattice (v207 joint-chooser lattice, verbatim)
//   node v213_d113a_remeasure.js solo   <html> <label> <out.json>   run-only lattice, 6 goals x 3 foci x 99 cals
//   node v213_d113a_remeasure.js dated  <html> <label> <out.json>   dated pace lattice (D106a test week), pinned + pre-pin
//   node v213_d113a_remeasure.js feas                               engine-free: 3-training-day calendars, INT/CHI/long
//   node v213_d113a_remeasure.js manny  <outdir>
//   node v213_d113a_remeasure.js report <outdir>
// VARIANTS. CUR = V212 as shipped. A = CUR + tests/edits/v205_d113_d122_edit.py run byte-for-byte.
// P = A + the v207_d113_joint_chooser.js placement-only routing (PANCH/PREPL copied verbatim, NRC
// included, i.e. D146). PF = P + spaceHardCardio skips the run sport when the multi-sport chooser
// ran (v207_d146 "PFms", verbatim). FULL = PF + the spacer fallback as ruled in the V207 row ("a
// 3-training-day week that cannot space two quality runs keeps easy/INT/long"), written here as:
// inside _nrcSpacedRunDays, pace arm, capDays 3, best.untol > 0 -> re-run with easy/INT/long.
// FULL carries a no-op trace hook (typeof-guarded); FULL0 is FULL without it (identity proof).
// ORACLE (unchanged from v207, labels updated for D103a): adjacency classes come from the D130
// ruling text. Hard run = INT, CHI, long LSD (NSW) | Speed Run, Long Run (NRC) | race/trial.
// TOLERATED = run CHI on the calendar eve of the run long. Everything else adjacent is UNTOLERATED.
// Session class is by CONTENT (subtype text; NSW long vs easy LSD by legLoad, as in v207). dose.key
// is NEVER the oracle; it is cross-tabulated against the content class as a reader check.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const REPO = path.join(__dirname, '..', '..');
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const ISO = ['mon','tue','wed','thu','fri','sat','sun'];
const POS = d => DAYS.indexOf(d);
const CIRC = (a,b)=>{ const r=Math.abs(POS(a)-POS(b)); return Math.min(r,7-r); };
const PREV = d => DAYS[(POS(d)+6)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
const CALS = []; [0,1,2,3,4].forEach(n=>combos(DAYS,n).forEach(r=>CALS.push(r)));
const RUNG = { run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'}, run_base:{}, run_5k:{}, run_10k:{}, run_half:{}, run_marathon:{} };
const BIKEG = ['bike_base','bike_ftp','bike_century'], SWIMG = ['swim_base','swim_500_time','swim_mile'];
const EXTRAS = []; BIKEG.forEach(b=>EXTRAS.push({bike:b})); SWIMG.forEach(s=>EXTRAS.push({swim:s}));
BIKEG.forEach(b=>SWIMG.forEach(s=>EXTRAS.push({bike:b,swim:s})));
const FOCI = ['support_prevention','balanced','strength'];
const NRC = new Set(['run_5k','run_10k','run_half','run_marathon']); let CURG=null;
const RHARD = new Set(['int','chi','long','hardx','hardq','nlong','race']);
const H = s => crypto.createHash('sha1').update(s).digest('hex').slice(0,12);
function mkCfg(runG, ex, rest, focus, seed){
  const cg = { run: Object.assign({ id:runG, label:runG, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, RUNG[runG]||{}) };
  const types = ['run'];
  if(ex.bike){ types.push('bike'); cg.bike = { id:ex.bike, label:ex.bike, baselineDist:'10', baseline:'10mi' }; }
  if(ex.swim){ types.push('swim'); cg.swim = { id:ex.swim, label:ex.swim, baselineDist:'1000', baseline:'1000m' }; }
  return { name:'M', primaryPath:'goal', cardioTypes:types, cardioGoals:cg, eventTargeted:false,
    liftingFocus:focus, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
    restDays:rest.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed };
}
const SUBMAP = {}, KEYX = {};
function classify(c){
  const s=String(c.subtype||''); let t;
  if(c.type==='run'){
    // RACE_AS_LONG=1 reproduces the v207 classifier ORDER (Long Run tested before RACE DAY), for drift attribution only.
    if(process.env.RACE_AS_LONG && /^Long Run/.test(s)) t='nlong';
    else if(/TIME TRIAL|RACE DAY/i.test(s)) t='race';
    else if(/Short Interval \(SI\)|Interval \(INT\)/.test(s)) t='int';
    else if(/Long Interval \(LI\)|Continuous High Intensity \(CHI\)|^Steady Aerobic Run/.test(s)) t='chi';
    else if(/^Long Slow Distance \(LSD\)/.test(s)) t=c.legLoad?'long':'easy';
    else if(/^Speed Run/.test(s)) t='hardq';
    else if(/^Long Run/.test(s)) t='nlong';
    else if(/^Easy Run/.test(s) && CURG==='run_base') t=/— Long/.test(s)?'long':'easy';
    else if(/^(Easy Run|Recovery Run|Shakeout)/.test(s)) t='easy';
    else t=c.legLoad?'hardx':'easyx';
  } else if(c.type==='bike'){ t=/Sweet Spot|\((CHI|INT|LI|SI)\)|^Long Ride/.test(s)?'bhard':'beasy'; }
  else if(c.type==='swim'){ t=/\((INT|CHI|LI|SI)\)/.test(s)?'sq':'se'; }
  else t='other';
  const fam=NRC.has(CURG)?'NRC':(CURG==='run_pace_goal'?'pace':'base');
  const k=fam+' '+c.type+'|'+s.replace(/^(Speed Run|Long Run|Sweet Spot \(CHI\)|Benchmark Run) — .*$/,'$1').replace(/ — (Taper|Cutback)$/,'').slice(0,44)+'|leg='+!!c.legLoad+' -> '+t;
  SUBMAP[k]=(SUBMAP[k]||0)+1;
  if(c.type==='run'){ const kk=fam+' class='+t+' key='+((c.dose&&c.dose.key)||'-'); KEYX[kk]=(KEYX[kk]||0)+1; }
  return t;
}
function sessions(w){ const out=[]; DAYS.forEach(d=>{ const x=w&&w[d]; if(!x||!x.cardio) return;
  (Array.isArray(x.cardio)?x.cardio:[x.cardio]).forEach(c=>out.push({day:d,sport:c.type,t:classify(c),c})); }); return out; }
function adj(S){
  const hardR=S.filter(x=>x.sport==='run'&&RHARD.has(x.t));
  const hardL=S.filter(x=>(x.sport==='run'&&RHARD.has(x.t))||x.t==='bhard');
  const long=S.find(x=>x.sport==='run'&&x.t==='long');
  const r={Ru:0,Rt:0,Lu:0,RB:0,BB:0};
  const tol=(x,y)=>!!long&&((x.t==='chi'&&x.sport==='run'&&y===long&&x.day===PREV(long.day))||(y.t==='chi'&&y.sport==='run'&&x===long&&y.day===PREV(long.day)));
  for(let a=0;a<hardR.length;a++) for(let b=a+1;b<hardR.length;b++){ if(CIRC(hardR[a].day,hardR[b].day)!==1) continue; tol(hardR[a],hardR[b])?r.Rt++:r.Ru++; }
  for(let a=0;a<hardL.length;a++) for(let b=a+1;b<hardL.length;b++){ const x=hardL[a],y=hardL[b]; if(CIRC(x.day,y.day)!==1) continue;
    if(!tol(x,y)) r.Lu++; if(x.sport!==y.sport) r.RB++; else if(x.sport==='bike') r.BB++; }
  return r;
}
const lay = S => DAYS.map(d=>{const s=S.filter(x=>x.day===d); return s.length?d+':'+s.map(x=>x.sport[0]+'.'+x.t).join('+'):null;}).filter(Boolean).join(' ');

// ───────────── PREP ─────────────
function prep(outdir){
  fs.mkdirSync(outdir,{recursive:true});
  const cnt=(s,a)=>s.split(a).length-1;
  const need=(s,a,tag)=>{ const c=cnt(s,a); console.log(`[prep] anchor ${tag.padEnd(26)} count=${c}`); if(c!==1) throw new Error('anchor '+tag+' count '+c); };
  const put=(n,s)=>{ fs.mkdirSync(path.join(outdir,n),{recursive:true}); fs.writeFileSync(path.join(outdir,n,'index.html'),s); };
  const cur=cp.execSync('git show HEAD:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28});
  const wc=fs.readFileSync(path.join(REPO,'index.html'),'utf8');
  console.log('[prep] HEAD', cp.execSync('git rev-parse --short HEAD',{cwd:REPO,encoding:'utf8'}).trim(), 'ia-version', (cur.match(/name="ia-version" content="(\d+)"/)||[])[1], '| working copy == HEAD:', wc===cur);
  put('CUR',cur); put('A',cur);
  // (1) the parked slice's anchors on V212: first line of each, count and line number in CUR
  const src=fs.readFileSync(path.join(REPO,'tests','edits','v205_d113_d122_edit.py'),'utf8');
  const olds=[]; const re=/rep\(\n("(?:[^"\\]|\\.)*"|"""[\s\S]*?""")\s*,\n/g; let m;
  while((m=re.exec(src))){ let s=m[1]; s = s.startsWith('"""') ? s.slice(3,-3) : JSON.parse(s); olds.push(s); }
  console.log(`[anchors] parsed ${olds.length} anchors from the parked slice`);
  olds.forEach((a,i)=>{ const c=cnt(cur,a); const at=cur.indexOf(a); const ln=at<0?-1:cur.slice(0,at).split('\n').length;
    console.log(`  [${i+1}] count=${c} line=${ln}\n${a.split('\n').map(l=>'      | '+l).join('\n')}`); });
  const py=cp.spawnSync('python3',[path.join(REPO,'tests','edits','v205_d113_d122_edit.py')],{cwd:path.join(outdir,'A'),encoding:'utf8'});
  console.log('[prep A] python exit', py.status, '\n'+py.stdout+py.stderr); if(py.status!==0) throw new Error('A surgery failed');
  const A=fs.readFileSync(path.join(outdir,'A','index.html'),'utf8');
  const PANCH = "      dayToSport.push(pick); assigned[pick]++;\n    }\n  }\n";
  const PREPL = (flag)=> "      dayToSport.push(pick); assigned[pick]++;\n    }\n" +
"    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);\n" +
"      const _k = dayToSport.filter(s => s === 'run').length;\n" +
"      if((_msPace || NRC_GOALS.has(_msG)) && _k >= 2 && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace);\n" +
"        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;\n" +
"          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf;" + flag + " } } }\n  }\n";
  need(cur,PANCH,'P placement (CUR)'); need(A,PANCH,'P placement (A)');
  const P=A.replace(PANCH,PREPL('')); put('P',P);
  const CALL="  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport);\n";
  const SIG="function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport){\n";
  const LOOP="  for(const sp of sports){\n    const days = sportDayIndices[sp] || [];\n";
  const NPL="  let _nrcPlan = null;\n";
  [[CALL,'SHC call'],[SIG,'SHC signature'],[LOOP,'SHC sport loop'],[NPL,'_nrcPlan decl']].forEach(([a,t])=>need(A,a,t));
  let PF=A.replace(PANCH,PREPL(' _msFlag = true;'));
  PF=PF.replace(NPL,NPL+"  let _msFlag = false;\n");
  PF=PF.replace(CALL,"  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _msFlag ? 'run' : null);\n");
  PF=PF.replace(SIG,"function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _skipSport){\n");
  PF=PF.replace(LOOP,"  for(const sp of sports){\n    if(sp === _skipSport) continue;\n    const days = sportDayIndices[sp] || [];\n");
  put('PF',PF);
  const FBSIG="  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam){\n    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false, true)\n";
  const FBRET="    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1\n";
  need(PF,FBSIG,'fallback signature (PF)'); need(PF,FBRET,'fallback return (PF)');
  const mkFull=hook=>PF.replace(FBSIG,"  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, _fb){\n    const types = paceFam ? (_fb ? ['lsd_easy','int','lsd_long'] : getSessionTypes(capDays, isSpeedGoal(goalId), false, false, true))\n")
    .replace(FBRET,"    if(paceFam && capDays === 3 && !_fb && best && best.untol > 0){ const _alt = _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, true);"
      +(hook?" if(typeof __IA_FB==='function') __IA_FB(cardioTrainDays.length, best.untol, _alt && _alt.untol);":"")+" if(_alt) return _alt; }\n"+FBRET);
  put('FULL',mkFull(true)); put('FULL0',mkFull(false));
  console.log('[prep] wrote CUR A P PF FULL FULL0 under', outdir);
}

// ───────────── SWEEPS ─────────────
function loadIA(html){ const { load } = require(path.join(REPO,'tests','harness.js')); return load(html); }
function digestOf(p){ const { progDigest } = require(path.join(REPO,'tests','harness.js')); return progDigest(p); }
function weekRow(p, g, rest){
  const wks=Object.keys(p.weeks).sort((a,b)=>+a-+b);
  const train=ISO.filter(d=>!rest.includes(d)); const IP=d=>ISO.indexOf(d);
  const r={W:wks.length,untolW:[],Rt:0,Lu:0,RB:0,BB:0,runsH:{},qualH:{},longWk:0,longNotLastRun:0,longKey:{},sig:'',w1:'',FP:{}};
  const parts=[];
  wks.forEach(wk=>{ const S=sessions(p.weeks[wk]); const a=adj(S);
    if(a.Ru) r.untolW.push(+wk); if(a.Rt) r.Rt++; r.Lu+=a.Lu; r.RB+=a.RB; r.BB+=a.BB;
    const L=lay(S); parts.push(L); if(wk===wks[0]) r.w1=L;
    const runs=S.filter(x=>x.sport==='run'); r.runsH[runs.length]=(r.runsH[runs.length]||0)+1;
    const q=runs.filter(x=>x.t==='int'||x.t==='chi'||x.t==='hardq').length; r.qualH[q]=(r.qualH[q]||0)+1;
    const nk=runs.filter(x=>x.c.dose&&x.c.dose.key==='long').length; r.longKey[nk]=(r.longKey[nk]||0)+1;
    if(NRC.has(g)){ const Lg=runs.find(x=>x.t==='nlong'); if(Lg){ r.longWk++; if(runs.some(x=>IP(x.day)>IP(Lg.day))) r.longNotLastRun++; }
      runs.forEach(x=>{ const k=wk; const fp=H(JSON.stringify(x.c)); (r.FP[k]=r.FP[k]||{})[fp]=(r.FP[k][fp]||0)+1; }); }
  });
  r.sig=H(parts.join('/')); return r;
}
function sweep(html,label,outp,solo){
  const IA=loadIA(html); const rows=[]; const t0=Date.now(); let crash=0; let fb=[]; IA.ctx.__IA_FB=(n,u,ua)=>fb.push([n,u,ua]);
  const lat=[]; Object.keys(RUNG).forEach(g=>(solo?[{}]:EXTRAS).forEach(ex=>FOCI.forEach(f=>CALS.forEach(rest=>lat.push([g,ex,f,rest])))));
  const LIM=+process.env.LIMIT||lat.length; const GF=process.env.GOALS?new Set(process.env.GOALS.split(',')):null;
  lat.slice(0,LIM).filter(x=>!GF||GF.has(x[0])).forEach(([g,ex,f,rest])=>{ CURG=g; fb=[]; let p;
    try{ p=IA.buildProgram(mkCfg(g,ex,rest,f,1001)); }catch(e){ crash++; rows.push({g,ex,f,rest,crash:String(e).slice(0,160)}); return; }
    const r=weekRow(p,g,rest); Object.assign(r,{g,combo:(ex.bike?'B':'')+(ex.swim?'S':''),ex,f,rest,nT:7-rest.length,dig:digestOf(p),fb:fb.length?fb:undefined});
    r.chiCards=0; r.intCards=0; Object.values(p.weeks).forEach(w=>sessions(w).forEach(x=>{ if(x.sport==='run'&&x.t==='chi') r.chiCards++; if(x.sport==='run'&&x.t==='int') r.intCards++; }));
    rows.push(r); });
  fs.writeFileSync(outp,JSON.stringify({label,html,n:rows.length,crash,ms:Date.now()-t0,SUBMAP,KEYX,rows}));
  console.log(`[${solo?'solo':'sweep'} ${label}] builds ${rows.length} crash ${crash} ms ${Date.now()-t0}`);
}
// DATED (D106a): pace goal, test week = last week, test weekday Mon..Sun, tw 6/9/11, pinned vs pre-pin.
function dated(html,label,outp){
  const IA=loadIA(html); const rows=[]; const t0=Date.now(); let crash=0;
  const DX=[{},{bike:'bike_base'},{bike:'bike_ftp'},{swim:'swim_base'},{bike:'bike_base',swim:'swim_base'}];
  DX.forEach(ex=>CALS.forEach(rest=>[6,9,11].forEach(tw=>ISO.forEach((td,ti)=>{
    // date arithmetic: week 1 is the week of Mon 2026-09-21; the test is day ti of week tw.
    const dt=new Date(Date.UTC(2026,8,21)); dt.setUTCDate(dt.getUTCDate()+7*(tw-1)+ti); const iso=dt.toISOString().slice(0,10);
    const base=Object.assign(mkCfg('run_pace_goal',ex,rest,'balanced',24865),{eventTargeted:true,primaryPath:'event',raceDate:iso,startDate:'2026-09-21',_raceDateCappedWeeks:tw});
    CURG='run_pace_goal'; let p,q;
    try{ p=IA.buildProgram(Object.assign({},JSON.parse(JSON.stringify(base)),{_testWeek:tw})); q=IA.buildProgram(JSON.parse(JSON.stringify(base))); }
    catch(e){ crash++; rows.push({crash:String(e).slice(0,160),ex,rest,tw,td}); return; }
    const S=sessions(p.weeks[tw]||{}), Q=sessions(q.weeks[tw]||{});
    const runs=S.filter(x=>x.sport==='run'), qr=Q.filter(x=>x.sport==='run');
    const trial=runs.find(x=>x.t==='race');
    const pre=qr.map(x=>x.t).sort().join(','); const post=runs.map(x=>x.t).sort().join(',');
    const pred = qr.some(x=>x.t==='chi')?'chi':qr.some(x=>x.t==='int')?'int':qr.some(x=>x.t==='long')?'long':(qr.filter(x=>x.t==='easy').length===1?'onlyLSD':'none');
    const other=runs.filter(x=>x!==trial&&RHARD.has(x.t));
    const IP=d=>ISO.indexOf(d);
    const hardAfter=trial?runs.filter(x=>x!==trial&&IP(x.day)>IP(trial.day)).length:0;
    const hardWithin2=trial?other.filter(x=>{ const b=IP(trial.day)-IP(x.day); return b>=1&&b<=2; }).length:0;
    const otherDist=trial?other.map(x=>x.t+'@'+(IP(trial.day)-IP(x.day))):[];
    rows.push({combo:(ex.bike?'B':'')+(ex.swim?'S':''),rest,nT:7-rest.length,tw,td,trialDay:trial&&trial.day,onTd:!!trial&&trial.day===td,pre,post,pred,other:otherDist,hardAfter,hardWithin2,w:lay(S),wq:lay(Q),dig:digestOf(p)});
  }))));
  fs.writeFileSync(outp,JSON.stringify({label,html,n:rows.length,crash,ms:Date.now()-t0,rows}));
  console.log(`[dated ${label}] builds ${rows.length} crash ${crash} ms ${Date.now()-t0}`);
}
function feas(){
  // engine-free: which 3-training-day calendars admit INT/CHI/long with 0 untolerated (CHI-eve-of-long tolerated)?
  const perms=[['int','chi','long'],['int','long','chi'],['chi','int','long'],['chi','long','int'],['long','int','chi'],['long','chi','int']];
  let bad=[]; const cals=combos(DAYS,3);
  cals.forEach(c=>{ let best=99; perms.forEach(p=>{ const S=c.map((d,i)=>({day:d,sport:'run',t:p[i]})); best=Math.min(best,adj(S).Ru); }); if(best>0) bad.push(c.join('+')+' (min '+best+')'); });
  console.log(`[feas] 3-training-day calendars where INT/CHI/long cannot reach 0 untolerated: ${bad.length}/${cals.length}`); bad.forEach(b=>console.log('   '+b));
  let fbBad=0; bad.forEach(b=>{ const c=b.split(' ')[0].split('+'); let best=99; [['easy','int','long'],['easy','long','int'],['int','easy','long'],['int','long','easy'],['long','easy','int'],['long','int','easy']].forEach(p=>{ best=Math.min(best,adj(c.map((d,i)=>({day:d,sport:'run',t:p[i]}))).Ru); }); if(best>0) fbBad++; });
  console.log(`[feas] of those, calendars where easy/INT/long ALSO cannot reach 0: ${fbBad}/${bad.length}`);
}
function manny(outdir){
  const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(REPO,'tests','harness.js'));
  const pin=MANNY_DIGEST_BY_VERSION[212];
  ['CUR','A','P','PF','FULL','FULL0'].forEach(l=>{ const IA=load(path.join(outdir,l,'index.html'));
    const d1=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)))), d2=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
    console.log(`[manny] ${l.padEnd(5)} v${IA.version} ${d1} self-equal ${d1===d2} ${d1===pin?'== row 212':'!= row 212 '+pin}`); });
}
function pct(a,b){ return b?(100*a/b).toFixed(2)+'%':'-'; }
function report(outdir){
  const L=['CUR','A','P','PF','FULL']; const D={}, S={}, T={};
  const rd=f=>JSON.parse(fs.readFileSync(path.join(outdir,f),'utf8'));
  L.forEach(l=>{ D[l]=rd(l+'.json'); S[l]=rd('solo_'+l+'.json'); console.log(`[load] ${l} multi ${D[l].n} crash ${D[l].crash} ${D[l].ms}ms | solo ${S[l].n} crash ${S[l].crash}`); });
  ['CUR','FULL'].forEach(l=>{ T[l]=rd('dated_'+l+'.json'); console.log(`[load] dated ${l} ${T[l].n} crash ${T[l].crash}`); });
  S.FULL0=rd('solo_FULL0.json');
  const fam=g=>NRC.has(g)?'NRC':(g==='run_pace_goal'?'pace':'base');
  console.log('\n== 0. INSTRUMENT: classifier audit on CUR multi (unknown classes hardx/easyx must be 0), top subtypes ==');
  const sm=Object.entries(D.CUR.SUBMAP).sort((a,b)=>b[1]-a[1]); const unk=sm.filter(([k])=>/-> (hardx|easyx|other)$/.test(k));
  console.log(`   distinct subtype keys ${sm.length}, unknown-class keys ${unk.length} (${unk.reduce((a,[,v])=>a+v,0)} sessions)`); unk.slice(0,10).forEach(([k,v])=>console.log('     UNK '+v+' '+k));
  sm.filter(([k])=>/ run\|/.test(k)).slice(0,30).forEach(([k,v])=>console.log('   '+String(v).padStart(7)+' '+k));
  console.log('   FULL0 vs FULL solo digest (hook is a no-op): diff '+S.FULL.rows.filter((r,i)=>r.dig!==S.FULL0.rows[i].dig).length+'/'+S.FULL.n);
  console.log('\n== 1. MULTI-SPORT: R-untolerated weeks by family ==');
  L.forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash) return; const k=fam(r.g); const a=m[k]=m[k]||{c:0,W:0,U:0,cu:0,Rt:0,Lu:0,RB:0,BB:0}; a.c++; a.W+=r.W; a.U+=r.untolW.length; if(r.untolW.length) a.cu++; a.Rt+=r.Rt; a.Lu+=r.Lu; a.RB+=r.RB; a.BB+=r.BB; });
    Object.keys(m).sort().forEach(k=>{ const a=m[k]; console.log(`   ${l.padEnd(4)} ${k.padEnd(4)} builds ${a.c} R-untol wks ${a.U}/${a.W} (${pct(a.U,a.W)}) builds-with ${a.cu} tolOnly-wks ${a.Rt} | L-untol pairs ${a.Lu} run-bike ${a.RB} bike-bike ${a.BB}`); }); });
  console.log('\n== 1b. pace R-untol weeks by combo x nTrain (A, P, FULL) ==');
  ['CUR','A','P','FULL'].forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash||r.g!=='run_pace_goal') return; const k=r.combo+' nT='+r.nT; const a=m[k]=m[k]||{W:0,U:0}; a.W+=r.W; a.U+=r.untolW.length; });
    console.log('   ['+l+'] '+Object.keys(m).sort().filter(k=>m[k].U).map(k=>k+':'+m[k].U+'/'+m[k].W).join('  ')); });
  console.log('\n== 1c. pace quality runs per week (multi) and runs per week ==');
  L.forEach(l=>{ const q={},rn={}; D[l].rows.forEach(r=>{ if(r.crash||r.g!=='run_pace_goal') return; Object.entries(r.qualH).forEach(([k,v])=>q[k]=(q[k]||0)+v); Object.entries(r.runsH).forEach(([k,v])=>rn[k]=(rn[k]||0)+v); });
    console.log(`   ${l.padEnd(4)} qual/wk ${JSON.stringify(q)}  runs/wk ${JSON.stringify(rn)}`); });
  console.log('\n== 1d. bike-bike pairs by bike goal (multi, all run goals) ==');
  L.forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash||!r.ex.bike) return; const k=fam(r.g)+' '+r.ex.bike; m[k]=(m[k]||0)+r.BB; }); console.log(`   ${l.padEnd(4)} `+Object.keys(m).sort().map(k=>k+':'+m[k]).join('  ')); });
  console.log('\n== 2. NRC long run not last run of ISO week ==');
  L.forEach(l=>{ let W=0,n=0,b=0; const seg={}; D[l].rows.forEach(r=>{ if(r.crash||!NRC.has(r.g)) return; W+=r.longWk; n+=r.longNotLastRun; if(r.longNotLastRun){ b++; seg[r.g+' '+r.combo]=(seg[r.g+' '+r.combo]||0)+r.longNotLastRun; } });
    console.log(`   ${l.padEnd(4)} ${n}/${W} long-run weeks (builds ${b}) ${JSON.stringify(seg)}`); });
  console.log('\n== 3. NRC VERBATIM: every NRC run session under X exists in CUR, same goal+week ==');
  const fpIdx=l=>{ const o={}; D[l].rows.forEach(r=>{ if(r.crash||!NRC.has(r.g)) return; Object.entries(r.FP).forEach(([wk,fps])=>Object.entries(fps).forEach(([fp,n])=>{ const k=r.g+'|'+wk; (o[k]=o[k]||{})[fp]=((o[k]||{})[fp]||0)+n; })); }); return o; };
  const refFP=fpIdx('CUR'); ['A','P','PF','FULL'].forEach(l=>{ const X=fpIdx(l); let tot=0,miss=0; Object.entries(X).forEach(([k,fps])=>Object.entries(fps).forEach(([fp,n])=>{ tot+=n; if(!(refFP[k]||{})[fp]) miss+=n; })); console.log(`   ${l.padEnd(4)} NRC run sessions ${tot} absent-from-CUR ${miss}`); });
  console.log('\n== 4. MOVES vs CUR (multi): layout signature / full-program digest, by family ==');
  ['A','P','PF','FULL'].forEach(l=>{ const m={},dm={},den={}; D.CUR.rows.forEach((r,i)=>{ const s=D[l].rows[i]; if(r.crash||s.crash) return; const k=fam(r.g); den[k]=(den[k]||0)+1; if(r.sig!==s.sig) m[k]=(m[k]||0)+1; if(r.dig!==s.dig) dm[k]=(dm[k]||0)+1; });
    console.log(`   CUR->${l.padEnd(4)} layout `+Object.keys(den).sort().map(k=>k+' '+(m[k]||0)+'/'+den[k]).join('  ')+'  | digest '+Object.keys(den).sort().map(k=>k+' '+(dm[k]||0)+'/'+den[k]).join('  ')); });
  { const m={},den={}; D.P.rows.forEach((r,i)=>{ const s=D.PF.rows[i]; const k=fam(r.g); den[k]=(den[k]||0)+1; if(r.sig!==s.sig) m[k]=(m[k]||0)+1; }); console.log('   P->PF layout '+Object.keys(den).sort().map(k=>k+' '+(m[k]||0)+'/'+den[k]).join('  ')); }
  { const m={},den={}; D.PF.rows.forEach((r,i)=>{ const s=D.FULL.rows[i]; const k=fam(r.g); den[k]=(den[k]||0)+1; if(r.dig!==s.dig) m[k]=(m[k]||0)+1; }); console.log('   PF->FULL digest '+Object.keys(den).sort().map(k=>k+' '+(m[k]||0)+'/'+den[k]).join('  ')+'  fallback fired on '+D.FULL.rows.filter(r=>r.fb).length+' multi builds'); }
  console.log('\n== 5. dose.key x content class (runs), CUR vs FULL multi ==');
  ['CUR','FULL'].forEach(l=>{ console.log('   ['+l+']'); Object.entries(D[l].KEYX).sort().forEach(([k,v])=>console.log('     '+String(v).padStart(7)+' '+k)); });
  ['CUR','FULL'].forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash) return; Object.entries(r.longKey).forEach(([k,v])=>{ const kk=fam(r.g)+' long-keyed-runs/wk='+k; m[kk]=(m[kk]||0)+v; }); }); console.log('   '+l+' '+JSON.stringify(m)); });
  console.log('\n== 6. SOLO lattice (run only): moves vs CUR by goal x nTrain; pace nT=3 detail ==');
  ['A','P','PF','FULL'].forEach(l=>{ const m={},den={}; S.CUR.rows.forEach((r,i)=>{ const s=S[l].rows[i]; const k=r.g+' nT='+r.nT; den[k]=(den[k]||0)+1; if(r.dig!==s.dig) m[k]=(m[k]||0)+1; });
    const tot=Object.values(m).reduce((a,b)=>a+b,0); console.log(`   CUR->${l.padEnd(4)} digest moved ${tot}/${S.CUR.n}: `+Object.keys(m).sort().map(k=>k+' '+m[k]+'/'+den[k]).join('  ')); });
  L.forEach(l=>{ const m={}; S[l].rows.forEach(r=>{ const k=fam(r.g)+' nT='+r.nT; const a=m[k]=m[k]||{W:0,U:0}; a.W+=r.W; a.U+=r.untolW.length; }); console.log(`   ${l.padEnd(4)} solo R-untol `+Object.keys(m).sort().filter(k=>m[k].U).map(k=>k+':'+m[k].U+'/'+m[k].W).join('  ')); });
  ['CUR','A','FULL'].forEach(l=>{ const rows=S[l].rows.filter(r=>r.g==='run_pace_goal'&&r.nT===3); const cal=new Set(rows.filter(r=>r.fb).map(r=>DAYS.filter(d=>!r.rest.includes(d)).join('+')));
    const u=rows.filter(r=>r.untolW.length).length; const noChi=rows.filter(r=>r.chiCards===0).length; const noInt=rows.filter(r=>r.intCards===0).length;
    console.log(`   ${l.padEnd(4)} solo pace nT=3: builds ${rows.length}, with untol ${u}, zero-CHI-card builds ${noChi}, zero-INT ${noInt}, fallback fired ${rows.filter(r=>r.fb).length} on ${cal.size} calendars ${[...cal].join(' ')}`);
    const w1={}; rows.forEach(r=>{ w1[r.w1.replace(/[a-z]+:/g,'')]=(w1[r.w1.replace(/[a-z]+:/g,'')]||0)+1; }); console.log('        week-1 run sequence histogram '+JSON.stringify(w1)); });
  console.log('\n== 7. DATED (D106a test week), pace, pinned vs pre-pin ==');
  ['CUR','FULL'].forEach(l=>{ const rows=T[l].rows.filter(r=>!r.crash); const g={}; const inc=(k)=>g[k]=(g[k]||0)+1;
    rows.forEach(r=>{ const seg=(r.combo||'solo'); inc(seg+' pred='+r.pred); if(!r.trialDay) inc(seg+' NO-TRIAL'); if(r.trialDay&&!r.onTd) inc(seg+' trial-not-on-test-day');
      if(r.other.length) inc(seg+' test-week-keeps-hard:'+r.other.map(x=>x.split('@')[0]).sort().join('+'));
      if(r.hardAfter) inc(seg+' run-after-trial'); if(r.hardWithin2) inc(seg+' HARD-in-T-1/T-2'); });
    console.log(`   [${l}] builds ${rows.length} (crash ${T[l].crash})`); Object.keys(g).sort().forEach(k=>console.log('     '+String(g[k]).padStart(6)+'  '+k)); });
  { let mv=0,n=0; T.CUR.rows.forEach((r,i)=>{ const s=T.FULL.rows[i]; if(r.crash||s.crash) return; n++; if(r.dig!==s.dig) mv++; }); console.log(`   CUR->FULL dated digest moved ${mv}/${n}`); }
  const ex=T.FULL.rows.filter(r=>!r.crash&&r.other.some(x=>/^int/.test(x))).slice(0,4); ex.forEach(r=>console.log(`   e.g. ${r.combo||'solo'} rest=[${r.rest}] tw=${r.tw} test=${r.td}\n      pre : ${r.wq}\n      post: ${r.w}   other hard (type@days-before-trial) ${r.other}`));
}
// EXTRA: segmentation of the report's headline moves (reads the sweep JSONs only).
function extra(outdir){
  const rd=f=>JSON.parse(fs.readFileSync(path.join(outdir,f),'utf8'));
  const C=rd('CUR.json'), F=rd('FULL.json'), SC=rd('solo_CUR.json'), SF=rd('solo_FULL.json'), TC=rd('dated_CUR.json'), TF=rd('dated_FULL.json');
  console.log('== X1. pace multi builds moved CUR->FULL, by max runs/week x nTrain x combo ==');
  const m={}; C.rows.forEach((r,i)=>{ if(r.g!=='run_pace_goal') return; const mx=Math.max(...Object.keys(r.runsH).map(Number)); const k='maxRuns='+mx+' nT='+r.nT+' '+r.combo; const a=m[k]=m[k]||{n:0,mv:0}; a.n++; if(r.dig!==F.rows[i].dig) a.mv++; });
  Object.keys(m).sort().forEach(k=>console.log('   '+k.padEnd(22)+' moved '+m[k].mv+'/'+m[k].n));
  console.log('== X2. solo pace nT=3 fallback builds: CHI/INT cards CUR vs FULL ==');
  SF.rows.forEach((r,i)=>{ if(!r.fb) return; const c=SC.rows[i]; console.log(`   rest=[${r.rest}] ${r.f.padEnd(18)} W=${r.W} CUR chi ${c.chiCards} int ${c.intCards} | FULL chi ${r.chiCards} int ${r.intCards} | w1 CUR ${c.w1} | FULL ${r.w1}`); });
  const nf=SF.rows.filter((r,i)=>r.g==='run_pace_goal'&&r.nT===3&&!r.fb); console.log(`   non-fallback nT=3 builds ${nf.length}: CHI cards CUR ${nf.reduce((a,r)=>a+SC.rows[SF.rows.indexOf(r)].chiCards,0)} -> FULL ${nf.reduce((a,r)=>a+r.chiCards,0)}; INT cards CUR ${nf.reduce((a,r)=>a+SC.rows[SF.rows.indexOf(r)].intCards,0)} -> FULL ${nf.reduce((a,r)=>a+r.intCards,0)}`);
  console.log('== X3. dated test week: a hard run other than the trial left in the test week, by segment, min days before trial ==');
  [['CUR',TC],['FULL',TF]].forEach(([l,T])=>{ const g={}; T.rows.forEach(r=>{ if(r.crash||!r.other.length) return; const d=Math.min(...r.other.map(x=>+x.split('@')[1])); const k=(r.combo||'solo')+' nT='+r.nT+' '+r.other.map(x=>x.split('@')[0]).sort().join('+')+' min-gap='+d; g[k]=(g[k]||0)+1; });
    console.log('   ['+l+'] total '+Object.values(g).reduce((a,b)=>a+b,0)+'/'+T.rows.length); Object.keys(g).sort().forEach(k=>console.log('     '+String(g[k]).padStart(5)+' '+k)); });
  const newK=TF.rows.filter((r,i)=>r.other.some(x=>/^int/.test(x))&&!TC.rows[i].other.some(x=>/^int/.test(x))).length; console.log('   test weeks with an INT left beside the trial on FULL but not on CUR: '+newK+'/'+TF.rows.length);
  const pm={}; TF.rows.forEach((r,i)=>{ const k=(r.combo||'solo')+' '+TC.rows[i].pred+'->'+r.pred; pm[k]=(pm[k]||0)+1; }); console.log('   trial slot (hierarchy on the pre-pin week) CUR->FULL: '+JSON.stringify(pm));
}
// INJURY: solo pace across every injury region x tier the engine names, 99 calendars, CUR vs another artifact.
// Why: g197d/g199 moved on solo pace + injury configs the uninjured solo lattice never reached.
function injury(curHtml, xHtml){
  const { load, progDigest } = require(path.join(REPO,'tests','harness.js'));
  const C=load(curHtml), X=load(xHtml); let fb=[]; X.ctx.__IA_FB=(n,u,ua)=>fb.push([n,u,ua]);
  const regions=Object.keys(C.eval('INJURY_REGIONS')); const tiers=['protect','workaround','return'];
  const seg={}; let n=0, crash=0; const inc=(k,f)=>{ const a=seg[k]=seg[k]||{n:0,mv:0,fb:0,cap3:0}; a.n++; if(f.mv) a.mv++; if(f.fb) a.fb++; if(f.cap3) a.cap3++; };
  regions.forEach(R=>tiers.forEach(T=>CALS.forEach(rest=>{ const cfg=Object.assign(mkCfg('run_pace_goal',{},rest,'balanced',1001),{injury:{region:R,tier:T}});
    let pc,px; fb=[]; CURG='run_pace_goal';
    try{ pc=C.buildProgram(JSON.parse(JSON.stringify(cfg))); px=X.buildProgram(JSON.parse(JSON.stringify(cfg))); }catch(e){ crash++; return; }
    n++; const plan=C.eval('injuryPlan')(cfg); const mode=(plan&&plan.cardioMode)||'none';
    const runs=Math.max(...Object.values(pc.weeks).map(w=>DAYS.filter(d=>w[d]&&w[d].cardio&&[].concat(w[d].cardio).some(c=>c.type==='run')).length));
    inc('mode='+mode+' nT='+(7-rest.length), {mv:progDigest(pc)!==progDigest(px), fb:fb.length>0, cap3:runs===3}); })));
  console.log(`[injury] builds ${n} crash ${crash} regions ${regions.length} (${regions.join(',')}) tiers ${tiers.join(',')}`);
  let tm=0; Object.keys(seg).sort().forEach(k=>{ const a=seg[k]; tm+=a.mv; if(a.mv||a.fb) console.log(`   ${k.padEnd(24)} moved ${a.mv}/${a.n}  fallback fired ${a.fb}  builds with a 3-run max week ${a.cap3}`); });
  console.log(`   total moved ${tm}/${n}; segments with 0 moved omitted`);
}
const [mode,a1,a2,a3]=process.argv.slice(2);
if(mode==='extra') { extra(a1); process.exit(0); }
if(mode==='injury') { injury(a1,a2); process.exit(0); }
if(mode==='prep') prep(a1); else if(mode==='sweep') sweep(a1,a2,a3,false); else if(mode==='solo') sweep(a1,a2,a3,true);
else if(mode==='dated') dated(a1,a2,a3); else if(mode==='feas') feas(); else if(mode==='manny') manny(a1); else if(mode==='report') report(a1);
else { console.error('usage: prep|sweep|solo|dated|feas|manny|report'); process.exit(2); }
