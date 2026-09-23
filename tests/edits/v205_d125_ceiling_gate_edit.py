#!/usr/bin/env python3
# V205 slice 6 — the two prior gate rows that pinned the PRE-amendment shape.
# Neither oracle is wrong; both are rows whose stated premise D125 (amended) retires, and
# P6f in pace_eve is a tripwire whose own comment prescribes exactly this upgrade. Both
# rows get STRONGER, not weaker: one source pin gains a second conjunct, the other becomes
# behavioural.
import io, sys

EDITS = []

# ── g205_d125_spaced P6c: the pace gate widened from < to <= ─────────────────────────
EDITS.append(('tests/gates/g205_d125_spaced.js',
"""ok('P6c the chooser is entered only when the ceiling caps the week',
   /_paceCapped = PACE_GOALS\\.has\\(_soloRunGoal\\) && capDays<nCardio && capDays>=2/.test(SRC));""",
"""// V205 (D125 amended, slice 6): the PACE gate widened from < to <=. With the ceiling at
// four, a four-training-day week has capDays === nCardio and its day SET is forced — but
// the long run's slot is not, and on a forced day set that permutation is the only lever
// that reaches zero collisions. Routing it to the even-spread fallback instead would deal
// the NSW table row blind and ship the collisions D125 exists to remove. NRC keeps the
// STRICT cap, and that half of this row is what makes the widening scoped rather than
// general: NRC's subset and permutation pins leave nothing to choose on a forced day set.
ok('P6c the pace chooser is entered whenever the ceiling is at or below the week, and NRC keeps the strict cap',
   /_paceCapped = PACE_GOALS\\.has\\(_soloRunGoal\\) && capDays<=nCardio && capDays>=2/.test(SRC) &&
   /_nrcCapped = NRC_GOALS\\.has\\(_soloRunGoal\\) && capDays<nCardio && capDays>=2/.test(SRC));"""))

# ── g205_pace_eve P6e/P6f: the CHI arm is reachable now, so the row goes behavioural ──
EDITS.append(('tests/gates/g205_pace_eve.js',
"""// P6e REACHABILITY, stated plainly. D127 rules that INT and CHI are both speed days. The
// placement reads WEEK 1 only (deconflictLegLiftDays takes cardioSchedule[1]), and week 1 of
// a pace block always carries INT: the quality slot only becomes CHI from about week 7. So
// the CHI arm of the mapping never fires at placement time TODAY. It is kept, and pinned
// here, for two reasons: the ruling says both are speed days, and the slot that is INT in
// week 1 is the same weekday that turns into CHI later, so the shape is stable either way.
// This row is a source pin because there is no config whose week 1 can exercise the arm; if
// one ever exists, this row should be replaced by a behavioural one.
ok('P6e both INT and CHI are named in the pace-family speed arm (CHI is unreachable at placement time; see comment)',""",
"""// P6e D127 rules that INT and CHI are both speed days, and the placement reads WEEK 1 only
// (deconflictLegLiftDays takes cardioSchedule[1]). THIS ROW USED TO BE A SOURCE PIN GUARDED
// BY A REACHABILITY TRIPWIRE: at a three-run pace ceiling week 1 always carried INT and the
// compressed quality slot only became CHI around week 7, so the CHI arm never fired at
// placement time and P6f below said so and said what to do when that changed.
// V205 (D125 amended, slice 6) IS THAT CHANGE. The pace ceiling went to four, and NSW's
// four-day row is easy / INT / CHI / long, so week 1 now carries a real CHI session and the
// arm is live. P6f is rewritten below as the behavioural row its own note prescribed. The
// source pin stays as well, because the mapping is still the thing being claimed.
ok('P6e both INT and CHI are named in the pace-family speed arm',"""))

EDITS.append(('tests/gates/g205_pace_eve.js',
"""ok('P6f the reachability premise behind P6e still holds: no pace block carries CHI in week 1',
   chiWk1 === 0, chiWk1 + ' week-1 CHI sessions found — the CHI arm is now reachable and P6e must become behavioural');""",
"""// P6f, BEHAVIOURAL (V205, D125 amended). The CHI arm must be REACHED, and then it must be
// treated as a speed day. Oracle is the D36/D127 doctrine text, not the engine: the hinge
// day rides a speed session, and a CHI session is a speed session. So on a four-run pace
// week the hinge day may sit on CHI, and wherever the hinge lands on a run at all that run
// must be INT or CHI — never the easy run and never the long run.
ok('P6f the CHI arm is now REACHED in week 1 (the D125 four-run ceiling put CHI there)',
   chiWk1 > 0, chiWk1 + ' week-1 CHI sessions — if this is 0 the row below is vacuous');
let hingeOnRun = 0, hingeOnSlow = 0, hingeOnChi = 0;
[['sun','wed'], ['sun'], ['sun','wed','fri']].forEach(rest => [1001, 2002, 3003].forEach(seed => {
  const w = IA.buildProgram(paceCfg(rest, seed)).weeks['1'];
  DAYS.forEach(d => {
    const day = w[d]; if(!day || !day.cardio) return;
    if((day.title || '') !== 'Posterior Chain') return;
    const cs = Array.isArray(day.cardio) ? day.cardio : [day.cardio];
    cs.forEach(c => {
      if(c.type !== 'run') return;
      const s = String(c.subtype || '');
      hingeOnRun++;
      if(/^Continuous High Intensity/.test(s)) hingeOnChi++;
      else if(!/^Interval/.test(s)) hingeOnSlow++;
    });
  });
}));
ok('P6g every hinge day that carries a run carries a SPEED run, INT or CHI, never easy and never long (' + hingeOnRun + ' hinge run days)',
   hingeOnRun > 0 && hingeOnSlow === 0, hingeOnSlow + ' hinge days on a slow run');
ok('P6h and the CHI arm is exercised by the hinge placement itself, not merely present in week 1',
   hingeOnChi > 0, hingeOnChi + ' hinge days on CHI');"""))

for i, (path, old, new) in enumerate(EDITS, 1):
    src = io.open(path, encoding='utf-8').read()
    c = src.count(old)
    print('anchor %d (%s): count=%d' % (i, path, c))
    if c != 1:
        sys.exit('ABORT: anchor %d matched %d times, expected exactly 1' % (i, c))
    io.open(path, 'w', encoding='utf-8').write(src.replace(old, new, 1))
print('WROTE gates')
