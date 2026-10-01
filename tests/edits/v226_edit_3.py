#!/usr/bin/env python3
# V226 slice 3 of 7: D188 P-BEGINNERMILE wizard and pencil (E8, E9, E10) + D189 P-PACEDISCLOSE header (F5).
# Ruling: tests/measure/v226_rulings/d188_d189_ruling.md (Mario "all yes", 2026-09-30).
# ia-version is NOT bumped in this slice (stays 225; slice 6 bumps it to 226).
# Every anchor asserted count==1 before anything is written; all four edits or none.
# E8 and E10 remove a ternary and keep its body: no dead `${true ? ...}` is shipped.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

def die(msg):
    sys.exit('ABORT: ' + msg)

with open(PATH, 'r', encoding='utf-8', newline='') as f:
    src = f.read()

EDITS = [
    # ── E8 :2855 wizard, run_pace_goal branch: the mile block renders at every level ──
    ('E8 open :2855',
     "            ${WD.experience !== 'beginner' ? `<div class=\"input-group\" style=\"margin-top:8px\">\n",
     "            <div class=\"input-group\" style=\"margin-top:8px\">\n"),
    # Site 1's closing: the inner template's backtick, the ternary's `: ''}`, then the outer
    # ternary's `: `` stays. Site 2's closing (`</div>` : ''}`}`) is a different string, untouched.
    ('E8 close :2867',
     "</div>` : ''}` : `",
     "</div>` : `"),
    # ── E9 :2876 wizard, every other run goal: the mile block renders at every level ──
    ('E9 :2876',
     "(t==='run' && WD.experience !== 'beginner')",
     "(t==='run')"),
    # ── E10 :14823 program card pencil: unconditional (kind 'beginner' is never produced since E7) ──
    ('E10 :14823',
     "Run paces${s.runAnchor.kind!=='beginner'?`<button onclick=\"event.stopPropagation();openMileSheet('${p.id}')\" aria-label=\"Change mile time\" style=\"background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center\">${asyIcon('pencil',14)}</button>`:''}</div>",
     "Run paces<button onclick=\"event.stopPropagation();openMileSheet('${p.id}')\" aria-label=\"Change mile time\" style=\"background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center\">${asyIcon('pencil',14)}</button></div>"),
    # ── F5 :1997 progLenLineHTML: a required mile left blank has no length yet ──
    ('F5 :1997',
     "  const n = (p && p.tw) || len;\n",
     "  // D189 (P-PACEDISCLOSE F5): a required mile left blank has no length to print yet. A dated test pin\n"
     "  // still prints its test week: that length is true without a mile.\n"
     "  const _ms=(typeof _mileEntryState==='function')?_mileEntryState():{ok:true}; if(!(p && p.tw) && _ms.blank) return '<b style=\"color:var(--accent)\">Program length: your mile time sets it.</b> Enter your current mile time and the length appears.';\n"
     "  const n = (p && p.tw) || len;\n"),
]

# Pass 1: every anchor count==1 in the untouched source.
for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        die('%s anchor count %d (want 1)' % (name, c))
# Site 2's closing must survive untouched.
SITE2 = "</div>` : ''}`}"
if src.count(SITE2) != 1:
    die('E8 site-2 closing count %d (want 1)' % src.count(SITE2))

# Pass 2: apply in order, re-asserting count==1 on the evolving text.
out = src
for name, old, new in EDITS:
    c = out.count(old)
    if c != 1:
        die('%s anchor count %d at apply time' % (name, c))
    out = out.replace(old, new, 1)

# Post-conditions.
if out.count(SITE2) != 1:
    die('E8 site-2 closing disturbed')
for gone in ("WD.experience !== 'beginner'", "runAnchor.kind!=='beginner'"):
    if gone in out:
        die('token still present after edit: ' + gone)
for dead in ("${true ?", "${true?"):
    if out.count(dead) != src.count(dead):
        die('a dead ternary was introduced: ' + dead)

with open(PATH, 'w', encoding='utf-8', newline='') as f:
    f.write(out)
print('OK: E8 (open+close), E9, E10, F5 written; site-2 closing untouched; ia-version untouched')
