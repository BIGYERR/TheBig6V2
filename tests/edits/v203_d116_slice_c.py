#!/usr/bin/env python3
# V203 slice C — D116, the mile pencil.
# E1 mileOverlay + mileLockOverlay markup   E2 the pencil on the Run paces group
# E3 openMileSheet / closeMileSheet / commitMileChange
# E4 _mileEntryState(g, exp) — one validator for wizard and sheet
# No ia-version bump in this slice (V203 bumps in the final slice).
import io, sys, os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
SRC = os.path.normpath(SRC)
with io.open(SRC, encoding='utf-8') as f:
    html = f.read()

EDITS = []
def sub(tag, old, new):
    EDITS.append((tag, old, new))

# ── E1 ────────────────────────────────────────────────────────────────────────
# Two overlays as siblings of goalOverlay, same rand-overlay chrome and the same
# open/close class convention openGoalSheet/closeGoalSheet use.
E1_OLD = '''<div class="rand-overlay" id="goalOverlay">
  <div class="rand-header">
    <button class="back-btn" onclick="closeGoalSheet()">← Back</button>
  </div>
  <div class="rand-body" id="goalBody"></div>
</div>
'''
E1_NEW = '''<div class="rand-overlay" id="goalOverlay">
  <div class="rand-header">
    <button class="back-btn" onclick="closeGoalSheet()">← Back</button>
  </div>
  <div class="rand-body" id="goalBody"></div>
</div>

<!-- D116 (V203): the mile pencil. Two sheets, one pencil. mileOverlay edits the
     anchor; mileLockOverlay is what the last three weeks of a program show
     instead. The lock is evaluated at tap in openMileSheet, never at render. -->
<div class="rand-overlay" id="mileOverlay">
  <div class="rand-header">
    <button class="back-btn" onclick="closeMileSheet()">← Back</button>
  </div>
  <div class="rand-body">
    <div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.03em;color:var(--text)">YOUR MILE</div>
    <div id="mileSheetIntro" style="font-size:13px;color:var(--text);line-height:1.5;margin-top:6px"></div>
    <div style="display:flex;gap:6px;margin-top:12px">
      <input type="number" class="input-field" id="mileSheetMins" style="flex:1;text-align:center" placeholder="min" min="0" max="99">
      <input type="number" class="input-field" id="mileSheetSecs" style="flex:1;text-align:center" placeholder="sec" min="0" max="59">
    </div>
    <div style="display:flex;gap:8px;margin-top:14px">
      <button id="mileCommitBtn" class="prog-action-btn primary" style="flex:1" onclick="commitMileChange()">Update my mile</button>
      <button class="prog-action-btn" style="flex:1" onclick="closeMileSheet()">Keep what I have</button>
    </div>
  </div>
</div>

<div class="rand-overlay" id="mileLockOverlay">
  <div class="rand-header">
    <button class="back-btn" onclick="closeMileSheet()">← Back</button>
  </div>
  <div class="rand-body" id="mileLockBody"></div>
</div>
'''
sub('E1 overlays', E1_OLD, E1_NEW)

# ── E2 ────────────────────────────────────────────────────────────────────────
# The pencil, identical in form to the cardio-row pencil two lines up. Rendered
# only when there is a runAnchor that is not the beginner default: run_base has
# no runAnchor at all, so it never reaches this branch.
E2_OLD = '''      <div class="det-group"><div class="det-label">Run paces</div><div class="det-paces">'''
E2_NEW = '''      <div class="det-group"><div class="det-label" style="display:inline-flex;align-items:center;gap:7px">Run paces${s.runAnchor.kind!=='beginner'?`<button onclick="event.stopPropagation();openMileSheet('${p.id}')" aria-label="Change mile time" style="background:none;border:none;cursor:pointer;color:var(--muted);padding:2px;display:flex;align-items:center">${asyIcon('pencil',14)}</button>`:''}</div><div class="det-paces">'''
sub('E2 pencil', E2_OLD, E2_NEW)

# ── E3 ────────────────────────────────────────────────────────────────────────
# Sited directly after commitGoalChange: the mile sheet mirrors it line for line
# (cfg edit, save, refresh if active, close, re-list, toast).
E3_OLD = '''  closeGoalSheet();
  renderProgList();
  showToast('Goal switched. Program rebuilt from this week.');
}
function toggleProgCard(id){'''
E3_NEW = '''  closeGoalSheet();
  renderProgList();
  showToast('Goal switched. Program rebuilt from this week.');
}
// ── D116 (V203): THE MILE PENCIL ──────────────────────────────────────────────
// Same architecture as D5: the cfg edit IS the feature. mileBestMins/Secs go in
// as typed and interpolate through paceChartLookup exactly as a wizard entry
// does — no snap to a chart row, no cap on the move, no cooldown. The per-day
// freeze protects every trained day; untrained days rebuild off the new row.
// mileBestSrc.from is ALWAYS written, including when the prior anchor was the
// experience default, so runAnchorSentence can name what it replaced.
var _mileDraft=null;
function openMileSheet(progId){
  const p=getPrograms().find(x=>x.id===progId); if(!p) return;
  const tw=p.totalWeeks||6;
  const curWk=_goalCurWeek(p);
  // Evaluated AT TAP, never at render: a program that crosses into the window
  // while the Programs tab is open still locks.
  if(curWk >= tw - 2){
    const c=p.cfg||{};
    let facts='';
    if(c.raceDate){
      let rd=null; try{ rd=new Date(c.raceDate); }catch(_){ rd=null; }
      if(rd && !isNaN(rd.getTime())){
        const today=new Date(); today.setHours(0,0,0,0);
        const rdm=new Date(rd.getTime()); rdm.setHours(0,0,0,0);
        let rs=''; try{ rs=rd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch(_){ rs=String(c.raceDate); }
        facts+='<div class="det-row"><span class="k">Days out</span><span class="v">'+Math.round((rdm-today)/86400000)+'</span></div>';
        facts+='<div class="det-row"><span class="k">Race day</span><span class="v">'+rs+'</span></div>';
      }
    }
    facts+='<div class="det-row"><span class="k">Week</span><span class="v">'+curWk+' of '+tw+'</span></div>';
    const lb=document.getElementById('mileLockBody');
    if(lb) lb.innerHTML='<div style="font-family:var(--font-display);font-size:15px;font-weight:700;letter-spacing:0.03em;color:var(--accent)">THE ROW HOLDS</div>'
      +'<div class="det-group" style="margin-top:10px">'+facts+'</div>'
      +'<div style="font-size:13px;color:var(--text);line-height:1.5;margin-top:12px">You are too close to the race. Three weeks out the work is done. Changing your mile now would reset the pace of every session left, and those sessions have one job. Get you to the line fresh.</div>'
      +'<div style="display:flex;gap:8px;margin-top:14px"><button class="prog-action-btn primary" style="flex:1" onclick="closeMileSheet()">Got it</button></div>';
    const lo=document.getElementById('mileLockOverlay'); if(lo){ lo.classList.add('open'); lo.scrollTop=0; }
    return;
  }
  const g=((p.cfg&&p.cfg.cardioGoals)||{}).run||{};
  _mileDraft={progId:progId};
  const mEl=document.getElementById('mileSheetMins'), sEl=document.getElementById('mileSheetSecs');
  if(mEl) mEl.value=(g.mileBestMins!==undefined?g.mileBestMins:'');
  if(sEl) sEl.value=(g.mileBestSecs!==undefined?g.mileBestSecs:'');
  const intro=document.getElementById('mileSheetIntro');
  if(intro) intro.textContent='Put in the mile you can run today. Every run still ahead of you rebuilds off it. Weeks you have already trained stand as they are.';
  const o=document.getElementById('mileOverlay'); if(o){ o.classList.add('open'); o.scrollTop=0; }
}
function closeMileSheet(){
  const o=document.getElementById('mileOverlay'); if(o) o.classList.remove('open');
  const l=document.getElementById('mileLockOverlay'); if(l) l.classList.remove('open');
}
function commitMileChange(){
  if(!_mileDraft) return;
  const programs=getPrograms();
  const pi=programs.findIndex(x=>x.id===_mileDraft.progId); if(pi<0) return;
  const p=programs[pi];
  const mEl=document.getElementById('mileSheetMins'), sEl=document.getElementById('mileSheetSecs');
  const mRaw=mEl?String(mEl.value).trim():'', sRaw=sEl?String(sEl.value).trim():'';
  // A blank field blocks the commit. A pencil changes a number; it never un-anchors.
  if(mRaw===''||sRaw===''){ showToast('Put in both the minutes and the seconds.'); return; }
  const mm=+mRaw, ss=+sRaw;
  const st=_mileEntryState({mileBestMins:mRaw,mileBestSecs:sRaw},(p.cfg&&p.cfg.experience)||'intermediate');
  if(!st.ok){ showToast(st.msg); return; }
  const prev=((p.cfg.cardioGoals||{}).run)||{};
  const next={...prev, mileBestMins:String(mm), mileBestSecs:String(ss),
    mileBestSrc:{kind:'edited', at:new Date().toISOString().slice(0,10), wk:_goalCurWeek(p),
      from:{mins:prev.mileBestMins||'', secs:prev.mileBestSecs||'',
            kind:(prev.mileBestSrc&&prev.mileBestSrc.kind)||(prev.mileBestMins?'entered':'default')}}};
  p.cfg={...p.cfg,cardioGoals:{...(p.cfg.cardioGoals||{}),run:next}};
  savePrograms(programs);
  if(activeProgId===_mileDraft.progId){
    activeProg=refreshProgram(programs[pi]);
    currentWeek=calcCurrentWeek();
    try{ if(document.getElementById('screenWeek').classList.contains('active')) renderWeekView(); }catch(e){}
  }
  closeMileSheet();
  renderProgList();
  // Out-of-chart entries commit and are told what the clamp does, same as the wizard.
  showToast('Mile updated. Every run still ahead of you now reads from your new row.'+(st.adv?' '+st.adv:''));
}
function toggleProgCard(id){'''
sub('E3 functions', E3_OLD, E3_NEW)

# ── E4 ────────────────────────────────────────────────────────────────────────
# One validator, two callers. The wizard's three existing call sites pass nothing
# and fall through to WD exactly as before. The six literal strings are untouched.
E4_OLD = '''function _mileEntryState(){
  const g=WD.cardioGoals&&WD.cardioGoals.run;
  if(!g||WD.experience==='beginner') return {ok:true};
'''
E4_NEW = '''function _mileEntryState(g, exp){
  // V203 (D116): (g, exp) default to the wizard draft so the mid-program mile
  // sheet and the wizard share ONE validator and one set of strings.
  if(g===undefined) g=(typeof WD!=='undefined'&&WD.cardioGoals)?WD.cardioGoals.run:null;
  if(exp===undefined) exp=(typeof WD!=='undefined')?WD.experience:'';
  if(!g||exp==='beginner') return {ok:true};
'''
sub('E4 validator', E4_OLD, E4_NEW)

# ── apply ─────────────────────────────────────────────────────────────────────
fail = False
for tag, old, new in EDITS:
    n = html.count(old)
    print('anchor %-16s count=%d' % (tag, n))
    if n != 1:
        print('  ABORT: anchor for %s matched %d times, expected 1' % (tag, n))
        fail = True
if fail:
    sys.exit(1)

for tag, old, new in EDITS:
    html = html.replace(old, new, 1)

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(html)
print('WROTE', SRC)
