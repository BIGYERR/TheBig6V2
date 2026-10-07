#!/usr/bin/env python3
# V234 slice 1 of 2: D213 (P-SWAPKEEP) and D214 (the swap note), plus the version bump.
# Ruling: tests/measure/v234_rulings/v234_ruling_d213_d214.md (D213, D214, Mario's concurrence,
# D213 Amendment 1). Every anchor is asserted count==1 before anything is written; the first
# miss aborts the whole script and the file is left untouched. The version meta is last.
#
# Diff classes this script produces in index.html:
#   (A) persistLogFields carries `parked` beside _keepSets
#   (B) setCardioSwap parks the leaving set, restores the arriving set (+ CARDIO_PARK_FIELDS)
#   (C) the D214 note copy at both sites (+ cardioSwapNoteText, the one copy source)
#   (D) ia-version 233 -> 234
import sys, pathlib

PATH = pathlib.Path(__file__).resolve().parents[2] / 'index.html'
src = PATH.read_text(encoding='utf-8')

EDITS = []

# ── (B)+(C) the field-set map and the note text, declared once beside CARDIO_WORD ──────────
EDITS.append(('B/C const + note helper',
"""const CARDIO_WORD={run:'Run',bike:'Bike',swim:'Swim'};
""",
"""const CARDIO_WORD={run:'Run',bike:'Bike',swim:'Swim'};
// V234 (D213): the field set each sport owns at the top level of a log entry. Only the active
// chip's set sits at top level, so only it is credited. A sport change through the picker moves
// the leaving set whole into entry.parked[sport] and brings the arriving sport's parked set back.
// `parked` is read by the form render (setCardioSwap, buildLogHTML's note) and carried by
// persistLogFields; no other reader names it, so every other reader is blind to it.
const CARDIO_PARK_FIELDS={run:['run_dist','run_pace','run_mins','run_reps','run_rep_time'],bike:['bike_mins'],swim:['swim_yards']};
// V234 (D214): the swap note, one source for both sites. The second sentence prints only when
// the planned sport has a parked set holding a number.
function cardioSwapNoteText(active, planned, e){
  const p=e&&e.parked&&e.parked[planned];
  const kept=!!p&&(CARDIO_PARK_FIELDS[planned]||[]).some(function(f){ return p[f]!=null&&p[f]!==''; });
  return `Counts toward ${CARDIO_WORD[active]}, not ${CARDIO_WORD[planned]}.`+(kept?` Your ${CARDIO_WORD[planned]} numbers are kept. Switch back and they return.`:'');
}
"""))

# ── (C) render site in buildLogHTML ─────────────────────────────────────────────────────────
EDITS.append(('C render note',
"""${swapped?('Swapped from '+CARDIO_WORD[ct]+' — this counts toward your '+CARDIO_WORD[activeSport]+' progress, not '+CARDIO_WORD[ct]+'.'):''}</div>""",
"""${swapped?cardioSwapNoteText(activeSport, ct, e):''}</div>"""))

# ── (A) persistLogFields: carry parked through the one rebuild, exactly as sets ──────────────
EDITS.append(('A read parked before rebuild',
"""  const _keepSets=(logs[key]&&logs[key].sets)||null;
  logs[key]={""",
"""  const _keepSets=(logs[key]&&logs[key].sets)||null;
  // V234 (D213): the parked sport sets ride the rebuild the same way the sets do.
  const _keepParked=(logs[key]&&logs[key].parked)||null;
  logs[key]={"""))
EDITS.append(('A re-attach parked after rebuild',
"""  if(_keepSets) logs[key].sets=_keepSets;
""",
"""  if(_keepSets) logs[key].sets=_keepSets;
  if(_keepParked) logs[key].parked=_keepParked;
"""))

# ── (B) setCardioSwap: park the leaving set, restore the arriving set, render from the entry ──
EDITS.append(('B setCardioSwap head',
"""// Swap the logged cardio to a different sport: re-render the input for that sport,
// update the chips + note, rewire persistence, and save. Clearing the old sport's
// fields (they leave the DOM → saved as blank) keeps volume credited to the sport
// actually done — a swapped bike never lands on the run chart.
function setCardioSwap(sport){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return;
  const planned=wrap.dataset.planned||'';
  wrap.dataset.active=sport;
  const e=getLogs()[logKey(currentWeek,currentDayKey)]||{};
""",
"""// Swap the logged cardio to a different sport: re-render the input for that sport,
// update the chips + note, rewire persistence, and save. V234 (D213): the chip credits,
// it never erases. Only the active sport's fields sit at top level (a swapped bike never
// lands on the run chart), the leaving sport's numbers park on the entry, and switching
// back brings them back to the form. Tapping the active chip moves nothing.
function setCardioSwap(sport){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return;
  const planned=wrap.dataset.planned||'';
  // V234 (D213): the leaving set is what the form holds at the tap. A wheel still inside its
  // settle window commits first, then the store is brought level with the form under the
  // leaving sport, before anything moves.
  const leaving=wrap.dataset.active||planned;
  iaWheelFlush(wrap);
  persistLogFields(currentDayKey);
  const logs=getLogs();const key=logKey(currentWeek,currentDayKey);
  const e=logs[key]||{};
  if(sport!==leaving){
    const P=Object.assign({},e.parked||{});
    const out={};
    (CARDIO_PARK_FIELDS[leaving]||[]).forEach(function(f){ out[f]=(e[f]==null?'':String(e[f])); e[f]=''; });
    if(Object.keys(out).some(function(f){ return out[f]!==''; })) P[leaving]=out; else delete P[leaving];
    const back=P[sport]||null;
    (CARDIO_PARK_FIELDS[sport]||[]).forEach(function(f){ e[f]=(back&&back[f]!=null)?back[f]:''; });
    delete P[sport];
    if(Object.keys(P).length) e.parked=P; else delete e.parked;
    logs[key]=e; saveLogs(logs);
  }
  wrap.dataset.active=sport;
"""))
EDITS.append(('C setCardioSwap note',
"""    if(sport!==planned){ note.style.display='block'; note.textContent='Swapped from '+CARDIO_WORD[planned]+' — this counts toward your '+CARDIO_WORD[sport]+' progress, not '+CARDIO_WORD[planned]+'.'; }""",
"""    if(sport!==planned){ note.style.display='block'; note.textContent=cardioSwapNoteText(sport, planned, e); }"""))

# ── (D) the version meta, last ───────────────────────────────────────────────────────────────
EDITS.append(('D ia-version',
'<meta name="ia-version" content="233">',
'<meta name="ia-version" content="234">'))

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (want 1); nothing written' % (name, n))
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('ok  %-34s count=1' % name)
PATH.write_text(out, encoding='utf-8')
print('wrote', PATH, len(src), '->', len(out), 'chars')
