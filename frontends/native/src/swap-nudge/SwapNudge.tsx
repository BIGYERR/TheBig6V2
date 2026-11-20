// The coach's swap nudge in the Expo app (MIGRATION.md phase 3, the deck's fourth session): the card today's app
// raises 1.4 s after the third pick running of one pair (overlays.html #swapNudgeOverlay, the Angular SwapNudge,
// detail-sheet.css with look.css and motion.css). Its two paragraphs are today's model's (swap-nudge-model.ts, a copy
// held to the byte); its two answers are the deck's writes (deck-writes.ts acceptNudge and dismissNudge). This file
// only draws it, and writes nothing.
//
// The card comes in as the pop-up does, from nine tenths over 280 ms, the scrim over 220, both still under Reduce
// Motion. A tap on the scrim does nothing, as today's: the card is answered by one of its two buttons.
import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { DISPLAY, type Palette, TEXT } from '../theme';
import type { NudgeText } from './swap-nudge-model';

export function SwapNudge({ palette: p, text, calm, onYes, onNo }: { palette: Palette; text: NudgeText; calm: boolean; onYes: () => void; onNo: () => void }) {
  const shown = useRef(new Animated.Value(calm ? 1 : 0)).current;
  const card = useRef(new Animated.Value(calm ? 1 : 0)).current;
  useEffect(() => {
    if (calm) return;
    Animated.timing(shown, { toValue: 1, duration: 220, easing: Easing.bezier(0.25, 0.1, 0.25, 1), useNativeDriver: true }).start();
    Animated.timing(card, { toValue: 1, duration: 280, easing: Easing.bezier(0.34, 1.56, 0.64, 1), useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <View testID="nudge-overlay" accessibilityViewIsModal style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, s.scrim, { opacity: shown }]} />
      <View style={s.center}>
        <Animated.View testID="nudge-card" style={[s.card, { backgroundColor: p.surface, opacity: card.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <Text style={[s.head, { color: p.signal }]}>Noticed something</Text>
          <Text testID="nudge-body" style={[s.body, { color: p.text }]}>{text.noticed + '\n\n' + text.offer}</Text>
          <Pressable testID="nudge-yes" accessibilityRole="button" onPress={onYes} style={({ pressed }) => [s.yes, { backgroundColor: p.accent }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[s.yesText, { color: p.onInk }]}>Make the change</Text>
          </Pressable>
          <Pressable testID="nudge-no" accessibilityRole="button" onPress={onNo} style={({ pressed }) => [s.no, { borderColor: p.border2 }, pressed && { transform: [{ scale: 0.97 }] }]}>
            <Text style={[s.noText, { color: p.muted }]}>Leave the plan alone</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.78)' },
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 340, borderRadius: 24, padding: 20 },
  head: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  body: { fontFamily: TEXT, fontSize: 14, lineHeight: 21.7, marginBottom: 16 },
  yes: { borderRadius: 999, padding: 13, alignItems: 'center', marginBottom: 8 },
  yesText: { fontFamily: DISPLAY, fontSize: 14, fontWeight: '700' },
  no: { borderRadius: 999, borderWidth: 1, padding: 11, alignItems: 'center' },
  noText: { fontFamily: DISPLAY, fontSize: 13, fontWeight: '700' },
});
