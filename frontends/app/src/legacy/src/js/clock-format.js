// ── Clock format: m:ss for paces and times, and the mile anchor as it prints. ──
// D126 (V204): _clkMS is the SINGLE OWNER of the seconds limb. It rounds the WHOLE value before
// splitting, so a ':60' limb is structurally impossible rather than corrected after the fact
// (the technique _fmtHMS already uses). Suffixes belong to the caller: '/mi', '/100', or bare.
function _clkMS(sec){
  const t = Math.round(sec);
  return Math.floor(t/60) + ':' + String(t%60).padStart(2,'0');
}
function _fmtMileAnchor(sec){ return _clkMS(sec); }   // D126 (V204)

// the module exports (scripts/module-blocks.mjs writes them; build-index.mjs strips them)
export { _clkMS, _fmtMileAnchor };
