// v207_d146_nrc_residual.js — MODE B before-picture for D146 (extend D113a's placement-only
// "P" routing to NRC multi-sport). Read-only. Works from V206 (git 57b3ed8), never the working copy.
//   node v207_d146_nrc_residual.js prep   <outdir>                 V206 -> CUR, A, P, PT, PFms, PFall (anchor counts printed)
//   node v207_d146_nrc_residual.js sweep  <html> <label> <out.json> [solo]   lattice sweep (solo = run-only lattice)
//   node v207_d146_nrc_residual.js trace  <outdir>                 rebuild every P NRC untolerated build on PT, print the swap chain
//   node v207_d146_nrc_residual.js manny  <outdir>                 HALF_MANNY progDigest on every artifact
//   node v207_d146_nrc_residual.js report <outdir>
// ORACLE: identical to v207_d113_joint_chooser.js (copied verbatim below, not required, so the
// two passes cannot drift): adjacency classes from the D130 ruling text; session class by CONTENT
// (subtype text); NRC hard = Speed Run | Long Run | race | any legLoad run. Lens R = runs only.
// NRC pins: long run position read off the built week against the calendar (date arithmetic on
// the rest pattern), never off the chooser. Verbatim check: every NRC run session (full cardio
// object) under P must exist, same goal + same week, in V206 CUR's own NRC output over the same
// lattice, and every NRC session name root must appear in doctrine/nikerunclub*.txt.
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const REPO = path.join(__dirname, '..', '..');
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
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
function mkCfg(runG, ex, rest, focus, seed){
  const cg = { run: Object.assign({ id:runG, label:runG, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, RUNG[runG]||{}) };
  const types = ['run'];
  if(ex.bike){ types.push('bike'); cg.bike = { id:ex.bike, label:ex.bike, baselineDist:'10', baseline:'10mi' }; }
  if(ex.swim){ types.push('swim'); cg.swim = { id:ex.swim, label:ex.swim, baselineDist:'1000', baseline:'1000m' }; }
  return { name:'M', primaryPath:'goal', cardioTypes:types, cardioGoals:cg, eventTargeted:false,
    liftingFocus:focus, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
    restDays:rest.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed };
}
function sessions(w){
  const out=[];
  DAYS.forEach(d=>{ const x=w&&w[d]; if(!x||!x.cardio) return;
    const cs=Array.isArray(x.cardio)?x.cardio:[x.cardio];
    cs.forEach(c=>{ const s=String(c.subtype||''); let t;
      if(c.type==='run'){
        if(/Interval \(INT\)/.test(s)) t='int';
        else if(/Continuous High Intensity \(CHI\)|^Steady Aerobic Run/.test(s)) t='chi';
        else if(/^Long Slow Distance \(LSD\)/.test(s)) t=c.legLoad?'long':'easy';
        else if(/^Speed Run/.test(s)) t='hardq';
        else if(/^Long Run/.test(s)) t='nlong';
        else if(/RACE DAY|TIME TRIAL/i.test(s)) t='race';
        else if(/^Easy Run/.test(s) && !NRC.has(CURG)) t=c.legLoad?'long':'easy';
        else if(/^(Easy Run|Recovery Run|Shakeout)/.test(s)) t='easy';
        else t=c.legLoad?'hardx':'easyx';
      } else if(c.type==='bike'){ t=/Sweet Spot|\((CHI|INT)\)|^Long Ride/.test(s)?'bhard':'beasy'; }
      else if(c.type==='swim'){ t=/\((INT|CHI)\)/.test(s)?'sq':'se'; }
      else t='other';
      out.push({day:d,sport:c.type,t,c}); }); });
  return out;
}
function adj(S){
  const hardR = S.filter(x=>x.sport==='run'&&RHARD.has(x.t));
  const hardL = S.filter(x=>(x.sport==='run'&&RHARD.has(x.t))||x.t==='bhard');
  const long = S.find(x=>x.sport==='run'&&x.t==='long');
  const r = {Ru:0,Rt:0,Lu:0,RB:0,BB:0};
  const tolPair=(x,y)=> !!long && ((x.t==='chi'&&x.sport==='run'&&y===long&&x.day===PREV(long.day))||(y.t==='chi'&&y.sport==='run'&&x===long&&y.day===PREV(long.day)));
  for(let a=0;a<hardR.length;a++) for(let b=a+1;b<hardR.length;b++){ if(CIRC(hardR[a].day,hardR[b].day)!==1) continue; tolPair(hardR[a],hardR[b])?r.Rt++:r.Ru++; }
  for(let a=0;a<hardL.length;a++) for(let b=a+1;b<hardL.length;b++){ const x=hardL[a],y=hardL[b]; if(CIRC(x.day,y.day)!==1) continue;
    if(!tolPair(x,y)) r.Lu++; if(x.sport!==y.sport) r.RB++; else if(x.sport==='bike') r.BB++; }
  return r;
}
const H = s => crypto.createHash('sha1').update(s).digest('hex').slice(0,12);

// ───────────────────────────── PREP ─────────────────────────────
function prep(outdir){
  fs.mkdirSync(outdir,{recursive:true});
  const cnt=(s,a)=>s.split(a).length-1;
  const need=(s,a,tag)=>{ const c=cnt(s,a); console.log(`[prep] anchor ${tag.padEnd(22)} count=${c}`); if(c!==1) throw new Error('anchor '+tag+' count '+c); };
  const put=(name,s)=>{ fs.mkdirSync(path.join(outdir,name),{recursive:true}); fs.writeFileSync(path.join(outdir,name,'index.html'),s); };
  const cur = cp.execSync('git show 57b3ed8:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28});
  console.log('[prep] V206 ia-version', (cur.match(/name="ia-version" content="(\d+)"/)||[])[1]);
  put('CUR',cur); put('A',cur);
  const py=cp.spawnSync('python3',[path.join(REPO,'tests','edits','v205_d113_d122_edit.py')],{cwd:path.join(outdir,'A'),encoding:'utf8'});
  console.log('[prep A] python exit', py.status, '\n'+py.stdout+py.stderr); if(py.status!==0) throw new Error('A surgery failed');
  const A=fs.readFileSync(path.join(outdir,'A','index.html'),'utf8');
  // P anchor and replacement: byte-identical to v207_d113_joint_chooser.js prep() (P, NRC included),
  // with two splice points (FLAG, TRACE) that are empty strings in P itself.
  const PANCH = "      dayToSport.push(pick); assigned[pick]++;\n    }\n  }\n";
  const PREPL = (flag,trace)=> "      dayToSport.push(pick); assigned[pick]++;\n    }\n" +
"    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);\n" +
"      const _k = dayToSport.filter(s => s === 'run').length;\n" +
"      if((_msPace || NRC_GOALS.has(_msG)) && _k >= 2 && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace);\n" +
"        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;\n" +
"          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf;" + flag + trace + " } } }\n  }\n";
  need(A,PANCH,'P placement');
  const P = A.replace(PANCH, PREPL('',''));
  put('P', P);
  // PT = P + trace hooks (no state writes; a sweep proves PT layouts == P layouts).
  const TR = "if(typeof __IA_TRACE==='function') __IA_TRACE";
  const CALL = "  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport);\n";
  const KEEP = "      if(after < before){ before = after; if(!before) return 1; }\n";
  const SIG  = "function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport){\n";
  const LOOP = "  for(const sp of sports){\n    const days = sportDayIndices[sp] || [];\n";
  const NPL  = "  let _nrcPlan = null;\n";
  [[P,CALL,'SHC call'],[P,KEEP,'SHC keep'],[P,SIG,'SHC signature'],[P,LOOP,'SHC sport loop'],[P,NPL,'_nrcPlan decl']].forEach(([s,a,t])=>need(s,a,t));
  let PT = A.replace(PANCH, PREPL('', " "+TR+"('chooser',{goal:_msG,k:_k,idxs:_pk.idxs.slice(),typeOf:Object.assign({},_pk.typeOf),untol:_pk.untol,days:cardioTrainDays.slice(),d2s:dayToSport.slice()});"));
  PT = PT.replace(CALL, "  "+TR+"('pre',{sst:Object.assign({},sportSessionTypes),sdi:JSON.parse(JSON.stringify(sportDayIndices)),days:cardioTrainDays.slice(),d2s:dayToSport.slice(),plan:_nrcPlan?Object.assign({},_nrcPlan):null});\n" + CALL +
                           "  "+TR+"('post',{sst:Object.assign({},sportSessionTypes)});\n");
  PT = PT.replace(KEEP, "      if(after < before){ "+TR+"('swap',{sp:sp,dx:cardioTrainDays[days[x]],dy:cardioTrainDays[days[y]],sx:sx,sy:sy,before:before,after:after}); before = after; if(!before) return 1; }\n");
  put('PT', PT);
  // PF = P + spaceHardCardio skips the run sport on a chooser-planned build.
  //   PFms : flag set only by the multi-sport P chooser (solo builds untouched).
  //   PFall: flag = _nrcPlan (also set by the V206 solo chooser: NRC capped, pace).
  const mkPF=(flagExpr, setFlag)=>{ let s = A.replace(PANCH, PREPL(setFlag,''));
    s = s.replace(NPL, NPL + "  let _msFlag = false;\n");
    s = s.replace(CALL, "  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, "+flagExpr+");\n");
    s = s.replace(SIG, "function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _skipSport){\n");
    s = s.replace(LOOP, "  for(const sp of sports){\n    if(sp === _skipSport) continue;\n    const days = sportDayIndices[sp] || [];\n");
    return s; };
  put('PFms', mkPF("_msFlag ? 'run' : null", " _msFlag = true;"));
  put('PFall', mkPF("_nrcPlan ? 'run' : null", ""));
  console.log('[prep] wrote CUR A P PT PFms PFall under', outdir);
}

// ───────────────────────────── SWEEP ─────────────────────────────
function sweep(html, label, outp, solo){
  const { load } = require(path.join(REPO,'tests','harness.js'));
  const IA = load(html); const rows=[]; const t0=Date.now(); let crash=0;
  let TRC=null; IA.ctx.__IA_TRACE = (k,o)=>{ if(TRC) TRC.push([k,o]); };
  const FP = {};   // NRC only: goal|week -> {fingerprint: count}
  const NAMES = {}; // NRC run subtype -> count
  const lattice=[]; Object.keys(RUNG).forEach(g=>(solo?[{}]:EXTRAS).forEach(ex=>FOCI.forEach(f=>CALS.forEach(rest=>lattice.push([g,ex,f,rest])))));
  const LIM = +process.env.LIMIT || lattice.length;
  lattice.slice(0,LIM).forEach(([g,ex,f,rest])=>{
    let p; CURG=g; TRC=[]; try{ p=IA.buildProgram(mkCfg(g,ex,rest,f,1001)); }catch(e){ crash++; rows.push({g,ex,f,rest,crash:String(e).slice(0,160)}); return; }
    const wks=Object.keys(p.weeks).sort((a,b)=>+a-+b);
    const ISO=['mon','tue','wed','thu','fri','sat','sun']; const IPOS=d=>ISO.indexOf(d);
    const train = ISO.filter(d=>!rest.includes(d)); const lastTrain = train[train.length-1];
    const row={g,combo:(ex.bike?'B':'')+(ex.swim?'S':''),f,rest,W:wks.length,untolW:[],Rt:0,Lu:0,RB:0,BB:0,
      longWk:0,dupRecW:0,recW:0,longNotLastRun:0,longNotLastTrain:0,longNotLastRunW:[],sig:'',w1:''};
    const sigParts=[];
    wks.forEach(wk=>{ const S=sessions(p.weeks[wk]); const a=adj(S);
      if(a.Ru) row.untolW.push(+wk); if(a.Rt) row.Rt++; row.Lu+=a.Lu; row.RB+=a.RB; row.BB+=a.BB;
      const lay = DAYS.map(d=>{const s=S.filter(x=>x.day===d); return s.length?d+':'+s.map(x=>x.sport[0]+'.'+x.t).join('+'):null;}).filter(Boolean).join(' ');
      sigParts.push(lay); if(wk===wks[0]) row.w1=lay;
      if(NRC.has(g)){
        const runs=S.filter(x=>x.sport==='run'); const L=runs.find(x=>x.t==='nlong');
        const recs=runs.filter(x=>/^Recovery Run/.test(String(x.c.subtype||''))); if(recs.length>=2){ row.recW++; const f=recs.map(x=>JSON.stringify(x.c)); if(new Set(f).size<f.length) row.dupRecW++; }
        if(L){ row.longWk++; if(runs.some(x=>IPOS(x.day)>IPOS(L.day))){ row.longNotLastRun++; row.longNotLastRunW.push(+wk); } if(L.day!==lastTrain) row.longNotLastTrain++; }
        runs.forEach(x=>{ const nm=String(x.c.subtype||''); NAMES[nm]=(NAMES[nm]||0)+1;
          const k=g+'|'+wk; const fp=H(JSON.stringify(x.c)); (FP[k]=FP[k]||{})[fp]=(FP[k][fp]||0)+1; });
      }
    });
    row.sig=H(sigParts.join('/'));
    // trace summary (PT only)
    if(TRC.length){ const ch=TRC.find(t=>t[0]==='chooser'); const pre=TRC.find(t=>t[0]==='pre'); const post=TRC.find(t=>t[0]==='post');
      row.ch = !!ch; row.planned = !!(pre&&pre[1].plan);
      row.swaps = TRC.filter(t=>t[0]==='swap').map(t=>({sp:t[1].sp,dx:t[1].dx,dy:t[1].dy,sx:t[1].sx,sy:t[1].sy,b:t[1].before,a:t[1].after}));
      if(pre&&post){ // recIdx orphan: a run day typed nrc_recovery after SHC with no _recIdx key
        let orphan=0; (pre[1].sdi.run||[]).forEach(i=>{ if(post[1].sst[i+'_run']==='nrc_recovery' && post[1].sst[i+'_run_recIdx']===undefined) orphan++; }); row.recOrphan=orphan; }
    }
    rows.push(row);
  });
  fs.writeFileSync(outp, JSON.stringify({label, html, n:rows.length, crash, ms:Date.now()-t0, FP, NAMES, rows}));
  console.log(`[sweep ${label}] builds ${rows.length} crash ${crash} ms ${Date.now()-t0}`);
}

// ───────────────────────────── TRACE ─────────────────────────────
function trace(outdir){
  const P = JSON.parse(fs.readFileSync(path.join(outdir,'P.json'),'utf8'));
  const { load } = require(path.join(REPO,'tests','harness.js')); const IA=load(path.join(outdir,'PT','index.html'));
  let TRC=[]; IA.ctx.__IA_TRACE=(k,o)=>TRC.push([k,JSON.parse(JSON.stringify(o))]);
  const bad = P.rows.filter(r=>!r.crash && NRC.has(r.g) && r.untolW.length);
  console.log(`\n== TRACE: P NRC builds with >=1 R-untolerated week: ${bad.length} builds, ${bad.reduce((a,r)=>a+r.untolW.length,0)} weeks ==`);
  const exOf = c => ({ B:{bike:null}, S:{swim:null} });
  bad.forEach(r=>{
    const ex={}; // recover extras from combo + label is lossy; rebuild from P row fields
    const ro = P.rows.indexOf(r); // lattice index -> extras
    const lat=[]; Object.keys(RUNG).forEach(g=>EXTRAS.forEach(e=>FOCI.forEach(f=>CALS.forEach(rest=>lat.push([g,e,f,rest])))));
    const [g,e,f,rest]=lat[ro]; TRC=[]; CURG=g;
    const p=IA.buildProgram(mkCfg(g,e,rest,f,1001));
    const ch=TRC.find(t=>t[0]==='chooser'), pre=TRC.find(t=>t[0]==='pre'), post=TRC.find(t=>t[0]==='post'), sw=TRC.filter(t=>t[0]==='swap');
    const map=(sst,days,sdi,sp)=>(sdi[sp]||[]).map(i=>days[i]+':'+String(sst[i+'_'+sp]).replace('nrc_','')).join(' ');
    console.log(`\n  ${g} ${JSON.stringify(e)} ${f} rest=[${rest}]  untolerated weeks ${JSON.stringify(r.untolW)} of ${r.W}`);
    if(ch) console.log(`    chooser : idxs=${JSON.stringify(ch[1].idxs)} days=${ch[1].idxs.map(i=>ch[1].days[i]).join(',')} typeOf=${JSON.stringify(ch[1].typeOf)} chooser.untol=${ch[1].untol}`);
    else console.log('    chooser : DID NOT RUN');
    console.log(`    dayToSport: ${pre[1].days.map((d,i)=>d+'='+(pre[1].d2s[i]||'-')).join(' ')}`);
    ['run','bike','swim'].forEach(sp=>{ if(pre[1].sdi[sp]) console.log(`    pre-SHC  ${sp.padEnd(4)}: ${map(pre[1].sst,pre[1].days,pre[1].sdi,sp)}`); });
    sw.forEach(t=>console.log(`    SWAP kept: sport=${t[1].sp} ${t[1].dx}<->${t[1].dy} (${t[1].sx} <-> ${t[1].sy}) untyped run+bike collisions ${t[1].before} -> ${t[1].after}`));
    if(!sw.length) console.log('    SWAP kept: none');
    ['run','bike','swim'].forEach(sp=>{ if(pre[1].sdi[sp]) console.log(`    post-SHC ${sp.padEnd(4)}: ${map(post[1].sst,pre[1].days,pre[1].sdi,sp)}`); });
    r.untolW.forEach(wk=>{ const S=sessions(p.weeks[wk]); console.log(`    final wk${wk}: ${DAYS.map(d=>{const s=S.filter(x=>x.day===d); return s.length?d+':'+s.map(x=>x.sport[0]+'.'+x.t).join('+'):null;}).filter(Boolean).join(' ')}`); });
    // what week 1 looks like, for contrast with untolerated weeks
    const S1=sessions(p.weeks['1']); console.log(`    final wk1: ${DAYS.map(d=>{const s=S1.filter(x=>x.day===d); return s.length?d+':'+s.map(x=>x.sport[0]+'.'+x.t).join('+'):null;}).filter(Boolean).join(' ')}   adj=${JSON.stringify(adj(S1))}`);
  });
}

// ───────────────────────────── MANNY ─────────────────────────────
function manny(outdir){
  const { load, fixtures, progDigest } = require(path.join(REPO,'tests','harness.js'));
  ['CUR','A','P','PT','PFms','PFall'].forEach(l=>{ const IA=load(path.join(outdir,l,'index.html'));
    const d1=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY)))), d2=progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
    console.log(`[manny] ${l.padEnd(5)} v${IA.version} digest ${d1} self-equal ${d1===d2} ${d1==='0ac7da6b1691a8e1'?'== V206 pin':'!= V206 pin 0ac7da6b1691a8e1'}`); });
}

// ───────────────────────────── REPORT ─────────────────────────────
function report(outdir){
  const L=['CUR','A','P','PT','PFms','PFall']; const D={};
  L.forEach(l=>{ D[l]=JSON.parse(fs.readFileSync(path.join(outdir,l+'.json'),'utf8')); console.log(`[load] ${l} builds ${D[l].n} crash ${D[l].crash} ms ${D[l].ms}`); });
  const fam = g => NRC.has(g)?'NRC':(g==='run_pace_goal'?'pace':'base');
  console.log('\n== 0. INSTRUMENT IDENTITY: PT (trace hooks) vs P, full-program layout signature ==');
  { let diff=0; D.P.rows.forEach((r,i)=>{ if(r.sig!==D.PT.rows[i].sig) diff++; }); console.log(`   PT != P on ${diff}/${D.P.n} builds`); }
  console.log('\n== 1. R-UNTOLERATED WEEKS by family (weeks with >=1 untolerated run adjacency / all weeks) + lens-L pair counts ==');
  L.forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash) return; const k=fam(r.g); const a=m[k]=m[k]||{c:0,W:0,U:0,cu:0,Rt:0,Lu:0,RB:0,BB:0}; a.c++; a.W+=r.W; a.U+=r.untolW.length; if(r.untolW.length) a.cu++; a.Rt+=r.Rt; a.Lu+=r.Lu; a.RB+=r.RB; a.BB+=r.BB; });
    Object.keys(m).sort().forEach(k=>{ const a=m[k]; console.log(`   ${l.padEnd(5)} ${k.padEnd(5)} builds ${a.c}  R-untol weeks ${a.U}/${a.W}  builds-with ${a.cu}/${a.c}  R-tolOnly-wks ${a.Rt} | L-untol pairs ${a.Lu}  run-bike pairs ${a.RB}  bike-bike pairs ${a.BB}`); }); });
  console.log('\n== 1b. R-untolerated weeks, NRC, by goal x combo x nTrain (P, PFms) ==');
  ['A','P','PFms'].forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash||!NRC.has(r.g)||!r.untolW.length) return; const k=r.g+' '+r.combo+' nT='+(7-r.rest.length)+' rest=['+r.rest+']'; m[k]=(m[k]||0)+r.untolW.length; });
    const ks=Object.keys(m); console.log(`   [${l}] ${ks.length} distinct goal/combo/calendar keys`); if(l!=='A') ks.sort().forEach(k=>console.log('     '+k+'  weeks '+m[k])); });
  console.log('\n== 2. SPACEHARDCARDIO KEPT SWAPS under P (PT trace), per build ==');
  { const m={}; D.PT.rows.forEach(r=>{ if(r.crash) return; const k=fam(r.g)+(r.ch?' chooser-ran':' chooser-not-run'); const a=m[k]=m[k]||{c:0,sw:0,bRun:0,bBike:0,bSwim:0,runSw:0,longMoved:0,orphan:0,orphB:0};
      a.c++; if(r.swaps&&r.swaps.length) a.sw++; const sps=new Set((r.swaps||[]).map(s=>s.sp)); if(sps.has('run')) a.bRun++; if(sps.has('bike')) a.bBike++; if(sps.has('swim')) a.bSwim++;
      (r.swaps||[]).forEach(s=>{ if(s.sp==='run'){ a.runSw++; if(/long/.test(s.sx)||/long/.test(s.sy)) a.longMoved++; } }); a.orphan+=(r.recOrphan||0); if(r.recOrphan) a.orphB++; });
    Object.keys(m).sort().forEach(k=>{ const a=m[k]; console.log(`   ${k.padEnd(24)} builds ${a.c}  any-swap ${a.sw}  run-swap builds ${a.bRun}  bike-swap builds ${a.bBike}  swim-swap builds ${a.bSwim}  run swaps ${a.runSw} (touching a long ${a.longMoved})  recIdx-orphan builds ${a.orphB} (days ${a.orphan})`); });
    const ty={}; D.PT.rows.forEach(r=>{ if(r.crash||!r.ch) return; (r.swaps||[]).forEach(s=>{ if(s.sp!=='run') return; const k=fam(r.g)+' '+[s.sx,s.sy].sort().join('<->'); ty[k]=(ty[k]||0)+1; }); });
    console.log('   run swap type pairs on chooser-ran builds: '+JSON.stringify(ty));
    const sg={}; D.PT.rows.forEach(r=>{ if(r.crash||!r.ch) return; const k=fam(r.g)+' '+r.combo+' nT='+(7-r.rest.length); const a=sg[k]=sg[k]||{c:0,rs:0}; a.c++; if((r.swaps||[]).some(x=>x.sp==='run')) a.rs++; });
    console.log('   run-swap builds / chooser-ran builds by family x combo x nTrain:'); Object.keys(sg).sort().forEach(k=>{ if(sg[k].rs) console.log('     '+k.padEnd(22)+' '+sg[k].rs+'/'+sg[k].c); }); }
  console.log('\n== 3. LAYOUT MOVES (full-program layout signature) ==');
  [['A','P'],['P','PFms'],['P','PFall'],['PFms','PFall'],['CUR','A']].forEach(([x,y])=>{ const m={}; let n=0; D[x].rows.forEach((r,i)=>{ const s=D[y].rows[i]; if(r.crash||s.crash) return; if(r.sig!==s.sig){ n++; const k=fam(r.g); m[k]=(m[k]||0)+1; } });
    const den={}; D[x].rows.forEach(r=>{ den[fam(r.g)]=(den[fam(r.g)]||0)+1; });
    console.log(`   ${x} -> ${y}: ${n}/${D[x].n} builds moved  `+Object.keys(den).sort().map(k=>k+' '+(m[k]||0)+'/'+den[k]).join('  ')); });
  console.log('\n== 4. NRC LONG-RUN PIN, ISO week Mon..Sun (weeks containing a Long Run session) ==');
  L.forEach(l=>{ let c=0,W=0,nr=0,nt=0,bn=0; const seg={}; D[l].rows.forEach(r=>{ if(r.crash||!NRC.has(r.g)) return; c++; W+=r.longWk; nr+=r.longNotLastRun; nt+=r.longNotLastTrain; if(r.longNotLastRun){ bn++; const k=r.g+' '+r.combo; seg[k]=(seg[k]||0)+r.longNotLastRun; } });
    let rw=0,dr=0; D[l].rows.forEach(r=>{ if(r.crash||!NRC.has(r.g)) return; rw+=r.recW; dr+=r.dupRecW; });
    console.log(`   ${l.padEnd(5)} weeks with >=2 recovery runs ${rw}, of which two recovery runs are byte-identical ${dr}`);
    console.log(`   ${l.padEnd(5)} NRC builds ${c}  long-run weeks ${W}  not-last-run-of-week ${nr}/${W} (builds ${bn})  not-on-last-training-day ${nt}/${W}  ${JSON.stringify(seg)}`); });
  console.log('\n== 5. NRC VERBATIM: every NRC run session object under X must exist in CUR, same goal + week ==');
  ['A','P','PFms','PFall'].forEach(l=>{ let tot=0,miss=0; const mk={}; Object.entries(D[l].FP).forEach(([k,fps])=>{ const ref=D.CUR.FP[k]||{}; Object.entries(fps).forEach(([fp,n])=>{ tot+=n; if(!ref[fp]){ miss+=n; mk[k.split('|')[0]]=(mk[k.split('|')[0]]||0)+n; } }); });
    const newNames=Object.keys(D[l].NAMES).filter(n=>!D.CUR.NAMES[n]);
    console.log(`   ${l.padEnd(5)} NRC run sessions ${tot}  absent-from-CUR ${miss}  ${JSON.stringify(mk)}  subtype strings not in CUR: ${newNames.length} ${JSON.stringify(newNames.slice(0,8))}`); });
  // doctrine: every NRC name root must appear in the Nike transcriptions
  const dtxt = ['nikerunclub5k','nikerunclub10k','nikerunclubhalfmarathon','nikerunclubmarathon'].map(f=>{ try{ return fs.readFileSync(path.join(REPO,'doctrine',f+'.txt'),'utf8').toLowerCase(); }catch(e){ return ''; } }).join('\n');
  const roots={}; Object.entries(D.P.NAMES).forEach(([n,c])=>{ const r=n.split(' — ')[0].replace(/ \(.*\)$/,'').trim(); roots[r]=(roots[r]||0)+c; });
  console.log(`   doctrine text loaded ${dtxt.length} chars. P NRC subtype roots (count, found-in-doctrine):`);
  Object.entries(roots).sort((a,b)=>b[1]-a[1]).forEach(([r,c])=>console.log(`     ${String(c).padStart(7)}  ${JSON.stringify(r)}  ${dtxt.includes(r.toLowerCase())}`));
  console.log('\n== 6. SOLO lattice (run only, 6 goals x 3 foci x 99 cals): PFall vs P/CUR ==');
  ['CUR','P','PFall'].forEach(l=>{ const f=path.join(outdir,'solo_'+l+'.json'); if(!fs.existsSync(f)){ console.log('   missing '+f); return; } D['s'+l]=JSON.parse(fs.readFileSync(f,'utf8')); });
  if(D.sCUR&&D.sP&&D.sPFall){ [['sCUR','sP'],['sP','sPFall']].forEach(([x,y])=>{ const m={}; let n=0; D[x].rows.forEach((r,i)=>{ if(r.sig!==D[y].rows[i].sig){ n++; m[fam(r.g)]=(m[fam(r.g)]||0)+1; } }); console.log(`   ${x}->${y}: ${n}/${D[x].n} moved ${JSON.stringify(m)}`); });
    ['sCUR','sP','sPFall'].forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(!NRC.has(r.g)) return; const k='nT='+(7-r.rest.length); const a=m[k]=m[k]||{c:0,W:0,U:0}; a.c++; a.W+=r.W; a.U+=r.untolW.length; }); console.log(`   ${l} NRC solo R-untol by nTrain `+JSON.stringify(m)); });
    ['sP','sPFall'].forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ const k=fam(r.g); const a=m[k]=m[k]||{W:0,U:0,nr:0,LW:0}; a.W+=r.W; a.U+=r.untolW.length; a.nr+=r.longNotLastRun; a.LW+=r.longWk; }); console.log(`   ${l} `+JSON.stringify(m)); }); }
}

const [mode,a1,a2,a3,a4]=process.argv.slice(2);
if(mode==='prep') prep(a1); else if(mode==='sweep') sweep(a1,a2,a3,a4==='solo'); else if(mode==='trace') trace(a1);
else if(mode==='manny') manny(a1); else if(mode==='report') report(a1);
else { console.error('usage: prep|sweep|trace|manny|report'); process.exit(2); }
