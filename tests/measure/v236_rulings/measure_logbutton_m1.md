# V236 measure m1 — P-LOGBUTTON before-picture (Mode B)

Artifact: index.html ia-version 235, HEAD 13800b5. Script: `tests/measure/v236_logbutton.js`; output: `tests/measure/v236_logbutton.out.txt`.
Lattice: 146 programs (HALF_MANNY; 16 goals: run 5k/10k/half/marathon/base/pace_goal, bike century/50/base/ftp/cals, swim 100/500/base/mile/tri,
x focus balanced/strength x exp beginner/advanced x seeds 76308/24865; 2 multi-sport run+bike+swim; 15 injury protect configs, 5 regions x 3 sport pairs),
5,142 cardio days opened through the real open path, 0 errors, 0 build failures. Self-diff of two runs: identical but for 2 clock lines.
Oracles: wheel faces from the rows' data-v by hand arithmetic; "stored" = raw ia_logs_ entry; reader credit = each reader's predicate restated from
its own line, cross-checked against the rendered nudge and Progress charts. Stub fix: getElementById returns null for an id not in the markup (mkEnv
creates on demand; without the fix rawSetVals looped to OOM and a pending settle found a phantom node).

## 1. Auto-save paths (every one ends in persistLogFields :14719, which rebuilds the whole entry from the DOM)
| field | element | event | handler | keys written (non-empty) |
|---|---|---|---|---|
| run minutes `log_run_mins` (time/dist forms) | hms wheel -> hidden input | scroll settle 90 ms -> `_iawCommit` dispatches `input` | listener :14185 / :14815 | run_mins; dist form also stamps run_dist=String(dose.mi) and run_pace (:14755-14757) |
| run miles `log_run_dist` (time, dist, reps_time, generic) | dist wheel | same | same | run_dist; time form also run_pace |
| run pace `log_run_pace` (generic) | pace wheel | same | same | run_pace |
| rep time `log_run_rep_time` (reps_dist) | rept wheel | same | same | run_rep_time, run_pace |
| reps `log_run_reps` (reps_dist, reps_time) | stepper +/- , hidden input | onclick | doseRep :13539 -> persistLogFields :13545 | run_reps, run_dist (derived) |
| bike `log_bike_mins` (every bike shape, xtrain bike) | hms wheel | settle -> input | listener | bike_mins |
| swim `log_swim_yards` (swim, xtrain swim) | number box :13829 | `input` per keystroke (1500 typed = 4 writes: 1, 15, 150, 1500) | listener | swim_yards |
| RPE `log_rpe` | range :13862, value `rpeVal||5` | input | listener | rpe |
| notes `log_notes` | textarea | input per keystroke | listener | notes |
| sport chip | button | onclick | setCardioSwap :14772 (flush :14780, persist :14781 and :14819) | swapFrom, swapTo, parked; 3 ia_logs_ writes per tap |
| Done / Skip / Mark Done ✓ (nudge) | button | onclick | handleDayStatus :14660 (flush :14665, persist :14666) | whole entry from DOM |
No `change`, `blur`, `focusout`, `pagehide`, `beforeunload` on any log id (static, comment-blind count 0). Swim confirmed driven, not read: same listener, per keystroke.
Every variant writes the same way (11 variants incl. injury cross-train run/bike/swim, chip-swapped forms 22/22, moved-in day writes under w1_wed).

## 2. First write side effects (5,142/5,142 days)
entry created; `snapshotDay` ia_hist_ (persistLogFields :14723); freeze touched (refreshProgram merges every ia_logs_ key :16058); and `rpe:"5"` stored on
every first write of any kind (slider default 5 read at :14739). Writes with no number at all (RPE only, notes only, chip tap only, Done on an untouched
form 5,142/5,142) also create the entry, snapshot and touch the freeze. Readers of the keys: _hasLog/nudge :14175-14178, session counter :17520 (counts
rpe), Average Session RPE chart (credits the default 5), restMoveCandidates :1536 (rpe blocks the day from moves), renderWeekView miles :12206, hero
:12157, _benchmarkEntryFor :13048, seedFromPriorPrograms :16337, ladderWeekly :16589, plannedVsLogged :16659, renderProgressScreen :17513-17515, journal :17639.

## 3. Done
Reads the DOM and writes fields (persistLogFields) then status; flushes a wheel inside its settle window (rolled to 40, Done at 20 ms: stored 40.00).
Filled then Done: entry byte-equal but ts. Untouched then Done: entry {rpe:"5"}, snapshot, complete (5,142/5,142). Reopen a Done day, move the wheel:
saved with no tap, status stays complete; tapping the primary button ("Done ✓ tap to undo") then UNMARKS (status null, toast "Unmarked"). Skip keeps values.

## 4. Hazard: a face showing a value while the store holds nothing (field-instances over 5,142 days)
S0 open: plan face D202 1,329 (run dist form miles 555/555, time form minutes 758/758 + xtrain 16/16); reps stepper planned count 48/48; zero face
D215 2,025 (by design, face shows nothing); RPE thumb at 5 with nothing stored 5,142/5,142.
S1 after logging the free field: plan face 774 (time-form minutes, run_mins ''), stepper 48, RPE inverse 5,142 (label "Move slider", stored "5").
S2 after Done and reopen: plan face 774, stepper 48 (RPE then reads "5 — Hard").
S3 P-DISTZERO gesture (roll, then column 0 to dash): 2,631/2,631 wheels show -.86 / -:55 / -:30 with '' stored.
Inside every settle window (90 ms) the face leads the store by design.

## 5. Precedents
Rest sheet `Log it` (applyRestCardio ~:1428): onchange draft only, nothing written before the tap; 0 min -> toast "How long did you go?", nothing
written; tap -> additive write (re-tap 3+3 = 6 mi), rest_cardio flags, rpe number; NO snapshotDay (hist false); no status; sheet closes; toast
"30 min logged ✓"; hero button relabels "Log cardio" -> "Log more" (:12170).
Lift `Log` (:13024, saveExWeight :14237): set edits before it autosave as drafts into ia_logs_.sets (writeSetDraft, snapshot on first draft); tap ->
ia_exw_ (one entry per exercise per day, overwrite on re-tap), draft cleared, toast "Logged ✓" / "N lbs logged ✓", card class logged, badge ✓,
counter "1 / 7 LOGGED"; no status. Empty card: toast "Nothing to log here".

## 6. Lifecycle
L1 move, ‹ Back 10 ms later: the pending settle still writes after close (33.00); overlay keeps layout when closed (CSS :881-883). L2 move, ‹ Back and
open another run day inside 90 ms: stub with kept layout writes the value into the OTHER day (fri run_mins 33.00); with detached nodes (device-likely)
neither day is written. L3 tab switch: detail overlay stays open, value stored. visibilitychange :18291 only runs iaCheckForUpdate; no reload.

## 7. Gates
Counterfactual copy with the two `input` listeners not persisting (scratch, 57 bytes): base 9/9 gates green; flips: g221 W2, g232 D202-move,
g233 D207-move, g235 D215-plan, g235 D215-clear. Unmoved: g191, g195, g222, g228, g234 (setCardioSwap persists directly). Reach map
v233_gate_reach.json is stale: it lists no g234/g235.
