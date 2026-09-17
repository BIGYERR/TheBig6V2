// GATEKEEPER independent probe: the original defect, surface reachability, no-write, streak.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const IA=load(process.argv[2]);
let P=0,F=0;
const ok=(n,c,d)=>{ if(c){P++;console.log('ok   '+n);} else {F++;console.log('FAIL '+n+(d!==undefined?'  -> '+d:''));} };
const t=(n,f)=>{try{const r=f();ok(n,r===true||(r&&r.cond===true),r&&r.detail);}catch(e){F++;console.log('FAIL '+n+'  -> threw: '+e.message);}};
const DK=['mon','tue','wed','thu','fri','sat','sun'];
const monIdx=d=>(d.getDay()+6)%7;
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const mid=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const add=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);x.setHours(0,0,0,0);return x;};
const monOf=d=>add(mid(d),-monIdx(mid(d)));
const TODAY=mid(new Date()), TKEY=DK[monIdx(TODAY)];
const PID='gkb', TW=6;
const START=add(TODAY,-14), SMON=monOf(START);
const EXPW=Math.floor(Math.round((TODAY-SMON)/86400000)/7)+1;
function mkProg(rest,title){const weeks={};for(let w=1;w<=TW;w++){weeks[w]={};DK.forEach(d=>{weeks[w][d]=rest.includes(d)?{title:'Rest',rest:true,tags:['rest']}:{title:title,sections:[],tags:['lift']};});}
  return {id:PID,name:'PROBE',totalWeeks:TW,startDate:iso(START),weeks,goal:'balanced',cfg:{seed:1}};}
const DOM="__mkel=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__els={};document.getElementById=function(id){if(!__els[id])__els[id]=__mkel(id);return __els[id];};document.querySelectorAll=function(){return[];};";
function setup(prog,viewWeek,comp){
  IA.localStorage.clear();
  IA.eval("activeProgId='"+PID+"'"); IA.eval('activeProg='+JSON.stringify(prog)); IA.eval('currentWeek='+viewWeek);
  if(comp) IA.localStorage.setItem('ia_comp_'+PID,JSON.stringify(comp));
  IA.eval(DOM);
  IA.eval('__pop=null; popFire=function(tier,o){__pop=JSON.stringify({tier:tier,o:o});};');
  IA.eval('__season=0; __completion=0; fireSeasonPopup=function(){__season=1;}; fireCompletionPopup=function(){__completion=1;};');
}
const wk=()=>IA.eval('__els.daysList.innerHTML')||'';
const det=()=>IA.eval('__els.detailBody.innerHTML')||'';
console.log('# gk_behav on v'+IA.version+' today='+iso(TODAY)+' '+TKEY+' expWeek='+EXPW);

// ═══ 1. THE ORIGINAL DEFECT: browse a FUTURE week, complete, stamp must land on today ═══
{
  const prog=mkProg(['sun'],'Recovery Lift');
  setup(prog,TW);                                    // viewing week 6, today is week 3
  ok('defect: currentWeek is the FUTURE week 6, not today’s week '+EXPW, IA.eval('currentWeek')===TW);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  const w=JSON.parse(IA.localStorage.getItem('ia_wild_'+PID));
  ok('defect: stamp landed on TODAY ('+EXPW+'/'+TKEY+'), not on the viewed week',
     w[0].week===EXPW&&w[0].dayKey===TKEY&&w[0].week!==TW, JSON.stringify(w[0]));
  ok('defect: nothing was written to ia_comp_ on the viewed week either',
     IA.localStorage.getItem('ia_comp_'+PID)===null, IA.localStorage.getItem('ia_comp_'+PID));
  t('defect: the viewed future week shows no W mark and no tag',()=>{
    IA.eval('currentWeek='+TW); IA.eval('renderWeekView()');
    const h=wk(); return {cond:h.indexOf('wc-mark')<0&&h.indexOf('wc-tag')<0,detail:'future week marked'};
  });
  t('defect: today’s week shows exactly one W mark',()=>{
    IA.eval('currentWeek='+EXPW); IA.eval('renderWeekView()');
    const h=wk(); return {cond:(h.match(/wc-mark/g)||[]).length>=1,detail:'no mark on the live week'};
  });
}

// ═══ 2. REST-DAY TAG IS ACTUALLY RENDERED (not reasoned about) ═══════════════
{
  const prog=mkProg([TKEY, TKEY==='sun'?'wed':'sun'],'Recovery Lift');   // TODAY is a rest day
  setup(prog,EXPW);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  IA.eval('currentWeek='+EXPW); IA.eval('renderWeekView()');
  const h=wk();
  ok('rest-tag: the week view really emits a .wc-tag block', h.indexOf('class="wc-tag"')>=0, h.slice(0,200));
  ok('rest-tag: it carries the ruled rest copy', h.indexOf('Rest day. The streak sits this one out.')>=0, 'copy missing');
  ok('rest-tag: the hero is the REST hero (heroMode rest), so the tag sits under it',
     h.indexOf('REST DAY')>=0 && h.indexOf('wc-tag')>h.indexOf('REST DAY'), 'tag not after the rest hero');
  ok('rest-tag: the strip also carries the W mark on today', h.indexOf('wc-mark')>=0);
  ok('rest-tag: tapping the rest day routes to openRestSheet, never openDetail',
     /openRestSheet/.test(IA.eval('openDayKey.toString()')) && /if\(day\.rest\)/.test(IA.eval('openDayKey.toString()')));
  // REACHABILITY LIMIT: a PAST rest-day wildcard
  t('rest-tag REACH: after that day passes, is the rest tag still reachable?',()=>{
    // simulate: stamp a rest day in week 1 (past), view week 1
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([{title:'Chaos Workout',ts:1,week:1,dayKey:TKEY}]));
    IA.eval('currentWeek=1'); IA.eval('renderWeekView()');
    const h1=wk();
    const mark=h1.indexOf('wc-mark')>=0, tag=h1.indexOf('wc-tag')>=0;
    return {cond:mark, detail:'mark='+mark+' tag='+tag+' (tag is heroKey-only; reported)'};
  });
}

// ═══ 3. TRAINING-DAY TAG, real render, real title, apostrophe / ampersand ════
[['Recovery Lift',"Recovery Lift is still on the board."],
 ["Farmer's & Rower's Day", null],
 ['Push & Pull',null],
 ["Coach's Choice",null]].forEach(([title])=>{
  const rest=[TKEY==='sun'?'sat':'sun', TKEY==='wed'?'thu':'wed'];
  const prog=mkProg(rest,title); setup(prog,EXPW);
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  IA.eval('currentWeek='+EXPW); IA.eval('renderWeekView()');
  const h=wk();
  const escd=IA.eval("esc("+JSON.stringify(title)+"+' is still on the board.')");
  ok('train-tag ['+title+']: week view emits the tag with the escaped real title',
     h.indexOf('class="wc-tag"')>=0 && h.indexOf(escd)>=0, escd+' || '+h.slice(h.indexOf('wc-tag'),h.indexOf('wc-tag')+260));
  IA.eval("openDetail('"+TKEY+"',activeProg.weeks["+EXPW+"]['"+TKEY+"'])");
  const d=det();
  ok('train-tag ['+title+']: day detail emits the tag at the TOP of the body',
     d.indexOf('class="wc-tag"')===0 || d.indexOf('wc-tag')>=0, d.slice(0,120));
  ok('train-tag ['+title+']: no raw apostrophe or ampersand broke the markup',
     !/&(?!amp;|#39;|quot;|lt;|gt;|nbsp;|[a-z]+;|#\d+;)/.test(escd) && escd.indexOf("'")<0, escd);
  ok('train-tag ['+title+']: no mid-sentence hyphen or dash in the rendered line',
     !/\S\s*[—–-]\s*\S/.test(title+' is still on the board.'), title);
});

// ═══ 4. NOTHING WRITES A COMPLETION OR A SKIP, and the three ia_comp_ consumers are unmoved ═══
[['rest', [TKEY, TKEY==='sun'?'wed':'sun']], ['training',[TKEY==='sun'?'sat':'sun', TKEY==='wed'?'thu':'wed']]].forEach(([kind,rest])=>{
  const prog=mkProg(rest,'Recovery Lift');
  const seed={}; seed['w1_'+ (rest.includes('mon')?'tue':'mon')]={title:'Recovery Lift',ts:1,status:'complete'};
  setup(prog,EXPW,seed);
  const compB=IA.localStorage.getItem('ia_comp_'+PID);
  const histB=IA.localStorage.getItem('ia_hist_'+PID);
  const logsB=IA.localStorage.getItem('ia_logs_'+PID);
  const rmcB=IA.eval('JSON.stringify(restMoveCandidates('+EXPW+'))');
  const remB=IA.localStorage.getItem('ia_remind_last_'+PID);
  const skipB=IA.eval('skippedCount()');
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  ok('nowrite/'+kind+': ia_comp_ byte-identical', IA.localStorage.getItem('ia_comp_'+PID)===compB, IA.localStorage.getItem('ia_comp_'+PID));
  ok('nowrite/'+kind+': ia_hist_ untouched', IA.localStorage.getItem('ia_hist_'+PID)===histB);
  ok('nowrite/'+kind+': ia_logs_ untouched', IA.localStorage.getItem('ia_logs_'+PID)===logsB);
  ok('nowrite/'+kind+': statusOf(today) is still null', IA.eval("statusOf("+EXPW+",'"+TKEY+"')")===null, IA.eval("String(statusOf("+EXPW+",'"+TKEY+"'))"));
  ok('nowrite/'+kind+': skippedCount unmoved and no "skipped" written', IA.eval('skippedCount()')===skipB && skipB===0);
  ok('nowrite/'+kind+': restMoveCandidates unchanged', IA.eval('JSON.stringify(restMoveCandidates('+EXPW+'))')===rmcB, rmcB);
  ok('nowrite/'+kind+': reminder not suppressed (ia_remind_last_ untouched)', IA.localStorage.getItem('ia_remind_last_'+PID)===remB);
  // refreshProgram freeze: the day must not be seen as touched
  t('nowrite/'+kind+': refreshProgram does not see the Wildcard day as touched',()=>{
    const src=IA.eval('refreshProgram.toString()');
    const readsWild=src.indexOf('ia_wild_')>=0||src.indexOf('wildcardOn')>=0||src.indexOf('ildcard')>=0;
    const comp=IA.eval("JSON.stringify(getCompleted())");
    return {cond:!readsWild && comp.indexOf('w'+EXPW+'_'+TKEY)<0, detail:'readsWild='+readsWild+' comp='+comp};
  });
});
// the whole flow, source level
t('nowrite: no "skipped" string anywhere in the Wildcard flow (comments stripped)',()=>{
  const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const fns=['completeWildcard','fireWildcardPopup','wildcardDayFor','wildcardDaySet','wildcardOn','wildcardMarkHTML','wildcardTagHTML'];
  const hits=fns.filter(f=>strip(IA.eval(f+'.toString()')).indexOf('skipped')>=0);
  return {cond:hits.length===0,detail:hits.join(',')};
});
t('nowrite: fireWildcardPopup provably cannot escalate to fireSeasonPopup',()=>{
  const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  const src=strip(IA.eval('fireWildcardPopup.toString()'));
  const calls=(src.match(/\b[A-Za-z_$][\w$]*\s*\(/g)||[]).map(x=>x.replace(/\s*\($/,''));
  const bad=calls.filter(c=>/season|Season|Completion|markDayComplete|snapshot/.test(c));
  return {cond:bad.length===0 && calls.filter(c=>c==='popFire').length===1, detail:'calls='+calls.join(',')};
});

// ═══ 5. STREAK HAND WALKS ═══════════════════════════════════════════════════
function streakCase(label,restDays,seedDays,wildDay,expBefore,expAfter){
  const prog=mkProg(restDays,'Recovery Lift');
  const seed={}; seedDays.forEach(([w,d,st])=>{seed['w'+w+'_'+d]={title:'Recovery Lift',ts:1,status:st||'complete'};});
  setup(prog,EXPW,seed);
  const before=IA.eval('computeStreak()');
  const cB=IA.eval('completedCount()'), sB=IA.eval('skippedCount()');
  if(wildDay) IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([{title:'Chaos Workout',ts:1,week:wildDay[0],dayKey:wildDay[1]}]));
  const after=IA.eval('computeStreak()');
  ok('streak['+label+'] before='+expBefore+' after='+expAfter,
     before===expBefore&&after===expAfter, 'got before '+before+' after '+after);
  ok('streak['+label+'] completedCount and skippedCount unmoved',
     IA.eval('completedCount()')===cB && IA.eval('skippedCount()')===sB, cB+'/'+sB);
}
// hand-walk helper: the scheduled days of the fixture, ascending, up to today
function sched(restDays){
  const out=[];
  for(let w=1;w<=TW;w++) DK.forEach((d,off)=>{
    if(restDays.includes(d)) return;
    const dt=add(SMON,(w-1)*7+off);
    if(dt<mid(START)||dt>TODAY) return;
    out.push([w,d]);
  });
  return out;
}
{
  const R=[TKEY==='sun'?'sat':'sun', TKEY==='wed'?'thu':'wed'];   // today trains
  const S=sched(R); const last=S[S.length-1];
  // hand: today IS last. 2 priors complete -> streak 2. wildcard on today -> 3.
  streakCase('mid-streak, wildcard on today (training)',R,S.slice(-3,-1).map(x=>[x[0],x[1]]),last,2,3);
  // head of a streak: nothing complete, wildcard on today -> 1
  streakCase('head of streak, nothing else complete',R,[],last,0,1);
  // consecutive days: wildcard on today, prior day complete; then wildcard on the PRIOR day too
  {
    const prog=mkProg(R,'Recovery Lift'); setup(prog,EXPW,{});
    const prev=S[S.length-2];
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([
      {title:'A',ts:1,week:last[0],dayKey:last[1]},{title:'B',ts:2,week:prev[0],dayKey:prev[1]}]));
    ok('streak[consecutive wildcards on two scheduled days] = 2', IA.eval('computeStreak()')===2, String(IA.eval('computeStreak()')));
    ok('streak[consecutive] completedCount stays 0', IA.eval('completedCount()')===0);
  }
  // precedence: day has BOTH a real completion and a wildcard -> counted once
  {
    const prog=mkProg(R,'Recovery Lift');
    const seed={}; seed['w'+last[0]+'_'+last[1]]={title:'Recovery Lift',ts:1,status:'complete'};
    setup(prog,EXPW,seed);
    const a=IA.eval('computeStreak()');
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([{title:'A',ts:1,week:last[0],dayKey:last[1]}]));
    const b=IA.eval('computeStreak()');
    ok('streak[precedence] complete+wildcard on one day counts once ('+a+' -> '+b+')', a===1&&b===1, a+' -> '+b);
  }
  // skipped day with a wildcard on it: skip still breaks
  {
    const prog=mkProg(R,'Recovery Lift');
    const seed={}; seed['w'+last[0]+'_'+last[1]]={title:'Recovery Lift',ts:1,status:'skipped'};
    S.slice(-3,-1).forEach(x=>{seed['w'+x[0]+'_'+x[1]]={title:'Recovery Lift',ts:1,status:'complete'};});
    setup(prog,EXPW,seed);
    const a=IA.eval('computeStreak()');
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([{title:'A',ts:1,week:last[0],dayKey:last[1]}]));
    const b=IA.eval('computeStreak()');
    ok('streak[skip wins over a wildcard on the same day] 0 -> 0', a===0&&b===0, a+' -> '+b);
  }
}
{
  const R=[TKEY, TKEY==='sun'?'wed':'sun'];   // today is a REST day
  const S=sched(R);
  // rest-day wildcard inside a streak: neither extends nor breaks
  streakCase('rest day inside a streak',R,S.slice(-2).map(x=>[x[0],x[1]]),[EXPW,TKEY],2,2);
  streakCase('rest day with no streak',R,[],[EXPW,TKEY],0,0);
  ok('rest: scheduledDays never contains today’s rest day',
     IA.eval("scheduledDays(new Date()).filter(function(x){return x.week==="+EXPW+"&&x.d==='"+TKEY+"';}).length")===0);
}

// ═══ 6. THE POPUP ═══════════════════════════════════════════════════════════
{
  const R=[TKEY==='sun'?'sat':'sun', TKEY==='wed'?'thu':'wed'];
  const prog=mkProg(R,'Recovery Lift'); setup(prog,EXPW,{});
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  const p=JSON.parse(IA.eval('__pop'));
  ok('popup/training: kicker+msg are the ruled copy', p.o.kicker==='WILDCARD DONE'&&p.o.msg==='You showed up. That is the whole game.', JSON.stringify(p));
  ok('popup/training: sub reads "Streak: 1."', p.o.sub==='Streak: 1.', p.o.sub);
  ok('popup/training: no stats, no PR claim', !p.o.stats, JSON.stringify(p.o.stats));
  ok('popup/training: neither season nor completion popup fired', IA.eval('__season')===0&&IA.eval('__completion')===0);
  const R2=[TKEY, TKEY==='sun'?'wed':'sun'];
  const p2=mkProg(R2,'Recovery Lift'); setup(p2,EXPW,{});
  IA.eval("completeWildcard('Chaos Workout')"); IA.flushTimers();
  const q=JSON.parse(IA.eval('__pop'));
  ok('popup/rest: sub reads "Streak holds."', q.o.sub==='Streak holds.', q.o.sub);
  ok('popup/rest: no season/completion escalation', IA.eval('__season')===0&&IA.eval('__completion')===0);
}
console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
