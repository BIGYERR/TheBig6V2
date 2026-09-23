// V209 measure (Mode B) — D107 (CORE_SPEED_TYPES gains 'chi') and D103 (CHI display rename), ia-version 205.
// Read-only. Source-surgery copies written to os.tmpdir(), every anchor asserted count==1.
// Variants:
//   BASE  — index.html as shipped
//   A     — D107 literally: CORE_SPEED_TYPES gains 'chi'
//   B     — INSTRUMENT ONLY (not a proposal): stamp session.assignedType so the set's readers can see a type
//   B+    — B plus 'chi' in the set (what D107 would move IF its readers were live)
//   C     — D103 instrument: run CHI subtype literal (:4031) -> 'Long Interval (LI)'
//   D     — D103 control: same site -> 'Zqx Session (ZQX)' (matches no engine regex)
// Oracle for C/D: a program is "string-only changed" iff its JSON equals BASE after mapping the new
// label back to the old one. Anything else is an engine reader keyed on the label.
const path=require('path'),fs=require('fs'),os=require('os');
const H=require(path.join(__dirname,'..','harness.js'));
const SRC=path.join(__dirname,'..','..','index.html');
const html=fs.readFileSync(SRC,'utf8');
const out=[];const P=s=>{out.push(s);console.log(s);};
function surg(name,edits){ let h=html; edits.forEach(([a,b])=>{ const n=h.split(a).length-1; if(n!==1) throw new Error(name+': anchor count '+n+' for '+a.slice(0,70)); h=h.replace(a,b); });
  const f=path.join(os.tmpdir(),'v209_'+name+'.html'); fs.writeFileSync(f,h); return H.load(f); }
const A_SET="const CORE_SPEED_TYPES = new Set(['int','nrc_speed1','nrc_speed2']);";
const A_NEW="const CORE_SPEED_TYPES = new Set(['int','chi','nrc_speed1','nrc_speed2']);";
const B_ANC="        session.legLoad = (type !== 'swim') && (assignedType === 'int'";
const B_NEW="        session.assignedType = assignedType;\n"+B_ANC;
const OLD='Continuous High Intensity (CHI)';
const C_ANC="    subtype = 'Continuous High Intensity (CHI)' + (isTaperWeek ? ' — Taper' : '');";
const V={ BASE:H.load(SRC), A:surg('A',[[A_SET,A_NEW]]), B:surg('B',[[B_ANC,B_NEW]]), Bp:surg('Bp',[[B_ANC,B_NEW],[A_SET,A_NEW]]),
  C:surg('C',[[C_ANC,C_ANC.replace(OLD,'Long Interval (LI)')]]), D:surg('D',[[C_ANC,C_ANC.replace(OLD,'Zqx Session (ZQX)')]]) };
P('ia-version '+V.BASE.version+'  variants loaded: '+Object.keys(V).join(','));

const ALL=['sun','mon','tue','wed','thu','fri','sat'], ISO=['mon','tue','wed','thu','fri','sat','sun'];
const RUNG={
  run_pace_goal:{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
  run_mile_time:{run:{id:'run_mile_time',mileBestMins:'8',mileBestSecs:'15',targetDist:'1',targetMins:'7',targetSecs:'30',paceUnit:'mi'}},
  run_base:{run:{id:'run_base',mileBestMins:'8',mileBestSecs:'15',baseline:'2.5 miles'}},
  run_5k:{run:{id:'run_5k',mileBestMins:'10',mileBestSecs:'30',baselineDist:'3',baseline:'3mi'}},
  run_10k:{run:{id:'run_10k',mileBestMins:'10',mileBestSecs:'30',baselineDist:'4',baseline:'4mi'}},
  run_half:{run:{id:'run_half',mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},
  run_marathon:{run:{id:'run_marathon',mileBestMins:'10',mileBestSecs:'30',baselineDist:'8',baseline:'8mi'}},
  'run_pace+swim':{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},swim:{id:'swim_base'}},
  'run_pace+bike':{run:{id:'run_pace_goal',mileBestMins:'8',mileBestSecs:'15',targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'},bike:{id:'bike_base'}},
  bike_base:{bike:{id:'bike_base'}}, swim_base:{swim:{id:'swim_base'}} };
const EXP=['beginner','intermediate','advanced'];
const REST=[[],['sun'],['sat'],['sun','wed'],['sat','sun'],['mon','fri'],['sun','wed','sat'],['tue','thu','sat'],['sun','tue','thu','sat'],['mon','wed','fri','sun']];
const SEEDS=[24865,7,4242]; const FOCUS=['balanced','support_strength'];
function mk(gk,exp,rest,seed,focus){ const nrc=/^run_(5k|10k|half|marathon)$/.test(gk);
  return {primaryPath:'event',eventTargeted:true,raceDate:nrc?'2026-12-06':'2026-10-19',cardioTypes:Object.keys(RUNG[gk]),cardioGoals:JSON.parse(JSON.stringify(RUNG[gk])),
   liftingFocus:focus,experience:exp,ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:rest.slice(),days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'M',startDate:'2026-09-21',seed}; }
function cards(prog){ const m={}; Object.keys(prog.weeks).forEach(w=>ISO.forEach(d=>{ const x=prog.weeks[w][d]; if(x) m[w+'_'+d]=x; })); return m; }
const strip=o=>JSON.stringify(o,(k,v)=>(k==='assignedType'||k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey')?undefined:v);
function diff(pa,pb,map){ const a=cards(pa),b=cards(pb); const ch=[]; Object.keys(a).forEach(k=>{ let sb=strip(b[k]); if(map) sb=sb.split(map).join(OLD); if(strip(a[k])!==sb) ch.push(k); }); return ch; }
function fieldsChanged(da,db,map){ const f=new Set(); ['title','tags','cardio','sections','note','dot'].forEach(k=>{ let x=strip(db&&db[k]); if(map) x=(x||'').split(map).join(OLD); if(strip(da&&da[k])!==x) f.add(k); }); return [...f].join('+'); }

const CMP=[['BASE','A',null],['BASE','B',null],['B','Bp',null],['BASE','C','Long Interval (LI)'],['BASE','D','Zqx Session (ZQX)']];
const R={}; CMP.forEach(([x,y])=>R[x+'>'+y]={progs:0,days:0,weeks:0,byGoal:{},fields:{}});
let N=0,daysN=0,chiSess=0,stampedBase=0,sessBase=0,crash=0;
Object.keys(RUNG).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>FOCUS.forEach(focus=>{
  const cfg=mk(gk,exp,rest,seed,focus); const pr={};
  try{ Object.keys(V).forEach(k=>pr[k]=V[k].buildProgram(JSON.parse(JSON.stringify(cfg)))); }catch(e){ crash++; if(crash<5) P('CRASH '+gk+': '+e.message); return; }
  N++; const cb=cards(pr.BASE); daysN+=Object.keys(cb).length;
  Object.values(cb).forEach(dy=>{ let cs=dy.cardio; if(!cs) return; if(!Array.isArray(cs)) cs=[cs]; cs.forEach(c=>{ sessBase++; if('assignedType' in c) stampedBase++; if(/\(CHI\)/.test(c.subtype||'')) chiSess++; }); });
  CMP.forEach(([x,y,map])=>{ const ch=diff(pr[x],pr[y],map); const r=R[x+'>'+y]; r.byGoal[gk]=r.byGoal[gk]||[0,0,0]; r.byGoal[gk][1]++; r.byGoal[gk][2]+=Object.keys(cards(pr[x])).length;
    if(ch.length){ r.progs++; r.days+=ch.length; r.weeks+=new Set(ch.map(k=>k.split('_')[0])).size; r.byGoal[gk][0]++;
      ch.forEach(k=>{ const f=fieldsChanged(cards(pr[x])[k],cards(pr[y])[k],map); r.fields[f]=(r.fields[f]||0)+1; }); } });
})))));
P(`\nlattice builds ${N} x ${Object.keys(V).length} variants, crashes ${crash}; day cards ${daysN}; cardio sessions ${sessBase}; CHI-subtyped sessions ${chiSess}`);
P(`BASE sessions carrying an assignedType property: ${stampedBase}/${sessBase}  (the only field CORE_SPEED_TYPES is tested against, :6774 :6788)`);
CMP.forEach(([x,y])=>{ const r=R[x+'>'+y]; P(`\n-- ${x} -> ${y}: programs changed ${r.progs}/${N}, day cards changed ${r.days}/${daysN}, program-weeks changed ${r.weeks}`);
  P('   fields changed (day counts): '+JSON.stringify(r.fields));
  P('   by goal [progs changed, progs, day cards]: '+JSON.stringify(r.byGoal)); });

// ── Mario, PRT TING ──
const mario={primaryPath:'event',eventTargeted:true,raceDate:'2026-10-19',cardioTypes:['run'],
 cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'15',mileBestSrc:{kind:'entered'},targetDist:'1.5',targetMins:'11',targetSecs:'0',paceUnit:'mi'}},
 liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'home_full',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),bench:185,squat:255,deadlift:315,name:'PRT TING',startDate:'2026-09-21',seed:24865};
const MP={}; Object.keys(V).forEach(k=>MP[k]=V[k].buildProgram(JSON.parse(JSON.stringify(mario))));
P('\n===== PRT TING digests: '+Object.keys(MP).map(k=>k+'='+H.progDigest(JSON.parse(strip(MP[k])))).join('  '));
CMP.forEach(([x,y,map])=>{ const ch=diff(MP[x],MP[y],map); P(`PRT TING ${x}->${y}: ${ch.length} day cards changed ${JSON.stringify(ch)}`);
  ch.slice(0,4).forEach(k=>{ const [w,d]=k.split('_'); const g=p=>(p.weeks[w][d].sections||[]).filter(s=>s.core).map(s=>s.coreHeader+'['+s.items.map(i=>i.name).join(', ')+']').join(' | ')||'(no core block)';
    P(`   ${k} core before: ${g(MP[x])}`); P(`   ${k} core after : ${g(MP[y])}`); }); });

// ── D103 label readers, probed directly with the shipped functions ──
const E=V.BASE.eval; const chiS=MP.BASE.weeks[1].thu.cardio;
P('\n===== D103 label readers (BASE functions, PRT TING W1 THU session) =====');
['Continuous High Intensity (CHI)','Long Interval (LI)','Zqx Session (ZQX)'].forEach(lab=>{
  const s=Object.assign({},chiS,{subtype:lab});
  P(`  "${lab}": runSessionCode=${E('runSessionCode')(lab)}  _runClass=${E('_runClass')(lab)}  _cardioInterference=${E('_cardioInterference')(s)}`); });
P('  reference INT: runSessionCode='+E('runSessionCode')('Interval (INT)')+' _runClass='+E('_runClass')('Interval (INT)')+' _cardioInterference='+E('_cardioInterference')(MP.BASE.weeks[1].mon.cardio));

// ── D103 athlete-facing string scan (comment-stripped) ──
P('\n===== lines printing CHI / Continuous High Intensity, // comments stripped =====');
html.split('\n').forEach((ln,i)=>{ const code=ln.replace(/(^|[^:'"\\])\/\/.*$/,'$1'); if(/\bCHI\b|Continuous High Intensity|continuous high/.test(code)) P('  :'+(i+1)+'  '+code.trim().slice(0,170)); });
// ── PRT TING role grid, BASE vs C vs D (lift title / run subtype head / legRecoveryNote) ──
P('\n===== PRT TING role grid W1 (and W5), BASE / C / D =====');
['BASE','C','D'].forEach(k=>{ [1,5].forEach(w=>P(`  ${k.padEnd(4)} W${w}  `+ISO.map(d=>{const x=MP[k].weeks[w][d]; if(!x||x.rest) return d+':REST'; const c=x.cardio; return d+':'+String(x.title).replace(/\s+/g,'')+'/'+(c?String(c.subtype).replace(/ \(.*$/,'').replace(/ — .*/,''):'-');}).join('  ')));
  P(`  ${k} legRecoveryNote: ${JSON.stringify(MP[k].legRecoveryNote)}`); });
// ── C vs D: what the "interval" token adds on top of the lost :6867 match ──
{ let prog=0,days=0; const f={};
  Object.keys(RUNG).forEach(gk=>EXP.forEach(exp=>REST.forEach(rest=>SEEDS.forEach(seed=>FOCUS.forEach(focus=>{ const cfg=mk(gk,exp,rest,seed,focus);
    const pc=V.C.buildProgram(JSON.parse(JSON.stringify(cfg))), pd=V.D.buildProgram(JSON.parse(JSON.stringify(cfg)));
    const a=cards(pd), b=cards(pc); const ch=Object.keys(a).filter(k=>strip(a[k]).split('Zqx Session (ZQX)').join(OLD)!==strip(b[k]).split('Long Interval (LI)').join(OLD));
    if(ch.length){prog++; days+=ch.length; ch.forEach(k=>{ const ff=['title','sections','note','tags'].filter(z=>String(strip(a[k][z])).split('Zqx Session (ZQX)').join(OLD)!==String(strip(b[k][z])).split('Long Interval (LI)').join(OLD)).join('+'); f[ff]=(f[ff]||0)+1; });}
  })))));
  P(`\nD -> C (label-normalised; isolates the 'interval' token readers): programs ${prog}/${N}, day cards ${days}, fields ${JSON.stringify(f)}`); }
P('\nPRINTED '+out.length+' LINES');
