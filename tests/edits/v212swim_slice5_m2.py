#!/usr/bin/env python3
# V212 slice 5 — M2 (Mario: "Make it required"; coach's exact text). Runs on slices 1-3.
# The D9 mile-validation pattern: one validator returning {ok,msg,...}, an inline advisory div,
# an update...Advisory() on input, and a doGenerate refusal. No button is disabled.
#   1+3  _swimEntryState(g), _swimAdvisoryHTML(), updateSwimAdvisory(), placed right after the
#        D9 mile trio (before doGenerate). Only swim_500_time and swim_100_time are checked. Rules
#        in coach's order: a field that is not a finite number, or seconds >= 60; the 500 blank or
#        zero; on the 100 goal the 100 blank or zero; on the 100 goal base500/5 < the 100. A blank
#        field reads as 0 so it falls to the blank rule; "blank or zero" is a total that is not
#        above 0 (the engine's own bTotal > 0 test). No numeric bounds.
#   2    the wizard swim step: the label loses "(optional)", both inputs call updateSwimAdvisory(),
#        the advisory div follows the first block, and the 100 goal ONLY gets a second block under
#        it: the 500 label, coach's one line above the inputs, inputs writing base500Mins/Secs.
#   4    doGenerate: the swim check right after the D9 refusal.
# No ia-version bump. Aborts on the first anchor miss, before writing anything.
import io, sys
IDX = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'

A1 = "function doGenerate(){\n  // V176 (D9): impossible mile entries stop here, before anything builds.\n"
B1 = """// D110a M2 (V212, Mario: make it required): a swim time goal needs a real current time. One
// validator in the D9 shape, shared by the advisory and the doGenerate refusal. The 500 goal reads
// baseMins/baseSecs; the 100 goal reads baseMins/baseSecs (the 100) and base500Mins/base500Secs.
function _swimEntryState(g){
  if(g===undefined) g=(typeof WD!=='undefined'&&WD.cardioGoals)?WD.cardioGoals.swim:null;
  if(!g||(g.id!=='swim_500_time'&&g.id!=='swim_100_time')) return {ok:true};
  const unit=g.swimUnit||'yd', is100=g.id==='swim_100_time';
  const num=v=>(v===undefined||v===null||v==='')?0:+v;
  const fields=is100?['baseMins','baseSecs','base500Mins','base500Secs']:['baseMins','baseSecs'];
  for(const k of fields){ const v=num(g[k]); if(!isFinite(v)||(/Secs$/.test(k)&&v>=60)) return {ok:false,msg:'That is not a real time. Check the minutes and seconds.'}; }
  const tot=(m,s)=>num(g[m])*60+num(g[s]);
  const t500=is100?tot('base500Mins','base500Secs'):tot('baseMins','baseSecs');
  if(!(t500>0)) return {ok:false,blank:true,msg:'Required. Enter your most recent timed 500'+unit+'.'};
  if(is100){
    const t100=tot('baseMins','baseSecs');
    if(!(t100>0)) return {ok:false,blank:true,msg:'Required. Enter your most recent timed 100'+unit+'.'};
    if(t500/5<t100) return {ok:false,msg:'Your 500 pace is faster than your 100 time. Check both entries.'};
  }
  return {ok:true};
}
function _swimAdvisoryHTML(){
  const st=_swimEntryState(); const t=st.ok?'':(st.msg||'');
  return '<div id="swimAdvisory" style="font-size:11px;line-height:1.45;margin-top:6px;display:'+(t?'block':'none')+';color:'+(st.blank?'var(--muted)':'var(--signal)')+'">'+t+'</div>';
}
function updateSwimAdvisory(){
  const el=document.getElementById('swimAdvisory'); if(!el) return;
  const st=_swimEntryState(); const t=st.ok?'':(st.msg||'');
  el.textContent=t; el.style.display=t?'block':'none';
  el.style.color=st.blank?'var(--muted)':'var(--signal)';
}
""" + A1

A4 = "  if(!_mv.ok){ showToast(_mv.msg); showScreen('screenWizard'); renderWizardStep(); return; }\n  showScreen('screenGenerate');\n"
B4 = """  if(!_mv.ok){ showToast(_mv.msg); showScreen('screenWizard'); renderWizardStep(); return; }
  // D110a M2 (V212): a swim time goal with no real current time stops here too.
  const _sv=_swimEntryState(WD.cardioGoals&&WD.cardioGoals.swim); if(!_sv.ok){ showToast(_sv.msg); showScreen('screenWizard'); renderWizardStep(); return; }
  showScreen('screenGenerate');
"""

IN_MIN = """<input type="number" class="input-field" style="text-align:center;flex:1" placeholder="min" value="${g.baseMins||''}" oninput="WD.cardioGoals['swim'].baseMins=this.value" min="0" max="99">"""
IN_SEC = """<input type="number" class="input-field" style="text-align:center;flex:1" placeholder="sec" value="${g.baseSecs||''}" oninput="WD.cardioGoals['swim'].baseSecs=this.value" min="0" max="59">"""
COLON = """<div style="font-size:20px;color:var(--muted);font-weight:300;flex-shrink:0">:</div>"""
A2 = ("""            <div style="margin-top:8px">
              <div class="input-label" style="margin-bottom:6px">Your current ${SWIM_GOAL_DIST[g.id]}${g.swimUnit||'yd'} time? (optional)</div>
              <div style="display:flex;align-items:center;gap:6px">
                """ + IN_MIN + """
                """ + COLON + """
                """ + IN_SEC + """
              </div>
            </div>` : g.id==='run_pace_goal' ? `""")
B2 = ("""            <div style="margin-top:8px">
              <div class="input-label" style="margin-bottom:6px">Your most recent timed ${SWIM_GOAL_DIST[g.id]}${g.swimUnit||'yd'}</div>
              <div style="display:flex;align-items:center;gap:6px">
                """ + IN_MIN.replace("baseMins=this.value\"", "baseMins=this.value;updateSwimAdvisory()\"") + """
                """ + COLON + """
                """ + IN_SEC.replace("baseSecs=this.value\"", "baseSecs=this.value;updateSwimAdvisory()\"") + """
              </div>${_swimAdvisoryHTML()}
            </div>${g.id==='swim_100_time' ? `
            <div style="margin-top:8px">
              <div class="input-label" style="margin-bottom:6px">Your most recent timed 500${g.swimUnit||'yd'}</div>
              <div style="font-size:11px;line-height:1.45;color:var(--muted);margin-bottom:6px">Your repeats key off your 500 pace. Your 100 time sets the goal.</div>
              <div style="display:flex;align-items:center;gap:6px">
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="min" value="${g.base500Mins||''}" oninput="WD.cardioGoals['swim'].base500Mins=this.value;updateSwimAdvisory()" min="0" max="99">
                """ + COLON + """
                <input type="number" class="input-field" style="text-align:center;flex:1" placeholder="sec" value="${g.base500Secs||''}" oninput="WD.cardioGoals['swim'].base500Secs=this.value;updateSwimAdvisory()" min="0" max="59">
              </div>
            </div>` : ''}` : g.id==='run_pace_goal' ? `""")

EDITS = [('1+3 validator, advisory, update', A1, B1), ('2 wizard swim step', A2, B2), ('4 doGenerate refusal', A4, B4)]
src = io.open(IDX, encoding='utf-8').read()
if src.count('<meta name="ia-version" content="211">') != 1:
    print('ABORT: index.html is not ia-version 211'); sys.exit(1)
for pre in ('const intPace = weekPace - 2;', "const _anchorLine = swimPace._baseEntered ? '' : ", "_put('base500',_t500)"):
    if src.count(pre) != 1:
        print('ABORT: slices 1-3 are not on the tree (missing ' + pre[:40] + ')'); sys.exit(1)
if 'function _swimEntryState' in src:
    print('ABORT: _swimEntryState already exists'); sys.exit(1)
for tag, a, b in EDITS:
    n = src.count(a)
    if n != 1:
        print('ABORT:', tag, 'anchor count', n); sys.exit(1)
for tag, a, b in EDITS:
    src = src.replace(a, b, 1); print('OK', tag)
io.open(IDX, 'w', encoding='utf-8').write(src)
print('WROTE', IDX, len(src.encode('utf-8')), 'bytes')
