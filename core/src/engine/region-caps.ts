
import type { Cardio, Equipment } from '../domain/index.ts';

/** A day's training region, as the regional caps count it; core and grip are tagged and never capped. */
export type Region = 'push' | 'pull' | 'legs' | 'core' | 'grip';
/** A fatiguing movement pattern (_pattern); holds, carries, core, ballistic and conditioning work have none. */
export type Pattern = 'vpull' | 'hpress' | 'vpress' | 'row' | 'hinge' | 'hip_ext' | 'lunge' | 'squat' | 'leg_iso' | 'calf_iso' | 'bi_iso' | 'tri_iso' | 'delt_iso';
/** The swap sheet's like-for-like family for an accessory with no pattern (V162). */
export type AuxFamily = 'core' | 'carry' | 'power' | 'cond' | 'hold' | 'chest_iso';
/** A rep window [lo, hi]; [0, 0] is unloadable (reps emerge from the effort prescribed). */
export type RepWindow = [number, number];
// ── REGIONAL FATIGUE CAP ────────────────────────────────────────────────────
// Within-day guard against same-region volume stacking. deconflictSameRegion
// spaces press/leg days ACROSS the week; this caps the load WITHIN a single day.
// A dense push day stacks main bench + two press supersets + delts — three or
// four press-pattern movements on one date — and an impact run layered on top
// adds interference. Doctrine (2020 PTG / SEAL PFG) wants recovery headroom per
// region, not raw movement count; a leg day with squat+lunge+hinge+calf is four
// movements but distinct sub-patterns and stays fine. So we score PER REGION.
//
// Pure: takes the built sections + day context, returns a trimmed COPY. No
// upstream mutation, deterministic (pure function of rendered sections), so the
// same trim fires identically every week of a block — no random-looking drops.
//
// Action on overflow (Mario rulings): silent HARD trim, no user note; core is
// scored but NEVER trimmed; cardio always survives; item-level trim drops only
// the same-region movement from a mixed superset (wall sit on a press superset
// survives — we punish the redundant press, not the off-region hold).
const REGION_CEILING: Record<string, number> = { push: 18, pull: 20, legs: 16 }; // tuned to measured saturation scores: a clean leg day (~12) passes; a stacked press day (~26–29) trims back toward main + one secondary press + delts
const _ceil: (r: string) => number = r => REGION_CEILING[r] || 18;

// ── HARD DAILY WORKING-SET CAP (per region, per single session) ──
// Second, INDEPENDENT guard alongside REGION_CEILING. The ceiling scores PATTERN
// SATURATION (same-pattern repeats), so it is blind to distinct-pattern bloat: a legs
// day of squat + hinge + lunge + split squat + leg-iso is five CLEAN patterns — the
// saturation score never fires — yet five loaded leg movements is still junk volume for
// one day. This cap reads the RAW working-set tally per region and forces a trim once a
// muscle group blows past a sane single-session ceiling, regardless of pattern variety.
// Non-hypertrophy only (hypertrophy is exempt upstream — it opts into the volume).
const REGION_SET_CAP: Record<string, number> = { push: 15, pull: 16, legs: 14 }; // per-region, per-DAY working-set ceiling (pull tolerates most; legs least, esp. under concurrent running)
const _setCap: (r: string) => number = r => REGION_SET_CAP[r] || 14;

// ── DISTINCT-MOVEMENT CAP (per region, per single session) ──
// Third guard. The set cap governs VOLUME; this governs SPRAWL — how many distinct loaded
// exercises a region gets in one day, independent of set count. A complete leg day is a
// squat + a hinge + ONE single-leg + calves (4). A 5th leg movement is near-always a
// redundant second single-leg or quad accessory — variety for its own sake, bought with
// fatigue / warm-up / CNS cost for almost no extra stimulus. Push/pull tolerate one more
// angle (5). Counts ONLY pattern-bearing lifting items — CORE, HIP-mobility, carries and
// holds are pattern-null / off-region, so they are NEVER counted here nor eligible to trim.
const REGION_MOVE_CAP: Record<string, number> = { push: 5, pull: 5, legs: 4 };
const _moveCap: (r: string) => number = r => REGION_MOVE_CAP[r] || 5;

// ── DYNAMIC CARDIO INTERFERENCE ──
// A shared-day cardio session steals recovery from that day's lifting. The old model
// added a FLAT +3 to every region for ANY run — blind to whether it was a 2 mi Zone-2
// shakeout or 10×800m at Zone 5, and it ignored bike/swim entirely. This scales the
// surcharge by (1) modality impact on the LEGS (run pounds > bike fatigues > swim ~free),
// (2) session intensity token-scanned from subtype+detail so it survives every naming
// scheme (run / NRC / bike), and (3) distance/duration. Returns a leg-recovery
// interference magnitude ≈0.3 (easy spin) … ≈1.6 (hard or long run).
function _cardioInterference(cardio: { type: string; subtype?: string; detail?: string; dose?: { key?: string } } | null | undefined): number{
  if(!cardio || !cardio.type) return 0;
  const sub = (cardio.subtype||'').toLowerCase();
  const s = (sub + ' ' + (cardio.detail||'')).toLowerCase();
  // Modality impact on leg recovery.
  const base = cardio.type==='run' ? 1.0 : cardio.type==='bike' ? 0.5 : 0.15;
  // Intensity (token scan; first match wins, hardest first). V176 (D8): the SUBTYPE names
  // the session, so it classifies FIRST — an NRC "Long Run" whose detail reads "average
  // Recovery Pace" is a long run, not a recovery run. The combined string only decides
  // when the subtype says nothing (a Benchmark Run's "steady" lives in its detail).
  const _sc: (t: string) => number | null = t => {
    if(/interval|\bint\b|speed run|sprint|stride|zone 5|400m|800m|max effort|rpe 9/.test(t)) return 1.4;   // hard quality
    if(/tempo pace|threshold|\bchi\b|fartlek|\bhills?\b|zone 3|zone 4|rpe 8/.test(t))        return 1.05;  // threshold (NOTE: 'tempo pace', not bare 'tempo' — easy-run copy says "not a tempo")
    if(/recovery|active recovery|zone 1|shakeout|very easy|\beasy\b/.test(t))                return 0.55;  // easy/recovery
    if(/long run|peak|long slow|\blsd\b|steady|zone 2/.test(t))                              return 0.85;  // long steady
    return null;
  };
  // D103a (V208): a keyed NSW interval or CHI reads its key, so a renamed label cannot move
  // it. Every other key falls through to the scan: keying long or easy here is unruled.
  const _k = cardio.dose && cardio.dose.key;
  let inten = _k === 'int' ? 1.4 : _k === 'chi' ? 1.05 : _sc(sub);
  if(inten == null) inten = _sc(s);
  if(inten == null) inten = 0.75;   // unlabelled default
  // Distance/duration: miles past 3, or minutes past 45, add a little leg fatigue.
  const mi  = parseFloat((s.match(/([\d.]+)\s*(?:mi\b|mile)/)||[])[1]) || 0;
  const min = parseFloat((s.match(/([\d.]+)[\s-]*min/)||[])[1]) || 0;   // V176 (D8): reads '60-minute'
  const distBump = mi > 3 ? Math.min(0.5, (mi-3)*0.08)
                 : min > 45 ? Math.min(0.5, (min-45)*0.01)
                 : 0;
  return +(base * inten + distBump).toFixed(2);
}
// Section-label → region. Labels are deterministic from buildSections regardless
// of which exercise pick() rotates in, so tagging off the label is stable.
function _sectionRegion(label: string | null | undefined, role: string | null | undefined): Region | null{
  const L = (label||'').toLowerCase();
  if(/core|anti-rotation|plank|pallof|dynamic core/.test(L)) return 'core';
  if(/carry/.test(L)) return 'grip';
  if(/taper|primer|active recovery|mobility/.test(L)) return null; // exempt
  // "Main — X" / "Secondary compound — X" / "Strength" / "Power" carry the exercise name in the
  // label, but the day's ROLE is the reliable region for them (a pull day's main is a deadlift,
  // a legs day's main is a squat — both contain words that would otherwise cross-match). Trust role.
  if(/^main\b|^secondary|^strength\b|^power\b|^primer\b/.test(L)){
    if(role==='pull') return 'pull';
    if(role==='legs') return 'legs';
    if(role==='push'||role==='push_light') return 'push';
    return null; // full/active
  }
  // Accessory/superset/isolation labels: tag by the muscle word in the label. Legs first so
  // "back squat"-style labels never get caught by the generic "back" → pull rule.
  if(/squat|lunge|hinge|calf|calves|glute|deadlift|romanian|leg press|leg extension|leg curl|step-up|good morning|leg superset|leg isolation/.test(L)) return 'legs';
  if(/pull|back\b|bicep|row|chinup|pullup|lat\b/.test(L)) return 'pull';
  if(/chest|press|delt|tricep|shoulder|push|pump/.test(L)) return 'push';
  // Generic labels (Main —, Secondary compound —, Accessory, Conditioning, Power, Strength) fall to role.
  if(role==='pull') return 'pull';
  if(role==='legs') return 'legs';
  if(role==='push'||role==='push_light') return 'push';
  return null; // full/active — mixed by design, not the stacking failure mode we're capping
}
// Per-item cost: compound 1.5, isolation 0.75, default 1.0, scaled by set count
// parsed off the leading "N×..." of the detail string. Off-region items in a
// mixed superset (e.g. wall sit) contribute to THEIR region, not the host's.
function _itemRegion(name: string | null | undefined): Region | null{
  const N=(name||'').toLowerCase();
  if(/wall sit|spanish squat|goblet|terminal knee|knee extension/.test(N)) return 'legs';
  if(/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation/.test(N)) return 'core';
  return null; // null = inherits the section's region
}
// ── UNILATERAL ROW ───────────────────────────────────────────────────────────
// Deliberately scoped to ROWS, not to unilateral work in general. The pull day runs
// TWO row slots off one pool and the second slot's prescription hardcodes "each" —
// so the only question this has to answer is "is this row worked one side at a
// time", and a wider _isUnilateral() would have to be right about lunges, presses
// and carries as well to earn its name. When a second call site appears, widen it
// then, with that call site's cases in front of us.
//
// `Dumbbell row` and `Kettlebell row` are BARE by the library's own naming
// convention (V113): the unqualified name is the standard variant, and the standard
// variant of both is the bench-supported single-arm row. _REP_FLOOR already reads
// them that way — its /\brow\b/ entry is commented "DB / KB single-arm row —
// position-limited". This is the same call, written down once.
const _UNILAT_ROW=/\bsingle-?arm\b|\bone-?arm\b|^dumbbell row$|^kettlebell row$/i;
function _isUnilateralRow(name: string | null | undefined): boolean{ return _UNILAT_ROW.test(String(name||'').trim()); }
// MOVEMENT PATTERN — the real axis. The unsafe failure mode is saturating ONE
// pattern (press, press, press), not accumulating DISTINCT patterns (squat,
// hinge, lunge). So we count per-pattern, and each extra rep of the same pattern
// costs escalating fatigue while a new pattern starts cheap.
function _pattern(name: string | null | undefined): Pattern | null{
  const N=(name||'').toLowerCase();
  if(/wall sit|spanish squat|terminal knee/.test(N)) return null;        // isometric hold — not a fatiguing pattern rep
  if(/l-sit chin|l-sit pull/.test(N)) return 'vpull';                    // V162: an L-sit CHINUP is a vertical pull with a core hold riding along. The /l-sit/ token below must not eat it — same one-token-two-meanings class as the V119 incline bug.
  // V192 (D42): the landmine rotational press is a PRESS, not a rotational core drill.
  // This line sits ABOVE the core-exempt alternation below on purpose, and it is
  // exact-anchored (^...$) precisely so that placing it above costs the core drills
  // nothing: no rotational core movement can reach it. 'Landmine rotations', 'Pallof
  // press', 'Windshield wipers' and 'Thoracic rotations' all fail the exact match and
  // classify exactly as they did before this line existed. Do NOT generalise it to
  // /landmine.*press/ or /rotational press/ — that is the one-token-two-meanings trap
  // this file has paid for twice (V119 incline, V162 l-sit chinup).
  // 'hpress', not 'vpress': the bar path finishes FORWARD at chest height, not
  // overhead. V185 (D1) ruled the horizontal default of the bare /press/ catch-all
  // deliberate, and this movement is the horizontal case.
  // Without this classification the movement is _pattern-null: invisible to all three
  // region caps, and KEPT by applyInjuryFilter even at shoulder/protect.
  if(/^landmine rotational press$/.test(N)) return 'hpress';
  if(/plank|pallof|dead bug|ab wheel|bird dog|l-sit|hanging|hollow|rotation|curl-up|sit-up|v-up|russian twist|farmer march/.test(N)) return null; // core, exempt (D241 names the four new drills) // core, exempt
  // REHAB DRILLS ARE NOT REGIONAL VOLUME. Wrist/forearm and scapular work is low-load
  // corrective loading; scoring it against a ceiling misreads the day. Without this the
  // generic catch-alls below swallowed them and the injury filter then DROPPED them from
  // the very plan built to prescribe them: 'Eccentric wrist extension' matched /extension/
  // and read as triceps (dropped by the elbow plan), 'Scapular pushup' matched /pushup/ and
  // read as a press (dropped by the shoulder plan), 'McGill curl-up' matched /curl/ and
  // read as biceps.
  if(/wrist|forearm|grip squeeze|scapular|serratus/.test(N)) return null;
  // V178: hip/foot prehab and the renegade row are exempt. 'Renegade rows' would otherwise
  // score as a row; 'Standing ankle CARs' / 'soleus raise' would otherwise be invisible
  // by accident rather than by rule. Named here so the exemption is deliberate.
  // D239 (P-BENCH): the slice 1 prehab names. Three of them would otherwise be read as training
  // patterns: 'Split-squat heel-raise hold' and 'Cossack squat shift' by the /squat/ catch-all,
  // 'Glute bridge hold' by the hip_ext rule. The two new planks already left at the core line.
  if(/renegade|hip airplane|hip flexion|tibialis|dorsiflex|soleus raise|ankle car|90\/90|balance hold|pass-around|heel-raise hold|ankle rock|towel scrunch|tiptoe walk|glute bridge hold|cossack|hip flexor stretch|pigeon|hip flexor raise/.test(N)) return null;
  // Wall slides are scap/rear-delt work, not a press. Classified on introduction (V127) so
  // the movement is never invisible to capRegionalFatigue or deconflictAdjacentDupes — the
  // mistake Ball slams is still living with. Must precede the wall-walk rule: both contain
  // "wall" and wall walks are a genuine vertical press.
  // Prone Y-T-W raises and wall slides are both rear-delt / lower-trap / scap work.
  // Y-T-W returned null until V128 for a bad reason: it was the bodyweight substitute in
  // FIVE different roles (rows twice, shoulder accessory, biceps, delt isolation) plus the
  // catch-all _BW_SUBS fallback for /raise|fly|delt/, so no single pattern was right in
  // more than one of them. V128 removed it from the row and biceps lists, where it was
  // never the movement those slots needed, and only then classified it.
  if(/wall slide|y-t-w/.test(N)) return 'delt_iso';
  if(/handstand|wall walk/.test(N)) return 'vpress';                     // BW vertical press — must precede the generic pushup rule below
  // "Incline" means opposite things on a bench and on the floor. An incline BENCH press
  // angles the torso back and shifts load onto the shoulder — vertical press, correctly
  // caught by the rule below. An incline PUSHUP raises the HANDS, which makes it the
  // EASIEST horizontal press there is: the regression you give someone who cannot yet
  // press their own bodyweight off the floor. Reading it as a vertical press let it walk
  // straight through the elbow-workaround hpress cap and get prescribed at RPE 8 to an
  // athlete training around an elbow (V119). Must precede the generic incline rule.
  if(/incline/.test(N) && /push-?up/.test(N)) return 'hpress';
  if(/incline|overhead|arnold|pike|push press|shoulder press|military/.test(N) && /press|pushup/.test(N)) return 'vpress';
  // V185 (D1): presses that are overhead WITHOUT naming an overhead token. The bare
  // /press/ catch-all at the bottom of this function defaults horizontal, and every
  // real exercise that reached it was vertical \u2014 'Kettlebell single-arm press' and
  // 'Log press (Kettlebell clean + press)' were 100% of the names it caught, and it was
  // wrong on both. EXLIB.shoulder has listed the KB press next to Barbell overhead press
  // and Arnold press since the library was written; _pattern disagreed with the pool and
  // _pattern is what the swap sheet reads, so the sheet tagged it HORIZONTAL PRESS and
  // offered the bench family as 'same job'. Reported from device by Mario.
  // The catch-all is left horizontal ON PURPOSE: a future 'Floor press' reaches it and IS
  // horizontal. Name the vertical movements; do not flip the default.
  if(/\bsingle-?arm press\b|^kettlebell press$|\blog press\b/.test(N)) return 'vpress';
  if(/lateral raise|front raise|rear delt|face pull|reverse fly/.test(N)) return 'delt_iso';  // 'lateral raise', not bare 'lateral' — 'Lateral bounds' is a plyo, not shoulder volume
  // Loaded hip-extension / posterior-chain (hip thrust, glute-ham/Nordic, back extension,
  // pull-through). MUST precede the triceps 'extension' and biceps 'curl' rules below, or
  // "back extension"→tri_iso (push) and "Nordic ... curl"→bi_iso (pull) would misfire.
  if(/hip thrust|glute bridge|glute-ham|\bghr\b|nordic|back extension|hyperextension|reverse hyper|pull-through|pull through/.test(N)) return 'hip_ext';
  // LOWER-BODY MACHINES MUST PRECEDE THE GENERIC /press/ AND /curl/ CATCH-ALLS BELOW.
  // 'Leg press' matched the bare /press/ rule and scored as hpress: a leg day whose MAIN
  // lift counted against REGION_CEILING.push and was invisible to REGION_SET_CAP.legs.
  // 'Lying/Seated leg curl' matched /curl/ and scored as biceps. Neither is exotic —
  // squat_joint (older hypertrophy) and every knee/ankle/hip/lowback pool override
  // resolve the squat slot to Leg press on the commercial tier.
  if(/leg press/.test(N)) return 'squat';
  if(/leg curl|leg extension|hamstring curl/.test(N)) return 'leg_iso'; // V178: 'Standing cable hamstring curl' — without this the /curl/ catch-all read it as biceps
  if(/bench|chest press|flat press|decline press|dip|diamond|pushup/.test(N)) return 'hpress';
  if(/press/.test(N)) return 'hpress'; // remaining presses default horizontal
  if(/tricep|pushdown|skullcrush|extension/.test(N) && !/leg/.test(N)) return 'tri_iso';
  // V185 (D2-a/b): pulldowns are VERTICAL PULLS. The row test ran first and matched
  // /pulldown/, so 'lat pull' in the vpull rule below was DEAD CODE and every pulldown
  // in the app scored as a row. That was not cosmetic: lowback/protect drops the 'row'
  // pattern, and its own pool override deliberately hands that athlete
  // rowPool=['Straight-arm pulldown'] and a backCompoundPool containing 'Lat pulldown'
  // \u2014 so applyInjuryFilter deleted the exact movements the override had chosen for
  // being spine-safe, and the comment there ('a hanging vertical pull is the correct
  // main here') described the opposite of what shipped.
  // STRAIGHT-ARM PULLDOWN IS ALSO vpull (D2-b), and this is a scope call, not a
  // technique one. It is a straight-arm pullover with no elbow flexion, so it is not a
  // row in any sense a row means something \u2014 a row is horizontal and elbow-flexed.
  // What this axis measures is tissue saturation, and it loads lat-dominant shoulder
  // extension in the vertical plane, same as the lat pulldown beside it in the pool.
  // null was considered and rejected: it fills a MAIN slot on lowback/protect, and an
  // invisible main lift is the Ball slams mistake.
  // MUST PRECEDE THE ROW RULE.
  if(/pulldown|straight-arm/.test(N)) return 'vpull';
  if(/row/.test(N)) return 'row';
  if(/chinup|pullup|pull-up|chin-up|lat pull/.test(N)) return 'vpull';
  if(/curl/.test(N)) return 'bi_iso';
  if(/back squat|front squat|box squat|hack squat|leg press|goblet squat/.test(N)) return 'squat';
  if(/deadlift|romanian|good morning|swing|hinge/.test(N)) return 'hinge';
  if(/lunge|split squat|step-up|step up|step-down/.test(N)) return 'lunge';   // D241: 'Step-downs (KB)' is a lunge
  if(/leg extension|leg curl|leg iso/.test(N)) return 'leg_iso';
  if(/calf|calves/.test(N)) return 'calf_iso';
  if(/squat/.test(N)) return 'squat';
  return null;
}
// ── AUX SWAP FAMILIES (V162, ruling D3 bundle) ───────────────────────────────
// _pattern deliberately returns null for holds, carries, core, ballistic and
// conditioning work — that null keeps them OUT of regional volume accounting, and
// V162 does NOT change that. What changes is the swap sheet: these families get a
// like-for-like substitution universe of their own, SIDECAR to _pattern (the V160
// REP_AFFINITY shape), so every existing _pattern consumer stays byte-identical.
// Exact-name keyed. Composite prescription names ("Round 4: ...", "Broad jumps OR
// mountain climbers") intentionally match nothing and stay skip-only.
// Rehab drills, band correctives and stretches are intentionally ABSENT (ruling D6):
// the injury overlay prescribed those deliberately; skip is the only exit offered.
const _AUX_FAMILY: Record<string, AuxFamily>={
  'Ab wheel rollouts':'core','Bird dogs':'core','Dead bugs':'core','Dead bug (slow tempo)':'core',
  'Garhammer raises':'core','Hanging knee raises':'core','Hanging leg raises':'core','Hanging hold':'core',
  'L-sit hold':'core','McGill curl-up':'core','Pallof press':'core','Plank hold':'core','RKC plank':'core',
  'Side plank':'core','Superman':'core','Toes-to-bar':'core','Windshield wipers':'core',
  // V193 (D46): every rotational pillar member is family 'core'. Cable woodchoppers and
  // Landmine rotations were absent from this map entirely, which made them skip-only with
  // zero swap candidates. Medicine ball rotary toss read 'power', so its only swap candidates
  // were jumps and olympic derivatives: a swap out of a transverse-plane finisher converted it
  // into a jump, an exit from the pillar rather than a substitution.
  'Cable woodchoppers':'core','Landmine rotations':'core','Medicine ball rotary toss':'core',
  'Standing torso rotations (slow)':'core','Side plank thread-the-needle':'core',
  'Band woodchopper (door anchor)':'core',
  // D241 (P-BENCH): the new core and power names get their swap families.
  'Wall-press dead bug':'core','Hollow hold dumbbell press':'core','Overhead sit-up':'core','V-ups':'core','Farmer march':'core','Russian twist (heels down)':'core',
  'Farmer carry':'carry','Suitcase carry':'carry','Overhead carry':'carry',
  'Trap bar farmer carry':'carry',
  'Ball slams':'power','Broad jumps':'power','Dumbbell snatch':'power','Kettlebell clean':'power',
  'Lateral bounds':'power','Power clean (light & explosive)':'power',
  'Single-arm KB snatch':'power','Skater bounds':'power','Trap bar jump':'power','Tuck jumps':'power',
  'Wall ball shots':'power',
  'Plyo pushups':'power','Bulgarian split squat jumps':'power','Single-leg box jumps':'power','Seated box jumps':'power',
  'Burpees':'cond','High knees':'cond','Mountain climbers':'cond',
  'Wall sit':'hold','Single-leg wall sit':'hold','Spanish squat hold (KB)':'hold',
  'Cable crossover':'chest_iso','Pec deck':'chest_iso'
};
function _auxFamily(name: string | null | undefined): AuxFamily | null{return _AUX_FAMILY[String(name||'').trim()]||null;}
const _AUX_FAMILY_LABEL: Record<AuxFamily, string>={core:'Core',carry:'Carry / grip',power:'Power / ballistic',cond:'Conditioning',hold:'Isometric hold',chest_iso:'Chest isolation'};
// Gear legality for aux candidates. Mirrors the tier truths the engine pools use
// (hasBarbell = home_full/commercial/crossfit); machines are commercial-only; med
// balls live where med balls live. Anything unmatched is bodyweight-legal everywhere.
// V177 (D-b): the three carries stopped naming their implement, so the regexes below
// can no longer see their gear and would fall through to `return true` — a loaded carry
// on a bodyweight athlete. This sidecar covers ONLY those names. 'Trap bar farmer carry'
// is deliberately absent: it still names its own implement and the /trap bar/ regex
// already answers for it, and a second guard over the same name would be untrippable.
// V193 (D49): 'Pallof press' joins the sidecar with the BAND predicate. It is a band or
// cable anti-rotation press and is undoable with no equipment, but its name says neither
// word, so every regex below missed it and it fell through to `return true` — legal on a
// bodyweight athlete. Band, not cable, is the right tag: the band is the looser implement
// and the movement genuinely runs off one, so the tier set is the /\bband\b/ clause's
// (everything that owns bands: not bodyweight, not minimal).
const _AUX_GEAR: Record<string, 'loaded' | 'band'>={'Farmer march':'loaded','Farmer carry':'loaded','Suitcase carry':'loaded','Overhead carry':'loaded','Pallof press':'band'};
function _auxGearOK(name: string | null | undefined,equip: Equipment): boolean{
  const _g=_AUX_GEAR[String(name||'').trim()];
  if(_g==='loaded') return equip!=='bodyweight';
  if(_g==='band') return equip!=='bodyweight'&&equip!=='minimal';
  const N=String(name||'').toLowerCase();
  if(/glute-ham|\bghr\b|45° back extension/.test(N)) return equip==='commercial'||equip==='crossfit';
  if(/cable|pec deck/.test(N)) return equip==='commercial';
  if(/ball slams|wall ball|medicine ball/.test(N)) return equip==='commercial'||equip==='crossfit';
  if(/barbell|trap bar|power clean|landmine/.test(N)) return equip==='home_full'||equip==='commercial'||equip==='crossfit';  // V193 (D46): 'landmine' — this clause could not see the word, so a landmine read bodyweight legal on the swap sheet
  if(/kettlebell|\(kb|\bkb\b|dumbbell|\(db\b/.test(N)) return equip!=='bodyweight';
  if(/\bband\b/.test(N)) return equip!=='bodyweight'&&equip!=='minimal';   // V193 (D46): wizard equipment copy gives bands to home_full, home_basic and crossfit
  return true;
}
// ── MOVEMENT REP FLOOR ───────────────────────────────────────────────────────
// The wave descends reps (4x6 -> 4x3) on one premise: fewer reps at a higher RPE means
// MORE WEIGHT on the bar. That premise holds for a barbell comp lift and for nothing
// else. scheme() already knew this — the loadCapped / canAddLoad branches exist
// precisely because a hotel dumbbell cannot express a triple — but both are gated on the
// EQUIPMENT TIER rather than on the movement, so any lift reaching a main slot by
// another route lands on the raw wave line and is prescribed 4x3. Two routes do exactly
// that, and only the first is an injury:
//   * Injury pool overrides — lowback swaps the deadlift for 'Barbell hip thrust' and
//     the back squat for 'Dumbbell goblet squat', both on a full gym at full wave intensity.
//   * The Mini gym tier, with no injury at all — hasBarbell is false but noLoad is false
//     too, so squatPool resolves to kettlebell goblets and backCompoundPool to
//     kettlebell swings. A 4x3 kettlebell swing is not a prescription.
//
// Returns the rep window in which the movement is still a coherent prescription:
//   null    — no floor. The wave runs free. UNLISTED NAMES DEFAULT HERE, so nothing in
//             the library changes until it is deliberately listed.
//   [0,0]   — unloadable in practice. There is no weight to add, so reps cannot be the
//             fixed variable; routes to the open-ended "N sets — RPE 8" grammar the
//             bodyweight tier already ships.
//   [lo,hi] — load-ceilinged, or incoherent low. Reps clamp up into the window.
//
// The floor BITES ONLY WHEN THE WAVE DESCENDS BELOW IT. A hypertrophy 3x12 goblet squat
// already sits inside the window and comes out untouched — which is exactly why this
// never showed up on the size goals and only ever bit the tactical waves.
//
// Two different rationales share one mechanism. A goblet squat floors at 8 because the
// LOAD runs out: the bell is held at the sternum, so grip and thoracic spine quit long
// before the legs do and RPE 8.5 at three reps is not merely hard to reach, it is
// unreachable. A barbell hip thrust floors at 6 because the MOVEMENT runs out: it is
// lockout-limited, most athletes never approach true failure on it, and the way a
// maximal triple fails is lumbar hyperextension at the top — the exact position the lift
// is usually prescribed to avoid. The field is named for what it does, not for either
// rationale, because the third movement will arrive with a third reason.
//
// This is the FOURTH place loaded-ness is inferred from a name (see §12), and it is
// deliberate rather than lazy: the other three ask "does this take load, for the log
// surface?" This asks "can load be added fast enough to track a descending wave?" A
// banded hip thrust answers YES to the first question and NO to this one. When the
// pick-time `loaded` tag lands, this table keeps its windows and drops its regexes.
//
// ORDER MATTERS — specific before generic, same discipline as _pattern above. The
// barbell comp lifts are listed FIRST and anchored, so no generic rule can ever capture
// one: 'Barbell Romanian deadlift' is the bar and exits immediately, 'Dumbbell Romanian deadlift'
// falls through to the dumbbell window.
const _REP_FLOOR: [RegExp, RepWindow | null][]=[
  // The wave was written for exactly these. Explicit allowlist, exact match, no floor.
  [/^(barbell bench press|incline barbell press|close-grip bench press|barbell row|pendlay row|deadlift|sumo deadlift|trap bar deadlift|romanian deadlift|back squat|front squat|paused back squat|box squat|overhead press|push press|good mornings)$/i, null],
  // Unloadable — sets and effort are prescribed, reps emerge.
  // The file's own naming convention for an improvised, unloadable variant. Cheaper and
  // more durable than listing each one, and it stays correct as the BW pools grow.
  [/foot on chair|hands on bed|shoulders on bed|under a table|\(anchored\)|partner\/anchor/i, [0,0]],
  [/banded|resistance band|band pull-apart/i,                    [0,0]],
  [/glute bridge|bodyweight back extension|45° back extension/i, [0,0]],
  [/nordic|glute-ham|\bghr\b/i,                                  [0,0]],
  [/inverted row|prone y-t-w|reverse snow angel/i,               [0,0]],
  [/wall sit|wall walk|assisted pistol|spanish squat/i,           [0,0]],
  [/\bdips\b|pushup|push-up|pike pushup/i,                        [0,0]],
  [/squat \(slow/i,                                              [0,0]],
  // Load-ceilinged — the bell, the stack or the position runs out before the wave does.
  [/goblet/i,                                       [8,12]],  // anterior load ceiling
  [/pull-through|pull through/i,                    [8,12]],  // stack + friction ceiling
  [/straight-arm pulldown/i,                        [8,12]],  // isolation on a stack
  [/kettlebell swing|\bswing\b/i,                   [10,15]], // ballistic — a triple is not a swing
  [/hip thrust/i,                                    [6,10]], // lockout-limited; triples fail into lumbar extension
  [/split squat|step-?up|single-leg|single leg|pistol|landmine (reverse lunge|rotational press)/i, [6,10]], // balance caps expressible load
  // V221 D177 (RR2, RR4): the two loaded landmine lifts, by name. Not a bare `landmine` token:
  // Landmine rotations is core and has no load window. A future landmine lift is added here on entry.
  [/\brow\b/i,                                       [6,10]], // DB / KB single-arm row — position-limited
  [/dumbbell|kettlebell|\bdb\b|\bkb\b/i,             [5,8]],  // generic loaded non-barbell
  [/leg press|hack squat|machine|pulldown/i,         [5,8]],  // loads fine, but no reason to triple a machine
  // Backstop. Cable and machine isolation has no business on a main slot at all, but it
  // reaches one today by no rule other than nobody having written the rule — the same
  // blind spot §12 records for _pattern on cable fly / pec deck. If it ever arrives here
  // it gets an isolation window rather than the barbell wave.
  [/cable|crossover|pec deck|\bfly\b|flye/i,         [8,12]],
];
function _repFloor(name: string | null | undefined): RepWindow | null{
  const N=String(name||'');
  for(let i=0;i<_REP_FLOOR.length;i++){ if(_REP_FLOOR[i][0].test(N)) return _REP_FLOOR[i][1]; }
  return null;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export {
  _AUX_FAMILY, _AUX_FAMILY_LABEL, _AUX_GEAR, _auxFamily, _auxGearOK, _cardioInterference, _ceil, _isUnilateralRow,
  _itemRegion, _moveCap, _pattern, _repFloor, _sectionRegion, _setCap,
};
