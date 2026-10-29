import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { getPrograms } from './storage.ts';
import { _setCalcLift, activeProg, calcLift, showScreen, showToast } from './rest-day-shell.ts';
import { DEFAULT_1RM, LIFTING_FOCUS_TO_GOAL } from '../../../../../../core/src/engine/exercise-library.ts';
import {
  ALL_DAYS_ORDER, _ISO_ORDER, _isoOf, _parseLocalDate, getWeekMonday,
} from '../../../../../../core/src/engine/calendar.ts';
import { _clkMS } from '../../../../../../core/src/engine/clock-format.ts';
import { calcProgramLength, paceGoalTarget } from '../../../../../../core/src/engine/nsw-cardio.ts';
import {
  NRC_SHORTER, PACE_GOALS, PACE_IMPROVE, raceAlignment, raceCountdown, raceCountdownWords,
} from '../../../../../../core/src/engine/nrc-race-bike-swim.ts';
import { isSpeedGoal, sportDayTargets } from '../../../../../../core/src/engine/cardio-progression.ts';
import {
  _mileAdvisoryHTML, _mileEntryState, _mileFieldHelp, _swimAdvisoryHTML, generateProgram,
} from './wizard-generate.ts';
import { _fmtPaceMi } from './log-entries.ts';
import { progTestPin } from './programs.ts';
import { seedFromPriorPrograms } from './progress-data.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// WIZARD

// ── SHARED DAY CONSTANTS ──
const DAY_FULL={sun:'Sunday',mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday'};
const DAY_SHORT: Record<string, string>={sun:'SU',mon:'MO',tue:'TU',wed:'WE',thu:'TH',fri:'FR',sat:'SA'};

// ── MINIMUM TRAINING DAYS PER GOAL ──
const MIN_TRAIN_DAYS = {
  strength:3, hypertrophy:4, fatloss:3, athletic:4, balanced:4, endurance:4,
  support_strength:4, support_athletic:4, support_prevention:3
};

// ── GLOBAL STATE ──
let wizardStep = 0;
let lastRandIdx = -1;
let currentRandDayKey = null;
// Written from other files through these setters: an ES module cannot assign another module's binding (phase C).
function _setLastRandIdx(v: any){ lastRandIdx=v; }
function _setCurrentRandDayKey(v: any){ currentRandDayKey=v; }

// ── NEW WIZARD STRUCTURE ──
// Steps: primary → profile → equipment → cardio_goal → lifting_focus → days → lifts → name
const WIZARD_STEPS = ['primary','profile','equipment','cardio_goal','lifting_focus','days','name'];

// ── V174: THE START DATE (D19–D25) ───────────────────────────────────────────
// Programs were created with startDate:null and nothing ever filled it; a dateless
// program has no clock — no current week, no day dates, no reminders, no injury overlay,
// and (pre-D23) no week freeze. The wizard now carries a start date, prefilled with
// today (D20), accepted on ANY day (D24). The resolver is pure so the wizard copy, the
// generate path and setProgStart all state the same resolution (D21):
//   • partial=true when the start is not a Monday — week 1 runs from the start day to
//     Sunday; the days before it are OUTSIDE the block (dayBeforeStart), not missed.
//   • snapped=true when that short week would hold ZERO training days (D25) — the start
//     moves to the next Monday and the copy says so. The one case "start now" is empty.
//   • holdsTest=true (D184 c) when that short week holds the test of a dated test goal: the
//     test date (from _rsRace) falls from the entered day through that Sunday. That week is
//     not empty, so it does not snap: the start stays the entered day and week 1 is the test week.
function _isoToday(){ const t=new Date(); t.setHours(0,0,0,0); return _isoOf(t); }
// D184 (c): the test date the resolver is given, or null. Only a dated test goal has one (the
// run_pace_goal family, PACE_GOALS); race goals, run_base, undated goals and non run programs get
// null, so the D25 snap is unchanged for them.
function _rsRace(c: any){
  const g = c && c.cardioGoals && c.cardioGoals.run;
  return (c && (c.cardioTypes||[]).includes('run') && g && PACE_GOALS.has(g.id) && c.eventTargeted !== false && c.raceDate) ? c.raceDate : null;
}
function resolveStartDate(dateStr: any, restDays: any, raceIso: any){
  const rest = new Set(Array.isArray(restDays) ? restDays : []);
  let d = _parseLocalDate(dateStr);
  if(!d){ d = new Date(); d.setHours(0,0,0,0); }
  const mon = getWeekMonday(_isoOf(d));
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const offset = Math.round((d - mon)/86400000);          // 0 = Monday … 6 = Sunday
  const partial = offset > 0;
  const week1Train = _ISO_ORDER.slice(offset).filter(k => !rest.has(k));
  // D184 (c): a short week with no training day left holds the test when the test date _rt
  // falls from the entered day d through that week's Sunday. It keeps the entered start (no
  // snap) and is week 1, the test week. Without raceIso nothing here changes.
  const _rt = raceIso ? _parseLocalDate(raceIso) : null;
  const _sun = new Date(mon); _sun.setDate(mon.getDate()+6); _sun.setHours(0,0,0,0);
  const holdsTest = !!(partial && week1Train.length === 0 && _rt && _rt >= d && _rt <= _sun);
  if(partial && week1Train.length === 0 && !holdsTest){
    const nm = new Date(mon); nm.setDate(mon.getDate()+7); nm.setHours(0,0,0,0);
    return {start:_isoOf(nm), entered:_isoOf(d), mon:_isoOf(nm), partial:false, snapped:true,
            week1Train:_ISO_ORDER.filter(k=>!rest.has(k)), nextMon:_isoOf(nm)};
  }
  const nm = new Date(mon); nm.setDate(mon.getDate()+7); nm.setHours(0,0,0,0);
  const r = {start:_isoOf(d), entered:_isoOf(d), mon:_isoOf(mon), partial, snapped:false,
          week1Train, nextMon:_isoOf(nm)};
  return holdsTest ? {...r, holdsTest:true} : r;   // the key exists only when true: every other return is unchanged
}
function _fmtStartDay(iso: any, withYear?: any){
  const d=_parseLocalDate(iso); if(!d) return iso;
  return d.toLocaleDateString('en-US', withYear ? {weekday:'short',month:'short',day:'numeric',year:'numeric'} : {weekday:'short',month:'short',day:'numeric'});
}
function _fmtSpan(isoFrom: any, isoTo: any){
  const a=_parseLocalDate(isoFrom), b=_parseLocalDate(isoTo); if(!a||!b) return '';
  return a.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' \u2013 '+b.toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
// The one sentence under the picker (D21/D25, D184 c). The setProgStart toast never called
// this function; the two surfaces agree because both read the same resolveStartDate return.
function startResolveCopy(r: any){
  // @ts-expect-error TS7006 Parameter 'iso' implicitly has an 'any' type.
  const sunOf = iso => { const m=_parseLocalDate(iso); const s=new Date(m); s.setDate(m!.getDate()+6); return _isoOf(s); };
  if(r.holdsTest){
    return 'That week holds your test, so this starts <b>'+_fmtStartDay(r.start)+'</b>. Nothing is left to train before it. Week 1 is the test week.';
  }
  if(r.snapped){
    return 'Nothing left to train that week, so this starts <b>'+_fmtStartDay(r.start)+'</b>. Week 1 runs <b>'+_fmtSpan(r.start, sunOf(r.start))+'</b>.';
  }
  if(r.partial){
    // @ts-expect-error TS7006 Parameter 'k' implicitly has an 'any' type.
    const days = r.week1Train.map(k => '<b>'+_fmtStartDay(_isoOf((()=>{ const m=_parseLocalDate(r.mon); const x=new Date(m); x.setDate(m!.getDate()+_ISO_ORDER.indexOf(k)); return x; })()))+'</b>');
    const list = days.length===1 ? days[0] : days.slice(0,-1).join(', ')+' and '+days[days.length-1];
    return 'Week 1 is short \u2014 you\u2019ll train '+list+', then a full week from <b>'+_fmtStartDay(r.nextMon)+'</b>.';
  }
  return 'Week 1 runs <b>'+_fmtSpan(r.start, sunOf(r.start))+'</b>.';
}
// Summary-row value: the resolved start, flagged when the first week is short.
// v0.245.1 (D246): the note joins with a comma, not a dash (the copy rule).
function startSummaryVal(r: any){
  if(r && r.aligned) return _fmtStartDay(r.start, true) + ', set by race date';
  return _fmtStartDay(r.start, true) + (r.partial ? ', short first week' : '');
}
// v0.242.1 (D242): the summary row reads the start the field above it shows. With a race date the field prints
// raceAlignment's start, the one _applyWizardStart builds from; the row read the resolver's (today) and called a
// Monday start a short first week. Both name steps, legacy and Angular, call this.
function wizardStartSummary(sr: any){
  const _al = wizardAlignment();
  return startSummaryVal(_al ? {start:_al.start, aligned:true} : sr);
}
// V188 (D14a): wizard-side alignment (reads WD; the pure helper does the dates).
function wizardAlignment(){
  if(!WD || !WD.cardioTypes || !WD.cardioTypes.includes('run') || !WD.cardioGoals || !WD.cardioGoals.run) return null;
  if(WD.primaryPath !== 'event' && WD.primaryPath !== 'both') return null;
  return raceAlignment(WD.cardioGoals.run.id, WD.raceDate, WD.eventTargeted !== false);
}
// D183 (P-SAFEPACE R3), D184 (P-TESTLEN b1, c): the wizard's dated test pin. It is progTestPin's answer
// from the resolved start, the same calls doGenerate makes, so the header, the card, the fold and the
// name step print the length that builds: tw when the test pins, else len. The resolver is called once,
// with the test date (_rsRace), and its holdsTest is copied onto the pin, so the callout reads the
// resolver's own answer and carries no second predicate. Returns progTestPin's {tw, len, week, cap},
// with holdsTest:true added when the entered week holds the test, or null when the goal is not a dated
// test goal.
function wizardTestPin(){
  if(!WD) return null;
  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));
  const p = progTestPin(WD, r.start);
  // @ts-expect-error TS2339 Property 'holdsTest' does not exist on type '{ start: string; entered: string; mon: string; partial: bo
  return (p && r.holdsTest) ? {...p, holdsTest:true} : p;
}
// D183 (P-SAFEPACE R3/R5): the header sentence on the cardio goal step. A dated test goal prints its
// test week, which is the length that builds; every other goal prints its goal length. The repaint
// passes the pin and the length it already computed; the template calls it bare.
function progLenLineHTML(p?: any, len?: any){
  if(p === undefined) p = wizardTestPin();
  if(len === undefined) len = p ? p.len : ((WD.cardioTypes||[]).length ? calcProgramLength(WD.cardioTypes, {...WD.cardioGoals, _experience:WD.experience||'intermediate', _ageBracket:WD.ageBracket||'18-35', _eventTargeted:WD.eventTargeted}, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks : 6);
  // D189 (P-PACEDISCLOSE F5): a required mile left blank has no length to print yet. A dated test pin
  // still prints its test week: that length is true without a mile.
  const _ms=(typeof _mileEntryState==='function')?_mileEntryState():{ok:true}; if(!(p && p.tw) && _ms.blank) return '<b style="color:var(--accent)">Program length: your mile time sets it.</b> Enter your current mile time and the length appears.';
  const n = (p && p.tw) || len;
  return '<b style="color:var(--accent)">Program length: '+n+(n === 1 ? ' week.' : ' weeks.')+'</b> '+((p && p.tw) ? 'Your test sets it.' : 'Set by your longest cardio goal and your experience.');
}
const _RACE_NAME: Record<string, string> = {run_5k:'5K', run_10k:'10K', run_half:'half', run_marathon:'marathon'};
const _RACE_GOAL_LBL: Record<string, string> = {run_5k:'5K plan', run_10k:'10K plan', run_half:'half marathon plan', run_marathon:'marathon plan'};
function alignedStartCopy(al: any){
  const g = WD.cardioGoals.run.id, nm = _RACE_NAME[g] || 'race';
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ mo
  const dayName = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'}[al.raceDay];
  const raceTxt = '<b>'+_fmtStartDay(al.raceIso)+'</b>, '+al.weeksOut+' week'+(al.weeksOut===1?'':'s')+' out';
  if(al.futureWeeks){
    return 'Your '+nm+' is '+raceTxt+'. The '+al.tw+'-week plan starts <b>'+_fmtStartDay(al.start)+'</b>, '+al.futureWeeks+' week'+(al.futureWeeks===1?'':'s')+' from now, so it peaks on race week and not early. Until then: run easy three times a week, 30\u201345 minutes, nothing hard.';
  }
  let t = 'Your '+nm+' is '+raceTxt+'. The '+al.tw+'-week plan starts <b>'+_fmtStartDay(al.start)+'</b> so race week is week '+al.tw+'. You open in <b>week '+al.openWeek+'</b>.';
  if(al.behindWeeks) t += ' Weeks 1\u2013'+al.behindWeeks+' are behind you: shown, not counted, not missed.';
  t += ' Race day pins to <b>'+dayName+'</b>.';
  if(al.underFloor){
    const sh = NRC_SHORTER[g];
    t += ' I don\u2019t recommend under '+al.floor+' weeks for the '+nm+'.';
    if(sh) t += ' The <a onclick="offerShorterPlan(\''+sh+'\')">'+_RACE_GOAL_LBL[sh]+'</a> fits this window better.';
  }
  return t;
}
function alignedPipsHTML(al: any){
  if(al.futureWeeks) return '';
  let h='<div class="start-pips">';
  for(let w=1;w<=al.tw;w++){ h+='<i class="'+(w<al.openWeek?'behind':w===al.openWeek?'open':w===al.tw?'race':'')+'"></i>'; }
  return h+'</div>';
}
function offerShorterPlan(goalId: any){
  const def = (CARDIO_GOALS_BY_TYPE.run || []).find(x=>x.id===goalId);
  if(!def || !WD.cardioGoals.run) return;
  WD.cardioGoals.run.id = def.id; WD.cardioGoals.run.label = def.label;
  renderWizardStep();
  const f=document.getElementById('raceDateFeedback'); if(f) updateRaceDateFeedback();
  showToast('Switched to the '+def.label+' plan \u2713');
}
// Wizard: repaint only the two dependent nodes on change. A full renderWizardStep here
// would tear the native date picker down mid-interaction on iOS.
function updateStartResolve(){
  if(wizardAlignment()) return;   // V188 (D14a): derived — nothing to resolve from the field
  const r = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));   // D184 (c): given the test date
  const a = document.getElementById('startResolve'); if(a) a.innerHTML = startResolveCopy(r);
  const b = document.getElementById('sumStartDate'); if(b) b.textContent = startSummaryVal(r);
}
// Generate path: the program's startDate is the RESOLVED start; the wizard field is
// stripped from the stored cfg so buildProgram stays a pure function of the training
// selections and refresh cannot read a stale copy.
function _applyWizardStart(prog: any, wd: any){
  // V188 (D14a): a race goal with a race date derives its start from the race — Monday of
  // race week minus (plan − 1) weeks. Days between that start and today are "behind you";
  // prog.blockOpen (today) marks where the block actually opened. No race → V174 path.
  const _al = wd && wd.cardioTypes && wd.cardioTypes.includes('run') && wd.cardioGoals && wd.cardioGoals.run
    ? raceAlignment(wd.cardioGoals.run.id, wd.raceDate, wd.eventTargeted !== false) : null;
  if(_al){
    prog.startDate = _al.start;
    const t = new Date(); t.setHours(0,0,0,0); prog.blockOpen = _isoOf(t);
    if(prog.cfg && Object.prototype.hasOwnProperty.call(prog.cfg,'startDate')) delete prog.cfg.startDate;
    return {start:_al.start, entered:_al.start, mon:_al.start, partial:false, snapped:false, aligned:true, align:_al};
  }
  const r = resolveStartDate(wd && wd.startDate, (wd && wd.restDays) || [], _rsRace(wd));   // D184 (c): the start the pin was taken from
  prog.startDate = r.start;
  if(prog.cfg && Object.prototype.hasOwnProperty.call(prog.cfg,'startDate')) delete prog.cfg.startDate;
  return r;
}

let WD: { restDays: any[]; primaryPath?: any; cardioTypes: any[]; cardioGoals?: any; eventTargeted?: any; liftingFocus?: any; experience?: any; ageBracket?: any; equipment?: any; unit?: any; days?: any; bench?: any; squat?: any; deadlift?: any; name?: any; startDate?: any; raceDate?: any; raceDateWeeks?: any; _raceDateCappedWeeks?: any; _seed?: any; _seedApplied?: any; _seedDismissed?: any; _testWeek?: any } = {
  // Primary path
  primaryPath: 'body',       // 'event' | 'body' | 'both'
  // Cardio
  cardioTypes: [],           // ['run','bike','swim'] any combo
  cardioGoals: {},           // {run:{id,label,baseline}, bike:{...}, swim:{...}}
  eventTargeted: true,
  // Lifting
  liftingFocus: 'balanced',  // strength|hypertrophy|fatloss|balanced|support_strength|support_athletic|support_prevention
  // Profile
  experience: 'intermediate',
  ageBracket: '18-35',
  equipment: 'home_full',
  unit: 'lbs',
  // Schedule
  restDays: [],
  days: ['sun','mon','tue','wed','thu','fri','sat'],
  // Lifts
  bench: 0, squat: 0, deadlift: 0,
  // Meta
  name: '',
  startDate: _isoToday(),    // V174 (D20): prefilled, editable, never null
};

const CARDIO_GOALS_BY_TYPE: Record<string, any[]> = {
  run: [
    {id:'run_5k',        label:'Run a 5K',              desc:'3.1 miles without stopping'},
    {id:'run_10k',       label:'Run a 10K',             desc:'6.2 miles. A solid aerobic base.'},
    {id:'run_half',      label:'Half Marathon',         desc:'13.1 miles. Serious endurance.'},
    {id:'run_marathon',  label:'Full Marathon',         desc:'26.2 miles. The full distance.'},
    {id:'run_pace_goal', label:'Hit a Pace / Time Goal',desc:'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.'},
    {id:'run_base',      label:'Build Running Base',    desc:'Get consistent, increase mileage safely'},
  ],
  bike: [
    {id:'bike_century',  label:'Century Ride (100mi)',  desc:'Long distance cycling endurance'},
    {id:'bike_50',       label:'50-Mile Ride',          desc:'Mid-distance cycling goal'},
    {id:'bike_ftp',      label:'Improve FTP / Power',   desc:'Sustained cycling power output'},
    {id:'bike_cals',     label:'Hit Calorie Targets',   desc:'Burn-focused spin sessions'},
    {id:'bike_base',     label:'Build Cycling Base',    desc:'Consistency and aerobic capacity'},
  ],
  swim: [
    {id:'swim_tri',      label:'Triathlon Swim',        desc:'Open water race. 750 m to 1.9 km.'},
    {id:'swim_mile',     label:'Swim a Mile',           desc:'1,650 yards continuous'},
    {id:'swim_100_time', label:'Improve 100 Time',     desc:'Speed-focused lap swimming'},
    {id:'swim_500_time', label:'Improve 500 Time',     desc:'Mid-distance swim performance'},
    {id:'swim_base',     label:'Build Swim Base',       desc:'Structure and endurance in the water'},
  ],
};

// Taper-dependent race goals hidden on the HYBRID path. Hybrid runs full-intensity lifting with
// no race-day taper, so peaking events (half, marathon, century, triathlon) don't belong there.
// The 50-mile bike and swim-a-mile are treated as long-effort capability goals — not peak races —
// so they stay available. The Event path keeps the full catalog.
const HYBRID_EXCLUDED_GOALS = new Set(['run_half','run_marathon','bike_century','swim_tri']);

// ── D5 (V145): MID-PROGRAM CARDIO GOAL CHANGE ─────────────────────────────────
// Volume rank per goal, per sport. Ordered by the engine's own volume ceilings
// (lsdLongMaxes for bike; distance / recommended-days for run and swim), NOT by
// prestige. A switch to a HIGHER rank is an upgrade and gets the warning prompt:
// the athlete drops into week N of a bigger build without the weeks under it.
// A switch to a lower rank is the supported case (goal too big, make it
// reasonable) and gets a plain confirm. Ranks are strict within a sport on
// purpose — every switch is decisively up or down, so the confirm copy never
// has to hedge.
const _GOAL_RANK = {
  run_marathon:6, run_half:5, run_10k:4, run_5k:3, run_pace_goal:2, run_base:1,
  bike_century:5, bike_50:4, bike_ftp:3, bike_base:2, bike_cals:1,
  swim_tri:5, swim_mile:4, swim_500_time:3, swim_100_time:2, swim_base:1,
};
// Goals that are dishonest without a target. The engine degrades to defaults
// (1.5mi etc.) when these fields are missing, which silently prescribes a goal
// the athlete never set — so the change sheet requires them before the switch
// button goes live.
const _GOAL_REQ_INPUTS = new Set(['run_pace_goal','swim_100_time','swim_500_time']);

// Recommended minimum TRAINING days for a cardio goal to be properly supported (volume
// guidance, used for advisories only — never a hard gate). Sport-agnostic by design:
// swim/bike distance goals can be added here when those reach parity. Goals not listed
// (pace/base) have no specific volume recommendation — their needs are handled by the
// interval-protection check instead.
const GOAL_RECOMMENDED_DAYS: Record<string, any> = {
  run_5k: 4, run_10k: 4, run_half: 4, run_marathon: 5,   // V186: 5K on the NRC layout wants its 4th day
  swim_mile: 4, swim_tri: 5,
};
// Look up a goal's display label from CARDIO_GOALS_BY_TYPE across all sports.
function goalLabel(goalId: any) {
  for(const sport in CARDIO_GOALS_BY_TYPE) {
    const found = CARDIO_GOALS_BY_TYPE[sport].find(g => g.id === goalId);
    if(found) return found.label;
  }
  return 'your';
}

const LIFTING_OPTIONS = {
  body: [
    {id:'strength',     icon:'🏋️', label:'Strength',     desc:'Heavy compounds, low reps, max force output'},
    {id:'hypertrophy',  icon:'💪', label:'Size',          desc:'Volume-focused, muscle growth'},
    {id:'fatloss',      icon:'🔥', label:'Fat Loss',      desc:'Circuits, supersets, conditioning'},
    {id:'balanced',     icon:'⚖️', label:'Balanced',      desc:'Strength + conditioning, well-rounded'},
  ],
  event: [
    {id:'support_strength',    icon:'🦾', label:'Strength Support',     desc:'Low intensity lifts that support your sport without competing with it'},
    {id:'support_athletic',    icon:'⚡', label:'Athletic Support',      desc:'Power, explosiveness, sport-specific strength'},
    {id:'support_prevention',  icon:'🛡️', label:'Injury Prevention',    desc:'Stability, mobility, posterior chain — keep you healthy and running'},
  ],
};


function startWizard() {
  wizardStep = 0;
  WD = {
    primaryPath:'body', cardioTypes:[], cardioGoals:{}, eventTargeted:true,
    liftingFocus:'balanced', experience:'intermediate', ageBracket:'18-35',
    equipment:'home_full', unit:'lbs', restDays:[],
    days:['sun','mon','tue','wed','thu','fri','sat'],
    bench:0, squat:0, deadlift:0, name:'',
    startDate:_isoToday(),   // V174 (D20)
  };
  showScreen('screenWizard');
  renderWizardStep();
}



function get1RMDefault(lift: any){
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type 'Reco
  return DEFAULT_1RM[WD.experience||'intermediate'][lift]||0;
}
function resolveRM(val: any, lift: any){
  // If user entered a value use it, otherwise use experience default
  if(val && val > 0) return val;
  return get1RMDefault(lift);
}


function wizardBack() {
  if(wizardStep === 0) { showScreen('screenHome'); return; }
  wizardStep--;
  // Skip cardio_goal if no cardio path
  if(WIZARD_STEPS[wizardStep] === 'cardio_goal' && WD.primaryPath === 'body') wizardStep--;
  renderWizardStep();
}

function wizardNext() {
  if(wizardStep < WIZARD_STEPS.length - 1) {
    wizardStep++;
    // Skip cardio_goal step if body-only path
    if(WIZARD_STEPS[wizardStep] === 'cardio_goal' && WD.primaryPath === 'body') wizardStep++;
    renderWizardStep();
  } else {
    generateProgram();
  }
}

function formatPacePerMile(totalSecs: any, distMiles: any) {
  if(!totalSecs || !distMiles || distMiles <= 0) return '';
  const paceSecPerMile = totalSecs / distMiles;
  return _clkMS(paceSecPerMile) + '/mi';
}
// ── 1RM CALCULATOR FUNCTIONS ──
function runCalc(){
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const w=+document.getElementById('calc_weight')?.value||0;
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const r=+document.getElementById('calc_reps')?.value||0;
  const res=document.getElementById('calc_result');
  if(!res) return;
  if(!w||!r){res.textContent='';return;}
  const est=r===1?w:Math.round((w*(1+r/30))/5)*5;
  const unit=(activeProg&&activeProg.cfg&&activeProg.cfg.unit)||WD.unit||'lbs';
  res.innerHTML='<b style="color:var(--accent)">Estimated '+calcLift+' 1RM: '+est+' '+unit+'</b> <span style="color:var(--muted)">— for your reference; the app coaches by RPE.</span>';
}
function setCalcLift(l: any){
  _setCalcLift(l);
  ['Deadlift','Squat','Bench'].forEach(n=>{
    const b=document.getElementById('calcLift_'+n);
    if(b){const on=(n===l);b.style.background=on?'var(--accent)':'transparent';b.style.color=on?'var(--on-ink)':'var(--muted)';}
  });
  runCalc();
}
function setUnit(u: any){
  if(u===WD.unit) return;
  WD.unit=u;
  renderWizardStep();
}

// ── RACE DATE FUNCTIONS ──

function updateRaceDateFeedback() {
  // D183 (P-SAFEPACE R2): the one repaint for the cardio goal step. It computes the test pin, the
  // length and the pace ceiling once from WD, then repaints the header, the pace line, the
  // feasibility line and this card synchronously, in one tick. updatePaceDisplay and
  // updatePaceFeasibility are its internals. No timer.
  const input = document.getElementById('raceDateInput');
  // Sync WD.raceDate from input if present
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  if(input && input.value) WD.raceDate = input.value;
  const p = wizardTestPin();
  const len = p ? p.len : ((WD.cardioTypes||[]).length ? calcProgramLength(WD.cardioTypes, {...WD.cardioGoals, _experience:WD.experience||'intermediate', _ageBracket:WD.ageBracket||'18-35', _eventTargeted:WD.eventTargeted}, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').weeks : 6);
  const _f = _mileEntryState().blank ? null : assessRunPaceCeiling((p && p.tw) || len);   // D183 amendment 2 (f): L is the program's length, the test week when one pins, else the header's len
  const _ll = document.getElementById('progLenLine');
  if(_ll) _ll.innerHTML = progLenLineHTML(p, len);
  updatePaceDisplay();
  updatePaceFeasibility(_f);
  const feedback = document.getElementById('raceDateFeedback');
  if(!feedback) return;
  if(!WD.raceDate) {
    feedback.innerHTML = '';
    return;
  }
  // D182 (P-RACEDATE) handoff: one countdown, raceCountdown's (days rounded before weeks floor, so a
  // DST change inside the span cannot lose a week). A date it cannot read prints nothing.
  const cd = raceCountdown(WD.raceDate);
  if(!cd) {
    feedback.innerHTML = '';
    return;
  }
  WD.raceDateWeeks = cd.weeks;   // unread since D182 (P-RACEDATE): the review row and the card read raceCountdown; still written, removal is §12 debt

  // D183 amendment 3 F4(ii): a past date is an entry error, not a coaching state. Red with the
  // warning icon on every goal, test included.
  if(cd.days < 0) {
    feedback.innerHTML = '<div style="color:var(--red);font-size:12px;margin-top:6px">'+asyIcon('⚠',13)+' That date has already passed.</div>';
    return;
  }

  const card = (color: any, html: any) => '<div style="color:'+color+';font-size:12px;line-height:1.55;margin-top:6px;padding:9px 11px;background:'+color+'18;border-radius:4px;border:1px solid '+color+'44">'+html+'</div>';

  // D183 (P-SAFEPACE R3, first amendment's null rows, amendment 3 F4(i)): a dated test goal. Every week
  // number is the pin's. Never red (the weeks are not his to change) and no glyph on a framed row. The
  // reach sentence attaches only where tw is set (amendment 2 (c)), never when the test falls before
  // the first training day or past the program's end.
  if(p) {
    const reach = _f ? '<div style="margin-top:5px">'+paceCeilingSentence(_f)+'</div>' : '';
    if(p.tw! >= 2) feedback.innerHTML = card(_f ? 'var(--accent)' : 'var(--run)', 'Your test is in week '+p.tw+'. The program ends on it. The taper lands in front of it.'+reach);
    // D184 (P-TESTLEN c' Q3): the entered week holds the test (the resolver's holdsTest, carried by
    // wizardTestPin), so week 1 has no training day before it. Ordered before the tw 1 row, whose
    // primer and shakeout sentence is false here. "In week 1", not "this week": true for a future start.
    // @ts-expect-error TS2339 Property 'holdsTest' does not exist on type '{ tw: number | null; len: number; week: number | null; cap
    else if(p.tw === 1 && p.holdsTest) feedback.innerHTML = card('var(--signal)', 'Your test is in week 1. Nothing is left to train before it. You get the test week only.'+reach);
    else if(p.tw === 1) feedback.innerHTML = card('var(--accent)', 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.'+reach);
    else if(p.week === null) feedback.innerHTML = card('var(--signal)', 'Your test is before your first training day. This program starts after it and does not include it.');
    // D184 (P-TESTLEN Q3): the test is past Table 6's last row, so nothing pins and the goal length
    // builds. Numbers: the raw test week, the Table 6 cap, the goal length.
    else feedback.innerHTML = card('var(--accent)', 'Your test is in week '+p.week+'. The test block is '+p.cap+' weeks. This program builds '+p.len+(p.len === 1 ? ' week' : ' weeks')+' now. Start a test block when the test is '+p.cap+' weeks out.');
    return;
  }

  // Dated non-test goals keep their sentences, dashes removed (R3). Under a week out is an entry
  // error like the past date: red with the warning icon (amendment 3 F4(ii)).
  if(cd.weeks < 1) {
    feedback.innerHTML = '<div style="color:var(--red);font-size:12px;margin-top:6px">'+asyIcon('⚠',13)+' Less than a week away. Not enough time to train.</div>';
    return;
  }

  // V188 (D14a): race goals count back from the race. The card names the derived start,
  // the opening week, and the floor; the "program stays intact, race lands in week N"
  // sentence below is NSW's and stays NSW-only.
  const _al = wizardAlignment();
  if(_al){
    feedback.innerHTML = card(_al.underFloor ? 'var(--signal)' : 'var(--run)', alignedStartCopy(_al));
    return;
  }

  // len is the fold's: the goal-driven length, never compressed by the race date.
  const diff = cd.weeks - len;
  if(diff > 0) {
    feedback.innerHTML = card('var(--run)', 'Your '+len+'-week program finishes '+diff+' week'+(diff>1?'s':'')+' before race day. Use the extra time to stay sharp.');
    return;
  }
  if(diff === 0) {
    feedback.innerHTML = card('var(--run)', 'Perfect timing. Your '+len+'-week program peaks on race day.');
    return;
  }
  // The race lands inside the program, before peak.
  const color = diff >= -2 ? 'var(--accent)' : 'var(--red)';
  feedback.innerHTML = card(color, cd.weeks+(cd.weeks === 1 ? ' week' : ' weeks')+' is short for this goal. The floor is '+len+'. Your full '+len+'-week program stays intact. Your race lands in week '+cd.weeks+'.');
}

function setPaceUnit(unit: any) {
  if(!WD.cardioGoals['run']) WD.cardioGoals['run'] = {};
  WD.cardioGoals['run'].paceUnit = unit;
  // Convert stored baseline if switching
  renderWizardStep();
}
// Fixed distances for swim time goals (in the selected unit — yd or m).
const SWIM_GOAL_DIST: Record<string, any> = { swim_500_time: 500, swim_100_time: 100 };
function setSwimUnit(unit: any) {
  if(!WD.cardioGoals['swim']) WD.cardioGoals['swim'] = {};
  WD.cardioGoals['swim'].swimUnit = unit;
  renderWizardStep();
}
// Format a total time over a distance as a per-100 pace (e.g. 500 in 10:00 -> 2:00/100).
function formatPacePer100(totalSecs: any, dist: any) {
  if(!totalSecs || !dist || dist <= 0) return '';
  const per100 = totalSecs / (dist / 100);
  return _clkMS(per100) + '/100';
}
function updateSwimPaceDisplay() {
  const el = document.getElementById('swimPaceLine');
  const g = WD.cardioGoals['swim'];
  if(!el || !g) return;
  const totalSecs = (+g.targetMins||0)*60 + (+g.targetSecs||0);   // V218 (D157): the target is its total, the engine's parse
  if(!(totalSecs > 0)) { el.style.display = 'none'; return; }
  const dist = SWIM_GOAL_DIST[g.id] || 500;
  const unit = g.swimUnit || 'yd';
  // D183 (P-SAFEPACE R5, amendment 2 (d)): '<time> is <pace> per 100 <unit>.' One unit word, once.
  el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(totalSecs) + ' is ' + _clkMS(totalSecs/(dist/100)) + ' per 100 ' + unit + '.';   // V218 (D157): label from the total
  el.style.display = 'block';
}
function updatePaceTime(type: any) {
  if(!WD.cardioGoals[type]) return;
  const mins = WD.cardioGoals[type].targetMins || 0;
  const secs = WD.cardioGoals[type].targetSecs || 0;
  WD.cardioGoals[type].targetTime = mins + ':' + String(secs).padStart(2,'0');
}
function updatePaceDisplay() {
  const el = document.getElementById('paceDisplayLine');
  if(!el) return;
  const g = WD.cardioGoals['run'];
  if(!g || g.targetMins===undefined || g.targetMins==='' || !g.targetDist) {
    el.style.display = 'none';
    return;
  }
  // D183 (P-SAFEPACE R5, amendment 2 brought in (2)): the engine's lens. A km target reads as its pace per
  // mile, because sessions print /mi. '<time> is <pace> per mile.' One unit word, once.
  const _t = paceGoalTarget(g);
  if(!_t.tPacePerMile) { el.style.display='none'; return; }
  // @ts-expect-error TS2345 Argument of type 'number | null' is not assignable to parameter of type 'number'.
  el.innerHTML = asyIcon('🎯',13)+' ' + _clkMS(_t.tTotalSecs) + ' is ' + _clkMS(_t.tPacePerMile) + ' per mile.';
  el.style.display = 'block';
}
// D183 (P-SAFEPACE R1, amendment 2 (f)): the one pace ceiling for run_pace_goal. Both surfaces read
// it: the undated #paceFeasLine frame and the dated card's reach sentence. L is the program's length and
// the caller passes it: updateRaceDateFeedback hands in the test week when one pins, else the header's
// all-sports length, because the engine ramps over totalWeeks and never over the run alone. Returns null
// when the goal is not a run pace goal, when the target is no faster than the current pace, or when it
// sits within ~45 s/mi of what L weeks reach; otherwise {L, achievable, safeTotal, tTotal, cur, fromMile,
// exp, distLabel}, which paceCeilingSentence reads.
function assessRunPaceCeiling(L: any) {
  const g = WD.cardioGoals['run'];
  if(!g || g.id !== 'run_pace_goal' || g.targetMins===undefined || g.targetMins==='' || !g.targetDist) return null;
  const exp = WD.experience || 'intermediate';
  const age = WD.ageBracket || '18-35';
  const rawDist = parseFloat(g.targetDist) || 1.5;
  const tDist = (g.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
  const tTotal = (+g.targetMins||0)*60 + (+g.targetSecs||0);
  if(!(tDist > 0) || !(tTotal > 0)) return null;
  const tPacePerMile = tTotal / tDist;
  // Current pace, mirroring calcProgramLength exactly: the user's entered mile time when
  // present (any level since D188), otherwise the experience-default. Using the SAME baseline the
  // length engine uses is essential — otherwise a fast runner who entered a quick mile time
  // gets told to slow below their current pace.
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ be
  const expCurrentPace = {beginner:690, intermediate:570, advanced:450}[exp] || 570;   // V176 (D9)
  const mileBest = (g.mileBestMins !== undefined && g.mileBestMins !== '')
    ? (+g.mileBestMins||0)*60 + (+g.mileBestSecs||0)
    : null;
  const currentPace = mileBest || expCurrentPace;
  if(tPacePerMile >= currentPace) return null; // target slower than current → reachable
  // Fastest pace reachable in L weeks FROM THE USER'S ACTUAL CURRENT PACE: the length engine's
  // forward pipeline inverted (undo the +1 grace, the age multiplier and raw*1.25 + 4).
  const paceImprove = PACE_IMPROVE[exp] || PACE_IMPROVE.intermediate;
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ '5
  const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[age] || 1.0;
  const ageSafePaceImprove = +(paceImprove * agePaceScale).toFixed(2);
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ '5
  const ageMult = {'55+':1.15, '36-54':1.07, '18-35':1.0}[age] || 1.0;
  const improvingWeeks = Math.max(0, ((L - 1) / ageMult - 4) / 1.25);
  const achievable = Math.max(currentPace - improvingWeeks * ageSafePaceImprove, 240);
  // Only flag a MEANINGFUL shortfall. Targets within ~45s/mi of what the full build
  // reaches are "ambitious but you'll get close" — flagging those is nagging.
  if(achievable - tPacePerMile < 45) return null;
  const safeTotal = achievable * tDist;
  return {L, achievable, safeTotal, tTotal, cur: currentPace, fromMile: !!mileBest, exp, distLabel: (g.targetDist || '1.5') + ' ' + (g.paceUnit || 'mi')};
}
// D183 (P-SAFEPACE R1, amendment 2 (a)/(b)): the one sentence that reads the athlete. Digits, every time
// through _clkMS, singular at 1 week. It says what L weeks reach from where he is and leaves the goal his.
// It prints inside the undated frame below and on the dated card's tw rows (amendment 2 (c)).
function paceCeilingSentence(f: any) {
  const wk = f.L + (f.L === 1 ? ' week' : ' weeks');
  const reach = ' In '+wk+' that reaches about '+f.distLabel+' in '+_clkMS(f.safeTotal)+'. Your goal is '+_clkMS(f.tTotal)+'.';
  if(f.fromMile) return 'Your mile is '+_clkMS(f.cur)+'.'+reach+' Keep it or change it above.';
  return 'You have not entered a mile time. The '+f.exp+' default is '+_clkMS(f.cur)+' per mile.'+reach+' Enter your mile above and this updates.';
}
// D183 (amendment 3): the undated #paceFeasLine frame. The accent frame around the R1 sentence and nothing
// else: no icon, no heading, no button. The dated card prints the same sentence inside its own row.
function paceCeilingOfferHTML(f: any) {
  return '<div style="color:var(--accent);font-size:12px;line-height:1.55;margin-top:6px;padding:9px 11px;background:var(--accent)18;border-radius:4px;border:1px solid var(--accent)44">'+
    paceCeilingSentence(f)+
    '</div>';
}
// No-race surface for the pace ceiling. When event+dated, the race-date panel owns pace
// messaging (the card carries the sentence), so this stays hidden to avoid a
// double sentence. D183 (R2): an internal of updateRaceDateFeedback, which passes the ceiling
// it computed once; this line never computes its own.
function updatePaceFeasibility(f: any) {
  const el = document.getElementById('paceFeasLine');
  if(!el) return;
  const hide = () => { el.style.display = 'none'; el.innerHTML = ''; };
  if(WD.primaryPath === 'event' && WD.eventTargeted && WD.raceDate) return hide();
  if(!f) return hide();
  el.innerHTML = paceCeilingOfferHTML(f);
  el.style.display = 'block';
}
// Unified day-related advisories for the rest-days step. Returns an array of HTML
// strings. Consolidates three concerns into one surface: lifting-focus volume, cardio
// goal volume, and interval protection for speed goals. All are advisory — none block.
function getDayAdvisories() {
  const out = [];
  const trainDays = ALL_DAYS_ORDER.filter(x => !WD.restDays.includes(x));
  const nDays = trainDays.length;
  const cardioTypes = WD.cardioTypes || [];
  const cardioGoals = WD.cardioGoals || {};

  // 1. Lifting focus volume (advisory, no longer a hard gate)
  const internalGoal = LIFTING_FOCUS_TO_GOAL[WD.liftingFocus] || WD.liftingFocus || 'balanced';
  const liftMin = MIN_TRAIN_DAYS[internalGoal] || 3;
  if(nDays < liftMin) {
    const label = (WD.liftingFocus || '').replace('support_', '').replace('_', ' ');
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
    out.push(asyIcon('dumbbell',14) + ' ' + labelCap + ' training is most effective with <b>' + liftMin + '+ days</b> — you have ' + nDays + '.');
  }

  // 2. Cardio goal volume (distance/endurance goals need the days for weekly mileage)
  cardioTypes.forEach(sport => {
    const goal = cardioGoals[sport];
    const rec = goal && GOAL_RECOMMENDED_DAYS[goal.id];
    if(rec && nDays < rec) {
      out.push(asyIcon('flag',14) + ' Your <b>' + goalLabel(goal.id) + '</b> goal trains best with <b>' + rec + '+ days</b> for the weekly volume — you have ' + nDays + '.');
    }
  });

  // 3. Interval protection for speed goals — sport-aware. Any sport carrying a speed/
  // time goal needs >= 3 of its own day-slots or the interval block can't fit without
  // doubling up. Reuses the same sportDayTargets the engine allocates from.
  // @ts-expect-error TS2554 Expected 5 arguments, but got 4.
  const _targets = sportDayTargets(cardioTypes, cardioGoals, nDays, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus]||'balanced').targets;   // V187 (F2)
  const sportWord: Record<string, string> = {run:'running', bike:'cycling', swim:'swimming'};
  const sportIcon: Record<string, string> = {run:'🏃', bike:'🚴', swim:'🏊'};
  cardioTypes.forEach(sport => {
    const goal = cardioGoals[sport];
    if(!goal || !isSpeedGoal(goal.id)) return;
    const slots = _targets[sport] || 0;
    if(slots < 3) {
      const word = sportWord[sport] || sport;
      const multi = cardioTypes.length > 1;
      const why = multi
        ? 'with ' + cardioTypes.length + ' sports sharing the week, ' + word + ' gets ' + slots + ' day' + (slots === 1 ? '' : 's')
        : 'you have ' + slots + ' ' + word + ' day' + (slots === 1 ? '' : 's');
      const fix = multi ? 'Add a training day or drop a sport' : 'Add a training day';
      out.push(asyIcon(sportIcon[sport] || '⏱', 14) + ' Your <b>' + goalLabel(goal.id) + '</b> goal needs <b>3+ ' + word + ' days</b> for interval (speed) work — ' + why + '. ' + fix + '.');
    }
  });

  return out;
}

function getMinTrainDays() {
  // Returns the minimum training days required given the user's current goals.
  // Cardio goals drive the floor; lifting is secondary. The ABSOLUTE floor is 3 and
  // applies even with no cardio at all: three is the first number where the engine can
  // hand out distinct day roles (push / pull / legs, or full-body with real rotation).
  // At two days you get the same session twice, capRegionalFatigue has nowhere to move
  // volume to, and there is no spacing decision left to make — six to twelve weeks of
  // periodization over a pair of days is a lot of machinery producing very little.
  const CARDIO_FLOORS: Record<string, any> = {
    run_marathon:5, run_half:4, run_10k:3, run_5k:3, run_pace_goal:3,
    run_mile_time:3, run_15_under10:3, run_base:3,
    swim_tri:4, swim_mile:4, swim_500_time:3, swim_100_time:3, swim_base:3,
    bike_century:4, bike_50:3, bike_ftp:3, bike_cals:3, bike_base:3,
  };
  let floor = 3; // absolute minimum — three days or it is not a program
  const cardioTypes = WD.cardioTypes || [];
  const cardioGoals = WD.cardioGoals || {};
  cardioTypes.forEach(sport => {
    const goal = cardioGoals[sport];
    if(goal && CARDIO_FLOORS[goal.id]) {
      floor = Math.max(floor, CARDIO_FLOORS[goal.id]);
    }
  });
  return floor;
}

function getMinTrainDaysLabel() {
  // Short human-readable reason for the floor, used in the toast nudge.
  // The persistent banner on the rest-day screen carries the full explanation.
  const cardioTypes = WD.cardioTypes || [];
  const cardioGoals = WD.cardioGoals || {};
  const goalLabels: any[] = [];
  cardioTypes.forEach(sport => {
    const goal = cardioGoals[sport];
    if(goal) goalLabels.push(goalLabel(goal.id));
  });
  const min = getMinTrainDays();
  if(goalLabels.length) return goalLabels.join(' + ') + ' needs ' + min + ' training days — see why below';
  return 'Three days is the floor. Two gives you the same session twice.';
}

function toggleRestDay(d: any) {
  const wouldRest = !WD.restDays.includes(d);
  const trainingLeft = ALL_DAYS_ORDER.filter(x => !WD.restDays.includes(x)).length;
  if(wouldRest) {
    const minDays = getMinTrainDays();
    if(trainingLeft <= minDays) {
      showToast(asyIcon('⚠',13)+' ' + getMinTrainDaysLabel());
      return;
    }
  }
  if(WD.restDays.includes(d)) {
    WD.restDays = WD.restDays.filter(x => x !== d);
  } else {
    WD.restDays.push(d);
  }
  WD.days = ALL_DAYS_ORDER.filter(x => !WD.restDays.includes(x));
  renderWizardStep();
}

function toggleCardioTypeSport(t: any) {
  if(WD.cardioTypes.includes(t)) {
    WD.cardioTypes = WD.cardioTypes.filter(x => x !== t);
    delete WD.cardioGoals[t];
  } else {
    WD.cardioTypes.push(t);
  }
  renderWizardStep();
}
function setCardioGoal(type: any, id: any) {
  if(!WD.cardioGoals[type]) WD.cardioGoals[type] = {};
  const goalData = (CARDIO_GOALS_BY_TYPE[type] || []).find(g => g.id === id);
  WD.cardioGoals[type].id = id;
  WD.cardioGoals[type].label = goalData ? goalData.label : '';
  WD.cardioGoals[type].baseline = WD.cardioGoals[type].baseline || '';
  renderWizardStep();
}
// V156: seed banner for the run-goal step. Computed once per wizard (cached on WD;
// the WD reset on wizard open clears it). Apply pre-fills and tags the fields as
// estimates; dismiss hides for this wizard run. Fewer than 3 qualifying runs -> ''.
function _seedBannerHTML(){
  if(WD._seedDismissed) return '';
  if(WD._seed===undefined){ try{WD._seed=seedFromPriorPrograms();}catch(e){WD._seed=null;} }
  const s=WD._seed; if(!s) return '';
  if(WD._seedApplied){
    return `<div style="font-size:11px;color:var(--muted);margin:2px 0 8px">${asyIcon('chart',12)} Estimated from \u201C${s.progName}\u201D. Edit if you know better.</div>`;
  }
  const pace=_fmtPaceMi(s.avgRecSec)||'';
  const distLine=s.maxDist?`, longest run ${s.maxDist} mi`:'';
  return `<div style="background:var(--surface);border:1px solid var(--accent);border-radius:4px;padding:12px 14px;margin-bottom:12px">
    <div style="font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:var(--text);margin-bottom:4px">${asyIcon('chart',13)} Seed from \u201C${s.progName}\u201D?</div>
    <div style="font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:10px">Recent logs found: ${s.n} recovery runs, avg ${pace}/mi${distLine} over your last 3 weeks.</div>
    <div style="display:flex;gap:8px">
      <button class="prog-action-btn primary" style="flex:1" onclick="applySeedData()">Use this data</button>
      <button class="prog-action-btn" style="flex:1" onclick="dismissSeedData()">Start fresh</button>
    </div>
  </div>`;
}
function applySeedData(){
  const s=WD._seed; if(!s) return;
  const g=WD.cardioGoals&&WD.cardioGoals['run']; if(!g) return;
  if(s.mileSec){
    let mm=Math.floor(s.mileSec/60), ss=Math.round(s.mileSec%60);
    if(ss===60){mm++;ss=0;}
    g.mileBestMins=String(mm); g.mileBestSecs=String(ss);
    g.mileBestSrc={kind:'seeded',prog:s.progName||'',n:s.n||0};   // V172 (D7b): provenance persists in cfg
  }
  if(s.maxDist){ g.baselineDist=String(s.maxDist); g.baseline=s.maxDist+(g.paceUnit||'mi'); }
  WD._seedApplied=true;
  renderWizardStep();
  try{ updateRaceDateFeedback(); }catch(e){}
}
function dismissSeedData(){ WD._seedDismissed=true; renderWizardStep(); }
function renderWizardStep() {
  const total = WIZARD_STEPS.length;
  // Adjust displayed total for body path (skips cardio_goal)
  const displayTotal = WD.primaryPath === 'body' ? total - 1 : total;
  const displayStep = WD.primaryPath === 'body' && wizardStep > 1 ? wizardStep : wizardStep + 1;
  document.getElementById('wizardFill')!.style.width = ((wizardStep+1)/total*100) + '%';
  document.getElementById('wizardStepLabel')!.textContent = displayStep + '/' + displayTotal;
  const body = document.getElementById('wizardBody');
  const step = WIZARD_STEPS[wizardStep];
  document.getElementById('wizardNext')!.textContent = step === 'name' ? 'Generate Program →' : 'Continue →';
  // Default raceDate to today on the cardio goal step if not set, so the card shows on first open.
  // D183 (P-SAFEPACE R2): the repaint runs synchronously from this step's tail below; no timer.
  if(step === 'cardio_goal' && WD.eventTargeted) {
    if(!WD.raceDate) {
      const t = new Date();
      WD.raceDate = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    }
  }

  if(step === 'primary') {
    body!.innerHTML = `<div class="wizard-title">What are you training for?</div>
    <div class="wizard-subtitle">This shapes everything! Program length, lifting focus, and cardio structure.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${[
        {id:'event', icon:'🏅', label:'Race / Event', desc:'A cardio goal is the priority! This puts your event/goal at the forefront of the program.', detail:'Cardio builds to a tapered peak · lifting stays light to support, not compete · set a race date.'},
        {id:'body',  icon:'💪', label:'Strength / Physique', desc:'Mass/Strength is the priority, cardio is optional!', detail:'Full-intensity lifting toward your goal · easy optional cardio that won\'t sap your lifts.'},
        {id:'both',  icon:'⚡', label:'Hybrid', desc:'Lift heavy AND build cardio at once.', detail:'Full lifting + a progressing cardio goal · higher fatigue · no race-day taper. If you like HYROX/CROSSFIT this is for you!'},
      ].map(p => `<div class="option-card${WD.primaryPath===p.id?' selected':''}" onclick="WD.primaryPath='${p.id}';renderWizardStep()" style="display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px">
        <div style="flex-shrink:0">${asyIcon(p.icon,30)}</div>
        <div><div class="option-label">${p.label}</div><div class="option-desc">${p.desc}</div><div style="font-size:11px;color:var(--muted);margin-top:6px;line-height:1.5">${p.detail}</div></div>
      </div>`).join('')}
    </div>`;

  } else if(step === 'profile') {
    const expHints: Record<string, string> = {
      beginner:'Lower volume, longer rest, technique focus. Progressions are conservative.',
      intermediate:'Balanced volume and intensity. Standard progressions with room to push.',
      advanced:'Higher intensity, more volume, shorter rest. Progressions push harder.'
    };
    const ageHints: Record<string, string> = {
      '18-35':'Standard progressions. Peak recovery.',
      '36-54':'Slightly more rest. Volume tapers a touch.',
      '55+':'More deload frequency, conservative volume increases, joint-friendly emphasis.'
    };
    body!.innerHTML = `<div class="wizard-title">About you</div>
    <div class="wizard-subtitle">Calibrates volume, intensity, and program length to your fitness level.</div>
    <div class="input-label" style="margin-bottom:8px">Training experience</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px">
      ${[
        {id:'beginner',     icon:'🌱', label:'Beginner',     desc:'Some training background — can run ~2 miles.'},
        {id:'intermediate', icon:'💪', label:'Intermediate', desc:'1-3 years consistent, comfortable with the main lifts'},
        {id:'advanced',     icon:'🔥', label:'Advanced',     desc:'3+ years, solid numbers, understand progressive overload'},
      ].map(e => `<div class="option-card${WD.experience===e.id?' selected':''}" onclick="WD.experience='${e.id}';renderWizardStep()" style="display:flex;align-items:center;gap:12px;text-align:left;padding:12px 14px">
        <div style="flex-shrink:0">${asyIcon(e.icon,26)}</div>
        <div><div class="option-label">${e.label}</div><div class="option-desc">${e.desc}</div></div>
      </div>`).join('')}
    </div>
    <div class="input-label" style="margin-bottom:8px">Age range</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px">
      ${[{id:'18-35',label:'18-35',icon:'⚡'},{id:'36-54',label:'36-54',icon:'💡'},{id:'55+',label:'55+',icon:'🧠'}]
        .map(a => `<div class="option-card${WD.ageBracket===a.id?' selected':''}" onclick="WD.ageBracket='${a.id}';renderWizardStep()" style="text-align:center;padding:14px 8px">
          <div style="margin-bottom:4px">${asyIcon(a.icon,24)}</div>
          <div class="option-label">${a.label}</div>
        </div>`).join('')}
    </div>
    <div class="input-label" style="margin-bottom:8px">Units</div>
    <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;overflow:hidden;margin-bottom:16px">
      <button onclick="setUnit('lbs')" style="flex:1;font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:9px 20px;border:none;cursor:pointer;background:${WD.unit!=='kg'?'var(--accent)':'transparent'};color:${WD.unit!=='kg'?'var(--on-ink)':'var(--muted)'}">LBS</button>
      <button onclick="setUnit('kg')" style="flex:1;font-family:var(--font-display);font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:9px 20px;border:none;cursor:pointer;background:${WD.unit==='kg'?'var(--accent)':'transparent'};color:${WD.unit==='kg'?'var(--on-ink)':'var(--muted)'}">KG</button>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:4px;padding:12px 14px;font-size:12px;color:var(--muted);line-height:1.8">
      <div><b style="color:var(--accent)">Experience:</b> ${expHints[WD.experience||'intermediate']}</div>
      <div style="margin-top:6px"><b style="color:var(--accent)">Age ${WD.ageBracket||'18-35'}:</b> ${ageHints[WD.ageBracket||'18-35']}</div>
    </div>`;

  } else if(step === 'equipment') {
    body!.innerHTML = `<div class="wizard-title">Your equipment</div>
    <div class="wizard-subtitle">The program only prescribes exercises you can actually do.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${[
        {id:'home_full', icon:'🏠', label:'Home Gym — Full',    desc:'Barbell, rack, bench, dumbbells, kettlebells, pull-up bar, trap bar, bands'},
        {id:'home_basic',icon:'🏠', label:'Home Gym — Basic',   desc:'Dumbbells, kettlebells, pull-up bar, bands. No barbell.'},
        {id:'commercial',icon:'🏋️', label:'Commercial Gym',     desc:'Full gym — cables, machines, barbells, everything'},
        {id:'crossfit',  icon:'🤸', label:'CrossFit Box',        desc:'Barbells, rig, bumpers, kettlebells, rower/bike, wall balls, bands'},
        {id:'bodyweight',icon:'👤', label:'Bodyweight only',    desc:'You, the floor, and something to pull on. No weights.'},
      ].map(e => `<div class="cardio-type-card${WD.equipment===e.id?' selected':''}" onclick="WD.equipment='${e.id}';renderWizardStep()">
        <div class="cardio-type-icon">${asyIcon(e.icon,26)}</div>
        <div style="flex:1"><div class="cardio-type-name" style="color:${WD.equipment===e.id?'var(--accent)':'var(--text)'}">${e.label}</div><div class="cardio-type-desc">${e.desc}</div></div>
        <div class="cardio-check" style="opacity:${WD.equipment===e.id?1:0}">✓</div>
      </div>`).join('')}
    </div>`;

  } else if(step === 'cardio_goal') {
    const sportIcons: Record<string, string> = {run:'🏃', bike:'🚴', swim:'🏊'};
    const sportNames: Record<string, string> = {run:'Running', bike:'Cycling / Spin', swim:'Swimming'};
    const sportColors = {run:'var(--run)', bike:'var(--bike)', swim:'var(--swim)'};
    const sportDescs: Record<string, string> = {
      run:'Outdoor or treadmill. Pace, distance and race goals.',
      bike:'Spin bike or outdoor. Intervals, FTP and distance.',
      swim:'Lap pool or open water. Structured sets.'
    };
    // D183 (P-SAFEPACE R3): the program length header below prints progLenLineHTML(). A dated test
    // goal prints its test week (wizardTestPin().tw), the length that builds; every other goal prints
    // calcProgramLength's length for the goal and experience. updateRaceDateFeedback repaints it.
    // Clear raceDateWeeks when not event targeted so it never bleeds in elsewhere
    if(!WD.eventTargeted) WD.raceDateWeeks = null;
    // HYBRID: drop any previously-selected taper-dependent race goal (e.g. chosen on the Event
    // path, then switched to Hybrid) so it can't silently carry through to the build.
    if(WD.primaryPath==='both'){ for(const sp of Object.keys(WD.cardioGoals||{})){ if(WD.cardioGoals[sp] && HYBRID_EXCLUDED_GOALS.has(WD.cardioGoals[sp].id)) delete WD.cardioGoals[sp]; } }
    body!.innerHTML = `<div class="wizard-title">Cardio goals</div>
    <div class="wizard-subtitle">Select all sports you want to train. Set a goal for each.</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${['run','bike','swim'].map(t => {
        const sel = WD.cardioTypes.includes(t);
        const g = WD.cardioGoals[t];
        return `<div style="background:var(--surface);border:1.5px solid ${sel?'var(--accent)':'var(--border)'};border-radius:4px;overflow:hidden">
          <div onclick="toggleCardioTypeSport('${t}')" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;background:${sel?'var(--accent-dim)':'transparent'}">
            <div>${asyIcon(sportIcons[t],24)}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:${sel?'var(--accent)':'var(--text)'}">${sportNames[t]}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">${sportDescs[t]}</div>
            </div>
            <div style="font-size:20px;color:var(--accent);opacity:${sel?1:0}">✓</div>
          </div>
          ${sel ? `<div style="padding:0 14px 14px;border-top:1px solid var(--border)">
            <div style="padding-top:10px;display:flex;flex-direction:column;gap:6px">
              ${(CARDIO_GOALS_BY_TYPE[t]||[]).filter(go => WD.primaryPath!=='both' || !HYBRID_EXCLUDED_GOALS.has(go.id)).map(go => `<div class="goal-option${g?.id===go.id?' selected':''}" onclick="setCardioGoal('${t}','${go.id}')">
                <div class="goal-option-label">${go.label}</div>
                <div class="goal-option-desc">${go.desc}</div>
              </div>`).join('')}
            </div>
            ${g ? `
            ${(g.id==='swim_500_time'||g.id==='swim_100_time') ? `
            <div style="margin-top:10px">
              <div class="input-label" style="margin-bottom:6px">Distance</div>
              <div style="display:flex;gap:0;align-items:stretch">
                <input type="number" class="input-field" style="border-radius:4px 0 0 8px;flex:1;background:var(--surface2);color:var(--muted)" value="${SWIM_GOAL_DIST[g.id]}" readonly>
                <div style="display:flex;gap:0;border:1px solid var(--border2);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;flex-shrink:0">
                  <button onclick="setSwimUnit('yd')" style="font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;cursor:pointer;background:${(g.swimUnit||'yd')==='yd'?'var(--accent)':'var(--surface2)'};color:${(g.swimUnit||'yd')==='yd'?'var(--on-ink)':'var(--muted)'}">yd</button>
                  <button onclick="setSwimUnit('m')" style="font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;border-left:1px solid var(--border2);cursor:pointer;background:${(g.swimUnit||'yd')==='m'?'var(--accent)':'var(--surface2)'};color:${(g.swimUnit||'yd')==='m'?'var(--on-ink)':'var(--muted)'}">m</button>
                </div>
              </div>
            </div>
            <div style="margin-top:10px">
              <div class="input-label" style="margin-bottom:6px">Target time</div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="min" value="${g.targetMins||''}" oninput="WD.cardioGoals['swim'].targetMins=this.value;updatePaceTime('swim');updateSwimPaceDisplay()" min="0" max="99">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
                </div>
                <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="sec" value="${g.targetSecs||''}" oninput="WD.cardioGoals['swim'].targetSecs=this.value;updatePaceTime('swim');updateSwimPaceDisplay()" min="0" max="59">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">seconds</div>
                </div>
              </div>
              <div id="swimPaceLine" style="font-size:12px;color:var(--accent);margin-top:6px;display:${(((+g.targetMins||0)*60)+(+g.targetSecs||0))>0?'block':'none'}">${asyIcon('🎯',13)} ${_clkMS(((+g.targetMins||0)*60)+(+g.targetSecs||0))} is ${_clkMS((((+g.targetMins||0)*60)+(+g.targetSecs||0))/(SWIM_GOAL_DIST[g.id]/100))} per 100 ${g.swimUnit||'yd'}.</div>
            </div>
            <div style="margin-top:8px">
              <div class="input-label" style="margin-bottom:6px">Your most recent timed ${SWIM_GOAL_DIST[g.id]}${g.swimUnit||'yd'}</div>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="min" value="${g.baseMins||''}" oninput="WD.cardioGoals['swim'].baseMins=this.value;updateSwimAdvisory()" min="0" max="99">
                <div style="font-size:20px;color:var(--muted);font-weight:300;flex-shrink:0">:</div>
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="sec" value="${g.baseSecs||''}" oninput="WD.cardioGoals['swim'].baseSecs=this.value;updateSwimAdvisory()" min="0" max="59">
              </div>${_swimAdvisoryHTML()}
            </div>${g.id==='swim_100_time' ? `
            <div style="margin-top:8px">
              <div class="input-label" style="margin-bottom:6px">Your most recent timed 500${g.swimUnit||'yd'}</div>
              <div style="font-size:11px;line-height:1.45;color:var(--muted);margin-bottom:6px">Your repeats key off your 500 pace. Your 100 time sets the goal.</div>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="min" value="${g.base500Mins||''}" oninput="WD.cardioGoals['swim'].base500Mins=this.value;updateSwimAdvisory()" min="0" max="99">
                <div style="font-size:20px;color:var(--muted);font-weight:300;flex-shrink:0">:</div>
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="sec" value="${g.base500Secs||''}" oninput="WD.cardioGoals['swim'].base500Secs=this.value;updateSwimAdvisory()" min="0" max="59">
              </div>
            </div>` : ''}` : g.id==='run_pace_goal' ? `
            <div style="margin-top:10px">
              <div class="input-label" style="margin-bottom:6px">Target distance</div>
              <div style="display:flex;gap:0;align-items:stretch">
                <input type="number" class="input-field" style="border-radius:4px 0 0 8px;flex:1" placeholder="e.g. 1.5" value="${g.targetDist||''}" oninput="WD.cardioGoals['run'].targetDist=this.value;updateRaceDateFeedback()" min="0.1" step="0.1">
                <div style="display:flex;gap:0;border:1px solid var(--border2);border-left:none;border-radius:0 8px 8px 0;overflow:hidden;flex-shrink:0">
                  <button onclick="setPaceUnit('mi')" style="font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;cursor:pointer;background:${(WD.cardioGoals['run']?.paceUnit||'mi')==='mi'?'var(--accent)':'var(--surface2)'};color:${(WD.cardioGoals['run']?.paceUnit||'mi')==='mi'?'var(--on-ink)':'var(--muted)'}">mi</button>
                  <button onclick="setPaceUnit('km')" style="font-family:var(--font-display);font-size:12px;font-weight:700;padding:0 12px;border:none;border-left:1px solid var(--border2);cursor:pointer;background:${(WD.cardioGoals['run']?.paceUnit||'mi')==='km'?'var(--accent)':'var(--surface2)'};color:${(WD.cardioGoals['run']?.paceUnit||'mi')==='km'?'var(--on-ink)':'var(--muted)'}">km</button>
                </div>
              </div>
            </div>
            <div style="margin-top:10px">
              <div class="input-label" style="margin-bottom:6px">Target time</div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="min" value="${g.targetMins||''}" oninput="WD.cardioGoals['run'].targetMins=this.value;updatePaceTime('run');updateRaceDateFeedback()" min="0" max="99">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
                </div>
                <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="sec" value="${g.targetSecs||''}" oninput="WD.cardioGoals['run'].targetSecs=this.value;updatePaceTime('run');updateRaceDateFeedback()" min="0" max="59">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">seconds</div>
                </div>
              </div>
              <div id="paceDisplayLine" style="font-size:12px;color:var(--accent);margin-top:6px;display:${(WD.cardioGoals['run']?.targetMins!==undefined&&WD.cardioGoals['run']?.targetMins!==''&&WD.cardioGoals['run']?.targetDist)?'block':'none'}">${asyIcon('🎯',13)} ${(()=>{ const _t: any=paceGoalTarget(WD.cardioGoals['run']); return _t.tPacePerMile ? _clkMS(_t.tTotalSecs)+' is '+_clkMS(_t.tPacePerMile)+' per mile.' : ''; })()}</div>
              <div id="paceFeasLine" style="display:none"></div>
            </div>
            ${_seedBannerHTML()}<div class="input-group" style="margin-top:8px">
              <div class="input-label">How far can you currently run? (optional)</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" class="input-field" style="flex:1" placeholder="e.g. 1.5" value="${g.baselineDist||''}" oninput="WD.cardioGoals['run'].baselineDist=this.value;WD.cardioGoals['run'].baseline=this.value+(WD.cardioGoals['run']?.paceUnit||'mi');updateRaceDateFeedback()" min="0" step="0.1">
                <span style="font-size:13px;color:var(--muted);flex-shrink:0">${WD.cardioGoals['run']?.paceUnit||'mi'}</span>
              </div>
            </div>
            <div class="input-group" style="margin-top:8px">
              <div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">${_mileFieldHelp()}</span></div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="min" value="${g.mileBestMins||''}" oninput="WD.cardioGoals['run'].mileBestMins=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updateRaceDateFeedback();updateMileAdvisory()" min="3" max="20">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
                </div>
                <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="sec" value="${g.mileBestSecs||''}" oninput="WD.cardioGoals['run'].mileBestSecs=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updateRaceDateFeedback();updateMileAdvisory()" min="0" max="59">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">seconds</div>
                </div>
              </div>${_mileAdvisoryHTML()}
            </div>` : `
            ${t==='run'?_seedBannerHTML():''}<div class="input-group" style="margin-top:10px">
              <div class="input-label">${t==='run'?'How far can you currently run?':t==='bike'?'How long can you currently ride?':'How far can you currently swim?'} (optional)</div>
              <div style="display:flex;gap:8px;align-items:center">
                <input type="number" class="input-field" style="flex:1" placeholder="${t==='run'?'e.g. 3':t==='bike'?'e.g. 20':'e.g. 400'}" value="${g.baselineDist||''}" oninput="WD.cardioGoals['${t}'].baselineDist=this.value;WD.cardioGoals['${t}'].baseline=this.value+'${t==='run'?' mi':t==='bike'?' min':' yd'}'${t==='run'?';updateRaceDateFeedback()':''}" min="0" step="${t==='swim'?'50':'0.5'}">
                <span style="font-size:13px;color:var(--muted);flex-shrink:0">${t==='run'?'mi':t==='bike'?'min':'yards'}</span>
              </div>
            </div>
            ${(t==='run') ? `<div class="input-group" style="margin-top:8px">
              <div class="input-label">Current mile time <span style="color:var(--muted);font-weight:400">${_mileFieldHelp()}</span></div>
              <div style="display:flex;align-items:center;gap:6px">
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="min" value="${g.mileBestMins||''}" oninput="WD.cardioGoals['run'].mileBestMins=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updateRaceDateFeedback();updateMileAdvisory()" min="3" max="20">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">minutes</div>
                </div>
                <div style="font-size:24px;color:var(--muted);font-weight:300;flex-shrink:0;padding-bottom:14px">:</div>
                <div style="flex:1;text-align:center">
                  <input type="number" class="input-field" style="text-align:center" placeholder="sec" value="${g.mileBestSecs||''}" oninput="WD.cardioGoals['run'].mileBestSecs=this.value;WD.cardioGoals['run'].mileBestSrc={kind:'entered'};updateRaceDateFeedback();updateMileAdvisory()" min="0" max="59">
                  <div style="font-size:10px;color:var(--muted);margin-top:3px;font-family:var(--font-display);letter-spacing:0.05em;text-transform:uppercase">seconds</div>
                </div>
              </div>${_mileAdvisoryHTML()}
            </div>` : ''}`}
            ` : ''}
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>
    ${WD.cardioTypes.length && Object.keys(WD.cardioGoals).length ? `
    <div style="background:var(--surface);border:1px solid var(--border2);border-radius:4px;padding:12px 14px;margin-top:4px">
      <div style="font-size:12px;color:var(--muted);line-height:1.6">
        <span id="progLenLine">${progLenLineHTML()}</span>
        ${WD.cardioTypes.length > 1 ? '<br>Sessions rotate across training days. Each sport gets its own days.' : ''}
      </div>
      ${WD.primaryPath==='event' ? `<div style="margin-top:10px">
        <div style="font-size:11px;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">Race date</div>
        <div style="display:flex;gap:0;background:var(--surface2);border:1px solid var(--border2);border-radius:4px;overflow:hidden;margin-bottom:8px">
          <button onclick="WD.eventTargeted=true;if(!WD.raceDate){const t=new Date();WD.raceDate=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');}renderWizardStep()" style="flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:9px;border:none;cursor:pointer;background:${WD.eventTargeted?'var(--accent)':'transparent'};color:${WD.eventTargeted?'var(--on-ink)':'var(--muted)'}">✓ I have a race date</button>
          <button onclick="WD.eventTargeted=false;WD.raceDate='';WD.raceDateWeeks=null;renderWizardStep()" style="flex:1;font-family:var(--font-display);font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;padding:9px;border:none;cursor:pointer;background:${!WD.eventTargeted?'var(--accent)':'transparent'};color:${!WD.eventTargeted?'var(--on-ink)':'var(--muted)'}">✕ Just building fitness</button>
        </div>
        ${WD.eventTargeted ? `<div>
          <div style="font-size:11px;color:var(--muted);font-family:var(--font-display);font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:8px">Race date</div>
          <input type="date" id="raceDateInput"
            value="${WD.raceDate || (()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');})()}"
            min="${(()=>{const t=new Date();return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');})()}"
            oninput="WD.raceDate=this.value;updateRaceDateFeedback()"
            style="width:100%;background:var(--surface2);border:1.5px solid var(--accent);border-radius:4px;color:var(--text);font-family:var(--font-display);font-size:17px;font-weight:700;letter-spacing:0.04em;padding:13px 14px;outline:none;box-sizing:border-box;color-scheme:dark;-webkit-appearance:none;cursor:pointer">
          <div id="raceDateFeedback" style="margin-top:8px"></div>
          <div style="font-size:11px;color:var(--muted);margin-top:8px;line-height:1.5">Tap to open the calendar. The final weeks taper so you arrive fresh.</div>
        </div>` : `<div style="font-size:11px;color:var(--muted);line-height:1.5">${(WD.cardioGoals['run']&&(WD.cardioGoals['run'].id==='run_5k'||WD.cardioGoals['run'].id==='run_10k')) ? 'Runs the full 8-week '+(WD.cardioGoals['run'].id==='run_5k'?'5K':'10K')+' plan and finishes with a '+(WD.cardioGoals['run'].id==='run_5k'?'5K':'10K')+' time trial in place of race day.' : 'Program builds to peak fitness and holds. Pick a race when ready.'}</div>`}
      </div>` : ''}
    </div>` : ''}
    `;
    updateRaceDateFeedback(); // D183 (P-SAFEPACE R2): the one repaint, in this tick: body.innerHTML is set, so every node it paints exists if rendered

  } else if(step === 'lifting_focus') {
    const isEvent = WD.primaryPath === 'event';
    const opts = LIFTING_OPTIONS[isEvent ? 'event' : 'body'];
    const subtitle = isEvent
      ? 'Lifting supports your cardio goal — it should not compete with it.'
      : 'This is your primary focus. Cardio is optional and added next.';
    body!.innerHTML = `<div class="wizard-title">Lifting focus</div>
    <div class="wizard-subtitle">${subtitle}</div>
    <div style="display:flex;flex-direction:column;gap:10px">
      ${opts.map(o => `<div class="option-card${WD.liftingFocus===o.id?' selected':''}" onclick="WD.liftingFocus='${o.id}';renderWizardStep()" style="display:flex;align-items:center;gap:14px;text-align:left;padding:14px 16px">
        <div style="flex-shrink:0">${asyIcon(o.icon,28)}</div>
        <div><div class="option-label">${o.label}</div><div class="option-desc">${o.desc}</div></div>
      </div>`).join('')}
    </div>
    ${WD.primaryPath === 'body' ? `
    <div style="margin-top:12px;background:var(--surface);border:1px solid var(--border2);border-radius:4px;overflow:hidden">
      <div style="padding:10px 14px;font-family:var(--font-display);font-size:11px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--border)">Optional cardio add-on</div>
      <div style="padding:12px 14px;display:flex;flex-direction:column;gap:8px">
        ${['run','bike','swim'].map(t => {
          const icons: Record<string, string>={run:'🏃',bike:'🚴',swim:'🏊'};
          const names: Record<string, string>={run:'Running',bike:'Cycling',swim:'Swimming'};
          const sel = WD.cardioTypes.includes(t);
          return `<div class="cardio-type-card${sel?' selected':''}" onclick="toggleCardioTypeSport('${t}')" style="padding:10px 14px">
            <div style="flex-shrink:0">${asyIcon(icons[t],22)}</div>
            <div style="flex:1"><div class="cardio-type-name" style="color:${sel?'var(--accent)':'var(--text)'};font-size:14px">${names[t]}</div></div>
            <div class="cardio-check" style="opacity:${sel?1:0}">✓</div>
          </div>`;
        }).join('')}
        <div class="cardio-type-card${!WD.cardioTypes.length?' selected':''}" onclick="WD.cardioTypes=[];WD.cardioGoals={};renderWizardStep()" style="padding:10px 14px">
          <div style="flex-shrink:0">${asyIcon('dumbbell',22)}</div>
          <div style="flex:1"><div class="cardio-type-name" style="color:${!WD.cardioTypes.length?'var(--accent)':'var(--text)'};font-size:14px">Lift Only</div></div>
          <div class="cardio-check" style="opacity:${!WD.cardioTypes.length?1:0}">✓</div>
        </div>
      </div>
    </div>` : ''}`;

  } else if(step === 'days') {
    const _trainDays = ALL_DAYS_ORDER.filter(x => !WD.restDays.includes(x));
    const _advisories = getDayAdvisories();
    const _minDays = getMinTrainDays();
    const _trainCount = _trainDays.length;
    const _atFloor = _trainCount <= _minDays;

    // When at the floor, surface a persistent explanation banner so the user understands
    // WHY days are locked — not just a transient toast. Names their actual goal and the why.
    const _floorReason = (()=>{
      const cardioTypes = WD.cardioTypes || [];
      const cardioGoals = WD.cardioGoals || {};
      const labels: any[] = [];
      cardioTypes.forEach(s => { if(cardioGoals[s]) labels.push(goalLabel(cardioGoals[s].id)); });
      if(labels.length) return labels.join(' + ');
      return null;
    })();
    const _floorBanner = _atFloor
      ? '<div style="margin-top:10px;background:rgba(var(--ink-rgb),0.12);border:1px solid rgba(var(--ink-rgb),0.35);border-radius:4px;padding:12px 14px">' +
          '<div style="font-size:13px;color:var(--accent);font-weight:700;line-height:1.5;margin-bottom:4px">'+asyIcon('🔒',13)+' You\'re at your minimum training days</div>' +
          '<div style="font-size:12px;color:var(--text);line-height:1.5">' +
            (_floorReason
              ? 'Your <b>' + _floorReason + '</b> goal needs at least <b>' + _minDays + ' training days a week</b> to build the volume safely and avoid injury. To add more rest, ease your goal or pick a shorter distance.'
              : 'Three days a week is the floor, cardio or no cardio. Two gives you the same session twice with nowhere to put the hard work. Three is where real training days start.') +
          '</div>' +
        '</div>'
      : '';

    // Other advisories (lifting volume, interval protection) — only shown when NOT the floor reason
    const _advisoryHtml = (_advisories.length && !_atFloor)
      ? '<div style="margin-top:10px;background:rgba(var(--ink-rgb),0.10);border:1px solid rgba(var(--ink-rgb),0.28);border-radius:4px;padding:11px 14px;display:flex;flex-direction:column;gap:8px">' +
          _advisories.map(a => '<div style="font-size:12px;color:var(--accent);line-height:1.5">' + a + '</div>').join('') +
        '</div>'
      : '';
    body!.innerHTML = `<div class="wizard-title">Rest days</div>
    <div class="wizard-subtitle">All days are training days by default. Tap to mark as rest.</div>
    <div class="day-grid">${ALL_DAYS_ORDER.map(d => {
        const isRest = WD.restDays.includes(d);
        const wouldBlock = !isRest && _atFloor;
        const opacity = wouldBlock ? 'opacity:0.5;' : '';
        return '<div class="day-toggle' + (isRest?' rest':'') + '" style="' + opacity + '" onclick="toggleRestDay(\'' + d + '\')"><div style="line-height:1">' + DAY_SHORT[d] + '</div>' + (isRest ? '<div style="font-size:9px;margin-top:2px;opacity:0.5">✕</div>' : (wouldBlock ? '<div style="font-size:9px;margin-top:2px;opacity:0.6">'+asyIcon('🔒',10)+'</div>' : '')) + '</div>';
      }).join('')}</div>
    <div style="font-size:12px;color:var(--muted);margin-top:6px">Gold = training · Grey = rest · <b style="color:var(--text)">${_trainDays.length} training day${_trainDays.length===1?'':'s'}</b> selected</div>
    ${_floorBanner}
    ${_advisoryHtml}`;

  } else if(step === 'name') {
    const internalGoal = LIFTING_FOCUS_TO_GOAL[WD.liftingFocus] || WD.liftingFocus;
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ st
    const liftLabel = ({strength:'Strength',hypertrophy:'Size',fatloss:'Fat Loss',balanced:'Balanced',support_strength:'Strength Support',support_athletic:'Athletic Support',support_prevention:'Injury Prevention'})[WD.liftingFocus]||WD.liftingFocus;
    const cardioSummary = WD.cardioTypes.length
      // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
      ? WD.cardioTypes.map(t => asyIcon(({run:'🏃',bike:'🚴',swim:'🏊'})[t],15)+' '+({run:'Run',bike:'Bike',swim:'Swim'})[t] + (WD.cardioGoals[t]?.label?': '+WD.cardioGoals[t].label:'')).join(' + ')
      : 'Lift only';
    const trainDays = ALL_DAYS_ORDER.filter(d => !WD.restDays.includes(d));
    const _nameGoalsExp={...WD.cardioGoals,_experience:WD.experience,_ageBracket:WD.ageBracket,_eventTargeted:WD.eventTargeted};
    const programWeeks = (wizardTestPin()||{}).tw || (WD.cardioTypes.length ? calcProgramLength(WD.cardioTypes,_nameGoalsExp,internalGoal).weeks : 6);   // D183 (P-SAFEPACE R3): a dated test pins the length
    if(!WD.name) WD.name = liftLabel + ' Block ' + (getPrograms().length+1);
    if(!WD.startDate) WD.startDate = _isoToday();                         // V174 (D20): never empty
    const _sr = resolveStartDate(WD.startDate, WD.restDays||[], _rsRace(WD));   // V174 (D21/D24/D25), D184 (c)
    body!.innerHTML = `<div class="wizard-title">Name your program</div>
    <div class="wizard-subtitle">Give it something you will recognize, and tell it when to begin.</div>
    <div class="input-group"><div class="input-label">Program name</div><input type="text" class="input-field" value="${WD.name}" oninput="WD.name=this.value" maxlength="40"></div>
    ${(()=>{ const _al=wizardAlignment(); return _al
      ? `<div class="input-group"><div class="input-label">Start date</div><div class="input-field derived"><span>${_fmtStartDay(_al.start,true)}</span><span class="src">set by race date</span></div><div class="start-resolve${_al.underFloor?' warn':''}" id="startResolve">${alignedStartCopy(_al)}</div>${alignedPipsHTML(_al)}</div>`
      : `<div class="input-group"><div class="input-label">Start date</div><input type="date" class="input-field" id="wizStartDate" value="${WD.startDate}" onchange="WD.startDate=this.value;updateStartResolve()"><div class="start-resolve" id="startResolve">${startResolveCopy(_sr)}</div></div>`; })()}
    <div class="summary-block">
      <div class="summary-block-header">Program Summary</div>
      ${[
        ['Path', ({event:'Race / Event',body:'Strength / Physique',both:'Hybrid'} as Record<string, string>)[WD.primaryPath]],
        ...(WD.primaryPath==='event'&&WD.raceDate?[['Race date', _fmtStartDay(WD.raceDate, true)+(()=>{ /* D182 (V223): the number is raceCountdown's, so this row and the card cannot drift; past the race, "behind you" */ const cd: any=raceCountdown(WD.raceDate), w=raceCountdownWords(cd); return !w ? '' : cd.days<=0 ? ' ('+w.copy+')' : ' ('+w.card+' away)'; })()]]:WD.primaryPath==='event'?[['Race date','No date set — no taper']]:[] ),
        ['Lifting', liftLabel],
        ['Cardio', cardioSummary],
        ['Program length', programWeeks + (programWeeks === 1 ? ' week' : ' weeks')],
        ['Start date', '<span id="sumStartDate">'+wizardStartSummary(_sr)+'</span>'],
        ['Training days', trainDays.map(d=>DAY_SHORT[d]).join(' · ')],
        ['Rest days', WD.restDays.length?WD.restDays.map(d=>DAY_SHORT[d]).join(' · '):'None'],
        ['Experience', WD.experience],
        ['Age range', WD.ageBracket],
        ['Equipment', ({home_full:'Home Full',home_basic:'Home Basic',commercial:'Commercial Gym',crossfit:'CrossFit Box',bodyweight:'Bodyweight only',minimal:'Minimal / Travel'} as Record<string, string>)[WD.equipment]||WD.equipment],
      ].map(([k,v]) => `<div class="summary-row"><span class="summary-key">${k}</span><span class="summary-val">${v}</span></div>`).join('')}
    </div>`;
  }
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  CARDIO_GOALS_BY_TYPE, DAY_FULL, GOAL_RECOMMENDED_DAYS, HYBRID_EXCLUDED_GOALS, WD, _GOAL_RANK, _GOAL_REQ_INPUTS,
  _applyWizardStart, _fmtStartDay, _rsRace, _setCurrentRandDayKey, _setLastRandIdx, lastRandIdx, renderWizardStep,
  resolveStartDate,
};
