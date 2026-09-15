
// CONFINEMENT: which function bodies actually changed between V194 and V195?
const {load}=require('/Users/CanasBangin/Desktop/TheBig6V2/tests/harness.js');
const A=load(process.argv[3]), B=load(process.argv[2]);
const names=new Set();
const re=/^\s*function\s+([A-Za-z_$][\w$]*)/gm;
[A.js,B.js].forEach(js=>{ let m; const r=new RegExp(re.source,'gm'); while((m=r.exec(js))) names.add(m[1]); });
const list=[...names].sort();
const src=(IA,n)=>{ try{ const t=IA.eval('typeof '+n); if(t!=='function') return null; return IA.eval(n+'.toString()'); }catch(e){ return null; } };
const changed=[],onlyB=[],onlyA=[],same=[],unreach=[];
list.forEach(n=>{
  const a=src(A,n), b=src(B,n);
  if(a===null&&b===null){ unreach.push(n); return; }
  if(a===null){ onlyB.push(n); return; }
  if(b===null){ onlyA.push(n); return; }
  if(a===b) same.push(n); else changed.push(n);
});
console.log('# top-level functions seen: '+list.length+'  (unreachable in VM context: '+unreach.length+')');
console.log('# byte-identical: '+same.length);
console.log('# NEW in V195 ('+onlyB.length+'): '+onlyB.join(', '));
console.log('# REMOVED in V195 ('+onlyA.length+'): '+(onlyA.join(', ')||'none'));
console.log('# CHANGED ('+changed.length+'): '+changed.join(', '));
// Engine surface must be byte-identical.
const ENGINE=['buildProgram','refreshProgram','engineA_timeline','engineB_cardio','planCalendar','engineC_kinematics','engineD_synthesis','raceAlignment','calcProgramLength','d18LongRunDayPass','_nrcSpacedRunDays','getNRCSessionTypes','sportDayTargets','applyInjuryFilter','applyOverlays','bodyweightSweep','singletonSupersetSweep','deconflictAdjacentDupes','_powerPrescribe','_carryRx','_repFit','_repFloor','_pattern','_stationClass','_ssLegal','_ssPair','capSessionBudget','exStoreKey','parseRx','_swapDetailFor','swapCandidates','auxSwapCandidates','scheduledDays','statusOf','completedCount','skippedCount','dayDateFor','getWeekMonday','dayBeforeStart','_progDayDate','_parseLocalDate'];
let bad=[];
ENGINE.forEach(n=>{ const a=src(A,n), b=src(B,n); if(a===null&&b===null){ bad.push(n+'(absent both)'); return; } if(a!==b) bad.push(n); });
console.log('# ENGINE byte-identity over '+ENGINE.length+' named symbols: '+(bad.length?'DIFFER: '+bad.join(', '):'ALL IDENTICAL'));
// Also: total data tables
['RAND_POOLS','EXLIB','REP_AFFINITY','NRC_5K_TABLE','NRC_10K_TABLE','PACE_CHART','EX_KEY_ALIAS','_AUX_FAMILY','_AUX_GEAR','GOAL_RECOMMENDED_DAYS','SPORT_CEILINGS','DEFAULT_1RM','LIFTING_FOCUS_TO_GOAL'].forEach(n=>{
  const a=A[n]?JSON.stringify(A[n]):'undef', b=B[n]?JSON.stringify(B[n]):'undef';
  if(a!==b) console.log('# TABLE DIFFERS: '+n);
});
console.log('PASS '+(bad.length?0:1)+' FAIL '+(bad.length?1:0));
process.exit(bad.length?1:0);
