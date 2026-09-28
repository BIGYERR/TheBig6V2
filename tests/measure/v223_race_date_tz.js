// v212 measure — race date vs timezone (Mode A: Mario, HALF_MANNY, card "Dec 5" vs header "Sun, Dec 6").
// Usage: node tests/measure/v223_race_date_tz.js <artifact.html>
// Parent spawns one child per TZ (TZ must be set before the process touches Date).
// Clock pinned to 2026-09-22T12:00Z (same local calendar date in NY, LA, UTC, Tokyo) so "today" is
// not a confound; one extra unpinned child reproduces with the real clock.
// ORACLE: expected strings come from y/m/d split + a hand month table + Date.UTC weekday arithmetic.
const cp = require('child_process'), path = require('path');
const ART = process.argv[2]; const MODE = process.argv[3];
const TZS = ['America/New_York','America/Los_Angeles','UTC','Asia/Tokyo'];
const FIXED = Date.UTC(2026,8,22,12,0,0);
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function oracle(iso){ const [y,m,d]=iso.split('-').map(Number); const wd=new Date(Date.UTC(y,m-1,d)).getUTCDay();
  return {card: MON[m-1]+' '+d+', '+y, header: WD[wd]+', '+MON[m-1]+' '+d+', '+y, wd}; }
function dates(){ const out=[]; for(let t=Date.UTC(2026,10,1); t<=Date.UTC(2027,9,31); t+=86400000){ const d=new Date(t); out.push(d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0')); } return out; }

if(MODE==='child'){
  const pin = process.env.PIN_CLOCK==='1';
  if(pin){ const R=Date; class F extends R{ constructor(...a){ if(a.length===0) super(FIXED); else super(...a);} static now(){ return FIXED; } }
    globalThis.Date = F; }
  const H = require(path.resolve(__dirname,'..','harness.js'));
  const IA = H.load(ART);
  const tzIn = IA.eval('Intl.DateTimeFormat().resolvedOptions().timeZone');
  const todayIn = IA.eval('_isoOf(new Date())');
  const list = process.env.DATES ? process.env.DATES.split(',') : dates();
  const rows = [];
  for(const iso of list){
    const cfg = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY)); cfg.raceDate = iso;
    let r = {iso};
    try{
      const prog = IA.buildProgram(cfg); IA._applyWizardStart(prog, cfg);
      IA.window.__P = prog;
      // Surface 1: Programs card (progSelData -> raceStr, rendered at the Event target row)
      const sd = IA.eval('progSelData(__P)');
      r.card = sd.raceStr; r.timeOut = sd.raceWeeks;
      // Surface 2: week header Race Day control (_fmtStartDay(progAlignment(p).raceIso,true))
      r.header = IA.eval('(function(){const a=progAlignment(__P); return a? _fmtStartDay(a.raceIso,true):null;})()');
      // Surface 3/4 (not callable headless): verbatim expressions of openMileSheet 14398/14402 and wizard review 3022
      r.mile = IA.eval('(function(){const rd=new Date(__P.cfg.raceDate); return rd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});})()');
      r.mileDaysOut = IA.eval('(function(){const rd=new Date(__P.cfg.raceDate); const t=new Date(); t.setHours(0,0,0,0); const m=new Date(rd.getTime()); m.setHours(0,0,0,0); return Math.round((m-t)/86400000);})()');
      const al = IA.eval('progAlignment(__P)');
      r.alRaceDay = al && al.raceDay; r.alStart = al && al.start; r.alWeeksOut = al && al.weeksOut;
      const wk = prog.weeks||{}; r.nWeeks = Object.keys(wk).length; r.totalWeeks = prog.totalWeeks;
      r.race = null;
      for(const w of Object.keys(wk).sort((a,b)=>a-b)) for(const d of Object.keys(wk[w])){ const c=wk[w][d]&&wk[w][d].cardio; const cs=Array.isArray(c)?c:(c?[c]:[]);
        if(cs.some(x=>/RACE DAY/i.test(x.subtype||''))) r.race = 'W'+w+' '+d; }
      r.startDate = prog.startDate; r.digest = H.progDigest(prog);
      r.stored = {top: prog.raceDate, cfg: prog.cfg && prog.cfg.raceDate, typeofCfg: typeof (prog.cfg&&prog.cfg.raceDate), weeksField: prog.raceDateWeeks};
    }catch(e){ r.err = String(e && e.stack || e).slice(0,300); }
    rows.push(r);
  }
  require('fs').writeFileSync(process.env.OUTF, JSON.stringify({tzIn, todayIn, rows}));
  process.exit(0);
}

// ── PART 2 child: real renderers (progDetailHTML, progSelLines, renderWeekView, openMileSheet,
// renderWizardStep, updateRaceDateFeedback, setProgRace), clock movable via globalThis.__NOW.
if(MODE==='child2'){
  const R=Date; globalThis.__NOW = Date.UTC(2026,7,31,16,0,0);
  class F extends R{ constructor(...a){ if(a.length===0) super(globalThis.__NOW); else super(...a);} static now(){ return globalThis.__NOW; } }
  globalThis.Date = F;
  const H = require(path.resolve(__dirname,'..','harness.js'));
  const IA = H.load(ART); const out = {tz: IA.eval('Intl.DateTimeFormat().resolvedOptions().timeZone')};
  const at = (iso) => { const [y,m,d]=iso.split('-').map(Number); globalThis.__NOW = Date.UTC(y,m-1,d,16,0,0); };  // 16:00Z = noon EDT / 11:00 EST
  IA.eval(`(function(){const m={};document.getElementById=function(id){ if(!m[id]){ const e=document.createElement('div'); e.id=id; m[id]=e;} return m[id];}; globalThis.__DOM=m;})()`);
  const strip = h => String(h||'').replace(/<svg[\s\S]*?<\/svg>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const grab = (h, key, n=60) => { const t=strip(h); const i=t.indexOf(key); return i<0?'(absent)':t.slice(i,i+n); };
  const tryit = (f) => { try{ return f(); }catch(e){ return 'CRASH '+String(e&&e.message||e).slice(0,160); } };
  const views = (tag, dayIso) => {
    at(dayIso);
    const p = IA.eval('getPrograms()[0]'); IA.window.__P = p;
    const v = {tag, day: dayIso, top_raceDate: p.raceDate, cfg_raceDate: p.cfg.raceDate, top_raceDateWeeks: p.raceDateWeeks, cfg_raceDateWeeks: p.cfg.raceDateWeeks, totalWeeks: p.totalWeeks, startDate: p.startDate};
    const al = IA.eval('progAlignment(__P)'); v.engine_weeksOut = al && al.weeksOut; v.engine_raceIso = al && al.raceIso;
    v.card_race = tryit(()=>grab(IA.eval('progDetailHTML(__P)'), 'Race date', 22));
    v.card_timeOut = tryit(()=>grab(IA.eval('progDetailHTML(__P)'), 'Time out', 18));
    v.copy_event = tryit(()=>IA.eval('progSelLines(__P)').filter(l=>/^Event/.test(l))[0]);
    v.header = tryit(()=>{ IA.eval('activeProgId=__P.id; activeProg=refreshProgram(getPrograms()[0]); currentWeek=calcCurrentWeek(); document.getElementById("raceDateDisplay").textContent="(unset)"; renderWeekView();'); return IA.eval('document.getElementById("raceDateDisplay").textContent'); });
    v.curWk = IA.eval('_goalCurWeek(__P)');
    v.mileSheet = tryit(()=>{ IA.eval('document.getElementById("mileLockBody").innerHTML=""; openMileSheet(__P.id)'); const h=IA.eval('document.getElementById("mileLockBody").innerHTML');
      return h ? grab(h,'Days out',60) : '(unlocked branch: no race date on sheet, curWk '+v.curWk+' < tw-2)'; });
    return v;
  };
  // Wizard: real updateRaceDateFeedback + real review row, on the wizard date.
  const WIZ = process.env.WIZ_DATE || '2026-08-31';
  at(WIZ);
  IA.window.__FX = JSON.parse(JSON.stringify(H.fixtures.HALF_MANNY));
  IA.eval('Object.assign(WD, __FX); document.getElementById("raceDateInput").value=""; updateRaceDateFeedback();');
  out.wizard = {date: WIZ, WD_raceDateWeeks: IA.eval('WD.raceDateWeeks')};
  out.wizard.review = tryit(()=>{ const steps=IA.eval('WIZARD_STEPS'); const i=steps.findIndex(x=>(x&&x.id||x)==='name'); IA.eval('wizardStep='+i+'; renderWizardStep()');
    const hit = IA.eval('Object.values(__DOM).map(e=>e.innerHTML||"").find(h=>/Program Summary/.test(h))||""'); return grab(hit,'Race date',40); });
  // Generate as doGenerate does (buildProgram(WD) + _applyWizardStart), persist to ia_programs.
  IA.eval('(function(){ const prog=buildProgram(JSON.parse(JSON.stringify(WD))); _applyWizardStart(prog, WD); savePrograms([prog]); })()');
  out.storedRaw = IA.eval('(function(){const p=JSON.parse(localStorage.getItem("ia_programs"))[0]; return {raceDate:p.raceDate, raceDateWeeks:p.raceDateWeeks, cfg_raceDate:p.cfg.raceDate, cfg_raceDateWeeks:p.cfg.raceDateWeeks};})()');
  out.v = [views('built', WIZ), views('today', '2026-09-22'), views('lockwin', '2026-11-20')];
  // setProgRace 2026-12-06 -> 2026-12-13 on 2026-09-22
  at('2026-09-22');
  out.setRace = tryit(()=>{ IA.eval('activeProgId=getPrograms()[0].id; activeProg=refreshProgram(getPrograms()[0]); setProgRace("2026-12-13")'); return IA.eval('document.getElementById("toast").innerHTML'); });
  out.v.push(views('afterSet', '2026-09-22'), views('afterSet-lockwin', '2026-11-27'));
  require('fs').writeFileSync(process.env.OUTF, JSON.stringify(out));
  process.exit(0);
}

function run(tz, pin, datesEnv){
  const env = Object.assign({}, process.env, {TZ: tz, PIN_CLOCK: pin?'1':'0'}); if(datesEnv) env.DATES = datesEnv; else delete env.DATES;
  const os=require('os'), fs=require('fs'); env.OUTF = path.join(os.tmpdir(), 'v212tz_'+process.pid+'_'+tz.replace(/\W/g,'_')+'.json'); try{ fs.unlinkSync(env.OUTF); }catch(_){}
  const res = cp.spawnSync(process.execPath, [__filename, ART, 'child'], {env, maxBuffer: 1<<28});
  if(res.status!==0 || !fs.existsSync(env.OUTF)) { console.log('CHILD FAILED', tz, res.status, String(res.stderr).slice(0,800)); process.exit(2); }
  const out = JSON.parse(fs.readFileSync(env.OUTF,'utf8')); fs.unlinkSync(env.OUTF); return out;
}
console.log('artifact', ART, 'host TZ env', process.env.TZ||'(unset)');
const hs = require('fs').readFileSync(path.resolve(__dirname,'..','harness.js'),'utf8');
console.log('harness pins TZ?', /process\.env\.TZ|timeZone\s*:/.test(hs) ? 'YES' : 'NO (Date passed through from host)');

// ── 1. Repro at reporter config ──
console.log('\n== 1. REPRO HALF_MANNY raceDate=2026-12-06, oracle', JSON.stringify(oracle('2026-12-06')));
for(const pin of [false,true]) for(const tz of TZS){
  const o = run(tz, pin, '2026-12-06'); const r = o.rows[0];
  console.log((pin?'pinned ':'realclk')+' '+tz.padEnd(20)+' vmTZ='+o.tzIn+' today='+o.todayIn+' | CARD "'+r.card+'" timeOut='+r.timeOut+' | HEADER "'+r.header+'" | MILESHEET "'+r.mile+'" daysOut='+r.mileDaysOut+' | raceDay='+r.alRaceDay+' start='+r.alStart+' weeksOut='+r.alWeeksOut+' race@'+r.race+' weeks='+r.nWeeks+(r.err?' ERR '+r.err:''));
  if(pin && tz==='UTC') console.log('   stored:', JSON.stringify(r.stored));
}

// ── 3. Sweep ──
console.log('\n== 3. SWEEP every day 2026-11-01..2027-10-31, clock pinned');
const all = {}; for(const tz of TZS) all[tz] = run(tz, true);
const base = all['UTC'].rows; const N = base.length;
let errs=0; for(const tz of TZS) errs += all[tz].rows.filter(r=>r.err).length;
console.log('dates', N, 'x TZ', TZS.length, '=', N*TZS.length, 'builds; crashes', errs);
if(errs) for(const tz of TZS) all[tz].rows.filter(r=>r.err).slice(0,2).forEach(r=>console.log('  ERR',tz,r.iso,r.err));
for(const tz of TZS){
  const rows = all[tz].rows;
  let cardWrong=0, headWrong=0, mileWrong=0, disagree=0, engRace=0, engWeeks=0, engDig=0, engStart=0, engRaceDayKey=0, raceWdWrong=0, dowCard={};
  let ex=null, exEng=null;
  rows.forEach((r,i)=>{ const o=oracle(r.iso); const b=base[i];
    const cw = r.card!==o.card, hw = r.header!==o.header, mw = r.mile!==o.card;
    cardWrong+=cw; headWrong+=hw; mileWrong+=mw;
    const hdrNoWd = (r.header||'').replace(/^[A-Z][a-z]{2}, /,'');
    if(hdrNoWd!==r.card){ disagree++; if(!ex) ex=r; }
    if(cw){ dowCard[WD[o.wd]]=(dowCard[WD[o.wd]]||0)+1; }
    if(r.race!==b.race) engRace++; if(r.nWeeks!==b.nWeeks) engWeeks++; if(r.startDate!==b.startDate) engStart++; if(r.alRaceDay!==b.alRaceDay) engRaceDayKey++;
    if(r.digest!==b.digest){ engDig++; if(!exEng) exEng={r,b}; }
    const WK=['sun','mon','tue','wed','thu','fri','sat']; if(!r.race || r.race.split(' ')[1]!==WK[o.wd]) raceWdWrong++;
  });
  console.log(tz.padEnd(20)+' surfaces disagree '+disagree+'/'+N+' | card!=oracle '+cardWrong+'/'+N+' header!=oracle '+headWrong+'/'+N+' milesheet!=oracle '+mileWrong+'/'+N
    +' | ENGINE vs UTC: raceDayIdx '+engRace+'/'+N+' weeks '+engWeeks+'/'+N+' startDate '+engStart+'/'+N+' raceDayKey '+engRaceDayKey+'/'+N+' digest '+engDig+'/'+N
    +' | race card not on oracle weekday '+raceWdWrong+'/'+N+' | card-wrong by weekday '+JSON.stringify(dowCard));
  if(ex) console.log('   e.g. '+ex.iso+' card "'+ex.card+'" header "'+ex.header+'"');
  if(exEng) console.log('   ENGINE diff e.g. '+exEng.r.iso+' '+JSON.stringify({race:exEng.r.race,weeks:exEng.r.nWeeks,start:exEng.r.startDate})+' vs UTC '+JSON.stringify({race:exEng.b.race,weeks:exEng.b.nWeeks,start:exEng.b.startDate}));
}
// DST boundary spot rows
for(const iso of ['2026-11-01','2026-11-08','2027-03-14','2027-03-21']){ const i=base.findIndex(r=>r.iso===iso);
  console.log('  DST '+iso+' '+TZS.map(tz=>tz.split('/').pop()+':'+all[tz].rows[i].card+'|'+all[tz].rows[i].race).join('  ')); }
// self-stability
const again = run('UTC', true, base.slice(0,5).map(r=>r.iso).join(','));
console.log('baseline==itself (5 dates):', again.rows.every((r,i)=>r.digest===base[i].digest));
console.log('race placement spread (UTC):', JSON.stringify(base.reduce((m,r)=>{m[r.race]=(m[r.race]||0)+1;return m;},{})));

// ── PART 2 (coordinator follow-up): real renderers, top-level p.raceDate, raceDateWeeks, setProgRace ──
function run2(tz){
  const os=require('os'), fs=require('fs'); const env=Object.assign({}, process.env, {TZ: tz}); env.OUTF=path.join(os.tmpdir(),'v212tz2_'+process.pid+'_'+tz.replace(/\W/g,'_')+'.json'); try{ fs.unlinkSync(env.OUTF); }catch(_){}
  const res = cp.spawnSync(process.execPath, [__filename, ART, 'child2'], {env, maxBuffer: 1<<28});
  if(res.status!==0 || !fs.existsSync(env.OUTF)) { console.log('CHILD2 FAILED', tz, res.status, String(res.stderr).slice(0,1200)); process.exit(3); }
  const o = JSON.parse(fs.readFileSync(env.OUTF,'utf8')); fs.unlinkSync(env.OUTF); return o;
}
console.log('\n== PART 2: real renderers; wizard day 2026-08-31, race 2026-12-06, setProgRace -> 2026-12-13 on 2026-09-22');
for(const tz of ['America/New_York','UTC']){
  const o = run2(tz);
  console.log('-- '+o.tz);
  console.log('   wizard', JSON.stringify(o.wizard));
  console.log('   stored ia_programs', JSON.stringify(o.storedRaw));
  console.log('   setProgRace toast:', o.setRace);
  o.v.forEach(v => console.log('   ['+v.tag+' @'+v.day+'] '+JSON.stringify(v)));
}
