#!/usr/bin/env python3
# V232 P-RUNWHEEL, builder slice 2 of 4: the dosed run forms and the plan seed. No ia-version bump.
# Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md (D199, D201, D202, D204, D206) with
#         tests/measure/v232_rulings/v232_session_calls.md item 7 (Mario: plan on the fixed wheel, dash on
#         the free wheel; "Hours first." dropped) and item 8 (seed-face guard, built in slice 1).
#   E5  iaWheelHTML takes an optional plan (after capOverride), emitted as data-plan on .iaw, omitted when empty.
#   E6  iaWheelInit seeds from the hidden value when non-empty, else data-plan, else '' (display only).
#   E7  cardioFieldHTML time + dist branches: stacked wheels, fixed dimension first, new copy.
#   E8  cardioFieldHTML reps_time branch: the miles box becomes a dist wheel on the dash, new copy.
# Markup only: no CSS here (slice 3 owns the width rule and the bump).
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
F = ROOT / 'index.html'
src = F.read_text(encoding='utf-8')

EDITS = []

# ---- E5: iaWheelHTML plan argument -> data-plan ----
EDITS.append(('E5a iaWheelHTML signature',
r"""function iaWheelHTML(kind, hiddenId, val, capOverride){
  var sp=_IAW_SPEC[kind];""",
r"""// V232 (D202): `plan` is the fixed dimension's planned value. It rides on the wheel as
// data-plan and seeds the face when storage is blank; it is display only, never written.
function iaWheelHTML(kind, hiddenId, val, capOverride, plan){
  var sp=_IAW_SPEC[kind];"""))

EDITS.append(('E5b iaWheelHTML data-plan',
r"""    + '<div class="iaw" data-kind="'+kind+'" data-for="'+hiddenId+'"><div class="iaw-shade"></div><div class="iaw-band"></div>'+cols+'</div>'""",
r"""    + '<div class="iaw" data-kind="'+kind+'" data-for="'+hiddenId+'"'+(plan==null||plan===''?'':' data-plan="'+String(plan).replace(/"/g,'&quot;')+'"')+'><div class="iaw-shade"></div><div class="iaw-band"></div>'+cols+'</div>'"""))

# ---- E6: iaWheelInit seed source ----
EDITS.append(('E6 iaWheelInit seed source',
r"""    var seed=_iawParse(kind, h?h.value:'');""",
r"""    // V232 (D202): blank storage seeds from the plan when the wheel carries one. Display only:
    // the plan face becomes the seed face, so _iawCommit's guard keeps an untouched open unwritten.
    var hv=h?h.value:'', seed=_iawParse(kind, hv!==''?hv:(w.getAttribute('data-plan')||''));"""))

# ---- E7: time and dist branches (contiguous) ----
EDITS.append(('E7 time + dist branches',
r"""    if(dose.k==='time') return strip+`<label>${asyIcon('run',15)} Run — log the session</label>
        <div class="log-row">
          <div><input type="number" inputmode="decimal" id="log_run_mins" placeholder="${dose.mins}" value="${e.run_mins||''}" min="0" style="${_DOSE_INPUT_STYLE}"><div class="f-sub">actual minutes · blank = as planned</div></div>
          <div><input type="number" inputmode="decimal" id="log_run_dist" placeholder="miles" value="${e.run_dist||''}" step="0.01" min="0" style="${_DOSE_INPUT_STYLE}"><div class="f-sub">distance — off the watch</div></div>
        </div>
        <div id="doseDerived"></div>`;
    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Run — log the session</label>
        <div class="log-row">
          <div><input type="number" inputmode="decimal" id="log_run_dist" placeholder="${dose.mi}" value="${e.run_dist||''}" step="0.01" min="0" style="${_DOSE_INPUT_STYLE}"><div class="f-sub">actual miles · blank = as planned</div></div>
          <div><input type="number" inputmode="decimal" id="log_run_mins" placeholder="minutes" value="${e.run_mins||''}" min="0" style="${_DOSE_INPUT_STYLE}"><div class="f-sub">time — off the watch</div></div>
        </div>
        <div id="doseDerived"></div>`;""",
r"""    // V232 (D199, D201, D202, D206): two wheels, stacked (two three-column wheels side by side
    // are six columns, under the 44pt target at 375pt). The fixed dimension comes first and is
    // seeded from the plan for display; the free dimension parks on the dash.
    if(dose.k==='time') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap">${iaWheelHTML('hms','log_run_mins',e.run_mins||'',null,dose.mins)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;
    if(dose.k==='dist') return strip+`<label>${asyIcon('run',15)} Log the run</label>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'',null,dose.mi)}</div>
        <div class="f-sub">Shows the plan. Move it to match the watch.</div>
        <div class="iaw-wrap">${iaWheelHTML('hms','log_run_mins',e.run_mins||'')}</div>
        <div class="f-sub">Off the watch.</div>
        <div id="doseDerived"></div>`;"""))

# ---- E8: reps_time branch ----
EDITS.append(('E8 reps_time branch',
r"""        <label>Distance covered — work reps total</label>
        <input type="number" inputmode="decimal" id="log_run_dist" placeholder="miles" value="${e.run_dist||''}" step="0.01" min="0" style="${_DOSE_INPUT_STYLE};max-width:150px">
        <div class="f-sub">exclude the easy jog between reps</div>""",
r"""        <label>Miles in the work reps</label>
        <div class="iaw-wrap">${iaWheelHTML('dist','log_run_dist',e.run_dist||'')}</div>
        <div class="f-sub">Leave out the easy jog between reps.</div>"""))

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (expected 1); nothing written' % (name, n))
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('applied', name)
assert '<meta name="ia-version" content="231">' in out, 'slice 2 must not bump ia-version'
F.write_text(out, encoding='utf-8')
print('wrote', F, len(src), '->', len(out))
