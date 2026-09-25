#!/usr/bin/env python3
# V221 build 2, slice S7 of D179 (P-DONENAV): the Today hero status line, the CTA condition,
# and the skipped ✕ on the day strip.
# Ruling: tests/measure/v221_rulings/p_donenav_ruling.md, AMENDMENT ON V220 (a) and MARIO DECISION
# ON THE AMENDMENT (SHIP the ✕; USE coach's two hero strings verbatim).
#   B1 (W) strip cell centre: complete ✓ > Wildcard mark > skipped ✕ > date. The ✕ is bare text in
#          .wk-day-num, so it takes the cell's own number colour and size (dim past, on-signal today)
#          from the existing .wk-day-num rules. No CSS rule for the ✕ (class X not needed).
#   B2 (V)(U) hero: the day's status via statusOf (the footer's reader, legacy partial reads done);
#          the CTA reads the open label when the hero day carries a status.
#   B3 (U) hero: the status line, one line above the CTA, absent on a pending day.
#   B4 (U) CSS: .wk-hero-status, a minimal class for that line (no existing hero class fits:
#          .wk-hero-over and .wk-hero-summary uppercase, .wk-rest-sub carries no side padding).
# No ia-version bump in this slice (stays 220). Every anchor asserted count==1 before anything is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# names this slice introduces must be new
for tok in ('wk-hero-status', '_heroSt'):
    if src.count(tok) != 0:
        sys.exit('ABORT: %s already present (%d)' % (tok, src.count(tok)))

EDITS = []

# ---- B1 (W): the skipped ✕ branch on the strip ---------------------------------------------
B1_OLD = r"""    else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);                  // V195 (D64): a Wildcard is marked, never checked
"""
B1_NEW = r"""    else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);                  // V195 (D64): a Wildcard is marked, never checked
    else if(st==='skipped') center='✕';   // V221 (D179): a skipped day is marked, bare glyph in the cell's own number colour; a Wildcard outranks it (D71b)
"""
EDITS.append(('B1 strip skipped branch', B1_OLD, B1_NEW))

# ---- B2 (V)(U): the hero day's status and the CTA condition ----------------------------------
B2_OLD = r"""    const cta=heroMode==='today'?'START SESSION':'OPEN SESSION';
"""
B2_NEW = r"""    // V221 (D179): a day with a status is closed out. The hero says so in one line and its CTA
    // takes the open label (undo lives in the day's footer); a pending today keeps the start label.
    const _heroSt=({complete:'Done ✓ Closed out. Open the session to undo.',skipped:'Skipped ✕ The week moves on. Open the session to undo.'})[statusOf(currentWeek,heroKey)]||'';
    const cta=(heroMode==='today'&&!_heroSt)?'START SESSION':'OPEN SESSION';
"""
EDITS.append(('B2 hero status + CTA condition', B2_OLD, B2_NEW))

# ---- B3 (U): the status line above the CTA ---------------------------------------------------
B3_OLD = r"""      +'<div class="wk-hero-cta-wrap"><button class="wk-hero-cta" onclick="openDayKey(\''+heroKey+'\')">'+cta+'</button></div>'
"""
B3_NEW = r"""      +(_heroSt?'<div class="wk-hero-status">'+_heroSt+'</div>':'')
      +'<div class="wk-hero-cta-wrap"><button class="wk-hero-cta" onclick="openDayKey(\''+heroKey+'\')">'+cta+'</button></div>'
"""
EDITS.append(('B3 hero status line', B3_OLD, B3_NEW))

# ---- B4 (U): the line's class ----------------------------------------------------------------
B4_OLD = """.wk-hero-cta-wrap{padding:14px 16px 18px;}
"""
B4_NEW = """.wk-hero-cta-wrap{padding:14px 16px 18px;}
/* V221 (D179): the hero's status line on a closed out day, quiet text above the CTA. */
.wk-hero-status{padding:14px 20px 0;font-size:13px;line-height:1.5;color:var(--muted);}
"""
EDITS.append(('B4 .wk-hero-status CSS', B4_OLD, B4_NEW))

# ---- assert every anchor first, then write -------------------------------------------------
for name, old, new in EDITS:
    n = src.count(old)
    print('%-34s anchor count=%d' % (name, n))
    if n != 1:
        sys.exit('ABORT: anchor for %s count=%d (need 1)' % (name, n))
out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        sys.exit('ABORT: anchor for %s moved during apply' % name)
    out = out.replace(old, new, 1)
open(PATH, 'w', encoding='utf-8').write(out)
print('written', PATH, 'delta bytes', len(out.encode('utf-8')) - len(src.encode('utf-8')))
