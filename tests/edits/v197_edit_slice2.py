# tests/edits/v197_edit_slice2.py
# V197 SLICE 2 — D70b, the fallback removal, LAST. Slice 1 (the harvest, the
# subtraction and the legIso[1] guard) must already be in the file: the harvest IS
# the crash guard for this one token.
import io, sys

P = 'index.html'
src = io.open(P, encoding='utf-8').read()
orig = src
reps = []

def rep(old, new, label):
    reps.append((old, new, label))

# ── 1. The comment that says the fallback is load-bearing ───────────────────
rep(
"""  // The non-empty fallback is load-bearing: EXLIB.leg_iso is four machine movements, so
  // filtering it on a cable-less tier would empty the pool and starve a pick(...,2). Rather
  // than invent substitutes here — swapping an isolation for a compound changes the
  // character of the day and is a coaching call, not a mechanical one — an all-illegal pool
  // passes through untouched and is logged as a known gap.""",
"""  // V197 (D70b): the non-empty fallback is GONE. It used to be justified by EXLIB.leg_iso
  // being all machine movements, so filtering it on a cable-less tier emptied the pool and
  // starved a pick(...,2). That justification made the whole filter advisory: every pool
  // that emptied was handed back whole, so withholding gear withheld nothing — crossfit
  // drew 428 machine items, home_basic 716. The substitutes are no longer invented here,
  // they were harvested into the pool itself (V197 D75, EXLIB.leg_accessory), which is the
  // coaching call this comment said it would not make mechanically. The denial now lands:
  // an all-illegal pool returns EMPTY, and the one live consumer guards its second index.""",
"D70b comment: fallback no longer load-bearing")

# ── 2. The V127 history block quotes the line that is about to stop existing ─
rep(
"""    // THE DUMBBELL AXIS (V127). Attempted in V122 and reverted the same session, because
    // _gear falls back to the RAW pool when filtering empties it:
    //   const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f.length ? f : pool; };""",
"""    // THE DUMBBELL AXIS (V127). Attempted in V122 and reverted the same session, because
    // _gear USED TO fall back to the RAW pool when filtering emptied it (removed V197,
    // D70b — the quote below is history, not the current line):
    //   const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f.length ? f : pool; };""",
"V127 history block: mark the quote as historical")

# ── 3. D70b — the one token ─────────────────────────────────────────────────
# NOTE: the bare line is NOT unique — the V127 history block above quotes it verbatim
# inside a comment. The anchor carries the two lines of _gearOK's tail to disambiguate.
rep(
"""    return true;
  };
  const _gear = pool => { const f=(pool||[]).filter(_gearOK); return f.length ? f : pool; };""",
"""    return true;
  };
  const _gear = pool => (pool||[]).filter(_gearOK);""",
"D70b _gear fallback removal")

# ── 4. version meta bump — LAST ────────────────────────────────────────────
rep(
'<meta name="ia-version" content="196">',
'<meta name="ia-version" content="197">',
"ia-version 196 -> 197")

fail = []
for old, new, label in reps:
    c = src.count(old)
    print('anchor count==%d  %s' % (c, label))
    if c != 1:
        fail.append(label)
if fail:
    sys.exit('ABORT: anchor count != 1 for: ' + '; '.join(fail))

for old, new, label in reps:
    src = src.replace(old, new, 1)

assert src != orig
io.open(P, 'w', encoding='utf-8').write(src)
print('slice 2 written: %d replacements' % len(reps))
