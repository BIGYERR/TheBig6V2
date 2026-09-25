#!/usr/bin/env python3
# V221 build 2, slice S6 of D179 (P-DONENAV): Done, Skip and Mark Done ✓ close the day to This Week.
# Ruling: tests/measure/v221_rulings/p_donenav_ruling.md (original + MARIO DECISION + AMENDMENT ON V220
# (b)(c) + MARIO DECISION ON THE AMENDMENT). S6 is the handleDayStatus side only; the hero status line,
# the OPEN SESSION CTA condition, the strip ✕ branch and CSS are S7.
#   A1 (P) iaWheelFlush helper, before iaWheelInit
#   A2 (P) the per-column settle becomes a named step that clears its own handle
#   A3 (P call)(Q)(R) handleDayStatus: flush before persistLogFields on a status-setting tap; set branch
#       ruReset, closeDetail, pop-up, toast only when no pop-up shows; Skip toast copy
# No ia-version bump in this slice (stays 220). Every anchor asserted count==1 before anything is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# names this slice introduces must be new
for tok in ('iaWheelFlush', '_iawSettle'):
    if src.count(tok) != 0:
        sys.exit('ABORT: %s already present (%d)' % (tok, src.count(tok)))

EDITS = []

# ---- A1 (P): the flush helper -------------------------------------------------------------
A1_OLD = """// Idempotent: safe to call after any re-render. Seeds each column from the hidden
// input's current value and paints the selected row without committing.
function iaWheelInit(root){"""
A1_NEW = """// V221 (D179): a status-setting tap closes the day. A wheel still coasting inside its 90 ms
// settle window has not written its hidden node yet, so every PENDING settle runs now,
// before persistLogFields reads the nodes, and its timer is cleared so nothing commits once
// the overlay is gone. A live _iawT means scrolled and not yet committed (the settle clears
// it); an untouched or already settled wheel is left alone and never writes.
function iaWheelFlush(root){
  var cols=(root||document).querySelectorAll('.iaw-col');
  for(var i=0;i<cols.length;i++){ var c=cols[i];
    if(c._iawT&&c._iawSettle){ clearTimeout(c._iawT); c._iawSettle(); } }
}
// Idempotent: safe to call after any re-render. Seeds each column from the hidden
// input's current value and paints the selected row without committing.
function iaWheelInit(root){"""
EDITS.append(('A1 iaWheelFlush helper', A1_OLD, A1_NEW))

# ---- A2 (P): named settle step that clears its own handle ---------------------------------
A2_OLD = """      var raf=0;
      col.addEventListener('scroll',function(){
        if(!raf) raf=(window.requestAnimationFrame||setTimeout)(function(){ raf=0; _iawShape(col); });
        clearTimeout(col._iawT);
        col._iawT=setTimeout(function(){ _iawRecenter(col); _iawShape(col); _iawCommit(w); },90);
      },{passive:true});"""
A2_NEW = """      var raf=0;
      // V221 (D179): the settle is a named step so iaWheelFlush can run a pending one early.
      col._iawSettle=function(){ col._iawT=0; _iawRecenter(col); _iawShape(col); _iawCommit(w); };
      col.addEventListener('scroll',function(){
        if(!raf) raf=(window.requestAnimationFrame||setTimeout)(function(){ raf=0; _iawShape(col); });
        clearTimeout(col._iawT);
        col._iawT=setTimeout(col._iawSettle,90);
      },{passive:true});"""
EDITS.append(('A2 named settle step', A2_OLD, A2_NEW))

# ---- A3 (P call)(Q)(R): handleDayStatus ---------------------------------------------------
A3_OLD = """function handleDayStatus(dayKey,title,status){
  snapshotDay(currentWeek,dayKey);
  persistLogFields(dayKey);
  const c=getCompleted();const k=completedKey(currentWeek,dayKey);
  const wasSame=!!c[k]&&statusOf(currentWeek,dayKey)===status;
  if(wasSame){
    delete c[k];
    saveCompleted(c);renderWeekView();
    renderStatusFoot(dayKey,title);
    if(status==='complete'){
      const f=finalScheduledDay();
      if(f&&f.week===currentWeek&&f.d===dayKey) releaseSeasonShown();
    }
    showToast('Unmarked');
    return;
  }
  c[k]={title:title||null,ts:Date.now(),status};
  saveCompleted(c);renderWeekView();
  renderStatusFoot(dayKey,title);
  const labels={complete:'Done ✓',skipped:'Skipped ✕ — the week moves on'};
  showToast(labels[status]||'Updated ✓');
  if(status==='complete') fireCompletionPopup(currentWeek,dayKey);
}"""
A3_NEW = """function handleDayStatus(dayKey,title,status){
  snapshotDay(currentWeek,dayKey);
  // V221 (D179): a status-setting tap closes the day, so a run wheel still settling commits
  // first; the saved log at the moment of close is the log. statusOf===status is the undo
  // tap (wasSame below), which stays on the day and keeps the wheel's own settle.
  if(statusOf(currentWeek,dayKey)!==status) iaWheelFlush(document.getElementById('detailOverlay'));
  persistLogFields(dayKey);
  const c=getCompleted();const k=completedKey(currentWeek,dayKey);
  const wasSame=!!c[k]&&statusOf(currentWeek,dayKey)===status;
  if(wasSame){
    delete c[k];
    saveCompleted(c);renderWeekView();
    renderStatusFoot(dayKey,title);
    if(status==='complete'){
      const f=finalScheduledDay();
      if(f&&f.week===currentWeek&&f.d===dayKey) releaseSeasonShown();
    }
    showToast('Unmarked');
    return;
  }
  c[k]={title:title||null,ts:Date.now(),status};
  saveCompleted(c);renderWeekView();
  renderStatusFoot(dayKey,title);
  const labels={complete:'Done ✓',skipped:'Skipped ✕ The week moves on'};
  // V221 (D179): setting a status closes the session. The rest clock stops and zeroes (‹ Back
  // and tab moves are navigation and keep it running, see ruResetIfIdle); the overlay closes
  // through ‹ Back's own exit, so the day lands on This Week; the pop-up sits over the week.
  // The toast prints only when no pop-up covers it: Done always raises one and prints none,
  // Skip raises none and keeps its toast.
  ruReset();
  closeDetail();
  if(status==='complete') fireCompletionPopup(currentWeek,dayKey);
  if(!document.getElementById('popOverlay').classList.contains('show')) showToast(labels[status]||'Updated ✓');
}"""
EDITS.append(('A3 handleDayStatus', A3_OLD, A3_NEW))

# assert every anchor before writing anything
for name, old, new in EDITS:
    n = src.count(old)
    print('%-28s count=%d' % (name, n))
    if n != 1:
        sys.exit('ABORT: anchor %s count=%d (need 1); nothing written' % (name, n))
    if old == new:
        sys.exit('ABORT: anchor %s is a no-op' % name)

out = src
for name, old, new in EDITS:
    if out.count(old) != 1:
        sys.exit('ABORT: anchor %s drifted mid-script; nothing written' % name)
    out = out.replace(old, new, 1)

# post-conditions
assert out.count('function iaWheelFlush(') == 1
assert out.count('col._iawT=setTimeout(col._iawSettle,90);') == 1
assert out.count("Skipped ✕ The week moves on'};") == 1
assert out.count("Skipped ✕ — the week moves on") == 1          # resolveReminder's twin, parked for §12
assert '<meta name="ia-version" content="220">' in out              # no bump in S6

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE', PATH, 'bytes', len(out.encode('utf-8')), 'delta', len(out.encode('utf-8')) - len(src.encode('utf-8')))
