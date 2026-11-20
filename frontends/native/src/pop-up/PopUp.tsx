// The pop-up in the Expo app (MIGRATION.md phase 3, the deck's fourth session): the card today's app raises over a
// closed day, a streak, the season and the day-after reminder (popups.html, the Angular PopUp, detail-sheet.css with
// look.css and motion.css). What it shows is today's model's (pop-up-model.ts, a copy held to the byte) over
// pop-ups.ts; this file only draws it. The sizes, weights, gaps and colours are today's computed styles at 402 wide.
//
// The card comes in from nine tenths over 280 ms with a little overshoot and the scrim fades in over 220
// (motion.css, which wins over detail-sheet.css's own popIn and its shake, so today's season card does not shake and
// this one does not either); both are still under Reduce Motion, as today's are. The icon bounces in and the
// confetti falls whatever the setting, as today's do. An icon the app draws (the reminder's notebook) takes the
// screen's text colour, as today's inherits it, which by day is the card's own ground. A tap on the scrim closes the
// card without an answer (popDismissBg); a tap on the card stays on the card.
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, SvgXml } from 'react-native-svg';

import { asyIcon } from '@ia/core/engine/icons.ts';

import { DISPLAY, type Palette, TEXT } from '../theme';
import { type ConfettiPiece, type PopView, confetti } from './pop-up-model';
import { POP_KNICKS, labelParts } from './pop-ups';

/** White on the card at an alpha (rgba(var(--on-band-rgb), a)). */
const on = (a: number): string => 'rgba(255,255,255,' + a + ')';

export function PopUp({ palette: p, view, calm, onAct, onClose }: { palette: Palette; view: PopView; calm: boolean; onAct: (index: number) => void; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const shown = useRef(new Animated.Value(calm ? 1 : 0)).current;
  const card = useRef(new Animated.Value(calm ? 1 : 0)).current;
  const icon = useRef(new Animated.Value(0)).current;
  const pieces = useMemo(() => confetti(view.confetti, Math.random, POP_KNICKS), [view]);
  useEffect(() => {
    if (!calm) {
      Animated.timing(shown, { toValue: 1, duration: 220, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start();
      Animated.timing(card, { toValue: 1, duration: 280, easing: Easing.bezier(0.34, 1.56, 0.64, 1), useNativeDriver: true }).start();
    }
    Animated.timing(icon, { toValue: 1, duration: 600, delay: 120, easing: Easing.bezier(0.16, 1.4, 0.4, 1), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const triple = view.actionsClass.includes('triple');
  const statNum = Math.max(22, Math.min(30, width * 0.07));
  return (
    <View testID="pop-overlay" accessibilityViewIsModal style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: shown }]}>
        <Pressable testID="pop-scrim" accessibilityLabel="Close" onPress={onClose} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <View pointerEvents="box-none" style={s.center}>
        <Animated.View testID="pop-modal" style={[s.modal, { backgroundColor: p.band, borderColor: on(0.14), opacity: card.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Svg pointerEvents="none" width={220} height={160} style={s.glow}>
            <Defs>
              <RadialGradient id="popGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                <Stop offset={0} stopColor={'rgb(' + p.signalRgb + ')'} stopOpacity={0.3} />
                <Stop offset={0.7} stopColor={'rgb(' + p.signalRgb + ')'} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={220} height={160} fill="url(#popGlow)" />
          </Svg>
          <Animated.View style={[s.icon, { transform: [{ scale: icon }, { rotate: icon.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) }] }]}>
            {view.icon.svg
              ? <SvgXml testID="pop-icon" xml={asyIcon(view.icon.name, 52).replace(/ style="[^"]*"/, '')} color={p.text} width={52} height={52} />
              : <Text testID="pop-icon" style={s.emoji}>{view.icon.name}</Text>}
          </Animated.View>
          <Text testID="pop-kicker" style={[s.kicker, { color: p.signal }]}>{view.kicker}</Text>
          <Text testID="pop-msg" style={[s.msg, { color: p.onBand }]}>{view.msg}</Text>
          {!!view.sub && <Text testID="pop-sub" style={[s.sub, { color: on(0.6) }]}>{view.sub}</Text>}
          {view.stats.length > 0 && (
            <View testID="pop-stats" style={s.stats}>
              {view.stats.map((st, k) => {
                const l = labelParts(st.l);
                return (
                  <View key={k} style={[s.stat, { backgroundColor: on(0.06), borderColor: on(0.12) }]}>
                    <Text style={[s.statNum, { fontSize: statNum, lineHeight: statNum, color: st.cls === 'streak' ? p.signal : p.onBand }]}>{st.n}</Text>
                    <View style={s.statLblRow}>
                      <Text style={[s.statLbl, { color: on(0.5) }]}>{l.text}</Text>
                      {l.svg && <SvgXml xml={l.svg} color={on(0.5)} width={12} height={12} />}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
          <View testID="pop-actions" style={[s.actions, triple && s.actionsRow]}>
            {view.actions.map((a, k) => {
              const go = a.cls === 'go', skip = a.cls === 'skip';
              return (
                <Pressable key={k} testID={'pop-act-' + k} accessibilityRole="button" onPress={() => onAct(k)}
                  style={({ pressed }) => [s.act, triple && s.actTriple, { borderColor: p.border2, backgroundColor: p.surface },
                    go && { backgroundColor: p.signal, borderWidth: 0, boxShadow: '0 10px 28px rgba(' + p.signalRgb + ',0.42)' }, skip && { backgroundColor: 'transparent' }, pressed && { transform: [{ scale: 0.97 }] }]}>
                  <Text style={[s.actText, triple && s.actTextTriple, { color: go ? p.onSignal : skip ? on(0.6) : p.text }]}>{a.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[s.brand, { color: on(0.3) }]}>The Asylum</Text>
        </Animated.View>
      </View>
      {pieces.length > 0 && <Confetti pieces={pieces} width={width} height={height} />}
    </View>
  );
}

/** The confetti (popConfetti, detail-sheet.css popFall): each piece falls the screen's height and a twentieth, turning 640 degrees, and is gone after 3.6 s. */
function Confetti({ pieces, width, height }: { pieces: ConfettiPiece[]; width: number; height: number }) {
  const falls = useRef(pieces.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    pieces.forEach((c, k) => Animated.timing(falls[k]!, { toValue: 1, duration: parseFloat(c.duration) * 1000, delay: parseFloat(c.delay) * 1000, easing: Easing.linear, useNativeDriver: true }).start());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View testID="pop-confetti" pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
      {pieces.map((c, k) => {
        const v = falls[k]!;
        const fall = { opacity: v.interpolate({ inputRange: [0, 0.001, 1], outputRange: [0, 1, 0.9] }), transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height * 1.05] }) }, { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '640deg'] }) }] };
        const left = (parseFloat(c.left) / 100) * width;
        return c.trophy
          ? <Animated.Text key={k} style={[s.piece, fall, { left, width: undefined, height: undefined, fontSize: parseFloat(c.fontSize || '16'), lineHeight: parseFloat(c.fontSize || '16') }]}>🏆</Animated.Text>
          : <Animated.View key={k} style={[s.piece, fall, { left, backgroundColor: c.background }, c.round && { borderRadius: 7 }]} />;
      })}
    </View>
  );
}

const s = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.78)' },
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 16, paddingTop: 32, paddingHorizontal: 26, paddingBottom: 24, alignItems: 'center', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)' },
  glow: { position: 'absolute', top: -60 },
  icon: { marginBottom: 6 },
  emoji: { fontSize: 52, lineHeight: 60 },
  kicker: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', marginBottom: 10, textAlign: 'center' },
  msg: { fontFamily: DISPLAY, fontSize: 25, fontWeight: '700', lineHeight: 28, marginBottom: 14, textAlign: 'center' },
  sub: { fontFamily: TEXT, fontSize: 13, lineHeight: 18.2, marginBottom: 16, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 22, alignSelf: 'stretch' },
  stat: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 8, alignItems: 'center' },
  statNum: { fontFamily: DISPLAY, fontWeight: '700' },
  statLblRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 5 },
  statLbl: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700' },
  actions: { alignSelf: 'stretch', gap: 8 },
  actionsRow: { flexDirection: 'row' },
  act: { padding: 14, borderRadius: 999, borderWidth: 1, alignItems: 'center' },
  actTriple: { flex: 1, paddingVertical: 13, paddingHorizontal: 4 },
  actText: { fontFamily: DISPLAY, fontSize: 16, fontWeight: '700' },
  actTextTriple: { fontSize: 13 },
  brand: { fontFamily: DISPLAY, fontSize: 12, fontWeight: '700', marginTop: 14 },
  piece: { position: 'absolute', top: -12, width: 9, height: 14 },
});
