#!/usr/bin/env python3
"""
V224 build P-WCTODAY, ruling D185.
Fix: .wc-mark (Wildcard flame+W) and .chk (completion tick) both declare their own
color and escape the .wk-day.today override, rendering orange-on-orange (contrast
1.00) and green-on-orange (contrast 1.13) on the today cell. Insert one CSS rule
after the .wc-mark base rule (index.html:645) folding both glyphs into
var(--on-signal) on today, matching the pattern already used for the day label,
number and away underline on that cell.

Diff class: one CSS insertion (new line), zero removals, plus the standing
ia-version meta bump. No JS touched.
"""
import pathlib

PATH = pathlib.Path(__file__).resolve().parents[2] / "index.html"
src = PATH.read_text()

# --- Edit 1: insert the today-cell color override after the .wc-mark base rule ---
anchor = (
    '.wk-day-num .wc-mark{color:var(--signal);}\n'
    '.wc-mark{display:inline-flex;align-items:center;gap:1px;color:var(--signal);line-height:1;}\n'
)
assert src.count(anchor) == 1, f"anchor not found exactly once: {src.count(anchor)}"

new_rule_line = '.wk-day.today .chk,.wk-day.today .wc-mark{color:var(--on-signal);}\n'
replacement = anchor + new_rule_line

assert src.count(new_rule_line) == 0, "new rule already present, refusing to double-insert"

src = src.replace(anchor, replacement, 1)

# --- Edit 2: version bump (last replacement) ---
old_meta = '<meta name="ia-version" content="223">'
new_meta = '<meta name="ia-version" content="224">'
assert src.count(old_meta) == 1, f"version anchor not found exactly once: {src.count(old_meta)}"
src = src.replace(old_meta, new_meta, 1)

PATH.write_text(src)
print("V224 edit applied: inserted today-cell color-fold rule after :645, bumped ia-version 223 -> 224.")
