
// Did removing the `goal` / `labels` locals change ANY behaviour of the filter bar or the
// Wildcard surface, on ANY goal value? Compared V194 vs V195, end to end, both filters.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const A=load(process.argv[3]), B=load(process.argv[2]);
const DOM="__mk=function(id){return {id:id,tagName:'DIV',textContent:'',innerHTML:'',value:'',style:{},dataset:{},children:[],classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__els={};document.getElementById=function(id){if(!__els[id])__els[id]=__mk(id);return __els[id];};document.createElement=function(t){return __mk('new');};document.querySelectorAll=function(){return[];};";
const GOALS=['strength','hypertrophy','fatloss','athletic','balanced','endurance','support_strength','support_prevention','support_athletic',undefined,null,'','nonsense'];
let P=0,F=0,rows=[];
GOALS.forEach(g=>{
  ['mine','all'].forEach(f=>{
    const out=[A,B].map(IA=>{
      IA.localStorage.clear(); IA.eval(DOM);
      IA.eval("activeProgId='fb'");
      IA.eval('activeProg='+JSON.stringify({id:'fb',name:'FB',goal:(g===undefined?null:g),totalWeeks:1,weeks:{1:{mon:{title:'S',sections:[]},tue:{title:'S',sections:[]},wed:{title:'R',rest:true},thu:{title:'S',sections:[]},fri:{title:'S',sections:[]},sat:{title:'S',sections:[]},sun:{title:'R',rest:true}}},cfg:{seed:1}}));
      if(g===undefined) IA.eval('delete activeProg.goal;');
      IA.eval("randFilter='"+f+"';");
      IA.eval('buildRandFilterBar();');
      const bar=IA.eval('__els.randFilterBar.innerHTML');
      const pool=IA.eval('getActivePool().map(function(w){return w.title;}).join("~")');
      IA.eval('updateRandCounter();');
      const cnt=IA.eval('__els.randCounter.textContent');
      // exercise the whole surface: 40 rerolls, capture every title drawn
      IA.eval('__s=12345; Math.random=function(){__s=(__s*1103515245+12345)&2147483647; return __s/2147483648;};');
      IA.eval('lastRandIdx=-1;'); const drawn=[];
      for(let i=0;i<40;i++){ IA.eval('reroll()'); drawn.push(IA.eval('__els.randBody.innerHTML').match(/class="rand-title">([^<]*)</)[1]); }
      // complete one and re-read the surface
      IA.eval("completeWildcard('"+drawn[0].replace(/'/g,"\\'")+"')");
      const store=IA.localStorage.getItem('ia_wild_fb');
      IA.eval('updateRandCounter();');
      return {bar:bar,pool:pool,cnt:cnt,drawnSet:[...new Set(drawn)].sort().join('~'),cnt2:IA.eval('__els.randCounter.textContent'),
              storeTitles:JSON.parse(store).map(x=>x.title).join('~')};
    });
    const [a,b]=out;
    const barSame=a.bar===b.bar;
    const poolSame=a.pool===b.pool;
    const rest=a.cnt===b.cnt&&a.drawnSet===b.drawnSet&&a.cnt2===b.cnt2&&a.storeTitles===b.storeTitles;
    if(poolSame&&rest){P++;} else {F++;console.log('FAIL goal='+g+' filter='+f+' pool='+poolSame+' rest='+rest);}
    if(f==='mine') rows.push([String(g),(a.bar.match(/>([^<]*)<\/button>/)||[])[1],(b.bar.match(/>([^<]*)<\/button>/)||[])[1],a.pool.split('~')[0]]);
  });
});
console.log('# the label change, per goal (V194 label -> V195 label | first title of the pool ACTUALLY drawn):');
rows.forEach(r=>console.log('   '+String(r[0]).padEnd(20)+String(r[1]).padEnd(26)+'-> '+String(r[2]).padEnd(10)+' | pool head: '+r[3]));
console.log('# pool, draw set, counter, store: identical V194 vs V195 on '+P+'/'+(P+F)+' (goal x filter) cells');
console.log('PASS '+P+' FAIL '+F);
process.exit(F?1:0);
