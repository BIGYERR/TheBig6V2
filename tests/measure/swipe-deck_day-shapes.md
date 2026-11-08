# Swipe deck: the day shapes (measure, 2026-11-06, v0.255.2)

Mode B, the before-picture for the P-DECK build (`docs/decisions/swipe-deck.md`, "Before the build", step 1). Script:
`tests/measure/swipe-deck_day-shapes.js`, run on `index.html` at v0.255.2 (HALF_MANNY digest `e47eb1012ab04bff`,
unmoved). Cards are counted by the deck generator's own rule (`docs/design/swipe-deck/deck-data.ts`, `board()`): a
main or single lift is one card, a superset of two or more is one round card, a core or hip section is one block card,
post-run mobility is one cool down card. Under D272 item 7 the run is not a deck card; the finish card (Call it) is not
counted. The oracle for the rule: HALF_MANNY week 10 counts as the canvas's Version 76 decks show (Monday 3 work cards,
Tuesday 5, Thursday 7, Friday 4, Saturday 1).

## Sets

- **Lattice:** the shared 864 configs (`tests/lattice193.js` FULL: 8 injury states × 6 equipment tiers × 2 focuses ×
  3 experience levels × 3 seeds) on HALF_MANNY. 60,480 training days, 59,832 with lift work.
- **Other goals:** the snapshot configs of `tests/support/programs.ts` other than HALF_MANNY (5K, 10K and marathon races,
  two 1.5 mile tests, run base, bike FTP, swim 500, run and bike base), race dates moved 12 to 20 weeks past 2026-11-06,
  each at seeds 1013, 3039 and 76308. 27 programs, 1,413 training days, 1,395 with lift work.

## Findings

| | Lattice | Other goals |
|---|---|---|
| Work cards per deck: min, median, p90, max | 1, 3, 6, 9 | 1, 3, 6, 6 |
| Decks of 7 or more work cards | 5,840 of 59,832 (9.8%) | 0 of 1,395 |
| Rounds per deck: 0, 1, 2, 3 | 24,244 · 29,031 · 5,821 · 736 | 230 · 649 · 483 · 33 |
| Blocks per deck: 0, 1, 2, 3 | 26,670 · 24,090 · 8,448 · 624 | 678 · 513 · 204 · 0 |
| Tallest card (movements): 1, 2, 3, 5 | 11,864 · 34,684 · 10,368 · 2,916 | 128 · 964 · 255 · 48 |
| Cardio and lift / cardio only / lift only | 78.9% · 1.1% · 20.0% | 66.7% · 1.3% · 32.1% |
| Decks that are only the cool down | 3,810 (6.4%) | 45 (3.2%) |
| Cardio and lift days, run first by the app's order | 47,736 of 47,736 | 543 of 942 |
| Cardio sessions by sport | run 48,384 | run 780, bike 90, swim 90 |

- **Card counts do not move with experience or equipment** on the lattice: median 3 and max 9 in every segment.
  Hypertrophy runs one card longer at the median than prevention support (4 against 3).
- **The tallest card is the cool down's five moves.** Every round and block holds three movements or fewer.
- **Lift first is real off the race plans:** 399 of the other set's 942 cardio and lift days put the lift first
  (`_liftFirst`: neither an event path nor a support focus). Every lattice day is a race plan, so all of them run first.

## Where a hinge lands (for coach's read-ahead ruling)

A hinge is any movement matching deadlift, RDL, Romanian, good morning, swing, pull-through or single-leg deadlift.

| | Lattice | Other goals |
|---|---|---|
| Hinge movements | 15,746 | 610 |
| On card 1, 2, 3, 4 | 8,165 · 4,565 · 2,998 · 18 | 304 · 69 · 206 · 31 |
| As the Main card / a single non-main lift / inside a round | 6,504 · 2,498 · 6,744 | 228 · 102 · 280 |
| On card 4 or later | 18 (0.1%), every one after a lower body card | 31 (5.1%), 10 with no lower body card before |
| Not the Main card and no lower body card before it | 2,253 (14.3%) | 105 (17.2%) |

The 2,253 lattice cases sit almost all on card 1 or 2: a Kettlebell single-leg deadlift opening a Full Body round (234),
a Sumo or Barbell Romanian deadlift as the first single lift of a Posterior Chain or Pull day (216 each), a Kettlebell
swing in a Full Body Support round. Only a Main card carries the "ramp up with two or three warmup sets" cue
(`deck-data.ts`, `mainRx`); these do not.

## Seams the build plugs into

- Start session on the hero calls `openDayKey` (`js/week-view-sections.ts:231`), which opens the day sheet
  (`openDetail`, `js/day-detail.ts:117`). The iOS app hosts the day as the Angular `ia-day-detail`
  (`frontends/app/src/app/screens/day-detail/`, 18 files, 91 KB) inside `#detailOverlay`
  (`frontends/app/src/app/legacy/legacy-host.ts:57`). This Week also has an Angular screen
  (`frontends/app/src/app/screens/week-view/`).
- A session writes `ia_logs_` (the cardio and session logs), `ia_exw_` (set weights, through `exStoreKey()`) and
  `ia_hist_` (what the athlete saw). The deck writes the same stores (P-DECK, "What the build reuses").

## Not measured

- Session time per deck, and whether a long deck (8 or 9 cards, 9.8% of lattice decks) needs a way to jump ahead
  beyond the session map.
- Injury-overlay days beyond the lattice's eight injury states, and travel weeks.
- What the deck shows a program whose lift comes first when the hero's run card sits above it (the redesign's two cards
  in `_liftFirst` order).
