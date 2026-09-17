// Reachability census of the two tag variants and the W mark across every surface.
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const IA=load(process.argv[2]);
const DK=['mon','tue','wed','thu','fri','sat','sun'];
const monIdx=d=>(d.getDay()+6)%7;
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const mid=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x;};
const add=(d,n)=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);x.setHours(0,0,0,0);return x;};
const monOf=d=>add(mid(d),-monIdx(mid(d)));
const TODAY=mid(new Date()),TKEY=DK[monIdx(TODAY)];
const PID='gkr',TW=6,START=add(TODAY,-14),SMON=monOf(START);
const EXPW=Math.floor(Math.round((TODAY-SMON)/86400000)/7)+1;
const DOM="__mkel=function(id){return {id:id,textContent:'',innerHTML:'',value:'',style:{},dataset:{},classList:{add:function(){},remove:function(){},toggle:function(){},contains:function(){return false;}},setAttribute:function(){},getAttribute:function(){return null;},removeAttribute:function(){},hasAttribute:function(){return false;},appendChild:function(c){return c;},removeChild:function(c){return c;},insertBefore:function(c){return c;},remove:function(){},replaceChildren:function(){},scrollTo:function(){},scrollIntoView:function(){},focus:function(){},blur:function(){},click:function(){},addEventListener:function(){},removeEventListener:function(){},querySelector:function(){return null;},querySelectorAll:function(){return[];},closest:function(){return null;},getBoundingClientRect:function(){return {top:0,left:0,right:0,bottom:0,width:0,height:0};},offsetWidth:0,offsetHeight:0,scrollTop:0,scrollHeight:0,clientHeight:0};};__els={};document.getElementById=function(id){if(!__els[id])__els[id]=__mkel(id);return __els[id];};document.querySelectorAll=function(){return[];};";
function mkProg(rest){const weeks={};for(let w=1;w<=TW;w++){weeks[w]={};DK.forEach(d=>{weeks[w][d]=rest.includes(d)?{title:'Rest',rest:true,tags:['rest']}:{title:'Session '+d,sections:[],tags:['lift']};});}
 return {id:PID,name:'R',totalWeeks:TW,startDate:iso(START),weeks,goal:'balanced',cfg:{seed:1}};}
function rowsFor(restDays,label){
  const prog=mkProg(restDays);
  IA.localStorage.clear(); IA.eval("activeProgId='"+PID+"'"); IA.eval('activeProg='+JSON.stringify(prog)); IA.eval(DOM);
  IA.eval('popFire=function(){};');
  const out=[];
  for(let w=1;w<=TW;w++) DK.forEach(d=>{
    const isRest=restDays.includes(d);
    IA.localStorage.setItem('ia_wild_'+PID,JSON.stringify([{title:'X',ts:1,week:w,dayKey:d}]));
    IA.eval('currentWeek='+w); IA.eval('renderWeekView()');
    const h=IA.eval('__els.daysList.innerHTML')||'';
    const mark=h.indexOf('wc-mark')>=0, tag=h.indexOf('wc-tag')>=0;
    let det=false;
    if(!isRest){ IA.eval("openDetail('"+d+"',activeProg.weeks["+w+"]['"+d+"'])"); det=(IA.eval('__els.detailBody.innerHTML')||'').indexOf('wc-tag')>=0; }
    out.push({w,d,isRest,mark,tag,det});
  });
  const rest=out.filter(x=>x.isRest), train=out.filter(x=>!x.isRest);
  console.log(label);
  console.log('  W mark in strip:        rest '+rest.filter(x=>x.mark).length+'/'+rest.length+'   training '+train.filter(x=>x.mark).length+'/'+train.length);
  console.log('  tag in week view:       rest '+rest.filter(x=>x.tag).length+'/'+rest.length+'   training '+train.filter(x=>x.tag).length+'/'+train.length);
  console.log('  tag in day detail:      rest n/a (routes to openRestSheet)   training '+train.filter(x=>x.det).length+'/'+train.length);
  console.log('  rest days with NO surface at all: '+rest.filter(x=>!x.mark&&!x.tag).length+'/'+rest.length);
  console.log('  training days with NO surface at all: '+train.filter(x=>!x.mark&&!x.tag&&!x.det).length+'/'+train.length);
}
console.log('# reachability census, today='+iso(TODAY)+' '+TKEY+' liveWeek='+EXPW);
rowsFor([TKEY, TKEY==='sun'?'wed':'sun'], 'A) today IS a rest day');
rowsFor([TKEY==='sun'?'sat':'sun', TKEY==='wed'?'thu':'wed'], 'B) today is a training day');
