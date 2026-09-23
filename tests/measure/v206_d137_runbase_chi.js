// V206 measure (Mode B) — D137: run_base Steady Aerobic (CHI limb) falls at week 13.
//   node tests/measure/v206_d137_runbase_chi.js <v205.html> <v204.html> <scratchdir>
// READ-ONLY on index.html. Two counterfactual copies are written to <scratchdir>:
//   CF_CALL : clamp at the getCHI CALL SITE's week argument (run_base only)
//   CF_READ : clamp inside getCHI's row reader `at` only (cutback clock keeps real week)
// ORACLE: Table 6 CHI-minutes rows 1-12, hand-copied from doctrine/nsw_ptg_sealswcc_11pg.txt
// (15 15 16 16 17 17 18 18 19 19 20 20), and the ruling's own hand series for 16 weeks.
// The magnitude is read from the CARD detail string ("N min steady at ..."), never from getCHI.
'use strict';
const fs=require('fs'), path=require('path');
const {load,fixtures}=require(path.join(__dirname,'..','harness.js'));
const [A205,A204,SCR]=process.argv.slice(2);
const P=(...a)=>console.log(...a);
const src=fs.readFileSync(A205,'utf8');
function surgery(s, edits){ for(const [a,b] of edits){ const n=s.split(a).length-1; if(n!==1) throw new Error('anchor count '+n+': '+a); s=s.replace(a,b);} return s; }
const CALL='let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);';
const cfCall=surgery(src,[[CALL,"let chi = getCHI(goalId === 'run_base' ? Math.min(week, 12) : week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);"]]);
const cfRead=surgery(src,[
  ['function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {','function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo, _rowCap) {'],
  ['const at = w => chiFromTable6(w);','const at = w => chiFromTable6(_rowCap ? Math.min(w, _rowCap) : w);'],
  [CALL,"let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo, goalId === 'run_base' ? 12 : 0);"]]);
fs.writeFileSync(path.join(SCR,'cf_call.html'),cfCall); fs.writeFileSync(path.join(SCR,'cf_read.html'),cfRead);
const IA={V205:load(A205),V204:load(A204),CF_CALL:load(path.join(SCR,'cf_call.html')),CF_READ:load(path.join(SCR,'cf_read.html'))};
for(const k in IA) P('artifact',k,'ia-version',IA[k].version);
const ART=Object.keys(IA);

function mkCfg(o){
  const g={id:'run_base',label:'Build Running Base'};
  if(o.b!==null){g.baselineDist=String(o.b);g.baseline=o.b+'mi';}
  const goals={run:g}; if(o.swim) goals.swim={id:o.swim,label:o.swim}; if(o.bike) goals.bike={id:o.bike,label:o.bike};
  return Object.assign({},fixtures.HALF_MANNY,{name:'RB',primaryPath:'fitness',cardioTypes:o.types,cardioGoals:goals,
    eventTargeted:o.evt,raceDate:o.evt?'2027-06-01':'',experience:o.exp,ageBracket:o.age,restDays:o.rest||['sun','wed'],seed:76308});
}
const minsOf=d=>{const m=String(d).match(/^(\d+)\s*min steady\b/);return m?+m[1]:null;};
function series(ia,cfg){
  const p=ia.buildProgram(cfg); const out={};
  Object.keys(p.weeks).forEach(wk=>Object.keys(p.weeks[wk]).forEach(d=>{
    const day=p.weeks[wk][d]; const cs=day&&day.cardio?(Array.isArray(day.cardio)?day.cardio:[day.cardio]):[];
    cs.forEach(c=>{ if(/^Steady Aerobic Run/.test(String(c.subtype||''))){ (out[+wk]=out[+wk]||[]).push(minsOf(c.detail)); }});
  }));
  return {tw:p.totalWeeks,s:out};
}
const T6=[null,15,15,16,16,17,17,18,18,19,19,20,20];
const RULING=[15,15,16,11,17,17,18,13,19,19,20,14,20,20,20,12];
const flat=r=>{const a=[];for(let w=1;w<=r.tw;w++)a.push(r.s[w]?r.s[w].join('/'):'-');return a;};

// ---- (2) 16-week series ----
P('\n### (2) 16-week run_base series, run-only');
const EXPS=['beginner','intermediate','advanced'], AGES=['18-35','36-54','55+'];
const BASE=[null]; for(let x=0;x<=100;x++) BASE.push(+(x/10).toFixed(1));
const shown={};
for(const evt of [true,false]) for(const exp of EXPS) for(const age of AGES) for(const b of BASE){
  if(shown[evt]) break;
  const cfg=mkCfg({types:['run'],b,evt,exp,age});
  const r=series(IA.V205,cfg); if(r.tw!==16) continue;
  shown[evt]=1;
  P(`cfg evt=${evt} exp=${exp} age=${age} baselineDist=${b} seed=76308 restDays=sun,wed`);
  for(const k of ART){ const q=series(IA[k],cfg); P(`  ${k.padEnd(8)} tw=${q.tw} : ${flat(q).join(' ')}`); }
  P(`  RULING   tw=16 : ${RULING.join(' ')}`);
  const cr=flat(series(IA.CF_READ,cfg)), cc=flat(series(IA.CF_CALL,cfg));
  P('  CF_READ == RULING: '+(cr.join(' ')===RULING.join(' '))+'   CF_CALL == RULING: '+(cc.join(' ')===RULING.join(' ')));
}
if(!shown[true]) P('  no evt=true 16-week config found'); if(!shown[false]) P('  no evt=false 16-week config found');

// ---- (3) reach ----
function sweep(name, cfgs){
  const t0=Date.now(); let n=0, crash=0, ge13=0, cardGe13=0, diffRead=0, diffCall=0, fall13=0, fallAny=0, v204climb=0, v204n=0;
  const twD={}, seg={}, callVsRead=[], examples=[];
  for(const [key,cfg] of cfgs){
    n++; let r5,rr,rc,r4;
    try{ r5=series(IA.V205,cfg); rr=series(IA.CF_READ,cfg); rc=series(IA.CF_CALL,cfg); r4=series(IA.V204,cfg);}catch(e){crash++; if(crash<4)P('  CRASH',key,e.message); continue;}
    twD[r5.tw]=(twD[r5.tw]||0)+1;
    const f5=flat(r5).join(' '), fr=flat(rr).join(' '), fc=flat(rc).join(' ');
    const has13=Object.keys(r5.s).some(w=>+w>=13);
    if(r5.tw>=13) ge13++; if(has13) cardGe13++;
    if(f5!==fr){ diffRead++; const sk=key.split('|')[0]; seg[sk]=(seg[sk]||0)+1; if(examples.length<2) examples.push(key+'\n     V205    '+f5+'\n     CF_READ '+fr); }
    if(f5!==fc) diffCall++;
    if(fr!==fc) callVsRead.push(key);
    // fall at the 12->13 boundary on V205 (first card each week)
    const g=w=>r5.s[w]?r5.s[w][0]:null;
    if(g(12)!=null&&g(13)!=null&&g(13)<g(12)) fall13++;
    // any non-cutback non-final week whose minutes are below the max of all earlier weeks, weeks>=13
    let pk=0, fl=false; for(let w=1;w<=r5.tw;w++){const v=g(w); if(v==null)continue; const cut=(r5.tw>=10&&w%4===0&&w!==r5.tw); if(w>=13&&!cut&&w<r5.tw&&v<pk) fl=true; if(!cut) pk=Math.max(pk,v);} if(fl) fallAny++;
    if(r4.s[12]&&r4.s[13]){ v204n++; if(r4.s[13][0]>=r4.s[12][0]) v204climb++; }
  }
  P(`\n### (3) ${name}: ${n} configs, ${crash} crashes, ${((Date.now()-t0)/1000).toFixed(0)}s`);
  P('  totalWeeks dist (V205): '+JSON.stringify(twD));
  P(`  tw>=13: ${ge13}/${n}   with a Steady card in week>=13: ${cardGe13}/${n}`);
  P(`  CF_READ moves the card series: ${diffRead}/${n}   CF_CALL moves it: ${diffCall}/${n}   CF_CALL != CF_READ: ${callVsRead.length}/${n}`);
  P(`  V205 W12->W13 fall: ${fall13}/${n}   V205 any build-week drop below prior peak at w>=13: ${fallAny}/${n}`);
  P(`  V204 W12->W13 non-decreasing: ${v204climb}/${v204n} configs having both weeks`);
  P('  CF_READ movers by segment: '+JSON.stringify(seg));
  examples.forEach(e=>P('  eg '+e));
  if(callVsRead.length){ const k=callVsRead[0]; const cfg=cfgs.find(c=>c[0]===k)[1]; P('  CF_CALL vs CF_READ first diverging config '+k); P('     CF_READ '+flat(series(IA.CF_READ,cfg)).join(' ')); P('     CF_CALL '+flat(series(IA.CF_CALL,cfg)).join(' ')); }
}
const L1=[]; for(const exp of EXPS) for(const age of AGES) for(const b of BASE) for(const evt of [true,false]) L1.push([`${exp}|${age}|${b}|${evt}`,mkCfg({types:['run'],b,evt,exp,age})]);
sweep('L1 run-only exp3 x age3 x baseline102 x evt2', L1);
const L2=[]; const SW=['swim_tri','swim_mile','swim_100_time','swim_500_time','swim_base'], BK=['bike_century','bike_50','bike_ftp','bike_cals','bike_base'];
const combos=[]; SW.forEach(s=>combos.push({types:['run','swim'],swim:s})); BK.forEach(k=>combos.push({types:['run','bike'],bike:k})); SW.forEach(s=>BK.forEach(k=>combos.push({types:['run','swim','bike'],swim:s,bike:k})));
for(const c of combos) for(const exp of EXPS) for(const age of AGES) for(const b of [null,0,0.5,1,2,3,5]) for(const evt of [true,false])
  L2.push([`${c.types.join('+')}:${c.swim||''}${c.bike||''}|${exp}|${age}|${b}|${evt}`,mkCfg(Object.assign({b,evt,exp,age},c))]);
sweep('L2 multi-sport 35 combos x exp3 x age3 x baseline7 x evt2', L2);
// rest-pattern cut on the tw>=13 run-only configs
const L3=[]; const RP=[['sun'],['sun','wed'],['sun','wed','fri'],['sat','sun'],['mon','wed','fri','sun']];
for(const [k,cfg] of L1){ for(const rp of RP){ const c=Object.assign({},cfg,{restDays:rp}); L3.push([`rest=${rp.join(',')}|${k}`,c]); } }
sweep('L3 run-only L1 x 5 rest patterns', L3);
