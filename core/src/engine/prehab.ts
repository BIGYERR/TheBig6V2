import { EXLIB, pick } from './exercise-library.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { Equipment, Item, Section } from '../domain/index.ts';

/** The four core pillars' drills: anti-extension in a static and a loaded tier, the other three in one list each. */
export interface CorePillars {
  anti_extension: { name: string; static: Item[]; loaded: Item[] };
  anti_rotation: { name: string; items: Item[] };
  dynamic_bracing: { name: string; items: Item[] };
  rotational_power: { name: string; items: Item[] };
}

function buildHipSection(seed: number,bodyweight: boolean): Section{
  // Reliable stability dose: the section always draws 2 loaded/active glute-med drills plus
  // 1 mobility piece, so a leg day can never come up all-stretches with zero abductor work.
  // Bodyweight tier ("Room only") swaps banded drills for equipment-free glute-med equivalents.
  const stabPool=bodyweight
    ? ['Side-lying leg raises','Clamshells (bodyweight)','Fire hydrants','Standing hip abduction']
    : EXLIB.hip_stability;
  const stab=pick(stabPool,2,seed);
  const mob=pick(EXLIB.hip_mobility,1,seed+7);
  const selected=[...stab,...mob];
  const details: Record<string, string>={
    "Clamshells w/ band":"2×15 each","Banded side steps":"2×20 each","Banded monster walks":"2×15 each","Standing band hip abduction":"2×15 each",
    "Hip airplane (light KB)":"2×6 each, slow","Seated banded hip flexion":"2×15 each","Weighted 90/90 hip switch":"2×6 each",
    "Side-lying leg raises":"2×15 each","Clamshells (bodyweight)":"2×20 each","Fire hydrants":"2×15 each","Standing hip abduction":"2×20 each",
    "Hip 90/90 stretch":"2×45 sec each","IT band stretch":"2×30 sec each","Worlds greatest stretch":"5 each side"
  };
  return {label:'Hip stability',hip:true,items:selected.map(n=>({name:n,detail:details[n]||'2×15'}))};
}

// ── FOOT & ANKLE SECTION (V178, D3) ──────────────────────────────────────────
// Two drills a day, fixed prescription, seeded off the hip section's seed so the two
// prehab blocks never share a draw. Carries hip:true on purpose: every cap exemption,
// injury-sweep protection and render rule keyed on that flag applies unchanged.
function buildFootAnkleSection(seed: number,bodyweight: boolean,raceWeek?: boolean): Section{
  const details: Record<string, string>={
    'Tibialis raise (wall lean)':'2×20','Banded dorsiflexion':'2×15 each',
    'Single-leg bent-knee soleus raise':'2×12 each, slow','Standing ankle CARs':'2×5 each direction',
    'Toe yoga (splay + big-toe lifts)':'2×10 each foot'
  };
  // V180 (D8, Mario's concur): race week is dynamic mobility only. A random draw could hand
  // the athlete single-leg soleus raises on T-5 — loaded work, and the wrong side of the
  // tendon-stiffness line. Fixed pair, no draw, both tiers, label carries the reason.
  if(raceWeek){
    const rw=['Standing ankle CARs','Toe yoga (splay + big-toe lifts)'];
    return {label:'Foot & ankle — mobility only',hip:true,items:rw.map(n=>({name:n,detail:details[n]}))};
  }
  const pool=bodyweight?EXLIB.foot_ankle_bw:EXLIB.foot_ankle;
  const sel=pick(pool,2,seed+13);
  return {label:'Foot & ankle',hip:true,items:sel.map(n=>({name:n,detail:details[n]||'2×15'}))};
}

// ── REHAB SECTION (V111) ─────────────────────────────────────────────────────
// Protect-tier shoulder and elbow lose the whole pressing day. The old design handed
// that day to rows, which doubled the week's pulling volume onto the injured joint —
// the pull day already trains normally under both plans, so the extra rowing was
// additive, never replacement. The day is now what an elite coach would actually
// program into that window: dedicated rehab plus trunk.
//
// Deliberately NO lower-body fill. A legs-region main on a day labelled 'push' is
// invisible to deconflictSameRegion (which reads role labels at schedule time, before
// any exercise exists), and that is the exact defect class V111 exists to close.
//
// Bypasses _gear() on purpose, exactly as buildHipSection does: the cable gate strips
// every banded movement on non-commercial tiers, and a band is the one implement a
// hotel-room athlete can reasonably be assumed to own for rehab. Bodyweight tier gets
// its own equipment-free list instead.
function buildRehabSection(region: string,seed: number,bodyweight: boolean): Section[]{
  const BW: Record<string, string[]>={
    shoulder:['Side-lying external rotation (bodyweight)','Prone Y raise','Scapular pushup','Wall slide'],
    elbow:['Wrist extensor isometric hold','Towel grip squeeze','Wrist circles (slow)','Eccentric wrist extension']
  };
  const stabPool = bodyweight ? (BW[region]||BW.shoulder)
                              : (EXLIB[region+'_stability']||EXLIB.shoulder_stability);
  const mobPool  = EXLIB[region+'_mobility']||EXLIB.shoulder_mobility;
  const stab=pick(stabPool,3,seed);
  const mob =pick(mobPool,2,seed+11);
  const details: Record<string, string>={
    'Band external rotation (arm at side)':'3×15 each, slow, elbow pinned to the ribs',
    'Side-lying dumbbell external rotation':'3×12 each, light',
    'Band pull-apart':'3×20',
    'Prone Y raise':'3×12',
    'Isometric external rotation hold':'3×30 sec each',
    'Side-lying external rotation (bodyweight)':'3×15 each',
    'Scapular pushup':'3×12','Wall slide':'3×12',
    'Wrist extensor isometric hold':'3×30 sec each',
    'Eccentric wrist extension':'3×12 each, 3 sec lower',
    'Supination and pronation (light DB)':'3×12 each',
    'Towel grip squeeze':'3×20 sec each',
    'Wrist circles (slow)':'2×15 each',
    'Serratus wall slide':'2×12','Doorway pec stretch':'2×30 sec each',
    'Thoracic rotations':'2×10 each',
    'Wrist flexor stretch':'2×30 sec each','Wrist extensor stretch':'2×30 sec each'
  };
  const head = region==='elbow' ? 'Elbow and forearm' : 'Cuff and scapula';
  const mobH = region==='elbow' ? 'Forearm mobility' : 'Shoulder mobility';
  return [
    {label:head, items:stab.map(x=>({name:x,detail:details[x]||'3×15'}))},
    {label:mobH, items:mob.map(x=>({name:x,detail:details[x]||'2×30 sec'}))}
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC CORE ENGINE
// Core is treated like the hip injector: stripped from static templates and
// injected at WEEK-ASSEMBLY (not inside the per-day builder) so it can look AHEAD
// to tomorrow and refuse to stack high-fatigue trunk work the day before a speed
// run or heavy posterior-chain lift. 4-pillar functional taxonomy.
// ─────────────────────────────────────────────────────────────────────────────
const CORE_PILLARS: CorePillars = {
  // Doctrine-anchored: NSW Physical Training Guide Table 3 (Plank, Side Plank, Bird Dog,
  // Superman, Wipers, Bridge) + hanging knee-raise/sit-up + McGill Big 3 (curl-up, side
  // plank, bird dog). Loaded/cable/carry options are standard S&C progressions beyond the
  // guide's bodyweight baseline. Organized by FATIGUE TIER so the deconfliction holds.
  anti_extension: { // Spine stability. static = low fatigue (run-day safe); loaded = high fatigue
    name: 'Anti-Extension',
    static: [
      {name:'Plank hold', detail:'3×40 sec'},                        // NSW
      {name:'Bird dogs', detail:'3×20 alternating'},             // NSW + McGill Big 3
      {name:'McGill curl-up', detail:'3×6 each, 8 sec holds'},  // McGill Big 3
      {name:'Superman', detail:'3×12'},                         // NSW
      {name:'RKC plank', detail:'3×20 sec max tension'}
    ],
    loaded: [
      {name:'Ab wheel rollouts', detail:'3×8–10'},
      {name:'Weighted dead bugs', detail:'3×8 each'},
      {name:'Barbell rollouts', detail:'3×8'}
    ]
  },
  anti_rotation: { // Lateral stability — low fatigue, safe before anything
    name: 'Anti-Rotation',
    // V193 (D49): D46-c's gear gate closed an unnamed leak (the two carries were printing
    // on the BODYWEIGHT tier through this pillar), which left the pillar with two legal
    // members there — so it emitted the identical pair {Side plank, Pallof press} on 45 of
    // 45 occurrences. NSW p.7 ("Choose different variations ... for the same basic movement
    // on different days") and p.7 item 7 ("For the trunk, use a variety of static as well as
    // dynamic exercises") both forbid that. A held position still needs a progression
    // ladder, and two members give none. Two gear-free members are added, both legal on
    // every tier, both taking the dose of 'Pallof press' from inside this same pillar.
    // The ladder reads bird dog (contralateral reach, the limb is the load) -> side plank ->
    // plank shoulder taps (the base narrows under a shifting load) -> Pallof press, and
    // 'Side plank' sits in three of the four-member pillar's six pairs, so a static hold
    // still appears in half of all blocks.
    items: [
      {name:'Bird dogs', detail:'3×12 each'},                   // NSW Table 3 + McGill Big 3
      {name:'Side plank', detail:'3×30–45 sec each'},           // NSW + McGill Big 3
      {name:'Plank shoulder taps', detail:'3×12 each'},         // V178 _BW_SUBS target, promoted to member; dose from the member it laddered into
      {name:'Pallof press', detail:'3×12 each'},
      {name:'Dumbbell renegade rows', detail:'3×8 each'}, // V178 (D1): anti-rotation plank with a pull riding along; _pattern exempts it from pull volume
      {name:'Farmer carry', detail:'3×40 yd'},
      {name:'Suitcase carry', detail:'3×40 yd each'}
    ]
  },
  dynamic_bracing: { // Force transfer / hip flexion — high CNS/hip-flexor fatigue
    name: 'Dynamic Bracing',
    items: [
      {name:'Hanging knee raises', detail:'3×12'},              // NSW
      {name:'Hanging leg raises', detail:'3×10'},
      {name:'Garhammer raises', detail:'3×12'},
      {name:'Toes-to-bar', detail:'3×8'}
    ]
  },
  rotational_power: { // Thoracic mobility / rotation — moderate, non-compressive
    name: 'Rotational Power',
    items: [
      {name:'Windshield wipers', detail:'3×16 (180° arc)'},     // NSW "Wipers"
      {name:'Medicine ball rotary toss', detail:'3×8 each'},
      {name:'Cable woodchoppers', detail:'3×12 each'},
      {name:'Landmine rotations', detail:'3×10 each'},
      // V193 (D46): three of the four members above name an implement, so an honest per-tier
      // gear gate would leave home_basic / minimal / bodyweight holding ONE member, and a
      // one-member pillar cannot fill a pair. NSW p.6 rec 2 and p.7 item 2 require movement in
      // all three planes unconditionally, and p.8 item 7 names the torso rotators a problem
      // area — so the pillar may not shrink on exactly the tiers with the least other
      // rotational exposure. Each addition is DERIVED from a member already here, not invented.
      {name:'Standing torso rotations (slow)', detail:'3×10 each'},  // V178 _BW_SUBS target for Landmine rotations, promoted from substitution target to member; dose from the member it stands in for
      {name:'Side plank thread-the-needle', detail:'3×10 each'},     // NSW p.7 item 7 asks static AND dynamic trunk work; dynamic rotational form of Side plank, already prescribed from the NSW trunk table
      {name:'Band woodchopper (door anchor)', detail:'3×12 each'}    // band form of Cable woodchoppers; dose copied from that member exactly
    ]
  }
};
// Run session types that heavily tax legs/CNS — mirror of the cardio legLoad speed set.
const CORE_SPEED_TYPES = new Set(['int','nrc_speed1','nrc_speed2']);

// V193 (D44): which tiers own a barbell. buildProgram computed this inline and the answer
// was unreachable from week assembly, where the core injector runs — so the one pool that
// is injected after the pool block had no gear gate at all. One definition, two readers.
function _tierHasBarbell(equip: Equipment): boolean{ return equip==='home_full'||equip==='commercial'||equip==='crossfit'; }
// V216 (D154): THE GEAR LENS, one predicate for every reader. Engine C's pools read it as _gearOK;
// applyInjuryFilter reads it for the build's own equipment, so an injury rename is judged by the
// same lens the draw was. The four flags derive from the tier exactly as Engine C derives its own.
// A pure function of the tier name; the body below moved here verbatim from Engine C.
function _gearLens(equip: Equipment): (n: string | null | undefined) => boolean{
  const hasBarbell=_tierHasBarbell(equip);
  const hasCables=equip==='commercial';
  const hasGHD=equip==='commercial'||equip==='crossfit';
  const hasDumbbells=equip!=='bodyweight';
  return n => {
    const N=String(n||'');
    // V113: '^(overhead|push) press$' and '^good mornings?$' retired. Those names existed
    // ONLY to catch barbell movements whose name did not say barbell. They now do, so
    // '^barbell ' covers them. Back/front squat stay bare by lifting convention.
    if(!hasBarbell && /\bbarbell\b|^trap bar|^power clean|^hang clean|^rack pull|^back squat|^front squat|^bench press$|close-grip bench/i.test(N)) return false;
    if(!hasGHD && /glute-ham|\bghr\b|45° back extension/i.test(N)) return false;
    // V114: 'machine seated calf raise' was named literally, which meant every OTHER
    // machine-named movement walked straight through. `\bmachine\b` is the general form.
    // Full machine-named inventory in EXLIB at time of writing: 'Machine chest press',
    // 'Machine seated calf raise', 'Hack squat (machine)' — the last already blocked by
    // 'hack squat'. Named-implement entries below stay because their names never say
    // cable or machine ('Rope tricep extension', 'Face pull', 'Pec deck').
    if(!hasCables && /cable|\brope\b|face pull|pulldown|pec deck|\bleg press\b|leg extension|lying leg curl|seated leg curl|hack squat|\bsmith\b|preacher|\bmachine\b/i.test(N)) return false;
    // THE DUMBBELL AXIS (V127). Attempted in V122 and reverted the same session, because
    // _gear USED TO fall back to the RAW pool when filtering emptied it (removed V197,
    // D70b — the quote below is history, not the current line):
    //   const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f.length ? f : pool; };
    // So tightening this gate LOOSENED the result: EXLIB.shoulder_iso is five dumbbells and
    // cables, it emptied on the bodyweight tier, and the fallback handed that tier a cable
    // Face pull. The prerequisite — a bodyweight-legal member in every pool this clause can
    // empty, routed through _bw() the way the calf pool already was — landed first in V127
    // as EXLIB.shoulder_iso_bw. Harvested, not guessed: shoulder_iso and calves are the only
    // two pools that empty once the dumbbell and cable/machine clauses both apply.
    // 'kettlebell' and '(kb)' are deliberately NOT here — kettlebell ownership is asked
    // separately and hasEquip already answers for them.
    if(!hasDumbbells && /\bdumbbell|\bdb\b|goblet/i.test(N)) return false;
    return true;
  };
}


// ── BODYWEIGHT SAFETY SWEEP ───────────────────────────────────────────────────
// The "Room only" tier must never print a movement that needs gear. Pools are gated
// at selection, but equipment-bearing movements also arrive from subsystems OUTSIDE
// the pool block — the dynamic core engine, the hip injector, wildcard/finisher
// content. Enumerating every one of those is fragile and will rot as pools change,
// so this is a final catch-all: walk the built program and substitute anything that
// still names equipment. Explicit map first, then a keyword fallback so a NEW gear
// movement added later degrades to something safe instead of leaking.
const _BW_SUBS: Record<string, string>={
  // V178: loaded prehab/core names whose _bwFallback would land on Burpees or a row. 'Landmine
  // rotations' was unreachable before D6 rotated the hot-tomorrow pillar; it goes to a
  // rotational drill, NOT to the Dead bug the other two rotational members already sub to,
  // or a rotated pair could collapse to one item under the per-section dedup.
  'Dumbbell renegade rows':'Plank shoulder taps','Weighted 90/90 hip switch':'Hip 90/90 stretch','Landmine rotations':'Standing torso rotations (slow)',
  'Medicine ball rotary toss':'Dead bug (slow tempo)',
  'Cable woodchoppers':'Dead bug (slow tempo)',
  'Weighted dead bugs':'Dead bug (slow tempo)',
  'Weighted chinups':'Inverted row (under a table)',
  'Weighted dips':'Bench dips (chair)',
  'Ball slams OR Kettlebell swings':'Burpees',
  'Ball slams':'Burpees',
  'Kettlebell swing':'Jump squats',
  'Clamshells w/ band':'Clamshells (bodyweight)',
  'Banded side steps':'Side-lying leg raises',
  'Terminal knee extension (band)':'Wall sit',
  'Spanish squat hold (KB)':'Wall sit',
  'Slow goblet squat (KB)':'Squat (slow 3s tempo)',
  // V192 (D41): keep the PLANE when the bell disappears. The generic _bwFallback reads
  // the pattern, not the plane, and would land this back in the sagittal plane.
  'Dumbbell goblet side lunge':'Side lunge (bodyweight)'
};
const _BW_GEAR=/kettlebell|dumbbell|barbell|\bKB\b|\bDB\b|medicine ball|ball slam|cable|machine|trap bar|bumper|wall ball|weighted|weight vest|rucksack|sled|bench press|close-grip bench|skullcrush|preacher|lat pull|leg press|leg extension|leg curl|hack squat|pec deck|\bband(?!\s*stretch)/i;
function _bwFallback(name: string | null | undefined): string{
  const N=(name||'').toLowerCase();
  if(/press|pushup|dip/.test(N))            return 'Pushups (slow 3s eccentric)';
  if(/row|pull|chin/.test(N))               return 'Inverted row (under a table)';
  if(/squat|lunge|step/.test(N))            return 'Squat (slow 3s tempo)';
  if(/deadlift|hinge|swing|romanian/.test(N))return 'Single-leg Romanian deadlift (bodyweight)';
  if(/curl/.test(N))                        return 'Inverted row (supinated, under a table)';
  if(/carry/.test(N))                       return 'Burpees';
  if(/raise|fly|delt/.test(N))              return 'Prone Y-T-W raises';
  return 'Burpees';
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  CORE_PILLARS, CORE_SPEED_TYPES, _BW_GEAR, _BW_SUBS, _bwFallback, _gearLens, _tierHasBarbell, buildFootAnkleSection,
  buildHipSection, buildRehabSection,
};
