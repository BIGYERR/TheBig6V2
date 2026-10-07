#!/usr/bin/env python3
# post-V233 slice F1: count lines are tallies, not rows; g205_pace_eve P4b/P4c retire (measure mSK,
# tests/measure/v233_rulings/measure_skip_sort_mSK.md: the first gate.sh run under the Version scope check printed
# `row check: PASS 2064 FAIL 15`; 14 reds were each gate's closing count line, 1 was g205_pace_eve's dark P4b/P4c).
# Session calls, recorded: (a) a line whose status word is followed only by tally counts (`SKIP 0`,
# `SCOPED OUT 0  SKIP 0  NOT YET BUILT 0`, the same with any numbers) is a tally, not a row, never red and never
# allowed; a real skip row always has a label or cause and stays red. (b) g205_pace_eve P4b/P4c retire under standing
# ruling 3: D173 P-RECOVBANNER (V220) removed the on-screen banner the rows checked, so the claim is unruled.
# Tests only: index.html is not touched, ia-version stays 233.
#   (T-am) tests/rows.js               TALLY_RE: a count line is classified TALLY; parse prints it as TALLY, it is never
#                                      keyed, never in a manifest, never checked; check prints one INFO tally count
#   (R-g)  tests/gates/g205_pace_eve.js P4b/P4c, the ON_SCREEN guard and the skip counter only that branch wrote are
#                                      retired; one comment line says why; every other row prints byte-identical
#   (T-an) tests/tooling_selftest.sh   rows M19 (parse: tallies vs rows) and M20 (manifest and check: no tally key, no
#                                      tally red; the cause-carrying skip and the count line with extra text stay red)
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script with nothing
# written.
import os, sys
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = lambda *a: os.path.join(R, *a)

def die(msg):
    print('ABORT (nothing written): ' + msg); sys.exit(1)

def once(s, old, new, name):
    n = s.count(old)
    if n != 1: die('%s: anchor count %d, want 1' % (name, n))
    return s.replace(old, new)

def between(s, a, b, new, name):
    """Replace s[index(a) : index(b)) with new; a and b each count==1."""
    if s.count(a) != 1: die('%s: start anchor count %d, want 1' % (name, s.count(a)))
    if s.count(b) != 1: die('%s: end anchor count %d, want 1' % (name, s.count(b)))
    i = s.index(a); j = s.index(b)
    if j <= i: die('%s: end anchor before start anchor' % name)
    return s[:i] + new + s[j:]

def after_line(s, marker, block, name):
    """Insert block after the line holding marker (count==1)."""
    if s.count(marker) != 1: die('%s: anchor count %d, want 1' % (name, s.count(marker)))
    i = s.index(marker); j = s.index('\n', i) + 1
    return s[:j] + block + s[j:]

def before(s, marker, block, name):
    if s.count(marker) != 1: die('%s: anchor count %d, want 1' % (name, s.count(marker)))
    i = s.index(marker)
    return s[:i] + block + s[i:]

read = lambda p: open(p, encoding='utf-8').read()
OUT = {}

# ======================================================================================================== (T-am) rows.js
f = P('tests', 'rows.js'); s = read(f)
s = once(s,
'''//       The gate's rows as (key, status), one `ROW <key> <STATUS> L<line>` per status line with an id-like key, then
//       every status line with no id-like key as `UNKEYED <STATUS> L<line>: <text>`, then one count line; then each
//       UNKEYED line again with its fallback key, `FALLBACK <L:key> <STATUS> L<line>  # <normalized label>`, and one
//       fallback count line. Exit 0 (2 on a usage error or a fallback key collision).
''',
'''//       The gate's rows as (key, status), one `ROW <key> <STATUS> L<line>` per status line with an id-like key, then
//       every status line with no id-like key as `UNKEYED <STATUS> L<line>: <text>`, then every tally line (TALLY
//       below: a count line, not a row) as `TALLY <STATUS> L<line>: <text>`, then one count line; then each UNKEYED
//       line again with its fallback key, `FALLBACK <L:key> <STATUS> L<line>  # <normalized label>`, one fallback count
//       line and one tally count line. Exit 0 (2 on a usage error or a fallback key collision).
''', 'rows.js parse doc')
s = once(s,
'''//                    whose (gate, key) has no --allow entry
''',
'''//                    whose (gate, key) has no --allow entry (a tally line is not a row: never red, never allowed)
''', 'rows.js check skip doc')
s = after_line(s, '//   blank, and `PASS n FAIL n` summaries                    not status lines',
'''//   [<indent>]<STATUS> <n>[  <COUNT LABEL> <n>]... and no more  TALLY: a count line, not a row (TALLY below)
''', 'rows.js grammar table')
s = before(s, '// FALLBACK KEYS (post-V233 M1b). The label is the text after the status word',
'''// TALLY (post-V233 F1; the session call on measure mSK). A line holding a status word followed only by counts is a
// gate's closing tally, not a row: `SKIP 0`, `SKIP 3`, `SCOPED OUT 0  SKIP 0  NOT YET BUILT 0`, the same with any
// numbers, with or without blank lines before it. TALLY_RE: optional indent, an upper-case status word (PASS, FAIL,
// SKIP, SCOPED OUT, a skip tag, RETIRED), a whole number, then any number of (a count label of 1 to 3 upper-case words,
// a whole number), and nothing else on the line. parse prints it as TALLY; it is never keyed, never in a manifest and
// never checked, so it is never red and never allowed. This does not loosen the skip rule: a skipped row still prints
// its own SKIP line, with a label or cause, and that line is red without an allow entry. Any other text on a count line
// (a lower-case word, an id, punctuation) keeps it a row.
//
''', 'rows.js TALLY doc')
s = after_line(s, "const SKIP_STATUS = new Set(['SKIP', 'SCOPED OUT', 'N/A', 'NOT APPLICABLE', 'DEFER', 'DEFERRED', 'SKIPPED', 'NOT RUN']);",
r'''const TALLY_RE = /^\s*(PASS|FAIL|SKIP|SCOPED OUT|N\/A|NOT APPLICABLE|DEFERRED|DEFER|SKIPPED|NOT RUN|RETIRED)\s+\d+(?:\s+[A-Z][A-Z\/]*(?: [A-Z][A-Z\/]*){0,2}\s+\d+)*\s*$/;   // a count line (TALLY above)
''', 'rows.js TALLY_RE')
s = after_line(s, "  if(!x.trim() || /^PASS \\d+ FAIL \\d+/.test(x)) return null;",
'''  const ty = x.match(TALLY_RE);
  if(ty) return { kind: 'tally', status: ty[1] };   // a count line: not a row (TALLY above)
''', 'rows.js classify tally')
s = once(s,
"  const r = { rows: [], unkeyed: [], sub: 0, tags: {}, other: 0, summary: false, labels: Object.create(null), collide: [] };",
"  const r = { rows: [], unkeyed: [], tallies: [], sub: 0, tags: {}, other: 0, summary: false, labels: Object.create(null), collide: [] };",
'rows.js parseText init')
s = once(s,
"    if(c.kind === 'sub'){ r.sub++; return; }\n",
"    if(c.kind === 'tally'){ r.tallies.push({ status: c.status, line: i + 1, text: x }); return; }\n    if(c.kind === 'sub'){ r.sub++; return; }\n",
'rows.js parseText tally')
s = after_line(s, "  for(const u of r.unkeyed) console.log('UNKEYED ' + u.status + ' L' + u.line + ': ' + u.text.trim().slice(0, 140));",
'''  for(const t of r.tallies) console.log('TALLY ' + t.status + ' L' + t.line + ': ' + t.text.trim().slice(0, 140));
''', 'rows.js parse TALLY lines')
s = after_line(s, "  console.log('fallback ' + gate + ': ' + r.unkeyed.length",
'''  console.log('tally ' + gate + ': ' + r.tallies.length + ' count line(s) read as tallies (a status word followed only by counts): not rows, never keyed or checked');
''', 'rows.js parse tally count')
s = once(s, "  let un = 0, unG = 0;\n", "  let un = 0, unG = 0, ta = 0, taG = 0;\n", 'rows.js check tally vars')
s = once(s, "    if(r.unkeyed.length){ un += r.unkeyed.length; unG++; }\n",
"    if(r.unkeyed.length){ un += r.unkeyed.length; unG++; }\n    if(r.tallies.length){ ta += r.tallies.length; taG++; }\n",
'rows.js check tally count')
s = after_line(s, "  console.log('INFO status lines with no id-like key, fallback-keyed by label (L:<8 hex>): '",
'''  console.log('INFO tally lines (a status word followed only by counts), not rows, never keyed or checked: ' + ta + ' in ' + taG + ' gates');
''', 'rows.js check tally INFO')
OUT[f] = s

# =========================================================================================== (R-g) g205_pace_eve.js
f = P('tests', 'gates', 'g205_pace_eve.js'); s = read(f)
s = once(s, "let pass = 0, fail = 0, skip = 0;\n", "let pass = 0, fail = 0;\n", 'g205 skip counter')
s = between(s, "// P-RECOVBANNER §5 (standing ruling 2): P4b/P4c are copy rules", "// ── P5 the vacuity guard",
'''// P4b/P4c retired Post-V233 under standing ruling 3 (D173 P-RECOVBANNER removed the on-screen banner the rows checked).

''', 'g205 P4b/P4c')
OUT[f] = s

# ========================================================================================= (T-an) tooling_selftest.sh
f = P('tests', 'tooling_selftest.sh'); s = read(f)
s = after_line(s, 'row "M18 an allow cause naming a version (V233, the build number 233, ia-version, era) is red by line',
r'''# Tallies (post-V233 F1, the session call on measure mSK): a status word followed only by counts is a gate's closing
# count line, not a row. tl.js prints one PASS row, a SKIP row with a cause (P9), two count lines with extra label text
# (rows: keys 3 and 0), then three bare count lines (L5, L6, and L8 after a blank line). Every expected line is typed.
mkdir -p "$W/tl_run"
printf '%s\n' "PASS T1 one" "SKIP P9: some cause" "SKIP 3 cells: the input file is missing" "SCOPED OUT 0  SKIP 0  NOT YET BUILT 0  swim card" "SKIP 3" "SCOPED OUT 0  SKIP 0  NOT YET BUILT 0" "" "SKIP 0" "PASS 1 FAIL 0" > "$W/tl_run/tl.js.out"
printf '%s\n' "ROW T1 PASS L1" "ROW P9 SKIP L2" "ROW 3 SKIP L3" "ROW 0 SCOPED OUT L4" > "$W/tl_rows.want"
printf '%s\n' "TALLY SKIP L5: SKIP 3" "TALLY SCOPED OUT L6: SCOPED OUT 0  SKIP 0  NOT YET BUILT 0" "TALLY SKIP L8: SKIP 0" > "$W/tl_tally.want"
run "$W/tl_parse.out" node "$T/rows.js" parse tl "$W/tl_run/tl.js.out"
O="$W/tl_parse.out"
row "M19 rows.js parse: SKIP 3, SCOPED OUT 0  SKIP 0  NOT YET BUILT 0 and SKIP 0 (after a blank line) are TALLY, not rows; SKIP P9: some cause and both count lines with extra label text stay rows" 'rc_is "$O" 0 && [ "$(grep "^ROW " "$O")" = "$(cat "$W/tl_rows.want")" ] && [ "$(grep "^TALLY " "$O")" = "$(cat "$W/tl_tally.want")" ] && lacks "$O" "^(UNKEYED|FALLBACK) " && hasX "$O" "parse tl.js: status lines 4, keyed 4 in 4 keys (0 many), unkeyed 0, sub-lines 0, tags none, summary yes" && hasX "$O" "tally tl.js: 3 count line(s) read as tallies (a status word followed only by counts): not rows, never keyed or checked"' "$O"
run "$W/tl_manifest.txt" node "$T/rows.js" manifest "$W/tl_run"
printf '%s\n' "tl.js 0 once" "tl.js 3 once" "tl.js P9 once" "tl.js T1 once" > "$W/tl_manifest.want"
run "$W/tl_check.out" node "$T/rows.js" check "$W/tl_manifest.txt" "$W/tl_run"
O="$W/tl_check.out"
row "M20 rows.js manifest holds no tally key; check with no allow entry: the three tallies are not red, P9 and the two count lines with extra text are red skips by key (PASS 4 FAIL 3)" 'rc_is "$W/tl_manifest.txt" 0 && [ "$(grep -v "^#" "$W/tl_manifest.txt")" = "$(cat "$W/tl_manifest.want")" ] && rc_is "$O" 1 && has "$O" "^FAIL skip tl\.js P9 L2 .* SKIP with no tests/skip_allow\.txt entry" && has "$O" "^FAIL skip tl\.js 3 L3 .* SKIP with no tests/skip_allow\.txt entry" && has "$O" "^FAIL skip tl\.js 0 L4 .* SCOPED OUT with no tests/skip_allow\.txt entry" && [ "$(grep -c "^FAIL" "$O")" = 3 ] && hasX "$O" "INFO tally lines (a status word followed only by counts), not rows, never keyed or checked: 3 in 1 gates" && hasX "$O" "PASS 4 FAIL 3"' "$O"
''', 'selftest M19-M20')
OUT[f] = s

for p, txt in OUT.items():
    open(p, 'w', encoding='utf-8').write(txt)
    print('wrote ' + os.path.relpath(p, R))
