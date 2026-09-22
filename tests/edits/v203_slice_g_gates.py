#!/usr/bin/env python3
# V203 slice G — gate + sabotage completion. Touches NO index.html.
#   G1  g203_ceiling_and_anchor.js: section 2d, the run_base ceiling rows (slice D's gap).
#   G2  g203_ceiling_and_anchor.js: a throw-safe wrapper on the 4b degenerate calls, so a
#       mutation that makes runAnchorSentence throw reports as a NAMED FAIL and not a CRASH.
#   G3  g203_mile_pencil.js: the D116 entry digest conjunct re-pointed at the era table.
# Every anchor asserted count==1 before any write; the first miss aborts the whole script.
import io, sys, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CEIL = os.path.join(ROOT, 'gates', 'g203_ceiling_and_anchor.js')
PENC = os.path.join(ROOT, 'gates', 'g203_mile_pencil.js')

def read(p):
    with io.open(p, encoding='utf-8') as f: return f.read()

def rep(src, old, new, label):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %s occurs %d times, expected 1' % (label, n))
    return src.replace(old, new)

# ── G1 ────────────────────────────────────────────────────────────────────────
ceil = read(CEIL)

RUNBASE = """// ── D117 / slice D: run_base ──────────────────────────────────────────────────
// Slice D re-pointed run_base's two steady ceilings at steadyCapSec(_row). Nothing
// pinned that until now: breaking either site moves run_base output while every NRC
// row above stays green.
//
// ORACLE, and it is the SAME hand table as section 1 — steadyCapSec is still never
// called here. run_base holds ONE chart row for the whole block (no race, no
// progression), so at a given mile anchor every easy card must print the midpoint of
// that row's Tempo and Recovery columns, longhand: round((tempo + recovery) / 2).
// Two anchors are swept so the expected number MOVES (598 vs 760); a constant would
// pass a gate that only looked at one.
//
// The second claim is the pairing. Each sentence prints the row's Recovery Pace as
// "Around X" and the ceiling as "do not run faster than Y", and BOTH come from _row.
// A ceiling computed off some OTHER row still looks like a pace, and the only thing
// that catches it is that it stops agreeing with the Recovery pace beside it.
function baseCards(row){
  const cfg = JSON.parse(JSON.stringify(IA.fixtures.HALF_MANNY));
  cfg.cardioGoals.run = { id:'run_base', label:'Build Running Base', baselineDist:'5', baseline:'5mi',
                          mileBestMins: row.mile.split(':')[0], mileBestSecs: row.mile.split(':')[1] };
  delete cfg.raceDate; cfg.primaryPath = 'test'; cfg.eventTargeted = false;
  const prog = IA.buildProgram(cfg);
  const out = [];
  Object.keys(prog.weeks).forEach(w => Object.keys(prog.weeks[w]).forEach(d => {
    const c = prog.weeks[w][d] && prog.weeks[w][d].cardio;
    if(!c) return;
    (Array.isArray(c) ? c : [c]).forEach(x => { if(x && x.type === 'run') out.push(x); });
  }));
  return out;
}
// The two sites are told apart by the sentence each one owns, never by subtype: the
// lsd_easy site also prints "Easy Run — Long" when the weekly budget override runs
// past 40 min, so subtype cannot separate them and a site-level claim needs to.
const IS_L_SITE = c => /This is the longest run of your week/.test(String(c.detail));            // _steadySecL
const IS_E_SITE = c => /Distance is not the goal; time on feet is\\./.test(String(c.detail));     // _steadySec
const BASE_TAIL = cap => 'do not run faster than ' + cap + '.';
const AROUND    = c => (String(c.detail).match(/Around (\\d+:\\d\\d\\/mi) is right for you/) || [])[1];
const CAPSTR    = c => (String(c.detail).match(/do not run faster than (\\d+:\\d\\d\\/mi)\\./) || [])[1];

const baseCaps = [];
[ROWS[0], ROWS[1]].forEach(r => {
  console.log('\\n2d. slice D: run_base reads the ceiling through steadyCapSec — mile ' + r.mile
              + ' (expected ceiling ' + r.capStr + ', Around ' + paceStr(r.recovery) + ')');
  const all = baseCards(r);
  const L = all.filter(IS_L_SITE), E = all.filter(IS_E_SITE);
  baseCaps.push(r.mile + ':' + L.concat(E).map(CAPSTR).join('|'));

  ok('mile ' + r.mile + ' _steadySecL site emits cards (' + L.length + ')', L.length > 0);
  ok('mile ' + r.mile + ' _steadySec site emits cards (' + E.length + ')',  E.length > 0);
  ok('mile ' + r.mile + ' the two sites are disjoint (no card answers to both sentences)',
     all.filter(c => IS_L_SITE(c) && IS_E_SITE(c)).length === 0);

  // ── _steadySecL (the long easy run) ──
  ok('mile ' + r.mile + ' _steadySecL: EVERY long easy run prints "' + BASE_TAIL(r.capStr) + '"',
     L.every(c => String(c.detail).indexOf(BASE_TAIL(r.capStr)) >= 0),
     JSON.stringify(L.map(CAPSTR)));
  ok('mile ' + r.mile + ' _steadySecL: EVERY long easy run carries dose.cap = ' + r.cap,
     L.every(c => c.dose && c.dose.cap === r.cap), JSON.stringify(L.map(c => c.dose && c.dose.cap)));
  ok('mile ' + r.mile + ' _steadySecL: the Around pace is the SAME row\\'s Recovery (' + paceStr(r.recovery) + ')',
     L.every(c => AROUND(c) === paceStr(r.recovery)), JSON.stringify(L.map(AROUND)));

  // ── _steadySec (the week's other easy runs) ──
  ok('mile ' + r.mile + ' _steadySec: EVERY easy run prints "' + BASE_TAIL(r.capStr) + '"',
     E.every(c => String(c.detail).indexOf(BASE_TAIL(r.capStr)) >= 0),
     JSON.stringify(E.map(CAPSTR)));
  ok('mile ' + r.mile + ' _steadySec: EVERY easy run carries dose.cap = ' + r.cap,
     E.every(c => c.dose && c.dose.cap === r.cap), JSON.stringify(E.map(c => c.dose && c.dose.cap)));
  ok('mile ' + r.mile + ' _steadySec: the Around pace is the SAME row\\'s Recovery (' + paceStr(r.recovery) + ')',
     E.every(c => AROUND(c) === paceStr(r.recovery)), JSON.stringify(E.map(AROUND)));

  // the benchmark run is the run_base card that must carry NO ceiling at all (V158)
  const bench = all.filter(c => /^Benchmark Run/.test(c.subtype));
  ok('mile ' + r.mile + ' run_base emits benchmark runs (' + bench.length + ')', bench.length > 0);
  ok('mile ' + r.mile + ' NO benchmark run carries a ceiling or a dose.cap',
     bench.every(c => !CAPSTR(c) && (!c.dose || c.dose.cap === undefined)),
     JSON.stringify(bench.map(c => [c.subtype, c.dose && c.dose.cap])));
});

console.log('\\n2e. run_base non-vacuity: the expected ceiling MOVED with the anchor');
ok('the two anchors do not produce the same run_base ceilings', baseCaps[0] !== baseCaps[1],
   JSON.stringify(baseCaps));
ok('8:00 run_base cards print 9:58/mi and 10:30 run_base cards print 12:40/mi',
   baseCaps[0].indexOf('9:58/mi') > 0 && baseCaps[0].indexOf('12:40/mi') < 0
   && baseCaps[1].indexOf('12:40/mi') > 0 && baseCaps[1].indexOf('9:58/mi') < 0,
   JSON.stringify(baseCaps));

// ── D118 ──────────────────────────────────────────────────────────────────────
"""

ceil = rep(ceil, "// ── D118 ──────────────────────────────────────────────────────────────────────\n", RUNBASE, 'D118 section header')

# ── G2 ────────────────────────────────────────────────────────────────────────
# A mutation that makes the edited branch throw must report as a NAMED FAIL, never as a
# CRASH: a gate that dies reports nothing, and nothing is not "no failures".
ceil = rep(ceil,
"""const degen = sentence(A({ kind:'edited', wk:4, from:null }));""",
"""// A throw is a FAILURE of these rows, not a reason for the gate to die (a crashed gate
// reports nothing, and nothing is never a pass). The marker can satisfy no row below.
function say(a){ try { return sentence(a); } catch(e){ return 'THREW ' + (e && e.message); } }
const degen = say(A({ kind:'edited', wk:4, from:null }));""",
'4b degen call')

ceil = rep(ceil,
"""const degen2 = sentence(A({ kind:'edited', wk:0, from:undefined }));""",
"""const degen2 = say(A({ kind:'edited', wk:0, from:undefined }));""",
'4b degen2 call')

ceil = rep(ceil,
"""ok('edited with no from does NOT print "no mile time was entered"', degen.indexOf('no mile time was entered') < 0, degen);""",
"""ok('edited with no from does NOT print "no mile time was entered"', degen.indexOf('no mile time was entered') < 0, degen);
ok('edited with no from RENDERS (the sentence did not throw)', degen.indexOf('THREW') !== 0, degen);""",
'4b no-mile-time row')

with io.open(CEIL, 'w', encoding='utf-8') as f: f.write(ceil)
print('WROTE ' + CEIL)

# ── G3 ────────────────────────────────────────────────────────────────────────
penc = read(PENC)
penc = rep(penc,
"""// The pin is the SLICE-C ENTRY digest, not the era row. V203 slices A and B moved
// HALF_MANNY off the shipped V202 row (d4364dd3fa63a3a1 -> 7d4f7ed45cc5bd53) by
// ruling; D116 is UI and cfg-write only and must move it no further. The literal
// below is that entry digest, read off the pre-slice-C artifact and typed here.
// OWED, and NOT this gate's to write: a MANNY_DIGEST_BY_VERSION[203] LITERAL row
// for the A+B move (standing ruling 5). Whoever assembles the final V203 slice
// adds it and re-points this conjunct at the era table.
const D116_ENTRY_DIGEST = '7d4f7ed45cc5bd53';""",
"""// V203 slices A and B moved HALF_MANNY off the shipped V202 row by ruling
// (d4364dd3fa63a3a1 -> 7d4f7ed45cc5bd53); D116 is UI and cfg-write only and must move
// it no further. That post-A+B digest is now a LITERAL row in the era table
// (MANNY_DIGEST_BY_VERSION[203], standing ruling 5), so the pin reads the era row
// instead of carrying a second copy of the same sixteen bytes. Two copies of one
// digest is exactly the duplication the ceiling ruling exists to kill, and the copy
// that drifts is always the one a gate keeps privately. Row existence is a CONJUNCT
// below, so a missing row fails loudly rather than making this comparison vacuous.
const D116_ENTRY_DIGEST = H.MANNY_DIGEST_BY_VERSION[IA.version];""",
'D116_ENTRY_DIGEST literal')

penc = rep(penc,
"""eq('HALF_MANNY digest unmoved by D116', H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), D116_ENTRY_DIGEST);""",
"""eq('HALF_MANNY digest unmoved by D116 (pinned to the V' + IA.version + ' era row)',
   H.progDigest(IA.buildProgram(IA.fixtures.HALF_MANNY)), D116_ENTRY_DIGEST);""",
'D116 digest eq row')

with io.open(PENC, 'w', encoding='utf-8') as f: f.write(penc)
print('WROTE ' + PENC)
