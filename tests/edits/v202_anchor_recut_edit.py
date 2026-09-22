#!/usr/bin/env python3
# V202 slice 1b — re-cut of the PARKED E1 under coach's AMENDED D100.
#
# E1 as built anchored the pace clock on the athlete's MILE pace (_mileBestSecs), so a
# 1.5-mile goal started the clock at a pace the athlete holds over a mile. 138/360 builds
# then had a goal "slower" than the anchor and parked flat.
#
# AMENDED D100: the anchor is the athlete's own chart row read AT THE GOAL DISTANCE.
#   E1'  _initialPace = rowPaceAt(_chartRow, rawTargetDist)   (beginner's 690 row converts too)
#   E2'  rowPaceAt(), sited immediately after paceChartLookup
#
# Does NOT bump ia-version (slice 5 owns it). Does not touch E2, E3 or slice 2's copy edits.
import io, sys, os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
SRC = os.path.normpath(SRC)
s = io.open(SRC, encoding='utf-8').read()
orig = s

def rep(old, new, label):
    n = s.count(old)
    assert n == 1, 'ANCHOR MISS [%s]: count==%d, expected 1' % (label, n)
    print('  anchor ok  %-6s count==1' % label)
    return s.replace(old, new, 1)

# ── E1' — the anchor is the chart row read at the GOAL distance ───────────────
E1_OLD = """    // D100 (V202): the pace clock starts where the athlete actually is. _mileBestSecs is
    // already null for beginners (gated at the anchor above), so beginner keeps the V172
    // experience default of 690 and only non-beginners take the entered mile.
    buildRunProgressionForLength._initialPace  = _mileBestSecs || expPaceDefaults[experience||'intermediate'] || 570;"""
E1_NEW = """    // D100 (V202): the pace clock starts where the athlete actually is AT THE DISTANCE THEY
    // ENTERED. Anchoring on the mile pace itself started a 1.5-mile goal at a pace the athlete
    // only holds for a mile, so the goal read "slower" than the anchor and the clock parked flat.
    // _chartRow is already the athlete's own row (entered mile for non-beginners, the V172
    // experience default of 690 for beginners, gated at the anchor above); rowPaceAt reads that
    // row at the goal distance, so the beginner's default row converts on the same terms.
    buildRunProgressionForLength._initialPace  = rowPaceAt(_chartRow, rawTargetDist);"""
s = rep(E1_OLD, E1_NEW, 'E1p')

# ── E2' — rowPaceAt, sited immediately after paceChartLookup ──────────────────
E2_OLD = """function isSpeedGoal(goalId) {"""
E2_NEW = """// ── ROW → GOAL DISTANCE (D100, V202) ─────────────────────────────────────────
// PACE_CHART tabulates, for one fitness row, the average mile pace to train each RACE
// distance at. A pace goal is entered at a distance the table has no column for (1.5 mi,
// 2 km, 5 mi), so the row is READ at that distance:
//   * columns sit at their true distances in miles (unit conversions, not coaching numbers);
//   * interpolation is in LOG distance between the two bracketing columns — fitted over all
//     15 rows, log beat linear in 15/15, pooled RMSE 5.46 s vs 17.75 s;
//   * a running maximum runs across the columns in distance order, because a longer distance
//     is never a faster pace. That is the definition of what the chart tabulates, and it is
//     reachable: row 15 (mile 12:00) inverts, half 845 → marathon 825, and the goal-distance
//     input carries min="0.1" with no max;
//   * outside the table the value clamps to the table's own bounds at both ends.
// rowPaceAt(row, 1.0) returns the mile column exactly.
var ROW_PACE_COLS = [
  {d:1,      k:'mile'},
  {d:3.107,  k:'fiveK'},
  {d:6.214,  k:'tenK'},
  {d:13.109, k:'half'},
  {d:26.219, k:'marathon'},
];
function rowPaceAt(row, distMiles) {
  var run = -Infinity;
  var v = ROW_PACE_COLS.map(function(c){ run = Math.max(run, +row[c.k]); return {d:c.d, p:run}; });
  var d = +distMiles;
  if (!(d > 0))            return v[0].p;                 // no distance → the mile column
  if (d <= v[0].d)         return v[0].p;                 // below the table → clamp low
  if (d >= v[v.length-1].d) return v[v.length-1].p;       // above the table → clamp high
  for (var i = 0; i < v.length - 1; i++) {
    if (d >= v[i].d && d <= v[i+1].d) {
      var f = (Math.log(d) - Math.log(v[i].d)) / (Math.log(v[i+1].d) - Math.log(v[i].d));
      return v[i].p + (v[i+1].p - v[i].p) * f;
    }
  }
  return v[v.length-1].p;
}

function isSpeedGoal(goalId) {"""
s = rep(E2_OLD, E2_NEW, 'E2p')

assert s != orig, 'no change written'
io.open(SRC, 'w', encoding='utf-8').write(s)
print('WROTE %s  (%d -> %d bytes)' % (SRC, len(orig), len(s)))
