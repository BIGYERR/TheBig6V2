
import type { Experience, Goal, Section, TestLift } from '../domain/index.ts';

/** Where a movement is done (V164): a superset never pairs two fixed stations of different classes. */
export type StationClass = 'BENCH' | 'STACK' | 'RACK' | 'PORT';
/** One logged set of a movement in ia_exw_ (the loads a movement has been worked at, by week). */
export interface ExWeightEntry { week: number | string; ts?: number }
/** One movement's thread in ia_exw_, under its store key (exStoreKey). */
export interface ExWeightRow { name: string; entries: ExWeightEntry[] }
// EXERCISE LIBRARY
const EXLIB: Record<string, string[]>={
  chest_compound:['Barbell bench press','Incline barbell press','Close-grip bench press','Dumbbell bench press'],
  chest_acc:['Dumbbell incline press','Dumbbell bench press','Dips','Pushups (slow tempo)','Diamond pushups','Dumbbell decline press','Dumbbell floor press'],
  chest_acc_joint:['Dumbbell incline press','Dumbbell bench press','Machine chest press','Cable crossover','Pec deck','Dumbbell decline press','Dumbbell floor press'],
  back_compound:['Deadlift','Trap bar deadlift','Sumo deadlift','Barbell Romanian deadlift'],
  back_row:['Barbell row','Pendlay row','Kettlebell single-arm row','Dumbbell row'],
  back_pull:['Chinups','Weighted chinups','L-sit chinups','Neutral-grip chinups'],
  back_pull_joint:['Lat pulldown','Assisted pullups','Neutral-grip pulldown','Straight-arm pulldown'],
  // V192 (D42): landmine rotational press — a pressing movement that starts at the
  // shoulder and finishes forward at chest height, driven by hip rotation. It lives in
  // the shoulder pool because the pattern is a press, not a core drill; _pattern reads
  // it as 'hpress' for exactly that reason.
  shoulder:['Barbell overhead press','Dumbbell Arnold press','Kettlebell single-arm press','Dumbbell lateral raise','Barbell push press','Landmine rotational press'],
  shoulder_iso:['Dumbbell lateral raise','Cable lateral raise','Dumbbell front raise','Dumbbell rear delt fly','Face pull'],
  // BODYWEIGHT DELT ISOLATION (V127). Every entry in shoulder_iso above is a dumbbell or a
  // cable, so once _gearOK gained its dumbbell clause the pool emptied on the bodyweight
  // tier and _gear's `f.length ? f : pool` fallback handed that tier the RAW list — a cable
  // Face pull on a tier with no cables. Same shape the calf pool already uses at its call
  // site: give the tier real bodyweight movements rather than letting the fallback leak.
  shoulder_iso_bw:['Prone Y-T-W raises','Wall slides'],
  triceps:['Rope tricep extension','Overhead dumbbell extension','Cable pushdown','Dumbbell skullcrushers','Bench dips'],
  biceps:['Barbell curl','Dumbbell curl','Dumbbell hammer curl','Incline dumbbell curl','Cable curl','Preacher curl'],
  // Two heads, two movements. Gastroc loads knee-straight, soleus loads knee-bent, so a
  // pool of standing-only variants trains half the calf. The machine seated raise is
  // cable-tier only, which left every other tier gastroc-only until the DB seated entry.
  calves:['Dumbbell standing calf raise','Dumbbell seated calf raise','Machine seated calf raise'],
  squat:['Back squat','Front squat','Paused back squat','Barbell box squat'],
  squat_joint:['Leg press','Dumbbell goblet squat','Hack squat (machine)','Barbell box squat'],
  // V178 (D1): landmine reverse lunge — the loaded unilateral knee-dominant lunge with a
  // fixed bar path (name says landmine → RACK class, barbell-gated by the pool's own
  // hasBarbell branch). Sliders/gliders are NOT modeled equipment, so the glider lateral
  // lunge was ruled out rather than shipped as a movement nobody can set up.
  // V192 (D41): dumbbell goblet side lunge — the first LOADED frontal-plane movement
  // in the file. The app trained two planes; NSW asks for three. Goblet, not Zercher:
  // the anterior counterweight makes the pattern self-coaching and leaves a bail path.
  // The name deliberately avoids the word 'lateral' — _isCompound's exclusion regex
  // vetoes any name containing it, which would strip this of compound status.
  lunge:['Dumbbell Bulgarian split squat','Reverse lunge (KB)','Walking lunge (KB)','Step-ups (KB)','Landmine reverse lunge','Dumbbell goblet side lunge'],
  // V178 (D1): standing cable hamstring curl — knee flexion in a running-relevant standing
  // posture. Lives in leg_accessory (which is _gear'd, so the cable gate applies) NOT in
  // hinge (which is not). _pattern reads 'hamstring curl' → leg_iso, added the same session.
  // V197 (D75): renamed from leg_iso and four gear-free names harvested. The old pool was
  // five machine/cable names: ZERO legal members on every tier but commercial. It only ever
  // printed because _gear's fallback handed the illegal pool straight back. The slot's job
  // is direct low-cost quad and hamstring volume AFTER the compounds, not "single-joint",
  // so the key no longer makes a _pattern claim the slot never asked for. Commercial keeps
  // all five machine names: it owns the machines. _pattern and _PATTERN_REGION are NOT
  // touched — leg_iso, hip_ext and lunge all map to 'legs' (9255), so volume accounting is
  // identical, and the knee/protect drop at 6981 is already right (a glute bridge and a hip
  // thrust are the safest loaded movements an angry knee can do, and P.dropNames at 6976
  // name-catches nordic / wall sit / spanish squat anyway).
  // Excluded by ruling, do not add back: 'Spanish squat hold (KB)' (a hold, needs a KB,
  // _compoundTier 2, kneeStabSel already draws it), 'Step-ups (KB)' (loaded unilateral
  // compound, already in EXLIB.lunge which feeds Leg superset A on the same card),
  // 'Dumbbell Bulgarian split squat' (_compoundTier 2, the hardest unilateral leg movement
  // in the file — the day's THIRD leg block is not where it belongs).
  leg_accessory:['Leg extension','Lying leg curl','Seated leg curl','Leg press','Standing cable hamstring curl','Nordic hamstring curl (anchored)','Single-leg glute bridge','Single-leg hip thrust','Wall sit'],
  // V178 (D1/D4): two unilateral hinges. Split-stance DL is the entry rung — stance, not
  // balance, is the limiter. Zercher single-leg DL is EX_MIN_EXP advanced: front-loaded
  // in the elbow crooks on one leg is a positional skill, not a caption you follow.
  hinge:['Barbell Romanian deadlift','Kettlebell single-leg deadlift','Kettlebell swing','Barbell good mornings','Dumbbell split-stance deadlift','Zercher single-leg deadlift'],
  // V122: 'Slow goblet squat (KB)' removed. Every consumer of this pool prescribes it in
  // SECONDS (25s in the chest+knee and leg supersets, 30s in the explosive finisher), so
  // this is a timed-hold pool. A tempo squat is a rep movement; "3x30 sec" on it is not an
  // instruction anyone can follow. Its bodyweight substitution 'Squat (slow 3s tempo)' was
  // removed from the _bw list at the kneeStabSel call site for the same reason.
  knee_stability:['Spanish squat hold (KB)','Wall sit','Terminal knee extension (band)'],
  // V178 (D1): hip airplane (single-leg hinge + pelvic rotation, light KB at the chest) and
  // seated banded hip flexion (the hip flexor is the runner's forgotten muscle). Both
  // classify null in _pattern — prehab, cap-exempt — and carry fixed details in
  // buildHipSection. 'Standing clamshell' from the same source IS 'Standing band hip
  // abduction' and was folded as a no-op.
  // D239 (P-BENCH): the Copenhagen plank (the bench had no adductor work), the side plank
  // with the top leg raised (glute med) and the glute bridge hold; three mobility pieces, the
  // Cossack shift (V192 kept it out of the lunge pool as mobility), the half-kneeling hip
  // flexor stretch and pigeon lift-offs. All prehab: _pattern null, doses fixed.
  hip_stability:["Clamshells w/ band","Banded side steps","Banded monster walks","Standing band hip abduction","Hip airplane (light KB)","Seated banded hip flexion","Copenhagen plank (bent knee)","Side plank (top leg raised)","Glute bridge hold"],
  hip_mobility:["Hip 90/90 stretch","IT band stretch","Worlds greatest stretch","Weighted 90/90 hip switch","Cossack squat shift","Half-kneeling hip flexor stretch","Pigeon lift-offs"], // V178: loaded 90/90 transition (plate on the front knee). The 'with row' flourish was dropped — 'row' would have scored it as pull volume.
  // V178 (D3): FOOT & ANKLE prehab pool. The calves pool loads gastroc/soleus in plantar
  // flexion only; nothing in the file trained the tibialis, dorsiflexion, the bent-knee
  // soleus in isolation, or ankle range. For a runner the soleus is what fails at mile
  // ten. Rides the same rail as hip stability (leg day, hip:true flag → cap-exempt,
  // prehab-protected under injury sweeps), runner-only, every week INCLUDING race week.
  // D239 (P-BENCH): single-leg balance (the bench had none), its loaded rung, the loaded
  // tib raise, the split-squat calf isometric, dorsiflexion range, foot intrinsics and calf
  // endurance in gait. The two KB names are loaded-tier only.
  foot_ankle:['Tibialis raise (wall lean)','Banded dorsiflexion','Single-leg bent-knee soleus raise','Standing ankle CARs','Single-leg balance hold (eyes closed)','Single-leg KB pass-around','Kettlebell tibialis raise (seated)','Split-squat heel-raise hold','Knee-to-wall ankle rocks','Towel scrunches','Tiptoe walks'],
  foot_ankle_bw:['Tibialis raise (wall lean)','Single-leg bent-knee soleus raise','Standing ankle CARs','Single-leg balance hold (eyes closed)','Split-squat heel-raise hold','Knee-to-wall ankle rocks','Towel scrunches','Tiptoe walks'],
  // Cuff / scapular rehab. Pain-free-range external rotation, low-load horizontal
  // abduction and scapular control — the drills that actually rehabilitate a protect-
  // tier shoulder, as opposed to simply avoiding it. Deliberately contains no pressing,
  // no loaded abduction, and no overhead range.
  shoulder_stability:['Band external rotation (arm at side)','Side-lying dumbbell external rotation','Band pull-apart','Prone Y raise','Isometric external rotation hold'],
  shoulder_mobility:['Serratus wall slide','Doorway pec stretch','Thoracic rotations'],
  // Forearm/elbow rehab. Isometric then eccentric wrist work is the standard loading
  // progression for extensor and flexor tendinopathy; grip work keeps the forearm
  // trained without an elbow-flexion or pressing demand.
  elbow_stability:['Wrist extensor isometric hold','Eccentric wrist extension','Supination and pronation (light DB)','Towel grip squeeze'],
  elbow_mobility:['Wrist flexor stretch','Wrist extensor stretch','Thoracic rotations'],
  core:['Ab wheel rollouts','Dead bugs','Hanging knee raises','Plank hold','L-sit hold','Bird dogs'],
  conditioning:['Ball slams','Kettlebell swing','Burpees','Broad jumps','Mountain climbers','Jump squats'],
  carry:['Farmer carry','Suitcase carry','Overhead carry']
};
// ── CARRY SIDE (V177, D-d) ───────────────────────────────────────────────────
// Two of the three carries are ONE-HAND movements. Both generated finishers wrote a
// fixed '3x40 yards' over a seeded pick from this pool, so a suitcase or overhead carry
// shipped with no side instruction: forty yards, unspecified arm, and half the trunk
// work the movement exists for. The curated library never had this bug (the anti-
// rotation pillar has said '3x40 yd each' since it was written) — only generation did.
// Keyed off the pool, not a regex on the name, because the pool is the only place that
// knows a carry is one-handed. Farmer is two hands and must NOT print 'each'.
// Grammar matches the curated library's house form: distance, then 'each' if the
// movement is one-handed, then the qualifier behind a comma ('50 yards, heavy').
const _CARRY_PER_SIDE: Record<string, number>={'Suitcase carry':1,'Overhead carry':1};
function _carryRx(dist: string,name: string | null | undefined,qual?: string | null): string{
  return dist + (_CARRY_PER_SIDE[String(name||'').trim()]?' each':'') + (qual?', '+qual:'');
}
// ── PRESS SIDE (V192, D42-c) ─────────────────────────────────────────────────
// The shoulder slot never printed a side. A kettlebell single-arm press shipped as
// '3×12' with no arm named, so half the prescription was invisible: the athlete
// either guessed twelve total or twelve per arm, and either way the trunk work an
// offset press exists for is unspecified. Carries have printed a side since V177
// D-d and a one-hand press is the same claim, so the same shape settles it.
// Keyed off the pool, not a regex on the name, because the pool is the only place
// that knows a press is one-handed. Barbell overhead press, Dumbbell Arnold press,
// Dumbbell lateral raise and Barbell push press are two-hand or two-side movements
// and must NOT print 'each'.
const _PRESS_PER_SIDE: Record<string, number>={'Kettlebell single-arm press':1,'Landmine rotational press':1};
function _isOneArmPress(name: string | null | undefined): boolean{ return !!_PRESS_PER_SIDE[String(name||'').trim()]; }
// ── REP-AFFINITY (V160, D2-b) ────────────────────────────────────────────────────────
// A movement declares the MAX reps a wave-driven prescription may ask of it.
// 'Paused back squat' is a positional-strength tool: the dead stop kills the
// stretch reflex (the 0.88 swap multiplier already knows this) and the curated
// workouts run it at 4×4 / 3×5. Twelve dead-stop reps terminate on bracing,
// not quads — wrong limiter — so it must never ride the endurance/hypertrophy/
// fatloss/balanced waves. SIDECAR MAP on purpose: EXLIB stays flat strings and
// every existing consumer is byte-identical. Untagged = unconstrained.
const REP_AFFINITY: Record<string, { maxReps: number }>={'Paused back squat':{maxReps:6},'Barbell box squat':{maxReps:6}};
// ── MIN EXPERIENCE (V178, D4) ─────────────────────────────────────────────────────
// Same sidecar shape as REP_AFFINITY. A movement declares the LEAST experience tier
// that may be handed it. Untagged = any. Applied at pool construction (buildEx) so
// every consumer of the pool inherits it; the power pools already do this by cost.
const EX_MIN_EXP: Record<string, Experience>={'Zercher single-leg deadlift':'advanced'};
const _EXP_RANK: Record<string, number>={beginner:0,intermediate:1,advanced:2};
function _expOK(name: string,experience: string | null | undefined): boolean{const m=EX_MIN_EXP[name];if(!m)return true;return (_EXP_RANK[experience||'intermediate']??1)>=(_EXP_RANK[m]??0);}// V161: box squat is a dead-stop power variant — honest pause dies past ~6 reps (Mario's ruling D1-b)
// ── STATION CLASS (V164, D1/D6) ──────────────────────────────────────────────
// A superset's stimulus is density; a cross-gym walk between members kills it and
// camps two stations. Classes: RACK (bar + plates territory), STACK (cables and
// pin-loaded machines), BENCH (dedicated single-purpose benches: GHR, 45° back
// extension, preacher), PORT (anything you carry to wherever you already are).
// Rule (_ssLegal): PORT pairs with everything; two fixed classes must MATCH.
// Sidecar classifier on the NAME, same doctrine as REP_AFFINITY — EXLIB stays flat.
function _stationClass(name: string | null | undefined): StationClass{
  const N=String(name||'').toLowerCase();
  if(/glute-ham|\bghr\b|45\u00b0 back extension|preacher curl/.test(N)) return 'BENCH';
  if(/cable|machine|pulldown|assisted pullup|leg press|leg extension|leg curl|hack squat|pec deck|^rope |face pull|smith/.test(N)) return 'STACK';
  if(/barbell|trap bar|landmine|pendlay|power clean|^back squat|^front squat|paused back squat|^deadlift|sumo deadlift|good morning|close-grip bench|^incline barbell/.test(N)) return 'RACK';
  return 'PORT';
}
function _ssLegal(a: string,b: string): boolean{const ca=_stationClass(a),cb=_stationClass(b);return ca==='PORT'||cb==='PORT'||ca===cb;}
// D2/D3b pair resolver. Commit aPref, walk b candidates in list order; if none is
// legal, ONE re-walk of a candidates (first station-compatible pairing wins); if
// both pools are pure and mutually banned, ok:false — the caller prints straight
// sets (D3 demotion). Walks are plain array order over already-seeded lists, so
// the outcome is deterministic for a given cfg+seed.
function _ssPair(aPref: string,bPref: string,aAlts?: string[] | null,bAlts?: string[] | null): { a: string; b: string; ok: boolean }{
  const A=[aPref].concat((aAlts||[]).filter(function(x){return x&&x!==aPref;}));
  const B=[bPref].concat((bAlts||[]).filter(function(x){return x&&x!==bPref;}));
  for(let i=0;i<B.length;i++){ if(B[i]!==aPref&&_ssLegal(aPref,B[i])) return {a:aPref,b:B[i],ok:true}; }
  for(let j=1;j<A.length;j++){ for(let i=0;i<B.length;i++){ if(B[i]!==A[j]&&_ssLegal(A[j],B[i])) return {a:A[j],b:B[i],ok:true}; } }
  return {a:aPref,b:bPref,ok:false};
}
// D5: the partner of a 2-item superset member, for station-filtering swap
// candidates. Curated pairs that are ALREADY cross-station are left unfiltered —
// the filter protects legal pairs, it does not retrofit designed ones.
function _ssPartnerOf(day: { sections?: Section[] } | null | undefined,outName: string): string | null{
  let p: string | null=null;
  ((day&&day.sections)||[]).forEach(function(s){
    if(p||!s||!s.superset||!Array.isArray(s.items)||s.items.length!==2) return;
    let i=-1;
    for(let k=0;k<2;k++){ if(s.items[k]&&s.items[k].name===outName){ i=k; break; } }
    if(i<0) return;
    const other=(s.items[1-i]||{}).name||null;
    if(other&&_ssLegal(other,outName)) p=other;
  });
  return p;
}
// EXERCISE STORE KEY  ONE writer for the slug that ia_exw_ records under.
// ia_exw_ keys on the exercise NAME, and V113 renamed 41 movements to name the implement
// they were always meant to use. A bare rename would orphan every load already logged, and
// ia_hist_ day snapshots still hold the OLD strings  a frozen week is a record of what was
// prescribed, so it is correct that it keeps them  which means both spellings stay live.
//
// Resolving OLD -> NEW at key time instead of rewriting localStorage is deliberate: nothing
// is migrated, so a rollback to V112 finds its data exactly where it left it. It also
// collapses the duplicate-spelling splits for free ('Barbell bench' vs 'Barbell bench press',
// 'Kettlebell swings' vs 'Kettlebell swing') without touching a single stored record.
const EX_RENAMED_V113: Record<string, string> = {
  'Push press':'Barbell push press','Overhead press':'Barbell overhead press',
  'Good mornings':'Barbell good mornings','Romanian deadlift':'Barbell Romanian deadlift',
  'Box squat':'Barbell box squat','Thrusters':'Barbell thrusters',
  'Paused bench press':'Paused barbell bench press','Paused bench press (2 sec)':'Paused barbell bench press (2 sec)',
  'Lateral raise':'Dumbbell lateral raise','Lateral raises':'Dumbbell lateral raise',
  'Hammer curl':'Dumbbell hammer curl','Skullcrushers':'Dumbbell skullcrushers',
  'Standing calf raise':'Dumbbell standing calf raise','Seated calf raise':'Machine seated calf raise',
  'Goblet squat':'Dumbbell goblet squat','Slow goblet squat':'Slow goblet squat (KB)',
  'Bulgarian split squat':'Dumbbell Bulgarian split squat',
  'Kettlebell press':'Kettlebell single-arm press','Kettlebell row':'Kettlebell single-arm row',
  // V177 (D-b/D-c): carries are named by the JOB, not the implement. A 70 lb bell and a
  // 70 lb dumbbell in one hand are the same carry and the same 70, so the modifier was
  // splitting one history thread in two for no coaching reason. Laterality folds the same
  // way — 'left'/'right' were never separate movements, they were a rep scheme wearing a
  // name, and they were being offered as SAME JOB swaps for themselves. Side now lives in
  // the detail (D-d). Farmer / suitcase / overhead stay THREE movements: two hands cancels
  // the lateral moment, one hand is the whole point, overhead adds the shoulder. Direction
  // flipped from V113 (which pointed the bare names AT the implement names) so every load
  // already logged under either spelling resolves forward. Nothing is migrated.
  'Suitcase carry (KB)':'Suitcase carry','Suitcase carry (KB) left':'Suitcase carry',
  'Suitcase carry (KB) right':'Suitcase carry',
  'Suitcase carry left':'Suitcase carry','Suitcase carry right':'Suitcase carry',
  'OH carry':'Overhead carry','OH carry left':'Overhead carry','OH carry right':'Overhead carry',
  'Kettlebell overhead carry':'Overhead carry','Kettlebell overhead carry left':'Overhead carry',
  'Kettlebell overhead carry right':'Overhead carry',
  'Farmer carry (KBs)':'Farmer carry','Farmer carry (heavy)':'Farmer carry',
  'Farmer carry (heavy KBs)':'Farmer carry','Farmer carry (max)':'Farmer carry',
  // Q-A/Q-B (V177, concurred): both of these are ONE-HAND carries that were folding into
  // the two-hand thread — the exact error the three-movement split exists to prevent.
  "Single-arm farmer's carry":'Suitcase carry','Farmer carry relay':'Suitcase carry',
  'Barbell bench':'Barbell bench press','Barbell back squat':'Back squat',
  'Kettlebell swings':'Kettlebell swing','Light Kettlebell swings':'Kettlebell swing',
  'Kettlebell swings (both)':'Double kettlebell swing',
  'Single-leg Kettlebell deadlift':'Kettlebell single-leg deadlift',
  'Romanian deadlift (DB)':'Dumbbell Romanian deadlift','Bird dog':'Bird dogs',
  'Nordic hamstring curl (partner/anchor)':'Nordic hamstring curl (anchored)',
  'Resistance band pull-apart':'Band pull-apart','Pushups slow tempo':'Pushups (slow tempo)',
  // ── V151 SCRUB ── every pair below is ONE movement that lived under two store keys,
  // so a load logged under one spelling never reached the other's history. Same V113
  // pattern: resolve at key time, migrate nothing here (foldExAliasKeys heals old rows).
  'Dumbbell flat press':'Dumbbell bench press',
  'Close-grip bench':'Close-grip bench press',
  'Conventional deadlift':'Deadlift',
  'Ab wheel':'Ab wheel rollouts','Plank':'Plank hold','Hip 90/90':'Hip 90/90 stretch',
  // Circuit-spec names keep their round/count structure on the CARD, but the load and
  // reps belong to the base movement's single history thread.
  '10 ball slams':'Ball slams','20 broad jumps':'Broad jumps','30 chinups':'Chinups',
  '40 pushups':'Pushups','50 Kettlebell swings':'Kettlebell swing',
  'Round 1: Kettlebell swings':'Kettlebell swing','Round 2: Pushups':'Pushups',
  'Round 3: Jump squats':'Jump squats','Round 4: Mountain climbers':'Mountain climbers',
  'Even min: Pushups':'Pushups','Odd min: Kettlebell swings':'Kettlebell swing',
  'Min 1,4,7,10,13,16,19: Deadlift':'Deadlift',
  'Min 2,5,8,11,14,17,20: Barbell bench':'Barbell bench press',
  'Min 3,6,9,12,15,18: Kettlebell swings':'Kettlebell swing',
  // Defensive: spellings nothing emits today, mapped now so a future literal cannot
  // silently split these histories ('Back squat' precedent: bare name is canonical).
  'Barbell incline press':'Incline barbell press','Barbell incline bench press':'Incline barbell press',
  'Barbell front squat':'Front squat'
};
function _exSlugRaw(n: string | null | undefined): string{return String(n||'').toLowerCase().replace(/[^a-z0-9]/g,'_');}
const EX_KEY_ALIAS: Record<string, string>=(function(){const m=Object.create(null);
  for(const o in EX_RENAMED_V113) m[_exSlugRaw(o)]=_exSlugRaw(EX_RENAMED_V113[o]);
  return m;})();
// The ONLY place a name becomes a store key. Three call sites used to inline this slug;
// two writers agreeing today is two writers free to disagree later.
function exStoreKey(name: string | null | undefined): string{const k=_exSlugRaw(name);return EX_KEY_ALIAS[k]||k;}
// Canonical DISPLAY name per store key, derived from the SAME map (single source):
// the value side of every rename is, by construction, the name today's cards speak.
const EX_CANON_NAME: Record<string, string>=(function(){const m=Object.create(null);
  for(const o in EX_RENAMED_V113){const v=EX_RENAMED_V113[o];m[_exSlugRaw(v)]=v;}
  return m;})();
// One-time (lazy, idempotent) heal of ia_exw_: rows logged under a pre-rename spelling
// kept their OLD key forever — exStoreKey only fixes NEW writes — so the Progress page
// showed the same movement as two rows (a flat-press 70 lb thread next to a fresh
// bench-press thread). Folds old-key rows into the canonical key, orders the
// merged entries, and stamps the canonical name so the row label matches today's cards.
// Runs at init and before the Progress charts; a folded store is a no-op on re-entry.
function foldExAliasKeys(store: Record<string, ExWeightRow>): boolean{
  let changed=false;
  Object.keys(store).forEach(k0=>{
    const k=EX_KEY_ALIAS[k0]; if(!k||k===k0) return;
    const src=store[k0]||{};
    if(!store[k]) store[k]={name:src.name||'',entries:[]};
    store[k].entries=(store[k].entries||[]).concat(src.entries||[]);
    store[k].entries.sort(function(a,b){return (+a.week-+b.week)||((a.ts||0)-(b.ts||0));});
    delete store[k0]; changed=true;
  });
  // Name stamp is unconditional: a row can sit on the canonical KEY while carrying a
  // first-writer spelling ('Bulgarian split squat' logged pre-V113 resolves to the
  // canonical key at write time but keeps the old label until stamped here).
  Object.keys(store).forEach(k=>{
    if(EX_CANON_NAME[k]&&store[k]&&store[k].name!==EX_CANON_NAME[k]){store[k].name=EX_CANON_NAME[k];changed=true;}
  });
  return changed;
}
function seededRand(seed: number): number{let x=Math.sin(seed+1)*10000;return x-Math.floor(x);}
// ── SWAP UNIVERSE ────────────────────────────────────────────────────────────
// Every candidate the swap sheet may offer has to be legal for THIS athlete:
// right equipment tier, right age bias, past the injury filter. All of that logic
// already lives inside buildSections, spread across ~24 pool expressions that gate
// on hasBarbell / hasCables / isBW / olderHyp. Re-deriving it at swap time with a
// name regex would be a second source of truth that drifts the moment a pool moves.
//
// Instead: every pool in the engine reaches the athlete through pick(). Registering
// the input array here harvests the complete legal universe as a side effect of
// generation, for free, and it can never disagree with what the engine would pick.
// Accumulates across all roles and weeks of one build, so by the time buildProgram
// returns it holds every exercise this athlete could legitimately be given.
var _SWAP_UNIVERSE: Record<string, 1> | null=null;
function _swapUniverseReset(): void{_SWAP_UNIVERSE=Object.create(null);}
function _swapUniverseAdd(arr: readonly unknown[] | null | undefined): void{
  if(!_SWAP_UNIVERSE||!Array.isArray(arr)) return;
  for(var i=0;i<arr.length;i++){var n=arr[i];if(typeof n==='string'&&n)_SWAP_UNIVERSE[n]=1;}
}
function _swapUniverseList(): string[]{return _SWAP_UNIVERSE?Object.keys(_SWAP_UNIVERSE):[];}
function pick<T>(arr: readonly T[],n: number,seed: number): T[]{_swapUniverseAdd(arr);const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(seededRand(seed+i)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,n);}
// Lifting focus maps to internal goal for wave/exercise selection
const LIFTING_FOCUS_TO_GOAL: Record<string, Goal> = {
  strength: 'strength',
  hypertrophy: 'hypertrophy',
  fatloss: 'fatloss',
  balanced: 'balanced',
  support_strength: 'athletic',
  support_athletic: 'athletic',
  support_prevention: 'endurance',
};
// Experience-based 1RM defaults — conservative estimates
const DEFAULT_1RM: Record<Experience, Record<TestLift, number>> = {
  beginner:    {bench:65,  squat:75,  deadlift:95},   // conservative untrained estimates (single source of truth)
  intermediate:{bench:135, squat:155, deadlift:185},  // been at it a while, consistent
  advanced:    {bench:225, squat:275, deadlift:315},  // solid lifter, knows the movements
};

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  DEFAULT_1RM, EXLIB, EX_KEY_ALIAS, EX_RENAMED_V113, LIFTING_FOCUS_TO_GOAL, REP_AFFINITY, _carryRx, _expOK,
  _isOneArmPress, _ssLegal, _ssPair, _ssPartnerOf, _stationClass, _swapUniverseAdd, _swapUniverseList,
  _swapUniverseReset, exStoreKey, foldExAliasKeys, pick, seededRand,
};
