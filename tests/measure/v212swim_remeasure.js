// V212 measure (Mode B) — re-measure D110a / M2 / D144 before-picture on V211 (HEAD 6adba21).
// Read-only against index.html. Part 1 re-runs tests/measure/v211_d110_swim.js unchanged.
// Part 2 re-points coach's V206 source-surgery (slices 1-4, anchors copied verbatim from
// scratchpad d110_grid2.js) onto the current artifact: every anchor count must be 1.
// Part 3 prints the seams slices 5 (M2) and 6 (D144) must land on, with counts.
// ORACLES: V206 recorded digests/lines (A before 0401b2c3caa741f2, after 402d3dde836e875c);
// Guide A p12 (SI = base - 2 s/100, <=8 intervals); wizard contract (entered time).
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.join(__dirname,'..','..'); const SRC=path.join(ROOT,'index.html');
const H=require(path.join(ROOT,'tests','harness.js'));
const P=s=>console.log(s);
P('#### PART 1 — v211_d110_swim.js on current artifact');
let out1=''; try{ out1=cp.execFileSync('node',[path.join(__dirname,'v211_d110_swim.js')],{encoding:'utf8',maxBuffer:1<<26}); }catch(e){ P('PART1 FAILED exit '+e.status+' '+String(e.stdout||'').slice(-500)+String(e.stderr||'').slice(-500)); }
P(out1.trim()||'PART1 PRINTED NOTHING = FAILED');
P('\n#### PART 2 — coach surgery re-pointed (slices 1-4)');
let src=fs.readFileSync(SRC,'utf8');
const edits=[
 ['S1 cap', "const maxImprove = Math.min(6, baseImprove * 2.5); // physiological ceiling", "const maxImprove = baseImprove;"],
 ['S2 E7 hold', "    if(targetPace100) {\n      const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;", "    if(targetPace100) {\n      const enteredTarget100 = targetPace100; const goalAlreadyMet = enteredTarget100 >= initialPace100; targetPace100 = Math.min(enteredTarget100, initialPace100);\n      const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;"],
 ['S2b meta', "swimPace._originalTarget = +targetPace100.toFixed(1);", "swimPace._originalTarget = +enteredTarget100.toFixed(1); swimPace._goalMet = goalAlreadyMet; swimPace._baseEntered = initialPace100 !== expPace100 || (swimGoal.baseMins !== undefined && swimGoal.baseMins !== ''); swimPace._expDefault = expPace100; swimPace._dist = fixedDist;"],
 ['S3 -2s', "const intPace = Math.max(swimPace._realisticTarget * 0.97, weekPace * 0.97); // slightly faster than goal", "const intPace = weekPace - 2;"],
 ['S4a copy', "note = 'INT: 100 repeats at your target split. Start at 4, build to 10. Hard cap at 10. If your split slips, end the session. Consistency between reps matters.';", "note = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';"],
 ['S4b copy', "note = 'INT: 100 yard repeats. Start at 4, build to 10. Hard cap at 10. If pace drops significantly, end the session. Consistency between reps matters.';", "note = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8. If pace drops significantly, end the session. Consistency between reps matters.';"],
 ['S5/S7/S8 notes', "      if(swimPace._dampened) {\n        note = `INT: Split capped at +${swimPace._weeklyGain}s/100/week (safe progression limit). Full goal of ${fmt(swimPace._originalTarget)}/100 needs more time. The realistic target for this block is ${fmt(swimPace._realisticTarget)}/100. Hit the prescribed split precisely.`;\n      } else {",
  "      const _anchorLine = swimPace._baseEntered ? '' : `No current ${swimPace._dist}${u} time was entered. This split starts from the ${exp} default of ${fmt(swimPace._expDefault)}/100, not from your own time. `;\n      const _reachSplit = (_qph && _qph.intSpan) ? swimPace[Math.min(_qph.intSpan, tw) - 1] : swimPace._realisticTarget;\n      if(swimPace._goalMet) {\n        note = _anchorLine + 'INT: Your goal split is already within your current split. This block holds your split and builds your reps.';\n      } else if(swimPace._dampened) {\n        note = _anchorLine + `INT: Split moves ${swimPace._weeklyGain} seconds per 100 each week. That is the safe rate for your experience and age. Your full goal of ${fmt(swimPace._originalTarget)}/100 needs more weeks than this block has. The target for this block is ${fmt(_reachSplit)}/100. Hit the prescribed split precisely.`;\n      } else {\n        note = _anchorLine;"],
 ['S5b else-tail', "        note = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';\n      }", "        note += 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8. If your split slips, end the session. Consistency between reps matters.';\n      }"],
 ['S6 carry', "        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{})};", "        ?{mileBestMins:prev.mileBestMins,mileBestSecs:prev.mileBestSecs,...(prev.mileBestSrc?{mileBestSrc:prev.mileBestSrc}:{})}:{}),\n    ...(sport==='swim'&&prev.swimUnit?{swimUnit:prev.swimUnit}:{}),\n    ...(sport==='swim'&&prev.baseMins!==undefined&&prev.baseMins!==''&&SWIM_GOAL_DIST[prev.id]===SWIM_GOAL_DIST[g.id]?{baseMins:prev.baseMins,baseSecs:prev.baseSecs}:{})};"],
];
let bad=0;
for(const [n,a,b] of edits){ const c=src.split(a).length-1; const ln=c?src.slice(0,src.indexOf(a)).split('\n').length:'-'; P('anchor '+n.padEnd(16)+' count='+c+'  line '+ln); if(c!==1){ bad++; continue; } src=src.replace(a,b); }
P('anchors not count==1: '+bad+'/'+edits.length);
const AFTER=path.join(require('os').tmpdir(),'v212swim_after_'+process.pid+'.html'); fs.writeFileSync(AFTER,src);
const B=H.load(SRC), A=H.load(AFTER);
P('versions B '+B.version+' A '+A.version);
function mkCfg(o){ const c=JSON.parse(JSON.stringify(B.fixtures.HALF_MANNY)); c.cardioTypes=['swim']; c.experience=o.exp; c.ageBracket=o.age; c.seed=o.seed||76308; c.primaryPath='goal'; c.eventTargeted=false; delete c.raceDate;
  const g={id:o.goal,label:o.goal,swimUnit:o.unit||'yd'}; if(o.tgt!=null){ g.targetMins=String(Math.floor(o.tgt/60)); g.targetSecs=String(o.tgt%60); } if(o.base!=null){ g.baseMins=String(Math.floor(o.base/60)); g.baseSecs=String(o.base%60); } c.cardioGoals={swim:g}; return c; }
function cards(prog){ const out=[]; for(const wk of Object.keys(prog.weeks)) for(const d of Object.keys(prog.weeks[wk])){ const day=prog.weeks[wk][d]; if(!day||!day.cardio) continue; const cs=Array.isArray(day.cardio)?day.cardio:[day.cardio]; for(const c of cs) if(c&&c.type==='swim'&&/Interval/.test(String(c.subtype||''))) out.push({w:+wk,d,c}); } return out; }
function grid(IA,cfg,label){ const prog=IA.buildProgram(cfg); const tw=Object.keys(prog.weeks).length; const dg=H.progDigest(prog); P('\n--- '+label+'  tw='+tw+'  digest '+dg); let lastNote='';
  for(const x of cards(prog)){ const det=String(x.c.detail); const m=det.match(/(\d+ x 100\S*) at (\d+:\d+)\/100/), s=det.match(/goal split of (\d+:\d+)\/100/); P('W'+x.w+' '+x.d+'  '+(m?m[1]+' at '+m[2]+'/100':'?')+'   week split '+(s?s[1]:'?')); if(x.c.note!==lastNote){ P('      note: '+x.c.note); lastNote=x.c.note; } } return dg; }
const cA=mkCfg({goal:'swim_500_time',exp:'intermediate',age:'36-54',base:600,tgt:540,unit:'yd'});
const dB=grid(B,cA,'A BEFORE  intermediate 36-54  500yd 10:00 -> 9:00');
const dA=bad?null:grid(A,cA,'A AFTER');
P('\nA before '+dB+' expected 0401b2c3caa741f2 '+(dB==='0401b2c3caa741f2'?'MATCH':'DRIFT'));
P('A after  '+dA+' expected 402d3dde836e875c '+(dA==='402d3dde836e875c'?'MATCH':'DRIFT'));
const cM=mkCfg({goal:'swim_500_time',exp:'intermediate',age:'18-35',base:616,tgt:570,unit:'m'});
grid(B,cM,'B metres BEFORE onboarding 500m 10:16 -> 9:30');
for(const [IA,lbl] of [[B,'BEFORE'],[A,'AFTER']]){ if(bad&&lbl==='AFTER') break; const pr=IA.buildProgram(cM); pr.id='p_m'; pr.cfg=cM; IA.localStorage.setItem('ia_programs',JSON.stringify([pr]));
  IA.eval("_goalDraft={progId:'p_m',sport:'swim',sel:'swim_500_time',inputs:{targetMins:'9',targetSecs:'0'}};"); let err=''; try{ IA.eval('commitGoalChange()'); }catch(e){ err=' (throw '+e.message.slice(0,60)+')'; }
  const after=JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg.cardioGoals.swim; P('\nB goal sheet '+lbl+' writes: '+JSON.stringify(after)+err); grid(IA,Object.assign({},cM,{cardioGoals:{swim:after}}),'B metres '+lbl+' rebuilt 9:30 -> 9:00'); }
// C: 100 goal (D144 seam) — what the 100 goal anchors on today
const cC=mkCfg({goal:'swim_100_time',exp:'intermediate',age:'18-35',base:90,tgt:80,unit:'yd'});
grid(B,cC,'C 100-time BEFORE base 1:30 (a 100 time) -> 1:20');
const cC5=mkCfg({goal:'swim_100_time',exp:'intermediate',age:'18-35',base:600,tgt:80,unit:'yd'});
grid(B,cC5,'C5 100-time BEFORE base field 10:00 (a 500 time typed into the 100 field) -> 1:20');
{ const m=B.buildProgram(B.fixtures.HALF_MANNY); P('\nHALF_MANNY '+H.progDigest(m)+' pinned '+H.MANNY_DIGEST_BY_VERSION[B.version]+' expected 0ac7da6b1691a8e1'); }
fs.unlinkSync(AFTER);
P('\n#### PART 3 — seams for slice 5 (M2) and slice 6 (D144)');
const raw=fs.readFileSync(SRC,'utf8'); const L=raw.split('\n');
const seam=['function _mileEntryState(','function doGenerate(','const _mv=_mileEntryState();','function commitGoalChange(','_mileEntryState({mileBestMins:mRaw','const SWIM_GOAL_DIST = { swim_500_time: 500, swim_100_time: 100 };','if(swimGoal.baseMins !== undefined && swimGoal.baseMins !== \'\') {','if(bTotal > 0) initialPace100 = bTotal / (fixedDist / 100);','_swimEntryState','base500','baseMins500'];
for(const s of seam){ const c=raw.split(s).length-1; const ln=[]; L.forEach((l,i)=>{ if(l.includes(s)) ln.push(i+1); }); P('seam '+JSON.stringify(s).slice(0,70).padEnd(72)+' count='+c+' lines '+ln.slice(0,8).join(',')); }
const show=(a,b)=>{ for(let i=a;i<=b;i++) P(String(i).padStart(6)+'  '+L[i-1].slice(0,240)); };
P('-- buildSwimSession anchor block'); show(4690,4722);
P('-- INT note block'); show(4828,4860);
P('-- _mileEntryState / doGenerate'); show(7267,7310);
P('-- commitGoalChange swim/mile carry'); { const i=L.findIndex(l=>l.includes('?{mileBestMins:prev.mileBestMins')); show(i-6,i+3); }
P('\nDONE');
