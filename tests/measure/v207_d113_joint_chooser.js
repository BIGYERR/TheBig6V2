// v207_d113_joint_chooser.js — MODE B before-picture for D113's unblock route (remedy 1:
// route multi-sport through _nrcSpacedRunDays). Read-only against index.html.
//   node v207_d113_joint_chooser.js prep   <outdir>            surgery copies CUR/A/R0/B/B4 (anchor counts printed)
//   node v207_d113_joint_chooser.js sweep  <html> <label> <out.json>
//   node v207_d113_joint_chooser.js recon  <html> <label>      the V205 13,248-week sub-lattice, reproduced
//   node v207_d113_joint_chooser.js report <outdir>
//   node v207_d113_joint_chooser.js feas   <outdir>            calendar feasibility, engine-free
// ORACLE. Adjacency classes come from the D130 ruling text, not from the chooser:
//   hard run = INT, CHI, long LSD (NSW tokens) | any legLoad run (NRC tokens).
//   TOLERATED = run CHI on the calendar day before the run long LSD (circular). Nothing else.
//   UNTOLERATED = every other adjacent pair of hard days (circular 7-day week).
//   Lens R = runs only (what D130 ruled). Lens L = runs + legLoad bike (spaceHardCardio's HARD
//   set, swim excluded). Under L a pair touching a bike is never tolerated (nothing ruled it so),
//   and is reported as its own class so coach can see what is ruled and what is not.
// Session classification is by CONTENT: subtype text; long vs easy LSD by legLoad (the NSW path
// prints the same subtype for both). Every subtype -> class mapping is printed for audit.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const REPO = path.join(__dirname, '..', '..');
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const POS = d => DAYS.indexOf(d);
const CIRC = (a,b)=>{ const r=Math.abs(POS(a)-POS(b)); return Math.min(r,7-r); };
const PREV = d => DAYS[(POS(d)+6)%7];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
const CALS = []; [0,1,2,3,4].forEach(n=>combos(DAYS,n).forEach(r=>CALS.push(r)));   // 99 rest patterns, 3..7 training days

const RUNG = { run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'}, run_base:{}, run_5k:{}, run_10k:{}, run_half:{}, run_marathon:{} };
const BIKEG = ['bike_base','bike_ftp','bike_century'], SWIMG = ['swim_base','swim_500_time','swim_mile'];
const EXTRAS = [];
BIKEG.forEach(b=>EXTRAS.push({bike:b})); SWIMG.forEach(s=>EXTRAS.push({swim:s}));
BIKEG.forEach(b=>SWIMG.forEach(s=>EXTRAS.push({bike:b,swim:s})));
const FOCI = ['support_prevention','balanced','strength'];

function mkCfg(runG, ex, rest, focus, seed, expLvl){
  const cg = { run: Object.assign({ id:runG, label:runG, mileBestMins:'8', mileBestSecs:'30', baselineDist:'3', baseline:'3mi' }, RUNG[runG]||{}) };
  const types = ['run'];
  if(ex.bike){ types.push('bike'); cg.bike = { id:ex.bike, label:ex.bike, baselineDist:'10', baseline:'10mi' }; }
  if(ex.swim){ types.push('swim'); cg.swim = { id:ex.swim, label:ex.swim, baselineDist:'1000', baseline:'1000m' }; }
  return { name:'M', primaryPath:'goal', cardioTypes:types, cardioGoals:cg, eventTargeted:false,
    liftingFocus:focus, experience:expLvl||'intermediate', ageBracket:'18-35', equipment:'crossfit', unit:'lbs',
    restDays:rest.slice(), days:DAYS.slice(), bench:135, squat:155, deadlift:185, seed };
}
const SUBMAP = {};
function sessions(w){
  const out=[]; let multiDay=0;
  DAYS.forEach(d=>{ const x=w&&w[d]; if(!x||!x.cardio) return;
    const cs=Array.isArray(x.cardio)?x.cardio:[x.cardio]; if(cs.length>1) multiDay++;
    cs.forEach(c=>{ const s=String(c.subtype||''); let t;
      // CONTENT first. legLoad is consulted only where the NSW path prints one subtype for two
      // sessions (LSD easy vs long) and for Benchmark Run, whose effort depends on its slot.
      let content;
      if(c.type==='run'){
        if(/Interval \(INT\)/.test(s)) t='int';
        else if(/Continuous High Intensity \(CHI\)|^Steady Aerobic Run/.test(s)) t='chi';
        else if(/^Long Slow Distance \(LSD\)/.test(s)) t=c.legLoad?'long':'easy';
        else if(/^Speed Run/.test(s)) t='hardq';
        else if(/^Long Run/.test(s)) t='nlong';
        else if(/RACE DAY|TIME TRIAL/i.test(s)) t='race';
        // run_base prints its LONG run as 'Easy Run — Long' (>40 min) or plain 'Easy Run' (<=40 min),
        // index.html :3952/:3987 — one subtype for two sessions again, so legLoad separates them.
        else if(/^Easy Run/.test(s) && !NRC.has(CURG)) t=c.legLoad?'long':'easy';
        else if(/^(Easy Run|Recovery Run|Shakeout)/.test(s)) t='easy';
        else t=c.legLoad?'hardx':'easyx';
        content = RHARD.has(t);
      } else if(c.type==='bike'){ t=/Sweet Spot|\((CHI|INT)\)|^Long Ride/.test(s)?'bhard':'beasy'; content = t==='bhard'; }
      else if(c.type==='swim'){ t=/\((INT|CHI)\)/.test(s)?'sq':'se'; content=false; }
      else t='other';
      const fam = NRC.has(CURG)?'NRC':'NSW';
      const k=fam+' '+c.type+'|'+s.replace(/^(Speed Run|Long Run|Sweet Spot \(CHI\)|Benchmark Run) — .*$/,'$1').replace(/ — (Taper|Cutback)$/,'').slice(0,48)+'|leg='+!!c.legLoad+' -> '+t+(content!==!!c.legLoad?'   <<FLAG!=CONTENT':''); SUBMAP[k]=(SUBMAP[k]||0)+1;
      out.push({day:d,sport:c.type,t}); }); });
  return {out,multiDay};
}
const RHARD = new Set(['int','chi','long','hardx','hardq','nlong','race']);
const NRC = new Set(['run_5k','run_10k','run_half','run_marathon']); let CURG=null;
// the oracle: typed adjacency on one week's session list
function adj(S){
  const hardR = S.filter(x=>x.sport==='run'&&RHARD.has(x.t));
  const hardL = S.filter(x=>(x.sport==='run'&&RHARD.has(x.t))||x.t==='bhard');
  const long = S.find(x=>x.sport==='run'&&x.t==='long');
  const r = {Ru:0,Rt:0,Lu:0,Lt:0,RB:0,BB:0,RSq:0};
  const tolPair=(x,y)=> !!long && ((x.t==='chi'&&x.sport==='run'&&y===long&&x.day===PREV(long.day))||(y.t==='chi'&&y.sport==='run'&&x===long&&y.day===PREV(long.day)));
  for(let a=0;a<hardR.length;a++) for(let b=a+1;b<hardR.length;b++){ if(CIRC(hardR[a].day,hardR[b].day)!==1) continue; tolPair(hardR[a],hardR[b])?r.Rt++:r.Ru++; }
  for(let a=0;a<hardL.length;a++) for(let b=a+1;b<hardL.length;b++){ const x=hardL[a],y=hardL[b]; if(CIRC(x.day,y.day)!==1) continue;
    if(tolPair(x,y)) r.Lt++; else r.Lu++;
    if(x.sport!==y.sport) r.RB++; else if(x.sport==='bike') r.BB++; }
  S.filter(x=>x.t==='sq').forEach(q=>{ if(hardR.some(h=>CIRC(h.day,q.day)===1)) r.RSq++; });
  return r;
}

function sweep(html, label, outp){
  const { load } = require(path.join(REPO,'tests','harness.js'));
  const IA = load(html); const rows=[]; const t0=Date.now(); let crash=0;
  Object.keys(RUNG).forEach(g=>EXTRAS.forEach(ex=>FOCI.forEach(f=>CALS.forEach(rest=>{
    let p; CURG=g; try{ p=IA.buildProgram(mkCfg(g,ex,rest,f,1001)); }catch(e){ crash++; rows.push({g,ex,f,rest,crash:String(e).slice(0,120)}); return; }
    const wks=Object.keys(p.weeks).sort((a,b)=>+a-+b);
    const row={g,combo:(ex.bike?'B':'')+(ex.swim?'S':''),ex,f,rest,nT:7-rest.length,W:wks.length,
      R:{u:0,t:0,n:0},L:{u:0,t:0,n:0},pairs:{Ru:0,Rt:0,Lu:0,Lt:0,RB:0,BB:0,RSq:0},runsH:{},qualH:{},multiDay:0,w1:null,w1S:null};
    wks.forEach(wk=>{ const {out,multiDay}=sessions(p.weeks[wk]); row.multiDay+=multiDay;
      const a=adj(out); Object.keys(a).forEach(k=>row.pairs[k]+=a[k]);
      row.R[a.Ru?'u':(a.Rt?'t':'n')]++; row.L[a.Lu?'u':(a.Lt?'t':'n')]++;
      const runs=out.filter(x=>x.sport==='run'); row.runsH[runs.length]=(row.runsH[runs.length]||0)+1;
      const q=runs.filter(x=>x.t==='int'||x.t==='chi'||x.t==='hardq').length; row.qualH[q]=(row.qualH[q]||0)+1;
      if(wk===wks[0]){ row.w1=DAYS.map(d=>{const s=out.filter(x=>x.day===d); return s.length?d+':'+s.map(x=>x.sport[0]+'.'+x.t).join('+'):null;}).filter(Boolean).join(' '); row.w1S=out; row.w1adj=a; }
    });
    rows.push(row);
  }))));
  fs.writeFileSync(outp, JSON.stringify({label, html, n:rows.length, crash, ms:Date.now()-t0, submap:SUBMAP, rows}));
  console.log(`[sweep ${label}] builds ${rows.length} crash ${crash} ms ${Date.now()-t0}`);
}

function recon(html, label){
  // V205's measured population, rebuilt: pace + bike_base | swim_base, support_prevention, 64 calendars x 9 seeds.
  const { load } = require(path.join(REPO,'tests','harness.js')); const IA=load(html);
  const SEEDS=[1001,2002,3003,4004,5005,6006,7007,8008,9009]; let W=0,U=0,T=0,P=0,seedVar=0;
  ['bike','swim'].forEach(x=>[3,2,1,0].forEach(n=>combos(DAYS,n).forEach(rest=>{ let ref=null; SEEDS.forEach(seed=>{
    const p=IA.buildProgram(mkCfg('run_pace_goal', x==='bike'?{bike:'bike_base'}:{swim:'swim_base'}, rest,'support_prevention',seed)); P++;
    let lay=[]; Object.keys(p.weeks).forEach(wk=>{ const {out}=sessions(p.weeks[wk]); const runs=out.filter(z=>z.sport==='run'); if(!runs.length) return;
      W++; const a=adj(runs); if(a.Ru) U++; if(a.Rt) T++; lay.push(wk+'='+runs.map(z=>z.day+z.t).join(',')); });
    lay=lay.join(';'); if(ref===null) ref=lay; else if(lay!==ref) seedVar++; }); })));
  console.log(`[recon ${label}] programs ${P} run-weeks ${W} untolerated(R) ${U} tolerated(R) ${T} | seed-variant layouts ${seedVar}/${P-128}`);
}

function prep(outdir){
  fs.mkdirSync(outdir,{recursive:true});
  const cur=fs.readFileSync(path.join(REPO,'index.html'),'utf8');
  const cnt=(s,a)=>s.split(a).length-1;
  const put=(name,s)=>{ fs.mkdirSync(path.join(outdir,name),{recursive:true}); fs.writeFileSync(path.join(outdir,name,'index.html'),s); };
  put('CUR',cur);
  // A = the parked V205 slice-7 edit, byte-for-byte (tests/edits/v205_d113_d122_edit.py), anchors asserted by that script.
  put('A',cur);
  const py=cp.spawnSync('python3',[path.join(REPO,'tests','edits','v205_d113_d122_edit.py')],{cwd:path.join(outdir,'A'),encoding:'utf8'});
  console.log('[prep A] python exit', py.status, '\n'+py.stdout+py.stderr);
  if(py.status!==0) throw new Error('A surgery failed');
  const A=fs.readFileSync(path.join(outdir,'A','index.html'),'utf8');
  // ROUTE surgery: the naive routing. Run days + run types come from _nrcSpacedRunDays over ALL cardio
  // training days at the run quota multiSportTargets already deals; bike/swim then greedy-fill the rest.
  const ANCH = "    const assigned = {}; cardioTypes.forEach(t => assigned[t] = 0);\n    for(let i = 0; i < cardioTrainDays.length; i++) {\n      let pick = null, bestScore = -1;\n      for(const t of iterOrder) {\n";
  const REPL = "    const assigned = {}; cardioTypes.forEach(t => assigned[t] = 0);\n" +
"    let _msRun = null; { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id;\n" +
"      const _msPace = PACE_GOALS.has(_msG), _msNrc = NRC_GOALS.has(_msG); let _msCap = Math.min(targets.run||0, cardioTrainDays.length);\n" +
"      if((_msPace||_msNrc) && _msCap >= 2 && !isBaseCardio){ let _pk = _nrcSpacedRunDays(cardioTrainDays, _msCap, _msG, _msPace);\n" +
"        if(_msPace && _msCap > 3 && (!_pk || _pk.untol > 0)){ _msCap = 3; _pk = _nrcSpacedRunDays(cardioTrainDays, 3, _msG, true); }\n" +
"        if(_pk){ _msRun = new Set(_pk.idxs); _nrcPlan = _pk.typeOf; } } }\n" +
"    for(let i = 0; i < cardioTrainDays.length; i++) {\n" +
"      if(_msRun && _msRun.has(i)){ dayToSport.push('run'); assigned.run++; continue; }\n" +
"      let pick = null, bestScore = -1;\n      for(const t of iterOrder) {\n        if(_msRun && t === 'run') continue;\n";
  const CEIL = "const _ceil = (PACE_GOALS.has(goalId) && (cardioTypes.length !== 1 || _walkOnly)) ? Math.min(ceiling, 3) : ceiling;";
  const CEILR = "const _ceil = (PACE_GOALS.has(goalId) && (_walkOnly)) ? Math.min(ceiling, 3) : ceiling;";
  console.log(`[prep] route anchor count CUR=${cnt(cur,ANCH)} A=${cnt(A,ANCH)} | ceiling anchor count A=${cnt(A,CEIL)}`);
  if(cnt(cur,ANCH)!==1||cnt(A,ANCH)!==1||cnt(A,CEIL)!==1) throw new Error('anchor count != 1');
  put('R0', cur.replace(ANCH,REPL));
  const B=A.replace(ANCH,REPL); put('B',B);
  put('B4', B.replace(CEIL,CEILR));
  // P = A + PLACEMENT-ONLY routing: greedy decides every sport's day COUNT exactly as today; the
  // chooser then decides WHICH days the k run slots sit on (and their types); the non-run
  // assignments (incl. lift-only nulls) are poured back into the other days in their original order.
  const PANCH = "      dayToSport.push(pick); assigned[pick]++;\n    }\n  }\n";
  const PREPL = "      dayToSport.push(pick); assigned[pick]++;\n    }\n" +
"    { const _msG = cardioTypes.includes('run') && cardioGoals.run && cardioGoals.run.id; const _msPace = PACE_GOALS.has(_msG);\n" +
"      const _k = dayToSport.filter(s => s === 'run').length;\n" +
"      if((_msPace || NRC_GOALS.has(_msG)) && _k >= 2 && !isBaseCardio){ const _pk = _nrcSpacedRunDays(cardioTrainDays, _k, _msG, _msPace);\n" +
"        if(_pk){ const _oth = dayToSport.filter(s => s !== 'run'); const _ix = new Set(_pk.idxs); let _o = 0;\n" +
"          for(let i = 0; i < dayToSport.length; i++) dayToSport[i] = _ix.has(i) ? 'run' : _oth[_o++]; _nrcPlan = _pk.typeOf; } } }\n  }\n";
  console.log(`[prep] placement anchor count A=${cnt(A,PANCH)}`); if(cnt(A,PANCH)!==1) throw new Error('P anchor != 1');
  put('P', A.replace(PANCH,PREPL));
  console.log('[prep] wrote CUR A R0 B B4 under', outdir);
}

function pct(a,b){ return b? (100*a/b).toFixed(1)+'%':'-'; }
function report(outdir){
  const L=['CUR','A','R0','B','B4','P']; const D={};
  L.forEach(l=>{ const f=path.join(outdir,l+'.json'); if(!fs.existsSync(f)) throw new Error('missing '+f); D[l]=JSON.parse(fs.readFileSync(f,'utf8')); });
  console.log('\n== CLASSIFIER AUDIT (CUR): subtype -> class, session counts ==');
  Object.entries(D.CUR.submap).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('  '+String(v).padStart(7)+'  '+k));
  const agg=(rows,key)=>{ const m={}; rows.forEach(r=>{ if(r.crash) return; const k=key(r); const a=m[k]=m[k]||{c:0,W:0,Ru:0,Rt:0,Rn:0,Lu:0,Lt:0,Ln:0,cu:0,pRu:0,pRt:0,pLu:0,pRB:0,pBB:0,pRSq:0,r3:0,q2:0,q1:0,q0:0,md:0};
    a.c++; a.W+=r.W; a.Ru+=r.R.u; a.Rt+=r.R.t; a.Rn+=r.R.n; a.Lu+=r.L.u; a.Lt+=r.L.t; a.Ln+=r.L.n; if(r.R.u) a.cu++;
    a.pRu+=r.pairs.Ru; a.pRt+=r.pairs.Rt; a.pLu+=r.pairs.Lu; a.pRB+=r.pairs.RB; a.pBB+=r.pairs.BB; a.pRSq+=r.pairs.RSq; a.r3+=(r.runsH[3]||0);
    a.q2+=(r.qualH[2]||0); a.q1+=(r.qualH[1]||0); a.q0+=(r.qualH[0]||0); a.md+=r.multiDay; }); return m; };
  const hdr='  '+'segment'.padEnd(34)+'cfgs  weeks | R:untol  R:tolOnly  R:none | L:untol  L:tolOnly | pairs Ru Rt RB BB | 3-run wks | qual/wk 2/1/0 | cfgs w/ R-untol';
  const line=(k,a)=>'  '+k.padEnd(34)+String(a.c).padStart(4)+' '+String(a.W).padStart(6)+' | '+(a.Ru+' '+pct(a.Ru,a.W)).padStart(13)+' '+(a.Rt+'').padStart(6)+' '+(a.Rn+'').padStart(7)+' | '+(a.Lu+' '+pct(a.Lu,a.W)).padStart(13)+' '+String(a.Lt).padStart(6)+' | '+[a.pRu,a.pRt,a.pRB,a.pBB].join(' ')+' | '+a.r3+' | '+[a.q2,a.q1,a.q0].join('/')+' | '+a.cu+'/'+a.c;
  L.forEach(l=>{ const rows=D[l].rows; console.log(`\n==== ARTIFACT ${l}  builds ${D[l].n}  crash ${D[l].crash} ====`); console.log(hdr);
    const all=agg(rows,()=>'ALL'); console.log(line('ALL',all.ALL));
    [['goal',r=>r.g],['combo',r=>r.combo],['focus',r=>r.f],['nTrain',r=>'nT='+r.nT],['goal x combo',r=>r.g+' '+r.combo],['goal x focus',r=>r.g+' '+r.f],['pace nTrain x combo',r=>r.g==='run_pace_goal'?('pace nT='+r.nT+' '+r.combo):null]].forEach(([nm,fn])=>{
      console.log('  -- by '+nm); const m=agg(rows,fn); Object.keys(m).filter(k=>k!=='null').sort().forEach(k=>console.log(line(k,m[k]))); });
  });
  // pairwise moves between artifacts, week-1 layout
  console.log('\n== WEEK-1 LAYOUT MOVES BETWEEN ARTIFACTS (configs whose week-1 cardio layout differs) ==');
  [['CUR','A'],['CUR','R0'],['A','B'],['B','B4'],['CUR','B4'],['A','P']].forEach(([x,y])=>{ const bySeg={}; let n=0;
    D[x].rows.forEach((r,i)=>{ const s=D[y].rows[i]; if(r.crash||s.crash) return; if(r.w1!==s.w1){ n++; const k=r.g+' '+r.combo; bySeg[k]=(bySeg[k]||0)+1; } });
    console.log(`  ${x} -> ${y}: ${n}/${D[x].rows.length} moved  ${JSON.stringify(bySeg)}`); });
  // non-routed segments must be identical under routing surgery
  console.log('\n== EXAMPLES: A untolerated (R) weeks, pace, first 6 distinct week-1 layouts ==');
  console.log('\n== RUNS PER WEEK HISTOGRAM (all weeks), goal x combo, per artifact ==');
  L.forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash) return; const k=r.g+' '+r.combo; m[k]=m[k]||{}; Object.entries(r.runsH).forEach(([n,v])=>m[k][n]=(m[k][n]||0)+v); });
    console.log('  ['+l+']'); Object.keys(m).sort().forEach(k=>console.log('    '+k.padEnd(22)+' '+Object.keys(m[k]).sort().map(n=>n+'runs:'+m[k][n]).join('  '))); });
  console.log('\n== WEEK-1 SPORT DAY COUNTS: distribution of (run,bike,swim) and STARVATION (a selected sport with 0 week-1 days) ==');
  L.forEach(l=>{ const m={}; D[l].rows.forEach(r=>{ if(r.crash||!r.w1S) return; const k=r.g+' '+r.combo; const c={run:0,bike:0,swim:0}; r.w1S.forEach(x=>c[x.sport]++);
      const tup=c.run+'/'+(r.ex.bike?c.bike:'-')+'/'+(r.ex.swim?c.swim:'-'); const g=m[k]=m[k]||{n:0,starve:0,t:{}}; g.n++; g.t[tup]=(g.t[tup]||0)+1;
      if((r.ex.bike&&!c.bike)||(r.ex.swim&&!c.swim)||!c.run) g.starve++; });
    console.log('  ['+l+']'); Object.keys(m).sort().forEach(k=>console.log('    '+k.padEnd(22)+' starved '+m[k].starve+'/'+m[k].n+'   '+Object.entries(m[k].t).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([t,v])=>t+':'+v).join(' '))); });
  ['R0','B','B4','P'].forEach(l=>{ console.log('\n== EXAMPLES: '+l+' week-1 R-untolerated, first 2 distinct per goal x combo, with CUR week 1 beside ==');
    const cnt={}; D[l].rows.forEach((r,i)=>{ if(r.crash||!r.w1adj||!r.w1adj.Ru) return; const k=r.g+' '+r.combo; cnt[k]=(cnt[k]||0)+1; if(cnt[k]>2) return;
      console.log(`  ${k} ${r.f} rest=[${r.rest}]\n      ${l.padEnd(3)}: ${r.w1}\n      CUR: ${D.CUR.rows[i].w1}`); }); });
  const seen=new Set(); D.A.rows.filter(r=>r.g==='run_pace_goal'&&r.w1adj&&r.w1adj.Ru).forEach(r=>{ if(seen.size>=6||seen.has(r.w1)) return; seen.add(r.w1); console.log(`  ${r.combo} ${r.f} rest=[${r.rest}] ${r.w1}`); });
  const seen2=new Set(); console.log('== EXAMPLES: B4 lens-L untolerated weeks, pace, first 6 ==');
  D.B4.rows.filter(r=>r.g==='run_pace_goal'&&r.w1adj&&r.w1adj.Lu).forEach(r=>{ if(seen2.size>=6||seen2.has(r.w1)) return; seen2.add(r.w1); console.log(`  ${r.combo} ${r.f} rest=[${r.rest}] ${r.w1}  adj=${JSON.stringify(r.w1adj)}`); });
}

// ── FEASIBILITY: engine-free. Given a calendar (training days) and a multiset of sessions, is there
// ANY one-session-per-day placement with zero untolerated adjacency? Lens R and lens L. ──
const FMEMO = new Map();
function minPlace(train, S){   // S: [{sport,t}], returns {R,L,any} minima over placements
  const key=train.join(',')+'#'+S.map(x=>x.sport[0]+x.t).sort().join(',');
  if(FMEMO.has(key)) return FMEMO.get(key);
  let best={R:99,L:99,any:99}; const used=new Array(train.length).fill(false); const placed=[];
  const toks=S.map(x=>x.sport[0]+x.t).sort(); const Ss=toks.map(k=>({sport:{r:'run',b:'bike',s:'swim'}[k[0]],t:k.slice(1)}));
  (function rec(i,lastDayIdx){ if(i===Ss.length){ const a=adj(placed); const any=a.Ru+a.Rt; if(a.Ru<best.R) best.R=a.Ru; if(a.Lu<best.L) best.L=a.Lu; if(any<best.any) best.any=any; return; }
    const start=(i>0&&toks[i]===toks[i-1])?lastDayIdx+1:0;   // identical tokens placed in increasing day order (dedupe)
    for(let d=start; d<train.length; d++){ if(used[d]) continue; used[d]=true; placed.push({day:train[d],sport:Ss[i].sport,t:Ss[i].t}); rec(i+1,d); placed.pop(); used[d]=false; if(best.R===0&&best.L===0&&best.any===0) return; } })(0,-1);
  FMEMO.set(key,best); return best;
}
function feas(outdir){
  console.log('\n== F1. DOCTRINE TABLE: calendars where zero untolerated adjacency is POSSIBLE (engine-free enumeration) ==');
  console.log('   runs = INT+CHI+long (+easy); bikeHard = legLoad bike sessions; swim/bike-easy fill never matter (non-hard), omitted.');
  console.log('   R = runs-only lens (D130 as ruled)  L = legLoad lens (run+bike, only run-CHI-eve-of-run-long tolerated)  any = untyped run adjacency (the V205 0/14 lesson)');
  const SETS=[['3 hard runs',['int','chi','long'],0],['3 hard + easy run',['int','chi','long','easy'],0],['3 hard runs + 1 bike hard',['int','chi','long'],1],['3 hard runs + 2 bike hard',['int','chi','long'],2],['3 hard + easy + 1 bike hard',['int','chi','long','easy'],1],['3 hard + easy + 2 bike hard',['int','chi','long','easy'],2],
    ['CUR shape: easy+INT+long',['easy','int','long'],0],['CUR shape + 1 bike hard',['easy','int','long'],1],['CUR shape + 2 bike hard',['easy','int','long'],2]];
  for(let nT=3;nT<=7;nT++){ const cals=combos(DAYS,nT);
    SETS.forEach(([nm,runs,hb])=>{ const S=runs.map(t=>({sport:'run',t})).concat(Array.from({length:hb},()=>({sport:'bike',t:'bhard'})));
      if(S.length>nT) return; let R0=0,L0=0,A0=0; cals.forEach(c=>{ const m=minPlace(c,S); if(m.R===0) R0++; if(m.L===0) L0++; if(m.any===0) A0++; });
      console.log(`   nT=${nT} (${String(cals.length).padStart(2)} cals)  ${nm.padEnd(30)} R0 ${String(R0).padStart(2)}/${cals.length}  L0 ${String(L0).padStart(2)}/${cals.length}  any0 ${String(A0).padStart(2)}/${cals.length}`); }); }
  // F2: the engine's actual week-1 multisets, per artifact: is the built untolerated week a placement failure or calendar-bound?
  console.log('\n== F2. BUILT WEEK-1 vs BEST POSSIBLE on the same calendar and the same session multiset ==');
  ['CUR','A','R0','B','B4','P'].forEach(l=>{ const f=path.join(outdir,l+'.json'); if(!fs.existsSync(f)) return; const rows=JSON.parse(fs.readFileSync(f,'utf8')).rows;
    const s={n:0,Ru:0,Rfix:0,Rbound:0,Lu:0,Lfix:0,Lbound:0}; const seg={};
    rows.forEach(r=>{ if(r.crash||!r.w1S) return; s.n++; const train=DAYS.filter(d=>!r.rest.includes(d));
      const S=r.w1S.map(x=>({sport:x.sport,t:x.t})); const m=minPlace(train,S); const k=r.g+' '+r.combo; const g=seg[k]=seg[k]||{n:0,Ru:0,Rfix:0,Lu:0,Lfix:0};
      g.n++;
      if(r.w1adj.Ru){ s.Ru++; g.Ru++; if(m.R===0){ s.Rfix++; g.Rfix++; } else s.Rbound++; }
      if(r.w1adj.Lu){ s.Lu++; g.Lu++; if(m.L===0){ s.Lfix++; g.Lfix++; } else s.Lbound++; } });
    console.log(`  ${l.padEnd(4)} configs ${s.n} | week1 R-untol ${s.Ru}: fixable-on-same-calendar ${s.Rfix}, calendar-bound ${s.Rbound} | week1 L-untol ${s.Lu}: fixable ${s.Lfix}, bound ${s.Lbound}`);
    Object.keys(seg).sort().forEach(k=>{ const g=seg[k]; if(g.Ru||g.Lu) console.log(`       ${k.padEnd(28)} n ${g.n}  R-untol ${g.Ru} (fixable ${g.Rfix})  L-untol ${g.Lu} (fixable ${g.Lfix})`); });
  });
}

const [mode,a1,a2,a3]=process.argv.slice(2);
if(mode==='prep') prep(a1); else if(mode==='sweep') sweep(a1,a2,a3); else if(mode==='recon') recon(a1,a2);
else if(mode==='report') report(a1); else if(mode==='feas') feas(a1);
else { console.error('usage: prep|sweep|recon|report|feas'); process.exit(2); }
