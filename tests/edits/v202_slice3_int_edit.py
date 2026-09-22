#!/usr/bin/env python3
# V202 slice 3 — D111 / D105 inside the INT branch of buildRunSession.
# Four ruled edits: E8 (SI pace = base minus 16 s/mi), E9 (reps to 8 before pace walks),
# E10 (recovery = 2 to 2.5 x the work interval, printed as time), E11 (warm-up from guide B p8).
# Does NOT bump ia-version (a later slice owns it). Does NOT touch the four INT note strings
# (slice 4) nor the anchor arithmetic (slices 1/1b).
#
# Doctrine, per D112: guide A governs wherever A states something; guide B fills A's silences.
#   A = doctrine/physicaltrainingguide2020.txt
#       248-249  recovery period of 2-2.5 times the work interval
#       251-252  400m interval pace about 4 seconds faster than base pace
#       259-263  build to 8 repeats first, THEN get faster
#       268-270  2-2.5 x the work time, use active recovery
#   A tables (hand-transcribed from screenshots):
#       doctrine/ptg2020_tables_p13_14_16_17.txt lines 9 and 41
#       "Recovery period: 2-2.5 x the work time"
#   B = doctrine/nsw_ptg_sealswcc_11pg.txt p8  warm-up for CHI and INT
import io, sys

SRC = 'index.html'
with io.open(SRC, encoding='utf-8') as f:
    s = f.read()

EDITS = []
def rep(tag, old, new, n=1):
    EDITS.append((tag, old, new, n))

# ══════════════════════════════════════════════════════════════════════════════
# E10 + E11 part 1 — the shared recovery formatter and the warm-up sentence,
# sited at the head of the INT branch so all three LIVE arms can reach them.
# ══════════════════════════════════════════════════════════════════════════════
ANCHOR_HEAD = """  } else if(sType === 'int') {
    subtype = 'Interval (INT)' + (isTaperWeek ? ' — Taper' : '');
    if(isMilGoal) {"""

HEAD_NEW = """  } else if(sType === 'int') {
    subtype = 'Interval (INT)' + (isTaperWeek ? ' — Taper' : '');
    // ── V202 D105: RECOVERY IS 2 TO 2.5 x THE WORK INTERVAL, NOT A FIXED 200m ──
    // Guide A is explicit twice. A 248-249: "allowing a recovery period of 2-2.5 times
    // the amount of time it takes to perform the work interval". A 268-270: "Allow
    // enough recovery time after each interval to maintain the proper work intensity
    // (2-2.5 x the work time). To promote faster, more complete recovery, use active
    // recovery." Both Short Interval table headers say the same thing
    // (doctrine/ptg2020_tables_p13_14_16_17.txt lines 9 and 41 — those tables are
    // HAND-TRANSCRIBED from screenshots of p13 and p16, not OCR).
    // The old fixed "walk or jog 200m" measured 0.685x the work time across 11,880 of
    // 11,880 INT sessions: about a third of the doctrine MINIMUM. A recovery that short
    // turns speed work into a threshold session run on incomplete rest.
    // 1609.344 is the metres in a mile. It is a unit, not a coaching number.
    const _M_PER_MILE = 1609.344;
    const _intClk = t => Math.floor(t/60) + ':' + String(Math.round(t%60)).padStart(2,'0');
    // tgt is the session's OWN prescribed pace in s/mi, so the recovery, the printed pace
    // and the logged dose all read off one number.
    const _intRec = (tgt, metres) => {
      const work = tgt * metres / _M_PER_MILE;
      const lo = Math.round(work * 2), hi = Math.round(work * 2.5);
      return { lo, hi, txt: 'Recovery: ' + _intClk(lo) + ' to ' + _intClk(hi) + ' of easy jogging or walking. Keep moving.' };
    };
    // ── V202: WARM-UP COMES FROM GUIDE B, NOT GUIDE A ──────────────────────────
    // D112 limb 2: guide A says nothing about warming up for a Short Interval session,
    // so guide B fills the silence. B p8 (doctrine/nsw_ptg_sealswcc_11pg.txt): "For CHI
    // and INT workouts, you should warm up for 10-15 minutes or more. Gradually build
    // intensity from an easy jog or stroke for several minutes. Then add 4-5
    // high-intensity bursts lasting from 15 to 30 seconds." Cool-down, same page: extend
    // "until you are breathing easily". The old "5 min easy warmup + cooldown" was a
    // third of what B asks for and is in neither guide.
    const _INT_WARMUP = 'Warm up 10 to 15 minutes. Build from an easy jog. Add 4 to 5 bursts of 15 to 30 seconds. Cool down until breathing is easy.';
    if(isMilGoal) {"""
rep('E10/E11 head — formatter + warm-up string', ANCHOR_HEAD, HEAD_NEW)

# ══════════════════════════════════════════════════════════════════════════════
# E9 — D105 sequencing: volume to 8 first, then pace.
# ══════════════════════════════════════════════════════════════════════════════
ANCHOR_WEEKPACE = """        const pp = prog.paceProgression;
        const _cb = isCardioCutbackWeek(week, tw);
        const weekPace   = pp ? pp[(_cb && _ppIdx > 0) ? _ppIdx - 1 : _ppIdx] : null;  // D2b: effective index"""

WEEKPACE_NEW = """        const pp = prog.paceProgression;
        const _cb = isCardioCutbackWeek(week, tw);
        // ── V202 D105: VOLUME FIRST, THEN SPEED ────────────────────────────────
        // A 259-263: "Your first Short Interval workout should consist of 4 repeats, and
        // build progressively toward completing 8 intervals... When you can complete all
        // 8 intervals at high intensity, work on gradually performing the intervals a
        // little faster each week." Two dimensions, in order. The engine used to ramp
        // both at once, which asks the athlete to add a rep AND take five seconds off the
        // same week.
        // The first-8-rep week is READ OFF getINTReps' own ramp, never written as a
        // literal: the ramp is the governing table here, and a cutback week can never
        // return 8 (it steps back to round(ramp x 0.6), at most 5), so the first week the
        // ramp returns 8 IS the week the 4->8 build tops out.
        let _int8Wk = 0;
        for(let _w = 1; _w <= tw; _w++){
          if(getINTReps(_w, tw, isMilGoal, _qph && _qph.intSpan) === 8){ _int8Wk = _w; break; }
        }
        // The pace clock holds at the START pace through the build, including the week
        // reps first reach 8 — that week is the one spent completing all 8 AT high
        // intensity, which is the precondition A sets before going faster. From the week
        // after, the index walks at the progression's own rate. A block whose ramp never
        // reaches 8 holds the start pace throughout, which is the same rule.
        // LSD, CHI and recovery paces are untouched: they keep reading _ppIdx.
        const _intIdx = _int8Wk ? Math.max(0, _ppIdx - (_int8Wk - 1)) : 0;
        // Cutback still holds the PRIOR index, exactly as before — now the prior HELD index.
        const weekPace   = pp ? pp[(_cb && _intIdx > 0) ? _intIdx - 1 : _intIdx] : null;  // D2b: effective index"""
rep('E9 — reps-to-8 hold on the pace index', ANCHOR_WEEKPACE, WEEKPACE_NEW)

# ══════════════════════════════════════════════════════════════════════════════
# E8 — D111: the SI pace is A's SUBTRACTION, not a proportion.
# ══════════════════════════════════════════════════════════════════════════════
ANCHOR_PACE = """        const intPace    = weekPace ? Math.max(pp._realisticTarget * 0.95, weekPace * 0.95) : null;"""
PACE_NEW = """        // ── V202 D111: A's SUBTRACTION, NOT A PROPORTION ───────────────────────
        // A 251-252: "For running, your 400m interval pace should be about 4 seconds
        // faster than your base pace". 400m is A's own quarter mile, so 4 s per 400m is
        // a flat 16 s per mile. The old x0.95 was a proportion nobody wrote down: at a
        // 5:00 mile it takes off 3.75 s per 400 (A asks 4), but at a 12:00 mile it takes
        // off 9 s per 400, more than twice A's rule, and the slow end is the population
        // this guide serves. The CHI branch keeps its x1.08 — that multiplier IS A's own
        // worked example for Long Intervals, a different rule for a different session.
        const INT_PACE_GAIN_SEC_PER_MILE = 16;   // 4 s per 400m x 4 quarters
        const intPace    = weekPace ? Math.max(pp._realisticTarget - INT_PACE_GAIN_SEC_PER_MILE, weekPace - INT_PACE_GAIN_SEC_PER_MILE) : null;"""
rep('E8 — minus 16 s/mi replaces x0.95', ANCHOR_PACE, PACE_NEW)

# ══════════════════════════════════════════════════════════════════════════════
# E10 + E11 part 2 — the two LIVE progression detail arms.
# ══════════════════════════════════════════════════════════════════════════════
ANCHOR_DETAIL2 = """          const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
          detail = _cb
            ? `${intReps}x400m at ${fmt(intPace)}/mi (cutback — holding last week's target). Recovery: walk or jog 200m between reps. 5 min easy warmup + cooldown.`
            : `${intReps}x400m at ${fmt(intPace)}/mi (week ${week} interval target — slightly faster than this week's goal of ${fmt(weekPace)}/mi). Recovery: walk or jog 200m between reps. 5 min easy warmup + cooldown.`;
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:Math.round(intPace)};"""

DETAIL2_NEW = """          const fmt = s => `${Math.floor(s/60)}:${String(Math.round(s%60)).padStart(2,'0')}`;
          const _intTgt = Math.round(intPace);
          const _rec = _intRec(_intTgt, 400);
          detail = _cb
            ? `${intReps}x400m at ${fmt(intPace)}/mi (cutback — holding last week's target). ${_rec.txt} ${_INT_WARMUP}`
            : `${intReps}x400m at ${fmt(intPace)}/mi (week ${week} interval target — slightly faster than this week's goal of ${fmt(weekPace)}/mi). ${_rec.txt} ${_INT_WARMUP}`;
          // rec is ADDITIVE on the dose: {lo,hi} in seconds, so the log form and any later
          // reader can see the prescribed recovery band without re-parsing the sentence.
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgt, rec:{lo:_rec.lo, hi:_rec.hi}};"""
rep('E10/E11 — the two live progression detail arms', ANCHOR_DETAIL2, DETAIL2_NEW)

# ══════════════════════════════════════════════════════════════════════════════
# E10 + E11 part 3 — the third LIVE arm: the chart fallback inside run_pace_goal.
# The run_15_under10 / run_mile_time arm below it is DEAD (both ids alias to
# run_pace_goal at index.html _GOAL_ALIAS) and is left exactly as it stands.
# ══════════════════════════════════════════════════════════════════════════════
ANCHOR_DETAIL3 = """          const intChartPace = _fmtPace(_chartRow.fiveK);
          detail = intReps + 'x400m at 5K Pace: ' + intChartPace + '. Recovery: walk or jog 200m between each rep. 5 min easy warmup + cooldown.';
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:Math.round(_chartRow.fiveK)};"""

DETAIL3_NEW = """          const intChartPace = _fmtPace(_chartRow.fiveK);
          const _intTgtF = Math.round(_chartRow.fiveK);
          const _recF = _intRec(_intTgtF, 400);
          detail = intReps + 'x400m at 5K Pace: ' + intChartPace + '. ' + _recF.txt + ' ' + _INT_WARMUP;
          _dose = {k:'reps_dist', reps:intReps, m:400, tgt:_intTgtF, rec:{lo:_recF.lo, hi:_recF.hi}};"""
rep('E10/E11 — the chart-fallback detail arm', ANCHOR_DETAIL3, DETAIL3_NEW)

# ── assert EVERY anchor exactly once BEFORE writing a single byte ─────────────
fail = False
for tag, old, new, n in EDITS:
    c = s.count(old)
    print('anchor %-52s count=%d (want %d)' % (tag, c, n))
    if c != n:
        fail = True
if fail:
    sys.stderr.write('ABORT: an anchor did not match exactly once. Nothing written.\n')
    sys.exit(1)

for tag, old, new, n in EDITS:
    s = s.replace(old, new, n)

# guard: ia-version must NOT move in this slice
import re
v = re.search(r'<meta name="ia-version" content="(\d+)"', s)
assert v and v.group(1) == '201', 'ia-version moved; slice 3 must not bump it'
# guard: the DEAD arm is untouched
assert s.count("Recovery: walk or jog 200m between each (2-2.5x work time). 5 min easy warmup + cooldown.") == 1, 'dead arm changed'
# guard: no live 200m recovery literal survives
assert s.count("Recovery: walk or jog 200m between reps.") == 0, 'a live 200m literal survived'
assert s.count("Recovery: walk or jog 200m between each rep.") == 0, 'the fallback 200m literal survived'

with io.open(SRC, 'w', encoding='utf-8') as f:
    f.write(s)
print('WROTE %s  (%d edits, ia-version held at 201)' % (SRC, len(EDITS)))
