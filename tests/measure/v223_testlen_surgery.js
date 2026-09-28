// v223 measure helper — source-surgery COUNTERFACTUAL copies for P-TESTLEN (instrument only, not a proposal and not
// builder's edit). Every anchor must count exactly 1 in its input or the build throws NOT-APPLIED.
//   Sa   slice (a) as the scope re-ruling states it: progTestPin pins when 1 <= tw <= NSW_TABLE6_INT.length - 1;
//        doGenerate takes _testWeek from progTestPin(WD, resolved start); backfill guard `== null`, writes only when it pins
//        (tw in range and the test not past).
//   Sc   Sa + (c) the D25 snap: resolveStartDate(dateStr, restDays, raceIso) does not snap when the entered date's partial
//        week holds the test; every wizard/generate caller passes the test date of a dated test goal.
//   S26  Sa + beyond 26: a dated test goal whose test week from the resolved start is > 26 starts at
//        Monday(test week) - 25 weeks, so tw 26, len 26 (WD.startDate rewritten before the build).
const fs=require('fs'), path=require('path');
function rep(src,a,b,tag){ const n=src.split(a).length-1; if(n!==1) throw new Error('NOT-APPLIED '+tag+' anchor count '+n); return src.replace(a,b); }
const DG_OLD="if(!(_testWeek >= 1 && _testWeek <= totalWeeksPreview)) _testWeek = null;";
function sa(src){
  src=rep(src,"return {tw: (tw >= 1 && tw <= len) ? tw : null, len};","return {tw: (tw >= 1 && tw <= NSW_TABLE6_INT.length - 1) ? tw : null, len};",'Sa.progTestPin');
  src=rep(src,DG_OLD,"{ const _tpg = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start); _testWeek = _tpg ? _tpg.tw : null; } /*SA_DG*/",'Sa.doGenerate');
  src=rep(src,"if(prog.cfg._testWeek === undefined){","if(prog.cfg._testWeek == null){",'Sa.backfill-guard');
  src=rep(src,"    if(_tp){\n      const _rd = _parseLocalDate(prog.cfg.raceDate)","    if(_tp && _tp.tw && !(_parseLocalDate(prog.cfg.raceDate) < _parseLocalDate(_isoToday()))){\n      const _rd = _parseLocalDate(prog.cfg.raceDate)",'Sa.backfill-write');
  return src;
}
function sc(src){
  src=sa(src);
  src=rep(src,"function resolveStartDate(dateStr, restDays){",
    "function _rsRace(c){ const g=c&&c.cardioGoals&&c.cardioGoals.run; return (c&&(c.cardioTypes||[]).includes('run')&&g&&PACE_GOALS.has(g.id)&&c.eventTargeted!==false&&c.raceDate)?c.raceDate:null; }\nfunction resolveStartDate(dateStr, restDays, raceIso){",'Sc.sig');
  src=rep(src,"  if(partial && week1Train.length === 0){",
    "  const _rt = raceIso ? _parseLocalDate(raceIso) : null; const _nmT = new Date(mon); _nmT.setDate(mon.getDate()+7); _nmT.setHours(0,0,0,0);\n  if(partial && week1Train.length === 0 && !(_rt && _rt >= d && _rt < _nmT)){",'Sc.snap');
  src=rep(src,"progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start)","progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || [], _rsRace(WD)).start)",'Sc.doGenerate');
  src=rep(src,"const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || []);","const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || [], _rsRace(wd));",'Sc.applyWizardStart');
  src=rep(src,"testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[]).start, WD.raceDate)","testWeekIndex(resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD)).start, WD.raceDate)",'Sc.callout');
  src=rep(src,"const _sr = resolveStartDate(WD.startDate, WD.restDays||[]);","const _sr = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));",'Sc.namestep');
  src=rep(src,"  const r = resolveStartDate(WD.startDate, WD.restDays||[]);\n  const a = document.getElementById('startResolve');","  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));\n  const a = document.getElementById('startResolve');",'Sc.updateStartResolve');
  src=rep(src,"const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[]);","const _r=resolveStartDate(dateStr,(activeProg.cfg&&activeProg.cfg.restDays)||[],_rsRace(activeProg.cfg));",'Sc.setProgStart');
  return src;
}
function s26(src){
  src=sa(src);
  src=rep(src,"{ const _tpg = progTestPin(WD, resolveStartDate(WD.startDate, WD.restDays || []).start); _testWeek = _tpg ? _tpg.tw : null; } /*SA_DG*/",
    "{ const _rs0 = resolveStartDate(WD.startDate, WD.restDays || []).start; let _tpg = progTestPin(WD, _rs0); const _raw = _tpg ? testWeekIndex(_rs0, WD.raceDate) : null;\n"+
    "    if(_tpg && _raw > NSW_TABLE6_INT.length - 1){ const _tm = getWeekMonday(WD.raceDate); const _s = new Date(_tm); _s.setDate(_tm.getDate() - 25*7); _s.setHours(0,0,0,0); WD.startDate = _isoOf(_s); _tpg = progTestPin(WD, WD.startDate); }\n"+
    "    _testWeek = _tpg ? _tpg.tw : null; } /*S26_DG*/",'S26.doGenerate');
  return src;
}
function write(dir,name,s){ const f=path.join(dir,name); try{fs.unlinkSync(f);}catch(e){} fs.writeFileSync(f,s); return f; }
module.exports={sa,sc,s26,write};
