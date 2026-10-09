# V238 premise check m2: D223-D227 code-read premises, on V237. Verdicts and numbers only; no ruling, no fix.

Mode: B (premise check against the saved ruling `v238_ruling_d223_d227.md`, read whole).
Artifact: `index.html` ia-version 237, HEAD 49c36f9. Fixture HALF_MANNY, seed 76308.
Script: `tests/measure/v238_premise.js` (parts P1 P2 P4 P4L P5 P6). Output: `tests/measure/v238_premise.out.txt`.
Method: VM stub as in m1. Every case starts from a fully cleared store (`localStorage.clear()`). Run 1 of P2 did not clear `ia_remind_last_`, so `maybeShowReminder` showed a false difference; it is superseded by run 2, and both runs are kept in the .out.
P2/P3 instrument: on V237 code, the W1 WED jog (37 min, 3.7 mi, RPE 7) is planted three ways:
- V0: the real `applyRestCardio` output.
- V3: V0 plus `week:1` and `ts`.
- V2: the ruling's shape, `{restLog:{run:{mins:37,dist:3.7,rpe:7}}, week:1, ts}`.

The three variants differ only in the planted keys, so any reader whose output differs reads those keys. Readers were printed one by one, and the full week view and Progress HTML were diffed chunk by chunk. Two worlds:
- World A: the jog only.
- World B: the jog plus a Mon session (2.0 mi, RPE 6, Done) and 4 Fri recovery runs in W1 to W4 (3 mi at 10:00/mi, with hist snapshots), so the pace seeds and `maxDist` are live.

0 throws.

## P1 lens siting: HOLDS, with one read that bypasses the getters (key existence only)
- **Reads of `ia_logs_`:**
  - `getLogs` :1230 and `getLogsFor` :1234.
  - `refreshProgram` :16160 reads `localStorage.getItem('ia_logs_'+prog.id)` directly. It uses only the map's KEYS, merged into the freeze's `_touched` set (:16158-:16183, `_maxTouched`). A lens that never adds or removes a key does not change it.
  - `purgeProgData` :16338 removes the key.
  - No other literal. No `localStorage` iteration anywhere (0 hits). No export: `buildExportHTML` :13921 returns `''`. No import or backup. Computed-key get/set calls (3 each) are all reminder and pop stores.
- **getLogs callers (13):** readSetDraft :1264, writeSetDraft :1278, clearSetDraft :1286, applyRestCardio :1435, restMoveCandidates :1531, renderWeekView :12102 and :12164, _benchmarkEntryFor :13046, buildLogHTML :13873, openDetail :14210, cardioLive :14778, persistLogFields :14799, setCardioSwap :14883.
- **getLogsFor callers (3):** seedFromPriorPrograms :16434, which reads every program; renderProgressScreen :17596 and :17741.
- **Readers that take `logs` as a parameter (all fed from :17596):** recoveryPaceWeekly :16475, ladderWeekly :16683, runsByClass :16701, easyEffortWeekly :16723, plannedVsLogged :16748, easyVsPrescribed :17172.
- **`ia_hist_` snapshotting** (snapshotDay :1330) reads `activeProg`, never the logs.
- **Writes:** `saveLogs` :1238 is the only setItem. Its 5 callers (writeSetDraft :1283, clearSetDraft :1290, applyRestCardio :1444, persistLogFields :14843, setCardioSwap :14894) each write a map they got from `getLogs()`.

## P2 reader completeness: PARTLY (one dependent reader not named, and one named reader misclassed)
**ladderWeekly is a max reader, not a sum reader.** D224 puts it under "Weekly sums credit the jog … `ladderWeekly` (:16691, a `run_dist` sum reader) the same". At :16680-:16694 it is the longest SINGLE run per week (`wk[w]=Math.max(wk[w]||0, d)`; the comment says "not weekly volume"). Printed in World B: W1 = 3.7 = max(2.0, 3, 3.7), not a sum. By D224's own class rule it belongs with the max readers (the jog is its own candidate, never added to a session).
Readers whose output differs, V0 to V2. Each is named by D224:

| Reader | World A | World B |
|---|---|---|
| Week MILES | 3.7 → 0 | 8.7 → 5 |
| Rest hero line | `37 min run logged · RPE 7` → none | same |
| Hero button | `Log more` → `Log cardio` | same |
| ladderWeekly | `{1:3.7}` → `{}` | W1 3.7 → 3 (a weekly MAX: the jog was the week's longest single run) |
| Progress mileage, total / peak | — | 17.7 → 14.0 / 8.7 → 5.0 |
| Progress RPE chart, total / peak | — | 18.0 → 17.0 / 6.0 → 5.0 |
| Journal W1 | `Wed RPE 7 — Very Hard` → no journal | 3 entries → 2, the Wed row gone |

- **Not named by D224:** in World A (a jog-only program), Progress falls back to **"No data yet"**. `hasAnyData` (:17647, key count) is still true, but every section's HTML is empty, so the fallback at :17815-:17818 fires. It depends on the named sections: it clears once any of them credits `restLog`. Under D224, walk and row credit no sum, so a walk-only program shows Progress only through the average RPE and journal readers D224 names.
- **Identical across all three variants, in both worlds:**
  - week DONE tile (0/5, 1/5) and the WED strip cell
  - `computeStreak` (0, 1) and `maybeShowReminder` (after the reset)
  - `restMoveCandidates`, the `refreshProgram` freeze and `plannedVsLogged`
  - `runsByClass`, `easyEffortWeekly`, `easyVsPrescribed`, `recoveryPaceWeekly`, `_benchmarkEntryFor` W1 to W5
  - `seedFromPriorPrograms` between V0 and V2: its `maxDist` moves only with `ts`, which is P3
  - `hasAnyData`

  Session counter: `weeklyData.sessions`, 0 readers (m2). Export: removed.

## P3 `ts`/`week` stamping: PARTLY (one extra reader: journal order)
- **Readers of a log entry's `ts`:**
  - seedFromPriorPrograms :16438 (21-day window, both ends) and :16442 (`latest`, but only for entries that pass the pace test).
  - The journal sort :17750-:17752, `(a.w-b.w) || (a.ts-b.ts)`.
  - No reader filters on a log entry's `week` field; week always comes from the key regex. The other `.ts`/`.week` hits are `ia_exw_`, `ia_comp_` and reminder stores.
- **V0 → V3, the only changes:**
  - **maxDist (intended):** World B `maxDist` 3.0 → 3.7.
  - **Journal order within a week (not named):** World B W1 goes `Wed, Fri, Mon` → `Fri, Mon, Wed`. A rest entry with no ts sorts first in its week; with ts it sorts by time.
  - Nothing else: week HTML 0 changed chunks; Progress HTML 12 chunks, all the reorder.
- **V237 already stamps week/ts on rest entries in one case:** a set autosave on a moved-in day (see P4). writeSetDraft :1282 writes `week` and `ts`, so `maxDist` already counts some V237 rest jogs.

## P4 legacy lens premise: REFUTED as worded ("no session ever wrote there"); the cleared keys are still the jog's
- **Path:** jog, then "Training anyway?", then open the moved-in day, then one set autosave (`autoSaveSets` :12563 → `writeSetDraft` :1270, read-modify-write). The entry becomes `{rest_cardio, rest_type, rest_mins, rpe:7, run_dist:3.7, sets:{front_squat:…}, week:1, ts}`. HALF_MANNY WED ← TUE (lift) and WED ← SAT (run:dist with kettlebell swing) both drive it.
- **Lattice (seed 76308):** 16 goals × 7 focuses × 3 experience × 2 equipment × 2 rest patterns = 1,344 configs, W1 first rest day × every candidate = 6,720 pairs. Every moved-in day has a loggable exercise (6,720/6,720), and one autosave leaves `rest_cardio` and a session's `sets` on one entry in **6,720 / 6,720**:

  | Jog | Moved-in day | Pairs |
  |---|---|---|
  | bike | bike | 1,200 |
  | bike | lift | 900 |
  | run | lift | 600 |
  | run | run | 1,920 |
  | swim | lift | 720 |
  | swim | swim | 1,380 |

  clearSetDraft removes `sets` and keeps `week`/`ts`. The first `persistLogFields` drops `rest_cardio` (m1), so `sets` is the only session key that can sit beside it.
- **The lens's cleared keys** (`rpe`, `run_dist`, `bike_mins`, `swim_yards`) are still the jog's on these entries: no session write reaches them until a rebuild, and a rebuild removes `rest_cardio`. The lens as written does not touch `sets`. So the clearing holds; the premise's wording does not.
- **Other orders tried, no co-existence:**
  - Moved-in form opened, never saved: the entry is the jog alone.
  - A day with only set drafts IS offered as a move origin (`sets` is not in the logged test). After the move its stub is rest+moved and `restDayEligible` is false, so no jog can land on it.
  - Mon session logged, then a rebuild with `restDays:[mon,sun]`: W1 MON stays a training day (frozen, touched), so a jog cannot land on a logged day.
  - WED jog, then the same rebuild: WED stays Rest.
  - `openDayKey` on a rest day opens the sheet, never the detail form. openDetail's other 5 callers re-render `currentDayKey`.
  - No program-regenerate UI exists (`editProgId` is rename only).
  - The writers of `ia_logs_` are the 5 listed in P1, and only applyRestCardio reaches a rest key.

## P5 "the bike sheet asks for a distance and drops it": HOLDS (and row too)
`showDist = type!=='walk'` (:1404). bike: box "Distance (miles) optional", typed 9.5, stored `{…, bike_mins:37}` with no distance. row: same box, 9.5 dropped, no sport key at all. walk: no box. run 9.5 → `run_dist:9.5`. swim 9.5 → `swim_yards:9.5` (box in yards). The wizard offers no row type (0 hits), so row is reachable only through a stored `cardioTypes` that contains it.

## P6 (H1) hero byte-identical: PARTLY (32 of 84 multi-log sequences differ)
- **What V237 renders:**
  - `_rcLine` (:12165-:12167) reads `_heroCardio.rest_cardio`, `rest_mins`, `rest_type` (through the word map, falling back to the raw type) and `rpe` (`—` when falsy). It renders only when `wkData[heroKey].rest` holds.
  - The button label is `_rcLine ? 'Log more' : 'Log cardio'` (:12177).
  - V237 always prints exactly one line: the last log's minutes and type, with the last RPE.
- **Instrument:** the ruling's lens implemented from D223 item 5's text, rendered one line per type that has `mins`, in the hero template. Compared against the real V237 hero over 84 sequences: 1, 2 and 3 logs over run, bike, swim and walk (the first log 37 min RPE 7, later ones 20 min RPE 5).
- **Byte-identical:** 52 / 84. That includes every single log (4/4) and every sequence without bike (39/39).
- **Different:** 32 / 84. All involve bike:
  - **Bike logged once, not last** (21/21). The lens gives bike a line from `bike_mins` with no rpe. Example: `bike>run` renders in V237 as `["20 min run logged · RPE 5"]`; the lens gives `["20 min run logged · RPE 5", "37 min ride logged · RPE —"]`.
  - **Bike logged twice or more** (11/11). The lens's mins is the `bike_mins` sum, while V237 prints the last `rest_mins`. Example: `bike>bike` renders `20 min ride` in V237 and `57 min ride` through the lens.
  - **Bike logged once, last:** 0/13 differ.

## Gaps
- P2 drove one jog type (run) at one seed. Bike and swim jogs reach the same readers through `bike_mins` and `swim_yards`, by code-read.
- P4L ran at seed 76308 only (m1 showed the W1 layout is the same at all three seeds).
- Pre-V236 history: the first commit carrying `rest_cardio` is 93d98b7. I did not check whether `persistLogFields` rebuilt from scratch at every version since, so a co-existence path that existed only in older builds is not ruled out.
- P6 covers sequences of up to 3 logs.

## For coach (questions raised by the PARTLY / REFUTED verdicts; not answers)
1. **P4.** A V237 rest entry can carry a session's `sets` beside `rest_cardio` (6,720/6,720 moved-in days after one set autosave). Does D223 item 5's wording ("no session ever wrote there") need to name `sets` as carried by the lens? And is a converted entry `{restLog, sets}` the intended shape?
2. **P6.** The lens as worded, which gives `bike_mins` to `restLog.bike.mins`, renders a different hero in 32/84 multi-log sequences, every one involving bike. Does H1's byte-identical claim stand as worded, or does the lens's bike rule change (for example, rest_mins for the last type, no line for a type with no rpe)?
3. **P3.** Stamping `ts` reorders the journal within a week (a jog with no ts sorts first; with ts it sorts by time). Is that intended alongside D224's journal change?
4. **P2.** In a program whose only entries are jogs, Progress shows "No data yet" unless a named section credits `restLog`. For walk or row jogs (no sum credit under D224), should the average RPE and journal sections alone keep Progress off its empty state?
5. **P2.** ladderWeekly is the longest single run per week (:16680-:16694), so D224's sum class does not fit it. Does it take the jog as its own candidate (the max rule), the way D224 treats `maxDist`?
6. **P5.** Row also drops its distance. Does D223's "dist is stored when the sheet took one" cover row, and walk, which today takes no distance?
