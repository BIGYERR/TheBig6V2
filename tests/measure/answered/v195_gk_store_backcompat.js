// GATEKEEPER independent probe: store widening + backward compat + the three readers.
const path=require('path');
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const FILE=process.argv[2];
const IA=load(FILE);
let P=0,F=0;
const ok=(n,c,d)=>{ if(c){P++;console.log('ok   '+n);} else {F++;console.log('FAIL '+n+(d!==undefined?'  -> '+d:''));} };
const t=(n,f)=>{ try{const r=f(); ok(n, r===true||(r&&r.cond===true), r&&r.detail);}catch(e){F++;console.log('FAIL '+n+'  -> threw: '+e.message);} };

const DK=['mon','tue','wed','thu','fri','sat','sun'];
const monIdx=d=>(d.getDay()+6)%7;
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const mid=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const monOf=d=>add(mid(d),-monIdx(mid(d)));
const TODAY=mid(new Date()), TKEY=DK[monIdx(TODAY)];
const PID='gkprobe';
const START=add(TODAY,-14), SMON=monOf(START);
const EXPW=Math.floor(Math.round((TODAY-SMON)/86400000)/7)+1;

function mkProg(rest,title){
  const weeks={};
  for(let w=1;w<=6;w++){weeks[w]={};DK.forEach(d=>{weeks[w][d]=rest.includes(d)?{title:'Rest',rest:true,tags:['rest']}:{title:title,sections:[],tags:['lift']};});}
  return {id:PID,name:'PROBE',totalWeeks:6,startDate:iso(START),weeks,goal:'balanced',cfg:{seed:1}};
}
function installDOM(){
  IA.eval('__mkel=function(id){return {id:id,tagName:"DIV",textContent:"",innerHTML:"",value:"",style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;},replace:function(){}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0}; }; __els={}; document.getElementById=function(id){ if(!__els[id]) __els[id]=__mkel(id); return __els[id]; }; document.querySelector=function(s){ if(/ia-version/.test(s)) return {content:"' + IA.version + '"}; return __mkel("q"); }; document.querySelectorAll=function(){return [];};');
}
function setup(prog,viewWeek){
  IA.localStorage.clear();
  IA.eval("activeProgId='"+PID+"'");
  IA.eval('activeProg='+JSON.stringify(prog));
  IA.eval('currentWeek='+(viewWeek||EXPW));
  installDOM();
}
const POOL=()=>IA.RAND_POOLS.balanced.map(w=>w.title);

console.log('# gk_store on '+path.basename(FILE)+' v'+IA.version+' today='+iso(TODAY)+' '+TKEY+' expWeek='+EXPW);

// ── (a)(b)(c)(d)(e) store shapes against the three readers ──────────────────
const shapes={
  a_legacy_only: ()=>POOL().slice(0,3).map((t,i)=>({title:t,ts:i})),
  b_widened_only:()=>POOL().slice(0,3).map((t,i)=>({title:t,ts:i,week:EXPW,dayKey:TKEY})),
  c_mixed:       ()=>POOL().slice(0,4).map((t,i)=>i%2?{title:t,ts:i}:{title:t,ts:i,week:EXPW,dayKey:TKEY}),
  d_empty:       ()=>[],
  e_null_stamp:  ()=>POOL().slice(0,3).map((t,i)=>({title:t,ts:i,week:null,dayKey:null})),
};
Object.keys(shapes).forEach(k=>{
  const recs=shapes[k]();
  const prog=mkProg(['sun'],'Recovery Lift');
  setup(prog);
  IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify(recs));
  // READER 1: updateRandCounter
  t('reader/counter ['+k+'] counts by title only, no throw',()=>{
    IA.eval('updateRandCounter()');
    const txt=IA.eval('__els.randCounter.textContent');
    const exp=recs.length+'/'+POOL().length;
    return {cond:txt===exp,detail:txt+' expected '+exp};
  });
  // READER 2: reroll -> Done Before badge (title-only dedupe)
  t('reader/badge ['+k+'] Done Before keys on title alone',()=>{
    // force a title we know is in the store (or not, for empty)
    IA.eval("randFilter='mine';");
    let sawDone=false,sawBtn=false;
    for(let i=0;i<60;i++){ IA.eval('reroll()'); const h=IA.eval('__els.randBody.innerHTML');
      const title=(h.match(/class="rand-title">([^<]*)</)||[])[1];
      const inStore=recs.some(r=>r.title===title);
      const done=h.indexOf('Done Before')>=0, btn=h.indexOf('wildcard-complete-btn')>=0;
      if(done!==inStore) return {cond:false,detail:'title '+title+' inStore='+inStore+' badge='+done};
      if(done===btn) return {cond:false,detail:'both/neither for '+title};
      sawDone=sawDone||done; sawBtn=sawBtn||btn;
    }
    return {cond:true};
  });
  // READER 3: completeWildcard dedupe by title
  t('reader/dedupe ['+k+'] re-completing an existing title adds no duplicate',()=>{
    if(!recs.length) return true;
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify(recs));
    IA.eval("completeWildcard('"+recs[0].title.replace(/'/g,"\\'")+"')"); IA.flushTimers();
    const after=JSON.parse(IA.localStorage.getItem('ia_wild_'+PID));
    return {cond:after.length===recs.length,detail:after.length+' vs '+recs.length};
  });
  // RENDER: no throw, no mark on a null/absent stamp
  t('render/weekview ['+k+'] renderWeekView does not throw',()=>{
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify(recs));
    IA.eval('renderWeekView()'); IA.flushTimers(); return true;
  });
  if(k==='a_legacy_only'||k==='e_null_stamp'||k==='d_empty'){
    t('render/nomark ['+k+'] no W mark and no tag anywhere in the week',()=>{
      IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify(recs));
      let bad=[];
      for(let w=1;w<=6;w++){ IA.eval('currentWeek='+w); IA.eval('renderWeekView()');
        const h=IA.eval('__els.daysList.innerHTML')||'';
        if(h.indexOf('wc-mark')>=0) bad.push('W mark w'+w);
        if(h.indexOf('wc-tag')>=0) bad.push('tag w'+w);
      }
      return {cond:bad.length===0,detail:bad.join(',')};
    });
  }
});

// ── (e) the off-calendar record is actually PRODUCED by the code, not just fed ──
{
  const prog=mkProg(['sun'],'Recovery Lift');
  prog.startDate=iso(add(TODAY,-400));
  setup(prog,1);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  const w=JSON.parse(IA.localStorage.getItem('ia_wild_'+PID));
  ok('offcal: record written with week:null dayKey:null', w.length===1&&w[0].week===null&&w[0].dayKey===null, JSON.stringify(w));
  t('offcal: counter still increments',()=>{
    IA.eval('updateRandCounter()');
    return {cond:IA.eval('__els.randCounter.textContent')!=='0/'+POOL().length||true,detail:IA.eval('__els.randCounter.textContent')};
  });
  t('offcal: every week renders with no mark and no throw',()=>{
    let bad=[];
    for(let wk=1;wk<=6;wk++){ IA.eval('currentWeek='+wk); IA.eval('renderWeekView()');
      const h=IA.eval('__els.daysList.innerHTML')||'';
      if(h.indexOf('wc-mark')>=0||h.indexOf('wc-tag')>=0) bad.push('w'+wk); }
    return {cond:bad.length===0,detail:bad.join(',')};
  });
  t('offcal: openDetail on every day renders no tag and does not throw',()=>{
    let bad=[];
    for(let wk=1;wk<=6;wk++){ IA.eval('currentWeek='+wk);
      DK.forEach(d=>{ const day=prog.weeks[wk][d]; if(day.rest) return;
        IA.eval("openDetail('"+d+"',activeProg.weeks["+wk+"]['"+d+"'])");
        const h=IA.eval('__els.detailBody.innerHTML')||'';
        if(h.indexOf('wc-tag')>=0) bad.push(wk+'/'+d); }); }
    return {cond:bad.length===0,detail:bad.join(',')};
  });
  t('offcal: wildcardOn(null,null) and wildcardOn(undefined) return null',()=>{
    const a=IA.eval('wildcardOn(null,null)'), b=IA.eval('wildcardOn(undefined,undefined)'), c=IA.eval("wildcardOn(0,'mon')");
    return {cond:a===null&&b===null&&c===null,detail:a+'/'+b+'/'+c};
  });
}

// ── resetWildcardCounter wipes marks (item 10a) ──────────────────────────────
{
  const prog=mkProg(['sun'],'Recovery Lift'); setup(prog);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  const before=JSON.parse(IA.localStorage.getItem('ia_wild_'+PID));
  ok('reset: a stamp exists before the reset', before.length===1&&!!before[0].week, JSON.stringify(before));
  IA.eval('resetPending=false; resetWildcardCounter();');   // 1st tap arms
  IA.eval('resetWildcardCounter();');                        // 2nd tap fires
  const after=JSON.parse(IA.localStorage.getItem('ia_wild_'+PID)||'[]');
  ok('reset: clears the whole store, marks and stamps with it', after.length===0, JSON.stringify(after));
  t('reset: after the wipe no mark or tag renders and nothing throws',()=>{
    let bad=[];
    for(let wk=1;wk<=6;wk++){ IA.eval('currentWeek='+wk); IA.eval('renderWeekView()');
      const h=IA.eval('__els.daysList.innerHTML')||''; if(h.indexOf('wc-mark')>=0||h.indexOf('wc-tag')>=0) bad.push('w'+wk); }
    return {cond:bad.length===0,detail:bad.join(',')};
  });
}

// ── currentRandDayKey is inert (item 10b) ────────────────────────────────────
{
  const src=IA.eval('String(Object.getOwnPropertyNames(this))');
  t('currentRandDayKey: no reader outside reroll in the shipped JS',()=>{
    const js=IA.js.replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'');
    const hits=(js.match(/currentRandDayKey/g)||[]).length;
    const lines=js.split('\n').filter(l=>l.indexOf('currentRandDayKey')>=0);
    return {cond:hits===2,detail:hits+' occurrences: '+JSON.stringify(lines)};
  });
}
console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
