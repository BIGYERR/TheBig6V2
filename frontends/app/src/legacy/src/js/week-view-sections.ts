import { asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { completedKey, esc, getCompleted, getLogs, logKey } from './storage.ts';
import { _setCurrentWeek, activeProg, currentWeek, openRestSheet, showToast } from './rest-day-shell.ts';
import { ALL_DAYS_ORDER, _parseLocalDate, getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { DAY_FULL, _fmtStartDay } from './wizard.ts';
import { INJURY_REGIONS } from '../../../../../../core/src/engine/injury.ts';
import { updateRandCounter, wildcardMarkHTML, wildcardOn, wildcardTagHTML } from './random-wildcard.ts';
import { buildExItem } from './set-logging.ts';
import { openDetail } from './day-detail.ts';
import { progAlignment } from './programs.ts';
import { _liveInjuryOverlay, dayIsTravel, overlayWeekRange, renderOverlayChip, travelTagHTML } from './overlays.ts';
import { computeStreak, statusOf } from './popups-streaks-reminders.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// WEEK VIEW
const allDaysList=ALL_DAYS_ORDER;
// dayOffset: days from Monday to reach each day (Mon=0...Sun=6)
// Used to calculate actual calendar date for each training day
const dayOffset: Record<string, any>={mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6};
const tagMeta: Record<string, any>={test:{cls:'t-test',label:'Test Week'},peak:{cls:'t-peak',label:'Peak Week'},run:{cls:'t-run',label:'Run'},bike:{cls:'t-bike',label:'Bike'},swim:{cls:'t-swim',label:'Swim'},lift:{cls:'t-lift',label:'Lift'},hip:{cls:'t-hip',label:'Hip'},core:{cls:'t-core',label:'Core'}};

// ── V174 (D24/D26): before-start days and the partial first week ──────────────
// A start on any weekday leaves week 1 with days BEFORE the start. They are outside
// the block: not missed, not pending, no reminder, no tap. Only week 1 can hold them
// (week 1 is the week containing the start by construction), but the predicate is
// written on dates so a back-dated setProgStart resolves the same way.
function _progDayDate(prog: any, week: any, d: any){
  if(!prog||!prog.startDate) return null;
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ mo
  const off = {mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6}[d]; if(off==null) return null;
  const mon = getWeekMonday(prog.startDate);
  const dt = new Date(mon); dt.setDate(mon.getDate()+(week-1)*7+off); dt.setHours(0,0,0,0);
  return dt;
}
function dayBeforeStart(prog: any, week: any, d: any){
  if(!prog||!prog.startDate) return false;
  const dt = _progDayDate(prog, week, d); if(!dt) return false;
  const sd = _parseLocalDate(prog.startDate); if(!sd) return false;
  if(dt < sd) return true;
  // V188 (D14a): on a race-aligned program the weeks before the day it was created are
  // behind the athlete — same cell, same exclusions, not missed. Only alignment writes
  // blockOpen, so a manual setProgStart back-date keeps V174 behaviour.
  if(prog.blockOpen){ const bo = _parseLocalDate(prog.blockOpen); if(bo && dt < bo) return true; }
  return false;
}
// D26: a program whose start is not a Monday has a short week 1. Accumulating Progress
// metrics (sums, maxes) skip it the way they skip the D6 cut week — a 2-day week is not
// a light week, it is a truncated one. Means and per-observation modules keep it.
function _partialWeek1(prog: any){
  if(!prog||!prog.startDate) return false;
  const sd=_parseLocalDate(prog.startDate); if(!sd) return false;
  return getWeekMonday(prog.startDate).getTime() !== sd.getTime();
}
function calcCurrentWeek(){
  if(!activeProg?.startDate) return 1;
  // Anchor to the Monday of the start date's week
  const weekMon=getWeekMonday(activeProg.startDate);
  const today=new Date();today.setHours(0,0,0,0);
  // @ts-expect-error TS2362 The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type
  const diff=Math.floor((today-weekMon)/86400000);
  if(diff<0) return 1;
  const totalWeeks=activeProg.totalWeeks||6;
  return Math.min(totalWeeks,Math.floor(diff/7)+1);
}

// ── Rest-day recovery tips — paraphrased from the NSW Physical Fitness Guide
//    (Ch.7 Flexibility / cool-down section; hydration & nutrition chapters). ──
const STRETCH_TIPS=[
  "Strength and flexibility are interdependent — every muscle you train hard should get stretched, and the reverse holds too.",
  "Hard lifting causes micro-trauma, and recovering muscle tends to shorten. Stretching prevents the shortening that becomes strains and tendonitis.",
  "The most effective stretches are slow and held 15–30 seconds — long enough for the muscle to stop resisting and actually lengthen.",
  "Ease into a stretch. Yank into it and the stretch reflex fires, the muscle contracts against you, and you gain nothing.",
  "Static stretching — slow, held positions — is your cool-down tool: it eases post-exercise spasm, fatigue, and soreness.",
  "Save dynamic stretching — controlled leg and arm swings — for before training, to prime the muscles for what's coming.",
  "Never bounce a stretch. Ballistic, jerky movement trips the stretch reflex and risks injury while doing nothing for flexibility.",
  "Cold muscles don't stretch. Warm up with a few minutes of easy movement first, then stretch — or you're inviting a tear.",
  "Stretching is not a warm-up. Warm up to raise muscle temperature and blood flow first; stretch second.",
  "A flexible joint with weak surrounding muscle is a joint waiting to sprain. Stretch the joint and train what supports it.",
  "Take a stretch to mild tightness and hold — never to pain. Balanced with strength work, the injury risk is negligible.",
  "After a run, walk a few minutes to cool down, then stretch hamstrings, quads, hip flexors, groin, and calves.",
  "Tight calves and Achilles change your stride and load your knees — give them dedicated time on a rest day.",
  "PNF builds range fast with a partner: passive stretch 15s, contract 7–15s, then stretch to the new range. Repeat up to five times.",
  "Keep PNF to no more than three to five sessions a week — like lifting, it needs recovery.",
  "Flexibility is range of motion you can control — it widens the zone where you can actually put out power.",
  "Dynamic stretches should mimic the work ahead; static stretches are for after, when you're cooling down.",
  "Strengthening the muscles around a stretched joint is what makes flexibility protective instead of risky.",
  "Signals from a held stretch slow down as the muscle adapts — that's why patience, not force, earns new range.",
  "Two rules keep a rest-day stretch productive: don't stretch cold, and don't stretch into pain."
];
const NUTRITION_TIPS=[
  "Carbohydrate refills the muscle glycogen you burned — make it the backbone of recovery-day meals.",
  "Protein need tops out around 0.6–0.8 g per pound of bodyweight a day. More won't build extra muscle — it just taxes your kidneys.",
  "For a 175-lb operator that's roughly 105–140 g of protein a day — and a 6-oz can of tuna already brings 48.",
  "Cheap protein is everywhere: tuna (48 g a can), chicken breast (36 g per 4 oz), a glass of skim milk (10 g).",
  "Thirst is a poor hydration gauge — by the time you feel it you're already behind. Drink at regular intervals.",
  "Dehydration shows up as light-headedness, fatigue, and headache before you clock it. Stay ahead of it.",
  "On any effort past 90 minutes, take in about 8 oz of fluid every 30 minutes — especially in heat.",
  "Under load, aim for one to two cups of fluid every 30 minutes — performance collapses fast once you're dry.",
  "Alcohol and heavy caffeine pull water out of you and erode heat acclimation. Go easy around hard training.",
  "Training in heat, you can lose 8–10 liters of sweat in a day. Replace it steadily — but no more than about 5 cups an hour.",
  "Frequent water breaks beat occasional big gulps — steady intake is what keeps heat stroke off the table.",
  "Sleep loss, alcohol, dehydration, and inactivity all strip away heat acclimation you worked to build.",
  "Aerobic fitness speeds heat acclimation — but it's a head start, not a substitute for training in the heat.",
  "In the cold, shivering burns glycogen fast. Carbs are your refuel — and hydrate even when you're not thirsty.",
  "Muscle is mostly protein, and hard training breaks it down before it rebuilds. Keep protein steady on recovery days too.",
  "Hit the window after hard work: carbohydrate to restock the tank, protein to repair the damage.",
  "Dry, cold, and high-altitude air pull water out through your breath — hydrate on a schedule; thirst won't warn you.",
  "As you acclimate to heat, sweat turns more dilute to spare electrolytes — but you still need to replace salt and fluid.",
  "Match the drink to the job: plain water for most sessions, carbs for long endurance, a little protein when you're building.",
  "Don't out-eat your kidneys — protein beyond ~0.8 g/lb isn't stored as muscle, just filtered out as waste."
];
function restDayTip(){
  const dayIx=Math.floor(Date.now()/86400000);
  const useStretch=dayIx%2===0;
  const pool=useStretch?STRETCH_TIPS:NUTRITION_TIPS;
  const tip=pool[Math.floor(dayIx/2)%pool.length];
  return {label:useStretch?'Mobility \u00b7 rest-day stretch':'Fuel \u00b7 recovery nutrition',text:tip,src:'NSW Physical Fitness Guide'};
}
// ── Consecutive scheduled days completed/partial through today; rest days neutral. ──
// computeStreak lived HERE as a second, different implementation until V122. It walked the
// calendar back 120 days off activeProg.startDate. It was DEAD CODE the whole time:
// function declarations hoist, so the later definition (~line 10440) always won, and
// node --check passes a duplicate without a word. Mario's call was to keep the later one,
// which walks scheduledDays() and treats a pending day as transparent, on the grounds that
// it is what the app has actually been showing. Removed rather than left in place so the
// next reader does not debug the version that never ran.
// ── Up to 3 preview rows for the hero card: cardio first, then top lifts. ──
function heroSummary(day: any){
  var names: any[]=[];
  (day.sections||[]).forEach(function(sec: any){(sec.items||[]).forEach(function(it: any){if(it.name)names.push(it.name);});});
  var parts=[];
  if(names.length){ parts.push(names.length>1?names[0]+' + '+(names.length-1)+' more':names[0]); }
  if(day.cardio){
    var ct=(day.cardio.type||'').toLowerCase();
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
    var tn={run:'run',bike:'bike',swim:'swim'}[ct]||ct||'cardio';
    var d=(day.cardio.detail||'').split('\n')[0].replace(/<[^>]+>/g,'');
    // V146: the old pair was /\s*mi/i tested BEFORE /\s*min/i, and "mi" with no word
    // boundary matches the "mi" inside "min" — so every minute-dosed session printed as
    // miles ("72 min continuous" -> "72 mi"). Measured at 252 of 312 bike days. Both
    // patterns now carry \b, and both accept the long spellings the engine actually
    // emits: "15-minute recovery run", "20 mins", "3.1 mile run". Note a bare mi\b would
    // MISS "3.1 mile", so the (?:le)?s? tail is load-bearing, not decoration.
    // Minutes tested FIRST, matching sessionTimeEst — the one implementation in this file
    // that always had this right. Measured across 965 cardio lines: 482 carry minutes, 180
    // carry miles, 303 carry neither, and ZERO carry both. So precedence is currently moot
    // and the \b is what actually does the work; an earlier draft here ordered the branches
    // by match position, which was untestable dead logic and is gone. If the engine ever
    // emits a line carrying both ("4 mi in 30 min"), position-order is the right rule and
    // this becomes a real decision rather than a formality.
    var mn=d.match(/(\d+(?:\.\d+)?)[\s-]*min(?:ute)?s?\b/i);
    var mi=d.match(/(\d+(?:\.\d+)?)[\s-]*mi(?:le)?s?\b/i);
    var sub=day.cardio.subtype?day.cardio.subtype.replace(/_/g,' '):'';
    var cstr=mn?mn[1]+' min '+(sub||tn):mi?mi[1]+' mi '+(sub||tn):(sub?sub+' '+tn:tn);
    parts.push(cstr);
  }
  // V146: joined with a break, not a middot. The single centered uppercase run-on wrapped
  // wherever it landed and split prescriptions mid-phrase ("... - 80 / MI LONG RIDE").
  // Breaking at the seam gives two deliberate lines instead of two ragged ones.
  return parts.join('<br>');
}
function sessionTimeEst(day: any){
  // Honest model: main-lift sets carry their full 2–3 min rest, supersets absorb
  // rest by alternating, holds/prehab are quick, cardio is timed off the printed
  // pace when one exists. The old flat 1.6 min/set undercounted heavy rest and
  // shipped a ~65 on days that ran 85+ in the real world.
  var mins=8; // warmup
  (day.sections||[]).forEach(function(sec: any){
    var L=((sec&&sec.label)||'').toLowerCase();
    var isMain=/^main\b|^primer|^power\b|^strength\b/.test(L);
    var isSuper=!!(sec&&sec.superset)||/superset|rounds|circuit|conditioning/.test(L);
    // V190 (D39): this carried its own copy of the banner's broken regex — same
    // `^(\d+)×`, same hardcoded 3 — so 21.9% of items were counted as 3 sets when they
    // were 2 or 4, and 45.7% of days shipped a wrong estimate. Item first (it holds the
    // true per-item count in BOTH grammars now), then the section, and only then 3.
    var _secR=_secRounds(sec);
    ((sec&&sec.items)||[]).forEach(function(it: any){
      var sets=_itemSets(it.detail);
      if(sets==null) sets=(_secR!=null?_secR:3);
      var n=(it.name||'').toLowerCase();
      if(/stretch|mobility|90\/90|foam|worlds greatest/.test(n)) mins+=sets!*0.75;
      else if(/carry/.test(n)) mins+=sets!*1.2;
      else if(/plank|pallof|dead bug|bird dog|wall sit|\bhold\b|hang|wiper|hollow|clamshell|side steps|side-lying|leg raises/.test(n)) mins+=sets!*1.0;
      else if(isMain) mins+=sets!*3.2;
      else if(isSuper) mins+=sets!*1.4;
      else mins+=sets!*2.0;
    });
  });
  if(day.cardio){
    var d=(day.cardio.detail||'');
    var mn=d.match(/(\d+)\s*min/i), mi=d.match(/(\d+(?:\.\d+)?)\s*mi\b/i), pace=d.match(/(\d+):(\d\d)\s*\/\s*mi/);
    if(mn)mins+=parseInt(mn[1]);
    else if(mi&&pace)mins+=parseFloat(mi[1])*(parseInt(pace[1])+parseInt(pace[2])/60);
    else if(mi)mins+=parseFloat(mi[1])*10;
    else mins+=20;
    mins+=4; // transition — shoes, water, shakeout
  }
  mins=Math.round(mins/5)*5;
  return Math.max(5,mins);
}
function buildHeroPreview(day: any){
  const rows=[];
  if(day.cardio){
    const ct=(day.cardio.type||'').toLowerCase();
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
    const tn={run:'Run',bike:'Bike',swim:'Swim'}[ct]||(day.cardio.type||'Cardio');
    const sub=day.cardio.subtype?day.cardio.subtype.replace(/_/g,' '):'';
    // V141: a segmented swim's flat detail begins with the warmup line — the preview
    // should lead with the main work, not "Warm up: 200 yd", so prefer the main-set
    // segment when one exists. Flat sessions are untouched.
    let _src=(day.cardio.detail||'');
    if(day.cardio.segments&&day.cardio.segments.length){
      const _m=day.cardio.segments.find(function(sg: any){return /^main/i.test(sg.label||'');});
      if(_m) _src=_m.text||_src;
    }
    let det=_src.split('\n')[0].replace(/<[^>]+>/g,'').trim();
    if(det.length>26) det=det.slice(0,26)+'\u2026';
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ ru
    const cc={run:'var(--run)',bike:'var(--bike)',swim:'var(--swim)'}[ct]||'var(--accent)';
    rows.push('<div class="wk-presc-row"><span class="wk-presc-name" style="color:'+cc+'">'+tn+(sub?' \u00b7 '+sub:'')+'</span><span class="wk-presc-det" style="color:'+cc+'">'+(det||'\u2014')+'</span></div>');
  }
  const items: any[]=[];
  (day.sections||[]).forEach(function(sec: any){(sec.items||[]).forEach(function(it: any){if(it.name)items.push(it);});});
  const room=Math.max(0,3-rows.length);
  items.slice(0,room).forEach(function(it){
    rows.push('<div class="wk-presc-row"><span class="wk-presc-name">'+it.name+'</span><span class="wk-presc-det">'+(it.detail||'')+'</span></div>');
  });
  return rows.join('');
}
// ── Open a day's session sheet from the strip / hero / up-next. ──
function openDayKey(d: any){
  const day=activeProg&&activeProg.weeks&&activeProg.weeks[currentWeek]&&activeProg.weeks[currentWeek][d];
  if(!day) return;
  if(dayBeforeStart(activeProg,currentWeek,d)){ showToast('Before your start date'); return; }   // V174 (D24)
  // Rest days used to dead-end here. Today's and past rest days now open the rest sheet
  // so an unplanned session or a bonus run has somewhere to go. v0.240.0 (D231 item 2): a future
  // one asks the sheet too, which answers with its toast instead of silence.
  if(day.rest){ openRestSheet(currentWeek,d); return; }
  openDetail(d,day);
}
// ── Day codes for the week strip (cardio modality above, focus below). ──
function liftFocusCode(t: any){
  t=(t||'').toLowerCase();
  if(/full body|full upper|full lower|\bfull\b/.test(t)) return 'FULL';
  if(/upper/.test(t)) return 'UPPER';
  if(/lower/.test(t)) return 'LOWER';
  if(/legs?|squat|quad|lunge/.test(t)) return 'LEGS';
  if(/deadlift|\bpull\b|\brow\b|\bback\b|snatch/.test(t)) return 'PULL';
  if(/bench|press|push|chest|shoulder|overhead/.test(t)) return 'PUSH';
  var w=(t.replace(/[^a-z ]/g,' ').trim().split(/\s+/)[0]||'lift');
  return w.slice(0,5).toUpperCase();
}
function runSessionCode(sub: any, key: any, type: any){
  // D103a (V208): a keyed NSW session wears the chip of its key, whatever its label says. The
  // CHI is the Long Interval (LI) and the INT the Short Interval (SI). long and easy have no row:
  // their chip is the label's (LSD on the pace family, EASY on run_base). The test wears TEST, as
  // the benchmark does.
  var K: Record<string, string>={int:'SI', chi:'LI', steady:'STDY', bench:'TEST', trial:'TEST'};
  if(key && K[key]) return K[key];
  var s=(sub||'').toLowerCase(), run=!type||type==='run';
  // Unkeyed and frozen strings, before the generic interval test ("long interval" contains
  // "interval"): both names of each run class wear one chip. A frozen run's old names read LI and
  // SI; bike and swim keep their own CHI and INT names, so their chips keep CHI and INT. A bare
  // "interval" with no parenthetical (Nike's "Speed Run — Intervals") keeps INT.
  if(s.indexOf('long interval')>=0||s.indexOf('(li)')>=0) return 'LI';
  if(s.indexOf('short interval')>=0||s.indexOf('(si)')>=0) return 'SI';
  if(s.indexOf('continuous high')>=0) return run?'LI':'CHI';
  if(s.indexOf('(int)')>=0) return run?'SI':'INT';
  if(s.indexOf('interval')>=0) return 'INT';
  if(s.indexOf('steady aerobic')>=0) return 'STDY';
  if(s.indexOf('easy run')>=0) return 'EASY';
  if(s.indexOf('benchmark')>=0) return 'TEST';
  if(s.indexOf('long slow')>=0||/\blsd\b/.test(s)) return 'LSD';
  return 'RUN';
}
function dayCode(day: any){
  if(!day||day.rest) return {top:'',topColor:'#5f5f62',bot:'REST',botColor:'#5f5f62'};
  var liftSections=(day.sections||[]).some(function(s: any){return !s.core&&!s.hip&&(s.items||[]).length;});
  var c=day.cardio, ctype=(c&&c.type||'').toLowerCase();
  var top=ctype==='run'?'RUN':ctype==='bike'?'BIKE':ctype==='swim'?'SWIM':'';
  var topColor=ctype==='run'?'#5e8c54':(ctype==='bike'||ctype==='swim')?'#3f6e96':'#5f5f62';
  var bot, botColor;
  if(liftSections){ bot=liftFocusCode(day.title); botColor='#bc6a43'; }
  else if(c){ bot=runSessionCode(c.subtype||'', c.dose&&c.dose.key, c.type); botColor=topColor; }
  else { bot=liftFocusCode(day.title); botColor='#bc6a43'; }
  return {top:top,topColor:topColor,bot:bot,botColor:botColor};
}
function _onGold(hex: any){
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ '#
  return {'#5e8c54':'#1c5f2c','#3f6e96':'#0a3a66','#bc6a43':'#7a3410','#5f5f62':'#3a2c08','#a6822f':'#7a4d00'}[hex]||'#3a2c08';
}
// ── V146: week-strip positioning ──────────────────────────────────────────────
// The strip used to sit at scrollLeft 0 forever, so from week 6 on the week you were
// actually training was off-screen. Note the old behaviour was not "keeps your scroll
// position" — wscroll.innerHTML='' collapses the scroll and the browser clamps to 0, so
// every render already threw the position away. Nothing is lost by placing it ourselves.
//
// Cold boot gets a one-time scoot: strip starts at week 1 and travels to the current
// week with the highlight counting up behind it. Every later render sets the position
// instantly — a greeting that fires on every set you log is a tic, not a greeting.
let _wkScootDone=false, _wkScootRaf=0, _wkScootTmr=0, _wkScootEl: any=null;
function _wkReduceMotion(){
  try{ return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  catch(e){ return false; }
}
// Resting position for the active chip: flush to the app's 16px grid line, clamped both
// ends. offsetLeft is NOT usable here — .week-scroll has no position set, so its
// offsetParent is an ancestor and the number would be measured from the wrong origin.
// The rect delta is origin-independent and correct regardless of where the chip sits.
function _wkStripTarget(el: any,btn: any){
  if(!el||!btn||!el.clientWidth) return null;
  const l=btn.getBoundingClientRect().left-el.getBoundingClientRect().left+el.scrollLeft;
  const max=Math.max(0,el.scrollWidth-el.clientWidth);
  return Math.max(0,Math.min(max,l-16));
}
function _wkScootCancel(){
  if(_wkScootRaf){ cancelAnimationFrame(_wkScootRaf); _wkScootRaf=0; }
  if(_wkScootTmr){ clearTimeout(_wkScootTmr); _wkScootTmr=0; }
  // A cancelled scoot must not leave transitions suppressed on the live strip.
  if(_wkScootEl){ _wkScootEl.classList.remove('wk-scooting'); _wkScootEl=null; }
}
// V147: was easeOutBack. Measured off a device recording, that curve had three faults.
// It begins at 4.7x average velocity — an "out" easing starts at maximum speed by
// definition — so the strip jump-cut rather than scooted. It crosses 1.0 at t=0.37 and
// peaks at 1.0999, i.e. ~10% of travel, which on a 396px run is ~40px past target: the
// current-week chip was driven to -24px and sat clipped against the left edge for ~200ms.
// This curve accelerates from rest and the overshoot is now applied as a capped pixel
// amount in _wkScoot rather than baked into the easing as a ratio of distance.
function _wkScootEase(t: any){ return t<0.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
// V147 overshoot: a capped number of PIXELS past target, not a fraction of the distance.
// Travel runs to `peak` for the first 76% of the duration, then eases back to `to`.
// Deep in a program `peak` clamps to max scrollLeft and the bump flattens to a glide —
// accepted; the alternative is hand-rolling scroll physics on a transform layer.
const _WK_OVERSHOOT_PX=12, _WK_SPLIT=0.76;
function _wkScoot(el: any,to: any,cur: any){
  const btns=el.querySelectorAll('.week-btn');
  if(!btns.length) return;
  // @ts-expect-error TS7006 Parameter 'n' implicitly has an 'any' type.
  const paint=n=>{ for(let i=0;i<btns.length;i++) btns[i].classList.toggle('active',(i+1)===n); };
  if(to<=0){ el.scrollLeft=0; paint(cur); return; }
  el.scrollLeft=0;
  // Content-space chip offsets, measured once. V147: the highlight is derived from these
  // and the live scroll position — whichever chip is parked nearest the grid line is the
  // one lit. The previous build ran a PARALLEL counter, 1+(cur-1)*e, on the assumption
  // that chips are uniform width. They are not: a plain "Wk 1" measures ~55px, the
  // current week carries a dot at ~67px, and two-digit weeks are wider again. So the
  // counter drifted off the real cumulative offsets and lit a chip that was scrolled off
  // the left edge — on device the strip showed NO highlighted chip at all for ~217ms.
  // Deriving it from the same number that moves the strip makes desync impossible.
  const base=el.getBoundingClientRect().left+el.scrollLeft;
  const off: any[]=[]; for(let i=0;i<btns.length;i++) off.push(btns[i].getBoundingClientRect().left-base);
  const max=Math.max(0,el.scrollWidth-el.clientWidth);
  const peak=Math.min(max,to+Math.min(_WK_OVERSHOOT_PX,to*0.05));
  // @ts-expect-error TS7006 Parameter 'sl' implicitly has an 'any' type.
  const chipAtLine=sl=>{
    const x=sl+16; let best=1,bd=Infinity;
    for(let i=0;i<off.length;i++){ const d=Math.abs(off[i]-x); if(d<bd){ bd=d; best=i+1; } }
    return Math.max(1,Math.min(cur,best));
  };
  paint(chipAtLine(0));
  _wkScootEl=el; el.classList.add('wk-scooting');
  let t0: any=null;
  // @ts-expect-error TS7006 Parameter 'ts' implicitly has an 'any' type.
  const step=ts=>{
    if(t0===null) t0=ts;
    const p=Math.min(1,(ts-t0)/550);
    let sl;
    if(p<_WK_SPLIT) sl=peak*_wkScootEase(p/_WK_SPLIT);
    else { const q=(p-_WK_SPLIT)/(1-_WK_SPLIT); sl=peak+(to-peak)*_wkScootEase(q); }
    el.scrollLeft=sl;
    paint(chipAtLine(sl));
    if(p<1){ _wkScootRaf=requestAnimationFrame(step); }
    else { _wkScootRaf=0; el.scrollLeft=to; paint(cur);
           el.classList.remove('wk-scooting'); _wkScootEl=null; }
  };
  _wkScootTmr=setTimeout(()=>{ _wkScootTmr=0; _wkScootRaf=requestAnimationFrame(step); },260);
}
// V238 (D224 rest hero H1 as restated in Amendment 1 A2, and the journal): the rest hero's sentence for
// a day's rest-day jog record, one string per restLog type that holds mins, in restLog's key order,
// e.g. "37 min run logged · RPE 7". The sport words are the hero's map; a missing RPE prints the
// hero's dash. The journal prints the same strings, so the two never word a jog differently. A type
// with no mins (a legacy lensed run that kept only its distance) has no line: the lens invents nothing.
// v0.240.0 (D229): the sport words and distance units a rest-day record speaks in. Walk carries no distance (A6).
const REST_WORD: Record<string, string>={run:'run',bike:'ride',swim:'swim',row:'row',walk:'walk'};
const REST_UNIT: Record<string, string>={run:'mi',bike:'mi',swim:'yd',row:'m'};
// A record's distance in its sport's unit, or 0 (walk and unknown types never carry one).
function restDist(t: any,r: any){ return (REST_UNIT[t]&&r&&+r.dist>0)?Math.round(+r.dist*100)/100:0; }
// The head of a record's sentence: the time when it holds one (whole minutes; the stored seconds stay), else the distance.
function restLogHead(t: any,r: any){
  const m=(r&&+r.mins>0)?Math.round(+r.mins):0, d=restDist(t,r);
  return m>0?m+' min '+(REST_WORD[t]||t):d+' '+REST_UNIT[t]+' '+(REST_WORD[t]||t);
}
// v0.240.0 (D229 item 4): one line per type that holds a time or a distance, in key order: the head, logged, the
// distance after the time when it holds both, the RPE last. A line without a distance is byte-identical to V238's.
function restLogLines(rl: any){
  if(!rl||typeof rl!=='object') return [];
  return Object.keys(rl).filter(t=>rl[t]&&(+rl[t].mins>0||restDist(t,rl[t])>0)).map(t=>{
    const r=rl[t], d=restDist(t,r);
    return restLogHead(t,r)+' logged'+(+r.mins>0&&d>0?' · '+d+' '+REST_UNIT[t]:'')+' · RPE '+(r.rpe||'—');
  });
}
function renderWeekView(){
  if(!activeProg) return;
  const nm=activeProg.name.length>26?activeProg.name.slice(0,26)+'…':activeProg.name;
  const _ov=document.getElementById('weekOverline');if(_ov)_ov.textContent=nm.toUpperCase();
  const _bn=document.getElementById('weekBigNum');if(_bn)_bn.textContent='WEEK '+currentWeek;
  const totalWeeks=activeProg.totalWeeks||6;
  // Dynamic phase labels based on program length.
  // Final phase wording follows whether the program actually tapers — race-targeted
  // programs shed load to peak for a date ("Race Prep"/"Taper"), fitness programs
  // build to peak and hold there ("Peak & Hold"). Matches the session-builder's
  // own `eventTargeted !== false` taper test so the label never lies.
  const tapered = !!(activeProg.taperWeeks && activeProg.taperWeeks.length > 0);
  // Proportional phase split — scales to ANY program length (8 to 36+ weeks) instead of
  // hardcoded week ranges that left long civilian plans (30/36wk) unlabeled past week 20.
  let phaseLabel;
  if(totalWeeks <= 6) {
    const labels = ['Phase 1 — Rebuild','Phase 2 — Load','Phase 3 — Peak'];
    phaseLabel = labels[Math.min(2, Math.floor((currentWeek-1)/(totalWeeks/3)))];
  } else if(totalWeeks <= 8) {
    const labels = ['Phase 1 — Base','Phase 2 — Build','Phase 3 — Peak'];
    phaseLabel = labels[Math.min(2, Math.floor((currentWeek-1)/(totalWeeks/3)))];
  } else {
    // 4-phase split by fraction of total length
    const f = (currentWeek - 1) / totalWeeks;
    const p4 = tapered ? (totalWeeks > 12 ? 'Taper' : 'Race Prep') : 'Peak & Hold';
    phaseLabel = f < 0.30 ? 'Phase 1 — ' + (totalWeeks >= 16 ? 'Foundation' : 'Base')
               : f < 0.60 ? 'Phase 2 — Build'
               : f < 0.82 ? 'Phase 3 — Peak'
               : 'Phase 4 — ' + p4;
  }
  const _pill=document.getElementById('phasePill');
  const _isTaper=Array.isArray(activeProg.taperWeeks)&&activeProg.taperWeeks.includes(currentWeek);
  const _isRecov=Array.isArray(activeProg.liftRecoveryWeeks)&&activeProg.liftRecoveryWeeks.includes(currentWeek);
  // Travel weeks read as MAINTENANCE, not a normal training block. Uses the phase-pill
  // slot the athlete already knows ("Recovery Week", "Race Taper") so a lighter week
  // reads as intentional rather than broken.
  let _isTravelWk=false, _injWk=null;
  try{
    if(Array.isArray(activeProg.overlays)){
      const _t=new Date(); _t.setHours(0,0,0,0);
      // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
      const _live=ov=>{
        if(!ov||!ov.from) return false;
        const _to=ov.to?_parseLocalDate(ov.to):null; if(_to&&_to<_t) return false;
        const _r=overlayWeekRange(activeProg,ov,totalWeeks);
        return _r&&currentWeek>=_r.fromWeek&&currentWeek<=_r.toWeek;
      };
      // Injury outranks travel in the pill — one slot, and a throttled week must read
      // as intentional protection, never as a generic maintenance week.
      // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
      const _injOv=activeProg.overlays.find(ov=>_live(ov)&&ov.type==='injury'&&ov.patch&&ov.patch.injury);
      if(_injOv) _injWk=_injOv.patch.injury;
      // V175 (D30): read off the DAYS, not the overlay range. "Maintenance Week" is
      // earned only when every scheduled training day in view is a hotel day; a
      // one-day trip leaves the phase pill standing and marks its day instead.
      if(!_injOv){
        const _wk=activeProg.weeks&&activeProg.weeks[currentWeek]||{};
        const _tds=ALL_DAYS_ORDER.filter(d=>_wk[d]&&!_wk[d].rest&&!dayBeforeStart(activeProg,currentWeek,d));
        _isTravelWk=_tds.length>0&&_tds.every(d=>dayIsTravel(_wk[d]));
      }
    }
  }catch(e){}
  if(_injWk){
    const _rl=(INJURY_REGIONS[_injWk.region]||{}).label||'Injury';
    _pill!.textContent='Injury Week \u00b7 '+_rl;
    _pill!.classList.add('phase-pill--injury');
  } else if(_isTravelWk){
    _pill!.textContent='Maintenance Week';
    _pill!.classList.add('phase-pill--recovery');
  } else if(_isTaper){
    _pill!.innerHTML=(currentWeek===totalWeeks?asyIcon('🏁',13)+' Race Week':asyIcon('🏁',13)+' Race Taper');
    _pill!.classList.add('phase-pill--recovery');
  } else if(_isRecov){
    _pill!.textContent='↓ Recovery Week';
    _pill!.classList.add('phase-pill--recovery');
  } else {
    _pill!.textContent=phaseLabel||'';
  }
  // Reset modifiers that don't apply to THIS render — week switching reuses the node,
  // so a stale class would tint a healthy week orange or an ordinary week red.
  if(!_injWk) _pill!.classList.remove('phase-pill--injury');
  if(_injWk||(!_isTravelWk&&!_isTaper&&!_isRecov)) _pill!.classList.remove('phase-pill--recovery');
  // ── INJURY WASH + SHORTCUT STATE ──
  // One flag drives both, so the tint and the button can never disagree about whether
  // the athlete is hurt. Wash is scoped to the week screen; a healthy week renders
  // exactly as it did before this feature existed.
  const _wkScreen=document.getElementById('screenWeek');
  if(_wkScreen) _wkScreen.classList.toggle('is-injury-week', !!_injWk);
  const _hurtBtn=document.getElementById('hurtBtn');
  const _hurtIco=document.getElementById('hurtIco');
  const _hurtLbl=document.getElementById('hurtLbl');
  if(_hurtBtn&&_hurtIco&&_hurtLbl){
    // The shortcut IS the readout: quiet ink when healthy, red with the region when live.
    const _liveInj=_injWk||((_liveInjuryOverlay()||{}).patch||{}).injury||null;
    _hurtIco.innerHTML=asyIcon('bandage',17);
    _hurtBtn.classList.toggle('is-injured', !!_liveInj);
    _hurtLbl.textContent=_liveInj?((INJURY_REGIONS[_liveInj.region]||{}).label||'INJURY').toUpperCase():'HURT?';
  }
  // ── slim week pills ──
  const wscroll=document.getElementById('weekScroll');
  // A scoot in flight is measuring and writing to nodes this render is about to destroy.
  _wkScootCancel();
  wscroll!.innerHTML='';
  const actualWeek=calcCurrentWeek();
  let _actBtn=null;
  for(let w=1;w<=totalWeeks;w++){
    const b=document.createElement('button');b.className='week-btn'+(w===currentWeek?' active':'');
    let _ovMark='';
    if(Array.isArray(activeProg.overlays)){
      const _today2=new Date();_today2.setHours(0,0,0,0);
      // @ts-expect-error TS7006 Parameter 'ov' implicitly has an 'any' type.
      const _hit=activeProg.overlays.some(ov=>{
        if(!ov||!ov.from) return false;
        const _to=ov.to?_parseLocalDate(ov.to):null; if(_to&&_to<_today2) return false;
        const _r=overlayWeekRange(activeProg,ov,totalWeeks);
        return _r&&w>=_r.fromWeek&&w<=_r.toWeek;
      });
      if(_hit) _ovMark=' \u2726';
    }
    b.textContent='Wk '+w+(w===actualWeek?' \u25cf':'')+_ovMark;
    b.onclick=(wk=>()=>{_setCurrentWeek(wk);renderWeekView();})(w);wscroll!.appendChild(b);
    if(w===currentWeek) _actBtn=b;
  }
  // Anchor on currentWeek, not actualWeek: the strip is a control for the week you are
  // LOOKING AT. Anchoring on today would scroll away from week 3 the moment you tapped it.
  const _wkTo=_wkStripTarget(wscroll,_actBtn);
  if(_wkTo!==null){
    if(_wkScootDone||_wkReduceMotion()){ wscroll!.scrollLeft=_wkTo; _wkScootDone=true; }
    else { _wkScootDone=true; _wkScoot(wscroll,_wkTo,currentWeek); }
  }
  updateRandCounter();
  renderOverlayChip();
  // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
  const sdi=document.getElementById('startDateInput');if(sdi) sdi.value=activeProg.startDate||'';
  const sdd=document.getElementById('startDateDisplay');
  if(sdd){
    if(activeProg.startDate){ sdd.textContent=new Date(activeProg.startDate+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); sdd.classList.remove('is-unset'); }
    else { sdd.textContent='Set date'; sdd.classList.add('is-unset'); }
  }
  // V188 (D14a): on a race-aligned program the start is derived, so the Race Day control
  // takes the start control's place — the race date is the one field alignment makes
  // load-bearing (Mario's own Dec 5 → Dec 6 slip is the use case).
  { const _c=activeProg.cfg||{}; const _al=progAlignment(activeProg);
    const sw=document.querySelector('.wk-subrow .wk-startdate[aria-label="Program start date"]'); const rw=document.getElementById('raceDateWrap');
    // @ts-expect-error TS2339 Property 'value' does not exist on type 'HTMLElement'.
    if(rw){ rw.style.display=_al?'flex':'none'; const ri=document.getElementById('raceDateInput'); if(ri) ri.value=_c.raceDate||''; const rd=document.getElementById('raceDateDisplay'); if(rd&&_al) rd.textContent=_fmtStartDay(_al.raceIso,true); }
    // @ts-expect-error TS2339 Property 'style' does not exist on type 'Element'.
    if(sw) sw.style.display=_al?'none':'flex'; }

  const order=['mon','tue','wed','thu','fri','sat','sun'];
  const wkData=activeProg.weeks[currentWeek];
  const completed=getCompleted();
  const logs=getLogs();
  const now=new Date();now.setHours(0,0,0,0);
  let weekMon=null;
  if(activeProg.startDate){weekMon=getWeekMonday(activeProg.startDate);}

  const list=document.getElementById('daysList');list!.innerHTML='';
  if(!wkData){return;}

  const MOD: Record<string, any>={lift:['#bc6a43','rgba(188,106,67,0.15)'],run:['#5e8c54','rgba(94,140,84,0.15)'],bike:['#3f6e96','rgba(63,110,150,0.15)'],swim:['#3f6e96','rgba(63,110,150,0.15)'],hip:['#7e5e96','rgba(126,94,150,0.15)'],core:['#a6822f','rgba(166,130,47,0.15)'],rest:['#2c2c2e','rgba(24,23,18,0.05)']};
  // @ts-expect-error TS7006 Parameter 'k' implicitly has an 'any' type.
  const modColor=k=>(MOD[k]?MOD[k][0]:'#3a3a3c');
  // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
  const dayDateOf=d=>{ if(!weekMon) return null; const dd=new Date(weekMon); dd.setDate(weekMon.getDate()+(currentWeek-1)*7+dayOffset[d]); dd.setHours(0,0,0,0); return dd; };
  // @ts-expect-error TS7006 Parameter 'd' implicitly has an 'any' type.
  const isTodayKey=d=>{ const dd=dayDateOf(d); return !!(dd&&dd.getTime()===now.getTime()); };

  // ── day strip (Mon\u2192Sun) ──
  let strip='<div class="wk-strip">';
  order.forEach(d=>{
    const day=wkData[d];
    const dd=dayDateOf(d);
    const isToday=isTodayKey(d);
    const isPast=!!(dd&&dd<now);
    const isPre=dayBeforeStart(activeProg,currentWeek,d);   // V174 (D24)
    const comp=completed[completedKey(currentWeek,d)];
    const st=comp?(comp.status||'complete'):null;
    const dnum=dd?dd.getDate():'';
    let center=dnum;
    if(st==='complete'||st==='partial') center='<span class="chk">\u2713</span>';   // V181 (D1): legacy partial reads as done
    else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);                  // V195 (D64): a Wildcard is marked, never checked
    else if(st==='skipped') center='✕';   // V221 (D179): a skipped day is marked, bare glyph in the cell's own number colour; a Wildcard outranks it (D71b)
    const dimCls=(!isToday&&(isPast||!day||day.rest))?' dim':'';
    const code=dayCode(day);
    const dim=dimCls!=='';
    const topC=isToday?_onGold(code.topColor):(dim?'#5f5f62':code.topColor);
    const botC=isToday?_onGold(code.botColor):(dim?'#5f5f62':code.botColor);
    // V174 (D24): a before-start cell shows its date, no codes, no tap.
    strip+=isPre
      ? '<div class="wk-day pre" aria-label="Before your start date">'
        +'<div class="wk-day-lbl">'+d.toUpperCase()+'</div>'
        +'<div class="wk-day-top">\u2014</div>'
        +'<div class="wk-day-num">'+dnum+'</div>'
        +'<div class="wk-day-bot">\u2014</div></div>'
      : '<div class="wk-day'+(isToday?' today':'')+dimCls+(dayIsTravel(day)?' away':'')+'" onclick="openDayKey(\''+d+'\')">'
        +'<div class="wk-day-lbl">'+d.toUpperCase()+'</div>'
        +'<div class="wk-day-top" style="color:'+topC+'">'+(code.top||'\u2014')+'</div>'
        +'<div class="wk-day-num">'+center+'</div>'
        +'<div class="wk-day-bot" style="color:'+botC+'">'+code.bot+'</div></div>';
  });
  strip+='</div>';

  // ── resolve hero day ──
  const onLiveWeek=(currentWeek===actualWeek)&&!!weekMon;
  let todayKey=null;
  if(onLiveWeek){ order.forEach(d=>{ if(isTodayKey(d)) todayKey=d; }); }
  if(todayKey&&dayBeforeStart(activeProg,currentWeek,todayKey)) todayKey=null;   // V174 (D24): today is outside the block → browse, never "Today"
  const firstTrain=order.find(d=>wkData[d]&&!wkData[d].rest&&!dayBeforeStart(activeProg,currentWeek,d));   // V174 (D24)
  let heroKey=null,heroMode='browse';
  if(onLiveWeek&&todayKey&&wkData[todayKey]&&wkData[todayKey].rest){ heroMode='rest'; heroKey=todayKey; }
  else if(onLiveWeek&&todayKey&&wkData[todayKey]){ heroMode='today'; heroKey=todayKey; }
  else { heroMode='browse'; heroKey=firstTrain||null; }

  let hero='';
  // Provenance and bonus work, surfaced on the hero so neither is a silent change.
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ su
  const _heroMovedFrom=(heroKey&&wkData[heroKey]&&wkData[heroKey].movedFrom)?(DAY_FULL[wkData[heroKey].movedFrom]||wkData[heroKey].movedFrom):null;
  const _heroCardio=(heroKey&&wkData[heroKey]&&wkData[heroKey].rest)?((getLogs()||{})[completedKey(currentWeek,heroKey)]||null):null;
  // V238 (D224 rest hero, H1 as restated in Amendment 1 A2): the entry comes through the getLogs lens,
  // so a V237 rest entry reads as restLog too. One line per restLog type that holds a time or (v0.240.0,
  // D229) a distance, in key order; Edit cardio below is keyed on a line being there (v0.240.0, D228 item 8).
  const _rcLine=(_heroCardio&&_heroCardio.restLog)
    ? restLogLines(_heroCardio.restLog).map(s=>'<div class="wk-rest-logged">'+s+'</div>').join('')
    : '';
  if(heroMode==='rest'){
    const tip=restDayTip();
    hero='<div class="wk-hero"><div class="wk-rest-pad">'
      // @ts-expect-error TS2538 Type 'null' cannot be used as an index type.
      +'<div class="wk-hero-over">Today \u00b7 '+DAY_FULL[heroKey]+'</div>'
      +'<div class="wk-rest-title">REST DAY</div>'
      +'<div class="wk-rest-sub">Recovery is where the work sets in. Move easy, refuel, sleep.</div>'
      +_rcLine
      +'<div class="wk-rest-acts">'
        // v0.240.0 (D231 item 3): a day whose session moved away takes a jog and never a move.
        +(heroKey&&wkData[heroKey].moved?'':'<button class="wk-rest-act" onclick="openRestSheet('+currentWeek+',\''+heroKey+'\',\'move\')">Training anyway?</button>')
        +'<button class="wk-rest-act" onclick="openRestSheet('+currentWeek+',\''+heroKey+'\',\'cardio\')">'+(_rcLine?'Edit cardio':'Log cardio')+'</button>'
      +'</div>'
      +'</div></div>'
      +'<div class="wk-tip"><div class="wk-tip-lbl">'+tip.label+'</div>'
      +'<div class="wk-tip-txt">'+tip.text+'</div>'
      +'<div class="wk-tip-src">\u2014 '+tip.src+'</div></div>';
  } else if(heroKey){
    const day=wkData[heroKey];
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'string' can't be used to index type '{
    const over=(heroMode==='today'?'Today \u00b7 ':'Week '+currentWeek+' \u00b7 ')+DAY_FULL[heroKey]+(_heroMovedFrom?' \u00b7 moved from '+_heroMovedFrom:'');
    // @ts-expect-error TS7006 Parameter 't' implicitly has an 'any' type.
    const tags=(day.tags||[]).filter(t=>t!=='rest').map(t=>{
      const col=MOD[t]?MOD[t][0]:'#181712';const dim=MOD[t]?MOD[t][1]:'rgba(24,23,18,0.15)';
      return '<span class="wk-tag" style="color:'+col+';background:'+dim+'">'+((tagMeta[t]&&tagMeta[t].label)||t)+'</span>';
    }).join('');
    const summ=heroSummary(day);
    const est=sessionTimeEst(day);
    // V221 (D179): a day with a status is closed out. The hero says so in one line and its CTA
    // takes the open label (undo lives in the day's footer); a pending today keeps the start label.
    // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ co
    const _heroSt=({complete:'Done ✓ Closed out. Open the session to undo.',skipped:'Skipped ✕ The week moves on. Open the session to undo.'})[statusOf(currentWeek,heroKey)]||'';
    const cta=(heroMode==='today'&&!_heroSt)?'START SESSION':'OPEN SESSION';
    hero='<div class="wk-hero'+(heroMode==='today'?' is-today':'')+'">'
      +'<div class="wk-hero-pad">'
        +'<div class="wk-hero-over">'+over+'</div>'
        +'<div class="wk-hero-title">'+(day.title||'Training')+'</div>'
        +'<div class="wk-hero-tags"><span class="wk-tag wk-time">~'+est+' MIN</span>'+tags+travelTagHTML(day)+'</div>'
      +'</div>'
      +(summ?'<div class="wk-hero-summary">'+summ+'</div>':'')
      +(_heroSt?'<div class="wk-hero-status">'+_heroSt+'</div>':'')
      +'<div class="wk-hero-cta-wrap"><button class="wk-hero-cta" onclick="openDayKey(\''+heroKey+'\')">'+cta+'</button></div>'
      +'</div>';
  } else {
    hero='<div class="wk-hero"><div class="wk-rest-pad"><div class="wk-rest-title" style="font-size:30px">NO SESSIONS</div><div class="wk-rest-sub">This week has no scheduled training.</div></div></div>';
  }

  // ── stat tiles ──
  const trainDays=order.filter(d=>wkData[d]&&!wkData[d].rest&&!dayBeforeStart(activeProg,currentWeek,d));   // V174 (D24): 0/2, not 0/5
  const doneN=trainDays.filter(d=>{const cp=completed[completedKey(currentWeek,d)];return cp&&(cp.status||'complete')==='complete';}).length;
  // V238 (D224, weekly sums credit the jog): MILES is every day's session run_dist plus every
  // day's rest-day jog, restLog.run.dist. Walk and row jogs credit nothing (MILES is a run tile).
  let miles=0; order.forEach(d=>{ const e=logs[logKey(currentWeek,d)]||{}; const v=parseFloat(e.run_dist); if(!isNaN(v)) miles+=v; const j=+((e.restLog||{}).run||{}).dist; if(j>0) miles+=j; });
  miles=Math.round(miles*10)/10;
  const streak=computeStreak();
  const stats='<div class="wk-stats">'
    +'<div class="wk-stat"><div class="wk-stat-num">'+doneN+'<span class="den">/'+trainDays.length+'</span></div><div class="wk-stat-lbl">DONE</div></div>'
    +'<div class="wk-stat"><div class="wk-stat-num" style="color:var(--run)">'+miles+'</div><div class="wk-stat-lbl">MILES</div></div>'
    +'<div class="wk-stat"><div class="wk-stat-num" style="color:var(--accent)">'+streak+'</div><div class="wk-stat-lbl">DAY STREAK</div></div>'
    +'</div>';

  const _wcTag=wildcardTagHTML(currentWeek,heroKey);   // V195 (D64)
  list!.innerHTML=strip+hero+_wcTag+stats;
}

// DETAIL VIEW
// Lifting RPE legend — a compact, muted, italic one-liner shown above the day's lifts (after
// the cardio) whenever any lift is prescribed by RPE, so the scale is never unexplained.
function liftRpeKeyHTML(){
  return '<div class="rpe-legend"><i>Rate of Perceived Exertion (RPE) is how hard a set should feel \u2014 10 means all-out, nothing left. Each lift tells you how many reps to keep in the tank.</i></div>';
}
// ── V190 (D39): THE SECTION OWNS THE ROUND COUNT ──────────────────────
// A superset's round count and its members' set count were always ONE number.
// vsets(3) at the call site means "3 rounds of this pair"; it was stamped onto each
// member's detail string because the string was the only carrier a section had, and
// three separate readers then tried to recover it with `^(\d+)×` — a regex that does
// not know the no-load grammar (`N sets — RPE x`) that bodyweightSweep rewrites 21.9%
// of items into. All three fell to a hardcoded 3. Measured over 1,260 builds / 85,977
// superset sections: 41.2% of banners fabricated, 29.5% contradicted their own members;
// 45.7% of training days shipped a wrong time estimate (mean 4.3 min, worst 6.4).
// The number now lives on the section, written once by the author.
// `rounds: null` is an AUTHORED claim that the block has no round count (AMRAP, a 1RM
// attempt, a pyramid, for-time). OMITTED is the legacy signal — sections built before
// V190 and restored from ia_hist_ or the creation-day prog.weeks. Legacy recovers the
// real number from the members: BOTH grammars, and the MIN across them (never items[0],
// which stamped one member's number over the rest). Nothing parses → no number, and the
// header falls back to the section's own label rather than inventing one. There is no
// fallback constant anywhere in this path.
function _itemSets(d: any){
  var s=String(d||''), m=s.match(/^(\d+)\s*[x\u00d7]/);
  if(m) return parseInt(m[1],10);
  m=s.match(/^(\d+)\s*sets?\b/i);
  return m?parseInt(m[1],10):null;
}
function _secRounds(sec: any){
  if(!sec) return null;
  if(sec.rounds===null) return null;
  if(typeof sec.rounds==='number'&&sec.rounds>0) return sec.rounds;
  var lr=String(sec.label||'').match(/(\d+)\s*round/i);
  if(lr) return parseInt(lr[1],10);
  var c=(sec.items||[]).map(function(it: any){return _itemSets(it&&it.detail);})
                       .filter(function(v: any){return v!=null;});
  return c.length?Math.min.apply(null,c):null;
}
// Display-only. The leading count comes OFF the rendered string and stays IN the data:
// parseRx has five callers, and the add-sheet's day set-count (sessionAddSheet) sums
// member details and is CORRECT today — it was the banner that was wrong, not them.
// Stripping the count from the data would break a working reader to fix a broken one.
function _stripLeadingSets(d: any){
  return String(d||'')
    .replace(/^(\d+)\s*[x\u00d7]\s*/,'')
    .replace(/^(\d+)\s*sets?\s+of\s+/i,'')
    .replace(/^(\d+)\s*sets?\s*(?:\u2014|\u2013|-)\s*/i,'')
    .replace(/^(\d+)\s*sets?\b\s*/i,'');
}
// v0.246.0 D250 (P-WILDEDIT): `src` 'wild' draws a Wildcard's sections, whose controls address the Wildcard (buildExItem).
function buildSectionsHTML(sections: any,baseIdx?: any,src?: any){
  const all=sections||[];
  const _base=baseIdx||0;
  const _srcArg=(src==='wild')?",'wild'":'';
  // Only the MAIN lift (and the taper Primer) keeps a section label — every other block renders
  // as plain exercise rows. The conditioning round-protocol survives because it's drawn by the
  // superset-header inside the block, not by this outer label.
  const renderSec=(sec: any,_si: any)=>{
    const _secIdx=_base+_si;
    const showLabel=/^(main|primer)/i.test(sec.label||'');
    // A superset that has been skipped collapses to a single block-level stub. The whole
    // round goes because its items are interdependent — see applyDayEdits.
    if((sec.superset||sec.type==='superset')&&sec._skipped){
      return `<div class="section"><div class="ex-skipped"><span class="ex-skipped-lbl">Skipped</span>`
        +`<span class="ex-skipped-name">${esc(sec.label||'Conditioning round')} \u2014 ${(sec.items||[]).length} movements</span>`
        +`<button class="ex-skipped-undo" onclick="unskipSuperset(${_secIdx}${_srcArg})">Put it back</button></div></div>`;
    }
    let h=`<div class="section">`+(showLabel?`<div class="section-label">${sec.label||''}</div>`:'');
    if(sec._added){
      // The athlete's own additions render in their own block, in signal orange, so they
      // never masquerade as something the engine programmed.
      h+=`<div class="section-label" style="color:var(--signal)">${sec.label||'Added by you'}</div><div class="section-block">`;
      sec.items.forEach((i: any,_ii: any)=>{h+=buildExItem(i,_secIdx,_ii,undefined,src);});
      h+=`</div>`;
    } else if(sec.hip){
      // Broken out of the old bundled "Hip Abductor Circuit" box — each stability drill now
      // stands as its own logged card. The section still carries hip:true, so capRegionalFatigue
      // keeps shielding this prehab from deload/high-fatigue trimming.
      h+=`<div class="section-label" style="color:var(--hip)">${sec.label||'Hip stability'}</div><div class="section-block">`;
      sec.items.forEach((i: any,_ii: any)=>{h+=buildExItem(i,_secIdx,_ii,undefined,src);});
      h+=`</div>`;
    } else if(sec.core){
      h+=`<div class="core-block"><div class="core-header">${sec.coreHeader||'Core'}</div>`;
      sec.items.forEach((i: any,_ii: any)=>{h+=buildExItem(i,_secIdx,_ii,undefined,src);});
      h+=`</div>`;
    } else if((sec.superset||sec.type==='superset')&&(sec.items||[]).length>1){
      // V175 (D28): a section that holds ONE item is not a superset whatever its flag
      // says. Generation now never emits one, but days frozen into ia_hist_ before V175
      // can still carry the flag; they fall through to straight sets below.
      const labelHasRounds=/round/i.test(sec.label||'');
      // V190 (D39): one resolver, no regex here, no fallback constant. May be null.
      const rounds=_secRounds(sec);
      // V162 (rulings R2/D1): the header minus still takes the whole round, and now each
      // row inside carries its own minus too — a skipped member drops out and the round
      // continues with what is left. At ONE survivor the round protocol means nothing,
      // so the block demotes to straight sets: rounds × (member reps) becomes the item's
      // own N×, stated on the card rather than implied by a header describing nothing.
      const _live=(sec.items||[]).filter(function(it: any){return it&&!it._skipped;});
      if(_live.length===1&&(sec.items||[]).length>1){
        const _sv=_live[0], _d=_sv.detail||'';
        // V190 (D39): with no honest round count there is nothing to multiply by, so the
        // survivor keeps its own prescription — which already carries its true set count.
        const _mapped=(rounds==null||/^\d+\s*[x\xd7]/.test(_d))?_d
          :(_d?(rounds+'\xd7'+_d.replace(/^(\d+)\s*reps?\b/,'$1')):(rounds+' sets'));
        h+=`<div class="section-label" style="color:var(--muted)">${esc(sec.label||'Round')} \u2014 reduced to straight sets</div><div class="section-block">`;
        sec.items.forEach((i2: any,_ii: any)=>{
          if(i2._skipped){h+=buildExItem(i2,_secIdx,_ii,undefined,src);return;}
          h+=buildExItem({...i2,detail:_mapped},_secIdx,_ii,undefined,src);
        });
        h+=`</div></div>`;
        return h;
      }
      // V190 (D39): the header shows the section LABEL; the round-protocol sentence is
      // synthesized only when there is a real N. A block that cannot state its round
      // count no longer claims one — it keeps its label and its orange wrap.
      const hdrTxt=(labelHasRounds||rounds==null)?(sec.label||'')
        :`${rounds} Rounds — no rest between exercises · ${rounds<=2?90:60}s rest between rounds`;
      h+=`<div class="superset-wrap"><div class="superset-header"><span class="sshdr-txt">${hdrTxt}</span>`
        +`<button class="ss-minus" onclick="skipSuperset(${_secIdx}${_srcArg})" aria-label="Skip this round">`+asyIcon('minus',15)+`</button></div>`;
      // The block owns the set dimension, so the rows inside state reps and effort only.
      // Data is untouched — this is the rendered string.
      sec.items.forEach((i: any,_ii: any)=>{h+=buildExItem(i,_secIdx,_ii,rounds,src);});
      h+=`</div>`;
    } else {
      h+=`<div class="section-block">`;
      sec.items.forEach((i: any,_ii: any)=>{h+=buildExItem(i,_secIdx,_ii,undefined,src);});
      h+=`</div>`;
    }
    h+=`</div>`;
    return h;
  };
  // Every prescribed section now renders as a normal working set, in program order,
  // at full contrast. The old "Optional — if time supports" tail (conditioning,
  // carries, finishers, dynamic core sunk below a divider) has been removed — the
  // programmed volume is calibrated, so nothing is flagged as droppable anymore.
  return all.map((sec: any,_si: any)=>renderSec(sec,_si)).join('');
}
// Turn a prescription detail string ("4×7 — RPE 6", "3×10 each", "3×25 sec",
// "3×8–10", "10 sets — max each set") into a per-set logging spec. Returns null when
// there's no set pattern to log (pure prose / mobility), so those render no rows.
// Wildcard / Random sessions write prescriptions in shapes the N×M grammar never
// accepted — 58 of them across 26 movements rendered with NO log surface at all.
// Every pattern below was taken from a string actually present in the library; none is
// speculative. Only reached when the strict grammar above returns null, so no existing
// parse can change.
function _parseRxLoose(d: any, name: any){
  const perSide=/each/.test(d);
  // "5×max time" — N sets against an open target. The strict pattern needs a digit
  // after the ×, so this fell through.
  const mSetsMax=d.match(/^(\d+)\s*[×x]\s*max\b/);
  if(mSetsMax) return {sets:Math.min(+mSetsMax[1],20), open:true, perSide:perSide};
  // "20s on / 10s off × 8" — trailing multiplier is the ROUND count. Work interval is
  // fixed, so what's worth logging is reps achieved per round: open by nature.
  // Checked before the single-set rule below, which would otherwise read the leading "20s".
  const mRounds=d.match(/[×x]\s*(\d+)\s*$/);
  if(mRounds && /\bon\b/.test(d) && /\boff\b/.test(d)) return {sets:Math.min(+mRounds[1],20), open:true, perSide:false};
  // "1 min max reps" — one open set against a clock.
  if(/^\d+\s*(min|sec)\b/.test(d) && /\bmax\b|amrap|failure/.test(d)) return {sets:1, open:true, perSide:perSide};
  // "10/8/6/4/2 — heavier each set", "10/10/10/AMRAP", "1,2,3,4,5,4,3,2,1", "10/15/20
  // reps" — an explicit per-set ladder where each rung is its OWN target. Returns
  // `targets[]`; a null rung is an open set (AMRAP). Checked after the round rule so
  // "20s on / 10s off" cannot be misread as a two-rung ladder.
  const mLadder=d.match(/^(\d+(?:\s*[\/,]\s*(?:\d+|amrap|max))+)/);
  if(mLadder){
    const parts=mLadder[1].split(/[\/,]/).map(function(x: any){return x.trim();});
    if(parts.length>=2 && parts.length<=20){
      const targets=parts.map(function(x: any){return /^(amrap|max)$/.test(x)?null:+x;});
      const tok=/\bsec\b/.test(d)?'sec':(/\byd\b|\byards?\b/.test(d)?'yd':'');
      const first=targets.filter(function(t: any){return t!=null;})[0]||0;
      return {sets:targets.length, kind:tok==='sec'?'sec':(tok==='yd'?'dist':'reps'),
              unit:tok, step:tok==='sec'?5:1, target:first, targets:targets, perSide:perSide};
    }
  }
  // "max reps" / "Max time" with no count at all — a single open set.
  if(/^(max|amrap)\b/.test(d)) return {sets:1, open:true, perSide:perSide};
  // "45 sec" / "12 reps" / "10 each" / "25 yd" — a single set with an explicit count.
  // **The unit token is REQUIRED**: without it "3 sets — RPE 8, 2 min rest" would read as
  // a single set of 3. That is the whole reason the strict grammar could not simply be
  // loosened to accept a leading integer.
  const mOne=d.match(/^(\d+)\s*(seconds?|secs?|sec|s|yards?|yds?|yd|reps?|each)\b/);
  if(mOne){
    const v=+mOne[1], tok=mOne[2];
    if(/^(seconds?|secs?|sec|s)$/.test(tok)) return {sets:1, kind:'sec', unit:'sec', step:5, target:v, perSide:perSide};
    if(/^(yards?|yds?|yd)$/.test(tok))       return {sets:1, kind:'dist', unit:'yd', step:1, target:v, perSide:perSide};
    return {sets:1, kind:'reps', unit:'', step:1, target:v, perSide:perSide};
  }
  // "aim 200" — a total to work toward. Bigger step because these run to three figures.
  const mAim=d.match(/\baim\s+(\d+)/);
  if(mAim) return {sets:1, kind:'reps', unit:'', step:5, target:+mAim[1], perSide:perSide};
  // Count lives in the NAME, not the detail: "40 pushups" / "break as needed",
  // "20 broad jumps" / "as fast as possible". Requires whitespace after the digits so
  // "45° back extension" is not read as a 45-rep set.
  const mName=String(name||'').match(/^(\d+)\s+\S/);
  if(mName) return {sets:1, kind:'reps', unit:'', step:1, target:+mName[1], perSide:perSide};
  return null;
}
function parseRx(detail: any,name: any){
  const d=(detail||'').toLowerCase();
  // "N sets of X to Y" — a real rep target written in words, not an open prescription.
  // Emitted by the travel/loadCapped branch ("3 sets of 8 to 12 — RPE 8 (heaviest pair you
  // can find)"). Nothing read it before V120, so it returned null and those rows rendered
  // with no log field at all. MUST be tested before the open-set rule below, which would
  // otherwise see the leading "3 sets" and throw the rep range away.
  const mSetsOf=d.match(/^(\d+)\s*sets?\s+of\s+(\d+)(?:\s*(?:to|[–-])\s*(\d+))?/);
  if(mSetsOf){
    const lo=+mSetsOf[2], hi=mSetsOf[3]?+mSetsOf[3]:null;
    return {sets:Math.min(+mSetsOf[1],20), kind:'reps', unit:'', step:1,
            target:hi?Math.round((lo+hi)/2):lo, perSide:/each/.test(d)};
  }
  // "N sets ..." with no rep target after it — N sets against an OPEN target: sets and
  // effort are prescribed, reps emerge. THE GRAMMAR IS THE SIGNAL. Until V120 this branch
  // also demanded the words max/amrap/failure, which only the RPE 8 copy carries; the RPE 6
  // and RPE 7 copy says "leave 3 or more in reserve" and "leave plenty in the tank", so it
  // fell through to null. exLoggable then had nothing left to fall back on for a bodyweight
  // movement (no KB, no weight field), and 756 shipped prescriptions on the bodyweight tier
  // rendered with NO log field and sat outside the X/Y LOGGED denominator. Harvested, not
  // guessed: the file contains exactly 6 distinct "N sets" literals and all 6 are covered
  // by these two rules. The (?!of) guard is belt-and-braces against the rule above.
  const mOpen=d.match(/^(\d+)\s*sets?\b(?!\s*of\s*\d)/);
  if(mOpen) return {sets:Math.min(+mOpen[1],20), open:true, perSide:/each/.test(d)};
  const m=d.match(/^(\d+)\s*[×x]\s*(\d+)(?:\s*[–-]\s*(\d+))?\s*(sec|s|yd)?/);
  if(!m) return _parseRxLoose(d,name);
  const sets=Math.min(+m[1],20), lo=+m[2], hi=m[3]?+m[3]:null, unitTok=m[4], perSide=/each/.test(d);
  const mid=hi?Math.round((lo+hi)/2):lo;
  if(unitTok==='sec'||unitTok==='s') return {sets:sets, kind:'sec', unit:'sec', step:5, target:hi?Math.round(((lo+hi)/2)/5)*5:lo, perSide:perSide};
  if(unitTok==='yd') return {sets:sets, kind:'dist', unit:'yd', step:1, target:mid, perSide:perSide};
  return {sets:sets, kind:'reps', unit:'', step:1, target:mid, perSide:perSide};
}
function rxSuffix(rx: any){
  if(!rx) return '';
  if(rx.kind==='sec') return rx.perSide?'sec/side':'sec';
  if(rx.kind==='dist') return rx.perSide?'yd/side':'yd';
  return rx.perSide?'/side':'';
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  REST_WORD, _partialWeek1, _progDayDate, _stripLeadingSets, buildSectionsHTML, calcCurrentWeek, dayBeforeStart,
  dayOffset, parseRx, renderWeekView, restLogHead, restLogLines, runSessionCode, rxSuffix, tagMeta,
};
