import { _gearLens } from './prehab.ts';
import { _pattern } from './region-caps.ts';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
import type { Cfg, InjuryTier, Item, Section } from '../domain/index.ts';

/** What an injury does to a build (injuryPlan): the patterns dropped and capped, the names dropped and swapped, the flags. */
export interface InjuryPlan {
  region: string;
  tier: InjuryTier | 'halfstep';
  /** Patterns (_pattern) removed outright. */
  drop: Set<string>;
  /** Patterns clamped to RPE 7. */
  cap: Set<string>;
  dropNames: RegExp | null;
  swapNames: Record<string, string> | null;
  noJumps: boolean;
  noCarry: boolean;
  spineSafeCore: boolean;
  /** How the cardio bends: 'halfstep', 'noimpact', 'noimpact_swim', 'easy', 'reduce', 'swimout', or null for no change. */
  cardioMode: string | null;
}

// ── INJURY OVERLAY — COACHING PLAN (region × tier → engine effects) ─────────
// cfg.injury = { region, tier }. Two tiers, matching how injuries actually behave:
//   workaround — mild, warms up okay: keep the pattern, regress the variant, cap
//                affected patterns at RPE 7 (same p-clamp strength-support uses),
//                pull the pattern out of conditioning/finishers.
//   protect    — sharp, swollen, hurts at rest: pull the pattern entirely and
//                REPURPOSE the day (knee-protect leg day becomes posterior chain,
//                shoulder-protect push day becomes pull volume). The day is never
//                deleted — same slot, same habit, streak intact.
// Cardio is handled separately in engineB (injurySweepCardio): lower-limb protect
// reroutes running to time-matched non-impact work so the aerobic base and the
// progression clock survive the injury. See INJURY_OVERLAY_COACHING_SPEC.md.
const INJURY_REGIONS: Record<string, { label: string }>={
  shoulder:{label:'Shoulder'},
  elbow:{label:'Elbow / Wrist'},
  lowback:{label:'Lower Back'},
  hip:{label:'Hip / Glute'},
  knee:{label:'Knee'},
  ankle:{label:'Ankle / Foot / Shin'},
  calf:{label:'Calf'}   // v0.245.0 (D245)
};
// v0.245.0 (D245): a protected calf is a protected ankle to every reader of the ankle plan: the leg-day pools, the foot
// & ankle block standing aside, the day's title. Takes a plan or the cfg's injury; both carry region and tier.
function _ankleLike(x: { region?: string | null; tier?: string | null } | null | undefined): boolean{
  return !!x && (x.region === 'ankle' || (x.region === 'calf' && x.tier === 'protect'));
}
function injuryPlan(cfg: Cfg | null | undefined): InjuryPlan | null{
  const inj=cfg&&cfg.injury;
  if(!inj||!inj.region||!INJURY_REGIONS[inj.region]) return null;
  const T=inj.tier==='protect'?'protect':'workaround';
  const R=inj.region;
  // ── HALFSTEP (V142 / D1) — the week AFTER the bridge, cardio only ──
  // Bridge doctrine promises "full send next week" on the LIFTS, so this plan must
  // produce ZERO lifting effects: empty drop/cap, no name filters, no flags. Its only
  // job is cardioMode:'halfstep' — quality running returns at full pace, reduced dose
  // (same volume-down-intensity-held rule the taper and cutback branches follow).
  // If this block ever inherits the workaround caps, the return popup becomes a lie.
  if(inj.halfstep){
    return {region:R,tier:'halfstep',drop:new Set(),cap:new Set(),dropNames:null,swapNames:null,
            noJumps:false,noCarry:false,spineSafeCore:false,cardioMode:'halfstep'};
  }
  // drop: patterns removed outright. cap: patterns clamped to RPE 7 (scheme p-clamp
  // for wave lifts, appended coach note for fixed-detail accessories). dropNames:
  // name-level safety net for movements the pattern axis can't isolate. swapNames:
  // in-place variant swaps (workaround tiers). Flags: noJumps kills jump/plyo
  // conditioning, noCarry kills loaded carries, spineSafeCore swaps flexion/hanging
  // core for McGill-style anti-extension/anti-rotation work.
  const P: InjuryPlan={region:R,tier:T,drop:new Set(),cap:new Set(),dropNames:null,swapNames:null,
           noJumps:false,noCarry:false,spineSafeCore:false,cardioMode:null};
  if(R==='knee'){
    P.noJumps=true;
    if(T==='protect'){
      P.drop=new Set(['squat','lunge','leg_iso']);
      P.cap=new Set(['hinge']);
      // Loaded knee flexion under high eccentric tension flares an angry knee even
      // though the pattern reads hamstring — Nordic/GHR sit out in protect. Knee-cap
      // isometrics (wall sit, Spanish squat, TKE) are quad loading and sit out too.
      // D239: so does the split-squat heel-raise hold, and the Cossack shift's deep knee bend.
      P.dropNames=/nordic|glute-ham|\bghr\b|wall sit|spanish squat|terminal knee|knee extension|pistol|cossack|heel-raise hold/i;
      P.cardioMode='noimpact';
    } else {
      P.cap=new Set(['squat','lunge','leg_iso']);
      P.cardioMode='easy';
    }
  } else if(R==='ankle'){
    P.noJumps=true;
    if(T==='protect'){
      P.drop=new Set(['calf_iso','lunge']);
      P.cap=new Set(['squat']);
      P.dropNames=/pistol|single-leg squat|skater|bounds|high knees/i;
      P.cardioMode='noimpact';
    } else {
      P.drop=new Set(['calf_iso']);
      P.cap=new Set(['squat','lunge']);
      P.cardioMode='reduce';
    }
  } else if(R==='calf'){
    // v0.245.0 (D245, Mario): a fried or strained calf. Working around it, every calf raise and every jump sits out and
    // every run goes easy and shorter (the reduce sweep, strides with them). calf_iso is every loaded raise's pattern; the
    // soleus raise, the heel-raise hold and tiptoe walks load the calf too but are prehab-exempt from the pattern, so
    // they go by name, before the foot & ankle draw. The tibialis raises and the dorsiflexion and ankle drills stay.
    // Protected, it is the ankle plan, line for line, and _ankleLike carries it to the ankle plan's other readers.
    P.noJumps=true;
    if(T==='protect'){
      P.drop=new Set(['calf_iso','lunge']);
      P.cap=new Set(['squat']);
      P.dropNames=/pistol|single-leg squat|skater|bounds|high knees/i;
      P.cardioMode='noimpact';
    } else {
      P.drop=new Set(['calf_iso']);
      P.dropNames=/soleus raise|heel-raise hold|tiptoe walk/i;
      P.cardioMode='reduce';
    }
  } else if(R==='hip'){
    if(T==='protect'){
      P.drop=new Set(['hinge','lunge','hip_ext']);
      P.cap=new Set(['squat']);
      // D239: the prehab block's adductor plank, end-range Cossack and bridge hold sit out with hip extension.
      P.dropNames=/swing|pull-through|pull through|copenhagen|cossack|glute bridge hold|hip flexor raise/i;
      P.cardioMode='noimpact_swim';
    } else {
      P.cap=new Set(['hinge','lunge','hip_ext','squat']);
      // D239: the adductor is the likeliest injured tissue in a hip plan, so the Copenhagen sits out here too.
      P.dropNames=/swing|copenhagen/i;
      P.cardioMode='easy';
    }
  } else if(R==='lowback'){
    P.noCarry=true; P.spineSafeCore=true;
    if(T==='protect'){
      P.drop=new Set(['hinge','row']);
      // hip_ext is capped, not dropped: the pool override below REPLACES the deadlift
      // with hip extension, so this is the pattern the day now leans on. Leaving it
      // uncapped let the substitute run at full wave intensity — the one lift chosen
      // for being spine-neutral was the only lift not clamped.
      P.cap=new Set(['squat','hip_ext']);
      // V192 (D42): the landmine rotational press is dropped by NAME here. Its pattern
      // is 'hpress', which this plan neither drops nor caps, so pattern gives a low
      // back no protection at all. And a generated caption cannot guarantee the
      // athlete rotates from the hip rather than the lumbar spine. Matches
      // 'landmine rotational', which does not touch 'Landmine rotations' (no 'al')
      // or 'Landmine reverse lunge'.
      P.dropNames=/good morning|swing|deadlift|pendlay|back extension|hyperextension|pull-through|pull through|landmine rotational|barbell reverse lunge/i;   // D241: a back-racked lunge sits out (the flexion drills swap, below)
      P.cardioMode='noimpact_swim';
    } else {
      P.cap=new Set(['hinge','squat','row','hip_ext']);
      // V192 (D42): same reason as the protect tier above. 'hpress' is uncapped here
      // too, so the only lever that reaches this movement is the name.
      P.dropNames=/good morning|swing|pendlay|landmine rotational|barbell reverse lunge/i;
      P.cardioMode='easy';
    }
  } else if(R==='shoulder'){
    if(T==='protect'){
      // delt_iso is NOT dropped wholesale. Face pulls and rear delt work are the
      // scapular-retraction drills a protect-tier shoulder needs MOST; dropping the
      // whole pattern took them with it, so the more injured athlete lost the one
      // thing that helps. The provocative members are dropped BY NAME instead:
      // loaded abduction through ~60-120 degrees is the impingement arc.
      // Ab wheel and hanging work are named too — _pattern() returns null for core,
      // so P.drop can never reach them, and both load an irritated shoulder hard.
      P.drop=new Set(['hpress','vpress','tri_iso']);
      P.dropNames=/\bdips\b|bench dips|lateral raise|front raise|ab wheel|hanging|l-sit|dragon flag|hollow hold dumbbell press|wall-press dead bug/i;   // D241
      P.cardioMode='swimout';
    } else {
      P.cap=new Set(['hpress','vpress','delt_iso']);
      // Overhead range, dips, and front raises out; face pulls and rear delt work
      // STAY — scapular retraction is the drill that helps a cranky shoulder.
      // Lateral raise out, front raise stays. The previous list had this backwards:
      // loaded abduction is the impingement arc, while a front raise in the scapular
      // plane is generally tolerated. Face pulls and rear delt work stay either way.
      P.dropNames=/overhead|arnold|push press|military|pike pushup|pike pushups|handstand|wall walk|\bdips\b|bench dips|lateral raise|shoulder press|plyo push|hollow hold dumbbell press/i;   // D241
      // V192 (D43): the workaround tier's job is to substitute, not just subtract.
      // The floor stops the elbow at torso depth — the impingement-adjacent range
      // the dropNames above already avoid. Runs after dropNames, so nothing here
      // resurrects a dropped name. The hpress cap adds RPE 7 on top.
      P.swapNames={'Dumbbell bench press':'Dumbbell floor press'};
      P.cardioMode='swimout';
    }
  } else if(R==='elbow'){
    P.noCarry=true;
    if(T==='protect'){
      P.drop=new Set(['tri_iso','bi_iso','hpress','vpress']);
      P.cap=new Set(['row','vpull']);
      P.dropNames=/\bdips\b|bench dips|skullcrush|hollow hold dumbbell press|wall-press dead bug/i;   // D241
    } else {
      // V185 (D2-c): vpull added. D2 moved pulldowns off 'row', which would have handed a
      // cranky elbow an UNCAPPED lat pulldown. Chinups were already uncapped here, so this
      // is an existing gap the reclassification exposed rather than one it created: loaded
      // elbow flexion is loaded elbow flexion whichever direction you pull.
      P.cap=new Set(['hpress','tri_iso','bi_iso','row','vpull']);
      P.dropNames=/\bdips\b|bench dips|plyo push|hollow hold dumbbell press/i;   // D241
      P.swapNames={'Dumbbell skullcrushers':'Cable pushdown','Barbell curl':'Dumbbell hammer curl','Preacher curl':'Cable curl'};
    }
  }
  // V210 (2b): the front rack is withheld under every shoulder and elbow plan. The draw never
  // deals it (buildProgram's squat pool); this is the name-level net the swap sheet's injury
  // test (_swapInjuryOK) reads, and it catches any path that reaches a card without that pool.
  if(R==='shoulder'||R==='elbow') P.dropNames=new RegExp((P.dropNames?P.dropNames.source+'|':'')+'^front squat$','i');
  return P;
}
// Section post-filter — runs AFTER buildSections, BEFORE capRegionalFatigue, so the
// repurposed day still gets trimmed sanely by the existing load manager. Drops by
// pattern and by name, swaps variants, appends the RPE 7 coach note to fixed-detail
// accessories on capped patterns (wave lifts are clamped inside scheme() instead,
// so their printed RPE is already correct and gets no note).
function _injViewName(n: string,cfg: Cfg | null | undefined): string{ if(!cfg||!cfg.injury) return n; const P=injuryPlan(cfg); if(!P||!P.swapNames||!P.swapNames[n]) return n; const g=_gearLens((cfg&&cfg.equipment)||'home_full'); if(!g(n)) return n; const to=P.swapNames[n]; const FB: Record<string, string>={'Cable pushdown':'Close-grip pushups'}; return g(to)?to:(FB[to]||to); }
// V227 D190 P-SWAPSEAM (R2): the plan's cap cue is one literal, read by the appender in applyInjuryFilter and by
// the stripper both swap hops run before _swapDetailFor, so the carry never sees it and the filter alone writes it.
// V228 D193 P-CAPRPE R1 (split, Mario round 2): the cue says three, rpeFromWave's rir at RPE 7 and _bwSetsFromDetail's RPE 7 line.
const INJ_CAP_CUE=' — hold RPE 7, three in the tank';
// V229 D193 P-CAPRPE (Amendment 3 section 2, V229 siting): the strength test-week text is one top-level string, read by
// _testRx in the build and returned by the stripper below; INJ_HELD_TEST is R7's text (D193-HELDTEST): a held pattern
// does not test. The filter writes it on a capped Main; the stripper reads beneath it, so it appears only on a held lift.
const TEST_RX_TEXT='Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const INJ_HELD_TEST='Work up to one working set of 3 to 5 reps at RPE 7. Technique stays crisp. No grinding. Log the weight and the reps. Your injury plan holds this lift, so there is no new baseline here.';
// V228 D193 P-CAPRPE (R4): the stripper recognises the cue by shape, not by today's spelling: V227 stored 'two in the
// tank', V228 writes 'three'. One regex, both wordings, no constant to expire; every other detail comes back unchanged.
// V229 D193 (Amendment 3 section 2): it also reads beneath R7's held-test text, matched by shape (its fixed clauses, the
// RPE number free) and returned as TEST_RX_TEXT. The test text itself and every non-cue detail still come back unchanged.
function _stripCapCue<T>(d: T): T | string{ if(typeof d!=='string') return d; if(/^Work up to one working set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/.test(d)) return TEST_RX_TEXT; const m=/ — hold RPE 7, (?:two|three) in the tank$/.exec(d); return m?d.slice(0,m.index):d; }
// V229 D193 P-CAPRPE (R2, R7): on a capped pattern a named RPE above 7 (a range by its top) is held at 7, and the reserve
// gloss it carried is restated by the file's own RPE 7 line for that shape: bwsets (_bwSetsFromDetail's RPE 7 branch),
// wave (rpeFromWave at 7, rir 3), loadCapped (scheme()'s _effEase line). The @ RPE grammar never glosses and gets none.
// R7 (D193-HELDTEST), checked first: a detail of the strength test's shape (TEST_RX_TEXT, any RPE number) becomes
// INJ_HELD_TEST, the hold in words. Any other detail at or under 7 comes back byte-identical. Read only by
// applyInjuryFilter, the plan's single writer (D190).
function _capRpeClamp<T>(d: T): T | string{
  if(typeof d!=='string') return d;
  if(/^Work up to one heavy set of 3 to 5 reps at RPE [\d.]+\. Technique stays crisp\. No grinding\. Log the weight and the reps\. That set is your new baseline\.$/.test(d)) return INJ_HELD_TEST;
  return d.replace(/RPE\s*(\d+(?:\.\d+)?)(?:[–-](\d+(?:\.\d+)?))?\+?( \((?:stop 2 reps short of failure|leave ~\d+ reps? in reserve|heaviest pair you can find)\))?/g,function(t,lo,hi,g){
    if(!(Math.max(+lo,hi?+hi:0)>7)) return t;
    if(!g) return 'RPE 7';
    return 'RPE 7'+(/^ \(stop/.test(g)?' (leave 3 or more in reserve)':/^ \(heaviest/.test(g)?' (leave ~3 in reserve)':' (leave ~3 reps in reserve)');
  });
}
function applyInjuryFilter(sections: Section[],cfg: Cfg | null | undefined): Section[]{
  const P=injuryPlan(cfg);
  if(!P||!Array.isArray(sections)) return sections;
  // D241 A2: the new flexion and twist drills swap to spine-safe ones the way the hanging raises do, so a lowback core block keeps its count.
  const SPINE_SWAP: Record<string, string | null>={'Ab wheel rollouts':'Dead bugs','Hanging knee raises':'Bird dogs','L-sit hold':'Plank hold','L-sit chinups':null,'Hanging leg raises':'Bird dogs','Overhead sit-up':'Dead bugs','V-ups':'Bird dogs','Russian twist (heels down)':'Standing torso rotations (slow)'};
  const JUMPS=/jump|burpee|broad|bound|box jump|high knees|tuck/i;
  const out: Section[]=[];
  sections.forEach(s=>{
    if(!s||!Array.isArray(s.items)){out.push(s);return;}
    const seen=new Set();
    const items: Item[]=[];
    // Section-local copy of the heading. Rewritten below when a swap renames the
    // item the heading names; s itself is never mutated (this pass runs several
    // times per day and must stay idempotent).
    let label=s.label;
    s.items.forEach(it=>{
      if(!it||!it.name) return;
      let name=it.name, detail=it.detail;
      const pat=_pattern(name);
      if(pat&&P.drop.has(pat)) return;
      if(P.dropNames&&P.dropNames.test(name)) return;
      if(P.noJumps&&JUMPS.test(name)) return;
      if(P.noCarry&&/carry|farmer march/i.test(name)) return;   // D241: a farmer march is a carry in place
      if(P.spineSafeCore&&Object.prototype.hasOwnProperty.call(SPINE_SWAP,name)){
        const sw=SPINE_SWAP[name];
        if(!sw) return;
        name=sw; detail=it.detail;
      }
      // V216 (D154): the swap reads the build's gear lens (_gearLens, the predicate the pools use).
      // A source the tier does not own is not renamed: bodyweightSweep converts it exactly as
      // before. A target the tier does not own falls to its family's gear legal member, so the
      // swap the copy promises still lands. A target with no fallback row renames as it always did.
      if(P.swapNames&&P.swapNames[name]){
        const _gOK=_gearLens((cfg&&cfg.equipment)||'home_full');
        const SWAP_GEAR_FALLBACK: Record<string, string>={'Cable pushdown':'Close-grip pushups'};
        if(_gOK(name)){ const to=P.swapNames[name]; name=_gOK(to)?to:(SWAP_GEAR_FALLBACK[to]||to); }
      }
      if(pat&&P.cap.has(pat)&&detail) detail=/RPE/.test(detail)?_capRpeClamp(detail):detail+INJ_CAP_CUE;   // V229 D193 (R2, R7)
      if(seen.has(name)) return;  // swaps can collide with an existing pick
      seen.add(name);
      // Labels embed the drawn movement ('Main — Dumbbell bench press'), so a
      // swapped item used to leave the heading naming a lift the athlete is not
      // prescribed — and on the no-gear tier, naming a dumbbell he does not own.
      // §10b: a conditional write with no else branch is a latch. The claim belongs
      // to the item, so the heading follows the item it describes. Covers both
      // rename paths above (P.swapNames and SPINE_SWAP); applied only once the item
      // survives, and only after the collision check, so a dropped swap leaves the
      // heading alone. bodyweightSweep runs the same sync for its substitutions.
      if(name!==it.name && label && label.indexOf(it.name)>=0) label=label.split(it.name).join(name);
      items.push({...it,name,detail});
    });
    if(items.length) out.push(label===s.label?{...s,items}:{...s,label,items});
  });
  return out;
}
// Repurposed-day titles for protect tier — the athlete should read intent, not a
// gutted card. Returns null when the standard title stands.
function injuryDayTitle(role: string,cfg: Cfg | null | undefined): string | null{
  const P=injuryPlan(cfg);
  if(!P||P.tier!=='protect') return null;
  if(role==='legs'){
    if(P.region==='knee'||_ankleLike(P)) return 'Posterior Chain';   // v0.245.0 (D245): a protected calf too
    if(P.region==='hip') return 'Legs (hip-safe)';
    if(P.region==='lowback') return 'Legs (spine-safe)';
  }
  // 'Pull Volume' described a day that no longer exists. The pressing day is now a
  // rehab + trunk day for both protect-tier upper-limb plans.
  if((role==='push'||role==='push_light')&&(P.region==='shoulder'||P.region==='elbow')) return 'Rehab + Trunk';
  return null;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  INJURY_REGIONS, TEST_RX_TEXT, _ankleLike, _injViewName, _stripCapCue, applyInjuryFilter, injuryDayTitle, injuryPlan,
};
