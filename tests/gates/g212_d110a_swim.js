// g212_d110a_swim.js — GATE for D110a, the swim clock (V212 slice 1).
//
//   node tests/gates/g212_d110a_swim.js [candidate] [baseline V211]
//
// THE RULING THIS DEFENDS (coach ruled, Mario concurred, incl. the rate as an app ruling):
//   One rate on one clock. The weekly split gain on a swim time goal is the 4/3/2 s/100/wk
//   (beginner/intermediate/advanced) x age scale (1.0 / 0.85 / 0.65) rate the program sizer
//   already uses. The old 2.5x multiplier and its 6 s ceiling go.
//   E7 mirror: a goal split that is not faster than the current split holds at the current split.
//   Guide A p12: the INT rep split is this week's goal split minus 2 s per 100 (not x0.97).
//
// ORACLES, independent of the engine. buildSwimSession's numbers are never read back as truth:
//   E        the wizard contract: the entered current time over (distance/100); left blank, the
//            experience default typed here by hand (2:30 / 2:00 / 1:35 per 100).
//   T        the entered goal time over (distance/100).
//   rate     the hand table {4,3,2} x {1.0,0.85,0.65} typed below.
//   model    weekPace(w) = E - r(w-1), r = min((E-T)/tw, rate); T >= E holds at E for every week.
//   INT      Guide A p12: the rep split is the goal split minus 2 s. Guide A's own worked example,
//            500 in 10:30, prints 2:04 in week 1 (typed below as a string).
//   clock    the carrying m:ss contract re-implemented here (round the whole value, then split).
//   tw       the program length (Object.keys(weeks)); the sizer owns it and D110a does not touch it.
//
// ROWS
//   L0   lattice non-vacuity: builds, INT cards, faster/slower/dampened/blank-base configs.
//   R1   week 1 prints the goal split clock(E), on faster AND slower goals (counted apart).
//   R1k  Guide A p12 worked example: 500 in 10:30 prints 2:04 at a 2:06 split in week 1.
//   R2   every INT card: the rep split == clock(printed goal split - 2), in the detail line and in
//        the Main set segment.
//   R3a  every consecutive-week printed step <= hand rate + 1 s (rounding).
//   R3b  every printed goal split is within 0.55 s of the hand model (tenths store + whole clock).
//   R3c  where the goal is out of reach (dampened), the week 1 to last INT week drop equals the
//        hand rate x weeks within 1.1 s: the weekly gain the card shows IS the table rate.
//   R4   goal met (T >= E): every INT card prints clock(E) as the split and clock(E-2) as the rep.
//   N1   (slice 2) where dampened, the note's "target for this block" is a goal split printed on an
//        INT card of the same program (V211: 0 of 448 measured).
//   N2   (slice 2) the goal met note prints on every INT card iff T >= E, and on no other.
//   N3   (slice 2) with no current time entered (blank, 0:00, or seconds with no minutes: the
//        ruled predicate is baseMins entered AND total > 0) every INT note opens with the typed
//        anchor line quoting the experience default {2:30, 2:00, 1:35}; with one entered, none does.
//   N4   (slice 2) no swim note says "build to 10" or "cap at 10" (Guide A: 8 intervals at most),
//        and both INT rep notes (time goal default, distance goal) print "build to 8. Hard cap at 8."
//   N5   (slice 2) no swim note carries a mid-sentence dash: "—", "–" or letter-hyphen-letter (the
//        D109 predicate, g206).
//   SH0-SH5 (slice 3, the goal sheet; coach's D144 aware mapping, superseding the surgery's S6).
//        commitGoalChange is driven in the VM for 500->500, 500->100, 100->500 (with and without a
//        500 time), 100->100 and tri->500. Hand table, typed from the ruling: the unit always
//        carries; a 500 time carries to wherever a 500 lives (a 500 goal's base, a 100 goal's
//        base500); a current 100 carries only to a 100 goal; nothing absent is written.
//   SO1  (slice 5b, re-sited by slice 6) a seconds-only current 100 (minutes box empty, 58 s) is
//        read as entered: with a 5:00 500 on file week 1 anchors on 1:00, the 100 gap applies (no
//        goal met note, the split falls), and no note says "No current". Before D144 the same row
//        read "week 1 anchors on 0:58"; D144 moves the 100 goal's anchor to the 500.
//   D1-D7 (slice 6, D144; coach's hand oracle). The 100 goal anchors on a 500: E = base500 / 5, the
//        target is E minus the 100 gap (current 100 - goal 100, 0 with no current 100).
//   D1   500 10:16, current 100 1:30, goal 1:20, intermediate 18-35: week 1 splits 2:03 (616/5 =
//        123.2), rep 2:01; every split on the hand line 123.2 - (10/tw)(w-1), steps <= 3. The
//        block ends at 123.2 - 10 = 113.2 (1:53) after tw weeks; the sizer gives this fixture 10
//        weeks and INT runs weeks 1-5, so no card prints 1:53 (reported to coach; not asserted).
//   D2   current 100 1:20, goal 1:30: every split 2:03 and the goal met note.
//   D3   no 500 on file: the anchor line quoting the 500 and the 2:00 default; with no 100 either,
//        the program holds at 2:00 with the line and the goal met note.
//   D4   (build pair) the 500 goal is untouched by slice 6: the C7c fixture 63fe1fbf0fc44790 and a
//        450 build 500 lattice hash e986019e9b9afa7d, both PRINTED on the slice 5b tree before
//        slice 6 (a pre-slice reference, like a baseline read), and athlete A 402d3dde836e875c
//        (coach's surgery print).
//   D5   (build pair) swim_100_time program length is identical to V211 with a base500 on file
//        (base500 never reaches the sizer).
//   D6   100 goal copy: the Main set says "Two seconds under this week's 500 pace of X/100." and the
//        detail "two seconds under this week's 500 pace"; the 500 goal keeps "goal split"; no dash.
//   D7   a 100 goal out of reach names the goal as "0:50 for 100yd" in the note.
//   D8   (slice 6b, coach's dampened pin) 500 10:16, current 100 1:30, goal 0:50 (gap 40 s): the
//        sizer gives 10 weeks, raw 4 > rate 3, INT weeks 1-5, so week 5 prints the split 1:51
//        (123.2 - 12) and the note says "The target for this block is 1:51/100."
//   FL1  (slice 6b, the D144 floor) a stored-program-shaped 100 goal (no 500 on file, advanced,
//        default 1:35) whose gap is at or past the default (2:40 or 2:35 current, 1:00 goal: gap
//        100 or 95 s) holds at 1:35 with rep 1:33, the anchor line and the goal met note.
//   GT1  (slice 6b) the engine reads a seconds-only goal (0:55, minutes box empty) by its total:
//        the progression is present (500 5:00: week 1 at 1:00, falling). GT1b (build pair): the
//        program length is V211's (the sizer's readers are D157, unchanged).
//   SO2  (slice 5b) the goal sheet carries a seconds-only current time, both limbs as stored.
//   SH0  every case reaches the save (a write lands in ia_programs, no throw before it).
//   SH1  swimUnit carries on every swim case that had one.
//   SH2  the base / base500 keys written are exactly the hand table's, per case.
//   SH3  a 100 goal switched to a 500 with no 500 time on file prints the "No current 500yd time" line.
//   SH4  swimmer B (500 m 10:16, goal 9:30, sheet change to 9:00): the rebuilt week 1 prints
//        "100m at 2:01" at a 2:03 split (123.2 - 2 = 121.2, Guide A p12).
//   SH5  (build pair) swimmer B's rebuilt digest is coach's surgery print, a0f2e847ed9473d7.
//   M2a-M2f (slice 5, M2: Mario "make it required", coach's exact text; the D9 pattern).
//   M2a  _swimEntryState, called in the VM on a hand lattice, returns the typed {ok, blank, msg}:
//        blank or 0:00 500 on either goal -> the 500 prompt (500 rule first); blank 100 on the 100
//        goal -> the 100 prompt; 500 of 600 s with a 100 of 130 s -> the "faster than" message
//        (600/5 = 120 < 130); 616/90 and 600/120 -> ok; tri, mile, base and no goal -> ok; a field
//        that is not a finite number, or seconds >= 60 -> "not a real time", ahead of blank.
//   M2b  static: in doGenerate's body the _swimEntryState call and its refusal precede
//        showScreen('screenGenerate').
//   M2c  static write site census for base500: exactly 2 literal writes (the wizard's min and sec
//        inputs, base500Mins= and base500Secs=) plus exactly 1 slice 3 carry site, _put('base500',
//        which writes both fields through one call. 3 write sites in all.
//   M2d  doGenerate driven in the VM: a swim_500 goal with no current time is refused (no program
//        saved, the 500 prompt toasted); the same goal with 10:16 entered saves one program.
//   M2e  static copy: the swim label is "Your most recent timed <dist><unit>" (no "(optional)"),
//        the 100 goal's 500 block label and coach's line are present once each.
//   M2f  no "—", "–" or letter-hyphen-letter in any M2 string (the messages, labels and line).
//   P0   identity fuzz: V211 built twice from one cfg is identical (the P rows are not noise).
//   P1   run_pace_goal, NRC, bike and the untimed swim goals are byte-identical to V211, apart
//        from the swim INT note (D110a rewrites it). P1n: that note is the typed D110a text.
//   P2   on the swim time lattice every card other than a swim INT card is byte-identical to V211,
//        and every INT card keeps V211's rep count (D110a moves the clock, not the dose).
//   HM   HALF_MANNY digest, typed: 0ac7da6b1691a8e1 (ruled unmoved: an NRC run fixture).
//   CP   buildProgram leaves a swim time cfg byte-identical.
//   Later slices print NOT YET BUILT and are never PASS: notes, sheet, M2, D144.
//
// VERSION PREDICATE (standing ruling 4). D110a ships on ia-version 212.
//   below 212: NOT APPLICABLE, every row skipped by name, clean exit.
//   P0, P1, P2 and HM say "this build changed nothing else", so they run only for the build pair
//   (candidate 212, baseline V211) and print SCOPED OUT on a later candidate. L0..R4 and CP are
//   the ruling's own claims and enforce at every version from 212 up.
//   The V211 baseline is argv[3] when that file reads ia-version 211; otherwise it is read from
//   git at the V211 commit (6adba21). A pair row with no baseline FAILS.
// Measured, forced to 212 against V211 (SH rows added with slice 3; counts before that in brackets):
// V211 fails R1, R1k, R2, R3a, R3b, R3c, R4, N1, N2, N3, N4, P1n [PASS 10 FAIL 12]; slice 1 alone
// fails N1, N2, N3, N4, P1n [PASS 17 FAIL 5]; slices 1 and 2 [pass every row]. N5 passes on V211
// too: it guards the new copy, D109 already held. Final build (slices 1, 2, 3, 5, 5b, 6, 6b),
// measured: the build passes every row (PASS 52 FAIL 0); slices through 6 fail FL1 FL1 GT1 (PASS 49
// FAIL 3); V211 fails 38 rows (PASS 14 FAIL 38).
'use strict';
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const { load, fixtures, progDigest } = require(path.join(__dirname, '..', 'harness.js'));
const ART = process.argv[2] || path.join(__dirname, '..', '..', 'index.html');
const BASEFILE = process.argv[3] || null;
const IA = load(ART);
const VER = +IA.version;
const ERA = 212;
const PAIR = VER === ERA;
const V211_COMMIT = '6adba21f8214516ec8b743f8a76c76d835e76eb5';
const HM_DIGEST = '0ac7da6b1691a8e1';

let pass = 0, fail = 0, skip = 0, scoped = 0, nyb = 0;
function ok(label, cond, got){
  if(cond){ pass++; console.log('PASS ' + label); }
  else { fail++; console.log('FAIL ' + label + (got === undefined ? '' : ' (got ' + got + ')')); }
}
function eq(label, got, want){ ok(label + ' == ' + JSON.stringify(want), got === want, JSON.stringify(got)); }
function skipRow(label){ skip++; console.log('SKIP ' + label); }
function pairRow(label, cond, got){
  if(!PAIR){ scoped++; console.log('SCOPED OUT ' + label + ' [build pair 212/211 only; candidate is ' + VER + '] (now ' + got + ')'); return; }
  ok(label, cond, got);
}
function notYet(label){ nyb++; console.log('NOT YET BUILT ' + label); }
function summary(){
  console.log('\nSCOPED OUT ' + scoped + '  SKIP ' + skip + '  NOT YET BUILT ' + nyb);
  console.log('PASS ' + pass + ' FAIL ' + fail);
  process.exit(fail ? 1 : 0);
}
const LATER = [];
if(!(VER >= ERA)){
  console.log('NOT APPLICABLE: ia-version ' + VER + ' predates D110a (V' + ERA + ').');
  ['L0','R1','R1k','R2','R3a','R3b','R3c','R4','N1','N2','N3','N4','N5','SH0','SH1','SH2','SH3','SH4','SH5','SO1','SO2','D1','D2','D3','D4','D5','D6','D7','D8','FL1','GT1','GT1b','M2a','M2b','M2c','M2d','M2e','M2f','P0','P1','P1n','P2','HM','CP'].forEach(r => skipRow(r + ' skipped below the D110a era'));
  LATER.forEach(r => skipRow(r + ' skipped below the D110a era'));
  summary();
}

// ── the hand oracles ─────────────────────────────────────────────────────────────────────
const E_DEFAULT = { beginner: 150, intermediate: 120, advanced: 95 };      // 2:30 / 2:00 / 1:35 per 100
const RATE = { beginner: 4, intermediate: 3, advanced: 2 };                // s/100/wk
const AGE_SCALE = { '18-35': 1.0, '36-54': 0.85, '55+': 0.65 };
const DIST = { swim_500_time: 500, swim_100_time: 100 };
function handClock(sec){ const t = Math.round(sec); const r = t % 60; return ((t - r) / 60) + ':' + (r < 10 ? '0' + r : String(r)); }
const secs = s => { const m = /^(\d+):(\d\d)$/.exec(s || ''); return m ? (+m[1]) * 60 + (+m[2]) : NaN; };
// D144: the 100 goal names the split "this week's 500 pace"; the 500 goal keeps "goal split".
const DET_REP = /(\d+) x 100\S* at (\d+:\d+)\/100/, DET_SPLIT = /(?:goal split|500 pace) of (\d+:\d+)\/100/;
const SEG_REP = /\d+ x 100\S* at (\d+:\d+)\/100/, SEG_SPLIT = /(?:goal split|500 pace) of (\d+:\d+)\/100/;
const tot = (m, s) => (+m || 0) * 60 + (+s || 0);   // the ruled total: a missing limb is 0

const cl = o => JSON.parse(JSON.stringify(o));
function swimCfg(o){
  const c = cl(fixtures.HALF_MANNY);
  c.cardioTypes = ['swim']; c.experience = o.exp; c.ageBracket = o.age; c.seed = o.seed;
  c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  const g = { id: o.goal, label: o.goal, swimUnit: o.unit };
  if(o.tgt != null){ g.targetMins = String(Math.floor(o.tgt / 60)); g.targetSecs = String(o.tgt % 60); }
  if(o.base != null){ g.baseMins = String(Math.floor(o.base / 60)); g.baseSecs = String(o.base % 60); }
  if(o.b500 != null){ g.base500Mins = String(Math.floor(o.b500 / 60)); g.base500Secs = String(o.b500 % 60); }
  if(o.raw) Object.assign(g, o.raw);
  c.cardioGoals = { swim: g };
  return c;
}
const cardsOf = d => !d || !d.cardio ? [] : (Array.isArray(d.cardio) ? d.cardio : [d.cardio]);
const isInt = c => !!(c && c.type === 'swim' && /Interval/.test(String(c.subtype || '')));
function intCards(prog){
  const out = [];
  for(const wk of Object.keys(prog.weeks || {})) for(const d of Object.keys(prog.weeks[wk] || {}))
    for(const c of cardsOf(prog.weeks[wk][d])) if(isInt(c)) out.push({ w: +wk, d, c });
  return out.sort((a, b) => a.w - b.w);
}

// ── the swim time lattice ────────────────────────────────────────────────────────────────
const BASES = { swim_500_time: [null, 390, 480, 616, 750], swim_100_time: [null, 65, 90, 120, 150] };
const TGTS  = { swim_500_time: [345, 450, 480, 570, 660], swim_100_time: [58, 80, 90, 110, 140] };
const SEEDS = [76308, 1234, 99991];
const B500S = [null, 350, 480, 616, 750];   // D144: the 100 goal's 500 on file, rotated
// With a current 100 on file the 500 is kept CONSISTENT with it (500/5 >= the 100, the relation M2
// requires before a program is built): 500 = 5 x the 100 + one of these, or none (a persisted 100
// program from before D144). An inconsistent pair cannot reach the engine through the wizard.
const B500D = [null, 0, 25, 50, 100];
const LAT = [];
let li = 0;
for(const goal of ['swim_500_time', 'swim_100_time']) for(const exp of ['beginner', 'intermediate', 'advanced'])
  for(const age of ['18-35', '36-54', '55+']) for(const base of BASES[goal]) for(const tgt of TGTS[goal]){
    LAT.push({ goal, exp, age, base, tgt, unit: li % 2 ? 'm' : 'yd', seed: SEEDS[li % SEEDS.length],
      b500: goal !== 'swim_100_time' ? null : base == null ? B500S[li % B500S.length]
        : (B500D[li % B500D.length] == null ? null : base * 5 + B500D[li % B500D.length]) }); li++;
  }
// N3's edges: the ANCHOR field touched (the 500 goal's base, the 100 goal's base500, D144). 0:00 and
// 0: are worth nothing (the engine keeps the default); seconds only (45) is a total above 0 (5b).
const RAWS = { swim_500_time: [{ baseMins: '0', baseSecs: '0' }, { baseMins: '0', baseSecs: '' }, { baseMins: '', baseSecs: '45' }],
               swim_100_time: [{ base500Mins: '0', base500Secs: '0' }, { base500Mins: '0', base500Secs: '' }, { base500Mins: '', base500Secs: '45' }] };
for(const goal of ['swim_500_time', 'swim_100_time']) for(const exp of ['beginner', 'intermediate', 'advanced'])
  for(const age of ['18-35', '36-54', '55+']) for(const raw of RAWS[goal]){
    // a seconds-only 500 of 0:45 (9 s/100) is consistent with no current 100 only (M2: 500/5 >= the 100)
    LAT.push({ goal, exp, age, base: goal === 'swim_100_time' && raw.base500Secs !== '45' ? BASES[goal][1 + li % 4] : null, raw, tgt: TGTS[goal][li % 5], unit: li % 2 ? 'm' : 'yd', seed: SEEDS[li % SEEDS.length] }); li++;
  }
// The ruled predicate (coach, V212 slice 5b, superseding slice 2's "minutes entered AND total > 0"):
// "the minutes box is a limb, not the time." A current time counts when its total, minutes*60 +
// seconds with a missing limb as 0, is above zero. Typed from the ruling, not read from the engine.
// D144 (slice 6): the entered time that anchors is the 500 on both goals (the 100 goal's base500).
const anchorTotOf = (goal, g) => goal === 'swim_100_time' ? tot(g.base500Mins, g.base500Secs) : tot(g.baseMins, g.baseSecs);
const anchorEnteredOf = o => anchorTotOf(o.goal, swimCfg(o).cardioGoals.swim) > 0;
const DASH = t => /—|–/.test(t) || /[A-Za-z]-[A-Za-z]/.test(t);
const GOAL_MET_NOTE = 'INT: Your goal split is already within your current split. This block holds your split and builds your reps.';
const CAP8_TIME = 'INT: 100 repeats at your target split. Start at 4, build to 8. Hard cap at 8.';
const CAP8_DIST = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8.';
const DIST_NOTE = 'INT: 100 yard repeats. Start at 4, build to 8. Hard cap at 8. If pace drops significantly, end the session. Consistency between reps matters.';
const anchorLineOf = (goal, unit, exp) => 'No current 500' + unit + ' time was entered. This split starts from the ' + exp
  + ' default of ' + handClock(E_DEFAULT[exp]) + '/100, not from your own time. ';
const N = { swimNotes: 0, dampNote: 0, metNote: 0, anchorProgs: 0, zeroEntry: 0, cap8Time: 0, cap8Dist: 0 };
const nbad = { n1: [], n2: [], n3: [], n4: [], n5: [] };
const npush = (k, s) => { if(nbad[k].length < 6) nbad[k].push(s); nbad[k].n = (nbad[k].n || 0) + 1; };
function auditSwimNotes(prog, tag){
  for(const wk of Object.keys(prog.weeks || {})) for(const d of Object.keys(prog.weeks[wk] || {}))
    for(const c of cardsOf(prog.weeks[wk][d])){
      if(!c || c.type !== 'swim') continue;
      const t = String(c.note || ''); if(!t) continue;
      N.swimNotes++;
      if(/build to 10|cap at 10/i.test(t)) npush('n4', tag + ' W' + wk + ' ' + d + ' "' + t.slice(0, 70) + '"');
      if(t.indexOf(CAP8_TIME) >= 0) N.cap8Time++;
      if(t.indexOf(CAP8_DIST) >= 0) N.cap8Dist++;
      if(DASH(t)) npush('n5', tag + ' W' + wk + ' ' + d + ' "' + t.slice(0, 90) + '"');
    }
}

const R = { builds: 0, ints: 0, faster: 0, slower: 0, damp: 0, blank: 0, w1F: 0, w1S: 0, noW1: 0, steps: 0, met: 0, metCards: 0 };
const bad = { r1: [], r2: [], r3a: [], r3b: [], r3c: [], r4: [] };
const push = (k, s) => { if(bad[k].length < 6) bad[k].push(s); bad[k].n = (bad[k].n || 0) + 1; };
for(const o of LAT){
  const prog = IA.buildProgram(swimCfg(o)); R.builds++;
  const tw = Object.keys(prog.weeks || {}).length;
  const k = DIST[o.goal] / 100;
  const gIn = swimCfg(o).cardioGoals.swim, is100 = o.goal === 'swim_100_time';
  const aTot = anchorTotOf(o.goal, gIn), baseEntered = aTot > 0;
  const E = baseEntered ? aTot / 5 : E_DEFAULT[o.exp];
  const cur100 = is100 ? tot(gIn.baseMins, gIn.baseSecs) : 0;
  const gap = is100 && cur100 > 0 ? cur100 - o.tgt : 0;
  const T = is100 ? (gap >= E ? E : E - gap) : o.tgt / k;   // D144: the 100 gap moves the 500 pace; floor at E (6b)
  const rate = RATE[o.exp] * AGE_SCALE[o.age];
  const met = T >= E;
  const r = met ? 0 : Math.min((E - T) / tw, rate);
  const damp = !met && (E - T) / tw > rate + 0.05;
  const tag = o.goal + ' ' + o.exp + ' ' + o.age + ' base ' + o.base + ' tgt ' + o.tgt + ' seed ' + o.seed;
  if(!baseEntered) R.blank++;
  if(met) R.slower++; else R.faster++;
  if(damp) R.damp++;
  if(met) R.met++;
  const cs = intCards(prog);
  R.ints += cs.length;
  const byWeek = new Map();
  for(const x of cs){
    const det = String(x.c.detail || '');
    const mR = det.match(DET_REP), mS = det.match(DET_SPLIT);
    const split = mS ? mS[1] : null, rep = mR ? mR[2] : null;
    // R2 — Guide A p12, from the printed split alone, in the detail and in the Main set segment
    const wantRep = split ? handClock(secs(split) - 2) : '?';
    if(!split || rep !== wantRep) push('r2', tag + ' W' + x.w + ' detail rep ' + rep + ' split ' + split + ' want ' + wantRep);
    const main = (x.c.segments || []).find(s => /main/i.test(s.label || ''));
    if(main){
      const sR = String(main.text || '').match(SEG_REP), sS = String(main.text || '').match(SEG_SPLIT);
      if(!sR || !sS || sS[1] !== split || sR[1] !== wantRep) push('r2', tag + ' W' + x.w + ' Main set rep ' + (sR && sR[1]) + ' split ' + (sS && sS[1]) + ' want ' + wantRep + ' at ' + split);
    }
    // R3b — the hand model, within the two roundings (tenths store 0.05 + whole clock 0.5)
    const model = E - r * (x.w - 1);
    if(!split || Math.abs(secs(split) - model) > 0.55) push('r3b', tag + ' W' + x.w + ' split ' + split + ' model ' + model.toFixed(2) + ' (E ' + E + ' r ' + r.toFixed(3) + ' tw ' + tw + ')');
    // R4 — goal met holds at E
    if(met){ R.metCards++;
      if(split !== handClock(E) || rep !== handClock(E - 2)) push('r4', tag + ' W' + x.w + ' split ' + split + ' rep ' + rep + ' want ' + handClock(E) + ' / ' + handClock(E - 2)); }
    if(split && !byWeek.has(x.w)) byWeek.set(x.w, secs(split));
  }
  // R1 — week 1 is clock(E)
  if(byWeek.has(1)){
    if(met) R.w1S++; else R.w1F++;
    if(byWeek.get(1) !== secs(handClock(E))) push('r1', tag + ' W1 split ' + handClock(byWeek.get(1)) + ' want ' + handClock(E));
  } else R.noW1++;
  // R3a — consecutive printed steps <= rate + 1
  const wks = [...byWeek.keys()].sort((a, b) => a - b);
  for(let i = 1; i < wks.length; i++) if(wks[i] === wks[i - 1] + 1){
    R.steps++;
    const st = byWeek.get(wks[i - 1]) - byWeek.get(wks[i]);
    if(st > rate + 1 || st < 0) push('r3a', tag + ' W' + wks[i - 1] + '->W' + wks[i] + ' step ' + st + ' rate ' + rate);
  }
  // N1 / N2 / N3 — the INT notes of this program
  auditSwimNotes(prog, tag);
  const printed = new Set([...byWeek.values()].map(handClock));
  const notes = cs.map(x => String(x.c.note || ''));
  if(damp){
    const m = notes.map(t => t.match(/target for this block is (\d+:\d\d)\/100/)).find(Boolean);
    if(m && printed.has(m[1])) N.dampNote++;
    else npush('n1', tag + ' block target ' + (m ? m[1] : 'NO NOTE') + ' printed splits ' + [...printed].join(','));
  }
  const metHits = notes.filter(t => t.indexOf(GOAL_MET_NOTE) >= 0).length;
  if(met ? metHits !== notes.length || !notes.length : metHits !== 0) npush('n2', tag + ' goal met ' + met + ' but ' + metHits + ' of ' + notes.length + ' INT notes say so');
  else if(met) N.metNote++;
  const want = anchorLineOf(o.goal, o.unit, o.exp) + 'INT: ';
  const opened = notes.filter(t => t.indexOf(want) === 0).length, anyNo = notes.filter(t => /No current/.test(t)).length;
  if(!baseEntered){
    if(opened !== notes.length || !notes.length) npush('n3', tag + ' ' + JSON.stringify(o.raw || {}) + ' blank: ' + opened + ' of ' + notes.length + ' notes open with "' + want.slice(0, 60) + '"; first: ' + (notes[0] || '').slice(0, 80));
    else { N.anchorProgs++; if(o.raw) N.zeroEntry++; }
  } else if(anyNo) npush('n3', tag + ' current time entered but ' + anyNo + ' notes say "No current"');
  // R3c — dampened: the drop over the INT block is the table rate x weeks
  if(damp && wks.length >= 2){
    const w0 = wks[0], w1 = wks[wks.length - 1];
    const drop = byWeek.get(w0) - byWeek.get(w1), want = rate * (w1 - w0);
    if(Math.abs(drop - want) > 1.1) push('r3c', tag + ' W' + w0 + '->W' + w1 + ' drop ' + drop + ' want ' + want.toFixed(2) + ' (rate ' + rate + ')');
  }
}
const n = k => bad[k].n || 0;
ok('L0 the swim time lattice built ' + R.builds + ' programs with ' + R.ints + ' INT cards: ' + R.faster + ' faster goals (' + R.damp + ' out of reach), '
   + R.slower + ' goals at or slower than current, ' + R.blank + ' with no current time',
   R.builds === LAT.length && R.ints >= R.builds * 3 && R.faster >= 100 && R.slower >= 100 && R.damp >= 50 && R.blank >= 50 && R.steps >= 500,
   JSON.stringify(R));
ok('R1 week 1 prints the goal split clock(E) from the wizard contract (' + R.w1F + ' faster goals, ' + R.w1S + ' slower goals; ' + R.noW1 + ' with no week 1 INT)',
   n('r1') === 0 && R.w1F >= 100 && R.w1S >= 100, n('r1') + ' bad: ' + bad.r1.join(' | '));
ok('R2 every INT rep split is clock(printed goal split - 2), Guide A p12 (' + R.ints + ' cards, detail and Main set)',
   n('r2') === 0, n('r2') + ' bad: ' + bad.r2.join(' | '));
ok('R3a every consecutive week step is at most the hand rate {4,3,2}x{1.0,0.85,0.65} + 1 s (' + R.steps + ' steps)',
   n('r3a') === 0, n('r3a') + ' bad: ' + bad.r3a.join(' | '));
ok('R3b every printed goal split is the hand model E - r(w-1), r = min((E-T)/tw, rate), within 0.55 s',
   n('r3b') === 0, n('r3b') + ' bad: ' + bad.r3b.join(' | '));
ok('R3c where the goal is out of reach (' + R.damp + ' builds) the split falls by the table rate each week (drop over the INT block within 1.1 s)',
   n('r3c') === 0, n('r3c') + ' bad: ' + bad.r3c.join(' | '));
ok('R4 a goal at or slower than current holds at E: ' + R.met + ' builds, ' + R.metCards + ' INT cards print clock(E) and clock(E-2)',
   n('r4') === 0 && R.met >= 100, n('r4') + ' bad: ' + bad.r4.join(' | '));

// ── N rows (slice 2, the notes) ──────────────────────────────────────────────────────────
const DLAT = [];
for(const exp of ['beginner', 'intermediate', 'advanced']) for(const seed of SEEDS){
  for(const id of ['swim_mile', 'swim_tri', 'swim_base']) DLAT.push([id, (() => { const c = swimCfg({ goal: id, exp, age: '18-35', base: null, tgt: null, unit: 'yd', seed });
    c.cardioGoals.swim = { id, label: id, baselineDist: '1000', baseline: '1000m' }; return c; })()]);
  for(const g of ['swim_500_time', 'swim_100_time']) DLAT.push([g + ' no goal time', swimCfg({ goal: g, exp, age: '36-54', base: 300, tgt: null, unit: 'm', seed })]);
}
for(const [lbl, c] of DLAT) auditSwimNotes(IA.buildProgram(c), lbl + ' ' + c.experience + ' seed ' + c.seed);
const nn = k => nbad[k].n || 0;
ok('N1 where the goal is out of reach, the note\'s block target is a split printed on the same program (' + N.dampNote + ' of ' + R.damp + ' builds)',
   nn('n1') === 0 && N.dampNote === R.damp && R.damp >= 50, nn('n1') + ' bad: ' + nbad.n1.join(' | '));
ok('N2 the goal met note prints on every INT card iff T >= E (' + N.metNote + ' of ' + R.met + ' goal met builds; none elsewhere)',
   nn('n2') === 0 && N.metNote === R.met && R.met >= 100, nn('n2') + ' bad: ' + nbad.n2.join(' | '));
ok('N3 with no current time entered every INT note opens with the typed default line, 2:30 / 2:00 / 1:35 (' + N.anchorProgs + ' of ' + R.blank
   + ' builds, ' + N.zeroEntry + ' of them a 0:00 or minutes-less entry); with one entered, no note says "No current"',
   nn('n3') === 0 && N.anchorProgs === R.blank && N.zeroEntry === LAT.filter(o => o.raw && !anchorEnteredOf(o)).length, nn('n3') + ' bad: ' + nbad.n3.join(' | '));
ok('N4 no swim note says "build to 10" or "cap at 10" (' + N.swimNotes + ' swim notes; "build to 8. Hard cap at 8." on ' + N.cap8Time + ' time goal and ' + N.cap8Dist + ' distance goal notes)',
   nn('n4') === 0 && N.cap8Time >= 100 && N.cap8Dist >= 20, nn('n4') + ' bad: ' + nbad.n4.join(' | '));
ok('N5 no swim note carries "—", "–" or letter-hyphen-letter (' + N.swimNotes + ' swim notes)', nn('n5') === 0 && N.swimNotes >= 1000, nn('n5') + ' bad: ' + nbad.n5.join(' | '));

// R1k — Guide A p12's worked example, typed: 500 in 10:30 is 2:06 per 100, the rep is 2:04.
{
  const p = IA.buildProgram(swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', base: 630, tgt: 540, unit: 'yd', seed: 76308 }));
  const w1 = intCards(p).find(x => x.w === 1);
  const det = w1 ? String(w1.c.detail || '') : '';
  ok('R1k the Guide A worked example (500 yd in 10:30, goal 9:00) builds a week 1 INT card', !!w1, det.slice(0, 40));
  eq('R1k Guide A p12: week 1 goal split for 10:30 / 500', (det.match(DET_SPLIT) || [])[1], '2:06');
  eq('R1k Guide A p12: week 1 rep split is the goal split minus 2 s', (det.match(DET_REP) || [])[2], '2:04');
}

// CP — cfg purity on a swim time cfg (S2 reassigns the target; it must stay local)
{
  const c = swimCfg({ goal: 'swim_500_time', exp: 'beginner', age: '18-35', base: 390, tgt: 450, unit: 'yd', seed: 76308 });
  const before = JSON.stringify(c); IA.buildProgram(c);
  ok('CP buildProgram left a slower goal swim cfg byte-identical', JSON.stringify(c) === before, JSON.stringify(c).slice(0, 160));
}

// ── the V211 baseline (build-pair rows only) ─────────────────────────────────────────────
// (D4 and D5 run after the baseline loads; see below.)
let BASE = null, baseWhy = '';
if(PAIR){
  if(BASEFILE && fs.existsSync(BASEFILE)){ const b = load(BASEFILE); if(+b.version === 211){ BASE = b; baseWhy = 'argv baseline ' + BASEFILE; } else baseWhy = 'argv baseline reads ' + b.version + ', not 211; '; }
  if(!BASE){
    try {
      const repo = path.join(__dirname, '..', '..');
      const f = path.join(os.tmpdir(), 'g212_v211_' + process.pid + '.html'); try { fs.unlinkSync(f); } catch(e) {}
      fs.writeFileSync(f, cp.execFileSync('git', ['-C', repo, 'show', V211_COMMIT + ':index.html'], { maxBuffer: 1 << 26 }));
      const b = load(f); if(+b.version === 211){ BASE = b; baseWhy += 'git ' + V211_COMMIT.slice(0, 7); } else baseWhy += 'git copy reads ' + b.version;
      try { fs.unlinkSync(f); } catch(e) {}
    } catch(e) { baseWhy += 'git show failed: ' + String(e.message).slice(0, 80); }
  }
  console.log('baseline: ' + (BASE ? 'V211 from ' + baseWhy : 'UNAVAILABLE (' + baseWhy + ')'));
}

// P1 configs: every limb D110a must not reach
const PACE = { id: 'run_pace_goal', label: 'Hit a Pace / Time Goal', mileBestMins: '8', mileBestSecs: '15', mileBestSrc: { kind: 'entered' }, targetDist: '1.5', targetMins: '11', targetSecs: '0', paceUnit: 'mi' };
const BIKE_FTP = { id: 'bike_ftp', label: 'Improve FTP / Power', baseline: '200w', baselineDist: '20' };
const BIKE_BASE = { id: 'bike_base', label: 'Base', baselineDist: '10', baseline: '10mi' };
const SW = id => ({ id, label: id, baselineDist: '1000', baseline: '1000m' });
function nswCfg(goals, exp, seed){
  const c = cl(fixtures.HALF_MANNY); c.primaryPath = 'goal'; c.eventTargeted = false; delete c.raceDate;
  c.cardioTypes = Object.keys(goals); c.cardioGoals = cl(goals); c.experience = exp; c.seed = seed; return c;
}
function nrcCfg(plan, extra, exp, seed){
  const c = cl(fixtures.HALF_MANNY); c.cardioGoals = { run: Object.assign(cl(c.cardioGoals.run), { id: plan, label: plan }) };
  c.cardioTypes = ['run']; for(const k of Object.keys(extra || {})){ c.cardioTypes.push(k); c.cardioGoals[k] = cl(extra[k]); }
  c.experience = exp; c.seed = seed; return c;
}
const P1 = [];
for(const exp of ['beginner', 'intermediate', 'advanced']) for(const seed of [76308, 1234]){
  P1.push(['run_pace_goal', nswCfg({ run: PACE }, exp, seed)]);
  P1.push(['run_pace_goal + bike', nswCfg({ run: PACE, bike: BIKE_BASE }, exp, seed)]);
  P1.push(['run_pace_goal + swim_base', nswCfg({ run: PACE, swim: SW('swim_base') }, exp, seed)]);
  P1.push(['NRC run_half', nrcCfg('run_half', null, exp, seed)]);
  P1.push(['NRC run_5k + swim_mile', nrcCfg('run_5k', { swim: SW('swim_mile') }, exp, seed)]);
  P1.push(['NRC run_10k + bike_ftp', nrcCfg('run_10k', { bike: BIKE_FTP }, exp, seed)]);
  P1.push(['bike_ftp', nswCfg({ bike: BIKE_FTP }, exp, seed)]);
  P1.push(['bike_base', nswCfg({ bike: BIKE_BASE }, exp, seed)]);
  for(const s of ['swim_base', 'swim_mile', 'swim_tri']) P1.push([s, nswCfg({ swim: SW(s) }, exp, seed)]);
  P1.push(['swim_500_time with no goal time', swimCfg({ goal: 'swim_500_time', exp, age: '18-35', base: 600, tgt: null, unit: 'yd', seed })]);
}
const W = (I, c) => JSON.stringify(I.buildProgram(cl(c)).weeks);
// P1 strips the swim INT note only: D110a rewrites the distance goal INT note (build to 8).
let p1n = 0; const p1nBad = [];
const WN = (I, c, audit) => { const w = I.buildProgram(cl(c)).weeks;
  for(const wk of Object.keys(w)) for(const d of Object.keys(w[wk])) for(const x of cardsOf(w[wk][d])) if(isInt(x)){
    if(audit){ p1n++; if(String(x.note || '').indexOf(DIST_NOTE) !== 0 && p1nBad.length < 5) p1nBad.push(c.cardioGoals.swim.id + ' W' + wk + ' "' + String(x.note || '').slice(0, 70) + '"'); }
    delete x.note; }
  return JSON.stringify(w); };
{
  let g0 = 0, g0bad = [], p1 = 0, p1bad = [];
  if(BASE){
    for(const [lbl, c] of P1.slice(0, 12)){ g0++; if(W(BASE, c) !== W(BASE, c) && g0bad.length < 5) g0bad.push(lbl); }
    for(const [lbl, c] of P1){ p1++; if(WN(IA, c, true) !== WN(BASE, c, false) && p1bad.length < 8) p1bad.push(lbl + ' ' + c.experience + ' seed ' + c.seed); }
  }
  pairRow('P0 identity fuzz: V211 built twice from one cfg is byte-identical (' + g0 + ' cfgs)', !!BASE && g0 >= 12 && g0bad.length === 0, BASE ? g0bad.join(' | ') : 'NO BASELINE');
  pairRow('P1 run_pace_goal, NRC, bike and untimed swim goals byte-identical to V211 apart from the swim INT note (' + p1 + ' builds)', !!BASE && p1 >= 60 && p1bad.length === 0, BASE ? p1bad.join(' | ') : 'NO BASELINE');
  pairRow('P1n every swim INT note on those builds opens with the typed D110a distance note, build to 8 (' + p1n + ' cards)', !!BASE && p1n >= 20 && p1nBad.length === 0, BASE ? p1nBad.join(' | ') : 'NO BASELINE');
}
// P2 — the swim time lattice: only swim INT cards move, and they keep V211's rep count
{
  let days = 0, ints = 0; const dayBad = [], repBad = [];
  if(BASE) for(const o of LAT){
    const a = IA.buildProgram(swimCfg(o)), b = BASE.buildProgram(swimCfg(o));
    const tag = o.goal + ' ' + o.exp + ' ' + o.age + ' base ' + o.base + ' tgt ' + o.tgt;
    for(const wk of Object.keys(b.weeks || {})) for(const d of Object.keys(b.weeks[wk] || {})){
      const da = (a.weeks[wk] || {})[d], db = b.weeks[wk][d];
      const strip = day => { if(!day) return day; const x = cl(day);
        if(x.cardio) x.cardio = Array.isArray(x.cardio) ? x.cardio.map(c => isInt(c) ? 'INT' : c) : (isInt(x.cardio) ? 'INT' : x.cardio);
        return JSON.stringify(x); };
      days++;
      if(strip(da) !== strip(db) && dayBad.length < 6) dayBad.push(tag + ' W' + wk + ' ' + d);
      const ia = cardsOf(da).filter(isInt), ib = cardsOf(db).filter(isInt);
      for(let i = 0; i < Math.max(ia.length, ib.length); i++){ ints++;
        const ra = ia[i] && (String(ia[i].detail || '').match(DET_REP) || [])[1], rb = ib[i] && (String(ib[i].detail || '').match(DET_REP) || [])[1];
        if(!ra || ra !== rb){ if(repBad.length < 6) repBad.push(tag + ' W' + wk + ' ' + d + ' reps ' + ra + ' vs ' + rb); } }
    }
    if(Object.keys(a.weeks || {}).length !== Object.keys(b.weeks || {}).length && dayBad.length < 6) dayBad.push(tag + ' program length moved');
  }
  pairRow('P2 on the swim time lattice every card other than a swim INT card is byte-identical to V211 (' + days + ' days)', !!BASE && days > 1000 && dayBad.length === 0, BASE ? dayBad.join(' | ') : 'NO BASELINE');
  pairRow('P2 every swim INT card keeps V211\'s rep count (' + ints + ' cards)', !!BASE && ints > 1000 && repBad.length === 0, BASE ? repBad.join(' | ') : 'NO BASELINE');
}
{
  const hm = progDigest(IA.buildProgram(cl(fixtures.HALF_MANNY)));
  // D4 — slice 6 leaves the 500 goal untouched (pre-slice references, see the header)
  const mk5 = o => swimCfg(Object.assign({ goal: 'swim_500_time', unit: 'yd', seed: 76308 }, o));
  const d4c = progDigest(IA.buildProgram(mk5({ exp: 'intermediate', age: '18-35', base: 616, tgt: 240 })));
  const d4a = progDigest(IA.buildProgram(mk5({ exp: 'intermediate', age: '36-54', base: 600, tgt: 540 })));
  const hh = require('crypto').createHash('sha256'); let n4 = 0;
  for(const exp of ['beginner', 'intermediate', 'advanced']) for(const age of ['18-35', '36-54', '55+']) for(const base of [null, 390, 480, 616, 750])
    for(const tgt of [345, 450, 480, 570, 660]) for(const unit of ['yd', 'm']){ hh.update(progDigest(IA.buildProgram(mk5({ exp, age, base, tgt, unit, seed: 1234 }))) + '|'); n4++; }
  const d4l = hh.digest('hex').slice(0, 16);
  pairRow('D4 the 500 goal is untouched by D144: C7c fixture 63fe1fbf0fc44790, athlete A 402d3dde836e875c, 500 lattice (' + n4 + ' builds) e986019e9b9afa7d',
     d4c === '63fe1fbf0fc44790' && d4a === '402d3dde836e875c' && d4l === 'e986019e9b9afa7d', d4c + ' / ' + d4a + ' / ' + d4l);
  // D5 — base500 never reaches the sizer: swim_100_time program length is V211's
  let n5 = 0; const d5bad = [];
  if(BASE) for(const o of LAT.filter(x => x.goal === 'swim_100_time')){ n5++;
    const a = IA.buildProgram(swimCfg(o)).totalWeeks, b = BASE.buildProgram(swimCfg(o)).totalWeeks;
    if(a !== b && d5bad.length < 5) d5bad.push(o.exp + ' ' + o.age + ' base ' + o.base + ' b500 ' + o.b500 + ' tgt ' + o.tgt + ': ' + a + ' vs ' + b); }
  const gtCfg = swimCfg({ goal: 'swim_100_time', exp: 'intermediate', age: '18-35', base: null, tgt: null, unit: 'yd', seed: 76308 });
  gtCfg.cardioGoals.swim = { id: 'swim_100_time', label: 'x', swimUnit: 'yd', base500Mins: '5', base500Secs: '0', baseSecs: '58', targetSecs: '55' };   // GT1's cfg
  const gtA = IA.buildProgram(cl(gtCfg)).totalWeeks, gtB = BASE ? BASE.buildProgram(cl(gtCfg)).totalWeeks : -1;
  pairRow('GT1b the seconds-only goal leaves program length at V211\'s (' + gtA + ' vs ' + gtB + '; the sizer readers are D157, unchanged)', !!BASE && gtA === gtB && gtA > 0, gtA + ' vs ' + gtB);
  pairRow('D5 swim_100_time program length is identical to V211 on ' + n5 + ' builds, most with a base500 on file', !!BASE && n5 >= 200 && d5bad.length === 0, BASE ? d5bad.join(' | ') : 'NO BASELINE');
  pairRow('HM HALF_MANNY digest is the typed ' + HM_DIGEST + ' (ruled unmoved: an NRC run fixture has no swim time goal)', hm === HM_DIGEST, hm);
}

// ── SH rows (slice 3, the goal sheet) — run last: they write the VM's localStorage ───────────
{
  const SWIMMER_B_DIGEST = 'a0f2e847ed9473d7';
  const KEYS = ['swimUnit', 'baseMins', 'baseSecs', 'base500Mins', 'base500Secs'];
  const pick = g => { const o = {}; for(const k of KEYS) if(g && g[k] !== undefined) o[k] = g[k]; return JSON.stringify(o); };
  const B500 = { id: 'swim_500_time', label: 'Improve 500 Time', swimUnit: 'm', baseMins: '10', baseSecs: '16', targetMins: '9', targetSecs: '30' };
  const C100 = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', baseMins: '1', baseSecs: '45', base500Mins: '9', base500Secs: '50', targetMins: '1', targetSecs: '30' };
  const C100only = { id: 'swim_100_time', label: 'Improve 100 Time', swimUnit: 'yd', baseMins: '1', baseSecs: '45', targetMins: '1', targetSecs: '30' };
  const TRI = { id: 'swim_tri', label: 'Triathlon Swim', baselineDist: '1000', baseline: '1000m', swimUnit: 'm' };
  // [label, prev goal, new goal, target, the hand table's carried keys]
  const CASES = [
    ['500->500 (swimmer B)', B500, 'swim_500_time', ['9', '0'], { swimUnit: 'm', baseMins: '10', baseSecs: '16' }],
    ['500->100', B500, 'swim_100_time', ['1', '50'], { swimUnit: 'm', base500Mins: '10', base500Secs: '16' }],
    ['100->500 with a 500 time', C100, 'swim_500_time', ['9', '0'], { swimUnit: 'yd', baseMins: '9', baseSecs: '50' }],
    ['100->500 current 100 only', C100only, 'swim_500_time', ['9', '0'], { swimUnit: 'yd' }],
    ['100->100', C100, 'swim_100_time', ['1', '25'], { swimUnit: 'yd', baseMins: '1', baseSecs: '45', base500Mins: '9', base500Secs: '50' }],
    ['tri->500', TRI, 'swim_500_time', ['9', '0'], { swimUnit: 'm' }],
  ];
  const baseCfg = goal => { const c = swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', base: null, tgt: 570, unit: 'm', seed: 76308 });
    c.cardioGoals = { swim: cl(goal) }; return c; };
  let reached = 0; const sh0 = [], sh1 = [], sh2 = [], out = {};
  for(const [lbl, prev, sel, tgt, want] of CASES){
    const c = baseCfg(prev); const pr = IA.buildProgram(cl(c)); pr.id = 'p_g212'; pr.cfg = cl(c);
    IA.localStorage.setItem('ia_programs', JSON.stringify([pr]));
    IA.eval("_goalDraft={progId:'p_g212',sport:'swim',sel:'" + sel + "',inputs:{targetMins:'" + tgt[0] + "',targetSecs:'" + tgt[1] + "'}};");
    let err = ''; try { IA.eval('commitGoalChange()'); } catch(e) { err = String(e && e.message || e).slice(0, 60); }
    let saved = null; try { saved = JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg; } catch(e) {}
    const g = saved && saved.cardioGoals && saved.cardioGoals.swim;
    if(g && g.id === sel && g.targetMins === tgt[0]) reached++; else sh0.push(lbl + ' no write' + (err ? ' (throw ' + err + ')' : ''));
    if(prev.swimUnit && (!g || g.swimUnit !== prev.swimUnit)) sh1.push(lbl + ' unit ' + (g && g.swimUnit) + ' want ' + prev.swimUnit);
    if(pick(g) !== JSON.stringify(want)) sh2.push(lbl + ' wrote ' + pick(g) + ' want ' + JSON.stringify(want));
    out[lbl] = saved;
  }
  ok('SH0 commitGoalChange reached the save on every case (' + reached + ' of ' + CASES.length + ')', reached === CASES.length, sh0.join(' | '));
  ok('SH1 the pool unit carries on every swim goal switch (' + CASES.length + ' cases)', sh1.length === 0, sh1.join(' | '));
  ok('SH2 the current times written are exactly the hand table: a 500 time goes where a 500 lives, a current 100 only to a 100 goal, nothing absent',
     sh2.length === 0, sh2.join(' | '));
  const firstIntW1 = prog => { const cs = intCards(prog).filter(x => x.w === 1); return cs.length ? cs[0].c : null; };
  const c3 = out['100->500 current 100 only'];
  const n3 = c3 ? String((firstIntW1(IA.buildProgram(cl(c3))) || {}).note || '') : '';
  ok('SH3 a 100 goal switched to a 500 with no 500 time prints the typed no current time line', n3.indexOf(anchorLineOf('swim_500_time', 'yd', 'intermediate')) === 0, n3.slice(0, 90));
  const cB = out['500->500 (swimmer B)'];
  const pB = cB ? IA.buildProgram(cl(cB)) : null;
  const dB = pB ? String((firstIntW1(pB) || {}).detail || '') : '';
  ok('SH4 swimmer B rebuilt: week 1 prints "x 100m at 2:01/100" at a goal split of 2:03 (10:16 / 500 m = 123.2, minus 2)',
     /x 100m at 2:01\/100/.test(dB) && /goal split of 2:03\/100/.test(dB), dB.slice(0, 120));
  const hB = pB ? progDigest(pB) : 'NO BUILD';
  pairRow('SH5 swimmer B rebuilt digest is coach\'s surgery print ' + SWIMMER_B_DIGEST, hB === SWIMMER_B_DIGEST, hB);
  // SO2 — a seconds-only current time carries, both limbs as stored
  const SO = [['100->100, minutes box empty', { id: 'swim_100_time', label: 'x', swimUnit: 'yd', baseMins: '', baseSecs: '58', targetMins: '0', targetSecs: '55' }, 'swim_100_time', ['0', '54'], { swimUnit: 'yd', baseMins: '', baseSecs: '58' }],
              ['100->100, no minutes key', { id: 'swim_100_time', label: 'x', swimUnit: 'yd', baseSecs: '58', targetMins: '0', targetSecs: '55' }, 'swim_100_time', ['0', '54'], { swimUnit: 'yd', baseSecs: '58' }]];
  const so2 = [];
  for(const [lbl, prev, sel, tgt, want] of SO){
    const c = baseCfg(prev); const pr = IA.buildProgram(cl(c)); pr.id = 'p_g212'; pr.cfg = cl(c);
    IA.localStorage.setItem('ia_programs', JSON.stringify([pr]));
    IA.eval("_goalDraft={progId:'p_g212',sport:'swim',sel:'" + sel + "',inputs:{targetMins:'" + tgt[0] + "',targetSecs:'" + tgt[1] + "'}};");
    try { IA.eval('commitGoalChange()'); } catch(e) {}
    let g = null; try { g = JSON.parse(IA.localStorage.getItem('ia_programs'))[0].cfg.cardioGoals.swim; } catch(e) {}
    if(pick(g) !== JSON.stringify(want)) so2.push(lbl + ' wrote ' + pick(g) + ' want ' + JSON.stringify(want));
  }
  ok('SO2 the goal sheet carries a seconds-only current 100 (58 s), both limbs as stored (' + SO.length + ' cases)', so2.length === 0, so2.join(' | '));
}
// SO1 — a seconds-only current 100 is read as entered (D144 form: it sets the gap)
{
  const c = swimCfg({ goal: 'swim_100_time', exp: 'intermediate', age: '18-35', base: null, b500: 300, tgt: 55, unit: 'yd', seed: 76308, raw: { baseMins: '', baseSecs: '58' } });
  const cs = intCards(IA.buildProgram(c)), w1 = cs.find(x => x.w === 1);
  const det = w1 ? String(w1.c.detail || '') : '', nts = cs.map(x => String(x.c.note || ''));
  const split = (det.match(DET_SPLIT) || [])[1];
  const last = cs.length ? (String(cs[cs.length - 1].c.detail || '').match(DET_SPLIT) || [])[1] : null;
  ok('SO1 a seconds-only current 100 (minutes box empty, 0:58; 500 of 5:00; goal 0:55) is read as entered: week 1 anchors on 1:00, the gap applies (no goal met note, last split ' + last + ' under 1:00), no note says "No current" (' + cs.length + ' INT cards)',
     !!w1 && split === '1:00' && secs(last) < 60 && !nts.some(t => t.indexOf(GOAL_MET_NOTE) >= 0) && !nts.some(t => /No current/.test(t)),
     'W1 split ' + split + '; ' + nts.filter(t => /No current/.test(t)).length + ' notes say No current; ' + nts.filter(t => t.indexOf(GOAL_MET_NOTE) >= 0).length + ' goal met');
}
// D1-D7 — D144, coach's hand oracle
{
  const g100 = (x, exp) => { const c = swimCfg({ goal: 'swim_100_time', exp: exp || 'intermediate', age: '18-35', base: null, tgt: null, unit: 'yd', seed: 76308 });
    c.cardioGoals.swim = Object.assign({ id: 'swim_100_time', label: 'x', swimUnit: 'yd' }, x); return c; };
  const splitsOf = prog => intCards(prog).map(x => ({ w: x.w, s: (String(x.c.detail || '').match(DET_SPLIT) || [])[1], r: (String(x.c.detail || '').match(DET_REP) || [])[2], n: String(x.c.note || ''), c: x.c }));
  // D1
  const p1 = IA.buildProgram(g100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '30', targetMins: '1', targetSecs: '20' }));
  const tw1 = Object.keys(p1.weeks).length, s1 = splitsOf(p1), w1 = s1.find(x => x.w === 1);
  const E1 = 616 / 5, gap1 = 90 - 80, r1 = Math.min(gap1 / tw1, 3);
  const off1 = s1.filter(x => Math.abs(secs(x.s) - (E1 - r1 * (x.w - 1))) > 0.55).map(x => 'W' + x.w + ' ' + x.s);
  const byW1 = new Map(); s1.forEach(x => { if(!byW1.has(x.w)) byW1.set(x.w, secs(x.s)); });
  const ws1 = [...byW1.keys()].sort((a, b) => a - b); let maxStep1 = 0;
  for(let i = 1; i < ws1.length; i++) if(ws1[i] === ws1[i - 1] + 1) maxStep1 = Math.max(maxStep1, byW1.get(ws1[i - 1]) - byW1.get(ws1[i]));
  ok('D1 500 10:16 / 100 1:30 / goal 1:20: week 1 split 2:03 (616/5) and rep 2:01', !!w1 && w1.s === '2:03' && w1.r === '2:01', w1 ? w1.s + ' / ' + w1.r : 'NO W1');
  ok('D1 every split is on the hand line 123.2 - (10/' + tw1 + ')(w-1) heading for 113.2 (1:53), steps <= 3 (max ' + maxStep1 + ', ' + s1.length + ' cards)',
     s1.length >= 3 && off1.length === 0 && maxStep1 <= 3 && handClock(E1 - gap1) === '1:53', off1.join(', '));
  // D2
  const s2 = splitsOf(IA.buildProgram(g100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '20', targetMins: '1', targetSecs: '30' })));
  ok('D2 current 100 1:20, goal 1:30: every split 2:03 and every note the goal met note (' + s2.length + ' cards)',
     s2.length >= 3 && s2.every(x => x.s === '2:03' && x.n.indexOf(GOAL_MET_NOTE) >= 0), s2.map(x => x.s).join(','));
  // D3
  const LINE3 = 'No current 500yd time was entered. This split starts from the intermediate default of 2:00/100, not from your own time. ';
  const s3 = splitsOf(IA.buildProgram(g100({ baseMins: '1', baseSecs: '30', targetMins: '1', targetSecs: '20' })));
  ok('D3 no 500 on file: week 1 split 2:00 and every note opens with the typed 500 anchor line (' + s3.length + ' cards)',
     s3.length >= 3 && s3[0].s === '2:00' && s3.every(x => x.n.indexOf(LINE3) === 0), (s3[0] || {}).n);
  const s3b = splitsOf(IA.buildProgram(g100({ targetMins: '1', targetSecs: '20' })));
  ok('D3 a 100 program with neither time holds at 2:00 with the anchor line and the goal met note (' + s3b.length + ' cards)',
     s3b.length >= 3 && s3b.every(x => x.s === '2:00' && x.n.indexOf(LINE3 + GOAL_MET_NOTE) === 0), s3b.map(x => x.s).join(','));
  // D6 — the 100 goal copy
  const m1 = w1 ? (w1.c.segments || []).find(z => /main/i.test(z.label || '')) : null;
  const all100 = LAT.filter(o => o.goal === 'swim_100_time').slice(0, 30).flatMap(o => intCards(IA.buildProgram(swimCfg(o))).map(x => x.c));
  const all500 = LAT.filter(o => o.goal === 'swim_500_time').slice(0, 30).flatMap(o => intCards(IA.buildProgram(swimCfg(o))).map(x => x.c));
  const MAIN100 = /^\d+ x 100(?:yd|m) at \d+:\d\d\/100\. Two seconds under this week's 500 pace of \d+:\d\d\/100\. /;
  const bad100 = all100.filter(c => { const mm = (c.segments || []).find(z => /main/i.test(z.label || ''));
    return !mm || !MAIN100.test(mm.text || '') || String(c.detail || '').indexOf("Two seconds under this week's 500 pace of") < 0 || DASH(mm.text || '') || /goal split/.test(c.detail || ''); });
  const bad500 = all500.filter(c => String(c.detail || '').indexOf("Slightly faster than this week's goal split of") < 0 || /500 pace/.test(c.detail || ''));
  ok('D6 every 100 goal INT card says "Two seconds under this week\'s 500 pace of X/100." (' + all100.length + ' cards) and every 500 goal card keeps "goal split" (' + all500.length + '); no dash',
     !!m1 && all100.length >= 50 && all500.length >= 50 && bad100.length === 0 && bad500.length === 0,
     bad100.length + ' / ' + bad500.length + ' bad; first: ' + String(((bad100[0] || bad500[0] || {}).detail) || '').slice(0, 120));
  // D7 — the goal phrase on a 100 goal out of reach (gap 40 s)
  const s7 = splitsOf(IA.buildProgram(g100({ base500Mins: '10', base500Secs: '16', baseMins: '1', baseSecs: '30', targetMins: '0', targetSecs: '50' })));
  ok('D7 a 100 goal out of reach names the goal as "Your full goal of 0:50 for 100yd needs more weeks than this block has." (' + s7.length + ' cards)',
     s7.length >= 3 && s7.every(x => x.n.indexOf('Your full goal of 0:50 for 100yd needs more weeks than this block has.') >= 0), (s7[0] || {}).n);
  // D8 — coach's dampened pin (same cfg as D7)
  const w5 = s7.find(x => x.w === 5);
  ok('D8 dampened pin (10:16 / 1:30 / 0:50): week 5 prints the split 1:51 (123.2 - 4 x 3)', !!w5 && w5.s === '1:51', w5 ? w5.s : 'NO W5');
  ok('D8 dampened pin: every INT note says "The target for this block is 1:51/100." (' + s7.length + ' cards)',
     s7.length >= 3 && s7.every(x => x.n.indexOf('The target for this block is 1:51/100.') >= 0), (s7[0] || {}).n);
  // FL1 — the D144 floor, on a stored-program-shaped cfg (no 500 on file)
  const LINEADV = 'No current 500yd time was entered. This split starts from the advanced default of 1:35/100, not from your own time. ';
  for(const [cm, cs] of [['2', '40'], ['2', '35']]){
    const sf = splitsOf(IA.buildProgram(g100({ baseMins: cm, baseSecs: cs, targetMins: '1', targetSecs: '0' }, 'advanced')));
    const gapF = (+cm) * 60 + (+cs) - 60;
    ok('FL1 floor: no 500 on file, advanced, current 100 ' + cm + ':' + cs + ', goal 1:00 (gap ' + gapF + ' >= the 95 s default) holds at 1:35 / rep 1:33 with the anchor line and the goal met note (' + sf.length + ' cards)',
       sf.length >= 3 && sf.every(x => x.s === '1:35' && x.r === '1:33' && x.n.indexOf(LINEADV + GOAL_MET_NOTE) === 0), sf.map(x => x.s + '/' + x.r).join(',') + ' ' + String((sf[0] || {}).n).slice(0, 60));
  }
  // GT1 — a seconds-only goal time builds a progression
  const cG = g100({ base500Mins: '5', base500Secs: '0', baseSecs: '58', targetSecs: '55' });
  const sg = splitsOf(IA.buildProgram(cG));
  ok('GT1 a seconds-only goal (0:55, minutes box empty; 500 5:00, current 0:58) builds a progression: week 1 at 1:00, the last split under it (' + sg.length + ' cards)',
     sg.length >= 3 && sg[0].w === 1 && sg[0].s === '1:00' && secs(sg[sg.length - 1].s) < 60, sg.map(x => x.s).join(','));
}

// ── M2 rows (slice 5, a current time is required) ────────────────────────────────────────
{
  const SRCT = fs.readFileSync(ART, 'utf8');
  const REAL = 'That is not a real time. Check the minutes and seconds.';
  const REQ = (d, u) => 'Required. Enter your most recent timed ' + d + u + '.';
  const FASTER = 'Your 500 pace is faster than your 100 time. Check both entries.';
  const LINE = 'Your repeats key off your 500 pace. Your 100 time sets the goal.';
  const s5 = (m, s) => ({ base500Mins: m, base500Secs: s }), s1 = (m, s) => ({ baseMins: m, baseSecs: s });
  const G5 = (u, x) => Object.assign({ id: 'swim_500_time', label: 'x', swimUnit: u, targetMins: '9', targetSecs: '0' }, x || {});
  const G1 = (u, x) => Object.assign({ id: 'swim_100_time', label: 'x', swimUnit: u, targetMins: '1', targetSecs: '20' }, x || {});
  const OK = { ok: true };
  // [label, goal, the hand table's answer]
  const LAT2 = [
    ['500 goal, blank, yd', G5('yd'), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['500 goal, blank, m', G5('m'), { ok: false, blank: true, msg: REQ(500, 'm') }],
    ['500 goal, 0:00', G5('yd', s1('0', '0')), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['100 goal, 100 entered, 500 blank', G1('m', s1('1', '30')), { ok: false, blank: true, msg: REQ(500, 'm') }],
    ['100 goal, both blank (500 rule first)', G1('yd'), { ok: false, blank: true, msg: REQ(500, 'yd') }],
    ['100 goal, 500 entered, 100 blank', G1('yd', s5('10', '0')), { ok: false, blank: true, msg: REQ(100, 'yd') }],
    ['100 goal, 500 entered, 100 0:00', G1('yd', Object.assign(s5('10', '0'), s1('0', '0'))), { ok: false, blank: true, msg: REQ(100, 'yd') }],
    ['100 goal, 500 600 s, 100 130 s', G1('yd', Object.assign(s5('10', '0'), s1('2', '10'))), { ok: false, msg: FASTER }],
    ['100 goal, 500 616 s, 100 90 s', G1('yd', Object.assign(s5('10', '16'), s1('1', '30'))), OK],
    ['100 goal, 500 600 s, 100 120 s (equal pace)', G1('yd', Object.assign(s5('10', '0'), s1('2', '0'))), OK],
    ['100 goal, 500 350 s, 100 0:58', G1('m', Object.assign(s5('5', '50'), s1('0', '58'))), OK],
    ['500 goal, 616 s', G5('yd', s1('10', '16')), OK],
    ['swim_tri', { id: 'swim_tri', label: 'x', baselineDist: '1000', baseline: '1000m' }, OK],
    ['swim_mile', { id: 'swim_mile', label: 'x' }, OK],
    ['swim_base', { id: 'swim_base', label: 'x' }, OK],
    ['no swim goal', null, OK],
    ['500 goal, minutes "abc"', G5('yd', s1('abc', '10')), { ok: false, msg: REAL }],
    ['500 goal, seconds 60', G5('yd', s1('10', '60')), { ok: false, msg: REAL }],
    ['100 goal, 500 seconds 75', G1('yd', Object.assign(s5('10', '75'), s1('1', '30'))), { ok: false, msg: REAL }],
    ['100 goal, minutes Infinity', G1('yd', Object.assign(s5('10', '0'), s1('Infinity', '0'))), { ok: false, msg: REAL }],
    ['100 goal, seconds 61 with the 500 blank (not real ahead of blank)', G1('yd', s1('1', '61')), { ok: false, msg: REAL }],
  ];
  const has = IA.eval("typeof _swimEntryState === 'function'");
  const bad2 = [], msgs = new Set();
  for(const [lbl, g, want] of LAT2){
    let got = null;
    try { got = has ? JSON.parse(IA.eval('JSON.stringify(_swimEntryState(' + JSON.stringify(g) + '))')) : null; } catch(e) { got = { throw: String(e.message).slice(0, 50) }; }
    if(got && got.msg) msgs.add(got.msg);
    const norm = o => o ? JSON.stringify({ ok: o.ok, blank: !!o.blank, msg: o.msg || '' }) : 'null';
    if(norm(got) !== norm(want)) bad2.push(lbl + ' got ' + JSON.stringify(got) + ' want ' + JSON.stringify(want));
  }
  ok('M2a _swimEntryState returns the hand table on ' + LAT2.length + ' entries (prompts, faster than, not a real time, ok)', has && bad2.length === 0, has ? bad2.join(' | ') : 'NO _swimEntryState');
  // M2b — static order in doGenerate
  const dgA = SRCT.indexOf('function doGenerate(){'), dgE = dgA >= 0 ? SRCT.indexOf('\n}\n', dgA) : -1;
  const dg = dgA >= 0 && dgE > dgA ? SRCT.slice(dgA, dgE) : '';
  const iS = dg.indexOf('_swimEntryState('), iR = dg.indexOf('if(!_sv.ok){ showToast(_sv.msg);'), iG = dg.indexOf("showScreen('screenGenerate')");
  ok('M2b in doGenerate the _swimEntryState call (' + iS + ') and its refusal (' + iR + ') precede showScreen(\'screenGenerate\') (' + iG + ')',
     !!dg && iS >= 0 && iR > iS && iG > iR, 'body ' + dg.length + ' chars');
  // M2c — base500 write site census
  const lit = (SRCT.match(/base500(Mins|Secs)\s*=(?!=)/g) || []);
  const carry = SRCT.split("_put('base500',").length - 1;
  ok('M2c base500 write sites: ' + lit.length + ' literal (want 2: the wizard min and sec inputs) + ' + carry + ' slice 3 carry _put (want 1) = 3',
     lit.length === 2 && lit.some(x => /Mins/.test(x)) && lit.some(x => /Secs/.test(x)) && carry === 1, lit.join(','));
  // M2d — doGenerate in the VM, refused and control
  const gen = goal => { const c = swimCfg({ goal: 'swim_500_time', exp: 'intermediate', age: '18-35', base: null, tgt: 540, unit: 'yd', seed: 76308 });
    c.cardioGoals = { swim: goal };
    IA.localStorage.setItem('ia_programs', '[]'); IA.eval('WD=' + JSON.stringify(c) + ';'); IA.eval('var __g212t=[]; showToast=function(m){__g212t.push(String(m))};');
    let err = ''; try { IA.eval('doGenerate()'); } catch(e) { err = String(e.message).slice(0, 60); }
    IA.flushTimers(50);
    let n = -1; try { n = JSON.parse(IA.localStorage.getItem('ia_programs') || '[]').length; } catch(e) {}
    return { n, toast: JSON.parse(IA.eval('JSON.stringify(__g212t)')), err }; };
  const rBlank = gen(G5('yd', { targetMins: '9', targetSecs: '0' })), rOk = gen(G5('yd', s1('10', '16')));
  ok('M2d doGenerate refuses a swim_500 goal with no current time: 0 programs saved, the 500 prompt toasted', rBlank.n === 0 && rBlank.toast[0] === REQ(500, 'yd') && !rBlank.err, JSON.stringify(rBlank));
  ok('M2d control: the same goal with 10:16 entered saves 1 program (the refusal is the check, not a crash)', rOk.n === 1 && !rOk.err, JSON.stringify(rOk));
  // M2e / M2f — static copy
  const cnt = t => SRCT.split(t).length - 1;
  const L1 = "Your most recent timed ${SWIM_GOAL_DIST[g.id]}${g.swimUnit||'yd'}</div>", L5 = "Your most recent timed 500${g.swimUnit||'yd'}</div>";
  ok('M2e the swim label is "Your most recent timed <dist><unit>" (' + cnt(L1) + '), the 500 block label (' + cnt(L5) + ') and coach\'s line (' + cnt(LINE) + ') appear once; the "(optional)" swim label is gone (' + cnt("Your current ${SWIM_GOAL_DIST[g.id]}") + ')',
     cnt(L1) === 1 && cnt(L5) === 1 && cnt(LINE) === 1 && cnt("Your current ${SWIM_GOAL_DIST[g.id]}") === 0);
  const copy = [...msgs, LINE, 'Your most recent timed 500yd', 'Your most recent timed 100m'];
  ok('M2f no "—", "–" or letter-hyphen-letter in the M2 copy (' + copy.length + ' strings)', copy.length >= 7 && !copy.some(DASH), copy.filter(DASH).join(' | '));
}

// ── later slices: never PASS until their own rows are written ────────────────────────────
LATER.forEach(notYet);
summary();
