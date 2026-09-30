#!/usr/bin/env python3
"""
V225 R3 advisory-colour amendment (D187 amendment 2, R3 amendment, coach 2026-09-29).

Gatekeeper found the slice-4 fix over-reached: _mileEntryState actually returns a THIRD
state, {ok:true, adv}, for an out-of-chart mile (under 5:00 or over 12:00) that D9/V176
already ships muted. The two-state guard (st.blank ? muted : signal) incorrectly turned
that muted advisory into signal. Fix: (st.msg && !st.blank) ? signal : muted -- blank
carries its own msg, hence the !st.blank conjunct; only a REAL refusal the athlete must
fix is signal-colored, blank and the out-of-chart advisory both stay muted.

Scoped to the MILE advisory only (:7503, :7509) -- the swim advisory (:7533, :7539) has
no `adv` state (D110a M2's _swimEntryState never sets one) and is correctly untouched.
"""
import pathlib

PATH = pathlib.Path("/Users/CanasBangin/Desktop/TheBig6V2/index.html")

src = PATH.read_text(encoding="utf-8")

# --- _mileAdvisoryHTML colour ---
anchor_html = (
    "  return '<div id=\"mileAdvisory\" style=\"font-size:11px;line-height:1.45;margin-top:6px;"
    "display:'+(t?'block':'none')+';color:'+(st.blank?'var(--muted)':'var(--signal)')+'\">'+t+'</div>';"
)
assert src.count(anchor_html) == 1, f"_mileAdvisoryHTML colour anchor count != 1: {src.count(anchor_html)}"
replacement_html = (
    "  return '<div id=\"mileAdvisory\" style=\"font-size:11px;line-height:1.45;margin-top:6px;"
    "display:'+(t?'block':'none')+';color:'+((st.msg&&!st.blank)?'var(--signal)':'var(--muted)')+'\">'+t+'</div>';"
)
src = src.replace(anchor_html, replacement_html, 1)

# --- updateMileAdvisory colour (matched with the whole function body for uniqueness vs the
#     byte-identical swim function) ---
anchor_fn = (
    "function updateMileAdvisory(){\n"
    "  const el=document.getElementById('mileAdvisory'); if(!el) return;\n"
    "  const st=_mileEntryState(); const t=st.msg||st.adv||'';\n"
    "  el.textContent=t; el.style.display=t?'block':'none';\n"
    "  el.style.color=st.blank?'var(--muted)':'var(--signal)';\n"
    "}"
)
assert src.count(anchor_fn) == 1, f"updateMileAdvisory anchor count != 1: {src.count(anchor_fn)}"
replacement_fn = (
    "function updateMileAdvisory(){\n"
    "  const el=document.getElementById('mileAdvisory'); if(!el) return;\n"
    "  const st=_mileEntryState(); const t=st.msg||st.adv||'';\n"
    "  el.textContent=t; el.style.display=t?'block':'none';\n"
    "  el.style.color=(st.msg&&!st.blank)?'var(--signal)':'var(--muted)';\n"
    "}"
)
src = src.replace(anchor_fn, replacement_fn, 1)

PATH.write_text(src, encoding="utf-8")
print("R3 advisory-colour amendment applied (mile sites only).")
