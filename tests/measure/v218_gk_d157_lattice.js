// v218 gatekeeper lattice — D157 independent oracle (D110a contract: a time is minutes*60+seconds; a
// seconds-only entry equals its m:ss twin). Usage: node tests/measure/v218_gk_d157_lattice.js <V217.html> <V218.html>
const path=require('path'), crypto=require('crypto');
const R=Date; const NOW=new R(2026,8,24,9,0,0).getTime();
class FD extends R{constructor(...a){if(a.length===0)super(NOW);else super(...a);} static now(){return NOW;}}
globalThis.Date=FD;
const H=require(path.resolve(__dirname,'..','harness.js'));
const P=(...a)=>console.log(...a);
function mkVM(f){const IA=H.load(f);const els=new Map();const mk=IA.window.document.createElement;
  IA.window.document.getElementById=id=>{if(!els.has(id)){const e=mk('div');e.id=id;els.set(id,e);}return els.get(id);};IA.els=els;return IA;}
const B=mkVM(process.argv[2]), C=mkVM(process.argv[3]);
P('versions', B.version, C.version);
const clone=o=>JSON.parse(JSON.stringify(o));
const pad=n=>String(n).padStart(2,'0');
const HAND=x=>{const t=Math.round(x);return Math.floor(t/60)+':'+pad(t%60);};   // m:ss by definition
const LEN=(IA,c)=>IA.eval('(function(c){return calcProgramLength(c.cardioTypes,Object.assign({},c.cardioGoals,{_experience:c.experience||"intermediate",_ageBracket:c.ageBracket||"18-35",_eventTargeted:c.eventTargeted}),LIFTING_FOCUS_TO_GOAL[c.liftingFocus]||"balanced");})')(c);
function swimCfg(goal,exp,age,unit,g){const c=clone(H.fixtures.HALF_MANNY);c.cardioTypes=['swim'];c.experience=exp;c.ageBracket=age;
  c.primaryPath='goal';c.eventTargeted=false;delete c.raceDate;c.cardioGoals={swim:Object.assign({id:goal,label:goal,swimUnit:unit},g)};return c;}
// forms: returns field object for prefix and total t
const FORMS={mss:(p,t)=>({[p+'Mins']:String(Math.floor(t/60)),[p+'Secs']:String(t%60)}),
  undef:(p,t)=>({[p+'Secs']:String(t)}), empty:(p,t)=>({[p+'Mins']:'',[p+'Secs']:String(t)}),
  zeromin:(p,t)=>({[p+'Mins']:'0',[p+'Secs']:String(t)}), absent:()=>({})};
const L=(IA,c)=>{const r=LEN(IA,c);return {w:r.weeks,warn:JSON.stringify(r.warning)};};
const cnt={}; const bump=k=>cnt[k]=(cnt[k]||0)+1; const viol=[]; const VG={}; const V=(m)=>{viol.push(m); const k=m.split(' ').slice(0,2).join(' '); (VG[k]=VG[k]||[]).push(m);};
// ── 0. identity
{const c=swimCfg('swim_100_time','advanced','18-35','yd',Object.assign({},FORMS.undef('target',55),FORMS.undef('base',59)));c.seed=76308;
 const a=H.progDigest(B.buildProgram(clone(c))),b=H.progDigest(B.buildProgram(clone(c)));P('identity base==base',a===b,a);
 const m1=H.progDigest(B.buildProgram(clone(H.fixtures.HALF_MANNY))),m2=H.progDigest(C.buildProgram(clone(H.fixtures.HALF_MANNY)));P('HALF_MANNY base',m1,'cand',m2);
 if(a!==b) V('identity'); if(m2!=='0ac7da6b1691a8e1') V('HALF_MANNY '+m2);}
// ── 1. SIZER lattice
const GOALS={swim_100_time:{dist:100,T:[],Cur:[]},swim_500_time:{dist:500,T:[],Cur:[]}};
for(let t=25;t<=200;t+=5) GOALS.swim_100_time.T.push(t); GOALS.swim_100_time.Cur=[null,40,59,75,95,130,180];
for(let t=240;t<=1000;t+=20) GOALS.swim_500_time.T.push(t); GOALS.swim_500_time.Cur=[null,280,330,420,600,800];
const EXP=['beginner','intermediate','advanced'], AGE=['18-35','36-54','55+'], UNIT=['yd','m'];
const TF=['mss','undef','empty','zeromin'], CF=['mss','undef','empty','zeromin'];
let nS=0;
for(const [goal,G] of Object.entries(GOALS)) for(const exp of EXP) for(const age of AGE) for(const unit of UNIT) for(const T of G.T) for(const Cu of G.Cur){
  const twinG=Object.assign({},FORMS.mss('target',T),Cu==null?{}:FORMS.mss('base',Cu));
  const twC=L(C,swimCfg(goal,exp,age,unit,twinG)), twB=L(B,swimCfg(goal,exp,age,unit,twinG));
  // class 4: m:ss twin byte-identical V217 == V218
  nS++; if(twC.w!==twB.w||twC.warn!==twB.warn){V(`C4 mss moved ${goal} ${exp} ${age} ${unit} T${T} C${Cu} ${twB.w}->${twC.w} ${twB.warn}->${twC.warn}`);bump('unclassified');} else bump('c4_identical');
  // hand label
  const lbl=' ('+HAND(T)+'/'+G.dist+unit+') needs ';
  if(!twC.warn.includes(lbl)) V(`LABEL ${goal} T${T} ${twC.warn}`); else bump('label_hand_ok');
  for(const tf of TF) for(const cf of (Cu==null?['absent']:CF)){
    if(tf==='mss'&&(cf==='mss'||cf==='absent')) continue;
    const g=Object.assign({},FORMS[tf]('target',T),Cu==null?{}:FORMS[cf]('base',Cu));
    const c=swimCfg(goal,exp,age,unit,g); const rc=L(C,c), rb=L(B,c); nS++;
    if(rc.w!==twC.w||rc.warn!==twC.warn){V(`C1 twin ${goal} ${exp} ${age} ${unit} T${T}/${tf} C${Cu}/${cf} ${rc.w} vs ${twC.w} ${rc.warn} vs ${twC.warn}`);bump('unclassified');continue;}
    if(rc.w!==rb.w||rc.warn!==rb.warn) bump('c1_seconds_only_moved_len='+(rc.w!==rb.w)); else bump('c1_seconds_only_unchanged');
  }
}
// ── 2. zero-total target and odd typed forms
const ZERO=[{targetMins:'0',targetSecs:'0'},{targetMins:'0',targetSecs:''},{targetMins:'',targetSecs:'0'},{targetMins:'',targetSecs:''},{targetSecs:'0'},{targetMins:'0'}];
const ODD=[[{targetMins:'01',targetSecs:'15'},75],[{targetMins:'1.5',targetSecs:'00'},90],[{targetMins:'1',targetSecs:'75'},135],[{targetMins:'00',targetSecs:'55'},55],[{targetMins:'1',targetSecs:'30.5'},90.5],[{targetMins:'8',targetSecs:'5'},485],[{targetMins:'8',targetSecs:'05'},485]];
for(const goal of Object.keys(GOALS)) for(const exp of EXP) for(const age of AGE) for(const unit of UNIT) for(const Cu of [null,59,330]){
  const cur=Cu==null?{}:FORMS.mss('base',Cu); const dist=GOALS[goal].dist;
  const abs=L(C,swimCfg(goal,exp,age,unit,cur));
  for(const z of ZERO){nS++; const r=L(C,swimCfg(goal,exp,age,unit,Object.assign({},z,cur))), rb=L(B,swimCfg(goal,exp,age,unit,Object.assign({},z,cur)));
    if(r.w!==abs.w||r.warn!==abs.warn||/\(0:00\//.test(r.warn)){V(`C2 zero ${goal} ${JSON.stringify(z)} ${r.warn} vs absent ${abs.warn}`);bump('unclassified');}
    else bump((r.w!==rb.w||r.warn!==rb.warn)?'c2_zero_moved':'c2_zero_unchanged');}
  for(const [o,t] of ODD){nS++; const g=Object.assign({},o,cur); const r=L(C,swimCfg(goal,exp,age,unit,g)), rb=L(B,swimCfg(goal,exp,age,unit,g));
    const lbl=' ('+HAND(t)+'/'+dist+unit+') needs ';
    if(!r.warn.includes(lbl)){V(`C3 odd label ${goal} ${JSON.stringify(o)} ${r.warn}`);bump('unclassified');continue;}
    if(r.w!==rb.w){V(`C3 odd length moved ${goal} ${JSON.stringify(o)} ${rb.w}->${r.w}`);bump('unclassified');continue;}
    bump(r.warn!==rb.warn?'c3_odd_label_changed':'c3_odd_label_same');}
}
// ── 3. pace line + initial render
function lines(IA,g){IA.window.__G=g; IA.els.clear();
  IA.eval('WD={primaryPath:"goal",cardioTypes:["swim"],experience:"advanced",ageBracket:"18-35",eventTargeted:false,liftingFocus:"support_prevention",equipment:"crossfit",restDays:["sun","wed"],unit:"lbs",seed:76308,name:"S",cardioGoals:{swim:JSON.parse(JSON.stringify(__G))}}; wizardStep=WIZARD_STEPS.indexOf("cardio_goal"); renderWizardStep();');
  const m=String(IA.els.get('wizardBody').innerHTML||'').match(/<div id="swimPaceLine"[^>]*display:([a-z]+)[^>]*>([\s\S]*?)<\/div>/);
  const init=m?{d:m[1],t:m[2].replace(/<svg[\s\S]*?<\/svg>/g,'').trim()}:{d:'MISSING',t:''};
  IA.els.delete('swimPaceLine'); IA.eval('updateSwimPaceDisplay()'); const el=IA.els.get('swimPaceLine');
  const live={d:String(el.style.display||''),t:String(el.innerHTML||'').replace(/<svg[\s\S]*?<\/svg>/g,'').trim()}; return {init,live};}
let nL=0;
for(const goal of Object.keys(GOALS)) for(const unit of UNIT){const dist=GOALS[goal].dist;
  const Ts=[]; for(let t=1;t<=1200;t+= (t<120?1:7)) Ts.push(t);
  for(const T of Ts) for(const tf of TF){nL++;
    const g=Object.assign({id:goal,label:goal,swimUnit:unit},FORMS[tf]('target',T)); const c=lines(C,g), b=lines(B,g);
    const exp=HAND(T)+' — '+HAND(T*100/dist)+'/100 ('+unit+')';
    let bad=false; for(const k of ['init','live']){ if(c[k].d!=='block'||c[k].t!==exp){bad=true;V(`LB ${k} ${goal} ${unit} T${T}/${tf} got ${c[k].d} "${c[k].t}" want "${exp}"`);} }
    if(bad){bump('unclassified');continue;}
    const same=b.init.d===c.init.d&&b.init.t===c.init.t&&b.live.d===c.live.d&&b.live.t===c.live.t;
    if(tf==='mss'){ // class 4 at the label
      if(!same){V(`C4 label moved ${goal} ${unit} T${T} base ${JSON.stringify(b)} cand ${JSON.stringify(c)}`);bump('unclassified');} else bump('lb_c4_identical');
    } else bump(same?'lb_c1_same':'lb_c1_changed');
  }
  for(const z of ZERO){nL++; const g=Object.assign({id:goal,label:goal,swimUnit:unit},z); const c=lines(C,g);
    if(c.init.d!=='none'||c.live.d!=='none'){V(`C2 LB zero shown ${goal} ${JSON.stringify(z)} ${JSON.stringify(c)}`);bump('unclassified');} else bump('lb_c2_hidden');}
  for(const [o,t] of ODD){nL++; const g=Object.assign({id:goal,label:goal,swimUnit:unit},o); const c=lines(C,g);
    const exp=HAND(t)+' — '+HAND(t*100/dist)+'/100 ('+unit+')';
    if(c.init.t!==exp||c.live.t!==exp||c.init.d!=='block'||c.live.d!=='block'){V(`C3 LB odd ${goal} ${JSON.stringify(o)} ${JSON.stringify(c)} want ${exp}`);bump('unclassified');} else bump('lb_c3_total');}
}
// ── 4. full-build lattice + confinement (keyed on week/day/label/movement)
function rows(p){const m=new Map();for(const w of Object.keys(p.weeks||{}))for(const d of Object.keys(p.weeks[w]||{})){const day=p.weeks[w][d];if(!day)continue;
  m.set([w,d,'#day','title'].join('|'),JSON.stringify([day.title,day.rest]));
  const cs=day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[]; cs.forEach((x,i)=>m.set([w,d,'#cardio',(x.subtype||x.type)+'#'+i].join('|'),JSON.stringify(x)));
  (day.sections||[]).forEach(s=>(s.items||[]).forEach((it,i)=>m.set([w,d,s.label||s.coreHeader||'',String(it.name)+'#'+i].join('|'),JSON.stringify(it))));}
  return m;}
const GID=[...new Set([...Object.keys(C.GOAL_RECOMMENDED_DAYS||{}),'run_base','run_pace_goal','bike_century','bike_50','bike_ftp','bike_cals','bike_base','swim_base'])]; P('goal ids',GID.join(','));
const FOC=Object.keys(C.LIFTING_FOCUS_TO_GOAL); const EQ=['crossfit','commercial','home_full','bodyweight'];
const RESTS=[['sun','wed'],['sat','sun'],['sun'],['mon','thu','sun']]; const SEEDS=[76308,1,4242];
let nF=0,nSess=0; const fcls={};
function cfgFor(o){const c=clone(H.fixtures.HALF_MANNY);Object.assign(c,{experience:o.exp,liftingFocus:o.foc,equipment:o.eq,restDays:o.rest,seed:o.seed});
  if(o.kind==='none'){c.cardioTypes=[];c.cardioGoals={};c.primaryPath='goal';c.eventTargeted=false;delete c.raceDate;}
  else if(o.kind==='half'){} // NRC race, HALF_MANNY shape
  else {const t=o.gid.split('_')[0]; c.cardioTypes=[t]; c.primaryPath='goal'; c.eventTargeted=false; delete c.raceDate;
    const g={id:o.gid,label:o.gid};
    if(t==='run') Object.assign(g,{mileBestMins:'8',mileBestSecs:'30',baselineDist:'3',baseline:'3mi',targetDist:'1.5',targetMins:'11',targetSecs:'0'});
    if(t==='swim'){g.swimUnit='yd'; if(o.sw) Object.assign(g,o.sw);}
    c.cardioGoals={[t]:g};}
  return c;}
const combos=[];
for(const gid of GID) combos.push({kind:'goal',gid});
combos.push({kind:'none'},{kind:'half'});
for(const gid of ['swim_100_time','swim_500_time']) for(const sw of [{targetSecs:'55',baseSecs:'59'},{targetMins:'',targetSecs:'95'},{targetMins:'0',targetSecs:'0'},{targetMins:'1',targetSecs:'5',baseMins:'1',baseSecs:'20'},{targetMins:'7',targetSecs:'30',baseMins:'8',baseSecs:'45'}]) combos.push({kind:'goal',gid,sw,swim:true});
for(const cb of combos) for(const exp of EXP) for(const foc of FOC.slice(0,6)) for(const eq of EQ) for(const rest of RESTS) for(const seed of SEEDS){
  if(!cb.swim && (FOC.indexOf(foc)%2)!==(SEEDS.indexOf(seed)%2) && seed!==76308) continue; // thin the control lattice
  const o=Object.assign({},cb,{exp,foc,eq,rest,seed}); let c=cfgFor(o);
  let pb,pc; try{pb=B.buildProgram(clone(c));pc=C.buildProgram(clone(c));}catch(e){V('build threw '+JSON.stringify(o)+' '+e.message);continue;}
  nF++; nSess+=[...rows(pc).keys()].length;
  const db=H.progDigest(pb), dc=H.progDigest(pc);
  let cls;
  if(db===dc) cls='identical';
  else { const sw=c.cardioGoals.swim||{}; const secOnly=cb.swim&&((sw.targetMins===undefined||sw.targetMins==='')&&(+sw.targetSecs>0) || (sw.baseMins===undefined||sw.baseMins==='')&&(+sw.baseSecs>0));
    const zero=cb.swim&&sw.targetMins!==undefined&&((+sw.targetMins||0)*60+(+sw.targetSecs||0))===0;
    if(!(secOnly||zero)){ const rb=rows(pb),rc=rows(pc); let n=0; for(const k of new Set([...rb.keys(),...rc.keys()])) if(rb.get(k)!==rc.get(k)){ if(n++<3) P('   diff '+k);} V('C5 control moved '+JSON.stringify(o)+' keyed diffs '+n); cls='unclassified'; }
    else { // oracle: V218 build equals the m:ss twin's V218 build
      const tw=clone(c); const g=tw.cardioGoals.swim; for(const p of ['target','base']){const t=(+g[p+'Mins']||0)*60+(+g[p+'Secs']||0); if(t>0){g[p+'Mins']=String(Math.floor(t/60));g[p+'Secs']=String(t%60);} else {delete g[p+'Mins'];delete g[p+'Secs'];}}
      const WK=p=>JSON.stringify([p.totalWeeks,p.weeks]); const dcw=WK(pc); const dt=WK(C.buildProgram(clone(tw)));
      if(zero&&!secOnly){ const ab=clone(c); delete ab.cardioGoals.swim.targetMins; delete ab.cardioGoals.swim.targetSecs; const da=WK(C.buildProgram(ab)); cls = da===dcw?'c2_zero_eq_absent':'unclassified'; if(cls==='unclassified') V('C2 build zero != absent '+JSON.stringify(o)); }
      else { cls = dt===dcw?'c1_eq_twin':'unclassified'; if(cls==='unclassified') V('C1 build != twin '+JSON.stringify(o)); }
    } }
  fcls[cls]=(fcls[cls]||0)+1;
  // cfg purity
  const c2=clone(c); C.buildProgram(c2); if(JSON.stringify(c2)!==JSON.stringify(c)) V('cfg mutated '+JSON.stringify(o));
}
P('\nSIZER entries '+nS+'  LABEL entries '+nL);
P('SIZER/LABEL classes '+JSON.stringify(cnt));
P('FUZZ configs '+nF+' keyed rows '+nSess+' classes '+JSON.stringify(fcls));
P('VIOLATIONS '+viol.length); for(const [k,v] of Object.entries(VG)){ P('  GROUP '+k+' n='+v.length); v.slice(0,4).forEach(x=>P('     '+x.slice(0,400))); }
