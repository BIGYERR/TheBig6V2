import { ASY_ICON_PATHS, asyIcon } from '../../../../../../core/src/engine/icons.ts';
import { completedKey, getCompleted, saveCompleted, snapshotDay } from './storage.ts';
import { activeProg, activeProgId, showToast } from './rest-day-shell.ts';
import { ALL_DAYS_ORDER, getWeekMonday } from '../../../../../../core/src/engine/calendar.ts';
import { DAY_FULL } from './wizard.ts';
import { wildcardOn } from './random-wildcard.ts';
import { dayBeforeStart, dayOffset, renderWeekView } from './week-view-sections.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
/* ===== REINFORCEMENT POPUPS ===== */
/* Pools are locked copy. workout + reminder are WIRED this batch; streak + season
   are staged for the next batch (no trigger fires them yet). */
const POP_POOLS={
  workout:[
    "Congrats... you actually showed up. Just, you know, faster next time. 🎉",
    {t:"Hangover said stay down. You told it to go fuck itself. Respect. 🍺🪦", when:'weekend'},
    "Look at you. Vertical, sweaty, and useful. Goddamn miracle. 🫡",
    {t:"Another one done while half the city's still asleep. 🛏️😭", when:'morning'},
    "Go ahead, keep flexing in the mirror... THEY see it too. 🪞",
    "Ayoooo, your mom's third husband couldn't have done what you just did. 💪",
    "You showed up. The bums in the group chat didn't. You lit! 🔥",
    "Sweat now or be wheezing up eight flights of stairs later. 🚶😤",
    {t:"Cardio's done. You earned the right to talk all the shit you want at brunch. 🥂", when:'weekend', type:'cardio'},
    "One more session toward not dropping dead at 50... You're welcome. ⚰️❌",
    "Well, look who decided not to be useless today. 🛋️🔥",
    "Sweaty, gross, and one step less gordito. Growth, baby. 📈",
    "You vs. the couch: couch lost again. Fuck that couch... or sit on it later. 🛋️💀",
    "Knocked it out while your excuses were still loading. ⏳🖕",
    "Body's pissed, you did it anyway. That's the whole damn point. 😤",
    {t:"Showed up hungover, didn't die. Take your victory shower. 🍻💪", when:'weekend'},
    "Done. Go shower... please. 🚿🤢",
    "One more W! Stack 'em up. 🏙️📚",
    "Quit looking for a medal. It's under your tetas, find it later. 🥇",
    "You suffered on purpose. Stay safe, take a shot later. 😈",
    "Deadass, I've seen people move faster chasing their ex... but good job anyway. 🏃",
    "Diantreeeeeee, you actually activated today. Who inspired you? 👀",
    "Abusador! You murdered that session. Go get some water! 💦",
    "Ay, I don't care what literally everybody says... you got that dawg in you! 🐕",
    "You burned enough calories to justify one pastelito... just one. 🥟",
    {t:"You did the whole thing. Looked dead ugly on that last set, but you finished. 💀", type:'lift'},
    {t:"Por favor! Twenty minutes finding the right playlist, ten minutes lifting. But okay, \"workout complete.\" 🎧", type:'lift'}
  ],
  reminder:[
    "Yo, you ghosted a session. Mark it or own the skip.",
    "Left a day hanging unmarked. Did you train or nah?",
    "Unfinished business sitting on your calendar. Settle up.",
    "That day didn't log itself, champ. Complete it or call it.",
    "You disappeared on a workout. Your record, your call. Fix it."
  ],
  streak:[
    "Don't you DARE break this now, you've got something going. 🔥",
    "That's a real streak. Most people fold by now like wet cardboard. 🔥💀",
    "Look at this consistency. Who replaced you with someone competent? 🔥",
    "Streak's alive and so are you. Keep it that way, you maniac. 🔥",
    "You're on a tear. Breaking it now would be a crime against yourself. 🔥🚔"
  ],
  season:[
    "You finished the WHOLE fuckin' thing?? Who are you and what'd you do with the lazy prick I knew. 🏆",
    "Done. You bitched every goddamn step and STILL pulled it off. Legend shit. 💪",
    "Program complete. The streets are proud. Your knees filed a complaint. 🗽🦴",
    "You saw it through. Rare as fuck. Most quit at week two like little bitches. 🐔",
    "Full block. No shortcuts, no excuses, no crying. Go be insufferable about it. 🔥",
    "Your membership finally earned its keep instead of robbing you blind. 🧾😮‍💨",
    "Whole program, finished, no quitting halfway like a coward. I'm fuckin' shocked. 🏆",
    "You outlasted every weak ass excuse your brain coughed up. Respect, animal. 🧠❌",
    "You crossed the line most people piss themselves at and bail. Built different. 💪"
  ]
};
const POP_CFG={
  workout: {icon:'🎉',kicker:'WORKOUT COMPLETE',kClass:'',glow:'rgba(24,23,18,0.35)',confetti:72,shake:false},
  reminder:{icon:'notebook',kicker:'UNFINISHED BUSINESS',kClass:'',glow:'rgba(24,23,18,0.30)',confetti:0,shake:false},
  streak:  {icon:'🔥',kicker:'STREAK ALIVE',kClass:'streak',glow:'rgba(166,130,47,0.4)',confetti:100,shake:false},
  season:  {icon:'🏆',kicker:'SEASON COMPLETE',kClass:'',glow:'rgba(24,23,18,0.55)',confetti:200,shake:true}
};
const POP_KNICKS=['#006BB6','#F58426','#BEC0C2']; // NY Knicks — blue, orange, silver
// User-voice acknowledgments (the user brushing off the app). Per-DAY rotation:
// one flavor per calendar day, held all day, rolls to a new one tomorrow (no repeat).
const POP_DISMISS=[
  "yeah yeah...",
  "good looks 😒",
  "ok i get it...",
  "...tato",
  "i don't need your approval... but ok",
  "save it 🫳",
  "...moving on"
];
function popDismissText(){
  const key='ia_pop_dismiss_'+activeProgId; const today=_todayStamp();
  let st={}; try{ st=JSON.parse(localStorage.getItem(key)||'{}'); }catch{}
  // @ts-expect-error TS2339 Property 'date' does not exist on type '{}'.
  if(st.date===today && typeof st.idx==='number' && POP_DISMISS[st.idx]) return POP_DISMISS[st.idx];
  // @ts-expect-error TS2339 Property 'idx' does not exist on type '{}'.
  let i; do{ i=Math.floor(Math.random()*POP_DISMISS.length); }while(POP_DISMISS.length>1 && i===st.idx);
  try{ localStorage.setItem(key,JSON.stringify({date:today,idx:i})); }catch{}
  return POP_DISMISS[i];
}
// Pool entries may be a plain string, or {t, when, type}; a tag gates eligibility on the
// TRAINED day, read from activeProg.weeks the way maybeShowReminder reads it. V220 (D175):
//   when:'weekend'  the trained day is a Saturday or Sunday (dayDateFor, not the tap clock)
//   when:'morning'  before 9am on the clock AND the trained day is today; a past-day mark
//                   never draws a morning line (the record carries the tap time, not the hour)
//   type:'cardio'   the day has cardio (!!day.cardio, the dayCode lens)
//   type:'lift'     dayCode's lift-section test minus sections labelled mobility or taper
//                   (D18's vocabulary: a Post-run mobility day is not lifting, a Primer is)
// Both tags must pass. With no resolvable day (no week/dayKey, no startDate, no day object)
// the context is unknown: every tagged entry sits out, untagged entries stay eligible.
function popContext(week: any,dayKey: any){
  const day=(week!=null&&dayKey&&activeProg?.weeks)?activeProg.weeks[week]?.[dayKey]:null;
  const dt=day?dayDateFor(week,dayKey):null;
  if(!dt) return { known:false };
  const now=new Date(); const today=new Date(now); today.setHours(0,0,0,0);
  const dow=dt.getDay();
  return {
    known:true,
    weekend:(dow===0||dow===6),
    morning:(now.getHours()<9&&dt.getTime()===today.getTime()),
    cardio:!!day.cardio,
    // @ts-expect-error TS7006 Parameter 's' implicitly has an 'any' type.
    lift:(day.sections||[]).some(s=>!s.core&&!s.hip&&(s.items||[]).length&&!/mobility|taper/i.test(s.label||''))
  };
}
function popText(e: any){ return (e&&typeof e==='object')?e.t:e; }
function popEligible(e: any,ctx: any){
  const tag=(e&&typeof e==='object')?e:null;
  const when=tag?tag.when:null, type=tag?tag.type:null;
  if(!when&&!type) return true;
  if(!ctx||!ctx.known) return false;
  if(when==='weekend'&&!ctx.weekend) return false;
  if(when==='morning'&&!ctx.morning) return false;
  if(type==='cardio'&&!ctx.cardio) return false;
  if(type==='lift'&&!ctx.lift) return false;
  return true;
}
function popPick(tier: any,week: any,dayKey: any){
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ wo
  const pool=POP_POOLS[tier]; if(!pool||!pool.length) return '';
  const ctx=popContext(week,dayKey);
  const elig: any[]=[]; pool.forEach((e: any,idx: any)=>{ if(popEligible(e,ctx)) elig.push(idx); });
  if(!elig.length) return popText(pool[0]);
  if(elig.length===1) return popText(pool[elig[0]]);
  const memKey='ia_pop_idx_'+activeProgId; let mem={};
  try{ mem=JSON.parse(localStorage.getItem(memKey)||'{}'); }catch{}
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'.
  const last=(typeof mem[tier]==='number')?mem[tier]:-1;
  let choices=elig.filter(i=>i!==last); if(!choices.length) choices=elig;
  const i=choices[Math.floor(Math.random()*choices.length)];
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{}'.
  mem[tier]=i; try{ localStorage.setItem(memKey,JSON.stringify(mem)); }catch{}
  return popText(pool[i]);
}
function popFire(tier: any,opts: any){
  opts=opts||{};
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ wo
  const cfg=POP_CFG[tier]||POP_CFG.workout;
  // V220 (D174): an ASY_ICON_PATHS name ('notebook', 'shield', 'warning') renders as SVG at the
  // .pop-icon size; anything else, i.e. the celebration emoji, is written as text exactly as
  // before. An emoji never goes through asyIcon: ASY_EMOJI maps the fire and trophy to SVG.
  const ic=opts.icon||cfg.icon; const icEl=document.getElementById('popIcon');
  // @ts-expect-error TS18047 'icEl' is possibly 'null'.
  if(Object.prototype.hasOwnProperty.call(ASY_ICON_PATHS,ic)) icEl.innerHTML=asyIcon(ic,52);
  // @ts-expect-error TS18047 'icEl' is possibly 'null'.
  else icEl.textContent=ic;
  // @ts-expect-error TS18047 'k' is possibly 'null'.
  const k=document.getElementById('popKicker'); k.textContent=opts.kicker||cfg.kicker; k.className='pop-kicker '+(cfg.kClass||'');
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('popMsg').textContent=opts.msg||popPick(tier,opts.week,opts.dayKey);   // V220 (D175) the trained day
  // @ts-expect-error TS18047 'sub' is possibly 'null'.
  const sub=document.getElementById('popSub'); sub.textContent=opts.sub||''; sub.style.display=opts.sub?'block':'none';
  const row=document.getElementById('popStatRow'); const stats=opts.stats||[];
  // @ts-expect-error TS18047 'row' is possibly 'null'.
  row.innerHTML=stats.map(s=>`<div class="pop-stat"><div class="pop-stat-num ${s.cls||''}">${s.n}</div><div class="pop-stat-lbl">${s.l}</div></div>`).join('');
  // @ts-expect-error TS18047 'row' is possibly 'null'.
  row.style.display=stats.length?'flex':'none';
  const acts=document.getElementById('popActions');
  if(opts.actions&&opts.actions.length){
    // @ts-expect-error TS18047 'acts' is possibly 'null'.
    acts.className='pop-actions'+(opts.triple?' triple':'');
    // @ts-expect-error TS18047 'acts' is possibly 'null'.
    acts.innerHTML=opts.actions.map(a=>`<button class="pop-act ${a.cls||''}" onclick="${a.onclick}">${a.label}</button>`).join('');
  } else {
    // @ts-expect-error TS18047 'acts' is possibly 'null'.
    acts.className='pop-actions';
    // @ts-expect-error TS18047 'acts' is possibly 'null'.
    acts.innerHTML=`<button class="pop-act go" onclick="popClose()">${opts.dismiss||popDismissText()}</button>`;
  }
  const modal=document.getElementById('popModal');
  // @ts-expect-error TS18047 'modal' is possibly 'null'.
  modal.className='pop-modal'+(cfg.shake?' shake':'');
  // @ts-expect-error TS18047 'modal' is possibly 'null'.
  void modal.offsetWidth;
  // @ts-expect-error TS2531 Object is possibly 'null'.
  document.getElementById('popOverlay').classList.add('show');
  popConfetti(cfg.confetti||0);
}
// @ts-expect-error TS2531 Object is possibly 'null'.
function popClose(){ document.getElementById('popOverlay').classList.remove('show'); }
function popDismissBg(e: any){ if(e.target.id==='popOverlay') popClose(); }
function popConfetti(count: any){
  if(!count) return;
  const box=document.getElementById('popConfetti');
  // Trophy easter egg: only on a random ~1-in-4 celebration does a handful of mini trophies
  // mix into the confetti. Generic 🏆 glyph, so it renders anywhere and isn't every time.
  const trophyDrop=Math.random()<0.25;
  for(let n=0;n<count;n++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'vw';
    p.style.animationDuration=(1.6+Math.random()*1.6)+'s';
    p.style.animationDelay=(Math.random()*0.25)+'s';
    if(trophyDrop && Math.random()<0.12){
      p.textContent='🏆';
      p.style.background='none';
      p.style.width='auto';p.style.height='auto';
      p.style.fontSize=(16+Math.random()*8)+'px';
      p.style.lineHeight='1';
      p.style.transform=`rotate(${(-20+Math.random()*40)}deg)`;
    } else {
      p.style.background=POP_KNICKS[Math.floor(Math.random()*POP_KNICKS.length)];
      p.style.transform=`rotate(${Math.random()*360}deg)`;
      if(Math.random()>0.6) p.style.borderRadius='50%';
    }
    // @ts-expect-error TS18047 'box' is possibly 'null'.
    box.appendChild(p);
    setTimeout(()=>p.remove(),3600);
  }
}

/* ===== STREAK / STATS / REMINDER HELPERS ===== */
function dayDateFor(week: any,d: any){
  if(!activeProg?.startDate) return null;
  const weekMon=getWeekMonday(activeProg.startDate);
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ mo
  const dt=new Date(weekMon); dt.setDate(weekMon.getDate()+(week-1)*7+dayOffset[d]); dt.setHours(0,0,0,0);
  return dt;
}
// Scheduled (non-rest) training days with date <= cutoff, ascending by date.
function scheduledDays(cutoff: any){
  const out: any[]=[]; if(!activeProg?.weeks) return out;
  const tw=activeProg.totalWeeks||Object.keys(activeProg.weeks).length;
  for(let w=1;w<=tw;w++){ const wk=activeProg.weeks[w]; if(!wk) continue;
    ALL_DAYS_ORDER.forEach(d=>{ const day=wk[d]; if(!day||day.rest) return;
      const dt=dayDateFor(w,d); if(!dt) return;
      if(dayBeforeStart(activeProg,w,d)) return;     // V174 (D24): outside the block
      if(cutoff && dt>cutoff) return;
      out.push({week:w,d,date:dt}); });
  }
  out.sort((a,b)=>a.date-b.date); return out;
}
function statusOf(week: any,d: any){ const c=getCompleted()[completedKey(week,d)]; if(!c) return null; const s=c.status||'complete'; return s==='partial'?'complete':s; }   // V181 (D1): legacy partial → complete
// Streak: trailing run of scheduled days. Precedence, highest first (V195 D71b):
//   complete / partial -> counts (a day holding BOTH a completion and a Wildcard counts ONCE)
//   Wildcard           -> counts, even when the day is marked skipped
//   skipped            -> breaks
//   pending            -> transparent, keep walking
// The skip is a fact about the PRESCRIBED SESSION. The Wildcard is a fact about what the
// athlete actually did. The streak measures attendance, and a Wildcard is attendance.
// Rest days never reach here: scheduledDays drops them before any status lookup, so a
// rest-day Wildcard still neither extends the streak nor breaks it.
function computeStreak(){
  const today=new Date(); today.setHours(0,0,0,0);
  const days=scheduledDays(today); let n=0;
  for(let i=days.length-1;i>=0;i--){
    const st=statusOf(days[i].week,days[i].d);
    if(st==='complete'||st==='partial'){ n++; continue; }                          // V195 (D71): short-circuit, so both facts on one day count once
    if(wildcardOn(days[i].week,days[i].d)){ n++; continue; }                       // V195 (D71b): a Wildcard rescues a skipped day
    if(st==='skipped') break;                                                      // a skip with no Wildcard still breaks
    // pending -> transparent, keep walking
  }
  return n;
}
function completedCount(){
  let n=0; const c=getCompleted();
  // @ts-expect-error TS2339 Property 'status' does not exist on type '{}'.
  Object.values(c).forEach(v=>{ const s=v?.status||'complete'; if(s==='complete'||s==='partial') n++; });
  return n;
}
function fireWorkoutPopup(week: any,dayKey: any){
  popFire('workout',{ week:week, dayKey:dayKey, stats:[   // V181 (D4): block tally dropped — a raw count next to a streak said nothing the streak didn't
    {n:String(computeStreak()), l:'Day Streak '+asyIcon('🔥',12), cls:'streak'}
  ]});
}
function skippedCount(){
  let n=0; const c=getCompleted();
  // @ts-expect-error TS2339 Property 'status' does not exist on type '{}'.
  Object.values(c).forEach(v=>{ if((v?.status)==='skipped') n++; });
  return n;
}
// Milestones: 3, 7, 14, 30, then every 30 (60, 90, …).
function streakMilestone(n: any){ return n===3||n===7||n===14||n===30||(n>30&&n%30===0); }
function fireStreakPopup(streak: any){
  popFire('streak',{
    kicker: streak+'-DAY STREAK 🔥',
    stats:[   // V181 (D4)
      {n:String(streak), l:'Day Streak', cls:'streak'}
    ]
  });
}
// Season = (A): fires when the final scheduled training day of the program is completed. Once ever.
// @ts-expect-error TS2554 Expected 1 arguments, but got 0.
function finalScheduledDay(){ const a=scheduledDays(); return a.length?a[a.length-1]:null; }
function seasonShown(){ return localStorage.getItem('ia_season_shown_'+activeProgId)==='1'; }
function markSeasonShown(){ try{localStorage.setItem('ia_season_shown_'+activeProgId,'1');}catch{} }
function releaseSeasonShown(){ try{localStorage.removeItem('ia_season_shown_'+activeProgId);}catch{} }   // V181 (D2): unmark on the final day re-arms the banner
function fireSeasonPopup(){
  popFire('season',{
    stats:[
      {n:String(completedCount()), l:'Workouts'},
      {n:String(skippedCount()), l:'Skips'},
      {n:String(activeProg.totalWeeks||''), l:'Weeks'}
    ]
  });
}
// One dispatcher for every fresh complete. Precedence: season > milestone > workout.
function fireCompletionPopup(week: any,dayKey: any){
  const f=finalScheduledDay();
  if(f && f.week===week && f.d===dayKey && !seasonShown()){
    markSeasonShown();
    fireSeasonPopup();
    return;
  }
  const streak=computeStreak();
  if(streakMilestone(streak)){ fireStreakPopup(streak); return; }
  fireWorkoutPopup(week,dayKey);
}
// Day-after reminder: most recent strictly-past pending non-rest day not yet reminded.
function remindedSet(){ try{return JSON.parse(localStorage.getItem('ia_reminded_'+activeProgId)||'{}');}catch{return{};} }
function markReminded(week: any,d: any){ const m=remindedSet(); m[completedKey(week,d)]=true; try{localStorage.setItem('ia_reminded_'+activeProgId,JSON.stringify(m));}catch{} }
function _todayStamp(){ const t=new Date(); return t.getFullYear()+'-'+(t.getMonth()+1)+'-'+t.getDate(); }
function maybeShowReminder(){
  if(!activeProg?.startDate) return;
  const lastKey='ia_remind_last_'+activeProgId;
  if(localStorage.getItem(lastKey)===_todayStamp()) return; // once per calendar day
  const today=new Date(); today.setHours(0,0,0,0);
  const days=scheduledDays(today).filter(x=>x.date<today); // strictly past
  const rem=remindedSet(); let target=null;
  for(let i=days.length-1;i>=0;i--){
    const x=days[i];
    if(statusOf(x.week,x.d)) continue;            // already resolved
    if(rem[completedKey(x.week,x.d)]) continue;    // already reminded
    target=x; break;
  }
  if(!target) return;
  const day=activeProg.weeks[target.week]?.[target.d]; if(!day) return;
  localStorage.setItem(lastKey,_todayStamp());
  markReminded(target.week,target.d);
  const esc=(day.title||'Workout').replace(/'/g,"\\'");
  // V141 missed-session doctrine (RG Active harvest, copy-only): a missed session is
  // never crammed back into the week ahead, and a gap of a week or more earns re-entry
  // guidance instead of guilt. No volume is changed here — the program stays as
  // written; the copy just tells the truth about how to come back.
  let _gap=0; for(let i=days.length-1;i>=0;i--){ if(statusOf(days[i].week,days[i].d)) break; _gap++; }
  // V220 (D175, P-POPCOND 1b): a short gap draws a reminder-pool line and the sub carries the
  // doctrine; a week or more keeps the fixed re-entry guidance whole.
  const _remMsg=_gap>=7
    ? 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.'
    : popPick('reminder',target.week,target.d);
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ su
  const _remSub=DAY_FULL[target.d]+', Wk '+target.week+' · '+(day.title||'Workout');
  popFire('reminder',{
    msg:_remMsg,
    sub:_gap>=7?_remSub:_remSub+'. The week ahead stays as written.',
    actions:[
      {label:'✓ Done', cls:'go', onclick:`resolveReminder(${target.week},'${target.d}','${esc}','complete')`},
      {label:'✕ Skip', cls:'skip', onclick:`resolveReminder(${target.week},'${target.d}','${esc}','skipped')`}
    ],
    triple:true
  });
}
function resolveReminder(week: any,dayKey: any,title: any,status: any){
  snapshotDay(week,dayKey);
  const c=getCompleted(); c[completedKey(week,dayKey)]={title:title||null,ts:Date.now(),status}; saveCompleted(c);
  markReminded(week,dayKey);
  popClose();
  renderWeekView();
  const labels={complete:'Locked in ✓',skipped:'Skipped ✕ — the week moves on'};   // V181 (D3)
  // @ts-expect-error TS7053 Element implicitly has an 'any' type because expression of type 'any' can't be used to index type '{ co
  showToast(labels[status]||'Updated');
  if(status==='complete') setTimeout(()=>fireCompletionPopup(week,dayKey),380);
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  completedCount, computeStreak, finalScheduledDay, fireCompletionPopup, maybeShowReminder, popFire, releaseSeasonShown,
  statusOf,
};
