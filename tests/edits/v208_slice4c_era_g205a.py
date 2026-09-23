#!/usr/bin/env python3
# V208 slice 4c — era rows for the D103a run-card rename in four g205 gates.
#
# D103a (V208 slice 4a) renamed the NSW quality runs: "Continuous High Intensity (CHI)"
# is now "Long Interval (LI)", "Interval (INT)" is now "Short Interval (SI)", and every
# NSW run card is stamped dose.key (int / chi / steady / long / easy / bench / trial).
# Bike and swim keep CHI / INT and carry no key. Engine scheduling is unchanged.
#
# Standing ruling 4: each gate gets RUN_CARD_ERAS. The <=207 row keeps the gate's own old
# name regexes byte for byte (so V207 reads exactly as before). The >=208 row reads the
# card by dose.key and a new row E1 (>=208 only) requires the NSW name to agree with the
# key on every run card read, so nothing the old name check defended is dropped. A
# version matching no row (or two) is a named FAIL (E0).
#
# Test files ONLY. index.html is not touched and there is no version bump in this slice.
# All anchors are asserted count==1 in memory across all four files before any file is
# written; the first miss aborts the whole script and nothing is written.
import sys, pathlib

ROOT = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests/gates')

def era_block(int_old, chi_old, int_new, chi_new):
    return (
"""// ── ERA ROWS: how a run card names its quality session (standing ruling 4) ───────────
// Keyed to the RULING, D103a, which ships on ia-version 208, not to the version this gate
// shipped on. Through 207 the two NSW quality runs are named "Interval (INT)" and
// "Continuous High Intensity (CHI)" and carry no key, so a card is read by its name.
// From 208 the same two cards are named "Short Interval (SI)" and "Long Interval (LI)" and
// every NSW run card carries dose.key; a card is read by its key (int / chi), and E1
// requires its NSW name to agree with that key on every run card read, so every claim
// below is still about the named card the athlete sees. D103a moved words, not days: no
// expectation in this file changes with the era. A version with no row is a named FAIL.
const RUN_CARD_ERAS = [
  { hi: 207, name: { int: """ + int_old + """, chi: """ + chi_old + """ }, key: null },
  { lo: 208, name: { int: """ + int_new + """, chi: """ + chi_new + """ }, key: { int: 'int', chi: 'chi' } }
];
const CARD_ROWS = RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi));
if(CARD_ROWS.length !== 1){
  ok('E0 ia-version ' + VER + ' reads its run cards through exactly one era row', false, CARD_ROWS.length + ' rows match');
  summary(1);
}
const CARD = CARD_ROWS[0];
console.log('NOTE run cards read through the ' + (CARD.key ? '208+ row (D103a names, dose.key)' : '207- row (INT / CHI names)'));
let cardsRead = 0, cardSplit = 0; const cardSplitAt = [];
function runQuality(c){
  const s = String(c.subtype || '');
  const byName = CARD.name.int.test(s) ? 'int' : CARD.name.chi.test(s) ? 'chi' : null;
  if(!CARD.key) return byName;
  const k = c.dose && c.dose.key;
  const byKey = k === CARD.key.int ? 'int' : k === CARD.key.chi ? 'chi' : null;
  cardsRead++;
  if(byKey !== byName){ cardSplit++; if(cardSplitAt.length < 4) cardSplitAt.push(s + ' key=' + k); }
  return byKey;
}

""")

E1_BLOCK = (
"""// ── E1 the 208+ row reads the key, and the key must say what the name says ──────────
if(CARD.key) ok('E1 every run card read at ia-version ' + VER + ' names the same quality session in its NSW name and its dose.key (' + cardsRead + ' run cards)',
  cardsRead > 0 && cardSplit === 0, cardSplit + ' disagree: ' + cardSplitAt.join(' | '));
""")

EDITS = {
  'g205_d125_ceiling.js': [
    # 1. era rows, after the version predicate
    ("// ── the calendar and the doctrine, written here",
     era_block(r"/Interval \(INT\)/", r"/Continuous High Intensity \(CHI\)/",
               r"/Short Interval \(SI\)/", r"/Long Interval \(LI\)/")
     + "// ── the calendar and the doctrine, written here"),
    # 2. runLayout reads through the era row
    ("""      const s = String(c.subtype || '');
      if(/Interval \\(INT\\)/.test(s)) lay[d] = 'int';
      else if(/Continuous High Intensity \\(CHI\\)/.test(s)) lay[d] = 'chi';
      else if(/Long Slow Distance \\(LSD\\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';""",
     """      const s = String(c.subtype || '');
      const q = runQuality(c);
      if(q) lay[d] = q;
      else if(/Long Slow Distance \\(LSD\\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';"""),
    # 3. E1 before the summary
    ("\nsummary(fail ? 1 : 0);\n", "\n" + E1_BLOCK + "summary(fail ? 1 : 0);\n"),
  ],
  'g205_d125_spaced.js': [
    ("// ── the calendar, written here",
     era_block(r"/^Interval/", r"/^Continuous High Intensity/",
               r"/^Short Interval \(SI\)/", r"/^Long Interval \(LI\)/")
     + "// ── the calendar, written here"),
    ("""      const st = s.subtype || '';
      if(/^Interval/.test(st)) out[d] = 'int';
      else if(/^Continuous High Intensity/.test(st)) out[d] = 'chi';
      else if(/^Long Slow Distance/.test(st))""",
     """      const st = s.subtype || '';
      const q = runQuality(s);
      if(q) out[d] = q;
      else if(/^Long Slow Distance/.test(st))"""),
    ("\nsummary(fail ? 1 : 0);\n", "\n" + E1_BLOCK + "summary(fail ? 1 : 0);\n"),
  ],
  'g205_d130_typed.js': [
    # typed has no summary(); give E0 the same loud exit the other three get
    ("// ── hand-written circular week",
     "function summary(code){ console.log('PASS '+P+' FAIL '+F); process.exit(code); }\n"
     + era_block(r"/^Interval \(INT\)/", r"/^Continuous High Intensity \(CHI\)/",
                 r"/^Short Interval \(SI\)/", r"/^Long Interval \(LI\)/")
     + "// ── hand-written circular week"),
    ("""cs.forEach(c=>{if(c.type!=='run')return;runs.push(d);const st=c.subtype||'';
            if(/^Interval \\(INT\\)/.test(st))tb[d]='int';
            else if(/^Continuous High Intensity \\(CHI\\)/.test(st))tb[d]='chi';
            else if(c.legLoad)""",
     """cs.forEach(c=>{if(c.type!=='run')return;runs.push(d);const q=runQuality(c);
            if(q)tb[d]=q;
            else if(c.legLoad)"""),
    ("\nconsole.log('PASS '+P+' FAIL '+F);\nprocess.exit(F?1:0);",
     "\n" + E1_BLOCK + "console.log('PASS '+P+' FAIL '+F);\nprocess.exit(F?1:0);"),
  ],
  'g205_d132_walkweek.js': [
    # header oracle claim, kept true across the era
    ("""//     card is identified by its NSW subtype text, which is doctrine, not engine state.
""",
     """//     card is identified by its NSW subtype text, which is doctrine, not engine state.
//     From ia-version 208 (D103a) a RUN card is read by its dose.key and E1 holds its NSW
//     name to that key; bike and swim cards keep their names. See ERA ROWS below.
"""),
    ("// ── the calendar, the doctrine and the lattice, all written here",
     era_block(r"/Interval \(INT\)/", r"/Continuous High Intensity \(CHI\)/",
               r"/Short Interval \(SI\)/", r"/Long Interval \(LI\)/")
     + "// Bike and swim cards were not renamed by D103a and carry no key; they keep the\n"
     + "// names they have always had, in every era.\n"
     + "const BIKE_SWIM_CARD = { int: /Interval \\(INT\\)/, chi: /Continuous High Intensity \\(CHI\\)/ };\n\n"
     + "// ── the calendar, the doctrine and the lattice, all written here"),
    # scanWeek: run cards through the era row, bike/swim by their unchanged names
    ("""// Read a built week's CARDIO by content. The NSW card names are doctrine text: an
// Interval card says "Interval (INT)" and a continuous high-intensity card says
// "Continuous High Intensity (CHI)". A walking week says neither.
""",
     """// Read a built week's CARDIO by content. The NSW card names are doctrine text: an
// Interval card says "Interval (INT)" and a continuous high-intensity card says
// "Continuous High Intensity (CHI)". A walking week says neither. From 208 the run cards
// say "Short Interval (SI)" and "Long Interval (LI)" and are read through the era row.
"""),
    ("""      n++;
      const s = String(c.subtype || '');
      if(/Interval \\(INT\\)/.test(s)) hasInt = true;
      if(/Continuous High Intensity \\(CHI\\)/.test(s)) hasChi = true;""",
     """      n++;
      const s = String(c.subtype || '');
      const q = c.type === 'run' ? runQuality(c)
              : BIKE_SWIM_CARD.int.test(s) ? 'int' : BIKE_SWIM_CARD.chi.test(s) ? 'chi' : null;
      if(q === 'int') hasInt = true;
      if(q === 'chi') hasChi = true;"""),
    ("""      const s = String(c.subtype || '');
      if(/Interval \\(INT\\)/.test(s)) lay[d] = 'int';
      else if(/Continuous High Intensity \\(CHI\\)/.test(s)) lay[d] = 'chi';
      else if(/Long Slow Distance \\(LSD\\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';""",
     """      const s = String(c.subtype || '');
      const q = runQuality(c);
      if(q) lay[d] = q;
      else if(/Long Slow Distance \\(LSD\\)/.test(s)) lay[d] = c.legLoad ? 'lsd_long' : 'lsd_easy';"""),
    ("\nsummary(fail ? 1 : 0);\n", "\n" + E1_BLOCK + "summary(fail ? 1 : 0);\n"),
  ],
}

out = {}
for fname, edits in EDITS.items():
    p = ROOT / fname
    src = p.read_text(encoding='utf-8')
    for i, (old, new) in enumerate(edits, 1):
        n = src.count(old)
        if n != 1:
            print('ABORT %s edit %d: anchor count %d (want 1): %r' % (fname, i, n, old[:80]))
            sys.exit(1)
        src = src.replace(old, new, 1)
    out[p] = src

for p, src in out.items():
    p.write_text(src, encoding='utf-8')
    print('wrote', p.name)
