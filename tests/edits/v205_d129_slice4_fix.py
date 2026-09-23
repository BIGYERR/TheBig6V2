#!/usr/bin/env python3
# V205 slice 4, fix pass. D129 ranks 6 and 7 are PACE-FAMILY ONLY.
# Measured: left live on both arms, ranks 6/7 moved 168 of 804 NRC chooser rows. The
# ruling's own acceptance criterion is "NRC chooser output still identical on 804/804",
# and rank 6 is meaningless on the NRC arm anyway (NRC has never been served by the
# even-spread chooser, so there is no incumbent subset for identity to protect).
import io, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HTML = os.path.join(ROOT, 'index.html')
with io.open(HTML, 'r', encoding='utf-8') as f: html = f.read()

edits = [
('F1 identity paceFam-gated',
"""        const identity = (idxs.join(',') === _evenKey) ? 1 : 0;""",
"""        // paceFam-gated, and that is the whole point: identity protects the layout the
        // even-spread fallback gave THIS athlete, and only the pace family ever had one.
        // Left live on the NRC arm it moved 168 of 804 NRC chooser rows (measured).
        const identity = (paceFam && idxs.join(',') === _evenKey) ? 1 : 0;"""),
('F2 spread paceFam-gated',
"""        const spread = -_longestFree;""",
"""        // paceFam-gated for the same reason: NRC's subset and permutation pins already
        // fix its day set, and a spread term there is a new preference nobody ruled on.
        const spread = paceFam ? -_longestFree : 0;"""),
]
fail = False
for label, old, new in edits:
    c = html.count(old)
    print('%-28s count=%d' % (label, c))
    if c != 1: print('  ABORT'); fail = True
if fail: sys.exit(1)
for label, old, new in edits: html = html.replace(old, new, 1)
with io.open(HTML, 'w', encoding='utf-8') as f: f.write(html)
print('WROTE index.html')
