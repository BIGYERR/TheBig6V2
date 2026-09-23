#!/usr/bin/env python3
# V208 slice 1 — D103a "stamp". Parked once (builder) on the budgeted easy run past 40 min
# (lsd_easy branch, frequency plan, labelled "Easy Run — Long", V159's designated long run):
# branch mapping said `easy`, the label said `long`. RESOLVED by the coordinator from coach's
# D104a ruling (the `long` key on the budgeted-easy site; legLoad is NOT changed, no ruling
# moves it). E2c stands as drafted; resumed as-is.
# Usage: python3 tests/edits/v208_slice1_d103a_stamp.py [target.html]   (default: index.html)
# Key site: the DOSE object (dose.key), not the session: _doseStripHTML(sport,dose,sub) receives
# only the dose, and every NSW run card carries a dose (2,112/2,112 measured).
# Every anchor asserted count==1 before anything is written; abort on the first miss.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
  ("E1 key init from the builder's branch type",
   "  const sType = forceType === 'long' ? 'lsd_long' : (sessionOverride || sTypes[dayIdx % sTypes.length]);\n",
   "  const sType = forceType === 'long' ? 'lsd_long' : (sessionOverride || sTypes[dayIdx % sTypes.length]);\n"
   "  // D103a (V208): the session class key, stamped on the dose at the return below. It starts\n"
   "  // from the branch this builder takes; the branches that print a different session say so.\n"
   "  let _key = {lsd_long:'long', lsd_easy:'easy', chi:'chi', int:'int'}[sType] || null;\n"),
  ("E2a bench override",
   "    subtype = _retest ? 'Benchmark Run — Retest' : 'Benchmark Run';\n",
   "    subtype = _retest ? 'Benchmark Run — Retest' : 'Benchmark Run';\n"
   "    _key = 'bench';\n"),
  ("E2b steady override (run_base's CHI limb)",
   "      subtype = 'Steady Aerobic Run';\n",
   "      subtype = 'Steady Aerobic Run';\n"
   "      _key = 'steady';\n"),
  ("E2c PARKED QUESTION: the budgeted easy run past 40 min is the block's designated long run",
   "      subtype = 'Easy Run' + ((_minsOv && _minsOv > 40) ? ' — Long' : '') + (_strides ? ' + Strides' : '');\n",
   "      subtype = 'Easy Run' + ((_minsOv && _minsOv > 40) ? ' — Long' : '') + (_strides ? ' + Strides' : '');\n"
   "      if(_minsOv && _minsOv > 40) _key = 'long';\n"),
  ("E3 stamp at the return",
   "  return {type:'run', subtype, detail, note, week, goalId, dose:_dose||undefined};\n}\n",
   "  if(_dose && _key) _dose.key = _key;   // D103a: readers go key first; NRC, bike and swim carry none\n"
   "  return {type:'run', subtype, detail, note, week, goalId, dose:_dose||undefined};\n}\n"),
  ("E4a the pin post-pass stamps the trial",
   "const _dz = {k:'dist', mi: +_pt.tDist.toFixed(2)};",
   "const _dz = {k:'dist', mi: +_pt.tDist.toFixed(2), key:'trial'};"),
  ("E4b B4's replacement is the easy run",
   "if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose} : _e.dose};",
   "if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose, key:'easy'} : _e.dose};"),
]
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (want 1); nothing written' % (name, n))
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d edits to %s' % (len(EDITS), P))
