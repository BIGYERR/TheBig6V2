import { _STACK_LOADED } from './power-accessory.js';
// end of the module imports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
// ── Exercise kinds: timed, rep-only or loaded, what a set logs, and how a weight rounds. ──
// Equipment token map — single source of truth for how a movement name signals added
// load. Each family lists every surface form, INCLUDING the parenthetical suffix
// convention "Movement (ABBR)". Add a new abbreviation once here (e.g. a '(sb' for a
// safety bar) and every detector below inherits it automatically — no more patching
// isKBExercise / isDBExercise / isTrackableWeight one at a time.
const EQUIP_TOKENS = {
  barbell:    ['barbell','(bb'],
  dumbbell:   ['dumbbell','db ','db-','(db'],
  kettlebell: ['kettlebell','kb ','kb-','(kb'],
  cable:      ['cable','(cable'],
  machine:    ['machine'],
  trapbar:    ['trap bar','(trap'],
  // 'slam' added V122: 'Ball slams' IS med-ball work but named neither 'med ball' nor
  // 'wall ball', so no equipment token matched and the movement was invisible to the gear
  // gates while still being handed a weight field by movKeywords.
  medball:    ['med ball','medicine ball','wall ball','slam'],
  goblet:     ['goblet'],
  loaded:     ['weighted','loaded']
};
// True if the name carries any external-load token at all.
function anyEquip(name){
  const n = (name||'').toLowerCase();
  for(const fam in EQUIP_TOKENS){ if(EQUIP_TOKENS[fam].some(t => n.includes(t))) return true; }
  return false;
}
function isTimeExercise(name) {
  if(!name) return false;
  const n = name.toLowerCase();
  const timeKeywords = ['plank','hold','wall sit','dead hang','hollow hold',
    'static hold','isometric hold','bird dog hold','dead bug hold'];
  return timeKeywords.some(kw => n.includes(kw));
}
// Movements whose NAME matches a rep keyword — so `isRepExercise` vetoes the weight
// field — but which are conventionally performed WITH external load when the name
// carries no bodyweight qualifier.
//
// Root cause, and this is the third instance of the same failure (V101, V103, now):
// **the name alone cannot say whether a movement is loaded**, because the engine draws
// the SAME string into a barbell pool and a bodyweight pool. `EXLIB.lunge` holds
// 'Dumbbell Bulgarian split squat' next to 'Reverse lunge (KB)'; the `_bw()` bodyweight branch
// holds 'Bulgarian split squat (foot on chair)'. Only the parenthetical distinguishes
// them, and `isRepExercise` matches the shared substring 'split squat' in both.
//
// The convention the library already follows: the BODYWEIGHT variant is explicitly
// qualified — "(foot on chair)", "(chair)", "(shoulders on bed)", "Assisted ",
// "Bodyweight ", "Banded " — and the loaded variant is bare. So a bare name in this
// list gets its load field back; a qualified one keeps the veto.
//
// Adding a name here is a COACHING call, not a parser tweak: it asserts the movement is
// normally performed under external load at any tier that owns equipment. The real fix
// is to carry loaded-ness down from the POOL rather than re-derive it from the string —
// see §12. Until then this list is the seam, and it must stay short.
// V113: 'bulgarian split squat' removed. The bare name is gone from the library — the
// loaded variant is 'Dumbbell Bulgarian split squat', which anyEquip catches directly.
// One less name asserted by hand. The seam shrinks as the library gets honest.
const REP_BUT_LOADED = ['single-leg hip thrust','bench dips'];
const BW_QUALIFIER = ['(chair','foot on chair','shoulders on bed','assisted ','(assisted','bodyweight','(partner','(anchored','banded ','band ','(bw'];
function isLoadedRepMovement(name){
  const n=(name||'').toLowerCase();
  if(BW_QUALIFIER.some(q => n.includes(q))) return false;
  return REP_BUT_LOADED.some(k => n.includes(k));
}
function isTrackableWeight(name) {
  if(!name) return false;
  const n = name.toLowerCase();
  // Band-only movements — no weight to track
  if(n.includes('band') && !n.includes('barbell') && !n.includes('db') && !n.includes('kb')) return false;
  // Explicit external load in the name wins — a loaded variant of a movement that also
  // reads as a bodyweight/rep exercise (Barbell hip thrust, Dumbbell Bulgarian split squat,
  // Weighted dips) must still get a weight field. This override beats the bodyweight and
  // rep vetoes below. Timed holds stay on the SEC field. Tokens come from EQUIP_TOKENS.
  if(anyEquip(n) && !isTimeExercise(n)) return true;
  // STACK-LOADED, BUT THE NAME SAYS NOTHING. Cable and selectorised-machine movements the
  // gym floor calls by their apparatus, not their implement: the athlete picks a pin, so
  // these are among the MOST loadable movements in the building, yet every keyword list
  // below misses them — 'face pull' has no equipment token and 'pull' is not a movKeyword,
  // 'extension' is not a movKeyword at all, and 'pec deck' names neither. They therefore
  // got no weight field, and as of V121 the unloadable sweep would ALSO have stripped their
  // rep target, which is exactly backwards.
  // Deliberately a short explicit list rather than adding a broad /extension/ token: that
  // token would also flip 'Eccentric wrist extension', which is rehab work that stays
  // unloaded, and 'Bodyweight back extension', which already names itself. Harvested from
  // the file — 259 names classified, these four are the whole disagreement.
  if(_STACK_LOADED.test(n)) return true;
  // Same class of override, for loaded movements whose name carries no equipment token
  // at all (bare 'Dumbbell Bulgarian split squat' from the barbell lunge pool). Must sit ABOVE
  // the isRepExercise veto below — that veto is what removed the field.
  if(isLoadedRepMovement(n) && !isTimeExercise(n)) return true;
  // An explicit bodyweight qualifier beats every movement keyword below. Without this,
  // movKeywords' 'raise' hands a LOAD field to 'Calf raise (bodyweight)', 'squat' hands one
  // to 'Bodyweight squats', and 'deadlift' to 'Single-leg Romanian deadlift (bodyweight)'.
  // Sits BELOW the anyEquip check on purpose: 'Single-leg glute bridge (weighted)' and
  // 'Dumbbell Bulgarian split squat' name their load and keep the field.
  if(BW_QUALIFIER.some(q => n.includes(q))) return false;
  // Pure bodyweight / plyometric / cardio
  const bwKeywords = ['jump squat','box jump','broad jump','burpee','mountain climber',
    'sprint','run','jog','skipping','jumping jack','high knee',
    'push-up','pushup','pull-up','pullup','chin-up','chinup',
    'clamshell','side step','it band','90/90','pigeon','world greatest',
    'lunge walk','bear crawl','inchworm','hip circle','terminal knee',
    'inverted row','bound','skater jump','tuck jump',
    'hanging knee raise','hanging leg raise',
    'pallof','anti-rotation','bird dog','dead bug','plank'
  ];
  if(bwKeywords.some(kw => n.includes(kw))) return false;
  // PHANTOM LOAD FIELDS (V122). Four movements matched a movKeyword by substring and were
  // handed a weight field they can never use: 'McGill curl-up' (matched 'curl'),
  // 'Garhammer raises' and 'Prone Y raise' (matched 'raise'), 'TRX row (if available)'
  // (matched 'row'). None carries a qualifier BW_QUALIFIER could catch. The pool was
  // internally inconsistent about it too: 'Prone Y-T-W raises' was already correctly
  // vetoed by 'y-t-w' while its sibling 'Prone Y raise' was not.
  // Matched on the whole name, not a substring, so a future 'Dumbbell Y raise' would
  // still keep its field.
  const _PHANTOM_LOAD=['mcgill curl-up','garhammer raises','prone y raise','trx row (if available)'];
  if(_PHANTOM_LOAD.indexOf(n.trim())>=0) return false;
  // Time-based holds tracked separately
  if(isTimeExercise(n)) return false;
  // Rep-based bodyweight tracked separately
  if(isRepExercise(n)) return false;
  // Equipment / weighted keywords — order matters, check equipment first
  const equipKeywords = ['barbell','dumbbell','db ','db-','kettlebell','kb ','kb-',
    'trap bar','cable','machine','weighted','med ball','medicine ball','wall ball'];
  const movKeywords = ['press','row','curl','raise','deadlift','squat','bench',
    'fly','flye','pulldown','upright','lateral','front raise','arnold','goblet',
    'swing','snatch','clean','rdl','hip thrust','glute bridge','step-up',
    'good morning','lunge','slam','carry','farmer','suitcase','thruster'];
  return equipKeywords.some(kw => n.includes(kw)) || movKeywords.some(kw => n.includes(kw));
}
function isRepExercise(name) {
  if(!name) return false;
  const n = name.toLowerCase();
  // Was only pullups/pushups/dips, so most no-load work (inverted rows, split squats,
  // glute bridges, Nordics) fell through to the WEIGHT field or showed no log field at
  // all — i.e. it could not be logged. Anything performed against bodyweight alone is
  // logged in REPS, which is also what makes open-ended "sets to RPE" prescriptions work.
  const repKeywords = ['pull-up','pullup','chin-up','chinup','push-up','pushup','dip','ring dip','muscle-up',
    'inverted row','split squat','pistol squat','shrimp squat','glute bridge','hip thrust',
    'nordic','back extension','snow angel','y-t-w','superman','step-up','lunge',
    'sit-up','situp','leg raise','knee raise','v-up','hollow rock','squat (slow'];
  return repKeywords.some(kw => n.includes(kw));
}
function roundWeight(lbs, unit) {
  if(unit === 'kg') {
    const kg = lbs * 0.453592;
    return Math.round(kg / 2.5) * 2.5;
  }
  return Math.round(lbs / 5) * 5;
}

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { EQUIP_TOKENS, isRepExercise, isTimeExercise, isTrackableWeight, roundWeight };
