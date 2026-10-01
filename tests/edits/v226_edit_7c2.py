#!/usr/bin/env python3
# V226 build 5, slice 7c2: D188/D189 gate amendment section (d).
# G7e (run_5k forms table) in tests/gates/g226_d189_pacedisclose.js gains two beginner rows.
# D189 arm: the ruled entered/seeded strings. V225 arm: CARD_DEF_V225('beginner') and the 11:30 beginner default clip.
# Tests only. Every anchor asserted count==1; all edits apply or none.
import sys
P = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/g226_d189_pacedisclose.js'
src = open(P, encoding='utf-8').read()
EDITS = [
    (
        "      'Anchored on a 9:00 mile, the time you entered in week 3. Before that it was 9:30.' + TAIL_CHART, clipOf('9:00', 'edited in week 3', chartKeys('9:00'))],\n  ];\n",
        "      'Anchored on a 9:00 mile, the time you entered in week 3. Before that it was 9:30.' + TAIL_CHART, clipOf('9:00', 'edited in week 3', chartKeys('9:00'))],\n"
        "    // amendment (d): a beginner with a mile reads the entered and seeded forms at 226; V225 printed the beginner default over any mile.\n"
        "    ['entered 9:00 beginner', 'beginner', 540, { kind: 'entered' },\n"
        "      D189 ? 'Anchored on a 9:00 mile, the time you entered.' + TAIL_CHART : CARD_DEF_V225('beginner'),\n"
        "      D189 ? clipOf('9:00', 'entered', chartKeys('9:00')) : clipOf('11:30', 'beginner default', chartKeys('11:30'))],\n"
        "    ['seeded 9:00 beginner', 'beginner', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 },\n"
        "      D189 ? 'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART : CARD_DEF_V225('beginner'),\n"
        "      D189 ? clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00')) : clipOf('11:30', 'beginner default', chartKeys('11:30'))],\n"
        "  ];\n",
    ),
]
for i, (a, _) in enumerate(EDITS):
    n = src.count(a)
    if n != 1:
        sys.exit('ABORT: anchor %d count %d (want 1); nothing written' % (i, n))
out = src
for a, b in EDITS:
    out = out.replace(a, b, 1)
open(P, 'w', encoding='utf-8').write(out)
print('v226_edit_7c2: %d edit(s) applied to %s' % (len(EDITS), P))
