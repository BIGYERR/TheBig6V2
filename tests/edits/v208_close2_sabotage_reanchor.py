#!/usr/bin/env python3
# V208 close 2 — sabotage upkeep. Gatekeeper found 10 older mutations NOT-APPLIED on V208 (anchor count 0;
# all tripped on V207). Each is re-anchored on the V208 text with its INTENT kept: same claim, same named
# gate. Every new anchor is asserted count==1 in index.html (V208) and each entry's OLD anchor is asserted
# to be the one gatekeeper reported, so nothing else in these files is touched. A note line
# "V208 UPKEEP (D103a/D104a/D106a-fix): ..." is appended to each. Files are rewritten with the format they
# already have (json.dumps indent=2, ensure_ascii=False, trailing newline: proven byte-stable on all four).
#   v202 M7   the E4 pace-clock note, now 'SI: Pace moves'; the V201 wording is restored in its SI form.
#   v202 M24  the progression-path generic note, now 'SI: Zone 5'; the cap of 10 comes back on that copy.
#   v206 M1   the fiveK test-goal generic note, now 'SI: Zone 5'; the replacement is still a PREVIOUS ERA's
#             ruled head ('INT — Interval: Zone 5', D9 V202), because srcOther counts only era-row heads
#             and this mutation is the one that proves srcOther (an SI-dash head no era row names would
#             drop srcNew only, and the srcOther proof would be lost).
#   v206 M4   the pace-clock head, now 'SI: Pace moves'; the D109 revert in SI form, 'SI — Short Interval:'.
#   v205 M8   the pace speed set is key-first at V208; the label regex is the frozen-card fallback and no
#             fresh build reaches it, so a mutation on the regex alone is a no-op. INT is dropped from BOTH
#             arms (key and label), which is the claim: "only CHI counts as a speed day".
#   v205 M9   the pace note is now the second arm of the run_base ternary; the em-dash goes into that arm.
#   v205 M10  the shape return now carries `base`; the eve is dropped from the forbidden set as before.
#   v207 M9   the eve _rec line now carries !legLoad; the regex is reverted to recovery run only, as before.
#   v207 M13  the same line; only the run-card guard is dropped (the !legLoad guard stays), so the row
#             still tests the run-card guard.
#   v207 M10  the B4 replacement copy now stamps key:'easy'; the replacement is removed, as before.
import sys, json
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
H = open(R + 'index.html', encoding='utf-8').read()
if '<meta name="ia-version" content="208">' not in H: sys.exit('ABORT: index.html is not ia-version 208')
UP = ' V208 UPKEEP (D103a/D104a/D106a-fix): '
SI_ZONE_TAIL = " All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';\n          }\n          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about"
PLAN = {
 'tests/sabotage/v202.json': {
  'M7': dict(
    old="            note = `INT: Pace moves ${pp._weeklyGain} seconds per mile each week. That is the safe rate for your experience and age. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;",
    anchor="            note = `SI: Pace moves ${pp._weeklyGain} seconds per mile each week. That is the safe rate for your experience and age. Your full goal of ${goalFmt}/mi needs more weeks than this block has. The target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;",
    replacement="            note = `SI — Short Interval: Pace capped at +${pp._weeklyGain}s/mi/week (physiological safety limit). Full goal of ${goalFmt}/mi requires more time — realistic target for this block is ${reachFmt}/mi. Hit the prescribed pace precisely.`;",
    up="re-anchored on the SI head (D103a renamed the INT note head); the V201 wording is restored in its SI form. The first C1 miss now begins 'W1 reads |SI — Short Interval: Pace capped at'. Observed on V208: C1 C2 C3 and C10a; C10a is collateral that trips on V207 too with the original anchor. EXPECTED: C1 C2 C3 C10a."),
  'M24': dict(
    old="          } else {\n            note = 'INT: Zone 5 (95%+ max HR) on work efforts. All out on each rep. Take the full recovery. Build from 4 reps to 8. Hard cap at 8. Quality over quantity. If pace drops, stop.';\n          }\n          // D2b-iii (V142), re-sited V202 (S1): this appendix is about the SHIFT, not about",
    anchor="          } else {\n            note = 'SI: Zone 5 (95%+ max HR) on work efforts." + SI_ZONE_TAIL,
    replacement="          } else {\n            note = 'SI: Zone 5 (95%+ max HR) on work efforts." + SI_ZONE_TAIL.replace('Hard cap at 8.', 'Hard cap at 10.', 1),
    up="re-anchored on the SI head of the progression-path copy; that copy takes the cap of 10 back, so D9 reads 4 -> 3 ruled at the D103a era row and D9b reads the rendered note off the ruled string. EXPECTED unchanged: D9 D9b."),
 },
 'tests/sabotage/v206_d109.json': {
  'M1': dict(
    old="m:400, tgt:Math.round(_chartRow.fiveK)};\n        note = 'INT: Zone 5 (95%+ max HR) on work efforts.",
    anchor="m:400, tgt:Math.round(_chartRow.fiveK)};\n        note = 'SI: Zone 5 (95%+ max HR) on work efforts.",
    replacement="m:400, tgt:Math.round(_chartRow.fiveK)};\n        note = 'INT — Interval: Zone 5 (95%+ max HR) on work efforts.",
    up="re-anchored on the SI head of the fiveK copy. The replacement stays a PREVIOUS ERA's ruled head (D9, V202), because D9's srcOther counts era-row heads only and this is the mutation that proves srcOther: D9 now reads 3 ruled (D103a head) and 1 in another era's form. EXPECTED unchanged: D9 only."),
  'M4': dict(
    old="note = `INT: Pace moves ${pp._weeklyGain} seconds per mile each week.",
    anchor="note = `SI: Pace moves ${pp._weeklyGain} seconds per mile each week.",
    replacement="note = `SI — Short Interval: Pace moves ${pp._weeklyGain} seconds per mile each week.",
    up="re-anchored on the SI head; the D109 revert is written in its SI form ('SI — Short Interval: Pace moves'). At ia-version 208 C1's era row reads 'SI: ', so every dampened note misses with the first miss |SI — Short Interval: Pace moves|, and C3 names the dash. EXPECTED unchanged: C1 C3."),
 },
 'tests/sabotage/v205.json': {
  'M8': dict(
    old="      if(/^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(_st)) speed.add(d);",
    anchor="      if(_k ? (_k === 'int' || _k === 'chi') : /^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(_st)) speed.add(d);",
    replacement="      if(_k ? (_k === 'chi') : /^Continuous High Intensity \\(CHI\\)/.test(_st)) speed.add(d);",
    up="the speed set is key-first at V208 (D103a slice 2) and the label regex is the frozen-card fallback no fresh build reaches, so a mutation on the regex alone would be a no-op. INT is dropped from BOTH arms, which is the claim. EXPECTED unchanged: P14 P1e P2 P6e (P6e on the label arm, the others on the key arm)."),
  'M9': dict(
    old="  return { legRecoveryNote: 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.' };",
    anchor="    : 'Your hinge day rides a speed session so hard days stay hard. Nothing heavy lands the day before your long run.' };",
    replacement="    : 'Your hinge day rides a speed session \\u2014 so hard days stay hard. Nothing heavy lands the day before your long run.' };",
    up="the pace note is now the second arm of the run_base ternary (D104a); the em-dash goes into that arm. EXPECTED unchanged: P3a x3 P4a."),
  'M10': dict(
    old="  return { long, eve, after, speed, easy, forbidden: new Set([long, eve]) };",
    anchor="  return { long, eve, after, speed, easy, forbidden: new Set([long, eve]), base };",
    replacement="  return { long, eve, after, speed, easy, forbidden: new Set([long]), base };",
    up="the shape return now carries `base` (D104a); the eve is dropped from the forbidden set as before. Observed on V208: P14 P15 P16 P2. P17 stays green, and it stays green on V207 with the original anchor too (the 7-day lattice is 22 weeks with no eve hit), so the P17 in the line above was stale before V208. EXPECTED: P14 P15 P16 P2."),
 },
 'tests/sabotage/v207_d106a.json': {
  'M9': dict(
    old="    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && /^long slow distance/i.test(day.cardio.subtype||''));",
    anchor="    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && !day.cardio.legLoad && /^long slow distance/i.test(day.cardio.subtype||''));",
    replacement="    const _rec = /^recovery run/i.test(day.cardio.subtype||'');",
    up="the eve line now carries the !legLoad guard (the D106a shakeout fix); the regex is reverted to recovery run only, as before. EXPECTED unchanged: D3 D7a."),
  'M13': dict(
    old="    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && /^long slow distance/i.test(day.cardio.subtype||''));",
    anchor="    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (day.cardio.type === 'run' && !day.cardio.legLoad && /^long slow distance/i.test(day.cardio.subtype||''));",
    replacement="    const _rec = /^recovery run/i.test(day.cardio.subtype||'') || (!day.cardio.legLoad && /^long slow distance/i.test(day.cardio.subtype||''));",
    up="the eve line now carries the !legLoad guard (the D106a shakeout fix). Only the run-card guard is dropped and !legLoad stays, so this still tests the run-card guard: a bike LSD without legLoad on an NRC multi-sport eve is retitled. EXPECTED unchanged: D11 only."),
  'M10': dict(
    old="        if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose} : _e.dose}; else delete schedule[x.w][x.d];",
    anchor="        if(_e) schedule[x.w][x.d] = {..._e, dose: _e.dose ? {..._e.dose, key:'easy'} : _e.dose}; else delete schedule[x.w][x.d];",
    replacement="        void _e;",
    up="the B4 replacement copy now stamps key:'easy' (D103a slice 1); the replacement is removed as before. Observed on V208: D7a D7b and NEW collateral D3. Without the B4 copy, W4 Sat keeps the dealt long LSD (legLoad), and the D106a-fix guard on the eve line (!legLoad) no longer retitles a long LSD Shakeout. On V207 the same mutation tripped D7a D7b only. EXPECTED: D3 D7a D7b."),
 },
}
out = {}
for f, muts in PLAN.items():
    s = open(R + f, encoding='utf-8').read()
    L = json.loads(s)
    if json.dumps(L, indent=2, ensure_ascii=False) + '\n' != s: sys.exit('ABORT: %s does not round-trip byte-stable — nothing written' % f)
    for tag, p in muts.items():
        hits = [m for m in L if m['name'].split(' ')[0] == tag]
        if len(hits) != 1: sys.exit('ABORT: %s %s entries=%d — nothing written' % (f, tag, len(hits)))
        m = hits[0]
        if m['anchor'] != p['old']: sys.exit('ABORT: %s %s old anchor is not the reported one — nothing written' % (f, tag))
        if H.count(p['old']) != 0: sys.exit('ABORT: %s %s old anchor still applies on V208 (count %d) — nothing written' % (f, tag, H.count(p['old'])))
        if H.count(p['anchor']) != 1: sys.exit('ABORT: %s %s new anchor count=%d on V208 — nothing written' % (f, tag, H.count(p['anchor'])))
        if p['replacement'] == p['anchor']: sys.exit('ABORT: %s %s replacement equals anchor — nothing written' % (f, tag))
        m['anchor'] = p['anchor']; m['replacement'] = p['replacement']
        m['note'] = m.get('note', '').rstrip() + UP + p['up']
    out[f] = json.dumps(L, indent=2, ensure_ascii=False) + '\n'
for f, s in out.items():
    open(R + f, 'w', encoding='utf-8').write(s)
print('re-anchored 10 mutations in', ', '.join(out))
