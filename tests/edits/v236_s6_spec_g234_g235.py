#!/usr/bin/env python3
# V236 slice 6 (ruling tests/measure/v236_rulings/v236_ruling_d218_d219.md, sections "Sabotage" and "Existing rows
# that flip").
#  1. NEW tests/sabotage/v236_d218.json: the ruling's twelve mutations, each anchored count==1 on index.html, each naming
#     gates/g236_d218_logbutton.js and the row it must trip. Every replacement changes the artifact (no no-op).
#  2. tests/gates/g234_d213_swapkeep.js: the ruling: "its `type()` helper writes the node then calls `persistLogFields`
#     in DRAFT, so K1 K2 K3 K5 K6 K7 K10 K11 C1 L1 flip in SETUP (insert a Log tap or set the store); their claims
#     stand." The helper's write becomes the commit (persistLogFields(day,true), the Log tap's write) from VER 236;
#     VER <= 235 is unchanged. No claim, no row name moves.
#  3. tests/gates/g235_d215_hmszero.js: "D215-plan (minutes-30, hours-0-1-0) need a Log; D215-clear dist-same-open needs
#     Log before the clear". A logCardio() tap after the first roll in each, from VER 236; VER <= 235 is unchanged.
# Every anchor in every file is asserted before any file is written; all or nothing.
import sys, os, json

ROOT = '/Users/CanasBangin/Desktop/TheBig6V2'
HTML = os.path.join(ROOT, 'index.html')
SPEC = os.path.join(ROOT, 'tests/sabotage/v236_d218.json')
G234 = os.path.join(ROOT, 'tests/gates/g234_d213_swapkeep.js')
G235 = os.path.join(ROOT, 'tests/gates/g235_d215_hmszero.js')
html = open(HTML, encoding='utf-8').read()
g234 = open(G234, encoding='utf-8').read()
g235 = open(G235, encoding='utf-8').read()
if os.path.exists(SPEC):
    sys.exit('ABORT: %s already exists' % SPEC)

GATE = 'gates/g236_d218_logbutton.js'
RUL = 'Ruling: tests/measure/v236_rulings/v236_ruling_d218_d219.md (D218/D219, Sabotage paragraph).'
def mut(n, name, anchor, repl, row, why):
    return {'name': 'S%d-D218 %s' % (n, name) if row.startswith('D218') else 'S%d-D219 %s' % (n, name),
            'anchor': anchor, 'replacement': repl, 'gate': GATE,
            'note': 'NAMED TRIP: g236_d218_logbutton.js row %s (%s). %s' % (row, why, RUL)}

M = [
 mut(1, 'listener persists in DRAFT: a settled wheel writes the entry before any Log tap',
     "if(free||cardioLive(dayKey)) persistLogFields(dayKey);", "persistLogFields(dayKey);",
     'D218-draft', 'the 0:47:13 settle creates an entry and an ia_hist_ snapshot; hand: entry null, no snapshot'),
 mut(2, 'persistLogFields reads the cardio DOM in DRAFT: an RPE move stores the rolled draft',
     "const gc=v=>_live?g(v):'';", "const gc=v=>g(v);",
     'D218-rpe-notes', 'RPE 7 after a draft roll stores run_mins "47.22"; hand ""'),
 mut(3, 'Log skips the empty check: an untouched card commits a blank entry and toasts Run logged',
     ".every(function(f){ return g('log_'+f)===''; })", ".every(function(f){ return false; })",
     'D218-empty', 'Log on an untouched W1 FRI writes an entry and toasts "Run logged ✓"; hand: entry null, "Nothing to log yet."'),
 mut(4, 'regime not recomputed after a write: the clear to 0:00:00 leaves the button on Logged',
     "cardioLive(dayKey);   // V236 (D218): the regime is recomputed after every write", "// the regime is not recomputed",
     'D218-live', 'after Log, the roll to 0:00:00 stores "" but the button stays "Logged ✓", data-logged unset; hand "Log", "0"'),
 mut(5, 'render never seeds the regime: a stored run reopens on Log',
     "const _logged=hasCardio&&cardioEntryLive(e,activeSport);", "const _logged=false;",
     'D218-reopen', 'stored run_mins "47.22" opens with button "Log", data-logged "0"; hand "Logged ✓", "1"'),
 mut(6, 'handleDayStatus does not force the commit: Done on a rolled draft stores nothing',
     "persistLogFields(dayKey,_commit);", "persistLogFields(dayKey);",
     'D218-done', 'roll 0:47:13, Done at 200 ms stores run_mins ""; hand "47.22"'),
 mut(7, 'doseRep persists in DRAFT: a stepper step writes the entry',
     "// V236 (D218): on a DRAFT card the stepper is form only; the Log tap commits it.\n  if(cardioLive(currentDayKey)) persistLogFields(currentDayKey);",
     "// V236 (D218): on a DRAFT card the stepper is form only; the Log tap commits it.\n  persistLogFields(currentDayKey);",
     'D218-reps', 'the forced reps stepper +1 creates an entry; hand: entry null'),
 mut(8, 'swim listener persists: the yards box writes per keystroke in DRAFT',
     "var free=(id==='log_rpe'||id==='log_notes');", "var free=(id==='log_rpe'||id==='log_notes'||id==='log_swim_yards');",
     'D218-swim', 'typing 1, 15, 150, 1500 on the swim host writes the entry; hand: entry null, ia_logs_ unchanged'),
 mut(9, 'the run toast loses its check mark',
     "{run:'Run logged ✓',", "{run:'Run logged',",
     'D218-copy', 'CARDIO_LOGGED_TOAST in the stripped source is not the hand declaration'),
 mut(10, 'chip parks the DOM draft: the leaving sport is committed before the park',
     "  iaWheelFlush(wrap);\n  persistLogFields(currentDayKey);", "  iaWheelFlush(wrap);\n  persistLogFields(currentDayKey,true);",
     'D218-chip', 'W1 SAT draft 0:47:13 then chip Bike parks run_mins "47.22"; hand: no parked, run_mins ""'),
 mut(11, 'touched check dropped: an untouched slider stores its resting value',
     "_rpeEl&&_rpeEl.dataset.touched==='1'", "_rpeEl",
     'D219-rpe', 'untouched + note stores rpe "5"; hand ""'),
 mut(12, "untouched writes '' over a stored RPE: a reopened 7 is lost on a note",
     "((logs[key]&&logs[key].rpe!=null)?logs[key].rpe:'')", "''",
     'D219-rpe', 'reopen stored 7 + note stores rpe ""; hand "7"'),
]
assert len(M) == 12
for m in M:
    n = html.count(m['anchor'])
    if n != 1:
        sys.exit('ABORT: mutation %r anchor count=%d' % (m['name'], n))
    if html.replace(m['anchor'], m['replacement']) == html:
        sys.exit('ABORT: mutation %r is a no-op' % m['name'])

# ── g234: the type() helper's write becomes the commit from VER 236 ─────────────────────────────────────────────────
R234 = [(
"""const persist = dk => tryv(() => E('persistLogFields("' + dk + '")'));
""",
"""// V236 (D218 "Existing rows that flip": type() wrote the node then persisted in DRAFT, which stores no cardio number):
// from VER 236 the helper's write is the commit the Log tap makes (persistLogFields(day,true)); on a LIVE card that is
// byte-for-byte the listener's own write. VER <= 235 is unchanged. Setup only: no claim moves.
const persist = dk => tryv(() => E('persistLogFields("' + dk + '"' + (STAMP >= 236 ? ',true' : '') + ')'));
""")]

# ── g235: a Log tap after the first roll in D215-plan (both claims) and D215-clear dist-same-open, from VER 236 ──────
R235 = [(
"""  C.roll(o.wh, [[1, '30']]); let e = C.entry(1, 'fri') || {};
""",
"""  // V236 (D218 "Existing rows that flip"): from VER 236 a rolled draft is stored by the Log tap; VER <= 235 unchanged.
  const logTap = () => { if(VER >= 236){ C.ev('logCardio()'); C.advance(50); } };
  C.roll(o.wh, [[1, '30']]); logTap(); let e = C.entry(1, 'fri') || {};
"""), (
"""  o = openBlank(1, 'fri', 'log_run_mins'); C.roll(o.wh, [[0, '1']]); const mid = (C.entry(1, 'fri') || {}).run_mins;
""",
"""  o = openBlank(1, 'fri', 'log_run_mins'); C.roll(o.wh, [[0, '1']]); logTap(); const mid = (C.entry(1, 'fri') || {}).run_mins;
"""), (
"""  C.use(HALF); C.wipe(); C.open(1, 'sat'); C.roll(C.wheel('log_run_mins'), [[1, '47'], [2, '13']]); e = C.entry(1, 'sat') || {};
""",
"""  // V236 (D218 "Existing rows that flip"): from VER 236 the log is written by the Log tap before the clear.
  C.use(HALF); C.wipe(); C.open(1, 'sat'); C.roll(C.wheel('log_run_mins'), [[1, '47'], [2, '13']]);
  if(VER >= 236){ C.ev('logCardio()'); C.advance(50); }
  e = C.entry(1, 'sat') || {};
""")]

for name, src, R in (('g234', g234, R234), ('g235', g235, R235)):
    for i, (old, new) in enumerate(R):
        if src.count(old) != 1:
            sys.exit('ABORT: %s anchor %d count=%d\n%s' % (name, i, src.count(old), old[:140]))
g234b, g235b = g234, g235
for old, new in R234: g234b = g234b.replace(old, new, 1)
for old, new in R235: g235b = g235b.replace(old, new, 1)

with open(SPEC, 'w', encoding='utf-8') as f:
    json.dump(M, f, ensure_ascii=False, indent=1); f.write('\n')
open(G234, 'w', encoding='utf-8').write(g234b)
open(G235, 'w', encoding='utf-8').write(g235b)
print('OK: spec 12 mutations; g234 %d replacement(s); g235 %d replacement(s)' % (len(R234), len(R235)))
