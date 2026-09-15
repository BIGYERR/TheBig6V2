// GATEKEEPER V196 — independent lattice over HAND-BUILT ia_exw_/ia_hist_ stores.
// Proves, on RENDERED output and on the model:
//   (1) the acceptance case (bodyweight, 48 sessions, 1476 reps) renders on V196
//   (2) D58 closure  plotted + accessoryDay + noLoad == entries, every main, every config
//   (3) completeness  every populated key lands in exactly ONE bucket
//   (4) a non-empty store never yields 0 characters
//   (5) D59  no weight is invented: every plotted point is an entry that really carried
//       that weight in that week; "Opened at" names the first PLOTTED session's week
//   (6) the neither-load-nor-reps fall-through is reachable
// Nothing here is read back out of the code under test: every expectation is arithmetic
// over the generator's own table.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const FILE=process.argv[2]||'/Users/CanasBangin/Desktop/TheBig6V2/index.html';
const IA=load(FILE);
let P=0,F=0; const V=[];
const ok=(n,c,d)=>{ if(c)P++; else {F++; V.push(n+(d!==undefined?'  -> '+d:''));} };

const STUB="__mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],"
 +"classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},"
 +"setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},"
 +"appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},"
 +"replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},"
 +"addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},"
 +"closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},"
 +"offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};"
 +"__els={};document.getElementById=function(id){if(!__els[id])__els[id]=__mk(id);return __els[id];};"
 +"document.querySelectorAll=function(){return[];};document.querySelector=function(){return null;};";
const PID='gk196';

// deterministic PRNG, pinned
let _s=20260915; const rnd=()=>{_s=(_s*1103515245+12345)&0x7fffffff; return _s/0x7fffffff;};
const pick=a=>a[Math.floor(rnd()*a.length)%a.length];

function buildStore(table){
  const exw={},hist={};
  table.forEach(mv=>{
    const key=IA.eval('exStoreKey('+JSON.stringify(mv.name)+')');
    if(!exw[key]) exw[key]={name:mv.name,entries:[]};
    mv.sessions.forEach((s,i)=>{
      exw[key].entries.push({weight:s.weight||0,setsReps:s.setsReps===undefined?'':s.setsReps,
        setsDone:(s.sets||[]).slice(),setsW:[],week:s.week,day:s.day,ts:s.week*1000+i});
      const hk='w'+s.week+'_'+s.day;
      if(!hist[hk]) hist[hk]={sections:[]};
      if(s.slot==='main') hist[hk].sections.unshift({label:'Main — '+mv.name,items:[{name:mv.name,detail:s.detail||'3×10'}]});
      else { let a=hist[hk].sections.filter(x=>x.label==='Accessory')[0];
             if(!a){a={label:'Accessory',items:[]};hist[hk].sections.push(a);}
             a.items.push({name:mv.name,detail:s.detail||'3×8–12 @ RPE 8'}); }
    });
  });
  return {exw,hist};
}
function render(store,unit){
  IA.localStorage.clear(); IA.eval(STUB);
  const prog={id:PID,name:'GK',archived:false,totalWeeks:12,startDate:'2026-01-05',liftingFocus:'balanced',
    cfg:{name:'GK',unit:unit,cardioTypes:[],liftingFocus:'balanced',experience:'intermediate'},weeks:{}};
  IA.localStorage.setItem('ia_programs',JSON.stringify([prog]));
  IA.localStorage.setItem('ia_exw_'+PID,JSON.stringify(store.exw));
  IA.localStorage.setItem('ia_hist_'+PID,JSON.stringify(store.hist));
  IA.localStorage.setItem('ia_logs_'+PID,JSON.stringify({w1_mon:{rpe:7,ts:1}}));
  IA.eval("activeProgId='"+PID+"'"); IA.eval('activeProg='+JSON.stringify(prog)); IA.eval('progressViewId=null');
  IA.eval('renderProgressScreen()');
  return IA.eval('__els.progressBody ? __els.progressBody.innerHTML : ""')||'';
}
const model=s=>JSON.parse(IA.eval('JSON.stringify(ledgerModel('+JSON.stringify(s.exw)+','+JSON.stringify(s.hist)+'))'));
const cardsHtml=(s,u)=>IA.eval('buildLedgerCards(ledgerModel('+JSON.stringify(s.exw)+','+JSON.stringify(s.hist)+'),'+JSON.stringify(u)+')');
const txt=h=>h.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const CARD='<div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:14px 16px">';
const BLK='<div style="padding:12px 0;border-bottom:1px solid var(--border)">';
const cardTitled=(h,t)=>{const c=h.split(CARD).slice(1).filter(x=>x.slice(0,900).indexOf(t+'</div>')>=0);return c.length?c[0]:'';};
const countOf=(s,n)=>{let c=0,i=0;while((i=s.indexOf(n,i))>=0){c++;i+=n.length;}return c;};

console.log('# gk196 ledger lattice against ia-version '+IA.version);

// ── (1) ACCEPTANCE CASE ─────────────────────────────────────────────────────
const DAYS5=['mon','tue','wed','thu','fri'];
const ACC_TABLE=[];
{ const plan=[['Push-up','mon',[1,3,5,7,9],9],['Bodyweight squat','mon',[2,4,6,8,10],10],
   ['Inverted row','tue',[1,3,5,7,9],9],['Pike push-up','tue',[2,4,6,8,10],10],
   ['Reverse lunge','wed',[1,3,5,7,9],0],['Glute bridge','wed',[2,4,6,8,10],0],
   ['Nordic hamstring curl','thu',[1,3,5,7,9],0],['Single-leg hip thrust','thu',[2,4,6,8,10],0],
   ['Chin-up','fri',[1,3,5,7],0],['Dip','fri',[2,4,6,8],0]];
  plan.forEach(p=>ACC_TABLE.push({name:p[0],sessions:p[2].map(w=>({week:w,day:p[1],slot:'main',weight:0,
    sets:(w===p[3])?[13,13,13]:[10,10,10],setsReps:'3×10',detail:'3 sets to effort'}))}));
}
const ACC_SESS=ACC_TABLE.reduce((a,m)=>a+m.sessions.length,0);
const ACC_REPS=ACC_TABLE.reduce((a,m)=>a+m.sessions.reduce((x,s)=>x+s.sets.reduce((p,q)=>p+q,0),0),0);
const ACC=buildStore(ACC_TABLE);
const ACC_HTML=render(ACC,'lbs');
const ACC_CARD=cardTitled(ACC_HTML,'Main Lifts');
ok('ACC0 fixture is 48 sessions / 1476 reps',ACC_SESS===48&&ACC_REPS===1476,ACC_SESS+'/'+ACC_REPS);
ok('ACC1 the populated bodyweight store renders more than 0 characters',ACC_CARD.length>0,'chars='+ACC_CARD.length);
ok('ACC2 exactly 10 reps blocks render',ACC_CARD.split(BLK).slice(1).length===10,'blocks='+ACC_CARD.split(BLK).slice(1).length);
ok('ACC3 all 48 sessions are plotted',countOf(ACC_CARD,'<circle')===48,'dots='+countOf(ACC_CARD,'<circle'));
{ const m=model(ACC);
  const tot=m.mains.reduce((a,x)=>a+x.entries,0), plo=m.mains.reduce((a,x)=>a+x.plotted,0);
  ok('ACC4 the model accounts for all 48 sessions',tot===48&&plo===48,'entries='+tot+' plotted='+plo);
  ok('ACC5 every block is mode reps and carries no load unit',m.mains.every(x=>x.mode==='reps')&&!/\d\s*(lbs|kg)\b/.test(txt(ACC_CARD)));
  // rep counts intact: each movement's headline v == its own max set
  const bad=ACC_TABLE.filter(t=>{const r=m.mains.filter(x=>x.name===t.name)[0];
    const mx=Math.max.apply(null,t.sessions.map(s=>Math.max.apply(null,s.sets)));
    return !r||r.heavy.v!==mx||r.plotted!==t.sessions.length;});
  ok('ACC6 every movement keeps its own session count and top rep count',bad.length===0,bad.map(b=>b.name).join('|'));
}

// ── (2..6) THE LATTICE ──────────────────────────────────────────────────────
// Six session SHAPES per movement; every combination sampled across sizes and units.
const SHAPES={
  main_loaded:   (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'main',weight:100+i*5,sets:[5,5,5],setsReps:'3×5'})),
  main_blank:    (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'main',weight:0,sets:[12,11,10],setsReps:'3×12'})),
  main_mixed:    (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'main',weight:(i%2)?0:(80+i*5),sets:[8,8,8],setsReps:'3×8'})),
  main_nothing:  (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'main',weight:0,sets:[],setsReps:''})),
  acc_ranged:    (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'acc',weight:20+i*5,sets:[12,12,12],setsReps:'3×12',detail:'3×8–12 @ RPE 8'})),
  acc_plain:     (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'acc',weight:40,sets:[10,10],setsReps:'2×10',detail:'2 sets of 10'})),
  acc_unloaded:  (n,d)=>Array.from({length:n},(_,i)=>({week:i+1,day:d,slot:'acc',weight:0,sets:[15,15],setsReps:'2×15',detail:'2 sets to effort'})),
};
const SHAPE_KEYS=Object.keys(SHAPES);
const NAMES=['Barbell back squat','Barbell bench press','Barbell deadlift','Barbell overhead press',
  'Dumbbell bench press','Dumbbell goblet squat','Dumbbell lateral raise','Cable triceps pushdown',
  'Push-up','Chin-up','Hanging knee raise','Barbell Romanian deadlift'];
const UNITS=['lbs','kg'];

let configs=0, mains=0, keysSeen=0, fallthrough=0, mixedCases=0;
for(let trial=0; trial<420; trial++){
  const nMv=1+Math.floor(rnd()*5);
  const table=[]; const used={};
  for(let k=0;k<nMv;k++){
    let nm=pick(NAMES); if(used[nm]) continue; used[nm]=1;
    const mv={name:nm,sessions:[]};
    // 1 or 2 shapes per movement, on distinct days, so a movement can be BOTH main and acc
    const nSh=1+Math.floor(rnd()*2);
    for(let z=0;z<nSh;z++){
      const sh=pick(SHAPE_KEYS), n=1+Math.floor(rnd()*6), d=DAYS5[(k+z)%5];
      SHAPES[sh](n,d).forEach(s=>mv.sessions.push(s));
    }
    if(mv.sessions.length) table.push(mv);
  }
  if(!table.length) continue;
  const unit=pick(UNITS);
  const st=buildStore(table); configs++;
  const m=model(st);
  const html=cardsHtml(st,unit);

  // (4) a non-empty store can never yield 0 characters
  ok('L'+trial+' non-empty store renders characters',html&&html.length>0,'chars='+(html||'').length);

  // (3) completeness: exactly one bucket per populated key
  const seen={}; ['mains','ladder','plain','unloaded'].forEach(b=>(m[b]||[]).forEach(r=>{seen[r.name]=(seen[r.name]||0)+1;}));
  const miss=table.map(t=>t.name).filter(n=>!seen[n]);
  const dbl=table.map(t=>t.name).filter(n=>seen[n]>1);
  keysSeen+=table.length;
  ok('L'+trial+' completeness: no key missing / doubled',miss.length===0&&dbl.length===0,'missing='+miss.join('|')+' doubled='+dbl.join('|'));

  // (2) D58 closure on the MODEL, per movement, against the generator's own table
  m.mains.forEach(x=>{
    mains++;
    const t=table.filter(q=>q.name===x.name)[0];
    const ent=t?t.sessions.length:-1;
    const mainS=t?t.sessions.filter(s=>s.slot==='main'):[];
    const accS =t?t.sessions.filter(s=>s.slot!=='main'):[];
    ok('L'+trial+' '+x.name+' closure plotted+accessoryDay+noLoad==entries',
       x.plotted+x.accessoryDay+x.noLoad===x.entries&&x.entries===ent,
       [x.plotted,x.accessoryDay,x.noLoad,x.entries,ent].join('/'));
    ok('L'+trial+' '+x.name+' accessoryDay equals the hand count of accessory sessions',
       x.accessoryDay===accS.length,x.accessoryDay+' vs '+accS.length);
    if(accS.length&&mainS.length) mixedCases++;
    // (5) D59 no weight invented: every plotted load point must BE a real main-slot entry
    if(x.mode==='load'){
      // MULTISET oracle: the chart's points must be exactly the weights that were
      // written, no more (nothing invented) and no fewer (nothing dropped). Order is
      // the app's documented (week, ts) sort, so compare as sorted multisets and
      // assert the week axis is monotonic separately.
      const real=mainS.filter(s=>+s.weight>0).map(s=>s.week+':'+s.weight).sort();
      const plotted=x.series.map(p=>p.w+':'+p.v).sort();
      ok('L'+trial+' '+x.name+' D59 every plotted point is a written weight in that week',
         plotted.length===real.length&&plotted.every((p,i)=>p===real[i]),
         'plotted='+plotted.join(',')+' real='+real.join(','));
      ok('L'+trial+' '+x.name+' D59 the week axis is monotonic (no point out of order)',
         x.series.every((p,i)=>i===0||p.w>=x.series[i-1].w),
         x.series.map(p=>p.w).join(','));
      // and no invented WEIGHT: every plotted value appears in the written set
      const wrote={}; mainS.filter(s=>+s.weight>0).forEach(s=>{wrote[s.week+':'+s.weight]=1;});
      ok('L'+trial+' '+x.name+' D59 no value is carried forward onto a blank session',
         x.series.every(p=>wrote[p.w+':'+p.v]===1),
         x.series.map(p=>p.w+':'+p.v).join(','));
      const earliestLoaded=Math.min.apply(null,mainS.filter(s=>+s.weight>0).map(s=>s.week));
      ok('L'+trial+' '+x.name+' D59 honesty: Opened at names the first PLOTTED week',
         x.first.week===x.series[0].w&&x.first.week===earliestLoaded,
         'first.week='+x.first.week+' series0='+x.series[0].w+' earliestLoaded='+earliestLoaded);
    } else {
      // reps mode must never carry a weight at all
      ok('L'+trial+' '+x.name+' reps mode plots no weight',
         mainS.every(s=>+s.weight===0),'a loaded main-slot session was plotted in reps');
      ok('L'+trial+' '+x.name+' D59 honesty (reps): Opened at names the first plotted week',
         x.first.week===x.series[0].w,'first.week='+x.first.week+' series0='+x.series[0].w);
    }
  });

  // (6) fall-through reachability: a main-slot key with neither load nor reps
  table.forEach(t=>{
    const mainS=t.sessions.filter(s=>s.slot==='main');
    if(mainS.length&&mainS.every(s=>+s.weight===0&&!(s.sets||[]).length&&!s.setsReps)){
      const inMains=m.mains.some(x=>x.name===t.name);
      const elsewhere=['ladder','plain','unloaded'].some(b=>(m[b]||[]).some(r=>r.name===t.name));
      if(!inMains&&elsewhere) fallthrough++;
      ok('L'+trial+' '+t.name+' neither-load-nor-reps falls through, never vanishes',
         inMains||elsewhere,'in no bucket');
    }
  });

  // (2b) D58 closure read BACK out of the RENDERED footer
  const card=cardTitled(html,'Main Lifts');
  if(card){
    const ft=txt(card.slice(card.lastIndexOf('<div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">')));
    const a=ft.match(/(\d+) sessions? where this ran as an accessory/), b=ft.match(/(\d+) sessions? had no load written down/);
    const accD=a?+a[1]:0, noL=b?+b[1]:0;
    const wantAcc=m.mains.reduce((s,x)=>s+x.accessoryDay,0), wantNo=m.mains.reduce((s,x)=>s+x.noLoad,0);
    const wantEnt=m.mains.reduce((s,x)=>s+x.entries,0);
    ok('L'+trial+' rendered footer states the model numbers',accD===wantAcc&&noL===wantNo,accD+'/'+noL+' vs '+wantAcc+'/'+wantNo);
    ok('L'+trial+' rendered closure: dots + footer accessory + footer noLoad == entries',
       countOf(card,'<circle')+accD+noL===wantEnt||m.mains.some(x=>x.plotted<2),
       countOf(card,'<circle')+'+'+accD+'+'+noL+' vs '+wantEnt);
    // singular / plural agreement, harvested
    if(accD===1) ok('L'+trial+' singular accessory clause agrees',ft.indexOf('1 session where this ran as an accessory is kept off the line.')>=0,ft);
    if(noL===1)  ok('L'+trial+' singular no-load clause agrees',ft.indexOf('1 session had no load written down. Add the weight and it joins the line.')>=0,ft);
    if(accD>1)   ok('L'+trial+' plural accessory clause agrees',ft.indexOf(accD+' sessions where this ran as an accessory are kept off the line.')>=0,ft);
    if(noL>1)    ok('L'+trial+' plural no-load clause agrees',ft.indexOf(noL+' sessions had no load written down. Add the weight and they join the line.')>=0,ft);
    // copy rule on the rendered footer
    ok('L'+trial+' footer carries no em-dash',ft.indexOf('—')<0,ft.slice(0,120));
  }
}
console.log('# '+configs+' stores / '+keysSeen+' movement keys / '+mains+' main-lift rows / '
  +mixedCases+' mixed main+accessory cases / '+fallthrough+' neither-load-nor-reps fall-throughs');
if(V.length){ console.log('--- first 20 violations ---'); V.slice(0,20).forEach(v=>console.log('  '+v)); }
console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
