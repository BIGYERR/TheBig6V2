// gatekeeper V230 reproducer (read-only): an untouched "Burpees" main survives buildProgram under knee/ankle protect, but
// applyInjuryFilter run again over the same day (the boot re-filter in applySessionSwaps, reached when any card on that day
// was swapped) removes it, so boot != live. Pre-existing on the fixture presentation (cfg.injury); at V230 the lens carries it
// to the overlay presentation too (R3' equivalence row). usage: node v230_gk_burpees_bootdrop.js <V229.html> <V230.html>
'use strict';
const H=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const clone=x=>JSON.parse(JSON.stringify(x)); const START='2026-08-24';
const CFG={name:'M',primaryPath:'lift',cardioTypes:[],cardioGoals:{},eventTargeted:false,raceDate:null,liftingFocus:'balanced',experience:'intermediate',ageBracket:'18-35',equipment:'bodyweight',unit:'lbs',restDays:['sat','sun'],days:['sun','mon','tue','wed','thu','fri','sat'],bench:135,squat:155,deadlift:185,seed:76308};
const INJ={region:'ankle',tier:'protect'};
const HELP="globalThis.__T=[];showToast=function(m){__T.push(String(m));};openDetail=function(){};closeSwapSheet=function(){};renderWeekView=function(){};closeOverlaySheet=function(){};bumpSwapCount=function(){return false;};";
function fresh(f){ const X=H.load(f); const T=new Date(START+'T12:00:00').getTime(); const RD=Date; class FD extends RD{constructor(...a){if(a.length)super(...a);else super(T);} static now(){return T;}} X.ctx.Date=FD; X.eval(HELP); return X; }
const names=(X,w,d)=>JSON.parse(X.eval("JSON.stringify(activeProg.weeks["+w+"]."+d+".sections.map(function(s){return s.items.map(function(i){return i.name;}).join('+');}))"));
for(const [f,pres] of [[process.argv[2],'CFG'],[process.argv[3],'CFG'],[process.argv[2],'OV'],[process.argv[3],'OV']]){
  const X=fresh(f); const cfg=clone(CFG); if(pres==='CFG') cfg.injury=INJ; const s=clone(X.buildProgram(clone(cfg))); Object.assign(s,{id:'PM',name:'M',created:1,startDate:START,cfg:clone(cfg)});
  if(pres==='OV') s.overlays=[{id:'ov_fixed',type:'injury',from:START,to:null,patch:{injury:INJ},note:'',created:1}];
  X.ctx.__SP=s; X.eval("localStorage.clear();savePrograms([__SP]);activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
  const pre=names(X,4,'wed'); const it=JSON.parse(X.eval("JSON.stringify(activeProg.weeks[4].wed.sections[2].items[0])"));
  const refilt=JSON.parse(X.eval("JSON.stringify(applyInjuryFilter(JSON.parse(JSON.stringify(activeProg.weeks[4].wed.sections)),"+JSON.stringify({injury:INJ})+").map(function(s){return s.items.map(function(i){return i.name;}).join('+');}))"));
  X.eval("currentWeek=4;currentDayKey='wed';"); X.ctx.__c={secIdx:2,itemIdx:0,name:it.name,detail:it.detail}; X.eval("_swapCtx=__c;applySwapChoice('Wall sit');");
  const live=names(X,4,'wed'); const B=fresh(f); for(const [k,v] of X.localStorage._map) B.localStorage.setItem(k,v); B.eval("activeProgId='PM';activeProg=refreshProgram(getPrograms().find(function(x){return x.id==='PM';}));");
  const boot=names(B,4,'wed');
  console.log('ia-version '+X.version+' '+pres+' | built W4 wed: '+pre.join(' | ')+'\n   filter re-applied to the built day: '+refilt.join(' | ')+'\n   live after swapping '+it.name+' -> Wall sit: '+live.join(' | ')+'\n   boot: '+boot.join(' | ')+'\n   boot == live: '+(JSON.stringify(boot)===JSON.stringify(live)));
}
