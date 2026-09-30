#!/usr/bin/env python3
"""
V225 slice 4 (final): D187 R3 (mile required on non-beginner run_pace_goal) +
the ia-version bump to 225.

_mileEntryState's blank-mile early return currently returns {ok:true}
unconditionally. D110a's swim gate (_swimEntryState) is the model: blank on a
run_pace_goal is exactly the missing-anchor case the gate exists to catch, so
it now refuses with {ok:false, blank:true, msg:...}. Blank on any OTHER run
goal type is unaffected -- still {ok:true} as today. The beginner check
(`if(!g||exp==='beginner') return {ok:true};`, one line above) is left
byte-identical -- that's a separate future build, P-BEGINNERMILE.

_mileAdvisoryHTML / updateMileAdvisory: the advisory colour now goes muted
when st.blank is true (matching _swimAdvisoryHTML's/updateSwimAdvisory's
existing muted/signal branch exactly -- same var(--muted)/var(--signal) CSS
vars, no new class names), signal-colored otherwise.

doGenerate already calls _mileEntryState() and refuses with a toast when
!.ok -- confirmed correct, NOT edited in this slice.

Second call site (commitMileChange, the mid-program "update your mile"
sheet) already blocks blank mRaw/sRaw at its own guard BEFORE ever reaching
_mileEntryState, regardless of goal id -- confirmed correct, NOT edited in
this slice.

Version bump is the LAST replacement in this script, and the only
ia-version edit anywhere in the V225 build (slices 1-3 did not touch it).
"""
import pathlib

PATH = pathlib.Path("/Users/CanasBangin/Desktop/TheBig6V2/index.html")

src = PATH.read_text(encoding="utf-8")

# --- R3 core: blank-mile early return becomes goal-specific ---
anchor_blank = "  if(g.mileBestMins===undefined||g.mileBestMins==='') return {ok:true};"
assert src.count(anchor_blank) == 1, f"blank-mile anchor count != 1: {src.count(anchor_blank)}"
replacement_blank = (
    "  if(g.mileBestMins===undefined||g.mileBestMins===''){\n"
    "    // D187 R3 (V225): a run_pace_goal with no mile has no anchor to build the clock from --\n"
    "    // D110a's swim gate is the model. Every OTHER run goal type still passes through blank.\n"
    "    if(g.id==='run_pace_goal') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};\n"
    "    return {ok:true};\n"
    "  }"
)
src = src.replace(anchor_blank, replacement_blank, 1)

# --- Advisory colour: _mileAdvisoryHTML, mirror _swimAdvisoryHTML's muted/signal branch ---
anchor_html_color = (
    "  return '<div id=\"mileAdvisory\" style=\"font-size:11px;line-height:1.45;margin-top:6px;"
    "display:'+(t?'block':'none')+';color:'+(st.msg?'var(--signal)':'var(--muted)')+'\">'+t+'</div>';"
)
assert src.count(anchor_html_color) == 1, f"_mileAdvisoryHTML colour anchor count != 1: {src.count(anchor_html_color)}"
replacement_html_color = (
    "  return '<div id=\"mileAdvisory\" style=\"font-size:11px;line-height:1.45;margin-top:6px;"
    "display:'+(t?'block':'none')+';color:'+(st.blank?'var(--muted)':'var(--signal)')+'\">'+t+'</div>';"
)
src = src.replace(anchor_html_color, replacement_html_color, 1)

# --- Advisory colour: updateMileAdvisory, same branch ---
anchor_update_color = "  el.style.color=st.msg?'var(--signal)':'var(--muted)';"
assert src.count(anchor_update_color) == 1, f"updateMileAdvisory colour anchor count != 1: {src.count(anchor_update_color)}"
replacement_update_color = "  el.style.color=st.blank?'var(--muted)':'var(--signal)';"
src = src.replace(anchor_update_color, replacement_update_color, 1)

# --- Version bump: LAST replacement, only ia-version edit in the whole V225 build ---
anchor_version = '<meta name="ia-version" content="224">'
assert src.count(anchor_version) == 1, f"ia-version anchor count != 1: {src.count(anchor_version)}"
replacement_version = '<meta name="ia-version" content="225">'
src = src.replace(anchor_version, replacement_version, 1)

PATH.write_text(src, encoding="utf-8")
print("V225 slice 4 (D187 R3 + version bump to 225) applied.")
