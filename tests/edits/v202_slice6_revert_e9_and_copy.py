# V202 slice 6 — R1 revert E9 (ruled removal, D105 moves to D114/D115), R2/R3 ruled INT strings.
# No ia-version bump: the final slice owns it.
import io, sys, hashlib

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = io.open(P, encoding='utf-8').read()
orig = src

def one(hay, needle, label):
    n = hay.count(needle)
    print('anchor %-4s count=%d' % (label, n))
    if n != 1:
        sys.exit('ABORT: anchor %s count==%d, want 1' % (label, n))
    return n

# ── R1 — remove the E9 ramp scan + _intIdx hold, restore weekPace to _ppIdx ──────
START = '        // ── V202 D105: VOLUME FIRST'
END   = '        const weekPace   = pp ? pp[(_cb && _intIdx > 0) ? _intIdx - 1 : _intIdx] : null;  // D2b: effective index\n'
RESTORED = '        const weekPace   = pp ? pp[(_cb && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx] : null;  // D2b: effective index\n'
one(src, START, 'R1a')
one(src, END, 'R1b')
i = src.index(START)
i = src.rindex('\n', 0, i) + 1
j = src.index(END) + len(END)
if j <= i:
    sys.exit('ABORT: R1 end anchor precedes start anchor')
removed = src[i:j]
print('R1 removing %d bytes / %d lines' % (len(removed), removed.count('\n')))
src = src[:i] + RESTORED + src[j:]

# ── R2 / R3 — the two ruled INT detail strings (coach verbatim) ─────────────────
A2 = '          const _rec = _intRec(_intTgt, 400);\n'
B2 = ('          const _rec = _intRec(_intTgt, 400);\n'
      '          // The recovery band prints as a clock in both limbs, so the sentence coach ruled\n'
      "          // is written out verbatim rather than assembled from _rec.txt.\n"
      '          const lo = _intClk(_rec.lo), hi = _intClk(_rec.hi);\n')
one(src, A2, 'R2a')
src = src.replace(A2, B2)

A3 = ('          detail = _cb\n'
      '            ? `${intReps}x400m at ${fmt(intPace)}/mi (cutback — holding last week’s target). ${_rec.txt} ${_INT_WARMUP}`\n'
      '            : `${intReps}x400m at ${fmt(intPace)}/mi (week ${week} interval target — slightly faster than this week’s goal of ${fmt(weekPace)}/mi). ${_rec.txt} ${_INT_WARMUP}`;\n')
if src.count(A3) != 1:
    # the source may carry a straight apostrophe instead of a curly one
    A3 = A3.replace('’', "'")
A3c = one(src, A3, 'R3a')
B3 = ('          detail = _cb\n'
      '            ? `${intReps}x400m at ${fmt(intPace)}/mi. Cutback week. Same target as last week, fewer reps. '
      'Recovery: ${lo} to ${hi} of easy jogging or walking. Keep moving. ${_INT_WARMUP}`\n'
      '            : `${intReps}x400m at ${fmt(intPace)}/mi. This week’s goal pace is ${fmt(weekPace)}/mi. '
      'Recovery: ${lo} to ${hi} of easy jogging or walking. Keep moving. ${_INT_WARMUP}`;\n')
if "'s target" in A3:            # match the apostrophe style already in the file
    B3 = B3.replace('’', "'")
src = src.replace(A3, B3)

if src == orig:
    sys.exit('ABORT: no change written')
io.open(P, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes)' % (P, len(orig), len(src)))
