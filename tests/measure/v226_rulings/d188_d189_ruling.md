# D188 P-BEGINNERMILE and D189 P-PACEDISCLOSE — re-ruled on V225 for build 5 (target V226)

Persisted verbatim by the orchestrator from coach's return, 2026-09-30 (coach is read-only).
At the V226 commit the held V209 ruling this re-rules moved from `tests/measure/v212_rulings/p_pacedisclose_ruling.md` to `tests/measure/v226_rulings/p_pacedisclose_ruling.md`, and its measure script from `v212_default_pace_disclosure.js` to `v226_default_pace_disclosure.js`.

Coach, 2026-09-30. Re-rules `tests/measure/v212_rulings/p_pacedisclose_ruling.md` (Mario's 2026-09-23 decisions) against Measure A (`v226_rulings/measure_beginnermile_v225.md`) and Measure B (`v226_rulings/measure_pacedisclose_v225.md`). Every string below was printed this session from a source-surgery copy of V225 carrying exactly the edits ruled here: script `/private/tmp/claude-501/-Users-CanasBangin-Desktop-TheBig6V2/f12a37a6-7352-4251-8d99-97802f07477d/scratchpad/coach/after.js` (28 anchors, all count 1), outputs `after2.out.txt`, `lattice.js`, `tier.js` in the same folder. Read: index.html :1994-1998, :2270-2282, :2425-2470, :2614-2630, :2848-2900, :3175-3200, :3810-3822, :4372-4380, :7479-7510, :7540-7546, :10940-10975, :14699-14770, :14823, :14991-15020, :15025-15050, :16671, :17390-17400; handoff §11f D7a-e, D9, D116, D183, §12 build 5 line; `v225_rulings/d186_d187_pacerate_clockend_v225.md` R3 lines (:54, :239-242); doctrine `physicaltrainingguide2020.txt:250-256`.

Line numbers are V225's. Every anchor is a literal; builder asserts `count==1` before writing.

---

## Where measure moved the premises, and what survives

1. **Item 1 (R3 exposed by lifting :7484): the held ruling's edit shape was wrong, its outcome stands.** "The validator applies" was written as "delete the beginner early return". Deleting it wholesale hands beginners to D187 R3 (:7488) and a blank beginner pace goal is refused. Measure's SV arm (keep :7484) is not the answer either: it leaves a beginner's typed 2:30 or 30:00 unvalidated and a typed 13:00 without the D9 advisory, and the held ruling's own answer to the counter was "D9 rejects nonsense". The correct shape is two clauses: the early return loses its beginner test (`if(!g) return {ok:true};`) and R3's refusal gains one (`g.id==='run_pace_goal' && exp!=='beginner'`). R3 ruled itself non-beginner in its own text (":7476 stays byte-identical; the nine beginner-gate sites belong to P-BEGINNERMILE, build 5"), so this is R3's deferred half, not a change to R3. Printed: beginner blank pace goal `{"ok":true}` builds L11; beginner 13:00 → the D9 slowest-row advisory; 2:30 and 30:00 refused with the D9 strings; intermediate blank pace goal still refused.
2. **Item 2 (9 sites, 11 clauses; :6193 not one; Progress :17396 ungated).** Accepted. :6193 passes the mile to `buildRunSession`, which gates at :3815; that site is in. Progress: ruled below (no edit).
3. **Item 3 (card reads "estimated from experience" with :14717 lifted).** Moot: D189 rewrites that sentence; the `kind` value `'beginner'` is retired outright and the level word comes from `exp`, which `runAnchorInfo` now returns.
4. **Item 4 (beginner length 12/13 vs intermediate 11 at 36-54/55+).** Out of scope, not a defect. :3193 is the beginner base-build floor (2 mi → 5 mi), a property of experience, not of the anchor. A beginner with a 9:00 mile is still a beginner in volume. M4(c) is amended: "paces as an intermediate's" holds (printed: beginner 9:00 W1 tokens 8:58/9:14/9:59/11:52 == intermediate 9:00 at 18-35 and at 36-54); "length as an intermediate's" was never the claim.
5. **Item 5 (§12 "only beginners on pace goals" REFUTED).** The §12 line was wrong; Call 1 and Call 3 as Mario accepted them stand: 16 of 18 goal×level cells build with no mile and every one of them is disclosed the same way.
6. **Item 6 ("D183 changed the card sentence" REFUTED).** The card still prints the V209 string; D189 rewrites it as ruled.
7. **Item 7 (S1 lands on the V171 Intervals note).** Ruled below: append, never replace; the V171 text is byte-identical as a prefix (640/640).
8. **Item 8 (V225 contradiction on non-beginner pace goals).** This build's. Ruled below with copy, plus a fourth member of the same family I found: the D183 feasibility line quoting a reach from the 9:30 default on a cell that will be refused.
9. **Item 9 (run_base has no Run paces block).** Call 3 stands; run_base joins `_CHART_RUN_GOALS`, chips are Mile and Recovery only (printed).
10. **Item 10 (g222 5L).** Extend to 226, no new D-code (below).

---

## D188 — P-BEGINNERMILE: a beginner may enter a mile, optionally, and add one later

**Finding.** Every beginner trains off 11:30 no matter what he can run, and he cannot tell the app otherwise: the field is hidden (:2855, :2876), five engine reads discard the number (:2433, :3179, :3815, :4376, :14709), the card says so (:14758), the pencil is hidden (:14823), and the validator waves the beginner through without looking (:7484). The gate is a V50 literal that no D-code ruled. Printed on V225, seed 1000, beginner: a 13:00 miler gets `4x400m at 11:30/mi` (Short Interval, W1 Mon); a 9:00 miler gets `Recovery Run [14:05/mi]` on run_5k. Neither is "gentle either way". Doctrine anchors on the athlete's own recent run at every level (Guide A p.12, doctrine:250-256: "your intensity or pace should be slightly faster than the pace of your most recent 1.5-mile run"). The seed banner already writes a beginner's mile from his logged runs (`applySeedData` :2638, any experience) and the engine then ignores it while the banner says "Estimated from PRIOR. Edit if you know better."

**Coaching argument.** The run is the day and the prescription owns the fixed dimension: a pace is a prescription, and a prescription off a stranger's fitness is a guess on the one dimension the athlete cannot log his way out of. A beginner's mile is the least reliable number in the wizard, so it stays optional, the copy asks for a timed mile only, and D9 now judges it (before, D9 never saw a beginner). The chart clamps at 12:00, so an honest slow beginner lands on the slowest row with the advisory "Consider a base block first", which is the right coaching for him.

**What changes (10 edits, by site and clause).**

- E1 :2433 `assessRunPaceCeiling`: `const mileBest = (exp !== 'beginner' && g.mileBestMins` → `const mileBest = (g.mileBestMins`.
- E2 :2459 `paceCeilingSentence`: delete the line `if(f.exp === 'beginner') return 'Your paces start from the beginner default of '+_clkMS(f.cur)+' per mile.'+reach+' Keep it or change it above.';`. The generic third form takes the beginner (it names the level from `f.exp` and says "Enter your mile above and this updates", which is now true for him). D183 amendment, see Mario flag (b).
- E3 :3179 `calcProgramLength`: `var _mileBestSecs = (experience !== 'beginner' && goal.mileBestMins` → `var _mileBestSecs = (goal.mileBestMins`.
- E4 :3815 `buildRunSession`: `(experience !== 'beginner' && arguments[12]) ? arguments[12] : null` → `arguments[12] ? arguments[12] : null`; comment :3812 "Beginner always uses default (11:30/mi)." → "A beginner's entry is read like anyone's (D188)."
- E5 :4376 `buildNRCSession`: `(experience !== 'beginner' && mileBestSecs) ? mileBestSecs : expCurrentPace` → `mileBestSecs ? mileBestSecs : expCurrentPace`.
- E6 :7484 + :7488 `_mileEntryState`, one block: `if(!g||exp==='beginner') return {ok:true};` → `if(!g) return {ok:true};` and `if(g.id==='run_pace_goal') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};` → `if(g.id==='run_pace_goal' && exp!=='beginner') return {ok:false, blank:true, msg:'Required. Enter your most recent timed mile.'};`. Comment on the R3 line gains: "D188: beginners stay optional on every goal."
- E7 :14708-:14723 `runAnchorInfo`, one block: `const rawSec = (exp !== 'beginner' && entered) ? entered : expDef;` → `const rawSec = entered ? entered : expDef;`; `(exp !== 'beginner' && !!entered && Math.round(row.mile) !== Math.round(rawSec))` → `(!!entered && Math.round(row.mile) !== Math.round(rawSec))`; `const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default'` → `const kind = !entered ? 'default'`; return object `{anchorSec, rawSec, clamped, row, kind,` → `{anchorSec, rawSec, clamped, row, kind, exp,`; comment :14708 → "Same rule as both engines: a falsy entry falls to the default (D188: every level)."
- E8 :2855 wizard, pace-goal branch: remove the ternary `${WD.experience !== 'beginner' ? ` … `` : ''}` around the mile block, keeping the block. Closing anchor for site 1 is `</div>\` : ''}\` : \`` (count 1); site 2's closing `</div>\` : ''}\`}` is different and untouched. Do NOT ship `${true ? …}`: a dead ternary looks maintained.
- E9 :2876 wizard, other run goals: `(t==='run' && WD.experience !== 'beginner')` → `(t==='run')`.
- E10 :14823 pencil: `${s.runAnchor.kind!=='beginner'?`<button …>`:''}` → the button unconditionally.

**What deliberately does not change.** 690/570/450 and the chart clamp; R3's refusal on intermediate/advanced pace goals (the g223_d184 416+64 population is byte-identical: beginners still build); the beginner base-build length floor :3193; the D116 sheet (`commitMileChange` passes no `id`, so it is never "required"; it now applies D9 to a beginner too, printed); the seed path (`applySeedData` already wrote the mile; it is now read); NRC session names and structures; the Progress reader :17396 (below); D9's two rejection strings and two advisories.

**Progress reader :17396 — ruled out of edits, in scope as a reader that becomes truthful.** `renderProgressScreen` already reads `mileBestMins/Secs` with no beginner clause and plots "your m:ss mile" as a dashed claim line on the projection card. On V225 a seeded beginner sees a claim line for a number the program never used; after D188 the engine uses that number. No edit; the token-gone gate row (G5) counts it as a reader with no clause, which it already is.

**Length difference — ruled out.** See premise 4.

**Blast radius, coaching terms.**
- Class A1, beginner with a mile (typed or seeded), every run goal: every pace moves to the athlete's row (480/480 digests in the lattice beginner × 6 goals × {9:00, 13:00} × 20 seeds × 2 rest patterns); length 0/480 moved; card and clipboard print the entered/seeded/clamped forms. Population on any phone today: none (no beginner fixture; HALF_MANNY is intermediate).
- **Class A2, the long-run tier reacting to the truer anchor: 160/480 grids moved, 280 grid lines, all on long-run days, all at the 9:00 mile, 0 at 13:00.** Direction is the reverse of D187's Class E: a faster anchor shortens time on feet, so tier A → B (run_10k 80, run_half 80, run_marathon 80) and B → C (run_pace_goal 40): more lifting, less rest. Example seed 1000 pace goal 9:00, W5 SAT: `Full Body {LSD} :: Strength[Pushups (slow tempo), Inverted rows (rings)]` → `Full Body {LSD} :: Power — explosive first[Pogo hops, Dumbbell snatch] | Strength[…]`. This is `_longRunTier`/D18/D140 reading a 59-minute LSD instead of a 72-minute one; no engine change. Licensed, bounded to beginner programs carrying a mile; Mario flag (a2).
- Class A3, beginner no-mile: byte-identical everywhere except D189's one note (640/640 in the lattice, `otherCardMoved 0`, weekGrid identical 640/640).
- Non-beginner with a mile: 80/80 digests unmoved. HALF_MANNY unmoved (below).
- Wizard: beginners gain the field, the advisory and the pencil on every run goal.
- Tests: g203_mile_pencil.js:16/:215 ("beginner pencils: 0" → 1 from 226), g202_pace_copy.js:195 and g223_d183_safepace.js:220/:227 (hand oracles `exp !== 'beginner' && mileSecs` → `mileSecs` from 226), any gate pinning "Your paces start from the beginner default of" (era row from 226: the generic form), sabotage v203.json M3 (its anchor `Run paces${s.runAnchor.kind!=='beginner'?` no longer exists: retire the row under D188 and replace with S8 below). Builder greps every before-literal in this ruling across `tests/gates` and `tests/sabotage` and era-rows each hit, keyed to D188/D189 from 226 (standing rule 4).

---

## D189 — P-PACEDISCLOSE: a guessed pace says it is a guess, once at each place the athlete meets it

**Finding.** On V225, 0 of 27,720 run cards say where their pace came from; the wizard field says "Optional. It sets your training paces." and never what blank resolves to; the card says "estimated from experience"; run_base prints "Around 12:10/mi is right for you" on every easy run and has no Run paces block at all. On non-beginner pace goals the field says "Optional", D9's ">25:00" line says "Leave it blank", the length header prints "Program length: 11 weeks" from the 9:30 default and the D183 line says "In 11 weeks that reaches about 1.5 mi in 13:53", and then `doGenerate` refuses the blank they all recommended (48/48 cells).

**Coaching argument.** D21: the line states what the entry resolves to. A default is a prescription the athlete did not give; it must be named as one at the decision (wizard), on the record (card, clipboard) and once where he first runs off it (W1). Never per card, never a banner (P-RECOVBANNER). The number is derived through `runAnchorInfo`, the same lens the card uses, so the wizard, the card, the clipboard and the W1 note cannot disagree; no new copy of the 690/570/450 table.

**What changes (11 edits).**

- F1 new helper, inserted before `function _mileAdvisoryHTML(){` (:7501):
  ```
  function _mileFieldHelp(){
    const g=(WD.cardioGoals&&WD.cardioGoals.run)||{}; const exp=WD.experience||'intermediate';
    if(g.id==='run_pace_goal' && exp!=='beginner') return 'Required. Your paces and your program length start from it.';
    const a=runAnchorInfo({cardioTypes:['run'],cardioGoals:{run:{id:g.id||'run_base'}},experience:exp}); if(!a) return 'Optional.';
    const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';
    return 'Optional. Leave it blank and your paces come from '+art+' '+m+' mile, the '+exp+' default. Enter a mile only if you have timed one.';
  }
  ```
- F2, F3 :2856 and :2877: the span text `Optional. It sets your training paces.` → `${_mileFieldHelp()}` (two sites, one literal each).
- F4 :7496 D9: `Over 25:00 reads as a walk, not a run. Leave it blank and the program anchors on your experience level instead.` → `Over 25:00 reads as a walk, not a run. Check the entry.` (the helper one line above now says what blank does where blank is allowed; the D116 sheet, which refuses blank, stops recommending it).
- F5 :1997 `progLenLineHTML`, before `const n = (p && p.tw) || len;`: `const _ms=(typeof _mileEntryState==='function')?_mileEntryState():{ok:true}; if(!(p && p.tw) && _ms.blank) return '<b style="color:var(--accent)">Program length: your mile time sets it.</b> Enter your current mile time and the length appears.';` (a dated test pin still prints its test week: that length is true without a mile).
- F6 :2280 `updateRaceDateFeedback`: `const _f = assessRunPaceCeiling((p && p.tw) || len);` → `const _f = _mileEntryState().blank ? null : assessRunPaceCeiling((p && p.tw) || len);` (the feasibility line and the dated card's tw row stop quoting a reach from a default the refusal will not let him train on).
- F7 :14699 `_CHART_RUN_GOALS`: add `'run_base'`; comment :14704 "run_base prints no pace (V157)" → "run_base easy runs pace off this row since V206 (D189)".
- F8 :14728 `runAnchorChips`: `const list = [['Mile',r.mile],['5K',r.fiveK],['10K',r.tenK],['Tempo',r.tempo]];` → `const list = a.goalId==='run_base' ? [['Mile',r.mile]] : [['Mile',r.mile],['5K',r.fiveK],['10K',r.tenK],['Tempo',r.tempo]];` (Recovery is pushed after, as today).
- F9 :14740-:14760 `runAnchorSentence`, one block: tail gains `: (a.goalId === 'run_base') ? ' Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.'` before the generic tail; delete the `a.kind === 'beginner'` line (:14758); :14759 → `` return `Anchored on ${art} <b>${m} mile</b>, the ${a.exp} default. No mile time was entered. Tap the pencil to enter one.` + tail; ``; :14753 `'estimated from experience'` → `'the '+a.exp+' default'`.
- F10 :14766/:14768 `runAnchorLine`: `: a.kind==='entered' ? 'entered' : a.kind==='beginner' ? 'beginner default' : 'est. from experience';` → `: a.kind==='entered' ? 'entered' : a.exp+' default, no mile time entered';`; scope `(a.goalId === 'run_pace_goal' && a.kind !== 'beginner')` → `(a.goalId === 'run_pace_goal')`.
- F11 S1 pass: call `d189DefaultAnchorNote(weeks, {...cfg, cardioTypes, cardioGoals});` inserted directly after `raceEveLiftPass(weeks, totalWeeks);` (:10961, `engineD_synthesis`, after every note writer), and the function inserted before `function d18LongRunDayPass(weeks){` (:11029):
  ```
  function d189DefaultAnchorNote(weeks, cfg){
    const a = runAnchorInfo(cfg); if(!a || a.kind !== 'default') return;
    const w1 = weeks['1'] || weeks[1]; if(!w1) return;
    for(const d of _ISO_ORDER){ const day = w1[d]; if(!day || day.rest) continue;
      for(const c of [].concat(day.cardio||[])){ if(!c || c.type!=='run') continue;
        if(/RACE DAY|TIME TRIAL|^Benchmark Run/i.test(c.subtype||'') || (c.dose && c.dose.key==='bench')) continue;
        if(!/\d:\d\d\/mi/.test(c.detail||'')) continue;
        const m=_fmtMileAnchor(a.anchorSec), art=/^(8|11|18):/.test(m)?'an':'a';
        c.note = (c.note ? c.note+' ' : '') + 'Paces here start from '+art+' '+m+' mile, the '+a.exp+' default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.';
        return; } }
  }
  ```
  Self-expiring: `kind==='default'` only; a pencil edit rebuilds the future weeks and the sentence is gone.

**Item 7, S1's target field — re-ruled, not re-sited.** The first paced run of every NRC week is Mon "Speed Run — Intervals", whose `note` is the V171 D1b sentence (app-owned; Nike owns `detail`, never touched). S1 APPENDS after one space; the V171 text stays byte-identical as a prefix (lattice: `prefixMoved 0/640`). "Unchanged" in the held §4 means the V171 text is not rewritten, and it is not. Re-siting onto the recovery run would put the disclosure on the second paced card the athlete meets, and a new field would need a renderer edit for one sentence.

**Item 8 — this build's to fix.** All four members: the label (F1-F3, "Required. Your paces and your program length start from it."), D9's ">25:00" (F4), the header (F5), the feasibility line (F6). On a non-beginner pace goal with no mile the step now reads, printed: label `Required. Your paces and your program length start from it.`; header `Program length: your mile time sets it. Enter your current mile time and the length appears.`; advisory `Required. Enter your most recent timed mile.` (muted, R3's colour rule); feasibility line empty; `doGenerate` refuses as today. Once he types 9:00: `Your mile is 9:00. In 11 weeks that reaches about 1.5 mi in 13:08. Your goal is 12:00. Keep it or change it above.` and `Program length: 11 weeks. Set by your longest cardio goal and your experience.` Not this build (§12): `wizardNext` does not validate on leaving the cardio step, so the refusal lands after the name step and re-renders the name step (R3's and D110a's shape); recommend a one-edit follow-up that validates at `wizardNext` on `cardio_goal`.

**Item 10.** `g222_d181_chain.js:86` `LIC5L_ERAS = [222, 223, 224, 225]` → `[222, 223, 224, 225, 226]`. Measure printed the same 68 rows (2 unique pairs, all mario|W5, 68/68 boot == MAP). No new D-code. The §12 (C) fix (filter the swapped detail through `applyInjuryFilter` in `applySwapChoice`) still wants its own small build right after this one.

**What deliberately does not change.** NRC `detail` and session names; the V171/NSW note text (prefix); W2 onward (0/640 S1 outside W1); mile-entered programs at every level (0/720 S1; non-beginner digests 80/80 unmoved); D116's sheet and lock; the wizard `Current mile time` label word; the 690/570/450 table (no new copy: the helper and the pass read `runAnchorInfo`); D9's other three strings; Progress, swap and history surfaces; no week-view banner, no per-card caption.

**Blast radius, coaching terms.**
- Class B, every no-mile program (NRC ×3 levels, run_base ×3, beginner pace goal): one W1 run card's `note` gains the S1 suffix; nothing else on the grid moves; digests move on exactly these (640/640 one, 0 zero, 0 many, weekGrid identical 640/640).
- Class C, card and clipboard on no-mile programs: default form with the level word; run_base gains the Run paces group (Mile, Recovery), the sentence, the clipboard line and a pencil (the D116 lock's "too close to the race" copy now also reaches run_base's last two weeks; it already reaches pace goals, which have a test, not a race: §12 debt, recommend the lock names the test, the race or the retest by goal).
- Class D, wizard copy on every run goal and level: helper, D9, header and feasibility on required-blank.
- Class F, comments and retired branches (`kind==='beginner'` writer :14717 and readers :14758, :14766, :14768, :14823; the :2459 branch).
- Tests as under D188, plus any gate pinning `estimated from experience`, `est. from experience`, `Leave it blank and the program anchors`, `Optional. It sets your training paces.` (era rows from 226) and sabotage rows anchored on them (re-key).

---

## HALF_MANNY

Stays `0ac7da6b1691a8e1`. Printed on the surgery copy carrying every edit above: B `0ac7da6b1691a8e1` self-equal, A `0ac7da6b1691a8e1` self-equal; card `Anchored on a 10:30 mile, the time you entered. Every pace in this program comes from this row.` both arms; W1 Mon note tail identical. Kind is `entered`, so the S1 pass returns before touching a card. Era row 226 = reference to 225 (standing ruling 5, no digest printed because none moved).

---

## Before / After (printed, seed 1000, rest sun/wed)

**Before (V225):**
```
wizard  run_5k|intermediate   label: Optional. It sets your training paces.   header: Program length: 8 weeks. Set by your longest cardio goal and your experience.
wizard  run_pace_goal|intermediate  label: Optional. It sets your training paces.  header: Program length: 11 weeks. …  advisory: Required. Enter your most recent timed mile.  feas: You have not entered a mile time. The intermediate default is 9:30 per mile. In 11 weeks that reaches about 1.5 mi in 13:53. …  → REFUSED
wizard  run_5k|beginner       NO FIELD
card    run_5k|intermediate   Anchored on a 9:30 mile, estimated from experience; no mile time was entered. Every pace in this program comes from this row.
card    run_5k|beginner       Anchored on an 11:30 mile, the beginner default. A mile time starts being used at intermediate.   pencil: none
card    run_base|any          (no Run paces block)
clip    run_5k|intermediate   Run anchor: 9:30 mile (est. from experience) → 5k 10:15 / 10k 10:35 / tempo 11:00 / recovery 12:10
W1 MON  run_5k|intermediate {Speed Run — Intervals}  note: INTERVALS: Hard efforts, easy running between. … Mile Pace is what you could race for one mile (9/10 effort).
W1 MON  run_pace_goal|beginner mile 13:00 {Short Interval (SI)}  4x400m at 11:30/mi … (mile ignored)
HALF_MANNY 0ac7da6b1691a8e1
```
**After (surgery copy):**
```
wizard  run_5k|intermediate   label: Optional. Leave it blank and your paces come from a 9:30 mile, the intermediate default. Enter a mile only if you have timed one.
wizard  run_5k|beginner       label: Optional. Leave it blank and your paces come from an 11:30 mile, the beginner default. Enter a mile only if you have timed one.   (advanced: "a 7:30 mile, the advanced default")
wizard  run_pace_goal|intermediate  label: Required. Your paces and your program length start from it.  header: Program length: your mile time sets it. Enter your current mile time and the length appears.  advisory: Required. Enter your most recent timed mile.  feas: (empty)  → REFUSED (unchanged)
wizard  run_pace_goal|beginner  feas: You have not entered a mile time. The beginner default is 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Enter your mile above and this updates.  → builds L11
D9      >25:00 any level: Over 25:00 reads as a walk, not a run. Check the entry.
card    run_5k|intermediate   Anchored on a 9:30 mile, the intermediate default. No mile time was entered. Tap the pencil to enter one. Every pace in this program comes from this row.
card    run_5k|beginner       Anchored on an 11:30 mile, the beginner default. No mile time was entered. Tap the pencil to enter one. Every pace in this program comes from this row.   pencil: yes
card    run_pace_goal|beginner  … Tap the pencil to enter one. Week 1 runs off this row. Every week after it moves toward your goal.
card    run_base|intermediate  chips [Mile 9:30/mi] [Recovery 12:10/mi]  Anchored on a 9:30 mile, the intermediate default. No mile time was entered. Tap the pencil to enter one. Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.
card    edited from default   Anchored on a 9:00 mile, the time you entered in week 3. Before that it was the intermediate default. …
card    beginner 13:00        Anchored on a 12:00 mile, the 13:00 you entered is slower than the chart goes, so its slowest row is used. …
card    beginner seeded 9:00  Anchored on a 9:00 mile, worked back from 6 recovery runs you logged in PRIOR. …   (no S1)
clip    run_5k|intermediate   Run anchor: 9:30 mile (intermediate default, no mile time entered) → 5k 10:15 / 10k 10:35 / tempo 11:00 / recovery 12:10
clip    run_base|beginner     Run anchor: 11:30 mile (beginner default, no mile time entered) → recovery 14:05
W1 MON  run_5k|intermediate {Speed Run — Intervals}  note: INTERVALS: … (9/10 effort). Paces here start from a 9:30 mile, the intermediate default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.
W1 MON  run_pace_goal|beginner {Short Interval (SI)}  note: SI: … Hit the prescribed pace precisely. Paces here start from an 11:30 mile, the beginner default. Tap the pencil …
W1 SAT  run_base|any {Easy Run}  note: EASY RUN: … it is working. Paces here start from … (Mon Benchmark carries no pace, skipped)
W1 MON  run_pace_goal|beginner mile 13:00 {Short Interval (SI)}  [11:58/mi 12:14/mi]  LSD [14:30/mi]
W1 MON  run_pace_goal|beginner mile 9:00  {Short Interval (SI)}  [8:58/mi 9:14/mi]  LI [9:59/mi]  LSD [11:52/mi]  (== intermediate 9:00)
HALF_MANNY 0ac7da6b1691a8e1
```
weekGrid (titles and sections) is byte-identical on every no-mile program; the only grid moves in the build are Class A2 (beginner with a mile, long-run days). Dash/hyphen/"Nike" sweep on every new string: 73 strings, 0 hits.

---

## Gate rows (new files `g226_d188_beginnermile.js`, `g226_d189_pacedisclose.js`; each prints `PASS n FAIL n`; every predicate keyed `VER >= 226`; run against V225 first and expect red exactly here)

- G1 (D188 reads): beginner × {pace, 5k, half, base} × mile {9:00, 13:00} × 20 seeds. Oracle: for 13:00, W1 tokens equal the Nike chart's 12:00 row typed from `doctrine/nikerunclub5k.txt` (5K 12:40, Recovery 14:30) and NSW SI = row.mile − 2 s per 400 m rule as the file's SI builder derives it; for 9:00 at 18-35, W1 detail tokens equal the intermediate cell with the same mile and seed (the ruling's "as an intermediate would"; differential, stated as such). Length cell: beginner, goal 1.5 mi in 13:30 (9:00/mi), mile 9:00 → gap 0 by hand, so length = the beginner base floor (printed 9), and with no mile the hand gap (690−540)/3 = 50 weeks hits the 1.5-mile cap 11 (:3190); assert 9 and 11.
- G2 (D188 no-mile identity): beginner no-mile × 6 goals × 20 seeds: strip the S1 suffix from every note and the program equals the V225 baseline artifact's build (`git show HEAD:index.html`), digest for digest.
- G3 (D188 validator): typed literals: beginner blank on all 5 goals `{ok:true}`; beginner 2:30 and 30:00 refused with the D9 strings; 13:00 and 4:30 the two advisories; intermediate blank pace goal refused with R3's string; sheet call `_mileEntryState({mileBestMins:'30',mileBestSecs:'0'},'beginner')` refused.
- G4 (D188 surfaces): wizard render for a beginner on all 5 run goals contains `Current mile time` exactly once and `id="mileAdvisory"` once; a beginner program card contains `aria-label="Change mile time"` exactly once; an intermediate card still exactly once.
- G5 (D188 token-gone): comment-stripped source has 0 occurrences of `'beginner'` within 120 characters of `mileBest`, `arguments[12]` or `mileBestSecs)`, and 0 of `kind === 'beginner'`, `kind!=='beginner'`, `'beginner default'`, `beginner default of`.
- G6 (D189 S1): lattice 6 goals × 3 levels × 20 seeds × rest {sun/wed, sat/sun} × mile {none, 8:00}, excluding the R3-refused cells: no-mile → exactly one run card whose note ends with the typed S1 literal (number from the hand table 690/570/450 via `_clkMS`, article `an` for 11:30, `a` for 9:30/7:30), it is in W1, it is the first card in `mon..sun` order with a `\d:\d\d/mi` in `detail` and a subtype not matching `RACE DAY|TIME TRIAL|^Benchmark Run`, and `note.startsWith(baselineNote)` against the V225 artifact; every other card byte-equal; mile-entered → 0 S1 anywhere.
- G7 (D189 card/clipboard): typed literals for the default sentence and clipboard line at 3 levels × {5k, half, pace-goal beginner, run_base}; run_base chips exactly `['Mile','Recovery']`; entered/seeded/clamped/edited forms typed and unchanged except the "the intermediate default" word.
- G8 (D189 wizard): typed helper literal for 4 goals × 3 levels; D9 >25:00 literal; on intermediate and advanced pace goal with no mile the header literal and `#paceFeasLine` empty; the same cell with 9:00 typed prints the "Your mile is 9:00." form and a numeric header; beginner no-mile pace goal prints the generic form literal.
- G9 copy: every string in G6-G8 has 0 matches of `/\w\s?[-\u2013\u2014]\s?\w/` and 0 `Nike`.
- G10 HALF_MANNY: `MANNY_DIGEST_BY_VERSION[226]` = reference to 225 = `0ac7da6b1691a8e1`; row existence is a conjunct.

## Sabotage (`tests/sabotage/v226.json`; each anchor count 1; each names its row)
- S1 restore `experience !== 'beginner' && ` at :3815 → G1 (pace goal 13:00 tokens revert to 11:30). S2 same at :4376 → G1 (5K). S3 same at :3179 → G1 length cell (9 → 11). S4 same at :2433 → G8 (beginner 9:00 out-of-reach cell prints the "You have not entered" form instead of "Your mile is 9:00"). S5 restore `if(!g||exp==='beginner') return {ok:true};` → G3. S6 drop ` && exp!=='beginner'` from the R3 clause → G3 (beginner blank refused). S7 restore the :2876 guard → G4. S8 restore the pencil guard `s.runAnchor.kind!=='beginner'?` → G4 (replaces v203 M3). S9 `const kind = !entered ? 'default'` → `const kind = exp === 'beginner' ? 'beginner' : !entered ? 'default'` → G6 (no S1 on beginners) and G7. S10 remove the `d189DefaultAnchorNote(` call → G6. S11 in the pass, delete `return; ` after the append → G6 (many). S12 `weeks['1'] || weeks[1]` → `weeks['2'] || weeks[2]` → G6 (W2). S13 `'run_base'` out of `_CHART_RUN_GOALS` → G7. S14 chips branch removed → G7. S15 D9 old string → G8. S16 header branch removed → G8. S17 helper returns `'Optional. It sets your training paces.'` → G8. S18 `_mileEntryState().blank ? null : ` removed → G8 (feas non-empty on required-blank). S19 `LIC5L_ERAS` without 226 → g222 5L refuses.

---

## Mario — where this departs from 2026-09-23, with my pick

- (a1) **Beginner pace goal stays optional** (his Call 2 stands) while R3 requires it at intermediate and advanced (his 2026-09-29 ruling stands). Both survive because R3 scoped itself to non-beginners. Recommend: keep optional; a beginner by the app's own definition "can run ~2 miles" and may never have timed one, the 12:00 clamp bounds the harm, and a required box invites an invented number that D9 cannot catch. Counter: R3's own sentence, "a pace goal with no anchor is the thing this gate exists to stop", applies most to the athlete whose default is least likely to fit; extending R3 to beginners is one clause (`&& exp!=='beginner'` not added) and one label.
- (a2) **Class A2 direction.** A beginner who enters a faster mile gets shorter long runs and therefore more lifting on 160/480 long-run days (tier A → B, B → C). D187's licence went the other way only. Recommend: license it; the tier judges time on feet and the athlete's own number is the truer input; population today is zero. Counter: hold P-BEGINNERMILE's engine reads to NRC and run_base and keep the pace-goal beginner on the default until the tier rule is re-examined.
- (b) **D183's beginner feasibility line changes** ("Your paces start from the beginner default of 11:30 per mile … Keep it or change it above." → the generic "You have not entered a mile time. The beginner default is 11:30 per mile. … Enter your mile above and this updates."). Recommend: the field is now above him, so the generic line is the true one. Counter: keep V223's sentence byte-identical and accept that it does not tell him the field exists.
- (c) **D9's ">25:00" loses "Leave it blank …"** on every goal. Recommend: the helper line one row up now says what blank does where blank is allowed, and the sheet, which refuses blank, stops recommending it. Counter: keep the tail on optional goals only (one more branch keyed on goal and level).
- (d) **Wizard copy wording** differs from Call 4's W1/W2/W2b: one helper string per (goal, level) instead of three; "Enter a mile only if you have timed one." now at every level, not beginners only. Session-level, flagged for completeness.
- (e) **New strings not in Call 4:** the required label, the required-blank header, the feasibility suppression (item 8's fix). His to accept as copy.
- Everything else (three surfaces, S1 appended to the note, run_base block, pencil for beginners, C1/C3/K1 texts, D116 untouched) is his decision as made.

## Slicing (index.html edits; ≤4 per brief; `ia-version` 225 → 226 on the last slice only)
- Slice 1, D188 engine reads: E1 :2433, E3 :3179, E4 :3815 (+:3812 comment, same hunk), E5 :4376.
- Slice 2, D188 validator and anchor: E6 :7484/:7488 block, E7 :14708-:14723 block, E2 :2459, F6 :2280.
- Slice 3, D188 wizard and pencil, D189 header: E8 :2855 (+its closing), E9 :2876, E10 :14823, F5 :1997.
- Slice 4, D189 wizard copy: F1 helper, F2 :2856, F3 :2877, F4 :7496.
- Slice 5, D189 card and clipboard: F7 :14699 (+:14704 comment), F8 :14728, F9 :14740-:14760 block, F10 :14766/:14768.
- Slice 6, D189 S1 and housekeeping: F11 call (:10961), F11 function (:11029), `LIC5L_ERAS` + 226, `ia-version` 226.
- Slice 7, tests only: `g226_d188_beginnermile.js`, `g226_d189_pacedisclose.js`, `v226.json`, era rows on g203/g202/g223 and any other hit from the before-literal grep; harness `MANNY_DIGEST_BY_VERSION[226]` reference row.
Build order: D188 before D189 as Mario ordered (slices 1-3 land the beginner forms before slice 4-6 write the copy once). Gatekeeper's blast-radius classes: A1, A2, A3, B, C, D, F, tests. An unruled removal is a regression; the removals ruled here are the `kind==='beginner'` branches, the :2459 line and the two label literals.

## Copy (every athlete-facing string, verbatim, dash-free, no "Nike")
- Helper, required: `Required. Your paces and your program length start from it.`
- Helper, optional: `Optional. Leave it blank and your paces come from a 9:30 mile, the intermediate default. Enter a mile only if you have timed one.` (an 11:30 / beginner; a 7:30 / advanced)
- Header, required and blank: `Program length: your mile time sets it.` + ` Enter your current mile time and the length appears.`
- D9 >25:00: `Over 25:00 reads as a walk, not a run. Check the entry.`
- Card, default: `Anchored on a 9:30 mile, the intermediate default. No mile time was entered. Tap the pencil to enter one.` + existing tail; run_base tail ` Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.`
- Card, edited from default: `… Before that it was the intermediate default.`
- Clipboard: `Run anchor: 9:30 mile (intermediate default, no mile time entered) → …`
- S1: `Paces here start from a 9:30 mile, the intermediate default. Tap the pencil on your program card to enter your mile time. Every run ahead of you rebuilds off it.`
- Feasibility, beginner no mile (D183's generic form, unchanged text): `You have not entered a mile time. The beginner default is 11:30 per mile. In 11 weeks that reaches about 1.5 mi in 16:53. Your goal is 12:00. Enter your mile above and this updates.`

**Recommendation:** ship D188 and D189 together as V226 exactly as above, beginners optional on every goal with D9 applied, R3 untouched at intermediate and advanced, S1 appended to the W1 note, item 8's four contradictions closed, Class A2 licensed, 5L extended to 226, HALF_MANNY unmoved at `0ac7da6b1691a8e1`.

**Counter:** the smaller ship is D189's wizard and card only (no S1, no run_base block) plus D188's reads, leaving the W1 note and the long-run tier's reverse-direction reaction for a build of their own; it discloses the default at the decision and on the record but not where the athlete first runs off it, and it leaves 160/480 beginner-with-mile grids unexamined rather than licensed.

## MARIO DECISION (2026-09-30)
Mario: "all yes".
- D188 beginner pace goal: mile stays OPTIONAL (a1, coach's pick). ACCEPTED.
- D188 Class A2: long-run tier reacting to a beginner's entered mile (160/480 grids, 280 lines, rest to lift) LICENSED (a2, coach's pick).
- D189 copy: (b) D183 beginner feasibility line to the generic form, (c) D9 >25:00 to "Check the entry.", (d) one helper per (goal, level), (e) required label and required-blank header. ALL ACCEPTED.
- Session-level, recorded: g222 5L licence extended to 226 (no D-code); §12 follow-ups: wizardNext validation on cardio_goal, D116 lock copy naming test/race/retest, §12 (C) swap-seam fix build.
