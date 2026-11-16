# The Expo deck's pager and opening on the simulator: what the recorded frames showed

Read 2026-11-15, iPhone 17 Pro, iOS 26.5, the Release build under Hermes (`npm run sim-ios`), a copy of Mario's
backup in the app's store, Thursday of week 13 (Leg Strength + Mobility, three cards). Each motion was recorded
with `xcrun simctl io booted recordVideo`, cut into frames at 60 a second, and each frame compared with the one
before it. A strip below has one mark a frame: `.` the same picture as the frame before, a digit for how much it
changed (1 a little, 9 a lot). A lone mark about once a second is the clock in the Dynamic Island.

Nothing was logged or marked: every card pressed was already logged, and Mark the day done was not pressed.

## The slide (a pull up of 220 points, held a quarter second, then let go)

```
1..4...1311........66655544443332211.41.................
```

- 17 frames of motion, slowing to rest (290 ms is 17.4 frames), one still frame, then the big button's words change.
- No frame shows the card that left back in its place, and none is blank.

## The opening (Start session on Thursday's card)

First build (a stage set at each step, the lift counted from the moment the screen was asked for):

- The copy of the card stood 17 frames with no lift: no growth, no lighter fill, no scrim. Then the frame was
  already most of the way open.

Second build (the deck drawn once, the lift counted from the frame's layout):

```
1111.322111111..216222..2222322221111111......
```

- About 42 frames of motion (700 ms; the lift and the open are 588 ms, after the two frames drawn first).
- In the frames: the copy without its button; then the card larger and lighter with This Week dimmer; then the
  frame opening; about four frames of the ground alone with the copy fading; then the deck fading in and growing.

## Done, next one (the done motion), and a stall the recordings cannot place

| Recording | Deck | How the tap was sent | Build | What the strip shows |
|---|---|---|---|---|
| done1 | up and down | tap | first (the card moved by a value of its own) | motion, 10 still frames 18 points short of the end, then the end |
| done2 | up and down | tap | first | motion, 12 still frames, then the end |
| done3 | up and down | tap | second (the card rides the page; one redraw as it leaves) | motion, 15 still frames 80 points short, then the end |
| done4 | sideways | tap | the sideways motion IA Next build 114 has | 28 frames of motion, 14 still, 18 more of motion |
| done5 | up and down | tap | third (nothing drawn again between the tap and the end) | 28 frames speeding up, 17 still, then the end |
| done6 | up and down | a touch path of 40 ms | third | the lift, 15 still frames, then 28 frames slowing to rest |

```
done4  642 2111111112333333322211111.....2........321112111111111111
done5  311.112233344444555555555555.......6.........51111
done6  3332211.....2.......6.5555555444444333333333322222......3
```

- Every recording of the done motion holds still for 10 to 17 frames (170 to 280 ms) somewhere inside it: the
  sideways motion build 114 already has, and all three builds of the up and down one.
- The stall is not at one place in the motion. Sent as a tap, the last part is missing; sent as a touch path, the
  first part is missing and the last 28 frames slow to rest as the curve says.
- The third build sets no state and draws nothing between the tap and the end, and it stalls the same.
- **Not known:** whether the stall is the app's or the simulator's input and recording. It moves with how the tap
  is sent and not with the code, which points at the instrument. The slide and the opening, begun by a drag's
  release and by a tap, show no such stall. Mario's phone is where the done motion is judged.

## The close (Back)

```
67321111221129
```

- 14 frames of motion, then This Week with its button. In the frames: the deck fades on a dark screen, the frame
  comes down to the card, the copy of the card comes back as This Week clears, and This Week takes over.

## A dot pressed after a slide, up and down (found here, fixed)

- A pull down from Call it brought Foot & ankle in, as it should. The first dot pressed after it lit the first dot
  and left Foot & ankle on the screen: the card handed the top place was not moved there.
- Saying the page's value again after the jump, where it already stood, moved nothing (a build of its own). A pull
  of 40 points let go short did: the first card stood there when it settled. So a card handed a new place moves
  only when a value its place hangs on changes.
- Setting the drag to a thousandth of a point as the cards were drawn moved nothing either (a build of its own).
- The fix: a jump moves the page, and every card keeps the slot it stands on, so the cards in sight are moved by
  the page's value alone, as a slide moves them.

- Seen on the final build: a pull up from Front squat brought Foot & ankle in with the second dot lit; the first
  dot pressed then showed Front squat with the first dot lit. From Call it, the first dot showed Front squat too
  (the nearer way round). Done, next one on Front squat left Foot & ankle in its place. Back closed to This Week
  as it was: Thursday still to start, 2 of 5 done.

## Not seen on the simulator

- A deck of two cards (the card behind rising from the fan's seat on a pull to the right; the other card coming
  from above on a pull down): the copy's two card day, Monday, is marked done, and a deck opens only from Start.
- Done, next one on a card not yet logged, with its glow, and Mark the day done's close with the pop-up after it:
  both write, and nothing was written here.
- A tall card's body scrolling before the pager pages, and a typed load under the keyboard up and down.
- Reduce Motion.

## The double tap

- Two taps sent one after the other turned the deck up and down on the first try and not on the next two: the
  simulator's taps are not reliably inside 320 ms of each other. Three taps in a row turn it once (the third begins
  a pair of its own), and did, each time.
- Up and down: no fan, the dots in a column at the right with the lit one tall, the stage taller by the dots' row.
