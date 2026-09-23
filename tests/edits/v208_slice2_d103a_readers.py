#!/usr/bin/env python3
# V208 slice 2 — D103a readers go key-first (coach-ruled). Parked once (builder): the single hard
# set {int, chi, long} also stopped parking the test in easy mode and stopped half-stepping or
# parking the Steady Aerobic Run and the Benchmark Run. Coach re-ruled: two NAMED sets, halfstep
# {int, chi, long, steady} (the test and the benchmark are measurements, never halved) and the
# easy/reduce park {int, chi, long, steady, bench, trial}; E4 confirmed. E3 amended; resumed.
# Keyed sessions read dose.key; unkeyed
# ones (NRC, bike, swim, frozen pre-V208 days) keep today's label scan / legLoad exactly.
#   E1 _nrcRunShape pace arm: speed = key int|chi; `trial` never enters the shape; long stays legLoad (D127).
#   E2 _cardioInterference: key int -> 1.4, chi -> 1.05 (today's numbers); every other key scans.
#   E3 injurySweepCardio: halfstep cuts _HALFSTEP_HARD_KEYS, easy/reduce parks _PROTECT_PARK_KEYS.
#   E4 BUILDER CALL, flagged: the easy/reduce sweep rewrites a hard run into "Easy Run (protected)";
#      its key follows the card (easy), or every key-first reader would read the parked run as hard.
# Usage: python3 tests/edits/v208_slice2_d103a_readers.py [target.html]   (default: index.html)
# Every anchor asserted count==1 before anything is written; abort on the first miss.
import sys
P = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, encoding='utf-8').read()
EDITS = [
  ("E1 _nrcRunShape pace arm reads the key",
   "      const _st = c.subtype||'';\n"
   "      if(/^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(_st)) speed.add(d);\n"
   "      else if(c.legLoad) long = d;\n",
   "      // D103a (V208): a keyed session reads its key, never its label; a test is neither the\n"
   "      // speed day nor the long run, so it never enters the shape. Unkeyed: the label, as before.\n"
   "      const _st = c.subtype||'', _k = c.dose && c.dose.key;\n"
   "      if(_k ? (_k === 'int' || _k === 'chi') : /^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(_st)) speed.add(d);\n"
   "      else if(_k === 'trial') return;\n"
   "      else if(c.legLoad) long = d;\n"),
  ("E2 _cardioInterference: key first for int and chi only",
   "  let inten = _sc(sub);\n",
   "  // D103a (V208): a keyed NSW interval or CHI reads its key, so a renamed label cannot move\n"
   "  // it. Every other key falls through to the scan: keying long or easy here is unruled.\n"
   "  const _k = cardio.dose && cardio.dose.key;\n"
   "  let inten = _k === 'int' ? 1.4 : _k === 'chi' ? 1.05 : _sc(sub);\n"),
  ("E3a injurySweepCardio: one hard test, key first",
   "  const HARD=/interval|tempo|speed|hill|fartlek|repeat|race pace|threshold/i;\n",
   "  const HARD=/interval|tempo|speed|hill|fartlek|repeat|race pace|threshold/i;\n"
   "  // D103a (V208): a keyed NSW run is judged by its key, never by a word in its copy (\"Not a\n"
   "  // tempo\" read every NSW easy run as hard). Two sets, two jobs. Halfstep halves the quality\n"
   "  // work; the test and the benchmark are measurements and are never halved. The easy and reduce\n"
   "  // sweep parks everything above easy effort while the injury heals, the test included.\n"
   "  // Unkeyed sessions (NRC, bike, frozen pre-V208 days) keep legLoad or the scan exactly.\n"
   "  const _HALFSTEP_HARD_KEYS=new Set(['int','chi','long','steady']);\n"
   "  const _PROTECT_PARK_KEYS=new Set(['int','chi','long','steady','bench','trial']);\n"
   "  const _hardBy=(s,keys)=>{const k=s.dose&&s.dose.key;return k?keys.has(k):!!(s.legLoad||HARD.test((s.subtype||'')+' '+(s.detail||'')));};\n"),
  ("E3b halfstep reads the one hard test",
   "        const isHardH=s.legLoad||HARD.test((s.subtype||'')+' '+(s.detail||''));\n",
   "        const isHardH=_hardBy(s,_HALFSTEP_HARD_KEYS);\n"),
  ("E3c easy/reduce reads the one hard test",
   "        const isHard=s.legLoad||HARD.test((s.subtype||'')+' '+(s.detail||''));\n",
   "        const isHard=_hardBy(s,_PROTECT_PARK_KEYS);\n"),
  ("E4 the protected card's key follows the card",
   "        s.note='Hard running is parked while this heals. Easy volume keeps the engine without poking the injury.';\n"
   "        s.legLoad=false;\n",
   "        s.note='Hard running is parked while this heals. Easy volume keeps the engine without poking the injury.';\n"
   "        s.legLoad=false;\n"
   "        if(s.dose&&s.dose.key) s.dose.key='easy';   // D103a: the key describes the card it now is\n"),
]
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor "%s" count=%d (want 1); nothing written' % (name, n))
    src = src.replace(old, new, 1)
open(P, 'w', encoding='utf-8').write(src)
print('applied %d edits to %s' % (len(EDITS), P))
