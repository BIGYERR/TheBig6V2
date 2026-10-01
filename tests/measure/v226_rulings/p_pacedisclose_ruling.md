# P-PACEDISCLOSE — A GUESSED PACE SAYS IT IS A GUESS, ONCE AT EACH PLACE THE ATHLETE MEETS IT (coach, provisional, V209 baseline)
# plus P-BEGINNERMILE (split code, same ruling)

Persisted by the orchestrator from coach's return, 2026-09-23 (coach is read-only).
Mario: "is there anything that tells users, especially beginners, what the default pace is? That would be important to know, especially if they don't enter anything."

Measured: `node tests/measure/v212_default_pace_disclosure.js scratchpad/base.html` (ia-version 209; 180 builds, 0 crash, 5,620 run cards; output scratchpad/pacedisclose.out.txt) and scratchpad/manny_anchor.js. Reads: base.html :2236 :2441-2445 :2860-2882 :3182-3187 :3813-3818 :4348-4349 :7266-7280 :14300-14320 :14340-14372 :14419; handoff §11f D7a-e (:965-970), D9 (:958), D116 (:786), D110a (:767), V186 item 6 (:1376), F8 (:1377), §12 (:1396-1398); doctrine physicaltrainingguide2020.txt:250; V171 D1/D1b (:971-972).

## Summary (Mario's calls first)
1. Where the default is disclosed: three surfaces, once each: the wizard field (what blank means, with the number), the program card sentence (reworded to name the level and the pencil), and ONE sentence on the first paced run of week 1. No per-card caption, no week-view banner. Counter: the W1 card sentence is engine output and moves digests on every no-mile program; the cheaper ship is wizard plus card only.
2. P-BEGINNERMILE: let beginners enter a mile, optional, plus the pencil. The gate is a V50 literal; V172 only printed it. The one recorded reason (V186 item 6, "gentle either way") is refuted by the printed W1 card: 4x400m at 11:30/mi is not gentle for a 13:00 miler, and 14:05 recovery is the "truly too slow" complaint Mario filed in §12 for a 9:00 miler. Doctrine anchors on the athlete's own recent run at every level. Counter: a beginner's self-reported mile is the least reliable number in the wizard; an optimistic guess trains too hard.
3. NRC and run_base stay optional at every level, disclosed the same way. run_base gets the Run paces block (D7d's "prints no pace" premise died at V206).
4. Copy: below, dash free.
Measure needed: M1 to M4 (§6).

## 0. Premise checks
- The beginner gate is a V50 literal (`git log -S` on the wizard hide, the engine's `experience !== 'beginner'` reads :3187 :3817 :4349 :2442 :14306, and the validator's early return :7272). No D-code ruled it. V172 D7 stated it on the card; V176 D9 recorded it in a comment; V186 item 6 / F8 is the only reasoning on record ("gentle either way… Leave unless it shows on device"). P-PACERATE's "(V172 rule)" should read "V50 literal, stated at V172, never ruled".
- D7d's "never for run_base" (V157) was premised on run_base printing no pace. At V206 every run_base easy run prints "Around 14:05/mi is right for you. Do not run faster than 13:33/mi" from the anchor's row; an 8:00 mile changes intermediate run_base cards. Premise refuted.
- HALF_MANNY (repo fixture): `kind entered`, anchor 630 s, "Anchored on a 10:30 mile, the time you entered." Outside every change below.
- `applySeedData` writes `mileBestMins/Secs` and `mileBestSrc:{kind:'seeded'}` for ANY experience when the seed carries `mileSec`; so a beginner cfg can already hold a mile the engine ignores (M1).

## 1. Before (V209)
Program card, no mile:
  beginner      Anchored on an 11:30 mile, the beginner default. A mile time starts being used at intermediate.
  intermediate  Anchored on a 9:30 mile, estimated from experience; no mile time was entered. Every pace in this program comes from this row.
  run_base      runAnchorInfo=null (no block, any level)
Wizard non-beginner: "Current mile time (optional — personalizes your training paces)". Beginner: no field, no note.
Session cards: 0 of 5,620 carry a disclosure token. Beginner seed 1000, no mile:
  run_pace_goal W1 mon SI :: 4x400m at 11:30/mi. This week's goal pace is 11:46/mi. ...
  run_pace_goal W1 fri LSD :: 1.5 mi at Recovery Pace: 14:18/mi ...
  run_5k W1 mon Speed Run — Intervals :: 8 × 1:00 at 5K Pace (12:15/mi) ...
  run_5k W8 sun Long Run — RACE DAY :: 3.1 miles. 5K race day. Target pace 12:15/mi. ...
  run_base W1 sat Easy Run :: ... Around 14:05/mi is right for you. Do not run faster than 13:33/mi.
Pencil hidden for beginners (:14419): a beginner can never supply a mile.

## 2. Ruling
### Call 1: disclose at the decision, on the record, and once on the first paced run
(a) Wizard field says what blank resolves to, with the number (D21 resolve-line doctrine).
(b) Program card names the level, that nothing was entered, and the pencil; stops saying "estimated from experience".
(c) The first paced run of W1 carries one sentence in the app-owned note field (never Nike's detail). Once. Self-expires: prints only while the anchor is a default.
(d) NOT: per-card caption, week-view banner (P-RECOVBANNER principle), Progress or swap sheets.

### Call 2: P-BEGINNERMILE — a beginner may enter a mile, optionally, and add one later
Doctrine anchors on the athlete's own run at every level (Guide A p.12, doctrine:250; Nike Mile Pace, V171 D1). The app's beginner "can run ~2 miles" (:2705). "Gentle either way" is false on the printed card (13:00 miler gets 4x400m at 11:30/mi; a 9:00 running-beginner gets 14:05 recovery). The D9 advisory is written for exactly that athlete and beginners never see it. The pencil is hidden, so a beginner who learns his mile cannot tell the app.
Changes: wizard field renders for beginners; the five engine reads and runAnchorInfo drop the beginner clause; the validator applies; the pencil renders. 690 stays the default when blank. No change for any beginner cfg without a mile (M4).
Counter: a beginner's self-reported mile is the least reliable number; an optimistic guess trains too hard. Answer: copy asks for a timed mile, else blank; D9 rejects nonsense; every card names the effort.

### Call 3: NRC race goals and run_base stay optional at every level
Disclosure identical. Requirement stays only where the arithmetic demands it (pace goal gap, P-PACERATE). run_base renders the Run paces block with Mile and Recovery chips only; D7d amended. Counter: race day prints "Target pace 12:15/mi" off a guess; answer: D116 pencil before race-week lock, and wizard and card now say so.

### Call 4: copy (numbers from expCurrentPace via _fmtMileAnchor; level word from experience id; never a literal)
W1 label:  Current mile time (optional)
W2 helper (intermediate/advanced NRC and base; pace goal carries P-PACERATE's copy):
  Leave it blank and your paces come from a 9:30 mile, the intermediate default.
W2b beginner with field (P-BEGINNERMILE yes):
  Leave it blank and your paces come from an 11:30 mile, the beginner default. If you have never timed a mile, leave it blank.
W3 beginner note, no field (P-BEGINNERMILE no):
  Your paces start from an 11:30 mile, the beginner default. Every run also names the effort to hold. When pace and effort disagree, follow the effort.
C1 card, default:  Anchored on a 9:30 mile, the intermediate default. No mile time was entered. Tap the pencil to enter one. + tail
C1b card, beginner (P-BEGINNERMILE no):  Anchored on an 11:30 mile, the beginner default. The beginner program does not read a mile time. + tail
C3 run_base tail:  Your easy runs take their pace and their ceiling from this row. Benchmark runs prescribe no pace.
S1 first paced run of W1, note field:  Paces here start from a 9:30 mile, the intermediate default. Enter your mile time on the program card and every run ahead of you updates.
S1b beginner (P-BEGINNERMILE no):  Paces here start from an 11:30 mile, the beginner default. When pace and effort disagree, follow the effort.
K1 clipboard:  Run anchor: 9:30 mile (intermediate default, no mile time entered) → ...
Adjacent (session's call): D9's ">25:00" string:  Over 25:00 reads as a walk, not a run. Leave it blank and your paces come from a 9:30 mile instead.

## 3. After (expected)
Card, no mile: beginner/intermediate read C1 with their level and number; run_base gets [Mile 11:30] [Recovery 14:05] plus C1 + C3.
Week grid byte identical except ONE card per no-mile program (W1 first paced run gains S1). W2 onward unchanged. Mile-entered programs unchanged on every surface. HALF_MANNY digest 0ac7da6b1691a8e1 unchanged.

## 4. Does not change
690/570/450 and the chart clamp; the pace-goal mile requirement (P-PACERATE's); D9 validation; D116 race-week lock; V171 Intervals note; NRC session names and structures; no week-view banner; no per-card caption; V156 seed (§12 item stands).

## 5. Blast radius
Mile entered, any goal/level: nothing moves (Mario's half included). Every no-mile program: card sentence, clipboard line, one W1 note sentence; digests move on those only; trained days frozen per day. Beginners under P-BEGINNERMILE: field, pencil, D9 advisories appear; engine output moves only when a mile is present (seeded or typed). run_base all levels: new Run paces block, zero engine. Wizard: every run goal step.
Pins that move (standing rule 4): g203_ceiling_and_anchor.js:455-457, g203_mile_pencil.js:16/:215 (beginner pencils:0), sabotage/v203.json rows on those strings.

## 6. Measure needed before build
M1 Stored and fixture beginner cfgs carrying mileBest (seed path); under P-BEGINNERMILE they flip from ignored to read (kind 'seeded'). Print before/after W1.
M2 180-build lattice + rest {sun/wed, sat/sun}: exactly one W1 card per no-mile program gains the sentence; never a benchmark, race or TT card; zero on mile-entered programs; HALF_MANNY digest identical.
M3 Dash/hyphen sweep on every touched string; "Nike" absent.
M4 P-BEGINNERMILE lattice: beginner × mile {none, 9:00, 11:30, 13:00} × 3 goals × 20 seeds: "none" byte-identical to today; 13:00 lands on the 12:00 row with the D9 advisory; 9:00 moves SI/LI/LSD as an intermediate 9:00 would.

## 7. Ordering
After P-PACERATE (same wizard card). P-BEGINNERMILE, if yes, before P-PACEDISCLOSE so beginner forms are written once (C1/S1, not C1b/S1b).

Recommendation: ship all three surfaces, let beginners enter a mile, keep NRC and run_base optional.
Counter: wizard plus card only is the smaller ship; the W1 note moves digests on every no-mile program.

## MARIO DECISION (2026-09-23)
- Call 1: all three surfaces (wizard + card + one W1 first-paced-run sentence). ACCEPTED.
- Call 2: P-BEGINNERMILE YES — beginners may enter a mile (optional) and add one later via the pencil. Build P-BEGINNERMILE before P-PACEDISCLOSE (C1/S1 forms, not C1b/S1b).
- Call 3: NRC race and run_base stay optional at every level, disclosed the same way; run_base gets the Run paces block.
- M1 to M4 pending before build. Ship slot: HOLD with the batch.
