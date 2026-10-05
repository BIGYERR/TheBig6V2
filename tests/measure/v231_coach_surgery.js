'use strict';
// coach V231 surgery prints (read-only on the repo; scratch trees only).
const path=require('path'),fs=require('fs'),cp=require('child_process'),crypto=require('crypto');
const ROOT='/Users/CanasBangin/Desktop/TheBig6V2';
const H=require(path.join(ROOT,'tests','harness.js'));
const {load,fixtures,progDigest,DAYS}=H;
const SCR=process.env.SCR; if(!SCR) throw new Error('SCR unset'); const F=n=>path.join(SCR,n);
const PART=process.env.PART||'none';
const CLOCK='2026-08-24';
const clone=x=>JSON.parse(JSON.stringify(x)); const P=s=>console.log(s);
const sha=s=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const tally=(rows,key)=>{const m={};rows.forEach(r=>{const k=key(r);m[k]=(m[k]||0)+1;});return m;};
const fmt=m=>Object.keys(m).sort((a,b)=>m[b]-m[a]||(a<b?-1:1)).map(k=>k+' '+m[k]).join(' | ')||'(none)';
const clean=n=>String(n==null?'':n).replace(/<svg[\s\S]*?<\/svg>\s*/g,'').replace(/<[^>]+>/g,'').trim();
const stem=n=>clean(n).toLowerCase().replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim();
const ORDER=['mon','tue','wed','thu','fri','sat','sun'];
const CIRC='Leg circuit — runner armor';
const MARIO={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,liftingFocus:'support_strength',experience:'beginner',ageBracket:'18-35',equipment:'commercial',unit:'lbs',restDays:['sun','wed'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:76308};
const REGS=['knee','ankle','hip','lowback','shoulder','elbow'],TIERS=['workaround','protect'],EXPS=['beginner','intermediate','advanced'];
const GOAL={lift:null,run_base:'run_base',run_5k:'run_5k',run_half:'run_half'};
function goalify(c,g){if(!GOAL[g])return c;const race=/5k|10k|half|marathon/.test(g);return Object.assign(c,{primaryPath:race?'event':'cardio',cardioTypes:['run'],cardioGoals:{run:{id:g,label:g,mileBestMins:'10',mileBestSecs:'30',baselineDist:'5',baseline:'5mi'}},eventTargeted:race,raceDate:race?'2026-12-06':null});}
function lattices(){const out=[];const M=o=>Object.assign(clone(MARIO),o);
  for(const g of REGS)for(const t of TIERS)for(const eq of ['commercial','crossfit','home_full','bodyweight'])for(const ex of EXPS)for(const fo of ['support_strength','support_athletic','support_prevention'])
    out.push({L:'L432',k:g+'/'+t+'|'+eq+'|'+ex+'|'+fo+'|sun,wed',c:M({injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo})});
  for(const g of REGS)for(const t of TIERS)for(const eq of ['bodyweight','home_basic'])for(const ex of EXPS)for(const fo of ['balanced','strength','hypertrophy'])for(const rd of [['sun','wed'],['sat','sun']])
    out.push({L:'LBW',k:g+'/'+t+'|'+eq+'|'+ex+'|'+fo+'|'+rd.join(','),c:M({injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo,restDays:rd})});
  for(const g of REGS)for(const t of TIERS)for(const eq of ['crossfit','home_full'])for(const ex of EXPS)for(const fo of ['balanced','strength','hypertrophy'])for(const rd of [['sun','wed'],['sat','sun']])
    out.push({L:'U_EQ',k:g+'/'+t+'|'+eq+'|'+ex+'|'+fo+'|'+rd.join(','),c:M({injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo,restDays:rd})});
  for(const g of REGS)for(const t of TIERS)for(const eq of ['bodyweight','home_basic'])for(const ex of EXPS)for(const rd of [['sun','wed'],['sat','sun']])
    out.push({L:'U_FL',k:g+'/'+t+'|'+eq+'|'+ex+'|fatloss|'+rd.join(','),c:M({injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:'fatloss',restDays:rd})});
  for(const g of REGS)for(const t of TIERS)for(const eq of ['bodyweight','home_basic'])for(const go of ['run_base','run_5k','run_half'])for(const ex of ['beginner','advanced'])for(const fo of ['balanced','support_prevention'])
    out.push({L:'U_PATH',k:g+'/'+t+'|'+eq+'|'+ex+'|'+fo+'|sun,wed|'+go,c:goalify(M({injury:{region:g,tier:t},equipment:eq,experience:ex,liftingFocus:fo}),go)});
  for(const sd of [11,90210])out.filter(x=>(x.L==='L432'||x.L==='LBW')&&/\|bodyweight\|/.test(x.k)).slice().forEach(x=>out.push({L:'U_SEED',k:x.k+'|'+x.L+'|s'+sd,c:Object.assign(clone(x.c),{seed:sd})}));
  return out;}
const FOC=['hypertrophy','strength','fatloss','balanced','support_strength','support_athletic','support_prevention'];
const FAM={race:[['run_5k',{}],['run_10k',{}],['run_half',{}],['run_marathon',{}]],test:[['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_base',{}]],none:[[null,{}]]};
const TIERS6=['commercial','crossfit','home_full','home_basic','minimal','bodyweight'],SEEDS=[87747,76308,1234,4242],RESTS=[['sun','wed'],['sat','sun']];
function fullLattice(){const out=[];
  for(const f of FOC)for(const fam of Object.keys(FAM))for(const eq of TIERS6)for(let ei=0;ei<3;ei++)for(let si=0;si<SEEDS.length;si++)for(let ri=0;ri<2;ri++){const g=FAM[fam][(si+ei)%FAM[fam].length];
    const c={name:'M',primaryPath:/^support_/.test(f)?'event':'goal',cardioTypes:g[0]?['run']:[],cardioGoals:g[0]?{run:Object.assign({id:g[0],label:g[0],mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi'},g[1])}:{},eventTargeted:false,liftingFocus:f,experience:EXPS[ei],ageBracket:'18-35',equipment:eq,unit:'lbs',restDays:RESTS[ri].slice(),days:DAYS.slice(),bench:135,squat:155,deadlift:185,seed:SEEDS[si]};
    out.push({L:'FULL',k:f+'|'+fam+'|'+eq+'|'+EXPS[ei]+'|s'+SEEDS[si]+'|'+RESTS[ri].join(','),f,fam,eq,inj:'none',c});}
  return out;}
const base={primaryPath:'event',cardioTypes:['run'],eventTargeted:true,experience:'intermediate',ageBracket:'18-35',equipment:'crossfit',unit:'lbs',restDays:['sun','wed'],days:DAYS.slice(),bench:135,squat:155,deadlift:185};
const PRT=Object.assign({},base,{name:'PRT TING',liftingFocus:'support_athletic',raceDate:'2026-10-20',seed:87747,cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',mileBestMins:'8',mileBestSecs:'0',baselineDist:'3',baseline:'3mi',targetDist:'1.5',targetMins:'10',targetSecs:'30'}}});
// ── surgery ──
function rep(h,a,b,tag){const n=h.split(a).length-1;P('  anchor ['+tag+'] count '+n);if(n!==1)throw new Error('anchor '+tag+' count '+n);return h.replace(a,()=>b);}
const AN={
  BW0:"const _bw=(bwPool,other)=>isBW?_bwRung(bwPool):other;",
  K:"_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):['Banded hip thrust','Single-leg glute bridge','Bodyweight back extension'];",
  AK:"hasBarbell?_gear(['Barbell hip thrust','45° back extension']):['Banded hip thrust','Single-leg glute bridge'];",
  LBPB:"_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):['Banded hip thrust','Single-leg glute bridge'];",
  LBPH:"        hingePool = ['Banded hip thrust','Single-leg glute bridge'];",
  LBWB:"_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):['Banded hip thrust','Single-leg hip thrust'];",
  B:"const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return _isHalf(it.name)?s*0.5:s; };",
  A1:"    :_bw(['Single-leg glute bridge','Bodyweight back extension','Single-leg hip thrust (shoulders on bed)','Nordic hamstring curl (anchored)'],['Banded hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension']);",
  A2:"          {name:ex.hinge[0],detail:'2×8'}]});",
  R0:"function capRegionalFatigue(sections, role, cardio, goal){",
  R1:"const _capFor = r => Math.max(6, _setCap(r) - (r==='legs' ? _legCut : _uppCut));",
  R2:"((regionMoves[r]||0)-_moveCap(r))*4",
  R3:"(regionMoves[r]||0)>_moveCap(r))",
  R4:"),role,cardio,goal)};",
  FL:"  if(cfg.equipment==='bodyweight') bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n",
  CALF:"          s.push({label:'Calf — achilles armor',items:[{name:_pcalf,detail:'2×12–15 each, slow 3-sec lower'}]});\n        }\n",
  DC:"  deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks);\n",
  RK:"    if(/secondary compound|conditioning|delts|chest volume|pull superset a|leg superset a/.test(L)) return 1;",
  T1:"        const _was=it.name;\n        if(_BW_SUBS[it.name]) it.name=_BW_SUBS[it.name];\n        else if(_BW_GEAR.test(it.name)) it.name=_bwFallback(it.name);\n",
};
const surgW=(h,name)=>{h=rep(h,AN.BW0,AN.BW0+"\n  const _bwHT=isBW?'"+name+"':'Banded hip thrust';",'W lens');
  for(const k of ['K','AK','LBPB','LBPH','LBWB'])h=rep(h,AN[k],AN[k].replace("'Banded hip thrust'","_bwHT"),'W writer '+k);return h;};
const surgW5=h=>{h=rep(h,AN.BW0,AN.BW0+"\n  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';\n  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';",'W5 lens');
  for(const k of ['K','AK'])h=rep(h,AN[k],AN[k].replace("'Banded hip thrust'","_bwHTak"),'W5 writer '+k);for(const k of ['LBPB','LBPH','LBWB'])h=rep(h,AN[k],AN[k].replace("'Banded hip thrust'","_bwHTlb"),'W5 writer '+k);return h;};
const surgA1=h=>rep(h,AN.A1,AN.A1+"\n  if(preventionSupport) hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through');",'A1 prevention pool subset');
const surgA2alt=h=>rep(h,AN.CALF,AN.CALF+"        if(ex.hipExt&&ex.hipExt!==ex.hinge[0]) s.push({label:'Glute — toe-off armor',items:[{name:ex.hipExt,detail:'2×8 each'}]});\n",'A2alt own section after the calf');
const snap=h=>rep(h,AN.DC,AN.DC+"  if(globalThis.__PRE!==undefined) globalThis.__PRE=JSON.stringify(weeks);\n",'pre-sweep snapshot');
const surgB=h=>rep(h,AN.B,"const _prehabHalf=new Set([].concat(EXLIB.hip_stability,EXLIB.knee_stability,EXLIB.foot_ankle,EXLIB.foot_ankle_bw)); const _cost=it=>{ if(!it||_isStretch(it.name)) return 0; const s=_setCount(it.detail); return (_isHalf(it.name)||_prehabHalf.has(it.name))?s*0.5:s; };",'B _cost membership');
const surgA=h=>{h=rep(h,AN.A1,AN.A1+"\n  if(preventionSupport) hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through');",'A1 prevention pool subset');
  return rep(h,AN.A2,"          {name:ex.hinge[0],detail:'2×8'}].concat((ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});",'A2 fourth circuit item');};
const surgAp=h=>{h=rep(h,AN.R0,"function capRegionalFatigue(sections, role, cardio, goal, prev){",'Ap signature');
  h=rep(h,AN.R1,AN.R1+"\n  const _moveCapFor = r => _moveCap(r) + ((prev && role==='legs' && r==='legs') ? 1 : 0);",'Ap sprawl allowance');
  h=rep(h,AN.R2,"((regionMoves[r]||0)-_moveCapFor(r))*4",'Ap overAmt'); h=rep(h,AN.R3,"(regionMoves[r]||0)>_moveCapFor(r))",'Ap over');
  return rep(h,AN.R4,"),role,cardio,goal,cfg.liftingFocus==='support_prevention')};",'Ap call site');};
const surgA4=h=>rep(h,AN.RK,"    if(/secondary compound|conditioning|delts|chest volume|pull superset a|leg superset a|calf — achilles/.test(L)) return 1;",'A4 achilles calf rank 1');
const surgFL=h=>rep(h,AN.FL,"  if(cfg.equipment==='bodyweight'){ bodyweightSweep(weeks, cfg.experience, cfg.liftingFocus==='support_prevention');\n    if(cfg.injury) Object.keys(weeks).forEach(_w=>Object.keys(weeks[_w]||{}).forEach(_d=>{ const _day=weeks[_w][_d]; if(_day&&Array.isArray(_day.sections)) _day.sections=applyInjuryFilter(_day.sections,cfg); })); }\n",'FL post-sweep re-filter');
const tag=h=>rep(h,AN.T1,AN.T1+"        if(_was!==it.name){ it.__bw={src:(_BW_SUBS[_was]?'SUBS':'FB'),was:_was}; if(globalThis.__bwEv) globalThis.__bwEv.push({w:+w,d:d,lab:sec.label||'',was:_was,to:it.name,src:it.__bw.src}); }\n",'sweep tag');
const TREES=['V','W3','W4','W5','B','A','AB','Ap','Ar','ABp','PRE','ALL','ALT','FL','Vt','W3t','W4t','W5t','ALLt','Vs','W5s'];
const TP={};TREES.forEach(t=>TP[t]=F('t_'+t+'.html'));
const REJ="globalThis.__rej=function(sections,cfg){var S=JSON.parse(JSON.stringify(sections||[]));S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(it)it.__k=si+'.'+ii;});});"
 +"var O=applyInjuryFilter(JSON.parse(JSON.stringify(S)),cfg);var got={},neu=[];(O||[]).forEach(function(s){((s&&s.items)||[]).forEach(function(it){if(it.__k!=null)got[it.__k]=it;else neu.push(it.name);});});"
 +"var r=[];S.forEach(function(s,si){((s&&s.items)||[]).forEach(function(it,ii){if(!it||!it.name)return;var k=si+'.'+ii,g=got[k];var row={si:si,ii:ii,n:it.name,lab:s.label||'',bw:it.__bw||null};"
 +"if(!g){row.kind='drop';r.push(row);}else if(g.name!==it.name){row.kind='rename';row.to=g.name;r.push(row);}else if((g.detail||'')!==(it.detail||'')){row.kind='redetail';row.d0=it.detail;row.d1=g.detail;r.push(row);}});});return {r:r,neu:neu};};";
const _VM={};function vm(t){if(_VM[t])return _VM[t];const X=load(TP[t]);const T=new Date(CLOCK+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;X.eval(REJ);return _VM[t]=X;}
const stripJ=prog=>JSON.stringify(prog,(k,v)=>(k==='id'||k==='created'||k==='_swapUniverse'||k==='_swapUniverseByKey'||k==='__bw')?undefined:v);
function build(X,c){X.ctx.__bwEv=[];const prog=X.buildProgram(clone(c));return {prog,ev:X.ctx.__bwEv.slice()};}
const patC={};const pat=(X,n)=>(n in patC)?patC[n]:(patC[n]=X.eval('_pattern('+JSON.stringify(n)+')')||'-');
const liveSecs=day=>(day&&!day.rest&&day.sections||[]).filter(s=>(s.items||[]).length);
const items=day=>{const o=[];liveSecs(day).forEach(s=>s.items.forEach(it=>{if(it&&it.name)o.push({lab:clean(s.label||s.coreHeader||''),n:clean(it.name),d:clean(it.detail||'')});}));return o;};
const daySig=day=>JSON.stringify(liveSecs(day).map(s=>[clean(s.label||''),s.coreHeader||'',s.rounds||'',!!s.superset,s.items.map(it=>[clean(it.name),clean(it.detail||'')])]));
const card=day=>liveSecs(day).map(s=>clean(s.label||s.coreHeader||'')+(s.superset?' (SS '+(s.rounds||'')+')':'')+' :: '+s.items.map(it=>clean(it.name)+' '+clean(it.detail||'')).join(' | ')).join('\n        ');
const msetDiff=(a,b)=>{const m={};a.forEach(x=>m[x]=(m[x]||0)+1);const o=[];b.forEach(x=>{if(m[x])m[x]--;});Object.keys(m).forEach(k=>{for(let i=0;i<m[k];i++)o.push(k);});return o;};
const rpeOf=d=>Math.max(0,...[...String(d).matchAll(/RPE\s*([\d.]+)(?:\s*[–-]\s*([\d.]+))?/g)].map(m=>Math.max(+m[1],m[2]?+m[2]:0)));
const wk=p=>Object.keys(p.weeks||{}).sort((a,b)=>a-b);
function dayList(p){const o=[];wk(p).forEach(w=>ORDER.forEach(d=>{const dy=p.weeks[w]&&p.weeks[w][d];if(dy&&liveSecs(dy).length)o.push([w,d,dy]);}));return o;}
function adjPairs(p){const L=dayList(p);const o=[];for(let i=0;i+1<L.length;i++){const a=L[i],b=L[i+1];const ia=ORDER.indexOf(a[1]),ib=ORDER.indexOf(b[1]);const consecutive=(a[0]===b[0]&&ib===ia+1)||(+b[0]===+a[0]+1&&ia===6&&ib===0);if(!consecutive)continue;const na=new Set(items(a[2]).map(x=>x.n.toLowerCase()));items(b[2]).forEach(x=>{if(na.has(x.n.toLowerCase()))o.push({w:a[0],d:a[1],n:x.n});});}return o;}
function stemDups(p){const o=[];dayList(p).forEach(([w,d,dy])=>{const it=items(dy);const m={};it.forEach(x=>{const s=stem(x.n);(m[s]=m[s]||[]).push(x.lab+': '+x.n);});Object.keys(m).forEach(s=>{if(m[s].length>1)o.push({w,d,s,names:m[s].join(' + ')});});});return o;}
function exactDups(p){const o=[];dayList(p).forEach(([w,d,dy])=>{const it=items(dy);const m={};it.forEach(x=>{const s=x.n.toLowerCase();m[s]=(m[s]||0)+1;});Object.keys(m).forEach(s=>{if(m[s]>1)o.push({w,d,s});});});return o;}
// ════════ PREP ════════
function prep(){
  Object.values(TP).forEach(f=>{try{fs.unlinkSync(f);}catch(e){}});fs.readdirSync(SCR).filter(f=>/^res_/.test(f)).forEach(f=>fs.unlinkSync(F(f)));
  const src=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');const ver=(src.match(/<meta name="ia-version" content="(\d+)"/)||[])[1];
  const head=cp.execSync('git rev-parse --short HEAD',{cwd:ROOT}).toString().trim(),git=cp.execSync('git show HEAD:index.html',{cwd:ROOT,maxBuffer:1<<26}).toString();
  P('PREP ia-version '+ver+' HEAD '+head+' working tree == HEAD:index.html '+(git===src)+' sha '+sha(src));
  const T={};T.V=src;P('W3 (draw-site lens -> Single-leg glute bridge):');T.W3=surgW(src,'Single-leg glute bridge');P('W4 (draw-site lens -> Single-leg hip thrust (shoulders on bed)):');T.W4=surgW(src,'Single-leg hip thrust (shoulders on bed)');
  P('B:');T.B=surgB(src);P('A:');T.A=surgA(src);P('Ap (A + sprawl allowance):');T.Ap=surgAp(T.A);P('AB:');T.AB=surgB(T.A);P('Ar (Ap + achilles calf rank 1):');T.Ar=surgA4(T.Ap);P('ABp (B + Ar):');T.ABp=surgB(T.Ar);
  P('W5 (per-plan lens: ankle/knee -> bridge, lowback -> bed thrust):');T.W5=surgW5(src);
  P('PRE (W5 + B + A + Ap + A4):');T.PRE=surgB(surgA4(surgAp(surgA(T.W5))));P('ALL (PRE + FL):');T.ALL=surgFL(T.PRE);P('FL alone:');T.FL=surgFL(src);
  P('ALT (W5 + B + A1 + own section after the calf + Ap + FL):');T.ALT=surgFL(surgB(surgAp(surgA2alt(surgA1(T.W5)))));
  P('tag trees:');T.Vt=tag(src);T.W3t=tag(T.W3);T.W4t=tag(T.W4);T.W5t=tag(T.W5);T.ALLt=tag(T.ALL);P('snapshot trees:');T.Vs=snap(src);T.W5s=snap(T.W5);
  TREES.forEach(t=>fs.writeFileSync(TP[t],T[t]));
  P('\nHALF_MANNY digests (fixture, clock pinned '+CLOCK+'):');
  const dg={};for(const t of TREES){const X=vm(t);const a=progDigest(X.buildProgram(clone(fixtures.HALF_MANNY))),b=progDigest(X.buildProgram(clone(fixtures.HALF_MANNY)));dg[t]=a;P('  '+t.padEnd(5)+' '+a+(a===b?'':'  SELF-IDENTITY FAIL '+b));}
  P('  == V230: '+TREES.filter(t=>dg[t]===dg.V).join(' ')+' | moved: '+TREES.filter(t=>dg[t]!==dg.V).map(t=>t+'='+dg[t]).join(' '));
  P('PRT TING digests: '+['V','B','Ar','ABp','ALL','ALT','W5','FL'].map(t=>t+'='+progDigest(vm(t).buildProgram(clone(PRT)))).join(' '));
  // tag neutrality on a probe
  const L=lattices().filter((x,i)=>i%97===0);let n=0,neu=0;for(const c of L){n++;if(stripJ(vm('V').buildProgram(clone(c.c)))===stripJ(vm('Vt').buildProgram(clone(c.c))))neu++;}P('tag neutrality V vs Vt '+neu+'/'+n);
  let n2=0,neu2=0;for(const c of L){n2++;if(stripJ(vm('ALL').buildProgram(clone(c.c)))===stripJ(vm('ALLt').buildProgram(clone(c.c))))neu2++;}P('tag neutrality ALL vs ALLt '+neu2+'/'+n2);
  const t0=Date.now();for(let i=0;i<10;i++)vm('V').buildProgram(clone(L[i].c));P('ms/build ~'+((Date.now()-t0)/10).toFixed(0));
  P('PREP DONE');
}
// ════════ JOBS ════════
const BWL=()=>lattices().filter(x=>/\|bodyweight\|/.test(x.k));
const NBW=()=>lattices().filter(x=>!/\|bodyweight\|/.test(x.k)&&(x.L==='L432'||x.L==='U_EQ'));
const PREV=()=>fullLattice().filter(x=>x.f==='support_prevention').concat(lattices().filter(x=>x.L==='L432'&&/\|support_prevention\|/.test(x.k)));
const CTRL=()=>fullLattice().filter((x,i)=>x.f!=='support_prevention'&&i%4===0).concat(lattices().filter(x=>x.L==='L432'&&!/\|support_prevention\|/.test(x.k)));
const FLL=()=>lattices();
function censusCell(XV,XA,cell,arm){const V=build(XV,cell.c),A=build(XA,cell.c);const pv=V.prog,pa=A.prog;
  const rec={L:cell.L,k:cell.k,arm,hV:sha(stripJ(pv)),hA:sha(stripJ(pa)),evV:[],evA:[],cardsA:[],landV:0,diff:[],stemV:stemDups(pv).length,stemA:[],exactA:exactDups(pa).length,adjV:adjPairs(pv).length,adjA:[],rejA:[],neuA:[],hipAdjV:0,hipAdjA:0};
  V.ev.filter(e=>e.src==='FB').forEach(e=>rec.evV.push({was:e.was,to:e.to,pw:pat(XV,e.was),pt:pat(XV,e.to)}));
  A.ev.filter(e=>e.src==='FB').forEach(e=>rec.evA.push({was:e.was,to:e.to,pw:pat(XA,e.was),pt:pat(XA,e.to)}));
  stemDups(pa).forEach(x=>rec.stemA.push(x));adjPairs(pa).forEach(x=>rec.adjA.push(x));
  rec.hipAdjV=adjPairs(pv).filter(x=>pat(XV,x.n)==='hip_ext').length;rec.hipAdjA=rec.adjA.filter(x=>pat(XA,x.n)==='hip_ext').length;
  const cfgF=pa.cfg;
  wk(pv).forEach(w=>ORDER.forEach(d=>{const dv=pv.weeks[w]&&pv.weeks[w][d],da=pa.weeks[w]&&pa.weeks[w][d];if(!dv&&!da)return;
    const landing=!!(dv&&liveSecs(dv).some(s=>s.items.some(it=>it.__bw&&it.__bw.was==='Banded hip thrust')));if(landing)rec.landV++;
    // arm FB cards
    liveSecs(da||{}).forEach(s=>s.items.forEach(it=>{if(!it.__bw||it.__bw.src!=='FB')return;rec.cardsA.push({w:+w,d,lab:clean(s.label||'').slice(0,30),main:/^Main/.test(s.label||''),was:it.__bw.was,to:clean(it.name),det:clean(it.detail||''),pw:pat(XA,it.__bw.was),pt:pat(XA,it.name)});}));
    const sv=dv?daySig(dv):'',sa=da?daySig(da):'';if(sv===sa)return;
    const iv=items(dv),ia=items(da);const kv=iv.map(x=>x.lab+' :: '+x.n),ka=ia.map(x=>x.lab+' :: '+x.n);
    const lost=msetDiff(kv,ka),gained=msetDiff(ka,kv);const red=[];iv.forEach(x=>{const y=ia.find(z=>z.lab===x.lab&&z.n===x.n);if(y&&y.d!==x.d)red.push(x.n+' ['+x.d+' -> '+y.d+']');});
    const lv=liveSecs(dv).map(s=>clean(s.label)),la=liveSecs(da).map(s=>clean(s.label));
    rec.diff.push({w:+w,d,landing,lost,gained,red,secLost:msetDiff(lv,la),secGain:msetDiff(la,lv),cardA:ia.map(x=>x.lab+': '+x.n+' '+x.d),cardV:iv.map(x=>x.lab+': '+x.n+' '+x.d)});
  }));
  // re-filter differential on the arm (final card vs its own plan)
  wk(pa).forEach(w=>ORDER.forEach(d=>{const dy=pa.weeks[w]&&pa.weeks[w][d];if(!dy||!Array.isArray(dy.sections))return;XA.ctx.__S=dy.sections;XA.ctx.__C=cfgF;const R=JSON.parse(XA.eval('JSON.stringify(__rej(__S,__C))'));R.r.forEach(r=>rec.rejA.push(Object.assign({w:+w,d},r)));R.neu.forEach(n=>rec.neuA.push(w+d+':'+n));}));
  return rec;}
function prevCell(XS,cell){const R={};for(const t of ['V','B','AB','ABp','ALT'])R[t]=XS[t].buildProgram(clone(cell.c));
  const flagBuild=(t,flag)=>{XS[t].eval('globalThis.'+flag+'=true');let p=null;try{p=XS[t].buildProgram(clone(cell.c));}finally{XS[t].eval('globalThis.'+flag+'=false');}return p;};let Rreg=null,Rbo=null;const Vreg=flagBuild('V','__REGIONAL_OFF');
  const rec={L:cell.L,k:cell.k,inj:cell.inj||cell.k.split('|')[0],eq:cell.eq||cell.k.split('|')[1],fam:cell.fam||'none',legs:[],nonLegDiff:0,cells:0,h:{V:sha(stripJ(R.V)),B:sha(stripJ(R.B)),AB:sha(stripJ(R.AB)),ABp:sha(stripJ(R.ABp))}};rec.vRegCalf=0;rec.nonLegKeys=[];
  wk(R.V).forEach(w=>ORDER.forEach(d=>{const dv=R.V.weeks[w]&&R.V.weeks[w][d];if(!dv||!liveSecs(dv).length)return;rec.cells++;
    const circ=t=>liveSecs(R[t].weeks[w]&&R[t].weeks[w][d]||{}).find(s=>clean(s.label)===CIRC)||null;const has=(t,re)=>liveSecs(R[t].weeks[w]&&R[t].weeks[w][d]||{}).some(s=>re.test(clean(s.label)));
    if(!circ('V')){if(daySig(R.ABp.weeks[w][d])!==daySig(R.B.weeks[w][d])){rec.nonLegDiff++;rec.nonLegKeys.push(w+d);}return;}
    if(!has('V',/^Calf — achilles/)&&liveSecs(Vreg.weeks[w][d]).some(s=>/^Calf — achilles/.test(clean(s.label))))rec.vRegCalf++;
    const nm=t=>items(R[t].weeks[w][d]).map(x=>x.n);const row={w:+w,d,circ:{V:circ('V').items.length,B:(circ('B')||{items:[]}).items.length,AB:(circ('AB')||{items:[]}).items.length,ABp:(circ('ABp')||{items:[]}).items.length},
      calf:{V:has('V',/^Calf — achilles/),B:has('B',/^Calf — achilles/),AB:has('AB',/^Calf — achilles/),ABp:has('ABp',/^Calf — achilles/)},carry:{V:has('V',/carry/i),B:has('B',/carry/i),AB:has('AB',/carry/i),ABp:has('ABp',/carry/i)},
      ABp_vs_B:{rem:msetDiff(nm('B'),nm('ABp')),add:msetDiff(nm('ABp'),nm('B'))},AB_vs_B:{rem:msetDiff(nm('B'),nm('AB')),add:msetDiff(nm('AB'),nm('B'))},ABp_vs_V:{rem:msetDiff(nm('V'),nm('ABp')),add:msetDiff(nm('ABp'),nm('V'))},
      fourth:(circ('ABp')&&circ('ABp').items.length>=4)?clean(circ('ABp').items[3].name)+' '+clean(circ('ABp').items[3].detail):null,
      alt:{glute:has('ALT',/^Glute — toe-off/),calf:has('ALT',/^Calf — achilles/),carry:has('ALT',/carry/i),rem:msetDiff(nm('B'),nm('ALT')),add:msetDiff(nm('ALT'),nm('B'))},
      cardio:(R.V.weeks[w][d].cardio?(R.V.weeks[w][d].cardio.subtype||R.V.weeks[w][d].cardio.type):'-'),exp:cell.c.experience,rest:(cell.c.restDays||[]).join(','),
      abl:(()=>{if(!(has('B',/^Calf — achilles/)&&!has('ABp',/^Calf — achilles/)))return null;Rreg=Rreg||flagBuild('ABp','__REGIONAL_OFF');Rbo=Rbo||flagBuild('ABp','__BUDGET_OFF');const hr=liveSecs(Rreg.weeks[w][d]).some(s=>/^Calf — achilles/.test(clean(s.label))),hb=liveSecs(Rbo.weeks[w][d]).some(s=>/^Calf — achilles/.test(clean(s.label)));return (hr?'regional':'')+(hb?'budget':'')||'neither';})(),
      redet:(()=>{const ib=items(R.B.weeks[w][d]),ia=items(R.ABp.weeks[w][d]);const o=[];ib.forEach(x=>{const y=ia.find(z=>z.lab===x.lab&&z.n===x.n);if(y&&y.d!==x.d)o.push(x.n+' ['+x.d+' -> '+y.d+']');});return o;})()};
    rec.legs.push(row);}));
  return rec;}
function flCell(XS,cell){const pP=XS.PRE.buildProgram(clone(cell.c)),pA=XS.ALL.buildProgram(clone(cell.c));const rec={L:cell.L,k:cell.k,rejP:[],rejA:[],neuP:[],neuA:[],diff:[],days:0};
  for(const [t,p,X,rk,nk] of [['PRE',pP,XS.PRE,'rejP','neuP'],['ALL',pA,XS.ALL,'rejA','neuA']])wk(p).forEach(w=>ORDER.forEach(d=>{const dy=p.weeks[w]&&p.weeks[w][d];if(!dy||!Array.isArray(dy.sections))return;if(t==='PRE'&&liveSecs(dy).length)rec.days++;X.ctx.__S=dy.sections;X.ctx.__C=p.cfg;const R=JSON.parse(X.eval('JSON.stringify(__rej(__S,__C))'));R.r.forEach(r=>rec[rk].push(Object.assign({w:+w,d},r)));R.neu.forEach(n=>rec[nk].push(w+d+':'+n));}));
  wk(pP).forEach(w=>ORDER.forEach(d=>{const a=pP.weeks[w]&&pP.weeks[w][d],b=pA.weeks[w]&&pA.weeks[w][d];if(!a&&!b)return;const sa=a?daySig(a):'',sb=b?daySig(b):'';if(sa===sb)return;const ia=items(a),ib=items(b);const ka=ia.map(x=>x.lab+' :: '+x.n),kb=ib.map(x=>x.lab+' :: '+x.n);const red=[];ia.forEach(x=>{const y=ib.find(z=>z.lab===x.lab&&z.n===x.n);if(y&&y.d!==x.d)red.push(x.lab+': '+x.n+' ['+x.d+' -> '+y.d+']');});rec.diff.push({w:+w,d,lost:msetDiff(ka,kb),gained:msetDiff(kb,ka),red});}));
  return rec;}
function worker(spec){const [job,i0,i1]=spec.split(':');let out=[];
  if(job==='W3'||job==='W4'||job==='W5'){const cells=BWL().slice(+i0,+i1);const XV=vm('Vt'),XA=vm(job+'t');out=cells.map(c=>censusCell(XV,XA,c,job));}
  else if(job==='nbw'){const cells=NBW().slice(+i0,+i1);const XV=vm('V'),XA=vm('W5'),XB=vm('ALL');out=cells.map(c=>({L:c.L,k:c.k,sameW3:stripJ(XV.buildProgram(clone(c.c)))===stripJ(XA.buildProgram(clone(c.c))),sameALLvsV:stripJ(XV.buildProgram(clone(c.c)))===stripJ(XB.buildProgram(clone(c.c)))}));}
  else if(job==='prev'){const cells=PREV().slice(+i0,+i1);const XS={V:vm('V'),B:vm('B'),AB:vm('AB'),ABp:vm('ALL'),ALT:vm('ALT')};out=cells.map(c=>prevCell(XS,c));}
  else if(job==='ctrl'){const cells=CTRL().slice(+i0,+i1);const XB=vm('B'),XP=vm('ABp');out=cells.map(c=>({L:c.L,k:c.k,same:stripJ(XB.buildProgram(clone(c.c)))===stripJ(XP.buildProgram(clone(c.c)))}));}
  else if(job==='fl'){const cells=FLL().slice(+i0,+i1);const XS={PRE:vm('PRE'),ALL:vm('ALL')};out=cells.map(c=>flCell(XS,c));}
  fs.writeFileSync(F('res_'+spec.replace(/:/g,'_')+'.json'),JSON.stringify(out));P('worker '+spec+' cells '+out.length);}
function run(){return new Promise(done=>{const jobs=[];const add=(job,N,CH)=>{for(let i=0;i<N;i+=CH)jobs.push(job+':'+i+':'+Math.min(N,i+CH));};
  const J=(process.env.JOBS||'W3,W4,W5,nbw,prev,ctrl,fl').split(',');if(J.includes('W3'))add('W3',BWL().length,50);if(J.includes('W4'))add('W4',BWL().length,50);if(J.includes('W5'))add('W5',BWL().length,50);if(J.includes('nbw'))add('nbw',NBW().length,60);if(J.includes('prev'))add('prev',PREV().length,36);if(J.includes('ctrl'))add('ctrl',CTRL().length,80);if(J.includes('fl'))add('fl',FLL().length,60);
  const par=+(process.env.PAR||8);let i=0,crash=0;const t0=Date.now();
  const one=j=>new Promise(res=>{const p=cp.spawn(process.execPath,['--max-old-space-size=4096',__filename],{env:Object.assign({},process.env,{WORKER:j,PART:'none'}),stdio:['ignore','pipe','pipe']});let o='';p.stdout.on('data',x=>o+=x);p.stderr.on('data',x=>o+=x);p.on('exit',code=>{if(code){crash++;P('WORKER CRASH '+j+' '+o.slice(-800));}res();});});
  Promise.all(Array.from({length:par},async()=>{while(i<jobs.length)await one(jobs[i++]);})).then(()=>{P('RUN jobs '+jobs.length+' crashes '+crash+' '+((Date.now()-t0)/1000).toFixed(0)+' s');done();});});}
const loadRes=pre=>{const R=[];fs.readdirSync(SCR).filter(f=>new RegExp('^res_'+pre+'_.*\\.json$').test(f)).forEach(f=>JSON.parse(fs.readFileSync(F(f),'utf8')).forEach(x=>R.push(x)));return R;};
const reg=k=>k.split('|')[0],seg=k=>k.split('|');
function report(){
  P('\n################ (1) P-BWFALLBACK draw-site arms on the bodyweight injured lattice ('+BWL().length+' cells: '+fmt(tally(BWL(),x=>x.L))+')');
  for(const arm of (process.env.ARMS||'W3,W4,W5').split(',')){const R=loadRes(arm);if(!R.length)continue;P('\n================ ARM '+arm+' ('+(arm==='W3'?'_bwHT = Single-leg glute bridge':arm==='W4'?'_bwHT = Single-leg hip thrust (shoulders on bed)':'per-plan: ankle/knee -> bridge, lowback -> bed thrust')+') cells '+R.length);
    const evV=R.flatMap(r=>r.evV),evA=R.flatMap(r=>r.evA);
    P('  V230 _bwFallback events '+evV.length+': '+fmt(tally(evV,e=>e.was+'{'+e.pw+'} -> '+e.to+'{'+e.pt+'}')));
    P('  '+arm+'  _bwFallback events '+evA.length+': '+fmt(tally(evA,e=>e.was+'{'+e.pw+'} -> '+e.to+'{'+e.pt+'}')));
    P('  '+arm+' catch-all (-> Burpees) events whose source is hip_ext: '+evA.filter(e=>e.to==='Burpees'&&e.pw==='hip_ext').length+' | hip_ext names reaching the sweep at all: '+evA.filter(e=>e.pw==='hip_ext').length);
    const land=R.filter(r=>r.landV>0),noLand=R.filter(r=>r.landV===0);
    P('  builds with a Banded hip thrust card on V230: '+land.length+' ('+land.reduce((a,r)=>a+r.landV,0)+' days) | without: '+noLand.length+' byte-identical to V230 '+noLand.filter(r=>r.hV===r.hA).length+'/'+noLand.length+(noLand.some(r=>r.hV!==r.hA)?' DIFFER: '+noLand.filter(r=>r.hV!==r.hA).slice(0,5).map(r=>r.L+' '+r.k).join(' ; '):''));
    const D=R.flatMap(r=>r.diff.map(x=>Object.assign({L:r.L,k:r.k},x)));const DL=D.filter(x=>x.landing),DN=D.filter(x=>!x.landing);
    P('  days differing from V230: '+D.length+' | on landing days '+DL.length+' | on NON-landing days '+DN.length+(DN.length?' '+fmt(tally(DN,x=>x.L+' '+x.k+' W'+x.w+x.d)).slice(0,600):''));
    P('  landing days: lost cards '+DL.reduce((a,x)=>a+x.lost.length,0)+' '+fmt(tally(DL.flatMap(x=>x.lost),x=>x)).slice(0,900));
    P('  landing days: gained cards '+DL.reduce((a,x)=>a+x.gained.length,0)+' '+fmt(tally(DL.flatMap(x=>x.gained),x=>x)).slice(0,1200));
    P('  landing days: kept cards re-detailed '+DL.reduce((a,x)=>a+x.red.length,0)+' '+fmt(tally(DL.flatMap(x=>x.red),x=>x)).slice(0,800));
    P('  landing days: sections lost '+DL.reduce((a,x)=>a+x.secLost.length,0)+' '+fmt(tally(DL.flatMap(x=>x.secLost),x=>x))+' | sections gained '+DL.reduce((a,x)=>a+x.secGain.length,0)+' '+fmt(tally(DL.flatMap(x=>x.secGain),x=>x)));
    P('  non-landing days: lost '+DN.reduce((a,x)=>a+x.lost.length,0)+' gained '+DN.reduce((a,x)=>a+x.gained.length,0)+' '+fmt(tally(DN.flatMap(x=>x.lost.map(y=>'-'+y).concat(x.gained.map(y=>'+'+y))),x=>x)).slice(0,800));
    P('  stem doubles (name minus parentheses equal, same day): V230 '+R.reduce((a,r)=>a+r.stemV,0)+' | '+arm+' '+R.reduce((a,r)=>a+r.stemA.length,0)+' '+fmt(tally(R.flatMap(r=>r.stemA),x=>x.names)).slice(0,700));
    P('  exact doubles on '+arm+' (post-sweep): '+R.reduce((a,r)=>a+r.exactA,0));
    P('  adjacent-day same name: V230 '+R.reduce((a,r)=>a+r.adjV,0)+' | '+arm+' '+R.reduce((a,r)=>a+r.adjA.length,0)+' | hip_ext names only: V230 '+R.reduce((a,r)=>a+r.hipAdjV,0)+' '+arm+' '+R.reduce((a,r)=>a+r.hipAdjA,0)+' '+fmt(tally(R.flatMap(r=>r.adjA.filter(x=>/bridge|thrust|extension/i.test(x.n))),x=>x.n)));
    const C=R.flatMap(r=>r.cardsA.map(x=>Object.assign({L:r.L,k:r.k},x)));P('  '+arm+' final cards written by _bwFallback '+C.length+': '+fmt(tally(C,x=>x.was+' -> '+x.to+' '+(x.main?'Main':'acc'))).slice(0,600));
    // the landing on the final card: Main bridge/thrust on the four plans
    const M=DL.flatMap(x=>x.gained.filter(g=>/^Main/.test(g)).map(g=>({L:x.L,k:x.k,w:x.w,d:x.d,g})));P('  landing days: Main gained by plan: '+fmt(tally(M,x=>reg(x.k)+' '+x.g)));
    const rej=R.flatMap(r=>r.rejA.map(x=>Object.assign({L:r.L,k:r.k},x))),neu=R.flatMap(r=>r.neuA);
    P('  '+arm+' post-sweep re-filter differential (bodyweight cells): '+rej.length+' | '+fmt(tally(rej,x=>x.L+' '+x.kind+' '+x.n+(x.to?'>'+x.to:'')))+' | new items '+neu.length);
    // RPE on gained Mains
    const mainsA=DL.flatMap(x=>x.cardA.filter(c=>/^Main/.test(c)));P('  landing-day Main cards on '+arm+' '+mainsA.length+' | RPE>7 '+mainsA.filter(c=>rpeOf(c)>7).length+' | test text '+mainsA.filter(c=>/Work up to one/.test(c)).length+' | by plan x RPE>7: '+fmt(tally(DL.flatMap(x=>x.cardA.filter(c=>/^Main/.test(c)&&rpeOf(c)>7).map(c=>reg(x.k))),x=>x)));
  }
  const NB=loadRes('nbw');P('\n  non-bodyweight cells (L432 + U_EQ) W3 == V230: '+NB.filter(r=>r.sameW3).length+'/'+NB.length+' | ALL == V230: '+NB.filter(r=>r.sameALLvsV).length+'/'+NB.length+' '+fmt(tally(NB.filter(r=>!r.sameALLvsV),r=>r.L+' '+seg(r.k)[3]+' '+seg(r.k)[1])).slice(0,400));
  P('\n################ (2) D195 A / A-prime on the prevention lattice ('+PREV().length+' cells)');
  const PR=loadRes('prev');const legs=PR.flatMap(r=>r.legs.map(x=>Object.assign({L:r.L,k:r.k,inj:r.inj,eq:r.eq,fam:r.fam},x)));
  P('  prevention builds '+PR.length+' | leg days (V has the circuit) '+legs.length+' | non-leg days ABp != B: '+PR.reduce((a,r)=>a+r.nonLegDiff,0)+' of '+(PR.reduce((a,r)=>a+r.cells,0)-legs.length));
  for(const t of ['AB','ABp']){P('  -- '+t+' vs B (A'+(t==='ABp'?' + sprawl allowance':'')+' on top of B) --');
    const g=legs.filter(x=>x.circ[t]===4);P('    circuit has 4 items: '+g.length+'/'+legs.length+' | calf lost (B had, '+t+' lacks): '+legs.filter(x=>x.calf.B&&!x.calf[t]).length+' | carry lost: '+legs.filter(x=>x.carry.B&&!x.carry[t]).length);
    const k=t+'_vs_B';P('    items removed: '+legs.reduce((a,x)=>a+x[k].rem.length,0)+' '+fmt(tally(legs.flatMap(x=>x[k].rem),x=>x)).slice(0,500));
    P('    items added: '+legs.reduce((a,x)=>a+x[k].add.length,0)+' '+fmt(tally(legs.flatMap(x=>x[k].add),x=>x)).slice(0,700));
    P('    days with anything beyond +1 added / 0 removed: '+legs.filter(x=>x[k].rem.length||x[k].add.length>1).length+' '+fmt(tally(legs.filter(x=>x[k].rem.length||x[k].add.length>1),x=>x.inj+' '+x.eq+' '+x.fam+' -'+x[k].rem.join(',')+' +'+x[k].add.join(','))).slice(0,900));
  }
  P('  V230: leg days where the regional cap takes the achilles calf today (V lacks it, V regional-off has it): '+PR.reduce((a,r)=>a+r.vRegCalf,0)+' | non-leg days ABp != B, by cell: '+fmt(tally(PR.filter(r=>r.nonLegKeys.length),r=>r.L+' '+r.k+' '+r.nonLegKeys.join(','))));
  P('  ABp: leg days with a run stacked (cardio on the day): '+legs.filter(x=>x.cardio!=='-').length+' | of those, 4th item printed '+legs.filter(x=>x.cardio!=='-'&&x.circ.ABp===4).length+', calf present '+legs.filter(x=>x.cardio!=='-'&&x.calf.ABp).length+', calf present on B '+legs.filter(x=>x.cardio!=='-'&&x.calf.B).length+' | dry leg days '+legs.filter(x=>x.cardio==='-').length+': 4th printed '+legs.filter(x=>x.cardio==='-'&&x.circ.ABp===4).length);
  P('  -- ABp (= ALL tree) calf-lost attribution: '+fmt(tally(legs.filter(x=>x.abl),x=>x.abl))+' | by exp x rest x cardio-on-day: '+fmt(tally(legs.filter(x=>x.abl),x=>x.exp+' '+x.rest+' {'+x.cardio+'}'))+' | by fam x eq: '+fmt(tally(legs.filter(x=>x.abl),x=>x.fam+' '+x.eq)));
  P('  -- ALT (own section after the calf) vs B: glute section printed '+legs.filter(x=>x.alt.glute).length+'/'+legs.length+' | calf lost '+legs.filter(x=>x.calf.B&&!x.alt.calf).length+' | carry lost '+legs.filter(x=>x.carry.B&&!x.alt.carry).length+' | removed '+legs.reduce((a,x)=>a+x.alt.rem.length,0)+' '+fmt(tally(legs.flatMap(x=>x.alt.rem),x=>x)).slice(0,400)+' | added '+legs.reduce((a,x)=>a+x.alt.add.length,0)+' '+fmt(tally(legs.flatMap(x=>x.alt.add),x=>x)).slice(0,500));
  P('     ALT glute section absent, by inj x eq: '+fmt(tally(legs.filter(x=>!x.alt.glute),x=>x.inj+' '+x.eq)).slice(0,700)+' | absent by week: '+fmt(tally(legs.filter(x=>!x.alt.glute&&x.inj==='none'),x=>'W'+x.w)));
  P('  -- ABp vs V230 (whole change on prevention leg days) --');
  P('    removed '+legs.reduce((a,x)=>a+x.ABp_vs_V.rem.length,0)+' '+fmt(tally(legs.flatMap(x=>x.ABp_vs_V.rem),x=>x)).slice(0,400)+' | added '+legs.reduce((a,x)=>a+x.ABp_vs_V.add.length,0)+' '+fmt(tally(legs.flatMap(x=>x.ABp_vs_V.add),x=>x)).slice(0,600));
  P('    kept cards re-detailed ABp vs B: '+legs.reduce((a,x)=>a+x.redet.length,0)+' '+fmt(tally(legs.flatMap(x=>x.redet),x=>x)).slice(0,300));
  P('    4th item not built on ABp, by injury plan x tier: '+fmt(tally(legs.filter(x=>x.circ.ABp<4),x=>x.inj+' '+x.eq)).slice(0,900));
  P('    4th item printed, by injury plan: '+fmt(tally(legs.filter(x=>x.circ.ABp===4),x=>x.inj+' :: '+x.fourth)).slice(0,1500));
  P('    circuit 4 on recovery/any week by week: '+fmt(tally(legs.filter(x=>x.circ.ABp===4),x=>'W'+x.w)));
  const CT=loadRes('ctrl');P('  control (non-prevention '+CT.length+' cells): ABp == B byte-identical '+CT.filter(r=>r.same).length+'/'+CT.length);
  P('\n################ (3) P-FILTERLAST differential on PRE (W3+B+A+Ap) and ALL (PRE + post-sweep re-filter), '+FLL().length+' cells');
  const FR=loadRes('fl');for(const [t,rk,nk] of [['PRE','rejP','neuP'],['ALL','rejA','neuA']]){const rows=FR.flatMap(r=>r[rk].map(x=>Object.assign({L:r.L,k:r.k},x))),neu=FR.flatMap(r=>r[nk]);
    P('  '+t+': re-filter differential '+rows.length+' cards | drop '+rows.filter(x=>x.kind==='drop').length+' rename '+rows.filter(x=>x.kind==='rename').length+' redetail '+rows.filter(x=>x.kind==='redetail').length+' (Pushups '+rows.filter(x=>x.kind==='redetail'&&/^Pushups/.test(x.n)).length+') | new items '+neu.length+' | by lattice: '+fmt(tally(rows,x=>x.L+' '+x.kind)));
    rows.slice(0,40).forEach(r=>P('     '+r.L+' '+r.k+' W'+r.w+' '+r.d+' ['+clean(r.lab).slice(0,24)+'] '+r.kind+' '+r.n+(r.to?' > '+r.to:'')+(r.kind==='redetail'?' :: '+JSON.stringify(r.d0)+' -> '+JSON.stringify(r.d1):'')));}
  const DF=FR.flatMap(r=>r.diff.map(x=>Object.assign({L:r.L,k:r.k},x)));P('  ALL vs PRE: days changed '+DF.length+' | lost '+DF.reduce((a,x)=>a+x.lost.length,0)+' gained '+DF.reduce((a,x)=>a+x.gained.length,0)+' re-detailed '+DF.reduce((a,x)=>a+x.red.length,0)+' '+fmt(tally(DF.flatMap(x=>x.red),x=>x)).slice(0,600)+' '+fmt(tally(DF.flatMap(x=>x.lost.map(y=>'-'+y).concat(x.gained.map(y=>'+'+y))),x=>x)).slice(0,400));
  P('REPORT DONE');
}
function cards(){
  const want=[['ankle/protect|bodyweight|beginner|support_strength|sun,wed',[[3,'thu'],[4,'thu']]],['ankle/protect|bodyweight|intermediate|balanced|sat,sun',[[3,'wed'],[4,'wed'],[3,'thu']]],['lowback/protect|bodyweight|beginner|support_strength|sun,wed',[[1,'tue'],[2,'tue'],[3,'thu'],[4,'thu']]],['lowback/workaround|bodyweight|beginner|support_strength|sun,wed',[[1,'tue'],[2,'tue']]],['knee/protect|bodyweight|beginner|support_prevention|sun,wed',[[1,'thu'],[3,'thu']]],['knee/protect|bodyweight|intermediate|support_strength|sun,wed',[[3,'thu'],[4,'thu']]],['ankle/protect|bodyweight|beginner|support_prevention|sun,wed',[[1,'thu'],[3,'thu']]]];
  const L=lattices();
  for(const [k,days] of want){const cell=L.find(x=>x.k===k&&(x.L==='L432'||x.L==='LBW'));if(!cell){P('(no cell '+k+')');continue;}
    P('\n=== CARDS '+cell.L+' '+k);for(const t of ['Vt','W5t','ALLt']){const p=vm(t).buildProgram(clone(cell.c));
      for(const [w,d] of days){const dy=p.weeks[w]&&p.weeks[w][d];P('  ['+t.replace(/t$/,'')+'] W'+w+' '+d+' '+(dy?(dy.title||'')+(dy.cardio?' {'+(dy.cardio.subtype||dy.cardio.type)+'}':''):'(none)'));
        liveSecs(dy||{}).forEach(s=>{P('     '+clean(s.label||s.coreHeader||'')+(s.superset?' (SS '+(s.rounds||'')+')':''));s.items.forEach(i=>P('        - '+clean(i.name)+' :: '+clean(i.detail||'')+(i.__bw?'   [sweep '+i.__bw.src+' < '+i.__bw.was+']':'')));});}}}
  // pre-sweep print of the knee/protect day whose LSB is absent on V230
  for(const [k,sd,w,d] of [['knee/protect|bodyweight|advanced|support_athletic|sun,wed',11,1,'thu'],['knee/protect|bodyweight|intermediate|hypertrophy|sun,wed',90210,1,'thu']]){const cell=L.find(x=>x.k===k);if(!cell)continue;const c=Object.assign(clone(cell.c),{seed:sd});
    for(const t of ['Vs','W5s']){const X=vm(t);X.eval('globalThis.__PRE=null');const p=X.buildProgram(clone(c));const pre=JSON.parse(X.eval('globalThis.__PRE'));X.eval('globalThis.__PRE=undefined');
      P('\n=== PRE-SWEEP '+t+' '+k+' s'+sd+' W'+w+' '+d+'\n    pre : '+card(pre[w][d])+'\n    post: '+card(p.weeks[w][d]));}}
  const bc=fullLattice().find(x=>x.k==='support_prevention|race|commercial|beginner|s87747|sat,sun');if(bc){P('\n=== CARDS FULL '+bc.k+' (a calf-lost cell) W1 and W3 leg day: V / B / AB / ALL / ALT');for(const t of ['V','B','AB','ALL','ALT']){const p=vm(t).buildProgram(clone(bc.c));for(const w of [1,3]){const e=ORDER.map(d=>[d,p.weeks[w]&&p.weeks[w][d]]).find(([d,dy])=>dy&&liveSecs(dy).some(s=>clean(s.label)===CIRC||/^Leg superset A/.test(clean(s.label))));if(!e){P('  ['+t+'] W'+w+' (no leg day found)');continue;}P('  ['+t+'] W'+w+' '+e[0]+' '+(e[1].cardio?'{'+(e[1].cardio.subtype||e[1].cardio.type)+'}':'{no run}')+'\n        '+card(e[1]));}}}
  P('\n=== HALF_MANNY (fixture seed 76308) every Tue W1..W14: V230 / B / AB(no allowance) / ABp / ALL / ALT');
  const M={};for(const t of ['V','B','A','ABp','ALL','ALT'])M[t]=vm(t).buildProgram(clone(fixtures.HALF_MANNY));
  const MAB=vm('AB').buildProgram(clone(fixtures.HALF_MANNY));
  wk(M.V).forEach(w=>{const d='tue';P('  W'+w+' tue  '+(M.V.weeks[w][d].title||''));P('    V    '+card(M.V.weeks[w][d]));
    for(const [t,p] of [['B',M.B],['AB',MAB],['ABp',M.ABp],['ALL',M.ALL],['ALT',M.ALT]]){if(!p)continue;const s=daySig(p.weeks[w][d])===daySig(M.V.weeks[w][d]);P('    '+t.padEnd(4)+' '+(s?'(identical to V230)':card(p.weeks[w][d])));}});
  P('  Manny non-Tue days ALL != V230: '+(()=>{let n=0;wk(M.V).forEach(w=>ORDER.forEach(d=>{if(d==='tue')return;if(daySig(M.V.weeks[w][d]||{})!==daySig(M.ALL.weeks[w][d]||{}))n++;}));return n;})());
  P('\n=== PRT TING (seed 87747) W9 Mon / W9 Tue / W10 Tue: V230 / B / ALL');
  const PR={};for(const t of ['V','B','ALL'])PR[t]=vm(t).buildProgram(clone(PRT));
  for(const [w,d] of [[9,'mon'],[9,'tue'],[10,'tue'],[1,'mon']]){P('  PRT W'+w+' '+d);for(const t of ['V','B','ALL']){const s=t!=='V'&&daySig(PR[t].weeks[w][d])===daySig(PR.V.weeks[w][d]);P('    '+t.padEnd(4)+' '+(s?'(identical to V230)':card(PR[t].weeks[w][d])));}}
  P('  PRT day cells changed V->ALL: '+(()=>{let n=0,t=0;wk(PR.V).forEach(w=>ORDER.forEach(d=>{t++;if(daySig(PR.V.weeks[w][d]||{})!==daySig(PR.ALL.weeks[w][d]||{}))n++;}));return n+'/'+t;})());
  P('CARDS DONE');
}
function surgB_tree(){const f=F('t_AB.html');if(!fs.existsSync(f)){const src=fs.readFileSync(TP.V,'utf8');fs.writeFileSync(f,surgB(surgA(src)));}const X=load(f);const T=new Date(CLOCK+'T12:00:00').getTime();const RD=Date;class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}X.ctx.Date=FD;return X;}
async function main(){if(process.env.WORKER)return worker(process.env.WORKER);
  if(PART==='prep'||PART==='all')prep();if(PART==='run'||PART==='all')await run();if(PART==='report'||PART==='all')report();if(PART==='cards'||PART==='all')cards();}
main();
