#!/usr/bin/env python3
# V195 second pass — Part 1: a Wildcard rescues a skipped day's streak.
#
# Ruling (Mario concurred): the skip describes the PRESCRIBED SESSION; the Wildcard
# describes WHAT THE ATHLETE ACTUALLY DID. Two facts about one day. The streak measures
# attendance and the athlete attended, so a Wildcard counts even on a day marked skipped.
# Order of events is irrelevant: both sequences land on the same stored state.
#
# computeStreak broke on st==='skipped' BEFORE it ever reached the Wildcard clause, so a
# skipped day carrying a Wildcard set the streak to 0. The three clauses are reordered so
# that completion wins first (a day with both still counts ONCE), then the Wildcard, then
# the skip break. A skipped day with NO Wildcard still breaks: that control stays live.
# scheduledDays already excludes rest days before any status lookup, so a rest-day Wildcard
# is still invisible here and neither extends nor breaks.
#
# ia-version is NOT bumped: V195 is uncommitted, the number stays 195.
# Digest-neutral: nothing here touches buildProgram, cfg, any pool or any prescription.
import io, sys, os

SRC = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html'))
s = io.open(SRC, encoding='utf-8').read()
orig = s
edits = []

def rep(tag, old, new):
    edits.append((tag, old, new))

# 1. The doc line above computeStreak stops describing the old precedence.
rep('streak/doc',
r"""// Streak: trailing run of scheduled days; complete OR partial extends, skipped breaks, pending is transparent.""",
r"""// Streak: trailing run of scheduled days. Precedence, highest first (V195 D71b):
//   complete / partial -> counts (a day holding BOTH a completion and a Wildcard counts ONCE)
//   Wildcard           -> counts, even when the day is marked skipped
//   skipped            -> breaks
//   pending            -> transparent, keep walking
// The skip is a fact about the PRESCRIBED SESSION. The Wildcard is a fact about what the
// athlete actually did. The streak measures attendance, and a Wildcard is attendance.
// Rest days never reach here: scheduledDays drops them before any status lookup, so a
// rest-day Wildcard still neither extends the streak nor breaks it.""")

# 2. The reorder itself.
rep('streak/rescue',
r"""    const st=statusOf(days[i].week,days[i].d);
    if(st==='skipped') break;
    if(st==='complete'||st==='partial'||wildcardOn(days[i].week,days[i].d)) n++;   // V195 (D71)
    // pending -> transparent, keep walking""",
r"""    const st=statusOf(days[i].week,days[i].d);
    if(st==='complete'||st==='partial'){ n++; continue; }                          // V195 (D71): short-circuit, so both facts on one day count once
    if(wildcardOn(days[i].week,days[i].d)){ n++; continue; }                       // V195 (D71b): a Wildcard rescues a skipped day
    if(st==='skipped') break;                                                      // a skip with no Wildcard still breaks
    // pending -> transparent, keep walking""")

fail = False
for tag, old, new in edits:
    n = s.count(old)
    print('anchor %-16s count=%d' % (tag, n))
    if n != 1:
        print('ABORT: anchor %s count=%d, expected 1' % (tag, n))
        fail = True
        break
    s = s.replace(old, new, 1)

if fail:
    print('NO WRITE')
    sys.exit(1)
if s == orig:
    print('ABORT: no change')
    sys.exit(1)

# ia-version must still read 195 (V195 is uncommitted; no bump this pass).
if '<meta name="ia-version" content="195">' not in s:
    print('ABORT: ia-version is not 195')
    sys.exit(1)

io.open(SRC, 'w', encoding='utf-8').write(s)
print('WROTE %s (%d -> %d bytes)' % (SRC, len(orig), len(s)))
