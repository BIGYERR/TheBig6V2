#!/usr/bin/env python3
# V227 slice 11 of D190 P-SWAPSEAM: gate row (d) as re-ruled, and its sabotage rows. No version bump, index.html untouched.
#   RULING: tests/measure/v227_rulings/d190_swapseam_ruling.md, "RE-RULING 2 (row (d) scope; the undo-key defect)";
#   premise P11: tests/measure/v227_rulings/measure_d190_p11_v227.md (PASS; G7-1a measured NOT to trip).
#   E1  tests/gates/g227_d190_seam.js header: the (d) claim verbatim from RE-RULING 2, MEMBER_d, the V226 rows, ROWS
#       (d-U, d-U', INFO D192; builder 6's class-list narrowing withdrawn), SABOTAGE M6.
#   E2  tests/gates/g227_d190_seam.js code: R.d -> R.dU + R.dUp; the row (d) block -> d-U, INFO D192 P-UNDOKEY, d-U'.
#   E3  tests/sabotage/v227_d190.json: two rows S6-D190 (drop the hit.rx restore block in undoSwap): seam d-U; g221 G5a/b/c.
#   E4  tests/sabotage/v227_d190.json: the stale "Row d ... PARKED" sentence in the 8 existing notes -> a pointer to S6-D190.
# Every anchor is asserted count==1 before anything is written; the script aborts on the first miss.
import json, os, sys

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HTML = os.path.join(ROOT, 'index.html')
GATE = os.path.join(ROOT, 'tests/gates/g227_d190_seam.js')
SPEC = os.path.join(ROOT, 'tests/sabotage/v227_d190.json')

def die(msg):
    print('ABORT: ' + msg); sys.exit(1)

def one(src, a, nm):
    n = src.count(a)
    if n != 1: die('%s anchor count=%d, want 1' % (nm, n))

html = open(HTML, encoding='utf-8').read()
if '<meta name="ia-version" content="227">' not in html: die('index.html is not ia-version 227')

# ── E1 + E2: the gate ────────────────────────────────────────────────────────────────────────────────────────────────
gate = open(GATE, encoding='utf-8').read()
REPL = []

H1_OLD = r'''// THE RULING THIS DEFENDS: tests/measure/v227_rulings/d190_swapseam_ruling.md, D190 and RE-RULING 1 (where they differ,
// RE-RULING 1 is the live text). D-code D190, ships on ia-version 227 (Mario: "Ship D190 at V227").
'''
H1_NEW = r'''// THE RULING THIS DEFENDS: tests/measure/v227_rulings/d190_swapseam_ruling.md, D190, RE-RULING 1 and RE-RULING 2 (where
// they differ, the later re-ruling is the live text; RE-RULING 2 governs row (d) only). D-code D190, ships on ia-version
// 227 (Mario: "Ship D190 at V227").
'''
REPL.append(('H1 ruling line', H1_OLD, H1_NEW))

H2_OLD = r'''//   (d) original ruling, RE-RULING 1 "stands": swap then undo byte-identical on the whole day on every injured chain
//       (measured 66,969/66,969; injured 0/49,752 not byte-identical).
'''
H2_NEW = r'''//   (d) RE-RULING 2 §1, verbatim (it amends the original "swap then undo byte-identical on the whole day on every
//       injured chain" and RE-RULING 1 "(d) stands"; RE-RULING 2 §3 WITHDRAWS builder 6's hop1/hop2/cyc2 narrowing as a
//       class list): "Population U_d: every chain the (a) walk produces (hop1, hop2, cyc2 enumerated; hop3, cyc3,
//       collide2, exch3 sampled) whose hop `to` names, listed by hand from the chain, are pairwise distinct across the
//       day. On U_d: the chip on the last hop's card is found and equals the last hop's `from` (store-derived chip ==
//       hand-derived chip; that conjunct is the membership proof, since the last record always survives and no other
//       record on the day carries that `to`); after `undoSwap(chip)` the whole day, clock fields stripped, is
//       byte-identical to the day the live page showed before the last hop. Residue 0 of |U_d|, |U_d| > 0, no licence.
//       Predicate `VER >= 227`, REFUSED below. PASS expected on V226 and V227 alike (an invariance row; its bite is the
//       named trip below). Complement U_d' (some `to` repeats on the day): prints |U_d'|, undo-wrong by shape, and
//       healed vs baseline as INFO under the name D192 P-UNDOKEY, never asserted, never licensed; |U_d'| > 0 is a
//       conjunct so the pair row is not vacuous. Pair row, keyed to R6: every U_d' chain that undoes byte-identical on
//       the baseline (argv[3]) undoes byte-identical on the artifact. Created 0 (measured: created 0, healed 0 on
//       28,246; A>B>A>B 2,344/2,344 right on both trees)."
//       P11 on this walk (tests/measure/v227_rulings/measure_d190_p11_v227.md): U_d 15,112 over 7 classes, every class
//       non-empty, 0 wrong, chip == hand chip 15,112/15,112; U_d' 90, all hop3 (35 A>B>C>B wrong on both trees, 55
//       A>B>A>B right), created 0, healed 0. The last hop's card is the slot the last hop renamed: collide2 slot j (it
//       holds A after B->A; the chip is the B->A record), exch3 slot i (the chip is X).
'''
REPL.append(('H2 (d) claim', H2_OLD, H2_NEW))

H3_OLD = r'''//   V226   row a-U' only: the baseline's own act and boot of the same chain (argv[3] if it reads 226, else the pinned
//          V226 commit; see VERSION PREDICATE).
'''
H3_NEW = r'''//   MEMBER_d by hand, row (d): a chain is in U_d iff its hop `to` names, from the chain tuple, are pairwise distinct (one
//          chain per day per batch, so the day's hops are the chain's). The hand chip is the last hop's `from`. The
//          store side is the chip the card reads (swapOriginOf of the name the last hop wrote into its slot); d-U
//          asserts store chip == hand chip on every U_d chain, which is the membership cross-check.
//   V226   rows a-U' and d-U' only: the baseline's own act, boot and undo of the same chain (argv[3] if it reads 226, else
//          the pinned V226 commit; see VERSION PREDICATE).
'''
REPL.append(('H3 MEMBER_d + V226 oracle', H3_OLD, H3_NEW))

H4_OLD = r'''//   V226 tree      row a-U' reads the baseline from argv[3] if it reads 226, else from `git show
'''
H4_NEW = r'''//   V226 tree      rows a-U' and d-U' read the baseline from argv[3] if it reads 226, else from `git show
'''
REPL.append(('H4 V226 tree', H4_OLD, H4_NEW))

H5_OLD = r'''//   d      every reachable hop1/hop2/cyc2 chain (every config is injured; the ruling's P6 population, "every lattice
//          chain", P1's lattice being hop1/hop2/cyc2): undo of the last hop through its chip leaves the whole day
//          byte-identical (clock fields stripped) to the day before that hop; the chip is found on every chain. The
//          sampled classes print as INFO: a hop3 whose last target revisits an earlier target (A>B>C>B) undoes to A, not
//          C, because swapOriginOf takes the first record with that `to`; name keyed undo is untouched by D190 (R6).
'''
H5_NEW = r'''//   d-U    on U_d (MEMBER_d: hop `to` names pairwise distinct), every class of the (a) walk: the chip on the last hop's
//          card is found and equals the last hop's `from`, and after undoSwap(chip) the whole day (clock fields
//          stripped) is byte-identical to the day the live page showed before the last hop. Residue 0 of |U_d|,
//          |U_d| > 0, no licence; every class and config prints.
//   d-U'   pair, U_d' only (some `to` repeats on the day), keyed to R6: every U_d' chain that undoes byte-identical on
//          V226 (argv[3]) undoes byte-identical on the candidate. created 0; |U_d'| > 0 and at least one U_d' chain run
//          on both trees (the ruling's non-vacuity conjunct, read where the comparison happens).
//   INFO   D192 P-UNDOKEY: |U_d'|, undo wrong by shape, chip != hand chip, healed vs V226; never asserted, never licensed.
//          Self-expiring: when D192 ships the last-match chip every U_d' chain undoes right and this line goes quiet,
//          with no re-key of (d).
//          Builder 6's row d (asserted on hop1/hop2/cyc2 only, the sampled classes as INFO) is WITHDRAWN by RE-RULING 2.
'''
REPL.append(('H5 ROWS d', H5_OLD, H5_NEW))

H6_OLD = r'''//   M5  the boot re-filter in applySessionSwaps (`if(hit && prog.cfg && prog.cfg.injury){`) disabled: a-U trips.
'''
H6_NEW = r'''//   M5  the boot re-filter in applySessionSwaps (`if(hit && prog.cfg && prog.cfg.injury){`) disabled: a-U trips.
//   M6  (S6-D190, RE-RULING 2 §1) the `if(Array.isArray(hit.rx)){...}` restore block in undoSwap dropped: d-U trips on
//       every U_d chain whose donor detail the rename alone does not reproduce (D177 window swaps, cued donors; P11:
//       1,886/15,112). The same mutation trips g221 G5a, G5b and G5c (its own spec row); G7-1a does not (P11: it never
//       calls undoSwap), so the spec does not name it.
'''
REPL.append(('H6 SABOTAGE M6', H6_OLD, H6_NEW))

C0_OLD = r'''// V226 baseline for row a-U' (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226
'''
C0_NEW = r'''// V226 baseline for rows a-U' and d-U' (V227 slice 10, the V226 slice 7e form of g225_d187_pacerate.js and the g226
'''
REPL.append(('C0 baseline comment', C0_OLD, C0_NEW))

C1_OLD = r'''  d:    'row d D190 swap then undo of the last hop: whole day byte-identical to the day before that hop, chip found, every injured lattice chain (hop1/hop2/cyc2)',
'''
C1_NEW = r'''  dU:   "row d-U D190 R6 on U_d (hand: hop `to` names pairwise distinct on the day): the chip on the last hop's card is found and equals the last hop's `from`, and undoSwap(chip) leaves the whole day byte-identical to the day before the last hop; residue 0 of |U_d|, |U_d| > 0, no licence",
  dUp:  "row d-U' D190 R6 pair on U_d' (some `to` repeats on the day): every U_d' chain that undoes byte-identical on V226 undoes byte-identical on the candidate, created 0, |U_d'| > 0",
'''
REPL.append(('C1 R.d', C1_OLD, C1_NEW))

C2_OLD = r'''// ── d ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  // the ruling's (d) population is P6's: "every lattice chain", the lattice being hop1/hop2/cyc2 (P1); the sampled classes
  // print as INFO, split by whether the last hop's target already appeared as an earlier target on the slot (the chip is
  // name keyed: swapOriginOf takes the first record whose `to` matches, which D190 does not touch, R6)
  const lat = reach.filter(r => LAT.includes(r.c.cls)), smp = reach.filter(r => !LAT.includes(r.c.cls));
  const noChip = lat.filter(r => !r.chip), bad = lat.filter(r => !r.undoEq);
  const toRevisit = r => { const hl = r.c.hops[r.c.hops.length - 1]; return r.c.hops.slice(0, -1).some(h => h.si === hl.si && h.ii === hl.ii && h.to === hl.to); };
  console.log('    d lattice by class: ' + LAT.map(k => k + ' ' + lat.filter(r => r.c.cls === k && r.undoEq).length + '/' + lat.filter(r => r.c.cls === k).length).join(' | ') + ' byte-identical');
  const sb = smp.filter(r => !r.undoEq);
  console.log('    INFO d sampled classes (not the ruling\'s (d) population, never asserted): ' + Object.entries(tally(smp, r => r.c.cls)).map(([k, v]) => k + ' ' + smp.filter(r => r.c.cls === k && r.undoEq).length + '/' + v).join(' | ')
    + ' byte-identical | not identical by shape: ' + fmt(tally(sb, r => r.c.cls + (toRevisit(r) ? '|last target revisits an earlier target' : '|other'))) + ' (target-revisit chains in sample ' + smp.filter(toRevisit).length + ')');
  sb.slice(0, 2).forEach(r => console.log('      ' + tag(r) + ' chip ' + (r.chip || '(none)')));
  bad.slice(0, 3).forEach(r => console.log('      ' + tag(r) + ' chip ' + (r.chip || '(none)')));
  ok(R.d, SELF && lat.length > 0 && bad.length === 0 && noChip.length === 0, 'not byte-identical ' + bad.length + '/' + lat.length + ', no chip ' + noChip.length);
}
'''
C2_NEW = r'''// ── d (RE-RULING 2): d-U on U_d, INFO D192 P-UNDOKEY, d-U' pair on U_d' vs V226 ───────────────────────────────────────
{
  // MEMBER_d by hand: the hop `to` names from the chain tuple, pairwise distinct (one chain per day per batch, so the
  // day's hops are the chain's). The hand chip is the last hop's `from`; r.chip is what the card reads off the store
  // (swapOriginOf of the name the last hop wrote into its slot, run()), so chip == hand chip is the store-side check.
  const handUd = c => new Set(c.hops.map(h => h.to)).size === c.hops.length;
  const hChip = c => c.hops[c.hops.length - 1].from;
  const chipOk = r => !!r.chip && r.chip === hChip(r.c);
  const CLS = ['hop1', 'hop2', 'cyc2', 'hop3', 'cyc3', 'collide2', 'exch3'];
  // shape: one-slot chains as the name walk (A>B>C>B), cross-slot chains hop by hop; letters by first appearance
  const shape = c => { const L = new Map(), lt = x => { if(!L.has(x)) L.set(x, String.fromCharCode(65 + L.size)); return L.get(x); };
    const one = c.hops.every(h => h.si === c.hops[0].si && h.ii === c.hops[0].ii);
    return c.cls + ' ' + (one ? [c.hops[0].from].concat(c.hops.map(h => h.to)).map(lt).join('>') : c.hops.map(h => '[' + h.si + '][' + h.ii + ']' + lt(h.from) + '>' + lt(h.to)).join(' ')); };
  const Ud = reach.filter(r => handUd(r.c)), UdP = reach.filter(r => !handUd(r.c));
  const resU = Ud.filter(r => !chipOk(r) || !r.undoEq);
  console.log("    d-U |U_d| " + Ud.length + " (|U_d'| " + UdP.length + ') by class, chip == hand chip / undo byte-identical / |U_d|: '
    + CLS.map(k => { const g = Ud.filter(r => r.c.cls === k); return k + ' ' + g.filter(chipOk).length + '/' + g.filter(r => r.undoEq).length + '/' + g.length; }).join(' | '));
  console.log('          by config, chip == hand chip and undo byte-identical / |U_d|: ' + Object.keys(CFGS).map(ck => { const g = Ud.filter(r => r.c.ck === ck); return ck + ' ' + g.filter(r => chipOk(r) && r.undoEq).length + '/' + g.length; }).join(' | '));
  if(resU.length){ console.log('    d-U residue by config|week|class: ' + fmt(tally(resU, r => r.c.ck + '|W' + r.c.w + '|' + r.c.cls)));
    resU.slice(0, 4).forEach(r => console.log('      ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', hand chip ' + hChip(r.c) + (r.undoEq ? '' : ', undo not byte-identical'))); }
  ok(R.dU, SELF && Ud.length > 0 && resU.length === 0, 'residue ' + resU.length + '/' + Ud.length + ' (no chip ' + Ud.filter(r => !r.chip).length
    + ', chip != hand chip ' + Ud.filter(r => r.chip && !chipOk(r)).length + ', undo not byte-identical ' + Ud.filter(r => !r.undoEq).length + ')');
  // U_d' on V226: the same chains acted, booted and undone on the baseline (fresh('B'))
  let BD = null;
  if(B){ BD = new Map(); for(const ck of Object.keys(CFGS)){ const ch = UdP.filter(r => r.c.ck === ck).map(r => r.c); if(ch.length) run('B', ck, ch, true).forEach(x => BD.set(x.c.id, x)); } }
  const both = BD ? UdP.filter(r => BD.has(r.c.id) && !BD.get(r.c.id).unreach) : [];
  const bEq = both.filter(r => BD.get(r.c.id).undoEq), created = bEq.filter(r => !r.undoEq), healed = both.filter(r => !BD.get(r.c.id).undoEq && r.undoEq);
  const wrongP = UdP.filter(r => !r.undoEq), byShape = tally(UdP, r => shape(r.c)), wrongShape = tally(wrongP, r => shape(r.c));
  console.log("    INFO D192 P-UNDOKEY (never asserted, never licensed): |U_d'| " + UdP.length + ', undo wrong ' + wrongP.length + ' | wrong/total by shape: '
    + (Object.keys(byShape).sort().map(k => k + ' ' + (wrongShape[k] || 0) + '/' + byShape[k]).join(' | ') || '(none)')
    + ' | chip != hand chip ' + UdP.filter(r => !chipOk(r)).length + ' | healed vs V226 ' + (BD ? healed.length : 'n/a (no V226 tree)'));
  wrongP.slice(0, 2).forEach(r => console.log('      ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', hand chip ' + hChip(r.c) + ' | store ' + JSON.stringify(r.rec.map(e => e.from + '->' + e.to))));
  if(!B) ok(R.dUp + ' (setup: no V226 tree: ' + baseWhy + ')', false);
  else {
    console.log("    d-U' V226 run " + BD.size + ', reachable on both ' + both.length + ' | V226 undoes byte-identical ' + bEq.length + ', of those candidate not (created) ' + created.length + ' | healed ' + healed.length);
    created.slice(0, 3).forEach(r => console.log('      created ' + tag(r) + ' | chip ' + (r.chip || '(none)') + ', V226 chip ' + (BD.get(r.c.id).chip || '(none)')));
    ok(R.dUp, SELF && UdP.length > 0 && both.length > 0 && created.length === 0, 'created ' + created.length + ' of ' + bEq.length + " U_d' chains byte-identical on V226 (|U_d'| " + UdP.length + ', on both ' + both.length + ', healed ' + healed.length + ')');
  }
}
'''
REPL.append(('C2 row d block', C2_OLD, C2_NEW))

for nm, a, b in REPL: one(gate, a, 'gate ' + nm)
for nm, a, b in REPL:
    if a == b: die('gate ' + nm + ' replacement identical to anchor')
    gate = gate.replace(a, b, 1)
for tok in ['R.d,', 'R.d ', "row d D190 swap then undo", 'toRevisit', 'PARKED']:
    if tok in gate: die('gate still carries the withdrawn token ' + repr(tok))

# ── E3 + E4: the sabotage spec ───────────────────────────────────────────────────────────────────────────────────────
raw = open(SPEC, encoding='utf-8').read()
spec = json.loads(raw)
if json.dumps(spec, ensure_ascii=False, indent=1) + '\n' != raw: die('spec does not round-trip byte-identical; refusing to rewrite it')
if len(spec) != 8: die('spec has %d rows, want 8 (slices 9/10)' % len(spec))
if any(r['name'].startswith('S6-D190') for r in spec): die('S6-D190 already in the spec')

RX_BLOCK = ("  if(Array.isArray(hit.rx)){\n"
            "    const _put=[];\n"
            "    hit.rx.forEach(function(p){\n"
            "      if(!p||typeof p.d!=='string') return;\n"
            "      const ps=day.sections[p.s], at=ps&&ps.items&&ps.items[p.i];\n"
            "      let it=(at&&at.name===from&&_put.indexOf(at)<0)?at:null;\n"
            "      if(!it) (day.sections||[]).some(function(s){return ((s&&s.items)||[]).some(function(x){\n"
            "        if(x&&x.name===from&&_put.indexOf(x)<0){it=x;return true;} return false;});});\n"
            "      if(it){it.detail=p.d;_put.push(it);}\n"
            "    });\n"
            "  }\n")
CLEAR = "  clearSwap(activeProgId,currentWeek,currentDayKey,from);"
S6_ANCHOR = RX_BLOCK + CLEAR
one(html, RX_BLOCK, 'index.html hit.rx restore block')
one(html, S6_ANCHOR, 'index.html hit.rx restore block + clearSwap')
if not all(ord(ch) < 128 for ch in S6_ANCHOR): die('S6 anchor not ASCII')

S6_SEAM = {
    "name": "S6-D190 R6 (d) -> the hit.rx restore block in undoSwap is dropped: undo brings the donor's name back but not its detail",
    "anchor": S6_ANCHOR,
    "replacement": CLEAR,
    "gate": "gates/g227_d190_seam.js",
    "note": ("NAMED TRIP: row d-U (RE-RULING 2 section 1: every U_d chain whose donor detail the rename alone does not"
             " reproduce, D177 window swaps and cued donors; measure P11 on this walk plus HALF_MANNY and mario_noinj:"
             " 1,886/15,112 over all 7 classes; 1,526/10,513 on the withdrawn lattice-only row d). The record still carries"
             " rx, so only the restore is under test. EXPECTED: d-U. a-MEM, a-U, a-U', e-PRE and e read no undo and stay"
             " green; d-U' is not named by this row. Keyed to RE-RULING 2 (D190 R6, undo unchanged)."),
}
S6_G221 = {
    "name": "S6-D190 R6 (g221 G5) -> the hit.rx restore block in undoSwap is dropped: the D177 window and cued donors come back with the grid detail",
    "anchor": S6_ANCHOR,
    "replacement": CLEAR,
    "gate": "gates/g221_d177_swapfloor.js",
    "note": ("NAMED TRIP: G5a, G5b, G5c (measure P11 on this mutation: G5a 26,715 of 150,068 not byte-identical after undo,"
             " G5b Close-grip bench press -> Dips -> undo returns the open-sets detail, G5c). RE-RULING 2 said this trip"
             " 'may also trip g221 G7-1a'; P11 measured that false (G7-1a PASS: it checks the exSwapPrefs window on a build"
             " and a reboot and never calls undoSwap), so G7-1a is not named. Same mutation as the row above."),
}
for r in (S6_SEAM, S6_G221):
    for k, v in r.items():
        if not all(ord(ch) < 128 for ch in v): die('S6 field %s not ASCII' % k)

OLD_SENT = "Row d of g227_d190_seam is PARKED and is named by no mutation."
NEW_SENT = "Row d (D190 R6, re-ruled in RE-RULING 2) is named by S6-D190."
before = json.loads(raw)
for i, r in enumerate(spec):
    if r['note'].count(OLD_SENT) != 1: die('spec row %d note carries the PARKED sentence %d times, want 1' % (i, r['note'].count(OLD_SENT)))
    r['note'] = r['note'].replace(OLD_SENT, NEW_SENT, 1)
spec.extend([S6_SEAM, S6_G221])

# parse-compare: rows 0..7 differ only in the note sentence; 8 and 9 are the S6 rows
for i, (a, b) in enumerate(zip(before, spec[:8])):
    if set(a) != set(b): die('row %d keys moved' % i)
    for k in a:
        if k == 'note':
            if a[k].replace(OLD_SENT, NEW_SENT, 1) != b[k]: die('row %d note moved beyond the sentence' % i)
        elif a[k] != b[k]: die('row %d field %s moved' % (i, k))
if len(spec) != 10: die('spec has %d rows after E3, want 10' % len(spec))
out = json.dumps(spec, ensure_ascii=False, indent=1) + '\n'
if 'PARKED' in out: die('spec still says PARKED')

# ── write (only after every anchor and the parse-compare held) ───────────────────────────────────────────────────────
open(GATE, 'w', encoding='utf-8').write(gate)
open(SPEC, 'w', encoding='utf-8').write(out)
print('OK gate: %d replacements; spec: 8 notes re-pointed, 2 rows added (10 rows)' % len(REPL))
