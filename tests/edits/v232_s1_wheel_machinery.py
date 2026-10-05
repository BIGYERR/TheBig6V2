#!/usr/bin/env python3
# V232 P-RUNWHEEL, builder slice 1 of 4: wheel machinery. No ia-version bump (slice 3 bumps to 232).
# Ruling: tests/measure/v232_rulings/v232_ruling_d199_d206.md (D199, D200, D203) and
#         tests/measure/v232_rulings/v232_session_calls.md items 7 and 8 (call 8 = seed-face guard).
#   E1  _IAW_SPEC gains kind `hms` (D199): H:MM:SS, hours 0..9 carries the dash, mm/ss wrap.
#   E2  _iawParse: (a) dec3 regex takes an optional whole (D203); (b) hms branch reads stored decimal minutes (D200).
#   E3  _iawFormat: hms emits decimal minutes to two places (D200).
#   E4  iaWheelInit records the face it actually landed on; _iawCommit does not write until the wheel
#       has rested on a different face (session call 8).
# Every anchor is asserted count==1 before anything is written; the first miss aborts the whole script.
import sys, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
F = ROOT / 'index.html'
src = F.read_text(encoding='utf-8')

EDITS = []

# ---- E1: _IAW_SPEC gains hms ----
EDITS.append(('E1 _IAW_SPEC hms',
r"""  rept:{fmt:'clock', cap:'Typical rep',  cols:[{min:0,max:9, nil:true},{min:0,max:59,pad:2}]}
};""",
r"""  rept:{fmt:'clock', cap:'Typical rep',  cols:[{min:0,max:9, nil:true},{min:0,max:59,pad:2}]},
  // V232 (D199): run time as a clock with hours. 0..9 hours covers every finish under 10:00:00,
  // the file's one ceiling on logged cardio minutes (max="600" on the rest-day sheet). Hours
  // carries the dash and does not wrap; minutes and seconds wrap (derived from nil, D5).
  hms: {fmt:'hms',   cap:'Time',         cols:[{min:0,max:9, nil:true},{min:0,max:59,pad:2},{min:0,max:59,pad:2}]}
};"""))

# ---- E2a: dec3 regex takes an optional whole (D203) ----
EDITS.append(('E2a dec3 optional whole',
r"""    var m3=s.match(/^(\d+)(?:\.(\d)(\d)?)?/);
    if(!m3) return ['','',''];""",
r"""    // V232 (D203): the whole is optional, so a keypad's .86 seeds 0 . 8 6 rather than the
    // dash; an empty whole reads 0. A string with no digits at the front still lands on the dash.
    var m3=s.match(/^(\d*)(?:\.(\d)(\d)?)?/);
    if(!m3||m3[0]==='') return ['','',''];"""))

# ---- E2b: hms branch in _iawParse (D200) ----
EDITS.append(('E2b _iawParse hms',
r"""  var sp=_IAW_SPEC[kind], s=String(val==null?'':val).trim();
  if(!s) return sp.fmt==='dec3'?['','','']:['',''];""",
r"""  var sp=_IAW_SPEC[kind], s=String(val==null?'':val).trim();
  // V232 (D200): run minutes stay stored as DECIMAL MINUTES; this reads them back as a clock.
  // A bare integer, a decimal or a leading-dot decimal (D203); never a colon. Rounded to the
  // nearest second, so a two-place value lands on the second the athlete left the wheel on.
  // Hours above 9 clamp for display only. Empty or malformed lands on the dash.
  if(sp.fmt==='hms'){
    var mh=s.match(/^\d*(?:\.\d+)?/);
    if(!mh||mh[0]==='') return ['','',''];
    var t=Math.round(parseFloat(mh[0])*60);
    var hh=Math.min(sp.cols[0].max,Math.floor(t/3600));
    return [String(hh),String(Math.floor((t%3600)/60)),String(t%60)];
  }
  if(!s) return sp.fmt==='dec3'?['','','']:['',''];"""))

# ---- E3: hms branch in _iawFormat (D200) ----
EDITS.append(('E3 _iawFormat hms',
r"""  var b=vals[1]===''?'0':vals[1];
  if(sp.fmt==='dec3'){""",
r"""  var b=vals[1]===''?'0':vals[1];
  // V232 (D200): h:mm:ss -> decimal minutes to two places (7:30 -> 7.50, 15:20 -> 15.33).
  // Two places is exact at the one-second grain: the error is at most 0.3 s.
  if(sp.fmt==='hms'){ var sx=vals[2]===''||vals[2]==null?'0':vals[2]; return ((+vals[0])*60+(+b)+(+sx)/60).toFixed(2); }
  if(sp.fmt==='dec3'){"""))

# ---- E4a: iaWheelInit collects the rows each column actually lands on ----
EDITS.append(('E4a iaWheelInit landed decl',
r"""    var seed=_iawParse(kind, h?h.value:'');
    var cols=w.querySelectorAll('.iaw-col');
    for(var i=0;i<cols.length;i++){ (function(col,ci){""",
r"""    var seed=_iawParse(kind, h?h.value:'');
    var cols=w.querySelectorAll('.iaw-col'), landed=[];
    for(var i=0;i<cols.length;i++){ (function(col,ci){"""))

EDITS.append(('E4b iaWheelInit landed row',
r"""      for(var k=home;k<items.length;k++) if(items[k].getAttribute('data-v')===seed[ci]){ idx=k; break; }
""",
r"""      for(var k=home;k<items.length;k++) if(items[k].getAttribute('data-v')===seed[ci]){ idx=k; break; }
      landed[ci]=items[idx]?items[idx].getAttribute('data-v'):'';
"""))

EDITS.append(('E4c iaWheelInit seed face',
r"""      (window.requestAnimationFrame||setTimeout)(function(){ col.scrollTop=idx*_IAW_ROW; _iawSel(col); _iawShape(col); });
    })(cols[i],i); }
  })(wheels[n]); }""",
r"""      (window.requestAnimationFrame||setTimeout)(function(){ col.scrollTop=idx*_IAW_ROW; _iawSel(col); _iawShape(col); });
    })(cols[i],i); }
    // V232 (session call 8): the face this wheel actually shows after seeding. Not the parsed
    // seed: a value with no matching row lands on home, and the face is what the eye sees.
    w._iawSeedFace=_iawFormat(kind,landed);
  })(wheels[n]); }"""))

# ---- E4d: _iawCommit seed-face guard ----
EDITS.append(('E4d _iawCommit guard',
r"""  var next=_iawFormat(kind,vals);
  if(h.value===next) return;""",
r"""  var next=_iawFormat(kind,vals);
  // V232 (session call 8): browsers fire scroll for a programmatic scrollTop, so the seed frame
  // and a recentre reach this settle on open. Until the wheel has rested on a face other than
  // the one it was seeded on, nothing is written: opening a day never writes, whatever the
  // stored string. The first rest elsewhere marks it moved; from then on only the dedupe gates.
  if(!w._iawMoved){ if(next===w._iawSeedFace) return; w._iawMoved=true; }
  if(h.value===next) return;"""))

# ---- verify every anchor before writing anything ----
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        sys.exit('ABORT: anchor %r count=%d (expected 1); nothing written' % (name, n))
out = src
for name, old, new in EDITS:
    assert out.count(old) == 1, name
    out = out.replace(old, new, 1)
    print('applied', name)
assert '<meta name="ia-version" content="231">' in out, 'slice 1 must not bump ia-version'
F.write_text(out, encoding='utf-8')
print('wrote', F, len(src), '->', len(out))
