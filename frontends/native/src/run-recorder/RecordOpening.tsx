// Record run (D272 P-RECORDRUN as amended; today's frontends/app/src/app/screens/run-recorder/record-host.ts): the
// Run recorder grown out of the run card with the deck's motion (Amendment 2, P-DECK call 16: drawn at the card
// under a copy of it, the card lifts for 168 ms, opens over 420 ms, closes over 357 ms, and opens and closes at once
// under Reduce Motion or when the card's place is not known). Every way out closes back into the card, and Ran
// without the phone? (D272's open item) opens the run's own hand log once it has closed.
//
// The layers and their motion are the deck's own (deck/DeckOpening.tsx, whose notes say why each part moves as it
// does; deck/grow-motion.ts has every number): This Week shrunk to 96% under it, a black scrim, the frame that cuts
// the recorder off at the card's box and opens to the whole screen, the recorder inside it, and over them a copy of
// the card. The recorder is drawn once and not again as the motion goes from stage to stage.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';

import { GROW_LAYOUT, GROW_START, GROW_STILL, type GrowPart, type GrowStep, growCurve, growFrames, growPlan } from '../deck/grow-motion';
import type { Palette } from '../theme';
import { Card, type DeckFrom } from '../this-week/ThisWeek';
import type { AppGps } from './gps-bridge';
import type { RecordFrom } from './recorder-screen';
import { RunRecorder } from './RunRecorder';

/** Opening (drawn under the copy, lifting, opening), open, or closing. */
type Stage = 'opening' | 'open' | 'out';
const PARTS: readonly GrowPart[] = ['frame', 'shut', 'scrim', 'week', 'copyFade', 'copyScale', 'copyFill', 'deckFade', 'deckScale'];

/** A colour with no strength, to fade a fill in from: '#242424' as 'rgba(36,36,36,0)'. */
const clear = (hex: string): string => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',0)'; };

export function RecordOpening({ palette: p, gps, rec, from, calm, under, onClose }: {
  palette: Palette;
  gps: AppGps;
  /** The run being recorded: its day's words, its workout, and the way to its hand log. */
  rec: RecordFrom;
  /** The run card on This Week the recorder opens out of. None when its place is not known. */
  from: DeckFrom | null;
  calm: boolean;
  /** This Week's size under the recorder, which the app wears on This Week: 1, and 0.96 while it is open. */
  under: Animated.Value;
  /** The recorder has closed into its card: the app takes it away. */
  onClose: () => void;
}) {
  const { width: vw, height: vh } = useWindowDimensions();
  // Settled as the recorder opens: it either plays the motion or it does not, for as long as it is open.
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

  // Drawn first: once the frame is on the screen, two frames, or 64 ms when frames are held back. Then the lift, then the open.
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

  /** Every way out closes the same way: the opening played back into the card, then the app's turn, then what follows. */
  const close = (then?: () => void): void => {
    if (stageNow.current !== 'open') return;
    const done = (): void => { onClose(); if (then) then(); };
    if (!moves) { done(); return; }
    setStage('out');
    run(growPlan().close, done);
  };

  // The recorder, drawn once: its two ways out go by the close as it stands now.
  const way = useRef({ close, rec });
  way.current = { close, rec };
  const heading = useMemo(() => ({ over: rec.over, title: rec.title }), [rec.over, rec.title]);
  const body = useMemo(() => (
    <RunRecorder palette={p} gps={gps} heading={heading} workout={rec.workout}
      onClose={() => way.current.close()}
      onHandLog={() => way.current.close(way.current.rec.handLog)} />
  ), [p, gps, heading, rec.workout]);
  if (!moves || !from) {
    return <View testID="record-opening" style={[StyleSheet.absoluteFill, { backgroundColor: p.bg }]}>{body}</View>;
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
    <View testID="record-opening" style={StyleSheet.absoluteFill}>
      <Animated.View testID="record-scrim" pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: '#000000', opacity: v.scrim }]} />
      <Animated.View testID="record-frame" onLayout={drawn} style={{ position: 'absolute', overflow: 'hidden', top: at(f.card.t, f.lifted.t, 0), left: at(f.card.l, f.lifted.l, 0), width: at(f.card.w, f.lifted.w, vw), height: at(f.card.h, f.lifted.h, vh), borderRadius: at(f.card.r, f.lifted.r, 0), backgroundColor: fill }}>
        {/* The recorder holds still on the screen while the frame moves over it. */}
        <Animated.View style={{ position: 'absolute', top: at(-f.card.t, -f.lifted.t, 0), left: at(-f.card.l, -f.lifted.l, 0), width: vw, height: vh }}>
          <Animated.View pointerEvents={stage === 'open' ? 'auto' : 'none'} style={[StyleSheet.absoluteFill, { opacity: v.deckFade, transform: [{ scale: v.deckScale }] }]}>
            {body}
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {stage !== 'open' && (
        <Animated.View testID="record-ghost" pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: from.box.t, left: from.box.l, width: from.box.w, height: from.box.h, borderRadius: 24, overflow: 'hidden', opacity: v.copyFade, transform: [{ scale: v.copyScale }] }}>
          <Animated.View style={{ flex: 1, backgroundColor: v.copyFill.interpolate({ inputRange: [0, 1, 2], outputRange: [clear(p.surface2), p.surface2, p.surface] }) }}>
            <Card k={from.card} p={p} copy />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}
