#!/usr/bin/env python3
# V200 / D93 (amended third time) SLICE 5 — closes gatekeeper's RED on M1.
#
# index.html IS NOT TOUCHED. 0 hunks. ia-version stays 199. This slice edits two test files:
#   tests/gates/g200_pull_arbitration.js
#   tests/sabotage/v200.json
#
# PIECE A — narrow P2's prose to the claim its population supports. The assertion logic and
#           every number are UNCHANGED; only the prose narrows, plus a disclaimer that the
#           FIRST-wins (break) clause is structurally unobservable on any pull lattice and is
#           covered by g199 G1/G2/F3c/H5 instead.
# PIECE B — ship P6, the one-name limb census, as an equality.
# PIECE C — replace P2's prose licence with a REAL predicate keyed on the candidate's
#           ia-version: <= 200 arms the D91-era pins, > 200 REFUSES them in the g197d E1h
#           refusal shape that gate.sh:85 already blocks on.
# PIECE D — fix tests/sabotage/v200.json: M1 re-declared against g199 (G1 + G2 by name),
#           M2's trip named with its numbers, M4 now names P6.
#
# Every anchor is asserted count==1 before anything is written. First miss aborts the script.

import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g200_pull_arbitration.js')
SAB = os.path.join(ROOT, 'tests', 'sabotage', 'v200.json')
APP = os.path.join(ROOT, 'index.html')

FAILED = []


def sub(text, old, new, label):
    n = text.count(old)
    if n != 1:
        FAILED.append('%s: anchor count==%d, want 1' % (label, n))
        return text
    return text.replace(old, new, 1)


# ─────────────────────────────────────────────────────────────────────────────────────
# GUARD: index.html must not move in this slice.
# ─────────────────────────────────────────────────────────────────────────────────────
with open(APP, 'rb') as f:
    APP_BEFORE = f.read()
if b'ia-version" content="199"' not in APP_BEFORE:
    print('ABORT: index.html is not at ia-version 199; slice 5 assumes the shipped V199 artifact.')
    sys.exit(1)

with open(GATE, 'r', encoding='utf-8') as f:
    G = f.read()

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE C.1 — refusal machinery + pinned(), lifted from g197d_d84_base.js:133 (E1h shape).
# ─────────────────────────────────────────────────────────────────────────────────────
G = sub(G, r"""let PASS=0,FAIL=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };
const done=()=>{ console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };""",
r"""let PASS=0,FAIL=0,REFUSED=0;
const ok=(c,m)=>{ if(c){PASS++;console.log('  ok   '+m);} else {FAIL++;console.log('  FAIL '+m);} };
// REFUSAL MACHINERY, lifted from g197d_d84_base.js:133 (the E1h shape, ruled V198). A refused
// assertion was NOT put and is NOT a pass. gate.sh:85 greps ^REFUSED beside the summary and
// blocks on it, so a refusal here stops the suite even though the exit code stays 0.
const refuse=(n,why)=>{ REFUSED++; console.log('REFUSE '+n+'  -> '+why); };
// pinned() is the D94 re-pin predicate applied to ONE assertion: armed at or below
// ia-version 200, refused above it. The predicate itself is in section A, off the artifact.
const pinned=(code,c,m)=>{ if(D91_ERA) ok(c,m); else refuse(code+' (D91-era pull-shape pin)',REFUSE_WHY); };
const done=()=>{ if(REFUSED) console.log('REFUSED '+REFUSED+' assertion(s) — see the REFUSE lines above. A REFUSED assertion was NOT run and is NOT a pass.'); console.log('PASS '+PASS+' FAIL '+FAIL); process.exit(FAIL?1:0); };""",
'C1 refusal machinery')

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE C.2 — the predicate itself, read off the candidate artifact.
# ─────────────────────────────────────────────────────────────────────────────────────
G = sub(G, r"""const RAW=fs.readFileSync(ART,'utf8');
const anchorN=RAW.split(A_PIPE).length-1;""",
r"""const RAW=fs.readFileSync(ART,'utf8');
// ── THE D94 RE-PIN PREDICATE. This REPLACES the prose licence that used to sit above P2 ──
// Prose is not a licence. A comment saying "a trip here is expected once D94 ships" expires
// nothing and trips nothing; §10b rules that a licence is an equality that self-expires.
// D94 is unbuilt and its version number DOES NOT EXIST, so this predicate cannot key on "the
// version D94 ships on" — a predicate on a number that does not exist is prose with extra
// steps. It keys on the ARTIFACT instead:
//   ia-version <= 200 : arm the D91-era pull shape (P2, P2c 150, P4 150/150, P6 swing 150).
//   ia-version >  200 : REFUSE all four, loudly, in the g197d E1h shape. gate.sh greps
//                       ^REFUSED and blocks.
// CONSEQUENCE, RULED AND INTENDED: the FIRST V201 build is red whether or not D94 is in it.
// That is the point. D94 must bring its own after-grid and RE-PIN these four rather than
// inherit a green gate asserting a survivor coach has already ruled coaching-wrong.
const IAV_M=/<meta\s+name="ia-version"\s+content="(\d+)"/.exec(RAW);
const IAV=IAV_M?parseInt(IAV_M[1],10):NaN;
const D91_ERA=Number.isFinite(IAV)&&IAV<=200;
const REFUSE_WHY=(IAV_M
  ?'NOT RUN: this candidate reads ia-version '+IAV+', past 200, and these four pins describe the D91-era pull shape only. '
  :'NOT RUN: this candidate carries no readable ia-version meta, so this gate cannot tell whether D94 has re-ruled the pull arbitration. ')
  +'P2, P2c, P4 and P6 pin the D91 pull shape: on a both-enter deload pull card the survivor is Pull superset B if and only if B holds an E_PAT posterior item at p1, the positive limb is exactly 150 cards, and one movement carries all of it. '
  +'Coach has ruled that direction COACHING-WRONG on pull days: the deload keeps a hinge drawn from the conditioning pool while the Main is already a deadlift variant, and deletes the day\'s only vertical pull. D94 IS THE RULING THAT RE-PINS THESE FOUR. '
  +'D94 must re-rule and re-pin before this gate runs on V201 or later. A claim that did not run is NOT a pass.';
console.log('   ia-version read off the candidate: '+(IAV_M?IAV:'UNREADABLE')+'  ->  D91-era pins '+(D91_ERA?'ARMED':'REFUSED'));
const anchorN=RAW.split(A_PIPE).length-1;""",
'C2 ia-version predicate')

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE C.3 — the dead prose licence above P2 becomes a pointer at the live predicate.
# ─────────────────────────────────────────────────────────────────────────────────────
G = sub(G, r"""  // ── P2 SELF-EXPIRING LICENCE — READ THIS BEFORE FIXING A TRIP ───────────────────────
  // Same expiry discipline as the D85 and D91 licence switches in g193_budget_floor.js:180-189,
  // written as a pin rather than a switch because this gate takes no baseline argv to arm one
  // from. P2 is a correct description of the engine at V199 and it is NOT a coaching endorsement.
  // Coach has ruled the direction P2 pins COACHING-WRONG on pull days under D94: the deload keeps
  // a hinge drawn from the conditioning pool while the Main is already a deadlift variant, and
  // deletes the day's only vertical pull. D94 IS THE RULING THAT RE-PINS P2. A TRIP ON P2 AFTER
  // D94 SHIPS IS EXPECTED, NOT A REGRESSION: re-derive the expected survivor from D94's
  // after-grid and rewrite this assertion. Until D94 ships, a trip here is a real defect.
  //""",
r"""  // ── P2 SITS UNDER THE D94 RE-PIN PREDICATE, NOT UNDER A PROSE LICENCE ───────────────
  // What stood here was a comment telling a future reader that a trip after D94 was expected.
  // It expired nothing and it tripped nothing, and coach ruled that prose is not a licence.
  // The licence is now the ia-version predicate in section A, and P2 is put through pinned():
  // armed at or below 200, REFUSED above it. P2 is a correct description of the engine at V199
  // and it is NOT a coaching endorsement. Until D94 ships, a trip here is a real defect.
  //""",
'C3 prose licence becomes a pointer')

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE A — narrow P2's prose. The predicate and the counts do NOT move.
# ─────────────────────────────────────────────────────────────────────────────────────
G = sub(G, r"""  ok(R.viol===0&&R.bothEnter===210&&R.swapCards>0,
    'P2 PER-CARD EXPECTED SURVIVOR (D93, re-pinned by D94): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is B if and only if B holds an E_PAT posterior item on p1, else A. '""",
r"""  pinned('P2',R.viol===0&&R.bothEnter===210&&R.swapCards>0,
    'P2 WHICH BLOCK SURVIVES (D93 amended, re-pinned by D94): on every deload day build where BOTH Pull superset A and Pull superset B enter p1, exactly one survives to p2, and the survivor is B if and only if B holds an E_PAT posterior item on p1, else A. THAT WHICH-BLOCK RULE IS THE WHOLE OF WHAT P2 CLAIMS: it claims NOTHING about the FIRST-posterior-wins clause, for the measured reason in the SCOPE paragraph below. '""",
'A1 P2 prose narrowed and wrapped in pinned')

G = sub(G, r"""    + 'D94 REVERSES THE DIRECTION THIS PINS. A trip on P2 once D94 has shipped is EXPECTED and is not a regression.');""",
r"""    + 'SCOPE — MEASURED, DO NOT RE-DERIVE THIS, IT COST A FULL MEASURE PASS: the FIRST-wins clause (the `break` in the posterior pre-pass, index.html:9412) is STRUCTURALLY UNOBSERVABLE ON ANY PULL LATTICE. A pull card holds at most ONE posterior-candidate block by construction: Pull superset A is row plus vertical pull; Pull superset B has exactly one posterior-capable slot, the ex.cond[2] draw; Row volume is one row; Main backMain is skipped as a main; the rest are optional or fluff. With one posterior-holding block per card, first-wins and last-wins select IDENTICALLY, so removing the break changes nothing this gate can see. '
    + 'THE NUMBERS: over 217,728 deload day builds, 10,443 (4.80%) carry 2+ posterior-holding candidate blocks, and 0 of those involve the pull family. Eleven lattice extensions were costed; only two contain the population at all and both contain it as LEG cards, which this gate\'s FAM does not read. NO LATTICE CHANGE CAN FIX THIS and MINI_LATTICE must not be widened in an attempt to. '
    + 'THE FIRST-WINS CLAUSE IS COVERED ELSEWHERE, BY NAME: g199_deload_arbitration.js G1/G2/F3c/H5, on 1,776 M1-observable cards of 15,360 deload day builds (11.6%), of which the 1,350 containing Leg isolation reconcile G1\'s hand pin independently as 1,080 + 240 + 30. tests/sabotage/v200.json M1 is declared against g199 for exactly that reason. '
    + 'D94 REVERSES THE DIRECTION THIS PINS, and the ia-version predicate in section A REFUSES this assertion on any candidate past 200 rather than let D94 inherit a green pin.');""",
'A2 P2 scope disclaimer replaces the prose licence sentence')

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE B — P6, the one-name limb census, plus P2c / P4 under the predicate.
# ─────────────────────────────────────────────────────────────────────────────────────
G = sub(G, r"""  ok(R.swapCards===150,
    'P2c POSITIVE-LIMB POPULATION:""",
r"""  pinned('P2c',R.swapCards===150,
    'P2c POSITIVE-LIMB POPULATION:""",
'B1 P2c wrapped in pinned')

G = sub(G, r"""  ok(R.p4Survive===150&&R.swapCards===150,""",
r"""  pinned('P4',R.p4Survive===150&&R.swapCards===150,""",
'B2 P4 wrapped in pinned')

G = sub(G, r"""  console.log('── P4. survival of the newly selected block all the way to the shipped card ──');""",
r"""  console.log('── P6. the whole positive limb is ONE NAME, now said out loud as an equality ──');
  const P6N=Object.keys(R.swapItems||{}).sort();
  const P6OK=P6N.length===1&&P6N[0]==='Kettlebell swing'&&R.swapItems['Kettlebell swing']===150;
  pinned('P6',P6OK,
    'P6 ONE-NAME LIMB CENSUS, AS AN EQUALITY: the E_PAT posterior-name census held by Pull superset B at p1 on this lattice == {"Kettlebell swing":150} — one name, that count, and nothing else in the object; got '+JSON.stringify(R.swapItems)+'. '
    + 'WHY THIS IS ITS OWN ASSERTION: the ENTIRE positive limb of P2 and P4 rests on a single movement, and until now it rested there silently. Pull superset B\'s only posterior-capable slot is one draw off EXLIB.conditioning (index.html:1626) = [Ball slams, Kettlebell swing, Burpees, Broad jumps, Mountain climbers, Jump squats], of which EXACTLY ONE is E_PAT posterior. On bodyweight, _bwFlat (index.html:7922) substitutes six names of which ZERO are, which is why the bodyweight tier is excluded from this lattice. '
    + 'Over the wide lattice the same census reads {"Kettlebell swing":7200} — 7,200 of 7,200, 100%, one name — and no other posterior name appears anywhere in that section\'s 15-name occupancy census. '
    + 'A POOL EDIT THAT ADDS OR REMOVES A POSTERIOR NAME IN THAT LIST RE-PINS P6 AND P2c TOGETHER: P2c moves off 150 and P6 moves off the single name. Re-derive BOTH from the new pool; never relax one to match the other. This converts a silent single point of failure into a named one. tests/sabotage/v200.json M4 removes exactly this name and must trip P6, P2c and P2c-floor by name.');

  console.log('── P4. survival of the newly selected block all the way to the shipped card ──');""",
'B3 P6 one-name limb census')

if FAILED:
    print('ABORT, nothing written. Anchor misses:')
    for m in FAILED:
        print('  - ' + m)
    sys.exit(1)

# ─────────────────────────────────────────────────────────────────────────────────────
# PIECE D — tests/sabotage/v200.json. Field-level, asserted before assignment.
# ─────────────────────────────────────────────────────────────────────────────────────
with open(SAB, 'r', encoding='utf-8') as f:
    SRC = f.read()
SPEC = json.loads(SRC)

if len(SPEC) != 5:
    print('ABORT: v200.json has %d mutations, want 5.' % len(SPEC))
    sys.exit(1)

M1, M2, M3, M4, M5 = SPEC

# --- M1: re-declare against g199, naming G1 and G2 ---
if M1['gate'] != 'gates/g200_pull_arbitration.js':
    print('ABORT: M1 gate is %r, want the g200 declaration slice 5 replaces.' % M1['gate'])
    sys.exit(1)
if not M1['note'].startswith('NAMED TRIP: g200 P2 (per-card expected survivor).'):
    print('ABORT: M1 note does not open with the g200 declaration slice 5 replaces.')
    sys.exit(1)
M1['gate'] = 'gates/g199_deload_arbitration.js'
M1['note'] = (
    'NAMED TRIPS: g199_deload_arbitration.js G1 AND G2. '
    'RE-DECLARED IN SLICE 5, AND THIS IS NOT RELABELLING A HOLE. M1 was first declared against g200 and it SURVIVED: '
    'with the break removed at index.html:9412 so the LAST posterior block wins, g200 still read PASS 14 FAIL 0. '
    'Measure established the cause and it is STRUCTURAL: a pull card holds at most ONE posterior candidate block by construction. '
    'Pull superset A is row plus vertical pull; Pull superset B has exactly one posterior-capable slot, the ex.cond[2] draw; '
    'Row volume is one row; Main backMain is skipped as a main; the rest are optional or fluff. With one posterior-holding block per card, '
    'first-wins and last-wins select identically and the break is unobservable there. Over 217,728 deload day builds, 10,443 (4.80%) carry '
    '2+ posterior-holding candidate blocks and 0 of them involve the pull family; eleven lattice extensions were costed and the two that '
    'contain the population contain it as LEG cards g200 FAM does not read, so NO LATTICE CHANGE can give g200 coverage of this clause. '
    'g199 DOES test the clause, on real two-posterior LEG cards: under M1 it reads PASS 46 FAIL 10, and measure’s independent census found '
    '1,776 M1-observable cards of 15,360 deload day builds (11.6%), of which the 1,350 containing Leg isolation reconcile G1’s hand pin '
    'as 1,080 + 240 + 30, derived without touching G1. '
    'GATEKEEPER: the trip must be G1 and G2 BY NAME, not "some gate went red". Collateral elsewhere in g199’s F series is expected and disclosed.'
)

# --- M2: keep the g200 declaration, name the trip with its numbers ---
old_m2 = 'NAMED TRIP: g200 P2 (and P4).'
if M2['note'].count(old_m2) != 1:
    print('ABORT: M2 note anchor count!=1.')
    sys.exit(1)
if M2['gate'] != 'gates/g200_pull_arbitration.js':
    print('ABORT: M2 must stay declared against g200.')
    sys.exit(1)
M2['note'] = M2['note'].replace(
    old_m2,
    'NAMED TRIPS: g200 P2 (exactly 150 violations of 210 both-enter deload pull cards) AND g200 P4 (0 of 150 reaching the shipped card). '
    'M2 is the mutation that proves the DIRECTION of the arbitration; M4 below is the one that proves the positive limb is ALIVE. Both are required.',
    1)

# --- M4: name P6, and record why a revert-only gate would not be enough ---
old_m4 = ('NAMED TRIPS: g200 P2c (positive-limb population, 150 -> 0) AND g200 P2c-floor '
          '(the separate hard floor swapCards >= 1).')
if M4['note'].count(old_m4) != 1:
    print('ABORT: M4 note anchor count!=1.')
    sys.exit(1)
if M4['gate'] != 'gates/g200_pull_arbitration.js':
    print('ABORT: M4 must stay declared against g200.')
    sys.exit(1)
M4['note'] = M4['note'].replace(
    old_m4,
    'NAMED TRIPS: g200 P2c (positive-limb population, 150 -> 0), g200 P6 (the one-name limb census equality, '
    '{"Kettlebell swing":150} -> {}) AND g200 P2c-floor (the separate hard floor swapCards >= 1). '
    'WHY M4 EXISTS ALONGSIDE M2: M4 is the mutation that proves the positive limb is ALIVE, M2 proves the direction. '
    'A gate whose only mutation is the revert would pass a candidate that had quietly emptied the population, which is the E0 defect again.',
    1)

# untouched by design
if not M3['note'].startswith('NAMED TRIPS: g200 P1'):
    print('ABORT: M3 note shape changed unexpectedly.')
    sys.exit(1)
if M5['gate'] != 'gates/g199_deload_arbitration.js':
    print('ABORT: M5 must stay declared against g199.')
    sys.exit(1)

OUT = json.dumps(SPEC, indent=2, ensure_ascii=False) + '\n'

with open(GATE, 'w', encoding='utf-8') as f:
    f.write(G)
with open(SAB, 'w', encoding='utf-8') as f:
    f.write(OUT)

with open(APP, 'rb') as f:
    if f.read() != APP_BEFORE:
        print('ABORT: index.html changed. Slice 5 is 0 hunks in the app.')
        sys.exit(1)

print('slice 5 written:')
print('  ' + GATE)
print('  ' + SAB)
print('  index.html untouched (%d bytes, ia-version 199)' % len(APP_BEFORE))
