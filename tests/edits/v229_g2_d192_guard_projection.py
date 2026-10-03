#!/usr/bin/env python3
# V229 gate slice G2 (class (C) of the V229 pre-scan): g228_d192_undokey's GUARD row and D191 INFO line compare U' chains
# on the projection. Ruling: tests/measure/v229_rulings/d194_injlens_ruling.md, D194 Amendment 2 R8 ("For GUARD and the
# D191 INFO line only, boot == live after undo is judged on each section's label and each item's `{name, detail, base}`
# where base is the dose beneath the hold, `_stripCapCue(_preHold ?? detail)`, computed by a hand stripper ...";
# "d2-BOOT-U on U keeps the whole-day JSON"; "No era key"), its "Gate claims" (the GUARD row text, the figures it must
# fail at, the INFO D191 line) and the session note after it (the whole-JSON comparator is INFO; the projection is the
# asserted comparator).
# Reference: measure's M11 copy (tests/measure/v229_rulings/measure_guard_projection_m11.md; scratch
# .../measure3/m11/g228_d192_undokey_proj.js, sha 60e062d90265). E1 to E3 below are that copy's three content hunks,
# byte for byte, each with its three lines of shared context; measure's E0 (re-pointing __dirname so the copy runs from
# scratch) is NOT carried. E4 (this script's own) re-states the header's INFO and GUARD paragraphs so the file names
# D194 Amendment 2 as the ruling that defines GUARD's comparator (standing ruling 4).
# All or none: the gate's sha256 must equal the shipped file and index.html the V229 candidate; every anchor count==1.
import sys, re, hashlib, subprocess

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
GATE = ROOT + '/tests/gates/g228_d192_undokey.js'
GATE_SHA256 = 'be66cffe0fe6ad71267cc68bb72e1da9e1c213dc2dcaf3bb8f2bcc446b2b3500'
CAND_SHA256 = 'd854af0a91f88a5d67c60dd458289bc0fff90c835c2f719775707f8548c56a71'

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

gb = open(GATE, 'rb').read()
if hashlib.sha256(gb).hexdigest() != GATE_SHA256: die('gate is not the shipped file (sha256 %s)' % hashlib.sha256(gb).hexdigest())
ib = open(ROOT + '/index.html', 'rb').read()
if hashlib.sha256(ib).hexdigest() != CAND_SHA256: die('index.html is not the V229 candidate (sha256 %s)' % hashlib.sha256(ib).hexdigest())
src = gb.decode('utf-8')
for nm in ['_stripHand', 'PROJ', 'PHN', 'projEq', 'createdW', 'shadowPH']:
    if re.search(r'\b' + nm + r'\b', src): die('name already in the gate: ' + nm)

EDITS = [
    ('E4 header: INFO/GUARD comparator names D194 Amendment 2', r"""//   INFO       D191 P-SWAPREVISIT, U' only: |U'|, boot != live after undo on candidate and V227, created, healed, every
//              created chain by name with its repeated `from`. Never asserted, never licensed; no pair row on U' boot
//              (ruling §3: it would read created 2 and need the licence just refused).
//   GUARD      the §5 refutation, FAIL-only (it adds no PASS): created above 2 on HOP5 (measure's seed), any created
""",
     r"""//   INFO       D191 P-SWAPREVISIT, U' only: |U'|, boot != live after undo on candidate and V227, created, healed, every
//              created chain by name with its repeated `from`. Never asserted, never licensed; no pair row on U' boot
//              (ruling §3: it would read created 2 and need the licence just refused). V229: the comparator is the
//              projection D194 Amendment 2 R8 defines (tests/measure/v229_rulings/d194_injlens_ruling.md): each
//              section's label and each item's {name, detail, base}, base = the dose beneath the hold,
//              _stripCapCue(_preHold ?? detail), by a hand stripper typed in this file (the cue shape and the held-test
//              shape -> TEST_RX_TEXT), never asked of the tree. The whole-JSON counts and the D191 kept-dose shadow
//              (boot carries no `_preHold` where live does, projection equal) print beside it. No era key (R8).
//   GUARD      the §5 refutation, FAIL-only (it adds no PASS), judged on that projection (D194 Amendment 2 R8 is the
//              ruling that defines GUARD's comparator; d2-BOOT-U and every other row keep the whole-day JSON):
//              created above 2 on HOP5 (measure's seed), any created
"""),
    ('E1 GUARD text, hand stripper, PROJ, PHN (shipped :137)', r"""  BOOTU: "row d2-BOOT-U D192 on U (hand: hop `from` names pairwise distinct): after undo a fresh-VM boot of the day equals the live day; residue 0, |U| > 0, PIN in U boots equal to live",
  MANNY: 'row d2-MANNY D192 HALF_MANNY digest == era table == 0ac7da6b1691a8e1 == V227, self-stable; swapOriginOf reached 0 times by buildProgram and refreshProgram (counter wired)',
};
const GUARD = 'GUARD D192 refutation (ruling §5): created above 2 on the hop5 seed, created on the walk or hop4, or a created chain with no repeated `from`';

// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
""",
     r"""  BOOTU: "row d2-BOOT-U D192 on U (hand: hop `from` names pairwise distinct): after undo a fresh-VM boot of the day equals the live day; residue 0, |U| > 0, PIN in U boots equal to live",
  MANNY: 'row d2-MANNY D192 HALF_MANNY digest == era table == 0ac7da6b1691a8e1 == V227, self-stable; swapOriginOf reached 0 times by buildProgram and refreshProgram (counter wired)',
};
const GUARD = 'GUARD D192 refutation (ruling §5, projection per D194 Amendment 2: section label, item name, detail and the dose beneath the hold _stripCapCue(_preHold ?? detail) by hand shape): created above 2 on the hop5 seed, created on the walk or hop4, or a created chain with no repeated from';
// D194 Amendment 2 (R8): the projection the athlete and the next tap read. Hand stripper, typed from D193 R4's cue shape and
// Amendment 3 section 2's held-test shape (-> the TEST_RX_TEXT literal, typed here); the tree is never asked.
const _CUE_HAND = / — hold RPE 7, (?:two|three) in the tank$/;
const _TEST_RX_HAND = 'Work up to one heavy set of 3 to 5 reps at RPE 9. Technique stays crisp. No grinding. Log the weight and the reps. That set is your new baseline.';
const _HELD_TEST_HAND = /^Work up to one working set of 3 to 5 reps at RPE \d+(?:\.\d+)?\. Technique stays crisp\. No grinding\. Log the weight and the reps\. Your injury plan holds this lift, so there is no new baseline here\.$/;
const _stripHand = d => { const s = String(d == null ? '' : d); return _HELD_TEST_HAND.test(s) ? _TEST_RX_HAND : s.replace(_CUE_HAND, ''); };
const PROJ = j => JSON.stringify((JSON.parse(j) || []).map(s => ({ label:(s && s.label) || null, items:((s && s.items) || []).map(it => ({ name:it && it.name, detail:it && it.detail, base:_stripHand(it && (it._preHold ?? it.detail)) })) })));
const PHN = j => (j.match(/"_preHold"/g) || []).length;


// ── FIXTURES ─────────────────────────────────────────────────────────────────────────────────────────────────────
const START = '2026-08-24', CLOCK = '2026-09-24';
"""),
    ('E2 act() returns projEq, phLive, phBoot (shipped :231)', r"""      for(let ii = 0; ii < Math.max(li.length, bi.length) && !diff; ii++) if(JSON.stringify(li[ii]) !== JSON.stringify(bi[ii])){ const a = li[ii] || {}, b = bi[ii] || {};
        diff = '[' + si + '][' + ii + '] live ' + clean(a.name) + ' | ' + (a.detail || '') + ' ; boot ' + clean(b.name) + ' | ' + (b.detail || ''); } }
    if(!diff) diff = 'a section field'; }
  return { un:0, chip, undoEq:!!chip && afterJ === prevJ, recBefore, recAfter, slotAfter, bootSlot, bootEq:bootJ === afterJ, diff };
}

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
""",
     r"""      for(let ii = 0; ii < Math.max(li.length, bi.length) && !diff; ii++) if(JSON.stringify(li[ii]) !== JSON.stringify(bi[ii])){ const a = li[ii] || {}, b = bi[ii] || {};
        diff = '[' + si + '][' + ii + '] live ' + clean(a.name) + ' | ' + (a.detail || '') + ' ; boot ' + clean(b.name) + ' | ' + (b.detail || ''); } }
    if(!diff) diff = 'a section field'; }
  return { un:0, chip, undoEq:!!chip && afterJ === prevJ, recBefore, recAfter, slotAfter, bootSlot, bootEq:bootJ === afterJ, diff,
    projEq:PROJ(bootJ) === PROJ(afterJ), phLive:PHN(afterJ), phBoot:PHN(bootJ) };   // D194 Amendment 2 (R8)
}

// ── LOAD + VERSION PREDICATE ───────────────────────────────────────────────────────────────────────────────────────
"""),
    ('E3 INFO D191 / GUARD on the projection (shipped :400)', r"""{
  if(B) for(const c of UP) c.rb = act('B', c);
  const both = UP.filter(c => c.rb && !c.rb.un);
  const created = both.filter(c => c.rb.bootEq && !c.r.bootEq), healed = both.filter(c => !c.rb.bootEq && c.r.bootEq);
  const P = ['walk', 'hop4', 'hop5', 'pin'];
  const line = P.map(p => { const g = UP.filter(c => c.pop === p), gb = both.filter(c => c.pop === p); return p + " |U'| " + g.length + ' boot != live candidate ' + g.filter(c => !c.r.bootEq).length
    + ' / V227 ' + (B ? gb.filter(c => !c.rb.bootEq).length + ' (on both ' + gb.length + ')' : 'n/a') + ', created ' + created.filter(c => c.pop === p).length + ', healed ' + healed.filter(c => c.pop === p).length; }).join(' | ');
  console.log("  INFO D191 P-SWAPREVISIT (never asserted, never licensed; no pair row on U' boot, ruling §3): " + line + ' | ' + sec());
  console.log("       U' boot != live on the candidate by group: " + byGrp(UP, c => !c.r.bootEq));
  created.forEach(c => console.log('       created ' + tag(c) + ' | repeated from ' + JSON.stringify(repFrom(c)) + ' | store before undo ' + JSON.stringify(c.r.recBefore)
    + ' after ' + JSON.stringify(c.r.recAfter) + ' | ' + c.r.diff));
  const c5 = created.filter(c => c.pop === 'hop5').length, cw = created.filter(c => c.pop !== 'hop5').length, noRep = created.filter(c => repFrom(c).length === 0).length;
  if(!B) ok(GUARD + ' (setup: no V227 tree: ' + baseWhy + ')', false);
  else if(c5 > 2 || cw > 0 || noRep > 0) ok(GUARD, false, 'hop5 created ' + c5 + ', walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ': stop and re-measure');
  else console.log('  INFO GUARD clear (ruling §5 refutation, FAIL-only): hop5 created ' + c5 + ' <= 2, walk+hop4 created ' + cw + ', every created chain has a repeated `from`');
}
// ── d2-MANNY ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
""",
     r"""{
  if(B) for(const c of UP) c.rb = act('B', c);
  const both = UP.filter(c => c.rb && !c.rb.un);
  // D194 Amendment 2 (R8): GUARD and this INFO line compare U' on the projection; the whole-JSON counts print beside it.
  const created = both.filter(c => c.rb.projEq && !c.r.projEq), healed = both.filter(c => !c.rb.projEq && c.r.projEq);
  const createdW = both.filter(c => c.rb.bootEq && !c.r.bootEq), healedW = both.filter(c => !c.rb.bootEq && c.r.bootEq);
  const shadow = createdW.filter(c => created.indexOf(c) < 0), shadowPH = shadow.filter(c => c.r.phLive > c.r.phBoot);
  const P = ['walk', 'hop4', 'hop5', 'pin'];
  const line = P.map(p => { const g = UP.filter(c => c.pop === p), gb = both.filter(c => c.pop === p); return p + " |U'| " + g.length
    + ' boot != live whole JSON candidate ' + g.filter(c => !c.r.bootEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.bootEq).length : 'n/a')
    + ', projection candidate ' + g.filter(c => !c.r.projEq).length + ' / V227 ' + (B ? gb.filter(c => !c.rb.projEq).length : 'n/a') + ' (on both ' + gb.length + ')'
    + ', created projection ' + created.filter(c => c.pop === p).length + ' (whole JSON ' + createdW.filter(c => c.pop === p).length + ')'
    + ', healed projection ' + healed.filter(c => c.pop === p).length + ' (whole JSON ' + healedW.filter(c => c.pop === p).length + ')'; }).join(' | ');
  console.log("  INFO D191 P-SWAPREVISIT (never asserted, never licensed; no pair row on U' boot, ruling §3; projection per D194 Amendment 2): " + line + ' | ' + sec());
  console.log("       U' boot != live on the candidate by group, projection: " + byGrp(UP, c => !c.r.projEq) + "\n       whole JSON: " + byGrp(UP, c => !c.r.bootEq));
  console.log('  INFO D191 kept-dose shadow (boot carries no `_preHold` where live does, projection equal): ' + shadow.length + ' of ' + createdW.length + ' created on whole JSON (' + P.map(p => p + ' ' + shadow.filter(c => c.pop === p).length).join(', ') + '); live carries more _preHold keys than boot on ' + shadowPH.length + ' of ' + shadow.length);
  created.forEach(c => console.log('       created ' + tag(c) + ' | repeated from ' + JSON.stringify(repFrom(c)) + ' | store before undo ' + JSON.stringify(c.r.recBefore)
    + ' after ' + JSON.stringify(c.r.recAfter) + ' | ' + c.r.diff));
  const c5 = created.filter(c => c.pop === 'hop5').length, cw = created.filter(c => c.pop !== 'hop5').length, noRep = created.filter(c => repFrom(c).length === 0).length;
  if(!B) ok(GUARD + ' (setup: no V227 tree: ' + baseWhy + ')', false);
  else if(c5 > 2 || cw > 0 || noRep > 0) ok(GUARD, false, 'hop5 created ' + c5 + ', walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ': stop and re-measure');
  else console.log('  INFO GUARD clear on the projection (ruling §5 refutation, FAIL-only, D194 Amendment 2): hop5 created ' + c5 + ' <= 2, walk+hop4 created ' + cw + ', created with no repeated from ' + noRep + ' | whole JSON beside it: hop5 ' + createdW.filter(c => c.pop === 'hop5').length + ', walk+hop4 ' + createdW.filter(c => c.pop !== 'hop5').length);
}
// ── d2-MANNY ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
"""),
]

for nm, old, new in EDITS:
    c = src.count(old)
    print('%s anchor count %d' % (nm, c))
    if c != 1: die('%s anchor count %d != 1' % (nm, c))
out = src
for nm, old, new in EDITS:
    out = out.replace(old, new, 1)
if re.search(r'\\u[0-9a-fA-F]{4}', ''.join(n for _, _, n in EDITS)): die('a \\u escape in replacement text')
checks = [
    ('GUARD constant names D194 Amendment 2', out.count("const GUARD = 'GUARD D192 refutation (ruling §5, projection per D194 Amendment 2:"), 1),
    ('hand stripper defined once', out.count('const _stripHand = '), 1),
    ('act() returns projEq beside bootEq', out.count('projEq:PROJ(bootJ) === PROJ(afterJ)'), 1),
    ('created on the projection', out.count('const created = both.filter(c => c.rb.projEq && !c.r.projEq)'), 1),
    ('d2-BOOT-U still reads bootEq (whole JSON)', 1 if 'bootEq:bootJ === afterJ' in out else 0, 1),
    ('__dirname harness require kept (E0 not carried)', out.count("require(path.join(__dirname, '..', 'harness.js'))"), 1),
    ('header names D194 Amendment 2 for GUARD', out.count("ruling that defines GUARD's comparator"), 1),
]
for nm, got, want in checks:
    print('post %s: %d' % (nm, got))
    if got != want: die('post-check %s: %d != %d' % (nm, got, want))
open(GATE, 'w', encoding='utf-8').write(out)
r = subprocess.run(['node', '--check', GATE], capture_output=True, text=True)
if r.returncode: die('node --check failed: ' + r.stderr)
print('OK: 4 edits written to %s (node --check ok)' % GATE)
