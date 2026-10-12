# Group 13: injury and travel overlays

Phase 2 parity table (`docs/test-migration.md`, the parity rule). Rows are from `tests/row_manifest.txt`. The legacy
gates stay in `tests/gates/` and keep running in CI until phase 3.

New files:

- `tests/integration/injury-overlays.test.js` (31 tests): what the injury filter renames, drops and holds. The heading
  sync (D43), the pool lens and floor (D52, D44), the gear-lens renamer (D154), the travel holds copy (D54), the cap
  cue and the stripper (D193 R1, R4, R5, R6), the clamp's hold shapes and the held test (D193 R2, R7), the post-sweep
  re-filter on bodyweight (D197).
- `tests/integration/injury-plan-lens.test.js` (12 tests): the plan of the day (D194). The overlay writer's records,
  the build half on the overlay path, the swap, aux and add sheets, the Thursday-from plan, the travel stamp, the
  bridge back, the typed hold routes at the tap and at boot on the overlay and the fixture, a single-hop sample, and the
  late plan's typed cards (D194 Amendment 5).
- `tests/sweeps/injury-overlays.test.js` (10 tests): the lattices. The D154 renamer lattice (2,160 builds), the D193
  filter-lens census (L432, home_basic 108, the travel overlay 216, the D177 lite lattice 384 and 133 uninjured
  builds), the D194 sheets on the lite lattice's 288 injured configs, every capped single hop of the seven D190
  configs, every Main and Power swap pair of the lite lattice (150,989) against the hand hold, the post-sweep population
  on L432, the late-plan presentations, and a sample of the D190 swap chains in three modes.
- `tests/support/injury-overlays.js`: the fixtures (Mario's shape, L9, L432, the lite lattice), the hand tables (the cap
  table, the hold shapes, the cue, the held-test text, D177's rep floors, the hold toasts), the app drivers (store,
  boot, hop, undo, the sheets), the judge (the injury filter on a fully injured cfg, in a separate app), the filter
  lens, and the D52 pool-chain reader with its named debt.

Paths below are under `tests/`; `IO` is `integration/injury-overlays.test.js`, `PL` is
`integration/injury-plan-lens.test.js`, `SW` is `sweeps/injury-overlays.test.js`.

**Build-scoped conjuncts.** Several rows below held a "byte-identical to V<N>" or "the baseline reads V<N>'s figure"
conjunct, read off an older artifact fetched by `git show`. Those conjuncts are build-scoped claims (standing ruling 3:
each proved that its own build moved only what it ruled) and are dropped; the row's current-behaviour claim is held by
the test named. Where a row's figure was a count on the candidate, the count is typed in the test.

## `g192_labelsync.js` (19 rows)

| Row | Held by |
|---|---|
| `C1-healthy-lattice` | IO › "the heading lattice is thick enough: a healthy vocabulary, injured headings that name movements, race-week primers" |
| `C2-vocab` | IO › same |
| `C3-injured-builds` | IO › same (every injured build runs; a throw fails the file) |
| `C4-injured-lattice` | IO › same |
| `C5-claims` | IO › same |
| `C6-primer` | IO › same |
| `C7-raceweek-primer` | IO › same |
| `H1-swap-latch` | IO › "no heading names a movement the overlay renamed away: the heading follows the item" |
| `H2-unexplained` | IO › "every heading claim holds, or names a movement the shoulder workaround deletes outright (the parked class)" |
| `D43-fires` | IO › "D43 fires on every tier that owns dumbbells: the floor press in, the bench press out, and only on the injured program" |
| `D43-noleak` | IO › same |
| `D43-negctl` | IO › same |
| `U1-swap-name` | IO › "the shoulder workaround renames the bench press to the floor press, and its heading follows" |
| `U2-swap-label` | IO › same |
| `U3-spine-name` | IO › "the spine-safe swap renames ab wheel rollouts to dead bugs, and its heading follows" |
| `U4-spine-label` | IO › same |
| `N1-healthy` | IO › "the rename leaves a healthy card alone, leaves a generic heading as written, and is idempotent" |
| `N2-generic` | IO › same |
| `N3-idempotent` | IO › same |

## `g193_pool_overlay.js` (10 rows)

| Row | Held by |
|---|---|
| `D52-chain` | IO › "the injury pool-override chain is in the source and its pools resolve per tier" |
| `D52-lens` | IO › "an injury pool never offers a movement the same plan's filter removes (outside the named debt)" |
| `D44-floor` | IO › "every injury pool of two or more members leaves two standing on every tier after its own filter" |
| `D44-thin` | IO › "a pool authored with fewer than two members is one the named debt lists, and every listed debt still trips" |
| `D52-lit` | IO › "the lowback/protect vertical pull holds four or more members, no L-sit chinups, and excludes only the drawn main" |
| `D52-lsit` | IO › same |
| `D52-four` | IO › same |
| `D52-whole` | IO › same |
| `D52-single` | IO › same |
| `D52-debt` | IO › "a pool authored with fewer than two members is one the named debt lists, and every listed debt still trips" (the debt file `tests/gates/g193_pool_overlay_debt.txt` is typed into `tests/support/injury-overlays.js`, its 16 entries current at this release) |

## `g216_d154_swap_lens.js` (12 rows)

| Row | Held by |
|---|---|
| `U0` | IO › "the renamer hand table: the fallback lands on the no-cable tiers, and the cells the ruling names agree with the rule" |
| `U1` | IO › "only the shoulder and elbow workaround plans rename, and they rename exactly the ruled pairs" |
| `U2` | IO › "on every tier each swap source prints as the gear lens rule says, the heading follows, and a legal source never renames illegally" |
| `U3` | IO › same |
| `P0` | SW › "the renamer lattice: elbow and shoulder workaround programs print only what the tier owns, and the elbow swap lands" (2,160 configs build) |
| `P1` | SW › same; IO › "elbow and shoulder workaround programs print no item the tier does not own, and the elbow swap lands (sample)" |
| `P2` | SW › same; IO › same |
| `P3` | SW › same; IO › same |
| `P4` | SW › same |
| `C1` | IO › "the elbow workaround copy is the ruled sentence, with no hyphen or dash" |
| `C2` | IO › same |
| `L:793e1c6e` (HM) | DROPPED: the shipped HALF_MANNY digest, held by `integration/program-output.test.js` |

## `g228_d193_cueword.js` (4 rows)

| Row | Held by |
|---|---|
| `D193-c-LIT` | IO › "the cap cue is "hold RPE 7, three in the tank": three is 10 − 7, the rule the RPE card states" |
| `D193-f-STRIP` | IO › "the stripper takes either cue wording and the held-test text back to the bare dose, and leaves everything else alone" |
| `D193-f-STORED` | IO › "a card stored with the old "two" cue keeps it on a past week, and a live swap re-cues the capped target and undoes to the stored words" (the stored record is built now with the retired wording put back on its one card; the V227 pair conjuncts, "equal to V227's live card and toast", are build-scoped and the test types the card and the toast instead) |
| `D193-g-COUPLE` | IO › "the add path refuses a cued detail and R7's held-test prose, and a loaded-to-loaded swap carries the donor dose live and at boot"; IO › "no card on a capped pattern prints above RPE 7 …; no power card carries the cue (L9 and a slice of L432)"; SW › "L432 and home_basic: …" (power cards) |

## `g229_d193_build.js` (10 rows)

| Row | Held by |
|---|---|
| `d193-a` | IO › "no card on a capped pattern prints above RPE 7 or keeps a pre-hold gloss; …"; SW › "L432 and home_basic: no card on a capped pattern prints above RPE 7 …" (V228's 316 and 120 were the baseline figures: build-scoped) |
| `d193-b` | IO › "an uninjured program keeps no pre-hold dose: not after a build, two live swaps, a boot replay, or an undo"; SW › "the lite lattice: … uninjured builds keep no pre-hold dose" (133 builds); its HALF_MANNY conjunct is held by `integration/program-output.test.js`; its "byte-identical to V228" and "moved against V228" conjuncts are build-scoped |
| `d193-d-BWSETS` | IO › "the clamp writes each of the four hold shapes and R7's held test on a capped lift, and leaves an uncapped lift alone" (typed before and after); IO and SW lens census (no capped card keeps `stop 2 reps short`) |
| `d193-d-GRAMMAR` | IO › same |
| `d193-d-WAVE` | IO › same (the ruling's two printed wave texts, held and unheld) |
| `d193-d-LOADCAP` | IO › same; IO › "on the travel overlay a capped load-limited card holds as "3 sets of 8 to 12 — RPE 7 (leave ~3 in reserve)""; SW › "the travel overlay lattice: …" |
| `d193-f` | IO › "the stripper takes either cue wording …"; IO › "the held-test text and the strength test text are the ruled sentences, and the stripper maps one to the other" |
| `d193-g` | IO › "the add path refuses a cued detail and R7's held-test prose, and a loaded-to-loaded swap carries the donor dose live and at boot"; power cards in the lens census |
| `d193-h` | IO › "on the travel overlay a capped load-limited card holds …" |
| `d193-j` | IO › "a held pattern does not test: capped strength test cards read R7's text, uncapped ones the test, never a number-only blend"; SW › "the lite lattice: 30 held test cards read R7's text, 102 unheld ones the test, none number-only; …" |

## `g229_d194_lens.js` (7 rows)

| Row | Held by |
|---|---|
| `d194-o` | PL › "on the overlay path no capped card prints above RPE 7, and every overlay card equals the fixture's card"; PL › "on the overlay path a held lift does not test: …" |
| `d194-p-SWAP` | SW › "the lite lattice on the overlay path: W5 sheets offer nothing the plan rejects, and equal the fixture's sheets" (4,608 rows); PL › "Mario's knee overlay: W5 swap, aux and add sheets …" |
| `d194-p-AUX` | SW › same (1,814 rows); PL › same |
| `d194-p-ADD` | SW › same (1,440 rows); PL › same |
| `d194-p-MARIO` | PL › "Mario's knee overlay: W5 swap, aux and add sheets offer nothing the knee plan rejects, and equal the fixture's sheets" (its W3 "== V228" conjunct now reads "== the uninjured program's W3 sheets", the claim it stood for; the V228 named cards are build-scoped) |
| `d194-p-UNSTAMPED` | PL › "a plan written from a Thursday governs Thursday on, and the days before it keep the uninjured sheets"; PL › "a travel-only overlay stamps its days with the substitute patch and no injury" (its "W5 == V228" and "uninjured lists == V228" conjuncts are build-scoped) |
| `d194-p-BRIDGE` | PL › "coming back from the injury: the bridge days offer nothing the knee plan rejects, then the half step" (the half-step "== V228's uninjured read" conjunct is build-scoped) |

## `g230_d194_lens2.js` (14 rows)

| Row | Held by |
|---|---|
| `d194-inst-self` | PL › "a stored record, fixture or overlay, written twice equals itself" |
| `d194-inst-stamp` | PL › "the app's overlay writer stamps every carded day of the injured build, and each day equals the fixture's" |
| `d194-inst-ov1` | PL › same |
| `d193-e` | SW › "every capped single hop of the seven D190 configs holds, live and at boot, the overlay equal to the fixture" (196 bodyweight-set ends at RPE 7, 14 cue ends, 0 at RPE 8); PL › "Mario's capped single hops …" |
| `d193-k-dprime` | SW › same (the 196 print the unloadable hold toast, the 14 cue ends print "Same job, same numbers.") |
| `d193-e-prime` | SW › same (114 natives above RPE 7: 0 above 7 live or at boot, 114 hold toasts) |
| `d193-k` | SW › "every Main and Power swap pair of the lite lattice reads the hand hold and its toast, the overlay shape equal to the fixture" (150,989 pairs; clamp pairs 1,253 = verbatim 694, unloadable 360, window 199; INFO 458; the bed-thrust donor 10). Its "non-clamp toasts == V229's" conjunct is build-scoped |
| `d193-l` | SW › same (G3a 839 = 529 / 199 / 111, G3c-off 172, G3d 263, G3e 205, G3f 199, bed-thrust donor 7 / 4 / 3) |
| `d193-i` | SW › "swap chains through a held lift read the same on the overlay and the fixture, live, at boot, after undo and after a reboot" (straight mode); PL › the typed routes (U0, U1) |
| `d193-i-r` | SW › same (reboot mode); PL › the typed route RB |
| `d193-i-u` | SW › same (undo-onto-the-held-card mode, with the direct swap); PL › the typed route U2 |
| `d194-eq` | SW › same (every field of every chain, overlay == fixture); PL › the typed routes on both presentations |
| `d194-q-prime` | PL › "on Mario's overlay program the hold reaches the tap and the boot: every typed route reads as ruled"; PL › "on the fixture the same typed routes read the same, …" |
| `d194-postsweep` | SW › "L432: no built card is one the plan's own filter, re-applied, would drop, rename or re-detail (overlay and fixture)" |

The chain rows are held on a sample. The legacy lattice is 18,580 chains over weeks 3, 5 and 7 (about 18 minutes on
six workers); the sweep takes up to three chains per swappable card and eight per day on weeks 3, 5 and 7 of each of
the seven configs, each with its hold firing on hop 1, and runs all three modes on both presentations (about 7 s). The
typed routes in PL hold the same claims on exact strings. The sample is a reduction of the legacy population, not a
drop: every claim of the four rows is asserted, on fewer chains.

## `g231_d194a4_lateplan.js` (5 rows)

| Row | Held by |
|---|---|
| `a4-cards` | PL › "a swap made before a late plan boots under the late plan, whole day re-filtered (three typed cards)" |
| `a4-dedupe` | SW › "a late plan after app-written swaps: no name twice in a section, no jump on a knee or ankle day, reboot equals boot" |
| `a4-nojumps` | SW › same |
| `a4-reach` | SW › same (swaps land on every presentation, days are judged, the stored state equals itself, reboot == boot) |
| `a4-ctl` | DROPPED: the legacy machinery itself. The row applied sabotage mutation S32 inside the gate to show the gate discriminates; it is a test of the gate, not of the app |

## `g231_d197_filterlast.js` (3 rows)

| Row | Held by |
|---|---|
| `D197-a` | IO › "elbow workaround on bodyweight: the swept chest volume pushups hold at RPE 7 on the W3 and W4 Mondays of all ten programs" (the "rest of the program == V230's" and live V230 diff conjuncts are build-scoped) |
| `D197-c` | IO › "ankle workaround on bodyweight: the chest volume burpees are gone from every Monday, and no burpee prints anywhere" |
| `D197-L` | IO › "the post-sweep re-filter sits inside the bodyweight branch, once, guarded by the injury, so no loaded tier moves (source)" |

## g194 D54 rows (from group 8)

`g194_implement_and_range.js` has 21 rows; the migration map counts the gate under group 8 (progress) and sends its five
D54 rows (the travel overlay's holds copy) here. Group 8 moved the other 16 (D53, D55, `R1-ledgerModel`,
`R2-mainLiftBlock`) and handed these five on (`docs/test-migration/08-progress.md`). The test renders the travel tab
(`_renderTravelTab`) on an active program for every equipment choice and reads the holds sentence the athlete sees.

| Row | Held by |
|---|---|
| `D54-copy` | IO › "the travel holds copy names no implement on any tier, keeps the single arm progression, and has no mid-sentence dash" |
| `D54-noimpl` | IO › same |
| `D54-hyphen` | IO › same |
| `D54-branch` | IO › same (the rendered travel tab prints one sentence on every tier that is not bodyweight: the two-branch claim, read from the page instead of the source) |
| `D54-singlearm` | IO › same |

## Totals

- Rows: 89. The map's 84 over nine gates, plus the five g194 D54 rows from group 8.
- Mapped 87, dropped 2: 1 HALF_MANNY digest row held by `integration/program-output.test.js` (`g216_d154_swap_lens`
  HM, `L:793e1c6e`) and 1 row that is the legacy machinery itself (`g231_d194a4_lateplan` `a4-ctl`, an in-gate sabotage
  control). Build-scoped conjuncts inside mapped rows (a comparison with an older release) are named in the tables.
- Mutations: not run (sabotage off).
- Pass: `IO` 31 of 31, `PL` 12 of 12, about 2 s each; `SW` 10 of 10, about 4 minutes on a loaded machine (the
  renamer lattice, the sheets and the swap pairs take most of it).
