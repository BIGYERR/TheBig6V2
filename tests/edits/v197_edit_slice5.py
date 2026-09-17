#!/usr/bin/env python3
# V197 slice 5 — three gate/spec fixes named by gatekeeper. index.html is NOT touched.
#   FIX 1  tests/sabotage/v197.json     M9 retuned 14 -> 18 (surgical, reaches B4 by name)
#   FIX 2  tests/gates/g197_leg_accessory.js  C1/C2 re-pointed at the real symptom
#   FIX 3  tests/gates/g193_budget_floor.js   the V192 oracle guard goes per-tier
# Every anchor asserted count==1 before any write. First miss aborts the whole script.
import io, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))   # tests/
REPO = os.path.dirname(ROOT)
PLAN = []   # (path, [(anchor, replacement, label), ...])


def rd(p):
    with io.open(p, encoding='utf-8') as f:
        return f.read()


# ── FIX 1 ───────────────────────────────────────────────────────────────────────────
SAB = os.path.join(ROOT, 'sabotage', 'v197.json')
PLAN.append((SAB, [
    (
        '"name": "M9 -> the session budget is tightened to 14, so the trim runs far past the ruled isolation band and strips work nobody ruled deletable off every tier"',
        '"name": "M9 -> the session budget is tightened from 20 to 18, so the trim runs one notch past the ruled isolation band and eats non-optional work on every tier (retuned from 14 in V197 slice 5: 14 and 16 both trip ten claims at once, which proves nothing about which claim is load-bearing; 18 reaches the named B4 ratchet and models a regression rather than a catastrophe)"',
        'M9 name: retune note',
    ),
    (
        '"replacement": "const SESSION_SET_BUDGET = 14;"',
        '"replacement": "const SESSION_SET_BUDGET = 18;"',
        'M9 replacement: 14 -> 18',
    ),
]))

# ── FIX 2 ───────────────────────────────────────────────────────────────────────────
G197 = os.path.join(ROOT, 'gates', 'g197_leg_accessory.js')

C_OLD_HDR = """// ════════════════════════════════════════════════════════════════════════════════════
// C. RENDER — the four surfaces that throw on a nameless item
// ════════════════════════════════════════════════════════════════════════════════════"""
C_NEW_HDR = """// ════════════════════════════════════════════════════════════════════════════════════
// C. RENDER — the four surfaces, and the row the athlete actually reads
//
// CORRECTED IN V197 SLICE 5, AND THIS NOTE NAMES THE CORRECTION. The cluster was
// sequenced on the belief that an emptied pool makes these four surfaces THROW, so the
// week view would not draw. Gatekeeper probed the surfaces directly and that is wrong:
//   {name:undefined, detail:'3×12'}     buildSectionsHTML ok  sessionLogProgress ok
//                                       sessionTimeEst ok     buildHeroPreview ok
//   {name:undefined, detail:undefined}  ok  ok  ok  ok
//   {} / {name:null}                    ok  ok  ok  ok
//   a literal `undefined` ARRAY ELEMENT threw on all four — and no code path builds one.
// buildExItem writes `<span class="ex-name">`+(i.name||'') — a nameless item does not
// crash the card, it renders a BLANK ROW. The legIso[1] guard and the sequencing are
// still right; the danger was overstated and Mario has been told.
//   OLD C1 "all four surfaces ran on every sampled day" — rRan is incremented before the
//   try, so it could not fail for any artifact. OLD C2 "no render surface threw" — no
//   reachable artifact throws. Both were the V195 vacuity defect: a green `ok` reading as
//   coverage. They are NOT deleted, they are RE-POINTED at the symptom that is real, and
//   harvested from rendered output: a superset row with nothing in its name slot.
// NOTHING IS WEAKENED BY THE RE-POINT. A throw is still fatal — the catch below already
// does its own `fail++` and prints FAIL C-throw by name, which is what made the old C2
// redundant in the first place. The ran/threw counters survive as `--` informational
// denominators, which is all they ever were.
// ════════════════════════════════════════════════════════════════════════════════════"""

C_OLD_TAIL = """let rThrew = 0, rRan = 0, doseRendered = 0;
renderDays.forEach(rd => {
  IA.window.__SEC = [rd.sec];
  IA.window.__DAY = rd.day;
  PROBES.forEach(([code, where]) => {
    rRan++;
    try {
      const r = IA.eval(code);
      if (code.indexOf('buildSectionsHTML') === 0 && typeof r === 'string') {
        if (/wall sit/i.test(r) && new RegExp(HOLD_DOSE_SEC + '\\\\s*sec', 'i').test(r)) doseRendered++;
        if (/undefined/i.test(r)) { fail++; console.log('FAIL C-undefined-in-html ' + rd.tier + ' ' + where); }
      }
    } catch (e) { rThrew++; console.log('FAIL C-throw ' + rd.tier + ' / ' + where + '  -> ' + e.message); fail++; }
  });
});
ok('C1 all four surfaces ran on every sampled day', rRan === renderDays.length * 4, rRan);
ok('C2 no render surface threw', rThrew === 0, rThrew);
ok('C3 at least one rendered card shows the 25-second hold', doseRendered > 0, doseRendered);"""

C_NEW_TAIL = """let rThrew = 0, rRan = 0, doseRendered = 0;
// THE ROW ORACLE, and it is not the engine asserting it equals itself. buildExItem emits
// exactly ONE name slot per item — `<span class="ex-name">` for a live row, or
// `<span class="ex-skipped-name">` for a struck-through stub — so the rendered HTML can
// be counted against the section's own item list, which is the INPUT to the render and
// not its output. Two properties, both independent of what the engine chose to draw:
//   every item reaches the card as its own row  (rows == items)
//   every row the athlete reads carries a name  (no empty name slot)
const NAME_SLOT = /<span class="ex-(?:skipped-)?name">([\\s\\S]*?)<\\/span>/g;
const slotText = h => {
  const out = [];
  let m; NAME_SLOT.lastIndex = 0;
  while ((m = NAME_SLOT.exec(h))) out.push(String(m[1]).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
  return out;
};
let rowsRendered = 0, rowsExpected = 0, blankRows = 0, ssSections = 0, ssBlank = 0, ssShort = 0;
const blankWhere = [], ssWhere = [];
renderDays.forEach(rd => {
  IA.window.__SEC = [rd.sec];
  IA.window.__DAY = rd.day;
  PROBES.forEach(([code, where]) => {
    rRan++;
    try {
      const r = IA.eval(code);
      if (code.indexOf('buildSectionsHTML') === 0 && typeof r === 'string') {
        if (/wall sit/i.test(r) && new RegExp(HOLD_DOSE_SEC + '\\\\s*sec', 'i').test(r)) doseRendered++;
        if (/undefined/i.test(r)) { fail++; console.log('FAIL C-undefined-in-html ' + rd.tier + ' ' + where); }
        const names = slotText(r), items = (rd.sec.items || []).length;
        rowsRendered += names.length; rowsExpected += items;
        const blanks = names.filter(n => !n).length;
        blankRows += blanks;
        if (blanks) blankWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" ' + blanks + '/' + names.length + ' blank');
        // The superset row is the ruled symptom: legIso[1] written when the pool short-drew
        // put a second item on the card with no name in it. Any multi-item section renders
        // as a row of names and every one of them must be readable.
        if (items > 1) {
          ssSections++;
          if (blanks) { ssBlank++; ssWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" -> [' + names.join(' | ') + ']'); }
          if (names.length !== items) { ssShort++; ssWhere.push(rd.tier + ' "' + (rd.sec.label || '') + '" ' + names.length + ' rows for ' + items + ' items'); }
        }
      }
    } catch (e) { rThrew++; console.log('FAIL C-throw ' + rd.tier + ' / ' + where + '  -> ' + e.message); fail++; }
  });
});
console.log('   -- probes driven ' + rRan + '/' + (renderDays.length * 4) + ', threw ' + rThrew
  + ' (a throw fails above by name; these two are denominators, not claims)');
console.log('   -- name slots rendered ' + rowsRendered + ' for ' + rowsExpected + ' items, blank ' + blankRows
  + ', multi-item sections sampled ' + ssSections);
if (blankWhere.length) console.log('   -- blank rows: ' + blankWhere.slice(0, 8).join('; '));
if (ssWhere.length)    console.log('   -- superset rows: ' + ssWhere.slice(0, 8).join('; '));
ok('C1 every rendered row carries a name the athlete can read (no blank name slot)',
   blankRows === 0 && rowsRendered > 0, blankRows + ' blank of ' + rowsRendered + ' rendered');
ok('C2 every multi-item (superset) row renders one named row per item, none blank, none dropped',
   ssSections > 0 && ssBlank === 0 && ssShort === 0 && rowsRendered === rowsExpected,
   ssSections + ' sampled, ' + ssBlank + ' with a blank slot, ' + ssShort + ' short-rendered, rows ' + rowsRendered + ' vs items ' + rowsExpected);
ok('C3 at least one rendered card shows the 25-second hold', doseRendered > 0, doseRendered);"""

PLAN.append((G197, [
    (C_OLD_HDR, C_NEW_HDR, 'C header: name the correction'),
    (C_OLD_TAIL, C_NEW_TAIL, 'C1/C2 re-pointed at the blank row'),
]))

# ── FIX 3 ───────────────────────────────────────────────────────────────────────────
G193 = os.path.join(ROOT, 'gates', 'g193_budget_floor.js')

O_OLD = """// its own transcription. Sum must equal V192_NONOPT_CLASSES_WIDE['Leg isolation'] = 432,
// which is asserted on every run below.
const V192_RULED_DEL_WIDE = { bodyweight:72, minimal:72, home_basic:72, home_full:72, commercial:72, crossfit:72 };
{
  const s = Object.keys(V192_RULED_DEL_WIDE).reduce((a,k)=>a+V192_RULED_DEL_WIDE[k], 0);
  const t = RULED_DELETABLE.reduce((a,k)=>a+(V192_NONOPT_CLASSES_WIDE[k]||0), 0);
  if (s !== t) { console.error('ORACLE TYPO: V192_RULED_DEL_WIDE sums to ' + s + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + ']. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
  const miss = Object.keys(V192_RULED_DEL_WIDE).filter(k => typeof V192_RULED_DEL_WIDE[k] !== 'number');
  if (miss.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE has no number for ' + miss.join(', ')); process.exit(2); }
}"""

O_NEW = """// its own transcription. Each tier must equal V192_NONOPT_CLASSES_WIDE['Leg isolation']
// (432) divided over the six tiers, which is asserted PER TIER on every run below.
const V192_RULED_DEL_WIDE = { bodyweight:72, minimal:72, home_basic:72, home_full:72, commercial:72, crossfit:72 };
// ── THE GUARD IS PER TIER, NOT A SUM (V197 slice 5, gatekeeper) ──────────────────────
// It used to compare the SUM of the map above against the class census and nothing else.
// A sum check passes a COMPENSATING PAIR of typos: 71 on one tier and 73 on another still
// sums to 432, and B4 would then hold two tiers to numbers no one transcribed. Gatekeeper
// hand-verified the live values (72 on every one of the six tiers on the V192 artifact),
// so the table is right today; the guard is what stops it drifting.
// THE PER-TIER EXPECTATION IS DERIVED, AND THE DERIVATION IS WHY THIS IS NOT A SELF-CHECK:
//   (a) the WIDE lattice is BALANCED — 288 cells over 6 tiers, 48 apiece (asserted at L0);
//   (b) on V192 the leg_accessory pool was TIER-INVARIANT. The permissive _gear fallback
//       handed the all-machine pool back WHOLE on every tier — that is the accident D81's
//       note above names — so no tier could empty more or fewer 'Leg isolation' sections
//       than any other tier.
// Uniformity is therefore a FACT ABOUT V192, not an average taken over the table it is
// checking, and the per-tier value is the class total over the tier count. The derivation
// holds only while RULED_DELETABLE is the single D81 member; a second class has its own
// per-tier shape, so this block FAILS CLOSED until someone transcribes it per tier.
// Failure behaviour is unchanged: exit 2 with no PASS/FAIL summary, which sabotage.py
// reads as CRASH. A gate that cannot trust its oracle must not report a pass.
{
  const T = Object.keys(V192_RULED_DEL_WIDE);
  const miss = T.filter(k => typeof V192_RULED_DEL_WIDE[k] !== 'number');
  if (miss.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE has no number for ' + miss.join(', ')); process.exit(2); }
  const short = EQUIP.filter(e => T.indexOf(e) < 0);
  const extra = T.filter(k => EQUIP.indexOf(k) < 0);
  if (short.length || extra.length) { console.error('ORACLE INCOMPLETE: V192_RULED_DEL_WIDE must carry one number per lattice tier and no others — missing [' + short.join(', ') + '], unknown [' + extra.join(', ') + ']. A tier with no transcription cannot be subtracted from the baseline side.'); process.exit(2); }
  if (RULED_DELETABLE.length !== 1 || RULED_DELETABLE[0] !== 'Leg isolation') { console.error('ORACLE DERIVATION VOID: the per-tier expectation below is derived for the single D81 member \\'Leg isolation\\', whose V192 pool was tier-invariant. RULED_DELETABLE is now [' + RULED_DELETABLE.join(', ') + ']. Transcribe V192_RULED_DEL_WIDE per tier against the V192 artifact and re-derive this guard before any claim uses it.'); process.exit(2); }
  const t = RULED_DELETABLE.reduce((a,k)=>a+(V192_NONOPT_CLASSES_WIDE[k]||0), 0);
  if (t % EQUIP.length !== 0) { console.error('ORACLE TYPO: V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + '], which does not divide evenly across the ' + EQUIP.length + ' tiers of a balanced lattice. One of the two transcriptions of the same V192 fact is wrong and neither may be used.'); process.exit(2); }
  const per = t / EQUIP.length;
  const wrong = EQUIP.filter(e => V192_RULED_DEL_WIDE[e] !== per);
  if (wrong.length) { console.error('ORACLE TYPO (PER TIER): ' + wrong.map(e => e + '=' + V192_RULED_DEL_WIDE[e]).join(', ') + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + '] over ' + EQUIP.length + ' uniform tiers, i.e. ' + per + ' each. A SUM check let a compensating pair of typos through here; this one does not. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
  const s = T.reduce((a,k)=>a+V192_RULED_DEL_WIDE[k], 0);
  if (s !== t) { console.error('ORACLE TYPO: V192_RULED_DEL_WIDE sums to ' + s + ' but V192_NONOPT_CLASSES_WIDE says ' + t + ' for [' + RULED_DELETABLE.join(', ') + ']. The two transcriptions of the same V192 fact disagree; one of them is wrong and neither may be used.'); process.exit(2); }
}"""

PLAN.append((G193, [(O_OLD, O_NEW, 'V192 oracle guard: sum -> per tier')]))

# ── assert every anchor count==1 BEFORE any write ───────────────────────────────────
bad = 0
for p, edits in PLAN:
    src = rd(p)
    for a, _, label in edits:
        n = src.count(a)
        print('anchor %-3s %-46s %s' % (n, label, os.path.basename(p)))
        if n != 1:
            bad += 1
if bad:
    sys.stderr.write('ABORT: %d anchor(s) not count==1. Nothing written.\n' % bad)
    sys.exit(1)

# ── write ───────────────────────────────────────────────────────────────────────────
for p, edits in PLAN:
    src = rd(p)
    for a, b, label in edits:
        src = src.replace(a, b, 1)
    with io.open(p, 'w', encoding='utf-8') as f:
        f.write(src)
    print('wrote ' + p)

# index.html is untouched by design: this slice edits gate + spec only.
print('NOTE: index.html not in PLAN — slice 5 touches no artifact bytes.')
