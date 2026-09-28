#!/usr/bin/env python3
# V223 build 3, D183 (P-SAFEPACE) slice S6: R1 retirement, R5 descs, amendment 2 (e) swim_tri.
# Ruling: tests/measure/v223_rulings/p_safepace_ruling.md
#   R1  retire applySuggestedPace and achievablePacePerMile (0 callers since S4). Session reading:
#       secsToMMSS was the removed offer's own formatter, 0 callers since S4, retires under the same R1 rule.
#   R5  wizard goal descs, sportDescs and the "Tap to open" line lose their mid-sentence em-dashes.
#   A2e swim_tri desc -> "Open water race. 750 m to 1.9 km."
# Kept byte-identical: run_base desc ("increase mileage safely"), every bike line, formatPacePer100,
# formatPacePerMile, buildProgram. NO version bump (stays 222).
# Every anchor is asserted count==1 on the in-memory text before it is replaced; the first miss aborts
# the whole script and nothing is written.
import sys

PATH = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()
orig = src

def rep(label, old, new):
    global src
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count=%d (expected 1). Nothing written.' % (label, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('OK    %s: anchor count=1, replaced' % label)

# ── E1  R1: retire achievablePacePerMile, secsToMMSS, applySuggestedPace as one region ──
E1_OLD = """// ── RACE DATE FUNCTIONS ──

// Reverse of the run_pace_goal math in calcProgramLength: given how many weeks the
// athlete actually has, returns the fastest per-mile pace (sec/mi) they can reach
// WITHOUT exceeding safe progression. Inverts the core build relationship directly
// (ignoring the artificial distance caps, which only ever shorten — they'd otherwise
// let the math claim impossible paces for longer windows).
function achievablePacePerMile(weeksAvail, tDist, experience, ageBracket) {
  experience = experience || 'intermediate';
  ageBracket = ageBracket || '18-35';
  const paceImprove = {beginner:3, intermediate:5, advanced:7}[experience] || 4;
  const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[ageBracket] || 1.0;
  const ageSafePaceImprove = +(paceImprove * agePaceScale).toFixed(2);
  const ageMult = {'55+':1.15, '36-54':1.07, '18-35':1.0}[ageBracket] || 1.0;
  const expCurrentPace = {beginner:690, intermediate:570, advanced:450}[experience] || 570;   // V176 (D9): one beginner default, the engine's 690
  // Undo the forward pipeline:  needed = round(raw*1.25 + 4) * ageMult + 1 grace
  const wForImprove   = (weeksAvail - 1) / ageMult;        // undo +1 grace & age multiplier
  const improvingWeeks = Math.max(0, (wForImprove - 4) / 1.25); // undo result = raw*1.25 + 4
  const gap = improvingWeeks * ageSafePaceImprove;
  const achievable = expCurrentPace - gap;
  return Math.max(achievable, 240); // 4:00/mi hard sanity floor
}
function secsToMMSS(totalSecs) {
  totalSecs = Math.round(totalSecs);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  return m + ':' + String(s).padStart(2,'0');
}
// Apply the suggested pace to the run goal, then re-render so feedback turns green
function applySuggestedPace(mins, secs) {
  if(!WD.cardioGoals['run']) WD.cardioGoals['run'] = {};
  WD.cardioGoals['run'].targetMins = mins;
  WD.cardioGoals['run'].targetSecs = secs;
  updatePaceTime('run');
  renderWizardStep();
  // Recompute the advisory synchronously in the same click tick. renderWizardStep()
  // rebuilds the DOM synchronously, so #raceDateInput / #raceDateFeedback already exist;
  // updateRaceDateFeedback() re-runs calcProgramLength() against the freshly-applied pace
  // and repaints the badge. (Async setTimeout here raced the re-render and could leave the
  // advisory stuck on the stale error — same desync class as the §8 race-date toggle bug.)
  updateRaceDateFeedback();
}

function updateRaceDateFeedback() {
"""
E1_NEW = """// ── RACE DATE FUNCTIONS ──

function updateRaceDateFeedback() {
"""
rep('E1 retire achievablePacePerMile/secsToMMSS/applySuggestedPace', E1_OLD, E1_NEW)

# ── E2  R5 + A2e: CARDIO_GOALS_BY_TYPE descs (10K, half, full, pace, swim_tri); run_base + bike byte-identical ──
E2_OLD = """    {id:'run_10k',       label:'Run a 10K',             desc:'6.2 miles — solid aerobic base'},
    {id:'run_half',      label:'Half Marathon',         desc:'13.1 miles — serious endurance'},
    {id:'run_marathon',  label:'Full Marathon',         desc:'26.2 miles — the full distance'},
    {id:'run_pace_goal', label:'Hit a Pace / Time Goal',desc:'Target distance + time — 1.5mi under 10 min, mile under 6, etc.'},
    {id:'run_base',      label:'Build Running Base',    desc:'Get consistent, increase mileage safely'},
  ],
  bike: [
    {id:'bike_century',  label:'Century Ride (100mi)',  desc:'Long distance cycling endurance'},
    {id:'bike_50',       label:'50-Mile Ride',          desc:'Mid-distance cycling goal'},
    {id:'bike_ftp',      label:'Improve FTP / Power',   desc:'Sustained cycling power output'},
    {id:'bike_cals',     label:'Hit Calorie Targets',   desc:'Burn-focused spin sessions'},
    {id:'bike_base',     label:'Build Cycling Base',    desc:'Consistency and aerobic capacity'},
  ],
  swim: [
    {id:'swim_tri',      label:'Triathlon Swim',        desc:'Open water race — 750m to 1.9km'},
"""
E2_NEW = """    {id:'run_10k',       label:'Run a 10K',             desc:'6.2 miles. A solid aerobic base.'},
    {id:'run_half',      label:'Half Marathon',         desc:'13.1 miles. Serious endurance.'},
    {id:'run_marathon',  label:'Full Marathon',         desc:'26.2 miles. The full distance.'},
    {id:'run_pace_goal', label:'Hit a Pace / Time Goal',desc:'A distance and a time. 1.5 miles under 10 minutes. A mile under 6.'},
    {id:'run_base',      label:'Build Running Base',    desc:'Get consistent, increase mileage safely'},
  ],
  bike: [
    {id:'bike_century',  label:'Century Ride (100mi)',  desc:'Long distance cycling endurance'},
    {id:'bike_50',       label:'50-Mile Ride',          desc:'Mid-distance cycling goal'},
    {id:'bike_ftp',      label:'Improve FTP / Power',   desc:'Sustained cycling power output'},
    {id:'bike_cals',     label:'Hit Calorie Targets',   desc:'Burn-focused spin sessions'},
    {id:'bike_base',     label:'Build Cycling Base',    desc:'Consistency and aerobic capacity'},
  ],
  swim: [
    {id:'swim_tri',      label:'Triathlon Swim',        desc:'Open water race. 750 m to 1.9 km.'},
"""
rep('E2 CARDIO_GOALS_BY_TYPE descs', E2_OLD, E2_NEW)

# ── E3  R5: sportDescs ──
E3_OLD = """      run:'Outdoor or treadmill — pace, distance, race goals',
      bike:'Spin bike or outdoor — intervals, FTP, distance',
      swim:'Lap pool or open water — structured sets'
"""
E3_NEW = """      run:'Outdoor or treadmill. Pace, distance and race goals.',
      bike:'Spin bike or outdoor. Intervals, FTP and distance.',
      swim:'Lap pool or open water. Structured sets.'
"""
rep('E3 sportDescs', E3_OLD, E3_NEW)

# ── E4  R5: the race date calendar hint ──
E4_OLD = 'line-height:1.5">Tap to open calendar — the final weeks taper so you arrive fresh.</div>'
E4_NEW = 'line-height:1.5">Tap to open the calendar. The final weeks taper so you arrive fresh.</div>'
rep('E4 Tap to open line', E4_OLD, E4_NEW)

# ── post-conditions (in memory, before writing) ──
post = [
    ('function achievablePacePerMile', 0), ('achievablePacePerMile', 0),
    ('secsToMMSS', 0), ('applySuggestedPace', 0),
    ('function formatPacePer100', 1), ('function formatPacePerMile', 1),
    ("desc:'Get consistent, increase mileage safely'", 1),
    ('6.2 miles. A solid aerobic base.', 1), ('13.1 miles. Serious endurance.', 1),
    ('26.2 miles. The full distance.', 1),
    ('A distance and a time. 1.5 miles under 10 minutes. A mile under 6.', 1),
    ('Open water race. 750 m to 1.9 km.', 1),
    ('Outdoor or treadmill. Pace, distance and race goals.', 1),
    ('Spin bike or outdoor. Intervals, FTP and distance.', 1),
    ('Lap pool or open water. Structured sets.', 1),
    ('Tap to open the calendar. The final weeks taper so you arrive fresh.', 1),
    ('<meta name="ia-version" content="222">', 1),
]
for s, want in post:
    c = src.count(s)
    if c != want:
        print('ABORT post-condition %r: count=%d want=%d. Nothing written.' % (s, c, want))
        sys.exit(1)
print('OK    post-conditions (%d)' % len(post))

open(PATH, 'w', encoding='utf-8').write(src)
print('WROTE %s  bytes %d -> %d  lines %d -> %d' % (PATH, len(orig.encode('utf-8')), len(src.encode('utf-8')),
                                                   orig.count('\n'), src.count('\n')))
