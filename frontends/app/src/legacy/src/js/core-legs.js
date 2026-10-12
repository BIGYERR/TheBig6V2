import { _ssLegal, _swapUniverseList, seededRand } from '../../../../../../core/src/engine/exercise-library.ts';
import { isTrackableWeight } from '../../../../../../core/src/engine/exercise-kinds.ts';
import { ALL_DAYS_ORDER, _ISO_ORDER } from '../../../../../../core/src/engine/calendar.ts';
import { CORE_PILLARS, CORE_SPEED_TYPES } from '../../../../../../core/src/engine/prehab.ts';
import { applyInjuryFilter } from '../../../../../../core/src/engine/injury.ts';
import { _auxGearOK, _pattern } from '../../../../../../core/src/engine/region-caps.ts';
import { _swapInjuryOK } from './swap-prefs.js';
import { _compoundTier, d18LongRunDayPass } from './budget-engine-d.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// Build a core finisher block applying the PRIORITY + PLACEMENT rules.
//  week           — weekly pillar/exercise rotation
//  role           — today's lift role
//  isHardRunToday — today carries a speed/interval run
//  tomorrowHot    — next training day is a speed run or heavy dead/squat day
function getDynamicCoreBlock(week, role, isHardRunToday, tomorrowHot, slot, equip, onCard){
  const P = CORE_PILLARS;
  // V193 (D44): CORE_PILLARS is injected at WEEK ASSEMBLY, downstream of the pool block,
  // so _gearOK never saw it and 'Landmine rotations' printed on home_basic and minimal —
  // tiers whose own wizard copy says "No barbell". Every pillar the rotation reads is
  // filtered through _pi so one lens answers for all of them.
  //
  // V193 (D46-c): the lens is _auxGearOK — the per-tier legality table this file already
  // carries and the swap sheet already trusts — not a second private list. D44's gate knew
  // one word, 'landmine', so it answered for one member of one pillar; 'Cable woodchoppers'
  // (commercial owns the only cable) and 'Medicine ball rotary toss' walked straight past
  // it onto every tier. One table, THREE readers: draw time here, swap time in
  // auxSwapCandidates, and the protect-tier upper-limb branch in buildSections, which
  // builds its own anti-rotation draw and was the reader D46-c missed. A member added to
  // any pillar later is gated the day it lands, on all three.
  //
  // NO FALLBACK TO THE UNFILTERED LIST. A filtered-empty pool that falls back to the raw
  // one is the V122 _gear trap: it leaks exactly on the tier the gate exists for, and it
  // leaks silently. The pillars _pi reads hold at least two legal members on every tier
  // (measured, all six tiers — rotational_power 3/3/4/5/7/6 for bodyweight / minimal /
  // home_basic / home_full / commercial / crossfit; anti_rotation 3/6/7/7/7/7 after D49
  // added two gear-free members and tagged the Pallof press as band gear; dynamic_bracing 4
  // everywhere), so the filter cannot empty a pillar. These are MEASURED, not assumed: run
  // _auxGearOK over CORE_PILLARS[key].items for each tier and count, which is what the draw
  // on the line below does. The anti_rotation row is also the AR_LEGAL hand table in
  // tests/gates/g193_gear_gates.js, derived there from _AUX_GEAR (search '_AUX_GEAR=') and
  // the tier columns, so the two agree by two independent routes. Re-derive, do not trust
  // this line. If a
  // future member list would drop one below two, the pillar must GROW, not the gate soften.
  //
  // Bodyweight is gated here too. D44 exempted it because the pillar then held four members
  // and _BW_SUBS mapped the landmine to 'Standing torso rotations (slow)' while the other
  // two rotational members both swept to 'Dead bug (slow tempo)' — filtering cost the tier
  // its third distinct movement and the pair collapsed to a ONE-ITEM block. D46 promoted
  // that substitution target to a real member and added two more, so bodyweight now draws
  // three distinct legal names on its own and the sweep no longer has to invent one.
  //
  // An undefined equip still means "gear unknown" and leaves the pillars untouched, so no
  // existing caller is silently narrowed.
  //
  // V193 (same-card fix): a SECOND lens, on the same draw. 'Farmer carry' is a member of
  // anti_rotation and is also the movement the lift day's 'Loaded carry finisher' picks,
  // and the two never spoke — 16 day-builds printed the identical carry twice on one card,
  // one per loaded gear tier. The CORE BLOCK yields, not the finisher, because the core
  // block is the LATER reader: it is injected at week assembly and can see the built card,
  // while the finisher runs inside buildSections and cannot see a block that does not exist
  // yet. Same shape as the anti-extension/anti-rotation walk in the protect-tier branch.
  // The subtraction runs AFTER the gear filter, so it can never widen legality, and the
  // guard below can only ever hand back a gear-legal list — it is a crash guard, not the
  // V122 _gear trap. The floor here is an invariant, not a table: under _auxGearOK the
  // bodyweight-legal set is a SUBSET of the minimal-legal set, so a bodyweight count can
  // never exceed a minimal count on the same pillar. Counts in comments are claims with no
  // gate behind them and they go stale silently, so the executable checks own this one:
  // the anti-rotation floor gate, and tests/measure/v193_d49_antirotation.js.
  const _onCard = onCard || Object.create(null);
  const _pi = key => {
    const g = equip===undefined
      ? (P[key].items||[])
      : (P[key].items||[]).filter(it=>_auxGearOK(it.name, equip));
    const d = g.filter(it=>!_onCard[String(it.name||'').trim().toLowerCase()]);
    return d.length ? d : g;
  };
  const R = week + (slot||0); // rotation seed — offset by slot so the week's two core days differ
  // V193 (D46): rotOn takes the rotation CLOCK explicitly. rot() is the same function it
  // always was — clock R — so every caller below reads identically. A pillar that only turns
  // on some steps of R passes its OWN turn count instead, which is the whole D46 fix: the
  // index must count the pillar's turns, not the global step.
  const rotOn = (clock,arr,n)=>arr[(((clock-1+n)%arr.length)+arr.length)%arr.length];
  const rot = (arr,n)=>rotOn(R,arr,n);
  let pillar, items;
  if(isHardRunToday){
    // PLACEMENT: hard-run day → low-fatigue STATIC stability to protect the spine.
    // Never loaded (ab wheel) and never hip-flexion grinding right after a speed session.
    pillar='anti_extension';
    items=[rot(P.anti_extension.static, R), rot(_pi('anti_rotation'), R)]; // rotating static brace + low-fatigue anti-rotation
  } else if(tomorrowHot){
    // PRIORITY: tomorrow is a speed run or heavy dead/squat day → low-fatigue pillars ONLY.
    // This branch can never emit ab-wheel/weighted-deadbug or hanging-raises/Garhammer.
    pillar = (R%2===0) ? 'rotational_power' : 'anti_rotation';
    // V178 (D6): was items.slice(0,2) — the first two members, every week, forever. On a
    // half/marathon build every core day is a hot-tomorrow day, so the athlete saw Side
    // plank + Pallof press for 14 weeks and the carries in this pillar were unreachable.
    // Same rotation shape dynamic_bracing already uses; every member of both pillars is
    // low-fatigue by construction, so the PRIORITY guarantee is unchanged.
    // V193 (D46): was rot(...,R) — but this branch alternates its two pillars on R%2, so each
    // pillar only turns once per TWO steps of R. rot() reads arr[(R-1+n)%len], so n=R made the
    // index 2R-1 and rotational_power (live on even R only) froze at 2R-1 mod 4 === 3 forever:
    // Landmine rotations + Windshield wipers, every tier, all 14 weeks. Index by the pillar's
    // OWN turn count instead. Even R gives R/2, odd R gives (R-1)/2, so one expression is the
    // correct turn counter for whichever pillar this step selected.
    const T2 = Math.floor(R/2);
    items = [rotOn(T2,_pi(pillar),T2), rotOn(T2,_pi(pillar),T2+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);
  } else {
    // PLACEMENT: clear-runway upper/lighter day → rotate the higher-fatigue pillars in here,
    // and ONLY here. Loaded anti-extension and dynamic bracing are confined to this branch.
    const key = ['dynamic_bracing','anti_extension_loaded','rotational_power'][((R-1)%3+3)%3];
    if(key==='anti_extension_loaded'){
      pillar='anti_extension';
      items=[rot(P.anti_extension.loaded, R), rot(P.anti_extension.static, R)];
    } else {
      pillar=key;
      // V193 (D46): key cycles three ways on ((R-1)%3), so rotational_power (the index-2 slot)
      // is live only when (R-1)%3===2. Its own turn counter is therefore Math.floor((R-1)/3),
      // which advances by exactly one per selection. The old ._pi(key).slice(0,2) was the last
      // survivor of the pattern V178 (D6) removed from the other pillars: the first two members,
      // every week, forever — so the members added in D46 could never be reached from here.
      // Same rotation + dedup shape dynamic_bracing already uses, one line below.
      const T3 = Math.floor((R-1)/3);
      items = (key==='dynamic_bracing')
        ? [rot(_pi('dynamic_bracing'), R), rot(_pi('dynamic_bracing'), R+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2)
        : [rotOn(T3,_pi(key),T3), rotOn(T3,_pi(key),T3+1)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,2);
    }
  }
  return {label:'', core:true, pillar, coreHeader:'Core — '+P[pillar].name, items: items.slice(0,2)};
}

// Lift roles that heavily tax legs/posterior chain — the squat day ('legs') and the
// deadlift day ('pull'). Single source of truth shared by the core-placement engine AND
// the hard-day leg buffer, so the two can never disagree about what counts as leg-heavy.
const LEG_HEAVY_ROLES = new Set(['legs','pull']);
function roleIsLegHeavy(role){ return LEG_HEAVY_ROLES.has(role); }

// Is the training day AFTER orderedTrain[idx] high-fatigue (no heavy trunk before it)?
function _coreTomorrowHot(weekObj, dayRoles, orderedTrain, idx){
  const next = orderedTrain[(idx+1) % orderedTrain.length];
  const nc = weekObj[next] && weekObj[next].cardio;
  const hotCardio = !!(nc && (nc.legLoad || CORE_SPEED_TYPES.has(nc.assignedType)));
  const hotLift = roleIsLegHeavy(dayRoles[next]); // heavy squat / deadlift days
  return hotCardio || hotLift;
}

// Inject up to 2 deconflicted core finishers into one week's day map, in place.
function injectDynamicCore(weekObj, dayRoles, trainDays, week, equip){
  // The protect-tier rehab day builds its own full trunk block, so it is excluded here
  // rather than receiving a second 2-item finisher on top. Detected off the built
  // sections instead of re-deriving the injury plan, so the two can never disagree.
  const _hasTrunk = d => ((weekObj[d]&&weekObj[d].sections)||[]).some(sec=>sec&&/^Trunk /.test(sec.label||''));
  const ordered = ALL_DAYS_ORDER.filter(d => trainDays.includes(d) && dayRoles[d] && dayRoles[d]!=='active' && !_hasTrunk(d));
  if(!ordered.length) return;
  const dist=(a,b)=>{const r=Math.abs(ALL_DAYS_ORDER.indexOf(a)-ALL_DAYS_ORDER.indexOf(b));return Math.min(r,7-r);};
  const isHardRun=d=>{const c=weekObj[d]&&weekObj[d].cardio;return !!(c&&CORE_SPEED_TYPES.has(c.assignedType));};
  const LIGHT=new Set(['push','push_light','full']); // prefer upper/light days; keep trunk off heavy legs/pull when possible
  const chosen=[];
  const hr=ordered.find(isHardRun);
  if(hr) chosen.push(hr); // slot 1: spine-protect the hard-run day
  // remaining slots: furthest-spread day, preferring light/upper roles
  while(chosen.length<2){
    const avail=ordered.filter(d=>!chosen.includes(d));
    if(!avail.length) break;
    const light=avail.filter(d=>LIGHT.has(dayRoles[d]));
    const pool=light.length?light:avail;
    const next=pool.slice().sort((a,b)=>{
      const da=chosen.length?Math.min(...chosen.map(c=>dist(a,c))):99;
      const db=chosen.length?Math.min(...chosen.map(c=>dist(b,c))):99;
      return db-da; // furthest from already-chosen first
    })[0];
    if(!next) break;
    chosen.push(next);
  }
  chosen.slice(0,2).forEach((day,slot)=>{
    const idx=ordered.indexOf(day);
    const hot=_coreTomorrowHot(weekObj,dayRoles,ordered,idx);
    // V193 (same-card fix): the names this day already prescribes, read off the BUILT
    // sections rather than re-derived, so the core draw and the section builder can never
    // disagree about what is on the card. Lowercased on the same axis the bodyweight
    // dedupe sweep uses.
    const _onCardNames=Object.create(null);
    ((weekObj[day]&&weekObj[day].sections)||[]).forEach(function(sec){
      ((sec&&sec.items)||[]).forEach(function(it){ if(it&&it.name) _onCardNames[String(it.name).trim().toLowerCase()]=1; });
    });
    const block=getDynamicCoreBlock(week, dayRoles[day], isHardRun(day), hot, slot, equip, _onCardNames);
    if(block) block.optional=true;
    if(weekObj[day] && Array.isArray(weekObj[day].sections)){
      weekObj[day].sections.push(block);
      if(Array.isArray(weekObj[day].tags) && !weekObj[day].tags.includes('core')) weekObj[day].tags.push('core');
    }
  });
}

// Keeps every heavy lower-body LIFT (squat 'legs' + deadlift 'pull') out of a 48h collision
// with leg-taxing cardio (hard/long runs & bikes flagged legLoad). Moves the LIFT only — the
// run progression is doctrine-tabled and must never be reshuffled. Deadlift is cleared first
// (highest CNS cost), then squat. Adjacency wraps the week. Best-effort: on tight consecutive
// weeks a full buffer can be impossible — then it flags a note instead. Mutates dayRoles in place.
// ── V189 (D36): NRC RACE PROGRAMS PLACE THE LEG LIFTS BY THE RUN WEEK'S SHAPE ──────
// The 48h rule below treats every leg-load run alike, so on a five-day half the deadlift
// day was pushed off the speed sessions and landed on the recovery run, the day before the
// long run; the swap that put it there was lateral (Tue was only adjacent to Mon), taken by
// the same-day fallback because it accepts any non-run day. Measured on V188 across 324 NRC
// configs: 90 leg-heavy days on the long-run eve, 9 on the long-run day. Doctrine ruled
// (Mario, concur): hard days hard. On a race program the long run and its eve are OFF
// LIMITS to the hinge and the squat; a speed day is where the hinge belongs; the squat and
// armor day (calves, ankles, hips) prefers its own day or the day after a speed session,
// so the calf work does not stack on the run that already loads the calves.
// Cost table, per day, lower is better. Forbidden = the long-run day and its eve.
//   pull: clean 0 · speed same-day 0.5 · recovery-run same-day 1 · day after speed 1 · day before speed 2 · day after long 2
//   legs: clean 0 · day after speed 1 · recovery-run same-day 1 · speed same-day 1.5 · day before speed 2 · day after long 2
// "Clean" is a lift-only day: a recovery run is the easy day being protected, not a free slot.
// Every ordered (pull, legs) pair is scored; min total wins, then the widest spacing between
// the two axial days, then the earliest legs day. If no pair is finite the layout is too
// tight and the NSW rule below runs as before. D127 (V205) widened the door: NRC race
// programs and the NSW pace family enter here. D104a (V208): so does run_base, by its keys.
// Every other NSW goal gets a null shape and the 48h rule runs unchanged.
function _nrcRunShape(wk1, trainDays){
  const iso = d => _ISO_ORDER.indexOf(d);
  // D127 (V205): the pace family reaches this same shape through its own lens. The NSW
  // engine sets no isNRC (that flag means Nike-verbatim and is not faked here) and names
  // BOTH of its easy runs `Long Slow Distance (LSD)`, so the long run is told from the
  // easy one by legLoad — the flag the scheduler already sets from assignedType
  // (lsd_long true, lsd_easy false). INT and CHI are the speed days. Scoped to
  // run_pace_goal and its two V126 aliases. run_base has its own arm below (D104a); every
  // other NSW goal falls through with a null shape and keeps the 48h rule below.
  const _paceFam = g => g==='run_pace_goal' || g==='run_mile_time' || g==='run_15_under10';
  let long = null, base = false; const speed = new Set(), easy = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(!c || c.type!=='run') return;
    if(c.isNRC){
      if(/^long run/i.test(c.subtype||'')) long = d; else if(/^speed run/i.test(c.subtype||'')) speed.add(d); else easy.add(d);
    } else if(_paceFam(c.goalId)){
      // D103a (V208): a keyed session reads its key, never its label; a test is neither the
      // speed day nor the long run, so it never enters the shape. Unkeyed: the label, as before.
      const _st = c.subtype||'', _k = c.dose && c.dose.key;
      if(_k ? (_k === 'int' || _k === 'chi') : /^(Interval \(INT\)|Continuous High Intensity \(CHI\))/.test(_st)) speed.add(d);
      else if(_k === 'trial') return;
      else if(c.legLoad) long = d;
      else easy.add(d);
    } else if(c.goalId === 'run_base'){
      // D104a (V208): run_base reads its keys only. The long run is the long-keyed run (the V159
      // budgeted "Easy Run — Long" is keyed long and carries no legLoad); every other run is easy.
      // No speed day: no measured lattice puts a steady run in the placement week, so the steady
      // arm is not built (coach; reinstate with a measure that reaches it).
      base = true;
      if(c.dose && c.dose.key === 'long') long = d; else easy.add(d);
    } });
  if(!long) return null;
  const eve = _ISO_ORDER[(iso(long)+6)%7], after = _ISO_ORDER[(iso(long)+1)%7];
  return { long, eve, after, speed, easy, forbidden: new Set([long, eve]), base };
}
// One cost table, two readers: the placement below and deconflictSameRegion's guard, so a
// region swap can never undo a placement (it did, before the guard read this table).
function _nrcLegCost(shape, role, d){
  if(shape.forbidden.has(d)) return Infinity;
  const iso = x => _ISO_ORDER.indexOf(x);
  const prev = _ISO_ORDER[(iso(d)+6)%7], next = _ISO_ORDER[(iso(d)+1)%7];
  let c = 0;
  if(shape.speed.has(d)) c += role==='pull' ? 0.5 : 1.5;
  if(shape.easy.has(d)) c += 1;
  if(shape.speed.has(prev)) c += 1;
  if(shape.speed.has(next)) c += 2;
  if(d===shape.after) c += 2;
  return c;
}
function nrcLegLiftPlacement(dayRoles, trainDays, wk1){
  const shape = _nrcRunShape(wk1, trainDays); if(!shape) return null;
  const roles = ['pull','legs'].filter(r => trainDays.some(d => dayRoles[d]===r));
  if(!roles.length) return null;
  const iso = d => _ISO_ORDER.indexOf(d);
  const cost = (role, d) => _nrcLegCost(shape, role, d);
  const dist = (a,b) => { const r = Math.abs(iso(a)-iso(b)); return Math.min(r, 7-r); };
  let best = null;
  if(roles.length===1){
    trainDays.forEach(d => { const c = cost(roles[0], d); if(c<Infinity && (!best || c<best.c)) best = {c, days:{[roles[0]]:d}}; });
  } else {
    trainDays.forEach(p => trainDays.forEach(l => {
      if(p===l) return;
      const c = cost('pull',p) + cost('legs',l); if(c===Infinity) return;
      const sp = dist(p,l);
      if(!best || c<best.c || (c===best.c && sp>best.sp) || (c===best.c && sp===best.sp && iso(l)<iso(best.days.legs))) best = {c, sp, days:{pull:p, legs:l}};
    }));
  }
  if(!best) return null;
  // Leg roles take their days; every other role keeps its template order over what is left.
  const rest = trainDays.filter(d => !roleIsLegHeavy(dayRoles[d])).map(d => dayRoles[d]);
  const taken = new Set(Object.values(best.days));
  const open = trainDays.filter(d => !taken.has(d));
  Object.keys(best.days).forEach(r => { dayRoles[best.days[r]] = r; });
  open.forEach((d,i) => { dayRoles[d] = rest[i] || 'full'; });
  // D104a (V208): run_base speaks of its own week.
  return { legRecoveryNote: shape.base ? 'Nothing heavy lands on your long run or the day before it. Your lifting days were placed around it.'
    : 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.' };
}
function deconflictLegLiftDays(dayRoles, trainDays, cardioSchedule){
  // D104a (V208): the placement reads the FIRST week whose runs carry a `long` key, on every NSW
  // arm (a test is not the long run, so the placement reads the next real one). NRC, bike and
  // swim carry no key, so they keep week 1, as does a program with no long-keyed run.
  const _lw = Object.keys(cardioSchedule).map(Number).filter(n => n >= 1).sort((a,b) => a-b)
    .find(n => trainDays.some(d => { const c = (cardioSchedule[n] || {})[d]; return !!(c && c.dose && c.dose.key === 'long'); }));
  const wk1 = cardioSchedule[_lw || 1] || {};
  const _i = d => ALL_DAYS_ORDER.indexOf(d);
  const _dist = (a,b)=>{ const r=Math.abs(_i(a)-_i(b)); return Math.min(r,7-r); };

  // V189 (D36): race programs place by run shape. D127 (V205): so does the pace family —
  // routing is by the shape, not by a second goal test here, so there is exactly one place
  // that decides who takes the cost table. D104a (V208): run_base takes it too, and the
  // placement runs BEFORE the leg-load exit below: run_base's long run is the long-keyed run,
  // which carries no legLoad, so a week with no legLoad card still has a long run to place
  // around. A null shape (every other NSW goal, any program with no long run) falls through.
  const _nrc = nrcLegLiftPlacement(dayRoles, trainDays, wk1);
  if(_nrc) return _nrc;
  const legTaxing = new Set();
  trainDays.forEach(d => { const c = wk1[d]; if(c && c.legLoad) legTaxing.add(d); });
  if(!legTaxing.size) return { legRecoveryNote:null };

  // d conflicts if it sits on, or within 48h of, any leg-taxing cardio day.
  const conflicted = d => legTaxing.has(d) || [...legTaxing].some(t=>_dist(d,t)===1);
  // A swap target must not itself be leg-heavy or active, and must pass the handed test.
  const findSafe = (liftDay, test) => trainDays.find(d =>
    d!==liftDay && !roleIsLegHeavy(dayRoles[d]) && dayRoles[d]!=='active' && !test(d));

  // V153 (F2): three honest tiers. The old fallback branch emitted the full-success
  // message while delivering only same-day avoidance — the note overclaimed exactly when
  // the athlete most needed the caveat. Severity is kept across both roles (worst wins).
  let tier = 0; // 0 none · 1 full 48h · 2 same-day dodged only · 3 stuck
  ['pull','legs'].forEach(role => {            // deadlift first (higher CNS cost), then squat
    const liftDay = trainDays.find(d=>dayRoles[d]===role);
    if(!liftDay || !conflicted(liftDay)) return;
    let safe = findSafe(liftDay, conflicted);                 // ideal: clears the full 48h buffer
    const full = !!safe;
    if(!safe) safe = findSafe(liftDay, d=>legTaxing.has(d));  // fallback: at least dodge same-day
    if(safe){
      const t = dayRoles[liftDay]; dayRoles[liftDay] = dayRoles[safe]; dayRoles[safe] = t;
      tier = Math.max(tier, full ? 1 : 2);
    } else {
      tier = 3;
    }
  });
  const note = tier===3 ? 'Your training days are tightly packed, so heavy lifting and your hardest runs still fall close together. A rest day between them would give your lower body more recovery room \u2014 hinge work the day before a hard run is capped at RPE 7 automatically.'
    : tier===2 ? 'Your heavy lifting was kept off the same day as your hardest runs, but this schedule has no fully clear 48-hour window \u2014 hinge work landing the day before a hard run is capped at RPE 7 automatically.'
    : tier===1 ? 'Your heavy lifting was spaced out from your hardest runs \u2014 at least 48 hours where the schedule allows, so pre-fatigued legs don\u2019t blunt your speed work or stress the joints.'
    : null;
  return { legRecoveryNote: note };
}

// ---- SAME-REGION LIFT SPACING (V30) ------------------------------------------
// Doctrine: 2020 PTG wants a day between same-region STRENGTH sessions. Runs AFTER the cardio
// buffer, on the already-deconflicted roles, and is forbidden from re-breaking it. Targets the
// real offenders only: a PRESS cluster ({push, push_light} on adjacent days) and back-to-back
// 'full' days. pull/legs adjacency is intentionally left alone (by-design PPL; their shared
// axial load is already handled by deconflictLegLiftDays). Silent on 1-5 day splits. Mutates
// dayRoles in place; returns a soft-warn note when a tight week cannot be fully spaced.
// ── SAME LIFT ON BACK-TO-BACK DAYS (V117) ────────────────────────────────────
// deconflictLegLiftDays buffers the squat and deadlift ROLES. deconflictSameRegion reads
// role labels at schedule time, before any exercise exists. capRegionalFatigue counts
// weekly movement-pattern saturation. None of the three compares exercise IDENTITY across
// adjacent days, so a loaded hinge could land Mon AND Tue with every weekly guard
// satisfied — `Barbell Romanian deadlift` on mon + tue + sat inside one week was measured
// on the V116 build. Of 2,287 same-week repeats over 60 configs, 550 fell on consecutive
// days: 129 loaded, and 84 of those 129 were hip hinge (Barbell RDL, KB single-leg
// deadlift, KB swing). Loaded eccentric hamstring work on back-to-back days puts session
// two in the DOMS trough — worse output, more accumulated fatigue, no added adaptation.
//
// SCOPE IS LOADED MOVEMENTS ONLY (Mario's call). The other 421 cases are pushup variants
// and plyos: a monotony complaint, not a recovery hazard, and forcing a swap there
// exhausts the small pools on the minimal and home_basic tiers.
//
// Candidates come from _SWAP_UNIVERSE, which THIS build harvested through pick(), so gear
// legality is inherited rather than re-derived by a name regex — the same reasoning that
// makes the swap sheet trustworthy. The prescription rides along verbatim; pure RPE is
// what makes that honest. Deterministic from cfg + seed like everything else in the
// pipeline: rank by load distance, then a seeded choice among the top three.
function _adjDayPairs(totalWeeks){
  // Calendar-adjacent training-day pairs across the whole block, INCLUDING the Saturday ->
  // Sunday week boundary. Weeks are built independently, so week w's Saturday must be
  // compared against week w+1's Sunday, never against week w's own Sunday.
  const out=[];
  for(let w=1;w<=totalWeeks;w++){
    for(let i=1;i<_ISO_ORDER.length;i++) out.push([w,_ISO_ORDER[i-1],w,_ISO_ORDER[i],(w-1)*7+(i<6?i:0)]);
    if(w<totalWeeks) out.push([w,'sun',w+1,'mon',(w-1)*7+6]);
  }
  return out;
}
// V217 (D160): the previous day as it will ship past d18LongRunDayPass, read off a deep copy — the live week is never touched.
function _d18View(A, wA, dA){
  if(!A) return A;
  const o={}; o[wA]={}; o[wA][dA]=JSON.parse(JSON.stringify(A));
  d18LongRunDayPass(o);
  return o[wA][dA];
}
function deconflictAdjacentDupes(weeks, cfg, seed, totalWeeks){
  const universe=(typeof _swapUniverseList==='function')?_swapUniverseList():[];
  if(!universe.length) return 0;
  let moved=0;
  // V143: 'power' added to the exemption. Power picks are gated by _powerAllowed at
  // selection; a dedupe rename swaps in a movement checked only against _swapInjuryOK,
  // which bypassed the power-legality gate — the sweep caught a workaround-tier athlete
  // holding 'Double Kettlebell deadlift 8×3 — max intent' in a block that exists because
  // it was filtered to no-landing work. Repeating an explosive movement across adjacent
  // days is legitimate anyway: power is a practiced quality, same reasoning as mains.
  const isMainSec=sec=>/^(main|primer|power)/i.test((sec&&sec.label)||'');
  const nameSet=day=>{const s=Object.create(null);
    ((day&&day.sections)||[]).forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{if(it&&it.name)s[it.name.toLowerCase()]=1;}));
    return s;};
  const touched=Object.create(null);
  _adjDayPairs(totalWeeks).forEach(function(pair,pi){
    const wA=pair[0], dA=pair[1], wB=pair[2], dB=pair[3];
    const A=weeks[wA]&&weeks[wA][dA], B=weeks[wB]&&weeks[wB][dB];
    if(!A||!B||A.rest||B.rest||!Array.isArray(A.sections)||!Array.isArray(B.sections)) return;
    const inA=nameSet(_d18View(A, wA, dA));   // V217 (D160): a name D18 strips from A is not yesterday's work
    B.sections.forEach(function(sec){
      if(!sec||!Array.isArray(sec.items)) return;
      // The day's MAIN lift is never rewritten. Repeating a main across a heavy/light pair
      // is legitimate programming, and the role-level passes already own that spacing.
      if(isMainSec(sec)) return;
      sec.items.forEach(function(it,ii){
        if(!it||!it.name) return;
        if(!inA[it.name.toLowerCase()]) return;          // not yesterday's work
        if(!isTrackableWeight(it.name)) return;          // loaded only
        const pat=_pattern(it.name); if(!pat) return;    // holds and core swap to nothing
        const onB=nameSet(B);
        const outTier=_compoundTier(it.name);
        // V164 D5 (same hole as user swaps): a rename inside a 2-item superset must stay
        // station-legal against the surviving partner, or the dedupe quietly rebuilds the
        // exact cross-station pair the draw-time filter removed. Curated already-cross
        // pairs stay unguarded, same semantics as _ssPartnerOf.
        const _ssP=(sec.superset&&sec.items.length===2)?(((sec.items[1-ii]||{}).name)||null):null;
        const _ssGuard=(_ssP&&_ssLegal(_ssP,it.name))?_ssP:null;
        const cands=universe.filter(function(n){
          if(!n||n===it.name) return false;
          if(onB[n.toLowerCase()]||inA[n.toLowerCase()]) return false;
          if(_pattern(n)!==pat) return false;            // like for like
          if(!isTrackableWeight(n)) return false;        // a loaded slot stays loaded
          if(_ssGuard&&!_ssLegal(n,_ssGuard)) return false; // V164 D5
          return _swapInjuryOK(n,cfg);
        }).sort(function(a,b){
          const da=Math.abs(_compoundTier(a)-outTier), db=Math.abs(_compoundTier(b)-outTier);
          if(da!==db) return da-db;
          return a.localeCompare(b);
        });
        // Pool exhausted: LEAVE IT. A duplicate on consecutive days is worse than nothing
        // to swap to, but reaching outside the legal universe to avoid it is worse than both.
        if(!cands.length) return;
        const top=cands.slice(0,3);
        const to=top[Math.floor(seededRand(seed+wB*97+(pair.length>4?pair[4]:pi)*13+ii)*top.length)]||top[0];
        const was=it.name;
        it.name=to;
        if(sec.label&&sec.label.indexOf(was)>=0) sec.label=sec.label.split(was).join(to);
        touched[wB+'|'+dB]=1; moved++;
      });
    });
  });
  // Same discipline as applySwapPrefs: a substitution must not walk a movement back into a
  // program that stripped it for an injury. Candidates already passed _swapInjuryOK, so this
  // is a second gate, and applyInjuryFilter is idempotent.
  if(moved && cfg && cfg.injury){
    Object.keys(touched).forEach(function(k){
      const w=k.split('|')[0], d=k.split('|')[1];
      const day=weeks[w]&&weeks[w][d];
      if(day&&Array.isArray(day.sections)) day.sections=applyInjuryFilter(day.sections,cfg);
    });
  }
  return moved;
}

function deconflictSameRegion(dayRoles, trainDays, cardioSchedule){
  const PRESS = new Set(['push','push_light']);
  const ALL = ALL_DAYS_ORDER.filter(d => trainDays.includes(d));
  const _i = d => ALL_DAYS_ORDER.indexOf(d);
  const _dist = (a,b) => { const r = Math.abs(_i(a)-_i(b)); return Math.min(r, 7-r); };
  // cardio leg-load conflict set -- a swap may never re-introduce a leg/run collision
  const wk1 = cardioSchedule[1] || {};
  const legTaxing = new Set(); trainDays.forEach(d => { const c = wk1[d]; if(c && c.legLoad) legTaxing.add(d); });
  const cardioConflicted = d => legTaxing.has(d) || [...legTaxing].some(t => _dist(d,t)===1);
  // V189 (D36): on NRC programs the leg roles are scored by the placement's own cost table
  // (forbidden days weigh 10), so a region swap can never make the placement worse. D127
  // (V205): the pace family now produces a shape too, so the same guard holds there and the
  // long-run eve stays forbidden through the region pass. Where _nrcRunShape is null the
  // count is the V30 one, byte-identical.
  const _shape = _nrcRunShape(wk1, trainDays);
  const cardioConflicts = dr => ALL.reduce((n,d) => n + (roleIsLegHeavy(dr[d]) ? (_shape ? Math.min(10, _nrcLegCost(_shape, dr[d], d)) : (cardioConflicted(d) ? 1 : 0)) : 0), 0);
  const regionOf = role => PRESS.has(role) ? 'press' : (role==='full' ? 'full' : null);
  const collisions = dr => {
    let n = 0;
    for(let a=0;a<ALL.length;a++) for(let b=a+1;b<ALL.length;b++){
      const ra = regionOf(dr[ALL[a]]), rb = regionOf(dr[ALL[b]]);
      if(ra && ra===rb && _dist(ALL[a],ALL[b])===1) n++;   // same region on adjacent days
    }
    return n;
  };
  if(collisions(dayRoles)===0) return { regionRecoveryNote:null };
  const cardioBase = cardioConflicts(dayRoles);   // never let a region swap worsen this
  let note = null, guard = 0;
  while(collisions(dayRoles) > 0 && guard++ < 30){
    const before = collisions(dayRoles);
    let improved = false;
    for(const moveDay of ALL){
      for(const tgt of ALL){
        if(tgt===moveDay) continue;
        const a = dayRoles[moveDay], b = dayRoles[tgt];
        if(a===b) continue;
        dayRoles[moveDay] = b; dayRoles[tgt] = a;                 // try the swap
        if(collisions(dayRoles) < before && cardioConflicts(dayRoles) <= cardioBase){ improved = true; break; }
        dayRoles[moveDay] = a; dayRoles[tgt] = b;                 // revert
      }
      if(improved) break;
    }
    if(improved){
      note = note || 'Your same-region lifting days were spaced out so you are not training the same muscles on back-to-back days - at least a day between, where the schedule allows, for better recovery and quality.';
    } else break;                                                // tight week: cannot fix -> warn
  }
  if(collisions(dayRoles) > 0){
    note = 'Your training days are tightly packed, so some same-region lifting still lands on back-to-back days. A rest day between would give those muscles more recovery room.';
  }
  return { regionRecoveryNote: note };
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { deconflictAdjacentDupes, deconflictLegLiftDays, deconflictSameRegion, injectDynamicCore };
