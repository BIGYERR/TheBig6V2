#!/usr/bin/env python3
# V194 gate fix, pass 3 — SPLIT UNDER-INVOKED FROM NOT-APPLICABLE in g193_budget_floor.js.
#
# Mario's ruling: one mechanism was covering two different facts.
#   1. UNDER-INVOKED  — the run was missing something it could have been given. Fixable by the
#      operator. Keeps exit 3.
#   2. NOT APPLICABLE — the claim needs a V192-specific artifact (or a specific lattice) and the
#      run correctly supplied V193. Nothing is wrong; true on every ship run from now on.
#      Announced BY NAME, exit 0.
# An exit code that is permanently non-zero on the normal path is noise, and noise gets ignored,
# which lands back at silence-reading-as-a-pass. Both categories still print by name; only the
# exit code moves.
#
# PRECEDENCE (hard): if NO baseline was supplied at all, every claim that needs one is
# UNDER-INVOKED, the V192-specific ones included — supplying a baseline is the fixable step.
# NOT APPLICABLE requires that a baseline WAS supplied and is merely the wrong version/lattice.
#
# Does not touch index.html (ia-version stays 194) and does not touch tests/gate.sh.
import sys, io

F = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = io.open(F, encoding='utf-8').read()
orig = src
reps = []

def sub(name, old, new):
    reps.append((name, old, new))

# 1. The accounting machinery: add the NOT APPLICABLE channel beside DEFER, with the
#    precedence rule enforced in the helper itself so no call site can get it wrong.
sub('1 na() helper + precedence',
r'''let DEFER = 0;
const defers = [];
const defer = (claim, why) => { DEFER++; defers.push(claim + ' \— ' + why); console.log('  DEFER ' + claim + ' \— ' + why); };''',
r'''// TWO CATEGORIES, NEVER ONE NUMBER. `defer` and `na` are separate channels with separate
// counters, separate blocks in the epilogue and distinguishable line prefixes (`DEFER` vs
// `N/A`). They are never summed: they are not the same fact.
//   defer() = UNDER-INVOKED. The claim was not made because this run was missing something it
//             COULD have been handed. Actionable by the operator, so it drives exit 3.
//   na()    = NOT APPLICABLE BY DESIGN. The claim needs a V192-specific artifact, or the
//             lattice a hand table was transcribed against, and this run legitimately supplied
//             something else. Nothing is wrong, nothing is fixable, so it does NOT move the
//             exit code. It is still announced by name, which is the part that matters: these
//             claims are not silent in either design, only the exit code differs.
// PRECEDENCE, enforced below and not left to call sites: with NO baseline at all, every claim
// that needs one is UNDER-INVOKED — the V192-specific ones included — because supplying a
// baseline is the fixable step, so that run exits 3. A claim is NOT APPLICABLE only when a
// baseline WAS supplied and is simply the wrong version or the wrong lattice for that claim.
let DEFER = 0;
const defers = [];
const defer = (claim, why) => { DEFER++; defers.push(claim + ' — ' + why); console.log('  DEFER ' + claim + ' — ' + why); };
let NA = 0;
const nas = [];
const na = (claim, why) => {
  if (!BASEFILE) return defer(claim, why);   // precedence: no baseline at all is under-invocation
  NA++; nas.push(claim + ' — ' + why); console.log('  N/A   ' + claim + ' — ' + why);
};''')

# 2. B1b: baseline supplied, but not a V192 one on the transcribed lattice.
sub('2 B1b census cross-check -> na',
r'''      defer('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
        BASE_VER ===''',
r'''      na('B1b live-baseline cross-check of the transcribed V192 off-long-run core census',
        BASE_VER ===''')

# 3. B3 wide on IA_LATTICE=full: baseline supplied, wrong lattice for the hand table.
sub('3 B3 XCHK lattice -> na',
r'''    defer(XCHK, 'the census was transcribed against the ''',
r'''    na(XCHK, 'the census was transcribed against the ''')

# 4. B3 wide + narrow under the ship invocation: baseline supplied, not v192.
sub('4 B3 XCHK wrong version -> na',
r'''    defer(XCHK, 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the hand table''',
r'''    na(XCHK, 'the baseline supplied is v' + BASE_VER + ', not v192, so nothing on this run confirms the hand table''')

# 5. B4 wide table on IA_LATTICE=full: baseline supplied, wrong lattice.
sub('5 B4 wide table lattice -> na',
r'''      defer('B4 baseline-identity cross-check against the transcribed V192 WIDE non-optional-deletion table',''',
r'''      na('B4 baseline-identity cross-check against the transcribed V192 WIDE non-optional-deletion table',''')

# 6. B4 wide+narrow tables under the ship invocation: baseline supplied, not v192.
sub('6 B4 tables wrong version -> na',
r'''      defer('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)',
        'the baseline supplied is v''',
r'''      na('B4 baseline-identity cross-check against the transcribed V192 non-optional-deletion tables (wide and narrow)',
        'the baseline supplied is v''')

# 7. The epilogue: one heading per category, each telling the truth about ITS category, and the
#    exit code keyed to the under-invoked count alone. The PASS/FAIL line keeps its exact shape
#    and stays last: tests/sabotage.py binds /^PASS \d+ FAIL \d+\s*$/ and tests/gate.sh greps
#    ^PASS [0-9]+ FAIL [0-9]+.
sub('7 epilogue split + exit code',
r'''if (defers.length){
  console.log('\nDEFERRED (' + defers.length + ') \— claims this run did NOT make:');
  defers.forEach(d => console.log('  ' + d));
  console.log('  This run was under-invoked. ' + (BASEFILE
    ? 'A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '); the claims above need one this run does not have — a V192 artifact, or the lattice the hand tables were transcribed against.'
    : 'Hand it a baseline (argv[3]) to make these claims.'));
  console.log('  It is NOT a full pass of this gate and the exit code (3) says so, whatever the PASS line below reads.');
}
// The summary line itself is byte-shaped for the summary regex in tests/sabotage.py and for
// tests/gate.sh, which both anchor on the end of that line, so the deferral block goes ABOVE
// it and is never appended to it.
console.log('\nPASS ' + PASS + ' FAIL ' + FAIL);
process.exit(FAIL ? 1 : (defers.length ? 3 : 0));''',
r'''if (defers.length){
  console.log('\nDEFERRED (' + defers.length + ') — UNDER-INVOKED: claims this run did NOT make and COULD have:');
  defers.forEach(d => console.log('  ' + d));
  console.log('  This is actionable. ' + (BASEFILE
    ? 'A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '), so these are not the missing-baseline case: read each reason above and re-invoke accordingly, for example without IA_LATTICE=full.'
    : 'Hand it a baseline (argv[3]) to make these claims. With no baseline at all, every claim that needs one is under-invoked, the V192-specific ones included.'));
  console.log('  It is NOT a full pass of this gate and the exit code (3) says so, whatever the PASS line below reads.');
}
if (nas.length){
  console.log('\nNOT APPLICABLE (' + nas.length + ') — BY DESIGN: claims that do not apply to this invocation. Nothing here is a defect and none of it moves the exit code:');
  nas.forEach(d => console.log('  ' + d));
  console.log('  A baseline WAS supplied (' + path.basename(BASEFILE) + ', v' + BASE_VER + '); each claim above needs an artifact this run legitimately does not have — a V192 artifact, or the lattice the hand tables were transcribed against. On the ship invocation that is the correct state and will be true of every ship run from now on, so it exits 0. The claims are still named here rather than skipped, and this count is NEVER added to the DEFERRED count above: under-invocation is fixable and this is not.');
}
// The summary line itself is byte-shaped for the summary regex in tests/sabotage.py and for
// tests/gate.sh, which both anchor on the end of that line, so both blocks above go BEFORE it
// and neither is ever appended to it.
console.log('\nPASS ' + PASS + ' FAIL ' + FAIL);
// FAIL wins, then under-invocation (3), then clean (0). NOT APPLICABLE never appears here.
process.exit(FAIL ? 1 : (defers.length ? 3 : 0));''')

bad = False
for name, old, new in reps:
    n = src.count(old)
    print('anchor %-34s count=%d' % (name, n))
    if n != 1:
        bad = True
if bad:
    sys.exit('ABORT: an anchor did not match exactly once. Nothing written.')
for name, old, new in reps:
    src = src.replace(old, new, 1)
assert src != orig
io.open(F, 'w', encoding='utf-8').write(src)
print('WROTE ' + F)
