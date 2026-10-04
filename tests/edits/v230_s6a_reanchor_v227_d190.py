#!/usr/bin/env python3
# v230_s6a_reanchor_v227_d190.py — V230 slice 6a: re-anchor four shipped entries of tests/sabotage/v227_d190.json whose
# anchors include the lines D194 part 2 (V230, the lens alone, R3′) moved onto _dayPlanCfg. Session call 10
# (tests/measure/v230_rulings/v230_session_calls.md): same mutation intent, same gate, the V229 precedent
# (tests/edits/v229_sa2_reanchor_v227_a.py, v229_sa3_reanchor_v227_b.py).
#   #0 S1-D190 R3 (a), #1 S1-D190 R3 (b): the anchor's filter call line moves (`],activeProg.cfg)` -> `],_dayPlanCfg(activeProg,day))`);
#                                         the replacement (`const _fs=null;`) carries no moved text and stays byte-identical.
#   #6 S4-D190 R4: anchor and replacement both carry the tap guard and the tap filter call; both rewritten in both.
#   #7 S5-D190 R5: anchor and replacement both carry the boot guard and the boot filter call; both rewritten in both.
# The new strings are built from the old ones by the four exact substring swaps of the V230 build (nothing retyped); each
# swap must apply exactly the expected number of times to each string. Names and gates stay; each note gains one suffix.
# Checks: index.html sha starts 72ac41c8d340 (the V230 candidate); names as expected; each OLD anchor counts 0 on the
# candidate (stale); each NEW anchor counts 1; replacement != anchor; not already re-anchored; the JSON round-trips
# (indent 1, real UTF-8). All-or-none: written once at the end.
import hashlib, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
ART = os.path.join(ROOT, 'index.html')
P = os.path.join(ROOT, 'tests', 'sabotage', 'v227_d190.json')
if hashlib.sha256(open(ART, 'rb').read()).hexdigest()[:12] != '72ac41c8d340':
    sys.exit('REFUSED: index.html is not the V230 candidate 72ac41c8d340')
SRC = open(ART, encoding='utf-8').read()
# the four lens swaps, V229 -> V230 (L1 boot guard, L2 boot filter cfg, L3 tap guard, L4 tap filter cfg)
SW = [
 ('if(hit && prog.cfg && prog.cfg.injury){', 'if(hit && _dayPlanCfg(prog,day).injury){'),
 ('applyInjuryFilter(day.sections,prog.cfg)', 'applyInjuryFilter(day.sections,_dayPlanCfg(prog,day))'),
 ('if(activeProg&&activeProg.cfg&&activeProg.cfg.injury){', 'if(activeProg&&_dayPlanCfg(activeProg,day).injury){'),
 ('}]}],activeProg.cfg)', '}]}],_dayPlanCfg(activeProg,day))'),
]
for o, n in SW:
    if SRC.count(o) != 0: sys.exit('ABORT: V229 form ' + repr(o) + ' still counts ' + str(SRC.count(o)) + ' on the candidate; nothing written')
    if SRC.count(n) != 1: sys.exit('ABORT: V230 form ' + repr(n) + ' counts ' + str(SRC.count(n)) + ' on the candidate; nothing written')
def swap(s, want, tag):
    # want: the swap indices that must apply exactly once to s; every other swap must apply zero times
    for k, (o, n) in enumerate(SW):
        c = s.count(o)
        if c != (1 if k in want else 0):
            sys.exit('ABORT: ' + tag + ' swap L' + str(k + 1) + ' counts ' + str(c) + ' (want ' + str(1 if k in want else 0) + '); nothing written')
        s = s.replace(o, n)
    return s
NAME = {
 0: "S1-D190 R3 (a) -> the live filter call in applySwapChoice is dropped: the plan never re-decides the cue on the tapped card",
 1: "S1-D190 R3 (b) -> the live filter call in applySwapChoice is dropped: cue <=> cap breaks on the live hop",
 6: 'S4-D190 R4 -> the live filter moves above _reRx: a cue the filter appends reads as a moved dose and flips the toast',
 7: "S5-D190 R5 -> the boot re-filter in applySessionSwaps is disabled: the boot replays the cue-free carry and never writes the plan's cue",
}
# expected swaps per entry: (anchor, replacement)
WANT = {0: ({3}, set()), 1: ({3}, set()), 6: ({2, 3}, {2, 3}), 7: ({0, 1}, {0, 1})}
SUFFIX = ' (re-anchored at V230: D194 part 2 moved the guard / filter cfg onto _dayPlanCfg)'
raw = open(P, encoding='utf-8').read(); d = json.loads(raw)
if json.dumps(d, indent=1, ensure_ascii=False) + '\n' != raw:
    sys.exit('ABORT: v227_d190.json does not round-trip (indent 1, ensure_ascii False); nothing written')
for i in sorted(NAME):
    e = d[i]
    if e.get('name') != NAME[i]: sys.exit('ABORT: #' + str(i) + ' name is ' + repr(e.get('name'))[:90] + '; nothing written')
    if e.get('note', '').endswith(SUFFIX) or 'V230' in e.get('note', ''): sys.exit('ABORT: #' + str(i) + ' already re-anchored; nothing written')
    if SRC.count(e['anchor']) != 0: sys.exit('ABORT: #' + str(i) + ' old anchor counts ' + str(SRC.count(e['anchor'])) + ' (not stale); nothing written')
    wa, wr = WANT[i]
    a = swap(e['anchor'], wa, '#' + str(i) + ' anchor')
    r = swap(e['replacement'], wr, '#' + str(i) + ' replacement')
    if SRC.count(a) != 1: sys.exit('ABORT: #' + str(i) + ' new anchor counts ' + str(SRC.count(a)) + '; nothing written')
    if a == r: sys.exit('ABORT: #' + str(i) + ' replacement == anchor; nothing written')
    e['anchor'] = a; e['replacement'] = r; e['note'] = e['note'] + SUFFIX
    print('re-anchored v227_d190.json #' + str(i) + ' | ' + e['name'][:70])
with open(P, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(json.dumps(d, indent=1, ensure_ascii=False) + '\n')
print('wrote ' + P)
