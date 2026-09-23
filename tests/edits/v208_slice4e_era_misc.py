#!/usr/bin/env python3
# V208 slice 4e — era rows for the D103a rename in g206_d109_copy and g207_test_week, and two
# sabotage entries (v208_d103a S4 key-table swap, v208_shakeout S3 B4 drops INT/CHI limbs).
#
# D103a (coach-ruled, V208 slice 4a): run note heads "CHI:" -> "LI:", "INT:" -> "SI:" (bodies
# unchanged); run subtypes "Continuous High Intensity (CHI)" -> "Long Interval (LI)",
# "Interval (INT)" -> "Short Interval (SI)"; every NSW run card stamped dose.key. Bike and
# swim keep CHI / INT and carry no key.
#
#   g206_d109_copy   the sha-pinned table tests/measure/v206_d109_table.txt is NOT edited.
#                    Entries 20-22 (run builder) are superseded in the gate by a map keyed
#                    from 208, the shape D110a's plan uses for swim. At >=208 the LI:/SI: text
#                    must sit "@@ n" times and the D109 CHI:/INT: text 0 times.
#   g207_test_week   era rows (<=207 names, >=208 dose.key) + E1 (>=208: name agrees with key).
#                    isHard (D6, D7a, D8) and the D8 premise read through one cardQuality.
#
# Test files ONLY; index.html is read (anchor precondition) and never written. No version
# bump in this slice. Every anchor is asserted count==1 in memory before any file is written;
# the first miss aborts the whole script and nothing is written.
import sys, json, pathlib

T = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/tests')
IDX = pathlib.Path('/Users/CanasBangin/Desktop/TheBig6V2/index.html')

def die(msg):
    print('ABORT ' + msg); sys.exit(1)

# ── precondition: the two sabotage anchors exist exactly once in the current artifact ──
KEY_ANCHOR = "{lsd_long:'long', lsd_easy:'easy', chi:'chi', int:'int'}[sType]"
B4_ANCHOR = "(r.t === 'int' || r.t === 'chi' || r.t === 'lsd_long') && r !== _q"
idx = IDX.read_text(encoding='utf-8')
for a in (KEY_ANCHOR, B4_ANCHOR):
    if idx.count(a) != 1: die('index.html anchor count %d: %r' % (idx.count(a), a))

# ── g206_d109_copy ─────────────────────────────────────────────────────────────────────
D109_SUP = r"""// ── SUPERSEDED ENTRIES (standing ruling 4) ───────────────────────────────────
// The table file is D109's ruled record and its sha256 stays pinned: it is never edited. A
// later ruling that rewrites a string the table sited supersedes that entry HERE, keyed on
// the ia-version the later ruling ships on, and only in the builder it names. Below the row's
// version the table text stands. At and above it the superseding text must sit in the body
// exactly "@@ n" times, and both older texts (the table's old AND its D109 new) 0 times.
// D103a (V208, coach-ruled) renamed the NSW run heads: "CHI:" is "LI:" and "INT:" is "SI:",
// bodies unchanged. Bike and swim keep CHI: and INT:, so no bike or swim entry moves here.
// A row whose "was" is not the table's own new text is a named FAIL on that builder's T row:
// the table and the supersession would no longer describe the same string.
const TABLE_SUPERSEDED = [
  { from: 208, ruling: 'D103a', builder: 'run', entry: 20,
    was: 'CHI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.',
    now: 'LI: Zone 3-4 (85-95% max HR). Hard sustained effort at tempo pace.' },
  { from: 208, ruling: 'D103a', builder: 'run', entry: 21,
    was: 'INT: Pace moves ${pp._weeklyGain} seconds per mile each week.',
    now: 'SI: Pace moves ${pp._weeklyGain} seconds per mile each week.' },
  { from: 208, ruling: 'D103a', builder: 'run', entry: 22,
    was: 'INT: Zone 5 (95%+ max HR) on work efforts.',
    now: 'SI: Zone 5 (95%+ max HR) on work efforts.' }
];
const SUP_BAD = {};
if(ents){
  for(const s of TABLE_SUPERSEDED){
    if(!(VER >= s.from)) continue;
    const e = ents[s.entry - 1], rg = TABLE_RANGE[s.builder];
    if(!e || !rg || s.entry < rg[0] || s.entry > rg[1] || e.neu !== s.was){
      (SUP_BAD[s.builder] = SUP_BAD[s.builder] || []).push('#' + s.entry + ' (' + s.ruling + ') supersedes text the table does not hold');
      continue;
    }
    ents[s.entry - 1] = { n: e.n, old: e.old, neu: s.now, gone: [s.was], by: s.ruling };
  }
}

"""

D109 = [
    ('// becomes "INT:", "CHI — Continuous High Intensity:" becomes "CHI:").\n',
     '// becomes "INT:", "CHI — Continuous High Intensity:" becomes "CHI:").\n'
     '// D103a (V208) renamed the RUN builder\'s heads again ("CHI:" is "LI:", "INT:" is "SI:");\n'
     '// see SUPERSEDED ENTRIES. The ruled table file is not edited.\n'),
    ('// ── S and T rows ─', D109_SUP + '// ── S and T rows ─'),
    ("""    const nNew = b.text.split(e.neu).length - 1, nOld = b.text.split(e.old).length - 1;
    want += e.n;
    if(nNew !== e.n || nOld !== 0) tBad.push('#' + k + ' new ' + nNew + '/' + e.n + ' old ' + nOld);
  }
""",
     """    const nNew = b.text.split(e.neu).length - 1, nOld = b.text.split(e.old).length - 1;
    const nGone = (e.gone || []).reduce((a, g) => a + b.text.split(g).length - 1, 0);
    want += e.n;
    if(nNew !== e.n || nOld !== 0 || nGone !== 0)
      tBad.push('#' + k + (e.by ? ' (' + e.by + ')' : '') + ' new ' + nNew + '/' + e.n + ' old ' + nOld + (e.gone ? ' superseded ' + nGone : ''));
  }
  (SUP_BAD[key] || []).forEach(x => tBad.push(x));
"""),
]

# ── g207_test_week ─────────────────────────────────────────────────────────────────────
TW_ERA = r"""// ── ERA ROWS: how a run card names its quality session (standing ruling 4) ───────────
// Keyed to the RULING, D103a, which ships on ia-version 208, not to the version this gate
// shipped on. Through 207 the two NSW quality runs are named "Interval (INT)" and
// "Continuous High Intensity (CHI)" and carry no key, so a card is read by its name.
// From 208 the same two cards are named "Short Interval (SI)" and "Long Interval (LI)" and
// every NSW run card carries dose.key; a card is read by its key (int / chi), and E1
// requires its NSW name to agree with that key on every run card read, so every claim
// below is still about the named card the athlete sees. D103a moved words, not days: no
// expectation in this file changes with the era. A version with no row is a named FAIL.
const RUN_CARD_ERAS = [
  { hi: 207, name: { int: /^Interval \(INT\)/, chi: /^Continuous High Intensity \(CHI\)/ }, key: null },
  { lo: 208, name: { int: /^Short Interval \(SI\)/, chi: /^Long Interval \(LI\)/ }, key: { int: 'int', chi: 'chi' } }
];
const CARD_ROWS = RUN_CARD_ERAS.filter(r => (r.lo === undefined || VER >= r.lo) && (r.hi === undefined || VER <= r.hi));
if(CARD_ROWS.length !== 1){
  ok('E0 ia-version ' + VER + ' reads its run cards through exactly one era row', false, CARD_ROWS.length + ' rows match');
  summary();
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
// Bike and swim cards were not renamed by D103a and carry no key; they keep the names they
// have always had, in every era. Run cards go through the era row.
const BIKE_SWIM_CARD = { int: /^Interval \(INT\)/, chi: /^Continuous High Intensity \(CHI\)/ };
const cardQuality = c => !c ? null : c.type === 'run' ? runQuality(c)
  : BIKE_SWIM_CARD.int.test(String(c.subtype || '')) ? 'int'
  : BIKE_SWIM_CARD.chi.test(String(c.subtype || '')) ? 'chi' : null;

"""

TW_E1 = r"""// ── E1 the 208+ row reads the key, and the key must say what the name says ──────────
if(CARD.key) ok('E1 every run card read at ia-version ' + VER + ' names the same quality session in its NSW name and its dose.key (' + cardsRead + ' run cards)',
  cardsRead > 0 && cardSplit === 0, cardSplit + ' disagree: ' + cardSplitAt.join(' | '));
"""

TW = [
    ("const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];\nconst B = 2.5;\n",
     TW_ERA + "const DAYS = ['mon','tue','wed','thu','fri','sat','sun'];\nconst B = 2.5;\n"),
    ("const isHard = c => !!c && /^(Interval \\(INT\\)|Continuous High Intensity \\(CHI\\))/.test(String(c.subtype || ''));\n",
     "const isHard = c => { const q = cardQuality(c); return q === 'int' || q === 'chi'; };   // era rows, top of file\n"),
    ("  const preSub = DAYS.map(d => pre.weeks[tw][d] && pre.weeks[tw][d].cardio ? pre.weeks[tw][d].cardio.subtype : null);\n",
     "  const preSub = DAYS.map(d => pre.weeks[tw][d] && pre.weeks[tw][d].cardio ? pre.weeks[tw][d].cardio.subtype : null);\n"
     "  const preQ = DAYS.map(d => pre.weeks[tw][d] && pre.weeks[tw][d].cardio ? cardQuality(pre.weeks[tw][d].cardio) : null);\n"),
    ("     !preSub.some(s => /^Continuous High/.test(s || '')) && /^Interval/.test(preSub[0] || '')\n",
     "     !preQ.some(q => q === 'chi') && preQ[0] === 'int'\n"),
    ("\nsummary();\n", "\n" + TW_E1 + "summary();\n"),
]

# ── sabotage entries (appended textually so existing entries keep their bytes) ─────────
SAB_D103A = {
  "name": "S4 -> the dose.key table swaps int and chi: every Short Interval (SI) card is stamped chi and every Long Interval (LI) card int, so every key-first reader sees the pace week's quality pair backwards",
  "anchor": KEY_ANCHOR,
  "replacement": "{lsd_long:'long', lsd_easy:'easy', chi:'int', int:'chi'}[sType]",
  "gate": "gates/g205_d125_ceiling.js",
  "note": "NAMED TRIP (forced 208): P5 goes red (Mario reads mon:chi thu:int), P4 and P6b go red (462 untolerated: the session on the long run's eve now reads as INT), P4b goes red (0 tolerated), E1 goes red (5,387 of 10,977 run cards: name and key disagree). EXPECTED: P4 P4b P5 P6b E1. COLLATERAL, same mutation: g205_d125_spaced P7 P7b P8 E1; g205_d130_typed D12c D12d D12f E1; g205_d132_walkweek W5 E1; g207_test_week D8a D8b E1. Needs ia-version >= 208: below 208 the g205 era row reads cards by name and this mutation is invisible to it."
}
SAB_SHAKEOUT = {
  "name": "S3 -> B4 keeps only the long-LSD limb: INT and CHI at T-1 and T-2 no longer take the easy LSD, so a quality session survives the day before the test or two days out",
  "anchor": B4_ANCHOR,
  "replacement": "(r.t === 'lsd_long') && r !== _q",
  "gate": "gates/g207_gk_trial_present.js",
  "note": "NAMED TRIP (forced 208): P5 goes red on 6 rows (run only, rest sun+wed and sat+sun, tw 3, 6 and 9, Tuesday test: the Short Interval survives on Monday, T-1), and Q1 goes red for run_pace_goal and run_mile_time (12 of 42 eve run cards each: the surviving Short Interval (SI) — Taper at T-1 carries legLoad true). The long-LSD limb is intact, so the long card still moves off the eve. EXPECTED: P5 Q1. COLLATERAL, same mutation: g207_test_week D7a D7b (Tuesday test: Monday keeps the Short Interval instead of the shakeout)."
}

def append_entry(src, entry, fname):
    body = src.rstrip('\n')
    if not body.endswith('\n]') or body.count('\n]') != 1: die(fname + ': closing bracket anchor not count==1')
    try: json.loads(src)
    except Exception as e: die(fname + ': not JSON before edit: ' + str(e))
    for old in json.loads(src):
        if old.get('anchor') == entry['anchor'] and old.get('replacement') == entry['replacement']:
            die(fname + ': an entry with this anchor and replacement already exists')
    txt = json.dumps(entry, indent=2, ensure_ascii=False)
    txt = '\n'.join('  ' + l for l in txt.split('\n'))
    out = body[:-2] + ',\n' + txt + '\n]\n'
    json.loads(out)
    return out

out = {}
for fname, edits in (('gates/g206_d109_copy.js', D109), ('gates/g207_test_week.js', TW)):
    p = T / fname
    src = p.read_text(encoding='utf-8')
    for i, (old, new) in enumerate(edits, 1):
        n = src.count(old)
        if n != 1: die('%s edit %d: anchor count %d (want 1): %r' % (fname, i, n, old[:80]))
        src = src.replace(old, new, 1)
    out[p] = src
for fname, entry in (('sabotage/v208_d103a.json', SAB_D103A), ('sabotage/v208_shakeout.json', SAB_SHAKEOUT)):
    p = T / fname
    out[p] = append_entry(p.read_text(encoding='utf-8'), entry, fname)

for p, src in out.items():
    p.write_text(src, encoding='utf-8')
    print('wrote', p.relative_to(T))
