#!/usr/bin/env python3
# V223 slice S7 (D183 slice S4) of D183 (P-SAFEPACE), per tests/measure/v223_rulings/p_safepace_ruling.md
# R1 (the button goes on both surfaces; one inversion reads the athlete), R3 (card copy and colour, plus the
# first AMENDMENT's two null rows), D183 AMENDMENT 2 (a) digits and the singular rule, (b) the beginner
# sentence, (c) the sentence attaches only where tw is set, (f) assessRunPaceCeiling(L) takes the fold's
# L = tw || len and its own run-only calcProgramLength line goes, and D183 AMENDMENT 3 (F3: the undated
# frame loses its heading and its siren; F4(i): no glyph on any framed card row; F4(ii): the past-date line
# and the non-test under-a-week line stay --red with the warning icon).
#   E1  D183-ceiling(L)          assessRunPaceCeiling(L): comment rewritten, run-only _pg/L lines out, the
#                                45 s tolerance line verbatim, wider return {L, achievable, safeTotal, tTotal,
#                                cur, fromMile, exp, distLabel}; tm/ts gone.
#   E2  D183-sentence(R1)        paceCeilingSentence(f) (mile / beginner / default) + paceCeilingOfferHTML(f)
#       D183-button-removal      reduced to the accent frame around the sentence: no icon, no heading, no button.
#       D183-glyph
#   E3  D183-ceiling(L)          the fold passes L = (p && p.tw) || len.
#   E4  D183-card(R3)            card body between two count==1 markers: raceCountdown in place of
#       D183-button-removal      daysUntil/weeksUntil (D182 handoff), the R3 test rows incl. the two null rows,
#       D183-glyph               no dated button, dash-free non-test rows, no glyph on framed rows.
# Every anchor is asserted count==1 on the tree before any write; the first miss aborts and nothing is written.
# Removed spans are printed to stdout for the record. No ia-version bump (stays 222).
# Usage: v223_s7_d183_reach_card.py [target.html]
import sys

PATH = sys.argv[1] if len(sys.argv) > 1 else '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(PATH, encoding='utf-8').read()

def die(msg):
    print('ABORT: ' + msg + '; nothing written'); sys.exit(1)

def one(hay, tok, what):
    n = hay.count(tok)
    if n != 1: die('%s: anchor count %d, want 1: %r' % (what, n, tok[:120]))
    return hay.index(tok)

if '<meta name="ia-version" content="222">' not in src:
    die('ia-version is not 222')
# S1..S3 must be on the tree: the fold exists and passes the ceiling to updatePaceFeasibility(f).
for tok in ('function updateRaceDateFeedback() {',
            '  updatePaceDisplay();\n  updatePaceFeasibility(_f);\n  const feedback = document.getElementById(\'raceDateFeedback\');',
            'function updatePaceFeasibility(f) {',
            'function wizardTestPin(){',
            'function raceCountdown(raceIso, todayIso){'):
    one(src, tok, 'precondition')
if src.count('function paceCeilingSentence(') != 0: die('paceCeilingSentence already defined')

def span_replace(s, start, end, new, what, must_hold=()):
    a = one(s, start, what + ' start')
    b = one(s, end, what + ' end')
    if not a < b: die('%s: start %d not before end %d' % (what, a, b))
    old = s[a:b + len(end)]
    for tok in must_hold:
        if old.count(tok) != 1: die('%s: removed span must hold %r once, holds %d' % (what, tok[:80], old.count(tok)))
    print('=== %s removed span (%d chars) ===' % (what, len(old)))
    print(old)
    return s[:a] + new + s[b + len(end):]

# ---------------------------------------------------------------- E1 the whole ceiling
TOL = '  if(achievable - tPacePerMile < 45) return null;\n'
E1_START = '// Race-INDEPENDENT pace-feasibility advisory for run_pace_goal. The race-date panel only\n'
E1_END = "    distLabel: (g.targetDist || '1.5') + (g.paceUnit || 'mi')\n  };\n}\n"
E1_NEW = r'''// D183 (P-SAFEPACE R1, amendment 2 (f)): the one pace ceiling for run_pace_goal. Both surfaces read
// it: the undated #paceFeasLine frame and the dated card's reach sentence. L is the program's length and
// the caller passes it: updateRaceDateFeedback hands in the test week when one pins, else the header's
// all-sports length, because the engine ramps over totalWeeks and never over the run alone. Returns null
// when the goal is not a run pace goal, when the target is no faster than the current pace, or when it
// sits within ~45 s/mi of what L weeks reach; otherwise {L, achievable, safeTotal, tTotal, cur, fromMile,
// exp, distLabel}, which paceCeilingSentence reads.
function assessRunPaceCeiling(L) {
  const g = WD.cardioGoals['run'];
  if(!g || g.id !== 'run_pace_goal' || g.targetMins===undefined || g.targetMins==='' || !g.targetDist) return null;
  const exp = WD.experience || 'intermediate';
  const age = WD.ageBracket || '18-35';
  const rawDist = parseFloat(g.targetDist) || 1.5;
  const tDist = (g.paceUnit === 'km') ? rawDist * 0.621 : rawDist;
  const tTotal = (+g.targetMins||0)*60 + (+g.targetSecs||0);
  if(!(tDist > 0) || !(tTotal > 0)) return null;
  const tPacePerMile = tTotal / tDist;
  // Current pace, mirroring calcProgramLength exactly: the user's entered mile time when
  // present (non-beginner), otherwise the experience-default. Using the SAME baseline the
  // length engine uses is essential — otherwise a fast runner who entered a quick mile time
  // gets told to slow below their current pace.
  const expCurrentPace = {beginner:690, intermediate:570, advanced:450}[exp] || 570;   // V176 (D9)
  const mileBest = (exp !== 'beginner' && g.mileBestMins !== undefined && g.mileBestMins !== '')
    ? (+g.mileBestMins||0)*60 + (+g.mileBestSecs||0)
    : null;
  const currentPace = mileBest || expCurrentPace;
  if(tPacePerMile >= currentPace) return null; // target slower than current → reachable
  // Fastest pace reachable in L weeks FROM THE USER'S ACTUAL CURRENT PACE: the length engine's
  // forward pipeline inverted (undo the +1 grace, the age multiplier and raw*1.25 + 4).
  const paceImprove = {beginner:3, intermediate:5, advanced:7}[exp] || 4;
  const agePaceScale = {'55+':0.65, '36-54':0.85, '18-35':1.0}[age] || 1.0;
  const ageSafePaceImprove = +(paceImprove * agePaceScale).toFixed(2);
  const ageMult = {'55+':1.15, '36-54':1.07, '18-35':1.0}[age] || 1.0;
  const improvingWeeks = Math.max(0, ((L - 1) / ageMult - 4) / 1.25);
  const achievable = Math.max(currentPace - improvingWeeks * ageSafePaceImprove, 240);
  // Only flag a MEANINGFUL shortfall. Targets within ~45s/mi of what the full build
  // reaches are "ambitious but you'll get close" — flagging those is nagging.
  if(achievable - tPacePerMile < 45) return null;
  const safeTotal = achievable * tDist;
  return {L, achievable, safeTotal, tTotal, cur: currentPace, fromMile: !!mileBest, exp, distLabel: (g.targetDist || '1.5') + ' ' + (g.paceUnit || 'mi')};
}
'''
if E1_NEW.count(TOL) != 1: die('E1 new text must carry the 45 s line once')
src = span_replace(src, E1_START, E1_END, E1_NEW, 'E1 assessRunPaceCeiling',
                   must_hold=(TOL, "  const L = calcProgramLength(['run'], _pg, LIFTING_FOCUS_TO_GOAL[WD.liftingFocus] || 'balanced').weeks;\n",
                              'function assessRunPaceCeiling() {\n'))

# ---------------------------------------------------------------- E2 sentence + frame
E2_START = '// Self-contained advisory card for an out-of-reach pace, shared by both surfaces.\nfunction paceCeilingOfferHTML(f) {\n'
E2_END = "Use this pace instead</button>'+\n    '</div>';\n}\n"
FRAME_OPEN = "  return '<div style=\"color:var(--accent);font-size:12px;line-height:1.55;margin-top:6px;padding:9px 11px;background:var(--accent)18;border-radius:4px;border:1px solid var(--accent)44\">'+\n"
E2_NEW = r'''// D183 (P-SAFEPACE R1, amendment 2 (a)/(b)): the one sentence that reads the athlete. Digits, every time
// through _clkMS, singular at 1 week. It says what L weeks reach from where he is and leaves the goal his.
// It prints inside the undated frame below and on the dated card's tw rows (amendment 2 (c)).
function paceCeilingSentence(f) {
  const wk = f.L + (f.L === 1 ? ' week' : ' weeks');
  const reach = ' In '+wk+' that reaches about '+f.distLabel+' in '+_clkMS(f.safeTotal)+'. Your goal is '+_clkMS(f.tTotal)+'.';
  if(f.fromMile) return 'Your mile is '+_clkMS(f.cur)+'.'+reach+' Keep it or change it above.';
  if(f.exp === 'beginner') return 'Your paces start from the beginner default of '+_clkMS(f.cur)+' per mile.'+reach+' Keep it or change it above.';
  return 'You have not entered a mile time. The '+f.exp+' default is '+_clkMS(f.cur)+' per mile.'+reach+' Enter your mile above and this updates.';
}
// D183 (amendment 3): the undated #paceFeasLine frame. The accent frame around the R1 sentence and nothing
// else: no icon, no heading, no button. The dated card prints the same sentence inside its own row.
function paceCeilingOfferHTML(f) {
''' + FRAME_OPEN + r'''    paceCeilingSentence(f)+
    '</div>';
}
'''
src = span_replace(src, E2_START, E2_END, E2_NEW, 'E2 paceCeilingOfferHTML',
                   must_hold=(FRAME_OPEN, 'That pace is faster than safe progression allows from your current fitness.',
                              "onclick=\"applySuggestedPace('+f.tm+','+f.ts+')\""))

# ---------------------------------------------------------------- E3 the fold passes L
E3_OLD = '  const _f = assessRunPaceCeiling((p && p.tw) || undefined);   // L: the test week when one pins\n'
E3_NEW = '  const _f = assessRunPaceCeiling((p && p.tw) || len);   // D183 amendment 2 (f): L is the program\'s length, the test week when one pins, else the header\'s len\n'
one(src, E3_OLD, 'E3 fold')
src = src.replace(E3_OLD, E3_NEW, 1)

# ---------------------------------------------------------------- E4 card body
E4_START = '  const today = new Date(); today.setHours(0,0,0,0);\n  // Parse date string as local time to avoid UTC timezone shift\n'
E4_END = "  feedback.innerHTML = card(color, asyIcon('🚨',14)+' '+html);\n}\n"
PAST = "    feedback.innerHTML = '<div style=\"color:var(--red);font-size:12px;margin-top:6px\">'+asyIcon('⚠',13)+' That date has already passed.</div>';\n"
CARD = "  const card = (color, html) => '<div style=\"color:'+color+';font-size:12px;line-height:1.55;margin-top:6px;padding:9px 11px;background:'+color+'18;border-radius:4px;border:1px solid '+color+'44\">'+html+'</div>';\n"
RDW = '  WD.raceDateWeeks = weeksUntil;   // unread since D182 (P-RACEDATE): the review row and the card read raceCountdown; still written, removal is §12 debt\n'
D14A = r'''  // V188 (D14a): race goals count back from the race. The card names the derived start,
  // the opening week, and the floor; the "program stays intact, race lands in week N"
  // sentence below is NSW's and stays NSW-only.
  const _al = wizardAlignment();
'''
UNDER = "    feedback.innerHTML = '<div style=\"color:var(--red);font-size:12px;margin-top:6px\">'+asyIcon('⚠',13)+(_tg1 ? ' Your test is less than a week away. You get the test week only. Primer lifts, a shakeout, then the test.' : ' Less than a week away — not enough time to train.')+'</div>';\n"
WARN_RED = "'<div style=\"color:var(--red);font-size:12px;margin-top:6px\">'+asyIcon('⚠',13)+"
E4_NEW = r'''  // D182 (P-RACEDATE) handoff: one countdown, raceCountdown's (days rounded before weeks floor, so a
  // DST change inside the span cannot lose a week). A date it cannot read prints nothing.
  const cd = raceCountdown(WD.raceDate);
  if(!cd) {
    feedback.innerHTML = '';
    return;
  }
''' + RDW.replace('= weeksUntil;', '= cd.weeks;') + r'''
  // D183 amendment 3 F4(ii): a past date is an entry error, not a coaching state. Red with the
  // warning icon on every goal, test included.
  if(cd.days < 0) {
''' + PAST + r'''    return;
  }

''' + CARD + r'''
  // D183 (P-SAFEPACE R3, first amendment's null rows, amendment 3 F4(i)): a dated test goal. Every week
  // number is the pin's. Never red (the weeks are not his to change) and no glyph on a framed row. The
  // reach sentence attaches only where tw is set (amendment 2 (c)), never when the test falls before
  // the first training day or past the program's end.
  if(p) {
    const reach = _f ? '<div style="margin-top:5px">'+paceCeilingSentence(_f)+'</div>' : '';
    if(p.tw >= 2) feedback.innerHTML = card(_f ? 'var(--accent)' : 'var(--run)', 'Your test is in week '+p.tw+'. The program ends on it. The taper lands in front of it.'+reach);
    else if(p.tw === 1) feedback.innerHTML = card('var(--accent)', 'Your test is this week. You get the test week only. Primer lifts, a shakeout, then the test.'+reach);
    else if(p.week === null) feedback.innerHTML = card('var(--signal)', 'Your test is before your first training day. This program starts after it and does not include it.');
    else feedback.innerHTML = card('var(--accent)', 'Your test is in week '+p.week+'. This program is '+p.len+' weeks and ends before it.');
    return;
  }

  // Dated non-test goals keep their sentences, dashes removed (R3). Under a week out is an entry
  // error like the past date: red with the warning icon (amendment 3 F4(ii)).
  if(cd.weeks < 1) {
    feedback.innerHTML = ''' + WARN_RED + r'''' Less than a week away. Not enough time to train.</div>';
    return;
  }

''' + D14A + r'''  if(_al){
    feedback.innerHTML = card(_al.underFloor ? 'var(--signal)' : 'var(--run)', alignedStartCopy(_al));
    return;
  }

  // len is the fold's: the goal-driven length, never compressed by the race date.
  const diff = cd.weeks - len;
  if(diff > 0) {
    feedback.innerHTML = card('var(--run)', 'Your '+len+'-week program finishes '+diff+' week'+(diff>1?'s':'')+' before race day. Use the extra time to stay sharp.');
    return;
  }
  if(diff === 0) {
    feedback.innerHTML = card('var(--run)', 'Perfect timing. Your '+len+'-week program peaks on race day.');
    return;
  }
  // The race lands inside the program, before peak.
  const color = diff >= -2 ? 'var(--accent)' : 'var(--red)';
  feedback.innerHTML = card(color, cd.weeks+(cd.weeks === 1 ? ' week' : ' weeks')+' is short for this goal. The floor is '+len+'. Your full '+len+'-week program stays intact. Your race lands in week '+cd.weeks+'.');
}
'''
if E4_NEW.count(PAST) != 1 or E4_NEW.count(CARD) != 1 or E4_NEW.count(D14A) != 1: die('E4 new text lost a verbatim line')
src = span_replace(src, E4_START, E4_END, E4_NEW, 'E4 card body',
                   must_hold=(PAST, CARD, RDW, D14A, UNDER))

# ---------------------------------------------------------------- post-conditions, then write
for tok, want in (('function assessRunPaceCeiling(L) {', 1), ('function paceCeilingSentence(f) {', 1),
                  ('function paceCeilingOfferHTML(f) {', 1), ('Use this pace instead', 0),
                  ('That pace is faster than safe progression allows', 0), ("asyIcon('🚨',14)", 0),
                  ('assessRunPaceCeiling((p && p.tw) || len)', 1), ('assessRunPaceCeiling()', 0),
                  ("calcProgramLength(['run'], _pg", 0), (TOL, 1),
                  ('<meta name="ia-version" content="222">', 1)):
    n = src.count(tok)
    if n != want: die('post-condition %r count %d, want %d' % (tok, n, want))
open(PATH, 'w', encoding='utf-8').write(src)
print('OK: E1 E2 E3 E4 written to ' + PATH)
