#!/usr/bin/env python3
# V212 slice 6 — D144 engine (coach's exact spec). Runs on slices 1-5b. Four edits inside
# buildSwimSession's time-goal block:
#   1+2  the anchor and the 100 goal's target (one site: the slice 5b base reader).
#        The anchor is always a 500: the 500 goal reads baseMins/baseSecs, the 100 goal reads
#        base500Mins/base500Secs, both through _swimTot (total > 0, slice 5b), E = 500 total / 5;
#        none entered keeps expPace100 (and _baseEntered is false). The 100 goal's target:
#        cur100 = baseMins/baseSecs total, tgt100 = the target total, gap100 = cur100 > 0 ?
#        cur100 - tgt100 : 0, targetPace100 = initialPace100 - gap100. The E7 hold (slice 1's
#        min(entered, initial)) fires when gap100 <= 0. The sizer is untouched.
#   3    meta: _dist = 500 on both goals (the anchor sentence names the 500), _goal100 = tgt100;
#        the dampened note reads _goalPhrase ("1:20 for 100yd" on the 100 goal, "X/100" on the 500).
#   4    copy on the 100 goal only (detail parenthetical and Main set): "Two seconds under this
#        week's 500 pace of X/100." The 500 goal strings are kept byte for byte in their own branch
#        (g206's D109 table entry 52 still counts 1).
# No ia-version bump. Aborts on the first anchor miss, before writing anything.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
DET500 = "`${intReps} x 100${u} at ${fmt(intPace)}/100 (week ${week} target, slightly faster than this week's goal split of ${fmt(weekPace)}/100). Recovery: 2-3 min easy stroke between reps. 200${u} warmup + 100${u} cooldown.`"
DET100 = "`${intReps} x 100${u} at ${fmt(intPace)}/100 (week ${week} target, two seconds under this week's 500 pace of ${fmt(weekPace)}/100). Recovery: 2-3 min easy stroke between reps. 200${u} warmup + 100${u} cooldown.`"
MAIN500 = "`${intReps} x 100${u} at ${fmt(intPace)}/100. Slightly faster than this week's goal split of ${fmt(weekPace)}/100. Rest 2 to 3 min easy between reps. If the split slips, end the set.`"
MAIN100 = "`${intReps} x 100${u} at ${fmt(intPace)}/100. Two seconds under this week's 500 pace of ${fmt(weekPace)}/100. Rest 2 to 3 min easy between reps. If the split slips, end the set.`"
EDITS = [
 ('1+2 anchor and 100 target',
  """    const _baseTotal = _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
    if(_baseTotal > 0) initialPace100 = _baseTotal / (fixedDist / 100);
""",
  """    // D144 (V212, coach): the anchor is always a 500. The 500 goal reads its current 500
    // (baseMins/baseSecs); the 100 goal reads base500Mins/base500Secs. E = the 500 total / 5.
    const _is100 = goalId === 'swim_100_time';
    const _baseTotal = _is100 ? _swimTot(swimGoal.base500Mins, swimGoal.base500Secs) : _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
    if(_baseTotal > 0) initialPace100 = _baseTotal / 5;
    // D144: the 100 goal's target is the 500 pace moved by the 100 gap. The current 100 is used for
    // this gap, the E7 hold (gap <= 0) and the sizer, nothing else. No current 100 means no gap.
    let _goal100 = null;
    if(_is100 && targetPace100) {
      const tgt100 = targetPace100, cur100 = _swimTot(swimGoal.baseMins, swimGoal.baseSecs);
      const gap100 = cur100 > 0 ? cur100 - tgt100 : 0;
      targetPace100 = initialPace100 - gap100;
      _goal100 = tgt100;
    }
"""),
 ('3a meta',
  "swimPace._expDefault = expPace100; swimPace._dist = fixedDist;",
  "swimPace._expDefault = expPace100; swimPace._dist = 500; swimPace._goal100 = _goal100;"),
 ('3b _goalPhrase',
  """      const _reachSplit = (_qph && _qph.intSpan) ? swimPace[Math.min(_qph.intSpan, tw) - 1] : swimPace._realisticTarget;
""",
  """      const _reachSplit = (_qph && _qph.intSpan) ? swimPace[Math.min(_qph.intSpan, tw) - 1] : swimPace._realisticTarget;
      const _goalPhrase = goalId === 'swim_100_time' ? fmt(swimPace._goal100) + ' for 100' + u : fmt(swimPace._originalTarget) + '/100';
"""),
 ('3c dampened note reads _goalPhrase',
  "Your full goal of ${fmt(swimPace._originalTarget)}/100 needs more weeks than this block has.",
  "Your full goal of ${_goalPhrase} needs more weeks than this block has."),
 ('4a detail',
  "      detail = " + DET500 + ";\n",
  "      // D144 (V212): on the 100 goal the rep is keyed to the 500 pace, and the card says so.\n"
  "      const _is100c = goalId === 'swim_100_time';\n"
  "      detail = _is100c\n        ? " + DET100 + "\n        : " + DET500 + ";\n"),
 ('4b Main set',
  "          {label:'Main set',  yd:intReps*100, text:" + MAIN500 + "},\n",
  "          {label:'Main set',  yd:intReps*100, text:_is100c\n            ? " + MAIN100 + "\n            : " + MAIN500 + "},\n"),
]
src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
if src.count('swimPace._baseEntered = _baseTotal > 0;') != 1:
    print('ABORT: slice 5b is not on the tree'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1: print('ABORT:', tag, 'anchor count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1); print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
