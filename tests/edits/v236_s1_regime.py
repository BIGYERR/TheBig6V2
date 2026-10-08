#!/usr/bin/env python3
# V236 slice 1 of 4 (D218 P-LOGBUTTON + D219), ruling tests/measure/v236_rulings/v236_ruling_d218_d219.md.
# Edits: (1) cardioLive regime helper + regime-aware persistLogFields(dayKey, commit) + D219 RPE carry;
# (2) openDetail listener array persists cardio ids only when LIVE; (3) setCardioSwap re-wire array
# the same; (4) doseRep persists only when LIVE. No version bump in this slice (stays 235).
# Every anchor is asserted count==1 before any write; all or nothing.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Pre-conditions: the new symbols do not exist yet.
for tok in ('cardioLive', 'dataset.touched', 'data-touched', 'dataset.logged'):
    if src.count(tok) != 0:
        sys.exit('ABORT: %r already present (%d)' % (tok, src.count(tok)))

R = []

# ── Edit 1: regime helper + persistLogFields ─────────────────────────────────
R.append((
"""// Persist the log form fields to ia_logs_. No toast/re-render — the status-button
// handler (handleDayStatus) owns committing + rendering, so saving and marking the
// day are a single tap. Overwrites the entry, so re-tapping a status updates it.
function persistLogFields(dayKey){
""",
"""// V236 (D218): the cardio card's regime, derived from the store and never stored. LIVE when
// the stored entry holds a value in the ACTIVE sport's field set, the same truth test _hasLog
// makes minus the notes, so a legacy "0.00" is live. Otherwise DRAFT: the numbers live on the
// form only. The active sport is the wrap's, the one persistLogFields writes swapTo from; inside
// setCardioSwap the store's swapTo still names the leaving sport while the arriving set is already
// restored, so the store's swapTo would read a restored set as a draft and blank it. Mirrored onto
// cardioSwapWrap.dataset.logged ("1" / "0") on every call. No wrap (a lift day) is never live,
// and has no cardio node to read either way.
function cardioLive(dayKey){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return false;
  const e=getLogs()[logKey(currentWeek,dayKey)];
  const sport=wrap.dataset.active||wrap.dataset.planned||'';
  const live=!!e&&(CARDIO_PARK_FIELDS[sport]||[]).some(function(f){ return !!e[f]; });
  wrap.dataset.logged=live?'1':'0';
  return live;
}
// Persist the log form fields to ia_logs_. No toast/re-render — the status-button
// handler (handleDayStatus) owns committing + rendering, so saving and marking the
// day are a single tap. Overwrites the entry, so re-tapping a status updates it.
// V236 (D218): the seven cardio keys follow the regime. On a DRAFT card all seven store ''
// and no V148 stamp lands, so a rolled number stays on the form until a commit tap. LIVE, or
// `commit` truthy (the Log tap, Done, Skip), reads the cardio nodes as before. RPE, notes,
// swapFrom/swapTo, sets and parked are read and carried as before. The regime is recomputed
// after the write. V236 (D219): the slider value is stored only once #log_rpe carries
// data-touched="1" (set by updateRPEDisplay); untouched, the entry's own rpe is carried,
// '' for a new entry, so the thumb resting at 5 is never a number.
function persistLogFields(dayKey, commit){
"""))

R.append((
"""  const g=v=>document.getElementById(v)?.value||'';
  // Record a cardio swap (prescribed sport ≠ the one actually logged) so the entry
""",
"""  const g=v=>document.getElementById(v)?.value||'';
  // V236 (D218): the regime is read from the store before the write.
  const _live=!!commit||cardioLive(dayKey);
  const gc=v=>_live?g(v):'';
  // Record a cardio swap (prescribed sport ≠ the one actually logged) so the entry
"""))

R.append((
"""  const _keepParked=(logs[key]&&logs[key].parked)||null;
  logs[key]={
    rpe:g('log_rpe'),
    run_dist:g('log_run_dist'), run_pace:g('log_run_pace'),
    run_mins:g('log_run_mins'), run_reps:g('log_run_reps'), run_rep_time:g('log_run_rep_time'),
    bike_mins:g('log_bike_mins'), swim_yards:g('log_swim_yards'),
    notes:g('log_notes'),
""",
"""  const _keepParked=(logs[key]&&logs[key].parked)||null;
  // V236 (D219): an untouched slider carries the entry's rpe.
  const _rpeEl=document.getElementById('log_rpe');
  const _rpe=(_rpeEl&&_rpeEl.dataset.touched==='1')?g('log_rpe'):((logs[key]&&logs[key].rpe!=null)?logs[key].rpe:'');
  logs[key]={
    rpe:_rpe,
    run_dist:gc('log_run_dist'), run_pace:gc('log_run_pace'),
    run_mins:gc('log_run_mins'), run_reps:gc('log_run_reps'), run_rep_time:gc('log_run_rep_time'),
    bike_mins:gc('log_bike_mins'), swim_yards:gc('log_swim_yards'),
    notes:g('log_notes'),
"""))

R.append((
"""  const _dd=doseDerived(_curLogDose,{mins:g('log_run_mins'),dist:g('log_run_dist'),reps:g('log_run_reps'),rep:g('log_run_rep_time')});
  if(_dd){
    if(_dd.pace && !logs[key].run_pace) logs[key].run_pace=_dd.pace;
    if(_dd.dist!=null && !logs[key].run_dist) logs[key].run_dist=String(_dd.dist);
  }
  saveLogs(logs);
}
""",
"""  // V236 (D218): a DRAFT lands no stamp.
  if(_live){
    const _dd=doseDerived(_curLogDose,{mins:g('log_run_mins'),dist:g('log_run_dist'),reps:g('log_run_reps'),rep:g('log_run_rep_time')});
    if(_dd){
      if(_dd.pace && !logs[key].run_pace) logs[key].run_pace=_dd.pace;
      if(_dd.dist!=null && !logs[key].run_dist) logs[key].run_dist=String(_dd.dist);
    }
  }
  saveLogs(logs);
  cardioLive(dayKey);   // V236 (D218): the regime is recomputed after every write
}
"""))

# ── Edit 2: openDetail listener array ────────────────────────────────────────
R.append((
"""  ['log_rpe','log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards','log_notes'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('input',function(){persistLogFields(dayKey);updateDoseDerived();});
  });
""",
"""  // V236 (D218): RPE and notes autosave on input, deliberate gestures. A cardio node (wheel
  // settle, yards box) persists only once the card is LIVE; on a DRAFT it has written its
  // hidden node and the readout repaints, nothing else.
  ['log_rpe','log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards','log_notes'].forEach(function(id){
    var el=document.getElementById(id);
    var free=(id==='log_rpe'||id==='log_notes');
    if(el) el.addEventListener('input',function(){ if(free||cardioLive(dayKey)) persistLogFields(dayKey); updateDoseDerived(); });
  });
"""))

# ── Edit 3: setCardioSwap re-wire array ──────────────────────────────────────
R.append((
"""  // Re-wire input persistence for the freshly injected field(s).
  ['log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards'].forEach(function(id){
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',function(){persistLogFields(currentDayKey);updateDoseDerived();});
  });
""",
"""  // Re-wire input persistence for the freshly injected field(s). V236 (D218): cardio ids
  // persist only once the card is LIVE; on a DRAFT the node and the readout are all that move.
  ['log_run_dist','log_run_pace','log_run_mins','log_run_rep_time','log_bike_mins','log_swim_yards'].forEach(function(id){
    const el=document.getElementById(id);
    if(el) el.addEventListener('input',function(){ if(cardioLive(currentDayKey)) persistLogFields(currentDayKey); updateDoseDerived(); });
  });
"""))

# ── Edit 4: doseRep ──────────────────────────────────────────────────────────
R.append((
"""  const s=document.getElementById('doseRepVal'); if(s) s.textContent=v;
  persistLogFields(currentDayKey);
  updateDoseDerived();
}
""",
"""  const s=document.getElementById('doseRepVal'); if(s) s.textContent=v;
  // V236 (D218): on a DRAFT card the stepper is form only; the Log tap commits it.
  if(cardioLive(currentDayKey)) persistLogFields(currentDayKey);
  updateDoseDerived();
}
"""))

# Assert every anchor before any write.
for i, (old, new) in enumerate(R):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d\n%s' % (i, n, old[:160]))
out = src
for old, new in R:
    out = out.replace(old, new, 1)

# Post-conditions.
assert out.count('function cardioLive(dayKey){') == 1
assert out.count('function persistLogFields(dayKey, commit){') == 1
assert out.count('name="ia-version" content="235"') == 1, 'version must stay 235 in slice 1'
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: %d replacements written' % len(R))
