#!/usr/bin/env python3
# V236 slice 2 of 4 (D218 P-LOGBUTTON items 4-7), ruling tests/measure/v236_rulings/v236_ruling_d218_d219.md
# (incl. its "Session notes"). Requires slice 1 (tests/edits/v236_s1_regime.py) already applied.
# Edits: (1) buildLogHTML: #cardioLogBtn, last inside #cardioSwapWrap, label + data-logged seeded from the store;
# (2) cardioLive relabels the button on every recompute, through two small pure helpers shared with the render;
# (3) logCardio(), the Log tap; (4) handleDayStatus commits on a status-setting tap, not on the undo tap.
# No version bump (stays 235). Every anchor asserted count==1 before any write; all or nothing.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Pre-conditions: slice 1 is in, slice 2 is not.
if src.count('function cardioLive(dayKey){') != 1 or src.count('function persistLogFields(dayKey, commit){') != 1:
    sys.exit('ABORT: slice 1 not present')
for tok in ('cardioLogBtn', 'function logCardio', 'cardioEntryLive', 'cardioLogLabel', 'CARDIO_LOGGED_TOAST', 'Nothing to log yet.'):
    if src.count(tok) != 0:
        sys.exit('ABORT: %r already present (%d)' % (tok, src.count(tok)))

R = []

# ── Edit 1: buildLogHTML — the button and the regime seed ───────────────────
R.append((
"""  const rpeVal=e.rpe||'';

  return `<div class="log-section" id="logSection">""",
"""  const rpeVal=e.rpe||'';
  // V236 (D218): the regime seeds from the store at render; cardioLive keeps it after every write.
  const _logged=hasCardio&&cardioEntryLive(e,activeSport);

  return `<div class="log-section" id="logSection">"""))

R.append((
"""      ${hasCardio?`<div class="log-field" id="cardioSwapWrap" data-planned="${ct}" data-active="${activeSport}">""",
"""      ${hasCardio?`<div class="log-field" id="cardioSwapWrap" data-planned="${ct}" data-active="${activeSport}" data-logged="${_logged?'1':'0'}">"""))

R.append((
"""${swapped?cardioSwapNoteText(activeSport, ct, e):''}</div>
        </div>
      </div>`:''}
""",
"""${swapped?cardioSwapNoteText(activeSport, ct, e):''}</div>
        </div>
        <button type="button" id="cardioLogBtn" class="ex-logbtn${_logged?' logged':''}" onclick="logCardio()" style="width:100%;margin-top:12px;padding:12px;border-radius:6px;letter-spacing:0.08em">${cardioLogLabel(_logged)}</button>
      </div>`:''}
"""))

# ── Edit 2: cardioLive relabels on every recompute ──────────────────────────
R.append((
"""// cardioSwapWrap.dataset.logged ("1" / "0") on every call. No wrap (a lift day) is never live,
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
""",
"""// cardioSwapWrap.dataset.logged ("1" / "0") on every call, and the Log button's label and
// .logged class with it, so every write and every chip re-render relabels through this one place
// (the chip re-renders #cardioFields only; the button sits outside it and setCardioSwap's last
// write lands here). No wrap (a lift day) is never live, and has no cardio node to read either way.
function cardioEntryLive(e, sport){
  return !!e&&(CARDIO_PARK_FIELDS[sport]||[]).some(function(f){ return !!e[f]; });
}
function cardioLogLabel(live){ return live?'Logged ✓':'Log'; }
function cardioLive(dayKey){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return false;
  const sport=wrap.dataset.active||wrap.dataset.planned||'';
  const live=cardioEntryLive(getLogs()[logKey(currentWeek,dayKey)], sport);
  wrap.dataset.logged=live?'1':'0';
  const b=document.getElementById('cardioLogBtn');
  if(b){ b.textContent=cardioLogLabel(live); b.classList.toggle('logged',live); }
  return live;
}
"""))

# ── Edit 3: logCardio, the Log tap ──────────────────────────────────────────
R.append((
"""  saveLogs(logs);
  cardioLive(dayKey);   // V236 (D218): the regime is recomputed after every write
}
""",
"""  saveLogs(logs);
  cardioLive(dayKey);   // V236 (D218): the regime is recomputed after every write
}
// V236 (D218): the cardio card's Log tap, the commit for a DRAFT card. A wheel still inside its
// settle window commits to its node first, as in handleDayStatus. An empty card (every field of
// the active sport blank on the form) writes nothing and says so. Otherwise the form is committed
// through persistLogFields, whose tail recomputes the regime and relabels the button, and the
// toast names the sport the chip credits.
var CARDIO_LOGGED_TOAST={run:'Run logged ✓',bike:'Ride logged ✓',swim:'Swim logged ✓'};
function logCardio(){
  const wrap=document.getElementById('cardioSwapWrap');
  if(!wrap) return;
  iaWheelFlush(document.getElementById('detailOverlay'));
  const sport=wrap.dataset.active||wrap.dataset.planned||'';
  const g=v=>document.getElementById(v)?.value||'';
  if((CARDIO_PARK_FIELDS[sport]||[]).every(function(f){ return g('log_'+f)===''; })){ showToast('Nothing to log yet.'); return; }
  persistLogFields(currentDayKey,true);
  showToast(CARDIO_LOGGED_TOAST[sport]);
}
"""))

# ── Edit 4: handleDayStatus commits on a status-setting tap ─────────────────
R.append((
"""  if(statusOf(currentWeek,dayKey)!==status) iaWheelFlush(document.getElementById('detailOverlay'));
  persistLogFields(dayKey);
""",
"""  // V236 (D218): a status-setting tap is also a commit tap. The form is committed whatever the
  // card's regime, so Done on a rolled but unlogged card logs it. The undo tap is not a commit:
  // it saves regime-aware like any other write, so it never writes a draft number.
  const _commit=statusOf(currentWeek,dayKey)!==status;
  if(_commit) iaWheelFlush(document.getElementById('detailOverlay'));
  persistLogFields(dayKey,_commit);
"""))

for i, (old, new) in enumerate(R):
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %d count=%d\n%s' % (i, n, old[:160]))
out = src
for old, new in R:
    out = out.replace(old, new, 1)

assert out.count('id="cardioLogBtn"') == 1
assert out.count('function logCardio(){') == 1
assert out.count('persistLogFields(dayKey,_commit);') == 1
assert out.count('name="ia-version" content="235"') == 1, 'version must stay 235 in slice 2'
open(PATH, 'w', encoding='utf-8').write(out)
print('OK: %d replacements written' % len(R))
