#!/usr/bin/env python3
# V202 handoff part 3 — documentation only, no app change, no ia-version bump.
# Ruling (session, this run): §6's V104 freeze bullet (line 260) repeated the false
# invariant that Part 2 corrected in §4 — and cited §4 by name while doing it.
# prog.weeks IS persisted and refreshProgram DOES read it back; that read is load-bearing.
# The V104 lesson (the freeze restores the rendered day from ia_hist_) is untouched.
# Only the false half of the parenthetical goes.
# ONE anchor, ONE clause. index.html, CLAUDE.md, gates and specs are not touched.
# §5's V116 bullet at line 178 is deliberately left alone (not false, already
# marked partially superseded by the new §5 bullet, and out of scope).

import sys, io

PATH = 'IRON_ASYLUM_HANDOFF_1_1.md'

OLD = "`refreshProgram`'s output is never persisted (§4), so `prog.weeks` is the creation-day build with **no overlays in it** — restoring from it"
NEW = "The stored grid holds the creation-day rows with **no overlays in them** (§4) — restoring from it"

with io.open(PATH, encoding='utf-8') as f:
    src = f.read()

n = src.count(OLD)
print('anchor count =', n)
if n != 1:
    sys.exit('ABORT: anchor count != 1 (got %d) — nothing written' % n)

out = src.replace(OLD, NEW)
if out == src:
    sys.exit('ABORT: replacement was a no-op')

with io.open(PATH, 'w', encoding='utf-8') as f:
    f.write(out)

print('WROTE', PATH)
