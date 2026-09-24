// v213_d113a_full3.js — MODE B re-measure of D113a after coach's second ruling. Read-only against index.html.
// Copies (source surgery, scratch only):
//   FULL3 = FULL2 (tests/measure/v213_d113a_amended.js) + (1) + (2)
//   EVE   = V212 HEAD + (2) only                        (the blast of the eve rule alone)
// (1) the routing/3-day-row exclusion key widens from D132's walk-only pair to every injurySweepCardio mode that
//     rewrites all runs: noimpact, noimpact_swim, easy, reduce (injuryPlan :7792-7842). halfstep and swimout stay routed.
// (2) D106a eve rule: on a TEST pin, a training-day eve (T-1, read across the week boundary) carries a shakeout built by
//     buildRunSession with sessionOverride 'lsd_easy' at the EVE's week (prog.easy[week]); a rest-day eve stays rest.
//     Inserted at the END of the pin block, after the trial is moved and _pin.rest deleted, so no later step undoes it.
//     B4's T-2 hard-run replacement is left exactly as shipped.
//   node v213_d113a_full3.js prep    <outdir>   (needs <outdir>/FULL2/index.html from v213_d113a_amended.js)
//   node v213_d113a_full3.js dated   <html> <label> <out.json>
//   node v213_d113a_full3.js quality <html>     every run card under the four excluded modes, 5 goal families x 4 combos x 18 injury states x 99 cals + dated pace
//   node v213_d113a_full3.js nrcdated <a.html> <b.html>   NRC race pins, identity check for the eve rule
//   node v213_d113a_full3.js report  <outdir>
// ORACLE: eve = the calendar day before the test weekday (date arithmetic on raceDate, ISO weeks, crossing into week tw-1);
// training day = not in cfg.restDays. Shakeout = a RUN card whose subtype is an easy run (LSD with legLoad false, Easy Run,
// Recovery Run), read from the card text. Hard = SI/LI/long LSD/trial by text. Lifts = any section on T0/T-1; on T-2 any
// section not labelled post-run mobility (D37/D38 text). dose.key is printed, never used as the oracle.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const REPO=path.join(__dirname,'..','..'); const H=require(path.join(REPO,'tests','harness.js'));
const DAYS=['sun','mon','tue','wed','thu','fri','sat'], ISO=['mon','tue','wed','thu','fri','sat','sun'];
function combos(a,k){ if(k===0) return [[]]; if(a.length<k) return []; const [h,...t]=a; return combos(t,k-1).map(c=>[h,...c]).concat(combos(t,k)); }
const CALS=[]; [0,1,2,3,4].forEach(n=>combos(DAYS,n).forEach(r=>CALS.push(r)));
const INJ=['shoulder','elbow','lowback','hip','knee','ankle'].flatMap(r=>['protect','workaround','return'].map(t=>({region:r,tier:t})));
const RUNG={ run_pace_goal:{targetDist:'1.5',targetMins:'10',targetSecs:'0'}, run_base:{}, run_5k:{}, run_10k:{}, run_half:{}, run_marathon:{} };
function mkCfg(g,ex,rest,focus,seed,extra){ const cg={run:Object.assign({id:g,label:g,mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'},RUNG[g]||{})}; const types=['run'];
  if(ex.bike){ types.push('bike'); cg.bike={id:ex.bike,label:ex.bike,baselineDist:'10',baseline:'10mi'}; } if(ex.swim){ types.push('swim'); cg.swim={id:ex.swim,label:ex.swim,baselineDist:'1000',baseline:'1000m'}; }
  return Object.assign({name:'M',primaryPath:'goal',cardioTypes:types,cardioGoals:cg,eventTargeted:false,liftingFocus:focus,experience:'intermediate',ageBracket:'18-35',equipment:'crossfit',unit:'lbs',
    restDays:rest.slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed},extra||{}); }
const cards=x=>(!x||!x.cardio)?[]:[].concat(x.cardio).filter(Boolean);
function cls(c){ const s=String(c.subtype||''); if(c.type!=='run') return c.type;
  if(/TIME TRIAL|RACE DAY/i.test(s)) return 'trial'; if(/Short Interval \(SI\)/.test(s)) return 'int'; if(/Long Interval \(LI\)/.test(s)) return 'chi';
  if(/^Long Slow Distance/.test(s)) return c.legLoad?'long':'easy'; if(/^Easy Run — Long/.test(s)) return 'long'; if(/^(Easy Run|Recovery Run|Shakeout)/.test(s)) return 'easy';
  if(/Incline Walk/.test(s)) return 'walk'; if(/^Speed Run/.test(s)) return 'speed'; if(/^Long Run/.test(s)) return 'nlong'; return 'other'; }
const HARDC=new Set(['int','chi','long','trial','speed','nlong']);
function prep(outdir){
  const cnt=(s,a)=>s.split(a).length-1; const put=(n,s)=>{ fs.mkdirSync(path.join(outdir,n),{recursive:true}); fs.writeFileSync(path.join(outdir,n,'index.html'),s); };
  const R=(s,old,neu,tag)=>{ const c=cnt(s,old); console.log(`[prep] ${tag.padEnd(30)} count=${c}`); if(c!==1) throw new Error(tag); return s.replace(old,neu); };
  const cur=cp.execSync('git show HEAD:index.html',{cwd:REPO,encoding:'utf8',maxBuffer:1<<28}); const f2=fs.readFileSync(path.join(outdir,'FULL2','index.html'),'utf8');
  const EANCH="      break;\n    }\n  }\n  return schedule;\n}\n\n// ── V115: HARD CARDIO DAYS GET SPACED";
  const EREPL="      break;\n    }\n" +
"    // D106a eve rule (measure surgery): a training-day eve carries a shakeout from the easy-run builder at the eve's week.\n" +
"    if(_pin.test && cardioGoals.run){\n" +
"      const _efl = []; [_pin.w - 1, _pin.w].forEach(w => { if(schedule[w]) _ISO_ORDER.forEach(d => _efl.push({w, d})); });\n" +
"      const _eti = _efl.findIndex(x => x.w === _pin.w && x.d === _pin.race); const _ev = _eti >= 1 ? _efl[_eti - 1] : null;\n" +
"      if(_ev && trainDays.includes(_ev.d)){\n" +
"        const _g = cardioGoals.run, _pg = paceGoalTarget(_g);\n" +
"        const _rbm = parseFloat((_g.baselineDist||'').toString()) || parseFloat((_g.baseline||'').match(/([0-9.]+)/)?.[1]) || ({beginner:1, intermediate:2, advanced:4}[cfg.experience||'intermediate'] || 2);\n" +
"        const _mbs = (_g.mileBestMins !== undefined && _g.mileBestMins !== '') ? (+_g.mileBestMins||0)*60 + (+_g.mileBestSecs||0) : null;\n" +
"        const _sh = buildRunSession(_g.id, _ev.w, Math.max(0, cardioTrainDays.indexOf(_ev.d)), tw, _rbm, cfg.experience||'intermediate', null, cfg.eventTargeted !== false, 'lsd_easy',\n" +
"          _pg.tDist, _pg.tTotalSecs, cfg.ageBracket||'18-35', _mbs, isBaseCardio, null, _taperFor(_ev.w), cfg._paceShift || null, false, false, null);\n" +
"        if(_sh){ _sh.legLoad = false; schedule[_ev.w][_ev.d] = _sh; if(_ev.w === _pin.w) _pin.rest = (_pin.rest||[]).filter(d => d !== _ev.d); }\n" +
// ^ second surgery pass: the first left 1,122/5,985 training-day eves resting, because the trial's origin day enters
//   _pin.rest (moved-from) and buildProgram rests every _pin.rest day; the D37 NRC mover clears it the same way.
"      }\n" +
"    }\n" +
"  }\n  return schedule;\n}\n\n// ── V115: HARD CARDIO DAYS GET SPACED";
  const WOLD="  const _d113Walk = !!(_d132Plan && (_d132Plan.cardioMode === 'noimpact' || _d132Plan.cardioMode === 'noimpact_swim'));\n";
  const WNEW="  const _d113Walk = !!(_d132Plan && ['noimpact','noimpact_swim','easy','reduce'].includes(_d132Plan.cardioMode));\n";
  put('EVE',R(cur,EANCH,EREPL,'EVE eve rule on V212'));
  let s=R(f2,WOLD,WNEW,'FULL3 key widened'); s=R(s,EANCH,EREPL,'FULL3 eve rule'); put('FULL3',s);
  console.log('[prep] wrote EVE FULL3 under',outdir);
}
function dated(html,label,outp){
  const IA=H.load(html); const rows=[]; const t0=Date.now(); let crash=0;
  const DX=[{},{bike:'bike_base'},{bike:'bike_ftp'},{swim:'swim_base'},{bike:'bike_base',swim:'swim_base'}];
  DX.forEach(ex=>CALS.forEach(rest=>[6,9,11].forEach(tw=>ISO.forEach((td,ti)=>{
    const dt=new Date(Date.UTC(2026,8,21)); dt.setUTCDate(dt.getUTCDate()+7*(tw-1)+ti); const iso=dt.toISOString().slice(0,10);
    const cfg=Object.assign(mkCfg('run_pace_goal',ex,rest,'balanced',24865),{eventTargeted:true,primaryPath:'event',raceDate:iso,startDate:'2026-09-21',_raceDateCappedWeeks:tw,_testWeek:tw});
    let p; try{ p=IA.buildProgram(cfg); }catch(e){ crash++; rows.push({crash:String(e).slice(0,160)}); return; }
    const flat=[]; [tw-1,tw].forEach(w=>{ if(p.weeks[w]) ISO.forEach(d=>flat.push({w,d,x:p.weeks[w][d]})); });
    const i0=flat.findIndex(f=>f.w===tw&&f.d===td);
    const at=k=>flat[i0-k]||null;
    const sum=f=>{ if(!f) return null; const x=f.x; const cs=cards(x); const r=cs.find(c=>c.type==='run');
      return {w:f.w,d:f.d,title:x&&x.title||null,rest:!!(x&&x.rest)||!x,secs:(x&&x.sections||[]).map(s=>s.label||''),cardio:cs.map(c=>({type:c.type,cls:cls(c),sub:String(c.subtype||'').slice(0,60),key:c.dose&&c.dose.key||null,dk:c.dose&&c.dose.k||null,mi:c.dose&&c.dose.mi,legLoad:!!c.legLoad}))}; };
    const T0=sum(at(0)), T1=sum(at(1)), T2=sum(at(2)), T3=sum(at(3));
    const eveDay=ISO[(ti+6)%7]; const trainEve=!rest.includes(eveDay);
    const shake=!!T1&&T1.cardio.some(c=>c.type==='run'&&c.cls==='easy');
    const hard12=[T1,T2].reduce((a,t)=>a+(t?t.cardio.filter(c=>c.type==='run'&&HARDC.has(c.cls)).length:0),0);
    const lifts=(T0?T0.secs.length:0)+(T1?T1.secs.length:0)+(T2?T2.secs.filter(l=>!/post-run mobility/i.test(l)).length:0);
    const trialOn=T0&&T0.cardio.some(c=>c.cls==='trial');
    const tw_=p.weeks[tw]||{}; const twRuns=ISO.flatMap(d=>cards(tw_[d]).filter(c=>c.type==='run').map(cls));
    rows.push({combo:(ex.bike?'B':'')+(ex.swim?'S':''),rest,nT:7-rest.length,tw,td,trainEve,shake,hard12,lifts,trialOn,noEasyTW:!twRuns.includes('easy'),T0,T1,T2,T3,dig:H.progDigest(p)});
  }))));
  fs.writeFileSync(outp,JSON.stringify({label,n:rows.length,crash,ms:Date.now()-t0,rows})); console.log(`[dated ${label}] builds ${rows.length} crash ${crash} ms ${Date.now()-t0}`);
}
function quality(html){
  const IA=H.load(html); const plan=IA.eval('injuryPlan'); const EX=[{},{bike:'bike_base'},{swim:'swim_base'},{bike:'bike_ftp',swim:'swim_mile'}];
  const seg={}; let n=0,crash=0; const MODES=new Set(['noimpact','noimpact_swim','easy','reduce']);
  const scan=(p,mode,tag)=>{ Object.values(p.weeks).forEach(w=>DAYS.forEach(d=>cards(w&&w[d]).forEach(c=>{ if(c.type!=='run') return; const k=c.dose&&c.dose.key;
      const q=HARDC.has(cls(c))||!!c.legLoad||['int','chi','long','steady','trial','bench'].includes(k)||/Interval|Tempo|Speed|Fartlek|Hill|Threshold|TIME TRIAL|RACE DAY/i.test(c.subtype||'');
      const a=seg[tag+' mode='+mode]=seg[tag+' mode='+mode]||{cards:0,q:0,eg:null}; a.cards++; if(q){ a.q++; if(!a.eg) a.eg=String(c.subtype)+' key='+k+' leg='+!!c.legLoad; } }))); };
  Object.keys(RUNG).forEach(g=>EX.forEach(ex=>INJ.forEach(inj=>CALS.forEach(rest=>{ const cfg=mkCfg(g,ex,rest,'balanced',1001,{injury:inj}); const mode=(plan(cfg)||{}).cardioMode||'none'; if(!MODES.has(mode)) return;
    let p; try{ p=IA.buildProgram(cfg); }catch(e){ crash++; return; } n++; scan(p,mode,g+(ex.bike||ex.swim?' multi':' solo')); }))));
  INJ.forEach(inj=>CALS.forEach(rest=>[1,4].forEach(ti=>{ const cfg=Object.assign(mkCfg('run_pace_goal',{},rest,'balanced',24865,{injury:inj}),{eventTargeted:true,primaryPath:'event',raceDate:(ti===1?'2026-10-27':'2026-10-30'),startDate:'2026-09-21',_raceDateCappedWeeks:6,_testWeek:6});
    const mode=(plan(cfg)||{}).cardioMode||'none'; if(!MODES.has(mode)) return; let p; try{ p=IA.buildProgram(cfg); }catch(e){ crash++; return; } n++; scan(p,mode,'pace dated'); })));
  console.log(`[quality] builds under the four excluded modes ${n} crash ${crash}`); let tq=0,tc=0;
  Object.keys(seg).sort().forEach(k=>{ const a=seg[k]; tq+=a.q; tc+=a.cards; console.log(`   ${k.padEnd(36)} quality run cards ${a.q}/${a.cards}${a.eg?'  e.g. '+a.eg:''}`); });
  console.log(`   TOTAL quality run cards under noimpact|noimpact_swim|easy|reduce: ${tq}/${tc}`);
}
function nrcdated(a,b){ const A=H.load(a),B=H.load(b); let n=0,mv=0; ['run_5k','run_10k','run_half','run_marathon'].forEach(g=>CALS.forEach(rest=>['2026-11-19','2026-11-22'].forEach(rd=>{
  const cfg=Object.assign(mkCfg(g,{},rest,'balanced',1001),{eventTargeted:true,primaryPath:'event',raceDate:rd,startDate:'2026-09-21'}); n++;
  if(H.progDigest(A.buildProgram(JSON.parse(JSON.stringify(cfg))))!==H.progDigest(B.buildProgram(JSON.parse(JSON.stringify(cfg))))) mv++; })));
  const M=[A,B].map(I=>H.progDigest(I.buildProgram(JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)))));
  console.log(`[nrcdated] NRC race-pinned programs moved ${mv}/${n}; HALF_MANNY ${M[0]} -> ${M[1]} ${M[0]===M[1]?'UNMOVED':'MOVED'} (row 212 ${H.MANNY_DIGEST_BY_VERSION[212]})`); }
function report(outdir){
  const rd=f=>JSON.parse(fs.readFileSync(path.join(outdir,f),'utf8')); const L=['CUR','EVE','FULL2','FULL3']; const D={}; L.forEach(l=>D[l]=rd('e_'+l+'.json'));
  console.log('== eve / T-1 / T-2 on the dated pace lattice ==');
  L.forEach(l=>{ const R=D[l].rows.filter(r=>!r.crash); const te=R.filter(r=>r.trainEve), re=R.filter(r=>!r.trainEve);
    console.log(`   ${l.padEnd(5)} builds ${R.length} crash ${D[l].crash} | training-day eves ${te.length}: lacking a shakeout ${te.filter(r=>!r.shake).length} | rest-day eves ${re.length}: carrying a run ${re.filter(r=>r.T1&&r.T1.cardio.length).length}, not rest ${re.filter(r=>r.T1&&!r.T1.rest).length} | hard runs on T-1/T-2 ${R.reduce((a,r)=>a+r.hard12,0)} | lift sections T0/T-1 + non-mobility T-2 ${R.reduce((a,r)=>a+r.lifts,0)} | trial on test day ${R.filter(r=>r.trialOn).length} | test weeks with no easy run ${R.filter(r=>r.noEasyTW).length}`);
    const seg={}; te.filter(r=>!r.shake).forEach(r=>{ const k=(r.combo||'solo')+' eve='+(r.T1?(r.T1.cardio.map(c=>c.type+'.'+c.cls).join('+')||r.T1.title||'empty'):'none'); seg[k]=(seg[k]||0)+1; });
    Object.keys(seg).sort().forEach(k=>console.log('        lacking: '+String(seg[k]).padStart(5)+' '+k)); });
  { const t2={}; D.FULL3.rows.forEach((r,i)=>{ if(!r.T2) return; const c=D.FULL2.rows[i].T2, n=r.T2; const k='T-2 '+(r.nT===7-r.rest.length&&!r.rest.includes(r.T2.d)?'train':'restday')+' FULL2='+(c.cardio.map(x=>x.type+'.'+x.cls).join('+')||c.title)+' FULL3='+(n.cardio.map(x=>x.type+'.'+x.cls).join('+')||n.title); t2[k]=(t2[k]||0)+1; });
    console.log('== T-2 (B4 as shipped, untouched) FULL2 vs FULL3 content =='); Object.keys(t2).sort().forEach(k=>console.log('   '+String(t2[k]).padStart(5)+' '+k)); }
  const R3=D.FULL3.rows; const h={}; R3.forEach(r=>{ if(!r.trainEve||!r.T1) return; const c=r.T1.cardio.find(c=>c.type==='run')||{}; const k=`title=${r.T1.title} | sub=${c.sub} | dose.k=${c.dk} key=${c.key} legLoad=${c.legLoad} | eve in wk ${r.T1.w===r.tw?'tw':'tw-1'}`; h[k]=(h[k]||0)+1; });
  console.log('== FULL3 shakeout card on training-day eves (histogram) =='); Object.entries(h).sort((a,b)=>b[1]-a[1]).forEach(([k,v])=>console.log('   '+String(v).padStart(5)+' '+k));
  const rep={}; D.FULL2.rows.forEach((r,i)=>{ const s=R3[i]; if(!r.trainEve) return; const b=r.T1?(r.T1.cardio.map(c=>c.type+'.'+c.cls).join('+')||'lift-only/empty'):'none'; rep[(r.combo||'solo')+' '+b]=(rep[(r.combo||'solo')+' '+b]||0)+1; });
  console.log('== what the FULL3 shakeout replaced on training-day eves (FULL2 eve content) =='); Object.keys(rep).sort().forEach(k=>console.log('   '+String(rep[k]).padStart(5)+' '+k));
  const mv=(a,b)=>D[a].rows.filter((r,i)=>r.dig!==D[b].rows[i].dig).length;
  console.log(`== blast == CUR->EVE dated programs moved ${mv('CUR','EVE')}/${D.CUR.n}; FULL2->FULL3 ${mv('FULL2','FULL3')}/${D.CUR.n}; CUR->FULL3 ${mv('CUR','FULL3')}/${D.CUR.n}`);
  { const seg={}; D.CUR.rows.forEach((r,i)=>{ if(r.dig===D.EVE.rows[i].dig) return; const k=(r.combo||'solo')+' trainEve='+r.trainEve; seg[k]=(seg[k]||0)+1; }); console.log('   CUR->EVE moved by segment '+JSON.stringify(seg)); }
  const show=(i,why)=>{ console.log(`\n-- EXAMPLE ${why}: ${D.CUR.rows[i].combo||'solo'} rest=[${D.CUR.rows[i].rest}] tw=${D.CUR.rows[i].tw} test=${D.CUR.rows[i].td}`);
    ['CUR','FULL3'].forEach(l=>{ const r=D[l].rows[i]; ['T3','T2','T1','T0'].forEach(t=>{ const x=r[t]; if(!x){ console.log(`   ${l.padEnd(5)} ${t} -`); return; }
      console.log(`   ${l.padEnd(5)} ${t} w${x.w} ${x.d} title=${x.title} rest=${x.rest} secs=[${x.secs.join('; ')}] cardio=${x.cardio.map(c=>`${c.type}:${c.sub} {k:${c.dk},mi:${c.mi},key:${c.key}} leg=${c.legLoad}`).join(' + ')||'-'}`); }); }); };
  const pick=f=>D.CUR.rows.findIndex(f);
  show(pick((r,i)=>!r.combo&&r.nT===3&&r.trainEve&&!r.shake&&D.FULL3.rows[i].shake),'solo 3-day, training-day eve');
  show(pick((r,i)=>r.combo==='B'&&r.trainEve&&!r.shake&&D.FULL3.rows[i].shake),'multi-sport pace, training-day eve');
  show(pick((r,i)=>!r.combo&&!r.trainEve&&r.nT===4),'rest-day eve');
}
const [mode,a1,a2,a3]=process.argv.slice(2);
if(mode==='prep') prep(a1); else if(mode==='dated') dated(a1,a2,a3); else if(mode==='quality') quality(a1); else if(mode==='nrcdated') nrcdated(a1,a2); else if(mode==='report') report(a1);
else { console.error('usage: prep|dated|quality|nrcdated|report'); process.exit(2); }
