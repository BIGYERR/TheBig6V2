// g202_pace_copy.js — V202 slice 2, the ATHLETE-FACING COPY of D100 / D101 (E4, E5, E6).
//
// E4: the dampened pace-clock note is D101's sentence. It states D101's rate as a rate,
//     drops the unsourced "(physiological safety limit)" claim, and carries no mid-sentence dash.
// E5: the run anchor card sentence. Measure proved the old claim ("Every pace in this program
//     comes from this row") FALSE on all three pace-goal ids: the pace-goal clock walks weekly
//     and re-derives the row, so the anchor row is WEEK 1's row, not the program's. Chart goals
//     (NRC, legacy) do not walk, so the old sentence is true there and is kept.
// E6: the clipboard line mirrors E5, so copied text and rendered card say the same thing.
//
// ORACLE — independent of the engine by construction:
//   * the expected sentences below are TYPED HERE, verbatim from coach's ruling. The gate never
//     asks the app what it prints and compares it to itself.
//   * the numbers inside the E4 sentence (5 s/mi/wk, 7:00/mi goal, 7:44/mi block target) are the
//     same hand values g202_pace_anchor.js derives from the athlete's ENTERED fields, and are
//     re-derived here from the entered mm:ss rather than read off the note. The block target is
//     7:44/mi under the AMENDED D100 (the anchor is the 8:15 row read at 1.5 mi, not the 8:15
//     mile itself); it read 7:30/mi against the first cut of E1, which coach retracted.
//   * the copy rule itself is the doctrine text (CLAUDE.md, Mario standing): no mid-sentence
//     hyphen or em-dash in athlete copy; a "XXX — Label:" structural prefix is the ruled exception,
//     the same exemption "4×5 — RPE 8" carries. The gate counts prefixes and mid-sentence dashes
//     SEPARATELY so the exemption can never launder a real violation.
//
// Usage: node tests/gates/g202_pace_copy.js [artifact]
// Prints PASS n FAIL n. Expected to FAIL on V201 and on the slice-1 artifact: neither carries E4-E6.

const path = require('path');
const { load, fixtures, progDigest, MANNY_DIGEST_BY_VERSION } = require(path.join(__dirname, '..', 'harness.js'));

const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const IA = load(ART);

let PASS = 0, FAIL = 0;
function ok(cond, msg){ if(cond){ PASS++; console.log('  ok   ' + msg); } else { FAIL++; console.log('  FAIL ' + msg); } }

// ── the copy rule, as a predicate ────────────────────────────────────────────
const MID_DASH = /\s[—–-]\s/g;                       // hyphen, en dash, em dash, space-flanked
const LABEL_PREFIX = /^[A-Z]{3} — [A-Z][a-z]/;       // "INT — Interval:", "CHI — Continuous ..."
function dashAudit(s){
  const t = String(s || '');
  const pfx = LABEL_PREFIX.test(t) ? 1 : 0;
  const hits = t.match(MID_DASH) || [];
  return { prefix: pfx, mid: hits.length - pfx, text: t };
}
const strip = s => String(s || '').replace(/<[^>]+>/g, '');

// ── hand arithmetic (typed here, never read from the app) ────────────────────
const clock = s => Math.floor(s/60) + ':' + String(Math.round(s % 60)).padStart(2, '0');
const EXP_IMPROVE = { beginner:3, intermediate:5, advanced:7 };
const AGE_SCALE   = { '18-35':1.0, '36-54':0.85, '55+':0.65 };

// PRT TING: entered mile 8:15, entered goal 10:30 over 1.5 mi, intermediate, 18-35.
const HAND_GAIN  = EXP_IMPROVE.intermediate * AGE_SCALE['18-35'];       // 5 s/mi/wk
const HAND_GOAL  = ((10*60 + 30) / 1.5);                                // 420 s/mi
// Amended D100: the anchor is the 8:15 row (mile 495, 5K 535) read at 1.5 mi in log distance.
const HAND_ANCHOR = 495 + (535 - 495) * Math.log(1.5) / Math.log(3.107);   // 509.3064 s/mi
const HAND_REACH  = +(HAND_ANCHOR - HAND_GAIN * 9).toFixed(1);             // 464.3 s/mi -> 7:44/mi
                                                        // D101 realistic target, pinned by g202_pace_anchor Q5

// ── coach's ruled strings, VERBATIM ──────────────────────────────────────────
const RULED_NOTE =
  `INT — Interval: Pace moves ${HAND_GAIN} seconds per mile each week. That is the safe rate for your `
  + `experience and age. Your full goal of ${clock(HAND_GOAL)}/mi needs more weeks than this block has. `
  + `The target for this block is ${clock(HAND_REACH)}/mi. Hit the prescribed pace precisely.`;
const RULED_PACE_TAIL  = ' Week 1 runs off this row. Every week after it moves toward your goal.';
const RULED_CHART_TAIL = ' Every pace in this program comes from this row.';
const RULED_PACE_SENT  = 'Anchored on an 8:15 mile, the time you entered.' + RULED_PACE_TAIL;
const RULED_CHART_SENT = 'Anchored on a 10:30 mile, the time you entered.' + RULED_CHART_TAIL;

// ── cfgs ─────────────────────────────────────────────────────────────────────
const DAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const SEED = 24865;
const base = over => Object.assign({
  name:'PRT TING', primaryPath:'event', cardioTypes:['run'],
  eventTargeted:true, raceDate:'2026-10-19',
  liftingFocus:'support_prevention', experience:'intermediate', ageBracket:'18-35',
  equipment:'full_gym', unit:'lbs', restDays:['sun','wed'], days:DAYS.slice(),
  bench:185, squat:245, deadlift:315, seed:SEED,
}, over || {});
const runGoal = (g, over) => base(Object.assign({ cardioGoals:{ run: g } }, over || {}));
const PINNED = runGoal({ id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
  baselineDist:'3', baseline:'3mi', targetDist:'1.5', targetMins:'10', targetSecs:'30',
  targetTime:'10:30', mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });

// reach into the artifact for the two pure copy functions (not exported by the harness)
const say = IA.eval('(function(c){ var a = runAnchorInfo(c); return a ? {s:runAnchorSentence(a), l:runAnchorLine(a), goalId:a.goalId, kind:a.kind} : null; })');

// ── E4: the dampened note ────────────────────────────────────────────────────
const prog = IA.buildProgram(JSON.parse(JSON.stringify(PINNED)));
const notes = [];
Object.keys(prog.weeks||{}).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
  const day = prog.weeks[w][d]; if(!day || !day.cardio) return;
  (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(s => {
    if(s && s.type === 'run' && s.note) notes.push({ w:+w, st:s.subtype||'', note:s.note });
  });
}));
const damp = notes.filter(n => /Interval/.test(n.st) && /Pace moves|Pace capped/.test(n.note));
ok(damp.length > 0, `C1a the dampened pace-clock note still fires on the pinned PRT TING cfg (${damp.length} sessions). `
  + `A zero here makes every other C row vacuous`);
const cBad = damp.filter(n => n.note !== RULED_NOTE);
ok(damp.length > 0 && cBad.length === 0,
  `C1 every dampened note (${damp.length}) reads coach's ruled E4 sentence verbatim`
  + (cBad.length ? ` — W${cBad[0].w} reads |${cBad[0].note}|` : ''));
ok(damp.length > 0 && !damp.some(n => /physiolog/i.test(n.note)),
  `C2 no dampened note claims a "physiological safety limit": D101's number is this file's own `
  + `coaching table, and the app does not assert what it cannot source`);

// ── copy rule, scoped to the strings E4 OWNS ─────────────────────────────────
// Deliberately NOT the whole note corpus. The undampened INT note and the LSD note also carry
// mid-sentence em-dashes at this version; no ruling has replacement text for them, so gating them
// here would fail on unruled ground. They are PRINTED as a standing debt line instead, so the
// number is visible and cannot quietly grow.
const dampBad = damp.map(n => ({ n, a: dashAudit(n.note) })).filter(x => x.a.mid > 0);
ok(damp.length > 0 && dampBad.length === 0,
  `C3 the E4 note carries no mid-sentence dash; its one dash is the exempt "INT — Interval:" `
  + `structural prefix (${damp.length} notes audited, ${damp.filter(n=>dashAudit(n.note).prefix).length} prefixed)`
  + (dampBad.length ? ` — W${dampBad[0].n.w}: |${dampBad[0].n.note}|` : ''));
const debt = notes.filter(n => dashAudit(n.note).mid > 0);
const debtKinds = Array.from(new Set(debt.map(n => String(n.st).replace(/\s*\(.*/, ''))));
console.log(`  note  UNRULED COPY DEBT: ${debt.length} of ${notes.length} run notes on this program still `
  + `carry a mid-sentence dash (${debtKinds.join(', ') || 'none'}). No ruling covers them; not gated.`);

// ── E5: the anchor sentence, both goal classes ───────────────────────────────
const pv = say(PINNED);
ok(!!pv && strip(pv.s) === RULED_PACE_SENT,
  `C4 the pace-goal card reads coach's ruled E5 sentence verbatim`
  + (pv ? ` — got |${strip(pv.s)}|` : ' — runAnchorInfo returned null'));
const mv = say(fixtures.HALF_MANNY);
ok(!!mv && strip(mv.s) === RULED_CHART_SENT,
  `C5 the chart-goal card keeps the ruled unchanged claim (it is TRUE there: the chart clock does `
  + `not walk)` + (mv ? ` — got |${strip(mv.s)}|` : ' — runAnchorInfo returned null'));

// every provenance form of the pace goal must carry the week-1 scope and no mid-sentence dash
const FORMS = [
  ['entered',  { mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} }, 'intermediate'],
  ['seeded',   { mileBestMins:'9', mileBestSecs:'00', mileBestSrc:{kind:'seeded', prog:'PRT TING', n:4} }, 'intermediate'],
  ['default',  { }, 'intermediate'],
  ['beginner', { mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} }, 'beginner'],
  ['fastclamp',{ mileBestMins:'3', mileBestSecs:'30', mileBestSrc:{kind:'entered'} }, 'advanced'],
  ['slowclamp',{ mileBestMins:'22', mileBestSecs:'00', mileBestSrc:{kind:'entered'} }, 'advanced'],
];
const CHART_IDS = ['run_5k', 'run_10k', 'run_half', 'run_marathon'];
let dashBad = [], tailBad = [], mirrorBad = [];
for(const [tag, mb, exp] of FORMS){
  for(const gid of ['run_pace_goal'].concat(CHART_IDS)){
    const g = Object.assign({ id:gid, label:gid, paceUnit:'mi', baselineDist:'3', baseline:'3mi',
      targetDist:'1.5', targetMins:'10', targetSecs:'30', targetTime:'10:30' }, mb);
    const v = say(runGoal(g, { experience: exp }));
    if(!v) continue;
    const s = strip(v.s), l = strip(v.l);
    const a = dashAudit(s);
    if(a.mid > 0) dashBad.push(`${gid}/${tag}/${exp}: |${s}|`);
    if(dashAudit(l).mid > 0) dashBad.push(`${gid}/${tag}/${exp} LINE: |${l}|`);
    const wantPace = (gid === 'run_pace_goal');
    // the beginner form is ruled to end on its own sentence and take neither tail
    if(v.kind !== 'beginner'){
      const has = s.indexOf(wantPace ? RULED_PACE_TAIL : RULED_CHART_TAIL) >= 0;
      const hasWrong = s.indexOf(wantPace ? RULED_CHART_TAIL : RULED_PACE_TAIL) >= 0;
      if(!has || hasWrong) tailBad.push(`${gid}/${tag}/${exp}: |${s}|`);
    }
    // E6 mirror: the clipboard says what the card says
    const cardScope = s.indexOf('Week 1 runs off this row') >= 0;
    const lineScope = l.indexOf('Week 1 runs off this row') >= 0;
    if(cardScope !== lineScope) mirrorBad.push(`${gid}/${tag}/${exp}: card ${cardScope} line ${lineScope}`);
  }
}
const N = FORMS.length * (1 + CHART_IDS.length);
ok(dashBad.length === 0,
  `C6 no mid-sentence dash in any anchor sentence or clipboard line across ${N} goal x provenance forms`
  + (dashBad.length ? ` — ${dashBad.length} bad, first ${dashBad[0]}` : ''));
ok(tailBad.length === 0,
  `C7 every pace-goal form scopes its claim to week 1 and every chart-goal form keeps the program-wide `
  + `claim, and neither ever carries the other's tail`
  + (tailBad.length ? ` — ${tailBad.length} bad, first ${tailBad[0]}` : ''));
ok(mirrorBad.length === 0,
  `C8 E6 mirror: the clipboard line carries the week-1 scope exactly when the rendered card does`
  + (mirrorBad.length ? ` — ${mirrorBad.length} bad, first ${mirrorBad[0]}` : ''));
ok(!!pv && strip(pv.l).indexOf(RULED_PACE_TAIL.trim()) >= 0,
  `C9 the pinned clipboard line carries the ruled week-1 scope sentence` + (pv ? ` — got |${strip(pv.l)}|` : ''));

// ═════════════════════════════════════════════════════════════════════════════
// C10-C13 — D2b-iii (V142), re-sited V202 S1: the PACE CLOCK appendix
// ═════════════════════════════════════════════════════════════════════════════
// Coach's ruling: an athlete returning from injury must never read a target the calendar
// says they earned without being told why it is not the calendar's number. That fact is
// orthogonal to whether the goal is met, dampened or on schedule. So the appendix appends
// to WHICHEVER INT note fires, whenever the pace-shift for the week is non-zero, and to
// none of them when it is zero. The sentence below is typed from the ruling, not read
// from the app; the classes below are read off the PROGRESSION state (_goalMet /
// _dampened / neither), never off which limb of the chain happened to fire.
const RULED_APPENDIX = ' PACE CLOCK: Injury time froze your targets. This week resumes from the last pace you trained, not the calendar week.';

function intNotes(cfg){
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const out = [];
  Object.keys(p.weeks||{}).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(d => {
    const day = p.weeks[w][d]; if(!day || !day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(s => {
      if(s && s.type === 'run' && /Interval/.test(s.subtype||'')) out.push({ w:+w, note:String(s.note||'') });
    });
  }));
  return out;
}
// The limb a note came from, by its opening words. Used only to prove the sweep is not
// vacuous; the assertion itself does not care which limb fired.
function limbOf(n){
  if(/^CUTBACK WEEK/.test(n))                       return 'cutback';
  if(/already within your current pace/.test(n))    return 'goalMet';
  if(/Pace moves \d+ seconds per mile/.test(n))     return 'dampened';
  if(/Zone 5 \(95%\+ max HR\)/.test(n))             return 'generic';
  return 'other';
}
// The PROGRESSION class, which is what coach's three classes name. Under a shift the
// generic limb is unreachable (the chain routes shift into the dampened limb), so the
// class has to be taken from a zero-shift build of the same cfg.
const SHIFT_WKS = 2;
const APX_LAT = [];
for(const mb of [['5','30'],['8','15'],['11','00']])
  for(const dist of ['1','1.5','3'])
    for(const tt of [['10','30'],['13','00']])
      for(const exp of ['beginner','intermediate','advanced'])
        APX_LAT.push(runGoal({ id:'run_pace_goal', label:'Hit a Pace / Time Goal', paceUnit:'mi',
          baselineDist:'3', baseline:'3mi', targetDist:dist, targetMins:tt[0], targetSecs:tt[1],
          targetTime:tt[0]+':'+tt[1], mileBestMins:mb[0], mileBestSecs:mb[1],
          mileBestSrc:{kind:'entered'} }, { experience:exp }));

const shiftMap = () => { const m = {}; for(let i=1;i<=30;i++) m[i] = SHIFT_WKS; return m; };
let zeroCards = 0, zeroWithApx = 0, shiftCards = 0, shiftMissing = [], shiftDouble = [], shiftTailBad = [];
const classCards = { goalMet:0, dampened:0, neither:0, cutback:0 };
for(const cfg of APX_LAT){
  const zero = intNotes(cfg);
  const cls  = zero.map(n => limbOf(n.note));
  const sh   = intNotes(Object.assign({}, cfg, { _paceShift: shiftMap() }));
  zeroCards += zero.length;
  zero.forEach(n => { if(n.note.indexOf('PACE CLOCK') >= 0) zeroWithApx++; });
  for(let i=0;i<sh.length;i++){
    shiftCards++;
    const k = cls[i] === 'goalMet' ? 'goalMet' : cls[i] === 'dampened' ? 'dampened'
            : cls[i] === 'cutback' ? 'cutback' : 'neither';
    classCards[k]++;
    const n = sh[i].note;
    const hits = n.split('PACE CLOCK:').length - 1;
    if(hits === 0) shiftMissing.push(`${k} W${sh[i].w}: |${n.slice(0,72)}|`);
    if(hits > 1)   shiftDouble.push(`${k} W${sh[i].w}: ${hits} copies`);
    if(hits === 1 && n.slice(-RULED_APPENDIX.length) !== RULED_APPENDIX) shiftTailBad.push(`${k} W${sh[i].w}: |${n.slice(-40)}|`);
  }
}
const threeClasses = classCards.goalMet > 0 && classCards.dampened > 0 && classCards.neither > 0;
ok(threeClasses,
  `C10a the sweep reaches all three progression classes under a shift — goal-met ${classCards.goalMet}, `
  + `dampened ${classCards.dampened}, on-schedule ${classCards.neither} (plus ${classCards.cutback} cutback) `
  + `across ${shiftCards} INT cards from ${APX_LAT.length} cfgs. A zero in any class makes C10 vacuous`);
ok(shiftMissing.length === 0,
  `C10 with a non-zero pace shift every one of ${shiftCards} INT cards carries the D2b-iii appendix, `
  + `in every class — the sentence is about the SHIFT, not about which note fired`
  + (shiftMissing.length ? ` — ${shiftMissing.length} missing, first ${shiftMissing[0]}` : ''));
ok(zeroWithApx === 0,
  `C11 with no pace shift none of ${zeroCards} INT cards carries it: the appendix is not a latch`
  + (zeroWithApx ? ` — ${zeroWithApx} carried it` : ''));
ok(shiftDouble.length === 0,
  `C12 the appendix is appended ONCE per note, never duplicated by a second predicate`
  + (shiftDouble.length ? ` — first ${shiftDouble[0]}` : ''));
ok(shiftTailBad.length === 0,
  `C13 the appendix is the tail of the note and is coach's V142 sentence verbatim`
  + (shiftTailBad.length ? ` — ${shiftTailBad.length} bad, first ${shiftTailBad[0]}` : ''));
console.log(`  note goal-met x non-zero-shift population: ${classCards.goalMet}/${shiftCards} INT cards `
  + `(${APX_LAT.length}-cfg lattice, shift=${SHIFT_WKS}wk). This is the class slice 5 added and slice 7 rescued.`);

// ── blast radius: copy is copy; no prescribed value moves ────────────────────
const row = MANNY_DIGEST_BY_VERSION[IA.version];
const mannyDigest = progDigest(IA.buildProgram(JSON.parse(JSON.stringify(fixtures.HALF_MANNY))));
ok(!!row && mannyDigest === row,
  `B2 HALF_MANNY matches the V${IA.version} row of MANNY_DIGEST_BY_VERSION (${row || 'NO ROW'}): got ${mannyDigest}. `
  + `E4-E6 are copy only; a digest move here means a prescription moved`);

console.log('PASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : 0);
