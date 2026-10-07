# measure mSK — Post-V233: sort of the first Version-scope skip reds (Mode A, no build)

Run: `ROW_CHECK_BOOTSTRAP=1 ROW_MANIFEST_OUT=… GATE_TIMES_OUT=… tests/gate.sh index.html base_V232.html` on HEAD be9f8e7 + uncommitted tooling, alone.
Script: tests/measure/v233_skip_sort.js (reruns g205_pace_eve and g212_d110a_swim, classifies with rows.js, static tally scan, g205 guard, sabotage index).

## Run
- wall 889 s; exit 1. Load 2.97/4.47/5.28 before, 6.35/12.80/11.73 after (outside python + Spotlight).
- Steps 0, 1, 2, 2b (version_scope PASS 97 FAIL 0), 3 (self-stable yes, digest 2d35e8f743680cfa) green. gate.sh prints no per-step clock.
- Step 4: 97 gates, all FAIL 0. g230_d194_lens2 (GATE_POOL=6) 718.6 s in background; the other 96 gates sum 1766.4 s at -P 2 (~883 s), which is the critical path.
- Step 4b: `row check: PASS 2064 FAIL 15`. GATES RED 1 of 99: rows.js. Manifest 2064 rows written.
- Step 5: 3 hunks, +11/-6 vs V232.
- Non-skip reds: 0.

## The 15 skip reds
| # | gate | key | line | cause in code | class |
|---|---|---|---|---|---|
| 1 | g205_pace_eve | L:14b310e3 | `SKIP P4b/P4c: the note left the week view (P-RECOVBANNER); the string is an engine trace` | `ON_SCREEN = /activeProg\.legRecoveryNote/.test(SRC)` (L272), false on V233: 0 hits in stripped or raw source | D |
| 2 | g212_d110a_swim | 0 | `SCOPED OUT 0  SKIP 0  NOT YET BUILT 0` | summary() footer (L150), a count of zero | U |
| 3–14 | g215_d149_ghd, g216_d154_swap_lens, g216_d156_longday, g217_d160_dedupe_view, g218_d157_swim_sizer, g219_d167_pairs, g221_d177_swapfloor, g221_d178_active, g221_d179_donenav, g221_d180_blockopen, g222_d181_durable, g232_d199_runwheel, g233_d207_bikewheel (13) | L:43cd6e2d | `SKIP 0` | done()/summary footer `'\nSKIP ' + skip`, a count of zero | U |

Split: L 0/15, D 1/15, U 14/15.

### (D) g205_pace_eve L:14b310e3
Guard is a source predicate: the week view no longer reads `activeProg.legRecoveryNote` (P-RECOVBANNER, V220 D173). Never runs while the banner is off the screen; not a missing input. Sabotage: v220_d173.json S1 restores the banner render (ON_SCREEN would go true and P4b/P4c would run) but names only g220_d173_recovbanner as its trip; v205.json says "P4b ... stays green by construction". No mutation trips through P4b/P4c.

### (U) the 14 tally lines
Each is the gate's closing count, not a row: all 14 print 0 at V233 (no named SKIP row fired in any of those gates). rows.js classifies a line starting `SKIP`/`SCOPED OUT` as a skip row and fallback-keys the rest; numbers normalise to `<n>`, so the key is the same at any count (`SKIP 0` and `SKIP 3` both L:43cd6e2d; g212's footer L:875234c2 at any counts; g212's printed key `0` is KEY_RE taking the leading digit). Neither L (no input is missing) nor D (nothing is dark). What decides it: whether a count footer is a row (rows.js classify lens, or the 14 footers' wording) — tooling shape, not a gate condition. An allow entry for it would have no missing-input cause to name, and being key-stable at any count it would never go stale.
Static scan: 13 of 97 gate files match the `'\nSKIP ' + n` footer regex; g221_d180_blockopen (footer `'\n\nSKIP '`) is missed by the regex but is red in the run, so 14 observed.

## Candidate allow-list lines for (L)
None: 0 rows sorted L.
