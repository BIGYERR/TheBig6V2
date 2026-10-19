import { asyIcon } from './icons.ts';
import {
  DEFAULT_1RM, EXLIB, REP_AFFINITY, _carryRx, _expOK, _isOneArmPress, _ssPair, _swapUniverseAdd, pick,
} from './exercise-library.ts';
import { roundWeight } from './exercise-kinds.ts';
import {
  CORE_PILLARS, _gearLens, _tierHasBarbell, buildFootAnkleSection, buildHipSection, buildRehabSection,
} from './prehab.ts';
import { _powerAllowed, _powerPrescribe } from './power-accessory.ts';
import { TEST_RX_TEXT, _injViewName, injuryPlan } from './injury.ts';
import { _auxFamily, _auxGearOK, _cardioInterference, _isUnilateralRow, _pattern, _repFloor } from './region-caps.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { Cfg, Goal, Section } from '../domain/index.ts';
import type { CardioSession } from './nsw-cardio.ts';

/** One week of a lifting wave: sets, reps (a count, or a range like '8–12'), the load as a share of the 1RM, and the taper or deload it carries. */
export interface WaveEntry { s: number | string; r: string | number; p: number; _taper?: boolean; _deload?: boolean }
/** What Engine C reads of Engine A's timeline (engineA_timeline). */
export interface EngineATimeline { goal: Goal; seed: number; denseHypertrophy: boolean; waves: Record<string, WaveEntry[]>; resolveWaveEntry(w: number): WaveEntry; inTaper(w: number): boolean; totalWeeks: number }
/** What Engine C reads of Engine B's cardio (engineB_cardio). */
export interface EngineBCardio { includeHip: boolean }
/** What a day's sections are built with: the full-body variant, the hard day after, the carry, the day's cardio. */
export interface BuildSectionsOpts { fullVariant?: string; hotNext?: boolean; wantCarry?: boolean; cardio?: CardioSession | null }
/** Engine C: a day's sections by role and week, and the gear lens its pools read. */
export interface EngineC { buildSections(role: string, w: number, opts?: BuildSectionsOpts | null): Section[]; gearOK(n: string | null | undefined): boolean }
/** One week's movements, drawn per rotation block (getEx). */
interface WeekExercises { chestMain: string; chestAcc: string[]; backMain: string; backRow: (string | null)[]; backPull: string; shoulder: string[]; squat: string; lunge: string[]; hinge: string[]; hipExt: string | null; kneeStab: string; core: string[]; cond: string[]; carry: string[]; fullPush: string; fullPull: string }

// ── ENGINE C — KINEMATIC POOL FILTER (exercise selection + RPE prescription) ─
// Pure-RPE coaching (scheme()/rpeFromWave()) over Engine-A's wave resolver and
// equipment-filtered EXLIB pools. Needs includeHip from B for the hip module on
// leg days. Returns the configured per-day section builder.
function engineC_kinematics(cfg: Cfg, A: EngineATimeline, B: EngineBCardio): EngineC{
  const { goal, seed, denseHypertrophy, waves, resolveWaveEntry, inTaper, totalWeeks } = A;
  const { includeHip } = B;
  // STRENGTH SUPPORT: submaximal strength-maintenance track. Shares the internal 'athletic' goal
  // but diverges — comp lifts capped at RPE 7 and accessory volume trimmed, so lifting supports
  // the athlete's sport without competing with it for recovery. (Athletic Support keeps full
  // intensity + the power-lead Full Body day.)
  const strengthSupport = (cfg.liftingFocus==='support_strength');
  // V154 (D1–D5, Mario's GO ×5): Injury Prevention was label-only — mapped to the generic
  // endurance template with no engine branch of its own (measured: differs from
  // support_athletic ONLY by goal template + day labels). This flag gives it one.
  const preventionSupport = (cfg.liftingFocus==='support_prevention');
  // Injury overlay plan (null when healthy). Read by scheme() for the RPE 7 clamp on
  // capped patterns and by the pool-override block below for protect-tier substitutions.
  const _inj = injuryPlan(cfg);
  // D239 Amendment 1: the plan's drop list comes out of the prehab pools before the draw, so an injured athlete's hip
  // and foot & ankle blocks keep their full count instead of losing a drawn drill to applyInjuryFilter afterwards.
  const _prehabKeep = (n: string): boolean => !(_inj && _inj.dropNames && _inj.dropNames.test(n));
  // V153 (F2): set by buildSections from opts.hotNext at entry, read by scheme(). A
  // closure variable rather than a scheme() parameter because scheme has ~30 call sites
  // and _inj/strengthSupport already travel this exact road. Days build serially, so a
  // per-day mutable is race-free.
  let _hotNextDay = false;
  const expPctMod={beginner:0.85,intermediate:1.0,advanced:1.0}[cfg.experience||'intermediate']||1;
  // Resolve 1RMs — use entered value or fall back to experience defaults
  const expDefaults=DEFAULT_1RM; // collapsed: one default-1RM table app-wide
  const expDef=expDefaults[cfg.experience||'intermediate'];
  // Priority: entered by user → 0 (scheme() prescribes by RPE and ignores a 0).
  const benchRM=(cfg.bench>0?cfg.bench:0);
  const squatRM=(cfg.squat>0?cfg.squat:0);
  const deadRM =(cfg.deadlift>0?cfg.deadlift:0);
  // Flag if we have real numbers to prescribe weights
  const hasBenchRM=benchRM>0; const hasSquatRM=squatRM>0; const hasDeadRM=deadRM>0;
  const _benchRM=benchRM||expDef.bench;
  const _squatRM=squatRM||expDef.squat;
  const _deadRM=deadRM||expDef.deadlift;
  const _unit = cfg.unit || 'lbs';
  function wt(rm: number,w: number): number{
    const entry=ageAdjustWaveEntry(resolveWaveEntry(w));
    const rawLbs = rm*(entry.p||0.75)*expPctMod;
    return roundWeight(rawLbs, _unit);
  }
  // ── NO-ANCHOR PRESCRIPTION (feel-first) ──────────────────────────────────────
  // When there is no REAL anchor — no entered 1RM AND none derived from big-3 logs —
  // we do NOT invent a weight from the experience-default table. That fabrication is
  // what produced bar-only squats (paused squat @ 40 lb off a 75 lb default) and
  // 0-lb dumbbell prints. Instead: prescribe by feel in PLAIN LANGUAGE (no "RPE"
  // jargon, no "(Est.)") and point the user at logging — logging a working weight, or
  // enough big-3 work to derive a 1RM, is what unlocks real numbers. Single source of
  // truth so every path (main lifts, push branch, taper primer) reads consistently.
  // Coach-style RPE target that CLIMBS with the wave's intensity, so variants/accessories
  // progress in effort terms week to week. Taper/recovery weeks are pulled back explicitly.
  // Returns {rpe, note} where note translates the number into reps-in-reserve plain language.
  function rpeFromWave(wv: WaveEntry): { rpe: number | string; note: string }{
    if(wv._taper)  return {rpe:'5–6', note:'primer — light and crisp, well short of failure'};
    if(wv._deload) return {rpe:'6',   note:'recovery — leave 4+ reps in the tank'};
    const p = (typeof wv.p==='number') ? wv.p : 0.7;
    let rpe = 6.5 + (p - 0.55) / (0.93 - 0.55) * 3;     // ~6.5 at the lightest, ~9.5 at peak
    rpe = Math.max(6.5, Math.min(9.5, Math.round(rpe*2)/2));
    const rir = Math.max(0, Math.round(10 - rpe));
    return {rpe, note:'leave ~'+rir+' rep'+(rir===1?'':'s')+' in reserve'};
  }
  function scheme(rm: number,w: number,hasReal: boolean,exName: string): string{
    // Pure RPE coaching for every lift — the app no longer recommends a specific weight.
    // Progression is by climbing RPE + the user's own last-logged number (shown in the log row).
    // (rm/hasReal/exName retained in the signature so existing call sites are untouched.)
    let wv=ageAdjustWaveEntry(resolveWaveEntry(w));
    // V137 (Q5, signed): BEGINNER EFFORT FLOOR. A novice cannot gauge RPE 8 and does not
    // need it — weeks 1–2 are motor learning. Clamp p so rpeFromWave resolves to ~6.5
    // (wks 1–2) then 7 (wks 3–4); standard effort from week 5. Build-time, so it
    // survives the freeze. Taper/deload are already lighter and stay untouched.
    if(cfg.experience==='beginner' && !wv._taper && !wv._deload && typeof wv.p==='number'){
      if(w<=2) wv={...wv, p:Math.min(wv.p,0.55)};
      else if(w<=4) wv={...wv, p:Math.min(wv.p,0.62)};
    }
    // STRENGTH SUPPORT: cap comp-lift intensity at ~RPE 7 (≈3 RIR) on working weeks — submaximal
    // maintenance that doesn't compete with the athlete's sport. Taper/deload are already lighter
    // (fixed RPE 5–6 / 6), so they're left untouched. p≤0.61 → rpeFromWave resolves to RPE 7.
    if(strengthSupport && !wv._taper && !wv._deload && typeof wv.p==='number' && wv.p>0.61) wv={...wv, p:0.61};
    // V154 (D1): INJURY PREVENTION holds every wave main at ~RPE 7 — armor is built
    // submaximally; effort above that competes with the sport for recovery and buys
    // nothing a runner needs. Identical mechanism to the strength-support clamp above.
    if(preventionSupport && !wv._taper && !wv._deload && typeof wv.p==='number' && wv.p>0.61) wv={...wv, p:0.61};
    // INJURY workaround/protect: any wave lift whose pattern is on the injury's capped
    // list holds at ~RPE 7 (p≤0.61 → rpeFromWave resolves to 7). Same mechanism as the
    // strength-support clamp above, gated per-exercise by pattern instead of globally.
    if(_inj && _inj.cap.size && exName && !wv._taper && !wv._deload && typeof wv.p==='number' && wv.p>0.61){
      const _p=_pattern(exName);
      if(_p && _inj.cap.has(_p)) wv={...wv, p:0.61};
    }
    // V153 (F2): DAY-BEFORE-HARD-RUN HINGE CLAMP. When tomorrow carries a legLoad cardio
    // session, the hinge main holds at ~RPE 7 — hamstring force deficit from loaded hinge
    // work peaks 24–48h out, exactly when the athlete is asked to surge. Same p-clamp as
    // the injury cap above, gated to the hinge pattern only (the strain mechanism is
    // velocity × fatigued hamstring; squat volume costs run quality but not tissue).
    // Build-time, so it survives the week freeze like every other prescription.
    if(_hotNextDay && exName && !wv._taper && !wv._deload && typeof wv.p==='number' && wv.p>0.61 && _pattern(exName)==='hinge') wv={...wv, p:0.61};
    const r=rpeFromWave(wv);
    // V137 (Q2, signed + Mario's Flag-1 ruling): 6-week hypertrophy block closes with a
    // final-set AMRAP as the block yardstick — the number next block has to beat.
    // HINGE MAINS ARE CARVED OUT: an AMRAP deadlift under week-6 accumulated fatigue is
    // where lumbar spines go; push and squat patterns carry it. Long builds end in the
    // race taper, which owns its own final week — no AMRAP there.
    const _amrap = (goal==='hypertrophy' && totalWeeks<=6 && w===totalWeeks
      && !wv._taper && !wv._deload && _pattern(exName)!=='hinge')
      ? ', last set AMRAP — log it' : '';
    // NO-LOAD TIERS: the wave descends reps (4x6 -> 4x3) because on a barbell fewer reps
    // at higher RPE means MORE WEIGHT. With nothing to add, that same wave makes the block
    // get EASIER while the RPE label claims it is getting harder. Travel work therefore
    // holds a maintenance dose instead of faking progression: steady sets, reps matched to
    // how hard the variant actually is, effort held rather than climbed.
    // ...so travel work is prescribed the way the barbell already is, just with the
    // OTHER variable open. On a bar reps are fixed and you choose the LOAD; with no load
    // to choose, REPS become the variable. Prescribing an exact rep count here would be
    // guessing the athlete's capacity, and that guess is wrong for nearly everyone.
    // Sets and effort are prescribed; reps emerge. Progression then happens by itself:
    // as they get stronger the same RPE simply costs more reps, which the log captures.
    // Both follow the same grammar as the loaded line ("4×5 — RPE 8.5 (leave ~2 reps in
    // reserve)") and must not end in punctuation, since the caller appends the rest clause.
    // The coaching cues (graduate the variant / go single arm) live in the change sheet,
    // explained once, rather than repeated on every prescription for six weeks.
    // V137 (Q5): the fixed-effort branches get the same beginner floor as the wave.
    const _begEase = cfg.experience==='beginner' && !wv._taper && !wv._deload
      ? (w<=2 ? '6–7 (leave 3–4 in reserve — learn the movement)' : w<=4 ? '7 (leave ~3 in reserve)' : null) : null;
    // V154 (D1): prevention holds the no-load mains at 7 too. These three writers
    // compose their effort copy as literals and never read wv.p, so the p-clamp above
    // cannot reach them — the beginner-floor override is the tested seam and
    // prevention rides it. Beginner copy wins when both apply (it is lower).
    const _effEase = _begEase || (preventionSupport && !wv._taper && !wv._deload ? '7 (leave ~3 in reserve)' : null);
    if(loadCapped){
      if(wv._taper||wv._deload) return '2 sets of 12 to 15 — RPE 6 (light and clean)';
      return '3 sets of 8 to 12 — RPE '+(_effEase||'8 (heaviest pair you can find)');
    }
    if(!canAddLoad){
      if(wv._taper||wv._deload) return '2 sets — RPE 6 (leave plenty in the tank)';
      return '3 sets — RPE '+(_effEase||'8 (stop 2 reps short of failure)');
    }
    // MOVEMENT REP FLOOR. The two branches above catch the ATHLETE who has nothing to
    // add. This catches the LIFT that has nothing to add, wherever it came from — an
    // injury pool override, or the Mini gym tier where hasBarbell is false but noLoad is
    // not. Deliberately placed AFTER those branches so travel and bodyweight tiers are
    // byte-identical: they already answer this question at the config level and their
    // copy is the tested copy, which the unloadable case below reuses verbatim rather
    // than growing a second dialect for the same situation.
    const _floor=_repFloor(exName);
    if(_floor){
      if(_floor[1]===0){
        if(wv._taper||wv._deload) return '2 sets — RPE 6 (leave plenty in the tank)';
        // V137 (Q5): same beginner floor as the loadCapped/!canAddLoad branches above —
        // this movement-level unloadable branch was the one writer they didn't cover.
        return '3 sets — RPE '+(_effEase||'8 (stop 2 reps short of failure)');
      }
      // Compare against the LOW end of the wave's reps — a range string is already a
      // range and only needs raising if even its bottom sits under the floor. The
      // negated form catches NaN from an unexpected wave value and floors it, which is
      // the safe direction to fail.
      const _lo=(typeof wv.r==='string'&&wv.r.indexOf('–')>=0)?parseInt(wv.r,10):+wv.r;
      // Below the floor the exact rep count is not controllable — that is what having a
      // floor means — so the prescription becomes a window and the athlete finds the
      // load inside it. RPE carries through untouched; effort is still the real target.
      if(!(_lo>=_floor[0])) return wv.s+'×'+_floor[0]+'–'+_floor[1]+' — RPE '+r.rpe+' ('+r.note+')'+_amrap;
    }
    return wv.s+'×'+wv.r+' — RPE '+r.rpe+' ('+r.note+')'+_amrap;
  }
  const expMod={beginner:0.75,intermediate:1,advanced:1.2}[cfg.experience||'intermediate']||1;
  // Age volume modifier: for most goals, older lifters get a modest set reduction.
  // EXCEPTION — hypertrophy: muscle growth needs full weekly volume regardless of age.
  // Older lifters get joint protection via exercise selection (dumbbell/machine/cable
  // variants) and higher rep ranges, NOT by cutting sets out from under them. Cutting
  // volume for an older lifter who SELECTED size would under-dose the exact thing they
  // asked for. So hypertrophy holds ageMod at 1.0.
  const ageMod=(goal==='hypertrophy')?1:({'55+':0.82,'36-54':0.92,'18-35':1}[cfg.ageBracket||'18-35']||1);
  // STRENGTH SUPPORT trims accessory/superset volume ~20% (maintenance, not accumulation). Only
  // vsets() reads volMod, so this shrinks accessories — main-lift set counts come from the wave.
  const volMod=expMod*ageMod*(strengthSupport?0.8:1);
  function vsets(n: number): number{
    const raw = Math.max(2, Math.round(n * volMod));
    // 36-54: hard cap accessory/superset sets at 3 — prevent 4-round volume fatigue
    if((cfg.ageBracket||'18-35') === '36-54') return Math.min(3, raw);
    return raw;
  }
  // 55+: clamp any wave entry's 1RM% to 0.82 and bump reps +2 to preserve total work output
  function ageAdjustWaveEntry(wv: WaveEntry): WaveEntry {
    if((cfg.ageBracket||'18-35') !== '55+') return wv;
    if(wv.p <= 0.82) return wv;
    const newReps = typeof wv.r === 'string' && wv.r.includes('–')
      ? wv.r  // range string — leave as-is, weight will be clamped via wt()
      : String(+wv.r + 2);
    return {...wv, p: 0.82, r: newReps};
  }
  // Equipment-aware exercise selection
  const equip=cfg.equipment||'home_full';
  const isCrossfit=equip==='crossfit';
  const hasBarbell=_tierHasBarbell(equip);
  const hasCables=equip==='commercial';
  const hasGHD=equip==='commercial'||isCrossfit;
  // Every tier the wizard offers lists dumbbells except 'Bodyweight only' ("You, the floor,
  // and something to pull on"). CrossFit's blurb abbreviates to "barbells, rig, bumpers,
  // kettlebells, wall balls" but a box has dumbbells and the engine already prescribes
  // 'Dumbbell snatch' there. 'minimal' is the retired travel tier and owned dumbbells.
  const hasDumbbells=equip!=='bodyweight';

  // ── GEAR GATE FOR ACCESSORY POOLS (V103) ────────────────────────────────────
  // The compound pools gate on hasBarbell explicitly, but the ACCESSORY pools are reached
  // through _bw(), which only diverts on the bodyweight tier — so every other tier got the
  // raw EXLIB pool regardless of what it owns. Measured leaks before this gate:
  //   Overhead press / Push press  -> home_basic + minimal (no barbell). 384/480 programs.
  //   Cable pushdown               -> minimal, home_basic, home_full (no cables).
  //   Cable pull-through           -> home_full (has barbell, no cables).
  //   Barbell curl                 -> reachable on home_basic/minimal, never selected.
  // Same class as the no-load leak fixed in V97-98; nothing covered these tiers because
  // none of them is isBW.
  //
  // Names that imply an implement without naming it are included deliberately: 'Rope
  // tricep extension' and 'Face pull' are cable movements, and 'Machine seated calf raise' is a
  // machine, none of which say "cable" or "machine".
  //
  // V197 (D70b): the non-empty fallback is GONE. It used to be justified by EXLIB.leg_iso
  // being all machine movements, so filtering it on a cable-less tier emptied the pool and
  // starved a pick(...,2). That justification made the whole filter advisory: every pool
  // that emptied was handed back whole, so withholding gear withheld nothing — crossfit
  // drew 428 machine items, home_basic 716. The substitutes are no longer invented here,
  // they were harvested into the pool itself (V197 D75, EXLIB.leg_accessory), which is the
  // coaching call this comment said it would not make mechanically. The denial now lands:
  // an all-illegal pool returns EMPTY, and the one live consumer guards its second index.
  // V216 (D154): the predicate body lives in _gearLens (top level) so applyInjuryFilter can ask
  // the same question of an injury rename, for the equipment of the build it filters.
  const _gearOK = _gearLens(equip);
  const _gear: (pool: string[] | null | undefined) => string[] = pool => (pool||[]).filter(_gearOK);
  // V215 (D149 floors, coach): APPEND ONLY WHEN SHORT. A pool left with fewer than `min` names
  // gets ONE named member appended; a pool that is long enough comes back untouched, so a floor
  // can only fire where its list is actually short. Never a fallback to the raw pool (V197 D70b).
  const _floorPool = (pool: string[],min: number,add: string) => pool.length>=min ? pool : pool.concat([add]);
  // ── BODYWEIGHT TIER ("Room only") ──────────────────────────────────────────
  // A hotel room with nothing in it. The existing `minimal` tier still leans on
  // kettlebells and dumbbells, so it is NOT a true no-equipment option. This tier
  // assumes ONLY the athlete, the floor, a wall, a sturdy chair/bed edge, and their
  // own luggage. For an intermediate that means HARD variants — a 3×10 pushup is not
  // a stimulus — so the pools bias to unilateral leg work and leveraged pressing.
  // Pulling is the known weak point of any equipment-free tier (no bar, no band), so
  // it uses furniture-anchored rows rather than pretending the gap isn't there.
  const isBW=equip==='bodyweight';
  // No-load pools are authored EASY -> HARD. Rotating the whole range would hand a
  // beginner archer pushups and an advanced athlete incline pushups, so start the
  // athlete on the rung their experience earns and rotate within a window from there.
  function _bwRung(pool: string[]): string[]{
    if(!Array.isArray(pool)||pool.length<3) return pool;
    const exp=cfg.experience||'intermediate';
    const top=pool.length-1;
    const win = pool.length<=3 ? 2 : 3;   // short pools (e.g. the thin BW pull family) still narrow
    const start = exp==='beginner' ? 0
                : exp==='advanced' ? Math.max(0,pool.length-win)
                : Math.max(0,Math.min(pool.length-win,Math.floor(top/2)-(win>2?1:0)));
    return pool.slice(start, start+win);
  }
  const _bw=(bwPool: string[],other: string[])=>isBW?_bwRung(bwPool):other;
  const _bwHTlb=isBW?'Single-leg hip thrust (shoulders on bed)':'Banded hip thrust';
  const _bwHTak=isBW?'Single-leg glute bridge':'Banded hip thrust';
  // Pools where difficulty is NOT the axis (conditioning, carries, plyometrics) must skip
  // the rung narrowing: burpees vs mountain climbers are not rungs, and narrowing them
  // starves call sites that request more items than the window holds.
  const _bwFlat=(bwPool: string[],other: string[])=>isBW?bwPool:other;
  // ── LOAD MODEL ──
  // Three situations, not two. What the athlete can actually add decides how the main
  // lift is prescribed:
  //   noLoad     — nothing to add (bodyweight, or 'minimal' = one or two fixed
  //                kettlebells). Reps are the variable; prescribe sets and effort.
  //   loadCapped — a hotel rack. Real load, but it tops out around 40 lb, so the heavy
  //                low-rep end of the wave cannot be expressed: a 155 lb squatter needs
  //                ~130 lb for a triple and the rack cannot reach it. Light dumbbells
  //                are useless for triples and genuinely hard for sets of ten, so the
  //                prescription moves to a rep range, and going single arm is the way
  //                to make a light dumbbell heavy again.
  //   normal     — a real gym. Nothing changes; a resort gym is still a gym.
  const noLoad     = equip==='bodyweight'||equip==='minimal';
  const loadCapped = !!cfg._travel && equip==='home_basic';
  const canAddLoad = !noLoad;
  // Older hypertrophy lifters: bias the heavy compound pools toward joint-friendly
  // variants (dumbbell/machine over heavy barbell). Same growth, far less connective-
  // tissue stress. Only applies on the hypertrophy path with equipment that supports it.
  const olderHyp=(goal==='hypertrophy')&&(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
  let chestCompoundPool=hasBarbell?_gear(olderHyp?['Dumbbell bench press','Dumbbell incline press','Machine chest press','Close-grip bench press']:EXLIB.chest_compound):_bw(['Incline pushups (hands on bed)','Pushups (slow 3s eccentric)','Decline pushups (feet elevated)','Diamond pushups','Archer pushups'],['Dumbbell bench press','Dumbbell incline press','Dumbbell decline press','Pushup variation (weighted)']);
  let backCompoundPool=hasBarbell?EXLIB.back_compound:_bw(['Inverted row (knees bent, under a table)','Inverted row (under a table)','Feet-elevated inverted row (under a table)'],['Kettlebell single-leg deadlift','Kettlebell swing','Kettlebell single-leg deadlift','Dumbbell Romanian deadlift']);
  let squatPool=hasBarbell?_gear(olderHyp?EXLIB.squat_joint:EXLIB.squat):_bw(['Squat (slow 3s tempo)','Split squat','Bulgarian split squat (foot on chair)','Assisted pistol squat'],['Kettlebell goblet squat','Dumbbell goblet squat','Single-leg squat (assisted)','Step-ups (KB)']);
  // V210 (2b): advanced 55+ older hypertrophy on crossfit or home_full draws goblet OR front
  // squat, once, for the whole program (hypertrophy is locked; the lock outranks alternation).
  // Under any shoulder or elbow plan the front rack is withheld on every tier: it loads wrist
  // extension, elbow flexion and shoulder rotation at once. The goblet stays. Set here, before
  // _preInj, so the injury guard does not read the withhold as a redirect.
  { const _ip=injuryPlan(cfg), _noRack=!!(_ip&&_ip.tier!=='halfstep'&&(_ip.region==='shoulder'||_ip.region==='elbow'));
    if(_noRack) squatPool=squatPool.filter(n=>n!=='Front squat');
    else if(olderHyp&&hasBarbell&&!hasCables&&cfg.experience==='advanced'&&cfg.ageBracket==='55+') squatPool=squatPool.concat(['Front squat']); }
  let rowPool=hasBarbell?EXLIB.back_row:_bw(['Reverse snow angels','Inverted row (under a table)','Feet-elevated inverted row (under a table)'],['Kettlebell single-arm row','Dumbbell row','Resistance band row','TRX row (if available)']);
  // V192 (D41): the frontal-plane lunge reaches the no-barbell tier through the LOADED
  // list only. The bodyweight list beside it is a rung ladder (easy->hard, windowed by
  // _bwRung); a goblet needs a bell, and inserting it there would also shift the window.
  let lungePool=hasBarbell?EXLIB.lunge:_bw(['Reverse lunge','Walking lunge','Step-ups (chair)','Bulgarian split squat (foot on chair)'],['Reverse lunge (KB)','Walking lunge (KB)','Step-ups (KB)','Dumbbell Bulgarian split squat','Dumbbell goblet side lunge']);
  let hingePool=hasBarbell?EXLIB.hinge.filter(n=>_expOK(n,cfg.experience)):_bw(['Bodyweight back extension','Single-leg glute bridge','Single-leg Romanian deadlift (bodyweight)','Nordic hamstring curl (anchored)'],['Kettlebell single-leg deadlift','Kettlebell swing','Kettlebell Romanian deadlift','Double Kettlebell deadlift']);
  // Loaded posterior-chain / hip-extension pool. Complements the hinge (RDL is hamstring/
  // erector-biased; these are glute- and eccentric-hamstring-biased). GHR/Nordic are the
  // premier hamstring-injury-prevention movement for a running athlete; the hip thrust is
  // the glute-power builder for the athletic goal. Fills the posterior slot that used to be
  // a redundant 2nd lunge. Equipment-aware, mirroring hingePool's barbell gate.
  let hipExtPool=hasBarbell
    ?_gear(['Barbell hip thrust','Glute-ham raise','45° back extension','Cable pull-through','Single-leg hip thrust'])
    :_bw(['Single-leg glute bridge','Bodyweight back extension','Single-leg hip thrust (shoulders on bed)','Nordic hamstring curl (anchored)'],['Banded hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension']);
  // Barbell-FREE hip-extension subset for the full-body day (which is calisthenic-forward and
  // stays barbell-free by design — the comp lifts live on the dedicated days). Replaces the
  // full day's old redundant 2nd-lunge slot with glute / eccentric-hamstring work.
  const hipExtBW=_bw(['Single-leg hip thrust (shoulders on bed)','Single-leg glute bridge','Nordic hamstring curl (anchored)','Bodyweight back extension'],['Single-leg hip thrust','Single-leg glute bridge (weighted)','Nordic hamstring curl (anchored)','Bodyweight back extension','Banded hip thrust']);
  // FULL BODY DAY = calisthenics-forward. NSW doctrine caps barbell lifting at ~2x/week and
  // layers calisthenics on top, so this day uses bodyweight variations instead of re-running
  // the comp barbell bench/row that the push & pull days already own. Equipment-aware:
  //  - Push: bodyweight presses; Dips only where a bench/dip station exists (full/commercial).
  //  - Pull: HORIZONTAL bodyweight pull (distinct from the pull day's vertical chinup). Inverted
  //    rows need a rack/bar at height (full/commercial); doorway-bar & travel tiers use band rows.
  const hasRack=equip==='home_full'||equip==='commercial'||isCrossfit;
  let fullPushPool=hasRack
    ?['Dips','Pushups (slow tempo)','Diamond pushups','Decline pushups']
    :_bw(['Pushups (slow 3s eccentric)','Pike pushups','Pike pushups (feet elevated)','Wall walks'],['Pushups (slow tempo)','Diamond pushups','Pike pushups','Decline pushups']);
  const fullPullPool=hasRack
    ?['Inverted rows (bodyweight)','Feet-elevated inverted rows','Inverted rows (rings)']
    :_bw(['Inverted row (under a table)','Feet-elevated inverted row (under a table)','Inverted row (knees bent, under a table)'],['Resistance band row','Single-arm resistance band row','Band pull-apart']);
  // V192 (D42-b): a landmine is a barbell with one end anchored, so it is
  // barbell-tier equipment. _gearOK has no landmine token, so the name walked
  // through on every tier including bodyweight. Gated here the way lungePool is
  // gated one screen above. The no-barbell branch is EXLIB.shoulder minus the
  // landmine, member for member, so no other tier's shoulder content moves.
  const shoulderAccPool = _gear(hasBarbell?EXLIB.shoulder:['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press']);
  // V193 (same-card, slice 5): the chest-accessory pool was an inline literal at its ONE
  // draw site, so buildSections had no legal way to re-walk it when the name it was handed
  // turned out to be the name the day's Main lift already held. It is a named pool now, on
  // the same line of sight as shoulderAccPool, and it has exactly two readers: the chestAcc
  // slot in buildEx and the push day's two later sections. Same pool, same lens, same
  // bodyweight branch — the standing rule is that the pool and the post-filter must reason
  // about a movement through the same lens, and a second copy of this literal inside
  // buildSections would have broken that on the bodyweight tier only, which is the tier
  // where it is hardest to see. No _gear() call: EXLIB.chest_acc names no cable and no
  // machine, dumbbells are legal on every tier except bodyweight, and bodyweight takes the
  // _bw branch — so a _gear() here would be a no-op that added the V127 empty-pool latch
  // for nothing. The chestAcc slot's behaviour is unchanged: _bw and _bwRung are pure.
  const chestAccPool    = _bw(['Incline pushups (hands on bed)','Wide-stance pushups','Pushups (slow 3s eccentric)','Close-grip pushups','Decline pushups (feet elevated)'],EXLIB.chest_acc);
  const bicepsAccPool   = _gear(EXLIB.biceps);
  // ATHLETIC SUPPORT only: a true explosive/power pool (jumps, throws, triple-extension) that
  // LEADS the full-body day, trained fresh with full recovery. Barbell tiers get power-clean /
  // trap-bar work; lighter tiers stay on bodyweight jumps + KB ballistics. (Strength Support
  // shares the same internal 'athletic' goal but keeps the standard calisthenic day.)
  const athleticSupport=cfg.liftingFocus==='support_athletic';
  const powerPool=hasBarbell
    ?['Broad jumps','Box jumps','Jump squats','Kettlebell swing','Power clean (light & explosive)','Trap bar jump','Pogo hops','Rotational jump to single-leg landing','Depth fall to single-leg bounds']
    :_bwFlat(['Jump squats','Broad jumps','Tuck jumps','Skater bounds','Split-squat jumps','Lateral bounds','Pogo hops','Rotational jump to single-leg landing'],['Broad jumps','Jump squats','Tuck jumps','Lateral bounds','Kettlebell swing','Single-arm KB snatch','Pogo hops']);
  // V178 (D2/D4): three additions. Pogo hops (1.0, stiffness/elastic), rotational jump to
  // single-leg landing (1.5, priced by the landing), depth fall to single-leg bounds (2.0
  // shock — advanced AND 18–35 only, by the existing min(exp,age) cap; no new gate). The
  // weighted depth fall with rebound was ruled OUT: a loaded shock landing is not a thing
  // a generator should hand anyone. The split-jump + cable anti-rotation press was ruled
  // out as a cross-station superset on a single rep.
  // CROSSFIT BOX: bumper plates + a rig make box-flavored explosive work fair game — fold a few
  // in so the pool feels like a box, not a globo gym.
  // V143: 'Barbell thrusters' removed from the OFFERING. A thruster's limiter is the squat
  // and the metabolic cost, not rate of force development — every doctrine source files it
  // under conditioning, and 'max intent' on a thruster is a category error. It STAYS in the
  // _POWER_COST table so _isPower/_powerAllowed still see it: the explosive-finisher gate
  // draws from the conditioning pool, and dropping thrusters from the cost table would let
  // a thruster finisher bypass the protect-tier injury gate. Cost table = X-ray, pool = menu.
  if(isCrossfit)powerPool.push('Wall ball shots','Dumbbell snatch','Box jumps (high)');
  // POWER LEGALITY (V129). Filtered HERE, at the pool, so both call sites inherit it and a
  // future third one cannot forget. Two gates in one predicate (see _powerAllowed):
  // experience unlocks cost tiers (a beginner never sees a box jump), and injury strips by
  // cost — protect drops all power, workaround keeps only the no-landing 0.5 tier.
  // Falls back to the unfiltered pool ONLY if the filter empties it, and that case is
  // handled below by dropping the power block entirely rather than leaking illegal work —
  // the _gear fallback trap from V122, not repeated here.
  // V154 (D5, Mario's GO): prevention keeps only the swing — max-intent barbell
  // derivatives have no place on an injury-prevention build (and the old template was
  // stacking power clean 7×3 on the LONG-RUN day). The swing survives at the 0.5
  // crisp-explosive tier per the V129/V143 doctrine: no landing to absorb. Tiers with no
  // kettlebell (bodyweight pool = jumps, which are impact) drop the power section
  // entirely via the length gate at both push sites.
  const _powerLegal = powerPool.filter(n=>_powerAllowed(n, cfg.experience, cfg.injury, cfg.ageBracket))
    .filter(n=>!preventionSupport||/kettlebell swing/i.test(n));
  const _powerBlocked = _powerLegal.length === 0;
  // EXPLOSIVE LEAD GATE: power output normally leads the full day only on the Athletic Support
  // path. A CrossFit box is explosive-movement territory by nature, so it earns the same lead
  // regardless of lifting focus — without touching the dedicated push/pull/legs days.
  const explosiveLead=athleticSupport||isCrossfit;

  // ── INJURY POOL OVERRIDES ────────────────────────────────────────────────────
  // Substitution happens at the POOL level so the section builder rebuilds each day
  // coherently — the day keeps its structure and capRegionalFatigue still governs it.
  // Every name here already exists in EXLIB or a bodyweight pool; nothing invented.
  // The applyInjuryFilter post-pass is the safety net for anything arriving from
  // pools this block doesn't touch (conditioning, carries, core, full-body picks).
  const _preInj={squat:squatPool,lunge:lungePool,hinge:hingePool,back:backCompoundPool,
                 hipExt:hipExtPool,chest:chestCompoundPool,row:rowPool};
  if(_inj){
    const _R=_inj.region,_T=_inj.tier;
    if(_R==='knee'){
      if(_T==='protect'){
        // Leg day becomes a posterior-chain day: hip extension replaces knee flexion
        // under load. Nordic/GHR (eccentric knee flexion) filtered from hipExtPool.
        // V215 (D149 floor a): home_full owns neither the GHD station nor cables, so the gear
        // gate leaves this list one name long. A second member is appended only when short.
        squatPool = hasBarbell?_floorPool(_gear(['Barbell hip thrust','45° back extension','Cable pull-through']),2,'Single-leg glute bridge'):[_bwHTak,'Single-leg glute bridge','Bodyweight back extension'];
        lungePool = ['Single-leg hip thrust','Single-leg glute bridge','Bodyweight back extension'];
        hipExtPool = hipExtPool.filter(n=>!/nordic|glute-ham|\bghr\b/i.test(n));
        if(!hipExtPool.length) hipExtPool=['Single-leg glute bridge','Bodyweight back extension'];
      } else {
        // Regress the knee, keep it moving: box/goblet bias + the knee_stability pool.
        squatPool = (hasCables?['Leg press','Barbell box squat','Dumbbell goblet squat']:hasBarbell?['Barbell box squat','Dumbbell goblet squat']:['Squat (slow 3s tempo)','Split squat']);
        lungePool = hasBarbell?['Step-ups (KB)','Reverse lunge (KB)']:['Step-ups (chair)','Reverse lunge'];
      }
    } else if(_R==='ankle'){
      if(_T==='protect'){
        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:hasBarbell?_gear(['Barbell hip thrust','45° back extension']):[_bwHTak,'Single-leg glute bridge'];
        lungePool = ['Single-leg hip thrust','Single-leg glute bridge'];
      } else {
        // Box bias trims dorsiflexion demand; Bulgarians keep single-leg work with
        // the injured side planted flat rather than driving through it.
        squatPool = hasBarbell?['Barbell box squat','Dumbbell goblet squat']:['Squat (slow 3s tempo)'];
        lungePool = hasBarbell?['Dumbbell Bulgarian split squat']:['Bulgarian split squat (foot on chair)'];
      }
    } else if(_R==='hip'){
      if(_T==='protect'){
        // Quad-led leg day; hinge/lunge/hip-extension sit out. Hip mobility section
        // stays — clamshells and 90/90 are exactly the gentle work a hip wants.
        squatPool = hasCables?['Leg press','Dumbbell goblet squat','Barbell box squat']:hasBarbell?['Dumbbell goblet squat','Barbell box squat']:['Squat (slow 3s tempo)','Wall sit'];
        // Both former entries here also live in EXLIB.knee_stability, which the same day
        // draws from — the leg superset printed Wall sit twice. Knee-dominant loading the
        // hip tolerates instead; the lunge PATTERN is dropped for this plan, so anything
        // matching /lunge|split squat|step-up/ would be stripped downstream anyway.
        // Machines give a knee-dominant option the hip tolerates. Without one there is no
        // honest non-isometric substitute, so the pool is LEFT ALONE and applyInjuryFilter
        // strips the lunge pattern downstream — the superset collapses to the stability
        // hold rather than printing a second copy of it.
        if(hasCables) lungePool = ['Leg extension','Lying leg curl'];
        hingePool = hasBarbell?['Barbell Romanian deadlift']:['Bodyweight back extension'];
        hipExtPool = hasGHD?['45° back extension']:['Bodyweight back extension'];
      } else {
        hingePool = hingePool.filter(n=>!/swing/i.test(n));
        if(!hingePool.length) hingePool=['Barbell Romanian deadlift'];
        lungePool = hasBarbell?['Step-ups (KB)']:['Step-ups (chair)'];
        squatPool = hasBarbell?['Barbell box squat','Dumbbell goblet squat']:['Squat (slow 3s tempo)'];
      }
    } else if(_R==='lowback'){
      if(_T==='protect'){
        // No axial loading, no hinge, no rows. Hip extension moves to floor-based
        // spine-neutral variants; pulling volume waits for the back to cool down.
        // The deadlift comes out for AXIAL LOADING, not for pulling. Handing the pull
        // day's main slot to hip extension left the week with no vertical or horizontal
        // pull main at all — rows are dropped at protect tier, so the day had nothing.
        // A hanging vertical pull is spine-decompressive and is the correct main here.
        backCompoundPool = hasBarbell?_gear(['Neutral-grip chinups','Chinups','Lat pulldown','Assisted pullups']):[_bwHTlb,'Single-leg glute bridge'];
        hingePool = [_bwHTlb,'Single-leg glute bridge'];
        hipExtPool = ['Single-leg hip thrust','Single-leg glute bridge'];
        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:['Dumbbell goblet squat'];
        // V193 (D44): the pulldown is a CABLE movement and this literal never passed
        // through _gear, so it shipped on minimal, home_basic and bodyweight — a tier
        // whose copy is "You, the floor, and something to pull on". _gear would not have
        // saved it either: a one-item pool empties under the filter and falls back to
        // itself. Cable-less tiers get the hanging vertical pull this branch's own
        // comment prescribes. Also 'vpull', so P.drop's row rule leaves it alone.
        //
        // V193 (same-card fix): D44's replacement was ANOTHER one-item literal, and on
        // the two cable-less BARBELL tiers it named a movement backCompoundPool already
        // holds — so 'Assisted pullups' printed as the day's Main AND as Pull superset A
        // on 128 day-builds. The one-item pool is the defect, not the name inside it.
        // _slot already refuses a name the day has taken ('_took', active because this
        // branch dirties the upper domain), but with a single candidate the pool empties
        // under that guard and _slot takes the repeat instead of short-drawing. So the
        // branch gets a POOL.
        // Candidates are the app's own vertical pulls, verified through the real
        // _pattern: all of them read 'vpull', which P.drop's {hinge,row} does not touch
        // and P.dropNames does not match. None carries a barbell, cable, machine or
        // dumbbell token, so _gearOK passes every one on every tier; 'Weighted chinups'
        // needs something to hang off the athlete, so it is gated on the tier owning an
        // implement rather than left to a name test that cannot see it.
        //
        // V193 (D52): two errors stacked here and both are fixed on this line.
        // (a) The pool offered a movement its OWN overlay forbids. 'L-sit chinups' is
        //     loaded lumbar flexion, so this same pass nulls it in SPINE_SWAP — draw it
        //     and the overlay deletes it with no substitute, singletonSupersetSweep
        //     collapses the superset, and the athlete gets a lone press. Measured on a
        //     reconstructed pre-D52 artifact with the SPINE_SWAP null replaced by a
        //     sentinel, so the deleted item stays visible: 'L-sit chinups' was DRAWN on
        //     632 day-builds of the 288-cell WIDE lattice and on 1392 of the 864-cell
        //     FULL lattice. On WIDE those draws sat in Pull superset A 520, Pull 50,
        //     Pull superset B 44, Upper superset 18. Of them, 18 on WIDE and 27 on FULL
        //     were Full Body days that lost their LAST pull. Zero-pull Full Body days on
        //     lowback/protect home_full ran V192 126, pre-D52 144, this candidate 126.
        //     The earlier "108" in this comment named no lattice and matched none of
        //     these; a count with no lattice is the same failure one size down.
        //     The membership is now derived, not
        //     guessed: EXLIB.back_pull minus the SPINE_SWAP null, plus the assisted
        //     regression from EXLIB.back_pull_joint. A pool built inside an injury branch
        //     may not name anything that branch's own filter removes — see
        //     tests/gates/g193_pool_overlay.js. The gate's reach is narrower than the
        //     rule it defends, and the difference is the interesting part: it carves the
        //     injury pool-override chain out of the source at the chain's opening
        //     _R==='knee' test, then walks ONLY the *Pool assignments made inside that
        //     carved chain, resolving each across the six gear tiers of its hand table.
        //     Pools assigned anywhere else in the build are outside the walk entirely.
        //     Assignments inside the chain whose expression will not resolve from the
        //     gear predicates are reported UNRESOLVED and asserted on by nothing.
        //     D44's floor of two survivors is held at that same scope, not wider.
        // (b) Subtracting the WHOLE backCompoundPool to prevent ONE duplicate is what
        //     starved home_full down to two members in the first place. Only one name can
        //     actually collide: the main the day DRAWS. That exclusion moved downstream to
        //     the row-slot draw site, where backMain exists (see _rowSrc). Nothing here
        //     narrows the swap universe either: every excluded name is a backCompoundPool
        //     member, and that pool is registered whole by the backMain slot first.
        rowPool = hasCables?['Straight-arm pulldown']:['Assisted pullups','Neutral-grip chinups','Chinups','Weighted chinups']
          .filter(n=>hasDumbbells||!/weighted/i.test(n));
      } else {
        // Deadlift → hip thrust (spine-neutral hip extension). Rows → single-arm
        // dumbbell supported on a bench. Squat drops the bar off the spine.
        // Same call as protect: the pull day keeps a pull. Hip extension is the correct
        // spine-neutral HINGE substitute and stays on the legs day, where it already
        // lives — it does not also need to be the pull day's main lift.
        backCompoundPool = hasBarbell?_gear(['Weighted chinups','Neutral-grip chinups','Lat pulldown','Chinups']):[_bwHTlb,'Single-leg hip thrust'];
        hingePool = hasBarbell?['Barbell hip thrust','Single-leg hip thrust']:['Single-leg glute bridge','Bodyweight back extension'];
        rowPool = ['Dumbbell row','Kettlebell single-arm row'];
        squatPool = hasCables?['Leg press','Dumbbell goblet squat']:['Dumbbell goblet squat'];
      }
    } else if(_R==='shoulder'){
      if(_T==='protect'){
        // Push day repurposed to pull volume: mains become rows, the calisthenic
        // push slot becomes a second horizontal pull. Pull day trains normally.
        chestCompoundPool = hasBarbell?['Barbell row','Dumbbell row']:['Kettlebell single-arm row','Dumbbell row'];
        fullPushPool = fullPullPool.slice();
      } else {
        // Overhead range out, pressing stays flat/neutral at RPE 7.
        chestCompoundPool = hasBarbell?['Dumbbell bench press','Close-grip bench press']:['Dumbbell bench press','Dumbbell bench press'];
      }
    } else if(_R==='elbow'){
      if(_T==='protect'){
        // Direct arm work and pressing out; day leans legs + core + light pulldown
        // (grip spared as much as a pull can be — straps aren't modeled).
        chestCompoundPool = hasCables?['Straight-arm pulldown','Lat pulldown']:['Inverted rows (bodyweight)'];
      }
      // workaround handled by swapNames + RPE cap in the post-filter/scheme.
    }
    // ── HIP-EXTENSION RESERVATION ────────────────────────────────────────────
    // Several branches above redirect a slot TO hip extension, which is the correct
    // substitution in each case. What none of them knew is that hipExtPool already
    // leads with the same two movements, so the redirect silently doubled or tripled
    // the pattern on one day — knee/protect and ankle/protect put hip extension in the
    // squat slot, the lunge slot AND the hip-extension slot, which is how a leg day
    // could print 'Barbell hip thrust' twice under its own name.
    // Whichever slot the injury plan deliberately chose keeps it; hipExtPool yields.
    // One guard rather than five edits, so a sixth region cannot reintroduce this.
    const _HT=/hip thrust|glute bridge/i;
    const _redirected=[[squatPool,_preInj.squat],[lungePool,_preInj.lunge],
                       [hingePool,_preInj.hinge],[backCompoundPool,_preInj.back]]
      .some(([now,was])=>now!==was&&(now||[]).some(nm=>_HT.test(nm)));
    if(_redirected){
      const _left=hipExtPool.filter(nm=>!_HT.test(nm));
      // No substitute is invented here. On the no-load tiers everything left that is
      // genuinely hip extension already lives in hingePool, so a "fallback" would just
      // move the duplicate one slot over. An emptied pool DROPS the slot instead: the
      // injury plan deliberately put hip extension somewhere else on this day, so the
      // day already has its dose and does not need a near-copy underneath it.
      // V215 (D149 floor b): knee/protect no longer empties the reservation. home_full lost
      // 45° back extension to the GHD station, which left nothing here and dropped the slot.
      // Bodyweight back extension is appended only when the remainder is empty. The lunge
      // literal holds it too, so _slot's drop still removes it on a same-day collision.
      hipExtPool = (_R==='knee'&&_T==='protect') ? _floorPool(_left,1,'Bodyweight back extension') : _left;
    }
  }

  // Which slot domains did the injury plan actually rewrite? The deconfliction guard runs
  // ONLY there. An ankle plan has no business reshuffling the push day, and a shoulder plan
  // has none reshuffling the legs day — running the guard everywhere made an injury in one
  // region silently re-pick movements in another.
  const _dirty: Record<string, boolean>={
    lower: squatPool!==_preInj.squat||lungePool!==_preInj.lunge||hingePool!==_preInj.hinge
           ||backCompoundPool!==_preInj.back||hipExtPool!==_preInj.hipExt,
    upper: chestCompoundPool!==_preInj.chest||rowPool!==_preInj.row||backCompoundPool!==_preInj.back
  };
  if(preventionSupport){ _swapUniverseAdd(hipExtPool); hipExtPool=hipExtPool.filter(n=>/hip thrust|glute bridge|pull-?through/i.test(n)&&n!=='Barbell hip thrust'&&n!=='Cable pull-through'); }

  // Rotation strategy by goal:
  // strength/hypertrophy: locked full 6 weeks (need consistent movement for progression)
  // fatloss/balanced/athletic/endurance: rotate every 2 weeks (variety keeps stimulus fresh)
  const rotates = !['strength','hypertrophy'].includes(goal);
  // Block = which 2-week period we're in (0, 1, 2 for a 6-week program)
  // For locked goals blockSeed = seed (never changes)
  // For rotating goals blockSeed changes per 2-week block
  function blockSeed(w: number): number {
    if(!rotates) return seed;
    const block = Math.floor((w-1)/2); // 0,1,2...
    return (seed + block * 7919) % 100000; // prime offset per block
  }

  // Build per-week exercise selections
  // For locked: same exercises all weeks
  // For rotating: recalculate every 2 weeks
  function getEx(w: number): WeekExercises {
    const bs = blockSeed(w);
    // ── SLOT DECONFLICTION (V111) ──────────────────────────────────────────────
    // Structural backstop behind the pool fixes above. Slots used to draw wholly
    // independently, so two slots pointed at the same narrow pool could return the same
    // movement, and the pull day's main could echo the legs day — deconflictSameRegion
    // cannot see this because it runs on ROLE LABELS at schedule time, before any
    // exercise exists. Slots now draw in order within a shared domain, excluding names
    // already taken and yielding on a pattern already twice-used.
    //   lower = backMain + the legs day. 'legs' and 'pull' are the two LEG_HEAVY_ROLES
    //           and are already treated as a pair by the hard-day leg buffer, so the
    //           deadlift slot belongs in the same dedup domain as the squat day.
    //   upper = chest, delts, rows, vertical pull.
    // Seeds stay bound to their slot, so draw ORDER changed and pick() inputs did not:
    // output is unchanged wherever no exclusion actually fires.
    // pick() also feeds the swap universe, so the FULL pool is registered before the
    // filtered copy is drawn from — the swap sheet's harvest must not narrow with it.
    const _took: Record<string, Record<string, number>>={lower:Object.create(null),upper:Object.create(null)};
    const _pats: Record<string, Record<string, number>>={lower:Object.create(null),upper:Object.create(null)};
    // dom may be a LIST. backMain is simultaneously the pull day's main lift and a
    // lower-body pattern, so it registers in both domains: once as the deadlift slot the
    // legs day must not echo, once as the pull-day movement backPull must not repeat.
    // drop=true means an unsatisfiable slot returns NOTHING rather than repeating a
    // movement the day already has. Used for the hip-extension accessory, whose whole
    // problem was that it duplicated a slot the injury plan had already filled.
    function _slot(pool: string[] | null | undefined,cnt: number,sd: number,dom: string | string[],drop?: boolean): string[]{
      const D=Array.isArray(dom)?dom:[dom], raw=pool||[];
      _swapUniverseAdd(raw);                       // universe sees the whole pool, always
      // HEALTHY PROGRAMS ARE UNTOUCHED, DELIBERATELY. Every collapse this guard exists to
      // catch is created by an injury pool override; with no injury the pools are already
      // disjoint and the guard would only be second-guessing selections that are fine.
      // It would not be free to run it anyway: programs rebuild from cfg + seed on every
      // boot, so a guard that fires on healthy pools rewrites the plan of every athlete
      // who updates. Measured at 77% of healthy configs changed when ungated — mid-program
      // churn for a population with no defect to fix. Injured athletes' plans DO change,
      // which is the entire point of the release.
      if(!_inj||!D.some(d=>_dirty[d])) return pick(raw,cnt,sd);
      let p=raw.filter(x=>{const k=String(x).toLowerCase();return !D.some(d=>_took[d][k]);});
      const q=p.filter(x=>{const pt=_pattern(x);return !pt||!D.some(d=>(_pats[d][pt]||0)>=2);});
      if(q.length>=cnt) p=q;                       // pattern guard only when it can be honoured
      if(!p.length) return drop?[]:pick(raw,cnt,sd); // nothing legal left: drop, or take the repeat
      const out=pick(p,Math.min(cnt,p.length),sd);   // short draw beats a duplicate
      // PATTERN bookkeeping counts index 0 ONLY. Multi-draw slots hand the day their
      // first element and nothing else — the legs builder reads ex.lunge[0] and
      // ex.hinge[0] — so charging the cap for an element that never reaches the card
      // would starve the next slot on volume that was never prescribed. NAME
      // bookkeeping still covers every element, since the swap sheet can surface them.
      out.forEach((x,i)=>{const k=String(x).toLowerCase(),pt=_pattern(x);
        D.forEach(d=>{_took[d][k]=1;if(pt&&i===0)_pats[d][pt]=(_pats[d][pt]||0)+1;});});
      return out;
    }
    // ── REP-AFFINITY FILTER (V160, D2-a/c + E1/E2) ────────────────────────
    // Eligibility scores against the BASE wave only: waves[goal] is the untouched
    // tile — deload/taper transform at read time in resolveWaveEntry and are
    // EXEMPT by ruling (D2-c). Post-transform scoring would kill the pause variant
    // on tw≥12 strength/athletic via one 7-rep DELOAD week (a technique week —
    // legitimate pause work) and would make pool membership a function of
    // totalWeeks. Range strings score on their upper bound. The 55+ transform
    // (+2 reps at p>.82) provably cannot flip a decision at cap 6: every entry
    // with p>.82 on the two eligible goals carries r≤3, so its adjusted reps
    // never exceed the base max. Binds at the THREE wave-main draws only (E1) —
    // _slot also serves pools whose call sites prescribe seconds, where a rep
    // cap is meaningless. FAIL CLOSED (E2): an emptied pool throws at build;
    // the V127 latch (f.length?f:pool) is the silent fallback this refuses to
    // repeat. Side effect BY DESIGN: pick() harvests the swap universe from the
    // FILTERED pool, so the swap sheet cannot re-open the collision either —
    // the scheme follows the slot, not the exercise.
    const _waveMaxReps=(()=>{const a=waves[goal]||waves.balanced;let mx=0;
      for(let i=0;i<Math.min(a.length,totalWeeks);i++){
        const m=String(a[i].r||'').match(/(\d+)\s*$/);if(m)mx=Math.max(mx,+m[1]);}
      return mx;})();
    function _repFit(pool: string[]): string[]{
      const f=pool.filter(n=>{const t=REP_AFFINITY[n];return !t||_waveMaxReps<=t.maxReps;});
      if(!f.length) throw new Error('REP_AFFINITY emptied a wave-main pool (wave max '+_waveMaxReps+' reps): '+pool.join(', '));
      return f;
    }
    // LOWER drawn first and main-lift-first, so the heaviest slots get the free choice
    // and the accessories yield rather than the other way round.
    const backMain = _slot(_repFit(backCompoundPool),1,bs+2,['lower','upper'])[0];
    const squatSel = _slot(_repFit(squatPool),1,bs+6,'lower')[0];
    let lungeSel = _slot(lungePool,2,bs+7,'lower'); if(lungeSel[0]===squatSel) lungeSel=pick(lungePool.filter(n=>n!==squatSel),2,bs+7);
    const hingeSel = _slot(hingePool,2,bs+8,'lower');
    const hipExtSel= hipExtPool.length?(_slot(hipExtPool,1,bs+15,'lower',true)[0]||null):null;
    const kneeStabSel=_slot(_bw(['Wall sit','Single-leg wall sit'],EXLIB.knee_stability),1,bs+9,'lower')[0];
    const chestMain = _slot(_repFit(chestCompoundPool),1,bs,'upper')[0];
    const chestAcc  = _slot(chestAccPool,2,bs+1,'upper');
    const shoulderSel=_slot(_bw(['Pike pushups','Pike pushups (feet elevated)','Wall walks','Prone Y-T-W raises'],shoulderAccPool),2,bs+5,'upper');
    // ── ROW SLOTS: TWO SLOTS, TWO DIFFERENT JOBS ─────────────────────────────
    // The pull day draws two rows and buildSections hardcodes their prescriptions:
    // superset A is the heavy row at 3×8, superset B is the volume row at 3×10
    // "each". "Each" is a claim that the movement is worked one side at a time.
    // One pool fed both slots and pick() only guarantees the two NAMES differ, not
    // the two MOVEMENTS, so the pairing was never held to either job:
    //   * both slots landing on the same lift with a different handle (Dumbbell row
    //     + Kettlebell single-arm row; Barbell row + Pendlay row) — 23.4% of pull
    //     days measured on V131, 26.3% on every loaded tier.
    //   * a bilateral barbell row landing in slot B and printing "3×10 each",
    //     which parseRx reads as perSide and the card renders as "3 × 10 /side" —
    //     24.3% of pull days. A Pendlay row has no side.
    // Partition on _isUnilateralRow and give each slot its own half. Ordering of the
    // fallbacks is what keeps a thin tier from getting worse rather than better:
    // an empty half falls back to the WHOLE pool (a bodyweight tier has no unilateral
    // row and must still get a second row), slot B always excludes slot A's name, and
    // if that leaves nothing legal slot B drops its row rather than repeat slot A —
    // the same "short draw beats a duplicate" rule _slot already applies internally.
    // The swap universe is unaffected: the two halves union back to rowPool, and any
    // fallback registers the whole pool anyway.
    // V193 (D52): the pull day's MAIN is excluded here, by name, and only here. An
    // injury branch that rewrites rowPool may legitimately name the same vertical pulls
    // its main-lift pool holds; the only name that can print twice on the card is the one
    // backMain actually drew, so that is the only name subtracted. Scoped to a pool the
    // plan rewrote (V111): on a healthy bodyweight tier backCompoundPool and rowPool share
    // their inverted-row rungs on purpose, and ungated this would rewrite plans that have
    // no defect. The swap universe is untouched — backMain belongs to backCompoundPool,
    // which _slot registered whole three slots earlier. Falls back to the unfiltered pool
    // rather than emptying, the same rule _slot uses internally.
    const _rowSrc0 = (_inj&&rowPool!==_preInj.row)?(rowPool||[]).filter(n=>n!==backMain):(rowPool||[]);
    const _rowSrc  = _rowSrc0.length?_rowSrc0:(rowPool||[]);
    const _rowUni = _rowSrc.filter(_isUnilateralRow);
    const _rowBi  = _rowSrc.filter(n=>!_isUnilateralRow(n));
    const _rowA   = _slot(_rowBi.length?_rowBi:_rowSrc,1,bs+3,'upper')[0]||null;
    // One residual the partition alone cannot close, so close it at the cause. When an
    // INJURY OVERRIDE rewrites rowPool and leaves nothing bilateral, both slots are
    // fighting over the same half and the day prints one lift twice with a different
    // handle. lowback/workaround is the branch that does it, and its own comment says
    // what it meant: "rows go single arm and supported" — ONE supported single-arm row,
    // not two. So the second row yields. Scoped to a pool the plan actually rewrote
    // (V111's lesson), which is why a healthy bodyweight tier is untouched: its two
    // inverted-row entries are difficulty RUNGS of one movement, and a ladder is a
    // legitimate second slot on the thinnest pulling tier in the app.
    const _rowInjUni=_inj&&rowPool!==_preInj.row&&!_rowBi.length;
    const _rowBpool=_rowInjUni?[]:(_rowUni.length?_rowUni:_rowSrc).filter(n=>n!==_rowA);
    const _rowB   = _rowBpool.length?(_slot(_rowBpool,1,bs+16,'upper')[0]||null):null;
    const backRow   = [_rowA,_rowB];
    const backPull  = _slot(_bw(['Inverted row (knees bent, under a table)','Inverted row (under a table)','Feet-elevated inverted row (under a table)'],EXLIB.back_pull),1,bs+4,'upper')[0];
    // Full Body calisthenic picks — explicitly distinct from the comp bench, the push-day
    // chest accessory, the loaded row, and the pull-day chinup, so the full day can never
    // re-run any movement the push/pull days already program.
    const pushDistinct = fullPushPool.filter(x => x!==chestMain && x!==chestAcc[0] && x!==chestAcc[1]);
    const pullDistinct = fullPullPool.filter(x => x!==backRow[0] && x!==backRow[1] && x!==backPull);
    const fullPush = pick(pushDistinct.length?pushDistinct:fullPushPool,1,bs+13)[0];
    const fullPull = pick(pullDistinct.length?pullDistinct:fullPullPool,1,bs+14)[0];
    return {
      chestMain,
      chestAcc,
      backMain,
      backRow,
      backPull,
      shoulder:  shoulderSel,
      squat:     squatSel,
      lunge:     lungeSel,
      hinge:     hingeSel,
      hipExt:    hipExtSel,
      kneeStab:  kneeStabSel,
      core:      pick(EXLIB.core,3,bs+10),
      cond:      pick(_bwFlat(['Burpees','Mountain climbers','Jump squats','Broad jumps','Skater bounds','High knees'],EXLIB.conditioning),4,bs+11),
      carry:     pick(EXLIB.carry,2,bs+12),   // V177 (D-f): no bodyweight branch — both readers exclude the tier
      fullPush, fullPull,
    };
  }
  // Pre-compute for week 1 (used in sections that don't have w context)
  const ex = getEx(1);

  function buildSections(role: string,w: number,opts?: BuildSectionsOpts | null): Section[]{
    _hotNextDay = !!(opts && opts.hotNext);   // V153 (F2): scheme() reads this for the hinge clamp
    opts=opts||{};
    const fullVariant=opts.fullVariant||'upper';
    const s: Section[]=[];
    const ex=getEx(w); // get exercises for this week's rotation block
    const _wArr=waves[goal]||waves.balanced;
    const wv=resolveWaveEntry(w);
    // V139 (Q6): strength test week replaces the comp-main prescription with the rep-max
    // protocol. Default is a heavy 3 to 5, never a commanded single. Same window as the
    // day tag. The single stays an opt-in hint on the calculator card.
    // Recovery weeks cannot exist inside a ≤6-week build (cutback cadence starts later),
    // and isRecoveryWeek is week-loop scope, not buildSections scope — so the taper guard
    // alone is the correct gate here. The day-tag site keeps both guards (it has both).
    const _testWk = goal==='strength' && totalWeeks<=6 && w===totalWeeks && !inTaper(w);
    const _testRx = TEST_RX_TEXT;   // V229 D193: one text, hoisted beside the cue stripper, which returns it beneath R7
    const isBeginner=cfg.experience==='beginner';
    const restNote=isBeginner?' — 3 min rest, focus on form':'';
    // V135: the barbell days opened cold into RPE-8 work while every run interval carries
    // its own warmup. One clause on the loaded mains only — bodyweight mains need no load ramp.
    const warmupNote=', ramp up with 2–3 warmup sets';
    // RACE TAPER: strip the day to the big-3 primer only. The wave entry is already
    // taper-scaled (volume + intensity down via resolveWaveEntry); here we drop all
    // accessories/conditioning/isolation. Active-recovery days are already light, so
    // they fall through to their normal block.
    if(inTaper(w) && role!=='active'){
      const isRace = (w === totalWeeks);
      const note = isRace
        ? asyIcon('flag',14)+' Race week — primer only. Movement quality, zero grind. The hay is in the barn.'
        : asyIcon('flag',14)+' Taper — volume and load pulled back so you arrive fresh.';
      let mName, mRM, mHas, mRest;
      if(role==='pull'){ mName=ex.backMain; mRM=_deadRM; mHas=hasDeadRM; mRest=', 2–3 min rest'; }
      else if(role==='legs'){ mName=ex.squat; mRM=_squatRM; mHas=hasSquatRM; mRest=', 2–3 min rest'; }
      else if(role==='full'){ mName=ex.fullPush; mRM=0; mHas=false; mRest=''; } // calisthenic primer — full body stays barbell-free even in taper
      else { mName=ex.chestMain; mRM=_benchRM; mHas=hasBenchRM; mRest=', 2–3 min rest'; } // push / push_light
      // Route through scheme(): a comp lift with a max shows its taper-scaled weight; everything
      // else (variants, or no max) gets the taper RPE 5–6 primer via rpeFromWave's _taper branch.
      const mDetail = scheme(mRM,w,mHas,mName)+mRest;
      s.push({label:'Primer — '+mName, items:[{name:mName, detail:mDetail}]});
      s.push({label:'Taper', items:[{name:note, detail:''}]});
      // V179 (D7, Mario's concur): foot & ankle pierces the taper on runner leg days — race
      // week included. The taper protects the athlete from FATIGUE and there is none in
      // 2×20 tibialis raises; what the block buys in weeks 13–14 is tissue readiness in the
      // structures that fail late in a half. Hip stability stays dropped: banded abduction
      // carries real glute-med fatigue and dropping it here was a deliberate call.
      if(role==='legs'&&includeHip&&(cfg.cardioTypes||[]).indexOf('run')>=0&&!(cfg.injury&&cfg.injury.region==='ankle'))s.push(buildFootAnkleSection(seed+w,isBW,isRace,_prehabKeep));
      return s;
    }
    if(role==='push'||role==='push_light'){
      // ── PROTECT-TIER UPPER LIMB: REHAB + TRUNK (V111) ──────────────────────
      // A protect-tier shoulder or elbow cannot press at all, and the pull day already
      // trains normally under both plans — so the week's pulling volume is intact and
      // the old row-repurpose was pure addition onto the injured joint. This day is
      // handed to the two qualities the athlete has a genuine recovery surplus for:
      // dedicated rehab loading and trunk work. No pressing, no pulling, no lower body.
      if(_inj && _inj.tier==='protect' && (_inj.region==='shoulder'||_inj.region==='elbow')){
        const _rs=blockSeed(w);
        s.push({label:'Rehab focus',items:[{name:asyIcon('flag',14)+' '+(_inj.region==='elbow'
          ?'Elbow day. Load the tendon, do not test it. Stop at discomfort, not pain.'
          :'Shoulder day. Full range only where it is pain free. Slow and controlled beats heavy.'),detail:''}]});
        buildRehabSection(_inj.region,_rs,isBW).forEach(sec=>s.push(sec));
        // Trunk gets a real dose here rather than the 2-item finisher, since nothing
        // else on the day competes for it. Both pillars used are low-fatigue and
        // safe for an upper-limb plan; loaded anti-extension (ab wheel, barbell
        // rollout) and the hanging pillar are deliberately not drawn.
        const _rot=<T>(arr: T[],k: number)=>arr[(((w-1+k)%arr.length)+arr.length)%arr.length];
        // Carries are stripped from the anti-rotation draw on this day. They are the two
        // adjacent members of that pillar, so the rotation could hand out both at once —
        // one loaded-carry stimulus twice — and a heavy carry is a real scapular and grip
        // demand, which is exactly the wrong bill for a protect-tier shoulder or elbow.
        // (The elbow plan sets noCarry and would have stripped them downstream anyway,
        // leaving that week's section empty instead of correct.)
        // V193 (D46-c, slice 4): the gear gate reaches this draw too. This branch was the
        // THIRD reader of the pillar and the only one with no lens on it, so 'Pallof press'
        // — tagged band gear in _AUX_GEAR — printed on bodyweight and on minimal, neither of
        // which owns a band. Same predicate, same table, no second private list. The carry
        // strip stays: it is this day's own rule, not a gear rule. Legal members after BOTH
        // filters, measured over the five non-carry members of the pillar against the tier
        // table: 3 / 4 / 5 / 5 / 5 / 5 for bodyweight / minimal / home_basic / home_full /
        // commercial / crossfit. So the pair below always has two distinct names to draw and
        // no fallback is needed. Measured, not assumed: apply the same two predicates on the
        // line below to CORE_PILLARS.anti_rotation.items and count per tier. Bodyweight is
        // the floor case at 3 — Bird dogs, Side plank, Plank shoulder taps, the three members
        // _AUX_GEAR (search '_AUX_GEAR=') leaves untagged. Re-derive, do not trust this line.
        const _ar=CORE_PILLARS.anti_rotation.items.filter(it=>!/carry/i.test(it.name)&&_auxGearOK(it.name,equip));
        const _ae=CORE_PILLARS.anti_extension.static;
        // V193 (slice 4): 'Bird dogs' is a member of BOTH pillars — D49 added it to
        // anti-rotation and anti_extension.static has always held it — and these two sections
        // draw from two independent rotations, so the same movement could land on both and
        // print twice on one card. deconflictAdjacentDupes cannot catch it: it compares
        // ADJACENT DAYS and returns early on core items by design.
        // Anti-extension keeps the name when they collide. 'Bird dogs' is the anti-extension
        // member it was written as (contralateral reach against spinal extension), and the
        // anti-rotation pillar has somewhere else to go on every tier. The anti-rotation
        // section walks its own rotation forward past any name the anti-extension pair
        // already took, so an uncontested week draws exactly the pair it drew before.
        const _aePick=[_rot(_ae,0),_rot(_ae,2)];
        const _taken=Object.create(null); _aePick.forEach(it=>{_taken[it.name]=1;});
        const _arPick=[];
        for(let _k=0;_k<_ar.length&&_arPick.length<2;_k++){
          const _it=_rot(_ar,_k);
          if(_taken[_it.name]) continue;
          _taken[_it.name]=1; _arPick.push(_it);
        }
        s.push({label:'Trunk — anti-rotation',items:_arPick.map(it=>({...it}))});
        s.push({label:'Trunk — anti-extension',items:_aePick.map(it=>({...it}))});
        return s;
      }
      const isLight=role==='push_light';
      // PUSH (LIGHT): a genuinely distinct recovery/pump session that deliberately shares NO
      // movement with the heavy push day (different press lead, delt, accessory, finisher).
      // Previously push_light re-ran the heavy push verbatim — scheme() is pure-RPE so the old
      // 10% bench cut never even rendered — which is why the two days read as the same workout.
      if(isLight){
        // V114: this pool is a HARDCODED LITERAL, not an EXLIB pool, so the V103 _gear
        // sweep never reached it — 'Machine chest press' was being prescribed as the MAIN
        // movement of the day on home_full and crossfit, neither of which owns a chest
        // press machine. Same bug class as V103, different hiding place. _gear() applies
        // here now; the lesson is that every literal pool needs the gate, not just the
        // library ones. _gear has a non-empty fallback, and the .filter below can still
        // shrink it, which is why the pick() call keeps its own fallback.
        const lightPressPool=(hasBarbell
          ?_gear(['Dumbbell incline press','Dumbbell bench press','Machine chest press','Dumbbell bench press'])
          :_bw(['Incline pushups (hands on bed)','Pushups (slow 3s eccentric)','Wide-stance pushups','Close-grip pushups'],['Pushups (slow tempo)','Diamond pushups','Pike pushups','Decline pushups']))
          // chestAcc[1] is THIS day's pump item (chestAcc[0] belongs to the heavy push
          // day) — without it in the guard, the light-press pick could duplicate the
          // pump slot. Latent since V114; the V151 flat/bench merge re-rolled several
          // seeds straight into it, which is how the gate caught it.
          .filter(x=>x!==ex.chestMain&&x!==ex.chestAcc[0]&&x!==ex.chestAcc[1]);
        // The fallback has to obey the SAME guard as the pool: a hard-coded incline here
        // walked straight back into the duplicate the filter just removed whenever the
        // filtered pool emptied (acc0=DB bench evicting both bench copies + acc1=incline
        // left nothing).
        //
        // V193 (same-card, slice 5): the chain still ended in a name the guard was not
        // allowed to see. '||' after a filtered lookup is a fallback to an UNFILTERED value,
        // which is the V122 _gear trap written small: whenever the three-name chain filtered
        // to nothing it handed back 'Pushups (slow tempo)' unconditionally, and on the tiers
        // where that happens chestAcc[1] IS 'Pushups (slow tempo)' — so the day printed it as
        // the Main press and again in the Pump, 16 day-builds of 59,781, home_full and
        // crossfit on the two lowback paths. The fix is arithmetic, not a new rule: the guard
        // can remove at most THREE distinct names, so a chain of five leaves at least two,
        // and the terminal '||' is deleted rather than replaced. The first three entries are
        // untouched and in the same order, so every case where the old chain resolved at all
        // resolves to the same name; only the empty case moves, and it moves to a pushup that
        // is legal on every tier. On bodyweight the guard holds three pushup names and can
        // never evict a dumbbell press, so entry 0 survives there exactly as before and this
        // tier's output is byte-identical.
        const _lpFallback=['Dumbbell incline press','Dumbbell bench press','Pushups (slow tempo)','Close-grip pushups','Diamond pushups']
          .filter(x=>x!==ex.chestMain&&x!==ex.chestAcc[0]&&x!==ex.chestAcc[1])[0];
        const lightPress=pick(lightPressPool.length?lightPressPool:[_lpFallback],1,blockSeed(w)+40)[0];
        const lightTri=pick(_bw(['Bench dips (chair)','Close-grip pushups','Diamond pushups'],_gear(EXLIB.triceps)),1,blockSeed(w)+41)[0];
        s.push({label:'Main — '+lightPress,items:[{name:lightPress,detail:vsets(3)+'×12 — RPE 6–7, leave 3+ in reserve'+restNote},{name:ex.shoulder[1],detail:vsets(3)+'×12'+(_isOneArmPress(ex.shoulder[1])?' each':'')}]});
        s.push({label:'Pump',superset:true,rounds:vsets(3),items:[{name:ex.chestAcc[1],detail:vsets(3)+'×15'},{name:lightTri,detail:vsets(3)+'×15'}]});
        if((goal==='fatloss'||goal==='athletic')&&!strengthSupport)
          s.push({label:'Light finisher',optional:true,superset:true,rounds:vsets(3),items:[{name:ex.cond[2],detail:vsets(3)+'×15'},{name:ex.cond[3],detail:vsets(3)+'×12'}]});
        else {
          // V193 (same-card, slice 5): the LATER SECTION YIELDS, third use of the shape.
          // ex.shoulder[1] is printed in the Main pairing two lines up and is drawn from
          // shoulderAccPool, which shares exactly one name with EXLIB.shoulder_iso —
          // 'Dumbbell lateral raise'. So the day could headline a lateral raise and then
          // prescribe it again underneath at a different dose: 636 day-builds of 59,781,
          // up from 396 on V192 because D47 unprotected the 2-item optional core block and
          // moved budget-trim pressure off this 1-item section, letting a duplicate the cap
          // used to hide survive 240 more times. D47 was ruled; this consequence was not.
          // The pool is registered with the swap universe BEFORE the subtraction, the way
          // _slot does it, so the swap sheet still offers the full delt inventory — the
          // subtraction is about what this card prints, not about what the athlete may pick.
          // Floor after subtracting every name already on the card: 2 on bodyweight (1 on
          // bodyweight/advanced, the only window that reaches 'Prone Y-T-W raises'), 2 on
          // minimal / home_basic / home_full / crossfit, 4 on commercial. Never 0, so the
          // guard below is a crash guard and not a filler — there is no fallback to the
          // unfiltered pool. If a future pool edit ever did empty it, this OPTIONAL section
          // is omitted rather than filled illegally.
          //
          // OPEN (deferred to §12, Mario's call): the better answer here may be that this
          // finisher MERGES into the Main block instead of re-drawing. Six sets of lateral
          // raises is defensible training; the real defect is two headings carrying two
          // contradictory prescriptions for one movement (3×10–15 @ RPE 8 above, then
          // 3×15–20 @ RPE 8 here). That is a design question, not a draw question, and this
          // slice deliberately takes only the mechanical fix.
          const _dfPool=_bw(EXLIB.shoulder_iso_bw,_gear(EXLIB.shoulder_iso));
          _swapUniverseAdd(_dfPool);
          const _dfTaken: Record<string, number>=Object.create(null);
          s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name)_dfTaken[it.name]=1;});});
          const _dfFree=_dfPool.filter(function(n){return !_dfTaken[n];});
          if(_dfFree.length)
            s.push({label:'Delt finisher',optional:true,items:[{name:pick(_dfFree,1,blockSeed(w)+42)[0],detail:vsets(3)+'×20'}]});
        }
        return s;
      }
      let det = _testWk ? _testRx : scheme(_benchRM,w,hasBenchRM,ex.chestMain)+warmupNote+', 2–3 min rest'+restNote;
      if(denseHypertrophy){
        // HYPERTROPHY DENSITY: heavy compound + secondary compound + 2–3 accessories
        // + direct arm isolation, reaching 12–15 sets/muscle/wk. Older tiers get joint-
        // friendly (dumbbell/machine/cable) variants and higher reps, not a volume cut.
        const isOlder=(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
        const chestPoolRaw=isBW?(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc):_gear(isOlder?EXLIB.chest_acc_joint:EXLIB.chest_acc);
        // Secondary compound = a distinct heavy-ish press, NOT the main and NOT isolation.
        // Equipment-gated like every other pool on this day: without the _bw() gate the
        // no-load tiers were handed a barbell press ("Close-grip bench press") that no
        // gear regex catches, because the name never says "barbell".
        const secondaryPool=_bw(
          ['Incline pushups (hands on bed)','Pushups (slow 3s eccentric)','Decline pushups (feet elevated)','Diamond pushups','Archer pushups'],
          _gear(isOlder?['Dumbbell incline press','Machine chest press','Dumbbell bench press','Dumbbell decline press']
                 :['Incline barbell press','Dumbbell bench press','Close-grip bench press','Dumbbell incline press'])
        ).filter(x=>x!==ex.chestMain);
        const chestPool=chestPoolRaw.filter(x=>x!==ex.chestMain&&_injViewName(x,cfg)!==_injViewName(ex.chestMain,cfg));
        const repA=isOlder?'12':'10', repB=isOlder?'15':'12';
        const hsets=cfg.experience==='advanced'?4:3;
        const secondary=pick(secondaryPool,1,blockSeed(w)+100)[0];
        const chest2=pick(chestPool.filter(x=>x!==secondary&&_injViewName(x,cfg)!==_injViewName(secondary,cfg)),2,blockSeed(w)+101);
        const delts=pick(_bw(EXLIB.shoulder_iso_bw,_gear(EXLIB.shoulder_iso)),2,blockSeed(w)+102);
        const tris=pick(_bw(['Bench dips (chair)','Close-grip pushups','Diamond pushups'],_gear(EXLIB.triceps)),2,blockSeed(w)+103);
        // 1) Primary heavy compound (3–4 sets, prescribed weight)
        s.push({label:'Main — '+ex.chestMain,items:[{name:ex.chestMain,detail:det}]});
        // 2) Secondary varied compound (3 sets)
        s.push({label:'Secondary compound — '+secondary,items:[{name:secondary,detail:hsets+'×'+repA}]});
        // 3) Hypertrophy/pump accessories (chest angle + 2 delts)
        s.push({label:'Chest volume',items:[{name:chest2[0],detail:hsets+'×'+repB}]});
        s.push({label:'Delts',superset:true,rounds:hsets,items:[{name:delts[0],detail:hsets+'×'+repB},{name:delts[1],detail:hsets+'×'+repB}]});
        // 4) Direct isolation slot (triceps)
        s.push({label:'Triceps',superset:true,rounds:hsets,items:[{name:tris[0],detail:hsets+'×'+repA},{name:tris[1],detail:hsets+'×'+repB}]});
      } else {
      // V193 (same-card, slice 5): the LATER SECTION YIELDS, fourth use of the shape, and
      // the only one that needs a helper because TWO later sections on this card draw from
      // the same pool. chestAccPool and chestCompoundPool overlap by name on every loaded
      // tier — 'Dumbbell bench press' and 'Dumbbell decline press' are in both — and _slot's
      // _took guard is deliberately inert on healthy programs, so nothing stopped chestAcc
      // from being handed the day's own Main lift. 64 day-builds printed 'Dumbbell decline
      // press' as Main and again as Accessory, 60 did the same with 'Dumbbell bench press',
      // and 3 more printed 'Dumbbell bench press' as Main and again in 'Chest + knee'.
      //
      // The card is read, not re-derived: whatever is already in `s` is taken, which is why
      // the Conditioning branch and the Accessory branch need no separate handling and why
      // 'Chest + knee' can never collide with the Accessory the line above just pushed.
      // Preference order keeps an uncontested day byte-identical — the Accessory still asks
      // for chestAcc[0] first, 'Chest + knee' still asks for chestAcc[1] first, and only a
      // day that would have duplicated walks past them into the pool.
      //
      // Floors, hand counted. Non-bodyweight: chest_acc holds 7 names, the Main can take at
      // most 1 of them and the shoulder slot none, so the Accessory sees at least 6 and
      // 'Chest + knee' at least 5. Bodyweight: _bwRung narrows to a 3-name window, the Main
      // can take at most 1 and the pike/wall shoulder slot none, so the Accessory sees at
      // least 2 and 'Chest + knee' at least 1. Never 0, so the omission branches are crash
      // guards and not fillers. There is no fallback to an unfiltered pool: if a future pool
      // edit ever did empty this, the section is dropped rather than printed illegally.
      const _accFresh=function(prefs: string[]): string | null{
        const t: Record<string, number>=Object.create(null);
        s.forEach(function(sec){((sec&&sec.items)||[]).forEach(function(it){if(it&&it.name){t[it.name]=1;t[_injViewName(it.name,cfg)]=1;}});});
        const _fr=function(n: string){return n&&!t[n]&&!t[_injViewName(n,cfg)];};
        for(let i=0;i<prefs.length;i++){ if(_fr(prefs[i])) return prefs[i]; }
        for(let i=0;i<chestAccPool.length;i++){ if(_fr(chestAccPool[i])) return chestAccPool[i]; }
        return null;
      };
      s.push({label:'Main — '+ex.chestMain,items:[{name:ex.chestMain,detail:det},{name:ex.shoulder[0],detail:vsets(3)+'×8'+(_isOneArmPress(ex.shoulder[0])?' each':'')}]});
      if((goal==='fatloss'||goal==='athletic')&&!strengthSupport)s.push({label:'Conditioning',optional:true,superset:true,rounds:vsets(3),items:[{name:ex.cond[0],detail:vsets(3)+'×12'},{name:ex.cond[1],detail:vsets(3)+'×10'}]});
      else {
        // V164 station rule: b-walk over the unselected shoulder pool (shoulder[0] is
        // the Main pairing at the site above — protected); chestAcc[0..1] are both
        // consumed on this day, so there is no legal a-alternative — demote if pure.
        const _accA=_accFresh([ex.chestAcc[0],ex.chestAcc[1]]);
        if(_accA){
          const _sp=_ssPair(_accA,ex.shoulder[1],[],shoulderAccPool.filter(n=>n!==ex.shoulder[0]));
          s.push({label:'Accessory',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×10'},{name:_sp.b,detail:vsets(3)+'×15'+(_isOneArmPress(_sp.b)?' each':'')}]});
        }
      }
      if(!isBeginner){
        const _ckA=_accFresh([ex.chestAcc[1],ex.chestAcc[0]]);
        if(_ckA) s.push({label:'Chest + knee',superset:true,rounds:vsets(3),items:[{name:_ckA,detail:vsets(3)+'×12'},{name:ex.kneeStab,detail:vsets(3)+'×25 sec'}]});
      }
      }
    } else if(role==='pull'){
      s.push({label:'Main — '+ex.backMain,items:[{name:ex.backMain,detail:_testWk?_testRx:scheme(_deadRM,w,hasDeadRM,ex.backMain)+warmupNote+', 3 min rest'}]});
      {
        // V164 station rule: the pull selection is a single scalar, so the b-walk has
        // one candidate; D3b re-walks the row pool (backRow[1] excluded — Pull B owns
        // it) to keep the superset alive on the pulldown tier before demoting.
        const _sp=_ssPair(ex.backRow[0]!,ex.backPull,rowPool.filter(n=>n!==ex.backRow[1]),null);
        s.push({label:'Pull superset A',superset:_sp.ok,rounds:vsets(3),items:[{name:_sp.a,detail:vsets(3)+'×8'+(_isUnilateralRow(_sp.a)?' each':'')},{name:_sp.b,detail:vsets(3)+'×5–6'}]});
      }
      // "each" follows the MOVEMENT, not the slot. The slot is unilateral by intent
      // and the pool now honours that, but a thin tier can still fall back to a
      // bilateral row here, and telling an athlete to do ten Pendlay rows per side is
      // not a prescription. Same reason the item is spread rather than listed: when
      // the pool has nothing legal left, superset B is the conditioning move alone.
      // V135: the conditioning move was an unconditional fixture of superset B — measured
      // on strength/hypertrophy it rode 46.6% of pull days and on 20.5% it WAS superset B
      // (row pool empty). Right for fatloss/athletic/balanced, junk volume for a pure
      // strength or hypertrophy athlete. Gated on the internal goal: support_strength maps
      // to 'athletic', so every support path keeps its conditioning untouched. When the
      // gate strips the conditioning move the section drops to one row, and one item under
      // a superset heading is worse than no heading (same rule as the Power fallback), so
      // it re-labels as plain Row volume; with no row either, the section is omitted.
      if(goal==='strength'||goal==='hypertrophy'){
        if(ex.backRow[1]) s.push({label:'Row volume',items:[{name:ex.backRow[1],detail:vsets(3)+'×10'+(_isUnilateralRow(ex.backRow[1])?' each':'')}]});
      } else {
        s.push({label:'Pull superset B',superset:true,rounds:vsets(3),items:[
          ...(ex.backRow[1]?[{name:ex.backRow[1],detail:vsets(3)+'×10'+(_isUnilateralRow(ex.backRow[1])?' each':'')}]:[]),
          ...(ex.cond[2]===ex.backMain?[]:[{name:ex.cond[2],detail:vsets(3)+'×10'}])]});
      }
      if(denseHypertrophy){
        // Direct biceps — compounds alone under-stimulate arms for growth.
        const isOlder=(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
        const hsets=cfg.experience==='advanced'?4:3;
        const repB=isOlder?'12–15':'10–12';
        // A prone Y raise is not elbow flexion. It sat here as filler, so a bodyweight
        // athlete's Biceps block looked complete on the card and trained almost nothing.
        // Chinups are the honest bodyweight biceps movement wherever there is a bar;
        // the supinated inverted row covers the tier that has none. Two entries against
        // pick(...,2) so the superset can never print the same movement twice.
        const _bicPool=_bw(['Chinups','Inverted row (supinated, under a table)'],bicepsAccPool);
        const bis=pick(_bicPool,2,blockSeed(w)+104);
        if(bis[1]&&_injViewName(bis[1],cfg)===_injViewName(bis[0],cfg)){ const _alt=_bicPool.filter(n=>n!==bis[0]&&_injViewName(n,cfg)!==_injViewName(bis[0],cfg)); if(_alt.length) bis[1]=pick(_alt,1,blockSeed(w)+104)[0]; }
        // V164 station rule: self-pair walk over the full pool (Cable curl + Preacher
        // curl was the live banned pair — STACK×BENCH, two stations for one superset).
        const _sp=_ssPair(bis[0],bis[1],_bicPool,_bicPool.filter(n=>_injViewName(n,cfg)!==_injViewName(bis[0],cfg)));
        s.push({label:'Biceps',superset:_sp.ok,rounds:hsets,items:[{name:_sp.a,detail:hsets+'×'+repB},{name:_sp.b,detail:hsets+'×'+repB}]});
      }
    } else if(role==='legs'){
      s.push({label:'Main — '+ex.squat,items:[{name:ex.squat,detail:_testWk?_testRx:scheme(_squatRM,w,hasSquatRM,ex.squat)+warmupNote+', 2–3 min rest'}]});
      // LEG SUPERSET A — PAIRED ONLY FOR RUNNERS (V123, Mario's call).
      // ex.kneeStab now resolves to a timed hold (Wall sit, Spanish squat hold, Single-leg
      // wall sit) since V122 cleaned that pool, and ex.lunge[0] is knee-dominant too. Back
      // to back that is doubled quad work under fatigue. It is DEFENSIBLE for a runner —
      // an isometric quad hold straight off a lunge is patellar-tendon insurance and the
      // NSW guide treats that quality as protective — and merely redundant for everyone
      // else. So the pairing survives for a RUNNER and splits for everyone else.
      // Gated on the PROGRAM carrying running, not on this day carrying a run: leg days
      // almost never share a day with a run because deconflictLegLiftDays deliberately
      // separates them, so a day-level check made the paired branch unreachable and
      // silently removed the pairing from everyone. The gate caught that (paired=0).
      // Bike and swim do not count — neither loads the patellar tendon the way running
      // does, so the protective argument does not transfer to them.
      const _isRunner = (cfg.cardioTypes||[]).indexOf('run') >= 0;
      if(preventionSupport){
        // V154 (D3, Mario's GO): prevention runs ONE circuit, not two. The merged round is
        // lunge + patellar isometric + single-leg hinge — unilateral knee, tendon
        // insurance, hamstring armor. The V123 runner pairing (lunge → isometric hold as
        // patellar-tendon protection) SURVIVES inside the merged round — prevention is
        // the last focus that should lose it — and the hold is kept for non-runners here
        // too, since on a prevention build the protective argument is the point.
        // hipExt (single-leg hip thrust) is the drop: glute-max redundancy with the hinge,
        // and glute-med work is guaranteed by the hip section below. Sets are written at 2
        // directly (D2-by-construction) so the rounds banner derives '2 Rounds' honestly.
        s.push({label:'Leg circuit — runner armor',superset:true,rounds:2,items:[
          {name:ex.lunge[0],detail:'2×10 each'},
          {name:ex.kneeStab,detail:'2×25 sec'},
          {name:ex.hinge[0],detail:'2×8'}].concat((_isRunner&&ex.hipExt&&ex.hipExt!==ex.hinge[0])?[{name:ex.hipExt,detail:'2×8 each'}]:[])});
        // V154 (D4): the calf/achilles guarantee — the most-injured tissue in distance
        // runners had ZERO work anywhere in the prevention template. Run-goal builds only;
        // eccentric emphasis carried in the copy. Pool logic mirrors the hypertrophy calf
        // line (bodyweight tier diverts to single-leg off a step — the only unloaded
        // variant that is a stimulus). _pattern reads calf → calf_iso, so the ankle
        // injury plans govern this item like any other.
        if(_isRunner){
          const _pcalf=pick(_bw(['Single-leg calf raise (bodyweight)','Calf raise (bodyweight)'],_gear(EXLIB.calves)),1,blockSeed(w)+107)[0];
          s.push({label:'Calf — achilles armor',items:[{name:_pcalf,detail:'2×12–15 each, slow 3-sec lower'}]});
        }
      } else {
      if(_isRunner){
        s.push({label:'Leg superset A',superset:true,rounds:vsets(3),items:[{name:ex.lunge[0],detail:vsets(3)+'×10 each'},{name:ex.kneeStab,detail:vsets(3)+'×25 sec'}]});
      } else {
        s.push({label:'Leg superset A',items:[{name:ex.lunge[0],detail:vsets(3)+'×10 each'}]});
        s.push({label:'Knee stability',items:[{name:ex.kneeStab,detail:vsets(3)+'×25 sec'}]});
      }
      // hipExt is null when the injury plan has already routed hip extension into another
      // slot on this day (see the reservation guard) — the superset becomes a single item
      // rather than printing a near-duplicate of the movement above it.
      // V164 station rule — the Diaz site. Good mornings (RACK) drew against GHR /
      // 45° back extension (BENCH) or Cable pull-through (STACK): a cross-gym pair
      // 225 times per lattice sweep. hipExt is a scalar selection, so the rescue is
      // the D3b hinge re-walk (KB single-leg DL / swing carry to wherever hipExt
      // lives); a pure-and-banned draw demotes to straight sets.
      const _lsB=[{name:ex.hinge[0],detail:vsets(3)+'×8'}];
      let _lsBSS=false;
      if(ex.hipExt){
        const _sp=_ssPair(ex.hinge[0],ex.hipExt,hingePool.filter(n=>n!==ex.hinge[1]),null);
        if(_sp.ok){ _lsB[0].name=_sp.a; _lsB.push({name:_sp.b,detail:vsets(3)+'×8'}); _lsBSS=true; }
        else _lsB.push({name:ex.hipExt,detail:vsets(3)+'×8'});
      }
      s.push({label:'Leg superset B',superset:_lsBSS,rounds:vsets(3),items:_lsB});
      }
      if(denseHypertrophy){
        // Leg accessory — direct quad/ham volume after the compounds — plus direct calves.
        const isOlder=(cfg.ageBracket==='55+'||cfg.ageBracket==='36-54');
        const hsets=cfg.experience==='advanced'?4:3;
        const repB=isOlder?'15':'12';
        // V197 (D76): same-card subtraction, in _pi's exact shape (index.html:6119-6126).
        // The gear filter runs FIRST so the subtraction can never widen legality, and the
        // whole gear-filtered list is restored if fewer than TWO names survive, because
        // this slot picks two — one honest duplicate beats one undefined. Without it a
        // card prints the same movement under two headings: Wall sit is also drawn by
        // kneeStabSel (7831), and the harvested hip-extension names also live in
        // hipExtPool and in the bodyweight hingePool. NSW p.7 item 6 forbids it directly,
        // and _itemCost charges holds at 0.5× so capSessionBudget never catches it.
        // The subject is `s` itself: every name already written onto THIS day's card,
        // which is exactly ex.lunge, ex.hinge, ex.kneeStab and ex.hipExt as they were
        // actually pushed, including the _ssPair rewrite of Leg superset B.
        const _laGear=_gear(EXLIB.leg_accessory);
        const _laOn=Object.create(null);
        s.forEach(sec=>((sec&&sec.items)||[]).forEach(it=>{const nm=String((it&&it.name)||'').trim().toLowerCase();if(nm)_laOn[nm]=1;}));
        const _laLeft=_laGear.filter(n=>!_laOn[String(n||'').trim().toLowerCase()]);
        // V197 (D75): the slot writes hsets+'×'+repB and "3×12" is unexecutable for an
        // isometric. 25 sec is the number the file already carries for a hold in the
        // ACCESSORY position (ex.kneeStab at 8179/8256/8270/8273). The finisher position
        // is 30 sec and this is not the finisher. No new constant, no new predicate.
        const _laDose: (n: string) => string=n=>hsets+'×'+(_auxFamily(n)==='hold'?'25 sec':repB);
        const legIso=pick(_laLeft.length>=2?_laLeft:(_laLeft.length?_laLeft:_laGear),2,blockSeed(w)+105);
        // Room Only owns no dumbbells, and neither _gearOK clause blocks a DB name, so the
        // pool has to divert here rather than be filtered. Single-leg off a step is the only
        // bodyweight calf variant that is actually a stimulus.
        const calf=pick(_bw(['Single-leg calf raise (bodyweight)','Calf raise (bodyweight)'],_gear(EXLIB.calves)),1,blockSeed(w)+106)[0];
        // V197: legIso[1] was written unconditionally. _gear's fallback used to guarantee
        // five members, so it always existed; with the fallback honest (D70b) a one-member
        // pool would print a superset whose second item is {name:undefined}, and
        // buildSectionsHTML, sessionLogProgress, sessionTimeEst and buildHeroPreview ALL
        // throw on that with no try on the path — the week view does not draw. Only this
        // site: the other 23 unguarded index sites are latent, not live.
        const _laItems=[{name:legIso[0],detail:_laDose(legIso[0])}];
        if(legIso[1])_laItems.push({name:legIso[1],detail:_laDose(legIso[1])});
        // V197 (D84): Calves is pushed BEFORE Leg isolation. capSessionBudget's trim
        // tie-break compares (_secRank, _itemRank) and both of these sections score
        // 2 / 0, so the tie resolves to the LATER push and the second one written is
        // the first one evicted. Calves used to be last, so on a tight day the card
        // dropped its only loaded plantarflexion to keep an isolation slot that in
        // 126 of 126 measured cells was a THIRD repetition of a pattern the card had
        // already run twice (Main + Leg superset B): four posterior-chain pieces and
        // zero calf work. Unscoped on purpose — a healthy runner has the same defect.
        // Order is the whole edit: the picks above are unchanged, seeds included.
        s.push({label:'Calves',items:[{name:calf,detail:hsets+'×15–20'}]});
        s.push({label:'Leg isolation',superset:_laItems.length>1,rounds:hsets,items:_laItems});
      }
      if(includeHip)s.push(buildHipSection(seed+w,isBW,_prehabKeep));
      // V178 (D3): foot & ankle rides with hip stability for runners. An ankle-region injury
      // plan owns that joint through the rehab section, so the prehab block steps aside.
      if(includeHip&&(cfg.cardioTypes||[]).indexOf('run')>=0&&!(cfg.injury&&cfg.injury.region==='ankle'))s.push(buildFootAnkleSection(seed+w,isBW,false,_prehabKeep));
      // Loaded carry surfaces beyond the full day: a grip/posterior/core finisher on legs day,
      // a fresh pick so it doesn't echo the full day's carry. Gated on session length to respect
      // shorter workouts.
      // ONE carry, not two. Suitcase + farmer back-to-back is the same loaded-carry stimulus
      // twice (6 sets) tacked onto a day that often already carries a run — pure session tail.
      // The pick rotates per block, so both variants still surface across the program.
      // CARDIO GATE: carries are cheap after an easy/recovery run, but not after threshold,
      // interval or long work — there the grip/postural cost lands on an already-taxed athlete.
      // Reuses the same interference model the fatigue cap uses (≥1.0 = hard or long session).
      const _carryHardCardio=_cardioInterference(opts.cardio)>=1.0||isBW;   // no implements on the bodyweight tier
      if(opts.wantCarry&&!denseHypertrophy&&!_carryHardCardio)s.push({label:'Loaded carry finisher',optional:true,items:[{name:ex.carry[0],detail:_carryRx('3×40 yards',ex.carry[0],'heavy')}]});
    } else if(role==='full'){
      // ── LOADED FULL-BODY DAY (V138, Tier-3 Q3/Q4 signed + Mario's hybrid amendment) ──
      // Body-path and hybrid STRENGTH/HYPERTROPHY athletes on loaded tiers exit the NSW
      // calisthenic cap: this day was their week's only dead session (unloaded, static,
      // zero stimulating volume toward the stated goal) while legs sat at 1×/week — the
      // single best-supported frequency fix in the literature. The day is deliberately
      // DB/machine/cable-biased: comp barbell lifts stay on their dedicated days, so no
      // pattern stacks a third heavy barbell session and capRegionalFatigue never has to
      // unwind one. NSW day survives untouched where it belongs: event path, athletic
      // support, bodyweight/home_basic tiers; CrossFit keeps its explosive lead (equipment
      // gate); explosive finisher is dropped at selection per the V129 same-day rule.
      const _loadedFull=(goal==='strength'||goal==='hypertrophy')
        &&(cfg.equipment==='commercial'||cfg.equipment==='home_full');
      if(_loadedFull){
        // HYBRID AMENDMENT (Mario): when this day carries the week's LONG cardio session,
        // run the SHORT skeleton — lower lead + one upper superset, finisher dropped,
        // ~25 min. Lifting 40 minutes around a 2-hour Z2 ride is a real cost; the
        // interference doctrine trims the day, not the principle. Long-session vocabulary
        // harvested from the live engines: run 'Long Run*', bike 'Long Ride*', and swim's
        // LSD slot (the swim engine's long session IS its LSD).
        const _c=opts.cardio;
        // V216 (D156): the long day is a CLASS, the day that carries the long run. An NSW run card
        // has no Long Run subtype; it says so on its dose (key 'long'), the contract _longRunTier
        // reads. NRC, bike and swim keep their subtype tests below.
        const _longDay=!!(_c&&_c.dose&&_c.dose.key==='long')||!!(_c&&_c.subtype&&(
          (_c.type==='run'&&/^Long Run/.test(_c.subtype))||
          (_c.type==='bike'&&/^Long Ride/.test(_c.subtype))||
          (_c.type==='swim'&&/^Long Slow Distance/.test(_c.subtype))));
        // Effort targets: hypertrophy base RPE 8, strength base RPE 7 (volume day —
        // the muscle that drives the next block, not a third intensity day). The V137
        // beginner floor applies here the same as everywhere else.
        const _base=goal==='strength'?'7':'8';
        const _rpe=isBeginner&&w<=2?'6–7':isBeginner&&w<=4?'7':_base;
        const _lo=goal==='strength'?'8–10':'10–12';
        const _up=goal==='strength'?'8–10':'8–12';
        const _fin=goal==='strength'?'10–12':'12–15';
        // Locked goals only reach here (strength/hypertrophy), so blockSeed(w)===seed and
        // the movements hold for the whole block — consistent with the rotation doctrine.
        // The two full slots of a 6/7-day split differentiate via the variant offset.
        const _fo=(fullVariant==='lower')?40:0;
        const _noBar: (n: string) => boolean=n=>!/^barbell|^pendlay|good morning|swing/i.test(n);
        const _lead=pick(lungePool.filter(_noBar),1,blockSeed(w)+30+_fo)[0]||lungePool[0];
        const _rdl=pick([...hingePool,...hipExtPool].filter(_noBar),1,blockSeed(w)+31+_fo)[0]||hipExtPool[0];
        const _press=pick(EXLIB.chest_acc.filter(n=>/dumbbell|dips/i.test(n)),1,blockSeed(w)+32+_fo)[0];
        const _row=pick(rowPool.filter(_noBar),1,blockSeed(w)+33+_fo)[0]||rowPool[0];
        s.push({label:'Lower strength',superset:true,rounds:vsets(3),items:[
          {name:_lead,detail:vsets(3)+'×'+_lo+' each @ RPE '+_rpe},
          {name:_rdl,detail:vsets(3)+'×'+_lo+' @ RPE '+_rpe}]});
        s.push({label:'Upper superset',superset:true,rounds:vsets(3),items:[
          {name:_press,detail:vsets(3)+'×'+_up+' @ RPE '+_rpe},
          {name:_row,detail:vsets(3)+'×'+_up+' @ RPE '+_rpe}]});
        if(!_longDay){
          // Delts or arms close the day, alternating by seed so two programs differ.
          const _armsDay=((seed+_fo)%2)===0;
          const _fA=_armsDay?(isBW?EXLIB.biceps:bicepsAccPool).filter(_noBar):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));
          const _fB=_armsDay?(isBW?EXLIB.triceps:_gear(EXLIB.triceps)):(isBW?EXLIB.shoulder_iso:_gear(EXLIB.shoulder_iso));
          const _f1=pick(_fA,1,blockSeed(w)+34+_fo)[0];
          const _f2=_armsDay?pick(_fB,1,blockSeed(w)+35+_fo)[0]
                            :pick(_fB.filter(n=>n!==_f1),1,blockSeed(w)+35+_fo)[0];
          // V164 station rule (arms branch is the live one — Preacher curl×cable work;
          // the delts branch is STACK/PORT-only and always passes through untouched).
          const _sp=_ssPair(_f1,_f2,_fA,_fB);
          s.push({label:_armsDay?'Arms finisher':'Delts finisher',superset:_sp.ok,rounds:vsets(3),items:[
            {name:_sp.a,detail:vsets(3)+'×'+_fin+' @ RPE '+_rpe},
            {name:_sp.b,detail:vsets(3)+'×'+_fin+' @ RPE '+_rpe}]});
        }
        return s;
      }
      // Two full-body days per week (6/7-day splits) used to render byte-identical because
      // exercise picks are seeded per-week, not per-day-slot. They're now differentiated by
      // emphasis: FULL A = upper-biased (calisthenic push/pull + power), FULL B = lower-biased
      // (single-leg + hinge lead, calisthenic upper underneath). Both stay barbell-free — the
      // comp squat/bench/row live on the dedicated legs/push/pull days, so this never stacks a
      // third heavy compound of any pattern into the week.
      if(fullVariant==='lower'){
        const lowerLead=pick(lungePool,2,blockSeed(w)+16);
        const lowerHinge=pick(hingePool,1,blockSeed(w)+17)[0];
        const _lhe0=pick(hipExtBW,1,blockSeed(w)+20)[0];const lowerHipExt=(_lhe0===lowerHinge)?(pick(hipExtBW.filter(x=>x!==lowerHinge),1,blockSeed(w)+20)[0]||_lhe0):_lhe0;
        const lowerPush=pick(fullPushPool.filter(x=>x!==ex.fullPush),1,blockSeed(w)+19)[0]||ex.fullPush;
        // SAME-DAY RULE (V129, doctrine): heavy strength and plyometrics must not share a
        // day for the same body area, though upper strength with lower plyo is explicitly
        // fine. This is the LOWER variant, so its own strength work is lower-body — the
        // power block is dropped rather than relocated. Gating at selection means the
        // collision is never created, so capRegionalFatigue and the deconflicts never have
        // to unwind a block they already scored (Mario's call).
        if(explosiveLead && !_powerBlocked && _powerLegal.length){
          const pw=pick(_powerLegal,2,blockSeed(w)+18);
          // V143 GUARD: a workaround-tier athlete's legal pool can filter to ONE movement
          // (kettlebell swing is the only 0.5-tier survivor in most gear configs). The
          // hardcoded two-item literal rendered pw[1] as 'undefined'. Roles are positional —
          // a one-movement block keeps the lead role, never the leftover.
          // V170 (D2/D3/D5): reps, cue and rest are all properties of the COST TIER now
          // and come from _powerPrescribe. Roles stay positional and stay 3/5 — that is what
          // a 1.0+ movement is handed — but a 0.5 movement overrides them from either slot.
          const pwRoles: [string, number][]=[[pw[0],3],[pw[1],5]];
          // V144 (D4-i/iii): dose comes straight from _powerDose — the budget owns experience
          // AND age, vsets is out of the power path (see _powerDose comment). The V143
          // Math.min(10,...) display clamp is retired with it; the clamp lives in the dose.
          const _pwOn=pwRoles.filter(r=>r[0]);
          s.push({label:'Power — lower explosive',items:_pwOn.map(r=>(
            {name:r[0],detail:_powerPrescribe(r[0],r[1],cfg.experience,cfg.ageBracket)}))});
        }
        s.push({label:'Lower strength',superset:true,rounds:vsets(3),items:[{name:lowerLead[0],detail:vsets(3)+'×10 each'},{name:lowerHinge,detail:vsets(3)+'×10'}]});
        s.push({label:'Hip extension + push',superset:true,rounds:vsets(3),items:[{name:lowerHipExt,detail:vsets(3)+'×10'},{name:lowerPush,detail:vsets(3)+'×10–12 @ RPE 7'}]});
        // Same gate as the Power fallback: this block claims to be explosive work, so it
        // answers to the power axis even though it draws from the conditioning pool.
        // A protect-tier athlete gets no explosive heading at all; the knee-stability hold
        // it supersets with is prehab and survives on its own.
        const _finPower=_powerAllowed(ex.cond[3], cfg.experience, cfg.injury, cfg.ageBracket);
        if(!explosiveLead){
          if(_finPower) s.push({label:'Explosive finisher',optional:true,superset:true,rounds:vsets(3),items:[{name:ex.cond[3],detail:vsets(3)+'×12'},{name:ex.kneeStab,detail:vsets(3)+'×30 sec'}]});
          else s.push({label:'Knee stability',optional:true,items:[{name:ex.kneeStab,detail:vsets(3)+'×30 sec'}]});
        }
      } else if(explosiveLead && !_powerBlocked && _powerLegal.length){
        // EXPLOSIVE LEAD (Athletic Support OR CrossFit): power output trains best un-fatigued, so
        // lead with explosive work at low reps and FULL recovery (straight sets, not a superset),
        // then the calisthenic strength as accessory underneath it.
        const pw=pick(_powerLegal,2,blockSeed(w)+15);
        // V143 GUARD: same single-movement-pool protection as the lower-variant site.
        // V144: budget-owned dose, same as lower-variant site. V170 (D1/D2/D3/D5): reps,
        // cue and rest come from the cost tier via _powerPrescribe, one writer for both sites.
        const pwRoles: [string, number][]=[[pw[0],3],[pw[1],5]];
        const _pwOn=pwRoles.filter(r=>r[0]);
        s.push({label:'Power — explosive first',items:_pwOn.map(r=>(
          {name:r[0],detail:_powerPrescribe(r[0],r[1],cfg.experience,cfg.ageBracket)}))});
        s.push({label:'Strength',superset:true,rounds:vsets(3),items:[{name:ex.fullPush,detail:vsets(3)+'×10–12 @ RPE 7'},{name:ex.fullPull,detail:vsets(3)+'×8–12'}]});
      } else {
        s.push({label:'Strength',superset:true,rounds:vsets(3),items:[{name:ex.fullPush,detail:vsets(3)+'×10–12 @ RPE 7 — full ROM, controlled'},{name:ex.fullPull,detail:vsets(3)+'×8–12'}]});
        // The non-explosiveLead fallback fills a block LABELLED 'Power' from the
        // conditioning pool, which is not gated by _powerLegal. Left ungated it printed a
        // Power block to a protect-tier athlete — 160 of them in the sweep. Filtered on the
        // same predicate, and the block is dropped rather than half-filled: a Power heading
        // with one movement under it is worse than no heading. Note the conditioning pool
        // ALSO feeds Leg superset B and Light finisher, and those are deliberately NOT
        // gated here — a kettlebell swing in a leg superset is doing a hinge's job, not
        // power development, and the existing injury pool overrides already rule on it.
        const _condPower=(ex.cond||[]).filter(n=>_powerAllowed(n, cfg.experience, cfg.injury, cfg.ageBracket));
        // V135: this block was LABELLED Power but is the conditioning pool at conditioning
        // doses (3×15 / 3×10) placed after the strength work — it was never power training,
        // and the lower variant already calls the identical construct an Explosive finisher.
        // Relabelled to match and flagged optional; movements, doses and position unchanged.
        // A true power-first block for body-path strength/hypertrophy is the Tier-3 full-body
        // redesign (§12), not a label edit.
        if(_condPower.length>=2) s.push({label:'Explosive finisher',optional:true,superset:true,rounds:vsets(3),items:[{name:_condPower[0],detail:vsets(3)+'×15'},{name:_condPower[1],detail:vsets(3)+'×10'}]});
      }
      if(opts.wantCarry&&!denseHypertrophy&&!isBW&&_cardioInterference(opts.cardio)<1.0)s.push({label:'Carry',optional:true,items:[{name:ex.carry[0],detail:_carryRx('3×40 yards',ex.carry[0],'')}]});
    } else if(role==='active'){
      s.push({label:'Active recovery',items:[{name:'Kettlebell swing',detail:'3×15 easy'},{name:'Bodyweight squats',detail:'2×20'},{name:'Walking lunges',detail:'2×10 each'}]});
      s.push({label:'Mobility',items:[{name:'Hip 90/90 stretch',detail:'3×40 sec each'},{name:"Worlds greatest stretch",detail:'5 each side'},{name:'Thoracic rotations',detail:'2×10 each'}]});
    }
    return s;
  }

  // Build cardio schedule
  return { buildSections, gearOK:_gearOK };
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { engineC_kinematics };
