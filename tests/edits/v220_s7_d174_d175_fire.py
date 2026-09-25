#!/usr/bin/env python3
# V220 slice 7 of ~14. No version bump in this slice. Last index.html logic slice for the pop-up.
#   D174 (P-EMOJI) s5 mechanism: popFire's icon slot renders an ASY_ICON_PATHS NAME as SVG
#        (asyIcon(name,52); 52 = the .pop-icon font-size) and writes anything else as text.
#        An emoji never goes through asyIcon (ASY_EMOJI would turn the fire and trophy
#        celebration emoji into SVG against Mario's call).
#   D174 s3 reminder rider: the >=7 re-entry message loses its mid-sentence dash.
#   D175 (P-POPCOND) s2a: week/dayKey threaded fireCompletionPopup -> fireWorkoutPopup -> popFire
#        -> popPick. s1b + s6 decision 2: the reminder pool is wired on the _gap<7 branch, the
#        doctrine sentence moves into the sub, the >=7 message stays whole. The old short-gap fixed
#        string leaves the source (ruled; makes P-EMOJI s3 row 2 moot).
# Rulings: tests/measure/v220_rulings/p_emoji_ruling.md s3, s5; p_popcond_ruling.md s1b, s2a, s6.
# Untouched: stats (and the fire emoji in the streak stat label), season/streak dispatch, the
#   reminder actions, markReminded, ia_remind_last_.
# Non-ASCII in this script: the two old em-dashes in the reminder anchor and the middle dot of
# the day-identity sub (literal bytes). No emoji. No backslashes.
import sys

P = '/Users/CanasBangin/Desktop/TheBig6V2/index.html'
src = open(P, 'rb').read().decode('utf-8')

E1A_OLD = """  document.getElementById('popIcon').textContent=opts.icon||cfg.icon;
"""
E1A_NEW = """  // V220 (D174): an ASY_ICON_PATHS name ('notebook', 'shield', 'warning') renders as SVG at the
  // .pop-icon size; anything else, i.e. the celebration emoji, is written as text exactly as
  // before. An emoji never goes through asyIcon: ASY_EMOJI maps the fire and trophy to SVG.
  const ic=opts.icon||cfg.icon; const icEl=document.getElementById('popIcon');
  if(Object.prototype.hasOwnProperty.call(ASY_ICON_PATHS,ic)) icEl.innerHTML=asyIcon(ic,52);
  else icEl.textContent=ic;
"""

E1B_OLD = """  document.getElementById('popMsg').textContent=opts.msg||popPick(tier);
"""
E1B_NEW = """  document.getElementById('popMsg').textContent=opts.msg||popPick(tier,opts.week,opts.dayKey);   // V220 (D175) the trained day
"""

E2_OLD = """function fireWorkoutPopup(){
  popFire('workout',{ stats:["""
E2_NEW = """function fireWorkoutPopup(week,dayKey){
  popFire('workout',{ week:week, dayKey:dayKey, stats:["""

E3_OLD = """  if(streakMilestone(streak)){ fireStreakPopup(streak); return; }
  fireWorkoutPopup();
"""
E3_NEW = """  if(streakMilestone(streak)){ fireStreakPopup(streak); return; }
  fireWorkoutPopup(week,dayKey);
"""

E4_OLD = """  const _remMsg=_gap>=7
    ? 'More than a week off. Mark what happened, then ease back in — first sessions back at reduced effort. Never chase missed work.'
    : 'This one got away from you. Mark it and move on — the week ahead stays as written. Never cram a missed session back in.';
  popFire('reminder',{
    msg:_remMsg,
    sub:DAY_FULL[target.d]+', Wk '+target.week+' · '+(day.title||'Workout'),
"""
E4_NEW = """  // V220 (D175, P-POPCOND 1b): a short gap draws a reminder-pool line and the sub carries the
  // doctrine; a week or more keeps the fixed re-entry guidance whole.
  const _remMsg=_gap>=7
    ? 'More than a week off. Mark what happened, then ease back in. First sessions back at reduced effort. Never chase missed work.'
    : popPick('reminder',target.week,target.d);
  const _remSub=DAY_FULL[target.d]+', Wk '+target.week+' · '+(day.title||'Workout');
  popFire('reminder',{
    msg:_remMsg,
    sub:_gap>=7?_remSub:_remSub+'. The week ahead stays as written.',
"""

EDITS = [
    ('D174-ICON popFire icon slot', E1A_OLD, E1A_NEW),
    ('D175-THREAD popFire popPick', E1B_OLD, E1B_NEW),
    ('D175-THREAD fireWorkoutPopup', E2_OLD, E2_NEW),
    ('D175-THREAD fireCompletionPopup', E3_OLD, E3_NEW),
    ('D174-COPY + D175-REMINDER maybeShowReminder', E4_OLD, E4_NEW),
]

for name, old, new in EDITS:
    c = src.count(old)
    if c != 1:
        print('ABORT %s: anchor count %d (want 1); nothing written' % (name, c))
        sys.exit(1)
    src = src.replace(old, new, 1)
    print('ok   %s' % name)

open(P, 'wb').write(src.encode('utf-8'))
print('wrote', P)
