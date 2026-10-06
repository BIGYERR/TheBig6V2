#!/usr/bin/env python3
# V233 P-BIKEWHEEL, builder slice 1: the bike form's wheel, the shared hms face clamp, the version bump.
# Ruling: tests/measure/v233_rulings/v233_ruling_d207_d211.md
#   D207 "Every bike wheel parks on the dash when storage is blank. No plan face on any bike shape."
#        "iaWheelHTML('hms','log_bike_mins',e.bike_mins||'') with no fifth argument, so no data-plan
#        lands on any bike wheel."
#   D208 "clamp t to cols[0].max*3600 + cols[1].max*60 + cols[2].max seconds (9:59:59), computed from
#        _IAW_SPEC.hms.cols, not a hand constant." Shared with the run wheel.
#   D209 AS AMENDED BY MARIO (tests/measure/v233_rulings/v233_session_calls.md item 6): label
#        `Log the ride` (bike icon in front), NO sub-label on any shape; the hms kind's own `Time` cap stays.
#   D210 the bike wheel sits in `<div class="iaw-wrap iaw-solo">`, the run time form's markup; no new
#        CSS; the hidden input keeps id="log_bike_mins".
#   D211 scope: the bike branch plus the shared clamp, nothing else. Mario named the build V233.
#   E1  cardioFieldHTML bike branch: number box -> one hms wheel on the dash, label `Log the ride`.
#   E2  _iawParse hms branch: hours-only clamp -> whole-face clamp to the ceiling from sp.cols.
#   E3  ia-version 232 -> 233, last.
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
F = ROOT / 'index.html'
src = F.read_text(encoding='utf-8')

# ---- E1: bike branch of cardioFieldHTML (D207, D209 as amended, D210) ----
E1_OLD = r"""  if(sport==='bike') return (dose?_doseStripHTML('bike',dose,sub||''):'')+`<label>${asyIcon('bike',15)} Bike — actual duration</label>
        <input type="number" id="log_bike_mins" placeholder="minutes" value="${e.bike_mins||''}" min="0" class="input-field">`;"""
E1_NEW = r"""  // V233 (D207, D209 as amended, D210): one hms wheel alone in the stacked wrap, the run time
  // form's markup. No plan argument, so every bike shape parks on the dash until a ride is
  // stored; the strip above carries the plan. No sub-label (Mario). The hidden input keeps
  // the id log_bike_mins, so both listener arrays and persistLogFields read it unchanged.
  if(sport==='bike') return (dose?_doseStripHTML('bike',dose,sub||''):'')+`<label>${asyIcon('bike',15)} Log the ride</label>
        <div class="iaw-wrap iaw-solo">${iaWheelHTML('hms','log_bike_mins',e.bike_mins||'')}</div>`;"""

# ---- E2: _iawParse hms branch, whole-face clamp (D208) ----
E2_OLD = r"""  // Hours above 9 clamp for display only. Empty or malformed lands on the dash.
  if(sp.fmt==='hms'){
    var mh=s.match(/^\d*(?:\.\d+)?/);
    if(!mh||mh[0]==='') return ['','',''];
    var t=Math.round(parseFloat(mh[0])*60);
    var hh=Math.min(sp.cols[0].max,Math.floor(t/3600));
    return [String(hh),String(Math.floor((t%3600)/60)),String(t%60)];
  }"""
E2_NEW = r"""  // V233 (D208): above the dial's ceiling the whole face pegs there (9:59:59, from the column
  // maxes), for display only. Empty or malformed lands on the dash.
  if(sp.fmt==='hms'){
    var mh=s.match(/^\d*(?:\.\d+)?/);
    if(!mh||mh[0]==='') return ['','',''];
    var t=Math.round(parseFloat(mh[0])*60);
    t=Math.min(t,sp.cols[0].max*3600+sp.cols[1].max*60+sp.cols[2].max);
    return [String(Math.floor(t/3600)),String(Math.floor((t%3600)/60)),String(t%60)];
  }"""

# ---- E3: version bump, last ----
E3_OLD = '<meta name="ia-version" content="232">'
E3_NEW = '<meta name="ia-version" content="233">'

EDITS = [('E1 bike branch wheel', E1_OLD, E1_NEW),
         ('E2 hms face clamp', E2_OLD, E2_NEW),
         ('E3 ia-version 233', E3_OLD, E3_NEW)]

for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (expected 1); nothing written' % (name, n))
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('applied', name)
assert out.count(E3_NEW) == 1 and out.count(E3_OLD) == 0, 'version meta'
assert out.count('iaw-solo') == src.count('iaw-solo') + 1, 'exactly one new iaw-solo wrap'
assert out.count('.iaw-solo{') == 1, 'still exactly one .iaw-solo CSS rule'
assert out.count('log_bike_mins') == src.count('log_bike_mins') + 1, 'id in markup + one comment mention'
assert 'Bike — actual duration' not in out, 'old label gone'
F.write_text(out, encoding='utf-8')
print('wrote', F, len(src), '->', len(out))
