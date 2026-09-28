#!/usr/bin/env python3
# V223 slice S3 of D182 (P-RACEDATE), the last code slice:
#   E1  D182-parse    Mile lock sheet: one local parse through raceCountdown. "Days out" is the
#                     helper's days while days >= 1, and the formatter's own "Race day" /
#                     "Behind you" words at 0 and below. "Race day" row prints _fmtStartDay(iso, true).
#                     The unreadable-date guard stays (null countdown = no date rows).
#   E2  D182-parse    Wizard review row: _fmtStartDay(WD.raceDate, true) plus the phrase from
#                     raceCountdown(WD.raceDate): "(N weeks away)" / "(1 week away)" /
#                     "(N days away)" / "(1 day away)" / "(race day)". Past the race: no phrase
#                     (the ruling states none).
#   E3  D182-comment  WD.raceDateWeeks writer in updateRaceDateFeedback: still written, now unread.
#   E4  D182-literal  Program literal drops raceDate/raceDateWeeks. PARKED: removing the two keys
#                     moves HALF_MANNY 0ac7da6b1691a8e1 -> f4caf0db22192178 (progDigest hashes the
#                     whole object), refuting the ruling's "HALF_MANNY unchanged". Its anchor is
#                     asserted on every run; it is applied ONLY with --e4, after a ruling that
#                     printed the digest first (standing ruling 5).
# No ia-version bump in this slice (stays 222). Every anchor asserted count==1 before
# anything is written; the first miss aborts and nothing is written.
# Usage: v223_s3_d182_sheet_review_literal.py [--e4] [target.html]
import sys

args = [a for a in sys.argv[1:] if a != '--e4']
APPLY_E4 = '--e4' in sys.argv[1:]
PATH = args[0] if args else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

# Preconditions: S1 and S2 are in the tree.
for tok in ('function raceCountdown(raceIso, todayIso){', 'function raceCountdownWords(cd){',
            'function _fmtStartDay(iso, withYear){'):
    if src.count(tok) != 1:
        print('ABORT: precondition %r not found exactly once; nothing written' % tok); sys.exit(1)
if '<meta name="ia-version" content="222">' not in src:
    print('ABORT: ia-version is not 222; nothing written'); sys.exit(1)

EDITS = []

# E1: D182-parse, mile lock sheet facts block.
E1_OLD = (
"      let rd=null; try{ rd=new Date(c.raceDate); }catch(_){ rd=null; }\n"
"      if(rd && !isNaN(rd.getTime())){\n"
"        const today=new Date(); today.setHours(0,0,0,0);\n"
"        const rdm=new Date(rd.getTime()); rdm.setHours(0,0,0,0);\n"
"        let rs=''; try{ rs=rd.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }catch(_){ rs=String(c.raceDate); }\n"
"        facts+='<div class=\"det-row\"><span class=\"k\">Days out</span><span class=\"v\">'+Math.round((rdm-today)/86400000)+'</span></div>';\n"
"        facts+='<div class=\"det-row\"><span class=\"k\">Race day</span><span class=\"v\">'+rs+'</span></div>';\n"
"      }\n"
)
E1_NEW = (
"      // D182 (V223): one local parse through raceCountdown, the helper the card's \"Time out\" row\n"
"      // reads, so the popup and the card agree (V203). Days at every horizon (D116: three weeks\n"
"      // out the taper is lived in days); at 0 and below, the formatter's own words. A null\n"
"      // countdown is an unreadable date: no date rows, as before.\n"
"      const cd=raceCountdown(c.raceDate);\n"
"      if(cd && isFinite(cd.days)){\n"
"        const out=cd.days>=1 ? String(cd.days) : raceCountdownWords(cd).card;\n"
"        let rs=''; try{ rs=_fmtStartDay(c.raceDate, true); }catch(_){ rs=String(c.raceDate); }\n"
"        facts+='<div class=\"det-row\"><span class=\"k\">Days out</span><span class=\"v\">'+out+'</span></div>';\n"
"        facts+='<div class=\"det-row\"><span class=\"k\">Race day</span><span class=\"v\">'+rs+'</span></div>';\n"
"      }\n"
)
EDITS.append(('E1 mile sheet', E1_OLD, E1_NEW))

# E2: D182-parse, wizard review row.
E2_OLD = (
"['Race date', new Date(WD.raceDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})"
"+(WD.raceDateWeeks?' ('+WD.raceDateWeeks+' weeks away)':'')]"
)
E2_NEW = (
"['Race date', _fmtStartDay(WD.raceDate, true)+(()=>{ /* D182 (V223): the number is raceCountdown's, so this row and the card cannot drift; past the race, no phrase */ "
"const cd=raceCountdown(WD.raceDate), w=raceCountdownWords(cd); "
"return !w||cd.days<0 ? '' : cd.days===0 ? ' ('+w.copy+')' : ' ('+w.card+' away)'; })()]"
)
EDITS.append(('E2 wizard review', E2_OLD, E2_NEW))

# E3: D182-comment, the WD.raceDateWeeks writer. Line otherwise unchanged.
E3_OLD = "  WD.raceDateWeeks = weeksUntil;\n"
E3_NEW = "  WD.raceDateWeeks = weeksUntil;   // unread since D182 (P-RACEDATE): the review row and the card read raceCountdown; still written, removal is §12 debt\n"
EDITS.append(('E3 raceDateWeeks comment', E3_OLD, E3_NEW))

# E4: D182-literal. PARKED unless --e4 (see header). Anchor asserted either way.
E4_OLD = "primaryPath:cfg.primaryPath,raceDate:cfg.raceDate||null,raceDateWeeks:cfg.raceDateWeeks||null,legRecoveryNote:"
E4_NEW = "primaryPath:cfg.primaryPath,legRecoveryNote:"
if APPLY_E4:
    EDITS.append(('E4 program literal', E4_OLD, E4_NEW))
elif src.count(E4_OLD) != 1:
    print('ABORT: E4 program literal anchor count=%d (want 1); nothing written' % src.count(E4_OLD)); sys.exit(1)
else:
    print('E4 program literal: anchor count=1, PARKED (not applied; pass --e4 only after a digest ruling)')

# Assert every anchor first; abort on the first miss with nothing written.
for name, old, new in EDITS:
    n = src.count(old)
    if n != 1:
        print('ABORT: %s anchor count=%d (want 1); nothing written' % (name, n)); sys.exit(1)
    print('%s: anchor count=1' % name)

out = src
for name, old, new in EDITS:
    out = out.replace(old, new, 1)

open(PATH, 'w', encoding='utf-8').write(out)
print('WROTE %s (%d edits)' % (PATH, len(EDITS)))
