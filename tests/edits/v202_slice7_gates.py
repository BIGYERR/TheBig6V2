#!/usr/bin/env python3
# V202 slice 7 — the gates for S1 (PACE CLOCK appendix re-site) and S2 (INT note copy).
#   S1 -> tests/gates/g202_pace_copy.js     rows C10-C13 (note copy is that file's business)
#   S2 -> tests/gates/g202_int_doctrine.js  rows D9-D9c  (REPS_CEILING oracle already lives there)
# Both oracles are independent of the engine: coach's ruled strings typed verbatim, and
# guide A 259-263's rep ceiling already typed as REPS_CEILING in the int gate.
import io, os
ROOT='/Users/CanasBangin/Desktop/TheBig6V2'
COPY=os.path.join(ROOT,'tests','gates','g202_pace_copy.js')
INT =os.path.join(ROOT,'tests','gates','g202_int_doctrine.js')
def read(p):
    with io.open(p,encoding='utf-8') as f: return f.read()
def write(p,s):
    with io.open(p,'w',encoding='utf-8') as f: f.write(s)
def rep(src,old,new,label):
    c=src.count(old); print('  anchor %-26s count==1 (found %d) %s'%(label,c,'OK' if c==1 else 'MISS'))
    if c!=1: raise SystemExit('ABORT: anchor %s found %d. Nothing written.'%(label,c))
    return src.replace(old,new)

print('S1 gate -> g202_pace_copy.js rows C10-C13')
c=read(COPY)
c_old="""// ── blast radius: copy is copy; no prescribed value moves ────────────────────"""
c_new="""// ═════════════════════════════════════════════════════════════════════════════
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
  if(/Pace moves \\d+ seconds per mile/.test(n))     return 'dampened';
  if(/Zone 5 \\(95%\\+ max HR\\)/.test(n))             return 'generic';
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

// ── blast radius: copy is copy; no prescribed value moves ────────────────────"""
c=rep(c,c_old,c_new,'C10-C13 block')
write(COPY,c)
print('  g202_pace_copy.js written.')

print('S2 gate -> g202_int_doctrine.js rows D9-D9c')
d=read(INT)
d_old="""console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);"""
d_new="""// ═════════════════════════════════════════════════════════════════════════════
// D9 — the generic INT note states A's rep ceiling, and says it in Mario's voice
// ═════════════════════════════════════════════════════════════════════════════
// The four copies of this string claimed a build to 10 and a hard cap at 10. Guide A
// 259-260 says "Do not run or swim more than 8 intervals", and under D112 A governs; the
// engine's own getINTReps has capped at REPS_CEILING all along, so the sentence contradicted
// both the doctrine and the code. It also carried two mid-sentence em-dashes. Coach ruled
// one replacement string and ruled that the four sites be replaced AS A SET, so the edit is
// provably complete rather than four anchors that drift. The oracle here is that ruled
// string, typed, plus REPS_CEILING, typed above from A.
const RULED_INT_NOTE = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts. All out on each rep. '
  + 'Take the full recovery. Build from 4 reps to ' + REPS_CEILING + '. Hard cap at ' + REPS_CEILING + '. '
  + 'Quality over quantity. If pace drops, stop.';
const SRC = fs.readFileSync(ART, 'utf8');
const srcNew = SRC.split(RULED_INT_NOTE).length - 1;
const srcOld = SRC.split('Build from 4 reps to 10').length - 1;
ok(srcNew === 4 && srcOld === 0,
  `D9 all four copies of the generic INT note read coach's ruled sentence and none still claims a `
  + `cap of 10 (found ${srcNew} ruled, ${srcOld} legacy). Replaced as a SET, so completeness is provable`);

function notesOf(cfg){
  const p = IA.buildProgram(JSON.parse(JSON.stringify(cfg)));
  const out = []; const wks = p.weeks || {};
  Object.keys(wks).sort((a,b)=>+a-+b).forEach(w => DAYS.forEach(dd => {
    const day = wks[w][dd]; if(!day || !day.cardio) return;
    (Array.isArray(day.cardio)?day.cardio:[day.cardio]).forEach(s => {
      if(s && s.type === 'run' && /Interval \\(INT\\)/.test(s.subtype||''))
        out.push({ w:+w, note:String(s.note||''), dose:s.dose||null });
    });
  }));
  return out;
}
// A cfg whose goal is reachable inside the block and is not already met: the one class that
// still reads the generic note at zero shift.
const GENERIC_CFG = paceGoal({ targetDist:'1.5', targetMins:'12', targetSecs:'30', targetTime:'12:30',
  mileBestMins:'8', mileBestSecs:'15', mileBestSrc:{kind:'entered'} });
const gNotes = notesOf(GENERIC_CFG).filter(n => /Zone 5/.test(n.note));
ok(gNotes.length > 0 && gNotes.every(n => n.note === RULED_INT_NOTE),
  `D9b the generic note as RENDERED equals the ruled string verbatim on ${gNotes.length} INT cards `
  + `(a source match alone would pass on a string nothing reaches)`
  + (gNotes.length && gNotes[0].note !== RULED_INT_NOTE ? ` — got |${gNotes[0].note}|` : ''));
ok(gNotes.length > 0 && !MID_DASH.test(gNotes[0].note.replace(/^INT — Interval:/, '')),
  `D9c the ruled note carries no mid-sentence dash once the structural "INT — Interval:" label is `
  + `removed: four sentences, no em-dash, Mario's copy rule`);
// the number the athlete is told and the number the engine will actually prescribe
const latMaxReps = LAT.reduce((mx, cfg) => Math.max(mx, ints(IA.buildProgram(JSON.parse(JSON.stringify(cfg))))
  .reduce((m, r) => Math.max(m, (r.dose && r.dose.reps) || 0), 0)), 0);
ok(latMaxReps > 0 && latMaxReps <= REPS_CEILING && RULED_INT_NOTE.indexOf('Hard cap at ' + latMaxReps) >= 0,
  `D9d the cap the note STATES (${REPS_CEILING}) is the cap the engine PRESCRIBES: the highest rep count `
  + `across ${LAT.length} blocks is ${latMaxReps}, and A 259-260 allows no more than ${REPS_CEILING}`);

console.log(`PASS ${PASS} FAIL ${FAIL}`);
process.exit(FAIL ? 1 : 0);"""
d=rep(d,d_old,d_new,'D9-D9d block')
write(INT,d)
print('  g202_int_doctrine.js written.')
print('DONE')
