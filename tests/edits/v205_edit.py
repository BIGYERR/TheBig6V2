#!/usr/bin/env python3
# V205 slice 1 — D128: CHI minutes and reps come from NSW Guide B Table 6, not the
# V115 hand ramp. Four edits. ia-version is NOT bumped in this slice (stays 204).
# Every anchor asserted count==1 before any byte is written; first miss aborts all.
import io, sys, os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
SRC = os.path.normpath(SRC)
src = io.open(SRC, encoding='utf-8').read()
orig = src
reps = []

def rep(tag, old, new):
    reps.append((tag, old, new))

# ── EDIT 1 — Table 6 as data, plus the reader, inserted above getCHI ──────────────
A1 = "function getCHI(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {"

TABLE = """// ── D128 (V205): NSW GUIDE B, TABLE 6 — THE CHI PROGRESSION, AS DATA ─────────
// Source: doctrine/nsw_ptg_sealswcc_11pg.txt lines 35-60, the "CHI min" column of
// Table 6 ("Run/Swim (minutes)"), transcribed verbatim. Line 61 of that file is the
// table's own tail rule: ">26: do not increase INT or CHI distances. Focus on
// increasing intensity."
// That tail rule is implemented by the Math.min(week, 26) clamp in the reader below
// and by nothing else. Past week 26 the athlete keeps reading row 26 forever, which
// IS "do not increase" — so there is no >26 branch to write, and the hardcoded one
// that used to sit at the top of getCHI is gone (see D128 note there).
// What this replaces: the V115 hand ramp, which set reps 1/2/3 by position inside the
// CHI phase and 15-20 minutes per rep, topping out at 3 x 20 = 60 minutes of work.
// Neither the third rep nor the 60 has a source in either guide. Table 6's ceiling is
// 2 x 20 = 40. The table is a CALENDAR progression keyed on the training week, not a
// phase-relative ramp.
var NSW_TABLE6_CHI = [
  null,                                             // index 0 unused: weeks are 1-based
  {reps:1, minPerRep:15}, {reps:1, minPerRep:15},   // wk 1-2
  {reps:1, minPerRep:16}, {reps:1, minPerRep:16},   // wk 3-4
  {reps:1, minPerRep:17}, {reps:1, minPerRep:17},   // wk 5-6
  {reps:1, minPerRep:18}, {reps:1, minPerRep:18},   // wk 7-8
  {reps:1, minPerRep:19}, {reps:1, minPerRep:19},   // wk 9-10
  {reps:1, minPerRep:20}, {reps:1, minPerRep:20},   // wk 11-12
  {reps:2, minPerRep:12}, {reps:2, minPerRep:12}, {reps:2, minPerRep:12},   // wk 13-15
  {reps:2, minPerRep:14}, {reps:2, minPerRep:14}, {reps:2, minPerRep:14},   // wk 16-18
  {reps:2, minPerRep:16}, {reps:2, minPerRep:16}, {reps:2, minPerRep:16},   // wk 19-21
  {reps:2, minPerRep:18}, {reps:2, minPerRep:18}, {reps:2, minPerRep:18},   // wk 22-24
  {reps:2, minPerRep:20}, {reps:2, minPerRep:20}                            // wk 25-26
];
// The reader. Math.min(week, 26) is load-bearing doctrine, not defensive clamping:
// it is Table 6's ">26" row. Returns a fresh object every call so no caller can
// mutate the table.
function chiFromTable6(week){
  var _w = Math.max(1, Math.min(Math.round(week) || 1, 26));
  var _row = NSW_TABLE6_CHI[_w];
  return { reps: _row.reps, minPerRep: _row.minPerRep };
}

"""
rep('E1 table+reader', A1, TABLE + A1)

# ── EDIT 3 — delete the hardcoded >26 limb (ruled DELETION, D128) ────────────────
A3 = ("  if(isMilGoal && week > 26) return {reps:3, minPerRep:20, "
      "note:'Maintain intensity — increase pace, not volume'};\n")
N3 = ("  // D128 (V205): the `isMilGoal && week > 26` limb that used to sit here returned a\n"
      "  // hardcoded {reps:3, minPerRep:20} — 60 minutes of threshold work against Table 6's\n"
      "  // 40 at the same week. Its replacement already exists: chiFromTable6 clamps at\n"
      "  // Math.min(week, 26), so week 27 and week 400 both read row 26 and nothing\n"
      "  // increases. Deleted, not re-pointed, because the clamp IS the >26 rule.\n")
rep('E3 delete >26 limb', A3, N3)

# ── EDIT 2 — getCHI (the RUN reader) reads Table 6 ───────────────────────────────
A2 = """  // `phaseFrom`/`phaseTo` bound the window this progression is spread across, defaulting
  // to the whole block. When the compressed quality slot puts CHI in the BACK half only
  // (V115), the caller passes that window so threshold work still enters at 1 rep and
  // builds to 3 across the weeks it actually occupies, rather than starting mid-ramp.
  const _pFrom = phaseFrom || 1, _pTo = Math.max(_pFrom+1, phaseTo || totalWeeks || 6);
  const at = w => {
    const pct = Math.max(0, Math.min(1, (w - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return { reps: pct < 0.35 ? 1 : pct < 0.70 ? 2 : 3, minPerRep: Math.round(15 + pct * 5) };
  };
"""
N2 = """  // D128 (V205): this is the RUN reader, and it reads Table 6 by calendar week.
  // `phaseFrom`/`phaseTo` are kept in the signature because the run and swim callers
  // still pass the periodized CHI window, but they no longer re-base the progression:
  // Table 6 is indexed on the training week itself, so a CHI phase that opens in week 7
  // opens on week 7's row (1 x 18) instead of restarting the ramp at its first rung.
  // The V115 phase-relative pct ramp is gone with the 1/2/3 rep ladder it fed.
  const at = w => chiFromTable6(w);
"""
rep('E2 run reads table', A2, N2)

# ── EDIT 4 — fork bike and swim off the table, BY CALLER ─────────────────────────
A4T = "  return at(week);\n}\n"
N4T = """  return at(week);
}

// ── D128 (V205): THE BIKE KEEPS THE V115 HAND RAMP, BYTE-IDENTICAL ───────────
// Table 6 is a run/swim table. Neither the NSW guide nor the NRC plans cover cycling,
// so prescribing the table's minutes on a bike would be an invention, not a
// transcription. This is a fork BY CALLER, not a flag inside getCHI: when cycling is
// ruled on, this reader is replaced on its own without touching the table or the run
// path. The body below is the V115 ramp unchanged except that the `isMilGoal && week > 26`
// limb is not carried over — the bike caller passes `false` literally, so that limb was
// already unreachable from here and dropping it moves no byte of bike output.
function getCHIBike(week, totalWeeks, phaseFrom, phaseTo) {
  const _pFrom = phaseFrom || 1, _pTo = Math.max(_pFrom+1, phaseTo || totalWeeks || 6);
  const atBike = w => {
    const pct = Math.max(0, Math.min(1, (w - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return { reps: pct < 0.35 ? 1 : pct < 0.70 ? 2 : 3, minPerRep: Math.round(15 + pct * 5) };
  };
  if(isCardioCutbackWeek(week, totalWeeks)){
    const prev = atBike(week-1);
    return prev.reps > 1
      ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
      : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) };
  }
  return atBike(week);
}

// ── D128 (V205): SWIM TAKES THE REP TIER FROM TABLE 6 AND NOTHING ELSE ───────
// Table 6's minutes column is titled "Run/Swim (minutes)", but this app prescribes the
// swim CHI session in YARDS (`chiYards`, built from its own ramp), and prescription owns
// ONE fixed dimension. Importing the table's minutes here would prescribe two. So swim
// reads only the REP TIER — 1 rep through week 12, 2 from week 13 on, never 3 — which is
// the part of Table 6 that is a rep count rather than a distance. `minPerRep` stays on
// the V115 ramp for the taper branch that rewrites it; nothing downstream of swim prints
// it. `chiYards` is untouched by D128.
function getCHISwim(week, totalWeeks, isMilGoal, phaseFrom, phaseTo) {
  const _pFrom = phaseFrom || 1, _pTo = Math.max(_pFrom+1, phaseTo || totalWeeks || 6);
  const atSwim = w => {
    const pct = Math.max(0, Math.min(1, (w - _pFrom) / Math.max(_pTo - _pFrom, 1)));
    return { reps: chiFromTable6(w).reps, minPerRep: Math.round(15 + pct * 5) };
  };
  if(isCardioCutbackWeek(week, totalWeeks)){
    const prev = atSwim(week-1);
    return prev.reps > 1
      ? { reps: prev.reps - 1, minPerRep: prev.minPerRep }
      : { reps: 1, minPerRep: Math.max(10, Math.round(prev.minPerRep * 0.7)) };
  }
  return atSwim(week);
}
"""
rep('E4a fork readers', A4T, N4T)

A4B = "  let chi = getCHI(week, tw, false);\n"
N4B = "  let chi = getCHIBike(week, tw);   // D128 (V205): bike keeps the V115 hand ramp\n"
rep('E4b bike caller', A4B, N4B)

A4S = """  const _qph = qPhase || null;
  let intReps = getINTReps(week, tw, isMilGoal, _qph && _qph.intSpan);
  let chi = getCHI(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);
"""
N4S = """  const _qph = qPhase || null;
  let intReps = getINTReps(week, tw, isMilGoal, _qph && _qph.intSpan);
  // D128 (V205): swim takes the Table 6 rep TIER only; yards are unchanged.
  let chi = getCHISwim(week, tw, isMilGoal, _qph && _qph.chiFrom, _qph && _qph.chiTo);
"""
rep('E4c swim caller', A4S, N4S)

# ── assert every anchor count==1 BEFORE writing anything ─────────────────────────
fail = False
for tag, old, new in reps:
    n = src.count(old)
    print('%-22s anchor count == %d %s' % (tag, n, '(ok)' if n == 1 else '<<< NOT 1'))
    if n != 1:
        fail = True
if fail:
    print('ABORT: at least one anchor is not unique. No bytes written.')
    sys.exit(2)

for tag, old, new in reps:
    src = src.replace(old, new, 1)

# NOTE: ia-version is deliberately NOT bumped in this slice. It stays at 204 until the
# final V205 slice, per the dispatch. No meta replacement here.
assert 'content="204"' in src, 'version meta unexpectedly changed'

io.open(SRC, 'w', encoding='utf-8').write(src)
print('WROTE %s  (%d -> %d bytes, %+d)' % (SRC, len(orig), len(src), len(src) - len(orig)))
