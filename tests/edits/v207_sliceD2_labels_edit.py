#!/usr/bin/env python3
# V207 closing slice D2 (coach's exact label text, no predicate: the claims' truth does not change).
# Two gate labels named in the D106a record: the goal-length claim now says it is the no-test-pin shape.
# Applied once at V207; re-running aborts because the anchors are gone (that is correct).
import sys
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
E = [('tests/gates/g202_pace_anchor.js',
      "ok(pProg.totalWeeks === PIN.weeks, `Q1 the pinned PRT TING cfg still sizes to ${PIN.weeks} weeks (got ${pProg.totalWeeks})`);",
      "ok(pProg.totalWeeks === PIN.weeks, `Q1 the PRT TING cfg with no test pin sizes to its goal length, ${PIN.weeks} weeks (got ${pProg.totalWeeks}); the test-pinned shape is g207_test_week's`);"),
     ('tests/gates/g205_chi_table6.js',
      "ok('T11a Mario\\'s 11-week pace block still builds CHI cards', mp.totalWeeks === 11 && mCards.length > 0, mp.totalWeeks + 'wk, ' + mCards.length + ' cards');",
      "ok('T11a the goal-length 11-week pace block (no test pin) still builds CHI cards', mp.totalWeeks === 11 && mCards.length > 0, mp.totalWeeks + 'wk, ' + mCards.length + ' cards');")]
S = {p: open(R + p, encoding='utf-8').read() for p, _, _ in E}
for p, a, b in E:
    if S[p].count(a) != 1:
        print('ABORT', p, 'anchor count', S[p].count(a), '(need 1). Nothing written.'); sys.exit(1)
for p, a, b in E:
    open(R + p, 'w', encoding='utf-8').write(S[p].replace(a, b, 1)); print('applied', p)
