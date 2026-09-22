#!/usr/bin/env python3
# V204 slice 9 — the handoff fold. Touches ONLY IRON_ASYLUM_HANDOFF_1_1.md.
# Every anchor asserted count==1 before writing; aborts on the first miss.
import io, sys, os

DOC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'IRON_ASYLUM_HANDOFF_1_1.md')
DOC = os.path.normpath(DOC)
src = io.open(DOC, encoding='utf-8').read()
orig = src

def repl(old, new, tag):
    global src
    n = src.count(old)
    assert n == 1, 'ANCHOR %s: count==%d, expected 1' % (tag, n)
    src = src.replace(old, new)

def line_index(prefix, tag):
    lines = src.split('\n')
    hits = [i for i, l in enumerate(lines) if l.startswith(prefix)]
    assert len(hits) == 1, 'LINE ANCHOR %s: %d hits, expected 1' % (tag, len(hits))
    return lines, hits[0]

def insert_before(prefix, block, tag):
    global src
    lines, i = line_index(prefix, tag)
    lines[i:i] = block
    src = '\n'.join(lines)

def replace_line(prefix, newline, tag):
    global src
    lines, i = line_index(prefix, tag)
    lines[i] = newline
    src = '\n'.join(lines)

# ── THE REGISTRY, FIRST ──────────────────────────────────────────────────────
repl('highest assigned = D126. Next free = D127.',
     'highest assigned = D127. Next free = D128.', 'registry')

# ── ELEMENT 1 — current state header ─────────────────────────────────────────
WORKING = r"""- **Working file:** `index.html` — **V204**; `<meta name="ia-version">`=**204**. Built in order after V203. **V204 BUILT D126: one carrying clock helper, and the gate blindness that hid it.** `_clkMS(sec)` (`:2188`) rounds the WHOLE value before splitting at 60, which makes a seconds limb of `60` structurally impossible rather than corrected after the fact. **Eleven** defective copies of `Math.round(<expr> % 60)` were re-pointed at it, and a twelfth (`applySeedData`, `:2635`), which already carried its own `ss===60` correction, was left alone. Before: **264 malformed strings** across **3,152,159** scanned card fields, all on the pace-goal path, printing `7:60/mi` on a card whose `dose.tgt` was the correct `480`. After: **0** on the run build path, and 0 by direct probe on the three log-and-wizard-fed formatters that a build sweep cannot reach. The defect was pre-existing and it had MOVED: V201 carried **628** occurrences at one shape on advanced athletes only, V202's NSW run-path rework cut it to **264** but spread it across eight shapes and intermediate as well, and V203 was byte-identical to V202 in this dimension. **The gate half matters more than the fix.** **Three gates reproduced the defective idiom as their own oracle** (`g203_ceiling_and_anchor.js:91`, `g202_pace_anchor.js:47`, `g202_int_doctrine.js:64`), so they computed `7:60` and compared equal; **twelve regexes read a pace back with `\d\d`** and parsed `7:60` as well formed, including the `toSec` PARSER (`g202_int_doctrine.js:131`, now `:152`), which silently normalised it to 480 s so downstream arithmetic passed on malformed text. All corrected. But correcting them changed nothing: the gates still passed on V203. **659 oracle invocations with 0 fractional inputs; 62 lattice configs / 104,822 strings with 0 malformed seconds.** The oracles were latently blind and the blindness never had to work, because no config in any of those gates reached a fractional pace. The real cause was a **LATTICE COVERAGE GAP**, closed by adding one named fractional row (6:46 mile anchor, seed 76308) which takes `g202_int_doctrine` to **27/0** on the candidate and **23/4 on V203** — the gate can now fail on the defect it was fixed for. New `tests/gates/g204_clock_limb.js`, 31 rows at first cut and **65** after wiring rows per formatter plus a source census; new `tests/measure/v204_idiom_census.js`, whose masker parses its own masked output as a self check so the counts cannot come from a desynced scan. Sabotage **6/6**. `HALF_MANNY` digest **UNMOVED** at `7d4f7ed45cc5bd53`; all three era tables carry `[204]` REFERENCE rows, verified by rebuilding each arm against the V203 literals. Flagged, carried from V203 and still not fixed: the `new Date(...)` UTC off-by-one at `:2991`, `:13740` and in the D116 popup."""
replace_line('- **Working file:** `index.html` — **V203**', WORKING, 'working file line')

repl('- **Most recent work (V203): the mile the athlete could not change',
     '- **Prior work (V203): the mile the athlete could not change', 'demote V203 lead')

LEAD = r"""- **Most recent work (V204): the clock that printed `7:60`, and the three gates that computed `7:60` too.** Mario reported a card reading **`7:60/mi`**. The card's own `dose.tgt` was the correct **480**, so the number was right and only the string was wrong: eleven formatters split the minutes off a fractional pace and THEN rounded the remainder, and `round(59.5)` is `60`. **D126** gives the seconds limb one owner, `_clkMS(sec)`, which rounds the whole value first, so `:60` cannot be constructed. Mario took the whole family rather than the single measured formatter, on the ground that nine known-wrong copies left standing would surface next in logged data, where it is harder to spot. **264 malformed strings across 3,152,159 scanned card fields became 0.** The second half of the session was the suite, and it is the part worth remembering. **Three gates had copied the defective idiom into their own oracles** and were computing `7:60` on both sides of the comparison; **twelve read-back regexes used `\d\d` for a seconds limb**, and one of them was a PARSER that turned `7:60` into 480 s so every downstream arithmetic assertion passed on text that was not a time. Correcting all of it **changed nothing** — the gates still passed on the broken version, because **659 oracle invocations saw 0 fractional inputs** and **62 lattice configs / 104,822 strings held 0 malformed seconds**. The blindness never had to work. What made the coverage real was **one named fractional config** (6:46 mile anchor, seed 76308), which puts `g202_int_doctrine` at **27/0** on V204 and **23/4 on V203**. Two other things came out of the session: Mario's challenge to the proposed pace-goal week changed a ruling (**D127**, D36's long-run protection extended to the pace goal), and the session collided its own D-codes by issuing D126 while coach was mid-ruling. §11f, §12.
"""
insert_before('- **Prior work (V203): the mile the athlete could not change', LEAD.split('\n'), 'insert V204 lead')

# ── ELEMENT 2 — fold next to the code it describes (§5) ──────────────────────
FOLD = r"""
**One carrying clock, and the twelfth copy that already had its own carry (V204, D126).** `_clkMS(sec)` (`index.html:2188`) is the **single owner of every seconds limb the app prints**. It rounds the whole value and then splits (`const t = Math.round(sec); return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0')`), so a `:60` limb is structurally impossible instead of corrected after the fact — the technique `_fmtHMS` already used. **Eleven call sites are wired to it** (`:2195`, `:2372`, `:3631`, `:3895`, `:3931`, `:4138`, `:4620`, `:12053`, `:12421`, `:13714`, `:15122`), and **the suffix belongs to the caller**: `/mi`, `/100`, or bare. **The one surviving `Math.round(x % 60)` in the file is `applySeedData` (`:2635`)**, which carries its own explicit `if(ss===60){mm++;ss=0;}` carry and is therefore correct; it is left alone deliberately, not missed. **The round-OUTSIDE form `Math.round(x) % 60` at `:2342` and `:2456` is a different expression and is correct**, and the idiom census deliberately does not count it — a census matching on `% 60` alone would report two false positives on every run. Two of the eleven cannot be caught behaviourally at all: the NRC formatter (`:3931`) and `_intClk` (`:3895`) have **whole-second input domains**, so no build and no mutation can feed either a fraction. Their coverage is the **source census row** in `tests/gates/g204_clock_limb.js`, and the gate **says that in its own output** rather than claiming a behavioural coverage it does not have.
"""
repl(r"""unruled, pinned by gate G5c so it cannot drift by accident (§12).""",
     r"""unruled, pinned by gate G5c so it cannot drift by accident (§12).""" + FOLD.rstrip('\n'),
     'section 5 clock fold')

io.open(DOC, 'w', encoding='utf-8').write(src)
print('slice 9 part A written: %d -> %d bytes' % (len(orig), len(src)))
