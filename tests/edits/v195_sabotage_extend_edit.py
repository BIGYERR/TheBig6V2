#!/usr/bin/env python3
# V195 second pass: extend tests/sabotage/v195.json with the four mutations gatekeeper
# used to prove the gate was blind (P1-P4), plus two for the D71b skip rescue and its
# control. Every anchor is checked count==1 against the live artifact before writing, so a
# NOT-APPLIED cannot be discovered only at sweep time.
import io, json, os, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
HTML = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests', 'sabotage', 'v195.json')
src = io.open(HTML, encoding='utf-8').read()
muts = json.load(io.open(SPEC, encoding='utf-8'))
G = 'gates/g195_wildcard.js'

NEW = [
 {
  "name": "M11 (gk P1) -> the W never reaches the strip while every identifier survives: the mark branch renders the date number instead, which is exactly what the first cut of the gate could not see",
  "anchor": "else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);",
  "replacement": "else if(wildcardOn(currentWeek,d)) center=(false?wildcardMarkHTML(14):dnum);",
  "gate": G
 },
 {
  "name": "M12 (gk P2) -> the week-view tag is dropped out of the innerHTML concatenation while the _wcTag variable stays declared, so the athlete never sees which session is still waiting",
  "anchor": "list.innerHTML=strip+hero+_wcTag+stats+leg;",
  "replacement": "list.innerHTML=strip+hero+stats+leg;",
  "gate": G
 },
 {
  "name": "M13 (gk P3) -> the day-detail tag is never prepended, so opening the session shows no sign that a Wildcard was done in its place",
  "anchor": "const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(_wcTag) html=_wcTag+html;",
  "replacement": "const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(false) html=_wcTag+html;",
  "gate": G
 },
 {
  "name": "M14 (gk P4) -> the DST guard is removed: Math.round becomes Math.floor, so after a spring-forward every remaining day of the block stamps one day early",
  "anchor": "const diff=Math.round((d.getTime()-mon.getTime())/86400000);",
  "replacement": "const diff=Math.floor((d.getTime()-mon.getTime())/86400000);",
  "gate": G
 },
 {
  "name": "M15 -> D71b reverted: the skip break moves back ahead of the Wildcard clause, so a day marked skipped that also carries a Wildcard sets the streak to 0 again",
  "anchor": "    if(wildcardOn(days[i].week,days[i].d)){ n++; continue; }                       // V195 (D71b): a Wildcard rescues a skipped day\n    if(st==='skipped') break;",
  "replacement": "    if(st==='skipped') break;\n    if(wildcardOn(days[i].week,days[i].d)){ n++; continue; }",
  "gate": G
 },
 {
  "name": "M16 -> the D71b control is destroyed: the skip stops breaking at all, so a skipped day with no Wildcard reads as transparent and the streak walks straight through an absence",
  "anchor": "    if(st==='skipped') break;                                                      // a skip with no Wildcard still breaks",
  "replacement": "",
  "gate": G
 },
]

have = set(m['name'] for m in muts)
fail = False
for m in NEW:
    n = src.count(m['anchor'])
    print('anchor %-8s count=%d' % (m['name'].split(' ')[0], n))
    if n != 1:
        print('ABORT: anchor for %s count=%d, expected 1' % (m['name'].split(' ')[0], n)); fail = True
    if m['name'] in have:
        print('ABORT: %s already present' % m['name'].split(' ')[0]); fail = True
if fail:
    print('NO WRITE'); sys.exit(1)

muts.extend(NEW)
io.open(SPEC, 'w', encoding='utf-8').write(json.dumps(muts, indent=1, ensure_ascii=False) + '\n')
print('WROTE %s (%d mutations)' % (SPEC, len(muts)))
