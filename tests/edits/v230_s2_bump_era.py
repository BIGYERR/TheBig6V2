#!/usr/bin/env python3
# V230 slice 2 of 5 (D194 P-INJLENS part 2, the lens alone): ia-version 229 -> 230 and the three
# HALF_MANNY era rows [230] = [229] by reference.
#
# Licensed diff classes: (V) ia-version 229 -> 230; (E) era rows [230] = [229] in the three harness
# tables. Slice 1 (tests/edits/v230_s1_lens_four_sites.py) carries (L1) and (L2).
#
# Digests printed by builder BEFORE this script was written, on the slice-1 tree (index.html
# reading 229, byte-identical to measure's CF6), with the harness fixture, g199's __DELOAD_OFF
# method and g200's clause-removal method:
#   shipped   0ac7da6b1691a8e1 (self-equal on a repeat build)
#   deloadOff 1069cd7f86eed204
#   coreOff   9d14801a63111081
# == V229's rows. Standing ruling 5 is satisfied; no digest moves.
#
# Every anchor is asserted count==1 against the ORIGINAL text before anything is written; the
# first miss aborts the whole script and writes nothing. Both files are written once, at the end.
# The version meta bump is the last replacement applied to index.html.
import sys, pathlib

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2')
HTML = ROOT / 'index.html'
HARN = ROOT / 'tests' / 'harness.js'

html = HTML.read_text(encoding='utf-8')
harn = HARN.read_text(encoding='utf-8')

def die(msg):
    print('ABORT: ' + msg + ' (nothing written)')
    sys.exit(1)

def need1(text, anchor, label):
    n = text.count(anchor)
    if n != 1:
        die(label + ' anchor count ' + str(n) + ', want 1: ' + anchor[:90])

# ---- precondition: slice 1 is on the tree, the bump is not ----
need1(html, 'if(hit && _dayPlanCfg(prog,day).injury){', 'slice-1 L2 guard')
need1(html, 'if(activeProg&&_dayPlanCfg(activeProg,day).injury){', 'slice-1 L1 guard')
if 'MANNY_DIGEST_BY_VERSION[230]' in harn:
    die('harness already carries a [230] row')

# ---- harness era rows (E2, E3, E4) ----
RULE_Q = ('D194 (tests/measure/v229_rulings/d194_injlens_ruling.md) "What deliberately does NOT change" states '
          '"HALF_MANNY `0ac7da6b1691a8e1`, era row `[229] = [228]` by reference (uninjured, no overlay, 0 cued, '
          'printed this session)", carried to V230 by Amendment 1 R3′ ("V230 moves two guards and two filter '
          'cfgs and nothing else"); measure M12 (tests/measure/v230_rulings/measure_lens_overlay_cf6_m12.md) '
          'printed CF6\'s HALF_MANNY 0ac7da6b1691a8e1 twice before this build, and CF6 is the slice-1 tree')
WHY = ('HALF_MANNY is uninjured and carries no overlay, so _dayPlanCfg returns prog.cfg itself on every '
       'unstamped day and the four lensed sites (the tap guard and its filter cfg, the boot guard and its '
       'filter cfg) read the same null prog.cfg.injury as V229; nothing behind them runs, and none of the '
       'four is reached by buildProgram')

A2 = 'MANNY_DIGEST_BY_VERSION[229] = MANNY_DIGEST_BY_VERSION[228];'
A3 = 'MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[228];'
A4 = 'MANNY_CORE_OFF_DIGEST_BY_VERSION[229] = MANNY_CORE_OFF_DIGEST_BY_VERSION[228];'
for a, l in ((A2, 'E2'), (A3, 'E3'), (A4, 'E4')):
    need1(harn, a, l)

def line_end(text, anchor):
    i = text.index(anchor)
    j = text.index('\n', i)
    return j  # insert after the [229] row's full line

R2 = ('MANNY_DIGEST_BY_VERSION[230] = MANNY_DIGEST_BY_VERSION[229];   // V230 (D194 P-INJLENS part 2, the lens '
      'alone): ruled UNMOVED, reference to [229]; ' + WHY + ' (standing ruling 5: ' + RULE_Q + '; '
      '0ac7da6b1691a8e1 / 1069cd7f86eed204 / 9d14801a63111081 printed by builder on the V230 candidate '
      '(slice 1 applied, before the bump) with the harness fixture and g199\'s and g200\'s methods before '
      'these rows)')
R3 = ('MANNY_DELOAD_OFF_DIGEST_BY_VERSION[230] = MANNY_DELOAD_OFF_DIGEST_BY_VERSION[229];   // V230 (D194 '
      'P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; same reasoning as '
      'MANNY_DIGEST_BY_VERSION[230]: ' + WHY + ', with recoveryDeload suppressed too (standing ruling 5: '
      + RULE_Q + '; 1069cd7f86eed204 printed by builder on the V230 candidate with g199\'s method before '
      'this row)')
R4 = ('MANNY_CORE_OFF_DIGEST_BY_VERSION[230] = MANNY_CORE_OFF_DIGEST_BY_VERSION[229];   // V230 (D194 '
      'P-INJLENS part 2, the lens alone): ruled UNMOVED, reference to [229]; the core-off counterfactual '
      'is unreached the same way MANNY_DIGEST_BY_VERSION[230] and MANNY_DELOAD_OFF_DIGEST_BY_VERSION[230] '
      'are: ' + WHY + ' (standing ruling 5: ' + RULE_Q + '; 9d14801a63111081 printed by builder on the V230 '
      'candidate with g200\'s method before this row)')

# apply bottom-up so earlier offsets stay valid
for a, row in sorted(((A2, R2), (A3, R3), (A4, R4)), key=lambda p: -harn.index(p[0])):
    j = line_end(harn, a)
    harn = harn[:j + 1] + row + '\n' + harn[j + 1:]

for r, l in ((R2, 'E2'), (R3, 'E3'), (R4, 'E4')):
    need1(harn, r, l + ' landed')

# ---- E1: version meta bump, last replacement on index.html ----
M_OLD = '<meta name="ia-version" content="229">'
M_NEW = '<meta name="ia-version" content="230">'
need1(html, M_OLD, 'E1 meta')
if html.count('content="230"') != 0:
    die('index.html already carries content="230"')
html = html.replace(M_OLD, M_NEW, 1)
need1(html, M_NEW, 'E1 landed')

HARN.write_text(harn, encoding='utf-8')
HTML.write_text(html, encoding='utf-8')
print('OK: E1 meta 229 -> 230; E2/E3/E4 [230] = [229] rows inserted after their [229] rows')
