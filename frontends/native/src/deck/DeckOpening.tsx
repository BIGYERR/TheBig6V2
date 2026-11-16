// The swipe deck opening out of the card that started it (D275 P-DECK call 16, Lift first at 420 ms), as today's
// deck.ts open and close play it with grow-motion.ts growFx. The layers, from the back: This Week (the app's, shrunk
// to 96% under the deck), a black scrim, the frame that cuts the deck off at the card's box and opens to the whole
// screen, the deck inside it, and over them a copy of the card (its label, name and summary, without its buttons).
//
// The deck is drawn at the card's place for two frames before anything moves. Then the card lifts (168 ms), then
// opens (420 ms) as the deck fades in. Back and Mark the day done play it back into the card (357 ms), and only then
// does the app take the deck away, and raise the completion pop-up. Under Reduce Motion, or when the card's place is
// not known, the deck opens and closes at once, as before. Every number is grow-motion.ts growPlan.
//
// A part that fades or changes size is handed to the phone to move. The frame's box and the two fills are layout and
// colour, which the phone cannot be handed, so the screen moves those itself. No part passes from a moving value to
// a plain one while it shows: the frame keeps its value open, and the close starts a value of its own from the same
// place (the blank card on IA Next build 109 was a style that did pass so).
//
// The deck is drawn once and not again as the motion goes from stage to stage, and the lift waits for the frame to
// be on the screen, not for the screen's next two frames alone. The first build set a stage at each step, which drew
// the deck again each time, and counted its two frames from the moment the screen was asked for: its lift never
// showed in the simulator's frames. With both changed it shows; which of the two it took was not told apart.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, StyleSheet, View, useWindowDimensions } from 'react-native';

import type { Palette } from '../theme';
import { Card, type DeckFrom } from '../this-week/ThisWeek';
import { Deck } from './Deck';
import { GROW_LAYOUT, GROW_START, GROW_STILL, type GrowPart, type GrowStep, growCurve, growFrames, growPlan } from './grow-motion';

type DeckProps = React.ComponentProps<typeof Deck>;
/** Opening (drawn under the copy, lifting, opening), open, or closing. */
type Stage = 'opening' | 'open' | 'out';
const PARTS: readonly GrowPart[] = ['frame', 'shut', 'scrim', 'week', 'copyFade', 'copyScale', 'copyFill', 'deckFade', 'deckScale'];

/** A colour with no strength, to fade a fill in from: '#242424' as 'rgba(36,36,36,0)'. */
const clear = (hex: string): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',0)'; };

export function DeckOpening({ from, calm, under, onClose, onDone, ...deck }: DeckProps & {
  /** The card on This Week the deck opens out of: where it sits and what it shows. None when its place is not known. */
  from: DeckFrom | null;
  calm: boolean;
  /** This Week's size under the deck, which the app wears on This Week: 1, and 0.96 while the deck is open. */
  under: Animated.Value;
}) {
  const p: Palette = deck.palette;
  const { width: vw, height: vh } = useWindowDimensions();
  // Settled as the deck opens: it either plays the motion or it does not, for as long as it is open.
  const [moves] = useState(!calm && !!from);
  const [stage, setStage] = useState<Stage>(moves ? 'opening' : 'open');
  const stageNow = useRef(stage);
  stageNow.current = stage;
  const v = useRef(Object.fromEntries(PARTS.filter((k) => k !== 'week').map((k) => [k, new Animated.Value((moves ? GROW_START : GROW_STILL)[k])])) as Record<GrowPart, Animated.Value>).current;
  v.week = under;
  const run = (steps: GrowStep[], then: () => void): void => {
    Animated.parallel(steps.map((s) => Animated.timing(v[s.part], {
      toValue: s.to, duration: s.ms, delay: s.delay, easing: Easing.bezier(...growCurve(s.ease)), useNativeDriver: !GROW_LAYOUT.includes(s.part),
    }))).start(then);
  };

  // Drawn first: once the frame is on the screen, two frames, or 64 ms when frames are held back, whichever comes
  // first. Then the lift, then the open.
  const started = useRef(false);
  const waits = useRef<{ frame: number; held: ReturnType<typeof setTimeout> } | null>(null);
  useEffect(() => () => { if (waits.current) { cancelAnimationFrame(waits.current.frame); clearTimeout(waits.current.held); } }, []);
  const drawn = (): void => {
    if (!moves || waits.current) return;
    const plan = growPlan();
    const lift = (): void => {
      if (started.current) return;
      started.current = true;
      run(plan.lift, () => run(plan.open, () => setStage('open')));
    };
    waits.current = { frame: requestAnimationFrame(() => requestAnimationFrame(lift)), held: setTimeout(lift, 64) };
  };

  /** Back and Mark the day done close the same way: the opening played back into the card, then the app's turn. */
  const close = (then: () => void): void => {
    if (stageNow.current !== 'open') return;
    // D285: the deck takes focus off its field as it starts to close, so the keyboard goes with it.
    Keyboard.dismiss();
    if (!moves) {
      then();
      return;
    }
    setStage('out');
    run(growPlan().close, then);
  };

  // The deck, drawn once: what it is handed does not change from stage to stage, and its two ways out go by the
  // close as it stands now.
  const way = useRef({ close, onClose, onDone });
  way.current = { close, onClose, onDone };
  const { palette, store, open, onProgram, onOver, say } = deck;
  const body = useMemo(() => (
    <Deck
      palette={palette} store={store} open={open} onProgram={onProgram} onOver={onOver} say={say}
      onClose={() => way.current.close(way.current.onClose)}
      onDone={(prog, week, dayKey) => way.current.close(() => way.current.onDone(prog, week, dayKey))}
    />
  ), [palette, store, open, onProgram, onOver, say]);
  if (!moves || !from) {
    return <View testID="deck-opening" style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>{body}</View>;
  }

  const f = growFrames(from.box, vw, vh);
  // The frame: by the lift and the open while it opens and while it is open, by the close once it shuts.
  const shut = stage === 'out';
  const at = (card: number, lifted: number, full: number) => (shut
    ? v.shut.interpolate({ inputRange: [0, 1], outputRange: [full, card] })
    : v.frame.interpolate({ inputRange: [0, 1, 2], outputRange: [card, lifted, full] }));
  const fill = shut
    ? v.shut.interpolate({ inputRange: [0, 1], outputRange: [p.bg, p.surface] })
    : v.frame.interpolate({ inputRange: [0, 1, 2], outputRange: [p.surface, p.surface2, p.bg] });
  return (
    <View testID="deck-opening" style={StyleSheet.absoluteFill}>
      <Animated.View testID="deck-scrim" pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: v.scrim }]} />
      <Animated.View testID="deck-frame" onLayout={drawn} style={{ position: 'absolute', overflow: 'hidden', top: at(f.card.t, f.lifted.t, 0), left: at(f.card.l, f.lifted.l, 0), width: at(f.card.w, f.lifted.w, vw), height: at(f.card.h, f.lifted.h, vh), borderRadius: at(f.card.r, f.lifted.r, 0), backgroundColor: fill }}>
        {/* The deck holds still on the screen while the frame moves over it. */}
        <Animated.View style={{ position: 'absolute', top: at(-f.card.t, -f.lifted.t, 0), left: at(-f.card.l, -f.lifted.l, 0), width: vw, height: vh }}>
          <Animated.View pointerEvents={stage === 'open' ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { opacity: v.deckFade, transform: [{ scale: v.deckScale }] }]}>
            {body}
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {stage !== 'open' && (
        <Animated.View testID="deck-ghost" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: from.box.t, left: from.box.l, width: from.box.w, height: from.box.h, borderRadius: 24, overflow: 'hidden', opacity: v.copyFade, transform: [{ scale: v.copyScale }] }}>
          <Animated.View style={{ flex: 1, backgroundColor: v.copyFill.interpolate({ inputRange: [0, 1, 2], outputRange: [clear(p.surface2), p.surface2, p.surface] }) }}>
            <Card k={from.card} p={p} copy />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
