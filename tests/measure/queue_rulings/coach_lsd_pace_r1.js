'use strict';
const H = require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const file = process.argv[2];
const IA = H.load(file);
const out = s => console.log(s);
out('artifact ia-version ' + IA.version);
const HAND = [[300,420,365],[330,455,395],[360,490,425],[390,525,460],[420,560,495],[450,595,530],[480,630,565],[510,660,595],[540,695,630],[570,730,660],[600,765,695],[630,800,720],[660,825,755],[690,845,780],[720,870,815]];
function handRow(mile){ if(mile<=300) return {rec:420,tempo:365}; if(mile>=720) return {rec:870,tempo:815};
  for(let i=0;i<HAND.length-1;i++){ const a=HAND[i],b=HAND[i+1]; if(mile>=a[0]&&mile<=b[0]){ const f=(mile-a[0])/(b[0]-a[0]);
    return {rec:Math.round(a[1]+(b[1]-a[1])*f), tempo:Math.round(a[2]+(b[2]-a[2])*f)}; } } }
const cap = r => Math.round((r.tempo+r.rec)/2);
const clk = s => Math.floor(s/60)+':'+String(Math.round(s)%60).padStart(2,'0');
const ev = n => { try { return IA.eval(n); } catch(e){ return undefined; } };
const lrTier = ev('_longRunTier');
const EXP_DEFAULT = {beginner:690, intermediate:570, advanced:450};
const base = H.fixtures.HALF_MANNY;
function mk(goal, extra, exp, mile, evt, seed, rest){
  const run = Object.assign({id:goal, label:goal, baselineDist:'5', baseline:'5mi'}, extra);
  if(mile){ run.mileBestMins=String(Math.floor(mile/60)); run.mileBestSecs=String(mile%60); }
  const cfg = Object.assign({}, base, {cardioGoals:{run}, experience:exp, restDays:(rest||['sun','wed']).slice(), seed, eventTargeted:evt});
  if(!evt) delete cfg.raceDate;
  return cfg;
}
function lsdOf(c){ const key=c.dose&&c.dose.key; return !c.isNRC && c.type==='run' && (key==='long'||key==='easy'); }
// ---- example: pace 1.5mi 12:00, intermediate, mile 9:00
for(const evt of [false,true]){
  const cfg = mk('run_pace_goal',{targetDist:'1.5',targetMins:'12',targetSecs:'0'},'intermediate',540,evt,76308);
  const prog = IA.buildProgram(cfg);
  const own = handRow(540);
  out('\n== EXAMPLE pace 1.5mi 12:00 intermediate mile 9:00 event='+evt+' weeks='+Object.keys(prog.weeks).length+' paceProgression='+JSON.stringify(prog.paceProgression)+' own row rec='+clk(own.rec)+' cap='+clk(cap(own)));
  const wk = Object.keys(prog.weeks).sort((a,b)=>+a-+b);
  for(const w of wk){ let q=[]; let lines=[];
    for(const d of ['mon','tue','wed','thu','fri','sat','sun']){ const day=prog.weeks[w][d]; if(!day||day.rest) continue;
      for(const c of [].concat(day.cardio||[])){ if(!c||c.type!=='run') continue;
        if(lsdOf(c)){ const t=lrTier?lrTier(c):'?'; const c2=JSON.parse(JSON.stringify(c)); c2.dose.tgt=own.rec; const t2=lrTier?lrTier(c2):'?';
          lines.push('  W'+w+' '+d+' '+c.dose.key+' '+c.dose.mi+'mi tgt='+clk(c.dose.tgt)+' cap='+(c.dose.cap?clk(c.dose.cap):'none')+' tier '+t+'->'+t2+' | '+String(c.detail).split('\n')[0].slice(0,70));
        } else if(c.dose&&c.dose.tgt) q.push(c.subtype.replace(/\s*\(.*$/,'').slice(0,18)+'@'+clk(c.dose.tgt)); } }
    out(' W'+w+' quality: '+q.join(', ')); lines.forEach(out); }
  if(!evt){ out('\n-- weekGrid W1 and final (event=false)'); const g=H.weekGrid(prog).split('\n'); out(g.filter(l=>/^W1 /.test(l)).join('\n')); out(g.filter(l=>new RegExp('^W'+wk[wk.length-1]+' ').test(l)).join('\n'));
    out('\n-- full LSD card text W1 sat (long) and W1 fri (easy)');
    for(const d of ['fri','sat']){ const day=prog.weeks['1'][d]; for(const c of [].concat(day&&day.cardio||[])){ if(c&&lsdOf(c)) out('  ['+d+' '+c.subtype+'] '+c.detail.replace(/\n/g,' / ')+'  || note: '+c.note); } } }
}
// ---- lattice: pace family only
const GOALS=[['run_pace_goal',{targetDist:'1.5',targetMins:'12',targetSecs:'0'}],['run_pace_goal',{targetDist:'1.5',targetMins:'10',targetSecs:'30'}],['run_pace_goal',{targetDist:'1',targetMins:'8',targetSecs:'0'}],['run_mile_time',{targetMins:'8',targetSecs:'0'}],['run_15_under10',{targetMins:'10',targetSecs:'0'}]];
const RESTS=[['sun'],['sun','wed'],['sun','tue','thu'],['sun','tue','thu','sat']];
let n=0, clockFaster=0, clockSlower=0, eq=0, tierMove={}, longN=0, crossCapOwn=0, crossRecOwn=0, crossCapClock=0, wkN=0, maxFast=0, builds=0;
let crossCapSlower=0; const perGoal={};
for(const [g,ex] of GOALS) for(const exp of ['beginner','intermediate','advanced']) for(const mile of [0,420,540,630]) for(const rest of RESTS) for(const evt of [false,true]) for(const seed of [76308,1234]){
  const prog=IA.buildProgram(mk(g,ex,exp,mile,evt,seed,rest)); builds++;
  const own=handRow(mile||EXP_DEFAULT[exp]); const tag=g+(ex.targetDist?' '+ex.targetDist+'mi':''); perGoal[tag]=perGoal[tag]||{n:0,faster:0,tier:0,crossCap:0,crossClockCap:0};
  for(const w of Object.keys(prog.weeks)){ let slowestQ=0, fastestQ=1e9; const lsds=[];
    for(const d of Object.keys(prog.weeks[w])){ const day=prog.weeks[w][d]; if(!day||day.rest) continue;
      for(const c of [].concat(day.cardio||[])){ if(!c||c.type!=='run') continue; if(lsdOf(c)) lsds.push(c); else if(c.dose&&c.dose.tgt){ slowestQ=Math.max(slowestQ,c.dose.tgt); fastestQ=Math.min(fastestQ,c.dose.tgt);} } }
    if(lsds.length){ wkN++; if(slowestQ && cap(own) <= slowestQ) crossCapOwn++; if(slowestQ && own.rec <= slowestQ) crossRecOwn++; }
    for(const c of lsds){ n++; perGoal[tag].n++; const ct=c.dose.tgt; if(ct<own.rec){clockFaster++; perGoal[tag].faster++; maxFast=Math.max(maxFast,own.rec-ct);} else if(ct>own.rec) clockSlower++; else eq++;
      // clock-row cap: the row whose recovery is ct; approximate by inverting the hand table
      let cm=720; for(let i=0;i<HAND.length-1;i++){ if(ct>=HAND[i][1]&&ct<=HAND[i+1][1]){ cm=HAND[i][0]+(ct-HAND[i][1])/(HAND[i+1][1]-HAND[i][1])*30; break;} } if(ct<420) cm=300;
      const clockCap=cap(handRow(cm)); if(slowestQ && clockCap<=slowestQ){ crossCapClock++; perGoal[tag].crossClockCap++; }
      const slowerRec=Math.max(ct,own.rec); const slowerCap=Math.max(clockCap,cap(own)); if(slowestQ && slowerCap<=slowestQ) crossCapSlower++;
      if(slowestQ && cap(own)<=slowestQ) perGoal[tag].crossCap++;
      if(c.dose.key==='long'){ longN++; const t=lrTier(c); const c2=JSON.parse(JSON.stringify(c)); c2.dose.tgt=own.rec; const t2=lrTier(c2); if(t!==t2){ tierMove[t+'->'+t2]=(tierMove[t+'->'+t2]||0)+1; perGoal[tag].tier++; } } }
  } }
out('\n== LATTICE pace family: builds '+builds+', LSD sessions '+n+', weeks with LSD '+wkN);
out('clock tgt vs own-row recovery: faster '+clockFaster+' (max '+maxFast+'s), slower '+clockSlower+', equal '+eq);
out('D187 tier moves if tgt -> own-row recovery (long runs '+longN+'): '+JSON.stringify(tierMove));
out('crossing, own-row ceiling steadyCap(own) <= slowest quality tgt in the same week: '+crossCapOwn+'/'+wkN+' weeks; own-row recovery <= slowest quality: '+crossRecOwn+'/'+wkN);
out('crossing, clock-row ceiling steadyCap(clockRow) <= slowest quality tgt: '+crossCapClock+'/'+n+' sessions (what a cap on the clock row would allow today)');
out('crossing, slower-of-both ceiling: '+crossCapSlower+'/'+n+' sessions');
out('per goal: '+JSON.stringify(perGoal,null,0));
