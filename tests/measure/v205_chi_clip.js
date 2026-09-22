// v205 — NUMBER 2. The clipped CHI ramp under D128. READ-ONLY. No ruling here.
//
// ORACLES (both from the doctrine TEXT, not from getCHI):
//  - 30-min total-work CEILING: doctrine/physicaltrainingguide2020.txt p.13 l.284
//      "These sessions typically involve up to 30 minutes of total work (not including
//       recovery) in 1-4 [intervals]"
//  - 10%-per-week GROWTH cap: same file l.236
//      "total work be increased no more than 10% per [week]"
//  The CURRENT prescription is read off the PRINTED cardio detail string, not off
//  getCHI's return value. Clip rule from coach's D128 text: a week whose row exceeds
//  30 min of total work HOLDS AT THE LAST ROW THAT DOES NOT.
const fs=require('fs'), path=require('path'), os=require('os');
const { load } = require(path.join(__dirname,'..','harness.js'));
const SRC = path.join(__dirname,'..','..','index.html');
const ALL=['sun','mon','tue','wed','thu','fri','sat'];
const say=(...a)=>console.log(...a);

// ── ceiling-4 counterfactual arm: source surgery on a COPY (index.html never written)
const ORIG="run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 3, run_mile_time: 3, run_15_under10: 3,";
const NEW ="run_5k: 4, run_10k: 4, run_base: 4, run_pace_goal: 4, run_mile_time: 4, run_15_under10: 4,";
const html=fs.readFileSync(SRC,'utf8');
const nAnchor=html.split(ORIG).length-1;
say('ceiling anchor count == '+nAnchor+(nAnchor===1?' (ok)':' — NOT 1, ABORT'));
if(nAnchor!==1) process.exit(2);
const OUT=path.join(os.tmpdir(),'ia_v205_chiclip_ceil4.html');
if(fs.existsSync(OUT)) fs.unlinkSync(OUT);
fs.writeFileSync(OUT, html.replace(ORIG,NEW));
const BASE=load(SRC), CEIL4=load(OUT);
say('shipped artifact ia-version '+BASE.version+'   counterfactual copy ia-version '+CEIL4.version+' (ceiling 4)');

function cfg(o={}){ return Object.assign({ name:'M',primaryPath:'goal',cardioTypes:['run'],
  cardioGoals:{run:{id:'run_pace_goal',label:'Hit a Pace / Time Goal',targetDist:'1.5',paceUnit:'mi',
    targetMins:'10',targetSecs:'0',mileBestMins:'8',mileBestSecs:'0',baseline:''}},
  eventTargeted:false,liftingFocus:'support_prevention',experience:'intermediate',ageBracket:'18-35',
  equipment:'full_gym',unit:'lbs',restDays:['sun','wed'],days:ALL.slice(),
  bench:185,squat:255,deadlift:315,seed:76308},o); }

// pull the CHI row for each week out of what the ENGINE PRINTS
function chiRows(prog){
  const rows=[];
  Object.keys(prog.weeks).sort((a,b)=>+a-+b).forEach(w=>{
    ALL.forEach(d=>{ const day=prog.weeks[w][d]; if(!day||day.rest||!day.cardio) return;
      const arr=Array.isArray(day.cardio)?day.cardio:[day.cardio];
      arr.forEach(cd=>{ const s=String(cd.subtype||'');
        if(!/Tempo|Threshold|CHI|Continuous High/i.test(s)) return;
        const det=String(cd.detail||'').replace(/\s+/g,' ');
        const m=det.match(/^(?:(\d+)\s*x\s*)?(\d+(?:\.\d+)?)\s*min/i);
        if(!m){ rows.push({w:+w,day:d,sub:s,reps:null,mins:null,tw:null,det}); return; }
        const reps=+(m[1]||1), mins=+m[2];
        rows.push({w:+w,day:d,sub:s,reps,mins,tw:reps*mins,det});
      });
    });
  });
  return rows;
}
function clip(rows, ceiling){
  let lastOK=null; const out=[];
  rows.forEach(r=>{
    if(r.tw==null){ out.push(Object.assign({},r,{cReps:null,cMins:null,cTw:null,held:false})); return; }
    if(r.tw<=ceiling){ lastOK={reps:r.reps,mins:r.mins,tw:r.tw};
      out.push(Object.assign({},r,{cReps:r.reps,cMins:r.mins,cTw:r.tw,held:false})); }
    else if(lastOK){ out.push(Object.assign({},r,{cReps:lastOK.reps,cMins:lastOK.mins,cTw:lastOK.tw,held:true})); }
    else { out.push(Object.assign({},r,{cReps:r.reps,cMins:r.mins,cTw:r.tw,held:false,noPrior:true})); }
  });
  return out;
}
function growthCheck(seq, label){
  const v=[]; let prev=null, viol=[];
  seq.forEach(r=>{ if(r.cTw==null) return;
    if(prev!=null && r.cTw>prev){ const g=(r.cTw-prev)/prev;
      v.push({w:r.w,from:prev,to:r.cTw,pct:g*100});
      if(g>0.10+1e-9) viol.push({w:r.w,from:prev,to:r.cTw,pct:g*100}); }
    prev=r.cTw; });
  say('   10%-growth check ('+label+'): '+viol.length+' violations across '+v.length+' week-over-week INCREASES ('+seq.filter(r=>r.cTw!=null).length+' CHI weeks)');
  viol.forEach(x=>say('      W'+x.w+'  '+x.from+' min -> '+x.to+' min  = +'+x.pct.toFixed(1)+'%  (cap 10%)'));
  return {viol,incr:v.length};
}

const CEILING=30;
[['SHIPPED (3 run days, run_pace_goal ceiling 3)',BASE],
 ['COUNTERFACTUAL (4 run days, run_pace_goal ceiling 4)',CEIL4]].forEach(([tag,E])=>{
  const p=E.buildProgram(cfg());
  const rows=chiRows(p);
  const cl=clip(rows,CEILING);
  say('\n════ '+tag+' — totalWeeks='+p.totalWeeks+'  CHI sessions found='+rows.length+' ════');
  say(' Wk Day  CURRENT reps x min = totalWork | CLIPPED @30min reps x min = totalWork  | over? held?');
  cl.forEach(r=>{
    const cur = r.tw==null?'(unparsed)':(r.reps+' x '+r.mins+' = '+r.tw+' min');
    const clp = r.cTw==null?'(unparsed)':(r.cReps+' x '+r.cMins+' = '+r.cTw+' min');
    say('  W'+String(r.w).padStart(2)+' '+r.day.toUpperCase()+'  '+cur.padEnd(24)+' | '+clp.padEnd(24)
      +' | '+(r.tw>CEILING?'OVER-30':'   ok  ')+' '+(r.held?'HELD':'    ')
      +(r.noPrior?'  <no prior legal row>':''));
  });
  const over=cl.filter(r=>r.tw!=null&&r.tw>CEILING);
  say('  weeks exceeding the 30-min ceiling TODAY: '+over.length+'/'+rows.length
    +'  -> weeks '+over.map(r=>r.w).join(',')+'  (max total work seen: '+Math.max(...rows.filter(r=>r.tw!=null).map(r=>r.tw))+' min)');
  say('  weeks HELD by the clip: '+cl.filter(r=>r.held).length+'/'+rows.length
    +'  -> '+cl.filter(r=>r.held).map(r=>'W'+r.w+'@'+r.cReps+'x'+r.cMins).join(', '));
  growthCheck(rows.map(r=>({w:r.w,cTw:r.tw})),'UNCLIPPED / current');
  growthCheck(cl,'CLIPPED @30');
  say('  full detail strings, first/last CHI week:');
  if(rows.length){ say('    W'+rows[0].w+': '+rows[0].det.slice(0,170));
                   say('    W'+rows[rows.length-1].w+': '+rows[rows.length-1].det.slice(0,170)); }
});
