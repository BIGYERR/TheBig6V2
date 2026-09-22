#!/usr/bin/env python3
# V202 slice 5 follow-on: P5f printed two counts as literals ("0 carrying ... 0 carrying ...").
# A literal that reads as a computed count is the exact defect this repo punishes; on the
# pre-slice-5 artifact the row printed "0 carrying the generic Zone 5 text" while every one
# of its misses WAS the Zone 5 text. Counted for real.
import io, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GATE = os.path.join(ROOT, 'tests', 'gates', 'g202_pace_anchor.js')
src = io.open(GATE, encoding='utf-8').read()
EDITS = []
def sub(n,o,w): EDITS.append((n,o,w))

sub('P5f counts the two wrong texts for real',
"""let e12seen = 0, e12bad = [];
for(const r of p5cls){
  for(const s of runSessions(r.prog)){
    if(!/Interval/i.test(s.st)) continue;
    if(s.note === E12){ e12seen++; continue; }
    // A cutback week owns its own note by an older ruling and is not E12's business.
    if(/^CUTBACK WEEK:/.test(s.note)) continue;
    if(e12bad.length < 3) e12bad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} W${s.w} reads |${s.note.slice(0, 80)}|`);
  }
}
ok(e12bad.length === 0 && e12seen > 0, `P5f E12 — every non-cutback interval week in this class carries `
  + `coach's ruled sentence verbatim and nothing else: ${e12seen} interval weeks across ${p5cls.length} `
  + `builds (0 carrying the dampened branch's "needs more weeks" text, which is false for an athlete `
  + `whose goal is already met, and 0 carrying the generic Zone 5 text this class used to get)`
""",
"""let e12seen = 0, e12bad = [], e12tot = 0, e12damp = 0, e12gen = 0;
for(const r of p5cls){
  for(const s of runSessions(r.prog)){
    if(!/Interval/i.test(s.st)) continue;
    // A cutback week owns its own note by an older ruling and is not E12's business.
    if(/^CUTBACK WEEK:/.test(s.note)) continue;
    e12tot++;
    if(/needs more weeks than this block has/.test(s.note)) e12damp++;
    if(/Zone 5 \\(95%\\+ max HR\\)/.test(s.note)) e12gen++;
    if(s.note === E12){ e12seen++; continue; }
    if(e12bad.length < 3) e12bad.push(`${r.exp}/${r.age}/${r.unit} mile ${r.mb.join(':')} W${s.w} reads |${s.note.slice(0, 80)}|`);
  }
}
ok(e12bad.length === 0 && e12seen > 0, `P5f E12 — every non-cutback interval week in this class carries `
  + `coach's ruled sentence verbatim and nothing else: ${e12seen} of ${e12tot} interval weeks across `
  + `${p5cls.length} builds, ${e12damp} carrying the dampened branch's "needs more weeks" text (false `
  + `for an athlete whose goal is already met) and ${e12gen} carrying the generic Zone 5 text this `
  + `class used to get`
""")

fail=False
for n,o,w in EDITS:
    c=src.count(o); print('  anchor %-44s count=%d' % (n,c))
    if c!=1: fail=True; print('    ABORT')
if fail: sys.exit('ABORTED: no bytes written')
for n,o,w in EDITS: src=src.replace(o,w,1)
io.open(GATE,'w',encoding='utf-8').write(src)
print('WROTE %s' % GATE)
