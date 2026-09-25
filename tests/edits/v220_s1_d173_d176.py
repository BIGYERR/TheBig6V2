#!/usr/bin/env python3
# V220 slice 1 of ~12. No version bump in this slice.
#   D173 (P-RECOVBANNER) E1: delete the week-view "Recovery spacing" banner block.
#   D173 (P-RECOVBANNER) E2: drop `+leg` from the week list innerHTML.
#   D176 (P-BARERX): on the _ssRounds branch of buildExItem's _dispDetail, a stripped
#                    remainder that is a bare count or range gets ' reps' appended.
# Rulings: tests/measure/v220_rulings/p_recovbanner_ruling.md s3/s4,
#          tests/measure/v220_rulings/p_barerx_ruling.md "The rule" + "RE-BASELINE ON V219".
# Not touched: the legRecoveryNote field write, the six engine source strings, placement
# functions, _stripLeadingSets, i.detail, parseRx, every non-superset card.
# The recycle emoji in the banner is stored in the source as its twelve-character escape TEXT
# (backslash-u 267b, backslash-u fe0f), not the glyph, so the E1 anchor is a raw string holding
# that text; everything else is literal bytes.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, 'rb').read().decode('utf-8')

E1_OLD = r"""  // ── leg-recovery note (kept) ──
  let leg='';
  if(activeProg.legRecoveryNote){
    leg='<div style="background:var(--surface);border:1px solid var(--border2);border-left:3px solid var(--accent);border-radius:4px;padding:10px 12px;margin:0 16px 12px;font-size:12px;color:var(--muted);line-height:1.5">\u267b\ufe0f <b style="color:var(--text)">Recovery spacing:</b> '+activeProg.legRecoveryNote+'</div>';
  }

"""
E1_NEW = ""

E2_OLD = "  list.innerHTML=strip+hero+_wcTag+stats+leg;\n"
E2_NEW = "  list.innerHTML=strip+hero+_wcTag+stats;\n"

D176_OLD = r"""  const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||''):(i.detail||'');
"""
D176_NEW = r"""  const _dispDetail=(_ssRounds!=null&&!i._skipped)?_stripLeadingSets(i.detail||'').replace(/^\d+(\s*[–-]\s*\d+)?$/,'$& reps'):(i.detail||'');   // V220 (D176) a bare count reads as reps
"""

EDITS = [
    ('D173-E1 banner block', E1_OLD, E1_NEW),
    ('D173-E2 +leg', E2_OLD, E2_NEW),
    ('D176 _dispDetail', D176_OLD, D176_NEW),
]

for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (name, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('ok   %s' % name)

open(P, 'wb').write(src.encode('utf-8'))
print('wrote', P)
