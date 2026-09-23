#!/usr/bin/env python3
# V209 slice 1 — D140 (coach-ruled, Mario concurred): THE RUN IS THE DAY on NSW long runs too,
# and three corrections to the shared long-run pass that the NSW limb exposed.
#   E1  _longRunTier gains the NSW limb: a run card keyed dose.key === 'long' (lsd_long and
#       run_base's budgeted long easy run). Same minutes (time: mins; dist: mi × tgt / 60),
#       same thresholds. 'trial' never enters. The NRC limb is unchanged. The V176 D33 scope
#       comment ("NRC long runs only ... NSW lsd_long stay under the interference model") is
#       rewritten in the same contiguous anchor, because the limb makes it false.
#   E2  F1: tier B drops sections matching /power|explosive/ (was /power/). Shared, both limbs.
#   E3  F2: the tier B set counter reads "N×…" as N and "N sets" as N, else 1 (was N× only, so
#       "3 sets — RPE 7" counted 1). Shared. Exactly measure's F2 string (v208_d140_nrc_sweep.js
#       F2_NEW), so the build reproduces measure's 13,591 / 24,000 NRC baseline.
#   E4  the carry ban reads the ITEM: any item whose name says carry is removed wherever it
#       sits (incl. the empty-label core section, coreHeader 'Core — …'); the label test and a
#       coreHeader test stay as belt; a section the ban empties drops. _D18_LEG_RX untouched.
# No version bump in this slice (Mario owns it). Every anchor asserted count==1 before writing;
# the first miss aborts and nothing is written. Literal bytes (—, ×, ≥), no escapes.
import sys, pathlib

P = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')
src = P.read_text(encoding='utf-8')

E1_OLD = """// a day." NRC long runs only (D33): keyed off the session's own dose (`mins`, or
// `mi × chartRow.recovery`), so the tier scales with the athlete — 6 mi is 80 min
// on a 13:20 row and 60 on a 7:30. run_base's designated long run and NSW lsd_long
// stay under the interference model until their doses are measured (§12).
// ≥75 → A: no lift, post-run mobility only (75 is the number the long-run fuel note
// already uses — one doctrine line). 45–75 → B: upper and trunk, ≤8 sets, no power,
// no hinge. <45 → C: the current interference model (with D8). No heavy carries on
// ANY long-run day regardless of length. Race day is left to raceEveLiftPass (V189, D38
// overturned D34's primer); the dress rehearsal is tier A on every row (D34) — you don't
// lift after simulating the race.
function _longRunTier(cardio){
  if(!cardio || !cardio.isNRC || !cardio.dose) return null;
  if(!/^long run/i.test(cardio.subtype||'')) return null;
  if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
  if(/rehearsal/i.test(cardio.detail||'')) return 'A';
"""
E1_NEW = """// a day." Keyed off the session's own dose (`mins`, or
// `mi × chartRow.recovery`), so the tier scales with the athlete — 6 mi is 80 min
// on a 13:20 row and 60 on a 7:30. NRC long runs are found by subtype (D33). From V209
// (D140) the NSW long run is tiered too, found by its dose.key 'long' (lsd_long and
// run_base's budgeted long easy run); a test day is keyed 'trial' and never enters.
// ≥75 → A: no lift, post-run mobility only (75 is the number the long-run fuel note
// already uses — one doctrine line). 45–75 → B: upper and trunk, ≤8 sets, no power,
// no hinge. <45 → C: the current interference model (with D8). No heavy carries on
// ANY long-run day regardless of length. Race day is left to raceEveLiftPass (V189, D38
// overturned D34's primer); the dress rehearsal is tier A on every row (D34) — you don't
// lift after simulating the race.
function _longRunTier(cardio){
  if(!cardio || !cardio.dose) return null;
  if(cardio.isNRC){
    if(!/^long run/i.test(cardio.subtype||'')) return null;
    if(/race day|time trial/i.test(cardio.subtype||'')) return null;   // V186: the 5K/10K time trial is race day (D34)
    if(/rehearsal/i.test(cardio.detail||'')) return 'A';
  } else if(cardio.type!=='run' || cardio.dose.key!=='long') return null;   // D140 (V209): the NSW long run, by its key
"""

E2_OLD = "        secs=secs.filter(sec=>!/power/i.test(sec.label||''));\n"
E2_NEW = "        secs=secs.filter(sec=>!/power|explosive/i.test(sec.label||''));   // D140 (V209) F1: an explosive finisher is power work\n"

E3_OLD = "        const _n=det=>{const m=/^(\\d+)\\s*[x×]/.exec(det||'');return m?+m[1]:1;};\n"
E3_NEW = ("        // D140 (V209) F2: \"3 sets — RPE 7\" is three sets. The counter used to read only the N× form\n"
          "        // and counted every \"N sets\" prescription as one, so a tier B day could keep 12.\n"
          "        const _n=det=>{let m=/^(\\d+)\\s*[x×]/.exec(det||'');if(m)return +m[1];m=/\\b(\\d+)\\s*sets?\\b/i.exec(det||'');return m?+m[1]:1;};\n")

E4_OLD = """      // No heavy carries on ANY long-run day, regardless of length.
      let secs=day.sections.filter(sec=>!/carry/i.test(sec.label||''));
"""
E4_NEW = """      // No heavy carries on ANY long-run day, regardless of length. D140 (V209): the ban reads
      // the ITEM, because a carry rides sections whose label never says so (the core section
      // is label '' with coreHeader 'Core — …'). Farmer, Suitcase and Overhead carry are the
      // three threads, and every carry the engine names says carry. The label and coreHeader
      // tests stay as belt. A section the ban empties drops; an untouched one is kept as is.
      const _isCarry=it=>/carry/i.test((it&&it.name)||'');
      let secs=[];
      day.sections.forEach(sec=>{
        if(/carry/i.test(sec.label||'')||/carry/i.test(sec.coreHeader||'')) return;
        const its=sec.items||[], kept=its.filter(it=>!_isCarry(it));
        if(its.length&&!kept.length) return;
        secs.push(kept.length===its.length?sec:{...sec, items:kept});
      });
"""

EDITS = [('E1 limb', E1_OLD, E1_NEW), ('E2 F1', E2_OLD, E2_NEW), ('E3 F2', E3_OLD, E3_NEW), ('E4 carry', E4_OLD, E4_NEW)]
for tag, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT %s: anchor count %d (want 1): %r' % (tag, n, old[:90])); sys.exit(1)
    src = src.replace(old, new, 1)
P.write_text(src, encoding='utf-8')
print('wrote index.html (4 edits: E1 limb, E2 F1, E3 F2, E4 carry)')
