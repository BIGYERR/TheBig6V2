#!/usr/bin/env python3
# V208 slice 4f — V208's own D103a gates brought to the renamed state (slice 4a). Test files ONLY:
# tests/gates/g208_d103a_chip.js, g208_d103a_key.js, g208_d103a_readers.js and the chip spec
# tests/sabotage/v208_d103a_chip.json. index.html is not touched; v208_d103a.json is read, never written.
# These gates run only at ia-version >= 208 and were written (slices 1-3) before the rename, so there is
# no era split inside them: the ruled V208 state replaces the slice 3 expectation.
#   chip:    keyed chi LI, int SI, trial TEST, every other key its label's V207 code. Unkeyed run
#            strings: "long interval"/"(li)"/"continuous high" LI, "short interval"/"(si)"/"(int)" SI,
#            bare "interval" INT. Bike and swim keep CHI and INT (new row A3, hand table). The baseline
#            rows B3 and D1 read the label V207 printed for the same session (hand table of the rename),
#            and B3 admits exactly the three ruled moves. B4 relabels a keyed CHI or INT to the OTHER
#            quality run's name, either era, so a label reader reads the wrong class.
#   key:     K2's hand table carries the renamed heads (prefix: Taper and re-entry forms included);
#            new row K2b proves the lattice reaches the plain and the Taper form of both.
#   readers: I2 compares a keyed INT or CHI with the baseline's reading of the card V207 printed for
#            that KEY (the key's V207 head, suffix kept); I3 also runs that V207 card with the key
#            stripped, the frozen path it exercised before the rename.
#   spec:    S1, S3 and S4 re-anchored on slice 4a's runSessionCode, dayCode and _doseStripHTML lines
#            (they were NOT-APPLIED); S1b, S1c and S5 added for A3, the frozen INT token and the key map.
# Every anchor asserted count==1 (gate anchors in the gate file, spec anchors in index.html); every
# file is planned in memory and nothing is written unless every anchor in every file hit.
import sys, json
R = '/Users/CanasBangin/Desktop/TheBig6V2/'
G = R + 'tests/gates/'

CHIP = [
 (r'''// brief wrote it, reclassifies NRC "Speed Run — Tempo" from Interval to Tempo; D1 pins that every
// label printed today keeps its class.
''',
  r'''// brief wrote it, reclassifies NRC "Speed Run — Tempo" from Interval to Tempo; D1 pins that every
// label printed today keeps its class.
//
// SLICE 4a (the LI/SI rename; these rows updated at slice 4f). The chips moved with the names. At
// V208 the ruled chip is: keyed chi LI, keyed int SI, trial TEST, every other key its label's V207
// code. Unkeyed run strings: "long interval", "(li)" and a frozen "continuous high" read LI; "short
// interval", "(si)" and a frozen "(int)" read SI; a bare "interval" (NRC "Speed Run — Intervals")
// keeps INT. Bike and swim kept their CHI and INT names, so their chips keep CHI and INT (A3). The
// baseline rows B3 and D1 read the label V207 printed for the same session (V207_LABEL, a hand table
// of the rename), so the only moves they admit are the ruled ones.
'''),
 (r'''  {fam:'CHI', v207:'Continuous High Intensity (CHI)', v4:'Long Interval (LI)', chip:'CHI', cls:'Tempo'},
  {fam:'INT', v207:'Interval (INT)', v4:'Short Interval (SI)', chip:'INT', cls:'Interval'},
];
''',
  r'''  {fam:'CHI', v207:'Continuous High Intensity (CHI)', v4:'Long Interval (LI)', chip:'LI', cls:'Tempo'},
  {fam:'INT', v207:'Interval (INT)', v4:'Short Interval (SI)', chip:'SI', cls:'Interval'},
];
// The rename as a hand table (slice 4a): the label V207 printed for a run session printed today. The
// head moves; every suffix (Taper, re-entry) stays. Any other label is its own V207 label.
const V207_LABEL = s => String(s || '').replace(/^Long Interval \(LI\)/, 'Continuous High Intensity (CHI)').replace(/^Short Interval \(SI\)/, 'Interval (INT)');
'''),
 (r'''    if(CODE(lab) !== e.chip) bad.push('"' + lab + '" ' + CODE(lab));
''',
  r'''    for(const t of [undefined, 'run']) if(CODE(lab, null, t) !== e.chip) bad.push('"' + lab + '"' + (t ? ' (' + t + ')' : '') + ' ' + CODE(lab, null, t));
'''),
 (r'''  ok(`A2 ${e.fam}: both label eras class as ${e.cls} in the run history`, badC.length === 0, badC.join('; '));
}
''',
  r'''  ok(`A2 ${e.fam}: both label eras class as ${e.cls} in the run history`, badC.length === 0, badC.join('; '));
}
// A3 the rename is the run's only: a bike or swim CHI or INT (and its Taper form) keeps CHI or INT.
{ const bad = [];
  for(const t of ['bike', 'swim']) for(const sfx of ['', ' — Taper']) for(const [lab, w] of [['Continuous High Intensity (CHI)', 'CHI'], ['Interval (INT)', 'INT']])
    if(CODE(lab + sfx, null, t) !== w) bad.push(t + ' "' + lab + sfx + '" ' + CODE(lab + sfx, null, t));
  ok('A3 a bike or swim CHI or INT, plain or Taper, keeps its chip, CHI or INT (8 labels)', bad.length === 0, bad.join('; ')); }
'''),
 (r'''const want = c => keyOf(c) === 'trial' ? 'TEST' : todayChip(c.subtype);
''',
  r'''// V208 (slice 4a): the ruled chip of a keyed run. chi LI, int SI, trial TEST; every other key wears
// the V207 code for its label (steady STDY, bench TEST, long and easy EASY or LSD).
const KEYCHIP = {chi:'LI', int:'SI', trial:'TEST'};
const want = c => KEYCHIP[keyOf(c)] || todayChip(c.subtype);
'''),
 (r'''  ok(`B1 the day chip of every keyed NSW run is today's code for its label, the test TEST (''',
  r'''  ok(`B1 the day chip of every keyed NSW run is its ruled code, chi LI, int SI, the test TEST, every other key its label's V207 code ('''),
 (r'''    nsw.forEach(({c}) => { const a = chipDay(c), b = CB(c.subtype || ''); if(a !== b){ n++; const k = keyOf(c) + ': ' + b + ' -> ' + a; moved[k] = (moved[k] || 0) + 1; } });
    const onlyTrial = Object.keys(moved).every(k => /^trial: RUN -> TEST$/.test(k));
    ok(`B3 against the baseline, the only printed chip that moves is the test's, RUN to TEST (${n} moved: ${Object.keys(moved).map(k => k + ' x' + moved[k]).join(', ') || 'none'})`, onlyTrial && (moved['trial: RUN -> TEST'] || 0) > 0, JSON.stringify(moved)); }
''',
  r'''    nsw.forEach(({c}) => { const a = chipDay(c), b = CB(V207_LABEL(c.subtype)); if(a !== b){ n++; const k = keyOf(c) + ': ' + b + ' -> ' + a; moved[k] = (moved[k] || 0) + 1; } });
    const RULED = ['trial: RUN -> TEST', 'chi: CHI -> LI', 'int: INT -> SI'];
    ok(`B3 against the baseline reading the label V207 printed, the only chips that move are the ruled three: the test RUN to TEST, the CHI to LI, the INT to SI (${n} moved: ${Object.keys(moved).map(k => k + ' x' + moved[k]).join(', ') || 'none'})`,
       Object.keys(moved).every(k => RULED.includes(k)) && RULED.every(k => (moved[k] || 0) > 0), JSON.stringify(moved)); }
'''),
 (r'''  // a keyed quality run wears its key's chip whatever it is named (the rename, and a label no scan knows)
  const badR = []; let nr = 0;
  nsw.filter(({c}) => keyOf(c) === 'int' || keyOf(c) === 'chi').forEach(({c}) => { for(const lab of (keyOf(c) === 'chi' ? ['Long Interval (LI)', 'Zqx Session (ZQX)'] : ['Short Interval (SI)', 'Zqy Session (ZQY)'])){
    nr++; const r = clone(c); r.subtype = lab; const a = chipDay(r), b = chipStrip(r), w = keyOf(c).toUpperCase(); if(a !== w || b !== w) badR.push(keyOf(c) + ' as "' + lab + '" day ' + a + ' strip ' + b); } });
  ok(`B4 a keyed INT or CHI relabelled (the slice 4 name, and a name no scan knows) keeps its chip on the day and on the strip (${nr} relabels)`, nr > 0 && badR.length === 0, badR.length + ': ' + badR.slice(0, 3).join('; '));
''',
  r'''  // a keyed quality run wears its key's chip whatever it is named: the OTHER quality run's name in
  // either era (a label reader would print the wrong class), and a label no scan knows
  const badR = []; let nr = 0;
  const RELABEL = {chi:['Short Interval (SI)', 'Interval (INT)', 'Zqx Session (ZQX)'], int:['Long Interval (LI)', 'Continuous High Intensity (CHI)', 'Zqy Session (ZQY)']};
  nsw.filter(({c}) => keyOf(c) === 'int' || keyOf(c) === 'chi').forEach(({c}) => { for(const lab of RELABEL[keyOf(c)]){
    nr++; const r = clone(c); r.subtype = lab; const a = chipDay(r), b = chipStrip(r), w = KEYCHIP[keyOf(c)]; if(a !== w || b !== w) badR.push(keyOf(c) + ' as "' + lab + '" day ' + a + ' strip ' + b); } });
  ok(`B4 a keyed CHI or INT relabelled to the other quality run's name (either era) or a name no scan knows keeps its key's chip, LI or SI, on the day and on the strip (${nr} relabels)`, nr > 0 && badR.length === 0, badR.length + ': ' + badR.slice(0, 3).join('; '));
'''),
 (r'''  cards.filter(({c}) => c.type === 'run').forEach(({c}) => { const s = c.subtype || ''; if(seen.has(s)) return; seen.add(s); if(RC(s) !== RB(s)) moved.push('"' + s + '" ' + RB(s) + ' -> ' + RC(s)); });
  ok(`D1 every run label printed today keeps its history class (${seen.size} distinct run subtypes)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
''',
  r'''  cards.filter(({c}) => c.type === 'run').forEach(({c}) => { const s = c.subtype || ''; if(seen.has(s)) return; seen.add(s); const o = V207_LABEL(s); if(RC(s) !== RB(o)) moved.push('"' + s + '" (V207 "' + o + '") ' + RB(o) + ' -> ' + RC(s)); });
  ok(`D1 every run label printed today keeps the history class the baseline gives the label V207 printed for it, so no history splits across the rename (${seen.size} distinct run subtypes)`, seen.size > 0 && moved.length === 0, moved.length + ': ' + moved.slice(0, 3).join('; ')); }
'''),
]

KEY = [
 (r'''//   K2  dose.key equals the hand table on 100% of NSW run cards.
''',
  r'''//   K2  dose.key equals the hand table on 100% of NSW run cards.
//   K2b the table's renamed heads (slice 4a) are reached plain and Taper, so K2 reads every row.
'''),
 (r'''if(VER < ERA){ ['K0','K1','K2','K3','K4','K5'].forEach(''',
  r'''if(VER < ERA){ ['K0','K1','K2','K2b','K3','K4','K5'].forEach('''),
 (r'''  if(/^Interval \(INT\)/.test(s)) return 'int';
  if(/^Continuous High Intensity \(CHI\)/.test(s)) return 'chi';
''',
  r'''  // V208 slice 4a renamed the INT and the CHI. This gate runs only at >= 208, so the table carries
  // the ruled names. Prefix match: the Taper and re-entry forms keep the head.
  if(/^Short Interval \(SI\)/.test(s)) return 'int';
  if(/^Long Interval \(LI\)/.test(s)) return 'chi';
'''),
 (r'''ok(`K3 NRC run, bike and swim cards carry no key''',
  r'''{ const F = {'Long Interval (LI)':0, 'Long Interval (LI) — Taper':0, 'Short Interval (SI)':0, 'Short Interval (SI) — Taper':0};
  built.forEach(p => { if(p) cardsOf(p).forEach(({c}) => { if(c.type === 'run' && !c.isNRC && NSW.has(c.goalId) && Object.prototype.hasOwnProperty.call(F, c.subtype)) F[c.subtype]++; }); });
  ok(`K2b the renamed heads are reached in both forms, so K2 reads them (${Object.keys(F).map(k => '"' + k + '" ' + F[k]).join(', ')})`, Object.values(F).every(n => n > 0), JSON.stringify(F)); }
ok(`K3 NRC run, bike and swim cards carry no key'''),
]

READERS = [
 (r'''// pre-slice tree; S3 runs only against the pre-slice tree (same ia-version as the candidate).
''',
  r'''// pre-slice tree; S3 runs only against the pre-slice tree (same ia-version as the candidate).
// SLICE 4f: after the LI/SI rename (slice 4a) the baseline no longer prints the candidate's label.
// I2 compares a keyed INT or CHI with the baseline's reading of the card V207 printed for that KEY
// (the key's V207 head, suffix kept); I3 also strips the key from that V207 card, the frozen path.
'''),
 (r'''  let n = 0; const bad = [], badB = [], badR = []; let nu = 0; const badU = [];
''',
  r'''  // the card V207 printed for this key: the key's V207 head, every suffix kept (hand table, slice 4a)
  const HEAD207 = {chi:'Continuous High Intensity (CHI)', int:'Interval (INT)'};
  const as207 = c => { const r = clone(c); r.subtype = String(r.subtype || '').replace(/^(Long Interval \(LI\)|Short Interval \(SI\))/, m => HEAD207[keyOf(c)] || m); return r; };
  let n = 0; const bad = [], badB = [], badR = []; let nu = 0, nu7 = 0; const badU = [];
'''),
 (r'''if(CB && v !== CB(c)) badB.push(k + ' ' + v + ' baseline ' + CB(c));
''',
  r'''if(CB && v !== CB(as207(c))) badB.push(k + ' ' + v + ' baseline ' + CB(as207(c)) + ' on "' + as207(c).subtype + '"');
'''),
 (r'''    if(CB){ nu++; const u = clone(c); delete u.dose.key; if(CI(u) !== CB(u)) badU.push(String(c.subtype) + ' ' + CI(u) + ' baseline ' + CB(u)); } }));
''',
  r'''    if(CB){ nu++; const u = clone(c); delete u.dose.key; if(CI(u) !== CB(u)) badU.push(String(c.subtype) + ' ' + CI(u) + ' baseline ' + CB(u));
      if(k === 'int' || k === 'chi'){ nu7++; const u7 = as207(c); delete u7.dose.key; if(CI(u7) !== CB(u7)) badU.push('as V207 "' + u7.subtype + '" ' + CI(u7) + ' baseline ' + CB(u7)); } } }));
'''),
 (r'''  else { ok(`I2 keyed INT and CHI equal the baseline's value on the same card (${n} cards)`, badB.length === 0, badB.length + ': ' + badB.slice(0, 3).join('; '));
         ok(`I3 unkeyed path: with dose.key stripped, every NSW run card reads the baseline's value (${nu} cards)`, nu > 0 && badU.length === 0, badU.length + ': ' + badU.slice(0, 3).join('; ')); }
''',
  r'''  else { ok(`I2 keyed INT and CHI equal the baseline's value on the card V207 printed for the same key (${n} cards)`, n > 0 && badB.length === 0, badB.length + ': ' + badB.slice(0, 3).join('; '));
         ok(`I3 unkeyed path: with dose.key stripped, every NSW run card reads the baseline's value as printed today (${nu} cards) and every INT and CHI reads it under its V207 label, the frozen path (${nu7} cards)`, nu > 0 && nu7 > 0 && badU.length === 0, badU.length + ': ' + badU.slice(0, 3).join('; ')); }
'''),
]

plans = {}
for f, eds in (('g208_d103a_chip.js', CHIP), ('g208_d103a_key.js', KEY), ('g208_d103a_readers.js', READERS)):
    s = open(G + f, encoding='utf-8').read()
    for a, b in eds:
        n = s.count(a)
        if n != 1:
            sys.exit('ABORT: %s anchor count=%d: %r — nothing written' % (f, n, a[:80]))
        s = s.replace(a, b, 1)
    plans[G + f] = s

# ── the chip spec ──────────────────────────────────────────────────────────────────
SPEC = R + 'tests/sabotage/v208_d103a_chip.json'
HTML = open(R + 'index.html', encoding='utf-8').read()
old = {m['name'].split(' ')[0]: m for m in json.load(open(SPEC, encoding='utf-8'))}
if sorted(old) != ['S1', 'S2', 'S3', 'S4']:
    sys.exit('ABORT: chip spec is not the slice 3 set S1-S4: %r — nothing written' % sorted(old))
GATE = 'gates/g208_d103a_chip.js'
new = [
 {"name": "S1 -> the LI fallback is dropped from runSessionCode: an unkeyed or frozen \"Long Interval (LI)\" falls to the generic interval test and wears INT, so a CHI renamed at slice 4 changes chip in the same program's history",
  "anchor": "  if(s.indexOf('long interval')>=0||s.indexOf('(li)')>=0) return 'LI';\n",
  "replacement": "",
  "gate": GATE,
  "note": "Re-anchored at slice 4f on slice 4a's line. NAMED TRIP: A1 CHI goes red (\"Long Interval (LI)\" and its forms read INT). A1 INT stays green (the SI line is intact), keyed rows read the key first, A3 reads bike and swim. EXPECTED: A1 CHI only."},
 {"name": "S1b -> the run guard on a frozen CHI is dropped: every \"continuous high\" reads LI, so a bike or swim CHI wears the run's new chip",
  "anchor": "  if(s.indexOf('continuous high')>=0) return run?'LI':'CHI';\n",
  "replacement": "  if(s.indexOf('continuous high')>=0) return 'LI';\n",
  "gate": GATE,
  "note": "Added at slice 4f. NAMED TRIP: A3 goes red on the four bike and swim CHI labels. A1 stays green (an untyped or run CHI already reads LI). C2 needs a baseline and prints SKIP under sabotage.py. EXPECTED: A3 only."},
 {"name": "S1c -> a frozen run's \"(int)\" token is no longer mapped: the V207 \"Interval (INT)\" falls to the bare interval test and wears INT, so an old INT and its renamed Short Interval (SI) wear two chips",
  "anchor": "  if(s.indexOf('(int)')>=0) return run?'SI':'INT';\n",
  "replacement": "",
  "gate": GATE,
  "note": "Added at slice 4f. NAMED TRIP: A1 INT goes red (the V207 era forms read INT). A3 stays green (a bike or swim INT reads INT through the bare interval test). EXPECTED: A1 INT only."},
 old['S2'],
 {"name": "S3 -> dayCode stops passing the key: the day chip falls back to the label, the test wears RUN again and a keyed CHI or INT relabelled to the other quality run's name wears the wrong chip",
  "anchor": "  else if(c){ bot=runSessionCode(c.subtype||'', c.dose&&c.dose.key, c.type); botColor=topColor; }\n",
  "replacement": "  else if(c){ bot=runSessionCode(c.subtype||'', undefined, c.type); botColor=topColor; }\n",
  "gate": GATE,
  "note": "Re-anchored at slice 4f on slice 4a's line (the card's type is still passed; only the key is dropped). NAMED TRIP: B1 goes red (test cards read RUN), B4 goes red on the day chip. B2 (the strip) stays green. B3 needs a baseline and prints SKIP under sabotage.py. EXPECTED: B1 B4."},
 {"name": "S4 -> _doseStripHTML stops passing the key: the planned strip on the log sheet names the test RUN (suppressed) and a relabelled keyed run loses its code",
  "anchor": "  const code=runSessionCode(sub||'', dose&&dose.key, sport);\n",
  "replacement": "  const code=runSessionCode(sub||'', undefined, sport);\n",
  "gate": GATE,
  "note": "Re-anchored at slice 4f on slice 4a's line (the sport is still passed; only the key is dropped). NAMED TRIP: B2 goes red (test strips carry no code), B4 goes red on the strip. B1 reads the day chip and stays green. EXPECTED: B2 B4."},
 {"name": "S5 -> the keyed chip map keeps the slice 3 codes: a keyed CHI prints CHI and a keyed INT prints INT under their new names",
  "anchor": "  var K={int:'SI', chi:'LI', steady:'STDY', bench:'TEST', trial:'TEST'};\n",
  "replacement": "  var K={int:'INT', chi:'CHI', steady:'STDY', bench:'TEST', trial:'TEST'};\n",
  "gate": GATE,
  "note": "Added at slice 4f. NAMED TRIP: B1 and B2 go red on every keyed CHI and INT, B4 on every relabel. A rows read unkeyed strings and stay green. EXPECTED: B1 B2 B4."},
]
for m in new:
    n = HTML.count(m['anchor'])
    if n != 1:
        sys.exit('ABORT: spec %s anchor count=%d in index.html — nothing written' % (m['name'].split(' ')[0], n))
plans[SPEC] = json.dumps(new, indent=2, ensure_ascii=False) + '\n'

for p, s in plans.items():
    open(p, 'w', encoding='utf-8').write(s)
print('written:', ', '.join(p.replace(R, '') for p in plans))
# Follow-up in the same slice (applied by hand after the sabotage proof, recorded here): in
# tests/sabotage/v208_d103a_readers.json, M2's note said "I1-I3 stay green ... EXPECTED: I4 only".
# Against the renamed tree M2 trips I1 as well (every real CHI is named Long Interval (LI), so the
# label-only scan reads 1.4 against the hand 1.05). The note now reads "EXPECTED: I1 I4". Anchor,
# replacement and gate unchanged.
