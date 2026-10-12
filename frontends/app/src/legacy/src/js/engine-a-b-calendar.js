import { LIFTING_FOCUS_TO_GOAL } from './exercise-library.js';
import { ALL_DAYS_ORDER, _ISO_ORDER, _parseLocalDate } from './calendar.js';
import { calcProgramLength } from './nsw-cardio.js';
import { PACE_GOALS, raceAlignment, raceWeekPin } from './nrc-race-bike-swim.js';
import { buildCardioProgression, programTaperWindow } from './cardio-progression.js';
import { deconflictLegLiftDays, deconflictSameRegion } from './core-legs.js';
import { injuryPlan } from './injury.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)

// ============================================================================
// PROGRAM GENERATION PIPELINE  (decoupled A -> B -> C -> D)
// buildProgram() is a thin orchestrator. Each engine takes explicit, read-only
// upstream inputs and returns an explicit payload — no shared mutable god-object,
// no post-hoc dayRoles mutation. Cardio (B) is hoisted ahead of Kinematics (C)
// so the leg-load footprint is a read-only input to calendar planning and lifting
// selection, exactly as a hybrid athlete's recovery budget demands.
// All inner-function bodies are byte-identical to the prior monolith.
// ============================================================================

// ── ENGINE A — TIMELINE & SPLIT ROUTER (structural core) ────────────────────
// Owns: program length, training days, the wave tables, and the deload/taper
// resolver. Pure structure — no cardio, no exercise selection.
function engineA_timeline(cfg){
  const id='prog_'+Date.now();const seed=(cfg.seed!=null?cfg.seed:Date.now()%100000);
  // Resolve internal goal from liftingFocus
  const goal=LIFTING_FOCUS_TO_GOAL[cfg.liftingFocus]||cfg.liftingFocus||'balanced';
  // cardioTypes and cardioGoals come directly from WD now (multi-sport support)
  const cardioTypes = cfg.cardioTypes || [];
  // ── LEGACY GOAL ALIAS (V126) ──────────────────────────────────────────────
  // `run_mile_time` and `run_15_under10` predate `run_pace_goal`, which the wizard now
  // describes as "Target distance + time — 1.5mi under 10 min, mile under 6, etc." — it
  // covers both cases and neither legacy id has been selectable since. They survived as
  // eight scattered references that behaved ALMOST like run_pace_goal and differently in
  // the places nobody updated: no `paceProgression` array (so recovery and tempo stayed on
  // the frozen chart after V125 gave every other pace goal a moving one), omitted from
  // `isSpeedGoal` while included in `isMilGoal`, and needing a hand-written exception in
  // `_perfRun` to get interval work at all. Every one of those was the same bug — two ids
  // meaning one thing and drifting apart.
  // Normalised HERE, at the single point where the engine first reads cfg.cardioGoals, so
  // one statement retires all eight. `cfg` itself is not mutated: buildProgram must stay a
  // pure function of the cfg it was handed, and the freeze/refresh path re-derives from the
  // stored cfg on every boot.
  const _GOAL_ALIAS = {run_mile_time:'run_pace_goal', run_15_under10:'run_pace_goal'};
  const cardioGoals = (()=>{
    const src = cfg.cardioGoals || {};
    let hit = false;
    const out = {};
    Object.keys(src).forEach(k=>{
      const g = src[k];
      const to = g && _GOAL_ALIAS[g.id];
      if(to){ hit = true; out[k] = {...g, id: to, _aliasedFrom: g.id}; }
      else out[k] = g;
    });
    return hit ? out : src;
  })();
  // HYPERTROPHY DENSITY FLAG — when to build the high-volume bodybuilding layout
  // (heavy compound + secondary compound + 2–3 accessories + isolation per session).
  // Fires when: (a) the goal is explicitly Size/hypertrophy, OR (b) cardio is fully
  // disabled ("Lift Only") — a pure-lifting block has the recovery budget to absorb
  // real hypertrophy volume regardless of the chosen lifting focus. When cardio is
  // present (tactical/multi-sport), the leaner deconflicted templates stay as-is so we
  // don't overreach a body that's also running/swimming hard.
  const noCardio = cardioTypes.length === 0;
  const denseHypertrophy = (goal === 'hypertrophy') || noCardio;
  const allDaysList=ALL_DAYS_ORDER;
  const trainDays=allDaysList.filter(d=>!(cfg.restDays||[]).includes(d));
  // Cardio length drives the program; lifting now spans the full program too.
  const _goalsWithExp={...cardioGoals,_experience:cfg.experience||'intermediate',_ageBracket:cfg.ageBracket||'18-35',_eventTargeted:cfg.eventTargeted};
  const cardioLength=calcProgramLength(cardioTypes,_goalsWithExp,goal);
  // Use smart-capped total if doGenerate already computed it (race-date-aware)
  const totalWeeks = cfg._raceDateCappedWeeks || cardioLength.weeks;
  // V166: `_derived` deleted. It was declared here and never written by anything, so
  // every read (`_derived.bench||cfg.bench`) always fell through — a silent no-op that
  // read like a feature. Deriving a live 1RM from logs would change prescriptions
  // mid-block, which is a coaching decision and gets its own ruling if ever wanted (§12).
  // Build dynamic waves supporting up to 26 weeks
  const makeWave = (base, tw) => Array.from({length: Math.max(6,tw)}, (_, i) => base[i % base.length]);
  const waveBase = {
    strength:   [{s:4,r:'6',p:.75},{s:4,r:'5',p:.78},{s:4,r:'4',p:.80},{s:4,r:'3',p:.83},{s:4,r:'2',p:.87},{s:3,r:'1',p:.90},{s:4,r:'5',p:.78},{s:4,r:'4',p:.82},{s:4,r:'3',p:.85},{s:4,r:'2',p:.88},{s:4,r:'2',p:.90},{s:3,r:'1',p:.93}],
    // V137 (Tier-3 Q2, signed): hypertrophy is ACCUMULATION, not intensification. The old
    // arc ran reps DOWN (3×12 → 5×6) and total volume down with it — a strength wave
    // wearing a hypertrophy label. Reps hold at 10; SETS accumulate; effort creeps.
    // Two shapes off one goal because one array cannot serve both program lengths:
    //   ≤6 wk (body path, no deload): 3→4→4→5→5→5 sets, RPE 7→9 (p pinned via
    //   rpeFromWave: .62=7, .68=7.5, .74=8, .80=8.5, .87=9), week 6 is the peak.
    //   >6 wk: three rising 3→4→5-set cycles; idx 3/7/11 are HOLD weeks — masked by the
    //   deload at tw≥10, played as a flat continuation on 7–9-wk builds (no deload gate).
    // Existing deload doctrine (intensity down, sets held) applies unchanged.
    hypertrophy: totalWeeks<=6
      ? [{s:3,r:'10',p:.62},{s:4,r:'10',p:.68},{s:4,r:'10',p:.74},{s:5,r:'10',p:.74},{s:5,r:'10',p:.80},{s:5,r:'10',p:.87}]
      : [{s:3,r:'10',p:.62},{s:4,r:'10',p:.68},{s:5,r:'10',p:.72},{s:5,r:'10',p:.72},{s:3,r:'10',p:.66},{s:4,r:'10',p:.72},{s:5,r:'10',p:.78},{s:5,r:'10',p:.78},{s:3,r:'10',p:.70},{s:4,r:'10',p:.76},{s:5,r:'10',p:.82},{s:5,r:'10',p:.82}],
    fatloss:    [{s:3,r:'15',p:.57},{s:3,r:'12',p:.60},{s:3,r:'12',p:.62},{s:4,r:'10',p:.65},{s:4,r:'10',p:.67},{s:4,r:'8',p:.70},{s:3,r:'12',p:.62},{s:4,r:'10',p:.65},{s:4,r:'10',p:.68},{s:4,r:'8',p:.70},{s:4,r:'8',p:.72},{s:4,r:'8',p:.72}],
    athletic:   [{s:4,r:'6',p:.72},{s:4,r:'5',p:.75},{s:4,r:'5',p:.78},{s:4,r:'4',p:.80},{s:4,r:'3',p:.83},{s:4,r:'3',p:.86},{s:4,r:'5',p:.76},{s:4,r:'4',p:.80},{s:4,r:'3',p:.83},{s:4,r:'3',p:.86},{s:3,r:'2',p:.88},{s:3,r:'2',p:.90}],
    balanced:   [{s:3,r:'8',p:.72},{s:4,r:'6',p:.77},{s:4,r:'5',p:.80},{s:5,r:'5',p:.82},{s:4,r:'4',p:.85},{s:4,r:'3',p:.88},{s:3,r:'8',p:.75},{s:4,r:'6',p:.78},{s:5,r:'5',p:.82},{s:5,r:'5',p:.85},{s:4,r:'4',p:.87},{s:4,r:'3',p:.90}],
    endurance:  [{s:3,r:'12',p:.52},{s:3,r:'12',p:.55},{s:3,r:'10',p:.57},{s:3,r:'10',p:.60},{s:3,r:'8',p:.62},{s:3,r:'8',p:.65},{s:3,r:'10',p:.55},{s:3,r:'10',p:.58},{s:3,r:'8',p:.60},{s:3,r:'8',p:.62},{s:2,r:'8',p:.58},{s:2,r:'6',p:.55}],
  };
  const waves = {};
  ['strength','hypertrophy','fatloss','athletic','balanced','endurance'].forEach(g => {
    waves[g] = makeWave(waveBase[g], totalWeeks);
  });
  // ───────────────────────────────────────────────────────────────────────────
  // SYNCHRONIZED LIFTING DELOAD ENGINE
  // Overlays a recovery-week cadence on the lifting wave that matches the cardio
  // engine's rolling cutback, producing a true WHOLE-BODY recovery week. The
  // waveBase tiles seamlessly via (i % base.length), so we DON'T edit or strip the
  // arrays — we intercept and transform the resolved entry at read time.
  //
  //   Cadence:  w % 4 === 0  → weeks 4, 8, 12, 16…  matches the cardio cutback's
  //             rolling (w%4) cadence at ANY length — no hardcoded [4,8,12].
  //   Guard:    totalWeeks >= 10 only, and NEVER the final week (taper/peak owns it).
  //
  // Goal-aware mechanic (two doctrines):
  //   • Tactical (strength/athletic/balanced/endurance) — SEAL PFG recovery week:
  //       intensity DOWN, reps UP (+3), sets HELD.
  //   • Size (hypertrophy/fatloss) — protect the growth stimulus:
  //       intensity DOWN, sets HELD, reps STABLE. Never amputate volume for size.
  //
  // Step-back target = the OPENING intensity of the current ascending sub-block.
  // NOT a flat % off last week (can drop below wk-1 load = detraining) and NOT a
  // literal "2 weeks prior" lookback (silently fails to deload at wks 8/20 because
  // the 12-entry base resets at idx6 — the lookback lands on the prior peak). The
  // block opener is always a real earlier build value, tile-safe, can't detrain.
  // ───────────────────────────────────────────────────────────────────────────
  const TACTICAL_DELOAD_GOALS = ['strength','athletic','balanced','endurance'];
  const _deloadActive = totalWeeks >= 10;
  // ── RACE TAPER ──────────────────────────────────────────────────────────────
  // When the program is event-targeted with a run goal, the final weeks taper the
  // cardio. We taper the BAR with it for whole-body race-day freshness: big-3 only
  // (accessories/core stripped at the assembler), BOTH volume and intensity cut,
  // descending into race week on the SAME curve the cardio cutback uses
  // (buildRunSession: taperWks = max(2, round(tw*0.12)); cut reaches ~40% by race
  // week). Gated to event+run, so non-race / lift-only / bike-swim programs see
  // tf=1 and are completely untouched. Taper OUTRANKS the mid-cycle deload.
  // Taper window comes from the single source of truth: the bar tapers iff — and
  // exactly when — the run does. No independent re-derivation, no isPerformanceRunGoal
  // OR-gate that used to fire on a 5k with no race date. (See programTaperWindow.)
  const _taperWindow = programTaperWindow({ ...cfg, goal }, cardioTypes, cardioGoals, totalWeeks);
  const _taperWks    = _taperWindow.taperWks;
  const inTaper      = _taperWindow.inTaper;
  const taperFactor  = _taperWindow.taperFactor;
  function isRecoveryWeek(w){
    // taper weeks own the wind-down — don't also fire the mid-cycle recovery here
    return _deloadActive && (w % 4 === 0) && (w !== totalWeeks) && !inTaper(w);
  }
  // Opening p of the ascending sub-block week w sits in. The 12-entry waveBase is
  // two 6-week ascending runs ([0..5],[6..11]); openers are idx0 and idx6.
  function _blockOpenerP(w){
    const base = waveBase[goal] || waveBase.balanced;
    const L = base.length, half = Math.max(1, Math.floor(L / 2));
    const tileIdx = (w - 1) % L;
    const openerIdx = Math.floor(tileIdx / half) * half;
    return base[openerIdx].p;
  }
  // Single source of truth for "what wave entry applies on week w". Reads THROUGH
  // the recovery week — the transform is derived from the untouched base tile +
  // block opener and never written back, so week w+1 resumes the real curve with
  // no double-jeopardy and no permanent downshift.
  function resolveWaveEntry(w){
    const waveArr = waves[goal] || waves.balanced;
    const base = waveArr[Math.min(w - 1, waveArr.length - 1)] || waveArr[waveArr.length - 1];
    // Race taper takes precedence over the mid-cycle deload: cut BOTH volume and
    // intensity, descending into race week, for max freshness.
    if(inTaper(w)){
      const tf = taperFactor(w);
      const sets = Math.max(2, Math.round((+base.s || 3) * tf));
      const p = Math.max(0.5, base.p * tf);
      const r = (typeof base.r === 'string' && base.r.includes('–'))
        ? base.r
        : String(Math.max(3, +base.r || 0)); // floor reps so a peaking single reads as a light primer
      return {...base, s: sets, p, r, _taper:true};
    }
    if(!isRecoveryWeek(w)) return base;
    const stepBackP = Math.min(base.p, _blockOpenerP(w)); // real back-off, never above base
    if(TACTICAL_DELOAD_GOALS.includes(goal)){
      const newR = (typeof base.r === 'string' && base.r.includes('–'))
        ? base.r                              // range string — leave; wt() sets load
        : String((+base.r || 0) + 3);         // reps UP (+3)
      return {...base, p: stepBackP, r: newR, _deload:true};   // sets HELD
    }
    // hypertrophy / fatloss — intensity DOWN, sets HELD, reps STABLE
    return {...base, p: stepBackP, _deload:true};
  }
  return { id, seed, goal, cardioTypes, cardioGoals, denseHypertrophy,
           allDaysList, trainDays, totalWeeks, waves,
           inTaper, isRecoveryWeek, resolveWaveEntry };
}

// ── ENGINE B — MULTI-SPORT PERFORMANCE REGULATOR (cardio & pacing) ──────────
// Hoisted ahead of C. Depends only on Engine-A structural outputs. Returns the
// compiled cardio schedule, which IS the read-only leg-load footprint consumed
// downstream by calendar planning and deconfliction.
function engineB_cardio(cfg, A){
  const { cardioTypes, cardioGoals, trainDays, goal, totalWeeks } = A;
  // B owns and PUBLISHES the taper window. The cardio schedule built here and the
  // barbell wave (A / C / D) read the same source — they cannot disagree.
  const taper = programTaperWindow({ ...cfg, goal }, cardioTypes, cardioGoals, totalWeeks);
  // V188 (D14a): the race-week pin is computed here, once, and rides cfg into the cardio
  // engine; buildProgram's day loop reads the same object off cfg._racePin.
  const _align = cardioTypes.includes('run') && cardioGoals.run ? raceAlignment(cardioGoals.run.id, cfg.raceDate, cfg.eventTargeted !== false) : null;
  // D106a (V207): a test goal pinned to its test week (cfg._testWeek, written by doGenerate)
  // takes the same race-week pin. The test weekday is a function of the test date alone, read
  // as a local date, so buildProgram stays pure. `test` tells the cardio post-pass to put the
  // goal's own trial in the week's quality slot.
  const _tRun = (!_align && cardioTypes.includes('run') && cardioGoals.run && PACE_GOALS.has(cardioGoals.run.id)
    && cfg._testWeek && cfg._testWeek === totalWeeks) ? _parseLocalDate(cfg.raceDate) : null;
  const _racePin = (_align && _align.tw === totalWeeks) ? raceWeekPin(_align, trainDays)
    : _tRun ? Object.assign(raceWeekPin({tw: totalWeeks, raceDay: _ISO_ORDER[(_tRun.getDay() + 6) % 7]}, trainDays), {test: true}) : null;
  if(_racePin) cfg._racePin = _racePin;
  const cardioSchedule=buildCardioProgression(cardioTypes,cardioGoals,trainDays,{...cfg,goal},totalWeeks);
  // Injury reroute runs AFTER the schedule is built: it substitutes sessions in place
  // rather than rewriting cardioGoals (pace targets are sport-specific; a coach doesn't
  // convert a 5K plan to a bike plan, he replaces each run with a time-matched easy
  // non-impact session). Slot and progression clock survive the injury.
  injurySweepCardio(cardioSchedule,cfg);
  const includeHip=true; // glute-med / hip-stability prehab is core to overall strength and every endurance modality (run and bike especially), so it rides every leg day regardless of cardio type. Was run-only.
  return { cardioSchedule, includeHip, taperWks: taper.taperWks, inTaper: taper.inTaper };
}
// ── INJURY CARDIO SWEEP ──────────────────────────────────────────────────────
// Modes (set by injuryPlan): noimpact (knee/ankle protect) — every run becomes a
// time-matched easy bike/swim, incline walk if neither; noimpact_swim (hip/lowback
// protect) — same but swim preferred over bike; easy — hard runs regressed to easy
// conversational volume; reduce (ankle workaround) — easy AND shortened; swimout
// (shoulder) — swim sessions rerouted to run/bike, running untouched.
function injurySweepCardio(schedule,cfg){
  const P=injuryPlan(cfg);
  if(!P||!P.cardioMode||!schedule) return;
  const types=cfg.cardioTypes||[];
  const mode=P.cardioMode;
  const pickAlt=prefer=>prefer.find(t=>types.includes(t))||null;
  const minsOf=s=>{const m=/(\d{1,3})\s*[-–]?\s*min/i.exec(s.detail||'');const v=m?+m[1]:0;return (v>=10&&v<=180)?v:35;};
  const HARD=/interval|tempo|speed|hill|fartlek|repeat|race pace|threshold/i;
  // D103a (V208): a keyed NSW run is judged by its key, never by a word in its copy ("Not a
  // tempo" read every NSW easy run as hard). Two sets, two jobs. Halfstep halves the quality
  // work; the test and the benchmark are measurements and are never halved. The easy and reduce
  // sweep parks everything above easy effort while the injury heals, the test included.
  // Unkeyed sessions (NRC, bike, frozen pre-V208 days) keep legLoad or the scan exactly.
  const _HALFSTEP_HARD_KEYS=new Set(['int','chi','long','steady']);
  const _PROTECT_PARK_KEYS=new Set(['int','chi','long','steady','bench','trial']);
  const _hardBy=(s,keys)=>{const k=s.dose&&s.dose.key;return k?keys.has(k):!!(s.legLoad||HARD.test((s.subtype||'')+' '+(s.detail||'')));};
  Object.keys(schedule).forEach(w=>{
    const wk=schedule[w]; if(!wk) return;
    Object.keys(wk).forEach(d=>{
      const s=wk[d]; if(!s) return;
      const mins=minsOf(s);
      if(mode==='swimout'){
        if(s.type!=='swim') return;
        const alt=pickAlt(['run','bike']);
        wk[d]=alt?{type:alt,subtype:'Cross-Train',detail:'Easy '+mins+' minutes, conversational effort. The shoulder stays out of it.',note:'Swapped off the swim while the shoulder cools down. Same slot, same engine.',week:s.week,goalId:s.goalId,legLoad:false}:null;
        return;
      }
      if(s.type!=='run') return;
      // ── HALFSTEP (V142 / D1) — first quality week back: same pace, ~55% dose ──
      // Reuses the taper's constants (x0.55, floor 2) on purpose: one re-entry rule,
      // one taper rule, same doctrine. Grammars handled: "Nx400m", "Nx800m",
      // "N x M min" (CHI), NRC "NxM:SS", "MM:00 fartlek", "M min continuous".
      // Rep-index parentheticals like "(2:00 after #4 & #8)" are stripped once reps
      // shrink, so the copy never references a rep that no longer exists. If no
      // grammar matches, the session is left intact and the note tells the athlete
      // to self-cut: a wrong prescription is worse than an honest instruction.
      if(mode==='halfstep'){
        const isHardH=_hardBy(s,_HALFSTEP_HARD_KEYS);
        if(!isHardH) return;
        let d=s.detail||'', changed=false;
        d=d.replace(/(\d{1,2})(\s*x\s*)(?=\d)/i,function(m,n,x){changed=true;return Math.max(2,Math.round(+n*0.55))+x;});
        if(!changed) d=d.replace(/(\d{2,3})(:00 fartlek)/i,function(m,n,t){changed=true;return Math.max(10,Math.round(+n*0.6))+t;});
        if(!changed) d=d.replace(/(\d{2,3})(\s*min continuous)/i,function(m,n,t){changed=true;return Math.max(8,Math.round(+n*0.6))+t;});
        if(changed){
          d=d.replace(/\s*\(([^)]*#\d[^)]*)\)/g,'');
          s.detail=d;
          s.subtype=(s.subtype||'Quality Run')+' (re-entry)';
          s.note='RE-ENTRY WEEK: Same pace, reduced dose. This week proves the tissue at full speed before full volume returns. Do not add reps.';
        } else {
          s.note=(s.note?s.note+' ':'')+'RE-ENTRY WEEK: First quality week back. Cut this session volume roughly in half at the same effort. Full volume next week.';
        }
        return;
      }
      if(mode==='easy'||mode==='reduce'){
        const isHard=_hardBy(s,_PROTECT_PARK_KEYS);
        const outMins=mode==='reduce'?Math.max(15,Math.round(mins*0.6)):mins;
        // already easy, leave it alone. V208 (2b): except its strides finisher, which is speed work
        // and is parked with the rest: the block goes whole, the minutes stay.
        if(!isHard&&mode==='easy'){ s.detail=(s.detail||'').replace(/\nFinish with 4 x 20 sec strides\.[\s\S]*?while the engine builds\./,''); s.subtype=(s.subtype||'').replace(' + Strides',''); return; }
        s.subtype='Easy Run (protected)';
        s.detail='Easy '+outMins+' minutes, fully conversational. Pain free the whole way or you shut it down.';
        s.note='Hard running is parked while this heals. Easy volume keeps the engine without poking the injury.';
        s.legLoad=false;
        if(s.dose&&s.dose.key) s.dose.key='easy';   // D103a: the key describes the card it now is
        return;
      }
      // noimpact / noimpact_swim — the run is replaced, the slot is not.
      const alt=mode==='noimpact_swim'?pickAlt(['swim','bike']):pickAlt(['bike','swim']);
      if(alt){
        wk[d]={type:alt,subtype:'Cross-Train',detail:(alt==='bike'?'Easy spin, ':'Easy swim, ')+mins+' minutes at 5 to 6 out of 10. Holds your aerobic base while the injury heals.',note:'Impact is off the table for now. Same slot, same engine, different tool.',week:s.week,goalId:s.goalId,legLoad:false};
      } else {
        wk[d]={type:'run',subtype:'Incline Walk',detail:'Brisk incline walk, '+mins+' minutes, 5 out of 10 effort, pain free the whole way. No running.',note:'No bike or pool on hand, so we walk with intent. It counts.',week:s.week,goalId:s.goalId,legLoad:false};
      }
    });
  });
}

// ── CALENDAR PLAN — role assignment + leg/run deconfliction ─────────────────
// Finalizes dayRoles ONCE, with the cardio leg-load schedule as a read-only
// input. After this returns, dayRoles is immutable for the rest of the build —
// Kinematics reads it, Synthesis reads it, neither mutates it.
function planCalendar(cfg, A, B){
  const { trainDays } = A;
  const { cardioSchedule } = B;
  // Assign roles to training days
  const nDays=trainDays.length;
  const roleTemplates={
    1:['full'],
    2:['push','pull'],
    3:['push','pull','legs'],
    4:['push','pull','legs','full'],
    5:['push','pull','legs','push_light','full'],
    6:['push','pull','legs','full','push_light','full'],        // fulls separated (same-region spacing)
    7:['push','pull','legs','full','push_light','full','active'] // fulls separated (same-region spacing)
  };
  const roles=roleTemplates[Math.min(7,Math.max(1,nDays))]||roleTemplates[4];
  const dayRoles={};
  trainDays.forEach((d,i)=>dayRoles[d]=roles[i%roles.length]);

  // ── HARD-DAY DECONFLICTION (48h buffer) ──
  // Keep heavy lower-body LIFTS (squat day + deadlift day) off days that carry a leg-taxing
  // cardio session and off days calendar-adjacent to one, so heavy legs and the hard/long run
  // never land within 48h (cooks the lower-body joints, blunts speed work). Moves the lift, never
  // the cardio. Session types repeat weekly, so one week is representative: the first with a
  // long-keyed run (D104a), week 1 otherwise. See deconflictLegLiftDays.
  const { legRecoveryNote } = deconflictLegLiftDays(dayRoles, trainDays, cardioSchedule);
  // SAME-REGION LIFT SPACING -- runs after the cardio buffer and never re-breaks it.
  const { regionRecoveryNote } = deconflictSameRegion(dayRoles, trainDays, cardioSchedule);
  const recoveryNote = [legRecoveryNote, regionRecoveryNote].filter(Boolean).join(' ') || null;
  return { dayRoles, legRecoveryNote: recoveryNote };
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { engineA_timeline, engineB_cardio, planCalendar };
