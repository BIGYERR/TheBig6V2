#!/usr/bin/env python3
# V231 GATE MAINTENANCE G4' (builder_m4): four row changes in four gate files, keyed to the V231 absorb ruling
# (tests/measure/v231_rulings/v231_absorb_ruling.md, section 3) and the D198 re-ruling's statement on g221
# (tests/measure/v231_rulings/v231_reruling2_d196a2_d198.md: "g221: 839 / 172 / 205 / 1,253 on the candidate and on CF"):
#   g215_d149_ghd           P1 x5   RE-KEY at >= 231: the probe's reads segmented by focus (support_prevention vs other);
#                                   per tier empty == emptyPrev, emptyOther 0, emptyPrev > 0. Below 231 as today.
#   g221_d177_swapfloor     G3a G3c G3e G6a  ABSORB at >= 231: a second pin table D193_PIN_V231 = {G3a 839, G3cPow 0,
#                                   G3cOff 172, G3d 263, G3e 205, G3f 199, G6a 1253}, the 229..230 table kept; conjunct:
#                                   moved pairs whose donor is `Single-leg hip thrust (shoulders on bed)` count G3a 7,
#                                   G3c off grammar 4, G3e 3, G6a toast 10 (V230 0). G3d and G3f read the same era table
#                                   (identical figures; a pin in the table that no row read would be dead).
#   g225_d187_pacerate      CONFINEMENT  SCOPE: asserts at 225 (V224) and 226..230 (D189 Class B); at >= 231 one named
#                                   SKIP line at column 0 naming g231_d195b_cost D195-B-b and g231_d195_hipext D195-A-b.
#   g226_d188_beginnermile  G2 identity, G1h-P2b, G1h-P5  SCOPE to <= 230; at >= 231 one named SKIP line each at column 0
#                                   naming the same successors. G2's V225 self-identity precondition and G1h-P0, P1, A1L,
#                                   P2, P3, P4, L1..L3 assert as before.
# index.html is not touched. g215's HM row (G3c, tests/edits/v231_m3c_manny_pins.py) is left as it stands.
#
#   python3 tests/edits/v231_m4_g215_g221_g225_g226d188.py         figures on both trees from a scratch clone, then edit
#   python3 tests/edits/v231_m4_g215_g221_g225_g226d188.py --dry   figures only; the repo is untouched
#
# Refuses unless index.html and the V230 baseline read the briefed sha256 prefixes, g221 / g225 / g226_d188 are clean
# against HEAD, g215 equals HEAD plus exactly G3c's g215 hunks (re-applied from tests/edits/v231_m3c_manny_pins.py), and
# every anchor occurs exactly once. Then it runs every edited copy in a `git clone --shared` of HEAD under the scratch
# path (tests/harness.js and any other local require copied from the working tree) on the candidate (V230 as argv[3])
# and on V230 as the candidate, plus the current copies on V230 as the reference for "V230 row lines unchanged". A figure
# not as ruled parks its row's file (standing ruling 7): that file is not written; the others are.
import hashlib, os, re, shutil, subprocess, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
SCR = '/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/adf6a3cd-1bcb-472e-a3ec-2078adfbc3be/scratchpad'
BASE = SCR + '/base_v230.html'
M4 = SCR + '/builder_m4'
CAND = os.path.join(ROOT, 'index.html')
SHA = {CAND: '1b403743f8ad1b16', BASE: '72ac41c8d34034ce'}
G215 = 'tests/gates/g215_d149_ghd.js'
G221 = 'tests/gates/g221_d177_swapfloor.js'
G225 = 'tests/gates/g225_d187_pacerate.js'
G226 = 'tests/gates/g226_d188_beginnermile.js'
G3C = 'tests/edits/v231_m3c_manny_pins.py'
RUL = 'tests/measure/v231_rulings/v231_absorb_ruling.md section 3'
SUCC = 'successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b'

def die(msg):
    print('ABORT: ' + msg)
    sys.exit(1)

dry = False
if len(sys.argv) == 2 and sys.argv[1] == '--dry':
    dry = True
elif len(sys.argv) != 1:
    die('usage: v231_m4_g215_g221_g225_g226d188.py [--dry]')

for f, want in SHA.items():
    got = hashlib.sha256(open(f, 'rb').read()).hexdigest()[:16]
    if got != want:
        die('%s sha256 %s, want %s' % (f, got, want))
    print('sha ok %s %s' % (want, f))
for rel in (G221, G225, G226):
    if subprocess.run(['git', '-C', ROOT, 'diff', '--quiet', 'HEAD', '--', rel]).returncode != 0:
        die(rel + ' is not clean against HEAD')
    print('clean vs HEAD ' + rel)
# g215: HEAD + G3c's g215 hunks, byte for byte
g3c = open(os.path.join(ROOT, G3C), encoding='utf-8').read()
a, b = g3c.find('def note(ruling):'), g3c.find('# Phase 1:')
if a < 0 or b < 0:
    die(G3C + ' does not carry its note/era_check/EDITS block')
ns = {}
exec(g3c[a:b], ns)
if G215 not in ns['EDITS']:
    die(G3C + ' carries no g215 hunks')
head215 = subprocess.run(['git', '-C', ROOT, 'show', 'HEAD:' + G215], capture_output=True, check=True).stdout.decode('utf-8')
for old, new in ns['EDITS'][G215]:
    if head215.count(old) != 1:
        die('G3c hunk does not apply to HEAD:%s: %r' % (G215, old[:80]))
    head215 = head215.replace(old, new)
if open(os.path.join(ROOT, G215), encoding='utf-8').read() != head215:
    die(G215 + ' is not HEAD plus exactly G3c\'s g215 hunks')
print('clean vs HEAD + G3c (%d hunks) %s' % (len(ns['EDITS'][G215]), G215))

SRC = {rel: open(os.path.join(ROOT, rel), encoding='utf-8').read() for rel in (G215, G221, G225, G226)}

def one_line(rel, prefix):
    hits = [l for l in SRC[rel].split('\n') if l.startswith(prefix)]
    if len(hits) != 1:
        die('%s: %d lines start with %r (want 1)' % (rel, len(hits), prefix))
    return hits[0]

def sub1(s, old, new, what):
    if s.count(old) != 1:
        die('%s: sub-anchor %r count %d (want 1)' % (what, old, s.count(old)))
    return s.replace(old, new)

EDITS = {G215: [], G221: [], G225: [], G226: []}

# ══ g215 (1/4): row text for P1 ═══════════════════════════════════════════════════════════════════════════════════
EDITS[G215].append(('P1 row text', r'''//   P1   knee/protect: the hip-extension reservation is never empty on any tier (probe). The slot's
//        collision drop rate is printed per tier, never asserted: coach ruled it acceptable.
''', r'''//   P1   knee/protect: the hip-extension reservation is never empty on any tier (probe). The slot's
//        collision drop rate is printed per tier, never asserted: coach ruled it acceptable.
//        231 and up: re-keyed by focus (VERSION PREDICATE below).
'''))

# ══ g215 (2/4): VERSION PREDICATE, the 231 era ═══════════════════════════════════════════════════════════════════
EDITS[G215].append(('header 231 era', r'''//   baseline 214 and SKIP by name on every other pair. Every other row is ruling-level from 215 up.
''', r'''//   baseline 214 and SKIP by name on every other pair. Every other row is ruling-level from 215 up.
//   231 and up: P1 RE-KEYED (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g215:272 P1; standing
//   rulings 2 and 4). D195 A2r reads the reservation on support_prevention leg days too, and there it empties: those
//   days carry no Leg superset B, so the empty read builds nothing (ex.hipExt null, A2r's concat is empty). The probe's
//   reads are segmented by focus (support_prevention vs every other focus) and the row asserts, per tier, that every
//   empty read is a support_prevention read and at least one is: empty == emptyPrev, emptyOther 0, emptyPrev > 0
//   (the ruling prints 898 empty of 6,301 reads per tier on the candidate, V230 emptyPrev 0). Successors for the card
//   consequence: g231_d195_hipext D195-A-b (knee/protect circuit length == V230's) and D195-A-e. Below 231 P1
//   asserts as before (never empty).
'''))

# ══ g215 (3/4): the probe's bump, segmented by focus (counted on every tree) ═════════════════════════════════════
EDITS[G215].append(('probe bump by focus', r'''    PROBE.IA.ctx.__G215.forEach(([len, drew]) => { bump(K.pr, t + '|calls'); if(!len) bump(K.pr, t + '|empty'); else if(!drew) bump(K.pr, t + '|dropped'); }); }
''', r'''    // V231 P1 (absorb ruling section 3): every read is also counted under its focus, support_prevention ('prev') or any other ('other').
    const pfoc = x.cfg.liftingFocus === 'support_prevention' ? 'prev' : 'other';
    PROBE.IA.ctx.__G215.forEach(([len, drew]) => { bump(K.pr, t + '|calls'); bump(K.pr, t + '|calls|' + pfoc); if(!len){ bump(K.pr, t + '|empty'); bump(K.pr, t + '|empty|' + pfoc); } else if(!drew) bump(K.pr, t + '|dropped'); }); }
'''))

# ══ g215 (4/4): row P1 ═════════════════════════════════════════════════════════════════════════════════════════════
EDITS[G215].append(('row P1', r'''TIERS.forEach(t => { const calls = g(K.pr, t + '|calls'), e = g(K.pr, t + '|empty'), dr = g(K.pr, t + '|dropped');
  console.log('   P1 ' + t + ': reservation reads ' + calls + ', empty ' + e + ', collision drops ' + dr + ' (' + (calls - e ? (100 * dr / (calls - e)).toFixed(1) : '0.0') + '% of non-empty reads); Leg superset B two-item ' + g(K.lsb, t + '|2') + ' of ' + (g(K.lsb, t + '|1') + g(K.lsb, t + '|2')) + '; hip-ext items ' + g(K.hx, t));
  ok('P1 ' + t + ' knee/protect: the hip-extension reservation is never empty', PROBE.c === 1 && K.probeBad === 0 && calls > 0 && e === 0,
    PROBE.c !== 1 ? 'probe anchor count ' + PROBE.c : e + ' empty of ' + calls + ' reads, probe copy digest mismatches ' + K.probeBad); });
''', r'''// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g215:272 P1 RE-KEY; standing rulings 2 and 4): at
// 231 and up every empty read must be a support_prevention read, at least one must be, and no other focus reads empty.
// Below 231 the row is unchanged. The focus split is printed on every tree (V230 reads emptyPrev 0, so the 231 row fails there).
const V231_ERA = 231;
TIERS.forEach(t => { const calls = g(K.pr, t + '|calls'), e = g(K.pr, t + '|empty'), dr = g(K.pr, t + '|dropped');
  const cP = g(K.pr, t + '|calls|prev'), cO = g(K.pr, t + '|calls|other'), eP = g(K.pr, t + '|empty|prev'), eO = g(K.pr, t + '|empty|other');
  console.log('   P1 ' + t + ': reservation reads ' + calls + ', empty ' + e + ', collision drops ' + dr + ' (' + (calls - e ? (100 * dr / (calls - e)).toFixed(1) : '0.0') + '% of non-empty reads); Leg superset B two-item ' + g(K.lsb, t + '|2') + ' of ' + (g(K.lsb, t + '|1') + g(K.lsb, t + '|2')) + '; hip-ext items ' + g(K.hx, t));
  console.log('   P1 ' + t + ' by focus: support_prevention reads ' + cP + ', empty ' + eP + ' | other foci reads ' + cO + ', empty ' + eO);
  if(VER >= V231_ERA) ok('P1 ' + t + ' knee/protect [V231 D195 A2r: every empty hip-extension read is a support_prevention read, at least one is; no other focus reads empty]',
    PROBE.c === 1 && K.probeBad === 0 && calls > 0 && e === eP && eO === 0 && eP > 0,
    PROBE.c !== 1 ? 'probe anchor count ' + PROBE.c : e + ' empty of ' + calls + ' reads (support_prevention ' + eP + ' of ' + cP + ', other foci ' + eO + ' of ' + cO + '), probe copy digest mismatches ' + K.probeBad);
  else ok('P1 ' + t + ' knee/protect: the hip-extension reservation is never empty', PROBE.c === 1 && K.probeBad === 0 && calls > 0 && e === 0,
    PROBE.c !== 1 ? 'probe anchor count ' + PROBE.c : e + ' empty of ' + calls + ' reads, probe copy digest mismatches ' + K.probeBad); });
'''))

# ══ g221 (1/n): VERSION PREDICATE, the 231 era ═══════════════════════════════════════════════════════════════════
EDITS[G221].append(('header 231 era', r'''//                  app equivalence is D194 part 2's row. Below 229 these rows assert exactly as before.
''', r'''//                  app equivalence is D194 part 2's row. Below 229 these rows assert exactly as before.
//   231 and up     (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, class D196-1 at the swap sheet; standing
//                  rulings 2 and 4) the same six rows read a second pin table, D193_PIN_V231: G3a 839, G3c power 0 / off
//                  grammar 172, G3d 263, G3e 205, G3f 199, G6a 1,253 (229 and 230 keep the table above). G3a, G3c, G3e
//                  and G6a carry one more conjunct: the moved pairs whose donor is `Single-leg hip thrust (shoulders on
//                  bed)` (the D196-1 bodyweight lowback/workaround card that was `Burpees` on V230) count G3a 7, G3c off
//                  grammar 4, G3e 3, G6a toast 10 (typed pins, the ruling's print; the D198 re-ruling states the four
//                  figures unchanged by D198; V230 has 0 such donors, so each re-keyed row fails there). Below 231 the
//                  rows assert as before.
'''))

# ══ g221 (2/n): the second pin table and the bed-thrust donor pins ═══════════════════════════════════════════════
EDITS[G221].append(('D193_PIN_V231', r'''const D193_PIN = { G3a:832, G3cPow:0, G3cOff:168, G3d:263, G3e:202, G3f:199, G6a:1243 };   // G6a: D194 Amendment 3 (replaces Amendment 1 (r)'s 1,252), D193 Amendment 4 (k)
''', r'''const D193_PIN = { G3a:832, G3cPow:0, G3cOff:168, G3d:263, G3e:202, G3f:199, G6a:1243 };   // G6a: D194 Amendment 3 (replaces Amendment 1 (r)'s 1,252), D193 Amendment 4 (k)
// V231 (absorb ruling section 3, g221 ABSORB, class D196-1): the second pin table for ia-version 231 and up, and the moved
// pairs it adds, all on one donor name, typed from the ruling's print (never this run).
const D193_V231_ERA = 231;
const D193_PIN_V231 = { G3a:839, G3cPow:0, G3cOff:172, G3d:263, G3e:205, G3f:199, G6a:1253 };
const BED_DONOR = 'Single-leg hip thrust (shoulders on bed)', BED_PIN_V231 = { out:7, off:4, nul:3, t:10 };
'''))

# ══ g221 (3/n): the bed-thrust donor counters (counted on every tree) ════════════════════════════════════════════
EDITS[G221].append(('BED9 counters', r'''const S9 = { capPairs:0, bA:0, bOff:0, bAt:0, bNull:0, bWin:0, mvT:0, bT:0, missT:0, clampT:0, ex:{} };
''', r'''const S9 = { capPairs:0, bA:0, bOff:0, bAt:0, bNull:0, bWin:0, mvT:0, bT:0, missT:0, clampT:0, ex:{} };
const BED9 = { out:0, off:0, nul:0, t:0 };   // V231: moved pairs whose donor is BED_DONOR (G3a, G3c off grammar, G3e, G6a toast), every tree
'''))

# ══ g221 (4/n..7/n): bump BED9 beside each moved counter the four rows pin ═══════════════════════════════════════
EDITS[G221].append(('BED9 toast', r'''            if(toast !== wantT9){ S9.mvT++; if(''', r'''            if(toast !== wantT9){ S9.mvT++; if(clean(from) === BED_DONOR) BED9.t++; if('''))
EDITS[G221].append(('BED9 out', r'''{ S.outside++; note('out', ''', r'''{ S.outside++; if(clean(from) === BED_DONOR) BED9.out++; note('out', '''))
EDITS[G221].append(('BED9 off', r'''{ S.offChg++; note('off', ''', r'''{ S.offChg++; if(clean(from) === BED_DONOR) BED9.off++; note('off', '''))
EDITS[G221].append(('BED9 null', r'''{ S.nullBad++; note('null', ''', r'''{ S.nullBad++; if(clean(from) === BED_DONOR) BED9.nul++; note('null', '''))

# ══ g221 (8/n): the era table and the donor print ════════════════════════════════════════════════════════════════
EDITS[G221].append(('D9 era table', r'''const D9 = VER >= D193_ERA;
if(D9) console.log('  D193 era (V' + VER + '): Main pairs on a hand-capped target ' + S9.capPairs + ', hand clamp pairs (toasts) ' + S9.clampT);
''', r'''// V231 (absorb ruling section 3): at 231 and up the six D9 rows read D193_PIN_V231; 229 and 230 read D193_PIN.
const D9 = VER >= D193_ERA, ERA231 = VER >= D193_V231_ERA, PIN9 = ERA231 ? D193_PIN_V231 : D193_PIN;
if(D9) console.log('  D193 era (V' + VER + '): Main pairs on a hand-capped target ' + S9.capPairs + ', hand clamp pairs (toasts) ' + S9.clampT);
if(D9) console.log('  V231 bed-thrust donor (' + BED_DONOR + ') moved pairs on this tree: G3a ' + BED9.out + ', G3c off grammar ' + BED9.off + ', G3e ' + BED9.nul + ', G6a toast ' + BED9.t + ' | pin table ' + (ERA231 ? 'D193_PIN_V231 (ia-version ' + D193_V231_ERA + ' and up)' : 'D193_PIN (229 and 230)') + ' | swap pairs ' + S.pairs);
'''))

# ══ g221 (9/n..14/n): the six D9 rows read PIN9; G3a G3c G3e G6a gain the donor conjunct ═════════════════════════
def row221(prefix, bed=None, conj=None, gotAt='+ crashNote'):
    old = one_line(G221, prefix)
    if 'D193_PIN.' not in old:
        die(G221 + ' row ' + prefix + ' does not read D193_PIN')
    new = old.replace('D193_PIN.', 'PIN9.')
    if bed:
        k, words = bed
        new = sub1(new, "+ ']', !S.crash.length", "+ ']' + (ERA231 ? ' [V231 D196-1: bed-thrust donor " + words + " ' + BED9." + k + " + ' == ' + BED_PIN_V231." + k + " + ']' : ''), !S.crash.length", prefix + ' label')
        tail = ', ' if conj.endswith(', ') else ' && ' if conj.endswith(' && ') else die(prefix + ' conjunct form')
        new = sub1(new, conj, conj[:-len(tail)] + ' && (!ERA231 || BED9.' + k + ' === BED_PIN_V231.' + k + ')' + tail, prefix + ' conjunct')
        new = sub1(new, gotAt, "+ (ERA231 ? ', bed-thrust donor " + words + " ' + BED9." + k + " + ' (pin ' + BED_PIN_V231." + k + " + ')' : '') " + gotAt, prefix + ' got')
    EDITS[G221].append(('row ' + prefix, old + '\n', new + '\n'))

row221('if(D9) ok(R.G3a + ', ('out', 'moved'), 'S.outside === PIN9.G3a, ')
row221('if(D9) ok(R.G3c + ', ('off', 'off grammar moved'), 'S.offChg === PIN9.G3cOff, ')
row221('if(D9) ok(R.G3d + ')
row221('if(D9) ok(R.G3e + ', ('nul', 'moved'), 'S.nullBad === PIN9.G3e, ')
row221('if(D9) ok(R.G3f + ')
row221('if(D9) ok(R.G6a + ', ('t', 'toast moved'), 'S9.mvT === PIN9.G6a && ', "+ exs9('t') + exs9('miss'));")

# ══ g225 (1/3): VERSION PREDICATE, the 231 era ═══════════════════════════════════════════════════════════════════
EDITS[G225].append(('header 231 era', r'''//   225 and up  every row asserts.
''', r'''//   225 and up  every row asserts.
//   231 and up  CONFINEMENT is SCOPED to its era (tests/measure/v231_rulings/v231_absorb_ruling.md section 3; standing
//               rulings 2 and 4): it asserts at 225 (V224 equality) and at 226 to 230 (D189 Class B). D195 moves the run
//               cells (the ruling prints 4 programs, 38 days moved, ops A-1 38, B-1 6, 0 other), so "nothing moved on a
//               goal this ruling does not touch" belongs to the builds before it. At 231 and up the row prints one
//               named SKIP line at column 0, never PASS and never FAIL, resolves no baseline, and names the successors
//               g231_d195b_cost D195-B-b and g231_d195_hipext D195-A-b. Every other row asserts as before.
'''))

# ══ g225 (2/3): the era constant ═════════════════════════════════════════════════════════════════════════════════
EDITS[G225].append(('V231_ERA', r'''const D189_ERA = 226;
''', r'''const D189_ERA = 226;
// V231 absorb ruling section 3 (g225_d187:272 CONFINEMENT SCOPE): CONFINEMENT asserts below 231 only.
const V231_ERA = 231;
'''))

# ══ g225 (3/3): CONFINEMENT scoped; the existing bare block becomes the else branch ══════════════════════════════
EDITS[G225].append(('CONFINEMENT scope', r'''// ── CONFINEMENT (needs a baseline artifact: candidate vs V224, byte-identical digest per goal) ──
{
  const WANT_BASE = VER >= D189_ERA ? 225 : 224;
''', r'''// ── CONFINEMENT (needs a baseline artifact: candidate vs V224, byte-identical digest per goal) ──
// V231 (tests/measure/v231_rulings/v231_absorb_ruling.md section 3, g225_d187:272 CONFINEMENT SCOPE; standing rulings
// 2 and 4): at 231 and up one named SKIP line at column 0, never PASS and never FAIL; below 231 the block runs as before.
if(VER >= V231_ERA) console.log('SKIP CONFINEMENT D189 era (strip the S1 suffix and every cell equals the baseline V225, swim/bike/run_base/NRC): scoped to ia-version 226 to 230 by the V231 absorb ruling (' + 'tests/measure/v231_rulings/v231_absorb_ruling.md section 3); D195 moves the run cells (the ruling prints 4 programs, 38 days moved, ops A-1 38, B-1 6); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b. Never PASS, never FAIL.');
else {
  const WANT_BASE = VER >= D189_ERA ? 225 : 224;
'''))

# ══ g226 (1/5): VERSION PREDICATE, the 231 era ═══════════════════════════════════════════════════════════════════
EDITS[G226].append(('header 231 era', r'''//   226 and up    every row asserts the D188 after-state.
''', r'''//   226 and up    every row asserts the D188 after-state.
//   231 and up    three rows are SCOPED to 230 and below (tests/measure/v231_rulings/v231_absorb_ruling.md section 3;
//                 standing rulings 2 and 4): G2's identity row (the candidate minus S1 equals the V225 build), G1h-P2b
//                 (11:30 weekGrid identity) and G1h-P5 (unmoved days byte-identical). D195 moves those populations (the
//                 ruling prints G2 120 of 120 cells moved, ops B-1 657; the G1h lattice 384 of 384 cfgs moved, ops A-1
//                 1,806, B-1 3,155, B-2 7, 0 other). At 231 and up each prints one named SKIP line at column 0, never PASS
//                 and never FAIL, naming the successors g231_d195b_cost D195-B-b and g231_d195_hipext D195-A-b. G2's V225
//                 self-identity precondition and G1h-P0, P1, A1L, P2, P3, P4, L1 to L3 assert as before.
'''))

# ══ g226 (2/5): the era constant and the SKIP line ═══════════════════════════════════════════════════════════════
EDITS[G226].append(('V231_ERA + scopeSkip', r'''const V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223';   // "V225: D186/D187 — the pace clock lands on the goal ..."
''', r'''const V225_COMMIT = '35919943d766606dcbf5e09c98a08b5782dc2223';   // "V225: D186/D187 — the pace clock lands on the goal ..."
// V231 absorb ruling section 3 (g226_d188 G2, G1h-P2b, G1h-P5 SCOPE): those rows assert at 230 and below only; at 231 and
// up each prints this line at column 0, counted neither PASS nor FAIL.
const V231_ERA = 231;
const scopeSkip = (row, fig) => console.log('SKIP ' + row + ' (' + fig + ' on this tree): scoped to ia-version 230 and below by the V231 absorb ruling (tests/measure/v231_rulings/v231_absorb_ruling.md section 3); successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b. Never PASS, never FAIL.');
'''))

# ══ g226 (3/5): G2 identity row, both sites ══════════════════════════════════════════════════════════════════════
EDITS[G226].append(('G2 identity, no baseline', r'''    ok('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', false, 'no V225 baseline');
''', r'''    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', 'no V225 baseline');
    else ok('G2 ' + TAG + ' beginner no-mile program minus the S1 suffix equals the V225 build, digest for digest', false, 'no V225 baseline');
'''))
EDITS[G226].append(('G2 identity', r'''    ok('G2 ' + TAG + ' ' + (D188 ? 'beginner no-mile program with exactly \' \' + S1 stripped from every note equals the V225 build, digest for digest'
''', r'''    if(VER >= V231_ERA) scopeSkip('G2 ' + TAG + ' beginner no-mile program with exactly \' \' + S1 stripped from every note equals the V225 build, digest for digest', same + '/' + cells + ' cells equal, ' + strips + ' S1 suffixes stripped');
    else ok('G2 ' + TAG + ' ' + (D188 ? 'beginner no-mile program with exactly \' \' + S1 stripped from every note equals the V225 build, digest for digest'
'''))

# ══ g226 (4/5, 5/5): G1h-P2b and G1h-P5 ══════════════════════════════════════════════════════════════════════════
EDITS[G226].append(('G1h-P2b', r'''    ok('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b === 0 && cnt.at690 > 0, ex('P2b'));
''', r'''    if(VER >= V231_ERA) scopeSkip('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b + ' of ' + cnt.at690 + ' cfgs differ');
    else ok('G1h-P2b D188 beginner at 11:30 (m = 690): weekGrid byte-identical to V225 (' + cnt.at690 + ' cfgs)', nBad.P2b === 0 && cnt.at690 > 0, ex('P2b'));
'''))
EDITS[G226].append(('G1h-P5', r'''    ok('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 === 0 && cnt.nonLR > 0 && cnt.unmoved > 0, ex('P5'));
''', r'''    if(VER >= V231_ERA) scopeSkip('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 + ' days differ');
    else ok('G1h-P5 D188 same length: every non-long-run day and every unmoved long-run day has V225\'s sections byte for byte (' + cnt.nonLR + ' + ' + cnt.unmoved + ' days)', nBad.P5 === 0 && cnt.nonLR > 0 && cnt.unmoved > 0, ex('P5'));
'''))

# ── apply: every anchor asserted count == 1 on the text as it stands; abort on the first miss, write nothing ──────────
result = {}
for rel, edits in EDITS.items():
    src = SRC[rel]
    for name, old, new in edits:
        n = src.count(old)
        if n != 1:
            die('%s anchor "%s" count %d (want 1)' % (rel, name, n))
        src = src.replace(old, new)
        print('anchor ok %s :: %s' % (rel, name))
    result[rel] = src

# ── figures on both trees from a scratch clone, before anything is written ────────────────────────────────────────
CL = M4 + '/clone'
PRE = M4 + '/pre'
TMP = M4 + '/tmp'
if os.path.exists(CL):
    shutil.rmtree(CL)
subprocess.run(['git', 'clone', '--shared', '--quiet', ROOT, CL], check=True)
for d in (PRE, TMP):
    os.makedirs(d, exist_ok=True)
# local requires of the four gates come from the working tree (tests/harness.js carries this session's era rows)
reqs = set()
for rel, src in result.items():
    for m in re.finditer(r"require\(path\.join\(__dirname,\s*'\.\.',\s*'([^']+)'\)\)", src):
        reqs.add('tests/' + m.group(1))
    if re.search(r"require\('\.", src):
        die(rel + ' carries a relative require this script does not mirror')
for r in sorted(reqs):
    shutil.copyfile(os.path.join(ROOT, r), os.path.join(CL, r))
    print('mirrored working-tree ' + r)
names = {}
for rel, src in result.items():
    bn = os.path.basename(rel)
    names[rel] = bn[:-3]
    with open(os.path.join(CL, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    with open(os.path.join(CL, 'tests/gates/ref_' + bn), 'w', encoding='utf-8') as fh:
        fh.write(SRC[rel])
    for f in (os.path.join(CL, rel), os.path.join(CL, 'tests/gates/ref_' + bn)):
        r = subprocess.run(['node', '--check', f], capture_output=True, text=True)
        if r.returncode != 0:
            die('node --check ' + f + ': ' + r.stderr[-400:])
    print('node --check ok ' + rel + ' (edited and reference)')
env = dict(os.environ, TMPDIR=TMP)
env.pop('IA_ASSUME_VERSION', None)
RUNS = {}
for rel in result:
    g = names[rel]
    RUNS[(g, 'cand')] = [os.path.join(CL, rel), CAND, BASE]
    RUNS[(g, 'v230')] = [os.path.join(CL, rel), BASE]
    RUNS[(g, 'ref230')] = [os.path.join(CL, 'tests/gates/ref_' + os.path.basename(rel)), BASE]
procs = {}
for k, argv in RUNS.items():
    out = open('%s/%s_%s.out' % (PRE, k[0], k[1]), 'w')
    script = 'set -eo pipefail; node "$@"'
    procs[k] = (subprocess.Popen(['bash', '-c', script, 'bash'] + argv, stdout=out, stderr=subprocess.STDOUT, env=env), out)
OUT = {}
for k, (p, fh) in procs.items():
    p.wait(); fh.close()
    OUT[k] = open('%s/%s_%s.out' % (PRE, k[0], k[1]), encoding='utf-8').read()
    print('ran %s on %s: exit %d' % (k[0], k[1], p.returncode))

bad = {names[rel]: [] for rel in result}
def want(k, pat, label, count=None):
    hits = re.findall(pat, OUT[k], re.M)
    okk = (len(hits) == count) if count is not None else bool(hits)
    print('  %s %s %s: %s%s' % ('figure ok ' if okk else 'FIGURE NOT AS RULED', k[0], k[1], label, '' if count is None else ' (%d of %d lines)' % (len(hits), count)))
    if not okk:
        bad[k[0]].append('%s %s: %s' % (k[0], k[1], label))
def none_of(k, pat, label):
    hits = re.findall(pat, OUT[k], re.M)
    print('  %s %s %s: %s' % ('figure ok ' if not hits else 'FIGURE NOT AS RULED', k[0], k[1], label))
    if hits:
        bad[k[0]].append('%s %s: %s' % (k[0], k[1], label))
def show(k, pat):
    for line in re.findall(pat, OUT[k], re.M):
        print('    | ' + line[:420])

A, B, C, D = names[G215], names[G221], names[G225], names[G226]
for g in (A, B, C, D):
    for t in ('cand', 'v230'):
        print('===== %s %s' % (g, t))
        show((g, t), r'^(?:   P1 .*|  L1: .*|  V231 bed.*|  D193 era .*|SKIP .*|(?:PASS|FAIL) (?:P1|G3[a-f]|G6a|CONFINEMENT|G2|G1h-).*|FAIL .*|PASS \d+ FAIL \d+)$')
# g215 P1
want((A, 'cand'), r'^   P1 \w+: reservation reads 6301, empty 898, collision drops \d+ ', 'P1 reads 6,301, empty 898, every tier', 5)
want((A, 'cand'), r'^   P1 \w+ by focus: support_prevention reads \d+, empty 898 \| other foci reads \d+, empty 0$', 'P1 empty all on support_prevention (898), other foci 0, every tier', 5)
want((A, 'cand'), r'^PASS P1 \w+ knee/protect \[V231 D195 A2r', 'P1 PASS on the candidate, every tier', 5)
want((A, 'v230'), r'^   P1 \w+ by focus: support_prevention reads \d+, empty 0 \| other foci reads \d+, empty 0$', 'P1 V230 emptyPrev 0 (the 231 conjunct fails there), every tier', 5)
want((A, 'v230'), r'^PASS P1 \w+ knee/protect: the hip-extension reservation is never empty', 'P1 V230 PASS by its below-231 branch, every tier', 5)
# g221
want((B, 'cand'), r'^  L1: \d+/\d+ builds, \d+ training days, 150989 swap pairs', 'pairs 150,989')
want((B, 'cand'), r'^  V231 bed-thrust donor \(Single-leg hip thrust \(shoulders on bed\)\) moved pairs on this tree: G3a 7, G3c off grammar 4, G3e 3, G6a toast 10 \| pin table D193_PIN_V231', 'bed-thrust donor out 7 / off 4 / null 3 / toast 10')
want((B, 'cand'), r"^PASS G3a .*moved 839 == pin 839; card != the hand card beneath the hold 0\] \[V231 D196-1: bed-thrust donor moved 7 == 7\]", 'G3a 839, beneath-the-hold 0, donor 7')
want((B, 'cand'), r"^PASS G3c .*power moved 0 == pin 0, off grammar moved 172 == pin 172; off-grammar card != the hand card beneath the hold 0\] \[V231 D196-1: bed-thrust donor off grammar moved 4 == 4\]", 'G3c power 0, off 172, beneath-the-hold 0, donor 4')
want((B, 'cand'), r"^PASS G3d .*moved 263 == pin 263; card != the hand card beneath the hold 0\]", 'G3d 263')
want((B, 'cand'), r"^PASS G3e .*moved 205 == pin 205; card != the hand card beneath the hold 0\] \[V231 D196-1: bed-thrust donor moved 3 == 3\]", 'G3e 205, beneath-the-hold 0, donor 3')
want((B, 'cand'), r"^PASS G3f .*moved 199 == pin 199; card != the hand rewrite beneath the hold 0\]", 'G3f 199')
want((B, 'cand'), r"^PASS G6a .*moved 1253 == pin 1253, every one the hold variant on a hand clamp pair \(not 0\), hand clamp pairs \d+ without the hold toast 0, .*\] \[V231 D196-1: bed-thrust donor toast moved 10 == 10\]", 'G6a 1,253, bT 0, missT 0, donor 10')
want((B, 'v230'), r'^  L1: \d+/\d+ builds, \d+ training days, 150068 swap pairs', 'V230 pairs 150,068')
want((B, 'v230'), r'^  V231 bed-thrust donor \(Single-leg hip thrust \(shoulders on bed\)\) moved pairs on this tree: G3a 0, G3c off grammar 0, G3e 0, G6a toast 0 \| pin table D193_PIN \(229 and 230\)', 'V230 bed-thrust donors 0 (the 231 conjunct fails there)')
want((B, 'v230'), r"^PASS G3a .*moved 832 == pin 832; card != the hand card beneath the hold 0\]$", 'V230 G3a 832 on the 229..230 table')
want((B, 'v230'), r"^PASS G6a .*moved 1243 == pin 1243, ", 'V230 G6a 1,243 on the 229..230 table')
# g225
want((C, 'cand'), r'^SKIP CONFINEMENT D189 era .*successors g231_d195b_cost D195-B-b, g231_d195_hipext D195-A-b\. Never PASS, never FAIL\.$', 'CONFINEMENT SKIP line at column 0', 1)
none_of((C, 'cand'), r'^(?:PASS|FAIL) CONFINEMENT', 'CONFINEMENT neither PASS nor FAIL on the candidate')
want((C, 'v230'), r'^PASS CONFINEMENT D189 era \(ia-version 230 >= 226, Class B\)', 'V230 CONFINEMENT PASS by its 226..230 branch', 1)
# g226
want((D, 'cand'), r"^SKIP G2 D188 beginner no-mile program with exactly ' ' \+ S1 stripped from every note equals the V225 build, digest for digest \(0/120 cells equal, \d+ S1 suffixes stripped on this tree\)", 'G2 identity SKIP (120 of 120 cells moved)', 1)
want((D, 'cand'), r'^PASS G2 D188 V225 baseline builds equal themselves before any diff', 'G2 V225 self-identity precondition PASS', 1)
want((D, 'cand'), r'^SKIP G1h-P2b .*\(48 of 48 cfgs differ on this tree\)', 'G1h-P2b SKIP (48 cfgs)', 1)
want((D, 'cand'), r'^SKIP G1h-P5 .*\(3252 days differ on this tree\)', 'G1h-P5 SKIP (3,252 days)', 1)
want((D, 'cand'), r'^PASS G1h-(?:P0|P1|A1L|P2|P3|P4|L1|L2|L3) ', 'G1h-P0/P1/A1L/P2/P3/P4/L1-L3 PASS on the candidate', 9)
want((D, 'v230'), r"^PASS G2 D188 beginner no-mile program with exactly ' ' \+ S1 stripped", 'V230 G2 identity PASS', 1)
want((D, 'v230'), r'^PASS G1h-(?:P2b|P5) ', 'V230 G1h-P2b and P5 PASS', 2)
# every gate whole on both trees; no SKIP of the new kind on V230; V230 row lines byte-identical to the current gates'
for g in (A, B, C, D):
    for t in ('cand', 'v230', 'ref230'):
        want((g, t), r'^PASS \d+ FAIL 0$', 'summary FAIL 0', 1)
    none_of((g, 'v230'), r'^SKIP (?:CONFINEMENT|G2|G1h-)', 'no V231 SKIP line below 231')
rows = lambda s: [l for l in s.split('\n') if re.match(r'^(PASS|FAIL|SKIP) ', l)]
for g in (A, B, C, D):
    a_, b_ = rows(OUT[(g, 'ref230')]), rows(OUT[(g, 'v230')])
    if a_ == b_ and a_:
        print('  V230 row lines unchanged %s (%d lines vs the current gate on V230)' % (g, len(a_)))
    else:
        bad[g].append('%s v230 row lines differ from the current gate' % g)
        for x, y in zip(a_, b_):
            if x != y:
                print('    was ' + x[:300]); print('    now ' + y[:300])
        if len(a_) != len(b_):
            print('    line counts %d vs %d' % (len(a_), len(b_)))
parked = [g for g in bad if bad[g]]
for g in parked:
    print('PARKED (standing ruling 7) %s: %s' % (g, ' ; '.join(bad[g])))
if dry:
    print('dry run: %d of 4 files as ruled; nothing written' % (4 - len(parked)))
    sys.exit(1 if parked else 0)
for rel, src in result.items():
    if names[rel] in parked:
        print('not written (parked) ' + rel)
        continue
    with open(os.path.join(ROOT, rel), 'w', encoding='utf-8') as fh:
        fh.write(src)
    print('wrote ' + os.path.join(ROOT, rel))
sys.exit(1 if parked else 0)
