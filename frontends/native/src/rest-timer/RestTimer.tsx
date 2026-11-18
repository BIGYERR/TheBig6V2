// The floating rest timer in the Expo app (MIGRATION.md phase 3, row 3; no Live Activity yet, which is phase 4's): the
// Angular RestTimer component (rest-timer.ts), element for element, over today's own model (rest-timer-model.ts): a
// tab on the screen's edge showing the time, a card behind it with the readout, Start or Stop and Reset, and a drag
// that docks it to the nearer edge (V239 D235). It floats over This Week, Bugs, the deck and the day's sheet while a
// program is active. Its clock is rest-clock.ts. Not here yet: the first program's opening motion, which plays after
// the wizard generates a program, and comes with the wizard.
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { DISPLAY, type Palette } from '../theme';
import type { RestClock } from './rest-clock';
import { DRAG_THRESHOLD, type RtSide, clockFace, dragPosition, sideStyles, snapSide } from './rest-timer-model';

/** Where the timer stands before it is ever dragged, in points from the top (the page's #rtAnchor). */
const TOP = 200;
/** How often a running clock is drawn again, in milliseconds (the page's 33 ms interval). */
const TICK_MS = 33;

export function RestTimer({ palette: p, clock }: { palette: Palette; clock: RestClock }) {
  const s = styles;
  const { width, height } = useWindowDimensions();
  const [, setTick] = useState(0);
  const [side, setSide] = useState<RtSide>('right');
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(TOP);
  /** Where a drag holds the timer, from the left edge; null when it is docked. */
  const [left, setLeft] = useState<number | null>(null);
  const size = useRef({ w: 0, h: 0 });

  // The readout is drawn again on every change, and every 33 ms while the clock runs.
  useEffect(() => clock.listen(() => setTick((n) => n + 1)), [clock]);
  const running = clock.watch.running;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  // ── The drag (rest-timer.ts down, move, up, cancel): past 5 points either way it follows the finger; let go, it docks ──
  const at = useRef({ top, side, open });
  at.current = { top, side, open };
  const dragOf = (isTab: boolean) => {
    let startTop = 0, moved = false, x: number | null = null;
    const end = (tap: boolean): void => {
      if (moved) {
        // The side the timer's centre is on, read from where the drag left it.
        if (x !== null) setSide(snapSide(x, size.current.w, width));
        setLeft(null);
        return;
      }
      if (tap && isTab) setOpen(true);
    };
    return PanResponder.create({
      // The tab takes every touch (a tap opens the card). The card takes a touch only once it moves, so its buttons press.
      onStartShouldSetPanResponder: () => isTab,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD,
      onPanResponderGrant: () => { startTop = at.current.top; moved = false; x = null; },
      onPanResponderMove: (_e, g) => {
        if (Math.abs(g.dx) > DRAG_THRESHOLD || Math.abs(g.dy) > DRAG_THRESHOLD) moved = true;
        if (!moved) return;
        const pos = dragPosition({ startTop, dy: g.dy, clientX: g.moveX }, { innerHeight: height, anchorHeight: size.current.h, anchorWidth: size.current.w, frameLeft: 0, frameWidth: width });
        x = pos.left;
        setTop(pos.top);
        setLeft(pos.left);
      },
      onPanResponderRelease: () => end(true),
      onPanResponderTerminate: () => end(false),
    });
  };
  // Made once: each reads the timer's place through `at`, and the window's size as it was drawn with.
  const tabDrag = useRef(dragOf(true)).current;
  const cardDrag = useRef(dragOf(false)).current;

  const face = clockFace(clock.watch.now());
  const st = sideStyles(side);
  const right = side === 'right';
  const edge = (wide: number, r: number) => (right
    ? { borderTopLeftRadius: r, borderBottomLeftRadius: r, borderLeftWidth: wide, borderRightWidth: 0 }
    : { borderTopRightRadius: r, borderBottomRightRadius: r, borderRightWidth: wide, borderLeftWidth: 0 });

  return (
    <View testID="rest-timer" pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
        style={[s.anchor, { top }, left !== null ? { left } : right ? { right: 0 } : { left: 0 }]}
      >
        {!open ? (
          <View testID="rest-tab" accessibilityRole="button" accessibilityLabel="Rest timer, tap to open" {...tabDrag.panHandlers}
            style={[s.tab, edge(1.5, 14), { backgroundColor: p.band, borderColor: p.signal }]}>
            <Text style={[s.chev, { color: p.onBand }]}>{st.chevron}</Text>
            <View testID="rest-mini" style={s.mini}>
              {face.main.split('').map((ch, i) => <Text key={i} style={[s.miniChar, { color: running ? p.signal : p.border2 }, ch === ':' && s.miniColon]}>{ch}</Text>)}
            </View>
          </View>
        ) : (
          <View testID="rest-card" {...cardDrag.panHandlers} style={[s.card, edge(2, 12), { backgroundColor: p.surface, borderColor: p.signal }]}>
            <View style={s.head}>
              <Text style={[s.cap, { color: p.muted }]}>Rest Timer</Text>
              <Pressable testID="rest-fold" accessibilityRole="button" accessibilityLabel="Minimize" hitSlop={10} onPress={() => setOpen(false)}><Text style={[s.fold, { color: p.muted }]}>›</Text></Pressable>
            </View>
            <View style={s.readout}>
              <Text testID="rest-big" style={[s.big, { color: p.text }]}>{face.main}</Text>
              <Text testID="rest-cs" style={[s.cs, { color: p.text }]}>{face.cs}</Text>
            </View>
            <View style={s.actions}>
              <Pressable testID="rest-toggle" accessibilityRole="button" onPress={() => clock.toggle()}
                style={[s.btn, running ? { borderWidth: 2, borderColor: p.signal, paddingVertical: 7 } : { backgroundColor: p.signal }]}>
                <Text style={[s.btnText, { color: running ? p.signal : p.onSignal }]}>{running ? 'Stop' : 'Start'}</Text>
              </Pressable>
              <Pressable testID="rest-reset" accessibilityRole="button" onPress={() => clock.reset()} style={[s.reset, { backgroundColor: p.surface2, borderColor: p.border2 }]}>
                <Text style={[s.btnText, { color: p.muted }]}>Reset</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: { position: 'absolute' },
  tab: { alignItems: 'center', gap: 4, paddingTop: 10, paddingBottom: 11, paddingHorizontal: 8 },
  chev: { fontSize: 13, lineHeight: 13, fontWeight: '700' },
  mini: { alignItems: 'center' },
  miniChar: { fontFamily: 'Menlo', fontSize: 13, lineHeight: 13 * 1.05, fontWeight: '700', fontVariant: ['tabular-nums'] },
  miniColon: { opacity: 0.7 },
  card: { width: 196, paddingTop: 13, paddingHorizontal: 14, paddingBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cap: { fontFamily: DISPLAY, fontSize: 11, fontWeight: '700' },
  fold: { fontSize: 18, lineHeight: 18, paddingHorizontal: 4 },
  readout: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 8, marginBottom: 11 },
  big: { fontFamily: 'Menlo', fontSize: 28, fontWeight: '700', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  cs: { fontFamily: 'Menlo', fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'], opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, alignItems: 'center', paddingVertical: 9, paddingHorizontal: 6, borderRadius: 999 },
  reset: { alignItems: 'center', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1 },
  btnText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
});
