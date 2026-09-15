#!/usr/bin/env python3
# V195 — D64 + D71: the Wildcard stops forging a completion.
# Anchor-asserted, count==1 before writing, version meta bumped LAST.
# Nothing here touches buildProgram, cfg, any pool or any prescription: digest-neutral.
import io, sys, os

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'index.html')
SRC = os.path.abspath(SRC)
s = io.open(SRC, encoding='utf-8').read()
orig = s
edits = []

def rep(tag, old, new):
    edits.append((tag, old, new))

# ── 1. CSS: the W mark and the day tag. Signal orange via the DS token --signal (#CF4E1A).
rep('css/wc-mark+wc-tag',
r""".wk-day-num .chk{color:var(--run);}""",
r""".wk-day-num .chk{color:var(--run);}
.wk-day-num .wc-mark{color:var(--signal);}
.wc-mark{display:inline-flex;align-items:center;gap:1px;color:var(--signal);line-height:1;}
.wc-mark-w{font-family:var(--font-display);font-weight:800;font-size:11px;letter-spacing:0;}
.wc-tag{display:flex;align-items:center;gap:10px;margin:0 16px 12px;padding:10px 12px;background:var(--surface);border:1px solid var(--border2);border-left:3px solid var(--signal);border-radius:4px;}
.wc-tag-txt{min-width:0;}
.wc-tag-lbl{font-family:var(--font-display);font-size:10px;font-weight:700;letter-spacing:0.09em;text-transform:uppercase;color:var(--signal);margin-bottom:3px;}
.wc-tag-sub{font-size:12px;color:var(--muted);line-height:1.5;}""")

# ── 2. The Wildcard surface: its own store, its own day resolution, its own celebration.
rep('completeWildcard+helpers',
r"""function completeWildcard(title){
  const done=getWildcardDone();
  if(!done.some(d=>d.title===title)) done.push({title,ts:Date.now()});
  saveWildcardDone(done);
  markDayComplete(currentWeek,currentRandDayKey,title);
  updateRandCounter();showToast(title+' logged ✓');closeRandom();
}""",
r"""// ── V195 (D64/D71): A WILDCARD IS A SUBSTITUTE, NOT A COMPLETION ─────────────
// Until V194 completeWildcard called markDayComplete, which wrote a `complete` record
// into ia_comp_ and froze the day into ia_hist_. Three consequences, all wrong: a rest
// day was marked trained, a prescribed session the athlete never did was marked done,
// and openDetail renamed that day's header to the Wildcard's title forever. The stamp
// also landed on `currentWeek` (the week being VIEWED) paired with today's weekday, so
// browsing week 11 in week 9 wrote the record two months out.
// The record now lives in ia_wild_ only. ia_comp_ has three readers that treat the mere
// EXISTENCE of a record as "this day was touched" (refreshProgram freezes it,
// restMoveCandidates disqualifies it as a rest-move target, maybeShowReminder suppresses
// the next-day nudge). None of those were ruled, so nothing on this path writes there.
// The day is resolved from the DATE, with the same arithmetic scheduledDays uses. Off
// the calendar of the block, the Wildcard still logs to the counter and refuses to stamp
// any day at all rather than stamping the wrong one.
function wildcardDayFor(now){
  if(!activeProg||!activeProg.startDate||!activeProg.weeks) return null;
  const d=new Date(now||new Date()); d.setHours(0,0,0,0);
  const mon=getWeekMonday(activeProg.startDate);
  const diff=Math.round((d.getTime()-mon.getTime())/86400000);   // round: DST-safe day count
  if(diff<0) return null;
  const week=Math.floor(diff/7)+1;
  const tw=activeProg.totalWeeks||Object.keys(activeProg.weeks).length;
  if(week<1||week>tw) return null;
  const dayKey=['mon','tue','wed','thu','fri','sat','sun'][diff%7];
  if(!activeProg.weeks[week]||!activeProg.weeks[week][dayKey]) return null;
  if(dayBeforeStart(activeProg,week,dayKey)) return null;        // V174 (D24): outside the block
  return {week:week,dayKey:dayKey};
}
// ia_wild_ entries are deduped by title by the surface itself (a title already done shows
// the done block, never the Complete button), so one title carries at most one day stamp.
// Pre-V195 entries have no week/dayKey and simply render no mark.
function wildcardDaySet(){
  const m={};
  getWildcardDone().forEach(x=>{ if(x&&x.week&&x.dayKey) m[completedKey(x.week,x.dayKey)]=x; });
  return m;
}
function wildcardOn(week,dayKey){
  if(!week||!dayKey) return null;
  return wildcardDaySet()[completedKey(week,dayKey)]||null;
}
// Flame plus a W, signal orange, inline SVG from the icon table. Never emoji.
function wildcardMarkHTML(size){
  size=size||14;
  return '<span class="wc-mark" aria-label="Wildcard done">'+asyIcon('flame',size)+'<span class="wc-mark-w">W</span></span>';
}
// The tag names the prescribed session out loud. That is the guardrail: the athlete has
// to be able to see that the session they were given is still waiting.
function wildcardTagHTML(week,dayKey){
  const wc=wildcardOn(week,dayKey); if(!wc) return '';
  const day=activeProg&&activeProg.weeks&&activeProg.weeks[week]?activeProg.weeks[week][dayKey]:null;
  const sub=(day&&day.rest)
    ? 'Rest day. The streak sits this one out.'
    : ((day&&day.title)||'Your session')+' is still on the board.';
  return '<div class="wc-tag">'+wildcardMarkHTML(16)
    +'<div class="wc-tag-txt"><div class="wc-tag-lbl">WILDCARD DONE</div>'
    +'<div class="wc-tag-sub">'+esc(sub)+'</div></div></div>';
}
// Its own dispatcher. fireCompletionPopup escalates to the season banner on the final
// scheduled day, and that banner claims the block is finished — a Wildcard may never
// say that, claim a PR, or claim progress.
function fireWildcardPopup(isTraining){
  popFire('workout',{
    kicker:'WILDCARD DONE',
    msg:'You showed up. That is the whole game.',
    sub:isTraining?('Streak: '+computeStreak()+'.'):'Streak holds.'
  });
}
function completeWildcard(title){
  const done=getWildcardDone();
  const slot=wildcardDayFor(new Date());
  if(!done.some(d=>d.title===title)) done.push({title,ts:Date.now(),week:slot?slot.week:null,dayKey:slot?slot.dayKey:null});
  saveWildcardDone(done);
  const day=(slot&&activeProg&&activeProg.weeks&&activeProg.weeks[slot.week])?activeProg.weeks[slot.week][slot.dayKey]:null;
  const isTraining=!!(day&&!day.rest);
  updateRandCounter();showToast(title+' logged ✓');closeRandom();
  if(activeProg) renderWeekView();
  setTimeout(()=>fireWildcardPopup(isTraining),380);
}""")

# ── 3. Week strip: the W renders where the checkmark would, only when the day is not complete.
rep('strip/W-mark',
r"""    if(st==='complete'||st==='partial') center='<span class="chk">\u2713</span>';   // V181 (D1): legacy partial reads as done""",
r"""    if(st==='complete'||st==='partial') center='<span class="chk">\u2713</span>';   // V181 (D1): legacy partial reads as done
    else if(wildcardOn(currentWeek,d)) center=wildcardMarkHTML(14);                  // V195 (D64): a Wildcard is marked, never checked""")

# ── 4. Week view: the day tag rides under the hero.
rep('weekview/tag',
r"""  list.innerHTML=strip+hero+stats+leg;""",
r"""  const _wcTag=wildcardTagHTML(currentWeek,heroKey);   // V195 (D64)
  list.innerHTML=strip+hero+_wcTag+stats+leg;""")

# ── 5. Day detail: the same tag, on the session it did not complete.
rep('detail/tag',
r"""  const _rtNudge=rangeTopNudgeHTML(day); if(_rtNudge) html=_rtNudge+html;""",
r"""  const _rtNudge=rangeTopNudgeHTML(day); if(_rtNudge) html=_rtNudge+html;
  const _wcTag=wildcardTagHTML(currentWeek,dayKey); if(_wcTag) html=_wcTag+html;   // V195 (D64)""")

# ── 6. Streak: a training-day Wildcard extends it. scheduledDays already excludes rest
#     days, so a rest-day Wildcard is invisible here: it neither extends nor breaks.
rep('streak/wildcard',
r"""    if(st==='complete'||st==='partial') n++;""",
r"""    if(st==='complete'||st==='partial'||wildcardOn(days[i].week,days[i].d)) n++;   // V195 (D71)""")

# ── 7. The filter-bar label lie: RAND_POOLS has no `endurance` key, so "My Goal (Endurance)"
#     printed a pool that getActivePool never returned. The label stops naming the pool.
#     The pool itself is D66, a later version.
rep('randfilter/label',
r"""function buildRandFilterBar(){
  const goal=activeProg?.goal||'balanced';
  const labels={strength:'Strength',hypertrophy:'Size',fatloss:'Fat Loss',athletic:'Athletic',balanced:'Balanced',endurance:'Endurance'};
  document.getElementById('randFilterBar').innerHTML=[
    {id:'mine',label:'My Goal ('+labels[goal]+')'},""",
r"""function buildRandFilterBar(){
  // V195 (D64): the parenthetical named a pool that does not exist. getActivePool falls
  // back to RAND_POOLS.balanced for every goal RAND_POOLS has no key for, so the label
  // was describing a draw the athlete was not getting. The pool gap itself is D66.
  document.getElementById('randFilterBar').innerHTML=[
    {id:'mine',label:'My Goal'},""")

# ── 8. Version meta LAST.
rep('version',
r"""<meta name="ia-version" content="194">""",
r"""<meta name="ia-version" content="195">""")

fail = False
for tag, old, new in edits:
    n = s.count(old)
    print('anchor %-28s count=%d' % (tag, n))
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
io.open(SRC, 'w', encoding='utf-8').write(s)
print('WROTE %s (%d -> %d bytes)' % (SRC, len(orig), len(s)))
