#!/usr/bin/env python3
# V208 slice 4d — D103a era rows in the second g205/g206 set: g205_pace_eve, g205_chi_table6,
# g205_d114_int_table6, g206_d137_runbase_chi. Test files ONLY (index.html untouched, no meta bump).
# Standing ruling 4: every row that finds a run card by its quality label reads a table keyed on
# ia-version. At or below 207 the old strings, byte for byte where the old matcher was a bare regex;
# at 208 and above the D103a strings, Long Interval (LI) for the CHI and Short Interval (SI) for the
# INT. The first row opens where the gate's own predicate lets rows run (204, the pre-bump working
# artifact, for the g205 gates; 206 for D137). An artifact no row covers fails a named P-ERA/ERA row
# and its matchers match nothing. Bike and swim matchers are not touched: their labels did not move.
# g205_pace_eve also gains P2z, the vacuity guard for its hand shape: under the rename the old
# regex saw no speed day, P2 still passed on a shape with no speed terms, and nothing said so.
# Every anchor asserted count==1; all four files are planned in memory and written only if every
# anchor in every file hit.
import sys
G = '/Users/CanasBangin/Desktop/TheBig6V2/tests/gates/'

HEAD = r'''// ── D103a (V208) ERA ROWS for the run builder's quality labels (standing ruling 4) ──
// The CHI and the INT were renamed Long Interval (LI) and Short Interval (SI) at V208 (coach,
// D103a slice 4a). Bike and swim keep CHI and INT, so no bike or swim matcher reads this table.
// An artifact no row covers fails the ERA row below, and its matchers match nothing, so every
// row that finds a card by label goes red with it.
'''

EDITS = {
 'g205_pace_eve.js': [
  (r'''  console.log('NOTE ia-version ' + VER + ' with the D127 branch present: pre-bump working artifact, rows RUN');
}
''',
   r'''  console.log('NOTE ia-version ' + VER + ' with the D127 branch present: pre-bump working artifact, rows RUN');
}

''' + HEAD + r'''// handShape, P2z, P6f, P6g and P6h read it. Both matchers anchor at the start of the subtype and
// admit the ' — Taper' suffix. The first row opens at 204, the pre-bump artifact the predicate
// above lets run.
const RUN_LABEL_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'pre-D103a',    int: /^Interval \(INT\)/,      chi: /^Continuous High Intensity \(CHI\)/ },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0]
  || { ruling: 'NO ROW', int: /(?!)/, chi: /(?!)/ };
ok('P-ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run quality labels have no ruled text at this version, so every row that finds a card by label is void');
'''),
  (r'''      if(/^(Interval \(INT\)|Continuous High Intensity \(CHI\))/.test(st)) speed.add(d);
''',
   r'''      if(LBL.int.test(st) || LBL.chi.test(st)) speed.add(d);
'''),
  (r'''      weeks++; byDays[nTrain].weeks++;
      if(!sh) return;
''',
   r'''      weeks++; byDays[nTrain].weeks++;
      if(!sh) return;
      shaped++; if(!sh.speed.size) speedless++;
'''),
  (r'''let couldHaveHit = 0;
''',
   r'''let couldHaveHit = 0;
let shaped = 0, speedless = 0;
'''),
 ],
 'g205_chi_table6.js': [
  (r'''  for(const r of ROWS) skipRow(r + ' skipped below the D128 era');
  summary(0);
}
''',
   r'''  for(const r of ROWS) skipRow(r + ' skipped below the D128 era');
  summary(0);
}

''' + HEAD + r'''// chiCardsOf reads it (T11, T13). The pre-D103a row is the old matcher byte for byte. The swim
// matcher in T12 is not on this table: the swim CHI kept its name.
const RUN_LABEL_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'pre-D103a',    chi: /CHI|Continuous High/i },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', chi: /Long Interval \(LI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => +VER >= r.from && +VER <= r.to)[0]
  || { ruling: 'NO ROW', chi: /(?!)/ };
ok('ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run CHI label has no ruled text at this version, so T11 and T13 are void');
'''),
  (r'''      if(!/CHI|Continuous High/i.test(String(c.subtype || c.type || ''))) return;
      out.push({w:+w, detail:String(c.detail || '').replace(/\s+/g, ' ')});
''',
   r'''      if(!LBL.chi.test(String(c.subtype || c.type || ''))) return;
      out.push({w:+w, detail:String(c.detail || '').replace(/\s+/g, ' ')});
'''),
 ],
 'g205_d114_int_table6.js': [
  (r'''   + D114_ERA + '; this artifact is ' + VER + ')', HAS, String(HAS));
if(!HAS) summary(1);
''',
   r'''   + D114_ERA + '; this artifact is ' + VER + ')', HAS, String(HAS));
if(!HAS) summary(1);

''' + HEAD + r'''// T8a, T8 and T9 find Mario's INT cards by it. The pre-D103a row is the old matcher byte for byte.
const RUN_LABEL_BY_VERSION = [
  { from: 204, to: 207,      ruling: 'pre-D103a',    int: /INT/ },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', int: /Short Interval \(SI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => +VER >= r.from && +VER <= r.to)[0]
  || { ruling: 'NO ROW', int: /(?!)/ };
ok('ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run INT label has no ruled text at this version, so T8a, T8 and T9 are void');
'''),
  (r'''    if(c && /INT/.test(c.subtype || '')) cardReps.push(''',
   r'''    if(c && LBL.int.test(c.subtype || '')) cardReps.push('''),
 ],
 'g206_d137_runbase_chi.js': [
  (r'''  for(const r of ROWS) skipRow(r + ' skipped below the D137 era');
  summary();
}
''',
   r'''  for(const r of ROWS) skipRow(r + ' skipped below the D137 era');
  summary();
}

''' + HEAD + r'''// isRunCHI reads it (S4a, S4b, S4c). The Steady Aerobic Run matcher (S1, S3) is not on this
// table: run_base's quality card kept its name. The pre-D103a row is the old matcher byte for byte.
const RUN_LABEL_BY_VERSION = [
  { from: 206, to: 207,      ruling: 'pre-D103a',    chi: /Continuous High/i },
  { from: 208, to: Infinity, ruling: 'D103a (V208)', chi: /Long Interval \(LI\)/ },
];
const LBL = RUN_LABEL_BY_VERSION.filter(r => VER >= r.from && VER <= r.to)[0]
  || { ruling: 'NO ROW', chi: /(?!)/ };
ok('ERA a RUN_LABEL_BY_VERSION row covers ia-version ' + VER + ' (' + LBL.ruling + ')', LBL.ruling !== 'NO ROW',
   'the run CHI label has no ruled text at this version, so S4a, S4b and S4c are void');
'''),
  (r'''const isRunCHI = c => c.type === 'run' && /Continuous High/i.test(String(c.subtype || ''));
''',
   r'''const isRunCHI = c => c.type === 'run' && LBL.chi.test(String(c.subtype || ''));
'''),
 ],
}

# pace_eve rows that are not simple swaps: P2z (appended after P2's detail print) and the two
# P6 matchers. Kept in their own list so the anchors are visibly the old strings.
EDITS['g205_pace_eve.js'] += [
  (r'''if(costDetail.length) costDetail.forEach(x => console.log('     ' + x));
''',
   r'''if(costDetail.length) costDetail.forEach(x => console.log('     ' + x));
// P2z the vacuity guard for the hand shape (D103a slice 4d). P2's speed terms exist only if
// handShape can SEE a speed session. Under the V208 rename the old label regex saw none, the
// shape went speedless, and P2 still passed. Every shaped pace week carries INT and CHI (1408 of
// 1408 on V207), so a shaped week with no speed day means the matcher is blind.
ok('P2z the hand shape (' + LBL.ruling + ') sees a speed session in every one of the ' + shaped + ' shaped weeks, so P2 prices real speed days',
   shaped > 0 && speedless === 0, speedless + ' of ' + shaped + ' shaped weeks with no speed day');
'''),
  (r'''    cs.forEach(c => { if(c.type === 'run' && /^Continuous High Intensity/.test(c.subtype||'')) chiWk1++; }); });
''',
   r'''    cs.forEach(c => { if(c.type === 'run' && LBL.chi.test(c.subtype||'')) chiWk1++; }); });
'''),
  (r'''      if(/^Continuous High Intensity/.test(s)) hingeOnChi++;
      else if(!/^Interval/.test(s)) hingeOnSlow++;
''',
   r'''      if(LBL.chi.test(s)) hingeOnChi++;
      else if(!LBL.int.test(s)) hingeOnSlow++;
'''),
]

plans = {}
for f, eds in EDITS.items():
    s = open(G + f, encoding='utf-8').read()
    for a, b in eds:
        n = s.count(a)
        if n != 1:
            sys.exit('ABORT: %s anchor count=%d: %r — nothing written' % (f, n, a[:80]))
        s = s.replace(a, b, 1)
    plans[f] = s
for f, s in plans.items():
    open(G + f, 'w', encoding='utf-8').write(s)
print('era rows written to', ', '.join(plans))
