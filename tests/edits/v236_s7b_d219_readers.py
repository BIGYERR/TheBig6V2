#!/usr/bin/env python3
# V236 slice 7b: D218/D219 Amendment 1 (c) D219 items 2 and 3, and (b) D219-counter restated (foot of
# tests/measure/v236_rulings/v236_ruling_d218_d219.md; measure m3 tests/measure/v236_rulings/measure_rpe_readers_m3.md).
#  1. index.html restMoveCandidates: logged = rpe || notes || any key of CARDIO_PARK_FIELDS (the table iterated, all
#     three sports; swapTo/parked NOT added, P-RESTMOVELOG).
#  2. index.html renderProgressScreen journal skip keeps an entry carrying swapFrom && swapTo.
#  3. g236 D219-counter: label "the readers of a blank rpe", four conjuncts (chart, journal-skip, journal-swap,
#     rest-move); counter-line and sessions dropped with their constants.
#  4. tests/sabotage/v236_d218.json: two mutations on row D219-counter, item 2 reverted and item 3 reverted.
# Every anchor in every file asserted before any file is written; all or nothing. No version bump (stays 236).
import sys, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HTML = ROOT + '/index.html'
G236 = ROOT + '/tests/gates/g236_d218_logbutton.js'
SPEC = ROOT + '/tests/sabotage/v236_d218.json'
html = open(HTML, encoding='utf-8').read()
g236 = open(G236, encoding='utf-8').read()
spec_txt = open(SPEC, encoding='utf-8').read()

OLD_REST = "    if(lg&&(lg.rpe||lg.notes||lg.run_dist||lg.bike_mins||lg.swim_yards)) return;\n"
NEW_REST_LINE = "    if(lg&&(lg.rpe||lg.notes||Object.keys(CARDIO_PARK_FIELDS).some(function(s){ return CARDIO_PARK_FIELDS[s].some(function(f){ return !!lg[f]; }); }))) return;\n"
OLD_SKIP = "    if(!entry.notes && !entry.rpe) return;\n"
NEW_SKIP_LINE = "    if(!entry.notes && !entry.rpe && !(entry.swapFrom && entry.swapTo)) return;\n"
RH = [
 (OLD_REST,
  "    // V236 (D219 item 2): logged = an RPE, a note, or any field of CARDIO_PARK_FIELDS (the table cardioEntryLive\n"
  "    // reads, every sport), so a Log-tapped time, pace or rep-time form is never offered as not logged. swapTo and\n"
  "    // parked are not a log here: P-RESTMOVELOG.\n" + NEW_REST_LINE),
 (OLD_SKIP,
  "    // V236 (D219 item 3): a swap with no RPE and no note keeps its row, the isSwap line below.\n" + NEW_SKIP_LINE),
]

# ── g236 ─────────────────────────────────────────────────────────────────────────────────────────────────────────────
RG = [(
"""// licence file's: tests/measure/v236_rulings/v236_row_ruled.txt. D218/D219 Amendment 1 (the ruling file's foot) restates
// D218-log (a).
""",
"""// licence file's: tests/measure/v236_rulings/v236_row_ruled.txt. D218/D219 Amendment 1 (the ruling file's foot) restates
// D218-log (a) and D219-counter (b), with D219 items 2 and 3 (c).
"""), (
"""//   The session counter (renderProgressScreen's `if(entry.rpe||entry.run_dist||entry.bike_mins||entry.swim_yards||
//   entry.notes)` -> weeklyData[w].sessions++) is incremented and never rendered, so D219-counter restates that
//   predicate by hand, applies it to the stored entries, and pins the predicate line verbatim in the comment-stripped
//   source so a change to the reader is seen.
""",
"""//   D219-counter (Amendment 1 (b)): RPE_LABELS[7] "Very Hard" -> the journal line "RPE 7 — Very Hard"; a run swapped
//   to bike -> "Swapped Run → Bike"; HALF_MANNY W1 rests sun and wed (g000), so W1's other training days are mon, tue,
//   thu, fri, sat. The weekly session counter has no reader (m2) and is not a claim.
"""), (
"""//   D219-counter   W1 FRI Done untouched and W1 SAT RPE 7: the session counter's predicate, restated by hand on the stored
//                  entries, credits FRI 0 and SAT 1; the predicate line is present verbatim; Average Session RPE W1 is 7.
""",
"""//   D219-counter   (Amendment 1 (b)) the readers of a blank rpe, each read off a render or a store. chart: W1 FRI Done
//                  untouched, W1 SAT RPE 7, Average Session RPE W1 = 7. journal-skip: the same render's Session Journal
//                  W1 holds one entry, Sat, "RPE 7 — Very Hard", no Fri. journal-swap: fresh, W1 SAT chip Bike, no RPE,
//                  no note: W1 holds Sat with "Swapped Run → Bike" and no RPE line (D219 item 3). rest-move: fresh, W1 FRI
//                  roll 0:47:13, Log, no RPE, no Done: restMoveCandidates(1) is mon, tue, thu, sat (fri excluded, D219
//                  item 2); W1 FRI Done untouched: fri excluded on its completion.
"""), (
"""const COUNTER_LINE = 'if(entry.rpe||entry.run_dist||entry.bike_mins||entry.swim_yards||entry.notes)';
const counts = e => !!(e && (e.rpe || e.run_dist || e.bike_mins || e.swim_yards || e.notes));   // that line, restated
""",
"""const RPE7_LINE = 'RPE 7 — Very Hard';             // RPE_LABELS[7]
const SWAP_LINE = 'Swapped Run → Bike';
const W1_OTHERS = ['mon', 'tue', 'thu', 'sat'];       // W1 training days but fri (rest sun, wed)
"""), (
"""  'D219-counter':   'D219-counter (VER >= 236) a Done-untouched day credits no session and no RPE; the RPE-7 day credits 1 and Average Session RPE 7',
""",
"""  'D219-counter':   'D219-counter (VER >= 236) the readers of a blank rpe: Average Session RPE, the journal skip, the journal swap line, the rest-move list',
""")]
START = "guard('D219-counter', () => {"
END = "\nif(C.errs.length)"
NEW_COUNTER = """guard('D219-counter', () => {
  const cj = [verCj('D219-counter')];
  // W1 of the rendered Session Journal: its day names and its text
  const week1 = () => { const h = String(C.els.progressBody.innerHTML || ''); const i = h.indexOf('Session Journal');
    const blocks = i < 0 ? [] : (h.slice(i).match(/<details class="journal-week"[^>]*>[\\s\\S]*?<\\/details>/g) || []);
    const b = blocks.find(x => x.includes('<span>Week 1</span>')) || '';
    return { found:i >= 0, days:(b.match(/color:var\\(--text\\)">(Sun|Mon|Tue|Wed|Thu|Fri|Sat)<\\/div>/g) || []).map(s => s.slice(-9, -6)),
      text:b.replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim() }; };
  // chart and journal-skip: one render over W1 FRI Done untouched and W1 SAT RPE 7
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); C.open(1, 'sat'); C.rpe('7');
  const ch = C.chart('Average Session RPE', 1); const j1 = week1();
  cj.push(['chart', ch.drawn && +ch.v === 7, 'Average Session RPE W1 ' + J(ch.v) + ' (hand 7)']);
  cj.push(['journal-skip', J(j1.days) === J(['Sat']) && j1.text.includes(RPE7_LINE), 'journal W1 days ' + J(j1.days) + ', text ' + J(j1.text.slice(0, 140)) + ' (hand ["Sat"], ' + J(RPE7_LINE) + ', no Fri)']);
  // journal-swap: fresh, W1 SAT chip Bike, nothing else
  fresh(); C.open(1, 'sat'); C.ev("setCardioSwap('bike')"); C.advance(500); C.ev('renderProgressScreen()'); const j2 = week1();
  cj.push(['journal-swap', J(j2.days) === J(['Sat']) && j2.text.includes(SWAP_LINE) && !/RPE \\d/.test(j2.text), 'swap-only W1: journal ' + (j2.found ? 'present' : 'ABSENT') + ', days ' + J(j2.days) + ', text ' + J(j2.text.slice(0, 140)) + ' (hand ["Sat"], ' + J(SWAP_LINE) + ', no RPE line)']);
  // rest-move: a Log-tapped time form with no RPE, no note, no Done; then a Done-untouched FRI
  fresh(); C.open(1, 'fri'); C.roll(C.need('log_run_mins'), [[1, '47'], [2, '13']]); const tapped = C.log();
  const off1 = Array.from(C.ev('restMoveCandidates(1)')).map(c => c.day);
  fresh(); C.open(1, 'fri'); C.tap('fri', 'complete'); const off2 = Array.from(C.ev('restMoveCandidates(1)')).map(c => c.day);
  cj.push(['rest-move', tapped && J(off1) === J(W1_OTHERS) && !off2.includes('fri'), 'Log tap ' + tapped + ', offered after the Log ' + J(off1) + ', after Done untouched ' + J(off2) + ' (hand true, ' + J(W1_OTHERS) + ', no fri)']);
  row('D219-counter', cj);
});
"""

# ── spec: two mutations on D219-counter ─────────────────────────────────────────────────────────────────────────────
GATE = 'gates/g236_d218_logbutton.js'
RUL = 'Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219 Amendment 1 (b), (c)).'
ADD = [
 {'name': 'S13-D219 item 2 reverted: the rest-move logged test loses the CARDIO_PARK_FIELDS keys, a Log-tapped time form is offered as not logged',
  'anchor': NEW_REST_LINE.strip('\n'), 'replacement': OLD_REST.strip('\n'), 'gate': GATE,
  'note': 'NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct rest-move (W1 FRI logged 0:47:13 with no RPE is offered; hand: mon, tue, thu, sat). ' + RUL},
 {'name': 'S14-D219 item 3 reverted: the journal skip drops a swap with no RPE and no note',
  'anchor': NEW_SKIP_LINE.strip('\n'), 'replacement': OLD_SKIP.strip('\n'), 'gate': GATE,
  'note': 'NAMED TRIP: g236_d218_logbutton.js row D219-counter conjunct journal-swap (no W1 journal row; hand: Sat, "Swapped Run → Bike"). ' + RUL},
]

# ── assert everything, then write ───────────────────────────────────────────────────────────────────────────────────
for i, (old, new) in enumerate(RH):
    if html.count(old) != 1: sys.exit('ABORT: html anchor %d count=%d' % (i, html.count(old)))
for i, (old, new) in enumerate(RG):
    if g236.count(old) != 1: sys.exit('ABORT: g236 anchor %d count=%d\n%s' % (i, g236.count(old), old[:120]))
if g236.count(START) != 1 or g236.count(END) != 1: sys.exit('ABORT: g236 D219-counter block markers')
a = g236.index(START); b = g236.index(END)
if not (a < b and "'counter-line'" in g236[a:b] and "'sessions'" in g236[a:b]): sys.exit('ABORT: g236 D219-counter block is not the old one')
spec = json.loads(spec_txt)
if json.dumps(spec, ensure_ascii=False, indent=1) + '\n' != spec_txt: sys.exit('ABORT: spec does not round-trip byte-for-byte')
if len(spec) != 12 or any(m['name'][:4] in ('S13-', 'S14-') for m in spec): sys.exit('ABORT: spec is not the 12-mutation file')

html2 = html
for old, new in RH: html2 = html2.replace(old, new, 1)
for m in ADD:
    if html2.count(m['anchor']) != 1: sys.exit('ABORT: new mutation anchor count=%d: %s' % (html2.count(m['anchor']), m['name']))
    if html2.replace(m['anchor'], m['replacement']) == html2: sys.exit('ABORT: no-op mutation ' + m['name'])
g2 = g236
for old, new in RG: g2 = g2.replace(old, new, 1)
a = g2.index(START); b = g2.index(END)
g2 = g2[:a] + NEW_COUNTER.rstrip('\n') + '\n' + g2[b:]
for gone in ('COUNTER_LINE', 'counts(', "'counter-line'", "'sessions'"):
    assert gone not in g2, gone
assert 'name="ia-version" content="236"' in html2

open(HTML, 'w', encoding='utf-8').write(html2)
open(G236, 'w', encoding='utf-8').write(g2)
with open(SPEC, 'w', encoding='utf-8') as f:
    json.dump(spec + ADD, f, ensure_ascii=False, indent=1); f.write('\n')
print('OK: index.html 2 replacements; g236 %d replacements + D219-counter body; spec 12 -> 14 mutations' % len(RG))
