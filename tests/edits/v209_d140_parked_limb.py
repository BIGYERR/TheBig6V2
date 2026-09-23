#!/usr/bin/env python3
# PARKED (standing ruling 7) — V208 slice 6, D140 NSW long-run tier limb. NOT RUN on index.html.
# Parked because the counterfactual (cf_s6_208.html, this exact edit on a scratch copy) refutes
# the ruling's after-grid on W7 and W11 of the stand-in: the ruled mechanism (_D18_LEG_RX +
# /power/ section drop + the _n() set budget) keeps Burpees / Mountain climbers (W7) and Ball
# slams (W11), and leaves 12 and 9 doctrine-counted sets. Resume as-is ONLY if coach's
# re-ruling leaves this limb intact; move to tests/edits/v208_slice6_d140.py when resumed.
import sys, pathlib
P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')
EDITS = [(
"""function _longRunTier(cardio){
  if(!cardio || !cardio.isNRC || !cardio.dose) return null;
  if(!/^long run/i.test(cardio.subtype||'')) return null;
  if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
  if(/rehearsal/i.test(cardio.detail||'')) return 'A';
""",
"""function _longRunTier(cardio){
  if(!cardio || !cardio.dose) return null;
  if(cardio.isNRC){
    if(!/^long run/i.test(cardio.subtype||'')) return null;
    if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
    if(/rehearsal/i.test(cardio.detail||'')) return 'A';
  } else if(cardio.type!=='run' || cardio.dose.key!=='long') return null;   // D140 (V208): the NSW long run, found by its key; trial is keyed trial and never enters
"""
)]
for i, (old, new) in enumerate(EDITS, 1):
    n = src.count(old)
    if n != 1: print('ABORT edit %d: anchor count %d' % (i, n)); sys.exit(1)
    src = src.replace(old, new, 1)
P.write_text(src, encoding='utf-8'); print('wrote index.html')
