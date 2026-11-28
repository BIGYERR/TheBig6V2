"""Two screenshots' text bands side by side: top and height of each band, and the gap from the band before, with the
difference of each gap. usage: cmp.py <beta png> <today png> [x0 x1] [skip indexes of today's bands, comma separated]"""
import sys
from collections import Counter
from PIL import Image

def bands(path, x0, x1):
    im = Image.open(path).convert('RGB')
    W, H = im.size
    s = W / 402.0
    px = im.load()
    a, b = int(x0 * s), int(x1 * s)
    ink = []
    for y in range(H):
        row = [px[x, y] for x in range(a, b, 2)]
        bg = Counter(row).most_common(1)[0][0]
        ink.append(any(abs(c[0] - bg[0]) + abs(c[1] - bg[1]) + abs(c[2] - bg[2]) > 40 for c in row))
    out, start = [], None
    for y, on in enumerate(ink + [False]):
        if on and start is None:
            start = y
        elif not on and start is not None:
            if y - start >= 3:
                out.append((start / s, y / s))
            start = None
    return out

x0 = float(sys.argv[3]) if len(sys.argv) > 4 else 12
x1 = float(sys.argv[4]) if len(sys.argv) > 4 else 130
skip = set(int(i) for i in sys.argv[5].split(',')) if len(sys.argv) > 5 else set()
mine = bands(sys.argv[1], x0, x1)
theirs = [b for i, b in enumerate(bands(sys.argv[2], x0, x1)) if i not in skip]
print('  #   beta top  (tall)  gap | today top  (tall)  gap |  gap diff  tall diff')
worst = 0.0
for i in range(max(len(mine), len(theirs))):
    m = mine[i] if i < len(mine) else None
    t = theirs[i] if i < len(theirs) else None
    mg = m[0] - mine[i - 1][1] if m and i else 0
    tg = t[0] - theirs[i - 1][1] if t and i else 0
    if m and t:
        d = tg - mg
        dh = (t[1] - t[0]) - (m[1] - m[0])
        if i > 1:
            worst = max(worst, abs(d), abs(dh))
        print('%3d  %8.1f %7.1f %5.1f | %8.1f %7.1f %5.1f | %8.1f %9.1f' % (i, m[0], m[1] - m[0], mg, t[0], t[1] - t[0], tg, d, dh))
    else:
        b = m or t
        print('%3d  %s %8.1f %7.1f' % (i, 'beta only ' if m else 'today only', b[0], b[1] - b[0]))
print('worst gap or height difference after the status bar: %.1f pt' % worst)
