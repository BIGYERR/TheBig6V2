// v213_d113a_amended.js — MODE B re-measure of D113a AS AMENDED by coach after v213_d113a_remeasure.js.
// Read-only against index.html. ONE surgery copy, FULL2, built from V212 HEAD:
//   A     = tests/edits/v205_d113_d122_edit.py byte-for-byte (7 anchors, count 1 each)
//   + P   = v207 placement routing, gate AMENDED: pace routes only when !walk-only && k >= 3; NRC (D146) keeps k >= 2
//   + PF  = spaceHardCardio skips the run sport when the multi-sport chooser ran (v207 PFms, verbatim)
//   + FB  = spacer fallback inside _nrcSpacedRunDays at capDays 3 (untol > 0 -> easy/INT/long), flagged on the
//           RETURNED OBJECT (_fbFired), never a closure latch, so gates that lift the function into a bare VM run it
//   + W   = walk-only key = D132's own cause key (cardioMode noimpact | noimpact_swim, sportDayTargets :5164),
//           read once from _d132Plan; passed to the chooser as a PARAMETER (_walk); the D113 3-day row
//           (getSessionTypes paceFam) and E3a's _paceSession are both gated !walk-only
//   + X   = E3b: the V115 crossover stays ON for a fallback week: (!_paceSession || _d113Fb)
//   node v213_d113a_amended.js prep     <outdir>     (expects nothing; writes CUR2 and FULL2 under outdir)
//   node v213_d113a_amended.js fallback <outdir>     7 oracle calendars x foci x injuries: FULL2 vs CUR cardio, day by day
//   node v213_d113a_amended.js d7pop    <outdir>     35 three-training-day solo pace calendars x tw 6/9/11/15 x 3 foci
//   node v213_d113a_amended.js report   <outdir>     reads the v213_d113a_remeasure.js sweep JSONs (CUR.json, FULL2.json, ...)
//   node v213_d113a_amended.js post     <outdir>     g199 C1 / g197d E1g cause classification (see function)
// ORACLES: adjacency from the D130 text; the 7 calendars from engine-free enumeration; cross = max(3, ceil(tw*0.55))
// typed from the V115 ruling text (g202's handCrossover), never read from the engine.
const fs=require('fs'),path=require('path'),cp=require('child_process'),crypto=require('crypto');
const REPO=path.join(__dirname,'..','..');
const H=require(path.join(REPO,'tests','harness.js'));
const DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const POS=d=>DAYS.indexOf(d); const CIRC=(a,b)=>{const r=Math.abs(POS(a)-POS(b));return Math.min(r,7-r);}; const PREV=d=>DAYS[(POS(d)+6)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
const FOCI=['support_prevention','balanced','strength'];
function mkCfg(rest,focus,seed,extra){ return Object.assign({ name:'M', primaryPath:'goal', cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'p',mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi',targetDist:'1.5',targetMins:'10',targetSecs:'0'}},
  eventTargeted:false, liftingFocus:focus, experience:'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
  restDays:rest.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed }, extra||{}); }
function cls(c){ const s=String(c.subtype||''); if(c.type!=='run') return c.type; if(/TIME TRIAL/.test(s)) return 'trial';
  if(/Short Interval \(SI\)/.test(s)) return 'int'; if(/Long Interval \(LI\)/.test(s)) return 'chi';
  if(/^Long Slow Distance/.test(s)) return c.legLoad?'long':'easy'; if(/Incline Walk/.test(s)) return 'walk'; return 'other:'+s.slice(0,30); }
const cardios=x=>(!x||!x.cardio)?[]:[].concat(x.cardio).filter(Boolean);
const handCross=tw=>Math.max(3,Math.ceil(tw*0.55));
function adjRu(S){ const hard=S.filter(x=>['int','chi','long'].includes(x.t)); const L=S.find(x=>x.t==='long'); let u=0;
  for(let a=0;a<hard.length;a++) for(let b=a+1;b<hard.length;b++){ const x=hard[a],y=hard[b]; if(CIRC(x.day,y.day)!==1) continue;
    const tol=!!L&&((x.t==='chi'&&y===L&&x.day===PREV(L.day))||(y.t==='chi'&&x===L&&y.day===PREV(L.day))); if(!tol) u++; } return u; }
function oracle7(){ const P=[['int','chi','long'],['int','long','chi'],['chi','int','long'],['chi','long','int'],['long','int','chi'],['long','chi','int']];
  return combos(DAYS,3).filter(c=>Math.min(...P.map(p=>adjRu(c.map((d,i)=>({day:d,t:p[i]})))))>0).map(c=>c.join('+')); }

function prep(outdir){
  const put=(n,s)=>{ fs.mkdirSync(path.join(outdir,n),{recursive:true}); fs.writeFileSync(path.join(outdir,n,'index.html'),s); };
  const cnt=(s,a)=>s.split(a).length-1;
  const cur=cp.execSync('git show HEAD:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28});
  console.log('[prep] HEAD',cp.execSync('git rev-parse --short HEAD',{cwd:REPO,encoding:'utf8'}).trim(),'ia-version',(cur.match(/name="ia-version" content="(\d+)"/)||[])[1]);
  put('CUR2',cur); put('A2',cur);
  const py=cp.spawnSync('python3',[path.join(REPO,'tests','edits','v205_d113_d122_edit.py')],{cwd:path.join(outdir,'A2'),encoding:'utf8'});
  console.log('[prep A] python exit',py.status,'\n'+py.stdout+py.stderr); if(py.status!==0) throw new Error('A failed');
  let s=fs.readFileSync(path.join(outdir,'A2','index.html'),'utf8');
  const R=(old,neu,tag,n)=>{ const c=cnt(s,old); console.log(`[prep] ${tag.padEnd(34)} count=${c}${n?' (want '+n+')':''}`); if(c!==(n||1)) throw new Error(tag); s=s.split(old).join(neu); };
  R("  const _alloc = sportDayTargets(",
    "  // D113a amended (measure surgery): D132's walk-only cause key, read once.\n  const _d113Walk = !!(_d132Plan && (_d132Plan.cardioMode === 'noimpact' || _d132Plan.cardioMode === 'noimpact_swim'));\n  const _alloc = sportDayTargets(",'W decl');
  R("  let _nrcPlan = null;\n","  let _nrcPlan = null;\n  let _msFlag = false;\n  let _d113Fb = false;\n",'flag decls');
  R("      dayToSport.push(pick); assigned[pick]++;\n    }\n  }\n",
    "      dayToSport.push(pick); assigned[pick]++;\n    }\n" +
    "    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);\n" +
    "      const _k = dayToSport.filter(s => s === 'run').length;\n" +
    "      if(((_msPace && !_d113Walk && _k >= 3) || (NRC_GOALS.has(_msG) && _k >= 2)) && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace);\n" +
    "        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;\n" +
    "          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf; _msFlag = true; _d113Fb = !!_pk._fbFired; } } }\n  }\n",'P placement (amended gate)');
  R("  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport);\n","  spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _msFlag ? 'run' : null);\n",'SHC call');
  R("function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport){\n","function spaceHardCardio(sportSessionTypes, sportDayIndices, cardioTrainDays, dayToSport, _skipSport){\n",'SHC signature');
  R("  for(const sp of sports){\n    const days = sportDayIndices[sp] || [];\n","  for(const sp of sports){\n    if(sp === _skipSport) continue;\n    const days = sportDayIndices[sp] || [];\n",'SHC loop');
  R("  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam){\n    const types = paceFam ? getSessionTypes(capDays, isSpeedGoal(goalId), false, false, true)\n",
    "  function _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, _fb, _walk){\n    const types = paceFam ? (_fb ? ['lsd_easy','int','lsd_long'] : getSessionTypes(capDays, isSpeedGoal(goalId), false, false, !_walk))\n",'chooser signature + W row gate');
  R("    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1\n",
    "    if(paceFam && capDays === 3 && !_fb && best && best.untol > 0){ const _alt = _nrcSpacedRunDays(cardioTrainDays, capDays, goalId, paceFam, true, _walk); if(_alt){ _alt._fbFired = true; return _alt; } }\n    return best; // {idxs:[...], typeOf:{dayKey:type}, ...} — never null for capDays≥1\n",'spacer fallback');
  R("_nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped)","_nrcSpacedRunDays(cardioTrainDays, capDays, _soloRunGoal, _paceCapped, undefined, _d113Walk)",'solo chooser calls (x2)',2);
  R("        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below\n","        _nrcPlan = _pick.typeOf;   // read by the NRC type-assignment loop below\n        _d113Fb = !!_pick._fbFired;\n",'solo fallback flag');
  R("      const _paceSession = type === 'run' && PACE_GOALS.has(goalId);\n","      const _paceSession = type === 'run' && PACE_GOALS.has(goalId) && !_d113Walk;\n",'E3a W gate');
  R("                                 && !_paceSession && (protectInt || _perfRun);","                                 && (!_paceSession || _d113Fb) && (protectInt || _perfRun);",'E3b crossover kept on fallback');
  put('FULL2',s); console.log('[prep] wrote CUR2 A2 FULL2 under',outdir);
}
function fallback(outdir){
  const C=H.load(path.join(outdir,'CUR2','index.html')), X=H.load(path.join(outdir,'FULL2','index.html'));
  const cal7=oracle7(); console.log(`[fallback] oracle calendars ${cal7.length}/35: ${cal7.join(' ')}`);
  const INJ=[null,...['shoulder','elbow','lowback','hip','knee','ankle'].flatMap(r=>['protect','workaround','return'].map(t=>({region:r,tier:t})))];
  const seg={};
  cal7.forEach(c=>{ const rest=DAYS.filter(d=>!c.split('+').includes(d)); FOCI.forEach(f=>INJ.forEach(inj=>{
    const cfg=mkCfg(rest,f,1001,inj?{injury:inj}:{}); const a=C.buildProgram(JSON.parse(JSON.stringify(cfg))), b=X.buildProgram(JSON.parse(JSON.stringify(cfg)));
    let cells=0,cd=0,dd=0,chiA=0,intA=0,chiB=0,intB=0; Object.keys(a.weeks).forEach(w=>DAYS.forEach(d=>{ cells++;
      const ca=JSON.stringify(cardios(a.weeks[w][d])), cb=JSON.stringify(cardios((b.weeks[w]||{})[d])); if(ca!==cb) cd++;
      if(JSON.stringify(a.weeks[w][d]||null)!==JSON.stringify((b.weeks[w]||{})[d]||null)) dd++;
      cardios(a.weeks[w][d]).forEach(x=>{ const t=cls(x); if(t==='chi') chiA++; if(t==='int') intA++; });
      cardios((b.weeks[w]||{})[d]).forEach(x=>{ const t=cls(x); if(t==='chi') chiB++; if(t==='int') intB++; }); }));
    const mode=(C.eval('injuryPlan')(cfg)||{}).cardioMode||'none'; const k='mode='+mode;
    const g=seg[k]=seg[k]||{n:0,cardioDiffB:0,cells:0,cd:0,dd:0,digDiff:0,cards:{}}; g.n++; g.cells+=cells; g.cd+=cd; g.dd+=dd; if(cd) g.cardioDiffB++;
    if(H.progDigest(a)!==H.progDigest(b)) g.digDiff++; const ck=`CUR chi${chiA}/int${intA} FULL2 chi${chiB}/int${intB}`; g.cards[ck]=(g.cards[ck]||0)+1; })); });
  Object.keys(seg).sort().forEach(k=>{ const g=seg[k]; console.log(`   ${k.padEnd(20)} builds ${g.n}: cardio differs on ${g.cardioDiffB} builds (${g.cd}/${g.cells} day-cells), any field ${g.dd}/${g.cells} cells, digest differs ${g.digDiff}/${g.n} | cards ${JSON.stringify(g.cards)}`); });
}
function d7pop(outdir){
  const X=H.load(path.join(outdir,'FULL2','index.html')); const cal7=new Set(oracle7()); const TW=[6,9,11,15];
  const out={}; let n=0; const bad=[];
  combos(DAYS,3).forEach(c=>{ const cal=c.join('+'); const rest=DAYS.filter(d=>!c.includes(d)); const grp=cal7.has(cal)?'7-fallback':'28-spaced';
    TW.forEach(tw=>FOCI.forEach(f=>{ n++; const p=X.buildProgram(mkCfg(rest,f,1001,{_raceDateCappedWeeks:tw})); const T=p.totalWeeks; const cr=handCross(T);
      const per=[]; for(let w=1;w<=T;w++){ const S=[]; DAYS.forEach(d=>cardios(p.weeks[w][d]).forEach(x=>{ if(x.type==='run') S.push(cls(x)); })); per.push(S); }
      const runs3=per.every(S=>S.length===3);
      const iW=per.map((S,i)=>S.filter(t=>t==='int').length?i+1:0).filter(Boolean), cW=per.map((S,i)=>S.filter(t=>t==='chi').length?i+1:0).filter(Boolean);
      const twoQ=per.every(S=>S.filter(t=>t==='int').length===1&&S.filter(t=>t==='chi').length===1);
      const wantI=Array.from({length:cr-1},(_,i)=>i+1), wantC=Array.from({length:T-cr+1},(_,i)=>cr+i);
      const v115=JSON.stringify(iW)===JSON.stringify(wantI)&&JSON.stringify(cW)===JSON.stringify(wantC)&&per.every(S=>S.filter(t=>t==='int'||t==='chi').length===1);
      const ok = grp==='28-spaced' ? (runs3&&twoQ) : (runs3&&v115);
      const k=grp+' tw='+T; const a=out[k]=out[k]||{n:0,ok:0,int:0,chi:0,cross:cr}; a.n++; if(ok) a.ok++; a.int+=iW.length; a.chi+=cW.length;
      if(!ok&&bad.length<8) bad.push(`${grp} ${cal} tw=${T} ${f} runs/wk ${per.map(S=>S.length).join('')} INT wks ${iW} CHI wks ${cW}`); })); });
  console.log(`[d7pop] builds ${n} (35 calendars x ${TW.length} lengths x 3 foci); rule: 28-spaced = 3 runs + exactly one INT + one CHI every week; 7-fallback = 3 runs, INT weeks 1..cross-1, CHI weeks cross..tw, one quality per week`);
  Object.keys(out).sort().forEach(k=>{ const a=out[k]; console.log(`   ${k.padEnd(20)} rule holds ${a.ok}/${a.n}  (cross ${a.cross}) INT-card weeks/build ${(a.int/a.n).toFixed(2)} CHI-card weeks/build ${(a.chi/a.n).toFixed(2)}`); });
  bad.forEach(b=>console.log('   MISS '+b));
}
const pct=(a,b)=>b?(100*a/b).toFixed(2)+'%':'-';
function report(outdir){
  const rd=f=>JSON.parse(fs.readFileSync(path.join(outdir,f),'utf8'));
  const NRC=new Set(['run_5k','run_10k','run_half','run_marathon']); const fam=g=>NRC.has(g)?'NRC':(g==='run_pace_goal'?'pace':'base');
  const C=rd('CUR.json'), F=rd('FULL2.json'), F1=rd('FULL.json'), SC=rd('solo_CUR.json'), SF=rd('solo_FULL2.json'), TC=rd('dated_CUR.json'), TF=rd('dated_FULL2.json');
  console.log(`[load] multi ${F.n} crash ${F.crash} | solo ${SF.n} crash ${SF.crash} | dated ${TF.n} crash ${TF.crash}`);
  const m={}; F.rows.forEach(r=>{ const k=fam(r.g); const a=m[k]=m[k]||{W:0,U:0,BB:0,Lu:0,RB:0,ln:0,lw:0}; a.W+=r.W; a.U+=r.untolW.length; a.BB+=r.BB; a.Lu+=r.Lu; a.RB+=r.RB; a.ln+=r.longNotLastRun; a.lw+=r.longWk; });
  Object.keys(m).sort().forEach(k=>{ const a=m[k]; console.log(`   FULL2 ${k.padEnd(4)} R-untol wks ${a.U}/${a.W} | L-untol pairs ${a.Lu} run-bike ${a.RB} bike-bike ${a.BB}${k==='NRC'?' | long not last run '+a.ln+'/'+a.lw:''}`); });
  const idx=D=>{ const o={}; D.rows.forEach(r=>{ if(!NRC.has(r.g)) return; Object.entries(r.FP).forEach(([wk,fps])=>Object.entries(fps).forEach(([fp,n])=>{ const k=r.g+'|'+wk; (o[k]=o[k]||{})[fp]=n; })); }); return o; };
  { const ref=idx(C), X=idx(F); let t=0,mi=0; Object.entries(X).forEach(([k,f])=>Object.entries(f).forEach(([fp,n])=>{ t+=n; if(!(ref[k]||{})[fp]) mi+=n; })); console.log(`   FULL2 NRC run sessions ${t} absent-from-CUR ${mi}`); }
  const mv={}; C.rows.forEach((r,i)=>{ const f=F.rows[i]; const mx=Math.max(...Object.keys(r.runsH).map(Number)); const k=fam(r.g)+(fam(r.g)==='pace'?' maxRuns='+mx:''); const a=mv[k]=mv[k]||{n:0,m:0,m1:0}; a.n++; if(r.dig!==f.dig) a.m++; if(r.dig!==F1.rows[i].dig) a.m1++; });
  console.log('   multi digest moved vs CUR (FULL2 | FULL): '+Object.keys(mv).sort().map(k=>`${k} ${mv[k].m}/${mv[k].n} | ${mv[k].m1}`).join('  '));
  { let a=0,b=0; F.rows.forEach((r,i)=>{ if(r.dig!==F1.rows[i].dig){ a++; if(fam(r.g)==='NRC') b++; } }); console.log(`   FULL -> FULL2 multi digest moved ${a}/${F.n} (NRC ${b})`); }
  const sm={}; SC.rows.forEach((r,i)=>{ const k=r.g+' nT='+r.nT; const a=sm[k]=sm[k]||{n:0,m:0}; a.n++; if(r.dig!==SF.rows[i].dig) a.m++; });
  console.log('   solo digest moved vs CUR: '+Object.keys(sm).filter(k=>sm[k].m).map(k=>k+' '+sm[k].m+'/'+sm[k].n).join('  ')+' | total '+Object.values(sm).reduce((a,b)=>a+b.m,0)+'/'+SC.n);
  console.log('   solo pace nT=3 fallback fired '+SF.rows.filter(r=>r.fb).length+' builds; solo R-untol pace '+SF.rows.filter(r=>r.g==='run_pace_goal').reduce((a,r)=>a+r.untolW.length,0));
  const g={}; TF.rows.forEach((r,i)=>{ const c=TC.rows[i]; const k=(r.combo||'solo')+' '+c.pred+'->'+r.pred; g[k]=(g[k]||0)+1; });
  const newInt=TF.rows.filter((r,i)=>r.other.some(x=>/^int/.test(x))&&!TC.rows[i].other.some(x=>/^int/.test(x))).length;
  console.log(`   dated: trial slot CUR->FULL2 ${JSON.stringify(g)}; new INT-beside-trial ${newInt}/${TF.n}; hard in T-1/T-2 ${TF.rows.filter(r=>r.hardWithin2).length}; run after trial ${TF.rows.filter(r=>r.hardAfter).length}; no trial ${TF.rows.filter(r=>!r.trialDay).length}; digest moved ${TF.rows.filter((r,i)=>r.dig!==TC.rows[i].dig).length}/${TF.n}`);
}
// EXTRA2: the populations behind the residual gate trips, read off the FULL2 sweep JSONs.
//  (i) multi-sport pace 3-run weeks (the engine population g205_d125 P8c / g205_d129 P1 rows stand for): long run
//      position in week 1, ISO Mon..Sun, per calendar.  (ii) dated test weeks by what is left beside the trial (g207 D8a/b).
function extra2(outdir){
  const rd=f=>JSON.parse(fs.readFileSync(path.join(outdir,f),'utf8')); const F=rd('FULL2.json'), C=rd('CUR.json'), TC=rd('dated_CUR.json'), TF=rd('dated_FULL2.json');
  const ISO=['mon','tue','wed','thu','fri','sat','sun']; const cal={}; let n=0,mid=0;
  F.rows.forEach(r=>{ if(r.g!=='run_pace_goal'||!r.runsH[3]) return; n++; const runs=r.w1.split(' ').map(x=>x.split(':')).filter(([d,s])=>/r\./.test(s)).map(([d,s])=>({d,t:(s.match(/r\.(\w+)/)||[])[1]}));
    const L=runs.find(x=>x.t==='long'); const last=runs.map(x=>x.d).sort((a,b)=>ISO.indexOf(a)-ISO.indexOf(b)).pop(); const k='train='+ISO.filter(d=>!r.rest.includes(d)).join('+');
    if(L&&L.d!==last){ mid++; cal[k]=(cal[k]||0)+1; } });
  console.log(`[extra2] multi pace builds with a 3-run week: ${n}; week-1 long run NOT the last run (ISO) ${mid}/${n}`); Object.keys(cal).sort().forEach(k=>console.log('   '+k+' '+cal[k]));
  let cn=0; C.rows.forEach(r=>{ if(r.g==='run_pace_goal'&&r.runsH[3]) cn++; }); console.log(`   (CUR has ${cn} such builds)`);
  const bucket=T=>{ const o={}; T.rows.forEach(r=>{ const rest=r.post.split(',').filter(x=>x!=='race'); const k=(r.combo||'solo')+' left='+(rest.join('+')||'NOTHING'); o[k]=(o[k]||0)+1; }); return o; };
  const bc=bucket(TC), bf=bucket(TF); console.log('   dated test week, runs left beside the trial (CUR -> FULL2), of '+TF.n+':');
  Array.from(new Set(Object.keys(bc).concat(Object.keys(bf)))).sort().forEach(k=>{ if((bc[k]||0)!==(bf[k]||0)) console.log('     '+k.padEnd(34)+' '+(bc[k]||0)+' -> '+(bf[k]||0)); });
  const noEasy=T=>T.rows.filter(r=>!r.post.split(',').includes('easy')).length; console.log(`   test weeks with NO easy run left (no shakeout card): CUR ${noEasy(TC)} -> FULL2 ${noEasy(TF)} of ${TF.n}`);
}
const [mode,a1]=process.argv.slice(2);
if(mode==='extra2'){ extra2(a1); process.exit(0); }
if(mode==='prep') prep(a1); else if(mode==='fallback') fallback(a1); else if(mode==='d7pop') d7pop(a1); else if(mode==='report') report(a1);
else { console.error('usage: prep|fallback|d7pop|report <outdir>'); process.exit(2); }
