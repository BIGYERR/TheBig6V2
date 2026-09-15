#!/usr/bin/env python3
# V195 gate fix: the week-strip splitter and the W-mark census.
# Two defects in the first cut of section 4, both in the GATE, neither in the artifact:
#   1. splitting on '<div class="wk-day' also split on '<div class="wk-day-lbl">', so no
#      fragment ever held both a day label and a day number and the cell map came back
#      empty. Split on a LOOKAHEAD for the cell opener, which cannot match the child divs.
#   2. counting /wc-mark/ also counted 'wc-mark-w' and the mark inside the day tag, so the
#      census read 4 where the oracle says 1. Count class="wc-mark" inside the strip only.
import io, sys, os
SRC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'gates', 'g195_wildcard.js'))
s = io.open(SRC, encoding='utf-8').read(); orig = s
edits = []

edits.append(('splitter',
r"""function stripCells(html){
  const strip = html.slice(html.indexOf('<div class="wk-strip">'), html.indexOf('<div class="wk-hero'));
  const parts = strip.split('<div class="wk-day');
  const cells = {};
  parts.forEach(p => {
    const m = p.match(/<div class="wk-day-lbl">([A-Z]{3})<\/div>/);
    if (m) cells[m[1].toLowerCase()] = p;
  });
  return cells;
}""",
r"""function stripOf(html){
  const a = html.indexOf('<div class="wk-strip">'), b = html.indexOf('<div class="wk-hero');
  return (a < 0 || b < 0) ? '' : html.slice(a, b);
}
// Split on a LOOKAHEAD for a cell opener. The class is followed by a space or the closing
// quote on a real cell, never by a hyphen, so the child divs (wk-day-lbl, wk-day-num …)
// cannot split the blob.
function stripCells(html){
  const cells = {};
  stripOf(html).split(/(?=<div class="wk-day[ "])/).forEach(p => {
    const m = p.match(/<div class="wk-day-lbl">([A-Z]{3})<\/div>/);
    if (m) cells[m[1].toLowerCase()] = p;
  });
  return cells;
}"""))

edits.append(('census',
r"""  ok('strip: exactly one W mark in the whole week', (h.match(/wc-mark/g) || []).length === 1, String((h.match(/wc-mark/g) || []).length));""",
r"""  ok('strip: exactly one W mark in the whole strip',
     (stripOf(h).match(/class="wc-mark"/g) || []).length === 1,
     String((stripOf(h).match(/class="wc-mark"/g) || []).length));"""))

fail = False
for tag, old, new in edits:
    n = s.count(old)
    print('anchor %-10s count=%d' % (tag, n))
    if n != 1:
        print('ABORT: anchor %s count=%d' % (tag, n)); fail = True; break
    s = s.replace(old, new, 1)
if fail or s == orig:
    print('NO WRITE'); sys.exit(1)
io.open(SRC, 'w', encoding='utf-8').write(s)
print('WROTE %s' % SRC)
