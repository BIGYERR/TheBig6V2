'use strict';
const path=require('path'); const H=require(path.join(__dirname,'..','harness.js'));
const [BF,CF]=process.argv.slice(2);
const mk=f=>{const IA=H.load(f); IA.eval('var __log={}; var __g=getCHI; getCHI=function(){var r=__g.apply(this,arguments); __log[arguments[0]]=r.reps===1?r.minPerRep:r.reps+"x"+r.minPerRep; return r;};'); return IA;};
const B=mk(BF), C=mk(CF);
const mins=d=>{const m=String(d||'').match(/^(\d+)\s*min steady\b/);return m?+m[1]:null;};
function ser(IA,cfg){ IA.eval('__log={}'); const p=IA.buildProgram(JSON.parse(JSON.stringify(cfg))); const o={};
  Object.keys(p.weeks).forEach(w=>Object.keys(p.weeks[w]).forEach(d=>{const c=p.weeks[w][d].cardio;(c?(Array.isArray(c)?c:[c]):[]).forEach(z=>{ if(/^Steady Aerobic Run/.test(String(z.subtype||''))) o[w]=mins(z.detail);});}));
  return {tw:p.totalWeeks,o,g:JSON.parse(JSON.stringify(IA.eval('__log')))}; }
const BASEL=[null]; for(let x=0;x<=100;x++) BASEL.push(+(x/10).toFixed(1));
let n=0,changed=0,rowOK=0,rowBad=0,directEq=0,scaled=0,scaledOK=0,bad=[]; const kinds={};
for(const evt of [true,false]) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','36-54','55+']) for(const b of BASEL){
  const goals={run:{id:'run_base',label:'B'}}; if(b!==null){goals.run.baselineDist=String(b);goals.run.baseline=b+'mi';}
  const cfg=Object.assign({},H.fixtures.HALF_MANNY,{name:'RB',primaryPath:evt?'event':'fitness',cardioTypes:['run'],cardioGoals:goals,eventTargeted:evt,raceDate:evt?'2027-06-01':'',experience:exp,ageBracket:age,restDays:['sun','wed'],seed:76308});
  n++; const rb=ser(B,cfg), rc=ser(C,cfg); let ch=false;
  for(const w of Object.keys(rc.o)){ if(rb.o[w]===rc.o[w]) continue; ch=true;
    const cut=C.eval('isCardioCutbackWeek')(+w,rc.tw); const want=cut?14:20;
    if(rc.g[w]===want) rowOK++; else {rowBad++; bad.push(`w${w} getCHI ${rc.g[w]} want ${want}`);}
    if(rc.o[w]===rc.g[w]) directEq++;
    else { scaled++; const f=v=>Math.ceil(0.6*v); const bg=typeof rb.g[w]==='string'?+rb.g[w].split('x')[1]:rb.g[w];
      const k=`evt=${evt} tw=${rc.tw} W${w}: base getCHI ${rb.g[w]} printed ${rb.o[w]} | cand getCHI ${rc.g[w]} printed ${rc.o[w]}`; kinds[k]=(kinds[k]||0)+1;
      if(rc.o[w]===f(rc.g[w]) && rb.o[w]===f(bg)) scaledOK++; else bad.push('SCALE '+k); } }
  if(ch) changed++;
}
console.log(`run-only run_base: ${n} configs, changed ${changed}; changed steady cards: getCHI row == ruled (20, cutback 14) ${rowOK}, not ${rowBad}; printed == getCHI ${directEq}; printed via unchanged downstream x0.6 ceil on both builds ${scaledOK}/${scaled}`);
Object.entries(kinds).forEach(([k,v])=>console.log('  '+v+'  '+k)); bad.slice(0,10).forEach(x=>console.log('  BAD '+x));
