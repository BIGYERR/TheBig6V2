# The swipe deck boards

The generator of the "Swipe Deck Concepts" canvas (P-DECK, `docs/decisions/swipe-deck.md`): week 10 of HALF_MANNY as
seven working decks, one per day, built from today's engine. The boards are Claude Design artboards (`.dc.html`), not
app code; they render only on that canvas.

| File | What it is |
|---|---|
| `deck-data.ts` | Boots the app in the test harness (`tests/support/app.ts`), builds HALF_MANNY at seed 76308 with the clock pinned to 2026-11-01, and writes each day's cards, swaps, move lists, run doses and rest card as JSON. |
| `week10.json` | Its output for week 10, Monday to Sunday, saved so the boards rebuild without the engine. |
| `deck.template.html` | One board: the markup and its logic class, with `__TITLE__` and `__DATA__` for the build to fill. |
| `build.mjs` | Writes the seven boards (`AD` Mon, `AE` Tue, `AG` Wed, `AF` Thu, `AH` Fri, `AI` Sat, `AJ` Sun) and runs a smoke test over every card and control. |
| `smoke.mjs` | The run log and rest card checks, values typed by hand from the app's builders. |
| `holes.mjs` | Every `{{hole}}` of a built board resolves on every card, drawer and rest view. |
| `check-i.mjs` | No movement inside a round or block carries the RPE info mark; single lift cards keep it. |

Run from this folder (Node 23 or later; `tests/node_modules` installed):

```
node deck-data.ts week10.json
node build.mjs
node holes.mjs out/project/AE_Week10Tue.dc.html
node check-i.mjs
```

The boards land in `out/project/` (gitignored), or in `$DECK_OUT/project/`. On 2026-11-06 the build from this folder
is what the canvas's Version 74 holds (`build.mjs` also fails if the header line, the done count, the gesture hint or
the switch toast come back). To show a change, publish the boards to the canvas.
