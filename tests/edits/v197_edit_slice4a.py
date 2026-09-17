#!/usr/bin/env python3
# V197 slice 4a — g193_budget_floor.js instrumentation ONLY.
# Adds the coach-ruled-deletable class list (D81) and the per-tier EX-CLASS
# deletion tally, plus the ungated per-tier table the stop condition is read off.
# NOTHING IS GATED BY THIS SCRIPT. index.html IS NOT TOUCHED.
import sys, io

P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g193_budget_floor.js'
src = io.open(P, encoding='utf-8').read()
orig = src

def rep(anchor, new):
    global src
    n = src.count(anchor)
    print('anchor count=%d  %r' % (n, anchor[:72]))
    assert n == 1, 'ANCHOR MISS (count=%d), aborting whole script: %r' % (n, anchor[:160])
    src = src.replace(anchor, new, 1)

# ── E1: the ruled-deletable list, beside the V192 class census ───────────────
rep("""  'Delts finisher': 36, 'Arms finisher': 18,
};
""",
"""  'Delts finisher': 36, 'Arms finisher': 18,
};

// ── COACH-RULED-DELETABLE CLASSES (D81) ────────────────────────────────────
// THIS IS A RULING, NOT A FUDGE, AND EVERY MEMBER CARRIES ITS D-CODE. A class named
// here is excluded from B4's per-tier ratchet ON BOTH SIDES — candidate and baseline,
// never one — because coach has ruled that capSessionBudget is CONTRACTUALLY ALLOWED to
// trim it. It is not excluded from B4b, B4c or B4d, which still report it.
//   'Leg isolation'  D81. capSessionBudget's docstring has stated the trim order since it
//                    was written: carries -> optional/finisher/conditioning -> PUMP/
//                    ISOLATION -> remaining accessories, latest first. 'Leg isolation' IS
//                    the isolation band. The V192 count of 432 was never a coaching floor:
//                    four of V196's five pool names were already tier 0, only 'Leg press'
//                    reached the tier-3 exemption, and the permissive _gear fallback handed
//                    the all-machine pool back whole on bodyweight/minimal/home_basic/
//                    home_full, so a leg press sat on a hotel-room card as an untouchable
//                    barbell compound. Two defects were propping the number up. D81
//                    ratifies the contract; V197 removed the accident blocking it.
// A SECOND MEMBER APPEARING HERE WITHOUT A D-CODE IS A WEAKENING. It must be obvious on
// sight, which is why this list is one line and the reasoning is above it.
const RULED_DELETABLE = ['Leg isolation'];                 // D81
// V192 non-optional deletions OF THE RULED-DELETABLE CLASSES ONLY, per tier, on the
// 288-cell WIDE lattice, transcribed off the V192 artifact (git show V192:index.html).
// B4's fallback baseline is the hand table V192_NONOPT_WIDE, whose per-tier totals
// INCLUDE these deletions. Subtracting a candidate-side class from an untouched baseline
// would be exactly the one-sided exclusion this ruling forbids, so the baseline side gets
// its own transcription. Sum must equal V192_NONOPT_CLASSES_WIDE['Leg isolation'] = 432,
// which is asserted on every run below.
const V192_RULED_DEL_WIDE = { bodyweight:null, minimal:null, home_basic:null, home_full:null, commercial:null, crossfit:null };
""")

# ── E2: tally() tracks the ex-class total per tier ──────────────────────────
rep("""  for (const e of EQUIP) perTier[e] = { opt:0, non:0 };""",
    """  for (const e of EQUIP) perTier[e] = { opt:0, non:0, nonEx:0, ruled:0 };""")

rep("""        else {
          perTier[tier].non += d;
          perTierInj[tier+'|'+inj] = (perTierInj[tier+'|'+inj]||0) + d;
          perCell[cellKey] += d;
          const lbl = k.split('|')[0] || k.split('|')[1] || '(no label)';
          kinds[lbl] = (kinds[lbl]||0) + d;
        }""",
    """        else {
          const lbl = k.split('|')[0] || k.split('|')[1] || '(no label)';
          perTier[tier].non += d;
          // D81: the ex-class total is what B4's ratchet runs on. The gross total is still
          // accumulated one line above and still printed, ungated, so the raw shape of the
          // change never disappears behind the exclusion.
          if (RULED_DELETABLE.indexOf(lbl) < 0) perTier[tier].nonEx += d; else perTier[tier].ruled += d;
          perTierInj[tier+'|'+inj] = (perTierInj[tier+'|'+inj]||0) + d;
          perCell[cellKey] += d;
          kinds[lbl] = (kinds[lbl]||0) + d;
        }""")

# ── E3: print the per-tier EX-CLASS and RULED tables, ungated, next to the gross one
rep("""    console.log('       budget-deleted sections ' + e.padEnd(11) + ' optional ' + String(C.perTier[e].opt).padStart(4) +
      '   non-optional ' + String(C.perTier[e].non).padStart(4) + '/' + baseNon[e] + ' (V192)');""",
    """    console.log('       budget-deleted sections ' + e.padEnd(11) + ' optional ' + String(C.perTier[e].opt).padStart(4) +
      '   non-optional ' + String(C.perTier[e].non).padStart(4) + '/' + baseNon[e] + ' (V192)' +
      '   ex-ruled ' + String(C.perTier[e].nonEx).padStart(4) + '   ruled-deletable ' + String(C.perTier[e].ruled).padStart(4));""")

assert src != orig
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE ' + P)
