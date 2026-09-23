'use strict';
const fs=require('fs'),path=require('path');
const {load,fixtures,progDigest}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const S=process.argv[2]; const SRC='/Users/CanasBangin/Desktop/TheBig6V2/index.html';
let src=fs.readFileSync(SRC,'utf8'); const orig=src;
const P=(...a)=>console.log(...a);
// ── D109 table
const blocks=fs.readFileSync(path.join(__dirname,'v206_d109_table.txt'),'utf8').split(/^@@ /m).filter(Boolean);
let bad=0, n=0;
for(const b of blocks){ const [hdr,rest]=[b.slice(0,b.indexOf('\n')), b.slice(b.indexOf('\n')+1)]; const exp=+hdr.trim(); const [o,nw]=rest.split('\n--\n').map(s=>s.replace(/\n$/,''));
  const cnt=src.split(o).length-1; n++;
  if(cnt!==exp){bad++; P('ANCHOR MISMATCH exp',exp,'got',cnt,':',o.slice(0,80));}
  else src=src.split(o).join(nw); }
P('D109 table entries',n,'anchor mismatches',bad);
// ── D137 CF_READ (measure's surgery, verbatim)
const CALL='let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);';
for(const [a,b] of [['function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {','function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo, _rowCap) {'],
  ['const at = w => chiFromTable6(w);','const at = w => chiFromTable6(_rowCap ? Math.min(w, _rowCap) : w);'],
  [CALL,"let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo, goalId === 'run_base' ? 12 : 0);"]]){
  const c=src.split(a).length-1; if(c!==1) throw new Error('D137 anchor '+c+': '+a); src=src.replace(a,b); }
const CF=path.join(S,'v206cf.html'); fs.writeFileSync(CF,src);
// ── residual dash scan over the four builders in the CF (comments stripped), and baseline count
function scan(text,label){
  const lines=text.split('\n'); const fn=['function buildRunSession','function buildNRCSession','function buildBikeSession','function buildSwimSession'];
  const starts=fn.map(f=>lines.findIndex(l=>l.includes(f))); const ends=starts.map(s=>{let k=s+1; while(k<lines.length && !/^\}/.test(lines[k])) k++; return k;});
  let em=0,hy=0; const hits=[];
  for(let i=0;i<4;i++) for(let k=starts[i];k<ends[i];k++){ let l=lines[k]; if(/^\s*\/\//.test(l)) continue; l=l.replace(/\/\/[^'"`]*$/,'');
    if(/\bsubtype\b|phaseTag/.test(l)) continue;
    if(l.includes('—')){em++; hits.push((k+1)+' EM '+l.trim().slice(0,110));}
    const m=l.match(/['"`][^'"`]*[A-Za-z]-[A-Za-z][^'"`]*['"`]/); if(m){hy++; hits.push((k+1)+' HY '+m[0].slice(0,110));} }
  P(label,'builder ranges',starts.map((s,i)=>(s+1)+'-'+ends[i]).join(' '),'em-dash lines',em,'letter-hyphen literals',hy); hits.forEach(h=>P('   ',h)); }
scan(orig,'V205'); scan(src,'CF ');
// ── HALF_MANNY digest + changed cards
const IA5=load(SRC), IA6=load(CF);
const p5=IA5.buildProgram(fixtures.HALF_MANNY), p6=IA6.buildProgram(fixtures.HALF_MANNY);
P('HALF_MANNY digest V205',progDigest(p5),'-> CF',progDigest(p6),'| self-stable',progDigest(IA6.buildProgram(fixtures.HALF_MANNY))===progDigest(p6));
let changed=0, total=0;
for(const wk of Object.keys(p5.weeks)) for(const d of Object.keys(p5.weeks[wk])){ const a=p5.weeks[wk][d],b=p6.weeks[wk][d]; const ca=JSON.stringify(a&&a.cardio||null), cb=JSON.stringify(b&&b.cardio||null); total++;
  const la=JSON.stringify(a&&(a.lifts||a.exercises||a.main)||null), lb=JSON.stringify(b&&(b.lifts||b.exercises||b.main)||null); if(la!==lb) P('  LIFT DIFF wk',wk,d);
  if(ca!==cb){ changed++; const A=[].concat(a.cardio),B=[].concat(b.cardio); A.forEach((c,i)=>{ const c2=B[i]; for(const f of ['subtype','detail','note']) if(String(c[f])!==String(c2[f])) P('  wk',wk,d,'['+c.subtype+']',f+':\n     BEFORE',String(c[f]).replace(/\n/g,'\\n'),'\n     AFTER ',String(c2[f]).replace(/\n/g,'\\n')); }); } }
P('HALF_MANNY days',total,'cardio-changed days',changed);
// ── D137 series from the combined CF
function mkCfg(o){ const g={id:'run_base',label:'Build Running Base',baselineDist:'0.1',baseline:'0.1mi'}; return Object.assign({},fixtures.HALF_MANNY,{name:'RB',primaryPath:'fitness',cardioTypes:['run'],cardioGoals:{run:g},eventTargeted:o.evt,raceDate:o.evt?'2027-06-01':'',experience:'intermediate',ageBracket:'55+',restDays:['sun','wed'],seed:76308}); }
function series(ia,cfg){ const p=ia.buildProgram(cfg); const out=[]; for(let w=1;w<=p.totalWeeks;w++){ let v='-'; for(const d of Object.keys(p.weeks[w]||{})){ const cs=[].concat(p.weeks[w][d]&&p.weeks[w][d].cardio||[]); for(const c of cs){ if(c&&/Steady Aerobic/.test(c.subtype||'')){ const m=String(c.detail).match(/^(\d+) min steady/); v=m?m[1]:'?'; } } } out.push(v);} return {tw:p.totalWeeks,s:out.join(' ')}; }
for(const evt of [true,false]){ const c=mkCfg({evt}); P('D137 evt='+evt,'V205',JSON.stringify(series(IA5,c)),'\n            CF  ',JSON.stringify(series(IA6,c))); }
// pace-family control: a 16-wk run_pace_goal CHI card at wk13 must still print two pieces in both
const pc=Object.assign({},fixtures.HALF_MANNY,{name:'PG',primaryPath:'fitness',cardioTypes:['run'],cardioGoals:{run:{id:'run_pace_goal',label:'Pace Goal',baselineDist:'3',baseline:'3mi',targetPace:'8:00',currentPace:'9:00'}},eventTargeted:true,raceDate:'2027-01-12',experience:'intermediate',ageBracket:'36-54',restDays:['sun','wed'],seed:76308});
for(const [k,ia] of [['V205',IA5],['CF  ',IA6]]){ const p=ia.buildProgram(pc); const chi=[]; for(let w=1;w<=p.totalWeeks;w++) for(const d of Object.keys(p.weeks[w]||{})) for(const c of [].concat(p.weeks[w][d]&&p.weeks[w][d].cardio||[])) if(c&&/Continuous High/.test(c.subtype||'')) chi.push(w+':'+String(c.detail).match(/^[^(]*/)[0].trim().slice(0,28)); P('pace-goal CHI',k,'tw',p.totalWeeks,chi.join(' | ')); }
