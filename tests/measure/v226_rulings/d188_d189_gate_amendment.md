# D188/D189 — gate and sabotage amendment (build 5, V226): the rows measure refuted, re-ruled

Persisted verbatim by the orchestrator from coach's return, 2026-09-30 (coach is read-only). Fresh coach, scope gate rows and sabotage only; the index.html edits and copy stand as Mario accepted them. Evidence: `measure_sabotage_map_v226.md`.

Scope: `tests/gates/g226_d188_beginnermile.js`, `tests/gates/g226_d189_pacedisclose.js`, `tests/sabotage/v226.json`, and six rows in `v202.json`, `v203.json`, `v225.json`. No `index.html` edit. HALF_MANNY unmoved (`0ac7da6b1691a8e1`). Every literal below was printed from the V226 candidate this session (`scratchpad/coach2/cells.js`).

## Before (measured)
- G5 red on the candidate: the R3 token at :7491 sits 74 chars from `mileBest`, and E6 mandates it.
- S4 survives (0 rows). S8 moves 0/307 items. S9 trips G6b only. G1's SI literal dropped.
- NOT-APPLIED at 226: v202 #2, #8, #9, #11; v203 #3; v225 #5 (all four old anchors count 0 on the candidate).

## (a) G5: exempt the R3 token by index, count the literal once
Window shapes are brittle: R3 is 74 chars away, S9 needs 57, S5 needs 35; a reflow of one line flips either arm. Rule instead:
```
const R3 = "if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true";
const r3N = CS.split(R3).length - 1;
const r3Tok = r3N === 1 ? CS.indexOf(R3) + R3.indexOf(TOK) : -1;
// hits: every TOK index i with an ANCH within 120 chars AND i !== r3Tok
ok("G5 R3 literal (E6) occurs exactly " + (D188 ? 1 : 0) + " times", D188 ? r3N === 1 : r3N === 0, r3N);
ok("G5 'beginner' within 120 chars of mileBest / arguments[12] / mileBestSecs), R3 token exempted by index: " + want, cmp(hits.length), ...);
```
The four token regex rows stay. S1 to S5 and S9 restore tokens at other indexes (hits > 0); S6 deletes the clause (r3N 0). Candidate: r3N 1, hits 0.

## (b) S8 replacement: hide the pencil on `exp`
E7 exports `exp`, so this is live. Anchor (count 1, the same 252-char `BTN` measure used): `Run paces<button onclick="event.stopPropagation();openMileSheet('${p.id}')" aria-label="Change mile time" … ${asyIcon('pencil',14)}</button>`. Replacement: `` Run paces${s.runAnchor.exp!=='beginner'?`<BTN>`:''} ``. Must trip G4 "beginner program card carries aria-label exactly 1" (both beginner cells go to 0). Expected also: G7c (run_base beginner, one pencil), g203_mile_pencil "D188 era: beginner experience → 1 pencil(s)".

## (c) The S4 cell: G1f, a typed literal, direct call
E1 is a D188 read, so the row lives in the D188 file. Set `WD.experience='beginner'`, `WD.ageBracket='18-35'`, `WD.cardioGoals.run = {id:'run_pace_goal', targetDist:'1.5', paceUnit:'mi', targetMins:'10', targetSecs:'30', mileBestMins:'9', mileBestSecs:'0', mileBestSrc:{kind:'entered'}}`. Hand L: gap 540−420 = 120 s ÷ `PACE_IMPROVE.beginner` 3 = 40 → ×1.25 + 4 = 54 → +1 = 55 → 1.5-mile cap 11. Assert `build(cfgOf('run_pace_goal','beginner',1000,540,['10','30'])).totalWeeks === 11`, then `paceCeilingSentence(assessRunPaceCeiling(11))` equals:
`Your mile is 9:00. In 11 weeks that reaches about 1.5 mi in 13:08. Your goal is 10:30. Keep it or change it above.`
(improvingWeeks ((11−1)/1.0 − 4)/1.25 = 4.8; 540 − 4.8×3 = 525.6; ×1.5 = 788.4 → `_clkMS` 13:08.) Printed by the function and by the wizard `#paceFeasLine`. Under S4 it reads `You have not entered a mile time. The beginner default is 11:30 per mile. …`. V225 arm: that V225 string. S4 → G1f.

## (d) G7e gains two beginner rows (goal run_5k, G7e's own)
```
['entered 9:00 beginner', 'beginner', 540, { kind: 'entered' },
  'Anchored on a 9:00 mile, the time you entered.' + TAIL_CHART, clipOf('9:00', 'entered', chartKeys('9:00'))],
['seeded 9:00 beginner', 'beginner', 540, { kind: 'seeded', prog: 'PRIOR', n: 6 },
  'Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR.' + TAIL_CHART, clipOf('9:00', 'seeded from PRIOR, 6 logged recovery runs', chartKeys('9:00'))],
```
V225 arm for both: `CARD_DEF_V225('beginner')` and `clipOf('11:30', 'beginner default', chartKeys('11:30'))`. Under S9 `kind` is `'beginner'` and both fall to the default sentence. S9 → G6b and G7e.

## (e) G1 SI pair: reinstated, hand oracle
Reinstate as G1g: beginner run_pace_goal, mile 13:00, 20 seeds, both rest patterns: every W1 card with `4x400m at` prints `4x400m at 11:58/mi` and `goal pace is 12:14/mi`, at least one per seed (printed 80/80 at goals 12:00 and 13:30). Derivation typed in the row: doctrine `nikerunclub5k.txt:160` row 12:00 (mile 720, 5K 760); `ROW_PACE_COLS` 5K distance 3.107; 720 + 40·ln1.5/ln3.107 = 734.31 (12:14); Guide A :251 4 s per 400 m = 16 → 718.31 (11:58). V225 arm: 11:30 / 11:46 (the 11:30 row, 5K 735, same arithmetic). Ruling on independence: D100 is a ruled formula, not doctrine, but typing it with doctrine numbers is the same oracle class as the length cell's ×1.25 + 4 and age pipeline the ruling already accepts. "Never ask the engine" forbids calling `rowPaceAt` or reading `paceProgression`; the row does neither. If D100 is ever re-ruled this row goes red and the change is classified, which is the pin's job.

## (f) Six old mutations
- v202 #2: RETIRE under D188 E4. Its replacement is the shipped after-state; S1 is its inverse.
- v202 #8: RE-KEY. Anchor = the full four-line `const tail = (a.goalId === 'run_pace_goal') … comes from this row.';` ternary (count 1). Replacement unchanged. Must trip g202_pace_copy C8; expected also G7a (pace-goal beginner and run_base ×3).
- v202 #9: RE-KEY. Anchor `  const scope = (a.goalId === 'run_pace_goal') ? ' | Week 1 runs off this row. Every week after it moves toward your goal.' : '';` → `  const scope = '';`. Must trip g202_pace_copy C9; expected also C8, G7b beginner run_pace_goal.
- v202 #11: RETIRE under D189 F10 (a beginner now takes the scope on card and clipboard alike). Successor S20 below.
- v203 #3: RETIRE under D188 E10. Successor S8 (b).
- v225 #5: RE-KEY. Anchor the full R3 line `if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};` → `if(exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};`. Keeps D188's exemption so the fault stays "goal scoping dropped". Must trip g225 "MILE-REQUIRED non-beginner NON-pace run goal, blank mile: unaffected"; G3 beginner-blank stays green by design.

## (g) Final table (`v226.json`; anchors S1 to S18 as measure typed them, all count 1)
| S | anchor (site) | must trip |
|---|---|---|
| S1 | E4 `arguments[12]` guard | G1g SI, G1c, G1d |
| S2 | E5 `anchorSec` guard | G1a/b 13:00, G1d |
| S3 | E3 `_mileBestSecs` guard | G1e length (9 → 11) |
| S4 | E1 `mileBest` guard | G1f |
| S5 | E6 early return | G3 2:30/30:00/13:00/4:30/sheet |
| S6 | E6 drop `&& exp!=='beginner'` | G3 beginner blank, G5 R3 count, G8f |
| S7 | E9 wizard guard | G4 field count |
| S8 | (b) pencil on `exp` | G4 pencil |
| S9 | E7 `kind` branch | G6b, G7e beginner rows |
| S10 | remove `d189DefaultAnchorNote(` call | G6b |
| S11 | delete `return;` after append | G6b (many) |
| S12 | `weeks['1']` → `weeks['2']` | G6b |
| S13 | `'run_base'` out of `_CHART_RUN_GOALS` | G7a/b/c |
| S14 | chips branch | G7c |
| S15 | D9 old string | G3, G8b |
| S16 | header branch | G8c |
| S17 | helper V225 label | G8a |
| S18 | `.blank ? null :` removed | G8d |
| S19 | `LIC5L_ERAS` without 226 (gate file) | g222 5L |
| S20 | `const scope = (a.goalId === 'run_pace_goal') ?` → `… && a.exp !== 'beginner') ?` | G7b beginner run_pace_goal |

G5 is a backstop; S1 to S6 and S9 each trip it too. Gatekeeper reports 0 NOT-APPLIED across every spec, old ones included.

## After (expected, candidate)
G1 to G10 all green including G1f, G1g, G5 (r3N 1, hits 0), G7e 6 forms. V225 arm: G1f/G1g/G5/G7e red exactly where keyed. S1 to S20 each trip its named row.

Recommendation: ship G5 as the by-index exemption with the literal counted exactly once, S8 and S20 keyed on `exp`, G1f and G1g as typed hand literals, retire v202 #2, #11 and v203 #3, re-key v202 #8, #9 and v225 #5.
Counter: a 60-char G5 window is one number and catches S1 to S5 and S9 while excluding R3, but it rests on a one-character margin at :7491 and a three-character margin at S9.

Files: `tests/gates/g226_d188_beginnermile.js`, `tests/gates/g226_d189_pacedisclose.js`, `tests/sabotage/{v202,v203,v225}.json`, print script `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/coach2/cells.js`.

## SESSION DECISION (2026-09-30)
Adopted as ruled (gate scope and tooling shape are the session's; no doctrine call for Mario). The S19 mutation targets the gate file `g222_d181_chain.js`, not index.html.

## BUILD NOTE (slice 7b2, 2026-09-30)
(c)'s V225 arm was mis-quoted: V225 prints `Your paces start from the beginner default of 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 10:30. Keep it or change it above.` (the D183 beginner line D188 E2 deleted; hand check 675.6 × 1.5 = 1013.4 → 16:53). The "You have not entered a mile time…" string coach quoted is what S4 prints on the candidate. G1f's V225 arm types the true V225 string; the 226 arm and S4 → G1f stand as ruled. Session decision: a mis-quoted era-truth literal, not a design premise; no re-ruling.
Slice 7d3 found `tests/sabotage.py` runs g225_d187_pacerate with no baseline, so CONFINEMENT failed closed on the control and every v225 mutation on that gate tripped vacuously; slice 7e owns the fix.
Slice 7d1: `tests/sabotage.py` only mutates the candidate html; no spec has ever targeted a gate file. S19 (drop 226 from `g222_d181_chain.js` `LIC5L_ERAS`) is therefore NOT in `v226.json`. Session decision: gatekeeper performs S19 as a manual scratch mutation of the gate file (copy g222 to scratch with 226 removed, run on the candidate, require row 5L REFUSED and every other row unchanged). Measure B item 6 already printed the equivalent (226-stamped V225: PASS 7 FAIL 1, the only FAIL row 5L). `g226_d189_pacedisclose.js` summary line moved NA to its own line so the runner's `^PASS n FAIL n$` matches (slice 7d1b).
