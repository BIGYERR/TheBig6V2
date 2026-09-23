'use strict';
const path=require('path'); const H=require(path.join(__dirname,'..','harness.js'));
const [BF,CF]=process.argv.slice(2); const B=H.load(BF), C=H.load(CF);
const mins=d=>{const m=String(d||'').match(/^(\d+)\s*min steady\b/);return m?+m[1]:null;};
function ser(IA,cfg){ const p=IA.buildProgram(JSON.parse(JSON.stringify(cfg))); const o={}; const full={};
  Object.keys(p.weeks).forEach(w=>Object.keys(p.weeks[w]).forEach(d=>{const c=p.weeks[w][d].cardio;(c?(Array.isArray(c)?c:[c]):[]).forEach(z=>{ if(/^Steady Aerobic Run/.test(String(z.subtype||''))){(o[w]=o[w]||[]).push(mins(z.detail)); (full[w]=full[w]||[]).push(z);} else if(z.type==='run'||/run/i.test(z.subtype||'')){} });}));
  return {tw:p.totalWeeks,o,full,p}; }
const strip=z=>JSON.stringify(z,(k,v)=>(k==='detail'||k==='note'||k==='text')?undefined:v);
// L56 replica: print from lattice definitions
const T6=[null,15,15,16,16,17,17,18,18,19,19,20,20];
const BASEL=[null]; for(let x=0;x<=100;x++) BASEL.push(+(x/10).toFixed(1));
const TYPES=[['run'],['run','bike'],['run','swim'],['run','bike','swim']];
let n=0, reach=0, reachMulti=0, viol=0, changedCfg=0, outOfWindow=0, nonMinsChange=0; const ex=[]; const byTw={};
for(const types of TYPES) for(const evt of [true,false]) for(const exp of ['beginner','intermediate','advanced']) for(const age of ['18-35','36-54','55+']) for(const b of BASEL){
  const goals={run:{id:'run_base',label:'Build Running Base'}}; if(b!==null){goals.run.baselineDist=String(b);goals.run.baseline=b+'mi';}
  if(types.includes('bike')) goals.bike={id:'bike_base',label:'bike_base'}; if(types.includes('swim')) goals.swim={id:'swim_base',label:'swim_base'};
  const cfg=Object.assign({},H.fixtures.HALF_MANNY,{name:'RB',primaryPath:evt?'event':'fitness',cardioTypes:types,cardioGoals:goals,eventTargeted:evt,raceDate:evt?'2027-06-01':'',experience:exp,ageBracket:age,restDays:['sun','wed'],seed:76308});
  n++; const rb=ser(B,cfg), rc=ser(C,cfg);
  if(rb.tw!==rc.tw) { viol++; ex.push('tw moved '+rb.tw+'->'+rc.tw); continue; }
  let ch=false;
  const ws=new Set([...Object.keys(rb.o),...Object.keys(rc.o)]);
  for(const w of ws){ const a=(rb.o[w]||[]).join('/'), c=(rc.o[w]||[]).join('/'); if(a===c) continue; ch=true;
    if(!(+w>=13&&+w<=15&&rc.tw>=14)){ outOfWindow++; if(ex.length<8) ex.push(`OUT-OF-WINDOW ${types} evt=${evt} ${exp} ${age} b=${b} tw=${rc.tw} W${w} ${a}->${c}`); continue; }
    const cut=C.eval('isCardioCutbackWeek')(+w,rc.tw);
    // oracle: row 12 = 20; cutback 70% of 20 = 14 (Table 6 row 12 held, cutback clock on real week)
    const want = cut ? 14 : 20;
    (rc.o[w]||[]).forEach(v=>{ if(v!==want){ viol++; if(ex.length<8) ex.push(`ORACLE ${types} evt=${evt} ${exp} ${age} b=${b} tw=${rc.tw} W${w} cut=${cut} got ${v} want ${want} (base ${a})`);} });
    // non-minute fields of the steady card unchanged other than text
    (rc.full[w]||[]).forEach((z,i)=>{ const zb=(rb.full[w]||[])[i]; const sa=strip(zb).replace(/\b12\b|\b20\b|\b14\b|\b8\b/g,'#'), sc=strip(z).replace(/\b12\b|\b20\b|\b14\b|\b8\b/g,'#'); if(sa!==sc){ nonMinsChange++; if(ex.length<8) ex.push('NONMIN '+sa.slice(0,200)+' || '+sc.slice(0,200)); } });
  }
  // whole-program: other days identical except text-only
  if(ch){ changedCfg++; if(types.length===1) reach++; else reachMulti++; byTw[rc.tw]=(byTw[rc.tw]||0)+1; }
}
console.log(`D137 sweep: ${n} configs | changed ${changedCfg} (run-only ${reach}, multi ${reachMulti}) by tw ${JSON.stringify(byTw)} | oracle violations ${viol} | out-of-window steady changes ${outOfWindow} | non-minute field changes ${nonMinsChange}`);
ex.forEach(e=>console.log('  '+e));
// L56 look
