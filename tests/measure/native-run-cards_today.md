# Today's run cards, before the Expo app draws them

Measured 2026-11-18 by `tests/measure/native-run-cards_today.ts` on the working tree. 40 screens of the ten programs (1 week of runs; 2 weeks of runs; 3 weeks of runs; standard history), each held equal to today's page by the walker before it is read. 62 run cards drawn.

## A. Which card each walk draws

| card | 1 week of runs | 2 weeks of runs | 3 weeks of runs | standard history | all |
|---|---:|---:|---:|---:|---:|
| Long Run Ladder | 0 | 8 | 8 | 8 | 24 |
| Is Your Easy Actually Easy? | 0 | 0 | 4 | 0 | 4 |
| Is Your Easy Actually Easy? (the easy bands) | 0 | 3 | 1 | 0 | 4 |
| Recovery Pace — Easy-Effort Trend | 0 | 3 | 4 | 0 | 7 |
| Same Effort, More Speed | 0 | 0 | 1 | 0 | 1 |
| Same Effort, More Speed (its empty state) | 6 | 3 | 1 | 0 | 10 |
| Where This Is Heading | 0 | 0 | 1 | 0 | 1 |
| Mileage — Drift From Plan | 0 | 5 | 6 | 0 | 11 |

Kinds outside the eight: none.

Distinct specs per kind (as JSON): Long Run Ladder 20; Is Your Easy Actually Easy? 4; Is Your Easy Actually Easy? (the easy bands) 2; Recovery Pace — Easy-Effort Trend 7; Same Effort, More Speed 1; Same Effort, More Speed (its empty state) 3; Where This Is Heading 1; Mileage — Drift From Plan 11.

Programs that draw each kind: Long Run Ladder 8 of 10; Is Your Easy Actually Easy? 4 of 10; Is Your Easy Actually Easy? (the easy bands) 4 of 10; Recovery Pace — Easy-Effort Trend 4 of 10; Same Effort, More Speed 1 of 10; Same Effort, More Speed (its empty state) 6 of 10; Where This Is Heading 1 of 10; Mileage — Drift From Plan 6 of 10.

The parts a card holds, per kind (cards with a head / an svg / a body / a footer, the title gap, the card's colour):

| card | cards | head | svg | body | foot | title gap | colour |
|---|---:|---:|---:|---:|---:|---|---|
| Long Run Ladder | 24 | 0 | 24 | 0 | 24 | 12 | `var(--run)` |
| Is Your Easy Actually Easy? | 4 | 4 | 4 | 0 | 4 | 12 | `var(--red)`, `var(--run)` |
| Is Your Easy Actually Easy? (the easy bands) | 4 | 4 | 4 | 0 | 4 | 12 | `var(--run)` |
| Recovery Pace — Easy-Effort Trend | 7 | 0 | 7 | 0 | 0 | 10 | `var(--run)` |
| Same Effort, More Speed | 1 | 0 | 1 | 0 | 1 | 12 | `var(--run)` |
| Same Effort, More Speed (its empty state) | 10 | 0 | 0 | 10 | 0 | 12 | `var(--muted)` |
| Where This Is Heading | 1 | 1 | 1 | 0 | 1 | 12 | `var(--hip)` |
| Mileage — Drift From Plan | 11 | 0 | 11 | 0 | 11 | 12 | `var(--run)` |

## B. The markup

### title (62 of 62 cards; 0 hold a tag; 62 open with an icon, 2 distinct)

- no tag
- nesting: none
- entities: none
- characters outside ASCII: — (U+2014) 18

### head (9 of 62 cards; 9 hold a tag)

- 8 × <div> `font-size:12px;color:var(--muted);line-height:1.5;margin-bottom:12px`
- 5 × <div> `font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--run);line-height:1.15;margin-bottom:4px`
- 3 × <div> `font-family:var(--font-display);font-size:24px;font-weight:700;letter-spacing:-0.02em;color:var(--red);line-height:1.15;margin-bottom:4px`
- 1 × <div> `font-family:var(--font-display);font-size:26px;font-weight:700;letter-spacing:-0.02em;color:var(--hip);line-height:1.1`
- 1 × <div> `font-size:11px;color:var(--muted);margin-bottom:12px`
- nesting: div 18
- entities: none
- characters outside ASCII: — (U+2014) 8; – (U+2013) 1

### body (10 of 62 cards; 10 hold a tag)

- 20 × <b> `color:var(--text)`
- 10 × <div> `font-size:12px;color:var(--muted);line-height:1.6`
- nesting: div > b 20; div 10
- entities: none
- characters outside ASCII: – (U+2013) 10; — (U+2014) 10

### foot (45 of 62 cards; 36 hold a tag)

- 46 × <b> `color:var(--run)`
- 12 × <b> (no style)
- 7 × <b> `color:var(--text)`
- nesting: b 65
- entities: none
- characters outside ASCII: — (U+2014) 24; · (U+00B7) 11; ’ (U+2019) 5; → (U+2192) 2; – (U+2013) 1

Every inline style property in head, body and foot, with its values:

- `color`: `var(--run)` 51; `var(--text)` 27; `var(--muted)` 19; `var(--red)` 3; `var(--hip)` 1
- `font-family`: `var(--font-display)` 9
- `font-size`: `12px` 18; `24px` 8; `11px` 1; `26px` 1
- `font-weight`: `700` 9
- `letter-spacing`: `-0.02em` 9
- `line-height`: `1.6` 10; `1.15` 8; `1.5` 8; `1.1` 1
- `margin-bottom`: `12px` 9; `4px` 8

What `markupParts` (the titles' and footers' reader so far) makes of these: it strips every tag, so a `<b>` loses its weight and colour and two `<div>`s run together with nothing between them.

## C. The SVG

1068 elements in 52 pictures. The viewBoxes: 320 × 152 (24); 320 × 128 (11); 320 × 132 (7); 320 × 108 (4); 320 × 150 (4); 320 × 136 (1); 320 × 146 (1). Every picture is laid `width:100%;height:auto;overflow:visible`.

| element | count | SvgPicture.tsx draws it | its attributes (count) |
|---|---:|---|---|
| text | 502 | yes | fill 502, font-size 502, text-anchor 502, x 502, y 502, font-family 481, font-weight 43, opacity 7 |
| rect | 311 | yes | fill 311, height 311, width 311, x 311, y 311, stroke 200, stroke-dasharray 200, stroke-width 200, opacity 111, rx 8 |
| line | 178 | yes | stroke 178, stroke-width 178, x1 178, x2 178, y1 178, y2 178, stroke-dasharray 27, opacity 15 |
| circle | 68 | yes | cx 68, cy 68, fill 68, r 68, opacity 51 |
| path | 8 | yes | d 8, fill 8, stroke 8, stroke-dasharray 8, stroke-width 8, opacity 2 |
| polygon | 1 | yes | fill 1, opacity 1, points 1 |

Attribute names: 23. paint.ts renames `font-family`, `font-size`, `font-weight`, `stroke-dasharray`, `stroke-width`, `text-anchor`; the rest carry react-native-svg's own spelling (`cx`, `cy`, `d`, `fill`, `height`, `opacity`, `points`, `r`, `rx`, `stroke`, `width`, `x`, `x1`, `x2`, `y`, `y1`, `y2`). Names still dashed after `svgProps`: none.

The values of the attributes that are not a position or a size:

- `font-family`: `Helvetica Neue,Helvetica,Geist,sans-serif` 481
- `font-size`: `8` 467; `7` 20; `9` 8; `7.5` 7
- `font-weight`: `700` 43
- `opacity`: `0.62` 40; `0.85` 34; `0.9` 27; `0.95` 24; `0.16` 21; `0.07` 8; `0.55` 8; `0.82` 8; `0.09` 4; `0.7` 4; `0.75` 4; `0.15` 3; `0.13` 1; `0.6` 1
- `r`: `4` 24; `7.5` 21; `3.5` 17; `3.2` 3; `7` 3
- `rx`: `1` 8
- `stroke-dasharray`: `2,2` 200; `4,3` 17; `2,4` 7; `1,3` 6; `2,3` 3; `3,3` 2
- `stroke-width`: `1` 350; `1.2` 28; `1.5` 8
- `text-anchor`: `middle` 304; `end` 189; `start` 9

Paints (fill and stroke), and what `paint` makes of each by day and by night:

| as the page writes it | count | day | night | a token of the palette |
|---|---:|---|---|---|
| `rgba(var(--ink-rgb),0.3)` | 386 | rgba(17,17,17,0.3) | rgba(255,255,255,0.3) | yes |
| `none` | 208 | none | none | none |
| `var(--border)` | 200 | #E3E3DF | #262626 | yes |
| `var(--run)` | 182 | #5e8c54 | #86B27A | yes |
| `rgba(var(--ink-rgb),0.06)` | 140 | rgba(17,17,17,0.06) | rgba(255,255,255,0.06) | yes |
| `rgba(var(--ink-rgb),0.35)` | 48 | rgba(17,17,17,0.35) | rgba(255,255,255,0.35) | yes |
| `var(--red)` | 44 | #9e3328 | #D9665A | yes |
| `var(--signal)` | 24 | #CF4E1A | #E2622B | yes |
| `var(--muted)` | 12 | #6E6E6A | #A3A3A3 | yes |
| `var(--border2)` | 11 | #CFCFCA | #3C3C3C | yes |
| `var(--lift)` | 8 | #bc6a43 | #D98A63 | yes |
| `rgba(var(--ink-rgb),0.45)` | 7 | rgba(17,17,17,0.45) | rgba(255,255,255,0.45) | yes |
| `var(--hip)` | 5 | #7e5e96 | #AB8CC4 | yes |
| `var(--text)` | 1 | #111111 | #FFFFFF | yes |

The card's own colour (its title): `var(--muted)` (yes), `var(--run)` (yes), `var(--red)` (yes), `var(--hip)` (yes).
Colours named in the markup: `var(--muted)` (yes), `var(--text)` (yes), `var(--run)` (yes), `var(--red)` (yes), `var(--hip)` (yes).

Text: 502 elements; 21 name no font-family (the page gives them the body's face; `svgProps` sets the app's face only where one is named); 0 name no fill. Characters outside ASCII in a picture's text: — (U+2014) 12; · (U+00B7) 7; ← (U+2190) 4; → (U+2192) 4; ↑ (U+2191) 1. Paths with an empty `d`: 0.

## D. Outside the viewBox

- 11 × Mileage — Drift From Plan, text (width guessed), by up to 11.0 units

The furthest: 11.0 units (half-manny (Mario, NRC half, crossfit), 2 weeks of runs, text "as written").

